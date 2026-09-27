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

## Univers et créatures

Univers, créatures et Gardiens sont dessinés en cubes (`src/blocland/Voxel.tsx`, `Creatures.tsx`, `Guardians.tsx`, `Avatar.ts`) ; noms et personnages sont originaux. La liste des créatures et des Gardiens, île par île, est dans [L’archipel](../pedagogie/archipel.md).

## Sons

Les sons sont générés par le code avec Web Audio, sans aucun fichier : un « toc » à la pose, un « pop » au retrait, un refus doux, le tambour du Gardien et sa fanfare, l’ambiance en option (vent, oiseaux le jour, grillons la nuit). Jamais de son pendant la lecture à voix haute ; réglages « Sons dans le village » et « Ambiance sonore du village ».

## Ce que le style ne fait jamais

- Mettre du texte sur une texture ou une image.
- Utiliser la police des titres pour un texte à lire.
- Descendre sous 18 px ou sous un interlignage de 1,5.
- Emprunter une forme, une texture, un son ou un nom à un jeu existant.
