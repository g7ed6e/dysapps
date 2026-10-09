---
lieu : maths-3e-geometry
module : Géométrie : Pythagore, Thalès, trigonométrie
matière : maths
classe : 3e
description : Une longueur manquante dans un triangle rectangle ou une configuration de Thalès, la figure codée sous les yeux ; puis les réciproques : le triangle est-il rectangle, les droites sont-elles parallèles ?
gardien : le Sphinx de marbre
icône : compass
créature : Théo
---

# Belvédère de Thalès

## Pythagore · `pythagoras`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : L’hypoténuse, puis un côté de l’angle droit, puis le câble d’un mât, enfin la réciproque : le triangle est-il rectangle ?
- compétences : c4.ma.d.pythagore · c4.ma.a.carres-racine

## Thalès · `thales`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Une longueur manquante avec deux droites parallèles, puis la hauteur d’un mât ou son ombre, mesurée avec un bâton, enfin la réciproque : les droites sont-elles parallèles ?
- compétences : c4.ma.d.thales

## Trigo · `trigonometry`

> Ses exercices sont produits par le code (`src/game/exercises/`), pas écrits ici.

- description : Cosinus, sinus ou tangente : le bon rapport.
- compétences : c4.ma.d.trigonometrie

## Agrandir · `scaling`

- description : Agrandir ou réduire : longueurs, angles, aires, volumes et échelle d’une carte, puis les angles du triangle et des droites parallèles.
- compétences : c4.ma.c.agrandissement · c4.ma.d.angles-triangles
- consigne : Lis la phrase ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien calculé !
- erreur : {explanation}
- bloc gagné : maths-3e-geometry
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-3e-geometry-scaling-1`

Pour tous les items :
- aide « Agrandir ou réduire de rapport k » :
  - k plus grand que 1 : agrandissement. k entre 0 et 1 : réduction.
  - Les longueurs sont multipliées par k.
  - Les angles ne changent pas.
  - Les aires sont multipliées par k × k.
  - Les volumes sont multipliés par k × k × k.
  - Carte à l’échelle 1 / n : 1 cm sur la carte, c’est n cm en vrai.

1. énoncé : Un triangle est agrandi de rapport 3. Un côté de 4 cm devient …
   - lu : Un triangle est agrandi de rapport 3. Un côté de 4 centimètres devient (mot manquant)
   - choix : 1 cm · 7 cm · 12 cm
   - réponse : 12 cm
   - indice : Une longueur est multipliée par le rapport.
   - explication : Les longueurs sont multipliées par 3 : 4 × 3 = 12 cm. 7 cm, c’est 4 + 3 : on multiplie, on n’ajoute pas. 1 cm, c’est 4 − 3 : un agrandissement ne rapetisse pas.
   - figure : tableau figure (cm) · image (cm) / 1 · 3 / 4 · ?
2. énoncé : On agrandit une figure de rapport 2. Un angle de 40° devient …
   - lu : On agrandit une figure de rapport 2. Un angle de 40 degrés devient (mot manquant)
   - choix : 20° · 40° · 80°
   - réponse : 40°
   - indice : La figure grandit, mais garde-t-elle la même forme ?
   - explication : Un agrandissement garde la forme : les angles ne changent pas, l’angle mesure toujours 40°. 80°, c’est multiplier par 2, ce qui vaut pour une longueur. 20°, c’est diviser par 2 : les angles ne changent ni dans un agrandissement, ni dans une réduction.
3. énoncé : Une figure de 5 cm² est agrandie de rapport 2. Son aire devient …
   - lu : Une figure de 5 centimètres carrés est agrandie de rapport 2. Son aire devient (mot manquant)
   - choix : 7 cm² · 10 cm² · 20 cm²
   - réponse : 20 cm²
   - indice : Une aire est multipliée par le rapport, deux fois.
   - explication : L’aire est multipliée par 2 × 2 = 4 : 5 × 4 = 20 cm². 10 cm², c’est multiplier par 2 seulement, comme une longueur. 7 cm², c’est 5 + 2 : on multiplie, on n’ajoute pas.
4. énoncé : Une boîte de 4 cm³ est agrandie de rapport 2. Son volume devient …
   - lu : Une boîte de 4 centimètres cubes est agrandie de rapport 2. Son volume devient (mot manquant)
   - choix : 8 cm³ · 16 cm³ · 32 cm³
   - réponse : 32 cm³
   - indice : Un volume est multiplié par le rapport, trois fois.
   - explication : Le volume est multiplié par 2 × 2 × 2 = 8 : 4 × 8 = 32 cm³. 8 cm³, c’est multiplier par 2, comme une longueur ; 16 cm³, c’est multiplier par 4, comme une aire.
5. énoncé : Une maquette de bateau est une réduction de rapport 1/10. Le vrai mât mesure 3 m. Sur la maquette, il mesure …
   - lu : Une maquette de bateau est une réduction de rapport un dixième. Le vrai mât mesure 3 mètres. Sur la maquette, il mesure (mot manquant)
   - choix : 3 cm · 30 cm · 300 cm
   - réponse : 30 cm
   - indice : Écris 3 mètres en centimètres, puis divise par 10.
   - explication : 3 m = 300 cm, et 300 ÷ 10 = 30 cm. 300 cm, c’est la vraie longueur, sans réduction. 3 cm, c’est diviser par 100 au lieu de 10.
   - figure : tableau maquette (cm) · vrai bateau (cm) / 1 · 10 / ? · 300
6. énoncé : "Carte de randonnée\nÉchelle : 1 / 25 000\nSur la carte, le sentier mesure 4 cm."
   - question : Quelle est la vraie longueur du sentier ?
   - lu : Carte de randonnée. Échelle, 1 sur 25 000. Sur la carte, le sentier mesure 4 centimètres.
   - choix : 1 km · 10 km · 100 km
   - réponse : 1 km
   - indice : Calcule d’abord en centimètres. 1 kilomètre, c’est 100 000 centimètres.
   - explication : 4 × 25 000 = 100 000 cm, et 100 000 cm = 1 000 m = 1 km. 10 km et 100 km viennent d’une erreur de conversion : 100 000 cm, ce n’est ni 10 000 m ni 100 000 m, c’est 1 000 m.
   - figure : tableau carte (cm) · terrain (cm) / 1 · 25 000 / 4 · ?
7. énoncé : Un rectangle large de 3 cm devient large de 12 cm. Le rapport d’agrandissement est …
   - lu : Un rectangle large de 3 centimètres devient large de 12 centimètres. Le rapport d’agrandissement est (mot manquant)
   - choix : 4 · 9 · 36
   - réponse : 4
   - indice : Par combien faut-il multiplier 3 pour obtenir 12 ?
   - explication : 3 × 4 = 12 : le rapport est 4. 9, c’est 12 − 3 : le rapport multiplie, il ne s’ajoute pas. 36, c’est 3 × 12.
   - figure : droite 0 · 12 / 3 · 12
8. énoncé : Une figure de 60 cm² est réduite de rapport 0,5. Son aire devient …
   - lu : Une figure de 60 centimètres carrés est réduite de rapport 0,5. Son aire devient (mot manquant)
   - choix : 7,5 cm² · 15 cm² · 30 cm²
   - réponse : 15 cm²
   - indice : Une aire est multipliée par le rapport, deux fois.
   - explication : L’aire est multipliée par 0,5 × 0,5 = 0,25 : elle est divisée par 4. 60 ÷ 4 = 15 cm². 30 cm², c’est multiplier par 0,5 une seule fois, comme une longueur. 7,5 cm², c’est diviser par 8, comme un volume.

### Niveau 2 · `maths-3e-geometry-scaling-2`

Pour tous les items :
- aide « Angles et triangles » :
  - Dans un triangle, la somme des trois angles fait 180°.
  - Un côté est toujours plus petit que la somme des deux autres.
  - Un côté égal à la somme des deux autres : les trois points sont alignés.
  - Alternes-internes : entre les deux droites, de part et d’autre de la sécante. Correspondants : du même côté de la sécante, à la même place à chaque croisement.
  - Droites parallèles coupées par une sécante : angles alternes-internes égaux, angles correspondants égaux.
  - Réciproque : angles alternes-internes égaux, ou correspondants égaux, alors les droites sont parallèles.

1. énoncé : Dans un triangle, deux angles mesurent 50° et 60°. Le troisième mesure …
   - lu : Dans un triangle, deux angles mesurent 50 degrés et 60 degrés. Le troisième mesure (mot manquant)
   - choix : 70° · 110° · 250°
   - réponse : 70°
   - indice : Additionne les deux angles, puis cherche ce qui manque pour faire 180 degrés.
   - explication : 50 + 60 = 110, et 180 − 110 = 70 : le troisième angle mesure 70°. 110°, c’est la somme des deux angles, pas ce qui manque. 250°, c’est 360 − 110 : les angles d’un triangle font 180°, pas 360°.
2. énoncé : Dans un triangle rectangle, un angle aigu mesure 35°. L’autre angle aigu mesure …
   - lu : Dans un triangle rectangle, un angle aigu mesure 35 degrés. L’autre angle aigu mesure (mot manquant)
   - choix : 35° · 55° · 145°
   - réponse : 55°
   - indice : L’angle droit mesure 90 degrés. Que reste-t-il pour les deux autres ?
   - explication : L’angle droit prend 90° : les deux angles aigus font 180 − 90 = 90° à eux deux, et 90 − 35 = 55°. 145°, c’est 180 − 35 : on a oublié l’angle droit. 35° : les deux angles aigus ne sont égaux que s’ils mesurent 45° chacun.
3. énoncé : Dans un triangle isocèle, l’angle au sommet principal mesure 40°. Chaque angle de la base mesure …
   - lu : Dans un triangle isocèle, l’angle au sommet principal mesure 40 degrés. Chaque angle de la base mesure (mot manquant)
   - choix : 40° · 70° · 140°
   - réponse : 70°
   - indice : Les deux angles de la base sont égaux. Retire 40 de 180, puis partage en deux.
   - explication : 180 − 40 = 140°, à partager entre deux angles égaux : 140 ÷ 2 = 70°. 140°, c’est oublier de partager en deux. 40° : dans un triangle isocèle, ce sont les deux angles de la base qui sont égaux, pas les trois.
4. énoncé : On peut construire un triangle avec des côtés de …
   - choix : 2 cm, 3 cm et 6 cm · 3 cm, 4 cm et 6 cm · 1 cm, 2 cm et 5 cm
   - réponse : 3 cm, 4 cm et 6 cm
   - indice : Pour chaque réponse, compare le plus grand côté à la somme des deux autres.
   - explication : 3 + 4 = 7, plus grand que 6 : le triangle existe. Avec 2 cm et 3 cm, 2 + 3 = 5 : trop court pour joindre les deux bouts d’un côté de 6 cm. Avec 1 cm et 2 cm, 1 + 2 = 3, plus petit que 5 : impossible aussi.
5. énoncé : On a AB = 3 cm, BC = 5 cm et AC = 8 cm. Les points A, B et C sont …
   - lu : On a A B égale 3 centimètres, B C égale 5 centimètres et A C égale 8 centimètres. Les points A, B et C sont (mot manquant)
   - choix : alignés, B entre A et C · alignés, A entre B et C · les sommets d’un triangle
   - réponse : alignés, B entre A et C
   - indice : Calcule A B plus B C, et compare avec A C.
   - explication : AB + BC = 3 + 5 = 8 = AC : passer par B est aussi court que d’aller tout droit de A à C. B est donc sur le segment qui va de A à C : les trois points sont alignés, sans vrai triangle. A n’est pas entre B et C : il faudrait que BC soit le plus long.
6. énoncé : "Deux droites parallèles sont coupées par une sécante.\nUn angle, entre les deux droites, mesure 65°."
   - question : Combien mesure l’angle alterne-interne à cet angle ?
   - lu : Deux droites parallèles sont coupées par une sécante. Un angle, entre les deux droites, mesure 65 degrés.
   - choix : 25° · 65° · 115°
   - réponse : 65°
   - indice : Les droites sont parallèles. Que dit le rappel des angles alternes-internes ?
   - explication : Les droites sont parallèles : deux angles alternes-internes sont égaux, l’autre angle mesure aussi 65°. 115°, c’est 180 − 65 : c’est l’angle voisin, pas l’alterne-interne. 25°, c’est 90 − 65 : il n’y a pas d’angle droit ici.
7. énoncé : "Deux droites sont coupées par une sécante.\nDeux angles correspondants mesurent chacun 72°."
   - question : Que peut-on dire des deux droites ?
   - lu : Deux droites sont coupées par une sécante. Deux angles correspondants mesurent chacun 72 degrés.
   - choix : elles sont parallèles · elles sont perpendiculaires · on ne peut rien dire
   - réponse : elles sont parallèles
   - indice : Relis la ligne « Réciproque » du rappel.
   - explication : Deux angles correspondants égaux : les droites sont parallèles, c’est la réciproque. On peut donc conclure. Perpendiculaires voudrait dire qu’elles se coupent en faisant un angle droit.
8. énoncé : "Deux droites sont coupées par une sécante.\nDeux angles alternes-internes mesurent 80° et 82°."
   - question : Les deux droites sont-elles parallèles ?
   - lu : Deux droites sont coupées par une sécante. Deux angles alternes-internes mesurent 80 degrés et 82 degrés.
   - choix : oui, les angles sont presque égaux · non, les angles ne sont pas égaux · oui, les deux angles sont aigus
   - réponse : non, les angles ne sont pas égaux
   - indice : Pour des droites parallèles, les angles alternes-internes sont-ils presque égaux, ou égaux ?
   - explication : Si les droites étaient parallèles, ces angles alternes-internes seraient égaux. 80° et 82° ne le sont pas : les droites ne sont pas parallèles, elles finissent par se couper. Presque égaux ne suffit pas ; être aigus non plus.

## Transformer · `transformations`

- description : Translation, symétries, rotation, homothétie : ce qui change et ce qui reste ; puis triangles égaux, triangles semblables et parallélogramme.
- compétences : c4.ma.d.transformations · c4.ma.d.triangles-parallelogramme
- consigne : Lis la phrase ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : maths-3e-geometry
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `maths-3e-geometry-transformations-1`

Pour tous les items :
- aide « L’effet d’une transformation » :
  - Translation : la figure glisse, sans tourner.
  - Symétrie axiale : la figure se retourne, comme dans un miroir.
  - Symétrie centrale : la figure fait un demi-tour autour d’un point.
  - Rotation : la figure tourne autour d’un point, d’un angle donné.
  - Ces quatre transformations gardent les longueurs, les angles et les aires.
  - Homothétie de rapport k positif : les longueurs sont multipliées par k, les angles ne changent pas.

1. énoncé : Une figure glisse, sans tourner et sans se retourner. C’est une …
   - lu : Une figure glisse, sans tourner et sans se retourner. C’est une (mot manquant)
   - choix : translation · rotation · symétrie axiale
   - réponse : translation
   - indice : Relis la première ligne du rappel.
   - explication : Glisser sans tourner, c’est une translation : chaque point bouge de la même façon, dans la même direction. Une rotation fait tourner la figure ; une symétrie axiale la retourne.
2. énoncé : Une figure se retourne, comme dans un miroir. C’est une …
   - lu : Une figure se retourne, comme dans un miroir. C’est une (mot manquant)
   - choix : symétrie axiale · symétrie centrale · translation
   - réponse : symétrie axiale
   - indice : Un miroir est une ligne droite, pas un point.
   - explication : Le miroir est une droite, l’axe : c’est une symétrie axiale. La symétrie centrale se fait autour d’un point : la figure fait un demi-tour, sans se retourner. La translation la fait glisser.
3. énoncé : Une symétrie centrale, c’est une rotation de …
   - lu : Une symétrie centrale, c’est une rotation de (mot manquant)
   - choix : 90° · 180° · 360°
   - réponse : 180°
   - indice : La symétrie centrale fait un demi-tour. Un tour complet mesure 360 degrés.
   - explication : La symétrie centrale fait un demi-tour autour du centre : 360 ÷ 2 = 180°. 90°, c’est un quart de tour. 360°, c’est un tour complet : la figure reviendrait à sa place.
4. énoncé : On fait tourner un triangle de 90° autour d’un point. Un angle de 50° du triangle devient un angle de …
   - lu : On fait tourner un triangle de 90 degrés autour d’un point. Un angle de 50 degrés du triangle devient un angle de (mot manquant)
   - choix : 50° · 90° · 140°
   - réponse : 50°
   - indice : Le triangle tourne. Est-ce que sa forme change ?
   - explication : Une rotation déplace la figure sans la déformer : l’angle mesure toujours 50°. 140°, c’est 50 + 90 : on a ajouté l’angle de la rotation, qui dit seulement de combien la figure tourne. 90° est l’angle de la rotation, pas celui du triangle.
5. énoncé : Un rectangle de 12 cm² a pour image, par une symétrie axiale, un rectangle de …
   - lu : Un rectangle de 12 centimètres carrés a pour image, par une symétrie axiale, un rectangle de (mot manquant)
   - choix : 6 cm² · 12 cm² · 24 cm²
   - réponse : 12 cm²
   - indice : Dans un miroir, une figure change-t-elle de taille ?
   - explication : Une symétrie axiale garde les longueurs : l’image a les mêmes côtés, donc la même aire, 12 cm². 24 cm², c’est la figure et son image ensemble. 6 cm², c’est la moitié : la symétrie ne coupe pas la figure, elle la retourne tout entière.
6. énoncé : Une homothétie de rapport 2 transforme un segment de 7 cm en un segment de …
   - lu : Une homothétie de rapport 2 transforme un segment de 7 centimètres en un segment de (mot manquant)
   - choix : 9 cm · 14 cm · 28 cm
   - réponse : 14 cm
   - indice : Une longueur est multipliée par le rapport.
   - explication : Les longueurs sont multipliées par 2 : 7 × 2 = 14 cm. 9 cm, c’est 7 + 2 : on multiplie, on n’ajoute pas. 28 cm, c’est multiplier par 2 × 2, ce qui vaut pour les aires.
   - figure : tableau segment (cm) · image (cm) / 1 · 2 / 7 · ?
7. énoncé : Une homothétie de rapport 0,5 transforme une figure en …
   - lu : Une homothétie de rapport 0,5 transforme une figure en (mot manquant)
   - choix : un agrandissement · une réduction · une figure de même taille
   - réponse : une réduction
   - indice : Que devient une longueur multipliée par 0,5 ?
   - explication : Multiplier par 0,5, c’est prendre la moitié : les longueurs diminuent, l’image est une réduction. Un rapport plus grand que 1 donnerait un agrandissement. La même taille, c’est un rapport de 1.
   - figure : tableau longueur (cm) · image (cm) / 1 · 0,5 / 4 · ?
8. énoncé : Parmi ces transformations, celle qui peut changer les longueurs, c’est …
   - lu : Parmi ces transformations, celle qui peut changer les longueurs, c’est (mot manquant)
   - choix : l’homothétie · la rotation · la symétrie centrale
   - réponse : l’homothétie
   - indice : Relis la cinquième ligne du rappel : quelles transformations gardent les longueurs ?
   - explication : L’homothétie multiplie les longueurs par son rapport : elle agrandit ou réduit. La rotation et la symétrie centrale déplacent la figure sans changer ses longueurs.

### Niveau 2 · `maths-3e-geometry-transformations-2`

Pour tous les items :
- aide « Triangles et parallélogramme » :
  - Triangles égaux : on peut les superposer. Mêmes côtés, mêmes angles.
  - Pour le savoir, il suffit de 3 côtés égaux, ou d’un angle égal entre 2 côtés égaux, ou d’un côté égal entre 2 angles égaux.
  - Triangles semblables : leurs angles sont égaux deux à deux.
  - Triangles semblables : leurs longueurs sont proportionnelles.
  - Parallélogramme : ses côtés opposés sont parallèles deux à deux.
  - Un quadrilatère dont les diagonales se coupent en leur milieu est un parallélogramme.

1. énoncé : Deux triangles ont des côtés de 3 cm, 4 cm et 6 cm, tous les deux. Ces triangles sont …
   - lu : Deux triangles ont des côtés de 3 centimètres, 4 centimètres et 6 centimètres, tous les deux. Ces triangles sont (mot manquant)
   - choix : égaux · semblables, mais pas égaux · peut-être différents
   - réponse : égaux
   - indice : Relis la deuxième ligne du rappel.
   - explication : Les trois côtés sont égaux deux à deux : cela suffit, les triangles sont égaux. On peut les superposer : leurs angles sont aussi les mêmes. Avec ces trois longueurs, on ne peut construire qu’un seul triangle. Ils sont aussi semblables, mais « pas égaux » est faux.
2. énoncé : "Deux triangles ont les mêmes angles :\n40°, 60° et 80°."
   - question : Ces deux triangles sont-ils forcément égaux ?
   - lu : Deux triangles ont les mêmes angles : 40 degrés, 60 degrés et 80 degrés.
   - choix : oui, ils ont les mêmes angles · oui, leurs angles font 180° · non, l’un peut être plus grand
   - réponse : non, l’un peut être plus grand
   - indice : Un agrandissement garde les angles. Garde-t-il les longueurs ?
   - explication : Les mêmes angles disent que les triangles sont semblables : même forme. Mais l’un peut être un agrandissement de l’autre, avec des côtés plus longs. Ils ne sont donc pas forcément égaux. Les angles d’un triangle font toujours 180° : cela ne prouve rien.
3. énoncé : Deux triangles sont semblables. Le petit a des côtés de 3 cm, 4 cm et 5 cm. Le plus petit côté du grand mesure 6 cm. Son plus grand côté mesure …
   - lu : Deux triangles sont semblables. Le petit a des côtés de 3 centimètres, 4 centimètres et 5 centimètres. Le plus petit côté du grand mesure 6 centimètres. Son plus grand côté mesure (mot manquant)
   - choix : 8 cm · 10 cm · 30 cm
   - réponse : 10 cm
   - indice : Par combien multiplie-t-on 3 pour obtenir 6 ? Fais pareil avec 5.
   - explication : Les longueurs sont proportionnelles : 3 × 2 = 6, donc le plus grand côté est 5 × 2 = 10 cm. 8 cm, c’est 5 + 3 : on a ajouté, comme de 3 à 6, au lieu de multiplier. 30 cm, c’est 5 × 6 : 6 est une longueur, pas le rapport.
   - figure : tableau petit triangle (cm) · grand triangle (cm) / 3 · 6 / 5 · ?
4. énoncé : Deux triangles ont un angle de 50°, entre deux côtés de 4 cm et 7 cm. Ces triangles sont …
   - lu : Deux triangles ont un angle de 50 degrés, entre deux côtés de 4 centimètres et 7 centimètres. Ces triangles sont (mot manquant)
   - choix : égaux · semblables, mais pas égaux · peut-être différents
   - réponse : égaux
   - indice : L’angle est entre les deux côtés. Relis la deuxième ligne du rappel.
   - explication : Un angle égal, placé entre deux côtés égaux : c’est un des cas d’égalité. Les triangles sont égaux, le troisième côté a forcément la même longueur. Ils sont aussi semblables, mais « pas égaux » est faux.
5. énoncé : "Triangle 1 : côtés de 2 cm, 3 cm et 4 cm\nTriangle 2 : côtés de 4 cm, 6 cm et 7 cm"
   - question : Ces deux triangles sont-ils semblables ?
   - lu : Triangle 1, côtés de 2 centimètres, 3 centimètres et 4 centimètres. Triangle 2, côtés de 4 centimètres, 6 centimètres et 7 centimètres.
   - choix : oui, chaque côté a grandi · oui, deux côtés ont doublé · non, le troisième côté n’a pas doublé
   - réponse : non, le troisième côté n’a pas doublé
   - indice : Pour des triangles semblables, chaque côté est multiplié par le même nombre.
   - explication : 2 × 2 = 4 et 3 × 2 = 6, mais 4 × 2 = 8, pas 7 : les longueurs ne sont pas proportionnelles, les triangles ne sont pas semblables. Grandir ne suffit pas, deux côtés sur trois non plus : il faut le même rapport pour les trois.
   - figure : tableau triangle 1 (cm) · triangle 2 (cm) / 2 · 4 / 3 · 6 / 4 · 7
6. énoncé : Un quadrilatère dont les côtés opposés sont parallèles deux à deux est …
   - lu : Un quadrilatère dont les côtés opposés sont parallèles deux à deux est (mot manquant)
   - choix : un parallélogramme · forcément un carré · forcément un rectangle
   - réponse : un parallélogramme
   - indice : Relis l’avant-dernière ligne du rappel.
   - explication : Des côtés opposés parallèles deux à deux : c’est la définition du parallélogramme. Le rectangle et le carré en sont des cas particuliers : le rectangle a en plus quatre angles droits ; le carré, quatre angles droits et quatre côtés égaux. Ce n’est donc pas forcément l’un d’eux.
7. énoncé : Les diagonales d’un quadrilatère se coupent en leur milieu. Ce quadrilatère est …
   - lu : Les diagonales d’un quadrilatère se coupent en leur milieu. Ce quadrilatère est (mot manquant)
   - choix : un parallélogramme · forcément un rectangle · forcément un losange
   - réponse : un parallélogramme
   - indice : Relis la dernière ligne du rappel.
   - explication : Des diagonales qui se coupent en leur milieu : c’est la propriété du parallélogramme. Pour un rectangle, il faudrait aussi des diagonales de même longueur. Pour un losange, des diagonales perpendiculaires.
8. énoncé : "ABCD est un parallélogramme.\nSes diagonales se coupent en O.\nAC = 10 cm."
   - question : Combien mesure le segment qui va de A à O ?
   - lu : A B C D est un parallélogramme. Ses diagonales se coupent en O. A C égale 10 centimètres.
   - choix : 5 cm · 10 cm · 20 cm
   - réponse : 5 cm
   - indice : O est-il au bout de la diagonale, ou en son milieu ?
   - explication : Les diagonales d’un parallélogramme se coupent en leur milieu : O est le milieu de la diagonale qui va de A à C : 10 ÷ 2 = 5 cm. 10 cm, c’est toute la diagonale. 20 cm, c’est le double.
   - figure : droite 0 · 10 / 0 · 10

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `maths-3e-geometry-1` | Le kiosque de Théo | 40 | Mon kiosque ! Merci, bâtisseur. Ses angles sont droits, ses colonnes proportionnelles. |
| `maths-3e-geometry-2` | Le toit du kiosque | 50 | Un toit et une porte ! La lanterne pend au sommet, à la verticale exacte. |
| `maths-3e-geometry-3` | La terrasse du kiosque | 60 | Une terrasse, une barrière, un escalier… Mon kiosque est complet : hypoténuse comprise. |

## Les demandes

### `maths-3e-geometry-request-1`

- habitant : Théo
- bloc : `maths-3e-functions`
- combien : 3
- petite construction : l’équerre
- demande : Il me faut {objet} pour mon équerre. Joue une mission du Phare des fonctions.
- prête : Tu as les {blocs} ! Livre-les à Théo.
- posée : Équerre posée chez Théo !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : la colonne de la cheminée (`maison()`) et un rang bas : une branche debout de 3 prismes, une branche couchée de 2 portes (`door`) au sol ; 5 cubes, 3 cases, 3 de haut (retouche du directeur artistique, 3 octobre 2026 : le marbre se perdait sur le sol de marbre).
