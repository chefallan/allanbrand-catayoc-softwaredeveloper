import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Ethereum RPC
  alchemyApiKey: process.env.VITE_ALCHEMY_API_KEY,
  infuraId: process.env.VITE_INFURA_ID,
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
}

export default config
