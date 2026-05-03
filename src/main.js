/**
 * BINGO SANTÉ — Varsovie Édition
 * Entry point : auth Firebase + router + délégation d'événements
 */

import './styles/main.css'
import './styles/ui.css'
import './styles/screens.css'

import { state, generateCode, resetGame } from './state.js'
import { initRouter, navigate, show }     from './router.js'
import { toast }                          from './ui/toast.js'
import { randomAvatar }                   from './utils/random.js'
import { getObjects }                     from './data/objects.js'
import { PORTRAIT }                       from './data/portrait.js'

import { refreshAvatarUI, cycleAvatarField, setupAvatarLoops, updateHudConfidence, checkHeartbeat } from './controllers/avatarController.js'
import { startTimer }                     from './controllers/timerController.js'
import { simulateJoin }                   from './controllers/gameController.js'
import { openCameraModal, closeModal }    from './ui/modal.js'

import { initAuth, saveProfile }          from './firebase/auth.js'
import { createGame, joinGame, startGame, subscribeToPlayers, subscribeToGame, unsubscribeAll } from './firebase/game.js'

/* ============================================================
   LOBBY — suivi temps réel des joueurs
   ============================================================ */

// UIDs déjà vus dans la session lobby (pour détecter les nouveaux)
const _seenPlayerIds = new Set()

function _onPlayersUpdate(players) {
  const newIds = players
    .filter(p => !_seenPlayerIds.has(p.id))
    .map(p => { _seenPlayerIds.add(p.id); return p.id })

  state.players = players.map(p => ({
    ...p,
    isYou:      p.id === state.uid,
    justJoined: newIds.includes(p.id),
  }))

  if (state.currentScreen === 'lobby') {
    show('lobby')
    if (newIds.length) {
      setTimeout(() => {
        state.players = state.players.map(p => ({ ...p, justJoined: false }))
      }, 600)
    }
  }
}

function _onGameUpdate(gameData) {
  // Non-MJ : démarre la partie quand le MJ lance
  if (
    gameData.status === 'playing' &&
    state.currentScreen === 'lobby' &&
    !state.isMJ
  ) {
    state.selectedObjects = gameData.selectedObjects || []
    state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
    startTimer()
    navigate('game')
  }
  // Tout le monde : si la partie est terminée côté serveur, aller à l'écran de fin
  if (gameData.status === 'ended' && state.currentScreen === 'game') {
    navigate('end')
  }
}

function _setupLobbySubscriptions() {
  _seenPlayerIds.clear()
  if (!state.gameCode) return
  subscribeToPlayers(state.gameCode, _onPlayersUpdate)
  subscribeToGame(state.gameCode, _onGameUpdate)
}

/* ============================================================
   ACTIONS
   ============================================================ */
const ACTIONS = {

  goCreate() {
    state.isMJ = true
    navigate('create')
  },

  goJoin() {
    state.isMJ = false
    navigate('join')
  },

  showHelp() {
    toast("Le MJ choisit les objets, vous les trouvez en photo. Premier à compléter sa grille gagne !", 4000)
  },

  async createGame() {
    const gameName = (document.getElementById('game-name-input')?.value || '').trim() || 'Sans nom'
    const myName   = (document.getElementById('creator-name-input')?.value || '').trim()
    if (!myName) return toast('Entre ton pseudo')

    state.gameName = gameName
    state.myName   = myName
    state.gameCode = generateCode()
    navigate('avatar')
  },

  async joinGame() {
    const code   = (document.getElementById('join-code-input')?.value || '').trim().toUpperCase()
    const myName = (document.getElementById('joiner-name-input')?.value || '').trim()
    if (code.length < 4) return toast('Code à 4 caractères')
    if (!myName)          return toast('Entre ton pseudo')

    try {
      await joinGame({ code, uid: state.uid, name: myName, avatar: state.myAvatar })
      state.gameCode = code
      state.myName   = myName
      navigate('avatar')
    } catch (err) {
      toast(err.message || 'Impossible de rejoindre')
    }
  },

  randomizeAvatar() {
    state.myAvatar = randomAvatar()
    refreshAvatarUI({ mood: 'jump', sparkles: true, duration: 600 })
  },

  async confirmAvatar() {
    const nameInput = document.getElementById('avatar-name-input')
    if (nameInput) {
      const v = nameInput.value.trim()
      if (v) state.myName = v
    }

    // Sauvegarde le profil dans Firestore
    try {
      await saveProfile({ name: state.myName || 'Anonyme', avatar: state.myAvatar })
    } catch (err) {
      console.warn('saveProfile failed:', err)
    }

    const me = {
      id:     state.uid || 'me',
      name:   state.myName || 'Moi',
      avatar: { ...state.myAvatar },
      score:  0,
      isMJ:   state.isMJ,
      isYou:  true,
    }

    if (state.isMJ) {
      state.players = [me]
      // Crée la salle dans Firestore
      try {
        await createGame({
          code:        state.gameCode,
          name:        state.gameName,
          hostUid:     state.uid,
          hostName:    state.myName,
          hostAvatar:  state.myAvatar,
        })
      } catch (err) {
        console.warn('createGame failed:', err)
        // Fallback : on continue quand même en local
        setTimeout(() => simulateJoin('Marion'), 800)
        setTimeout(() => simulateJoin('Karim'),  2000)
        setTimeout(() => simulateJoin('Léa'),    3400)
      }
    } else {
      // Mise à jour du doc joueur avec l'avatar définitif
      try {
        const { updatePlayerGrid } = await import('./firebase/game.js')
        await updatePlayerGrid(state.gameCode, state.uid, [])
      } catch {}
      state.players = [me]
    }

    navigate('lobby')
  },

  startGame() {
    if (state.selectedObjects.length < 6) return toast('Min. 6 objets')
    state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))

    // Push vers Firestore pour que les non-MJ démarrent aussi
    if (state.gameCode) {
      startGame(state.gameCode, state.selectedObjects).catch(console.error)
    }

    startTimer()
    navigate('game')
  },

  cancelPhoto() {
    closeModal()
    state.currentPickingObj = null
  },

  newGame() {
    unsubscribeAll()
    resetGame()
    navigate('home')
  },
}

/* ============================================================
   DÉLÉGATION D'ÉVÉNEMENTS GLOBALE
   ============================================================ */
function setupEventDelegation() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest(
      '[data-action],[data-nav],[data-cycle],[data-toggle-obj],[data-cell]'
    )
    if (!target || target.disabled) return

    // 1. Action
    const action = target.dataset.action
    if (action && ACTIONS[action]) {
      e.preventDefault()
      ACTIONS[action]()
      return
    }

    // 2. Navigation
    const nav = target.dataset.nav
    if (nav) {
      e.preventDefault()
      navigate(nav)
      return
    }

    // 3. Cycle avatar
    const cycleExpr = target.dataset.cycle
    if (cycleExpr) {
      const [field, dirStr] = cycleExpr.split(':')
      cycleAvatarField(field, parseInt(dirStr, 10))
      return
    }

    // 4. Toggle objet (setup) — flash counter
    const objId = target.dataset.toggleObj
    if (objId) {
      const idx = state.selectedObjects.indexOf(objId)
      if (idx >= 0) {
        state.selectedObjects.splice(idx, 1)
      } else if (state.selectedObjects.length < 25) {
        state.selectedObjects.push(objId)
      } else {
        return toast('Max 25 objets')
      }
      show('setup')
      requestAnimationFrame(() => {
        const counter = document.getElementById('obj-counter')
        if (!counter) return
        counter.classList.remove('flash')
        void counter.offsetWidth
        counter.classList.add('flash')
      })
      return
    }

    // 5. Cellule de bingo
    const cellAttr = target.dataset.cell
    if (cellAttr !== undefined) {
      const idx  = parseInt(cellAttr, 10)
      const cell = state.myGrid[idx]
      if (cell.status === 'validated') return toast('Déjà capturé !')
      openCameraModal(idx)
      return
    }
  })
}

/* ============================================================
   INPUT FILTERS
   ============================================================ */
function setupInputFilters() {
  document.addEventListener('input', (e) => {
    if (e.target.id === 'join-code-input') {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    }
  })
}

/* ============================================================
   GESTION DES SUBSCRIPTIONS PAR SCREEN
   ============================================================ */
function setupScreenHooks() {
  window.addEventListener('hashchange', () => {
    const screen = state.currentScreen
    setTimeout(() => {
      setupAvatarLoops()
      if (screen === 'game') {
        updateHudConfidence()
        checkHeartbeat()
      }
      if (screen === 'lobby') {
        _setupLobbySubscriptions()
      }
      if (screen === 'home' || screen === 'end') {
        unsubscribeAll()
      }
    }, 50)
  })
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  setupInputFilters()
  setupEventDelegation()
  setupScreenHooks()

  // Affiche l'app en mode "chargement" le temps que Firebase auth réponde
  document.getElementById('app').innerHTML = `
    <section class="screen" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
      <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:var(--ink);text-align:center;line-height:1.8;">
        BINGO SANTÉ<br>VARSOVIE
      </div>
      <div style="font-family:'VT323',monospace;font-size:18px;color:var(--ink-soft);">
        Connexion...
      </div>
    </section>
  `

  try {
    await initAuth()
  } catch (err) {
    console.warn('Auth failed, running offline:', err)
    // Fallback sans Firebase — le jeu fonctionne en local
  }

  initRouter()
  setTimeout(setupAvatarLoops, 100)

  console.log('🍻 Bingo Santé Varsovie ready', {
    uid:         state.uid,
    hasProfile:  !!state.userProfile,
    skins:       PORTRAIT.skins.length,
    hairStyles:  PORTRAIT.hairStyles.length,
    accessories: PORTRAIT.accessories.length,
    objects:     getObjects().length,
  })
})
