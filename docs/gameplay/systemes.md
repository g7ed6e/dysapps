# Les systèmes du jeu

Ce que fait le jeu aujourd’hui, système par système, avec la raison de chaque décision. Le jeu est commun aux univers : les noms ci-dessous sont ceux de Blocland, l’univers par défaut ; ceux d’Archipéo, en pause, sont dans sa [fiche](../univers/archipeo/game-design.md) et dans [Personnages et Gardiens](personnages.md). Le résumé et les questions ouvertes sont dans [Le game design](index.md) ; ce qui est décidé mais pas encore construit est dans les fiches ([GD-6](propositions/GD-6.md), [GD-7](propositions/GD-7.md)). Ce que l’application fait, écran par écran, est dans le [manuel](../../www/manuel/blocland.md) ; l’ergonomie des écrans, dans les [bonnes pratiques UX UI](../ux-ui/bonnes-pratiques.md#le-parcours-et-le-monde).

## Ce qui ne se négocie jamais

- **Rien à lire dans le monde** (3D ou 2D). Tout ce qui se lit est dans un panneau HTML, en police dys, lu à voix haute. Les seules exceptions sont les étiquettes des noms d’îles, dans la police de lecture, sur fond clair.
- **Pas de chrono, pas de classement, pas de perte.** Rien ne se retire à l’élève : un bloc gagné reste gagné, un voyage fait reste fait, une île où l’on a joué reste ouverte, un Gardien vaincu reste vaincu, même quand une mission arrive plus tard sur son île : sa statue reste, sa revanche reste ouverte, et ses étoiles et ce qu’il a ouvert (tunnels, cols, kit du Bloc-Navire) ne se retirent pas. Une sauvegarde ancienne est toujours migrée sans perte (les blocs posés qui ne servent plus reviennent dans l’inventaire).
- **Pas de réflexe.** Aucun geste ne demande de la vitesse ni de la précision ; toucher pour aller reste toujours possible.
- **Sessions courtes.** On peut passer deux minutes au village, poser trois blocs et repartir. Une pause est proposée après dix minutes (`SESSION_MAX_MINUTES`), sans rien bloquer.
- **« Réduire les animations »** remplace toute animation : ciel figé, créatures immobiles, pas de particules, caméra sans trajet, voyage en écran fixe, changement d’archipel sans fondu.
- **La vue simple est complète.** Tout ce qui se fait dans le monde se fait aussi en listes, sans WebGL ni Canvas : c’est aussi le chemin des lecteurs d’écran.
- **Pas de physique** : rien ne tombe, rien ne casse.
- **Cibles larges** (48 px au moins dans la barre du monde), et chaque geste du monde a un équivalent en bouton dans un panneau.
- **Rien d’emprunté** : formes, textures, sons et noms sont les nôtres, dessinés ou générés par le code ([Style](../rendu/style.md)).
- **Tablette d’entrée de gamme** : un archipel à la fois, et un test empêche le monde de grossir ; les mesures de chaque univers sont dans son cadrage ([Blocland](../univers/blocland/cadrage.md#ce-quon-garde-absolument)).

## Les archipels et les îles

**Quatre archipels, une scène par classe** : les Basses Terres (6e), les Collines du Large (5e), les Monts de Feu (4e), les Îles du Ciel (3e) ; Archipéo nomme les trois premiers les Premiers Rivages, les Îles Brumeuses et les Anciens Ateliers (GD-1). Chacun a sa mer, son ciel, sa Carte et son budget de triangles ; on voit celui où se tient le bonhomme (`village.at`).

- **Pourquoi on a quitté le continent qui monte.** Un seul continent, où l’altitude montait avec la classe, reliait la 6e à la 5e par un escalier ou un tunnel comme deux îles voisines : rien ne marquait le changement de niveau. Le passage d’une classe à la suivante doit être un moment marquant, un « truc un peu waouh » : c’est le Bloc-Navire. Du continent, on garde l’altitude par classe (0, 3, 6, 9 : mer, collines, monts, sommets), devenue une ambiance uniforme de l’archipel, et les régions thématiques.
- **Des îles qui se distinguent.** Vingt îles identiques, plates et alignées ne permettaient pas de se repérer. Chaque île a un cœur de 16 × 16 (les bornes de mission, la zone des plans, la créature ; 20 × 20 pour les quatre îles-écoles depuis le 1er octobre 2026, décision du mainteneur : deux cases de vraie terre plate en plus tout autour, au décor de côte sur leur rangée extérieure, leurs voisines écartées pour garder la mer et la longueur des ponts) sur une terre plus large aux contours irréguliers, une région et un relief (plat, collines, montagne enneigée, volcan et sa lave), des lacs, du décor, et un repère visible de loin (grand chêne, champignon géant, volcan qui fume, tour de guet, phare, aiguille de glace, haut-fourneau). Les îles en altitude flottent sur une roche qui s’amincit. Quelques paires d’îles se touchent par un isthme : le monde n’est pas qu’un semis d’îles.
- **Les îles fermées** restent visibles, délavées comme dans la brume : on devine ce qui attend. Les toucher fait dire à leur créature précisément ce qu’il faut (`lockedHint()`).
- **Un prochain objectif, un seul** (`nextGoal()`), en tête du panneau d’île : ce qu’on peut faire tout de suite, sinon le plus proche. Les sections Plan, Bloc-Navire et Ouvrages se replient quand il n’y a rien à y faire : le panneau reste court.
- **Une borne par mission** sur la rangée de devant de l’île, avec au-dessus un losange jaune (à faire) ou les étoiles gagnées (une seule pile dessinée par borne, LV2-4) : la progression se voit dans le monde, et toucher la borne lance la mission.

**Deux vues au choix** (réglage « Vue du monde ») : le monde en 3D, la liste des îles. Le monde en 2D a quitté le réglage le 28 septembre 2026 (décision du mainteneur : Blocland n’est pas en 2D, voir [les univers](../univers/univers.md)) . La 2D n’est pas non plus un repli de la 3D (décision du mainteneur, 29 septembre 2026) : sans WebGL, l’appareil montre la liste des îles.

## L’île de l’école

L’élève voyait deux applis collées : un portail de missions par matière et un jeu. Décision : **un seul jeu**, où chaque chose de l’appli a sa place dans le village. Une seule boucle : jouer, gagner des blocs, construire, ouvrir des îles.

- **L’école du village**, sur l’île de l’école de chaque archipel (Forêt des sons, Marché des proportions, Atelier du calcul littéral, Phare des fonctions) : trois portes, une par matière, derrière elles les missions du portail. Elle est posée par le terrain, pas par un plan : on ne la construit pas, elle est là dès le début. Une mission du portail rapporte des **blocs de l’île de l’école de l’archipel où se tient le bonhomme**, au barème des missions d’île : pas de bloc « livre » à part, parce que le bloc de l’île sert tout de suite aux plans et aux ouvrages. Les missions du portail **ne comptent pas** pour les Gardiens ni pour les étoiles des îles : le Gardien reste lié aux missions de son île.
- **La salle des trophées**, dans le cœur de la même île (à gauche du village, voir les trois bandes) : les succès y sont des objets posés (un trophée par succès, à une place fixe, dans l’ordre de la liste des succès ; le bloc dit la famille : or, cristal, quartz, lentille), ce qui donne une raison d’y revenir. Depuis GD-3 (décidée par le mainteneur le 1er octobre 2026, option B), plus aucun trophée n’est posé sur le toit : la salle de départ (4 × 3) garde 12 places sous son toit (six socles, deux rangs), puis s’agrandit d’une travée de 2 × 3 cases à sa gauche dans le cœur (les x décroissants ; à droite de l’écran dans la vue de l’île) au 13e succès et au 19e, jusqu’à 8 × 3 (`src/blocland/world/salle.ts`). L’emprise de 8 × 3 est réservée dès le départ, en sol nu, de (0, 8) à (7, 10) dans le cœur ; la porte de la salle ne bouge pas. La créature de l’île-école ne se tient plus entre la caméra et la salle : elle va derrière (au Marché, tournée d’un quart et immobile ; à la Forêt des sons, à la place d’un arbre retiré). Le bonhomme ne marche pas sur l’emprise. Dans Blocland, c’est une exception au dessin figé, décrite dans sa [fiche](../univers/blocland/fiche.md#4-ce-que-les-lots-1-à-5-ont-changé-pour-tous).
- **L’île-école en trois bandes** (redistribution choisie par le mainteneur le 2 octobre 2026, piste 2 « Trois bandes » ; sur les quatre îles-écoles seulement, coordonnées dans le cœur) : **devant**, les bornes seules, au pas de 4, centrées sur la visée de la caméra, en (4, 1), (8, 1) et (12, 1) ; (0, 1) et (16, 1) restent réservées à une île qui aurait cinq missions (`PLACES_DES_BORNES_DES_ECOLES`, `world/terrain.ts`). **Au milieu**, le village : la salle des trophées à gauche (inchangée, GD-3), une place libre, puis l’école à droite, de (12, 3) à (16, 6), porte en (14, 2), une case libre entre elle et le bord droit du cœur (elle était devant, en (11, 1)). **Au fond**, ce que l’on construit : la zone des plans, de 6 × 6 au lieu de 6 × 5 (une rangée de plus vers le fond, même coin : aucune clé de sauvegarde ne change ; `zoneDesPlans`, `world/plans.ts`), et la Fabrique au bord droit, en (15, 11), porte en (16, 10), une allée d’une case entre elle et la zone. Le plateau, qui passait sous l’école, s’arrête à la colonne 11. La créature reste derrière la salle. Rien ne se pose devant la porte d’un lieu ni une case autour. Le décor déplacé et les exceptions au dessin figé de Blocland sont dans sa [fiche](../univers/blocland/fiche.md#4-ce-que-les-lots-1-à-5-ont-changé-pour-tous). **Écart du toit**, tranché par le directeur artistique le 2 octobre 2026 : accepté à la Forêt et au Phare (bord avant seulement) ; au Marché et à l’Atelier, les plans se dessinent une rangée plus au fond (y 11 à 15, `PLANS_AU_FOND`, `world/plans.ts`, sur le modèle de `decalageDuQuai`), la rangée avant de la zone reste une allée nue, sans que les clés de sauvegarde changent ; seuil de 6 points sur 45 par case (`world/troisBandes.test.ts`).

Le détail des écrans : [Le menu du village](../../www/manuel/blocland.md#le-menu-du-village), [L’école du village](../../www/manuel/blocland.md#lécole-du-village), [La salle des trophées](../../www/manuel/blocland.md#la-salle-des-trophées).

## Les ouvrages

Le pont était la seule liaison et les blocs le seul verrou. Décision : chaque liaison est un **ouvrage** d’une nature, qui coûte des blocs et parfois une condition, pour varier les chemins et lier la construction au reste du jeu.

- **Pont, bac, sentier** (entre deux îles qui se touchent) : des blocs seulement.
- **Escalier taillé** : des blocs et le premier plan de l’île de départ terminé (il faut des bâtisseurs).
- **Tunnel, col** : des blocs et le Gardien de l’île de départ vaincu.
- Tout bloc d’île paie tout ouvrage : les blocs gagnés n’importe où servent.
- Les ouvrages ne relient que des îles d’un même archipel ; chaque archipel est connexe depuis son port, et au moins deux ouvrages sans condition partent du port : l’arrivée n’est jamais bloquée. Dans un archipel, rien n’est imposé.
- Une condition qui manque s’affiche avec ce qu’il faut faire, sans pénalité ; un ouvrage possible est dessiné en fantôme, et le toucher ouvre sa proposition sur l’île ouverte qu’il touche (pas sur l’île d’en face, souvent fermée).
- **La fête** : la caméra vole jusqu’à l’île qui s’ouvre, sa créature accueille. Ouvrir une île doit se sentir, par la transformation, sans pluie d’éclats.

## Le village, les plans et les coffres

Le village est en ruine et l’élève est le bâtisseur. **La construction est entièrement guidée** : chaque île a trois plans enchaînés (les murs, le toit, la cour), dessinés en fantômes bleutés ; un toucher sur un fantôme pose le bloc attendu. La zone libre (poser n’importe où) a été retirée : elle n’apportait rien face aux plans. Il n’y a donc pas de bloc mal posé à retirer.

- **Dans n’importe quel ordre** : on ne bloque jamais sur « le bon bloc suivant ». « Poser le bloc suivant » et « Poser tout ce que j’ai » évitent des dizaines de touchers.
- **Un plan terminé récompense** : la créature parle, un coffre, de l’XP, un succès, une ligne datée dans le journal du village.
- **Les coffres** donnent exactement les blocs de finition (toit, porte, lanterne, barrière, escalier) du plan suivant, calculés à partir du dessin : ces blocs ne se gagnent pas dans les exercices, et l’élève n’en manque jamais. Le dernier plan d’une île donne de l’or et du cristal, utiles aux ouvrages.
- **Le nouveau dessin des bâtiments** (`world/architect.ts`) : les petites cabanes de 15 à 20 blocs à toit plat ne ressemblaient à rien et n’employaient pas les blocs. Chaque île a une forme (maison, tour, dôme, échoppe, hutte, kiosque) choisie selon son thème, avec des fenêtres éclairées la nuit, dans une zone de 6 × 5 cases (6 × 6 sur les îles-écoles) et six blocs de haut. Plus de blocs par bâtiment : un vrai usage des blocs qui s’accumulent.
- **Blocs selon les étoiles** : +1 bloc à deux étoiles, +2 à trois, +2 la première fois qu’une mission est jouée, et au moins un bloc dès une bonne réponse. Une première mission rapporte cinq à sept blocs : de quoi construire un pont et commencer un bâtiment. Le barème complet est une page générée.

- **Le village en cinq états** : abandonné, réactivation, reconstruction, développement, port, déduits à chaque rendu de la progression (`world/villageStage.ts`), jamais enregistrés. Ils se voient au port en cubes statiques (lanternes, barques, fumée, caisses, fanions, feu de port) et se lisent en HTML. La montée d’un état se dit une fois, avec une cloche.

## Les monuments

Une fois les bâtiments et les ouvrages faits, les blocs s’accumulaient sans usage. Réponse : les **monuments**, deux par archipel (`world/monuments.ts`), chacun sur son îlot au large d’une île.

- Un plan comme les autres, sans coffre ni condition : 60 à 125 blocs de plusieurs îles de son archipel.
- Il n’ouvre rien et ne bloque rien : on le construit à son rythme. De l’XP, et le succès Patrimoine au premier.
- Mes blocs y renvoie un bloc qu’aucun plan ni le navire n’attend.
- Chacun demande aussi 4 à 8 **blocs assemblés** de son archipel, aux endroits qui comptent ([GD-2](propositions/GD-2.md)) : Poutre (6e), Vitrail (5e), Engrenage (4e), Miroir (3e). Aucune île ne les donne ; on les assemble à la **Fabrique**, un troisième lieu de l’île de l’école à droite au fond du cœur, derrière l’école, à côté de la zone des plans, avec trois blocs de deux îles de l’archipel, un à la fois, sur une recette fixe et toujours affichée (`world/assemblage.ts`). Chaque bloc assemblé demande de répondre à une question qui mêle les deux matières scolaires de la recette (`AssemblageQuestion.tsx`, questions dans `docs/contenu/assemblage.md`) : ni XP ni étoiles, rien ne se perd en cas d’erreur ou en quittant. Recettes et noms (du lieu et des blocs, propres à chaque univers) : `docs/contenu/assemblage.md`. Une case déjà posée reste posée.

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

Retour des joueurs : « trop de blocs qui s’accumulent, on ne sait pas quoi en faire ». Décision : l’inventaire dit, pour chaque bloc, ce qu’il construit maintenant, et chaque chantier est un lien qui emmène la caméra et le bonhomme sur l’île (`world/uses.ts`). Les ouvrages payables sont listés une seule fois (tout bloc d’île paie tout ouvrage). Quand un bloc ne sert à rien, l’inventaire le dit honnêtement. Détail : [Mes blocs](../../www/manuel/blocland.md#mes-blocs).

## La vie du monde

- **Jour et nuit selon l’heure réelle** (aube 7 h, crépuscule 20 h), avec une nuit toujours claire, jamais noire ; le réglage « La lumière du monde » (Réglages, Vue du monde) garde toujours le jour, et c’est le jour tant que le tutoriel du village n’est pas vu (le bouton « Forcer le jour » de la barre du bas l’a rejoint, allègement de l’interface, 1er octobre 2026). La nuit, les lanternes aux bouts des ouvrages et les fenêtres dessinent les chemins.
- **Les créatures** se promènent sur leur île sans gêner les bornes ni les fantômes, et parlent quand on les touche (bulle HTML lue à voix haute).
- **Le mot des grandes étapes** (la baleine dans Archipéo ; dans Blocland, la créature de l’île-école le dit depuis GD-1 : Mousso, Bazar, Ixe, Fi, son nom écrit dans le titre de la bulle et son portrait en cubes, `baleine.parle` de `src/univers/`) se dit aux grandes étapes d’un archipel seulement : l’arrivée (en 6e, sa présentation après le tutoriel), le dernier Gardien vaincu, l’île-port bâtie, le premier ouvrage payé. Les étapes se déduisent de la sauvegarde (`world/whale.ts`) ; le « déjà dit » est noté par appareil (`baleine` dans le stockage local ; l’arrivée garde la clé de l’ancienne bulle `archipel-5e`…), jamais dans la sauvegarde. Une seule parle à la fois, la plus grande. Son panneau remplace les bulles d’arrivée des créatures-port ; une baleine du décor passe au large de l’île concernée (`whalePass` du contrat des vues), sauf avec « Réduire les animations ».
- **Les baleines** (quatre, au large, qui ne parlent pas dans Blocland) et les **oiseaux** font vivre la mer et le ciel ; chaque archipel a son ambiance (mer tempérée, turquoise et glace, bleu profond et ardoise, plancher de nuages sans baleine).
- **Les sons** sont générés par le code (Web Audio, aucun fichier). Par défaut, seuls les sons d’action ; l’ambiance est un réglage à activer. Jamais de son pendant la lecture à voix haute.
- **Les Gardiens** attendent sur un îlot devant leur île, relié par des pas japonais ; vaincus, ils deviennent une statue dans Blocland (la sentinelle se rallume dans Archipéo), qui le reste même si une mission arrive ensuite sur leur île. Jamais d’arbre sur l’îlot : il cacherait le Gardien. Sur les îles-écoles, l’îlot garde sa rangée mais glisse sur le côté, hors de l’axe de la caméra vers la créature, l’école et la salle des trophées, avec au moins 3 cases d’eau de tous les côtés (1er octobre 2026) ; il glisse de 9 cases, de 7 à l’Atelier pour rester plus près de son île que de la Forge (`RETOUCHES_DE_L_ILOT`). Les marges des îles-écoles portent sur leur rangée extérieure le décor de la côte et, de loin en loin, un jalon (pierre, touffe ou rondin, un par suite de cinq cases nues), jamais sur la rangée où l’on marche ; rien n’est posé sur la rangée de côte devant les bornes, pour qu’elles se lisent d’un coup d’œil.

## Le bonhomme

Au départ, la caméra libre était un choix assumé, sans avatar. Le bonhomme est venu ensuite, pour qu’on voie d’un coup d’œil, même de loin, jusqu’où on est arrivé.

- Un personnage en blocs, qui se tient sur l’île où l’on est et marche d’île en île le long des ouvrages construits (`avatarRoute()`), en suivant le sol. Vers une île fermée, il reste où il est.
- La caméra le suit ; avec « réduire les animations », il apparaît à l’arrivée.

Les règles des missions jouées depuis le monde (graine tirée au hasard, place de la réponse, montée de niveau sur une partie quasi parfaite) relèvent du moteur d’exercices : voir [Exercices](../conception/exercices.md).
