/**
 * Share Modal — bouton "Partager" du lobby et du jeu.
 * Utilise navigator.share si dispo (mobile natif), sinon copie + propose alternative.
 */

import { icon }  from './icons.js'
import { toast } from './toast.js'

const SHARE_TEXT = (code) =>
  `Rejoins le Bingo Santé Varsovie comme un déglingo ! 🍻\n\nCode : ${code}\nLien : ${location.origin}/#join`

export function openShareModal(gameCode) {
  const root = document.getElementById('modal-root')
  const text = SHARE_TEXT(gameCode)
  const link = `${location.origin}/#join`

  root.innerHTML = `
    <div class="modal show">
      <div class="share-modal-box">

        <div class="share-header">
          <div class="share-title">
            ${icon('link', { size: 16 })} PARTAGER LA PARTIE
          </div>
        </div>

        <div class="share-body">
          <div class="share-code-block">
            <div class="share-code-label">CODE</div>
            <div class="share-code-value">${gameCode}</div>
          </div>

          <p class="share-msg-preview">"Rejoins le Bingo Santé Varsovie comme un déglingo !"</p>

          <div class="share-actions">
            <button class="btn btn-yellow" id="share-copy-btn">
              ${icon('check', { size: 16 })} Copier le message
            </button>

            <button class="btn btn-red" id="share-native-btn">
              ${icon('arrow_right', { size: 16 })} Envoyer à...
            </button>

            <button class="btn btn-cream btn-sm" id="share-link-only-btn">
              Copier juste le lien
            </button>
          </div>
        </div>

        <div class="share-close">
          <button class="btn btn-ghost btn-sm" id="share-close-btn">Fermer</button>
        </div>

      </div>
    </div>
  `

  // Copie du message complet
  document.getElementById('share-copy-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Message copié !')
    } catch {
      toast('Impossible de copier')
    }
  })

  // Partage natif iOS/Android
  document.getElementById('share-native-btn')?.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bingo Santé Varsovie',
          text:  text,
        })
      } catch {
        // l'utilisateur a annulé, pas grave
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        toast('Copié — colle dans WhatsApp/SMS')
      } catch {
        toast('Partage indisponible')
      }
    }
  })

  // Lien seul
  document.getElementById('share-link-only-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(link)
      toast('Lien copié !')
    } catch {
      toast('Impossible de copier')
    }
  })

  document.getElementById('share-close-btn')?.addEventListener('click', closeShareModal)
}

export function closeShareModal() {
  const root = document.getElementById('modal-root')
  if (root) root.innerHTML = ''
}
