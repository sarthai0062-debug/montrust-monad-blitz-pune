"use client";

import { useEffect, useState, useRef } from "react";
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
import { X402PayButton } from "@/components/X402PayButton";
import { DEPLOYED, DEMO_AGENT } from "@/lib/constants";
import type { TrustReport } from "@/lib/trustReport";
import { notify } from "@/lib/toast";
import { Loader2, ShieldQuestion, CreditCard, Link2 } from "lucide-react";

interface X402ConfigResponse {
  payment: {
    price: string;
    amountMon?: string;
    network: string;
    asset: { symbol: string; address?: string };
    payTo: string;
  };
  tokens: { usdc: { symbol: string; address: string } };
}

export default function TrustPage() {
  const [agentId, setAgentId] = useState<string>(DEPLOYED.agentId);
  const [endpointUrl, setEndpointUrl] = useState("");
  const [report, setReport] = useState<TrustReport | null>(null);
  const [x402Config, setX402Config] = useState<X402ConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [x402Status, setX402Status] = useState<string | null>(null);
  const [x402Loading, setX402Loading] = useState(false);
  const skipLoadToast = useRef(true);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const resolvedEndpoint =
    endpointUrl ||
    (origin ? `${origin}/api/agent/challenge` : DEMO_AGENT.mcpEndpoint);

  async function loadReport() {
    setLoading(true);
    const history = await fetch("/api/history").then((r) => r.json());
    const latestProofHash = history.proofs?.[0]?.proofHash as string | undefined;

    const params = new URLSearchParams({
      agentId,
      endpointUrl: resolvedEndpoint,
    });
    if (latestProofHash) params.set("proofHash", latestProofHash);

    const [trust, config] = await Promise.all([
      fetch(`/api/trust-report?${params.toString()}`).then((r) => r.json()),
      fetch("/api/x402/config").then((r) => r.json()),
    ]);
    setReport(trust);
    setX402Config(config);
    setLoading(false);
    if (!skipLoadToast.current && trust.overallStatus) {
      notify.info("Trust report ready", {
        description: trust.summary,
      });
    }
    skipLoadToast.current = false;
  }

  useEffect(() => {
    if (!origin) return;
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin]);

  async function probeX402() {
    setX402Loading(true);
    setX402Status(null);
    try {
      const blocked = await fetch("/api/x402/vision");
      if (blocked.status === 402) {
        const body = await blocked.json();
        const msg = `402 Payment Required — ${x402Config?.payment.amountMon ?? "0.1"} MON on Monad Testnet. ${body.message ?? ""}`;
        setX402Status(msg);
        notify.info("HTTP 402 received", {
          description: `${x402Config?.payment.amountMon ?? "0.1"} MON required via MetaMask`,
        });
      } else {
        const data = await blocked.json();
        const msg = data.message ?? JSON.stringify(data);
        setX402Status(msg);
        notify.info("x402 probe response", { description: msg });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "x402 probe failed";
      setX402Status(msg);
      notify.error("x402 probe failed", { description: msg });
    } finally {
      setX402Loading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        step="Module 4 · Trust Report"
        title="Was it genuine?"
        description="Analyze any ERC-8004 or OpenClaw agent on Monad Testnet. Six trust questions + link safety scan, then pay 0.1 MON via MetaMask x402."
      />

      <Card className="mb-6" glow>
        <SectionTitle>Target agent</SectionTitle>
        <p className="mb-4 text-xs text-muted-foreground">
          Paste an OpenClaw or ERC-8004 agent ID from{" "}
          <a
            href="https://testnet.monadexplorer.com"
            className="text-accent hover:underline"
          >
            Monad Testnet
          </a>{" "}
          and the MCP/HTTP endpoint from its agent card.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <Label>Agent ID</Label>
            <Input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="e.g. 1786"
            />
          </label>
          <label className="block text-sm">
            <Label>Endpoint URL</Label>
            <Input
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder={`${origin}/api/agent/challenge`}
            />
          </label>
        </div>
        <Button
          className="mt-4"
          onClick={loadReport}
          disabled={loading || !agentId}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Analyze agent
        </Button>
      </Card>

      {loading && (
        <Card>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Building trust report…
          </p>
        </Card>
      )}

      {report && (
        <>
          <Card className="mb-6" glow>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Overall trust</SectionTitle>
              <StatusBadge
                status={
                  report.overallStatus === "trusted"
                    ? "verified"
                    : report.overallStatus === "warning"
                      ? "warning"
                      : "failed"
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">{report.summary}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Source: <strong className="capitalize text-foreground/80">{report.agentSource}</strong>{" "}
              · Endpoint: <code className="text-[10px] text-accent/80">{report.endpointUrl}</code>
            </p>
          </Card>

          {report.linkSafety.findings.length > 0 && (
            <Card className="mb-6">
              <SectionTitle icon={<Link2 className="h-4 w-4 text-amber-600" />}>
                Link safety scan
              </SectionTitle>
              <ul className="space-y-2 text-xs">
                {report.linkSafety.findings.map((f) => (
                  <li
                    key={f.id}
                    className={`rounded-lg border px-3 py-2 ${
                      f.passed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    [{f.severity}] {f.label}: {f.detail}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="mb-6 space-y-3">
            {report.questions.map((q) => (
              <Card key={q.id}>
                <div className="flex items-start gap-3">
                  <ShieldQuestion
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      q.passed ? "text-emerald-600" : "text-amber-600"
                    }`}
                  />
                  <div>
                    <p className="font-medium text-foreground">{q.question}</p>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                      Answer: <strong className="text-foreground/80">{q.answer}</strong>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{q.detail}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="mb-6" glow>
            <SectionTitle icon={<CreditCard className="h-4 w-4 text-accent" />}>
              x402 Payment (0.1 MON)
            </SectionTitle>
            {x402Config && (
              <dl className="mb-4 grid gap-2 text-xs sm:grid-cols-2">
                {[
                  ["Price", `${x402Config.payment.price} ${x402Config.payment.asset.symbol}`],
                  ["Network", x402Config.payment.network],
                  ["Asset", `${x402Config.payment.asset.symbol} (native)`],
                  ["Seller", `${x402Config.payment.payTo.slice(0, 12)}…`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-border bg-muted/50 p-2.5"
                  >
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-dim">
                      {label}
                    </dt>
                    <dd className="mt-0.5 text-foreground/80">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mb-2 text-sm text-muted-foreground">
              {report.payWhenItWorks.reason}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              {report.payWhenItWorks.x402Note}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                disabled={x402Loading}
                onClick={probeX402}
              >
                {x402Loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Probe 402 response
              </Button>

              <X402PayButton
                mode="trust-report"
                agentId={agentId}
                endpointUrl={resolvedEndpoint}
                trustProofHash={report.proofHash}
                onSuccess={(data) =>
                  setX402Status(
                    `Paid analysis: ${(data as { report?: { overallStatus?: string } }).report?.overallStatus ?? "complete"}`
                  )
                }
                onError={setX402Status}
              />

              <X402PayButton
                trustProofHash={report.proofHash}
                agentId={agentId}
                disabled={!report.payWhenItWorks.eligible}
                onSuccess={(data) =>
                  setX402Status(
                    `Paid & unlocked: ${(data as { message?: string }).message ?? "success"}`
                  )
                }
                onError={setX402Status}
              />
            </div>

            {!report.payWhenItWorks.eligible && (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Complete agent signature + photo proof anchoring before MON payment is enabled.
              </p>
            )}

            {x402Status && (
              <p className="mt-3 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {x402Status}
              </p>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}
