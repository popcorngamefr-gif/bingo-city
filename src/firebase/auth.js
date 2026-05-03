/**
 * Firebase Auth — identité anonyme persistante
 *
 * Pas de login visible. Firebase crée un UID anonyme au premier lancement
 * et le réutilise les fois suivantes (tant que l'app n'est pas désinstallée).
 * Le profil (pseudo + avatar) est sauvegardé dans Firestore.
 */

import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config.js'
import { state }    from '../state.js'

// ─── Init (appelé au démarrage de l'app) ─────────────────────────────────────

/**
 * Connecte l'utilisateur anonymement et charge son profil.
 * Résout avec le User Firebase une fois l'auth établie.
 */
export function initAuth() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub() // one-shot
      try {
        if (!user) {
          const cred = await signInAnonymously(auth)
          user = cred.user
        }
        state.uid = user.uid
        await loadProfile(user.uid)
        resolve(user)
      } catch (err) {
        reject(err)
      }
    })
  })
}

// ─── Profil ───────────────────────────────────────────────────────────────────

/**
 * Charge le profil depuis Firestore et hydrate l'état local.
 */
export async function loadProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  if (data.name)   state.myName   = data.name
  if (data.avatar) state.myAvatar = { ...state.myAvatar, ...data.avatar }
  state.userProfile = data
  return data
}

/**
 * Sauvegarde / met à jour le profil dans Firestore.
 */
export async function saveProfile({ name, avatar }) {
  const uid = state.uid
  if (!uid) return

  const ref  = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const now  = serverTimestamp()

  if (snap.exists()) {
    await updateDoc(ref, { name, avatar, updatedAt: now })
  } else {
    await setDoc(ref, {
      name,
      avatar,
      stats: { totalGames: 0, totalScore: 0, bingos: 0, wins: 0 },
      createdAt: now,
      updatedAt: now,
    })
  }

  state.myName      = name
  state.myAvatar    = { ...avatar }
  state.userProfile = { ...(state.userProfile || {}), name, avatar }
}

/**
 * Incrémente les stats du joueur à la fin d'une partie.
 */
export async function updateStats({ score, hasBingo, isWinner }) {
  const uid = state.uid
  if (!uid) return
  const ref  = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const s = snap.data().stats || {}
  await updateDoc(ref, {
    'stats.totalGames': (s.totalGames || 0) + 1,
    'stats.totalScore': (s.totalScore || 0) + score,
    'stats.bingos':     (s.bingos     || 0) + (hasBingo  ? 1 : 0),
    'stats.wins':       (s.wins       || 0) + (isWinner  ? 1 : 0),
    updatedAt: serverTimestamp(),
  })
}
