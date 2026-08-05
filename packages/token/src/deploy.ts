import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { baseSepolia, base } from 'viem/chains';

const LAND_TOKEN_ABI = parseAbi([
  'function setMinter(address _minter) external',
  'function mint(address to, uint256 amount) external',
  'function balanceOf(address account) view returns (uint256)',
]);

async function deployTestnet() {
  const chain = process.env.DEPLOY_CHAIN === 'mainnet' ? base : baseSepolia;
  const rpcUrl = process.env.RPC_URL || (chain === base ? 'https://mainnet.base.org' : 'https://sepolia.base.org');

  console.log(`\n🚀 Deploying $LAND to ${chain.name}...`);
  console.log(`RPC: ${rpcUrl}`);
  console.log(`Chain ID: ${chain.id}`);

  // TODO: Use forge/hardhat to deploy LandToken.sol
  // Placeholder: just log the deployment plan
  console.log(`\n📋 Deployment Plan:`);
  console.log(`1. Deploy LandToken.sol (1B supply cap)`);
  console.log(`2. Set minter to multisig address (Gnosis Safe)`);
  console.log(`3. Create Base Sepolia pool on Uniswap v3`);
  console.log(`4. Initialize bridge in token_wallets table`);

  console.log(`\n✅ Ready for Foundry: forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY src/contracts/LandToken.sol:LandToken`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  deployTestnet().catch(console.error);
}

export { deployTestnet };
