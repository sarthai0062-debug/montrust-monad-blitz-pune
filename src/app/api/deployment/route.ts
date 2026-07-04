import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { DEPLOYED, ERC8004, MONAD_TESTNET } from "@/lib/constants";

export async function GET() {
  let deployment: Record<string, unknown> | null = null;
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "deployments.json"),
      "utf8"
    );
    deployment = JSON.parse(raw);
  } catch {
    /* use constants fallback */
  }

  const proofAnchor =
    (deployment?.contracts as { proofAnchor?: string } | undefined)
      ?.proofAnchor ?? DEPLOYED.proofAnchor;
  const agentId =
    (deployment?.agent as { id?: string } | undefined)?.id ?? DEPLOYED.agentId;

  return NextResponse.json({
    network: MONAD_TESTNET,
    contracts: {
      proofAnchor,
      identityRegistry: ERC8004.identityRegistry,
    },
    agent: {
      id: agentId,
      name: "MonTrust Photo Proof Agent",
      challengeEndpoint: "/api/agent/challenge",
    },
    deployer: deployment?.deployer ?? DEPLOYED.deployer,
    deployedAt: deployment?.deployedAt ?? null,
  });
}
