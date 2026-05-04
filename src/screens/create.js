/**
 * Écran : créer une partie (mode MJ)
 */

import { state }        from '../state.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'

export function renderCreate() {
  const savedName = state.myName || state.userProfile?.name || ''

  // Garde : si l'utilisateur n'a pas de compte, on bascule sur account
  if (!state.accountKey) {
    state._pendingIntent = { kind: 'create' }
    setTimeout(() => {
      import('../router.js').then(({ navigate }) => navigate('account'))
    }, 0)
    return `
      <section class="screen" style="display:flex;align-items:center;justify-content:center;">
        <p class="small light center" style="padding:20px;">
          ${icon('hourglass', { size: 16 })} Redirection vers la connexion…
        </p>
      </section>
    `
  }

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
        <input class="input mb" id="creator-name-input" placeholder="ex: Marek" maxlength="15" value="${savedName}" />

        <label class="label">Durée de la partie</label>
        <div class="duration-picker" id="duration-picker">
          <button type="button" class="duration-tile selected" data-duration="7200">2h</button>
          <button type="button" class="duration-tile" data-duration="14400">4h</button>
          <button type="button" class="duration-tile" data-duration="43200">12h</button>
          <button type="button" class="duration-tile" data-duration="86400">1 jour</button>
          <button type="button" class="duration-tile" data-duration="172800">2 jours</button>
          <button type="button" class="duration-tile" data-duration="259200">3 jours</button>
        </div>
        <p class="small light" style="font-size:11px;margin-top:6px;color:var(--ink-soft);">
          Modifiable avant le lancement
        </p>
      </div>

      <div class="sticky-cta">
        <button class="btn btn-red" data-action="createGame" data-loading-label="Création…">
          ${icon('arrow_right', { size: 16 })} Créer la partie
        </button>
      </div>
    </section>
  `
}
