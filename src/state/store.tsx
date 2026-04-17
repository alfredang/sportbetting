import { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode, Dispatch } from 'react';
import type { Bet, Match, Odds, Pick, Selection, Theme, View } from '../types';
import { INITIAL_MATCHES } from '../data';
import { DEFAULT_BALANCE, LS_BAL, LS_HIST, LS_THEME } from '../lib/constants';
import { pickLabel, uid } from '../lib/format';

export interface State {
  matches: Match[];
  selections: Map<string, Selection>;
  balance: number;
  history: Bet[];
  activeView: View;
  theme: Theme;
}

export type Action =
  | { type: 'TOGGLE_SELECTION'; matchId: string; pick: Pick }
  | { type: 'REMOVE_SELECTION'; matchId: string }
  | { type: 'CLEAR_SLIP' }
  | { type: 'UPDATE_ODDS'; matchId: string; odds: Odds }
  | { type: 'PLACE_BET'; stake: number }
  | { type: 'SETTLE_BETS'; results: Array<{ id: string; won: boolean }> }
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SET_THEME'; theme: Theme };

function loadInitial(): State {
  const savedBal = parseFloat(localStorage.getItem(LS_BAL) ?? '');
  let history: Bet[] = [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LS_HIST) ?? '[]');
    if (Array.isArray(parsed)) history = parsed as Bet[];
  } catch {
    history = [];
  }
  const savedTheme = localStorage.getItem(LS_THEME) as Theme | null;
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false;
  const theme: Theme = savedTheme ?? (prefersLight ? 'light' : 'dark');

  return {
    matches: INITIAL_MATCHES.map(m => ({
      ...m,
      odds: { ...m.odds },
      prevOdds: { ...m.odds }
    })),
    selections: new Map(),
    balance: Number.isFinite(savedBal) ? savedBal : DEFAULT_BALANCE,
    history,
    activeView: 'matches',
    theme
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_SELECTION': {
      const match = state.matches.find(m => m.id === action.matchId);
      if (!match) return state;
      const next = new Map(state.selections);
      const existing = next.get(action.matchId);
      if (existing && existing.pick === action.pick) {
        next.delete(action.matchId);
      } else {
        next.set(action.matchId, {
          matchId: action.matchId,
          pick: action.pick,
          odds: match.odds[action.pick],
          label: pickLabel(match, action.pick)
        });
      }
      return { ...state, selections: next };
    }

    case 'REMOVE_SELECTION': {
      if (!state.selections.has(action.matchId)) return state;
      const next = new Map(state.selections);
      next.delete(action.matchId);
      return { ...state, selections: next };
    }

    case 'CLEAR_SLIP': {
      if (!state.selections.size) return state;
      return { ...state, selections: new Map() };
    }

    case 'UPDATE_ODDS': {
      const matches = state.matches.map(m =>
        m.id === action.matchId
          ? {
              ...m,
              prevOdds: m.odds,
              odds: action.odds,
              oddsVersion: m.oddsVersion + 1
            }
          : m
      );
      const existing = state.selections.get(action.matchId);
      let selections = state.selections;
      if (existing) {
        selections = new Map(state.selections);
        selections.set(action.matchId, { ...existing, odds: action.odds[existing.pick] });
      }
      return { ...state, matches, selections };
    }

    case 'PLACE_BET': {
      const stake = action.stake;
      if (!state.selections.size || !(stake > 0) || stake > state.balance) return state;

      const legs = Array.from(state.selections.values()).map(sel => {
        const match = state.matches.find(m => m.id === sel.matchId);
        const vs = match ? `${match.home} vs ${match.away}` : '';
        return {
          matchId: sel.matchId,
          pick: sel.pick,
          odds: sel.odds,
          label: sel.label,
          match: vs
        };
      });
      const totalOdds = legs.reduce((acc, l) => acc * l.odds, 1);
      const bet: Bet = {
        id: uid(),
        placedAt: new Date().toISOString(),
        stake,
        totalOdds,
        payout: +(stake * totalOdds).toFixed(2),
        legs,
        status: 'pending'
      };
      return {
        ...state,
        selections: new Map(),
        balance: state.balance - stake,
        history: [bet, ...state.history]
      };
    }

    case 'SETTLE_BETS': {
      if (!action.results.length) return state;
      const resultMap = new Map(action.results.map(r => [r.id, r.won]));
      let gain = 0;
      const now = new Date().toISOString();
      const history = state.history.map(bet => {
        if (!resultMap.has(bet.id)) return bet;
        const won = resultMap.get(bet.id)!;
        if (won) gain += bet.payout;
        return { ...bet, status: won ? 'won' : 'lost', settledAt: now } as Bet;
      });
      return { ...state, history, balance: state.balance + gain };
    }

    case 'SET_VIEW':
      return state.activeView === action.view ? state : { ...state, activeView: action.view };

    case 'SET_THEME':
      return state.theme === action.theme ? state : { ...state, theme: action.theme };
  }
}

interface StoreValue {
  state: State;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    localStorage.setItem(LS_BAL, String(state.balance));
  }, [state.balance]);

  useEffect(() => {
    localStorage.setItem(LS_HIST, JSON.stringify(state.history));
  }, [state.history]);

  useEffect(() => {
    localStorage.setItem(LS_THEME, state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
