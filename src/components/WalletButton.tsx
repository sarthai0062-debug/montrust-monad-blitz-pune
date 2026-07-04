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
  isMetaMaskConnector,
  pickMetaMaskConnector,
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
  ExternalLink,
  Loader2,
  LogOut,
  Wallet,
} from "lucide-react";

const METAMASK_INSTALL_URL = "https://metamask.io/download/";

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
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false);

  const { address, status, connector } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: monadTestnet.id,
  });

  const onMonadTestnet = chainId === monadTestnet.id;
  const wrongChain = status === "connected" && !onMonadTestnet;
  const isConnected = status === "connected" && !!address;
  const isReconnecting =
    status === "connecting" || status === "reconnecting";

  const wasConnected = useRef(false);
  const hadWrongChain = useRef(false);
  const walletHydrated = useRef(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setMetaMaskInstalled(detectBrowserWallets().metaMask || isMetaMaskInstalled());
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    if (!isMetaMaskConnector(connector)) {
      disconnect();
    }
  }, [connector, disconnect, isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    const eth = getMetaMaskProvider();
    if (!eth?.on) return;
    const onChain = () => getMetaMaskChainIdHex();
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("chainChanged", onChain);
    };
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
      notify.error("MetaMask connection failed", { description: connectError.message });
    }
  }, [connectError]);

  function connectMetaMask() {
    if (!metaMaskInstalled) {
      notify.error("MetaMask required", {
        description: "Install MetaMask to connect and pay on Monad Testnet.",
      });
      return;
    }

    const target = pickMetaMaskConnector(connectors);
    if (!target) {
      notify.error("MetaMask unavailable", {
        description: "MetaMask connector could not be initialized.",
      });
      return;
    }

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
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            MetaMask
          </p>
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
              {switching ? "Switching…" : "Switch MetaMask to Monad"}
            </button>
          )}
        </div>

        <NetworkBadge />

        <button
          type="button"
          onClick={() => disconnect()}
          title="Disconnect MetaMask"
          className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-card px-2 text-muted-foreground transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex min-w-0 flex-1 items-stretch gap-2">
        <button
          type="button"
          disabled={isPending || !metaMaskInstalled}
          onClick={connectMetaMask}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 transition hover:bg-[#8270ff] disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {isPending ? "Connecting…" : "Connect MetaMask"}
          </span>
        </button>
        <NetworkBadge />
      </div>

      {!metaMaskInstalled && (
        <a
          href={METAMASK_INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-accent hover:underline"
        >
          Install MetaMask
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {connectError && (
        <p className="text-[10px] text-rose-600">{connectError.message}</p>
      )}

      <p className="text-center text-[10px] text-muted-foreground">
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
  );
}
