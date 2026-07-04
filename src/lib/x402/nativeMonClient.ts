"use client";

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  type WalletClient,
} from "viem";
import { monadTestnet } from "@/lib/chain";
import {
  getMetaMaskProvider,
  requestMetaMaskAccounts,
} from "@/lib/metamaskWallet";
import { X402_CONFIG, MON_PAYMENT_TX_HEADER } from "./config";

export interface NativeMonPayOptions {
  trustProofHash?: string;
  agentId?: string;
}

export interface NativeMonPaymentResult {
  ok: boolean;
  status: number;
  data: unknown;
  txHash: string | null;
  payer: `0x${string}` | null;
}

function buildHeaders(
  options: NativeMonPayOptions,
  txHash?: string
): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.trustProofHash) {
    headers["X-TRUST-PROOF-HASH"] = options.trustProofHash;
  }
  if (options.agentId) {
    headers["X-TRUST-AGENT-ID"] = options.agentId;
  }
  if (txHash) {
    headers[MON_PAYMENT_TX_HEADER] = txHash;
  }
  return headers;
}

async function getMetaMaskWalletClient(): Promise<{
  walletClient: WalletClient;
  from: `0x${string}`;
}> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error(
      "MetaMask is required. Install MetaMask and connect on Monad Testnet (10143)."
    );
  }

  const accounts = await requestMetaMaskAccounts();
  const from = accounts[0];
  if (!from) {
    throw new Error("Connect MetaMask on Monad Testnet before paying.");
  }

  const walletClient = createWalletClient({
    account: from,
    chain: monadTestnet,
    transport: custom(provider as import("viem").EIP1193Provider),
  });

  return { walletClient, from };
}

async function ensureTestnetChain(): Promise<void> {
  const provider = getMetaMaskProvider();
  if (!provider?.request) return;

  const chainIdHex = await provider.request({ method: "eth_chainId" });
  const current = parseInt(String(chainIdHex), 16);
  if (current === X402_CONFIG.chainId) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${X402_CONFIG.chainId.toString(16)}` }],
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${X402_CONFIG.chainId.toString(16)}`,
          chainName: "Monad Testnet",
          nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
          rpcUrls: ["https://testnet-rpc.monad.xyz"],
          blockExplorerUrls: ["https://testnet.monadvision.com"],
        },
      ],
    });
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function payWithNativeMon(
  url: string,
  options: NativeMonPayOptions = {}
): Promise<NativeMonPaymentResult> {
  await ensureTestnetChain();
  const { walletClient, from } = await getMetaMaskWalletClient();

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(monadTestnet.rpcUrls.default.http[0]),
  });

  const balance = await publicClient.getBalance({ address: from });
  if (balance < X402_CONFIG.paymentAmountWei) {
    throw new Error(
      `Insufficient MON. Need ${X402_CONFIG.paymentAmountMon} MON on testnet (have ${Number(balance) / 1e18}). Get MON from faucet.monad.xyz`
    );
  }

  const probe = await fetch(url, {
    method: "GET",
    headers: buildHeaders(options),
  });

  if (probe.status !== 402) {
    const data = await parseJsonResponse(probe);
    return {
      ok: probe.ok,
      status: probe.status,
      data,
      txHash: null,
      payer: from,
    };
  }

  const txHash = await walletClient.sendTransaction({
    account: from,
    chain: monadTestnet,
    to: X402_CONFIG.payTo,
    value: parseEther(X402_CONFIG.paymentAmountMon),
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(options, txHash),
  });

  const data = await parseJsonResponse(response);

  return {
    ok: response.ok,
    status: response.status,
    data,
    txHash,
    payer: from,
  };
}

export function getX402PaymentSummary() {
  return {
    price: X402_CONFIG.paymentAmountMon,
    asset: "MON",
    network: `Monad Testnet (${X402_CONFIG.chainId})`,
    payTo: X402_CONFIG.payTo,
    wallet: "MetaMask",
  };
}
