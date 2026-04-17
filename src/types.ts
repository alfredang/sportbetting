export type Pick = 'home' | 'draw' | 'away';
export type View = 'matches' | 'live' | 'dashboard';
export type Theme = 'dark' | 'light';
export type BetStatus = 'pending' | 'won' | 'lost';
export type ToastKind = 'info' | 'error';

export interface Odds {
  home: number;
  draw: number;
  away: number;
}

export interface Match {
  id: string;
  league: string;
  home: string;
  away: string;
  kickoff: string;
  live: boolean;
  odds: Odds;
  prevOdds: Odds;
  oddsVersion: number;
}

export interface Selection {
  matchId: string;
  pick: Pick;
  odds: number;
  label: string;
}

export interface BetLeg {
  matchId: string;
  pick: Pick;
  odds: number;
  label: string;
  match: string;
}

export interface Bet {
  id: string;
  placedAt: string;
  settledAt?: string;
  stake: number;
  totalOdds: number;
  payout: number;
  legs: BetLeg[];
  status: BetStatus;
}
