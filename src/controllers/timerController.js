/**
 * Timer Controller
 *
 * Le décompte est ancré sur state.gameStartedAt (ms epoch issu du
 * startedAt Firestore), ce qui permet :
 *   - de garder le bon temps après un reload,
 *   - de synchroniser tous les joueurs sur la même base,
 *   - de rester juste même quand l'onglet est en arrière-plan
 *     (les setInterval sont throttlés, donc on recalcule à chaque tick
 *      depuis l'horloge murale au lieu de décrémenter à l'aveugle).
 *
 * Si gameStartedAt n'est pas connu (cas dégradé), on retombe sur un
 * décompte simple à partir de gameDuration.
 */

import { state } from '../state.js'
import { onTimerEnd } from './gameController.js'

export function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval)
  _syncTimer()
  updateTimer()
  state.timerInterval = setInterval(() => {
    _syncTimer()
    updateTimer()
    if (state.timer <= 0) {
      clearInterval(state.timerInterval)
      state.timerInterval = null
      onTimerEnd()
    }
  }, 1000)
}

function _syncTimer() {
  const duration = state.gameDuration || 7200
  if (state.gameStartedAt) {
    const elapsed = Math.floor((Date.now() - state.gameStartedAt) / 1000)
    state.timer = Math.max(0, duration - elapsed)
  } else if (state.timer == null) {
    state.timer = duration
  } else {
    state.timer = Math.max(0, state.timer - 1)
  }
}

export function updateTimer() {
  const t  = state.timer
  const el = document.getElementById('game-timer')
  if (!el) return

  const days  = Math.floor(t / 86400)
  const hours = Math.floor((t % 86400) / 3600)
  const mins  = Math.floor((t % 3600) / 60)
  const secs  = t % 60

  let text
  if (days >= 1) {
    // Plus d'un jour : Xj HHh
    text = `${days}j ${String(hours).padStart(2, '0')}h`
  } else if (hours >= 1) {
    // Plus d'une heure : HH:MM:SS
    text = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  } else {
    // Moins d'une heure : MM:SS
    text = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  el.textContent = text
}
