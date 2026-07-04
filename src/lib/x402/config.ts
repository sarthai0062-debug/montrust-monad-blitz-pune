import { parseEther } from "viem";
import { DEPLOYED, MONAD_TESTNET } from "@/lib/constants";

/**
 * Monad testnet x402 — MetaMask native MON payments.
 * MetaMask ERC-7710 facilitator only supports mainnet (eip155:143).
 * Testnet uses Monad facilitator + MetaMask sendTransaction for 0.1 MON.
 * @see https://docs.monad.xyz/guides/x402
 */
export const MONAD_TESTNET_X402 = {
  chainId: MONAD_TESTNET.chainId,
  networkId: "eip155:10143" as const,
  name: MONAD_TESTNET.name,
  rpcUrl: MONAD_TESTNET.rpcUrl,
  explorerUrl: MONAD_TESTNET.explorerUrl,
} as const;

/** Circle testnet USDC — for optional EIP-3009 path via molandak facilitator */
export const MONAD_TESTNET_USDC = {
  symbol: "USDC",
  address: "0x534b2f3A21130d7a60830c2Df862319e593943A3" as const,
  decimals: 6,
} as const;

export const MONAD_TESTNET_WMON = {
  symbol: "WMON",
  address: "0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541" as const,
  decimals: 18,
} as const;

const paymentAmountMon =
  process.env.X402_PAYMENT_AMOUNT_MON ?? "0.1";

export const X402_CONFIG = {
  networkId: MONAD_TESTNET_X402.networkId,
  chainId: MONAD_TESTNET_X402.chainId,
  facilitatorUrl: "https://x402-facilitator.molandak.org",
  payTo:
    (process.env.X402_SELLER_ADDRESS as `0x${string}` | undefined) ??
    DEPLOYED.deployer,
  /** Native MON charged per x402 request (MetaMask sendTransaction) */
  paymentAmountMon,
  paymentAmountWei: parseEther(paymentAmountMon),
  paymentAsset: "MON" as const,
  visionPrice: `${paymentAmountMon} MON`,
  trustReportPrice: `${paymentAmountMon} MON`,
  /** Legacy fields for config API */
  asset: MONAD_TESTNET_WMON.address,
  assetSymbol: "MON",
  transferMethod: "native-mon" as const,
} as const;

export const VISION_X402_ROUTE = "GET /api/x402/vision" as const;
export const TRUST_REPORT_X402_ROUTE = "GET /api/x402/trust-report" as const;

export const MON_PAYMENT_TX_HEADER = "X-MON-PAYMENT-TX" as const;
