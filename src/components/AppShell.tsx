import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-bg relative flex min-h-screen">
      <div className="pointer-events-none absolute inset-0 grid-overlay" />
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
