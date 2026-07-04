"use client";

export {
  payWithNativeMon,
  getX402PaymentSummary,
} from "@/lib/x402/nativeMonClient";

import { payWithNativeMon, type NativeMonPayOptions } from "@/lib/x402/nativeMonClient";

export type X402FetchOptions = NativeMonPayOptions;

export async function payForVisionAccess(
  options: NativeMonPayOptions = {}
): Promise<Response> {
  return payWithNativeMon("/api/x402/vision", options);
}

export async function payForTrustReportAnalysis(options: {
  agentId: string;
  endpointUrl: string;
  proofHash?: string;
}): Promise<Response> {
  const params = new URLSearchParams({
    agentId: options.agentId,
    endpointUrl: options.endpointUrl,
  });
  if (options.proofHash) params.set("proofHash", options.proofHash);
  return payWithNativeMon(`/api/x402/trust-report?${params.toString()}`, {
    agentId: options.agentId,
    trustProofHash: options.proofHash,
  });
}
