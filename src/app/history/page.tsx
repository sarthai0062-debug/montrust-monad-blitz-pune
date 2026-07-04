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
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          Loading activity…
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card glow>
            <SectionTitle icon={<ShieldCheck className="h-4 w-4 text-indigo-400" />}>
              Agent Verifications ({data.verifications.length})
            </SectionTitle>
            {data.verifications.length === 0 ? (
              <p className="text-sm text-slate-500">No verifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.verifications.map((v, i) => (
                  <li
                    key={`${v.timestamp}-${i}`}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm transition hover:border-indigo-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-200">
                        Agent #{v.agentId}
                      </span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-slate-500">
                      {v.endpointUrl}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {new Date(v.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card glow>
            <SectionTitle icon={<Camera className="h-4 w-4 text-cyan-400" />}>
              Photo Proofs ({data.proofs.length})
            </SectionTitle>
            {data.proofs.length === 0 ? (
              <p className="text-sm text-slate-500">No proofs yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.proofs.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm transition hover:border-cyan-500/20"
                  >
                    <p className="font-medium text-slate-200">{p.taskQuestion}</p>
                    <p className="mt-1 font-mono text-xs text-cyan-400/80 break-all">
                      {p.proofHash.slice(0, 22)}…
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {p.anchored ? (
                        <span className="text-emerald-400">On-chain anchored</span>
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
