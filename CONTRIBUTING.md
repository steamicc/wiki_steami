# Contribuer au Wiki STeaMi

Merci de contribuer au wiki technique de la carte STeaMi ! Ce guide décrit les conventions et le workflow à suivre.

## Prérequis

- Node.js >= 20.17
- npm
- Docker (optionnel, pour la vérification des liens externes)

## Installation

```bash
git clone https://github.com/steamicc/wiki_steami.git
cd wiki_steami
npm ci
```

Les hooks Git (husky) sont installés automatiquement via `npm ci`.

## Commandes utiles

| Commande                  | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm start`               | Lancer le serveur de développement (localhost:3000)                      |
| `npm run build`           | Builder le site en production                                            |
| `npm run format`          | Formater tous les fichiers (Prettier)                                    |
| `npm run format:check`    | Vérifier le formatage                                                    |
| `npm run lint:md`         | Vérifier le Markdown sous `docs/` (markdownlint)                         |
| `npm run lint:md:fix`     | Corriger automatiquement le Markdown sous `docs/`                        |
| `npm run lint:js`         | Vérifier le JavaScript (ESLint)                                          |
| `npm run lint:js:fix`     | Corriger automatiquement le JavaScript                                   |
| `npm run lint:links`      | Vérifier les liens externes (Docker requis)                              |
| `npm run lint:file-sizes` | Vérifier la taille des fichiers ajoutés ou modifiés depuis `origin/main` |
| `npm run optimize:image`  | Réduire le poids d'une image, format et nom conservés                    |

## Conventions de branche

Les noms de branche sont validés automatiquement au commit (`validate-branch-name`).

| Format                   | Exemple                         |
| ------------------------ | ------------------------------- |
| `feat/<description>`     | `feat/software-getting-started` |
| `fix/<description>`      | `fix/broken-wurth-links`        |
| `docs/<description>`     | `docs/contributing`             |
| `ci/<description>`       | `ci/eslint`                     |
| `chore/<description>`    | `chore/cleanup-old-files`       |
| `refactor/<description>` | `refactor/move-components`      |
| `release/vX.Y.Z`         | `release/v1.0.0`                |

La description est en **kebab-case** (minuscules, mots séparés par des tirets).

## Conventions de commit

Les messages de commit suivent les [Conventional Commits](https://www.conventionalcommits.org/) et sont validés automatiquement au commit (`commitlint`).

### Format

```text
<type>(<scope>): <description>

<body optionnel>

<footer optionnel>
```

### Types

| Type       | Usage                                            |
| ---------- | ------------------------------------------------ |
| `feat`     | Nouvelle fonctionnalité, nouveau contenu         |
| `fix`      | Correction de bug, lien cassé, erreur de contenu |
| `docs`     | Documentation uniquement (README, CONTRIBUTING)  |
| `ci`       | Configuration CI/CD, workflows, hooks            |
| `chore`    | Maintenance, nettoyage, dépendances              |
| `refactor` | Réorganisation sans changement fonctionnel       |
| `style`    | Formatage, espaces, points-virgules              |

### Scopes (optionnels)

`wip`, `configs`, `formatting`, `code`, `ci`, `docs`, `hardware`, `software`, `design`

### Exemples

```text
feat: add ISM330DLC sensor sub-page
fix: correct Wurth WSEN-PADS URL (append _1)
ci: add markdownlint with CI integration
docs: add CONTRIBUTING.md
refactor: move components/ under hardware/
chore: remove old requirements section
```

### Règles

- Le sujet est en **minuscules** (lower-case)
- Pas de point à la fin du sujet
- Le body est limité à 100 caractères par ligne (warning)

## Workflow de contribution

1. **Créer une issue** décrivant le changement
2. **Créer une branche** depuis `main` (format : `feat/description`)
3. **Développer** en commitant régulièrement (conventional commits)
4. **Vérifier localement** :

   ```bash
   npm run format:check
   npm run lint:md
   npm run lint:js
   npm run build
   ```

5. **Ouvrir une Pull Request** avec une description du changement
6. **Attendre la CI** : commitlint + taille des fichiers + format + lint:md + lint:js + build + broken links check
7. **Attendre la review** : 1 approbation requise
8. **Merge** : squash merge sur main (historique linéaire)

## Taille des fichiers

La CI refuse, dans une PR, un fichier ajouté ou modifié trop volumineux (`scripts/check-file-sizes.py`, 1 Ko = 1024 octets) :

| Fichiers                                         | Avertissement | Erreur |
| ------------------------------------------------ | ------------- | ------ |
| Images (`.png`, `.jpg`, `.gif`, `.webp`, `.svg`) | > 500 Ko      | > 2 Mo |
| PDF                                              | > 1 Mo        | > 2 Mo |
| Autres fichiers                                  | —             | > 1 Mo |

Avant d'ajouter une image, la redimensionner et la compresser (PNG optimisé pour un schéma ou une capture, JPEG pour une photo). Les fichiers déjà présents au-delà d'un seuil d'erreur sont listés, avec une taille plafond, dans `scripts/tailles-fichiers-exceptions.txt`. Pour vérifier localement :

```bash
npm run lint:file-sizes            # fichiers commités depuis origin/main
npm run lint:file-sizes -- --all   # tous les fichiers suivis
```

### Optimiser une image

`npm run optimize:image` (`scripts/optimize-image.py`) réduit le poids d'une image **en gardant son format et son nom** : les liens des pages restent valides.

| Format | Traitement                                                           |
| ------ | -------------------------------------------------------------------- |
| PNG    | palette de 256 couleurs avec tramage (libimagequant, comme pngquant) |
| JPEG   | réencodage progressif, qualité 85, sans métadonnées EXIF             |
| WebP   | réencodage, qualité 85                                               |
| SVG    | images PNG ou JPEG intégrées en base64 traitées comme ci-dessus      |

```bash
# Photo de 3000 px affichée sur 350 px de large : la ramener à 800 px
npm run optimize:image -- --max-width 800 static/img/hardware/ma-photo.png

# Voir le gain sans réécrire le fichier
npm run optimize:image -- --dry-run static/img/pinout/*.png

# Schéma SVG avec une photo intégrée, posée sur un fond opaque #fffffc :
# photo aplatie sur ce fond et intégrée en JPEG
npm run optimize:image -- --svg-jpeg '#fffffc' --quality 80 static/img/pinout/pinout_steami.svg
```

- Viser, avec `--max-width`, environ deux fois la largeur d'affichage réelle (écrans haute densité). Pour la trouver, chercher où l'image est utilisée (`grep -rn nom-image docs src`) : attribut `width` d'une balise `<img>`, règle CSS (vignettes de la page d'accueil dans `src/css/custom.css`), ou largeur de la colonne de texte pour une image Markdown (au plus 950 px environ).
- Pour un SVG, `--svg-jpeg COULEUR` pose les images intégrées sur `COULEUR` et les intègre en JPEG (qualité `--quality`, couleurs non sous-échantillonnées). Une photo pèse alors bien moins qu'en PNG, mais perd sa transparence : réserver cette option à un SVG qui dessine, sous toute la photo, un fond opaque de cette couleur (chercher le `fill` du rectangle de fond dans le fichier). Le nom et le format du SVG ne changent pas.
- Le fichier n'est réécrit que s'il devient plus léger. Un résultat trop dégradé (PSNR sous 32 dB, réglable avec `--min-psnr`) est refusé.
- Ouvrir quand même l'image avant et après, zoomée, pour vérifier qu'aucune différence n'est visible.
- Prérequis : Pillow avec libimagequant (paquet `python3-pil` d'Ubuntu) ou la commande `pngquant`. Sans l'un ni l'autre, `--lossless` recompresse un PNG sans palette, pour un gain faible.

## Hooks automatiques

Les hooks suivants sont exécutés automatiquement à chaque commit :

### Pre-commit (`.husky/pre-commit`)

1. **validate-branch-name** — vérifie le nom de la branche
2. **git-precommit-checks** — détecte FIXME/TODO, marqueurs de conflits, console.log
3. **lint-staged** — exécute sur les fichiers stagés uniquement :
   - `*.md` : markdownlint
   - `*.js/*.jsx` : eslint + prettier --check
   - `*.json/*.css/*.yml` : prettier --check

### Commit-msg (`.husky/commit-msg`)

1. **commitlint** — valide le message de commit (conventional commits)

## Structure du projet

Voir le [README](README.md) pour la structure des dossiers.

## Protection de la branche main

- Push direct interdit — toute modification passe par une PR
- Le build CI doit passer (commitlint + format + lint + build)
- 1 approbation de review requise
- Historique linéaire (squash merge)

## Aide

- [Issues](https://github.com/steamicc/wiki_steami/issues) — signaler un problème ou proposer un changement
- [Site](https://wiki.steami.cc) — le wiki en production
- [MicroPython Drivers](https://github.com/steamicc/micropython-steami-lib) — les drivers STeaMi
