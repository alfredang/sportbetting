# GoalLine

A client-side football betting simulator that runs entirely in the browser. Place play-money bets on a fixed slate of matches, watch live odds drift on a 3-second tick, and have wagers settled automatically against a flat win-rate. State is persisted to `localStorage`, so balance and history survive a refresh.

Live demo: https://alfredang.github.io/sportbetting/

## Features

- Pre-match and live markets with one-leg-per-match selection rules.
- Live odds simulation: prices nudge every 3s on randomly chosen live matches, with up/down flash animation driven by a versioned reducer.
- Bet settlement loop: pending bets older than 10s resolve at a flat 35% win rate; winners credit balance and trigger a toast.
- Persistent balance, bet history, and theme via `localStorage`.
- Light/dark theme toggle backed by a `data-theme` attribute and CSS variables.
- Dashboard view with running stats derived from history.

## Tech stack

- React 19 + TypeScript (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`).
- Vite 7 for dev server and production bundling.
- `useReducer` + Context for global state — no external state library.
- Plain global CSS, no UI framework.

## Getting started

```bash
npm install      # first-time setup
npm run dev      # Vite dev server with HMR
npm run build    # type-check then produce dist/
npm run preview  # serve the production build locally
npm run typecheck
```

No test runner or linter is configured.

## Project structure

```
src/
  main.tsx              entry: StoreProvider -> ToastProvider -> App
  App.tsx               wires hooks and renders the active view
  styles.css            global stylesheet (theme via data-theme)
  data.ts               static match fixtures
  types.ts              shared types
  components/
    TopBar.tsx          tabs, theme toggle, balance pill
    MatchGrid.tsx       filters and renders match cards
    MatchCard.tsx       three odds buttons + flash animation
    BetSlip.tsx         stake input and slip management
    Dashboard.tsx       stats and history table
  hooks/
    useLiveOdds.ts      3s odds-drift loop
    useSettlement.ts    4s settlement loop, 10s settle delay
  state/
    store.tsx           reducer, Context, localStorage persistence
    ToastProvider.tsx   ephemeral toast context
  lib/
    constants.ts        tick intervals, win rate, odds bounds
    format.ts           formatting helpers
```

## Architecture notes

- One flat state object (`matches`, `selections`, `balance`, `history`, `activeView`, `theme`) mutated via a typed discriminated-union reducer.
- Side-effect loops use a `stateRef` pattern so `setInterval` callbacks see the latest state without tearing down the timer on every dispatch.
- Odds-flash animation re-triggers by keying each odds button on `${pick}-${oddsVersion}`, forcing a remount so the CSS animation replays.
- Toasts are kept out of the main reducer to avoid mixing ephemeral UI with persisted state.

## Deployment

`.github/workflows/deploy.yml` runs on push to `main`: it executes `npm ci && npm run build` and uploads `./dist` to GitHub Pages. `vite.config.ts` sets `base: '/sportbetting/'` because the site is served from a repo sub-path — keep that value in sync with the Pages URL.
