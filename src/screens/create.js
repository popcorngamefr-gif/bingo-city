/**
 * Écran : créer une partie (mode MJ)
 */

import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'

export function renderCreate() {
  return `
    <section class="screen">
      ${bgVarsovieHtml({ withTram: false, opacity: 0.4 })}

      <button class="btn-back" data-nav="home">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ NOUVELLE PARTIE ★</h2>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div style="font-family: 'Press Start 2P', monospace; font-size: 11px; color: var(--ink); margin-bottom: 8px;">
          Tu seras le MJ
        </div>
        <p class="small mb">Tu choisis les objets à trouver, puis tu joues comme tout le monde.</p>

        <label class="label">Nom de la partie</label>
        <input class="input mb" id="game-name-input" placeholder="ex: Varsovie Mai 26" maxlength="30" />

        <label class="label">Ton pseudo</label>
        <input class="input" id="creator-name-input" placeholder="ex: Tristan" maxlength="15" />
      </div>

      <div class="row mt" style="position: relative; z-index: 5;">
        <button class="btn btn-ghost btn-sm" data-nav="home">← Retour</button>
        <button class="btn btn-red" data-action="createGame">Créer →</button>
      </div>
    </section>
  `
}
