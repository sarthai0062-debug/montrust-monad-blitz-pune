import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

/** Server-side EIP-191 signing for the registered agent wallet (dev/demo). */
export async function signAgentChallengeMessageAsync(
  message: string
): Promise<{ signature: Hex; signer: `0x${string}` } | null> {
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key?.startsWith("0x")) return null;

  const account = privateKeyToAccount(key as `0x${string}`);
  const signature = await account.signMessage({ message });
  return { signature, signer: account.address };
}
