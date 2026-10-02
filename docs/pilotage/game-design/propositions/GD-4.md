# GD-4 : Le monde ouvert au centre

**État** : Décidée le 2 octobre 2026 (le cap, les trois étapes et leur ordre, les choix de l’étape 1 notés « décidé ») ; chaque étape aura sa propre fiche avant d’être construite
**Portée** : Commun (les noms, les voix et le dessin restent propres à chaque univers)

## Le constat

Le mainteneur, du 30 septembre au 2 octobre 2026 :

- « Et si les bâtiments s’amélioraient avec le temps ? Qu’est-ce qui motive les gens à jouer ? C’est là-dessus qu’il faut travailler. »
- « Quelque chose me questionne aussi : les PNJ et les boss… C’est très linéaire et les PNJ n’apportent rien. »
- « Le gameplay doit remettre le monde ouvert au centre. »

Ce que fait le jeu aujourd’hui ([Le game design](../index.md), « La boucle ») :

- **Une île finie n’a plus rien à offrir.** Une fois ses trois plans construits, elle est « Bâtie » (« Restaurée » dans Archipéo) pour de bon.
- **Les créatures** donnent les missions et disent une phrase à l’arrivée, puis une autre quand leur maison est finie. Elles n’ont besoin de rien, ne se souviennent de rien et ne changent rien au jeu.
- **Les Gardiens** suivent le même schéma sur les 31 îles : 2 étoiles dans chaque mission, puis le défi (deux manches de chaque mission, avec les mêmes écrans), puis la statue ou la sentinelle rallumée.
- **Beaucoup passe par les panneaux et le menu**, pas par le monde. Les révisions du jour, par exemple, sont une ligne « À revoir aujourd’hui » du menu (`src/blocland/MenuSheet.tsx`), sans personnage.
- **Les îles s’ouvrent dans un ordre presque fixe** (ouvrages, puis Gardiens).

## La proposition

Le monde redevient le cœur du jeu : on y va pour jouer, on y voit ce qu’on a appris, on y choisit son chemin. Trois étapes, dans cet ordre, parce que chacune s’appuie sur la précédente (décidé).

### Étape 1 : tout se passe dans le monde

Missions, révisions, chantiers et Gardiens se lancent en allant voir quelqu’un ou quelque chose dans le monde. Le menu reste, mais devient un raccourci.

1. **Les créatures utiles** (décidé). Première version, petite : **la créature qui se souvient**. Quand une mission de son île a des items à revoir aujourd’hui (la répétition espacée, `src/blocland/review.ts`), la créature fait signe dans le monde, par un geste et une icône au-dessus d’elle, sans texte. À l’arrivée sur son île, elle propose de reprendre, avec un bouton « Reprendre » et un « Plus tard » qui ne coûte rien. Le menu garde sa ligne « À revoir aujourd’hui » comme raccourci. La révision rapporte des blocs comme une mission. La répétition espacée ne change pas : la créature lui donne un visage.
   - Exemple dans la voix de Blocland : « Les accords sont restés sur l’établi. On les remonte ensemble ? » La réplique est propre à chaque univers.
   - Ensuite, dans une autre fiche : **la créature qui commande un ouvrage**. Chaque mission devient un mécanisme à bâtir pour elle. Dans Blocland : l’écluse de Nénu, l’aiguillage des wagonnets de Tunel, le moulin à engrenages de Coco, la scierie de Mousso.
2. **Les îles ont des niveaux** (décidé). Une île « Bâtie » peut encore grandir. Au niveau 2, des fantômes proposent un étage. Au niveau 3, ils proposent une tour ou un jardin. L’élève les construit avec ses blocs, comme un plan, et le coffre donne les blocs de finition. La montée de niveau se dit par une cloche et une phrase courte de la créature. Une fois le plan fini, l’île a l’air plus vivante, et la Carte montre son niveau par un petit insigne à côté de son état. **Un niveau ne rapporte que le monde** (décidé) : ni bonus de blocs ni production. Un niveau atteint est gardé pour toujours.
   - Ce qui débloque un niveau : question ouverte, ci-dessous. Dans tous les cas, ce sont la maîtrise et les blocs qui le débloquent, jamais le temps qui passe.
3. **Une réussite se voit dans le monde** (piste choisie le 30 septembre 2026, forme à trancher). Les blocs gagnés vont vers un chantier que l’élève choisit en le touchant dans le monde ou sur la Carte (« Construire ici »). Par défaut, c’est le prochain objectif.

### Étape 2 : des chemins au choix

Plusieurs îles ouvertes en même temps, et l’élève choisit son ordre. Des demandes passent d’une créature à l’autre (Bloquette a besoin d’un outil forgé chez Lavi), en lien avec les blocs assemblés ([GD-2](GD-2.md)). À cadrer avec le monde en réseau d’Archipéo (lots 8 et 8b).

### Étape 3 : explorer pour découvrir

Le monde cache des choses à trouver en se promenant (une créature de passage, un coffre, un recoin), sans rapport avec les réponses ni avec la réussite.

### Plus tard

**Des défis de Gardien variés** : quatre ou cinq formes de défi avec leur propre règle (le Gardien se trompe et l’élève le corrige ; chaque bonne réponse pose un bloc du pont vers le Gardien), à la place du récapitulatif actuel.

## Les questions ouvertes

- **Ce qui débloque un niveau d’île** : les étoiles (toutes les missions à 2, puis à 3 étoiles) ; les items retenus (la répétition espacée) ; ou les deux, les étoiles pour le niveau 2 et les items retenus pour le niveau 3 (recommandé).
- **La réussite visible** : les blocs se posent-ils seuls sur le chantier choisi, à la fin d’une mission, ou l’élève les pose-t-il lui-même en un geste ? Le chantier choisi règle la question des ouvrages, des monuments et du navire, qui ont aussi besoin de blocs.

## Ce qui ne bouge pas

- **Les règles dys** : rien à lire dans le monde (tout texte est dans un panneau, en police dys, lu à voix haute) ; aucun geste de réflexe ; pas de chrono ; rien ne se perd ; la vue simple fait tout ce que fait le monde.
- **Les règles du référent dys pour les créatures** : ne jamais rappeler un échec ni une date (ni « hier », ni « raté », ni « t’a résisté ») ; deux phrases courtes au plus ; une seule proposition par visite, jamais pendant une partie ; la créature ne réagit qu’aux progrès ; refuser ne coûte rien ; la proposition se comprend sans le son et sans lire, grâce à l’icône de la notion.
- **Pour le directeur artistique** : aucune jauge d’amitié ou d’humeur, aucune créature triste après une absence, aucune demande avec délai, aucune nouvelle monnaie : les blocs restent la ressource (DP-09, DP-12, DA-05).
- **Les univers** ([Plusieurs univers](../../../conception/univers.md), §4) : les règles, la progression et la sauvegarde sont communes ; chaque univers habille les créatures, leurs répliques et les niveaux des îles. Dans Blocland, on bâtit du neuf et des mécanismes ([GD-1](GD-1.md)) ; dans Archipéo, on restaure.
- **La sauvegarde et les identifiants** : jamais touchés. La mémoire d’une créature se déduit de la répétition espacée déjà enregistrée ; le niveau d’une île se déduit des étoiles ou des items retenus, et ses plans s’ajoutent à ceux qui existent.

## Le coût

Cette fiche fixe le cap ; chaque étape a sa fiche et son lot. Pour se faire une idée :

- **Étape 1, créatures** : une réplique de rappel par île et par univers (`src/univers/`), le signe de la créature dans le monde (une animation et une icône, à mesurer par l’artiste technique 3D), le panneau d’arrivée. Sauvegarde non touchée.
- **Étape 1, niveaux d’île** : deux plans de plus par île (forme et blocs dans le code, noms et répliques dans `docs/contenu/<île>.md`, « ## Les plans »), l’insigne sur la Carte. Le dessin de Blocland est figé : il faudra l’accord de son consultant. Le budget de triangles est à mesurer.
- **Étapes 2 et 3** : à cadrer.

## Les avis

- Directeur artistique : (à venir)
- Consultant de Blocland : (à venir)
- Consultant d’Archipéo : (à venir)
- Consultant UX UI : (à venir)
- Référent dys : (à venir)

## La décision

2 octobre 2026, mainteneur : « Le gameplay doit remettre le monde ouvert au centre. » Les trois étapes : « Les 3 me semblent des bonnes idées. » La fiche, avec les choix de l’étape 1 notés « décidé » : « go pour gd 4 ».
