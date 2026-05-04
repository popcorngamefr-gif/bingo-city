/**
 * Écran : chargement des 3 GIFs d'animation
 * Affiché pendant la génération, re-rendu à chaque GIF reçu.
 */

import { state } from '../state.js'
import { icon }  from '../ui/icons.js'

const ANIM_META = {
  idle:  { label: 'Neutre + Clin d\'œil', emoji: 'idle' },
  sad:   { label: 'Triste + Furieux',     emoji: 'sad'  },
  laugh: { label: 'Mort de rire',         emoji: 'laugh' },
}

export function renderAnimationsLoading() {
  const anims = state.myAnimations || {}
  const keys  = ['idle', 'sad', 'laugh']
  const done  = keys.filter(k => anims[k] !== undefined).length
  const ready = anims._ready

  const msgs = [
    'L\'IA réfléchit à comment t\'animer…',
    'Premiers pixels en mouvement…',
    'Plus qu\'une animation…',
    '★ Tout est prêt !',
  ]
  const msgIdx = Math.min(done, msgs.length - 1)

  return `
    <section class="screen anim-loading-screen">

      <h2 class="title-screen">★ DÉGLINGO IA ★</h2>

      <p class="anim-loading-msg ${ready ? 'done' : ''}">${msgs[msgIdx]}</p>

      <!-- 3 tuiles GIF -->
      <div class="anim-grid">
        ${keys.map(key => {
          const url   = anims[key]
          const meta  = ANIM_META[key]
          const state_= url !== undefined ? (url ? 'ready' : 'error') : 'pending'

          return `
            <div class="anim-tile anim-tile--${state_}">
              <div class="anim-tile-preview">
                ${url
                  ? `<img src="${url}" alt="${meta.label}" class="anim-tile-gif" />`
                  : `<div class="anim-tile-spinner">
                       ${state_ === 'error'
                         ? icon('cross', { size: 24 })
                         : '<div class="gen-pixel-spinner" style="width:32px;height:32px;margin:auto;"></div>'
                       }
                     </div>`
                }
              </div>
              <div class="anim-tile-label">${meta.label}</div>
            </div>
          `
        }).join('')}
      </div>

      <!-- Barre progression -->
      <div class="anim-progress-wrap">
        <div class="anim-progress-bar">
          <div class="anim-progress-fill" style="width:${(done / keys.length) * 100}%"></div>
        </div>
        <div class="anim-progress-text">${done}/3 animations générées</div>
      </div>

      <!-- Preview enchainée quand tout est prêt -->
      ${ready ? _renderPreview(anims) : ''}

      <!-- Sticky CTA -->
      ${ready ? `
        <div class="sticky-cta">
          <button class="btn btn-red" data-action="validateAnimations">
            ${icon('check', { size: 16 })} Valider mes animations
          </button>
        </div>
      ` : ''}

    </section>
  `
}

function _renderPreview(anims) {
  return `
    <div class="anim-preview-section">
      <div class="section-title">Aperçu — les 3 s'enchaînent en jeu</div>
      <div class="anim-preview-player">
        <div class="anim-preview-track" id="anim-preview-track">
          ${['idle', 'sad', 'laugh'].filter(k => anims[k]).map(k => `
            <img
              src="${anims[k]}"
              alt="${ANIM_META[k].label}"
              class="anim-preview-frame"
              data-anim="${k}"
            />
          `).join('')}
        </div>
        <div class="anim-preview-dots">
          ${['idle', 'sad', 'laugh'].filter(k => anims[k]).map((k, i) => `
            <div class="anim-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `
}
