/**
 * Animations Generator — gère le lancement et le polling des 3 GIFs
 * Appelé UNIQUEMENT depuis l'action utilisateur (pas en background).
 *
 * state.myAnimations = {
 *   idle:  url | null,
 *   sad:   url | null,
 *   laugh: url | null,
 *   _ready: boolean
 * }
 */

import { state } from '../state.js'

const POLL_MS      = 3000
const MAX_ATTEMPTS = 60   // 60 × 3s = 3min max

/**
 * Lance les 3 générations et appelle onProgress + onComplete.
 * @param {string}   imageBase64  — avatar pixel art déjà généré (base64 JPEG)
 * @param {Function} onProgress   — ({ done, total, key, url }) à chaque GIF prêt
 * @param {Function} onComplete   — quand les 3 sont prêts
 */
export async function generateAnimations(imageBase64, onProgress, onComplete) {
  state.myAnimations = { idle: undefined, sad: undefined, laugh: undefined, _ready: false }

  try {
    const res = await fetch('/api/generate-animations', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageBase64 }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const { ids } = await res.json()
    const keys     = Object.keys(ids)
    let   done     = 0

    keys.forEach(key => {
      const { id, error } = ids[key]
      if (error || !id) {
        state.myAnimations[key] = null
        done++
        onProgress?.({ done, total: keys.length, key, url: null })
        if (done === keys.length) _finalize(onComplete)
        return
      }
      _poll(key, id, 0, (url) => {
        done++
        onProgress?.({ done, total: keys.length, key, url })
        if (done === keys.length) _finalize(onComplete)
      })
    })

  } catch (err) {
    console.error('generateAnimations failed:', err)
    throw err
  }
}

function _poll(key, id, attempt, onDone) {
  if (attempt > MAX_ATTEMPTS) {
    console.warn(`Animation ${key} timed out`)
    state.myAnimations[key] = null
    onDone(null)
    return
  }

  setTimeout(async () => {
    try {
      const res  = await fetch(`/api/check-generation?id=${id}`)
      const data = await res.json()

      if (data.status === 'succeeded' && data.url) {
        state.myAnimations[key] = data.url
        console.log(`Animation ${key} ready:`, data.url)
        onDone(data.url)
      } else if (data.status === 'failed') {
        state.myAnimations[key] = null
        onDone(null)
      } else {
        _poll(key, id, attempt + 1, onDone)
      }
    } catch {
      _poll(key, id, attempt + 1, onDone)
    }
  }, POLL_MS)
}

function _finalize(onComplete) {
  state.myAnimations._ready = true
  onComplete?.()
}

/**
 * Mappe un mood vers l'animation la plus proche.
 */
export function moodToAnimation(mood) {
  const map = {
    idle:      'idle',
    walk:      'idle',
    hop:       'idle',
    jump:      'laugh',
    dance:     'laugh',
    excited:   'laugh',
    heartbeat: 'laugh',
    sad:       'sad',
    rage:      'sad',
    sweat:     'sad',
    wink:      'idle',
    laugh:     'laugh',
  }
  return map[mood] || 'idle'
}
