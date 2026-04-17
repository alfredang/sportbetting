(function () {
  'use strict';

  const PICK_LABELS = { home: '1', draw: 'X', away: '2' };
  const LS_BAL = 'sb.balance';
  const LS_HIST = 'sb.history';
  const LS_THEME = 'sb.theme';
  const DEFAULT_BALANCE = 1000;
  const SETTLE_DELAY_MS = 10_000;
  const WIN_RATE = 0.35;

  const state = {
    selections: new Map(),
    balance: DEFAULT_BALANCE,
    history: [],
    activeView: 'matches'
  };

  const matches = (window.MATCHES || []).map(m => ({
    ...m,
    odds: { ...m.odds },
    prevOdds: { ...m.odds }
  }));
  const matchById = new Map(matches.map(m => [m.id, m]));

  // ---------- Persistence ----------
  function loadState() {
    const savedBal = parseFloat(localStorage.getItem(LS_BAL));
    state.balance = Number.isFinite(savedBal) ? savedBal : DEFAULT_BALANCE;
    try {
      state.history = JSON.parse(localStorage.getItem(LS_HIST) || '[]');
      if (!Array.isArray(state.history)) state.history = [];
    } catch {
      state.history = [];
    }
  }
  function saveBalance() { localStorage.setItem(LS_BAL, String(state.balance)); }
  function saveHistory() { localStorage.setItem(LS_HIST, JSON.stringify(state.history)); }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS_THEME, theme);
  }
  function loadTheme() {
    const saved = localStorage.getItem(LS_THEME);
    const preferred = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(preferred);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  }

  // ---------- Utils ----------
  const $ = id => document.getElementById(id);
  const fmtMoney = n => `$${n.toFixed(2)}`;
  const fmtOdds = n => n.toFixed(2);
  const fmtKickoff = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };
  const fmtHistoryTime = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  const uid = () => 'b_' + Math.random().toString(36).slice(2, 10);

  // ---------- Rendering: balance & toast ----------
  function renderBalance() {
    $('balance-display').textContent = fmtMoney(state.balance);
  }

  let toastTimer = null;
  function toast(msg, kind = 'info') {
    const el = $('toast');
    el.textContent = msg;
    el.classList.toggle('error', kind === 'error');
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ---------- Match card ----------
  function buildMatchCard(m) {
    const card = document.createElement('article');
    card.className = 'match-card';
    card.dataset.matchId = m.id;

    const meta = document.createElement('div');
    meta.className = 'match-meta';
    const leagueTag = document.createElement('span');
    leagueTag.className = 'league-tag';
    leagueTag.textContent = m.league;
    meta.appendChild(leagueTag);

    const timeOrLive = document.createElement('span');
    if (m.live) {
      timeOrLive.className = 'live-tag';
      timeOrLive.innerHTML = '<span class="live-dot"></span> LIVE';
    } else {
      timeOrLive.textContent = fmtKickoff(m.kickoff);
    }
    meta.appendChild(timeOrLive);
    card.appendChild(meta);

    const teams = document.createElement('div');
    teams.className = 'teams';
    teams.innerHTML = `
      <div class="team-row"><span>${m.home}</span><span class="team-hint">Home</span></div>
      <div class="team-row"><span>${m.away}</span><span class="team-hint">Away</span></div>
    `;
    card.appendChild(teams);

    const odds = document.createElement('div');
    odds.className = 'odds-row';
    ['home', 'draw', 'away'].forEach(pick => {
      const btn = document.createElement('button');
      btn.className = 'odds-btn';
      btn.dataset.matchId = m.id;
      btn.dataset.pick = pick;
      btn.innerHTML = `
        <span class="odds-label">${PICK_LABELS[pick]} ${pick === 'home' ? m.home.split(' ')[0] : pick === 'away' ? m.away.split(' ')[0] : 'Draw'}</span>
        <span class="odds-value">${fmtOdds(m.odds[pick])}</span>
      `;
      const sel = state.selections.get(m.id);
      if (sel && sel.pick === pick) btn.classList.add('selected');
      odds.appendChild(btn);
    });
    card.appendChild(odds);
    return card;
  }

  function renderMatches() {
    const grid = $('matches-grid');
    const liveGrid = $('live-grid');
    grid.innerHTML = '';
    liveGrid.innerHTML = '';
    matches.forEach(m => {
      (m.live ? liveGrid : grid).appendChild(buildMatchCard(m));
    });
    if (!liveGrid.children.length) {
      liveGrid.innerHTML = '<p class="history-empty">No live matches right now.</p>';
    }
  }

  // Update only one card in place (avoids losing scroll / flashes across the grid)
  function updateCardOdds(match) {
    const cards = document.querySelectorAll(`[data-match-id="${match.id}"].match-card`);
    cards.forEach(card => {
      card.querySelectorAll('.odds-btn').forEach(btn => {
        const pick = btn.dataset.pick;
        const valEl = btn.querySelector('.odds-value');
        const next = match.odds[pick];
        const prev = match.prevOdds[pick];
        valEl.textContent = fmtOdds(next);
        btn.classList.remove('odds-up', 'odds-down', 'flash');
        if (next > prev) btn.classList.add('odds-up');
        else if (next < prev) btn.classList.add('odds-down');
        // retrigger animation
        void btn.offsetWidth;
        btn.classList.add('flash');
      });
    });
  }

  // ---------- Bet slip ----------
  function computeTotalOdds() {
    let total = 1;
    state.selections.forEach(s => { total *= s.odds; });
    return state.selections.size ? total : 0;
  }

  function renderBetSlip() {
    const body = $('slip-body');
    const count = state.selections.size;
    $('slip-count').textContent = count;
    $('slip-toggle-count').textContent = count;
    body.innerHTML = '';

    if (!count) {
      body.innerHTML = '<p class="slip-empty">Tap an odds button to add a selection.</p>';
    } else {
      state.selections.forEach(sel => {
        const m = matchById.get(sel.matchId);
        const leg = document.createElement('div');
        leg.className = 'slip-leg';
        leg.dataset.matchId = sel.matchId;
        leg.innerHTML = `
          <div class="leg-match">${m.home} vs ${m.away}</div>
          <div class="leg-pick">${sel.label}</div>
          <div class="leg-odds">
            <span>${fmtOdds(sel.odds)}</span>
            <button class="leg-remove" data-remove="${sel.matchId}" aria-label="Remove">×</button>
          </div>
        `;
        body.appendChild(leg);
      });
    }

    const total = computeTotalOdds();
    $('total-odds').textContent = total ? fmtOdds(total) : '1.00';
    renderPayout();

    const stake = parseFloat($('stake-input').value);
    const canPlace = count > 0 && stake > 0 && stake <= state.balance;
    $('place-btn').disabled = !canPlace;
  }

  function renderPayout() {
    const total = computeTotalOdds();
    const stake = parseFloat($('stake-input').value) || 0;
    const payout = total && stake ? stake * total : 0;
    $('payout-display').textContent = fmtMoney(payout);
    const count = state.selections.size;
    const canPlace = count > 0 && stake > 0 && stake <= state.balance;
    $('place-btn').disabled = !canPlace;
    const err = $('slip-error');
    if (stake > state.balance) err.textContent = 'Stake exceeds balance';
    else err.textContent = '';
  }

  function pickLabel(m, pick) {
    if (pick === 'home') return `${m.home} to win`;
    if (pick === 'away') return `${m.away} to win`;
    return 'Draw';
  }

  function toggleSelection(matchId, pick) {
    const m = matchById.get(matchId);
    if (!m) return;
    const existing = state.selections.get(matchId);
    if (existing && existing.pick === pick) {
      state.selections.delete(matchId);
    } else {
      state.selections.set(matchId, {
        matchId,
        pick,
        odds: m.odds[pick],
        label: pickLabel(m, pick)
      });
    }
    // refresh selected state on all buttons for this match
    document.querySelectorAll(`.odds-btn[data-match-id="${matchId}"]`).forEach(btn => {
      const sel = state.selections.get(matchId);
      btn.classList.toggle('selected', !!sel && sel.pick === btn.dataset.pick);
    });
    renderBetSlip();
  }

  function removeSelection(matchId) {
    if (!state.selections.has(matchId)) return;
    state.selections.delete(matchId);
    document.querySelectorAll(`.odds-btn[data-match-id="${matchId}"]`)
      .forEach(btn => btn.classList.remove('selected'));
    renderBetSlip();
  }

  function clearSlip() {
    state.selections.forEach((_, mid) => {
      document.querySelectorAll(`.odds-btn[data-match-id="${mid}"]`)
        .forEach(btn => btn.classList.remove('selected'));
    });
    state.selections.clear();
    renderBetSlip();
  }

  // Keep slip odds in sync when live sim updates a match already in the slip.
  function syncSlipWithMatch(match) {
    const sel = state.selections.get(match.id);
    if (!sel) return;
    sel.odds = match.odds[sel.pick];
    renderBetSlip();
  }

  // ---------- Placing bets ----------
  function placeBet() {
    const stake = parseFloat($('stake-input').value);
    if (!state.selections.size) {
      toast('Add a selection first', 'error'); return;
    }
    if (!(stake > 0)) {
      toast('Enter a valid stake', 'error'); return;
    }
    if (stake > state.balance) {
      toast('Insufficient balance', 'error'); return;
    }
    const totalOdds = computeTotalOdds();
    const legs = Array.from(state.selections.values()).map(s => {
      const m = matchById.get(s.matchId);
      return {
        matchId: s.matchId,
        pick: s.pick,
        odds: s.odds,
        label: s.label,
        match: `${m.home} vs ${m.away}`
      };
    });
    const bet = {
      id: uid(),
      placedAt: new Date().toISOString(),
      stake,
      totalOdds,
      payout: +(stake * totalOdds).toFixed(2),
      legs,
      status: 'pending'
    };
    state.history.unshift(bet);
    state.balance -= stake;
    saveBalance();
    saveHistory();
    renderBalance();
    clearSlip();
    $('stake-input').value = '';
    toast(`Bet placed — ${legs.length} leg${legs.length > 1 ? 's' : ''} @ ${fmtOdds(totalOdds)}`);
    renderDashboard();
  }

  // ---------- Settlement ----------
  function settlePendingBets() {
    let changed = false;
    const now = Date.now();
    state.history.forEach(bet => {
      if (bet.status !== 'pending') return;
      const age = now - Date.parse(bet.placedAt);
      if (age < SETTLE_DELAY_MS) return;
      const won = Math.random() < WIN_RATE;
      bet.status = won ? 'won' : 'lost';
      bet.settledAt = new Date().toISOString();
      if (won) {
        state.balance += bet.payout;
        toast(`Bet won! +${fmtMoney(bet.payout)}`);
      }
      changed = true;
    });
    if (changed) {
      saveBalance();
      saveHistory();
      renderBalance();
      if (state.activeView === 'dashboard') renderDashboard();
    }
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const total = state.history.length;
    const won = state.history.filter(b => b.status === 'won').length;
    const lost = state.history.filter(b => b.status === 'lost').length;
    const pending = state.history.filter(b => b.status === 'pending').length;
    const settled = won + lost;
    const winRate = settled ? (won / settled) * 100 : 0;
    const returned = state.history
      .filter(b => b.status === 'won')
      .reduce((a, b) => a + b.payout, 0);
    const settledStake = state.history
      .filter(b => b.status !== 'pending')
      .reduce((a, b) => a + b.stake, 0);
    const netRealized = returned - settledStake;

    const grid = $('stat-grid');
    grid.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Balance</div>
        <div class="stat-value accent">${fmtMoney(state.balance)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bets Placed</div>
        <div class="stat-value">${total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Win Rate</div>
        <div class="stat-value">${winRate.toFixed(0)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Pending</div>
        <div class="stat-value">${pending}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Net P/L (settled)</div>
        <div class="stat-value ${netRealized >= 0 ? 'accent' : 'danger'}">${netRealized >= 0 ? '+' : ''}${fmtMoney(netRealized)}</div>
      </div>
    `;

    const body = $('history-body');
    if (!state.history.length) {
      body.innerHTML = '<tr><td colspan="6" class="history-empty">No bets placed yet.</td></tr>';
      return;
    }
    body.innerHTML = '';
    state.history.forEach(bet => {
      const tr = document.createElement('tr');
      const legsHtml = bet.legs.map(l =>
        `<div><span style="color:var(--text-dim)">${l.match}</span> — ${l.label} @ ${fmtOdds(l.odds)}</div>`
      ).join('');
      tr.innerHTML = `
        <td>${fmtHistoryTime(bet.placedAt)}</td>
        <td>${legsHtml}</td>
        <td>${fmtOdds(bet.totalOdds)}</td>
        <td>${fmtMoney(bet.stake)}</td>
        <td>${fmtMoney(bet.payout)}</td>
        <td><span class="status-chip status-${bet.status}">${bet.status}</span></td>
      `;
      body.appendChild(tr);
    });
  }

  // ---------- Live simulation ----------
  function nudgeOdds(v) {
    const delta = (Math.random() - 0.5) * 0.12;
    let next = +(v + delta).toFixed(2);
    if (next < 1.05) next = 1.05;
    if (next > 15) next = 15;
    return next;
  }

  function startLiveSim() {
    setInterval(() => {
      const liveMatches = matches.filter(m => m.live);
      if (!liveMatches.length) return;
      const m = liveMatches[Math.floor(Math.random() * liveMatches.length)];
      m.prevOdds = { ...m.odds };
      m.odds.home = nudgeOdds(m.odds.home);
      m.odds.draw = nudgeOdds(m.odds.draw);
      m.odds.away = nudgeOdds(m.odds.away);
      updateCardOdds(m);
      syncSlipWithMatch(m);
    }, 3000);
  }

  // ---------- View switching ----------
  function setView(view) {
    state.activeView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = $(`${view}-view`);
    if (target) target.classList.add('active');
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === view);
    });
    if (view === 'dashboard') renderDashboard();
  }

  // ---------- Wiring ----------
  function wire() {
    $('tabs').addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (tab) setView(tab.dataset.view);
    });

    document.addEventListener('click', e => {
      const oddsBtn = e.target.closest('.odds-btn');
      if (oddsBtn) {
        toggleSelection(oddsBtn.dataset.matchId, oddsBtn.dataset.pick);
        return;
      }
      const rm = e.target.closest('[data-remove]');
      if (rm) {
        removeSelection(rm.dataset.remove);
        return;
      }
    });

    $('slip-clear').addEventListener('click', clearSlip);
    $('stake-input').addEventListener('input', renderPayout);
    $('place-btn').addEventListener('click', placeBet);

    $('slip-toggle').addEventListener('click', () => {
      $('bet-slip').classList.toggle('open');
    });

    $('theme-toggle').addEventListener('click', toggleTheme);
  }

  // ---------- Boot ----------
  function init() {
    loadTheme();
    loadState();
    renderBalance();
    renderMatches();
    renderBetSlip();
    renderDashboard();
    wire();
    settlePendingBets();
    setInterval(settlePendingBets, 4000);
    startLiveSim();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
