"use client";

import { createWalletClient, custom, type WalletClient } from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import { monadTestnet } from "@/lib/chain";

export type MetaMaskEthereum = {
  isMetaMask?: boolean;
  isRainbow?: boolean;
  selectedAddress?: string;
  chainId?: string;
  providers?: MetaMaskEthereum[];
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export function getMetaMaskProvider(): MetaMaskEthereum | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & { ethereum?: MetaMaskEthereum };
  const eth = w.ethereum;
  if (!eth) return undefined;

  const providers = eth.providers ?? [eth];
  return providers.find((p) => p.isMetaMask && !p.isRainbow) ?? eth.isMetaMask ? eth : undefined;
}

export function isMetaMaskInstalled(): boolean {
  return Boolean(getMetaMaskProvider());
}

export function getMetaMaskChainIdHex(): string | null {
  const provider = getMetaMaskProvider();
  return provider?.chainId ?? null;
}

export function createMetaMaskWalletClient(): WalletClient | null {
  const provider = getMetaMaskProvider();
  if (!provider) return null;

  return createWalletClient({
    chain: monadTestnet,
    transport: custom(provider as import("viem").EIP1193Provider),
  }).extend(erc7715ProviderActions());
}
