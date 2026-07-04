/**
 * Full end-to-end verification: vision → proof → anchor → trust → x402.
 *
 * Usage: npm run test:e2e
 */
import "dotenv/config";
import { config } from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { MONAD_TESTNET } from "../src/lib/constants";
import { DEFAULT_TASKS } from "../src/lib/proof";
import { proofAnchorAbi } from "../src/abi/proofAnchor";

config({ path: ".env.local" });

const BASE =
  process.env.MONTRUST_BASE_URL ??
  process.env.TRUSTLENS_BASE_URL ??
  "http://localhost:3000";

const monadTestnet = {
  id: MONAD_TESTNET.chainId,
  name: MONAD_TESTNET.name,
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [MONAD_TESTNET.rpcUrl] } },
} as const;

function loadDeployment() {
  const raw = readFileSync(path.join(process.cwd(), "data", "deployments.json"), "utf8");
  return JSON.parse(raw) as {
    contracts: { proofAnchor: `0x${string}` };
    agent: { id: string };
    deployer: `0x${string}`;
  };
}

async function main() {
  const dep = loadDeployment();
  const agentId = dep.agent.id;
  const proofAnchor = dep.contracts.proofAnchor;
  const endpoint = `${BASE}/api/agent/challenge`;

  console.log("=== MonTrust E2E Test ===\n");
  console.log("Base URL:", BASE);
  console.log("Agent ID:", agentId);
  console.log("ProofAnchor:", proofAnchor);

  const results: { step: string; ok: boolean; detail: string }[] = [];

  // 1. Deployment API
  const depRes = await fetch(`${BASE}/api/deployment`);
  const depJson = await depRes.json();
  results.push({
    step: "Deployment API",
    ok: depRes.ok && depJson.agent?.id === agentId,
    detail: `agent ${depJson.agent?.id}`,
  });

  // 2. Verify with challenge auto-sign
  const verifyRes = await fetch(`${BASE}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, endpointUrl: endpoint }),
  });
  const verify = await verifyRes.json();
  results.push({
    step: "Agent verify",
    ok: verify.status === "verified",
    detail: verify.status,
  });

  // 3. Vision API
  const tinyPng =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const auditTask = DEFAULT_TASKS[0];
  const visionRes = await fetch(`${BASE}/api/vision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      imageBase64: tinyPng,
      mimeType: "image/png",
      question: auditTask.question,
    }),
  });
  const vision = await visionRes.json();
  results.push({
    step: "Vision API",
    ok: visionRes.ok && typeof vision.answer === "string",
    detail: vision.answer ?? vision.error,
  });

  // 4. Create and store proof
  const imageHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const proof = {
    taskId: auditTask.id,
    taskQuestion: auditTask.question,
    imageHash,
    vision: {
      answer: vision.answer ?? "unclear",
      confidence: vision.confidence ?? 0.5,
      reason: vision.reason ?? "e2e test",
    },
    agentId,
    timestamp: new Date().toISOString(),
    version: "1",
  };
  const canonical = JSON.stringify(proof, Object.keys(proof).sort());
  const proofHash = keccak256(toBytes(canonical));

  const proofRes = await fetch(`${BASE}/api/proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proof, agentId }),
  });
  const proofStored = await proofRes.json();
  results.push({
    step: "Store proof",
    ok: proofRes.ok && proofStored.proofHash === proofHash,
    detail: proofHash.slice(0, 18) + "…",
  });

  // 5. Anchor on-chain + x402 MON payment test wallet
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  let walletClient: ReturnType<typeof createWalletClient> | null = null;
  let publicClient: ReturnType<typeof createPublicClient> | null = null;

  if (!key?.startsWith("0x")) {
    results.push({ step: "Anchor proof", ok: false, detail: "No DEPLOYER_PRIVATE_KEY" });
  } else {
    const account = privateKeyToAccount(key as `0x${string}`);
    publicClient = createPublicClient({
      chain: monadTestnet,
      transport: http(MONAD_TESTNET.rpcUrl),
    });
    walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http(MONAD_TESTNET.rpcUrl),
    });

    const existing = (await publicClient.readContract({
      address: proofAnchor,
      abi: proofAnchorAbi,
      functionName: "verifyProof",
      args: [proofHash],
    })) as readonly [boolean, string, bigint, bigint];

    if (!existing[0]) {
      const hash = await walletClient.writeContract({
        address: proofAnchor,
        abi: proofAnchorAbi,
        functionName: "anchorProof",
        args: [proofHash, BigInt(agentId)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      results.push({ step: "Anchor proof", ok: true, detail: hash });
    } else {
      results.push({ step: "Anchor proof", ok: true, detail: "already anchored" });
    }

    await fetch(`${BASE}/api/proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proof, agentId, txHash: "anchored" }),
    });
  }

  // 6. Trust report
  const trustUrl = `${BASE}/api/trust-report?agentId=${agentId}&endpointUrl=${encodeURIComponent(endpoint)}&proofHash=${proofHash}`;
  const trustRes = await fetch(trustUrl);
  const trust = await trustRes.json();
  results.push({
    step: "Trust report",
    ok: trustRes.ok && trust.payWhenItWorks?.eligible === true,
    detail: `status=${trust.overallStatus} eligible=${trust.payWhenItWorks?.eligible}`,
  });

  // 7. x402 gates (402 without payment, native MON with tx header)
  const x402Vision = await fetch(`${BASE}/api/x402/vision`);
  results.push({
    step: "x402 vision 402",
    ok: x402Vision.status === 402,
    detail: `HTTP ${x402Vision.status}`,
  });

  const x402Trust = await fetch(
    `${BASE}/api/x402/trust-report?agentId=${agentId}&endpointUrl=${encodeURIComponent(endpoint)}`
  );
  results.push({
    step: "x402 trust-report 402",
    ok: x402Trust.status === 402,
    detail: `HTTP ${x402Trust.status}`,
  });

  // 8. x402 native MON settlement (simulates MetaMask sendTransaction)
  if (walletClient && publicClient) {
    const { parseEther } = await import("viem");
    const payTo = dep.deployer as `0x${string}`;
    const txHash = await walletClient.sendTransaction({
      chain: monadTestnet,
      to: payTo,
      value: parseEther("0.1"),
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    const paidVision = await fetch(`${BASE}/api/x402/vision`, {
      headers: {
        "X-MON-PAYMENT-TX": txHash,
        "X-TRUST-AGENT-ID": agentId,
        "X-TRUST-PROOF-HASH": proofHash,
      },
    });
    results.push({
      step: "x402 MON payment settle",
      ok: paidVision.ok,
      detail: `HTTP ${paidVision.status} tx ${txHash.slice(0, 12)}…`,
    });
  } else {
    results.push({
      step: "x402 MON payment settle",
      ok: false,
      detail: "skipped — no wallet",
    });
  }

  // 9. x402 config
  const x402Cfg = await fetch(`${BASE}/api/x402/config`).then((r) => r.json());
  results.push({
    step: "x402 config",
    ok: x402Cfg.network?.chainId === 10143,
    detail: `chain ${x402Cfg.network?.chainId} amount ${x402Cfg.payment?.amountMon} MON`,
  });

  console.log("\nResults:");
  let failed = 0;
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    console.log(`  ${icon} ${r.step}: ${r.detail}`);
    if (!r.ok) failed++;
  }

  console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`} (${results.length} steps)`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
