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
import { renderAccount } from './screens/account.js'

const SCREENS = {
  home:    renderHome,
  create:  renderCreate,
  join:    renderJoin,
  avatar:  renderAvatar,
  lobby:   renderLobby,
  setup:   renderSetup,
  game:    renderGame,
  end:     renderEnd,
  account: renderAccount,
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
  } catch (err) {
    console.error(`Error rendering ${screenName}:`, err)
    appRoot.innerHTML = `
      <div style="padding:20px;color:#fff;">
        <h2>Erreur</h2><p>${err.message}</p>
        <button onclick="location.hash='home'" style="padding:8px;">Retour home</button>
      </div>`
  }
}

export function initRouter() {
  const initial = window.location.hash.slice(1) || 'home'
  show(SCREENS[initial] ? initial : 'home')
  window.addEventListener('hashchange', () => {
    const screen = window.location.hash.slice(1) || 'home'
    if (SCREENS[screen]) show(screen)
  })
}

export function navigate(screen) {
  window.location.hash = screen
}
