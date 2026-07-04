export const MONAD_TESTNET = {
  chainId: 10143,
  name: "Monad Testnet",
  rpcUrl: "https://testnet-rpc.monad.xyz",
  explorerUrl: "https://testnet.monadexplorer.com",
  faucetUrl: "https://faucet.monad.xyz",
} as const;

/** Live Monad Testnet ERC-8004 registry (1783+ agents on 8004scan) */
export const ERC8004 = {
  /** Active testnet registry — reads/writes work here */
  identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const,
  /** Listed in Monad docs; empty on current testnet RPC */
  identityRegistryDocs: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const,
  reputationRegistry: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63" as const,
} as const;

/** Default deployer / demo wallet for status checks */
export const DEFAULT_WALLET =
  "0xda49D74234318880a2b6af6BF76B390A55284e73" as const;

/** Well-known demo agent on Monad testnet — real on-chain registration */
export const DEMO_AGENT = {
  id: "1",
  name: "Monad Demo Agent",
  mcpEndpoint: "https://monad-demo-agent.example.com/mcp",
  owner: "0x133603465adde7c39fa0e6e34b264e1573e1fd08",
} as const;

export const VISION_AGENT_NAME = "MonTrust Photo Proof Agent";

/** NVIDIA NIM vision model — see .env.example NVIDIA_VISION_MODEL */
export const VISION_MODEL = "minimaxai/minimax-m3";

/** Deployed on Monad Testnet — see data/deployments.json */
export const DEPLOYED = {
  proofAnchor: "0xc6d3bba40408ad9a706fde69716c1adbdb7aea75" as const,
  agentId: "1786" as const,
  deployer: "0xda49D74234318880a2b6af6BF76B390A55284e73" as const,
} as const;
