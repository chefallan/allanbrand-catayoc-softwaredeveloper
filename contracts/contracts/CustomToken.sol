// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CustomToken
 * @dev A simple ERC-20 token with minting capability
 * 
 * Features:
 * - Standard ERC-20 token functionality
 * - Minting capability (only owner can mint)
 * - Burning capability (anyone can burn their tokens)
 * - Pausable token transfers
 */
contract CustomToken is ERC20, Ownable {
    // Maximum total supply cap (optional)
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 billion tokens

    // Paused state
    bool public paused = false;

    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event Paused(bool isPaused);

    /**
     * @dev Constructor initializes the token with initial supply
     * @param initialSupply Initial amount of tokens to mint (in smallest unit)
     */
    constructor(uint256 initialSupply) ERC20("CustomToken", "CUSTOM") {
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");
        _mint(msg.sender, initialSupply);
        emit TokensMinted(msg.sender, initialSupply);
    }

    /**
     * @dev Mints tokens and assigns them to an address
     * @param to The address that will receive the tokens
     * @param amount The amount of tokens to mint
     * 
     * Requirements:
     * - Only owner can mint
     * - Total supply cannot exceed MAX_SUPPLY
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Mint would exceed max supply");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Burns tokens from the caller's balance
     * @param amount The amount of tokens to burn
     * 
     * Requirements:
     * - Caller must have at least amount tokens
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burns tokens from a specified address (only owner)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Transfers tokens from caller to recipient
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!paused, "Token transfers are paused");
        require(to != address(0), "Cannot transfer to zero address");
        return super.transfer(to, amount);
    }

    /**
     * @dev Transfers tokens on behalf of an address
     * @param from The address to transfer from
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        returns (bool) 
    {
        require(!paused, "Token transfers are paused");
        require(to != address(0), "Cannot transfer to zero address");
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Pauses or unpauses token transfers
     * @param _paused New pause state
     */
    function setPaused(bool _paused) public onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /**
     * @dev Returns the number of decimals used for token display
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
