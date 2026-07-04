"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, PageHeader, StatusBadge, SectionTitle } from "@/components/ui";
import type { VerificationResult } from "@/lib/verification";
import { ShieldCheck, Camera } from "lucide-react";

interface HistoryData {
  verifications: VerificationResult[];
  proofs: Array<{
    id: string;
    taskId: string;
    taskQuestion: string;
    proofHash: string;
    txHash?: string;
    anchored: boolean;
    createdAt: string;
  }>;
}

export default function HistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Activity History"
        description="Cached verification checks and photo proof records from this session."
      />

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading activity…
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card glow>
            <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-accent" />}>
              Agent Verifications ({data.verifications.length})
            </SectionTitle>
            {data.verifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No verifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.verifications.map((v, i) => (
                  <li
                    key={`${v.timestamp}-${i}`}
                    className="rounded-xl border border-border bg-muted/50 p-3 text-sm transition hover:border-accent/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        Agent #{v.agentId}
                      </span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {v.endpointUrl}
                    </p>
                    <p className="mt-1 text-xs text-dim">
                      {new Date(v.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card glow>
            <SectionTitle icon={<Camera className="h-4 w-4 text-accent" />}>
              Photo Proofs ({data.proofs.length})
            </SectionTitle>
            {data.proofs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No proofs yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.proofs.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-border bg-muted/50 p-3 text-sm transition hover:border-accent/20"
                  >
                    <p className="font-medium text-foreground">{p.taskQuestion}</p>
                    <p className="mt-1 font-mono text-xs text-accent/80 break-all">
                      {p.proofHash.slice(0, 22)}…
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.anchored ? (
                        <span className="text-emerald-600">On-chain anchored</span>
                      ) : (
                        "Local only"
                      )}{" "}
                      · {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
