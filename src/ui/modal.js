/**
 * Modal appareil photo
 * Capture une vraie photo (via input file/camera),
 * stockée en base64 dans state.myPhotos pour le récap de fin.
 * Pas d'IA — la validation est immédiate.
 */

import { state } from '../state.js'
import { show } from '../router.js'
import { toast } from './toast.js'
import { icon } from './icons.js'
import { getObject } from '../data/objects.js'
import { triggerHudAvatar, updateHudConfidence, checkHeartbeat } from '../controllers/avatarController.js'
import { checkBingo } from '../controllers/gameController.js'

// ─── Ouverture du modal ───────────────────────────────────────────────────────

export function openCameraModal(cellIdx) {
  state.currentPickingObj = cellIdx
  const obj  = getObject(state.myGrid[cellIdx].objId)
  const root = document.getElementById('modal-root')

  root.innerHTML = `
    <div class="modal show">
      <div class="modal-box">
        <div style="padding: 16px;">
          <h3 class="modal-title">
            ${icon('camera', { size: 20 })}
            <span>${obj.name}</span>
          </h3>
          <div class="camera-frame">
            <div class="camera-frame-inner">
              ${icon('camera', { size: 52 })}
              <span>VISE → CAPTURE</span>
            </div>
          </div>
          <p class="small center mb">La photo sera gardée pour le récap de fin.</p>
          <div class="row">
            <button class="btn btn-cream btn-sm" data-action="cancelPhoto">Annuler</button>
            <button class="btn btn-red btn-sm" id="capture-btn">
              ${icon('camera', { size: 16 })} Capturer
            </button>
          </div>
        </div>
      </div>
    </div>
  `

  // Input caméra caché — déclenché par le bouton "Capturer"
  const input = document.createElement('input')
  input.type    = 'file'
  input.accept  = 'image/*'
  input.capture = 'environment'

  input.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => _storeAndValidate(cellIdx, ev.target.result)
    reader.readAsDataURL(file)
  })

  document.getElementById('capture-btn').addEventListener('click', () => input.click())
}

// ─── Stockage + validation immédiate ─────────────────────────────────────────

function _storeAndValidate(cellIdx, dataUrl) {
  if (!state.myPhotos) state.myPhotos = {}
  state.myPhotos[cellIdx] = dataUrl

  const cell = state.myGrid[cellIdx]
  const obj  = getObject(cell.objId)

  cell.status = 'validated'

  const me = state.players.find(p => p.isYou)
  if (me) me.score = (me.score || 0) + (obj.points || 1)

  closeModal()
  state.currentPickingObj = null

  toast(`✓ ${obj.name} capturé ! +${obj.points} pts`)
  triggerHudAvatar('jump', { duration: 800, emote: 'star' })

  if (state.currentScreen === 'game') show('game')

  setTimeout(() => {
    updateHudConfidence()
    checkHeartbeat()
  }, 100)

  checkBingo()
}

// ─── Fermeture ────────────────────────────────────────────────────────────────

export function closeModal() {
  document.getElementById('modal-root').innerHTML = ''
}
