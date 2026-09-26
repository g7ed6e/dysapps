# Style « monde en blocs »

L’interface entière suit un style de monde en blocs, dessiné par le code et jamais emprunté. Il habille l’application sans jamais gêner la lecture : le texte à lire reste sur un fond uni, dans la police dys choisie.

## Repères visuels

- **Fond crème** `#FBF6EA` à grain pixel très discret ; barre du haut en terre et herbe.
- **Boutons de pierre** à biseau pixel, et d’herbe pour l’action principale ; panneaux à coins carrés et biseau ; bandeaux texturés (herbe, planches, pierre, sable, or) en tête des cartes.
- **Jauge d’XP segmentée** et **écusson de rang** en pixels : contour crénelé, minerai du rang à l’intérieur (cuivre, fer, or, platine, diamant, légende).
- **Icône de l’application** (écran d’accueil, PWA) : un bloc d’herbe isométrique en pixels sur fond de ciel, générée par un script comme les textures.
- **Icônes** Lucide.

## Polices

- La police **« affiche »** (Archivo Black) ne sert qu’aux titres courts.
- La police **pixel** (Silkscreen) ne sert qu’au logo et aux compteurs.
- **Tout texte à lire** (consignes, phrases, corrections, panneaux) est dans la police dys choisie par l’élève : Luciole par défaut, OpenDyslexic, Atkinson Hyperlegible ou Arial.

## Textures

Chaque type de bloc a une **texture 16 × 16 générée par le code** (`src/styles/textures/` pour l’interface, `src/blocland/three/textures.ts` pour la 3D), sans lissage : herbe sur terre, pierre mouchetée, planches, sable, verre, or, cristal, feuilles, tronc, puis les blocs des îles du collège (brique, galet, obsidienne, glace, toile, panneau, tourbe, acier, calque, ardoise, parchemin, marbre, quartz, prisme, lentille) et les blocs de finition (toit, porte, lanterne, barrière, escalier). Ciel bleu et nuages en cubes. Aucune image ni texture empruntée à un jeu existant.

Les textures ne sont **jamais placées derrière du texte**. Les thèmes Clair et Contraste élevé restent plats, sans texture ni biseau.

## Univers et créatures

Univers, créatures et Gardiens sont dessinés en cubes (`src/blocland/Voxel.tsx`, `Creatures.tsx`, `Guardians.tsx`, `Avatar.ts`) ; noms et personnages sont originaux. La liste des créatures et des Gardiens, île par île, est dans [L’archipel](../pedagogie/archipel.md).

## Sons

Les sons sont générés par le code avec Web Audio, sans aucun fichier : un « toc » à la pose, un « pop » au retrait, un refus doux, le tambour du Gardien et sa fanfare, l’ambiance en option (vent, oiseaux le jour, grillons la nuit). Jamais de son pendant la lecture à voix haute ; réglages « Sons dans le village » et « Ambiance sonore du village ».

## Ce que le style ne fait jamais

- Mettre du texte sur une texture ou une image.
- Utiliser la police d’affiche ou la police pixel pour un texte à lire.
- Descendre sous 18 px ou sous un interlignage de 1,5.
- Emprunter une forme, une texture, un son ou un nom à un jeu existant.
