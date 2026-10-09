---
lieu : maths-6e-decimals
module : Nombres décimaux
matière : maths
classe : 6e
description : Lire, comparer et placer des nombres à virgule, puis les grands nombres, le tableau de numération toujours affiché.
gardien : le Dragon de cendre
icône : flame
créature : Lavi
---

# Volcan des décimaux

## Cratère des rangs · `ordering`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Quel est le chiffre des dixièmes ? Puis la fraction décimale.
- compétences : c3.ma.nombres.decimaux-ecritures · c3.ma.nombres.calcul-mental

## Coulée de lave · `operations`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Compare deux décimaux, puis range-les et trouve un nombre entre deux, tableau sous les yeux.
- compétences : c3.ma.nombres.decimaux-comparer

## Pente graduée · `scale`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Repère un décimal sur la droite, complète jusqu’à 1, puis encadre une fraction entre deux entiers.
- compétences : c3.ma.nombres.decimaux-comparer · c3.ma.nombres.calcul-mental · c3.ma.nombres.fractions-comparer

## Nombres géants · `large-numbers`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Lis et écris les grands nombres, classe par classe, jusqu’aux milliards.
- compétences : c3.ma.nombres.grands-entiers

## Arrondis et produits · `rounding-products`

- description : Arrondis un décimal, convertis une longueur en mètres, puis multiplie deux décimaux et vérifie avec un ordre de grandeur.
- compétences : c3.ma.nombres.arrondi · c3.ma.nombres.produit-decimaux · c3.ma.grandeurs.unites-conversions
- consigne : Lis la phrase ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-6e-decimals
- blocs : 4
- XP : 12
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-6e-decimals-rounding-products-1`

Pour tous les items :
- aide « Arrondir et convertir » :
  - Arrondir à l’unité : regarde le chiffre des dixièmes.
  - Arrondir au dixième : regarde le chiffre des centièmes.
  - De 0 à 4, le chiffre gardé ne change pas. De 5 à 9, il augmente de 1.
  - 1 km = 1 000 m. 1 m = 100 cm. 1 m = 1 000 mm.
  - Vers une unité plus petite, le nombre devient plus grand.

1. énoncé : 12,7 arrondi à l’unité, c’est …
   - lu : 12 virgule 7, arrondi à l’unité, c’est combien ?
   - choix : 10 · 12 · 13
   - réponse : 13
   - indice : Regarde le chiffre des dixièmes, juste après la virgule.
   - explication : Le chiffre des dixièmes est 7, entre 5 et 9 : l’unité augmente de 1, 12,7 donne 13. 12, c’est couper après la virgule ; 10, c’est arrondir à la dizaine.
   - figure : droite 10 · 15 / 12,7
2. énoncé : 8,42 arrondi à l’unité, c’est …
   - lu : 8 virgule 42, arrondi à l’unité, c’est combien ?
   - choix : 8 · 8,4 · 9
   - réponse : 8
   - indice : À l’unité, il ne reste aucun chiffre après la virgule.
   - explication : Le chiffre des dixièmes est 4, entre 0 et 4 : on garde 8. 8,4, c’est l’arrondi au dixième, pas à l’unité ; 9, c’est augmenter alors que le chiffre des dixièmes est 4.
   - figure : droite 7 · 10 / 8,42
3. énoncé : 5,38 arrondi au dixième, c’est …
   - lu : 5 virgule 38, arrondi au dixième, c’est combien ?
   - choix : 5 · 5,3 · 5,4
   - réponse : 5,4
   - indice : Regarde le chiffre des centièmes : 8.
   - explication : Le chiffre des centièmes est 8, entre 5 et 9 : le chiffre des dixièmes passe de 3 à 4, donc 5,4. 5,3, c’est couper sans arrondir ; 5, c’est l’arrondi à l’unité.
   - figure : graduée 5 · 6 / 10
4. énoncé : 3,5 m = … cm
   - lu : 3 virgule 5 mètres, c’est combien de centimètres ?
   - choix : 35 cm · 350 cm · 3 500 cm
   - réponse : 350 cm
   - indice : 1 mètre, c’est combien de centimètres ?
   - explication : 1 m = 100 cm, donc 3,5 m = 3,5 × 100 = 350 cm. 35 cm, c’est multiplier par 10 ; 3 500 cm, par 1 000.
   - figure : tableau m · cm / 1 · 100 / 3,5 · ?
5. énoncé : 4 km = … m
   - lu : 4 kilomètres, c’est combien de mètres ?
   - choix : 40 m · 400 m · 4 000 m
   - réponse : 4 000 m
   - indice : Kilo veut dire mille.
   - explication : 1 km = 1 000 m, donc 4 km = 4 000 m. 400 m, c’est multiplier par 100, comme pour les centimètres ; 40 m, par 10.
   - figure : tableau km · m / 1 · 1 000 / 4 · ?
6. énoncé : 250 cm = … m
   - lu : 250 centimètres, c’est combien de mètres ?
   - choix : 0,25 m · 2,5 m · 25 m
   - réponse : 2,5 m
   - indice : Le mètre est plus grand que le centimètre : le nombre devient plus petit.
   - explication : 100 cm = 1 m, donc 250 cm = 250 ÷ 100 = 2,5 m. 25 m, c’est diviser par 10 ; 0,25 m, par 1 000.
   - figure : tableau cm · m / 100 · 1 / 250 · ?
7. énoncé : 8 cm = … m
   - lu : 8 centimètres, c’est combien de mètres ?
   - choix : 0,08 m · 0,8 m · 800 m
   - réponse : 0,08 m
   - indice : 8 cm, c’est moins qu’un mètre.
   - explication : 8 cm = 8 ÷ 100 = 0,08 m : 8 centièmes de mètre. 800 m, c’est multiplier au lieu de diviser ; 0,8 m, c’est diviser par 10.
   - figure : tableau cm · m / 100 · 1 / 8 · ?
8. énoncé : 0,74 arrondi au dixième, c’est …
   - lu : 0 virgule 74, arrondi au dixième, c’est combien ?
   - choix : 0,7 · 0,8 · 1
   - réponse : 0,7
   - indice : Regarde le chiffre des centièmes : 4.
   - explication : Le chiffre des centièmes est 4, entre 0 et 4 : le chiffre des dixièmes ne change pas, donc 0,7. 0,8, c’est augmenter alors que le chiffre des centièmes est 4 ; 1, c’est l’arrondi à l’unité.
   - figure : graduée 0 · 1 / 10

### Niveau 2 · `maths-6e-decimals-rounding-products-2`

Pour tous les items :
- aide « Multiplier des décimaux » :
  - Multiplie d’abord sans les virgules, comme des entiers.
  - Compte les chiffres après la virgule dans les deux nombres.
  - Le résultat en a autant en tout.
  - Ordre de grandeur : arrondis chaque nombre à l’unité, puis calcule.
  - Arrondir : de 0 à 4, on garde ; de 5 à 9, on augmente de 1.
  - 1 km = 1 000 m. 1 m = 1 000 mm.

1. énoncé : 0,4 × 0,2 = …
   - lu : 0 virgule 4 fois 0 virgule 2, c’est combien ?
   - choix : 0,08 · 0,8 · 8
   - réponse : 0,08
   - indice : 4 × 2 = 8. Combien de chiffres après la virgule en tout ?
   - explication : 4 × 2 = 8. Il y a un chiffre après la virgule dans 0,4 et un dans 0,2 : deux en tout, donc 0,08. 0,8 n’en a qu’un ; 8 n’en a plus aucun. Multiplier par un nombre plus petit que 1 donne un résultat plus petit.
2. énoncé : 1,5 × 3 = …
   - lu : 1 virgule 5 fois 3, c’est combien ?
   - choix : 0,45 · 4,5 · 45
   - réponse : 4,5
   - indice : 15 × 3 = 45. Combien de chiffres après la virgule en tout ?
   - explication : 15 × 3 = 45, et un seul chiffre après la virgule, celui de 1,5 : 4,5. Contrôle : 3 fois un peu plus de 1, c’est un peu plus de 3. 45 a perdu sa virgule ; 0,45 a deux chiffres après la virgule au lieu d’un.
3. énoncé : 1,2 × 0,3 = …
   - lu : 1 virgule 2 fois 0 virgule 3, c’est combien ?
   - choix : 0,036 · 0,36 · 3,6
   - réponse : 0,36
   - indice : 12 × 3 = 36. Compte les chiffres après la virgule dans 1,2 et dans 0,3.
   - explication : 12 × 3 = 36, et deux chiffres après la virgule en tout (un dans 1,2, un dans 0,3) : 0,36. 3,6 n’en a qu’un ; 0,036 en a trois.
4. énoncé : "Le calcul de Léo\nLéo pose 4,9 × 6,1.\nIl trouve 298,9."
   - question : Que dit l’ordre de grandeur ?
   - lu : Le calcul de Léo. Léo pose 4 virgule 9 fois 6 virgule 1. Il trouve 298 virgule 9.
   - choix : Environ 30 : la virgule est mal placée. · Environ 300 : le résultat est juste. · Environ 30 : le résultat est juste.
   - réponse : Environ 30 : la virgule est mal placée.
   - indice : Arrondis 4,9 et 6,1 à l’unité, puis multiplie.
   - explication : 4,9 est proche de 5, 6,1 proche de 6 : 5 × 6 = 30. Le résultat doit être proche de 30, pas de 300 : la virgule est mal placée. Le bon résultat est 29,89. « Environ 300 » reprend le résultat de Léo au lieu de le contrôler ; et 298,9, loin de 30, ne peut pas être juste.
5. énoncé : "Au marché\nLe tissu coûte 3 € le mètre.\nNina en achète 2,5 m."
   - question : Combien paie-t-elle ?
   - lu : Au marché. Le tissu coûte 3 euros le mètre. Nina en achète 2 virgule 5 mètres.
   - choix : 5,5 € · 7,5 € · 75 €
   - réponse : 7,5 €
   - indice : 2,5 mètres à 3 € chacun : on ajoute, ou on multiplie ?
   - explication : 2,5 fois 3 € : 25 × 3 = 75, et un chiffre après la virgule, donc 7,5 €. 5,5 €, c’est 3 + 2,5 : on a ajouté au lieu de multiplier. 75 € a perdu sa virgule.
   - figure : tableau mètres · prix (€) / 1 · 3 / 2,5 · ?
6. énoncé : 2,384 arrondi au centième, c’est …
   - lu : 2 virgule 384, arrondi au centième, c’est combien ?
   - choix : 2,38 · 2,39 · 2,4
   - réponse : 2,38
   - indice : Regarde le chiffre des millièmes : 4.
   - explication : Le chiffre des millièmes est 4, entre 0 et 4 : le chiffre des centièmes ne change pas, donc 2,38. 2,39, c’est augmenter alors que le chiffre est 4 ; 2,4, c’est l’arrondi au dixième.
7. énoncé : 7,48 arrondi à l’unité, c’est …
   - lu : 7 virgule 48, arrondi à l’unité, c’est combien ?
   - choix : 7 · 7,5 · 8
   - réponse : 7
   - indice : Pour l’unité, seul le chiffre des dixièmes compte.
   - explication : Le chiffre des dixièmes est 4 : on garde 7. Arrondir d’abord à 7,5, puis à 8, c’est arrondir deux fois : 7,48 est plus près de 7 que de 8.
   - figure : droite 6 · 9 / 7,48
8. énoncé : 2,4 km = … m
   - lu : 2 virgule 4 kilomètres, c’est combien de mètres ?
   - choix : 24 m · 240 m · 2 400 m
   - réponse : 2 400 m
   - indice : 1 kilomètre, c’est combien de mètres ?
   - explication : 1 km = 1 000 m, donc 2,4 km = 2,4 × 1 000 = 2 400 m. 240 m, c’est multiplier par 100 ; 24 m, par 10.
   - figure : tableau km · m / 1 · 1 000 / 2,4 · ?

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-6e-decimals-1` | L’abri de Lavi | 40 | Mon abri ! Merci, bâtisseur. Noir, brillant, et chaud comme une coulée de 1,5 degré de trop. |
| `maths-6e-decimals-2` | Le toit de l’abri | 50 | Un toit et une porte ! La lanterne, c’est mon petit cratère de nuit. |
| `maths-6e-decimals-3` | La terrasse de l’abri | 60 | Une terrasse, une barrière, un escalier vers le cratère… Mon abri est complet, à 1,00 exactement. |

## Les demandes

### `maths-6e-decimals-request-1`

- habitant : Lavi
- bloc : `english-6e-vocabulary`
- combien : 4
- petite construction : le parasol
- demande : Il me faut {objet} pour mon parasol. Joue une mission de la Baie des mots.
- prête : Tu as les {blocs} ! Livre-les à Lavi.
- posée : Parasol posé chez Lavi !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : la croix du toit en pointe de `tour()` : un mât au milieu, une barrière en bas et 2 obsidiennes dessus (l’obsidienne se perdait sur le sol d’obsidienne), 4 cabines en croix autour de son sommet (z 2) ; 7 cubes, 5 cases sur 3 × 3, 3 de haut (retouche du directeur artistique, 3 octobre 2026 : le bloc du sol, sans exception).
