/**
 * Shooter Paywall
 * Fonctionnalité premium débloquée en offrant un shooter à quelqu'un.
 * Stocké en mémoire de session (reset à chaque partie).
 */

import { icon } from './icons.js'

// ─── État ─────────────────────────────────────────────────────────────────────
// Fonctionnalités débloquées cette session
const _unlocked = new Set()

export function isUnlocked(feature) {
  return _unlocked.has(feature)
}

export function unlock(feature) {
  _unlocked.add(feature)
}

// ─── Modal paywall ────────────────────────────────────────────────────────────

/**
 * Ouvre la pop-up paywall.
 * @param {string}   feature   — identifiant de la feature (ex: 'expressions')
 * @param {string}   title     — titre de la feature
 * @param {string}   desc      — description de ce qu'on débloque
 * @param {Function} onUnlock  — callback appelé quand l'utilisateur "paye"
 */
export function openShooterPaywall(feature, title, desc, onUnlock) {
  const root = document.getElementById('modal-root')

  root.innerHTML = `
    <div class="modal show">
      <div class="shooter-modal-box">

        <div class="shooter-header">
          <div class="shooter-title">
            ${icon('star', { size: 16 })} FONCTIONNALITÉ PREMIUM
          </div>
        </div>

        <div class="shooter-body">
          <div class="shooter-icon">🥃</div>
          <div class="shooter-desc">
            <strong style="color:var(--tram-yellow);">${title}</strong><br>
            ${desc}
          </div>
          <div class="shooter-cta">
            Pour débloquer cette fonctionnalité,<br>
            offre un shooter à quelqu'un !<br>
            <span style="color:var(--concrete);font-size:8px;">
              (sur l'honneur — on te fait confiance)
            </span>
          </div>
        </div>

        <div class="shooter-actions">
          <button class="btn btn-red" id="shooter-pay-btn">
            ${icon('bottle', { size: 18 })} J'ai offert mon shooter !
          </button>
          <button class="btn btn-ghost btn-sm" id="shooter-cancel-btn">
            Pas maintenant
          </button>
        </div>

      </div>
    </div>
  `

  document.getElementById('shooter-pay-btn')?.addEventListener('click', () => {
    unlock(feature)
    _closePaywall()
    onUnlock()
  })

  document.getElementById('shooter-cancel-btn')?.addEventListener('click', _closePaywall)
}

function _closePaywall() {
  document.getElementById('modal-root').innerHTML = ''
}
