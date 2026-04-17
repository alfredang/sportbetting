import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import type { State } from '../state/store';
import { useToast } from '../state/ToastProvider';
import { SETTLE_DELAY_MS, SETTLE_INTERVAL_MS, WIN_RATE } from '../lib/constants';
import { fmtMoney } from '../lib/format';

export function useSettlement() {
  const { state, dispatch } = useStore();
  const showToast = useToast();
  const stateRef = useRef<State>(state);
  stateRef.current = state;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const results: Array<{ id: string; won: boolean; payout: number }> = [];
      for (const bet of stateRef.current.history) {
        if (bet.status !== 'pending') continue;
        if (now - Date.parse(bet.placedAt) < SETTLE_DELAY_MS) continue;
        results.push({ id: bet.id, won: Math.random() < WIN_RATE, payout: bet.payout });
      }
      if (!results.length) return;
      dispatch({
        type: 'SETTLE_BETS',
        results: results.map(r => ({ id: r.id, won: r.won }))
      });
      for (const r of results) {
        if (r.won) showToast(`Bet won! +${fmtMoney(r.payout)}`);
      }
    };

    tick();
    const interval = setInterval(tick, SETTLE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch, showToast]);
}
