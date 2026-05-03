/**
 * Écran : lobby — salle d'attente
 */

import { state } from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
}

export function renderLobby() {
  const isMJ = state.isMJ
  const playersHtml = state.players.map(p => `
    <div class="player-row ${p.isYou ? 'you' : ''} ${p.justJoined ? 'joining' : ''}">
      <div class="avatar xs">
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

      <div class="code-badge">
        <div class="code-label">CODE À PARTAGER</div>
        <div class="code-value">${state.gameCode || '----'}</div>
      </div>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div class="section-title">
          Joueurs <span style="color: var(--ink-soft);">(${state.players.length})</span>
        </div>
        <div class="stack" style="gap: 6px;">
          ${playersHtml}
        </div>
      </div>

      <div class="mt" style="position: relative; z-index: 5;">
        ${isMJ
          ? `<button class="btn btn-red btn-block" data-nav="setup">Choisir les objets →</button>`
          : `<p class="small light center mb">⏳ Le MJ prépare la partie...</p>
             <button class="btn btn-yellow btn-block btn-sm" data-nav="game">[demo] Forcer démarrage</button>`
        }
      </div>
    </section>
  `
}
