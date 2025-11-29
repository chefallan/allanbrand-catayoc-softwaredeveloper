const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting smart contract deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy CustomToken (ERC-20)
  console.log("📦 Deploying CustomToken (ERC-20)...");
  const CustomToken = await ethers.getContractFactory("CustomToken");
  const initialSupply = ethers.parseEther("100"); // 100 tokens with 18 decimals
  const customToken = await CustomToken.deploy(initialSupply);
  await customToken.waitForDeployment();
  const tokenAddress = await customToken.getAddress();
  console.log(`✅ CustomToken deployed to: ${tokenAddress}\n`);

  // Deploy CustomNFT (ERC-721)
  console.log("🎨 Deploying CustomNFT (ERC-721)...");
  const CustomNFT = await ethers.getContractFactory("CustomNFT");
  const baseURI = "ipfs://"; // Base URI for metadata (can be changed)
  const customNFT = await CustomNFT.deploy(baseURI);
  await customNFT.waitForDeployment();
  const nftAddress = await customNFT.getAddress();
  console.log(`✅ CustomNFT deployed to: ${nftAddress}\n`);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      customToken: {
        address: tokenAddress,
        type: "ERC-20",
        initialSupply: initialSupply.toString(),
      },
      customNFT: {
        address: nftAddress,
        type: "ERC-721",
        baseURI: baseURI,
      },
    },
  };

  const deploymentPath = path.join(__dirname, `../deployments/${hre.network.name}.json`);
  const deploymentsDir = path.dirname(deploymentPath);

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentPath}\n`);

  // Log deployment summary
  console.log("📊 Deployment Summary:");
  console.log("═".repeat(60));
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`\nContracts:`);
  console.log(`  ERC-20 Token: ${tokenAddress}`);
  console.log(`  ERC-721 NFT:  ${nftAddress}`);
  console.log("═".repeat(60));

  console.log("\n📚 Next Steps:");
  console.log("1. Run tests:  npx hardhat test");
  if (hre.network.name === "localhost") {
    console.log("2. Verify contracts are working correctly");
  } else if (hre.network.name === "sepolia" || hre.network.name === "goerli") {
    console.log(`2. Verify on Etherscan: https://${hre.network.name}.etherscan.io/address/`);
    console.log("3. Run: npx hardhat verify <contract_address> --network " + hre.network.name);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
