// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================================
 * LANDCOINS BRIDGE — Redeem off-chain LandCoins for on-chain $LAND
 * ============================================================================
 * Bridge contract allowing users to convert accumulated LandCoins
 * (off-chain gamification points) into on-chain $LAND tokens.
 *
 * Flow:
 * 1. User has N LandCoins in off-chain database (packages/gamification)
 * 2. User calls redeemLandcoins(landcoinsAmount, walletAddress)
 * 3. Backend verifies balance, queues mint request
 * 4. Smart contract mints $LAND on user's wallet (1:1 ratio by default)
 * 5. Off-chain database deducts LandCoins (immutable log)
 * ============================================================================
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ILandToken is IERC20 {
    function mint(address to, uint256 amount) external returns (bool);
}

contract LandCoinsBridge is Ownable, Pausable, ReentrancyGuard {
    // =========================================================================
    // Constants & Variables
    // =========================================================================

    /// @dev $LAND token contract (ERC-20)
    ILandToken public landToken;

    /// @dev Conversion rate: 1 LandCoin = X $LAND (in wei)
    /// Default: 1e16 = 0.01 $LAND (1 LandCoin = R$0.10 BRL ≈ $0.02 USD = 0.01 $LAND)
    uint256 public conversionRate = 1e16;

    /// @dev Backend signer (for off-chain verification)
    address public backendSigner;

    /// @dev Mapping: user => (nonce => redeemAmount)
    mapping(address => uint256) public nonces;

    /// @dev Mapping: requestId => MintRequest (for tracking)
    mapping(bytes32 => MintRequest) public mintRequests;

    /// @dev Total $LAND minted via bridge
    uint256 public totalMinted;

    // =========================================================================
    // Structs
    // =========================================================================

    struct MintRequest {
        address user;
        uint256 landcoinsAmount;
        uint256 landAmount;
        uint64 timestamp;
        bool completed;
    }

    // =========================================================================
    // Events
    // =========================================================================

    event ConversionRateUpdated(uint256 newRate);
    event BackendSignerUpdated(address indexed newSigner);
    event LandcoinRedeemed(
        address indexed user,
        uint256 landcoinsAmount,
        uint256 landAmount,
        bytes32 requestId
    );
    event MintCompleted(address indexed user, uint256 amount);
    event RedeemCancelled(bytes32 indexed requestId, string reason);

    // =========================================================================
    // Constructor
    // =========================================================================

    constructor(address _landToken, address _backendSigner) {
        require(_landToken != address(0), "Invalid token address");
        require(_backendSigner != address(0), "Invalid signer address");

        landToken = ILandToken(_landToken);
        backendSigner = _backendSigner;
    }

    // =========================================================================
    // Core: Redeem LandCoins → $LAND
    // =========================================================================

    /// @dev User initiates redemption of LandCoins for $LAND
    /// @param landcoinsAmount Amount of LandCoins to redeem
    /// @param walletAddress Target wallet for $LAND
    /// @param signature Backend signature (proof that user has balance)
    /// @param nonce Replay protection nonce
    function redeemLandcoins(
        uint256 landcoinsAmount,
        address walletAddress,
        bytes calldata signature,
        uint256 nonce
    )
        public
        nonReentrant
        whenNotPaused
        returns (bytes32 requestId)
    {
        require(landcoinsAmount > 0, "Amount must be > 0");
        require(walletAddress != address(0), "Invalid wallet address");
        require(nonce == nonces[msg.sender], "Invalid nonce");

        // Verify backend signature (proof of LandCoin balance)
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                msg.sender,
                landcoinsAmount,
                walletAddress,
                nonce,
                block.chainid
            )
        );

        require(
            _verifySignature(messageHash, signature),
            "Invalid signature (no LandCoin balance proof)"
        );

        // Calculate $LAND amount (with conversion rate)
        uint256 landAmount = (landcoinsAmount * conversionRate) / 1e18;

        require(landAmount > 0, "Conversion resulted in zero $LAND");

        // Generate request ID
        requestId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, landcoinsAmount)
        );

        // Store request
        mintRequests[requestId] = MintRequest({
            user: msg.sender,
            landcoinsAmount: landcoinsAmount,
            landAmount: landAmount,
            timestamp: uint64(block.timestamp),
            completed: false
        });

        // Increment nonce (replay protection)
        nonces[msg.sender]++;

        // Mint $LAND to wallet
        require(
            landToken.mint(walletAddress, landAmount),
            "Mint failed"
        );

        // Mark as completed
        mintRequests[requestId].completed = true;
        totalMinted += landAmount;

        emit LandcoinRedeemed(msg.sender, landcoinsAmount, landAmount, requestId);

        // Emit separate event for off-chain indexing
        emit MintCompleted(walletAddress, landAmount);

        return requestId;
    }

    /// @dev Bulk redeem for multiple users (admin only)
    /// @param users Array of user addresses
    /// @param amounts Array of LandCoin amounts
    /// @param wallets Array of target wallets
    function redeemBatch(
        address[] calldata users,
        uint256[] calldata amounts,
        address[] calldata wallets
    )
        public
        onlyOwner
        nonReentrant
        whenNotPaused
        returns (bytes32[] memory requestIds)
    {
        require(
            users.length == amounts.length && amounts.length == wallets.length,
            "Length mismatch"
        );

        requestIds = new bytes32[](users.length);

        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user at index");
            require(wallets[i] != address(0), "Invalid wallet at index");

            uint256 landAmount = (amounts[i] * conversionRate) / 1e18;

            bytes32 requestId = keccak256(
                abi.encodePacked(users[i], block.timestamp, i)
            );

            mintRequests[requestId] = MintRequest({
                user: users[i],
                landcoinsAmount: amounts[i],
                landAmount: landAmount,
                timestamp: uint64(block.timestamp),
                completed: false
            });

            require(landToken.mint(wallets[i], landAmount), "Mint failed");

            mintRequests[requestId].completed = true;
            totalMinted += landAmount;

            emit LandcoinRedeemed(users[i], amounts[i], landAmount, requestId);

            requestIds[i] = requestId;
        }

        return requestIds;
    }

    // =========================================================================
    // Query Functions
    // =========================================================================

    /// @dev Get conversion amount (LandCoins → $LAND)
    /// @param landcoinsAmount Input LandCoin amount
    /// @return $LAND amount after conversion
    function getConversionAmount(uint256 landcoinsAmount)
        public
        view
        returns (uint256)
    {
        return (landcoinsAmount * conversionRate) / 1e18;
    }

    /// @dev Get mint request status
    /// @param requestId Request ID
    /// @return Request data
    function getMintRequest(bytes32 requestId)
        public
        view
        returns (MintRequest memory)
    {
        return mintRequests[requestId];
    }

    /// @dev Get user's next nonce (for signature replay protection)
    /// @param user User address
    /// @return Next nonce
    function getNonce(address user) public view returns (uint256) {
        return nonces[user];
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /// @dev Update conversion rate (only owner)
    /// @param newRate New rate (e.g., 1e16 = 0.01 $LAND per LandCoin)
    function setConversionRate(uint256 newRate) public onlyOwner {
        require(newRate > 0, "Rate must be > 0");
        conversionRate = newRate;
        emit ConversionRateUpdated(newRate);
    }

    /// @dev Update backend signer (only owner)
    /// @param newSigner New signer address
    function setBackendSigner(address newSigner) public onlyOwner {
        require(newSigner != address(0), "Invalid address");
        backendSigner = newSigner;
        emit BackendSignerUpdated(newSigner);
    }

    /// @dev Pause redemptions (emergency)
    function pause() public onlyOwner {
        _pause();
    }

    /// @dev Unpause redemptions
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @dev Cancel a mint request (refund off-chain)
    function cancelMintRequest(bytes32 requestId, string memory reason)
        public
        onlyOwner
    {
        MintRequest storage request = mintRequests[requestId];
        require(request.user != address(0), "Request not found");
        require(!request.completed, "Already completed");

        request.completed = false;

        emit RedeemCancelled(requestId, reason);
    }

    // =========================================================================
    // Signature Verification (ECDSA)
    // =========================================================================

    /// @dev Verify backend signature
    function _verifySignature(bytes32 messageHash, bytes calldata signature)
        internal
        view
        returns (bool)
    {
        // Recreate signature with Ethereum prefix
        bytes32 ethSignedHash = _getEthSignedMessageHash(messageHash);

        // Recover signer from signature
        address signer = _recoverSigner(ethSignedHash, signature);

        return signer == backendSigner;
    }

    /// @dev Hash message with Ethereum prefix (for web3 signing)
    function _getEthSignedMessageHash(bytes32 messageHash)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                messageHash
            )
        );
    }

    /// @dev Recover signer from signature (r, s, v)
    function _recoverSigner(
        bytes32 ethSignedHash,
        bytes calldata signature
    )
        internal
        pure
        returns (address)
    {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature.offset, 0x20))
            s := mload(add(signature.offset, 0x40))
            v := byte(0, mload(add(signature.offset, 0x60)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v");

        address signer = ecrecover(ethSignedHash, v, r, s);
        require(signer != address(0), "Invalid signature");

        return signer;
    }
}
