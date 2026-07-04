/**
 * Read-only on-chain verification for MonTrust deployment state.
 */
import { createPublicClient, http, formatEther } from "viem";
import { ERC8004, MONAD_TESTNET, DEFAULT_WALLET } from "../src/lib/constants";
import { identityRegistryAbi } from "../src/abi/identityRegistry";

const WALLET = (process.env.CHECK_WALLET ?? DEFAULT_WALLET) as `0x${string}`;

const client = createPublicClient({
  chain: {
    id: MONAD_TESTNET.chainId,
    name: MONAD_TESTNET.name,
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: [MONAD_TESTNET.rpcUrl] } },
  },
  transport: http(MONAD_TESTNET.rpcUrl),
});

async function main() {
  console.log("=== MonTrust On-Chain Verification ===\n");
  console.log("Wallet:", WALLET);

  const balance = await client.getBalance({ address: WALLET });
  const nonce = await client.getTransactionCount({ address: WALLET });
  console.log("Balance:", formatEther(balance), "MON");
  console.log("Tx count:", nonce);

  // Registry comparison
  for (const [label, addr] of [
    ["Active registry (app)", ERC8004.identityRegistry],
    ["Docs registry", ERC8004.identityRegistryDocs],
  ] as const) {
    const code = await client.getBytecode({ address: addr });
    const size = code ? code.length / 2 - 1 : 0;
    let agent1 = "N/A";
    try {
      await client.readContract({
        address: addr,
        abi: identityRegistryAbi,
        functionName: "ownerOf",
        args: [BigInt(1)],
      });
      agent1 = "exists";
    } catch {
      agent1 = "missing";
    }
    console.log(`\n${label}: ${addr}`);
    console.log(`  Code size: ${size} bytes | Agent #1: ${agent1}`);
  }

  // 8004scan agents
  const res = await fetch(
    `https://8004scan.io/api/v1/public/accounts/${WALLET}/agents`
  );
  const scan = await res.json();
  console.log("\n8004scan agents:", scan.data?.length ?? 0);

  // Local deployment manifest
  try {
    const fs = await import("fs/promises");
    const raw = await fs.readFile("data/deployments.json", "utf8");
    const dep = JSON.parse(raw);
    console.log("\nLocal deployments.json:");
    console.log(JSON.stringify(dep, null, 2));

    if (dep.contracts?.proofAnchor) {
      const code = await client.getBytecode({
        address: dep.contracts.proofAnchor,
      });
      console.log(
        "ProofAnchor code on-chain:",
        code && code.length > 2 ? "YES" : "NO"
      );
    }
  } catch {
    console.log("\nNo data/deployments.json — run npm run deploy:testnet");
  }

  console.log("\n=== Summary ===");
  if (Number(nonce) === 0) {
    console.log("❌ Wallet has never sent a transaction — deploy contracts first");
    console.log("   Run: DEPLOYER_PRIVATE_KEY=0x... npm run deploy:testnet");
  } else {
    console.log("✓ Wallet has on-chain activity");
  }
}

main().catch(console.error);
