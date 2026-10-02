# GD-7 : Des chemins au choix, le port en étoile

**État** : Décidée le 2 octobre 2026 (la piste, ce que fait une demande, combien de demandes à la fois) ; le détail est à cadrer dans le lot, voir « Le coût »
**Portée** : Commun (les noms, les voix et le dessin restent propres à chaque univers)

## Le constat

L’étape 2 de [GD-4](GD-4.md) veut des chemins au choix. Le graphe des ouvrages n’est pas une seule chaîne (en 6e, la première île ouvre déjà trois directions), mais l’élève le vit comme une file (`src/blocland/world/archipelago.ts`, relu par le directeur artistique) :

1. **Une séance paie un ouvrage** : une première mission rapporte 5 à 7 blocs, un ouvrage en coûte 3 à 7 ; on ouvre une île à la fois, presque toujours la moins chère.
2. **La suggestion est la même pour tous les élèves.**
3. **Des liaisons ont une condition** : le tunnel et le col demandent le Gardien de l’île de départ vaincu.
4. **Les îles du bout ne s’atteignent que par celle d’avant.**

## La proposition

1. **Le port en étoile.** Depuis le port, un ouvrage mène directement à chaque île de la classe (bac, pont ou sentier selon la géographie), en plus des liaisons d’aujourd’hui, qui restent en raccourcis. Les ouvrages ouvrent toujours les îles, avec la fête d’aujourd’hui et le geste du bâtisseur, mais il y a toujours trois îles au choix. Les prix sont aplanis pour qu’une séance paie un ouvrage, quelle que soit la direction. Les îles de langue vivante restent en bout de chemin, sans dépendance.
2. **Plus aucun Gardien comme condition d’une liaison.** Le tunnel et le col ne demandent plus que des blocs. Les Gardiens gardent leur défi, ferment leur île comme aujourd’hui et comptent toujours pour le départ du navire (3, puis 2, puis 2). L’escalier taillé garde sa condition, la première mission réussie de l’île de départ ([GD-6](GD-6.md)), qui ne fait pas attendre.
3. **Une seule suggestion, qui suit l’élève** : le navire prêt à partir ; sinon l’île où l’élève est allé de lui-même ; sinon une demande prête à livrer ; sinon une île ouverte pas commencée ; sinon l’ouvrage payable qui mène à l’île de la matière la moins jouée (à relire avec le directeur du contenu pédagogique). Les deux autres ouvrages payables restent visibles en fantôme, sans marque. Deux élèves de la même classe n’ont pas le même archipel après trois séances.
4. **Les demandes entre habitants posent un petit ouvrage.** Un habitant d’une île restaurée ou en chantier demande le bloc d’une autre île ou le bloc assemblé de l’archipel ([GD-2](GD-2.md)). La demande livrée pose un petit ouvrage chez lui (la « créature qui commande un ouvrage » de GD-4) ; elle n’ouvre ni ne ferme jamais une île. Elle donne une raison d’aller sur une île qu’on n’aurait pas choisie, et d’aller assembler avant les monuments.
5. **Trois demandes ouvertes au plus**, une seule mise en avant comme suggestion ; une nouvelle arrive quand une est livrée. Elles sont dans une liste toujours visible (le panneau d’île et le menu), chacune avec l’habitant, l’objet demandé en icône et en nom, et une phrase lue à voix haute qui dit où le gagner.

## Ce qui ne bouge pas

- **Les règles dys** : trois choix au plus en même temps, un seul mis en avant ; une demande n’a ni délai ni échéance, ne disparaît pas, ne rend personne triste, ne se « rate » pas, et la refuser ne coûte rien ; rien ne bloque, aucune île ne se ferme selon la maîtrise, un manque se dit avec ce qu’il faut faire ; pas de chrono ni de classement ; rien à lire dans le monde : l’habitant qui demande fait le même signe lent que la créature qui se souvient, sans clignoter, et la vue simple montre le même signe et la même liste ; « demande » est expliqué la première fois.
- **Le directeur artistique** : aucune ressource nouvelle, seulement le bloc d’île et le bloc assemblé (GD-5) ; aucune jauge.
- **GD-6** : une partie du bâtiment par mission, posée dès la première réussite ; ouvrages, ponts, monuments et navire restent un geste de l’élève.
- **La première minute** : en 6e, deux îles vertes au départ, puis l’éventail dès que la première mission a rempli le stock.
- **Les univers** ([Plusieurs univers](../../univers/univers.md), §4) : les règles sont communes, chaque univers habille les liaisons, les demandes et les petits ouvrages.
- **La sauvegarde et les identifiants** : jamais touchés. Les liaisons d’aujourd’hui gardent leurs identifiants ; les nouvelles en ont de nouveaux ; une demande livrée pose des cases de plan, retrouvées sans champ nouveau.

## Le coût

Un lot à part, après ceux de GD-6. À cadrer dans le lot :

- **Les liaisons** : de nouvelles liaisons depuis chaque port, parfois longues ; l’artiste technique 3D dit lesquelles se dessinent (un bac est sans doute moins cher qu’un long pont) et ce qu’elles coûtent, de jour et de nuit, dans le plafond de chaque univers. Dans le monde en réseau d’Archipéo (lots 8 et 8b), l’étoile se lit naturellement.
- **Le jeu** : les conditions de Gardien retirées, les prix revus, la prochaine destination et la suggestion revues (`world/destination.ts`).
- **Les demandes** : une par île au moins, écrites dans `docs/contenu/<île>.md` ; la forme de chaque petit ouvrage dans le code.
- **Les textes** : le manuel (les ouvrages, la Carte), Mes blocs, les mots de chaque univers.
- Sauvegarde non touchée.

## Les avis

- Directeur artistique : a écrit les trois pistes et recommandé le port en étoile.
- Référent dys, consultant UX UI, consultants de Blocland et d’Archipéo, directeur du contenu pédagogique : à recueillir sur cette fiche.

## La décision

2 octobre 2026, mainteneur : « ok pour réponse A » (le port en étoile, sans Gardien comme condition d’une liaison) ; puis « Un petit ouvrage » et « Trois au plus », choisis un par un.
