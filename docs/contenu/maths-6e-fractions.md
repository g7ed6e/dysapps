---
lieu : maths-6e-fractions
module : Fractions
matière : maths
classe : 6e
description : Lire, comparer et partager des fractions, puis poser les opérations et la division, toujours avec la figure sous les yeux.
gardien : le Brochet d’argent
icône : pizza
créature : Nénu
---

# Rivière des fractions

## Nénuphars · `number-line`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Quelle fraction de la figure est coloriée ? Puis sur la droite.
- compétences : c3.ma.nombres.fractions-designations

## Deux rives · `equivalence`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Compare deux fractions avec les barres sous les yeux.
- compétences : c3.ma.nombres.fractions-comparer

## Partage du gâteau · `sharing`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Une fraction d’une quantité, puis des fractions égales.
- compétences : c3.ma.nombres.fractions-designations · c3.ma.nombres.fractions-comparer

## Galets en colonnes · `place-value`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Pose l’opération, puis la division : partage en parts égales et trouve ce qui reste.
- compétences : c3.ma.nombres.calcul-pose

## Calculer avec des fractions · `fraction-sums`

- description : Ajoute, enlève et multiplie des fractions, puis résous un problème avec un schéma en barre, une suite ou le hasard.
- compétences : c3.ma.nombres.fractions-operations · c3.ma.nombres.algebre · c3.ma.donnees.probabilites
- consigne : Lis la phrase ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-6e-fractions
- blocs : 4
- XP : 12
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-6e-fractions-fraction-sums-1`

Pour tous les items :
- aide « Calculer avec des fractions » :
  - Même dénominateur : on ajoute ou on enlève les numérateurs.
  - Le dénominateur ne change pas : des cinquièmes plus des cinquièmes font des cinquièmes.
  - 1 = 2/2 = 4/4 = 10/10, et 1/2 = 2/4.
  - Un entier fois une fraction : on multiplie seulement le numérateur.
  - Dans une égalité, les deux côtés du signe = valent le même nombre.

1. énoncé : 2/5 + 1/5 = …
   - lu : 2 cinquièmes plus un cinquième, c’est combien ?
   - choix : 3/10 · 3/5 · 3
   - réponse : 3/5
   - indice : Ce sont des cinquièmes : combien de cinquièmes en tout ?
   - explication : 2 cinquièmes plus 1 cinquième font 3 cinquièmes : 3/5. On n’ajoute pas les dénominateurs : 3/10 est faux. Et 3 seul oublie que ce sont des cinquièmes.
   - figure : fractions 2/5 · 1/5
2. énoncé : 7/8 − 3/8 = …
   - lu : 7 huitièmes moins 3 huitièmes, c’est combien ?
   - choix : 4/8 · 10/8 · 4
   - réponse : 4/8
   - indice : Ce sont des huitièmes : on enlève 3 huitièmes à 7 huitièmes.
   - explication : 7 − 3 = 4, et le dénominateur reste 8 : 4/8. 10/8, c’est ajouter au lieu d’enlever ; 4 seul oublie les huitièmes.
   - figure : fractions 7/8 · 3/8
3. énoncé : 1 − 1/4 = …
   - lu : 1 moins un quart, c’est combien ?
   - choix : 0 · 3/4 · 5/4
   - réponse : 3/4
   - indice : 1, c’est combien de quarts ?
   - explication : 1 = 4/4. 4 quarts moins 1 quart, il reste 3 quarts : 3/4. 0, c’est faire 1 − 1 en oubliant les quarts ; 5/4, c’est ajouter.
   - figure : fractions 4/4 · 1/4
4. énoncé : 1/2 + 1/4 = …
   - lu : un demi plus un quart, c’est combien ?
   - choix : 2/6 · 2/4 · 3/4
   - réponse : 3/4
   - indice : Écris d’abord 1/2 en quarts.
   - explication : 1/2 = 2/4, donc 2/4 + 1/4 = 3/4. 2/6, c’est ajouter les numérateurs et les dénominateurs ; 2/4, c’est ajouter les numérateurs sans changer 1/2 en quarts.
   - figure : fractions 1/2 · 1/4
5. énoncé : 3 × 2/7 = …
   - lu : 3 fois 2 septièmes, c’est combien ?
   - choix : 6/21 · 5/7 · 6/7
   - réponse : 6/7
   - indice : 3 fois 2 septièmes, c’est 2/7 + 2/7 + 2/7.
   - explication : 3 × 2 = 6 septièmes : 6/7. On ne multiplie pas le dénominateur : 6/21 est faux. 5/7, c’est 3 + 2 : on a ajouté.
   - figure : fraction 2/7
6. énoncé : 4 × 1/4 = …
   - lu : 4 fois un quart, c’est combien ?
   - choix : 4/16 · 1 · 5/4
   - réponse : 1
   - indice : 4 quarts, c’est combien d’unités ?
   - explication : 4 fois 1 quart font 4 quarts, et 4/4 = 1. 4/16, c’est multiplier aussi le dénominateur ; 5/4, c’est ajouter 4 et 1.
   - figure : fraction 1/4
7. énoncé : … − 5 = 2 × 6
   - lu : Combien moins 5 égale 2 fois 6 ?
   - choix : 7 · 12 · 17
   - réponse : 17
   - indice : Calcule d’abord 2 × 6. Puis : quel nombre, moins 5, donne ce résultat ?
   - explication : 2 × 6 = 12, et 17 − 5 = 12 : les deux côtés valent 12. 12 est le résultat de droite, pas le nombre qui manque ; 7, c’est 12 − 5 : on a enlevé au lieu d’ajouter.
   - figure : droite 0 · 20 / 12
8. énoncé : 3 × … = 12
   - lu : 3 fois combien égale 12 ?
   - choix : 4 · 9 · 36
   - réponse : 4
   - indice : Dans la table de 3, quel nombre donne 12 ?
   - explication : 3 × 4 = 12. 9, c’est 12 − 3 : on a enlevé au lieu de chercher dans la table. 36, c’est 3 × 12.
   - figure : droite 0 · 12 / 3 · 6 · 9 · 12

### Niveau 2 · `maths-6e-fractions-fraction-sums-2`

Pour tous les items :
- aide « Problèmes, suites et hasard » :
  - Schéma en barre : une barre coupée en parts égales. Une part vaut le total divisé par le nombre de parts.
  - Suite : cherche ce qu’on ajoute, ou par quoi on multiplie, d’une étape à la suivante.
  - Probabilité = nombre de cas qui conviennent / nombre de cas possibles (s’ils ont tous la même chance).
  - Une probabilité est entre 0 (impossible) et 1 (certain).
  - Le hasard ne se souvient pas des tirages d’avant.

1. énoncé : "Le schéma en barre\nLa barre entière vaut 30 €. Elle a 3 parts égales.\nTom a 2 de ces parts."
   - question : Combien Tom a-t-il ?
   - lu : Le schéma en barre. La barre entière vaut 30 euros. Elle a 3 parts égales. Tom a 2 de ces parts.
   - choix : 10 € · 15 € · 20 €
   - réponse : 20 €
   - indice : Combien vaut une part ? Puis : Tom en a deux.
   - explication : Une part vaut 30 ÷ 3 = 10 €. Tom a 2 parts : 2 × 10 = 20 €, les 2/3 de 30 €. 10 €, c’est une seule part ; 15 €, c’est couper la barre en 2.
   - figure : fraction 2/3
2. énoncé : "Léa et Sam ont 24 billes en tout.\nSam a 2 fois plus de billes que Léa.\nLe schéma : Léa, 1 part ; Sam, 2 parts. Les 3 parts font 24."
   - question : Combien Léa a-t-elle de billes ?
   - lu : Léa et Sam ont 24 billes en tout. Sam a 2 fois plus de billes que Léa. Le schéma : Léa, 1 part ; Sam, 2 parts. Les 3 parts font 24.
   - choix : 8 billes · 12 billes · 16 billes
   - réponse : 8 billes
   - indice : Les 24 billes sont partagées en 3 parts égales.
   - explication : 24 ÷ 3 = 8 : une part, celle de Léa, vaut 8 billes. Sam a 16 billes, et 8 + 16 = 24 : 16, c’est la part de Sam, pas celle de Léa. 12, c’est couper en 2 parts au lieu de 3.
   - figure : fraction 1/3
3. énoncé : "Le gâteau\nInès mange 1/4 du gâteau.\nNoé en mange 2/4."
   - question : Quelle part du gâteau reste-t-il ?
   - lu : Le gâteau. Inès mange un quart du gâteau. Noé en mange 2 quarts.
   - choix : 1/4 · 3/8 · 3/4
   - réponse : 1/4
   - indice : Combien de quarts sont mangés ? Le gâteau entier, c’est 4/4.
   - explication : Ils mangent 1/4 + 2/4 = 3/4. Il reste 4/4 − 3/4 = 1/4. 3/4, c’est la part mangée, pas ce qui reste ; 3/8, c’est ajouter les dénominateurs.
   - figure : fractions 1/4 · 2/4
4. énoncé : "Un motif de bâtonnets\nÉtape 1 : 4 bâtonnets.\nÉtape 2 : 7 bâtonnets.\nÉtape 3 : 10 bâtonnets."
   - question : Combien de bâtonnets à l’étape 5 ?
   - lu : Un motif de bâtonnets. Étape 1, 4 bâtonnets. Étape 2, 7 bâtonnets. Étape 3, 10 bâtonnets.
   - choix : 13 · 16 · 20
   - réponse : 16
   - indice : Combien de bâtonnets ajoute-t-on à chaque étape ?
   - explication : On ajoute 3 bâtonnets à chaque étape : 10, puis 13 à l’étape 4, puis 16 à l’étape 5. 13, c’est l’étape 4 ; 20, c’est 5 fois 4, comme si chaque étape ajoutait 4.
   - figure : tableau étape · bâtonnets / 1 · 4 / 2 · 7 / 3 · 10 / 5 · ?
5. énoncé : "Une suite de nombres\n3 ; 6 ; 12 ; 24"
   - question : Quelle règle donne le nombre suivant ?
   - lu : Une suite de nombres. 3, 6, 12, 24.
   - choix : On multiplie par 2. · On ajoute 3. · On ajoute 6.
   - réponse : On multiplie par 2.
   - indice : Vérifie ta règle sur chaque étape, pas seulement sur la première.
   - explication : 3 × 2 = 6, 6 × 2 = 12, 12 × 2 = 24 : on multiplie par 2 à chaque étape. « On ajoute 3 » ne marche que pour la première étape : 6 + 3 ne donne pas 12. « On ajoute 6 » ne marche pas non plus : 3 + 6 ne donne pas 6.
   - figure : diagramme 3 · 6 · 12 · 24
6. énoncé : "Le sac de billes\nIl y a 3 billes rouges et 1 bille bleue.\nOn tire une bille au hasard, sans regarder."
   - question : Quelle est la probabilité de tirer une bille rouge ?
   - lu : Le sac de billes. Il y a 3 billes rouges et 1 bille bleue. On tire une bille au hasard, sans regarder.
   - choix : 1/4 · 1/2 · 3/4
   - réponse : 3/4
   - indice : Combien de billes en tout ? Combien de rouges ?
   - explication : 4 billes en tout, dont 3 rouges : la probabilité est 3/4. Deux couleurs ne font pas une chance sur deux : il y a plus de rouges. 1/4, c’est la bille bleue.
   - figure : diagramme rouges · bleues / 3 · 1
7. énoncé : "Le dé\nUn dé a 6 faces, numérotées de 1 à 6.\nOn le lance une fois."
   - question : Quelle est la probabilité d’obtenir un nombre plus grand que 4 ?
   - lu : Le dé. Un dé a 6 faces, numérotées de 1 à 6. On le lance une fois.
   - choix : 2/6 · 3/6 · 4/6
   - réponse : 2/6
   - indice : Écris les nombres plus grands que 4 : 4 en fait-il partie ?
   - explication : Plus grand que 4 : seulement 5 et 6, soit 2 faces sur 6 : 2/6. 3/6 compte aussi le 4, qui n’est pas plus grand que 4 ; 4/6, ce sont les faces de 1 à 4.
   - figure : droite 1 · 6 / 4
8. énoncé : "Les lancers de Hugo\nSa pièce est bien équilibrée.\nIl la lance 10 fois.\nIl obtient 7 fois pile."
   - question : Quelle phrase est juste ?
   - lu : Les lancers de Hugo. Sa pièce est bien équilibrée. Il la lance 10 fois. Il obtient 7 fois pile.
   - choix : Sur 10 lancers, c’est possible : la probabilité de pile reste 1/2. · La probabilité de pile est devenue 7/10. · Au prochain lancer, face a plus de chances de sortir.
   - réponse : Sur 10 lancers, c’est possible : la probabilité de pile reste 1/2.
   - indice : La pièce change-t-elle après des lancers ?
   - explication : La pièce est équilibrée : pile a toujours une chance sur deux, 1/2. Sur peu de lancers, on peut obtenir 7 piles. 7/10 est ce qu’Hugo a observé, pas la probabilité. Et la pièce ne se souvient pas des lancers d’avant.
   - figure : diagramme pile · face / 7 · 3

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-6e-fractions-1` | La hutte de Nénu | 40 | Ma hutte ! Merci, bâtisseur. Une moitié pour dormir, l’autre pour chanter sous la pluie. |
| `maths-6e-fractions-2` | Le toit de la hutte | 50 | Un toit et une porte ! La lanterne se reflète dans la mare : deux lanternes pour le prix d’une. |
| `maths-6e-fractions-3` | Le ponton de la hutte | 60 | Un ponton, une barrière, un escalier vers l’eau… Ma hutte est entière, pas un quart ne manque. Coâ ! |

## Les demandes

### `maths-6e-fractions-request-1`

- habitant : Nénu
- bloc : `french-6e-letter-confusion`
- combien : 4
- petite construction : le lavoir
- demande : Il me faut {objet} pour mon lavoir. Joue une mission de la Mine des lettres.
- prête : Tu as les {blocs} ! Livre-les à Nénu.
- posée : Lavoir posé chez Nénu !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : l’appentis de l’écurie (`relais()`) : 2 poteaux de pierre de 2 cubes au fond, un bassin de 2 galets au sol entre eux et devant, un toit de 3 toits (`roof`) à z 2 ; 9 cubes, 6 cases, 3 de haut.
