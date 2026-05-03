/**
 * Écran : MJ valide les photos
 */

import { state } from '../state.js'
import { getObject, objectSvg } from '../data/objects.js'

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
}

export function renderValidate() {
  const queue = state.pendingValidations

  return `
    <section class="screen validate-screen">
      <h2 class="title-screen">★ Validation MJ ★</h2>

      <p class="small light center mb">
        ${queue.length} photo${queue.length > 1 ? 's' : ''} en attente
      </p>

      <div class="validation-queue">
        ${queue.length === 0
          ? `<div class="frame frame-wood"><div class="content">
              <p class="small center">Aucune photo en attente.</p>
            </div></div>`
          : queue.map((v, i) => {
              const obj = getObject(v.objId)
              return `<div class="validation-card frame frame-wood">
                <div class="content">
                  <div class="val-header">
                    <strong>${escapeHtml(v.playerName)}</strong> a vu :
                  </div>
                  <div class="val-photo">
                    <span>📸 PHOTO_${v.timestamp}</span>
                    <div class="val-overlay">
                      <div class="val-overlay-icon">${objectSvg(obj)}</div>
                      <span>${obj.name}</span>
                    </div>
                  </div>
                  <div class="row">
                    <button class="btn btn-red btn-sm" data-validate="${i}:0">✗ Refuser</button>
                    <button class="btn btn-green btn-sm" data-validate="${i}:1">✓ Valider</button>
                  </div>
                </div>
              </div>`
            }).join('')
        }
      </div>

      <button class="btn btn-blue btn-sm mt" data-nav="game">← Retour au jeu</button>
    </section>

    <style>
      .validation-queue {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 12px;
      }
      .validation-card .content {
        padding: 12px;
      }
      .val-header {
        font-family: 'VT323', monospace;
        font-size: 18px;
        margin-bottom: 8px;
      }
      .val-photo {
        width: 100%;
        aspect-ratio: 4/3;
        background: linear-gradient(135deg, #888, #555);
        border: 2px solid var(--ink);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        position: relative;
      }
      .val-overlay {
        position: absolute;
        bottom: 6px; right: 6px;
        background: var(--ink);
        padding: 4px 6px;
        color: var(--yellow);
        font-size: 9px;
        border: 2px solid var(--yellow);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .val-overlay-icon {
        width: 16px;
        height: 16px;
      }
      .val-overlay-icon svg {
        width: 100%;
        height: 100%;
      }
    </style>
  `
}
