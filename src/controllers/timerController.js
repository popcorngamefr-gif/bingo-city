/**
 * Timer Controller
 */

import { state } from '../state.js'
import { onTimerEnd } from './gameController.js'

export function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval)
  state.timer = 1200
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
  const m  = Math.floor(state.timer / 60)
  const s  = state.timer % 60
  const el = document.getElementById('game-timer')
  if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
