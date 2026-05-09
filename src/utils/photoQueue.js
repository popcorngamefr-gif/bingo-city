/**
 * Photo upload queue — fiabilise l'envoi des photos prises pendant une partie.
 *
 * Problème historique : `_process` (modal.js) appelait uploadPhoto en
 * fire-and-forget. Sur 4G capricieuse, l'upload échouait silencieusement,
 * la cellule restait validée localement avec le dataURL, et au prochain
 * reload la photo + la validation + le score étaient perdus côté serveur
 * (les autres joueurs ne voyaient rien).
 *
 * Cette queue règle ça :
 *
 *   1. enqueuePhoto(idx, dataUrl, objId) ajoute la photo en mémoire et
 *      la persiste dans localStorage (clé par gameCode pour gérer plusieurs
 *      parties / éviter la pollution croisée).
 *   2. _attempt(idx) tente uploadPhoto avec exp backoff (2s, 4s, 8s, 16s,
 *      32s ; max 5 essais avant de marquer 'failed' tout en laissant la
 *      photo en queue pour un nouvel essai au prochain événement online
 *      ou au prochain reload).
 *   3. Sur succès, on enchaîne updatePlayerGrid + updatePlayerScore avec
 *      le state local courant (idempotents). Ça rattrape le cas où ces
 *      écritures avaient elles aussi échoué dans handleValidation initial.
 *   4. retryAllPending() est appelé sur événement 'online' (network.js)
 *      et au mount de l'écran 'game' (couvre le boot après reload).
 *
 * Visuel : isPhotoPending(idx) / isPhotoFailed(idx) sont lus par le
 * render de game.js pour ajouter les classes .upload-pending / .upload-failed
 * sur la cellule. Une mise à jour chirurgicale du DOM est aussi faite via
 * _updateCellUI pour éviter d'attendre un re-render complet.
 */

import { state } from '../state.js'

const _retryTimers = {}
// Verrou par cellIdx : empêche deux _attempt en parallèle pour la même
// cellule (situation possible quand retryAllPending est appelé alors qu'un
// uploadPhoto est encore mid-await — sans ce verrou on aurait deux écritures
// concurrentes vers Storage / Firestore pour la même photo).
const _inFlight = {}
let _permissionToastShown = false

export function enqueuePhoto(cellIdx, dataUrl, objId) {
  if (!state.gameCode || !state.uid || state.uid === 'me') return
  state._pendingPhotos = state._pendingPhotos || {}
  state._pendingPhotos[cellIdx] = {
    dataUrl,
    objId,
    attempts: 0,
    status:   'pending',
  }
  _persist()
  _updateCellUI(cellIdx)
  // Reset d'un éventuel retry timer en cours pour la même cellule
  // (cas : l'utilisateur reprend une photo qui avait échoué)
  if (_retryTimers[cellIdx]) {
    clearTimeout(_retryTimers[cellIdx])
    delete _retryTimers[cellIdx]
  }
  _attempt(cellIdx)
}

async function _attempt(cellIdx) {
  // Garde anti-réentrance : si un upload est déjà en cours pour cette
  // cellule, on ne relance pas — sinon retryAllPending() pourrait spawner
  // un uploadPhoto concurrent.
  if (_inFlight[cellIdx]) return
  const entry = state._pendingPhotos?.[cellIdx]
  if (!entry) return
  if (!state.gameCode || !state.uid || state.uid === 'me') return

  _inFlight[cellIdx] = true
  try {
    const { uploadPhoto } = await import('../firebase/storage.js')
    const url = await uploadPhoto(state.gameCode, state.uid, cellIdx, entry.dataUrl, entry.objId)
    state.myPhotos[cellIdx] = url

    // Re-sync grid + score : idempotent, rattrape les échecs éventuels du
    // handleValidation initial (qui faisait aussi des fire-and-forget).
    // Le score est recalculé depuis state.myGrid plutôt que lu depuis
    // me.score : un snapshot Firestore arrivé entre handleValidation et
    // ici peut avoir écrasé state.players[me].score avec une valeur
    // stale (ex: après reload, le score Firestore ne reflète pas encore
    // les photos en queue). Le calcul depuis la grille est déterministe.
    try {
      const { updatePlayerGrid, updatePlayerScore } = await import('../firebase/game.js')
      const { computeScore } = await import('../controllers/gameController.js')
      const score = computeScore()
      const me = state.players.find(p => p.isYou)
      if (me) me.score = score
      await updatePlayerGrid(state.gameCode, state.uid, state.myGrid)
      await updatePlayerScore(state.gameCode, state.uid, score)
    } catch (err) {
      // Non-bloquant — la photo elle-même est OK. Si le grid/score n'a
      // pas synchro, le prochain upload re-tentera la sync.
      console.warn('[photo-queue] post-upload state sync failed:', err)
    }

    delete state._pendingPhotos[cellIdx]
    _persist()
    _updateCellUI(cellIdx)
    console.log('[photo-queue] uploaded', cellIdx, '→', url)
  } catch (err) {
    console.warn(`[photo-queue] attempt ${entry.attempts + 1} failed for cell ${cellIdx}:`, err)

    // Permission Storage refusée : pas de retry utile, on marque failed
    // mais on garde en queue pour qu'un fix de rules puisse réactiver.
    if (err?.code === 'storage/unauthorized') {
      entry.status = 'failed'
      entry.attempts = entry.attempts + 1
      _persist()
      _updateCellUI(cellIdx)
      _showPermissionToastOnce()
      return
    }

    entry.attempts = entry.attempts + 1
    if (entry.attempts >= 5) {
      // 5 essais ratés → on s'arrête mais on garde dans la queue pour le
      // prochain événement online ou le prochain reload.
      entry.status = 'failed'
      _persist()
      _updateCellUI(cellIdx)
      return
    }

    // Exp backoff : 2, 4, 8, 16, 32s
    const delay = Math.min(32000, 2000 * Math.pow(2, entry.attempts - 1))
    _retryTimers[cellIdx] = setTimeout(() => _attempt(cellIdx), delay)
  } finally {
    delete _inFlight[cellIdx]
  }
}

/**
 * Réessaye toutes les photos en queue. Appelé sur événement 'online' et
 * au mount de l'écran 'game' (couvre le boot après reload).
 */
export function retryAllPending() {
  if (!state._pendingPhotos) return
  for (const cellIdx of Object.keys(state._pendingPhotos)) {
    const entry = state._pendingPhotos[cellIdx]
    // Reset les compteurs : c'est un nouveau cycle (nouvelle connexion ou
    // nouveau reload) et la cause d'échec a peut-être disparu.
    entry.status = 'pending'
    entry.attempts = 0
    if (_retryTimers[cellIdx]) {
      clearTimeout(_retryTimers[cellIdx])
      delete _retryTimers[cellIdx]
    }
    _updateCellUI(parseInt(cellIdx))
    _attempt(parseInt(cellIdx))
  }
}

/**
 * À appeler au boot (après que state.gameCode soit hydraté) pour
 * récupérer les photos qui n'ont pas pu être uploadées avant le reload.
 */
export function restorePendingPhotos() {
  if (!state.gameCode) return
  const key = `bingo_pending_photos_${state.gameCode}`
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const data = JSON.parse(raw)
    state._pendingPhotos = data
    // Restaure aussi les dataURL dans state.myPhotos pour que l'UI les
    // affiche tant que l'upload n'est pas confirmé.
    for (const [cellIdx, entry] of Object.entries(data)) {
      const idx = parseInt(cellIdx)
      if (!state.myPhotos[idx]) state.myPhotos[idx] = entry.dataUrl
      // Cellule déjà marquée validée localement par handleValidation pré-reload
      // mais on s'assure que le grid local reflète bien ça
      if (state.myGrid[idx] && state.myGrid[idx].status !== 'validated') {
        state.myGrid[idx].status = 'validated'
      }
    }
    // Démarre les uploads tout de suite (idempotent grâce au verrou _inFlight)
    retryAllPending()
  } catch (err) {
    console.warn('[photo-queue] restore failed:', err)
  }
}

/**
 * Nettoie les photos en attente pour une partie donnée. Appelé quand on
 * abandonne / clear la partie courante (newGame, forgetActiveGame), pour
 * éviter d'accumuler du localStorage sur de vieilles parties terminées.
 */
export function clearPendingPhotos(gameCode) {
  if (!gameCode) return
  try {
    localStorage.removeItem(`bingo_pending_photos_${gameCode}`)
  } catch {}
  // Reset aussi la queue mémoire si elle correspond à cette partie
  if (state.gameCode === gameCode) {
    state._pendingPhotos = {}
    for (const idx of Object.keys(_retryTimers)) {
      clearTimeout(_retryTimers[idx])
      delete _retryTimers[idx]
    }
  }
}

export function isPhotoPending(cellIdx) {
  const e = state._pendingPhotos?.[cellIdx]
  return !!e && e.status === 'pending'
}

export function isPhotoFailed(cellIdx) {
  const e = state._pendingPhotos?.[cellIdx]
  return !!e && e.status === 'failed'
}

function _persist() {
  if (!state.gameCode) return
  const key = `bingo_pending_photos_${state.gameCode}`
  try {
    const data = state._pendingPhotos
    if (!data || Object.keys(data).length === 0) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(data))
    }
  } catch (err) {
    // localStorage plein (rare : ~5MB par origin) — on ne bloque pas l'app,
    // on continue avec la queue en mémoire seule.
    console.warn('[photo-queue] persist failed:', err)
  }
}

function _updateCellUI(cellIdx) {
  const cellEl = document.querySelector(`.bingo-cell[data-cell="${cellIdx}"]`)
  if (!cellEl) return
  const pending = isPhotoPending(cellIdx)
  const failed  = isPhotoFailed(cellIdx)
  cellEl.classList.toggle('upload-pending', pending)
  cellEl.classList.toggle('upload-failed', failed)
}

function _showPermissionToastOnce() {
  if (_permissionToastShown) return
  _permissionToastShown = true
  import('../ui/toast.js').then(({ toast }) => toast('Photos désactivées (rules Storage)', 4000))
}
