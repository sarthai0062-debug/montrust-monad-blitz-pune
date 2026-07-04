import { createConfig, http } from "wagmi";
import { metaMask, injected } from "wagmi/connectors";
import { monadTestnet } from "@/lib/chain";

function rainbowProvider() {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    rainbow?: import("viem").EIP1193Provider;
    ethereum?: import("viem").EIP1193Provider & { isRainbow?: boolean };
  };
  if (w.rainbow) return w.rainbow;
  if (w.ethereum?.isRainbow) return w.ethereum;
  return undefined;
}

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    metaMask({
      dapp: {
        name: "MonTrust",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "https://montrust.app",
      },
    }),
    injected({
      target: () => {
        const provider = rainbowProvider();
        if (!provider) return undefined;
        return { id: "rainbow", name: "Rainbow", provider };
      },
    }),
  ],
  transports: {
    [monadTestnet.id]: http(monadTestnet.rpcUrls.default.http[0]),
  },
  ssr: true,
});
