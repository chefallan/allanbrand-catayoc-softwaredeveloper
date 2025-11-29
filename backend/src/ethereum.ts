import { ethers } from 'ethers'
import config from './config'

let provider: ethers.JsonRpcProvider

export function initializeProvider() {
  if (!config.infuraId && !config.alchemyApiKey) {
    throw new Error('Either VITE_INFURA_ID or VITE_ALCHEMY_API_KEY must be set')
  }

  // Prefer Alchemy if available, fallback to Infura (using Sepolia testnet)
  const rpcUrl = config.alchemyApiKey
    ? `https://eth-sepolia.g.alchemy.com/v2/${config.alchemyApiKey}`
    : `https://sepolia.infura.io/v3/${config.infuraId}`

  provider = new ethers.JsonRpcProvider(rpcUrl)
  return provider
}

export function getProvider() {
  if (!provider) {
    throw new Error('Provider not initialized. Call initializeProvider first.')
  }
  return provider
}

export async function getGasPrice() {
  const provider = getProvider()
  const feeData = await provider.getFeeData()
  
  // Use maxFeePerGas if available (EIP-1559), otherwise fall back to gasPrice
  const gasPriceWei = feeData.maxFeePerGas || feeData.gasPrice
  
  if (!gasPriceWei) {
    throw new Error('Unable to fetch gas price')
  }

  return {
    gasPrice: ethers.formatUnits(gasPriceWei, 'gwei'),
    gasPriceWei: gasPriceWei.toString(),
  }
}

export async function getBlockNumber() {
  const provider = getProvider()
  return await provider.getBlockNumber()
}

export async function getAccountBalance(address: string) {
  const provider = getProvider()
  
  // Validate address
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`)
  }

  const balance = await provider.getBalance(address)
  return {
    balance: ethers.formatEther(balance),
    balanceWei: balance.toString(),
  }
}

export async function getEthereumData(address: string) {
  if (!ethers.isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`)
  }

  const [gasPrice, blockNumber, balance] = await Promise.all([
    getGasPrice(),
    getBlockNumber(),
    getAccountBalance(address),
  ])

  return {
    address,
    gasPrice: gasPrice.gasPrice,
    gasPriceWei: gasPrice.gasPriceWei,
    blockNumber,
    balance: balance.balance,
    balanceWei: balance.balanceWei,
    timestamp: new Date().toISOString(),
  }
}
