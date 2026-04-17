import type { Match } from './types';

type MatchSeed = Omit<Match, 'prevOdds' | 'oddsVersion'>;

const SEED: MatchSeed[] = [
  { id: 'm1', league: 'Premier League', home: 'Manchester United', away: 'Chelsea', kickoff: '2026-04-18T19:30', live: false, odds: { home: 2.1, draw: 3.4, away: 3.0 } },
  { id: 'm2', league: 'Premier League', home: 'Arsenal', away: 'Liverpool', kickoff: '2026-04-18T17:00', live: false, odds: { home: 2.45, draw: 3.5, away: 2.7 } },
  { id: 'm3', league: 'La Liga', home: 'Real Madrid', away: 'Barcelona', kickoff: '2026-04-19T20:00', live: false, odds: { home: 2.05, draw: 3.8, away: 3.25 } },
  { id: 'm4', league: 'La Liga', home: 'Atletico Madrid', away: 'Sevilla', kickoff: '2026-04-19T15:30', live: false, odds: { home: 1.65, draw: 3.9, away: 4.8 } },
  { id: 'm5', league: 'Serie A', home: 'Inter Milan', away: 'Juventus', kickoff: '2026-04-20T19:45', live: false, odds: { home: 2.2, draw: 3.3, away: 3.1 } },
  { id: 'm6', league: 'Bundesliga', home: 'Bayern Munich', away: 'Borussia Dortmund', kickoff: '2026-04-18T16:30', live: false, odds: { home: 1.75, draw: 4.1, away: 4.2 } },
  { id: 'm7', league: 'Champions League', home: 'Manchester City', away: 'PSG', kickoff: '2026-04-21T20:00', live: true, odds: { home: 1.95, draw: 3.6, away: 3.75 } },
  { id: 'm8', league: 'Champions League', home: 'Bayern Munich', away: 'Real Madrid', kickoff: '2026-04-22T20:00', live: true, odds: { home: 2.6, draw: 3.4, away: 2.55 } },
  { id: 'm9', league: 'Premier League', home: 'Tottenham', away: 'Newcastle', kickoff: '2026-04-19T14:00', live: true, odds: { home: 2.3, draw: 3.5, away: 2.9 } },
  { id: 'm10', league: 'Ligue 1', home: 'PSG', away: 'Marseille', kickoff: '2026-04-20T20:45', live: false, odds: { home: 1.55, draw: 4.3, away: 5.5 } }
];

export const INITIAL_MATCHES: Match[] = SEED.map(m => ({
  ...m,
  odds: { ...m.odds },
  prevOdds: { ...m.odds },
  oddsVersion: 0
}));
