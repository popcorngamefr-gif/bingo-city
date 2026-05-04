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

// Bridge état global pour avatar.js (accès aux animations sans circular import)
window.__state = state

import { initAuth, saveProfile }          from './firebase/auth.js'
import { createGame as fbCreateGame, joinGame as fbJoinGame, startGame as fbStartGame, subscribeToPlayers, subscribeToGame, unsubscribeAll } from './firebase/game.js'
import { checkPseudoAvailable, createAccount, loginWithPin, updateAccountUID } from './firebase/account.js'
import { openGeneratorModal }   from './ui/avatar-generator.js'
import { openShooterPaywall } from './ui/shooter-paywall.js'
import { openMoodPicker }     from './ui/mood-picker.js'
import { openCustomObjPicker as openCustomObjPickerUI } from './ui/custom-obj-picker.js'
import { generateAnimations }               from './ui/animations-generator.js'

/* ============================================================
   LOBBY — temps réel
   ============================================================ */
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
    if (newIds.length) setTimeout(() => {
      state.players = state.players.map(p => ({ ...p, justJoined: false }))
    }, 600)
  }
}

function _onGameUpdate(gameData) {
  if (gameData.status === 'playing' && state.currentScreen === 'lobby' && !state.isMJ) {
    state.selectedObjects = gameData.selectedObjects || []
    state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
    startTimer()
    navigate('game')
  }
  if (gameData.status === 'ended' && state.currentScreen === 'game') navigate('end')
}

function _setupLobbySubscriptions() {
  _seenPlayerIds.clear()
  if (!state.gameCode) return
  subscribeToPlayers(state.gameCode, _onPlayersUpdate)
  subscribeToGame(state.gameCode, _onGameUpdate)
}

/* ============================================================
   ACCOUNT — PIN logic (tab switch + PIN keyboard)
   ============================================================ */
function _collectPin(prefix) {
  return [...document.querySelectorAll(`[data-pin="${prefix}"]`)]
    .map(el => el.value).join('')
}

function _setupAccountScreen() {
  // Tab switch
  document.querySelectorAll('.account-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.account-tab').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const tab = btn.dataset.tab
      document.querySelectorAll('.account-panel').forEach(p => p.classList.add('hidden'))
      document.getElementById(`panel-${tab}`)?.classList.remove('hidden')
    })
  })

  // PIN digit nav : saute auto au suivant
  document.addEventListener('input', (e) => {
    if (!e.target.classList.contains('pin-digit')) return
    e.target.value = e.target.value.replace(/\D/g, '').slice(-1)
    if (e.target.value) {
      const idx  = parseInt(e.target.dataset.idx)
      const next = document.querySelector(`[data-pin="${e.target.dataset.pin}"][data-idx="${idx + 1}"]`)
      next?.focus()
    }
  })

  // Pseudo dispo (debounced)
  let _pseudoTimer = null
  document.getElementById('acc-pseudo-create')?.addEventListener('input', (e) => {
    clearTimeout(_pseudoTimer)
    const el = document.getElementById('pseudo-status')
    if (!el) return
    const val = e.target.value.trim()
    if (val.length < 3) { el.textContent = ''; el.className = 'pseudo-status'; return }
    el.textContent = '…'; el.className = 'pseudo-status'
    _pseudoTimer = setTimeout(async () => {
      const ok = await checkPseudoAvailable(val).catch(() => true)
      el.textContent = ok ? '✓ Disponible' : '✗ Déjà pris'
      el.className   = ok ? 'pseudo-status ok' : 'pseudo-status err'
    }, 500)
  })

  // Créer
  document.getElementById('btn-create-account')?.addEventListener('click', async () => {
    const pseudo = document.getElementById('acc-pseudo-create')?.value.trim()
    const pin    = _collectPin('pin-create')
    const pinC   = _collectPin('pin-confirm')
    if (!pseudo || pseudo.length < 3) return toast('Pseudo trop court (3 min)')
    if (pin.length < 4)              return toast('PIN incomplet')
    if (pin !== pinC)                return toast('Les PIN ne correspondent pas')

    try {
      const key = await createAccount({
        pseudo, pin,
        uid:    state.uid,
        name:   state.myName || pseudo,
        avatar: state.myAvatar,
      })
      state.accountKey = key
      toast('Compte créé !')
      navigate('home')
    } catch (err) {
      toast(err.message || 'Erreur lors de la création')
    }
  })

  // Connexion
  document.getElementById('btn-login-account')?.addEventListener('click', async () => {
    const pseudo = document.getElementById('acc-pseudo-login')?.value.trim()
    const pin    = _collectPin('pin-login')
    if (!pseudo) return toast('Entre ton pseudo')
    if (pin.length < 4) return toast('PIN incomplet')

    try {
      const data = await loginWithPin({ pseudo, pin })
      // Mettre à jour l'UID dans le compte
      await updateAccountUID(data.key, state.uid)
      // Hydrate le state
      state.accountKey  = data.key
      state.myName      = data.name
      state.myAvatar    = { ...state.myAvatar, ...(data.avatar || {}) }
      state.userProfile = { ...state.userProfile, ...data }
      // Sync avec /users/{uid}
      await saveProfile({ name: data.name, avatar: data.avatar }).catch(() => {})
      toast(`Bienvenue, ${data.name} !`)
      navigate('home')
    } catch (err) {
      toast(err.message || 'Erreur de connexion')
    }
  })
}

/* ============================================================
   ACTIONS
   ============================================================ */
const ACTIONS = {

  goCreate() { state.isMJ = true;  navigate('create') },
  goJoin()   { state.isMJ = false; navigate('join')   },

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
    navigate('avatar-pick')
  },

  async joinGame() {
    const code   = (document.getElementById('join-code-input')?.value || '').trim().toUpperCase()
    const myName = (document.getElementById('joiner-name-input')?.value || '').trim()
    if (code.length < 4) return toast('Code à 4 caractères')
    if (!myName)          return toast('Entre ton pseudo')
    try {
      await fbJoinGame({ code, uid: state.uid, name: myName, avatar: state.myAvatar })
      state.gameCode = code
      state.myName   = myName
      navigate('avatar-pick')
    } catch (err) { toast(err.message || 'Impossible de rejoindre') }
  },

  randomizeAvatar() {
    state.myAvatar = randomAvatar()
    refreshAvatarUI({ mood: 'jump', sparkles: true, duration: 600 })
  },

  async confirmAvatar() {
    const nameInput = document.getElementById('avatar-name-input')
    if (nameInput) { const v = nameInput.value.trim(); if (v) state.myName = v }

    try { await saveProfile({ name: state.myName || 'Anonyme', avatar: state.myAvatar }) }
    catch (err) { console.warn('saveProfile failed:', err) }

    const me = { id: state.uid || 'me', name: state.myName || 'Moi', avatar: { ...state.myAvatar }, score: 0, isMJ: state.isMJ, isYou: true }
    if (state.isMJ) {
      state.players = [me]
      try {
        await fbCreateGame({ code: state.gameCode, name: state.gameName, hostUid: state.uid, hostName: state.myName, hostAvatar: state.myAvatar })
      } catch (err) {
        console.warn('createGame failed:', err)
        // Pas de simulateJoin en prod — laisse l'utilisateur seul s'il n'y a pas de Firebase
      }
    } else {
      state.players = [me]
      // Met à jour le doc Firestore avec l'avatar définitif (best-effort)
      if (state.gameCode && state.uid && state.uid !== 'me') {
        import('./firebase/game.js').then(({ updatePlayerProfile }) => {
          updatePlayerProfile?.(state.gameCode, state.uid, {
            name: state.myName,
            avatar: state.myAvatar,
          }).catch(err => console.warn('updatePlayerProfile failed:', err))
        }).catch(err => console.warn('firebase/game import failed:', err))
      }
    }
    navigate('lobby')

  },

  startGame() {
    if (state.selectedObjects.length < 6) return toast('Min. 6 objets')
    state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
    if (state.gameCode) fbStartGame(state.gameCode, state.selectedObjects).catch(console.error)
    startTimer()
    navigate('game')
  },

  cancelPhoto() { closeModal(); state.currentPickingObj = null },

  newGame() { unsubscribeAll(); _seenPlayerIds.clear(); resetGame(); navigate('home') },

  resetGeneratedAvatar() {
    delete state.myAvatar.generatedImageUrl
    navigate('avatar-pick')
  },

  retryGeneration() {
    delete state.myAvatar.generatedImageUrl
    openGeneratorModal()
  },

  openAvatarGenerator() {
    openGeneratorModal()
  },

  openExpressionsPaywall() {
    openShooterPaywall(
      'expressions',
      'Déglingo IA',
      `Donne vie à ton avatar avec une animation vidéo personnalisée.`,
      () => {
        // Après le shooter, on demande le vibe à l'utilisateur
        openMoodPicker(({ moodKey, prompt }) => {
          state.selectedMoodPrompt = prompt
          state.selectedMoodKey    = moodKey
          ACTIONS.openExpressionsGen()
        })
      }
    )
  },

  openExpressionsGen() {
    const imgUrl = state.myAvatar?.generatedImageUrl
    if (!imgUrl) {
      import('./ui/toast.js').then(({ toast }) => toast(`Lance d'abord le scan de ta tête !`))
      return
    }
    if (state.myAnimation?._ready && state.myAnimation?.url) {
      navigate('animations-loading')
      return
    }
    // Reset + navigation immédiate
    state.myAnimation = { url: null, _ready: false }
    navigate('animations-loading')

    // Lance la génération vidéo avec le prompt choisi (ou prompt par défaut)
    const prompt = state.selectedMoodPrompt || null
    generateAnimations(
      imgUrl,
      prompt,
      () => { if (state.currentScreen === 'animations-loading') show('animations-loading') },
      () => { if (state.currentScreen === 'animations-loading') show('animations-loading') }
    ).catch(err => {
      console.error('generateAnimations error:', err)
    })
  },

  validateAnimations() {
    navigate('avatar-pick')
  },

  openCustomObjPicker() {
    openCustomObjPickerUI((obj) => {
      // Ajoute à la liste custom
      if (!state.customObjects) state.customObjects = []
      state.customObjects.push(obj)
      // Auto-sélectionne dans la grille
      if (state.selectedObjects.length < 25) {
        state.selectedObjects.push(obj.id)
      }
      // Re-render setup pour faire apparaître la nouvelle tuile
      show('setup')
      toast(`"${obj.name}" ajouté à ta liste !`)
    })
  },

  logoutAccount() {
    state.accountKey  = null
    state.userProfile = { ...state.userProfile, accountKey: null }
    toast('Compte déconnecté de cet appareil')
    navigate('home')
  },
}

/* ============================================================
   DÉLÉGATION D'ÉVÉNEMENTS
   ============================================================ */
function setupEventDelegation() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action],[data-nav],[data-cycle],[data-toggle-obj],[data-cell]')
    if (!target || target.disabled) return

    const action = target.dataset.action
    if (action && ACTIONS[action]) { e.preventDefault(); ACTIONS[action](); return }

    const nav = target.dataset.nav
    if (nav) { e.preventDefault(); navigate(nav); return }

    const cycleExpr = target.dataset.cycle
    if (cycleExpr) {
      const [field, dirStr] = cycleExpr.split(':')
      cycleAvatarField(field, parseInt(dirStr, 10))
      return
    }

    const objId = target.dataset.toggleObj
    if (objId) {
      const idx = state.selectedObjects.indexOf(objId)
      if (idx >= 0)                               state.selectedObjects.splice(idx, 1)
      else if (state.selectedObjects.length < 25) state.selectedObjects.push(objId)
      else return toast('Max 25 objets')

      // Mise à jour chirurgicale — pas de re-render complet, scroll préservé
      const tile = target
      const isSelected = state.selectedObjects.includes(objId)
      tile.classList.toggle('selected', isSelected)

      // Ajoute / retire le check icon
      const existingCheck = tile.querySelector('.obj-tile-check')
      if (isSelected && !existingCheck) {
        const checkDiv = document.createElement('div')
        checkDiv.className = 'obj-tile-check'
        checkDiv.innerHTML = '<svg width="18" height="18" viewBox="0 0 16 16"><path fill="currentColor" d="M3 8 L7 12 L13 4" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="square"/></svg>'
        tile.appendChild(checkDiv)
      } else if (!isSelected && existingCheck) {
        existingCheck.remove()
      }

      // Mise à jour du compteur
      const n = state.selectedObjects.length
      const counter = document.getElementById('obj-counter')
      if (counter) {
        counter.textContent = `${n} / 25 sélectionnés (min. 6)`
        counter.classList.toggle('warn', n < 6)
        counter.classList.remove('flash')
        void counter.offsetWidth
        counter.classList.add('flash')
      }

      // Activation/désactivation du CTA "Lancer"
      const startBtn = document.querySelector('[data-action="startGame"]')
      if (startBtn) startBtn.disabled = (n < 6 || n > 25)
      return
    }

    const cellAttr = target.dataset.cell
    if (cellAttr !== undefined) {
      const idx  = parseInt(cellAttr)
      const cell = state.myGrid[idx]
      if (!cell) return
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
    if (e.target.id === 'join-code-input')
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  })
}

/* ============================================================
   AVATAR SCREEN — bouton génération IA
   ============================================================ */
function _setupAnimationsLoadingScreen() {
  // Preview player — cycle automatique des 3 GIFs
  const track  = document.getElementById('anim-preview-track')
  if (!track) return

  const frames = [...track.querySelectorAll('.anim-preview-frame')]
  const dots   = [...document.querySelectorAll('.anim-dot')]
  if (!frames.length) return

  let current = 0
  frames[0]?.classList.add('active')

  setInterval(() => {
    frames[current]?.classList.remove('active')
    dots[current]?.classList.remove('active')
    current = (current + 1) % frames.length
    frames[current]?.classList.add('active')
    dots[current]?.classList.add('active')
  }, 2500)
}

/* ============================================================
   SCREEN HOOKS
   ============================================================ */
function setupScreenHooks() {
  window.addEventListener('hashchange', () => {
    const screen = state.currentScreen
    setTimeout(() => {
      setupAvatarLoops()
      if (screen === 'game')    { updateHudConfidence(); checkHeartbeat() }
      if (screen === 'lobby')   _setupLobbySubscriptions()
      if (screen === 'account')            _setupAccountScreen()
      if (screen === 'animations-loading') _setupAnimationsLoadingScreen()
      if (screen === 'home' || screen === 'end') unsubscribeAll()
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

  document.getElementById('app').innerHTML = `
    <section class="screen" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
      <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:var(--ink);text-align:center;line-height:1.8;">BINGO SANTÉ<br>VARSOVIE</div>
      <div style="font-family:'VT323',monospace;font-size:18px;color:var(--ink-soft);">Connexion...</div>
    </section>`

  try { await initAuth() } catch (err) { console.warn('Auth failed, running offline:', err) }

  initRouter()
  setTimeout(setupAvatarLoops, 100)
  // Si on atterrit sur #account au premier chargement
  if (state.currentScreen === 'account') setTimeout(_setupAccountScreen, 60)

  console.log('🍻 Bingo Santé Varsovie ready', {
    uid: state.uid, account: state.accountKey,
    skins: PORTRAIT.skins.length, objects: getObjects().length,
  })
})
