import { useStore } from '../state/store';
import { PICK_LABELS } from '../lib/constants';
import { fmtKickoff, fmtOdds } from '../lib/format';
import type { Match, Pick } from '../types';

const PICKS: readonly Pick[] = ['home', 'draw', 'away'] as const;

function shortLabel(match: Match, pick: Pick): string {
  if (pick === 'draw') return 'Draw';
  const team = pick === 'home' ? match.home : match.away;
  return team.split(' ')[0];
}

export function MatchCard({ match }: { match: Match }) {
  const { state, dispatch } = useStore();
  const selection = state.selections.get(match.id);

  return (
    <article className="match-card" data-match-id={match.id}>
      <div className="match-meta">
        <span className="league-tag">{match.league}</span>
        {match.live ? (
          <span className="live-tag">
            <span className="live-dot" /> LIVE
          </span>
        ) : (
          <span>{fmtKickoff(match.kickoff)}</span>
        )}
      </div>

      <div className="teams">
        <div className="team-row">
          <span>{match.home}</span>
          <span className="team-hint">Home</span>
        </div>
        <div className="team-row">
          <span>{match.away}</span>
          <span className="team-hint">Away</span>
        </div>
      </div>

      <div className="odds-row">
        {PICKS.map(pick => {
          const curr = match.odds[pick];
          const prev = match.prevOdds[pick];
          const dir = curr > prev ? 'odds-up' : curr < prev ? 'odds-down' : '';
          const selected = selection?.pick === pick ? 'selected' : '';
          const flash = match.oddsVersion > 0 ? 'flash' : '';
          return (
            <button
              key={`${pick}-${match.oddsVersion}`}
              className={`odds-btn ${dir} ${selected} ${flash}`.trim()}
              onClick={() => dispatch({ type: 'TOGGLE_SELECTION', matchId: match.id, pick })}
            >
              <span className="odds-label">
                {PICK_LABELS[pick]} {shortLabel(match, pick)}
              </span>
              <span className="odds-value">{fmtOdds(curr)}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
