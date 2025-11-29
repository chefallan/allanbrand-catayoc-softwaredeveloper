# Smart Contracts - Ethereum ERC-20 & ERC-721

Complete smart contract suite with ERC-20 (fungible tokens) and ERC-721 (non-fungible tokens) implementations using OpenZeppelin standards.

## 📋 Project Overview

This project contains two production-ready smart contracts:

1. **CustomToken (ERC-20)** - Fungible token with minting, burning, and transfer capabilities
2. **CustomNFT (ERC-721)** - Non-fungible token with metadata URI support and batch minting

Both contracts follow OpenZeppelin best practices and include comprehensive test coverage.

## 🏗️ Project Structure

```
smart-contracts/
├── contracts/                      # Solidity smart contracts
│   ├── CustomToken.sol            # ERC-20 implementation
│   └── CustomNFT.sol              # ERC-721 implementation
├── test/                          # Test files (Hardhat/Chai)
│   ├── CustomToken.test.js        # ERC-20 tests
│   └── CustomNFT.test.js          # ERC-721 tests
├── scripts/                       # Deployment & utility scripts
│   └── deploy.js                  # Deployment script
├── deployments/                   # Deployment records (auto-generated)
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Dependencies
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v16+ and npm
- Hardhat (installed via npm)

### 1. Install Dependencies

```bash
cd smart-contracts
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
# For testnet deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here

# For contract verification on Etherscan
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**⚠️ SECURITY WARNING:** Never commit `.env` with real private keys!

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Test Locally
```bash
npm test
```
✅ All 39 tests should pass

### Step 2: Deploy to Localhost
```bash
# Terminal 1: Start local network
npx hardhat node

# Terminal 2: Deploy contracts
npm run deploy:local
```

### Step 3: Interact in Console
```bash
npx hardhat console

# Get signers
const [owner, addr1, addr2] = await ethers.getSigners();

# Load token contract
const token = await ethers.getContractAt("CustomToken", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

# Check balance
const balance = await token.balanceOf(owner.address);
console.log(ethers.formatEther(balance)); // "100.0"

# Mint tokens
await token.mint(addr1.address, ethers.parseEther("500"));

# Transfer tokens
await token.connect(addr1).transfer(addr2.address, ethers.parseEther("100"));

# Check final balances
console.log(ethers.formatEther(await token.balanceOf(addr1.address))); // "400.0"
console.log(ethers.formatEther(await token.balanceOf(addr2.address))); // "100.0"

.exit
```

---

## 🚀 Full Workflow (Deploy to Testnet)

### Step 1: Get Testnet ETH
Get free Sepolia ETH from faucet:
- **Alchemy Faucet:** https://www.sepoliafaucet.com (0.5 ETH)
- **Infura Faucet:** https://www.infura.io/faucet/sepolia (0.25 ETH)
- **QuickNode Faucet:** https://faucet.quicknode.com/sepolia

**Steps:**
1. Go to any faucet above
2. Paste your wallet address
3. Click "Send Me ETH"
4. Wait 30 seconds - 2 minutes
5. Check MetaMask for balance

### Step 2: Get API Keys
Get required API keys from:
- **Infura:** https://www.infura.io (for RPC endpoint)
- **Etherscan:** https://etherscan.io (for contract verification)

### Step 3: Configure .env
```bash
cp .env.example .env
```

Edit `.env`:
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_from_metamask
ETHERSCAN_API_KEY=your_etherscan_api_key
REPORT_GAS=true
```

### Step 4: Deploy to Sepolia
```bash
npm run deploy:sepolia
```

**Output:**
```
✅ CustomToken deployed to: 0x1234...
✅ CustomNFT deployed to: 0x5678...

Deployment info saved to: deployments/sepolia.json
```

### Step 5: Verify Contracts on Etherscan
```bash
# Verify CustomToken
npx hardhat verify 0x1234... --network sepolia

# Verify CustomNFT
npx hardhat verify 0x5678... "ipfs://" --network sepolia
```

Then view on Etherscan:
- CustomToken: https://sepolia.etherscan.io/address/0x1234...
- CustomNFT: https://sepolia.etherscan.io/address/0x5678...

### Step 6: Interact via Etherscan (GUI)
1. Open your contract on Etherscan (from Step 5)
2. Go to **"Read Contract"** tab → Query data
3. Go to **"Write Contract"** tab → Connect MetaMask
4. Call functions:
   - `mint(address, amount)` - Mint tokens
   - `transfer(address, amount)` - Send tokens
   - `balanceOf(address)` - Check balance

### Step 7: Interact via Console
```bash
npx hardhat console --network sepolia

const token = await ethers.getContractAt("CustomToken", "0x1234...");

// Mint
await token.mint("0xRecipient", ethers.parseEther("100"));

// Transfer
await token.transfer("0xRecipient", ethers.parseEther("50"));

// Burn
await token.burn(ethers.parseEther("25"));

.exit
```

---

### CustomToken (ERC-20)

**File:** `contracts/CustomToken.sol`

An ERC-20 compliant token with enhanced features:

#### Features
- ✅ Standard ERC-20 functionality (transfer, approve, allowance)
- ✅ Minting (owner only, with max supply cap)
- ✅ Burning (user and owner-initiated)
- ✅ Pause/unpause transfers
- ✅ 18 decimal places (standard)
- ✅ Max supply cap: 1 billion tokens

#### Key Functions

| Function | Description |
|----------|-------------|
| `mint(address to, uint256 amount)` | Mint new tokens (owner only) |
| `burn(uint256 amount)` | Burn caller's tokens |
| `burnFrom(address from, uint256 amount)` | Burn tokens from address (owner only) |
| `transfer(address to, uint256 amount)` | Transfer tokens to recipient |
| `transferFrom(address from, address to, uint256 amount)` | Transfer tokens on behalf of owner |
| `approve(address spender, uint256 amount)` | Approve spending limit |
| `setPaused(bool _paused)` | Pause/unpause transfers (owner only) |

#### Deployment Example

```solidity
// Deploy with 100 token initial supply
CustomToken token = new CustomToken(100 * 10^18);
```

---

### CustomNFT (ERC-721)

**File:** `contracts/CustomNFT.sol`

An ERC-721 compliant NFT contract with advanced features:

#### Features
- ✅ Standard ERC-721 functionality (transfer, approve)
- ✅ Enumerable extension (view all tokens)
- ✅ URI Storage extension (metadata support)
- ✅ Single and batch minting
- ✅ Token burning
- ✅ Max supply cap: 10,000 NFTs
- ✅ Optional minting fee
- ✅ Base URI management

#### Key Functions

| Function | Description |
|----------|-------------|
| `safeMint(address to, string uri)` | Mint single NFT with metadata URI |
| `batchMint(address to, string[] uris)` | Mint multiple NFTs in one transaction |
| `burn(uint256 tokenId)` | Burn an NFT |
| `transferToken(address from, address to, uint256 tokenId)` | Transfer NFT |
| `approveTransfer(address to, uint256 tokenId)` | Approve NFT for transfer |
| `setBaseURI(string newBaseURI)` | Update metadata base URI (owner only) |
| `setMintingFee(uint256 newFee)` | Set minting fee in wei (owner only) |
| `withdrawFees()` | Withdraw collected minting fees (owner only) |

#### Deployment Example

```solidity
// Deploy with IPFS base URI
CustomNFT nft = new CustomNFT("ipfs://");
```

---

## 🧪 Testing

Run comprehensive test suite:

```bash
npm test
```

Run tests with gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

Run specific test file:

```bash
npx hardhat test test/CustomToken.test.js
npx hardhat test test/CustomNFT.test.js
```

### Test Coverage

#### CustomToken Tests
- ✅ Deployment & initialization
- ✅ Minting (single, limits, permissions)
- ✅ Transfers & approvals
- ✅ Burning (user and owner)
- ✅ Pause/unpause functionality
- ✅ Max supply enforcement

#### CustomNFT Tests
- ✅ Deployment & initialization
- ✅ Single & batch minting
- ✅ Token transfers & approvals
- ✅ Burning & ownership
- ✅ Base URI management
- ✅ Minting fee handling
- ✅ Fee withdrawal

## 🚀 Deployment

### Local Testing Network

Start a local Hardhat network:

```bash
npx hardhat node
```

In another terminal, deploy to localhost:

```bash
npm run deploy:local
```

### Sepolia Testnet

```bash
npm run deploy:sepolia
```

### Goerli Testnet

```bash
npm run deploy:goerli
```

### Deployment Output

After successful deployment, contract addresses are saved to `deployments/{network}.json`:

```json
{
  "network": "sepolia",
  "timestamp": "2025-11-29T10:30:45.000Z",
  "deployer": "0x...",
  "contracts": {
    "customToken": {
      "address": "0x...",
      "type": "ERC-20",
      "initialSupply": "100000000000000000000"
    },
    "customNFT": {
      "address": "0x...",
      "type": "ERC-721",
      "baseURI": "ipfs://"
    }
  }
}
```

## ✅ Contract Verification

Verify deployed contracts on Etherscan:

```bash
npx hardhat verify <CONTRACT_ADDRESS> --network sepolia
```

For contracts with constructor arguments:

```bash
npx hardhat verify <CONTRACT_ADDRESS> "100000000000000000000" --network sepolia
```

## 📊 Contract Interactions

### 3 Ways to Interact

#### **1️⃣ Hardhat Console (Interactive & Manual)**
Best for testing and exploring in real-time:

```bash
# Local testing
npx hardhat console

# Or with Sepolia testnet
npx hardhat console --network sepolia
```

Common commands:
```javascript
// Load contract
const token = await ethers.getContractAt("CustomToken", "0x...");
const nft = await ethers.getContractAt("CustomNFT", "0x...");

// Get signers
const [owner, user1, user2] = await ethers.getSigners();

// Token operations
const balance = await token.balanceOf(owner.address);
await token.mint(user1.address, ethers.parseEther("100"));
await token.connect(user1).transfer(user2.address, ethers.parseEther("50"));
await token.burn(ethers.parseEther("25"));

// NFT operations
const totalSupply = await nft.totalSupply();
await nft.safeMint(user1.address, "ipfs://QmHash/metadata.json");
await nft.connect(user1).transferToken(user1.address, user2.address, 0);

// Format output
console.log(ethers.formatEther(balance));
```

#### **2️⃣ Etherscan (Web-Based GUI)** ⭐ **Easiest**
After deploying and verifying contract on Etherscan:

1. Go to: `https://sepolia.etherscan.io/address/0x...`
2. Click **"Read Contract"** tab:
   - `balanceOf(address)` - Check balance
   - `totalSupply()` - Total minted tokens
   - `allowance(owner, spender)` - Check approval limit

3. Click **"Write Contract"** tab:
   - Connect MetaMask wallet
   - Call `mint(address, amount)`
   - Call `transfer(address, amount)`
   - Call `approve(address, amount)`
   - Call `burn(amount)`

#### **3️⃣ Automated Script**
Run the pre-made interaction script:

```bash
# Localhost
npx hardhat run scripts/interact.js

# Sepolia testnet
npx hardhat run scripts/interact.js --network sepolia
```

Or create custom script in `scripts/`:
```javascript
const token = await ethers.getContractAt("CustomToken", "0x...");
await token.mint(address, amount);
console.log("✅ Minted successfully");
```

### Common Interaction Patterns

**Mint → Transfer → Burn:**
```javascript
const token = await ethers.getContractAt("CustomToken", TOKEN_ADDRESS);
const [owner, user1, user2] = await ethers.getSigners();

// 1. Mint 1000 tokens to user1
await token.mint(user1.address, ethers.parseEther("1000"));

// 2. User1 transfers 500 to user2
await token.connect(user1).transfer(user2.address, ethers.parseEther("500"));

// 3. User1 burns remaining 500
await token.connect(user1).burn(ethers.parseEther("500"));

// Check final state
console.log("User2 balance:", ethers.formatEther(await token.balanceOf(user2.address)));
```

**Approve → TransferFrom:**
```javascript
// User1 allows owner to spend 100 tokens
await token.connect(user1).approve(owner.address, ethers.parseEther("100"));

// Owner transfers those 100 tokens to user2
await token.transferFrom(user1.address, user2.address, ethers.parseEther("100"));
```

**NFT Minting & Transfer:**
```javascript
const nft = await ethers.getContractAt("CustomNFT", NFT_ADDRESS);

// 1. Mint single NFT
await nft.safeMint(user1.address, "ipfs://QmHash/nft1.json");

// 2. Batch mint multiple NFTs (more gas efficient)
const uris = ["ipfs://QmHash/nft2.json", "ipfs://QmHash/nft3.json"];
await nft.batchMint(user1.address, uris);

// 3. User1 transfers NFT #0 to user2
await nft.connect(user1).transferToken(user1.address, user2.address, 0);

// 4. Check NFT owner
const ownerOfNFT = await nft.ownerOf(0);
console.log("NFT #0 owner:", ownerOfNFT);
```

### Using Ethers.js in Applications

```javascript
const { ethers } = require("ethers");

// Setup
const contractAddress = "0x...";
const abi = require("./artifacts/contracts/CustomToken.sol/CustomToken.json").abi;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, abi, signer);

// Mint tokens
const tx = await contract.mint("0xAddress", ethers.parseEther("100"));
await tx.wait();

// Transfer tokens
const tx2 = await contract.transfer("0xRecipient", ethers.parseEther("50"));
await tx2.wait();

// Query data
const balance = await contract.balanceOf("0xAddress");
console.log("Balance:", ethers.formatEther(balance), "tokens");
```

---

### Built-in Security Features
- ✅ OpenZeppelin battle-tested contracts
- ✅ Owner-based access control
- ✅ Input validation (zero address checks)
- ✅ Supply caps to prevent inflation
- ✅ Pausable transfers to handle emergencies

### Before Mainnet Deployment
1. **Audit:** Have contracts audited by security firm
2. **Test:** Run full test suite on testnet first
3. **Gas Optimization:** Review gas usage and optimize
4. **Documentation:** Document all functions and behaviors
5. **Time Lock:** Consider implementing time-lock for owner functions
6. **Multi-sig:** Use multi-signature wallet for mainnet deployment

## 💡 Usage Examples

### Example 1: Create and Distribute ERC-20 Tokens

```bash
# Deploy contract
npm run deploy:sepolia

# In console or app:
# 1. Mint tokens to multiple addresses
# 2. Users transfer tokens between themselves
# 3. Set up minting schedule for different phases
```

### Example 2: Create NFT Collection

```bash
# Deploy CustomNFT
npm run deploy:sepolia

# Mint NFTs with metadata:
const nft = await ethers.getContractAt("CustomNFT", NFT_ADDRESS);

// Single mint
await nft.safeMint(userAddress, "ipfs://QmHash/metadata.json");

// Batch mint (more gas efficient)
const uris = [
  "ipfs://QmHash/nft1.json",
  "ipfs://QmHash/nft2.json",
  "ipfs://QmHash/nft3.json"
];
await nft.batchMint(userAddress, uris);

// Users can trade NFTs
await nft.transferToken(from, to, tokenId);
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "ENOENT: no such file" | Run `npm install` to install dependencies |
| "Cannot find module 'hardhat'" | Install globally: `npm install -g hardhat` |
| "Invalid private key" | Check .env file has valid private key (without 0x prefix) |
| "Insufficient funds" | Ensure deployer address has enough ETH for gas |
| "Contract already verified" | Contract already on Etherscan |
| "Gas limit exceeded" | Increase gas limit in hardhat.config.js |

## 📚 Additional Resources

- [OpenZeppelin Documentation](https://docs.openzeppelin.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [ERC-20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [Etherscan Verification Guide](https://docs.etherscan.io/tutorials/smart-contracts/verify-smart-contracts)

## 📝 License

These smart contracts are provided as-is for educational purposes. SPDX-License-Identifier: MIT

---

**Last Updated:** November 29, 2025
