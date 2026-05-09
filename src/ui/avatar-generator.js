/**
 * Avatar Generator — Selfie → Pixel Art via Replicate fofr/face-to-many
 * Fix iOS : clic synchrone via openCamera()
 */

import { state }      from '../state.js'
import { navigate }   from '../router.js'
import { icon }       from './icons.js'
import { openCamera } from './modal.js'
import { fetchWithTimeout } from '../utils/network.js'

const POLL_MS = 2500

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

function _resizeAndSend(dataUrl) {
  _setLoading('Préparation de la photo…')
  const img = new Image()
  img.onload = () => {
    const MAX    = 512
    const canvas = document.createElement('canvas')
    const ratio  = Math.min(MAX / img.width, MAX / img.height)
    canvas.width  = Math.round(img.width  * ratio)
    canvas.height = Math.round(img.height * ratio)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    _start(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
  }
  img.src = dataUrl
}

async function _start(base64) {
  _setLoading("Patiente… dans quelques secondes tu auras un visage de déglingo !")
  try {
    // 30s : l'API encode l'image en base64 + requête Replicate, peut prendre du temps en 4G
    const res = await fetchWithTimeout('/api/start-generation', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageBase64: base64 }),
    }, 30000)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.error || `HTTP ${res.status}`)
    }
    const { id } = await res.json()
    _poll(id, 0)
  } catch (err) {
    _setError(err.message === 'timeout' ? 'Réseau trop lent, réessaie' : err.message)
  }
}

function _poll(id, n) {
  if (n > 40) { _setError('Délai dépassé, réessaie'); return }
  setTimeout(async () => {
    try {
      const data = await fetchWithTimeout(`/api/check-generation?id=${id}`, {}, 10000).then(r => r.json())
      if      (data.status === 'succeeded') _showResult(data.url)
      else if (data.status === 'failed')    _setError(data.error || 'Génération échouée')
      else {
        const msgs = [
        "Patiente… dans quelques secondes tu auras un visage de déglingo !",
        "L'IA retravaille tes pixels…",
        "Dernière couche de pixels…",
        "C'est presque toi… mais en mieux !",
      ]
        _setLoading(msgs[Math.min(Math.floor(n / 5), msgs.length - 1)])
        _poll(id, n + 1)
      }
    } catch { _poll(id, n + 1) }
  }, POLL_MS)
}

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
  document.getElementById('gen-accept-btn')?.addEventListener('click', async () => {
    // Pose tout de suite l'URL Replicate dans le state pour que la transition soit fluide
    state.myAvatar.generatedImageUrl = url
    closeGeneratorModal()
    navigate('avatar-pick')

    // En tâche de fond : mirror vers Firebase Storage pour avoir une URL stable
    // (les URLs replicate.delivery expirent en ~24h)
    if (state.uid && state.uid !== 'me') {
      try {
        const { uploadAvatarImage } = await import('../firebase/storage.js')
        const stableUrl = await uploadAvatarImage(state.uid, url)
        state.myAvatar.generatedImageUrl = stableUrl
        // Sync au profil pour persister l'URL Storage (et plus l'URL Replicate)
        const { saveProfile } = await import('../firebase/auth.js')
        await saveProfile({
          name:   state.myName || state.accountKey || 'Anonyme',
          avatar: state.myAvatar,
        }).catch(err => console.warn('saveProfile after mirror failed:', err))
        console.log('[avatar] mirrored to Storage:', stableUrl)
      } catch (err) {
        // Non-bloquant : on garde l'URL Replicate (marche pour la session courante)
        console.warn('[avatar] mirror to Storage failed, keeping Replicate URL:', err)
      }
    }
  })
  document.getElementById('gen-retry-btn')?.addEventListener('click', openGeneratorModal)
  document.getElementById('gen-sprites-btn')?.addEventListener('click', () => {
    delete state.myAvatar.generatedImageUrl
    closeGeneratorModal()
  })
}

function _setLoading(msg) {
  const root = document.getElementById('modal-root')
  if (!root) return
  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box">
        <div style="padding:32px;text-align:center;">
          <div class="gen-pixel-spinner"></div>
          <div class="gen-loading-msg">${msg}</div>
          <div class="small" style="color:var(--ink-soft);margin-top:10px;">~20 secondes</div>
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
          <div class="gen-loading-msg" style="animation:none;font-size:9px;">${msg}</div>
          <div class="row mt">
            <button class="btn btn-cream btn-sm" id="gen-cancel-btn">Fermer</button>
            <button class="btn btn-red btn-sm" id="gen-retry-btn">
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
            <div class="gen-camera-icon">${icon('selfie', { size: 80 })}</div>
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
