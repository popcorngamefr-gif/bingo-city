/**
 * Share Modal — bouton "Partager" du lobby et du jeu.
 * Lien pré-rempli avec le code, objet email pour aller plus vite.
 */

import { icon }  from './icons.js'
import { toast } from './toast.js'

const buildLink = (code) => `${location.origin}/#join/${code}`

const SHARE_TEXT = (code) =>
  `Rejoins le Bingo Santé Varsovie comme un déglingo ! 🍻\n\nCode : ${code}\nLien direct : ${buildLink(code)}`

const EMAIL_SUBJECT = 'Rejoins le Bingo Santé Varsovie comme un déglingo !'
const EMAIL_BODY    = (code) =>
  `Salut !\n\nJ'organise un Bingo Santé Varsovie. Tu rejoins ?\n\nCode de la partie : ${code}\nLien direct (cliquable) : ${buildLink(code)}\n\nÀ tout de suite !`

export function openShareModal(gameCode) {
  const root = document.getElementById('modal-root')
  const text = SHARE_TEXT(gameCode)
  const link = buildLink(gameCode)

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
            <button class="btn btn-red" id="share-native-btn">
              ${icon('arrow_right', { size: 16 })} Envoyer à...
            </button>

            <button class="btn btn-yellow" id="share-email-btn">
              ${icon('link', { size: 14 })} Envoyer par email
            </button>

            <button class="btn btn-cream btn-sm" id="share-copy-btn">
              ${icon('check', { size: 14 })} Copier le message
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

  // Partage natif (sheet iOS/Android)
  document.getElementById('share-native-btn')?.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: EMAIL_SUBJECT,
          text:  text,
          url:   link,
        })
      } catch { /* annulé par user */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        toast('Copié — colle dans WhatsApp/SMS')
      } catch {
        toast('Partage indisponible')
      }
    }
  })

  // Email pré-rempli (objet + body)
  document.getElementById('share-email-btn')?.addEventListener('click', () => {
    const subject = encodeURIComponent(EMAIL_SUBJECT)
    const body    = encodeURIComponent(EMAIL_BODY(gameCode))
    location.href = `mailto:?subject=${subject}&body=${body}`
  })

  // Copie message complet
  document.getElementById('share-copy-btn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Message copié !')
    } catch {
      toast('Impossible de copier')
    }
  })

  // Copie lien seul
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
