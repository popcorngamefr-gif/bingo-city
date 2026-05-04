/**
 * Persistance partie en cours dans localStorage.
 * Une partie est conservée 4 jours max (au-delà, on suppose abandon).
 *
 * Module isolé pour éviter les dépendances circulaires
 * (main.js, screens/home.js, et autres callers utilisent ce module).
 */

import { state } from './state.js'

const ACTIVE_GAME_KEY = 'bingo_active_game'
const MAX_AGE_MS      = 4 * 24 * 3600 * 1000   // 4 jours

export function saveActiveGame() {
  if (!state.gameCode) return
  try {
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify({
      code:    state.gameCode,
      name:    state.gameName,
      isMJ:    state.isMJ,
      myName:  state.myName,
      savedAt: Date.now(),
    }))
  } catch {}
}

export function clearActiveGame() {
  try { localStorage.removeItem(ACTIVE_GAME_KEY) } catch {}
}

export function getActiveGame() {
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      clearActiveGame()
      return null
    }
    return data
  } catch {
    return null
  }
}
