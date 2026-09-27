# Contribuer

Le dépôt est <https://github.com/g7ed6e/dysapps>. Le travail se fait par pull request sur `main` ; la CI lance les tests, les deux builds et la vérification du journal.

## Mettre en route

```bash
npm install
npm run dev        # l'application : http://localhost:5173/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
npm run docs:dev   # la documentation (VitePress) : http://localhost:4173/
npm run docs:build # construit la documentation dans dist-docs/
npm run docs:preview # sert dist-docs/ tel que publié : http://localhost:4173/
npm run docs:check # vérifie que la pull request ajoute un fragment au journal (docs/_journal/)
npm run docs:captures # rejoue le jeu dans Chromium et refait les captures d’écran (docs/_captures/)
npm run version:show # affiche la version calculée depuis git
npm run splash     # refait les écrans de lancement d'iPhone et d'iPad (public/splash/)
```

## Ce que contient chaque pull request

1. **Le code et ses tests.** La logique reste pure et testée (moteur, progression, générateurs, données) ; un exercice ajouté est vérifié par les tests de données.
2. **La version** : rien à faire. Elle se calcule depuis git à la fusion (voir [Déploiement](deploiement.md#version)) : la pull request monte la version mineure, ou un autre cran si son message contient `+semver: major`, `+semver: patch` ou `+semver: none`.
3. **La documentation**, dans la même pull request :
   - un **fragment du journal** : un fichier nouveau `docs/_journal/<nom-de-la-branche>.md`, sans titre, qui dit ce que change la pull request pour l’élève ou pour le contenu (vérifié par la CI). Le titre `## <version> — <date>` est ajouté à la publication ; deux pull requests parallèles écrivent deux fichiers différents et ne se gênent pas ;
   - le **manuel** (`docs/manuel/`) mis à jour si un écran, un geste, un réglage ou une règle du jeu change, et ses **captures** refaites si l’écran montré change (`npm run docs:captures`) ;
   - les **principes** et la **conception** (`docs/pedagogie/principes.md`, `docs/conception/`) mis à jour si une règle dys, l’architecture, le format des exercices ou le déploiement change ;
   - le **README** cohérent avec le reste.
4. **Le contenu pédagogique** (programmes officiels, archipel, pages des îles, homophones, lecture, maths et anglais du portail, ouvrages, barème) n’a rien à faire à la main : ces pages sont générées au build à partir des données du jeu. Ajouter un exercice, une quête ou une île suffit pour qu’elles apparaissent. Si un nouveau champ de données mérite d’être documenté (une nouvelle aide visuelle, une nouvelle forme d’item), compléter `scripts/docs/generate.mjs`.
5. **Le programme officiel** : une quête cite dans `programme` les compétences qu’elle travaille (`src/programme/`) ; une compétence nouvellement couverte quitte `src/programme/exclusions.ts`, une compétence qui perd sa quête y entre avec un motif. Le test de couverture le rappelle. Voir [Le référentiel des programmes](programmes.md).

Une pull request qui ajoute une page au manuel ou à la conception la déclare dans `docs/_theme/nav.json` : le build échoue si une page du sommaire manque et signale une page hors sommaire.

## Les deux agents

Le dépôt fournit deux agents partagés pour Claude Code, dans `.claude/agents/`. Toute personne qui clone le dépôt a les mêmes ; leurs consignes se modifient par pull request, comme le reste. On les sollicite par leur nom (« demande au directeur contenu pédagogique de relire `carriere-coffre-3` ») ou avec `claude --agent <nom>`.

- Le **Directeur contenu pédagogique** (`directeur-contenu-pedagogique`) garantit le programme officiel, les règles dys et la qualité des items. Il cadre un lot de contenu à partir de ce qui reste à couvrir, relit et écrit des exercices, et tient les exclusions du référentiel à jour. Il peut modifier des fichiers.
- Le **directeur artistique** (`directeur-artistique`) est le game designer. Il conduit la migration de Blocland vers Archipéo : il cadre un lot de game design, relit une proposition sous cet angle et tranche une question d’univers. Il lit et propose, sans modifier de fichier.

Aucun des deux ne fait les choix techniques (code, rendu, données, tests, CI, déploiement) : ils reviennent à ceux qui écrivent le code, et sont décrits par [Architecture](architecture.md) et [Déploiement](deploiement.md).

### Qui tient quel document

| Document | Tenu par | Rôle |
| --- | --- | --- |
| [Principes dys](../pedagogie/principes.md) | Contenu | Les règles dys ; une contrainte pour les deux agents |
| [Format des exercices](exercices.md), [Référentiel des programmes](programmes.md) | Contenu | Le format des items, la couverture du programme |
| [Cadrage du contenu](cadrage-contenu.md) | Contenu | Les décisions de contenu et la suite à couvrir |
| [Cadrage « De Blocland à Archipéo »](cadrage-archipeo.md), `design/archipeo/` | Directeur artistique | La cible de la migration et ce qui reste à décider |
| [Cadrage du game design de Blocland](cadrage-blocland.md), [Style](style.md) | Directeur artistique | L’existant à faire migrer |
| Le manuel (`docs/manuel/`) | Celui qui change l’écran | Ce que l’élève voit aujourd’hui |
| Les pages du contenu pédagogique | Le générateur | Produites depuis les données du jeu, jamais écrites à la main |

Une question qui touche aux deux (une quête qui doit produire une conséquence visible dans le monde, le nombre de blocs que rapporte un exercice) se partage ainsi : ce qu’un exercice enseigne, ses items et sa correction relèvent du contenu ; ce que la réussite rapporte et change dans le monde relève du game design. Une décision prise s’écrit dans le cadrage de celui qui la tient.

## Écrire pour la documentation

- En français, au présent, en phrases courtes ; le lecteur est un élève, un parent, un enseignant ou un orthophoniste, pas un développeur (sauf dans la section Conception).
- Décrire ce que l’application **fait**, pas ce qu’elle fera ; les intentions vont dans les cadrages.
- Nommer les choses comme l’application les nomme (« joker », « Gardien », « ouvrage », « plan », « borne »).
- Les pages décrivent les écrans en mots ; les **captures d’écran** les illustrent, sans les remplacer. Elles ne se font pas à la main : `npm run docs:captures` lance le jeu dans Chromium (Playwright), le joue avec des parties préparées (`scripts/docs/captures.mjs` : le début, le milieu et la fin des Basses Terres, à 10 h 30, avec un hasard à graine fixe) et enregistre les images dans `docs/_captures/`, commitées. Une capture se cite `![ce que montre l’image](/captures/nom.jpg)`, avec un texte de remplacement qui décrit l’écran ; le build échoue si l’image n’existe pas. Quand un écran change, relancer le script (tout, ou quelques captures : `npm run docs:captures -- carte menu`) et relire les images.
- Les tableaux servent aux listes comparables ; les listes à puces aux étapes et aux règles.

## Conventions du dépôt

- Commits et pull requests en français, sans signature d’outil ni mention d’assistant ; auteur des commits : le mainteneur du dépôt.
- Aucune ressource externe dans l’application ni dans la documentation (politique de sécurité stricte, hors ligne garanti).
- Rien d’emprunté : textes originaux ou du domaine public, images, textures et sons générés par le code, noms et créatures originaux.
- Les règles dys ne sont pas négociables : pas de chrono, un item par écran, consigne lue, aide toujours affichée en maths, indice jamais pénalisant, correction qui explique, texte à lire sur fond uni et en police dys, taille ≥ 18 px, interlignage ≥ 1,5.
- Les changements de contenu (exercices, quêtes, exclusions du référentiel) sont relus par l’agent `directeur-contenu-pedagogique`, ceux de style ou de game design (univers, progression, récompenses, textures, polices) par l’agent `directeur-artistique`, avant fusion (voir [Les deux agents](#les-deux-agents)).

## Signaler un problème

Ouvrir un ticket sur GitHub avec : l’appareil et le navigateur, la version (Réglages → Application), la page ou l’exercice concerné (l’identifiant, par exemple `carriere-coffre-2`, figure sur la page de l’île dans la documentation), et ce qui était attendu.
