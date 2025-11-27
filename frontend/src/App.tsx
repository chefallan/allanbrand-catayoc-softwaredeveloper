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

function App() {
  const [web3Modal, setWeb3Modal] = useState<Web3Modal | null>(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<any>(null);

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
      const instance = await web3Modal.connect();
      setProvider(instance);
      const ethersProvider = new ethers.BrowserProvider(instance as any);
      const signer = await ethersProvider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);

      const bal = await ethersProvider.getBalance(addr);
      setBalance(ethers.formatEther(bal));

      await fetchTransactions(addr);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
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
    setError("");
  };

  const fetchTransactions = async (addr: string) => {
    const apiKey = import.meta.env.VITE_ETHERSCAN_API_KEY;
    if (!apiKey) {
      setError("Missing VITE_ETHERSCAN_API_KEY in .env");
      return;
    }

    try {
      const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;

      console.log("Fetching transactions from:", url.replace(apiKey, "HIDDEN"));

      const res = await fetch(url);
      const data = await res.json();

      console.log("Etherscan API response:", data);

      if (data.status === "1" && Array.isArray(data.result)) {
        const formatted = data.result.map((t: any) => ({
          hash: t.hash,
          from: t.from,
          to: t.to,
          value: ethers.formatEther(BigInt(t.value)),
          timeStamp: new Date(parseInt(t.timeStamp) * 1000).toLocaleString(),
        }));
        setTxs(formatted);
      } else {
        console.warn(
          "API returned status:",
          data.status,
          "message:",
          data.message
        );
        setError(
          `No transactions found. Check address or API key. (Response: ${
            data.message || "NOTOK"
          })`
        );
      }
    } catch (err: any) {
      setError(`Failed to fetch transactions: ${err.message}`);
      console.error("Fetch error:", err);
    }
  };

  return (
    <div
      style={{
        maxWidth: "100%",
        backgroundColor: "black",
        maxHeight: "100%",
        overflow: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "40px auto",
          padding: "30px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <h1
            style={{
              textAlign: "center",
              color: "#ea6666ff",
              fontSize: "32px",
              marginBottom: "10px",
              fontWeight: "700",
            }}
          >
            Simple Ethereum Wallet Viewer
          </h1>
          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginBottom: "30px",
              fontSize: "14px",
            }}
          >
            Connect your wallet to view balance and transaction history
          </p>

          {!address ? (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={connectWallet}
                disabled={loading}
                style={{
                  padding: "14px 40px",
                  fontSize: "16px",
                  fontWeight: "600",
                  background: loading
                    ? "#ffffffff"
                    : "linear-gradient(135deg, #ea6666ff 0%, rgba(162, 75, 75, 1) 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  boxShadow: "0 4px 15px rgba(234, 102, 102, 0.4)",
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
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: "#f8f9fa",
                  padding: "20px",
                  borderRadius: "12px",
                  marginBottom: "25px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: "0 0 8px 0",
                        color: "#495057",
                        fontSize: "14px",
                        fontWeight: "600",
                      }}
                    >
                      Connected Address
                    </h3>
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
                  <button
                    onClick={disconnectWallet}
                    style={{
                      padding: "8px 20px",
                      fontSize: "14px",
                      fontWeight: "600",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
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
                <h3
                  style={{
                    margin: "15px 0 8px 0",
                    color: "#495057",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Balance
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#28a745",
                  }}
                >
                  {balance} ETH
                </p>
              </div>

              <h3
                style={{
                  marginBottom: "15px",
                  color: "#495057",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Recent Transactions (Last 10)
              </h3>

              {txs.length === 0 ? (
                <p
                  style={{
                    color: "#6c757d",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No transactions found for this address.
                </p>
              ) : (
                <div
                  style={{
                    maxHeight: "500px",
                    overflowY: "auto",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                  }}
                >
                  {txs.map((tx, idx) => (
                    <div
                      key={tx.hash}
                      style={{
                        padding: "16px 20px",
                        borderBottom:
                          idx < txs.length - 1 ? "1px solid #e9ecef" : "none",
                        background: idx % 2 === 0 ? "white" : "#f8f9fa",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "#e7f1ff")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background =
                          idx % 2 === 0 ? "white" : "#f8f9fa")
                      }
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6c757d",
                          marginBottom: "6px",
                        }}
                      >
                        {tx.timeStamp}
                      </div>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: "13px",
                          marginBottom: "8px",
                        }}
                      >
                        <a
                          href={`https://etherscan.io/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#667eea",
                            textDecoration: "none",
                            fontWeight: "500",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.textDecoration = "underline")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.textDecoration = "none")
                          }
                        >
                          {tx.hash}
                        </a>
                      </div>
                      <div style={{ fontSize: "13px", color: "#495057" }}>
                        <strong>From:</strong>{" "}
                        <span
                          style={{ fontFamily: "monospace", fontSize: "12px" }}
                        >
                          {tx.from.slice(0, 10)}...{tx.from.slice(-8)}
                        </span>
                        {" → "}
                        <strong>To:</strong>{" "}
                        <span
                          style={{ fontFamily: "monospace", fontSize: "12px" }}
                        >
                          {tx.to.slice(0, 10)}...{tx.to.slice(-8)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#28a745",
                          marginTop: "6px",
                        }}
                      >
                        {tx.value} ETH
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px 18px",
                background: "#f8d7da",
                color: "#721c24",
                borderRadius: "8px",
                border: "1px solid #f5c6cb",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
