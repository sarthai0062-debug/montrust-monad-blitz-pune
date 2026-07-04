"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle } from "./ui";
import { DEFAULT_WALLET } from "@/lib/constants";
import { useAccount } from "wagmi";
import { CheckCircle2, XCircle, AlertCircle, Activity } from "lucide-react";

interface WalletStatus {
  wallet: { balanceMon: string; transactionCount: number };
  readiness: {
    walletFunded: boolean;
    agentRegistered: boolean;
    proofAnchorDeployed: boolean;
    visionApiConfigured: boolean;
  };
  onChain: {
    proofAnchor: { address: string; codeSize: number } | null;
    registeredAgent: { agentId: string; name?: string } | null;
  };
  localDeployment: {
    contracts?: { proofAnchor?: string };
    agent?: { id?: string };
  } | null;
  erc8004: { identityRegistry: string; docsNote: string };
}

function StatusRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm">
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${ok ? "text-emerald-400" : "text-rose-400"}`}
      />
      <div>
        <p className="font-medium text-slate-200">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

export function OnChainStatusPanel() {
  const { address } = useAccount();
  const checkAddress = address ?? DEFAULT_WALLET;
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/wallet-status?address=${checkAddress}`)
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, [checkAddress]);

  if (loading) {
    return (
      <Card glow>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          <p className="text-sm text-slate-400">Scanning on-chain status…</p>
        </div>
      </Card>
    );
  }

  if (!status) return null;

  const allReady =
    status.readiness.agentRegistered && status.readiness.proofAnchorDeployed;

  return (
    <Card className="mb-8" glow>
      <div className="mb-5 flex items-center justify-between">
        <SectionTitle icon={<Activity className="h-4 w-4 text-cyan-400" />}>
          On-Chain Status
        </SectionTitle>
        {allReady ? (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
            <AlertCircle className="h-3 w-3" /> Setup needed
          </span>
        )}
      </div>

      <p className="mb-4 rounded-lg border border-white/5 bg-slate-900/50 px-3 py-2 font-mono text-xs text-indigo-300/80">
        {checkAddress}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow
          ok={status.readiness.walletFunded}
          label="Wallet funded"
          detail={`${status.wallet.balanceMon} MON on Monad Testnet`}
        />
        <StatusRow
          ok={status.readiness.agentRegistered}
          label="ERC-8004 agent"
          detail={
            status.onChain.registeredAgent
              ? `#${status.onChain.registeredAgent.agentId} ${status.onChain.registeredAgent.name ?? ""}`
              : "Not registered — use Register Agent or npm run deploy:testnet"
          }
        />
        <StatusRow
          ok={status.readiness.proofAnchorDeployed}
          label="ProofAnchor contract"
          detail={
            status.onChain.proofAnchor
              ? `${status.onChain.proofAnchor.address.slice(0, 10)}… (${status.onChain.proofAnchor.codeSize} bytes)`
              : "Not deployed — deploy from Photo Proof or CLI"
          }
        />
        <StatusRow
          ok={status.readiness.visionApiConfigured}
          label="Vision API (MiniMax-M3)"
          detail={
            status.readiness.visionApiConfigured
              ? "NVIDIA_API_KEY configured — minimaxai/minimax-m3"
              : "Add NVIDIA_API_KEY to .env.local"
          }
        />
      </div>

      <p className="mt-4 text-xs text-slate-600">{status.erc8004.docsNote}</p>
      <p className="mt-1 font-mono text-[11px] text-slate-500">
        Registry: {status.erc8004.identityRegistry}
      </p>
    </Card>
  );
}
