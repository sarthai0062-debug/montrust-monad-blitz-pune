"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import {
  payForVisionAccess,
  payForTrustReportAnalysis,
  getX402PaymentSummary,
  type PaidTrustReportResponse,
} from "@/lib/x402/client";
import { isMetaMaskInstalled } from "@/lib/metamaskWallet";
import {
  buildPaymentReceiptFromX402Response,
  downloadTrustReportPdf,
} from "@/lib/trustReportPdf";
import type { TrustReport } from "@/lib/trustReport";
import { DEPLOYED } from "@/lib/constants";
import { notify } from "@/lib/toast";
import { Button } from "./ui";

interface X402PayButtonProps {
  trustProofHash?: string;
  agentId?: string;
  mode?: "vision" | "trust-report";
  endpointUrl?: string;
  disabled?: boolean;
  report?: TrustReport | null;
  onSuccess?: (data: unknown) => void;
  onError?: (message: string) => void;
}

async function downloadReportAfterPayment(
  report: TrustReport,
  data: PaidTrustReportResponse,
  txHash: string,
  payer?: string
) {
  const receipt = buildPaymentReceiptFromX402Response(
    {
      amount: data.amount,
      asset: data.asset,
      network: data.network,
      payTo: data.payTo,
    },
    txHash,
    payer
  );
  await downloadTrustReportPdf(report, receipt);
}

export function X402PayButton({
  trustProofHash,
  agentId = DEPLOYED.agentId,
  mode = "vision",
  endpointUrl,
  disabled,
  report,
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
      const result =
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

      if (!result.ok) {
        const err = result.data as { error?: string; message?: string };
        throw new Error(err?.error ?? err?.message ?? `HTTP ${result.status}`);
      }

      notify.dismiss(toastId);

      if (mode === "trust-report") {
        const data = result.data as PaidTrustReportResponse;
        if (!data.report || !result.txHash) {
          throw new Error("Paid trust report response was incomplete.");
        }

        await downloadReportAfterPayment(
          data.report,
          data,
          result.txHash,
          result.payer ?? undefined
        );

        notify.success("x402 payment successful", {
          description: "Trust report unlocked — PDF downloaded",
        });
        onSuccess?.({
          ...(data as object),
          txHash: result.txHash,
          payer: result.payer,
        });
        return;
      }

      if (result.txHash && report) {
        const data = result.data as PaidTrustReportResponse;
        const receipt = buildPaymentReceiptFromX402Response(
          {
            amount: data.amount ?? summary.price,
            asset: data.asset ?? summary.asset,
            network: data.network ?? summary.network,
            payTo: data.payTo ?? summary.payTo,
          },
          result.txHash,
          result.payer ?? undefined
        );
        await downloadTrustReportPdf(report, receipt);
        notify.success("x402 payment successful", {
          description: "Vision access unlocked — trust report PDF downloaded",
        });
        onSuccess?.({
          ...(result.data as object),
          txHash: result.txHash,
          payer: result.payer,
          receipt,
        });
      } else {
        notify.success("x402 payment successful", {
          description: "Vision resource unlocked — settlement confirmed",
        });
        onSuccess?.(result.data);
      }
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
        {mode === "trust-report"
          ? " PDF report downloads automatically after payment."
          : report
            ? " PDF trust report downloads after payment."
            : " Settlement only if trust checks pass."}
      </p>
    </div>
  );
}
