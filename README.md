# trustpay

# TrustPay 💸

> **Decentralised cross-border payroll for gig workers** — built for the PL Genesis: Frontiers of Collaboration Hackathon by Protocol Labs

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Starknet](https://img.shields.io/badge/Starknet-Sepolia-orange?logo=ethereum)](https://starknet.io)
[![Filecoin](https://img.shields.io/badge/Filecoin-Storacha-blue)](https://storacha.network)
[![NEAR](https://img.shields.io/badge/NEAR-Testnet-green?logo=near)](https://near.org)
[![Lit Protocol](https://img.shields.io/badge/Lit_Protocol-Access_Control-purple)](https://litprotocol.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## The Problem

A freelancer in Nigeria finishes a design job for a startup in India. The startup pays via SWIFT bank transfer — the worker waits **5–7 days**, loses **8% in fees**, and needs a bank account they might not have.

This is broken for **250 million+ unbanked gig workers** worldwide.

## The Solution

TrustPay is a decentralised payroll protocol that lets anyone pay anyone — across borders, in minutes, with no bank required.

```
Worker completes job
       ↓
Work file uploaded to Filecoin (permanent, tamper-proof proof of delivery)
       ↓
Filecoin CID registered on Starknet smart contract (on-chain receipt)
       ↓
Employer approves → NEAR agent auto-triggers payment release
       ↓
Worker receives stablecoin payment + Lit-encrypted payslip
       ↓
Worker withdraws to mobile money (M-Pesa, UPI, etc.)
```

No bank. No middleman. No 7-day wait.

---

## How It's Built — Sponsor Tech Stack

| Sponsor | Role in TrustPay | Why it's core, not a tag-on |
|---|---|---|
| **Filecoin / Storacha** | Stores work delivery files permanently | The CID is the tamper-proof work receipt that triggers payment |
| **Starknet** | Escrow smart contract + ZK settlement | ZK-proofs make settlement cheap enough for $20–$50 gig payments |
| **NEAR Protocol** | AI agent that auto-releases payment | Monitors CID confirmation and calls the payment contract autonomously |
| **Lit Protocol** | Encrypts payslips | Only the worker's wallet can decrypt their own payslip |

### Full Tech Stack

```
Frontend        →  Next.js 14, TailwindCSS, starknet-react, starknetkit
Smart Contracts →  Cairo (Starknet Sepolia), Rust (NEAR Testnet)
Storage         →  Storacha w3up-client → Filecoin / IPFS
Privacy         →  Lit Protocol SDK (access control conditions)
Agent           →  NEAR AI Agent framework (TypeScript)
Wallets         →  Argent X, Braavos (Starknet) + NEAR Wallet Selector
```

---

## Demo Flow

1. **Employer** connects Argent X wallet → creates job → deposits STRK into escrow
2. **Worker** goes to `/submit-work` → uploads deliverable file → file stored on Filecoin
3. Filecoin CID is registered on the Starknet escrow contract as work proof
4. **Employer** approves → NEAR agent triggers → payment released instantly
5. **Worker** opens `/payslips` → decrypts payslip with Lit Protocol → withdraws funds

---

## Project Structure

```
trustpay/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Employer dashboard
│   │   ├── submit-work/page.tsx     # Worker work submission (Filecoin upload)
│   │   └── payslips/page.tsx        # Worker payslip viewer (Lit decrypt)
│   ├── components/
│   │   ├── StarknetProvider.tsx     # Wallet context
│   │   ├── WalletConnect.tsx        # Connect button
│   │   ├── EscrowPanel.tsx          # Employer deposit + release UI
│   │   └── WorkUploader.tsx         # Storacha drag-and-drop uploader
│   ├── lib/
│   │   ├── starknet.ts              # Contract ABI + helpers
│   │   ├── storacha.ts              # Filecoin upload helpers
│   │   ├── near.ts                  # NEAR connection + calls
│   │   └── lit.ts                   # Lit Protocol encrypt/decrypt
│   └── contracts/
│       ├── starknet/                # Cairo escrow contract
│       │   └── trustpay_escrow/
│       │       ├── Scarb.toml
│       │       └── src/lib.cairo
│       └── near/                    # Rust NEAR payment contract
│           └── trustpay_near/
│               ├── Cargo.toml
│               └── src/lib.rs
├── .env.local.example
├── next.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm install -g pnpm` |
| Scarb (Cairo) | 2.6+ | `curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh \| sh` |
| Starknet Foundry | latest | `curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh \| sh` |
| Rust | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/trustpay.git
cd trustpay
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```bash
# Starknet
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_STARKNET_RPC=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
NEXT_PUBLIC_STARKNET_NETWORK=sepolia

# NEAR
NEXT_PUBLIC_NEAR_CONTRACT_ID=trustpay.YOUR_ACCOUNT.testnet
NEXT_PUBLIC_NEAR_NETWORK=testnet

# Storacha (get from https://console.storacha.network)
NEXT_PUBLIC_STORACHA_SPACE_DID=did:key:YOUR_SPACE_DID
```

### 3. Deploy the Starknet contract

```bash
cd src/contracts/starknet/trustpay_escrow

# Build
scarb build

# Create + fund deployer account
sncast account create --network sepolia --name trustpay-deployer --type oz
# Fund the printed address at: https://starknet-faucet.vercel.app

# Deploy account
sncast account deploy --network sepolia --name trustpay-deployer

# Declare + deploy contract
sncast --account trustpay-deployer declare --network sepolia --contract-name trustpay_escrow::TrustPayEscrow
sncast --account trustpay-deployer deploy --network sepolia --class-hash <CLASS_HASH>
```

Copy the deployed contract address into `.env.local`.

### 4. Deploy the NEAR contract

```bash
cd src/contracts/near/trustpay_near

# Build
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release

# Login and deploy
near login
near create-account trustpay.YOUR_ACCOUNT.testnet --masterAccount YOUR_ACCOUNT.testnet --initialBalance 10
near deploy --accountId trustpay.YOUR_ACCOUNT.testnet \
  --wasmFile target/wasm32-unknown-unknown/release/trustpay_near.wasm
near call trustpay.YOUR_ACCOUNT.testnet new '{}' --accountId YOUR_ACCOUNT.testnet
```

### 5. Run the app

```bash
# From project root
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Smart Contracts

### Starknet Escrow (Cairo)

| Function | Who calls it | What it does |
|---|---|---|
| `deposit(job_id, worker, work_cid)` | Employer | Creates job, locks STRK in escrow |
| `submit_work_cid(job_id, cid)` | Worker | Registers Filecoin CID on-chain as work proof |
| `release_payment(job_id)` | Employer | Verifies CID exists, transfers STRK to worker |
| `get_job(job_id)` | Anyone | Returns full job struct |

**Deployed on Starknet Sepolia:** `0x...` *(update after deployment)*

### NEAR Payment Agent (Rust)

| Function | Who calls it | What it does |
|---|---|---|
| `create_job(job_id, worker)` | Employer | Creates job with attached NEAR as payment |
| `submit_work(job_id, filecoin_cid)` | Worker | Stores Filecoin CID as work proof |
| `release_payment(job_id)` | Employer | Transfers NEAR to worker |
| `get_job(job_id)` | Anyone | Returns job details |

**Deployed on NEAR Testnet:** `trustpay.YOUR_ACCOUNT.testnet` *(update after deployment)*

---

## How the Filecoin CID Links Everything

```
Worker uploads file
        │
        ▼
Storacha w3up-client
        │
        ▼
File stored on Filecoin ──→ Returns CID (e.g. bafybei...)
        │
        ▼
CID submitted to Starknet contract via submit_work_cid()
        │
        ▼
CID also submitted to NEAR contract via submit_work()
        │
        ▼
Employer calls release_payment() — contract verifies CID != 0
        │
        ▼
Payment released. CID permanently on-chain as proof. Forever.
```

The Filecoin CID is the **single source of truth** — it proves the work was delivered, it's on-chain, and it can never be deleted or tampered with.

---

## Lit Protocol — Payslip Privacy

When payment is released, TrustPay generates a payslip (JSON with amount, date, job ID, CID) and encrypts it using Lit Protocol access control conditions:

```typescript
// Only the worker's wallet address can decrypt
const accessControlConditions = [
  {
    contractAddress: "",
    standardContractType: "",
    chain: "ethereum",
    method: "",
    parameters: [":userAddress"],
    returnValueTest: {
      comparator: "=",
      value: workerWalletAddress,
    },
  },
];
```

The encrypted payslip is stored on Filecoin. Only the worker can view it — the employer cannot, and neither can anyone else.

---

## Troubleshooting

**Starknet RPC errors (`untagged enum JsonRpcResponse`)**
Use BlastAPI instead of the default RPC:
```bash
export STARKNET_RPC="https://starknet-sepolia.public.blastapi.io/rpc/v0_7"
```

**`sncast declare` — artifact not found**
Use the full module path:
```bash
sncast --account trustpay-deployer declare --network sepolia \
  --contract-name trustpay_escrow::TrustPayEscrow
```

**Storacha upload auth error**
Add this once in your upload function to authenticate:
```typescript
await client.login("your@email.com"); // click the magic link they send
```

**NEAR deploy — account not found**
Make sure you ran `near login` first and the account exists on testnet.

---

## Hackathon Context

Built for **PL Genesis: Frontiers of Collaboration** by Protocol Labs.

**Category:** Crypto & Economic Systems

**Sponsor integrations:**
- 🟦 **Filecoin / Storacha** — permanent work proof storage
- 🟠 **Starknet** — ZK-based escrow + settlement
- 🟢 **NEAR Protocol** — autonomous payment agent
- 🟣 **Lit Protocol** — encrypted private payslips

**Inspired by:** MicroCrop (automated crop insurance via Filecoin + weather data) from Founders Forge Cohort 1 — same pattern of real-world users + sponsor tech as the core mechanism, not decoration.

---

## Roadmap (Post-Hackathon)

- [ ] Mobile money off-ramp integration (M-Pesa, UPI)
- [ ] Dispute resolution via DAO voting
- [ ] Recurring payroll scheduling via NEAR agent cron
- [ ] Reputation system — worker CIDs build a verifiable work history on Filecoin
- [ ] Multi-token support (USDC, DAI)
- [ ] ZK-proof of tax compliance using Starknet + Zama FHE

---

## License

MIT © 2025 TrustPay

---

<div align="center">
  <strong>Built with ❤️ for the world's 250 million unbanked gig workers</strong>
  <br/>
  <sub>PL Genesis Hackathon · Protocol Labs · 2025</sub>
</div>
