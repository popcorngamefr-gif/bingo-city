/**
 * Timer Controller
 */

import { state } from '../state.js'
import { onTimerEnd } from './gameController.js'

export function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval)
  state.timer = state.gameDuration || 7200
  updateTimer()
  state.timerInterval = setInterval(() => {
    state.timer--
    updateTimer()
    if (state.timer <= 0) {
      clearInterval(state.timerInterval)
      onTimerEnd()
    }
  }, 1000)
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
