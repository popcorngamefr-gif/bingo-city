/**
 * Timer Controller
 * Gère le compte à rebours de la partie.
 */

import { state } from '../state.js'
import { navigate } from '../router.js'

export function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval)
  state.timer = 1800
  updateTimer()
  state.timerInterval = setInterval(() => {
    state.timer--
    updateTimer()
    if (state.timer <= 0) {
      clearInterval(state.timerInterval)
      navigate('end')
    }
  }, 1000)
}

export function updateTimer() {
  const m  = Math.floor(state.timer / 60)
  const s  = state.timer % 60
  const el = document.getElementById('game-timer')
  if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
