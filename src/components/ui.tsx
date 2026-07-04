import { type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

export function PageHeader({
  title,
  description,
  step,
}: {
  title: string;
  description: string;
  step?: string;
}) {
  return (
    <header className="mb-10">
      {step && (
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#6E54FF]/35 bg-[#6E54FF]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#DDD7FE]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#85E6FF] animate-pulse-glow" />
          {step}
        </span>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
        {description}
      </p>
    </header>
  );
}

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`glass-panel rounded-2xl p-5 sm:p-6 ${glow ? "glass-panel-glow border-[#6E54FF]/35" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: "verified" | "failed" | "warning" | "pending";
}) {
  const styles = {
    verified:
      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]",
    failed:
      "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_20px_-8px_rgba(251,113,133,0.4)]",
    warning:
      "bg-amber-500/15 text-amber-200 border-amber-500/30 shadow-[0_0_20px_-8px_rgba(251,191,36,0.35)]",
    pending:
      "bg-[#6E54FF]/15 text-[#DDD7FE] border-[#6E54FF]/35 shadow-[0_0_20px_-8px_rgba(110,84,255,0.45)]",
  };
  const labels = {
    verified: "Verified",
    failed: "Failed",
    warning: "Warning",
    pending: "Pending",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E54FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E091C]";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "cyan";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-[#6E54FF] to-[#836EF9] text-white shadow-lg shadow-[#6E54FF]/30 hover:from-[#7B64FF] hover:to-[#9580FA] hover:shadow-[#6E54FF]/45",
    secondary:
      "border border-[#6E54FF]/35 bg-[#6E54FF]/10 text-[#DDD7FE] hover:bg-[#6E54FF]/18 hover:border-[#6E54FF]/50",
    ghost:
      "text-slate-400 hover:bg-white/5 hover:text-slate-200",
    danger:
      "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
    cyan: "bg-gradient-to-r from-[#85E6FF] to-[#6E54FF] text-[#0E091C] shadow-lg shadow-[#85E6FF]/25 hover:shadow-[#85E6FF]/40 font-bold",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5",
    lg: "px-5 py-3 text-base",
  };
  return (
    <button
      className={`${btnBase} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-white/10 bg-[#15102a]/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-[#6E54FF]/50 focus:bg-[#15102a] focus:ring-2 focus:ring-[#6E54FF]/20 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-white/10 bg-[#15102a]/80 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-[#6E54FF]/50 focus:ring-2 focus:ring-[#6E54FF]/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-100">
      {icon}
      {children}
    </h2>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#6E54FF]/15 blur-2xl" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-[#85E6FF]/80">{sub}</p>}
    </Card>
  );
}

export function StepPill({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border border-[#85E6FF]/45 bg-[#85E6FF]/12 text-[#85E6FF] shadow-[0_0_24px_-8px_rgba(133,230,255,0.45)]"
          : done
            ? "border border-[#6E54FF]/30 bg-[#6E54FF]/10 text-[#DDD7FE]"
            : "border border-white/5 bg-white/[0.02] text-slate-600"
      }`}
    >
      {label}
    </div>
  );
}
