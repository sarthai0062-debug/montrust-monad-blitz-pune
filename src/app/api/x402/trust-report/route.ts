import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildTrustReport } from "@/lib/trustReport";
import {
  X402_CONFIG,
  MONAD_TESTNET_X402,
  TRUST_REPORT_X402_ROUTE,
} from "@/lib/x402/config";
import { withNativeMonPayment } from "@/lib/x402/withNativeMonPayment";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-MON-PAYMENT-TX",
};

const querySchema = z.object({
  agentId: z.string().min(1),
  endpointUrl: z.string().url(),
  proofHash: z.string().optional(),
});

async function handler(request: NextRequest) {
  const params = querySchema.parse({
    agentId: request.nextUrl.searchParams.get("agentId"),
    endpointUrl: request.nextUrl.searchParams.get("endpointUrl"),
    proofHash: request.nextUrl.searchParams.get("proofHash") ?? undefined,
  });

  const report = await buildTrustReport({
    agentId: params.agentId,
    endpointUrl: params.endpointUrl,
    proofHash: params.proofHash,
  });

  return NextResponse.json(
    {
      status: "unlocked",
      mode: "x402-native-mon",
      service: "trust-report-analysis",
      network: MONAD_TESTNET_X402.networkId,
      asset: "MON",
      amount: X402_CONFIG.paymentAmountMon,
      payTo: X402_CONFIG.payTo,
      report,
    },
    { headers: CORS_HEADERS }
  );
}

export const GET = withNativeMonPayment(handler, TRUST_REPORT_X402_ROUTE);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "PAYMENT-SIGNATURE, X-MON-PAYMENT-TX, X-TRUST-PROOF-HASH, X-TRUST-AGENT-ID, Content-Type",
    },
  });
}
