# Cadrage — « Le continent qui monte » (game design du monde)

Décisions du 25 septembre 2026. Objectif : rendre le monde moins répétitif et faire de la progression une aventure, sans toucher aux règles dys (rien à lire dans la 3D, panneaux HTML, pas de chrono, rien ne se perd).

## 1. Diagnostic

Vingt îles identiques de 12 × 12, plates, alignées sur cinq rangées : rien ne distingue une région d'une autre, l'enfant ne peut pas se repérer, et le pont est la seule liaison, les blocs le seul verrou.

## 2. Décisions

- **Un continent qui monte** (option retenue) : cinq régions thématiques, la difficulté monte avec l'altitude. Basses Terres (6e) au centre, Marais et Terres de feu autour, Montagne, puis les Hauteurs pour la 3e. Altitude par classe : 6e = 0 (mer), 5e = 3 (collines), 4e = 6 (monts), 3e = 9 (sommets).
- **Trois conditions pour ouvrir un passage** (option retenue) : payer en blocs (pont, escalier), terminer le premier plan d'une île voisine (tunnel), vaincre un Gardien (col). Chaque île reste atteignable par au moins deux chemins.
- **Carte et relief d'abord** (option retenue) : PR 1 la carte, les tailles, les formes, les altitudes, les montagnes et la caméra, les ponts restant tels quels ; PR 2 les ouvrages et les conditions ; PR 3 les repères et la vie.

## 3. Le monde (PR 1)

- `src/blocland/world/map.ts` : chaque île a un **cœur de 16 × 16** depuis la PR 15 (12 × 12 à l'origine ; bornes de quête, zone des plans, créature, décor) posé sur une **terre plus large** aux contours irréguliers (graine, bruit), une **altitude**, une **région** et un **relief** (plat, collines, montagne en terrasses derrière le cœur, neige au sommet selon la région). Les vingt îles sont placées à la main, la Forêt et la Plaine au centre.
- Les îles en altitude **flottent** : de la roche qui s'amincit dessous, rien au niveau de la mer. Les ponts deviennent des **rampes** (marches) entre deux altitudes ; entre deux îles l'une devant l'autre, le pont part du côté droit du cœur et fait un coude pour éviter l'îlot du Gardien.
- **Paysage** (`landscape()` dans `map.ts`) : autour du cœur, chaque case a une hauteur (collines douces, pics paraboliques des montagnes, cratère du volcan), un sol (herbe, mousse des marais, basalte du feu, roche et neige des sommets, glace du Glacier, sable des plages, eau des lacs, lave du cratère) et parfois un décor selon la région (arbres, sapins, buissons, fleurs, champignons, roseaux, rochers, souches, cristaux). Le rendu (`terrain.ts`) pose ces cubes avec leurs textures ; la lave brille comme les lanternes.
- **L'îlot du Gardien** (`bossIsletCells()`, `bossIsletSteps()` dans `terrain.ts`) : une petite île devant la sienne, dans une boîte de 13 × 12 cases à trois cases d'eau de la côte. Contour en ellipse bruitée (comme les îles), qui porte toujours l'emprise entière du Gardien (9 × 8 au plus), centré. Au milieu, une arène en carré arrondi (pierre, bordure de galet), plus petite que le Gardien qui déborde sur le sol ; autour, le sol dominant de l'île, du sable au bord de la mer à l'altitude 0 (sauf les Terres de feu), cinq touches de petit décor de l'île (jamais d'arbre : ils cacheraient le Gardien). Des **pas japonais** en quinconce (galet) vont du fond de l'îlot à la côte, dans l'axe du Gardien ; en altitude, l'îlot et ses pierres flottent, avec la même roche qui s'amincit dessous que les îles. Vaincu, le bloc d'or est posé sur un socle de pierre devant la statue. Remplace la dalle de pierre rectangulaire de 10 × 8.
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

- L'**avatar** de l'élève (`Avatar.ts` : un personnage en blocs aux proportions classiques, tête cubique de 8, corps 8 × 12 × 4, bras et jambes 4 × 12 × 4 en seizièmes de bloc, deux blocs de haut ; cheveux châtains, chemise verte, pantalon bleu ; bras et jambes qui balancent quand il marche) se tient sur l'île où l'on est, à côté de la créature. Sa position est mémorisée (`village.at`, la Forêt au début ; oubliée si l'île n'est plus ouverte).
- Quand on ouvre une autre île ouverte, il **marche** jusqu'à elle le long des ouvrages construits (`avatarRoute()` : plus court chemin en nombre d'ouvrages, sur le tablier des ponts, sur le sol des sentiers), à six cases par seconde, quatre secondes au plus. Vers une île fermée, il reste où il est. Avec « réduire les animations », il apparaît directement à l'arrivée.
- On voit ainsi d'un coup d'œil, même dans la vue d'ensemble, jusqu'où on est arrivé.

## 11. Des baleines (PR 9)

- Trois **baleines** bleu ardoise (`whaleSpots()` dans `terrain.ts` choisit les trois plus larges clairières d'eau entre les îles, visibles depuis la vue d'ensemble, à distance de toute terre et de tout îlot ; le reste dans `WorldCanvas.tsx`) tournent lentement dans la mer, montent et descendent, et **soufflent** quand elles font surface, la queue qui bat. Immobiles avec « réduire les animations ».

## 12. Des questions qui changent (PR 10)

- Chaque partie a une **graine** (`exercises/run.ts`, `runSeed()` : l'exercice et le nombre de parties déjà jouées). À l'origine, la première partie jouait les items tels qu'ils sont écrits, et les suivantes variaient (voir plus bas : la graine est désormais tirée au hasard).
- **Maths** : les exercices générés tirent d'autres nombres à chaque partie (`generate` sur l'`ExerciseDef`) ; avant, la même graine donnait les mêmes huit questions pour toujours.
- **Français** : le lot est mélangé, et quand il est plus large que la partie (`perRun`), on n'en joue qu'une partie. Les textes à lire (Ascension) et les manches du Gardien gardent leur ordre.
- Lots élargis : syllabes (12 mots pour 6 joués), oreille du mineur, mots-outils du coffre, familles de mots (10 pour 6 joués). Les réponses de chaque item sont mélangées (PR précédente).
- **Depuis la PR « hasard des quêtes »**, la graine est **tirée au hasard** à chaque partie (`runSeed(def)` : l'exercice et un tirage `crypto.getRandomValues`) : plus de première partie dans l'ordre du fichier, et recommencer le jeu ne rejoue plus la même suite. `runItems(def, seed)` reste reproductible pour une graine donnée (tests).
- **Place de la réponse** (`core/choices.ts`, `placeChoices`) : sur une partie, la bonne réponse vise chaque place autant de fois (à un près), dans un ordre tiré au hasard. Mots : les autres choix sont mélangés autour. Nombres rangés : l'ordre croissant reste ; des entiers consécutifs forment une fenêtre qu'on décale (Abattage : 1-2-3, 2-3-4, 3-4-5, jamais sous 1), sinon un piège passe de l'autre côté de la réponse à la même distance (56 et 54 → 58), un cran plus loin si la valeur existe déjà, ou au rapport inverse (×2 → ÷2) pour rester positif. Une liste de nombres que l'auteur n'a pas rangée n'est pas touchée. Même règle dans les anciennes quêtes (tables, fractions, décimaux).
- **Collège** : `defineData` a désormais un `generate` (d'autres nombres à chaque partie), et `choices()` tire la place de la réponse avant de choisir ses pièges.
- **Gardien** : ses manches viennent d'une partie tirée au hasard (`runItems`), avec des réponses placées ; avant, elles reprenaient les items bruts, bonne réponse souvent en premier.

## 13. Retours du cahier (PR 11)

- Le **Gardien juste sous les quêtes** dans le panneau d'île. Tant qu'il n'accepte pas le défi, sa ligne reste un bouton : le toucher dit (et lit) pourquoi ce n'est pas possible tout de suite, avec les quêtes où il manque des étoiles.
- **Abattage syllabique** : un niveau 2 avec des mots longs (3 à 5 syllabes, seize mots, huit joués par partie).
- **Difficulté** : une partie quasi parfaite (≥ 95 %) suffit maintenant pour monter d'un niveau (`PROMOTE_AT_ONCE`), au lieu de deux bonnes parties.
- **Filon mélangé** (`mine-filon-mix-1`, `mine-filon-mix-2`) : la lettre à piocher change à chaque bloc (b, d, p ou q) au lieu d'une seule pour toute la partie ; le bloc porte sa cible (`item.target`).
- L'écriture inclusive a été retirée (PR précédente).

## 14. La caméra gérée par l'application (PR 12, 1/3)

- Plus de zoom, de rotation ni de déplacement au doigt ou à la molette : la vue de trois quarts garde toujours le même nord. `OrbitControls` est retiré ; la boucle de rendu amène la caméra en douceur vers sa place (`framing()` dans `WorldCanvas.tsx`).
- Sans panneau ouvert, la caméra est centrée sur le **bonhomme** (`FOLLOW_DISTANCE`), assez loin pour son île et les voisines ; quand il marche, elle le suit pas à pas. Panneau ouvert : vue rapprochée de l'île (`ISLAND_DISTANCE`). En portrait, un peu plus loin pour tenir dans la largeur.
- Trajets à six cases par seconde, six secondes au plus ; un tap n'importe où pendant le trajet fait arriver tout de suite.
- Clavier : les flèches vont à l'île voisine dans cette direction. Le réglage « Sensibilité de la caméra » est retiré.
- Suites : section 15 (toucher pour aller et agir) et section 16 (la Carte).

## 15. Toucher pour aller et agir (PR 13, 2/3)

- **Toucher un ouvrage** (construit ou fantôme) dans le monde ouvre l'île ouverte qu'il touche, avec sa proposition mise en avant dans la liste des ouvrages (`onPickBridge`, `highlight`) : la ligne se surligne et vient sous les yeux. Avant, le tap ouvrait l'île d'en face, souvent fermée.
- **Toucher une île fermée** approche la caméra et sa créature dit précisément ce qu'il faut (`lockedHint()` dans `world/goals.ts`) : l'ouvrage qui mène ici, depuis quelle île, combien de blocs, la condition ; ou, trop loin, l'île à ouvrir d'abord.

## 16. La Carte (PR 14, 3/3)

- Le bouton **Carte** (`#/aventure/carte`) montre tout le continent vu du ciel, le même nord, sans brume (`map` dans `WorldCanvas.tsx`, cadrage sur `worldBounds()`, en portrait comme en paysage). Un grand fanion jaune flotte au-dessus du bonhomme (« tu es ici ») ; les îles fermées restent pâles, les ouvrages construits en couleur.
- **Toucher une île ouverte** ferme la Carte : le bonhomme y marche saut par saut, la caméra le suit, puis le panneau de l'île s'ouvre.
- **Toucher une île fermée** garde la Carte et montre le chemin (`remainingPath()` dans `world/archipelago.ts`) : la liste des ouvrages qu'il reste à construire, des balises jaunes le long de leur tracé dans le monde, et un bouton « Voir le premier ouvrage » qui ouvre l'île d'où il part, sa proposition mise en avant.
- En vue simple (sans 3D), `#/aventure/carte` renvoie à la liste des îles.

## 17. Des îles plus grandes, une borne par quête (PR 15)

- Le cœur de chaque île passe de 12 × 12 à **16 × 16** (`CORE` dans `map.ts`) ; les positions des îles sont agrandies d'un tiers pour garder l'eau entre elles et les isthmes des quatre paires. Le décor et le relief du cœur restent dessinés sur la grille de 12 (`LAYOUT`), posée avec une marge (`LAYOUT_PAD`, 2 colonnes à gauche, 3 rangées devant) ; la zone des plans est déplacée en (8, 10).
- **Les bornes de quête** (`questStations()` dans `terrain.ts`) : une par quête, alignées sur la rangée de devant, tous les trois blocs à partir de x = 3. Une borne, c'est un socle du bloc de l'île et un panneau dessus ; ses cubes portent `quest` (« île:quête »). Au-dessus, un repère animé (`quests` dans `WorldCanvas`) : un losange jaune qui flotte pour une quête à faire, des petits cubes d'or empilés pour les étoiles gagnées, rien sur une île fermée (bornes délavées).
- **Toucher une borne** (socle, panneau ou repère) lance la quête si elle est jouable ; sinon, le panneau de l'île s'ouvre et explique.
- Les créatures évitent les bornes (obstacles dans `creatureSpot()`), la caméra s'éloigne un peu (`ISLAND_DISTANCE` 30, `FOLLOW_DISTANCE` 50), la Carte se cadre toute seule.

## 18. Le cadrage vers le continent (PR 16)

- Le problème : la caméra regardait toujours vers le nord, centrée sur le bonhomme ; sur une île du bord (Tour à l'ouest, Cabinet à l'est), l'écran se remplissait de mer.
- **Cadrer la zone** (`viewZone()` dans `terrain.ts`) : quand le bonhomme se tient sur une île, la caméra vise un point entre cette île (poids 2) et le centre de « son île + ses voisines reliées par un ouvrage » (poids 1), à une distance qui fait tenir la zone (`FOLLOW_DISTANCE` à `FOLLOW_MAX`). Les voisines tirent l'image vers le continent.
- **Pivoter vers la colonne centrale** (`viewYaw()`) : la direction de vue tourne autour de la verticale selon l'écart est-ouest entre l'île et le centre du continent, plein pivot (40 degrés, `VIEW_YAW_MAX`) à 50 cases. Le nord reste reconnaissable, les visages restent lisibles. Le même pivot s'applique à la vue rapprochée quand le panneau est ouvert.
- Pendant un trajet, la caméra suit le bonhomme comme avant ; sur la Carte, rien ne change.

## 19. L'habillage de la mer (PR 17)

- `seaDecor()` dans `terrain.ts` : des rochers qui affleurent (galet au ras de l'eau, parfois une pierre par-dessus et un voisin) et des bancs de sable (trois à sept cases au ras de l'eau), semés par un bruit fixe sur une grille de quatre cases, à cinq cases au moins de toute terre, de tout îlot, de tout ouvrage (deux cases de marge) et des ronds des baleines. Densité en dégradé : clairsemée entre les îles, de plus en plus fournie jusqu'à vingt cases au large. Cubes étiquetés `mer`, calculés une fois, jamais sous un ouvrage.
- Les baleines passent de trois à quatre et préfèrent le large : chaque clairière est notée par sa largeur et son éloignement du centre du continent.
- Effet : sur une île du bord, la mer n'est plus vide ; sur la Carte, un semis de récifs entoure le continent.

## 20. Mes blocs : un inventaire qui dit quoi en faire, un panneau plus court (PR « mes-blocs »)

Retour des joueurs : « trop de blocs qui s'accumulent, on ne sait pas quoi en faire ». Constat : aucun écran d'inventaire (la seule liste était au fond de la section Plan du panneau), et les blocs manquants renvoyaient à une île en texte, sans lien.

- **Logique pure** (`world/uses.ts`) : `blockUses()` dit ce qu'un type de bloc construit maintenant (le plan en cours de chaque île ouverte de l'archipel, le chantier du navire à portée), sinon « à garder » si des plans suivants l'attendent, sinon rien ; `inventoryUses()` range les lignes par utilité (posable sur l'île du bonhomme, posable ailleurs, à garder, sans usage), liste les ouvrages payables **une seule fois** (tout bloc d'île paie tout ouvrage : des puces par ligne se répéteraient vingt fois) et calcule `missingNow()` : les blocs que réclament les chantiers à portée moins l'inventaire, avec l'île où les gagner. `earnIsland()`/`whereToEarn()` y déménagent.
- **Mes blocs** (`Inventory.tsx`) : un panneau à la place de celui d'une île en 3D (route `/aventure/blocs`, bouton « Blocs (N) » dans la barre du bas, croix qui ramène sur l'île du bonhomme), une page en vue simple. Trois parties : Mes blocs (puces-liens « Plan de … : encore 6 à gagner », « … : tu as tout, pose-les », « Le Bloc-Navire : … », « À garder pour … »), Pour les ouvrages, À aller chercher.
- **Liens vers les îles** : partout, un lien `/aventure/:île` suffit ; en 3D, le changement de route fait voler la caméra sur l'île (`WorldPage` → `focus` → `framing()` dans `WorldCanvas`), y fait marcher le bonhomme et ouvre son panneau. Les blocs manquants du plan et du navire (`EarnLink` dans `PlanSection.tsx`) deviennent ce lien ; « à gagner ici, dans les quêtes » quand c'est le bloc de l'île.
- **Panneau d'île plus court** (`IslandFold.tsx`) : Plan, Bloc-Navire et Ouvrages sont des `<details>` ouverts d'eux-mêmes quand il y a quelque chose à faire (un bloc à poser, un ouvrage constructible, le navire prêt, un élément mis en avant, une action qui vient d'aboutir), repliés sinon avec une ligne d'état. L'état est calculé au rendu (jamais dans un effet, pour que le défilement vers l'élément mis en avant trouve sa section ouverte) ; le choix de l'élève tient tant que l'île et la mise en avant ne changent pas. La ligne « Mes blocs : … » et le paragraphe « Tes N briques ne se posent pas ici » quittent la section Plan, remplacés par le lien « Mes blocs (N) ». En vue simple, la page d'île garde ses sections dépliées.
- **Surplus** : une fois les trois plans d'une île et les ouvrages faits, son bloc ne sert plus qu'au navire (13 types) ; brique, obsidienne, verre, terre, quartz, lentille, marbre, parchemin et prisme n'ont pas d'autre débouché, et les rejouées paient sans fin. L'inventaire le dit honnêtement (« Rien à construire pour l'instant »). Un débouché (troc, décoration) reste **à cadrer** ; décision : pas dans cette PR.

## 21. À venir

- Un débouché pour les blocs en surplus (voir 20).
