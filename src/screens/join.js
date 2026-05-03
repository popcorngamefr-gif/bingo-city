/**
 * Écran : rejoindre une partie via code
 */

import { state }        from '../state.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'

export function renderJoin() {
  const savedName = state.myName || state.userProfile?.name || ''
  return `
    <section class="screen">
      ${bgVarsovieHtml({ withTram: false, opacity: 0.4 })}

      <button class="btn-back" data-nav="home">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ REJOINDRE ★</h2>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div style="font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); margin-bottom: 8px;">
          Code de la partie
        </div>
        <input class="input input-code" id="join-code-input" placeholder="XXXX" maxlength="4" />
        <p class="small center mt">Demande le code au MJ</p>
      </div>

      <div class="card mb" style="position: relative; z-index: 5;">
        <label class="label">Ton pseudo</label>
        <input class="input" id="joiner-name-input" placeholder="ex: Marek" maxlength="15" value="${savedName}" />
      </div>

      <div class="row mt" style="position: relative; z-index: 5;">
        <button class="btn btn-ghost btn-sm" data-nav="home">← Retour</button>
        <button class="btn btn-yellow" data-action="joinGame">Rejoindre →</button>
      </div>
    </section>
  `
}
