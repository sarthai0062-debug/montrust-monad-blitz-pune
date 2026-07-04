import { AppShell } from "@/components/AppShell";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { ERC8004, MONAD_TESTNET } from "@/lib/constants";
import { Shield, Camera, Globe, CreditCard, Wallet } from "lucide-react";

const sections = [
  {
    icon: Shield,
    iconColor: "text-accent",
    title: "Agent Verifier Module",
    items: [
      <>Reads Identity Registry at <code className="text-accent text-xs">{ERC8004.identityRegistry}</code></>,
      "Fetches and validates agent card JSON (data:, IPFS, HTTPS)",
      "Compares submitted endpoint against registered services",
      "Sends nonce challenge and verifies EIP-191 wallet signature",
    ],
  },
  {
    icon: Camera,
    iconColor: "text-accent",
    title: "Vulnerability Photo Proof",
    items: [
      "Screenshot audits for MCP exposure, agent spoofing, and credential leaks",
      "Real vision via NVIDIA NIM — MiniMax-M3 multimodal model",
      "Strict JSON output: answer, confidence, reason",
      "Keccak256 hash of canonical proof JSON",
      "Deploy ProofAnchor contract and anchor hash on Monad Testnet",
    ],
  },
  {
    icon: Globe,
    iconColor: "text-violet-400",
    title: "Network",
    isNetwork: true,
  },
  {
    icon: CreditCard,
    iconColor: "text-emerald-600",
    title: "Trust Report & x402 (Step 4)",
    items: [
      "Answers six trust questions: genuine proof, photo tampering, agent spoofing",
      "MetaMask Smart Accounts Kit — ERC-7715 permissions ready via wallet client",
      "x402 Pay-When-It-Works — HTTP 402 with 0.1 MON on Monad Testnet via MetaMask",
      "Native MON transfer verified on-chain before resource unlock",
    ],
  },
  {
    icon: Wallet,
    iconColor: "text-amber-600",
    title: "Your wallet",
    items: [
      <>Connect <code className="text-accent text-xs">0xda49…4e73</code> on Monad Testnet. Register your vision agent, deploy ProofAnchor once, then run the full verify → photo → anchor flow.</>,
    ],
  },
];

export default function AboutPage() {
  return (
    <AppShell>
      <PageHeader
        title="Project Information"
        description="MonTrust combines ERC-8004 agent verification with tamper-evident photo proof workflows on Monad."
      />

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.title} glow>
            <SectionTitle
              icon={
                <section.icon className={`h-4 w-4 ${section.iconColor}`} />
              }
            >
              {section.title}
            </SectionTitle>

            {section.isNetwork ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-dim">Chain</dt>
                  <dd className="mt-1 text-foreground">{MONAD_TESTNET.name}</dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-dim">Chain ID</dt>
                  <dd className="mt-1 text-foreground">{MONAD_TESTNET.chainId}</dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3 sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-dim">RPC</dt>
                  <dd className="mt-1 font-mono text-xs text-muted-foreground">
                    {MONAD_TESTNET.rpcUrl}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/50 p-3 sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-dim">Faucet</dt>
                  <dd className="mt-1">
                    <a
                      href={MONAD_TESTNET.faucetUrl}
                      className="text-accent hover:underline"
                    >
                      {MONAD_TESTNET.faucetUrl}
                    </a>
                  </dd>
                </div>
              </dl>
            ) : (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.items?.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-accent">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
