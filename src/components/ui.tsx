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
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
          {step}
        </span>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
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
      className={`glass-panel rounded-2xl p-5 sm:p-6 ${glow ? "glass-panel-glow border-accent/25" : ""} ${className}`}
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
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed:
      "bg-rose-50 text-rose-700 border-rose-200",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200",
    pending:
      "bg-accent-subtle text-accent border-accent/25",
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
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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
      "bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:bg-[#8270ff] hover:shadow-accent/30",
    secondary:
      "border border-accent/25 bg-accent-subtle text-accent hover:bg-accent/10 hover:border-accent/40",
    ghost:
      "text-muted-foreground hover:bg-hover hover:text-foreground",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    cyan: "bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:bg-[#8270ff] font-bold",
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
      className={`w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15 ${className}`}
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
      className={`w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15 ${className}`}
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
      className={`mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground ${className}`}
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
    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
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
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/8 blur-2xl" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-accent">{sub}</p>}
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
          ? "border border-accent/35 bg-accent-subtle text-accent shadow-sm shadow-accent/10"
          : done
            ? "border border-accent/20 bg-accent-subtle/60 text-accent"
            : "border border-border bg-muted text-dim"
      }`}
    >
      {label}
    </div>
  );
}
