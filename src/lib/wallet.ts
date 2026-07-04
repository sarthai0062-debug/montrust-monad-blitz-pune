import type { Connector } from "wagmi";

export type WalletProviderId = "metaMask";

export interface WalletProviderInfo {
  id: WalletProviderId;
  label: string;
  icon: string;
  isMetaMask: true;
}

const METAMASK_INFO: WalletProviderInfo = {
  id: "metaMask",
  label: "MetaMask",
  icon: "🦊",
  isMetaMask: true,
};

export function detectBrowserWallets(): { metaMask: boolean } {
  if (typeof window === "undefined") {
    return { metaMask: false };
  }
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  if (!eth) return { metaMask: false };

  const providers = eth.providers ?? [eth];
  const metaMask = providers.some((p) => p.isMetaMask && !p.isRainbow);

  return { metaMask };
}

export function resolveWalletProvider(_connector?: Connector): WalletProviderInfo {
  return METAMASK_INFO;
}

export function isMetaMaskConnector(connector?: Connector): boolean {
  if (!connector) return false;
  const id = connector.id.toLowerCase();
  const name = connector.name.toLowerCase();
  return id.includes("metamask") || name.includes("metamask");
}

type EthereumProvider = {
  isMetaMask?: boolean;
  isRainbow?: boolean;
  providers?: EthereumProvider[];
};

export function pickMetaMaskConnector(
  connectors: readonly Connector[]
): Connector | undefined {
  return (
    connectors.find((c) => c.id === "metaMaskSDK") ??
    connectors.find((c) => c.id.toLowerCase().includes("metamask")) ??
    connectors.find((c) => c.name.toLowerCase().includes("metamask")) ??
    connectors[0]
  );
}
