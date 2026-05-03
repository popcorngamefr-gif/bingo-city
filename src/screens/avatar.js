/**
 * Écran : édition d'avatar — version simplifiée
 *
 * UX : pas d'onglets, tout sur un seul écran scrollable
 *  - Avatar central animé (respire, cligne, hop à chaque changement)
 *  - Bouton 🎲 "Randomise" en haut
 *  - 4 catégories en pile, chacune avec ← → pour cycler
 *  - Compteur "n/total" pour chaque catégorie
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

          <div class="avatar lg mood-idle" id="avatar-preview" style="margin: 0 auto;">
            ${miniSkylineHtml()}
            <div class="avatar-inner">
              ${avatarLayersHtml(state.myAvatar)}
            </div>
          </div>
        </div>

        <button class="btn btn-yellow btn-sm mt" data-action="randomizeAvatar">
          🎲 Randomise
        </button>
      </div>

      <!-- Catégories scrollables avec flèches -->
      <div class="char-categories">
        ${categoryRow('skin', 'Peau', state.myAvatar.skin, PORTRAIT.skins.length)}
        ${categoryRow('hairStyle', 'Cheveux', state.myAvatar.hairStyle, PORTRAIT.hairStyles.length)}
        ${categoryRow('hairColor', 'Couleur', state.myAvatar.hairColor, PORTRAIT.hairStyles[state.myAvatar.hairStyle].colors.length)}
        ${categoryRow('eyes', 'Yeux', state.myAvatar.eyes, PORTRAIT.eyes.length)}
        ${categoryRow('acc', 'Accessoire', state.myAvatar.acc, PORTRAIT.accessories.length, accessoryLabel(state.myAvatar.acc))}
      </div>

      <button class="btn btn-red mt" data-action="confirmAvatar" style="position: relative; z-index: 5;">
        ✓ Valider mon look
      </button>

      <style>
        .char-categories {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          z-index: 5;
          margin-bottom: 16px;
        }
        .cat-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--cream-cold);
          border: 3px solid var(--ink);
          border-radius: 10px;
          padding: 10px 12px;
          box-shadow: 0 3px 0 var(--ink);
        }
        .cat-row-label {
          flex: 1;
          font-family: 'Press Start 2P', monospace;
          font-size: 9px;
          color: var(--ink);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cat-row-value {
          font-family: 'VT323', monospace;
          font-size: 14px;
          color: var(--ink-soft);
          margin-left: 6px;
        }
        .cat-arrow {
          background: linear-gradient(180deg, var(--tram-yellow) 0%, var(--tram-yellow-warm) 100%);
          border: 2px solid var(--ink);
          border-radius: 6px;
          width: 36px;
          height: 36px;
          font-family: 'Press Start 2P', monospace;
          font-size: 14px;
          color: var(--ink);
          cursor: pointer;
          box-shadow: 0 3px 0 var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          padding: 0;
          transition: transform 0.05s, box-shadow 0.05s;
        }
        .cat-arrow:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 var(--ink);
        }
        .cat-counter {
          font-family: 'Press Start 2P', monospace;
          font-size: 8px;
          color: var(--tram-red);
          min-width: 36px;
          text-align: center;
        }
      </style>
    </section>
  `
}

function categoryRow(field, label, currentIdx, total, valueLabel = null) {
  return `
    <div class="cat-row">
      <button class="cat-arrow" data-cycle="${field}:-1">◄</button>
      <div class="cat-row-label">
        ${label}
        ${valueLabel ? `<span class="cat-row-value">${valueLabel}</span>` : ''}
      </div>
      <div class="cat-counter">${currentIdx + 1}/${total}</div>
      <button class="cat-arrow" data-cycle="${field}:1">►</button>
    </div>
  `
}

function accessoryLabel(idx) {
  const a = PORTRAIT.accessories[idx]
  return a ? a.name : ''
}
