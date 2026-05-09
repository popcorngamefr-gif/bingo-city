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
import { saveActiveGame, clearActiveGame, getActiveGame } from './activeGame.js'

import { refreshAvatarUI, cycleAvatarField, setupAvatarLoops, updateHudConfidence, checkHeartbeat } from './controllers/avatarController.js'
import { recordGameStats }                from './controllers/gameController.js'
import { startTimer }                     from './controllers/timerController.js'
import { openCameraModal, closeModal }    from './ui/modal.js'
import { openHowToPlay }                  from './ui/how-to-play.js'
import { openHallOfFameModal }            from './ui/hall-of-fame.js'
import { openSouvenirsModal }             from './ui/souvenirs-modal.js'
import { openConfirmModal }               from './ui/confirm-modal.js'

import { initAuth, saveProfile }          from './firebase/auth.js'
import { withTimeout, initConnectivityWatcher, onConnectivityChange, isOnline } from './utils/network.js'
import { loadProfileCache }               from './utils/profileCache.js'
import { createGame as fbCreateGame, joinGame as fbJoinGame, startGame as fbStartGame, subscribeToPlayers, subscribeToGame, subscribeToPhotos, unsubscribeAll, getGameOnce, getPlayersOnce, getPhotosOnce } from './firebase/game.js'
import { checkPseudoAvailable, createAccount, loginWithPin, updateAccountUID } from './firebase/account.js'
import { openGeneratorModal }   from './ui/avatar-generator.js'
import { openShooterPaywall } from './ui/shooter-paywall.js'
import { openMoodPicker }     from './ui/mood-picker.js'
import { openCustomObjPicker as openCustomObjPickerUI } from './ui/custom-obj-picker.js'
import { openShareModal as openShareModalUI } from './ui/share-modal.js'
import { generateAnimations }               from './ui/animations-generator.js'


function _showAdblockBanner() {
  if (document.getElementById('adblock-banner')) return
  const b = document.createElement('div')
  b.id = 'adblock-banner'
  b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#cf3a3a;color:#fff;padding:10px 16px;font-family:system-ui,sans-serif;font-size:13px;text-align:center;z-index:9999;box-shadow:0 2px 8px rgba(0,0,0,0.3);'
  b.innerHTML = `⚠️ Bloqueur de pub détecté — désactive-le sur ce site sinon le jeu ne fonctionnera pas correctement <span style="opacity:0.7;cursor:pointer;margin-left:8px;" onclick="this.parentElement.remove()">✕</span>`
  document.body.appendChild(b)
}

/**
 * Bandeau persistant + toast au passage offline/online.
 */
function _setupOfflineBanner() {
  initConnectivityWatcher()
  const ensureBanner = () => {
    let b = document.getElementById('offline-banner')
    if (!b) {
      b = document.createElement('div')
      b.id = 'offline-banner'
      b.className = 'offline-banner'
      b.textContent = 'Hors ligne — on attend le retour du réseau'
      document.body.appendChild(b)
    }
    return b
  }
  const apply = (online) => {
    const b = ensureBanner()
    b.classList.toggle('show', !online)
    if (online) {
      toast('Reconnecté')
      // Réessaye toutes les photos en queue dès qu'on est de retour en ligne.
      // Voir src/utils/photoQueue.js.
      import('./utils/photoQueue.js').then(({ retryAllPending }) => retryAllPending())
        .catch(() => {})
    } else {
      toast('Hors ligne')
    }
  }
  // État initial : banner visible si déjà offline
  if (!isOnline()) ensureBanner().classList.add('show')
  onConnectivityChange(apply)
}

/**
 * Écran de chargement initial. Affiche un bouton "Réessayer" si l'auth
 * met plus de quelques secondes — l'utilisateur n'est plus bloqué sur un
 * "Connexion..." figé en cas de réseau pourri ou de Firebase bloqué.
 */
function _renderBootScreen({ withRetry = false, errorMsg = '' } = {}) {
  const app = document.getElementById('app')
  if (!app) return
  app.innerHTML = `
    <section class="screen" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;">
      <div style="font-family:'Press Start 2P',monospace;font-size:11px;color:var(--ink);text-align:center;line-height:1.8;">BINGO SANTÉ<br>VARSOVIE</div>
      <div style="font-family:'VT323',monospace;font-size:18px;color:var(--ink-soft);">
        ${errorMsg || 'Connexion...'}
      </div>
      ${withRetry ? `
        <button onclick="location.reload()" style="margin-top:8px;padding:10px 18px;background:#d04848;color:#fff;border:3px solid #2a2228;border-radius:8px;font-family:'Press Start 2P',monospace;font-size:10px;cursor:pointer;box-shadow:2px 2px 0 #2a2228;">
          RÉESSAYER
        </button>
      ` : ''}
    </section>`
}

// ─── Persistance partie en cours ─────────────────────────────────────────────
// Voir ./activeGame.js pour saveActiveGame, clearActiveGame, getActiveGame

/* ============================================================
   LOBBY — temps réel
   ============================================================ */
const _seenPlayerIds = new Set()
// Code de la partie pour laquelle on a actuellement des listeners lobby actifs.
// Évite la boucle de re-render : sans ça, screen:rendered retrigger _setupLobbySubscriptions
// qui réinstalle le listener, qui reçoit le snapshot initial, qui re-render, etc.
let _lobbySubscribedFor = null
// Même mécanisme pour la subscription photos (game + end)
let _photosSubscribedFor = null

function _onPlayersUpdate(players) {
  const newIds = players
    .filter(p => !_seenPlayerIds.has(p.id))
    .map(p => { _seenPlayerIds.add(p.id); return p.id })

  state.players = players.map(p => ({
    ...p,
    isYou:      p.id === state.uid,
    justJoined: newIds.includes(p.id),
  }))

  // Rafraîchir l'écran courant si concerné par les data joueurs
  if (state.currentScreen === 'lobby') {
    show('lobby')
    if (newIds.length) setTimeout(() => {
      state.players = state.players.map(p => ({ ...p, justJoined: false }))
    }, 600)
  } else if (state.currentScreen === 'game' || state.currentScreen === 'end') {
    // En partie / fin de partie : rafraîchir HUD scores + classement
    show(state.currentScreen)
  }
}

function _onGameUpdate(gameData) {
  // Hydrate la durée à tout moment (le MJ peut la modifier en lobby)
  if (typeof gameData.duration === 'number') state.gameDuration = gameData.duration
  // Ancre du timer (cf. timerController) — synchro reload + entre joueurs
  if (gameData.startedAt && typeof gameData.startedAt.toMillis === 'function') {
    state.gameStartedAt = gameData.startedAt.toMillis()
  }

  // Hydratation tardive : si on est arrivé sur un écran de partie sans state
  // (ex: getGameOnce a timeout au boot), on remplit selectedObjects + myGrid
  // depuis le 1er snapshot live et on re-render. Idempotent : on ne déclenche
  // qu'une fois (tant que selectedObjects reste vide).
  const inGameScreen = state.currentScreen === 'game' || state.currentScreen === 'end'
  const stateEmpty   = !state.selectedObjects || state.selectedObjects.length === 0
  if (gameData.status === 'playing' && inGameScreen && stateEmpty
      && Array.isArray(gameData.selectedObjects) && gameData.selectedObjects.length) {
    state.selectedObjects = gameData.selectedObjects
    state.customObjects   = gameData.customObjects || []
    state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
    if (!state.timerInterval) startTimer()
    // Hydrate les photos en différé puis re-render (idempotent côté state)
    import('./firebase/game.js').then(({ getPhotosOnce }) => getPhotosOnce(state.gameCode))
      .then(photos => {
        state.gamePhotos = photos
        state.myPhotos = state.myPhotos || {}
        const mine = photos.filter(p => p.uid === state.uid)
        for (const photo of mine) {
          if (!photo.objId) continue
          const idx = state.selectedObjects.indexOf(photo.objId)
          if (idx >= 0) {
            state.myGrid[idx].status = 'validated'
            state.myPhotos[idx]      = photo.url
          }
        }
        if (state.currentScreen === 'game' || state.currentScreen === 'end') show(state.currentScreen)
      })
      .catch(err => {
        console.warn('[late-hydrate] photos failed:', err)
        if (state.currentScreen === 'game' || state.currentScreen === 'end') show(state.currentScreen)
      })
    return
  }

  if (gameData.status === 'playing' && state.currentScreen === 'lobby' && !state.isMJ) {
    state.selectedObjects = gameData.selectedObjects || []
    state.customObjects   = gameData.customObjects || []
    state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
    startTimer()
    navigate('game')
  }
  if (gameData.status === 'ended') {
    // Partie réellement terminée → on quitte le mode preview s'il était actif
    // et on bascule sur le classement final
    if (state.currentScreen === 'game' || state.currentScreen === 'end') {
      state._previewClassement = false
      // Enregistre les stats pour TOUS les joueurs (MJ + invités)
      // Idempotent : si déjà appelé via bingo/timer/endGameByMJ, no-op
      recordGameStats('ended')
      if (state.currentScreen === 'end') show('end')
      else navigate('end')
    }
  }
}

function _setupLobbySubscriptions() {
  if (!state.gameCode) return
  // Évite de ré-installer les listeners à chaque re-render du lobby
  // (sinon Firestore renvoie un snapshot initial → re-render → réinstall → boucle)
  if (_lobbySubscribedFor === state.gameCode) return
  _lobbySubscribedFor = state.gameCode
  _seenPlayerIds.clear()
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
        try {
          const ok = await checkPseudoAvailable(val)
          el.textContent = ok ? '✓ Disponible' : '✗ Déjà pris'
          el.className   = ok ? 'pseudo-status ok' : 'pseudo-status err'
        } catch (err) {
          console.warn('[pseudo-check] failed:', err)
          el.textContent = '? vérification impossible'
          el.className   = 'pseudo-status'
        }
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
      // Le pseudo devient le nom par défaut s'il n'y en a pas déjà un
      if (!state.myName) state.myName = pseudo
      const key = await createAccount({
        pseudo, pin,
        uid:    state.uid,
        name:   state.myName,
        avatar: state.myAvatar || { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 },
      })
      console.log('[create-account] success, key:', key)
      state.accountKey = key
      try { localStorage.setItem('bingo_account_key', key) } catch {}
      // Persiste accountKey dans /users/{uid} pour qu'il soit restauré au reload
      await saveProfile({ name: state.myName, avatar: state.myAvatar }).catch(console.warn)
      toast('Compte créé ! Crée ton avatar')
      navigate('avatar-pick')
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
      console.log('[login] attempting:', pseudo)
      const data = await loginWithPin({ pseudo, pin })
      console.log('[login] success:', data.key, 'avatar:', data.avatar)
      // Mettre à jour l'UID dans le compte
      await updateAccountUID(data.key, state.uid)
      // Hydrate le state — important : on ÉCRASE l'avatar local par celui du compte
      state.accountKey  = data.key
      try { localStorage.setItem('bingo_account_key', data.key) } catch {}
      state.myName      = data.name
      state.myAvatar    = { ...(data.avatar || { skin: 0, eyes: 0, hairStyle: 0, hairColor: 0, acc: 0 }) }
      state.userProfile = { ...state.userProfile, ...data }
      // Sync avec /users/{uid} (inclut accountKey via saveProfile)
      await saveProfile({ name: data.name, avatar: state.myAvatar }).catch(console.warn)
      toast(`Bienvenue, ${data.name} !`, 3000)
      // Si pas d'avatar custom → propose la création
      const hasCustomAvatar = data.avatar && (data.avatar.generatedImageUrl || data.avatar.skin > 0 || data.avatar.hairStyle > 0)
      if (hasCustomAvatar) {
        // Avatar prêt → reprendre l'intention si existe (create/join), sinon home
        _resolvePendingIntent('home')
      } else {
        // Pas d'avatar → l'intention est conservée, on y reviendra après confirmAvatar
        navigate('avatar-pick')
      }
    } catch (err) {
      console.error('[login] error:', err)
      const msg = err.message === 'Pseudo introuvable' ? '❌ Pseudo introuvable'
                : err.message === 'PIN incorrect'      ? '❌ PIN incorrect'
                : err.code === 'permission-denied'    ? 'Permissions Firestore'
                : (err.message || 'Erreur de connexion')
      toast(msg, 4000)
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

  goCreate() {
    if (!state.accountKey) {
      state._pendingIntent = { kind: 'create' }
      toast('Crée ou connecte ton compte pour lancer une partie', 3000)
      navigate('account')
      return
    }
    state.isMJ = true
    navigate('create')
  },
  goJoin() {
    if (!state.accountKey) {
      state._pendingIntent = { kind: 'join' }
      toast('Crée ou connecte ton compte pour rejoindre', 3000)
      navigate('account')
      return
    }
    state.isMJ = false
    navigate('join')
  },

  showHelp() {
    openHowToPlay()
  },

  showHallOfFame() {
    openHallOfFameModal()
  },

  showSouvenirs() {
    openSouvenirsModal()
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

  cancelAvatarEdit() {
    // Restaure l'avatar tel qu'il était en entrant sur l'écran avatar
    // (annule toutes les modifs de skin/eyes/etc. faites sans validation)
    if (state._avatarSnapshot) {
      state.myAvatar = state._avatarSnapshot
      delete state._avatarSnapshot
    }
    if (state._myNameSnapshot !== undefined) {
      state.myName = state._myNameSnapshot
      delete state._myNameSnapshot
    }
    navigate('avatar-pick')
  },

  async confirmAvatar() {
    console.log('[confirmAvatar] start', { isMJ: state.isMJ, gameCode: state.gameCode, myName: state.myName, hasAvatar: !!state.myAvatar })
    // L'utilisateur valide → on jette le snapshot d'annulation (modif gardée)
    delete state._avatarSnapshot
    delete state._myNameSnapshot
    const nameInput = document.getElementById('avatar-name-input')
    if (nameInput) { const v = nameInput.value.trim(); if (v) state.myName = v }

    // Si une vidéo Déglingo a été générée, on attend la fin du mirror vers
    // Firebase Storage (URL stable à vie) — sans ça on persisterait l'URL
    // Replicate temporaire qui expire à 24h.
    // Timeout à 30s pour les connexions lentes : si l'upload Storage est
    // vraiment trop lent, on continue avec ce qu'on a, le mirror finira en
    // arrière-plan et un futur saveProfile mettra à jour l'URL.
    if (state._animationStorageUploadPromise) {
      const uploadPromise = state._animationStorageUploadPromise
      // Reset l'état tout de suite : si l'user clique Valider 2 fois,
      // on n'attend pas une 2e fois inutilement (la promesse continue à
      // vivre via la closure jusqu'à sa résolution, ce qui suffit pour
      // que le mirror termine en arrière-plan)
      delete state._animationStorageUploadPromise
      toast('Sauvegarde de ta vidéo Déglingo…', 5000)
      try {
        await Promise.race([
          uploadPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
        ])
      } catch (err) {
        if (err.message === 'timeout') {
          console.warn('[confirmAvatar] mirror Storage timeout 30s — continuing in background')
        } else {
          console.warn('[confirmAvatar] mirror failed:', err)
        }
      }
    }

    try { await saveProfile({ name: state.myName || state.accountKey || 'Anonyme', avatar: state.myAvatar }) }
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
      // Si l'user venait de créer son compte avec une intention create/join,
      // on le redirige maintenant vers la bonne destination
      _resolvePendingIntent('home')
      return
    }

    const me = { id: state.uid || 'me', name: state.myName || state.accountKey || 'Moi', avatar: { ...state.myAvatar }, score: 0, isMJ: state.isMJ, isYou: true }
    if (state.isMJ) {
      state.players = [me]
      console.log('[confirmAvatar] MJ creating game:', state.gameCode)
      try {
        await fbCreateGame({ code: state.gameCode, name: state.gameName, hostUid: state.uid, hostName: state.myName, hostAvatar: state.myAvatar, duration: state.gameDuration })
        saveActiveGame()
        console.log('[confirmAvatar] game created OK')
      } catch (err) {
        console.error('[confirmAvatar] createGame failed:', err)
        toast('Erreur création partie : ' + (err.message || err.code || 'inconnu'))
        return
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
    // Ancre locale optimiste — sera réécrasée par le serverTimestamp via _onGameUpdate
    state.gameStartedAt = Date.now()
    if (state.gameCode) fbStartGame(state.gameCode, state.selectedObjects, state.customObjects || []).catch(console.error)
    startTimer()
    navigate('game')
  },

  cancelPhoto() { closeModal(); state.currentPickingObj = null },

  openClassement() {
    // Vue temporaire du classement pendant la partie (ne termine pas la partie)
    state._previewClassement = true
    navigate('end')
  },

  closeClassement() {
    state._previewClassement = false
    navigate('game')
  },

  newGame() {
    unsubscribeAll()
    _seenPlayerIds.clear()
    _lobbySubscribedFor = null
    _photosSubscribedFor = null
    // Nettoie la queue d'upload photo de la partie qu'on abandonne pour
    // ne pas polluer le localStorage entre parties.
    if (state.gameCode) {
      import('./utils/photoQueue.js').then(({ clearPendingPhotos }) => clearPendingPhotos(state.gameCode))
        .catch(() => {})
    }
    clearActiveGame()
    resetGame()
    navigate('home')
  },

  async endGameByMJ() {
    if (!state.isMJ) return
    const ok = await openConfirmModal({
      title:        'Terminer la partie ?',
      body:         'Les joueurs seront envoyés au classement final.',
      confirmLabel: 'Terminer',
      cancelLabel:  'Annuler',
      destructive:  true,
    })
    if (!ok) return
    // Stop le timer local
    if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null }
    // Termine côté Firestore — les autres joueurs sont notifiés via subscribeToGame
    if (state.gameCode) {
      import('./firebase/game.js').then(({ endGame }) => {
        endGame(state.gameCode).catch(console.error)
      })
    }
    // Enregistre les stats (idempotent — couvre le cas du MJ qui termine sans bingo)
    recordGameStats('mj-ended')
    navigate('end')
  },

  editHomeAvatar() {
    // Hors partie : on n'est ni MJ ni joueur, juste en édition
    state.isMJ = false
    // Force l'affichage des 3 cartes de choix (sans détruire l'avatar IA existant)
    state._forceAvatarChoice = true
    navigate('avatar-pick')
  },

  async resumeActiveGame() {
    // Garde anti double-clic : la bannière home n'est pas un .btn donc le
    // verrou auto du dispatch ne s'applique pas.
    if (state._resumingGame) return
    state._resumingGame = true

    const active = getActiveGame()
    if (!active) { delete state._resumingGame; return }
    state.gameCode = active.code
    state.gameName = active.name
    state.isMJ     = active.isMJ
    state.myName   = active.myName || state.myName
    toast('Reprise de la partie…', 2000)

    // Route selon le statut Firestore : si la partie tourne déjà ('playing')
    // on retourne directement à l'écran de jeu, sinon on tombe sur le lobby
    // (ou 'end' si la partie est terminée). Sans cette résolution, le MJ
    // d'une partie en cours était renvoyé sur un lobby qui propose
    // 'Choisir les objets' → setup, comme s'il devait tout reconfigurer.
    try {
      const game = await withTimeout(getGameOnce(active.code), 6000, 'firestore-timeout')
      if (!game) {
        clearActiveGame()
        toast('Partie introuvable')
        navigate('home')
        return
      }
      if (typeof game.duration === 'number') state.gameDuration = game.duration
      if (game.startedAt && typeof game.startedAt.toMillis === 'function') {
        state.gameStartedAt = game.startedAt.toMillis()
      }
      state.selectedObjects = game.selectedObjects || []
      state.customObjects   = game.customObjects   || []

      if (game.status === 'playing') {
        // Reconstruit myGrid + myPhotos depuis les photos persistées,
        // exactement comme le boot fait sur reload du tab.
        state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
        state.myPhotos = {}
        try {
          const photos = await getPhotosOnce(active.code)
          state.gamePhotos = photos
          const mine = photos.filter(p => p.uid === state.uid)
          for (const photo of mine) {
            if (!photo.objId) continue
            const idx = state.selectedObjects.indexOf(photo.objId)
            if (idx >= 0) {
              state.myGrid[idx].status = 'validated'
              state.myPhotos[idx]      = photo.url
            }
          }
        } catch (err) {
          console.warn('[resume] photos failed:', err)
        }
        startTimer()
        navigate('game')
      } else if (game.status === 'ended') {
        navigate('end')
      } else {
        navigate('lobby')
      }
    } catch (err) {
      // Firestore injoignable : fallback lobby (les subscriptions hydrateront
      // le state quand le réseau revient ; cf. _onGameUpdate hydratation tardive)
      console.warn('[resume] getGameOnce failed:', err)
      navigate('lobby')
    } finally {
      // Restaure la queue d'upload photos APRÈS l'hydratation Firestore :
      // les dataURLs en attente sont overlay sur les URLs résolues sans
      // jamais écraser un upload qui a déjà réussi (le if(!state.myPhotos[idx])
      // dans restorePendingPhotos respecte la version Firestore quand elle
      // est dispo).
      try {
        const { restorePendingPhotos } = await import('./utils/photoQueue.js')
        restorePendingPhotos()
      } catch (err) { console.warn('[resume] restore photo queue failed:', err) }
      delete state._resumingGame
    }
  },

  forgetActiveGame() {
    if (state.gameCode) {
      import('./utils/photoQueue.js').then(({ clearPendingPhotos }) => clearPendingPhotos(state.gameCode))
        .catch(() => {})
    }
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

  // ── Souvenirs (page compte) ─────────────────────────────────────────────
  downloadProfilePhoto() {
    const url = state.myAvatar?.generatedImageUrl
    if (!url) return toast("Pas de photo générée")
    _downloadFile(url, `${state.accountKey || 'avatar'}-photo.png`)
  },

  downloadProfileVideo() {
    const url = state.myAvatar?.animationUrl
    if (!url) return toast("Pas de vidéo générée")
    _downloadFile(url, `${state.accountKey || 'avatar'}-deglingo.mp4`)
  },

  generateProfilePhoto() {
    // Ouvre direct la modale scan visage (= le flow IA)
    openGeneratorModal()
  },

  generateProfileVideo() {
    // Pas de flow direct simple — on renvoie vers avatar-pick qui a la logique paywall + génération
    // (l'image IA doit exister d'abord, sinon avatar-pick affichera la création de l'image)
    navigate('avatar-pick')
  },

  async logoutAccount() {
    const ok = await openConfirmModal({
      title:        'Déconnexion',
      body:         'Te déconnecter de cet appareil ? Tes données restent sauvegardées sur ton compte.',
      confirmLabel: 'Déconnecter',
      cancelLabel:  'Annuler',
      destructive:  true,
    })
    if (!ok) return
    state.accountKey  = null
    state.userProfile = { ...state.userProfile, accountKey: null }
    try { localStorage.removeItem('bingo_account_key') } catch {}
    toast('Compte déconnecté de cet appareil')
    navigate('home')
  },
}

/* ============================================================
   DÉLÉGATION D'ÉVÉNEMENTS
   ============================================================ */
/**
 * Ouvre un fichier distant dans un nouvel onglet pour que l'utilisateur
 * fasse "Enregistrer sous" manuellement.
 *
 * On a essayé fetch+blob mais Firebase Storage bloque le fetch via CORS
 * depuis le domaine de production. Tant que le bucket n'est pas configuré
 * en CORS, cette voie reste la plus simple et fiable.
 */
function _downloadFile(url, filename) {
  if (!url) return
  try {
    window.open(url, '_blank', 'noopener,noreferrer')
    toast('Ouverture dans un nouvel onglet — fais "Enregistrer sous" 👍', 4000)
  } catch (err) {
    console.warn('[download] open failed:', err)
    toast('Impossible d\'ouvrir le fichier')
  }
}

/**
 * Si l'utilisateur avait une intention en attente (créer/rejoindre),
 * on l'y redirige après création/connexion de compte.
 * Sinon, fallback sur la destination par défaut passée en paramètre.
 */
function _resolvePendingIntent(fallback = 'home') {
  const intent = state._pendingIntent
  delete state._pendingIntent
  if (!intent) { navigate(fallback); return }
  if (intent.kind === 'create') {
    state.isMJ = true
    navigate('create')
  } else if (intent.kind === 'join') {
    state.isMJ = false
    // Si un code était partagé via deeplink, le re-pousser dans l'URL
    if (intent.code) {
      window.location.hash = `join/${intent.code}`
    } else {
      navigate('join')
    }
  } else {
    navigate(fallback)
  }
}

/**
 * Affiche un spinner de chargement sur un bouton pendant une promesse.
 * Le contenu original est restauré (succès ou échec).
 * Empêche aussi le double-clic via `disabled`.
 *
 * Si le bouton a un attribut `data-loading-label`, ce label est affiché
 * à côté du spinner pour donner un contexte à l'utilisateur.
 */
function _withButtonLoader(btn, promise) {
  const originalHTML = btn.innerHTML
  const label        = btn.dataset.loadingLabel
  btn.disabled = true
  btn.dataset.loading = 'true'
  btn.innerHTML = label
    ? `<span class="btn-loader"></span> <span class="btn-loader-label">${label}</span>`
    : `<span class="btn-loader"></span>`

  const cleanup = () => {
    btn.disabled = false
    delete btn.dataset.loading
    btn.innerHTML = originalHTML
  }

  promise.then(cleanup, (err) => { cleanup(); console.warn('[action]', err) })
}

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

      // Anti double-clic : on désactive immédiatement le bouton.
      // Pour les actions async, on affiche un spinner jusqu'à résolution.
      const isButton = target.tagName === 'BUTTON' || target.classList.contains('btn')
      const result = ACTIONS[action]()
      if (result && typeof result.then === 'function' && isButton) {
        _withButtonLoader(target, result)
      } else if (isButton) {
        // Action synchrone : petit lock anti double-clic de 300ms
        target.disabled = true
        setTimeout(() => { target.disabled = false }, 300)
      }
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

    // Galerie de fin / vignettes : ouvrir la photo en plein écran
    const photoUrl = target.dataset.photoUrl
    if (photoUrl) {
      const photoName = target.dataset.photoName || ''
      import('./ui/photo-viewer.js').then(({ openPhotoViewer }) => {
        openPhotoViewer(photoUrl, photoName)
      }).catch(err => console.warn('[photo-viewer] failed to load:', err))
      return
    }

    const cellAttr = target.dataset.cell
    if (cellAttr !== undefined) {
      const idx  = parseInt(cellAttr)
      const cell = state.myGrid[idx]
      if (!cell) return
      // Cellule validée avec photo : ouvre la photo en plein écran.
      if (cell.status === 'validated') {
        // On cherche d'abord state.myPhotos[idx] (cas normal). En fallback,
        // on lit state.gamePhotos qui contient TOUTES les photos Firestore
        // de la partie (peuplé via subscribeToPhotos au mount du screen).
        // Ça couvre les cas où myPhotos a un trou (ex: late-hydration où
        // _hydratePhotos n'a pas encore été déclenché ou échoué silencieux).
        let photo = state.myPhotos?.[idx]
        if (!photo) {
          const found = (state.gamePhotos || []).find(p => p.uid === state.uid && p.objId === cell.objId)
          if (found?.url) {
            photo = found.url
            // Mémorise pour les prochains clics (et pour la cohérence générale)
            state.myPhotos[idx] = found.url
          }
        }
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
    if (screen === 'game')               { updateHudConfidence(); checkHeartbeat(); _setupGamePhotosSubscription(); _setupLobbySubscriptions() }
    if (screen === 'lobby')              _setupLobbySubscriptions()
    if (screen === 'account')            _setupAccountScreen()
    if (screen === 'animations-loading') _setupAnimationsLoadingScreen()
    if (screen === 'end')                { _setupGamePhotosSubscription(); _setupLobbySubscriptions() }
    if (screen === 'home')               { unsubscribeAll(); _lobbySubscribedFor = null; _photosSubscribedFor = null; delete state._pendingIntent }
  })
}

function _setupGamePhotosSubscription() {
  if (!state.gameCode) return
  // Évite la boucle (cf. _setupLobbySubscriptions)
  if (_photosSubscribedFor === state.gameCode) return
  _photosSubscribedFor = state.gameCode
  subscribeToPhotos(state.gameCode, (photos) => {
    state.gamePhotos = photos
    // Re-render end si on est dessus pour voir les photos qui arrivent
    if (state.currentScreen === 'end') show('end')
  })
}

/* ============================================================
   INIT
   ============================================================ */
// Global error handler — affiche toute erreur uncaught en plein écran
window.addEventListener('error', (e) => {
  console.error('[GLOBAL ERROR]', e.error || e.message)
  if (document.getElementById('global-err')) return
  const div = document.createElement('div')
  div.id = 'global-err'
  div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#fce080;color:#2a2228;padding:14px;font-family:monospace;font-size:11px;z-index:9999;border-top:3px solid #cf3a3a;max-height:40vh;overflow:auto;'
  div.innerHTML = `<strong>Erreur :</strong> ${e.message || e.error}<br><small>${(e.error?.stack || '').slice(0, 300)}</small><br><button onclick="this.parentElement.remove()" style="margin-top:6px;padding:4px 10px;background:#cf3a3a;color:#fff;border:none;border-radius:4px;">Fermer</button>`
  document.body.appendChild(div)
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('[UNHANDLED PROMISE]', e.reason)
})

document.addEventListener('DOMContentLoaded', async () => {
  setupInputFilters()
  setupEventDelegation()
  setupScreenHooks()
  _setupOfflineBanner()

  // Hydratation rapide depuis le cache localStorage : permet au moins
  // d'afficher l'avatar de l'utilisateur si Firestore est lent à répondre.
  // Sera écrasé proprement par loadProfile() une fois Firestore disponible.
  const cachedProfile = loadProfileCache()
  if (cachedProfile) {
    if (cachedProfile.name)   state.myName   = cachedProfile.name
    if (cachedProfile.avatar) state.myAvatar = { ...state.myAvatar, ...cachedProfile.avatar }
  }

  _renderBootScreen()
  // Si l'auth traîne, on propose un Réessayer après 6s sans bloquer le flow
  const slowBootTimer = setTimeout(() => _renderBootScreen({ withRetry: true, errorMsg: 'Réseau lent…' }), 6000)

  try {
    // Timeout dur à 12s : au-delà, on considère Firebase injoignable
    // (adblock, captive portal, 4G coupée). On affiche l'écran avec Réessayer.
    await withTimeout(initAuth(), 12000, 'auth-timeout')
  } catch (err) {
    console.warn('Auth failed, running offline:', err)
    if (err?.message === 'auth-timeout') {
      clearTimeout(slowBootTimer)
      _renderBootScreen({ withRetry: true, errorMsg: 'Connexion impossible. Vérifie ton réseau.' })
      // On laisse l'écran de retry à l'user et on ne continue PAS le boot :
      // sans uid, la suite (Firestore reads, etc.) échouerait en cascade.
      return
    }
    if (err?.code?.includes('network') || err?.message?.includes('network') || err?.message?.includes('blocked')) {
      _showAdblockBanner()
    }
  }
  clearTimeout(slowBootTimer)

  // Fallback localStorage : si Firebase a perdu l'UID anonyme
  // (cookies effacés, navigation privée…), accountKey peut ne pas remonter
  // via loadProfile. On hydrate manuellement depuis localStorage.
  if (!state.accountKey) {
    try {
      const cachedKey = localStorage.getItem('bingo_account_key')
      if (cachedKey) {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('./firebase/config.js')
        // Timeout 6s : si Firestore ne répond pas, on n'a pas à bloquer le boot.
        // L'user verra son profil cache et pourra interagir ; le re-link se
        // fera tout seul plus tard quand le réseau sera revenu.
        const snap = await withTimeout(getDoc(doc(db, 'accounts', cachedKey)), 6000, 'firestore-timeout')
        if (snap.exists()) {
          const data = snap.data()
          state.accountKey  = cachedKey
          state.myName      = data.name || state.myName
          if (data.avatar) state.myAvatar = { ...state.myAvatar, ...data.avatar }
          state.userProfile = { ...(state.userProfile || {}), accountKey: cachedKey, name: data.name, avatar: data.avatar }
          console.log('[boot] account restored from localStorage:', cachedKey)
          // Re-link l'UID actuel au compte (l'ancien UID anonyme a peut-être changé)
          if (state.uid && state.uid !== data.uid) {
            try {
              const { updateAccountUID } = await import('./firebase/account.js')
              await updateAccountUID(cachedKey, state.uid)
              await saveProfile({ name: data.name, avatar: state.myAvatar }).catch(() => {})
            } catch (err) { console.warn('[boot] re-link uid failed:', err) }
          }
        } else {
          // accountKey orphelin (compte supprimé ?) → cleanup
          localStorage.removeItem('bingo_account_key')
        }
      }
    } catch (err) {
      console.warn('[boot] localStorage account restore failed:', err)
    }
  }

  // Test rapide : si Firebase est bloqué par adblock, prévenir l'user
  setTimeout(async () => {
    try {
      // Test simple en faisant un getDoc inutile
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('timeout')), 3000)
        fetch('https://firestore.googleapis.com/', { mode: 'no-cors' })
          .then(() => { clearTimeout(timeoutId); resolve() })
          .catch(err => { clearTimeout(timeoutId); reject(err) })
      })
    } catch (err) {
      console.warn('[adblock] firestore appears blocked:', err.message)
      _showAdblockBanner()
    }
  }, 2000)

  // Restauration partie en cours si le hash pointe vers un écran de partie
  const hash = (location.hash.slice(1) || 'home').split('/')[0]
  const inGameScreens = ['lobby', 'setup', 'game', 'end']
  if (inGameScreens.includes(hash)) {
    const active = getActiveGame()
    if (active) {
      console.log('[boot] restoring active game:', active.code)
      state.gameCode = active.code
      state.gameName = active.name
      state.isMJ     = active.isMJ
      state.myName   = active.myName || state.myName
      // Hydrate la partie depuis Firestore avant de render. Timeout 8s :
      // sur réseau pourri on n'attend pas indéfiniment, on rend l'écran et
      // _onGameUpdate fera l'hydratation tardive quand le snapshot arrive.
      try {
        const game = await withTimeout(getGameOnce(active.code), 8000, 'firestore-timeout')
        if (game) {
          if (typeof game.duration === 'number') state.gameDuration = game.duration
          if (game.startedAt && typeof game.startedAt.toMillis === 'function') {
            state.gameStartedAt = game.startedAt.toMillis()
          }
          state.selectedObjects = game.selectedObjects || []
          state.customObjects   = game.customObjects   || []

          // Hydrate les joueurs (noms, avatars, scores)
          // Sans ça, le classement preview affiche "Joueur" anonymes après reload.
          try {
            const players = await getPlayersOnce(active.code)
            state.players = players.map(p => ({
              ...p,
              isYou:      p.id === state.uid,
              justJoined: false,
            }))
          } catch (err) {
            console.warn('[boot] getPlayersOnce failed:', err)
          }

          // Helper local : recharge photos + reconstitue myGrid + myPhotos
          // utilisé pour les deux cas reload (game ou end-preview)
          const _hydratePhotos = async () => {
            state.myGrid = state.selectedObjects.map(id => ({ objId: id, status: 'empty' }))
            state.myPhotos = {}
            try {
              const photos = await getPhotosOnce(active.code)
              state.gamePhotos = photos
              const mine = photos.filter(p => p.uid === state.uid)
              for (const photo of mine) {
                if (!photo.objId) continue
                const idx = state.selectedObjects.indexOf(photo.objId)
                if (idx >= 0) {
                  state.myGrid[idx].status = 'validated'
                  state.myPhotos[idx]      = photo.url
                }
              }
            } catch (err) {
              console.warn('[boot] getPhotosOnce failed:', err)
            }
          }

          if (game.status === 'playing' && hash === 'game') {
            await _hydratePhotos()
            startTimer()
          }
          // Si on reload sur #end alors que la partie est ENCORE en cours
          // → c'est forcément un preview de classement, pas une fin réelle
          if (game.status === 'playing' && hash === 'end') {
            state._previewClassement = true
            await _hydratePhotos()
            startTimer()
          }
          if (game.status === 'ended' && hash !== 'end') {
            location.hash = 'end'
          }
          if (game.status === 'ended' && hash === 'end') {
            // Charger les photos pour la galerie de fin
            await _hydratePhotos()
          }
        } else {
          console.warn('[boot] active game not found in Firestore, clearing')
          clearActiveGame()
          location.hash = 'home'
        }
      } catch (err) {
        console.warn('[boot] hydrate failed:', err)
      }

      // Hydrate la queue d'upload photos APRÈS _hydratePhotos pour ne pas
      // se faire écraser par le reset state.myPhotos = {} de _hydratePhotos.
      // restorePendingPhotos n'écrit que si state.myPhotos[idx] n'existe pas
      // déjà (on respecte la version Firestore quand elle est dispo) et
      // déclenche retryAllPending pour relancer les uploads en attente.
      try {
        const { restorePendingPhotos } = await import('./utils/photoQueue.js')
        restorePendingPhotos()
      } catch (err) { console.warn('[boot] restore photo queue failed:', err) }
    } else {
      // Pas de partie active → revenir home
      location.hash = 'home'
    }
  }

  initRouter()
  setTimeout(setupAvatarLoops, 100)
  // Si on atterrit sur #account au premier chargement
  if (state.currentScreen === 'account') setTimeout(_setupAccountScreen, 60)

  console.log('🍻 Bingo Santé Varsovie ready', {
    uid: state.uid, account: state.accountKey,
    skins: PORTRAIT.skins.length, objects: getObjects().length,
  })
})
