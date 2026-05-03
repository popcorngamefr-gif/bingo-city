/**
 * Écran : édition d'avatar — fiche perso style RPG
 * Inspiré de la référence image 1 (Stardew-like)
 */

import { state } from '../state.js'
import { PORTRAIT } from '../data/portrait.js'
import { avatarLayersHtml } from '../ui/avatar.js'

export function renderAvatar() {
  return `
    <section class="screen avatar-screen">
      <h2 class="title-screen">★ Ton avatar ★</h2>

      <!-- Carte fiche perso (cadre bois principal) -->
      <div class="frame frame-wood char-sheet">
        <div class="content">
          <!-- En-tête : nom + avatar grand -->
          <div class="char-header">
            <div class="char-name-tag">
              <input
                type="text"
                class="char-name-input"
                id="avatar-name-input"
                value="${state.myName || 'CHARLIE'}"
                maxlength="12"
              />
            </div>
            <div class="char-portrait-wrap">
              <div class="frame frame-beige">
                <div class="content avatar-preview-content">
                  <div class="avatar lg idle" id="avatar-preview">
                    ${avatarLayersHtml(state.myAvatar)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Onglets de catégorie -->
          <div class="char-tabs">
            <button class="char-tab active" data-tab="hair">Cheveux</button>
            <button class="char-tab" data-tab="hairColor">Couleur</button>
            <button class="char-tab" data-tab="skin">Peau</button>
            <button class="char-tab" data-tab="eyes">Yeux</button>
            <button class="char-tab" data-tab="acc">Accessoire</button>
          </div>

          <!-- Zone d'options (change selon l'onglet actif) -->
          <div class="char-options" id="char-options">
            ${renderTab('hair')}
          </div>
        </div>
      </div>

      <button class="btn btn-orange btn-block mt" data-action="confirmAvatar">
        Valider l'avatar →
      </button>
    </section>

    <style>
      /* Styles spécifiques à l'écran avatar */
      .char-sheet { margin-bottom: 12px; }
      .char-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        gap: 8px;
      }
      .char-name-tag {
        background: var(--paper);
        border: 2px solid var(--ink);
        padding: 4px 12px;
        box-shadow: 2px 2px 0 var(--ink);
        position: relative;
      }
      .char-name-tag::before, .char-name-tag::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 8px; height: 4px;
        background: var(--wood-dark);
        transform: translateY(-50%);
      }
      .char-name-tag::before { left: -6px; }
      .char-name-tag::after { right: -6px; }
      .char-name-input {
        background: transparent;
        border: none;
        outline: none;
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        color: var(--ink);
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        width: 110px;
      }
      .char-portrait-wrap {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: center;
        margin: 4px 0;
      }
      .avatar-preview-content {
        padding: 4px;
      }
      #avatar-preview {
        width: 96px;
        height: 96px;
      }

      .char-tabs {
        display: flex;
        gap: 2px;
        padding: 0 8px;
        margin-bottom: -3px;
        position: relative;
        z-index: 2;
      }
      .char-tab {
        background: var(--wood-mid);
        color: var(--paper);
        border: 2px solid var(--ink);
        border-bottom: none;
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        padding: 6px 4px;
        flex: 1;
        cursor: pointer;
        text-transform: uppercase;
        text-shadow: 1px 1px 0 var(--ink);
        box-shadow: inset 0 2px 0 var(--wood-light);
        transition: background 0.1s;
      }
      .char-tab.active {
        background: var(--paper);
        color: var(--ink);
        text-shadow: none;
        box-shadow: inset 0 2px 0 white;
      }

      .char-options {
        background: var(--paper);
        border: 3px solid var(--ink);
        padding: 10px;
        min-height: 200px;
      }
      .char-options .opts-grid {
        margin-bottom: 0;
      }
    </style>
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
        <img src="${s.src}" alt="Peau ${i+1}">
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
          <div class="opt-text">∅</div>
          <div class="opt-label">Aucun</div>
        </div>`
      }
      return `<div class="opt ${sel}" data-set="acc:${i}">
        <img src="${a.src}" alt="${a.name}">
        <div class="opt-label">${a.name}</div>
      </div>`
    }).join('')}
  </div>`
}
