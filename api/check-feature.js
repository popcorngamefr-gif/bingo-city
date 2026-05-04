/**
 * GET /api/check-feature?name=replicate
 * Retourne si une feature optionnelle est disponible (clé API configurée).
 */
export default function handler(req, res) {
  const { name } = req.query
  const features = {
    replicate: !!process.env.REPLICATE_API_TOKEN,
  }
  res.json({ available: features[name] ?? false })
}
