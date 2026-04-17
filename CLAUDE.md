# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

GoalLine is a client-side football betting simulator (play money). The runtime is **React 19 + TypeScript + Vite**, deployed as a static bundle to GitHub Pages.

Live site: https://alfredang.github.io/sportbetting/

## Commands

- `npm install` — first-time setup.
- `npm run dev` — Vite dev server with HMR.
- `npm run build` — type-check (`tsc -b`) then produce `dist/`.
- `npm run preview` — serve the production build locally.
- `npm run typecheck` — type-check without emitting.

No test runner or linter is configured.

## Deployment

`.github/workflows/deploy.yml` runs on push to `main`: `npm ci && npm run build`, then uploads `./dist` to GitHub Pages. `vite.config.ts` sets `base: '/sportbetting/'` because the site is served from a repo sub-path — leave that in place unless the Pages URL changes.

## Architecture

Single-page React app. One Vite entry (`index.html` → `src/main.tsx`) mounts `<StoreProvider>` → `<ToastProvider>` → `<App />`.

### State

Global state lives in `src/state/store.tsx` (`useReducer` + Context, exposed via `useStore()`). The shape is one flat object: `matches`, `selections` (Map keyed by matchId — only one leg per match), `balance`, `history`, `activeView`, `theme`. All mutations go through a single `reducer` with typed `Action`s. Persistence to `localStorage` (`sb.balance`, `sb.history`, `sb.theme`) is handled by `useEffect`s inside `StoreProvider`; the reducer itself is side-effect-free.

Toasts are a separate context (`src/state/ToastProvider.tsx`) exposing `useToast()`. Keep them out of the main reducer — they're ephemeral UI.

### Side-effect loops

Two hooks kick off `setInterval`s from `App.tsx` and dispatch into the store:

- `src/hooks/useLiveOdds.ts` — every `LIVE_TICK_MS` (3s), nudges all three odds on one random `live: true` match, clamped to `[1.05, 15]`. Reducer bumps `oddsVersion` and snapshots previous odds into `prevOdds`; any selection for that match has its `odds` updated so the slip stays in sync.
- `src/hooks/useSettlement.ts` — every `SETTLE_INTERVAL_MS` (4s), resolves pending bets older than `SETTLE_DELAY_MS` (10s) at a flat `WIN_RATE` of 0.35. Winning bets credit balance and fire a toast. All tunables live in `src/lib/constants.ts`.

Both hooks use a `stateRef` pattern (`stateRef.current = state` on every render) so the interval callback always sees the latest state without re-creating the timer on every dispatch.

### Component tree

- `TopBar` — tabs, theme toggle, balance pill. Dispatches `SET_VIEW` / `SET_THEME`.
- `MatchGrid` — filters matches by `live` flag; renders `MatchCard`s.
- `MatchCard` — one card with three odds buttons. The flash animation on odds changes is retriggered by keying each button on `${pick}-${oddsVersion}`, which forces React to remount the button so the CSS animation replays. `prevOdds` vs `odds` drives the `odds-up`/`odds-down` arrow class.
- `BetSlip` — local `useState` for stake input and mobile open/close. Reads selections from the store.
- `Dashboard` — stats + history table, derived entirely from `state.history`.

### Styling

All styles are global in `src/styles.css`, imported once from `src/main.tsx`. Theming is a `data-theme` attribute on `<html>` (set by the persistence effect in `StoreProvider`) driving CSS variables. Don't convert to CSS modules without a reason — the existing class names are referenced directly across components.

## Conventions

- TypeScript strict mode is on with `verbatimModuleSyntax` and `erasableSyntaxOnly` — use `import type` for type-only imports.
- Action types are a discriminated union in `src/state/store.tsx`; add new mutations there rather than reaching into state from components.
- When adding a new side-effect loop, follow the `stateRef` pattern in the existing hooks so the interval isn't torn down on every state change.
