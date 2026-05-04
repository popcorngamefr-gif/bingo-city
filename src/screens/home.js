/**
 * Écran d'accueil
 */

import { state }        from '../state.js'
import { bgVarsovieHtml, floatingItemsHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'
import { avatarLayersHtml } from '../ui/avatar.js'

// Lit le localStorage directement (évite circular import avec main.js)
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

  return `
    <section class="screen home-screen" style="padding-top: 20px;">
      ${bgVarsovieHtml()}
      ${floatingItemsHtml()}

      ${hasAccount ? `
        <button class="account-mini-btn" data-nav="account" title="Mon compte">
          ${icon('user', { size: 14 })}
          <span>@${state.accountKey}</span>
        </button>
      ` : ''}

      <div class="title-game-stack">
        <div class="title-bingo">BINGO</div>
        <div class="title-sante">SANTÉ!</div>
        <div class="subtitle-banner">VARSOVIE ÉDITION</div>
      </div>

      <div class="home-spacer"></div>

      <div class="stack home-actions">

        ${active ? `
          <div class="active-game-banner" data-action="resumeActiveGame">
            <div class="active-game-content">
              <div class="active-game-label">${icon('hourglass', { size: 12 })} PARTIE EN COURS</div>
              <div class="active-game-name">${active.name || 'Sans nom'}</div>
              <div class="active-game-code">Code : <strong>${active.code}</strong>${active.isMJ ? ' · Tu es MJ' : ''}</div>
            </div>
            <div class="active-game-arrow">${icon('arrow_right', { size: 18 })}</div>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="forgetActiveGame" style="margin-top:-8px;font-size:11px;">
            Oublier cette partie
          </button>
        ` : ''}

        <button class="btn btn-red" data-action="goCreate">
          ${icon('bingo_card', { size: 22 })}
          Créer une partie
        </button>

        <button class="btn btn-yellow" data-action="goJoin">
          ${icon('link', { size: 22 })}
          Rejoindre
        </button>

        <button class="btn btn-cream btn-sm" data-action="showHelp">
          ${icon('question', { size: 16 })}
          Comment jouer
        </button>

        ${hasAccount && myAvatar ? `
          <div class="home-avatar-signature" data-action="editHomeAvatar" title="Modifier mon avatar">
            <div class="avatar md mood-idle">
              <div class="avatar-inner">
                ${avatarLayersHtml(myAvatar, 'idle')}
              </div>
            </div>
            <div class="home-avatar-name">
              ${profile?.name || state.myName || ''}
              <span class="home-avatar-edit-hint">${icon('dice', { size: 10 })} modifier</span>
            </div>
          </div>
        ` : ''}

      </div>

      ${!hasAccount ? `
        <div class="home-bottom-cta">
          <button class="btn btn-cream account-create-cta" data-nav="account">
            ${icon('user', { size: 18 })}
            Créer mon compte
            <span class="account-create-cta-sub">Avatar persistant, jouer plus vite</span>
          </button>
        </div>
      ` : ''}

      <p class="footer-info">
        v0.8 · ${icon('bottle', { size: 14 })} Na zdrowie !
      </p>

      <div class="polska-sticker"></div>
    </section>
  `
}
