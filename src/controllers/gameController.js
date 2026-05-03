/**
 * Game Controller
 * Gère la validation des photos, le check bingo et la simulation de joueurs.
 */

import { state } from '../state.js'
import { show, navigate } from '../router.js'
import { toast } from '../ui/toast.js'
import { getObject } from '../data/objects.js'
import { randomAvatar } from '../utils/random.js'
import { triggerHudAvatar, updateHudConfidence, checkHeartbeat } from './avatarController.js'

// ─── Validation ───────────────────────────────────────────────────────────────

export function handleValidationResult(cellIdx, result) {
  const cell = state.myGrid[cellIdx]
  const obj  = getObject(cell.objId)

  if (result.valid) {
    cell.status = 'validated'
    const me = state.players.find(p => p.isYou)
    if (me) me.score = (me.score || 0) + (obj.points || 1)
    toast(`✓ ${result.reason || 'Validé'} +${obj.points} pts`)
    triggerHudAvatar('jump', { duration: 800, emote: 'star' })
  } else {
    cell.status = 'rejected'
    toast(`✗ ${result.reason || 'Refusé'}`)
    triggerHudAvatar('sad', { duration: 1500, emote: 'question' })
  }

  if (state.currentScreen === 'game') show('game')

  setTimeout(() => {
    updateHudConfidence()
    checkHeartbeat()
  }, 100)

  checkBingo()
}

// ─── Bingo ────────────────────────────────────────────────────────────────────

export function checkBingo() {
  const validated = state.myGrid.filter(c => c.status === 'validated').length
  if (validated === 0 || validated < state.myGrid.length) return

  const me = state.players.find(p => p.isYou)
  if (me) me.hasBingo = true

  triggerHudAvatar('dance', { duration: 2500, emote: 'star' })
  setTimeout(() => {
    toast('★ BINGO COMPLET ! ★')
    navigate('end')
  }, 2200)
}

// ─── Simulation joueurs ───────────────────────────────────────────────────────

export function simulateJoin(name) {
  if (state.currentScreen !== 'lobby') return
  const newP = {
    id: 'p' + Date.now(),
    name,
    avatar:     randomAvatar(),
    score:      0,
    isMJ:       false,
    justJoined: true,
  }
  state.players.push(newP)
  show('lobby')
  setTimeout(() => { newP.justJoined = false }, 600)
}
