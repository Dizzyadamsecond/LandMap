import { NextRequest, NextResponse } from 'next/server';

// Mock in-memory store (em produção, seria Postgres/Redis)
const userXP: Record<string, number> = {};
const userStreaks: Record<string, { current: number; lastActive: string }> = {};

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || 'default';
  const xp = userXP[userId] || 0;
  const streak = userStreaks[userId] || { current: 0, lastActive: new Date().toISOString() };

  return NextResponse.json({ xp, streak });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId = 'default', action = 'map_search', points = 10 } = body;

  // Adiciona XP
  userXP[userId] = (userXP[userId] || 0) + points;

  // Atualiza streak (simplificado)
  const today = new Date().toISOString().split('T')[0];
  const streak = userStreaks[userId] || { current: 0, lastActive: today };
  if (streak.lastActive === today) {
    streak.current += 1;
  } else {
    const lastDate = new Date(streak.lastActive);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak.current += 1;
    } else {
      streak.current = 1;
    }
  }
  streak.lastActive = today;
  userStreaks[userId] = streak;

  return NextResponse.json({
    xp: userXP[userId],
    streak,
    action,
    awarded: points,
  });
}
