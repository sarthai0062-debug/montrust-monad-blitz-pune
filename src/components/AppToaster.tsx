"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      expand
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "glass-panel !border !rounded-xl !shadow-lg !shadow-[#6E54FF]/10",
          title: "!text-[#FBFAF9]",
          description: "!text-[#a8a3b8]",
          closeButton: "!bg-[#15102a] !border-white/10 !text-slate-400",
        },
      }}
    />
  );
}
