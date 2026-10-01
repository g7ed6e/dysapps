# GD-3 : Les trophées sous le toit, une salle qui s’agrandit au fil des succès

**État** : Proposée
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
- Au-delà de 24 succès, la même règle continue : une travée de plus par groupe de 6 succès. La fiche qui ajoutera des succès réservera la place de la travée suivante. Un test vérifie que chaque succès de `BADGES` a sa place, au lieu de couper la liste sans bruit.

Pourquoi B : elle règle le toit, elle fait de la récompense un agrandissement du monde, et elle tient s’il y a un jour plus de succès. A ne règle que le toit, et seulement jusqu’à 24.

**Question ouverte pour l’artiste technique 3D** : de quel côté la salle s’allonge. La zone des plans touche son rang du fond à droite (`PLAN_ZONE`), donc a priori vers la gauche. Il faut qu’aucune borne ne soit cachée (`style.md`, « Les bornes de mission »), que la place de la créature et le chemin du bonhomme restent libres, et que l’ouverture reste tournée vers la caméra.

## Ce qui ne bouge pas

- **La sauvegarde** : les succès gagnés et la façon de les gagner ne changent pas. Seule leur place dans le monde change, et les trophées en sont déduits, jamais enregistrés.
- **Les identifiants et les adresses** : le lieu `trophees`, `#/aventure/trophees` ; en vue simple, toujours la page Succès.
- **L’ordre des trophées** : celui de la liste des succès, comme aujourd’hui. Le fait qu’un trophée change de place quand un succès plus haut dans la liste arrive est un autre sujet.
- **Le bloc de chaque famille** : or, cristal, quartz, lentille, marbre.
- **Le toucher** : toucher la salle, une travée ou un trophée y fait marcher le bonhomme et ouvre le panneau. Le panneau dit toujours « N trophées sur 24 ».
- **Les règles en jeu** : DP-09, DA-03, DA-05, DP-12 ; univers.md §4 (identifiants, sauvegarde, progression et interface communs ; seul le dessin suit l’univers) ; rien à lire dans le monde ; rien ne se perd, donc une travée ne disparaît jamais.

## Le coût

- **La taille** : une petite pull request commune, à faire après la suite du lot 7b, avant 7c.
- **Les fichiers** :
  - le code : `src/blocland/world/terrain.ts` (`TROPHY_SLOTS`, `trophyModel`, une emprise de la salle qui dépend du nombre de succès, `placeCells`, `placeSpot`) ; `world/architecture/lieux.ts` et `kits/6e.ts` (la travée au kit) ;
  - les tests : `terrain.test.ts`, `lieux.test.ts`, `three/cubes.test.ts` (Blocland) et `world/budget.test.ts` ;
  - les captures : `scripts/rendu/mesures.mjs` (familles `lieux-salle` et `lieux-pres`) ;
  - la documentation : le manuel `www/manuel/blocland.md` (« La salle des trophées »), `style.md`, `cadrage-blocland.md`, `cadrage-archipeo.md`, `design/blocland/fiche.md`, `decisions.md`.
- **Les captures** : dans les deux univers, la salle avec 0, 6, 12, 18 et 24 succès, de jour et de nuit, de près et de loin.
- **Blocland** : le dessin de la salle change dans un univers dont le dessin est figé (`blocland-reference`). Cela demande l’accord de son consultant.
- **Le budget de triangles** : la construction du 6e est à 5 990 triangles avec tous les trophées, pour une enveloppe de 6 500. Les blocs plats du toit disparaissent, deux travées s’ajoutent : c’est à mesurer. Si l’enveloppe est dépassée, le transfert de 500 triangles venus du navire, décidé le 30 septembre 2026, s’applique. Blocland : 80 000, sans enjeu.
- **La sauvegarde** : pas touchée.

## Les avis

- Directeur artistique : auteur de la fiche ; recommande l’option B.
- Consultant d’Archipéo : …
- Consultant de Blocland : …
- Référent dys : …
- Artiste technique 3D : …

## La décision

<date>, mainteneur : …
