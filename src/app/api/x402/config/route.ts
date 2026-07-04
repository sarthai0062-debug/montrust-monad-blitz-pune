import { NextResponse } from "next/server";
import {
  X402_CONFIG,
  MONAD_TESTNET_X402,
  MONAD_TESTNET_USDC,
  MONAD_TESTNET_WMON,
} from "@/lib/x402/config";
import { DEPLOYED } from "@/lib/constants";

export async function GET() {
  return NextResponse.json({
    protocol: "x402",
    version: 2,
    network: MONAD_TESTNET_X402,
    payment: {
      scheme: "exact",
      price: X402_CONFIG.visionPrice,
      amountMon: X402_CONFIG.paymentAmountMon,
      amountWei: X402_CONFIG.paymentAmountWei.toString(),
      network: X402_CONFIG.networkId,
      payTo: X402_CONFIG.payTo,
      asset: {
        symbol: "MON",
        type: "native",
        decimals: 18,
      },
      transferMethod: X402_CONFIG.transferMethod,
      facilitator: X402_CONFIG.facilitatorUrl,
      wallet: "MetaMask on Monad Testnet — native MON sendTransaction",
    },
    tokens: {
      usdc: MONAD_TESTNET_USDC,
      wmon: MONAD_TESTNET_WMON,
    },
    endpoints: {
      visionPaid: "/api/x402/vision",
      visionFree: "/api/vision",
      trustReportPaid: "/api/x402/trust-report",
      trustReportFree: "/api/trust-report",
    },
    payWhenItWorks: {
      description:
        "Settlement only executes after trust report is eligible (proof anchored + agent signature verified).",
      trustReport: "/api/trust-report",
      requiredHeaders: ["X-TRUST-PROOF-HASH", "X-TRUST-AGENT-ID", "X-MON-PAYMENT-TX"],
    },
    agentId: DEPLOYED.agentId,
    note:
      "Pay 0.1 MON on Monad Testnet (10143) via MetaMask. Seller receives native MON at payTo.",
  });
}
