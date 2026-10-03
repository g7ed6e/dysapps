# GD-7 : Des chemins au choix, le port en étoile

**État** : Décidée le 2 octobre 2026 (la piste, ce que fait une demande, combien de demandes à la fois) ; le détail est à cadrer dans le lot, voir « Le coût »
**Portée** : Commun (les noms, les voix et le dessin restent propres à chaque univers)

## Le constat

L’étape 2 de [GD-4](GD-4.md) veut des chemins au choix. Le graphe des ouvrages n’est pas une seule chaîne (en 6e, la première île ouvre déjà trois directions), mais l’élève le vit comme une file (`src/blocland/world/archipelago.ts`, relu par le directeur artistique) :

1. **Une séance paie un ouvrage** : une première mission rapporte 5 à 7 blocs, un ouvrage en coûte 3 à 7 ; on ouvre une île à la fois, presque toujours la moins chère.
2. **La suggestion est la même pour tous les élèves.**
3. **Des liaisons ont une condition** : le tunnel et le col demandent le défi du Gardien de l’île de départ réussi.
4. **Les îles du bout ne s’atteignent que par celle d’avant.**

## La proposition

1. **Le port en étoile.** Depuis le port, un ouvrage mène directement à chaque île de la classe (bac, pont ou sentier selon la géographie), en plus des liaisons d’aujourd’hui, qui restent en raccourcis. Les ouvrages ouvrent toujours les îles, avec la fête d’aujourd’hui et le geste du bâtisseur, mais il y a toujours trois îles au choix. Les prix sont aplanis pour qu’une séance paie un ouvrage, quelle que soit la direction. Les îles de langue vivante restent en bout de chemin, sans dépendance.
2. **Plus aucun Gardien comme condition d’une liaison.** Le tunnel et le col ne demandent plus que des blocs. Les Gardiens gardent leur défi, achèvent leur île comme aujourd’hui et comptent toujours pour le départ du navire (3, puis 2, puis 2) ; dans Blocland, le Gardien reste une statue, dans Archipéo la sentinelle se rallume. L’escalier taillé garde sa condition, la première mission réussie de l’île de départ ([GD-6](GD-6.md)), qui ne fait pas attendre.
3. **Une seule suggestion, qui suit l’élève**, par le repère qui existe (« Prochaine destination », « Y aller »), à la même place et avec les mêmes mots en 3D et en vue simple ; quand la suggestion est une demande, le repère mène chez l’habitant. L’ordre : le navire prêt à partir ; sinon l’île où l’élève est allé de lui-même ; sinon une demande prête à livrer ; sinon une île ouverte pas commencée ; sinon l’ouvrage payable qui mène à l’île de la matière la moins **jouée**, jamais la moins réussie (la mesure : les missions réussies dans la classe, par matière, français, maths, anglais ; la LV2 hors du calcul ; à égalité, l’ordre de `docs/contenu/archipel.md`). La suggestion ne change pas pendant la séance tant que l’élève n’a rien fait, et se dit à voix haute avec sa raison, en une phrase courte. Les deux autres ouvrages payables restent visibles en fantôme, sans marque. Deux élèves de la même classe n’ont pas le même archipel après trois séances.
4. **Les demandes entre habitants posent un petit ouvrage.** L’habitant (la créature, dans Blocland) d’une île ouverte où l’élève a joué demande ; jamais un Gardien ni une sentinelle. Il demande le bloc d’une autre île ou le bloc assemblé de l’archipel ([GD-2](archives/GD-2.md)). La demande livrée pose un petit ouvrage chez lui (la « créature qui commande un ouvrage » de GD-4) ; elle n’ouvre ni ne ferme jamais une île. Elle donne une raison d’aller sur une île qu’on n’aurait pas choisie, et d’aller assembler avant les monuments.
5. **Trois demandes ouvertes au plus**, une seule mise en avant comme suggestion ; une nouvelle arrive quand une est livrée. Elles sont dans une liste toujours au même endroit, une section fixe nommée pareil dans le panneau d’île, le menu et la page des îles de la vue simple, chacune avec l’habitant, l’objet demandé en icône et en nom, et une phrase lue à voix haute qui dit le lieu et le geste (« joue une mission de la Mine »), jamais une notion ni une note. Le geste « Livrer » et ce que veut dire ignorer une demande (sans bouton, sans perte) sont à fixer dans le lot.

## Ce qui ne bouge pas

- **Les règles dys** : trois choix au plus en même temps, un seul mis en avant ; sur la Carte et dans le monde, un seul élément mis en avant à la fois (les îles, le navire et les demandes ne s’affichent pas tous comme des choix au même moment), la liste des demandes restant dans les panneaux ; l’ouvrage suggéré se distingue des autres fantômes par une forme ou une icône, jamais par la couleur seule, et un fantôme d’ouvrage se distingue d’un fantôme de plan ; la phrase d’une demande se relance, et l’objet porte le même nom partout (liste, Mes blocs, réplique) ; la liste de trois demandes tient en OpenDyslexic à la plus grande taille, en 800 × 1280 et sur téléphone, sans texte coupé ni défilement de côté, avec des cibles d’au moins 48 px, au toucher comme au clavier ; une longue liaison ne donne pas de long trajet de caméra, et le trajet se passe toujours ; la fête d’un petit ouvrage ne passe jamais sur une consigne ni sur une réplique ; une demande n’a ni délai ni échéance, ne disparaît pas, ne rend personne triste, ne se « rate » pas, et la refuser ne coûte rien ; rien ne bloque, aucune île ne se ferme selon la maîtrise, un manque se dit avec ce qu’il faut faire ; pas de chrono ni de classement ; rien à lire dans le monde : l’habitant qui demande fait le même signe lent que la créature qui se souvient, sans clignoter, et la vue simple montre le même signe et la même liste ; « demande » est expliqué la première fois.
- **Le directeur artistique** : aucune ressource nouvelle, seulement le bloc d’île et le bloc assemblé (GD-5) ; aucune jauge.
- **GD-6** : une partie du bâtiment par mission, posée dès la première réussite ; ouvrages, ponts, monuments et navire restent un geste de l’élève.
- **La première minute** : en 6e, deux îles vertes au départ (une de français et une de maths ; le directeur du contenu propose la Forêt et la Plaine), puis l’éventail dès que la première mission a rempli le stock. L’ordre des missions dans une île ne change pas (GD-6) ; le programme ne fixe pas d’ordre entre les îles d’une classe.
- **Les univers** ([Plusieurs univers](../../univers/univers.md), §4) : les règles sont communes, chaque univers habille les liaisons, les demandes et les petits ouvrages (voir plus bas).
- **La sauvegarde et les identifiants** : jamais touchés. Les liaisons d’aujourd’hui gardent leurs identifiants ; les nouvelles en ont de nouveaux ; une demande livrée pose des cases de plan, retrouvées sans champ nouveau.

### Dans Blocland

Aucune forme nouvelle : les liaisons du port sont des ouvrages déjà connus (bac de préférence, pont, sentier), en cubes et sur la grille, dans le plafond (80 000 triangles, 240 appels), de jour comme de nuit ; les empreintes et les captures sont refaites et relues comme une correction voulue. Les petits ouvrages sont des cubes posés sur les cases d’un plan, dans les matières existantes, avec une forme d’`architect.ts` ou un objet du même genre (puits, étal, lanterne en blocs) ; le consultant propose une liste par île au directeur artistique. Le signe de la créature est un saut ou une rotation par crans, sans halo. Au lot : le cadrage de Blocland (« Les ouvrages ») et sa fiche sont mis à jour par le consultant.

### Dans Archipéo

Les liaisons du port, en 3D d’abord ; dans le monde en réseau (lots 8 et 8b), l’étoile se lira sur le réseau. Avant le lot 8, les liaisons des Îles du Ciel sont des passerelles, jamais un bac (un mot change avec ce qu’il décrit). Le plafond est de 60 000 triangles et 40 appels par archipel tout construit : liaisons et petits ouvrages se fondent dans le maillage de la construction (R5), sans appel de plus par ouvrage. Les petits ouvrages sont des objets du village qu’on répare (ponton, lanterne, filet), proposition du consultant à valider par le directeur artistique ; ils ne comptent pas dans les cinq états du village.

## Le coût

Un lot à part, après ceux de GD-6. À cadrer dans le lot :

- **Les liaisons** : de nouvelles liaisons depuis chaque port, parfois longues ; l’artiste technique 3D dit lesquelles se dessinent (un bac est sans doute moins cher qu’un long pont) et ce qu’elles coûtent, de jour et de nuit, dans le plafond de chaque univers. Dans le monde en réseau d’Archipéo (lots 8 et 8b), l’étoile se lit naturellement.
- **Le jeu** : les conditions de Gardien retirées, les prix revus, la prochaine destination et la suggestion revues (`world/destination.ts`).
- **Les demandes** : une par île au moins, dans une section « ## Les demandes » de `docs/contenu/<île>.md`, sur le modèle de « ## Les plans », lue par `npm run contenu`, documentée dans `docs/contenu/README.md` et couverte par un test ; dire si le texte est commun aux univers (noms pris dans les univers, comme `assemblage.md`) ou écrit pour chacun ; la forme de chaque petit ouvrage dans le code.
- **La Carte** : comment elle montre l’étoile (liaisons ouvertes, payables, raccourcis), avec l’état de chaque île en mots, et si elle porte les demandes.
- **L’ordre des lots** : GD-7 avant ou après le lot 8 d’Archipéo, à dire au cadrage.
- **Les textes** : le manuel (les ouvrages, la Carte), Mes blocs, `docs/ux-ui/bonnes-pratiques.md`, les mots de chaque univers.
- **Les captures** : la Carte avec trois îles et trois demandes, sur tablette et téléphone, à la plus grande taille et en vue simple, relues par le référent dys et le consultant UX UI.
- Sauvegarde non touchée.

## Les avis

- Directeur artistique : a écrit les trois pistes et recommandé le port en étoile.
- Référent dys : À ajuster, repris (ses conditions dans « Ce qui ne bouge pas » ; captures à relire au lot).
- Consultant UX UI : À ajuster, repris (le repère « Prochaine destination », la liste au même endroit, la vue simple, la Carte ; captures au lot).
- Consultant de Blocland : À ajuster, repris (des mots neutres, aucune forme nouvelle, les petits ouvrages en cubes, le signe par crans).
- Consultant d’Archipéo : À ajuster, repris (« achèvent » et « réussi », passerelles avant le lot 8, plafond, petits ouvrages réparés, jamais une sentinelle qui demande).
- Directeur du contenu pédagogique : À ajuster, repris (« la moins jouée » et sa mesure, les deux îles du départ, le format des demandes).

## La décision

2 octobre 2026, mainteneur : « ok pour réponse A » (le port en étoile, sans Gardien comme condition d’une liaison) ; puis « Un petit ouvrage » et « Trois au plus », choisis un par un.
