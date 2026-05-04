/**
 * POST /api/generate-animations
 * Une seule prédiction wan-2.2-i2v-fast : ~5 sec de vidéo expressive.
 * Coût ~$0.05, pas de rate limit, output = MP4 URL.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageUrl, prompt } = req.body ?? {}
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl requis' })

  // Prompt par défaut si non fourni
  const finalPrompt = prompt || 'A pixel art character portrait that subtly comes to life. The face shifts naturally between expressions: a calm neutral look, a quick playful wink, then a wide joyful smile that becomes laughter. Subtle head movements. Pixel art style preserved throughout.'

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN manquant' })

  try {
    const r = await fetch(
      'https://api.replicate.com/v1/models/wan-video/wan-2.2-i2v-fast/predictions',
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
          'Prefer':        'respond-async',
        },
        body: JSON.stringify({
          input: {
            image:                  imageUrl,
            prompt:                 finalPrompt,
            go_fast:                true,
            num_frames:             81,
            resolution:             '480p',
            sample_shift:           12,
            frames_per_second:      16,
            interpolate_output:     false,
            lora_scale_transformer: 1,
          },
        }),
      }
    )

    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      console.error('wan-2.2-i2v-fast error:', r.status, JSON.stringify(data).slice(0, 400))
      return res.status(502).json({ error: data.detail || data.error || `HTTP ${r.status}` })
    }

    console.log('Animation started:', data.id)
    res.json({ id: data.id })

  } catch (err) {
    console.error('generate-animations exception:', err)
    res.status(500).json({ error: err.message })
  }
}
