# Fiche de l’univers Périple

Cette fiche est la référence du troisième univers de DysApps, à côté d’Archipéo et de Blocland ([Plusieurs univers](../../docs/conception/univers.md), étape U6). **Périple** est un nom de travail, tout comme « le Carnet d’expédition », le nom de la piste retenue. Le mainteneur l’a choisie le 28 septembre 2026 parmi quatre pistes : la Station des étoiles, les Contes et le Moyen Âge, les Cités antiques et le Carnet d’expédition.

La fiche est tenue par l’agent `consultant-periple`, sous l’autorité du directeur artistique. Le consultant propose et relit ; le directeur artistique valide. Le contenu pédagogique reste au directeur contenu pédagogique.

**Rien n’est construit.** Cet univers est une conception : son code vient à l’étape U6, après l’habillage de Blocland (U5) et les lots 8 et 8b (univers.md, §6). Tout ce qui suit est une proposition, sauf ce que le §9 donne comme décidé.

## 1. Pourquoi cet univers

Un troisième univers est le dernier : univers.md, §6.1, en plafonne le nombre à trois. Il doit donc se distinguer nettement des deux autres sur trois points :

| | Archipéo | Blocland | Périple |
| --- | --- | --- | --- |
| **Le récit** | la mer et les constructions : on restaure un archipel | les blocs : on rebâtit un village en ruine | la terre et le vivant : on complète le carnet d’un premier voyage, et le pays refleurit |
| **Le rendu** | 3D à facettes | cubes texturés, 2D en pixels | 2D en papier découpé et encre |
| **Le Gardien** | une sentinelle qu’on rallume | vaincu, puis statue | un végétal endormi qui refleurit |

Avis consultés avant le choix :

- **Le directeur artistique.** C’est la seule piste distincte des deux autres univers à la fois par le rendu, par le récit et par le Gardien. Elle ne demande aucun combat.
- **Le directeur contenu pédagogique.** Il la classe première. Tous les gabarits de maths s’y transposent (cartes à l’échelle, horaires, trajets, parcelles, relevés). Le vocabulaire est celui du quotidien. Elle ouvre aussi la plus large part des repères culturels d’anglais encore à couvrir.
- **L’artiste technique 3D.** C’est la voie de rendu la moins coûteuse qui reste nettement distincte : environ 0,4 fois R4b et R6 réunis, en repartant de la 2D peinte (R7).

## 2. Le nom

| Proposition | Syllabes | Pour | Contre |
| --- | --- | --- | --- |
| **Périple** (préférence du directeur artistique) | pé-ri-ple | Un vrai mot, « un long voyage », qui porte le voyage autant que le jardin. Il se lit sans piège et la voix française le dit bien. | Un élève de 6e ne le connaît pas forcément : le lexique l’explique la première fois. |
| Herbéo | her-bé-o | Même famille que « Archipéo ». | La même fin fait confondre les deux univers dans les Réglages, et le nom ne dit que le jardin. |
| Terres vives | tèr-viv | Imagé, en mots simples. | Deux mots, avec des lettres muettes. |

Écartés : « Carnet », déjà pris par la mission « Carnet du passeur » ; « Boussole », l’icône de l’état « À explorer » (`src/blocland/world/labelCanvas.ts`) ; « Folio », une collection d’éditeur (rien d’emprunté).

Phrase de l’écran titre (proposition) : « Ton savoir fait refleurir le monde. »

## 3. Le récit et le ton

**Le récit.**

- Il y a longtemps, des voyageurs ont parcouru un pays de fleuves et de lacs. Elle a commencé un grand carnet, avec ses cartes, ses plantes et ses sentiers, et ne l’a jamais fini.
- Le carnet dort à la station, dans une serre en friche. Là où ses pages sont restées blanches, le pays s’est endormi : les sentiers sont effacés, les passerelles tombées, les grands végétaux endormis.
- Chaque réussite donne des blocs, qu’on pose pour rebâtir le pays. Chaque île refleurie complète une page de la carte.
- De la prairie à la montagne, le véhicule mène jusqu’aux terres lointaines, là où le carnet s’arrêtait.
- **Un mot, une chose** (avis du référent dys) : « expédition » désigne déjà les Expéditions de matière du menu. Le récit parle donc du « voyage » ou du « premier voyage », jamais d’une expédition.

**Le ton.**

- Calme, précis et curieux : celui d’un observateur. Des phrases courtes, qui tutoient, avec parfois un peu d’humour.
- Ni « petit explorateur », ni mièvrerie, ni urgence.
- Exemples de répliques : « Le carnet s’arrête ici. La suite, c’est toi qui la complètes. » ; « Le sentier revient sur la carte. Continue quand tu veux. » ; « Une mesure pas tout à fait juste, ça arrive. On la reprend autrement. »
- Le récit ne suggère jamais un geste à faire (dessiner, découper, coller) : pour un élève dyspraxique, ce serait une attente. On dit « compléter », « retrouver », « poser ».

## 4. La figure qui guide

- **Qui.** Une vieille bête qui a fait tout le premier voyage et en connaît les chemins. Elle ne se souvient plus de tout le chemin : c’est pour cela qu’elle attendait l’élève. Elle n’a pas de nom : on dit « la tortue », comme on dit « la baleine » dans Archipéo.
- **L’animal est à trancher** (§9). Le directeur artistique propose une tortue de terre, calme et patiente (DP-12). Or R6 fait de Grimoire une tortue copiste dans Archipéo, d’où un doublon possible. La tortue risque aussi d’être prise pour « l’animal des lents », d’autant que « Le Lièvre et la Tortue » est au programme de lecture proposé (§8) et que le lièvre serait un habitant. Le repli proposé est la cigogne migratrice, plus proche des oiseaux d’Archipéo ; le référent dys la préfère.
- **Quand elle parle.** Aux mêmes grandes étapes que la baleine d’Archipéo (`src/blocland/world/whale.ts`) :
  - l’arrivée en 6e, où elle se présente ;
  - l’arrivée en 5e, en 4e et en 3e ;
  - le dernier Gardien d’un archipel ;
  - l’île-port restaurée ;
  - le premier ouvrage.

  Elle parle une fois par appareil, dans « Le mot de la tortue ».
- **Dans le monde.** Elle se tient au bord de la page, près de la station. Avec « Réduire les animations », elle ne se déplace pas.
- **Garde-fou.** Aucune réplique ne lie la figure à la lenteur de l’élève.

## 5. Le Gardien et la règle de l’univers

- **Ce qu’il est.** Un grand végétal ancien et endormi (arbre, fougère, cactus, liane), gris-vert, les feuilles repliées. Il reste sur son îlot devant l’île, comme dans le jeu commun.
- **Au défi.** Chaque réussite ouvre un bourgeon. La jauge commune, jamais montrée à l’élève, devient la sève qui remonte.
- **Règle du défi** : une erreur ne referme rien et ne montre ni perte ni baisse. Le Gardien s’ouvre après la réponse, jamais pendant la lecture de la consigne, et sans mouvement avec « Réduire les animations ». La mécanique commune (`src/blocland/bossCore.ts`) est à vérifier sur ce point à U6.
- **Défi réussi.** Le Gardien se déplie, reprend ses couleurs et fleurit. Une gousse dorée se pose à ses pieds : c’est le bloc d’or décoratif du jeu commun.
- **Ensuite.** Il reste en fleurs, visible de loin et sur la Carte. On peut refaire le défi pour « le revoir fleurir ».
- **La règle propre à Périple** (proposition, l’équivalent de DP-01 et DP-02 pour Archipéo) : **on réveille, on ne combat pas ; on observe sans arracher.** Rien ne se coupe, rien ne se cueille, aucun Gardien n’est « vaincu ».

## 6. Ce que deviennent les choses communes

Les identifiants, les cases des plans, le relief de marche et la progression ne changent pas (univers.md, §4). Seuls les noms, le récit et le dessin changent.

| Chose commune | Dans Périple |
| --- | --- |
| Région de 6e | **Les Prairies** : les îles d’un grand fleuve, avec des herbes hautes, des ruches et des gués |
| Région de 5e | **Les Forêts profondes** : les îles d’un lac en forêt, avec des fougères, de grands arbres et des clairières |
| Région de 4e | **Les Montagnes** : les îlots d’un lac d’altitude, avec des éboulis, des gorges et des cascades |
| Région de 3e | **Les Terres lointaines** : les côtes au bout du voyage, avec des baobabs, des dunes, la mer et une vue sur les régions précédentes |
| Île | Reste « île » : une terre entourée d’eau (fleuve, lac ou mer), sur le relief de marche commun |
| Village | **La station** (station de jardin), sur l’île-port |
| Les cinq états du village | En friche (Abandonné) ; Réveil (Réactivation : le poêle de la serre et les lanternes rallumés) ; Premières pousses (Reconstruction) ; En fleurs (Développement) ; Station ouverte (Port : l’aire d’envol est prête) |
| Véhicule | **La montgolfière**, en trois étapes : l’enveloppe (de la 6e à la 5e), le brûleur (de la 5e à la 4e), les instruments de relevé, c’est-à-dire la longue-vue, le compas et la carte (de la 4e à la 3e). Elle ne change pas les cases du plan partagé ; après le lot 8, ces cases sont celles d’un navire maritime et doivent se dessiner en nacelle et en enveloppe. Repli : une barque à voile de fleuve. |
| Ouvrages | Le pont devient une passerelle, le bac un radeau à corde, le sentier un sentier balisé, l’escalier taillé un escalier de rondins, le tunnel un passage de grotte, le col un pont de lianes |
| Monuments (huit, deux par région) | 6e : le rucher et le cadran solaire. 5e : l’herbier (des planches dessinées, rien de cueilli) et la tour des cimes. 4e : le jardin suspendu et le refuge. 3e : la grande serre et le jardin des voyages |
| Blocs | Le mot « bloc » reste. Dans le récit, ce sont des **blocs de papier**, comme un bloc-notes : une réussite détache un bloc d’une matière (bois, pierre, verre…), qu’on pose. Tout le monde est fait de ces blocs, si bien que le mot et le dessin se tiennent. |
| Créatures des îles | **Les habitants** : un animal de la région par île (lièvre, hérisson, écureuil, marmotte, fennec…). Même rôle : il donne la mission, et on reconstruit son abri. |
| États d’île sur la Carte | Fermée, À explorer, En chantier : gardés, pour changer le moins de mots possible (univers.md, §6.1). « Restaurée » devient **Refleurie**. « Dans la brume » devient **Pas encore dessinée** : la région est esquissée, sans couleur. |
| Rôles (mêmes seuils) | Proposition du directeur artistique : Voyageur (niveau 1), Cartographe (4), Naturaliste (10), Guide (18), Chef d’expédition (28). Le référent dys les trouve longs, et « expédition » a déjà un sens dans le menu : des noms plus courts sont à proposer (§9). |
| Expéditions | Français : « Notes et récits ». Maths : « Mesures et relevés ». Anglais : « Lettres de voyage ». |

**Règle de nommage des 28 îles, des Gardiens et des habitants**, à appliquer plus tard :

- **Une île** : un lieu du paysage de sa région, puis la notion (« Le Pré des sons »). Quatre mots au plus, trois syllabes au plus par mot. Aucun nom propre, aucun nom déjà pris par les îles communes ou par Archipéo.
- **Un Gardien** : un végétal de la région, avec un adjectif simple (« le Vieux Saule », « la Grande Fougère »). Pas de chêne : le Grand Chêne est à Blocland.
- **Un habitant** : un prénom de deux syllabes simples, sans homophone avec les 28 créatures de Blocland.
- **Pour tous** : chaque nom est dit par la voix française et découpé en syllabes avant d’être validé.

## 7. Le monde

**La vue principale est en 2D, en papier découpé.**

- Chaque île est une pile de couches de papier, une couche par niveau du relief de marche. Les courbes de niveau montrent les cases, et le relief commun ne change pas.
- Les constructions, les habitants et les Gardiens sont des silhouettes découpées, dressées comme dans un livre animé.
- Un contour d’encre brun-noir, d’épaisseur constante, borde seulement les formes.
- Une ombre portée fixe tombe dans la même direction partout.
- **Un repère de case net** montre la case touchée : les courbes de niveau fines n’y suffisent pas (dyspraxie, univers.md §6.1).
- La liste des îles reste le secours commun (univers.md, §2). Qu’un univers n’ait pas de 3D demande une décision du mainteneur (§9).

**La palette, en contrastes francs** (jamais de pastel partout) :

| Région | Couleurs |
| --- | --- |
| Prairies | vert franc, jaune colza, bleu fleuve |
| Forêts profondes | vert sapin profond, mousse, rouge des champignons, trouées dorées |
| Montagnes | gris ardoise, bleu glacier, blanc neige, roux des mélèzes |
| Terres lointaines | ocre, terre de Sienne, turquoise, pourpre du couchant |

Le papier de fond est ivoire franc, jamais du beige sur du beige.

**Le jour et la nuit.** Le jour, une lumière nette. La nuit, du papier bleu nuit, une lune découpée, des lanternes et des lucioles fixes. La nuit reste claire, comme dans le jeu commun. Le contour d’encre brun-noir se voit mal sur le bleu nuit : la nuit, il s’éclaircit.

**Les thèmes des Réglages.** Le monde se lit aussi en thème Nuit et en Contraste élevé : en Contraste élevé, les couches gardent des aplats francs et le contour s’épaissit. À écrire en détail avec l’artiste technique 3D et le référent dys à U6.

**Interdit :**

- un grain, une trame, des lignes ou un quadrillage derrière un texte : un texte à lire se pose toujours sur un fond uni et contrasté (DA-02, DP-06) ;
- l’écriture manuscrite et les étiquettes collées dans le décor : la police de l’interface reste la même, et rien n’est à lire dans le monde ;
- le scintillement ;
- les taches d’encre, les ratures et les mots barrés, qui font penser à une faute ;
- le papier vieilli sépia, qui écrase les contrastes ;
- les pages qui se tournent : un changement de page est un simple changement d’image ;
- tout geste de découpage ou de collage demandé à l’élève (dyspraxie).

**Le coût** (avis de l’artiste technique 3D). Environ 0,3 à 0,5 fois R4b et R6 réunis : un nouveau peintre sur la base de R7, plus des vignettes dessinées par le code.

- **Réutilisé :** la projection oblique et la surface (`src/blocland/pixel/oblique.ts`, `surface.ts`), le modèle de `painted.ts` (palette pure, paliers de lumière, cache par tronçon) et le contrat de la vue (`world/view.ts`).
- **Écarté :** le SVG pour le terrain, qui produirait des milliers de nœuds et un toucher moins sûr.
- **À surveiller :** le remplissage du Canvas 2D et la taille des caches sur les vieilles tablettes. `WorldCanvas2D.tsx` devra être découpé en peintres par univers, après R6.

## 8. L’habillage pédagogique

Il suit univers.md, §4.2 : mêmes cotes, même calcul, même « ? », mêmes clés ; aucun nom propre dans un énoncé ; pas plus de mots, pas de mot plus long. Le directeur contenu pédagogique écrit, le consultant relit l’univers, le référent dys relit tout.

### Les problèmes situés (`src/blocland/exercises/problemes.ts`)

| Générateur | Région | Gabarit | Objet du schéma |
| --- | --- | --- | --- |
| `plaine-passeur` (longueur totale, longueur restante) | Prairies | « Le sentier a deux parties : a m et b m. Quelle est la longueur du sentier ? » | un sentier tracé au crayon, ses parties bout à bout |
| `plaine-passeur` (tour et largeur du quai) | Prairies | « L’enclos est un rectangle de L m sur l m. Quel est son périmètre ? » | un enclos à piquets vu de dessus |
| `plaine-passeur` (durées, heure d’arrivée) | Prairies | « L’équipe part à X et arrive à Y. Combien de temps dure la marche ? » | les deux horloges de la scène, un sac à dos sur le sentier |
| `marche-etals-3` (ratio) | Forêts profondes | « On partage 60 kg de riz entre les équipes A et B dans le ratio 2 : 3… » | une rangée de sacs, un sac par part |
| `marche-balances-3` (échelle) | Forêts profondes | « Sur la carte, 1 cm représente 500 m… » | la carte du carnet, deux croix, une règle graduée |
| `belvedere-pythagore-3` (mât) | Terres lointaines | « Une corde tendue va du haut d’un poteau de h m jusqu’au sol… » | la tente et son poteau, l’angle droit marqué |

Deux autres générateurs se transposent aussi. Les vitesses de `marche-balances-4` passent au vélo, jamais à la marche à pied : 20 km/h à pied serait absurde. `belvedere-thales-2` devient « un bâton et une colonne », sans arbre (son sommet et sa verticale font douter) ni pyramide (son ombre ne part pas du pied).

**Un point à trancher avant U5, pour tous les univers.** Les règles et les corrections de ces générateurs nomment le décor : le pont, le navire, le mât, le bateau (`RULE_PONT`, `RULE_RATIO`, `RULE_MAT`, `RULE_OMBRE`, `ruleVitesse`). Or univers.md, §4.2, les fige. Deux voies sont possibles :

- une règle neutre, comme « Une longueur en plusieurs parties » ;
- un nom de décor substituable, que vérifie le test d’équivalence.

Le choix revient au directeur artistique et au mainteneur, puisqu’il change le texte du §4.2.

### Les phrases de français et d’anglais

- **Mots autorisés** (une ou deux syllabes, faciles à dessiner) :
  - animaux communs : renard, lapin, abeille, ours, chèvre / fox, bee, bird, goat ;
  - plantes : herbe, feuille, fleur, arbre / grass, leaf, tree ;
  - météo : pluie, neige, nuage / wind, snow ;
  - matériel : carnet, crayon, carte, sac, gourde, loupe, tente, corde / map, bag, tent, rope ;
  - lieux sans nom propre : sentier, lac, rivière, sommet, cabane / hill, lake, river ;
  - actions : marcher, dessiner, noter, grimper, camper / walk, draw, climb.
- **Mots bannis :**
  - les noms savants et latins ;
  - les noms de lieux réels et d’explorateurs ;
  - le vocabulaire colonial (indigène, sauvage, tribu, porteur, « découvrir » une terre habitée) ;
  - la capture et la mise à mort (piéger, épingler, empailler, chasser) ;
  - le danger (chute, avalanche, morsure, se perdre) ;
  - les homophones de décor hors d’une mission d’homophones : cerf, pin, chêne, col, mer, ver, vent, loup, gare ; deer, hare, sea, flower, wood, bear, rain.
- Le ratio « 2 : 3 » est dit en mots par la voix (à vérifier avec le directeur contenu pédagogique).

### Les textes de lecture

Les textes sont du domaine public. Ce sont des extraits adaptés, avec les mots difficiles donnés avant le texte. Les textes français sont des originaux ; les textes anglais se lisent en anglais. Toute traduction se fait en interne, à partir de l’original. Les dates de mort sont à contrôler à la BnF avant d’écrire un texte.

| Texte | Auteur (mort en) | Classe | Lien au programme |
| --- | --- | --- | --- |
| *Souvenirs entomologiques*, « La Cigale » | Jean-Henri Fabre (1915) | 6e | `c3.fr.lecture.explicite`, `c3.fr.lecture.genres` |
| « Le Lièvre et la Tortue » (*Fables*, VI, 10) | La Fontaine (1695) | 6e | `c3.fr.lecture.genres` |
| *The Owl and the Pussy-cat* | Edward Lear (1888) | 6e | `c3.en.culture.imaginaire`, `c3.en.lire.textes-courts` |
| *Just So Stories*, « The Elephant’s Child » | Rudyard Kipling (1936) | 6e-5e | `c3.en.culture.imaginaire` |
| *Rip Van Winkle* | Washington Irving (1859) | 5e | `c3.en.culture.imaginaire`, `c4.en.culture.voyages-rencontres` |
| *My First Summer in the Sierra* | John Muir (1914) | 5e | `c4.en.culture.voyages-rencontres`, `c4.en.culture.ecole-societe` |
| *Voyages en zigzag* | Rodolphe Töpffer (1846) | 4e | `c4.fr.lecture.genres-epoques` |
| *Voyage au centre de la Terre* | Jules Verne (1905) | 4e | `c4.fr.lecture.controle` |
| *Travels with a Donkey in the Cévennes* | Robert Louis Stevenson (1894) | 4e | `c4.en.culture.voyages-rencontres` |
| *The Call of the Wild* | Jack London (1916) | 3e | `c4.en.culture.voyages-rencontres` |

- **Les passages sont à choisir avec soin.** Chez Kipling, la « Limpopo » plutôt que les contes au vocabulaire raciste. Chez Lear, « runcible » est un mot inventé. Chez Irving, l’alcool est à éviter, et chez London, les combats de chiens.
- **Les traductions à éviter.** Celle des *Histoires comme ça* par Robert d’Humières, mort pour la France : ses droits sont prolongés. Celle du *Voyage d’un naturaliste* de Darwin, dont le traducteur a une date de mort incertaine.
- **Rien d’emprunté.** On ne reprend pas les images d’origine.

### L’ordre de travail

Tout se fait à l’étape U6, après U5 et les lots 8 et 8b :

1. la décision sur les règles et les corrections qui nomment le décor ;
2. les problèmes situés, avec les tests d’équivalence ;
3. les textes en anglais, qui couvrent des repères encore exclus, puis les textes en français ;
4. les phrases de français et d’anglais, région par région, en commençant par les Prairies.

La région des Montagnes (4e) n’a aucun problème situé aujourd’hui. C’est une piste pour un lot de contenu, pas une question d’univers.

## 9. Les décisions et les questions ouvertes

**Décidé par le mainteneur** (28 septembre 2026) : la piste du Carnet d’expédition, en 2D papier découpé.

**À trancher par le mainteneur :**

1. Le nom : Périple, Herbéo ou Terres vives ?
2. Une vue principale en 2D, sans 3D : est-ce accepté ? Univers.md, §2, fait de la 2D un secours ; ici, elle serait la vue de l’univers.
3. La figure qui guide : la tortue, en doublon possible avec Grimoire (R6), ou la cigogne ?
4. La montgolfière, ou la barque de fleuve si le plan partagé du lot 8 ne s’y prête pas ?
5. « Refleurie » à la place de « Restaurée », ou tous les mots d’état gardés ? Avis du référent dys : garder tous les mots d’état communs (univers.md, §6.1) ; « Pas encore dessinée » est long et négatif.
6. La règle « on réveille, on ne combat pas ; on observe sans arracher » : est-elle actée ?
7. « Le carnet » est au cœur du récit, alors que « Carnet » est écarté comme nom parce que la mission « Carnet du passeur » le prend : accepter ce doublon, ou trouver un autre mot pour le récit ?
8. Les rôles : des noms plus courts que « Naturaliste » et « Chef d’expédition », à proposer par le consultant et le directeur artistique.

**Les risques :**

- **Le carnet d’école.** « Compléter un carnet » peut faire penser à des devoirs. Le carnet est une carte de voyage, jamais une page à remplir, et il ne montre jamais de cases vides qui culpabilisent (DP-12).
- **Le contraste.** L’esthétique du vieux carnet tire vers le beige sur beige. Le référent dys relit donc les captures en Contraste élevé.
- **La surcharge.** Annotations en marge, flèches, timbres, tickets : c’est trop. Une seule chose à lire à la fois.
- **La proximité avec Archipéo.** Les deux univers restaurent un pays et relèvent un village. La différence doit rester nette : la terre et le vivant ici, la mer et les constructions là-bas.
- **Les Terres lointaines.** Le risque est l’exotisme et les stéréotypes. On montre des paysages, jamais des peuples « découverts ».
- **Les espèces.** Aucune ne se reconnaît à la couleur seule (DP-08), et aucune ne porte un nom long.
- **Le coût et le calendrier.** Rien avant U6.

## 10. Le lexique

Dix mots au plus (univers.md, §6.1), chacun expliqué et lu à voix haute la première fois : Périple, station, friche, serre, refleurir, naturaliste, passerelle, montgolfière, brûleur, herbier.

Le compte est à refaire : « cartographe », « gousse », « sève », « relevé », « gué » et « éboulis » apparaissent aussi dans la fiche. Chaque mot en trop sort du récit ou remplace un mot de la liste.
