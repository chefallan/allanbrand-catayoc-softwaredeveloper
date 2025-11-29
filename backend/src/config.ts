import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Ethereum RPC
  alchemyApiKey: process.env.VITE_ALCHEMY_API_KEY,
  infuraId: process.env.VITE_INFURA_ID,
  sepoliaRpc: process.env.VITE_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  
  // Smart Contracts
  contractAddresses: {
    token: process.env.VITE_CONTRACT_ADDRESS || '0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d',
    nft: process.env.VITE_NFT_CONTRACT_ADDRESS || '0x4752489c774D296F41BA5D3F8A2C7E551299c9c6',
    nft2: process.env.VITE_NFT2_CONTRACT_ADDRESS || '0xEDb0064eB0299Fb22eEB3DeA79f5cd258328Aa0A',
  },
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
}

export default config
