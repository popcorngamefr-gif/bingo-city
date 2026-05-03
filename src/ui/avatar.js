/**
 * Composant Avatar
 * Rend un avatar en superposant les couches : skin → eyes → hair → accessoire
 */

import { PORTRAIT } from '../data/portrait.js'

/**
 * Génère le HTML d'un avatar à partir de sa config
 * @param {Object} av - { skin, eyes, hairStyle, hairColor, acc }
 * @param {String} size - 'sm' | 'md' | 'lg'
 * @param {Boolean} idle - active l'animation idle
 */
export function avatarHtml(av, size = 'md', idle = false) {
  const layers = avatarLayers(av)
  const cls = `avatar ${size}${idle ? ' idle' : ''}`
  return `<div class="${cls}">
    ${layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')}
  </div>`
}

/**
 * Retourne juste le HTML des couches (pour insertion dans un container)
 */
export function avatarLayersHtml(av) {
  const layers = avatarLayers(av)
  return layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')
}

/**
 * Liste les sources d'images d'un avatar dans l'ordre de superposition
 */
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
