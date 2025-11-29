const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustomToken (ERC-20)", function () {
  let customToken;
  let owner;
  let addr1;
  let addr2;

  const INITIAL_SUPPLY = ethers.parseEther("100");
  const MINT_AMOUNT = ethers.parseEther("50");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const CustomToken = await ethers.getContractFactory("CustomToken");
    customToken = await CustomToken.deploy(INITIAL_SUPPLY);
    await customToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial supply", async function () {
      const totalSupply = await customToken.totalSupply();
      expect(totalSupply).to.equal(INITIAL_SUPPLY);
    });

    it("Should assign initial supply to owner", async function () {
      const ownerBalance = await customToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct token name and symbol", async function () {
      const name = await customToken.name();
      const symbol = await customToken.symbol();
      expect(name).to.equal("CustomToken");
      expect(symbol).to.equal("CUSTOM");
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to an address", async function () {
      const initialBalance = await customToken.balanceOf(addr1.address);
      await customToken.mint(addr1.address, MINT_AMOUNT);
      const finalBalance = await customToken.balanceOf(addr1.address);

      expect(finalBalance).to.equal(initialBalance + MINT_AMOUNT);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        customToken.connect(addr1).mint(addr2.address, MINT_AMOUNT)
      ).to.be.reverted;
    });

    it("Should not mint beyond max supply", async function () {
      const maxSupply = await customToken.MAX_SUPPLY();
      const currentSupply = await customToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + ethers.parseEther("1");

      await expect(
        customToken.mint(addr1.address, excessAmount)
      ).to.be.revertedWith("Mint would exceed max supply");
    });

    it("Should not mint to zero address", async function () {
      await expect(
        customToken.mint(ethers.ZeroAddress, MINT_AMOUNT)
      ).to.be.revertedWith("Cannot mint to zero address");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await customToken.mint(addr1.address, MINT_AMOUNT);
    });

    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("10");
      await customToken.connect(addr1).transfer(addr2.address, transferAmount);

      const addr2Balance = await customToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });

    it("Should not transfer to zero address", async function () {
      const transferAmount = ethers.parseEther("10");
      await expect(
        customToken.connect(addr1).transfer(ethers.ZeroAddress, transferAmount)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("Should not transfer more than balance", async function () {
      const balance = await customToken.balanceOf(addr1.address);
      const excessAmount = balance + ethers.parseEther("1");

      await expect(
        customToken.connect(addr1).transfer(addr2.address, excessAmount)
      ).to.be.reverted;
    });

    it("Should pause and unpause transfers", async function () {
      await customToken.setPaused(true);
      const transferAmount = ethers.parseEther("10");

      await expect(
        customToken.connect(addr1).transfer(addr2.address, transferAmount)
      ).to.be.revertedWith("Token transfers are paused");

      await customToken.setPaused(false);
      await customToken.connect(addr1).transfer(addr2.address, transferAmount);

      const addr2Balance = await customToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await customToken.mint(addr1.address, MINT_AMOUNT);
    });

    it("Should burn tokens from caller", async function () {
      const burnAmount = ethers.parseEther("10");
      const initialBalance = await customToken.balanceOf(addr1.address);

      await customToken.connect(addr1).burn(burnAmount);

      const finalBalance = await customToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should only allow owner to burn from others", async function () {
      const burnAmount = ethers.parseEther("10");

      await expect(
        customToken.connect(addr1).burnFrom(addr2.address, burnAmount)
      ).to.be.reverted;
    });

    it("Owner should be able to burn from any address", async function () {
      const burnAmount = ethers.parseEther("10");
      const initialBalance = await customToken.balanceOf(addr1.address);

      await customToken.burnFrom(addr1.address, burnAmount);

      const finalBalance = await customToken.balanceOf(addr1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });
  });

  describe("Approvals", function () {
    beforeEach(async function () {
      await customToken.mint(addr1.address, MINT_AMOUNT);
    });

    it("Should approve tokens for spending", async function () {
      const approveAmount = ethers.parseEther("25");
      await customToken.connect(addr1).approve(addr2.address, approveAmount);

      const allowance = await customToken.allowance(addr1.address, addr2.address);
      expect(allowance).to.equal(approveAmount);
    });

    it("Should transfer approved tokens on behalf of owner", async function () {
      const approveAmount = ethers.parseEther("25");
      const transferAmount = ethers.parseEther("15");

      await customToken.connect(addr1).approve(addr2.address, approveAmount);
      await customToken
        .connect(addr2)
        .transferFrom(addr1.address, addr2.address, transferAmount);

      const addr2Balance = await customToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);
    });
  });
});
