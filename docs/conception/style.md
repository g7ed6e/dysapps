# Style « monde en blocs »

Le monde (3D et 2D) suit un style de monde en blocs, dessiné par le code et jamais emprunté. L’interface qui l’entoure est déjà celle d’Archipéo : des panneaux sobres, opaques et géométriques, dans la palette de la planche. Rien ne gêne la lecture : le texte à lire reste sur un fond uni, dans la police dys choisie.

Cette page décrit le style en ligne aujourd’hui. Le jeu migre vers Archipéo : la cible et les écarts sont dans le [cadrage « De Blocland à Archipéo »](cadrage-archipeo.md).

## Repères visuels

- **Palette** en jetons (`src/styles/global.css`) : fond crème froid `#F3EEE3`, panneaux `#FFFCF5`, texte bleu nuit `#13283D`, bordures `#566E7D` ; barre du haut en aplat bleu nuit ; accent de progression vert d’eau `#237A70` ; sable `#D9B26A` seulement en remplissage (étoile, liseré, étiquette), jamais en texte sur un fond clair ; succès vert `#1D6B45` sur `#DCEFE3`, attention brun `#8A4A10` sur `#F8E8D2`. Chaque contraste est vérifié et une couleur est toujours doublée d’un libellé ou d’une icône ; sur téléphone, pas d’onglets : la barre du haut garde le Menu et les Réglages en icônes.
- **Bouton retour** en pastille (flèche et nom de la page d’avant), toujours en haut à gauche ; **bouton Pause** carré en haut à droite pendant une partie ; menu pause sur un voile sombre.
- **Formes** : panneaux et cartes à angles de 12 px, boutons, champs et réponses à 8 px, étiquettes courtes en pastille ; bordures pleines de 2 px ; action principale en **bouton plein bleu pétrole** `#0E5A6E`, actions secondaires sur fond d’eau claire `#DCEBEA` ; appuyé, un bouton fonce, sans saut. Aucune ombre sur la page ; une seule ombre douce sous un panneau posé sur le monde (panneau d’île, bulles d’aide, liste des archipels). Les cartes d’une matière ou d’une île portent un **liseré** de sa couleur en tête ; l’endroit où l’on est, dans la barre du haut, est sur un aplat de sable.
- **Jauge d’XP** pleine et arrondie, remplie de vert d’eau, et **insigne de rôle** : un hexagone à la couleur du rôle, avec un pictogramme dessiné par le code (rose des vents, carte, arche, voilier, phare) ; un rôle pas encore gagné est en pointillé.
- **Icône de l’application** (écran d’accueil, PWA) : un « A » ouvert crème sur fond bleu nuit, posé sur deux vagues vert d’eau, avec une étoile de sable (`public/icon.svg`, et sa version à marge `icon-maskable.svg`).
- **Écran de lancement et écran titre** : la même icône, sur le fond crème de l’application ; à l’écran titre, elle tombe et se pose (coupé par « Réduire les animations »), sous le nom « Archipéo » dans la police des titres et une ligne dans la police de lecture.
- **Icônes** Lucide.
- **Site de documentation** : la même charte, dans `docs/.vitepress/theme/custom.css` : barre du haut bleu nuit avec l’icône et le nom « Archipéo », liens bleu pétrole (vert d’eau en sombre), page courante du sommaire sur un liseré de sable, titres de page et de partie en Montserrat grasse, texte en Luciole ; le thème sombre reprend le thème Nuit.

## Thèmes

- **Crème** (par défaut) : la palette ci-dessus.
- **Nuit** : fond `#0E1F2E`, panneaux `#16304A`, texte crème `#F3EEE3` ; l’action principale passe au sable `#E2B865`, texte bleu nuit ; accent `#4FB3A4`.
- **Clair** : le Crème sans teinte (fond `#F4F6F7`, panneaux et barre du haut blancs), plat, sans ombre.
- **Contraste élevé** : noir, blanc et jaune `#FFE600`, focus cyan ; angles de 4 px partout, sans ombre.

Les couleurs des matières (brique, verre, cristal) et des syllabes ne changent pas avec le thème de l’interface.

## Polices

- La police **des titres** (Montserrat grasse, embarquée par `@fontsource/montserrat`, aucune ressource externe) ne sert qu’aux titres courts et au logotype.
- Il n’y a plus de police pixel. Toute étiquette qui porte un sens (« Nouvelle partie », « Aventure », « Niveau 6e », le nom d’une créature, le compteur du tutoriel, l’épreuve du Gardien, les dates du journal) est dans la police de lecture choisie, en gras, en casse normale, à 18 px au moins ; le nom « Archipéo » est dans la police des titres.
- **Tout texte à lire** (consignes, phrases, corrections, panneaux) est dans la police dys choisie par l’élève : Luciole par défaut, OpenDyslexic, Atkinson Hyperlegible ou Arial.

## Textures

Chaque type de bloc a une **texture 16 × 16 générée par le code** (`src/blocland/world/pixels.ts`, les mêmes pixels dans toutes les vues du monde), sans lissage : herbe sur terre, pierre mouchetée, planches, sable, verre, or, cristal, feuilles, tronc, puis les blocs des îles du collège (brique, galet, obsidienne, glace, toile, panneau, tourbe, acier, calque, ardoise, parchemin, marbre, quartz, prisme, lentille) et les blocs de finition (toit, porte, lanterne, barrière, escalier). Ciel bleu et nuages en cubes. Aucune image ni texture empruntée à un jeu existant.

Les textures ne servent plus qu’à dessiner le monde ; dans l’interface, un bloc (inventaire, plans, récompenses) est un petit cube dessiné par le code. L’habillage (page, boutons, bandeaux, cartes) n’en a plus, ni biseau ni cadre crénelé, et aucune n’est **jamais placée derrière du texte**.

## En construction : le rendu Archipéo

Les élèves voient le monde en blocs décrit ici. Le rendu d’Archipéo se construit derrière un drapeau de développement (`?rendu=archipeo`, voir le [cadrage « De Blocland à Archipéo »](cadrage-archipeo.md), piste Rendu) et ne s’ouvre qu’au lot 6. Depuis le lot R1, il a en 3D :

- **une palette commune** (`src/blocland/world/palette.ts`) : par archipel, le ciel, la mer, la lumière, et une couleur de dessus et de côté pour chaque sol et chaque matière, de jour et de nuit ; les nuits restent un bleu de crépuscule, jamais un noir ;
- **un ciel en dôme dégradé**, du zénith à l’horizon, avec une lueur claire sur la ligne d’horizon ; **une brume de profondeur** de la couleur de l’horizon, qui fond les îles lointaines dans le ciel, jamais les noms d’îles ;
- **un soleil chaud et une ambiance froide** (la lune, froide, la nuit) : les faces au soleil sont dorées, les faces à l’ombre bleutées ;
- une ambiance par archipel : ciel d’été franc des Premiers Rivages, brume froide et plus proche des Îles Brumeuses, horizon couleur de poussière des Anciens Ateliers, ciel pâle et lavande des Îles du Ciel, sur leur plancher de nuages.

Depuis le lot R2, **le terrain n’est plus en cubes** : le sol et la roche des îles, des îlots des Gardiens et des îlots des monuments deviennent un maillage à facettes tiré de la grille de hauteurs (`src/blocland/world/landMesh.ts`) :

- une marche d’un bloc devient une pente douce, une marche de deux blocs ou plus reste une falaise, peinte en strates de deux blocs ;
- une case où quelque chose est posé (borne, maison, plan, décor, pont, monument) reste plate à sa hauteur : ce qui se construit case par case ne flotte jamais sur une pente ;
- la côte descend jusqu’à l’eau et se teinte de sable au bord de la mer ; sous les îles en altitude, la roche s’amincit en facettes ;
- les couleurs sont celles de la palette, nuancées selon l’option (b) retenue au lot R1 : plus sombres vers la mer, de larges taches sur les dessus, les couleurs voisines mêlées aux coins, pour que la grille ne se lise pas en damier.

La construction, le décor, les créatures et le bonhomme restent en cubes (lots R4 à R6) ; `?style=a|b|c` les peint de la palette selon les trois options de style du cadrage. La vue 2D et la vue simple ne changent pas.

## Univers et créatures

Univers, créatures et Gardiens sont dessinés en cubes (`src/blocland/Voxel.tsx`, `Creatures.tsx`, `Guardians.tsx`, `Avatar.ts`) ; noms et personnages sont originaux. La liste des créatures et des Gardiens, île par île, est dans [L’archipel](../pedagogie/archipel.md).

## Sons

Les sons sont générés par le code avec Web Audio, sans aucun fichier : un « toc » à la pose, un « pop » au retrait, un refus doux, un carillon de deux notes (en onde triangle, jamais carrée) quand un plan est terminé ou un Gardien vaincu, le tambour du Gardien, l’ambiance en option (vent, oiseaux le jour, grillons la nuit). Jamais de son pendant la lecture à voix haute ; réglages « Sons dans le village » et « Ambiance sonore du village ».

## Célébrations

Pas de pluie d’éclats ni de confettis : une réussite se voit à ce qu’elle transforme. Un bloc posé fait monter trois poussières claires de sa case ; une île qui s’ouvre, c’est la caméra qui y vole et sa créature qui accueille ; un plan terminé, c’est le bâtiment, son coffre et un carillon court. Le bandeau d’un succès ou d’un niveau apparaît en fondu, sans zoom. « Réduire les animations » coupe les poussières, les vols de caméra et les fondus, jamais ce qui a changé dans le monde.

## Ce que le style ne fait jamais

- Mettre du texte sur une texture ou une image.
- Utiliser la police des titres pour un texte à lire.
- Descendre sous 18 px ou sous un interlignage de 1,5.
- Emprunter une forme, une texture, un son ou un nom à un jeu existant.
