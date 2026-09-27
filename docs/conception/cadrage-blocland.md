# Cadrage — Le game design de Blocland (l’existant)

Blocland est le nom de travail du jeu, et reste celui de son module dans le code. Depuis le lot 1 de la migration, le jeu s’appelle **Archipéo** à l’écran, ses archipels de 6e, 5e et 4e portent leur nom d’Archipéo et les quêtes s’appellent des **missions**.

Ce document rassemble les décisions de game design en vigueur dans Blocland, prises du 25 au 27 septembre 2026, avec leur raison. Il remplace les anciens cadrages du monde, du village, des archipels et de « l’appli entière » : l’historique pull request par pull request reste dans git et dans le [journal](../journal.md). Ce que l’application fait, écran par écran, est dans le manuel ([L’aventure Blocland](../manuel/blocland.md)) ; le contenu île par île est dans [L’archipel](../pedagogie/archipel.md) et [Ouvrages et plans](../pedagogie/ouvrages.md). Le jeu migre vers Archipéo ([cadrage « De Blocland à Archipéo »](cadrage-archipeo.md)) : une décision qui change l’existant s’écrit là-bas, et ce document est mis à jour quand le lot est construit.

## Ce qu’on garde absolument

- **Rien à lire dans le monde** (3D ou 2D). Tout ce qui se lit est dans un panneau HTML, en police dys, lu à voix haute. Les seules exceptions sont les étiquettes des noms d’îles, dans la police de lecture, sur fond clair.
- **Pas de chrono, pas de classement, pas de perte.** Rien ne se retire à l’élève : un bloc gagné reste gagné, un voyage fait reste fait, une île où l’on a joué reste ouverte. Une sauvegarde ancienne est toujours migrée sans perte (les blocs posés qui ne servent plus reviennent dans l’inventaire).
- **Pas de réflexe.** Aucun geste ne demande de la vitesse ni de la précision ; toucher pour aller reste toujours possible.
- **Sessions courtes.** On peut passer deux minutes au village, poser trois blocs et repartir. Une pause est proposée après dix minutes (`SESSION_MAX_MINUTES`), sans rien bloquer.
- **« Réduire les animations »** remplace toute animation : ciel figé, créatures immobiles, pas de particules, caméra sans trajet, voyage en écran fixe, changement d’archipel sans fondu.
- **La vue simple est complète.** Tout ce qui se fait dans le monde se fait aussi en listes, sans WebGL ni Canvas : c’est aussi le chemin des lecteurs d’écran.
- **Pas de physique** : rien ne tombe, rien ne casse.
- **Cibles larges** (48 px au moins dans la barre du monde), et chaque geste du monde a un équivalent en bouton dans un panneau.
- **Rien d’emprunté** : formes, textures, sons et noms sont les nôtres, dessinés ou générés par le code ([Style](style.md)).
- **Tablette d’entrée de gamme** : un archipel à la fois. Tout construit, le monde en blocs dessine jusqu’à 79 000 triangles et 250 à 480 appels de dessin (Premiers Rivages), au-dessus du budget d’Archipéo ; un test l’empêche de grossir (voir les [mesures du lot R0](cadrage-archipeo.md#les-mesures-du-lot-r0)).

## L’appli entière

L’élève voyait deux applis collées : un portail de missions par matière et un jeu. Décision : **un seul jeu**, où chaque chose de l’appli a sa place dans le village. Une seule boucle : jouer, gagner des blocs, construire, ouvrir des îles.

- **Écran titre** : « Jouer » ouvre le village sur l’île du bonhomme ; « Continuer » (s’il y a une mission en cours) passe d’abord. L’écran titre retient l’adresse d’ouverture, pour ne pas faire perdre « Continuer ».
- **Le village au démarrage**, par défaut, avec un réglage « Au démarrage » (le village ou le menu) : une option réversible, pour qui ne veut pas du village. Sans dessin du monde possible, l’accueil reste le menu.
- **Un accès direct aux missions** est indispensable en classe et chez l’orthophoniste : un adulte ouvre « Homophones, niveau 2 » en deux touchers, sans traverser le village. D’où le menu en page (`#/menu`), les adresses des missions et des matières qui restent valides, et le bouton École de la barre du monde.
- **L’école du village**, sur l’île de l’école de chaque archipel (Forêt des sons, Marché des proportions, Atelier du calcul littéral, Phare des fonctions) : trois portes, une par matière, derrière elles les missions du portail. Elle est posée par le terrain, pas par un plan : on ne la construit pas, elle est là dès le début. Une mission du portail rapporte des **blocs de l’île de l’école de l’archipel où se tient le bonhomme**, au barème des missions d’île : pas de bloc « livre » à part, parce que le bloc de l’île sert tout de suite aux plans et aux ouvrages. Les missions du portail **ne comptent pas** pour les Gardiens ni pour les étoiles des îles : le Gardien reste lié aux missions de son île.
- **La salle des trophées**, au milieu du cœur de la même île : les succès y sont des objets posés (un trophée par succès, à une place fixe, le bloc dit la famille : or, cristal, quartz, lentille), ce qui donne une raison d’y revenir. Elle est au milieu parce que l’arrière gauche était caché par la créature en 3D.
- **Le menu du village** (bouton ⏸, ou bouton retour quand aucun panneau n’est ouvert) remplace l’ancien accueil et les onglets. Un second retour quitte l’appli ou revient à la page d’avant : le retour n’enferme jamais l’élève.
- **Sans onglets** sur téléphone : le village et son menu les remplacent, les pages gagnent leur place. La barre du haut garde le logo (l’accueil), Menu et Réglages.
- **Les mots** : « le menu » (en page ou dans le village), jamais « l’accueil », qui n’est que l’adresse `/`.

Le détail des écrans : [Le menu du village](../manuel/blocland.md#le-menu-du-village), [L’école du village](../manuel/blocland.md#lecole-du-village), [La salle des trophées](../manuel/blocland.md#la-salle-des-trophees).

## Le monde et les archipels

**Quatre archipels, une scène par classe** : les Premiers Rivages (6e), les Îles Brumeuses (5e), les Anciens Ateliers (4e), les Îles du Ciel (3e). Chacun a sa mer, son ciel, sa Carte et son budget de triangles ; on voit celui où se tient le bonhomme (`village.at`).

- **Pourquoi on a quitté le continent qui monte.** Un seul continent, où l’altitude montait avec la classe, reliait la 6e à la 5e par un escalier ou un tunnel comme deux îles voisines : rien ne marquait le changement de niveau. Le passage d’une classe à la suivante doit être un moment marquant, un « truc un peu waouh » : c’est le Bloc-Navire. Du continent, on garde l’altitude par classe (0, 3, 6, 9 : mer, collines, monts, sommets), devenue une ambiance uniforme de l’archipel, et les régions thématiques.
- **Des îles qui se distinguent.** Vingt îles identiques, plates et alignées ne permettaient pas de se repérer. Chaque île a un cœur de 16 × 16 (les bornes de mission, la zone des plans, la créature) sur une terre plus large aux contours irréguliers, une région et un relief (plat, collines, montagne enneigée, volcan et sa lave), des lacs, du décor, et un repère visible de loin (grand chêne, champignon géant, volcan qui fume, tour de guet, phare, aiguille de glace, haut-fourneau). Les îles en altitude flottent sur une roche qui s’amincit. Quelques paires d’îles se touchent par un isthme : le monde n’est pas qu’un semis d’îles.
- **Les îles fermées** restent visibles, délavées comme dans la brume : on devine ce qui attend. Les toucher fait dire à leur créature précisément ce qu’il faut (`lockedHint()`).
- **La première minute** : deux îles ouvertes (la Forêt et la Plaine en 6e ; ailleurs, le port seul), jour forcé tant que le tutoriel n’est pas vu, une flèche jaune « Commence ici » au-dessus de la Forêt tant qu’aucune mission n’a été jouée. Un élève doit voir deux îles vertes, pas vingt taches grises.
- **Un prochain objectif, un seul** (`nextGoal()`), en tête du panneau d’île : ce qu’on peut faire tout de suite, sinon le plus proche. Les sections Plan, Bloc-Navire et Ouvrages se replient quand il n’y a rien à y faire : le panneau reste court.
- **Une borne par mission** sur la rangée de devant de l’île, avec au-dessus un losange jaune (à faire) ou les étoiles gagnées : la progression se voit dans le monde, et toucher la borne lance la mission.

**La caméra est gérée par l’application.** Pas de zoom, de rotation ni de déplacement au doigt : un élève dys sur tablette ne doit pas gérer une caméra, et le nord reste toujours le même pour se repérer. Elle cadre l’île du bonhomme et ses voisines, tirée vers le centre de l’archipel et légèrement pivotée vers lui (`viewZone()`, `viewYaw()`), pour qu’une île du bord ne remplisse pas l’écran de mer ; au large, des rochers et des bancs de sable habillent la mer pour la même raison. Un toucher pendant un trajet fait arriver tout de suite ; au clavier, les flèches vont à l’île voisine.

**La Carte** montre l’archipel vu du ciel, avec un fanion sur le bonhomme. Toucher une île ouverte y envoie le bonhomme ; toucher une île fermée montre le chemin d’ouvrages qui reste à construire (`remainingPath()`), balisé en jaune dans le monde. On ne se perd jamais.

**Trois vues au choix** (réglage « Vue du monde ») : le monde en 3D, le monde en 2D, la liste des îles. Sans WebGL, la 3D laisse la place à la 2D ; la liste ne reste que pour un appareil qui ne sait rien dessiner.

## La vue 2D oblique

Sans WebGL, ou sur une tablette qui peine, Blocland retombait sur une liste d’îles : il manquait une vue légère qui garde l’aventure.

- **Perspective oblique en pixel art** : on voit le dessus des cases, et chaque dénivelé montre une face avant, comme une falaise. C’est une inspiration de point de vue ; formes, textures et personnages restent les nôtres.
- **Canvas 2D, sans bibliothèque** : pas de moteur de jeu à télécharger, et la vue 2D ne charge pas Three.js.
- **Le même monde, les mêmes gestes** : les deux vues partagent le contrat (`world/view.ts`), la simulation (`world/scene.ts` : marche, promenades, voyage, toucher) et les textures (`world/pixels.ts`). Seul le dessin diffère.
- **Sprites générés par le code** : le bonhomme en quatre directions, les créatures et les Gardiens tirés de leurs propres cubes pour garder leur silhouette.
- **Direction artistique** (validée sur la Forêt, puis étendue aux quatre archipels) : les premiers essais ressemblaient à une carte de cubes vue du ciel. D’où une caméra rapprochée (environ 13 cases, sans sortir de l’île, comme dans un jeu d’aventure), des bords de sol qui débordent en frange, des falaises à strates, des tuiles dessinées pour la 2D, le décor en sprites et des ombres.
- **Marche libre en option** (réglage « Marche libre », désactivé par défaut) : une croix de direction et un bouton « Entrer », case par case, jamais sur l’eau ni la lave, un bloc de dénivelé au plus. Aucun chronomètre ; toucher pour aller reste.

## Les ouvrages

Le pont était la seule liaison et les blocs le seul verrou. Décision : chaque liaison est un **ouvrage** d’une nature, qui coûte des blocs et parfois une condition, pour varier les chemins et lier la construction au reste du jeu.

- **Pont, bac, sentier** (entre deux îles qui se touchent) : des blocs seulement.
- **Escalier taillé** : des blocs et le premier plan de l’île de départ terminé (il faut des bâtisseurs).
- **Tunnel, col** : des blocs et le Gardien de l’île de départ vaincu.
- Tout bloc d’île paie tout ouvrage : les blocs gagnés n’importe où servent.
- Les ouvrages ne relient que des îles d’un même archipel ; chaque archipel est connexe depuis son port, et au moins deux ouvrages sans condition partent du port : l’arrivée n’est jamais bloquée. Dans un archipel, rien n’est imposé.
- Une condition qui manque s’affiche avec ce qu’il faut faire, sans pénalité ; un ouvrage possible est dessiné en fantôme, et le toucher ouvre sa proposition sur l’île ouverte qu’il touche (pas sur l’île d’en face, souvent fermée).
- **La fête** : la caméra vole jusqu’à l’île qui s’ouvre, sa créature accueille. Ouvrir une île doit se sentir, par la transformation, sans pluie d’éclats (lot 3 d’Archipéo).

## Le village, les plans et les coffres

Le village est en ruine et l’élève est le bâtisseur. **La construction est entièrement guidée** : chaque île a trois plans enchaînés (les murs, le toit, la cour), dessinés en fantômes bleutés ; un toucher sur un fantôme pose le bloc attendu. La zone libre (poser n’importe où) a été retirée : elle n’apportait rien face aux plans. Il n’y a donc pas de bloc mal posé à retirer.

- **Dans n’importe quel ordre** : on ne bloque jamais sur « le bon bloc suivant ». « Poser le bloc suivant » et « Poser tout ce que j’ai » évitent des dizaines de touchers.
- **Un plan terminé récompense** : la créature parle, un coffre, de l’XP, un succès, une ligne datée dans le journal du village.
- **Les coffres** donnent exactement les blocs de finition (toit, porte, lanterne, barrière, escalier) du plan suivant, calculés à partir du dessin : ces blocs ne se gagnent pas dans les exercices, et l’élève n’en manque jamais. Le dernier plan d’une île donne de l’or et du cristal, utiles aux ouvrages.
- **Le nouveau dessin des bâtiments** (`world/architect.ts`) : les petites cabanes de 15 à 20 blocs à toit plat ne ressemblaient à rien et n’employaient pas les blocs. Chaque île a une forme (maison, tour, dôme, échoppe, hutte, kiosque) choisie selon son thème, avec des fenêtres éclairées la nuit, dans une zone de 6 × 5 cases et six blocs de haut. Plus de blocs par bâtiment : un vrai usage des blocs qui s’accumulent.
- **Blocs selon les étoiles** : +1 bloc à deux étoiles, +2 à trois, +2 la première fois qu’une mission est jouée, et au moins un bloc dès une bonne réponse. Une première mission rapporte cinq à sept blocs : de quoi construire un pont et commencer un bâtiment. Le barème complet est une page générée.

## Les monuments

Une fois les bâtiments et les ouvrages faits, les blocs s’accumulaient sans usage. Réponse : les **monuments**, deux par archipel (`world/monuments.ts`), chacun sur son îlot au large d’une île.

- Un plan comme les autres, sans coffre ni condition : 60 à 125 blocs de plusieurs îles de son archipel.
- Il n’ouvre rien et ne bloque rien : on le construit à son rythme. De l’XP, et le succès Patrimoine au premier.
- Mes blocs y renvoie un bloc qu’aucun plan ni le navire n’attend.

## Le Bloc-Navire et le voyage

Passer à la classe suivante se gagne en construisant un véhicule, avec une belle animation, et **on revient toujours** au niveau précédent.

- **Un seul véhicule qui s’améliore** : le Bloc-Navire reçoit une voile (6e → 5e, par la mer), un ballon (5e → 4e, par les airs), un réacteur (4e → 3e, vers les îles du ciel). Une seule construction qui grandit, trois voyages. Il suit le voyageur : au port de l’archipel affiché, avec toutes les étapes déjà faites.
- **Il se construit comme un plan**, sur le quai de l’île-port, fantôme par fantôme : l’élève est le bâtisseur. Ses blocs viennent des îles de l’archipel ; aucun bloc rare.
- **Le kit arrive avec les Gardiens** : la voile, le haut du ballon et les feux du réacteur ne se gagnent pas, ils apparaissent quand assez de Gardiens de l’archipel sont vaincus (3, puis 2, puis 2). La condition a un effet visible ; l’élève pose tout le reste lui-même.
- **Embarquer est un acte explicite** (un bouton), jamais l’effet du dernier bloc. L’XP et le succès (Capitaine, Aéronaute, Pilote du ciel) arrivent au départ.
- **Le premier voyage** vers un archipel se joue en entier (huit secondes au plus) : c’est la récompense du chantier. Un toucher, Entrée, Espace ou Échap font arriver tout de suite.
- **Ensuite, changer d’archipel est discret** : rejouer la cinématique à chaque aller-retour lassait. Un fondu blanc d’une demi-seconde mène à l’île demandée, et le sélecteur d’archipel ouvre un archipel atteint d’un toucher.
- **Ce que ça change pour la progression** : un élève de 3e passe d’abord par les chantiers de 6e, 5e et 4e ; à l’intérieur d’un archipel, rien n’est imposé. Le nombre de Gardiens exigés et la taille de chaque étape se règlent dans `world/vehicle.ts`.

## Mes blocs

Retour des joueurs : « trop de blocs qui s’accumulent, on ne sait pas quoi en faire ». Décision : l’inventaire dit, pour chaque bloc, ce qu’il construit maintenant, et chaque chantier est un lien qui emmène la caméra et le bonhomme sur l’île (`world/uses.ts`). Les ouvrages payables sont listés une seule fois (tout bloc d’île paie tout ouvrage). Quand un bloc ne sert à rien, l’inventaire le dit honnêtement. Détail : [Mes blocs](../manuel/blocland.md#mes-blocs).

## La vie du monde

- **Jour et nuit selon l’heure réelle** (aube 7 h, crépuscule 20 h), avec une nuit toujours claire, jamais noire, et un bouton « Forcer le jour ». La nuit, les lanternes aux bouts des ouvrages et les fenêtres dessinent les chemins.
- **Les créatures** se promènent sur leur île sans gêner les bornes ni les fantômes, et parlent quand on les touche (bulle HTML lue à voix haute).
- **Les baleines** (quatre, au large) et les **oiseaux** font vivre la mer et le ciel ; chaque archipel a son ambiance (mer tempérée, turquoise et glace, bleu profond et ardoise, plancher de nuages sans baleine).
- **Les sons** sont générés par le code (Web Audio, aucun fichier). Par défaut, seuls les sons d’action ; l’ambiance est un réglage à activer. Jamais de son pendant la lecture à voix haute.
- **Les Gardiens** attendent sur un îlot devant leur île, relié par des pas japonais ; vaincus, ils deviennent une statue. Jamais d’arbre sur l’îlot : il cacherait le Gardien.

## Le bonhomme

Au départ, la caméra libre était un choix assumé, sans avatar. Le bonhomme est venu ensuite, pour qu’on voie d’un coup d’œil, même de loin, jusqu’où on est arrivé.

- Un personnage en blocs, qui se tient sur l’île où l’on est et marche d’île en île le long des ouvrages construits (`avatarRoute()`), en suivant le sol. Vers une île fermée, il reste où il est.
- La caméra le suit ; avec « réduire les animations », il apparaît à l’arrivée.
- La marche libre n’existe qu’en 2D, en option ([La vue 2D oblique](#la-vue-2d-oblique)).

Les règles des missions jouées depuis le monde (graine tirée au hasard, place de la réponse, montée de niveau sur une partie quasi parfaite) relèvent du moteur d’exercices : voir [Exercices](exercices.md).

## À venir

- **La vue 2D** : retirer la mention « expérimental » du réglage après un essai en classe.
- **Le premier voyage** : écouter les retours des enfants sur le nombre de Gardiens exigés (3, 2, 2) et la taille du premier chantier, à régler dans `world/vehicle.ts`.
- **Le village au démarrage** : observer combien d’élèves entrent à l’école depuis le monde et combien repassent le réglage « Au démarrage » sur « Le menu ».
