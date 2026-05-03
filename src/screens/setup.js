/**
 * Écran : MJ choisit les objets de la partie
 * 3 catégories : urbain, voyage, mémoire
 */

import { state } from '../state.js'
import { CATEGORIES, objectSvg } from '../data/objects.js'
import { icon } from '../ui/icons.js'

export function renderSetup() {
  const n = state.selectedObjects.length
  const counterClass = n < 6 ? 'warn' : ''

  return `
    <section class="screen setup-screen">
      <button class="btn-back" data-nav="lobby">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ CHOISIS LES OBJETS ★</h2>

      <div class="counter-bar ${counterClass}" id="obj-counter">
        ${n} / 25 sélectionnés (min. 6)
      </div>

      <p class="small light center mb">
        Pioche dans les 3 catégories ce que les joueurs devront repérer
      </p>

      ${CATEGORIES.map(cat => `
        <div class="category-section cat-${cat.id}">
          <div class="category-header">
            <strong>${cat.name}</strong>
            <span class="category-subtitle">${cat.subtitle}</span>
          </div>
          <div class="obj-library">
            ${cat.objects.map(obj => {
              const selected = state.selectedObjects.includes(obj.id)
              return `<div class="obj-tile ${selected ? 'selected' : ''}" data-toggle-obj="${obj.id}">
                <div class="obj-tile-icon">${objectSvg(obj)}</div>
                <div class="obj-tile-name">${obj.name}</div>
                <div class="obj-tile-points">${obj.points}pt${obj.points > 1 ? 's' : ''}</div>
                ${selected ? `<div class="obj-tile-check">${icon('check', { size: 18 })}</div>` : ''}
              </div>`
            }).join('')}
          </div>
        </div>
      `).join('')}

      <button
        class="btn btn-red mt"
        data-action="startGame"
        ${n < 6 || n > 25 ? 'disabled' : ''}
      >
        Lancer la partie ${icon('arrow_right', { size: 16 })}
      </button>
    </section>

    <style>
      .counter-bar {
        background: var(--ink);
        color: var(--tram-yellow);
        padding: 10px;
        text-align: center;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        margin-bottom: 10px;
        border: 3px solid var(--tram-yellow);
        border-radius: 6px;
        position: relative;
        z-index: 5;
      }
      .counter-bar.warn {
        color: var(--tram-red);
        border-color: var(--tram-red);
      }
      .category-section {
        margin-bottom: 16px;
        position: relative;
        z-index: 5;
      }
      .category-header {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 6px;
        padding: 6px 10px;
        background: var(--cream-warm);
        border: 2px solid var(--ink);
        border-radius: 8px;
        box-shadow: 2px 2px 0 var(--ink);
      }
      .cat-urbain .category-header {
        background: linear-gradient(180deg, #f4a4a4 0%, var(--brick) 100%);
      }
      .cat-urbain .category-header strong { color: var(--cream-cold); text-shadow: 1px 1px 0 var(--brick-dark); }
      .cat-urbain .category-header .category-subtitle { color: var(--cream-cold); opacity: 0.9; }

      .cat-voyage .category-header {
        background: linear-gradient(180deg, #fce080 0%, var(--tram-yellow-warm) 100%);
      }

      .cat-memoire .category-header {
        background: linear-gradient(180deg, #aabcc8 0%, var(--rynek-blue) 100%);
      }
      .cat-memoire .category-header strong { color: var(--cream-cold); text-shadow: 1px 1px 0 var(--ink); }
      .cat-memoire .category-header .category-subtitle { color: var(--cream-cold); opacity: 0.9; }

      .category-header strong {
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        color: var(--tram-red);
      }
      .category-subtitle {
        font-family: 'VT323', monospace;
        font-size: 14px;
        color: var(--ink-soft);
      }

      .obj-library {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
      }
      .obj-tile {
        aspect-ratio: 1;
        background: var(--cream-cold);
        border: 2px solid var(--ink);
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 4px;
        box-shadow: 2px 2px 0 var(--ink);
        transition: transform 0.05s;
      }
      .obj-tile:active { transform: scale(0.95); }
      .obj-tile.selected {
        background: linear-gradient(180deg, #fce080 0%, var(--tram-yellow) 100%);
        box-shadow: 0 0 0 3px var(--tram-red), 2px 2px 0 var(--ink);
      }
      .obj-tile-check {
        position: absolute;
        top: -6px; right: -6px;
        width: 22px; height: 22px;
        background: var(--green-go);
        border: 2px solid var(--ink);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }
      .obj-tile-icon { width: 70%; height: 55%; }
      .obj-tile-icon svg { width: 100%; height: 100%; }
      .obj-tile-name {
        font-family: 'VT323', monospace;
        font-size: 12px;
        color: var(--ink);
        text-align: center;
        line-height: 1;
        margin-top: 2px;
      }
      .obj-tile-points {
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        color: var(--tram-red);
        margin-top: 2px;
      }

      /* Bouton avec icone : flèche alignée à droite */
      .setup-screen .btn .ico {
        margin-left: 6px;
      }
    </style>
  `
}
