/**
 * Mood Picker — choix du style d'animation après le paywall shooter.
 * 4 presets visuels + 1 input libre pour custom.
 *
 * Quand l'utilisateur valide, le prompt complet est passé en callback.
 */

import { icon } from './icons.js'

// Mappage mood → prompt enrichi pour wan-2.2-i2v-fast
const MOOD_PROMPTS = {
  deglingo: {
    label: 'Déglingo',
    desc:  'Excité, foufou, gestes désordonnés',
    icon:  'sparkle',
    color: 'tram-red',
    prompt: 'A pixel art character portrait that goes wild and crazy. The character makes exaggerated facial expressions: wild grin, eyes wide open in excitement, head shaking energetically, mouth opens in a loud laugh, then a mischievous wink. Chaotic energetic movements, bouncy and wobbly. Pixel art style preserved throughout.',
  },
  determine: {
    label: 'Déterminé',
    desc:  'Sérieux, focus, regard intense',
    icon:  'star',
    color: 'tram-yellow',
    prompt: 'A pixel art character portrait that looks intensely focused and determined. The character has a serious confident face, slight nod of the head, narrowed eyes, tight jaw, then a small confident smirk. Subtle but powerful movements, head turning slightly. Pixel art style preserved throughout.',
  },
  appere: {
    label: 'Apeuré',
    desc:  'Inquiet, tremble, regard nerveux',
    icon:  'alert',
    color: 'tram-yellow',
    prompt: 'A pixel art character portrait that looks scared and anxious. The character has wide nervous eyes, glances around quickly, slight head tremble, biting lip, occasional gulp. Trembling subtle movements, looking left and right nervously. Pixel art style preserved throughout.',
  },
  fou: {
    label: 'Fou',
    desc:  'Hilare, rires, complètement parti',
    icon:  'heart',
    color: 'tram-red',
    prompt: 'A pixel art character portrait laughing uncontrollably and going completely insane. The character bursts into hysterical laughter, mouth wide open, head thrown back, then a manic grin, eyes rolling. Chaotic laughing movements, head shaking with laughter. Pixel art style preserved throughout.',
  },
}

/**
 * Ouvre le mood picker.
 * @param {Function} onConfirm — callback({ moodKey, prompt }) quand l'utilisateur valide
 */
export function openMoodPicker(onConfirm) {
  const root = document.getElementById('modal-root')

  root.innerHTML = `
    <div class="modal show">
      <div class="mood-modal-box">

        <div class="mood-header">
          <div class="mood-title">
            ${icon('sparkle', { size: 16 })} CHOISIS TON VIBE
          </div>
          <p class="mood-subtitle">Comment tu veux que ton avatar bouge ?</p>
        </div>

        <div class="mood-grid">
          ${Object.entries(MOOD_PROMPTS).map(([key, m]) => `
            <div class="mood-card mood-card--${m.color}" data-mood="${key}">
              <div class="mood-card-icon">${icon(m.icon, { size: 24 })}</div>
              <div class="mood-card-label">${m.label}</div>
              <div class="mood-card-desc">${m.desc}</div>
            </div>
          `).join('')}
        </div>

        <div class="mood-custom">
          <div class="mood-or">— ou —</div>
          <label class="mood-custom-label">
            ${icon('star', { size: 12 })} Décris toi-même
          </label>
          <input
            type="text"
            id="mood-custom-input"
            class="input mood-custom-input"
            placeholder="ex: drôle et timide en même temps"
            maxlength="80"
          />
        </div>

        <div class="mood-actions">
          <button class="btn btn-ghost btn-sm" id="mood-cancel-btn">Annuler</button>
          <button class="btn btn-red" id="mood-confirm-btn" disabled>
            ${icon('check', { size: 16 })} Générer
          </button>
        </div>

      </div>
    </div>
  `

  let selectedMood   = null
  let customText     = ''
  const confirmBtn   = document.getElementById('mood-confirm-btn')
  const customInput  = document.getElementById('mood-custom-input')

  // Sélection d'un preset
  document.querySelectorAll('.mood-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('selected'))
      card.classList.add('selected')
      selectedMood = card.dataset.mood
      customInput.value = ''
      customText = ''
      confirmBtn.disabled = false
    })
  })

  // Saisie custom
  customInput?.addEventListener('input', (e) => {
    customText = e.target.value.trim()
    if (customText.length >= 3) {
      document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('selected'))
      selectedMood = null
      confirmBtn.disabled = false
    } else {
      confirmBtn.disabled = !selectedMood
    }
  })

  // Validation
  confirmBtn.addEventListener('click', () => {
    let prompt
    let moodKey

    if (customText.length >= 3) {
      moodKey = 'custom'
      prompt  = `A pixel art character portrait expressing the following mood: ${customText}. The character makes natural facial expressions and head movements that match this mood. Pixel art style preserved throughout.`
    } else if (selectedMood) {
      moodKey = selectedMood
      prompt  = MOOD_PROMPTS[selectedMood].prompt
    } else {
      return
    }

    closeMoodPicker()
    onConfirm({ moodKey, prompt })
  })

  document.getElementById('mood-cancel-btn')?.addEventListener('click', closeMoodPicker)
}

export function closeMoodPicker() {
  const root = document.getElementById('modal-root')
  if (root) root.innerHTML = ''
}
