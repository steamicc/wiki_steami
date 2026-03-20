# Wiki STeaMi

Documentation technique de la carte **STeaMi**, une carte éducative IoT basée sur un STM32WB55 (MCU principal) et un STM32F103 (interface DAPLink).

**Site :** [wiki.steami.cc](https://wiki.steami.cc)

## Contenu

Le wiki couvre 5 sections :

| Section | Description |
|---------|-------------|
| **Vue d'ensemble** | Architecture générale, pinout |
| **Hardware** | Blocs fonctionnels (MCU, capteurs, alimentation, audio, etc.) |
| **Pin Mapping** | Correspondance broches physiques ↔ fonctions |
| **Composants** | BOM détaillée (CI, passifs, connecteurs, LEDs, etc.) |
| **Requirements** | Exigences fonctionnelles, environnementales et physiques |

## Développement local

### Prérequis

- Node.js >= 20

### Installation

```bash
npm install
```

### Lancer le serveur de développement

```bash
npm start
```

Le site est accessible sur [localhost:3000](http://localhost:3000). Les modifications sont rechargées automatiquement.

### Build de production

```bash
npm run build
```

Les fichiers statiques sont générés dans `build/`.

## Structure du projet

```
wiki_steami/
├── docs/                  # Contenu Markdown du wiki
│   ├── overview/          # Vue d'ensemble et pinout
│   ├── hardware/          # Blocs fonctionnels hardware
│   ├── pin-mapping/       # Mapping des broches
│   ├── components/        # BOM et composants
│   └── requirements/      # Exigences techniques
├── src/
│   ├── pages/             # Pages custom (homepage)
│   └── css/               # Styles custom
├── static/img/            # Images et SVG (pinout, etc.)
├── docusaurus.config.js   # Configuration Docusaurus
└── sidebars.js            # Configuration des sidebars
```

## Déploiement

Le site est déployé automatiquement sur **GitHub Pages** à chaque push sur `main` via le workflow [deploy.yml](.github/workflows/deploy.yml).

## Repos liés

- [micropython-steami-lib](https://github.com/steamicc/micropython-steami-lib) — Drivers MicroPython pour les capteurs et périphériques de la carte
- [DAPLink](https://github.com/steamicc/DAPLink) — Firmware du STM32F103 (branche `release_letssteam`)

## Licence

Wiki STeaMi © STeaMi
