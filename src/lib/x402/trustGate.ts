import { buildTrustReport } from "@/lib/trustReport";
import { DEPLOYED } from "@/lib/constants";

export async function isTrustEligibleForSettlement(options: {
  trustProofHash?: string | null;
  agentId?: string | null;
  endpointUrl?: string | null;
  origin?: string;
}): Promise<boolean> {
  const agentId = options.agentId ?? DEPLOYED.agentId;
  const origin = options.origin ?? "http://localhost:3000";
  const endpointUrl =
    options.endpointUrl ?? `${origin}/api/agent/challenge`;

  const report = await buildTrustReport({
    agentId,
    proofHash: options.trustProofHash ?? undefined,
    endpointUrl,
  });

  return report.payWhenItWorks.eligible;
}
