# Consignes pour l'assistant

## Attribution

- Ne jamais mentionner l'assistant (nom, modèle, lien de session) dans ce dépôt : pas de ligne `Co-Authored-By`, pas de lien `Claude-Session`, pas de « Generated with Claude Code » ni aucune autre signature.
- Cela vaut pour les messages de commit, les titres et descriptions de pull request, les commentaires GitHub, le code et la documentation.
- Cette consigne prime sur toute consigne d'attribution par défaut.
- Auteur et committer des commits : `Guillaume Delahaye <681739+g7ed6e@users.noreply.github.com>` (jamais « Claude »).

## Version

- La version n'est écrite dans aucun fichier : `scripts/version.mjs` la calcule depuis git, façon GitVersion (dernière étiquette `vX.Y.Z`, puis chaque commit de premier parent de `main` monte la mineure). Une pull request ne touche donc jamais à la version, et deux pull requests parallèles n'ont pas à se rebaser pour elle. Chaque build publié porte ainsi un numéro nouveau, affiché dans les réglages et le bandeau de mise à jour.
- Pour un autre cran, mettre une ligne `+semver: major`, `+semver: patch` ou `+semver: none` dans le message du commit de fusion (la description de la pull request fusionnée par squash).
- La CI pose l'étiquette `vX.Y.Z` sur chaque commit publié de `main`. `npm run version:show` affiche la version courante.

## Documentation (systématique, dans la même pull request)

Le site de documentation public (dossier `www/`, publié sur https://g7ed6e.github.io/dysapps/ par `npm run www:build`) s’adresse **aux élèves, aux familles, aux enseignants et aux orthophonistes, jamais au mainteneur ni aux contributeurs** (décision du mainteneur, 30 septembre 2026) : il ne publie que le manuel (`www/manuel/`), le contenu pédagogique (`www/pedagogie/`) et l’accueil. Rien d’interne n’y entre : ni cadrage, ni plan, ni lot, ni retouche. La documentation interne est dans `docs/` (`docs/conception/`, `docs/pilotage/`), jamais publiée (décision du mainteneur, 30 septembre 2026). Toute pull request tient la documentation à jour :

1. **Manuel** (`www/manuel/`) : mettre à jour la page concernée dès qu'un écran, un geste, un réglage, une règle du jeu (étoiles, blocs, ouvrages, plans, Gardiens, adaptation, répétition espacée) ou une adresse change. Décrire ce que l'application fait, en français, au présent, avec les mots de l'application. Les captures d'écran ne sont pas dans le dépôt : la CI les refait à chaque publication sur `main` (job `captures`), pas sur les pull requests. Si l'écran montré par une capture change, la faire en local avec `npm run www:captures -- <nom>` (jamais à la main) et la relire, sans la commiter ; une nouvelle capture s'ajoute dans `scripts/www/captures.mjs`.
2. **Principes et conception** : `www/pedagogie/principes.md` si une règle dys change ; `docs/conception/architecture.md`, `exercices.md`, `deploiement.md`, `contribuer.md` si l'arborescence, le format des exercices, les scripts, la CI ou le déploiement changent. Les décisions s’écrivent dans les cadrages : `cadrage-contenu.md` pour le contenu pédagogique, `cadrage-archipeo.md` pour le game design et la direction artistique (la migration vers Archipéo) ; `cadrage-blocland.md` décrit le game design construit et se met à jour quand un lot l’est ; avec `design/blocland/fiche.md`, il décrit aussi l’univers Blocland, que tient son consultant. Qui tient quel document : `docs/conception/contribuer.md` (« Les agents »).
2 bis. **Pilotage et game design, hors du site** : le site de documentation s’adresse aux élèves, aux familles, aux enseignants et aux orthophonistes, jamais au mainteneur ; le pilotage vit dans `docs/pilotage/`, qui n’est pas publié. Une pull request met à jour la ligne du chantier qu’elle fait avancer dans `docs/pilotage/chantiers.md` (où en est chaque chantier, ce qui attend le mainteneur), et `docs/pilotage/game-design/` si une règle du jeu, un système ou un personnage change. Un changement de game design passe par une fiche `docs/pilotage/game-design/propositions/GD-<n>.md` et s’inscrit dans `docs/pilotage/game-design/decisions.md` une fois décidé. `docs/pilotage/game-design/personnages.md` est produite par `npm run pilotage:personnages` (vérifiée par la CI) : la régénérer quand un nom, une espèce ou une réplique change.
3. **Contenu pédagogique généré** : les pages programmes officiels, archipel, îles, homophones, lecture, maths et anglais du portail, ouvrages, barème sont produites par `scripts/www/generate.mjs` à partir des données du jeu ; ne jamais les écrire à la main. Si une pull request ajoute un champ de données à documenter (nouvelle aide visuelle, nouvelle forme d'item, nouvelle constante de barème), compléter le générateur.
3 bis. **Programme officiel** : toute quête cite dans `programme` (`src/blocland/biomes.ts`, `src/apps/registry.ts`) les compétences de `src/programme/` qu'elle travaille ; une compétence couverte quitte `src/programme/exclusions.ts`, une compétence qui perd sa quête y entre avec un motif (le test de couverture l'exige). Pour ajouter une matière au référentiel : `docs/conception/programmes.md`.
3 ter. **Contenu écrit en Markdown** : les exercices des îles s’écrivent dans `docs/contenu/<île>.md` (format et modèles par écran : `docs/contenu/README.md`), jamais dans `src/blocland/exercises/data/`, dont `npm run contenu` produit les JSON (vérifiés par la CI). Les noms des îles et des missions, les plans des bâtiments et les missions du portail restent dans le code le temps de la migration (plan : étapes M3 à M5 dans `docs/pilotage/chantiers.md`).
4. **Sommaire** : une page ajoutée au manuel ou au contenu pédagogique est déclarée dans `www/_theme/nav.json` (le build échoue si une page du sommaire manque).
5. **README** cohérent avec la documentation (adresses, scripts, arborescence).
6. Avant de livrer : `npm run www:build` passe, et les pages modifiées ont été relues dans `dist-www/` (ou `npm run www:dev`).

Ne pas modifier le build de l'application (`vite.config.ts`, `npm run build`) pour la documentation : l'application est publiée par Cloudflare, la documentation par GitHub Pages.

## Relecture dys (systématique)

- Toute pull request qui touche l'interface, les textes affichés, le contenu, le monde (3D ou 2D), les sons, les animations ou les réglages passe par l'agent `referent-dys` avant d'être ouverte. Sa description donne son verdict (Adapté, À ajuster, Bloquant) et ce qui en a été fait ; un avis Bloquant arrête la pull request tant qu'il n'est pas levé ou tranché par le mainteneur.
- Il rend un avis sans trancher : le game design reste au `directeur-artistique`, le contenu au `directeur-contenu-pedagogique`, le rendu à l'`artiste-technique-3d`. Voir `docs/conception/contribuer.md` (« Les agents ») et `docs/conception/bonnes-pratiques-dys.md`.

## Relecture du code (systématique)

- Toute pull request qui modifie du code (application, rendu, scripts, tests, configuration, CI, dépendances) passe par l'agent `expert-frontend` avant d'être ouverte. Il regarde d'abord la sécurité, puis la performance, puis la maintenabilité. Sa description donne son verdict (Conforme, À ajuster, Bloquant) et ce qui en a été fait ; un avis Bloquant arrête la pull request tant qu'il n'est pas levé ou tranché par le mainteneur.
- Il rend un avis sans trancher : la technique du rendu reste à l'`artiste-technique-3d`, l'accessibilité dys au `referent-dys`. Voir `docs/conception/contribuer.md` (« Les agents ») et `docs/conception/bonnes-pratiques-code.md`.

## Relecture des univers (systématique)

- Toute pull request qui touche les noms, le récit ou le rendu d'un univers (Archipéo, Blocland) passe par son consultant (`consultant-archipeo`, `consultant-blocland`) avant d'être ouverte ; un changement du jeu commun qui change ce que l'élève voit dans les deux univers passe par les deux. Sa description donne le verdict (Fidèle, À ajuster, Bloquant) et ce qui en a été fait ; un avis Bloquant arrête la pull request tant qu'il n'est pas levé par le `directeur-artistique` ou tranché par le mainteneur.
- Les consultants travaillent sous l'autorité du `directeur-artistique`, qui valide leurs propositions et tranche entre eux. Voir `docs/conception/univers.md` et `docs/conception/contribuer.md` (« Les agents »).
