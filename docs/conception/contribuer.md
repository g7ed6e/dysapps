# Contribuer

Le dépôt est <https://github.com/g7ed6e/dysapps>. Le travail se fait par pull request sur `main` ; la CI lance les tests, la vérification de la page des personnages du pilotage et les deux builds.

## Mettre en route

```bash
npm install
npm run dev        # l'application : http://localhost:5173/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
npm run www:dev   # la documentation (VitePress) : http://localhost:4173/
npm run www:build # construit la documentation dans dist-www/
npm run www:preview # sert dist-www/ tel que publié : http://localhost:4173/
npm run pilotage:personnages # refait docs/pilotage/game-design/personnages.md
npm run www:captures # rejoue le jeu dans Chromium et fait les captures d’écran (www/_captures/, hors du dépôt)
npm run rendu:mesures # appels de dessin, triangles et images par seconde (rendu logiciel) du monde 3D par archipel, poids de Three.js (--captures <dossier> : captures 3D, de jour et de nuit ; --comparer <références> : planches avant/après des seules vues changées ; --attente <s> : temps laissé au plus au monde pour se construire ; horloge de la page pilotée, deux prises du même état donnent la même image)
npm run version:show # affiche la version calculée depuis git
npm run splash     # refait les écrans de lancement d'iPhone et d'iPad (public/splash/)
```

## Ce que contient chaque pull request

1. **Le code et ses tests.** La logique reste pure et testée (moteur, progression, générateurs, données) ; un exercice ajouté est vérifié par les tests de données.
2. **La version** : rien à faire. Elle se calcule depuis git à la fusion (voir [Déploiement](deploiement.md#version)) : la pull request monte la version mineure, ou un autre cran si son message contient `+semver: major`, `+semver: patch` ou `+semver: none`.
3. **La documentation**, dans la même pull request :
   - le **manuel** (`www/manuel/`) mis à jour si un écran, un geste, un réglage ou une règle du jeu change, ses **captures** relues si l’écran montré change (la CI les refait sur `main` ; `npm run www:captures` les montre en local) ;
   - les **principes** et la **conception** (`www/pedagogie/principes.md`, `docs/conception/`) mis à jour si une règle dys, l’architecture, le format des exercices ou le déploiement change ;
   - le **README** cohérent avec le reste.
4. **Le contenu pédagogique** (programmes officiels, archipel, pages des îles, homophones, lecture, maths et anglais du portail, ouvrages, barème) n’a rien à faire à la main : ces pages sont générées au build à partir des données du jeu. Ajouter un exercice, une mission ou une île suffit pour qu’elles apparaissent. Si un nouveau champ de données mérite d’être documenté (une nouvelle aide visuelle, une nouvelle forme d’item), compléter `scripts/www/generate.mjs`.
5. **Le programme officiel** : une mission cite dans `programme` les compétences qu’elle travaille (`src/programme/`) ; une compétence nouvellement couverte quitte `src/programme/exclusions.ts`, une compétence qui perd sa mission y entre avec un motif. Le test de couverture le rappelle. Voir [Le référentiel des programmes](programmes.md).

Une pull request qui ajoute une page au manuel ou à la conception la déclare dans `www/_theme/nav.json` : le build échoue si une page du sommaire manque et signale une page hors sommaire.

## Les agents

Le dépôt fournit huit agents partagés pour Claude Code, dans `.claude/agents/`. Toute personne qui clone le dépôt a les mêmes ; leurs consignes se modifient par pull request, comme le reste. On les sollicite par leur nom (« demande au directeur contenu pédagogique de relire `carriere-coffre-3` ») ou avec `claude --agent <nom>`.

- Le **Directeur contenu pédagogique** (`directeur-contenu-pedagogique`) garantit le programme officiel, les règles dys et la qualité des items. Il cadre un lot de contenu à partir de ce qui reste à couvrir, relit et écrit des exercices, et tient les exclusions du référentiel à jour. Il peut modifier des fichiers.
- Le **directeur artistique** (`directeur-artistique`) est le game designer. Il conduit les [univers](univers.md) et la migration vers Archipéo : il cadre un lot de game design, relit une proposition sous cet angle, garde les règles communes à tous les univers, valide ce que proposent les consultants et tranche entre eux. Il lit et propose, sans modifier de fichier.
- Le **Consultant d’Archipéo** (`consultant-archipeo`) et le **Consultant de Blocland** (`consultant-blocland`) connaissent chacun leur univers en profondeur : noms des lieux, des Gardiens et des constructions, récit, ton, intention du monde. Chacun défend son univers, s’adapte à ce que le jeu commun impose, propose ce qui lui est propre et relit ce qui y touche. Ils travaillent sous l’autorité du directeur artistique, et lisent et proposent sans modifier de fichier.
- L’**artiste technique 3D** (`artiste-technique-3d`) réalise le rendu du monde dans le code : géométrie, modèles dessinés par le code, matériaux, lumière, brume, eau, animations et performances, pour faire passer le monde en cubes au low-poly peint d’Archipéo. Il propose comment obtenir un effet et ce qu’il coûte, écrit le code et ses tests, et montre le résultat en captures. Il peut modifier des fichiers.

- Le **Référent dys** (`referent-dys`) s’assure que le jeu convient à des élèves dys. Il relit tout lot qui touche ce que l’élève voit, entend ou fait, à partir des [principes dys](../../www/pedagogie/principes.md) et des [bonnes pratiques](bonnes-pratiques-dys.md) en vigueur en France. Il rend un avis, sans modifier de fichier.
- L’**Expert frontend** (`expert-frontend`) s’assure que le code est à l’état de l’art pour la pile du dépôt, avec trois priorités dans cet ordre : la sécurité, la performance et la maintenabilité. Il relit toute pull request qui modifie du code à partir des [bonnes pratiques du code](bonnes-pratiques-code.md), lance les contrôles du dépôt et rend un avis, sans modifier de fichier.
- Le **Consultant UX UI** (`consultant-ux-ui`) s’occupe de l’ergonomie et de l’interface des écrans, communes aux univers : parcours, navigation, hiérarchie d’un écran et prochaine action, composants et leurs états, mise en page sur tablette, téléphone, portrait et paysage, retours à l’élève. Il propose l’interface d’un lot, relit ce qui change un écran à partir des [bonnes pratiques UX UI](bonnes-pratiques-ux-ui.md) et rend un avis, sans modifier de fichier. Il travaille sous l’autorité du directeur artistique.

**Le directeur artistique, ou le consultant d’un univers sous son autorité, décide quoi ; l’artiste technique 3D décide comment.** Le premier fixe l’intention (ce que l’élève voit, la palette, les silhouettes, l’ambiance) et relit le résultat ; le second choisit la technique et ne change pas l’intention. Quand une cible coûte trop cher ou demanderait une image importée, l’artiste technique 3D propose d’autres façons d’approcher l’effet : le directeur artistique choisit le rendu, le mainteneur arbitre le budget et les règles du dépôt.

**Chaque univers a son consultant, sous l’autorité du directeur artistique.** Le consultant propose et relit ce qui est propre à son univers ; le directeur artistique garde la vision d’ensemble, la [feuille de route des univers](univers.md) et les règles communes (règles dys, DA-01, DA-02 et DP-06, DP-08, DP-09, DP-12, rien d’emprunté), valide les propositions et tranche entre deux consultants. Toute pull request qui touche les noms, le récit ou le rendu d’un univers passe par son consultant avant d’être ouverte, et sa description en donne le verdict (Fidèle, À ajuster, Bloquant) et ce qui en a été fait ; un changement du jeu commun qui change ce que l’élève voit dans les deux univers passe par les deux. Un avis Bloquant arrête la pull request tant que le directeur artistique ne l’a pas levé ou que le mainteneur n’a pas tranché.

**Le Référent dys est toujours consulté.** Toute pull request qui touche l’interface, les textes affichés, le contenu, le monde (3D ou 2D), les sons, les animations ou les réglages passe par sa relecture avant d’être ouverte, et sa description en donne le verdict (Adapté, À ajuster, Bloquant) et ce qui en a été fait. Il ne tranche ni le game design, ni le contenu, ni la technique : il dit ce qu’un choix coûte à un élève dys et ce qu’il faudrait pour qu’il convienne, et celui qui tient le sujet décide. Un avis Bloquant arrête la pull request tant qu’il n’est pas levé ou que le mainteneur n’a pas tranché.

**L’Expert frontend relit tout le code.** Toute pull request qui modifie du code (application, rendu, scripts, tests, configuration, CI, dépendances) passe par sa relecture avant d’être ouverte, et sa description en donne le verdict (Conforme, À ajuster, Bloquant) et ce qui en a été fait ; un avis Bloquant l’arrête de la même façon. Il ne tranche ni la technique du rendu, que l’artiste technique 3D choisit (il relit son code comme tout code : typage, découpage, fuites de mémoire, tests), ni ce que l’élève doit vivre, que dit le Référent dys (il vérifie que le code le fait : sémantique, focus, clavier, préférences du système).

**Le Consultant UX UI relit les écrans.** Toute pull request qui change un écran, un composant, la navigation ou un parcours passe par sa relecture avant d’être ouverte, et sa description en donne le verdict (Clair, À ajuster, Bloquant) et ce qui en a été fait ; un avis Bloquant l’arrête tant que le directeur artistique ne l’a pas levé ou que le mainteneur n’a pas tranché. Un changement d’habillage seul (couleur, texture, police de titre, nom), sans toucher la structure de l’écran ni la place des éléments, ne passe que par le consultant de l’univers. Il propose et relit l’ergonomie commune aux univers ; le directeur artistique décide, les consultants d’univers gardent l’habillage et les noms, ce qu’est une célébration ou un son revient au directeur artistique (le consultant UX UI en relit la place et la durée), le Référent dys ce que l’élève dys doit pouvoir faire (une règle dys l’emporte toujours), l’Expert frontend et ceux qui écrivent le code la façon de le coder.

Les autres choix techniques (code hors rendu, données, tests, CI, déploiement) reviennent à ceux qui écrivent le code, après l’avis de l’Expert frontend, et sont décrits par [Architecture](architecture.md) et [Déploiement](deploiement.md).

### Qui tient quel document

| Document | Tenu par | Rôle |
| --- | --- | --- |
| [Principes dys](../../www/pedagogie/principes.md) | Contenu | Les règles dys ; une contrainte pour tous les agents |
| [Bonnes pratiques dys](bonnes-pratiques-dys.md) | Référent dys | D’où viennent les règles dys, ce qui reste à surveiller ; il propose aussi les évolutions des principes |
| [Bonnes pratiques UX UI](bonnes-pratiques-ux-ui.md) | Consultant UX UI | L’ergonomie et l’interface des écrans, ce qui reste à surveiller ; il en propose les mises à jour |
| [Bonnes pratiques du code](bonnes-pratiques-code.md) | Expert frontend | L’état de l’art pour la pile du dépôt, ce qui reste à surveiller ; il en propose les mises à jour |
| [Format des exercices](exercices.md), [Référentiel des programmes](programmes.md) | Contenu | Le format des items, la couverture du programme |
| [Cadrage du contenu](cadrage-contenu.md) | Contenu | Les décisions de contenu et la suite à couvrir |
| [Cadrage « De Blocland à Archipéo »](cadrage-archipeo.md), `design/archipeo/` | Consultant d’Archipéo, sous l’autorité du directeur artistique | L’univers Archipéo : la cible de la migration et ce qui reste à décider. Les fichiers importés de `design/archipeo/` restent figés (`PROVENANCE.md`) : un écart s’écrit dans le cadrage |
| [Cadrage du game design de Blocland](cadrage-blocland.md), `design/blocland/fiche.md` | Consultant de Blocland, sous l’autorité du directeur artistique | L’univers Blocland : ses décisions de game design, ses noms, son récit et ce qu’il reprend des lots d’Archipéo |
| [Style](style.md) | Directeur artistique | Le style dessiné aujourd’hui ; l’artiste technique 3D le met à jour quand un lot visuel est construit. L’étiquette git `blocland-reference`, posée juste avant le lot 6, garde le style de Blocland quand cette page passe à Archipéo |
| [Architecture](architecture.md), partie rendu (`world/`, `three/`, `pixel/`) | Artiste technique 3D | Comment le monde est dessiné, en 3D et en 2D |
| [Séparer le jeu du rendu](separation-jeu-rendu.md) | Ceux qui écrivent le code ; l’artiste technique 3D pour la partie rendu | Le plan qui isole la logique du jeu de ses rendus, étape par étape |
| [Plusieurs univers](univers.md) | Directeur artistique pour le récit, le monde et les règles communes, Contenu pour les énoncés, ceux qui écrivent le code pour l’architecture | La feuille de route des univers au choix de l’élève |
| Le manuel (`www/manuel/`) | Celui qui change l’écran | Ce que l’élève voit aujourd’hui |
| Les pages du contenu pédagogique | Le générateur | Produites depuis les données du jeu, jamais écrites à la main |

Une question qui touche aux deux (une mission qui doit produire une conséquence visible dans le monde, le nombre de blocs que rapporte un exercice) se partage ainsi : ce qu’un exercice enseigne, ses items et sa correction relèvent du contenu ; ce que la réussite rapporte et change dans le monde relève du game design. Une décision prise s’écrit dans le cadrage de celui qui la tient.

## Écrire pour la documentation

- En français, au présent, en phrases courtes ; le lecteur est un élève, un parent, un enseignant ou un orthophoniste, pas un développeur (sauf dans la section Conception).
- Décrire ce que l’application **fait**, pas ce qu’elle fera ; les intentions vont dans les cadrages.
- Nommer les choses comme l’application les nomme (« joker », « Gardien », « ouvrage », « plan », « borne »).
- Les pages décrivent les écrans en mots ; les **captures d’écran** les illustrent, sans les remplacer. Elles ne se font pas à la main : `npm run www:captures` lance le jeu dans Chromium (Playwright), le joue avec des parties préparées (`scripts/www/captures.mjs` : le début, le milieu et la fin des Premiers Rivages, à 10 h 30, avec un hasard à graine fixe) et enregistre les images dans `www/_captures/`. Ces images **ne sont pas dans le dépôt** : la CI les refait à chaque publication sur `main`, dans un job à part, avant de construire la documentation ; une pull request ne les fait pas (voir [Déploiement](deploiement.md#le-workflow-github-actions)). Une capture se cite `![ce que montre l’image](/captures/nom.jpg)`, avec un texte de remplacement qui décrit l’écran ; le build échoue si le nom n’est pas déclaré dans `scripts/www/captures.mjs`, et sur `main` si l’image manque. En local, sans captures, `npm run www:build` met une image vide à la place. Quand un écran change, relancer le script en local (tout, ou quelques captures : `npm run www:captures -- carte menu`) pour relire les images ; il n’y a rien à commiter. Le skill du dépôt `.claude/skills/captures/SKILL.md` rassemble, pour les agents, les commandes les plus rapides selon le besoin, les pièges connus (worktree, rendu logiciel) et la publication sur la branche `captures`.
- Les tableaux servent aux listes comparables ; les listes à puces aux étapes et aux règles.

## Conventions du dépôt

- Commits et pull requests en français, sans signature d’outil ni mention d’assistant ; auteur des commits : le mainteneur du dépôt.
- Aucune ressource externe dans l’application ni dans la documentation (politique de sécurité stricte, hors ligne garanti).
- Rien d’emprunté : textes originaux ou du domaine public, images, textures et sons générés par le code, noms et créatures originaux.
- Les règles dys ne sont pas négociables : pas de chrono, un item par écran, consigne lue, aide toujours affichée en maths, indice jamais pénalisant, correction qui explique, texte à lire sur fond uni et en police dys, taille ≥ 18 px, interlignage ≥ 1,5.
- Les changements de contenu (exercices, missions, exclusions du référentiel) sont relus par l’agent `directeur-contenu-pedagogique`, ceux de style ou de game design (univers, progression, récompenses, textures, polices) par l’agent `directeur-artistique`, ceux des noms, du récit ou du rendu d’un univers par son consultant (`consultant-archipeo`, `consultant-blocland`), ceux du rendu du monde (`src/blocland/three/`, `pixel/`, textures, maillage) aussi par l’agent `artiste-technique-3d`, avant fusion ; tout changement de ce que l’élève voit, entend ou fait passe en plus par l’agent `referent-dys`, tout changement d’écran, de composant, de navigation ou de parcours par l’agent `consultant-ux-ui`, et tout changement de code par l’agent `expert-frontend`, avant l’ouverture de la pull request (voir [Les agents](#les-agents)).

## Signaler un problème

Ouvrir un ticket sur GitHub avec : l’appareil et le navigateur, la version (Réglages → Application), la page ou l’exercice concerné (l’identifiant, par exemple `carriere-coffre-2`, figure sur la page de l’île dans la documentation), et ce qui était attendu.
