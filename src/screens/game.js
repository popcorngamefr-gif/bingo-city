/**
 * Écran : grille de bingo en cours de partie
 * Styles dans src/styles/screens.css
 */

import { state } from '../state.js'
import { getObject, objectSvg } from '../data/objects.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { icon } from '../ui/icons.js'

export function renderGame() {
  const me          = state.players.find(p => p.isYou) || { score: 0, avatar: state.myAvatar }
  const sorted      = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const rank        = sorted.findIndex(p => p.isYou) + 1
  const totalPlayers = state.players.length

  const n    = state.myGrid.length
  let cols   = 3
  if (n > 9)  cols = 4
  if (n > 16) cols = 5

  return `
    <section class="screen game-screen">
      <!-- HUD haut avec avatar qui marche -->
      <div class="game-hud">
        <div class="hud-avatar">
          <div class="avatar sm mood-walk">
            <div class="avatar-inner">
              ${avatarLayersHtml(me.avatar || state.myAvatar)}
            </div>
          </div>
        </div>
        <div class="hud-stat">
          ${icon('pierogi', { size: 18 })}
          <span class="hud-value">${me.score || 0}</span>
        </div>
        <div class="hud-stat">
          ${icon('star', { size: 18 })}
          <span class="hud-value">${rank || '?'}/${totalPlayers}</span>
        </div>
        <div class="hud-stat">
          ${icon('hourglass', { size: 18 })}
          <span class="hud-value timer" id="game-timer">30:00</span>
        </div>
      </div>

      <p class="small light center mb">
        Repéré ? <strong style="color: var(--tram-red);">Tape</strong> et photo. L'IA valide.
      </p>

      <!-- Grille de bingo -->
      <div class="bingo-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
        ${state.myGrid.map((cell, i) => {
          const obj = getObject(cell.objId)
          if (!obj) return ''
          const statusIcon =
            cell.status === 'pending'   ? icon('robot', { size: 18, cls: 'cell-status-icon' }) :
            cell.status === 'validated' ? icon('check', { size: 20, cls: 'cell-status-icon' }) :
            cell.status === 'rejected'  ? icon('cross', { size: 18, cls: 'cell-status-icon' }) :
            ''
          return `<div class="bingo-cell ${cell.status}" data-cell="${i}">
            <div class="bingo-cell-icon">${objectSvg(obj)}</div>
            <div class="bingo-cell-name">${obj.name}</div>
            ${statusIcon}
          </div>`
        }).join('')}
      </div>

      <button class="btn btn-cream btn-sm mt" data-nav="end">Voir le classement</button>
    </section>
  `
}
