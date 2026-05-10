/**
 * Écran : classement final + galerie de photos
 * Styles dans src/styles/screens.css
 *
 * Trois modes :
 *  - isPreview         : preview du classement pendant une partie en cours,
 *                        bouton "Retour à ma partie"
 *  - viewingHistory    : on consulte une partie archivée depuis le home,
 *                        bouton "Retour à l'accueil"
 *  - end normal        : partie qui vient de finir, bouton "Nouvelle partie"
 *                        + cotillons festifs en arrière-plan
 */

import { state } from '../state.js'
import { getObject } from '../data/objects.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'
import { escapeHtml } from '../utils/html.js'
import { safeImg } from '../utils/media.js'
import { getPlayerScore } from '../controllers/gameController.js'

export function renderEnd() {
  const isPreview        = !!state._previewClassement
  const isViewingHistory = !!state._viewingHistory
  // Cotillons : seulement à la VRAIE fin de partie (pas en preview, pas en
  // consultation historique — sinon ça spammerait des confettis à chaque
  // ouverture).
  const showCotillons    = !isPreview && !isViewingHistory

  // On trie par score recalculé depuis photos Firestore (source de vérité)
  // plutôt que par le champ player.score qui peut avoir drifté pour les
  // joueurs qui ont joué avec une version pré-fix de computeScore.
  const sorted = [...state.players].sort((a, b) => getPlayerScore(b) - getPlayerScore(a))
  const winner = sorted[0]
  const hasScores = sorted.some(p => getPlayerScore(p) > 0)
  const title  = isPreview ? 'CLASSEMENT EN COURS'
                : isViewingHistory ? 'CLASSEMENT'
                : !winner ? 'PARTIE TERMINÉE'
                : !hasScores ? 'PARTIE TERMINÉE'
                : winner.isYou ? 'TU AS GAGNÉ !'
                : `${winner.name.toUpperCase()} GAGNE !`

  const medals = [
    icon('medal_gold',   { size: 28 }),
    icon('medal_silver', { size: 28 }),
    icon('medal_bronze', { size: 28 }),
  ]

  // Index photos par joueur pour les afficher inline dans la ligne du leaderboard
  const allPhotos = state.gamePhotos || []
  const photosByUid = {}
  allPhotos.forEach(p => {
    if (!photosByUid[p.uid]) photosByUid[p.uid] = []
    photosByUid[p.uid].push(p)
  })
  // Fallback : si gamePhotos pas encore là mais on a state.myPhotos local, on
  // construit pour soi. Évite un classement vide pendant le mount.
  const me = state.players.find(p => p.isYou)
  if (me && !photosByUid[me.id] && state.myPhotos && Object.keys(state.myPhotos).length > 0) {
    photosByUid[me.id] = Object.entries(state.myPhotos).map(([idx, url]) => {
      const cell = state.myGrid[parseInt(idx)]
      return { url, objId: cell?.objId, uid: me.id }
    })
  }

  const totalPhotos = Object.values(photosByUid).reduce((acc, arr) => acc + arr.length, 0)

  // Génère un mini-strip de thumbnails pour une ligne de leaderboard.
  // Tap sur une thumbnail → photo viewer plein écran (data-photo-url branché
  // dans la délégation main.js).
  const renderPhotosStrip = (photos) => {
    if (!photos || photos.length === 0) return ''
    return `
      <div class="lb-photos-strip">
        ${photos.map(photo => {
          const obj = photo.objId ? getObject(photo.objId) : null
          const objName = obj ? obj.name : ''
          return `
            <div class="lb-photo-thumb" data-photo-url="${photo.url}" data-photo-name="${escapeHtml(objName)}" title="${escapeHtml(objName)}">
              ${safeImg(photo.url, { alt: objName })}
            </div>
          `
        }).join('')}
      </div>
    `
  }

  // Bouton du sticky-cta selon le contexte
  const ctaHtml = isPreview
    ? `<button class="btn btn-red" data-action="closeClassement">
         ${icon('arrow_left', { size: 14 })} Retour à ma partie
       </button>`
    : isViewingHistory
      ? `<button class="btn btn-red" data-nav="home">
           ${icon('arrow_left', { size: 14 })} Retour à l'accueil
         </button>`
      : `<button class="btn btn-red" data-action="newGame">Nouvelle partie</button>`

  return `
    <section class="screen end-screen">
      ${bgVarsovieHtml({ opacity: 0.4 })}
      ${showCotillons ? _cotillonsHtml() : ''}

      <h2 class="title-screen">${title}</h2>

      <div class="card mb" style="position: relative; z-index: 5;">
        <div class="leaderboard leaderboard-detailed">
          ${sorted.map((p, i) => {
            const photos = photosByUid[p.id] || []
            return `
              <div class="lb-row rank-${i + 1} ${p.hasBingo ? 'bingo' : ''} ${i === 0 && hasScores ? 'lb-row-winner' : ''}">
                <div class="lb-row-main">
                  <div class="lb-rank">${medals[i] || `<span class="rank-num">#${i + 1}</span>`}</div>
                  <div class="avatar xs">
                    <div class="avatar-inner">
                      ${avatarLayersHtml(p.avatar)}
                    </div>
                  </div>
                  <div class="lb-name">
                    ${escapeHtml(p.name)}${p.isYou ? ' (toi)' : ''}${p.isMJ ? ' [MJ]' : ''}
                  </div>
                  <div class="lb-score">${getPlayerScore(p)}</div>
                </div>
                ${renderPhotosStrip(photos)}
              </div>
            `
          }).join('')}
        </div>
      </div>

      ${totalPhotos === 0 ? `
        <p class="small light center" style="position:relative;z-index:5;margin-bottom:14px;">
          Pas encore de photos pour cette partie.
        </p>
      ` : ''}

      <div class="sticky-cta">${ctaHtml}</div>
    </section>
  `
}

/**
 * Cotillons festifs : 24 confettis pixel-art qui tombent du haut.
 * Couleurs piochées dans la palette Varsovie pour rester dans le style.
 * Animation pure CSS (cf. screens.css `.cotillons`), pas de JS pour
 * éviter de re-créer les particules à chaque re-render.
 */
function _cotillonsHtml() {
  const colors = ['#d04848', '#f0c860', '#6a9070', '#7a98b0', '#a02828', '#e8a838']
  const items = []
  for (let i = 0; i < 24; i++) {
    const color = colors[i % colors.length]
    const left  = (i * 4.2 + (i % 3) * 1.5) % 100  // répartition pseudo-random
    const delay = (i * 0.13) % 4
    const dur   = 3 + (i % 5) * 0.4
    const rot   = (i * 37) % 360
    items.push(`<span class="cotillon" style="left:${left.toFixed(1)}%;animation-delay:${delay.toFixed(2)}s;animation-duration:${dur.toFixed(1)}s;background:${color};transform:rotate(${rot}deg)"></span>`)
  }
  return `<div class="cotillons" aria-hidden="true">${items.join('')}</div>`
}
