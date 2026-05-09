/**
 * Helpers d'affichage robuste pour les images et vidéos.
 *
 * En 4G dégradée, une URL Storage / Replicate peut échouer (timeout, 403,
 * 404, CORS). On veut éviter le carré cassé du navigateur et afficher un
 * placeholder cohérent avec le style pixel-art du jeu.
 *
 * Stratégie : on génère un data-URI SVG (camera grise discrète) et on le
 * pose en src de fallback via onerror. Pas d'asset à embarquer, pas de
 * round-trip réseau quand la vraie image foire.
 */

import { escapeHtml } from './html.js'

/**
 * SVG camera pixel art en gris béton — réutilise la palette du jeu.
 * Conçu pour s'intégrer sans rupture (cellules bingo, miniatures galerie,
 * avatar profil). Le viewBox 16x16 garde l'esprit pixel.
 */
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">
  <rect width="16" height="16" fill="#ece4d4"/>
  <rect x="2" y="5" width="12" height="8" fill="#a8a6a0"/>
  <rect x="5" y="3" width="6" height="2" fill="#a8a6a0"/>
  <rect x="3" y="6" width="10" height="6" fill="#6a6a68"/>
  <rect x="6" y="7" width="4" height="4" fill="#a8a6a0"/>
  <rect x="7" y="8" width="2" height="2" fill="#5a4858"/>
  <rect x="11" y="6" width="1" height="1" fill="#d04848"/>
</svg>`

export const FALLBACK_DATA_URI = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(FALLBACK_SVG)

/**
 * Attribut HTML à coller sur un <img> pour afficher le fallback en cas
 * d'erreur. `this.onerror=null` empêche la boucle si même le fallback foire.
 */
export const IMG_FALLBACK_ATTR = `onerror="this.onerror=null;this.src='${FALLBACK_DATA_URI}';this.classList.add('media-fallback');"`

/**
 * Helpers pour générer un <img> tolérant aux pannes :
 *   safeImg(url, { alt, className })  → <img ... src="..." onerror="...">
 */
export function safeImg(url, { alt = '', className = '', loading = 'lazy', decoding = 'async', extraAttrs = '' } = {}) {
  const safeAlt = escapeHtml(alt)
  // Note : on n'utilise PAS escapeHtml pour l'URL car on veut juste neutraliser
  // les guillemets qui casseraient l'attribut. Les URLs Storage / Replicate
  // n'ont jamais d'esperluette HTML-significative.
  const safeUrl = String(url || '').replace(/"/g, '%22')
  const cls = className ? ` class="${escapeHtml(className)}"` : ''
  return `<img src="${safeUrl}" alt="${safeAlt}"${cls} loading="${loading}" decoding="${decoding}" ${extraAttrs} ${IMG_FALLBACK_ATTR} />`
}

/**
 * Génère un <video> tolérant aux pannes :
 *   - preload="metadata" pour ne pas saturer la 4G dès le rendu
 *   - poster en fallback (image fixe si fournie) pour avoir une preview tout de suite
 *   - onerror : remplace le <video> par un <img> de la photo profil si dispo,
 *     sinon par le placeholder pixel-art.
 */
export function safeVideo(url, { posterUrl = '', className = '', extraStyle = '' } = {}) {
  const safeUrl = String(url || '').replace(/"/g, '%22')
  const safePoster = posterUrl ? String(posterUrl).replace(/"/g, '%22') : ''
  const cls = className ? ` class="${escapeHtml(className)}"` : ''
  const style = extraStyle ? ` style="${escapeHtml(extraStyle)}"` : ''
  // En cas d'erreur vidéo : si on a un poster (image profil fixe), on swap
  // pour un <img> ; sinon on tombe sur le placeholder.
  const fallbackSrc = safePoster || FALLBACK_DATA_URI
  const onerror = `this.onerror=null;const i=document.createElement('img');i.src='${fallbackSrc}';i.className=this.className+' media-fallback';i.style.cssText=this.getAttribute('style')||'';this.replaceWith(i);`
  return `<video src="${safeUrl}"${cls}${style}
    autoplay loop muted playsinline preload="metadata"
    ${safePoster ? `poster="${safePoster}"` : ''}
    onerror="${onerror}"></video>`
}
