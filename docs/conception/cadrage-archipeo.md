# Cadrage — « De Blocland à Archipéo » (direction artistique et game design)

Document de travail, **décidé le 27 septembre 2026** : le jeu migre de Blocland vers **Archipéo**. La cible est décrite par le dossier de game design et la planche visuelle rangés dans `design/archipeo/` (onze fichiers et `planche-archipeo.webp` ; leur provenance est dans `design/archipeo/PROVENANCE.md`). Ce cadrage en tire les grandes lignes, liste les écarts avec le jeu actuel et dit qui tranche. Rien n’est encore construit : le [style actuel](style.md) et le [cadrage du game design de Blocland](cadrage-blocland.md) décrivent toujours l’application en ligne.

L’agent `directeur-artistique` (voir [Contribuer](contribuer.md#les-deux-agents)) conduit cette migration côté game design et direction artistique. Le contenu pédagogique reste au Directeur contenu pédagogique, et les choix techniques à ceux qui écrivent le code.

## 1. Le besoin en une phrase

Faire d’un jeu de blocs pour réviser **une aventure maritime où le savoir reconstruit l’archipel**, avec un univers qu’un élève de 3e ne trouve pas enfantin. Promesse : « Le savoir construit ton monde. »

## 2. Ce qu’on garde absolument

- **Les règles dys** de [Principes](../pedagogie/principes.md), sans exception : texte à lire en HTML, sur fond uni, en police dys, lu à voix haute ; pas de chrono ; une action principale par écran ; indice jamais pénalisant ; aucune perte de progression.
- **Rien d’emprunté** : textes, formes, créatures, sons et noms originaux ; aucune ressource externe dans l’application.
- **La boucle qui existe déjà** : jouer, gagner des blocs, construire, ouvrir des îles. Archipéo la raconte autrement, il ne la remplace pas.

## 3. La cible

### 3.1 La boucle

Explorer, découvrir une mission, relever le défi, réussir ou recevoir une aide, gagner une ressource, construire ou réparer, voir le monde changer, explorer plus loin. Une réussite produit, quand c’est pertinent, **une conséquence visible dans le monde** : une passerelle réparée, un phare rallumé, un passage ouvert.

Trois échelles d’objectifs :

| Échelle | Objectif |
| --- | --- |
| Court terme | Réussir une mission |
| Moyen terme | Réparer un bâtiment ou une infrastructure |
| Long terme | Restaurer le village et construire le Bloc-Navire |

### 3.2 Les systèmes

- **Blocs** : récompense, ressource, langage visuel et matériau, cohérents avec l’architecture de chaque île.
- **Village** : le lieu de progression, en cinq états (abandonné, réactivation, reconstruction, développement, port vers l’archipel suivant).
- **Bloc-Navire** : construit morceau par morceau (coque, pont, mât, voiles, instruments, décoration, lancement).
- **Récompenses** : d’abord celles qui servent le monde (blocs, constructions, zones, personnalisation) ; XP, rangs et succès restent peu nombreux.
- **Rangs** : des rôles de l’univers, qui valorisent la progression plutôt que la performance.
- **Personnalisation** (plus tard) : bâtiments, décor, organisation du village, apparence et nom du navire ; jamais d’effet sur la difficulté.

### 3.3 L’univers

- **Le récit** : l’archipel, autrefois relié par des villages, des ponts, des ports et des phares, a été fragmenté ; le joueur le restaure.
- **La baleine** : figure tutélaire, calme, mystérieuse, bienveillante, un peu malicieuse, jamais une mascotte. Elle guide, signale, donne des indices et commente les grandes étapes (« Le mot de la baleine »).
- **Les oiseaux** : ils font vivre le ciel, relient les îles, portent des messages, signalent une zone active.
- **Quatre archipels**, un thème par classe : 6e Les Premiers Rivages (découverte), 5e L’Archipel des Brumes (exploration), 4e Les Anciens Ateliers (maîtrise), 3e L’Horizon (accomplissement).
- **Trois domaines, trois métaphores** : les maths sont les mécanismes, le français les archives, l’anglais les routes maritimes.
- **L’âge** : de la 6e à la 3e, la maturité vient de l’autonomie, de la complexité et de la profondeur (chaînes de missions, exploration moins guidée), jamais d’un ton plus sombre.

### 3.4 La direction artistique

- Aventure maritime stylisée, mystérieuse et chaleureuse : volumes simples, silhouettes fortes, architecture modulaire (bois, pierre, métal, quais, tours, phares), lumière atmosphérique, brume légère, horizon profond.
- Palette de la planche : bleu nuit, bleu pétrole, vert d’eau, sable, crème.
- Interface sobre, contrastée, géométrique, en panneaux opaques derrière l’information ; chaque destination a une icône, un libellé et un état.
- Célébrations élégantes : transformation du décor, son court, lumière ; pas de pluie de confettis.
- À éviter : esthétique préscolaire, mascottes aux gros yeux, pastel partout, boutons-jouets, effets agressifs, écrans chargés.

### 3.5 Les règles qui filtrent toute proposition

Les douze principes de `design/archipeo/design-principles.md` (DP-01 à DP-12) et les cinq règles de `direction-artistique.md` (DA-01 à DA-05). Les plus souvent citées :

- DA-01 : toute illustration peut être montrée à un élève de 3e ;
- DA-02 et DP-06 : le décor ne gêne jamais la lecture ;
- DA-04 et DP-03 : la progression se voit, avec un avant et un après ;
- DP-09 : les récompenses servent le monde ;
- DP-12 : pas de pression inutile.

## 4. Les écarts avec le jeu actuel

| Sujet | Archipéo (dossier, planche) | Aujourd’hui |
| --- | --- | --- |
| Nom | Archipéo | DysApps, Blocland |
| Style | Low-poly stylisé, lumière atmosphérique | Monde en blocs, textures 16 × 16 en pixels générées par le code ([Style](style.md)) |
| Polices de titre | Montserrat ou Poppins ; textes en Luciole | Archivo Black (affiche), Silkscreen (décor pixel) ; textes dans la police dys choisie |
| Archipels | Premiers Rivages, Brumes, Anciens Ateliers, Horizon | Basses Terres, Collines du Large, Monts de Feu, Îles du Ciel ([Blocland](cadrage-blocland.md)) |
| Rangs | Rôles : Explorateur, Navigateur, Bâtisseur, Architecte | Minerais : cuivre, fer, or, platine, diamant, légende |
| Guide | La baleine, voix de l’univers | Une créature par île-port (Coco, Bazar, Ixe, Fi) ; les baleines sont un décor |
| Village | Cinq états, jusqu’au port | Plans et ouvrages, monuments ([Blocland](cadrage-blocland.md)) |
| Vocabulaire | Missions | Quêtes, bornes, ouvrages, plans, Gardiens |

## 5. À décider

Chaque point se tranche dans ce cadrage avant d’être construit, lot par lot :

- **Le style en code** : comment un rendu low-poly reste « dessiné par le code », sans image ni texture importée.
- **Les rangs** : la planche en montre quatre, un par classe ; le dossier en propose cinq (avec Cartographe) ; l’échelle de minerais actuelle a six marches.
- **Le nom du 5e** : « L’Archipel des Brumes » dans le dossier, « Les Îles Brumeuses » sur la planche.
- **Le vocabulaire** : « mission » remplace-t-il « quête » à l’écran ?
- **Les créatures** des îles-ports et les Gardiens aux côtés de la baleine.
- **Les polices** : les polices de titre de la planche, sans ressource externe ; Luciole reste parmi les polices dys au choix de l’élève.
- **L’ordre des lots**, à partir des priorités du dossier : P0 accessibilité, lisibilité, cohérence de l’interface, boucle exercice → monde, âge cible ; P1 carte, village, constructions, retours, baleine ; P2 monde vivant, personnalisation, narration ; P3 événements, collections, cosmétiques.
