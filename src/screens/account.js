/**
 * Écran : gestion du compte Pseudo + PIN
 * Styles dans src/styles/screens.css
 */

import { state }        from '../state.js'
import { bgVarsovieHtml } from '../ui/varsovie.js'
import { icon }         from '../ui/icons.js'

export function renderAccount() {
  const hasAccount = !!state.accountKey

  return hasAccount ? _renderExistingAccount() : _renderAuthForm()
}

// ─── Pas encore de compte ────────────────────────────────────────────────────

function _renderAuthForm() {
  return `
    <section class="screen account-screen">
      ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.3 })}

      <button class="btn-back" data-nav="home">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ MON COMPTE ★</h2>

      <!-- Tabs -->
      <div class="account-tabs" id="account-tabs">
        <button class="account-tab active" data-tab="create">Créer</button>
        <button class="account-tab"        data-tab="login">Se connecter</button>
      </div>

      <!-- Panneau Créer -->
      <div class="account-panel" id="panel-create">
        <div class="card mb" style="position:relative;z-index:5;">
          <p class="small mb">Choisis un pseudo et un PIN à 4 chiffres pour retrouver ta progression sur n'importe quel appareil.</p>

          <label class="label">Pseudo</label>
          <input class="input mb" id="acc-pseudo-create" placeholder="ex: Marek26" maxlength="20" autocomplete="off" />
          <div class="pseudo-status" id="pseudo-status"></div>

          <label class="label">PIN (4 chiffres)</label>
          <div class="pin-row" id="pin-create-row">
            ${pinInputs('pin-create')}
          </div>

          <label class="label mt">Confirme le PIN</label>
          <div class="pin-row" id="pin-confirm-row">
            ${pinInputs('pin-confirm')}
          </div>
        </div>

        <div class="sticky-cta">
          <button class="btn btn-red" id="btn-create-account">
            ${icon('check', { size: 16 })} Créer mon compte
          </button>
        </div>
      </div>

      <!-- Panneau Connexion -->
      <div class="account-panel hidden" id="panel-login">
        <div class="card mb" style="position:relative;z-index:5;">
          <p class="small mb">Entre ton pseudo et ton PIN pour récupérer ta progression.</p>

          <label class="label">Pseudo</label>
          <input class="input mb" id="acc-pseudo-login" placeholder="ex: Marek26" maxlength="20" autocomplete="off" />

          <label class="label">PIN</label>
          <div class="pin-row" id="pin-login-row">
            ${pinInputs('pin-login')}
          </div>
        </div>

        <div class="sticky-cta">
          <button class="btn btn-yellow" id="btn-login-account">
            ${icon('arrow_right', { size: 16 })} Me connecter
          </button>
        </div>
      </div>
    </section>
  `
}

// ─── Compte existant ─────────────────────────────────────────────────────────

function _renderExistingAccount() {
  const p = state.userProfile || {}
  const s = p.stats || {}

  return `
    <section class="screen account-screen">
      ${bgVarsovieHtml({ withTram: false, withStorks: false, opacity: 0.3 })}

      <button class="btn-back" data-nav="home">${icon('arrow_left', { size: 16 })}</button>

      <h2 class="title-screen">★ MON COMPTE ★</h2>

      <div class="card mb" style="position:relative;z-index:5;">
        <div class="account-identity">
          <div class="account-pseudo">@${state.accountKey}</div>
          <div class="account-name">${p.name || '?'}</div>
        </div>

        <div class="account-stats-grid">
          <div class="stat-box">
            <div class="stat-val">${s.totalGames || 0}</div>
            <div class="stat-lbl">parties</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${s.totalScore || 0}</div>
            <div class="stat-lbl">points</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${s.bingos || 0}</div>
            <div class="stat-lbl">bingos</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${s.wins || 0}</div>
            <div class="stat-lbl">victoires</div>
          </div>
        </div>
      </div>

      <div class="card mb account-pin-recall" style="position:relative;z-index:5;">
        <div class="small mb" style="color:var(--ink-soft);">
          Pour te connecter sur un autre appareil :
        </div>
        <div class="account-code-row">
          <span class="account-code-label">Pseudo :</span>
          <strong class="account-code-val">@${state.accountKey}</strong>
        </div>
        <div class="account-code-row">
          <span class="account-code-label">PIN :</span>
          <strong class="account-code-val">••••</strong>
        </div>
      </div>

      <div class="sticky-cta">
        <button class="btn btn-ghost btn-sm" data-action="logoutAccount">
          Déconnecter ce compte
        </button>
      </div>
    </section>
  `
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pinInputs(prefix) {
  return [0, 1, 2, 3].map(i => `
    <input
      class="pin-digit"
      type="password"
      inputmode="numeric"
      maxlength="1"
      data-pin="${prefix}"
      data-idx="${i}"
      autocomplete="off"
    />
  `).join('')
}
