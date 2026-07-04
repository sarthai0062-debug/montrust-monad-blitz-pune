"use client";

export {
  payWithNativeMon,
  getX402PaymentSummary,
  type NativeMonPayOptions,
  type NativeMonPaymentResult,
} from "@/lib/x402/nativeMonClient";

import {
  payWithNativeMon,
  type NativeMonPayOptions,
  type NativeMonPaymentResult,
} from "@/lib/x402/nativeMonClient";
import type { TrustReport } from "@/lib/trustReport";

export type X402FetchOptions = NativeMonPayOptions;

export interface PaidTrustReportResponse {
  status: "unlocked";
  mode: "x402-native-mon";
  service: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  report: TrustReport;
}

export async function payForVisionAccess(
  options: NativeMonPayOptions = {}
): Promise<NativeMonPaymentResult> {
  return payWithNativeMon("/api/x402/vision", options);
}

export async function payForTrustReportAnalysis(options: {
  agentId: string;
  endpointUrl: string;
  proofHash?: string;
}): Promise<NativeMonPaymentResult> {
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
