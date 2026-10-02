# GD-3 : Les trophées sous le toit, une salle qui s’agrandit au fil des succès

**État** : Décidée le 1er octobre 2026 (option B)
**Portée** : Commun

## Le constat

Aujourd’hui, la salle des trophées (4 × 3 cases, sur l’île de l’école de chaque archipel) a une place par succès, 24 en tout (`TROPHY_SLOTS`, `src/blocland/world/terrain.ts`). Elles se remplissent dans cet ordre : 6 sur les socles, 4 sur le faîte, 6 en second rang sur les socles, 8 au bord du toit. La moitié des trophées finit donc sur le toit.

- **Dans Blocland**, le toit est en blocs : un trophée sur le faîte se voit de loin, et le consultant de Blocland y tient comme à un repère.
- **Dans Archipéo** (6e, #279), le toit est en versants. Un trophée sur le toit garde sous lui un bloc de toit plat. De 8 à 18 succès, le faîte devient une colonne d’or et le toit est mi-pente, mi-blocs. Avec les 24, la salle redevient une pile de blocs. Le lieu perd sa silhouette (DA-03), et plus l’élève gagne, plus sa salle s’abîme : c’est l’inverse de DP-09.
- **Dans les deux univers**, un trophée posé sur un toit n’est pas exposé : il est rangé là faute de place.
- **Au-delà de 24 succès**, il n’y a plus de place : `trophyModel` coupe la liste, et un 25e succès n’aurait pas de trophée, sans que rien ne le signale.

## La proposition

Plus aucun trophée sur le toit, dans les deux univers. Le toit et le faîte d’or ne portent plus que le toit. Deux options.

**Option A : tout sous le toit, salle de taille fixe.** La salle prend un rang de hauteur. Le fond de velours devient des étagères. Les 24 trophées tiennent sur les socles, en trois rangs, et sur les étagères du fond.
- Ce que l’élève voit : la même salle, un peu plus haute, qui se remplit de l’intérieur ; de loin, les trophées se voient par l’ouverture.
- Limites : il faut des trophées plus petits qu’une case ou une salle plus grande dès le départ. Une salle presque vide paraît trop grande. Un 25e succès oblige à tout redessiner.

**Option B (recommandée) : une salle qui s’agrandit d’une travée.** La salle de départ (4 × 3) garde 12 places sous son toit : 6 socles, sur deux rangs. Les 6 premières places ne bougent pas. Les places 7 à 12 sont celles du second rang, qui occupe aujourd’hui les places 11 à 16. Ensuite, chaque groupe de 6 succès ajoute une travée sur le côté de la salle. Une travée fait 2 cases de large et 3 de profondeur. Elle a ses piliers, son pan de toit dans le prolongement du faîte d’or, son fond de velours et ses 3 socles sur deux rangs. Elle apparaît entière, au retour dans le monde, avec une célébration sobre (DA-05).
- Avec 24 succès : deux travées, et une salle de 8 × 3.
- La récompense agrandit le monde (DP-09) : la salle s’allonge et son faîte d’or aussi. De loin, ce faîte qui grandit remplace, dans Blocland, le repère du trophée posé sur le toit.
- Dans Blocland : un pavillon de marbre en blocs qui s’allonge, des trophées en blocs, posés sur les socles.
- Dans Archipéo : une halle de village au kit de l’archipel, du colombage pour le 6e, qui gagne une travée, toujours en versants. La profondeur reste de 3 cases : le faîte d’or ne change pas.
- La place des travées est réservée dès le départ, sans socle vide ni chantier à combler (DP-12). C’est du sol nu jusqu’à ce que la travée arrive.
- 8 × 3 est un plafond : à gauche de la salle, le cœur de l’île s’arrête (bord, collines, arbre, arrivée d’un sentier). Une fiche qui ajouterait des succès au-delà de 24 devra trouver une autre place. Un test vérifie que chaque succès de `BADGES` a sa place, au lieu de couper la liste sans bruit.

Pourquoi B : elle règle le toit et fait de la récompense un agrandissement du monde. A ne règle que le toit, avec des trophées plus petits qu’une case.

**Où la salle s’allonge** (réponse de l’artiste technique 3D) : vers la gauche, seul côté libre ; à droite, la zone des plans et le plateau ferment la place. L’emprise de 8 × 3 est réservée dès le départ ; la salle actuelle reste à droite et sa porte ne bouge pas. Au 6e, au 4e et au 3e, elle tient sans rien déplacer : bornes, ouvrages, créature et caméra restent en place, et l’ouverture reste tournée vers la caméra. Aux Îles Brumeuses (5e), la créature du Marché occupe aujourd’hui cette place : elle tourne d’un quart, comme celle du Refuge, et tous les chemins restent ouverts. Ce quart de tour se voit dans les deux univers : il est à valider par le directeur artistique et les deux consultants dans le lot.

## Ce qui ne bouge pas

- **La sauvegarde** : les succès gagnés et la façon de les gagner ne changent pas. Seule leur place dans le monde change, et les trophées en sont déduits, jamais enregistrés.
- **Les identifiants et les adresses** : le lieu `trophees`, `#/aventure/trophees` ; en vue simple, toujours la page Succès.
- **L’ordre des trophées** : celui de la liste des succès, comme aujourd’hui. Le fait qu’un trophée change de place quand un succès plus haut dans la liste arrive est un autre sujet.
- **Le bloc de chaque famille** : or, cristal, quartz, lentille, marbre.
- **Le toucher** : toucher la salle, une travée ou un trophée y fait marcher le bonhomme et ouvre le panneau. Le panneau dit toujours « N trophées sur 24 ».
- **Les règles en jeu** : DP-09, DA-03, DA-05, DP-12 ; univers.md §4 (identifiants, sauvegarde, progression et interface communs ; seul le dessin suit l’univers) ; rien à lire dans le monde ; rien ne se perd, donc une travée ne disparaît jamais.

## Le coût

- **La taille** : une petite pull request commune (environ 60 lignes dans `terrain.ts`, une ligne du kit du 6e, la créature du Marché), à faire avant 7c.
- **Les fichiers** :
  - le code : `src/blocland/world/terrain.ts` (`TROPHY_SLOTS`, `trophyModel`, l’emprise de la salle, la place de la créature du Marché) ; `world/architecture/lieux.ts` et `kits/6e.ts` (les piliers lus par colonne) ;
  - les tests : `terrain.test.ts`, `lieux.test.ts`, `three/cubes.test.ts` (Blocland), `world/budget.test.ts`, et les empreintes à régénérer (l’emprise est réservée dès le départ) ;
  - les captures : `scripts/rendu/mesures.mjs` (familles `lieux-salle` et `lieux-pres`, dont le cadre s’élargit) ;
  - la documentation : le manuel `www/manuel/blocland.md` (« La salle des trophées »), `style.md`, `cadrage-blocland.md`, `cadrage-archipeo.md`, `design/blocland/fiche.md`, `decisions.md`.
- **Les captures** : dans les deux univers, la salle avec 0, 6, 12, 18 et 24 succès, de jour et de nuit, de près et de loin.
- **Blocland** : le dessin de la salle change dans un univers dont le dessin est figé (`blocland-reference`). Cela demande l’accord de son consultant.
- **Le budget de triangles**, mesuré sur un prototype : au 6e, 5 992 triangles avec les 24 trophées (5 990 aujourd’hui), au plus 6 014 à 19 succès, toujours 2 appels, pour une enveloppe de 6 500 : aucun transfert. Le 5e passe de 7 061 à 7 027 (enveloppe 7 100). Blocland : 62 196 au lieu de 62 160, sans enjeu.
- **La sauvegarde** : pas touchée.

## Les avis

- Directeur artistique : auteur de la fiche ; recommande l’option B.
- Consultant d’Archipéo : Fidèle, préfère B. B règle le toit en versants qui redevient une pile de blocs et fait de la halle du 6e une halle de village qui s’allonge par travées ; A ne fait que remplir une boîte et s’arrête à 24. À reprendre dans le lot : chaque travée au kit de son archipel (colombage sans décharge au 6e, pierre grise au 5e, pierre et bois au 4e, pierre de taille et toit enneigé au 3e), le pignon au bout de la halle et aucun au milieu ; la place réservée reste le sol de l’île, sans dalle ni marque ; « travée » reste dans la fiche et le code, l’élève lit toujours « salle des trophées » et « N trophées sur 24 ».
- Consultant de Blocland : À ajuster, accepte B et la préfère à A (A demanderait des trophées plus petits qu’une case, ce qui casse la grille de cubes). Conditions : la travée reste en cubes entiers, dans les matières d’aujourd’hui (marbre, velours, pierre de taille, faîte d’or au même rang) ; la perte du repère vu de loin se vérifie sur captures de loin, jour et nuit, à 6, 12, 13 et 24 succès, avant qu’il lève son avis ; la salle qui grandit ne cache aucune borne et la créature ne cache pas les travées ; l’exception au dessin figé de Blocland s’écrit dans `design/blocland/fiche.md` et `cadrage-blocland.md`, avec les empreintes et `three/cubes.test.ts` mis à jour dans la même pull request.
- Référent dys : Adapté pour B, sous conditions à vérifier sur captures (A convient moins : des trophées plus petits qu’une case font des cibles plus petites). La salle de départ et ses 6 premières places ne bougent pas, et elle ne grandit que d’un côté : le repère reste stable. Une travée apparaît d’un coup, sans secousse, sans caméra imposée, sans son pendant la lecture du panneau, et sans transition quand l’appareil demande moins d’animations. Son arrivée ne passe pas que par l’image : une phrase courte, écrite et lue (« La salle s’agrandit. »). La salle, chaque travée et chaque trophée mènent au même panneau ; le sol réservé n’est pas une cible piège. Les trophées restent visibles de nuit sous le toit et se reconnaissent à leur forme. Pour lever ses réserves : les captures annoncées, dont une sur téléphone en grand texte, et un test de l’arrivée d’une travée avec « Réduire les animations ».
- Artiste technique 3D : B faisable, en allongeant la salle vers la gauche ; elle tient sans rien déplacer au 6e, au 4e et au 3e ; au 5e, la créature du Marché tourne d’un quart. Coût mesuré sur un prototype : au plus 6 014 triangles au 6e, 2 appels, aucun transfert. Petite pull request. 8 × 3 est un plafond : au-delà de 24 succès, plus de place à gauche.

## La décision

1er octobre 2026, mainteneur : « b ». L’option B est retenue : plus aucun trophée sur le toit, une salle qui s’agrandit d’une travée tous les 6 succès, vers la gauche, jusqu’à 8 × 3 cases. Le quart de tour de la créature du Marché se valide dans le lot qui la construit, par le directeur artistique et les deux consultants.

**La place retenue sur le cœur de 20 × 20** (étude de l’artiste technique 3D, 1er octobre 2026, après #290) : l’emprise de 8 × 3 va de (0, 8) à (7, 10) dans le repère du cœur, sur les quatre îles-écoles ; la salle de départ en tient la droite (x de 4 à 7), sa porte reste en (6, 7), les travées s’ajoutent à gauche (x de 2 à 3, puis de 0 à 1). Le sol y est plat (hauteur 0) partout. Bornes, ouvrages, portes et caméra ne bougent pas ; la créature ne se tient jamais devant une porte. Au Marché, sans le quart de tour, la créature irait derrière la salle, en (−2, 11) : tournée, elle se tient devant, à gauche, en (−1, 3). Tranché ensuite par le directeur artistique (2 octobre 2026, sur captures) : vue de l’île, la créature se tenait entre la caméra et les travées sur les quatre îles-écoles, Marché compris malgré le quart de tour ; elle quitte la vue de la salle et se tient derrière elle, sauf à la Forêt des sons, où Mousso, immobile près de la côte, cache la seconde travée à partir du 19e succès (détail : lot 7 du cadrage Archipéo). La phrase « La salle s’agrandit. » est reportée par le mainteneur (2 octobre 2026). Le lieu où l’on assemble (3 × 5, #272, fusionné) se tient sur la place gardée libre, hors de l’emprise : de (14, 11) à (16, 15), sa porte en (15, 10), à côté de la zone des plans du côté des x croissants (derrière l’école).
