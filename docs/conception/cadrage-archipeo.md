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
| **R3. La mer et la faune** | Eau en dégradé de profondeur, écume, houle légère ; baleine, oiseaux et nuages en formes facettées. | M |
| **R4. Le décor** | Arbres, rochers et repères en primitives basse résolution, dessinés en instances à partir du décor déjà rangé par la 2D (`propsOf()`, déplacé dans `world/`). | M |
| **R4b. Les silhouettes des archipels** | Pour chaque archipel : un relief propre (masses rocheuses en gradins pour le 5e, atelier de pierre en chantier pour le 4e avec le volcan en repère lointain, île en gradins devant un massif enneigé pour le 3e), trois ou quatre repères signatures (phare pour le 6e ; passerelle suspendue et nappe de brume sur l’eau pour le 5e ; atelier-forteresse, échafaudages, grue de bois et volcan fumant au fond pour le 4e ; grand phare sur un socle de salles de pierre pour le 3e, de la même famille que celui du 6e) et une ambiance de lumière. Rien ne s’écrit dans la scène ; « Réduire les animations » coupe la fumée et la brume qui bouge. Le directeur artistique valide chaque archipel sur captures, de près et de loin, de jour et de nuit ; l’artiste technique 3D vérifie le budget (la planche est dense, et elle montre le 4e deux fois sur sa carte : une erreur à ne pas reproduire). Ajouté le 27 septembre 2026 à la demande du mainteneur. | L |
| **R5. La construction taillée** | Bâtiments, ouvrages, bornes, monuments et navire en blocs taillés et peints (couleurs par sommet, biseaux) ; fantômes translucides unis ; fenêtres qui s’allument la nuit. Cases et sauvegarde inchangées. | M |
| **R6. Les personnages** | Le bonhomme, les créatures redessinées et les Gardiens en sentinelles, en primitives peintes, pour la 3D et les sprites de la 2D. | M |
| **R7. La 2D peinte** | La vue oblique garde sa projection et ses gestes, mais ses tuiles et sprites passent en aplats et dégradés sur la palette commune. **Construit** derrière le drapeau (voir [le style](style.md)). | L |

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

