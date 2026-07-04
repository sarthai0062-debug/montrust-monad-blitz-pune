import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { photoProofSchema } from "@/schemas/proof";
import { hashProof } from "@/lib/proof";
import { saveProof } from "@/lib/storage";

const bodySchema = z.object({
  proof: z.record(z.string(), z.unknown()),
  txHash: z.string().optional(),
  agentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { proof: raw, txHash, agentId } = bodySchema.parse(await req.json());
    const proof = photoProofSchema.parse(raw);
    const proofHash = hashProof(proof);

    const stored = {
      id: crypto.randomUUID(),
      taskId: proof.taskId,
      taskQuestion: proof.taskQuestion,
      proof: proof as unknown as Record<string, unknown>,
      proofHash,
      txHash,
      agentId,
      anchored: Boolean(txHash),
      createdAt: new Date().toISOString(),
    };

    await saveProof(stored);
    return NextResponse.json({ proofHash, stored });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid proof";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
