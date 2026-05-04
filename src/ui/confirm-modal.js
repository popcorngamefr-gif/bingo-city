/**
 * Confirm Modal — modale de confirmation stylée Varsovie.
 * Remplace les confirm() natifs qui cassent l'esthétique pixel art.
 *
 * Usage :
 *   const ok = await openConfirmModal({
 *     title: 'Sûr ?',
 *     body:  'Cette action est définitive.',
 *     confirmLabel: 'Oui, supprimer',
 *     cancelLabel:  'Annuler',
 *   })
 *   if (ok) { ...action }
 */

import { icon } from './icons.js'

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]))
}

export function openConfirmModal({
  title         = 'Confirmer ?',
  body          = '',
  confirmLabel  = 'Confirmer',
  cancelLabel   = 'Annuler',
  destructive   = false,
} = {}) {
  return new Promise((resolve) => {
    const root = document.getElementById('modal-root')
    if (!root) { resolve(false); return }

    const confirmClass = destructive ? 'btn-red' : 'btn-yellow'

    root.innerHTML = `
      <div class="modal show confirm-modal">
        <div class="confirm-box">
          <div class="confirm-header">
            <div class="confirm-title">
              ${icon(destructive ? 'alert' : 'question', { size: 14 })}
              ${escapeHtml(title)}
            </div>
          </div>
          <div class="confirm-body">
            <p>${escapeHtml(body)}</p>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-ghost btn-sm" id="confirm-cancel-btn">
              ${escapeHtml(cancelLabel)}
            </button>
            <button class="btn ${confirmClass}" id="confirm-ok-btn">
              ${icon('check', { size: 14 })} ${escapeHtml(confirmLabel)}
            </button>
          </div>
        </div>
      </div>
    `

    const close = (result) => {
      root.innerHTML = ''
      resolve(result)
    }

    document.getElementById('confirm-ok-btn')?.addEventListener('click', () => close(true))
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', () => close(false))
    root.querySelector('.confirm-modal')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('confirm-modal')) close(false)
    })
  })
}
