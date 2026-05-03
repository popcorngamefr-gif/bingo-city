/**
 * Écran : classement final
 */

import { state } from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
}

export function renderEnd() {
  // Donne des scores aléatoires aux bots qui n'en ont pas
  state.players.forEach(p => {
    if (!p.isYou && (p.score == null || p.score === 0)) {
      p.score = Math.floor(Math.random() * 25) + 5
    }
  })

  const sorted = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winner = sorted[0]
  const title = winner.isYou ? '★ Tu as gagné ! ★' : `★ ${winner.name} gagne ! ★`

  const medals = ['🥇', '🥈', '🥉']

  return `
    <section class="screen end-screen">
      <h2 class="title-screen">${title}</h2>

      <div class="frame frame-wood">
        <div class="content">
          <div class="leaderboard">
            ${sorted.map((p, i) => `
              <div class="lb-row rank-${i+1} ${p.hasBingo ? 'bingo' : ''}">
                <div class="lb-rank">${medals[i] || '#' + (i+1)}</div>
                <div class="avatar sm">${avatarLayersHtml(p.avatar)}</div>
                <div class="lb-name">
                  ${escapeHtml(p.name)}${p.isYou ? ' (toi)' : ''}${p.isMJ ? ' [MJ]' : ''}
                </div>
                <div class="lb-score">${p.score || 0} PTS</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="row mt">
        <button class="btn btn-ghost btn-sm" data-nav="game">← Continuer</button>
        <button class="btn btn-orange" data-action="newGame">Nouvelle partie</button>
      </div>
    </section>

    <style>
      .leaderboard {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px;
      }
      .lb-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: var(--paper);
        border: 2px solid var(--wood-dark);
        box-shadow: 2px 2px 0 var(--wood-shadow);
        position: relative;
      }
      .lb-row.rank-1 { background: linear-gradient(135deg, #f5cd47, #e0a818); }
      .lb-row.rank-2 { background: linear-gradient(135deg, #d4d4d4, #999); }
      .lb-row.rank-3 { background: linear-gradient(135deg, #cd7f32, #8b5a2b); }
      .lb-row.rank-3 .lb-name, .lb-row.rank-3 .lb-score { color: white; }
      .lb-rank {
        font-family: 'Press Start 2P', monospace;
        font-size: 14px;
        width: 36px;
        text-align: center;
      }
      .lb-name {
        font-size: 18px;
        flex: 1;
        color: var(--ink);
        font-weight: bold;
      }
      .lb-score {
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        color: var(--ink);
      }
      .lb-row.bingo::after {
        content: 'BINGO!';
        position: absolute;
        right: 8px; top: -10px;
        background: var(--red);
        color: white;
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        padding: 3px 5px;
        border: 2px solid var(--ink);
        animation: bingoBounce 0.6s steps(3) infinite;
      }
      @keyframes bingoBounce {
        0%, 100% { transform: rotate(-5deg) scale(1); }
        50% { transform: rotate(5deg) scale(1.1); }
      }
    </style>
  `
}
