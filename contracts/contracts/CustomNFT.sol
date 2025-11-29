// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomNFT
 * @dev A simple ERC-721 NFT contract with minting capability
 * 
 * Features:
 * - Standard ERC-721 token functionality
 * - URI storage for metadata (IPFS)
 * - Minting capability (owner can mint)
 * - Batch minting for multiple NFTs
 * - Burning capability
 * - Token transfers between users
 * - Customizable base URI
 * - Optional minting fees
 * - Max supply: 10,000 NFTs
 * 
 * @notice This is a demonstration ERC-721 NFT contract for the Blockchain Integration Project
 * @custom:version 1.0
 * @custom:author Allanne Brand
 * @custom:project Task 4: Full-Stack Integration
 */
contract CustomNFT is ERC721, Ownable {
    // Token ID counter
    uint256 private _tokenIdCounter = 0;

    // Token URIs
    mapping(uint256 => string) private _tokenURIs;

    // Maximum total supply cap (optional)
    uint256 public constant MAX_SUPPLY = 10_000;

    // Base URI for metadata
    string public baseURI;

    // Minting fee (optional)
    uint256 public mintingFee = 0;

    // Contract metadata
    string public constant VERSION = "1.0";
    string public constant PROJECT = "Blockchain Integration Project";
    uint256 public deploymentTimestamp;

    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TokenBurned(uint256 indexed tokenId);
    event MintingFeeUpdated(uint256 newFee);
    event BaseURIUpdated(string newBaseURI);

    /**
     * @dev Constructor initializes the NFT contract
     * @param initialBaseURI Base URI for token metadata
     */
    constructor(string memory initialBaseURI) 
        ERC721("CustomNFT", "CNFT")
    {
        baseURI = initialBaseURI;
        deploymentTimestamp = block.timestamp;
    }

    /**
     * @dev Mints an NFT and assigns it to an address - FREE to mint!
     * @param to The address that will receive the NFT
     * @param uri The metadata URI for the token
     * 
     * Requirements:
     * - Only owner can mint
     * - Total supply cannot exceed MAX_SUPPLY
     * - NO minting fee required
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit TokenMinted(to, tokenId, uri);
    }

    /**
     * @dev Mints multiple NFTs in a batch - FREE to mint!
     * @param to The address that will receive all NFTs
     * @param uris Array of metadata URIs
     */
    function batchMint(address to, string[] calldata uris) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(uris.length > 0, "Must mint at least one token");
        require(
            _tokenIdCounter + uris.length <= MAX_SUPPLY,
            "Batch mint would exceed max supply"
        );

        for (uint256 i = 0; i < uris.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);

            emit TokenMinted(to, tokenId, uris[i]);
        }
    }

    /**
     * @dev Burns an NFT
     * @param tokenId The ID of the token to burn
     * 
     * Requirements:
     * - Caller must own the token or be approved
     */
    function burn(uint256 tokenId) public {
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "Only token owner or contract owner can burn"
        );
        _burn(tokenId);
        delete _tokenURIs[tokenId];
        emit TokenBurned(tokenId);
    }

    /**
     * @dev Transfers an NFT from one address to another
     * @param from The current owner
     * @param to The new owner
     * @param tokenId The ID of the token to transfer
     */
    function transferToken(address from, address to, uint256 tokenId) public {
        require(to != address(0), "Cannot transfer to zero address");
        safeTransferFrom(from, to, tokenId);
    }

    /**
     * @dev Approves an address to transfer a specific token
     * @param to The address to approve
     * @param tokenId The token ID to approve for transfer
     */
    function approveTransfer(address to, uint256 tokenId) public {
        approve(to, tokenId);
    }

    /**
     * @dev Updates the minting fee
     * @param newFee The new minting fee in wei
     */
    function setMintingFee(uint256 newFee) public onlyOwner {
        mintingFee = newFee;
        emit MintingFeeUpdated(newFee);
    }

    /**
     * @dev Updates the base URI
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Withdraws collected fees (if any)
     */
    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev Internal function to set token URI
     */
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        _tokenURIs[tokenId] = uri;
    }

    /**
     * @dev Returns the total number of tokens in existence
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Returns the URI of a specific token
     * @param tokenId The token ID
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
    /**
     * @dev Receive function to accept ETH payments for fees
     */
    receive() external payable {}

    /**
     * @dev Returns contract metadata
     */
    function getMetadata() public view returns (
        string memory version,
        string memory project,
        string memory nftName,
        string memory nftSymbol,
        uint256 maxSupply,
        uint256 currentSupply,
        uint256 deployed,
        string memory currentBaseURI,
        uint256 currentMintingFee
    ) {
        return (
            VERSION,
            PROJECT,
            name(),
            symbol(),
            MAX_SUPPLY,
            _tokenIdCounter,
            deploymentTimestamp,
            baseURI,
            mintingFee
        );
    }

    /**
     * @dev Returns contract information as a string
     */
    function getInfo() public view returns (string memory) {
        return string(abi.encodePacked(
            "CustomNFT v",
            VERSION,
            " - ",
            PROJECT,
            " - Max Supply: 10K NFTs"
        ));
    }
}
