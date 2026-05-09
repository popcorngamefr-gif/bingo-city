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
import { safeImg } from '../utils/media.js'

export function renderEnd() {
  const isPreview = !!state._previewClassement
  const sorted = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const winner = sorted[0]
  const hasScores = sorted.some(p => (p.score || 0) > 0)
  const title  = isPreview ? 'CLASSEMENT EN COURS'
                : !winner ? 'PARTIE TERMINÉE'
                : !hasScores ? 'PARTIE TERMINÉE'
                : winner.isYou ? 'TU AS GAGNÉ !'
                : `${winner.name.toUpperCase()} GAGNE !`

  const medals = [
    icon('medal_gold',   { size: 28 }),
    icon('medal_silver', { size: 28 }),
    icon('medal_bronze', { size: 28 }),
  ]

  // Galerie globale : toutes les photos de tous les joueurs (sync via Firestore)
  const allPhotos = state.gamePhotos || []  // [{ url, objId, uid, ... }]

  // Groupe par joueur
  const playersById = {}
  state.players.forEach(p => { playersById[p.id] = p })

  const photosByPlayer = {}
  allPhotos.forEach(photo => {
    const player = playersById[photo.uid]
    const key    = photo.uid
    if (!photosByPlayer[key]) photosByPlayer[key] = { player, photos: [] }
    photosByPlayer[key].photos.push(photo)
  })

  // Si pas de photos remontées via Firestore, fallback sur mes photos locales
  if (Object.keys(photosByPlayer).length === 0 && state.myPhotos && Object.keys(state.myPhotos).length > 0) {
    const me = state.players.find(p => p.isYou)
    photosByPlayer[me?.id || 'me'] = {
      player: me,
      photos: Object.entries(state.myPhotos).map(([idx, url]) => {
        const cell = state.myGrid[parseInt(idx)]
        return { url, objId: cell?.objId, uid: me?.id }
      }),
    }
  }

  const totalPhotos = Object.values(photosByPlayer).reduce((acc, g) => acc + g.photos.length, 0)
  const photosSection = totalPhotos > 0 ? `
    <div class="card mb photos-recap" style="position: relative; z-index: 5;">
      <div class="section-title">
        ${icon('camera', { size: 14 })} Galerie de la partie (${totalPhotos})
      </div>
      ${Object.values(photosByPlayer).map(({ player, photos }) => `
        <div class="photos-player-group">
          <div class="photos-player-header">
            <div class="avatar xs"><div class="avatar-inner">${avatarLayersHtml(player?.avatar || {})}</div></div>
            <span class="photos-player-name">${escapeHtml(player?.name || 'Joueur')}${player?.isYou ? ' (toi)' : ''}</span>
            <span class="photos-player-count">${photos.length}</span>
          </div>
          <div class="photos-grid">
            ${photos.map(photo => {
              const obj = photo.objId ? getObject(photo.objId) : null
              const objName = obj ? obj.name : ''
              return `
                <div class="photo-thumb" data-photo-url="${photo.url}" data-photo-name="${escapeHtml(objName)}">
                  ${safeImg(photo.url, { alt: objName })}
                  <div class="photo-label">${obj ? escapeHtml(obj.name) : '?'}</div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      `).join('')}
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

      <div class="sticky-cta">
        ${isPreview
          ? `<button class="btn btn-red" data-action="closeClassement">
               ${icon('arrow_left', { size: 14 })} Retour à ma partie
             </button>`
          : `<button class="btn btn-red" data-action="newGame">Nouvelle partie</button>`
        }
      </div>
    </section>
  `
}
