/**
 * Écran d'accueil — Varsovie Édition
 */

import { bgVarsovieHtml, floatingItemsHtml } from '../ui/varsovie.js'
import { icon } from '../ui/icons.js'

export function renderHome() {
  return `
    <section class="screen home-screen">
      ${bgVarsovieHtml()}
      ${floatingItemsHtml()}

      <div class="title-game-stack">
        <div class="title-bingo">BINGO</div>
        <div class="title-sante">SANTÉ!</div>
        <div class="subtitle-banner">VARSOVIE ÉDITION</div>
      </div>

      <div style="height: 24px;"></div>

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
        v0.7 · ${icon('bottle', { size: 14 })} Na zdrowie !
      </p>

      <div class="polska-sticker"></div>
    </section>
  `
}
