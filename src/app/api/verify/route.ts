import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAgentEndpoint } from "@/lib/verification";
import { saveVerification } from "@/lib/storage";
import type { Hex } from "viem";

const bodySchema = z.object({
  agentId: z.string().min(1),
  endpointUrl: z.string().url(),
  signature: z.string().optional(),
  signer: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const result = await verifyAgentEndpoint(body.agentId, body.endpointUrl, {
      signature: body.signature as Hex | undefined,
      signer: body.signer,
      message: body.message,
    });
    await saveVerification(result);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
