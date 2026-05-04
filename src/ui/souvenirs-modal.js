/**
 * Souvenirs Modal — télécharge ta photo / vidéo Déglingo,
 * ou propose la génération si pas encore créées.
 *
 * Réutilisée depuis : home (bouton download), avatar-pick (sous "Garder"),
 * et potentiellement n'importe quel écran via openSouvenirsModal().
 */

import { state } from '../state.js'
import { icon }  from './icons.js'

export function openSouvenirsModal() {
  const root = document.getElementById('modal-root')
  if (!root) return

  const av = state.myAvatar || state.userProfile?.avatar || {}
  const hasPhoto = !!av.generatedImageUrl
  const hasVideo = !!av.animationUrl

  root.innerHTML = `
    <div class="modal show souvenirs-modal">
      <div class="souvenirs-box">

        <div class="souvenirs-header">
          <div class="souvenirs-title">
            ${icon('star', { size: 14 })} MES SOUVENIRS
          </div>
          <p class="souvenirs-subtitle">Récupère ta photo et ta vidéo Déglingo</p>
        </div>

        <div class="souvenirs-content">
          <div class="souvenir-row">
            <div class="souvenir-icon">${icon('camera', { size: 22 })}</div>
            <div class="souvenir-info">
              <div class="souvenir-label">Photo de profil</div>
              <div class="souvenir-sub">${hasPhoto ? 'Pixel art IA' : 'Pas encore générée'}</div>
            </div>
            ${hasPhoto
              ? `<button class="btn btn-yellow btn-sm souvenir-btn" data-action="downloadProfilePhoto">
                   ${icon('download', { size: 14 })} DL
                 </button>`
              : `<button class="btn btn-cream btn-sm souvenir-btn" data-action="generateProfilePhoto">
                   ${icon('scan', { size: 14 })} Créer
                 </button>`
            }
          </div>

          <div class="souvenir-row">
            <div class="souvenir-icon">${icon('heart', { size: 22 })}</div>
            <div class="souvenir-info">
              <div class="souvenir-label">Vidéo Déglingo</div>
              <div class="souvenir-sub">${hasVideo ? 'Avatar animé' : 'Pas encore générée'}</div>
            </div>
            ${hasVideo
              ? `<button class="btn btn-yellow btn-sm souvenir-btn" data-action="downloadProfileVideo">
                   ${icon('download', { size: 14 })} DL
                 </button>`
              : `<button class="btn btn-cream btn-sm souvenir-btn" data-action="generateProfileVideo">
                   ${icon('sparkle', { size: 14 })} Créer
                 </button>`
            }
          </div>
        </div>

        <div class="souvenirs-actions">
          <button class="btn btn-red" id="souvenirs-close-btn">
            ${icon('check', { size: 16 })} Fermer
          </button>
        </div>

      </div>
    </div>
  `

  document.getElementById('souvenirs-close-btn')?.addEventListener('click', closeSouvenirsModal)
  // Click sur le voile (pas sur le contenu) → ferme
  root.querySelector('.souvenirs-modal')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('souvenirs-modal')) closeSouvenirsModal()
  })
}

export function closeSouvenirsModal() {
  const root = document.getElementById('modal-root')
  if (root) root.innerHTML = ''
}
