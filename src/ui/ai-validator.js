/**
 * AI Photo Validator
 *
 * MODE MOCK : simule une validation IA en attendant qu'on branche Claude Vision.
 * MODE LIVE  : appelle /api/validate-photo (Vercel serverless function) qui fait
 *              tourner Claude Vision côté serveur.
 *
 * Pour brancher la vraie API plus tard :
 *  1. Créer /api/validate-photo.js (Vercel serverless)
 *  2. Mettre VITE_USE_REAL_AI = '1' dans .env
 *  3. Tout le reste est déjà câblé.
 */

const USE_REAL_AI = import.meta.env?.VITE_USE_REAL_AI === '1'

/**
 * Valide une photo contre un nom d'objet attendu.
 *
 * @param {Object} args
 * @param {String} args.objectId    - identifiant interne ('pierogi', 'tram_red'...)
 * @param {String} args.objectName  - nom lisible ('Pierogi', 'Tram rouge')
 * @param {String} [args.photoBase64] - photo encodée en base64 (sans préfixe)
 * @returns {Promise<{ valid: boolean, reason: string, confidence: number }>}
 */
export async function validatePhotoAI({ objectId, objectName, photoBase64 }) {
  // Délai artificiel (simule le temps de réseau + IA, donne le temps de voir l'animation)
  await sleep(1200 + Math.random() * 800)

  if (USE_REAL_AI && photoBase64) {
    return callRealAI({ objectName, photoBase64 })
  }

  return mockValidation(objectName)
}

/**
 * MOCK : simule la validation avec un random pondéré.
 * 80% de chance que la photo soit acceptée, 20% qu'elle soit refusée.
 * Renvoie une raison plausible et un score de confiance.
 */
function mockValidation(objectName) {
  const isValid = Math.random() < 0.8
  const confidence = isValid ? 0.7 + Math.random() * 0.3 : 0.3 + Math.random() * 0.3

  if (isValid) {
    const reasons = [
      `${objectName} bien visible`,
      `Détecté avec certitude`,
      `Match confirmé`,
      `${objectName} reconnu`,
    ]
    return {
      valid: true,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      confidence,
    }
  } else {
    const reasons = [
      `Pas vraiment ${objectName}...`,
      `Image trop floue`,
      `Objet non identifié`,
      `Cadre ambigu`,
    ]
    return {
      valid: false,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      confidence,
    }
  }
}

/**
 * Appel réel à /api/validate-photo (Vercel serverless function)
 * À implémenter côté serveur avec Claude Vision (modèle haiku-4.5 idéalement).
 *
 * Exemple d'implémentation côté Vercel (à mettre dans /api/validate-photo.js) :
 *
 *   import Anthropic from '@anthropic-ai/sdk'
 *   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
 *
 *   export default async function handler(req, res) {
 *     const { objectName, photoBase64 } = req.body
 *     const msg = await client.messages.create({
 *       model: 'claude-haiku-4-5-20251001',
 *       max_tokens: 200,
 *       messages: [{
 *         role: 'user',
 *         content: [
 *           { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 } },
 *           { type: 'text', text: `Cette photo contient-elle "${objectName}" ? Réponds UNIQUEMENT en JSON : { "valid": bool, "reason": "courte explication FR", "confidence": 0.0-1.0 }` }
 *         ]
 *       }]
 *     })
 *     const text = msg.content[0].text
 *     res.json(JSON.parse(text))
 *   }
 */
async function callRealAI({ objectName, photoBase64 }) {
  try {
    const res = await fetch('/api/validate-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectName, photoBase64 }),
    })
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    return {
      valid: !!data.valid,
      reason: data.reason || (data.valid ? 'Validé' : 'Refusé'),
      confidence: data.confidence || 0,
    }
  } catch (err) {
    console.error('AI validation failed:', err)
    return {
      valid: false,
      reason: 'Erreur IA, réessaie',
      confidence: 0,
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
