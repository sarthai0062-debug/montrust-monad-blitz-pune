import { createPublicClient, http, isHash, type Hash } from "viem";
import { MONAD_TESTNET } from "@/lib/constants";
import { X402_CONFIG, MON_PAYMENT_TX_HEADER } from "./config";

const client = createPublicClient({
  chain: {
    id: MONAD_TESTNET.chainId,
    name: MONAD_TESTNET.name,
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: [MONAD_TESTNET.rpcUrl] } },
  },
  transport: http(MONAD_TESTNET.rpcUrl),
});

export interface MonPaymentVerification {
  valid: boolean;
  reason?: string;
  from?: string;
  value?: bigint;
  blockNumber?: bigint;
}

export async function verifyNativeMonPayment(
  txHash: string,
  expectedPayTo?: `0x${string}`
): Promise<MonPaymentVerification> {
  if (!txHash || !isHash(txHash)) {
    return { valid: false, reason: "invalid_tx_hash" };
  }

  const payTo = (expectedPayTo ?? X402_CONFIG.payTo).toLowerCase();

  try {
    const receipt = await client.getTransactionReceipt({
      hash: txHash as Hash,
    });

    if (receipt.status !== "success") {
      return { valid: false, reason: "tx_failed" };
    }

    const tx = await client.getTransaction({ hash: txHash as Hash });

    if (tx.to?.toLowerCase() !== payTo) {
      return {
        valid: false,
        reason: `wrong_recipient: expected ${payTo}, got ${tx.to}`,
      };
    }

    if (tx.value < X402_CONFIG.paymentAmountWei) {
      return {
        valid: false,
        reason: `insufficient_amount: need ${X402_CONFIG.paymentAmountWei}, got ${tx.value}`,
      };
    }

    return {
      valid: true,
      from: tx.from,
      value: tx.value,
      blockNumber: receipt.blockNumber,
    };
  } catch {
    return { valid: false, reason: "tx_not_found" };
  }
}

export function buildMonPaymentRequiredBody(path: string) {
  return {
    x402Version: 2,
    error: "payment_required",
    scheme: "exact",
    network: X402_CONFIG.networkId,
    chainId: X402_CONFIG.chainId,
    amount: X402_CONFIG.paymentAmountMon,
    amountWei: X402_CONFIG.paymentAmountWei.toString(),
    asset: X402_CONFIG.paymentAsset,
    payTo: X402_CONFIG.payTo,
    facilitator: X402_CONFIG.facilitatorUrl,
    paymentMethod: "metamask_native_mon",
    instructions:
      `Send exactly ${X402_CONFIG.paymentAmountMon} MON on Monad Testnet via MetaMask, then retry with header ${MON_PAYMENT_TX_HEADER}.`,
    resource: path,
  };
}

export { MON_PAYMENT_TX_HEADER };
