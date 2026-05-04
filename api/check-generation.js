export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id requis' })

  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return res.status(500).json({ error: 'REPLICATE_API_TOKEN manquant' })

  try {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (!response.ok) return res.status(502).json({ error: 'Replicate API error' })

    const prediction = await response.json()
    console.log('Prediction status:', prediction.status, 'output:', JSON.stringify(prediction.output))

    // output peut être un tableau, un string, ou null selon le modèle
    const output = prediction.output
    let url = null
    if (Array.isArray(output) && output.length > 0) {
      url = output[output.length - 1]  // dernier élément (souvent le meilleur)
    } else if (typeof output === 'string') {
      url = output
    }

    res.json({
      status: prediction.status,
      url,
      error: prediction.error ?? null,
    })
  } catch (err) {
    console.error('check-generation error:', err)
    res.status(500).json({ error: err.message })
  }
}
