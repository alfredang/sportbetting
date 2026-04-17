import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import type { State } from '../state/store';
import { LIVE_TICK_MS } from '../lib/constants';

function nudge(v: number): number {
  const delta = (Math.random() - 0.5) * 0.12;
  let next = +(v + delta).toFixed(2);
  if (next < 1.05) next = 1.05;
  if (next > 15) next = 15;
  return next;
}

export function useLiveOdds() {
  const { state, dispatch } = useStore();
  const stateRef = useRef<State>(state);
  stateRef.current = state;

  useEffect(() => {
    const interval = setInterval(() => {
      const live = stateRef.current.matches.filter(m => m.live);
      if (!live.length) return;
      const match = live[Math.floor(Math.random() * live.length)];
      dispatch({
        type: 'UPDATE_ODDS',
        matchId: match.id,
        odds: {
          home: nudge(match.odds.home),
          draw: nudge(match.odds.draw),
          away: nudge(match.odds.away)
        }
      });
    }, LIVE_TICK_MS);
    return () => clearInterval(interval);
  }, [dispatch]);
}
