import type { Pick } from '../types';

export const LS_BAL = 'sb.balance';
export const LS_HIST = 'sb.history';
export const LS_THEME = 'sb.theme';

export const DEFAULT_BALANCE = 1000;
export const SETTLE_DELAY_MS = 10_000;
export const SETTLE_INTERVAL_MS = 4_000;
export const LIVE_TICK_MS = 3_000;
export const TOAST_MS = 2_400;
export const WIN_RATE = 0.35;

export const PICK_LABELS: Record<Pick, string> = { home: '1', draw: 'X', away: '2' };
