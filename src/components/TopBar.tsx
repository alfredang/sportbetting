import { useStore } from '../state/store';
import { fmtMoney } from '../lib/format';
import type { View } from '../types';

const TABS: Array<{ view: View; label: string; live?: boolean }> = [
  { view: 'matches', label: 'Upcoming' },
  { view: 'live', label: 'Live', live: true },
  { view: 'dashboard', label: 'Dashboard' }
];

export function TopBar() {
  const { state, dispatch } = useStore();

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">⚽</span>
        <span className="brand-name">GoalLine</span>
      </div>
      <nav className="tabs">
        {TABS.map(t => (
          <button
            key={t.view}
            className={`tab ${state.activeView === t.view ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW', view: t.view })}
          >
            {t.live && <span className="live-dot" />} {t.label}
          </button>
        ))}
      </nav>
      <button
        className="theme-toggle"
        onClick={() =>
          dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })
        }
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <span className="icon-sun" aria-hidden="true">☀️</span>
        <span className="icon-moon" aria-hidden="true">🌙</span>
      </button>
      <div className="balance-pill">
        <span className="balance-label">Balance</span>
        <span className="balance-value">{fmtMoney(state.balance)}</span>
      </div>
    </header>
  );
}
