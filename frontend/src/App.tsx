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

interface NFTDetails {
  address: string;
  contract: string;
  nft: {
    name: string;
    symbol: string;
  };
  userBalance: number;
  totalSupply: number;
  metadata: {
    version: string;
    project: string;
    deploymentTimestamp: number;
  };
  timestamp: string;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
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

const CUSTOM_NFT_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function balanceOf(address) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function safeMint(address to, string uri) public",
  "function batchMint(address to, string[] uris) public",
  "function getMetadata() public view returns (string, string, uint256)",
  "function getInfo() public view returns (string)",
];

const CUSTOM_NFT2_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function balanceOf(address) public view returns (uint256)",
  "function totalSupply() public view returns (uint256)",
  "function safeMint(address to) public",
  "function safeMintWithUri(address to, string customUri) public",
  "function batchMint(address to, uint256 count) public",
  "function getMetadata() public view returns (string, string, string, string, uint256, uint256, uint256, string, uint256)",
  "function getInfo() public view returns (string)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
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
  const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
  const [nftMintUri, setNftMintUri] = useState("ipfs://QmHash/metadata.json");
  const [nftMintError, setNftMintError] = useState("");
  const [nftMintLoading, setNftMintLoading] = useState(false);
  const [nft2Details, setNft2Details] = useState<NFTDetails | null>(null);
  const [nft2MintLoading, setNft2MintLoading] = useState(false);
  const [nft2MintError, setNft2MintError] = useState("");
  
  // NFT Preview states
  const [nftPreviewMetadata, setNftPreviewMetadata] = useState<NFTMetadata | null>(null);
  const [nftPreviewLoading, setNftPreviewLoading] = useState(false);
  const [nft2NextTokenId, setNft2NextTokenId] = useState<number>(0);
  const [nft2PreviewMetadata, setNft2PreviewMetadata] = useState<NFTMetadata | null>(null);
  const [nft2PreviewLoading, setNft2PreviewLoading] = useState(false);

  // Sepolia network configuration
  const SEPOLIA_CHAIN_ID = 11155111;
  const SEPOLIA_NETWORK_NAME = "Sepolia";
  const SEPOLIA_RPC =
    import.meta.env.VITE_SEPOLIA_RPC ||
    "https://eth-sepolia.g.alchemy.com/v2/demo";

  // Contract address from environment
  const contractAddress =
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    "0x7dC6ADE8985B153b349a823bbcE30f10f2e2A66d";
  const nftContractAddress =
    import.meta.env.VITE_NFT_CONTRACT_ADDRESS ||
    "0x4752489c774D296F41BA5D3F8A2C7E551299c9c6";
  const nft2ContractAddress =
    import.meta.env.VITE_NFT2_CONTRACT_ADDRESS ||
    "0xEDb0064eB0299Fb22eEB3DeA79f5cd258328Aa0A";
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

  // Fetch NFT metadata from IPFS or HTTP URL
  const fetchNFTMetadata = async (uri: string): Promise<NFTMetadata | null> => {
    try {
      setNftPreviewLoading(true);
      let url = uri;
      
      // Convert IPFS URI to gateway URL
      if (uri.startsWith("ipfs://")) {
        const hash = uri.replace("ipfs://", "");
        // Use Pinata gateway for metadata (most reliable for our collection)
        url = `https://gateway.pinata.cloud/ipfs/${hash}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch metadata");
      let data = await response.json();
      
      // Sanitize data - replace any old QmImageHash with correct CID
      if (data.image && data.image.includes("QmImageHash")) {
        data.image = data.image.replace("QmImageHash", "bafybeig5xvfwi2e2bdai6lngjzok2aktxeyqorx6gwpw25mu5p4bjmqtaa");
      }
      
      setNftPreviewMetadata(data);
      return data;
    } catch (err) {
      console.error("Error fetching NFT metadata:", err);
      setNftMintError(`Error loading metadata: ${err instanceof Error ? err.message : "Unknown error"}`);
      return null;
    } finally {
      setNftPreviewLoading(false);
    }
  };

  // Fetch NFT2 metadata from fixed collection
  const fetchNFT2Metadata = async (tokenId: number): Promise<NFTMetadata | null> => {
    try {
      setNft2PreviewLoading(true);
      const metadataCID = "bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i";
      // Use Pinata gateway for metadata (it's on Pinata), Cloudflare for images (they're on Cloudflare)
      const url = `https://gateway.pinata.cloud/ipfs/${metadataCID}/${tokenId}.json`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch metadata");
      let data = await response.json();
      
      // Sanitize data - replace any old QmImageHash with correct CID
      if (data.image && data.image.includes("QmImageHash")) {
        data.image = data.image.replace("QmImageHash", "bafybeig5xvfwi2e2bdai6lngjzok2aktxeyqorx6gwpw25mu5p4bjmqtaa");
      }
      
      setNft2PreviewMetadata(data);
      return data;
    } catch (err) {
      console.error("Error fetching NFT2 metadata:", err);
      setNft2MintError(`Error loading metadata: ${err instanceof Error ? err.message : "Unknown error"}`);
      return null;
    } finally {
      setNft2PreviewLoading(false);
    }
  };

  // Convert IPFS image URI to gateway URL
  const getImageUrl = (uri: string | undefined): string => {
    if (!uri) return "";
    
    // Replace any placeholder QmImageHash with correct CID
    let cleanUri = uri.replace("QmImageHash", "bafybeig5xvfwi2e2bdai6lngjzok2aktxeyqorx6gwpw25mu5p4bjmqtaa");
    
    if (cleanUri.startsWith("ipfs://")) {
      const hash = cleanUri.replace("ipfs://", "");
      // Use public ipfs.io gateway for better reliability
      return `https://ipfs.io/ipfs/${hash}`;
    }
    return cleanUri;
  };

  // Fetch next NFT2 token ID from backend (persists across sessions)
  const loadNFT2NextTokenId = async (addr: string) => {
    try {
      // First, fetch from blockchain to get the actual total supply
      const ethersProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const contract = new ethers.Contract(
        nft2ContractAddress,
        CUSTOM_NFT2_ABI,
        ethersProvider
      );

      const totalSupply = await contract.totalSupply();
      const nextTokenId = Number(totalSupply); // Next token ID = current total supply

      setNft2NextTokenId(nextTokenId);
      
      // Load preview for next token
      if (nextTokenId < 100) {
        fetchNFT2Metadata(nextTokenId);
      }

      // Also sync with backend for tracking
      try {
        const response = await fetch(`${apiUrl}/api/nft2/next-token/${addr}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Backend next token ID:', data.nextTokenId);
        }
      } catch (err) {
        console.error('Error syncing with backend:', err);
      }
    } catch (err) {
      console.error('Error loading NFT2 next token ID from blockchain:', err);
    }
  };

  // Track NFT2 mint in backend
  const trackNFT2Mint = async (addr: string, tokenId: number, txHash: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/nft2/track-mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, tokenId, txHash }),
      });
      if (!response.ok) {
        console.error('Failed to track NFT2 mint');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        // Reload next token ID from backend
        await loadNFT2NextTokenId(addr);
      }
    } catch (err) {
      console.error('Error tracking NFT2 mint:', err);
    }
  };


  useEffect(() => {
    const modal = new Web3Modal({
      cacheProvider: false,
      providerOptions: {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: import.meta.env.VITE_INFURA_API_KEY || "",
          },
        },
      },
    });
    setWeb3Modal(modal);
    
    // Auto-load preview for token 0 on mount
    fetchNFT2Metadata(0);
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
      await fetchNFTDetails(addr, ethersProvider);
      await fetchNFT2Details(addr);

      // Load NFT2 next token ID from backend (persistent)
      await loadNFT2NextTokenId(addr);

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
          fetchNFTDetails(address),
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

  const mintNFT = async () => {
    if (!address || !provider) {
      setNftMintError("Please connect wallet first");
      return;
    }

    if (!nftMintUri.trim()) {
      setNftMintError("Please enter a metadata URI");
      return;
    }

    setNftMintLoading(true);
    setNftMintError("");
    setNetworkError("");

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);

      // Check network
      const isCorrectNetwork = await checkNetwork(ethersProvider);
      if (!isCorrectNetwork) {
        setNftMintLoading(false);
        return;
      }

      // Check wallet balance for gas
      const balance = await ethersProvider.getBalance(address);
      const gasPrice = await ethersProvider.getFeeData();
      const estimatedGasUnits = BigInt(100000); // Estimate for NFT mint
      const gasLimit = estimatedGasUnits * (gasPrice.gasPrice || BigInt(0));

      if (balance < gasLimit) {
        setNftMintError(
          `❌ Insufficient funds for gas. You have ${ethers.formatEther(
            balance
          )} ETH but need at least ${ethers.formatEther(gasLimit)} ETH`
        );
        setNftMintLoading(false);
        return;
      }

      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(
        nftContractAddress,
        CUSTOM_NFT_ABI,
        signer
      );

      const tx = await contract.safeMint(address, nftMintUri);
      setNftMintError(`✅ Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        // Refresh NFT details
        await fetchNFTDetails(address);
        setNftMintUri("ipfs://QmHash/metadata.json");
        setNftMintError(
          `✅ Success! NFT minted. Transaction: ${tx.hash}`
        );
      } else {
        setNftMintError("❌ Transaction failed. Please check Etherscan");
      }
    } catch (err: any) {
      if (err.reason) {
        setNftMintError(`❌ Error: ${err.reason}`);
      } else if (err.message) {
        setNftMintError(`❌ Error: ${err.message}`);
      } else {
        setNftMintError("❌ Failed to mint NFT. Please try again");
      }
      console.error("NFT mint error:", err);
    } finally {
      setNftMintLoading(false);
    }
  };

  const fetchNFTDetails = async (addr: string, ethersProvider?: ethers.BrowserProvider) => {
    try {
      // Use provided provider or create new one from state
      const provider_ = ethersProvider || (provider ? new ethers.BrowserProvider(provider) : null);
      if (!provider_) {
        console.error("No provider available for NFT details");
        return;
      }

      const contract = new ethers.Contract(
        nftContractAddress,
        CUSTOM_NFT_ABI,
        provider_
      );

      const [name, symbol, balance, totalSupply, metadata] = await Promise.all(
        [
          contract.name(),
          contract.symbol(),
          contract.balanceOf(addr),
          contract.totalSupply(),
          contract.getMetadata(),
        ]
      );

      setNftDetails({
        address: addr,
        contract: nftContractAddress,
        nft: { name, symbol },
        userBalance: Number(balance),
        totalSupply: Number(totalSupply),
        metadata: {
          version: metadata[0],
          project: metadata[1],
          deploymentTimestamp: Number(metadata[2]),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to fetch NFT details:", err);
    }
  };

  const mintNFT2 = async () => {
    if (!address || !provider) {
      setNft2MintError("Please connect wallet first");
      return;
    }

    setNft2MintLoading(true);
    setNft2MintError("");
    setNetworkError("");

    try {
      const ethersProvider = new ethers.BrowserProvider(provider);

      // Check network
      const isCorrectNetwork = await checkNetwork(ethersProvider);
      if (!isCorrectNetwork) {
        setNft2MintLoading(false);
        return;
      }

      // Check wallet balance for gas
      const balance = await ethersProvider.getBalance(address);
      const gasPrice = await ethersProvider.getFeeData();
      const estimatedGasUnits = BigInt(100000); // Estimate for NFT mint
      const gasLimit = estimatedGasUnits * (gasPrice.gasPrice || BigInt(0));

      if (balance < gasLimit) {
        setNft2MintError(
          `❌ Insufficient funds for gas. You have ${ethers.formatEther(
            balance
          )} ETH but need at least ${ethers.formatEther(gasLimit)} ETH`
        );
        setNft2MintLoading(false);
        return;
      }

      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(
        nft2ContractAddress,
        CUSTOM_NFT2_ABI,
        signer
      );

      // SafeMint with auto-generated URI from fixed metadata collection
      const tx = await contract.safeMint(address);
      const currentTokenId = nft2NextTokenId;
      setNft2MintError(`✅ Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        // Track mint in backend for persistence
        await trackNFT2Mint(address, currentTokenId, tx.hash);
        
        // Auto-increment to next token and load its preview
        const nextTokenId = currentTokenId + 1;
        if (nextTokenId < 100) {
          setNft2NextTokenId(nextTokenId);
          await fetchNFT2Metadata(nextTokenId);
        } else {
          setNft2NextTokenId(99);
          setNft2MintError(
            `✅ Success! NFT #${currentTokenId} minted. All 100 tokens have been minted!`
          );
        }
        
        // Refresh NFT2 details
        await fetchNFT2Details(address);
        setNft2MintError(
          `✅ Success! NFT #${currentTokenId} minted. Transaction: ${tx.hash}`
        );
      } else {
        setNft2MintError("❌ Transaction failed. Please check Etherscan");
      }
    } catch (err: any) {
      if (err.reason) {
        setNft2MintError(`❌ Error: ${err.reason}`);
      } else if (err.message) {
        setNft2MintError(`❌ Error: ${err.message}`);
      } else {
        setNft2MintError("❌ Failed to mint NFT. Please try again");
      }
      console.error("NFT2 mint error:", err);
    } finally {
      setNft2MintLoading(false);
    }
  };

  const fetchNFT2Details = async (addr: string) => {
    try {
      const ethersProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
      const contract = new ethers.Contract(
        nft2ContractAddress,
        CUSTOM_NFT2_ABI,
        ethersProvider
      );

      const [name, symbol, balance, totalSupply, metadata] = await Promise.all(
        [
          contract.name(),
          contract.symbol(),
          contract.balanceOf(addr),
          contract.totalSupply(),
          contract.getMetadata(),
        ]
      );

      setNft2Details({
        address: addr,
        contract: nft2ContractAddress,
        nft: { name, symbol },
        userBalance: Number(balance),
        totalSupply: Number(totalSupply),
        metadata: {
          version: metadata[0],
          project: metadata[1],
          deploymentTimestamp: Number(metadata[6]),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to fetch NFT2 details:", err);
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
            View wallet addresses, Mint and manage your ERC-20 tokens and NFTs
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

        {/* NFT Mint Section */}
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
            <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
              🎨 Mint NFTs (FREE!)
            </h2>

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
                ✅ FREE NFT Minting - No transaction fee required!
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
                Metadata URI
              </label>
              <input
                type="text"
                value={nftMintUri}
                onChange={(e) => setNftMintUri(e.target.value)}
                placeholder="ipfs://QmHash/metadata.json"
                disabled={nftMintLoading}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "monospace",
                  transition: "border-color 0.3s",
                }}
              />
              <p
                style={{
                  margin: "8px 0 0 0",
                  color: "#999",
                  fontSize: "12px",
                }}
              >
                Example: ipfs://QmHash/nft1.json or https://example.com/metadata.json
              </p>
            </div>

            {/* Preview Button */}
            <button
              onClick={() => fetchNFTMetadata(nftMintUri)}
              disabled={nftPreviewLoading || !nftMintUri.trim()}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "14px",
                fontWeight: "600",
                background: nftPreviewLoading || !nftMintUri.trim() ? "#ddd" : "#6c5ce7",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: nftPreviewLoading || !nftMintUri.trim() ? "not-allowed" : "pointer",
                marginBottom: "12px",
                transition: "all 0.3s",
              }}
              onMouseOver={(e) =>
                !nftPreviewLoading &&
                nftMintUri.trim() &&
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseOut={(e) =>
                !nftPreviewLoading &&
                nftMintUri.trim() &&
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {nftPreviewLoading ? "Loading Preview..." : "👁️ Preview NFT"}
            </button>

            {/* NFT Preview Display */}
            {nftPreviewMetadata && (
              <div
                style={{
                  background: "#f8f9fa",
                  border: "2px solid #a855f7",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: "#333", fontSize: "16px" }}>
                  📸 NFT Preview
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "150px 1fr",
                    gap: "15px",
                  }}
                >
                  {/* Image */}
                  <div>
                    <img
                      src={getImageUrl(nftPreviewMetadata.image)}
                      alt={nftPreviewMetadata.name}
                      style={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "8px",
                        border: "2px solid #ddd",
                        objectFit: "contain",
                        background: "#fff",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23ddd%22 width=%22150%22 height=%22150%22/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  {/* Details */}
                  <div>
                    <p style={{ margin: "0 0 8px 0", color: "#333", fontWeight: "600" }}>
                      <strong>{nftPreviewMetadata.name}</strong>
                    </p>
                    <p style={{ margin: "0 0 10px 0", color: "#666", fontSize: "12px" }}>
                      {nftPreviewMetadata.description}
                    </p>
                    {nftPreviewMetadata.attributes && nftPreviewMetadata.attributes.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <p style={{ margin: "0 0 6px 0", color: "#333", fontWeight: "600", fontSize: "13px" }}>
                          Attributes:
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "6px",
                          }}
                        >
                          {nftPreviewMetadata.attributes.map((attr, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "#e8e8e8",
                                padding: "6px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                              }}
                            >
                              <strong>{attr.trait_type}:</strong> {attr.value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={mintNFT}
              disabled={nftMintLoading || !address}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "600",
                background: nftMintLoading || !address ? "#ddd" : "#a855f7",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: nftMintLoading || !address ? "not-allowed" : "pointer",
                transition: "all 0.3s",
              }}
              onMouseOver={(e) =>
                !nftMintLoading &&
                address &&
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseOut={(e) =>
                !nftMintLoading &&
                address &&
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {nftMintLoading ? "Processing..." : "Mint NFT"}
            </button>

            {nftMintError && (
              <div
                style={{
                  marginTop: "15px",
                  background: nftMintError.includes("✅")
                    ? "#d4edda"
                    : "#f8d7da",
                  color: nftMintError.includes("✅")
                    ? "#155724"
                    : "#721c24",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  border: `1px solid ${
                    nftMintError.includes("✅") ? "#c3e6cb" : "#f5c6cb"
                  }`,
                }}
              >
                {nftMintError}
              </div>
            )}

            <br />
            <br />

            {nftDetails && (
              <div
                style={{
                  background: "#f3e5f5",
                  padding: "15px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  borderLeft: "4px solid #a855f7",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px 0",
                    color: "#6a0dad",
                    fontWeight: "600",
                  }}
                >
                  🎨 Your NFT Balance:
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#6a0dad" }}>
                  <strong>NFTs Owned:</strong> {nftDetails.userBalance}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#6a0dad" }}>
                  <strong>Total Supply:</strong> {nftDetails.totalSupply}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "12px" }}>
                  <strong>NFT Name:</strong> {nftDetails.nft.name}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "12px" }}>
                  <strong>Symbol:</strong> {nftDetails.nft.symbol}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "12px" }}>
                  <strong>Version:</strong> {nftDetails.metadata.version}
                </p>
                <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
                  <strong>Contract:</strong>{" "}
                  <a
                    href={`https://sepolia.etherscan.io/address/${nftDetails.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "#a855f7",
                      textDecoration: "none",
                    }}
                  >
                    {nftDetails.contract.slice(0, 10)}...
                    {nftDetails.contract.slice(-8)}
                  </a>
                </p>
              </div>
            )}
          </div>
        )}

        {/* CustomNFT2 - Fixed Collection (Mint without URI) */}
        {address && (
          <div
            style={{
              background: "white",
              padding: "20px",
              marginBottom: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #2196F3",
            }}
          >
            <h2 style={{ margin: "0 0 15px 0", color: "#1976d2" }}>
              🎁 CustomNFT2 - Fixed Collection (Auto-Generated URIs)
            </h2>
            <p style={{ margin: "0 0 15px 0", color: "#555", fontSize: "13px" }}>
              Mint from the fixed 100-piece collection with auto-generated metadata URIs.
              No URI input needed - token ID automatically matches metadata!
            </p>

            {/* Auto-load preview for next token on component mount/token change */}
            {nft2NextTokenId < 100 && !nft2PreviewMetadata && (
              <div style={{ marginBottom: "15px" }}>
                <button
                  onClick={() => fetchNFT2Metadata(nft2NextTokenId)}
                  disabled={nft2PreviewLoading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: "14px",
                    fontWeight: "600",
                    background: nft2PreviewLoading ? "#ddd" : "#1565c0",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: nft2PreviewLoading ? "not-allowed" : "pointer",
                    marginBottom: "12px",
                    transition: "all 0.3s",
                  }}
                  onMouseOver={(e) =>
                    !nft2PreviewLoading &&
                    (e.currentTarget.style.transform = "translateY(-2px)")
                  }
                  onMouseOut={(e) =>
                    !nft2PreviewLoading &&
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  {nft2PreviewLoading ? "Loading..." : `👁️ Preview Token #${nft2NextTokenId}`}
                </button>
              </div>
            )}

            {/* NFT2 Preview Display */}
            {nft2PreviewMetadata && (
              <div
                style={{
                  background: "#e3f2fd",
                  border: "2px solid #2196F3",
                  borderRadius: "8px",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", color: "#1565c0", fontSize: "16px" }}>
                  📸 Next to Mint: Token #{nft2NextTokenId}
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    gap: "15px",
                  }}
                >
                  {/* Image */}
                  <div>
                    <img
                      src={getImageUrl(nft2PreviewMetadata.image)}
                      alt={nft2PreviewMetadata.name}
                      style={{
                        width: "180px",
                        height: "180px",
                        borderRadius: "8px",
                        border: "2px solid #2196F3",
                        objectFit: "contain",
                        background: "#fff",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22180%22 height=%22180%22%3E%3Crect fill=%22%23ddd%22 width=%22180%22 height=%22180%22/%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  {/* Details */}
                  <div>
                    <p style={{ margin: "0 0 8px 0", color: "#1565c0", fontWeight: "600", fontSize: "15px" }}>
                      <strong>{nft2PreviewMetadata.name}</strong>
                    </p>
                    <p style={{ margin: "0 0 10px 0", color: "#555", fontSize: "12px" }}>
                      {nft2PreviewMetadata.description}
                    </p>
                    {nft2PreviewMetadata.attributes && nft2PreviewMetadata.attributes.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <p style={{ margin: "0 0 8px 0", color: "#1565c0", fontWeight: "600", fontSize: "13px" }}>
                          ✨ Attributes:
                        </p>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "8px",
                          }}
                        >
                          {nft2PreviewMetadata.attributes.map((attr, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: "#fff",
                                padding: "8px 10px",
                                borderRadius: "4px",
                                border: "1px solid #2196F3",
                                fontSize: "12px",
                              }}
                            >
                              <div style={{ color: "#2196F3", fontWeight: "600", fontSize: "11px" }}>
                                {attr.trait_type}
                              </div>
                              <div style={{ color: "#333", marginTop: "2px" }}>
                                {attr.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={mintNFT2}
              disabled={nft2MintLoading || !address || nft2NextTokenId >= 100}
              style={{
                width: "100%",
                background: nft2NextTokenId >= 100 ? "#999" : "#2196F3",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                cursor: nft2MintLoading || !address || nft2NextTokenId >= 100 ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                fontWeight: "600",
                fontSize: "14px",
              }}
              onMouseOver={(e) =>
                !nft2MintLoading &&
                address &&
                nft2NextTokenId < 100 &&
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseOut={(e) =>
                !nft2MintLoading &&
                address &&
                nft2NextTokenId < 100 &&
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {nft2NextTokenId >= 100
                ? "✅ All 100 NFTs Minted!"
                : nft2MintLoading
                ? "Processing..."
                : `Mint Token #${nft2NextTokenId}`}
            </button>

            {nft2MintError && (
              <div
                style={{
                  marginTop: "15px",
                  background: nft2MintError.includes("✅")
                    ? "#d4edda"
                    : "#f8d7da",
                  color: nft2MintError.includes("✅")
                    ? "#155724"
                    : "#721c24",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  border: `1px solid ${
                    nft2MintError.includes("✅") ? "#c3e6cb" : "#f5c6cb"
                  }`,
                }}
              >
                {nft2MintError}
              </div>
            )}

            <br />
            <br />

            {nft2Details && (
              <div
                style={{
                  background: "#e3f2fd",
                  padding: "15px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  borderLeft: "4px solid #2196F3",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px 0",
                    color: "#1565c0",
                    fontWeight: "600",
                  }}
                >
                  🎨 Your NFT2 Balance:
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#1565c0" }}>
                  <strong>NFTs Owned:</strong> {nft2Details.userBalance}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#1565c0" }}>
                  <strong>Total Supply:</strong> {nft2Details.totalSupply}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "12px" }}>
                  <strong>NFT Name:</strong> {nft2Details.nft.name}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "12px" }}>
                  <strong>Symbol:</strong> {nft2Details.nft.symbol}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "12px" }}>
                  <strong>Version:</strong> {nft2Details.metadata.version}
                </p>
                <p style={{ margin: "0 0 5px 0", color: "#666", fontSize: "12px" }}>
                  <strong>Collection CID:</strong>{" "}
                  <code style={{ fontSize: "10px", background: "#f5f5f5", padding: "2px 4px" }}>
                    bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i
                  </code>
                </p>
                <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
                  <strong>Contract:</strong>{" "}
                  <a
                    href={`https://sepolia.etherscan.io/address/${nft2Details.contract}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "#2196F3",
                      textDecoration: "none",
                    }}
                  >
                    {nft2Details.contract.slice(0, 10)}...
                    {nft2Details.contract.slice(-8)}
                  </a>
                </p>
              </div>
            )}
          </div>
        )}

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
