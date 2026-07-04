import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildChallengeMessage } from "@/lib/verification";
import { signAgentChallengeMessageAsync } from "@/lib/deployerSign";

const bodySchema = z.object({
  nonce: z.string().min(1),
  message: z.string().optional(),
  endpoint: z.string().optional(),
});

/**
 * ERC-8004 agent challenge endpoint.
 * When DEPLOYER_PRIVATE_KEY is set, signs with the registered agent wallet
 * so automated verification and OpenClaw-style clients get a valid response.
 */
export async function POST(req: NextRequest) {
  const body = bodySchema.parse(await req.json());
  const endpoint =
    body.endpoint ??
    `${req.nextUrl.origin}/api/agent/challenge`;
  const message =
    body.message ?? buildChallengeMessage(body.nonce, endpoint);

  const signed = await signAgentChallengeMessageAsync(message);

  if (signed) {
    return NextResponse.json({
      challenge: "sign-message",
      message,
      nonce: body.nonce,
      signature: signed.signature,
      signer: signed.signer,
      instructions:
        "Signed by MonTrust agent wallet. Submit to /api/verify or use in trust report.",
    });
  }

  return NextResponse.json({
    challenge: "sign-message",
    message,
    nonce: body.nonce,
    instructions:
      "Sign this message with the agent wallet registered in your ERC-8004 agent card, then submit signature to /api/verify.",
  });
}

export async function GET() {
  return NextResponse.json({
    name: "MonTrust Agent Challenge",
    version: "1.0.0",
    challengePath: "/challenge",
    method: "POST",
    body: { nonce: "string", message: "optional string" },
    response: { challenge: "sign-message", message: "string to sign" },
  });
}
