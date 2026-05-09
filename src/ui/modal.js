/**
 * Modal appareil photo
 * Fix iOS : input appendé au DOM, clic synchrone (pas de setTimeout).
 */

import { state }            from '../state.js'
import { show }             from '../router.js'
import { toast }            from './toast.js'
import { icon }             from './icons.js'
import { getObject }        from '../data/objects.js'
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
              <span>VISE &rarr; CAPTURE</span>
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
    openCamera('environment', (dataUrl) => _process(cellIdx, dataUrl))
  })
}

function _process(cellIdx, dataUrl) {
  state.myPhotos[cellIdx] = dataUrl
  closeModal()
  state.currentPickingObj = null
  handleValidation(cellIdx)

  // L'upload passe par photoQueue pour fiabilité : retry exponentiel,
  // persistance localStorage si échec, retry auto sur reconnexion réseau
  // ou au prochain reload. Voir src/utils/photoQueue.js.
  if (state.gameCode && state.uid && state.uid !== 'me') {
    import('../utils/photoQueue.js').then(({ enqueuePhoto }) => {
      const cell = state.myGrid[cellIdx]
      enqueuePhoto(cellIdx, dataUrl, cell?.objId)
    })
  }
}

export function closeModal() {
  document.getElementById('modal-root').innerHTML = ''
}

/**
 * Ouvre la caméra de façon compatible iOS.
 *
 * Règle iOS : l'input DOIT être dans le DOM ET .click() doit être appelé
 * de façon synchrone dans le handler du geste utilisateur (pas dans un
 * setTimeout/Promise, sinon Safari refuse).
 *
 * @param {'environment'|'user'|''} capture
 * @param {Function} onDataUrl — appelé avec le dataUrl une fois la photo prise
 */
export function openCamera(capture, onDataUrl) {
  const input    = document.createElement('input')
  input.type     = 'file'
  input.accept   = 'image/*'
  if (capture) input.capture = capture

  // iOS : doit être dans le DOM, avec des dimensions non nulles
  input.style.cssText = 'position:fixed;top:-200px;left:-200px;width:10px;height:10px;opacity:0;'
  document.body.appendChild(input)

  input.addEventListener('change', (e) => {
    document.body.removeChild(input)
    const file = e.target.files?.[0]
    if (!file) return
    const reader  = new FileReader()
    reader.onload = (ev) => onDataUrl(ev.target.result)
    reader.readAsDataURL(file)
  })

  // Synchrone — reste dans la chaîne du geste utilisateur
  input.click()
}
