/**
 * State global de Bingo City
 * Tout est en mémoire pour le proto. Plus tard on branchera Firebase ici.
 */

export const state = {
  // Identité
  isMJ: false,
  myName: '',
  myAvatar: { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 },

  // Partie
  gameCode: null,
  gameName: '',
  players: [],         // { id, name, avatar, score, isMJ, isYou, justJoined, hasBingo }
  selectedObjects: [], // ids des objets choisis par MJ
  myGrid: [],          // { objId, status: 'empty' | 'pending' | 'validated' | 'rejected' }

  // Validation
  pendingValidations: [], // { playerId, playerName, objId, cellIdx, timestamp }
  currentPickingObj: null,

  // Timer
  timer: 1800,
  timerInterval: null,

  // Routing
  currentScreen: 'home',
}

/**
 * Génère un code de partie à 4 caractères (sans 0/O/I/1 confus)
 */
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

/**
 * Génère un avatar aléatoire (pour les joueurs simulés)
 */
export function randomAvatar() {
  return {
    skin: Math.floor(Math.random() * 9),
    eyes: Math.floor(Math.random() * 7),
    hairStyle: Math.floor(Math.random() * 15),
    hairColor: Math.floor(Math.random() * 7),
    acc: Math.floor(Math.random() * 15), // 0 = aucun
  }
}

/**
 * Reset du state pour nouvelle partie
 */
export function resetGame() {
  state.gameCode = null
  state.gameName = ''
  state.players = []
  state.selectedObjects = []
  state.myGrid = []
  state.pendingValidations = []
  state.currentPickingObj = null
  state.timer = 1800
  if (state.timerInterval) {
    clearInterval(state.timerInterval)
    state.timerInterval = null
  }
}
