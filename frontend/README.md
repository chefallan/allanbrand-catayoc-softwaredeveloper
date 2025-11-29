
# Frontend - Blockchain Super DApp

A production-ready React application for interacting with ERC-20 tokens and NFTs on Sepolia testnet. Features wallet integration, token minting, balance tracking, address viewing, and transaction history.

**Network:** Sepolia Testnet (Chain ID: 11155111)  
**Port:** 5173 (Vite dev server)  
**Tech Stack:** React 18 + TypeScript + ethers.js v6 + Web3Modal

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and add:
# - VITE_API_URL=http://localhost:3000 (backend)
# - VITE_TOKEN_ADDRESS (Sepolia token)
# - VITE_NFT_ADDRESS (Sepolia NFT)
# - VITE_ETHERSCAN_API_KEY (for transaction history)

# 3. Start dev server
npm run dev

# Open http://localhost:5173/
```

## 🎯 Features

✅ **Wallet Connection** - MetaMask + WalletConnect via Web3Modal  
✅ **Network Enforcement** - Sepolia testnet only (prevents mainnet)  
✅ **Token Minting** - FREE ERC-20 token minting with gas validation  
✅ **NFT Minting** - FREE ERC-721 NFT minting with metadata URI support  
✅ **✨ NFT Preview** - See image + details before minting (NEW!)  
✅ **NFT2 Minting** - FREE ERC-721 NFT minting from fixed IPFS collection (auto-URI)  
✅ **✨ NFT2 Auto-Increment** - Mints tokens 0-99 sequentially with auto preview (NEW!)  
✅ **Token Balance Display** - Balance + metadata + Wei precision  
✅ **NFT Balance Display** - NFTs owned + total supply  
✅ **NFT2 Balance Display** - NFTs from fixed collection + total supply  
✅ **Token Details** - Name, symbol, decimals, total supply  
✅ **NFT Details** - Name, symbol, version, contract address  
✅ **NFT2 Details** - Name, symbol, version, collection CID  
✅ **Address Viewer** - View any Ethereum address details  
✅ **Transaction History** - Last 10 transactions from Etherscan  
✅ **Gas Price Display** - Real-time Gwei and Wei data  
✅ **Block Number** - Current Sepolia block height  
✅ **Error Handling** - Comprehensive validation and user feedback

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.tsx                # Main component (2,369 lines)
│   ├── main.tsx               # Entry point
│   ├── vite-env.d.ts          # TypeScript env types
│   └── assets/                # Images and static files
├── public/                    # Static files
├── dist/                      # Build output
├── node_modules/              # npm dependencies
├── .env                       # Environment variables (local)
├── .env.example               # Environment template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── index.html                 # HTML entry point
└── README.md                  # This file
```

## 🔧 Environment Variables

**Required:**
```bash
VITE_API_URL=http://localhost:3000                          # Backend API endpoint
VITE_CONTRACT_ADDRESS=0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d
VITE_NFT_CONTRACT_ADDRESS=0x4752489c774D296F41BA5D3F8A2C7E551299c9c6
VITE_NFT2_CONTRACT_ADDRESS=0xEDb0064eB0299Fb22eEB3DeA79f5cd258328Aa0A
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key                # For transaction history
VITE_NETWORK_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/demo
```

**Optional:**
```bash
VITE_INFURA_ID=your_infura_id                              # For WalletConnect fallback
```

## 🚀 Running the App

### Development Mode
```bash
npm install
npm run dev
```
App runs on `http://localhost:5173/`

### Production Build
```bash
npm run build
npm run preview
```

## 📱 App Components & Features

### 1. Wallet Connection
- **Component:** Connect Wallet button
- **Features:**
  - Web3Modal integration (MetaMask + WalletConnect)
  - Automatic Sepolia network validation
  - Shows connected address and balance
  - Disconnect button when connected

**Code:**
```typescript
const checkNetwork = async () => {
  const chainId = await signer.getChainId();
  if (chainId !== 11155111) {
    setNetworkError("Please switch to Sepolia testnet");
  }
};
```

---

### 2. Token Minting
- **Component:** Mint Tokens section
- **Features:**
  - FREE (no payment required)
  - Input validation (numeric, positive)
  - Gas balance check before minting
  - Transaction hash display
  - Error messages for insufficient gas

**Validates:**
- ✓ Numeric input only
- ✓ Amount > 0
- ✓ Gas balance available
- ✓ Network is Sepolia

**Response:**
```json
{
  "transactionHash": "0xabc...123",
  "amount": "1000000000000000000"
}
```

---

### 3. Token Balance Display
- **Component:** Token Balance section
- **Features:**
  - User's token balance in human-readable units
  - Balance in Wei (full precision, no rounding)
  - Token metadata (name, symbol, decimals)
  - Metadata (version, project, timestamp)
  - Contract address link

**Display Format:**
```
Token Balance: 1000.0 CTK
Wei: 1000000000000000000
Decimals: 18
Contract: 0x95C8f7...
```

---

### 4. NFT Minting
- **Component:** Mint NFTs section
- **Features:**
  - FREE (no payment required)
  - Metadata URI input (IPFS or HTTP URLs)
  - **✨ NEW: NFT Preview** - See image and details before minting!
  - Auto-converts IPFS URIs to gateway URLs
  - Displays: Name, description, image, attributes
  - Gas balance check before minting
  - Transaction hash display
  - Success/error feedback messages

**Validates:**
- ✓ URI format validation
- ✓ Gas balance available
- ✓ Network is Sepolia
- ✓ Valid Ethereum address

**Preview Features:**
- Click "👁️ Preview NFT" to load metadata from URI
- See full NFT image (supports IPFS and HTTP URLs)
- View name, description, and all attributes
- Attributes displayed in grid format for easy scanning
- Image loads from IPFS gateway automatically

**Example URIs:**

**Option 1: External HTTPS URLs**
```
https://example.com/nft/metadata.json
https://nft.storage/ipfs/QmHash/metadata.json
```

**Option 2: IPFS URLs**
```
ipfs://QmHash/metadata.json
https://gateway.pinata.cloud/ipfs/QmHash/metadata.json
```

**Option 3: Sample Collection (After Pinata Upload)**
See `nft-collection/README.md` for setup instructions. Example URIs:
```
ipfs://QmMetadataHash/0.json  → Blockchain Pioneer
ipfs://QmMetadataHash/1.json  → Smart Contract Architect
ipfs://QmMetadataHash/2.json  → Token Minter Deluxe
ipfs://QmMetadataHash/9.json  → Full Stack Developer
ipfs://QmMetadataHash/11.json → Integration Master
```

**Response:**
```json
{
  "transactionHash": "0xabc...123",
  "tokenId": "1"
}
```

---

### 5. NFT Balance Display
- **Component:** NFT Balance section
- **Features:**
  - User's NFT count
  - Total NFT supply
  - NFT metadata (name, symbol)
  - Project information (version, deployment)
  - Contract address link

**Display Format:**
```
NFTs Owned: 2
Total Supply: 50
Name: CustomNFT
Symbol: CNFT
Version: 1.0
Contract: 0xC561FE...
```

---

### 6. NFT2 Minting (Fixed Collection)
- **Component:** CustomNFT2 Mint section
- **Features:**
  - FREE (no payment required)
  - **NO URI INPUT NEEDED** - Auto-generated from token ID
  - **✨ Auto-Increment Minting** - Mints tokens sequentially (0 → 99)
  - **✨ Auto Preview** - Shows next token to mint automatically
  - Mint button shows current token ID
  - After successful mint, auto-loads preview for next token
  - Gas balance check before minting
  - Transaction hash display
  - Success/error feedback messages
  - Metadata automatically maps to fixed IPFS collection

**How It Works:**
1. App loads Token #0 preview automatically on startup
2. Click "Mint Token #0" to mint the first NFT
3. After successful mint, Token #1 preview loads automatically
4. Button updates to "Mint Token #1"
5. Repeat until all 100 tokens are minted
6. Last button changes to "✅ All 100 NFTs Minted!"

**Preview Features:**
- 180x180px NFT image from IPFS
- Token name and full description
- Attribute grid showing rarity, element, token ID, collection
- Automatically formatted and styled
- Auto-loads when minting completes

**Image Source:**
- All 100 NFTs use the same base image: `ipfs://bafybeig5xvfwi2e2bdai6lngjzok2aktxeyqorx6gwpw25mu5p4bjmqtaa/base.svg`
- Metadata CID: `bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i`

**Response:**
```json
{
  "tokenId": "0",
  "uri": "ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/0.json",
  "metadataCID": "bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i"
}
```

---

### 7. NFT2 Balance Display
- **Component:** CustomNFT2 Balance section
- **Features:**
  - User's NFT2 count from fixed collection
  - Total NFT2 supply
  - NFT2 metadata (name, symbol)
  - Fixed collection CID display
  - Project information and contract link

**Display Format:**
```
NFT2s Owned: 5
Total Supply: 100
Name: CustomNFT2
Symbol: CNFT2
Fixed Collection CID: bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i
Contract: 0x...
```

---

### 8. Address Viewer
- **Component:** Address Details section
- **Features:**
  - Query any Ethereum address
  - Input validation (0x + 40 hex chars)
  - Balance in ETH and Wei
  - Gas price in Gwei and Wei
  - Current block number
  - Last 10 transactions table

**Display Format:**
```
Address: 0x1234567890abcdef...
Balance: 0.049935684043828771 ETH
Balance (Wei): 49935684043828771
Gas Price: 25.5 Gwei
Gas Price (Wei): 25500000000
Block Number: 6234567
```

---

### 9. Transaction History
- **Component:** Last 10 Transactions table
- **Features:**
  - Fetches from Etherscan API
  - Shows date, hash, from, to, value
  - Etherscan links for each transaction
  - Handles address/tx lookup errors gracefully

**Columns:**
- Date (formatted timestamp)
- Hash (clickable Etherscan link)
- From (truncated address)
- To (truncated address)
- Value (ETH with 4 decimals)

---

### 10. Error Handling
- **Types of Errors:**
  1. **Insufficient Gas** - Shows required gas amount
  2. **Wrong Network** - Yellow warning banner for non-Sepolia
  3. **Invalid Address** - Red error for address viewer inputs
  4. **Transaction Failure** - Displays error reason from blockchain
  5. **Input Validation** - Validates all user inputs

**Error Display:**
- Green banner: Success messages
- Yellow banner: Network warnings
- Red banner: Error messages

---

## 🔐 Security Features

✅ **Network Enforcement** - Chain ID 11155111 verification  
✅ **Gas Balance Check** - Validates sufficient gas before minting  
✅ **Input Validation** - All user inputs validated  
✅ **Ethers.js v6** - Latest security and best practices  
✅ **Web3Modal** - Secure wallet integration  
✅ **Testnet Only** - Configured for Sepolia, prevents mainnet  

## 🌐 Network Configuration

**Network:** Sepolia Testnet  
**Chain ID:** 11155111  
**RPC:** eth-sepolia.g.alchemy.com  

**Deployed Contracts:**
- Token (ERC-20): `0x95C8f7166af42160a0C9472D6Db617163DEd44e8`
- NFT (ERC-721): `0xC561FE4044aF8B6176B64D8Da110420958411CAC`
- NFT2 (ERC-721 - Fixed Collection): `0x...` (deploy using `contracts/contracts/CustomNFT2.sol`)

**Block Explorer:** https://sepolia.etherscan.io

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Validate TypeScript types
```

### Key Files

- **App.tsx** - Main component with all features (1880+ lines)
- **vite.config.ts** - Vite + React + polyfills configuration
- **index.html** - HTML entry point
- **main.tsx** - React bootstrap

### Related Contract Files

- **CustomNFT2.sol** - Fixed collection ERC-721 contract (see `../contracts/contracts/CustomNFT2.sol`)
- **generate_metadata.py** - Metadata generator (see `../nft-collection/generate_metadata.py`)

### TypeScript Interfaces

```typescript
interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: number;
}

interface TokenMint {
  id: number;
  address: string;
  amount: string;
  tx_hash: string;
  created_at: string;
}

interface TokenDetails {
  address: string;
  contract: { address: string; name: string; symbol: string };
  token: { name: string; symbol: string; decimals: number; totalSupply: string };
  userBalance: { balance: string; ether: string; wei: string };
  metadata: { version: string; project: string; deploymentTimestamp: number };
  timestamp: string;
}

interface AddressDetails {
  address: string;
  balance: { eth: string; wei: string };
  gasPrice: { gwei: string; wei: string };
  blockNumber: number;
  timestamp: string;
}
```

---

## 🔌 API Integration

Frontend communicates with backend on port 3000:

```bash
GET  /api/address/details/:address       # Address details (balance, gas, block)
GET  /api/tokens/details/:address        # Token balance + metadata
POST /api/tokens/mint                    # Record mint transaction
GET  /api/tokens/mints/:address          # Mint history for address
GET  /api/tokens/stats                   # Global statistics
GET  /api/health                         # Health check
```

---

## 🎨 CustomNFT2 - Fixed Collection Deployment Guide

**What is CustomNFT2?**

CustomNFT2 is an ERC-721 contract optimized for fixed collections where:
- Metadata is pre-uploaded to Pinata and hardcoded in the contract
- No URI input needed when minting - URIs auto-generate from token ID
- Simpler UX: One-click minting from a fixed 100-piece collection
- All metadata always available (not dependent on external input)

**Key Features:**
- ✅ Hardcoded IPFS metadata CID: `bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i`
- ✅ Auto-URI generation: `ipfs://CID/{tokenId}.json`
- ✅ Three minting methods:
  - `safeMint(address)` - Simple minting, auto-URI
  - `safeMintWithUri(address, string)` - Custom URI override
  - `batchMint(address, uint256)` - Batch multiple tokens
- ✅ MAX_SUPPLY: 100 NFTs (IDs 0-99)
- ✅ Metadata available for all tokens instantly

**Deployment Steps:**

1. **Update Contract CID (if needed):**
   ```solidity
   // In CustomNFT2.sol, update the CID:
   string constant METADATA_CID = "bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i";
   ```

2. **Deploy to Sepolia:**
   ```bash
   cd contracts/
   npx hardhat deploy --network sepolia
   # Note the deployed contract address
   ```

3. **Configure Frontend:**
   ```bash
   cd ../frontend
   # Edit .env and add:
   VITE_NFT2_ADDRESS=0xYourDeployedAddressHere
   ```

4. **Test Minting:**
   - Open frontend http://localhost:5173
   - Connect wallet
   - Go to "🎁 CustomNFT2 - Fixed Collection" section
   - Click "Mint from Fixed Collection"
   - Transaction will succeed with auto-generated URI
   - NFT will be visible in MetaMask with full metadata

**Example Mints:**

All of these URIs are pre-made and available:
```
Token #0  → ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/0.json
Token #25 → ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/25.json
Token #50 → ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/50.json
Token #99 → ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/99.json
```

Each token automatically maps to its corresponding metadata file when minted.

**Rarity Distribution:**
```
Token IDs 0-4     → Mythic (5 NFTs) 🌟🌟🌟
Token IDs 5-24    → Legendary (20 NFTs) 🌟🌟
Token IDs 25-49   → Epic (25 NFTs) 🌟
Token IDs 50-69   → Rare (20 NFTs)
Token IDs 70-84   → Uncommon (15 NFTs)
Token IDs 85-99   → Common (15 NFTs)
```

**Contract Methods:**

```typescript
// Simple mint - auto-generates URI
await contract.safeMint(userAddress);

// Mint with custom URI (overrides default)
await contract.safeMintWithUri(userAddress, "ipfs://customURI");

// Batch mint multiple tokens at once
await contract.batchMint(userAddress, 5);  // Mints 5 tokens

// Query metadata
const uri = await contract.tokenURI(tokenId);  // Returns: ipfs://CID/{tokenId}.json
const metadata = await contract.getMetadata(tokenId);  // Full metadata object
const info = await contract.getInfo();  // Name, symbol, totalSupply
```

**Frontend Integration:**

The CustomNFT2 UI in App.tsx includes:
- ✅ **Mint Button** - One-click minting (no URI input needed)
- ✅ **Balance Display** - Shows your NFT2 count
- ✅ **Total Supply** - 100 max
- ✅ **CID Display** - Shows the fixed collection CID
- ✅ **Status Messages** - Real-time feedback

**Troubleshooting CustomNFT2:**

| Issue | Solution |
|-------|----------|
| "Contract not found" | Verify VITE_NFT2_ADDRESS in .env is correct |
| Mint fails with "MAX_SUPPLY reached" | Only 100 tokens can be minted total |
| Metadata not showing | Wait 1-2 minutes for IPFS propagation |
| Wrong metadata displayed | Token ID doesn't match metadata file (0-99 range) |
| "Invalid token ID" | Token ID must be 0-99 for valid metadata |

---

## 🎨 NFT Sample Collection (100 NFTs - Max Supply)

The `../nft-collection/` directory contains a complete 100-piece NFT collection (max supply for contract):

**Features:**
- ✅ **100 Unique NFTs** - Token IDs #0 through #99
- ✅ **1 Base Image** - Single SVG design used for entire collection
- ✅ **6 Rarity Tiers** - Mythic (5), Legendary (20), Epic (25), Rare (20), Uncommon (15), Common (15)
- ✅ **ERC-721 Compliant** - Standard metadata format
- ✅ **Pinata Ready** - Upload guide included for IPFS hosting

**Rarity Distribution:**
```
Mythic (0-4)           →  5 NFTs   🌟🌟🌟
Legendary (5-24)       → 20 NFTs   🌟🌟
Epic (25-49)           → 25 NFTs   🌟
Rare (50-69)           → 20 NFTs
Uncommon (70-84)       → 15 NFTs
Common (85-99)         → 15 NFTs
```

**Setup Instructions:**

1. **Generate metadata:**
   ```bash
   cd ../nft-collection
   cat README.md  # Read full setup guide
   ```

2. **Upload to Pinata:**
   - Upload `images/base.svg` → Get image hash
   - Update `generate_metadata.py` with image hash
   - Run: `python generate_metadata.py` (regenerates all 100 files)
   - Upload `metadata/` folder → Get metadata hash

3. **Mint any NFT:**
   Use any token ID from 0-99 in the frontend:
   ```
   ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/0.json    → CustomNFT #0 (Mythic)
   ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/25.json   → CustomNFT #25 (Epic)
   ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/50.json   → CustomNFT #50 (Rare)
   ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/99.json   → CustomNFT #99 (Common)
   ```

4. **View in wallets:**
   - NFTs appear in MetaMask after minting
   - Full metadata + image displays after IPFS propagation (1-2 mins)

**Example Minting:**
- Copy-paste: `ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/0.json` to mint CustomNFT #0
- Copy-paste: `ipfs://bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i/50.json` to mint CustomNFT #50 (Rare)
- Use any number 0-99 for different rarities!

---

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop and tablet
- **Color-Coded Banners** - Green (success), Yellow (warning), Red (error)
- **Loading States** - Visual feedback during transactions
- **Monospace Fonts** - Address display for clarity
- **Formatted Numbers** - Human-readable ETH/Gwei values
- **Links** - Etherscan integration for transactions

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /api/..." | Ensure backend is running on port 3000 |
| "Connect Wallet" button fails | Install MetaMask extension |
| Wrong network warning | Switch to Sepolia testnet in MetaMask |
| Insufficient gas error | Get free Sepolia ETH from faucet |
| Transactions not showing | Verify VITE_ETHERSCAN_API_KEY in .env |
| "Cannot find module 'ethers'" | Run `npm install` |
| Wallet not connecting | Verify MetaMask is unlocked and Sepolia selected |

---

## 📚 Dependencies

**Production:**
- `react@18` - UI framework
- `ethers@6` - Ethereum library
- `web3modal@3` - Wallet integration
- `@walletconnect/web3-provider` - WalletConnect support

**Development:**
- `typescript` - Type safety
- `vite` - Build tool
- `@vitejs/plugin-react` - React plugin
- `vite-plugin-node-polyfills` - Node.js polyfills

---

## 📚 Related Documentation

- **Backend:** See `../backend/README.md`
- **Smart Contracts:** See `../contracts/README.md`
- **Root:** See `../README.md`

---

## 🔐 Security Notes

⚠️ **Testnet Only:** App configured for Sepolia testnet  
⚠️ **Never commit .env:** Contains sensitive API keys  
⚠️ **Web3Modal:** Safe wallet integration (no key storage)  
⚠️ **Network Validation:** Chain ID verified on connect  

---

**Last Updated:** November 28, 2025
