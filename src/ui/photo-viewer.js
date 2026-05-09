/**
 * Photo Viewer — affiche une photo en plein écran pour la montrer aux autres.
 * Tap pour fermer.
 *
 * Sur réseau dégradé, on affiche un spinner pendant le chargement et un
 * bouton "Réessayer" si l'image échoue (URL Storage temporairement
 * inaccessible).
 */

import { icon } from './icons.js'
import { escapeHtml } from '../utils/html.js'

export function openPhotoViewer(photoUrl, objName = '') {
  const root = document.getElementById('modal-root')
  if (!root) return

  const safeUrl  = String(photoUrl || '').replace(/"/g, '%22')
  const safeName = escapeHtml(objName || '')

  root.innerHTML = `
    <div class="modal show photo-viewer-modal" id="photo-viewer-bg">
      <button class="photo-viewer-close" id="photo-viewer-close" aria-label="Fermer">
        ${icon('cross', { size: 20 })}
      </button>
      <div class="photo-viewer-frame">
        <div class="photo-viewer-loading" id="photo-viewer-loading">
          <div class="gen-pixel-spinner"></div>
        </div>
        <img src="${safeUrl}" alt="${safeName}" class="photo-viewer-img" id="photo-viewer-img" style="display:none;" />
        ${objName ? `<div class="photo-viewer-label">${safeName}</div>` : ''}
      </div>
    </div>
  `

  const close = () => { root.innerHTML = '' }
  document.getElementById('photo-viewer-close')?.addEventListener('click', close)
  document.getElementById('photo-viewer-bg')?.addEventListener('click', (e) => {
    if (e.target.id === 'photo-viewer-bg') close()
  })

  const img      = document.getElementById('photo-viewer-img')
  const loading  = document.getElementById('photo-viewer-loading')
  if (!img || !loading) return

  const showImg = () => {
    img.style.display = ''
    loading.style.display = 'none'
  }
  const showError = () => {
    loading.innerHTML = `
      <div class="photo-viewer-error">
        ${icon('alert', { size: 36 })}
        <div style="margin-top:10px;font-family:'VT323',monospace;font-size:16px;color:var(--cream-cold);">Image indisponible</div>
        <button class="btn btn-cream btn-sm" id="photo-viewer-retry" style="margin-top:12px;">
          ${icon('retry', { size: 14 })} Réessayer
        </button>
      </div>
    `
    document.getElementById('photo-viewer-retry')?.addEventListener('click', () => {
      // Reset loading UI puis on force le rechargement de l'image
      loading.innerHTML = `<div class="gen-pixel-spinner"></div>`
      img.style.display = 'none'
      // Force-refresh : ajoute un cache-buster à l'URL
      const sep = safeUrl.includes('?') ? '&' : '?'
      img.src = safeUrl + sep + '_retry=' + Date.now()
    })
  }

  // Si l'image est déjà en cache du navigateur, .complete est true tout de suite
  if (img.complete && img.naturalWidth > 0) {
    showImg()
  } else {
    img.addEventListener('load',  showImg, { once: true })
    img.addEventListener('error', showError, { once: true })
  }
}
