/**
 * Modal appareil photo
 * Fix iOS : input file appendé au DOM avant click.
 */

import { state }          from '../state.js'
import { show }           from '../router.js'
import { toast }          from './toast.js'
import { icon }           from './icons.js'
import { getObject }      from '../data/objects.js'
import { handleValidation } from '../controllers/gameController.js'

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

  document.getElementById('capture-btn')?.addEventListener('click', () => {
    _openCamera('environment', (dataUrl) => _process(cellIdx, dataUrl))
  })
}

function _process(cellIdx, dataUrl) {
  state.myPhotos[cellIdx] = dataUrl
  closeModal()
  state.currentPickingObj = null
  handleValidation(cellIdx)

  if (state.gameCode && state.uid) {
    import('../firebase/storage.js').then(({ uploadPhoto }) => {
      const cell = state.myGrid[cellIdx]
      uploadPhoto(state.gameCode, state.uid, cellIdx, dataUrl, cell?.objId)
        .then(url => { state.myPhotos[cellIdx] = url })
        .catch(err => console.warn('Photo upload failed:', err))
    })
  }
}

export function closeModal() {
  document.getElementById('modal-root').innerHTML = ''
}

// ─── Helper iOS-safe file input ───────────────────────────────────────────────
/**
 * Crée un input file, l'ajoute au DOM (requis iOS), déclenche le clic.
 * @param {'environment'|'user'|''} capture — caméra arrière, avant, ou choix
 * @param {Function} onFile — appelé avec le dataUrl résultant
 */
export function _openCamera(capture, onFile) {
  const input = document.createElement('input')
  input.type  = 'file'
  input.accept = 'image/*'
  if (capture) input.capture = capture
  // iOS exige que l'input soit dans le DOM pour que .click() fonctionne
  input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;width:1px;height:1px;'
  document.body.appendChild(input)

  input.addEventListener('change', (e) => {
    document.body.removeChild(input)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onFile(ev.target.result)
    reader.readAsDataURL(file)
  })

  // Petit délai requis sur iOS pour que le DOM soit prêt
  setTimeout(() => input.click(), 80)
}
