/**
 * Écran : MJ choisit les objets de la partie
 */

import { state } from '../state.js'
import { getObjects, objectSvg } from '../data/objects.js'

export function renderSetup() {
  const objects = getObjects()
  const n = state.selectedObjects.length
  const counterClass = n < 6 ? 'warn' : ''

  return `
    <section class="screen setup-screen">
      <h2 class="title-screen">★ Choisis les objets ★</h2>

      <div class="counter-bar ${counterClass}" id="obj-counter">
        ${n} / 25 sélectionnés (min. 6)
      </div>

      <p class="small light center mb">
        Tape sur les objets que les joueurs devront repérer dans la rue
      </p>

      <div class="obj-library" id="obj-library">
        ${objects.map(obj => {
          const selected = state.selectedObjects.includes(obj.id)
          return `<div class="obj-tile ${selected ? 'selected' : ''}" data-toggle-obj="${obj.id}">
            <div class="obj-tile-icon">${objectSvg(obj)}</div>
            <div class="obj-tile-name">${obj.name}</div>
            <div class="obj-tile-points">${obj.points}pt${obj.points > 1 ? 's' : ''}</div>
          </div>`
        }).join('')}
      </div>

      <button
        class="btn btn-orange btn-block mt"
        data-action="startGame"
        ${n < 6 || n > 25 ? 'disabled' : ''}
      >
        Lancer la partie →
      </button>
    </section>

    <style>
      .counter-bar {
        background: var(--ink);
        color: var(--yellow);
        padding: 10px;
        text-align: center;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        margin-bottom: 10px;
        border: 3px solid var(--yellow);
      }
      .counter-bar.warn {
        color: var(--red);
        border-color: var(--red);
      }
      .obj-library {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 12px;
      }
      .obj-tile {
        aspect-ratio: 1;
        background: var(--paper);
        border: 2px solid var(--wood-dark);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 4px;
        box-shadow: 2px 2px 0 var(--wood-shadow);
        transition: transform 0.05s;
      }
      .obj-tile:active { transform: scale(0.95); }
      .obj-tile.selected {
        background: var(--yellow);
        box-shadow: 0 0 0 3px var(--orange), 2px 2px 0 var(--ink);
      }
      .obj-tile.selected::after {
        content: '✓';
        position: absolute;
        top: -6px; right: -6px;
        width: 22px; height: 22px;
        background: var(--green);
        color: white;
        border: 2px solid var(--ink);
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }
      .obj-tile-icon { width: 70%; height: 55%; }
      .obj-tile-icon svg { width: 100%; height: 100%; }
      .obj-tile-name {
        font-family: 'VT323', monospace;
        font-size: 13px;
        color: var(--ink);
        text-align: center;
        line-height: 1;
        margin-top: 2px;
      }
      .obj-tile-points {
        font-family: 'Press Start 2P', monospace;
        font-size: 7px;
        color: var(--orange);
        margin-top: 2px;
      }
    </style>
  `
}
