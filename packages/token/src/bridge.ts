export interface TokenMintRequest {
  id: string;
  user_id: string;
  wallet_address: string;
  landcoins_spent: number;
  tokens_minted: number;
  tx_hash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  chain: 'sepolia' | 'base';
  created_at: string;
}

export interface TokenBridgeProvider {
  getBalance(userId: string): Promise<{ landcoins: number; tokens: bigint }>;
  redeemLandcoins(userId: string, landcoinsAmount: number, walletAddress: string, chain: 'sepolia' | 'base'): Promise<TokenMintRequest>;
  confirmMint(requestId: string, txHash: string): Promise<void>;
}

export class LandCoinBridge implements TokenBridgeProvider {
  constructor(
    private contractAddress: string,
    private minterPrivateKey: string,
  ) {}

  async getBalance(userId: string): Promise<{ landcoins: number; tokens: bigint }> {
    // TODO: fetch UserProgress + token balance from contract
    return { landcoins: 0, tokens: 0n };
  }

  async redeemLandcoins(
    userId: string,
    landcoinsAmount: number,
    walletAddress: string,
    chain: 'sepolia' | 'base',
  ): Promise<TokenMintRequest> {
    // TODO: validate wallet signature, queue mint, burn LandCoins locally
    return {
      id: `mint_${Date.now()}`,
      user_id: userId,
      wallet_address: walletAddress,
      landcoins_spent: landcoinsAmount,
      tokens_minted: landcoinsAmount * 10**18,
      status: 'pending',
      chain,
      created_at: new Date().toISOString(),
    };
  }

  async confirmMint(requestId: string, txHash: string): Promise<void> {
    // TODO: update DB status to 'confirmed', log tx_hash
  }
}

export function createBridge(contractAddr: string, privKey: string): TokenBridgeProvider {
  return new LandCoinBridge(contractAddr, privKey);
}
