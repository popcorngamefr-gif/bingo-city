/**
 * Écran : classement final
 */

import { state } from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'

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
  const title = winner.isYou ? 'TU AS GAGNÉ !' : `${winner.name.toUpperCase()} GAGNE !`

  const medals = [
    icon('medal_gold', { size: 28 }),
    icon('medal_silver', { size: 28 }),
    icon('medal_bronze', { size: 28 }),
  ]

  return `
    <section class="screen end-screen">
      ${bgVarsovieHtml({ opacity: 0.4 })}

      <h2 class="title-screen">${title}</h2>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div class="leaderboard">
          ${sorted.map((p, i) => `
            <div class="lb-row rank-${i+1} ${p.hasBingo ? 'bingo' : ''}">
              <div class="lb-rank">${medals[i] || `<span class="rank-num">#${i+1}</span>`}</div>
              <div class="avatar xs">
                <div class="avatar-inner">
                  ${avatarLayersHtml(p.avatar)}
                </div>
              </div>
              <div class="lb-name">
                ${escapeHtml(p.name)}${p.isYou ? ' (toi)' : ''}${p.isMJ ? ' [MJ]' : ''}
              </div>
              <div class="lb-score">${p.score || 0}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="row mt" style="position: relative; z-index: 5;">
        <button class="btn btn-ghost btn-sm" data-nav="game">← Continuer</button>
        <button class="btn btn-red" data-action="newGame">Nouvelle partie</button>
      </div>
    </section>

    <style>
      .leaderboard {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .lb-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: var(--cream-cold);
        border: 2px solid var(--ink);
        border-radius: 8px;
        box-shadow: 2px 2px 0 var(--ink);
        position: relative;
      }
      .lb-row.rank-1 {
        background: linear-gradient(135deg, var(--tram-yellow), var(--tram-yellow-warm));
      }
      .lb-row.rank-2 {
        background: linear-gradient(135deg, var(--concrete), var(--concrete-mid));
      }
      .lb-row.rank-3 {
        background: linear-gradient(135deg, var(--brick), var(--brick-dark));
      }
      .lb-row.rank-3 .lb-name, .lb-row.rank-3 .lb-score { color: white; }
      .lb-rank {
        font-family: 'Press Start 2P', monospace;
        font-size: 14px;
        width: 36px;
        text-align: center;
      }
      .lb-name {
        font-family: 'VT323', monospace;
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
        background: var(--tram-red);
        color: white;
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        padding: 3px 5px;
        border: 2px solid var(--ink);
        border-radius: 3px;
        animation: bingoBounce 0.6s steps(3) infinite;
      }
      @keyframes bingoBounce {
        0%, 100% { transform: rotate(-5deg) scale(1); }
        50% { transform: rotate(5deg) scale(1.1); }
      }
    </style>
  `
}
