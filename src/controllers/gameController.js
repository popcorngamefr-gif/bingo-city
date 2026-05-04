/**
 * Game Controller
 * Validation, bingo. Met à jour Firestore en parallèle des mises à jour locales.
 */

import { state }     from '../state.js'
import { show, navigate } from '../router.js'
import { toast }     from '../ui/toast.js'
import { getObject } from '../data/objects.js'
import { triggerHudAvatar, updateHudConfidence, checkHeartbeat } from './avatarController.js'

// Firebase (lazy — évite l'import si Firebase n'est pas encore prêt)
async function fbGame() { return import('../firebase/game.js') }
async function fbAuth() { return import('../firebase/auth.js') }

// ─── Validation photo ─────────────────────────────────────────────────────────

export function handleValidation(cellIdx) {
  const cell = state.myGrid[cellIdx]
  const obj  = getObject(cell.objId)

  cell.status = 'validated'
  const me = state.players.find(p => p.isYou)
  if (me) me.score = (me.score || 0) + (obj.points || 1)

  toast(`✓ ${obj.name} capturé ! +${obj.points} pts`)
  triggerHudAvatar('jump', { duration: 800, emote: 'star' })

  if (state.currentScreen === 'game') show('game')

  setTimeout(() => {
    updateHudConfidence()
    checkHeartbeat()
  }, 100)

  // Firestore async (fire & forget)
  if (state.gameCode && state.uid) {
    fbGame().then(({ updatePlayerGrid, updatePlayerScore }) => {
      updatePlayerGrid(state.gameCode, state.uid, state.myGrid).catch(console.error)
      updatePlayerScore(state.gameCode, state.uid, me?.score || 0).catch(console.error)
    })
  }

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

  // Firestore + stats async
  if (state.gameCode && state.uid) {
    fbGame().then(({ updatePlayerScore, endGame }) => {
      updatePlayerScore(state.gameCode, state.uid, me?.score || 0, true).catch(console.error)
      endGame(state.gameCode).catch(console.error)
    })
  }
  if (state.uid) {
    const sorted  = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
    const isWinner = sorted[0]?.isYou ?? false
    fbAuth().then(({ updateStats }) => {
      updateStats({ score: me?.score || 0, hasBingo: true, isWinner }).catch(console.error)
    })
  }
}

// ─── Fin de partie (timer écoulé) ────────────────────────────────────────────

export function onTimerEnd() {
  const me       = state.players.find(p => p.isYou)
  const score    = me?.score || 0
  const hasBingo = me?.hasBingo || false
  const sorted   = [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0))
  const isWinner = sorted[0]?.isYou ?? false

  if (state.gameCode && state.uid && state.isMJ) {
    fbGame().then(({ endGame }) => endGame(state.gameCode).catch(console.error))
  }
  if (state.uid) {
    fbAuth().then(({ updateStats }) => {
      updateStats({ score, hasBingo, isWinner }).catch(console.error)
    })
  }

  navigate('end')
}
