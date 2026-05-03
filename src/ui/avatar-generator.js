/**
 * Avatar Generator — Selfie → Pixel Art via Replicate
 * Fix iOS : input appendé au DOM avant clic.
 */

import { state }           from '../state.js'
import { navigate }        from '../router.js'
import { toast }           from './toast.js'
import { _openCamera }     from './modal.js'

const MAX_SIZE = 512
const POLL_MS  = 2000

// ─── Entrée publique ─────────────────────────────────────────────────────────

export function openGeneratorModal() {
  const root = document.getElementById('modal-root')
  root.innerHTML = _modalHtml()

  document.getElementById('gen-capture-btn')?.addEventListener('click', () => {
    _openCamera('user', (dataUrl) => _resizeAndSend(dataUrl))
  })
  document.getElementById('gen-cancel-btn')?.addEventListener('click', closeGeneratorModal)
}

export function closeGeneratorModal() {
  document.getElementById('modal-root').innerHTML = ''
}

// ─── Redimensionnement ────────────────────────────────────────────────────────

function _resizeAndSend(dataUrl) {
  _setLoading('Redimensionnement…')
  const img = new Image()
  img.onload = () => {
    const canvas  = document.createElement('canvas')
    const ratio   = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height)
    canvas.width  = Math.round(img.width  * ratio)
    canvas.height = Math.round(img.height * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
    _startGeneration(base64)
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
    _pollResult(id)
  } catch (err) {
    _setError('Serveur injoignable')
  }
}

function _pollResult(id, attempts = 0) {
  if (attempts > 30) { _setError('Délai dépassé, réessaie'); return }
  setTimeout(async () => {
    try {
      const res  = await fetch(`/api/check-generation?id=${id}`)
      const data = await res.json()
      if (data.status === 'succeeded' && data.url) {
        _showResult(data.url)
      } else if (data.status === 'failed') {
        _setError(data.error || 'Génération échouée')
      } else {
        const msgs = ["L'IA dessine ta tête…", "Pixelisation…", "Presque fini…", "Derniers pixels…"]
        _setLoading(msgs[Math.min(Math.floor(attempts / 3), msgs.length - 1)])
        _pollResult(id, attempts + 1)
      }
    } catch { _pollResult(id, attempts + 1) }
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
          <h3 class="modal-title">✦ Ton avatar pixel art ✦</h3>
          <div class="gen-result-img-wrap">
            <img src="${url}" alt="Pixel art avatar" class="gen-result-img" />
          </div>
          <div class="row mt">
            <button class="btn btn-cream btn-sm" id="gen-retry-btn">↺ Réessayer</button>
            <button class="btn btn-red"          id="gen-accept-btn">✓ Garder</button>
          </div>
          <button class="btn btn-ghost btn-sm mt" id="gen-cancel-btn">Revenir aux sprites</button>
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
  document.getElementById('gen-cancel-btn')?.addEventListener('click', () => {
    delete state.myAvatar.generatedImageUrl
    closeGeneratorModal()
  })
}

// ─── États modal ──────────────────────────────────────────────────────────────

function _setLoading(msg) {
  const root = document.getElementById('modal-root')
  if (!root) return
  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box">
        <div style="padding:28px;text-align:center;">
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
          <div style="font-size:36px;margin-bottom:12px;">💥</div>
          <div class="gen-loading-msg" style="animation:none;">${msg}</div>
          <div class="row mt">
            <button class="btn btn-cream btn-sm" id="gen-cancel-btn">Fermer</button>
            <button class="btn btn-red btn-sm"   id="gen-retry-btn">Réessayer</button>
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
          <h3 class="modal-title">📷 Ma tête en pixel art</h3>
          <div class="gen-camera-frame">
            <div style="font-size:52px;margin-bottom:10px;">🤳</div>
            <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:var(--tram-yellow);text-align:center;line-height:1.8;">
              PRENDS UN SELFIE<br>L'IA PIXELISE TA TÊTE
            </div>
          </div>
          <p class="small center mb" style="color:var(--ink-soft);">
            Bonne lumière · Face caméra · Fond simple
          </p>
          <div class="row">
            <button class="btn btn-cream btn-sm" id="gen-cancel-btn">Annuler</button>
            <button class="btn btn-red" id="gen-capture-btn">📷 Selfie</button>
          </div>
        </div>
      </div>
    </div>
  `
}
