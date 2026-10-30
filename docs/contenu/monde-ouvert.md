# Le monde ouvert d’Archipéo

> Les phrases des habitants du monde ouvert d’Archipéo, au 6e, et la ligne de chaque veillée ([GD-20](../gameplay/propositions/GD-20.md), point 4, piste B « La remise », arbitrages du directeur artistique du 17 octobre 2026). Une seule forme pour toutes les commandes, que le jeu remplit : les 48 phrases écrites île par île (« Les demandes ») restent celles de la grille. `npm run contenu` écrit ce fichier dans `src/game/world/continu/mondeOuvert.json`, que seul le monde ouvert lit. Le directeur du contenu pédagogique tient le texte, le consultant d’Archipéo le ton, le référent dys la lecture.

## Les habitants

- demande : Il me faut {objet}. C’est pour {nom}. Joue une mission {au lieu}.
- demande assemblée : Il me faut {objet}. C’est pour {nom}. Assemble les {blocs} {au lieu}.
- prête : Livre {objet} {au lieu}.
- consigne : Tu livres {objet} pour {nom}.
- posée : {Nom} est en place.

> Les jetons, que le jeu remplace :
> - `{objet}` : le nombre et le nom de la ressource, avec les mots de la réserve (« 3 blocs de sable ») ;
> - `{blocs}` : le même nom sans nombre (« madriers ») ;
> - `{nom}` : la petite construction, avec son article, telle que l’écrit « Les demandes » de son île (« le potager ») ; `{Nom}`, la même avec sa majuscule ;
> - `{au lieu}` : le lieu, dans sa forme « à » (« au Phare », « aux Filets ») : dans la demande, le lieu de la ressource, ou le lieu où l’on assemble, toujours en entier (« à l’Entrepôt des matériaux », la forme « à » de `assemblage.md`) ; dans « prête », le lieu de l’habitant.
>
> Le nom de la ressource ne se raccourcit jamais : c’est le mot de la réserve. Le rôle de l’habitant (« L’éclusier ») n’entre pas dans la phrase : il s’écrit en tête de la ligne de l’habitant et de la scénette, avec son icône. Une idée par phrase, trois phrases au plus, et **dix mots au plus par phrase une fois les jetons remplis** (compté sur les seize commandes du 6e par `remiseOf.test.ts`, les nombres comptant pour un mot). Un point à la fin, jamais « ! » ; ni « merci », ni « vite », ni le mot « quête » ; ni prénom, ni créature, ni île de la grille ; rien sur le Rafiot.

## L’entraide

- mission : Joue une mission {au lieu}.
- donner : Donne {objet} {au lieu}.
- apporter : Apporte {nom} {au lieu}.
- consigne donner : Tu donnes {objet} pour {nom}.
- consigne apporter : Tu apportes {nom}.

> Les étapes des trois quêtes d’entraide du 6e (`quetes.md` : la lanterne, le portillon, l’escalier), que le jeu remplit (lot L2) : une phrase par étape, dans la ligne de l’habitant de l’étape et en tête de la liste « Commandes » ; une consigne pour la remise de « Donner » et d’« Apporter ». Les jetons :
> - `{objet}` : les ressources données, avec les mots de la réserve (« 2 blocs de bois ») ;
> - `{nom}` : l’objet de l’entraide, avec son article, tel que l’écrit `quetes.md` (« la lanterne ») ;
> - `{au lieu}` : le lieu de l’habitant de l’étape, dans sa forme « à » (« aux Quais »).
>
> Le lieu dit qui reçoit, le rôle reste en titre, comme pour une commande. Après « Donner », la fin de la remise dit l’étape suivante (« Apporte la lanterne au Phare. ») ; après « Apporter », la fin reprend « posée » (« La lanterne est en place. »), puis les 50 XP, en icône et en nombre. Tant qu’il manque des ressources pour « Donner », la ligne reprend « demande » (« Il me faut 2 blocs de bois. C’est pour la lanterne. Joue une mission au Phare. »).

## La révision

- entrée : Tu revois {questions}.
- fin : Tu as revu {questions}.
- rappel : On revoit quelques questions ensemble.

> La révision jouée dans la scène du lieu (lot L3) : la phrase d’entrée, en tête de la scène, sous le rôle, avant la consigne de la première mission ; la phrase de fin, en tête du seul bilan, à la place des étoiles (une révision ne change pas les étoiles) ; le rappel, dans la ligne de l’habitant, avec « Reprendre » et « Plus tard », à la place de la phrase de la grille (« On reprend « … » ensemble ? ») dans le monde ouvert seulement : il ne nomme aucune mission (le passage ne commence pas forcément par la première nommée) ni aucun nombre (le passage se calcule au toucher de « Reprendre »), et vaut aussi quand « Reprendre » mène à l’écran habituel. Blocland et la grille gardent leur phrase. `{questions}` : leur nombre et le mot (« 5 questions », « 1 question »). **Le mot « question » est fixé par le code** (`questionsWord`, qui l’accorde au nombre) : une phrase ne peut pas dire « exercices » ni « items ». Jamais une date, un échec ni un retard : ni « ratées », ni « à revoir », ni « encore ».

> La liste des lieux (sur la Carte, « Lieux ») n’a pas de forme ici : son étiquette lue ajoute **« avec »** et les aménagements posés du lieu (« Les Quais, …, avec le potager et la lanterne »), mots écrits par le code (`PlacesSheet.tsx`), comme les mots d’état. Si un univers veut sa propre formule, elle deviendra une forme de ce fichier.

## Les veillées

- feu éteint : {Feu} est éteint.
- feu allumé : {Feu} est allumé.
- embarquement : {Équipier} monte à bord.

> Les trois veillées d’un niveau ([GD-23](../gameplay/propositions/GD-23.md) ; [GD-27](../gameplay/propositions/GD-27.md), « Par quels canaux le récit se raconte ») : l’arrivée cadre le feu du niveau éteint, le départ le cadre tel qu’il est, l’embarquement cadre le lieu où un équipier monte à bord. Une seule ligne par veillée, littérale, le lieu nommé, écrite sur fond uni et lue, relançable, jamais nécessaire pour avancer ; un toucher la passe. Les jetons, que le jeu remplace :
> - `{Feu}` : le nom du lieu qui porte le feu du niveau, avec son article (au 6e, « Le Phare », dont la lanterne s’allume avec son haut ; au 5e, « Le Sémaphore », la lanterne de tête de son mât, avec son haut ; au 4e, « La Forge », son fourneau, avec ses abords ; au 3e, « Le Fanal », avec son haut) ; la forme s’écrit au masculin singulier et le jeu l’accorde au nom du lieu, comme les mots d’état (« La Forge est allumée. ») ;
> - `{Équipier}` : l’équipier qui monte à bord, par son rôle, avec son article (au 6e, « L’équipière radio », à la Gare maritime ; au 5e, « Le naturaliste », aux Fumerolles ; au 4e et au 3e, personne n’embarque) ; un rôle qui désigne une personne, jamais un objet (« La radio » se lisait comme l’appareil), jamais un prénom.
>
> Dix mots au plus, un point à la fin, jamais « ! » ; ni « vite », ni « merci », ni le Rafiot, ni « veillée » dans la ligne elle-même (le mot est celui d’un lieu du 4e ; le manuel, lui, peut dire « les veillées »).
