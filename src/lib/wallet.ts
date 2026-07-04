import type { Connector } from "wagmi";

export type WalletProviderId = "metaMask" | "rainbow" | "injected" | "unknown";

export interface WalletProviderInfo {
  id: WalletProviderId;
  label: string;
  icon: string;
  isMetaMask: boolean;
  isRainbow: boolean;
}

const PROVIDER_META: Record<
  WalletProviderId,
  Omit<WalletProviderInfo, "id" | "isMetaMask" | "isRainbow">
> = {
  metaMask: { label: "MetaMask", icon: "🦊" },
  rainbow: { label: "Rainbow", icon: "🌈" },
  injected: { label: "Browser Wallet", icon: "👛" },
  unknown: { label: "Wallet", icon: "🔗" },
};

export function detectBrowserWallets(): {
  metaMask: boolean;
  rainbow: boolean;
} {
  if (typeof window === "undefined") {
    return { metaMask: false, rainbow: false };
  }
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  if (!eth) return { metaMask: false, rainbow: false };

  const providers = eth.providers ?? [eth];
  const metaMask = providers.some((p) => p.isMetaMask && !p.isRainbow);
  const rainbow =
    Boolean((window as Window & { rainbow?: unknown }).rainbow) ||
    providers.some((p) => p.isRainbow === true);

  return { metaMask, rainbow };
}

export function resolveWalletProvider(
  connector?: Connector
): WalletProviderInfo {
  const name = connector?.name?.toLowerCase() ?? "";
  const id = connector?.id?.toLowerCase() ?? "";

  if (id.includes("metamask") || name.includes("metamask")) {
    return { id: "metaMask", ...PROVIDER_META.metaMask, isMetaMask: true, isRainbow: false };
  }
  if (id.includes("rainbow") || name.includes("rainbow")) {
    return { id: "rainbow", ...PROVIDER_META.rainbow, isMetaMask: false, isRainbow: true };
  }
  if (id.includes("injected") || name.includes("injected")) {
    const detected = detectBrowserWallets();
    if (detected.rainbow) {
      return { id: "rainbow", ...PROVIDER_META.rainbow, isMetaMask: false, isRainbow: true };
    }
    if (detected.metaMask) {
      return { id: "metaMask", ...PROVIDER_META.metaMask, isMetaMask: true, isRainbow: false };
    }
    return { id: "injected", ...PROVIDER_META.injected, isMetaMask: false, isRainbow: false };
  }

  return { id: "unknown", ...PROVIDER_META.unknown, isMetaMask: false, isRainbow: false };
}

type EthereumProvider = {
  isMetaMask?: boolean;
  isRainbow?: boolean;
  providers?: EthereumProvider[];
};

export function pickConnectorForProvider(
  connectors: readonly Connector[],
  provider: WalletProviderId
): Connector | undefined {
  if (provider === "metaMask") {
    return (
      connectors.find((c) => c.id === "metaMaskSDK") ??
      connectors.find((c) => c.id.toLowerCase().includes("metamask")) ??
      connectors.find((c) => c.name.toLowerCase().includes("metamask"))
    );
  }
  if (provider === "rainbow") {
    return (
      connectors.find((c) => c.id === "rainbow") ??
      connectors.find((c) => c.name.toLowerCase() === "rainbow")
    );
  }
  return connectors.find((c) => c.id === "injected");
}
