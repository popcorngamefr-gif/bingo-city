/**
 * Firebase Game — gestion des salles en temps réel
 *
 * Structure Firestore :
 *   /games/{code}
 *     name, hostUid, status, selectedObjects, createdAt, startedAt
 *   /games/{code}/players/{uid}
 *     name, avatar, score, isMJ, hasBingo, grid, joinedAt
 */

import {
  doc, setDoc, getDoc, getDocs, updateDoc,
  collection, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config.js'
import { cleanForFirestore } from './auth.js'

// Listeners actifs — nettoyés via unsubscribeAll()
let _unsubPlayers = null
let _unsubGame    = null

// ─── Création ────────────────────────────────────────────────────────────────

export async function createGame({ code, name, hostUid, hostName, hostAvatar, duration = 1200 }) {
  const cleanAvatar = cleanForFirestore(hostAvatar || {})
  await setDoc(doc(db, 'games', code), {
    name:            name || 'Sans nom',
    hostUid,
    status:          'lobby',
    selectedObjects: [],
    duration,
    createdAt:       serverTimestamp(),
    startedAt:       null,
  })
  await setDoc(doc(db, 'games', code, 'players', hostUid), {
    name:      hostName || 'MJ',
    avatar:    cleanAvatar,
    score:     0,
    isMJ:      true,
    hasBingo:  false,
    grid:      [],
    joinedAt:  serverTimestamp(),
  })
}

/**
 * Récupère un game une seule fois (pas de subscribe).
 */
export async function getGameOnce(code) {
  const snap = await getDoc(doc(db, 'games', code))
  if (!snap.exists()) return null
  return snap.data()
}

/**
 * Récupère tous les joueurs d'une partie (one-shot).
 * Utilisé pour hydrater state.players à la restauration après reload.
 *
 * Rétrocompat : si l'animationUrl est stockée au top-level (ancien format),
 * on la fusionne dans avatar.animationUrl pour que le rendu soit cohérent.
 */
export async function getPlayersOnce(code) {
  const qs = await getDocs(collection(db, 'games', code, 'players'))
  return qs.docs.map(d => {
    const data = d.data()
    if (data.animationUrl && !data.avatar?.animationUrl) {
      data.avatar = { ...(data.avatar || {}), animationUrl: data.animationUrl }
    }
    return { id: d.id, ...data }
  })
}

/**
 * Récupère toutes les photos d'une partie (one-shot).
 * Utilisé pour reconstituer state.myGrid + state.myPhotos après reload.
 */
export async function getPhotosOnce(code) {
  const qs = await getDocs(collection(db, 'games', code, 'photos'))
  return qs.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Rejoindre ────────────────────────────────────────────────────────────────

export async function joinGame({ code, uid, name, avatar }) {
  const snap = await getDoc(doc(db, 'games', code))
  if (!snap.exists())               throw new Error('Partie introuvable')
  if (snap.data().status === 'ended') throw new Error('Partie déjà terminée')

  await setDoc(doc(db, 'games', code, 'players', uid), {
    name:     name || 'Joueur',
    avatar:   cleanForFirestore(avatar || {}),
    score:    0,
    isMJ:     false,
    hasBingo: false,
    grid:     [],
    joinedAt: serverTimestamp(),
  })
  return snap.data()
}

// ─── Démarrer ────────────────────────────────────────────────────────────────

export async function startGame(code, selectedObjects, customObjects = []) {
  await updateDoc(doc(db, 'games', code), {
    status:          'playing',
    selectedObjects,
    customObjects,                  // synchronisé pour que les joueurs aient les défs
    startedAt:       serverTimestamp(),
  })
}

// ─── Terminer ────────────────────────────────────────────────────────────────

export async function updateGameDuration(code, duration) {
  await updateDoc(doc(db, 'games', code), { duration })
}

export async function endGame(code) {
  await updateDoc(doc(db, 'games', code), { status: 'ended' })
}

/**
 * Écoute toutes les photos de la partie en temps réel.
 * @param {string} code
 * @param {Function} onUpdate — reçoit un tableau de { url, objId, uid, capturedAt }
 */
let _unsubPhotos = null
export function subscribeToPhotos(code, onUpdate) {
  if (_unsubPhotos) _unsubPhotos()
  _unsubPhotos = onSnapshot(
    collection(db, 'games', code, 'photos'),
    (snapshot) => {
      const photos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      onUpdate(photos)
    },
    (err) => console.warn('subscribeToPhotos:', err)
  )
  return _unsubPhotos
}

// ─── Mise à jour joueur ───────────────────────────────────────────────────────

export async function updatePlayerGrid(code, uid, grid) {
  await updateDoc(doc(db, 'games', code, 'players', uid), { grid })
}

export async function updatePlayerScore(code, uid, score, hasBingo = false) {
  const data = { score }
  if (hasBingo) data.hasBingo = true
  await updateDoc(doc(db, 'games', code, 'players', uid), data)
}

// ─── Listeners temps réel ────────────────────────────────────────────────────

/**
 * Écoute la liste des joueurs en temps réel.
 * @param {string}   code
 * @param {Function} onUpdate — reçoit un tableau de joueurs
 */
export function subscribeToPlayers(code, onUpdate) {
  if (_unsubPlayers) _unsubPlayers()
  _unsubPlayers = onSnapshot(
    collection(db, 'games', code, 'players'),
    (snapshot) => {
      const players = []
      snapshot.forEach(s => {
        const data = s.data()
        // Rétrocompat : ancien format avec animationUrl au top-level
        if (data.animationUrl && !data.avatar?.animationUrl) {
          data.avatar = { ...(data.avatar || {}), animationUrl: data.animationUrl }
        }
        players.push({ id: s.id, ...data })
      })
      onUpdate(players)
    },
    (err) => console.error('subscribeToPlayers error:', err)
  )
  return _unsubPlayers
}

/**
 * Écoute le document de la partie (status, selectedObjects…).
 * @param {string}   code
 * @param {Function} onUpdate — reçoit les données du doc
 */
export function subscribeToGame(code, onUpdate) {
  if (_unsubGame) _unsubGame()
  _unsubGame = onSnapshot(
    doc(db, 'games', code),
    (snap) => { if (snap.exists()) onUpdate(snap.data()) },
    (err) => console.error('subscribeToGame error:', err)
  )
  return _unsubGame
}

/** Stoppe tous les listeners actifs. */
export function unsubscribeAll() {
  if (_unsubPlayers) { _unsubPlayers(); _unsubPlayers = null }
  if (_unsubGame)    { _unsubGame();    _unsubGame    = null }
  if (_unsubPhotos)  { _unsubPhotos();  _unsubPhotos  = null }
}


/**
 * Patch le doc joueur (name, avatar) après que l'utilisateur ait fini son choix.
 *
 * IMPORTANT : `animationUrl` est mergé DANS `avatar.animationUrl` pour rester
 * cohérent avec saveProfile (Firestore /users) et avec le rendu via
 * avatarLayersHtml qui lit av.animationUrl.
 */
export async function updatePlayerProfile(gameCode, uid, { name, avatar, animationUrl }) {
  const playerRef = doc(db, 'games', gameCode, 'players', uid)
  const data = {}
  if (name)   data.name   = name
  if (avatar) data.avatar = avatar
  // Si on update juste l'animationUrl sans avatar complet, on patche en
  // dot-notation pour fusionner dans le sous-objet avatar sans l'écraser
  if (animationUrl && !avatar) {
    data['avatar.animationUrl'] = animationUrl
  } else if (animationUrl && avatar) {
    data.avatar = { ...avatar, animationUrl }
  }
  return updateDoc(playerRef, data)
}
