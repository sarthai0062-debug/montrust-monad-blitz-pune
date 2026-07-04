import type { AgentCard } from "@/schemas/agentCard";
import { extractEndpoints } from "@/schemas/agentCard";

export interface LinkSafetyFinding {
  id: string;
  severity: "low" | "medium" | "high";
  passed: boolean;
  label: string;
  detail: string;
  url?: string;
}

const SUSPICIOUS_TLDS = new Set([
  ".tk",
  ".ml",
  ".ga",
  ".cf",
  ".gq",
  ".zip",
  ".mov",
]);

const IP_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;

function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (IP_LITERAL.test(h)) {
    const parts = h.split(".").map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  }
  return false;
}

function analyzeUrl(url: string, claimedEndpoint?: string): LinkSafetyFinding[] {
  const findings: LinkSafetyFinding[] = [];

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:") {
      findings.push({
        id: `insecure-protocol-${parsed.hostname}`,
        severity: "medium",
        passed: false,
        label: "Insecure protocol",
        detail: `Endpoint uses ${parsed.protocol} — prefer HTTPS for agent services.`,
        url,
      });
    }

    if (isPrivateOrLocalHost(parsed.hostname)) {
      findings.push({
        id: `private-host-${parsed.hostname}`,
        severity: "high",
        passed: false,
        label: "Private/local endpoint",
        detail: "Registered endpoint resolves to localhost or a private IP — not publicly verifiable.",
        url,
      });
    }

    for (const tld of SUSPICIOUS_TLDS) {
      if (parsed.hostname.endsWith(tld)) {
        findings.push({
          id: `suspicious-tld-${parsed.hostname}`,
          severity: "medium",
          passed: false,
          label: "Suspicious TLD",
          detail: `Domain uses high-abuse TLD ${tld}.`,
          url,
        });
      }
    }

    if (claimedEndpoint) {
      try {
        const claimed = new URL(claimedEndpoint);
        if (
          claimed.hostname !== parsed.hostname &&
          !claimed.hostname.endsWith(`.${parsed.hostname}`) &&
          !parsed.hostname.endsWith(`.${claimed.hostname}`)
        ) {
          findings.push({
            id: `domain-mismatch-${parsed.hostname}`,
            severity: "high",
            passed: false,
            label: "Cross-domain endpoint",
            detail: `Card link host ${parsed.hostname} differs from claimed endpoint ${claimed.hostname}.`,
            url,
          });
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    findings.push({
      id: "malformed-url",
      severity: "high",
      passed: false,
      label: "Malformed URL",
      detail: "Could not parse endpoint URL from agent card.",
      url,
    });
  }

  return findings;
}

export function analyzeAgentCardLinks(
  card: AgentCard,
  claimedEndpoint?: string
): LinkSafetyFinding[] {
  const endpoints = extractEndpoints(card);
  const imageUrl = card.image?.startsWith("http") ? card.image : null;
  const urls = [...endpoints, ...(imageUrl ? [imageUrl] : [])];

  const findings: LinkSafetyFinding[] = [];
  for (const url of urls) {
    findings.push(...analyzeUrl(url, claimedEndpoint));
  }

  if (urls.length === 0) {
    findings.push({
      id: "no-endpoints",
      severity: "medium",
      passed: false,
      label: "No HTTP endpoints",
      detail: "Agent card has no discoverable HTTP/MCP endpoints to verify.",
    });
  }

  const deduped = new Map<string, LinkSafetyFinding>();
  for (const f of findings) {
    deduped.set(f.id, f);
  }
  return [...deduped.values()];
}

export function summarizeLinkSafety(findings: LinkSafetyFinding[]): {
  safe: boolean;
  highRiskCount: number;
  mediumRiskCount: number;
} {
  const highRiskCount = findings.filter((f) => f.severity === "high" && !f.passed).length;
  const mediumRiskCount = findings.filter(
    (f) => f.severity === "medium" && !f.passed
  ).length;
  return {
    safe: highRiskCount === 0,
    highRiskCount,
    mediumRiskCount,
  };
}
