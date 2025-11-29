import { Router, Request, Response, NextFunction } from 'express'
import { getEthereumData, getGasPrice, getBlockNumber, getProvider } from './ethereum'
import { getFromCache, setCache } from './cache'
import { saveAccountBalance } from './database'
import { validateAddress } from './middleware'
import { ethers } from 'ethers'

const router = Router()

// In-memory storage for token mints (in production, use database)
interface TokenMint {
  id: number
  address: string
  amount: string
  tx_hash: string
  created_at: string
}

const tokenMints: TokenMint[] = []
let mintIdCounter = 1

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

// GET /api/address/details/:address
// Get address details: balance, gas price, block number
router.get('/address/details/:address', validateAddress, async (req: Request, res: Response, next: NextFunction) => {
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
        balance: {
          ether: ethereumData.balance,
          wei: ethereumData.balanceWei,
        },
        gasPrice: {
          gwei: gasPrice,
          wei: ethereumData.gasPriceWei,
        },
        blockNumber,
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

// POST /api/tokens/mint
// Record a token mint transaction
router.post('/tokens/mint', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address, amount, transactionHash } = req.body

    // Validate input
    if (!address || !amount || !transactionHash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: address, amount, transactionHash',
      })
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format',
      })
    }

    // Create mint record
    const mint: TokenMint = {
      id: mintIdCounter++,
      address: address.toLowerCase(),
      amount: amount.toString(),
      tx_hash: transactionHash,
      created_at: new Date().toISOString(),
    }

    tokenMints.push(mint)

    res.json({
      success: true,
      data: mint,
      message: 'Token mint recorded successfully',
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/tokens/mints/:address
// Get all token mints for a specific address
router.get('/tokens/mints/:address', validateAddress, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params
    const normalizedAddress = address.toLowerCase()

    // Filter mints for this address
    const addressMints = tokenMints.filter(
      (mint) => mint.address === normalizedAddress
    )

    res.json({
      success: true,
      data: addressMints,
      total: addressMints.length,
      address: normalizedAddress,
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/tokens/stats
// Get token minting statistics
router.get('/tokens/stats', async (req: Request, res: Response) => {
  try {
    const totalMints = tokenMints.length
    const totalAmount = tokenMints.reduce((sum, mint) => {
      return sum + parseFloat(mint.amount)
    }, 0)

    const uniqueAddresses = new Set(tokenMints.map((m) => m.address)).size

    res.json({
      success: true,
      data: {
        totalMints,
        totalAmount: totalAmount.toString(),
        uniqueAddresses,
        allMints: tokenMints,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token stats',
    })
  }
})

// GET /api/tokens/details/:address
// Get token details and user's token balance for a given address
router.get('/tokens/details/:address', validateAddress, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params
    const contractAddress = process.env.VITE_CONTRACT_ADDRESS || '0x95C8f7166af42160a0C9472D6Db617163DEd44e8'

    const CUSTOM_TOKEN_ABI = [
      'function name() public view returns (string)',
      'function symbol() public view returns (string)',
      'function decimals() public view returns (uint8)',
      'function totalSupply() public view returns (uint256)',
      'function balanceOf(address) public view returns (uint256)',
      'function getMetadata() public view returns (string, string, string, string, uint8, uint256, uint256, uint256)',
      'function getInfo() public view returns (string)',
    ]

    const provider = getProvider()
    const contract = new ethers.Contract(contractAddress, CUSTOM_TOKEN_ABI, provider)

    // Fetch token details
    const [name, symbol, decimals, totalSupply, balance, metadata, info] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      contract.balanceOf(address),
      contract.getMetadata(),
      contract.getInfo(),
    ])

    // Format numbers
    const formattedBalance = ethers.formatUnits(balance, decimals)
    const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals)

    // Parse metadata tuple
    const [metaVersion, metaProject, metaName, metaSymbol, metaDecimals, metaMaxSupply, metaTotalSupply, metaDeploymentTimestamp] = metadata

    res.json({
      success: true,
      data: {
        address,
        contract: contractAddress,
        token: {
          name,
          symbol,
          decimals: Number(decimals),
          totalSupply: formattedTotalSupply,
          totalSupplyWei: totalSupply.toString(),
          info,
        },
        userBalance: {
          balance: formattedBalance,
          balanceWei: balance.toString(),
        },
        metadata: {
          version: metaVersion,
          project: metaProject,
          name: metaName,
          symbol: metaSymbol,
          decimals: Number(metaDecimals),
          maxSupply: ethers.formatUnits(metaMaxSupply, metaDecimals),
          totalSupply: ethers.formatUnits(metaTotalSupply, metaDecimals),
          deploymentTimestamp: Number(metaDeploymentTimestamp),
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Token details error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch token details',
    })
  }
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
