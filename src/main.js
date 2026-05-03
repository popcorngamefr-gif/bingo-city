/**
 * BINGO SANTÉ — Varsovie Édition
 * Entry point : styles + router + délégation d'événements
 */

import './styles/main.css'
import './styles/ui.css'
import './styles/screens.css'

import { state, generateCode, resetGame } from './state.js'
import { initRouter, navigate, show } from './router.js'
import { toast } from './ui/toast.js'
import { randomAvatar } from './utils/random.js'
import { getObjects } from './data/objects.js'
import { PORTRAIT } from './data/portrait.js'

import { refreshAvatarUI, cycleAvatarField, setupAvatarLoops, updateHudConfidence, checkHeartbeat } from './controllers/avatarController.js'
import { startTimer } from './controllers/timerController.js'
import { simulateJoin } from './controllers/gameController.js'
import { openCameraModal, closeModal } from './ui/modal.js'

/* ============================================================
   ACTIONS — toutes les actions custom déclenchées par les boutons
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

  createGame() {
    const gameName = (document.getElementById('game-name-input')?.value || '').trim() || 'Sans nom'
    const myName   = (document.getElementById('creator-name-input')?.value || '').trim()
    if (!myName) return toast('Entre ton pseudo')
    state.gameName = gameName
    state.myName   = myName
    state.gameCode = generateCode()
    navigate('avatar')
  },

  joinGame() {
    const code   = (document.getElementById('join-code-input')?.value || '').trim().toUpperCase()
    const myName = (document.getElementById('joiner-name-input')?.value || '').trim()
    if (code.length < 4) return toast('Code à 4 caractères')
    if (!myName) return toast('Entre ton pseudo')
    state.gameCode = code
    state.myName   = myName
    navigate('avatar')
  },

  randomizeAvatar() {
    state.myAvatar = randomAvatar()
    refreshAvatarUI({ mood: 'jump', sparkles: true, duration: 600 })
  },

  confirmAvatar() {
    const nameInput = document.getElementById('avatar-name-input')
    if (nameInput) {
      const newName = nameInput.value.trim()
      if (newName) state.myName = newName
    }

    const me = {
      id:     'me',
      name:   state.myName || 'Moi',
      avatar: { ...state.myAvatar },
      score:  0,
      isMJ:   state.isMJ,
      isYou:  true,
    }
    state.players = [me]

    if (state.isMJ) {
      setTimeout(() => simulateJoin('Marion'), 800)
      setTimeout(() => simulateJoin('Karim'),  2000)
      setTimeout(() => simulateJoin('Léa'),    3400)
    } else {
      state.players.unshift({
        id:     'mj',
        name:   'MJ',
        avatar: randomAvatar(),
        score:  0,
        isMJ:   true,
      })
      setTimeout(() => simulateJoin('Marion'), 1000)
      setTimeout(() => simulateJoin('Karim'),  2400)
    }

    navigate('lobby')
  },

  startGame() {
    if (state.selectedObjects.length < 6) return toast('Min. 6 objets')
    state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
    startTimer()
    navigate('game')
  },

  cancelPhoto() {
    closeModal()
    state.currentPickingObj = null
  },

  newGame() {
    resetGame()
    state.myAvatar = { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 }
    state.myName   = ''
    navigate('home')
  },
}

/* ============================================================
   DÉLÉGATION D'ÉVÉNEMENTS GLOBALE
   ============================================================ */
function setupEventDelegation() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest(
      '[data-action],[data-nav],[data-cycle],[data-toggle-obj],[data-cell],[data-validate]'
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

    // 3. Cycle de catégorie d'avatar (← / →)
    const cycleExpr = target.dataset.cycle
    if (cycleExpr) {
      const [field, dirStr] = cycleExpr.split(':')
      cycleAvatarField(field, parseInt(dirStr, 10))
      return
    }

    // 4. Toggle objet (écran setup MJ) — flash du counter + scroll to top
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
      // Le re-render recrée un .screen neuf → déjà scrollé en haut.
      // On ajoute juste le flash sur le counter.
      requestAnimationFrame(() => {
        const counter = document.getElementById('obj-counter')
        if (!counter) return
        counter.classList.remove('flash')
        void counter.offsetWidth              // force reflow pour relancer l'anim
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
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setupInputFilters()
  setupEventDelegation()
  initRouter()

  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      setupAvatarLoops()
      if (state.currentScreen === 'game') {
        updateHudConfidence()
        checkHeartbeat()
      }
    }, 50)
  })

  setTimeout(setupAvatarLoops, 100)

  console.log('🍻 Bingo Santé Varsovie ready', {
    skins:       PORTRAIT.skins.length,
    eyes:        PORTRAIT.eyes.length,
    hairStyles:  PORTRAIT.hairStyles.length,
    accessories: PORTRAIT.accessories.length,
    objects:     getObjects().length,
  })
})
