# Le monde ouvert d’Archipéo

> Les phrases des habitants du monde ouvert d’Archipéo, au 6e ([GD-20](../gameplay/propositions/GD-20.md), point 4, piste B « La remise », arbitrages du directeur artistique du 17 octobre 2026). Une seule forme pour toutes les commandes, que le jeu remplit : les 48 phrases écrites île par île (« Les demandes ») restent celles de la grille. `npm run contenu` écrit ce fichier dans `src/game/world/continu/mondeOuvert.json`, que seul le monde ouvert lit. Le directeur du contenu pédagogique tient le texte, le consultant d’Archipéo le ton, le référent dys la lecture.

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

> Les étapes de la quête d’entraide du 6e (`quetes.md`), que le jeu remplit (lot L2) : une phrase par étape, dans la ligne de l’habitant de l’étape et en tête de la liste « Commandes » ; une consigne pour la remise de « Donner » et d’« Apporter ». Les jetons :
> - `{objet}` : les ressources données, avec les mots de la réserve (« 2 blocs de bois ») ;
> - `{nom}` : l’objet de l’entraide, avec son article, tel que l’écrit `quetes.md` (« la lanterne ») ;
> - `{au lieu}` : le lieu de l’habitant de l’étape, dans sa forme « à » (« aux Quais »).
>
> Le lieu dit qui reçoit, le rôle reste en titre, comme pour une commande. Après « Donner », la fin de la remise dit l’étape suivante (« Apporte la lanterne au Phare. ») ; après « Apporter », la fin reprend « posée » (« La lanterne est en place. »), puis les 50 XP, en icône et en nombre. Tant qu’il manque des ressources pour « Donner », la ligne reprend « demande » (« Il me faut 2 blocs de bois. C’est pour la lanterne. Joue une mission au Phare. »).

## La révision

- entrée : Tu revois {questions}.
- fin : Tu as revu {questions}.

> La révision jouée dans la scène du lieu (lot L3) : la phrase d’entrée, en tête de la scène, sous le rôle, avant la consigne de la première mission ; la phrase de fin, en tête du seul bilan, à la place des étoiles (une révision ne change pas les étoiles). `{questions}` : leur nombre et le mot (« 5 questions », « 1 question »). Jamais une date, un échec ni un retard : ni « ratées », ni « à revoir », ni « encore ».
