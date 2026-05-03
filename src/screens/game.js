/**
 * Écran : grille de bingo en cours de partie
 * HUD style métal (style 2)
 */

import { state } from '../state.js'
import { getObject, objectSvg } from '../data/objects.js'

export function renderGame() {
  const me = state.players.find(p => p.isYou) || { score: 0 }
  const sorted = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const rank = sorted.findIndex(p => p.isYou) + 1
  const totalPlayers = state.players.length

  // Grille adaptative
  const n = state.myGrid.length
  let cols = 3
  if (n > 9) cols = 4
  if (n > 16) cols = 5

  return `
    <section class="screen game-screen">
      <!-- HUD haut (style métal) -->
      <div class="game-hud frame frame-metal-dark">
        <div class="content">
          <div class="hud-row">
            <div class="hud-stat">
              <img src="/assets/icons/coin_gold.png" class="icon-sm" alt="" />
              <span class="hud-value">${me.score || 0}</span>
            </div>
            <div class="hud-stat">
              <img src="/assets/icons/star_gold.png" class="icon-sm" alt="" />
              <span class="hud-value">${rank}/${totalPlayers}</span>
            </div>
            <div class="hud-stat">
              <img src="/assets/icons/hourglass.png" class="icon-sm" alt="" />
              <span class="hud-value timer" id="game-timer">30:00</span>
            </div>
          </div>
        </div>
      </div>

      <p class="small light center mb">
        Repéré ? <strong style="color: var(--yellow);">Tape</strong> et photo !
      </p>

      <!-- Grille de bingo -->
      <div class="bingo-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
        ${state.myGrid.map((cell, i) => {
          const obj = getObject(cell.objId)
          if (!obj) return ''
          return `<div class="bingo-cell ${cell.status}" data-cell="${i}">
            <div class="bingo-cell-icon">${objectSvg(obj)}</div>
            <div class="bingo-cell-name">${obj.name}</div>
            ${cell.status === 'pending' ? '<div class="bingo-cell-pending">⏳</div>' : ''}
            ${cell.status === 'validated' ? '<div class="bingo-cell-check">✓</div>' : ''}
            ${cell.status === 'rejected' ? '<div class="bingo-cell-cross">✗</div>' : ''}
          </div>`
        }).join('')}
      </div>

      <div class="row mt">
        ${state.isMJ ? '<button class="btn btn-blue btn-sm" data-nav="validate">Validations MJ</button>' : ''}
        <button class="btn btn-metal btn-sm" data-nav="end">Voir classement</button>
      </div>
    </section>

    <style>
      .game-hud {
        margin-bottom: 12px;
      }
      .game-hud .content {
        padding: 8px 12px;
      }
      .hud-row {
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
      .hud-stat {
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        color: var(--paper);
        text-shadow: 1px 1px 0 var(--ink);
      }
      .hud-stat .icon-sm {
        width: 20px;
        height: 20px;
      }
      .hud-value.timer { color: var(--orange); }

      .bingo-grid {
        display: grid;
        gap: 6px;
        margin-bottom: 12px;
      }
      .bingo-cell {
        aspect-ratio: 1;
        background: var(--paper);
        border: 2px solid var(--wood-dark);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4px;
        position: relative;
        box-shadow: 2px 2px 0 var(--wood-shadow);
      }
      .bingo-cell:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0 var(--wood-shadow);
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
        background: var(--yellow);
        animation: pendingPulse 1s steps(2) infinite;
      }
      @keyframes pendingPulse {
        0%, 100% { background: var(--yellow); }
        50% { background: var(--orange); }
      }
      .bingo-cell-pending {
        position: absolute;
        top: 4px; right: 4px;
        font-size: 14px;
      }
      .bingo-cell.validated {
        background: var(--green);
      }
      .bingo-cell.validated .bingo-cell-name {
        color: white;
        text-shadow: 1px 1px 0 var(--ink);
      }
      .bingo-cell-check {
        position: absolute;
        top: 2px; right: 4px;
        color: white;
        font-family: 'Press Start 2P', monospace;
        font-size: 14px;
        text-shadow: 1px 1px 0 var(--ink);
      }
      .bingo-cell.rejected {
        background: #c98080;
        opacity: 0.7;
      }
      .bingo-cell-cross {
        position: absolute;
        top: 2px; right: 4px;
        color: white;
        font-family: 'Press Start 2P', monospace;
        font-size: 14px;
      }
    </style>
  `
}
