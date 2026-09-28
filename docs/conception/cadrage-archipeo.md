# Cadrage — « De Blocland à Archipéo » (direction artistique et game design)

Document de travail, **décidé le 27 septembre 2026** : le jeu migre de Blocland vers **Archipéo**. La cible est décrite par le dossier de game design et la planche visuelle rangés dans `design/archipeo/` (onze fichiers, `planche-archipeo.webp` et le pack visuel `pack-visuel/`, dont la planche maître `reference/archipeo-visual-identity-board.png` fait foi quand elle diffère de la première planche ; leur provenance est dans `design/archipeo/PROVENANCE.md`). Ce cadrage en tire les grandes lignes, liste les écarts avec le jeu actuel et dit qui tranche. Les lots 1 (les mots), 2 (l’interface) et 3 (mission réussie, le monde change) sont construits ; les décisions sont au §5 et le plan en lots au §6 : le [style actuel](style.md) et le [cadrage du game design de Blocland](cadrage-blocland.md) décrivent toujours l’application en ligne.

L’agent `directeur-artistique` (voir [Contribuer](contribuer.md#les-agents)) conduit cette migration côté game design et direction artistique. L’agent `artiste-technique-3d` la réalise dans le rendu : le directeur artistique décide quoi, l’artiste technique 3D décide comment. Le contenu pédagogique reste au Directeur contenu pédagogique, et les autres choix techniques à ceux qui écrivent le code.

## 1. Le besoin en une phrase

Faire d’un jeu de blocs pour réviser **une aventure maritime où le savoir reconstruit l’archipel**, avec un univers qu’un élève de 3e ne trouve pas enfantin. Promesse : « Le savoir construit ton monde. »

## 2. Ce qu’on garde absolument

- **Les règles dys** de [Principes](../pedagogie/principes.md), sans exception : texte à lire en HTML, sur fond uni, en police dys, lu à voix haute ; pas de chrono ; une action principale par écran ; indice jamais pénalisant ; aucune perte de progression.
- **Rien d’emprunté** : textes, formes, créatures, sons et noms originaux ; aucune ressource externe dans l’application.
- **La boucle qui existe déjà** : jouer, gagner des blocs, construire, ouvrir des îles. Archipéo la raconte autrement, il ne la remplace pas.

## 3. La cible

### 3.1 La boucle

Explorer, découvrir une mission, relever le défi, réussir ou recevoir une aide, gagner une ressource, construire ou réparer, voir le monde changer, explorer plus loin. Une réussite produit, quand c’est pertinent, **une conséquence visible dans le monde** : une passerelle réparée, un phare rallumé, un passage ouvert.

Trois échelles d’objectifs :

| Échelle | Objectif |
| --- | --- |
| Court terme | Réussir une mission |
| Moyen terme | Réparer un bâtiment ou une infrastructure |
| Long terme | Restaurer le village et construire le Bloc-Navire |

### 3.2 Les systèmes

- **Blocs** : récompense, ressource, langage visuel et matériau, cohérents avec l’architecture de chaque île.
- **Village** : le lieu de progression, en cinq états (abandonné, réactivation, reconstruction, développement, port vers l’archipel suivant).
- **Bloc-Navire** : construit morceau par morceau (coque, pont, mât, voiles, instruments, décoration, lancement).
- **Récompenses** : d’abord celles qui servent le monde (blocs, constructions, zones, personnalisation) ; XP, rangs et succès restent peu nombreux.
- **Rangs** : des rôles de l’univers, qui valorisent la progression plutôt que la performance.
- **Personnalisation** (plus tard) : bâtiments, décor, organisation du village, apparence et nom du navire ; jamais d’effet sur la difficulté.

### 3.3 L’univers

- **Le récit** : l’archipel, autrefois relié par des villages, des ponts, des ports et des phares, a été fragmenté ; le joueur le restaure.
- **La baleine** : figure tutélaire, calme, mystérieuse, bienveillante, un peu malicieuse, jamais une mascotte. Elle guide, signale, donne des indices et commente les grandes étapes (« Le mot de la baleine »).
- **Les oiseaux** : ils font vivre le ciel, relient les îles, portent des messages, signalent une zone active.
- **Quatre archipels**, un thème par classe : 6e Les Premiers Rivages (découverte), 5e L’Archipel des Brumes (exploration), 4e Les Anciens Ateliers (maîtrise), 3e L’Horizon (accomplissement).
- **Trois domaines, trois métaphores** : les maths sont les mécanismes, le français les archives, l’anglais les routes maritimes.
- **L’âge** : de la 6e à la 3e, la maturité vient de l’autonomie, de la complexité et de la profondeur (chaînes de missions, exploration moins guidée), jamais d’un ton plus sombre.

### 3.4 La direction artistique

- Aventure maritime stylisée, mystérieuse et chaleureuse : volumes simples, silhouettes fortes, architecture modulaire (bois, pierre, métal, quais, tours, phares), lumière atmosphérique, brume légère, horizon profond.
- Palette de la planche : bleu nuit, bleu pétrole, vert d’eau, sable, crème. La planche maître du pack visuel la donne en valeurs : Nuit océan `#142B38`, Bleu lagon `#178078`, Vert île `#438B82`, Sable `#DAA66A`, Brume `#E5EBE3`.
- Construction (pack visuel, `construction/`) : maisons à colombages aux toits d’ardoise bleue, pontons et quais de bois, grue de bois, phare crème à deux bandes et toit de terre cuite désaturée (`#A8553A`, jamais un rouge vif). Toits : trois quarts d’ardoise (`#2E505E`), un quart de terre cuite (`#C0764A`), dans tous les archipels.
- Interface sobre, contrastée, géométrique, en panneaux opaques derrière l’information ; chaque destination a une icône, un libellé et un état.
- Célébrations élégantes : transformation du décor, son court, lumière ; pas de pluie de confettis.
- À éviter : esthétique préscolaire, mascottes aux gros yeux, pastel partout, boutons-jouets, effets agressifs, écrans chargés.

### 3.5 Les règles qui filtrent toute proposition

Les douze principes de `design/archipeo/design-principles.md` (DP-01 à DP-12) et les cinq règles de `direction-artistique.md` (DA-01 à DA-05). Les plus souvent citées :

- DA-01 : toute illustration peut être montrée à un élève de 3e ;
- DA-02 et DP-06 : le décor ne gêne jamais la lecture ;
- DA-04 et DP-03 : la progression se voit, avec un avant et un après ;
- DP-09 : les récompenses servent le monde ;
- DP-12 : pas de pression inutile.

## 4. Les écarts avec le jeu actuel

| Sujet | Archipéo (dossier, planche) | Aujourd’hui |
| --- | --- | --- |
| Nom | Archipéo | Archipéo, par DysApps, à l’écran depuis le lot 1 ; Blocland reste le nom du module dans le code |
| Style | Low-poly stylisé, lumière atmosphérique | Monde en blocs, textures 16 × 16 en pixels générées par le code ([Style](style.md)) |
| Polices de titre | Montserrat ou Poppins ; textes en Luciole | Montserrat grasse pour les titres et le logotype depuis le lot 2 (avant : Archivo Black et Silkscreen) ; textes dans la police dys choisie |
| Interface | Panneaux sobres, opaques, géométriques ; bleu nuit, bleu pétrole, vert d’eau, sable, crème | Palette et formes d’Archipéo depuis le lot 2 : panneaux aux angles adoucis, bouton principal plein bleu pétrole, plus de texture, de biseau ni de bandeau en pixels ([Style](style.md)) |
| Archipels | Premiers Rivages, Brumes, Anciens Ateliers, Horizon | Premiers Rivages, Îles Brumeuses, Anciens Ateliers (lot 1) ; Îles du Ciel jusqu’au lot 8 ([Blocland](cadrage-blocland.md)) |
| Rangs | Rôles : Explorateur, Navigateur, Bâtisseur, Architecte | Les 5 rôles depuis le lot 2 (avant : Bronze à Diamant en divisions I, II, III, puis Légende) |
| Guide | La baleine, voix de l’univers | Une créature par île (Coco, Bazar, Ixe, Fi…) ; les baleines sont un décor |
| Village | Cinq états, jusqu’au port | Plans et ouvrages, monuments ([Blocland](cadrage-blocland.md)) |
| Vocabulaire | Missions | Missions (lot 1), bornes, ouvrages, plans, Gardiens |
| Bloc-Navire | Maritime, par étapes : coque, pont, mât, voiles, instruments, lancement | Voile, ballon, réacteur ; le 3e est sur un plancher de nuages |
| Gardiens | Restaurer, jamais combattre (DP-01, DP-02) | Un Gardien « vaincu » devient une statue |
| Célébrations | Lumière, son court, transformation du décor (DA-05) | Éclats d’or et caméra qui vole jusqu’à l’île |
| Identité des archipels | Une silhouette par archipel : îles basses et village côtier dense, phare (6e) ; pitons rocheux, passerelles suspendues, brume posée sur l’eau (5e) ; volcan fumant, grues et tours de métal (4e) ; massif enneigé et grand phare (3e) | Des archipels qui se distinguent surtout par leurs couleurs et quelques repères en cubes (glacier et manchot en 5e, plateaux gris et cheminée en 4e) |
| Carte d’ensemble | Les quatre archipels réunis sur une carte en 3D, reliés par les routes du navire | Un archipel à la fois dans le monde ; la carte des quatre archipels est un dessin plat en lecture seule (lot 4b) |
| Exercices | Un problème situé dans l’archipel (« la longueur du pont entre deux falaises »), avec la scène dessinée à côté de la consigne | Des consignes seules ou avec une figure abstraite (triangle, Thalès, tableau) ; aucune ne dessine une scène d’Archipéo |

La planche fixe l’ambiance, la palette et la hiérarchie de l’interface. Elle ne fixe ni le rendu exact ni la mise en page d’un exercice : son écran d’exercice écrit dans le décor 3D, ce que la règle « rien à lire dans le monde » interdit.

## 5. Les décisions

Le mainteneur a retenu le 27 septembre 2026 toutes les recommandations du directeur artistique (le quoi) et de l’artiste technique 3D (le comment) : la colonne « Décision » fait foi. Un point se rouvre ici, avant que le lot qui en dépend soit construit.

| Point | Options | Décision | Lot |
| --- | --- | --- | --- |
| **Nom du jeu** | Archipéo ; DysApps ; Blocland ; Archipéo, par DysApps | **Archipéo, par DysApps** : le jeu s’appelle Archipéo, DysApps reste l’éditeur (Réglages → Application). Blocland quitte l’écran. Le nom de l’application installée change : le journal le dit. | 1 |
| **Nom du 5e** | « L’Archipel des Brumes » (dossier) ; « Les Îles Brumeuses » (planche) | **Les Îles Brumeuses** : c’est la planche, même forme que « Les Premiers Rivages », pas de « l’archipel de l’Archipel ». Pour la même raison, **L’Horizon** pour le 3e, au lot 8 : tant que le 3e est un archipel du ciel, il garde le nom « Îles du Ciel » (un mot change avec ce qu’il décrit). | 1 |
| **Mission ou quête** | Remplacer partout ; garder « quête » | **Mission**, partout d’un coup (écran, manuel, pages générées, succès). « Quête » sonne fantasy, « mission » est le mot du dossier. Les adresses ne bougent pas. | 1 |
| **Rangs** | 4 rôles, un par classe (planche) ; 5 rôles selon l’XP (dossier) ; garder les métaux | **5 rôles selon l’XP** (Explorateur, Cartographe, Bâtisseur, Navigateur, Architecte de l’archipel), **sans divisions I, II, III**, en gardant le numéro de niveau. Un rôle par classe répéterait l’archipel ; métaux et divisions viennent des jeux classés (DP-12). Le rang se recalcule depuis l’XP, sans perte. | 2 |
| **Police de titre** | Montserrat ; Poppins ; garder Archivo Black | **Montserrat gras**, embarquée comme Archivo Black (`@fontsource`, aucune ressource externe), pour les titres courts et le logotype seulement. Silkscreen part avec le décor en pixels ; Luciole reste parmi les polices dys. | 2 |
| **Style en code** | (a) facettes à ombrage plat, sans texture ; (b) facettes et dégradés doux, brume de profondeur ; (c) cubes adoucis | **(b)**, le plus proche de la planche. Le rendu exact se choisit sur captures de la Forêt (jour, nuit, avant et après, coût en faces) que l’artiste technique 3D fait des trois options au lot R1. | R1 |
| **Construction** | Blocs taillés et peints d’abord, architecture modulaire ensuite ; modulaire dès l’ouverture | **Taillés d’abord** : la construction se lit encore « en blocs posés » (DA-03, DA-04) et le kit modulaire, le plus long, ne retarde pas l’ouverture. | R5, 7 |
| **Vue 2D** | Rester en pixel art ; devenir peinte (même palette, mêmes silhouettes) | **Peinte**, dans le même lot public que la 3D : sans cela, basculer de vue change de jeu (DA-03). | R7 |
| **Créatures et Gardiens** | La baleine remplace les créatures ; la baleine pour les grandes étapes, les créatures pour leur île ; tout garder | **La baleine parle rarement, aux grandes étapes ; les créatures restent les habitants de leur île, redessinées** (silhouettes d’artisans, sans gros yeux, DA-01). Les Gardiens deviennent des **sentinelles de pierre éteintes que la réussite rallume**, au lieu d’être vaincues : la statue devient l’état « avant ». | 5, R6 |
| **Rendu en développement** | Drapeau de développement, puis bascule ; réglage public « blocs ou Archipéo » | **Un drapeau invisible des élèves** (`?rendu=archipeo`) pendant les lots R ; il devient le rendu par défaut au lot 6, sans réglage durable. | R0 |
| **Budget** | 30 000 faces carrées ; 60 000 triangles et un plafond d’appels de dessin | **60 000 triangles et 40 appels de dessin au plus par archipel tout construit**, vérifiés par un test, mesurés au lot R0 sur la tablette de référence. | R0 |
| **Village en cinq états** | Déduit de la progression ; enregistré ; pas d’états | **Déduit à chaque rendu, jamais enregistré.** Abandonné (aucun plan d’île terminé) ; réactivation (un plan d’île terminé) ; reconstruction (les trois plans de l’île-port et un ouvrage payé qui en part) ; développement (en plus, un monument de l’archipel) ; port (le voyage vers l’archipel suivant fait, quel que soit le reste). Le 3e s’arrête à développement jusqu’au lot 8. Il se voit au port en cubes (lanternes, barques, fumée, caisses, fanions, feu de port) et se lit en HTML. Décidé le 27 septembre 2026. | 3b |
| **Tuiles du menu** | Remplacer Missions, Succès, Réglages par les trois Expéditions ; les ajouter en dessous | **Remplacer** : un seul bouton principal (« Reprendre l’aventure »), les Expéditions pour aller droit à une matière, et Toutes les missions, Succès et Réglages en liens (Succès dans la progression). Un adulte ouvre toujours une mission en deux touchers. Décidé le 27 septembre 2026. | 4a |
| **États des îles sur la Carte** | Trois (Fermée, Découverte, En cours, dossier) ; quatre | **Quatre : Fermée, À explorer, En chantier, Restaurée** (ses trois plans terminés), déduits à chaque rendu, jamais enregistrés. Chacun a une icône et un mot sur la Carte (3D et 2D), dans le pli « Les îles et leur état » et en vue simple. « Restaurée » récompense une île finie sans dépendre du Gardien. Décidé le 27 septembre 2026. | 4b |
| **Le mot de la baleine** | Règles du directeur artistique ; rattraper les étapes passées ; garder les bulles d’arrivée | **Règles du directeur artistique** : un mot par grande étape et par archipel (arrivée, qui remplace les bulles d’accueil ; dernier Gardien ; île-port restaurée ; premier ouvrage payé ; en 6e, sa présentation après le tutoriel), le plus grand seul quand plusieurs tombent ensemble, « déjà dit » par appareil, et les étapes déjà passées notées dites sans parler à la mise à jour. Le 4e perd « rallume » (lot 6). Décidé le 27 septembre 2026. | 5 |
| **Le pack visuel et les décisions déjà prises** | Suivre le pack ; garder les décisions antérieures | Décidé le 27 septembre 2026, point par point. **Phare** : crème à deux bandes de terre cuite désaturée, un même modèle au 6e et au 3e, distingué par la taille, le socle et le site. **4e** : l’atelier de pierre en chantier est le héros, le volcan un repère lointain. **Nom du 3e** : « Îles du Ciel » jusqu’au lot 8, puis « L’Horizon ». **Rangs** : cinq rôles selon l’XP, pas un badge par classe. **Toits** : trois quarts d’ardoise, un quart de terre cuite. **Sable** : celui du lot R1 reste pour l’instant (le pack est plus chaud). Fiches et esquisses de chaque archipel : `design/archipeo/esquisses/`. | R4b |
| **Distances abstraites** | Le monde entier en réseau ; deux échelles (l’île en grille, la mer en réseau) ; seulement la carte du lot 8b | **Le monde entier en réseau**, comme troisième rendu à côté de la 3D et de la 2D en grille : chaque île est un lieu (une maquette sans marche, où l’on touche bornes, lieux et chantiers), les ouvrages des liaisons, et l’on passe d’une île à l’autre par un trajet court le long de la liaison, qu’on peut sauter. Les gestes, les états, la vue simple et la construction case par case ne changent pas. La logique du jeu est d’abord séparée du rendu, sans changement d’image, entre les lots R ; le réseau vient avec les lots 8 et 8b (voir [Séparer le jeu du rendu](separation-jeu-rendu.md)). Décidé le 28 septembre 2026 par le mainteneur ; le directeur artistique recommandait deux échelles. | 8, 8b |
| **Couleurs des matières et des archipels** | Les teintes du pack (le 4e orange comme l’anglais, le 3e violet comme le français) ; des teintes distinctes | **Des teintes distinctes, assorties à la palette et jamais criardes** (décidé le 27 septembre 2026). Chaque matière garde sa famille actuelle, adoucie : français terre cuite `#E28F6B`, maths verre de mer `#86C3D1`, anglais bruyère `#A48FD0`. Archipels : 6e herbe `#6E9A4E`, 5e vert-de-gris `#4F8A80`, 4e miel `#C99A3F`, 3e bleu zénith `#4A86C4`. Sept teintes à 20° au moins l’une de l’autre ; l’icône bleu nuit dépasse 4,5:1 sur chaque matière. Icône et libellé toujours (DP-08) ; le mode Contraste élevé ne change pas. Les valeurs s’appliquent quand l’interface est reprise, après captures validées par le directeur artistique. | R4b |

## 6. Le plan en lots

Chaque lot est **une pull request livrable seule**. Aucun ne casse la vue 2D, la vue simple ni une sauvegarde, et aucun n’enfreint les règles dys.

### Les règles de tous les lots

- **Aucun identifiant ne change** : archipels, îles, quêtes, plans, ouvrages, succès, adresses. Seuls les mots et le dessin changent. Une sauvegarde reste lisible et un adulte ouvre toujours une quête en deux touchers.
- **Les blocs restent le modèle logique.** Un bloc reste la ressource, la case d’un plan et la cible qu’on touche ; seul son dessin change. La sauvegarde ne stocke que des identifiants de plans et des cases logiques (`village.plans`, `bridges`, `at`) : tant qu’un lot ne change pas les cases d’un plan, elle n’est pas touchée. Un lot qui les change (le navire, au lot 8) passe par une migration sans perte.
- **Un mot change avec ce qu’il décrit** : pas de « rallumer » tant que le Gardien reste une statue, pas de « L’Horizon » sur un plancher de nuages.
- **Pas de monde à moitié en cubes, à moitié en facettes, devant un élève.** Les lots de rendu (R) se construisent derrière le drapeau de développement et ne s’ouvrent qu’ensemble, au lot 6.
- **« Réduire les animations »** coupe dès leur arrivée la brume animée, la houle, les oiseaux et la baleine.
- **Rien d’emprunté** : aucun modèle ni texture importé, tout est dessiné par le code.
- Le directeur artistique relit chaque lot (captures 3D et 2D, jour et nuit, avant et après) ; l’artiste technique 3D réalise et relit ceux qui touchent au rendu.

### Deux pistes en parallèle

La piste **Jeu** (lots 1 à 5) change ce que l’élève lit et fait ; chaque lot sort dès qu’il est prêt. La piste **Rendu** (R0 à R7) change le dessin du monde derrière le drapeau ; elle s’ouvre en une fois au lot 6. Les deux pistes ne touchent pas les mêmes fichiers : elles avancent en même temps.

### Piste Jeu

| Lot | Ce que l’élève voit | Principes | Dépend de | Taille |
| --- | --- | --- | --- | --- |
| **1. Les mots d’Archipéo** | Le nom Archipéo et « Le savoir construit ton monde. » sur l’écran titre ; les noms des archipels de 6e, 5e et 4e (carte, sélecteur, Bloc-Navire, manuel ; le 3e change au lot 8) ; « mission » à la place de « quête » ; « Vue du monde » à la place de « Vue de Blocland » ; les matières en Expéditions (Mécanismes et énigmes, Archives et récits, Cartes et messages). Bloc, ouvrage, plan, borne, Gardien et Bloc-Navire gardent leur nom. | DP-01, DP-10 | Aucun | M (surtout du texte et le manuel) ; **construit** |
| **2. L’interface de l’explorateur** | Des panneaux sobres, opaques, géométriques, dans la palette de la planche (bleu nuit, bleu pétrole, vert d’eau, sable, crème) ; plus de boutons de pierre ni de bandeaux en pixels ; un bouton principal plein ; la police de titre ; une icône d’application redessinée par le code ; les rangs en rôles avec des insignes dessinés par le code. Clair et Contraste élevé restent plats ; chaque couleur est vérifiée en contraste et doublée d’un libellé (DP-08). | DA-02, DA-05, DP-05, DP-06, DP-08 | 1 | M |
| **3. Mission réussie, le monde change** | Le bilan dit à quoi servent les blocs gagnés (« Le pont vers la Plaine : 4 blocs sur 6 ») et « Voir le chantier » cadre ce chantier dans le monde ; chaque île montre son chantier en cours ; le village prend cinq états déduits de la progression, sans rien ajouter à la sauvegarde (aucun plan : abandonné ; premiers plans : réactivation ; île-port reliée : reconstruction ; un monument : développement ; navire lancé : port) ; les célébrations deviennent lumière, son court et transformation du décor. Même information dans la vue simple. Découpé en **3a** « le bilan sert le monde » (bilan, « Voir le chantier », célébrations sobres : **construit**) et **3b** « le village en cinq états » (**construit**). | DP-02, DP-03, DP-09, DA-04, DA-05 | 1 (2 de préférence) | M |
| **4. L’accueil et la carte** | L’accueil suit la hiérarchie du dossier : identité, village, « Reprendre l’aventure », progression, les trois Expéditions. La Carte marque les îles découvertes, en cours et fermées par une icône, un libellé et un état, jamais par la couleur seule, avec la prochaine destination. Une carte des quatre archipels, en lecture seule, montre ceux qu’on n’a pas atteints dans la brume. Le menu, l’école et le réglage « Au démarrage » restent. Découpé en **4a** « le menu » (**construit**) et **4b** « la Carte et les quatre archipels » (**construit**). | DP-03, DP-07, DP-08 | 2 | M |
| **5. Le mot de la baleine** | La baleine parle aux grandes étapes seulement (arrivée dans un archipel, première île ouverte, plan terminé d’une île-port, dernier Gardien d’un archipel, lancement du navire), dans un panneau « Le mot de la baleine » lu à voix haute, et passe au large de l’île concernée. Les créatures restent les voix de leur île (accueil, indice d’île fermée). **Construit.** | DP-05, DA-01, DA-05 | 3 | S-M |

Le contexte très court avant la consigne (`interface.md`) ajoute de la lecture : il se cadre avec le directeur contenu pédagogique, pas dans ces lots.

### Piste Rendu (derrière le drapeau)

Principe : **la grille reste, le cube disparaît.** Le paysage devient un maillage à facettes tiré de la grille de hauteurs qui existe déjà ; la construction reste case par case. Une palette commune (`world/palette.ts`) sert la 3D, la 2D et l’interface. Le réglage se fait sur la Forêt ; les autres archipels suivent par leur palette **et par leurs silhouettes** (lot R4b) : une palette seule donnerait quatre archipels jumeaux.

| Lot | Contenu | Taille |
| --- | --- | --- |
| **R0. Mesures et drapeau** | Triangles et appels de dessin par archipel aujourd’hui, poids de Three.js, captures « avant » ; le drapeau `?rendu=archipeo` ; le budget du test passe en triangles et appels de dessin. | S |
| **R1. Palette, ciel et lumière** | `world/palette.ts` (couleurs par sol et par bloc, par archipel, jour et nuit) ; ciel en dôme dégradé, brume et horizon ; lumière chaude et froide. Les trois options de style en captures sur la Forêt : le directeur artistique choisit. **Construit** (voir [les options de style du lot R1](#les-options-de-style-du-lot-r1)). | S-M |
| **R2. Le terrain** | Un maillage pur tiré de la grille (`world/landMesh.ts`) : facettes, couleurs par sommet, falaises à strates, côte adoucie et sable, roches des archipels en altitude. Toucher une case (`pickCell()`, pur et testé) et marche du bonhomme posées sur ce maillage. **Construit** (voir [le terrain du lot R2](#le-terrain-du-lot-r2)). | L |
| **R3. La mer et la faune** | Eau en dégradé de profondeur, écume, houle légère ; baleine, oiseaux et nuages en formes facettées. **Construit** (voir [la mer et la faune du lot R3](#la-mer-et-la-faune-du-lot-r3)). | M |
| **R4. Le décor** | Arbres, rochers et repères en primitives basse résolution, tirés du décor déjà rangé par la 2D (`propsOf()`, déplacé dans `world/`) et fusionnés en un seul maillage à couleurs par sommet, comme le sol (un groupe d’instances par genre coûterait trop d’appels de dessin). Trois préalables en tête du lot, chacun dans son commit et sans changement d’image : la couleur de nuit (`deNuit`) exportée par `world/palette.ts` et lue par la 2D au lieu d’y être recopiée ; `propsOf()` et le décor de `terrain.ts` (arbres, repères, cascades, décor marin) rangés à part dans `world/` ; un nom de décor donné aux repères, aux cascades et au décor marin, qui n’en ont pas, avec un test qui vérifie que les quatre archipels ne bougent pas (un décor nommé s’abaisse avec la pente et bloque des cases du quai). À trancher avec le directeur artistique : les repères posés sur une pente descendent-ils avec elle (recommandé) ou restent-ils à l’identique ? Décidé le 28 septembre 2026 à la demande du mainteneur. **Construit** (voir [le décor du lot R4](#le-decor-du-lot-r4)). | M |
| **R4b. Les silhouettes des archipels** | Pour chaque archipel : un relief propre (masses rocheuses en gradins pour le 5e, atelier de pierre en chantier pour le 4e avec le volcan en repère lointain, île en gradins devant un massif enneigé pour le 3e), trois ou quatre repères signatures (phare pour le 6e ; pont court et rigide de pierre et de bois, décidé le 28 septembre 2026, et nappe de brume sur l’eau pour le 5e ; atelier-forteresse, échafaudages, grue de bois et volcan fumant au fond pour le 4e ; grand phare sur un socle de salles de pierre pour le 3e, de la même famille que celui du 6e) et une ambiance de lumière. Rien ne s’écrit dans la scène ; « Réduire les animations » coupe la fumée et la brume qui bouge. Le directeur artistique valide chaque archipel sur captures, de près et de loin, de jour et de nuit ; l’artiste technique 3D vérifie le budget (la planche est dense, et elle montre le 4e deux fois sur sa carte : une erreur à ne pas reproduire). Ajouté le 27 septembre 2026 à la demande du mainteneur. | L |
| **R5. La construction taillée** | Bâtiments, ouvrages, bornes, monuments et navire en blocs taillés et peints (couleurs par sommet, biseaux) ; fantômes translucides unis ; fenêtres qui s’allument la nuit. Cases et sauvegarde inchangées. Avant ce lot, et après la fusion de R3, la scène 3D (`three/WorldCanvas.tsx`) est découpée sans changement d’image : les cubes, la mer et la faune dans leurs propres modules, sur le modèle de `three/sol.ts`. | M |
| **R6. Les personnages** | Le bonhomme, les créatures redessinées et les Gardiens en sentinelles, en primitives peintes, pour la 3D et les sprites de la 2D. | M |
| **R7. La 2D peinte** | La vue oblique garde sa projection et ses gestes, mais ses tuiles et sprites passent en aplats et dégradés sur la palette commune. **Construit** derrière le drapeau (voir [le style](style.md)). | L |

Entre ces lots s’intercalent, sans changement d’image, les étapes qui isolent la logique du jeu de son rendu : voir [Séparer le jeu du rendu](separation-jeu-rendu.md) (plan ; décisions du 28 septembre 2026).

### Les fils de la piste Rendu (R4b, R5, R6)

Jusqu’à R4, un seul fil enchaînait les lots sur une seule branche : quand il s’arrêtait, tout attendait derrière lui. Les trois lots qui restent se mènent **dans des fils séparés, en même temps**, après un socle commun. Plan établi le 28 septembre 2026 avec l’artiste technique 3D (fichiers, budget) et le directeur artistique (ce qui se juge ensemble) ; le mainteneur l’a accepté en entier le même jour (en fin de section).

**L’ordre.** Chaque ligne attend la fusion de la précédente ; les lots d’une même ligne tournent en même temps, chacun dans son fil et sa pull request.

| Étape | Fils en parallèle | Ce qui s’y fait |
| --- | --- | --- |
| 1 | J3 puis J4 (fil de la séparation) ; **S. le socle du rendu** | S n’a aucun changement d’image : la fiche de famille (ci-dessous) ; un registre des reliefs, un fichier par archipel (`world/silhouettes/6e.ts`…) écrits en repère d’île ; un registre des formes de décor (`FORMES[genre]`) à la place du `switch` de `decor.ts`/`decorMesh.ts` ; `ambianceDe(archipel)` dans `palette.ts` ; les postes et enveloppes du budget (ci-dessous) ; les empreintes globales de J0 (la place des îles, les ouvrages) coupées par archipel ; toutes les captures jour et nuit déclarées d’avance dans `scripts/rendu/mesures.mjs` ; une sous-section vide par lot dans ce cadrage. Il ne touche ni `WorldCanvas.tsx`, ni `scene.ts`, ni `WorldPage.tsx`, ceux de J3 et J4. |
| 2 | **D. La découpe de la scène 3D** (fil de la séparation, juste après J4) | `three/WorldCanvas.tsx` éclaté sans changement d’image : `three/cubes.ts`, `navire.ts`, `bornes.ts` (pour R5), `personnages.ts` (R6), `lumiere.ts`, `brume.ts` (R4b), `etiquettes.ts` (commun). Chaque module expose `animer(t, dt, reduit)` et `dispose()` ; la boucle d’animation ne fait plus qu’itérer, aucun lot ne la retouche. `lumiere.ts` expose le degré de nuit que R5 lit pour ses fenêtres. **Construit le 28 septembre 2026**, avec trois modules de plus : `large.ts` (la mer, les nuages, les oiseaux, les baleines), `camera.ts` (le cadrage) et `maillage.ts` (les maillages et matériaux partagés) ; `partie.ts` dit le contrat commun. |
| 3 | **J5. Chaque île dans son repère** (fil de la séparation) | Avancé avant R4b : découpé en quatre, R4b ferait attendre J5, donc R5 et R6. Les sous-lots écrivent ensuite directement en repère d’île. |
| 4 | **R4b-6e**, **R5**, **R6** | Trois fils. R4b-6e règle la famille sur la Forêt et construit le phare de référence. |
| 5 | **R4b-5e**, **R4b-4e** (et R5, R6 s’ils courent encore) | Le 5e et le 4e ne partagent aucun repère. |
| 6 | **R4b-3e** | Reprend le phare du 6e (taille, socle, site), revoit le plancher de nuages (vers `#DDE3E8`). |
| 7 | **La revue d’ensemble** du directeur artistique, puis le lot 6 | Voir plus bas. |

**Qui possède quoi.** Un fichier n’a qu’un propriétaire à la fois ; un autre lot le lit sans l’écrire.

| Fil | Fichiers qu’il écrit | Il lit sans écrire |
| --- | --- | --- |
| R4b (un sous-lot par archipel) | son fichier `world/silhouettes/<archipel>.ts`, ses lignes de `MAP` (`world/map.ts`), ses formes de décor, son entrée de `ambianceDe`, `landMesh.ts`, `seaDecor`/`mistPatches` de `terrain.ts`, `three/lumiere.ts`, `three/brume.ts`, `three/decor.ts` ; en 6e seulement : le mouvement de la fumée et de la brume (plus douce, plus pâle la nuit), le ventre des baleines la nuit (`world/faune.ts`) | `deNuit`, le registre des formes |
| R5 | `three/cubes.ts`, `navire.ts`, `bornes.ts`, un maillage pur de la construction dans `world/`, les formes du quai et du cœur des îles (`world/decor/quai.ts`), `quaySpots`/`harbour` de `terrain.ts`, `VoxelCanvas.tsx`, les fenêtres de nuit en 2D (`pixel/paintedDraw.ts`) | le phare de R4b-6e (modèle partagé), le degré de nuit de `lumiere.ts`, `VEHICLE_DECK` |
| R6 | `Avatar.ts`, `Creatures.tsx`, `Guardians.tsx`, `Creature3D.tsx`, `three/personnages.ts`, la partie créatures et îlots de `terrain.ts`, `pixel/characters.ts`, `paintedSprites.ts`, `WorldCanvas2D.tsx` (après J4), les personnages de nuit en 2D ; son premier commit sort les modèles des créatures et des Gardiens des composants React (repris de J5) | `deNuit`, `VEHICLE_DECK`, le sol des îlots |

- **Le fil de la séparation** garde ce que J3 à J5 écrivent : `world/grille.ts` (la disposition en grille : place des îles, des bornes, des ouvrages, chemin du bonhomme, depuis J3), `world/scene.ts`, `WorldPage.tsx`, `world/view.ts` et le toucher des deux vues. Les lots R les lisent ; un lot qui a besoin d’y changer quelque chose le demande à ce fil.
- **`palette.ts`** appartient à R4b ; R5 et R6 gardent leurs couleurs dans leurs modules.
- **`budget.ts` et `budget.test.ts`** : le socle pose tous les postes ; chaque lot n’écrit que sa ligne d’enveloppe et son propre test.
- **Les empreintes de J0** : un instantané ne se fusionne jamais à la main. Après s’être remis sur `main`, un fil reprend l’instantané de `main` et le régénère (`npx vitest run -u src/blocland/world/empreintes.test.ts`) ; sa pull request liste les empreintes qui changent, qui ne concernent que son archipel ou son poste.
- **Ce cadrage** : chaque lot écrit dans sa sous-section, posée par le socle.

**Le budget par poste** (triangles / appels de dessin, par archipel tout construit). Mesuré le 28 septembre 2026 après R4 : 66 672 triangles et 220 appels dans les Premiers Rivages, 44 300 à 45 200 et 180 à 182 ailleurs, dont 65 appels pour la construction et 54 à 92 pour les créatures et les Gardiens, encore en cubes.

| Poste | Lot | Premiers Rivages | Les trois autres |
| --- | --- | --- | --- |
| Sol | R4b | 25 000 / 2 | 23 000 / 1 |
| Mer | R4b | 5 000 / 1 | 5 000 / 1 |
| Faune | R4b | 1 500 / 3 (+1 au passage de la baleine) | 1 500 / 3 (+1) |
| Décor et repères signatures | R4b | 12 500 / 3 | 9 000 / 3 |
| Construction (bâtiments, ouvrages, monuments, quai, cœur des îles ; fantômes et fenêtres compris) | R5 | 6 500 / 3 | 6 500 / 3 |
| Bornes (instanciées) | R5 | 1 000 / 1 | 1 000 / 1 |
| Navire | R5 | 1 000 / 3 | 1 000 / 3 |
| Bonhomme | R6 | 800 / 2 | 800 / 2 |
| Créatures | R6 | 2 500 / 1 | 2 500 / 1 |
| Gardiens en sentinelles | R6 | 1 500 / 1 | 1 500 / 1 |
| Dans la scène : étiquettes, flèche, fanion, balises | socle | 500 / 5 | 500 / 5 |

Les Premiers Rivages tiennent en 57 800 triangles et 25 appels (26 au passage de la baleine) : la marge est mince, et leur phare existe déjà. Les trois autres tiennent en 52 300 triangles et 24 appels ; leur enveloppe de décor laisse 4 000 à 6 500 triangles aux silhouettes. Un test du socle vérifie que la somme des enveloppes reste sous 60 000 et 40 ; chaque lot change son `it.todo` en plafond ; le test du budget complet devient vrai quand R4b, R5 et R6 sont fusionnés. Les appels comptés par le navigateur (`npm run rendu:mesures`) se vérifient dans chaque pull request.

**La fiche de famille** (directeur artistique, écrite dans le socle avant le premier sous-lot : voir [la fiche de famille](#la-fiche-de-famille)) : le phare (proportions, deux bandes `#A8553A`, galerie `#553330`, toit conique, anneau `#3F8299`), un seul modèle construit en R4b-6e, que le 3e reprend en changeant la taille, le socle et le site et que R5 réutilise pour les plans du phare ; les toits, trois quarts d’ardoise et un quart de terre cuite ; les falaises et les strates réglées en R2, jamais redosées par archipel ; une seule règle de mouvement pour la fumée et la brume, coupées par « Réduire les animations » ; une seule couleur de nuit, les lueurs sous 5 % de l’image ; le soleil de face en haut à gauche, chaque archipel faisant son ambiance par la palette et la brume ; le « commun aux quatre » des fiches d’archipel (`design/archipeo/esquisses/fiches-archipels.md`). **Frontière R4b / R5** : R4b ne dessine que les repères qui ne sont pas des plans (volcan, grue du fond, brume, pont du 5e) et le phare partagé ; tout ce qui se construit en blocs (dont l’atelier du 4e) est à R5.

**Ce qui se juge ensemble.**

- Chaque fil montre ses captures validées par le directeur artistique (branche `captures`, un dossier par lot : `r4b-6e/`, `r5/`, `r6/`…) et le verdict du référent dys, comme R1 à R4.
- R6 se juge d’abord seul, sur le terrain et le décor de R4 (silhouettes, pas de gros yeux, sentinelle éteinte puis rallumée) ; son échelle et ses couleurs se valident dans la revue d’ensemble.
- **La revue d’ensemble**, une seule, quand R4b, R5 et R6 sont fusionnés : une planche par archipel, tout construit et avant restauration, de près et de loin (une île, l’archipel, la Carte), de jour et de nuit, en 3D et en 2D, en Contraste élevé et avec « Réduire les animations » ; une planche des quatre archipels côte à côte au même cadrage (les deux phares, la lumière, la fumée, aucun archipel jumeau) ; le budget mesuré. Elle vaut la validation par archipel qu’attend le lot 6 ; ce qui en sort part en retouches ciblées, sans rouvrir de lot.
- Rien ne sort du drapeau avant le lot 6, même un archipel prêt. Les teintes d’archipel et de matière n’entrent dans l’interface qu’avec la reprise de l’interface. « Rallumer » attend le lot 6.

**Les règles des fils.** Au plus trois fils de rendu en même temps, plus celui de la séparation. Chaque fil part de `main` à jour, se remet sur `main` après chaque fusion d’un autre fil, garde sa pull request en brouillon jusqu’aux captures validées, et ne fusionne que sur le mot du mainteneur, en squash sans signature. Un fil qui doit écrire dans un fichier d’un autre lot écrit un nouveau fichier et le passe au propriétaire. Un fil arrêté ne bloque que son lot.

**Décidé par le mainteneur le 28 septembre 2026** (tout accepté) :

1. Ce découpage : un socle, puis R4b en quatre sous-lots (6e, puis 5e et 4e, puis 3e), R5 et R6 en parallèle.
2. J5 avancé avant R4b : sinon J5 attendrait le dernier sous-lot, et R5 et R6 avec lui.
3. La découpe de la scène 3D confiée au fil de la séparation, juste après J4 : il possède déjà ces lignes.
4. La sortie des modèles des créatures et des Gardiens hors de React, prévue en J5, donnée à R6 : c’est son terrain.
5. Le phare, modèle unique construit par R4b-6e et réutilisé par le 3e et par R5.
6. Les enveloppes du budget ci-dessus.

### L’ouverture et la suite

| Lot | Ce que l’élève voit | Dépend de | Taille |
| --- | --- | --- | --- |
| **6. Le nouveau monde** | Le rendu Archipéo devient celui de tous, en 3D et en 2D, sur les quatre archipels ; les Gardiens se rallument au lieu d’être vaincus. Le mot « Gardien vaincu » disparaît en même temps que la statue. Captures du manuel refaites, `style.md` réécrit, anciennes textures retirées quand plus rien ne les lit. | R0 à R7 (R4b compris), validation du directeur artistique par archipel | M |
| **7. L’architecture modulaire** | Les blocs posés deviennent des pièces d’architecture (murs, colombages, toits en pente, pilotis, quais), choisies selon les cases voisines, archipel par archipel en commençant par les Premiers Rivages. Les cases des plans ne changent pas. | 6 | L |
| **8. L’Horizon et le navire maritime** | Le 3e redescend sur la mer et prend le nom « L’Horizon » (grand port, phare central, vue sur les archipels précédents). Le Bloc-Navire reste un seul navire qui s’améliore, avec des pièces maritimes : les voiles (6e → 5e), les instruments pour traverser la brume (5e → 4e), la figure de proue et le grand pavois (4e → 3e). Les blocs posés sur le ballon ou le réacteur reviennent dans l’inventaire ; les succès Aéronaute et Pilote du ciel sont renommés en gardant leur identifiant. | 6 | L |
| **8b. La carte des quatre archipels en 3D** | Une vue d’ensemble lointaine et peu coûteuse (maquettes simplifiées) où l’on voit les quatre archipels réunis, les routes du Bloc-Navire, la mer et la baleine ; chaque archipel porte son icône, son libellé et son état, jamais la couleur seule (DP-08). La carte dessinée du lot 4b reste l’équivalent en 2D et en vue simple. Ajouté le 27 septembre 2026 à la demande du mainteneur. | 8, R4b | M |
| **9. L’archipel vivant** | Météo légère, bateaux au loin, phares qui s’allument sur les îles restaurées, oiseaux qui signalent la zone active. « Réduire les animations » devient un « Mode concentration » présenté comme un confort pour tous. | 6 à 8 | M |
| **10. Un village à soi** | Nom du navire, décor, quelques variantes de bâtiments, sans effet sur la difficulté. Un nom libre demanderait une modération en classe : une liste de noms est plus sûre. | 3, 8 | M |

**Les problèmes situés dans l’archipel** (contenu, M à L) : des problèmes de maths qui se passent dans le monde d’Archipéo (un pont entre deux falaises, un quai, un phare), avec une nouvelle aide « scène », un schéma plat dessiné par le code à côté de la consigne, jamais dans le décor 3D. Ce lot se cadre et se construit dans [le cadrage du contenu](cadrage-contenu.md#la-suite-a-couvrir) (lot 8 de sa liste) ; ajouté le 27 septembre 2026 à la demande du mainteneur. L’exercice de la planche n’est pas à recopier : sa seule cote (18 m) est aussi un des choix, et rien ne permet de trouver la réponse.

La montée en autonomie de la 6e à la 3e (chaînes de missions, missions à plusieurs compétences) dépend d’abord du contenu : elle se cadre avec le directeur contenu pédagogique après le lot 8.

### Les risques

- **Un monde hybride** : parade, le drapeau et l’ouverture en une fois (lot 6). Si la piste Rendu traîne, la piste Jeu continue : ses lots ne dépendent pas du rendu.
- **La 2D ou la vue simple qui décroche** : chaque lot montre ses captures 3D et 2D, et chaque lot de boucle a son équivalent en liste.
- **Le décor qui rattrape la consigne** : le panneau d’exercice reste opaque et uni ; rien ne s’écrit dans la scène.
- **Des couleurs qui se confondent** : sur la planche, le violet sert au français et au 3e, l’orange à l’anglais et au 4e. Des teintes distinctes ou des libellés, jamais la couleur seule.
- **Le toucher sur un terrain en pente** (R2) : c’est le risque technique principal ; la conversion du point touché en case est pure et testée avant tout le reste.
- **Le budget sur tablette** : le monde en blocs le dépasse déjà (voir les mesures du lot R0 ci-dessous) ; le rendu Archipéo doit donc dessiner moins que le monde d’aujourd’hui, pas seulement autrement.
- **La documentation** : le lot 1 touche presque toutes les pages du manuel, le lot 6 toutes les captures du monde ; `cadrage-blocland.md` se met à jour à chaque lot construit.

### Les mesures du lot R0

Mesuré le 27 septembre 2026 sur le monde en blocs, chaque archipel tout construit (trois étoiles partout, Gardiens vaincus, tous les plans, ouvrages, étapes du navire et ponts), par `npm run rendu:mesures` : Chromium en rendu logiciel, écran de tablette 1024 × 768. Les appels de dessin et les triangles ne dépendent pas de la carte graphique ; ils dépendent de ce que montre la caméra (la Carte montre tout l’archipel).

| Archipel | Vue d’une île | Vue de l’archipel | Carte |
| --- | --- | --- | --- |
| Premiers Rivages (6e) | 247 appels, 77 400 triangles | 362 appels, 78 000 triangles | 481 appels, 78 900 triangles |
| Îles Brumeuses (5e) | 212 appels, 52 300 triangles | 347 appels, 52 900 triangles | 396 appels, 53 200 triangles |
| Anciens Ateliers (4e) | 232 appels, 52 600 triangles | 305 appels, 52 900 triangles | 442 appels, 53 800 triangles |
| Îles du Ciel (3e) | 214 appels, 46 700 triangles | 307 appels, 47 000 triangles | 451 appels, 47 700 triangles |

- **Le budget (60 000 triangles, 40 appels) n’est pas tenu aujourd’hui** : les Premiers Rivages dépassent les triangles d’environ 30 %, et tous les archipels dessinent six à douze fois trop d’appels. Le test `world/budget.test.ts` empêche le monde en blocs de grossir (80 000 triangles et 240 appels pour ses modèles) ; le budget d’Archipéo s’appliquera au nouveau rendu dès le lot R2.
- **D’où viennent les appels** (Premiers Rivages, vue d’une île ; relevé de l’artiste technique 3D) : le terrain, 62 800 triangles en 87 groupes (un par matériau et par face) ; les créatures et les Gardiens, 8 900 triangles en 92 appels (les dix Gardiens : 6 000 et 47) ; le bonhomme, 4 800 triangles en 21 appels ; les repères d’or des bornes, 81 appels pour moins de 1 000 triangles ; le Bloc-Navire, 34 appels ; les nuages, les oiseaux, les baleines et les étiquettes d’île, une soixantaine d’appels à eux tous. Pour tenir 40 appels : un maillage par famille (créatures, Gardiens, bonhomme, navire, nuages, oiseaux, baleines) avec la couleur portée par les sommets, les repères dessinés en une seule fois (instanciation), le terrain regroupé par matériau, et un bonhomme de quelques centaines de triangles.
- **Le poids de Three.js** : le morceau chargé à la demande avec la vue 3D pèse 534 Ko (132 Ko compressé), le monde 3D lui-même 24 Ko (9 Ko).
- **Les images par seconde** se mesurent sur la tablette de référence, dans l’application publiée, avec `?mesures` dans l’adresse (`/?mesures#/aventure`) : la vue 3D affiche alors ses appels, ses triangles et ses images par seconde. Relevé à faire par le mainteneur.
- **Les captures « avant »** (3D et 2D, de jour et de nuit, Carte, par archipel) se refont avec `npm run rendu:mesures -- --captures <dossier>` ; elles ne sont pas versionnées.

### Les options de style du lot R1

Construit derrière `?rendu=archipeo` : la palette commune (`world/palette.ts`, par archipel, jour et nuit), le ciel en dôme dégradé (`three/ciel.ts`, un appel de dessin, 480 triangles), la brume de profondeur couleur d’horizon, le soleil chaud et l’ambiance froide. Les noms d’îles ne passent jamais dans la brume. Les trois options se comparent sur la Forêt avec `?rendu=archipeo&style=a|b|c` (`world/style.ts`, `three/surface.ts`) ; `npm run rendu:mesures -- --rendu archipeo --style b --archipel 6e --captures <dossier>` refait les mesures et les captures.

- **Ce qui se juge dès R1** : le ciel, la brume et la lumière, communs aux trois options, et le traitement de surface. Les facettes tirées de la grille de hauteurs n’arrivent qu’au lot R2 : sur les cubes d’aujourd’hui, l’écart entre les options reste discret.
- **(a) Aplat** : une couleur de la palette par face, sans texture. Aucun appel ni triangle de plus. Le plus sobre et le plus lisible, mais froid, loin de la planche.
- **(b) Facettes et dégradés doux** : la couleur de la palette nuancée par sommet (plus sombre vers la mer, strates douces sur les falaises, larges taches sur les dessus). Aucun appel ni triangle de plus ; un attribut de couleur par sommet, que le terrain du lot R2 porte de toute façon. Le plus proche de la planche.
- **(c) Cubes adoucis** : des normales penchées vers les coins arrondissent la lumière sans triangle de plus. Un vrai biseau porterait le terrain seul des Premiers Rivages de 62 800 à environ 108 700 triangles (calcul, pas mesure) : hors budget avant même les créatures. Sur les captures, l’effet répète la grille case par case.
- **Le coût de R1** : un appel de dessin et 480 triangles par vue (le dôme) ; le morceau 3D passe de 25 à 33 Ko (13 Ko compressé), surtout pour les tables de la palette.
- **L’horizon profond** : avec les caméras d’aujourd’hui (plongée de 25 à 45°), le ciel n’est qu’une bande en haut de l’écran. Voir l’horizon comme sur la planche demande une caméra plus basse, qui change le cadrage de jeu : c’est une décision à prendre hors de R1.
- **Décision (R1, directeur artistique)** : le style (b) est retenu. Nuance par sommet entre 0,78 et 1,08, taches de ±6 % sur 9 blocs pour les cubes, 10 % vers l’ambiance du sol sous la hauteur 2 ; strates et taches se redosent au lot R2 sur les facettes. (c) est écarté (damier sur les cubes, biseau hors budget). Le soleil reste de face, en haut à gauche, dans le jeu ; le contre-jour de la planche est réservé aux illustrations. Les palettes des Îles Brumeuses (mer assombrie), des Anciens Ateliers (horizon ambré) et des Îles du Ciel (ciel lavande, voile réduit) sont retouchées. La caméra basse se décide hors R1, pour la vue de l’archipel seulement, avec des étiquettes qui ne se chevauchent pas.

### Le terrain du lot R2

Construit derrière `?rendu=archipeo` : `world/landMesh.ts` tire de la grille un champ de hauteurs (une colonne par case, à partir des cubes que `terrain.ts` marque `sol`) et en fait un maillage à facettes, en tableaux typés ; `three/sol.ts` le dessine en un appel de dessin, deux avec la lave. Une marche d’un bloc devient une pente, deux blocs ou plus restent une falaise. Une case où quelque chose est posé (borne, maison, plan, pont, monument) reste plate ; une case de décor trop haute sur sa pente descend avec son décor. Le toucher passe par `pickCell` (le point touché et la normale de la facette redonnent la case) et la marche par `piedsSur` ; les deux sont testés sur les quatre archipels tout construits. Aucune case, aucun identifiant, aucune sauvegarde ne change ; la vue 2D et la vue simple non plus.

| Archipel | Sol en cubes | Sol en facettes | Scène Archipéo (modèles, tout construit) |
| --- | --- | --- | --- |
| Premiers Rivages (6e) | 38 856 triangles, 30 appels | 21 792 triangles, 2 appels | 63 568 triangles, 220 appels |
| Îles Brumeuses (5e) | 28 148, 24 | 16 631, 1 | 42 313, 187 |
| Anciens Ateliers (4e) | 28 652, 29 | 18 198, 1 | 43 600, 190 |
| Îles du Ciel (3e) | 27 520, 24 | 16 986, 1 | 37 700, 186 |

- **Le budget** : le sol tient en 2 appels et 30 000 triangles au plus par archipel (vérifié par `world/budget.test.ts`) ; le budget complet (60 000 triangles, 40 appels) attend les lots R3 à R6, car les appels viennent des cubes de la construction, du décor et des créatures.
- **Décision (R2, directeur artistique)** : taches ±0,08 sur environ 9 blocs, sur les dessus seulement ; strates ±0,05 par tranche de 2 blocs, ±0,03 au-dessus de 4 blocs, épaisseur tirée par île (2 à 3 blocs) ; une pente à l’ombre n’est jamais plus sombre que 0,85 fois le dessus voisin (nuance entre 0,82 et 1,08) ; côte basse à 0,2 au-dessus de l’eau, frange de sable à 0,55 case, sable pur sur la dernière demi-case ; les hautes colonnes de roche prennent un pied d’un bloc et des éboulis. Les socles plats sous le décor et les repères en cubes sur les falaises attendent le lot R4.

### La mer et la faune du lot R3

Construit derrière `?rendu=archipeo` : `world/mer.ts` calcule, sans Three.js, la carte de la mer (couleur et distance à la terre, deux points par case) et la houle ; `three/mer.ts` la dessine en un appel de dessin, avec l’écume. `world/faune.ts` donne les formes à facettes des baleines, des oiseaux et des nuages et leurs poses (dont le passage de la baleine du lot 5) ; `three/faune.ts` les dessine en une instanciation par famille, trois appels de dessin en tout. « Réduire les animations » fige la houle, l’écume, les nuages, les oiseaux et les baleines.

| Archipel | Vue de l’archipel : appels | Carte : appels | Vue d’une île : triangles |
| --- | --- | --- | --- |
| Premiers Rivages (6e) | 348 → 272 | 472 → 322 | 64 184 → 73 630 |
| Îles Brumeuses (5e) | 344 → 236 | 397 → 255 | 43 025 → 48 081 |
| Anciens Ateliers (4e) | 303 → 222 | 441 → 258 | 44 288 → 51 130 |
| Îles du Ciel (3e) | 310 → 214 | 455 → 253 | 38 330 → 46 374 |

- Les appels baissent de 24 à 44 % sur la vue de l’archipel et la Carte ; les triangles montent de 5 000 à 9 000 (la mer, la faune et les découpes du passage au bord du sol). Le budget complet attend toujours les lots R4 à R6.
- **Décision (R3, directeur artistique)** : mer en dégradé, du Bleu lagon `#178078` sur les hauts-fonds à la teinte de l’archipel, puis vers Nuit océan `#142B38` au large ; les écueils ont de l’écume, pas de lagon ; liseré d’écume Brume qui respire, et une seconde ligne fixe à 40 % d’opacité là où l’eau fait au moins 1,5 case ; houle de 0,14 bloc au large et 0,03 aux côtes ; contraste sable/lagon comme la planche (environ 2,2:1), le bord étant porté par l’écume (plus de 3:1) ; baleine bleu profond `#1E3A5C` au ventre crème, oiseaux blancs aux ailes grises, cumulus crème au dessous bleuté ; herbe `#76A860` ; fondu dalle/roche sur 0,3 case au bord. Le rebord plat de la dalle (la roche qui descend jusqu’à elle) passe en R4 avec les socles. À revoir en R4b : le plancher de nuages du 3e, qui tire vers le sable (vers `#DDE3E8`), et le ventre des baleines la nuit.

### Le décor du lot R4

Construit derrière `?rendu=archipeo`, après trois préalables qui ne changent pas l’image : une seule couleur de nuit (`deNuit`, dans `world/palette.ts`), le décor rangé à part (`world/props.ts` et `world/decor.ts`, sortis de `pixel/props.ts` et de `terrain.ts`), et un nom de décor pour les repères, les cascades et le décor marin. `world/decorMesh.ts` tire le décor des cubes et le dessine en primitives peintes par sommet de la palette ; `three/decor.ts` le dessine en un ou deux appels de dessin (les lanternes et la lave à part). Chaque élément est posé au milieu de sa case, sur la pente : les socles plats disparaissent. Toucher le décor renvoie sa case ; une borne, un lieu, un pont, un monument ou une créature sous un feuillage garde la priorité.

| Archipel | Décor en cubes | Décor en primitives | Scène Archipéo (modèles, tout construit) |
| --- | --- | --- | --- |
| Premiers Rivages (6e) | 17 148 triangles | 11 992 triangles, 2 appels | 66 672 triangles, 220 appels |
| Îles Brumeuses (5e) | 7 682 | 5 096, 1 | 44 540, 182 |
| Anciens Ateliers (4e) | 8 530 | 3 451, 2 | 45 191, 182 |
| Îles du Ciel (3e) | 3 512 | 2 500, 2 | 44 312, 180 |

- **Décision (R4, directeur artistique)** : décor en primitives peintes par sommet, fusionné en un ou deux appels, posé au milieu de sa case sur la pente. Les repères descendent avec la pente, enfoncés au plus bas de leur emprise sur un pied élargi de leur couleur, qui dépasse d’au plus 0,3 case. Cascades en lame d’eau collée à la falaise jusqu’à l’eau. Rebord plat pour tous les dessus qui tranchent. Délavé sur les îles fermées. Arbres à tronc court et feuillage rond d’environ 2,4 cases, avec une seconde boule sur les grands ; trois tailles (0,7, 1 et 1,3) ; deux verts, environ 60 % clair `#7FB24E` et 40 % profond `#3F7A3A`, le haut du feuillage à environ 1,15 fois la luminance de l’herbe et le bas à environ 0,7. Tronc du chêne géant à 45 % de sa hauteur au plus. Fumée claire en volutes qui grossissent de 35 % et s’inclinent au vent, immobile jusqu’à R4b. Écueils et bancs à 2 500 triangles au plus par archipel, sans changer leur nombre. Le décor du cœur des îles et les objets du quai passent en R5 ; les rochers de la Forge, le mouvement de la fumée (plus douce, et plus pâle la nuit) et le semis d’écueils du 4e sur la Carte, en R4b.
- **Référent dys** : adapté, après deux ajustements dans ce lot (une cible sous un feuillage gagne le toucher ; l’île fermée délavée garde son étiquette « Fermée » et son chemin balisé). Avant le lot 6 : le toucher à travers une couronne vérifié au doigt sur tablette, le décor dans le thème Contraste élevé et avec « Réduire les animations », l’île fermée de nuit (seule l’étiquette porte l’état) et le manuel.


### Le socle du rendu (lot S)

Construit le 28 septembre 2026, sans aucun changement d’image : les empreintes de la grille (`world/empreintes.test.ts`) et celles du rendu (`world/empreintesDuRendu.test.ts`, nouvelles) ne bougent pas. Il prépare R4b, R5 et R6 pour qu’ils tournent en même temps sans écrire dans les mêmes fichiers.

- **Le registre des reliefs** : `world/silhouettes/6e.ts`, `5e.ts`, `4e.ts`, `3e.ts`, un fichier par archipel, donnent le relief propre de chaque île (ses pics), écrit en repère d’île (en cases depuis le coin du cœur) ; `world/map.ts` le pose à la place de l’île. Chaque sous-lot de R4b n’écrit que le fichier de son archipel.
- **Le registre des formes** : `FORMES[genre]` (`world/decor/formes.ts`) remplace le `switch` de `decorMesh.ts`. Les formes communes aux quatre archipels sont dans `world/decor/communes.ts`, les repères de chaque archipel dans `world/decor/6e.ts`…, la fumée (une seule règle) dans `world/decor/fumee.ts`, le pinceau et les primitives dans `world/decor/pinceau.ts`. Un décor bâti sans forme propre se dessine en boîtes. Dans le monde en blocs, `decor.ts` range de même ses formes par genre (`BLOCS_DU_DECOR`, `REPERES_EN_BLOCS`).
- **L’ambiance d’un archipel** : `ambianceDe(archipel)` (`world/palette.ts`) rend tout ce qu’un sous-lot de R4b règle, et rien d’autre : le ciel et la lumière de jour, la brume de profondeur, le voile, les sols propres, la teinte de la mer. Un test vérifie les bornes de la fiche de famille.
- **Le budget par poste** : `ENVELOPPES` et `enveloppeDe(poste, archipel)` (`world/budget.ts`) reprennent le tableau ci-dessus ; un test vérifie que leur somme tient dans 60 000 triangles et 40 appels (passage de la baleine compris), et chaque poste a son `it.todo` que son lot change en plafond.
- **Les captures déclarées d’avance** : `CAPTURES` dans `scripts/rendu/mesures.mjs`, vingt et une par archipel (une île, l’archipel et la Carte, de jour et de nuit, en 3D et en 2D ; en Contraste élevé, de jour et de nuit ; avec « Réduire les animations », deux fois à quatre secondes d’écart, pour vérifier que rien ne bouge), pour chaque lot et pour la revue d’ensemble ; `--familles nuit,2d` n’en refait que certaines. La capture d’une île montre le panneau de l’île ouvert, avec son texte : on y vérifie que rien ne bouge près de ce qu’on lit.
- **Les empreintes par archipel** : celles du rendu sont rangées par archipel, et les empreintes globales de J0 (la place des îles, des bornes et des lieux ; les ouvrages, l’embarquement et les voyages) sont coupées par archipel, sans qu’aucune valeur calculée change : un sous-lot ne régénère que les siennes. Les clés des cases des plans restent une seule empreinte : elles ne changent jamais.

#### La fiche de famille

Cette fiche est la référence commune aux quatre sous-lots R4b, à R5 et à R6 : elle garde les quatre archipels dans une même famille sans en faire des jumeaux. Chaque règle dit qui la construit et qui la reprend. Un lot qui voudrait s’en écarter le dit dans sa sous-section, et la revue d’ensemble tranche. Les valeurs marquées « (DA, 28/09) » ont été fixées par le directeur artistique le 28 septembre 2026 ; les autres viennent des décisions (§5), des lots R1 à R4 et des fiches d’archipel. Où chaque valeur vit dans le code, l’artiste technique 3D le décide, avec une seule source lue par tous les lots.

**1. Le phare.** Il n’existe qu’un modèle. R4b-6e le construit (sans le poser en repère : au 6e, c’est le plan « Le phare de Grimoire » qui le porte, voir les décisions en fin de fiche), avec la forme facettée de R4 (8 pans) ; R4b-3e le reprend ; R5 le réutilise pour les plans du phare, pièce par pièce, sans changer ni les proportions ni les couleurs. Ses proportions, en fraction de sa hauteur H au-dessus du socle (DA, 28/09) :

- **Le fût**, tronconique, de 0 à 0,70 H, rayon bas r et rayon haut 0,75 r, crème `#E9E4D6`.
- **Les deux bandes**, en terre cuite désaturée `#A8553A` (jamais en rouge vif), de 0,08 H chacune : de 0,30 à 0,38 H et de 0,50 à 0,58 H. Le fût reste crème entre elles et au-dessus.
- **La galerie**, une dalle `#553330` posée à 0,70 H, épaisse de 0,03 H, qui dépasse le haut du fût de 0,25 case.
- **La lanterne**, de 0,73 à 0,85 H, rayon 0,55 r : vitrée et claire de jour (le verre de la palette), elle brille la nuit dans les lueurs, en `#FFD866`. Ni faisceau ni rotation avant le lot 9. Sur une île fermée, elle reste éteinte et délavée, comme le reste du décor.
- **Le toit**, conique, de 0,85 à 1,00 H, base de rayon 0,85 r qui dépasse la lanterne, en terre cuite `#A8553A`.
- **Le socle**, en pierre, avec un anneau pétrole `#3F8299` de 0,15 case à la jonction du socle et du fût.
- **Au 6e** : H = 8 cases, r = 1,0 case, sur un socle d’une case ; une emprise de 2 × 2 cases, sur l’île de la Tour (le plan « Le phare de Grimoire », dessiné par R5), lanterne tournée vers le large. C’est la seule verticale nette de l’archipel.
- **Au 3e**, seuls la taille, le socle et le site changent (§5) : H = 11 cases, r = 1,2 case, sur un socle de salles de pierre de taille `#DBDADD`, trois cases de haut et 4 × 4 d’emprise, au sommet de l’île en gradins, au centre de la vue de l’archipel. Proportions, couleurs et bandes ne changent pas.
- **Au 5e et au 4e**, aucun phare de ce modèle (« Le phare du large », au 5e, est une tour à feu de pierre).

**2. Les toits.** Trois sur quatre en ardoise, un sur quatre en terre cuite, dans les quatre archipels (§5). R5 construit la règle ; R4b la reprend pour les tours et les ruines qui ne sont pas des plans (sommets du 5e).

- **L’ardoise** : `#2E505E` au 6e (ombre `#153448`), `#224C5F` au 5e, `#3E3636` au 4e ; au 3e, le dessus enneigé `#E5EBE3` et les rives en ardoise `#2E505E` (DA, 28/09).
- **La terre cuite des toits**, `#C0764A`, la même partout (DA, 28/09). Celle du phare, `#A8553A`, n’entre pas dans le compte. Le rouge `#B04E3E` du bloc `toit` d’aujourd’hui disparaît du rendu Archipéo.
- **La répartition** est stable par bâtiment : elle se déduit de l’identifiant de son plan ou de son nom de décor, jamais d’un tirage au rendu, de l’ordre de construction ni de ce qui est déjà bâti. Sur les plans d’un archipel, 20 à 30 % des toits sont en terre cuite ; deux toits voisins en terre cuite restent l’exception (DA, 28/09).

**3. Les falaises et les strates.** Réglées en R2, jamais redosées par archipel. R4b écrit dans `landMesh.ts` pour ses reliefs (gradins du 5e et du 3e) et reprend ces valeurs sans les changer : taches de ±0,08 sur environ 9 blocs, sur les dessus seulement ; strates de ±0,05 par tranche de 2 blocs, ±0,03 au-dessus de 4 blocs, épaisseur tirée par île (2 à 3 blocs) ; nuance entre 0,82 et 1,08, une pente à l’ombre jamais plus sombre que 0,85 fois le dessus voisin ; côte basse à 0,2 au-dessus de l’eau, frange de sable de 0,55 case ; au pied des hautes colonnes, un pied d’un bloc et des éboulis. Un archipel change la couleur de sa roche (dans son entrée de `ambianceDe`), jamais l’amplitude, l’épaisseur ni le rythme des strates. Aucune falaise n’est un mur gris uniforme.

**4. La fumée et la brume.** Une seule règle de mouvement, que R4b-6e construit et que reprennent R4b-4e (volcan, forge), R4b-5e (bancs), R4b-3e (nappes des sommets) et R5 (fumées du village et du port).

- **La forme** reste celle de R4 : `FUMEE` (croissance 0,35, fondu 0,3, 3 volutes), la teinte `SMOKE` `#A9A4A0` éclaircie.
- **Le mouvement de la fumée** (DA, 28/09) : les volutes montent et grossissent lentement, 6 s au moins d’une volute à la suivante ; elles dérivent sous un seul vent, dans la direction posée par R4, la même dans les quatre archipels ; aucune oscillation plus rapide qu’un cycle toutes les 5 s.
- **Le mouvement de la brume** : les nappes respirent sur 15 s ou plus, comme aujourd’hui ; leur opacité varie de ±10 % au plus et elles glissent de 0,1 case par seconde au plus (DA, 28/09).
- **La nuit**, la fumée prend `deNuit`, puis se fond à 50 % vers l’horizon de nuit (DA, 28/09) ; elle n’est jamais plus claire que la lueur d’horizon : pas de panache blanc sur un ciel sombre.
- **« Réduire les animations »** fige la fumée dans la pose immobile de R4 et fige la brume, d’un coup, sans fondu de sortie. Rien ne disparaît, rien ne clignote.
- **Rien ne passe devant ce qu’on lit** (référent dys) : aucune fumée ni brume derrière une étiquette, une flèche ou le bonhomme, pas seulement derrière le nom d’une île.

**5. La nuit.** Une seule couleur de nuit, `deNuit` (`palette.ts`), un bleu de crépuscule, jamais un noir. R4b, R5, R6 et la 2D la lisent ; aucun lot n’écrit sa propre nuit. Les entrées « nuit » des quatre palettes restent celles de R1 : elles ne sont pas un levier d’ambiance et ne se retouchent que dans la revue d’ensemble. Les lueurs passent par le pinceau des lueurs (lanternes, lave, lanterne du phare, fenêtres de R5 qui lisent le degré de nuit de `lumiere.ts`, lueurs de forge du 4e) ; toutes ensemble, elles couvrent moins de 5 % de l’image dans chaque capture de nuit (une île, l’archipel, la Carte). Aucune lueur ne clignote, ne pulse ni ne scintille (lave, forge, fenêtres, lanterne), et les fenêtres de R5 s’allument progressivement, jamais d’un coup (référent dys).

**6. Le soleil.** De face, en haut à gauche (`SOLEIL_DIRECTION`), le même dans les quatre archipels ; le contre-jour reste réservé aux illustrations (R1). Chaque archipel fait son ambiance par la palette et la brume seulement, dans son entrée de `ambianceDe(archipel)`.

- **Ce que l’entrée peut changer** (bornes fixées par le DA le 28/09, vérifiées par `world/palette.test.ts`) : le ciel de jour (zénith, horizon, lueur) ; la teinte du soleil et sa force, entre 2,0 et 2,4 ; l’ambiance du ciel et du sol, de force entre 0,95 et 1,2 ; la mer ou le plancher de nuages ; la brume de profondeur, entre 60 et 120 pour le proche et entre 250 et 360 pour le loin ; le voile, sa teinte et une force de 0,12 au plus ; les couleurs de sol et de roche, les nuages et l’ardoise des toits.
- **Ce qu’elle ne peut pas changer** : la direction du soleil, le vent, la nuit, les strates et la nuance, la règle de mouvement, le modèle du phare, les couleurs de la faune (baleine `#1E3A5C` à ventre crème, oiseaux blancs aux ailes grises) et la caméra.
- La brume ne voile jamais un nom d’île ni l’île où se tient le bonhomme (DA-02).

**7. Le commun aux quatre et les signatures.** Le commun, repris des fiches : ciel en dégradé et cumulus crème `#ECEEEE`, deux ou trois rangs de montagnes lointaines de plus en plus pâles (`#8B9F93`, puis `#B0CDD1`), mer de `#142B38` au loin à `#178078` près des côtes, falaises en strates, arbres en bouquets (trois tailles, deux verts `#7FB24E` et `#3F7A3A`), oiseaux et baleine de R3. Rien ne s’écrit dans la scène. Un repère ou un état ne se lit jamais à la seule couleur : les toits en ardoise ou en terre cuite ne portent aucune information, l’île fermée garde son étiquette « Fermée », de nuit aussi, et ni le voile ni la brume ne font descendre une étiquette sous le contraste du thème (référent dys). Aucun archipel n’est jumeau d’un autre : chacun a au moins trois repères signatures qu’aucun autre ne porte, le seul élément partagé est le phare (6e et 3e), et sur la planche des quatre au même cadrage, en niveaux de gris, chaque archipel se reconnaît à sa silhouette seule (DA, 28/09).

- **6e, Premiers Rivages** : le phare (le plan de l’île de la Tour), la fumée mince du volcan, sans lueur de lave, le village serré en terrasses, un ponton sur pilotis, un escalier de pierre vers une plage, le lagon `#1CB9CB`. Il ne prend au 4e ni son volcan fumant, ni ses échafaudages, ni sa grue.
- **5e, Îles Brumeuses** : des masses rocheuses hautes en gradins, un pont court et rigide, de pierre et de bois, entre deux masses, des tours et des ruines de pierre `#7D8A86` sur les sommets, des bancs de brume en couches sur l’eau (`#C5D9EB`, `#E5EBE3`), de la neige au loin seulement. Ni le phare du modèle, ni volcan, ni neige au premier plan.
- **4e, Anciens Ateliers** : l’atelier-forteresse en chantier (construit par R5), les échafaudages, la grue de bois du fond et le volcan fumant, petit et lointain (R4b), les lueurs de forge. L’horizon ambré fait le couchant, jamais l’orange seul. Ni le phare, ni les bancs de brume du 5e.
- **3e, Îles du Ciel** : le grand phare sur son socle de salles, l’île en gradins devant un massif enneigé continu, les toits enneigés, l’oiseau planeur, le plancher de nuages vers `#DDE3E8`. Ses nappes des sommets se fondent dans ce plancher, jamais en couches étagées comme au 5e. R4b-3e règle son ciel sur captures : la fiche demande un bleu franc, R1 l’a laissé lavande. Ni le village à colombages, ni le lagon du 6e.

**Frontière R4b / R5** : R4b ne dessine que les repères qui ne sont pas des plans (volcan, grue du fond, brume, pont du 5e) et le phare partagé ; tout ce qui se construit en blocs est à R5, dont l’atelier du 4e.

**8. Ce qui se juge dans la revue d’ensemble.** Les deux phares (mêmes proportions, bandes, galerie et anneau ; seuls la taille, le socle et le site changent). La lumière (les ombres tombent du même côté sur les quatre planches). La fumée et la brume (même rythme partout, figées avec « Réduire les animations »). La nuit (les quatre nuits de la même famille, les lueurs sous 5 %). Les toits (20 à 30 % en terre cuite par archipel). Les strates (même amplitude partout). Aucun archipel jumeau, vérifié en niveaux de gris. Les deux vues (la 2D peinte montre les mêmes silhouettes et les mêmes couleurs que la 3D). La lisibilité (Contraste élevé, étiquettes et consigne lisibles, DA-02). Le budget, mesuré par poste. L’avis du référent dys, rendu sur toutes les captures déclarées (les deux captures « animations réduites » identiques) et sur une courte vidéo sur tablette de la fumée et de la brume, avec et sans « Réduire les animations » : un rythme ne se juge pas sur une image fixe.

**Décidé par le mainteneur le 28 septembre 2026**, sur la recommandation du directeur artistique :

1. **Le phare du 6e** est celui du plan « Le phare de Grimoire » (`tour-phare`, île de la Tour), dessiné par R5 avec le modèle unique : sa restauration devient l’avant/après, et l’archipel n’a qu’un phare. R4b-6e construit le modèle sans le poser en repère. Le monument du 5e « Le phare du large » est dessiné par R5 comme une tour à feu de pierre, sans bandes ni toit conique.
2. **Au 5e, un pont court et rigide**, de pierre et de bois, comme sur la planche maître, et non une passerelle suspendue.
3. **Le volcan de l’île du Volcan (6e)** garde une fumée mince, sans lueur de lave, plus basse que le phare : le volcan fumant reste une signature du 4e.

### Les silhouettes des Premiers Rivages (R4b-6e)

À écrire par le sous-lot : ce qui est construit, ses mesures par poste, la décision du directeur artistique et l’avis du référent dys.

### Les silhouettes des Îles Brumeuses (R4b-5e)

À écrire par le sous-lot : ce qui est construit, ses mesures par poste, la décision du directeur artistique et l’avis du référent dys.

### Les silhouettes des Anciens Ateliers (R4b-4e)

À écrire par le sous-lot : ce qui est construit, ses mesures par poste, la décision du directeur artistique et l’avis du référent dys.

### Les silhouettes des Îles du Ciel (R4b-3e)

À écrire par le sous-lot : ce qui est construit, ses mesures par poste, la décision du directeur artistique et l’avis du référent dys.

### La construction du lot R5

À écrire par le lot : ce qui est construit, ses mesures par poste, la décision du directeur artistique et l’avis du référent dys.

### Les personnages du lot R6

À écrire par le lot : ce qui est construit, ses mesures par poste, la décision du directeur artistique et l’avis du référent dys.
