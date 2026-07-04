"use client";

import { useEffect, useState, useRef } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { formatUnits } from "viem";
import { monadTestnet } from "@/lib/chain";
import { MONAD_TESTNET } from "@/lib/constants";
import {
  detectBrowserWallets,
  pickConnectorForProvider,
  resolveWalletProvider,
  type WalletProviderId,
} from "@/lib/wallet";
import {
  getMetaMaskChainIdHex,
  getMetaMaskProvider,
  isMetaMaskInstalled,
} from "@/lib/metamaskWallet";
import { notify } from "@/lib/toast";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  Wallet,
  X,
} from "lucide-react";

const WALLET_OPTIONS: {
  id: WalletProviderId;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "metaMask",
    label: "MetaMask",
    description: "Browser extension or mobile app",
    icon: "🦊",
  },
  {
    id: "rainbow",
    label: "Rainbow",
    description: "Rainbow browser extension",
    icon: "🌈",
  },
];

export function NetworkBadge() {
  return (
    <div className="flex shrink-0 flex-col justify-center rounded-xl border border-accent/20 bg-accent-subtle px-2.5 py-2 text-center">
      <p className="text-[9px] font-bold uppercase leading-tight tracking-wider text-muted-foreground">
        {MONAD_TESTNET.name}
      </p>
      <p className="mt-0.5 font-mono text-[10px] font-semibold text-accent">
        {MONAD_TESTNET.chainId}
      </p>
    </div>
  );
}

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [installed, setInstalled] = useState({ metaMask: false, rainbow: false });

  const { address, status, connector } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: monadTestnet.id,
  });

  const provider = resolveWalletProvider(connector);
  const onMonadTestnet = chainId === monadTestnet.id;
  const wrongChain = status === "connected" && !onMonadTestnet;
  const isConnected = status === "connected" && !!address;
  const isReconnecting =
    status === "connecting" || status === "reconnecting";

  const wasConnected = useRef(false);
  const hadWrongChain = useRef(false);
  const walletHydrated = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setInstalled(detectBrowserWallets()), [modalOpen]);
  useEffect(() => {
    if (!modalOpen && !isConnected) return;
    const eth = getMetaMaskProvider();
    if (!eth?.on) return;
    const onChain = () => getMetaMaskChainIdHex();
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [modalOpen, isConnected]);

  useEffect(() => {
    if (isConnected) setModalOpen(false);
  }, [isConnected]);

  useEffect(() => {
    if (!mounted) return;
    if (!walletHydrated.current) {
      walletHydrated.current = true;
      wasConnected.current = isConnected;
      hadWrongChain.current = isConnected && !onMonadTestnet;
      return;
    }
    if (isConnected && address) {
      if (!wasConnected.current) {
        notify.walletConnected(address);
      }
      wasConnected.current = true;
    } else if (wasConnected.current) {
      notify.walletDisconnected();
      wasConnected.current = false;
    }
  }, [mounted, isConnected, address]);

  useEffect(() => {
    if (!mounted || !walletHydrated.current) return;
    if (isConnected && onMonadTestnet && hadWrongChain.current) {
      notify.chainSwitched();
    }
    hadWrongChain.current = isConnected && !onMonadTestnet;
  }, [mounted, isConnected, onMonadTestnet]);

  useEffect(() => {
    if (connectError) {
      notify.error("Connection failed", { description: connectError.message });
    }
  }, [connectError]);

  function connectWallet(providerId: WalletProviderId) {
    const target = pickConnectorForProvider(connectors, providerId);
    if (!target) return;
    connect({ connector: target, chainId: monadTestnet.id });
  }

  if (!mounted || isReconnecting) {
    return (
      <div className="min-h-[52px] flex-1 animate-pulse rounded-xl bg-muted" />
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex min-w-0 flex-1 items-stretch gap-2">
        <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-accent/20 bg-accent-subtle px-3 py-2">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate font-mono text-xs font-semibold text-foreground">
              {address.slice(0, 6)}…{address.slice(-4)}
            </p>
            {onMonadTestnet ? (
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
            )}
          </div>
          <p className="mt-0.5 text-xs font-bold text-accent">
            {balanceLoading ? (
              <span className="text-muted-foreground">Loading…</span>
            ) : balance ? (
              <>
                {Number(formatUnits(balance.value, balance.decimals)).toFixed(2)}{" "}
                {balance.symbol}
              </>
            ) : onMonadTestnet ? (
              "0.00 MON"
            ) : (
              <span className="font-normal text-amber-600">Wrong network</span>
            )}
          </p>
          {wrongChain && (
            <button
              type="button"
              disabled={switching}
              onClick={() => switchChain({ chainId: monadTestnet.id })}
              className="mt-1.5 w-full rounded-md bg-amber-500 py-1 text-[10px] font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {switching ? "Switching…" : "Switch to Monad"}
            </button>
          )}
        </div>

        <NetworkBadge />

        <button
          type="button"
          onClick={() => disconnect()}
          title={`Disconnect ${provider.label}`}
          className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-card px-2 text-muted-foreground transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-w-0 flex-1 items-stretch gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => setModalOpen(true)}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 transition hover:bg-[#8270ff] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {isPending ? "Connecting…" : "Connect Wallet"}
          </span>
        </button>
        <NetworkBadge />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setModalOpen(false)}
            aria-hidden
          />
          <div className="glass-panel glass-panel-glow relative w-full max-w-sm rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Connect a wallet</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-hover hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-3 text-xs text-muted-foreground">
              Connect with MetaMask or Rainbow on{" "}
              <strong className="text-accent">Monad Testnet (10143)</strong>
            </p>

            <div className="space-y-2">
              {WALLET_OPTIONS.map((wallet) => {
                const isInstalled =
                  wallet.id === "metaMask"
                    ? installed.metaMask || isMetaMaskInstalled()
                    : installed.rainbow;
                return (
                  <button
                    key={wallet.id}
                    type="button"
                    disabled={isPending || !isInstalled}
                    onClick={() => connectWallet(wallet.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-accent/30 hover:bg-accent-subtle disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-2xl" aria-hidden>
                      {wallet.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {wallet.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {wallet.description}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                        isInstalled ? "text-emerald-600" : "text-dim"
                      }`}
                    >
                      {isInstalled ? "Detected" : "Not installed"}
                    </span>
                  </button>
                );
              })}
            </div>

            {connectError && (
              <p className="mt-3 text-xs text-rose-600">{connectError.message}</p>
            )}

            <p className="mt-4 text-center text-[10px] text-muted-foreground">
              Need MON?{" "}
              <a
                href={MONAD_TESTNET.faucetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                faucet.monad.xyz
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
