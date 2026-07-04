"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { decodeEventLog } from "viem";
import { AppShell } from "@/components/AppShell";
import { Card, PageHeader, Button, SectionTitle } from "@/components/ui";
import { ERC8004 } from "@/lib/constants";
import { monadTestnet } from "@/lib/chain";
import { identityRegistryAbi } from "@/abi/identityRegistry";
import { buildMonTrustAgentCard } from "@/lib/erc8004";
import { buildDataUriJsonBase64 } from "@/lib/base64Json";
import { isMetaMaskInstalled } from "@/lib/metamaskWallet";
import { notify } from "@/lib/toast";
import { Loader2, CheckCircle2, UserPlus, AlertTriangle } from "lucide-react";

const AGENT_ID_KEY = "montrust-agent-id";

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChain, isPending: switching } = useSwitchChain();
  const onMonadTestnet = chainId === monadTestnet.id;

  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending, error: writeError } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  useEffect(() => {
    const saved = localStorage.getItem(AGENT_ID_KEY);
    if (saved) setRegisteredId(saved);
  }, []);

  useEffect(() => {
    if (writeError) {
      const msg = writeError.message;
      setError(msg);
      notify.error("Registration failed", { description: msg });
    }
  }, [writeError]);

  async function registerAgent() {
    if (!isMetaMaskInstalled()) {
      const msg = "Install MetaMask to register your agent on Monad Testnet.";
      setError(msg);
      notify.error("MetaMask required", { description: msg });
      return;
    }
    if (!address) {
      setError("Connect MetaMask on Monad Testnet first.");
      notify.error("Wallet required", {
        description: "Connect MetaMask on Monad Testnet first.",
      });
      return;
    }
    if (!onMonadTestnet) {
      setError("Switch MetaMask to Monad Testnet (chain 10143) before registering.");
      notify.error("Wrong network", {
        description: "Switch MetaMask to Monad Testnet (10143).",
      });
      return;
    }

    setError(null);
    const card = buildMonTrustAgentCard(origin, address);
    const uri = buildDataUriJsonBase64({
      ...card,
      registrations: [
        {
          agentId: "PENDING",
          agentRegistry: `eip155:10143:${ERC8004.identityRegistry}`,
        },
      ],
    });

    notify.loading("Submitting registration to Monad Testnet…");
    writeContract({
      address: ERC8004.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "register",
      args: [uri],
      chainId: monadTestnet.id,
      gas: 800_000n,
    });
  }

  useEffect(() => {
    if (!isSuccess || !txHash || !publicClient) return;
    publicClient.getTransactionReceipt({ hash: txHash }).then((receipt) => {
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: identityRegistryAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "Registered") {
            const id = (decoded.args as { agentId: bigint }).agentId.toString();
            setRegisteredId(id);
            localStorage.setItem(AGENT_ID_KEY, id);
          }
        } catch {
          /* skip unrelated logs */
        }
      }
    });
  }, [isSuccess, txHash, publicClient]);

  useEffect(() => {
    if (registeredId && txHash) {
      notify.dismiss();
      notify.txSuccess(
        `Agent #${registeredId} registered on Monad`,
        txHash
      );
    }
  }, [registeredId, txHash]);

  const challengeEndpoint = `${origin}/api/agent/challenge`;

  const steps = [
    <>
      Connect <strong className="text-foreground">MetaMask</strong> with MON on{" "}
      <strong className="text-foreground">Monad Testnet</strong> (chain 10143).
      Faucet: faucet.monad.xyz
    </>,
    <>
      Register agent — mints NFT on Identity Registry{" "}
      <code className="text-accent">
        {ERC8004.identityRegistry.slice(0, 10)}…
      </code>
    </>,
    <>
      Use your new agent ID in Photo Proof and verify with endpoint{" "}
      <code className="text-accent">{challengeEndpoint}</code>
    </>,
  ];

  return (
    <AppShell>
      <PageHeader
        step="Module 3 · Registration"
        title="Register MonTrust Vision Agent"
        description="Mint an ERC-8004 identity on Monad Testnet. Your agent card lists this app's challenge endpoint and your MetaMask wallet for signature verification."
      />

      <Card className="mb-6" glow>
        <ol className="space-y-4 text-sm text-muted-foreground">
          {steps.map((content, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent-subtle text-xs font-bold text-accent">
                {i + 1}
              </span>
              <span className="pt-0.5">{content}</span>
            </li>
          ))}
        </ol>

        {isConnected && !onMonadTestnet && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>MetaMask is on the wrong network.</span>
            <Button
              size="sm"
              variant="secondary"
              disabled={switching}
              onClick={() => switchChain({ chainId: monadTestnet.id })}
            >
              {switching ? "Switching…" : "Switch to Monad Testnet"}
            </Button>
          </div>
        )}

        <Button
          size="lg"
          className="mt-6"
          onClick={registerAgent}
          disabled={
            !isConnected || !onMonadTestnet || isPending || confirming
          }
        >
          {(isPending || confirming) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <UserPlus className="h-4 w-4" />
          Register Agent On-Chain
        </Button>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {registeredId && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="text-emerald-800">
              <p className="font-semibold">Agent registered!</p>
              <p className="mt-0.5">
                Agent ID: <strong>#{registeredId}</strong> — saved for Photo
                Proof and Agent Verifier.
              </p>
              {txHash && (
                <a
                  href={`${monadTestnet.blockExplorers.default.url}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-accent hover:underline"
                >
                  View transaction
                </a>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Agent card preview</SectionTitle>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted p-4 font-mono text-xs text-muted-foreground">
          {JSON.stringify(
            address
              ? buildMonTrustAgentCard(origin, address)
              : { note: "Connect MetaMask to preview" },
            null,
            2
          )}
        </pre>
      </Card>
    </AppShell>
  );
}
