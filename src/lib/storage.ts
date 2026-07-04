import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { VerificationResult } from "@/lib/verification";

const SEED_PATH = path.join(process.cwd(), "data", "history.json");
const RUNTIME_PATH = path.join(os.tmpdir(), "montrust-history.json");

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

declare global {
  // eslint-disable-next-line no-var
  var __montrustHistoryStore: HistoryStore | undefined;
}

function emptyStore(): HistoryStore {
  return { verifications: [], proofs: [] };
}

function getMemoryStore(): HistoryStore | null {
  return global.__montrustHistoryStore ?? null;
}

function setMemoryStore(store: HistoryStore) {
  global.__montrustHistoryStore = store;
}

async function readJsonFile(filePath: string): Promise<HistoryStore | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as HistoryStore;
  } catch {
    return null;
  }
}

async function loadStore(): Promise<HistoryStore> {
  const cached = getMemoryStore();
  if (cached) return cached;

  const runtime = await readJsonFile(RUNTIME_PATH);
  if (runtime) {
    setMemoryStore(runtime);
    return runtime;
  }

  const seeded = await readJsonFile(SEED_PATH);
  const store = seeded ?? emptyStore();
  setMemoryStore(store);
  return store;
}

async function persistStore(store: HistoryStore): Promise<void> {
  setMemoryStore(store);
  try {
    await fs.writeFile(RUNTIME_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    /* Vercel /var/task is read-only — in-memory persistence is enough for demo */
  }
}

export async function saveVerification(result: VerificationResult) {
  const store = await loadStore();
  store.verifications.unshift(result);
  store.verifications = store.verifications.slice(0, 50);
  await persistStore(store);
}

export async function saveProof(proof: StoredProof) {
  const store = await loadStore();
  store.proofs.unshift(proof);
  store.proofs = store.proofs.slice(0, 50);
  await persistStore(store);
}

export async function getHistory(): Promise<HistoryStore> {
  return loadStore();
}
