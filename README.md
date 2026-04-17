# GoalLine

A client-side football betting simulator that runs on play money. Place pre-match and live 1X2 bets, watch odds tick in real time, and track your P&L on a dashboard — all in the browser, no backend.

**Live demo:** https://alfredang.github.io/sportbetting/

## Features

- **1X2 markets** on a grid of matches (home / draw / away).
- **Live odds** that nudge every 3 seconds on matches flagged as live, with up/down flash animations.
- **Single-leg bet slip** — one selection per match, stake in play money.
- **Auto-settlement** of pending bets after ~10 seconds at a flat win rate.
- **Dashboard** with balance history, win/loss stats, and a full bet log.
- **Light/dark theme** with persistence.
- **Local persistence** — balance, history, and theme survive reloads via `localStorage`.

## Tech stack

- React 19 + TypeScript (strict mode)
- Vite 7
- `useReducer` + Context for global state — no external state library
- Plain global CSS with CSS variables for theming
- GitHub Pages for deployment

## Getting started

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (typically http://localhost:5173).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR. |
| `npm run build` | Type-check (`tsc -b`) and build the production bundle into `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run typecheck` | Type-check without emitting. |

## Project structure

```
src/
  components/   UI — TopBar, MatchGrid, MatchCard, BetSlip, Dashboard
  hooks/        useLiveOdds, useSettlement — setInterval-driven loops
  lib/          constants (tick rates, win rate, storage keys)
  state/        store.tsx (reducer + Context), ToastProvider
  styles.css    global styles + theme variables
  main.tsx      entry point
```

## How it works

Global state lives in a single reducer (`src/state/store.tsx`) holding matches, selections, balance, history, view, and theme. Two interval-driven hooks dispatch into it:

- **`useLiveOdds`** — every 3s, picks a random live match and nudges its three odds, clamped to `[1.05, 15]`. Any open slip selection for that match is updated to stay in sync.
- **`useSettlement`** — every 4s, settles pending bets older than 10s at a 35% win rate. Winners get credited and trigger a toast.

Both hooks use a `stateRef` pattern so the interval sees the latest state without being torn down on every dispatch.

All tunables (tick intervals, settlement delay, win rate, default balance) live in [src/lib/constants.ts](src/lib/constants.ts).

## Deployment

Pushes to `main` trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which runs `npm ci && npm run build` and uploads `dist/` to GitHub Pages. The site is served from a repo sub-path, so `vite.config.ts` sets `base: '/sportbetting/'`.

## Disclaimer

This is a simulator for fun and learning. It uses play money only — no real wagers, no real payouts, no gambling license.
