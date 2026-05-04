/**
 * State global de Bingo Santé
 * uid + userProfile persistent via Firebase Auth/Firestore.
 * Le reste est réinitialisé entre les parties.
 */

export const state = {
  // Identité Firebase (persist across games)
  uid:         null,
  userProfile: null,   // { name, avatar, stats, ... }
  accountKey:  null,   // clé Firestore du compte PIN (pseudo normalisé)

  // Partie
  isMJ:     false,
  myName:   '',
  myAvatar: { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 },

  gameCode:        null,
  gameName:        '',
  players:         [],   // { id, name, avatar, score, isMJ, isYou, justJoined, hasBingo }
  selectedObjects: [],   // ids des objets choisis par MJ
  customObjects:   [],   // objets créés par le MJ : { id, name, icon, points }
  gameDuration:    7200, // durée en secondes (default 2h, range 2h-3j)
  myGrid:          [],   // { objId, status: 'empty' | 'validated' }

  // Photos capturées : { [cellIdx]: url (Storage) ou dataUrl (avant upload) }
  myPhotos: {},

  // Animation vidéo générée par wan-2.2-i2v-fast (mode premium Déglingo IA)
  // { url: string|null, _ready: bool, error?: string }
  myAnimation: null,
  selectedMoodPrompt: null,  // prompt choisi via le mood picker
  selectedMoodKey:    null,  // 'deglingo' | 'determine' | 'appere' | 'fou' | 'custom'

  // En cours
  currentPickingObj: null,

  // Timer
  timer:         7200,    // décompte courant (= gameDuration au démarrage)
  timerInterval: null,

  // Routing
  currentScreen: 'home',
}

/**
 * Génère un code de partie à 4 caractères (sans 0/O/I/1 ambigus).
 */
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/**
 * Reset du state entre les parties.
 * Ne touche pas à uid / userProfile — l'identité persiste.
 */
export function resetGame() {
  state.isMJ            = false
  state.myName          = state.userProfile?.name  || ''
  state.myAvatar        = { ...(state.userProfile?.avatar || { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 }) }
  state.gameCode        = null
  state.gameName        = ''
  state.players         = []
  state.selectedObjects = []
  state.customObjects   = []
  state.gameDuration    = 7200
  state.myGrid          = []
  state.myPhotos        = {}
  state.myAnimation = null
  state.selectedMoodPrompt = null
  state.selectedMoodKey    = null
  state.currentPickingObj = null
  state.timer           = state.gameDuration
  if (state.timerInterval) {
    clearInterval(state.timerInterval)
    state.timerInterval = null
  }
}
