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
    <aside className="relative z-10 flex h-screen w-[17.5rem] shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border px-5 py-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-accent shadow-md shadow-accent/25 transition group-hover:shadow-accent/40">
            <Shield className="h-5 w-5 text-accent-foreground" />
            <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-accent-foreground/80" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">
              MonTrust
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
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
                  ? "border border-accent/25 bg-accent-subtle text-accent shadow-sm shadow-accent/10"
                  : "border border-transparent text-muted-foreground hover:border-border hover:bg-hover hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-dim group-hover:text-foreground"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <WalletButton />
      </div>
    </aside>
  );
}
