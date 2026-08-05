// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/contracts/LandToken.sol";

contract DeployLandToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address multisigAddress = vm.envAddress("MULTISIG_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy LandToken
        LandToken token = new LandToken();
        console.log("LandToken deployed at:", address(token));

        // Set minter to multisig
        token.setMinter(multisigAddress);
        console.log("Minter set to:", multisigAddress);

        vm.stopBroadcast();
    }
}
