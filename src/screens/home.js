/**
 * Écran d'accueil
 * Hiérarchie : titre → identité (avec avatar Déglingo) → actions → liens discrets
 */

import { state }        from '../state.js'
import { bgVarsovieHtml, floatingItemsHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'
import { avatarLayersHtml } from '../ui/avatar.js'
import { getActiveGame } from '../activeGame.js'
import { loadHistory, formatRelativeTime } from '../utils/gameHistory.js'
import { escapeHtml }    from '../utils/html.js'

export function renderHome() {
  const profile    = state.userProfile
  const hasAccount = !!state.accountKey
  const active     = getActiveGame()
  const history    = loadHistory().filter(h => !active || h.code !== active.code)
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
            <button class="home-v3-mini-account home-v3-mini-souvenirs" data-action="showSouvenirs" title="Souvenirs">
              ${icon('download', { size: 14 })}
            </button>
            <button class="home-v3-mini-account" data-action="editHomeAvatar" title="Modifier mon avatar">
              ${icon('gear', { size: 14 })}
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

      <!-- Historique : tes dernières parties terminées (max 5) -->
      ${history.length > 0 ? `
        <div class="home-v3-history">
          <div class="home-v3-history-title">
            ${icon('trophy', { size: 12 })} TES DERNIÈRES PARTIES
          </div>
          <div class="home-v3-history-list">
            ${history.map(h => `
              <div class="home-v3-history-card" data-action="viewHistoryGame" data-history-code="${escapeHtml(h.code)}">
                <div class="home-v3-history-info">
                  <div class="home-v3-history-name">${escapeHtml(h.name)}</div>
                  <div class="home-v3-history-meta">
                    <span class="home-v3-history-code">${escapeHtml(h.code)}</span>
                    ${h.isMJ ? `<span class="home-v3-history-mj">MJ</span>` : ''}
                    <span class="home-v3-history-date">${formatRelativeTime(h.endedAt)}</span>
                  </div>
                </div>
                <div class="home-v3-history-arrow">${icon('arrow_right', { size: 14 })}</div>
                <button class="home-v3-history-remove" data-action="removeHistoryGame" data-history-code="${escapeHtml(h.code)}" title="Retirer de l'historique">
                  ${icon('cross', { size: 12 })}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- ZONE 4 : Help + Hall of Fame mini-CTAs (au-dessus du skyline) -->
      <div class="home-v3-help home-v3-help-top">
        <button class="home-v3-help-btn" data-action="showHelp">
          ${icon('question', { size: 14 })} Comment jouer ?
        </button>
        <button class="home-v3-help-btn" data-action="showHallOfFame">
          ${icon('trophy', { size: 14 })} Hall of Fame
        </button>
      </div>

      <p class="footer-info home-v3-footer">
        v0.9 · ${icon('bottle', { size: 12 })} Na zdrowie !
      </p>

      ${hasAccount ? `
        <button class="home-v3-account-corner" data-nav="account" title="Mon compte">
          ${icon('user', { size: 16 })}
        </button>
      ` : ''}

      <div class="polska-sticker"></div>
    </section>
  `
}
