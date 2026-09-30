# GD-1 : Le caractère de Blocland, le chantier du bâtisseur

**État** : Décidée le 30 septembre 2026
**Portée** : Blocland

## Le constat

Le mainteneur veut donner plus de caractère à Blocland, l’univers par défaut. Le dessin en a déjà : cubes texturés de 16 × 16, interface en blocs vus de face, 31 créatures qui tutoient le « bâtisseur », Gardiens qui deviennent statues et « aiment les revanches ». Ce qui lui manque, c’est sa voix et ses noms, parce qu’il parle encore avec les mots d’Archipéo :

- la première voix qu’entend un élève neuf est la baleine (« Je suis la baleine… », `src/univers/blocland/index.ts`), figure d’Archipéo ([Plusieurs univers](../../../conception/univers.md), §4.1) ;
- les archipels de 5e et de 4e s’appellent « Îles Brumeuses » et « Anciens Ateliers » (`src/blocland/world/archipelago.ts`), la brume et les ruines étant le vocabulaire d’Archipéo ; « Le village d’Archipéo » s’affiche dans les Réglages ;
- trois des cinq rôles ont un lexique d’explorateur marin (Explorateur, Cartographe, Navigateur, Architecte de l’archipel) ;
- aucun geste ni aucun son n’est propre à Blocland.

## La proposition

Un pilier : **le chantier du bâtisseur**. Dans Blocland, tout se nomme, se dit et se fête du point de vue de celui qui construit. Le mainteneur l’a précisé : « Blocland c’est l’univers de la construction par bloc, des mécanismes, de l’ingénierie, avec des clins d’œil aux jeux vidéo. Le bloc c’est l’unité de base pour construire. » Formulation proposée par le directeur artistique : dans Blocland, on bâtit bloc à bloc, et les mécanismes font vivre ce qu’on a bâti. Il se décline en quatre changements :

1. **Qui parle aux grandes étapes** d’un archipel (l’arrivée, le premier ouvrage, le dernier Gardien vaincu, l’île-port bâtie) : la créature de l’île-école de l’archipel, avec son portrait dans la bulle. Mousso en 6e, Bazar en 5e, Ixe en 4e, Fi en 3e. Les baleines en cubes restent au large, sans parler.
2. **Les noms des archipels** : retour des noms d’origine de Blocland, les Basses Terres (6e), les Collines du Large (5e), les Monts de Feu (4e) ; les Îles du Ciel (3e) ne changent pas ; « Le village de Blocland » dans les Réglages. Un élève qui a déjà une partie voit une fois « L’archipel X s’appelle maintenant Y » (U4).
3. **Les rôles** : des métiers du chantier, qui suivent les insignes de la terre à l’or. Première proposition du directeur artistique : Apprenti, Compagnon, Bâtisseur, Maître bâtisseur, Architecte de Blocland. Liste affinée par le consultant de Blocland : **Apprenti, Maçon, Bâtisseur, Maître bâtisseur, Architecte** (« compagnon » s’entend « ami » à 11 ans ; « Architecte » seul se lit d’un bloc). « Bâtisseur » est déjà le nom du troisième rôle commun. La liste finale est à valider par le directeur artistique et le mainteneur avant d’être construite.
4. **Le geste et le son de pose** : un bloc qui tombe et se pose, à la fin d’un plan et à l’écran titre (le logo se construit en quelques cubes, comme l’ancien écran titre de Blocland) ; un son de pose propre à Blocland, plus mat que le « toc » commun.

## Ce qui ne bouge pas

- Le jeu commun : mêmes règles, mêmes seuils d’XP, mêmes étoiles et mêmes blocs dans les deux univers ; les sons de réussite et d’erreur restent communs (Plusieurs univers, §4).
- Aucun identifiant ne change (`explorateur`, `cartographe`, `batisseur`, `navigateur`, `architecte`, identifiants des archipels et des îles, clés « déjà dit » des étapes) ; la sauvegarde n’est pas touchée.
- Archipéo garde ses textes : ses étapes et sa baleine ne changent pas (aujourd’hui, `src/univers/archipeo/index.ts` reprend `...BLOCLAND.baleine` : il doit en garder sa propre copie).
- Rien d’emprunté à un jeu existant ; tout reste dessiné et produit par le code (pas d’asset importé dans Blocland).
- Règles dys : tout texte ajouté est dans un panneau et lu à voix haute ; le geste est court et doux, sans motif fin qui scintille ; rien sur une étiquette. Le réglage « Réduire les animations » étant retiré pour l’instant, le geste doit convenir à tous.

## Le coût

- Changements 1 à 3 : textes seulement, dans `src/univers/blocland/`, `src/blocland/world/archipelago.ts` (le nom passe par les textes de l’univers), les rôles affichés par univers, l’écran de renommage d’U4. Taille M. Fichiers partagés avec les fils de contenu (`communs.ts`, empreinte de `src/univers/univers.test.ts`) : chaque pull request se remet sur `main` avant fusion.
- Changement 4 : un **dégel ciblé** du dessin de Blocland, figé depuis l’étiquette `blocland-reference` : un lot distinct des lots R, qui ajoute sans rien redessiner, sans toucher aux empreintes ni aux cases d’un plan, validé sur captures avant et après (jour et nuit). Code écrit par l’artiste technique 3D. Taille S à M.
- Pages à tenir : le manuel (rôles, noms des archipels, bulles des étapes), [Personnages et Gardiens](../personnages.md) (régénérée), la [fiche de Blocland](../../../../design/blocland/fiche.md), le [cadrage de Blocland](../../../conception/cadrage-blocland.md).

## Les avis

- Directeur artistique (30 septembre 2026) : recommande le pilier « chantier du bâtisseur » plutôt qu’une mascotte nouvelle (risque d’infantiliser, les créatures font déjà ce travail) ou qu’une signature seule (creuse sans récit) ; recommande les créatures des îles-écoles, le retour des noms d’origine, les métiers du chantier et le geste de pose ; le gel du dessin n’est rouvert que pour le geste, de façon ciblée.
- Consultant de Blocland (30 septembre 2026) : même diagnostic (la baleine, les noms d’archipels et les rôles viennent d’Archipéo) ; même ordre (les créatures d’abord, puis le lexique, puis les noms avec U4) ; signale que des états du village renommés pourraient se confondre avec le chantier « bâtiments qui montent de niveau par île » : ils ne font pas partie de cette fiche.
- Consultant de Blocland, sur les rôles : Apprenti, Maçon, Bâtisseur, Maître bâtisseur, Architecte ; garder « Bâtisseur », que l’élève entend dès le début (« on devient ce qu’on nous dit »).
- Référent dys (30 septembre 2026), **À ajuster** : « Adaptée aux élèves dys si chaque nouveau mot, nom ou son est écrit, lu à voix haute et expliqué la première fois, et si le geste de pose reste court, doux et n’oblige jamais à attendre. » Conditions pour chaque pull request : le nom de la créature écrit dans la bulle, lue et relançable, le portrait n’étant qu’une illustration ; le message de renommage en une phrase par archipel, sur un seul écran opaque, lu, affiché une fois, hors partie, un seul bouton ; les cinq rôles distincts à l’oreille avec la voix de l’appli et lisibles en OpenDyslexic grande taille, un mot de métier peu connu expliqué à la première obtention ; il s’inquiète qu’un rôle « Bâtisseur » se confonde avec le « bâtisseur » des créatures (point à trancher avec la liste des rôles) ; le geste dure moins d’une seconde, sans secousse, flash ni rebond répété, ne bloque jamais le toucher et vient après la réponse (au lot 11, il se coupe avec « Réduire les animations ») ; le son de pose ne monte ni ne descend comme ceux de réussite et d’erreur, se tait avec le son coupé et ne porte aucune information seul.

## La décision

30 septembre 2026, mainteneur, dans le fil « Donner du caractère à Blocland » : le pilier « chantier du bâtisseur » (« 1 ») ; la créature de l’île-école parle aux grandes étapes (« 1 ») ; retour des noms d’origine des archipels (« 1 ») ; des métiers du chantier pour les rôles (« 1 ») ; le geste de pose (« 2 ») et un son de pose propre à Blocland (« Et 3 »). Puis l’identité de Blocland : « Blocland c’est l’univers de la construction par bloc, des mécanismes, de l’ingénierie, avec des clins d’œil aux jeux vidéo. Le bloc c’est l’unité de base pour construire. » Restent ouverts : la liste des rôles, la géographie (le mainteneur trouve l’île et le pont propres à Archipéo ; ils sont pourtant d’origine dans Blocland, `git show 07bb03a^:src/blocland/world/archipelago.ts`), et donc les noms des archipels, qui ne se construisent pas avant ce choix.
