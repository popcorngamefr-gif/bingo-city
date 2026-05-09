/**
 * Cache localStorage du profil utilisateur (pseudo + avatar + URLs IA).
 *
 * Pourquoi : sur boot avec réseau pourri, Firestore peut mettre 10s à
 * répondre. Hydrater state.myAvatar dès le DOMContentLoaded depuis le cache
 * permet de :
 *   - rendre instantanément l'avatar (le navigateur a souvent l'image en
 *     cache HTTP),
 *   - laisser l'utilisateur voir sa propre tête sur l'écran de chargement,
 *   - afficher l'écran d'accueil même si le Firestore initial timeout —
 *     les URLs cachées suffisent à montrer photo et vidéo profil.
 *
 * Le cache est mis à jour à chaque saveProfile réussi.
 */

const KEY     = 'bingo_profile_cache'
const MAX_AGE = 30 * 24 * 3600 * 1000  // 30 jours — au-delà, on resync

export function cacheProfile({ name, avatar }) {
  if (!avatar && !name) return
  try {
    localStorage.setItem(KEY, JSON.stringify({
      name:    name || '',
      avatar:  avatar || {},
      savedAt: Date.now(),
    }))
  } catch {}
}

export function loadProfileCache() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.savedAt > MAX_AGE) {
      localStorage.removeItem(KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function clearProfileCache() {
  try { localStorage.removeItem(KEY) } catch {}
}
