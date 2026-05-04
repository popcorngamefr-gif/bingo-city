/**
 * Écran : rejoindre une partie via code
 */

import { state }        from '../state.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'

export function renderJoin() {
  const savedName = state.myName || state.userProfile?.name || ''
  // Pré-remplir le code depuis l'URL : #join/ABCD ou ?code=ABCD
  let prefilledCode = ''
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('join/')) {
    prefilledCode = hash.slice(5).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  } else {
    const params = new URLSearchParams(window.location.search)
    const queryCode = params.get('code')
    if (queryCode) prefilledCode = queryCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  }
  return `
    <section class="screen">
      ${bgVarsovieHtml({ withTram: false, opacity: 0.4 })}

      <button class="btn-back" data-nav="home">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ REJOINDRE ★</h2>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div style="font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); margin-bottom: 8px;">
          Code de la partie
        </div>
        <input class="input input-code" id="join-code-input" placeholder="XXXX" maxlength="4" value="${prefilledCode}" />
        <p class="small center mt">Demande le code au MJ</p>
      </div>

      <div class="card mb" style="position: relative; z-index: 5;">
        <label class="label">Ton pseudo</label>
        <input class="input" id="joiner-name-input" placeholder="ex: Marek" maxlength="15" value="${savedName}" />
      </div>

      <div class="sticky-cta">
        <button class="btn btn-yellow" data-action="joinGame">
          ${icon('arrow_right', { size: 16 })} Rejoindre
        </button>
      </div>
    </section>
  `
}
