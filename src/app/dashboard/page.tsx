import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { OnChainStatusPanel } from "@/components/OnChainStatusPanel";
import { ERC8004, MONAD_TESTNET, DEPLOYED, VISION_AGENT_NAME } from "@/lib/constants";
import { ShieldCheck, Camera, UserPlus, ArrowRight, ShieldQuestion, Zap } from "lucide-react";

const modules = [
  {
    href: "/verify",
    title: "Agent Verifier",
    step: "01",
    description:
      "Resolve an ERC-8004 agent ID on Monad, validate its agent card, match the endpoint, and verify a wallet signature challenge.",
    icon: ShieldCheck,
    gradient: "from-[#6E54FF]/25 to-[#836EF9]/10",
    iconColor: "text-[#DDD7FE]",
    border: "group-hover:border-[#6E54FF]/45",
  },
  {
    href: "/photo-proof",
    title: "Vulnerability Photo Proof",
    step: "02",
    description:
      "Screenshot agent/MCP configs for security risks — vision audit, cryptographic hash, on-chain anchor on Monad Testnet.",
    icon: Camera,
    gradient: "from-[#85E6FF]/20 to-[#6E54FF]/10",
    iconColor: "text-[#85E6FF]",
    border: "group-hover:border-[#85E6FF]/40",
  },
  {
    href: "/register",
    title: "Register Your Agent",
    step: "03",
    description:
      "Mint your MonTrust vision agent on the Identity Registry and link your wallet as the signing endpoint.",
    icon: UserPlus,
    gradient: "from-[#FF8EE4]/15 to-[#6E54FF]/10",
    iconColor: "text-[#FF8EE4]",
    border: "group-hover:border-[#FF8EE4]/35",
  },
  {
    href: "/trust",
    title: "Trust Report & x402",
    step: "04",
    description:
      "Answer: Was the proof genuine? Was the agent real? Pay-When-It-Works x402 with 0.1 MON on Monad Testnet via MetaMask.",
    icon: ShieldQuestion,
    gradient: "from-[#6E54FF]/20 to-[#85E6FF]/10",
    iconColor: "text-[#85E6FF]",
    border: "group-hover:border-[#85E6FF]/35",
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Security Command Center"
        description="Verify AI agent identities on Monad, audit MCP vulnerabilities with vision AI, and settle trust with native MON x402 — all on-chain, no mock data."
      />

      <OnChainStatusPanel />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Network"
          value={MONAD_TESTNET.name}
          sub={`Chain ID ${MONAD_TESTNET.chainId}`}
        />
        <StatCard
          label="Identity Registry"
          value={
            <span className="font-mono text-base">
              {ERC8004.identityRegistry.slice(0, 10)}…
            </span>
          }
          sub="1,783+ agents indexed"
        />
        <StatCard
          label="MonTrust Agent"
          value={`#${DEPLOYED.agentId}`}
          sub={`${VISION_AGENT_NAME} · Monad Testnet`}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
          Workflow Modules
        </h2>
      </div>

      <div className="space-y-3">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="group block">
            <Card
              className={`transition-all duration-300 hover:translate-y-[-2px] ${m.border}`}
            >
              <div className="flex items-start gap-5">
                <div
                  className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${m.gradient} border border-white/10`}
                >
                  <m.icon className={`h-6 w-6 ${m.iconColor}`} />
                  <span className="absolute -right-1 -top-1 rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400">
                    {m.step}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-slate-100">
                    {m.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {m.description}
                  </p>
                </div>
                <ArrowRight className="mt-2 h-5 w-5 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-[#6E54FF]" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
