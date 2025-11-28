import http from 'http'
import https from 'https'
import readline from 'readline'
import config from './config'

const API_BASE = 'http://localhost:3001/api/ethereum'

interface EthereumData {
  address: string
  gasPrice: {
    gwei: string
  }
  blockNumber: number
  balance: {
    ether: string
  }
}

interface EthereumDataError {
  error: string
}

/**
 * Make an RPC call to the Ethereum network
 */
function rpcCall(method: string, params: any[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const ALCHEMY_API_KEY = config.alchemyApiKey
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1
    })

    const options = {
      hostname: 'eth-mainnet.g.alchemy.com',
      path: `/v2/${ALCHEMY_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          if (response.result) {
            resolve(response.result)
          } else {
            reject(new Error(response.error?.message || 'RPC Error'))
          }
        } catch (e) {
          reject(new Error('Invalid RPC response'))
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

/**
 * Make a request to the backend API and save to cache/database
 */
function makeRequest(address: string): Promise<any> {
  return new Promise((resolve) => {
    const url = `${API_BASE}/${address}`

    http
      .get(url, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const response = JSON.parse(data)
            if (response.success) {
              console.log(`Saved to balances.json`)
              console.log(`Cached gas price and block number (30s TTL)`)
            }
            resolve(response)
          } catch (e) {
            resolve({ success: false, error: 'Invalid response format' })
          }
        })
      })
      .on('error', (err) => {
        resolve({ success: false, error: err.message })
      })
  })
}

/**
 * Display API response in JSON format
 */
function displayResponse(response: any): void {
  console.log('\n' + JSON.stringify(response, null, 2))
}

/**
 * Display direct RPC response in JSON format
 */
function displayDirectResponse(data: EthereumData | EthereumDataError): void {
  console.log('\n' + JSON.stringify(data, null, 2))
}

/**
 * Prompt user for input
 */
function prompt(): void {
  rl.question('\nEnter Ethereum address (or "exit" to quit): ', async (address) => {
    if (address.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!\n')
      rl.close()
      return
    }

    if (!address.trim()) {
      console.log('Please enter an address')
      prompt()
      return
    }

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      console.log('Invalid address format. Must be 0x followed by 40 hex characters')
      prompt()
      return
    }

    const response = await makeRequest(address)
    displayResponse(response)
    prompt()
  })
}

console.log('\nEthereum Address Tracker')
console.log('════════════════════════════════════════')
console.log('   Enter an Ethereum address (0x...)')
console.log('   Automatically saves to balances.json')
console.log('   Caches gas price & block number')
console.log('   Type "exit" to quit\n')

// Start prompting
prompt()
