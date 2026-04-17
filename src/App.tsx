import { useStore } from './state/store';
import { useLiveOdds } from './hooks/useLiveOdds';
import { useSettlement } from './hooks/useSettlement';
import { TopBar } from './components/TopBar';
import { MatchGrid } from './components/MatchGrid';
import { BetSlip } from './components/BetSlip';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const { state } = useStore();
  useLiveOdds();
  useSettlement();

  const cls = (view: string) => `view ${state.activeView === view ? 'active' : ''}`.trim();

  return (
    <>
      <TopBar />
      <div className="layout">
        <main className="content">
          <section className={cls('matches')}>
            <div className="view-header">
              <h2>Upcoming Matches</h2>
              <p className="view-sub">Pick your winners and build a slip</p>
            </div>
            <MatchGrid live={false} />
          </section>

          <section className={cls('live')}>
            <div className="view-header">
              <h2>
                <span className="live-dot" /> Live Now
              </h2>
              <p className="view-sub">Odds flicker in real time</p>
            </div>
            <MatchGrid live={true} />
          </section>

          <section className={cls('dashboard')}>
            <div className="view-header">
              <h2>Dashboard</h2>
              <p className="view-sub">Your account and betting history</p>
            </div>
            <Dashboard />
          </section>
        </main>

        <BetSlip />
      </div>
    </>
  );
}
