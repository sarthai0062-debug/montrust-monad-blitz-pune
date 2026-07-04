import { NextRequest, NextResponse } from "next/server";
import { DEPLOYED } from "@/lib/constants";
import { X402_CONFIG, MONAD_TESTNET_X402, VISION_X402_ROUTE } from "@/lib/x402/config";
import { isTrustEligibleForSettlement } from "@/lib/x402/trustGate";
import { withNativeMonPayment } from "@/lib/x402/withNativeMonPayment";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-MON-PAYMENT-TX",
};

async function handler(_request: NextRequest) {
  return NextResponse.json(
    {
      status: "unlocked",
      mode: "x402-native-mon",
      network: MONAD_TESTNET_X402.networkId,
      chainId: MONAD_TESTNET_X402.chainId,
      asset: "MON",
      amount: X402_CONFIG.paymentAmountMon,
      payTo: X402_CONFIG.payTo,
      message:
        "MonTrust vision API access granted. MON settled via MetaMask on Monad Testnet.",
      agentId: DEPLOYED.agentId,
      nextStep: "POST /api/vision with your image payload.",
    },
    { headers: CORS_HEADERS }
  );
}

async function visionWithTrustGate(request: NextRequest): Promise<NextResponse> {
  const trustHash =
    request.headers.get("X-TRUST-PROOF-HASH") ??
    request.headers.get("x-trust-proof-hash");
  const agentId =
    request.headers.get("X-TRUST-AGENT-ID") ??
    request.headers.get("x-trust-agent-id");

  const eligible = await isTrustEligibleForSettlement({
    trustProofHash: trustHash ?? null,
    agentId: agentId ?? null,
    origin: request.headers.get("origin") ?? undefined,
  });

  if (!eligible) {
    return NextResponse.json(
      {
        error: "trust_not_verified",
        message:
          "Pay-When-It-Works: MON payment blocked until trust report passes (anchor proof + agent signature).",
      },
      { status: 402, headers: CORS_HEADERS }
    );
  }

  return handler(request);
}

export const GET = withNativeMonPayment(visionWithTrustGate, VISION_X402_ROUTE);

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
