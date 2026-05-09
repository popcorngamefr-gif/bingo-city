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

  // Tout en heures + minutes (pas de jours, pas de secondes au-dessus
  // de l'heure : à cette échelle ça n'apporte rien de visuel et ça
  // mange trop de place dans le HUD). Sous l'heure on garde MM:SS pour
  // donner le sentiment d'urgence quand la fin approche.
  const hours = Math.floor(t / 3600)
  const mins  = Math.floor((t % 3600) / 60)
  const secs  = t % 60

  let text
  if (hours >= 1) {
    // 46h00 — clair, 5 caractères, jamais ambigu avec MM:SS
    text = `${String(hours).padStart(2, '0')}h${String(mins).padStart(2, '0')}`
  } else {
    // MM:SS — décompte serré sous l'heure
    text = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  el.textContent = text
}
