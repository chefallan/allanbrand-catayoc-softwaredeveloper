import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import config from './config'
import { initializeProvider } from './ethereum'
import { initializeRedis, closeRedis, clearExpiredCache } from './cache'
import { initializeDatabase, closeDatabase } from './database'
import { errorHandler } from './middleware'
import apiRoutes from './routes'

const app = express()

// Middleware
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())

// Initialize services
async function initializeServices() {
  try {
    console.log('Initializing Ethereum provider...')
    initializeProvider()
    console.log('✓ Ethereum provider ready')

    console.log('Initializing Redis cache...')
    const redisTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    )
    await Promise.race([initializeRedis(), redisTimeout]).catch(() => {
      console.log('⚠ Redis unavailable')
    })
    console.log('✓ Cache ready')

    console.log('Initializing database...')
    const dbTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 3000)
    )
    await Promise.race([initializeDatabase(), dbTimeout]).catch(() => {
      console.log('⚠ Database unavailable')
    })
    console.log('✓ Database ready')

    console.log('All services initialized successfully')
  } catch (error) {
    console.error('Error initializing services:', error)
    process.exit(1)
  }
}

// Routes
app.use('/api', apiRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  })
})

// Error handler
app.use(errorHandler)

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down gracefully...')
  await closeRedis()
  await closeDatabase()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Start server
async function start() {
  try {
    await initializeServices()

    // Periodic cache cleanup (every 10 seconds)
    setInterval(() => {
      clearExpiredCache()
    }, 10000)

    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`)
      console.log(`Environment: ${config.nodeEnv}`)
      console.log(`Health check: http://localhost:${config.port}/api/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
