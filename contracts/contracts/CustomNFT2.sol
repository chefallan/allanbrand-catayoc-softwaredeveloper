// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomNFT2
 * @dev An ERC-721 NFT contract with fixed IPFS metadata collection
 * 
 * Features:
 * - Standard ERC-721 token functionality
 * - Fixed IPFS metadata collection (100 NFTs, IDs 0-99)
 * - Automatic metadata URI generation from token ID
 * - Minting capability (owner can mint)
 * - Batch minting for multiple NFTs
 * - Burning capability
 * - Token transfers between users
 * - Optional minting fees
 * - Max supply: 100 NFTs
 * - Metadata CID: bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i
 * 
 * @notice This is a production ERC-721 NFT contract with fixed metadata collection
 * @custom:version 2.0
 * @custom:author Allanne Brand
 * @custom:project Task 4: Full-Stack Integration
 */
contract CustomNFT2 is ERC721, Ownable {
    // Token ID counter
    uint256 private _tokenIdCounter = 0;

    // Maximum total supply cap
    uint256 public constant MAX_SUPPLY = 100;

    // Fixed IPFS metadata collection CID
    string public constant METADATA_CID = "bafybeielhptx3zatpn2d63uabepujdw2zpuzglvvwshj33yjmzdult4o3i";
    
    // Base IPFS gateway URL
    string public constant IPFS_GATEWAY = "ipfs://";

    // Minting fee (optional)
    uint256 public mintingFee = 0;

    // Contract metadata
    string public constant VERSION = "2.0";
    string public constant PROJECT = "Blockchain Integration Project";
    uint256 public deploymentTimestamp;

    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TokenBurned(uint256 indexed tokenId);
    event MintingFeeUpdated(uint256 newFee);

    /**
     * @dev Constructor initializes the NFT contract
     */
    constructor() 
        ERC721("CustomNFT", "CNFT")
    {
        deploymentTimestamp = block.timestamp;
    }

    /**
     * @dev Mints an NFT with automatic metadata URI from fixed collection - FREE to mint!
     * @param to The address that will receive the NFT
     * 
     * Requirements:
     * - Only owner can mint
     * - Total supply cannot exceed MAX_SUPPLY (100)
     * - NO minting fee required
     * - Metadata URI automatically generated from token ID
     */
    function safeMint(address to) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        // Generate metadata URI: ipfs://METADATA_CID/{tokenId}.json
        string memory uri = string(abi.encodePacked(
            IPFS_GATEWAY,
            METADATA_CID,
            "/",
            _uint2str(tokenId),
            ".json"
        ));

        emit TokenMinted(to, tokenId, uri);
    }

    /**
     * @dev Mints an NFT with custom metadata URI - FREE to mint!
     * @param to The address that will receive the NFT
     * @param customUri Custom metadata URI (for flexibility)
     * 
     * Requirements:
     * - Only owner can mint
     * - Total supply cannot exceed MAX_SUPPLY
     * - NO minting fee required
     */
    function safeMintWithUri(address to, string memory customUri) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        require(bytes(customUri).length > 0, "URI cannot be empty");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);

        emit TokenMinted(to, tokenId, customUri);
    }

    /**
     * @dev Mints multiple NFTs in a batch - FREE to mint!
     * @param to The address that will receive all NFTs
     * @param count Number of NFTs to mint
     */
    function batchMint(address to, uint256 count) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(count > 0, "Must mint at least one token");
        require(
            _tokenIdCounter + count <= MAX_SUPPLY,
            "Batch mint would exceed max supply"
        );

        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;

            _safeMint(to, tokenId);

            // Generate metadata URI
            string memory uri = string(abi.encodePacked(
                IPFS_GATEWAY,
                METADATA_CID,
                "/",
                _uint2str(tokenId),
                ".json"
            ));

            emit TokenMinted(to, tokenId, uri);
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
     * @dev Withdraws collected fees (if any)
     */
    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
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
        
        // Return auto-generated URI from fixed metadata collection
        return string(abi.encodePacked(
            IPFS_GATEWAY,
            METADATA_CID,
            "/",
            _uint2str(tokenId),
            ".json"
        ));
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
        string memory metadataCid,
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
            METADATA_CID,
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
            " - Max Supply: 100 NFTs - Fixed IPFS Collection"
        ));
    }

    /**
     * @dev Internal helper function to convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
