/**
 * Interactive script to mint and transfer tokens
 * Run with: npx hardhat run scripts/interact.js --network localhost
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting token interaction demo...\n");

  // Get signers
  const [owner, addr1, addr2] = await ethers.getSigners();
  
  console.log("📍 Accounts:");
  console.log(`  Owner:  ${owner.address}`);
  console.log(`  Addr1:  ${addr1.address}`);
  console.log(`  Addr2:  ${addr2.address}\n`);

  // Deploy CustomToken
  console.log("📦 Deploying CustomToken...");
  const initialSupply = ethers.parseEther("1000");
  const CustomToken = await ethers.getContractFactory("CustomToken");
  const token = await CustomToken.deploy(initialSupply);
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log(`✅ CustomToken deployed at: ${tokenAddress}\n`);

  // Check initial balances
  console.log("💰 Initial Balances:");
  const ownerBalance = await token.balanceOf(owner.address);
  const addr1Balance = await token.balanceOf(addr1.address);
  console.log(`  Owner: ${ethers.formatEther(ownerBalance)} CUSTOM`);
  console.log(`  Addr1: ${ethers.formatEther(addr1Balance)} CUSTOM\n`);

  // ==================== MINT TOKENS ====================
  console.log("═══════════════════════════════════════════");
  console.log("🪙 MINTING TOKENS");
  console.log("═══════════════════════════════════════════\n");

  const mintAmount = ethers.parseEther("500");
  console.log(`📍 Minting ${ethers.formatEther(mintAmount)} tokens to Addr1...`);
  
  const mintTx = await token.mint(addr1.address, mintAmount);
  await mintTx.wait();
  console.log(`✅ Minted successfully!\n`);

  // Check updated balance
  const addr1BalanceAfterMint = await token.balanceOf(addr1.address);
  console.log(`💰 Addr1 balance after mint: ${ethers.formatEther(addr1BalanceAfterMint)} CUSTOM\n`);

  // ==================== TRANSFER TOKENS ====================
  console.log("═══════════════════════════════════════════");
  console.log("🔄 TRANSFERRING TOKENS");
  console.log("═══════════════════════════════════════════\n");

  const transferAmount = ethers.parseEther("100");
  console.log(`📍 Transferring ${ethers.formatEther(transferAmount)} tokens from Addr1 to Addr2...`);
  
  const transferTx = await token.connect(addr1).transfer(addr2.address, transferAmount);
  await transferTx.wait();
  console.log(`✅ Transfer successful!\n`);

  // Check final balances
  console.log("💰 Final Balances:");
  const ownerFinal = await token.balanceOf(owner.address);
  const addr1Final = await token.balanceOf(addr1.address);
  const addr2Final = await token.balanceOf(addr2.address);
  
  console.log(`  Owner: ${ethers.formatEther(ownerFinal)} CUSTOM`);
  console.log(`  Addr1: ${ethers.formatEther(addr1Final)} CUSTOM`);
  console.log(`  Addr2: ${ethers.formatEther(addr2Final)} CUSTOM\n`);

  // ==================== APPROVE & TRANSFERFROM ====================
  console.log("═══════════════════════════════════════════");
  console.log("✋ APPROVE & TRANSFER FROM (Delegated Transfer)");
  console.log("═══════════════════════════════════════════\n");

  const approvalAmount = ethers.parseEther("50");
  console.log(`📍 Addr1 approves ${ethers.formatEther(approvalAmount)} tokens for Owner to spend...`);
  
  const approveTx = await token.connect(addr1).approve(owner.address, approvalAmount);
  await approveTx.wait();
  console.log(`✅ Approval granted!\n`);

  console.log(`📍 Owner transfers ${ethers.formatEther(approvalAmount)} tokens from Addr1 to Addr2...`);
  
  const transferFromTx = await token.transferFrom(addr1.address, addr2.address, approvalAmount);
  await transferFromTx.wait();
  console.log(`✅ TransferFrom successful!\n`);

  // Final balances
  console.log("💰 Final Balances After ApproveAndTransfer:");
  const ownerFinal2 = await token.balanceOf(owner.address);
  const addr1Final2 = await token.balanceOf(addr1.address);
  const addr2Final2 = await token.balanceOf(addr2.address);
  
  console.log(`  Owner: ${ethers.formatEther(ownerFinal2)} CUSTOM`);
  console.log(`  Addr1: ${ethers.formatEther(addr1Final2)} CUSTOM`);
  console.log(`  Addr2: ${ethers.formatEther(addr2Final2)} CUSTOM\n`);

  // ==================== TOKEN INFO ====================
  console.log("═══════════════════════════════════════════");
  console.log("ℹ️ TOKEN INFORMATION");
  console.log("═══════════════════════════════════════════\n");

  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const maxSupply = await token.MAX_SUPPLY();

  console.log(`  Name: ${name}`);
  console.log(`  Symbol: ${symbol}`);
  console.log(`  Decimals: ${decimals}`);
  console.log(`  Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
  console.log(`  Max Supply: ${ethers.formatEther(maxSupply)} ${symbol}`);
  console.log(`  Contract Address: ${tokenAddress}\n`);

  console.log("✅ Demo completed!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
