"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Camera,
  UserPlus,
  History,
  BookOpen,
  Shield,
  ShieldQuestion,
  Sparkles,
} from "lucide-react";
import { WalletButton } from "./WalletButton";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/verify", label: "Agent Verifier", icon: ShieldCheck },
  { href: "/photo-proof", label: "Vuln Screenshots", icon: Camera },
  { href: "/register", label: "Register Agent", icon: UserPlus },
  { href: "/trust", label: "Trust Report", icon: ShieldQuestion },
  { href: "/history", label: "Activity", icon: History },
  { href: "/about", label: "Project Info", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 flex h-screen w-[17.5rem] shrink-0 flex-col border-r border-[#6E54FF]/10 bg-[#0E091C]/85 backdrop-blur-xl">
      <div className="border-b border-[#6E54FF]/10 px-5 py-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6E54FF] to-[#836EF9] shadow-lg shadow-[#6E54FF]/35 transition group-hover:shadow-[#6E54FF]/55">
            <Shield className="h-5 w-5 text-white" />
            <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-[#85E6FF]" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-[#FBFAF9]">
              MonTrust
            </p>
            <p className="text-[11px] font-medium text-[#DDD7FE]/80">
              Agent Security Suite
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border border-[#6E54FF]/40 bg-gradient-to-r from-[#6E54FF]/22 to-[#836EF9]/10 text-white shadow-[0_0_30px_-12px_rgba(110,84,255,0.65)]"
                  : "border border-transparent text-slate-400 hover:border-[#6E54FF]/15 hover:bg-[#6E54FF]/5 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-[#85E6FF]" : "text-slate-500 group-hover:text-[#DDD7FE]"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#6E54FF]/10 p-4">
        <WalletButton />
      </div>
    </aside>
  );
}
