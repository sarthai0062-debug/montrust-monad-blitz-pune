import { createConfig, http } from "wagmi";
import { metaMask } from "wagmi/connectors";
import { monadTestnet } from "@/lib/chain";

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
  ],
  transports: {
    [monadTestnet.id]: http(monadTestnet.rpcUrls.default.http[0]),
  },
  multiInjectedProviderDiscovery: false,
  ssr: true,
});
