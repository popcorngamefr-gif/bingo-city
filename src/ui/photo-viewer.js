/**
 * Photo Viewer — affiche une photo en plein écran pour la montrer aux autres.
 * Tap pour fermer.
 */

import { icon } from './icons.js'

export function openPhotoViewer(photoUrl, objName = '') {
  const root = document.getElementById('modal-root')
  if (!root) return

  root.innerHTML = `
    <div class="modal show photo-viewer-modal" id="photo-viewer-bg">
      <button class="photo-viewer-close" id="photo-viewer-close" aria-label="Fermer">
        ${icon('cross', { size: 20 })}
      </button>
      <div class="photo-viewer-frame">
        <img src="${photoUrl}" alt="${objName}" class="photo-viewer-img" />
        ${objName ? `<div class="photo-viewer-label">${objName}</div>` : ''}
      </div>
    </div>
  `

  const close = () => { root.innerHTML = '' }
  document.getElementById('photo-viewer-close')?.addEventListener('click', close)
  document.getElementById('photo-viewer-bg')?.addEventListener('click', (e) => {
    if (e.target.id === 'photo-viewer-bg') close()
  })
}
