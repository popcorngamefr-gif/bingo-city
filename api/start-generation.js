/**
 * POST /api/start-generation
 * Lance une prédiction Replicate.
 *
 * Fix : utilise le format moderne /v1/predictions avec "model" dans le body,
 * au lieu de /v1/models/{owner}/{name}/predictions qui renvoie 404 si le
 * modèle n'a pas de déploiement public actif.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64 } = req.body
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 requis' })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN manquant' })

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'respond-async',
      },
      body: JSON.stringify({
        // Format moderne : "model" dans le body (pas dans l'URL)
        model: 'fofr/face-to-many',
        input: {
          image:            `data:image/jpeg;base64,${imageBase64}`,
          style:            'Pixel art',
          prompt:           'pixel art avatar portrait, game sprite, chibi, vivid colors, thick outlines, retro 64x64 character',
          negative_prompt:  'ugly, deformed, blurry, realistic, photo, text, watermark',
          number_of_images: 1,
          output_format:    'webp',
        },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Replicate error:', err)
      return res.status(502).json({ error: 'Replicate API error', detail: err })
    }

    const prediction = await response.json()
    res.json({ id: prediction.id })

  } catch (err) {
    console.error('start-generation error:', err)
    res.status(500).json({ error: err.message })
  }
}
