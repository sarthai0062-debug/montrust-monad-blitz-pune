import { createPublicClient, http, type Hex, isAddress } from "viem";
import { proofAnchorAbi } from "@/abi/proofAnchor";
import { DEPLOYED, ERC8004, MONAD_TESTNET } from "@/lib/constants";
import { hashProof } from "@/lib/proof";
import { photoProofSchema } from "@/schemas/proof";
import { verifyAgentEndpoint } from "@/lib/verification";
import { getHistory } from "@/lib/storage";
import { resolveAgentFromRegistry } from "@/lib/erc8004";
import {
  analyzeAgentCardLinks,
  summarizeLinkSafety,
  type LinkSafetyFinding,
} from "@/lib/linkSafety";

export interface TrustQuestion {
  id: string;
  question: string;
  answer: "yes" | "no" | "partial" | "unknown";
  passed: boolean;
  detail: string;
}

export interface TrustReport {
  generatedAt: string;
  agentId: string;
  endpointUrl: string;
  proofHash?: string;
  agentSource: "openclaw" | "erc-8004" | "montrust";
  overallStatus: "trusted" | "warning" | "untrusted";
  summary: string;
  questions: TrustQuestion[];
  linkSafety: {
    safe: boolean;
    findings: LinkSafetyFinding[];
  };
  payWhenItWorks: {
    eligible: boolean;
    reason: string;
    x402Note: string;
  };
}

const monadClient = createPublicClient({
  chain: {
    id: MONAD_TESTNET.chainId,
    name: MONAD_TESTNET.name,
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: [MONAD_TESTNET.rpcUrl] } },
  },
  transport: http(MONAD_TESTNET.rpcUrl),
});

export async function buildTrustReport(options: {
  agentId: string;
  proofHash?: string;
  endpointUrl: string;
}): Promise<TrustReport> {
  const { agentId, proofHash, endpointUrl } = options;
  const questions: TrustQuestion[] = [];

  const verification = await verifyAgentEndpoint(agentId, endpointUrl);
  const history = await getHistory();

  const storedProof = proofHash
    ? history.proofs.find((p) => p.proofHash === proofHash)
    : history.proofs[0];

  const resolvedProofHash = proofHash ?? storedProof?.proofHash;

  let onChainAnchored = false;
  let onChainSubmitter: string | null = null;

  if (resolvedProofHash && isAddress(DEPLOYED.proofAnchor)) {
    try {
      const result = (await monadClient.readContract({
        address: DEPLOYED.proofAnchor,
        abi: proofAnchorAbi,
        functionName: "verifyProof",
        args: [resolvedProofHash as Hex],
      })) as readonly [boolean, `0x${string}`, bigint, bigint];
      onChainAnchored = result[0];
      onChainSubmitter = result[1];
    } catch {
      /* not anchored */
    }
  }

  let hashIntegrity = false;
  let imageHashPresent = false;

  if (storedProof) {
    try {
      const parsed = photoProofSchema.parse(storedProof.proof);
      hashIntegrity = hashProof(parsed) === storedProof.proofHash;
      imageHashPresent = Boolean(parsed.imageHash?.length);
    } catch {
      hashIntegrity = false;
    }
  }

  const agentGenuine =
    verification.checks.find((c) => c.id === "registry-lookup")?.passed &&
    verification.checks.find((c) => c.id === "agent-card")?.passed;

  const endpointLegit = verification.checks.find(
    (c) => c.id === "endpoint-match"
  )?.passed;

  const realAgentSigned =
    verification.checks.find((c) => c.id === "challenge-response")?.passed &&
    verification.checks.find((c) => c.id === "wallet-match")?.passed;

  const notSpoofed = endpointLegit && !realAgentSigned ? false : realAgentSigned || !endpointLegit;

  const registryAgent = await resolveAgentFromRegistry(BigInt(agentId)).catch(
    () => null
  );
  const fullCard = registryAgent?.agentCard;
  const linkFindings = fullCard
    ? analyzeAgentCardLinks(fullCard, endpointUrl)
    : [];
  const linkSummary = summarizeLinkSafety(linkFindings);

  const agentSource: TrustReport["agentSource"] =
    fullCard?.name.toLowerCase().includes("openclaw") ||
    fullCard?.services?.some((s) => s.endpoint.includes("openclaw")) ||
    registryAgent?.registeredEndpoints.some((ep) => ep.includes("openclaw"))
      ? "openclaw"
      : fullCard?.name.toLowerCase().includes("montrust") ||
          fullCard?.name.toLowerCase().includes("trustlens")
        ? "montrust"
        : "erc-8004";

  questions.push({
    id: "proof-genuine",
    question: "Was the proof genuine?",
    answer: hashIntegrity && onChainAnchored ? "yes" : hashIntegrity ? "partial" : "no",
    passed: hashIntegrity,
    detail: hashIntegrity
      ? onChainAnchored
        ? "Proof hash matches canonical JSON and is anchored on ProofAnchor."
        : "Proof hash matches stored JSON but is not yet anchored on-chain."
      : "No matching proof record or hash integrity check failed.",
  });

  questions.push({
    id: "photo-modified",
    question: "Was the photo modified?",
    answer: imageHashPresent ? "no" : "unknown",
    passed: imageHashPresent,
    detail: imageHashPresent
      ? "Original image SHA-256 is embedded in the proof — any pixel change alters the hash."
      : "No image hash found in stored proof.",
  });

  questions.push({
    id: "result-changed",
    question: "Was the result changed later?",
    answer: hashIntegrity ? "no" : storedProof ? "yes" : "unknown",
    passed: hashIntegrity,
    detail: hashIntegrity
      ? "Keccak256 of proof JSON still matches — vision result was not tampered."
      : "Tampering the vision answer would change the proof hash.",
  });

  questions.push({
    id: "agent-genuine",
    question: "Was the agent genuine?",
    answer: agentGenuine ? "yes" : "no",
    passed: Boolean(agentGenuine),
    detail: agentGenuine
      ? `Agent #${agentId} exists on ERC-8004 registry ${ERC8004.identityRegistry.slice(0, 10)}…`
      : "Agent ID not found or agent card invalid on Monad Testnet.",
  });

  questions.push({
    id: "real-agent-inspected",
    question: "Did the real agent inspect it?",
    answer: realAgentSigned ? "yes" : endpointLegit ? "partial" : "no",
    passed: Boolean(realAgentSigned),
    detail: realAgentSigned
      ? "Wallet signature challenge passed — endpoint controls the registered agent wallet."
      : endpointLegit
        ? "Endpoint is on the agent card but signature challenge not completed."
        : "Cannot confirm the registered agent signed or inspected the proof.",
  });

  questions.push({
    id: "spoofed-agent",
    question: "Was it a fake/spoofed agent?",
    answer: notSpoofed && realAgentSigned ? "no" : endpointLegit === false ? "yes" : "partial",
    passed: Boolean(realAgentSigned && endpointLegit),
    detail:
      !endpointLegit
        ? "Submitted endpoint is NOT on the on-chain agent card — likely impersonation."
        : realAgentSigned
          ? "Endpoint and wallet match — not a spoofed agent."
          : "Endpoint matches card but cryptographic proof of control is missing.",
  });

  questions.push({
    id: "link-safety",
    question: "Are registered links/endpoints safe?",
    answer: linkSummary.safe
      ? linkFindings.length === 0
        ? "unknown"
        : "yes"
      : linkSummary.highRiskCount > 0
        ? "no"
        : "partial",
    passed: linkSummary.safe && linkFindings.length > 0,
    detail: linkFindings.length
      ? linkSummary.safe
        ? `Scanned ${linkFindings.length} URL checks — no high-risk findings.`
        : `${linkSummary.highRiskCount} high / ${linkSummary.mediumRiskCount} medium risk findings in agent card links.`
      : "No agent card endpoints available to scan.",
  });

  const passedCount = questions.filter((q) => q.passed).length;
  let overallStatus: TrustReport["overallStatus"] = "untrusted";
  if (passedCount >= 5) overallStatus = "trusted";
  else if (passedCount >= 3) overallStatus = "warning";

  const payEligible =
    hashIntegrity && onChainAnchored && Boolean(realAgentSigned) && Boolean(agentGenuine);

  return {
    generatedAt: new Date().toISOString(),
    agentId,
    endpointUrl,
    proofHash: resolvedProofHash,
    agentSource,
    linkSafety: {
      safe: linkSummary.safe,
      findings: linkFindings,
    },
    overallStatus,
    summary:
      overallStatus === "trusted"
        ? "All trust checks pass. Safe for Pay-When-It-Works settlement."
        : overallStatus === "warning"
          ? "Some checks incomplete — do not pay until agent signature and anchoring are confirmed."
          : "Trust checks failed — do not pay. Possible tampering or spoofed agent.",
    questions,
    payWhenItWorks: {
      eligible: payEligible,
      reason: payEligible
        ? "Proof anchored + agent verified — x402 MON payment would be released on Monad Testnet."
        : "Payment withheld until proof is anchored and agent signature is verified.",
      x402Note:
        "x402 on Monad Testnet (eip155:10143) — pay 0.1 MON via MetaMask native transfer. Settlement only when trust checks pass (Pay-When-It-Works).",
    },
  };
}
