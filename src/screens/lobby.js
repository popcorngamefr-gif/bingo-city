/**
 * Écran : lobby — salle d'attente
 * Styles dans src/styles/screens.css
 */

import { state } from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'
import { escapeHtml }     from '../utils/html.js'
import { isUnlocked }     from '../ui/shooter-paywall.js'

export function renderLobby() {
  const isMJ = state.isMJ

  const playersHtml = state.players.map(p => `
    <div class="player-row ${p.isYou ? 'you' : ''} ${p.justJoined ? 'joining' : ''}">
      <div class="avatar xs" style="position:relative;">
        <div class="avatar-inner">
          ${avatarLayersHtml(p.avatar)}
        </div>
      </div>
      <div class="player-name">${escapeHtml(p.name)}${p.isYou ? ' (toi)' : ''}</div>
      ${p.isMJ ? '<span class="mj-badge">MJ</span>' : ''}
    </div>
  `).join('')

  return `
    <section class="screen lobby-screen">
      ${bgVarsovieHtml({ opacity: 0.35 })}

      <h2 class="title-screen">★ SALLE D'ATTENTE ★</h2>

      <div class="code-badge-wrap">
        <span class="code-deco code-deco-left">${icon('sparkle', { size: 24 })}</span>
        <div class="code-badge">
          <div class="code-label">CODE À PARTAGER</div>
          <div class="code-value">${state.gameCode || '----'}</div>
        </div>
        <span class="code-deco code-deco-right">${icon('sparkle', { size: 24 })}</span>
      </div>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div class="section-title">
          Joueurs <span style="color: var(--ink-soft);">(${state.players.length})</span>
        </div>
        <div class="stack" style="gap: 6px;">
          ${playersHtml}
        </div>
      </div>

      <div class="sticky-cta">
        ${isMJ
          ? `<button class="btn btn-red btn-block" data-nav="setup">
               Choisir les objets ${icon('arrow_right', { size: 16 })}
             </button>`
          : `<p class="small light center mb" style="padding:16px 0;">
               ${icon('hourglass', { size: 16 })} En attente du MJ…
             </p>`
        }
      </div>
    </section>
  `
}
