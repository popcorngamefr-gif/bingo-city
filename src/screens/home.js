/**
 * Écran d'accueil
 * Hiérarchie : titre → identité → action principale → secondaire → discret
 */

import { state }        from '../state.js'
import { bgVarsovieHtml, floatingItemsHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'
import { avatarLayersHtml } from '../ui/avatar.js'

function _getActiveGame() {
  try {
    const raw = localStorage.getItem('bingo_active_game')
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.savedAt > 4 * 24 * 3600 * 1000) return null
    return data
  } catch { return null }
}

export function renderHome() {
  const profile    = state.userProfile
  const hasAccount = !!state.accountKey
  const active     = _getActiveGame()
  const myAvatar   = state.myAvatar || profile?.avatar
  const displayName = profile?.name || state.myName || state.accountKey || ''

  return `
    <section class="screen home-screen home-v2">
      ${bgVarsovieHtml()}
      ${floatingItemsHtml()}

      <!-- Compte mini top-right -->
      ${hasAccount ? `
        <button class="account-mini-btn" data-nav="account" title="Mon compte">
          ${icon('user', { size: 12 })}
          <span>@${state.accountKey}</span>
        </button>
      ` : `
        <button class="account-mini-btn account-mini-btn-cta" data-nav="account">
          ${icon('user', { size: 12 })}
          <span>Se connecter</span>
        </button>
      `}

      <!-- ZONE 1 : TITRE -->
      <div class="home-hero">
        <div class="title-game-stack">
          <div class="title-bingo">BINGO</div>
          <div class="title-sante">SANTÉ!</div>
          <div class="subtitle-banner">VARSOVIE ÉDITION</div>
        </div>

        ${hasAccount && myAvatar ? `
          <div class="home-identity-card" data-action="editHomeAvatar" title="Modifier mon avatar">
            <div class="home-identity-avatar">
              <div class="avatar md mood-idle">
                <div class="avatar-inner">
                  ${avatarLayersHtml(myAvatar, 'idle')}
                </div>
              </div>
            </div>
            <div class="home-identity-info">
              <div class="home-identity-name">${displayName}</div>
              <div class="home-identity-edit">
                ${icon('dice', { size: 10 })} modifier mon avatar
              </div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- ZONE 2 : ACTION PRINCIPALE -->
      <div class="home-actions-primary">
        ${active ? `
          <div class="active-game-banner" data-action="resumeActiveGame">
            <div class="active-game-content">
              <div class="active-game-label">${icon('hourglass', { size: 12 })} PARTIE EN COURS</div>
              <div class="active-game-name">${active.name || 'Sans nom'}</div>
              <div class="active-game-code">
                Code <strong>${active.code}</strong>${active.isMJ ? ' · Tu es MJ' : ''}
              </div>
            </div>
            <div class="active-game-arrow">${icon('arrow_right', { size: 18 })}</div>
          </div>
          <div class="home-active-secondary">
            <button class="link-discreet" data-action="forgetActiveGame">
              Oublier cette partie
            </button>
          </div>
        ` : `
          <button class="btn btn-red home-cta-main" data-action="goCreate">
            ${icon('bingo_card', { size: 24 })}
            Créer une partie
          </button>
          <button class="btn btn-yellow home-cta-second" data-action="goJoin">
            ${icon('link', { size: 20 })}
            Rejoindre
          </button>
        `}
      </div>

      <!-- ZONE 3 : LIENS DISCRETS -->
      <div class="home-bottom">
        <button class="link-discreet" data-action="showHelp">
          ${icon('question', { size: 12 })} Comment jouer ?
        </button>
        ${!hasAccount ? `
          <button class="link-discreet link-emphasis" data-nav="account">
            ${icon('user', { size: 12 })} Créer un compte pour sauvegarder
          </button>
        ` : ''}
      </div>

      <p class="footer-info">
        v0.8 · ${icon('bottle', { size: 12 })} Na zdrowie !
      </p>

      <div class="polska-sticker"></div>
    </section>
  `
}
