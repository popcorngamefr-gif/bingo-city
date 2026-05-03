# 🍻 BINGO SANTÉ — Varsovie Édition

Le bingo urbain en pixel art pour groupes en voyage. Photographie les objets, valide les défis, deviens le champion·ne du groupe.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build prod dans /dist
```

## Déploiement Vercel

```bash
npm i -g vercel       # une seule fois
vercel                # première fois (login + setup)
vercel --prod         # déploiements suivants
```

Vercel auto-détecte Vite. Aucune config nécessaire.

## DA — "Varsovie 88"

Palette pastel froide inspirée de Varsovie : bétons communistes, brique vieille ville, façades colorées de Rynek, accents tram (rouge & jaune polonais).

- **Cards arrondies** crème + ombre 4px style retro game
- **Skyline pixel art** : Palais de la Culture + vieille ville + blocs communistes
- **Animations idle** : nuages, cigognes, tram qui passe, avatars qui respirent
- **Encre violet sombre** (`#2a2228`) au lieu de noir pur — plus chaud

## Architecture

```
src/
├── main.js              Entry — délégation d'événements + init
├── state.js             State global (à remplacer par Firebase plus tard)
├── router.js            Navigation hash-based entre écrans
├── data/
│   ├── objects.js       3 catégories d'objets bingo (urbain/voyage/mémoire)
│   └── portrait.js      Config Portrait Generator
├── ui/
│   ├── avatar.js        Composant avatar (rendu en couches)
│   ├── toast.js         Notifications
│   └── varsovie.js      Skyline + tram + cigognes + items flottants
├── screens/             Un fichier par écran (home, lobby, setup, game...)
├── styles/
│   ├── main.css         Palette + base + ambiance
│   └── ui.css           Composants (cards, buttons, tabs, avatar)
└── utils/
    └── assets.js
```

## Catégories d'objets bingo

Le MJ peut piocher librement dans 3 catégories :

| Catégorie | Description | Exemples |
|---|---|---|
| **Urbain** | Objets visibles dans la rue à Varsovie | Tram rouge, Palais de la Culture, pierogi, kiosque, bouche de métro... |
| **Voyage** | Spécifique à un trip de groupe | Shot żubrówka, plan de métro, taxi/Uber, photo de groupe... |
| **Mémoire** | Blagues / moments du voyage | Quelqu'un perdu en chemin, kebab à 3h, vomi mémorable... |

## Délégation d'événements

Tous les événements passent par un seul listener dans `main.js` qui lit les data attributes :

| Attribut | Effet |
|---|---|
| `data-action="X"` | Appelle `ACTIONS.X()` |
| `data-nav="X"` | Navigue vers l'écran X |
| `data-set="field:value"` | Modifie `state.myAvatar[field] = value` |
| `data-tab="X"` | Change l'onglet actif sur l'écran avatar |
| `data-toggle-obj="id"` | Sélectionne/désélectionne un objet (setup MJ) |
| `data-cell="N"` | Clic sur une cellule de bingo |
| `data-validate="idx:0\|1"` | Refuse / valide une photo (MJ) |

Pas de `onclick="..."` inline. Pas de plantage silencieux.

## Roadmap

- [x] V0.5 : refonte DA Varsovie + 3 catégories d'objets
- [ ] V0.6 : Firebase Realtime DB pour la synchro multi-joueur
- [ ] V0.7 : capture photo réelle (`getUserMedia`)
- [ ] V0.8 : validation IA optionnelle (Claude Vision API)
- [ ] V1.0 : PWA installable

## Crédits

Assets portraits : [Modern User Interface](https://blue-cap-studio.itch.io/) by Blue Cap Studio.

Skyline & tram & objets bingo : pixel art original.

---

🍻 **Na zdrowie !**
