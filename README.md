# 🎯 BINGO CITY

Le bingo urbain pixel art — multijoueur en sessions privées.

## Quick start

```bash
# Installation
npm install

# Dev (hot reload sur http://localhost:5173)
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

## Déploiement Vercel

```bash
# Une seule fois : link au projet
npm i -g vercel
vercel

# Pour les déploiements suivants
vercel --prod
```

Vercel auto-détecte Vite, pas besoin de configurer.

## Architecture

```
bingo-city/
├── public/
│   └── assets/             # Sprites Modern UI
│       ├── ui/             # Cadres, boutons, jauges (9-slice)
│       ├── icons/          # Icônes (cœur, étoile, sablier, etc.)
│       └── portrait/       # Portrait Generator (skin/eyes/hair/acc)
├── src/
│   ├── main.js             # Entry — délégation d'événements + init
│   ├── state.js            # State global (sera remplacé par Firebase)
│   ├── router.js           # Navigation entre écrans (hash-based)
│   ├── data/
│   │   ├── objects.js      # Bibliothèque d'objets de bingo
│   │   └── portrait.js     # Config Portrait Generator
│   ├── ui/
│   │   ├── avatar.js       # Composant Avatar (rendu en couches)
│   │   └── toast.js        # Notifications
│   ├── screens/            # Un fichier par écran
│   │   ├── home.js
│   │   ├── create.js
│   │   ├── join.js
│   │   ├── avatar.js       # Fiche perso style RPG (image 1)
│   │   ├── lobby.js
│   │   ├── setup.js
│   │   ├── game.js         # Grille bingo + HUD métal
│   │   ├── validate.js
│   │   └── end.js
│   ├── styles/
│   │   ├── main.css        # Couleurs, polices, base
│   │   └── ui.css          # Cadres, boutons, jauges, avatar
│   └── utils/
│       └── assets.js       # Helper paths
├── index.html
├── package.json
└── vite.config.js
```

## Conventions de design

- **Cadres bois** (`frame-wood`) → écrans persos, lobby, panneaux narratifs
- **Cadres beige** (`frame-beige`) → sous-panneaux, conteneurs internes
- **Cadres métal** (`frame-metal`) → HUD du jeu, contexte SF/moderne

## Délégation d'événements

Tous les événements passent par un seul listener dans `main.js` qui lit les
data attributes :

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

- [x] V0 : prototype d'interface (sans backend)
- [ ] V1 : Firebase Realtime DB pour la synchro multi-joueur
- [ ] V2 : capture photo réelle (`getUserMedia`)
- [ ] V3 : validation IA optionnelle (Claude Vision API)
- [ ] V4 : PWA installable

## Crédits

Assets : [Modern User Interface](https://blue-cap-studio.itch.io/) by Blue Cap Studio.
