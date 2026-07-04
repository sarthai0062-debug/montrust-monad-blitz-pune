import { keccak256, toBytes, type Hex } from "viem";
import type { PhotoProof } from "@/schemas/proof";

export function hashProof(proof: PhotoProof): Hex {
  const canonical = JSON.stringify(proof, Object.keys(proof).sort());
  return keccak256(toBytes(canonical));
}

export function verifyProofIntegrity(
  proof: PhotoProof,
  expectedHash: Hex
): boolean {
  return hashProof(proof) === expectedHash;
}

/** Screenshot-based vulnerability checks for agentic / MCP / security audits */
export const DEFAULT_TASKS = [
  {
    id: "mcp-exposed-endpoint",
    question:
      "Does this screenshot show an exposed or unauthenticated MCP server endpoint, tool URL, or API key that another agent could abuse?",
    category: "MCP Security",
  },
  {
    id: "agent-spoof-indicator",
    question:
      "Does this screenshot indicate a spoofed or impersonated ERC-8004 agent (wrong domain, unregistered endpoint, or mismatched agent card)?",
    category: "Agentic Security",
  },
  {
    id: "credential-leak",
    question:
      "Does this screenshot expose credentials such as private keys, wallet secrets, bearer tokens, or env vars in logs, config, or UI?",
    category: "Security",
  },
] as const;
