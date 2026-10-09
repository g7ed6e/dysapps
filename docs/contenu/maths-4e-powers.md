---
lieu : maths-4e-powers
module : Puissances et racines
matière : maths
classe : 4e
description : Puissances, notation scientifique, racines carrées, nombres premiers, puis multiplier et diviser des relatifs et des fractions.
gardien : le Titan d’acier
icône : zap
créature : Braise
---

# Forge des puissances

## Étincelles · `powers`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Puissances de 10, puis notation scientifique.
- compétences : c4.ma.a.puissances · c4.ma.a.ecritures-ordres-de-grandeur

## Enclume · `square-roots`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Puissances d’un nombre, puis produits et quotients de puissances.
- compétences : c4.ma.a.puissances

## Trempe · `scientific-notation`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Racines carrées, puis diviseurs et nombres premiers, puis décomposition en facteurs premiers.
- compétences : c4.ma.a.carres-racine · c4.ma.a.divisibilite-premiers · c4.ma.5e.nombres.divisibilite

## Fourneau · `subtracting`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Multiplie et divise des relatifs avec la règle des signes affichée, puis des fractions.
- compétences : c4.ma.a.calcul-relatifs · c4.ma.a.calcul-fractions

## Aires et volumes · `volumes`

- description : Aire du parallélogramme, volumes du prisme droit et du cylindre, puis de la pyramide et du cône.
- compétences : c4.ma.c.aires-volumes
- consigne : Calcule, puis choisis la bonne réponse. Les formules sont affichées.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-4e-powers
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-4e-powers-volumes-1`

Pour tous les items :
- aide « Aires et volumes » :
  - Parallélogramme : aire = base × hauteur.
  - La hauteur tombe à angle droit sur la base : ce n’est pas le côté penché.
  - Prisme droit et cylindre : volume = aire de la base × hauteur.
  - Cube d’arête c : volume = c × c × c = c³.
  - Une aire se compte en cm², un volume en cm³.

1. énoncé : Un parallélogramme a une base de 6 cm et une hauteur de 4 cm. Son aire est …
   - lu : Un parallélogramme a une base de 6 centimètres et une hauteur de 4 centimètres. Son aire est (mot manquant).
   - choix : 12 cm² · 20 cm² · 24 cm²
   - réponse : 24 cm²
   - indice : Relis la première ligne du rappel.
   - explication : Aire = base × hauteur = 6 × 4 = 24 cm². 12 divise par 2 : c’est la formule du triangle. 20, c’est 2 × (6 + 4) : on a pris la hauteur pour un côté et calculé le tour.
2. énoncé : Un parallélogramme a une base de 5 cm, un côté penché de 4 cm et une hauteur de 3 cm. Son aire est …
   - lu : Un parallélogramme a une base de 5 centimètres, un côté penché de 4 centimètres et une hauteur de 3 centimètres. Son aire est (mot manquant).
   - choix : 15 cm² · 18 cm² · 20 cm²
   - réponse : 15 cm²
   - indice : Le côté penché n’est pas la hauteur.
   - explication : Aire = base × hauteur = 5 × 3 = 15 cm². 5 × 4 = 20 prend le côté penché, et 18 est le périmètre, le tour de la figure.
3. énoncé : Le volume d’une boîte se mesure en …
   - choix : cm · cm² · cm³
   - réponse : cm³
   - indice : Un volume a trois dimensions : longueur, largeur et hauteur.
   - explication : Un volume se mesure en centimètres cubes, cm³, car on multiplie trois longueurs. Le cm² sert pour une aire, le cm pour une longueur.
4. énoncé : Un prisme droit a une base d’aire 12 cm² et une hauteur de 5 cm. Son volume est …
   - lu : Un prisme droit a une base d’aire 12 centimètres carrés et une hauteur de 5 centimètres. Son volume est (mot manquant).
   - choix : 17 cm³ · 30 cm³ · 60 cm³
   - réponse : 60 cm³
   - indice : Relis la ligne du prisme dans le rappel.
   - explication : Volume = aire de la base × hauteur = 12 × 5 = 60 cm³. 17 vient de 12 + 5 : il faut multiplier. 30 divise par 2 : le volume d’un prisme ne se divise pas.
   - figure : tableau aire de la base (cm²) · hauteur (cm) · volume (cm³) / 12 · 5 · ?
5. énoncé : Un cylindre a une base d’aire 20 cm² et une hauteur de 3 cm. Son volume est …
   - lu : Un cylindre a une base d’aire 20 centimètres carrés et une hauteur de 3 centimètres. Son volume est (mot manquant).
   - choix : 23 cm³ · 60 cm³ · 120 cm³
   - réponse : 60 cm³
   - indice : Le cylindre se calcule comme le prisme droit.
   - explication : Volume = aire de la base × hauteur = 20 × 3 = 60 cm³. 23 vient de 20 + 3 : il faut multiplier. 120 multiplie encore par 2 : on ne double rien, la hauteur ne compte qu’une fois.
   - figure : tableau aire de la base (cm²) · hauteur (cm) · volume (cm³) / 20 · 3 · ?
6. énoncé : La base d’un prisme droit est un triangle d’aire 6 cm². Le prisme mesure 10 cm de haut. Son volume est …
   - lu : La base d’un prisme droit est un triangle d’aire 6 centimètres carrés. Le prisme mesure 10 centimètres de haut. Son volume est (mot manquant).
   - choix : 16 cm³ · 60 cm³ · 120 cm³
   - réponse : 60 cm³
   - indice : L’aire de la base est déjà donnée.
   - explication : Volume = aire de la base × hauteur = 6 × 10 = 60 cm³. 16 vient de 6 + 10 : il faut multiplier. L’aire du triangle est déjà calculée : 120 la double, alors qu’on ne la touche plus.
   - figure : tableau aire de la base (cm²) · hauteur (cm) · volume (cm³) / 6 · 10 · ?
7. énoncé : La base d’un prisme droit est un rectangle de 3 cm sur 4 cm. Sa hauteur est 2 cm. Son volume est …
   - lu : La base d’un prisme droit est un rectangle de 3 centimètres sur 4 centimètres. Sa hauteur est 2 centimètres. Son volume est (mot manquant).
   - choix : 9 cm³ · 14 cm³ · 24 cm³
   - réponse : 24 cm³
   - indice : Calcule d’abord l’aire du rectangle de base.
   - explication : Aire de la base = 3 × 4 = 12 cm². Volume = 12 × 2 = 24 cm³. 14 ajoute la hauteur au lieu de la multiplier ; 9 additionne les trois longueurs.
   - figure : tableau longueur (cm) · largeur (cm) · hauteur (cm) · volume (cm³) / 3 · 4 · 2 · ?
8. énoncé : Un cube a des arêtes de 10 cm. Son volume est 10³ cm³, soit …
   - lu : Un cube a des arêtes de 10 centimètres. Son volume est 10 puissance 3 centimètres cubes, soit (mot manquant).
   - choix : 30 cm³ · 100 cm³ · 1 000 cm³
   - réponse : 1 000 cm³
   - indice : 10³, c’est 10 × 10 × 10.
   - explication : Volume = 10 × 10 × 10 = 10³ = 1 000 cm³. 10 × 3 = 30 n’est pas une puissance, et 10² = 100 cm² est l’aire d’une seule face.
   - figure : tableau arête (cm) · arête (cm) · arête (cm) · volume (cm³) / 10 · 10 · 10 · ?

### Niveau 2 · `maths-4e-powers-volumes-2`

Pour tous les items :
- aide « Pyramide et cône » :
  - Prisme droit et cylindre : volume = aire de la base × hauteur.
  - Pyramide et cône : volume = aire de la base × hauteur ÷ 3.
  - Disque de rayon r : aire = π × r², avec r² = r × r.
  - Un volume se compte en cm³, ou en m³ pour une pièce.

1. énoncé : Une pyramide a une base d’aire 15 cm² et une hauteur de 4 cm. Son volume est …
   - lu : Une pyramide a une base d’aire 15 centimètres carrés et une hauteur de 4 centimètres. Son volume est (mot manquant).
   - choix : 20 cm³ · 30 cm³ · 60 cm³
   - réponse : 20 cm³
   - indice : Relis la ligne de la pyramide dans le rappel.
   - explication : Volume = 15 × 4 ÷ 3 = 60 ÷ 3 = 20 cm³. 60, c’est le volume du prisme : il manque « divisé par 3 ». Et on divise par 3, pas par 2.
   - figure : tableau aire de la base (cm²) · hauteur (cm) · volume (cm³) / 15 · 4 · ?
2. énoncé : Le volume d’un cône de rayon r et de hauteur h est …
   - choix : π × r² × h · π × r² × h ÷ 3 · π × r × h ÷ 3
   - réponse : π × r² × h ÷ 3
   - indice : Un cône se calcule comme une pyramide, avec un disque pour base.
   - explication : L’aire du disque de base est π × r² ; on la multiplie par la hauteur, puis on divise par 3. Sans « divisé par 3 », c’est le cylindre ; avec r au lieu de r², ce n’est pas l’aire du disque.
3. énoncé : Une pyramide et un prisme droit ont la même base et la même hauteur. La pyramide a pour volume … celui du prisme.
   - choix : la moitié de · le tiers de · le double de
   - réponse : le tiers de
   - indice : Compare les deux lignes du rappel.
   - explication : Les deux formules ne diffèrent que par « divisé par 3 » : la pyramide a le tiers du volume du prisme. Il faut trois pyramides pour remplir le prisme. La moitié, c’est diviser par 2 comme pour un triangle ; le double, c’est retourner la comparaison.
4. énoncé : Une pyramide a une base carrée de 3 cm de côté et une hauteur de 5 cm. Son volume est …
   - lu : Une pyramide a une base carrée de 3 centimètres de côté et une hauteur de 5 centimètres. Son volume est (mot manquant).
   - choix : 5 cm³ · 15 cm³ · 45 cm³
   - réponse : 15 cm³
   - indice : Calcule d’abord l’aire du carré de base.
   - explication : Aire de la base = 3 × 3 = 9 cm². Volume = 9 × 5 ÷ 3 = 45 ÷ 3 = 15 cm³. 45 oublie de diviser par 3, et 5 prend le côté au lieu de l’aire du carré.
   - figure : tableau côté (cm) · aire de la base (cm²) · hauteur (cm) · volume (cm³) / 3 · ? · 5 · ?
5. énoncé : Un cône a une base d’aire 12 cm² et une hauteur de 6 cm. Son volume est …
   - lu : Un cône a une base d’aire 12 centimètres carrés et une hauteur de 6 centimètres. Son volume est (mot manquant).
   - choix : 24 cm³ · 36 cm³ · 72 cm³
   - réponse : 24 cm³
   - indice : Le cône se calcule comme la pyramide.
   - explication : Volume = 12 × 6 ÷ 3 = 72 ÷ 3 = 24 cm³. 72, c’est le volume du cylindre, et 36 divise par 2 au lieu de 3.
   - figure : tableau aire de la base (cm²) · hauteur (cm) · volume (cm³) / 12 · 6 · ?
6. énoncé : Un cylindre a un rayon de 2 cm et une hauteur de 5 cm. Son volume est …
   - lu : Un cylindre a un rayon de 2 centimètres et une hauteur de 5 centimètres. Son volume est (mot manquant).
   - choix : 10π cm³ · 20π cm³ · 80π cm³
   - réponse : 20π cm³
   - indice : Calcule d’abord l’aire du disque de base : π × r².
   - explication : Aire de la base = π × 2² = 4π cm². Volume = 4π × 5 = 20π cm³. 10π oublie le carré du rayon, et 80π prend le diamètre, 4 cm, pour le rayon.
   - figure : tableau rayon (cm) · aire de la base (cm²) · hauteur (cm) · volume (cm³) / 2 · ? · 5 · ?
7. énoncé : Un cône a un rayon de 3 cm et une hauteur de 4 cm. Son volume est …
   - lu : Un cône a un rayon de 3 centimètres et une hauteur de 4 centimètres. Son volume est (mot manquant).
   - choix : 4π cm³ · 12π cm³ · 36π cm³
   - réponse : 12π cm³
   - indice : Aire du disque de base, fois la hauteur, puis divisé par 3.
   - explication : Aire de la base = π × 3² = 9π cm². Volume = 9π × 4 ÷ 3 = 36π ÷ 3 = 12π cm³. 36π oublie de diviser par 3, et 4π oublie le carré du rayon.
   - figure : tableau rayon (cm) · aire de la base (cm²) · hauteur (cm) · volume (cm³) / 3 · ? · 4 · ?
8. énoncé : Une chambre mesure 4 m de long, 3 m de large et 2 m de haut. Son volume est …
   - lu : Une chambre mesure 4 mètres de long, 3 mètres de large et 2 mètres de haut. Son volume est (mot manquant).
   - choix : 9 m³ · 24 m² · 24 m³
   - réponse : 24 m³
   - indice : Un volume se compte en unités cubes.
   - explication : La chambre est un prisme droit à base rectangulaire : 4 × 3 × 2 = 24 m³, en mètres cubes. 24 m² est une aire, et 9 additionne les longueurs.
   - figure : tableau longueur (m) · largeur (m) · hauteur (m) · volume / 4 · 3 · 2 · ?

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-4e-powers-1` | L’atelier de Braise | 40 | Mon atelier ! Merci, bâtisseur. Chaque plaque d’acier vaut dix fois celle d’en dessous. |
| `maths-4e-powers-2` | Le toit de l’atelier | 50 | Un toit et une porte ! La lanterne brûle à 10³ degrés, au moins. |
| `maths-4e-powers-3` | La cour de l’atelier | 60 | Une cour, une barrière, un escalier… Mon atelier est complet : 2⁰ = 1 atelier entier. |

## Les demandes

### `maths-4e-powers-request-1`

- habitant : Braise
- bloc : `english-4e-grammar`
- combien : 3
- petite construction : le wagonnet
- demande : Il me faut {objet} pour mon wagonnet. Joue une mission de la Gare du futur.
- prête : Tu as les {blocs} ! Livre-les à Braise.
- posée : Wagonnet posé chez Braise !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : un rang bas et ce qu’on pose dessus (le soubassement de la serre, `jardin()`) : une voie de 3 rails au sol, un wagonnet de 2 aciers sur les deux premiers ; 5 cubes, 3 cases, 2 de haut.
