import { DEFAULT_TASKS } from "./proof";

/** Demo screenshot prompts for each vulnerability audit task (DALL·E, Midjourney, etc.) */
export const TASK_IMAGE_PROMPTS: Record<
  (typeof DEFAULT_TASKS)[number]["id"],
  { prompt: string; negativePrompt: string }
> = {
  "mcp-exposed-endpoint": {
    prompt:
      "Photorealistic developer laptop screenshot, browser or IDE panel showing an MCP server config with a visible HTTP tool endpoint URL and an exposed API key string, OpenClaw-style agent settings, dark theme terminal, security audit screenshot, sharp readable UI text, 4K",
    negativePrompt:
      "blurry text, cartoon, people faces, unrelated office photo, clean redacted UI",
  },
  "agent-spoof-indicator": {
    prompt:
      "Photorealistic browser screenshot of a fake ERC-8004 agent registration page with suspicious domain openclaw-secure-login.tk, mismatched wallet address and unverified MCP endpoint URL, phishing-style agent card UI, security research screenshot, 4K",
    negativePrompt:
      "legitimate monad explorer, blurry, cartoon, physical whiteboard, facilities photo",
  },
  "credential-leak": {
    prompt:
      "Photorealistic terminal screenshot showing leaked environment variables or a private key beginning with 0x in plain text, npm run output with NVIDIA_API_KEY and DEPLOYER_PRIVATE_KEY visible, red security audit context, monospace font, 4K",
    negativePrompt:
      "redacted secrets, cartoon, outdoor scene, whiteboard, trash bin",
  },
};

export function getTaskImagePrompt(taskId: string) {
  const entry = TASK_IMAGE_PROMPTS[taskId as keyof typeof TASK_IMAGE_PROMPTS];
  if (!entry) return null;
  const task = DEFAULT_TASKS.find((t) => t.id === taskId);
  return {
    taskId,
    question: task?.question,
    ...entry,
  };
}
