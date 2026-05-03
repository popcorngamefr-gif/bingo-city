/**
 * Écran d'accueil — affiche le profil si déjà connecté
 */

import { state }        from '../state.js'
import { bgVarsovieHtml, floatingItemsHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'

export function renderHome() {
  const profile = state.userProfile
  const profileBadge = profile?.name ? `
    <div class="profile-badge">
      ${icon('user', { size: 14 })}
      <span>${profile.name}</span>
      ${profile.stats ? `<span class="profile-stats">★ ${profile.stats.totalScore || 0} pts · ${profile.stats.totalGames || 0} parties</span>` : ''}
    </div>
  ` : ''

  return `
    <section class="screen home-screen">
      ${bgVarsovieHtml()}
      ${floatingItemsHtml()}

      <div class="title-game-stack">
        <div class="title-bingo">BINGO</div>
        <div class="title-sante">SANTÉ!</div>
        <div class="subtitle-banner">VARSOVIE ÉDITION</div>
      </div>

      ${profileBadge}

      <div class="stack" style="padding: 0 6px; position: relative; z-index: 5;">
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
