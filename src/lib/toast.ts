import { toast } from "sonner";
import { MONAD_TESTNET } from "@/lib/constants";

type ToastOpts = {
  description?: string;
  duration?: number;
};

export const notify = {
  success(title: string, opts?: ToastOpts) {
    toast.success(title, {
      description: opts?.description,
      duration: opts?.duration ?? 4500,
    });
  },

  error(title: string, opts?: ToastOpts) {
    toast.error(title, {
      description: opts?.description,
      duration: opts?.duration ?? 6000,
    });
  },

  info(title: string, opts?: ToastOpts) {
    toast.info(title, {
      description: opts?.description,
      duration: opts?.duration ?? 4000,
    });
  },

  loading(title: string, opts?: ToastOpts): string | number {
    return toast.loading(title, { description: opts?.description });
  },

  dismiss(id?: string | number) {
    toast.dismiss(id);
  },

  /** On-chain transaction confirmed — with explorer link action */
  txSuccess(label: string, txHash: string) {
    const short = `${txHash.slice(0, 10)}…${txHash.slice(-6)}`;
    toast.success(label, {
      description: `Tx ${short}`,
      duration: 8000,
      action: {
        label: "View on explorer",
        onClick: () => {
          window.open(
            `${MONAD_TESTNET.explorerUrl}/tx/${txHash}`,
            "_blank",
            "noopener,noreferrer"
          );
        },
      },
    });
  },

  /** Wallet connected */
  walletConnected(address: string) {
    notify.success("Wallet connected", {
      description: `${address.slice(0, 6)}…${address.slice(-4)} on Monad Testnet`,
    });
  },

  walletDisconnected() {
    notify.info("Wallet disconnected");
  },

  chainSwitched() {
    notify.success("Switched to Monad Testnet", {
      description: `Chain ID ${MONAD_TESTNET.chainId}`,
    });
  },
};
