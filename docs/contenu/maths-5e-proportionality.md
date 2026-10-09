---
lieu : maths-5e-proportionality
module : Proportionnalité
matière : maths
classe : 5e
description : Tableaux de proportionnalité, pourcentages, vitesses et échelles, avec le tableau ou le schéma toujours affiché.
gardien : le Colporteur
icône : ruler
créature : Bazar
---

# Marché des proportions

## Étals · `proportion-tables`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Complète un tableau de proportionnalité, en passant par l’unité, puis par le coefficient.
- compétences : c4.ma.5e.proportionnalite.proportionnalite · c3.ma.proportionnalite.proportionnalite

## Remises · `percentages`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Prends un pourcentage, puis applique une hausse ou une baisse.
- compétences : c4.ma.5e.proportionnalite.pourcentages · c3.ma.nombres.pourcentages

## Balances · `ratios`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Vitesses constantes et échelles de carte, puis la carte de l’archipel, en mots ou en fraction, puis une traversée : la distance, la vitesse ou la durée, les minutes changées en heures.
- compétences : c4.ma.5e.proportionnalite.proportionnalite · c3.ma.proportionnalite.echelle

## Formules · `formulas`

- description : Lire un tableau de valeurs et écrire une formule, puis remplacer la lettre, tester une égalité et développer.
- compétences : c4.ma.5e.proportionnalite.fonctions · c4.ma.5e.nombres.calcul-litteral
- consigne : Lis la phrase, la formule ou le tableau, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-5e-proportionality
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-5e-proportionality-formulas-1`

Pour tous les items :
- aide « Formules et tableaux » :
  - « A en fonction de B » : A dépend de B. Quand B change, A change.
  - Le tableau se lit ligne par ligne : les nombres d’une ligne vont ensemble.
  - Une formule calcule une grandeur avec l’autre : prix = 5 × n.
  - Double : 2 × n. Carré : n × n, qu’on écrit n².

1. énoncé : Au cinéma, on lit le prix en fonction du nombre de places. Ce qui dépend de l’autre, c’est …
   - choix : le prix · le nombre de places · aucun des deux
   - réponse : le prix
   - indice : Relis la première ligne du rappel.
   - explication : « Le prix en fonction du nombre de places » : le prix dépend du nombre de places. Plus on prend de places, plus on paie. Le nombre de places, lui, on le choisit. Et l’un dépend bien de l’autre : « aucun des deux » ne va pas.
   - figure : tableau places · prix (€) / 1 · 8 / 2 · 16 / 3 · 24
2. énoncé : D’après le tableau, il fait le plus chaud à …
   - figure : tableau heure · température (°C) / 8 h · 12 / 10 h · 15 / 12 h · 19 / 14 h · 17
   - lu : La température en fonction de l’heure. 8 heures, 12 degrés. 10 heures, 15 degrés. 12 heures, 19 degrés. 14 heures, 17 degrés. À quelle heure fait-il le plus chaud ?
   - choix : 10 h · 12 h · 14 h
   - réponse : 12 h
   - indice : Cherche la plus grande température, puis lis l’heure sur la même ligne.
   - explication : La plus grande température est 19 degrés, sur la ligne de 12 h. À 14 h, la dernière ligne, il fait 17 degrés : la température a baissé. À 10 h, il ne fait que 15 degrés.
3. énoncé : Le prix, en fonction du nombre n de cahiers : prix = …
   - figure : tableau nombre n · prix (€) / 1 · 3 / 2 · 6 / 4 · 12
   - lu : Le prix en fonction du nombre n de cahiers. 1 cahier, 3 euros. 2 cahiers, 6 euros. 4 cahiers, 12 euros. Quelle formule donne le prix ?
   - choix : 3 × n · n + 2 · n + 3
   - réponse : 3 × n
   - indice : Essaie ta formule sur chaque ligne du tableau.
   - explication : Sur chaque ligne, le prix est 3 fois le nombre : 3 × 1 = 3, 3 × 2 = 6, 3 × 4 = 12. n + 2 marche sur la première ligne seulement : 2 + 2 = 4, pas 6. n + 3 ne marche sur aucune : 1 + 3 = 4, pas 3.
4. énoncé : Le périmètre P d’un carré de côté c : P = …
   - lu : Le périmètre P d’un carré de côté c. P égale quoi ?
   - choix : 4 × c · c × c · c + 4
   - réponse : 4 × c
   - indice : Un carré a quatre côtés de même longueur.
   - explication : Le périmètre, c’est le tour : 4 côtés de longueur c, donc P = 4 × c. c × c, c’est l’aire du carré, pas son tour. c + 4 ajoute 4 au lieu de multiplier par 4.
   - figure : tableau côté c · périmètre P / 1 · 4 / 2 · 8 / 3 · 12
5. énoncé : L’aire A d’un carré de côté c : A = …
   - lu : L’aire A d’un carré de côté c. A égale quoi ?
   - choix : 2 × c · 4 × c · c²
   - réponse : c²
   - indice : L’aire d’un carré : côté fois côté.
   - explication : L’aire du carré, c’est côté fois côté : c × c, qu’on écrit c², c au carré. 2 × c, c’est le double : le carré n’est pas le double. 4 × c, c’est le périmètre.
   - figure : tableau côté c · aire A / 1 · 1 / 2 · 4 / 3 · 9
6. énoncé : Le nombre entier qui vient juste avant n s’écrit …
   - lu : Le nombre entier qui vient juste avant n, comment s’écrit-il ?
   - choix : n − 1 · n + 1 · 1 − n
   - réponse : n − 1
   - indice : Essaie avec un nombre : juste avant 10, il y a 9.
   - explication : Juste avant n, il y a 1 de moins : n − 1. Pour n = 10, 10 − 1 = 9. n + 1 vient juste après. 1 − n met les nombres dans le mauvais ordre : 1 − 10 ne fait pas 9.
   - figure : droite 5 · 15 / 10
7. énoncé : D’après le tableau, entre la semaine 1 et la semaine 2, le plant de tomate grandit de …
   - figure : tableau semaine · hauteur (cm) / 1 · 4 / 2 · 9 / 3 · 15
   - lu : La hauteur d’un plant de tomate en fonction de la semaine. Semaine 1, 4 centimètres. Semaine 2, 9 centimètres. Semaine 3, 15 centimètres. Entre la semaine 1 et la semaine 2, de combien grandit-il ?
   - choix : 4 cm · 5 cm · 9 cm
   - réponse : 5 cm
   - indice : Compare les hauteurs des deux premières lignes.
   - explication : Il passe de 4 cm à 9 cm : 9 − 4 = 5, il grandit de 5 cm. 9 cm, c’est sa hauteur à la semaine 2, et 4 cm sa hauteur à la semaine 1 : ni l’une ni l’autre ne dit ce qu’il a grandi.
8. énoncé : Le triple du nombre n s’écrit …
   - lu : Le triple du nombre n, comment s’écrit-il ?
   - choix : 3 × n · n + 3 · n³
   - réponse : 3 × n
   - indice : Le triple, c’est trois fois le nombre.
   - explication : Le triple, c’est 3 fois le nombre : 3 × n. n³, c’est le cube, n × n × n. n + 3, c’est ajouter 3.
   - figure : tableau n · triple de n / 2 · 6 / 5 · ?

### Niveau 2 · `maths-5e-proportionality-formulas-2`

Pour tous les items :
- aide « Remplacer, tester, développer » :
  - On remplace la lettre par sa valeur, puis on calcule avec les priorités.
  - 2a veut dire 2 × a.
  - Une égalité est vraie si ses deux côtés donnent le même nombre.
  - Un seul nombre qui la rend fausse : elle n’est pas vraie pour tous.
  - k(a + b) = ka + kb : on multiplie chaque terme.

1. énoncé : Pour x = 4, 3 × x + 2 = …
   - lu : Pour x égale 4, 3 fois x plus 2, combien ?
   - choix : 9 · 14 · 18
   - réponse : 14
   - indice : Remplace x par 4. Puis la multiplication d’abord.
   - explication : 3 × 4 + 2 = 12 + 2 = 14. 18, c’est 3 × (4 + 2) : on a ajouté avant de multiplier. 9, c’est 3 + 4 + 2.
   - figure : tableau calcul · résultat / x · 4 / 3 × x · ? / 3 × x + 2 · ?
2. énoncé : Pour a = 6, 2a − 5 = …
   - lu : Pour a égale 6, 2 a moins 5, combien ?
   - choix : 7 · 17 · 21
   - réponse : 7
   - indice : 2a veut dire 2 × a.
   - explication : 2a, c’est 2 × 6 = 12, puis 12 − 5 = 7. 21, c’est lire 2a comme le nombre 26. 17, c’est 12 + 5.
   - figure : tableau calcul · résultat / a · 6 / 2a · ? / 2a − 5 · ?
3. énoncé : Le périmètre d’un rectangle est P = 2 × (L + 3). Pour L = 5, P = …
   - lu : Le périmètre d’un rectangle est P égale 2 fois la parenthèse L plus 3. Pour L égale 5, combien vaut P ?
   - choix : 8 · 13 · 16
   - réponse : 16
   - indice : Remplace L par 5. Puis la parenthèse d’abord.
   - explication : 2 × (5 + 3) = 2 × 8 = 16. 13, c’est 2 × 5 + 3 : on a oublié les parenthèses. 8, c’est oublier le 2.
   - figure : tableau calcul · résultat / L · 5 / L + 3 · ? / 2 × (L + 3) · ?
4. énoncé : Pour x = 3, l’égalité 4x = x + 9 est …
   - lu : Pour x égale 3, l’égalité 4 x égale x plus 9 est-elle vraie ?
   - choix : vraie · fausse · vraie pour tous les nombres
   - réponse : vraie
   - indice : Calcule chaque côté avec x = 3.
   - explication : À gauche, 4 × 3 = 12 ; à droite, 3 + 9 = 12. Les deux côtés valent 12 : l’égalité est vraie pour x = 3. Pas pour tous les nombres : pour x = 1, on trouve 4 et 10.
   - figure : tableau côté · avec x = 3 / 4x · ? / x + 9 · ?
5. énoncé : Pour x = 2, l’égalité 3x + 1 = 2x + 4 est …
   - lu : Pour x égale 2, l’égalité 3 x plus 1 égale 2 x plus 4 est-elle vraie ?
   - choix : vraie · fausse · vraie pour tous les nombres
   - réponse : fausse
   - indice : Calcule chaque côté avec x = 2, puis compare.
   - explication : À gauche, 3 × 2 + 1 = 7 ; à droite, 2 × 2 + 4 = 8. 7 n’est pas 8 : l’égalité est fausse pour x = 2. Fausse pour un nombre, elle n’est donc pas vraie pour tous.
   - figure : tableau côté · avec x = 2 / 3x + 1 · ? / 2x + 4 · ?
6. énoncé : 3(x + 4) = …
   - lu : 3 fois la parenthèse x plus 4. Développe.
   - choix : 3x + 4 · 3x + 12 · x + 12
   - réponse : 3x + 12
   - indice : Le 3 multiplie x, et il multiplie aussi 4.
   - explication : On multiplie chaque terme par 3 : 3 × x + 3 × 4 = 3x + 12. 3x + 4, c’est oublier de multiplier le 4 ; x + 12, c’est oublier de multiplier x.
   - figure : plane partagé 3 / x · 4 / ? · ?
7. énoncé : 7a + 7b = …
   - lu : 7 a plus 7 b. Factorise.
   - choix : 7(a + b) · 7a + b · 14(a + b)
   - réponse : 7(a + b)
   - indice : Quel nombre multiplie a, et multiplie aussi b ?
   - explication : 7 multiplie a et b : 7a + 7b = 7(a + b). On vérifie en développant : 7 × a + 7 × b. 14(a + b), c’est compter le 7 deux fois. 7a + b oublie que le 7 multiplie aussi b.
   - figure : plane partagé ? / a · b / 7a · 7b
8. énoncé : 6 × (100 + 2) = …
   - lu : 6 fois la parenthèse 100 plus 2, combien ?
   - choix : 602 · 608 · 612
   - réponse : 612
   - indice : Multiplie 100 par 6, puis 2 par 6.
   - explication : 6 × 100 + 6 × 2 = 600 + 12 = 612. 602, c’est oublier de multiplier le 2. 608, c’est 600 + 6 + 2.
   - figure : tableau calcul · résultat / 6 × 100 · ? / 6 × 2 · ?

## Statistiques et chances · `statistics`

- description : Lire un tableau, calculer une fréquence et une moyenne, puis dire les chances d’un évènement.
- compétences : c4.ma.5e.donnees.statistiques · c4.ma.5e.donnees.probabilites
- consigne : Lis la phrase, le tableau ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-5e-proportionality
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-5e-proportionality-statistics-1`

Pour tous les items :
- aide « Effectifs et moyenne » :
  - L’effectif : combien de fois une réponse est donnée.
  - L’effectif total : la somme de tous les effectifs.
  - La fréquence : l’effectif divisé par l’effectif total.
  - Elle s’écrit en fraction, en nombre décimal ou en pourcentage.
  - La moyenne : la somme des valeurs, divisée par le nombre de valeurs.

1. énoncé : D’après le tableau, la boisson la plus choisie est …
   - figure : tableau boisson · effectif / jus d’orange · 7 / lait · 5 / chocolat · 9 / eau · 3
   - lu : La boisson préférée au goûter. Jus d’orange, 7 élèves. Lait, 5 élèves. Chocolat, 9 élèves. Eau, 3 élèves. Quelle est la boisson la plus choisie ?
   - choix : jus d’orange · chocolat · eau
   - réponse : chocolat
   - indice : Cherche le plus grand effectif, puis lis la boisson sur la même ligne.
   - explication : Le plus grand effectif est 9, sur la ligne du chocolat. Le jus d’orange est sur la première ligne, mais 7 est plus petit que 9. L’eau a le plus petit effectif : 3.
2. énoncé : D’après le tableau, l’effectif total est …
   - figure : tableau boisson · effectif / jus d’orange · 7 / lait · 5 / chocolat · 9 / eau · 3
   - lu : La boisson préférée au goûter. Jus d’orange, 7 élèves. Lait, 5 élèves. Chocolat, 9 élèves. Eau, 3 élèves. Quel est l’effectif total ?
   - choix : 9 · 21 · 24
   - réponse : 24
   - indice : Additionne les effectifs de toutes les lignes.
   - explication : 7 + 5 + 9 + 3 = 24 : 24 élèves ont répondu. 21, c’est oublier la dernière ligne, l’eau. 9, c’est le plus grand effectif, pas le total.
3. énoncé : Sur 20 élèves, 5 viennent à vélo. La fréquence de « vélo » est …
   - lu : Sur 20 élèves, 5 viennent à vélo. Quelle est la fréquence de vélo ?
   - choix : 5/20 · 5/15 · 20/5
   - réponse : 5/20
   - indice : L’effectif de « vélo » va en haut, l’effectif total en bas.
   - explication : La fréquence, c’est l’effectif sur l’effectif total : 5 élèves sur 20, donc 5/20, 5 vingtièmes. 20/5 met la fraction à l’envers. 5/15 compare aux 15 autres élèves, pas aux 20 élèves.
   - figure : diagramme vélo · tous les élèves / 5 · 20
4. énoncé : Sur 50 élèves, 25 ont un animal. En pourcentage, la fréquence est …
   - lu : Sur 50 élèves, 25 ont un animal. Quelle est la fréquence, en pourcentage ?
   - choix : 2 % · 25 % · 50 %
   - réponse : 50 %
   - indice : 25 sur 50 : quelle part des élèves est-ce ?
   - explication : 25 sur 50, c’est la moitié des élèves : 50 %. 25 %, c’est l’effectif pris pour un pourcentage. 2 %, c’est 50 divisé par 25 : la division à l’envers.
   - figure : diagramme animal · pas d’animal / 25 · 25
5. énoncé : Sur 10 élèves, 4 portent des lunettes. En nombre décimal, la fréquence est …
   - lu : Sur 10 élèves, 4 portent des lunettes. Quelle est la fréquence, en nombre décimal ?
   - choix : 0,04 · 0,4 · 4
   - réponse : 0,4
   - indice : Divise l’effectif par l’effectif total : 4 divisé par 10.
   - explication : 4 ÷ 10 = 0,4. 4, c’est l’effectif : une fréquence n’est jamais plus grande que 1. 0,04, c’est diviser par 100 au lieu de 10.
   - figure : diagramme lunettes · tous les élèves / 4 · 10
6. énoncé : Les notes de Lina : 11, 15 et 10. Sa moyenne est …
   - lu : Les notes de Lina : 11, 15 et 10. Quelle est sa moyenne ?
   - choix : 12 · 15 · 36
   - réponse : 12
   - indice : Additionne les notes, puis divise par le nombre de notes.
   - explication : 11 + 15 + 10 = 36, et il y a 3 notes : 36 ÷ 3 = 12. 36, c’est la somme sans la division. 15, c’est la note écrite au milieu de la liste, pas la moyenne.
   - figure : diagramme 11 · 15 · 10
7. énoncé : En 4 jours, Tom lit 10, 22, 14 et 14 pages. En moyenne, il lit … pages par jour.
   - lu : En 4 jours, Tom lit 10, 22, 14 et 14 pages. En moyenne, combien de pages lit-il par jour ?
   - choix : 15 · 20 · 60
   - réponse : 15
   - indice : Il y a 4 valeurs : compte aussi le 14 deux fois.
   - explication : 10 + 22 + 14 + 14 = 60, et il y a 4 jours : 60 ÷ 4 = 15. 20, c’est 60 ÷ 3 : il y a 4 jours, pas 3. 60, c’est la somme sans la division.
   - figure : diagramme 10 · 22 · 14 · 14
8. énoncé : "Diagramme circulaire : comment les élèves viennent au collège\nÀ pied : la moitié du disque\nBus : un quart du disque\nVélo : un quart du disque"
   - question : Quelle est la fréquence de « bus » ?
   - lu : Diagramme circulaire : comment les élèves viennent au collège. À pied, la moitié du disque. Bus, un quart du disque. Vélo, un quart du disque. Quelle est la fréquence de bus ?
   - choix : 25 % · 50 % · 75 %
   - réponse : 25 %
   - indice : Tout le disque, c’est 100 %. Combien fait un quart ?
   - explication : Le bus a un quart du disque : 100 ÷ 4 = 25, donc 25 %. 50 %, c’est la moitié : la part de « à pied ». 75 %, c’est tous les autres élèves.
   - figure : fraction 1/4

### Niveau 2 · `maths-5e-proportionality-statistics-2`

Pour tous les items :
- aide « Les chances » :
  - Expérience aléatoire : on ne peut pas prévoir le résultat.
  - Une issue : un résultat possible. Un évènement : une ou plusieurs issues.
  - Impossible : probabilité 0. Certain : probabilité 1.
  - Issues qui ont la même chance : issues qui conviennent ÷ toutes les issues.
  - Une chance sur 5 : 1/5 = 0,2 = 20 %.

1. énoncé : Tirer une carte au hasard, sans pouvoir prévoir laquelle : c’est une expérience …
   - lu : Tirer une carte au hasard, sans pouvoir prévoir laquelle. Quel mot dit cette expérience ?
   - choix : aléatoire · certaine · impossible
   - réponse : aléatoire
   - indice : Relis la première ligne du rappel.
   - explication : On ne peut pas prévoir la carte : l’expérience est aléatoire, elle dépend du hasard. « Certain » et « impossible » disent les chances d’un évènement, pas une expérience.
2. énoncé : On lance un dé à six faces. « Obtenir 7 » est un évènement …
   - lu : On lance un dé à six faces. Obtenir 7, c’est quel évènement ?
   - choix : impossible · peu probable · certain
   - réponse : impossible
   - indice : Quels nombres sont écrits sur un dé à six faces ?
   - explication : Les faces vont de 1 à 6 : aucune face ne porte 7. L’évènement est impossible, sa probabilité est 0. « Peu probable » voudrait dire qu’il arrive quelquefois : ici, jamais.
   - figure : droite 1 · 6
3. énoncé : On lance un dé à six faces. « Obtenir un nombre pair » compte … issues.
   - lu : On lance un dé à six faces. Obtenir un nombre pair, combien d’issues ?
   - choix : 2 · 3 · 6
   - réponse : 3
   - indice : Écris les nombres pairs de 1 à 6.
   - explication : Les nombres pairs du dé sont 2, 4 et 6 : 3 issues. 2, c’est oublier le 6. 6, c’est toutes les issues du dé, pairs et impairs.
   - figure : droite 1 · 6
4. énoncé : On lance une pièce équilibrée. La probabilité d’obtenir pile est …
   - lu : On lance une pièce équilibrée. Quelle est la probabilité d’obtenir pile ?
   - choix : 1/2 · 1 · 2
   - réponse : 1/2
   - indice : Une pièce a deux faces. Combien donnent pile ?
   - explication : 2 issues, pile ou face, avec la même chance ; 1 seule donne pile : 1 issue sur 2, donc 1/2, un demi. 2, c’est le nombre d’issues : une probabilité n’est jamais plus grande que 1. 1 voudrait dire que pile est certain.
   - figure : diagramme pile · face / 1 · 1
5. énoncé : On lance un dé équilibré à six faces. La probabilité d’obtenir 3 est …
   - lu : On lance un dé équilibré à six faces. Quelle est la probabilité d’obtenir 3 ?
   - choix : 1/6 · 1/3 · 3/6
   - réponse : 1/6
   - indice : Combien de faces portent le 3 ? Combien de faces en tout ?
   - explication : Une seule face porte le 3, sur 6 faces : 1/6. 3/6, c’est prendre la valeur 3 pour un nombre d’issues. 1/3 met le 3 en bas, à la place des 6 faces.
   - figure : droite 1 · 6
6. énoncé : Un sac : 3 boules rouges et 7 bleues. On tire une boule au hasard. La probabilité de tirer une rouge est …
   - lu : Un sac contient 3 boules rouges et 7 boules bleues. On tire une boule au hasard. Quelle est la probabilité de tirer une rouge ?
   - choix : 3/10 · 3/7 · 7/10
   - réponse : 3/10
   - indice : Combien de boules en tout dans le sac ?
   - explication : 3 + 7 = 10 boules en tout, dont 3 rouges : 3/10. 3/7 compare aux bleues, pas à toutes les boules. 7/10, c’est la probabilité de tirer une bleue.
   - figure : diagramme rouges · bleues / 3 · 7
7. énoncé : « Une chance sur 4 », en nombre décimal, c’est …
   - lu : Une chance sur 4, en nombre décimal, c’est combien ?
   - choix : 0,25 · 0,4 · 4
   - réponse : 0,25
   - indice : Une chance sur 4, c’est 1 divisé par 4.
   - explication : Une chance sur 4, c’est 1/4, et 1 ÷ 4 = 0,25, soit 25 %. 0,4, c’est écrire le 4 après la virgule : 0,4, c’est 4 dixièmes. 4 est plus grand que 1 : ce n’est pas une probabilité.
   - figure : fraction 1/4
8. énoncé : Sur l’échelle de probabilité, de 0 à 1, « ne pas gagner au loto » se place …
   - lu : Sur l’échelle de probabilité, de 0 à 1, où se place l’évènement : ne pas gagner au loto ?
   - choix : près de 0 · au milieu · près de 1
   - réponse : près de 1
   - indice : Lis bien : « ne pas gagner ». Est-ce rare, ou presque sûr ?
   - explication : Gagner au loto est très rare, donc ne pas gagner est presque certain : près de 1. Près de 0, c’est la place de « gagner au loto ». Au milieu, c’est une chance sur deux, comme pile ou face.
   - figure : droite 0 · 1

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-5e-proportionality-1` | L’échoppe de Bazar | 40 | Mon échoppe ! Merci, bâtisseur. Cent pour cent debout, prix d’ami. |
| `maths-5e-proportionality-2` | L’auvent de l’échoppe | 50 | Un auvent et une porte ! La lanterne éclaire les comptes du soir. |
| `maths-5e-proportionality-3` | L’étal de l’échoppe | 60 | Un étal, une barrière, un escalier… Mon échoppe est complète : deux fois plus belle, pas deux fois plus chère. |

## Les demandes

### `maths-5e-proportionality-request-1`

- habitant : Bazar
- bloc : `french-5e-homophones`
- combien : 3
- petite construction : l’étagère
- demande : Il me faut {objet} pour mon étagère. Joue une mission du Carrefour des homophones.
- prête : Tu as les {blocs} ! Livre-les à Bazar.
- posée : Étagère posée chez Bazar !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : les gradins de la coupole (`dome()`) : devant, une marche de 3 panneaux au sol ; derrière, 3 toiles au sol et 3 toiles dessus ; 9 cubes, 6 cases, 2 de haut.
