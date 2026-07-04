"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { payForVisionAccess, payForTrustReportAnalysis, getX402PaymentSummary } from "@/lib/x402/client";
import { isMetaMaskInstalled } from "@/lib/metamaskWallet";
import { DEPLOYED } from "@/lib/constants";
import { notify } from "@/lib/toast";
import { Button } from "./ui";

interface X402PayButtonProps {
  trustProofHash?: string;
  agentId?: string;
  mode?: "vision" | "trust-report";
  endpointUrl?: string;
  disabled?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (message: string) => void;
}

export function X402PayButton({
  trustProofHash,
  agentId = DEPLOYED.agentId,
  mode = "vision",
  endpointUrl,
  disabled,
  onSuccess,
  onError,
}: X402PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const summary = getX402PaymentSummary();

  async function handlePay() {
    if (!isMetaMaskInstalled()) {
      const msg = "Install MetaMask and switch to Monad Testnet (10143) with MON.";
      onError?.(msg);
      notify.error("MetaMask required", { description: msg });
      return;
    }
    if (mode === "trust-report" && !endpointUrl) {
      const msg = "Endpoint URL is required for trust report analysis.";
      onError?.(msg);
      notify.error("Missing endpoint", { description: msg });
      return;
    }

    setLoading(true);
    const toastId = notify.loading(
      mode === "trust-report"
        ? "Processing x402 trust report payment…"
        : "Processing x402 vision payment…"
    );
    try {
      const res =
        mode === "trust-report"
          ? await payForTrustReportAnalysis({
              agentId,
              endpointUrl: endpointUrl ?? "",
              proofHash: trustProofHash,
            })
          : await payForVisionAccess({
              trustProofHash,
              agentId,
            });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`);
      }
      notify.dismiss(toastId);
      notify.success("x402 payment successful", {
        description:
          mode === "trust-report"
            ? "Trust report analysis unlocked"
            : "Vision resource unlocked — settlement confirmed",
      });
      onSuccess?.(data);
    } catch (e) {
      notify.dismiss(toastId);
      const msg = e instanceof Error ? e.message : "x402 payment failed";
      notify.error("x402 payment failed", { description: msg });
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="cyan"
        disabled={disabled || loading}
        onClick={handlePay}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Pay {summary.price} {summary.asset} via MetaMask (x402)
      </Button>
      <p className="text-[10px] text-muted-foreground">
        {summary.price} {summary.asset} on {summary.network} — MetaMask sends native MON to seller.
        {mode === "vision" ? " Settlement only if trust checks pass." : ""}
      </p>
    </div>
  );
}
