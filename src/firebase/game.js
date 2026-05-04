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
  doc, setDoc, getDoc, updateDoc,
  collection, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from './config.js'

// Listeners actifs — nettoyés via unsubscribeAll()
let _unsubPlayers = null
let _unsubGame    = null

// ─── Création ────────────────────────────────────────────────────────────────

export async function createGame({ code, name, hostUid, hostName, hostAvatar, duration = 1200 }) {
  await setDoc(doc(db, 'games', code), {
    name,
    hostUid,
    status:          'lobby',
    selectedObjects: [],
    duration,
    createdAt:       serverTimestamp(),
    startedAt:       null,
  })
  await setDoc(doc(db, 'games', code, 'players', hostUid), {
    name:      hostName,
    avatar:    hostAvatar,
    score:     0,
    isMJ:      true,
    hasBingo:  false,
    grid:      [],
    joinedAt:  serverTimestamp(),
  })
}

// ─── Rejoindre ────────────────────────────────────────────────────────────────

export async function joinGame({ code, uid, name, avatar }) {
  const snap = await getDoc(doc(db, 'games', code))
  if (!snap.exists())               throw new Error('Partie introuvable')
  if (snap.data().status === 'ended') throw new Error('Partie déjà terminée')

  await setDoc(doc(db, 'games', code, 'players', uid), {
    name,
    avatar,
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
      snapshot.forEach(s => players.push({ id: s.id, ...s.data() }))
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
}


/**
 * Patch le doc joueur (name, avatar) après que l'utilisateur ait fini son choix.
 */
export async function updatePlayerProfile(gameCode, uid, { name, avatar, animationUrl }) {
  const playerRef = doc(db, 'games', gameCode, 'players', uid)
  const data = {}
  if (name)         data.name         = name
  if (avatar)       data.avatar       = avatar
  if (animationUrl) data.animationUrl = animationUrl
  return updateDoc(playerRef, data)
}
