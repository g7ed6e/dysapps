# État des chantiers

Cette page dit, chantier par chantier, où en est le projet : ce qui est construit, ce qui est en cours, ce qui attend une décision et de qui. Elle est le point d’entrée ; le détail reste dans les cadrages, cités à chaque ligne. **Mise à jour le 30 septembre 2026 au soir.**

Chaque pull request qui fait avancer un chantier met à jour sa ligne ici, dans la même pull request (règle du `CLAUDE.md`). Une décision de game design ne s’écrit pas ici mais dans le [game design](game-design/index.md).

## Les références

Chaque chantier a son préfixe ; on ne les mélange jamais (dans les fils, les pull requests et la doc).

| Préfixe | Chantier | Plan détaillé |
| --- | --- | --- |
| **lot 1** à **lot 11** | La migration vers Archipéo, piste Jeu et suite | [Cadrage Archipéo](../conception/cadrage-archipeo.md), §6 |
| **R0** à **R7**, **R4b-6e** à **R4b-3e**, **S** | Le rendu d’Archipéo | [Cadrage Archipéo](../conception/cadrage-archipeo.md), piste Rendu |
| **DA-1** à **DA-33** | Les retouches de la revue d’ensemble du directeur artistique | Liste tenue hors du dépôt par le fil « Revue d’ensemble du DA » ; résumé ci-dessous |
| **J0** à **J8**, **D** | Séparer le jeu du rendu | [Séparer le jeu du rendu](../conception/separation-jeu-rendu.md), §3 |
| **U0** à **U6** | Les univers | [Plusieurs univers](../conception/univers.md), §6 |
| **LV2-1** à **LV2-5** | La deuxième langue vivante | [Cadrage du contenu](../conception/cadrage-contenu.md), la LV2 |
| **C-1** à **C-15** | Le contenu pédagogique à couvrir | [Cadrage du contenu](../conception/cadrage-contenu.md), le plan |
| **M1** à **M5** | Le contenu écrit en Markdown, source du jeu et du site | [Contenu en Markdown](../contenu/README.md) et ci-dessous |
| **GD-n** | Les propositions de game design | [Game design](game-design/propositions/modele.md) |

À ne pas confondre : **DA-01** à **DA-05** (avec un zéro) sont les règles de direction artistique du dossier Archipéo (`design/archipeo/direction-artistique.md`), **DA-1** à **DA-33** les retouches du directeur artistique.

## Ce qui attend le mainteneur

| Quoi | Chantier | Recommandation |
| --- | --- | --- |
| Voir sur tablette le 7b et les lieux du 6e | lot 7 | Oui : moiré en mouvement, images par seconde, pose d’un bloc à la Forêt |
| Choisir l’asset du banc d’essai, puis qui lance les outils de génération | Assets | Un Gardien d’Archipéo, en portrait 2D puis en 3D ; lancés d’abord à la main par le mainteneur sur une commande préparée |
| Confier l’en-tête commun des écrans de calcul, qui fait défiler d’environ 124 px sur tablette (Faisceaux, Relevés, Thalès) | — | Un fil court, relu par le référent dys ; personne ne l’a pour l’instant |
| Valider le budget des bornes du 6e (1 250 triangles, pris sur la faune ; total inchangé à 57 800) | C-2, R | Oui : la quatrième borne du Volcan dépasse de 8 triangles, la faune a de la marge |
| Entendre sur iPad et Android un nombre de dix chiffres lu en milliards (Nombres géants) | C-2 | — |
| La vidéo de l’oiseau planeur | DA-22 | — |
| La recherche « rien d’emprunté » sur « Jardin des heures » et ses replis | LV2-4 | — |
| La limite de 40 appels de dessin : par archipel tout construit, ou pour la vue d’une île seulement | R | Aujourd’hui 45 à 65 appels en vue d’archipel, 81 à 115 sur la Carte |
| Le premier voyage : nombre de Gardiens exigés (3, 2, 2) et taille du premier chantier | Blocland | Selon les retours des élèves |

### À vérifier sur tablette

- Images par seconde du monde 3D (`?mesures`), sur la tablette de référence (R0).
- Fumées et brume, avec et sans « Réduire les animations » de l’appareil ; panache du volcan en portrait ; brume du 5e et planeur du 3e en vidéo.
- Scintillement des planches des ponts du 5e quand la caméra bouge ; mât de grue en 1024 × 768.
- Galets en colonnes (Rivière) : les cases de la multiplication et la potence en 1024 × 768 ; la voix des nombres de 1 000 et plus (« 2 550 ») et des décimaux (« 5,69 »).
- Voix : « Bâtie », la phrase de la baleine, « −1 » et « (0 ; 2) », « COD », « p.m. » en voix anglaise, les voix allemande et espagnole (heures, nombres, « Tú », « Sí »).
- Écrans sans défilement en OpenDyslexic grande taille (ticket #231 : en 1024 × 768, les écrans avec document défilent).
- Faire glisser le monde au doigt (Recentrer) : confort du glissé, aucun toucher d’île déclenché par erreur après un glissé, second doigt ignoré ; sur téléphone en grand texte, « Recentrer » et une bulle du haut ne se chevauchent pas.
- Sur téléphone en grand texte : le défilement du panneau de la Carte et le nom de destination jamais sous le panneau (DA-31) ; les noms d’îles sous la bulle de la baleine (DA-10).

## Les chantiers

### La migration vers Archipéo (lots)

| Lot | Titre | État | Suite |
| --- | --- | --- | --- |
| lot 1 à lot 5 (3a, 3b, 4a, 4b) | Les mots, l’interface, le monde qui change, le menu et la Carte, le mot de la baleine | Construits | — |
| lot 6 | Le nouveau monde, à deux univers (avec U3) | **Fini** le 29 septembre 2026 (#241) | Aperçus fixes des univers reportés après les lots 8 et 8b |
| lot 7 | L’architecture modulaire (Archipéo seulement) | 7a construit (#229) ; choix du mainteneur inscrits (#250) ; 7b (le 6e : colombage peint, toits en pente) fusionné (#273) ; **l’école et la salle des trophées au kit du 6e** fusionnées (#279) | Ensuite : la place des trophées, fiche GD-3 décidée le 1er octobre 2026 (option B : aucun sur le toit, une salle qui s’agrandit), commune aux deux univers, à construire avant 7c ; le bardage des pignons (à trancher par le directeur artistique), le dessus des fantômes un peu plus distinct du crème (référent dys) ; puis 7c et 7d en parallèle, 7e avec le lot 8 |
| lot 8 | L’Horizon et le navire maritime | À faire | Migration de sauvegarde des pièces du navire ; monde en réseau (J6) |
| lot 8b | La Carte des quatre archipels en 3D | À faire | Après le lot 8 |
| lot 9 | L’archipel vivant | À faire | Le faisceau et la rotation du phare l’attendent |
| lot 10 | Un village à soi | À faire | — |
| lot 11 | Contraste élevé et « Réduire les animations » dans l’appli | À refaire (retirés le 28 septembre 2026, #196) | — |

### Le rendu d’Archipéo (R) et la revue d’ensemble (DA-n)

Tous les lots R sont construits : R0 à R7, S, les quatre R4b (6e, 5e, 4e, 3e), R5 avec les ponts du 5e, R6. La 2D peinte (R7) reste dans le code sans écran qui l’affiche (sans WebGL, la vue simple est la liste des îles).

| Retouches | État |
| --- | --- |
| DA-3 à DA-6, DA-8 à DA-10, DA-14 à DA-18, DA-23 à DA-31 | Fusionnées |
| DA-7, DA-32 | Sans objet |
| **DA-19** (lueur de nuit du 3e au-dessus de 3 %) | En cours dans le fil « Revue d’ensemble du DA » (mesure par l’artiste technique 3D), sans pull request pour l’instant |
| DA-11 (nuages au ras de l’eau), DA-20 (massif du 3e), DA-21 (nuit lilas du 3e) | À faire, dans cet ordre, après DA-19 |
| DA-22 (oiseau planeur) | Attend la vidéo du mainteneur |
| DA-1 (fumée plus grise), DA-2 (fourneau du 4e), DA-13 (lointain du 6e, facultatif), DA-12 (capture du pont Marché–Marais) | À faire, en dernier |
| DA-33 (à la revanche, « brille déjà » alors que la sentinelle repart éteinte) | À valider par le directeur artistique |
| Bornes cachées (dans la vue d’une île, un arbre, un fanion ou une fumée se dressait devant une borne de mission, relevé par C-4 et C-5) | Pull request ouverte : aucun décor ne cache plus une borne, sur les 31 îles |

Restes de R6 (cadrage Archipéo, les personnages) : répliques des créatures, mot de la baleine et une partie des espèces propres à Archipéo (encore communs), miniature en cubes du panneau d’île, créatures un peu moins contrastées de nuit.

### Séparer le jeu du rendu (J)

J0 à J5 et D construits ; l’habillage des univers (objet `Habillage`, textes dans `src/univers/`, couche `univers`) fait avec U4. **Reste la disposition en réseau** (le monde d’Archipéo en lieux sans marche, décision du mainteneur), avec les lots 8 et 8b, à cadrer d’abord avec le directeur artistique.

### Les univers (U)

| Étape | État | Suite |
| --- | --- | --- |
| U0 à U3 | Faites | — |
| U4 (l’habillage sans changement d’image) | Code fait (#220, #222, #225) | Restent le retour des noms propres à Blocland (proposés par son consultant), le lexique court et l’écran « L’île X s’appelle maintenant Y » |
| U5 (l’habillage pédagogique de Blocland) | À faire | Se cadre avec le directeur contenu pédagogique |
| U6 (un troisième univers) | Après les lots 8 et 8b | « Périple » abandonné pour l’instant |

Blocland est l’univers par défaut ; Archipéo se choisit dans les Réglages et n’est pas mis en avant (décisions 7 à 9 de [Plusieurs univers](../conception/univers.md)).

### La deuxième langue vivante (LV2)

| Étape | État | Suite |
| --- | --- | --- |
| LV2-1 (socle, réglage), LV2-2 et LV2-3 (Relais des voyageurs, 5e), LV2-4 (Jardin des heures, 4e) | Fusionnées (#205, #215, #221, #232) | Voir [La LV2 : ce qui reste](lv2-suites.md) |
| **LV2-5** (Refuge des carnets, 3e) | Fusionnée (#252) | Tout ce qui reste est rangé dans [La LV2 : ce qui reste](lv2-suites.md) ; rien n’est lancé sans le mot du mainteneur |

### Le contenu en Markdown (M)

Décision du mainteneur (30 septembre 2026) : le contenu s’écrit en Markdown dans `docs/contenu/`, et ces fichiers produisent à la fois les JSON du jeu et les pages du site. Étapes : **M1** pilote sur une île (format, générateur, vérification en CI : la Baie des mots, fusionnée #254) ; **M2** tous les exercices (les 21 îles qui en ont, fusionnée #255 ; format allégé sur l’avis du directeur du contenu : lecture du trou et clé déduites, mot troué, tableaux pour les items courts, modèles par écran ; le barème reste dans les fichiers) ; **M3** les 31 îles et leurs missions de `biomes.ts` dans l’en-tête et les sections des fichiers, `src/blocland/iles.ts` produit, l’ordre dans `docs/contenu/archipel.md` (fusionnée #256) ; **M4** les pages du site produites depuis le Markdown : **sans objet**, le site est fabriqué depuis les données du jeu, que `npm run contenu` produit depuis `docs/contenu/` (une île ou un exercice modifié dans le Markdown change donc sa page au build suivant) ; **M5** les missions du portail (homophones, verbes irréguliers, textes à lire, vocabulaire : `docs/contenu/portail/`) et les plans des bâtiments (nom, XP, coffre, réplique : section « Les plans » à la fin du fichier de chaque île), fusionnée #257 ; la forme des bâtiments et les blocs restent dans le code. **Chantier fini** le 30 septembre 2026 : tout le contenu s’écrit dans `docs/contenu/` ([format](../contenu/README.md)). Les répliques des univers restent hors plan pour l’instant. Garantie à chaque étape : les JSON produits redonnent exactement les mêmes exercices, avec les mêmes identifiants.

### Le contenu (C)

Le plan C-1 à C-15 est dans le [cadrage du contenu](../conception/cadrage-contenu.md) (#248), avec les points de la relecture du 28 septembre rangés sous C-2, C-3 et C-6 à C-9 (#249). **C-1** (la division posée à la Rivière) est **livrée** : « Galets en colonnes » (`colonnes`), quatrième mission de la Rivière des fractions, avec les aides `column-operation` et `long-division` ; **C-2** (grands nombres au Volcan : « Nombres géants » (`geants`), quatrième mission du Volcan des décimaux, avec l’aide `class-table` ; ranger et intercaler des décimaux à la Coulée de lave, encadrer une fraction à la Pente graduée) est **livrée** par sa pull request, qui attend le mot du mainteneur. Depuis le 30 septembre 2026, le contenu avance en parallèle, un fil par groupe d’îles (décision du mainteneur). **C-8** (l’Observatoire des textes : document composite, types et formes de phrase, phrase complexe, attribut du COD et expansions du nom, en trois niveaux de plus, et les retouches de la relecture du 28 septembre) est **livrée** ; l’île est pleine (quatre missions de trois niveaux au plus). **C-3** (la mission « Troupeau » de la Ferme, les cartes de règle de l’Enclos et de la Récolte, vingt mots-outils de plus au Coffre) est **livrée** (#263) ; **C-6** (la mission « Facettes » de la Carrière, synonymes et polysémie, et les retouches des Familles et du Mot troué) est **livrée** par sa pull request, qui attend le mot du mainteneur. **C-9** (Signs, quatrième mission de la Baie des mots : lire en 6e une étiquette, une carte ou un petit texte en anglais avec son image) est **livrée** ; la Baie est pleine. **C-10** (suivre une histoire à l’oral : Story time à l’Horloge des verbes, Stories au Théâtre des voix, sur un écran où l’histoire s’écoute avant de s’afficher) est **livrée**. **C-11** (les repères culturels : Traditions à la Gare du futur, École et médias au Studio des ondes) est **livrée** : l’anglais du plan est fini. Suite de l’anglais : chaque ligne « mot = sens » des cartes de lexique d’anglais a son bouton Écouter, qui lit les mots anglais en voix anglaise (pull request à part, qui attend le mot du mainteneur). **C-7** (« mais / mes / met » à l’Aiguillage, champ lexical dans une phrase et registres au Cabinet, en trois niveaux de plus, avec les points de la relecture du 28/09 sur ces deux îles) est livrée par sa pull request. **C-4** (« Étages du sens », la compréhension et les reprises à la Tour du lecteur) est **livrée** (#261) ; **C-5** (« Vitraux des phrases », types et formes de phrase, attribut, épithète, complément du nom, phrase simple et complexe, troisième mission de la Tour) est **livrée** (#269). Ordre décidé : d’abord les étapes courtes qui ne changent pas le monde (C-1 à C-11), puis l’île des Grandeurs (C-12 à C-14, à cadrer avec le directeur artistique, les deux consultants et l’artiste technique 3D) ; C-15 (géométrie à figures) n’a pas de lot.

Encore ouverts : le découpage syllabique selon l’écrit ou selon l’oral (le référent dys tranche), le nom de Tunel et « Bien piochée ! » (le directeur artistique), « Entendre les choix » (technique).

### Le flux de l’idée aux assets

En conception avec le mainteneur dans le fil « Flux de l’idée aux assets » ; rien n’entre dans le dépôt avant sa validation. Décidé le 30 septembre 2026 : la règle « aucun modèle ni texture importé » s’ouvre, avec un cadre (une fiche par asset : outil, prompt, licence ; le budget de l’archipel ; servi depuis l’appli, hors ligne ; validé par le directeur artistique et le référent dys). Le cadre reste à écrire dans le [cadrage Archipéo](../conception/cadrage-archipeo.md) avec le flux. En cours : comment générer les images et les modèles 3D ; proposition d’un banc d’essai sur un seul asset, jugé sur le rendu, le poids et le coût. Blocland reste dessiné par le code.

### Combiner les blocs (GD-2)

Décidé par le mainteneur le 30 septembre 2026 ([GD-2](game-design/propositions/GD-2.md)) : un lieu de plus sur l’île de l’école (la Fabrique dans Blocland, la Halle aux matériaux dans Archipéo) où l’on assemble un bloc par archipel (Poutre, Vitrail, Engrenage, Miroir ; Madrier, Hublot, Poulie, Loupe dans Archipéo), que les huit monuments demandent. Recettes et noms dans `docs/contenu/assemblage.md`. **Construit** par sa pull request (brouillon). Le lieu suivra l’école et la salle des trophées quand elles prendront le kit d’architecture modulaire (après le 7b). Attend le mainteneur : l’enveloppe de construction des archipels 5e à 3e (7 100 → 7 200 triangles, somme inchangée). Reste ouvert : l’étiquette de l’île qui couvre le lieu, le hublot du phare du large (petit), l’icône du Hublot aux couleurs du vitrail, une explication courte des mots rares d’Archipéo (madrier, poulie, hublot).

### Les agents

Huit agents dans `.claude/agents/`, décrits dans [Contribuer](../conception/contribuer.md#les-agents). Le dernier venu, le **consultant UX UI** (`consultant-ux-ui`, demandé par le mainteneur le 1er octobre 2026), relit l’ergonomie et l’interface des écrans communes aux univers, sous l’autorité du directeur artistique, avec ses [bonnes pratiques UX UI](../conception/bonnes-pratiques-ux-ui.md) ; il est consulté avant toute pull request qui change un écran, un composant, la navigation ou un parcours.

### L’allègement de l’interface

Demande du mainteneur (1er octobre 2026) : l’interface est trop chargée, on n’arrive pas à agir dans le monde, il y a trop à lire, certaines fenêtres ne se ferment pas. Première étape, **les fenêtres qui coinçaient** (pull request ouverte) : fermer Blocs, l’École, la salle des trophées ou un monument rend le monde (le panneau de l’île reste replié au lieu de se rouvrir) ; le mot de la baleine en deux pages a un bouton **Passer** ; la bulle d’une créature a une croix. Puis l’allègement, écran par écran : le mainteneur a choisi les huit points (1er octobre 2026), cadrés par le directeur artistique ; fait dans la même pull request, relu par tous les agents : plus de barre du haut sur l’écran du monde (le rôle et l’XP en tête du menu ⏸ ; Reprendre, puis Réglages et Accueil côte à côte, puis le reste ; « Tutoriel » et « Revoir l’aide du village » retirés du menu, le « ? » de la barre du bas suffit), soleil et lune dans les Réglages (« La lumière du monde »), tutoriel du village en trois bulles, les ouvrages et le Bloc-Navire dits par les créatures à la première rencontre (textes d’univers), une seule ligne dans le pli de la Carte, le panneau d’île missions d’abord (accueil en une ligne, la suite dans un pli, matière et classe au pied), le panneau replié qui le reste après la Carte et au retour d’une mission (toucher l’île fait parler sa créature), Blocs, monument, École et Trophées plus courts. Restent : **le défi du Gardien qui déborde, à décider par le mainteneur avec le directeur artistique** ; `lockedHint` dit « vaincu le Gardien » dans Archipéo (`src/blocland/world/goals.ts`, ligne 171), à passer par les textes d’univers ; les captures du manuel, que la CI refera à la publication. La caméra (glisser pour se déplacer, Recentrer) est faite dans son propre fil (#277).

## Les défauts relevés en consolidant

- Dans Archipéo, la baleine dit « … est bâtie » à l’île-port terminée, alors que la Carte dit « Restaurée » : sa phrase est héritée de Blocland (`src/univers/archipeo/index.ts`, `...BLOCLAND.baleine`).
- La baleine nomme l’île sans article : « Plaine des nombres est bâtie », « Un chemin s’ouvre vers Mine des lettres » (`src/univers/blocland/index.ts`, reprise par Archipéo).

## Les incohérences à reprendre dans les cadrages

Relevées le 30 septembre 2026 en consolidant ; chacune se corrige dans le document qui la porte, par le fil qui le tient.

- L’univers d’un appareil sans choix vaut Blocland dans le code et dans le cadrage Archipéo (fils du lot 6, A), mais Archipéo à deux autres endroits (cadrage Archipéo, bascule ; [Plusieurs univers](../conception/univers.md), §5).
- « J6 » désigne à la fois l’objet `Habillage` ([Plusieurs univers](../conception/univers.md), §5) et la disposition en réseau ([Séparer le jeu du rendu](../conception/separation-jeu-rendu.md), §3).
- U4 n’est pas marqué fait dans sa ligne alors que J6, J7 et J8 le disent fait.
