"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  PageHeader,
  StatusBadge,
  Button,
  Input,
  Label,
  SectionTitle,
} from "@/components/ui";
import { DEMO_AGENT, DEPLOYED } from "@/lib/constants";
import {
  buildChallengeMessage,
  generateNonce,
  type VerificationResult,
} from "@/lib/verification";
import { notify } from "@/lib/toast";
import { Loader2, ShieldCheck } from "lucide-react";

export default function VerifyPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [agentId, setAgentId] = useState<string>(DEMO_AGENT.id);
  const [endpointUrl, setEndpointUrl] = useState<string>(DEMO_AGENT.mcpEndpoint);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"onchain" | "local">("onchain");

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  async function runVerify(
    withSignature?: {
      signature: string;
      signer: string;
      message?: string;
    },
    endpointOverride?: string
  ) {
    const targetEndpoint = endpointOverride ?? endpointUrl;
    if (endpointOverride) setEndpointUrl(endpointOverride);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          endpointUrl: targetEndpoint,
          ...withSignature,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setResult(data);
      if (data.status === "verified") {
        notify.success("Agent verified", { description: data.summary });
      } else if (data.status === "warning") {
        notify.info("Verification completed with warnings", {
          description: data.summary,
        });
      } else {
        notify.error("Verification failed", { description: data.summary });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      setError(msg);
      notify.error("Verification error", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  async function verifyWithWallet() {
    if (!isConnected || !address) {
      setError("Connect your wallet to sign the challenge locally.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${origin}/api/agent/challenge`;
      const nonce = generateNonce();
      const message = buildChallengeMessage(nonce, endpoint);
      const signature = await signMessageAsync({ message });
      setEndpointUrl(endpoint);
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          endpointUrl: endpoint,
          signature,
          signer: address,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed");
      setResult(data);
      if (data.status === "verified") {
        notify.success("Agent verified", { description: data.summary });
      } else if (data.status === "warning") {
        notify.info("Verification completed with warnings", {
          description: data.summary,
        });
      } else {
        notify.error("Verification failed", { description: data.summary });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Signing failed";
      setError(msg);
      notify.error("Signing failed", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        step="Module 1 · Agent Verifier"
        title="Verify Agent Endpoint"
        description="Paste an agent ID and endpoint URL. MonTrust reads the real ERC-8004 Identity Registry on Monad Testnet, fetches the agent card, and runs a nonce challenge."
      />

      <Card className="mb-6" glow>
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("onchain")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              mode === "onchain"
                ? "border border-accent/30 bg-accent-subtle text-accent"
                : "border border-transparent text-muted-foreground hover:bg-hover"
            }`}
          >
            On-chain demo (Agent #1)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("local");
              setAgentId(DEPLOYED.agentId);
              setEndpointUrl(`${origin}/api/agent/challenge`);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              mode === "local"
                ? "border border-accent/30 bg-accent-subtle text-accent"
                : "border border-transparent text-muted-foreground hover:bg-hover"
            }`}
          >
            Your registered agent
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <Label>Agent ID</Label>
            <Input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="e.g. 1"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <Label>Endpoint URL</Label>
            <Input
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        {mode === "onchain" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Demo: Agent #1 is registered with{" "}
            <code className="text-accent">{DEMO_AGENT.mcpEndpoint}</code> — try
            that URL for a partial match, or use your MonTrust endpoint after
            registration.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={loading} onClick={() => runVerify()}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify Endpoint
          </Button>
          {mode === "local" && (
            <Button
              variant="secondary"
              disabled={loading || !isConnected}
              onClick={verifyWithWallet}
            >
              Sign Challenge & Verify
            </Button>
          )}
          <Button
            variant="danger"
            disabled={loading}
            onClick={() =>
              runVerify(undefined, "https://fake-impersonator.evil.test/mcp")
            }
          >
            Try impersonator URL
          </Button>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </Card>

      {result && (
        <Card glow>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-accent" />}>
              Verification Result
            </SectionTitle>
            <StatusBadge status={result.status} />
          </div>
          <p className="mb-4 text-sm text-muted-foreground">{result.summary}</p>

          {result.agentCard && (
            <div className="mb-4 rounded-xl border border-accent/20 bg-accent-subtle/50 p-4 text-sm">
              <p className="font-medium text-foreground">{result.agentCard.name}</p>
              <p className="text-muted-foreground">{result.agentCard.description}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Owner: {result.agentCard.owner}
              </p>
            </div>
          )}

          <ul className="space-y-2">
            {result.checks.map((c) => (
              <li
                key={c.id}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                  c.passed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-500/20 bg-rose-500/5"
                }`}
              >
                <span className={c.passed ? "text-emerald-600" : "text-rose-600"}>
                  {c.passed ? "✓" : "✗"}
                </span>
                <div>
                  <p className="font-medium text-foreground">{c.label}</p>
                  <p className="text-muted-foreground">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}
