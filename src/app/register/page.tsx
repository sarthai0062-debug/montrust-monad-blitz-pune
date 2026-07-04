"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { decodeEventLog } from "viem";
import { AppShell } from "@/components/AppShell";
import { Card, PageHeader, Button, SectionTitle } from "@/components/ui";
import { ERC8004 } from "@/lib/constants";
import { identityRegistryAbi } from "@/abi/identityRegistry";
import { buildMonTrustAgentCard } from "@/lib/erc8004";
import { notify } from "@/lib/toast";
import { Loader2, CheckCircle2, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [registeredId, setRegisteredId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  async function registerAgent() {
    if (!address) {
      setError("Connect your wallet on Monad Testnet first.");
      notify.error("Wallet required", {
        description: "Connect your wallet on Monad Testnet first.",
      });
      return;
    }

    setError(null);
    const card = buildMonTrustAgentCard(origin, address);
    const json = JSON.stringify({
      ...card,
      registrations: [
        {
          agentId: "PENDING",
          agentRegistry: `eip155:10143:${ERC8004.identityRegistry}`,
        },
      ],
    });
    const uri = `data:application/json;base64,${btoa(json)}`;

    writeContract({
      address: ERC8004.identityRegistry,
      abi: identityRegistryAbi,
      functionName: "register",
      args: [uri],
    });
  }

  useEffect(() => {
    if (!isSuccess || !txHash || !publicClient || registeredId) return;
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
          }
        } catch {
          /* skip */
        }
      }
    });
  }, [isSuccess, txHash, publicClient, registeredId]);

  useEffect(() => {
    if (registeredId && txHash) {
      notify.txSuccess(
        `Agent #${registeredId} registered`,
        txHash
      );
    }
  }, [registeredId, txHash]);

  const challengeEndpoint = `${origin}/api/agent/challenge`;

  const steps = [
    <>
      Connect wallet with MON on{" "}
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
        description="Mint an ERC-8004 identity on Monad Testnet. Your agent card lists this app's challenge endpoint and your wallet for signature verification."
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

        <Button
          size="lg"
          className="mt-6"
          onClick={registerAgent}
          disabled={!isConnected || isPending || confirming}
        >
          {(isPending || confirming) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <UserPlus className="h-4 w-4" />
          Register Agent On-Chain
        </Button>
        {error && (
          <p className="mt-3 text-sm text-rose-600">{error}</p>
        )}
        {registeredId && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Agent registered!</p>
              <p className="text-emerald-700/80">
                Agent ID: <strong>#{registeredId}</strong> — use this in Photo
                Proof and Agent Verifier.
              </p>
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
              : { note: "Connect wallet to preview" },
            null,
            2
          )}
        </pre>
      </Card>
    </AppShell>
  );
}
