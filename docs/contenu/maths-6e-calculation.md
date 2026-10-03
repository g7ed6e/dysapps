---
lieu : maths-6e-calculation
module : Calcul et problèmes
matière : maths
classe : 6e
description : Tables, compléments, doubles et moitiés, puis les problèmes du port, avec des aides visuelles toujours affichées.
gardien : le Hanneton de bronze
icône : calculator
créature : Coco
---

# Plaine des nombres

## Champ des tables · `times-tables`

> Ses exercices sont produits par le code (`src/blocland/exercises/`), pas écrits ici.

- description : Une multiplication, et la grille de points pour la voir.
- compétences : c3.ma.nombres.faits-numeriques

## Pont de dix · `make-ten`

> Ses exercices sont produits par le code (`src/blocland/exercises/`), pas écrits ici.

- description : Trouve ce qui manque pour arriver à 10 ou à 100.
- compétences : c3.ma.nombres.calcul-mental

## Doubles et moitiés · `doubles-halves`

> Ses exercices sont produits par le code (`src/blocland/exercises/`), pas écrits ici.

- description : Le double ou la moitié d’un nombre, en deux étapes.
- compétences : c3.ma.nombres.calcul-mental

## Carnet du passeur · `word-problems`

> Ses exercices sont produits par le code (`src/blocland/exercises/`), pas écrits ici.

- description : Un pont, un quai, une traversée : lis le schéma, puis calcule la longueur, le tour ou l’heure.
- compétences : c3.ma.nombres.problemes · c3.ma.grandeurs.perimetre · c3.ma.grandeurs.durees

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-6e-calculation-1` | Le nid de Coco | 40 | Mon nid ! Merci, bâtisseur. Dix fenêtres, dix points : je m’y retrouve enfin. |
| `maths-6e-calculation-2` | Le toit du nid | 50 | Un toit et une porte ! La nuit, la lanterne compte les étoiles avec moi. |
| `maths-6e-calculation-3` | La cour du nid | 60 | Une cour, une barrière, un escalier… Cinq et cinq : mon nid est complet. Tu calcules comme un chef ! |

## Les demandes

### `maths-6e-calculation-request-1`

- habitant : Coco
- bloc : `french-6e-phonology`
- combien : 3
- petite construction : la boutique
- demande : Il me faut {objet} pour ma boutique. Joue une mission de la Forêt des sons.
- prête : Tu as les {blocs} ! Livre-les à Coco.
- posée : Boutique posée chez Coco !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : le comptoir et l’auvent rayé d’`echoppe()` : un comptoir de 3 bois devant, 2 poteaux de brique de 2 cubes derrière, un auvent de 3 cubes à z 2 (toit, brique, toit) ; 10 cubes, 6 cases, 3 de haut.
