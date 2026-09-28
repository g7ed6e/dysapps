# Séparer le jeu du rendu

Ce document est un **plan** : rien n’est encore construit. Il décrit comment isoler complètement la logique du jeu de son dessin, pour qu’une même logique serve trois rendus :

- le **monde par cases** (Blocland) en **3D** (`src/blocland/three/`) ;
- le même monde par cases en **2D** (`src/blocland/pixel/`) ;
- un mode où **les distances sont plus abstraites** (Archipéo) : les îles sont des lieux reliés par des liaisons, pas des morceaux d’une grille continue.

La vue simple (les pages HTML de Blocland) en est un quatrième consommateur : elle joue déjà tout le jeu sans aucune géométrie, preuve que la logique n’a pas besoin de cases.

Les règles de la migration valent ici : **les sauvegardes ne sont jamais touchées, aucun identifiant ne change, les blocs restent la ressource.** Chaque étape se livre seule, testée, et sans changer une seule image, sauf la dernière, qui ajoute le mode abstrait derrière un drapeau.

## 1. Ce qui existe déjà

Une partie du travail est faite :

- `world/view.ts` est le contrat commun des vues 3D et 2D (`WorldViewProps` : ce qu’une vue reçoit, les gestes qu’elle renvoie) ; `world/scene.ts` la simulation commune (marche, promenade des créatures, temps du voyage, clavier, toucher) ; un test vérifie que ces modules ne dépendent pas de Three.js.
- Les règles du jeu sont déjà presque sans distance : les ouvrages forment un **graphe** d’îles avec un coût et une condition (`world/archipelago.ts`), l’état d’une île, l’étape du village, le prochain objectif, la baleine se déduisent de l’état (`islandState.ts`, `villageStage.ts`, `destination.ts`, `goals.ts`, `whale.ts`).

Ce qui empêche encore un troisième rendu :

| Où | Le problème |
| --- | --- |
| `WorldPage.tsx` (788 lignes) | Mêle les décisions du jeu (quelle borne jouer, la machine du voyage, l’accès d’un archipel à l’autre, les répliques) et la géométrie de la grille : il appelle directement `worldCubes`, `avatarRoute`, `bridgePath`, `placeDoor`, `monumentCenter`, `islandOrigin`, `walkGround`, `walkPath`. |
| `world/view.ts` | Une vue reçoit des cubes et des cases du monde : `cubes`, `avatar.route`, `trail`, `quests[].cell`, `burst.cell`, `marker`, `focus.spot`, `creatures[].origin`, et renvoie `build.onPickFace(cell, next)` en cases du monde. |
| `world/scene.ts` | La durée d’un trajet se calcule en cases (`walkDuration`, `routeLengths`) ; `groundTap` et `islandInDirection` passent par la position des îles sur la grille. |
| `world/terrain.ts` (2 158 lignes) | Mêle trois choses : la place des îles et des chemins (grille), leur dessin (couleurs, modèles de l’école et des trophées, décor marin, brume, cadrage de la caméra) et des règles (`guardianStatus`, l’étape du navire en chantier, recopiée de `engine.currentStage`). Il importe les modèles des créatures et des Gardiens depuis des composants React (`Creatures.tsx`, `Guardians.tsx`). |
| `engine.ts` → `plans.ts` | Le moteur dépend de la géométrie : les cases d’un plan sont enregistrées en clés « x,y,z » relatives au cœur de l’île, et l’origine d’un plan du navire ou d’un monument se calcule depuis la place du quai (`dockOrigin`) ou de l’îlot (`monuments.ts`, en coordonnées du monde). Déplacer un quai ou un îlot rendrait des clés de sauvegarde invalides. |
| Règles → dessin | `islandState.ts` porte une icône, `vehicle.ts` des couleurs, `budget.ts` les parties du bonhomme ; `archipelagoOfIsland` et `ARCHIPELAGO_IDS`, des règles, sont rangées dans `map.ts`, la grille. |
| Vues → règles | La 2D décide d’entrer dans une île en marche libre (`islandAt`, puis `onWalkedInto`) ; `pixel/oblique.ts` lit l’archipel. |

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

La **disposition en réseau** (Archipéo, distances abstraites) place chaque île librement sur la mer ; une liaison est une courbe (un pont, un bac, une passerelle) dont la longueur à l’écran ne suit plus un nombre de cases, et dont le coût en blocs ne change pas ; un trajet va de lieu en lieu dans l’île puis prend la liaison, en un temps court qu’on peut sauter. **Dans une île, la grille reste** : relief, décor, bornes et chantiers gardent leurs cases (c’est l’avis du directeur artistique, à confirmer par le mainteneur, voir §5).

Pour que la disposition en réseau réutilise le terrain à facettes, le décor et la construction des lots R, la géométrie d’une île se génère **dans le repère de l’île** (origine au coin de son cœur), puis la disposition la place. Seuls la mer, les ouvrages et les îlots (Gardiens, monuments) restent « entre les îles », chacun rattaché à un ancrage.

### 2.3 Les rendus

Une vue reçoit le modèle du monde, la disposition et le moment (jour, nuit, animations réduites), et renvoie des intentions. Les trois vues partagent le même contrat. **Tout ce qui s’affiche de l’archipel est fusionné en peu de maillages** après `versMonde`, en cuisant la place de chaque île dans les sommets, jamais un maillage par île : le budget d’Archipéo (60 000 triangles, 40 appels de dessin par archipel) vaut pour les deux dispositions, et `world/budget.test.ts` s’étend au réseau. Le toucher retrouve l’entité par un tableau face → entité, comme le sol à facettes aujourd’hui.

### 2.4 Où vivent les fichiers

Pendant les lots R, **aucun fichier ne déménage** : un déménagement toucherait tous les fichiers des lots en cours. Les couches se tiennent d’abord par un **test des dépendances** (un module de règles n’importe ni la grille ni le dessin ; la grille n’importe ni React ni un rendu), qui liste les exceptions restantes, comme les exclusions du référentiel, et échoue si une nouvelle apparaît. Quand les lots R sont fusionnés (après le lot 6), les fichiers se rangent en une fois, en déplacements purs :

```
src/blocland/
  jeu/          règles, état, modèle du monde, machine du voyage (sans coordonnées)
  disposition/  grille/ (terrain, map, harbour, paths, ground) et reseau/
  world/        ce que les rendus partagent : palette, style, landMesh, décor, étiquettes, budget
  three/        la 3D
  pixel/        la 2D
```

## 3. Les étapes

Chaque étape est une pull request, sans changement d’image, sauf J6. La preuve : les tests d’empreinte de J0 restent verts, et les captures du monde refaites en local (`npm run docs:captures`, 3D et 2D, jour et nuit) sont identiques pixel à pixel.

| Étape | Contenu | Quand | Fichiers des lots R touchés |
| --- | --- | --- | --- |
| **J0. Les filets** | Tests d’empreinte, pour chaque archipel et trois états (vierge, à mi-parcours, tout construit) : `worldCubes` triés, sommets et couleurs de `landMesh`, `avatarRoute`, `bridgePath`, `boardingRoute`, et les clés de toutes les cases de tous les plans. Le test des dépendances, avec ses exceptions d’aujourd’hui. Les types `Entité`, `Ancrage`, `Disposition` dans un fichier neuf, sans usage. | Maintenant, en parallèle de R3 | Aucun. Le filet sert aussi à R4. |
| **J1. Les règles sans géométrie** | Les origines des plans figées en constantes (le moteur ne dépend plus du quai, de l’îlot ni de la carte) ; `archipelagoOfIsland` et `ARCHIPELAGO_IDS` rangés avec les règles ; l’icône d’un état d’île, les couleurs du navire et les parties du bonhomme sortis des règles ; `guardianStatus` et l’étape du navire en chantier calculés une seule fois, par les règles. | Maintenant, en parallèle de R3 | Aucun (`engine`, `plans`, `archipelago`, `vehicle`, `islandState`, `map` hors paysage). |
| **J2. Le modèle du monde** | `modeleDuMonde()` et la machine du voyage, en fonctions pures et testées ; `WorldPage.tsx` les lit au lieu de décider lui-même. Les vues ne changent pas encore. | Après la fusion de R3 | `WorldPage.tsx` seulement. |
| **J3. La disposition en grille** | La disposition en grille enveloppe `terrain.ts`, `map.ts`, `harbour.ts` et `paths.ts` ; `WorldPage.tsx` et `world/scene.ts` passent par elle (durées de trajet, clavier, toucher). `terrain.ts` ne change presque pas. | Après les trois préalables de R4, avant le corps de R4 | `scene.ts` ; R4 garde son `world/decor.ts` et se rebase sur des signatures, pas sur le décor. |
| **J4. Le contrat des vues** | `WorldViewProps` en entités, ancrages et intentions (`onIntent`) ; les deux vues convertissent les ancrages par `versMonde` en tête de rendu, leur intérieur ne change pas ; la 2D ne décide plus d’entrer dans une île, elle le demande. | Juste après J3, **avant** la découpe de `WorldCanvas.tsx` prévue avant R5 | `view.ts`, les props et le toucher de `WorldCanvas.tsx` et `WorldCanvas2D.tsx`. |
| **J5. Chaque île dans son repère** | La génération par île (`terrain.ts` : cubes, sol, décor en repère local ; les « ports d’attache » d’une île, là où un ouvrage la touche, en entrée pour la côte), fusionnée dans le monde par la disposition en grille ; les modèles des créatures et des Gardiens sortis des composants React. | Après R4b, avant la découpe de `WorldCanvas.tsx` et R5 | `terrain.ts`, `landMesh.ts`. R4b écrit ses reliefs directement en repère local ; `three/cubes.ts` naît en repère d’île. |
| **J6. La disposition en réseau** | Le mode à distances abstraites, derrière `?rendu=archipeo&disposition=reseau` : îles en lieux, liaisons en courbes, trajets de lieu en lieu, cadrage, Carte et voyage recalculés ; budget vérifié ; captures ajoutées à `scripts/docs/captures.mjs`, manuel inchangé tant qu’il n’est pas ouvert aux élèves. Seule étape qui change l’image, et seulement sous son drapeau. | Selon la décision du §5 (recommandé : avec les lots 8 et 8b) | Aucun lot R n’est encore ouvert à ce moment. |
| **J7. Le rangement** | Les dossiers `jeu/`, `disposition/` et le reste en déplacements purs ; le test des dépendances devient strict, sans exception. | Après le lot 6 | Aucun (les lots R sont fusionnés). |

### Ce que ça change pour les lots R

- **R3** (la mer et la faune) : rien. J0 et J1 ne touchent pas ses fichiers.
- **R4** (le décor) : ses trois préalables passent d’abord ; J3 s’intercale avant le corps du lot. Le décor fusionné en un maillage (`world/decor.ts`) ne change pas de forme ; il lit les ancrages quand J4 est là.
- **R4b** (les silhouettes) : les reliefs et repères propres à chaque archipel s’écrivent en repère d’île, ce qui évite de les réécrire en J5.
- **R5** (la construction taillée) : la découpe de `WorldCanvas.tsx` se fait sur une scène déjà « ancrée » (J4 et J5 passés) ; `three/cubes.ts` naît en repère d’île. Les cases d’un plan restent celles du plan.
- **R6** (les personnages) : le bonhomme et les créatures suivent des ancrages au lieu de cases du monde.
- **R7** (la 2D peinte) : déjà fusionné ; J4 ne touche que ses props et son toucher.
- **Le lot 6** s’ouvre en grille. La disposition en réseau ne le retarde pas.

Une étape à la fois, comme les lots R : chacune attend la fusion de la précédente, et celle qui touche un fichier d’un lot R en cours attend la fusion de ce lot.

## 4. Les pièges

- **Les appels de dessin** : un maillage par île ferait exploser le budget. Tout se fusionne par archipel après `versMonde`.
- **Le toucher** : il rend toujours une entité (une île, une borne, un ouvrage, une case d’un plan), jamais une case du monde. En réseau, toucher la mer ou une liaison rend l’ouvrage.
- **La marche** : la grille de marche d’aujourd’hui est continue d’une île à l’autre. En réseau, il faut un graphe de marche par île plus les liaisons, sinon le bonhomme traverse la mer. La marche libre de la 2D n’existe pas entre les îles en réseau.
- **Le voyage** : le départ et l’arrivée supposent un quai en coordonnées du monde ; ils passent en ancrages, et la durée d’une traversée ne dépend plus d’une distance en cases.
- **La 2D peinte** : sa projection et son découpage en tuiles aiment une grille. En réseau, chaque île se peint dans sa tuile et les liaisons en traits ; c’est une reprise notable de `WorldCanvas2D.tsx`, à cadrer avec le directeur artistique si la 2D doit suivre.
- **Les sauvegardes** : aucune migration. Les identifiants (îles, ouvrages, plans) ne changent pas, et les clés des plans restent en cases du plan, avec des origines figées.
- **Les captures de la documentation** : J0 à J5 n’en changent aucune ; J6 en ajoute sous son drapeau.
- **Les performances** : `versMonde` se calcule une fois par île (une matrice), pas à chaque image pour chaque objet.

## 5. Ce que le mainteneur décide

Le directeur artistique recommande **deux échelles** : dans l’île, la grille reste et le cube disparaît ; entre les îles, la mer devient un réseau de lieux et de liaisons. Un troisième rendu qui abstrairait tout le monde, au même rang que la 3D et la 2D, changerait de jeu en changeant de vue (les mêmes gestes ne donneraient plus la même chose) et retarderait l’ouverture du lot 6.

1. **Jusqu’où va l’abstraction ?** (a) le monde entier, des îles jetons sans marche ; (b) deux échelles, l’île sur la grille, la mer en réseau ; (c) rien de plus que la carte des quatre archipels du lot 8b. **Recommandé : (b).**
2. **Quand ?** (a) avant le lot 6, qui recule d’autant ; (b) les étapes J0 à J5 maintenant, sans changement d’image, entre les lots R comme au §3, et la disposition en réseau avec les lots 8 et 8b ; (c) tout après le lot 8. **Recommandé : (b).**
3. **Entre deux îles, que voit l’élève en réseau ?** (a) le bonhomme marche le long de l’ouvrage, comme aujourd’hui ; (b) un trajet court par la liaison (il traverse le pont, une barque passe le bac), qu’on peut sauter ; (c) un fondu, et on y est. **Recommandé : (b)** ; « Réduire les animations » le ramène à (c).

Si (b) est retenu à la première question, le principe de la piste Rendu du [cadrage Archipéo](cadrage-archipeo.md#piste-rendu-derriere-le-drapeau) devient : « Dans l’île, la grille reste et le cube disparaît ; entre les îles, la mer est un réseau de lieux et de liaisons », et le lot 8b s’étend : la Carte de l’archipel et la carte des quatre archipels deviennent une même vue de la mer. Ces changements s’écrivent au cadrage une fois la décision prise.
