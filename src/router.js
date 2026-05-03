/**
 * Router simple basé sur le hash de l'URL
 * Charge l'écran approprié dans #app
 */

import { state } from './state.js'

import { renderHome } from './screens/home.js'
import { renderCreate } from './screens/create.js'
import { renderJoin } from './screens/join.js'
import { renderAvatar } from './screens/avatar.js'
import { renderLobby } from './screens/lobby.js'
import { renderSetup } from './screens/setup.js'
import { renderGame } from './screens/game.js'
import { renderEnd } from './screens/end.js'

const SCREENS = {
  home: renderHome,
  create: renderCreate,
  join: renderJoin,
  avatar: renderAvatar,
  lobby: renderLobby,
  setup: renderSetup,
  game: renderGame,
  end: renderEnd,
}

let appRoot = null

/**
 * Affiche un écran
 */
export function show(screenName) {
  if (!appRoot) appRoot = document.getElementById('app')
  if (!appRoot) {
    console.error('App root not found')
    return
  }

  const renderer = SCREENS[screenName]
  if (!renderer) {
    console.error(`Unknown screen: ${screenName}`)
    return
  }

  state.currentScreen = screenName

  try {
    appRoot.innerHTML = renderer()
    // Activer la classe screen pour l'animation
    const screenEl = appRoot.querySelector('.screen')
    if (screenEl) {
      // Forcer un reflow pour relancer l'animation
      requestAnimationFrame(() => screenEl.classList.add('active'))
    }
    // Mettre à jour le debug nav
    updateDebugNav(screenName)
  } catch (err) {
    console.error(`Error rendering ${screenName}:`, err)
    appRoot.innerHTML = `<div style="padding:20px;color:#fff;">
      <h2>Erreur</h2>
      <p>${err.message}</p>
      <pre style="font-size:10px;background:#000;color:#0f0;padding:8px;overflow:auto;">${err.stack}</pre>
      <button onclick="location.hash='home'" style="padding:8px;">Retour home</button>
    </div>`
  }
}

function updateDebugNav(screenName) {
  document.querySelectorAll('#debug-bar button').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === screenName)
  })
}

/**
 * Init le router : écoute les changements de hash
 */
export function initRouter() {
  // Premier affichage
  const initial = window.location.hash.slice(1) || 'home'
  show(SCREENS[initial] ? initial : 'home')

  // Écoute les changements de hash
  window.addEventListener('hashchange', () => {
    const screen = window.location.hash.slice(1) || 'home'
    if (SCREENS[screen]) show(screen)
  })
}

/**
 * Navigation : modifie le hash, ce qui déclenche l'affichage
 */
export function navigate(screen) {
  window.location.hash = screen
}
