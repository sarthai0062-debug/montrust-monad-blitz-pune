import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeWithNvidia,
  isNvidiaVisionConfigured,
} from "@/lib/vision/nvidia";

const bodySchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().default("image/jpeg"),
  question: z.string().min(1),
});

export async function GET() {
  return NextResponse.json({
    provider: isNvidiaVisionConfigured() ? "nvidia" : "unconfigured",
    model: process.env.NVIDIA_VISION_MODEL ?? "minimaxai/minimax-m3",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    configured: isNvidiaVisionConfigured(),
  });
}

export async function POST(req: NextRequest) {
  if (!isNvidiaVisionConfigured()) {
    return NextResponse.json(
      {
        error:
          "NVIDIA_API_KEY is required. Add it to .env.local (NVIDIA NIM / MiniMax-M3).",
      },
      { status: 503 }
    );
  }

  try {
    const body = bodySchema.parse(await req.json());
    const { result, model } = await analyzeWithNvidia(body);
    return NextResponse.json({
      ...result,
      _meta: { provider: "nvidia", model },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Vision failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
