// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 * LANDMAP TOKEN ($LAND) — ERC-20 Utility Token
 * ============================================================================
 * Utility token for LandMap platform access, staking, and premium features.
 * NOT a security (no profit sharing, no dividend, no voting rights).
 * Pure utility: access to features, cashback, discounts, staking rewards.
 *
 * Supply: 1,000,000,000 $LAND (fixed)
 * Chain: Base L2 (Coinbase, low gas)
 * ============================================================================
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract LandToken is ERC20, ERC20Burnable, ERC20Snapshot, Ownable, Pausable {
    // =========================================================================
    // Constants
    // =========================================================================

    /// @dev Maximum supply: 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;

    /// @dev Minting restricted to treasury multisig
    address public treasuryMultisig;

    // =========================================================================
    // Events
    // =========================================================================

    event TreasuryMultisigUpdated(address indexed newTreasury);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address initialTreasury) ERC20("LandMap Token", "LAND") {
        require(initialTreasury != address(0), "Invalid treasury address");
        treasuryMultisig = initialTreasury;
    }

    // =========================================================================
    // Minting (only treasury)
    // =========================================================================

    /// @dev Mint new tokens (only treasury multisig)
    /// @param to Recipient address
    /// @param amount Tokens to mint (in wei)
    function mint(address to, uint256 amount)
        public
        onlyOwner
        whenNotPaused
        returns (bool)
    {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        _mint(to, amount);
        emit TokensMinted(to, amount);

        return true;
    }

    /// @dev Bulk mint to multiple recipients (batch operation)
    /// @param recipients Array of recipient addresses
    /// @param amounts Array of amounts (must match recipients length)
    function mintBatch(address[] calldata recipients, uint256[] calldata amounts)
        public
        onlyOwner
        whenNotPaused
        returns (bool)
    {
        require(
            recipients.length == amounts.length,
            "Length mismatch: recipients vs amounts"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient at index");
            require(totalSupply() + amounts[i] <= MAX_SUPPLY, "Max supply exceeded");

            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }

        return true;
    }

    // =========================================================================
    // Burning
    // =========================================================================

    /// @dev Burn tokens from caller
    /// @param amount Tokens to burn (in wei)
    function burn(uint256 amount)
        public
        override
        returns (bool)
    {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
        return true;
    }

    /// @dev Burn tokens from another account (requires approval)
    /// @param account Account to burn from
    /// @param amount Tokens to burn (in wei)
    function burnFrom(address account, uint256 amount)
        public
        override
        returns (bool)
    {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "Insufficient allowance");

        _approve(account, msg.sender, currentAllowance - amount);
        _burn(account, amount);
        emit TokensBurned(account, amount);

        return true;
    }

    // =========================================================================
    // Snapshots (for voting/governance later)
    // =========================================================================

    /// @dev Take a snapshot of current balances (only owner)
    function snapshot() public onlyOwner returns (uint256) {
        return _snapshot();
    }

    // =========================================================================
    // Pausing (emergency only)
    // =========================================================================

    /// @dev Pause token transfers (emergency)
    function pause() public onlyOwner {
        _pause();
    }

    /// @dev Unpause token transfers
    function unpause() public onlyOwner {
        _unpause();
    }

    // =========================================================================
    // Treasury Management
    // =========================================================================

    /// @dev Update treasury multisig address
    /// @param newTreasury New treasury address
    function setTreasuryMultisig(address newTreasury) public onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasuryMultisig = newTreasury;
        emit TreasuryMultisigUpdated(newTreasury);
    }

    // =========================================================================
    // Internal Overrides (Pausable + Snapshot)
    // =========================================================================

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20)
    {
        super._burn(account, amount);
    }

    // =========================================================================
    // Query Functions
    // =========================================================================

    /// @dev Get remaining supply available to mint
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /// @dev Check if minting is possible (supply remaining)
    function canMint(uint256 amount) public view returns (bool) {
        return totalSupply() + amount <= MAX_SUPPLY;
    }

    /// @dev Get current supply percentage (0-100)
    function supplyPercentage() public view returns (uint256) {
        return (totalSupply() * 100) / MAX_SUPPLY;
    }
}
