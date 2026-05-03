/**
 * BINGO CITY — Entry point
 *
 * Charge les styles, init le router et configure la délégation d'événements globale.
 * Toute action utilisateur passe par data-action / data-nav / data-set / data-toggle-obj / data-cell / data-validate
 */

import './styles/main.css'
import './styles/ui.css'

import { state, generateCode, randomAvatar, resetGame } from './state.js'
import { initRouter, navigate, show } from './router.js'
import { toast } from './ui/toast.js'
import { PORTRAIT } from './data/portrait.js'
import { getObjects, getObject } from './data/objects.js'
import { renderTab } from './screens/avatar.js'

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
    toast('Bingo de groupe : le MJ choisit les objets, vous les trouvez en photo. Le premier à compléter sa grille gagne !', 4000)
  },

  createGame() {
    const gameName = (document.getElementById('game-name-input')?.value || '').trim() || 'Sans nom'
    const myName = (document.getElementById('creator-name-input')?.value || '').trim()
    if (!myName) return toast('Entre ton pseudo')
    state.gameName = gameName
    state.myName = myName
    state.gameCode = generateCode()
    navigate('avatar')
  },

  joinGame() {
    const code = (document.getElementById('join-code-input')?.value || '').trim().toUpperCase()
    const myName = (document.getElementById('joiner-name-input')?.value || '').trim()
    if (code.length < 4) return toast('Code à 4 caractères')
    if (!myName) return toast('Entre ton pseudo')
    state.gameCode = code
    state.myName = myName
    navigate('avatar')
  },

  confirmAvatar() {
    // Récupère le nom modifié dans le champ
    const nameInput = document.getElementById('avatar-name-input')
    if (nameInput) {
      const newName = nameInput.value.trim()
      if (newName) state.myName = newName
    }

    // Construit la liste de joueurs avec moi
    const me = {
      id: 'me',
      name: state.myName || 'Moi',
      avatar: { ...state.myAvatar },
      score: 0,
      isMJ: state.isMJ,
      isYou: true,
    }
    state.players = [me]

    // Simulation : autres joueurs rejoignent progressivement
    if (state.isMJ) {
      setTimeout(() => simulateJoin('Marion'), 800)
      setTimeout(() => simulateJoin('Karim'), 2000)
      setTimeout(() => simulateJoin('Léa'), 3400)
    } else {
      // Si je rejoins, le MJ est déjà là
      state.players.unshift({
        id: 'mj',
        name: 'Tristan',
        avatar: randomAvatar(),
        score: 0,
        isMJ: true,
      })
      setTimeout(() => simulateJoin('Marion'), 1000)
      setTimeout(() => simulateJoin('Karim'), 2400)
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

  submitPhoto() {
    if (state.currentPickingObj === null) return
    const cell = state.myGrid[state.currentPickingObj]
    cell.status = 'pending'
    state.pendingValidations.push({
      playerId: 'me',
      playerName: state.myName,
      objId: cell.objId,
      cellIdx: state.currentPickingObj,
      timestamp: Date.now(),
    })
    closeModal()
    const cellIdx = state.currentPickingObj
    state.currentPickingObj = null
    show('game') // re-render
    toast('Photo envoyée au MJ !')

    // Si je ne suis pas MJ, simule la validation auto après 2.5s
    if (!state.isMJ) {
      setTimeout(() => simulateMJValidation(cellIdx), 2500)
    }
  },

  newGame() {
    resetGame()
    state.myAvatar = { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 }
    state.myName = ''
    navigate('home')
  },
}

/* ============================================================
   SIMULATION — les "autres joueurs" du proto
   ============================================================ */
function simulateJoin(name) {
  if (state.currentScreen !== 'lobby') return
  const newP = {
    id: 'p' + Date.now(),
    name,
    avatar: randomAvatar(),
    score: 0,
    isMJ: false,
    justJoined: true,
  }
  state.players.push(newP)
  show('lobby')
  setTimeout(() => { newP.justJoined = false }, 600)
}

function simulateMJValidation(cellIdx) {
  if (state.myGrid[cellIdx]?.status !== 'pending') return
  const accept = Math.random() > 0.15
  if (accept) {
    state.myGrid[cellIdx].status = 'validated'
    const obj = getObject(state.myGrid[cellIdx].objId)
    toast(`✓ Validé ! +${obj.points} pts`)
  } else {
    state.myGrid[cellIdx].status = 'rejected'
    toast('✗ MJ a refusé')
  }
  state.pendingValidations = state.pendingValidations.filter(v => v.cellIdx !== cellIdx)
  if (state.currentScreen === 'game') show('game')
  checkBingo()
}

function checkBingo() {
  const validated = state.myGrid.filter(c => c.status === 'validated').length
  if (validated === state.myGrid.length && state.myGrid.length > 0) {
    const me = state.players.find(p => p.isYou)
    if (me) me.hasBingo = true
    setTimeout(() => {
      toast('★ BINGO COMPLET ! ★')
      navigate('end')
    }, 800)
  }
}

/* ============================================================
   TIMER
   ============================================================ */
function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval)
  state.timer = 1800
  updateTimer()
  state.timerInterval = setInterval(() => {
    state.timer--
    updateTimer()
    if (state.timer <= 0) {
      clearInterval(state.timerInterval)
      navigate('end')
    }
  }, 1000)
}

function updateTimer() {
  const m = Math.floor(state.timer / 60)
  const s = state.timer % 60
  const el = document.getElementById('game-timer')
  if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ============================================================
   CAMERA MODAL
   ============================================================ */
function openCameraModal(cellIdx) {
  state.currentPickingObj = cellIdx
  const cell = state.myGrid[cellIdx]
  const obj = getObject(cell.objId)
  const root = document.getElementById('modal-root')
  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box frame frame-wood">
        <div class="content" style="padding: 16px;">
          <h3 class="modal-title">📷 ${obj.name}</h3>
          <div class="camera-frame"><span>VISÉ → CAPTURÉ</span></div>
          <p class="small center mb">La photo part chez le MJ pour validation.</p>
          <div class="row">
            <button class="btn btn-ghost btn-sm" data-action="cancelPhoto">Annuler</button>
            <button class="btn btn-orange btn-sm" data-action="submitPhoto">Envoyer</button>
          </div>
        </div>
      </div>
    </div>
    <style>
      .modal {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 20px;
      }
      .modal-box { max-width: 360px; width: 100%; }
      .modal-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 12px;
        color: var(--ink);
        margin-bottom: 14px;
        text-align: center;
      }
      .camera-frame {
        width: 100%;
        aspect-ratio: 1;
        background: linear-gradient(135deg, var(--bg-mid), var(--bg-deep));
        border: 3px solid var(--ink);
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--yellow);
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        position: relative;
      }
      .camera-frame::before {
        content: '';
        position: absolute;
        inset: 8px;
        border: 2px dashed var(--yellow);
        animation: scanline 2s linear infinite;
      }
      @keyframes scanline {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    </style>
  `
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = ''
}

/* ============================================================
   DELEGATION D'ÉVÉNEMENTS GLOBALE
   ============================================================ */
function setupEventDelegation() {
  document.addEventListener('click', (e) => {
    // Trouve l'élément avec un data-* qui nous intéresse
    const target = e.target.closest(`
      [data-action], [data-nav], [data-set],
      [data-toggle-obj], [data-cell], [data-validate],
      [data-tab]
    `.replace(/\s+/g, ''))
    if (!target) return

    // Si bouton désactivé, ignore
    if (target.disabled) return

    // 1. Action custom
    const action = target.dataset.action
    if (action && ACTIONS[action]) {
      e.preventDefault()
      ACTIONS[action]()
      return
    }

    // 2. Navigation directe
    const nav = target.dataset.nav
    if (nav) {
      e.preventDefault()
      navigate(nav)
      return
    }

    // 3. Setter d'avatar (sur l'écran avatar)
    const setExpr = target.dataset.set
    if (setExpr) {
      const [field, valStr] = setExpr.split(':')
      const val = parseInt(valStr, 10)
      state.myAvatar[field] = val

      // Re-render uniquement la zone d'options + l'avatar preview
      const optsEl = document.getElementById('char-options')
      const previewEl = document.getElementById('avatar-preview')
      if (optsEl) {
        // Trouver l'onglet actif
        const activeTab = document.querySelector('.char-tab.active')
        const tabName = activeTab ? activeTab.dataset.tab : 'hair'
        optsEl.innerHTML = renderTab(tabName)
      }
      if (previewEl) {
        // Re-render la preview
        import('./ui/avatar.js').then(mod => {
          previewEl.innerHTML = mod.avatarLayersHtml(state.myAvatar)
        })
      }
      return
    }

    // 4. Onglets de l'écran avatar
    const tab = target.dataset.tab
    if (tab) {
      document.querySelectorAll('.char-tab').forEach(t => t.classList.toggle('active', t === target))
      const optsEl = document.getElementById('char-options')
      if (optsEl) optsEl.innerHTML = renderTab(tab)
      return
    }

    // 5. Toggle objet (setup MJ)
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
      return
    }

    // 6. Cellule de bingo cliquée
    const cellAttr = target.dataset.cell
    if (cellAttr !== undefined) {
      const idx = parseInt(cellAttr, 10)
      const cell = state.myGrid[idx]
      if (cell.status === 'validated') return toast('Déjà validé !')
      if (cell.status === 'pending') return toast('En attente du MJ...')
      if (cell.status === 'rejected') return toast('Refusé. Essaie autre chose.')
      openCameraModal(idx)
      return
    }

    // 7. Validation MJ
    const v = target.dataset.validate
    if (v) {
      const [idx, accept] = v.split(':').map(x => parseInt(x, 10))
      validatePhotoAction(idx, accept === 1)
      return
    }
  })
}

function validatePhotoAction(idx, accept) {
  const v = state.pendingValidations[idx]
  if (!v) return
  if (v.playerId === 'me' && v.cellIdx >= 0) {
    if (accept) {
      state.myGrid[v.cellIdx].status = 'validated'
      const obj = getObject(v.objId)
      toast(`✓ +${obj.points} pts`)
    } else {
      state.myGrid[v.cellIdx].status = 'rejected'
      toast('✗ Refusé')
    }
  } else {
    const player = state.players.find(p => p.id === v.playerId)
    if (player && accept) {
      const obj = getObject(v.objId)
      player.score = (player.score || 0) + (obj.points || 1)
      toast(`✓ ${player.name}: +${obj.points} pts`)
    } else if (player) {
      toast(`✗ Refusé pour ${player.name}`)
    }
  }
  state.pendingValidations.splice(idx, 1)
  show('validate')
  checkBingo()
}

/* ============================================================
   DEBUG NAV
   ============================================================ */
function setupDebugNav() {
  // Toggle button
  const toggle = document.createElement('button')
  toggle.id = 'debug-toggle'
  toggle.textContent = '⚙'
  toggle.title = 'Debug nav'
  document.body.appendChild(toggle)

  // Bar
  const bar = document.createElement('div')
  bar.id = 'debug-bar'
  const screens = ['home', 'create', 'join', 'avatar', 'lobby', 'setup', 'game', 'validate', 'end']
  bar.innerHTML = screens.map(s => `<button data-nav="${s}" data-screen="${s}">${s}</button>`).join('')
  document.body.appendChild(bar)

  toggle.addEventListener('click', () => bar.classList.toggle('show'))
}

/* ============================================================
   STARS BACKGROUND
   ============================================================ */
function setupStars() {
  // Crée des étoiles dans #app
  const app = document.getElementById('app')
  if (!app) return
  // Les étoiles sont injectées dans chaque screen via .stars-bg
  // Mais on en met aussi un global au cas où
}

/* ============================================================
   INPUT FILTERS
   ============================================================ */
function setupInputFilters() {
  // Auto-uppercase pour les codes
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
  setupDebugNav()
  setupStars()
  setupInputFilters()
  setupEventDelegation()
  initRouter()

  console.log('🎯 BINGO CITY ready', {
    skins: PORTRAIT.skins.length,
    eyes: PORTRAIT.eyes.length,
    hairStyles: PORTRAIT.hairStyles.length,
    accessories: PORTRAIT.accessories.length,
    objects: getObjects().length,
  })
})
