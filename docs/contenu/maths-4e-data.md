---
lieu : maths-4e-data
module : Données et proportions
matière : maths
classe : 4e
description : Moyenne et médiane, probabilités, proportions et partages, programmes de calcul, puis translation, milieux et cercle.
icône : scale
monde ouvert seulement : oui
---

# Étalon

> Lieu du monde ouvert seulement (décision du mainteneur du 21 octobre 2026, GD-24) : l’Étalon n’existe que dans le monde ouvert du 4e d’Archipéo, jamais dans la grille ni dans Blocland. Ses cinq missions sont celles de la carte des missions de 2027 (lieu `maths-4e-data`) ; elles citent le programme de 2020, en vigueur en 4e jusqu’à la bascule de l’été 2027 (le référentiel n’a pas encore les compétences de 4e du texte de 2026, M26). La droite des milieux et le cercle circonscrit (Figures de 4e, niveau 2) sont dans M26, « Quatrième, Triangles » ; dans les intitulés de 2020, ils relèvent de `c4.ma.d.angles-triangles` (médiatrices) et `c4.ma.d.thales` (la droite des milieux en est le cas du milieu). Le lieu n’a ni gardien ni créature (directeur artistique et consultant d’Archipéo, lot 2 du 4e) : aucun écran ne les montrerait ; son habitante est la peseuse, celle de sa scénette et de la réplique de fin des plans. Les niveaux gagnent le bloc de la Forge (`maths-4e-powers`), confirmé par le directeur artistique le 21 octobre 2026 : c’est à l’Étalon qu’on pèse le minerai qui part au fourneau.

## Moyenne et médiane · `weighted-mean`

- description : La moyenne pondérée d’une série, puis la médiane, l’étendue et ce que change une valeur extrême.
- compétences : c4.ma.b.indicateurs · c4.ma.b.lire-donnees
- consigne : Lis la série ou le tableau, puis choisis la bonne réponse. Le rappel est affiché.
- consigne courte : Lis, puis touche la bonne réponse.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-4e-powers
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-4e-data-weighted-mean-1`

Pour tous les items :
- aide « La moyenne pondérée » :
  - Moyenne = somme de toutes les valeurs ÷ nombre de valeurs.
  - Une valeur qui revient plusieurs fois compte autant de fois : valeur × effectif.
  - On divise par l’effectif total, la somme des effectifs.
  - La moyenne est toujours entre la plus petite et la plus grande valeur.

1. énoncé : On pèse 4 sacs : 3 sacs de 10 kg et 1 sac de 14 kg. La masse moyenne d’un sac est …
   - lu : On pèse 4 sacs : 3 sacs de 10 kilos et 1 sac de 14 kilos. La masse moyenne d’un sac est (mot manquant).
   - choix : 11 kg · 12 kg · 44 kg
   - réponse : 11 kg
   - indice : Le sac de 10 kg compte 3 fois.
   - explication : 3 × 10 + 1 × 14 = 44 kg pour 4 sacs : 44 ÷ 4 = 11 kg. 12 kg, c’est la moyenne de 10 et 14 comme s’il n’y avait qu’un sac de chaque. 44 kg, c’est la masse totale, pas encore divisée par 4.
   - figure : tableau masse (kg) · sacs / 10 · 3 / 14 · 1
2. énoncé : Léo a 10 à un contrôle de coefficient 1 et 16 à un contrôle de coefficient 2. Sa moyenne est …
   - lu : Léo a 10 à un contrôle de coefficient 1 et 16 à un contrôle de coefficient 2. Sa moyenne est (mot manquant).
   - choix : 13 · 14 · 42
   - réponse : 14
   - indice : Le coefficient 2 fait compter la note 16 deux fois.
   - explication : 10 × 1 + 16 × 2 = 42, et 1 + 2 = 3 : 42 ÷ 3 = 14. 13, c’est la moyenne sans les coefficients. 42 est la somme, pas encore divisée par 3.
3. énoncé : Une équipe a marqué 1 but dans 3 matchs, 2 buts dans 1 match et 6 buts dans 1 match. La moyenne de buts par match est …
   - lu : Une équipe a marqué 1 but dans 3 matchs, 2 buts dans 1 match et 6 buts dans 1 match. La moyenne de buts par match est (mot manquant).
   - choix : 2,2 · 3 · 11
   - réponse : 2,2
   - indice : Compte d’abord tous les buts, puis tous les matchs.
   - explication : 1 × 3 + 2 × 1 + 6 × 1 = 11 buts en 3 + 1 + 1 = 5 matchs : 11 ÷ 5 = 2,2. 3, c’est la moyenne de 1, 2 et 6 sans les effectifs. 11 est le total des buts.
   - figure : tableau buts · matchs / 1 · 3 / 2 · 1 / 6 · 1
4. énoncé : Le diagramme donne les pointures de 10 élèves. La pointure moyenne est …
   - lu : Le diagramme donne les pointures de 10 élèves : 2 élèves chaussent du 36, 5 du 38 et 3 du 40. La pointure moyenne est (mot manquant).
   - choix : 38 · 38,2 · 382
   - réponse : 38,2
   - indice : Multiplie chaque pointure par son nombre d’élèves.
   - explication : 36 × 2 + 38 × 5 + 40 × 3 = 72 + 190 + 120 = 382, et 382 ÷ 10 = 38,2. 38, c’est la moyenne de 36, 38 et 40 sans les effectifs. 382 n’est pas encore divisé par les 10 élèves.
   - figure : diagramme 36 · 38 · 40 / 2 · 5 · 3
5. énoncé : On a pesé 4 fois 2 kg et 6 fois 3 kg. Pour la masse moyenne, on divise la somme des masses par …
   - lu : On a pesé 4 fois 2 kilos et 6 fois 3 kilos. Pour la masse moyenne, on divise la somme des masses par (mot manquant).
   - choix : 2 · 5 · 10
   - réponse : 10
   - indice : Combien de pesées en tout ?
   - explication : Il y a eu 4 + 6 = 10 pesées : on divise par l’effectif total, 10. 2, c’est le nombre de lignes du tableau. 5, c’est la moyenne de 4 et 6.
   - figure : tableau masse (kg) · pesées / 2 · 4 / 3 · 6
6. énoncé : Des sacs pèsent entre 8 kg et 13 kg. Leur masse moyenne ne peut pas être …
   - lu : Des sacs pèsent entre 8 kilos et 13 kilos. Leur masse moyenne ne peut pas être (mot manquant).
   - choix : 9 kg · 12 kg · 15 kg
   - réponse : 15 kg
   - indice : Relis la dernière ligne du rappel.
   - explication : La moyenne est toujours entre la plus petite valeur, 8 kg, et la plus grande, 13 kg : 15 kg est impossible. 9 kg et 12 kg sont entre 8 et 13 : ils sont possibles.
7. énoncé : Inès a 8 à un devoir de coefficient 1 et 14 à un devoir de coefficient 3. Sa moyenne est …
   - lu : Inès a 8 à un devoir de coefficient 1 et 14 à un devoir de coefficient 3. Sa moyenne est (mot manquant).
   - choix : 11 · 12,5 · 50
   - réponse : 12,5
   - indice : La note 14 compte 3 fois : divise par 1 + 3.
   - explication : 8 × 1 + 14 × 3 = 8 + 42 = 50, et 1 + 3 = 4 : 50 ÷ 4 = 12,5. 11, c’est la moyenne sans les coefficients. 50 n’est pas encore divisé par 4.
8. énoncé : Une classe achète 6 tickets à 2 € et 2 tickets à 6 €. Le prix moyen d’un ticket est …
   - lu : Une classe achète 6 tickets à 2 euros et 2 tickets à 6 euros. Le prix moyen d’un ticket est (mot manquant).
   - choix : 3 € · 4 € · 24 €
   - réponse : 3 €
   - indice : Il y a 8 tickets en tout.
   - explication : 6 × 2 + 2 × 6 = 24 € pour 8 tickets : 24 ÷ 8 = 3 €. 4 €, c’est la moyenne de 2 € et 6 € sans les effectifs. 24 € est le prix total.
   - figure : tableau prix (€) · tickets / 2 · 6 / 6 · 2

### Niveau 2 · `maths-4e-data-weighted-mean-2`

Pour tous les items :
- aide « Médiane et étendue » :
  - Range d’abord les valeurs dans l’ordre croissant.
  - Médiane : la valeur du milieu. Avec un nombre pair de valeurs, la moyenne des deux du milieu.
  - Au moins la moitié des valeurs sont inférieures ou égales à la médiane.
  - Étendue = la plus grande valeur − la plus petite.
  - Une valeur extrême déplace beaucoup la moyenne, et presque pas la médiane.

1. énoncé : La médiane de la série 7 ; 3 ; 9 ; 5 ; 4 est …
   - lu : La médiane de la série 7, 3, 9, 5, 4 est (mot manquant).
   - choix : 5 · 5,6 · 9
   - réponse : 5
   - indice : Range d’abord les cinq valeurs.
   - explication : Rangées : 3 ; 4 ; 5 ; 7 ; 9. La valeur du milieu est 5. 9 est au milieu de la série pas rangée. 5,6 est la moyenne, 28 ÷ 5.
2. énoncé : La médiane de la série 2 ; 6 ; 8 ; 10 est …
   - lu : La médiane de la série 2, 6, 8, 10 est (mot manquant).
   - choix : 6 · 6,5 · 7
   - réponse : 7
   - indice : Il y a 4 valeurs : deux sont au milieu.
   - explication : Les deux valeurs du milieu sont 6 et 8 : la médiane est leur moyenne, (6 + 8) ÷ 2 = 7. 6 n’est qu’une des deux. 6,5 est la moyenne de toute la série, 26 ÷ 4.
3. énoncé : L’étendue de la série 12 ; 15 ; 9 ; 20 est …
   - lu : L’étendue de la série 12, 15, 9, 20 est (mot manquant).
   - choix : 8 · 11 · 29
   - réponse : 11
   - indice : Cherche la plus grande et la plus petite valeur.
   - explication : 20 − 9 = 11. 8, c’est 20 − 12 : 12 est la première valeur, pas la plus petite. 29 ajoute au lieu de soustraire.
4. énoncé : Cinq sacs pèsent 3 kg, 4 kg, 4 kg, 5 kg et 24 kg. La médiane de ces masses est …
   - lu : Cinq sacs pèsent 3 kilos, 4 kilos, 4 kilos, 5 kilos et 24 kilos. La médiane de ces masses est (mot manquant).
   - choix : 4 kg · 8 kg · 21 kg
   - réponse : 4 kg
   - indice : Les masses sont déjà rangées : prends celle du milieu.
   - explication : La valeur du milieu, la troisième, est 4 kg. 8 kg est la moyenne, 40 ÷ 5, tirée vers le haut par le sac de 24 kg. 21 kg est l’étendue, 24 − 3.
5. énoncé : La série 4 ; 5 ; 6 reçoit une valeur de plus, 25. Ce qui change le plus, c’est …
   - lu : La série 4, 5, 6 reçoit une valeur de plus, 25. Ce qui change le plus, c’est (mot manquant).
   - choix : la moyenne · la médiane · les deux autant
   - réponse : la moyenne
   - indice : Calcule la moyenne et la médiane avant, puis après.
   - explication : Avant, la moyenne et la médiane valent 5. Après, la moyenne vaut 40 ÷ 4 = 10, et la médiane (5 + 6) ÷ 2 = 5,5. Une valeur extrême tire la moyenne, presque pas la médiane.
6. énoncé : La médiane des tailles d’une classe est 155 cm. Cela veut dire que …
   - lu : La médiane des tailles d’une classe est 155 centimètres. Cela veut dire que (mot manquant).
   - choix : au moins la moitié des élèves mesurent 155 cm ou moins · tous les élèves mesurent 155 cm · la moyenne des tailles est 155 cm
   - réponse : au moins la moitié des élèves mesurent 155 cm ou moins
   - indice : Relis la troisième ligne du rappel.
   - explication : La médiane partage la série en deux : au moins la moitié des élèves mesurent 155 cm ou moins. Les élèves n’ont pas tous la même taille, et la moyenne peut être différente de la médiane.
7. énoncé : L’étendue des notes 8 ; 11 ; 11 ; 14 ; 17 est …
   - lu : L’étendue des notes 8, 11, 11, 14, 17 est (mot manquant).
   - choix : 3 · 9 · 25
   - réponse : 9
   - indice : La plus grande note moins la plus petite.
   - explication : 17 − 8 = 9. 3, c’est l’écart entre deux notes voisines, 14 − 11. 25 ajoute au lieu de soustraire.
8. énoncé : La médiane de la série 15 ; 10 ; 18 ; 12 ; 11 ; 14 est …
   - lu : La médiane de la série 15, 10, 18, 12, 11, 14 est (mot manquant).
   - choix : 12 · 13 · 15
   - réponse : 13
   - indice : Range d’abord les six valeurs, puis prends les deux du milieu.
   - explication : Rangées : 10 ; 11 ; 12 ; 14 ; 15 ; 18. Les deux du milieu sont 12 et 14 : (12 + 14) ÷ 2 = 13. 15 vient des deux valeurs du milieu de la série pas rangée, 18 et 12. 12 n’est qu’une des deux.

## Évènements · `events`

- description : La probabilité d’un évènement et de l’évènement contraire, puis des expériences à deux épreuves.
- compétences : c4.ma.b.probabilites
- consigne : Lis l’expérience, puis choisis la bonne réponse. Le rappel est affiché.
- consigne courte : Lis, puis touche la bonne réponse.
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : maths-4e-powers
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-4e-data-events-1`

Pour tous les items :
- aide « Probabilités » :
  - Quand toutes les issues ont la même chance : probabilité = issues favorables ÷ issues possibles.
  - Une probabilité est entre 0 (impossible) et 1 (certain).
  - L’évènement contraire de A arrive quand A n’arrive pas.
  - Probabilité du contraire de A = 1 − probabilité de A.

1. énoncé : Un sac contient 3 billes rouges et 5 billes bleues. On tire une bille au hasard. La probabilité qu’elle soit rouge est …
   - lu : Un sac contient 3 billes rouges et 5 billes bleues. On tire une bille au hasard. La probabilité qu’elle soit rouge est (mot manquant).
   - choix : 3/8 · 3/5 · 5/8
   - réponse : 3/8
   - indice : Combien de billes en tout dans le sac ?
   - explication : 3 billes rouges sur 3 + 5 = 8 billes : 3/8. 3/5 compare les rouges aux bleues, pas à toutes les billes. 5/8 est la probabilité de tirer une bleue.
2. énoncé : La probabilité d’un évènement A est 0,3. La probabilité de son contraire est …
   - lu : La probabilité d’un évènement A est 0,3. La probabilité de son contraire est (mot manquant).
   - choix : 0,3 · 0,7 · 1,3
   - réponse : 0,7
   - indice : Relis la dernière ligne du rappel.
   - explication : 1 − 0,3 = 0,7. 0,3 est la probabilité de A lui-même. 1,3 ajoute au lieu de soustraire, et une probabilité ne dépasse jamais 1.
3. énoncé : Une roue a 10 secteurs de même taille, dont 4 jaunes. La probabilité de ne pas tomber sur du jaune est …
   - lu : Une roue a 10 secteurs de même taille, dont 4 jaunes. La probabilité de ne pas tomber sur du jaune est (mot manquant).
   - choix : 4/10 · 6/10 · 10/6
   - réponse : 6/10
   - indice : Combien de secteurs ne sont pas jaunes ?
   - explication : 10 − 4 = 6 secteurs ne sont pas jaunes : 6/10. 4/10 est la probabilité du jaune. 10/6 est plus grand que 1 : ce n’est pas une probabilité.
4. énoncé : Un de ces nombres ne peut pas être une probabilité : c’est …
   - lu : Un de ces nombres ne peut pas être une probabilité : c’est (mot manquant).
   - choix : 0 · 0,5 · 1,2
   - réponse : 1,2
   - indice : Relis la deuxième ligne du rappel.
   - explication : Une probabilité est entre 0 et 1 : 1,2 est trop grand. 0 est la probabilité d’un évènement impossible, 0,5 celle d’un évènement qui arrive une fois sur deux.
5. énoncé : Une urne contient 9 jetons numérotés de 1 à 9. On en tire un au hasard. La probabilité d’un numéro pair est …
   - lu : Une urne contient 9 jetons numérotés de 1 à 9. On en tire un au hasard. La probabilité d’un numéro pair est (mot manquant).
   - choix : 4/9 · 1/2 · 5/9
   - réponse : 4/9
   - indice : Écris les numéros pairs de 1 à 9.
   - explication : Les numéros pairs sont 2, 4, 6 et 8 : 4 sur 9, soit 4/9. 1/2 suppose autant de pairs que d’impairs, mais il y a 5 impairs. 5/9 est la probabilité d’un numéro impair.
6. énoncé : Un sac contient des billes rouges, bleues et vertes. Le contraire de « tirer une bille rouge » est …
   - lu : Un sac contient des billes rouges, bleues et vertes. Le contraire de « tirer une bille rouge » est (mot manquant).
   - choix : tirer une bille bleue · tirer une bille bleue ou verte · ne tirer aucune bille
   - réponse : tirer une bille bleue ou verte
   - indice : Le contraire arrive chaque fois que la bille n’est pas rouge.
   - explication : Si la bille n’est pas rouge, elle est bleue ou verte : c’est le contraire. « Bleue » oublie les vertes. On tire toujours une bille : « aucune bille » n’est pas une issue.
7. énoncé : La probabilité de gagner à un jeu est 1/4. La probabilité de perdre est …
   - lu : La probabilité de gagner à un jeu est un quart. La probabilité de perdre est (mot manquant).
   - choix : 1/4 · 1/2 · 3/4
   - réponse : 3/4
   - indice : Perdre, c’est le contraire de gagner.
   - explication : 1 − 1/4 = 3/4. 1/4 est la probabilité de gagner. 1/2 ferait croire qu’on gagne une fois sur deux.
8. énoncé : Un sac contient 6 billes, toutes bleues. La probabilité de tirer une bille bleue est …
   - lu : Un sac contient 6 billes, toutes bleues. La probabilité de tirer une bille bleue est (mot manquant).
   - choix : 0 · 1/6 · 1
   - réponse : 1
   - indice : Peut-on tirer autre chose qu’une bille bleue ?
   - explication : Toutes les billes sont bleues : l’évènement est certain, sa probabilité est 6/6 = 1. 1/6 serait la probabilité de tirer une bille précise. 0 est la probabilité d’un évènement impossible.

### Niveau 2 · `maths-4e-data-events-2`

Pour tous les items :
- aide « Deux épreuves » :
  - Écris toutes les issues, dans l’ordre : la première épreuve, puis la seconde.
  - Deux pièces (P pour pile, F pour face) : PP, PF, FP, FF. 4 issues, toutes de même chance.
  - Une pièce puis un dé : 2 × 6 = 12 issues.
  - Probabilité = issues favorables ÷ toutes les issues.

1. énoncé : On lance deux pièces. Le nombre d’issues possibles est …
   - lu : On lance deux pièces. Le nombre d’issues possibles est (mot manquant).
   - choix : 2 · 3 · 4
   - réponse : 4
   - indice : Écris les issues : la première pièce, puis la seconde.
   - explication : PP, PF, FP et FF : 4 issues. 3 compte PF et FP comme une seule issue, mais ce sont deux issues : pile puis face, ou face puis pile. 2 oublie la seconde pièce.
2. énoncé : On lance deux pièces. La probabilité d’obtenir deux fois face est …
   - lu : On lance deux pièces. La probabilité d’obtenir deux fois face est (mot manquant).
   - choix : 1/4 · 1/3 · 1/2
   - réponse : 1/4
   - indice : Une seule issue sur les quatre convient.
   - explication : Seule l’issue FF convient, sur 4 : 1/4. 1/3 oublie que PF et FP sont deux issues. 1/2 est la chance de face pour une seule pièce.
3. énoncé : On lance deux pièces. La probabilité d’obtenir un pile et un face, dans n’importe quel ordre, est …
   - lu : On lance deux pièces. La probabilité d’obtenir un pile et un face, dans n’importe quel ordre, est (mot manquant).
   - choix : 1/4 · 1/3 · 1/2
   - réponse : 1/2
   - indice : Deux issues conviennent : lesquelles ?
   - explication : PF et FP conviennent : 2 issues sur 4, soit 2/4 = 1/2. 1/4 ne compte que PF. 1/3 compte PF et FP comme une seule issue.
4. énoncé : On lance une pièce, puis un dé à 6 faces. Le nombre d’issues possibles est …
   - lu : On lance une pièce, puis un dé à 6 faces. Le nombre d’issues possibles est (mot manquant).
   - choix : 8 · 12 · 36
   - réponse : 12
   - indice : Pour chaque côté de la pièce, le dé a 6 faces.
   - explication : 2 côtés pour la pièce, 6 faces pour le dé : 2 × 6 = 12 issues. 8 ajoute au lieu de multiplier. 36, c’est 6 × 6 : deux dés, pas une pièce et un dé.
5. énoncé : On lance une pièce, puis un dé à 6 faces. La probabilité d’obtenir pile et 6 est …
   - lu : On lance une pièce, puis un dé à 6 faces. La probabilité d’obtenir pile et 6 est (mot manquant).
   - choix : 1/12 · 1/8 · 1/6
   - réponse : 1/12
   - indice : Une seule issue convient, sur combien ?
   - explication : Une seule issue, pile et 6, sur 12 : 1/12. 1/8 ajoute 2 et 6 au lieu de les multiplier. 1/6 oublie la pièce.
6. énoncé : On lance une pièce, puis un dé à 6 faces. La probabilité d’obtenir face et un nombre pair est …
   - lu : On lance une pièce, puis un dé à 6 faces. La probabilité d’obtenir face et un nombre pair est (mot manquant).
   - choix : 1/4 · 3/8 · 1/2
   - réponse : 1/4
   - indice : Écris les issues qui conviennent : face et 2, puis les autres.
   - explication : Face et 2, face et 4, face et 6 : 3 issues sur 12, soit 3/12 = 1/4. 1/2 oublie la pièce. 3/8 compte 2 + 6 = 8 issues au lieu de 2 × 6 = 12.
7. énoncé : On lance deux pièces. La probabilité d’obtenir au moins un pile est …
   - lu : On lance deux pièces. La probabilité d’obtenir au moins un pile est (mot manquant).
   - choix : 1/4 · 1/2 · 3/4
   - réponse : 3/4
   - indice : Au moins un pile : une ou deux fois pile.
   - explication : PP, PF et FP conviennent : 3 issues sur 4, soit 3/4. C’est aussi le contraire de FF : 1 − 1/4 = 3/4. 1/2 et 1/4 oublient des issues.
8. énoncé : Un sac contient une bille rouge et une verte ; un autre, une rouge, une verte et une jaune. On tire une bille dans chaque sac. La probabilité d’avoir deux billes rouges est …
   - lu : Un sac contient une bille rouge et une verte ; un autre, une rouge, une verte et une jaune. On tire une bille dans chaque sac. La probabilité d’avoir deux billes rouges est (mot manquant).
   - choix : 1/6 · 1/5 · 1/3
   - réponse : 1/6
   - indice : Combien d’issues en tout : 2 billes, puis 3 billes ?
   - explication : 2 × 3 = 6 issues, et une seule donne deux rouges : 1/6. 1/5 ajoute 2 et 3 au lieu de les multiplier. 1/3 ne regarde que le second sac.

## Proportions · `proportional-reasoning`

- description : Grandeurs quotients et quatrième proportionnelle, puis coefficient multiplicateur d’une hausse ou d’une baisse, puis ratio et partage.
- compétences : c4.ma.b.proportionnalite · c4.ma.c.grandeurs-composees · c4.ma.b.pourcentages-echelles · c4.ma.b.ratio
- consigne : Lis la phrase, puis choisis la bonne réponse. Le rappel est affiché.
- consigne courte : Lis, puis touche la bonne réponse.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-4e-powers
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-4e-data-proportional-reasoning-1`

Pour tous les items :
- aide « Grandeurs quotients » :
  - Proportionnel : d’une ligne à l’autre, on multiplie toujours par le même nombre.
  - Quatrième proportionnelle : trouve par combien on multiplie, puis fais pareil.
  - Vitesse = distance ÷ durée, en km/h : des kilomètres par heure.
  - Débit = volume ÷ durée, en L/min : des litres par minute.
  - Prix au kilo = prix ÷ masse.

1. énoncé : Un train parcourt 150 km en 2 h. Sa vitesse moyenne est …
   - lu : Un train parcourt 150 kilomètres en 2 heures. Sa vitesse moyenne est (mot manquant).
   - choix : 75 km/h · 148 km/h · 300 km/h
   - réponse : 75 km/h
   - indice : Combien de kilomètres en une heure ?
   - explication : Vitesse = distance ÷ durée = 150 ÷ 2 = 75 km/h. 148 soustrait les heures aux kilomètres. 300 multiplie au lieu de diviser.
2. énoncé : Un robinet remplit une cuve de 60 L en 5 min. Son débit est …
   - lu : Un robinet remplit une cuve de 60 litres en 5 minutes. Son débit est (mot manquant).
   - choix : 12 L/min · 55 L/min · 300 L/min
   - réponse : 12 L/min
   - indice : Combien de litres en une minute ?
   - explication : Débit = volume ÷ durée = 60 ÷ 5 = 12 L/min. 55 soustrait au lieu de diviser. 300 multiplie au lieu de diviser.
3. énoncé : 3 kg de minerai coûtent 12 €. Le prix au kilo est …
   - lu : 3 kilos de minerai coûtent 12 euros. Le prix au kilo est (mot manquant).
   - choix : 4 €/kg · 9 €/kg · 36 €/kg
   - réponse : 4 €/kg
   - indice : Divise le prix par la masse.
   - explication : 12 ÷ 3 = 4 € par kilo. 9 soustrait au lieu de diviser. 36 multiplie au lieu de diviser.
4. énoncé : 4 sacs pèsent 30 kg. 10 sacs pareils pèsent …
   - lu : 4 sacs pèsent 30 kilos. 10 sacs pareils pèsent (mot manquant).
   - choix : 36 kg · 75 kg · 120 kg
   - réponse : 75 kg
   - indice : Cherche d’abord la masse d’un seul sac.
   - explication : Un sac pèse 30 ÷ 4 = 7,5 kg ; 10 sacs pèsent 7,5 × 10 = 75 kg. 36 ajoute 6 comme aux sacs : on multiplie, on n’ajoute pas. 120, c’est 30 × 4.
   - figure : tableau sacs · masse (kg) / 4 · 30 / 10 · ?
5. énoncé : Un camion roule à 60 km/h pendant 30 min. Il parcourt …
   - lu : Un camion roule à 60 kilomètres par heure pendant 30 minutes. Il parcourt (mot manquant).
   - choix : 2 km · 30 km · 1 800 km
   - réponse : 30 km
   - indice : 30 minutes, c’est une demi-heure.
   - explication : En une heure, 60 km ; en une demi-heure, la moitié : 30 km. 2, c’est 60 ÷ 30 : les minutes ne sont pas des heures. 1 800, c’est 60 × 30.
6. énoncé : Un sac de 5 kg coûte 8 €, un sac de 2 kg coûte 3 €. Le moins cher au kilo est …
   - lu : Un sac de 5 kilos coûte 8 euros, un sac de 2 kilos coûte 3 euros. Le moins cher au kilo est (mot manquant).
   - choix : le sac de 2 kg · le sac de 5 kg · aucun, ils coûtent pareil au kilo
   - réponse : le sac de 2 kg
   - indice : Calcule le prix d’un kilo pour chaque sac.
   - explication : 8 ÷ 5 = 1,60 € le kilo ; 3 ÷ 2 = 1,50 € le kilo : le sac de 2 kg est moins cher au kilo. Le sac de 5 kg coûte plus cher en tout, mais on compare le prix d’un kilo.
7. énoncé : Le prix est proportionnel à la masse : 2 kg coûtent 6 €. 5 kg coûtent …
   - lu : Le prix est proportionnel à la masse : 2 kilos coûtent 6 euros. 5 kilos coûtent (mot manquant).
   - choix : 9 € · 15 € · 30 €
   - réponse : 15 €
   - indice : Un kilo coûte combien ?
   - explication : Un kilo coûte 6 ÷ 2 = 3 €, donc 5 kg coûtent 5 × 3 = 15 €. 9 ajoute 3 comme aux kilos. 30, c’est 6 × 5 : 6 € est le prix de 2 kg, pas d’un seul.
   - figure : tableau masse (kg) · prix (€) / 2 · 6 / 5 · ?
8. énoncé : Une pompe a un débit de 4 L/min. Pour pomper 36 L, il lui faut …
   - lu : Une pompe a un débit de 4 litres par minute. Pour pomper 36 litres, il lui faut (mot manquant).
   - choix : 9 min · 32 min · 144 min
   - réponse : 9 min
   - indice : Combien de fois 4 litres dans 36 litres ?
   - explication : 36 ÷ 4 = 9 minutes. 32 soustrait au lieu de diviser. 144 multiplie au lieu de diviser.

### Niveau 2 · `maths-4e-data-proportional-reasoning-2`

Pour tous les items :
- aide « Coefficient multiplicateur » :
  - Augmenter de 20 %, c’est multiplier par 1,2 (1 + 0,2).
  - Diminuer de 20 %, c’est multiplier par 0,8 (1 − 0,2).
  - Le coefficient d’une hausse est plus grand que 1, celui d’une baisse plus petit que 1.
  - Coefficient = nouvelle valeur ÷ ancienne valeur.

1. énoncé : Augmenter un prix de 10 %, c’est le multiplier par …
   - lu : Augmenter un prix de 10 pour cent, c’est le multiplier par (mot manquant).
   - choix : 0,1 · 1,01 · 1,1
   - réponse : 1,1
   - indice : On garde le prix entier, et on ajoute 10 pour cent.
   - explication : 100 % + 10 % = 110 %, soit × 1,1. × 0,1 donne seulement les 10 %, sans le prix. × 1,01 ajoute 1 %, pas 10 % : 10 %, c’est 0,1.
2. énoncé : Baisser une masse de 30 %, c’est la multiplier par …
   - lu : Baisser une masse de 30 pour cent, c’est la multiplier par (mot manquant).
   - choix : 0,3 · 0,7 · 1,3
   - réponse : 0,7
   - indice : Que reste-t-il quand on enlève 30 pour cent ?
   - explication : 100 % − 30 % = 70 %, soit × 0,7. × 0,3 donne ce qu’on enlève, pas ce qui reste. × 1,3 est une hausse.
3. énoncé : Un prix de 50 € augmente de 20 %. Le nouveau prix est …
   - lu : Un prix de 50 euros augmente de 20 pour cent. Le nouveau prix est (mot manquant).
   - choix : 10 € · 40 € · 60 €
   - réponse : 60 €
   - indice : Multiplie 50 par 1,2.
   - explication : 50 × 1,2 = 60 €. 10 € n’est que la hausse, 20 % de 50 € : il faut l’ajouter au prix. 40 € est une baisse de 20 %.
4. énoncé : Un sac de 80 kg perd 25 % de sa masse. Il pèse maintenant …
   - lu : Un sac de 80 kilos perd 25 pour cent de sa masse. Il pèse maintenant (mot manquant).
   - choix : 20 kg · 55 kg · 60 kg
   - réponse : 60 kg
   - indice : Multiplie 80 par 0,75.
   - explication : 80 × 0,75 = 60 kg : le sac perd 20 kg, le quart de 80. 20 kg est ce qu’il perd, pas ce qui reste. 55 kg enlève 25 kilos au lieu de 25 pour cent.
5. énoncé : Multiplier par 1,05, c’est …
   - lu : Multiplier par 1,05, c’est (mot manquant).
   - choix : une hausse de 5 % · une hausse de 105 % · une baisse de 5 %
   - réponse : une hausse de 5 %
   - indice : 1,05, c’est 1 + 0,05.
   - explication : 1,05 = 1 + 0,05 : on garde tout et on ajoute 5 %. Une hausse de 105 % serait × 2,05. Le coefficient est plus grand que 1 : ce n’est pas une baisse.
6. énoncé : Multiplier par 0,9, c’est …
   - lu : Multiplier par 0,9, c’est (mot manquant).
   - choix : une baisse de 9 % · une baisse de 10 % · une hausse de 90 %
   - réponse : une baisse de 10 %
   - indice : 0,9, c’est 1 − 0,1.
   - explication : 0,9 = 1 − 0,1 : on enlève 10 %. Une baisse de 9 % serait × 0,91. Le coefficient est plus petit que 1 : ce n’est pas une hausse.
7. énoncé : Un prix passe de 40 € à 50 €. Le coefficient multiplicateur est …
   - lu : Un prix passe de 40 euros à 50 euros. Le coefficient multiplicateur est (mot manquant).
   - choix : 1,1 · 1,25 · 10
   - réponse : 1,25
   - indice : Divise le nouveau prix par l’ancien.
   - explication : 50 ÷ 40 = 1,25 : c’est une hausse de 25 %. 10 est la hausse en euros, pas le coefficient. 1,1 prend les 10 euros pour 10 pour cent.
8. énoncé : Un prix de 200 € baisse de 15 %. Le nouveau prix est …
   - lu : Un prix de 200 euros baisse de 15 pour cent. Le nouveau prix est (mot manquant).
   - choix : 170 € · 185 € · 230 €
   - réponse : 170 €
   - indice : Multiplie 200 par 0,85.
   - explication : 200 × 0,85 = 170 € : la baisse est de 30 €. 185 € enlève 15 euros au lieu de 15 pour cent. 230 € est une hausse.

### Niveau 3 · `maths-4e-data-proportional-reasoning-3`

Pour tous les items :
- aide « Ratio et partage » :
  - Le ratio 2 : 3, c’est 2 parts pour l’un et 3 parts pour l’autre.
  - Compte toutes les parts : 2 + 3 = 5 parts.
  - Une part = la quantité totale ÷ le nombre de parts.
  - Chacun reçoit son nombre de parts × une part.

1. énoncé : On partage 20 kg selon le ratio 1 : 3. La petite part est …
   - lu : On partage 20 kilos selon le ratio 1 pour 3. La petite part est (mot manquant).
   - choix : 5 kg · 10 kg · 15 kg
   - réponse : 5 kg
   - indice : Combien de parts en tout ?
   - explication : 1 + 3 = 4 parts ; une part = 20 ÷ 4 = 5 kg : la petite part a 1 part, 5 kg. 15 kg est la grande part, 3 parts. 10 kg partage en deux moitiés, sans le ratio.
2. énoncé : On partage 35 € selon le ratio 2 : 5. La grande part est …
   - lu : On partage 35 euros selon le ratio 2 pour 5. La grande part est (mot manquant).
   - choix : 10 € · 17,50 € · 25 €
   - réponse : 25 €
   - indice : Une part, c’est 35 ÷ 7.
   - explication : 2 + 5 = 7 parts ; une part = 35 ÷ 7 = 5 € ; la grande part a 5 parts : 25 €. 10 € est la petite part. 17,50 € partage en deux moitiés.
3. énoncé : Pour partager selon le ratio 3 : 4, on coupe la quantité en … parts égales.
   - lu : Pour partager selon le ratio 3 pour 4, on coupe la quantité en (mot manquant) parts égales.
   - choix : 3 · 4 · 7
   - réponse : 7
   - indice : Relis la deuxième ligne du rappel.
   - explication : 3 parts pour l’un, 4 pour l’autre : 3 + 4 = 7 parts égales. 3 et 4 ne comptent les parts que d’un seul côté.
4. énoncé : Un mortier mélange ciment et sable selon le ratio 1 : 4. Avec 3 seaux de ciment, il faut … seaux de sable.
   - lu : Un mortier mélange ciment et sable selon le ratio 1 pour 4. Avec 3 seaux de ciment, il faut (mot manquant) seaux de sable.
   - choix : 7 · 12 · 15
   - réponse : 12
   - indice : Pour 1 seau de ciment, 4 seaux de sable.
   - explication : 1 seau de ciment pour 4 de sable : 3 seaux de ciment pour 3 × 4 = 12 seaux de sable. 7 ajoute au lieu de multiplier. 15 est le nombre de seaux en tout.
5. énoncé : On partage 60 kg en trois parts selon le ratio 1 : 2 : 3. La plus grande part est …
   - lu : On partage 60 kilos en trois parts selon le ratio 1, 2 et 3. La plus grande part est (mot manquant).
   - choix : 10 kg · 20 kg · 30 kg
   - réponse : 30 kg
   - indice : 1 + 2 + 3 = 6 parts.
   - explication : 6 parts ; une part = 60 ÷ 6 = 10 kg ; la plus grande a 3 parts : 30 kg. 10 kg est une seule part. 20 kg partage en trois parts égales, sans le ratio.
6. énoncé : Dans une classe de 25 élèves, garçons et filles sont dans le ratio 2 : 3. Il y a … filles.
   - lu : Dans une classe de 25 élèves, garçons et filles sont dans le ratio 2 pour 3. Il y a (mot manquant) filles.
   - choix : 10 · 12,5 · 15
   - réponse : 15
   - indice : Une part, c’est 25 ÷ 5.
   - explication : 2 + 3 = 5 parts ; une part = 25 ÷ 5 = 5 élèves ; les filles ont 3 parts : 15. 10 est le nombre de garçons. 12,5 partage en deux moitiés, et on ne coupe pas un élève.
7. énoncé : On prépare 12 L de boisson, sirop et eau selon le ratio 1 : 5. Il faut … d’eau.
   - lu : On prépare 12 litres de boisson, sirop et eau selon le ratio 1 pour 5. Il faut (mot manquant) d’eau.
   - choix : 2 L · 10 L · 60 L
   - réponse : 10 L
   - indice : 1 + 5 = 6 parts.
   - explication : 6 parts ; une part = 12 ÷ 6 = 2 L ; l’eau a 5 parts : 10 L. 2 L est le sirop. 60 L, c’est 12 × 5 : 12 litres est le total, pas une part.
8. énoncé : Deux sacs pèsent 4 kg et 6 kg. Leur ratio est le même que celui de 2 kg et …
   - lu : Deux sacs pèsent 4 kilos et 6 kilos. Leur ratio est le même que celui de 2 kilos et (mot manquant).
   - choix : 3 kg · 4 kg · 5 kg
   - réponse : 3 kg
   - indice : 4 kilos divisé par 2 donne 2 kilos. Fais pareil avec 6.
   - explication : 4 ÷ 2 = 2 et 6 ÷ 2 = 3 : le ratio 4 : 6 est le même que 2 : 3. 4 kg enlève 2 aux deux nombres : un ratio se garde en multipliant ou en divisant, pas en enlevant. 5 kg enlève 1.

## Programmes de calcul · `calculation-programs`

- description : Appliquer un programme de calcul à un nombre puis à x, puis le remonter, et lire comment une grandeur dépend d’une autre.
- compétences : c4.ma.b.image-antecedent · c4.ma.a.reduire-developper
- consigne : Suis le programme, puis choisis la bonne réponse. Le rappel est affiché.
- consigne courte : Suis le programme, puis touche la bonne réponse.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-4e-powers
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-4e-data-calculation-programs-1`

Pour tous les items :
- aide « Programme de calcul » :
  - Fais les étapes dans l’ordre, une à la fois.
  - Chaque étape part du résultat de l’étape d’avant.
  - Avec x, écris le calcul entier, avec des parenthèses : (x + 3) × 2.
  - Puis développe : (x + 3) × 2 = 2x + 6.

1. énoncé : Programme : choisir un nombre, ajouter 3, puis multiplier par 2. Avec 5, on obtient …
   - lu : Programme : choisir un nombre, ajouter 3, puis multiplier par 2. Avec 5, on obtient (mot manquant).
   - choix : 11 · 13 · 16
   - réponse : 16
   - indice : D’abord 5 + 3, puis le résultat fois 2.
   - explication : 5 + 3 = 8, puis 8 × 2 = 16. 13, c’est 5 × 2 + 3 : les étapes dans le mauvais ordre. 11, c’est 5 + 3 × 2 : le × 2 n’a porté que sur le 3.
2. énoncé : Programme : choisir un nombre, multiplier par 4, puis soustraire 1. Avec 3, on obtient …
   - lu : Programme : choisir un nombre, multiplier par 4, puis soustraire 1. Avec 3, on obtient (mot manquant).
   - choix : 8 · 11 · 12
   - réponse : 11
   - indice : D’abord 3 × 4, puis on enlève 1.
   - explication : 3 × 4 = 12, puis 12 − 1 = 11. 12 oublie la dernière étape. 8, c’est (3 − 1) × 4 : les étapes dans le mauvais ordre.
3. énoncé : Programme : choisir x, ajouter 3, puis multiplier par 2. Le calcul entier s’écrit …
   - lu : Programme : choisir x, ajouter 3, puis multiplier par 2. Le calcul entier s’écrit (mot manquant).
   - choix : x + 3 × 2 · (x + 3) × 2 · x × 2 + 3
   - réponse : (x + 3) × 2
   - indice : Tout le résultat de la première étape est multiplié par 2.
   - explication : On multiplie tout x + 3 par 2 : il faut des parenthèses, (x + 3) × 2. Sans parenthèses, x + 3 × 2 ne multiplie que le 3. x × 2 + 3 fait les étapes dans le mauvais ordre.
4. énoncé : Développé, (x + 3) × 2 s’écrit …
   - lu : Développé, x plus 3, le tout fois 2, s’écrit (mot manquant).
   - choix : 2x + 3 · x + 6 · 2x + 6
   - réponse : 2x + 6
   - indice : Multiplie x par 2, puis 3 par 2.
   - explication : (x + 3) × 2 = 2 × x + 2 × 3 = 2x + 6. 2x + 3 oublie de multiplier le 3. x + 6 oublie de multiplier le x.
5. énoncé : Programme : choisir un nombre, multiplier par 3, puis ajouter 5. Avec −2, on obtient …
   - lu : Programme : choisir un nombre, multiplier par 3, puis ajouter 5. Avec moins 2, on obtient (mot manquant).
   - choix : −1 · 1 · 9
   - réponse : −1
   - indice : −2 × 3 = −6. Puis ajoute 5.
   - explication : −2 × 3 = −6, puis −6 + 5 = −1. 9, c’est (−2 + 5) × 3 : les étapes dans le mauvais ordre. 1 oublie le signe moins.
6. énoncé : Programme : choisir x, ajouter 4, puis multiplier par 5. Développé, le résultat s’écrit …
   - lu : Programme : choisir x, ajouter 4, puis multiplier par 5. Développé, le résultat s’écrit (mot manquant).
   - choix : 5x + 4 · 5x + 9 · 5x + 20
   - réponse : 5x + 20
   - indice : Écris d’abord (x + 4) × 5.
   - explication : (x + 4) × 5 = 5x + 20. 5x + 4 ne multiplie pas le 4. 5x + 9 ajoute 5 au lieu de multiplier.
7. énoncé : Programme : choisir x, multiplier par 2, puis ajouter 7. Le résultat s’écrit …
   - lu : Programme : choisir x, multiplier par 2, puis ajouter 7. Le résultat s’écrit (mot manquant).
   - choix : 2x + 7 · 2(x + 7) · 9x
   - réponse : 2x + 7
   - indice : Ici, on multiplie d’abord, puis on ajoute.
   - explication : x × 2 = 2x, puis 2x + 7. 2(x + 7) ajoute avant de multiplier. 9x mélange des x et des nombres seuls : 2x + 7 ne se réduit pas.
8. énoncé : Programme A : ajouter 1, puis multiplier par 3. Programme B : multiplier par 3, puis ajouter 3. Avec le même nombre de départ, ils donnent …
   - lu : Programme A : ajouter 1, puis multiplier par 3. Programme B : multiplier par 3, puis ajouter 3. Avec le même nombre de départ, ils donnent (mot manquant).
   - choix : toujours le même résultat · des résultats différents · le même résultat seulement avec 0
   - réponse : toujours le même résultat
   - indice : Écris les deux programmes avec x, puis développe A.
   - explication : A donne (x + 1) × 3 = 3x + 3, et B donne x × 3 + 3 = 3x + 3 : c’est le même calcul, quel que soit x. Essaie avec 2 : A donne 9, B donne 9.

### Niveau 2 · `maths-4e-data-calculation-programs-2`

Pour tous les items :
- aide « Remonter un programme » :
  - Pour retrouver le nombre de départ, pars de la fin.
  - Fais les étapes à l’envers, de la dernière à la première.
  - Chaque opération se défait par son contraire : + 3 par − 3, × 2 par ÷ 2.
  - Une formule dit comment une grandeur dépend d’une autre : prix = 3 × masse.

1. énoncé : Programme : ajouter 3, puis multiplier par 2. On obtient 20. Le nombre de départ est …
   - lu : Programme : ajouter 3, puis multiplier par 2. On obtient 20. Le nombre de départ est (mot manquant).
   - choix : 7 · 8,5 · 13
   - réponse : 7
   - indice : Défais d’abord la dernière étape : 20 ÷ 2.
   - explication : 20 ÷ 2 = 10, puis 10 − 3 = 7. Vérifie : (7 + 3) × 2 = 20. 8,5, c’est (20 − 3) ÷ 2 : les étapes défaites dans le mauvais ordre. 13 ajoute 3 au lieu de l’enlever.
2. énoncé : Programme : multiplier par 4, puis soustraire 1. On obtient 19. Le nombre de départ est …
   - lu : Programme : multiplier par 4, puis soustraire 1. On obtient 19. Le nombre de départ est (mot manquant).
   - choix : 4,5 · 5 · 75
   - réponse : 5
   - indice : Défais d’abord « soustraire 1 » : 19 + 1.
   - explication : 19 + 1 = 20, puis 20 ÷ 4 = 5. Vérifie : 5 × 4 − 1 = 19. 4,5, c’est 19 − 1 puis ÷ 4 : le contraire de − 1 est + 1. 75 refait le programme au lieu de le défaire.
3. énoncé : Pour défaire « multiplier par 5 », on …
   - lu : Pour défaire « multiplier par 5 », on (mot manquant).
   - choix : divise par 5 · multiplie par 5 · soustrait 5
   - réponse : divise par 5
   - indice : Relis la troisième ligne du rappel.
   - explication : Le contraire de × 5 est ÷ 5. Multiplier par 5 refait l’étape. Soustraire 5 défait « ajouter 5 », pas « multiplier par 5 ».
4. énoncé : Programme : soustraire 6, puis diviser par 2. On obtient 4. Le nombre de départ est …
   - lu : Programme : soustraire 6, puis diviser par 2. On obtient 4. Le nombre de départ est (mot manquant).
   - choix : 2 · 14 · 20
   - réponse : 14
   - indice : Défais d’abord « diviser par 2 » : 4 × 2.
   - explication : 4 × 2 = 8, puis 8 + 6 = 14. Vérifie : (14 − 6) ÷ 2 = 4. 2, c’est 4 × 2 − 6 : on a soustrait au lieu d’ajouter. 20, c’est (4 + 6) × 2 : les étapes dans le mauvais ordre.
5. énoncé : Le prix du minerai suit la formule : prix = 3 × masse (en euros et en kilos). Pour 4 kg, le prix est …
   - lu : Le prix du minerai suit la formule : prix égale 3 fois la masse, en euros et en kilos. Pour 4 kilos, le prix est (mot manquant).
   - choix : 0,75 € · 7 € · 12 €
   - réponse : 12 €
   - indice : Remplace la masse par 4.
   - explication : prix = 3 × 4 = 12 €. 7 € ajoute au lieu de multiplier. 0,75 €, c’est 3 ÷ 4 : la formule multiplie.
6. énoncé : Le périmètre d’un carré suit la formule P = 4 × c, où c est son côté. Pour c = 2,5 cm, P vaut …
   - lu : Le périmètre d’un carré suit la formule P égale 4 fois c, où c est son côté. Pour c égale 2,5 centimètres, P vaut (mot manquant).
   - choix : 6,25 cm · 6,5 cm · 10 cm
   - réponse : 10 cm
   - indice : Remplace c par 2,5.
   - explication : P = 4 × 2,5 = 10 cm. 6,5 ajoute 4 au lieu de multiplier. 6,25, c’est 2,5 × 2,5 : la formule de l’aire, pas du périmètre.
7. énoncé : Le graphique montre comment y dépend de x. Quand x vaut 2, y vaut …
   - lu : Le graphique montre comment y dépend de x. Quand x vaut 2, y vaut (mot manquant).
   - choix : 3 · 4 · 5
   - réponse : 5
   - indice : Pars de 2 sur l’axe du bas, monte jusqu’à la droite, puis lis à gauche.
   - explication : Le point de la droite au-dessus de x = 2 est à la hauteur 5 : y = 2 × 2 + 1 = 5. 4 oublie le + 1. 3, c’est 2 + 1.
   - figure : graphique 2 · 1
8. énoncé : Un taxi coûte 3 € plus 2 € par kilomètre : prix = 3 + 2 × distance. Pour 5 km, on paie …
   - lu : Un taxi coûte 3 euros plus 2 euros par kilomètre : prix égale 3 plus 2 fois la distance. Pour 5 kilomètres, on paie (mot manquant).
   - choix : 10 € · 13 € · 25 €
   - réponse : 13 €
   - indice : Calcule d’abord 2 × 5, puis ajoute 3.
   - explication : 3 + 2 × 5 = 3 + 10 = 13 €. 10 € oublie les 3 € du départ. 25 €, c’est (3 + 2) × 5 : la multiplication passe avant l’addition.

## Figures de 4e · `translations`

- description : Ce que garde une translation et le parallélogramme, puis la droite des milieux et le cercle d’un triangle rectangle.
- compétences : c4.ma.d.transformations · c4.ma.d.triangles-parallelogramme · c4.ma.d.angles-triangles · c4.ma.d.thales
- consigne : Lis la phrase ou la figure, puis choisis la bonne réponse. Le rappel est affiché.
- consigne courte : Lis, puis touche la bonne réponse.
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : maths-4e-powers
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-4e-data-translations-1`

Pour tous les items :
- aide « Translation et parallélogramme » :
  - Une translation fait glisser une figure : chaque point bouge dans la même direction, du même sens et de la même longueur.
  - Elle garde les longueurs, les angles, les aires et le parallélisme.
  - Si une translation envoie A sur B et C sur D, alors ABDC est un parallélogramme.
  - Un parallélogramme a ses côtés opposés parallèles et de même longueur.
  - Ses diagonales se coupent en leur milieu.

1. énoncé : Une figure a une aire de 12 cm². Son image par une translation a une aire de …
   - lu : Une figure a une aire de 12 centimètres carrés. Son image par une translation a une aire de (mot manquant).
   - choix : 6 cm² · 12 cm² · 24 cm²
   - réponse : 12 cm²
   - indice : Relis la deuxième ligne du rappel.
   - explication : Une translation fait glisser la figure sans la déformer : l’aire reste 12 cm². Elle ne double pas et ne diminue pas : rien n’est agrandi ni réduit.
   - figure : image translation / aire 12 · ?
2. énoncé : Un angle de 50° glisse de 4 cm par une translation. Son image mesure …
   - lu : Un angle de 50 degrés glisse de 4 centimètres par une translation. Son image mesure (mot manquant).
   - choix : 46° · 50° · 54°
   - réponse : 50°
   - indice : Une translation garde les angles, quelle que soit la longueur du glissement.
   - explication : La figure glisse sans tourner ni se déformer : l’angle reste 50°. 54° ajoute les 4 cm du glissement à l’angle, 46° les enlève : un glissement ne change pas un angle.
   - figure : image translation / angle 50 · ?
3. énoncé : Une translation envoie A sur B et C sur D. Le quadrilatère ABDC est un …
   - lu : Une translation envoie A sur B et C sur D. Le quadrilatère A B D C est un (mot manquant).
   - choix : parallélogramme · rectangle · carré
   - réponse : parallélogramme
   - indice : Relis la troisième ligne du rappel.
   - explication : [AB] et [CD] sont parallèles et de même longueur : ABDC est un parallélogramme. Il n’a pas toujours d’angle droit : ce n’est pas toujours un rectangle, ni un carré.
4. énoncé : Un segment de 7 cm glisse de 10 cm par une translation. Son image mesure …
   - lu : Un segment de 7 centimètres glisse de 10 centimètres par une translation. Son image mesure (mot manquant).
   - choix : 7 cm · 10 cm · 17 cm
   - réponse : 7 cm
   - indice : Une translation garde les longueurs, quelle que soit la longueur du glissement.
   - explication : Le segment glisse sans changer de longueur : 7 cm. 10 cm est la longueur du glissement, pas celle du segment ; 17 cm les ajoute.
5. énoncé : ABCD est un parallélogramme et AB = 6 cm. Alors CD mesure …
   - lu : A B C D est un parallélogramme et A B mesure 6 centimètres. Alors C D mesure (mot manquant).
   - choix : 3 cm · 6 cm · 12 cm
   - réponse : 6 cm
   - indice : [AB] et [CD] sont des côtés opposés.
   - explication : Dans un parallélogramme, les côtés opposés ont la même longueur : CD = AB = 6 cm. 3 cm et 12 cm coupent ou doublent la longueur sans raison.
6. énoncé : Les diagonales d’un parallélogramme …
   - lu : Les diagonales d’un parallélogramme (mot manquant).
   - choix : se coupent en leur milieu · ont toujours la même longueur · sont toujours perpendiculaires
   - réponse : se coupent en leur milieu
   - indice : Relis la dernière ligne du rappel.
   - explication : Dans tout parallélogramme, les diagonales se coupent en leur milieu. Elles ont la même longueur seulement dans un rectangle, et sont perpendiculaires seulement dans un losange.
7. énoncé : Une droite et son image par une translation sont …
   - lu : Une droite et son image par une translation sont (mot manquant).
   - choix : parallèles · perpendiculaires · sécantes en un point
   - réponse : parallèles
   - indice : Une translation garde le parallélisme : la droite glisse sans tourner.
   - explication : La droite glisse sans tourner : son image lui est parallèle (ou c’est la même droite, si elle glisse le long d’elle-même). Pour être perpendiculaires ou sécantes, il faudrait qu’elle tourne.
8. énoncé : ABCD est un parallélogramme de centre O, et AC = 10 cm. Alors AO mesure …
   - lu : A B C D est un parallélogramme de centre O, et A C mesure 10 centimètres. Alors A O mesure (mot manquant).
   - choix : 5 cm · 10 cm · 20 cm
   - réponse : 5 cm
   - indice : O est le milieu de la diagonale [AC].
   - explication : Les diagonales se coupent en leur milieu : O est le milieu de [AC], donc AO = 10 ÷ 2 = 5 cm. 10 cm est toute la diagonale ; 20 cm la double.

### Niveau 2 · `maths-4e-data-translations-2`

Pour tous les items :
- aide « Milieux et cercle » :
  - Dans un triangle, la droite qui passe par les milieux de deux côtés est parallèle au troisième côté.
  - Le segment qui joint ces deux milieux mesure la moitié du troisième côté.
  - La droite qui passe par le milieu d’un côté, parallèle à un deuxième côté, coupe le troisième en son milieu.
  - Dans un triangle rectangle, le cercle circonscrit a pour diamètre l’hypoténuse.
  - Son centre est le milieu de l’hypoténuse.
  - Si un côté d’un triangle est un diamètre de son cercle, le triangle est rectangle.

1. énoncé : Dans le triangle ABC, I est le milieu de [AB], J celui de [AC], et BC = 8 cm. Alors IJ mesure …
   - lu : Dans le triangle A B C, I est le milieu de A B, J celui de A C, et B C mesure 8 centimètres. Alors I J mesure (mot manquant).
   - choix : 4 cm · 8 cm · 16 cm
   - réponse : 4 cm
   - indice : Relis la deuxième ligne du rappel.
   - explication : Le segment qui joint les milieux de deux côtés mesure la moitié du troisième : 8 ÷ 2 = 4 cm. 8 cm oublie la moitié ; 16 cm double au lieu de diviser.
2. énoncé : Dans le triangle ABC, I est le milieu de [AB] et J celui de [AC]. Les droites (IJ) et (BC) sont …
   - lu : Dans le triangle A B C, I est le milieu de A B et J celui de A C. Les droites I J et B C sont (mot manquant).
   - choix : parallèles · perpendiculaires · sécantes en B
   - réponse : parallèles
   - indice : Relis la première ligne du rappel.
   - explication : La droite des milieux de deux côtés est parallèle au troisième côté : (IJ) est parallèle à (BC). Rien n’oblige un angle droit, et (IJ) ne passe pas par B.
3. énoncé : Dans le triangle ABC, I et J sont les milieux de [AB] et [AC], et IJ = 5 cm. Alors BC mesure …
   - lu : Dans le triangle A B C, I et J sont les milieux de A B et A C, et I J mesure 5 centimètres. Alors B C mesure (mot manquant).
   - choix : 2,5 cm · 5 cm · 10 cm
   - réponse : 10 cm
   - indice : IJ est la moitié de BC : BC en est le double.
   - explication : IJ est la moitié de BC : BC = 5 × 2 = 10 cm. 2,5 cm divise au lieu de multiplier ; 5 cm oublie que IJ n’est que la moitié.
4. énoncé : Dans le triangle ABC, une droite passe par le milieu de [AB] et est parallèle à (BC). Elle coupe [AC] …
   - lu : Dans le triangle A B C, une droite passe par le milieu de A B et est parallèle à B C. Elle coupe A C (mot manquant).
   - choix : en son milieu · au tiers de sa longueur · au point C
   - réponse : en son milieu
   - indice : Relis la troisième ligne du rappel.
   - explication : Une droite qui passe par le milieu d’un côté, parallèle à un deuxième côté, coupe le troisième en son milieu. Parallèle à (BC), elle ne peut pas passer par C, qui est sur (BC).
5. énoncé : Le triangle ABC est rectangle en A, et son hypoténuse BC mesure 10 cm. Le rayon de son cercle circonscrit est …
   - lu : Le triangle A B C est rectangle en A, et son hypoténuse B C mesure 10 centimètres. Le rayon de son cercle circonscrit est (mot manquant).
   - choix : 5 cm · 10 cm · 20 cm
   - réponse : 5 cm
   - indice : L’hypoténuse est un diamètre. Le rayon en est la moitié.
   - explication : L’hypoténuse, 10 cm, est le diamètre du cercle : le rayon mesure 10 ÷ 2 = 5 cm. 10 cm est le diamètre, pas le rayon ; 20 cm double encore.
6. énoncé : Le centre du cercle circonscrit à un triangle rectangle est …
   - lu : Le centre du cercle circonscrit à un triangle rectangle est (mot manquant).
   - choix : le milieu de l’hypoténuse · le sommet de l’angle droit · le milieu du plus petit côté
   - réponse : le milieu de l’hypoténuse
   - indice : Relis la ligne sur le centre.
   - explication : L’hypoténuse est un diamètre : le centre du cercle est son milieu. Le sommet de l’angle droit est sur le cercle, pas au centre.
7. énoncé : Un triangle a ses trois sommets sur un cercle, et l’un de ses côtés est un diamètre. Ce triangle a toujours …
   - lu : Un triangle a ses trois sommets sur un cercle, et l’un de ses côtés est un diamètre. Ce triangle a toujours (mot manquant).
   - choix : un angle droit · deux côtés de même longueur · trois côtés de même longueur
   - réponse : un angle droit
   - indice : Relis la dernière ligne du rappel.
   - explication : Un côté est un diamètre : l’angle opposé est droit, le triangle est rectangle. Il peut avoir deux côtés égaux, mais pas toujours. Trois côtés égaux ne donnent jamais d’angle droit.
8. énoncé : Le triangle ABC est rectangle en A, et son hypoténuse BC mesure 13 cm. M est le milieu de [BC]. Alors AM mesure …
   - lu : Le triangle A B C est rectangle en A, et son hypoténuse B C mesure 13 centimètres. M est le milieu de B C. Alors A M mesure (mot manquant).
   - choix : 6,5 cm · 13 cm · 26 cm
   - réponse : 6,5 cm
   - indice : M est le centre du cercle circonscrit, et A est sur ce cercle.
   - explication : M est le centre du cercle circonscrit ; A est sur le cercle : AM est un rayon, la moitié de l’hypoténuse, 13 ÷ 2 = 6,5 cm. 13 cm est le diamètre ; 26 cm le double.

## Les plans

> Ni la grille ni Blocland ne dessinent ces plans : l’Étalon n’y est pas. Leurs cases (la forme `maison` de `src/game/world/architect.ts`, comme la Forge) donnent ses parties au monde ouvert, qui rebâtit le lieu en 3 + 1 + 1 (le corps en trois rangées, le toit, la cour). La réplique de fin est dite par la peseuse.

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-4e-data-1` | La halle de la peseuse | 40 | La bascule est d’aplomb, le tonneau et les cuves aussi. Ici, on pèse juste. |
| `maths-4e-data-2` | Le toit de la halle | 50 | La halle a son toit, et les étalons sont rangés. |
| `maths-4e-data-3` | La cour de la halle | 60 | La cour est prête. Avant de forger, on mesure. |
