# Fiche de l’univers Blocland

Cette fiche est la référence de l’univers **Blocland** : le monde en blocs du jeu, gardé comme univers à part entière ([Plusieurs univers](../../docs/conception/univers.md), §3). Elle est tenue par l’agent `consultant-blocland`, sous l’autorité du directeur artistique. Le consultant propose et relit ; le directeur artistique valide.

Elle est tirée de deux états du dépôt :

- **Blocland juste avant le lot 1** d’Archipéo, c’est-à-dire le parent de `07bb03a` (`git show 07bb03a^:<fichier>`) ;
- **l’état actuel**, après les lots 1 à 5.

L’étiquette git `blocland-reference` sera posée juste avant le lot 6. Elle fera foi pour le dessin, car `docs/conception/style.md` sera réécrit pour Archipéo. Cette fiche est à revoir à ce moment-là.

## 1. Les noms

Avant le lot 1, l’application s’appelait **DysApps** et son aventure **Blocland**. Les lots 1 et 2 ont remplacé des noms pour tous les élèves. Aucun identifiant, aucune adresse, aucune donnée de sauvegarde n’a changé.

| Chose | Dans Blocland (avant le lot 1) | Aujourd’hui | Source |
| --- | --- | --- | --- |
| Nom de l’application | DysApps (titre, barre du haut, logo « D », application installée) | Archipéo ; Réglages : « Archipéo, par DysApps » | `index.html`, `src/components/Layout.tsx`, `vite.config.ts`, `src/pages/SettingsPage.tsx` |
| Phrase de l’écran titre | « Français, maths et anglais, à ton rythme. » | « Le savoir construit ton monde. » | `src/components/TitleScreen.tsx` |
| Nom de l’aventure | Blocland (carte du menu, titre de la Carte) | Archipéo | `src/pages/HomePage.tsx`, `src/blocland/BloclandPage.tsx` |
| Retour vers la Carte | « Carte de Blocland » | « Carte d’Archipéo » | `src/blocland/BiomePage.tsx`, `Inventory.tsx` |
| Accueil du tutoriel | « Bienvenue à Blocland ! Le village est en ruine… » | « Bienvenue dans Archipéo ! Le village est en ruine… » | `src/blocland/WorldPage.tsx` |
| Réglage « Au démarrage » | « Le village de Blocland » | « Le village d’Archipéo » | `src/core/settings.ts` |
| Réglage de la vue | « Vue de Blocland » | « Vue du monde » | `src/pages/SettingsPage.tsx` |
| Archipel de 6e | les Basses Terres | les Premiers Rivages | `src/blocland/world/archipelago.ts` |
| Archipel de 5e | les Collines du Large | les Îles Brumeuses | idem |
| Archipel de 4e | les Monts de Feu | les Anciens Ateliers | idem |
| Archipel de 3e | les Îles du Ciel | commun, inchangé (Archipéo le renomme « L’Horizon » au lot 8) | idem ; `cadrage-archipeo.md` |
| Unité de jeu | quête, Quêtes | mission, Missions | tout le code ; `src/components/Layout.tsx` |
| Matières | Français, Maths, Anglais | les mêmes, plus une Expédition chacune : Archives et récits, Mécanismes et énigmes, Cartes et messages | `src/apps/registry.ts` (`SUBJECTS`) |
| Rangs (lot 2) | Bronze, Argent, Or, Platine, Diamant en divisions I à III, puis Légende 1, 2… ; écusson en minerai | cinq rôles : Explorateur, Cartographe, Bâtisseur, Navigateur, Architecte de l’archipel | `src/core/progress.ts` |
| Succès de rang (lot 2) | Rang Argent, Rang Or, Rang Diamant, Légende | Cartographe, Bâtisseur, Navigateur, Architecte de l’archipel (mêmes identifiants `rang-*`) | `src/core/progress.ts` |
| Succès de bâtiments (lot 2) | Bâtisseur, Architecte | Premier bâtiment, Maître d’œuvre | `src/core/progress.ts` |
| Succès de la première partie | Première quête | Première mission | `src/core/progress.ts` |
| Textes d’arrivée en 4e | « Ici, le haut-fourneau de la Forge chauffe jour et nuit. » | ajoute « les vieux ateliers attendent qu’on les rallume » | `src/blocland/arrivals.ts` |
| Monument de 4e | « Tous les Monts de Feu viendront au spectacle. » | « Tout le monde des Anciens Ateliers viendra au spectacle. » | `src/blocland/world/monuments.ts` |

**Communs, inchangés** (vérifiés dans `src/blocland/biomes.ts`, identiques avant le lot 1 et aujourd’hui) :

- les **28 îles** et leurs noms (Forêt des sons, Mine des lettres, Plaine des nombres, Marché des proportions, Phare des fonctions…) ;
- les **28 Gardiens** (le Grand Chêne, le Golem de roche, la Dune vivante, le Hanneton de bronze, le Dragon de cendre, le Colporteur, le Titan d’acier, la Locomotive de fer, le Dragon gallois…) et leurs répliques (`guardianSays`) ;
- les **28 créatures** (Mousso, Tunel, Rouxel, Bloquette, Grimoire, Coco, Nénu, Lavi, Bazar, Ixe, Fi, Knight…) et leurs répliques ;
- les **blocs** et leurs noms (bois, pierre, sable, brique, obsidienne, or, cristal…) ;
- le **Bloc-Navire** et ses étapes : la coque et la voile, le ballon, le réacteur (`src/blocland/world/vehicle.ts`) ; les succès Capitaine, Aéronaute, Pilote du ciel ;
- les **monuments** (le grand moulin, le phare du large, le viaduc, l’amphithéâtre, le temple de marbre…) et les **ouvrages** (pont, bac, sentier, escalier taillé, tunnel, col) ;
- « bâtisseur » pour l’élève, « Gardien vaincu », la **statue** du Gardien vaincu.

Archipéo prévoit d’autres changements, pas encore faits : les Gardiens en sentinelles qu’on rallume (R6, lot 6), le navire maritime (lot 8). Ils ne touchent pas Blocland (univers.md, §3).

## 2. Le récit et le ton

- **Le récit.** Le village est en ruine ; l’élève est le bâtisseur. Chaque exercice réussi rapporte des blocs. Les blocs construisent les ouvrages entre les îles, les bâtiments des créatures, les monuments et le Bloc-Navire, qui mène à l’archipel de la classe suivante ([cadrage de Blocland](../../docs/conception/cadrage-blocland.md)).
- **La figure qui guide : les créatures.** Une par île, qui habite son île, se promène et parle quand on la touche (bulle lue à voix haute). Elle donne la mission, dit ce qui manque devant une île fermée (`lockedHint()`), accueille à l’ouverture de l’île, remercie quand son bâtiment est fini (« J’habite ici maintenant ! »). Avant le lot 5, l’arrivée dans un archipel se disait en deux bulles d’accueil (`src/blocland/arrivals.ts`, via `Tutorial`). Les baleines n’étaient qu’un décor au large.
- **Le Gardien.** Un par île, sur son îlot devant l’île, relié par des pas japonais. Il accepte le défi quand chaque mission de l’île a deux étoiles. Dans l’arène, c’est une grande créature en cubes qui respire, avec une jauge de résistance (jamais de jauge pour l’élève). Il s’incline quand on réussit, gronde doucement quand on rate, « ne compte pas les secondes ». **Vaincu**, il s’écroule, puis devient une **statue de pierre** sur son îlot, un bloc d’or sur un socle devant lui (`src/blocland/boss.ts`, `world/terrain.ts`). On peut le réaffronter : « il aime les revanches ». Blocland garde ce Gardien vaincu en statue (univers.md, §4.1) ; « restaurer, jamais combattre » (DP-01, DP-02) est une règle d’Archipéo.
- **Le ton.** Familier et chaleureux, un peu drôle, jamais menaçant. Les répliques tutoient et appellent l’élève « bâtisseur » : « Je m’écroule… en pierres pour ton village. Bien joué. », « Ce n’est rien : même le vent se trompe de feuille. Continue. » Le Gardien vaincu est un partenaire qui cède, pas un ennemi abattu.

## 3. Le monde

- **Le rendu.** Tout est en **cubes texturés** : le sol, le relief, les falaises, le décor, les bâtiments, les créatures, les Gardiens et le bonhomme (`src/blocland/three/`, `cubes.ts`, `textures.ts`, `personnages.ts` ; `Voxel.tsx`, `Creatures.tsx`, `Guardians.tsx`, `Avatar.ts`). C’est le rendu `blocs`, celui qu’on voit sans le drapeau `?rendu=archipeo` (`src/blocland/rendu.ts`).
- **La 2D en pixels.** Une perspective oblique en pixel art, en Canvas 2D sans bibliothèque : le dessus des cases, une face avant à chaque dénivelé, des falaises à strates, des bords qui débordent en frange, des sprites générés par le code (le bonhomme en quatre directions, les créatures et les Gardiens tirés de leurs propres cubes) (`src/blocland/pixel/` : `oblique.ts`, `tiles.ts`, `sprites.ts`, `characters.ts`).
- **La palette et les textures.** Chaque bloc a une texture de 16 × 16 générée par le code, sans lissage, les mêmes pixels en 3D et en 2D (`src/blocland/world/pixels.ts`) ; ses couleurs de dessus et de côté sont dans `BLOCKS` (`src/blocland/biomes.ts`). Ciel bleu et nuages en cubes. Rien d’emprunté à un jeu existant.
- **Les ambiances.** Une par archipel : mer tempérée, récifs et bancs de sable en 6e ; mer turquoise, ciel froid et plaques de glace en 5e ; bleu profond, brume proche et aiguilles d’ardoise en 4e ; plancher de nuages sans baleine en 3e (`src/blocland/world/daylight.ts`). Jour et nuit selon l’heure réelle, nuit toujours claire.
- **Les silhouettes.** Des îles au relief par classe (mer, collines, monts, sommets), un repère visible de loin par région (grand chêne, champignon géant, volcan qui fume, tour de guet, grand phare, aiguille de glace, haut-fourneau), des bâtiments en six formes (maison, tour, dôme, échoppe, hutte, kiosque, `world/architect.ts`), le Bloc-Navire en cubes, le bonhomme en blocs.
- **L’interface d’avant le lot 2** (pour mémoire) : fond crème à grain pixel, barre du haut en terre et herbe, boutons de pierre à biseau pixel et d’herbe pour l’action principale, bandeaux texturés, écusson de rang en minerai, polices Archivo Black (titres) et Silkscreen (décor), icône en bloc d’herbe isométrique (`git show 07bb03a^:docs/conception/style.md`).
- **Le budget.** Blocland a son propre plafond de non-régression : **80 000 triangles et 240 appels de dessin** par archipel tout construit (`src/blocland/world/budget.test.ts`). Le budget d’Archipéo (60 000 et 40) ne s’applique pas à lui. Sur un appareil lent, il a sa 2D et la liste des îles.
- **Figé dans son dessin, pas dans son accessibilité** (univers.md, §3). Blocland ne reçoit aucun lot R. Toute correction d’accessibilité (mode concentration, « Réduire les animations », contraste, cibles) s’y applique aussi.

## 4. Ce que les lots 1 à 5 ont changé pour tous

Ces lots ont changé l’application pour tous les élèves, donc aussi Blocland. Ce que Blocland reprend ou retrouve est **à proposer par le consultant, à valider par le directeur artistique**. La colonne « Nature » dit seulement ce qui paraît commun d’après univers.md, §4.

| Lot | Ce qui a changé | Nature (univers.md, §4) | Pour Blocland |
| --- | --- | --- | --- |
| **1. Les mots** (`07bb03a`) | Nom Archipéo et sa phrase à l’écran titre ; trois archipels renommés ; « quête » devient « mission » ; Expéditions par matière ; « Vue du monde » | « mission », « Expéditions », « Vue du monde » : communs (mots de l’interface, §1 et §4). Noms des archipels : propres à l’univers (§4.1). Nom de l’application : « Archipéo, par DysApps », l’écran titre montre le nom de l’univers (décision 6) | Retour des Basses Terres, des Collines du Large, des Monts de Feu, de « Carte de Blocland », « Bienvenue à Blocland », « Le village de Blocland » et d’une phrase d’écran titre : à proposer pour U4. Noms des Expéditions : à proposer |
| **2. L’interface** (`4a55637`) | Palette bleu nuit, pétrole, vert d’eau, sable, crème ; panneaux sobres ; Montserrat ; textures et polices pixel retirées de l’interface ; cinq rôles ; icône « A » sur deux vagues | L’interface et les panneaux : communs (§4). Les rôles ne sont pas dans la liste du §4 | Rôles (garder les cinq, ou revenir aux métaux) : à proposer. L’interface de pierre et d’herbe ne paraît pas pouvoir revenir, l’interface étant commune : à confirmer |
| **3a. Le bilan** (`04b5d9c`) | Le bilan dit à quoi servent les blocs gagnés, avec « Voir le chantier » ; célébrations sobres (trois poussières, plus d’éclats d’or, carillon en onde triangle au lieu de la fanfare en onde carrée) | Commun : « les célébrations sobres » et DP-09 (les récompenses servent le monde) | À reprendre tel quel, sauf avis contraire du consultant |
| **3b. Le village en cinq états** (`f288161`) | Abandonné, Réactivation, Reconstruction, Développement, Port, montrés au port en cubes (lanternes, barques, foyer, caisses, fanions, feu) | Le système est commun (« le village en cinq états », §4). Déjà dessiné en cubes | Le système : repris. Les noms des états et leurs phrases : à proposer |
| **4a. Le menu** (`688e201`) | Hiérarchie d’Archipéo : identité, village, « Reprendre l’aventure », progression, trois Expéditions ; les tuiles Missions, Succès, Réglages deviennent des liens | Commun : l’interface et ses mots (Menu, Aventure, Expéditions, §4) | L’identité affichée (nom de l’univers) : à proposer avec U3 et U4 |
| **4b. La Carte** (`5bda9b2`) | États d’île en icône et en mot (Fermée, À explorer, En chantier, Restaurée) ; prochaine destination ; carte SVG des quatre archipels, les non atteints « Dans la brume » | La Carte et les états : système commun. « Restaurée » et « Dans la brume » ont un accent d’Archipéo | Les mots « Restaurée » et « Dans la brume » : à proposer |
| **5. La baleine** (`75fdc3f`) | La baleine parle aux grandes étapes, une fois par appareil, dans « Le mot de la baleine », et passe au large ; elle remplace les bulles d’arrivée | Propre à Archipéo : la baleine est sa figure qui guide (§4.1) | Qui parle aux grandes étapes dans Blocland (une créature, les anciennes bulles d’arrivée, rien) : à proposer |

Les lots R0 à R7 (palette, ciel, terrain à facettes, mer, décor, 2D peinte) sont construits derrière le drapeau `?rendu=archipeo` : ils ne changent pas le dessin de Blocland.

## 5. Ce qui ne varie jamais

Selon univers.md, §4 :

- **Le jeu et la progression** : identifiants, sauvegarde, étoiles, blocs, plans, niveau adapté, répétition espacée, la boucle et ses systèmes (quatre régions, village en cinq états, étapes du véhicule, un Gardien par île, célébrations sobres).
- **Les repères de l’élève** : les mots de l’interface (Menu, Aventure, Missions, Succès, Réglages, mission, bloc, plan, étoile, XP, Expéditions), et sous chaque nom d’île la mission, la notion, l’icône, la couleur de matière et l’ordre des missions.
- **L’objectif pédagogique, l’interface et les règles dys** : rien à lire dans le monde, jamais la couleur seule, aucun univers ne rend un exercice plus facile ni ne donne plus de blocs ou d’étoiles.
