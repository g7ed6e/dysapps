# Plusieurs univers, un même objectif

Ce document est une **feuille de route**. Il a été écrit le 28 septembre 2026 à la demande du mainteneur, avant toute ligne de code, puis revu le même jour avec ses décisions (§7), toutes prises. Il dit :

- ce qu’est un jeu à plusieurs univers ;
- ce qu’il faut ajouter au plan de [séparation du jeu et du rendu](separation-jeu-rendu.md) pour le permettre ;
- ce que cela change à la migration vers Archipéo ([cadrage Archipéo](cadrage-archipeo.md), §6) ;
- quand le faire sans freiner cette migration.

**La demande.** Permettre à l’application d’avoir plusieurs univers. Chacun a :

- son récit ;
- son habillage pédagogique : des problèmes de maths et des références littéraires en lien avec l’univers ;
- son rendu : la 3D retravaillée d’Archipéo, ou le monde en blocs de Blocland.

L’élève choisit l’univers selon ses affinités, et **l’objectif pédagogique reste le même**. **La progression est portable** d’un univers à l’autre.

Les cinq agents du dépôt ont été consultés (voir [Contribuer](contribuer.md#les-agents)) :

- le directeur artistique, pour l’univers et le récit ;
- le directeur contenu pédagogique, pour l’objectif commun ;
- l’artiste technique 3D, pour le rendu ;
- l’expert frontend, pour l’architecture ;
- le référent dys, pour l’élève.

Leurs avis sont résumés à chaque section.

## 1. Les mots

« Thème » est déjà pris : les Réglages appellent ainsi les couleurs de l’interface (Crème, Nuit, Clair ; `ThemeChoice` dans `src/core/settings.ts`). La fonctionnalité s’appelle donc **l’univers**, à l’écran (« Univers : Archipéo ») comme dans le code. « Monde » et « aventure » sont pris aussi : « Vue du monde », « Reprendre l’aventure ».

Deux univers au départ :

- **Blocland** : le monde en blocs et son univers d’aujourd’hui, gardé, et **univers par défaut** (décision 7 du mainteneur : les élèves y sont très attachés) ;
- **Archipéo** : l’aventure maritime de la migration, au choix dans les Réglages à partir du lot 6, et seulement là (décision 8).

## 2. L’univers choisit son rendu

**L’univers détermine la vue du monde** (décision du mainteneur). Archipéo se dessine dans la 3D retravaillée des lots R : facettes, puis le réseau de J6 avec les lots 8 et 8b. Blocland se dessine en cubes texturés, comme le monde d’aujourd’hui.

Le réglage « Vue du monde » garde une sortie de secours, commune à tous les univers. C’est un choix d’accessibilité, pas de style (choix par défaut de ce document) :

- **La liste des îles** (la vue simple). C’est la preuve que tout se joue sans dessin, et le refuge d’un appareil qui ne sait pas dessiner.

**Ni Archipéo ni Blocland ne sont en 2D** (décision du mainteneur, 28 septembre 2026). Le choix « Le monde en 2D » a quitté le réglage, et les captures ne font plus de 2D : un appareil qui l’avait choisi retrouve le monde en 3D. **La vue 2D n’est pas un repli de la 3D** (décision du mainteneur, 29 septembre 2026) : un appareil sans WebGL montre la liste des îles, qui offre les mêmes actions. Le code de la vue 2D (`src/blocland/pixel/`, la 2D peinte de R7 comprise) reste en place, sans écran qui l’affiche : il servira de base à un univers dessiné en 2D, s’il en vient un (étape U6). Les captures en 2D reviendront avec cet univers.

Basculer de vue ne change donc jamais d’univers. Seul le réglage « Univers » le fait.

## 3. Blocland reste

Le mainteneur garde Blocland et son univers. Le plan d’Archipéo change sur trois points.

- **Le lot 6.** Il ne retire plus le monde en blocs ni ses textures. Blocland reste l’univers par défaut, et Archipéo s’ouvre à tous dans les Réglages (§7, décisions 5 et 7). Le drapeau `?rendu=archipeo` devient le réglage « Univers » (fait à la bascule avancée : le drapeau ne reste qu’au serveur de développement). « Gardien vaincu » et la statue restent vrais dans Blocland ; les sentinelles qu’on rallume sont celles d’Archipéo.
- **L’interface.** Elle suit l’univers (décision 7). Dans Blocland, les panneaux, les boutons et les titres prennent un style propre à Blocland, dans l’esprit de ses cubes, sans rien copier d’un autre jeu. Dans Archipéo, l’interface reste celle des lots 1 et 2. Les mots, la place des éléments, la taille des cibles et les règles dys ne changent jamais d’un univers à l’autre (§4). Ce style d’interface n’est pas un lot R : « figé dans son dessin » vaut pour le monde en blocs, pas pour ses panneaux.
- **Le budget.** Le monde en blocs ne tient pas celui d’Archipéo sur tablette : 66 672 triangles et 220 appels de dessin aux Premiers Rivages, mesurés après R4, pour 60 000 et 40. Blocland garde son propre plafond de non-régression (80 000 et 240, `budget.test.ts`). Sur un appareil lent, il a « Réduire les animations » et la liste des îles. Le budget d’Archipéo ne change pas.
- **La maintenance.** L’artiste technique 3D le chiffre : garder deux familles de rendu, c’est tester chaque partie de la scène dans les deux univers.
  - Parade : Blocland est **figé dans son dessin**. Il ne reçoit aucun lot R. Il suit les règles du jeu partagé, avec ses empreintes et ses captures d’aujourd’hui (sauf la 2D, arrêtée le 28 septembre 2026).
  - Figé dans son dessin ne veut pas dire figé dans son accessibilité : toute correction d’accessibilité (mode concentration, « Réduire les animations », contraste, cibles) s’applique aussi à Blocland.
  - Chaque lot de jeu qui suit (7 à 10) dit ce qu’il devient dans Blocland. Le lot 8 d’abord : le navire maritime y change les cases d’un plan partagé, et les deux univers relisent la même sauvegarde migrée.

## 4. Ce qu’un univers change, et ce qu’il ne change jamais

### Ce qui ne change jamais : le jeu et la progression

- **Les identifiants et la sauvegarde.** Ne changent pas : les îles, les missions, les exercices, les items (`key`), les plans et leurs cases, les ouvrages, les succès et les adresses.
- **La progression est commune à tous les univers.** Elle comprend les étoiles, les blocs, les plans, le niveau adapté et la répétition espacée (`exerciceId:key`, `review.ts`). Changer d’univers n’y touche pas, et un test le vérifie.
- **La boucle et ses systèmes.** Quatre régions, une par classe. Le village en cinq états. Les étapes du véhicule. Un Gardien par île. Les célébrations sobres.
- **Les mots de l’interface**, repères de l’élève, du manuel et de l’enseignant : Menu, Aventure, Missions, Succès, Réglages, mission, bloc, plan, étoile, XP, Expéditions.
- **Sous chaque nom d’île, des repères stables** : le nom de la mission, la notion travaillée (« Les sons »), l’icône et la couleur de matière, l’ordre des missions.
- **L’objectif pédagogique** (§4.2).
- **L’interface et les règles dys** : la place de chaque élément, ses mots, la taille des cibles, les sons de réussite et d’erreur, rien à lire dans la 3D. Seul son habillage (police des titres, palette, cadres et boutons) suit l’univers (décision 7).

### 4.1 Ce qu’un univers change : son récit et son monde

| Domaine | Ce qui change | Qui décide |
| --- | --- | --- |
| **Les noms** | Les noms des lieux (régions, îles, lieux du village), des Gardiens et des constructions (ouvrages, monuments, véhicule), décision du mainteneur | Le consultant de l’univers, validé par le directeur artistique |
| **Le récit** | Le récit d’ensemble, la figure qui guide (la baleine d’Archipéo, les créatures de Blocland), les créatures et leurs répliques, ce que devient un Gardien (rallumé ou vaincu) | Le consultant de l’univers, validé par le directeur artistique |
| **Le monde** | Le rendu (§2), la palette et l’ambiance, les silhouettes, le décor, les personnages. Jamais le relief qui porte la marche, jamais les cases d’un plan. | Le consultant (quoi), l’artiste technique 3D (comment), le directeur artistique valide |

**Les consultants d’univers** (décision du mainteneur). Chaque univers a son agent, `consultant-<univers>`, sous l’autorité du directeur artistique. Il connaît son univers en profondeur (récit, ton, noms, silhouettes) et le défend. Il sait aussi prendre du recul et s’adapter à ce que les autres univers et le jeu commun imposent. Il propose et relit, sans modifier de fichier.

Le directeur artistique :

- garde la vision d’ensemble et les règles communes à tous les univers : les règles dys, DA-01 (tout se montre à un élève de 3e), DA-02 et DP-06 (le décor ne gêne jamais la lecture), DP-08 (jamais la couleur seule), DP-09 (les récompenses servent le monde), DP-12 (pas de pression inutile) ;
- dit, avec chaque consultant, quelles autres règles valent pour son univers seul : DP-01 et DP-02 (restaurer, jamais combattre) sont celles d’Archipéo, et Blocland garde son Gardien vaincu en statue ;
- tranche entre deux consultants ;
- valide ce qu’un consultant propose.

Chaque nom propre à un univers est vérifié à l’oreille avec la voix française et découpé correctement en syllabes ; aucun nom anglais sans la voix anglaise. Le directeur contenu pédagogique garde l’objectif commun. Le référent dys relit chaque univers. Premiers consultants : `consultant-archipeo` et `consultant-blocland`.

### 4.2 L’habillage pédagogique

Le mainteneur veut que l’habillage aille jusqu’aux phrases de français (décision (a) et (b) du §7). Un univers peut donc habiller :

- **Les problèmes situés**, écrits par des générateurs (`problemes.ts` : `plaine-passeur-1` à `3`, `marche-etals-3`, `marche-balances-3`, `belvedere-pythagore-3`). Les cotes, le calcul et le « ? » unique restent les mêmes. Seul le gabarit de phrase change, et le schéma (`scene`) dessine l’objet de l’univers.
- **Les phrases de français et d’anglais** qui portent un accord, une conjugaison, une fonction ou une compréhension. La phrase change de décor ; le point travaillé, le piège et la règle restent les mêmes. C’est le plus coûteux : 300 à 400 items par univers, chacun relu par le directeur contenu pédagogique et le référent dys.
- **Les textes de lecture et les références littéraires.** Domaine public seulement (auteur mort depuis plus de soixante-dix ans) ou texte original, jamais un personnage sous licence. Mêmes règles que la mission Lecture : texte court, adapté si besoin, mots difficiles donnés avant le texte, lignes numérotées, écoute. Les entrées culturelles du français sont hors du périmètre du référentiel : un extrait d’univers est un bonus de lecture. En anglais, les repères culturels « à couvrir » (`c3.en.culture.imaginaire`, `c4.en.culture.voyages-rencontres`) sont la meilleure piste.

**Ne varie jamais**, quel que soit l’univers : ce que l’élève apprend quand le mot ou le nombre **est** l’objet.

- Les sons, les homophones, les dictées, les familles de mots, les mots-outils.
- Les verbes irréguliers et les faux amis en anglais.
- Le calcul nu et les aides de maths (boîte de dix, droite graduée, fractions en colonne).
- Pour chaque item : la consigne, la réponse, les choix et leur ordre, la règle (`rule-card`), le joker, la correction (`explanation`, `rule`, `why`, `tip`) et le barème.

Aucun univers ne rend un exercice plus facile. Aucun ne donne plus de blocs ou d’étoiles.

**Les garde-fous d’un item habillé**, vérifiés par des tests :

- **Même objectif** : la même mission, le même `programme`, les mêmes niveaux et le même ensemble de `key` ; pour chaque clé, la même réponse, les mêmes choix dans le même ordre et la même règle.
- **Même générateur** : à graine égale, les mêmes cotes, la même réponse et les mêmes pièges.
- **Pas plus long** : le même nombre de mots au plus que l’item de référence, et un mot le plus long qui n’a pas plus de syllabes.
- **Aucun nom propre** dans un énoncé : un nom inconnu est un mot de plus à décoder.
- **Même phrase-clé** : pour qu’un item revu en répétition espacée se reconnaisse d’un univers à l’autre.
- **Une image qui aide**, et qui ne fait jamais douter.

L’item de **référence** est celui d’aujourd’hui : il appartient aux deux premiers univers. Un univers n’écrit que ses variantes, rangées à côté et liées par la clé.

## 5. Ce qu’il faut ajouter au plan de séparation

Le plan [Séparer le jeu du rendu](separation-jeu-rendu.md) fait déjà l’essentiel : un jeu sans coordonnées, des dispositions, des rendus sur un même contrat. Un univers est **un paramètre de la vue et des textes**, jamais une entrée des règles. Quatre ajouts, sans rien refaire :

| Où | Ajout | Taille |
| --- | --- | --- |
| **Après J5** (fusionné le 28 septembre 2026 sans cette séparation) | Le repère d’île sépare le **relief de disposition** du **modelé dessiné**. Le relief de disposition porte la marche, les trajets et les empreintes de J0 ; il est commun aux univers. Le modelé dessiné est propre au rendu, donc à l’univers. Aujourd’hui `silhouetteDe` est lue par `map.ts` : un univers qui changerait le relief changerait la grille de marche. La séparation se fait sans changer d’image, après les sous-lots R4b qui écrivent les silhouettes, et au plus tard avec J7. | S |
| **J6** | La vue reçoit `{ modèle, disposition, univers, moment }`. Le booléen `archipeo` des parties de la scène (`rendu === 'archipeo'`, testé dans une quinzaine de modules) devient un objet `Habillage`. Il est passé une fois à la construction de chaque partie. Blocland en est un, Archipéo l’autre. **Construit avec U4** (`src/blocland/habillage.ts`), sans changement d’image. | M |
| **J7** | Rangement de `world/habillage/<univers>/` : palette, formes, silhouettes dessinées, fiche de famille. Le test des couches (`couches.test.ts`) gagne une couche `univers` : le jeu et la disposition n’importent ni habillage ni univers. **Fait avec U4** : les habillages dans `world/habillage/` (un fichier par univers), et la couche `univers` (textes, habillage, palette, modelé dessiné). La palette, les formes et le modelé dessiné restent à leur place tant qu’ils ne servent qu’à Archipéo : ils rejoindront `world/habillage/` avec les registres à clé (univers, archipel) ci-dessous. | S |
| **J8. L’habillage** (nouvelle étape) | Déplacement pur des textes d’univers vers `src/univers/<id>/` : ceux de `biomes.ts`, des états d’île, des répliques des créatures et du mot de la baleine. Les empreintes, les captures et les pages générées restent identiques. C’est le même mouvement que les noms d’icônes laissés par J1 au rangement. Les répliques des créatures et les mots des états d’île y sont depuis U4 (`src/univers/communs.ts`). | M |

### L’architecture d’un univers (avis de l’expert frontend)

- **Sécurité.** Un univers est un **module TypeScript du dépôt**, relu en pull request. Jamais un fichier chargé à l’exécution, jamais un fichier fourni par un tiers ou par l’élève. Il contient du texte brut seulement, affiché par React : ni HTML, ni Markdown interprété, ni adresse. Les couleurs sont validées par un test, contraste AA compris.
- **Rangement.** `src/univers/<id>/index.ts`, typé `Univers` avec `satisfies`. Ses clés sont **dérivées** des identifiants stables : `Record<BiomeId, …>`, missions, ouvrages, Gardiens, plans. Il les habille sans les remplacer. Aucune règle ne l’importe.
- **Le choix** est une **préférence d’appareil**, rangée dans `Settings` à côté de `worldView`.
  - Aucune migration. Un champ absent vaut Archipéo pour un appareil sans progression. Pour un appareil qui a déjà une progression au lot 6, il vaut Blocland (décision 5) : l’élève ne découvre pas, sans l’avoir choisi, des noms tous nouveaux.
  - Pourquoi une préférence d’appareil plutôt qu’un champ de la sauvegarde : la progression est elle-même enregistrée sur l’appareil, sans export ([Questions](../../www/manuel/questions.md)). Les deux voyagent donc ensemble. Le jour où un export de la progression existera, l’univers partira avec elle, pour qu’un élève n’ait pas deux jeux de noms au collège et à la maison.
  - `sanitizeSettings` remplace un univers inconnu par Archipéo sans planter.
  - Un test relit une même sauvegarde sous les deux univers et obtient le même état : c’est la portabilité de la progression.
- **Performance.**
  - Un `import()` par univers. L’univers par défaut reste dans le paquet principal, sans attente au démarrage.
  - Les textures et la 2D en pixels de Blocland ne se chargent que pour Blocland.
  - Le service worker met tout en cache. Au-delà d’un poids à mesurer (`npm run build`), seul l’univers choisi est mis en cache, avec Archipéo en repli hors ligne.
- **Parité.** Chaque univers couvre toutes les clés : le type le garantit en grande partie, et un test vérifie les chaînes vides et les longueurs. Les tests d’équivalence du §4.2 couvrent chaque item habillé.
- **Documentation.** `scripts/www/generate.mjs` produit une page par univers depuis les modules : noms, récit, items habillés. Rien n’y est écrit à la main.

### Dans le rendu (avis de l’artiste technique 3D)

Les registres du socle deviennent à clé composée **(univers, archipel)**, avec un repli sur le commun : `ambianceDe(univers, archipel)`, `FORMES[genre]` résolues par univers, une fiche de famille par univers. Jamais dans les règles, jamais dans les cases d’un plan : un univers change le dessin d’un bloc, pas `architect.ts`. Blocland n’y entre pas avant J7 : il reste sur son code d’aujourd’hui, derrière l’objet `Habillage`.

## 6. Les étapes, et quand

**Aucun travail d’univers n’entre dans les lots R ni dans les fichiers qu’ils possèdent.** Ces fichiers sont `palette.ts` pour R4b, `VoxelCanvas` pour R5, `WorldCanvas2D` pour R6, et, pour le fil de la séparation, la grille, la scène et `WorldPage.tsx`. La migration passe d’abord (décision du mainteneur, calendrier (a)).

| Étape | Contenu | Quand | Taille |
| --- | --- | --- | --- |
| **U0. Cette feuille de route** | Ce document et les décisions du mainteneur (§7). | Maintenant | S |
| **U1. Les consultants** | Les agents `consultant-archipeo` et `consultant-blocland` dans `.claude/agents/`, sous l’autorité du directeur artistique, qui passe de « conduire la migration » à « conduire les univers ». **Qui tient quoi** : le consultant d’Archipéo reprend le dossier `design/archipeo/` et le [cadrage Archipéo](cadrage-archipeo.md) ; celui de Blocland le [cadrage de Blocland](cadrage-blocland.md), qui devient le cadrage de son univers ; le directeur artistique garde les règles communes et ce document. **La référence figée de Blocland** : une étiquette git posée juste avant le lot 6 (`blocland-reference`), puisque `style.md` sera réécrit pour Archipéo ; le consultant en tire une fiche, `design/blocland/fiche.md` (noms, récit, silhouettes, ce que les lots 1 à 5 d’Archipéo ont changé pour tous et qu’il reprend ou non). **Quand on le consulte** : une ligne dans `CLAUDE.md`, comme pour le référent dys : toute pull request qui touche les noms, le récit ou le rendu d’un univers passe par son consultant, et sa description en cite le verdict (Fidèle, À ajuster, Bloquant). La page Contribuer le dit. | **Faite** le 28 septembre 2026 : les deux agents, la ligne de `CLAUDE.md`, la page Contribuer et une première fiche de Blocland. Reste l’étiquette : le fil du lot 6 la pose sur `main` juste avant son premier commit (`git tag blocland-reference` puis `git push origin blocland-reference`), et le consultant de Blocland relit alors sa fiche. | S |
| **U2. Le relief séparé du modelé** | **Construit.** Le relief de marche (`world/silhouettes/`, lu par `map.ts`) reste commun ; le modelé dessiné d’Archipéo s’écrit dans `world/modeleDessine/<archipel>.ts`, en repère d’île, et `modelerLeSol` l’applique au seul sol à facettes, sans changement d’image. | Avancé le 28 septembre 2026 par le mainteneur : avant le relief de R4b-5e et R4b-3e (leur partie 2), par le fil de la séparation ; voir `design/archipeo/intentions/commun.md` | S |
| **U3. Le lot 6 à deux univers** | Blocland reste l’univers par défaut ; Archipéo se choisit dans le réglage « Univers » (décisions 5 et 7). L’interface de Blocland prend son propre style (décision 7). Le drapeau `?rendu=archipeo` disparaît. Rien n’est retiré de Blocland. Bascule faite en avance (décision 10) ; le reste de C suit. Captures du manuel dans les deux univers. Les textes des Gardiens, des espèces et du mot de la baleine entrent déjà dans `src/univers/` (une tranche de J8 avancée). Découpage en fils : [Les fils du lot 6](cadrage-archipeo.md#les-fils-du-lot-6). | **Fait** le 29 septembre 2026 : le manuel montre les deux univers, et le référent dys a relu Blocland et Archipéo aux réglages extrêmes ; ses demandes sur l’écran du défi sont des retouches du directeur artistique (DA-26 et suivantes). | M |
| **U4. L’habillage, sans changement d’image** | J8 : les textes des deux univers dans `src/univers/` (ceux des Gardiens, des espèces et du mot de la baleine y sont depuis le lot 6). Le lexique court et l’écran de passage du §6.1, puisque c’est à U4 que des noms changent (décidé par le mainteneur le 28 septembre 2026). J6 : l’objet `Habillage` à la place du booléen. J7 : la couche `univers`. Le type `Univers` et les tests de parité et de portabilité. Les noms propres à Blocland que le lot 1 avait remplacés y reviennent, si son consultant le propose et que le directeur artistique le valide. | Avec J7, après le lot 6 | M |
| **U5. L’habillage pédagogique de Blocland** | La preuve (décision du mainteneur). Les problèmes situés, puis les phrases de français et d’anglais, puis un ou deux textes de lecture, habillés pour Blocland avec les tests d’équivalence. Le directeur contenu pédagogique écrit, le consultant de Blocland relit l’univers, le référent dys relit tout. | Après U4 | L |
| **U6. Un troisième univers** | Seulement quand U5 a prouvé que l’axe tient. Sa fiche, son consultant, son rendu (un univers complet coûte en art autant que R4b et R6 réunis), son habillage. | Après les lots 8 et 8b | L |

### 6.1 Le choix, côté élève

Le choix se fait **dans les Réglages** (décision du mainteneur). Le risque principal pour un élève dys est que **la même chose ne porte plus le même nom**. C’est contraire aux principes dys (« toujours au même endroit, avec les mêmes mots ») et au critère « aide cohérente » des WCAG 2.2 : l’élève perd ses repères et ne parle plus de la même île que l’adulte. Les conditions du référent dys :

- **Une section « Univers » des Réglages**, qu’un adulte ouvre aussi en deux touchers.
- **Jamais pendant une mission.** Le changement prend effet au retour au village.
- **Trois univers au plus**, chacun avec une icône, un libellé court, une phrase lue à voix haute et un aperçu fixe, sans animation. Rien ne se choisit à la couleur seule. Les aperçus fixes sont reportés après les lots 8 et 8b (mainteneur, 29 septembre 2026 : « aperçus reportés après lot 8/8b ») : un bel aperçu d’Archipéo le mettrait en avant (décision 9) ; d’ici là, l’icône, la phrase lue et la confirmation, qu’on peut défaire, suffisent.
- **Réversible et sans perte.** Une confirmation dit ce qui change (les noms, le récit, le dessin) et ce qui ne change pas (étoiles, blocs, plans, missions). Après un changement, un écran de passage dit « L’île X s’appelle maintenant Y » ; cette liste se relit ensuite depuis le lexique de l’univers. Cet écran et le lexique arrivent avec U4 : au lot 6, aucun nom d’île ne change.
- **Les repères stables du §4** sous chaque nom d’île.
- **Un lexique court par univers**, une dizaine de mots au plus. Chacun est expliqué et lu à voix haute la première fois. Celui de Blocland porte « Bâtie » (une île aux trois plans terminés), qui se dit « Restaurée » dans Archipéo (décidé par le mainteneur le 28 septembre 2026).
- **Aucun texte ne présente un univers comme une aide « pour les dys ».** C’est une affinité, pas une adaptation.
- **Une relecture par univers** du référent dys, sur captures, avec les réglages extrêmes (32 px, OpenDyslexic, voix coupée, « Réduire les animations » de l’appareil ; le Contraste élevé quand il revient, au lot 11 du cadrage Archipéo) et en vue simple. Les invariants du §4 entrent dans les [principes dys](../../www/pedagogie/principes.md) quand U4 les vérifie par des tests.

Un point en faveur de Blocland, à vérifier sur tablette avec un élève dyspraxique : une grille en cubes montre mieux la case touchée que des facettes en pente.

## 7. Les décisions

Le mainteneur a tranché le 28 septembre 2026 :

| Question | Décision |
| --- | --- |
| **1. Le monde en blocs** | **Blocland est gardé**, avec son univers. Il n’est plus retiré au lot 6 : c’est un univers à part entière, et le choix de l’univers détermine la vue. |
| **2. L’habillage pédagogique** | **Jusqu’aux phrases** : les problèmes situés, la lecture et les repères culturels, et aussi les phrases de français (accords, conjugaison, compréhension), avec les tests d’équivalence du §4.2. |
| **3. Le calendrier** | **La migration d’abord** : rien dans les lots R ; la préparation après J5 et avec J7 ; la suite après le lot 6. |
| **4. L’univers de preuve** | **Blocland.** Il existe déjà en dessin : la preuve porte sur la séparation des textes et sur l’habillage pédagogique. |
| **Précisions** | Le choix se fait dans les Réglages. La progression est portable entre les univers. Les noms des lieux, des Gardiens et des constructions varient selon l’univers. Chaque univers a son agent consultant, sous l’autorité du directeur artistique. |

Puis, le même jour :

| Question | Décision |
| --- | --- |
| **5. Quand le réglage « Univers » arrive** | **Au lot 6**, quand Archipéo devient l’univers par défaut (*remplacé le soir même par la décision 7 : Blocland reste l’univers par défaut*). Un appareil qui a déjà une progression reste dans Blocland. Un seul message, lu à voix haute, lui présente Archipéo et le réglage. Blocland garde ses mots d’aujourd’hui jusqu’à U4. |
| **6. Le nom de l’application** | L’application installée s’appelle **« DysApps »** (décision du mainteneur, 28 septembre 2026 au soir, qui remplace « Archipéo, par DysApps ») : un nom neutre entre les univers, avec une icône commune. L’écran titre montre le nom de l’univers choisi. |

Puis, le même jour au soir :

| Question | Décision |
| --- | --- |
| **7. L’univers par défaut** | **Blocland reste l’univers par défaut** : les élèves sont très attachés au monde en blocs. Archipéo se choisit dans les Réglages. L’interface suit l’univers : dans Blocland, elle prend un style propre à Blocland ; dans Archipéo, elle reste celle d’aujourd’hui. Cela remplace « quand Archipéo devient l’univers par défaut » dans la décision 5 : le réglage arrive toujours au lot 6, un appareil neuf s’ouvre dans Blocland sans message, un appareil qui a déjà une progression s’ouvre dans Blocland et reçoit le message unique qui lui présente Archipéo. |
| **8. Où s’active Archipéo** | **Seulement dans les Réglages de l’application**, section « Univers », par l’élève ou un adulte. Rien ne fait passer un appareil à Archipéo d’office : ni la bascule, ni la section Expérimental d’avant le lot 6 (un appareil qui l’avait allumée s’ouvre dans Blocland comme les autres, avec le message unique s’il a une progression), ni une adresse (le drapeau `?rendu=archipeo` disparaît à la bascule). Le message unique ne fait que mener au réglage (« Voir le réglage »). |
| **9. Archipéo n’est pas mis en avant** | **Pour l’instant, aucun écran ne propose Archipéo** (mainteneur, 28 septembre 2026, 20 h 10 : « Ne mets pas en avant Archipéo pour l’instant. ») : le message unique est éteint (`PRESENTER_ARCHIPEO` dans `src/core/univers.ts`), même pour un appareil qui a une progression, et la section Univers des Réglages montre Blocland en premier. Archipéo reste au choix dans les Réglages (décision 8). Cela remplace le message unique des décisions 5, 7 et 8 tant que la décision tient. |
| **10. La bascule avancée** | **La bascule du lot 6 passe avant C et avant les retouches d’Archipéo** (mainteneur, 28 septembre 2026, 20 h 26 : « go bascule avancée », sur la proposition du directeur artistique) : l’écran titre de `main` disait « Archipéo » sur un monde en blocs, et chaque jour des élèves apprenaient le mauvais nom. Elle n’attend que la décision 9 (#211), DA-14 (la barre du haut en OpenDyslexic 32 sur téléphone), DA-15 (le bouton rond de la case choisie), la relecture du référent dys sur ce qui change pour Blocland et le manuel en texte. À la bascule, la section Expérimental disparaît ; un appareil qui l’avait cochée revient au monde en blocs sans message (décisions 8 et 9) ; aucune adresse ne fait passer un appareil d’élève à Archipéo. Archipéo reste au choix, en second, dans Réglages › Univers. Les captures d’Archipéo, les aperçus fixes, `style.md`, DA-8 à DA-10 et le rendu du 3e suivent la bascule. On ne passe pas l’écran titre seul en Blocland : la barre et la bulle diraient encore Archipéo. |
