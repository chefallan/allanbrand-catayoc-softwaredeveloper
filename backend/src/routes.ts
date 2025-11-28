import { Router, Request, Response, NextFunction } from 'express'
import { getEthereumData, getGasPrice, getBlockNumber } from './ethereum'
import { getFromCache, setCache } from './cache'
import { saveAccountBalance } from './database'
import { validateAddress } from './middleware'

const router = Router()

// GET /api/ethereum/:address
// Returns gas price, block number, and account balance for a given address
router.get('/ethereum/:address', validateAddress, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params

    // Try to get cached gas price and block number
    const cacheKey = 'ethereum:global-data'
    const cachedData = await getFromCache<any>(cacheKey)
    const isCached = !!cachedData

    let gasPrice, blockNumber

    if (cachedData) {
      gasPrice = cachedData.gasPrice
      blockNumber = cachedData.blockNumber
    } else {
      // Fetch fresh data and cache it for 30 seconds
      const [gasPriceData, blockNum] = await Promise.all([
        getGasPrice(),
        getBlockNumber(),
      ])
      
      gasPrice = gasPriceData.gasPrice
      blockNumber = blockNum

      await setCache(
        cacheKey,
        { gasPrice, blockNumber },
        30
      )
    }

    // Always fetch fresh balance (account-specific, don't cache)
    const ethereumData = await getEthereumData(address)

    // Save balance to database
    await saveAccountBalance(address, ethereumData.balance, ethereumData.balanceWei)

    // Return response
    res.json({
      success: true,
      data: {
        address: ethereumData.address,
        gasPrice: {
          gwei: gasPrice,
          wei: ethereumData.gasPriceWei,
        },
        blockNumber,
        balance: {
          ether: ethereumData.balance,
          wei: ethereumData.balanceWei,
        },
        timestamp: ethereumData.timestamp,
      },
      cached: {
        gasPrice: isCached,
        blockNumber: isCached,
        balance: false,
      },
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/ethereum/:address/history
// Returns stored account balance history from database
router.get('/ethereum/:address/history', validateAddress, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params

    // This would require storing history of balances
    // For now, just return the current balance info
    res.json({
      success: true,
      message: 'Balance history endpoint - not yet implemented',
      address,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/health
// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

// GET /api/status
// Alias for health
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

// POST /api/cache/clear
// Clear cache
router.post('/cache/clear', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Cache operations available via get/set functions',
  })
})

// GET /api/test/cache
// Test cache functionality
router.get('/test/cache', async (req: Request, res: Response) => {
  const testKey = 'test:data'
  
  // Try to get from cache
  const cached = await getFromCache<any>(testKey)
  
  // Set in cache if not found
  if (!cached) {
    await setCache(testKey, { test: 'data', timestamp: Date.now() }, 60)
    res.json({
      success: true,
      operation: 'set',
      key: testKey,
      message: 'Data cached',
    })
  } else {
    res.json({
      success: true,
      operation: 'hit',
      key: testKey,
      cached: cached,
      message: 'Data retrieved from cache',
    })
  }
})

export default router
