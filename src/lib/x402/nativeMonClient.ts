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
import { getMetaMaskProvider } from "@/lib/metamaskWallet";
import { X402_CONFIG, MON_PAYMENT_TX_HEADER } from "./config";

export interface NativeMonPayOptions {
  trustProofHash?: string;
  agentId?: string;
}

function buildHeaders(options: NativeMonPayOptions): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.trustProofHash) {
    headers["X-TRUST-PROOF-HASH"] = options.trustProofHash;
  }
  if (options.agentId) {
    headers["X-TRUST-AGENT-ID"] = options.agentId;
  }
  return headers;
}

async function getWalletClient(): Promise<WalletClient> {
  const provider = getMetaMaskProvider();
  if (!provider) {
    throw new Error(
      "MetaMask is required. Install MetaMask and connect on Monad Testnet (10143)."
    );
  }

  const walletClient = createWalletClient({
    chain: monadTestnet,
    transport: custom(provider as import("viem").EIP1193Provider),
  });

  const [address] = await walletClient.getAddresses();
  if (!address) {
    throw new Error("Connect MetaMask on Monad Testnet before paying.");
  }

  return walletClient;
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

export async function payWithNativeMon(
  url: string,
  options: NativeMonPayOptions = {}
): Promise<Response> {
  await ensureTestnetChain();
  const walletClient = await getWalletClient();
  const [from] = await walletClient.getAddresses();
  if (!from) throw new Error("No MetaMask account connected.");

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
    return probe;
  }

  const txHash = await walletClient.sendTransaction({
    account: from,
    chain: monadTestnet,
    to: X402_CONFIG.payTo,
    value: parseEther(X402_CONFIG.paymentAmountMon),
  });

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  return fetch(url, {
    method: "GET",
    headers: {
      ...buildHeaders(options),
      [MON_PAYMENT_TX_HEADER]: txHash,
    },
  });
}

export function getX402PaymentSummary() {
  return {
    price: X402_CONFIG.paymentAmountMon,
    asset: "MON",
    network: `Monad Testnet (${X402_CONFIG.chainId})`,
    payTo: X402_CONFIG.payTo,
  };
}
