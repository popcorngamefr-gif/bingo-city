/**
 * Bibliothèque d'objets urbains à trouver pendant la partie
 * Chaque objet : id, nom, points, grille pixel art (SVG inline)
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

const OBJECTS = [
  { id: 'pigeon', name: 'Pigeon', points: 1,
    grid: ['............','............','....gggg....','...gGGGGg...','..gGGwwGGo..','..gGGGGGGG..','..gGGGGGG...','...gggggG...','....g..g....','....g..g....','...oo..oo...','............'],
    pal: { g: '#5a5a6a', G: '#8a8a99', w: '#ffffff', o: '#f29022' }},
  { id: 'baguette', name: 'Baguette', points: 1,
    grid: ['............','............','............','............','..bbbbbbbb..','.bttttttttb.','bttBtBtBttb.','.bttttttttb.','..bbbbbbbb..','............','............','............'],
    pal: { b: '#8b5a2b', t: '#d4a574', B: '#5c3a1e' }},
  { id: 'velo', name: 'Vélo', points: 2,
    grid: ['............','............','....rr......','...r..r..r..','..r....r.r..','.r......rrr.','r..rrrrr...r','rrrrrrrrrrr.','.r..r.r..r..','.r.r..r.r...','..r....r....','............'],
    pal: { r: '#2a1810' }},
  { id: 'metro', name: 'Métro', points: 2,
    grid: ['............','....yyyy....','...yyyyyy...','..yyyyyyyy..','..yyMMMMyy..','..yMyyyyMy..','..yMyyyyMy..','..yyMMMMyy..','..yyyyyyyy..','..yyyyyyyy..','...y....y...','............'],
    pal: { y: '#f5cd47', M: '#2a1810' }},
  { id: 'banc', name: 'Banc', points: 1,
    grid: ['............','............','............','bbbbbbbbbbbb','bbbbbbbbbbbb','............','bbbbbbbbbbbb','bbbbbbbbbbbb','b..........b','b..........b','B..........B','............'],
    pal: { b: '#8b5a2b', B: '#5c3a1e' }},
  { id: 'stop', name: 'STOP', points: 2,
    grid: ['............','....rrrr....','...rrrrrr...','..rrrrrrrr..','..rwwwwwwr..','..rwwwwwwr..','..rwwwwwwr..','..rrrrrrrr..','...rrrrrr...','....rrrr....','......g.....','......g.....'],
    pal: { r: '#d94c3d', w: '#ffffff', g: '#5a5a6a' }},
  { id: 'cafe', name: 'Café', points: 2,
    grid: ['............','............','...bbbbb....','..b.....bb..','.b.......bb.','.b.cccc..bb.','.b.cccc..bb.','.b.cccc..bb.','.b.......bb.','..b.....bb..','...bbbbb....','............'],
    pal: { b: '#ffffff', c: '#5c3a1e' }},
  { id: 'arbre', name: 'Arbre', points: 1,
    grid: ['............','....ggg.....','...ggGgg....','..ggGGGgg...','.gGGGGGGGg..','..ggGGGgg...','...ggggg....','.....bb.....','.....bb.....','.....bb.....','....bbbb....','............'],
    pal: { g: '#6ab04c', G: '#4f8a2e', b: '#8b5a2b' }},
  { id: 'fleur', name: 'Fleur', points: 2,
    grid: ['............','...p..p.....','..pPp.pPp...','..pPpypPp...','...p.p.p....','....g.......','....g.......','...gg.......','....g.......','....g.......','....g.......','............'],
    pal: { p: '#e87ca8', P: '#d94c3d', y: '#f5cd47', g: '#6ab04c' }},
  { id: 'voiture', name: 'Voiture', points: 1,
    grid: ['............','............','....rrrrr...','...rwwwwwr..','.rrrrrrrrr..','rrwwrrrrrwr.','rrrrrrrrrrr.','r.kkr.r.kk.r','..kk.....kk.','............','............','............'],
    pal: { r: '#d94c3d', w: '#7cc5e8', k: '#2a1810' }},
  { id: 'feu', name: 'Feu rouge', points: 2,
    grid: ['............','....kkkk....','....kRRk....','....kRRk....','....kkkk....','....kYYk....','....kYYk....','....kkkk....','....kGGk....','....kGGk....','....kkkk....','.....kk.....'],
    pal: { k: '#2a1810', R: '#d94c3d', Y: '#f5cd47', G: '#6ab04c' }},
  { id: 'pharmacie', name: 'Pharmacie', points: 2,
    grid: ['............','............','....gggg....','...gggggg...','..gg.GG.gg..','..gG.GG.gg..','..GGGGGGGG..','..GGGGGGGG..','..gG.GG.gg..','..gg.GG.gg..','...gggggg...','....gggg....'],
    pal: { g: '#6ab04c', G: '#ffffff' }},
  { id: 'graffiti', name: 'Graffiti', points: 3,
    grid: ['............','...pp.bb....','..ppppbbbb..','.pppPPbbBB..','pppPPpbBBb..','ppPPpppBBb..','.pPpppyyy...','..pppyyyyy..','...yyyyy....','....yy......','............','............'],
    pal: { p: '#e87ca8', P: '#d94c3d', b: '#4a90c2', B: '#2d6a96', y: '#f5cd47' }},
  { id: 'chien', name: 'Chien', points: 2,
    grid: ['............','...bb..b....','..bbbbbbb...','..bBbbbBb...','..bbBwwBb...','..bbbBBbb...','...bbbbbb...','...bbbbbbbb.','..b.bbbb.bb.','..b.b..b..b.','..b.b..b..b.','............'],
    pal: { b: '#8b5a2b', B: '#2a1810', w: '#ffffff' }},
  { id: 'lampadaire', name: 'Lampadaire', points: 1,
    grid: ['............','....yyyy....','...yYYYYy...','...yYwwYy...','....yYYy....','.....kk.....','.....kk.....','.....kk.....','.....kk.....','.....kk.....','....kkkk....','...kkkkkk...'],
    pal: { y: '#f5cd47', Y: '#f29022', w: '#ffffff', k: '#2a1810' }},
  { id: 'glace', name: 'Glace', points: 3,
    grid: ['............','....pppp....','...ppPPpp...','...pppppp...','....cccc....','....bbbb....','....bccb....','....bbbb....','....bccb....','....bbbb....','.....bb.....','............'],
    pal: { p: '#e87ca8', P: '#d94c3d', c: '#f4e4c1', b: '#d4a574' }},
  { id: 'pomme', name: 'Pomme', points: 2,
    grid: ['............','............','......bb....','.....gg.....','....rrrr....','...rRrrRr...','..rRrrrrRr..','..rrrrrrrr..','..rrrrrrrr..','...rrrrrr...','....rrrr....','............'],
    pal: { r: '#d94c3d', R: '#a32d20', g: '#6ab04c', b: '#5c3a1e' }},
  { id: 'fontaine', name: 'Fontaine', points: 3,
    grid: ['............','......b.....','.....bbb....','....bbbbb...','....bsbsb...','...bsbsbsb..','...sssssss..','..ggggggggg.','..gGGGGGGGg.','..gGgGgGgGg.','..ggggggggg.','............'],
    pal: { b: '#7cc5e8', s: '#4a90c2', g: '#8a8a99', G: '#5a5a6a' }},
  { id: 'tour', name: 'Tour Eiffel', points: 5,
    grid: ['............','......b.....','......b.....','.....bbb....','.....b.b....','....bb.bb...','....b...b...','...bb...bb..','..bbbbbbbbb.','..b.b.b.b.b.','.bbbbbbbbbbb','............'],
    pal: { b: '#5a5a6a' }},
  { id: 'parapluie', name: 'Parapluie', points: 2,
    grid: ['............','....bbbb....','...bRRRRb...','..bRwRwRRb..','.bRRwRwRRRb.','bRRRRRRRRRRR','......k.....','......k.....','......k.....','......kk....','.......k....','............'],
    pal: { R: '#d94c3d', w: '#ffffff', b: '#a32d20', k: '#2a1810' }},
  { id: 'bouquin', name: 'Livre', points: 2,
    grid: ['............','............','..pppppppp..','..pwwwwwwp..','..pwBBBBwp..','..pwBBBBwp..','..pwwwwwwp..','..pwBBBBwp..','..pwwwwwwp..','..pppppppp..','............','............'],
    pal: { p: '#8b5fbf', w: '#f4e4c1', B: '#2a1810' }},
  { id: 'horloge', name: 'Horloge', points: 3,
    grid: ['............','....kkkkk...','...kwwwwwk..','..kwwkwkwwk.','..kwkwkwkwk.','..kwwwwwwwk.','..kwkkwwwwk.','..kwkwkwkwk.','..kwwkwkwwk.','...kwwwwwk..','....kkkkk...','............'],
    pal: { k: '#2a1810', w: '#ffffff' }},
  { id: 'taxi', name: 'Taxi', points: 3,
    grid: ['............','............','....yyyyy...','...ywwwwwy..','.yyyyyyyyy..','yywwyyyyywy.','yyyyyyyyyyy.','y.kky.y.kk.y','..kk.....kk.','............','............','............'],
    pal: { y: '#f5cd47', w: '#7cc5e8', k: '#2a1810' }},
  { id: 'cigarette', name: 'Mégot', points: 1,
    grid: ['............','............','............','............','............','....rrr.....','....bwwwwwww','....bwwwwwww','....rrr.....','............','............','............'],
    pal: { r: '#d94c3d', b: '#f29022', w: '#f4e4c1' }},
  { id: 'panier', name: 'Poubelle', points: 1,
    grid: ['............','............','..gggggggg..','..gGGGGGGg..','..gGGGGGGg..','..gGGGGGGg..','..gGGGGGGg..','..gGGGGGGg..','..gGGGGGGg..','..ggggggggg.','............','............'],
    pal: { g: '#5a5a6a', G: '#2a1810' }},
  { id: 'masque', name: 'Masque', points: 3,
    grid: ['............','............','...wwwwww...','..wwwwwwww..','.wwwwwwwwww.','wwwwwwwwwwww','kwwwwwwwwwwk','kwwwwwwwwwwk','kwwwwwwwwwwk','wwwwwwwwwwww','.wwwwwwwwww.','............'],
    pal: { w: '#7cc5e8', k: '#4a90c2' }},
  { id: 'ballon', name: 'Ballon', points: 2,
    grid: ['............','....rrrrr...','...rrwwwrr..','..rwrrrrwwr.','..rrrwwrrrr.','..rwrrrrwrr.','..rrrrwrrrr.','..rwrrrrrrr.','...rrwrrrr..','....rrrrr...','............','............'],
    pal: { r: '#d94c3d', w: '#ffffff' }},
]

export function getObjects() {
  return OBJECTS
}

export function getObject(id) {
  return OBJECTS.find(o => o.id === id)
}

export function objectSvg(obj) {
  return pixelSvg(obj.grid, obj.pal)
}
