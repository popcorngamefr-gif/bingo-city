/**
 * Animations Generator — wan-2.2-i2v-fast
 * Une seule vidéo MP4 expressive, lue en boucle dans l'avatar.
 *
 * state.myAnimation = { url: string|null, _ready: bool }
 */

import { state } from '../state.js'

const POLL_MS      = 3000
const MAX_ATTEMPTS = 100  // ~5 min max (génération wan ~40-80s)

/**
 * Lance la génération à partir de l'URL de l'image pixel art déjà générée.
 * @param {string}   imageUrl     — URL de l'avatar généré par face-to-many
 * @param {string?}  prompt       — prompt custom (optionnel, sinon prompt par défaut côté API)
 * @param {Function} onProgress   — appelé périodiquement
 * @param {Function} onComplete   — appelé quand la vidéo est prête
 */
export async function generateAnimations(imageUrl, prompt, onProgress, onComplete) {
  // Reset complet : on lance une NOUVELLE génération, on jette tout ce qui
  // concerne l'ancienne vidéo (état + promesse de mirror précédente).
  // Backup de l'ancienne animationUrl au cas où la nouvelle gen échoue
  // (on pourra restaurer pour ne pas afficher un avatar sans vidéo)
  if (state.myAvatar?.animationUrl) {
    state._previousAnimationUrl = state.myAvatar.animationUrl
  }
  state.myAnimation = { url: null, _ready: false }
  // Purge l'ancienne promesse de mirror : si elle tourne encore en arrière-plan,
  // elle continuera à vivre via sa closure mais ne polluera pas confirmAvatar
  // qui ne doit attendre que la NOUVELLE génération en cours.
  delete state._animationStorageUploadPromise
  // On retire aussi l'ancienne URL du state local pour que l'UI montre
  // bien le loader pendant la génération (sinon on verrait l'ancienne vidéo)
  delete state.myAvatar.animationUrl

  try {
    const res = await fetch('/api/generate-animations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageUrl, prompt }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const { id } = await res.json()
    _poll(id, 0, onProgress, onComplete)

  } catch (err) {
    console.error('generateAnimations failed:', err)
    state.myAnimation = { url: null, _ready: true, error: err.message }
    // En cas d'échec direct (pas de polling), restaure l'ancienne URL
    // si elle existait (l'user gardait sa vidéo précédente)
    if (state._previousAnimationUrl) {
      state.myAvatar.animationUrl = state._previousAnimationUrl
      delete state._previousAnimationUrl
    }
    onComplete?.(err)
    throw err
  }
}

function _poll(id, attempt, onProgress, onComplete) {
  if (attempt > MAX_ATTEMPTS) {
    state.myAnimation = { url: null, _ready: true, error: 'timeout' }
    onComplete?.(new Error('timeout'))
    return
  }

  setTimeout(async () => {
    try {
      const res  = await fetch(`/api/check-generation?id=${id}`)
      const data = await res.json()

      onProgress?.({ status: data.status, attempt })

      if (data.status === 'succeeded' && data.url) {
        // 1. Pose tout de suite l'URL Replicate pour la fluidité (vidéo lit même pendant l'upload)
        state.myAnimation = { url: data.url, _ready: true }
        state.myAvatar.animationUrl = data.url
        // Cleanup du backup : la nouvelle vidéo a réussi, on n'a plus besoin
        // de pouvoir restaurer l'ancienne
        delete state._previousAnimationUrl
        console.log('Animation ready:', data.url)
        onComplete?.(null)

        // 2-3-4. Mirror Storage + sync profil + sync player en chaîne.
        // Stocke la promesse en state pour que confirmAvatar puisse l'await
        // (garantit que la vidéo est sur Storage avant de naviguer ailleurs)
        state._animationStorageUploadPromise = (async () => {
          let finalUrl = data.url
          if (state.uid && state.uid !== 'me') {
            try {
              const { uploadAvatarVideo } = await import('../firebase/storage.js')
              finalUrl = await uploadAvatarVideo(state.uid, data.url)
              state.myAnimation.url       = finalUrl
              state.myAvatar.animationUrl = finalUrl
              console.log('[animation] mirrored to Storage:', finalUrl)
            } catch (err) {
              console.warn('[animation] mirror to Storage failed, keeping Replicate URL:', err)
            }
          }
          // Sync profil avec URL définitive
          try {
            const { saveProfile } = await import('../firebase/auth.js')
            await saveProfile({ name: state.myName || state.accountKey || 'Anonyme', avatar: state.myAvatar })
          } catch (err) {
            console.warn('[animation] saveProfile failed:', err)
          }
          // Sync au doc player si partie en cours
          if (state.gameCode && state.uid && state.uid !== 'me') {
            try {
              const { updatePlayerProfile } = await import('../firebase/game.js')
              await updatePlayerProfile(state.gameCode, state.uid, { animationUrl: finalUrl })
            } catch (err) {
              console.warn('[animation] updatePlayerProfile failed:', err)
            }
          }
        })()
        // On ne await pas ici — laisse la promesse vivre en arrière-plan.
        // confirmAvatar pourra la await pour attendre la fin.
      } else if (data.status === 'failed') {
        state.myAnimation = { url: null, _ready: true, error: data.error || 'failed' }
        // Restaure l'ancienne URL animationUrl si elle existait
        // (sinon l'avatar perdrait sa vidéo Déglingo précédente après un échec)
        if (state._previousAnimationUrl) {
          state.myAvatar.animationUrl = state._previousAnimationUrl
          delete state._previousAnimationUrl
        }
        onComplete?.(new Error(data.error || 'Generation failed'))
      } else {
        _poll(id, attempt + 1, onProgress, onComplete)
      }
    } catch {
      _poll(id, attempt + 1, onProgress, onComplete)
    }
  }, POLL_MS)
}
