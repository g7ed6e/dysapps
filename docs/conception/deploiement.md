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
- PWA (`vite-plugin-pwa`) : mise à jour proposée, jamais imposée ; tout le site est mis en cache pour le hors ligne. Le service worker enregistre à l’installation tous les fichiers `js`, `css`, `html`, `svg`, `png` et `woff2` (`globPatterns` dans `vite.config.ts`), y compris ceux que l’application ne charge qu’à la demande : la 3D (Three.js), chaque mission du portail et chaque exercice JSON de Blocland. Ils s’ouvrent donc hors ligne même si l’élève ne les a jamais ouverts en ligne. Les images PNG de l’interface en font partie.
- Chargement à la demande : il allège le premier affichage (moins de code à lire avant l’accueil), pas le téléchargement de l’installation. Si un fichier chargé à la demande manque (une nouvelle version publiée pendant la séance, avant que le service worker ne garde le site), la page affiche « Cette page n’a pas pu s’ouvrir » avec un bouton **Recharger** au lieu d’un écran blanc (`src/components/ErrorBoundary.tsx`) ; une créature ou un Gardien en 3D reste alors dessiné en SVG.
- **Écrans de lancement** : Android compose le sien à partir du manifeste (icône et `background_color`). Safari, non : `scripts/splash.mjs` (`npm run splash`) fabrique dans `public/splash/` une image par iPhone et iPad et par orientation (l’icône de `pwa-512.png`, mise à l’échelle, sur fond crème), sans dépendance ; la liste des appareils est dans `scripts/splash-devices.mjs`, et le plugin `appleSplash` de `vite.config.ts` ajoute à `index.html` les balises `apple-touch-startup-image` correspondantes. Ces images ne sont pas mises en cache par le service worker (`globIgnores`) : elles ne servent qu’à l’appli installée sur iPhone et iPad. À relancer si l’icône ou la liste des appareils change ; un test vérifie que chaque appareil a ses deux images, à la bonne taille.
- **Icônes de l’appli installée** : le manifeste porte un `id` fixe (la base, comme le `start_url` dont Chrome le déduisait avant) ; il ne doit jamais changer, sinon les appareils verraient une autre appli, sans ses données. L’adresse de chaque icône, dans le manifeste comme dans les balises `icon` et `apple-touch-icon` que le plugin `iconLinks` ajoute à `index.html`, porte l’empreinte de son contenu (`pwa-192.png?v=…`, `scripts/icones.mjs`) : un nouveau dessin change le manifeste, ce que Chrome et Edge guettent pour proposer la nouvelle icône à une appli installée, et aucun cache ne ressert l’ancienne. Le service worker ignore ce paramètre (`ignoreURLParametersMatching`) et sert les icônes hors ligne. Le manifeste est dans le cache du service worker : un appareil voit la nouvelle icône après que l’élève a accepté la mise à jour. Les écrans de lancement d’iPhone et d’iPad (`apple-touch-startup-image`, plugin `appleSplash`) portent la même empreinte. Safari ne relit jamais l’icône ni l’écran de lancement d’une appli installée : seule une réinstallation les change. L’icône est le « D » de DysApps, commune aux univers (`icon.svg`, `icon-maskable.svg` et les PNG tirés de ces deux dessins) ; le logo de l’écran titre d’Archipéo est `archipeo.svg`. Changer l’icône, c’est remplacer ces fichiers de `public/` sous le même nom, puis relancer `npm run splash`.
- Chaque publication porte un numéro de version nouveau (voir ci-dessous).

## Le build de la documentation

La documentation est un site [VitePress](https://vitepress.dev/) : menu, sommaire et table des matières s’adaptent au téléphone, la recherche est locale, le thème clair ou sombre suit l’appareil. Le site porte l’habillage de Blocland, l’univers par défaut (`docs/.vitepress/theme/`, décrit dans [Style](style.md)) : le thème clair reprend le thème Crème de Blocland, le sombre son thème Nuit, les titres courts sont en Archivo Black et le texte en Luciole. `npm run docs:build` écrit `dist-docs/` :

1. `docs/.vitepress/config.mts` appelle `scripts/docs/prepare.mjs`, qui copie `docs/**/*.md` (sauf `docs/_theme/`, `docs/_journal/` et `docs/.vitepress/`) dans `.docs-src/` et y ajoute les pages générées par `scripts/docs/generate.mjs` : ce script charge les modules du jeu (biomes, exercices, plans, ouvrages, succès, missions du portail) avec Vite et produit les pages du contenu pédagogique en Markdown. `scripts/docs/journal.mjs` assemble le journal des versions à partir des fragments de `docs/_journal/` (voir [Version](#version)). Il copie aussi l’icône, le logo de Blocland, la police Luciole et `sw.js`.
2. La configuration construit le sommaire depuis `docs/_theme/nav.json` (le build échoue si une page du sommaire manque), date chaque page de son dernier commit (ou du jour du build pour une page générée) et pointe le lien « Voir la source » vers le fichier Markdown ou vers le générateur.
3. VitePress construit le site ; à la fin, chaque page reçoit sa politique de sécurité du contenu en `<meta>`, avec l’empreinte des scripts en ligne de VitePress.

Le thème (`docs/.vitepress/theme/`) reprend les couleurs de l’application et la police Luciole, avec un texte à 18 px au moins. Le site n’utilise aucune ressource externe, n’a ni cookie ni statistique. Il se prévisualise en local avec `npm run docs:dev` (serveur de développement sur le port 4173) ou `npm run docs:preview` après un build.

`npm run docs:check` vérifie qu’une pull request ajoute un fragment au journal (`docs/_journal/`) ; le build échoue si une page du sommaire manque.

## Le workflow GitHub Actions

`.github/workflows/deploy.yml` s’exécute à chaque push et à chaque pull request :

1. **build** : installation sans scripts (`npm ci --ignore-scripts`), vérification des signatures npm, calcul de la version (`node scripts/version.mjs`), puis sur une pull request `npm run docs:check`, puis `npm test` et `npm run build` (l’application, comme Cloudflare la construit).
2. **captures**, en parallèle, sur `main` seulement : installe le Chromium de `playwright-core` (`npx playwright-core install --with-deps chromium`), rejoue le jeu avec `npm run docs:captures` et téléverse les images en artefact `captures`. Les captures ne sont pas dans le dépôt (`docs/_captures/` est ignoré par git) : elles sont refaites à chaque publication, donc toujours à jour. Une pull request ne les attend pas, pour rester rapide.
3. **docs**, après **captures** : sur `main`, récupère l’artefact dans `docs/_captures/` et lance `npm run docs:build` avec `DOCS_CAPTURES=required` (une capture citée et absente fait échouer le build) ; sur une pull request, construit le site avec des images vides à la place des captures, ce qui vérifie quand même les pages et les noms de captures ; sur `main`, l’artefact `dist-docs` est téléversé pour Pages.
4. **tag** (sur `main` seulement) : pose l’étiquette `vX.Y.Z` de la version calculée sur le commit publié, par un appel à l’API GitHub. Ce job n’exécute aucun code du dépôt et il est le seul à pouvoir écrire dans le dépôt (`contents: write`).
5. **deploy** (sur `main` seulement, après **build** et **docs**) : publie l’artefact sur GitHub Pages. Ce job n’exécute aucun code du dépôt et il est le seul à avoir les permissions Pages.

Aucune permission par défaut, actions épinglées par SHA et mises à jour par Dependabot, `persist-credentials: false`, pas de cache partagé.

Réglage à faire une seule fois dans le dépôt : **Settings → Pages → Source : GitHub Actions**.

Cloudflare Workers construit l’application de son côté à partir de `main`, avec `npm run build`, puis la publie avec `npx wrangler deploy`. `wrangler.jsonc` décrit la publication : le Worker `dysapps`, le dossier `dist/` servi tel quel, toute adresse inconnue renvoyée vers l’application (`single-page-application`), l’adresse `*.workers.dev` et les adresses d’aperçu. Sans ce fichier, wrangler se configurait lui-même à chaque publication et reconstruisait l’application une seconde fois. Son clone est superficiel : le calcul de la version récupère l’historique et les étiquettes (`git fetch --unshallow --tags`) avant de compter.

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
