/**
 * POST /api/generate-animations
 * Lance 3 prédictions rd-animation en parallèle.
 *
 * IMPORTANT : sur Replicate, le paramètre est `style` (pas `prompt_style`).
 * Le style "idle" génère un cycle d'animation neutre — on varie le prompt.
 *
 * 3 GIFs : neutre+clin d'oeil, triste+colère, mort de rire
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

  // Sur Replicate, "style" est le seul param accepté pour rd-animation
  // Styles disponibles : four_angle_walking (48×48), idle (variable)
  // On utilise "idle" pour des animations de portrait centrées
  const BASE = {
    style:        'idle',
    width:        48,
    height:       48,
    input_image:  imageBase64,
  }

  const ANIMATIONS = {
    idle:  { prompt: 'pixel art portrait of a person, neutral face, calm expression with subtle wink' },
    sad:   { prompt: 'pixel art portrait of a person, sad and angry face, frowning, furious expression' },
    laugh: { prompt: 'pixel art portrait of a person, laughing very hard, mouth wide open, extremely happy' },
  }

  try {
    const requests = Object.entries(ANIMATIONS).map(([key, anim]) =>
      fetch(BASE_URL, {
        method:  'POST',
        headers: HEADERS,
        body:    JSON.stringify({ input: { ...BASE, ...anim } }),
      })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) {
          console.error(`Animation ${key} HTTP ${r.status}:`, JSON.stringify(data).slice(0, 300))
          return { key, id: null, error: data.detail || data.error || `HTTP ${r.status}` }
        }
        console.log(`Animation ${key} started:`, data.id)
        return { key, id: data.id || null, error: null }
      })
      .catch(err => {
        console.error(`Animation ${key} exception:`, err.message)
        return { key, id: null, error: err.message }
      })
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
