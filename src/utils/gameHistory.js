/**
 * Historique local des parties terminées.
 *
 * Permet à l'utilisateur de revenir consulter le classement de ses N
 * dernières parties même après en avoir lancé une nouvelle. Stockage
 * léger : on ne garde que la méta (code, name, isMJ, myName, endedAt) ;
 * la donnée réelle (joueurs, photos) est rechargée depuis Firestore au
 * moment de l'affichage. Si le doc Firestore a été supprimé entre-temps
 * (cleanup côté admin, expiration), l'entry historique est invalidée
 * et nettoyée à ce moment-là.
 *
 * Limite : MAX_ENTRIES (5). Au-delà, la plus ancienne saute. Pas
 * d'expiration temporelle — c'est l'utilisateur qui pilote son
 * historique (X par carte ou abandon implicite quand le serveur a
 * supprimé la donnée).
 */

const KEY = 'bingo_game_history'
const MAX_ENTRIES = 5

function _readRaw() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function _writeRaw(list) {
  try {
    if (!list || list.length === 0) {
      localStorage.removeItem(KEY)
    } else {
      localStorage.setItem(KEY, JSON.stringify(list))
    }
  } catch {
    // localStorage plein ou indispo — silently ignored, l'historique
    // reste en mémoire pour la session courante mais ne survivra pas au
    // reload. Pas critique : c'est une feature de confort.
  }
}

/**
 * Ajoute (ou met à jour) une entry dans l'historique. Les doublons par
 * code sont remplacés (utile si on rejoue le même code après cleanup).
 * Trie par endedAt desc et truncate à MAX_ENTRIES.
 */
export function archiveGame({ code, name, isMJ, myName, endedAt }) {
  if (!code) return
  const list = _readRaw().filter(g => g.code !== code)
  list.unshift({
    code,
    name:    name    || 'Sans nom',
    isMJ:    !!isMJ,
    myName:  myName  || '',
    endedAt: endedAt || Date.now(),
  })
  list.sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))
  _writeRaw(list.slice(0, MAX_ENTRIES))
}

export function loadHistory() {
  return _readRaw()
}

export function removeFromHistory(code) {
  if (!code) return
  _writeRaw(_readRaw().filter(g => g.code !== code))
}

export function clearHistory() {
  _writeRaw([])
}

/**
 * Helper d'affichage pour un timestamp (ms epoch) en relatif court.
 * Ex: "il y a 2h", "il y a 3j", "à l'instant".
 */
export function formatRelativeTime(ts) {
  if (!ts) return ''
  const diffMs = Date.now() - ts
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60)            return `à l'instant`
  const min = Math.floor(sec / 60)
  if (min < 60)            return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)              return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)               return `il y a ${d}j`
  const w = Math.floor(d / 7)
  return `il y a ${w} sem.`
}
