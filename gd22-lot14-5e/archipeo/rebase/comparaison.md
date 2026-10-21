# Lot 14, remis sur preview après le lot 13a : captures

Commit 2c0dec37 (un seul commit, sur `preview` 157c18fe : #484 GD-23 et #486 lot 13a, chaussées des Aiguilles et Donjon). Rendu logiciel (SwiftShader), horloge pilotée, le 5e tout construit sauf le Sémaphore ; « ruine » : aucune mission jouée, « restauré » : les cinq. Scripts hors du dépôt, dans le dossier de travail du fil (`captures14/prise-r1.mjs`, sessions `cap-*`, `chaussee`, `cartes`). On ne refait que ce qui change ; le reste est dans `captures-retouche1/`.

## Ce qui a changé dans le lieu

- **Le seuil.** La marche à mi-hauteur au sud de la cour se posait sur le disque de dalle par lequel la chaussée d’`aig-3` finit au nœud de la porte (0,22 au-dessus d’elle). Désormais la chaussée devient le seuil de la cour : une dalle large comme elle (3), du bord de la cour au nœud, 0,03 sous le disque (elle passe dessous, aucun sol entre les deux), puis une marche de 0,51 jusqu’à la cour. Rien du lieu n’est posé sur la chaussée (un test le vérifie).
- **La ruine générique** couchée du Sémaphore (`ruins5e.ts`, retouche 1 du lot 13a) est retirée : le lieu la remplace.
- **L’arrivée** : le Sémaphore ne passe plus par `TALL` mais par le regard d’arrivée du Donjon (`PlaceArt.arrivalView`), sans recul (`back` 1), le haut cadré au-dessus du mât. Même cadre qu’avant au cap de « Y aller » (`doorView` 0,25) ; « Y aller » le pose d’un coup, sans montée visible.
- **La Carte** : `mapPoint` est gardé (le point du nom, fixe) ; `nameAbove` ne fixe que le côté de l’étiquette.

## Image par image, avec la retouche 1 (`captures-retouche1/`)

**01, le cap de « Y aller »** :
- restauré, 1024 × 768 : la tour entière, le chapeau du mât à environ 47 px du haut (6 % de 768 = 46 : la limite du test ; avant, environ 50), les deux bras entiers, la drisse et ses fanions. Au premier plan, le bord de la cour et sa marche, puis les dalles de la chaussée sous Kéo. La bulle « Aucune mission à faire ici pour l’instant. » couvre les jambes de Kéo, pas le lieu.
- restauré, 800 × 1280 : tout le lieu, beaucoup d’air ; inchangé.
- restauré, 390 × 844 : le chapeau à environ 58 px du haut, le bout des deux bras dans l’image (le bras du bas touche presque la colonne d’icônes de gauche, sans être caché). Inchangé.
- ruine, aux trois tailles : la tour cassée, la cour aux joints rompus, le mât et les bras couchés le long du mur ouest, la corne renversée. Au sud, le disque de la chaussée sous Kéo et le bord de la cour derrière lui, une marche nette : plus de dalle posée sur la chaussée. Rien ne bouge (le haut de la ruine est déjà dans le cadre).

**02, l’arrivée par la chaussée** (restauré, `goTo` à pied depuis `aig-3`) :
- `02-arrivee-par-la-chaussee-restaure` : Kéo en marche, sur la chaussée dallée du lot 13a (joints, liseré), à mi-chemin ; l’aiguille voisine au fond.
- `02-arrivee-par-la-chaussee-restaure-arrive` : Kéo arrivé sur le disque du nœud, le panneau du lieu ouvert ; derrière lui, le seuil et la marche de la cour, la corne, le panier, le tonnelet, la porte. La chaussée rejoint la cour sans trou ni recouvrement. Le regard ne se lève pas ici : la caméra cadre le panneau (comme à tous les lieux), et Kéo arrive de l’est, pas au cap de la porte.

**08, la Carte** (Kéo devant la porte du Sémaphore dans les deux états) : « Le Sémaphore » au même endroit en ruine et restauré, en haut à gauche de l’île, au-dessus de « Toi » ; il ne couvre ni « Le Donjon » ni « L’Oracle ». Seule la coche change (restauré).

## Ce qui reste

- À 1024 × 768, l’air au-dessus du chapeau est juste à la limite du test (6 %) : un `back` un peu plus grand (1,1 à 1,2) en donnerait plus, au prix d’une tour plus petite ; au directeur artistique de dire s’il le veut.
- La marche à pied depuis `aig-3` n’est pas prise à mi-chemin du seuil (rendu logiciel trop lent pour la suivre de près).
