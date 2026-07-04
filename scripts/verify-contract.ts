/**
 * Verify ProofAnchor on Monad explorers via agents.devnads.com API.
 */
import { readFileSync } from "fs";
import path from "path";
import solc from "solc";

const PROOF_ANCHOR = "0xc6d3bba40408ad9a706fde69716c1adbdb7aea75";
const CHAIN_ID = 10143;

function buildStandardJsonInput() {
  const source = readFileSync(
    path.join(process.cwd(), "contracts/ProofAnchor.sol"),
    "utf8"
  );
  return {
    language: "Solidity",
    sources: { "contracts/ProofAnchor.sol": { content: source } },
    settings: {
      optimizer: { enabled: false },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode", "metadata"] },
      },
    },
  };
}

async function main() {
  const input = buildStandardJsonInput();
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts["contracts/ProofAnchor.sol"].ProofAnchor;
  const metadata = JSON.parse(contract.metadata);

  const body = {
    chainId: CHAIN_ID,
    contractAddress: PROOF_ANCHOR,
    contractName: "contracts/ProofAnchor.sol:ProofAnchor",
    compilerVersion: `v${metadata.compiler.version}`,
    standardJsonInput: input,
    foundryMetadata: metadata,
  };

  console.log("Submitting verification for", PROOF_ANCHOR);
  const res = await fetch("https://agents.devnads.com/v1/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await res.json();
  console.log("Status:", res.status);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
