export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64 } = req.body ?? {}
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 requis' })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN manquant' })

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        'Prefer':        'respond-async',
      },
      body: JSON.stringify({
        version: 'fofr/face-to-many:a07f252abbbd832009640b27f063ea52d87d7a23a185ca165bec23b5adc8deaf',
        input: {
          image:                  `data:image/jpeg;base64,${imageBase64}`,
          style:                  'Pixels',
          prompt:                 'Convert this selfie into a recognizable pixel art portrait.\n\nKeep the person\'s main facial features, hairstyle, expression, skin tone, and overall vibe clearly recognizable. Use a clean retro pixel art style, like a high-quality 16-bit character portrait. Keep the composition close to the original selfie, with simple shading, readable details, and a polished game-style look. No text, no extra elements, no distortion.',
          lora_scale:             1,
          negative_prompt:        '',
          prompt_strength:        4.5,
          denoising_strength:     0.65,
          instant_id_strength:    0.8,
          control_depth_strength: 0.8,
        },
      }),
    })

    const text = await response.text()
    console.log('Replicate response:', response.status, text.slice(0, 300))

    if (!response.ok) {
      return res.status(502).json({ error: 'Replicate error', status: response.status, detail: text })
    }

    const prediction = JSON.parse(text)
    res.json({ id: prediction.id })

  } catch (err) {
    console.error('start-generation error:', err)
    res.status(500).json({ error: err.message })
  }
}
