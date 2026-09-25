# Cadrage — « Le continent qui monte » (game design du monde)

Décisions du 25 septembre 2026. Objectif : rendre le monde moins répétitif et faire de la progression une aventure, sans toucher aux règles dys (rien à lire dans la 3D, panneaux HTML, pas de chrono, rien ne se perd).

## 1. Diagnostic

Vingt îles identiques de 12 × 12, plates, alignées sur cinq rangées : rien ne distingue une région d'une autre, l'enfant ne peut pas se repérer, et le pont est la seule liaison, les blocs le seul verrou.

## 2. Décisions

- **Un continent qui monte** (option retenue) : cinq régions thématiques, la difficulté monte avec l'altitude. Basses Terres (6e) au centre, Marais et Terres de feu autour, Montagne, puis les Hauteurs pour la 3e. Altitude par classe : 6e = 0 (mer), 5e = 3 (collines), 4e = 6 (monts), 3e = 9 (sommets).
- **Trois conditions pour ouvrir un passage** (option retenue) : payer en blocs (pont, escalier), terminer le premier plan d'une île voisine (tunnel), vaincre un Gardien (col). Chaque île reste atteignable par au moins deux chemins.
- **Carte et relief d'abord** (option retenue) : PR 1 la carte, les tailles, les formes, les altitudes, les montagnes et la caméra, les ponts restant tels quels ; PR 2 les ouvrages et les conditions ; PR 3 les repères et la vie.

## 3. Le monde (PR 1)

- `src/blocland/world/map.ts` : chaque île a un **cœur de 12 × 12** (zone des plans, créature, décor, comme avant) posé sur une **terre plus large** aux contours irréguliers (graine, bruit), une **altitude**, une **région** et un **relief** (plat, collines, montagne en terrasses derrière le cœur, neige au sommet selon la région). Les vingt îles sont placées à la main, la Forêt et la Plaine au centre.
- Les îles en altitude **flottent** : de la roche qui s'amincit dessous, rien au niveau de la mer. Les ponts deviennent des **rampes** (marches) entre deux altitudes ; entre deux îles l'une devant l'autre, le pont part du côté droit du cœur et fait un coude pour éviter l'îlot du Gardien.
- **Paysage** (`landscape()` dans `map.ts`) : autour du cœur, chaque case a une hauteur (collines douces, pics paraboliques des montagnes, cratère du volcan), un sol (herbe, mousse des marais, basalte du feu, roche et neige des sommets, glace du Glacier, sable des plages, eau des lacs, lave du cratère) et parfois un décor selon la région (arbres, sapins, buissons, fleurs, champignons, roseaux, rochers, souches, cristaux). Le rendu (`terrain.ts`) pose ces cubes avec leurs textures ; la lave brille comme les lanternes.
- Les îles **verrouillées** gardent leurs formes et leurs textures, **délavées** vers un gris clair (comme dans la brume) au lieu d'un bloc de pierre uniforme : on devine ce qui attend.
- La caméra de la vue d'ensemble est plus basse et plus proche.
- Tests : le cœur fait partie de la terre, aucune terre ne chevauche une autre ni un îlot, aucun pont ne traverse un îlot, le relief respecte sa famille (volcan avec sa lave, montagnes enneigées, du décor partout sauf sur l'eau et la lave, des lacs), budget de faces sous 34 000.

## 4. Les ouvrages (PR 2)

- `src/blocland/world/archipelago.ts` : chaque liaison entre deux îles est un **ouvrage** d'une nature donnée. **Pont** (même niveau), **bac** (radeau et poteaux de halage sur un large bras de mer : Plaine–Rivière, Ferme–Volcan), **escalier taillé** dans la pierre (un niveau de plus), **tunnel** (galerie voûtée à lanternes, deux niveaux de plus : Volcan–Forge, Ferme–Falaise, Carrière–Cabinet, Marché–Données), **col** à garde-fou (Tour–Textes, du niveau de la mer au sommet).
- Chaque ouvrage coûte des blocs ; la nature décide de la **condition** en plus : rien pour un pont ou un bac, le **premier plan terminé** de l'île de départ pour un escalier (il faut des bâtisseurs), le **Gardien vaincu** de l'île de départ pour un tunnel ou un col. La condition se vérifie depuis n'importe quelle île ouverte que l'ouvrage touche.
- États : construit, constructible, **bloqué** (une île ouverte le touche mais la condition manque : on l'affiche en expliquant quoi faire, sans pénalité), loin. Le monde 3D montre en fantôme les ouvrages constructibles et bloqués.
- Sauvegardes : les identifiants des ouvrages sont ceux des anciens ponts, rien à migrer.

## 5. Repères et vie (PR 3)

- **Repères** (`landmark()` dans `terrain.ts`), un par région, posés sur la terre autour du cœur (jamais sur le cœur, un lac ou la lave) : le grand chêne de la Forêt, le champignon géant du Marais, la fumée du Volcan au-dessus du cratère, la tour de guet à bannière au sommet du pic de la Mine, le grand phare à lanterne du Phare.
- **Cascades** : d'un lac d'une île en altitude, l'eau déborde au bord le plus proche et tombe jusqu'à la mer, avec son écume.
- **Lanternes** à chaque bout des ouvrages : la nuit, les chemins se devinent de loin (la lave brille aussi).
- **Brume des sommets** : une nappe translucide à dégradé radial sous chaque île à 9, qui respire lentement.
- **Oiseaux** : six petits V sombres qui tournent au-dessus du monde, ailes battantes (immobiles avec « réduire les animations »).

## 6. La première minute (PR 4, après un test de jeu)

- La vue d'ensemble cadre les **îles ouvertes et leurs voisines** (`overviewBounds()`), et s'élargit à mesure que le monde s'ouvre : au début, deux îles vertes bien visibles, pas vingt taches grises.
- **Jour forcé** tant que le tutoriel n'est pas vu ; ensuite l'heure réelle, avec une **nuit plus claire** (bleu de crépuscule, jamais noir).
- Une **flèche jaune** flotte au-dessus de la Forêt tant qu'aucune quête n'a été jouée (« Commence ici », dite dans le tutoriel).
- Panneau d'île réordonné : **Prochain objectif** (`nextGoal()`), Quêtes, Plan, Gardien, Ouvrages. Les ouvrages pas encore possibles sont une ligne compacte (« Encore 3 blocs »), sans bouton grisé.
- Tutoriel réécrit (îles pâles, ouvrages et conditions, « touche la Forêt sous la flèche »).
- Le message « ouvrage construit » ne suit plus sur une autre île.

## 7. Rythme et fête (PR 5)

- **Blocs selon les étoiles** (`blocksBonus()` dans `engine.ts`) : +1 bloc à deux étoiles, +2 à trois, et **+2 la première fois** qu'une quête est jouée. Toujours au moins 1 bloc dès une bonne réponse, jamais rien de retiré. Une première quête réussie donne donc 5 à 7 blocs au lieu de 3 : de quoi construire un pont et commencer la cabane. L'écran de fin détaille le bonus.
- **La fête d'un ouvrage** : des éclats d'or sur l'île qui s'ouvre, puis la caméra y vole et sa créature accueille (le panneau s'ouvre sur l'île d'en face).

## 8. Des bâtiments différents sur chaque île (PR 6)

- Quinze îles construisaient la même cabane, le même toit et la même cour que la Forêt. Elles ont maintenant cinq **gabarits** en trois étapes, choisis selon leur thème : **dôme** (nid de Coco, abri de Lavi, igloo, dôme de Stat), **longère** (huttes de Nénu et de Kroa, bergerie), **gradins** (échoppe, nid de Plume, kiosque), **atelier en L** (cabane de Sema, ateliers de Braise et d'Ixe), **tour ronde** (lanternes de Fi et d'Astra). Les cinq premières îles gardent leurs bâtiments propres.
- Les noms, les phrases de fin et l'XP ne changent pas ; les coffres donnent exactement le kit (toit, porte, lanterne, barrière, escalier) du plan suivant.
- Les blocs déjà posés sur un plan dont la forme a changé sont oubliés à la lecture de la sauvegarde (les blocs gagnés restent dans l'inventaire).

## 9. Des îles qui se touchent (PR 7)

- Quatre paires d'îles de même niveau sont maintenant **côte à côte et reliées par un isthme** de terre (`ISTHMUSES`, `inIsthmus()` dans `map.ts`) : Forêt–Mine, Ferme–Tour, Glacier–Marché, Carrefour–Marais. L'isthme appartient à la première île de la paire, il est plat, en herbe (sable au bord), avec quelques buissons ; sa largeur ondule.
- L'ouvrage entre deux îles qui se touchent est un **sentier** : des pierres de gué une case sur deux, posées sur le sol, une lanterne à chaque bout. Il coûte des blocs comme un pont, sans autre condition. `groundLevelAt()` (`world/ground.ts`) donne le niveau du sol en un point.
- Sept îles ont été rapprochées (Mine, Carrière, Tour, Marché, Atelier, Marais, Cabinet, Textes). Le décor ne déborde plus au-dessus du cœur d'une île, et un cube d'ouvrage ne remplace jamais un cube du terrain.

## 10. Le bonhomme (PR 8)

- L'**avatar** de l'élève (`Avatar.ts`, casquette rouge, salopette bleue) se tient sur l'île où l'on est, à côté de la créature. Sa position est mémorisée (`village.at`, la Forêt au début ; oubliée si l'île n'est plus ouverte).
- Quand on ouvre une autre île ouverte, il **marche** jusqu'à elle le long des ouvrages construits (`avatarRoute()` : plus court chemin en nombre d'ouvrages, sur le tablier des ponts, sur le sol des sentiers), à six cases par seconde, quatre secondes au plus. Vers une île fermée, il reste où il est. Avec « réduire les animations », il apparaît directement à l'arrivée.
- On voit ainsi d'un coup d'œil, même dans la vue d'ensemble, jusqu'où on est arrivé.

## 11. À venir


- Des baleines au large.
