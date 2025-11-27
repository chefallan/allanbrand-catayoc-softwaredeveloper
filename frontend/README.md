
# Frontend

This documentation summarizes the frontend.

## What it does
- Connects to Ethereum wallets (MetaMask, WalletConnect via Web3Modal)
- Shows connected address and ETH balance (using `ethers.js`)
- Fetches the last 10 transactions via the Etherscan API (V2)

## How it was coded (high level)
- Framework: React 18 + TypeScript
- Bundler: Vite (fast dev server and build)
- Wallet logic: `web3modal` + `@walletconnect/web3-provider`
- Blockchain: `ethers` v6 (we use `BrowserProvider`, `getBalance`, `formatEther`)
- Transactions: Etherscan API V2 (`https://api.etherscan.io/v2/api`) — V1 is deprecated

## Run locally
1. Copy `.env.example` → `.env` and fill values:
	 - `VITE_ETHERSCAN_API_KEY=...`
	 - `VITE_INFURA_ID=...` (optional, for WalletConnect)
2. Install and run:
```powershell
cd frontend
npm install
npm run dev
```
3. Open `http://localhost:5173/` and click "Connect Wallet".

## Important environment variables
- `VITE_ETHERSCAN_API_KEY` — required to fetch transactions
- `VITE_INFURA_ID` — optional, useful for WalletConnect RPC

Access them in code as `import.meta.env.VITE_*`.

## Key implementation notes
- The app uses `ethers.BrowserProvider(instance)` to wrap the wallet provider returned by Web3Modal.
- Balance is fetched with `provider.getBalance(address)` and displayed using `ethers.formatEther`.
- Transactions are fetched from Etherscan V2 with `chainid=1` and parsed; the code includes error handling for the common `NOTOK` response (which can indicate V1 usage, no txs, or rate limits).
- We included a Vite polyfills plugin to support WalletConnect's Node globals (`global`, `Buffer`) in the browser.

## Troubleshooting (quick)
- If transactions show `NOTOK`: ensure you use a V2 endpoint or regenerate your Etherscan API key. Test with a public address (e.g., Vitalik) using the V2 URL:
	`https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=0x...&offset=10&apikey=KEY`
- If wallet connection fails: verify MetaMask is installed/unlocked or `VITE_INFURA_ID` is set for WalletConnect.
- If `global is not defined` or `buffer` errors: ensure `vite-plugin-node-polyfills` is installed and the plugin is added to `vite.config.ts`.

## Where to look in the code
- `src/App.tsx` — main logic: `connectWallet()`, `fetchTxs()` and rendering
- `src/vite-env.d.ts` — TypeScript types for `import.meta.env`
- `vite.config.ts` — plugin config (polyfills + React plugin)


