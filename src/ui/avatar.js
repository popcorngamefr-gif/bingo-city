/**
 * Composant Avatar — version animée + expressions étendues
 *
 * MOODS :
 *   - idle      : respire, sourire neutre (timid/confident/proud selon score)
 *   - walk      : marche, sourire
 *   - hop       : petit saut, bouche o
 *   - jump      : saute haut, bouche O large
 *   - dance     : danse, sourire largement
 *   - sad       : triste, U inversé + larme
 *   - excited   : excité, sourire :D
 *   - sweat     : transpire (pendant IA), goutte de sueur
 *   - heartbeat : bat avec son cœur (proche bingo)
 *
 * EMOTES (bulles BD au-dessus de la tête) : !, ?, ★, ♥, etc.
 * SPARKLES : étoiles autour
 */

import { PORTRAIT } from '../data/portrait.js'
import { state }    from '../state.js'
import { safeVideo, FALLBACK_DATA_URI } from '../utils/media.js'

export function avatarHtml(av, opts = {}) {
  const { size = 'md', mood = 'idle', confidence = 'neutral', sparkles = false } = opts
  const layers = avatarLayers(av)
  const cls = `avatar ${size} mood-${mood} conf-${confidence}${sparkles ? ' has-sparkles' : ''}`
  return `<div class="${cls}">
    <div class="avatar-inner">
      ${layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')}
      <div class="layer mouth-layer" data-mouth>${mouthSvg(mood, confidence)}</div>
    </div>
    ${sparkles ? sparklesHtml() : ''}
  </div>`
}

export function avatarLayersHtml(av, mood = 'idle', confidence = 'neutral') {
  av = av || {}
  // 1. Vidéo Déglingo IA — priorise animationUrl (joueur en cours de partie),
  //    sinon state.myAnimation.url (mon propre avatar dans l'éditeur).
  //    En cas d'échec vidéo (réseau coupé, URL Replicate expirée), on retombe
  //    sur l'image statique via le poster + onerror du safeVideo.
  const videoUrl = av.animationUrl || state.myAnimation?.url
  if (videoUrl && (av?.generatedImageUrl || av?.animationUrl)) {
    return `
      <div class="layer generated-video">
        ${safeVideo(videoUrl, {
          posterUrl: av?.generatedImageUrl || '',
          extraStyle: 'width:100%;height:100%;object-fit:cover;image-rendering:pixelated;',
        })}
      </div>
    `
  }
  // 2. Image statique générée par face-to-many.
  //    On utilise un <img> plutôt qu'un background-image pour profiter de
  //    l'onerror : si l'URL Storage est inaccessible, on swap sur le placeholder.
  if (av?.generatedImageUrl) {
    const safeUrl = String(av.generatedImageUrl).replace(/"/g, '%22')
    return `
      <div class="layer generated-img">
        <img src="${safeUrl}" alt="" loading="lazy" decoding="async"
             style="width:100%;height:100%;object-fit:cover;image-rendering:pixelated;"
             onerror="this.onerror=null;this.src='${FALLBACK_DATA_URI}';this.classList.add('media-fallback');" />
      </div>
    `
  }
  // 3. Sprites classiques avec bouche SVG animée
  const layers = avatarLayers(av)
  return `${layers.map(src => `<div class="layer" style="background-image:url('${src}')"></div>`).join('')}
    <div class="layer mouth-layer" data-mouth>${mouthSvg(mood, confidence)}</div>`
}

export function avatarLayers(av) {
  // Fallback robuste si av est null, undefined, ou un objet vide
  av = av || {}
  const skin = PORTRAIT.skins[av.skin] || PORTRAIT.skins[0]
  const eyes = PORTRAIT.eyes[av.eyes] || PORTRAIT.eyes[0]
  const hairStyle = PORTRAIT.hairStyles[av.hairStyle] || PORTRAIT.hairStyles[0]
  const hairColor = hairStyle.colors[av.hairColor] || hairStyle.colors[0]
  const acc = av.acc != null ? PORTRAIT.accessories[av.acc] : null
  const layers = [skin.src, eyes.src, hairColor.src]
  if (acc && acc.src) layers.push(acc.src)
  return layers
}

/**
 * Génère le SVG bouche selon mood + confidence
 * confidence : 'timid' | 'neutral' | 'confident' | 'proud'
 *   - influence le sourire de base (idle/walk)
 */
function mouthSvg(mood, confidence = 'neutral') {
  const ink = '#2a2228'
  const cheek = '#e88080'
  let mouth = ''
  let extra = ''

  switch (mood) {
    case 'sad':
      mouth = `<path d="M 26 42 Q 32 38 38 42" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      extra = `<circle cx="42" cy="36" r="1.5" fill="#7a98b0" opacity="0.85"/>
               <circle cx="42" cy="40" r="1" fill="#7a98b0" opacity="0.6"/>`
      break

    case 'jump':
      mouth = `<ellipse cx="32" cy="42" rx="4" ry="5" fill="${ink}"/>
               <ellipse cx="32" cy="44" rx="2" ry="2" fill="#a02828"/>`
      break

    case 'hop':
      mouth = `<ellipse cx="32" cy="42" rx="2.5" ry="3" fill="${ink}"/>`
      break

    case 'dance':
      mouth = `<path d="M 25 40 Q 32 48 39 40 Z" fill="${ink}"/>
               <rect x="27" y="40" width="10" height="2" fill="white"/>`
      break

    case 'excited':
      mouth = `<path d="M 25 40 Q 32 48 39 40" stroke="${ink}" stroke-width="2" fill="${ink}" stroke-linecap="round"/>
               <rect x="27" y="40" width="10" height="2" fill="white"/>`
      break

    case 'sweat':
      // Bouche concentré + grosse goutte sur la tempe
      mouth = `<path d="M 28 42 L 36 42" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`
      extra = `<g class="sweat-drop">
                 <ellipse cx="46" cy="22" rx="2" ry="3" fill="#7ab0c8"/>
                 <ellipse cx="45" cy="21" rx="0.8" ry="1" fill="#c0e0e8"/>
               </g>`
      break

    case 'heartbeat':
      // Bouche o + petit cœur qui flotte
      mouth = `<ellipse cx="32" cy="41" rx="2" ry="2.5" fill="${ink}"/>`
      extra = `<g class="heart-float">
                 <path d="M 18 22 L 18 24 L 16 22 Q 14 20 16 18 Q 18 17 18 19 Q 18 17 20 18 Q 22 20 20 22 Z" fill="${cheek}"/>
                 <path d="M 18 22 L 18 24 L 16 22 Q 14 20 16 18 Q 18 17 18 19 Q 18 17 20 18 Q 22 20 20 22 Z" fill="#d04848" opacity="0.5"/>
               </g>`
      break

    case 'laugh':
      mouth = `<path d="M 22 38 Q 32 52 42 38 Z" fill="${ink}"/>
               <rect x="24" y="38" width="16" height="3" fill="white"/>
               <ellipse cx="32" cy="40" rx="6" ry="2" fill="#a02828" opacity="0.6"/>`
      extra = `<ellipse cx="20" cy="36" rx="4" ry="2.5" fill="${cheek}" opacity="0.65"/>
               <ellipse cx="44" cy="36" rx="4" ry="2.5" fill="${cheek}" opacity="0.65"/>`
      break

    case 'wink':
      // Bouche sourire + œil gauche fermé (trait horizontal)
      mouth = `<path d="M 26 40 Q 32 46 38 40" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      extra = `<line x1="20" y1="26" x2="28" y2="26" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
               <text x="20" y="26" font-size="0">wink</text>`
      break

    case 'rage':
      // Bouche serrée + sourcils en V
      mouth = `<path d="M 26 44 L 38 44" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
               <path d="M 27 46 L 30 44 M 37 46 L 34 44" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`
      extra = `<path d="M 18 20 L 28 24" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
               <path d="M 46 20 L 36 24" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`
      break

    case 'walk':
    case 'idle':
    default:
      // Sourire selon confidence
      if (confidence === 'timid') {
        mouth = `<path d="M 30 41 L 34 41" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`
      } else if (confidence === 'confident') {
        mouth = `<path d="M 27 40 Q 32 45 37 40" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      } else if (confidence === 'proud') {
        // Smirk asymétrique
        mouth = `<path d="M 26 41 Q 30 41 33 43 Q 36 45 39 41" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      } else {
        // neutral
        mouth = `<path d="M 28 41 Q 32 44 36 41" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      }
      break
  }

  // Joues rosées pour les moods chauds + confidence proud
  let cheeks = ''
  const warmMoods = ['jump', 'dance', 'excited', 'hop', 'heartbeat']
  if (warmMoods.includes(mood) || confidence === 'proud') {
    cheeks = `<ellipse cx="22" cy="38" rx="3" ry="2" fill="${cheek}" opacity="0.55"/>
              <ellipse cx="42" cy="38" rx="3" ry="2" fill="${cheek}" opacity="0.55"/>`
  }

  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="width:100%;height:100%;display:block;">
    ${cheeks}
    ${mouth}
    ${extra}
  </svg>`
}

function sparklesHtml() {
  return `
    <span class="spark spark-1">✦</span>
    <span class="spark spark-2">✧</span>
    <span class="spark spark-3">✦</span>
    <span class="spark spark-4">✧</span>
  `
}

/**
 * Update juste la bouche d'un avatar (sans toucher aux autres couches)
 */
export function updateMouth(el, mood, confidence = 'neutral') {
  if (!el) return
  const mouthLayer = el.querySelector('[data-mouth]')
  if (mouthLayer) mouthLayer.innerHTML = mouthSvg(mood, confidence)
}

/**
 * Calcule la confidence selon le ratio score actuel / score max possible
 * Ou selon le nombre de cellules validées
 */
export function calcConfidence(validated, total) {
  if (total === 0) return 'neutral'
  const ratio = validated / total
  if (ratio < 0.2) return 'timid'
  if (ratio < 0.6) return 'neutral'
  if (ratio < 0.85) return 'confident'
  return 'proud'
}

/**
 * Trigger un mood passager + sparkles + emote optionnelle
 */
export function triggerMood(el, mood, opts = {}) {
  if (!el) return
  const { duration = 600, emote = null, persist = false } = opts

  const allMoods = ['idle', 'walk', 'hop', 'jump', 'dance', 'sad', 'excited', 'sweat', 'heartbeat', 'laugh', 'wink', 'rage']
  allMoods.forEach(m => el.classList.remove(`mood-${m}`))
  el.classList.add(`mood-${mood}`)
  el.classList.add('has-sparkles')

  // Récupère la confidence actuelle pour la bouche
  const confClass = [...el.classList].find(c => c.startsWith('conf-')) || 'conf-neutral'
  const confidence = confClass.replace('conf-', '')
  updateMouth(el, mood, confidence)

  // Sparkles
  if (!el.querySelector('.spark')) {
    el.insertAdjacentHTML('beforeend', sparklesHtml())
  }

  // Emote bulle
  if (emote) showEmote(el, emote)

  // Auto-revert (sauf si persist)
  if (persist) return
  clearTimeout(el._moodTimeout)
  el._moodTimeout = setTimeout(() => {
    el.classList.remove(`mood-${mood}`)
    el.classList.remove('has-sparkles')
    el.classList.add('mood-idle')
    updateMouth(el, 'idle', confidence)
    el.querySelectorAll('.spark').forEach(s => s.remove())
  }, duration)
}

/**
 * Affiche une bulle d'emote au-dessus de l'avatar (BD style).
 * @param {HTMLElement} el
 * @param {String} content - peut être un caractère court (!?★) OU un nom d'icône SVG (robot, heart, star, exclam, question)
 */
export function showEmote(el, content) {
  if (!el || !content) return
  el.querySelectorAll('.emote-bubble').forEach(b => b.remove())

  const bubble = document.createElement('div')
  bubble.className = 'emote-bubble'

  // Si content est un nom d'icône connu, on charge le SVG depuis icons.js
  // (import dynamique pour éviter cycle)
  import('./icons.js').then(({ iconSvg, ICON_NAMES }) => {
    if (ICON_NAMES.includes(content)) {
      bubble.innerHTML = `<span class="emote-icon">${iconSvg(content)}</span>`
    } else {
      bubble.textContent = content
    }
  })

  el.appendChild(bubble)
  setTimeout(() => bubble.remove(), 1200)
}

/**
 * Démarre une boucle de clignements aléatoires
 */
export function startBlinkLoop(el) {
  if (!el) return () => {}
  let stopped = false
  const blink = () => {
    if (stopped) return
    el.classList.add('blinking')
    setTimeout(() => el.classList.remove('blinking'), 120)
    setTimeout(blink, 2000 + Math.random() * 3000)
  }
  setTimeout(blink, 1000 + Math.random() * 2000)
  return () => { stopped = true }
}

/**
 * Met à jour le niveau de confidence d'un avatar (et sa bouche au passage)
 */
export function setConfidence(el, confidence) {
  if (!el) return
  ;['timid', 'neutral', 'confident', 'proud'].forEach(c => el.classList.remove(`conf-${c}`))
  el.classList.add(`conf-${confidence}`)
  // Update la bouche si en idle
  const moodClass = [...el.classList].find(c => c.startsWith('mood-')) || 'mood-idle'
  const mood = moodClass.replace('mood-', '')
  if (mood === 'idle' || mood === 'walk') {
    updateMouth(el, mood, confidence)
  }
}
