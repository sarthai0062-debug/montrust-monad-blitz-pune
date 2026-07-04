"use client";

import { useState, useRef, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useDeployContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useChainId,
} from "wagmi";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  PageHeader,
  StatusBadge,
  Button,
  Input,
  Label,
  Select,
  SectionTitle,
  StepPill,
} from "@/components/ui";
import { DEFAULT_TASKS, hashProof, verifyProofIntegrity } from "@/lib/proof";
import { getTaskImagePrompt } from "@/lib/taskImagePrompts";
import { photoProofSchema, type PhotoProof, visionResultSchema } from "@/schemas/proof";
import { proofAnchorAbi, proofAnchorBytecode } from "@/abi/proofAnchor";
import { ERC8004, MONAD_TESTNET, DEPLOYED } from "@/lib/constants";
import { monadTestnet } from "@/lib/chain";
import { notify } from "@/lib/toast";
import { Loader2, Upload, CheckCircle2, Scan } from "lucide-react";
import type { Hex } from "viem";

const PROOF_REGISTRY_KEY = "montrust-proof-registry";
const LEGACY_PROOF_REGISTRY_KEY = "trustlens-proof-registry";

type Step = "select" | "upload" | "analyze" | "hash" | "anchor" | "verify";

export default function PhotoProofPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onMonadTestnet = chainId === monadTestnet.id;
  const publicClient = usePublicClient();
  const [step, setStep] = useState<Step>("select");
  const [taskId, setTaskId] = useState<string>(DEFAULT_TASKS[0].id);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHash, setImageHash] = useState<string | null>(null);
  const [vision, setVision] = useState<{
    answer: string;
    confidence: number;
    reason: string;
  } | null>(null);
  const [visionModel, setVisionModel] = useState<string | null>(null);
  const [proof, setProof] = useState<PhotoProof | null>(null);
  const [proofHash, setProofHash] = useState<Hex | null>(null);
  const [agentId, setAgentId] = useState<string>(DEPLOYED.agentId);
  const [registryAddress, setRegistryAddress] = useState<string | null>(
    DEPLOYED.proofAnchor
  );
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { deployContract, data: deployHash, isPending: deploying } =
    useDeployContract();
  const { writeContract: anchorProof, data: anchorHash, isPending: anchoring } =
    useWriteContract();

  const { isLoading: deployConfirming, isSuccess: deploySuccess } =
    useWaitForTransactionReceipt({ hash: deployHash });
  const { isLoading: anchorConfirming, isSuccess: anchorSuccess } =
    useWaitForTransactionReceipt({ hash: anchorHash });

  useEffect(() => {
    const saved =
      localStorage.getItem(PROOF_REGISTRY_KEY) ??
      localStorage.getItem(LEGACY_PROOF_REGISTRY_KEY);
    if (saved) {
      setRegistryAddress(saved);
      localStorage.setItem(PROOF_REGISTRY_KEY, saved);
    }
    fetch("/api/deployment")
      .then((r) => r.json())
      .then((d) => {
        if (d.contracts?.proofAnchor) {
          setRegistryAddress(d.contracts.proofAnchor);
          localStorage.setItem(PROOF_REGISTRY_KEY, d.contracts.proofAnchor);
        }
        if (d.agent?.id) setAgentId(d.agent.id);
      })
      .catch(() => undefined);
    fetch("/api/vision")
      .then((r) => r.json())
      .then((d) => {
        if (d.configured) setVisionModel(d.model);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (deploySuccess && deployHash && publicClient) {
      notify.dismiss();
      notify.txSuccess("ProofAnchor deployed", deployHash);
      publicClient
        .getTransactionReceipt({ hash: deployHash })
        .then((receipt) => {
          const addr = receipt.contractAddress;
          if (addr) {
            localStorage.setItem(PROOF_REGISTRY_KEY, addr);
            setRegistryAddress(addr);
          }
        });
    }
  }, [deploySuccess, deployHash, publicClient]);

  useEffect(() => {
    if (anchorSuccess && anchorHash) {
      notify.dismiss();
      setTxHash(anchorHash);
      setStep("verify");
      notify.txSuccess("Proof anchored on Monad", anchorHash);
    }
  }, [anchorSuccess, anchorHash]);

  const task = DEFAULT_TASKS.find((t) => t.id === taskId) ?? DEFAULT_TASKS[0];
  const imagePrompt = getTaskImagePrompt(taskId);

  async function handleUpload(file: File) {
    setError(null);
    setStep("upload");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setImagePreview(reader.result as string);

      const buf = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        buf
      );
      const hashHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setImageHash(hashHex);
      setStep("analyze");
      setLoading(true);

      try {
        const res = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
            question: task.question,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Vision failed");
        const { _meta, ...visionResult } = data as {
          answer: string;
          confidence: number;
          reason: string;
          _meta?: { model?: string; provider?: string };
        };
        const parsedVision = visionResultSchema.parse(visionResult);
        setVision(parsedVision);
        if (_meta?.model) setVisionModel(_meta.model);
        setStep("hash");

        const proofObj: PhotoProof = {
          taskId: task.id,
          taskQuestion: task.question,
          imageHash: hashHex,
          vision: parsedVision,
          agentId: agentId || undefined,
          timestamp: new Date().toISOString(),
          version: "1",
        };
        setProof(proofObj);
        const hash = hashProof(proofObj);
        setProofHash(hash);
        setStep("anchor");
        notify.success("Vision analysis complete", {
          description: `Answer: ${parsedVision.answer} (${(parsedVision.confidence * 100).toFixed(0)}% confidence)`,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Analysis failed";
        setError(msg);
        notify.error("Vision analysis failed", { description: msg });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function deployRegistry() {
    if (!isConnected) {
      const msg = "Connect wallet to deploy ProofAnchor contract.";
      setError(msg);
      notify.error("Wallet required", { description: msg });
      return;
    }
    notify.loading("Deploying ProofAnchor…");
    deployContract({
      abi: proofAnchorAbi,
      bytecode: proofAnchorBytecode,
    });
  }

  async function anchorOnChain() {
    if (!proofHash || !registryAddress || !isConnected) {
      const msg = "Deploy registry and connect wallet first.";
      setError(msg);
      notify.error("Cannot anchor", { description: msg });
      return;
    }
    if (!onMonadTestnet) {
      const msg = "Switch your wallet to Monad Testnet (chain 10143) before anchoring.";
      setError(msg);
      notify.error("Wrong network", { description: msg });
      return;
    }
    notify.loading("Anchoring proof on Monad…");
    anchorProof({
      address: registryAddress as `0x${string}`,
      abi: proofAnchorAbi,
      functionName: "anchorProof",
      args: [proofHash, BigInt(agentId || "0")],
    });
  }

  async function saveProofRecord() {
    if (!proof || !proofHash) return;
    await fetch("/api/proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proof,
        proofHash,
        txHash,
        agentId: agentId || undefined,
      }),
    });
    notify.success("Proof saved to activity history");
  }

  function tamperProof() {
    if (!proof) return;
    const tampered = {
      ...proof,
      vision: { ...proof.vision, answer: "yes" as const },
    };
    const ok = verifyProofIntegrity(tampered, proofHash!);
    setVerifyOk(ok);
    notify.info("Tamper simulation", {
      description: ok
        ? "Unexpected: hash still matched"
        : "Hash mismatch detected — proof was altered",
    });
  }

  function verifyOriginal() {
    if (!proof || !proofHash) return;
    const ok = verifyProofIntegrity(proof, proofHash);
    setVerifyOk(ok);
    if (ok) {
      notify.success("Proof integrity confirmed", {
        description: "Cryptographic hash matches original proof",
      });
    } else {
      notify.error("Integrity check failed", {
        description: "Hash does not match the proof data",
      });
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: "select", label: "Select task" },
    { id: "upload", label: "Upload photo" },
    { id: "analyze", label: "Vision analysis" },
    { id: "hash", label: "Hash proof" },
    { id: "anchor", label: "Anchor on-chain" },
    { id: "verify", label: "Verify integrity" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <AppShell>
      <PageHeader
        step="Module 2 · Photo Proof"
        title="Agent & MCP Vulnerability Screenshots"
        description="Upload screenshots of agent configs, MCP endpoints, or agent cards. NVIDIA MiniMax-M3 audits for security, agentic, and MCP risks — then hash and anchor proof on Monad Testnet."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <StepPill
            key={s.id}
            label={`${i + 1}. ${s.label}`}
            active={i === stepIndex}
            done={i < stepIndex}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card glow>
          <SectionTitle icon={<Scan className="h-4 w-4 text-accent" />}>
            Vulnerability audit
          </SectionTitle>
          <Select
            value={taskId}
            onChange={(e) => {
              setTaskId(e.target.value);
              setStep("select");
              setVision(null);
              setProof(null);
            }}
            className="mb-3"
          >
            {DEFAULT_TASKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.category}: {t.question.slice(0, 50)}…
              </option>
            ))}
          </Select>
          <p className="text-sm text-muted-foreground">{task.question}</p>

          {imagePrompt && (
            <div className="mt-4 rounded-xl border border-dashed border-accent/25 bg-accent-subtle/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Image generation prompt
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {imagePrompt.prompt}
              </p>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(imagePrompt.prompt);
                  setCopiedPrompt(true);
                  notify.success("Prompt copied to clipboard");
                  setTimeout(() => setCopiedPrompt(false), 2000);
                }}
                className="mt-2 text-xs font-medium text-accent hover:underline"
              >
                {copiedPrompt ? "Copied!" : "Copy prompt for DALL·E / Midjourney"}
              </button>
            </div>
          )}

          {visionModel && (
            <p className="mt-2 text-xs text-accent">
              Vision: {visionModel} via NVIDIA NIM
            </p>
          )}

          <label className="mt-4 block text-sm">
            <Label>ERC-8004 Vision Agent ID (optional)</Label>
            <Input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="Your registered agent ID"
            />
          </label>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <Button
            className="mt-4 w-full"
            variant="cyan"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Screenshot Proof
          </Button>
          {error && (
            <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
        </Card>

        <Card glow>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Proof"
              className="mb-4 max-h-52 w-full rounded-xl border border-border object-cover shadow-lg"
            />
          )}

          {vision && (
            <div className="mb-4 rounded-xl border border-accent/20 bg-accent-subtle/50 p-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Vision answer:</span>
                <StatusBadge
                  status={
                    vision.answer === "yes"
                      ? "verified"
                      : vision.answer === "no"
                        ? "failed"
                        : "warning"
                  }
                />
              </div>
              <p className="mt-1 capitalize text-foreground">{vision.answer}</p>
              <p className="text-muted-foreground">
                Confidence: {(vision.confidence * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-muted-foreground">{vision.reason}</p>
              {visionModel && (
                <p className="mt-2 text-xs text-accent/80">Model: {visionModel}</p>
              )}
            </div>
          )}

          {imageHash && (
            <p className="mb-2 font-mono text-xs text-muted-foreground">
              Image SHA-256: {imageHash.slice(0, 16)}…
            </p>
          )}

          {proofHash && (
            <p className="mb-4 font-mono text-xs break-all text-accent/80">
              Proof hash: {proofHash}
            </p>
          )}

          {stepIndex >= 4 && proofHash && (
            <div className="space-y-3 border-t border-border pt-4">
              {!registryAddress ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={deployRegistry}
                  disabled={deploying || deployConfirming || !isConnected}
                >
                  {deploying || deployConfirming
                    ? "Deploying ProofAnchor…"
                    : "Deploy ProofAnchor Contract"}
                </Button>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">
                  Registry: {registryAddress.slice(0, 10)}…
                </p>
              )}
              <Button
                className="w-full"
                onClick={anchorOnChain}
                disabled={
                  anchoring || anchorConfirming || !registryAddress || !isConnected
                }
              >
                {anchoring || anchorConfirming
                  ? "Anchoring on Monad…"
                  : "Anchor Proof Hash On-Chain"}
              </Button>
              {txHash && (
                <a
                  href={`${MONAD_TESTNET.explorerUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs text-accent hover:underline"
                >
                  View tx: {txHash.slice(0, 14)}…
                </a>
              )}
            </div>
          )}

          {step === "verify" && proof && proofHash && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">
                Integrity check
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  size="sm"
                  onClick={() => {
                    verifyOriginal();
                    saveProofRecord();
                  }}
                >
                  Verify original
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  size="sm"
                  onClick={tamperProof}
                >
                  Simulate tampered proof
                </Button>
              </div>
              {verifyOk !== null && (
                <p
                  className={`flex items-center gap-2 text-sm ${verifyOk ? "text-emerald-600" : "text-rose-600"}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {verifyOk
                    ? "Hash matches — proof integrity confirmed"
                    : "Hash mismatch — proof was altered"}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
