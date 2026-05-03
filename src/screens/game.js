/**
 * Écran : grille de bingo en cours de partie
 */

import { state } from '../state.js'
import { getObject, objectSvg } from '../data/objects.js'

export function renderGame() {
  const me = state.players.find(p => p.isYou) || { score: 0 }
  const sorted = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const rank = sorted.findIndex(p => p.isYou) + 1
  const totalPlayers = state.players.length

  const n = state.myGrid.length
  let cols = 3
  if (n > 9) cols = 4
  if (n > 16) cols = 5

  return `
    <section class="screen game-screen">
      <!-- HUD haut -->
      <div class="game-hud">
        <div class="hud-stat">
          <span class="hud-icon">🥟</span>
          <span class="hud-value">${me.score || 0}</span>
        </div>
        <div class="hud-stat">
          <span class="hud-icon">⭐</span>
          <span class="hud-value">${rank || '?'}/${totalPlayers}</span>
        </div>
        <div class="hud-stat">
          <span class="hud-icon">⏱</span>
          <span class="hud-value timer" id="game-timer">30:00</span>
        </div>
      </div>

      <p class="small light center mb">
        Repéré ? <strong style="color: var(--tram-red);">Tape</strong> et photo !
      </p>

      <!-- Grille de bingo -->
      <div class="bingo-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
        ${state.myGrid.map((cell, i) => {
          const obj = getObject(cell.objId)
          if (!obj) return ''
          return `<div class="bingo-cell ${cell.status}" data-cell="${i}">
            <div class="bingo-cell-icon">${objectSvg(obj)}</div>
            <div class="bingo-cell-name">${obj.name}</div>
            ${cell.status === 'pending' ? '<div class="bingo-cell-status">⏳</div>' : ''}
            ${cell.status === 'validated' ? '<div class="bingo-cell-status">✓</div>' : ''}
            ${cell.status === 'rejected' ? '<div class="bingo-cell-status">✗</div>' : ''}
          </div>`
        }).join('')}
      </div>

      <div class="row mt">
        ${state.isMJ ? '<button class="btn btn-yellow btn-sm" data-nav="validate">Validations MJ</button>' : ''}
        <button class="btn btn-concrete btn-sm" data-nav="end">Classement</button>
      </div>
    </section>

    <style>
      .game-hud {
        background: var(--ink);
        border: 3px solid var(--tram-yellow);
        border-radius: 10px;
        padding: 10px 14px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin-bottom: 14px;
        box-shadow: 0 4px 0 var(--tram-red-dark);
      }
      .hud-stat {
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        color: var(--cream-cold);
        text-shadow: 1px 1px 0 var(--ink);
      }
      .hud-icon { font-size: 16px; }
      .hud-value.timer { color: var(--tram-yellow); }

      .bingo-grid {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
      }
      .bingo-cell {
        aspect-ratio: 1;
        background: var(--cream-cold);
        border: 3px solid var(--ink);
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        position: relative;
        box-shadow: 2px 2px 0 var(--ink);
      }
      .bingo-cell:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0 var(--ink);
      }
      .bingo-cell-icon { width: 60%; height: 50%; }
      .bingo-cell-icon svg { width: 100%; height: 100%; }
      .bingo-cell-name {
        font-family: 'VT323', monospace;
        font-size: 12px;
        color: var(--ink);
        text-align: center;
        line-height: 1;
        margin-top: 2px;
      }
      .bingo-cell.pending {
        background: linear-gradient(180deg, #fce080 0%, var(--tram-yellow) 100%);
        animation: pendingPulse 1.5s steps(2) infinite;
      }
      @keyframes pendingPulse {
        0%, 100% { box-shadow: 2px 2px 0 var(--ink); }
        50% { box-shadow: 0 0 0 3px var(--tram-yellow-warm), 2px 2px 0 var(--ink); }
      }
      .bingo-cell.validated {
        background: linear-gradient(180deg, #88a890 0%, var(--green-go) 100%);
      }
      .bingo-cell.validated .bingo-cell-name {
        color: white;
        text-shadow: 1px 1px 0 var(--green-go-dark);
      }
      .bingo-cell.rejected {
        background: var(--brick);
        opacity: 0.6;
      }
      .bingo-cell.rejected .bingo-cell-name {
        color: white;
      }
      .bingo-cell-status {
        position: absolute;
        top: 2px; right: 4px;
        font-family: 'Press Start 2P', monospace;
        font-size: 14px;
        color: var(--ink);
        text-shadow: 1px 1px 0 var(--cream-cold);
      }
    </style>
  `
}
