# L’aventure Archipéo

Archipéo, ce sont **quatre archipels** de blocs, un par classe : les Premiers Rivages (6e), les Îles Brumeuses (5e), les Anciens Ateliers (4e) et les Îles du Ciel (3e), soit vingt-huit îles. Le village est en ruine et l’élève est le bâtisseur : chaque exercice réussi rapporte des blocs, les blocs construisent des ouvrages entre les îles, reconstruisent les bâtiments des créatures et, au port, le **Bloc-Navire** qui mène à l’archipel suivant. Chaque île est un thème du programme, en français, en maths ou en anglais. Le détail du contenu de chaque île est dans [L’archipel](../pedagogie/archipel.md).

## Le monde

L’appli s’ouvre sur le village (réglage « Au démarrage ») ; depuis le menu, **Archipéo** l’ouvre aussi. Le village est en 3D sur tout l’écran, sous la barre du haut. La caméra est gérée par l’application : pas de zoom ni de rotation à gérer, le nord reste toujours le même. Elle cadre l’île où se tient le bonhomme et ses voisines, se rapproche quand un panneau s’ouvre, suit le bonhomme quand il marche. Un toucher n’importe où pendant un trajet le fait arriver tout de suite. Au clavier, les flèches vont à l’île voisine.

![Les Premiers Rivages en 3D, reconstruits : les îles reliées par des ponts, leurs maisons, les statues des Gardiens vaincus, les étiquettes des noms d'îles et la barre du bas (Carte, Blocs, École).](/captures/village-reconstruit.jpg)

- **Quatre archipels**, un par classe. On voit un archipel à la fois : celui où se tient le bonhomme. Chacun a sa mer, son ciel et sa Carte : la mer tempérée des Premiers Rivages avec ses récifs et ses bancs de sable ; la mer turquoise des Îles Brumeuses sous un ciel plus froid, avec des plaques de glace ; le bleu profond des Anciens Ateliers, la brume plus proche et des aiguilles d’ardoise qui sortent de l’eau ; et, dans les Îles du Ciel, plus de mer du tout : un plancher de nuages sous les îles, des nuages qui passent entre elles, aucune baleine. Les îles de 6e sont au niveau de la mer, celles de 5e sur les collines, celles de 4e sur les monts, celles de 3e sur les sommets, où elles flottent sur une roche qui s’amincit. Les régions ont leur paysage, leurs plantes et un repère (grand chêne, champignon géant, volcan qui fume, tour de guet, grand phare, aiguille de glace du Glacier, haut-fourneau de la Forge).
- **L’île-port** de chaque archipel a un quai devant elle, avec le Bloc-Navire amarré : la Plaine des nombres en 6e, le Marché des proportions en 5e, l’Atelier du calcul littéral en 4e, le Phare des fonctions en 3e.
- **Le nom de chaque île ouverte** est écrit au-dessus d’elle, sur une étiquette claire, dans la police de lecture (en 3D comme en 2D) : on sait où l’on va avant de toucher.
- **Les îles fermées** restent visibles, délavées comme dans la brume. Les toucher fait dire à leur créature précisément ce qu’il faut pour y arriver.
- **Le monde vit** : jour et nuit selon l’heure réelle de l’appareil (aube à 7 h, crépuscule à 20 h, nuit toujours claire), nuages, eau qui ondule, cascades, lanternes la nuit, oiseaux, rochers et bancs de sable au large, quatre baleines qui soufflent (l’une d’elles passe au large de l’île concernée quand [la baleine parle](#le-mot-de-la-baleine)). Le réglage « Réduire les animations » fige tout.
- **La Carte** (barre du bas) montre tout l’archipel vu du ciel, avec un fanion sur le bonhomme. Chaque île y porte son nom et son **état**, en icône et en mot, jamais par la couleur seule :
  - **Fermée** (un cadenas) : aucun chemin d’ouvrages n’y mène encore ;
  - **À explorer** (une boussole) : ouverte, aucune mission jouée ;
  - **En chantier** (un marteau) : on y a joué, ses plans ne sont pas finis ;
  - **Restaurée** (une coche) : ses trois plans sont terminés.

  L’état se déduit de la partie, rien n’est enregistré. Le panneau de la Carte dit la **prochaine destination** (la même que « Reprendre l’aventure » au menu), marquée dans le monde par la flèche jaune ; **Y aller** y envoie le bonhomme. Le pli **Les îles et leur état** redit la liste en mots, chaque île en bouton. Toucher une île ouverte y envoie le bonhomme ; toucher une île fermée affiche le chemin d’ouvrages à construire, balisé en jaune dans le monde.
- **Les quatre archipels** (bouton de la Carte) : une carte dessinée des quatre archipels, en lecture seule, sur la route du Bloc-Navire. Ceux qu’on a atteints sont en îles pleines, celui où l’on est est entouré, les autres sont **dans la brume**. Dessous : où l’on est, les îles ouvertes et les Gardiens vaincus de chacun, ce qu’il faut pour aller plus loin, le navire tel qu’il est, et des boutons « Aller au port » ou « Voir le chantier ».
- **Les blocs** (bouton « Blocs » de la barre du bas) : l’inventaire, et pour chaque bloc ce qu’il peut construire, voir [Mes blocs](#mes-blocs).
- **L’école du village** se tient sur l’île de l’école de chaque archipel (la Forêt des sons en 6e, le Marché des proportions en 5e, l’Atelier du calcul littéral en 4e, le Phare des fonctions en 3e) : une maison de brique au toit rouge, avec une porte, deux fenêtres et une cloche d’or, voir [L’école du village](#lecole-du-village). À côté, au milieu de l’île, la **salle des trophées** : un pavillon de marbre ouvert devant, avec un trophée par succès gagné, voir [La salle des trophées](#la-salle-des-trophees).
- **Sur téléphone**, les boutons de la barre du bas n’ont que leur icône (leur nom est lu par les lecteurs d’écran) : tous tiennent sur la largeur ; s’il en manque, la barre défile.
- **Le bonhomme** est l’avatar de l’élève. Il se tient sur l’île où l’on est et marche d’île en île le long des ouvrages construits. Sur une île qu’il traverse, il va d’un ouvrage au suivant sans repasser par le milieu ; partout, il suit le sol, contourne les arbres, les rochers, les bornes, les maisons et les créatures, et ne monte ou ne descend qu’un bloc à la fois.
- **En 2D (expérimental)** (réglage « Vue du monde » : « Le monde en 2D »), le même monde est dessiné en pixels, vu de dessus en oblique : on voit le dessus des cases et, sous chaque dénivelé, la face avant, comme une falaise. La caméra reste de près, comme dans un jeu d’aventure : autour du bonhomme, sans sortir de son île (ou sur l’île ouverte), et la Carte montre tout l’archipel. Herbe, sable et falaises ont leurs propres dessins, et le décor (arbres, buissons, fleurs, champignons…) est dessiné en sprites, avec leurs ombres. Le bonhomme marche d’une île à l’autre (on le voit de face, de dos ou de profil, qui fait ses pas), les créatures et les Gardiens se promènent à leur place, et chaque borne de mission est un panneau en bois à l’étoile d’or, avec au-dessus un losange jaune (mission à faire) ou les étoiles gagnées. Les cases d’un plan encore à poser sont bleutées et entourées de pointillés blancs. La flèche jaune « Commence ici », les balises d’un chemin à construire et le fanion « tu es ici » de la Carte sont là aussi, et le monde s’assombrit la nuit (les repères jaunes restent vifs). Les gestes sont les mêmes : toucher une île, une créature, un panneau ou un ouvrage, les flèches du clavier ; un toucher pendant un trajet fait arriver le bonhomme. Le Bloc-Navire tangue à quai, au bout de la jetée ; quand le panneau du port est ouvert pendant son chantier, la caméra le montre, la flèche jaune au-dessus, et toucher une case pointillée y pose le bloc (toucher le navire ailleurs ouvre le panneau du port). Au départ d’un voyage, le bonhomme marche jusqu’au pont, puis le navire s’éloigne avec lui à bord (l’écume derrière la voile, la flamme sous le réacteur), et la caméra le suit ; à l’arrivée, il accoste et le bonhomme débarque. C’est encore une vue expérimentale.
- **Sans monde** (réglage « La liste des îles », ou appareil qui ne sait rien dessiner ; sans WebGL, le monde en 3D laisse la place au monde en 2D), Archipéo reste une **vue simple** en listes : la carte des îles (avec un bouton **École du village**, la prochaine destination et son bouton **Y aller**, la carte des quatre archipels, et l’état de chaque île en mot), puis la page de chaque île avec les mêmes missions, plans, Gardien et ouvrages ; l’école y est une page. Tout ce qui se fait dans le monde se fait en vue simple.

![Le monde en 2D : la Forêt des sons en pixels, vue de dessus en oblique, avec la cabane en fantômes pointillés.](/captures/vue-2d.jpg)

Aucun texte à lire n’est dessiné dans la 3D : tout ce qui se lit est dans des panneaux HTML, dans la police et la taille choisies, et lu à voix haute.

## Le menu du village

Le bouton **Menu** (⏸), toujours en haut à droite du monde, ouvre le **menu du village** à la place du panneau d’île, le monde derrière. C’est le menu pause du jeu :

![Le menu du village, en panneau à côté du monde : Reprendre, École du village, Monuments, Missions, Succès, Réglages.](/captures/menu-village.jpg)

- **Reprendre** (le gros bouton bleu, ou la croix) : on revient au village ;
- **Continuer** : la dernière mission ouverte ; **À revoir aujourd’hui**, s’il y a des révisions ;
- **École du village**, **Monuments**, **Missions**, **Succès** (la salle des trophées, dans le village), **Réglages** ;
- **Revoir l’aide du village** (les huit bulles), **Tutoriel** ;
- **Le menu en page** : le même menu hors du village (`#/menu`).

On l’ouvre aussi avec le **bouton retour** du téléphone (ou du navigateur), quand aucun panneau n’est ouvert : le retour ne quitte plus l’appli sans prévenir. Depuis le menu, un second retour quitte l’appli, ou revient à la page d’avant.

Son adresse est `#/aventure/menu` ; en vue simple, elle mène au menu en page.

## Le panneau d’une île

Toucher une île ouverte fait voler la caméra et ouvre son panneau (il glisse depuis le bas, ou depuis la droite sur grand écran). On y trouve, dans l’ordre :

![Le panneau de la Forêt des sons : Mousso accueille, le prochain objectif et sa jauge, puis les missions.](/captures/panneau-ile.jpg)

1. **La créature** et sa phrase d’accueil, lue à voix haute.
2. **Le prochain objectif** : **un seul**, avec une jauge (« 0 / 3 ») : d’abord ce qu’on peut faire tout de suite (poser les blocs d’un plan, construire un ouvrage, poser les blocs du Bloc-Navire), sinon le plus proche, celui qui demande le moins de blocs (le plan en cas d’égalité). Sur un port, le Bloc-Navire prêt à partir passe avant tout.
3. **Les missions**, avec les étoiles gagnées. Un losange jaune flotte dans le monde au-dessus d’une mission à faire ; des cubes d’or comptent les étoiles.
4. **L’école du village**, sur l’île de l’école seulement, puis **le Gardien** : verrouillé tant qu’il manque des étoiles ; le toucher dit lesquelles.
5. **Le plan** de l’île : avancement, blocs manquants et où les gagner (le nom de l’île est un lien : le toucher y emmène la caméra et le bonhomme), bouton « Poser le bloc suivant », lien « Mes blocs », bâtiments déjà terminés ici.
6. **Le Bloc-Navire**, sur l’île-port seulement : l’étape en chantier, ses blocs manquants avec le même lien vers l’île où les gagner, les Gardiens à vaincre, le bouton « Embarquer » quand tout est prêt, et les boutons pour revenir sur un archipel déjà atteint.
7. **Les ouvrages** qui partent de l’île, avec leur coût et leur condition.

Le plan, le Bloc-Navire et les ouvrages sont des **sections repliables**. Elles s’ouvrent d’elles-mêmes quand il y a quelque chose à y faire (un bloc à poser, un ouvrage à construire, le navire prêt, ou l’ouvrage ou le navire que l’on vient de toucher dans le monde) et restent repliées sinon, avec leur état en une ligne (« 3 / 16 posés · il manque 6 bois », « Encore 3 blocs pour le moins cher »). Le panneau reste court ; un toucher sur le titre ouvre ou referme une section.

Dans le monde, chaque île a **une borne par mission** (un socle et un panneau) : la toucher lance la mission. Après un exercice, on revient au même endroit, panneau ouvert.

La **croix** du panneau le replie sans quitter l’île : la caméra reste cadrée sur elle. Un bouton au nom de l’île, dans la barre du bas, le rouvre ou le replie ; toucher à nouveau l’île, une de ses bornes ou un ouvrage le rouvre aussi.

## Les missions et les étoiles

Chaque île propose deux ou trois **missions**. Une partie enchaîne les items d’un exercice (souvent huit, ou quatre écrans de quatre mots), un item à la fois :

- la **consigne** est écrite au-dessus de l’item, en syllabes colorées si le réglage est activé, et lue à voix haute au début de la partie ; le bouton 🔊 « Consigne » la relit. Une mission qui lit elle-même son mot en s’ouvrant (dictée, écoute en anglais) ne lit pas la consigne par-dessus ;
- l’élève répond en un geste : toucher un mot, un bloc, une réponse, valider un écran ;
- **un deuxième essai**, comme dans les missions du portail : après une erreur, « Presque ! » s’affiche avec l’indice de l’item s’il en a un, la réponse déjà tentée est barrée, et l’on réessaie une fois. Ce n’est pas proposé quand il ne reste qu’une réponse possible (deux choix, ou le Filon : piocher ou laisser passer), ni au Gardien, qui est l’épreuve. Pour un tri (Chasse au son, Rimes-échelle, Enclos), tout l’écran se refait, sans dire quelles cartes sont fausses ;
- la correction est immédiate et jamais punitive : la bonne réponse et une explication d’une ligne, dans un bandeau fixe en bas de l’écran. Le bandeau ne cache pas la question : l’écran défile juste ce qu’il faut pour garder au-dessus la consigne et la question, ou, si elles sont trop hautes (téléphone), au moins l’énoncé, la réponse touchée et la bonne réponse ;
- dans un tri, la correction **nomme toutes les erreurs** : « Tu as oublié gant et éléphant : on y entend [an]. Dans pain, on entend [in], pas [an]. » Sur les cartes, un bon mot trouvé est vert avec une coche, un bon mot oublié est orangé avec « oublié », un intrus touché est orangé avec « pas [an] » (ou « ne rime pas »), un intrus bien laissé reste neutre ;
- pendant la partie, l’écran est en [mode concentration](quetes.md#le-mode-concentration) : un bouton Pause, un menu pour reprendre, régler le texte ou la voix, ou quitter vers le panneau de l’île ;
- l’écran de récompense donne le score, les étoiles, les blocs et l’XP, l’un après l’autre, puis **à quoi servent les blocs gagnés** : le chantier qu’ils font avancer, avec sa jauge (« La cabane de Mousso, sur Forêt des sons : 12 blocs sur les 20 qui manquent. », « Le sentier vers Mine des lettres : tu peux le construire ! », « Le Bloc-Navire, la coque et la voile : … »). C’est d’abord le plan ou le Bloc-Navire de l’île, puis l’ouvrage le moins cher qui en part, puis un autre chantier de l’archipel ; sinon la phrase dit que les blocs attendent le prochain plan, ou qu’aucun chantier ne les attend pour l’instant. Le bouton principal, **Voir le chantier**, ouvre l’île avec ce chantier mis en avant dans son panneau (en vue simple, sur la page de l’île) ; quand il n’y a pas de chantier, il devient **Revenir sur** l’île. Les succès gagnés pendant la partie (« Succès débloqué », « Niveau supérieur ! ») attendent cet écran : rien ne tombe sur la question pendant qu’on lit.

Les **étoiles** : une pour avoir terminé, deux à partir de 70 % de réussite, trois à partir de 90 %. La meilleure est gardée. Le score compte un point par item trouvé du premier coup et un demi-point avec une aide ou au deuxième essai. Dans un tri refait, un mot déjà juste au premier essai garde son point entier.

**Chaque partie change**, dès la première et même quand on recommence le jeu depuis le début : d’autres nombres en maths (école et collège), un autre tirage de mots en français, dans un autre ordre. La **place de la bonne réponse** change aussi : sur une partie, elle est autant de fois à gauche, au milieu ou à droite, et d’une partie à l’autre un même mot n’a pas sa réponse au même endroit. En maths, les nombres restent rangés dans l’ordre croissant ; ce sont les pièges proposés qui changent (1-2-3, 2-3-4 ou 3-4-5 syllabes, par exemple). Dans les maths de collège et les problèmes, la place de la réponse est tirée à chaque question, et les pièges sont toujours des erreurs vraisemblables tirées de l’énoncé. Le **niveau** de chaque mission s’adapte à l’élève : il monte après deux bonnes parties (ou une seule quasi parfaite), redescend après deux parties difficiles, sans jamais l’afficher comme une baisse. À niveau égal, l’exercice le moins joué est proposé.

Les items ratés reviennent à **J+1, J+3, J+7, J+15** (répétition espacée) et sortent après trois réussites d’affilée. Le jour venu, ils passent **en tête de la partie** de leur mission (pour les missions d’un item à la fois ; un tri de quatre mots garde ses écrans), et la mission choisit la variante qui en a, sans dépasser le niveau de l’élève. Le menu (en page et dans le village) montre alors **À revoir aujourd’hui**, qui mène à la première mission concernée et dit combien d’autres attendent.

## Les blocs

Une mission réussie donne des **blocs** du type de l’île (bois dans la Forêt, pierre dans la Mine, brique dans la Plaine…), proportionnels au score et jamais zéro dès qu’une réponse est juste. Deux étoiles ajoutent un bloc, trois en ajoutent deux, et la **première partie** d’une mission en donne deux de plus. Une première mission réussie rapporte donc de cinq à sept blocs : de quoi construire un premier ouvrage et commencer un bâtiment.

Les missions du portail, jouées depuis l’[école du village](#lecole-du-village) ou depuis la page Missions, donnent elles aussi des blocs, ceux de l’île de l’école.

Les blocs servent à trois choses : **construire les ouvrages** entre les îles (n’importe quel type gagné sur une île), **poser les blocs des plans** (le type est imposé par le plan) et, une fois les bâtiments finis, **construire les [monuments](#les-monuments)**. Rien ne se perd : un bloc mal posé se retire et revient dans l’inventaire.

### Mes blocs

Le bouton **Blocs**, dans la barre du bas (ou le lien « Mes blocs » sur la carte et la page d’une île en vue simple), ouvre l’inventaire à la place du panneau d’île. Il ne se contente pas de compter :

![Mes blocs : « Tu peux construire », un lien par chantier (plans, Bloc-Navire, monuments, ouvrages).](/captures/mes-blocs.jpg)

- **Tu peux construire** : en premier, ce qu’on peut faire tout de suite, un lien par chantier (le plan d’une île dont on a tous les blocs, le Bloc-Navire, un monument où l’on peut poser des blocs, un ouvrage qu’on peut payer). Sinon : « Rien pour l’instant : fais une mission pour gagner des blocs », avec un lien vers l’île où l’on est.
- **Dans ta poche** : chaque type de bloc en poche, et à côté ce qu’il construit maintenant : « Plan de Forêt des sons : encore 6 à gagner », « Plan de Plaine des nombres : tu as tout, pose-les », « Le Bloc-Navire : encore 4 à gagner », « L’observatoire des baleines : tu peux en poser 12 » quand aucun plan ni le navire n’en veut mais qu’un monument de l’archipel s’en sert, ou « À garder pour les plans suivants de … » quand rien ne l’attend aujourd’hui. Chaque mention est un lien : la toucher emmène la caméra et le bonhomme sur l’île, et ouvre son panneau. Les lignes sont rangées par utilité : ce qui se pose sur l’île où l’on est, puis ailleurs dans l’archipel, puis à garder, puis « Rien à construire pour l’instant ».
- **Prochains ouvrages** : combien de blocs peuvent payer un ouvrage (tous types d’île confondus), et les trois ouvrages les moins chers qu’on ne peut pas encore payer, avec leur coût.
- **À aller chercher** : les blocs que réclament les plans en cours et le Bloc-Navire et que l’on n’a pas, avec l’île ouverte où les gagner (un lien). Les blocs qui se gagnent sur des îles encore fermées ne sont pas détaillés, seulement comptés (« Et 3 autres sortes de blocs, sur des îles que tu ouvriras plus tard »).

La croix ramène sur l’île où se tient le bonhomme.

## Les ouvrages entre les îles

Au départ, deux îles sont ouvertes : la **Forêt des sons** (français) et la **Plaine des nombres** (maths), reliées par un pont déjà construit. Les autres îles de l’archipel s’ouvrent en construisant un ouvrage depuis le panneau d’une île ouverte. Les ouvrages ne relient que les îles d’un même archipel ; pour changer d’archipel, voir le Bloc-Navire ci-dessous. Dans un archipel, rien n’est imposé : on choisit sa direction.

![Le pli Ouvrages d'un panneau d'île : les blocs disponibles, et chaque ouvrage possible avec son coût et son bouton Construire.](/captures/ouvrages.jpg)

Chaque archipel a deux **îles d’anglais**. Dans les Premiers Rivages, elles sont derrière : la **Baie des mots** s’ouvre par un pont depuis la Ferme, l’**Horloge des verbes** par un pont depuis la Forêt, et un sentier relie les deux. Dans les Îles Brumeuses, elles forment une colonne à droite : le **Comptoir** s’ouvre par un pont depuis le Marché (le port), le **Manoir du passé** par un pont depuis le Marais, et un pont relie les deux. Dans les Anciens Ateliers, elles sont aux deux bouts de la crête : la **Gare du futur** s’ouvre par un pont depuis la Forge, le **Théâtre des voix** par un pont depuis le Cabinet des mots. Dans les Îles du Ciel, elles sont aux deux bouts de l’arc : le **Studio des ondes** s’ouvre par un pont depuis le Belvédère, le **Château des hypothèses** par un pont depuis l’Observatoire des données. Dans leurs missions, la consigne, l’indice et la correction sont en français ; les mots et les phrases en anglais sont lus avec une voix anglaise et ne sont pas découpés en syllabes. Dans une phrase anglaise, le trou se lit « blank ». Les missions d’écoute (**Ears** dans la Baie, **Listening** au Comptoir, **Dialogues** au Théâtre) lisent le mot ou la phrase anglaise dès qu’il apparaît : on l’écoute, puis on choisit son sens, ou, pour les Dialogues, la bonne réponse en anglais.

| Ouvrage | Coût | Condition en plus |
| --- | --- | --- |
| Pont, bac, sentier de pierres de gué | des blocs | aucune |
| Escalier taillé | des blocs | le premier plan de l’île de départ terminé |
| Tunnel à lanternes, col à garde-fou | des blocs | le Gardien de l’île de départ vaincu |

Un ouvrage constructible est dessiné en fantôme dans le monde ; le toucher ouvre sa proposition. Quand il manque une condition, le panneau l’explique sans pénalité. La construction fait la fête par la transformation : la caméra vole jusqu’à l’île qui s’ouvre, sa créature accueille. La liste complète des ouvrages et de leurs coûts est dans [Ouvrages et plans](../pedagogie/ouvrages.md).

## Les plans : reconstruire le village

Chaque île a **trois plans** enchaînés, qui bâtissent la maison de la créature (la cabane de Mousso, la forge de Tunel, le nid de Coco…) : d’abord **les murs** (le bloc de l’île, avec l’emplacement de la porte et des fenêtres), puis **le toit** (les tuiles, la porte, des fenêtres éclairées par des lanternes, une cheminée ou un sommet), puis **la cour** (une barrière avec son portillon, une lanterne sur chaque poteau du bout, une marche devant la porte, une jardinière). Le bâtiment est dessiné en **fantômes bleutés** dans le monde.

![La cabane de Mousso en cours : les murs posés en bois, le reste en fantômes bleutés.](/captures/plan-en-cours.jpg)

![Un plan terminé : la phrase de la créature, le coffre (porte, lanternes, tuiles) et l'XP, le succès Bâtisseur.](/captures/plan-termine.jpg)

Chaque île a sa forme de bâtiment :

- **une maison** à toit à deux pans et cheminée (Forêt, Mine, Ferme, Plaine, Baie, Carrefour, Manoir, Atelier, Forge, Théâtre, Studio) ;
- **une tour** de trois étages, avec une lanterne au sommet (Tour du lecteur, à bandes de pierre et de verre ; Phare ; Observatoire des textes), un cadran (Horloge) ou des créneaux (Château) ;
- **un dôme** à coupole en gradins et lanterne (Carrière, dont le four est en brique ; Glacier ; Cabinet ; Observatoire des données) ;
- **une échoppe** à auvent rayé (Marché, Comptoir, Gare) ;
- **une hutte** au toit en pointe (Rivière, Volcan, Marais, Falaise) ;
- **un kiosque** à colonnes (Belvédère).

- En 3D, toucher un fantôme pose le bloc attendu ; en vue simple ou en 3D, le bouton **Poser le bloc suivant** fait la même chose. **Poser tout ce que j’ai** pose d’un coup toutes les cases que l’inventaire permet (utile pour les grands bâtiments et le Bloc-Navire, qui a le même bouton). Les blocs se posent dans n’importe quel ordre.
- S’il manque un type de bloc, le panneau dit lequel et sur quelle île le gagner.
- Les blocs de **finition** (toit, porte, lanterne, barrière, escalier) ne se gagnent pas dans les exercices : le coffre de chaque plan terminé fournit exactement ceux du plan suivant, et le dernier plan d’une île donne de l’or et du cristal, utiles pour les ouvrages.
- **Les bâtiments ont été redessinés** (plus grands, avec fenêtres, toits à deux pans, cheminées). Un bâtiment déjà construit avec l’ancien dessin est construit avec le nouveau, et son coffre, déjà ouvert, est complété de ce que le nouveau donne en plus ; les blocs posés dans un plan commencé qui ne servent plus reviennent dans l’inventaire.
- Plan terminé : la créature parle (lue à voix haute), un coffre de blocs, de l’XP, un succès. Le **journal du village** date chaque bâtiment terminé, rappelé dans le panneau de son île ; la page Succès compte les bâtiments.

Un rappel de pause s’affiche après dix minutes de construction, sans rien bloquer.

### Le village en cinq états

Le village de chaque archipel passe par **cinq états**, déduits de ce que l’élève a construit (rien de plus n’est enregistré) :

1. **Abandonné** : aucun plan d’île n’est terminé. Au port, les lanternes de la jetée sont éteintes et une barque grise est retournée sur la rive.
2. **Réactivation** : un premier plan d’île est terminé. Les lanternes s’allument, la barque est redressée.
3. **Reconstruction** : les trois plans de l’île-port sont terminés et un ouvrage payé en part. Une barque est amarrée à la jetée, un foyer fume.
4. **Développement** : en plus, un monument de l’archipel est terminé. Une seconde barque, des caisses et des fanions sur le quai.
5. **Port** : le Bloc-Navire est parti vers l’archipel suivant. Une lanterne sur chaque poteau et un feu au bout de la jetée. Dans les Îles du Ciel, qui n’ont pas encore de voyage suivant, le village s’arrête à Développement, et le port n’a pas de barques.

L’état se lit aussi en mots, jamais par la couleur seule : « Le village : Reconstruction, 3 sur 5 », avec cinq crans et « Pour la suite : … », dans le panneau de l’île-port, dans la liste des archipels et sur la page de l’archipel en vue simple. Quand il monte pendant une partie, une phrase le dit (« Le village passe à l’état Réactivation (2 sur 5). Le village se réveille : les lanternes du port s’allument. »), lue à voix haute si la lecture automatique est active, avec une cloche.

## Les monuments

Quand les bâtiments sont finis, les blocs s’accumulent. Les **monuments** les emploient : de grands ouvrages classés, **deux par archipel**, chacun sur son **îlot au large** d’une île, dessiné en fantômes bleutés dès qu’on arrive dans l’archipel.

![L'observatoire des baleines sur son îlot, à moitié construit, et son panneau : 60 sur 116 blocs posés.](/captures/monument.jpg)

| Archipel | Monuments |
| --- | --- |
| Premiers Rivages | l’observatoire des baleines (au large de la Tour du lecteur), le grand moulin (au large de la Ferme) |
| Îles Brumeuses | le phare du large (Glacier), le kiosque à musique (Manoir) |
| Anciens Ateliers | le viaduc (Gare), l’amphithéâtre (Théâtre) |
| Îles du Ciel | l’observatoire des étoiles (Textes), le temple de marbre (Belvédère) |

- **Toucher l’îlot** d’un monument dans le monde ouvre son panneau et la caméra y va. On l’ouvre aussi par **Monuments** dans le menu du village (la liste, par archipel, avec l’avancement), par les liens de **Mes blocs**, ou, en vue simple, par le bouton **Monuments** de la page Archipéo.
- Le panneau lit ce qu’est le monument (bouton **Écouter**), montre l’avancement, les blocs qu’il manque avec « tu les as » ou l’île où les gagner, et les boutons **Poser le bloc suivant** et **Poser tout ce que j’ai**.
- Un monument demande **60 à 125 blocs** de plusieurs îles de son archipel ; on le construit à son rythme, il n’ouvre rien et ne bloque rien.
- Fini : sa phrase (lue à voix haute), de l’XP (150 dans les Premiers Rivages, jusqu’à 240 dans les Îles du Ciel), et le premier monument donne le succès **Patrimoine**. Il reste construit dans le monde.
- Le monument d’un archipel pas encore atteint est fermé : son panneau dit de le rejoindre d’abord avec le Bloc-Navire.

Leurs adresses : `#/aventure/monuments` pour la liste, `#/aventure/monument-observatoire` (etc.) pour un monument. Le détail de leurs blocs est dans [Ouvrages et plans](../pedagogie/ouvrages.md#les-monuments).

## Le Bloc-Navire et les archipels

Le **Bloc-Navire** est le véhicule qui mène d’un archipel au suivant. Il se construit comme un plan, au quai de l’île-port, en trois étapes : la **coque et la voile** (sur la Plaine des nombres, pour rejoindre les Îles Brumeuses par la mer), puis le **ballon** (sur le Marché des proportions, pour rejoindre les Anciens Ateliers par les airs), puis le **réacteur** (sur l’Atelier du calcul littéral, pour monter jusqu’aux Îles du Ciel). C’est le même navire qui grandit.

![Le chantier du Bloc-Navire dans le panneau du port : l'étape, l'avancement, les blocs qui manquent et les Gardiens à vaincre.](/captures/navire-chantier.jpg)

![Arrivé dans les Îles Brumeuses : le Marché des proportions, port de l'archipel de 5e.](/captures/collines-du-large.jpg)

- **Les blocs** de chaque étape se gagnent sur les îles de l’archipel (sable, bois, galet et pierre pour la coque ; glace, panneau et toile pour le ballon ; acier, calque et ardoise pour le réacteur). Ils se posent avec le bouton « Poser le bloc suivant » de la section Bloc-Navire, ou en touchant une case bleue du navire au quai. Le navire tangue doucement à quai (il plane dans les Îles du Ciel), son ballon se balance ; quand le panneau du port est ouvert et qu’il reste des cases à poser, la flèche jaune flotte au-dessus du chantier.
- **Le kit arrive avec les Gardiens** : la voile, le haut du ballon et les feux du réacteur ne se gagnent pas. Ils apparaissent quand assez de Gardiens de l’archipel sont vaincus : trois dans les Premiers Rivages, deux dans les Îles Brumeuses, deux dans les Anciens Ateliers. La section dit combien il en manque et lesquels sont les plus proches.
- **Embarquer** : quand toutes les cases sont posées et le kit arrivé, le bouton « Embarquer vers l’archipel de 5e » apparaît. Le voyage se joue en 3D : le bonhomme marche jusqu’au pont par la jetée, le navire s’éloigne (la voile glisse vers le large et laisse son écume ; le ballon s’élève et l’archipel rétrécit ; le réacteur monte presque à la verticale, flamme allumée), un voile blanc passe, l’archipel change, le navire accoste et le bonhomme débarque. Huit secondes en tout. Un toucher n’importe où, Entrée, Espace, Échap ou le bouton « Arriver » terminent le voyage tout de suite. Puis la créature du port d’en face accueille. L’étape rapporte son XP et un succès (Capitaine, Aéronaute, Pilote du ciel).
- **On revient toujours.** Le voyage fait reste fait. Sur tout port, la section Bloc-Navire propose « Revenir en 6e » ou « Repartir vers 5e » pour chaque archipel déjà atteint. Rien ne se perd, rien ne coûte.
- **Le premier voyage** vers un archipel est le seul à se jouer en entier : c’est la récompense du chantier.
- **Ensuite, changer d’archipel est discret** : un fondu blanc d’une demi-seconde, et l’on est arrivé, sur l’île demandée, son panneau ouvert. Une ligne en haut du monde dit où l’on arrive (« Archipel de 5e : les Îles Brumeuses »), puis s’efface. C’est le cas pour les boutons « Revenir en 6e » ou « Repartir vers 5e » du port, « Aller au port » des quatre archipels, un lien vers une île d’un autre archipel (« Mes blocs », pages Français et Maths) et le retour d’un exercice joué ailleurs. Avec « Réduire les animations », sans fondu.
- **Le sélecteur d’archipel** : dès que deux archipels sont atteints, un petit bouton sous le bouton Menu dit où l’on est (« 6e », avec le navire). Le toucher déroule les quatre archipels : ceux déjà atteints s’ouvrent d’un toucher (on arrive à leur port), les autres sont marqués « Fermé », et « Les quatre archipels » dit ce qu’il faut pour y aller. Un toucher ailleurs ou Échap le referme.
- **Une île d’un autre archipel** est visible dans les listes et sur les pages Français et Maths avec la mention « Archipel à rejoindre » ; sa créature dit précisément ce qu’il faut : finir le Bloc-Navire sur tel port, vaincre tant de Gardiens, ou aller d’abord jusqu’à l’archipel d’avant.
- **Les coups de pouce** : quand un Gardien vaincu fait arriver le kit, l’arène le dit avec un bouton « Aller au port » ; quand une mission donne le dernier bloc qui manquait, l’écran de récompense dit « Le Bloc-Navire a tous ses blocs ! » (ou, quand ce sont les blocs de la mission qui servent le navire, sa ligne « À quoi servent tes blocs ») ; quand il est prêt à partir, « Reprendre l’aventure » dans le menu mène au port, et la prochaine destination le dit.
- **À la première arrivée** dans un archipel, c’est la baleine qui accueille : voir [Le mot de la baleine](#le-mot-de-la-baleine).
- **Les sons du voyage** (réglage « Sons dans le village ») : la corne de brume au départ, le vent dans la voile, le brûleur du ballon ou le grondement du réacteur, puis le carillon d’arrivée. Jamais pendant la lecture à voix haute.
- Sous « Réduire les animations », le premier voyage est un écran fixe : le navire dessiné, la phrase lue, le bouton « Arriver ». Aucun son de traversée.

## Les Gardiens

Chaque île a un **Gardien** (le Grand Chêne, le Golem de roche, le Hanneton de bronze…). Il accepte le défi quand **chaque mission de l’île a au moins deux étoiles** ; tant que ce n’est pas le cas, la page de l’île dit ce qui manque.

![Le défi du Golem de roche : sa jauge de résistance, sa phrase, et l'épreuve Filon.](/captures/gardien.jpg)

Le défi enchaîne **deux manches de chaque mission** de l’île, tirées au hasard d’exercices au niveau de l’élève (d’autres questions et d’autres places de réponse à chaque défi), avec leurs écrans et leurs corrections habituels, **sans chrono**. Dans l’arène, le Gardien est une grande créature en cubes qui respire ; sa **jauge de résistance** baisse à chaque épreuve réussie (il n’y a jamais de jauge pour l’élève). Il s’incline quand on réussit, gronde doucement quand on rate, dit une réplique à chaque épreuve, s’écroule quand il est vaincu. Tambour à l’entrée, fanfare à la victoire ; « Réduire les animations » neutralise le tout.

**L’îlot du Gardien** apparaît devant l’île dès que le Gardien accepte le défi : une petite île ronde au sol de son île (herbe, neige, basalte…), bordée de sable au bord de la mer, avec quelques touches de son décor. Au milieu, le Gardien se dresse sur une **arène** pavée de pierre, bordée de galet. Des **pas japonais**, pierres posées dans l’eau, relient l’îlot à la côte de l’île. Dans les archipels en altitude, l’îlot flotte sur sa roche, comme les îles.

**Deux étoiles au défi** : Gardien vaincu. Blocs d’or, XP, succès, et le Gardien devient une statue de pierre sur son îlot, avec un bloc d’or posé sur un socle devant lui. On peut le réaffronter. Vaincre un Gardien ouvre aussi les tunnels et les cols qui partent de son île, et compte pour le kit du Bloc-Navire de l’archipel.

## L’école du village

Sur l’île de l’école de chaque archipel se tient **l’école du village**. On y entre en touchant le bâtiment dans le monde, avec le bouton **École** de la barre du bas, ou avec la ligne « École du village » du panneau de l’île. Le bonhomme marche jusqu’à sa porte et le panneau de l’école s’ouvre à la place de celui de l’île.

![Le panneau de l'École du village : la créature accueille, les blocs gagnés par mission, puis les trois portes.](/captures/ecole.jpg)

La créature de l’île accueille à voix haute. Puis **trois portes**, une par matière : **Français**, **Maths**, **Anglais**. Derrière chaque porte, les mêmes missions que dans la page Missions (Homophones, Lecture, Tables & calcul mental, Fractions, Nombres décimaux, Vocabulaire, Verbes irréguliers), avec leurs étoiles, et un lien vers les îles de la matière. Le bouton **Les trois portes** ramène au choix. Après une mission, son lien de retour **École** ramène à la même porte.

Une mission du portail finie, d’où qu’on l’ait lancée, rapporte des **blocs de l’île de l’école de l’archipel où se tient le bonhomme** (du bois dans les Premiers Rivages, de la toile dans les Îles Brumeuses, du calque dans les Anciens Ateliers, du prisme dans les Îles du Ciel), au même barème qu’une mission d’île : proportionnels au score, jamais zéro dès qu’une réponse est juste, un ou deux de plus avec deux ou trois étoiles, deux de plus la première fois. Le bilan de la mission les montre (« +8 blocs de bois pour le village »). Elle compte aussi pour la série de jours et ses coffres, mais ni pour les étoiles des îles ni pour les Gardiens.

L’adresse de l’école est `#/aventure/ecole` (en vue simple, c’est une page) ; `#/aventure/ecole?porte=maths` l’ouvre directement sur une porte.

## La salle des trophées

À côté de l’école, sur la même île, se tient la **salle des trophées** : un pavillon ouvert devant, quatre colonnes de marbre, un fond de velours rouge, des socles de marbre et un toit au faîte d’or. **Chaque succès gagné y pose un trophée** : un bloc d’or pour les exploits (combos, missions, bâtiments), de cristal pour les rôles, de quartz pour les Gardiens, une lentille pour les voyages du Bloc-Navire. Les trophées remplissent d’abord les socles, puis le faîte, puis un second rang sur les socles, puis le bord du toit : la salle se remplit à mesure qu’on joue, et il y a une place pour chacun des succès.

![Le panneau de la salle des trophées : 9 trophées sur 24, le rôle et l'échelle des rôles.](/captures/trophees.jpg)

On y entre en touchant le pavillon ou un trophée, avec la ligne « Salle des trophées » du panneau de l’île, ou avec **Succès** dans le menu du village. Le bonhomme marche jusqu’à la salle, et son panneau s’ouvre : une phrase lue à voix haute (« 10 trophées sur 23 »…), puis tout le contenu de la page Succès (rôle, chiffres, étoiles par matière, à retravailler, succès). La page Succès reste accessible hors du village (barre du haut, menu, lien en bas du panneau).

L’adresse de la salle est `#/aventure/trophees` ; en vue simple, elle mène à la page Succès.

## Le mot de la baleine

La baleine est la voix de l’archipel. Elle parle rarement, seulement aux **grandes étapes** de l’archipel où se tient le bonhomme, et une seule fois pour chacune :

| Étape | Ce qu’elle dit (exemple) |
| --- | --- |
| La première fois, en 6e, après le tutoriel | « Je suis la baleine. Je passe au large quand tu fais quelque chose de grand. » |
| L’arrivée dans un archipel par le Bloc-Navire | « Le Bloc-Navire a fait sa traversée. Te voilà dans les Îles Brumeuses : six îles, et les mêmes règles. », puis une seconde page sur le navire et le port |
| Le dernier Gardien de l’archipel vaincu | « Tous les Gardiens des Premiers Rivages ont reconnu ton savoir. Je l’ai vu depuis le large. » |
| L’île-port restaurée (ses plans terminés) | « Plaine des nombres est restaurée. Tu avances bien : chaque île restaurée rend l’archipel plus beau. » |
| Le premier ouvrage construit dans l’archipel | « Un chemin s’ouvre vers Mine des lettres. L’archipel s’agrandit. » |

Son mot s’ouvre dans le panneau **Le mot de la baleine**, en bas du monde, un instant après l’étape (jamais pendant une mission, un voyage ou le tutoriel). La caméra cadre l’île concernée, et la baleine passe au large de cette île : elle fait surface, souffle, puis replonge. Il n’y a pas de baleine dans les Îles du Ciel, ni en 2D, et avec « Réduire les animations », le panneau vient seul. Le texte est lu à voix haute si la lecture automatique est active, et le bouton Écouter le relit. L’arrivée a deux pages (**Suivant**, puis **J’ai compris**) ; les autres mots n’en ont qu’une. Échap ferme aussi le panneau. En vue simple, le mot s’affiche en tête de la page Archipéo et des pages d’île.

![Le mot de la baleine en bas du monde : « Un chemin s'ouvre vers Mine des lettres. L'archipel s'agrandit. », avec les boutons Écouter et J'ai compris.](/captures/baleine.jpg)

Quand plusieurs étapes arrivent en même temps, seule la plus grande est dite, dans l’ordre du tableau. La baleine ne répète jamais un mot : ce qui a été dit est noté sur l’appareil, comme les tutoriels, pas dans la partie. Après la mise à jour, les étapes déjà passées sont notées comme dites, sans parler. Le changement d’état du village (« Le village passe à l’état… ») attend que le panneau soit fermé. Les créatures restent les voix de leur île : accueil, répliques, indice d’île fermée.

## Les sons

Les sons sont générés par le code, sans aucun fichier : un « toc » à la pose (et trois poussières claires qui montent doucement de la case), un « pop » au retrait, un refus doux, un carillon de deux notes quand un plan est terminé, jamais pendant la lecture à voix haute. Le réglage « Sons dans le village » les coupe. L’**ambiance** (vent, oiseaux le jour, grillons la nuit) est désactivée par défaut et s’active dans les réglages.

## Les commandes en bref

| Geste | Effet |
| --- | --- |
| Toucher une île ouverte | La caméra s’approche, son panneau s’ouvre, le bonhomme y marche |
| Toucher une île fermée | Sa créature dit l’ouvrage qui y mène |
| Toucher une borne de mission | Lance la mission (ou explique pourquoi elle ne l’est pas) |
| Toucher un ouvrage (construit ou fantôme) | Ouvre l’île qu’il touche, avec sa proposition mise en avant |
| Toucher un fantôme de bâtiment | Pose le bloc attendu |
| Toucher une créature | Ouvre le panneau de son île, où elle accueille ; si ce panneau est déjà ouvert, elle dit une phrase, lue à voix haute |
| Toucher le Bloc-Navire au quai (île-port) | Ouvre le panneau du port sur sa section Bloc-Navire ; une case bleue pose le bloc attendu |
| Bouton « Embarquer » (panneau du port) | Le premier voyage vers l’archipel suivant, joué en entier |
| Bouton « Revenir en … » ou « Repartir vers … », « Aller au port », sélecteur d’archipel (sous le bouton Menu), lien vers une île d’un autre archipel | Un archipel déjà atteint, d’un fondu court |
| Toucher pendant le voyage, Entrée, Espace, Échap, bouton « Arriver » | Le Bloc-Navire arrive tout de suite |
| Toucher le Gardien sur son îlot | Lance le défi |
| Toucher l’école, ou bouton École | Le bonhomme marche jusqu’à sa porte, le panneau de l’école s’ouvre (le bouton le referme) |
| Toucher pendant un trajet | Le bonhomme arrive tout de suite |
| Flèches du clavier | Île voisine dans cette direction |
| Bouton Menu (⏸, en haut à droite) | Le menu du village ; « Reprendre » le referme |
| Toucher la salle des trophées (ou un trophée) | Le bonhomme y marche, le panneau de la salle (le profil et les succès) s’ouvre |
| Bouton Carte | L’archipel vu du ciel, l’état de chaque île, la prochaine destination (« Y aller ») et le bouton « Les quatre archipels » |
| Bouton Blocs | L’inventaire « Mes blocs » : ce que chaque bloc construit, où aller chercher ceux qui manquent |
| Bouton Forcer le jour (la nuit) | Repasse en plein jour |
| Bouton Revoir l’aide | Rejoue le tutoriel de huit bulles (le village, les îles, les missions, le panneau, l’école et la salle des trophées, les ouvrages, le Bloc-Navire, le menu), affichées en bas de l’écran pour laisser voir l’île et la flèche ; le bouton dont parle une bulle (Carte, Blocs, École, Menu) est entouré d’un contour jaune qui clignote |
| Bouton retour du téléphone, dans le village | Ouvre le menu du village ; un second retour quitte (ou revient à la page d’avant) |
