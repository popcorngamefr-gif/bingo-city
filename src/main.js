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
import { createGame as fbCreateGame, joinGame as fbJoinGame, startGame as fbStartGame, subscribeToPlayers, subscribeToGame, subscribeToPhotos, unsubscribeAll } from './firebase/game.js'
import { checkPseudoAvailable, createAccount, loginWithPin, updateAccountUID } from './firebase/account.js'
import { openGeneratorModal }   from './ui/avatar-generator.js'
import { openShooterPaywall } from './ui/shooter-paywall.js'
import { openMoodPicker }     from './ui/mood-picker.js'
import { openCustomObjPicker as openCustomObjPickerUI } from './ui/custom-obj-picker.js'
import { openShareModal as openShareModalUI } from './ui/share-modal.js'
import { generateAnimations }               from './ui/animations-generator.js'


// ─── Persistance partie en cours ─────────────────────────────────────────────
const ACTIVE_GAME_KEY = 'bingo_active_game'

function saveActiveGame() {
  if (!state.gameCode) return
  try {
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify({
      code:     state.gameCode,
      name:     state.gameName,
      isMJ:     state.isMJ,
      myName:   state.myName,
      savedAt:  Date.now(),
    }))
  } catch {}
}

function clearActiveGame() {
  try { localStorage.removeItem(ACTIVE_GAME_KEY) } catch {}
}

export function getActiveGame() {
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Expire après 4 jours (max durée + marge)
    if (Date.now() - data.savedAt > 4 * 24 * 3600 * 1000) {
      clearActiveGame()
      return null
    }
    return data
  } catch {
    return null
  }
}

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
  // Hydrate la durée à tout moment (le MJ peut la modifier en lobby)
  if (typeof gameData.duration === 'number') state.gameDuration = gameData.duration

  if (gameData.status === 'playing' && state.currentScreen === 'lobby' && !state.isMJ) {
    state.selectedObjects = gameData.selectedObjects || []
    state.customObjects   = gameData.customObjects || []
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
  // Tabs : on attache les listeners directement, le HTML vient d'être ré-rendu
  document.querySelectorAll('.account-tab').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.account-tab').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      const tab = btn.dataset.tab
      document.querySelectorAll('.account-panel').forEach(p => p.classList.add('hidden'))
      document.getElementById(`panel-${tab}`)?.classList.remove('hidden')
    }
  })

  // Pseudo dispo (debounced)
  let _pseudoTimer = null
  const pseudoInput = document.getElementById('acc-pseudo-create')
  if (pseudoInput) {
    pseudoInput.oninput = (e) => {
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
    }
  }

  // Créer (utilise onclick pour overwrite à chaque setup, pas d'accumulation)
  const createBtn = document.getElementById('btn-create-account')
  if (createBtn) createBtn.onclick = async () => {
    console.log('[create-account] clicked')
    const pseudo = document.getElementById('acc-pseudo-create')?.value.trim()
    const pin    = _collectPin('pin-create')
    const pinC   = _collectPin('pin-confirm')
    console.log('[create-account] pseudo:', pseudo, 'pin len:', pin.length, 'pinC len:', pinC.length)

    if (!pseudo || pseudo.length < 3) return toast('Pseudo trop court (3 min)')
    if (pin.length < 4)              return toast('PIN incomplet (4 chiffres)')
    if (pin !== pinC)                return toast('Les PIN ne correspondent pas')

    if (!state.uid) {
      console.error('[create-account] state.uid manquant — auth Firebase pas connectée')
      toast('Pas connecté à Firebase — recharge la page')
      return
    }

    try {
      console.log('[create-account] uid:', state.uid, 'avatar:', state.myAvatar)
      const key = await createAccount({
        pseudo, pin,
        uid:    state.uid,
        name:   state.myName || pseudo,
        avatar: state.myAvatar || { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 },
      })
      console.log('[create-account] success, key:', key)
      state.accountKey = key
      toast('Compte créé !')
      navigate('home')
    } catch (err) {
      console.error('[create-account] error:', err)
      const msg = err.code === 'permission-denied'
        ? 'Permissions Firestore manquantes'
        : err.message || 'Erreur lors de la création'
      toast(msg)
    }
  }

  // Connexion
  const loginBtn = document.getElementById('btn-login-account')
  if (loginBtn) loginBtn.onclick = async () => {
    console.log('[login] clicked')
    const pseudo = document.getElementById('acc-pseudo-login')?.value.trim()
    const pin    = _collectPin('pin-login')
    if (!pseudo) return toast('Entre ton pseudo')
    if (pin.length < 4) return toast('PIN incomplet (4 chiffres)')

    if (!state.uid) {
      toast('Pas connecté à Firebase — recharge la page')
      return
    }

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
  }

  // PIN auto-skip : délégation directe sur les inputs PIN du DOM courant
  _wirePinDigits()
}

function _wirePinDigits() {
  document.querySelectorAll('.pin-digit').forEach(input => {
    input.oninput = (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(-1)
      if (e.target.value) {
        const idx  = parseInt(e.target.dataset.idx)
        const next = document.querySelector(`[data-pin="${e.target.dataset.pin}"][data-idx="${idx + 1}"]`)
        next?.focus()
      }
    }
    // Backspace : revenir au précédent si vide
    input.onkeydown = (e) => {
      if (e.key === 'Backspace' && !e.target.value) {
        const idx  = parseInt(e.target.dataset.idx)
        const prev = document.querySelector(`[data-pin="${e.target.dataset.pin}"][data-idx="${idx - 1}"]`)
        prev?.focus()
      }
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
      saveActiveGame()
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

    // Édition pure depuis la home (pas de partie en cours) → retour home
    if (!state.gameCode) {
      // Sync l'avatar dans le compte si connecté
      if (state.accountKey) {
        import('./firebase/account.js').then(({ updateAccountAvatar }) => {
          updateAccountAvatar?.(state.accountKey, state.myAvatar).catch(() => {})
        }).catch(() => {})
      }
      toast('Avatar mis à jour !')
      navigate('home')
      return
    }

    const me = { id: state.uid || 'me', name: state.myName || 'Moi', avatar: { ...state.myAvatar }, score: 0, isMJ: state.isMJ, isYou: true }
    if (state.isMJ) {
      state.players = [me]
      try {
        await fbCreateGame({ code: state.gameCode, name: state.gameName, hostUid: state.uid, hostName: state.myName, hostAvatar: state.myAvatar, duration: state.gameDuration })
        saveActiveGame()
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
    if (state.gameCode) fbStartGame(state.gameCode, state.selectedObjects, state.customObjects || []).catch(console.error)
    startTimer()
    navigate('game')
  },

  cancelPhoto() { closeModal(); state.currentPickingObj = null },

  newGame() { unsubscribeAll(); _seenPlayerIds.clear(); clearActiveGame(); resetGame(); navigate('home') },

  endGameByMJ() {
    if (!state.isMJ) return
    const ok = confirm('Terminer la partie maintenant ? Les joueurs seront envoyés au classement.')
    if (!ok) return
    // Stop le timer local
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null }
    // Termine côté Firestore — les autres joueurs sont notifiés via subscribeToGame
    if (state.gameCode) {
      import('./firebase/game.js').then(({ endGame }) => {
        endGame(state.gameCode).catch(console.error)
      })
    }
    navigate('end')
  },

  editHomeAvatar() {
    // Hors partie : on n'est ni MJ ni joueur, juste en édition
    // On reset la vue avatar-pick pour ne pas afficher la confirmation IA
    state.isMJ = false
    delete state.myAvatar.generatedImageUrl
    state.myAnimation = null
    navigate('avatar-pick')
  },

  resumeActiveGame() {
    const active = getActiveGame()
    if (!active) return
    state.gameCode = active.code
    state.gameName = active.name
    state.isMJ     = active.isMJ
    state.myName   = active.myName || state.myName
    navigate('lobby')
  },

  forgetActiveGame() {
    clearActiveGame()
    show('home')
  },

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

  openShareModal() {
    if (!state.gameCode) return
    openShareModalUI(state.gameCode)
  },

  updateGameDuration() {
    // Cette action est déclenchée via data-action mais on lit l'argument depuis le data-duration-arg
    // L'event delegation appelle ACTIONS[action]() — il faut donc gérer ça spécialement
    // Voir la délégation pour le branchement custom
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
    const target = e.target.closest('[data-action],[data-nav],[data-cycle],[data-toggle-obj],[data-cell],[data-duration],[data-photo-url]')
    if (!target || target.disabled) return

    const action = target.dataset.action
    if (action && ACTIONS[action]) {
      e.preventDefault()
      // Handler spécial : updateGameDuration avec data-duration-arg
      if (action === 'updateGameDuration' && target.dataset.durationArg) {
        const dur = parseInt(target.dataset.durationArg, 10)
        state.gameDuration = dur
        // Toggle visuel chirurgical
        target.parentElement?.querySelectorAll('.duration-tile').forEach(t => t.classList.remove('selected'))
        target.classList.add('selected')
        // Sync Firestore (best-effort)
        if (state.gameCode && state.uid && state.uid !== 'me') {
          import('./firebase/game.js').then(({ updateGameDuration }) => {
            updateGameDuration(state.gameCode, dur).catch(console.error)
          })
        }
        return
      }
      ACTIONS[action]()
      return
    }

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

    const duration = target.dataset.duration
    if (duration) {
      state.gameDuration = parseInt(duration, 10)
      // Toggle visuel — chirurgical, pas de re-render
      target.parentElement?.querySelectorAll('.duration-tile').forEach(t => t.classList.remove('selected'))
      target.classList.add('selected')
      return
    }

    const cellAttr = target.dataset.cell
    if (cellAttr !== undefined) {
      const idx  = parseInt(cellAttr)
      const cell = state.myGrid[idx]
      if (!cell) return
      // Cellule validée avec photo : ouvre la photo en plein écran
      if (cell.status === 'validated') {
        const photo = state.myPhotos?.[idx]
        if (photo) {
          Promise.all([
            import('./ui/photo-viewer.js'),
            import('./data/objects.js'),
          ]).then(([{ openPhotoViewer }, { getObject }]) => {
            const obj = getObject(cell.objId)
            openPhotoViewer(photo, obj?.name || '')
          }).catch(() => toast('Déjà capturé !'))
        } else {
          toast('Déjà capturé !')
        }
        return
      }
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
  // Cycle de messages amusants pendant le chargement
  const FUN_MESSAGES = [
    'On chauffe les pixels...',
    'Ton avatar fait des étirements...',
    'Le grimage est en cours...',
    'Encore un peu de patience...',
    'Ça vaut le coup, promis...',
    'Petit shot pour faire passer le temps ?',
    'On ajuste la coiffure...',
    'Plus que quelques secondes...',
  ]
  const msgEl = document.getElementById('anim-fun-msg')
  if (!msgEl) return

  let i = 0
  const interval = setInterval(() => {
    // Si l'écran a changé, on stoppe
    if (!document.getElementById('anim-fun-msg')) {
      clearInterval(interval)
      return
    }
    i = (i + 1) % FUN_MESSAGES.length
    const el = document.getElementById('anim-fun-msg')
    if (el) el.innerHTML = FUN_MESSAGES[i].toUpperCase().replace(/\.{3}$/, '...').replace(/(\.\.\.)$/, '<br>$1')
  }, 4500)
}

/* ============================================================
   SCREEN HOOKS
   ============================================================ */
function setupScreenHooks() {
  // Écoute l'événement custom dispatché APRÈS le render du screen.
  // Plus fiable que hashchange + setTimeout.
  window.addEventListener('screen:rendered', (e) => {
    const screen = e.detail?.screen || state.currentScreen
    setupAvatarLoops()
    if (screen === 'game')               { updateHudConfidence(); checkHeartbeat(); _setupGamePhotosSubscription() }
    if (screen === 'lobby')              _setupLobbySubscriptions()
    if (screen === 'account')            _setupAccountScreen()
    if (screen === 'animations-loading') _setupAnimationsLoadingScreen()
    if (screen === 'end')                _setupGamePhotosSubscription()
    if (screen === 'home')               unsubscribeAll()
  })
}

function _setupGamePhotosSubscription() {
  if (!state.gameCode) return
  subscribeToPhotos(state.gameCode, (photos) => {
    state.gamePhotos = photos
    // Re-render end si on est dessus pour voir les photos qui arrivent
    if (state.currentScreen === 'end') show('end')
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
