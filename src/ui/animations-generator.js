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
 * @param {Function} onProgress   — appelé périodiquement
 * @param {Function} onComplete   — appelé quand la vidéo est prête
 */
export async function generateAnimations(imageUrl, onProgress, onComplete) {
  state.myAnimation = { url: null, _ready: false }

  try {
    const res = await fetch('/api/generate-animations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageUrl }),
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
        state.myAnimation = { url: data.url, _ready: true }
        console.log('Animation ready:', data.url)
        onComplete?.(null)
      } else if (data.status === 'failed') {
        state.myAnimation = { url: null, _ready: true, error: data.error || 'failed' }
        onComplete?.(new Error(data.error || 'Generation failed'))
      } else {
        _poll(id, attempt + 1, onProgress, onComplete)
      }
    } catch {
      _poll(id, attempt + 1, onProgress, onComplete)
    }
  }, POLL_MS)
}
