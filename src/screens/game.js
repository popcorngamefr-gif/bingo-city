/**
 * Écran : grille de bingo en cours de partie
 * Styles dans src/styles/screens.css
 */

import { state } from '../state.js'
import { getObject, objectSvg } from '../data/objects.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { icon } from '../ui/icons.js'
import { safeImg } from '../utils/media.js'

export function renderGame() {
  const me          = state.players.find(p => p.isYou) || { score: 0, avatar: state.myAvatar }
  const sorted      = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const rank        = sorted.findIndex(p => p.isYou) + 1
  const totalPlayers = state.players.length

  const n    = state.myGrid.length
  let cols   = 3
  if (n > 9)  cols = 4
  // Au-delà de 16 on garde 4 colonnes : meilleur lisibilité, on assume le scroll vertical
  const validated  = state.myGrid.filter(c => c.status === 'validated').length
  const remaining  = n - validated

  return `
    <section class="screen game-screen">
      <button class="game-share-btn" data-action="openShareModal" title="Partager la partie">
        ${icon('link', { size: 14 })}
        <span class="game-share-code">${state.gameCode || ''}</span>
      </button>

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
          ${icon('pierogi', { size: 16 })}
          <div class="hud-stat-block">
            <span class="hud-label">PTS</span>
            <span class="hud-value">${me.score || 0}</span>
          </div>
        </div>
        <div class="hud-stat">
          ${icon('star', { size: 16 })}
          <div class="hud-stat-block">
            <span class="hud-label">RANG</span>
            <span class="hud-value">${rank || '?'}/${totalPlayers}</span>
          </div>
        </div>
        <div class="hud-stat">
          ${icon('hourglass', { size: 16 })}
          <div class="hud-stat-block">
            <span class="hud-label">TEMPS</span>
            <span class="hud-value timer" id="game-timer">--:--</span>
          </div>
        </div>
      </div>

      <div class="game-progress">
        <span class="game-progress-count">
          ${icon('camera', { size: 16 })}
          <span class="game-progress-num">${validated}</span><span class="game-progress-total">/${n}</span>
        </span>
        <span class="game-progress-hint">
          ${remaining > 0
            ? `<strong>${remaining}</strong> à shooter`
            : `<strong>Bingo complet !</strong>`}
        </span>
      </div>

      <!-- Grille de bingo -->
      <div class="bingo-grid" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));">
        ${state.myGrid.map((cell, i) => {
          const obj = getObject(cell.objId)
          if (!obj) return ''
          const photo = state.myPhotos?.[i]
          const isValidated = cell.status === 'validated'
          const statusIcon  = isValidated ? icon('check', { size: 20, cls: 'cell-status-icon' }) : ''
          // Objets custom : on rend l'icône via icon() au lieu de objectSvg
          const iconHtml = obj.icon && !obj.grid
            ? icon(obj.icon, { size: 36 })
            : objectSvg(obj)
          // Si validée et photo dispo : on affiche la photo en background, l'icône est masquée
          const hasPhoto = isValidated && photo
          return `<div class="bingo-cell ${cell.status} ${hasPhoto ? 'has-photo' : ''}" data-cell="${i}">
            ${hasPhoto
              ? safeImg(photo, { alt: obj.name, className: 'bingo-cell-photo' })
              : `<div class="bingo-cell-icon">${iconHtml}</div>`
            }
            <div class="bingo-cell-name">${obj.name}</div>
            ${statusIcon}
          </div>`
        }).join('')}
      </div>

      <div class="sticky-cta">
        <button class="btn btn-cream btn-sm" data-action="openClassement">
          ${icon('trophy', { size: 16 })} Classement
        </button>
        ${state.isMJ ? `
          <button class="btn btn-red btn-sm" data-action="endGameByMJ">
            ${icon('cross', { size: 14 })} Terminer
          </button>
        ` : ''}
      </div>
    </section>
  `
}
