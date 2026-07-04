# MonTrust

**An agent endpoint verification and trust platform built on Monad** — combining [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) identity registries, AI-powered vulnerability photo proof, on-chain anchoring, and [x402](https://x402.org) pay-per-use trust reports settled in native MON.

Built for **Monad Blitz Pune** using [monskills](https://github.com/monad-developers/monskills) scaffolding patterns.

---

## Use Case

AI agents expose MCP and HTTP endpoints that users must trust before sharing credentials, API keys, or sensitive workflows. MonTrust gives operators a single security command center to:

1. **Verify** that an agent ID on Monad’s ERC-8004 Identity Registry matches a real endpoint and wallet signature.
2. **Audit** screenshots of agent/MCP configurations for spoofing, credential leaks, and misconfiguration using NVIDIA NIM vision.
3. **Anchor** cryptographic proof hashes on Monad Testnet via a `ProofAnchor` smart contract.
4. **Settle trust** with a six-question trust report unlocked through x402 native MON payments (0.1 MON per request on testnet).

This closes the loop from “is this agent who it claims to be?” to “was the security proof genuine?” — with on-chain evidence and machine-to-machine payments.

---

## Features

| Module | Description |
|--------|-------------|
| **Agent Verifier** | Resolves ERC-8004 agent IDs, fetches agent card JSON (`data:`, IPFS, HTTPS), validates registered endpoints, and verifies EIP-191 wallet signature challenges. |
| **Vulnerability Photo Proof** | Upload screenshots; NVIDIA MiniMax-M3 vision returns structured JSON (answer, confidence, reason); proofs are hashed (Keccak256) and optionally anchored on-chain. |
| **Register Agent** | Mint a MonTrust vision agent on the Monad Testnet Identity Registry and link your wallet as the signing endpoint. |
| **Trust Report & x402** | Six trust questions (genuine proof, tampering, agent spoofing, link safety, etc.); pay 0.1 MON via MetaMask to unlock the full report. |
| **Activity History** | Local activity feed of verifications, proofs, and anchors. |
| **On-Chain Status** | Live reads from Monad Testnet — registry, ProofAnchor deployment, wallet balance. |

### On-Chain Integrations

- **ERC-8004 Identity Registry** — `0x8004A818BFB912233c491871b3d84c89A494BD9e` (Monad Testnet)
- **ProofAnchor contract** — `0xc6d3bba40408ad9a706fde69716c1adbdb7aea75` (deployed)
- **x402** — Native MON payments via MetaMask + Monad facilitator (`eip155:10143`)
- **MetaMask Smart Accounts Kit** — ERC-7715 permissions-ready wallet client

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MonTrust Next.js App                        │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Agent        │ Photo Proof  │ Trust Report │ Wallet (wagmi +      │
│ Verifier UI  │ + Vision AI  │ + x402 Pay   │ MetaMask)            │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬─────────┘
       │              │              │                  │
       ▼              ▼              ▼                  ▼
┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────────────┐
│ /api/verify  │ │ /api/    │ │ /api/x402/  │ │ Monad Testnet    │
│ /api/agent/  │ │ vision   │ │ trust-report│ │ RPC + contracts  │
│   challenge  │ │          │ │             │ │                  │
└──────┬───────┘ └────┬─────┘ └──────┬──────┘ └────────┬─────────┘
       │              │              │                  │
       ▼              ▼              ▼                  ▼
 ERC-8004        NVIDIA NIM      x402 Facilitator   ProofAnchor
 Registry        Vision API      (native MON)       + Identity Registry
```

### End-to-End Flow

1. **Connect** MetaMask on Monad Testnet (Chain ID `10143`).
2. **Verify** an agent — enter agent ID + endpoint → sign challenge → pass/fail with registry details.
3. **Photo proof** — select audit task → upload screenshot → vision analysis → hash → deploy/anchor on `ProofAnchor`.
4. **Trust report** — enter agent ID + proof hash → pay 0.1 MON (x402) → receive six-question trust assessment.

---

## Tech Stack

- **Framework** — Next.js 16 (App Router), React 19, TypeScript
- **Styling** — Tailwind CSS 4
- **Web3** — wagmi 3, viem, MetaMask Smart Accounts Kit, @x402/*
- **AI** — NVIDIA NIM (MiniMax-M3 multimodal vision)
- **Contracts** — Solidity 0.8 (`ProofAnchor.sol`), solc compile script
- **Chain** — Monad Testnet (`10143`)

---

## Prerequisites

- Node.js 20+
- MetaMask with Monad Testnet configured
- Testnet MON from the [Monad Faucet](https://faucet.monad.xyz)
- NVIDIA API key for vision features ([build.nvidia.com](https://build.nvidia.com/minimaxai/minimax-m3))

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/sarthai0062-debug/montrust-monad-blitz-pune.git
cd montrust-monad-blitz-pune
npm install
```

### 2. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `MONTRUST_BASE_URL` | App base URL (default `http://localhost:3000`) |
| `NVIDIA_API_KEY` | NVIDIA NIM API key for vision analysis |
| `NVIDIA_VISION_MODEL` | Model ID (default `minimaxai/minimax-m3`) |
| `DEPLOYER_PRIVATE_KEY` | Optional — for server-side deploy scripts only |
| `X402_SELLER_ADDRESS` | Address receiving x402 MON payments |
| `X402_PAYMENT_AMOUNT_MON` | Price per x402 request (default `0.1`) |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will land on the **Security Command Center** dashboard.

### 4. Optional — deploy contracts & register agent

```bash
# Compile ProofAnchor bytecode
npm run compile:proof

# Deploy to Monad Testnet (requires DEPLOYER_PRIVATE_KEY)
npm run deploy:testnet

# Verify on-chain state
npm run verify:onchain
```

Deployment artifacts are written to `data/deployments.json`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run compile:proof` | Compile `ProofAnchor.sol` |
| `npm run deploy:testnet` | Deploy contracts + register vision agent |
| `npm run verify:onchain` | Verify deployment and registry state |
| `npm run verify:contract` | Verify contract on explorer |
| `npm run test:e2e` | End-to-end API and on-chain test |

---

## Project Structure

```
montrust-monad-blitz-pune/
├── contracts/
│   └── ProofAnchor.sol          # On-chain proof hash registry
├── data/
│   └── deployments.json         # Testnet deployment addresses
├── public/                      # Static assets & icons
├── scripts/
│   ├── compile-proof.js         # Solidity compile
│   ├── deploy-testnet.ts        # Deploy + register agent
│   ├── verify-onchain.ts        # On-chain verification
│   └── e2e-full-test.ts         # E2E test suite
├── src/
│   ├── abi/                     # Contract ABIs
│   ├── app/                     # Next.js pages & API routes
│   │   ├── dashboard/           # Overview
│   │   ├── verify/              # Agent verifier
│   │   ├── photo-proof/         # Vulnerability screenshots
│   │   ├── register/            # ERC-8004 agent registration
│   │   ├── trust/               # Trust report + x402
│   │   ├── history/             # Activity feed
│   │   └── api/                 # Backend routes
│   ├── components/              # UI components
│   ├── config/                  # wagmi configuration
│   ├── lib/                     # Core logic (ERC-8004, x402, vision)
│   ├── providers/                 # Web3 providers
│   └── schemas/                 # Zod schemas
└── .env.example
```

---

## Network Details

| Property | Value |
|----------|-------|
| Chain | Monad Testnet |
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | [testnet.monadexplorer.com](https://testnet.monadexplorer.com) |
| Faucet | [faucet.monad.xyz](https://faucet.monad.xyz) |
| Identity Registry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ProofAnchor (deployed) | `0xc6d3bba40408ad9a706fde69716c1adbdb7aea75` |
| Demo Agent ID | `1786` |

---

## x402 Payments

MonTrust uses **Pay-When-It-Works** x402 on Monad Testnet:

- Protected routes: `GET /api/x402/vision`, `GET /api/x402/trust-report`
- Price: **0.1 MON** per request (configurable via `X402_PAYMENT_AMOUNT_MON`)
- Flow: HTTP 402 → MetaMask sends native MON → server verifies tx on-chain → resource unlocked
- Facilitator: `https://x402-facilitator.molandak.org` (`eip155:10143`)

---

## License

MIT

---

## Acknowledgments

- [Monad](https://monad.xyz) — high-performance EVM chain
- [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) — agent identity standard
- [x402](https://x402.org) — HTTP-native payments
- [MetaMask Smart Accounts Kit](https://docs.metamask.io/smart-accounts-kit/) — smart account & delegation tooling
- [monskills](https://github.com/monad-developers/monskills) — Monad development skills
