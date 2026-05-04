/**
 * Bibliothèque d'icônes pixel art en SVG
 *
 * Toutes les icônes utilisent un viewBox 16x16 (ou multiples) et la palette
 * Varsovie 88. Pour les couleurs, on hard-code en hex (les CSS vars ne marchent
 * pas dans les attributs SVG fill côté HTML).
 *
 * Usage :
 *   import { icon } from '../ui/icons.js'
 *   const html = icon('check', { size: 18 })
 */

const PALETTE = {
  ink: '#2a2228',
  inkSoft: '#5a4858',
  cream: '#ece4d4',
  red: '#d04848',
  redDark: '#a02828',
  yellow: '#f0c860',
  yellowWarm: '#e8a838',
  green: '#6a9070',
  greenDark: '#4a6850',
  blue: '#7a98b0',
  blueDark: '#3d5a72',
  white: '#ffffff',
  brick: '#a8746a',
}

/**
 * Génère un SVG à partir d'une grille de pixels.
 * grid : tableau de strings ou de matrices, où chaque caractère = un pixel
 * pal : map char -> color hex
 */
function px(grid, pal) {
  const size = grid.length
  let cells = ''
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x]
      if (c === '.' || c === ' ') continue
      const color = pal[c] || c
      cells += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`
    }
  }
  return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;">${cells}</svg>`
}

// =====================================================
// ICONS — chaque clé renvoie une fonction qui retourne le SVG
// =====================================================
const ICONS = {

  // Carte de bingo cochée (pour bouton "Créer une partie")
  bingo_card: () => px([
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwRwwRwwwwwk..',
    '..kwwwwwwRwwwk..',
    '..kwwRwwwwwwwk..',
    '..kwwwwwwwwRwk..',
    '..kwwwwRwwwwwk..',
    '..kwwwwwwwwwwk..',
    '..kwwRwwwRwwwk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
    '................',
  ], { k: PALETTE.ink, w: PALETTE.cream, R: PALETTE.red }),

  // Maillon de chaîne (pour bouton "Rejoindre")
  link: () => px([
    '................',
    '...yyyy.........',
    '..yyyyyy........',
    '.yy....yy.......',
    '.y......y.......',
    '.y......y.......',
    '.yy....yyyyy....',
    '..yyyyyyyyyyy...',
    '...yyyyyyyyyy...',
    '......yy....yy..',
    '......y......y..',
    '......y......y..',
    '......yy....yy..',
    '.......yyyyyy...',
    '........yyyy....',
    '................',
  ], { y: PALETTE.yellow }),

  // Pierogi en demi-lune (forme classique)
  pierogi: () => px([
    '................',
    '................',
    '......kkk.......',
    '....kkyYYkk.....',
    '...kyYYYYYYk....',
    '..kyYYYYYYYYk...',
    '..kyYYYYYYYYk...',
    '..kyYYYYYYYYk...',
    '...kKKKKKKKK....',
    '....KKKKKKK.....',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ], { k: '#2a2228', y: '#e8a838', Y: '#f0c860', K: '#a87858' }),

  // Étoile dorée (5 branches classiques)
  star: () => px([
    '................',
    '.......kk.......',
    '......kYYk......',
    '......kYYk......',
    '..kkkkkYYkkkkk..',
    '..kYYYYYYYYYYk..',
    '..kYYYYYYYYYYk..',
    '...kYYYYYYYYk...',
    '....kYYYYYYk....',
    '....kYYkkYYk....',
    '...kYYk..kYYk...',
    '..kYYk....kYYk..',
    '..kk........kk..',
    '................',
    '................',
    '................',
  ], { k: PALETTE.yellowWarm, Y: PALETTE.yellow }),

  // Sablier (pour le timer)
  hourglass: () => px([
    '................',
    '..kkkkkkkkkkkk..',
    '..kkkkkkkkkkkk..',
    '..yyyyyyyyyyyy..',
    '...yyyyyyyyyy...',
    '....yyyyyyyy....',
    '.....yyyyyy.....',
    '......yyyy......',
    '......yyyy......',
    '.....y....y.....',
    '....y......y....',
    '...y........y...',
    '..kkkkkkkkkkkk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ], { k: PALETTE.ink, y: PALETTE.yellow }),

  // Trophée (coupe simple)
  trophy: () => px([
    '................',
    '..kkkkkkkkkkkk..',
    '..kyYYYYYYYYyk..',
    '..kyYYYYYYYYyk..',
    '..kyYYYYYYYYyk..',
    '..kyYYYYYYYYyk..',
    '..kyyYYYYYYyyk..',
    '...kkyYYYYykk...',
    '.....kyyyyk.....',
    '......kyyk......',
    '.....kkyykk.....',
    '....kkkkkkkk....',
    '...kkkkkkkkkk...',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ], { k: PALETTE.ink, y: PALETTE.yellowWarm, Y: PALETTE.yellow }),

  // Robot (pour IA)
  robot: () => px([
    '................',
    '......kkkkkk....',
    '......k....k....',
    '......kRYYYRk...',
    '......kRRRRRk...',
    '....kkkkkkkkkk..',
    '...k..k.RR.k..k.',
    '...k..k.RR.k..k.',
    '...k..kkkkkk..k.',
    '...k..........k.',
    '...kkkkkkkkkkkk.',
    '....k.k....k.k..',
    '....k.k....k.k..',
    '....k.k....k.k..',
    '...kkkk...kkkk..',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red, Y: PALETTE.yellow }),

  // Caméra (pour modal photo)
  camera: () => px([
    '................',
    '................',
    '......kkkk......',
    '....kkkkkkkk....',
    '..kkkkkkkkkkkk..',
    '..kgggggggggk...',
    '..kg..kkkk..gk..',
    '..kg.kbbbbk.gk..',
    '..kg.kbBBbk.gk..',
    '..kg.kbbbbk.gk..',
    '..kg..kkkk..gk..',
    '..kggggggggggk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
  ], { k: PALETTE.ink, g: PALETTE.inkSoft, b: PALETTE.blueDark, B: PALETTE.blue }),

  // Check (validé)
  check: () => px([
    '................',
    '............gg..',
    '...........gGg..',
    '..........gGgg..',
    '.........gGg....',
    '...g....gGg.....',
    '..gGg..gGg......',
    '..gGggGg........',
    '...gGGg.........',
    '....gg..........',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ], { g: PALETTE.greenDark, G: PALETTE.green }),

  // Cross (refusé)
  cross: () => px([
    '................',
    '...rr......rr...',
    '..rRRr....rRRr..',
    '...rRRr..rRRr...',
    '....rRRrrRRr....',
    '.....rRRRRr.....',
    '......rRRr......',
    '.....rRRRRr.....',
    '....rRRrrRRr....',
    '...rRRr..rRRr...',
    '..rRRr....rRRr..',
    '...rr......rr...',
    '................',
    '................',
    '................',
    '................',
  ], { r: PALETTE.redDark, R: PALETTE.red }),

  // Cœur rouge (pour heartbeat)
  heart: () => px([
    '................',
    '...rr....rr.....',
    '..rRRr..rRRr....',
    '.rRRRRrrRRRRr...',
    '.rRRRRRRRRRRr...',
    '.rRRRRRRRRRRr...',
    '..rRRRRRRRRr....',
    '...rRRRRRRr.....',
    '....rRRRRr......',
    '.....rRRr.......',
    '......rr........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ], { r: PALETTE.redDark, R: PALETTE.red }),

  // Question mark
  question: () => px([
    '................',
    '......kkkk......',
    '.....kRRRRk.....',
    '....kRR..RRk....',
    '....kk....RRk...',
    '..........RRk...',
    '.........RRk....',
    '........RRk.....',
    '.......RRk......',
    '......RRk.......',
    '......RR........',
    '......kk........',
    '................',
    '......kk........',
    '......RR........',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red }),

  // Exclamation (!)
  exclam: () => px([
    '................',
    '.......kk.......',
    '......kRRk......',
    '......kRRk......',
    '......kRRk......',
    '......kRRk......',
    '......kRRk......',
    '......kRRk......',
    '......kRRk......',
    '......kRRk......',
    '................',
    '......kkk.......',
    '......kRk.......',
    '......kkk.......',
    '................',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red }),

  // Flèche gauche (pour btn-back, ou dans les cycle)
  arrow_left: () => px([
    '................',
    '.......kk.......',
    '......kRk.......',
    '.....kRRk.......',
    '....kRRRk.......',
    '...kRRRRkkkkkk..',
    '..kRRRRRRRRRRRk.',
    '..kRRRRRRRRRRRk.',
    '...kRRRRkkkkkk..',
    '....kRRRk.......',
    '.....kRRk.......',
    '......kRk.......',
    '.......kk.......',
    '................',
    '................',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red }),

  // Flèche droite
  arrow_right: () => px([
    '................',
    '.......kk.......',
    '.......kRk......',
    '.......kRRk.....',
    '.......kRRRk....',
    '..kkkkkkRRRRk...',
    '..kRRRRRRRRRRk..',
    '..kRRRRRRRRRRk..',
    '..kkkkkkRRRRk...',
    '.......kRRRk....',
    '.......kRRk.....',
    '.......kRk......',
    '.......kk.......',
    '................',
    '................',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red }),

  // Dé à 6 faces (randomise)
  dice: () => px([
    '................',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwkwwwwwkwwk..',
    '..kwwwwwwwwwwk..',
    '..kwwwwkwwwwwk..',
    '..kwwwwwwwwwwk..',
    '..kwwkwwwwwkwk..',
    '..kwwwwwwwwwwk..',
    '..kwwkwwkwwwwk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
    '................',
    '................',
  ], { k: PALETTE.ink, w: PALETTE.cream }),

  // Bouteille (pour le footer "Na zdrowie")
  bottle: () => px([
    '................',
    '......kkkk......',
    '......kggk......',
    '......kggk......',
    '.....kggggk.....',
    '....kggggggk....',
    '....kgwwwwgk....',
    '....kgwRRwgk....',
    '....kgwRRwgk....',
    '....kgwwwwgk....',
    '....kggggggk....',
    '....kggggggk....',
    '....kggggggk....',
    '....kkkkkkkk....',
    '................',
    '................',
  ], { k: PALETTE.ink, g: '#a8a6a0', w: PALETTE.cream, R: PALETTE.red }),

  // Médaille or (1er) — étoile centrale dorée + ruban rouge
  medal_gold: () => px([
    '................',
    '......kkkk......',
    '.....kRRRRk.....',
    '....kRRwwRRk....',
    '....kRwwwwRk....',
    '...kkkkkkkkkk...',
    '..kyYYYYYYYYyk..',
    '..kyYYY##YYYyk..',
    '..kyYY####YYYk..',
    '..kyY######Yyk..',
    '..kyYY####YYYk..',
    '..kyYYY##YYYYk..',
    '..kyYYYYYYYYyk..',
    '...kyYYYYYYyk...',
    '....kkkkkkkk....',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red, w: '#fbe49c', y: PALETTE.yellowWarm, Y: PALETTE.yellow, '#': '#fbe49c' }),

  // Médaille argent (2e)
  medal_silver: () => px([
    '................',
    '......kkkk......',
    '.....kRRRRk.....',
    '....kRRwwRRk....',
    '....kRwwwwRk....',
    '...kkkkkkkkkk...',
    '..kgGGGGGGGGgk..',
    '..kgGGG##GGGgk..',
    '..kgGG####GGgk..',
    '..kgG######Ggk..',
    '..kgGG####GGgk..',
    '..kgGGG##GGGGk..',
    '..kgGGGGGGGGgk..',
    '...kgGGGGGGgk...',
    '....kkkkkkkk....',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red, w: '#fbe49c', g: '#888888', G: '#cccccc', '#': '#ffffff' }),

  // Médaille bronze (3e)
  medal_bronze: () => px([
    '................',
    '......kkkk......',
    '.....kRRRRk.....',
    '....kRRwwRRk....',
    '....kRwwwwRk....',
    '...kkkkkkkkkk...',
    '..kbBBBBBBBBbk..',
    '..kbBBB##BBBbk..',
    '..kbBB####BBBk..',
    '..kbB######Bbk..',
    '..kbBB####BBBk..',
    '..kbBBB##BBBBk..',
    '..kbBBBBBBBBbk..',
    '...kbBBBBBBbk...',
    '....kkkkkkkk....',
    '................',
  ], { k: PALETTE.ink, R: PALETTE.red, w: '#fbe49c', b: '#7a4848', B: '#a8746a', '#': '#d4a4a4' }),

  // Plus (+) pour incréments
  plus: () => px([
    '................',
    '................',
    '......kkkk......',
    '......kggk......',
    '......kggk......',
    '..kkkkkggkkkk...',
    '..kgggggggggk...',
    '..kgggggggggk...',
    '..kkkkkggkkkk...',
    '......kggk......',
    '......kggk......',
    '......kkkk......',
    '................',
    '................',
    '................',
    '................',
  ], { k: PALETTE.ink, g: PALETTE.green }),

  // Sparkle / étoile décorative
  sparkle: () => px([
    '................',
    '.......kk.......',
    '......kYYk......',
    '.......YY.......',
    '...k.........k..',
    '..kY.........Yk.',
    '...k.........k..',
    '......kYYk......',
    '.......YY.......',
    '.......kk.......',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ], { k: PALETTE.yellowWarm, Y: PALETTE.yellow }),

  // ── Utilisateur / profil ──────────────────────────────────────────────────
  user: () => px([
    '................',
    '................',
    '................',
    '......RRRR......',
    '.....RRRRRR.....',
    '.....RRRRRR.....',
    '......RRRR......',
    '................',
    '...RRRRRRRRRR...',
    '..RRRRRRRRRRRR..',
    '.RRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRRR.',
    '................',
    '................',
    '................',
    '................',
  ], { R: PALETTE.ink }),

  // ── Selfie / visage + caméra ──────────────────────────────────────────────
  selfie: () => px([
    'R.............R.',
    'R.....GGGG....R.',
    'R....GGGGGG...R.',
    'R....GGGGGG...R.',
    'R.....GGGG....R.',
    'R.GGGGGGGGGG..R.',
    'RGGGGGGGGGGGG.R.',
    'R.............R.',
    'RRRRRRRRRRRRRR..',
  ], { R: PALETTE.ink, G: PALETTE.green }),

  // ── Alerte / erreur ───────────────────────────────────────────────────────
  alert: () => px([
    '................',
    '......RRR.......',
    '.....RRRRR......',
    '....RRkRRRR.....',
    '...RRkkRRRRR....',
    '..RRkkkkRRRRR...',
    '.RRkRRRkRRRRR...',
    'RRRkRRRkRRRRRR..',
    'RRRkkkkkRRRRRR..',
    'RRRRRRRRRRRRRR..',
    '................',
  ], { R: PALETTE.red, k: PALETTE.cream }),

  // ── Scan / IA ─────────────────────────────────────────────────────────────
  scan: () => px([
    'RR..........RR..',
    'R................',
    'R...kkkkkk...R..',
    '....k....k......',
    '....k.GG.k......',
    '....k.GG.k......',
    '....k....k......',
    'R...kkkkkk...R..',
    'R................',
    'RR..........RR..',
  ], { R: PALETTE.yellow, k: PALETTE.ink, G: PALETTE.red }),

  // ── Retour / undo ─────────────────────────────────────────────────────────
  retry: () => px([
    '................',
    '....kkkkkk......',
    '...kk....kk.....',
    '..kk......kk....',
    '.k..........k...',
    '.k....kk....k...',
    '.k...kkk....k...',
    '.k..kkkkkk..k...',
    '..kk...kkkkkk...',
    '...kk...........', 
    '....kkkkkk......',
    '................',
  ], { k: PALETTE.ink }),

}

/**
 * Retourne le HTML d'une icône.
 * @param {String} name - clé dans ICONS
 * @param {Object} opts
 * @param {Number} opts.size - taille en px (default: 18)
 * @param {String} opts.cls  - classes CSS supplémentaires
 */
export function icon(name, opts = {}) {
  const { size = 18, cls = '' } = opts
  const iconFn = ICONS[name]
  if (!iconFn) {
    console.warn(`Icon not found: ${name}`)
    return ''
  }
  return `<span class="ico ${cls}" style="width:${size}px;height:${size}px;display:inline-flex;flex-shrink:0;">${iconFn()}</span>`
}

/**
 * Pour usages dans les bulles emote etc — juste le SVG sans wrapper
 */
export function iconSvg(name) {
  const iconFn = ICONS[name]
  if (!iconFn) return ''
  return iconFn()
}

export const ICON_NAMES = Object.keys(ICONS)
