// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "./LandToken.sol";

contract LandTokenTest is Test {
    LandToken public token;
    address public minter = address(0x1);
    address public user = address(0x2);

    function setUp() public {
        token = new LandToken();
        token.setMinter(minter);
    }

    function testSupplyCap() public {
        uint256 maxSupply = 1_000_000_000 * 10**18;
        vm.prank(minter);
        token.mint(user, maxSupply);
        assertEq(token.balanceOf(user), maxSupply);

        // Should fail on exceed
        vm.prank(minter);
        vm.expectRevert("Max supply exceeded");
        token.mint(user, 1);
    }

    function testMinterOnly() public {
        vm.prank(user);  // not minter
        vm.expectRevert("Only minter");
        token.mint(user, 1 * 10**18);
    }

    function testBurn() public {
        vm.prank(minter);
        token.mint(user, 100 * 10**18);

        vm.prank(user);
        token.burn(50 * 10**18);
        assertEq(token.balanceOf(user), 50 * 10**18);
    }
}
