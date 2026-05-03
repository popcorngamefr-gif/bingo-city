/**
 * State global de Bingo Santé
 * Tout est en mémoire pour le proto. Plus tard on branchera Firebase ici.
 */

export const state = {
  // Identité
  isMJ:     false,
  myName:   '',
  myAvatar: { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 },

  // Partie
  gameCode:  null,
  gameName:  '',
  players:   [],         // { id, name, avatar, score, isMJ, isYou, justJoined, hasBingo }
  selectedObjects: [],   // ids des objets choisis par MJ
  myGrid:    [],         // { objId, status: 'empty' | 'validated' | 'rejected' }

  // Photos capturées : { [cellIdx]: dataUrl }
  myPhotos: {},

  // En cours
  currentPickingObj: null,

  // Timer
  timer:         1800,
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
 * Reset du state pour une nouvelle partie.
 */
export function resetGame() {
  state.gameCode        = null
  state.gameName        = ''
  state.players         = []
  state.selectedObjects = []
  state.myGrid          = []
  state.myPhotos        = {}
  state.currentPickingObj = null
  state.timer           = 1800
  if (state.timerInterval) {
    clearInterval(state.timerInterval)
    state.timerInterval = null
  }
}
