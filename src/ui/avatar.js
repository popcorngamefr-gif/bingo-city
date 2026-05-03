/**
 * Composant Avatar — version animée + expressions
 *
 * MOODS supportés :
 *   - idle      : respire doucement, sourire neutre
 *   - walk      : marche en place, sourire
 *   - hop       : petit saut, bouche ouverte 'o'
 *   - jump      : saute haut, bouche ouverte 'O' large
 *   - dance     : danse, sourire large
 *   - sad       : triste, bouche en U inversé
 *   - excited   : excité, bouche en :D
 *   - blink (auto)
 */

import { PORTRAIT } from '../data/portrait.js'

export function avatarHtml(av, opts = {}) {
  const { size = 'md', mood = 'idle', sparkles = false } = opts
  const layers = avatarLayers(av)
  const cls = `avatar ${size} mood-${mood}${sparkles ? ' has-sparkles' : ''}`
  return `<div class="${cls}">
    <div class="avatar-inner">
      ${layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')}
      <div class="layer mouth-layer">${mouthSvg(mood)}</div>
    </div>
    ${sparkles ? sparklesHtml() : ''}
  </div>`
}

export function avatarLayersHtml(av, mood = 'idle') {
  const layers = avatarLayers(av)
  return `${layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')}
    <div class="layer mouth-layer" data-mouth>${mouthSvg(mood)}</div>`
}

export function avatarLayers(av) {
  const skin = PORTRAIT.skins[av.skin] || PORTRAIT.skins[0]
  const eyes = PORTRAIT.eyes[av.eyes] || PORTRAIT.eyes[0]
  const hairStyle = PORTRAIT.hairStyles[av.hairStyle] || PORTRAIT.hairStyles[0]
  const hairColor = hairStyle.colors[av.hairColor] || hairStyle.colors[0]
  const acc = PORTRAIT.accessories[av.acc]
  const layers = [skin.src, eyes.src, hairColor.src]
  if (acc && acc.src) layers.push(acc.src)
  return layers
}

/**
 * Génère un SVG bouche expressif selon le mood.
 * Position : en bas du cadre (autour de Y 60-70% du visage).
 */
function mouthSvg(mood) {
  // Toutes les bouches sont sur un viewBox 64x64, positionnées comme un layer du portrait.
  // Le viewBox match la grille des assets portrait.
  const ink = '#2a2228'
  const cheek = '#e88080'
  let mouth = ''

  switch (mood) {
    case 'sad':
      // U inversé + petite goutte
      mouth = `
        <path d="M 26 42 Q 32 38 38 42" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="42" cy="36" r="1.5" fill="#7a98b0" opacity="0.8"/>
      `
      break
    case 'jump':
      // Bouche ouverte large 'O'
      mouth = `
        <ellipse cx="32" cy="42" rx="4" ry="5" fill="${ink}"/>
        <ellipse cx="32" cy="44" rx="2" ry="2" fill="#a02828"/>
      `
      break
    case 'hop':
      // Petit 'o' surpris
      mouth = `
        <ellipse cx="32" cy="42" rx="2.5" ry="3" fill="${ink}"/>
      `
      break
    case 'dance':
      // Sourire large dents
      mouth = `
        <path d="M 25 40 Q 32 48 39 40 Z" fill="${ink}"/>
        <rect x="27" y="40" width="10" height="2" fill="white"/>
      `
      break
    case 'excited':
      // Sourire ouvert :D
      mouth = `
        <path d="M 25 40 Q 32 48 39 40" stroke="${ink}" stroke-width="2" fill="${ink}" stroke-linecap="round"/>
        <rect x="27" y="40" width="10" height="2" fill="white"/>
      `
      break
    case 'walk':
    case 'idle':
    default:
      // Petit sourire neutre
      mouth = `
        <path d="M 28 41 Q 32 44 36 41" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>
      `
      break
  }

  // Joues rosées pour les moods chauds
  let cheeks = ''
  if (mood === 'jump' || mood === 'dance' || mood === 'excited' || mood === 'hop') {
    cheeks = `
      <ellipse cx="22" cy="38" rx="3" ry="2" fill="${cheek}" opacity="0.55"/>
      <ellipse cx="42" cy="38" rx="3" ry="2" fill="${cheek}" opacity="0.55"/>
    `
  }

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="width:100%;height:100%;display:block;">
    ${cheeks}
    ${mouth}
  </svg>`
}

function sparklesHtml() {
  return `
    <span class="spark spark-1">✦</span>
    <span class="spark spark-2">✧</span>
    <span class="spark spark-3">✦</span>
    <span class="spark spark-4">✧</span>
  `
}

/**
 * Met à jour la bouche d'un avatar existant pour un nouveau mood
 * (sans re-render le reste de l'avatar)
 */
export function updateMouth(el, mood) {
  if (!el) return
  const mouthLayer = el.querySelector('[data-mouth]')
  if (mouthLayer) mouthLayer.innerHTML = mouthSvg(mood)
}

/**
 * Trigger un mood passager + sparkles. Auto-revert après duration.
 */
export function triggerMood(el, mood, duration = 600) {
  if (!el) return
  el.classList.remove('mood-idle', 'mood-walk', 'mood-hop', 'mood-jump', 'mood-dance', 'mood-sad', 'mood-excited')
  el.classList.add(`mood-${mood}`)
  el.classList.add('has-sparkles')
  updateMouth(el, mood)

  // Sparkles : on les ajoute physiquement si pas déjà là
  if (!el.querySelector('.spark')) {
    el.insertAdjacentHTML('beforeend', sparklesHtml())
  }

  clearTimeout(el._moodTimeout)
  el._moodTimeout = setTimeout(() => {
    el.classList.remove(`mood-${mood}`)
    el.classList.remove('has-sparkles')
    el.classList.add('mood-idle')
    updateMouth(el, 'idle')
    // Retirer les sparkles
    el.querySelectorAll('.spark').forEach(s => s.remove())
  }, duration)
}

export function startBlinkLoop(el) {
  if (!el) return () => {}
  let stopped = false
  const blink = () => {
    if (stopped) return
    el.classList.add('blinking')
    setTimeout(() => el.classList.remove('blinking'), 120)
    setTimeout(blink, 2000 + Math.random() * 3000)
  }
  setTimeout(blink, 1000 + Math.random() * 2000)
  return () => { stopped = true }
}
