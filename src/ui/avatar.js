/**
 * Composant Avatar — version animée
 *
 * MOODS supportés (ajoutés en classe CSS sur l'élément .avatar) :
 *   - idle      : respire doucement (par défaut)
 *   - walk      : marche en place (wobble + bob)
 *   - blink     : cligne des yeux (déclenché aléatoirement par triggerBlink)
 *   - hop       : petit saut (changement d'option dans le créateur)
 *   - jump      : saute haut (case validée)
 *   - dance     : danse (bingo gagné)
 *   - sad       : triste (refus de photo)
 *   - excited   : excité (pending validation)
 *
 * Sparkles : ajoutés via .avatar.has-sparkles
 */

import { PORTRAIT } from '../data/portrait.js'

export function avatarHtml(av, opts = {}) {
  const { size = 'md', mood = 'idle', sparkles = false } = opts
  const layers = avatarLayers(av)
  const cls = `avatar ${size} mood-${mood}${sparkles ? ' has-sparkles' : ''}`
  return `<div class="${cls}">
    <div class="avatar-inner">
      ${layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')}
    </div>
    ${sparkles ? sparklesHtml() : ''}
  </div>`
}

export function avatarLayersHtml(av) {
  const layers = avatarLayers(av)
  return layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')
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

function sparklesHtml() {
  return `
    <span class="spark spark-1">✦</span>
    <span class="spark spark-2">✧</span>
    <span class="spark spark-3">✦</span>
    <span class="spark spark-4">✧</span>
  `
}

/**
 * Déclenche un mood passager sur un élément avatar.
 * Le mood revient à 'idle' (ou au mood précédent) après duration ms.
 */
export function triggerMood(el, mood, duration = 600) {
  if (!el) return
  // Retirer les autres moods passagers
  el.classList.remove('mood-hop', 'mood-jump', 'mood-dance', 'mood-sad', 'mood-excited')
  el.classList.add(`mood-${mood}`)
  el.classList.add('has-sparkles')
  setTimeout(() => {
    el.classList.remove(`mood-${mood}`)
    el.classList.remove('has-sparkles')
    el.classList.add('mood-idle')
  }, duration)
}

/**
 * Démarre une boucle de clignements aléatoires sur un avatar
 * Retourne une fonction de cleanup
 */
export function startBlinkLoop(el) {
  if (!el) return () => {}
  let stopped = false
  const blink = () => {
    if (stopped) return
    el.classList.add('blinking')
    setTimeout(() => el.classList.remove('blinking'), 120)
    // Prochain clignement entre 2 et 5 secondes
    setTimeout(blink, 2000 + Math.random() * 3000)
  }
  setTimeout(blink, 1000 + Math.random() * 2000)
  return () => { stopped = true }
}
