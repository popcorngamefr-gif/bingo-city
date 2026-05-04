/**
 * Écran expressions-loading — redirige vers animations-loading
 * Gardé pour compatibilité router.
 */
import { navigate } from '../router.js'
export function renderExpressionsLoading() {
  navigate('animations-loading')
  return '<section class="screen"></section>'
}
