/**
 * Génération d'avatar aléatoire
 * Utilise PORTRAIT comme source de vérité pour les totaux.
 */

import { PORTRAIT } from '../data/portrait.js'

export function randomAvatar() {
  const hairStyle = Math.floor(Math.random() * PORTRAIT.hairStyles.length)
  return {
    skin:      Math.floor(Math.random() * PORTRAIT.skins.length),
    eyes:      Math.floor(Math.random() * PORTRAIT.eyes.length),
    hairStyle,
    hairColor: Math.floor(Math.random() * PORTRAIT.hairStyles[hairStyle].colors.length),
    acc:       Math.floor(Math.random() * PORTRAIT.accessories.length),
  }
}
