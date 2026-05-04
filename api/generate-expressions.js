/**
 * POST /api/generate-expressions
 * Lance 5 prédictions Replicate en parallèle pour les expressions du visage.
 * Retourne { ids: { neutral, laugh, angry, wink, surprised } }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64 } = req.body ?? {}
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 requis' })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN manquant' })

  const VERSION = 'fofr/face-to-many:a07f252abbbd832009640b27f063ea52d87d7a23a185ca165bec23b5adc8deaf'
  const image   = `data:image/jpeg;base64,${imageBase64}`

  const BASE_PROMPT = 'pixel art portrait, 16-bit game character sprite, clean retro style, simple shading, readable details, polished look, no text, no extra elements'
  const BASE_INPUT  = {
    style:                  'Pixels',
    lora_scale:             1,
    negative_prompt:        'ugly, deformed, blurry, realistic, photo, text, watermark',
    prompt_strength:        4.5,
    denoising_strength:     0.65,
    instant_id_strength:    0.85,
    control_depth_strength: 0.8,
    number_of_images:       1,
    output_format:          'webp',
  }

  const EXPRESSIONS = {
    neutral:   'neutral expression, calm face, looking forward',
    laugh:     'laughing out loud, mouth wide open, eyes squinting, very happy and joyful',
    angry:     'angry face, frowning, furrowed eyebrows, grumpy expression',
    wink:      'winking with one eye, slight smile, playful expression',
    surprised: 'very surprised face, eyes wide open, mouth open in shock',
  }

  try {
    const requests = Object.entries(EXPRESSIONS).map(([key, exprPrompt]) =>
      fetch('https://api.replicate.com/v1/predictions', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
          'Prefer':        'respond-async',
        },
        body: JSON.stringify({
          version: VERSION,
          input:   { ...BASE_INPUT, image, prompt: `${BASE_PROMPT}, ${exprPrompt}` },
        }),
      })
      .then(r => r.json())
      .then(p => ({ key, id: p.id, error: p.detail || null }))
      .catch(err => ({ key, id: null, error: err.message }))
    )

    const results = await Promise.all(requests)
    const ids = {}
    results.forEach(({ key, id, error }) => {
      ids[key] = { id, error }
      if (error) console.warn(`Expression ${key} failed:`, error)
      else console.log(`Expression ${key} started:`, id)
    })

    res.json({ ids })

  } catch (err) {
    console.error('generate-expressions error:', err)
    res.status(500).json({ error: err.message })
  }
}
