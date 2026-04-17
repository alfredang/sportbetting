import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { useToast } from '../state/ToastProvider';
import { fmtMoney, fmtOdds } from '../lib/format';

export function BetSlip() {
  const { state, dispatch } = useStore();
  const showToast = useToast();
  const [stake, setStake] = useState('');
  const [open, setOpen] = useState(false);

  const selections = useMemo(() => Array.from(state.selections.values()), [state.selections]);
  const matchMap = useMemo(
    () => new Map(state.matches.map(m => [m.id, m])),
    [state.matches]
  );

  const totalOdds = selections.length
    ? selections.reduce((acc, s) => acc * s.odds, 1)
    : 0;

  const stakeNum = parseFloat(stake);
  const validStake = Number.isFinite(stakeNum) && stakeNum > 0 ? stakeNum : 0;
  const payout = totalOdds && validStake ? validStake * totalOdds : 0;
  const overBalance = Number.isFinite(stakeNum) && stakeNum > state.balance;
  const canPlace = selections.length > 0 && validStake > 0 && !overBalance;
  const err = overBalance ? 'Stake exceeds balance' : '';

  const place = () => {
    if (!selections.length) {
      showToast('Add a selection first', 'error');
      return;
    }
    if (!(validStake > 0)) {
      showToast('Enter a valid stake', 'error');
      return;
    }
    if (validStake > state.balance) {
      showToast('Insufficient balance', 'error');
      return;
    }
    const legs = selections.length;
    dispatch({ type: 'PLACE_BET', stake: validStake });
    setStake('');
    showToast(`Bet placed — ${legs} leg${legs > 1 ? 's' : ''} @ ${fmtOdds(totalOdds)}`);
  };

  return (
    <>
      <aside className={`bet-slip ${open ? 'open' : ''}`.trim()}>
        <div className="slip-header">
          <h3>
            Bet Slip <span className="slip-count">{selections.length}</span>
          </h3>
          <button
            className="slip-clear"
            onClick={() => dispatch({ type: 'CLEAR_SLIP' })}
            title="Clear slip"
          >
            Clear
          </button>
        </div>

        <div className="slip-body">
          {!selections.length ? (
            <p className="slip-empty">Tap an odds button to add a selection.</p>
          ) : (
            selections.map(sel => {
              const match = matchMap.get(sel.matchId);
              if (!match) return null;
              return (
                <div key={sel.matchId} className="slip-leg" data-match-id={sel.matchId}>
                  <div className="leg-match">
                    {match.home} vs {match.away}
                  </div>
                  <div className="leg-pick">{sel.label}</div>
                  <div className="leg-odds">
                    <span>{fmtOdds(sel.odds)}</span>
                    <button
                      className="leg-remove"
                      onClick={() =>
                        dispatch({ type: 'REMOVE_SELECTION', matchId: sel.matchId })
                      }
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="slip-footer">
          <div className="slip-row">
            <span>Total Odds</span>
            <strong>{totalOdds ? fmtOdds(totalOdds) : '1.00'}</strong>
          </div>
          <label className="stake-row">
            <span>Stake ($)</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={stake}
              onChange={e => setStake(e.target.value)}
            />
          </label>
          <div className="slip-row payout-row">
            <span>Potential Payout</span>
            <strong className="payout">{fmtMoney(payout)}</strong>
          </div>
          <div className="slip-error">{err}</div>
          <button className="place-btn" onClick={place} disabled={!canPlace}>
            Place Bet
          </button>
        </div>
      </aside>

      <button
        className="slip-toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle bet slip"
      >
        <span className="slip-toggle-icon">🧾</span>
        <span className="slip-toggle-count">{selections.length}</span>
      </button>
    </>
  );
}
