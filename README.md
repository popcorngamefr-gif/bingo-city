# 🍻 BINGO SANTÉ — Varsovie Édition (v0.6)

Le bingo urbain en pixel art pour groupes en voyage. Photographie les objets, l'IA valide, deviens le champion·ne du groupe.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build prod dans /dist
```

## Quoi de neuf en v0.6

- ✨ **Avatar vivant** : respire, cligne des yeux, saute, danse, marche en place selon le contexte
- 🎲 **Créateur simplifié** : 1 seul écran avec flèches `←` `→` + bouton Randomise
- 🤖 **Validation par IA** (mockée pour l'instant, prête pour Claude Vision)
- 🚮 **Plus de validation manuelle MJ** : tout est auto

## Animations avatar (moods)

L'avatar a différents états déclenchés selon le contexte :

| Mood | Quand | Effet |
|---|---|---|
| `idle` | Par défaut | Respire doucement |
| `walk` | HUD pendant le jeu | Marche en place (wobble + rotation) |
| `hop` | Changement dans le créateur | Petit saut + sparkles ✨ |
| `jump` | Photo validée | Saute haut |
| `dance` | Bingo gagné | Danse ! |
| `sad` | Photo refusée | Triste, ralenti, désaturé |
| `excited` | En attente de validation IA | Vibre |
| `blink` (auto) | Aléatoire toutes les 2-5s | Cligne des yeux |

Tout est en CSS pur, aucune nouvelle frame d'asset n'est nécessaire.

## Brancher la vraie IA Claude Vision

L'IA est actuellement **mockée** (random 80/20). Pour brancher Claude Vision en vrai :

1. **Créer une fonction Vercel serverless** dans `/api/validate-photo.js` :

```javascript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  const { objectName, photoBase64 } = req.body
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photoBase64 } },
        { type: 'text', text: `Cette photo contient-elle "${objectName}" ? Réponds UNIQUEMENT en JSON valide : { "valid": bool, "reason": "courte explication FR", "confidence": 0.0-1.0 }` }
      ]
    }]
  })
  res.json(JSON.parse(msg.content[0].text))
}
```

2. **Activer le mode live** dans `.env` :

```
VITE_USE_REAL_AI=1
ANTHROPIC_API_KEY=sk-ant-...
```

3. **Brancher la vraie caméra** dans `submitPhoto()` du `main.js` (voir TODO ci-dessous)

Coût estimé avec Claude Haiku 4.5 : **~0,1 centime par validation**, soit ~25 centimes pour une partie complète à 10 personnes.

## DA — "Varsovie 88"

Palette pastel froide inspirée de Varsovie : bétons communistes, brique vieille ville, façades colorées de Rynek, accents tram (rouge & jaune polonais).

- **Cards arrondies** crème + ombre 4px style retro game
- **Skyline pixel art** : Palais de la Culture + vieille ville + blocs communistes
- **Animations idle** : nuages, cigognes, tram qui passe, avatars qui respirent
- **Encre violet sombre** (`#2a2228`) au lieu de noir pur — plus chaud

## Architecture

```
src/
├── main.js              Entry — délégation + actions + mood triggers
├── state.js             State global (à remplacer par Firebase plus tard)
├── router.js            Navigation hash-based entre écrans
├── data/
│   ├── objects.js       3 catégories d'objets bingo (urbain/voyage/mémoire)
│   └── portrait.js      Config Portrait Generator
├── ui/
│   ├── avatar.js        Composant avatar + triggerMood() + startBlinkLoop()
│   ├── ai-validator.js  Validation IA (mock + branchement réel)
│   ├── toast.js         Notifications
│   └── varsovie.js      Skyline + tram + cigognes + items flottants
├── screens/             Un fichier par écran
└── styles/
    ├── main.css         Palette + base + ambiance
    └── ui.css           Composants + animations avatar
```

## Délégation d'événements

| Attribut | Effet |
|---|---|
| `data-action="X"` | Appelle `ACTIONS.X()` |
| `data-nav="X"` | Navigue vers l'écran X |
| `data-cycle="field:dir"` | Cycle un champ avatar (`-1` ou `+1`) |
| `data-toggle-obj="id"` | Sélectionne/désélectionne un objet (setup MJ) |
| `data-cell="N"` | Clic sur une cellule de bingo |

## Roadmap

- [x] V0.5 : refonte DA Varsovie + 3 catégories d'objets
- [x] **V0.6** : avatar vivant + créateur simplifié + IA mock
- [ ] V0.7 : Firebase Realtime DB pour la synchro multi-joueur
- [ ] V0.8 : capture photo réelle (`getUserMedia`)
- [ ] V0.9 : brancher Claude Vision pour de vrai
- [ ] V1.0 : PWA installable

---

🍻 **Na zdrowie !**
