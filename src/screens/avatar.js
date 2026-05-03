/**
 * Écran : édition d'avatar — fiche perso style RPG
 * Cadre avatar avec mini-skyline Varsovie au fond
 */

import { state } from '../state.js'
import { PORTRAIT } from '../data/portrait.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml, miniSkylineHtml } from '../ui/varsovie.js'

export function renderAvatar() {
  return `
    <section class="screen avatar-screen">
      ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.35 })}

      <button class="btn-back" data-nav="home">←</button>

      <h2 class="title-screen">★ TON AVATAR ★</h2>

      <!-- Fiche perso -->
      <div class="char-sheet">
        <div class="char-sheet-header">
          <div class="char-name-tag">
            <input
              type="text"
              class="char-name-input"
              id="avatar-name-input"
              value="${state.myName || 'MAREK'}"
              maxlength="12"
            />
          </div>

          <div class="avatar lg idle" style="margin: 0 auto;">
            ${miniSkylineHtml()}
            <div class="avatar-inner">
              ${avatarLayersHtml(state.myAvatar)}
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="char-stats">
          <div class="stat-row">
            <span style="font-size: 14px;">⭐</span>
            <span>Pierogi : 0</span>
          </div>
          <div class="stat-row">
            <span style="font-size: 14px;">🏆</span>
            <span>Sztampki : 0</span>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div class="tabs">
        <button class="tab active" data-tab="hair">Cheveux</button>
        <button class="tab" data-tab="hairColor">Couleur</button>
        <button class="tab" data-tab="skin">Peau</button>
        <button class="tab" data-tab="eyes">Yeux</button>
        <button class="tab" data-tab="acc">Acc.</button>
      </div>

      <!-- Zone d'options -->
      <div class="tab-content" id="char-options">
        ${renderTab('hair')}
      </div>

      <button class="btn btn-red mt" data-action="confirmAvatar" style="position: relative; z-index: 5;">
        ✓ Valider mon look
      </button>
    </section>
  `
}

/**
 * Rend la grille d'options pour un onglet donné
 */
export function renderTab(tabName) {
  switch (tabName) {
    case 'hair': return renderHairTab()
    case 'hairColor': return renderHairColorTab()
    case 'skin': return renderSkinTab()
    case 'eyes': return renderEyesTab()
    case 'acc': return renderAccTab()
    default: return ''
  }
}

function renderHairTab() {
  const skin = PORTRAIT.skins[state.myAvatar.skin]
  return `<div class="opts-grid">
    ${PORTRAIT.hairStyles.map((h, i) => {
      const hair = h.colors[state.myAvatar.hairColor] || h.colors[0]
      const sel = state.myAvatar.hairStyle === i ? 'selected' : ''
      return `<div class="opt ${sel}" data-set="hairStyle:${i}">
        <div class="layer" style="background-image:url('${skin.src}')"></div>
        <div class="layer" style="background-image:url('${hair.src}')"></div>
      </div>`
    }).join('')}
  </div>`
}

function renderHairColorTab() {
  const currentHair = PORTRAIT.hairStyles[state.myAvatar.hairStyle]
  const skin = PORTRAIT.skins[state.myAvatar.skin]
  return `<div class="opts-grid">
    ${currentHair.colors.map((c, i) => {
      const sel = state.myAvatar.hairColor === i ? 'selected' : ''
      return `<div class="opt ${sel}" data-set="hairColor:${i}">
        <div class="layer" style="background-image:url('${skin.src}')"></div>
        <div class="layer" style="background-image:url('${c.src}')"></div>
      </div>`
    }).join('')}
  </div>`
}

function renderSkinTab() {
  return `<div class="opts-grid">
    ${PORTRAIT.skins.map((s, i) => {
      const sel = state.myAvatar.skin === i ? 'selected' : ''
      return `<div class="opt ${sel}" data-set="skin:${i}">
        <img src="${s.src}" alt="Peau ${i+1}" />
      </div>`
    }).join('')}
  </div>`
}

function renderEyesTab() {
  const skin = PORTRAIT.skins[state.myAvatar.skin]
  return `<div class="opts-grid">
    ${PORTRAIT.eyes.map((e, i) => {
      const sel = state.myAvatar.eyes === i ? 'selected' : ''
      return `<div class="opt ${sel}" data-set="eyes:${i}">
        <div class="layer" style="background-image:url('${skin.src}')"></div>
        <div class="layer" style="background-image:url('${e.src}')"></div>
      </div>`
    }).join('')}
  </div>`
}

function renderAccTab() {
  return `<div class="opts-grid">
    ${PORTRAIT.accessories.map((a, i) => {
      const sel = state.myAvatar.acc === i ? 'selected' : ''
      if (!a.src) {
        return `<div class="opt ${sel}" data-set="acc:${i}">
          <div class="opt-empty">∅</div>
        </div>`
      }
      return `<div class="opt ${sel}" data-set="acc:${i}">
        <img src="${a.src}" alt="${a.name}" />
        <div class="opt-label">${a.name}</div>
      </div>`
    }).join('')}
  </div>`
}
