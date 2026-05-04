/**
 * Expressions Generator
 * Lance la génération en arrière-plan pendant le lobby.
 * Poll toutes les 3s, stocke dans state.myExpressions quand prêt.
 *
 * state.myExpressions = {
 *   neutral:   url | null,
 *   laugh:     url | null,
 *   angry:     url | null,
 *   wink:      url | null,
 *   surprised: url | null,
 *   _ready:    boolean  (true quand toutes les expressions sont prêtes)
 * }
 */

import { state } from '../state.js'

const POLL_MS      = 3000
const MAX_ATTEMPTS = 40    // 40 × 3s = 2min max

// ─── Entrée publique ──────────────────────────────────────────────────────────

/**
 * Lance la génération en arrière-plan.
 * @param {string} imageBase64 — même photo que celle du scan initial
 * @param {Function} onProgress — appelé avec { done, total } à chaque expression reçue
 * @param {Function} onComplete — appelé quand toutes les expressions sont prêtes
 */
export async function generateExpressions(imageBase64, onProgress, onComplete) {
  if (!imageBase64) return
  if (!state.myExpressions) state.myExpressions = {}

  try {
    const res = await fetch('/api/generate-expressions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageBase64 }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { ids } = await res.json()

    // Poll chaque expression indépendamment
    const keys = Object.keys(ids)
    let done    = 0

    keys.forEach(key => {
      const { id, error } = ids[key]
      if (error || !id) {
        state.myExpressions[key] = null
        done++
        onProgress?.({ done, total: keys.length })
        if (done === keys.length) _finalize(onComplete)
        return
      }
      _pollExpression(key, id, 0, () => {
        done++
        onProgress?.({ done, total: keys.length })
        if (done === keys.length) _finalize(onComplete)
      })
    })

  } catch (err) {
    console.warn('generateExpressions failed:', err)
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────────

function _pollExpression(key, id, attempt, onDone) {
  if (attempt > MAX_ATTEMPTS) {
    console.warn(`Expression ${key} timed out`)
    state.myExpressions[key] = null
    onDone()
    return
  }

  setTimeout(async () => {
    try {
      const res  = await fetch(`/api/check-generation?id=${id}`)
      const data = await res.json()

      if (data.status === 'succeeded' && data.url) {
        state.myExpressions[key] = data.url
        console.log(`Expression ${key} ready:`, data.url)
        onDone()
      } else if (data.status === 'failed') {
        console.warn(`Expression ${key} failed`)
        state.myExpressions[key] = null
        onDone()
      } else {
        _pollExpression(key, id, attempt + 1, onDone)
      }
    } catch {
      _pollExpression(key, id, attempt + 1, onDone)
    }
  }, POLL_MS)
}

function _finalize(onComplete) {
  state.myExpressions._ready = true
  console.log('All expressions ready:', state.myExpressions)
  onComplete?.()
}

// ─── Utilitaire ───────────────────────────────────────────────────────────────

/**
 * Retourne l'URL d'une expression ou null si pas encore prête.
 * @param {'neutral'|'laugh'|'angry'|'wink'|'surprised'} key
 */
export function getExpression(key) {
  return state.myExpressions?.[key] ?? null
}

/**
 * Mappe un mood avatar vers l'expression la plus proche.
 */
export function moodToExpression(mood) {
  const map = {
    idle:      'neutral',
    walk:      'neutral',
    hop:       'neutral',
    jump:      'laugh',
    dance:     'laugh',
    excited:   'laugh',
    sad:       'angry',     // "triste" → expression sombre
    sweat:     'surprised',
    heartbeat: 'surprised',
    laugh:     'laugh',
    wink:      'wink',
    rage:      'angry',
  }
  return map[mood] || 'neutral'
}
