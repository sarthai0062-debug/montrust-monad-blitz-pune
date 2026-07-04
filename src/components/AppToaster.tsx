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
            "glass-panel !border !rounded-xl !shadow-lg !shadow-black/5",
          title: "!text-foreground",
          description: "!text-muted-foreground",
          closeButton: "!bg-muted !border-border !text-muted-foreground",
        },
      }}
    />
  );
}
