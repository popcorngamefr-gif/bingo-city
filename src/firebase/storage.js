/**
 * Firebase Storage — upload des photos capturées et des avatars persistants
 *
 * Photos partie    : games/{code}/{uid}/photo_{cellIdx}.jpg
 * Avatar image     : avatars/{uid}/image.png
 * Avatar animation : avatars/{uid}/animation.mp4
 *
 * Pour les avatars, on télécharge depuis l'URL Replicate (volatile, expire ~24h)
 * puis on uploade vers Storage pour avoir une URL stable à vie.
 */

import { ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage'
import { doc, setDoc, serverTimestamp }                   from 'firebase/firestore'
import { storage, db }                                    from './config.js'
import { fetchWithTimeout }                               from '../utils/network.js'

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

/**
 * Télécharge un fichier depuis une URL distante (typiquement Replicate)
 * et l'uploade dans Firebase Storage. Retourne l'URL Storage permanente.
 *
 * @param {string} sourceUrl  — URL source (Replicate, http(s) public)
 * @param {string} destPath   — ex: 'avatars/abc123/image.png'
 * @param {string} contentType — 'image/png', 'video/mp4', etc.
 * @returns {Promise<string>} URL Storage permanente
 */
async function _mirrorToStorage(sourceUrl, destPath, contentType) {
  // Timeout 25s : un avatar fait < 1 Mo, une vidéo Déglingo ~ 1-3 Mo. En 4G
  // dégradée ça reste OK ; au-delà on préfère échouer proprement et garder
  // l'URL Replicate (volatile mais valide pour la session courante).
  const res = await fetchWithTimeout(sourceUrl, {}, 25000)
  if (!res.ok) throw new Error(`Failed to fetch source (${res.status})`)
  const blob = await res.blob()
  const storageRef = ref(storage, destPath)
  const snapshot = await uploadBytes(storageRef, blob, { contentType })
  return await getDownloadURL(snapshot.ref)
}

/**
 * Mirror l'image avatar Replicate vers Storage. Si déjà une URL Storage, no-op.
 * @returns {Promise<string>} URL Storage permanente
 */
export async function uploadAvatarImage(uid, replicateUrl) {
  if (!uid || !replicateUrl) throw new Error('uid + url requis')
  // Idempotence : si l'URL est déjà sur Firebase Storage, on ne refait pas l'upload
  if (replicateUrl.includes('firebasestorage.googleapis.com')) return replicateUrl
  return _mirrorToStorage(replicateUrl, `avatars/${uid}/image.png`, 'image/png')
}

/**
 * Mirror la vidéo Déglingo Replicate vers Storage. Idempotent.
 * @returns {Promise<string>} URL Storage permanente
 */
export async function uploadAvatarVideo(uid, replicateUrl) {
  if (!uid || !replicateUrl) throw new Error('uid + url requis')
  if (replicateUrl.includes('firebasestorage.googleapis.com')) return replicateUrl
  return _mirrorToStorage(replicateUrl, `avatars/${uid}/animation.mp4`, 'video/mp4')
}
