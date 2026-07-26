# 🎟️ InjPass — On-Chain Stadium Ticketing on Injective Protocol

> **Hackathon:** Injective Global Cup Hackathon 2026  
> **Track:** DeFi / Infrastructure / AI Agents  
> **Built with:** Injective inEVM · x402 Micropayments · MCP AI Agents · Supabase · React + Vite

---

## 🏆 What is InjPass?

**InjPass** is a full-stack, agentic Web3 ticketing platform that replaces paper tickets and centralized booking nightmares with dynamic, on-chain NFT tickets. Every ticket is an ERC-721 token on the Injective inEVM testnet — verifiable, unfakeable, and AI-powered.

When your team wins, your ticket **automatically upgrades to a Victory Edition NFT** — a permanent on-chain record of the moment you were there.

> *Not just a ticket. A proof of who you were there.*

---

## 🚀 Live Demo

| Interface | URL |
|---|---|
| Frontend App | `http://localhost:5173` |
| Backend API | `http://localhost:3000` |
| Gate Validator Agent | `http://localhost:3001` |

---

## 📺 Video Demo

> See `demo_script.md` for the full 90-second demo walkthrough script.  
> See `injpass_pitch_video_script.md` for the 60-second cinematic pitch film script.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎟 **NFT Ticket Minting** | Buy match tickets as ERC-721 NFTs on Injective inEVM. Seat, team selection, event metadata all on-chain. |
| 🤖 **AI Fan Manager Agent** | MCP-powered agent monitors live match state and automatically upgrades winning fans' tickets |
| 🏆 **Victory Edition Upgrade** | When your supported team wins, your ticket transforms into a glowing **Golden Victory Edition NFT** |
| 🔐 **Turnstile Gate Validator** | QR-based check-in system. Fans generate a signed proof, the gate agent verifies on-chain ownership |
| 💳 **x402 Paywall** | Live match data feed is paywalled via x402 micropayments — AI agents pay $0.01 USDC per request |
| 📊 **Live Scorecard** | Real-time match score polling from backend, displayed per your booked ticket's event |
| 💰 **Wallet Integration** | MetaMask with auto-connect, auto-network switching to Injective inEVM (Chain ID 1439) |
| 🗄️ **Persistent DB** | Supabase backend with local JSON fallback — tickets survive server restarts |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│   React + Vite Frontend  (port 5173)                    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │  Home    │ │  Events  │ │ Dashboard│ │ Validator│  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │  REST API
┌─────────────────────────▼───────────────────────────────┐
│            Express Backend Server (port 3000)            │
│   ┌──────────────────┐  ┌─────────────────────────────┐ │
│   │  Ticketing API   │  │  x402 Paywalled Live Feed   │ │
│   │  /api/tickets    │  │  /api/events/live-feed      │ │
│   │  /api/events     │  │  $0.01 USDC per request     │ │
│   └──────────────────┘  └─────────────────────────────┘ │
│   ┌──────────────────────────────────────────────────┐   │
│   │              Supabase Database                   │   │
│   │  tickets table · events table · users table      │   │
│   └──────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│            AI Agent Layer (port 3001)                    │
│   ┌─────────────────────┐  ┌──────────────────────────┐ │
│   │ Gate Validator Agent │  │  Fan Manager Agent (MCP) │ │
│   │ Verifies QR proofs   │  │  Monitors match events   │ │
│   │ On-chain check-in    │  │  Upgrades NFTs on WIN    │ │
│   └─────────────────────┘  └──────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│          Injective inEVM Testnet (Chain ID 1439)         │
│   ERC-721 NFT Contract · Dynamic Metadata · Victory     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Injective Protocol — inEVM Testnet (Chain ID: 1439) |
| **Smart Contract** | ERC-721 Dynamic NFT with victory metadata upgrade |
| **Payment Protocol** | x402 Micropayments — $0.01 USDC per AI data request |
| **AI Agent Framework** | MCP (Model Context Protocol) — multi-tool agent orchestration |
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Vanilla CSS with glassmorphism design system |
| **Wallet** | MetaMask + ethers.js v6 |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | Supabase (PostgreSQL) with local JSON fallback |
| **Indexing** | Custom event polling + Supabase realtime |

---

## 👤 User Flow

### 1. Connect Wallet
- Visit the app at `localhost:5173`
- Click **"Connect Wallet"** in the navbar
- MetaMask opens — approve connection
- App automatically switches your network to **Injective inEVM Testnet**
- Your INJ and USDC balances are displayed
- Session is persisted — reconnects automatically on page refresh

### 2. Browse Events
- Navigate to the **Events** tab
- See all upcoming matches with live status (scheduled / active / ended)
- Select your event (e.g. Argentina vs France — World Cup Final 2026)

### 3. Select Your Seat & Team
- Choose a ticket tier (Standard / Premium / VIP)
- Pick your seat number
- Select the team you're supporting (crucial — affects Victory Edition eligibility)
- Click **"Purchase Ticket"**

### 4. Purchase via x402
- The frontend calls the backend `/api/tickets/purchase`
- Payment is processed via x402 micropayment protocol
- A new ERC-721 NFT is minted on Injective inEVM
- Ticket metadata is saved to Supabase: `token_id`, `seat`, `event_id`, `selected_team`, `tx_hash`

### 5. View Your Ticket
- Navigate to the **My Ticket** tab (Dashboard)
- Your ticket card appears with holographic design
- Live Scorecard shows real-time match score for your event
- The AI Fan Manager Agent is now tracking your ticket

### 6. Stadium Check-In (Turnstile Gate)
- At the stadium gate, navigate to the **Turnstile Demo** tab
- Click **"Generate QR Proof"**
- A time-limited, signed proof is generated (30-second expiry)
- The Gate Validator Agent scans the QR, verifies on-chain ownership, and grants access
- Check-in status updates in real-time on your ticket

### 7. Victory Edition Upgrade 🏆
- When the match ends and your supported team wins:
- The AI Fan Manager Agent detects the `MATCH_END_WIN` event via x402-paywalled live feed
- It calls `upgradeWinningTicketsToVictory()` on the backend
- Your ticket automatically transforms into a **Golden Victory Edition**
- A celebration modal fires — confetti, shimmer effects, and the golden NFT is revealed
- Your victory edition is permanently recorded on-chain

---

## 🤖 AI Agent Deep Dive

### Fan Manager Agent (MCP)
Located in `src/agent/fanManager.ts`

- Uses **MCP (Model Context Protocol)** as the agent orchestration layer
- Monitors match events by polling the x402-paywalled `/api/events/live-feed` endpoint
- On detecting `MATCH_END_WIN`, calls backend tools to upgrade all matching tickets
- Pays $0.01 USDC per data request via x402 M2M micropayment flow

### Gate Validator Agent
Located in `src/agent/validator.ts` — runs on port 3001

- Receives scanned QR token IDs from the frontend
- Verifies the token's on-chain ownership via ethers.js call to the NFT contract
- Updates check-in status in Supabase
- Returns gate entry decision (ALLOW / DENY) with reason

---

## 💳 x402 Micropayment Integration

InjPass implements the **x402 protocol** for machine-to-machine payments:

- The live match feed endpoint (`/api/events/live-feed`) requires a valid x402 payment token
- AI agents automatically pay $0.01 USDC per request using their embedded wallets
- This demonstrates a fully autonomous M2M economy — no human needed to approve each data fetch
- Built with `@x402/express` middleware on the backend

---

## 🗃️ Database Schema

### `tickets` table (Supabase)
| Column | Type | Description |
|---|---|---|
| `token_id` | text (PK) | On-chain NFT token ID |
| `owner_address` | text | Wallet address (lowercase) |
| `seat` | integer | Stadium seat number |
| `event_id` | text | FK to events table |
| `selected_team` | text | Team the fan supports |
| `is_checked_in` | boolean | Gate check-in status |
| `is_victory_edition` | boolean | Golden upgrade status |
| `nft_hash` | text | IPFS metadata URI |
| `golden_nft_hash` | text | Victory IPFS URI |
| `tx_hash` | text | Mint transaction hash |
| `created_at` | timestamptz | Purchase timestamp |

### `events` table (Supabase)
| Column | Type | Description |
|---|---|---|
| `id` | text (PK) | Event identifier (e.g. WC2026-FIN) |
| `name` | text | Event display name |
| `home_team` | text | Home team name |
| `away_team` | text | Away team name |
| `score_home` | integer | Live home score |
| `score_away` | integer | Live away score |
| `status` | text | scheduled / active / ended |
| `minute` | integer | Current match minute |
| `recent_event` | text | GOAL / MATCH_END_WIN / NONE |

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Supabase account (or use local JSON fallback)

### 1. Clone & Install

```bash
# Backend
cd cup
npm install

# Frontend
cd cup-frontend
npm install
```

### 2. Configure Environment

**Backend** (`cup/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
CONTRACT_ADDRESS=0xAE22B3831448eE38e6f6A4A6D8b51B75405384e1
PRIVATE_KEY=your-deployer-private-key
PORT=3000
```

**Frontend** (`cup-frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0xAE22B3831448eE38e6f6A4A6D8b51B75405384e1
VITE_CHAIN_ID=1439
VITE_RPC_URL=https://1439.rpc.thirdweb.com
VITE_FRONTEND_URL=http://localhost:5173
```

### 3. Run

```bash
# Start backend + AI agents
cd cup
cmd /c npm run dev

# Start frontend (separate terminal)
cd cup-frontend
cmd /c npm run dev
```

### 4. MetaMask Setup
- Add Network: **Injective inEVM Testnet**
  - Chain ID: `1439`
  - RPC URL: `https://1439.rpc.thirdweb.com`
  - Explorer: `https://testnet.blockscout.injective.network/`
- Get testnet INJ from the [Injective faucet](https://testnet.faucet.injective.network/)

---

## 🎮 Admin Panel — For Demo / Judges

Navigate to the **Admin** tab (or `#admin` in URL) to simulate:

| Action | What it does |
|---|---|
| **Simulate Goal** | Sends a `GOAL` event — triggers live scorecard update |
| **Simulate Match End (Win)** | Triggers `MATCH_END_WIN` — upgrades all matching tickets to Victory Edition |
| **Simulate Match End (Draw)** | Ends match without upgrades |
| **Reset Match** | Resets scores and status back to scheduled |
| **Update Score Manually** | Set exact home/away scores |
| **Set Ticket Tiers** | Configure pricing per tier |

> 💡 **Judge Demo Path:** Connect wallet → Buy ticket (Events tab) → Go to Arena tab → Simulate Goal (Admin) → Simulate Win → Watch ticket transform to Gold!

---

## 📁 Project Structure

```
cup/                          # Backend monorepo
├── src/
│   ├── server.ts             # Express API server
│   ├── db.ts                 # Supabase + fallback DB layer
│   ├── agent/
│   │   ├── validator.ts      # Gate turnstile agent (port 3001)
│   │   └── fanManager.ts     # MCP Fan Manager agent
│   └── contract/
│       └── InjPassCollectible.sol  # ERC-721 NFT contract
└── ticket_tiers.json         # Persistent tier config

cup-frontend/                 # Frontend React app
├── src/
│   ├── App.tsx               # Root routing
│   ├── context/
│   │   └── Web3Context.tsx   # Wallet + ticket state
│   ├── hooks/
│   │   ├── useLiveFeed.ts    # Real-time score polling
│   │   └── useTicketProof.ts # QR proof generation
│   ├── pages/
│   │   ├── Home.tsx          # Landing page
│   │   ├── Events.tsx        # Event browser + ticket purchase
│   │   ├── Dashboard.tsx     # Ticket viewer + live arena feed
│   │   ├── ValidatorDemo.tsx # Turnstile gate simulation
│   │   ├── Contact.tsx       # Admin Command Center
│   │   └── About.tsx         # Tech stack info
│   └── components/
│       └── Navbar.tsx        # Navigation bar
```

---

## 🌐 Blockchain Deployments

| Contract | Network | Address |
|---|---|---|
| InjPassCollectible (ERC-721) | Injective inEVM Testnet | `0xAE22B3831448eE38e6f6A4A6D8b51B75405384e1` |

**Explorer:** [View on Blockscout](https://testnet.blockscout.injective.network/address/0xAE22B3831448eE38e6f6A4A6D8b51B75405384e1)

---

## 🏅 Hackathon Highlights

### Why InjPass Wins

1. **Real Protocol Usage** — Not a toy. Uses x402, MCP, and Injective inEVM in a production-grade integration.
2. **End-to-End Agentic Flow** — AI agents autonomously pay for data, process it, and upgrade on-chain assets. Zero human intervention.
3. **Dynamic NFTs** — Tickets are not static. They evolve with the match state — a novel use of dynamic metadata.
4. **Real Problem Solved** — Scalpers, fakes, and paper ticket failures are a $15B/year problem in live events.
5. **Full User Journey** — Buy → Check-In → Watch → Win → Flex. A complete product, not a concept.

### What Makes It Novel
- **Victory Edition** mechanic: NFTs that upgrade on sporting outcomes — ties fan emotion to on-chain value
- **x402 M2M economy**: AI pays for data autonomously — demonstrates the composable payment internet
- **MCP orchestration**: AI agent tools abstracted into a protocol layer, making agents extensible
- **Gate Validator Agent**: Brings off-chain physical access control into the on-chain world

---

## 👥 Team

Built for the **Injective Global Cup Hackathon 2026**

---

## 📄 License

MIT — Open source. Build on it.

---

*InjPass — Your Ticket. On-Chain. Unforgettable.*
