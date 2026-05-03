/**
 * Avatar Generator — Selfie → Pixel Art via Replicate
 * Pas d'emojis, SVG partout. Fix iOS : clic synchrone.
 */

import { state }       from '../state.js'
import { navigate }    from '../router.js'
import { icon }        from './icons.js'
import { openCamera }  from './modal.js'

const MAX_SIZE = 512
const POLL_MS  = 2000

export function openGeneratorModal() {
  document.getElementById('modal-root').innerHTML = _modalHtml()
  document.getElementById('gen-capture-btn')?.addEventListener('click', () => {
    openCamera('user', (dataUrl) => _resizeAndSend(dataUrl))
  })
  document.getElementById('gen-cancel-btn')?.addEventListener('click', closeGeneratorModal)
}

export function closeGeneratorModal() {
  document.getElementById('modal-root').innerHTML = ''
}

// ─── Resize ──────────────────────────────────────────────────────────────────

function _resizeAndSend(dataUrl) {
  _setLoading("Préparation de la photo…")
  const img  = new Image()
  img.onload = () => {
    const canvas  = document.createElement('canvas')
    const ratio   = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height)
    canvas.width  = Math.round(img.width  * ratio)
    canvas.height = Math.round(img.height * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    _startGeneration(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
  }
  img.src = dataUrl
}

// ─── API ─────────────────────────────────────────────────────────────────────

async function _startGeneration(base64) {
  _setLoading("L'IA dessine ta tête…")
  try {
    const res = await fetch('/api/start-generation', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageBase64: base64 }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { id } = await res.json()
    _poll(id, 0)
  } catch {
    _setError('Serveur injoignable')
  }
}

function _poll(id, n) {
  if (n > 30) { _setError('Délai dépassé, réessaie'); return }
  setTimeout(async () => {
    try {
      const data = await fetch(`/api/check-generation?id=${id}`).then(r => r.json())
      if      (data.status === 'succeeded') _showResult(data.url)
      else if (data.status === 'failed')    _setError(data.error || 'Génération échouée')
      else {
        const msgs = ["L'IA dessine ta tête…","Pixelisation…","Presque fini…","Derniers pixels…"]
        _setLoading(msgs[Math.min(Math.floor(n / 4), msgs.length - 1)])
        _poll(id, n + 1)
      }
    } catch { _poll(id, n + 1) }
  }, POLL_MS)
}

// ─── Résultat ─────────────────────────────────────────────────────────────────

function _showResult(url) {
  const root = document.getElementById('modal-root')
  if (!root) return
  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box gen-result-box">
        <div style="padding:16px;">
          <h3 class="modal-title">
            ${icon('sparkle', { size: 18 })} Ton avatar pixel art
          </h3>
          <div class="gen-result-img-wrap">
            <img src="${url}" alt="Avatar généré" class="gen-result-img" />
          </div>
          <div class="row mt">
            <button class="btn btn-cream btn-sm" id="gen-retry-btn">
              ${icon('retry', { size: 14 })} Réessayer
            </button>
            <button class="btn btn-red" id="gen-accept-btn">
              ${icon('check', { size: 16 })} Garder
            </button>
          </div>
          <button class="btn btn-ghost btn-sm mt" id="gen-sprites-btn">
            ${icon('arrow_left', { size: 14 })} Revenir aux sprites
          </button>
        </div>
      </div>
    </div>
  `
  document.getElementById('gen-accept-btn')?.addEventListener('click', () => {
    state.myAvatar.generatedImageUrl = url
    closeGeneratorModal()
    navigate('avatar-pick')
  })
  document.getElementById('gen-retry-btn')?.addEventListener('click', openGeneratorModal)
  document.getElementById('gen-sprites-btn')?.addEventListener('click', () => {
    delete state.myAvatar.generatedImageUrl
    closeGeneratorModal()
  })
}

// ─── États ───────────────────────────────────────────────────────────────────

function _setLoading(msg) {
  const root = document.getElementById('modal-root')
  if (!root) return
  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box">
        <div style="padding:32px;text-align:center;">
          <div class="gen-pixel-spinner"></div>
          <div class="gen-loading-msg">${msg}</div>
          <div class="small" style="color:var(--ink-soft);margin-top:10px;">~15 secondes</div>
        </div>
      </div>
    </div>
  `
}

function _setError(msg) {
  const root = document.getElementById('modal-root')
  if (!root) return
  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box">
        <div style="padding:24px;text-align:center;">
          <div style="width:48px;height:48px;margin:0 auto 14px;">
            ${icon('alert', { size: 48 })}
          </div>
          <div class="gen-loading-msg" style="animation:none;">${msg}</div>
          <div class="row mt">
            <button class="btn btn-cream btn-sm" id="gen-cancel-btn">Fermer</button>
            <button class="btn btn-red btn-sm"   id="gen-retry-btn">
              ${icon('retry', { size: 14 })} Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  document.getElementById('gen-cancel-btn')?.addEventListener('click', closeGeneratorModal)
  document.getElementById('gen-retry-btn')?.addEventListener('click', openGeneratorModal)
}

function _modalHtml() {
  return `
    <div class="modal show">
      <div class="modal-box">
        <div style="padding:16px;">
          <h3 class="modal-title">
            ${icon('scan', { size: 20 })} Ma tête en pixel art
          </h3>
          <div class="gen-camera-frame">
            <div class="gen-camera-icon">
              ${icon('selfie', { size: 80 })}
            </div>
            <div class="gen-camera-label">
              PRENDS UN SELFIE<br>L'IA PIXELISE TA TÊTE
            </div>
          </div>
          <p class="small center mb" style="color:var(--ink-soft);">
            Bonne lumière · Face caméra · Fond simple
          </p>
          <div class="row">
            <button class="btn btn-cream btn-sm" id="gen-cancel-btn">Annuler</button>
            <button class="btn btn-red" id="gen-capture-btn">
              ${icon('camera', { size: 18 })} Selfie
            </button>
          </div>
        </div>
      </div>
    </div>
  `
}
