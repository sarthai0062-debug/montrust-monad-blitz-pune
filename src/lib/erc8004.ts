import { publicClient } from "./chain";
import { ERC8004 } from "./constants";
import { identityRegistryAbi } from "@/abi/identityRegistry";
import {
  agentCardSchema,
  extractAgentWallet,
  extractEndpoints,
  type AgentCard,
} from "@/schemas/agentCard";

export interface RegistryAgent {
  agentId: bigint;
  owner: `0x${string}`;
  tokenURI: string;
  agentCard: AgentCard;
  registeredEndpoints: string[];
  agentWallet: string | null;
}

export async function resolveAgentFromRegistry(
  agentId: bigint
): Promise<RegistryAgent | null> {
  try {
    const [owner, tokenURI] = await Promise.all([
      publicClient.readContract({
        address: ERC8004.identityRegistry,
        abi: identityRegistryAbi,
        functionName: "ownerOf",
        args: [agentId],
      }),
      publicClient.readContract({
        address: ERC8004.identityRegistry,
        abi: identityRegistryAbi,
        functionName: "tokenURI",
        args: [agentId],
      }),
    ]);

    const agentCard = await fetchAgentCard(tokenURI);
    if (!agentCard) return null;

    return {
      agentId,
      owner: owner as `0x${string}`,
      tokenURI,
      agentCard,
      registeredEndpoints: extractEndpoints(agentCard),
      agentWallet: extractAgentWallet(agentCard) ?? (owner as string),
    };
  } catch {
    return null;
  }
}

export async function fetchAgentCard(uri: string): Promise<AgentCard | null> {
  try {
    const json = await resolveUriToJson(uri);
    const parsed = agentCardSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function resolveUriToJson(uri: string): Promise<unknown> {
  if (uri.startsWith("data:")) {
    const comma = uri.indexOf(",");
    const header = uri.slice(0, comma);
    const payload = uri.slice(comma + 1);
    if (header.includes("base64")) {
      return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    }
    return JSON.parse(decodeURIComponent(payload));
  }

  if (uri.startsWith("ipfs://")) {
    const cid = uri.replace("ipfs://", "");
    const res = await fetch(`https://ipfs.io/ipfs/${cid}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("IPFS fetch failed");
    return res.json();
  }

  const res = await fetch(uri, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function buildAgentRegistrationUri(
  card: AgentCard,
  _baseUrl: string
): string {
  const registration = {
    ...card,
    registrations: [
      {
        agentId: "PENDING",
        agentRegistry: `eip155:10143:${ERC8004.identityRegistry}`,
      },
    ],
  };
  const json = JSON.stringify(registration);
  const b64 = Buffer.from(json, "utf8").toString("base64");
  return `data:application/json;base64,${b64}`;
}

export function buildMonTrustAgentCard(
  baseUrl: string,
  walletAddress: string
): AgentCard {
  const origin = baseUrl.replace(/\/$/, "");
  return {
    type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
    name: "MonTrust Agent Trust Analyzer",
    description:
      "Analyzes ERC-8004 and OpenClaw agent reports — endpoint verification, spoof detection, link safety, and Pay-When-It-Works x402 settlement on Monad.",
    image: `${origin}/montrust-icon.svg`,
    services: [
      {
        name: "MCP",
        endpoint: `${origin}/api/agent/challenge`,
        version: "2025-06-18",
      },
      {
        name: "trust-report",
        endpoint: `${origin}/api/trust-report`,
        version: "1.0.0",
      },
      {
        name: "x402-trust-report",
        endpoint: `${origin}/api/x402/trust-report`,
        version: "1.0.0",
      },
      {
        name: "agentWallet",
        endpoint: `eip155:10143:${walletAddress}`,
      },
      {
        name: "web",
        endpoint: `${origin}/photo-proof`,
      },
    ],
    active: true,
    supportedTrust: ["reputation", "crypto-economic"],
    x402Support: true,
    walletAddress: walletAddress as `0x${string}`,
  };
}
