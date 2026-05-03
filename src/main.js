/**
 * BINGO SANTÉ — Varsovie Édition
 * Entry point : styles + router + délégation d'événements
 */

import './styles/main.css'
import './styles/ui.css'

import { state, generateCode, randomAvatar, resetGame } from './state.js'
import { initRouter, navigate, show } from './router.js'
import { toast } from './ui/toast.js'
import { PORTRAIT } from './data/portrait.js'
import { getObjects, getObject } from './data/objects.js'
import { avatarLayersHtml, triggerMood, startBlinkLoop, setConfidence, calcConfidence } from './ui/avatar.js'
import { validatePhotoAI } from './ui/ai-validator.js'

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
    toast('Le MJ choisit les objets, vous les trouvez en photo. L\'IA valide. Premier à compléter sa grille gagne !', 4000)
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

  /**
   * Randomise l'avatar entier
   */
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
      id: 'me',
      name: state.myName || 'Moi',
      avatar: { ...state.myAvatar },
      score: 0,
      isMJ: state.isMJ,
      isYou: true,
    }
    state.players = [me]

    if (state.isMJ) {
      setTimeout(() => simulateJoin('Marion'), 800)
      setTimeout(() => simulateJoin('Karim'), 2000)
      setTimeout(() => simulateJoin('Léa'), 3400)
    } else {
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

  async submitPhoto() {
    if (state.currentPickingObj === null) return
    const cellIdx = state.currentPickingObj
    const cell = state.myGrid[cellIdx]
    cell.status = 'pending'
    closeModal()
    state.currentPickingObj = null
    show('game')

    // Avatar transpire pendant que IA réfléchit + bulle robot
    triggerHudAvatar('sweat', { duration: 2500, emote: '🤖' })
    toast('🤖 IA analyse la photo...')

    const obj = getObject(cell.objId)
    const result = await validatePhotoAI({
      objectId: cell.objId,
      objectName: obj.name,
    })

    handleValidationResult(cellIdx, result)
  },

  newGame() {
    resetGame()
    state.myAvatar = { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 }
    state.myName = ''
    navigate('home')
  },
}

/* ============================================================
   AVATAR UI — refresh + animations
   ============================================================ */

/**
 * Update CHIRURGICAL de l'avatar et des compteurs sans re-render l'écran.
 * Évite le flash blanc à chaque clic sur les flèches.
 */
function refreshAvatarUI({ mood = 'hop', sparkles = true, duration = 500 } = {}) {
  if (state.currentScreen !== 'avatar') return

  // 1. Update les couches de l'avatar (skin/eyes/hair/acc) sans toucher au mood/sparkles
  const previewEl = document.getElementById('avatar-preview')
  if (previewEl) {
    const inner = previewEl.querySelector('.avatar-inner')
    if (inner) {
      // On garde le mood actuel pour la bouche
      const currentMoodClass = [...previewEl.classList].find(c => c.startsWith('mood-')) || 'mood-idle'
      const currentMood = currentMoodClass.replace('mood-', '')
      inner.innerHTML = avatarLayersHtml(state.myAvatar, currentMood)
    }
    // Trigger le mood passager (qui va aussi mettre à jour la bouche)
    triggerMood(previewEl, mood, { duration })
  }

  // 2. Update les compteurs des catégories (X / Y) et value labels
  updateCategoryCounters()
}

/**
 * Met à jour les compteurs et labels des catégories (sans re-render).
 */
function updateCategoryCounters() {
  const fields = [
    { id: 'skin', total: PORTRAIT.skins.length },
    { id: 'hairStyle', total: PORTRAIT.hairStyles.length },
    { id: 'hairColor', total: PORTRAIT.hairStyles[state.myAvatar.hairStyle].colors.length },
    { id: 'eyes', total: PORTRAIT.eyes.length },
    { id: 'acc', total: PORTRAIT.accessories.length },
  ]

  fields.forEach(f => {
    const counter = document.querySelector(`[data-counter="${f.id}"]`)
    if (counter) counter.textContent = `${state.myAvatar[f.id] + 1}/${f.total}`
  })

  // Update du nom de l'accessoire (label dynamique)
  const accLabel = document.querySelector('[data-acc-label]')
  if (accLabel) {
    const acc = PORTRAIT.accessories[state.myAvatar.acc]
    accLabel.textContent = acc ? acc.name : ''
  }
}

let blinkCleanup = null
let hudBlinkCleanup = null
function setupAvatarLoops() {
  if (blinkCleanup) blinkCleanup()
  if (hudBlinkCleanup) hudBlinkCleanup()
  const previewEl = document.getElementById('avatar-preview')
  if (previewEl) blinkCleanup = startBlinkLoop(previewEl)
  const hudEl = document.querySelector('.hud-avatar .avatar')
  if (hudEl) hudBlinkCleanup = startBlinkLoop(hudEl)
}

/**
 * Trigger un mood sur l'avatar dans le HUD pendant le jeu.
 * @param {String} mood
 * @param {Object|Number} opts - duration directement, ou objet { duration, emote, persist }
 */
function triggerHudAvatar(mood, opts = {}) {
  const el = document.querySelector('.hud-avatar .avatar')
  if (!el) return
  // Si on passe juste un nombre, c'est la duration (compat ancien code)
  if (typeof opts === 'number') opts = { duration: opts }
  triggerMood(el, mood, opts)
}

/**
 * Met à jour le niveau de confidence de l'avatar HUD selon la progression actuelle.
 * timid (<20%) → neutral → confident (≥60%) → proud (≥85%)
 */
function updateHudConfidence() {
  const el = document.querySelector('.hud-avatar .avatar')
  if (!el) return
  const validated = state.myGrid.filter(c => c.status === 'validated').length
  const total = state.myGrid.length
  const conf = calcConfidence(validated, total)
  setConfidence(el, conf)
}

/**
 * Vérifie si on est à 1 case du bingo → passe l'avatar en heartbeat permanent
 */
function checkHeartbeat() {
  const el = document.querySelector('.hud-avatar .avatar')
  if (!el) return
  const validated = state.myGrid.filter(c => c.status === 'validated').length
  const total = state.myGrid.length
  // Heartbeat quand il manque 1 ou 2 cases pour le bingo
  if (total > 0 && validated >= total - 2 && validated < total) {
    triggerMood(el, 'heartbeat', { persist: true, emote: '♥' })
  }
}

/* ============================================================
   VALIDATION RESULT HANDLER
   ============================================================ */
function handleValidationResult(cellIdx, result) {
  const cell = state.myGrid[cellIdx]
  const obj = getObject(cell.objId)

  if (result.valid) {
    cell.status = 'validated'
    const me = state.players.find(p => p.isYou)
    if (me) me.score = (me.score || 0) + (obj.points || 1)
    toast(`✓ ${result.reason || 'Validé'} +${obj.points} pts`)
    triggerHudAvatar('jump', { duration: 800, emote: '★' })
  } else {
    cell.status = 'rejected'
    toast(`✗ ${result.reason || 'Refusé'}`)
    triggerHudAvatar('sad', { duration: 1500, emote: '?' })
  }

  if (state.currentScreen === 'game') show('game')
  // Update la confidence + check heartbeat APRES re-render
  setTimeout(() => {
    updateHudConfidence()
    checkHeartbeat()
  }, 100)
  checkBingo()
}

/* ============================================================
   SIMULATION
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

function checkBingo() {
  const validated = state.myGrid.filter(c => c.status === 'validated').length
  if (validated === state.myGrid.length && state.myGrid.length > 0) {
    const me = state.players.find(p => p.isYou)
    if (me) me.hasBingo = true
    triggerHudAvatar('dance', { duration: 2500, emote: '★' })
    setTimeout(() => {
      toast('★ BINGO COMPLET ! ★')
      navigate('end')
    }, 2200)
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
      <div class="modal-box">
        <div style="padding: 16px;">
          <h3 class="modal-title">📷 ${obj.name}</h3>
          <div class="camera-frame"><span>VISÉ → CAPTURÉ</span></div>
          <p class="small center mb">L'IA va vérifier que la photo correspond.</p>
          <div class="row">
            <button class="btn btn-cream btn-sm" data-action="cancelPhoto">Annuler</button>
            <button class="btn btn-red btn-sm" data-action="submitPhoto">Envoyer</button>
          </div>
        </div>
      </div>
    </div>
    <style>
      .modal {
        position: fixed; inset: 0;
        background: rgba(42, 34, 40, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 20px;
      }
      .modal-box {
        max-width: 360px;
        width: 100%;
        background: var(--cream-cold);
        border: 4px solid var(--ink);
        border-radius: 14px;
        box-shadow: 0 8px 0 var(--tram-red-dark);
      }
      .modal-title {
        font-family: 'Press Start 2P', monospace;
        font-size: 12px;
        color: var(--tram-red);
        margin-bottom: 14px;
        text-align: center;
        text-shadow: 1px 1px 0 var(--cream-warm);
      }
      .camera-frame {
        width: 100%;
        aspect-ratio: 1;
        background: linear-gradient(135deg, var(--concrete-mid), var(--concrete-dark));
        border: 3px solid var(--ink);
        border-radius: 8px;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--tram-yellow);
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        position: relative;
      }
      .camera-frame::before {
        content: '';
        position: absolute;
        inset: 8px;
        border: 2px dashed var(--tram-yellow);
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
    const target = e.target.closest(`
      [data-action], [data-nav], [data-cycle],
      [data-toggle-obj], [data-cell], [data-validate]
    `.replace(/\s+/g, ''))
    if (!target) return
    if (target.disabled) return

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
      const dir = parseInt(dirStr, 10)
      cycleAvatarField(field, dir)
      return
    }

    // 4. Toggle objet
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

    // 5. Cellule de bingo
    const cellAttr = target.dataset.cell
    if (cellAttr !== undefined) {
      const idx = parseInt(cellAttr, 10)
      const cell = state.myGrid[idx]
      if (cell.status === 'validated') return toast('Déjà validé !')
      if (cell.status === 'pending') return toast('IA en cours...')
      if (cell.status === 'rejected') return toast('Refusé. Essaie autre chose.')
      openCameraModal(idx)
      return
    }
  })
}

/**
 * Cycle un champ d'avatar (skin/hairStyle/hairColor/eyes/acc)
 */
function cycleAvatarField(field, dir) {
  let total
  if (field === 'skin') total = PORTRAIT.skins.length
  else if (field === 'eyes') total = PORTRAIT.eyes.length
  else if (field === 'hairStyle') total = PORTRAIT.hairStyles.length
  else if (field === 'hairColor') total = PORTRAIT.hairStyles[state.myAvatar.hairStyle].colors.length
  else if (field === 'acc') total = PORTRAIT.accessories.length
  else return

  let cur = state.myAvatar[field] || 0
  cur = (cur + dir + total) % total
  state.myAvatar[field] = cur

  // Si on change de hairStyle, vérifier que hairColor est dans la range
  if (field === 'hairStyle') {
    const newColors = PORTRAIT.hairStyles[cur].colors.length
    if (state.myAvatar.hairColor >= newColors) state.myAvatar.hairColor = 0
  }

  refreshAvatarUI({ mood: 'hop', sparkles: true, duration: 500 })
}

/* ============================================================
   DEBUG NAV
   ============================================================ */
function setupDebugNav() {
  const toggle = document.createElement('button')
  toggle.id = 'debug-toggle'
  toggle.textContent = '⚙'
  toggle.title = 'Debug nav'
  document.body.appendChild(toggle)

  const bar = document.createElement('div')
  bar.id = 'debug-bar'
  const screens = ['home', 'create', 'join', 'avatar', 'lobby', 'setup', 'game', 'end']
  bar.innerHTML = screens.map(s => `<button data-nav="${s}" data-screen="${s}">${s}</button>`).join('')
  document.body.appendChild(bar)

  toggle.addEventListener('click', () => bar.classList.toggle('show'))
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
  setupDebugNav()
  setupInputFilters()
  setupEventDelegation()
  initRouter()

  // Sur chaque show de screen, redémarrer les boucles d'animation
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      setupAvatarLoops()
      // Si on est sur game, init la confidence + check heartbeat
      if (state.currentScreen === 'game') {
        updateHudConfidence()
        checkHeartbeat()
      }
    }, 50)
  })
  setTimeout(setupAvatarLoops, 100)

  console.log('🍻 Bingo Santé Varsovie ready', {
    skins: PORTRAIT.skins.length,
    eyes: PORTRAIT.eyes.length,
    hairStyles: PORTRAIT.hairStyles.length,
    accessories: PORTRAIT.accessories.length,
    objects: getObjects().length,
  })
})
