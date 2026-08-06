import { cn } from '../lib';

export interface UserProgress {
  user_id: string;
  xp: number;
  level: number;
  tier: 'bronze' | 'silver' | 'gold' | 'sovereign';
  landcoins: number;
  metrics: Record<string, number>;
  streak: { current: number; best: number; lastActiveDate: string | null; freezes: number };
  badges: string[];
  updated_at: string;
}

export interface ProgressCardProps {
  progress: UserProgress | null;
  loading?: boolean;
  className?: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'from-orange-400 to-yellow-600',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-300 to-yellow-600',
  sovereign: 'from-indigo-400 to-purple-600',
};

export function ProgressCard({ progress, loading, className }: ProgressCardProps) {
  if (loading || !progress) {
    return <div className={cn('p-3 text-xs text-gray-500', className)}>Loading progress...</div>;
  }

  const xpForLevel = progress.level * 100;
  const xpProgress = (progress.xp % xpForLevel) / xpForLevel;
  const tierColor = TIER_COLORS[progress.tier] || TIER_COLORS.bronze;

  return (
    <div className={cn('p-3 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700', className)}>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-sm font-semibold text-white">Level {progress.level} • {progress.tier}</div>
          <div className="text-sm font-bold text-yellow-400">{progress.landcoins} 🪙</div>
        </div>

        <div className="w-full bg-slate-700 rounded-full h-1">
          <div
            className={cn('h-1 rounded-full transition-all bg-gradient-to-r', tierColor)}
            style={{ width: `${xpProgress * 100}%` }}
          />
        </div>

        <div className="text-xs text-gray-400">{progress.xp} XP</div>
      </div>
    </div>
  );
}
