import { promises as fs } from "fs";
import path from "path";
import type { VerificationResult } from "@/lib/verification";

const DATA_DIR = path.join(process.cwd(), "data");

export interface StoredProof {
  id: string;
  taskId: string;
  taskQuestion: string;
  proof: Record<string, unknown>;
  proofHash: string;
  txHash?: string;
  agentId?: string;
  anchored: boolean;
  createdAt: string;
}

export interface HistoryStore {
  verifications: VerificationResult[];
  proofs: StoredProof[];
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function storePath() {
  return path.join(DATA_DIR, "history.json");
}

async function readStore(): Promise<HistoryStore> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    return JSON.parse(raw) as HistoryStore;
  } catch {
    return { verifications: [], proofs: [] };
  }
}

async function writeStore(store: HistoryStore) {
  await ensureDataDir();
  await fs.writeFile(storePath(), JSON.stringify(store, null, 2));
}

export async function saveVerification(result: VerificationResult) {
  const store = await readStore();
  store.verifications.unshift(result);
  store.verifications = store.verifications.slice(0, 50);
  await writeStore(store);
}

export async function saveProof(proof: StoredProof) {
  const store = await readStore();
  store.proofs.unshift(proof);
  store.proofs = store.proofs.slice(0, 50);
  await writeStore(store);
}

export async function getHistory(): Promise<HistoryStore> {
  return readStore();
}
