/**
 * Avatar Controller
 * Gère le refresh chirurgical de l'UI avatar, les cycles de catégorie,
 * les boucles de clignement et les interactions avec le HUD de jeu.
 */

import { state } from '../state.js'
import { PORTRAIT } from '../data/portrait.js'
import {
  avatarLayersHtml,
  triggerMood,
  startBlinkLoop,
  setConfidence,
  calcConfidence,
} from '../ui/avatar.js'

// ─── Refresh de l'écran avatar ────────────────────────────────────────────────

/**
 * Update chirurgical de l'avatar et des compteurs sans re-render l'écran.
 * Évite le flash blanc à chaque clic sur les flèches.
 */
export function refreshAvatarUI({ mood = 'hop', sparkles = true, duration = 500 } = {}) {
  if (state.currentScreen !== 'avatar') return

  const previewEl = document.getElementById('avatar-preview')
  if (previewEl) {
    const inner = previewEl.querySelector('.avatar-inner')
    if (inner) {
      const currentMoodClass = [...previewEl.classList].find(c => c.startsWith('mood-')) || 'mood-idle'
      const currentMood = currentMoodClass.replace('mood-', '')
      inner.innerHTML = avatarLayersHtml(state.myAvatar, currentMood)
    }
    triggerMood(previewEl, mood, { duration })
  }

  updateCategoryCounters()
}

/**
 * Met à jour les compteurs et labels des catégories (sans re-render).
 */
export function updateCategoryCounters() {
  const fields = [
    { id: 'skin',      total: PORTRAIT.skins.length },
    { id: 'hairStyle', total: PORTRAIT.hairStyles.length },
    { id: 'hairColor', total: PORTRAIT.hairStyles[state.myAvatar.hairStyle].colors.length },
    { id: 'eyes',      total: PORTRAIT.eyes.length },
    { id: 'acc',       total: PORTRAIT.accessories.length },
  ]

  fields.forEach(f => {
    const counter = document.querySelector(`[data-counter="${f.id}"]`)
    if (counter) counter.textContent = `${state.myAvatar[f.id] + 1}/${f.total}`
  })

  const accLabel = document.querySelector('[data-acc-label]')
  if (accLabel) {
    const acc = PORTRAIT.accessories[state.myAvatar.acc]
    accLabel.textContent = acc ? acc.name : ''
  }
}

/**
 * Cycle un champ d'avatar (skin / hairStyle / hairColor / eyes / acc).
 */
export function cycleAvatarField(field, dir) {
  const totals = {
    skin:      PORTRAIT.skins.length,
    eyes:      PORTRAIT.eyes.length,
    hairStyle: PORTRAIT.hairStyles.length,
    hairColor: PORTRAIT.hairStyles[state.myAvatar.hairStyle].colors.length,
    acc:       PORTRAIT.accessories.length,
  }
  const total = totals[field]
  if (!total) return

  let cur = (state.myAvatar[field] || 0)
  state.myAvatar[field] = (cur + dir + total) % total

  // Si on change de hairStyle, clamp hairColor dans la nouvelle range
  if (field === 'hairStyle') {
    const newColors = PORTRAIT.hairStyles[state.myAvatar.hairStyle].colors.length
    if (state.myAvatar.hairColor >= newColors) state.myAvatar.hairColor = 0
  }

  refreshAvatarUI({ mood: 'hop', sparkles: true, duration: 500 })
}

// ─── Blink loops ──────────────────────────────────────────────────────────────

let blinkCleanup    = null
let hudBlinkCleanup = null

export function setupAvatarLoops() {
  if (blinkCleanup)    blinkCleanup()
  if (hudBlinkCleanup) hudBlinkCleanup()

  const previewEl = document.getElementById('avatar-preview')
  if (previewEl) blinkCleanup = startBlinkLoop(previewEl)

  const hudEl = document.querySelector('.hud-avatar .avatar')
  if (hudEl) hudBlinkCleanup = startBlinkLoop(hudEl)
}

// ─── HUD avatar (pendant la partie) ──────────────────────────────────────────

/**
 * Trigger un mood sur l'avatar dans le HUD.
 * @param {string} mood
 * @param {object|number} opts - objet { duration, emote, persist } ou nombre (duration seule)
 */
export function triggerHudAvatar(mood, opts = {}) {
  const el = document.querySelector('.hud-avatar .avatar')
  if (!el) return
  if (typeof opts === 'number') opts = { duration: opts }
  triggerMood(el, mood, opts)
}

/**
 * Met à jour la confidence de l'avatar HUD selon la progression de la grille.
 * timid (<20%) → neutral → confident (≥60%) → proud (≥85%)
 */
export function updateHudConfidence() {
  const el = document.querySelector('.hud-avatar .avatar')
  if (!el) return
  const validated = state.myGrid.filter(c => c.status === 'validated').length
  const conf = calcConfidence(validated, state.myGrid.length)
  setConfidence(el, conf)
}

/**
 * Bascule l'avatar en heartbeat persistent quand il reste ≤ 2 cases.
 */
export function checkHeartbeat() {
  const el = document.querySelector('.hud-avatar .avatar')
  if (!el) return
  const validated = state.myGrid.filter(c => c.status === 'validated').length
  const total     = state.myGrid.length
  if (total > 0 && validated >= total - 2 && validated < total) {
    triggerMood(el, 'heartbeat', { persist: true, emote: 'heart' })
  }
}
