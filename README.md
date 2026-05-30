# 🌾 Harvester — RWA Yield Protocol on Solana

A non-custodial yield protocol for tokenized real-world assets built on Solana. Register RWA positions, accrue HRVST yield every second, and claim on-chain — no intermediaries, no custody.

**Live Demo**: https://harvester-beta.vercel.app  
**Indexer**: https://harvester-indexer-latest.onrender.com

---

## What it does

Harvester lets users register tokenized real-world asset positions (real estate, T-bills, private credit) and earn HRVST tokens as yield. Yield accrues continuously based on:

- Position size
- Yield tier (Retail / Institutional / Wholesale)
- Time elapsed since last claim
- Protocol yield rate (set by admin, currently 5% APY)

### Yield Tiers
| Tier | Threshold | Bonus |
|------|-----------|-------|
| Retail | < 1M tokens | +0 bps |
| Institutional | ≥ 1M tokens | +20 bps |
| Wholesale | ≥ 10M tokens | +50 bps |

---

## Architecture

### Add Architecture here 

### Stack
- **Program**: Anchor 0.32 on Solana Devnet
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, `@coral-xyz/anchor`, SWR
- **Indexer**: Node.js + TypeScript, Express, PostgreSQL (Supabase), polling mode
- **Deployment**: Vercel (frontend), Render (indexer), Supabase (DB)

---

## Program

**Program ID**: `AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W`  
**Network**: Solana Devnet

### Instructions
| Instruction | Description |
|-------------|-------------|
| `initialize(yield_rate_bps)` | Creates GlobalConfig PDA, initializes HRVST mint |
| `register_position(mint, amount)` | Creates UserPosition PDA for a given RWA mint |
| `claim_yield()` | Mints accrued HRVST tokens to user's ATA |
| `close_position()` | Closes position PDA, refunds rent |
| `update_config(new_rate_bps, paused)` | Admin-only config update |

### Accounts
- **GlobalConfig** PDA — seeds: `["config"]`
- **UserPosition** PDA — seeds: `["position", owner, mint]`

---
---

## Local Setup

### Prerequisites
- Node.js 20+, Bun
- Rust + Anchor CLI
- Solana CLI
- PostgreSQL or Supabase account

### 1. Clone
```bash
git clone https://github.com/anmol0b/harvester
cd harvester
```

### 2. Program (already deployed on devnet — skip if not modifying)
```bash
cd program
anchor build
anchor deploy --provider.cluster devnet
```

### 3. Indexer
```bash
cd indexer
npm install
cp .env.example .env
# Fill in DATABASE_URL, RPC_HTTP, PROGRAM_ID
npm run db:migrate
npm run dev
```

### 4. Frontend
```bash
cd frontend
bun install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_RPC_URL, NEXT_PUBLIC_INDEXER_URL, NEXT_PUBLIC_PROGRAM_ID
bun run dev
```

Open `http://localhost:3000`

---

## Environment Variables

### Indexer `.env`

### Frontend `.env.local`

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /portfolio/:wallet` | Positions + TVL for a wallet |
| `GET /history/:wallet` | Paginated claim history |
| `GET /yields/top` | Leaderboard |
| `GET /stats` | Protocol-wide stats |
| `GET /position/:wallet/:mint` | Single position |

---

## Roadmap
- [ ] Rewrite program in Pinocchio for lower compute costs
- [ ] Rewrite indexer in Rust with gRPC (Yellowstone) support
- [ ] Mainnet deployment
- [ ] Real RWA mint integrations
- [ ] Governance for yield rate updates

---

## Built for Solana India Fellowship — Capstone 2025

Built from scratch in 2 weeks:
- Custom Anchor program with 5 instructions
- TypeScript indexer polling devnet
- Next.js frontend with real-time yield tracking
- Full deployment pipeline (Vercel + Render + Supabase)