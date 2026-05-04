/**
 * Écran : MJ choisit les objets de la partie
 * Styles dans src/styles/screens.css
 */

import { state } from '../state.js'
import { CATEGORIES, objectSvg } from '../data/objects.js'
import { icon } from '../ui/icons.js'

export function renderSetup() {
  const n            = state.selectedObjects.length
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

      <!-- Section objets custom créés par le MJ -->
      <div class="category-section cat-custom">
        <div class="category-header">
          <strong>Tes objets perso</strong>
          <span class="category-subtitle">Crée tes propres défis</span>
        </div>
        <div class="obj-library">
          ${(state.customObjects || []).map(obj => {
            const selected = state.selectedObjects.includes(obj.id)
            return `<div class="obj-tile ${selected ? 'selected' : ''}" data-toggle-obj="${obj.id}">
              <div class="obj-tile-icon">${icon(obj.icon, { size: 36 })}</div>
              <div class="obj-tile-name">${obj.name}</div>
              <div class="obj-tile-points">${obj.points}pt${obj.points > 1 ? 's' : ''}</div>
              ${selected ? `<div class="obj-tile-check">${icon('check', { size: 18 })}</div>` : ''}
            </div>`
          }).join('')}
          <div class="obj-tile obj-tile--add" data-action="openCustomObjPicker">
            <div class="obj-tile-icon obj-tile-add-icon">${icon('plus', { size: 36 })}</div>
            <div class="obj-tile-name">Ajouter</div>
            <div class="obj-tile-points">Custom</div>
          </div>
        </div>
      </div>

      <div class="sticky-cta">
        <button
          class="btn btn-red"
          data-action="startGame"
          data-loading-label="Démarrage…"
          ${n < 6 || n > 25 ? 'disabled' : ''}
        >
          Lancer la partie ${icon('arrow_right', { size: 16 })}
        </button>
      </div>
    </section>
  `
}
