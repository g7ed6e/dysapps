# Séparer le jeu du rendu

Ce document est un **plan**, construit étape par étape ; l’état de chaque étape est dans l’[état des chantiers](../pilotage/chantiers.md#séparer-le-jeu-du-rendu-j). Ses trois décisions ont été prises par le mainteneur le 28 septembre 2026 (§5). Il décrit comment isoler complètement la logique du jeu de son dessin, pour qu’une même logique serve trois rendus :

- le **monde par cases** (Blocland) en **3D** (`src/game/three/`) ;
- le même monde par cases en **2D** (`src/game/pixel/`, retirée le 5 octobre 2026 (mot du mainteneur : « Oui on retire la 2d »)) ;
- un mode où **les distances sont abstraites** (Archipéo) : tout le monde devient un réseau ; chaque île est un lieu, une maquette posée sur la mer, reliée aux autres par des liaisons, et le bonhomme ne marche plus.

La vue simple (les pages HTML de Blocland) en est un quatrième consommateur : elle joue déjà tout le jeu sans aucune géométrie, preuve que la logique n’a pas besoin de cases.

Les règles de la migration valent ici : **la séparation ne touche ni aux sauvegardes ni aux identifiants (les mots neutres de la sauvegarde), les blocs restent la ressource.** Chaque étape se livre seule, testée, et sans changer une seule image, sauf J6, qui ajoute le mode abstrait derrière un drapeau.

## 1. Ce qui existe déjà

Quand ce plan a été écrit (28 septembre 2026), les vues 3D et 2D partageaient déjà un contrat (`world/view.ts`) et une simulation (`world/scene.ts`), et les règles étaient presque sans distance ; `WorldPage.tsx`, `world/terrain.ts`, le contrat des vues et le moteur mêlaient encore les règles et la grille. J0 à J5 et D ont levé ces mélanges ; le relevé de départ reste dans l’historique git de cette page.

## 2. La cible : trois couches

```
          ┌──────────────────────────────────────────────┐
          │ Le jeu (règles, état, sauvegarde)             │  sans coordonnées
          │ engine, archipelago, plans (fiches), vehicle, │
          │ villageStage, islandState, goals, whale…      │
          │ + le modèle du monde + la machine du voyage   │
          └───────────────┬──────────────────────────────┘
                          │ modèle du monde (identifiants, états)
                          ▼        ▲ intentions (île touchée, case d’un plan…)
          ┌──────────────────────────────────────────────┐
          │ La disposition : où sont les choses           │
          │  grille  : terrain, map, harbour, paths       │
          │  réseau  : îles en lieux, liaisons (Archipéo) │
          └───────────────┬──────────────────────────────┘
                          ▼
     ┌───────────┐  ┌───────────┐  ┌──────────────────────┐
     │ 3D (three)│  │ 2D (pixel)│  │ Archipéo (réseau)     │   + la vue simple, sans disposition
     └───────────┘  └───────────┘  └──────────────────────┘
```

### 2.1 Le jeu

Des fonctions pures, sans coordonnée du monde, sans React ni Three.js :

- **L’état et ses règles** : ce que fait déjà `engine.ts` (étoiles, blocs, répétition espacée, ouvrages, lancement du navire, migration des sauvegardes) et les modules de règles de `world/`.
- **Le modèle du monde** (nouveau, `modeleDuMonde(état, progression, archipel)`) : tout ce qui existe dans un archipel et son état, en identifiants : les îles (ouverte, état, nom), les bornes de mission (à faire, étoiles, fermée), les lieux du village, les ouvrages (construit, à construire, fantôme), les plans en chantier et leurs cases posées, les monuments, le navire et son étape, les créatures, les Gardiens, l’étape du village, où se tient le bonhomme. C’est ce que la vue simple affiche déjà en listes.
- **Les gestes deviennent des intentions** : une vue ne renvoie plus que des intentions typées (`île`, `borne`, `lieu`, `ouvrage`, `créature`, `navire`, `case d’un plan`, `entrée dans une île`, `fin du voyage`, `voyage sauté`), et le jeu décide. La machine du voyage (embarquer, partir, arriver, débarquer) sort de `WorldPage.tsx` en fonction pure.
- **Les cases d’un plan sont celles du plan**, jamais du monde : une construction garde sa petite grille à elle (c’est ce qui fait « des blocs posés »), mais sa place dans le monde n’entre plus dans le calcul de ses clés. L’origine de chaque plan (île, navire, monument) est **figée** dans une table de constantes, égale au calcul d’aujourd’hui (un test le vérifie) : les clés de sauvegarde restent identiques, et une disposition peut ensuite poser le chantier où elle veut.

### 2.2 La disposition

Une interface, deux réalisations. Elle dit **où** sont les entités du modèle, jamais ce qu’elles valent :

- `placeDe(entité)` : un **ancrage** (une île, et un point dans le repère de cette île) ;
- `versMonde(ancrage)` : le point du monde où le dessiner (une matrice par île, calculée une fois, pas à chaque image) ;
- `trajet(depuis, vers)` : une suite d’ancrages et sa durée ;
- `liaison(ouvrage)` : la forme d’un ouvrage entre deux îles ;
- `cadrage(île)`, `étendue()`, `îleEn(point)` : la caméra, la Carte, le toucher.

La **disposition en grille** enveloppe les fonctions de `terrain.ts`, `map.ts`, `harbour.ts` et `paths.ts` : c’est le monde d’aujourd’hui, à l’identique, pour la 3D et la 2D.

La **disposition en réseau** (Archipéo, distances abstraites) s’applique **au monde entier** (décision du 28 septembre 2026) :

- Chaque île est un **lieu**, placé librement sur la mer : une maquette de l’île, avec son relief, son décor, ses bornes, ses lieux du village et ses chantiers, sans grille de marche.
- **On touche pour agir, on ne marche pas** : toucher une île y mène ; toucher une borne, un lieu, un chantier ou le navire l’ouvre directement. Le bonhomme se tient à l’île où il est, sans trajet à pied.
- Entre deux îles, un **trajet court par la liaison** (il passe le pont, une barque passe le bac), qu’un toucher saute ; « Réduire les animations » le remplace par un fondu.
- Une **liaison** est une courbe (un pont, un bac, une passerelle) dont la longueur à l’écran ne suit plus un nombre de cases ; son coût en blocs et sa condition ne changent pas.
- **La construction reste en blocs posés case par case** : un plan garde ses cases (celles de la sauvegarde), dessinées à la place du chantier sur la maquette.

Les mêmes gestes donnent les mêmes intentions dans les trois rendus (toucher une île, une borne, un chantier) : seul le trajet change. La vue simple ne change pas.

Pour que les maquettes du réseau réutilisent le terrain à facettes, le décor et la construction des lots R, la géométrie d’une île se génère **dans le repère de l’île** (origine au coin de son cœur), puis la disposition la place. Seuls la mer, les ouvrages et les îlots (Gardiens, monuments) restent « entre les îles », chacun rattaché à un ancrage.

### 2.3 Les rendus

Une vue reçoit le modèle du monde, la disposition et le moment (jour, nuit, animations réduites), et renvoie des intentions. Les trois vues partagent le même contrat. **Tout ce qui s’affiche de l’archipel est fusionné en peu de maillages** après `versMonde`, en cuisant la place de chaque île dans les sommets, jamais un maillage par île : le budget d’Archipéo (60 000 triangles, 40 appels de dessin par archipel) vaut pour les deux dispositions, et `world/budget.test.ts` s’étend au réseau. Le toucher retrouve l’entité par un tableau face → entité, comme le sol à facettes aujourd’hui.

### 2.4 Où vivent les fichiers

Les couches se tiennent par un **test des dépendances** (`world/couches.test.ts` : un module de règles n’importe ni la grille ni le dessin ; la grille n’importe ni React ni un rendu), qui liste les exceptions restantes et échoue si une nouvelle apparaît. Les fichiers n’ont pas encore déménagé : J7 les rangera en une fois, en déplacements purs, et rendra ce test strict :

```
src/game/
  jeu/          règles, état, modèle du monde, machine du voyage (sans coordonnées)
  disposition/  grille/ (terrain, decor, map, harbour, paths, ground) et reseau/
  world/        ce que les rendus partagent : palette, style, landMesh, décor, étiquettes, budget
  three/        la 3D
```

## 3. Les étapes

Chaque étape est une pull request, sans changement d’image, sauf J6. La preuve : les tests d’empreinte de J0 restent verts, et les captures du monde, comparées à celles de `main` (workflow « Captures d’un lot » sur la CI, ou `npm run rendu:mesures -- --comparer` en local : voir le skill [`captures`](../../.claude/skills/captures/SKILL.md)), ne montrent aucune vue changée.

| Étape | Contenu | Quand |
| --- | --- | --- |
| **J0. Les filets** | `world/empreintes.test.ts` : l’empreinte de ce que calcule la grille, pour chaque archipel et trois parties (vierge, à mi-parcours, tout construit) : cubes, cubes avec créatures, décor posé sur la pente, sol en facettes et lave, créatures et Gardiens, navire, trajets du bonhomme depuis le port ; la place des îles, des bornes, des lieux et du bonhomme ; les ouvrages, les embarquements et les voyages ; les clés des cases de chaque plan. Si une empreinte change, le monde a changé : un lot qui le veut met à jour l’instantané (`npx vitest run -u src/game/world/empreintes.test.ts`) et le dit. `world/couches.test.ts` : le test des dépendances (règles, grille, contrat commun, dessin), avec les exceptions d’aujourd’hui, leur motif et l’étape qui les retire. `world/disposition.ts` : les types `Entite`, `Ancrage`, `Disposition` et `Intention`, sans usage. | Maintenant, en parallèle de R3 |
| **J1. Les règles sans géométrie** | Les origines des chantiers hors de la zone des plans sont figées dans `world/plans.ts` (`ORIGINE_DU_QUAI`, `ORIGINE_DES_MONUMENTS`), sans migration : les clés restent exactement les mêmes, ce que vérifient un test d’égalité avec le calcul depuis le quai et l’îlot, une sauvegarde tout construite relue par `sanitizeState` sans perdre une case, et les empreintes de J0. `world/archipels.ts` range l’identifiant des archipels, leur ordre et l’archipel d’une île avec les règles (`map.ts` les réexporte). L’état d’un Gardien (`guardianStatus`) passe dans `boss.ts`, l’étape du navire en chantier dans `world/vehicle.ts` (`stageBuildingAt`). Le moteur, les ouvrages, les plans et les monuments ne dépendent plus de la grille. Restent au rangement (J7) : les noms d’icônes (des types) dans les données des îles et des états d’île, et le nombre d’items par écran que lit le défi du Gardien. | Maintenant, en parallèle de R3 |
| **J2. Le modèle du monde** | `world/modele.ts` : `modeleDuMonde()` dit, en identifiants et sans une case, les îles d’un archipel (ouvertes ou non, leur état), ses bornes de mission (à faire, étoiles, fermée) et la prochaine destination ; les décisions du jeu quand l’élève touche le monde (`borneTouchee`, `ileDeLOuvrage`, `capVers`) et la machine du voyage (`nouveauVoyage`, `embarquer`, `versLArrivee`, `finDuTemps`, `voyageAJouer`) sont des fonctions pures, testées dans `modele.test.ts` contre l’ancien calcul de la page. `WorldPage.tsx` les lit au lieu de décider lui-même ; il ne garde que la place des bornes en cases (la grille, J3). Les vues ne changent pas. | Après la fusion de R3 |
| **J3. La disposition en grille** | `world/grille.ts` : `dispositionEnGrille()` réalise l’interface `Disposition` en enveloppant `terrain.ts`, `paths.ts` et `monuments.ts` : la place des îles, des bornes, des lieux, des ouvrages et des monuments, où se tient le bonhomme (`seTenir`, ajouté à l’interface), ses trajets d’île en île ou jusqu’à la porte d’un lieu et leur durée, le tracé d’un ouvrage, le cadrage, l’étendue et l’île sous un point. `WorldPage.tsx` et `world/scene.ts` (durée de marche, clavier, toucher) passent par elle ; `grille.test.ts` compare chaque réponse au calcul d’avant. Jusqu’à J5, le repère d’une île est celui du monde (`versMonde` rend le point tel quel). Les types `Cell` et `CreaturePlacement` passent dans `paths.ts` (le contrat des vues les réexporte), et `disposition.ts` rejoint les règles : le jeu dit ce dont il a besoin. `terrain.ts` ne change pas. | Après les trois préalables de R4, avant le corps de R4 |
| **J4. Le contrat des vues** | Les gestes d’une vue deviennent des intentions : `WorldViewProps` n’a plus qu’un `onIntent` (île, borne, lieu, ouvrage, créature, navire, face en chantier, fin d’un temps du voyage, voyage sauté) et `chantier`, à la place de dix rappels ; `WorldPage.tsx` reçoit l’intention et décide. Les deux vues tirent leurs rappels de `onIntent` en tête de rendu (`rappelsDeLaVue`), leur intérieur ne change pas ; la 2D ne décidait plus d’entrer dans une île, elle le demandait (`entree`), et la page vérifiait qu’elle était ouverte ; l’intention `entree` est partie avec la marche libre, retirée juste après. L’intention `face` reste en cases du monde jusqu’à J5. **Reportés à J5**, où ils prennent leur sens : les positions passées aux vues en ancrages plutôt qu’en cases (tant que le repère d’une île est celui du monde, `versMonde` ne ferait que les recopier) et les cubes du contrat. | Juste après J3, **avant** la découpe D de `WorldCanvas.tsx` |
| **D. La découpe de la scène 3D** | `three/WorldCanvas.tsx` éclaté sans changement d’image en modules `three/cubes.ts`, `navire.ts`, `bornes.ts`, `personnages.ts`, `lumiere.ts` (qui expose le degré de nuit), `brume.ts` et `etiquettes.ts`, chacun avec `animer(t, dt, reduit)` et `dispose()` ; la boucle d’animation ne fait plus qu’itérer (décidé le 28 septembre 2026, cadrage Archipéo, « Les fils de la piste Rendu »). S’y ajoutent `large.ts` (la mer, les nuages, les oiseaux, les baleines), `camera.ts` (le cadrage), `maillage.ts` (les maillages et matériaux partagés) et `partie.ts` (le contrat des parties, l’instant de chaque image, les dernières props). La boucle fait d’abord avancer ce qui bouge (`deplacer` : le bonhomme, puis le navire), puis anime le reste dans un ordre fixe : personnages, caméra, bornes, brume, lumière, large, navire, cubes, étiquettes. Vérifié par des captures avec « Réduire les animations », sur `main` et sur la découpe, dans le monde en blocs et dans Archipéo : seuls diffèrent les repères qui flottent même animations réduites, comme d’une capture de `main` à l’autre. | Juste après J4 |
| **J5. Chaque île dans son repère** | `terrain.ts` : `cubesDeLIle(id)` rend les cubes d’une île (sol, paysage, décor, bornes, lieux, îlot du Gardien, créature, plans) en cases depuis le coin de son cœur, z depuis son altitude ; `worldCubes` pose chaque île à son origine (`origineDe`) puis ajoute ce qui est entre les îles (le port, les îlots des monuments, la mer habillée, les ouvrages) ; `portsDAttache(id)` dit où chaque ouvrage touche l’île, dans son repère, pour la côte de R4b. Le repère d’une île sépare deux choses : le relief de disposition (le cœur, la terre, les pics de `silhouettes/` que `map.ts` lit par `silhouetteDe`), commun à tous les univers puisque la marche, les plans et les sauvegardes en dépendent, et le modelé dessiné (facettes, décor en primitives, côte), propre à chaque univers, qui se pose sur ce relief sans le changer. La disposition en grille rend des ancrages vraiment locaux : `versMonde` ajoute l’origine de l’île, `versIle` fait l’inverse. Les positions passées aux vues (le bonhomme, les bornes, la flèche, le chemin à construire, les éclats, le point cadré) sont des ancrages, que `useEnCasesDuMonde.ts` passe en cases du monde pour la 3D et la 2D ; les créatures et le navire suivent avec R6 et R5. L’intention `face` arrive avec son île, en cases du plan (celles de la sauvegarde) : `rappelsDeLaVue` la passe du monde au repère de l’île par la disposition en grille, dont le contrat des vues dépend donc (une vue en réseau donnera ses faces directement en repère d’île). Les types du monde en cubes passent de `Voxel.tsx` à `world/cube.ts`, `AVATAR_HOME` d’`Avatar.ts` à `terrain.ts`, et « un archipel du ciel » devient `DANS_LE_CIEL` dans `map.ts` : huit exceptions de `couches.test.ts` tombent. Les modèles des créatures et des Gardiens sortis des composants React passent à R6, dont c’est le premier commit. | Après D, **avant** R4b (avancé le 28 septembre 2026 : R4b en quatre sous-lots ferait attendre J5, donc R5 et R6) |
| **J6. La disposition en réseau** | Le mode à distances abstraites, derrière `?rendu=archipeo&disposition=reseau` : le monde entier en lieux (maquettes d’îles sans marche, gestes directs), liaisons en courbes, trajet court par la liaison, cadrage, Carte et voyage recalculés ; budget vérifié ; captures ajoutées à `scripts/www/captures.mjs`, manuel inchangé tant qu’il n’est pas ouvert aux élèves. Seule étape qui change l’image, et seulement sous son drapeau. | Avec les lots 8 et 8b (décision du 28 septembre 2026) |
| **J7. Le rangement** | Les dossiers `jeu/`, `disposition/` et le reste en déplacements purs ; le test des dépendances devient strict, sans exception. | Après le lot 6 |

Une étape à la fois : chacune attend la fusion de la précédente.

## 4. Les pièges

- **Les appels de dessin** : un maillage par île ferait exploser le budget. Tout se fusionne par archipel après `versMonde`.
- **Le toucher** : il rend toujours une entité (une île, une borne, un ouvrage, une case d’un plan), jamais une case du monde. En réseau, toucher la mer ou une liaison rend l’ouvrage.
- **La marche** : elle n’existe qu’en grille. En réseau, le bonhomme passe d’un lieu à l’autre par un trajet court le long de la liaison ; ni grille de marche ni marche libre. `world/scene.ts` sépare donc le trajet (commun) de la marche case à case (propre à la grille).
- **Le voyage** : le départ et l’arrivée supposent un quai en coordonnées du monde ; ils passent en ancrages, et la durée d’une traversée ne dépend plus d’une distance en cases.
- **La 2D peinte** : sa projection et son découpage en tuiles aiment une grille. Le réseau est d’abord un rendu 3D ; la vue 2D est retirée du code depuis le 5 octobre 2026 (l’historique git la garde).
- **Les sauvegardes** : la séparation n’en migre aucune. Elle ne change aucun identifiant (îles, ouvrages, plans), et les clés des plans restent en cases du plan, avec des origines figées.
- **Les captures de la documentation** : J0 à J5 et D n’en changent aucune ; J6 en ajoute sous son drapeau.
- **Les performances** : `versMonde` se calcule une fois par île (une matrice), pas à chaque image pour chaque objet.

## 5. Les décisions

Le mainteneur a tranché le 28 septembre 2026 :

| Question | Options | Décision |
| --- | --- | --- |
| **Jusqu’où va l’abstraction ?** | (a) le monde entier, des îles en lieux sans marche ; (b) deux échelles, l’île sur la grille et la mer en réseau (recommandé par le directeur artistique) ; (c) rien de plus que la carte des quatre archipels du lot 8b | **(a) le monde entier.** Le directeur artistique recommandait (b) : un mode tout abstrait, à côté de la grille, fait changer le trajet en changeant de rendu. La parade : les mêmes gestes donnent les mêmes intentions partout, et la construction reste case par case. |
| **Quand ?** | (a) avant le lot 6 ; (b) J0 à J5 maintenant, entre les lots R, et la disposition en réseau avec les lots 8 et 8b ; (c) tout après le lot 8 | **(b).** Le lot 6 s’ouvre en grille. |
| **Entre deux îles, que voit l’élève en réseau ?** | (a) il marche le long de l’ouvrage ; (b) un trajet court par la liaison, qu’on peut sauter ; (c) un fondu | **(b).** « Réduire les animations » le ramène à (c). |

Pour plusieurs univers (Archipéo et Blocland au choix de l’élève, chacun avec son récit, son rendu et l’habillage de ses énoncés, sur le même jeu), la feuille de route [Plusieurs univers](../univers/univers.md) ajoute à ce plan une note en J5, l’objet `Habillage` en J6, une couche `univers` en J7 et une étape J8 (les textes d’Archipéo sortis en données, sans changement d’image) ; elle n’en change aucune décision. Les noms se recoupent : dans ce plan, J6 est la disposition en réseau et J7 le rangement en `jeu/` et `disposition/` ; dans Plusieurs univers, « J6 » et « J7 » désignent ce qui s’y ajoute (l’objet `Habillage`, la couche `univers`), fait avec U4.

Ce qui reste à cadrer avant J6 est au [pilotage](../pilotage/chantiers.md#séparer-le-jeu-du-rendu-j).
