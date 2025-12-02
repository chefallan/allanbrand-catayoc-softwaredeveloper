import { Pool } from 'pg'
import config from './config'
import * as fs from 'fs'
import * as path from 'path'

let pool: Pool | null = null
let useInMemoryDb = false
let inMemoryDb: Map<string, any> = new Map()

const DB_FILE = path.join(__dirname, '../data/balances.json')
const NFT2_MINTS_FILE = path.join(__dirname, '../data/nft2_mints.json')

interface NFT2Mint {
  address: string
  tokenId: number
  txHash: string
  timestamp: string
}

let nft2Mints: Map<string, NFT2Mint[]> = new Map()

export async function initializeDatabase() {
  try {
    if (!config.databaseUrl) {
      console.warn('DATABASE_URL not set, using in-memory database')
      useInMemoryDb = true
      loadInMemoryDb()
      return null
    }

    pool = new Pool({
      connectionString: config.databaseUrl,
    })

    pool.on('error', (err) => console.error('Unexpected error on idle client', err))

    // Test connection
    const client = await pool.connect()
    console.log('✓ PostgreSQL connected')
    client.release()

    // Create tables if they don't exist
    await createTables()

    // Load NFT2 mints
    loadNFT2Mints()

    return pool
  } catch (error) {
    console.warn('PostgreSQL not available, falling back to in-memory database')
    useInMemoryDb = true
    loadInMemoryDb()
    loadNFT2Mints()
    return null
  }
}

function loadInMemoryDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8')
      const records = JSON.parse(data)
      
      // Handle both array and object formats
      if (Array.isArray(records)) {
        for (const record of records) {
          inMemoryDb.set(record.address.toLowerCase(), record)
        }
      } else {
        // Handle object format
        for (const [address, record] of Object.entries(records)) {
          inMemoryDb.set(address.toLowerCase(), record as any)
        }
      }
      console.log(`✓ Loaded ${inMemoryDb.size} account balances from file`)
    }
  } catch (error) {
    console.warn('Could not load existing database file, starting fresh')
  }
}

function saveInMemoryDb() {
  try {
    const dir = path.dirname(DB_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const records = Array.from(inMemoryDb.values())
    fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2))
    console.log(`[DB] File saved: ${records.length} addresses in ${DB_FILE}`)
  } catch (error) {
    console.error('Error saving in-memory database:', error)
  }
}

async function createTables() {
  if (!pool) return

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_balances (
        id SERIAL PRIMARY KEY,
        address VARCHAR(42) UNIQUE NOT NULL,
        balance VARCHAR(100) NOT NULL,
        balance_wei VARCHAR(100) NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_address ON account_balances(address);
    `)
    console.log('✓ Database tables initialized')
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

export function getPool() {
  return pool
}

export async function saveAccountBalance(
  address: string,
  balance: string,
  balanceWei: string
) {
  const lowerAddress = address.toLowerCase()
  const timestamp = new Date().toISOString()
  
  // Always update in-memory database
  const existingRecord = inMemoryDb.get(lowerAddress)
  const record = {
    address: lowerAddress,
    balance,
    balance_wei: balanceWei,
    last_updated: timestamp,
    created_at: existingRecord ? existingRecord.created_at : timestamp,
  }
  
  inMemoryDb.set(lowerAddress, record)
  
  // Always save to JSON file (balances.json)
  saveInMemoryDb()
  console.log(`[DB] Saved to balances.json: ${lowerAddress}`)
  
  // Also save to PostgreSQL if available
  if (pool && !useInMemoryDb) {
    try {
      const result = await pool.query(
        `INSERT INTO account_balances (address, balance, balance_wei, last_updated)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (address) DO UPDATE 
         SET balance = $2, balance_wei = $3, last_updated = CURRENT_TIMESTAMP
         RETURNING *`,
        [lowerAddress, balance, balanceWei]
      )
      console.log(`[DB] Saved to PostgreSQL: ${lowerAddress}`)
      return result.rows[0]
    } catch (error) {
      console.error('Error saving to PostgreSQL:', error)
      // Return the in-memory record even if PostgreSQL fails
      return record
    }
  }
  
  return record
}

export async function getAccountBalance(address: string) {
  const lowerAddress = address.toLowerCase()
  
  if (useInMemoryDb) {
    return inMemoryDb.get(lowerAddress) || null
  }

  if (!pool) return null

  try {
    const result = await pool.query(
      'SELECT * FROM account_balances WHERE address = $1',
      [lowerAddress]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error getting account balance:', error)
    return null
  }
}

export async function getAllAccountBalances() {
  if (useInMemoryDb) {
    const records = Array.from(inMemoryDb.values())
    return records.sort((a, b) => 
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    ).slice(0, 100)
  }

  if (!pool) return []

  try {
    const result = await pool.query(
      'SELECT * FROM account_balances ORDER BY last_updated DESC LIMIT 100'
    )
    return result.rows
  } catch (error) {
    console.error('Error getting all account balances:', error)
    return []
  }
}

function loadNFT2Mints() {
  try {
    if (fs.existsSync(NFT2_MINTS_FILE)) {
      const data = fs.readFileSync(NFT2_MINTS_FILE, 'utf-8')
      const mints: NFT2Mint[] = JSON.parse(data)
      
      // Group by address
      for (const mint of mints) {
        const addr = mint.address.toLowerCase()
        if (!nft2Mints.has(addr)) {
          nft2Mints.set(addr, [])
        }
        nft2Mints.get(addr)!.push(mint)
      }
      console.log(`✓ Loaded ${mints.length} NFT2 mints from ${NFT2_MINTS_FILE}`)
    } else {
      console.log(`[DB] NFT2 mints file does not exist yet: ${NFT2_MINTS_FILE}`)
    }
  } catch (error) {
    console.warn(`[DB] Could not load NFT2 mints file from ${NFT2_MINTS_FILE}, starting fresh:`, error)
  }
}

function saveNFT2Mints() {
  try {
    const dir = path.dirname(NFT2_MINTS_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`[DB] Created directory: ${dir}`)
    }
    
    const allMints: NFT2Mint[] = []
    for (const mints of nft2Mints.values()) {
      allMints.push(...mints)
    }
    
    fs.writeFileSync(NFT2_MINTS_FILE, JSON.stringify(allMints, null, 2))
    console.log(`[DB] NFT2 mints saved to ${NFT2_MINTS_FILE}: ${allMints.length} total mints`)
  } catch (error) {
    console.error(`[DB] Error saving NFT2 mints to ${NFT2_MINTS_FILE}:`, error)
  }
}

export function getNFT2Mints(address: string): NFT2Mint[] {
  const lowerAddress = address.toLowerCase()
  const mints = nft2Mints.get(lowerAddress) || []
  console.log(`[DB] getNFT2Mints(${lowerAddress}): found ${mints.length} mints, tokenIds: ${mints.map(m => m.tokenId).join(', ')}`)
  return mints
}

export function addNFT2Mint(address: string, tokenId: number, txHash: string): NFT2Mint {
  const mint: NFT2Mint = {
    address: address.toLowerCase(),
    tokenId,
    txHash,
    timestamp: new Date().toISOString(),
  }
  
  if (!nft2Mints.has(address.toLowerCase())) {
    nft2Mints.set(address.toLowerCase(), [])
  }
  nft2Mints.get(address.toLowerCase())!.push(mint)
  
  console.log(`[DB] Added NFT2 mint: ${address} Token #${tokenId}`)
  
  // Save to file immediately
  saveNFT2Mints()
  
  return mint
}

export async function closeDatabase() {
  if (useInMemoryDb) {
    saveInMemoryDb()
  }
  // Always save NFT2 mints
  saveNFT2Mints()
  if (pool) {
    await pool.end()
  }
}
