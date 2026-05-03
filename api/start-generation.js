/**
 * POST /api/start-generation
 *
 * Fix : utilise le version hash explicite de fofr/face-to-many
 * au lieu du format "model:" qui retourne 404 pour ce modèle.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64 } = req.body ?? {}
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 requis' })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.error('REPLICATE_API_TOKEN not set')
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN manquant dans les variables Vercel' })
  }

  try {
    // Version hash stable de fofr/face-to-many (Pixel art style)
    const VERSION = 'a07f252abbbd832009640b27f063ea52d87d7a23a185d4fc29b54ad8b4be8bc1'

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'respond-async',
      },
      body: JSON.stringify({
        version: VERSION,
        input: {
          image:            `data:image/jpeg;base64,${imageBase64}`,
          style:            'Pixel art',
          prompt:           'pixel art avatar portrait, game sprite, chibi, vivid colors, thick outlines, 64x64 retro character',
          negative_prompt:  'ugly, deformed, blurry, realistic, photo, text, watermark',
          number_of_images: 1,
          output_format:    'webp',
        },
      }),
    })

    const text = await response.text()

    if (!response.ok) {
      console.error('Replicate error:', response.status, text)
      return res.status(502).json({
        error: 'Replicate API error',
        status: response.status,
        detail: text,
      })
    }

    const prediction = JSON.parse(text)
    console.log('Prediction started:', prediction.id)
    res.json({ id: prediction.id })

  } catch (err) {
    console.error('start-generation exception:', err)
    res.status(500).json({ error: err.message })
  }
}
