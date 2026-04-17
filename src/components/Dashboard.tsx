import { useStore } from '../state/store';
import { fmtHistoryTime, fmtMoney, fmtOdds } from '../lib/format';

export function Dashboard() {
  const { state } = useStore();
  const history = state.history;

  const total = history.length;
  const won = history.filter(b => b.status === 'won').length;
  const pending = history.filter(b => b.status === 'pending').length;
  const settled = history.filter(b => b.status !== 'pending');
  const winRate = settled.length ? (won / settled.length) * 100 : 0;
  const returned = history
    .filter(b => b.status === 'won')
    .reduce((a, b) => a + b.payout, 0);
  const settledStake = settled.reduce((a, b) => a + b.stake, 0);
  const netRealized = returned - settledStake;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Balance</div>
          <div className="stat-value accent">{fmtMoney(state.balance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bets Placed</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{winRate.toFixed(0)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net P/L (settled)</div>
          <div className={`stat-value ${netRealized >= 0 ? 'accent' : 'danger'}`}>
            {netRealized >= 0 ? '+' : ''}
            {fmtMoney(netRealized)}
          </div>
        </div>
      </div>

      <div className="history-card">
        <h3>Bet History</h3>
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Placed</th>
                <th>Legs</th>
                <th>Odds</th>
                <th>Stake</th>
                <th>Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!history.length ? (
                <tr>
                  <td colSpan={6} className="history-empty">
                    No bets placed yet.
                  </td>
                </tr>
              ) : (
                history.map(bet => (
                  <tr key={bet.id}>
                    <td>{fmtHistoryTime(bet.placedAt)}</td>
                    <td>
                      {bet.legs.map((l, i) => (
                        <div key={`${bet.id}-leg-${i}`}>
                          <span style={{ color: 'var(--text-dim)' }}>{l.match}</span> — {l.label} @{' '}
                          {fmtOdds(l.odds)}
                        </div>
                      ))}
                    </td>
                    <td>{fmtOdds(bet.totalOdds)}</td>
                    <td>{fmtMoney(bet.stake)}</td>
                    <td>{fmtMoney(bet.payout)}</td>
                    <td>
                      <span className={`status-chip status-${bet.status}`}>{bet.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
