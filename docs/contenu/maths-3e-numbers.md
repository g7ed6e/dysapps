---
lieu : maths-3e-numbers
module : Nombres et calcul littéral
matière : maths
classe : 3e
description : Puissances et notation scientifique, racines carrées et x² = a, nombres premiers et fractions irréductibles, développer et factoriser, équations produits et inéquations : la règle sous les yeux.
icône : wheat
monde ouvert seulement : oui
---

# Grenier

> Lieu du monde ouvert seulement (décision du mainteneur du 21 octobre 2026, 20 h 34 : seize lieux au 3e ; du 22 octobre 2026 : les dix missions neuves dans la pull request des seize lieux ; GD-24) : le Grenier n’existe que dans le monde ouvert du 3e d’Archipéo, jamais dans la grille ni dans Blocland. Ses cinq missions sont N1 à N5 de la carte des missions du 3e (`carte-missions-3e.md`, § 2), écrites sur les textes de 2020 et de 2026 ensemble (décision du mainteneur du 21 octobre 2026). Le lieu n’a ni gardien ni créature, comme l’Étalon et la Jonction : aucun écran ne les montrerait ; son habitant est le meunier, nommé par son métier, celui de la réplique de fin des plans. Aucun nom de contenu ne s’affiche dans le monde ouvert.
> Textes lus : annexe 3 de 2020 (`datagouv-cycle4-annexe3-2020.txt`, thème A, pages de `src/curriculum/cycle4.ts`, p. 130 et 131) ; programme de mathématiques du cycle 4 de 2026 (`cycle4-maths-2026.pdf`, M26), partie « Troisième », p. 10 et 11. Le 3e suit le texte de 2020 jusqu’à la rentrée 2028 : les missions citent les compétences de 2020, seules au référentiel pour le 3e ; les compétences `c4.ma.3e.*` de M26 s’ajouteront avec le référentiel de 2026 du 3e (carte des missions, § 4, PR 1, à décider par le mainteneur). Deux contenus sont de 2026 seul, signalés sous leur mission : l’inéquation (niveau 2 des Équations) et les identités (a + b)² et (a − b)² (niveau 2 de Développer, qui se démontrent en 2020 par la double distributivité).
> Les niveaux gagnent le bloc du Belvédère (`maths-3e-geometry`), son voisin du Versant : à confirmer par le directeur artistique. Titres de travail, à nommer par le consultant d’Archipéo. Écran : `CalculationScreen`, comme à l’Étalon. Les cinq niveaux que le 4e laissera partir à la bascule de 2027 (notation scientifique, quotients de puissances, facteurs premiers, double distributivité, produit nul) ont ici des identifiants neufs : la table des niveaux déplacés (`src/core/movedIds.ts`) se fera avec cette bascule, quand ils quitteront le 4e.

## Puissances · `power-rules`

> A20 p. 130 (« Puissance d’un nombre (exposants entiers, positifs ou négatifs) », « Notation scientifique ») ; M26 p. 10 et 11 (« Définir les puissances d’exposant négatif d’un nombre. Multiplier et diviser des puissances. Déterminer la notation scientifique d’un nombre. »). A20 demande d’appliquer la définition plutôt qu’une formule : les explications comptent les facteurs.

- description : Les exposants négatifs, multiplier et diviser des puissances d’un même nombre, puis la notation scientifique.
- compétences : c4.ma.a.puissances · c4.ma.a.ecritures-ordres-de-grandeur
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-3e-geometry
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-3e-numbers-power-rules-1`

- consigne : Choisis l’écriture décimale de la puissance. Le tableau est affiché.
- consigne courte : Touche l’écriture décimale de la puissance.

Pour tous les items :
- aide « Les puissances de 10 » :
  - 10² = 100 ; 10¹ = 10 ; 10⁰ = 1.
  - 10⁻¹ = 0,1 ; 10⁻² = 0,01 ; 10⁻³ = 0,001.
  - Un exposant négatif veut dire « 1 divisé par » : 10⁻³ = 1 ÷ 10³.
  - Un exposant négatif ne rend jamais le nombre négatif.

1. énoncé : 10⁻³ = …
   - lu : 10 puissance moins 3 égale (mot manquant).
   - choix : −30 · 0,0001 · 0,001
   - réponse : 0,001
   - indice : Un exposant négatif donne un nombre entre 0 et 1, pas un nombre négatif.
   - explication : 10⁻³ = 1 ÷ 10³ = 1 ÷ 1 000 = 0,001 : le 1 est au troisième rang après la virgule. −30, c’est 10 × (−3) : l’exposant n’est pas un facteur. 0,0001 a un zéro de trop : c’est 10⁻⁴.
2. énoncé : 0,01 s’écrit …
   - lu : 0,01 s’écrit (mot manquant).
   - choix : 10⁻² · 10⁻¹ · 10²
   - réponse : 10⁻²
   - indice : Compte le rang du 1 après la virgule.
   - explication : Dans 0,01, le 1 est au deuxième rang après la virgule : 0,01 = 1 ÷ 100 = 10⁻². 10⁻¹ = 0,1. 10² = 100 : le signe moins manque.
3. énoncé : 10⁰ = …
   - lu : 10 puissance 0 égale (mot manquant).
   - choix : 0 · 1 · 10
   - réponse : 1
   - indice : Regarde la ligne 10⁰ du tableau.
   - explication : Quand l’exposant baisse de 1, on divise par 10 : 10¹ = 10, donc 10⁰ = 10 ÷ 10 = 1. L’exposant 0 ne donne pas 0.
4. énoncé : 2⁻¹ = …
   - lu : 2 puissance moins 1 égale (mot manquant).
   - choix : −2 · 0,2 · 0,5
   - réponse : 0,5
   - indice : 2⁻¹ = 1 ÷ 2.
   - explication : 2⁻¹ = 1 ÷ 2 = 0,5. −2 rend le nombre négatif : un exposant négatif ne fait pas cela. 0,2 recopie le 2 après la virgule, comme pour une puissance de 10.
5. énoncé : 5 × 10⁻² = …
   - lu : 5 fois 10 puissance moins 2 égale (mot manquant).
   - choix : 0,05 · 0,5 · 500
   - réponse : 0,05
   - indice : Calcule d’abord 10⁻², puis multiplie par 5.
   - explication : 10⁻² = 0,01, et 5 × 0,01 = 0,05. 0,5 = 5 × 10⁻¹ : un rang de moins. 500 = 5 × 10² : le signe moins manque.
6. énoncé : Le plus petit de ces nombres est …
   - choix : 10⁻³ · 10⁻² · 10²
   - réponse : 10⁻³
   - indice : Écris chaque puissance en nombre décimal.
   - explication : 10⁻³ = 0,001 ; 10⁻² = 0,01 ; 10² = 100. Le plus petit est 0,001, soit 10⁻³.
7. énoncé : 1 ÷ 1 000 s’écrit …
   - lu : 1 divisé par 1000 s’écrit (mot manquant).
   - choix : 10⁻⁴ · 10⁻³ · 10³
   - réponse : 10⁻³
   - indice : 1 000 = 10³. Diviser par 10³ s’écrit avec un exposant négatif.
   - explication : 1 000 = 10³, et 1 ÷ 10³ = 10⁻³ = 0,001. 10³ = 1 000, sans division. 10⁻⁴ = 0,0001 : un zéro de trop.
8. énoncé : 3 × 10⁻³ = …
   - lu : 3 fois 10 puissance moins 3 égale (mot manquant).
   - choix : 0,0003 · 0,003 · 0,03
   - réponse : 0,003
   - indice : 10⁻³ = 0,001 : le 3 prend la place du 1.
   - explication : 3 × 0,001 = 0,003 : le 3 est au troisième rang après la virgule. 0,03 et 0,0003 décalent le 3 d’un rang.

### Niveau 2 · `maths-3e-numbers-power-rules-2`

- consigne : Écris avec une seule puissance. La règle est affichée.
- consigne courte : Touche l’écriture avec une seule puissance.

Pour tous les items :
- aide « Puissances d’un même nombre » :
  - a³ = a × a × a : trois facteurs a.
  - Multiplier : on compte tous les facteurs, donc on ajoute les exposants.
  - Diviser : on retire en haut autant de facteurs qu’il y en a en bas, donc on soustrait les exposants.
  - Le nombre a ne change pas, et les exposants ne se multiplient jamais.

1. énoncé : 10⁵ × 10³ = …
   - lu : 10 puissance 5 fois 10 puissance 3 égale (mot manquant).
   - choix : 10² · 10⁸ · 10¹⁵
   - réponse : 10⁸
   - indice : Compte les facteurs 10 : 5, puis 3 de plus.
   - explication : 5 facteurs 10, puis 3 autres : 5 + 3 = 8 facteurs, donc 10⁸. 10¹⁵ multiplie les exposants. 10² les soustrait.
2. énoncé : 2⁴ × 2³ = …
   - lu : 2 puissance 4 fois 2 puissance 3 égale (mot manquant).
   - choix : 2⁷ · 2¹² · 4⁷
   - réponse : 2⁷
   - indice : Le nombre 2 reste le même : seuls les facteurs s’ajoutent.
   - explication : 4 facteurs 2, puis 3 autres : 2⁷. 4⁷ multiplie aussi les 2 entre eux : le nombre ne change pas. 2¹² multiplie les exposants.
3. énoncé : 10⁶ ÷ 10² = …
   - lu : 10 puissance 6 divisé par 10 puissance 2 égale (mot manquant).
   - choix : 10³ · 10⁴ · 10⁸
   - réponse : 10⁴
   - indice : Les 2 facteurs du bas en enlèvent 2 en haut.
   - explication : 6 facteurs 10 en haut, 2 en bas : il en reste 6 − 2 = 4, donc 10⁴. 10³ divise les exposants. 10⁸ les ajoute.
4. énoncé : 10³ × 10⁻⁵ = …
   - lu : 10 puissance 3 fois 10 puissance moins 5 égale (mot manquant).
   - choix : 10⁻¹⁵ · 10⁻² · 10⁸
   - réponse : 10⁻²
   - indice : Ajoute les exposants : 3 + (−5).
   - explication : 3 + (−5) = −2, donc 10⁻². 10⁸ oublie le signe moins de −5. 10⁻¹⁵ multiplie les exposants.
5. énoncé : 5⁶ ÷ 5⁶ = …
   - lu : 5 puissance 6 divisé par 5 puissance 6 égale (mot manquant).
   - choix : 0 · 1 · 5
   - réponse : 1
   - indice : Un nombre divisé par lui-même donne toujours le même résultat.
   - explication : Un nombre divisé par lui-même donne 1. Avec la règle : 6 − 6 = 0, et 5⁰ = 1. 0 confond l’exposant 0 avec le nombre 0.
6. énoncé : 10⁻² × 10⁻³ = …
   - lu : 10 puissance moins 2 fois 10 puissance moins 3 égale (mot manquant).
   - choix : 10⁻⁶ · 10⁻⁵ · 10¹
   - réponse : 10⁻⁵
   - indice : Ajoute les exposants : (−2) + (−3).
   - explication : (−2) + (−3) = −5, donc 10⁻⁵ = 0,01 × 0,001 = 0,00001. 10⁻⁶ multiplie les exposants. 10¹ soustrait −3 au lieu de l’ajouter.
7. énoncé : 3² × 3³ = …
   - lu : 3 puissance 2 fois 3 puissance 3 égale (mot manquant).
   - choix : 3⁵ · 3⁶ · 9⁵
   - réponse : 3⁵
   - indice : Compte les facteurs 3 : 2, puis 3 de plus.
   - explication : 3 × 3, puis 3 × 3 × 3 : 5 facteurs 3, donc 3⁵. 3⁶ multiplie les exposants. 9⁵ multiplie aussi les 3 entre eux.
8. énoncé : 10⁴ ÷ 10⁻¹ = …
   - lu : 10 puissance 4 divisé par 10 puissance moins 1 égale (mot manquant).
   - choix : 10⁻⁴ · 10³ · 10⁵
   - réponse : 10⁵
   - indice : Soustrais les exposants : 4 − (−1).
   - explication : 4 − (−1) = 4 + 1 = 5, donc 10⁵ : diviser par 0,1, c’est multiplier par 10. 10³ oublie le signe moins de −1. 10⁻⁴ multiplie les exposants.

### Niveau 3 · `maths-3e-numbers-power-rules-3`

- consigne : Trouve la notation scientifique. La règle est affichée.
- consigne courte : Touche la notation scientifique.

Pour tous les items :
- aide « La notation scientifique » :
  - Un nombre s’écrit a × 10ⁿ, avec un seul chiffre avant la virgule de a, et ce chiffre n’est pas 0.
  - Un grand nombre : n est positif. Un nombre plus petit que 1 : n est négatif.
  - Chaque rang dont la virgule bouge change n de 1.
  - Vérifie : a × 10ⁿ doit redonner le nombre de départ.

1. énoncé : La notation scientifique de 4 500 est …
   - lu : La notation scientifique de 4500 est (mot manquant).
   - choix : 4,5 × 10² · 45 × 10² · 4,5 × 10³
   - réponse : 4,5 × 10³
   - indice : Place la virgule après le premier chiffre, puis compte les rangs.
   - explication : 4 500 = 4,5 × 1 000 = 4,5 × 10³. 45 × 10² vaut bien 4 500, mais 45 a deux chiffres avant la virgule. 4,5 × 10² = 450.
2. énoncé : La notation scientifique de 0,003 est …
   - lu : La notation scientifique de 0,003 est (mot manquant).
   - choix : 3 × 10⁻⁴ · 3 × 10⁻³ · 3 × 10³
   - réponse : 3 × 10⁻³
   - indice : 0,003 est plus petit que 1 : l’exposant est négatif.
   - explication : 0,003 = 3 × 0,001 = 3 × 10⁻³. 3 × 10³ = 3 000 : le signe moins manque. 3 × 10⁻⁴ = 0,0003 : un rang de trop.
3. énoncé : Lequel est écrit en notation scientifique ?
   - lu : Lequel est écrit en notation scientifique ?
   - choix : 0,8 × 10⁵ · 8 × 10⁴ · 80 × 10³
   - réponse : 8 × 10⁴
   - indice : Regarde le nombre devant « fois 10 » : un seul chiffre avant la virgule, et pas 0.
   - explication : Les trois valent 80 000, mais seul 8 × 10⁴ a un seul chiffre, différent de 0, avant la virgule. 0,8 commence par 0. 80 a deux chiffres.
4. énoncé : La notation scientifique de 0,00072 est …
   - lu : La notation scientifique de 0,00072 est (mot manquant).
   - choix : 7,2 × 10⁻⁵ · 72 × 10⁻⁵ · 7,2 × 10⁻⁴
   - réponse : 7,2 × 10⁻⁴
   - indice : Déplace la virgule juste après le 7, et compte les rangs.
   - explication : La virgule avance de 4 rangs pour arriver après le 7 : 0,00072 = 7,2 × 10⁻⁴. 72 × 10⁻⁵ vaut le même nombre, mais 72 a deux chiffres. 7,2 × 10⁻⁵ a un rang de trop.
5. énoncé : 32 × 10⁻⁵ en notation scientifique, c’est …
   - lu : 32 fois 10 puissance moins 5, en notation scientifique, c’est (mot manquant).
   - choix : 3,2 × 10⁻⁶ · 3,2 × 10⁻⁵ · 3,2 × 10⁻⁴
   - réponse : 3,2 × 10⁻⁴
   - indice : 32 = 3,2 × 10.
   - explication : 32 = 3,2 × 10¹, donc 32 × 10⁻⁵ = 3,2 × 10¹ × 10⁻⁵ = 3,2 × 10⁻⁴. 3,2 × 10⁻⁵ oublie le facteur 10. 3,2 × 10⁻⁶ le compte dans le mauvais sens.
6. énoncé : 2,5 × 10³ = …
   - lu : 2,5 fois 10 puissance 3 égale (mot manquant).
   - choix : 250 · 2 500 · 25 000
   - réponse : 2 500
   - indice : Multiplier par 10³, c’est multiplier par 1 000.
   - explication : 2,5 × 1 000 = 2 500 : la virgule avance de 3 rangs. 25 000 ajoute trois zéros à 25. 250 n’avance que de 2 rangs.
7. énoncé : La notation scientifique de 380 000 est …
   - lu : La notation scientifique de 380000 est (mot manquant).
   - choix : 3,8 × 10⁴ · 38 × 10⁴ · 3,8 × 10⁵
   - réponse : 3,8 × 10⁵
   - indice : De 380 000 à 3,8, combien de rangs la virgule recule-t-elle ?
   - explication : 380 000 = 3,8 × 100 000 = 3,8 × 10⁵. 38 × 10⁴ vaut le même nombre, mais 38 a deux chiffres. 3,8 × 10⁴ = 38 000.
8. énoncé : 6 × 10⁻² = …
   - lu : 6 fois 10 puissance moins 2 égale (mot manquant).
   - choix : 0,06 · 0,6 · 600
   - réponse : 0,06
   - indice : 10⁻² = 0,01.
   - explication : 6 × 0,01 = 0,06. 0,6 = 6 × 10⁻¹. 600 = 6 × 10² : le signe moins manque.

## Racines carrées · `square-equations`

> A20 p. 130 (« Définition de la racine carrée », « Les carrés parfaits de 1 à 144 », « Utiliser la racine carrée pour résoudre des problèmes, notamment géométriques ») et p. 131 (« Résoudre algébriquement des équations […] en particulier des équations du type x2 = a ») ; M26 p. 11 (« Résoudre analytiquement et graphiquement des équations de la forme x² = a. Résoudre des problèmes utilisant la racine carrée. »), et p. 10 pour l’encadrement, vu en 4e. La résolution graphique n’est pas faite ici.

- description : Calculer et encadrer une racine carrée, puis résoudre x² = a : deux solutions, une seule, ou aucune.
- compétences : c4.ma.a.carres-racine · c4.ma.a.equations
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-3e-geometry
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-3e-numbers-square-equations-1`

- consigne : Calcule ou encadre la racine carrée. Les carrés sont affichés.
- consigne courte : Calcule ou encadre, puis touche la réponse.

Pour tous les items :
- aide « La racine carrée » :
  - √a est le nombre positif dont le carré vaut a : √49 = 7, car 7² = 49.
  - Les carrés : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144.
  - Pour encadrer √n, cherche les deux carrés qui entourent n.
  - √(a + b) n’est pas √a + √b.

1. énoncé : √0,09 = …
   - lu : racine carrée de 0,09 égale (mot manquant).
   - choix : 0,03 · 0,045 · 0,3
   - réponse : 0,3
   - indice : Quel nombre, multiplié par lui-même, donne 0,09 ?
   - explication : 0,3 × 0,3 = 0,09, donc √0,09 = 0,3. 0,03 × 0,03 = 0,0009 : trop petit. 0,045 est la moitié de 0,09.
2. énoncé : √50 est entre …
   - lu : racine carrée de 50 est entre (mot manquant).
   - choix : 6 et 7 · 7 et 8 · 25 et 26
   - réponse : 7 et 8
   - indice : Quels carrés de la liste entourent 50 ?
   - explication : 49 < 50 < 64, donc √49 < √50 < √64 : √50 est entre 7 et 8. 25 et 26, c’est la moitié de 50. 6 et 7 donne 36 et 49 : 50 est au-dessus.
3. énoncé : √(9 + 16) = …
   - lu : racine carrée de la somme 9 plus 16 égale (mot manquant).
   - choix : 5 · 7 · 25
   - réponse : 5
   - indice : Calcule d’abord 9 + 16.
   - explication : 9 + 16 = 25, et √25 = 5. 7, c’est √9 + √16 = 3 + 4 : la racine d’une somme n’est pas la somme des racines. 25 oublie la racine.
4. énoncé : √20 est entre …
   - lu : racine carrée de 20 est entre (mot manquant).
   - choix : 4 et 5 · 10 et 11 · 16 et 25
   - réponse : 4 et 5
   - indice : 20 est entre deux carrés : lesquels ? Puis prends leurs racines.
   - explication : 16 < 20 < 25, donc √20 est entre √16 = 4 et √25 = 5. 16 et 25 sont les carrés, pas leurs racines. 10 et 11 entourent la moitié de 20.
5. énoncé : Un carré a une aire de 64 cm². Son côté mesure …
   - lu : Un carré a une aire de 64 centimètres carrés. Son côté mesure (mot manquant).
   - choix : 8 cm · 16 cm · 32 cm
   - réponse : 8 cm
   - indice : Aire du carré = côté × côté.
   - explication : côté × côté = 64, et 8 × 8 = 64 : le côté mesure √64 = 8 cm. 16 cm, c’est 64 ÷ 4, comme pour un périmètre. 32 cm, c’est la moitié de 64.
6. énoncé : (√7)² = …
   - lu : racine carrée de 7, le tout au carré, égale (mot manquant).
   - choix : 7 · 14 · 49
   - réponse : 7
   - indice : Relis la première ligne : que vaut le carré de √a ?
   - explication : √7 est le nombre dont le carré vaut 7 : (√7)² = 7. 14, c’est 7 × 2. 49, c’est 7².
7. énoncé : √36 + √64 = …
   - lu : racine carrée de 36 plus racine carrée de 64 égale (mot manquant).
   - choix : 10 · 14 · 100
   - réponse : 14
   - indice : Calcule chaque racine, puis ajoute.
   - explication : √36 = 6 et √64 = 8 : 6 + 8 = 14. 10, c’est √(36 + 64) = √100 : la somme des racines n’est pas la racine de la somme. 100 oublie les racines.
8. énoncé : Un carré a une aire de 30 m². Son côté mesure entre …
   - lu : Un carré a une aire de 30 mètres carrés. Son côté mesure entre (mot manquant).
   - choix : 5 m et 6 m · 7 m et 8 m · 15 m et 16 m
   - réponse : 5 m et 6 m
   - indice : Cherche les deux carrés de la liste qui entourent 30.
   - explication : 25 < 30 < 36 : le côté, √30, est entre 5 m et 6 m. 15 m et 16 m entourent la moitié de 30. 7 m et 8 m donnent des aires de 49 m² et 64 m² : trop grandes.

### Niveau 2 · `maths-3e-numbers-square-equations-2`

- consigne : Résous l’équation. La règle est affichée.
- consigne courte : Résous l’équation, puis touche la réponse.

Pour tous les items :
- aide « Résoudre x² = a » :
  - Si a est positif : deux solutions, √a et −√a. Par exemple x² = 4 : x = 2 ou x = −2.
  - Si a = 0 : une seule solution, x = 0.
  - Si a est négatif : aucune solution, car un carré n’est jamais négatif.

1. énoncé : x² = 25. Les solutions sont …
   - lu : x au carré égale 25. Les solutions sont (mot manquant).
   - choix : 5 seulement · 5 et −5 · 12,5 et −12,5
   - réponse : 5 et −5
   - indice : (−5)² vaut aussi 25.
   - explication : 5² = 25 et (−5)² = 25 : deux solutions, 5 et −5. « 5 seulement » oublie la solution négative. 12,5 est la moitié de 25 : 12,5² = 156,25.
2. énoncé : x² = −16. Les solutions sont …
   - lu : x au carré égale moins 16. Les solutions sont (mot manquant).
   - choix : 4 et −4 · −4 seulement · aucune solution
   - réponse : aucune solution
   - indice : Un carré peut-il être négatif ?
   - explication : Un carré n’est jamais négatif : x² = −16 n’a aucune solution. (−4)² = 16, pas −16.
3. énoncé : x² = 0. Les solutions sont …
   - lu : x au carré égale 0. Les solutions sont (mot manquant).
   - choix : 0 seulement · aucune solution
   - réponse : 0 seulement
   - indice : Quel nombre au carré donne 0 ?
   - explication : 0² = 0, et c’est le seul : x² = 0 a une seule solution, x = 0.
4. énoncé : x² = 49. Combien de solutions ?
   - lu : x au carré égale 49. Combien de solutions ?
   - choix : aucune · une · deux
   - réponse : deux
   - indice : 49 est positif.
   - explication : 49 est positif : deux solutions, 7 et −7, car 7² = 49 et (−7)² = 49.
5. énoncé : x² = 7. Les solutions sont …
   - lu : x au carré égale 7. Les solutions sont (mot manquant).
   - choix : √7 et −√7 · 3,5 et −3,5 · 49 et −49
   - réponse : √7 et −√7
   - indice : 7 n’est pas un carré de la liste : la solution s’écrit avec √.
   - explication : 7 est positif : x = √7 ou x = −√7. 3,5 est la moitié de 7. 49 est le carré de 7, pas sa racine.
6. énoncé : x² + 4 = 0. Combien de solutions ?
   - lu : x au carré plus 4 égale 0. Combien de solutions ?
   - choix : aucune · une · deux
   - réponse : aucune
   - indice : Écris d’abord l’équation sous la forme x² = a.
   - explication : x² + 4 = 0 donne x² = −4. Un carré n’est jamais négatif : aucune solution.
7. énoncé : Un carré a une aire de 81 m². Son côté x vérifie x² = 81. Le côté mesure …
   - lu : Un carré a une aire de 81 mètres carrés. Son côté x vérifie x au carré égale 81. Le côté mesure (mot manquant).
   - choix : 9 m · 9 m ou −9 m · 40,5 m
   - réponse : 9 m
   - indice : Une longueur peut-elle être négative ?
   - explication : L’équation a deux solutions, 9 et −9, mais une longueur est positive : le côté mesure 9 m. 40,5 m est la moitié de 81.
8. énoncé : 2x² = 18. Les solutions sont …
   - lu : 2 x au carré égale 18. Les solutions sont (mot manquant).
   - choix : 3 et −3 · 3 seulement · 9 et −9
   - réponse : 3 et −3
   - indice : Divise d’abord par 2 : x² = 9.
   - explication : 2x² = 18 donne x² = 9 : x = 3 ou x = −3. 9 et −9 s’arrêtent avant la racine. « 3 seulement » oublie la solution négative.

## Diviseurs et premiers · `prime-factors`

> A20 p. 131 (« Critères de divisibilité par 2, 3, 5, 9 », « Définition d’un nombre premier », « Décomposer un nombre entier en produit de facteurs premiers », « Simplifier une fraction pour la rendre irréductible ») ; M26 p. 10 (« Mettre une fraction sous forme irréductible ») et p. 11 (automatismes : « Factoriser un nombre entier positif : 60 = 2² × 3 × 5 », « Appliquer les critères de divisibilité par 2, 3, 5, 9 »).

- description : Les critères de divisibilité et les nombres premiers, puis décomposer un nombre et rendre une fraction irréductible.
- compétences : c4.ma.a.divisibilite-premiers
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-3e-geometry
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-3e-numbers-prime-factors-1`

- consigne : Utilise les critères pour répondre. La règle est affichée.
- consigne courte : Utilise les critères, puis touche la réponse.

Pour tous les items :
- aide « Diviseurs et nombres premiers » :
  - Par 2 : le chiffre des unités est pair. Par 5 : il est 0 ou 5.
  - Par 3 : la somme des chiffres est dans la table de 3. Par 9 : dans la table de 9.
  - Un nombre premier a exactement deux diviseurs : 1 et lui-même.
  - 1 n’est pas premier : il n’a qu’un diviseur.

1. énoncé : Lequel de ces nombres est premier ?
   - lu : Lequel de ces nombres est premier ?
   - choix : 1 · 21 · 23
   - réponse : 23
   - indice : Cherche un diviseur autre que 1 et le nombre lui-même.
   - explication : 23 n’a que deux diviseurs, 1 et 23 : il est premier. 21 = 3 × 7. 1 n’a qu’un diviseur : il n’est pas premier.
2. énoncé : 51 est-il un nombre premier ?
   - lu : 51 est-il un nombre premier ?
   - choix : oui · non
   - réponse : non
   - indice : Fais la somme des chiffres de 51.
   - explication : 5 + 1 = 6, dans la table de 3 : 51 est divisible par 3. 51 = 3 × 17 : il n’est pas premier.
3. énoncé : Lequel est divisible par 9 ?
   - lu : Lequel est divisible par 9 ?
   - choix : 385 · 387 · 393
   - réponse : 387
   - indice : Fais la somme des chiffres de chaque nombre.
   - explication : 3 + 8 + 7 = 18, dans la table de 9 : 387 = 9 × 43. Pour 393, 3 + 9 + 3 = 15 : divisible par 3, pas par 9. Pour 385, 3 + 8 + 5 = 16 : ni l’un ni l’autre.
4. énoncé : 57 est …
   - lu : 57 est (mot manquant).
   - choix : premier · divisible par 3 · divisible par 7
   - réponse : divisible par 3
   - indice : Fais la somme des chiffres de 57.
   - explication : 5 + 7 = 12, dans la table de 3 : 57 = 3 × 19. Il n’est donc pas premier. 7 × 8 = 56 : 57 n’est pas dans la table de 7.
5. énoncé : Le plus petit nombre premier est …
   - lu : Le plus petit nombre premier est (mot manquant).
   - choix : 0 · 1 · 2
   - réponse : 2
   - indice : Il faut exactement deux diviseurs.
   - explication : 2 a deux diviseurs, 1 et 2 : c’est le plus petit nombre premier. 1 n’a qu’un diviseur. 0 est divisible par tous les nombres.
6. énoncé : Combien de diviseurs a 13 ?
   - lu : Combien de diviseurs a 13 ?
   - choix : 1 · 2 · 13
   - réponse : 2
   - indice : 13 est-il dans une table, à part celles de 1 et de 13 ?
   - explication : 13 n’est divisible que par 1 et par 13 : il a 2 diviseurs, il est premier. 13 est le nombre lui-même, pas le nombre de ses diviseurs.
7. énoncé : 2 345 est divisible par …
   - lu : 2345 est divisible par (mot manquant).
   - choix : 2 · 5 · 9
   - réponse : 5
   - indice : Regarde le chiffre des unités, puis la somme des chiffres.
   - explication : 2 345 finit par 5 : il est divisible par 5. Il est impair : pas par 2. 2 + 3 + 4 + 5 = 14 : pas dans la table de 9.
8. énoncé : Lequel n’est pas premier ?
   - lu : Lequel n’est pas premier ?
   - choix : 29 · 31 · 39
   - réponse : 39
   - indice : Fais la somme des chiffres de chaque nombre.
   - explication : 3 + 9 = 12, dans la table de 3 : 39 = 3 × 13, il n’est pas premier. 29 et 31 n’ont que deux diviseurs.

### Niveau 2 · `maths-3e-numbers-prime-factors-2`

- consigne : Décompose, ou simplifie jusqu’au bout. La règle est affichée.
- consigne courte : Décompose ou simplifie, puis touche la réponse.

Pour tous les items :
- aide « Facteurs premiers et fractions » :
  - Décomposer : écrire le nombre comme un produit de nombres premiers. 60 = 2 × 2 × 3 × 5 = 2² × 3 × 5.
  - Divise par 2 tant que tu peux, puis par 3, puis par 5, puis par 7.
  - Une fraction est irréductible quand le haut et le bas n’ont plus d’autre diviseur commun que 1.

1. énoncé : La décomposition de 12 en facteurs premiers est …
   - lu : La décomposition de 12 en facteurs premiers est (mot manquant).
   - choix : 2 × 6 · 2² × 3 · 3 × 4
   - réponse : 2² × 3
   - indice : 6 et 4 sont-ils premiers ?
   - explication : 12 = 2 × 2 × 3 = 2² × 3 : tous les facteurs sont premiers. Dans 2 × 6 et 3 × 4, 6 et 4 ne sont pas premiers : on peut encore les décomposer.
2. énoncé : 2³ × 5 = …
   - lu : 2 puissance 3 fois 5 égale (mot manquant).
   - choix : 30 · 40 · 1 000
   - réponse : 40
   - indice : 2³ = 2 × 2 × 2.
   - explication : 2³ = 8, et 8 × 5 = 40. 30, c’est 2 × 3 × 5 : l’exposant n’est pas un facteur. 1 000, c’est 10³.
3. énoncé : La décomposition de 45 en facteurs premiers est …
   - lu : La décomposition de 45 en facteurs premiers est (mot manquant).
   - choix : 3² × 5 · 5 × 9 · 3 × 15
   - réponse : 3² × 5
   - indice : 9 et 15 sont-ils premiers ?
   - explication : 45 = 3 × 3 × 5 = 3² × 5. 9 = 3² et 15 = 3 × 5 ne sont pas premiers : on continue à décomposer.
4. énoncé : 48/36, rendue irréductible, devient …
   - lu : 48 sur 36, rendue irréductible, devient (mot manquant).
   - choix : 24/18 · 4/3 · 12/9
   - réponse : 4/3
   - indice : Après chaque division, cherche encore un diviseur commun.
   - explication : 48 = 2⁴ × 3 et 36 = 2² × 3² : on divise en haut et en bas par 12, et 48/36 = 4/3. 24/18 et 12/9 sont égales, mais pas irréductibles : 6 divise encore 24 et 18, 3 divise encore 12 et 9.
5. énoncé : Quelle fraction est irréductible ?
   - lu : Quelle fraction est irréductible ?
   - choix : 14/45 · 15/35 · 22/33
   - réponse : 14/45
   - indice : Décompose le haut et le bas de chaque fraction.
   - explication : 14 = 2 × 7 et 45 = 3² × 5 : aucun facteur commun, 14/45 est irréductible. 15 et 35 ont 5 en commun. 22 et 33 ont 11 en commun.
6. énoncé : 60/84, rendue irréductible, devient …
   - lu : 60 sur 84, rendue irréductible, devient (mot manquant).
   - choix : 30/42 · 10/14 · 5/7
   - réponse : 5/7
   - indice : 60 = 2² × 3 × 5 et 84 = 2² × 3 × 7.
   - explication : Les facteurs communs sont 2² × 3 = 12 : 60/84 = 5/7. 30/42 et 10/14 sont égales, mais pas irréductibles : 2 divise encore leurs deux nombres.
7. énoncé : Pour rendre 18/24 irréductible en une fois, on divise le haut et le bas par …
   - lu : Pour rendre 18 sur 24 irréductible en une fois, on divise le haut et le bas par (mot manquant).
   - choix : 2 · 3 · 6
   - réponse : 6
   - indice : 18 = 2 × 3² et 24 = 2³ × 3 : quels facteurs ont-ils en commun ?
   - explication : 18 et 24 ont en commun 2 × 3 = 6 : 18/24 = 3/4. Diviser par 2 donne 9/12, par 3 donne 6/8 : ces fractions ne sont pas encore irréductibles.
8. énoncé : La décomposition de 100 en facteurs premiers est …
   - lu : La décomposition de 100 en facteurs premiers est (mot manquant).
   - choix : 2² × 5² · 10² · 2 × 5 × 10
   - réponse : 2² × 5²
   - indice : 10 est-il premier ?
   - explication : 100 = 2 × 2 × 5 × 5 = 2² × 5². 10 n’est pas premier : 10² et 2 × 5 × 10 peuvent encore se décomposer.

## Développer · `identities`

> A20 p. 131 (« Propriétés de distributivité (simple et double) », « Factorisation de a2 - b2 », automatismes : « les formules de distributivité simple et double ; l’identité a2 – b2 = (a – b)(a + b) ») ; M26 p. 11 (« Utiliser la double distributivité pour développer et factoriser », « Manipuler les trois identités remarquables pour développer et factoriser »). (a + b)² et (a − b)² sont de 2026 seul ; en 2020, ils se développent par la double distributivité, ce que disent les explications du niveau 2.

- description : La double distributivité, les trois identités remarquables, puis factoriser avec elles.
- compétences : c4.ma.a.reduire-developper
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-3e-geometry
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-3e-numbers-identities-1`

- consigne : Développe et réduis. La règle est affichée.
- consigne courte : Développe et réduis, puis touche la réponse.

Pour tous les items :
- aide « La double distributivité » :
  - (a + b)(c + d) = ac + ad + bc + bd.
  - Chaque terme de la première parenthèse multiplie chaque terme de la seconde : quatre produits.
  - Puis on réduit : on regroupe les termes en x.
  - Signes : plus par moins donne moins ; moins par moins donne plus.

1. énoncé : (x + 2)(x + 3) = …
   - lu : Le produit de x plus 2 par x plus 3 égale (mot manquant).
   - choix : x² + 6 · x² + 5x + 6 · x² + 6x + 5
   - réponse : x² + 5x + 6
   - indice : Écris les quatre produits : x × x, x × 3, 2 × x, 2 × 3.
   - explication : x² + 3x + 2x + 6 = x² + 5x + 6. x² + 6 oublie les produits du milieu. x² + 6x + 5 échange le 5 et le 6.
2. énoncé : (x + 4)(x − 1) = …
   - lu : Le produit de x plus 4 par x moins 1 égale (mot manquant).
   - choix : x² + 3x − 4 · x² + 5x − 4 · x² − 3x − 4
   - réponse : x² + 3x − 4
   - indice : x × (−1) = −x, et 4 × x = 4x.
   - explication : x² − x + 4x − 4 = x² + 3x − 4. x² + 5x − 4 ajoute x au lieu de l’enlever. x² − 3x − 4 se trompe de signe : 4x − x = +3x.
3. énoncé : (2x + 1)(x + 5) = …
   - lu : Le produit de 2 x plus 1 par x plus 5 égale (mot manquant).
   - choix : 2x² + 10x + 5 · 2x² + 11x + 5 · 2x² + 5
   - réponse : 2x² + 11x + 5
   - indice : N’oublie pas le produit 1 × x.
   - explication : 2x × x = 2x², 2x × 5 = 10x, 1 × x = x, 1 × 5 = 5 : 2x² + 11x + 5. 2x² + 10x + 5 oublie 1 × x. 2x² + 5 oublie les deux produits du milieu.
4. énoncé : (x − 3)(x − 2) = …
   - lu : Le produit de x moins 3 par x moins 2 égale (mot manquant).
   - choix : x² − 5x − 6 · x² − 5x + 6 · x² + 5x + 6
   - réponse : x² − 5x + 6
   - indice : (−3) × (−2) : moins par moins donne plus.
   - explication : x² − 2x − 3x + 6 = x² − 5x + 6. x² − 5x − 6 se trompe sur (−3) × (−2) = +6. x² + 5x + 6 perd les deux signes moins.
5. énoncé : Pour développer (a + b)(c + d), on écrit combien de produits ?
   - lu : Pour développer le produit de a plus b par c plus d, on écrit combien de produits ?
   - choix : 2 · 3 · 4
   - réponse : 4
   - indice : Chaque terme de la première parenthèse multiplie chaque terme de la seconde.
   - explication : a multiplie c et d, puis b multiplie c et d : 2 × 2 = 4 produits, ac + ad + bc + bd.
6. énoncé : (x + 1)(x + 1) = …
   - lu : Le produit de x plus 1 par x plus 1 égale (mot manquant).
   - choix : x² + 1 · x² + 2x + 1 · 2x + 2
   - réponse : x² + 2x + 1
   - indice : Écris les quatre produits : x × x, x × 1, 1 × x, 1 × 1.
   - explication : x² + x + x + 1 = x² + 2x + 1. x² + 1 oublie les deux produits du milieu. 2x + 2 ajoute au lieu de multiplier.
7. énoncé : (3 − x)(x + 2) = …
   - lu : Le produit de 3 moins x par x plus 2 égale (mot manquant).
   - choix : −x² + x + 6 · −x² + 5x + 6 · x² + x + 6
   - réponse : −x² + x + 6
   - indice : (−x) × x = −x², et (−x) × 2 = −2x.
   - explication : 3x + 6 − x² − 2x = −x² + x + 6. −x² + 5x + 6 ajoute 2x au lieu de l’enlever. x² + x + 6 perd le signe moins de −x².
8. énoncé : (x − 4)(x + 4) = …
   - lu : Le produit de x moins 4 par x plus 4 égale (mot manquant).
   - choix : x² − 16 · x² + 16 · x² − 8x − 16
   - réponse : x² − 16
   - indice : Les deux produits du milieu, 4x et −4x, s’annulent.
   - explication : x² + 4x − 4x − 16 = x² − 16. x² + 16 se trompe sur (−4) × 4 = −16. x² − 8x − 16 n’annule pas 4x et −4x.

### Niveau 2 · `maths-3e-numbers-identities-2`

- consigne : Développe avec la bonne identité. Les trois identités sont affichées.
- consigne courte : Touche le développement avec la bonne identité.

Pour tous les items :
- aide « Les trois identités remarquables » :
  - (a + b)² = a² + 2ab + b².
  - (a − b)² = a² − 2ab + b².
  - (a − b)(a + b) = a² − b².
  - (a + b)² = (a + b)(a + b) : la double distributivité donne le double produit 2ab.

1. énoncé : (x + 3)² = …
   - lu : x plus 3, le tout au carré, égale (mot manquant).
   - choix : x² + 9 · x² + 3x + 9 · x² + 6x + 9
   - réponse : x² + 6x + 9
   - indice : Le double produit : 2 × x × 3.
   - explication : (x + 3)² = x² + 2 × x × 3 + 3² = x² + 6x + 9. x² + 9 oublie le double produit. x² + 3x + 9 oublie de le doubler.
2. énoncé : (x − 5)² = …
   - lu : x moins 5, le tout au carré, égale (mot manquant).
   - choix : x² − 25 · x² − 10x + 25 · x² − 10x − 25
   - réponse : x² − 10x + 25
   - indice : C’est la deuxième identité : le dernier terme, b², est toujours positif.
   - explication : (x − 5)² = x² − 2 × x × 5 + 5² = x² − 10x + 25. x² − 25 oublie le double produit : c’est (x − 5)(x + 5). x² − 10x − 25 se trompe sur 5² = +25.
3. énoncé : (3x)² = …
   - lu : 3 x, le tout au carré, égale (mot manquant).
   - choix : 3x² · 6x² · 9x²
   - réponse : 9x²
   - indice : (3x)² = 3x × 3x.
   - explication : 3x × 3x = 3 × 3 × x × x = 9x². 3x² n’élève que x au carré. 6x² double 3 au lieu de l’élever au carré.
4. énoncé : (x − 7)(x + 7) = …
   - lu : Le produit de x moins 7 par x plus 7 égale (mot manquant).
   - choix : x² − 49 · x² + 49 · x² − 14x + 49
   - réponse : x² − 49
   - indice : C’est la troisième identité : a² − b².
   - explication : (x − 7)(x + 7) = x² − 7² = x² − 49. x² + 49 se trompe de signe. x² − 14x + 49, c’est (x − 7)².
5. énoncé : (2x + 1)² = …
   - lu : 2 x plus 1, le tout au carré, égale (mot manquant).
   - choix : 2x² + 4x + 1 · 4x² + 2x + 1 · 4x² + 4x + 1
   - réponse : 4x² + 4x + 1
   - indice : a = 2x : a² = 4x², et 2ab = 2 × 2x × 1.
   - explication : (2x)² + 2 × 2x × 1 + 1² = 4x² + 4x + 1. 2x² + 4x + 1 n’élève pas le 2 au carré. 4x² + 2x + 1 oublie de doubler le produit.
6. énoncé : 101² = (100 + 1)² = …
   - lu : 101 au carré, c’est 100 plus 1, le tout au carré, égale (mot manquant).
   - choix : 10 001 · 10 101 · 10 201
   - réponse : 10 201
   - indice : 100² + 2 × 100 × 1 + 1².
   - explication : 10 000 + 200 + 1 = 10 201. 10 001 oublie le double produit, 200. 10 101 ne le double pas.
7. énoncé : (x − 1)² = …
   - lu : x moins 1, le tout au carré, égale (mot manquant).
   - choix : x² − 1 · x² − 2x + 1 · x² + 2x + 1
   - réponse : x² − 2x + 1
   - indice : C’est la deuxième identité, avec a = x et b = 1.
   - explication : (x − 1)² = x² − 2 × x × 1 + 1² = x² − 2x + 1. x² − 1 oublie le double produit. x² + 2x + 1, c’est (x + 1)².
8. énoncé : 99 × 101 = (100 − 1)(100 + 1) = …
   - lu : 99 fois 101, c’est le produit de 100 moins 1 par 100 plus 1, égale (mot manquant).
   - choix : 9 999 · 10 000 · 10 001
   - réponse : 9 999
   - indice : C’est la troisième identité : 100² − 1².
   - explication : (100 − 1)(100 + 1) = 100² − 1² = 10 000 − 1 = 9 999. 10 000 oublie le 1². 10 001 se trompe de signe.

### Niveau 3 · `maths-3e-numbers-identities-3`

- consigne : Factorise : écris un produit. Les identités sont affichées.
- consigne courte : Factorise, puis touche le produit.

Pour tous les items :
- aide « Factoriser » :
  - Factoriser, c’est écrire l’expression comme un produit.
  - a² − b² = (a − b)(a + b).
  - a² + 2ab + b² = (a + b)² ; a² − 2ab + b² = (a − b)².
  - Avec un facteur commun : ka + kb = k(a + b).

1. énoncé : x² − 9 = …
   - lu : x au carré moins 9 égale (mot manquant).
   - choix : (x − 3)² · (x − 3)(x + 3) · (x − 9)(x + 9)
   - réponse : (x − 3)(x + 3)
   - indice : 9 = 3² : c’est a² − b².
   - explication : x² − 9 = x² − 3² = (x − 3)(x + 3). (x − 3)² = x² − 6x + 9. (x − 9)(x + 9) oublie que 9 est déjà le carré de 3.
2. énoncé : x² + 10x + 25 = …
   - lu : x au carré plus 10 x plus 25 égale (mot manquant).
   - choix : (x + 5)² · (x − 5)² · (x + 5)(x − 5)
   - réponse : (x + 5)²
   - indice : 25 = 5², et 10x = 2 × x × 5, avec le signe plus.
   - explication : x² + 2 × x × 5 + 5² = (x + 5)². (x − 5)² donnerait − 10x. (x + 5)(x − 5) donnerait x² − 25.
3. énoncé : x² − 6x + 9 = …
   - lu : x au carré moins 6 x plus 9 égale (mot manquant).
   - choix : (x + 3)² · (x − 3)² · (x − 3)(x + 3)
   - réponse : (x − 3)²
   - indice : 9 = 3², et le double produit, 6x, a le signe moins.
   - explication : x² − 2 × x × 3 + 3² = (x − 3)². (x + 3)² donnerait + 6x. (x − 3)(x + 3) donnerait x² − 9.
4. énoncé : 4x² − 1 = …
   - lu : 4 x au carré moins 1 égale (mot manquant).
   - choix : (4x − 1)(4x + 1) · (2x − 1)(2x + 1) · (2x − 1)²
   - réponse : (2x − 1)(2x + 1)
   - indice : 4x² = (2x)², et 1 = 1².
   - explication : 4x² − 1 = (2x)² − 1² = (2x − 1)(2x + 1). (4x − 1)(4x + 1) donnerait 16x² − 1. (2x − 1)² donnerait 4x² − 4x + 1.
5. énoncé : 5x + 10 = …
   - lu : 5 x plus 10 égale (mot manquant).
   - choix : 5(x + 2) · 5(x + 10) · 5x(1 + 2)
   - réponse : 5(x + 2)
   - indice : 10 = 5 × 2 : 5 est un facteur commun.
   - explication : 5x + 10 = 5 × x + 5 × 2 = 5(x + 2). 5(x + 10) redonnerait 5x + 50. 5x(1 + 2) redonnerait 15x.
6. énoncé : x² − 100 = …
   - lu : x au carré moins 100 égale (mot manquant).
   - choix : (x − 10)(x + 10) · (x − 50)(x + 50) · (x − 10)²
   - réponse : (x − 10)(x + 10)
   - indice : 100 = 10².
   - explication : x² − 10² = (x − 10)(x + 10). 50 est la moitié de 100, pas sa racine. (x − 10)² donnerait x² − 20x + 100.
7. énoncé : 9x² + 6x + 1 = …
   - lu : 9 x au carré plus 6 x plus 1 égale (mot manquant).
   - choix : (3x + 1)² · (9x + 1)² · (3x − 1)²
   - réponse : (3x + 1)²
   - indice : 9x² = (3x)², 1 = 1², et 6x = 2 × 3x × 1.
   - explication : (3x)² + 2 × 3x × 1 + 1² = (3x + 1)². (9x + 1)² donnerait 81x² au début. (3x − 1)² donnerait − 6x.
8. énoncé : Quelle expression est factorisée ?
   - lu : Quelle expression est factorisée ?
   - choix : x² − 16 · (x − 4)(x + 4) · x² − 8x + 16
   - réponse : (x − 4)(x + 4)
   - indice : Une expression factorisée est un produit.
   - explication : (x − 4)(x + 4) est un produit de deux facteurs : elle est factorisée. x² − 16 et x² − 8x + 16 sont des sommes.

## Équations · `zero-product`

> A20 p. 131 (« Annulation d’un produit », « Mettre un problème en équation en vue de sa résolution », « Résoudre algébriquement des équations du premier degré ou s’y ramenant (équations produits) ») ; M26 p. 11 (« Résoudre une équation produit nul », « Résoudre analytiquement et graphiquement une inéquation du premier degré du type ax ⩾ b »). L’inéquation (niveau 2) est de 2026 seul : A20 n’en parle pas ; elle est citée sur `c4.ma.a.equations`, sa plus proche voisine, jusqu’au référentiel de 2026 du 3e. Les symboles ≥ et ≤ ne sont jamais seuls : les mots « supérieur ou égal à » sont écrits à côté, et les choix sont en mots.

- description : Les équations produits, puis les inéquations (le sens qui change quand on divise par un nombre négatif), puis mettre un problème en équation.
- compétences : c4.ma.a.equations
- bravo : Bien résolu !
- erreur : {explanation}
- bloc gagné : maths-3e-geometry
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-3e-numbers-zero-product-1`

- consigne : Résous l’équation produit. La règle est affichée.
- consigne courte : Résous l’équation produit, puis touche la réponse.

Pour tous les items :
- aide « Un produit égal à 0 » :
  - Si un produit est égal à 0, l’un de ses facteurs est égal à 0.
  - Chaque facteur égal à 0 donne une solution.
  - Par exemple (x − 1)(x + 2) = 0 : x − 1 = 0 ou x + 2 = 0, donc x = 1 ou x = −2.

1. énoncé : (x − 4)(x + 1) = 0. Les solutions sont …
   - lu : Le produit de x moins 4 par x plus 1 égale 0. Les solutions sont (mot manquant).
   - choix : 4 et −1 · −4 et 1 · 4 et 1
   - réponse : 4 et −1
   - indice : Résous x − 4 = 0, puis x + 1 = 0.
   - explication : x − 4 = 0 donne x = 4 ; x + 1 = 0 donne x = −1. −4 et 1 recopient les nombres des parenthèses avec leur signe : on change de signe en passant de l’autre côté.
2. énoncé : x(x − 5) = 0. Les solutions sont …
   - lu : x fois x moins 5 égale 0. Les solutions sont (mot manquant).
   - choix : 5 seulement · 0 et 5 · 0 et −5
   - réponse : 0 et 5
   - indice : Le premier facteur est x tout seul.
   - explication : x = 0, ou x − 5 = 0 qui donne x = 5 : deux solutions, 0 et 5. « 5 seulement » oublie le facteur x. 0 et −5 se trompe de signe.
3. énoncé : (x + 2)(x + 7) = 0. Les solutions sont …
   - lu : Le produit de x plus 2 par x plus 7 égale 0. Les solutions sont (mot manquant).
   - choix : −2 et −7 · 2 et 7 · −2 et 7
   - réponse : −2 et −7
   - indice : Résous x + 2 = 0, puis x + 7 = 0.
   - explication : x + 2 = 0 donne x = −2 ; x + 7 = 0 donne x = −7. 2 et 7 gardent les signes des parenthèses. −2 et 7 ne change qu’un des deux signes.
4. énoncé : (2x − 6)(x + 1) = 0. Les solutions sont …
   - lu : Le produit de 2 x moins 6 par x plus 1 égale 0. Les solutions sont (mot manquant).
   - choix : 3 et −1 · 6 et −1 · −3 et 1
   - réponse : 3 et −1
   - indice : 2x − 6 = 0 donne 2x = 6 : divise encore par 2.
   - explication : 2x = 6 donne x = 3 ; x + 1 = 0 donne x = −1. 6 et −1 oublie de diviser par 2. −3 et 1 se trompe sur les deux signes.
5. énoncé : Si A × B = 0, alors …
   - lu : Si A fois B égale 0, alors (mot manquant).
   - choix : A = 0 et B = 0 · A = 0 ou B = 0 · A = B
   - réponse : A = 0 ou B = 0
   - indice : 0 × 5 = 0 : faut-il que les deux soient nuls ?
   - explication : Il suffit qu’un des facteurs soit nul : A = 0 ou B = 0. 0 × 5 = 0, alors que 5 n’est pas nul : « et » est trop fort. A = B n’a pas de lien avec le produit nul.
6. énoncé : (x − 3)² = 0. Les solutions sont …
   - lu : x moins 3, le tout au carré, égale 0. Les solutions sont (mot manquant).
   - choix : 3 seulement · 3 et −3 · 9 seulement
   - réponse : 3 seulement
   - indice : (x − 3)² = (x − 3)(x − 3) : les deux facteurs sont les mêmes.
   - explication : Les deux facteurs sont x − 3 : une seule solution, x = 3. 3 et −3 confond avec x² = 9. 9 élève 3 au carré.
7. énoncé : (5 − x)(x + 4) = 0. Les solutions sont …
   - lu : Le produit de 5 moins x par x plus 4 égale 0. Les solutions sont (mot manquant).
   - choix : 5 et −4 · −5 et 4 · 5 et 4
   - réponse : 5 et −4
   - indice : 5 − x = 0 : quel nombre enlevé à 5 donne 0 ?
   - explication : 5 − x = 0 donne x = 5 ; x + 4 = 0 donne x = −4. −5 et 4 se trompe sur les deux signes. 5 et 4 oublie le signe de −4.
8. énoncé : (x − 1)(x − 8) = 0. Les solutions sont …
   - lu : Le produit de x moins 1 par x moins 8 égale 0. Les solutions sont (mot manquant).
   - choix : 1 et 8 · −1 et −8 · 1 et −8
   - réponse : 1 et 8
   - indice : Résous x − 1 = 0, puis x − 8 = 0.
   - explication : x − 1 = 0 donne x = 1 ; x − 8 = 0 donne x = 8. −1 et −8 gardent les signes des parenthèses. 1 et −8 ne change qu’un des deux signes.

### Niveau 2 · `maths-3e-numbers-zero-product-2`

- consigne : Résous l’inéquation. La règle est affichée.
- consigne courte : Résous l’inéquation, puis touche la réponse.

Pour tous les items :
- aide « Résoudre une inéquation » :
  - ≥ se lit « supérieur ou égal à » ; ≤ se lit « inférieur ou égal à ».
  - On divise les deux côtés par le même nombre.
  - Par un nombre positif : le sens ne change pas.
  - Par un nombre négatif : le sens change, ≥ devient ≤.

1. énoncé : 3x ≥ 12 (3x supérieur ou égal à 12). Les solutions sont les nombres …
   - lu : 3 x supérieur ou égal à 12. Les solutions sont les nombres (mot manquant).
   - choix : supérieurs ou égaux à 4 · inférieurs ou égaux à 4 · supérieurs ou égaux à 9
   - réponse : supérieurs ou égaux à 4
   - indice : On divise par 3 : un nombre positif.
   - explication : 12 ÷ 3 = 4, et 3 est positif : le sens ne change pas, x ≥ 4. « Inférieurs » change le sens sans raison. 9, c’est 12 − 3 : on divise, on ne soustrait pas.
2. énoncé : −2x ≥ 6 (−2x supérieur ou égal à 6). Les solutions sont les nombres …
   - lu : moins 2 x supérieur ou égal à 6. Les solutions sont les nombres (mot manquant).
   - choix : supérieurs ou égaux à −3 · inférieurs ou égaux à −3 · inférieurs ou égaux à 3
   - réponse : inférieurs ou égaux à −3
   - indice : On divise par −2 : un nombre négatif.
   - explication : 6 ÷ (−2) = −3, et on divise par un nombre négatif : le sens change, x ≤ −3. « Supérieurs ou égaux à −3 » garde le sens. « Inférieurs ou égaux à 3 » oublie le signe moins.
3. énoncé : 5x ≤ 20 (5x inférieur ou égal à 20). Les solutions sont les nombres …
   - lu : 5 x inférieur ou égal à 20. Les solutions sont les nombres (mot manquant).
   - choix : inférieurs ou égaux à 4 · supérieurs ou égaux à 4 · inférieurs ou égaux à 15
   - réponse : inférieurs ou égaux à 4
   - indice : On divise par 5 : un nombre positif.
   - explication : 20 ÷ 5 = 4, et 5 est positif : le sens ne change pas, x ≤ 4. « Supérieurs » change le sens sans raison. 15, c’est 20 − 5.
4. énoncé : −x ≥ 2 (−x supérieur ou égal à 2). Les solutions sont les nombres …
   - lu : moins x supérieur ou égal à 2. Les solutions sont les nombres (mot manquant).
   - choix : supérieurs ou égaux à −2 · inférieurs ou égaux à −2 · inférieurs ou égaux à 2
   - réponse : inférieurs ou égaux à −2
   - indice : −x = −1 × x : on divise par −1.
   - explication : On divise par −1, un nombre négatif : le sens change, x ≤ −2. « Supérieurs ou égaux à −2 » garde le sens. « Inférieurs ou égaux à 2 » oublie de changer le signe de 2.
5. énoncé : On divise les deux côtés de −4x ≥ 8 (−4x supérieur ou égal à 8) par −4. Le signe ≥ (supérieur ou égal) …
   - lu : On divise les deux côtés de moins 4 x supérieur ou égal à 8 par moins 4. Le signe supérieur ou égal (mot manquant).
   - choix : reste « supérieur ou égal » · devient « inférieur ou égal »
   - réponse : devient « inférieur ou égal »
   - indice : −4 est-il positif ou négatif ?
   - explication : On divise par −4, un nombre négatif : le sens change. On obtient x ≤ −2.
6. énoncé : 2x ≥ −10 (2x supérieur ou égal à −10). Les solutions sont les nombres …
   - lu : 2 x supérieur ou égal à moins 10. Les solutions sont les nombres (mot manquant).
   - choix : supérieurs ou égaux à −5 · inférieurs ou égaux à −5 · supérieurs ou égaux à 5
   - réponse : supérieurs ou égaux à −5
   - indice : On divise par 2 : c’est le nombre qui divise qui compte, pas le −10.
   - explication : −10 ÷ 2 = −5, et 2 est positif : le sens ne change pas, x ≥ −5. Le −10 de droite ne change pas le sens. « Supérieurs ou égaux à 5 » oublie le signe moins.
7. énoncé : 4 est-il une solution de 2x ≥ 8 (2x supérieur ou égal à 8) ?
   - lu : 4 est-il une solution de 2 x supérieur ou égal à 8 ?
   - choix : oui · non
   - réponse : oui
   - indice : Remplace x par 4 : 2 × 4 = 8.
   - explication : 2 × 4 = 8, et 8 est supérieur ou égal à 8 : « ou égal » compte. 4 est une solution.
8. énoncé : −3x ≤ 9 (−3x inférieur ou égal à 9). Les solutions sont les nombres …
   - lu : moins 3 x inférieur ou égal à 9. Les solutions sont les nombres (mot manquant).
   - choix : inférieurs ou égaux à −3 · supérieurs ou égaux à −3 · supérieurs ou égaux à 3
   - réponse : supérieurs ou égaux à −3
   - indice : On divise par −3 : un nombre négatif.
   - explication : 9 ÷ (−3) = −3, et on divise par un nombre négatif : le sens change, x ≥ −3. « Inférieurs ou égaux à −3 » garde le sens. « Supérieurs ou égaux à 3 » oublie le signe moins.

### Niveau 3 · `maths-3e-numbers-zero-product-3`

- consigne : Mets le problème en équation, ou résous-le. La méthode est affichée.
- consigne courte : Mets en équation, ou résous, puis touche.

Pour tous les items :
- aide « Mettre un problème en équation » :
  - Choisis l’inconnue : x est le nombre cherché.
  - Traduis chaque phrase en calcul avec x.
  - Écris l’égalité, puis résous-la.
  - Vérifie la solution dans l’énoncé.

1. énoncé : Le triple d’un nombre, plus 5, vaut 20. Quelle équation traduit la phrase ?
   - lu : Le triple d’un nombre, plus 5, vaut 20. Quelle équation traduit la phrase ?
   - choix : 3x + 5 = 20 · 3(x + 5) = 20 · x + 3 + 5 = 20
   - réponse : 3x + 5 = 20
   - indice : Le triple de x, c’est 3x. Puis on ajoute 5.
   - explication : Le triple du nombre, 3x, plus 5 : 3x + 5 = 20. 3(x + 5) ajoute 5 avant de tripler. x + 3 + 5 ajoute 3 au lieu de tripler.
2. énoncé : Le double d’un nombre, moins 4, vaut 10. Le nombre est …
   - lu : Le double d’un nombre, moins 4, vaut 10. Le nombre est (mot manquant).
   - choix : 3 · 7 · 14
   - réponse : 7
   - indice : 2x − 4 = 10 : ajoute 4 des deux côtés, puis divise par 2.
   - explication : 2x − 4 = 10 donne 2x = 14, puis x = 7. Vérifie : 2 × 7 − 4 = 10. 3 enlève 4 au lieu de l’ajouter. 14 oublie de diviser par 2.
3. énoncé : Léa a x ans. Son père a 3 fois son âge. À eux deux, ils ont 48 ans. Quelle équation ?
   - lu : Léa a x ans. Son père a 3 fois son âge. À eux deux, ils ont 48 ans. Quelle équation ?
   - choix : x + 3x = 48 · 3x = 48 · x + 3 = 48
   - réponse : x + 3x = 48
   - indice : À eux deux : l’âge de Léa plus l’âge de son père.
   - explication : Léa a x ans, son père 3x : x + 3x = 48. 3x = 48 oublie l’âge de Léa. x + 3 ajoute 3 ans au lieu de tripler.
4. énoncé : Léa a x ans, son père 3 fois plus. À eux deux, ils ont 48 ans. Léa a …
   - lu : Léa a x ans, son père 3 fois plus. À eux deux, ils ont 48 ans. Léa a (mot manquant).
   - choix : 12 ans · 16 ans · 36 ans
   - réponse : 12 ans
   - indice : x + 3x = 4x.
   - explication : 4x = 48, donc x = 12 : Léa a 12 ans, son père 36. Vérifie : 12 + 36 = 48. 16 divise 48 par 3 au lieu de 4. 36 ans, c’est l’âge du père.
5. énoncé : Un rectangle a pour longueur x + 3 et pour largeur x. Son périmètre vaut 26. Quelle équation ?
   - lu : Un rectangle a pour longueur x plus 3 et pour largeur x. Son périmètre vaut 26. Quelle équation ?
   - choix : 2x + 3 = 26 · 2(x + 3) + 2x = 26 · x(x + 3) = 26
   - réponse : 2(x + 3) + 2x = 26
   - indice : Le périmètre : deux longueurs et deux largeurs.
   - explication : Deux longueurs, 2(x + 3), et deux largeurs, 2x : 2(x + 3) + 2x = 26. x(x + 3), c’est l’aire. 2x + 3 ne compte qu’une longueur et une largeur.
6. énoncé : Un rectangle a pour longueur x + 3 et pour largeur x. Son périmètre vaut 26. Alors x vaut …
   - lu : Un rectangle a pour longueur x plus 3 et pour largeur x. Son périmètre vaut 26. Alors x vaut (mot manquant).
   - choix : 5 · 5,75 · 11,5
   - réponse : 5
   - indice : 2(x + 3) + 2x = 4x + 6.
   - explication : 4x + 6 = 26 donne 4x = 20, puis x = 5. Vérifie : 2 × 8 + 2 × 5 = 26. 5,75 oublie de doubler le 3. 11,5 vient de 2x + 3 = 26.
7. énoncé : Le carré d’un nombre négatif vaut 36. Ce nombre est …
   - lu : Le carré d’un nombre négatif vaut 36. Ce nombre est (mot manquant).
   - choix : −18 · −6 · 6
   - réponse : −6
   - indice : x² = 36 a deux solutions : laquelle est négative ?
   - explication : x² = 36 donne x = 6 ou x = −6 ; le nombre est négatif : −6. 6 est positif. −18 est la moitié de 36, avec un signe moins.
8. énoncé : Deux places de cinéma et un menu à 7 € coûtent 25 €. Une place coûte …
   - lu : Deux places de cinéma et un menu à 7 euros coûtent 25 euros. Une place coûte (mot manquant).
   - choix : 9 € · 12,50 € · 18 €
   - réponse : 9 €
   - indice : 2x + 7 = 25.
   - explication : 2x + 7 = 25 donne 2x = 18, puis x = 9 €. Vérifie : 2 × 9 + 7 = 25. 18 € oublie de diviser par 2. 12,50 €, c’est 25 ÷ 2, sans enlever le menu.

## Les plans

> Ni la grille ni Blocland ne dessinent ces plans : le Grenier n’y est pas. Leurs cases (la forme de `src/game/world/architect.ts`, comme l’Étalon) donnent ses parties au monde ouvert, qui rebâtit le lieu en 3 + 1 + 1 : le premier plan, en trois rangées, porte le corps 1 sur 3 (Puissances), 2 sur 3 (Racines carrées), 3 sur 3 (Diviseurs et premiers) ; le deuxième, le haut (Développer) ; le troisième, les abords (Équations). XP des lieux voisins (40, 50, 60). Aucun nom ni aucune réplique ne dit « grenier » en nom commun (directeur artistique, `da-lieux-3e.md`, point 13), ni le Grappin. La réplique de fin est dite par le meunier, si le monde ouvert la reprend (proposition du consultant : « Ici, chacun avait sa part des provisions. »).
> Pas de « ## Au lieu · Archipéo » : les jumeaux attendent la catégorie de scène de chaque mission (GD-20) et l’objet des réponses de la scénette (les écuelles). Pas de « ## Les demandes » : un lieu du monde ouvert seulement n’a pas de commande.

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-3e-numbers-1` | La réserve du meunier | 40 | La réserve tient sur ses pieds. Les sacs sont au sec. |
| `maths-3e-numbers-2` | Le toit de la réserve | 50 | Un toit d’ardoise sur la réserve. La neige peut tomber. |
| `maths-3e-numbers-3` | Les abords de la réserve | 60 | Tout est rangé autour de la réserve. Ici, chacun avait sa part des provisions. |
