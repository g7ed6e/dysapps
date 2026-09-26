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
2. **Manuel** (`docs/manuel/`) : mettre à jour la page concernée dès qu'un écran, un geste, un réglage, une règle du jeu (étoiles, blocs, ouvrages, plans, Gardiens, adaptation, répétition espacée) ou une adresse change. Décrire ce que l'application fait, en français, au présent, avec les mots de l'application.
3. **Principes et conception** : `docs/pedagogie/principes.md` si une règle dys change ; `docs/conception/architecture.md`, `exercices.md`, `deploiement.md`, `contribuer.md` si l'arborescence, le format des exercices, les scripts, la CI ou le déploiement changent. Les cadrages (`docs/conception/cadrage-*.md`) reçoivent les décisions de game design.
4. **Contenu pédagogique généré** : les pages archipel, îles, homophones, lecture, maths du portail, ouvrages, barème sont produites par `scripts/docs/generate.mjs` à partir des données du jeu ; ne jamais les écrire à la main. Si une pull request ajoute un champ de données à documenter (nouvelle aide visuelle, nouvelle forme d'item, nouvelle constante de barème), compléter le générateur.
5. **Sommaire** : une page ajoutée est déclarée dans `docs/_theme/nav.json` (le build échoue si une page du sommaire manque).
6. **README** cohérent avec la documentation (adresses, scripts, arborescence).
7. Avant de livrer : `npm run docs:check` et `npm run docs:build` passent, et les pages modifiées ont été relues dans `dist-docs/` (ou `npm run docs:dev`).

Ne pas modifier le build de l'application (`vite.config.ts`, `npm run build`) pour la documentation : l'application est publiée par Cloudflare, la documentation par GitHub Pages.
