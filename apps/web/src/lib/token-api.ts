'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface WalletLinkInput {
  wallet_address: string;
  signature: string;
  message: string;
  chain: 'sepolia' | 'base';
}

export interface RedeemInput {
  landcoins_amount: number;
  chain: 'sepolia' | 'base';
}

export async function linkWallet(input: WalletLinkInput): Promise<{ ok: boolean; wallet_address: string }> {
  const res = await fetch(`${API_BASE}/token/wallet/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('user_id') || 'guest' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to link wallet');
  return res.json();
}

export async function redeemLandcoins(input: RedeemInput): Promise<{ ok: boolean; request_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/token/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': localStorage.getItem('user_id') || 'guest' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to redeem');
  return res.json();
}

export async function getTokenBalance(): Promise<{ landcoins_off_chain: number; tokens_on_chain: string; chain: string }> {
  const res = await fetch(`${API_BASE}/token/balance`, {
    headers: { 'x-user-id': localStorage.getItem('user_id') || 'guest' },
  });
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}

export async function getMintRequestStatus(requestId: string): Promise<{ request_id: string; status: string; tx_hash?: string }> {
  const res = await fetch(`${API_BASE}/token/mint-requests/${requestId}`, {
    headers: { 'x-user-id': localStorage.getItem('user_id') || 'guest' },
  });
  if (!res.ok) throw new Error('Failed to fetch request');
  return res.json();
}
