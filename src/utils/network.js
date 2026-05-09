/**
 * Helpers réseau — timeouts, détection online/offline.
 *
 * En 4G mobile, un fetch sans timeout peut pendre indéfiniment quand le
 * réseau lâche : on enveloppe les appels dans un AbortController pour
 * garantir un échec rapide et lisible.
 */

/**
 * fetch() avec timeout. Lève une Error('timeout') au-delà de `ms`.
 * Le AbortController est aussi exposé pour permettre une annulation manuelle
 * (rarement utile, on garde l'API simple).
 */
export function fetchWithTimeout(url, opts = {}, ms = 15000) {
  const ctrl   = new AbortController()
  const timer  = setTimeout(() => ctrl.abort(), ms)
  const signal = opts.signal || ctrl.signal
  return fetch(url, { ...opts, signal })
    .catch(err => {
      if (err.name === 'AbortError') throw new Error('timeout')
      throw err
    })
    .finally(() => clearTimeout(timer))
}

/**
 * Promise.race avec un timeout. Si la promesse `p` ne résout pas avant `ms`,
 * la promesse retournée rejette avec Error('timeout'). Utile pour les SDK
 * Firebase qui n'exposent pas d'AbortController.
 */
export function withTimeout(p, ms, label = 'timeout') {
  let timer
  const t = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), ms)
  })
  return Promise.race([p, t]).finally(() => clearTimeout(timer))
}

/**
 * État online/offline observable. On expose un singleton qui agrège le
 * navigator.onLine et notifie les abonnés. Utile pour afficher un bandeau
 * persistant et un toast au passage offline → online.
 */
const _listeners = new Set()
let _online = typeof navigator !== 'undefined' ? navigator.onLine : true

export function isOnline() { return _online }

export function onConnectivityChange(cb) {
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}

export function initConnectivityWatcher() {
  if (typeof window === 'undefined') return
  const update = () => {
    const next = navigator.onLine
    if (next === _online) return
    _online = next
    _listeners.forEach(cb => { try { cb(_online) } catch {} })
  }
  window.addEventListener('online',  update)
  window.addEventListener('offline', update)
}
