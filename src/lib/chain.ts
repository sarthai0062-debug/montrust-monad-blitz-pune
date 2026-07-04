import { createPublicClient, http, type Chain } from "viem";
import { MONAD_TESTNET } from "./constants";

export const monadTestnet = {
  id: MONAD_TESTNET.chainId,
  name: MONAD_TESTNET.name,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_TESTNET.rpcUrl] },
    public: { http: [MONAD_TESTNET.rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: MONAD_TESTNET.explorerUrl,
    },
  },
  testnet: true,
} satisfies Chain;

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_TESTNET.rpcUrl),
});
