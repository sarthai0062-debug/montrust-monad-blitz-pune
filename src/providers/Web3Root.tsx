import { cookieToInitialState } from "wagmi";
import { headers } from "next/headers";
import { wagmiConfig } from "@/config/wagmi";
import { Web3Provider } from "@/providers/Web3Provider";

export async function Web3Root({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const cookie = headersList.get("cookie");
  const initialState = cookieToInitialState(wagmiConfig, cookie ?? undefined);

  return (
    <Web3Provider initialState={initialState}>{children}</Web3Provider>
  );
}
