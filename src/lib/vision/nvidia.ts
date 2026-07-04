import { visionResultSchema, type VisionResult } from "@/schemas/proof";

const DEFAULT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "minimaxai/minimax-m3";

export interface VisionAnalyzeInput {
  imageBase64: string;
  mimeType: string;
  question: string;
}

export function isNvidiaVisionConfigured(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

export function getNvidiaVisionModel(): string {
  return process.env.NVIDIA_VISION_MODEL ?? DEFAULT_MODEL;
}

function buildSystemPrompt(question: string): string {
  return `You are MonTrust, a security vision agent specializing in agentic AI, MCP (Model Context Protocol), and blockchain agent vulnerabilities.

Analyze the screenshot for this audit question: "${question}"

Focus on evidence visible in the image: MCP endpoints, agent card URLs, ERC-8004 registration details, API keys, tokens, private keys, HTTP vs HTTPS, suspicious domains, spoofed agent UIs, and exposed tool permissions.

Respond with ONLY a single JSON object (no markdown, no extra text) using exactly these keys:
- answer: "yes" if the vulnerability or risk described in the question is clearly present, "no" if the screenshot appears safe for that specific risk, "unclear" if the image is too low quality or ambiguous
- confidence: number between 0 and 1
- reason: brief security finding (one sentence, cite what you see in the screenshot)`;
}

/** Extract JSON object from model text (handles fenced code blocks). */
export function parseVisionJson(content: string): VisionResult {
  const trimmed = content.trim();
  const fenced =
    trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? trimmed;
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON");
  }
  const json = JSON.parse(fenced.slice(start, end + 1));
  return visionResultSchema.parse(json);
}

export async function analyzeWithNvidia(
  input: VisionAnalyzeInput
): Promise<{ result: VisionResult; model: string }> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured");
  }

  const model = getNvidiaVisionModel();
  const url = process.env.NVIDIA_API_URL ?? DEFAULT_URL;
  const imageUrl = `data:${input.mimeType};base64,${input.imageBase64}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildSystemPrompt(input.question) },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: Number(process.env.NVIDIA_MAX_TOKENS ?? 512),
      temperature: Number(process.env.NVIDIA_TEMPERATURE ?? 0.2),
      top_p: Number(process.env.NVIDIA_TOP_P ?? 0.95),
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NVIDIA API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from NVIDIA MiniMax-M3");
  }

  return { result: parseVisionJson(content), model };
}
