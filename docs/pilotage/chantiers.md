# État des chantiers

Cette page dit, chantier par chantier, où en est le projet : ce qui est construit, ce qui est en cours, ce qui attend une décision et de qui. Elle est le point d’entrée du mainteneur et des agents ; le détail reste dans les cadrages, cités à chaque ligne. **Mise à jour le 2 octobre 2026.**

Chaque pull request qui fait avancer un chantier met à jour sa ligne ici, dans la même pull request (règle du `CLAUDE.md`). C’est la seule page de `docs/pilotage/`, qui n’est pas publiée : le site (`www/`) s’adresse aux élèves, aux familles, aux enseignants et aux orthophonistes. Une décision de game design ne s’écrit pas ici mais dans le [game design](../gameplay/index.md) ; les univers sont dans [`docs/univers/`](../univers/univers.md), l’interface dans [`docs/ux-ui/`](../ux-ui/README.md), le rendu dans [`docs/rendu/`](../rendu/README.md).

## Les références

Chaque chantier a son préfixe ; on ne les mélange jamais (dans les fils, les pull requests et la doc).

| Préfixe | Chantier | Plan détaillé |
| --- | --- | --- |
| **lot 1** à **lot 11** | La migration vers Archipéo, piste Jeu et suite (en pause) | [Cadrage Archipéo](../univers/archipeo/cadrage.md), §6 |
| **R0** à **R7**, **R4b-6e** à **R4b-3e**, **S** | Le rendu d’Archipéo (en pause) | [Cadrage Archipéo](../univers/archipeo/cadrage.md), piste Rendu |
| **DA-1** à **DA-34** | Les retouches de la revue d’ensemble du directeur artistique | Liste tenue hors du dépôt par le fil « Revue d’ensemble du DA » ; résumé ci-dessous |
| **J0** à **J8**, **D** | Séparer le jeu du rendu | [Séparer le jeu du rendu](../conception/separation-jeu-rendu.md), §3 |
| **U0** à **U6** | Les univers | [Plusieurs univers](../univers/univers.md), §6 |
| **LV2-1** à **LV2-5** | La deuxième langue vivante | [Cadrage du contenu](../conception/cadrage-contenu.md), la LV2 |
| **C-1** à **C-15** | Le contenu pédagogique à couvrir | [Cadrage du contenu](../conception/cadrage-contenu.md), le plan |
| **M1** à **M5** | Le contenu écrit en Markdown, source du jeu et du site | [Contenu en Markdown](../contenu/README.md) et ci-dessous |
| **GD-n** | Les propositions de game design | [Game design](../gameplay/propositions/modele.md) |

À ne pas confondre : **DA-01** à **DA-05** (avec un zéro) sont les règles de direction artistique du dossier Archipéo (`docs/univers/archipeo/source/direction-artistique.md`), **DA-1** à **DA-34** les retouches du directeur artistique.

## Ce qui attend le mainteneur

| Quoi | Chantier | Recommandation |
| --- | --- | --- |
| Confier l’en-tête commun des écrans de calcul, qui fait défiler d’environ 124 px sur tablette (Faisceaux, Relevés, Thalès) | — | Un fil court, relu par le référent dys ; personne ne l’a pour l’instant |
| Entendre sur iPad et Android un nombre de dix chiffres lu en milliards (Nombres géants) | C-2 | — |
| La recherche « rien d’emprunté » sur « Jardin des heures » et ses replis | LV2-4 | — |
| Le premier voyage : nombre de Gardiens exigés (3, 2, 2) et taille du premier chantier | Blocland | Selon les retours des élèves |

### À vérifier sur tablette

- Images par seconde du monde 3D (`?mesures`), sur la tablette de référence (R0), dont le 3e avec le Refuge des carnets (les mesures de LV2-5 venaient du rendu logiciel).
- Fumées et brume, avec et sans « Réduire les animations » de l’appareil ; panache du volcan en portrait ; brume du 5e et planeur du 3e en vidéo.
- Scintillement des planches des ponts du 5e quand la caméra bouge ; mât de grue en 1024 × 768.
- Galets en colonnes (Rivière) : les cases de la multiplication et la potence en 1024 × 768 ; la voix des nombres de 1 000 et plus (« 2 550 ») et des décimaux (« 5,69 »).
- Voix : « Bâtie », la phrase de la baleine, « −1 » et « (0 ; 2) », « COD », « p.m. » en voix anglaise, les voix allemande et espagnole (heures, nombres, « Tú », « Sí », « viajo » et « viajó » qui se distinguent) ; la pause des « … » dans les répliques de fin des Gardiens de Blocland (« Je me pose… en pierre »).
- La respiration du Papillon de cuivre coupée par « Réduire les animations » de l’appareil.
- Écrans sans défilement en OpenDyslexic grande taille (ticket #231 : en 1024 × 768, les écrans avec document défilent).
- Toucher le sol pour promener le bonhomme : aucune marche lancée par un glissé, borne ou créature jamais ratée au profit du sol, rond du but lisible sur chaque sol (sable, herbe, neige, pierre claire). Reste connu : toucher une autre île pendant une marche fait repasser le bonhomme par la place de l’île visée.
- Îles-écoles agrandies : la statue du Gardien en téléphone portrait (on glisse pour la voir), le rallumage qui cadre la sentinelle plus loin, les noms de la Carte en OpenDyslexic et en grand texte (déjà incomplets avant : les Données au 3e, la Carrière au 6e et le Marais au 5e avec un panneau haut ; ticket à ouvrir).
- Faire glisser le monde au doigt (Recentrer) : confort du glissé, aucun toucher d’île déclenché par erreur après un glissé, second doigt ignoré ; sur téléphone en grand texte, « Recentrer » et une bulle du haut ne se chevauchent pas.
- Sur téléphone en grand texte : le défilement du panneau de la Carte et le nom de destination jamais sous le panneau (DA-31) ; les noms d’îles sous la bulle de la baleine (DA-10).

## Les chantiers

### L’accessibilité dans l’appli

Le contraste élevé et « Réduire les animations » dans l’application (ancien lot 11, pour tous les univers) sont à refaire : ils ont été retirés le 28 septembre 2026 (#196) ; la préférence de l’appareil s’applique toujours. Le contraste élevé devra aussi reprendre les yeux de Timbre dans Blocland (et, si Archipéo reprend, le fil clair de son Papillon).

### Séparer le jeu du rendu (J)

J0 à J5 et D construits ; l’habillage des univers (objet `Habillage`, textes dans `src/univers/`, couche `univers`) fait avec U4. J6, la disposition en réseau (le monde d’Archipéo en lieux sans marche), est en pause avec Archipéo. J7, le rangement des fichiers en `jeu/` et `disposition/` avec un test des couches sans exception, n’est pas fait.

### Les univers (U)

| Étape | État | Suite |
| --- | --- | --- |
| U0 à U3 | Faites | — |
| U4 (l’habillage sans changement d’image) | Code fait (#220, #222, #225) | Les noms propres à Blocland sont revenus avec [GD-1](../gameplay/propositions/GD-1.md) (Basses Terres, Collines du Large, Monts de Feu), avec leur écran de renommage, une fois par appareil ; reste le lexique court |
| Le caractère de Blocland ([GD-1](../gameplay/propositions/GD-1.md)) | Construit : la créature de l’île-école parle aux grandes étapes (Mousso, Bazar, Ixe, Fi, nom écrit et portrait dans la bulle) ; noms d’origine des archipels (Basses Terres, Collines du Large, Monts de Feu, Îles du Ciel), annoncés une fois à un élève qui jouait déjà (écran « De nouveaux noms ») ; rôles en métiers (Apprenti, Maçon, Mécanicien, Ingénieur, Architecte) et leurs succès ; geste et son de pose (logo qui se construit à l’écran titre, dernier bloc d’un plan qui s’enclenche, « clac » de pose ; dégel ciblé du dessin). Archipéo garde ses textes | Fusionné (#268, #286) ; attend la vidéo sur tablette du mainteneur |
| U5 (l’habillage pédagogique de Blocland) | À faire | Se cadre avec le directeur contenu pédagogique |
| U6 (un troisième univers) | Après les lots 8 et 8b | « Périple » abandonné pour l’instant |

Blocland est l’univers par défaut ; Archipéo se choisit dans les Réglages et n’est pas mis en avant (décisions 7 à 9 de [Plusieurs univers](../univers/univers.md)). Dans [Plusieurs univers](../univers/univers.md), la ligne U4 n’est pas marquée faite, alors que J6, J7 et J8 le disent : à reprendre par le directeur artistique, qui tient ce document. « J6 » y désigne aussi l’objet `Habillage`, alors que dans [Séparer le jeu du rendu](../conception/separation-jeu-rendu.md#3-les-étapes) J6 est la disposition en réseau : à reprendre de même par le directeur artistique.

### La deuxième langue vivante (LV2)

| Étape | État | Suite |
| --- | --- | --- |
| LV2-1 (socle, réglage), LV2-2 et LV2-3 (Relais des voyageurs, 5e), LV2-4 (Jardin des heures, 4e) | Fusionnées (#205, #215, #221, #232) | Voir les suites ci-dessous |
| **LV2-5** (Refuge des carnets, 3e) | Fusionnée (#252) | Les cinq étapes sont faites |

Les suites relevées par les relectures ne sont pas commencées : chacune attend le mot du mainteneur, qui choisit l’ordre. Les vérifications sur tablette sont plus haut ; le contenu (réponses du Relais, test de longueur, `ecouter.recit`, `culture.langages`, carte des Faux amis) est dans le [cadrage du contenu](../conception/cadrage-contenu.md#la-lv2--allemand-ou-espagnol-de-la-5e-à-la-3e) ; l’interface (titres de LV2 en syllabes, espace fine avant « : », « ? » et « ! », le mot « Écouter ») dans les [bonnes pratiques UX UI](../ux-ui/bonnes-pratiques.md#à-surveiller) ; le Papillon de cuivre, le toit de bardeau et les majuscules des répliques de Blocland dans son [cadrage](../univers/blocland/cadrage.md#le-monde-et-les-archipels) ; les nuages dans le [style](../rendu/style.md#lisibilité-du-monde). Restent ici :

- Les portraits du panneau d’île montrent le dos de toutes les créatures (Timbre y est une colonne brune) : les retourner tous d’un coup, dans une pull request à part, relue par les deux consultants et le référent dys.
- Le phare du 3e est hors du tiers central en 800 × 1280 (défaut d’avant le Refuge) : un lot de cadrage portrait.
- `engine.ts` : `Object.hasOwn(BLOCKS, id)` au lieu de `id in BLOCKS`, pour une sauvegarde abîmée.

### Le contenu en Markdown (M)

Décision du mainteneur (30 septembre 2026) : le contenu s’écrit en Markdown dans `docs/contenu/`, et ces fichiers produisent à la fois les JSON du jeu et les pages du site. Étapes : **M1** pilote sur une île (format, générateur, vérification en CI : la Baie des mots, fusionnée #254) ; **M2** tous les exercices (les 21 îles qui en ont, fusionnée #255 ; format allégé sur l’avis du directeur du contenu : lecture du trou et clé déduites, mot troué, tableaux pour les items courts, modèles par écran ; le barème reste dans les fichiers) ; **M3** les 31 îles et leurs missions de `biomes.ts` dans l’en-tête et les sections des fichiers, `src/blocland/iles.ts` produit, l’ordre dans `docs/contenu/archipel.md` (fusionnée #256) ; **M4** les pages du site produites depuis le Markdown : **sans objet**, le site est fabriqué depuis les données du jeu, que `npm run contenu` produit depuis `docs/contenu/` (une île ou un exercice modifié dans le Markdown change donc sa page au build suivant) ; **M5** les missions du portail (homophones, verbes irréguliers, textes à lire, vocabulaire : `docs/contenu/portail/`) et les plans des bâtiments (nom, XP, coffre, réplique : section « Les plans » à la fin du fichier de chaque île), fusionnée #257 ; la forme des bâtiments et les blocs restent dans le code. **Chantier fini** le 30 septembre 2026 : tout le contenu s’écrit dans `docs/contenu/` ([format](../contenu/README.md)). Les répliques des univers restent hors plan pour l’instant. Garantie à chaque étape : les JSON produits redonnent exactement les mêmes exercices, avec les mêmes identifiants.

### Le contenu (C)

Le plan C-1 à C-15 et l’ordre décidé sont dans le [cadrage du contenu](../conception/cadrage-contenu.md#le-plan-étape-par-étape) (#248), avec les points de la relecture du 28 septembre (#249). Depuis le 30 septembre 2026, le contenu avance en parallèle, un fil par groupe d’îles (décision du mainteneur).

| Étape | État |
| --- | --- |
| C-1 (Galets en colonnes, Rivière des fractions) | Fusionnée (#259) |
| C-2 (Nombres géants, Coulée de lave et Pente graduée au Volcan) | Fusionnée (#271) |
| C-3 (Troupeau, Ferme des accords ; mots-outils au Coffre) | Fusionnée (#263) |
| C-4 (Étages du sens, Tour du lecteur) | Fusionnée (#261) |
| C-5 (Vitraux des phrases, Tour du lecteur) | Fusionnée (#269) |
| C-6 (Facettes, Carrière des mots) | Fusionnée (#266) |
| C-7 (l’Aiguillage, le Cabinet des mots) | Fusionnée (#260) |
| C-8 (Observatoire des textes, qui est plein) | Fusionnée (#262) |
| C-9 (Signs, Baie des mots, qui est pleine) | Fusionnée (#264) |
| C-10 (Story time à l’Horloge, Stories au Théâtre) | Fusionnée (#265) |
| C-11 (Traditions à la Gare, École et médias au Studio) : l’anglais du plan est fini | Fusionnée (#267) ; suite, un bouton Écouter par ligne de lexique d’anglais (#275) |
| C-12 à C-14 (l’île des Grandeurs) | À cadrer avec le directeur artistique, les deux consultants et l’artiste technique 3D |
| C-15 (géométrie à figures) | Sans lot |

Encore ouverts : le découpage syllabique selon l’écrit ou selon l’oral (le référent dys tranche), le nom de Tunel et « Bien piochée ! » (le directeur artistique), « Entendre les choix » (technique).

### Combiner les blocs (GD-2)

Décidé par le mainteneur le 30 septembre 2026 ([GD-2](../gameplay/propositions/GD-2.md)) : un lieu de plus sur l’île de l’école (la Fabrique dans Blocland, la Halle aux matériaux dans Archipéo) où l’on assemble un bloc par archipel (Poutre, Vitrail, Engrenage, Miroir ; Madrier, Hublot, Poulie, Loupe dans Archipéo), que les huit monuments demandent. Recettes et noms dans `docs/contenu/assemblage.md`. **Construit** (#272, fusionnée). Aux Premiers Rivages, la Halle aux matériaux prend le colombage, comme l’école et la salle des trophées. Enveloppe de construction des archipels 5e à 3e : 7 100 → 7 260 triangles, somme des « autres » à 53 060 (« ok budget » puis « ok 7260 » du mainteneur, 1er octobre 2026 ; enveloppe commune avec la salle des trophées de GD-3). Reste ouvert : l’étiquette de l’île qui couvre le lieu, le hublot du phare du large (petit), l’icône du Hublot aux couleurs du vitrail, une explication courte des mots rares d’Archipéo (madrier, poulie, hublot). **Une question à chaque bloc assemblé** (décision du mainteneur, 1er octobre 2026) : construite dans la même pull request. 12 questions par bloc sur les deux matières de la recette (`docs/contenu/assemblage.md`, « Les questions »), posées en plein écran sur l’écran des documents à lire ; un tirage par élève et par bloc (jamais l’une des 6 dernières ; une manquée revient après 6 autres, règle du mainteneur), gardé dans la sauvegarde (`assemblageTirage`, optionnel) ; une erreur ne fait rien perdre et laisse un second essai. Les questions d’assemblage comptent dans l’horloge de séance (trois exercices ou dix minutes) : la pause s’affiche à la fin d’une question (choix du mainteneur, 1er octobre 2026). La pause du bilan de mission est alignée sur celle de l’assemblage, un seul composant (`PauseSeance.tsx`) : bouton Écouter, retour sans historique, focus sur « J’arrête pour aujourd’hui », puis sur le bouton principal après « Encore un peu » (#296).

### Le monde ouvert au centre (GD-4)

Décidé par le mainteneur le 2 octobre 2026 ([GD-4](../gameplay/propositions/GD-4.md)) : trois étapes, dans l’ordre (tout dans le monde, chemins au choix, explorer pour découvrir). Étape 1 : la créature qui se souvient et propose les révisions dans le monde. Les niveaux d’île, d’abord retenus, sont retirés le même jour au profit du modèle A de GD-5. Rien n’est construit ; chaque étape aura sa fiche avant son lot. Les trois modèles de boucle de [GD-5](../gameplay/propositions/GD-5.md) (décidés le même jour) : le modèle A (chaque mission est une demande de l’habitant ; l’île reconstruite devient fournisseur) rejoint l’étape 1, avec des blocs qui se posent tout seuls et restaurent le bâtiment de l’île, qui produit ensuite son bloc pour le reste du monde ; B et C attendent des maquettes. La boucle des blocs, éprouvée par le directeur artistique dans quatre moments, est fixée par [GD-6](../gameplay/propositions/GD-6.md) (décidée le même jour) : une partie du bâtiment par mission, le bloc de l’île de l’école dès le début, les plans devenus les parties des missions (coffres retirés, or et cristal en trophées), le bloc d’une île restaurée par les missions rejouées et les révisions, seul le bâtiment posé tout seul, les blocs des archipels quittés demandés ensuite. Rien n’est construit ; les avis des consultants et du référent dys sont à recueillir sur la fiche du lot. Étape 2, des chemins au choix : [GD-7](../gameplay/propositions/GD-7.md) (décidée le même jour), le port en étoile, sans Gardien comme condition d’une liaison, avec des demandes d’habitants qui posent un petit ouvrage (trois au plus). Rien n’est construit.

### Le jeu themable

Décidé par le mainteneur le 2 octobre 2026 : le jeu est « themable ». [Le jeu](../gameplay/index.md) le décrit une seule fois, en mots neutres (région, lieu, liaison, ressource, construction, partie, habitant, gardien, défi…), avec les décisions GD-2 à GD-7 versées dedans ; `systemes.md` y est fondu ; Blocland n’apporte que sa table de mots ([fiche](../univers/blocland/fiche.md#les-mots-de-blocland)), son récit et son dessin. La sauvegarde parle en mots neutres, en anglais (décision du mainteneur, 2 octobre 2026 : « Tout neutre », « Privilégie l’anglais ») pour ses **clés et ses champs** : `dysapps:game` (version 2, `stock`, `world` avec `parts`, `links`, `place`, `log`), `resume`, `tutorials`, `guide-messages`, `guardians-seen`, `region-names`, `universe-message`, les compteurs de `progress` et les valeurs des réglages ; une sauvegarde ancienne est traduite au chargement sans rien perdre, l’ancienne clé effacée seulement après relecture, et un fichier de sauvegarde ancien se restaure puis passe par la même traduction (`core/migration.ts`). **Reste** : les identifiants du contenu (lieux, ressources, parties, liaisons, grandes constructions, exercices) et les anciennes adresses, à la pull request suivante, en gardant le niveau adapté et la répétition espacée de chaque question quand les identifiants de quête changent ; les mots de Blocland pour la commande et l’aménagement, et les textes qui demandent encore un Gardien vaincu pour le tunnel et le col (`decouverteOuvrages`, `ouvrageGardien`, `gardienDabord`), au lot de GD-7 ; expliquer « commande » et « aménagement » la première fois, dans chaque univers ; sortir les « à faire » qui restent dans les documents de référence vers cette page. Questions sorties de l’ancien index du game design, toujours ouvertes : le nombre de défis exigés pour le premier passage et la taille du premier chantier (retours des élèves) ; combien d’élèves entrent à l’école depuis le monde (observation en classe) ; la personnalisation (lot 10, « Un village à soi ») ; ce que doit fournir un troisième univers (U6) ; la place des problèmes situés (aide `scene`) dans la boucle ; les répliques des habitants encore communes aux univers (reste de R6).

### La documentation rangée par métier

Demande du mainteneur (2 octobre 2026) : un dossier pour le gameplay, un pour les univers, un pour l’UX UI et un pour le rendu. Piste « quatre dossiers » choisie le même jour, après l’avis du directeur artistique et de l’expert frontend : [`docs/gameplay/`](../gameplay/index.md), [`docs/univers/`](../univers/univers.md) (avec `archipeo/` et `blocland/` ; `design/` y entre, le dossier fourni par le mainteneur figé dans `archipeo/source/`), [`docs/ux-ui/`](../ux-ui/README.md) et [`docs/rendu/`](../rendu/README.md) ; `pilotage/` ne garde que l’état des chantiers. Première pull request : les fichiers déplacés tels quels et les liens corrigés. Suites, chacune dans sa pull request : découper le cadrage de Blocland (les systèmes communs vers `docs/gameplay/`) et le style (repères et polices vers `ux-ui/`, habillages vers chaque univers) ; relier `archipeo/source/accessibilite-dys.md` aux bonnes pratiques dys. Pour éviter une nouvelle dérive (mainteneur, 2 octobre 2026), `AGENTS.md` donne les questions qui disent où ranger un document, et les règles qui l’empêchent de dériver (compléter plutôt que créer, un sujet à un seul endroit, aucune place nouvelle sans décision, un gardien par dossier). **Rangement et allègement de tous les dossiers** (demande du mainteneur, 2 octobre 2026, après un audit des six gardiens) : une pull request par découpe. La première aligne les règles, répare les liens et ajoute leur test ; la deuxième sort du cadrage de Blocland les règles communes vers une page à part, `systemes.md` (choix du mainteneur), fondue depuis dans [Le jeu](../gameplay/index.md) et l’ergonomie vers les [bonnes pratiques UX UI](../ux-ui/bonnes-pratiques.md#le-parcours-et-le-monde). La troisième retire les doublons et les phrases périmées de Blocland ; la quatrième découpe le style (le rendu d’Archipéo vers son dossier, le grand texte vers l’UX UI) ; la cinquième range le cadrage d’Archipéo, gelé (de 654 à 473 lignes : trois décisions communes vers [Les décisions](../gameplay/decisions.md), le socle du rendu vers l’architecture, l’écran du défi vers l’UX UI, les fils finis réduits à leurs décisions). La sixième, la dernière, allège le pilotage et la conception : `docs/pilotage/` ne garde que cette page (les suites de la LV2 et l’ancien sommaire du dossier y sont fondus ou rangés chez leurs métiers), les états des étapes C-n et J quittent les cadrages pour cette page.

### Les agents

Huit agents dans `.claude/agents/`, décrits dans [Contribuer](../conception/contribuer.md#les-agents). Le dernier venu, le **consultant UX UI** (`consultant-ux-ui`, demandé par le mainteneur le 1er octobre 2026), relit l’ergonomie et l’interface des écrans communes aux univers, sous l’autorité du directeur artistique, avec ses [bonnes pratiques UX UI](../ux-ui/bonnes-pratiques.md) ; il est consulté avant toute pull request qui change un écran, un composant, la navigation ou un parcours.

### L’allègement de l’interface

Demande du mainteneur (1er octobre 2026) : l’interface est trop chargée, on n’arrive pas à agir dans le monde, il y a trop à lire, certaines fenêtres ne se ferment pas. **Fait** : les fenêtres qui coinçaient, puis les huit points choisis par le mainteneur (1er octobre 2026), cadrés par le directeur artistique et relus par tous les agents (#276, fusionnée) : plus de barre du haut sur l’écran du monde, soleil et lune dans les Réglages, tutoriel du village en trois bulles, ouvrages et Bloc-Navire dits par les créatures, une seule ligne dans le pli de la Carte, panneau d’île missions d’abord et qui reste replié, Blocs, monument, École et Trophées plus courts ; le défi du Gardien qui tient dans l’écran, **DA-34**, proposée par le directeur artistique et décidée par le mainteneur le 1er octobre 2026 (#284, fusionnée), avec, dans Archipéo, la règle ouverte au premier défi repliée dès la première épreuve (choix du mainteneur, 1er octobre 2026, qui modifie DA-28) ; ses suites, sur le « go » du mainteneur du 1er octobre 2026 (#287, fusionnée) ; la caméra (glisser, Recentrer) dans son propre fil (#277). Ce que font ces écrans est dans le [manuel](../../www/manuel/blocland.md), les [bonnes pratiques UX UI](../ux-ui/bonnes-pratiques.md#le-parcours-et-le-monde) et le [style](../rendu/style.md#lisibilité-du-monde). **Reste** : le grand texte sur téléphone, où le défi défile ; Archipéo sur téléphone est en pause (plus bas).

### Les îles-écoles agrandies

Demande du mainteneur (1er octobre 2026) : agrandir les îles pour la lisibilité, la grille sous la caméra, pas la caméra. Décidé par lui : un cœur de 20 × 20 au lieu de 16 × 16 pour les seules îles qui reçoivent un bâtiment en plus, les quatre îles-écoles (Forêt, Marché, Atelier, Phare), avec de la vraie terre en plus et leurs voisines écartées (ponts à ±2 cases) ; l’enveloppe du sol des archipels autres que le 6e passe de 24 100 à 24 760 triangles (accord écrit du mainteneur). L’îlot du Gardien des îles-écoles glisse sur le côté pour ne plus cacher la créature ni l’école. Sauvegardes et identifiants inchangés. Passage final du directeur artistique (1er octobre 2026) : la baleine du 5e cachée derrière le Marché nage en eau libre, visible depuis le port ; la rangée de côte devant les bornes des îles-écoles reste nue (les champignons rouges de la Forêt, les fanions du quai du Marché déplacés) ; les jalons des marges glissent et changent de genre. Fusionnée (#290). Redistribution « Trois bandes » choisie par le mainteneur le 2 octobre 2026 : **fusionnée** (#300). Devant, les bornes seules au pas de 4 ; au milieu, la salle puis l’école en (12, 3) ; au fond, la zone des plans en 6 × 6 et la Halle en (15, 11) ; plateau rogné aux colonnes 9 à 11 ; sol du 4e sous son enveloppe (24 758 / 24 760). Écart du toit tranché par le directeur artistique (2 octobre 2026) : au Marché et à l’Atelier, les plans se dessinent une rangée plus au fond (y 11 à 15), clés de sauvegarde inchangées ; retouches des relectures faites (table à dessin de l’Atelier contre la salle, arbre de la Forêt derrière la salle, étal du Marché d’une case plus court, rien devant la porte d’un lieu). À l’Atelier, la cloche d’or du clocheton de l’école cache le bas de deux cases de la première rangée de plans (12 points sur 45 au plus) : acceptée par le directeur artistique (la signature de l’école). **Point à suivre, lot à part** : au Phare, la petite tour du phare du cœur cache deux trophées de la salle à sa plus grande (d’avant ce lot ; piste du consultant de Blocland : la glisser d’une case, même dessin). À vérifier sur tablette : toucher la borne du bout de la rangée sans ouvrir l’école ; toucher une case de plan au bord de la cloche de l’Atelier. Ensuite, à décider : l’îlot sur le côté pour les autres îles (proposé par le directeur artistique, lot à part).

### Les captures d’écran

Demande du mainteneur (1er octobre 2026) : moins de captures, prises plus vite. **Chantier fini** : les captures accélérées et reproductibles (#291), moins de captures, comparées aux références de `main` (accord écrit du mainteneur, 1er octobre 2026, sur l’avis du directeur artistique ; #292), les captures d’un lot prises sur la CI (« Ok pour 1 » du mainteneur, 1er octobre 2026 ; #293) ; puis le travail de l’artiste technique 3D (« go 1 2 3 » du mainteneur, 1er octobre 2026) et quatre points de méthode (« Ok pour les 4 points additionnels », 1er octobre 2026 : proposer deux ou trois pistes avant de construire, relire un commit figé, une deuxième passe chez le seul relecteur qui avait demandé un ajustement, `sceneCostArchipeo` qui compte les personnages fusionnés) (#294). La méthode, qui lance quoi et comment relire, est dans le skill [`captures`](../../.claude/skills/captures/SKILL.md) et dans le `CLAUDE.md` (« Proposer avant de construire ») ; les commandes dans [Contribuer](../conception/contribuer.md#mettre-en-route). La Carte d’Archipéo, qui dessine trop d’appels, est en pause (plus bas).

## En pause : Archipéo

Décision du mainteneur (2 octobre 2026) : le projet Archipéo est arrêté, il sera peut-être repris plus tard ; le nouveau gameplay se met en place dans Blocland seul. Le code d’Archipéo reste dans l’application, et [son dossier](../univers/archipeo/cadrage.md) est gelé tel quel. Rien de ce qui suit ne reprend sans le mot du mainteneur ; le détail est dans le cadrage d’Archipéo et dans l’historique git de cette page.

- **Lots** : 1 à 6 construits (le lot 6, à deux univers, fini le 29 septembre 2026, #241) ; lot 7 : 7a, 7b (le 6e en colombage), l’école, la salle des trophées et la Halle au kit du 6e fusionnés ; le bardage des pignons, 7c, 7d et 7e ne sont pas faits ; lots 8 (l’Horizon et le navire), 8b (la Carte en 3D), 9 (l’archipel vivant) et 10 (un village à soi) pas commencés, avec la disposition en réseau (J).
- **Rendu (R)** : R0 à R7, S, les quatre R4b, R5 et R6 construits ; la 2D peinte (R7) reste dans le code sans écran qui l’affiche. Restes de R6 : répliques des créatures et mot de la baleine propres à Archipéo, miniature du panneau d’île.
- **Retouches du directeur artistique** : les cumulus d’Archipéo (fin de DA-35), DA-1, DA-2, DA-12, DA-13, DA-22 (la vidéo de l’oiseau planeur), DA-33 ; Archipéo sur téléphone au défi du Gardien, qui déborde encore.
- **Le flux de l’idée aux assets** : le cadre (une fiche par asset, licence, budget, hors ligne) et le banc d’essai sur un Gardien d’Archipéo ne sont pas faits.
- **Les questions gelées** : voir sur tablette le 7b ; le budget des bornes du 6e ; la limite des 40 appels de dessin par archipel ; les étiquettes de la Carte réunies en un seul objet (la Carte d’Archipéo dessine 51 à 67 appels) ; la baleine d’Archipéo qui dit « … est bâtie » à l’île-port terminée (la Carte dit « Restaurée ») et nomme l’île sans article (« Un chemin s’ouvre vers Mine des lettres », `src/univers/archipeo/index.ts`).
- **Les suites de la LV2 dans Archipéo** : le bleu ardoise des mares du 3e à voir sur capture et à faire valider par son consultant, le bardeau du Refuge au kit d’architecture du 3e, le crème de Timbre arrêté à la poitrine (proposition à trancher), les marges du budget du 3e après le Refuge (mer 4 550, décor 9 350, construction 7 100, bornes 720, navire 430, total 52 300) à valider par le mainteneur.
