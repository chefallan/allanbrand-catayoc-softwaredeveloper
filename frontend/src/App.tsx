import { useState } from 'react'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import WalletConnectProvider from '@walletconnect/web3-provider'

type Tx = {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: number
}

export default function App() {
  const [address, setAddress] = useState<string>('')
  const [balance, setBalance] = useState<string>('')
  const [txs, setTxs] = useState<Tx[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function connectWallet() {
    setError(null)
    setLoading(true)
    try {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: import.meta.env.VITE_INFURA_ID || ''
          }
        }
      }

      const web3Modal = new Web3Modal({ cacheProvider: true, providerOptions })
      const instance = await web3Modal.connect()
      const provider = new ethers.BrowserProvider(instance as any)

      const signer = await provider.getSigner()
      const addr = await signer.getAddress()
      setAddress(addr)

      const bal = await provider.getBalance(addr)
      setBalance(ethers.formatEther(bal))

      await fetchTxs(addr)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Failed to connect')
    } finally {
      setLoading(false)
    }
  }

  async function fetchTxs(addr: string) {
    setError(null)
    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY
      if (!apiKey) {
        setError('Missing Etherscan API key. Set VITE_ETHERSCAN_API_KEY in .env')
        setTxs([])
        return
      }
      
      // Use Etherscan API V2 (V1 is deprecated)
      const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`
      console.log('Fetching transactions from Etherscan V2')
      const res = await fetch(url)
      const data = await res.json()
      console.log('Etherscan API response:', data)
      
      if (data.status !== '1') {
        console.warn('API returned status:', data.status, 'message:', data.message)
        if (data.status === '0' && data.message === 'NOTOK') {
          setError(`No transactions found. Address may be new or have no transaction history.`)
          setTxs([])
        } else {
          setError(`${data.message || 'Failed to fetch transactions'} (Status: ${data.status})`)
          setTxs([])
        }
        return
      }
      
      if (!Array.isArray(data.result)) {
        console.warn('API result is not an array:', data.result)
        setError('Unexpected API response format.')
        setTxs([])
        return
      }
      
      const parsed: Tx[] = (data.result as any[]).map((t) => ({
        hash: t.hash,
        from: t.from,
        to: t.to,
        value: ethers.formatEther(BigInt(t.value)),
        timeStamp: Number(t.timeStamp)
      }))
      console.log(`Parsed ${parsed.length} transactions`)
      setTxs(parsed)
    } catch (e: any) {
      console.error('Error fetching transactions:', e)
      setError(e?.message || 'Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  function truncate(s: string) {
    return s.slice(0, 6) + '...' + s.slice(-4)
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Wallet Viewer</h1>

      <div style={{ marginBottom: 16 }}>
        <button onClick={connectWallet} disabled={loading} style={{ padding: '8px 12px' }}>
          {loading ? 'Connecting...' : 'Connect Wallet (MetaMask / WalletConnect)'}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {address && (
        <div style={{ marginBottom: 24 }}>
          <div><strong>Address:</strong> {truncate(address)}</div>
          <div><strong>Balance:</strong> {balance} ETH</div>
        </div>
      )}

      {txs.length > 0 && (
        <div>
          <h2>Last {txs.length} transactions</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Hash</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>From</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>To</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px' }}>Value (ETH)</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.hash}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    <a href={`https://etherscan.io/tx/${t.hash}`} target="_blank" rel="noreferrer" style={{ color: '#0066cc', textDecoration: 'none' }}>
                      {truncate(t.hash)}
                    </a>
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{truncate(t.from)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{truncate(t.to)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{t.value}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{new Date(t.timeStamp * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!address && !loading && (
        <div style={{ marginTop: 12, color: '#666' }}>
          Connect a wallet to view balance and recent transactions. For WalletConnect, an Infura ID may be required (set `VITE_INFURA_ID`).
        </div>
      )}
    </div>
  )
}
