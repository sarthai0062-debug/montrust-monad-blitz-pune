import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildTrustReport } from "@/lib/trustReport";
import { DEPLOYED } from "@/lib/constants";

const querySchema = z.object({
  agentId: z.string().optional(),
  proofHash: z.string().optional(),
  endpointUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const params = querySchema.parse({
    agentId: req.nextUrl.searchParams.get("agentId") ?? undefined,
    proofHash: req.nextUrl.searchParams.get("proofHash") ?? undefined,
    endpointUrl: req.nextUrl.searchParams.get("endpointUrl") ?? undefined,
  });

  const origin = req.nextUrl.origin;
  const report = await buildTrustReport({
    agentId: params.agentId ?? DEPLOYED.agentId,
    proofHash: params.proofHash,
    endpointUrl:
      params.endpointUrl ?? `${origin}/api/agent/challenge`,
  });

  return NextResponse.json(report);
}
