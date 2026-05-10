/**
 * Photo upload queue — fiabilise l'envoi des photos prises pendant une partie.
 *
 * Modèle de delivery :
 *   1. enqueuePhoto(idx, dataUrl, objId) → status='pending'
 *   2. _attempt() upload via uploadPhoto. Sur échec : exp backoff (2/4/8/16/32s,
 *      max 5 essais) puis status='failed' (mais on garde en queue, retentable).
 *   3. Sur succès : status='uploaded' (pas delete). On attend la confirmation
 *      par subscribeToPhotos via confirmFromPhotos() : seul le serveur dit
 *      "j'ai bien le doc". Tant qu'on n'a pas vu notre photo revenir via la
 *      souscription, on considère que la livraison n'est pas finalisée.
 *   4. confirmFromPhotos() est appelé depuis le handler subscribeToPhotos
 *      (main.js _setupGamePhotosSubscription). Il scan les entries 'uploaded'
 *      et supprime celles dont le doc Firestore est confirmé (uid + objId).
 *   5. Garde-fou anti-fantôme : une entry 'uploaded' qui ne reçoit jamais de
 *      confirmation passe automatiquement à 'pending' au bout de 2 min, ce qui
 *      relance _attempt. Couvre le cas où uploadPhoto a returned success mais
 *      le doc trace n'a pas vraiment commit côté serveur (rare).
 *
 * Cycle complet d'une photo "vraiment livrée" :
 *   pending → (upload OK) → uploaded → (snapshot confirme) → supprimée
 *
 * Cycle d'une photo qui échoue 5 fois :
 *   pending → (upload KO ×5) → failed (reste en queue, retentable manuellement
 *   via le badge ou auto via online event)
 *
 * Visuel côté UI : 'pending' ET 'uploaded' apparaissent comme "en cours"
 * (pulse jaune ↑) — l'utilisateur voit "en cours" jusqu'à confirmation finale,
 * pas juste jusqu'à l'upload. 'failed' = pulse rouge !
 */

import { state } from '../state.js'

const _retryTimers = {}
// Verrou par cellIdx : empêche deux _attempt en parallèle pour la même
// cellule (situation possible quand retryAllPending est appelé alors qu'un
// uploadPhoto est encore mid-await — sans ce verrou on aurait deux écritures
// concurrentes vers Storage / Firestore pour la même photo).
const _inFlight = {}
// Timeouts de réversion 'uploaded' → 'pending' si la confirmation tarde.
const _confirmTimers = {}
const CONFIRM_TIMEOUT_MS = 120000  // 2 min
let _permissionToastShown = false

export function enqueuePhoto(cellIdx, dataUrl, objId) {
  if (!state.gameCode || !state.uid || state.uid === 'me') return
  state._pendingPhotos = state._pendingPhotos || {}
  state._pendingPhotos[cellIdx] = {
    dataUrl,
    objId,
    attempts: 0,
    status:   'pending',
    // Tagué avec le gameCode pour éviter qu'une entry d'une partie A
    // se fasse fausssement confirmer par un snapshot d'une partie B
    // (cas viewHistoryGame qui change state.gameCode tout en gardant
    // _pendingPhotos en mémoire).
    gameCode: state.gameCode,
  }
  _persist()
  _updateCellUI(cellIdx)
  // Reset d'un éventuel retry timer en cours pour la même cellule
  // (cas : l'utilisateur reprend une photo qui avait échoué)
  if (_retryTimers[cellIdx]) {
    clearTimeout(_retryTimers[cellIdx])
    delete _retryTimers[cellIdx]
  }
  if (_confirmTimers[cellIdx]) {
    clearTimeout(_confirmTimers[cellIdx])
    delete _confirmTimers[cellIdx]
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
  // Une entry 'uploaded' attend la confirmation du serveur, on ne re-upload
  // pas (sinon on duplique vers Storage). Le timeout de réversion s'occupera
  // de retry si la confirmation tarde trop.
  if (entry.status === 'uploaded') return
  if (!state.gameCode || !state.uid || state.uid === 'me') return
  // Sécurité : si l'entry appartient à une autre partie (l'utilisateur a
  // navigué via history → state.gameCode a changé), on ne touche pas. Elle
  // sera traitée quand on reviendra à la bonne partie.
  if (entry.gameCode && entry.gameCode !== state.gameCode) return

  _inFlight[cellIdx] = true
  try {
    const { uploadPhoto } = await import('../firebase/storage.js')
    const url = await uploadPhoto(state.gameCode, state.uid, cellIdx, entry.dataUrl, entry.objId)
    state.myPhotos[cellIdx] = url

    // Re-sync grid + score : idempotent, rattrape les échecs éventuels du
    // handleValidation initial (qui faisait aussi des fire-and-forget).
    try {
      const { updatePlayerGrid, updatePlayerScore } = await import('../firebase/game.js')
      const { computeScore } = await import('../controllers/gameController.js')
      const score = computeScore()
      const me = state.players.find(p => p.isYou)
      if (me) me.score = score
      await updatePlayerGrid(state.gameCode, state.uid, state.myGrid)
      await updatePlayerScore(state.gameCode, state.uid, score)
    } catch (err) {
      console.warn('[photo-queue] post-upload state sync failed:', err)
    }

    // Pas de delete : on attend la confirmation Firestore via
    // confirmFromPhotos. Si jamais elle ne vient pas, _scheduleConfirmTimeout
    // relancera un _attempt (idempotent côté Storage).
    _markUploaded(cellIdx)
    console.log('[photo-queue] uploaded (awaiting server confirm)', cellIdx, '→', url)
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

function _markUploaded(cellIdx) {
  const entry = state._pendingPhotos?.[cellIdx]
  if (!entry) return
  entry.status = 'uploaded'
  entry.uploadedAt = Date.now()
  _persist()
  _updateCellUI(cellIdx)
  _scheduleConfirmTimeout(cellIdx)
}

function _scheduleConfirmTimeout(cellIdx) {
  if (_confirmTimers[cellIdx]) clearTimeout(_confirmTimers[cellIdx])
  _confirmTimers[cellIdx] = setTimeout(() => {
    delete _confirmTimers[cellIdx]
    const e = state._pendingPhotos?.[cellIdx]
    if (!e || e.status !== 'uploaded') return
    // Pas de confirmation après 2 min : on revient à 'pending' pour relancer
    // un cycle complet. uploadPhoto est idempotent (path fixe sur Storage,
    // doc trace keyé par uid_cellIdx).
    console.warn('[photo-queue] confirmation timeout, reverting to pending', cellIdx)
    e.status = 'pending'
    e.attempts = 0
    _persist()
    _updateCellUI(cellIdx)
    _attempt(cellIdx)
  }, CONFIRM_TIMEOUT_MS)
}

/**
 * Appelé depuis le handler subscribeToPhotos quand un nouveau snapshot arrive.
 * Pour chaque entry 'uploaded' dont le couple (uid, objId) apparaît dans la
 * collection photos Firestore : on supprime de la queue. Le serveur a
 * confirmé la livraison.
 */
export function confirmFromPhotos(photos) {
  if (!state._pendingPhotos || !state.uid || !state.gameCode) return
  let changed = false
  for (const cellIdx of Object.keys(state._pendingPhotos)) {
    const entry = state._pendingPhotos[cellIdx]
    if (entry.status !== 'uploaded') continue
    // L'entry doit appartenir à la partie courante. Sans ce check, un
    // snapshot d'une autre partie (consultée via viewHistoryGame, par
    // ex.) pourrait confirmer faussement une photo de la partie active
    // si les objId matchent par hasard → suppression locale d'une
    // photo qui n'est en fait pas encore vraiment côté serveur.
    if (entry.gameCode && entry.gameCode !== state.gameCode) continue
    const matched = photos.some(p => p.uid === state.uid && p.objId === entry.objId)
    if (matched) {
      delete state._pendingPhotos[cellIdx]
      if (_confirmTimers[cellIdx]) {
        clearTimeout(_confirmTimers[cellIdx])
        delete _confirmTimers[cellIdx]
      }
      _updateCellUI(parseInt(cellIdx))
      changed = true
    }
  }
  if (changed) _persist()
}

/**
 * Réessaye toutes les photos en queue. Appelé sur événement 'online' et
 * au boot via restorePendingPhotos.
 *
 * Les entries 'uploaded' sont laissées telles quelles : leur sort dépend de
 * la confirmation Firestore (ou du timeout de réversion). On ne les renvoie
 * pas pour éviter les doublons.
 */
export function retryAllPending() {
  if (!state._pendingPhotos) return
  for (const cellIdx of Object.keys(state._pendingPhotos)) {
    const entry = state._pendingPhotos[cellIdx]
    if (entry.status === 'uploaded') continue
    // Skip les entries d'une autre partie : on ne re-upload pas vers la
    // mauvaise gameCode. Elles seront retentées quand l'utilisateur
    // reviendra sur la bonne partie (boot/resumeActiveGame).
    if (entry.gameCode && entry.gameCode !== state.gameCode) continue
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
 * récupérer les photos qui n'ont pas pu être confirmées avant le reload.
 */
export function restorePendingPhotos() {
  if (!state.gameCode) return
  const key = `bingo_pending_photos_${state.gameCode}`
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      // Pas de queue persistée pour cette partie — on s'assure que la
      // mémoire ne contient pas non plus d'entries fantômes d'une partie
      // précédente (cas viewHistoryGame qui change state.gameCode sans
      // remettre _pendingPhotos à zéro).
      state._pendingPhotos = {}
      return
    }
    const data = JSON.parse(raw)
    // Backfill du gameCode sur les entries legacy (pré-fix isolation par
    // gameCode) : on était dans cette partie au moment du persist, donc
    // les entries sans tag appartiennent à state.gameCode.
    for (const entry of Object.values(data)) {
      if (!entry.gameCode) entry.gameCode = state.gameCode
    }
    state._pendingPhotos = data
    // Restaure aussi les dataURL dans state.myPhotos pour que l'UI les
    // affiche tant que la confirmation n'est pas arrivée.
    for (const [cellIdx, entry] of Object.entries(data)) {
      const idx = parseInt(cellIdx)
      if (!state.myPhotos[idx]) state.myPhotos[idx] = entry.dataUrl
      if (state.myGrid[idx] && state.myGrid[idx].status !== 'validated') {
        state.myGrid[idx].status = 'validated'
      }
      // Pour les entries 'uploaded' on relance le timeout de réversion :
      // si la confirmation arrive vite via subscribeToPhotos, l'entry est
      // supprimée avant le timeout. Sinon on retentera après 2 min.
      if (entry.status === 'uploaded') {
        _scheduleConfirmTimeout(idx)
      }
    }
    // Démarre les uploads en attente (skip les 'uploaded' qui attendent confirm)
    retryAllPending()
  } catch (err) {
    console.warn('[photo-queue] restore failed:', err)
  }
}

/**
 * Nettoie les photos en attente pour une partie donnée. Appelé quand on
 * abandonne / clear la partie courante (newGame, forgetActiveGame).
 */
export function clearPendingPhotos(gameCode) {
  if (!gameCode) return
  try {
    localStorage.removeItem(`bingo_pending_photos_${gameCode}`)
  } catch {}
  state._pendingPhotos = {}
  for (const idx of Object.keys(_retryTimers)) {
    clearTimeout(_retryTimers[idx])
    delete _retryTimers[idx]
  }
  for (const idx of Object.keys(_confirmTimers)) {
    clearTimeout(_confirmTimers[idx])
    delete _confirmTimers[idx]
  }
  // Reset aussi _inFlight : un upload mid-await au moment de
  // clearPendingPhotos laisserait sinon un flag orphelin qui bloquerait
  // silencieusement le prochain enqueue sur le même cellIdx dans la
  // partie suivante.
  for (const idx of Object.keys(_inFlight)) {
    delete _inFlight[idx]
  }
}

/**
 * Visuel : 'pending' ET 'uploaded' sont rendues comme "en cours" pour l'user.
 * Tant que le serveur n'a pas confirmé, on affiche le pulse pending.
 */
export function isPhotoPending(cellIdx) {
  const e = state._pendingPhotos?.[cellIdx]
  return !!e && (e.status === 'pending' || e.status === 'uploaded')
}

export function isPhotoFailed(cellIdx) {
  const e = state._pendingPhotos?.[cellIdx]
  return !!e && e.status === 'failed'
}

/**
 * Stats globales sur la queue d'upload — utilisé par le badge de sync
 * dans le HUD. 'pending' et 'uploaded' sont comptés ensemble dans pending
 * (l'utilisateur voit "en cours" tant que la livraison serveur n'est pas
 * confirmée).
 */
export function getQueueStats() {
  const pending = state._pendingPhotos || {}
  let pendingCount = 0
  let failedCount  = 0
  let uploadedOnly = 0  // sous-total : 'uploaded' seules (déjà sur Storage)
  for (const entry of Object.values(pending)) {
    if (entry.status === 'failed') failedCount++
    else {
      pendingCount++
      if (entry.status === 'uploaded') uploadedOnly++
    }
  }
  return {
    pending:      pendingCount,
    failed:       failedCount,
    total:        pendingCount + failedCount,
    uploadedOnly,
  }
}

function _persist() {
  if (!state.gameCode) return
  const key = `bingo_pending_photos_${state.gameCode}`
  try {
    // Ne persiste que les entries de la partie courante. Sans ce filtre,
    // si state._pendingPhotos contient encore des entries d'une partie
    // précédente (race entre changement de gameCode et opération async),
    // on les écrirait par erreur dans le localStorage de la nouvelle
    // partie.
    const data = state._pendingPhotos || {}
    const relevant = {}
    for (const [idx, entry] of Object.entries(data)) {
      if (!entry.gameCode || entry.gameCode === state.gameCode) {
        relevant[idx] = entry
      }
    }
    if (Object.keys(relevant).length === 0) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(relevant))
    }
  } catch (err) {
    console.warn('[photo-queue] persist failed:', err)
  }
}

function _updateCellUI(cellIdx) {
  const cellEl = document.querySelector(`.bingo-cell[data-cell="${cellIdx}"]`)
  if (cellEl) {
    const pending = isPhotoPending(cellIdx)
    const failed  = isPhotoFailed(cellIdx)
    cellEl.classList.toggle('upload-pending', pending)
    cellEl.classList.toggle('upload-failed', failed)
  }
  _updateSyncBadge()
}

function _updateSyncBadge() {
  const el = document.getElementById('game-sync-badge')
  if (!el) return
  const stats = getQueueStats()
  if (stats.failed > 0) {
    el.dataset.state = 'failed'
    el.textContent = `! ${stats.failed} échec${stats.failed > 1 ? 's' : ''} · ↻ réessayer`
  } else if (stats.pending > 0) {
    el.dataset.state = 'pending'
    el.textContent = `↑ ${stats.pending} en cours · ↻ relancer`
  } else {
    el.dataset.state = 'ok'
    el.textContent = '✓ tout sur le serveur · ↻ vérifier'
  }
}

function _showPermissionToastOnce() {
  if (_permissionToastShown) return
  _permissionToastShown = true
  import('../ui/toast.js').then(({ toast }) => toast('Photos désactivées (rules Storage)', 4000))
}
