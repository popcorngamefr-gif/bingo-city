/**
 * Écran : chargement de l'animation vidéo
 * Affiché pendant la génération wan-2.2-i2v-fast (~40-80s).
 */

import { state } from '../state.js'
import { icon }  from '../ui/icons.js'

export function renderAnimationsLoading() {
  const anim  = state.myAnimation
  const ready = !!anim?.url
  const error = anim?.error

  return `
    <section class="screen anim-loading-screen">

      <h2 class="title-screen">★ DÉGLINGO IA ★</h2>

      <p class="anim-loading-msg ${ready ? 'done' : ''}">
        ${ready  ? 'Tout est prêt !'
        : error  ? 'Oups, une erreur est survenue'
                 : 'L\\'IA donne vie à ton avatar…'}
      </p>

      <!-- Preview vidéo grand format -->
      <div class="anim-video-wrap ${ready ? 'ready' : ''}">
        ${ready
          ? `<video
              src="${anim.url}"
              autoplay loop muted playsinline
              class="anim-video-preview"
            ></video>`
          : error
            ? `<div class="anim-video-error">
                ${icon('alert', { size: 48 })}
                <p style="font-size:13px;margin-top:8px;">${error}</p>
              </div>`
            : `<div class="anim-video-loading">
                <div class="gen-pixel-spinner" style="width:48px;height:48px;"></div>
                <p style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--tram-yellow);margin-top:14px;">
                  GÉNÉRATION VIDÉO<br>~1 minute
                </p>
              </div>`
        }
      </div>

      ${!ready && !error ? `
        <div class="anim-progress-wrap">
          <div class="anim-progress-bar">
            <div class="anim-progress-fill anim-progress-indeterminate"></div>
          </div>
          <div class="anim-progress-text">L'IA réfléchit…</div>
        </div>
      ` : ''}

      <!-- CTAs -->
      ${ready ? `
        <div class="sticky-cta">
          <button class="btn btn-red" data-action="validateAnimations">
            ${icon('check', { size: 16 })} Valider mon animation
          </button>
        </div>
      ` : error ? `
        <div class="sticky-cta">
          <button class="btn btn-cream btn-sm" data-nav="avatar-pick">Retour</button>
          <button class="btn btn-red" data-action="openExpressionsGen">
            ${icon('retry', { size: 14 })} Réessayer
          </button>
        </div>
      ` : ''}

    </section>
  `
}
