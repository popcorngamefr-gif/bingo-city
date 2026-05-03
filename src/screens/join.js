/**
 * Écran : rejoindre une partie via code
 */

export function renderJoin() {
  return `
    <section class="screen">
      <h2 class="title-screen">★ Rejoindre ★</h2>

      <div class="frame frame-wood" style="margin-bottom: 16px;">
        <div class="content">
          <div style="font-family: 'Press Start 2P', monospace; font-size: 10px; color: var(--ink); margin-bottom: 8px;">
            Code de la partie
          </div>
          <input class="input input-code" id="join-code-input" placeholder="XXXX" maxlength="4">
          <p class="small center mt">Demande le code au MJ</p>
        </div>
      </div>

      <div class="frame frame-wood" style="margin-bottom: 16px;">
        <div class="content">
          <label class="label">Ton pseudo</label>
          <input class="input" id="joiner-name-input" placeholder="ex: Marion" maxlength="15">
        </div>
      </div>

      <div class="row">
        <button class="btn btn-ghost btn-sm" data-nav="home">← Retour</button>
        <button class="btn btn-blue" data-action="joinGame">Rejoindre →</button>
      </div>
    </section>
  `
}
