# L’aventure Blocland

Blocland, ce sont **quatre archipels** de blocs, un par classe : les Basses Terres (6e), les Collines du Large (5e), les Monts de Feu (4e) et les Îles du Ciel (3e), soit vingt îles. Le village est en ruine et l’élève est le bâtisseur : chaque exercice réussi rapporte des blocs, les blocs construisent des ouvrages entre les îles, reconstruisent les bâtiments des créatures et, au port, le **Bloc-Navire** qui mène à l’archipel suivant. Chaque île est un thème du programme, en français ou en maths. Le détail du contenu de chaque île est dans [L’archipel](../pedagogie/archipel.md).

## Le monde

Depuis l’accueil, **Blocland** ouvre le village en 3D sur tout l’écran, sous la barre du haut. La caméra est gérée par l’application : pas de zoom ni de rotation à gérer, le nord reste toujours le même. Elle cadre l’île où se tient le bonhomme et ses voisines, se rapproche quand un panneau s’ouvre, suit le bonhomme quand il marche. Un toucher n’importe où pendant un trajet le fait arriver tout de suite. Au clavier, les flèches vont à l’île voisine.

- **Quatre archipels**, un par classe. On voit un archipel à la fois : celui où se tient le bonhomme. Chacun a sa mer, son ciel et sa Carte : la mer tempérée des Basses Terres avec ses récifs et ses bancs de sable ; la mer turquoise des Collines du Large sous un ciel plus froid, avec des plaques de glace ; le bleu profond des Monts de Feu, la brume plus proche et des aiguilles d’ardoise qui sortent de l’eau ; et, dans les Îles du Ciel, plus de mer du tout : un plancher de nuages sous les îles, des nuages qui passent entre elles, aucune baleine. Les îles de 6e sont au niveau de la mer, celles de 5e sur les collines, celles de 4e sur les monts, celles de 3e sur les sommets, où elles flottent sur une roche qui s’amincit. Les régions ont leur paysage, leurs plantes et un repère (grand chêne, champignon géant, volcan qui fume, tour de guet, grand phare, aiguille de glace du Glacier, haut-fourneau de la Forge).
- **L’île-port** de chaque archipel a un quai devant elle, avec le Bloc-Navire amarré : la Plaine des nombres en 6e, le Marché des proportions en 5e, l’Atelier du calcul littéral en 4e, le Phare des fonctions en 3e.
- **Les îles fermées** restent visibles, délavées comme dans la brume. Les toucher fait dire à leur créature précisément ce qu’il faut pour y arriver.
- **Le monde vit** : jour et nuit selon l’heure réelle de l’appareil (aube à 7 h, crépuscule à 20 h, nuit toujours claire), nuages, eau qui ondule, cascades, lanternes la nuit, oiseaux, rochers et bancs de sable au large, quatre baleines qui soufflent. Le réglage « Réduire les animations » fige tout.
- **La Carte** (barre du bas) montre tout l’archipel vu du ciel, avec un fanion sur le bonhomme. Toucher une île ouverte y envoie le bonhomme ; toucher une île fermée affiche le chemin d’ouvrages à construire, balisé en jaune dans le monde.
- **Le bonhomme** est l’avatar de l’élève. Il se tient sur l’île où l’on est et marche d’île en île le long des ouvrages construits.
- **Sans 3D** (réglage « Vues en 3D » désactivé, ou appareil sans WebGL), Blocland reste une **vue simple** en listes : la carte des îles, puis la page de chaque île avec les mêmes quêtes, plans, Gardien et ouvrages. Tout ce qui se fait en 3D se fait en vue simple.

Aucun texte à lire n’est dessiné dans la 3D : tout ce qui se lit est dans des panneaux HTML, dans la police et la taille choisies, et lu à voix haute.

## Le panneau d’une île

Toucher une île ouverte fait voler la caméra et ouvre son panneau (il glisse depuis le bas, ou depuis la droite sur grand écran). On y trouve, dans l’ordre :

1. **La créature** et sa phrase d’accueil, lue à voix haute.
2. **Le prochain objectif** : ce que l’application conseille de faire maintenant.
3. **Les quêtes**, avec les étoiles gagnées. Un losange jaune flotte dans le monde au-dessus d’une quête à faire ; des cubes d’or comptent les étoiles.
4. **Le Gardien** : verrouillé tant qu’il manque des étoiles ; le toucher dit lesquelles.
5. **Le plan** de l’île : avancement, blocs manquants et où les gagner, bouton « Poser le bloc suivant », bâtiments déjà terminés ici.
6. **Le Bloc-Navire**, sur l’île-port seulement : l’étape en chantier, les Gardiens à vaincre, le bouton « Embarquer » quand tout est prêt, et les boutons pour revenir sur un archipel déjà atteint.
7. **Les ouvrages** qui partent de l’île, avec leur coût et leur condition.

Dans le monde, chaque île a **une borne par quête** (un socle et un panneau) : la toucher lance la quête. Après un exercice, on revient au même endroit, panneau ouvert.

La **croix** du panneau le replie sans quitter l’île : la caméra reste cadrée sur elle. Un bouton au nom de l’île, dans la barre du bas, le rouvre ou le replie ; toucher à nouveau l’île, une de ses bornes ou un ouvrage le rouvre aussi.

## Les quêtes et les étoiles

Chaque île propose deux ou trois **quêtes**. Une partie enchaîne les items d’un exercice (souvent huit, ou quatre écrans de quatre mots), un item à la fois :

- la créature lit la consigne ;
- l’élève répond en un geste : toucher un mot, un bloc, une réponse, valider un écran ;
- la correction est immédiate et jamais punitive : la bonne réponse et une explication d’une ligne, dans un bandeau fixe ;
- l’écran de récompense donne le score, les étoiles, les blocs et l’XP.

Les **étoiles** : une pour avoir terminé, deux à partir de 70 % de réussite, trois à partir de 90 %. La meilleure est gardée. Le score compte un point par item trouvé du premier coup et un demi-point avec une aide ou après une erreur.

**Chaque partie change** : d’autres nombres en maths, un autre tirage de mots en français. Le **niveau** de chaque quête s’adapte à l’élève : il monte après deux bonnes parties (ou une seule quasi parfaite), redescend après deux parties difficiles, sans jamais l’afficher comme une baisse. À niveau égal, l’exercice le moins joué est proposé.

Les items ratés reviennent à **J+1, J+3, J+7, J+15** (répétition espacée) et sortent après trois réussites d’affilée.

## Les blocs

Une quête réussie donne des **blocs** du type de l’île (bois dans la Forêt, pierre dans la Mine, brique dans la Plaine…), proportionnels au score et jamais zéro dès qu’une réponse est juste. Deux étoiles ajoutent un bloc, trois en ajoutent deux, et la **première partie** d’une quête en donne deux de plus. Une première quête réussie rapporte donc de cinq à sept blocs : de quoi construire un premier ouvrage et commencer un bâtiment.

Les blocs servent à deux choses : **construire les ouvrages** entre les îles (n’importe quel type gagné sur une île) et **poser les blocs des plans** (le type est imposé par le plan). Rien ne se perd : un bloc mal posé se retire et revient dans l’inventaire.

## Les ouvrages entre les îles

Au départ, deux îles sont ouvertes : la **Forêt des sons** (français) et la **Plaine des nombres** (maths), reliées par un pont déjà construit. Les autres îles de l’archipel s’ouvrent en construisant un ouvrage depuis le panneau d’une île ouverte. Les ouvrages ne relient que les îles d’un même archipel ; pour changer d’archipel, voir le Bloc-Navire ci-dessous. Dans un archipel, rien n’est imposé : on choisit sa direction.

| Ouvrage | Coût | Condition en plus |
| --- | --- | --- |
| Pont, bac, sentier de pierres de gué | des blocs | aucune |
| Escalier taillé | des blocs | le premier plan de l’île de départ terminé |
| Tunnel à lanternes, col à garde-fou | des blocs | le Gardien de l’île de départ vaincu |

Un ouvrage constructible est dessiné en fantôme dans le monde ; le toucher ouvre sa proposition. Quand il manque une condition, le panneau l’explique sans pénalité. La construction fait la fête : des éclats d’or, la caméra vole jusqu’à l’île qui s’ouvre, sa créature accueille. La liste complète des ouvrages et de leurs coûts est dans [Ouvrages et plans](../pedagogie/ouvrages.md).

## Les plans : reconstruire le village

Chaque île a **trois plans** enchaînés : le bâtiment de la créature (la cabane de Mousso, la forge de Tunel, le nid de Coco…), puis son toit avec porte et lanterne, puis sa cour avec barrières et escalier. Le bâtiment est dessiné en **fantômes bleutés** dans le monde.

- En 3D, toucher un fantôme pose le bloc attendu ; en vue simple ou en 3D, le bouton **Poser le bloc suivant** fait la même chose. Les blocs se posent dans n’importe quel ordre.
- S’il manque un type de bloc, le panneau dit lequel et sur quelle île le gagner.
- Les blocs de **finition** (toit, porte, lanterne, barrière, escalier) ne se gagnent pas dans les exercices : le coffre de chaque plan terminé fournit le kit du plan suivant, et le dernier plan d’une île donne de l’or et du cristal, utiles pour les ouvrages.
- Plan terminé : la créature parle (lue à voix haute), un coffre de blocs, de l’XP, un succès. Le **journal du village** date chaque bâtiment terminé, rappelé dans le panneau de son île ; la page Succès compte les bâtiments.

Un rappel de pause s’affiche après dix minutes de construction, sans rien bloquer.

## Le Bloc-Navire et les archipels

Le **Bloc-Navire** est le véhicule qui mène d’un archipel au suivant. Il se construit comme un plan, au quai de l’île-port, en trois étapes : la **coque et la voile** (sur la Plaine des nombres, pour rejoindre les Collines du Large par la mer), puis le **ballon** (sur le Marché des proportions, pour rejoindre les Monts de Feu par les airs), puis le **réacteur** (sur l’Atelier du calcul littéral, pour monter jusqu’aux Îles du Ciel). C’est le même navire qui grandit.

- **Les blocs** de chaque étape se gagnent sur les îles de l’archipel (sable, bois, galet et pierre pour la coque ; glace, panneau et toile pour le ballon ; acier, calque et ardoise pour le réacteur). Ils se posent avec le bouton « Poser le bloc suivant » de la section Bloc-Navire, ou en touchant une case bleue du navire au quai. Le navire tangue doucement à quai (il plane dans les Îles du Ciel), son ballon se balance ; quand le panneau du port est ouvert et qu’il reste des cases à poser, la flèche jaune flotte au-dessus du chantier.
- **Le kit arrive avec les Gardiens** : la voile, le haut du ballon et les feux du réacteur ne se gagnent pas. Ils apparaissent quand assez de Gardiens de l’archipel sont vaincus : trois dans les Basses Terres, deux dans les Collines du Large, deux dans les Monts de Feu. La section dit combien il en manque et lesquels sont les plus proches.
- **Embarquer** : quand toutes les cases sont posées et le kit arrivé, le bouton « Embarquer vers l’archipel de 5e » apparaît. Le voyage se joue (un toucher ou le bouton « Arriver » le termine tout de suite), puis la créature du port d’en face accueille. L’étape rapporte son XP et un succès (Capitaine, Aéronaute, Pilote du ciel).
- **On revient toujours.** Le voyage fait reste fait. Sur tout port, la section Bloc-Navire propose « Revenir en 6e » ou « Repartir vers 5e » pour chaque archipel déjà atteint. Rien ne se perd, rien ne coûte.
- **Une île d’un autre archipel** est visible dans les listes et sur les pages Français et Maths avec la mention « Archipel à rejoindre » ; sa créature dit précisément ce qu’il faut : finir le Bloc-Navire sur tel port, vaincre tant de Gardiens, ou aller d’abord jusqu’à l’archipel d’avant.
- Sous « Réduire les animations », le voyage est un écran fixe : le navire dessiné, la phrase lue, le bouton « Arriver ».

## Les Gardiens

Chaque île a un **Gardien** (le Grand Chêne, le Golem de roche, le Hanneton de bronze…). Il accepte le défi quand **chaque quête de l’île a au moins deux étoiles** ; tant que ce n’est pas le cas, la page de l’île dit ce qui manque.

Le défi enchaîne **deux manches de chaque quête** de l’île, tirées d’exercices au niveau de l’élève, avec leurs écrans et leurs corrections habituels, **sans chrono**. Dans l’arène, le Gardien est une grande créature en cubes qui respire ; sa **jauge de résistance** baisse à chaque épreuve réussie (il n’y a jamais de jauge pour l’élève). Il s’incline quand on réussit, gronde doucement quand on rate, dit une réplique à chaque épreuve, s’écroule quand il est vaincu. Tambour à l’entrée, fanfare à la victoire ; « Réduire les animations » neutralise le tout.

**Deux étoiles au défi** : Gardien vaincu. Blocs d’or, XP, succès, un bloc d’or planté sur l’île, et le Gardien devient une statue de pierre sur son îlot devant l’île. On peut le réaffronter. Vaincre un Gardien ouvre aussi les tunnels et les cols qui partent de son île, et compte pour le kit du Bloc-Navire de l’archipel.

## Les sons

Les sons sont générés par le code, sans aucun fichier : un « toc » à la pose, un « pop » au retrait, un refus doux, jamais pendant la lecture à voix haute. Le réglage « Sons dans le village » les coupe. L’**ambiance** (vent, oiseaux le jour, grillons la nuit) est désactivée par défaut et s’active dans les réglages.

## Les commandes en bref

| Geste | Effet |
| --- | --- |
| Toucher une île ouverte | La caméra s’approche, son panneau s’ouvre, le bonhomme y marche |
| Toucher une île fermée | Sa créature dit l’ouvrage qui y mène |
| Toucher une borne de quête | Lance la quête (ou explique pourquoi elle ne l’est pas) |
| Toucher un ouvrage (construit ou fantôme) | Ouvre l’île qu’il touche, avec sa proposition mise en avant |
| Toucher un fantôme de bâtiment | Pose le bloc attendu |
| Toucher une créature | Elle dit une phrase, lue à voix haute |
| Toucher le Bloc-Navire au quai (île-port) | Ouvre le panneau du port sur sa section Bloc-Navire ; une case bleue pose le bloc attendu |
| Bouton « Embarquer » ou « Revenir en … » (panneau du port) | Le voyage vers un autre archipel |
| Toucher le Gardien sur son îlot | Lance le défi |
| Toucher pendant un trajet | Le bonhomme arrive tout de suite |
| Flèches du clavier | Île voisine dans cette direction |
| Bouton Carte | Le continent vu du ciel |
| Bouton Forcer le jour (la nuit) | Repasse en plein jour |
| Bouton Revoir l’aide | Rejoue le tutoriel de six bulles |
