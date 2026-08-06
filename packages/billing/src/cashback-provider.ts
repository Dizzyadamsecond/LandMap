export interface CashbackProvider {
  getBalance(userId: string): Promise<{ cents: number; pendingCents: number }>;
  redeem(userId: string, amountCents: number, meta: any): Promise<{ id: string; status: 'pending' | 'confirmed' }>;
}

export class BillingCashbackProvider implements CashbackProvider {
  constructor(private dbClient: any) {} // TODO: inject actual DB client

  async getBalance(userId: string): Promise<{ cents: number; pendingCents: number }> {
    // TODO: query cashback_txns table
    // SELECT SUM(amount_cents) WHERE status='confirmed' AS cents
    // SELECT SUM(amount_cents) WHERE status='pending' AS pendingCents
    return {
      cents: 0,
      pendingCents: 0,
    };
  }

  async redeem(
    userId: string,
    amountCents: number,
    meta: any,
  ): Promise<{ id: string; status: 'pending' | 'confirmed' }> {
    // TODO: insert into cashback_txns
    // INSERT INTO cashback_txns (user_id, kind, amount_cents, status)
    // VALUES (userId, 'redeem_to_cashback', amountCents, 'pending')

    return {
      id: `cashback_${Date.now()}`,
      status: 'pending',
    };
  }
}

export function createCashbackProvider(dbClient: any): CashbackProvider {
  return new BillingCashbackProvider(dbClient);
}
