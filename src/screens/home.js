/**
 * Écran d'accueil
 */

import { state }        from '../state.js'
import { bgVarsovieHtml, floatingItemsHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'

export function renderHome() {
  const profile    = state.userProfile
  const hasAccount = !!state.accountKey

  const profileBadge = hasAccount ? `
    <div class="profile-badge" data-nav="account">
      ${icon('user', { size: 14 })}
      <span>@${state.accountKey}</span>
      ${profile?.stats ? `<span class="profile-stats">★ ${profile.stats.totalScore || 0} pts</span>` : ''}
    </div>
  ` : `
    <button class="btn btn-ghost btn-sm account-cta" data-nav="account">
      ${icon('user', { size: 14 })} Mon compte
    </button>
  `

  return `
    <section class="screen home-screen" style="padding-top: 20px;">
      ${bgVarsovieHtml()}
      ${floatingItemsHtml()}

      <div class="title-game-stack">
        <div class="title-bingo">BINGO</div>
        <div class="title-sante">SANTÉ!</div>
        <div class="subtitle-banner">VARSOVIE ÉDITION</div>
      </div>

      <div class="home-spacer"></div>

      <div class="stack home-actions">
        ${profileBadge}

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
      </div>

      <p class="footer-info">
        v0.8 · ${icon('bottle', { size: 14 })} Na zdrowie !
      </p>

      <div class="polska-sticker"></div>
    </section>
  `
}
