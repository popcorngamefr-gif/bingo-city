/**
 * Configuration du Portrait Generator
 * Définit les chemins vers les assets et les options disponibles
 */

import { resolveAsset } from '../utils/assets.js'

const HAIR_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 22, 25]
const HAIR_NAMES = [
  'Court', 'Long', 'Bouclé', 'Crête', 'Lisse',
  'Frangé', 'Chignon', 'Tresses', 'Mohawk', 'Pompadour',
  'Pixie', 'Carré', 'Mèche', 'Punk', 'Rasta',
]

const ACCESSORIES = [
  { name: 'Aucun', file: null },
  { name: 'Lunettes', file: 'glasses' },
  { name: 'Monocle', file: 'monocle' },
  { name: 'Snapback', file: 'snapback' },
  { name: 'Casq. flic', file: 'cop' },
  { name: 'Détective', file: 'detective' },
  { name: 'Bonnet', file: 'beanie' },
  { name: 'Cagoule', file: 'bataclava' },
  { name: 'Moustache', file: 'mustache' },
  { name: 'Barbe', file: 'beard' },
  { name: 'Masque', file: 'mask' },
  { name: 'Cône party', file: 'party' },
  { name: 'Coccinelle', file: 'ladybug' },
  { name: 'Boulon', file: 'bolt' },
  { name: 'Cerveau', file: 'brain' },
]

export const PORTRAIT = {
  // 9 teintes de peau
  skins: Array.from({ length: 9 }, (_, i) => ({
    id: i,
    src: resolveAsset(`/assets/portrait/skins/skin_${i + 1}.png`),
  })),

  // 7 paires d'yeux
  eyes: Array.from({ length: 7 }, (_, i) => ({
    id: i,
    src: resolveAsset(`/assets/portrait/eyes/eyes_${String(i + 1).padStart(2, '0')}.png`),
  })),

  // 15 styles de coiffure × 7 couleurs chacun
  hairStyles: HAIR_NUMBERS.map((num, idx) => ({
    id: idx,
    name: HAIR_NAMES[idx] || `Style ${num}`,
    colors: Array.from({ length: 7 }, (_, c) => ({
      id: c,
      src: resolveAsset(`/assets/portrait/hair/hair_${String(num).padStart(2, '0')}_${c + 1}.png`),
    })),
  })),

  // Accessoires (le 0 = aucun)
  accessories: ACCESSORIES.map((a, idx) => ({
    id: idx,
    name: a.name,
    src: a.file ? resolveAsset(`/assets/portrait/acc/${a.file}.png`) : null,
  })),
}
