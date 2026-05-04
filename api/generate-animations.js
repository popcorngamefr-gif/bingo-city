/**
 * POST /api/generate-animations
 * Lance 3 prédictions rd-animation en parallèle.
 * Input : imageBase64 (l'avatar pixel art déjà généré)
 * Output : { ids: { idle, sad, laugh } }
 *
 * Les 3 GIFs :
 *  - idle  : loop neutre + clin d'œil (rd_advanced_animation__idle)
 *  - sad   : triste + colère (custom_action)
 *  - laugh : rire + hyper heureux (custom_action)
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64 } = req.body ?? {}
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 requis' })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN manquant' })

  const BASE_URL = 'https://api.replicate.com/v1/models/retro-diffusion/rd-animation/predictions'
  const HEADERS  = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
    'Prefer':        'respond-async',
  }

  // Dimensions 48x48 — seule taille supportée par les advanced animations
  const BASE = {
    width:       48,
    height:      48,
    input_image: imageBase64,
  }

  const ANIMATIONS = {
    idle: {
      prompt:       'pixel art character portrait, neutral expression, calm idle loop',
      prompt_style: 'rd_advanced_animation__idle',
    },
    sad: {
      prompt:       'pixel art character portrait, sad crying then furious rage expression',
      prompt_style: 'rd_advanced_animation__custom_action',
    },
    laugh: {
      prompt:       'pixel art character portrait, laughing out loud, extremely happy and joyful',
      prompt_style: 'rd_advanced_animation__custom_action',
    },
  }

  try {
    const requests = Object.entries(ANIMATIONS).map(([key, anim]) =>
      fetch(BASE_URL, {
        method:  'POST',
        headers: HEADERS,
        body:    JSON.stringify({ input: { ...BASE, ...anim } }),
      })
      .then(r => r.json())
      .then(p => {
        console.log(`Animation ${key} started:`, p.id, p.error || '')
        return { key, id: p.id || null, error: p.detail || p.error || null }
      })
      .catch(err => ({ key, id: null, error: err.message }))
    )

    const results = await Promise.all(requests)
    const ids = {}
    results.forEach(({ key, id, error }) => { ids[key] = { id, error } })

    res.json({ ids })

  } catch (err) {
    console.error('generate-animations error:', err)
    res.status(500).json({ error: err.message })
  }
}
