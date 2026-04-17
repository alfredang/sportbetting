import type { Match, Pick } from '../types';

export const fmtMoney = (n: number) => `$${n.toFixed(2)}`;
export const fmtOdds = (n: number) => n.toFixed(2);

export const fmtKickoff = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const fmtHistoryTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const uid = () => 'b_' + Math.random().toString(36).slice(2, 10);

export const pickLabel = (match: Match, pick: Pick): string => {
  if (pick === 'home') return `${match.home} to win`;
  if (pick === 'away') return `${match.away} to win`;
  return 'Draw';
};
