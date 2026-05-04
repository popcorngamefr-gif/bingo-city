/**
 * Écran : édition d'avatar — version simplifiée + update chirurgical
 * Styles dans src/styles/screens.css
 *
 * IMPORTANT : si l'utilisateur revient en arrière sans valider,
 * on restaure l'état initial pour ne pas perdre l'avatar IA précédent
 * ou les choix précédents. Le snapshot est pris au render et restauré
 * via l'action `cancelAvatarEdit` (bouton retour).
 */

import { state } from '../state.js'
import { PORTRAIT } from '../data/portrait.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml, miniSkylineHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'

export function renderAvatar() {
  // Snapshot de l'avatar tel qu'il était à l'entrée (deep copy simple suffisante)
  // Restauré dans main.js / cancelAvatarEdit si l'user fait "retour"
  state._avatarSnapshot = JSON.parse(JSON.stringify(state.myAvatar || {}))
  state._myNameSnapshot = state.myName || ''

  return `
    <section class="screen avatar-screen">
      ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.35 })}

      <button class="btn-back" data-action="cancelAvatarEdit">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ TON AVATAR ★</h2>

      <div class="char-sheet">
        <div class="char-sheet-header">
          <div class="char-name-tag">
            <input
              type="text"
              class="char-name-input"
              id="avatar-name-input"
              value="${state.myName || state.accountKey || ''}"
              maxlength="12"
            />
          </div>

          <div class="avatar lg mood-idle" id="avatar-preview" style="margin: 0 auto;">
            ${miniSkylineHtml()}
            <div class="avatar-inner">
              ${avatarLayersHtml(state.myAvatar, 'idle')}
            </div>
          </div>
        </div>

        <button class="btn btn-yellow btn-sm mt" data-action="randomizeAvatar">
          ${icon('dice', { size: 16 })}
          Randomise
        </button>
      </div>

      <div class="char-categories">
        ${categoryRow('skin',      'Peau',       state.myAvatar.skin,      PORTRAIT.skins.length)}
        ${categoryRow('hairStyle', 'Cheveux',    state.myAvatar.hairStyle, PORTRAIT.hairStyles.length)}
        ${categoryRow('hairColor', 'Couleur',    state.myAvatar.hairColor, PORTRAIT.hairStyles[state.myAvatar.hairStyle].colors.length)}
        ${categoryRow('eyes',      'Yeux',       state.myAvatar.eyes,      PORTRAIT.eyes.length)}
        ${categoryRow('acc',       'Accessoire', state.myAvatar.acc,       PORTRAIT.accessories.length, accessoryLabel(state.myAvatar.acc), true)}
      </div>

      <div class="sticky-cta">
        <button class="btn btn-red" data-action="confirmAvatar">
          ✓ Valider mon look
        </button>
      </div>
    </section>
  `
}

function categoryRow(field, label, currentIdx, total, valueLabel = null, isAcc = false) {
  return `
    <div class="cat-row">
      <button class="cat-arrow" data-cycle="${field}:-1">◄</button>
      <div class="cat-row-label">
        ${label}
        ${valueLabel ? `<span class="cat-row-value" ${isAcc ? 'data-acc-label' : ''}>${valueLabel}</span>` : ''}
      </div>
      <div class="cat-counter" data-counter="${field}">${currentIdx + 1}/${total}</div>
      <button class="cat-arrow" data-cycle="${field}:1">►</button>
    </div>
  `
}

function accessoryLabel(idx) {
  const a = PORTRAIT.accessories[idx]
  return a ? a.name : ''
}
