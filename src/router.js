/**
 * Router simple basé sur le hash de l'URL
 */

import { state } from './state.js'

import { renderHome }    from './screens/home.js'
import { renderCreate }  from './screens/create.js'
import { renderJoin }    from './screens/join.js'
import { renderAvatar }  from './screens/avatar.js'
import { renderLobby }   from './screens/lobby.js'
import { renderSetup }   from './screens/setup.js'
import { renderGame }    from './screens/game.js'
import { renderEnd }     from './screens/end.js'
import { renderAccount }    from './screens/account.js'
import { renderAvatarPick }        from './screens/avatar-pick.js'
import { renderAnimationsLoading }   from './screens/animations-loading.js'

const SCREENS = {
  home:    renderHome,
  create:  renderCreate,
  join:    renderJoin,
  avatar:  renderAvatar,
  lobby:   renderLobby,
  setup:   renderSetup,
  game:    renderGame,
  end:     renderEnd,
  account:      renderAccount,
  'avatar-pick':          renderAvatarPick,
  'animations-loading':   renderAnimationsLoading,
}

let appRoot = null

export function show(screenName) {
  if (!appRoot) appRoot = document.getElementById('app')
  if (!appRoot) { console.error('App root not found'); return }

  const renderer = SCREENS[screenName]
  if (!renderer) { console.error(`Unknown screen: ${screenName}`); return }

  state.currentScreen = screenName

  try {
    appRoot.innerHTML = renderer()
    const screenEl = appRoot.querySelector('.screen')
    if (screenEl) requestAnimationFrame(() => screenEl.classList.add('active'))
    // Notifie les hooks de setup que le DOM est prêt
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('screen:rendered', { detail: { screen: screenName } }))
    })
  } catch (err) {
    console.error(`Error rendering ${screenName}:`, err)
    appRoot.innerHTML = `
      <div style="padding:20px;color:#fff;">
        <h2>Erreur</h2><p>${err.message}</p>
        <button onclick="location.hash='home'" style="padding:8px;">Retour home</button>
      </div>`
  }
}

function _resolveScreen(rawHash) {
  // Supporte #join/CODE → renvoie 'join' (le code est lu dans le screen)
  const screen = rawHash.split('/')[0] || 'home'
  return SCREENS[screen] ? screen : 'home'
}

export function initRouter() {
  const raw     = window.location.hash.slice(1)
  const initial = _resolveScreen(raw)
  show(initial)
  window.addEventListener('hashchange', () => {
    const raw    = window.location.hash.slice(1)
    const screen = _resolveScreen(raw)
    show(screen)
  })
}

export function navigate(screen) {
  const currentHash = window.location.hash.slice(1) || 'home'
  const currentScreen = currentHash.split('/')[0] || 'home'
  const targetScreen  = screen.split('/')[0]
  if (currentScreen === targetScreen) {
    show(targetScreen)
  } else {
    window.location.hash = screen
  }
}
