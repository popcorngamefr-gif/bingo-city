/**
 * Modal appareil photo
 * Capture réelle via input file/camera.
 * Upload vers Firebase Storage en background.
 * Validation immédiate côté local.
 */

import { state }          from '../state.js'
import { show }           from '../router.js'
import { toast }          from './toast.js'
import { icon }           from './icons.js'
import { getObject }      from '../data/objects.js'
import { handleValidation } from '../controllers/gameController.js'
import { triggerHudAvatar } from '../controllers/avatarController.js'

// ─── Ouverture ───────────────────────────────────────────────────────────────

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

  // Input caméra caché
  const input    = document.createElement('input')
  input.type     = 'file'
  input.accept   = 'image/*'
  input.capture  = 'environment'

  input.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => _process(cellIdx, ev.target.result)
    reader.readAsDataURL(file)
  })

  document.getElementById('capture-btn')?.addEventListener('click', () => input.click())
}

// ─── Traitement ───────────────────────────────────────────────────────────────

function _process(cellIdx, dataUrl) {
  // 1. Stockage local immédiat (base64 → visible tout de suite)
  state.myPhotos[cellIdx] = dataUrl

  // 2. Ferme le modal, valide la cellule
  closeModal()
  state.currentPickingObj = null
  handleValidation(cellIdx)

  // 3. Upload Firebase Storage en arrière-plan
  //    Quand c'est prêt, on remplace le dataUrl par l'URL Storage
  if (state.gameCode && state.uid) {
    const cell = state.myGrid[cellIdx]
    import('../firebase/storage.js').then(({ uploadPhoto }) => {
      uploadPhoto(state.gameCode, state.uid, cellIdx, dataUrl, cell?.objId)
        .then(url => { state.myPhotos[cellIdx] = url })
        .catch(err => console.warn('Photo upload failed:', err))
    })
  }
}

// ─── Fermeture ────────────────────────────────────────────────────────────────

export function closeModal() {
  document.getElementById('modal-root').innerHTML = ''
}
