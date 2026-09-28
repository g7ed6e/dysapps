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

Le site de documentation (`docs/`, publié sur https://g7ed6e.github.io/dysapps/ par `npm run docs:build`) est à la fois le manuel utilisateur et la description vivante du contenu pédagogique. Toute pull request le tient à jour :

1. **Journal obligatoire** : ajouter un fichier nouveau `docs/_journal/<nom-de-la-branche>.md`, sans titre, qui dit, pour l'élève ou pour le contenu, ce que change la pull request. Le titre `## <version> — <date>` est ajouté à la publication (`scripts/docs/journal.mjs`) ; ne jamais écrire `docs/journal.md`, qui est généré. La CI échoue sans fragment (`npm run docs:check`).
2. **Manuel** (`docs/manuel/`) : mettre à jour la page concernée dès qu'un écran, un geste, un réglage, une règle du jeu (étoiles, blocs, ouvrages, plans, Gardiens, adaptation, répétition espacée) ou une adresse change. Décrire ce que l'application fait, en français, au présent, avec les mots de l'application. Les captures d'écran ne sont pas dans le dépôt : la CI les refait à chaque publication sur `main` (job `captures`), pas sur les pull requests. Si l'écran montré par une capture change, la faire en local avec `npm run docs:captures -- <nom>` (jamais à la main) et la relire, sans la commiter ; une nouvelle capture s'ajoute dans `scripts/docs/captures.mjs`.
3. **Principes et conception** : `docs/pedagogie/principes.md` si une règle dys change ; `docs/conception/architecture.md`, `exercices.md`, `deploiement.md`, `contribuer.md` si l'arborescence, le format des exercices, les scripts, la CI ou le déploiement changent. Les décisions s’écrivent dans les cadrages : `cadrage-contenu.md` pour le contenu pédagogique, `cadrage-archipeo.md` pour le game design et la direction artistique (la migration vers Archipéo) ; `cadrage-blocland.md` décrit le game design construit et se met à jour quand un lot l’est. Qui tient quel document : `docs/conception/contribuer.md` (« Les agents »).
4. **Contenu pédagogique généré** : les pages programmes officiels, archipel, îles, homophones, lecture, maths et anglais du portail, ouvrages, barème sont produites par `scripts/docs/generate.mjs` à partir des données du jeu ; ne jamais les écrire à la main. Si une pull request ajoute un champ de données à documenter (nouvelle aide visuelle, nouvelle forme d'item, nouvelle constante de barème), compléter le générateur.
4 bis. **Programme officiel** : toute quête cite dans `programme` (`src/blocland/biomes.ts`, `src/apps/registry.ts`) les compétences de `src/programme/` qu'elle travaille ; une compétence couverte quitte `src/programme/exclusions.ts`, une compétence qui perd sa quête y entre avec un motif (le test de couverture l'exige). Pour ajouter une matière au référentiel : `docs/conception/programmes.md`.
5. **Sommaire** : une page ajoutée est déclarée dans `docs/_theme/nav.json` (le build échoue si une page du sommaire manque).
6. **README** cohérent avec la documentation (adresses, scripts, arborescence).
7. Avant de livrer : `npm run docs:check` et `npm run docs:build` passent, et les pages modifiées ont été relues dans `dist-docs/` (ou `npm run docs:dev`).

Ne pas modifier le build de l'application (`vite.config.ts`, `npm run build`) pour la documentation : l'application est publiée par Cloudflare, la documentation par GitHub Pages.

## Relecture dys (systématique)

- Toute pull request qui touche l'interface, les textes affichés, le contenu, le monde (3D ou 2D), les sons, les animations ou les réglages passe par l'agent `referent-dys` avant d'être ouverte. Sa description donne son verdict (Adapté, À ajuster, Bloquant) et ce qui en a été fait ; un avis Bloquant arrête la pull request tant qu'il n'est pas levé ou tranché par le mainteneur.
- Il rend un avis sans trancher : le game design reste au `directeur-artistique`, le contenu au `directeur-contenu-pedagogique`, le rendu à l'`artiste-technique-3d`. Voir `docs/conception/contribuer.md` (« Les agents ») et `docs/conception/bonnes-pratiques-dys.md`.

## Relecture du code (systématique)

- Toute pull request qui modifie du code (application, rendu, scripts, tests, configuration, CI, dépendances) passe par l'agent `expert-frontend` avant d'être ouverte. Il regarde d'abord la sécurité, puis la performance, puis la maintenabilité. Sa description donne son verdict (Conforme, À ajuster, Bloquant) et ce qui en a été fait ; un avis Bloquant arrête la pull request tant qu'il n'est pas levé ou tranché par le mainteneur.
- Il rend un avis sans trancher : la technique du rendu reste à l'`artiste-technique-3d`, l'accessibilité dys au `referent-dys`. Voir `docs/conception/contribuer.md` (« Les agents ») et `docs/conception/bonnes-pratiques-code.md`.
