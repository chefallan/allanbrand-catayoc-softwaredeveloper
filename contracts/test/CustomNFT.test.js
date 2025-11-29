const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustomNFT (ERC-721)", function () {
  let customNFT;
  let owner;
  let addr1;
  let addr2;

  const BASE_URI = "https://metadata.example.com/";
  const TOKEN_URI = "token1.json";

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const CustomNFT = await ethers.getContractFactory("CustomNFT");
    customNFT = await CustomNFT.deploy(BASE_URI);
    await customNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct base URI", async function () {
      const baseURI = await customNFT.baseURI();
      expect(baseURI).to.equal(BASE_URI);
    });

    it("Should have correct token name and symbol", async function () {
      const name = await customNFT.name();
      const symbol = await customNFT.symbol();
      expect(name).to.equal("CustomNFT");
      expect(symbol).to.equal("CNFT");
    });

    it("Should have zero initial supply", async function () {
      const totalSupply = await customNFT.totalSupply();
      expect(totalSupply).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint an NFT to an address", async function () {
      await customNFT.safeMint(addr1.address, TOKEN_URI);

      const owner_of_token = await customNFT.ownerOf(0);
      expect(owner_of_token).to.equal(addr1.address);
    });

    it("Should set correct token URI", async function () {
      await customNFT.safeMint(addr1.address, TOKEN_URI);

      const tokenURI = await customNFT.tokenURI(0);
      expect(tokenURI).to.equal(TOKEN_URI);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        customNFT.connect(addr1).safeMint(addr2.address, TOKEN_URI)
      ).to.be.reverted;
    });

    it("Should not mint to zero address", async function () {
      await expect(
        customNFT.safeMint(ethers.ZeroAddress, TOKEN_URI)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should increment token IDs correctly", async function () {
      await customNFT.safeMint(addr1.address, "token1.json");
      await customNFT.safeMint(addr2.address, "token2.json");
      await customNFT.safeMint(owner.address, "token3.json");

      const totalSupply = await customNFT.totalSupply();
      expect(totalSupply).to.equal(3);
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint multiple NFTs", async function () {
      const uris = ["token1.json", "token2.json", "token3.json"];
      await customNFT.batchMint(addr1.address, uris);

      const totalSupply = await customNFT.totalSupply();
      expect(totalSupply).to.equal(3);

      for (let i = 0; i < uris.length; i++) {
        const tokenOwner = await customNFT.ownerOf(i);
        expect(tokenOwner).to.equal(addr1.address);
      }
    });

    it("Should not batch mint with empty array", async function () {
      await expect(
        customNFT.batchMint(addr1.address, [])
      ).to.be.revertedWith("Must mint at least one token");
    });

    it("Should not batch mint beyond max supply", async function () {
      const maxSupply = await customNFT.MAX_SUPPLY();
      const tooManyURIs = Array(Number(maxSupply) + 1).fill("token.json");

      await expect(
        customNFT.batchMint(addr1.address, tooManyURIs)
      ).to.be.revertedWith("Batch mint would exceed max supply");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await customNFT.safeMint(addr1.address, TOKEN_URI);
    });

    it("Should transfer NFT from one address to another", async function () {
      await customNFT.connect(addr1).transferToken(addr1.address, addr2.address, 0);

      const newOwner = await customNFT.ownerOf(0);
      expect(newOwner).to.equal(addr2.address);
    });

    it("Should not transfer to zero address", async function () {
      await expect(
        customNFT.transferToken(addr1.address, ethers.ZeroAddress, 0)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("Should approve and transfer NFT", async function () {
      await customNFT.connect(addr1).approveTransfer(addr2.address, 0);

      const approved = await customNFT.getApproved(0);
      expect(approved).to.equal(addr2.address);

      await customNFT.connect(addr2).transferToken(addr1.address, addr2.address, 0);
      const newOwner = await customNFT.ownerOf(0);
      expect(newOwner).to.equal(addr2.address);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await customNFT.safeMint(addr1.address, TOKEN_URI);
    });

    it("Should burn an NFT", async function () {
      await customNFT.connect(addr1).burn(0);

      await expect(customNFT.ownerOf(0)).to.be.reverted;
    });

    it("Should only allow owner or token holder to burn", async function () {
      await expect(
        customNFT.connect(addr2).burn(0)
      ).to.be.revertedWith("Only token owner or contract owner can burn");
    });

    it("Contract owner should be able to burn any token", async function () {
      await customNFT.burn(0);

      await expect(customNFT.ownerOf(0)).to.be.reverted;
    });
  });

  describe("Base URI", function () {
    it("Should update base URI", async function () {
      const newBaseURI = "https://new-metadata.example.com/";
      await customNFT.setBaseURI(newBaseURI);

      const updatedBaseURI = await customNFT.baseURI();
      expect(updatedBaseURI).to.equal(newBaseURI);
    });

    it("Should only allow owner to update base URI", async function () {
      const newBaseURI = "https://new-metadata.example.com/";

      await expect(
        customNFT.connect(addr1).setBaseURI(newBaseURI)
      ).to.be.reverted;
    });
  });

  describe("Minting Fee", function () {
    it("Should set minting fee", async function () {
      const fee = ethers.parseEther("0");
      await customNFT.setMintingFee(fee);

      const mintingFee = await customNFT.mintingFee();
      expect(mintingFee).to.equal(fee);
    });

    it("Should allow free minting without payment", async function () {
      const fee = ethers.parseEther("0");
      await customNFT.setMintingFee(fee);

      await customNFT.safeMint(addr1.address, TOKEN_URI);

      const owner_of_token = await customNFT.ownerOf(0);
      expect(owner_of_token).to.equal(addr1.address);
    });

    it("Should mint NFTs at no cost", async function () {
      await customNFT.safeMint(addr1.address, TOKEN_URI);

      const owner_of_token = await customNFT.ownerOf(0);
      expect(owner_of_token).to.equal(addr1.address);
    });
  });

  describe("Fee Withdrawal", function () {
    it("Should not collect fees for free minting", async function () {
      await customNFT.safeMint(addr1.address, "token1.json");

      const contractBalance = await ethers.provider.getBalance(customNFT.target);
      expect(contractBalance).to.equal(0);
    });
  });
});
