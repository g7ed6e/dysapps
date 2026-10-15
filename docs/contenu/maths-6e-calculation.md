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

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Une multiplication, et la grille de points pour la voir.
- compétences : c3.ma.nombres.faits-numeriques

## Pont de dix · `make-ten`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Trouve ce qui manque pour arriver à 10 ou à 100.
- compétences : c3.ma.nombres.calcul-mental

## Doubles et moitiés · `doubles-halves`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Le double ou la moitié d’un nombre, en deux étapes.
- compétences : c3.ma.nombres.calcul-mental

## Carnet du passeur · `word-problems`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Un pont, un quai, une traversée : lis le schéma, puis calcule la longueur, le tour ou l’heure.
- compétences : c3.ma.nombres.problemes · c3.ma.grandeurs.perimetre · c3.ma.grandeurs.durees

## Mesures et figures · `measures`

- description : Aire, volume, angles et solides, puis triangles, cercles et petits tableaux, tout dit en mots et en nombres.
- compétences : c3.ma.grandeurs.aire · c3.ma.grandeurs.volume · c3.ma.espace.angles · c3.ma.espace.figures-solides · c3.ma.espace.relations · c3.ma.espace.triangles · c3.ma.donnees.donnees
- consigne : Lis la phrase ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-6e-calculation
- blocs : 4
- XP : 12
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-6e-calculation-measures-1`

Pour tous les items :
- aide « Aires, volumes, angles » :
  - Aire d’un rectangle = longueur × largeur. Aire d’un carré = côté × côté.
  - L’aire, c’est la surface ; le périmètre, c’est le tour.
  - 1 cm³ : le volume d’un petit cube de 1 cm de côté.
  - Aigu : moins de 90°. Droit : 90°. Obtus : entre 90° et 180°.
  - Cylindre : 2 disques et une face courbe. Cône : 1 disque et une pointe.

1. énoncé : Un rectangle mesure 5 cm sur 3 cm. Son aire est …
   - lu : Un rectangle mesure 5 centimètres sur 3 centimètres. Son aire est de combien de centimètres carrés ?
   - choix : 8 cm² · 15 cm² · 16 cm²
   - réponse : 15 cm²
   - indice : L’aire d’un rectangle : longueur × largeur.
   - explication : 5 × 3 = 15 : l’aire est 15 cm². 16 cm², c’est le tour, le périmètre : 5 + 3 + 5 + 3. 8 cm², c’est 5 + 3.
   - figure : plane rectangle 5 · 3 / aire ?
2. énoncé : Un carré a des côtés de 6 cm. Son aire est …
   - lu : Un carré a des côtés de 6 centimètres. Son aire est de combien de centimètres carrés ?
   - choix : 12 cm² · 24 cm² · 36 cm²
   - réponse : 36 cm²
   - indice : L’aire d’un carré : côté × côté.
   - explication : 6 × 6 = 36 : l’aire est 36 cm². 24 cm², c’est le périmètre, 4 × 6 ; 12 cm², c’est 6 × 2.
   - figure : plane carré 6 / aire ?
3. énoncé : "Un pavé fait de petits cubes de 1 cm³\nUne couche : 4 cubes sur 2 cubes.\nIl y a 3 couches."
   - question : Quel est le volume du pavé ?
   - lu : Un pavé fait de petits cubes de 1 centimètre cube. Une couche, 4 cubes sur 2 cubes. Il y a 3 couches.
   - choix : 8 cm³ · 9 cm³ · 24 cm³
   - réponse : 24 cm³
   - indice : Combien de cubes dans une couche ? Puis : combien de couches ?
   - explication : Une couche a 4 × 2 = 8 cubes. 3 couches : 3 × 8 = 24 cubes, donc 24 cm³. 8 cm³, c’est une seule couche ; 9 cm³, c’est 4 + 2 + 3.
   - figure : solide cubes 4 · 2 · 3
4. énoncé : "Deux boîtes remplies de petits cubes de 1 cm³\nBoîte A : 2 couches de 6 cubes.\nBoîte B : 3 couches de 4 cubes."
   - question : Quelle boîte a le plus grand volume ?
   - lu : Deux boîtes remplies de petits cubes de 1 centimètre cube. Boîte A, 2 couches de 6 cubes. Boîte B, 3 couches de 4 cubes.
   - choix : la boîte A · la boîte B · elles ont le même volume
   - réponse : elles ont le même volume
   - indice : Compte les cubes de chaque boîte.
   - explication : Boîte A : 2 × 6 = 12 cubes. Boîte B : 3 × 4 = 12 cubes. 12 cm³ chacune : elles ont le même volume, même si B a plus de couches.
   - figure : solide cubes 3 · 2 · 2 / 2 · 2 · 3
5. énoncé : Un angle de 120° est un angle …
   - lu : Un angle de 120 degrés est un angle (mot manquant).
   - choix : aigu · droit · obtus
   - réponse : obtus
   - indice : 120°, c’est plus ou moins que 90° ?
   - explication : 120° est plus grand que 90° et plus petit que 180° : l’angle est obtus. Un angle aigu mesure moins de 90°.
   - figure : angle 120
6. énoncé : Un angle de 45° est un angle …
   - lu : Un angle de 45 degrés est un angle (mot manquant).
   - choix : aigu · droit · obtus
   - réponse : aigu
   - indice : 45°, c’est plus ou moins que 90° ?
   - explication : 45° est plus petit que 90° : l’angle est aigu. C’est la moitié d’un angle droit.
   - figure : angle 45
7. énoncé : Un tube de colle a deux bases en disque et une face courbe : c’est un …
   - choix : cône · cylindre · pyramide
   - réponse : cylindre
   - indice : Combien de disques ? Relis la dernière ligne du rappel.
   - explication : Deux disques et une face courbe : c’est un cylindre. Le cône n’a qu’un disque et une pointe ; la pyramide n’a que des faces plates.
   - figure : solide cylindre
8. énoncé : "Le sport préféré des élèves de 6e B\nFoot : 9 élèves\nDanse : 6 élèves\nNatation : 4 élèves\nHand : 6 élèves"
   - question : Combien d’élèves de plus ont choisi le foot que la natation ?
   - lu : Le sport préféré des élèves de sixième B. Foot, 9 élèves. Danse, 6 élèves. Natation, 4 élèves. Hand, 6 élèves.
   - choix : 4 · 5 · 13
   - réponse : 5
   - indice : Trouve la ligne du foot et celle de la natation. Combien de plus ?
   - explication : Foot : 9, natation : 4. 9 − 4 = 5 élèves de plus. 13, c’est 9 + 4 : on a ajouté au lieu de chercher l’écart ; 4, c’est la natation seule.
   - figure : diagramme foot · danse · natation · hand / 9 · 6 · 4 · 6

### Niveau 2 · `maths-6e-calculation-measures-2`

Pour tous les items :
- aide « Triangles, cercles, aires » :
  - Dans un triangle, les trois angles font 180° en tout.
  - Isocèle : deux angles égaux. Équilatéral : trois angles égaux. Rectangle : un angle droit, de 90°.
  - Le diamètre d’un cercle vaut deux rayons.
  - Un point de la médiatrice d’un segment est à la même distance de ses deux bouts.
  - 1 m² = 100 dm². 1 dm² = 100 cm².
  - Un tableau : lis chaque ligne, et garde celles qui vont.

1. énoncé : Un triangle a un angle de 40° et un angle de 60°. Son troisième angle mesure …
   - lu : Un triangle a un angle de 40 degrés et un angle de 60 degrés. Son troisième angle mesure combien de degrés ?
   - choix : 80° · 100° · 140°
   - réponse : 80°
   - indice : Les trois angles font 180°. Combien font déjà les deux premiers ?
   - explication : 40 + 60 = 100, et 180 − 100 = 80 : le troisième angle mesure 80°. 100°, c’est la somme des deux premiers ; 140°, c’est 180 − 40, en oubliant l’angle de 60°.
   - figure : angles 40 · 60 · ?
2. énoncé : Un triangle isocèle a un angle de 80°. Ses deux autres angles sont égaux. Chacun mesure …
   - lu : Un triangle isocèle a un angle de 80 degrés. Ses deux autres angles sont égaux. Chacun mesure combien de degrés ?
   - choix : 50° · 80° · 100°
   - réponse : 50°
   - indice : 180 − 80 donne les deux angles égaux ensemble. Puis partage en deux.
   - explication : 180 − 80 = 100 pour les deux angles égaux ensemble, donc 100 ÷ 2 = 50° chacun. 100°, c’est oublier de partager en deux ; 80°, c’est croire que les trois angles sont égaux.
   - figure : angles 80 · ? · ? / isocèle
3. énoncé : Un triangle rectangle a un angle de 30°. Son troisième angle mesure …
   - lu : Un triangle rectangle a un angle de 30 degrés. Son troisième angle mesure combien de degrés ?
   - choix : 30° · 60° · 150°
   - réponse : 60°
   - indice : Un triangle rectangle a aussi un angle droit, de 90°.
   - explication : Les angles font 180° : 90 + 30 = 120, et 180 − 120 = 60°. 150°, c’est oublier l’angle droit ; 30°, c’est recopier l’angle donné : rien ne dit que les deux autres angles sont égaux.
   - figure : angles 90 · 30 · ?
4. énoncé : Dans un triangle équilatéral, chaque angle mesure …
   - lu : Dans un triangle équilatéral, chaque angle mesure combien de degrés ?
   - choix : 60° · 90° · 180°
   - réponse : 60°
   - indice : Les trois angles sont égaux et font 180° en tout.
   - explication : 180 ÷ 3 = 60 : chaque angle mesure 60°. 180°, c’est la somme des trois ; 90°, c’est l’angle droit, qu’un triangle équilatéral n’a pas.
   - figure : angles ? · ? · ? / équilatéral
5. énoncé : Un cercle a un rayon de 4 cm. Son diamètre mesure …
   - lu : Un cercle a un rayon de 4 centimètres. Son diamètre mesure combien de centimètres ?
   - choix : 2 cm · 4 cm · 8 cm
   - réponse : 8 cm
   - indice : Le diamètre traverse le cercle en passant par le centre.
   - explication : Le diamètre vaut deux rayons : 2 × 4 = 8 cm. 2 cm, c’est prendre la moitié : on a confondu rayon et diamètre.
   - figure : plane cercle 4 / diamètre ?
6. énoncé : Le point M est sur la médiatrice du segment [AB]. MA mesure 7 cm. MB mesure …
   - lu : Le point M est sur la médiatrice du segment A B. M A mesure 7 centimètres. M B mesure combien de centimètres ?
   - choix : 3,5 cm · 7 cm · 14 cm
   - réponse : 7 cm
   - indice : Relis la ligne « médiatrice » du rappel.
   - explication : Un point de la médiatrice est à la même distance de A et de B : MB = MA = 7 cm. 3,5 cm, c’est confondre avec le milieu ; 14 cm, c’est doubler.
   - figure : plane médiatrice 7 · ?
7. énoncé : 3 m² = … dm²
   - lu : 3 mètres carrés, c’est combien de décimètres carrés ?
   - choix : 30 dm² · 300 dm² · 3 000 dm²
   - réponse : 300 dm²
   - indice : 1 m², c’est combien de dm² ?
   - explication : 1 m² = 100 dm², donc 3 m² = 300 dm². 30 dm², c’est multiplier par 10 comme pour une longueur ; pour une aire, c’est 10 × 10 = 100.
   - figure : tableau m² · dm² / 1 · 100 / 3 · ?
8. énoncé : "Les sorties possibles\nMusée : 8 €, 2 h\nCinéma : 6 €, 2 h\nZoo : 12 €, 4 h\nPiscine : 4 €, 1 h\nLa classe veut : moins de 7 €, et au moins 2 h."
   - question : Quelle sortie choisir ?
   - lu : Les sorties possibles. Musée, 8 euros, 2 heures. Cinéma, 6 euros, 2 heures. Zoo, 12 euros, 4 heures. Piscine, 4 euros, 1 heure. La classe veut moins de 7 euros, et au moins 2 heures.
   - choix : le cinéma · la piscine · le musée
   - réponse : le cinéma
   - indice : Écarte d’abord les sorties à 7 € ou plus. Puis regarde la durée.
   - explication : Moins de 7 € : le cinéma et la piscine. Au moins 2 h : seul le cinéma, 2 h ; la piscine ne dure qu’1 h. Le musée dure 2 h, mais coûte 8 €.
   - figure : tableau sortie · prix (€) · durée (h) / musée · 8 · 2 / cinéma · 6 · 2 / zoo · 12 · 4 / piscine · 4 · 1

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
