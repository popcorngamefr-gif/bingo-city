/**
 * Écran : créer une partie (mode MJ)
 */

export function renderCreate() {
  return `
    <section class="screen">
      <h2 class="title-screen">★ Nouvelle partie ★</h2>

      <div class="frame frame-wood" style="margin-bottom: 16px;">
        <div class="content">
          <div style="font-family: 'Press Start 2P', monospace; font-size: 11px; color: var(--ink); margin-bottom: 8px;">
            Tu seras le MJ
          </div>
          <p class="small mb">Tu choisis les objets à trouver, puis tu joues comme tout le monde.</p>

          <label class="label">Nom de la partie</label>
          <input class="input mb" id="game-name-input" placeholder="ex: Soirée Bastille" maxlength="30">

          <label class="label">Ton pseudo</label>
          <input class="input" id="creator-name-input" placeholder="ex: Tristan" maxlength="15">
        </div>
      </div>

      <div class="row">
        <button class="btn btn-ghost btn-sm" data-nav="home">← Retour</button>
        <button class="btn btn-orange" data-action="createGame">Créer →</button>
      </div>
    </section>
  `
}
