import { NextRequest, NextResponse } from "next/server";
import {
  buildMonPaymentRequiredBody,
  MON_PAYMENT_TX_HEADER,
  verifyNativeMonPayment,
} from "./nativeMonVerify";

type RouteHandler = (
  request: NextRequest
) => Promise<NextResponse> | NextResponse;

const CORS_HEADERS = {
  "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, X-MON-PAYMENT-TX",
};

export function withNativeMonPayment(
  handler: RouteHandler,
  resourcePath: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const txHash =
      request.headers.get(MON_PAYMENT_TX_HEADER) ??
      request.headers.get(MON_PAYMENT_TX_HEADER.toLowerCase());

    if (!txHash) {
      const body = buildMonPaymentRequiredBody(resourcePath);
      return NextResponse.json(body, {
        status: 402,
        headers: {
          ...CORS_HEADERS,
          "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(body)).toString(
            "base64"
          ),
        },
      });
    }

    const verification = await verifyNativeMonPayment(txHash);
    if (!verification.valid) {
      return NextResponse.json(
        {
          error: "payment_invalid",
          reason: verification.reason,
          message: `MON payment verification failed: ${verification.reason}`,
        },
        { status: 402, headers: CORS_HEADERS }
      );
    }

    const response = await handler(request);
    response.headers.set(
      "PAYMENT-RESPONSE",
      Buffer.from(
        JSON.stringify({
          success: true,
          txHash,
          from: verification.from,
          value: verification.value?.toString(),
          asset: "MON",
        })
      ).toString("base64")
    );
    return response;
  };
}
