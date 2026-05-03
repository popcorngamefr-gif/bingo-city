/**
 * Écran d'accueil
 */

export function renderHome() {
  return `
    <section class="screen home-screen">
      <div class="stars-bg"></div>

      <h1 class="title-game">BINGO<br>CITY</h1>
      <p class="subtitle mt mb">★ Le bingo urbain pixel ★</p>

      <div class="stack" style="margin-top: 24px;">
        <button class="btn btn-orange btn-block" data-action="goCreate">
          🎯 Créer une partie
        </button>
        <button class="btn btn-blue btn-block" data-action="goJoin">
          🔗 Rejoindre
        </button>
      </div>

      <p class="small light center" style="margin-top: auto; padding-top: 24px; opacity: 0.6;">
        v0.3 — proto · ⚙ pour debug
      </p>
    </section>
  `
}
