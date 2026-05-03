/**
 * Avatar Generator — Selfie → Pixel Art via Replicate
 *
 * Flow :
 *  1. openGeneratorModal()  — ouvre la modal + input caméra
 *  2. Selfie pris → redimensionné à 512px (Canvas)
 *  3. POST /api/start-generation → { id }
 *  4. Poll /api/check-generation?id= toutes les 2s
 *  5. Résultat affiché → user accepte ou réessaie
 */

import { state }    from '../state.js'
import { show }     from '../router.js'
import { toast }    from './toast.js'

const MAX_SIZE = 512   // px — redimensionné avant envoi
const POLL_MS  = 2000  // intervalle de polling

// ─── Entrée publique ─────────────────────────────────────────────────────────

export function openGeneratorModal() {
  const root = document.getElementById('modal-root')
  root.innerHTML = _modalHtml('ready')

  // Déclenche la caméra frontale dès l'ouverture
  const input   = document.createElement('input')
  input.type    = 'file'
  input.accept  = 'image/*'
  input.capture = 'user'        // caméra frontale

  input.addEventListener('change', (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    _resizeAndSend(file)
  })

  document.getElementById('gen-capture-btn')?.addEventListener('click', () => input.click())
  document.getElementById('gen-cancel-btn')?.addEventListener('click',  closeGeneratorModal)
}

export function closeGeneratorModal() {
  document.getElementById('modal-root').innerHTML = ''
}

// ─── Redimensionnement Canvas → base64 ───────────────────────────────────────

function _resizeAndSend(file) {
  _setState('loading', 'Redimensionnement…')
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ratio  = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height)
    canvas.width  = Math.round(img.width  * ratio)
    canvas.height = Math.round(img.height * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
    _startGeneration(base64)
  }
  img.src = URL.createObjectURL(file)
}

// ─── API calls ───────────────────────────────────────────────────────────────

async function _startGeneration(base64) {
  _setState('loading', "L'IA dessine votre tête…")
  try {
    const res  = await fetch('/api/start-generation', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageBase64: base64 }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { id } = await res.json()
    _pollResult(id)
  } catch (err) {
    console.error('start-generation error:', err)
    _setState('error', "Impossible de contacter le serveur")
  }
}

function _pollResult(id, attempts = 0) {
  if (attempts > 30) { _setState('error', 'Délai dépassé, réessaie'); return }

  setTimeout(async () => {
    try {
      const res  = await fetch(`/api/check-generation?id=${id}`)
      const data = await res.json()

      if (data.status === 'succeeded' && data.url) {
        _showResult(data.url)
      } else if (data.status === 'failed') {
        _setState('error', data.error || 'Génération échouée')
      } else {
        // starting | processing — on re-poll
        const msgs = [
          "L'IA dessine votre tête…",
          "Pixelisation en cours…",
          "Ajout des détails…",
          "Presque fini…",
        ]
        _setState('loading', msgs[Math.min(Math.floor(attempts / 3), msgs.length - 1)])
        _pollResult(id, attempts + 1)
      }
    } catch (err) {
      _pollResult(id, attempts + 1)   // retry silencieux sur erreur réseau
    }
  }, POLL_MS)
}

// ─── Affichage du résultat ───────────────────────────────────────────────────

function _showResult(url) {
  const root = document.getElementById('modal-root')
  if (!root) return

  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box gen-result-box">
        <div style="padding:16px;">
          <h3 class="modal-title">✦ Ton avatar pixel art ✦</h3>
          <div class="gen-result-img-wrap">
            <img src="${url}" alt="Pixel art avatar" class="gen-result-img" />
          </div>
          <div class="row mt">
            <button class="btn btn-cream btn-sm" id="gen-retry-btn">↺ Réessayer</button>
            <button class="btn btn-red" id="gen-accept-btn">✓ Garder</button>
          </div>
          <button class="btn btn-ghost btn-sm mt" id="gen-sprites-btn">
            Revenir aux sprites
          </button>
        </div>
      </div>
    </div>
  `

  document.getElementById('gen-accept-btn')?.addEventListener('click', () => {
    state.myAvatar.generatedImageUrl = url
    closeGeneratorModal()
    show('avatar')      // re-render l'écran avatar avec le nouveau look
    toast('Avatar mis à jour !')
  })

  document.getElementById('gen-retry-btn')?.addEventListener('click', () => {
    openGeneratorModal()
  })

  document.getElementById('gen-sprites-btn')?.addEventListener('click', () => {
    delete state.myAvatar.generatedImageUrl
    closeGeneratorModal()
    show('avatar')
  })
}

// ─── État de la modal ────────────────────────────────────────────────────────

function _setState(state, msg) {
  const root = document.getElementById('modal-root')
  if (!root) return

  if (state === 'loading') {
    root.innerHTML = `
      <div class="modal show">
        <div class="modal-box">
          <div style="padding:24px;text-align:center;">
            <div class="gen-pixel-spinner"></div>
            <div class="gen-loading-msg">${msg}</div>
            <div class="small" style="color:var(--ink-soft);margin-top:8px;">~15 secondes</div>
          </div>
        </div>
      </div>
    `
  } else if (state === 'error') {
    root.innerHTML = `
      <div class="modal show">
        <div class="modal-box">
          <div style="padding:20px;text-align:center;">
            <div style="font-size:32px;margin-bottom:12px;">💥</div>
            <div class="gen-loading-msg">${msg}</div>
            <div class="row mt">
              <button class="btn btn-cream btn-sm" id="gen-cancel-btn">Fermer</button>
              <button class="btn btn-red btn-sm" id="gen-retry-btn">Réessayer</button>
            </div>
          </div>
        </div>
      </div>
    `
    document.getElementById('gen-cancel-btn')?.addEventListener('click', closeGeneratorModal)
    document.getElementById('gen-retry-btn')?.addEventListener('click', openGeneratorModal)
  }
}

// ─── HTML de la modal initiale ────────────────────────────────────────────────

function _modalHtml() {
  return `
    <div class="modal show">
      <div class="modal-box">
        <div style="padding:16px;">
          <h3 class="modal-title">📷 Ma tête en pixel art</h3>
          <div class="gen-camera-frame">
            <div style="font-size:48px;margin-bottom:8px;">🤳</div>
            <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--tram-yellow);text-align:center;line-height:1.6;">
              PRENDS UN SELFIE<br>L'IA PIXELISE TA TÊTE
            </div>
          </div>
          <p class="small center mb" style="color:var(--ink-soft);">
            Bonne lumière, face à la caméra, fond simple = meilleur résultat
          </p>
          <div class="row">
            <button class="btn btn-cream btn-sm" id="gen-cancel-btn">Annuler</button>
            <button class="btn btn-red" id="gen-capture-btn">
              📷 Selfie
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}
