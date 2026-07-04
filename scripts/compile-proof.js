const solc = require("solc");
const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.join(__dirname, "../contracts/ProofAnchor.sol"),
  "utf8"
);

const input = {
  language: "Solidity",
  sources: { "ProofAnchor.sol": { content: source } },
  settings: {
    outputSelection: {
      "*": { "*": ["abi", "evm.bytecode"] },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors) {
  const fatal = output.errors.filter((e) => e.severity === "error");
  if (fatal.length) {
    console.error(fatal);
    process.exit(1);
  }
}

const contract = output.contracts["ProofAnchor.sol"].ProofAnchor;
const outDir = path.join(__dirname, "../src/abi");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "proofAnchor.json"),
  JSON.stringify(
    { abi: contract.abi, bytecode: `0x${contract.evm.bytecode.object}` },
    null,
    2
  )
);
console.log("Compiled ProofAnchor");
