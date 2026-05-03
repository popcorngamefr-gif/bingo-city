/**
 * Firebase Storage — upload des photos capturées
 *
 * Chemin : games/{code}/{uid}/photo_{cellIdx}.jpg
 * Retourne l'URL publique de téléchargement.
 */

import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { doc, setDoc, serverTimestamp }       from 'firebase/firestore'
import { storage, db }                        from './config.js'

/**
 * @param {string} gameCode
 * @param {string} uid
 * @param {number} cellIdx
 * @param {string} dataUrl  — "data:image/jpeg;base64,..."
 * @param {string} objId    — pour la trace Firestore
 * @returns {Promise<string>} URL publique
 */
export async function uploadPhoto(gameCode, uid, cellIdx, dataUrl, objId) {
  const path        = `games/${gameCode}/${uid}/photo_${cellIdx}.jpg`
  const storageRef  = ref(storage, path)
  const snapshot    = await uploadString(storageRef, dataUrl, 'data_url')
  const url         = await getDownloadURL(snapshot.ref)

  // Trace dans Firestore (optionnel — utile pour l'écran de fin côté tous les joueurs)
  await setDoc(
    doc(db, 'games', gameCode, 'photos', `${uid}_${cellIdx}`),
    { url, objId, uid, capturedAt: serverTimestamp() }
  )

  return url
}
