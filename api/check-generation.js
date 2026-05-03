/**
 * GET /api/check-generation?id={predictionId}
 * Poll le statut d'une prédiction Replicate.
 * Retourne { status, url? } — le client poll toutes les 2s jusqu'à succeeded/failed.
 */

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

    // Retourne seulement ce dont le client a besoin
    res.json({
      status: prediction.status,
      url:    prediction.output?.[0] ?? null,
      error:  prediction.error ?? null,
    })
  } catch (err) {
    console.error('check-generation error:', err)
    res.status(500).json({ error: err.message })
  }
}
