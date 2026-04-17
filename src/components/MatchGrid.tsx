import { useStore } from '../state/store';
import { MatchCard } from './MatchCard';

export function MatchGrid({ live }: { live: boolean }) {
  const { state } = useStore();
  const matches = state.matches.filter(m => m.live === live);

  if (live && !matches.length) {
    return (
      <div className="match-grid">
        <p className="history-empty">No live matches right now.</p>
      </div>
    );
  }

  return (
    <div className="match-grid">
      {matches.map(m => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
