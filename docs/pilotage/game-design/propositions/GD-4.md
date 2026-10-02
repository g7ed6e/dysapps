# GD-4 : Le monde ouvert au centre

**État** : Décidée le 2 octobre 2026 (le cap, les trois étapes et leur ordre, les choix de l’étape 1 notés « décidé » ; les niveaux d’île retirés le même jour au profit du modèle A de GD-5) ; chaque étape aura sa propre fiche avant d’être construite
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
- **Le chemin se ressemble d’un élève à l’autre.** Rien n’est imposé à l’intérieur d’un archipel, mais les îles s’ouvrent par les ouvrages, de voisine en voisine, et l’archipel suivant par les Gardiens : le monde se parcourt presque toujours dans le même ordre.

## La proposition

Le monde redevient le cœur du jeu : on y va pour jouer, on y voit ce qu’on a appris, on y choisit son chemin. Trois étapes, dans cet ordre, parce que chacune s’appuie sur la précédente (décidé).

### Étape 1 : tout se passe dans le monde

Missions, révisions, chantiers et Gardiens se lancent en allant voir quelqu’un ou quelque chose dans le monde. Le menu reste, mais devient un raccourci.

1. **Les créatures utiles** (décidé). Première version, petite : **la créature qui se souvient**. Quand une mission de son île a des items à revoir aujourd’hui (la répétition espacée, `src/blocland/review.ts`), la créature fait signe dans le monde : un geste lent et court, puis l’icône de la notion au-dessus d’elle, seule, fixe, sans clignoter, sans texte. À l’arrivée sur son île, elle propose de reprendre, avec un bouton « Reprendre » et un « Plus tard » qui ne coûte rien. Après « Plus tard », elle ne repropose rien avant la visite suivante. Après « Reprendre », l’élève revient sur l’île de la créature. Le menu garde sa ligne « À revoir aujourd’hui » comme raccourci. En vue simple, l’icône apparaît sur l’île dans la Carte, et un toucher ouvre le même panneau ; dans le monde en réseau d’Archipéo (lots 8 et 8b), sur l’île dans le réseau. La révision rapporte des blocs comme une mission. La répétition espacée ne change pas : la créature lui donne un visage.
   - Exemple dans la voix de Blocland : « Les accords sont restés sur le chantier. On les remonte ensemble ? » La réplique est propre à chaque univers ; celle d’Archipéo est à écrire par son consultant.
   - Ensuite, dans une autre fiche : **la créature qui commande un ouvrage**. Chaque mission devient un mécanisme à bâtir pour elle. Dans Blocland : l’écluse de Nénu, l’aiguillage des wagonnets de Tunel, le moulin à engrenages de Coco, la scierie de Mousso.
2. ~~**Les îles ont des niveaux**~~ **Retiré le 2 octobre 2026** (mainteneur : « Oui corriges GD4 »). L’idée était qu’une île « Bâtie » gagne un étage, puis une tour ou un jardin. Elle est remplacée par le modèle A de [GD-5](GD-5.md) : chaque mission est une demande de l’habitant et construit une partie de son île, et l’île reconstruite devient fournisseur de sa spécialité, si bien qu’elle n’est jamais sans rien à faire. Ce qui reste de l’idée vaut pour ce que construisent les missions : ils ne rapportent que le monde, ne se perdent jamais, et leur annonce passe par un son court et une phrase de l’habitant, jamais par le son seul.
3. **Une réussite se voit dans le monde** (décidé le 2 octobre 2026, mainteneur : « Je pense que les blocs devraient se poser tout seul et permettre de restaurer le bâtiment qui justement produirait la ressource spécifique. »). À la fin d’une mission, les blocs gagnés **se posent tout seuls** sur le bâtiment de l’île, sous les yeux de l’élève, en une animation courte. Ils restaurent ce bâtiment, et le bâtiment restauré produit la spécialité de l’île ([GD-5](GD-5.md), modèle A). L’élève n’a pas de chantier à choisir pour le bâtiment de l’île.

### Étape 2 : des chemins au choix

Plusieurs îles ouvertes en même temps, et l’élève choisit son ordre ; une suggestion reste toujours mise en avant. Des demandes passent d’une créature à l’autre (Bloquette a besoin d’un outil forgé chez Lavi), en lien avec les blocs assemblés ([GD-2](GD-2.md)), et restent dans une liste toujours visible. À cadrer avec le monde en réseau d’Archipéo (lots 8 et 8b).

### Étape 3 : explorer pour découvrir

Le monde cache des choses à trouver en se promenant (une créature de passage, un coffre, un recoin), sans rapport avec les réponses ni avec la réussite. Une découverte manquée ne coûte rien, et aucune ne demande un geste précis. Dans Archipéo, où l’on ne marche plus d’île en île avec les lots 8 et 8b, on trouve en touchant un lieu ou pendant un trajet sur une liaison.

### Plus tard

**Des défis de Gardien variés** : quatre ou cinq formes de défi avec leur propre règle (le Gardien se trompe et l’élève le corrige ; chaque bonne réponse pose un bloc du pont vers le Gardien), à la place du récapitulatif actuel. La forme du défi est propre à chaque univers : dans Archipéo, la sentinelle éteinte reste immobile et sans humeur, et une veine se rallume à chaque épreuve réussie.

## Les questions ouvertes

- **Ce que paient les blocs et les spécialités** : si les blocs servent au bâtiment de l’île, les ouvrages entre les îles, les monuments et le navire se paient-ils en spécialités (recommandé : les blocs restent la ressource, les spécialités s’y ajoutent pour les grands ouvrages, comme les blocs assemblés de GD-2) ?

## Ce qui ne bouge pas

- **Les règles dys** : rien à lire dans le monde (tout texte est dans un panneau, en police dys, lu à voix haute) ; aucun geste de réflexe ; pas de chrono ; rien ne se perd ; la vue simple fait tout ce que fait le monde ; un adulte ouvre toujours une mission en deux touchers, même si le menu devient un raccourci.
- **Les règles du référent dys pour les créatures** : ne jamais rappeler un échec ni une date (ni « hier », ni « raté », ni « t’a résisté ») ; deux phrases courtes au plus ; une seule proposition par visite, jamais pendant une partie ; la créature ne réagit qu’aux progrès ; refuser ne coûte rien ; la proposition se comprend sans le son et sans lire, grâce à l’icône de la notion.
- **Pour le directeur artistique** : aucune jauge d’amitié ou d’humeur, aucune créature triste après une absence, aucune demande avec délai, aucune nouvelle monnaie : les blocs restent la ressource (DP-09, DP-12, DA-05).
- **Les univers** ([Plusieurs univers](../../../conception/univers.md), §4) : les règles, la progression et la sauvegarde sont communes ; chaque univers habille les créatures, leurs répliques et les niveaux des îles. Dans Blocland, on bâtit du neuf et des mécanismes ([GD-1](GD-1.md)) ; dans Archipéo, on restaure.
- **La sauvegarde et les identifiants** : jamais touchés. La mémoire d’une créature se déduit de la répétition espacée déjà enregistrée ; ce que construisent les missions s’ajoute aux plans qui existent.

## Le coût

Cette fiche fixe le cap ; chaque étape a sa fiche et son lot. Pour se faire une idée :

- **Étape 1, créatures** : une réplique de rappel par île et par univers (`src/univers/`), le signe de la créature dans le monde (une animation et une icône, à mesurer par l’artiste technique 3D), le panneau d’arrivée. Sauvegarde non touchée.
- **Étape 1, ce que construisent les missions** ([GD-5](GD-5.md), modèle A) : des ouvrages de plus par île (forme et blocs dans le code, noms et répliques dans `docs/contenu/<île>.md`, « ## Les plans »). Le dessin de Blocland est figé : un dégel ciblé, comme le point 4 de [GD-1](GD-1.md), dans un lot à part, sur la grille et avec les textures existantes, dans son plafond (80 000 triangles, 240 appels), captures avant et après, de jour et de nuit. Archipéo est déjà serré (55 874 triangles au 6e) : l’artiste technique 3D mesure avant tout ouvrage ajouté.
- **Étapes 2 et 3** : à cadrer.

## Les avis

- Directeur artistique : À ajuster, repris. « Établi » retiré de la réplique (rien d’emprunté, GD-2) ; le constat sur l’ordre des îles accordé avec « rien n’est imposé » ; deux touchers pour un adulte ; le niveau d’une île distinct des états du village ; la décision inscrite dans les décisions et le game design.
- Consultant de Blocland : À ajuster, repris. Les niveaux d’île passent par un dégel ciblé ; « les blocs fantômes d’un plan » ; l’insigne se lit sans la couleur ; le « clac » de la pose plutôt qu’une cloche, à valider par le directeur artistique.
- Consultant d’Archipéo : À ajuster, repris. Les niveaux restaurent ; la découverte et le signe de la créature dans le monde en réseau ; la forme du défi propre à chaque univers ; la mesure de l’artiste avant d’ajouter des plans. Reste à écrire une réplique d’exemple dans la voix d’Archipéo.
- Consultant UX UI : À ajuster, repris. La vue simple (l’icône sur la Carte, le même panneau) ; un repère fixe pour le chantier choisi, changé en un toucher ; le retour sur l’île après « Reprendre » ; rien de reproposé après « Plus tard ».
- Référent dys : À ajuster, repris. Le signe sans clignotement ; le son jamais seul ; l’insigne avec un chiffre ou une forme ; aucune baisse montrée vers un niveau ; aux étapes 2 et 3, une suggestion mise en avant, les demandes dans une liste visible, une découverte manquée sans coût. « Réduire les animations » n’existe plus depuis #196 : le geste est donc court par nature.

## La décision

2 octobre 2026, mainteneur : « Le gameplay doit remettre le monde ouvert au centre. » Les trois étapes : « Les 3 me semblent des bonnes idées. » La fiche, avec les choix de l’étape 1 notés « décidé » : « go pour gd 4 ». Les niveaux d’île retirés au profit du modèle A de GD-5 : « Oui corriges GD4 ».
