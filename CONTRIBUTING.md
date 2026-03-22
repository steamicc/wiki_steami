# Contribuer au Wiki STeaMi

Merci de contribuer au wiki technique de la carte STeaMi ! Ce guide decrit les conventions et le workflow a suivre.

## Prerequis

- Node.js >= 20.17
- npm
- Docker (optionnel, pour la verification des liens externes)

## Installation

```bash
git clone https://github.com/steamicc/wiki_steami.git
cd wiki_steami
npm ci
```

Les hooks Git (husky) sont installes automatiquement via `npm ci`.

## Commandes utiles

| Commande               | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `npm start`            | Lancer le serveur de developpement (localhost:3000) |
| `npm run build`        | Builder le site en production                       |
| `npm run format`       | Formater tous les fichiers (Prettier)               |
| `npm run format:check` | Verifier le formatage                               |
| `npm run lint:md`      | Verifier le Markdown (markdownlint)                 |
| `npm run lint:md:fix`  | Corriger automatiquement le Markdown                |
| `npm run lint:js`      | Verifier le JavaScript (ESLint)                     |
| `npm run lint:js:fix`  | Corriger automatiquement le JavaScript              |
| `npm run lint:links`   | Verifier les liens externes (Docker requis)         |

## Conventions de branche

Les noms de branche sont valides automatiquement au commit (`validate-branch-name`).

| Format                   | Exemple                         |
| ------------------------ | ------------------------------- |
| `feat/<description>`     | `feat/software-getting-started` |
| `fix/<description>`      | `fix/broken-wurth-links`        |
| `docs/<description>`     | `docs/contributing`             |
| `ci/<description>`       | `ci/eslint`                     |
| `chore/<description>`    | `chore/cleanup-old-files`       |
| `refactor/<description>` | `refactor/move-components`      |
| `release/vX.Y.Z`         | `release/v1.0.0`                |

La description est en **kebab-case** (minuscules, mots separes par des tirets).

## Conventions de commit

Les messages de commit suivent les [Conventional Commits](https://www.conventionalcommits.org/) et sont valides automatiquement au commit (`commitlint`).

### Format

```text
<type>(<scope>): <description>

<body optionnel>

<footer optionnel>
```

### Types

| Type       | Usage                                            |
| ---------- | ------------------------------------------------ |
| `feat`     | Nouvelle fonctionnalite, nouveau contenu         |
| `fix`      | Correction de bug, lien casse, erreur de contenu |
| `docs`     | Documentation uniquement (README, CONTRIBUTING)  |
| `ci`       | Configuration CI/CD, workflows, hooks            |
| `chore`    | Maintenance, nettoyage, dependances              |
| `refactor` | Reorganisation sans changement fonctionnel       |
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

### Regles

- Le sujet est en **minuscules** (lower-case)
- Pas de point a la fin du sujet
- Le body est limite a 100 caracteres par ligne (warning)

## Workflow de contribution

1. **Creer une issue** decrivant le changement
2. **Creer une branche** depuis `main` (format : `feat/description`)
3. **Developper** en commitant regulierement (conventional commits)
4. **Verifier localement** :

   ```bash
   npm run format:check
   npm run lint:md
   npm run lint:js
   npm run build
   ```

5. **Ouvrir une Pull Request** avec une description du changement
6. **Attendre la CI** : format + lint:md + lint:js + build + broken links check
7. **Attendre la review** : 1 approbation requise
8. **Merge** : squash merge sur main (historique lineaire)

## Hooks pre-commit automatiques

Les hooks suivants sont executes automatiquement a chaque commit :

1. **validate-branch-name** — verifie le nom de la branche
2. **git-precommit-checks** — detecte FIXME/TODO, marqueurs de conflits, console.log
3. **lint-staged** — execute les linters sur les fichiers stages :
   - `*.md` : markdownlint
   - `*.js/*.jsx` : eslint + prettier
   - `*.json/*.css/*.yml` : prettier
4. **commitlint** (hook commit-msg) — valide le message de commit

## Structure du projet

Voir le [README](README.md) pour la structure des dossiers.

## Protection de la branche main

- Push direct interdit — toute modification passe par une PR
- Le build CI doit passer (format + lint + build)
- 1 approbation de review requise
- Historique lineaire (squash merge)

## Aide

- [Issues](https://github.com/steamicc/wiki_steami/issues) — signaler un probleme ou proposer un changement
- [Site](https://wiki.steami.cc) — le wiki en production
- [MicroPython Drivers](https://github.com/steamicc/micropython-steami-lib) — les drivers STeaMi
