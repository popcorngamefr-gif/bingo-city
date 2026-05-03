/**
 * Écran : lobby (salle d'attente avec code de partie)
 */

import { state } from '../state.js'
import { avatarLayersHtml } from '../ui/avatar.js'

export function renderLobby() {
  const isMJ = state.isMJ
  const playersHtml = state.players.map(p => `
    <div class="player-row ${p.isYou ? 'you' : ''} ${p.isMJ ? 'mj' : ''} ${p.justJoined ? 'joining' : ''}">
      <div class="avatar sm">${avatarLayersHtml(p.avatar)}</div>
      <div class="player-name">${escapeHtml(p.name)}${p.isYou ? ' (toi)' : ''}</div>
      ${p.isMJ ? '<span class="mj-badge">MJ</span>' : ''}
    </div>
  `).join('')

  return `
    <section class="screen lobby-screen">
      <h2 class="title-screen">★ Salle d'attente ★</h2>

      <!-- Code de partie -->
      <div class="code-badge">
        <div class="code-label">CODE À PARTAGER</div>
        <div class="code-value">${state.gameCode || '----'}</div>
      </div>

      <!-- Liste des joueurs -->
      <div class="frame frame-wood">
        <div class="content">
          <div class="lobby-section-title">
            Joueurs <span class="player-count">(${state.players.length})</span>
          </div>
          <div class="player-list">
            ${playersHtml}
          </div>
        </div>
      </div>

      <!-- Action -->
      <div class="lobby-actions mt">
        ${isMJ
          ? `<button class="btn btn-orange btn-block" data-nav="setup">Choisir les objets →</button>`
          : `<p class="small light center mb">⏳ Le MJ prépare la partie...</p>
             <button class="btn btn-blue btn-block" data-nav="game">[DEMO] Forcer le démarrage</button>`
        }
      </div>
    </section>

    <style>
      .code-badge {
        background: var(--ink);
        border: 3px solid var(--yellow);
        padding: 12px;
        text-align: center;
        margin-bottom: 16px;
        position: relative;
        box-shadow: 0 4px 0 var(--wood-dark);
      }
      .code-label {
        font-family: 'Press Start 2P', monospace;
        font-size: 8px;
        color: var(--paper);
        opacity: 0.85;
      }
      .code-value {
        font-family: 'Press Start 2P', monospace;
        font-size: 28px;
        color: var(--yellow);
        letter-spacing: 0.3em;
        margin-top: 6px;
        text-shadow: 2px 2px 0 var(--wood-dark);
      }
      .lobby-section-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        color: var(--ink);
        margin-bottom: 10px;
        padding: 8px 12px;
      }
      .player-count {
        color: var(--wood-dark);
      }
      .player-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 0 12px 12px;
      }
      .player-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 8px;
        background: var(--paper);
        border: 2px solid var(--wood-dark);
        box-shadow: 2px 2px 0 var(--wood-shadow);
      }
      .player-row.you { background: var(--yellow); }
      .player-row.joining { animation: joinFlash 0.6s steps(3); }
      @keyframes joinFlash {
        0%, 100% { background: var(--paper); }
        50% { background: var(--green); }
      }
      .player-name {
        font-size: 18px;
        color: var(--ink);
        font-weight: bold;
        flex: 1;
      }
      .mj-badge {
        font-family: 'Press Start 2P', monospace;
        font-size: 8px;
        background: var(--red);
        color: white;
        padding: 4px 6px;
        border: 2px solid var(--ink);
      }
    </style>
  `
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
}
