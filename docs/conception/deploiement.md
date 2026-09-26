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

`npm run docs:build` écrit `dist-docs/` :

1. `scripts/docs/generate.mjs` charge les modules du jeu (biomes, exercices, plans, ouvrages, succès, quêtes du portail) avec Vite et produit les pages du contenu pédagogique en Markdown.
2. `scripts/docs/build.mjs` lit `docs/**/*.md` (sauf `docs/_theme/`), ajoute les pages générées, convertit en HTML (`marked`), construit le sommaire depuis `docs/_theme/nav.json`, la table des matières de chaque page, la navigation précédent-suivant et l’index de recherche (`search-index.json`), puis copie le thème (`style.css`, `site.js`), la police Luciole, l’icône et `sw.js`.

Le site n’utilise aucune ressource externe (même politique de sécurité que l’application), n’a ni cookie ni statistique, et fonctionne sans JavaScript (la recherche seule en a besoin). Les liens internes sont relatifs : le site se prévisualise en local avec `npm run docs:dev` (http://localhost:4173/) et se publie sous n’importe quel chemin.

`npm run docs:check` vérifie que `docs/journal.md` décrit la version courante ; le build échoue si une page du sommaire manque.

## Le workflow GitHub Actions

`.github/workflows/deploy.yml` s’exécute à chaque push et à chaque pull request :

1. **build** : installation sans scripts (`npm ci --ignore-scripts`), vérification des signatures npm, puis sur une pull request `npm run version:check` et `npm run docs:check`, puis `npm test`, `npm run build` (l’application, comme Cloudflare la construit) et `npm run docs:build` ; sur `main`, l’artefact `dist-docs` est téléversé pour Pages.
2. **deploy** (sur `main` seulement) : publie l’artefact sur GitHub Pages. Ce job n’exécute aucun code du dépôt et il est le seul à avoir les permissions Pages.

Aucune permission par défaut, actions épinglées par SHA et mises à jour par Dependabot, `persist-credentials: false`, pas de cache partagé.

Réglage à faire une seule fois dans le dépôt : **Settings → Pages → Source : GitHub Actions**.

Cloudflare Workers construit l’application de son côté à partir de `main`, avec `npm run build`.

## Version

Chaque pull request monte la version mineure : `npm run version:minor` met à jour `package.json` et `package-lock.json`. La version est affichée dans les réglages de l’application et dans le pied de page de la documentation, et le [journal des versions](../journal.md) décrit chaque publication. La CI refuse une pull request dont la version n’a pas monté ou dont le journal n’a pas d’entrée pour la nouvelle version.

## Dépendances

`npm ci --ignore-scripts` en CI et `ignore-scripts=true` dans `.npmrc` en local : aucun script d’installation de dépendance n’est exécuté. `npm audit signatures` vérifie les signatures des paquets. Dependabot groupe les mises à jour hebdomadaires des actions et des dépendances npm (mineures et correctives).
