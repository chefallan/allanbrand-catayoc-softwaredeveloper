import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import "./index.css";

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
}

interface TokenMint {
  id: number;
  address: string;
  amount: string;
  tx_hash: string;
  created_at: string;
}

interface TokenDetails {
  address: string;
  contract: string;
  token: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    totalSupplyWei: string;
    info: string;
  };
  userBalance: {
    balance: string;
    balanceWei: string;
  };
  metadata: {
    version: string;
    project: string;
    maxSupply: string;
    deploymentTimestamp: number;
  };
}

interface AddressDetails {
  address: string;
  balance: {
    ether: string;
    wei: string;
  };
  gasPrice: {
    gwei: string;
    wei: string;
  };
  blockNumber: number;
  timestamp: string;
}

const CUSTOM_TOKEN_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address) public view returns (uint256)",
  "function mint(address to, uint256 amount) public",
  "function getMetadata() public view returns (string, string, string, string, uint8, uint256, uint256, uint256)",
  "function getInfo() public view returns (string)",
];

function App() {
  const [web3Modal, setWeb3Modal] = useState<Web3Modal | null>(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [tokenMints, setTokenMints] = useState<TokenMint[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [mintAmount, setMintAmount] = useState("100");
  const [networkError, setNetworkError] = useState("");
  const [addressToView, setAddressToView] = useState("");
  const [viewedAddressDetails, setViewedAddressDetails] =
    useState<AddressDetails | null>(null);
  const [viewedAddressTransactions, setViewedAddressTransactions] = useState<
    Transaction[]
  >([]);
  const [addressViewError, setAddressViewError] = useState("");

  // Sepolia network configuration
  const SEPOLIA_CHAIN_ID = 11155111;
  const SEPOLIA_NETWORK_NAME = "Sepolia";
  const SEPOLIA_RPC =
    import.meta.env.VITE_SEPOLIA_RPC ||
    "https://eth-sepolia.g.alchemy.com/v2/demo";

  // Contract address from environment
  const contractAddress =
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    "0x95C8f7166af42160a0C9472D6Db617163DEd44e8";
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Check if user is on Sepolia network
  const checkNetwork = async (ethersProvider: ethers.BrowserProvider) => {
    try {
      const network = await ethersProvider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        setNetworkError(
          `⚠️ Wrong Network! You're on ${network.name}. Please switch to Sepolia testnet.`
        );
        return false;
      }
      setNetworkError("");
      return true;
    } catch (err) {
      console.error("Network check error:", err);
      return false;
    }
  };

  useEffect(() => {
    const modal = new Web3Modal({
      cacheProvider: false,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: import.meta.env.VITE_INFURA_ID || "",
          },
        },
      },
    });
    setWeb3Modal(modal);
  }, []);

  const connectWallet = async () => {
    if (!web3Modal) return;
    try {
      setLoading(true);
      setError("");
      setNetworkError("");
      const instance = await web3Modal.connect();
      setProvider(instance);
      const ethersProvider = new ethers.BrowserProvider(instance as any);

      // Check network first
      const isCorrectNetwork = await checkNetwork(ethersProvider);
      if (!isCorrectNetwork) {
        setLoading(false);
        return;
      }

      const signer = await ethersProvider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);

      const bal = await ethersProvider.getBalance(addr);
      setBalance(ethers.formatEther(bal));

      // Fetch token info
      await fetchTokenInfo(ethersProvider);

      // Fetch token details from backend
      await fetchTokenDetails(addr);

      // Fetch transactions and token mints
      await Promise.all([fetchTransactions(addr), fetchTokenMints(addr)]);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenInfo = async (ethersProvider: ethers.BrowserProvider) => {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        CUSTOM_TOKEN_ABI,
        ethersProvider
      );
      const name = await contract.name();
      const symbol = await contract.symbol();
      const totalSupply = await contract.totalSupply();
      const info = await contract.getInfo();

      setTokenInfo({
        name,
        symbol,
        totalSupply: ethers.formatEther(totalSupply),
        info,
      });
    } catch (err) {
      console.error("Error fetching token info:", err);
    }
  };

  const fetchTokenDetails = async (addr: string) => {
    try {
      // Validate address format before calling API
      if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
        console.error("Invalid address format for token details:", addr);
        return;
      }

      const response = await fetch(`${apiUrl}/api/tokens/details/${addr}`);
      if (!response.ok) {
        console.error(`Failed to fetch token details: ${response.status}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTokenDetails(data.data);
      } else {
        console.error("Token details response error:", data.error);
      }
    } catch (err: any) {
      console.error("Error fetching token details:", err);
    }
  };

  const fetchAddressDetails = async (addr: string) => {
    try {
      setAddressViewError("");
      setViewedAddressTransactions([]);

      // Validate address format
      if (!addr || !addr.startsWith("0x") || addr.length !== 42) {
        setAddressViewError(
          "Invalid address format. Must be 0x followed by 40 hex characters."
        );
        return;
      }

      const response = await fetch(`${apiUrl}/api/address/details/${addr}`);
      if (!response.ok) {
        setAddressViewError(
          `Failed to fetch address details: ${response.status}`
        );
        return;
      }

      const data = await response.json();
      if (data.success) {
        setViewedAddressDetails(data.data);

        // Fetch transactions for this address
        const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
        if (apiKey) {
          try {
            const txUrl = `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;
            const txRes = await fetch(txUrl);
            const txData = await txRes.json();

            if (txData.status === "1" && Array.isArray(txData.result)) {
              const formatted = txData.result.map((t: any) => ({
                hash: t.hash,
                from: t.from,
                to: t.to,
                value: ethers.formatEther(BigInt(t.value)),
                timeStamp: new Date(
                  parseInt(t.timeStamp) * 1000
                ).toLocaleString(),
              }));
              setViewedAddressTransactions(formatted);
            }
          } catch (txErr) {
            console.error("Error fetching transactions:", txErr);
          }
        }
      } else {
        setAddressViewError(data.error || "Failed to fetch address details");
      }
    } catch (err: any) {
      setAddressViewError(err.message || "Error fetching address details");
      console.error("Error fetching address details:", err);
    }
  };

  const disconnectWallet = async () => {
    if (provider?.close) {
      await provider.close();
    }
    if (web3Modal) {
      web3Modal.clearCachedProvider();
    }
    setProvider(null);
    setAddress("");
    setBalance("");
    setTxs([]);
    setTokenMints([]);
    setError("");
    setTokenInfo(null);
    setTokenDetails(null);
  };

  const fetchTransactions = async (addr: string) => {
    const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    if (!apiKey) {
      setError("Missing VITE_ETHERSCAN_API_KEY in .env");
      return;
    }

    try {
      const url = `https://api.etherscan.io/v2/api?chainid=11155111&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "1" && Array.isArray(data.result)) {
        const formatted = data.result.map((t: any) => ({
          hash: t.hash,
          from: t.from,
          to: t.to,
          value: ethers.formatEther(BigInt(t.value)),
          timeStamp: new Date(parseInt(t.timeStamp) * 1000).toLocaleString(),
        }));
        setTxs(formatted);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
    }
  };

  const fetchTokenMints = async (addr: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/tokens/mints/${addr}`);
      if (!response.ok) throw new Error("Failed to fetch token mints");

      const data = await response.json();
      setTokenMints(data.data || []);
    } catch (err: any) {
      console.error("Error fetching mints:", err);
    }
  };

  const mintTokens = async () => {
    if (!address || !provider) {
      setError("Please connect wallet first");
      return;
    }

    setLoading(true);
    setError("");
    setNetworkError("");

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);

      // Check network before minting
      const isCorrectNetwork = await checkNetwork(ethersProvider);
      if (!isCorrectNetwork) {
        setLoading(false);
        return;
      }

      // Check wallet balance for gas
      const balance = await ethersProvider.getBalance(address);

      // Estimate gas for a basic transaction
      const gasPrice = await ethersProvider.getFeeData();
      const estimatedGasUnits = BigInt(21000); // Basic transaction gas
      const gasLimit = estimatedGasUnits * (gasPrice.gasPrice || BigInt(0));

      if (balance < gasLimit) {
        setError(
          `❌ Insufficient funds for gas. You have ${ethers.formatEther(
            balance
          )} ETH but need at least ${ethers.formatEther(
            gasLimit
          )} ETH for gas fees`
        );
        setLoading(false);
        return;
      }

      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        CUSTOM_TOKEN_ABI,
        signer
      );
      const amountWei = ethers.parseEther(mintAmount);

      const tx = await contract.mint(address, amountWei);
      setError(`✅ Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        // Record in backend
        try {
          await fetch(`${apiUrl}/api/tokens/mint`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address,
              amount: mintAmount,
              transactionHash: tx.hash,
            }),
          });
        } catch (err) {
          console.error("Failed to record mint:", err);
        }

        // Refresh data
        const newBal = await ethersProvider.getBalance(address);
        setBalance(ethers.formatEther(newBal));
        await Promise.all([
          fetchTokenMints(address),
          fetchTokenDetails(address),
        ]);

        setError(
          `✅ Success! Minted ${mintAmount} tokens. Transaction: ${tx.hash}`
        );
        setMintAmount("100");
      } else {
        setError("❌ Transaction failed. Please check Etherscan for details");
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.code === "INSUFFICIENT_FUNDS") {
        setError("❌ Insufficient funds for gas fees");
      } else if (err.code === "NETWORK_ERROR") {
        setError("❌ Network error. Please check your connection");
      } else if (err.reason) {
        setError(`❌ Transaction failed: ${err.reason}`);
      } else if (err.message) {
        setError(`❌ Error: ${err.message}`);
      } else {
        setError("❌ Failed to mint tokens. Please try again");
      }
      console.error("Mint error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "100%",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          }}
        >
          <h1 style={{ margin: "0 0 10px 0", fontSize: "28px" }}>
            🚀 Blockchain Super Dapp
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "16px" }}>
            View wallet addresses, Mint and manage your ERC-20 tokens
          </p>
        </div>

        {/* Address Viewer Section */}
        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "30px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
            🔍 Address Viewer
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "10px",
              marginBottom: "15px",
            }}
          >
            <input
              type="text"
              value={addressToView}
              onChange={(e) => setAddressToView(e.target.value)}
              placeholder="Enter Ethereum address (0x...)"
              style={{
                padding: "12px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                fontFamily: "monospace",
              }}
            />
            <button
              onClick={() => fetchAddressDetails(addressToView)}
              style={{
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "600",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#764ba2")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#667eea")}
            >
              View Details
            </button>
          </div>

          {addressViewError && (
            <div
              style={{
                background: "#f8d7da",
                color: "#721c24",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "15px",
                fontSize: "13px",
              }}
            >
              {addressViewError}
            </div>
          )}

          {viewedAddressDetails && (
            <div
              style={{
                background: "#f0f4ff",
                padding: "20px",
                borderRadius: "8px",
                borderLeft: "4px solid #667eea",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    ADDRESS
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "12px",
                      color: "#667eea",
                      wordBreak: "break-all",
                    }}
                  >
                    {viewedAddressDetails.address}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    BALANCE (ETH)
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#28a745",
                    }}
                  >
                    {parseFloat(viewedAddressDetails.balance.ether).toFixed(6)}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    BALANCE (WEI)
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#333",
                      wordBreak: "break-all",
                    }}
                  >
                    {viewedAddressDetails.balance.wei}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    GAS PRICE (GWEI)
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#ff9800",
                    }}
                  >
                    {parseFloat(viewedAddressDetails.gasPrice.gwei).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    GAS PRICE (WEI)
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#333",
                    }}
                  >
                    {viewedAddressDetails.gasPrice.wei}
                  </p>
                </div>

                <div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    BLOCK NUMBER
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#2196f3",
                    }}
                  >
                    #{viewedAddressDetails.blockNumber}
                  </p>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "11px",
                      color: "#999",
                    }}
                  >
                    Last Updated:{" "}
                    {new Date(viewedAddressDetails.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transaction History */}
              {viewedAddressTransactions.length > 0 && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "2px solid #ddd",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 15px 0",
                      color: "#333",
                      fontSize: "16px",
                    }}
                  >
                    📜 Last 10 Transactions
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "12px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom: "2px solid #ddd",
                            background: "#f9f9f9",
                          }}
                        >
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px",
                              fontWeight: "600",
                            }}
                          >
                            Date
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px",
                              fontWeight: "600",
                            }}
                          >
                            Hash
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px",
                              fontWeight: "600",
                            }}
                          >
                            From
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "10px",
                              fontWeight: "600",
                            }}
                          >
                            To
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "10px",
                              fontWeight: "600",
                            }}
                          >
                            Value (ETH)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewedAddressTransactions.map((tx, idx) => (
                          <tr
                            key={tx.hash}
                            style={{
                              borderBottom: "1px solid #eee",
                              background: idx % 2 === 0 ? "#f9f9f9" : "white",
                            }}
                          >
                            <td style={{ padding: "10px", color: "#666" }}>
                              {tx.timeStamp}
                            </td>
                            <td style={{ padding: "10px" }}>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#667eea",
                                  textDecoration: "none",
                                  fontFamily: "monospace",
                                  fontSize: "10px",
                                }}
                              >
                                {tx.hash.slice(0, 12)}...
                              </a>
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                fontFamily: "monospace",
                                fontSize: "10px",
                                color: "#666",
                              }}
                            >
                              {tx.from.slice(0, 8)}...
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                fontFamily: "monospace",
                                fontSize: "10px",
                                color: "#666",
                              }}
                            >
                              {tx.to.slice(0, 8)}...
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                color: "#28a745",
                                fontWeight: "600",
                                textAlign: "right",
                              }}
                            >
                              {tx.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: address ? "1fr 1fr" : "1fr",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          {/* Wallet Section */}
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>💼 Wallet</h2>

            {!address ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  background: loading
                    ? "#ddd"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                }}
                onMouseOver={(e) =>
                  !loading &&
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseOut={(e) =>
                  !loading &&
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
            ) : (
              <div>
                <div
                  style={{
                    background: "#f0f4ff",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    Connected Address
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "13px",
                      color: "#667eea",
                      fontWeight: "500",
                    }}
                  >
                    {address}
                  </p>
                </div>

                <div
                  style={{
                    background: "#f0f4ff",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    Balance
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: "700",
                      color: "#28a745",
                    }}
                  >
                    {balance} ETH
                  </p>
                </div>

                <button
                  onClick={disconnectWallet}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#c82333")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#dc3545")
                  }
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Token Mint Section */}
          {address && (
            <div
              style={{
                background: "white",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
                🪙 Mint Tokens (FREE!)
              </h2>
              {tokenInfo && (
                <div
                  style={{
                    background: "#f0f4ff",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontSize: "13px",
                  }}
                >
                  <p style={{ margin: "0 0 5px 0", color: "#666" }}>
                    <strong>Token:</strong> {tokenInfo.symbol}
                  </p>
                  <p style={{ margin: "0 0 5px 0", color: "#666" }}>
                    <strong>Total Supply:</strong> {tokenInfo.totalSupply}
                  </p>
                  <p style={{ margin: 0, color: "#666" }}>
                    <strong>Info:</strong> {tokenInfo.info}
                  </p>
                </div>
              )}

              <div
                style={{
                  marginBottom: "15px",
                  background: "#e8f5e9",
                  padding: "12px",
                  borderRadius: "6px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#2e7d32",
                    fontSize: "13px",
                    fontWeight: "600",
                  }}
                >
                  ✅ FREE Minting - No transaction fee required!
                </p>
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  Amount to Mint
                </label>
                <input
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  placeholder="100"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    transition: "border-color 0.3s",
                  }}
                />
              </div>

              <button
                onClick={mintTokens}
                disabled={loading || !address}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  background: loading || !address ? "#ddd" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading || !address ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                }}
                onMouseOver={(e) =>
                  !loading &&
                  address &&
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseOut={(e) =>
                  !loading &&
                  address &&
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                {loading ? "Processing..." : "Mint Tokens"}
              </button>

              <br />
              <br />

              {tokenDetails && (
                <div
                  style={{
                    background: "#e8f5e9",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "15px",
                    fontSize: "13px",
                    borderLeft: "4px solid #10b981",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      color: "#2e7d32",
                      fontWeight: "600",
                    }}
                  >
                    📊 Your Token Balance:
                  </p>
                  <p style={{ margin: "0 0 5px 0", color: "#2e7d32" }}>
                    <strong>Balance:</strong> {tokenDetails.userBalance.balance}{" "}
                    {tokenDetails.token.symbol}
                  </p>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      color: "#2e7d32",
                      fontSize: "11px",
                      fontFamily: "monospace",
                    }}
                  >
                    Wei: {tokenDetails.userBalance.balanceWei}
                  </p>
                  <p
                    style={{
                      margin: "0 0 5px 0",
                      color: "#666",
                      fontSize: "12px",
                    }}
                  >
                    <strong>Token Decimals:</strong>{" "}
                    {tokenDetails.token.decimals}
                  </p>
                  <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
                    <strong>Contract:</strong>{" "}
                    <a
                      href={`https://sepolia.etherscan.io/address/${tokenDetails.contract}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "monospace",
                        fontSize: "10px",
                        color: "#667eea",
                        textDecoration: "none",
                      }}
                    >
                      {tokenDetails.contract.slice(0, 10)}...
                      {tokenDetails.contract.slice(-8)}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error/Success Message */}
        {error && (
          <div
            style={{
              background:
                error.includes("sent") || error.includes("Transaction")
                  ? "#d4edda"
                  : "#f8d7da",
              color:
                error.includes("sent") || error.includes("Transaction")
                  ? "#155724"
                  : "#721c24",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: `1px solid ${
                error.includes("sent") || error.includes("Transaction")
                  ? "#c3e6cb"
                  : "#f5c6cb"
              }`,
            }}
          >
            {error}
          </div>
        )}

        {/* Network Error Message */}
        {networkError && (
          <div
            style={{
              background: "#fff3cd",
              color: "#856404",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #ffeeba",
              fontWeight: "600",
            }}
          >
            {networkError}
          </div>
        )}

        {/* Transaction History */}
        {address && (
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
              📊 ETH Transaction History (Last 10)
            </h3>

            {txs.length === 0 ? (
              <p
                style={{ color: "#999", textAlign: "center", padding: "20px" }}
              >
                No transactions found
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "10px",
                          fontWeight: "600",
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "10px",
                          fontWeight: "600",
                        }}
                      >
                        Hash
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "10px",
                          fontWeight: "600",
                        }}
                      >
                        Value (ETH)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {txs.map((tx, idx) => (
                      <tr
                        key={tx.hash}
                        style={{
                          borderBottom: "1px solid #eee",
                          background: idx % 2 === 0 ? "#f9f9f9" : "white",
                        }}
                      >
                        <td style={{ padding: "10px", color: "#666" }}>
                          {tx.timeStamp}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <a
                            href={`https://etherscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#667eea",
                              textDecoration: "none",
                              fontFamily: "monospace",
                              fontSize: "11px",
                            }}
                          >
                            {tx.hash.slice(0, 10)}...
                          </a>
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            color: "#28a745",
                            fontWeight: "600",
                          }}
                        >
                          {tx.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Token Mints History */}
        {address && (
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#333" }}>
              🎯 Token Mints History
            </h3>

            {tokenMints.length === 0 ? (
              <p
                style={{ color: "#999", textAlign: "center", padding: "20px" }}
              >
                No token mints recorded yet
              </p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {tokenMints.map((mint) => (
                  <div
                    key={mint.id}
                    style={{
                      background: "#f9f9f9",
                      padding: "15px",
                      borderRadius: "8px",
                      borderLeft: "4px solid #667eea",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <p style={{ margin: "0 0 5px 0", color: "#666" }}>
                          <strong>Amount:</strong>
                        </p>
                        <p
                          style={{
                            margin: 0,
                            color: "#333",
                            fontWeight: "600",
                          }}
                        >
                          {mint.amount} CUSTOM
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 5px 0", color: "#666" }}>
                          <strong>Date:</strong>
                        </p>
                        <p style={{ margin: 0, color: "#333" }}>
                          {new Date(mint.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${mint.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#667eea",
                            textDecoration: "none",
                            fontFamily: "monospace",
                            fontSize: "11px",
                          }}
                        >
                          TX: {mint.tx_hash.slice(0, 20)}...
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
