# Le jeu

Ce document décrit le jeu de DysApps une seule fois, sans univers. Il dit les règles décidées par le mainteneur ; ce que l’application montre aujourd’hui, écran par écran, est dans le [manuel](../../www/manuel/blocland.md), et l’avancement de chaque lot dans [l’état des chantiers](../pilotage/chantiers.md).

Le jeu est **themable** (décision du mainteneur, 2 octobre 2026) : il se décrit avec des mots neutres, et un univers n’apporte que son habillage, c’est-à-dire le mot qu’il affiche pour chaque mot neutre, son récit et son dessin. Blocland est l’univers par défaut et le seul où le jeu évolue ; ses mots sont dans sa [fiche](../univers/blocland/fiche.md). Archipéo est en pause depuis le 2 octobre 2026 ([son dossier](../univers/archipeo/game-design.md)). Un univers nouveau, dans l’espace ou sur la terre ferme, n’aurait qu’à remplir sa table : les règles ne bougent pas ([Plusieurs univers](../univers/univers.md), §4).

Pour changer le jeu : une fiche `propositions/GD-<n>.md` (voir [Proposer un changement](propositions/modele.md)), relue par les agents, décidée par le mainteneur, inscrite dans [les décisions](decisions.md), puis versée dans ce document.

## Le vocabulaire

Le jeu en une phrase : l’élève avance de région en région, une par classe. Chaque région est faite de lieux, un par notion, reliés par des liaisons qu’on construit. Dans chaque lieu, un habitant propose des missions ; chaque mission réussie pose une partie de la construction du lieu et rapporte la ressource du lieu. Un gardien propose le défi du lieu. Assez de défis réussis, et le passage vers la région suivante est prêt.

| Mot neutre | En français dans ce document | Ce que c’est |
| --- | --- | --- |
| `region` | région | Le monde d’une classe (6e, 5e, 4e, 3e) |
| `place` | lieu | L’endroit d’une notion, avec ses missions, son habitant et son gardien |
| `startPlace` | lieu de départ | Le premier lieu d’une région, avec l’école, la salle des succès et le lieu d’assemblage |
| `hub` | point de départ des liaisons | Là d’où partent les liaisons et le passage |
| `link` | liaison | Ce qu’on construit avec des ressources pour ouvrir un lieu |
| `passage` | passage | Ce qui mène à la région suivante |
| `resource` | ressource du lieu | Ce que fournit chaque lieu, une par lieu |
| `compound` | ressource composée | Une ressource faite de deux ressources de lieux de la région, une par région |
| `assembly` | lieu d’assemblage | Où l’on fait les ressources composées |
| `stock` | stock | Les ressources de l’élève |
| `structure` | construction du lieu | Ce que l’élève fait naître dans le lieu, partie par partie |
| `part` | partie | Le morceau de la construction qu’une mission pose |
| `trophyHall` | salle des succès | Où se posent les trophées des succès, sur le lieu de départ |
| `landmark` | grande construction | Une construction de la région, hors des lieux, posée élément par élément |
| `fixture` | petit ouvrage | Ce qu’une commande livrée pose chez un habitant |
| `request` | commande | Ce qu’un habitant demande d’apporter |
| `resident` | habitant | L’être du lieu, qui propose les missions et se souvient |
| `guardian` | gardien | L’être qui propose le défi du lieu |
| `challenge` | défi | La grande épreuve du lieu |
| `placeState` | état d’un lieu | Fermé, À explorer, En chantier, Achevé |
| `regionState` | état de la région | Abandonnée, réactivée, en reconstruction, en développement, ouverte |
| `avatar` | personnage de l’élève | Celui qui se tient dans le lieu où l’on est et marche le long des liaisons |

Les mots de l’école et de l’interface sont les mêmes dans tous les univers : expédition (une matière), mission, révision, étoiles, XP, rôle, succès, trophée, Menu, Réglages. Ce sont les repères de l’élève, de l’enseignant et du manuel.

Le mot neutre est le mot anglais : c’est lui qu’emploient le code et la sauvegarde, sans mot d’univers (voir [La sauvegarde](#la-sauvegarde)). Ce document l’écrit en français pour se lire ; les textes affichés à l’élève sont en français et viennent de l’univers.

## La promesse

Un jeu d’entraînement pour les élèves dys du collège, de la 6e à la 3e, en français, maths, anglais et LV2, où **le savoir construit le monde** : chaque réussite fait naître quelque chose dans le monde, et le monde montre la progression. Le monde ouvert est au centre ([GD-4](propositions/GD-4.md)) : tout se passe dans le monde, les chemins sont au choix, et l’on découvre en explorant. L’élève est un explorateur et un bâtisseur, pas un élève devant un manuel déguisé.

## Ce qui ne se négocie jamais

- **Rien à lire dans le monde** (3D ou 2D). Tout ce qui se lit est dans un panneau HTML, en police dys, lu à voix haute. Seule exception : les étiquettes des noms de lieux, dans la police de lecture, sur fond clair.
- **Pas de chrono, pas de classement, pas de perte.** Rien ne se retire à l’élève : une ressource gagnée reste gagnée, un passage fait reste fait, un lieu où l’on a joué reste ouvert, un défi réussi le reste, même quand une mission arrive plus tard dans son lieu. Aucun lieu ne se ferme selon la maîtrise. Un manque se dit avec ce qu’il faut faire. Une sauvegarde ancienne est toujours migrée sans perte.
- **Pas de réflexe.** Aucun geste ne demande de la vitesse ni de la précision ; toucher pour aller reste toujours possible.
- **Des séances courtes.** On peut passer deux minutes dans le monde et repartir. Une pause est proposée après trois exercices ou dix minutes (« Belle séance ! »), sans rien bloquer.
- **« Réduire les animations »** remplace toute animation : ciel figé, habitants immobiles, pas de particules, caméra sans trajet, passage en écran fixe, changement de région sans fondu.
- **La vue simple est complète.** Tout ce qui se fait dans le monde se fait aussi en listes, sans WebGL ni Canvas : c’est aussi le chemin des lecteurs d’écran. Sans WebGL, l’appareil montre la liste des lieux.
- **Pas de physique** : rien ne tombe, rien ne casse.
- **Des cibles larges** (48 px au moins), et chaque geste du monde a un équivalent en bouton dans un panneau.
- **Un seul élément mis en avant à la fois**, même quand plusieurs choix sont ouverts ; trois choix au plus en même temps.
- **Rien d’emprunté** : formes, textures, sons et noms sont les nôtres, dessinés ou générés par le code ([Style](../rendu/style.md)).
- **Une tablette d’entrée de gamme suffit** : une région à la fois, et un test empêche le monde de grossir ; chaque univers a son plafond, dans sa fiche.

Les principes dys complets : [Principes](../../www/pedagogie/principes.md).

## Les régions et les lieux

- **Quatre régions, une par classe**, une seule affichée à la fois : celle où se tient le personnage de l’élève. Chacune a son ambiance, sa Carte et son plafond de dessin.
- **Un lieu par notion**, de deux à quatre missions. Chaque lieu se distingue : un relief, un repère visible de loin, une forme. Les lieux de LV2 s’ajoutent dès la 5e, en bout de chemin : rien n’en dépend.
- **Un lieu fermé** reste visible, délavé : on devine ce qui attend. Le toucher fait dire ce qu’il faut faire pour l’ouvrir.
- **L’état d’un lieu** se déduit de la progression, jamais enregistré : Fermé, À explorer (ouvert, aucune mission réussie), En chantier, Achevé (toutes ses parties posées). Chacun a une icône et un mot, sur la Carte et en vue simple. Achevé récompense un lieu fini sans dépendre du défi.
- **Une borne par mission**, devant le lieu, avec les étoiles gagnées ou un repère « à faire » : la progression se voit dans le monde, et toucher la borne lance la mission.
- **L’état de la région** se déduit aussi, en cinq degrés montrés au point de départ des liaisons : abandonnée (aucune partie posée), réactivée (une partie posée), en reconstruction (la construction du lieu de départ achevée et une liaison qui en part), en développement (en plus, une grande construction), ouverte (le passage vers la région suivante fait). La montée d’un degré se dit une fois, avec un son.
- **Deux vues au choix** (réglage « Vue du monde ») : le monde en 3D et la liste des lieux.

## La boucle

La boucle ([GD-5](propositions/GD-5.md), modèle A ; [GD-6](propositions/GD-6.md)) :

1. **Une mission est une demande de l’habitant.** Plusieurs missions sont ouvertes, mais un seul habitant fait signe à la fois : c’est la mission conseillée.
2. **La première réussite d’une mission pose sa partie** de la construction du lieu, d’un coup, sous les yeux de l’élève, quels que soient le niveau et les étoiles, jokers compris. La construction d’un lieu a une partie par mission. La pose vient après l’écran de résultat, jamais par-dessus une consigne ; un toucher la passe ; une phrase dans un panneau dit quelle partie est posée.
3. **Les ressources gagnées vont au stock**, selon le barème. Le lieu de départ fournit sa ressource dès la première séance : les missions de l’école la rapportent.
4. **Un lieu achevé fournit sa ressource** aux missions rejouées et aux révisions dues que propose son habitant ; la révision rapporte sa ressource quand on la finit, quel que soit le score.
5. **L’élève dépense son stock** pour les liaisons, les grandes constructions, le passage et les commandes. Seule la construction du lieu se pose seule : le reste est un geste de l’élève, qui choisit où dépenser.
6. **Le défi du gardien** achève l’épreuve du lieu et compte pour le passage.

Trois échelles : une mission (5 à 10 minutes, une partie posée) ; un lieu (quelques séances, le lieu achevé qui fournit sa ressource) ; une région (une année, la région transformée et le passage). Le savoir devient un outil petit à petit (modèle B : une notion maîtrisée ouvre un raccourci ou un embellissement, jamais un passage obligatoire), et les grands projets mêlent les matières en 4e et en 3e (modèle C), chacun par sa fiche.

## Les missions, les révisions et les étoiles

- **Une mission** donne 1 à 3 étoiles ; la meilleure est gardée. Elle a deux ou trois niveaux, et monte de niveau sur une partie quasi parfaite ([Exercices](../conception/exercices.md)).
- **Les ressources** sont proportionnelles au score, avec un bonus aux étoiles et à la première fois ; une bonne réponse en rapporte au moins une. Une première mission rapporte cinq à sept ressources : de quoi payer une liaison. Le barème complet est une page générée ([Barème](https://g7ed6e.github.io/dysapps/pedagogie/bareme.html)).
- **Les révisions** suivent la répétition espacée (J+1, J+3, J+7, J+15) ; l’habitant du lieu les propose dans le monde. Ce sont les révisions dues, pas une mission maîtrisée rejouée à volonté.
- **Au retour après une absence**, un seul habitant fait signe, avec une phrase courte qui dit où en était le monde, sans durée ni baisse.

## Les ressources

- **Deux sortes seulement** : la ressource du lieu et la ressource composée. Aucune monnaie nouvelle, aucune jauge.
- **Toute ressource de lieu paie toute liaison** : ce qu’on gagne n’importe où sert.
- **La ressource composée**, une par région, n’est fournie par aucun lieu : elle se fait au lieu d’assemblage du lieu de départ, à partir de trois ressources de deux lieux de la région, une à la fois, sur une recette fixe et toujours affichée. Chacune demande de répondre à une question qui mêle les deux matières de la recette, sans XP ni étoiles ; rien ne se perd en cas d’erreur ou en quittant ([GD-2](propositions/GD-2.md)). Les recettes, les questions et les noms propres à chaque univers sont dans `docs/contenu/assemblage.md`.
- **Le stock dit, pour chaque ressource, ce qu’elle construit maintenant**, et chaque chantier est un lien qui y emmène. Quand une ressource ne sert à rien, il le dit honnêtement.
- **Les ressources d’une région quittée servent encore** : la région suivante en demande un peu, en révision en spirale, puis les grands projets de 4e et de 3e. Ce qui est demandé ne bloque jamais, et une ressource manquante se gagne par des révisions ([cadrage du contenu](../conception/cadrage-contenu.md)).
- **L’or et le cristal** ne sont que des trophées, dans la salle des succès.

## Les constructions

- **La construction du lieu** a une partie par mission ; chaque partie se pose seule à la première réussite de sa mission. Ce qu’une partie posée donne : de l’XP, la réplique de l’habitant, une ligne datée au journal, le geste et le son de pose de l’univers.
- **Les grandes constructions**, deux par région, chacune à part, au large d’un lieu : 60 à 125 ressources de plusieurs lieux de la région, dont 4 à 8 ressources composées aux endroits qui comptent. Elles n’ouvrent rien et ne bloquent rien ; on les pose case par case, dans n’importe quel ordre, à son rythme. De l’XP, et un succès à la première.
- **Les petits ouvrages** se posent chez un habitant quand sa commande est livrée.
- Une case posée reste posée. Les cases attendues se montrent en fantôme, et « Poser la suivante » ou « Poser tout ce que j’ai » évitent des dizaines de touchers.

## Les liaisons

Le point de départ des liaisons est **en étoile** ([GD-7](propositions/GD-7.md)) :

- **Depuis le point de départ, une liaison mène à chaque lieu de la classe**, en plus des liaisons entre lieux voisins, qui restent en raccourcis. Les prix permettent à une séance de payer une liaison, quelle que soit la direction : il y a toujours trois lieux au choix. En 6e, deux lieux sont ouverts au départ, un de français et un de maths.
- **Une liaison ne coûte que des ressources.** Seule celle qui monte d’un lieu demande aussi la première mission réussie de son lieu de départ, qui ne fait pas attendre. Aucun défi n’est la condition d’une liaison.
- **Les liaisons ne relient que des lieux d’une même région.** Une liaison possible se dessine en fantôme ; la toucher ouvre sa proposition sur le lieu ouvert qu’elle touche.
- **Ouvrir un lieu se fête** par la transformation : la caméra va jusqu’au lieu qui s’ouvre, son habitant accueille.
- **Une seule suggestion, qui suit l’élève**, toujours au même endroit (« Prochaine destination », « Y aller »), avec les mêmes mots en 3D et en vue simple, dite à voix haute avec sa raison. L’ordre : le passage prêt ; sinon le lieu où l’élève est allé de lui-même ; sinon une commande prête à livrer ; sinon un lieu ouvert pas commencé ; sinon la liaison payable vers le lieu de la matière la moins jouée (jamais la moins réussie ; la LV2 hors du calcul). Elle ne change pas tant que l’élève n’a rien fait. Les autres liaisons payables restent en fantôme, sans marque.

## Les habitants, les commandes et les gardiens

- **Un habitant par lieu** : il habite, propose les missions, se souvient, propose les révisions dues et parle à l’arrivée. Il se promène sans gêner les bornes ni les fantômes. Son signe est lent, sans clignoter, et la vue simple montre le même.
- **Les commandes** : l’habitant d’un lieu ouvert où l’élève a joué demande la ressource d’un autre lieu ou la ressource composée de la région. Livrée, la commande pose un petit ouvrage chez lui ; elle n’ouvre ni ne ferme jamais un lieu. Trois commandes ouvertes au plus, une seule mise en avant ; une nouvelle arrive quand une est livrée. Elles sont dans une liste toujours au même endroit (panneau du lieu, menu, vue simple), avec l’habitant, l’objet en icône et en nom, et une phrase qui dit le lieu et le geste, jamais une notion ni une note. Une commande n’a ni délai ni échéance, ne disparaît pas et ne se rate pas ; l’ignorer ne coûte rien.
- **Un gardien par lieu**, à côté du lieu. Son défi s’ouvre avec les étoiles des missions du lieu ; réussi, il le reste, et le gardien change d’aspect pour le montrer. Un gardien ne fait jamais de commande.
- **Le mot des grandes étapes** : un habitant de la région le dit, une fois par appareil, aux grandes étapes seulement (l’arrivée dans la région, le dernier défi réussi, la construction du lieu de départ achevée, la première liaison payée). Les étapes se déduisent de la sauvegarde ; une seule parle à la fois, la plus grande.

La liste des habitants et des gardiens, lieu par lieu, avec ce qui change d’un univers à l’autre : [Personnages et Gardiens](personnages.md).

## Le passage

- **Une seule construction qui grandit, trois passages** : elle reçoit un élément nouveau à chaque passage (6e vers 5e, 5e vers 4e, 4e vers 3e). Elle se construit au point de départ des liaisons, case par case, avec les ressources de la région ; aucune ressource rare.
- **Les éléments clés arrivent avec les défis** : ils apparaissent quand assez de défis de la région sont réussis (3, puis 2, puis 2), même si des lieux ne sont pas achevés. L’élève pose tout le reste lui-même.
- **Partir est un acte explicite** (un bouton), jamais l’effet de la dernière case. L’XP et le succès arrivent au départ.
- **Le premier passage** vers une région se joue en entier (huit secondes au plus) ; un toucher, Entrée, Espace ou Échap le font arriver. Ensuite, changer de région est discret : un fondu d’une demi-seconde, et le choix d’une région atteinte d’un toucher. **On revient toujours** à une région précédente.
- Un élève de 3e passe d’abord par les régions de 6e, 5e et 4e ; dans une région, rien n’est imposé.

## Le lieu de départ

Le lieu de départ de chaque région rassemble ce qui était un portail à part : **un seul jeu**, où chaque chose de l’application a sa place dans le monde.

- **L’école**, là dès le début, qu’on ne construit pas : trois portes, une par matière, et derrière elles les missions du portail. Elles rapportent la ressource du lieu de départ de la région où se tient l’élève, au barème des missions, et ne comptent ni pour le défi ni pour les étoiles des lieux.
- **La salle des succès** : un trophée par succès, à une place fixe, dans l’ordre de la liste. La salle garde douze places, puis s’agrandit d’une travée au 13e succès et au 19e, jusqu’à 8 × 3 cases ; rien n’est posé sur son toit ([GD-3](propositions/GD-3.md)). Une travée apparaît entière, d’un coup, sans mouvement imposé ni son.
- **Le lieu d’assemblage**, où se font les ressources composées.
- **En trois bandes** : devant, les bornes seules ; au milieu, la salle des succès, une place libre, puis l’école ; au fond, la construction du lieu et le lieu d’assemblage. Rien ne se pose devant la porte d’un lieu ni une case autour. Les coordonnées sont dans le code (`world/terrain.ts`, `world/plans.ts`, `world/salle.ts`).

## La vie du monde

- **Le jour et la nuit selon l’heure réelle** (aube 7 h, crépuscule 20 h), avec une nuit toujours claire ; le réglage « La lumière du monde » garde le jour, et c’est le jour tant que le premier tutoriel n’est pas vu.
- **Les sons** sont générés par le code. Par défaut, seuls les sons d’action ; l’ambiance est un réglage. Jamais de son pendant la lecture à voix haute.
- **Le personnage de l’élève** se tient dans le lieu où l’on est et marche de lieu en lieu le long des liaisons construites ; vers un lieu fermé, il reste où il est. La caméra le suit ; avec « Réduire les animations », il apparaît à l’arrivée.
- **Les célébrations sont sobres** : transformation du décor, lumière, son court, jamais de pluie de confettis, et jamais par-dessus un panneau qu’on lit.

## L’XP, les rôles et les succès

- **L’XP** monte à chaque mission, partie posée, liaison, grande construction et passage ; **cinq rôles** selon l’XP, sans divisions, nommés par chaque univers.
- **Les succès** sont peu nombreux ; chacun pose un trophée dans la salle des succès.
- Les récompenses servent d’abord le monde ; la maturité vient de l’autonomie et de la profondeur, jamais d’un ton plus sombre.

## La sauvegarde

La sauvegarde est commune aux univers : la progression passe de l’un à l’autre. Ses clés, ses champs et ses identifiants sont neutres et en anglais, sans mot d’univers (décision du mainteneur, 2 octobre 2026) : `game` (avec `stock` et `world`, qui range `parts`, `links` et `place`), `progress`, `settings`, `resume`. Un lieu a pour identifiant sa notion (`phonology`, `homophones`, `english-6e-grammar`…) ; sa ressource a le même identifiant ; une partie, une liaison, une grande construction et un exercice se nomment à partir de leur lieu ou de leur région ; les classes restent `6e` à `3e`.

Rien ne se perd au changement de format : la partie porte un numéro de version, une sauvegarde ancienne est traduite au chargement avant que l’ancienne clé soit effacée, un fichier de sauvegarde ancien se restaure puis passe par la même traduction, et les anciennes adresses mènent aux nouvelles. Une sauvegarde gelée n’est pas réécrite.

## Les univers

Un univers change le récit, les noms, le dessin et l’habillage de l’interface ; jamais les règles, la progression ni la sauvegarde. Il fournit :

- **sa table de mots**, un mot affiché pour chaque mot neutre de ce document ;
- **son récit et son ton** ;
- **son dessin**, dans son plafond, et son geste de pose ;
- **ses textes** : noms des lieux, des habitants, des gardiens, des ressources et des rôles, répliques.

Blocland : [sa fiche](../univers/blocland/fiche.md) et [son cadrage](../univers/blocland/cadrage.md). Archipéo, en pause : [son dossier](../univers/archipeo/game-design.md).
