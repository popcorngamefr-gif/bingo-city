/**
 * Mini-toast système
 */

let toastEl = null
let toastTimer = null

function ensureToast() {
  if (toastEl) return toastEl
  const root = document.getElementById('toast-root') || document.body
  toastEl = document.createElement('div')
  toastEl.className = 'toast'
  root.appendChild(toastEl)
  return toastEl
}

export function toast(msg, duration = 2200) {
  const el = ensureToast()
  el.textContent = msg
  el.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), duration)
}
