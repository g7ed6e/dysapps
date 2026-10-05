# Ce qui vaut pour les trois fiches

**Statut.** Ces fiches sont l’intention du directeur artistique, écrite avant les sous-lots R4b-5e, R4b-4e et R4b-3e. Chaque sous-lot écrit ensuite dans sa sous-section du cadrage ce qu’il a construit, et il y signale tout écart à sa fiche. Rien ici ne contredit le §5 ni la fiche de famille du cadrage, sauf les deux écarts du 3e (le site du phare et son socle), dits dans sa fiche, et le pont du 5e, confié à R5 par le mainteneur.

## Les règles du directeur artistique pour les trois

1. **Un repère d’Archipéo qui remplace un repère de Blocland couvre au moins toutes les cases que celui-ci bloque.** Un test le vérifie. Rien ne bloque le bonhomme sans se voir.
2. **Tout décor nouveau d’Archipéo est hors de la grille**, posé sur des cases où le bonhomme ne va jamais : hors du cœur, des chemins balisés, du quai, de la route du navire et des places de la baleine. Il ne change ni la marche, ni les empreintes de J0, ni Blocland. Il ne renvoie rien au toucher.
3. **Le lointain ne ressemble jamais à une île** : pas de plage, pas de quai, pas d’étiquette, rien à toucher. Il est caché sur la Carte.
4. **Chaque genre de décor de Blocland** (écueil, banc, repère) garde ses cubes dans la grille. Seule sa forme dans Archipéo change, par archipel. Les cubes de `seaDecor` ne changent pas.
5. **Ne bougent pas** : les entrées de nuit, la direction du soleil, les strates, la règle de mouvement (`world/decor/smoke.ts` : une volute toutes les 7 s, la brume qui respire sur 16 s, opacité ±10 %, glissement de 0,1 case par seconde au plus), le modèle du phare (`world/decor/lighthouse.ts`) et la caméra.
6. **Rien ne passe devant ni derrière ce qu’on lit ou ce qu’on suit** : nom et état d’île (dont « Fermée »), flèche « Commence ici », bonhomme, navire en voyage, repères des bornes. Aucune fumée, brume, grue ni oiseau, dans la vue d’une île, la vue de l’archipel, la Carte et l’arrivée en voyage. Les étiquettes ont un fond opaque dessiné par-dessus le relief : une couche transparente ne se dessine jamais après elles.
7. **Rien ne s’écrit dans la scène** (fiche de famille, règle 7) : ni sur une bannière, ni sur un entrepôt, un mât ou une enseigne de R5.
8. **Aucune lueur ne pulse, ne scintille ni ne varie par à-coups avec le degré de nuit** (fiche de famille, règle 5).
9. **On juge sur la caméra du jeu.** L’horizon est hors du cadre dans la vue d’une île, la vue de l’archipel et la Carte ; on ne le voit qu’en voyage, dans le haut du cadre. Les pourcentages de composition des esquisses ne s’appliquent pas : les critères de chaque fiche sont écrits sur les vraies vues.

## Le relief, en deux parties

Le relief des îles (`world/silhouettes/<archipel>.ts`) est lu par la grille de marche commune aux deux univers : le changer redessine aussi Blocland, la 2D et les empreintes de J0. Chaque fiche sépare donc deux parties.

- **Partie 1, sans relief** (ambiance, repères, brume, fumée, lointain) : elle part tout de suite.
- **Partie 2, le relief** : elle attend U2, qui sépare le relief de la marche du modelé dessiné ([Plusieurs univers](../../univers.md)). Sur la recommandation du directeur artistique, le mainteneur a décidé le 28 septembre 2026 d’avancer U2, dans le fil de la séparation, pendant la partie 1 : c’est un écart à l’ordre de [Plusieurs univers](../../univers.md), qui plaçait U2 après les sous-lots R4b.
- **Si U2 n’est pas avancé**, le relief reste tel qu’il est, et la silhouette passe par des masses hors de la grille, dans le lointain. On écarte le relief surélevé au seul rendu : il montrerait une 3D et une 2D différentes (règle 8 de la fiche de famille).

Mesures de l’artiste technique 3D : le relief ne naît que sur l’anneau de terre autour du cœur (2 à 6 cases de large) ; on obtient des crêtes au fond des îles, pas des masses isolées. Élargir une île fait chevaucher les îlots des Gardiens et des monuments : on ne le fait pas.

## Le lointain (`world/decor/distant.ts`, un module commun)

Il n’existe aujourd’hui ni en 3D, ni en 2D. Peint dans le dôme du ciel, il serait invisible : il se pose dans le monde.

- **Qui le construit** : R4b-5e, comme R4b-6e a construit le phare. Il le publie dans son premier commit et en est propriétaire jusqu’à sa fusion.
- **Ce qu’il fournit** : des rangs de crêtes (un ou deux, de plus en plus pâles, `#8B9F93` puis `#B0CDD1`), une masse en gradins et un cône. Tout est posé de 60 à 150 cases derrière l’archipel, de 15 à 30 blocs de haut, dans l’appel de dessin du décor, et pâli par la brume de profondeur. Chaque archipel lui donne ses couleurs.
- **Qui le reprend** : R4b-4e le lit sans l’écrire et pose son volcan et ses crêtes dans `decor/4e.ts`. Si R4b-5e est arrêté, R4b-4e dessine ses formes dans `decor/4e.ts` et la revue d’ensemble les réunit. R4b-3e y prend son massif.
- **Où il n’est pas** : le 6e le reçoit à la revue d’ensemble seulement (il ne lui reste que 608 triangles de décor). La 2D ne le montre pas ; R7 le dira.

## Qui possède quoi de nouveau

En plus du tableau « Qui possède quoi » du cadrage :

- `world/decor/distant.ts` : à R4b-5e, puis en lecture pour les autres.
- `world/fauna.ts` : à R4b-3e, pour l’oiseau planeur seulement. R6 ne l’écrit pas.
- `three/mist.ts`, `mistPatches` et `seaDecor` de `terrain.ts` : à R4b-5e (les bancs), puis à R4b-3e (les nappes). Ils ne se chevauchent pas : le 3e part après la fusion du 5e.
- `palette.ts` : chaque sous-lot n’écrit que son entrée de `ambianceDe`.

## Les captures, pour chaque sous-lot

Les 21 captures déclarées (`scripts/rendu/mesures.mjs`), plus deux prises en local :

- **l’arrivée en voyage** : c’est la seule vue où l’horizon se voit ;
- **l’île qui porte le repère**, de jour et de nuit, quand ce n’est pas la première île de l’archipel (la seule que montre la capture déclarée d’une île) ;
- **une courte vidéo sur tablette**, avec et sans « Réduire les animations » (la préférence de l’appareil), de ce qui bouge dans l’archipel (bancs du 5e, fourneau et volcan du 4e, oiseau du 3e) : un rythme ne se juge pas sur une image fixe, et le sous-lot ne l’attend pas de la revue d’ensemble.

Dans chaque sous-lot, deux critères s’ajoutent à ceux de la fiche (référent dys) :

- les bancs, les nappes, les fumées et l’oiseau ne voilent jamais une étiquette ni la flèche, sur aucune capture ;
- le contour des étiquettes, la flèche, le bonhomme et les repères des bornes restent nets sur la brume, le plancher de nuages et la neige (le thème Contraste élevé, retiré le 28 septembre 2026, reviendra au lot 11 du cadrage Archipéo avec ce critère).

## Le test en niveaux de gris

Les quatre archipels côte à côte, vue de l’archipel, en gris, à 320 px de large, étiquettes masquées : le directeur artistique et le consultant d’Archipéo nomment chaque archipel sans hésiter.

## Questions pour l’artiste technique 3D

1. Comment ranger une forme par genre et par archipel (écueils du 4e, roches du 5e) sans que R4b-5e et R4b-4e écrivent le même fichier en même temps ?
2. Combien coûte le remplissage des bancs de brume sur la tablette de référence ? Les couches transparentes coûtent en pixels plus qu’en triangles.
