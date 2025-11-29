# Backend API - Blockchain Super DApp

A production-ready Node.js/Express REST API for the Blockchain Super DApp. Provides 6 endpoints for token management, address details, minting tracking, and blockchain data querying on Sepolia testnet.

**Network:** Sepolia Testnet (Chain ID: 11155111)  
**Port:** 3000  
**Tech Stack:** Node.js + Express + TypeScript + ethers.js v6

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add:
# - VITE_ALCHEMY_API_KEY (Sepolia RPC)
# - VITE_TOKEN_ADDRESS (Sepolia token address)
# - VITE_NFT_ADDRESS (Sepolia NFT address)

# 3. Start server
npm run dev

# Server runs on http://localhost:3000
```

## Directory Structure

```
backend/
├── src/
│   ├── index.ts              # Server initialization & service setup
│   ├── routes.ts             # 6 REST API endpoint definitions
│   ├── ethereum.ts           # ethers.js integration (Sepolia RPC)
│   ├── cache.ts              # Optional Redis caching (30s TTL)
│   └── database.ts           # Optional PostgreSQL persistence
├── dist/                     # Compiled JavaScript (auto-generated)
├── node_modules/             # npm dependencies
├── .env                      # Environment variables (local)
├── .env.example              # Environment template
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## Environment Variables

**Required:**
```bash
VITE_CONTRACT_ADDRESS=0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d
VITE_NFT_CONTRACT_ADDRESS=0x4752489c774D296F41BA5D3F8A2C7E551299c9c6
VITE_NFT2_CONTRACT_ADDRESS=0xEDb0064eB0299Fb22eEB3DeA79f5cd258328Aa0A
VITE_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/demo
```

**Optional:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/blockchain_dapp
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
```

## 📡 API Endpoints (9 Total)

### Token Endpoints (4)

#### 1. GET `/api/address/details/:address`
Returns balance, gas price, and block information for any Ethereum address on Sepolia.

**Parameters:**
- `address` (required): Ethereum address (e.g., `0x1234...`)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d",
    "balance": {
      "eth": "0.049935684043828771",
      "wei": "49935684043828771"
    },
    "gasPrice": {
      "gwei": "25.5",
      "wei": "25500000000"
    },
    "blockNumber": 6234567,
    "timestamp": "2025-11-29T15:30:00Z"
  }
}
```

---

#### 2. GET `/api/tokens/details/:address`
Returns user's token balance and complete token metadata (name, symbol, decimals, total supply).

**Parameters:**
- `address` (required): Ethereum address to check balance

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d",
    "contract": {
      "address": "0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d",
      "name": "CustomToken",
      "symbol": "CTK"
    },
    "token": {
      "name": "CustomToken",
      "symbol": "CTK",
      "decimals": 18,
      "totalSupply": "1000000000000000000000"
    },
    "userBalance": {
      "balance": "1000000000000000000000",
      "ether": "1000.0",
      "wei": "1000000000000000000000"
    },
    "metadata": {
      "version": "1.0",
      "project": "Blockchain Integration Project",
      "deploymentTimestamp": 1732880645
    },
    "timestamp": "2025-11-29T15:30:00Z"
  }
}
```

---

#### 3. POST `/api/tokens/mint`
Records a token mint transaction in the database.

**Request Body:**
```json
{
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "amount": "1000000000000000000",
  "tx_hash": "0xabcd...1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mint recorded successfully",
  "data": {
    "id": 42,
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": "1000000000000000000",
    "tx_hash": "0xabcd...1234",
    "created_at": "2025-11-29T15:30:00Z"
  }
}
```

---

#### 4. GET `/api/tokens/mints/:address`
Returns all mint transactions for a specific address.

**Parameters:**
- `address` (required): Ethereum address to query

**Response (With mints):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "amount": "1000000000000000000",
      "tx_hash": "0xabc...123",
      "created_at": "2025-11-29T15:20:00Z"
    }
  ],
  "total": 1,
  "address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Response (No mints):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

---

### NFT2 Fixed Collection Endpoints (3 - NEW!)

#### 5. POST `/api/nft2/track-mint`
Records an NFT2 mint transaction (called automatically by frontend).

**Request Body:**
```json
{
  "address": "0xcdb426c2c1d1863967ea66b581fb55c62b2fa54b",
  "tokenId": 0,
  "txHash": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "NFT2 mint tracked successfully",
  "data": {
    "address": "0xcdb426c2c1d1863967ea66b581fb55c62b2fa54b",
    "tokenId": 0,
    "txHash": "0x1234567890abcdef...",
    "timestamp": "2025-11-29T10:15:00.000Z"
  }
}
```

---

#### 6. GET `/api/nft2/mints/:address`
Returns all NFT2 mints for a specific address.

**Parameters:**
- `address` (required): Ethereum address to query

**Response:**
```json
{
  "success": true,
  "address": "0xcdb426c2c1d1863967ea66b581fb55c62b2fa54b",
  "mintsCount": 4,
  "nextTokenId": 4,
  "mints": [
    {
      "address": "0xcdb426c2c1d1863967ea66b581fb55c62b2fa54b",
      "tokenId": 0,
      "txHash": "0x1234...",
      "timestamp": "2025-11-29T10:00:00.000Z"
    },
    {
      "address": "0xcdb426c2c1d1863967ea66b581fb55c62b2fa54b",
      "tokenId": 1,
      "txHash": "0x5678...",
      "timestamp": "2025-11-29T10:05:00.000Z"
    }
  ]
}
```

---

#### 7. GET `/api/nft2/next-token/:address`
Returns the next token ID to mint (queries blockchain first, falls back to backend tracking).

**Parameters:**
- `address` (required): Ethereum address to query

**Response:**
```json
{
  "success": true,
  "address": "0xcdb426c2c1d1863967ea66b581fb55c62b2fa54b",
  "nextTokenId": 4,
  "blockchainSupply": 4,
  "backedUpMints": 4
}
```

**Note:** `nextTokenId` is determined by querying `contract.totalSupply()` directly from the blockchain, ensuring accuracy across multiple clients.

---

### Additional Endpoints (2)

#### 8. GET `/api/tokens/stats`
Returns global token minting statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMints": 42,
    "totalAmount": "42000000000000000000000",
    "uniqueAddresses": 15,
    "timestamp": "2025-11-29T15:30:00Z"
  }
}
```

---

#### 9. GET `/api/health`
Health check endpoint. Returns 200 if server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-29T15:30:00Z"
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Access to Alchemy API key (free at https://alchemy.com)
- Sepolia testnet configuration

### Installation

```bash
cd backend
npm install
```

### Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with required values:
```bash
VITE_ALCHEMY_API_KEY=your_alchemy_sepolia_api_key
VITE_TOKEN_ADDRESS=0x95C8f7166af42160a0C9472D6Db617163DEd44e8
VITE_NFT_ADDRESS=0xC561FE4044aF8B6176B64D8Da110420958411CAC
PORT=3000
NODE_ENV=development
```

### Running the Server

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### Testing Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Get address details
curl http://localhost:3000/api/address/details/0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d

# Get token details
curl http://localhost:3000/api/tokens/details/0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d

# Get token mint history
curl http://localhost:3000/api/tokens/mints/0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d

# Get NFT2 mint history (NEW)
curl http://localhost:3000/api/nft2/mints/0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d

# Get next NFT2 token ID (NEW)
curl http://localhost:3000/api/nft2/next-token/0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d

# Get global stats
curl http://localhost:3000/api/tokens/stats
```

---

## 🔗 Network Configuration

**Network:** Sepolia Testnet  
**Chain ID:** 11155111  
**RPC Endpoint:** eth-sepolia.g.alchemy.com  

**Deployed Contracts:**
- Token (ERC-20): `0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d`
- NFT (ERC-721): `0x4752489c774D296F41BA5D3F8A2C7E551299c9c6`
- NFT2 (Fixed Collection): `0xEDb0064eB0299Fb22eEB3DeA79f5cd258328Aa0A`

View on block explorer:
- https://sepolia.etherscan.io/address/0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d
- https://sepolia.etherscan.io/address/0x4752489c774D296F41BA5D3F8A2C7E551299c9c6
- https://sepolia.etherscan.io/address/0xEDb0064eB0299Fb22eEB3DeA79f5cd258328Aa0A

---

## 🔄 Data Flow

```
Frontend Request (React)
        ↓
[routes.ts] - Route handler & validation
        ↓
[ethereum.ts] - Call Sepolia RPC (Alchemy)
        ↓
[cache.ts] - Cache data for 30s (optional)
        ↓
[database.ts] - Save to PostgreSQL or JSON file
        ↓
JSON Response → Frontend Display
```

**Data Persistence (NFT2 Mints):**
- Saved to `backend/data/nft2_mints.json`
- Loaded on server startup
- Survives server restarts
- Falls back to in-memory tracking if file unavailable

---

## 📊 Architecture

```
┌───────────────────────────────┐
│   Frontend (React on :5173)   │
└───────────┬───────────────────┘
            │
            │ HTTP Requests (CORS enabled)
            ↓
┌───────────────────────────────────┐
│  Backend API (Express :3000)      │
│  ├─ /api/address/details          │
│  ├─ /api/tokens/details           │
│  ├─ /api/tokens/mint              │
│  ├─ /api/tokens/mints             │
│  ├─ /api/nft2/track-mint (NEW)    │
│  ├─ /api/nft2/mints (NEW)         │
│  ├─ /api/nft2/next-token (NEW)    │
│  ├─ /api/tokens/stats             │
│  └─ /api/health                   │
└───────────┬───────────────────────┘
            │
            ├─────────────────────────┐
            ↓                         ↓
┌────────────────────────┐  ┌──────────────────────┐
│ Sepolia RPC (Alchemy)  │  │ Data Storage         │
│ Chain ID: 11155111     │  │ ├─ PostgreSQL        │
└────────────┬───────────┘  │ ├─ Redis Cache       │
             │               │ └─ JSON File        │
             ↓               └──────────────────────┘
┌───────────────────────────┐
│ Smart Contracts (Sepolia) │
│ ├─ CustomToken (ERC-20)   │
│ ├─ CustomNFT (ERC-721)    │
│ └─ CustomNFT2 (Fixed-100) │
└───────────────────────────┘
```

---

## 📋 Key Features

✅ **9 REST API Endpoints** - Complete token management + NFT2 tracking  
✅ **3 NFT2 Endpoints** - Track and query fixed collection mints (NEW)  
✅ **Blockchain-First State** - Queries contract.totalSupply() for accurate next token ID  
✅ **Persistent Mint Tracking** - Saves to data/nft2_mints.json (survives restarts)  
✅ **Sepolia Network** - Testnet-only, chain ID verification  
✅ **Gas Price Tracking** - Real-time Gwei and Wei data  
✅ **Block Number** - Current block height from Sepolia  
✅ **Token Metadata** - Name, symbol, decimals, total supply  
✅ **Balance Queries** - User token balance and metadata  
✅ **Mint Tracking** - Record and retrieve mint history  
✅ **Optional Caching** - 30-second TTL with Redis fallback  
✅ **Optional Database** - PostgreSQL for persistent storage  
✅ **Error Handling** - Type-safe responses with validation  

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (ts-node)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled JavaScript
npm run typecheck    # Validate TypeScript (no emit)
```

### File Structure

- **routes.ts** - All 6 endpoint definitions with validation
- **ethereum.ts** - Sepolia RPC integration (Alchemy provider)
- **cache.ts** - Optional Redis caching (in-memory fallback)
- **database.ts** - Optional PostgreSQL (graceful degradation)
- **index.ts** - Server initialization and middleware setup

### Environment Setup

The backend requires:
1. Alchemy API key (free tier sufficient)
2. Sepolia contract addresses (provided in .env.example)
3. Node.js 18+ and npm

Optional enhancements:
- Redis for distributed caching
- PostgreSQL for persistent storage

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/..." | Ensure route path is correct (6 endpoints documented above) |
| "Invalid address error" | Verify address is 0x + 40 hex characters |
| "Cannot read property 'getBalance'" | Check VITE_ALCHEMY_API_KEY in .env |
| "Connection refused" | Verify Alchemy API is accessible, check .env config |
| "Port 3000 already in use" | Change PORT in .env or kill process using port |
| "Database connection error" | DATABASE_URL optional - app works without PostgreSQL |

---

## 📚 Related Documentation

- **Frontend:** See `../frontend/README.md`
- **Smart Contracts:** See `../contracts/README.md`
- **Root:** See `../README.md`

---

## 🔐 Security Notes

⚠️ **Testnet Only:** Backend is configured for Sepolia testnet only  
⚠️ **Never commit .env:** Contains sensitive API keys  
⚠️ **CORS enabled:** Configured for localhost:5173 (frontend)  
⚠️ **Input validation:** All addresses validated before use  

---

**Last Updated:** November 28, 2025

