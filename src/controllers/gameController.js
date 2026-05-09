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

/**
 * Enregistre les stats de la partie courante (idempotent par gameCode).
 * Appelé depuis toutes les voies de fin : bingo perso, timer écoulé,
 * MJ qui termine manuellement, ou invité notifié via Firestore.
 *
 * @param {string} reason - pour les logs ('bingo' | 'timer' | 'ended')
 */
export async function recordGameStats(reason = 'ended') {
  if (!state.uid || !state.gameCode) return
  if (state._statsRecordedFor === state.gameCode) {
    console.log('[stats] already recorded for', state.gameCode, '(skipped)')
    return
  }
  state._statsRecordedFor = state.gameCode

  const me       = state.players.find(p => p.isYou)
  // On utilise getPlayerScore pour avoir le score recalculé depuis la
  // collection photos (source de vérité), pas le champ player.score qui
  // peut être drifté. Le sort isWinner est cohérent avec l'affichage du
  // classement à l'écran end.
  const score    = getPlayerScore(me)
  const hasBingo = me?.hasBingo || false
  const sorted   = [...state.players].sort((a, b) => getPlayerScore(b) - getPlayerScore(a))
  const isWinner = sorted[0]?.isYou ?? false

  console.log('[stats] recording', { reason, score, hasBingo, isWinner })
  try {
    const { updateStats } = await fbAuth()
    await updateStats({ score, hasBingo, isWinner })
  } catch (err) {
    // Reset le lock pour permettre une nouvelle tentative
    delete state._statsRecordedFor
    console.error('[stats] updateStats failed:', err)
  }
}

// ─── Validation photo ─────────────────────────────────────────────────────────

/**
 * Score = somme des points des cellules validées de myGrid.
 * Calcul déterministe depuis la grille (source de vérité) plutôt qu'un
 * compteur incrémenté qui peut diverger si un snapshot Firestore stale
 * écrase me.score entre deux validations (ou si une re-sync depuis
 * photoQueue se déclenche après que me.score a été modifié par un
 * snapshot pendant l'upload).
 */
export function computeScore() {
  return state.myGrid
    .filter(c => c.status === 'validated')
    .reduce((acc, c) => {
      const obj = getObject(c.objId)
      return acc + (obj?.points || 1)
    }, 0)
}

/**
 * Score d'un joueur recalculé depuis la collection photos Firestore (state.gamePhotos).
 * Utilisé pour l'affichage du classement et le calcul du rang : la collection
 * photos est la vraie source de vérité (chaque doc a un objId persistant), alors
 * que le champ players[uid].score peut avoir drifté à cause de races snapshot
 * pré-fix de computeScore. Sans écriture côté Firestore : on respecte la donnée
 * des autres joueurs, on corrige juste l'affichage.
 *
 * Fallback : si state.gamePhotos n'est pas encore chargé (subscribeToPhotos
 * en cours de mount), on retombe sur player.score pour ne pas afficher 0
 * partout pendant le premier render.
 */
export function getPlayerScore(player) {
  if (!player) return 0
  const photos = state.gamePhotos
  if (!photos || photos.length === 0) return player.score || 0
  let total = 0
  for (const p of photos) {
    if (p.uid !== player.id || !p.objId) continue
    total += getObject(p.objId)?.points || 1
  }
  return total
}

export function handleValidation(cellIdx) {
  const cell = state.myGrid[cellIdx]
  const obj  = getObject(cell.objId)

  cell.status = 'validated'
  // On recalcule le total depuis la grille au lieu de faire me.score + delta.
  // Ça garantit que score = somme exacte des cellules validées même si
  // me.score avait été écrasé par un snapshot stale juste avant.
  const newScore = computeScore()
  const me = state.players.find(p => p.isYou)
  if (me) me.score = newScore

  toast(`✓ ${obj.name} capturé ! +${obj.points} pts`)
  triggerHudAvatar('jump', { duration: 800, emote: 'star' })

  if (state.currentScreen === 'game') show('game')

  setTimeout(() => {
    updateHudConfidence()
    checkHeartbeat()
  }, 100)

  // Firestore async (fire & forget) — on envoie newScore (calculé localement
  // ci-dessus) plutôt que me?.score qui pourrait avoir été modifié par un
  // snapshot entre-temps.
  if (state.gameCode && state.uid) {
    fbGame().then(({ updatePlayerGrid, updatePlayerScore }) => {
      updatePlayerGrid(state.gameCode, state.uid, state.myGrid).catch(console.error)
      updatePlayerScore(state.gameCode, state.uid, newScore).catch(console.error)
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

  // Firestore : update score + termine la partie
  if (state.gameCode && state.uid) {
    fbGame().then(({ updatePlayerScore, endGame }) => {
      updatePlayerScore(state.gameCode, state.uid, me?.score || 0, true).catch(console.error)
      endGame(state.gameCode).catch(console.error)
    })
  }
  // Stats persistantes (idempotent — pas de double si un autre trigger arrive après)
  recordGameStats('bingo')
}

// ─── Fin de partie (timer écoulé) ────────────────────────────────────────────

export function onTimerEnd() {
  if (state.gameCode && state.uid && state.isMJ) {
    fbGame().then(({ endGame }) => endGame(state.gameCode).catch(console.error))
  }
  recordGameStats('timer')
  navigate('end')
}
