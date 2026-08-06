import { Hono } from 'hono';

export function createGamificationRouter() {
  const router = new Hono();

  router.get('/progress/:userId', async (c) => {
    const userId = c.req.param('userId');
    if (!userId) return c.json({ error: 'missing userId' }, 400);

    // TODO: fetch from DB user_progress table
    const mockProgress = {
      user_id: userId,
      xp: 1250,
      level: 3,
      tier: 'silver',
      landcoins: 45,
      metrics: {
        searches: 120,
        favoritesSaved: 18,
        comparisonsMade: 12,
        agentCycles: 5,
        neighborhoodsExplored: 8,
        referrals: 2,
        dealsClosed: 1,
      },
      streak: { current: 7, best: 14, lastActiveDate: new Date().toISOString().split('T')[0], freezes: 2 },
      badges: ['early_adopter', 'neighborhood_master'],
      updated_at: new Date().toISOString(),
    };

    return c.json(mockProgress);
  });

  router.post('/event', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);

    try {
      const { type, amount } = await c.req.json() as any;

      // TODO: call gamification engine applyEvent()
      // TODO: persist to user_progress + coin_ledger

      return c.json({
        ok: true,
        event_type: type,
        xp_awarded: 50,
        landcoins_earned: 2,
        new_level: null,
      });
    } catch (e) {
      return c.json({ error: 'invalid event' }, 400);
    }
  });

  router.get('/leaderboard', async (c) => {
    const scope = c.req.query('scope') || 'global';
    const city = c.req.query('city');

    // TODO: fetch from user_progress, order by xp, limit 100
    return c.json({
      scope,
      city,
      entries: [
        { userId: 'user_1', displayName: 'João Silva', xp: 5000, level: 8, tier: 'gold', rank: 1 },
        { userId: 'user_2', displayName: 'Maria Santos', xp: 4800, level: 8, tier: 'gold', rank: 2 },
      ],
    });
  });

  router.get('/badges', async (c) => {
    const userId = c.req.header('x-user-id');
    if (!userId) return c.json({ error: 'unauthorized' }, 401);

    // TODO: fetch earned badges from user_progress.badges array
    return c.json({
      user_id: userId,
      earned: ['early_adopter', 'neighborhood_master'],
      progress: [
        { badge_id: 'deal_closer', name: 'Deal Closer', progress: 1, required: 5 },
        { badge_id: 'investor_sovereign', name: 'Investor Sovereign', progress: 0, required: 10 },
      ],
    });
  });

  return router;
}
