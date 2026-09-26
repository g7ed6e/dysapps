# Cadrage — Quatre archipels et le Bloc-Navire

Document de travail (26 septembre 2026). Objectif : faire du passage d'une classe à la suivante un moment marquant, sans toucher aux règles dys ni à ce qui est acquis.

## 1. Le besoin en une phrase

Accéder au niveau suivant (5e, 4e, 3e) en débloquant « un truc un peu waouh » (un bateau, un ballon, une fusée), avec une belle animation, en pouvant **toujours revenir** au niveau précédent, et en gardant le monde **joli**.

## 2. Diagnostic

Les vingt îles étaient posées sur un seul continent dont l'altitude montait avec la classe. Seize des vingt-sept ouvrages étaient des liaisons entre classes : un escalier taillé ou un tunnel menait de la 6e à la 5e comme d'une île à sa voisine. Rien ne marquait le changement de niveau, et un escalier n'a rien de « waouh ».

## 3. Décisions

Prises avec le mainteneur le 26 septembre 2026 :

- **Une scène 3D par archipel** (une par classe). Chaque archipel a sa mer, son ciel, sa Carte et son budget de faces. Le voyage est une cinématique entre deux scènes.
- **Le véhicule se construit comme un plan**, sur l'île-port de l'archipel : des blocs à poser, plus une condition sur les Gardiens de l'archipel. On le voit se construire fantôme par fantôme, comme les bâtiments. Cohérent avec « l'élève est le bâtisseur ».
- **Un seul véhicule qui s'améliore** : le **Bloc-Navire** reçoit une voile (6e → 5e, par la mer), puis un ballon (5e → 4e, par les airs), puis un réacteur (4e → 3e, vers des îles qui flottent dans le ciel). Une seule construction qui grandit, trois voyages.
- **Le kit arrive avec les Gardiens** : la voile, le haut du ballon et les feux du réacteur ne se gagnent pas ; ils apparaissent d'eux-mêmes quand assez de Gardiens de l'archipel sont vaincus. La condition a un effet visible, l'élève pose tout le reste lui-même.
- **Livraison** en série de pull requests livrables seules, ce cadrage en tête.

Ce qui ne change pas : rien à lire dans la 3D, panneaux HTML lus à voix haute, pas de chrono, rien ne se perd, « Réduire les animations » remplace toute animation, vue simple équivalente, cibles larges, rien d'emprunté.

## 4. Les quatre archipels

| Archipel | Classe | Nom | Île-port (créature) | Îles | Ambiance (PR 2) |
| --- | --- | --- | --- | --- | --- |
| 6e | 6e | Les Basses Terres | Plaine des nombres (Coco) | Forêt, Mine, Carrière, Ferme, Tour, Plaine, Rivière, Volcan | mer tempérée, récifs, bancs de sable, quatre baleines |
| 5e | 5e | Les Collines du Large | Marché des proportions (Bazar) | Glacier, Marché, Carrefour, Marais | ciel plus froid, mer turquoise, plaques de glace, aiguille de glace |
| 4e | 4e | Les Monts de Feu | Atelier du calcul littéral (Ixe) | Forge, Atelier, Falaise, Cabinet | bleu profond, brume proche, aiguilles d'ardoise, haut-fourneau |
| 3e | 3e | Les Îles du Ciel | Phare des fonctions (Fi) | Belvédère, Données, Phare, Textes | pas de mer : plancher de nuages, brume sous les îles |

- Un seul repère de coordonnées (`src/blocland/world/map.ts`) : les archipels occupent des bandes de y disjointes (5e ≈ 300, 4e ≈ 600, 3e ≈ 900), la 6e ne bouge pas. L'altitude par classe (0, 3, 6, 9) est conservée : c'est une ambiance uniforme dans l'archipel.
- Les îles de départ : la Forêt et la Plaine en 6e ; ailleurs, le port seul. Les ouvrages ne relient que des îles du même archipel (dix-huit ouvrages, contre vingt-sept), chaque archipel est connexe depuis son port, et au moins deux ouvrages sans condition partent du port : l'arrivée n'est jamais bloquée. Escalier, tunnel et col restent des natures d'ouvrage (à plat), avec leur condition.
- L'archipel affiché en 3D est celui de l'île où se tient le bonhomme (`village.at`).

## 5. Le Bloc-Navire

| Étape | Nom | Se construit au port de | Blocs à poser (île) | Kit (avec les Gardiens) | Gardiens | Mène à |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | La coque et la voile | Plaine des nombres | sable (Carrière) pour le pont, bois (Forêt) pour la coque et le mât, galet (Rivière) pour la cabine, pierre (Mine) pour l'ancre | la voile en toile, la lanterne de proue | 3 sur 8 | Les Collines du Large |
| 2 | Le ballon | Marché des proportions | glace (Glacier) pour le lest, panneau (Carrefour) pour la nacelle, toile (Marché) pour la couronne | le haut du ballon, la corde | 2 sur 4 | Les Monts de Feu |
| 3 | Le réacteur | Atelier du calcul littéral | acier (Forge), calque (Atelier) pour les ailerons, ardoise (Falaise) pour la tuyère | les feux de position | 2 sur 4 | Les Îles du Ciel |

- Chaque étape est un plan (`src/blocland/world/vehicle.ts`, `PlanDef` avec `zone: 'port'`), hors de la liste des plans des îles : la mécanique de pose, le coffre et le journal sont ceux des plans. Les cases posées vivent dans `village.plans[étape]`. Aucun bloc rare, aucune texture nouvelle.
- Le quai (`src/blocland/world/harbour.ts`) : une jetée de planches devant le port, à droite de l'îlot du Gardien, qui descend d'une marche par case jusqu'au niveau de la mer ; le navire est amarré à côté, la proue vers le large. Dans les Îles du Ciel, il flotte à hauteur de quai.
- **Embarquer** est un acte explicite (bouton), jamais un effet du dernier bloc. Le voyage fait est un identifiant dans `village.bridges` (`voyage-5e`, `voyage-4e`, `voyage-3e`) ; l'ouverture des îles passe par les ouvrages construits et les voyages faits, dans les deux sens : **on revient toujours**. L'XP de l'étape et le succès arrivent au départ.
- Le navire suit le voyageur : il est dessiné au port de l'archipel affiché, avec toutes les étapes déjà parties (la coque montre son ballon quand on revient en 6e).
- Sauvegardes d'avant : un escalier ou un tunnel entre classes déjà construit vaut les voyages qui y mènent et le chemin d'ouvrages interne ; l'étape correspondante est marquée complète. Une île où l'on a joué reste ouverte quoi qu'il arrive.

## 6. Le voyage

- PR 1 : un écran HTML (`VoyagePanel`) par-dessus le monde ou en page (vue simple) : le navire dessiné, la phrase du voyage lue à voix haute, un seul bouton « Arriver ». À l'arrivée, la scène change d'un coup et le panneau du port s'ouvre.
- PR 4 : la cinématique dans la 3D (embarquement, départ, passage sous un voile, arrivée, débarquement, huit secondes au plus), un toucher ou Entrée pour arriver tout de suite, les sons (corne de brume, voile, brûleur, réacteur, carillon). Sous « Réduire les animations », c'est l'écran HTML de la PR 1 qui reste.
- Le retour joue une version courte.

## 7. Vue simple

La liste des îles est groupée par archipel (titre, état « Tu es ici / Ouvert / Fermé », phrase qui dit ce qu'il faut pour un archipel fermé). La page d'une île-port a la section « Le Bloc-Navire » ; le voyage est la page `#/aventure/voyage/:classe`. La construction d'un ouvrage en vue simple mène désormais à l'île ouverte (parité avec la 3D), et la page d'île affiche le prochain objectif.

## 8. Les textes

- Prochain objectif, sur un port : « Encore 4 galet pour le Bloc-Navire », « Tu as tout pour le Bloc-Navire : pose tes blocs », « Bats encore 1 Gardien des Basses Terres pour la voile », « Le Bloc-Navire est prêt : embarque vers les Collines du Large ! ».
- Île d'un autre archipel : « Pas si vite ! Mon île est dans les Collines du Large, de l'autre côté de la mer. Finis le Bloc-Navire sur Plaine des nombres : encore 28 blocs. » / « … Le Bloc-Navire attend sur Plaine des nombres : bats encore 1 Gardien des Basses Terres, puis embarque. » / « … Le Bloc-Navire est prêt sur Plaine des nombres : embarque ! » / « Pas si vite ! Mon île est dans les Monts de Feu. Va d'abord jusqu'aux Collines du Large avec le Bloc-Navire. »
- Voyage : « Tu embarques sur le Bloc-Navire. Cap sur les Collines du Large ! » / « Le ballon se gonfle. Le Bloc-Navire s'envole vers les Monts de Feu ! » / « Le réacteur s'allume. Le Bloc-Navire monte vers les Îles du Ciel ! » / retour : « Tu embarques sur le Bloc-Navire. Retour vers les Basses Terres. »
- Kit arrivé (créature du port, phrase de fin de l'étape) : « La voile est hissée ! Pose les derniers blocs et embarque : les Collines du Large t'attendent. » / « Le ballon est gonflé ! Le Bloc-Navire peut voler. Embarque quand tu veux : les Monts de Feu t'attendent. » / « Le réacteur ronronne ! Le Bloc-Navire peut monter jusqu'au ciel. Embarque quand tu veux : les Îles du Ciel t'attendent. »
- Vue simple, archipel fermé : « Archipel fermé. Pour y aller, il faut le Bloc-Navire avec la voile : construis-le au port, sur Plaine des nombres. »
- Succès : Capitaine (premier voyage), Aéronaute (deuxième), Pilote du ciel (troisième).

## 9. Ce que ça change pour la pédagogie

La progression n'est plus « par thème sans classe imposée » : un élève de 3e passe d'abord par le chantier de 6e (trois Gardiens et une cinquantaine de blocs), puis par ceux de 5e et de 4e. À l'intérieur d'un archipel, rien n'est imposé. Points à surveiller en test de jeu : le nombre de Gardiens exigés (3, 2, 2) et le nombre de cases de la première étape ; les deux se règlent dans `vehicle.ts`.

## 10. Découpage en PR

1. ✅ **Quatre archipels et le Bloc-Navire (règles, panneaux, vue simple)** : carte en quatre bandes, ouvrages internes, voyages, quai et étapes du navire, migration des sauvegardes, objectifs et phrases, succès, scène 3D par archipel (mer, brouillard et cadrage de l'archipel ; quai et navire en cubes), section « Le Bloc-Navire », écran de voyage HTML, vue simple groupée, pages Accueil et Matière, tutoriel, documentation.
2. ✅ **Quatre ambiances** : palettes de ciel et de mer par archipel (`AMBIENCE` dans `daylight.ts`), décor de mer (plaques de glace dans les Collines, aiguilles d'ardoise dans les Monts, rien dans le ciel), monde du ciel de la 3e (pas de mer, un plancher de nuages qui dérive, des nuages bas entre les îles), repères (aiguille de glace du Glacier, haut-fourneau de la Forge), oiseaux plus nombreux et plus hauts dans les Monts, tout en haut dans le ciel, aucune baleine dans le ciel.
3. **Le Bloc-Navire au quai** : le navire en groupe animé (tangage, ballon, kit qui se hisse), cases fantômes tapables, toucher le navire ouvre la section, balise sur le chantier, navire dessiné dans l'écran de voyage.
4. **Le voyage** : la cinématique, le voile, la caméra, écume, nuages et flamme, les sons, toucher pour arriver, focus à l'arrivée, retour.
5. **Les quatre archipels et l'accueil** : la page « les quatre archipels » (`#/aventure/monde`), les tutoriels de première arrivée, les indices dans l'écran du Gardien et l'écran de récompense, l'accueil.

## 11. À venir

- Rien de décidé au-delà des cinq PR : jouer, écouter les retours des enfants sur le premier voyage.
