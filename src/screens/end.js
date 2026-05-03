/**
 * Écran : classement final + galerie de photos
 * Styles dans src/styles/screens.css
 */

import { state } from '../state.js'
import { getObject } from '../data/objects.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'
import { escapeHtml } from '../utils/html.js'

export function renderEnd() {
  // Scores aléatoires pour les bots
  state.players.forEach(p => {
    if (!p.isYou && (p.score == null || p.score === 0)) {
      p.score = Math.floor(Math.random() * 25) + 5
    }
  })

  const sorted = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winner = sorted[0]
  const title  = winner.isYou ? 'TU AS GAGNÉ !' : `${winner.name.toUpperCase()} GAGNE !`

  const medals = [
    icon('medal_gold',   { size: 28 }),
    icon('medal_silver', { size: 28 }),
    icon('medal_bronze', { size: 28 }),
  ]

  // Galerie des photos capturées
  const photoEntries = Object.entries(state.myPhotos || {})
  const photosSection = photoEntries.length > 0 ? `
    <div class="card mb photos-recap" style="position: relative; z-index: 5;">
      <div class="section-title">📷 Vos captures (${photoEntries.length})</div>
      <div class="photos-grid">
        ${photoEntries.map(([idx, dataUrl]) => {
          const cell = state.myGrid[parseInt(idx)]
          const obj  = cell ? getObject(cell.objId) : null
          return `
            <div class="photo-thumb">
              <img src="${dataUrl}" alt="${obj ? escapeHtml(obj.name) : ''}" loading="lazy" />
              <div class="photo-label">${obj ? escapeHtml(obj.name) : '?'}</div>
            </div>
          `
        }).join('')}
      </div>
    </div>
  ` : ''

  return `
    <section class="screen end-screen">
      ${bgVarsovieHtml({ opacity: 0.4 })}

      <h2 class="title-screen">${title}</h2>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div class="leaderboard">
          ${sorted.map((p, i) => `
            <div class="lb-row rank-${i + 1} ${p.hasBingo ? 'bingo' : ''}">
              <div class="lb-rank">${medals[i] || `<span class="rank-num">#${i + 1}</span>`}</div>
              <div class="avatar xs">
                <div class="avatar-inner">
                  ${avatarLayersHtml(p.avatar)}
                </div>
              </div>
              <div class="lb-name">
                ${escapeHtml(p.name)}${p.isYou ? ' (toi)' : ''}${p.isMJ ? ' [MJ]' : ''}
              </div>
              <div class="lb-score">${p.score || 0}</div>
            </div>
          `).join('')}
        </div>
      </div>

      ${photosSection}

      <div class="row mt" style="position: relative; z-index: 5;">
        <button class="btn btn-ghost btn-sm" data-nav="game">← Continuer</button>
        <button class="btn btn-red" data-action="newGame">Nouvelle partie</button>
      </div>
    </section>
  `
}
