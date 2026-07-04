import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatEther, isAddress } from "viem";
import { ERC8004, MONAD_TESTNET } from "@/lib/constants";
import { identityRegistryAbi } from "@/abi/identityRegistry";
import { promises as fs } from "fs";
import path from "path";

const monadTestnet = {
  id: MONAD_TESTNET.chainId,
  name: MONAD_TESTNET.name,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [MONAD_TESTNET.rpcUrl] } },
} as const;

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "Valid address query param required" },
      { status: 400 }
    );
  }

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(MONAD_TESTNET.rpcUrl),
  });

  const [balance, nonce] = await Promise.all([
    publicClient.getBalance({ address }),
    publicClient.getTransactionCount({ address }),
  ]);

  let agentsFromScan: unknown[] = [];
  try {
    const res = await fetch(
      `https://8004scan.io/api/v1/public/accounts/${address}/agents`,
      { next: { revalidate: 60 } }
    );
    const json = await res.json();
    agentsFromScan = json.data ?? [];
  } catch {
    /* indexer optional */
  }

  let localDeployment: Record<string, unknown> | null = null;
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "deployments.json"),
      "utf8"
    );
    const dep = JSON.parse(raw);
    if (
      dep.deployer?.toLowerCase() === address.toLowerCase()
    ) {
      localDeployment = dep;
    }
  } catch {
    /* no local manifest */
  }

  let proofAnchorOnChain: {
    address: string;
    codeSize: number;
  } | null = null;

  if (localDeployment?.contracts) {
    const addr = (localDeployment.contracts as { proofAnchor?: string })
      .proofAnchor;
    if (addr && isAddress(addr)) {
      const code = await publicClient.getBytecode({ address: addr });
      proofAnchorOnChain = {
        address: addr,
        codeSize: code ? code.length / 2 - 1 : 0,
      };
    }
  }

  let registeredAgentOnChain: {
    agentId: string;
    owner: string;
    name?: string;
  } | null = null;

  const agentId =
    localDeployment?.agent &&
    typeof (localDeployment.agent as { id?: string }).id === "string"
      ? (localDeployment.agent as { id: string }).id
      : agentsFromScan.length > 0
        ? (agentsFromScan[0] as { token_id?: string }).token_id
        : null;

  if (agentId) {
    try {
      const [owner, tokenURI] = await Promise.all([
        publicClient.readContract({
          address: ERC8004.identityRegistry,
          abi: identityRegistryAbi,
          functionName: "ownerOf",
          args: [BigInt(agentId)],
        }),
        publicClient.readContract({
          address: ERC8004.identityRegistry,
          abi: identityRegistryAbi,
          functionName: "tokenURI",
          args: [BigInt(agentId)],
        }),
      ]);
      if (owner.toLowerCase() === address.toLowerCase()) {
        let name: string | undefined;
        if (tokenURI.startsWith("data:")) {
          const b64 = tokenURI.split(",")[1];
          const json = JSON.parse(Buffer.from(b64, "base64").toString());
          name = json.name;
        }
        registeredAgentOnChain = {
          agentId,
          owner: owner as string,
          name,
        };
      }
    } catch {
      /* agent not found */
    }
  }

  return NextResponse.json({
    address,
    network: MONAD_TESTNET,
    erc8004: {
      identityRegistry: ERC8004.identityRegistry,
      reputationRegistry: ERC8004.reputationRegistry,
      docsNote:
        "Monad docs list 0x8004A169… but live testnet agents use 0x8004A818… (verified via RPC + 8004scan)",
    },
    wallet: {
      balanceMon: formatEther(balance),
      transactionCount: Number(nonce),
      hasDeployedContracts: Number(nonce) > 0,
    },
    agentsIndexed: agentsFromScan,
    localDeployment,
    onChain: {
      proofAnchor: proofAnchorOnChain,
      registeredAgent: registeredAgentOnChain,
    },
    readiness: {
      walletFunded: balance > BigInt(1e16),
      agentRegistered: Boolean(registeredAgentOnChain),
      proofAnchorDeployed: Boolean(
        proofAnchorOnChain && proofAnchorOnChain.codeSize > 100
      ),
      visionApiConfigured: Boolean(process.env.NVIDIA_API_KEY),
    },
  });
}
