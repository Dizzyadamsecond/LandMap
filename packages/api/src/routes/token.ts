import { Hono } from 'hono';
import { z } from 'zod';

export function createTokenRouter() {
  const router = new Hono();

  router.post('/wallet/link', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);

    try {
      const { wallet_address, signature, message, chain } = await c.req.json() as any;
      // TODO: verify signature via ethers/viem
      // TODO: insert into token_wallets table
      return c.json({ ok: true, wallet_address, verified_at: new Date().toISOString() });
    } catch (e) {
      return c.json({ error: 'invalid signature' }, 400);
    }
  });

  router.post('/redeem', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);

    try {
      const { landcoins_amount, chain } = await c.req.json() as any;
      // TODO: validate landcoins balance, get wallet, call bridge.redeemLandcoins()
      // TODO: insert into token_mint_requests table
      return c.json({ ok: true, request_id: `mint_${Date.now()}`, status: 'pending' });
    } catch (e) {
      return c.json({ error: 'redeem failed' }, 400);
    }
  });

  router.get('/balance', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);

    // TODO: fetch UserProgress.landcoins + on-chain token balance
    return c.json({
      user_id: userId,
      landcoins_off_chain: 0,
      tokens_on_chain: '0',
      chain: 'sepolia',
    });
  });

  router.get('/mint-requests/:id', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);

    const requestId = c.req.param('id');
    // TODO: fetch from token_mint_requests, validate ownership
    return c.json({ request_id: requestId, status: 'pending' });
  });

  return router;
}
