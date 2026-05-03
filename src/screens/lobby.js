/**
 * Écran : lobby — salle d'attente
 */

import { state } from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'

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

      <!-- Code badge encadré par 2 sparkles décoratives -->
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

      <div class="mt" style="position: relative; z-index: 5;">
        ${isMJ
          ? `<button class="btn btn-red btn-block" data-nav="setup">
               Choisir les objets ${icon('arrow_right', { size: 16 })}
             </button>`
          : `<p class="small light center mb">
               ${icon('hourglass', { size: 14 })} Le MJ prépare la partie...
             </p>
             <button class="btn btn-yellow btn-block btn-sm" data-nav="game">[demo] Forcer démarrage</button>`
        }
      </div>

      <style>
        .code-badge-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
          position: relative;
          z-index: 5;
        }
        .code-badge-wrap .code-badge {
          flex: 1;
          margin-bottom: 0;
        }
        .code-deco {
          flex-shrink: 0;
          animation: codeDecoPulse 2s ease-in-out infinite;
        }
        .code-deco-right {
          animation-delay: 1s;
        }
        @keyframes codeDecoPulse {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
          50% { transform: scale(1.2) rotate(20deg); opacity: 1; }
        }

        /* Boutons MJ avec icone : flèche alignée à droite */
        .lobby-screen .btn .ico {
          margin-left: 6px;
        }
      </style>
    </section>
  `
}
