/**
 * Custom Object Picker
 * Permet au MJ de créer un objet bingo custom : nom + visuel choisi parmi plusieurs icônes.
 */

import { icon } from './icons.js'

// Liste d'icônes disponibles pour les objets custom
// On reprend les noms d'icônes existants dans icons.js
const ICON_CHOICES = [
  'pierogi', 'bottle', 'star', 'heart',
  'sparkle', 'camera', 'trophy', 'dice',
  'medal_gold', 'medal_silver', 'medal_bronze', 'robot',
]

// Niveaux de points sélectionnables
const POINTS_CHOICES = [
  { value: 1, label: 'Facile',  desc: '1 pt'  },
  { value: 2, label: 'Moyen',   desc: '2 pts' },
  { value: 3, label: 'Hard',    desc: '3 pts' },
]

/**
 * Ouvre le modal de création d'objet custom.
 * @param {Function} onCreate — callback({ id, name, icon, points }) quand l'objet est créé
 */
export function openCustomObjPicker(onCreate) {
  const root = document.getElementById('modal-root')

  root.innerHTML = `
    <div class="modal show">
      <div class="custom-obj-modal-box">

        <div class="custom-obj-header">
          <div class="custom-obj-title">
            ${icon('sparkle', { size: 16 })} CRÉE TON OBJET
          </div>
          <p class="custom-obj-subtitle">Un truc spécifique à ton groupe ?</p>
        </div>

        <div class="custom-obj-body">

          <label class="custom-obj-label">Nom de l'objet</label>
          <input
            type="text"
            id="custom-obj-name"
            class="input"
            placeholder="ex: Marek qui rote"
            maxlength="30"
          />

          <label class="custom-obj-label" style="margin-top:14px;">Choisis une icône</label>
          <div class="custom-obj-icons">
            ${ICON_CHOICES.map((iconName, i) => `
              <div class="custom-obj-icon-tile ${i === 0 ? 'selected' : ''}" data-icon="${iconName}">
                ${icon(iconName, { size: 28 })}
              </div>
            `).join('')}
          </div>

          <label class="custom-obj-label" style="margin-top:14px;">Difficulté</label>
          <div class="custom-obj-points">
            ${POINTS_CHOICES.map((p, i) => `
              <div class="custom-obj-points-tile ${i === 0 ? 'selected' : ''}" data-points="${p.value}">
                <div class="custom-obj-points-label">${p.label}</div>
                <div class="custom-obj-points-desc">${p.desc}</div>
              </div>
            `).join('')}
          </div>

        </div>

        <div class="custom-obj-actions">
          <button class="btn btn-ghost btn-sm" id="custom-obj-cancel">Annuler</button>
          <button class="btn btn-red" id="custom-obj-confirm" disabled>
            ${icon('check', { size: 16 })} Ajouter
          </button>
        </div>

      </div>
    </div>
  `

  let selectedIcon   = ICON_CHOICES[0]
  let selectedPoints = 1
  const nameInput    = document.getElementById('custom-obj-name')
  const confirmBtn   = document.getElementById('custom-obj-confirm')

  // Validation nom
  nameInput.addEventListener('input', () => {
    confirmBtn.disabled = nameInput.value.trim().length < 2
  })

  // Sélection icône
  document.querySelectorAll('.custom-obj-icon-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      document.querySelectorAll('.custom-obj-icon-tile').forEach(t => t.classList.remove('selected'))
      tile.classList.add('selected')
      selectedIcon = tile.dataset.icon
    })
  })

  // Sélection points
  document.querySelectorAll('.custom-obj-points-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      document.querySelectorAll('.custom-obj-points-tile').forEach(t => t.classList.remove('selected'))
      tile.classList.add('selected')
      selectedPoints = parseInt(tile.dataset.points, 10)
    })
  })

  // Validation
  confirmBtn.addEventListener('click', () => {
    const name = nameInput.value.trim()
    if (name.length < 2) return
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    onCreate({ id, name, icon: selectedIcon, points: selectedPoints })
    closeCustomObjPicker()
  })

  // Annulation
  document.getElementById('custom-obj-cancel').addEventListener('click', closeCustomObjPicker)

  // Auto-focus pour saisir tout de suite
  setTimeout(() => nameInput.focus(), 50)
}

export function closeCustomObjPicker() {
  const root = document.getElementById('modal-root')
  if (root) root.innerHTML = ''
}
