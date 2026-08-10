'use client';

import { useEffect, useState } from 'react';
import { Card } from '@landmap/ui';

interface CostItem {
  category: string;
  description: string;
  amount: number;
  currency: 'USD' | 'BRL';
  monthly: boolean;
  created_at: string;
}

export default function CostsPage() {
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ usd: 0, brl: 0 });

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const res = await fetch('/api/admin/costs', {
          headers: { 'x-admin-token': localStorage.getItem('admin_token') || '' }
        });
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setCosts(data.costs);
        setTotals({ usd: data.monthly_usd, brl: data.monthly_brl });
      } catch (e) {
        console.error('Failed to fetch costs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCosts();
  }, []);

  const groupedByCat = costs.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, CostItem[]>);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Project Costs</h1>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <Card className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Monthly (USD)</div>
                <div className="text-2xl font-bold">${totals.usd.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Monthly (BRL)</div>
                <div className="text-2xl font-bold">R$ {totals.brl.toFixed(2)}</div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {Object.entries(groupedByCat).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-3">{category}</h2>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <Card key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{item.description}</div>
                        <div className="text-xs text-gray-500">
                          {item.monthly ? 'Monthly' : 'One-time'} · {item.created_at}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {item.currency === 'USD' ? '$' : 'R$ '}{item.amount.toFixed(2)}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
