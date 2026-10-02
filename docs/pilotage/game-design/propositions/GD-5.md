# GD-5 : Allier le jeu et l’apprentissage, trois modèles de boucle

**État** : Décidée le 2 octobre 2026 (A tout de suite, B petit à petit, C pour les grands ; le même jour, un seul mot « mission » et l’île reconstruite qui devient fournisseur) ; chaque modèle aura sa propre fiche avant d’être construit
**Portée** : Commun ; la fiche ne nomme aucun univers, chacun habille les demandes, les spécialités, les outils et les projets à sa manière

Le mainteneur, le 2 octobre 2026 : « Fais-moi des propositions pour allier jeu à apprentissage en poursuivant des quêtes / missions et construire un monde. Essaie d’abstraire l’univers. » Cette fiche prolonge [GD-4](GD-4.md) (le monde ouvert au centre) : les mots restent généraux (le monde, les lieux, les habitants, les gardiens, la ressource, les ouvrages).

## Le constat

Aujourd'hui, l'apprentissage et le jeu sont **côte à côte** : on fait une quête (un exercice), on gagne une ressource, puis on construit. L'exercice ne change rien au monde par lui-même, et ce que l'élève sait ne change rien à ce qu'il peut faire dans le monde. La ressource relie les deux, mais comme une monnaie.

Les jeux qui font apprendre sans ennuyer ont souvent l'une de ces trois choses :

- le monde **a besoin** de l'élève ;
- ce que l'élève sait lui **permet d'agir** dans le monde ;
- l'élève **mène un projet** à lui, sur la durée.

Chaque modèle ci-dessous part de l'une de ces trois choses.

**Les mots** (mainteneur, 2 octobre 2026). On garde un seul mot, **mission** : une mission est une demande de l’habitant, et elle construit une partie de son île. Pas de mot nouveau pour l’élève. (Dans le code, une mission reste une quête, avec ses 2 ou 3 niveaux et son niveau adapté.)

## Les trois échelles communes aux trois modèles

| Échelle | Durée | Ce qui se passe | Ce qu’on voit dans le monde |
| --- | --- | --- | --- |
| Courte | 5 à 10 minutes | Une mission | Une partie de l’île se construit, l’habitant réagit |
| Moyenne | Quelques séances | Toutes les missions d’une île, puis son gardien | L’île reconstruite, qui se met à fabriquer sa spécialité |
| Longue | Une année scolaire | Un territoire : toutes les îles d’une classe | Le territoire transformé, le passage au suivant |

## Modèle A : le monde a des besoins

**L’idée.** Chaque mission est une **demande de l’habitant** : un passage à franchir, un ouvrage à faire marcher, un abri à agrandir. Cette mission-là construit cette partie-là de l’île, et l’habitant réagit à chaque étape.

**La boucle.**
1. Plusieurs missions sont ouvertes, mais **un seul habitant fait signe** dans le monde à la fois : c’est la mission conseillée. Les autres attendent dans une liste.
2. L’habitant dit ce qu’il demande en deux phrases, dans un panneau lu à voix haute.
3. La mission réussie construit sa partie de l’île : les blocs gagnés **se posent tout seuls** sur le bâtiment de l’habitant et le restaurent (mainteneur, 2 octobre 2026, voir GD-4).
4. Quand toutes les missions de l’île sont faites, le gardien propose son défi, comme aujourd’hui.
5. **L’île reconstruite devient fournisseur** (mainteneur, 2 octobre 2026). Son bâtiment restauré fabrique sa spécialité (de la laine, du métal, du verre…), dont les autres îles, les monuments et les grands projets ont besoin. Pour en obtenir, l’élève rejoue les missions de l’île, à son niveau adapté. Rejouer sert le monde, et c’est la répétition qui fait apprendre. Une île n’est donc jamais « sans rien à faire ».
6. L’habitant revient aussi vers l’élève pour consolider, par la répétition espacée : « On revérifie l’ouvrage ensemble ? »

**Le lien avec l’apprentissage.** Il n’y a pas de nouvelle unité de programme : les missions existent, et chacune fait déjà progresser une compétence par ses niveaux. La mission reste un exercice comme aujourd’hui ; ce sont le **récit**, la **conséquence** et l’**utilité de rejouer** qui changent.

**Ce que ça demande.** Peu de nouveau code pour les demandes : les missions, les plans et les habitants existent déjà. Il faut écrire la demande de chaque mission, relier chaque mission à une partie de l’île, et ajouter la liste des missions ouvertes. Pour l’île fournisseur : une spécialité par île, et ce qui la demande ailleurs ; c’est proche des blocs assemblés de [GD-2](GD-2.md), qui prennent déjà des blocs de deux îles.

**Points forts.** C'est proche de ce qui existe et de GD-4. Les habitants deviennent utiles, et l'effet de la réussite se voit.
**Limites.** L'exercice reste un exercice : le lien entre savoir et monde passe par le récit, pas par le geste.

## Modèle B : le savoir est un outil

**L'idée.** Une notion maîtrisée donne à l'élève un **outil** dans le monde : mesurer une passerelle, lire une carte, calculer une pente, comprendre un habitant qui parle anglais. L'outil ouvre des **raccourcis et des embellissements**, jamais un passage obligatoire : le monde ne se ferme jamais selon la maîtrise.

**La boucle.**
1. L'élève remarque dans le monde un endroit qui demande un outil : une passerelle à mesurer, un point de vue à repérer.
2. L'exercice part de cette scène (les problèmes situés, l'aide `scene` qui existe déjà). La consigne, les nombres et l'aide restent dans un panneau, lus à voix haute, et la réponse se donne d'un simple toucher : aucun texte ni nombre à lire dans la 3D, aucun geste de mesure.
3. Réussir agit sur le monde : le raccourci s'ouvre, l'embellissement apparaît.
4. L'outil est acquis quand la notion est maîtrisée, d'après la maîtrise déjà mesurée par le jeu, sans nouveau seuil. D'autres endroits qui le demandent apparaissent ailleurs, pour réutiliser la notion.

**Les notions qui s'y prêtent** (directeur du contenu) : grandeurs et mesures (longueurs, aires, durées, conversions, échelle) ; proportionnalité ; Pythagore et Thalès (le mât existe déjà) ; repérage et lecture graphique ; lecture de données ; en anglais, la compréhension orale. L'orthographe, la conjugaison et les accords ne s'y prêtent pas : ils restent dans les modèles A et C.

**Le lien avec l'apprentissage.** C'est le plus fort des trois : l'exercice n'est plus séparé du jeu, et le transfert (réutiliser une notion ailleurs) devient une mécanique.

**Ce que ça demande.** Beaucoup de travail : une scène par notion, validée par le contenu et le référent dys, et des endroits à placer dans le monde, dans le budget de dessin mesuré par l'artiste technique 3D.

**Points forts.** C'est le plus « jeu ». Savoir donne un pouvoir, et on voit à quoi sert ce qu'on apprend.
**Limites.** C'est coûteux, et ça ne vaut que pour une partie du programme.

## Modèle C : les grands projets

**L'idée.** L'élève choisit un **grand projet** : une tour d'observation, un port, un jardin suspendu. Son plan montre les pièces nécessaires, et chaque pièce vient d'une quête d'une île de sa classe. Les quêtes deviennent les moyens de réunir les pièces.

**La boucle.**
1. Un seul projet est conseillé, toujours mis en avant, avec sa prochaine action affichée. L'élève peut en choisir un autre.
2. Le plan montre les pièces par des icônes et une jauge, avec peu de texte, et tout est lu à voix haute.
3. Les pièces se gagnent dans l'ordre qu'on veut. Plusieurs quêtes peuvent donner la même pièce : une matière difficile, ou l'absence de LV2, ne bloque jamais un projet.
4. Le projet fini reste dans le monde. Un projet laissé en attente ne se perd jamais.
5. De la 6e à la 3e, les projets deviennent plus longs, mêlent plus de matières et laissent plus de choix.

**Le lien avec l'apprentissage.** Il travaille l'**autonomie** et la planification, et il croise les matières : c'est la montée en autonomie de la 6e à la 3e, encore ouverte dans le game design. Le contenu ne change pas : chaque pièce cite les compétences de sa quête.

**Ce que ça demande.** Pas de nouvel écran à part : les projets s'adossent aux monuments et aux blocs assemblés de GD-2, qui sont déjà de grands ouvrages faits de pièces venues de plusieurs îles. Il faut des plans de projets et une répartition des pièces.

**Points forts.** L'élève est maître de son projet. C'est motivant sur la durée, surtout pour les plus grands.
**Limites.** Il y a plus à planifier et à retenir : il faut des maquettes relues par le référent dys avant de décider.

## Ce qui vaut pour les trois

- **Rien ne se perd** : pas de chrono, pas de baisse montrée, refuser une mission ou un projet ne coûte rien, et aucun endroit du monde ne se ferme selon la maîtrise.
- **Rien à lire dans le monde** : tout texte est dans un panneau, en police dys, lu à voix haute. Chaque mot nouveau (projet, spécialité) est expliqué la première fois.
- **Un seul objectif mis en avant à la fois**, même quand plusieurs sont ouverts.
- **Les gardiens restent** l'épreuve qui ferme un lieu, dans les trois modèles.
- **La ressource reste la monnaie commune**, la sauvegarde n'est jamais touchée et les identifiants des quêtes ne changent pas.
- **Chaque univers habille** les demandes, les spécialités, les outils et les projets à sa manière (bâtir du neuf, restaurer…), avec les mêmes règles.
- **Le dessin a un plafond** : tout ajout au monde est mesuré par l'artiste technique 3D avant d'être décidé.

## La recommandation

**A tout de suite, B petit à petit, C pour les grands.** A est le socle : il prolonge GD-4, coûte peu et rend les habitants utiles dès maintenant. B vient ensuite, notion par notion, en commençant par les grandeurs et la géométrie, où le problème situé existe déjà ; il n'ouvre que des raccourcis et des embellissements. C prend le relais en 4e et en 3e, en s'appuyant sur les monuments et les blocs assemblés : c'est la réponse à la montée en autonomie.


## Ce qui ne bouge pas

Voir « Ce qui vaut pour les trois », plus haut. Les règles en jeu : DP-09, DP-12, DA-05, les principes dys ([Principes](../../../../www/pedagogie/principes.md)), [Plusieurs univers](../../../conception/univers.md) §4. La sauvegarde, les identifiants des quêtes et le programme couvert ne changent pas.

## Le coût

- **A** : petit pour les demandes (une demande écrite par mission dans `docs/contenu/<île>.md`, chaque mission reliée à une partie de l’île, la liste des missions ouvertes) ; moyen pour l’île fournisseur (une spécialité par île et ce qui la demande ailleurs, avec [GD-2](GD-2.md)). Il rejoint l’étape 1 de GD-4.
- **B** : grand. Une scène par notion, validée par le contenu et le référent dys ; des endroits placés dans le monde, mesurés par l’artiste technique 3D. Des maquettes avant de décider de la première notion.
- **C** : moyen. Des plans de projets adossés aux monuments et aux blocs assemblés de [GD-2](GD-2.md). Des maquettes relues par le référent dys avant de décider.

## Les avis

- **Directeur artistique** : À ajuster, repris. Recommandation approuvée ; un seul habitant fait signe ; l'outil n'ouvre jamais un passage obligatoire ; des pièces de substitution dans C, adossées à GD-2 ; les gardiens et le plafond de dessin ajoutés ; plus de mots propres à un univers.
- **Référent dys** : À ajuster, repris. Un seul besoin mis en avant ; aucune consigne ni aucun nombre dans la 3D, réponse par simple toucher ; carnet en icônes et jauge, lu à voix haute ; maquettes nécessaires avant de valider B et C.
- **Directeur du contenu pédagogique** : À ajuster, repris. « Quête » garde son sens, « besoin » regroupe des quêtes ; liste des notions qui se prêtent à B, sans les accords ; l'outil se déduit de la maîtrise déjà mesurée ; les pièces de C viennent des îles de la classe.

## La décision

2 octobre 2026, mainteneur, sur la recommandation « A tout de suite, B petit à petit, C pour les grands » : « Ok, ça me paraît bien. »

Le même jour, sur « on garde le seul mot mission : une mission est une demande de l’habitant et construit une partie de son île ; une fois reconstruite, l’île fabrique sa spécialité, que l’élève obtient en rejouant ses missions à son niveau, pour les autres îles, les monuments et les projets » : « oui ».
