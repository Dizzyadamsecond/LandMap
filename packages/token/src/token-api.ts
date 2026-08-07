/**
 * ============================================================================
 * LandMap Token API Client — Type-safe async functions
 * ============================================================================
 * Frontend client for $LAND token interactions:
 * - Link wallet
 * - Check LandCoin balance
 * - Redeem LandCoins → $LAND
 * - View on-chain balance
 * ============================================================================
 */

import { z } from 'zod';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================================
// Types
// ============================================================================

export interface WalletInfo {
  wallet_address: string;
  verified: boolean;
  linked_at: string;
  balance_landcoins: number;
  balance_land_wei: string;
  balance_land: number;
}

export interface RedeemRequest {
  request_id: string;
  user_id: string;
  landcoins_amount: number;
  land_amount_wei: string;
  land_amount: number;
  tx_hash?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface TokenStats {
  total_supply_wei: string;
  total_supply: number;
  circulating_supply_wei: string;
  circulating_supply: number;
  price_usd: number;
  market_cap_usd: number;
  holders_count: number;
  conversion_rate: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const WalletInfoSchema = z.object({
  wallet_address: z.string(),
  verified: z.boolean(),
  linked_at: z.string(),
  balance_landcoins: z.number(),
  balance_land_wei: z.string(),
  balance_land: z.number(),
});

const RedeemRequestSchema = z.object({
  request_id: z.string().uuid(),
  user_id: z.string().uuid(),
  landcoins_amount: z.number().positive(),
  land_amount_wei: z.string(),
  land_amount: z.number().positive(),
  tx_hash: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']),
  created_at: z.string(),
});

const TokenStatsSchema = z.object({
  total_supply_wei: z.string(),
  total_supply: z.number(),
  circulating_supply_wei: z.string(),
  circulating_supply: z.number(),
  price_usd: z.number(),
  market_cap_usd: z.number(),
  holders_count: z.number().int(),
  conversion_rate: z.number().positive(),
});

// ============================================================================
// 1. WALLET MANAGEMENT
// ============================================================================

/**
 * Link a wallet to the user account
 * Signs a message to prove ownership
 *
 * @param walletAddress Ethereum wallet address
 * @param signature Message signature (from MetaMask/web3.js)
 * @returns Wallet info
 */
export async function linkWallet(
  walletAddress: string,
  signature: string
): Promise<WalletInfo> {
  const userId = localStorage.getItem('user_id');
  if (!userId) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE}/api/token/wallet/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({
      wallet_address: walletAddress,
      signature,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to link wallet');
  }

  const data = await response.json();
  return WalletInfoSchema.parse(data);
}

/**
 * Get linked wallet info
 * @returns Wallet details + balances
 */
export async function getWalletInfo(): Promise<WalletInfo | null> {
  const userId = localStorage.getItem('user_id');
  if (!userId) return null;

  try {
    const response = await fetch(`${API_BASE}/api/token/wallet`, {
      headers: {
        'x-user-id': userId,
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch wallet info');

    const data = await response.json();
    return WalletInfoSchema.parse(data);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
}

/**
 * Unlink wallet (revoke access)
 * @returns Success status
 */
export async function unlinkWallet(): Promise<boolean> {
  const userId = localStorage.getItem('user_id');
  if (!userId) return false;

  const response = await fetch(`${API_BASE}/api/token/wallet/unlink`, {
    method: 'POST',
    headers: {
      'x-user-id': userId,
    },
  });

  return response.ok;
}

// ============================================================================
// 2. LANDCOINS REDEMPTION
// ============================================================================

/**
 * Redeem LandCoins for $LAND tokens
 * 1. User provides LandCoin amount
 * 2. Backend verifies balance + generates signature
 * 3. Smart contract mints $LAND on chain
 *
 * @param landcoinsAmount Amount of LandCoins to redeem
 * @param walletAddress Target wallet for $LAND
 * @returns Redeem request details
 */
export async function redeemLandcoins(
  landcoinsAmount: number,
  walletAddress?: string
): Promise<RedeemRequest> {
  const userId = localStorage.getItem('user_id');
  if (!userId) throw new Error('Not authenticated');

  // If no wallet provided, use linked wallet
  if (!walletAddress) {
    const wallet = await getWalletInfo();
    if (!wallet) throw new Error('No wallet linked');
    walletAddress = wallet.wallet_address;
  }

  const response = await fetch(`${API_BASE}/api/token/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({
      landcoins_amount: landcoinsAmount,
      wallet_address: walletAddress,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Redemption failed');
  }

  const data = await response.json();
  return RedeemRequestSchema.parse(data);
}

/**
 * Get redemption history
 * @param limit Max results
 * @param offset Pagination offset
 * @returns Array of redemption requests
 */
export async function getRedemptionHistory(
  limit: number = 20,
  offset: number = 0
): Promise<RedeemRequest[]> {
  const userId = localStorage.getItem('user_id');
  if (!userId) return [];

  try {
    const response = await fetch(
      `${API_BASE}/api/token/redemptions?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch history');

    const data = await response.json();
    return z.array(RedeemRequestSchema).parse(data);
  } catch (error) {
    console.error('Error fetching redemption history:', error);
    return [];
  }
}

/**
 * Get status of a specific redemption
 * @param requestId Redemption request ID
 * @returns Redemption details
 */
export async function getRedemptionStatus(
  requestId: string
): Promise<RedeemRequest | null> {
  const userId = localStorage.getItem('user_id');
  if (!userId) return null;

  try {
    const response = await fetch(
      `${API_BASE}/api/token/redemptions/${requestId}`,
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to fetch redemption status');

    const data = await response.json();
    return RedeemRequestSchema.parse(data);
  } catch (error) {
    console.error('Error fetching redemption status:', error);
    return null;
  }
}

// ============================================================================
// 3. BALANCE & CONVERSIONS
// ============================================================================

/**
 * Get combined balance (off-chain LandCoins + on-chain $LAND)
 * @returns Total value in USD
 */
export async function getBalance(): Promise<{
  landcoins: number;
  land_wei: string;
  land: number;
  usd_value: number;
}> {
  const userId = localStorage.getItem('user_id');
  if (!userId) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE}/api/token/balance`, {
    headers: {
      'x-user-id': userId,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch balance');

  const data = await response.json();

  return z
    .object({
      landcoins: z.number(),
      land_wei: z.string(),
      land: z.number(),
      usd_value: z.number(),
    })
    .parse(data);
}

/**
 * Get conversion preview (what will you get?)
 * @param landcoinsAmount Amount to convert
 * @returns Expected $LAND amount
 */
export async function getConversionPreview(
  landcoinsAmount: number
): Promise<{
  landcoins_input: number;
  land_output: number;
  land_output_wei: string;
  usd_value: number;
  timestamp: string;
}> {
  const response = await fetch(
    `${API_BASE}/api/token/conversion-preview?amount=${landcoinsAmount}`
  );

  if (!response.ok) throw new Error('Failed to fetch conversion preview');

  const data = await response.json();

  return z
    .object({
      landcoins_input: z.number(),
      land_output: z.number(),
      land_output_wei: z.string(),
      usd_value: z.number(),
      timestamp: z.string(),
    })
    .parse(data);
}

// ============================================================================
// 4. TOKEN STATS & MARKET DATA
// ============================================================================

/**
 * Get global $LAND token stats
 * @returns Supply, price, holders, etc.
 */
export async function getTokenStats(): Promise<TokenStats> {
  const response = await fetch(`${API_BASE}/api/token/stats`);

  if (!response.ok) throw new Error('Failed to fetch token stats');

  const data = await response.json();
  return TokenStatsSchema.parse(data);
}

/**
 * Get token price (USD)
 * @returns Current price per $LAND
 */
export async function getTokenPrice(): Promise<number> {
  try {
    const stats = await getTokenStats();
    return stats.price_usd;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return 0;
  }
}

/**
 * Get price history (for charts)
 * @param days Number of days to fetch
 * @returns Array of price points
 */
export async function getPriceHistory(
  days: number = 30
): Promise<Array<{ timestamp: string; price_usd: number }>> {
  try {
    const response = await fetch(
      `${API_BASE}/api/token/price-history?days=${days}`
    );

    if (!response.ok) throw new Error('Failed to fetch price history');

    const data = await response.json();

    return z
      .array(
        z.object({
          timestamp: z.string(),
          price_usd: z.number(),
        })
      )
      .parse(data);
  } catch (error) {
    console.error('Error fetching price history:', error);
    return [];
  }
}

// ============================================================================
// 5. UTILITY FUNCTIONS
// ============================================================================

/**
 * Format $LAND token amount (wei → readable)
 * @param wei Amount in wei
 * @returns Formatted string (e.g., "1.23 $LAND")
 */
export function formatLand(wei: string | bigint): string {
  const weiNum = typeof wei === 'string' ? BigInt(wei) : wei;
  const land = Number(weiNum) / 1e18;
  return `${land.toFixed(6)} $LAND`;
}

/**
 * Format LandCoins (simple number)
 * @param amount Amount in LandCoins
 * @returns Formatted string (e.g., "100.50 LandCoins")
 */
export function formatLandcoins(amount: number): string {
  return `${amount.toFixed(2)} LandCoins`;
}

/**
 * Format USD value
 * @param value Amount in USD
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/**
 * Truncate wallet address for display
 * @param address Full address
 * @returns Truncated (e.g., "0x1234...5678")
 */
export function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ============================================================================
// Error Handling
// ============================================================================

export class TokenAPIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TokenAPIError';
  }
}
