# Déploiement et sécurité

Deux sites sont publiés à partir du même dépôt :

| Site | Adresse | Contenu | Construit par |
| --- | --- | --- | --- |
| **L’application** (PWA) | <https://dysapps.guillaume-delahaye.workers.dev/> | `dist/`, produit par `npm run build` | Cloudflare Workers, à la racine (`base: '/'`) |
| **La documentation** | <https://g7ed6e.github.io/dysapps/> | `dist-docs/`, produit par `npm run docs:build` | GitHub Actions, publié sur GitHub Pages dans `/dysapps/` |

L’application n’est plus servie sur GitHub Pages : le site de documentation y dépose un service worker (`sw.js`) qui vide les caches et se désinscrit, pour que les appareils qui avaient installé l’ancienne version voient la documentation puis suivent le lien vers l’application.

## Le build de l’application

`npm run build` vérifie les types (`tsc --noEmit`) puis construit avec Vite dans `dist/`. Par défaut la base est la racine, ce qui convient à Cloudflare. `vite.config.ts` garde la possibilité d’un sous-dossier (`DEPLOY_TARGET=github` ou `BASE_PATH`), inutile en production aujourd’hui.

- Content-Security-Policy stricte injectée en `<meta>` au build : aucune ressource externe, tout est limité à `'self'`.
- `referrer` désactivé, aucun appel réseau vers un autre domaine.
- PWA (`vite-plugin-pwa`) : mise à jour proposée, jamais imposée ; tout le site est mis en cache pour le hors ligne.
- Chaque publication porte un numéro de version nouveau (voir ci-dessous).

## Le build de la documentation

La documentation est un site [VitePress](https://vitepress.dev/) : menu, sommaire et table des matières s’adaptent au téléphone, la recherche est locale, le thème clair ou sombre suit l’appareil. `npm run docs:build` écrit `dist-docs/` :

1. `docs/.vitepress/config.mts` appelle `scripts/docs/prepare.mjs`, qui copie `docs/**/*.md` (sauf `docs/_theme/`, `docs/_journal/` et `docs/.vitepress/`) dans `.docs-src/` et y ajoute les pages générées par `scripts/docs/generate.mjs` : ce script charge les modules du jeu (biomes, exercices, plans, ouvrages, succès, quêtes du portail) avec Vite et produit les pages du contenu pédagogique en Markdown. `scripts/docs/journal.mjs` assemble le journal des versions à partir des fragments de `docs/_journal/` (voir [Version](#version)). Il copie aussi l’icône, la police Luciole et `sw.js`.
2. La configuration construit le sommaire depuis `docs/_theme/nav.json` (le build échoue si une page du sommaire manque), date chaque page de son dernier commit (ou du jour du build pour une page générée) et pointe le lien « Voir la source » vers le fichier Markdown ou vers le générateur.
3. VitePress construit le site ; à la fin, chaque page reçoit sa politique de sécurité du contenu en `<meta>`, avec l’empreinte des scripts en ligne de VitePress.

Le thème (`docs/.vitepress/theme/`) reprend les couleurs de l’application et la police Luciole, avec un texte à 18 px au moins. Le site n’utilise aucune ressource externe, n’a ni cookie ni statistique. Il se prévisualise en local avec `npm run docs:dev` (serveur de développement sur le port 4173) ou `npm run docs:preview` après un build.

`npm run docs:check` vérifie qu’une pull request ajoute un fragment au journal (`docs/_journal/`) ; le build échoue si une page du sommaire manque.

## Le workflow GitHub Actions

`.github/workflows/deploy.yml` s’exécute à chaque push et à chaque pull request :

1. **build** : installation sans scripts (`npm ci --ignore-scripts`), vérification des signatures npm, calcul de la version (`node scripts/version.mjs`), puis sur une pull request `npm run docs:check`, puis `npm test`, `npm run build` (l’application, comme Cloudflare la construit) et `npm run docs:build` ; sur `main`, l’artefact `dist-docs` est téléversé pour Pages.
2. **tag** (sur `main` seulement) : pose l’étiquette `vX.Y.Z` de la version calculée sur le commit publié, par un appel à l’API GitHub. Ce job n’exécute aucun code du dépôt et il est le seul à pouvoir écrire dans le dépôt (`contents: write`).
3. **deploy** (sur `main` seulement) : publie l’artefact sur GitHub Pages. Ce job n’exécute aucun code du dépôt et il est le seul à avoir les permissions Pages.

Aucune permission par défaut, actions épinglées par SHA et mises à jour par Dependabot, `persist-credentials: false`, pas de cache partagé.

Réglage à faire une seule fois dans le dépôt : **Settings → Pages → Source : GitHub Actions**.

Cloudflare Workers construit l’application de son côté à partir de `main`, avec `npm run build`. Son clone est superficiel : le calcul de la version récupère l’historique et les étiquettes (`git fetch --unshallow --tags`) avant de compter.

## Version

La version n’est écrite dans aucun fichier (`package.json` n’en a pas) : `scripts/version.mjs` la calcule depuis l’historique git, à la manière de [GitVersion](https://gitversion.net/) en mode « mainline ».

- Le point de départ est la dernière étiquette `vX.Y.Z` de la lignée de premier parent (`git describe --first-parent`).
- Chaque commit de premier parent de `main` après l’étiquette (une pull request fusionnée) monte la version mineure, sauf si son message contient une ligne `+semver: major`, `+semver: patch` ou `+semver: none`.
- Après chaque publication, le job **tag** pose l’étiquette de la nouvelle version : le calcul repart de là.
- Sans étiquette atteignable (historique absent), la version vaut `0.0.0-<sha>` et un avertissement s’affiche au build.

`npm run version:show` affiche la version du commit courant. Sur une pull request, la CI calcule sur le commit de fusion : c’est la version qu’aura `main`. En local, sur une branche à plusieurs commits, le nombre est indicatif (chaque commit compte).

Deux pull requests menées en parallèle ne touchent donc aucun numéro commun et n’ont plus à se rebaser pour la version. Le journal suit le même principe : chaque pull request ajoute un fragment `docs/_journal/<nom>.md` (sans titre), et `scripts/docs/journal.mjs` le place sous le titre `## <version> — <date>` du commit de `main` qui l’a ajouté. Les entrées antérieures (0.14.0 et avant) sont dans `docs/_journal/historique.md`.

La version est affichée dans les réglages de l’application et dans le pied de page de la documentation, et le [journal des versions](../journal.md) décrit chaque publication. La CI refuse une pull request sans fragment de journal.

## Dépendances

`npm ci --ignore-scripts` en CI et `ignore-scripts=true` dans `.npmrc` en local : aucun script d’installation de dépendance n’est exécuté. `npm audit signatures` vérifie les signatures des paquets. Dependabot groupe les mises à jour hebdomadaires des actions et des dépendances npm (mineures et correctives).
