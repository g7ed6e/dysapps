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
