import { z } from "zod";

export const visionResultSchema = z.object({
  answer: z.enum(["yes", "no", "unclear"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

export type VisionResult = z.infer<typeof visionResultSchema>;

export const photoProofSchema = z.object({
  taskId: z.string(),
  taskQuestion: z.string(),
  imageHash: z.string(),
  vision: visionResultSchema,
  agentId: z.string().optional(),
  timestamp: z.string(),
  version: z.literal("1"),
});

export type PhotoProof = z.infer<typeof photoProofSchema>;
