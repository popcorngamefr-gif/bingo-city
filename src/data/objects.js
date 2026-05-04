import { state } from '../state.js'
/**
 * Bibliothèque d'objets bingo — Varsovie Édition
 * 3 catégories :
 *  - urbain : objets à repérer dans la rue à Varsovie
 *  - voyage : trucs spécifiques à un trip de groupe
 *  - memoire : moments/blagues du voyage à cocher
 */

function pixelSvg(grid, palette) {
  const size = grid.length
  let cells = ''
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x]
      if (c === '.' || c === ' ') continue
      const color = palette[c] || c
      cells += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`
    }
  }
  return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`
}

const URBAIN = [
  { id: 'tram_red', name: 'Tram rouge', points: 1,
    grid: ['............','............','...rrrrrrr..','..rrwwwwwrr.','.rrwwwwwwwr.','.rwwwwwwwwr.','.rrrrrrrrrr.','.rrrrrrrrrr.','.r.kk..kk.r.','.r.kk..kk.r.','............','............'],
    pal: { r: '#d04848', w: '#c0c8d0', k: '#2a2228' }},
  { id: 'palais', name: 'Palais Culture', points: 3,
    grid: ['......k.....','......k.....','.....kkk....','.....ggg....','....ggggg...','....ggggg...','...ggggggg..','..ggggggggg.','..ggggggggg.','.gggggggggg.','gggggggggggg','............'],
    pal: { g: '#a8a6a0', k: '#6a6a68' }},
  { id: 'pierogi', name: 'Pierogi', points: 1,
    grid: ['............','............','............','...yyyyyy...','..yYYYYYYy..','..yYYYYYYy..','..yYYYYYYy..','..yyyyyyyy..','...kkkkkk...','............','............','............'],
    pal: { y: '#f0d090', Y: '#f8e4b0', k: '#a87858' }},
  { id: 'vodka', name: 'Vodka', points: 2,
    grid: ['............','......kk....','......gg....','.....gggg...','....gggggg..','....gwwwwg..','....gwwwwg..','....gRRRRg..','....gRRRRg..','....gggggg..','....gggggg..','............'],
    pal: { g: '#a8a6a0', w: '#fbf3e0', R: '#d04848', k: '#5a4858' }},
  { id: 'cigogne', name: 'Cigogne', points: 2,
    grid: ['............','............','...wwww.....','..wwwwwwk...','.wwwwwwk....','wwwwww......','wwwww.......','...wwk......','...www......','....k.......','....k.......','............'],
    pal: { w: '#ffffff', k: '#2a2228' }},
  { id: 'zubr', name: 'Żubr', points: 3,
    grid: ['............','...kk..k....','..kkkkkkk...','..kbkkkbk...','..kkbwwbkk..','..kkkbbkkk..','...kkkkkk...','...kkkkkkk..','..k.kkkk.k..','..k.k..k.k..','..k.k..k.k..','............'],
    pal: { k: '#5a4858', b: '#2a2228', w: '#f0c860' }},
  { id: 'kiosk', name: 'Kiosque', points: 2,
    grid: ['............','...kkkkkkk..','..kRRRRRRRk.','..krrrrrrrk.','..kwwwwwwwk.','..kwppppwk..','..kwppppwk..','..kwwwwwwk..','..kwwwwwwk..','..kkkkkkkk..','............','............'],
    pal: { k: '#2a2228', R: '#d04848', r: '#a02828', w: '#fbf3e0', p: '#3a2a3e' }},
  { id: 'metro', name: 'Bouche M', points: 2,
    grid: ['............','...kkkkkk...','..kRRRRRRk..','.kRRwMRRRk..','.kRwMMMwRk..','.kRMMMMMRk..','.kRwMMMwRk..','.kRRRRRRRk..','..kkkkkkk...','...gggggg...','...gggggg...','............'],
    pal: { k: '#2a2228', R: '#d04848', w: '#fbf3e0', M: '#f0c860', g: '#6a6a68' }},
  { id: 'panneau_rouge', name: 'STOP', points: 2,
    grid: ['............','....rrrr....','...rrrrrr...','..rrrrrrrr..','..rwwwwwwr..','..rwwwwwwr..','..rwwwwwwr..','..rrrrrrrr..','...rrrrrr...','....rrrr....','......g.....','......g.....'],
    pal: { r: '#d04848', w: '#fbf3e0', g: '#5a4858' }},
  { id: 'tramcarte', name: 'Ticket tram', points: 1,
    grid: ['............','.kkkkkkkkkk.','.kwwwwwwwwk.','.kwYYYYYYwk.','.kwYBBBBYwk.','.kwYBBBBYwk.','.kwYYYYYYwk.','.kwwwwwwwwk.','.kwBBBBBBwk.','.kwwwwwwwwk.','.kkkkkkkkkk.','............'],
    pal: { k: '#2a2228', w: '#fbf3e0', Y: '#f0c860', B: '#7a98b0' }},
  { id: 'fenetre', name: 'Fenêtre déco', points: 1,
    grid: ['............','..kkkkkkkk..','..kbbbbbbk..','..kbwwwwbk..','..kbwBBwbk..','..kbwBBwbk..','..kbwwwwbk..','..kbwwwwbk..','..kbwwwwbk..','..kbbbbbbk..','..kkkkkkkk..','............'],
    pal: { k: '#2a2228', b: '#7a4848', w: '#c0c8d0', B: '#7a98b0' }},
  { id: 'velo_orange', name: 'Vélo Veturilo', points: 2,
    grid: ['............','............','....oo......','...o..o..o..','..o....o.o..','.o......ooo.','o..ooooo...o','oooooooooooo','.o..o.o..o..','.o.o..o.o...','..o....o....','............'],
    pal: { o: '#e8a838' }},
  { id: 'graff', name: 'Graff Mur', points: 3,
    grid: ['............','...rr.bb....','..rrrrbbbb..','.rrrRRbbBB..','rrrRRrbBBb..','rrRRrrrBBb..','.rRrrrryyy..','..rrryyyyy..','...yyyyy....','....yy......','............','............'],
    pal: { r: '#d04848', R: '#a02828', b: '#7a98b0', B: '#3d5a72', y: '#f0c860' }},
]

const VOYAGE = [
  { id: 'shot', name: 'Shot żubrówka', points: 2,
    grid: ['............','............','..kkkkkkkk..','..kwwwwwwk..','..kwggggwk..','..kwggggwk..','..kwggggwk..','..kwwwwwwk..','...kkkkkk...','....kkkk....','....kkkk....','............'],
    pal: { k: '#2a2228', w: '#c0c8d0', g: '#86a890' }},
  { id: 'biere', name: 'Bière', points: 1,
    grid: ['............','...kkkkkk...','..kwwwwwwk..','..kwYYYYwk..','..kwYYYYwk..','..kwYYYYwk..','..kwYYYYwk..','..kwYYYYwk..','..kwYYYYwk..','..kwYYYYwk..','...kkkkkk...','............'],
    pal: { k: '#2a2228', w: '#fbf3e0', Y: '#e8a838' }},
  { id: 'pierogi_assiette', name: 'Pierogi resto', points: 2,
    grid: ['............','............','...wwwwwww..','..wwYYYYYww.','.wwYyyyyYwww','.wYyYYYyYww.','.wYyYYYyYww.','.wwYyyyyYww.','..wwYYYYYww.','...wwwwwww..','............','............'],
    pal: { w: '#fbf3e0', Y: '#f0d090', y: '#f8e4b0' }},
  { id: 'taxi_app', name: 'Taxi/Uber', points: 1,
    grid: ['............','............','....yyyyy...','...ywwwwwy..','.yyyyyyyyy..','yywwyyyyywy.','yyyyyyyyyyy.','y.kky.y.kk.y','..kk.....kk.','............','............','............'],
    pal: { y: '#f0c860', w: '#7a98b0', k: '#2a2228' }},
  { id: 'airbnb', name: 'Clés Airbnb', points: 1,
    grid: ['............','............','...kkk......','..kk.kk.....','..k...k.....','..k...k.....','..kk.kk.....','...kkkk.....','......kk....','......kkkk..','........kkk.','............'],
    pal: { k: '#e8a838' }},
  { id: 'plan_metro', name: 'Plan métro', points: 1,
    grid: ['............','.kkkkkkkkkk.','.kwwwwwwwwk.','.kwRwwBBwwk.','.kwwRwwBwwk.','.kwwwRBwwwk.','.kwwBwRwwwk.','.kwBwwwRwwk.','.kBwwwwwRwk.','.kwwwwwwwwk.','.kkkkkkkkkk.','............'],
    pal: { k: '#2a2228', w: '#fbf3e0', R: '#d04848', B: '#7a98b0' }},
  { id: 'doner', name: 'Zapiekanka', points: 2,
    grid: ['............','............','............','..yyyyyyyy..','.yYYYYYYYYy.','.yYrrrrrrYy.','.yYgrrrrgYy.','.yYgggggrYy.','.yYYYYYYYYy.','..yyyyyyyy..','............','............'],
    pal: { y: '#f0d090', Y: '#e8a838', r: '#d04848', g: '#86a890' }},
  { id: 'chambre', name: 'Chambre AirB', points: 2,
    grid: ['............','............','.kkkkkkkkkk.','.kbbbbbbbbk.','.kbwwwwwwbk.','.kbwYYYYwbk.','.kbwYBBYwbk.','.kbwYYYYwbk.','.kbwwwwwwbk.','.kbbbbbbbbk.','.kkkkkkkkkk.','............'],
    pal: { k: '#2a2228', b: '#a8746a', w: '#fbf3e0', Y: '#f0d090', B: '#7a98b0' }},
  { id: 'photo_groupe', name: 'Photo groupe', points: 2,
    grid: ['............','...kkkkkkkk.','..kwwwwwwwk.','..kwAAAAAAk.','..kwBCCCCBk.','..kwBCDDCBk.','..kwBCDDCBk.','..kwwwwwwwk.','..kwwwwwwwk.','..kkkkkkkkk.','............','............'],
    pal: { k: '#2a2228', w: '#fbf3e0', A: '#7a98b0', B: '#a8746a', C: '#f0d090', D: '#3a2a3e' }},
  { id: 'shopping', name: 'Sac shopping', points: 1,
    grid: ['............','...k.....k..','...k.....k..','..kRRRRRRRk.','..kRRRRRRRk.','..kRRRRRRRk.','..kRwwwwRk..','..kRwYYwRk..','..kRRRRRRk..','..kkkkkkkk..','............','............'],
    pal: { k: '#2a2228', R: '#d04848', w: '#fbf3e0', Y: '#f0c860' }},
]

const MEMOIRE = [
  { id: 'perdu', name: 'Perdu en chemin', points: 2,
    grid: ['............','............','......?.....','.....???....','....??.??...','....??.??...','......??....','.....??.....','............','......?.....','............','............'],
    pal: { '?': '#a02828' }},
  { id: 'vomi', name: 'Vomi mémorable', points: 3,
    grid: ['............','......o.....','.....ooo....','....ooooo...','...ggggggg..','..gggggggg..','..ggggggggg.','...gggggggg.','...gggggg...','....gggg....','............','............'],
    pal: { g: '#86a890', o: '#e8a838' }},
  { id: 'kebab_3am', name: 'Kebab à 3h', points: 2,
    grid: ['............','............','............','..yyyyyyyy..','.yYYYYYYYYy.','.yYrrrrrrYy.','.yYrrrrrrYy.','.yYrrrrrrYy.','.yYYYYYYYYy.','..yyyyyyyy..','......zzz...','............'],
    pal: { y: '#f0d090', Y: '#e8a838', r: '#d04848', z: '#fbf3e0' }},
  { id: 'reveille_tot', name: 'En retard', points: 2,
    grid: ['............','...kkkkkkk..','..kwwwwwwwk.','..kw.....wk.','..kw..k..wk.','..kw..k..wk.','..kw..kkkwk.','..kw.....wk.','..kwwwwwwwk.','...kkkkkkk..','............','............'],
    pal: { k: '#2a2228', w: '#fbf3e0' }},
  { id: 'selfie', name: 'Selfie cliché', points: 1,
    grid: ['............','............','...wwwwwww..','..wkkkkkkkw.','..wkkggkkw..','..wkgggggw..','..wkgggggw..','..wkkkkkkw..','...wwwwwww..','......w.....','............','............'],
    pal: { w: '#a8a6a0', k: '#2a2228', g: '#7a98b0' }},
  { id: 'crush', name: 'Crush au bar', points: 3,
    grid: ['............','...rr..rr...','..rrrrrrrr..','..rRrrrrRr..','..rrRrrrRr..','...rRrrRr...','....rRRr....','.....rr.....','............','............','............','............'],
    pal: { r: '#d04848', R: '#a02828' }},
  { id: 'argent', name: 'Pris la note', points: 2,
    grid: ['............','............','..yyyyyyyy..','..yYYYYYYy..','..yYwwwwYy..','..yYw$$wYy..','..yYw$$wYy..','..yYwwwwYy..','..yYYYYYYy..','..yyyyyyyy..','............','............'],
    pal: { y: '#f0c860', Y: '#e8a838', w: '#fbf3e0', '$': '#86a890' }},
  { id: 'photo_palais', name: 'Photo Palais', points: 1,
    grid: ['............','...kkkkkk...','..kwwwwwwk..','..kwgggggk..','..kwgkggk_..','..kwggggwk..','..kwwwwwwk..','...kwwwwwk..','....kwwwwk..','.....kkkk...','............','............'],
    pal: { k: '#2a2228', w: '#fbf3e0', g: '#a8a6a0' }},
  { id: 'taxi_engueul', name: 'Taxi galère', points: 2,
    grid: ['............','............','....yyyyy...','...y!www!y..','.yyyyyyyyy..','yyyyyyyyyyy.','y.kky.y.kk.y','..kk.....kk.','............','............','............','............'],
    pal: { y: '#f0c860', w: '#fbf3e0', k: '#2a2228', '!': '#d04848' }},
]

export const CATEGORIES = [
  { id: 'urbain', name: 'Urbain', subtitle: 'À voir dans la rue', objects: URBAIN },
  { id: 'voyage', name: 'Voyage', subtitle: 'Spécifique au trip', objects: VOYAGE },
  { id: 'memoire', name: 'Mémoire', subtitle: 'Blagues du groupe', objects: MEMOIRE },
]

const ALL = [...URBAIN, ...VOYAGE, ...MEMOIRE]

export function getObjects() {
  return ALL
}

export function getObject(id) {
  const std = ALL.find(o => o.id === id)
  if (std) return std
  // Fallback sur les objets custom créés par le MJ
  return (state.customObjects || []).find(o => o.id === id)
}

export function objectSvg(obj) {
  if (!obj) return ''
  // Objets custom : pas de grid, juste un nom d'icône
  if (obj.icon && !obj.grid) {
    // Renvoie un placeholder ; l'icône réelle est rendue côté UI via icon()
    return `<span data-custom-icon="${obj.icon}"></span>`
  }
  return pixelSvg(obj.grid, obj.pal)
}
