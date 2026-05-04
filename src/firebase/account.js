/**
 * Système de compte Pseudo + PIN
 * Permet de retrouver son profil sur un autre appareil ou après effacement du cache.
 *
 * Firestore : /accounts/{pseudo_normalized}
 *   name, pin, uid, avatar, stats, createdAt, updatedAt
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config.js'

/** Normalise un pseudo pour l'utiliser comme clé Firestore. */
function normalize(pseudo) {
  return pseudo.trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Vérifie si un pseudo est disponible.
 * @returns {Promise<boolean>}
 */
export async function checkPseudoAvailable(pseudo) {
  const snap = await getDoc(doc(db, 'accounts', normalize(pseudo)))
  return !snap.exists()
}

/**
 * Crée un nouveau compte.
 * @throws si le pseudo est déjà pris
 */
export async function createAccount({ pseudo, pin, uid, name, avatar }) {
  const key  = normalize(pseudo)
  const snap = await getDoc(doc(db, 'accounts', key))
  if (snap.exists()) throw new Error('Ce pseudo est déjà pris')

  await setDoc(doc(db, 'accounts', key), {
    name,
    pin,                    // PIN en clair — jeu, pas une banque
    uid,
    avatar,
    stats: { totalGames: 0, totalScore: 0, bingos: 0, wins: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return key
}

/**
 * Connexion avec pseudo + PIN.
 * @returns {Promise<{name, avatar, stats, uid}>} profil chargé
 * @throws si pseudo inconnu ou PIN incorrect
 */
export async function loginWithPin({ pseudo, pin }) {
  const key  = normalize(pseudo)
  const snap = await getDoc(doc(db, 'accounts', key))
  if (!snap.exists())           throw new Error('Pseudo introuvable')
  const data = snap.data()
  if (data.pin !== pin)         throw new Error('PIN incorrect')
  return { key, ...data }
}

/**
 * Met à jour l'UID actuel dans le compte (changement d'appareil).
 */
export async function updateAccountUID(key, uid) {
  await updateDoc(doc(db, 'accounts', key), { uid, updatedAt: serverTimestamp() })
}

/**
 * Synchro des stats dans le compte (appelé depuis auth.updateStats).
 */
export async function syncAccountStats(key, stats) {
  await updateDoc(doc(db, 'accounts', key), { stats, updatedAt: serverTimestamp() })
}


/**
 * Met à jour l'avatar dans le doc /accounts/{key}.
 */
export async function updateAccountAvatar(key, avatar) {
  await updateDoc(doc(db, 'accounts', key), { avatar, updatedAt: serverTimestamp() })
}
