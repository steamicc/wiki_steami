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

| Commande               | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm start`            | Lancer le serveur de développement (localhost:3000) |
| `npm run build`        | Builder le site en production                       |
| `npm run format`       | Formater tous les fichiers (Prettier)               |
| `npm run format:check` | Vérifier le formatage                               |
| `npm run lint:md`      | Vérifier le Markdown sous `docs/` (markdownlint)    |
| `npm run lint:md:fix`  | Corriger automatiquement le Markdown sous `docs/`   |
| `npm run lint:js`      | Vérifier le JavaScript (ESLint)                     |
| `npm run lint:js:fix`  | Corriger automatiquement le JavaScript              |
| `npm run lint:links`   | Vérifier les liens externes (Docker requis)         |

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
6. **Attendre la CI** : commitlint + format + lint:md + lint:js + build + broken links check
7. **Attendre la review** : 1 approbation requise
8. **Merge** : squash merge sur main (historique linéaire)

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
