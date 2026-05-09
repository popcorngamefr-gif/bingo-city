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
import { cacheProfile } from '../utils/profileCache.js'

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
  if (data.name)       state.myName     = data.name
  if (data.avatar)     state.myAvatar   = { ...state.myAvatar, ...data.avatar }
  if (data.accountKey) state.accountKey = data.accountKey
  state.userProfile = data
  // Rafraîchit le cache local avec la version Firestore (source de vérité)
  cacheProfile({ name: state.myName, avatar: state.myAvatar })
  return data
}

/**
 * Sauvegarde / met à jour le profil dans Firestore.
 */
// Nettoie un objet pour Firestore (vire les undefined qui plantent setDoc)
export function cleanForFirestore(obj) {
  if (obj === null || obj === undefined) return null
  if (Array.isArray(obj)) return obj.map(cleanForFirestore).filter(v => v !== undefined)
  if (typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    out[k] = cleanForFirestore(v)
  }
  return out
}

export async function saveProfile({ name, avatar }) {
  const uid = state.uid
  if (!uid) return

  const ref  = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const now  = serverTimestamp()

  // Nettoie avatar des undefined qui plantent Firestore
  const cleanAvatar = cleanForFirestore(avatar || {})
  // Inclut accountKey s'il existe (lien compte PIN ↔ uid)
  const baseFields = { name: name || 'Anonyme', avatar: cleanAvatar, updatedAt: now }
  if (state.accountKey) baseFields.accountKey = state.accountKey

  if (snap.exists()) {
    await updateDoc(ref, baseFields)
  } else {
    await setDoc(ref, {
      ...baseFields,
      stats: { totalGames: 0, totalScore: 0, bingos: 0, wins: 0 },
      createdAt: now,
    })
  }

  // Si compte PIN actif → sync l'avatar dans /accounts/{key} aussi
  // pour qu'il soit récupéré au login depuis un autre device
  if (state.accountKey) {
    try {
      const accRef = doc(db, 'accounts', state.accountKey)
      await updateDoc(accRef, { avatar: cleanAvatar, name: name || 'Anonyme', updatedAt: now })
    } catch (err) {
      console.warn('[saveProfile] sync to accounts failed:', err)
    }
  }

  // Sync state local — merge propre, ne touche aux champs que si fournis
  state.myAvatar    = { ...state.myAvatar, ...cleanAvatar }
  if (name) state.myName = name
  state.userProfile = { ...(state.userProfile || {}), name: state.myName, avatar: state.myAvatar }
  // Cache local pour permettre un boot offline-friendly
  cacheProfile({ name: state.myName, avatar: state.myAvatar })
}

/**
 * Incrémente les stats du joueur à la fin d'une partie.
 * Sync aussi sur /accounts/{key} si l'user a un compte PIN
 * (nécessaire pour le Hall of Fame mondial).
 */
export async function updateStats({ score, hasBingo, isWinner }) {
  const uid = state.uid
  if (!uid) return
  const ref  = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const s = snap.data().stats || {}
  const newStats = {
    totalGames: (s.totalGames || 0) + 1,
    totalScore: (s.totalScore || 0) + score,
    bingos:     (s.bingos     || 0) + (hasBingo ? 1 : 0),
    wins:       (s.wins       || 0) + (isWinner ? 1 : 0),
  }

  await updateDoc(ref, {
    'stats.totalGames': newStats.totalGames,
    'stats.totalScore': newStats.totalScore,
    'stats.bingos':     newStats.bingos,
    'stats.wins':       newStats.wins,
    updatedAt: serverTimestamp(),
  })

  // Hall of Fame : on duplique sur /accounts/{key} (qui contient le pseudo)
  // Seuls les comptes PIN apparaissent dans le classement mondial.
  if (state.accountKey) {
    try {
      const { syncAccountStats } = await import('./account.js')
      await syncAccountStats(state.accountKey, newStats)
    } catch (err) {
      console.warn('[updateStats] syncAccountStats failed:', err)
    }
  }
}
