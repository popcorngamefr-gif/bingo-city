/**
 * POST /api/analyze-face
 * Claude Vision analyse la photo et retourne les paramètres du sprite avatar.
 * Plus simple, plus rapide et moins cher que Replicate.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { imageBase64 } = req.body ?? {}
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 requis' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquant dans Vercel' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 120,
        messages: [{
          role: 'user',
          content: [
            {
              type:   'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
            },
            {
              type: 'text',
              text: `Analyse le visage de cette personne et retourne un objet JSON qui correspond le mieux à son apparence. Options disponibles :

skin (0-8) : 0=très clair, 2=clair, 4=médium, 6=brun, 8=très foncé
eyes (0-6) : forme des yeux, choisis librement
hairStyle (0-14) : 0=court, 1=long, 2=bouclé, 3=crête, 4=lisse, 5=frange, 6=chignon, 7=tresses, 8=mohawk, 9=pompadour, 10=pixie, 11=carré, 12=mèche, 13=punk, 14=rasta
hairColor (0-6) : 0=noir, 1=brun foncé, 2=brun, 3=châtain, 4=blond, 5=blond clair, 6=roux
acc (0-14) : 0=aucun, 1=lunettes, 2=monocle, 3=casquette, 8=moustache, 9=barbe, sinon 0

Réponds UNIQUEMENT avec le JSON, sans texte autour :
{"skin":N,"eyes":N,"hairStyle":N,"hairColor":N,"acc":N}`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', response.status, err)
      return res.status(502).json({ error: 'Anthropic API error', detail: err })
    }

    const data = await response.json()
    const raw  = data.content?.[0]?.text?.trim() || '{}'

    // Nettoyage au cas où Claude ajoute des backticks
    const clean  = raw.replace(/```json?|```/g, '').trim()
    const avatar = JSON.parse(clean)

    // Validation des plages
    const result = {
      skin:      Math.min(8,  Math.max(0, parseInt(avatar.skin)      || 0)),
      eyes:      Math.min(6,  Math.max(0, parseInt(avatar.eyes)      || 0)),
      hairStyle: Math.min(14, Math.max(0, parseInt(avatar.hairStyle) || 0)),
      hairColor: Math.min(6,  Math.max(0, parseInt(avatar.hairColor) || 0)),
      acc:       Math.min(14, Math.max(0, parseInt(avatar.acc)       || 0)),
    }

    console.log('Face analyzed:', result)
    res.json({ avatar: result })

  } catch (err) {
    console.error('analyze-face error:', err)
    res.status(500).json({ error: err.message })
  }
}
