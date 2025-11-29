
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
✅ **Token Minting** - FREE minting with gas validation  
✅ **Balance Display** - Token balance + ETH balance (full Wei precision)  
✅ **Token Details** - Metadata, decimals, total supply  
✅ **Address Viewer** - View any Ethereum address details  
✅ **Transaction History** - Last 10 transactions from Etherscan  
✅ **Gas Price Display** - Real-time Gwei and Wei data  
✅ **Block Number** - Current Sepolia block height  
✅ **Error Handling** - Comprehensive validation and user feedback

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.tsx                # Main component (1400+ lines)
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
VITE_API_URL=http://localhost:3000          # Backend API endpoint
VITE_TOKEN_ADDRESS=0x95C8f7166...           # Sepolia token address
VITE_NFT_ADDRESS=0xC561FE4044...            # Sepolia NFT address
VITE_ETHERSCAN_API_KEY=your_etherscan_key   # For transaction history
```

**Optional:**
```bash
VITE_INFURA_ID=your_infura_id               # For WalletConnect fallback
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

### 4. Address Viewer
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

### 5. Transaction History
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

### 6. Error Handling
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

- **App.tsx** - Main component with all features (1400+ lines)
- **vite.config.ts** - Vite + React + polyfills configuration
- **index.html** - HTML entry point
- **main.tsx** - React bootstrap

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
