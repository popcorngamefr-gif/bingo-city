/**
 * Écran d'accueil
 * Hiérarchie : titre → identité (avec avatar Déglingo) → actions → liens discrets
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
  const hasDeglingoVideo = !!(myAvatar?.animationUrl)

  return `
    <section class="screen home-screen home-v3">
      ${bgVarsovieHtml()}
      ${floatingItemsHtml()}

      <!-- ZONE 1 : TITRE compact -->
      <div class="home-v3-title">
        <div class="title-game-stack">
          <div class="title-bingo">BINGO</div>
          <div class="title-sante">SANTÉ!</div>
          <div class="subtitle-banner">VARSOVIE ÉDITION</div>
        </div>
      </div>

      <!-- ZONE 2 : IDENTITÉ — au-dessus de Créer comme demandé -->
      ${hasAccount && myAvatar ? `
        <div class="home-v3-identity ${hasDeglingoVideo ? 'has-video' : ''}" data-action="editHomeAvatar" title="Modifier mon avatar">
          <div class="home-v3-avatar-wrap">
            <div class="avatar md mood-idle">
              <div class="avatar-inner">
                ${avatarLayersHtml(myAvatar, 'idle')}
              </div>
            </div>
            ${hasDeglingoVideo ? `<span class="home-v3-deglingo-badge">DÉGLINGO</span>` : ''}
          </div>
          <div class="home-v3-identity-info">
            <div class="home-v3-name">${displayName}</div>
            <div class="home-v3-edit">
              ${icon('dice', { size: 10 })} <span>modifier</span>
            </div>
          </div>
          <div class="home-v3-account-link">
            <button class="home-v3-mini-account" data-nav="account" onclick="event.stopPropagation()">
              ${icon('user', { size: 12 })}
            </button>
          </div>
        </div>
      ` : `
        <div class="home-v3-identity home-v3-identity-empty" data-nav="account">
          <div class="home-v3-empty-icon">${icon('user', { size: 28 })}</div>
          <div class="home-v3-identity-info">
            <div class="home-v3-name">Crée ton compte</div>
            <div class="home-v3-edit">Avatar persistant entre tes parties</div>
          </div>
          <div class="active-game-arrow">${icon('arrow_right', { size: 18 })}</div>
        </div>
      `}

      <!-- ZONE 3 : ACTIONS -->
      <div class="home-v3-actions">
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
          <button class="link-discreet" data-action="forgetActiveGame" style="align-self:center;">
            Oublier cette partie
          </button>
        ` : `
          <button class="btn btn-red home-v3-cta-main" data-action="goCreate">
            <span class="home-v3-cta-icon home-v3-cta-icon-red">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
              </svg>
            </span>
            <span class="home-v3-cta-label">
              <span class="home-v3-cta-title">Créer une partie</span>
              <span class="home-v3-cta-sub">Tu seras le maître du jeu</span>
            </span>
            ${icon('arrow_right', { size: 18 })}
          </button>

          <button class="btn btn-yellow home-v3-cta-second" data-action="goJoin">
            <span class="home-v3-cta-icon home-v3-cta-icon-yellow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/>
                <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>
              </svg>
            </span>
            <span class="home-v3-cta-label">
              <span class="home-v3-cta-title">Rejoindre</span>
              <span class="home-v3-cta-sub">Avec un code partagé</span>
            </span>
            ${icon('arrow_right', { size: 18 })}
          </button>
        `}
      </div>

      <!-- ZONE 4 : Help mini-CTA -->
      <div class="home-v3-help">
        <button class="home-v3-help-btn" data-action="showHelp">
          ${icon('question', { size: 12 })} Comment jouer ?
        </button>
      </div>

      <p class="footer-info home-v3-footer">
        v0.9 · ${icon('bottle', { size: 12 })} Na zdrowie !
      </p>

      <div class="polska-sticker"></div>
    </section>
  `
}
