# Les grands projets

> Décidé par le mainteneur le 5 octobre 2026 (fiche [GD-10](../gameplay/propositions/GD-10.md), P1), piste A choisie le 8 octobre 2026 : dès la 5e, une grande construction devient un projet, posé pièce par pièce. Chaque pièce a deux recettes au choix ; les deux recettes d’une pièce n’ont aucune matière en commun, et la LV2 n’en fait jamais partie : une matière difficile ne bloque jamais. En 5e et en 4e, une recette prend des blocs de deux îles de deux matières, et sa question mêle ces deux matières ; en 3e (décision du mainteneur, 8 octobre 2026), elle prend des blocs de trois îles de trois matières, mais sa question n’en mêle que deux : le troisième bloc, de SVT ou de technologie, n’a pas de question. `npm run contenu` produit `src/game/world/projects.json` et les banques de questions (`src/game/exercises/data/assembly-<banque>.json`) depuis ce fichier : ne jamais les éditer. La forme des pièces (les étages du grand ouvrage) reste dans le code (`src/game/world/projects.ts`).

## Les pièces

> Une ligne par pièce, de bas en haut : on les pose dans cet ordre. Une recette : des blocs d’îles de l’archipel du projet, `bloc × nombre`, séparés par « · » ; deux en 5e et en 4e, trois en 3e (les deux îles de la question d’abord, puis celle qui n’en a pas). Ses questions : une banque de « Les questions » ci-dessous (`project-…`), ou celles d’un bloc assemblé de [assemblage.md](assemblage.md) (`compound-5e`, `compound-4e`, `compound-3e`), avec le même tirage pour l’élève. Le nom de la pièce, avec son article, dans chaque univers.

| projet | pièce | recette 1 | questions 1 | recette 2 | questions 2 | Blocland | Archipéo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `landmark-5e-1` | `base` | maths-5e-signed-numbers × 6 · french-5e-homophones × 4 | `compound-5e` | english-5e-grammar × 6 · geography-5e-resources × 4 | `project-5e-travellers` | le socle | le socle |
| `landmark-5e-1` | `tower` | maths-5e-proportionality × 6 · english-5e-vocabulary × 4 | `project-5e-counter` | french-5e-conjugation × 6 · history-5e-middle-ages × 4 | `project-5e-chronicle` | la tour | la tour |
| `landmark-5e-1` | `gallery` | maths-5e-signed-numbers × 6 · french-5e-homophones × 4 | `compound-5e` | english-5e-grammar × 6 · geography-5e-resources × 4 | `project-5e-travellers` | la galerie | la corniche |
| `landmark-5e-1` | `lantern` | maths-5e-proportionality × 6 · english-5e-vocabulary × 4 | `project-5e-counter` | french-5e-conjugation × 6 · history-5e-middle-ages × 4 | `project-5e-chronicle` | la lanterne | la terrasse |
| `landmark-5e-1` | `roof` | maths-5e-signed-numbers × 6 · french-5e-homophones × 4 | `compound-5e` | english-5e-grammar × 6 · geography-5e-resources × 4 | `project-5e-travellers` | le toit | le feu |
| `landmark-4e-3` | `quay` | maths-4e-powers × 6 · geography-4e-globalization × 4 | `project-4e-docks` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | le quai | le quai |
| `landmark-4e-3` | `legs` | maths-4e-powers × 6 · english-4e-grammar × 4 | `compound-4e` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | les jambes | les piliers |
| `landmark-4e-3` | `beam` | maths-4e-powers × 6 · geography-4e-globalization × 4 | `project-4e-docks` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | la flèche | la flèche |
| `landmark-4e-3` | `cab` | maths-4e-powers × 6 · english-4e-grammar × 4 | `compound-4e` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | la cabine | la cabine |
| `landmark-4e-4` | `foot` | maths-4e-powers × 6 · english-4e-grammar × 4 | `compound-4e` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | le pied | le socle |
| `landmark-4e-4` | `lattice` | maths-4e-powers × 6 · geography-4e-globalization × 4 | `project-4e-docks` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | le treillis | le treillis |
| `landmark-4e-4` | `shaft` | maths-4e-powers × 6 · english-4e-grammar × 4 | `compound-4e` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | le fût | le mât |
| `landmark-4e-4` | `head` | maths-4e-powers × 6 · geography-4e-globalization × 4 | `project-4e-docks` | french-4e-vocabulary × 6 · physics-chemistry-4e-signals-circuits × 4 | `project-4e-telegraph` | la tête | la tête |
| `landmark-3e-3` | `pad` | maths-3e-statistics × 4 · french-3e-close-reading × 4 · life-earth-sciences-3e-human-body × 2 | `compound-3e` | history-3e-twentieth-century × 4 · physics-chemistry-3e-motion-energy × 4 · technology-3e-digital × 2 | `project-3e-space` | le pas de tir | le pas de tir |
| `landmark-3e-3` | `stage1` | maths-3e-functions × 4 · geography-3e-france × 4 · technology-3e-digital × 2 | `project-3e-water` | english-3e-comprehension × 4 · physics-chemistry-3e-motion-energy × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-rocket` | le premier étage | le premier étage |
| `landmark-3e-3` | `stage2` | maths-3e-geometry × 4 · french-3e-close-reading × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-solids` | history-3e-twentieth-century × 4 · physics-chemistry-3e-motion-energy × 4 · technology-3e-digital × 2 | `project-3e-space` | le second étage | le second étage |
| `landmark-3e-3` | `nose` | maths-3e-statistics × 4 · french-3e-close-reading × 4 · technology-3e-digital × 2 | `compound-3e` | english-3e-comprehension × 4 · physics-chemistry-3e-motion-energy × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-rocket` | la coiffe | la coiffe |
| `landmark-3e-4` | `foot` | maths-3e-functions × 4 · geography-3e-france × 4 · technology-3e-digital × 2 | `project-3e-water` | english-3e-comprehension × 4 · physics-chemistry-3e-motion-energy × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-rocket` | le pied | le pied |
| `landmark-3e-4` | `shaft` | maths-3e-statistics × 4 · french-3e-close-reading × 4 · life-earth-sciences-3e-human-body × 2 | `compound-3e` | history-3e-twentieth-century × 4 · physics-chemistry-3e-motion-energy × 4 · technology-3e-digital × 2 | `project-3e-space` | le fût | le fût |
| `landmark-3e-4` | `tank` | maths-3e-functions × 4 · geography-3e-france × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-water` | english-3e-comprehension × 4 · physics-chemistry-3e-motion-energy × 4 · technology-3e-digital × 2 | `project-3e-rocket` | la cuve | la cuve |
| `landmark-3e-4` | `crown` | maths-3e-functions × 4 · geography-3e-france × 4 · technology-3e-digital × 2 | `project-3e-water` | english-3e-comprehension × 4 · physics-chemistry-3e-motion-energy × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-rocket` | la couronne | la couronne |
| `landmark-3e-5` | `cube` | maths-3e-geometry × 4 · french-3e-close-reading × 4 · technology-3e-digital × 2 | `project-3e-solids` | history-3e-twentieth-century × 4 · physics-chemistry-3e-motion-energy × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-space` | le cube | le cube |
| `landmark-3e-5` | `cylinder` | maths-3e-geometry × 4 · french-3e-close-reading × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-solids` | english-3e-comprehension × 4 · physics-chemistry-3e-motion-energy × 4 · technology-3e-digital × 2 | `project-3e-rocket` | le cylindre | le cylindre |
| `landmark-3e-5` | `pyramid` | maths-3e-geometry × 4 · french-3e-close-reading × 4 · technology-3e-digital × 2 | `project-3e-solids` | history-3e-twentieth-century × 4 · physics-chemistry-3e-motion-energy × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-space` | la pyramide | la pyramide |
| `landmark-3e-5` | `sphere` | maths-3e-geometry × 4 · french-3e-close-reading × 4 · life-earth-sciences-3e-human-body × 2 | `project-3e-solids` | english-3e-comprehension × 4 · physics-chemistry-3e-motion-energy × 4 · technology-3e-digital × 2 | `project-3e-rocket` | la sphère | la sphère |

## Les questions

> Une banque par paire d’îles, écrite comme les questions des blocs assemblés ([assemblage.md](assemblage.md), « Les questions ») : une seule question qui mêle les deux matières, trois choix (la réponse, un piège de chaque matière), une aide de deux lignes (une par notion), un indice en deux temps. Douze questions par banque (au moins 8). Compétences du cycle 4, de la classe du projet ou d’une classe d’avant, déjà travaillées par une île. En 3e, une seule étape de calcul ; Pythagore en triplets 3-4-5 et 6-8-10 seulement. Une figure (`figure`) aux questions de maths quand elle aide sans donner la réponse.

### Au comptoir · `project-5e-counter`

- compétences : c4.ma.5e.proportionnalite.proportionnalite · c4.ma.5e.proportionnalite.pourcentages · c4.en.5e.interagir.echanges · c4.en.5e.langue.lexique · c4.en.5e.comprendre.informations-pratiques
- langue : en
- consigne : Lis l’énoncé en anglais, calcule, puis choisis la phrase juste et bien écrite. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "2 bottles of water: £2.\nAmy buys 6 bottles."
   - question : Quelle phrase est juste ?
   - lu : Two bottles of water, two pounds. Amy buys six bottles.
   - choix : Amy pays 6 pounds. · Amy pays 6 pound. · Amy pays 12 pounds.
   - réponse : Amy pays 6 pounds.
   - indice : D’abord : combien coûte une bouteille ? Puis : une livre, ou plusieurs ?
   - explication : 2 bouteilles pour 2 livres : 1 bouteille coûte 1 livre, et 6 bouteilles coûtent 6 livres. Plus d’une livre : pounds, avec un s. 12, c’est 6 × 2 : 2 livres, c’est le prix de deux bouteilles, pas d’une.
   - aide « Le prix d’un, et pounds » :
     - 3 stylos pour 3 € : 1 stylo coûte 1 €, et 5 stylos coûtent 5 €.
     - one pound = une livre ; two pounds = deux livres
2. énoncé : "Sandwiches: 3 for £6.\nLéo wants one sandwich."
   - question : Quelle phrase est juste ?
   - lu : Sandwiches, three for six pounds. Léo wants one sandwich.
   - choix : How much is one? It’s £2. · How many is one? It’s £2. · How much is one? It’s £3.
   - réponse : How much is one? It’s £2.
   - indice : D’abord : partage 6 livres en 3. Puis : on demande un prix, ou on compte des choses ?
   - explication : 3 sandwichs pour 6 livres : 6 ÷ 3 = 2 livres pour un. Pour un prix, on demande how much ; how many sert à compter des choses. 3, c’est 6 − 3 : on partage le prix, on n’enlève pas.
   - aide « Partager, et how much » :
     - 4 gâteaux pour 8 € : on partage, 8 ÷ 4, donc 2 € pour un gâteau.
     - how much = combien (un prix) ; how many = combien de (on compte)
3. énoncé : "Milk: 2 cartons for £3.\nDad buys 4 cartons."
   - question : Quelle phrase est juste ?
   - lu : Milk, two cartons for three pounds. Dad buys four cartons.
   - choix : Dad gets 4 cartons of milk for £6. · Dad gets 4 pieces of milk for £6. · Dad gets 4 cartons of milk for £5.
   - réponse : Dad gets 4 cartons of milk for £6.
   - indice : D’abord : 4 briques, c’est combien de fois 2 briques ? Puis : le lait se vend dans quoi ?
   - explication : 4 briques, c’est 2 fois 2 briques : 2 fois 3 livres, 6 livres. Le lait se vend en brique : a carton of milk. a piece of, c’est un morceau (a piece of cake). 5, c’est 3 + 2 : on a ajouté au lieu de multiplier.
   - aide « Deux fois plus, et a carton of » :
     - 2 pains pour 1 € : 4 pains, deux fois plus, coûtent 2 €.
     - a carton of = une brique de ; a piece of = un morceau de
4. énoncé : "Apples: 3 for £1.\nYou want 9 apples."
   - question : Quelle phrase est juste ?
   - lu : Apples, three for one pound. You want nine apples.
   - choix : I’d like 9 apples for £3, please. · I like 9 apples for £3, please. · I’d like 9 apples for £7, please.
   - réponse : I’d like 9 apples for £3, please.
   - indice : D’abord : 9 pommes, c’est combien de fois 3 pommes ? Puis : comment demander poliment ?
   - explication : 9 pommes, c’est 3 fois 3 pommes : 3 fois 1 livre, 3 livres. Pour demander poliment, on dit I’d like, je voudrais ; I like veut dire j’aime. 7, c’est 1 + 6 : on a ajouté au lieu de multiplier.
   - aide « Trois fois plus, et I’d like » :
     - 2 crayons pour 1 € : 6 crayons, trois fois plus, coûtent 3 €.
     - I’d like = je voudrais ; I like = j’aime
5. énoncé : "The bill: £20.\nThe tip: 10% of the bill."
   - question : Quelle phrase est juste ?
   - lu : The bill, twenty pounds. The tip, ten per cent of the bill.
   - choix : The bill is £20, so the tip is £2. · The menu is £20, so the tip is £2. · The bill is £20, so the tip is £10.
   - réponse : The bill is £20, so the tip is £2.
   - indice : D’abord : 10 %, c’est partager en 10. Puis : la carte, ou l’addition ?
   - explication : 10 % de 20, c’est 20 ÷ 10 = 2 livres. Ce qu’on paie, c’est the bill, l’addition ; the menu, c’est la carte des plats. 10, c’est prendre le pourcentage pour le prix : 10 %, ce n’est pas 10 livres.
   - aide « 10 %, et the bill » :
     - 10 %, c’est un dixième : 10 % de 50, c’est 50 ÷ 10, donc 5.
     - the bill = l’addition ; the menu = la carte ; the tip = le pourboire
6. énoncé : "A bag of 8 sweets.\n25% are red."
   - question : Quelle phrase est juste ?
   - lu : A bag of eight sweets. Twenty-five per cent are red.
   - choix : Not many: only 2 are red. · Not much: only 2 are red. · Not many: only 4 are red.
   - réponse : Not many: only 2 are red.
   - indice : D’abord : 25 %, c’est un quart. Puis : des bonbons, ça se compte ?
   - explication : 25 %, c’est un quart : 8 ÷ 4 = 2 bonbons rouges. Les bonbons se comptent : not many, pas beaucoup ; much va avec ce qui ne se compte pas (much water). 4, c’est la moitié : 25 %, c’est un quart, pas la moitié.
   - aide « 25 %, et many » :
     - 25 %, c’est un quart : 25 % de 12, c’est 12 ÷ 4, donc 3.
     - many = beaucoup de (on compte : many apples) ; much = beaucoup de (on ne compte pas : much water)
7. énoncé : "1 glass of orange juice: £2.\nYou buy juice for 4 friends."
   - question : Quelle phrase est juste ?
   - lu : One glass of orange juice, two pounds. You buy juice for four friends.
   - choix : Four glasses of orange juice: £8. · Four glass of orange juice: £8. · Four glasses of orange juice: £6.
   - réponse : Four glasses of orange juice: £8.
   - indice : D’abord : 4 verres à 2 livres. Puis : un verre, ou plusieurs ?
   - explication : 4 verres à 2 livres : 4 × 2 = 8 livres. Plusieurs verres : glasses, avec -es. 6, c’est 4 + 2 : on a ajouté au lieu de multiplier.
   - aide « Le prix de plusieurs, et glasses » :
     - 1 crêpe coûte 3 € : 5 crêpes coûtent 5 fois 3 €, 15 €.
     - one glass = un verre ; two glasses = deux verres
8. énoncé : "Pens: 5 for £2.\nNina needs 10 pens."
   - question : Quelle phrase est juste ?
   - lu : Pens, five for two pounds. Nina needs ten pens.
   - choix : How much is it? It’s £4. · How many is it? It’s £4. · How much is it? It’s £7.
   - réponse : How much is it? It’s £4.
   - indice : D’abord : 10 stylos, c’est combien de fois 5 stylos ? Puis : on demande un prix, ou on compte des choses ?
   - explication : 10 stylos, c’est 2 fois 5 stylos : 2 fois 2 livres, 4 livres. Pour un prix, on demande how much. 7, c’est 2 + 5 : on a ajouté au lieu de multiplier.
   - aide « Deux fois plus, et how much » :
     - 3 cahiers pour 4 € : 6 cahiers, deux fois plus, coûtent 8 €.
     - how much = combien (un prix) ; how many = combien de (on compte)
9. énoncé : "10 stickers: £2.\nTom buys 5 stickers."
   - question : Quelle phrase est juste ?
   - lu : Ten stickers, two pounds. Tom buys five stickers.
   - choix : Tom pays 1 pound. · Tom pays 1 pounds. · Tom pays 4 pounds.
   - réponse : Tom pays 1 pound.
   - indice : D’abord : 5 autocollants, c’est la moitié de 10. Puis : une livre, ou plusieurs ?
   - explication : 5, c’est la moitié de 10 : on paie la moitié de 2 livres, 1 livre. Une seule livre : pound, sans s. 4, c’est 2 × 2 : on a doublé au lieu de prendre la moitié.
   - aide « Deux fois moins, et pound » :
     - 8 billes pour 4 € : 4 billes, deux fois moins, coûtent 2 €.
     - one pound = une livre ; two pounds = deux livres
10. énoncé : "Bananas: 6 for £12.\nYou want 2 bananas."
    - question : Quelle phrase est juste ?
    - lu : Bananas, six for twelve pounds. You want two bananas.
    - choix : I’d like 2 bananas for £4, please. · I like 2 bananas for £4, please. · I’d like 2 bananas for £10, please.
    - réponse : I’d like 2 bananas for £4, please.
    - indice : D’abord : 2 bananes, c’est trois fois moins que 6. Puis : comment demander poliment ?
    - explication : 2 bananes, c’est trois fois moins que 6 bananes : 12 livres partagées en 3, 4 livres. Pour demander poliment, on dit I’d like, je voudrais ; I like veut dire j’aime. 10, c’est 12 − 2 : on a enlevé au lieu de partager.
    - aide « Trois fois moins, et I’d like » :
      - 9 œufs pour 6 € : 3 œufs, trois fois moins, coûtent 2 €.
      - I’d like = je voudrais ; I like = j’aime
11. énoncé : "2 child tickets: £6.\nWe are 4 children."
    - question : Quelle phrase est juste ?
    - lu : Two child tickets, six pounds. We are four children.
    - choix : Here you are: 4 tickets for £12. · Here are you: 4 tickets for £12. · Here you are: 4 tickets for £8.
    - réponse : Here you are: 4 tickets for £12.
    - indice : D’abord : 4 enfants, c’est combien de fois 2 enfants ? Puis : que dit-on en tendant quelque chose ?
    - explication : 4 billets, c’est 2 fois 2 billets : 2 fois 6 livres, 12 livres. En tendant quelque chose, on dit Here you are, voilà, dans cet ordre. 8, c’est 6 + 2 : on a ajouté au lieu de multiplier.
    - aide « Deux fois plus, et here you are » :
      - 2 places pour 5 € : 4 places, deux fois plus, coûtent 10 €.
      - here you are = voilà (en tendant quelque chose)
12. énoncé : "The shop has 16 cartons of juice.\n50% are apple juice."
    - question : Quelle phrase est juste ?
    - lu : The shop has sixteen cartons of juice. Fifty per cent are apple juice.
    - choix : There are 8 cartons of apple juice. · There are 8 pieces of apple juice. · There are 4 cartons of apple juice.
    - réponse : There are 8 cartons of apple juice.
    - indice : D’abord : 50 %, c’est la moitié. Puis : le jus se vend dans quoi ?
    - explication : 50 %, c’est la moitié : 16 ÷ 2 = 8 briques. Le jus se vend en brique : a carton of juice ; a piece of, c’est un morceau. 4, c’est un quart : 50 %, c’est la moitié, pas le quart.
    - aide « 50 %, et a carton of » :
      - 50 %, c’est la moitié : 50 % de 10, c’est 10 ÷ 2, donc 5.
      - a carton of = une brique de ; a piece of = un morceau de

### La chronique · `project-5e-chronicle`

- compétences : c4.fr.5e.grammaire.temps-modes · c4.fr.5e.grammaire.formes-verbales · c3.fr.langue.temps-a-memoriser · c4.hg.histoire.occident-feodal · c4.hg.demarches.document · c4.hg.demarches.lexique · c4.hg.temps.ordonner · c4.hg.temps.reperes
- consigne : Lis le document, puis choisis la phrase juste et bien écrite. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "Chronique de l’an 1100\nLe seigneur fait bâtir un château fort."
   - question : Quelle phrase est juste ?
   - lu : Chronique de l’an mille cent. Le seigneur fait bâtir un château fort.
   - choix : Le seigneur fit bâtir un château fort. · Le seigneur faisa bâtir un château fort. · Le roi fit bâtir un château fort.
   - réponse : Le seigneur fit bâtir un château fort.
   - indice : D’abord : qui fait bâtir, dans le document ? Puis : faire n’est pas un verbe en -er.
   - explication : Le document dit que c’est le seigneur : il bâtit un château fort pour protéger ses terres. Faire n’est pas un verbe en -er : au passé simple, il fit, comme il dit. Le roi n’est pas dans le document.
   - aide « Qui agit, et le passé simple » :
     - Dans le document, cherche qui fait l’action : c’est le sujet du verbe.
     - Verbes en -er : il chanta. Les autres, souvent -it : il dit, il prit.
2. énoncé : "La corvée\nDes jours de travail gratuit pour le seigneur."
   - question : Quelle phrase est juste ?
   - lu : La corvée : des jours de travail gratuit pour le seigneur.
   - choix : Les paysans travaillèrent gratuitement pour le seigneur. · Les paysans travaillirent gratuitement pour le seigneur. · Les paysans travaillèrent pour le seigneur contre de l’argent.
   - réponse : Les paysans travaillèrent gratuitement pour le seigneur.
   - indice : D’abord : la corvée est-elle payée, dans le document ? Puis : travailler est un verbe en -er.
   - explication : Le document dit « gratuit » : la corvée n’est pas payée. Contre de l’argent, c’est le contraire. Travailler est un verbe en -er : ils travaillèrent. -irent va avec les autres verbes (ils finirent).
   - aide « Un mot du Moyen Âge, et -èrent » :
     - Un mot nouveau ? Le document l’explique juste en dessous, comme un dictionnaire.
     - Verbes en -er, avec ils : -èrent (ils marchèrent). Les autres : -irent (ils finirent).
3. énoncé : "La dîme\nUne part des récoltes, donnée à l’Église."
   - question : Quelle phrase est juste ?
   - lu : La dîme : une part des récoltes, donnée à l’Église.
   - choix : Les paysans donnèrent la dîme à l’Église. · Les paysans donnirent la dîme à l’Église. · Les paysans donnèrent la dîme au seigneur.
   - réponse : Les paysans donnèrent la dîme à l’Église.
   - indice : D’abord : à qui va la dîme, dans le document ? Puis : donner est un verbe en -er.
   - explication : Le document dit que la dîme est donnée à l’Église ; au seigneur, les paysans doivent la corvée. Donner est un verbe en -er : ils donnèrent. -irent va avec les autres verbes (ils finirent).
   - aide « À qui ? et -èrent » :
     - Pour savoir à qui va une chose, cherche le nom après « à » dans le document.
     - Verbes en -er, avec ils : -èrent (ils chantèrent). Les autres : -irent (ils finirent).
4. énoncé : "1163\nOn commence à bâtir Notre-Dame de Paris."
   - question : Quelle phrase est juste ?
   - lu : En mille cent soixante-trois, on commence à bâtir Notre-Dame de Paris.
   - choix : Le chantier commença au douzième siècle. · Le chantier commenca au douzième siècle. · Le chantier commença au onzième siècle.
   - réponse : Le chantier commença au douzième siècle.
   - indice : D’abord : range l’année avec le rappel. Puis : devant a, le c garde-t-il le son « s » ?
   - explication : 1163 est entre 1101 et 1200 : c’est le XIIe siècle, le douzième. Le XIe siècle, le onzième, va de 1001 à 1100 : le siècle ne se lit pas dans les deux premiers chiffres. Devant a, le c prend une cédille pour garder le son « s » : il commença.
   - aide « Le siècle, et la cédille » :
     - XIe siècle (le onzième) : de l’an 1001 à l’an 1100. XIIe siècle (le douzième) : de l’an 1101 à l’an 1200.
     - Devant a, o, u, le c prend une cédille pour faire « s » : il lança, nous plaçons.
5. énoncé : "D’abord : les habitants bâtissent un grand mur autour de la ville.\nEnsuite : ils construisent un marché couvert."
   - question : Quelle phrase est juste ?
   - lu : D’abord, les habitants bâtissent un grand mur autour de la ville. Ensuite, ils construisent un marché couvert.
   - choix : Après le mur, les habitants construisirent un marché. · Après le mur, les habitants construisèrent un marché. · Avant le mur, les habitants construisirent un marché.
   - réponse : Après le mur, les habitants construisirent un marché.
   - indice : D’abord : quel fait vient en premier ? Puis : construire n’est pas un verbe en -er.
   - explication : Le document dit « d’abord » le mur, « ensuite » le marché : le marché vient après. Construire n’est pas un verbe en -er : ils construisirent, comme ils écrivirent. -èrent va avec les verbes en -er.
   - aide « Avant, après, et -irent » :
     - D’abord, ensuite, enfin : ces mots donnent l’ordre des faits.
     - Construire, écrire, conduire, avec ils : -irent (ils écrivirent).
6. énoncé : "Le dimanche, au village\nOn ne travaille pas : on va à la messe."
   - question : Quelle phrase est juste ?
   - lu : Le dimanche, au village : on ne travaille pas, on va à la messe.
   - choix : Le dimanche, les paysans ne travaillaient pas. · Le dimanche, les paysans ne travaillait pas. · Le dimanche, les paysans travaillaient aux champs.
   - réponse : Le dimanche, les paysans ne travaillaient pas.
   - indice : D’abord : que fait-on le dimanche, dans le document ? Puis : qui est le sujet du verbe ?
   - explication : Le document dit qu’on ne travaille pas le dimanche : on va à la messe. C’est une habitude, à l’imparfait ; le sujet, les paysans, est au pluriel : ils travaillaient, avec -aient.
   - aide « Le même moment, et -aient » :
     - Relis la phrase du document qui parle du même moment : le dimanche.
     - Imparfait : il -ait (il jouait) ; ils -aient (ils jouaient).
7. énoncé : "Le serf\nUn paysan qui ne peut pas quitter la terre de son seigneur."
   - question : Quelle phrase est juste ?
   - lu : Le serf : un paysan qui ne peut pas quitter la terre de son seigneur.
   - choix : Le serf resta toute sa vie sur cette terre. · Le serf restai toute sa vie sur cette terre. · Le serf quitta cette terre pour la ville.
   - réponse : Le serf resta toute sa vie sur cette terre.
   - indice : D’abord : le serf peut-il partir, dans le document ? Puis : avec il, quelle terminaison ?
   - explication : Le document dit que le serf ne peut pas quitter la terre de son seigneur : il y reste. Verbes en -er au passé simple, avec il : -a, il resta. -ai va avec je (je restai).
   - aide « Ne… pas, et -a » :
     - Une phrase avec « ne… pas » dit ce qu’on ne peut pas faire : lis-la jusqu’au bout.
     - Verbes en -er au passé simple : je chantai, il chanta.
8. énoncé : "Le vassal\nIl reçoit un fief, une terre, de son seigneur."
   - question : Quelle phrase est juste ?
   - lu : Le vassal : il reçoit un fief, une terre, de son seigneur.
   - choix : Le vassal reçut un fief de son seigneur. · Le vassal recevit un fief de son seigneur. · Le seigneur reçut un fief de son vassal.
   - réponse : Le vassal reçut un fief de son seigneur.
   - indice : D’abord : qui reçoit le fief, dans le document ? Puis : recevoir fait son passé simple en -ut.
   - explication : Le document dit que le vassal reçoit le fief, une terre, et que le seigneur le donne. Recevoir fait son passé simple en -ut : il reçut, comme il voulut. recevit n’existe pas.
   - aide « Qui reçoit ? et -ut » :
     - Qui donne, qui reçoit : cherche le sujet du verbe recevoir.
     - Recevoir, vouloir, courir au passé simple, avec il : -ut (il voulut, il courut).
9. énoncé : "987\nHugues Capet devient roi des Francs."
   - question : Quelle phrase est juste ?
   - lu : En neuf cent quatre-vingt-sept, Hugues Capet devient roi des Francs.
   - choix : Hugues Capet devint roi au dixième siècle. · Hugues Capet devenit roi au dixième siècle. · Hugues Capet devint roi au neuvième siècle.
   - réponse : Hugues Capet devint roi au dixième siècle.
   - indice : D’abord : range l’année avec le rappel. Puis : devenir se conjugue comme venir.
   - explication : 987 est entre 901 et 1000 : c’est le Xe siècle, le dixième. Le IXe siècle, le neuvième, va de 801 à 900. Devenir se conjugue comme venir : il vint, il devint.
   - aide « Le siècle, et venir » :
     - IXe siècle (le neuvième) : de l’an 801 à l’an 900. Xe siècle (le dixième) : de l’an 901 à l’an 1000.
     - Venir et ses frères au passé simple : il vint, il revint, il se souvint.
10. énoncé : "Église romane : murs épais, petites fenêtres.\nCathédrale gothique : grands vitraux."
    - question : Quelle phrase est juste ?
    - lu : Église romane : murs épais, petites fenêtres. Cathédrale gothique : grands vitraux.
    - choix : La cathédrale gothique avait de grands vitraux. · La cathédrale gothique avaient de grands vitraux. · L’église romane avait de grands vitraux.
    - réponse : La cathédrale gothique avait de grands vitraux.
    - indice : D’abord : quel bâtiment a les grands vitraux ? Puis : qui est le sujet du verbe ?
    - explication : Le document le dit : les grands vitraux sont à la cathédrale gothique ; l’église romane a de petites fenêtres. Le sujet, la cathédrale, est au singulier : elle avait. Vitraux n’est pas le sujet.
    - aide « Deux lignes, et -ait » :
      - Chaque ligne parle d’un bâtiment : lis le nom au début de la ligne.
      - Le verbe s’accorde avec son sujet : elle avait, elles avaient.
11. énoncé : "D’abord : au printemps, le paysan sème le blé.\nEnsuite : en été, il fait la récolte."
    - question : Quelle phrase est juste ?
    - lu : D’abord, au printemps, le paysan sème le blé. Ensuite, en été, il fait la récolte.
    - choix : En été, il récolta le blé qu’il avait semé. · En été, il récolta le blé qu’il avais semé. · Au printemps, il récolta le blé qu’il avait semé.
    - réponse : En été, il récolta le blé qu’il avait semé.
    - indice : D’abord : en quelle saison fait-on la récolte ? Puis : avec il, quelle lettre à la fin de avait ?
    - explication : Le document dit : on sème au printemps, puis on récolte en été. Le plus-que-parfait dit ce qui s’est passé avant : il avait semé. Avec il, avoir à l’imparfait finit par t : il avait ; avais va avec je ou tu.
    - aide « D’abord, ensuite, et avait » :
      - Ensuite dit ce qui vient après : lis les deux lignes dans l’ordre.
      - Avoir à l’imparfait : j’avais, tu avais, il avait.
12. énoncé : "1214, à Bouvines\nLe roi Philippe Auguste bat ses ennemis."
    - question : Quelle phrase est juste ?
    - lu : En mille deux cent quatorze, à Bouvines : le roi Philippe Auguste bat ses ennemis.
    - choix : Philippe Auguste battit ses ennemis à Bouvines. · Philippe Auguste batta ses ennemis à Bouvines. · Ses ennemis battirent Philippe Auguste à Bouvines.
    - réponse : Philippe Auguste battit ses ennemis à Bouvines.
    - indice : D’abord : qui gagne, dans le document ? Puis : battre n’est pas un verbe en -er.
    - explication : Le document dit que le roi bat ses ennemis : il gagne la bataille, et son pouvoir grandit. Battre n’est pas un verbe en -er : il battit, comme il prit. -a va avec les verbes en -er.
    - aide « Qui gagne ? et -it » :
      - Le sujet du verbe fait l’action : celui qui bat, c’est celui qui gagne.
      - Verbes en -re au passé simple : il prit, il dit, il vendit.

### Le récit des voyageurs · `project-5e-travellers`

- compétences : c4.en.5e.langue.verbe · c4.en.5e.langue.groupe-nominal · c4.en.5e.comprendre.oral-ecrit · c4.hg.geographie.ressources · c4.hg.geographie.demographie-developpement · c4.hg.demarches.document · c4.hg.demarches.lexique
- langue : en
- consigne : Lis l’énoncé en anglais, puis choisis la phrase juste et bien écrite. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "Day 1, in the North Sea\nWe visited a wind farm."
   - question : Quelle phrase est juste ?
   - lu : Day one, in the North Sea. We visited a wind farm.
   - choix : Yesterday, the turbines used the wind, a renewable energy. · Yesterday, the turbines use the wind, a renewable energy. · Yesterday, the turbines used the wind, a fossil fuel.
   - réponse : Yesterday, the turbines used the wind, a renewable energy.
   - indice : D’abord : le vent s’épuise-t-il ? Puis : yesterday, c’est le passé.
   - explication : Le vent revient sans cesse : c’est une énergie renouvelable. Les énergies fossiles, ce sont le charbon, le pétrole et le gaz. Yesterday dit le passé : use + d, used.
   - aide « Le prétérit, et l’énergie » :
     - Passé terminé (yesterday, last week) : verbe + ed (play → played, like → liked).
     - wind = le vent, renouvelable ; coal = le charbon, fossile
2. énoncé : "Day 2, in Egypt: desert everywhere.\nGreen fields only along the Nile."
   - question : Quelle phrase est juste ?
   - lu : Day two, in Egypt: desert everywhere. Green fields only along the Nile.
   - choix : The fields along the Nile were green. · The fields along the Nile was green. · The fields in the desert were green.
   - réponse : The fields along the Nile were green.
   - indice : D’abord : où sont les champs verts ? Puis : fields, un ou plusieurs ?
   - explication : Le document le dit : les champs verts sont seulement le long du Nil, qui leur apporte l’eau ; dans le désert, rien ne pousse. fields est au pluriel : were ; was va avec un seul (the field was).
   - aide « Was, were, et l’eau du fleuve » :
     - be au prétérit : I, he, she, it was ; we, you, they were.
     - field = un champ ; along = le long de (là où arrive l’eau du fleuve)
3. énoncé : "Day 3, a village in Mali\nNo tap water: people get water from a well."
   - question : Quelle phrase est juste ?
   - lu : Day three, a village in Mali. No tap water: people get water from a well.
   - choix : The village didn’t have tap water. · The village didn’t had tap water. · The village didn’t have a well.
   - réponse : The village didn’t have tap water.
   - indice : D’abord : d’où vient l’eau du village ? Puis : après didn’t, le verbe change-t-il ?
   - explication : Le document dit qu’il n’y a pas d’eau au robinet : on prend l’eau au puits. Après didn’t, le verbe reste à la base : didn’t have.
   - aide « Didn’t, et l’eau » :
     - Négation au passé : didn’t + verbe sans -ed (I didn’t play).
     - tap water = l’eau du robinet ; a well = un puits
4. énoncé : "Day 4, on the beach\nSea water is salty."
   - question : Quelle phrase est juste ?
   - lu : Day four, on the beach. Sea water is salty.
   - choix : We tried the sea water: too salty to drink. · We tryed the sea water: too salty to drink. · We tried the sea water: good to drink.
   - réponse : We tried the sea water: too salty to drink.
   - indice : D’abord : peut-on boire une eau salée ? Puis : try finit par y après une consonne.
   - explication : L’eau de mer est salée : on ne peut pas la boire, elle n’est pas potable. try finit par y après une consonne : y devient ied, tried.
   - aide « -ied, et l’eau potable » :
     - y après une consonne → ied (study → studied, carry → carried).
     - salty = salé ; drinking water = l’eau potable
5. énoncé : "Water to grow food\nWheat: a little. Beef: a lot."
   - question : Quelle phrase est juste ?
   - lu : Water to grow food. Wheat, a little. Beef, a lot.
   - choix : Beef needs more water than wheat. · Beef needs more water that wheat. · Wheat needs more water than beef.
   - réponse : Beef needs more water than wheat.
   - indice : D’abord : lequel demande beaucoup d’eau ? Puis : quel petit mot après more ?
   - explication : Le document le dit : le bœuf demande beaucoup d’eau, le blé un peu. Pour comparer : more … than ; that ne compare pas.
   - aide « More … than, et l’eau » :
     - Comparer : more + nom + than (more friends than me).
     - a lot = beaucoup ; a little = un peu ; wheat = le blé ; beef = le bœuf
6. énoncé : "Greenhill, an invented village: its electricity\nSun: 7 out of 10. Wind: 3 out of 10."
   - question : Quelle phrase est juste ?
   - lu : Greenhill, an invented village: its electricity. Sun, seven out of ten. Wind, three out of ten.
   - choix : Solar power is the biggest part. · Solar power is the bigest part. · Wind power is the biggest part.
   - réponse : Solar power is the biggest part.
   - indice : D’abord : quel nombre est le plus grand ? Puis : big, c’est consonne, voyelle, consonne.
   - explication : Greenhill est un village inventé pour l’exercice. 7 sur 10, c’est plus que 3 sur 10 : le soleil fait la plus grande part de son électricité. big est court et finit par consonne, voyelle, consonne : on double le g, the biggest.
   - aide « The biggest, et le document » :
     - Mot court en consonne + voyelle + consonne : on double (hot → the hottest).
     - out of = sur ; solar power = l’énergie solaire ; wind power = l’énergie du vent
7. énoncé : "Rice needs a lot of water.\nFarmers bring water from the river."
   - question : Quelle phrase est juste ?
   - lu : Rice needs a lot of water. Farmers bring water from the river.
   - choix : Look! The farmers are bringing river water. · Look! The farmers bringing river water. · Look! The farmers are bringing sea water.
   - réponse : Look! The farmers are bringing river water.
   - indice : D’abord : d’où vient l’eau du riz ? Puis : maintenant, il faut be + -ing.
   - explication : Le document dit que l’eau vient du fleuve ; l’eau de mer est salée, elle ferait mourir le riz. Look! dit que ça se passe maintenant : be + -ing, are bringing.
   - aide « Be + -ing, et l’irrigation » :
     - Maintenant (Look!, now) : be + verbe-ing (she is reading).
     - river = le fleuve, l’eau douce ; sea water = l’eau de mer, salée
8. énoncé : "Day 6, in a city\nThe power station burns coal."
   - question : Quelle phrase est juste ?
   - lu : Day six, in a city. The power station burns coal.
   - choix : The power station uses a fossil fuel. · The power station use a fossil fuel. · The power station uses a renewable energy.
   - réponse : The power station uses a fossil fuel.
   - indice : D’abord : le charbon se reforme-t-il vite ? Puis : the power station, c’est it.
   - explication : Le charbon met des millions d’années à se former : c’est une énergie fossile, non renouvelable. Au présent simple, avec it, le verbe prend un s : uses.
   - aide « Le -s, et le charbon » :
     - Présent simple avec he, she, it : verbe + s (she plays, it works).
     - coal = le charbon, fossile ; power station = la centrale
9. énoncé : "Day 7, in Morocco\nWe visited a solar power station."
   - question : Quelle phrase est juste ?
   - lu : Day seven, in Morocco. We visited a solar power station.
   - choix : The station didn’t use coal. · The station didn’t used coal. · The station didn’t use the sun.
   - réponse : The station didn’t use coal.
   - indice : D’abord : une centrale solaire marche avec quoi ? Puis : après didn’t, le verbe change-t-il ?
   - explication : solar veut dire solaire : la centrale marche au soleil, une énergie renouvelable, pas au charbon. Après didn’t, le verbe reste à la base : didn’t use.
   - aide « Didn’t, et le soleil » :
     - Négation au passé : didn’t + verbe sans -ed (we didn’t watch TV).
     - solar = solaire (le soleil) ; coal = le charbon
10. énoncé : "Day 8, in July\nNo rain since March: the river is dry."
    - question : Quelle phrase est juste ?
    - lu : Day eight, in July. No rain since March: the river is dry.
    - choix : The river stopped: there was not enough rain. · The river stoped: there was not enough rain. · The river stopped: there was too much rain.
    - réponse : The river stopped: there was not enough rain.
    - indice : D’abord : la rivière manque-t-elle d’eau, ou en a-t-elle trop ? Puis : stop, c’est consonne, voyelle, consonne.
    - explication : Pas de pluie depuis mars : c’est une sécheresse, la rivière manque d’eau. stop est court et finit par consonne, voyelle, consonne : on double le p, stopped.
    - aide « Stopped, et la sécheresse » :
      - Mot court en consonne + voyelle + consonne : on double (plan → planned).
      - dry = sec ; not enough = pas assez ; too much = trop
11. énoncé : "Water for one person, each day\nVillage A: 20 litres. Village B: 5 litres."
    - question : Quelle phrase est juste ?
    - lu : Water for one person, each day. Village A, twenty litres. Village B, five litres.
    - choix : Village A has more water than village B. · Village A has more water then village B. · Village B has more water than village A.
    - réponse : Village A has more water than village B.
    - indice : D’abord : quel village a le plus grand nombre ? Puis : quel petit mot après more ?
    - explication : 20 litres, c’est plus que 5 : le village A a plus d’eau. Pour comparer : more … than ; then veut dire ensuite.
    - aide « More … than, et le document » :
      - Comparer : more + nom + than (more books than you).
      - each day = chaque jour ; than = que (pour comparer) ; then = ensuite
12. énoncé : "Population of the delta\n1990: 10 million. 2020: 17 million."
    - question : Quelle phrase est juste ?
    - lu : Population of the delta. Nineteen ninety, ten million. Twenty twenty, seventeen million.
    - choix : In 2020, there were more people than in 1990. · In 2020, there was more people than in 1990. · In 1990, there were more people than in 2020.
    - réponse : In 2020, there were more people than in 1990.
    - indice : D’abord : en quelle année y a-t-il le plus d’habitants ? Puis : people, un ou plusieurs ?
    - explication : 17 millions en 2020, c’est plus que 10 millions en 1990 : la population a augmenté. people est un pluriel : there were ; there was va avec un seul (there was a river).
    - aide « There were, et la population » :
      - there was + un seul ; there were + plusieurs (there were two cats).
      - people = les gens (un pluriel) ; population = la population

### Le registre du port · `project-4e-docks`

- compétences : c4.ma.a.puissances · c4.ma.a.ecritures-ordres-de-grandeur · c4.hg.geographie.mondialisation · c4.hg.espace.localiser · c4.hg.demarches.document · c4.hg.demarches.lexique
- consigne : Lis le document, calcule, puis choisis la phrase juste. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "Un porte-conteneurs\nIl transporte 10⁴ conteneurs d’Asie vers l’Europe."
   - question : Quelle phrase est juste ?
   - lu : Un porte-conteneurs. Il transporte dix puissance quatre conteneurs d’Asie vers l’Europe.
   - choix : Il porte 10 000 conteneurs : c’est un flux de marchandises. · Il porte 40 conteneurs : c’est un flux de marchandises. · Il porte 10 000 conteneurs : c’est un flux de personnes.
   - réponse : Il porte 10 000 conteneurs : c’est un flux de marchandises.
   - indice : D’abord : combien de zéros après le 1 ? Puis : que transporte un conteneur ?
   - explication : 10⁴, c’est un 1 suivi de 4 zéros : 10 000. 40, c’est 10 × 4 : la base fois l’exposant. Un conteneur est une boîte pour les marchandises : le navire porte un flux de marchandises, pas de personnes.
   - aide « 10 puissance 4, et les flux » :
     - 10 puissance n, c’est un 1 suivi de n zéros : 10⁴ = 10 000.
     - Un conteneur porte des marchandises ; un flux, c’est ce qui circule.
2. énoncé : "Le canal de Suez relie la mer Méditerranée et la mer Rouge.\nCe matin, 4² navires l’ont traversé."
   - question : Quelle phrase est juste ?
   - lu : Le canal de Suez relie la mer Méditerranée et la mer Rouge. Ce matin, quatre au carré navires l’ont traversé.
   - choix : 16 navires ont relié la Méditerranée et la mer Rouge. · 8 navires ont relié la Méditerranée et la mer Rouge. · 16 navires ont relié l’Atlantique et le Pacifique.
   - réponse : 16 navires ont relié la Méditerranée et la mer Rouge.
   - indice : D’abord : 4², c’est 4 fois quoi ? Puis : quelles mers le document nomme-t-il ?
   - explication : 4² = 4 × 4 = 16. 8, c’est 4 × 2 : le carré n’est pas le double. Le document dit que Suez relie la Méditerranée et la mer Rouge ; l’Atlantique et le Pacifique, c’est le canal de Panama.
   - aide « Le carré, et le canal » :
     - 4², c’est 4 × 4 (pas 4 × 2).
     - Canal : une voie d’eau creusée pour relier deux mers.
3. énoncé : "Le voyage d’un tee-shirt : plus de 10⁴ kilomètres.\nCoton cultivé en Inde, couture au Bangladesh, vente en France."
   - question : Quelle phrase est juste ?
   - lu : Le voyage d’un tee-shirt : plus de dix puissance quatre kilomètres. Coton cultivé en Inde, couture au Bangladesh, vente en France.
   - choix : Cousu au Bangladesh, il voyage plus de 10 000 kilomètres. · Cousu au Bangladesh, il voyage plus de 1 000 kilomètres. · Cousu en France, il voyage plus de 10 000 kilomètres.
   - réponse : Cousu au Bangladesh, il voyage plus de 10 000 kilomètres.
   - indice : D’abord : combien de zéros après le 1 ? Puis : où est-il cousu, dans le document ?
   - explication : 10⁴ = 10 000 : quatre zéros. 1 000, c’est 10³ : un zéro oublié. Le document dit que la couture se fait au Bangladesh ; en France, le tee-shirt est vendu. Une étape par pays : c’est la mondialisation.
   - aide « 10 puissance 4, et le document » :
     - 10 puissance n, c’est un 1 suivi de n zéros : 10³ = 1 000 ; 10⁴ = 10 000.
     - Une ligne du document, une étape : où l’on cultive, où l’on coud, où l’on vend.
4. énoncé : "Shanghai, en Chine : le premier port à conteneurs du monde.\nUn de ses quais décharge 10³ conteneurs par jour."
   - question : Quelle phrase est juste ?
   - lu : Shanghai, en Chine : le premier port à conteneurs du monde. Un de ses quais décharge dix puissance trois conteneurs par jour.
   - choix : Dans ce port d’Asie, un quai décharge 1 000 conteneurs par jour. · Dans ce port d’Asie, un quai décharge 30 conteneurs par jour. · Dans ce port d’Europe, un quai décharge 1 000 conteneurs par jour.
   - réponse : Dans ce port d’Asie, un quai décharge 1 000 conteneurs par jour.
   - indice : D’abord : combien de zéros après le 1 ? Puis : sur quel continent est la Chine ?
   - explication : 10³ = 10 × 10 × 10 = 1 000. 30, c’est 10 × 3 : la base fois l’exposant. La Chine est en Asie : Shanghai est un port d’Asie, le premier du monde pour les conteneurs.
   - aide « 10 puissance 3, et les continents » :
     - 10³ = 10 × 10 × 10 = 1 000.
     - La Chine et l’Inde sont en Asie ; la France et les Pays-Bas, en Europe.
5. énoncé : "Le Havre, en France, sur la Manche\nUn navire y arrive avec 2 × 10⁴ tonnes de marchandises."
   - question : Quelle phrase est juste ?
   - lu : Le Havre, en France, sur la Manche. Un navire y arrive avec deux fois dix puissance quatre tonnes de marchandises.
   - choix : Un navire arrive en Europe avec 20 000 tonnes. · Un navire arrive en Europe avec 200 000 tonnes. · Un navire arrive en Asie avec 20 000 tonnes.
   - réponse : Un navire arrive en Europe avec 20 000 tonnes.
   - indice : D’abord : écris 10⁴, puis prends-le 2 fois. Puis : sur quel continent est la France ?
   - explication : 10⁴ = 10 000, et 2 × 10 000 = 20 000 tonnes. 200 000 a un zéro de trop : 10⁴ n’en a que quatre. Le Havre est en France : le navire arrive en Europe.
   - aide « 2 × 10⁴, et les continents » :
     - 2 × 10⁴ = 2 × 10 000 = 20 000.
     - La France est en Europe ; la Chine, en Asie.
6. énoncé : "Le détroit de Malacca, en Asie : un passage de mer étroit entre deux terres.\nEn une heure, 2³ navires l’ont franchi."
   - question : Quelle phrase est juste ?
   - lu : Le détroit de Malacca, en Asie : un passage de mer étroit entre deux terres. En une heure, deux puissance trois navires l’ont franchi.
   - choix : 8 navires ont franchi ce passage naturel entre deux terres. · 6 navires ont franchi ce passage naturel entre deux terres. · 8 navires ont franchi ce canal creusé entre deux mers.
   - réponse : 8 navires ont franchi ce passage naturel entre deux terres.
   - indice : D’abord : 2³, c’est 2 × 2 × 2. Puis : un détroit, est-il creusé ?
   - explication : 2³ = 2 × 2 × 2 = 8. 6, c’est 2 × 3 : la base fois l’exposant. Un détroit est un passage de mer naturel entre deux terres ; un canal, lui, est creusé pour relier deux mers.
   - aide « 2 puissance 3, et le détroit » :
     - 2³, c’est 2 × 2 × 2 : trois fois le 2.
     - Détroit : un passage de mer étroit entre deux terres ; canal : une voie d’eau creusée.
7. énoncé : "Une firme de vêtements\nElle a des usines et des magasins dans 10² pays."
   - question : Quelle phrase est juste ?
   - lu : Une firme de vêtements. Elle a des usines et des magasins dans dix au carré pays.
   - choix : Présente dans 100 pays, c’est une firme transnationale. · Présente dans 20 pays, c’est une firme transnationale. · Présente dans 100 pays, c’est une firme nationale.
   - réponse : Présente dans 100 pays, c’est une firme transnationale.
   - indice : D’abord : 10², c’est 10 fois quoi ? Puis : une firme dans beaucoup de pays, comment s’appelle-t-elle ?
   - explication : 10² = 10 × 10 = 100. 20, c’est 10 × 2 : le carré n’est pas le double. Une firme présente dans beaucoup de pays est transnationale ; une firme nationale reste dans un seul pays.
   - aide « 10 au carré, et la firme » :
     - 10² = 10 × 10 = 100.
     - Firme transnationale : une entreprise présente dans beaucoup de pays.
8. énoncé : "Le canal de Panama relie l’océan Atlantique et l’océan Pacifique.\nIl évite aux navires un détour de plus de 10⁴ kilomètres."
   - question : Quelle phrase est juste ?
   - lu : Le canal de Panama relie l’océan Atlantique et l’océan Pacifique. Il évite aux navires un détour de plus de dix puissance quatre kilomètres.
   - choix : Entre l’Atlantique et le Pacifique, il évite plus de 10 000 kilomètres. · Entre l’Atlantique et le Pacifique, il évite plus de 100 000 kilomètres. · Entre la Méditerranée et la mer Rouge, il évite plus de 10 000 kilomètres.
   - réponse : Entre l’Atlantique et le Pacifique, il évite plus de 10 000 kilomètres.
   - indice : D’abord : combien de zéros après le 1 ? Puis : quels océans le document nomme-t-il ?
   - explication : 10⁴ = 10 000 : quatre zéros. 100 000 a un zéro de trop : c’est 10⁵. Le document dit que Panama relie l’Atlantique et le Pacifique ; la Méditerranée et la mer Rouge, c’est le canal de Suez.
   - aide « 10 puissance 4, et le canal » :
     - 10 puissance n, c’est un 1 suivi de n zéros : 10⁴ = 10 000.
     - Canal : une voie d’eau creusée pour relier deux mers ou deux océans.
9. énoncé : "La ZEE (zone économique exclusive) : la mer qu’un pays est seul à exploiter.\nElle va jusqu’à 2 × 10² milles marins des côtes."
   - question : Quelle phrase est juste ?
   - lu : La zone économique exclusive : la mer qu’un pays est seul à exploiter. Elle va jusqu’à deux fois dix au carré milles marins des côtes.
   - choix : Jusqu’à 200 milles des côtes, seul ce pays exploite la mer. · Jusqu’à 2 000 milles des côtes, seul ce pays exploite la mer. · Jusqu’à 200 milles des côtes, tous les pays exploitent la mer.
   - réponse : Jusqu’à 200 milles des côtes, seul ce pays exploite la mer.
   - indice : D’abord : écris 10², puis prends-le 2 fois. Puis : que veut dire « exclusive » ?
   - explication : 10² = 100, et 2 × 100 = 200 milles marins. 2 000 a un zéro de trop : 10² n’en a que deux. La ZEE est exclusive : seul le pays de la côte exploite cette mer, ses poissons et son sous-sol.
   - aide « 2 × 10², et la ZEE » :
     - 2 × 10² = 2 × 100 = 200.
     - ZEE : la mer que seul le pays de la côte exploite.
10. énoncé : "Un navire part de Shanghai, en Chine, pour Le Havre, en France.\nIl porte 10 rangées de 10² conteneurs."
    - question : Quelle phrase est juste ?
    - lu : Un navire part de Shanghai, en Chine, pour Le Havre, en France. Il porte dix rangées de dix au carré conteneurs.
    - choix : Il porte 1 000 conteneurs, d’Asie vers l’Europe. · Il porte 110 conteneurs, d’Asie vers l’Europe. · Il porte 1 000 conteneurs, d’Europe vers l’Asie.
    - réponse : Il porte 1 000 conteneurs, d’Asie vers l’Europe.
    - indice : D’abord : 10 rangées de 100, c’est 10 fois 100. Puis : d’où part le navire ?
    - explication : 10² = 100, et 10 rangées de 100 : 10 × 100 = 1 000, soit 10³. 110, c’est 10 + 100 : on a ajouté au lieu de multiplier. Le navire part de Chine, en Asie, pour la France, en Europe : d’Asie vers l’Europe.
    - aide « 10 fois 10², et le trajet » :
      - 10 × 10² = 10 × 100 = 1 000 = 10³.
      - Un flux part d’un lieu vers un autre : lis « part de », puis « pour ».
11. énoncé : "Sous la mer, des câbles transportent les données d’Internet.\nUn câble neuf relie 3² pays."
    - question : Quelle phrase est juste ?
    - lu : Sous la mer, des câbles transportent les données d’Internet. Un câble neuf relie trois au carré pays.
    - choix : Il relie 9 pays : c’est un flux d’informations. · Il relie 6 pays : c’est un flux d’informations. · Il relie 9 pays : c’est un flux de marchandises.
    - réponse : Il relie 9 pays : c’est un flux d’informations.
    - indice : D’abord : 3², c’est 3 fois quoi ? Puis : les données d’Internet, qu’est-ce que c’est ?
    - explication : 3² = 3 × 3 = 9. 6, c’est 3 × 2 : le carré n’est pas le double. Les données d’Internet sont des informations : le câble porte un flux d’informations ; les marchandises voyagent dans les navires.
    - aide « Le carré, et les flux » :
      - 3² = 3 × 3 (pas 3 × 2).
      - Flux : ce qui circule, des marchandises, des personnes, des informations.
12. énoncé : "Sur le quai, les conteneurs sont rangés en carré.\n5 rangées de 5 conteneurs : 5² conteneurs."
    - question : Quelle phrase est juste ?
    - lu : Sur le quai, les conteneurs sont rangés en carré. Cinq rangées de cinq conteneurs : cinq au carré conteneurs.
    - choix : Il y a 25 conteneurs, de grandes boîtes en métal. · Il y a 10 conteneurs, de grandes boîtes en métal. · Il y a 25 conteneurs, de grands navires.
    - réponse : Il y a 25 conteneurs, de grandes boîtes en métal.
    - indice : D’abord : 5², c’est 5 fois quoi ? Puis : un conteneur, qu’est-ce que c’est ?
    - explication : 5² = 5 × 5 = 25. 10, c’est 5 × 2 : le carré n’est pas le double. Un conteneur est une grande boîte en métal pour les marchandises ; le navire qui les porte est un porte-conteneurs.
    - aide « Le carré, et le conteneur » :
      - 5² = 5 × 5 (pas 5 × 2).
      - Conteneur : une grande boîte en métal pour les marchandises.

### La dépêche · `project-4e-telegraph`

- compétences : c4.fr.langue.formation-des-mots · c4.fr.langue.sens-des-mots · c4.pc.signaux.lumiere-son · c4.pc.energie.circuits · c4.pc.demarches.langages
- consigne : Lis le document, puis choisis la phrase juste. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "1794 : le télégraphe de Chappe\nSur chaque tour, des bras de bois font des signes, vus de la tour suivante."
   - question : Quelle phrase est juste ?
   - lu : Mille sept cent quatre-vingt-quatorze : le télégraphe de Chappe. Sur chaque tour, des bras de bois font des signes, vus de la tour suivante.
   - choix : Le télégraphe écrit au loin ; on voit ses signes grâce à la lumière. · Le télégraphe écrit de près ; on voit ses signes grâce à la lumière. · Le télégraphe écrit au loin ; on voit ses signes grâce au son.
   - réponse : Le télégraphe écrit au loin ; on voit ses signes grâce à la lumière.
   - indice : D’abord : que veut dire télé- ? Puis : pour voir un objet, qu’est-ce qui doit entrer dans l’œil ?
   - explication : Télé- veut dire loin, -graphe veut dire écrire : le télégraphe écrit au loin. On voit les bras de bois parce que la lumière qu’ils renvoient entre dans l’œil ; le son, lui, s’entend.
   - aide « Télé-graphe, et voir » :
     - télé- = loin ; -graphe = écrire.
     - Pour voir un objet, sa lumière doit entrer dans l’œil.
2. énoncé : "Dans un téléphone, la voix fait vibrer une petite plaque.\nCette vibration devient un signal électrique."
   - question : Quelle phrase est juste ?
   - lu : Dans un téléphone, la voix fait vibrer une petite plaque. Cette vibration devient un signal électrique.
   - choix : Le téléphone fait entendre une voix de loin : le son est une vibration. · Le téléphone fait voir une image de loin : le son est une vibration. · Le téléphone fait entendre une voix de loin : le son est un rayon de lumière.
   - réponse : Le téléphone fait entendre une voix de loin : le son est une vibration.
   - indice : D’abord : que veut dire -phone ? Puis : que fait la voix dans le document ?
   - explication : Télé- veut dire loin, -phone veut dire son, voix : le téléphone fait entendre une voix de loin. Le document le dit : la voix fait vibrer une plaque ; un son est une vibration de la matière, pas un rayon de lumière.
   - aide « Télé-phone, et le son » :
     - télé- = loin ; -phone = son, voix.
     - Le son est une vibration ; il a besoin de matière pour avancer.
3. énoncé : "La chorale chante en polyphonie.\nLes voix aiguës et les voix graves chantent en même temps."
   - question : Quelle phrase est juste ?
   - lu : La chorale chante en polyphonie. Les voix aiguës et les voix graves chantent en même temps.
   - choix : Plusieurs voix chantent ensemble ; les voix aiguës ont une grande fréquence. · Une seule voix chante ; les voix aiguës ont une grande fréquence. · Plusieurs voix chantent ensemble ; les voix aiguës ont une petite fréquence.
   - réponse : Plusieurs voix chantent ensemble ; les voix aiguës ont une grande fréquence.
   - indice : D’abord : que veut dire poly- ? Puis : un son aigu vibre-t-il vite ou lentement ?
   - explication : Poly- veut dire plusieurs, -phonie vient de son, voix : la polyphonie, ce sont plusieurs voix ensemble. Un son aigu vibre vite : il a une grande fréquence ; un son grave, une petite.
   - aide « Poly-phonie, et la fréquence » :
     - poly- = plusieurs ; -phone = son, voix.
     - Grande fréquence : son aigu. Petite fréquence : son grave.
4. énoncé : "Un télescope montre des étoiles très lointaines.\nLeur lumière a traversé l’espace, où il n’y a pas d’air."
   - question : Quelle phrase est juste ?
   - lu : Un télescope montre des étoiles très lointaines. Leur lumière a traversé l’espace, où il n’y a pas d’air.
   - choix : Le télescope sert à regarder loin : la lumière traverse le vide. · Le télescope sert à écouter loin : la lumière traverse le vide. · Le télescope sert à regarder loin : la lumière ne traverse pas le vide.
   - réponse : Le télescope sert à regarder loin : la lumière traverse le vide.
   - indice : D’abord : que veut dire -scope ? Puis : la lumière des étoiles arrive-t-elle jusqu’à nous ?
   - explication : Télé- veut dire loin, -scope veut dire regarder : le télescope sert à regarder loin. La lumière des étoiles arrive jusqu’à nous à travers l’espace vide ; c’est le son qui ne traverse pas le vide.
   - aide « Télé-scope, et le vide » :
     - télé- = loin ; -scope = regarder.
     - La lumière traverse le vide ; le son, non.
5. énoncé : "Le sifflet de l’arbitre : 3 000 hertz.\nLa corne de brume du port : 100 hertz."
   - question : Quelle phrase est juste ?
   - lu : Le sifflet de l’arbitre : trois mille hertz. La corne de brume du port : cent hertz.
   - choix : Le sifflet est aigu, la corne est grave : deux antonymes. · Le sifflet est grave, la corne est aiguë : deux antonymes. · Le sifflet est aigu, la corne est grave : deux synonymes.
   - réponse : Le sifflet est aigu, la corne est grave : deux antonymes.
   - indice : D’abord : quel son a la plus grande fréquence ? Puis : aigu et grave, ont-ils un sens proche ou contraire ?
   - explication : 3 000 hertz, c’est une grande fréquence : le sifflet est aigu ; 100 hertz, une petite : la corne est grave. Aigu et grave ont des sens contraires : ce sont des antonymes, pas des synonymes.
   - aide « Aigu et grave, deux contraires » :
     - Synonymes : sens proche. Antonymes : sens contraire.
     - Grande fréquence : son aigu. Petite fréquence : son grave.
6. énoncé : "Nino veut connaître la tension aux bornes de la lampe.\nIl prend un voltmètre."
   - question : Quelle phrase est juste ?
   - lu : Nino veut connaître la tension aux bornes de la lampe. Il prend un voltmètre.
   - choix : Le voltmètre mesure la tension : on le branche aux deux bornes de la lampe. · Le voltmètre produit la tension : on le branche aux deux bornes de la lampe. · Le voltmètre mesure la tension : on le branche en série avec la lampe.
   - réponse : Le voltmètre mesure la tension : on le branche aux deux bornes de la lampe.
   - indice : D’abord : que veut dire -mètre ? Puis : un voltmètre, où se branche-t-il ?
   - explication : -mètre veut dire mesure : le voltmètre mesure une tension, en volts ; c’est la pile qui la produit. Il se branche aux deux bornes de la lampe ; c’est l’ampèremètre qui se branche en série.
   - aide « Volt-mètre, et ses bornes » :
     - -mètre = mesure (thermomètre, voltmètre).
     - Le voltmètre se branche aux deux bornes ; l’ampèremètre, en série.
7. énoncé : "Le chien entend un sifflet à ultrasons : 30 000 hertz.\nLéa, elle, n’entend rien."
   - question : Quelle phrase est juste ?
   - lu : Le chien entend un sifflet à ultrasons : trente mille hertz. Léa, elle, n’entend rien.
   - choix : Pour Léa, ce son est inaudible : il dépasse 20 000 hertz. · Pour Léa, ce son est audible : il dépasse 20 000 hertz. · Pour Léa, ce son est inaudible : il est sous 20 hertz.
   - réponse : Pour Léa, ce son est inaudible : il dépasse 20 000 hertz.
   - indice : D’abord : que veut dire in- devant un mot ? Puis : 30 000 hertz, c’est au-dessus ou en dessous de ce qu’on entend ?
   - explication : In- dit le contraire : audible, qu’on peut entendre ; inaudible, qu’on ne peut pas entendre. On entend de 20 à 20 000 hertz : 30 000 hertz, c’est au-dessus, un ultrason. Sous 20 hertz, ce sont les infrasons.
   - aide « In-audible, et les ultrasons » :
     - in-, im-, il-, ir- = contraire : audible, inaudible.
     - On entend de 20 à 20 000 hertz ; au-dessus, les ultrasons.
8. énoncé : "Le phare envoie un rayon de lumière vers les bateaux.\nAu supermarché, Tom cherche le rayon des jouets."
   - question : Quelle phrase est juste ?
   - lu : Le phare envoie un rayon de lumière vers les bateaux. Au supermarché, Tom cherche le rayon des jouets.
   - choix : Le mot rayon a deux sens ; le rayon du phare va en ligne droite. · Le mot rayon a un seul sens ; le rayon du phare va en ligne droite. · Le mot rayon a deux sens ; le rayon du phare fait des courbes.
   - réponse : Le mot rayon a deux sens ; le rayon du phare va en ligne droite.
   - indice : D’abord : le rayon du phare et celui des jouets, est-ce la même chose ? Puis : comment va la lumière ?
   - explication : Rayon a plusieurs sens : un trait de lumière, et une partie d’un magasin. C’est la polysémie. Dans l’air, la lumière va en ligne droite : on dessine son rayon par un trait droit.
   - aide « Un mot, deux sens, et la lumière » :
     - Un mot peut avoir plusieurs sens : c’est la polysémie.
     - La lumière va en ligne droite ; on la dessine par un rayon.
9. énoncé : "Pendant l’orage, Léa voit un éclair au loin.\nLe soir, elle a « un éclair de génie » pour son exposé."
   - question : Quelle phrase est juste ?
   - lu : Pendant l’orage, Léa voit un éclair au loin. Le soir, elle a un éclair de génie pour son exposé.
   - choix : « Un éclair de génie » est au sens figuré ; le tonnerre arrive après l’éclair. · « Un éclair de génie » est au sens propre ; le tonnerre arrive après l’éclair. · « Un éclair de génie » est au sens figuré ; le tonnerre arrive avant l’éclair.
   - réponse : « Un éclair de génie » est au sens figuré ; le tonnerre arrive après l’éclair.
   - indice : D’abord : l’idée de Léa est-elle un vrai éclair ? Puis : qui va le plus vite, la lumière ou le son ?
   - explication : Un éclair de génie n’est pas un vrai éclair : c’est une image pour une idée soudaine, le sens figuré. La lumière va bien plus vite que le son : on voit l’éclair, puis on entend le tonnerre.
   - aide « Sens figuré, et la vitesse » :
     - Sens propre : le sens concret. Sens figuré : une image.
     - La lumière va bien plus vite que le son (340 mètres en une seconde).
10. énoncé : "Dans l’espace, il n’y a pas d’air : c’est le vide.\nDeux astronautes ne s’entendent que par la radio."
    - question : Quelle phrase est juste ?
    - lu : Dans l’espace, il n’y a pas d’air : c’est le vide. Deux astronautes ne s’entendent que par la radio.
    - choix : Dans l’espace, tout est silencieux : le son ne traverse pas le vide. · Dans l’espace, tout est bruyant : le son ne traverse pas le vide. · Dans l’espace, tout est silencieux : le son traverse le vide.
    - réponse : Dans l’espace, tout est silencieux : le son ne traverse pas le vide.
    - indice : D’abord : silencieux, c’est avec ou sans bruit ? Puis : le son a-t-il besoin de matière ?
    - explication : Silencieux veut dire sans bruit ; bruyant, c’est son contraire. Le son a besoin de matière pour avancer, l’air ou un mur : dans le vide, il ne passe pas.
    - aide « Silencieux, et le vide » :
      - silencieux = sans bruit ; bruyant = plein de bruit.
      - Le son a besoin de matière pour avancer. Dans le vide, rien.
11. énoncé : "« La lampe s’allume, le miroir brille, la pièce s’éclaire. »"
    - question : Quelle phrase est juste ?
    - lu : La lampe s’allume, le miroir brille, la pièce s’éclaire.
    - choix : C’est le champ lexical de la lumière ; seule la lampe en produit. · C’est le champ lexical du son ; seule la lampe en produit. · C’est le champ lexical de la lumière ; le miroir en produit aussi.
    - réponse : C’est le champ lexical de la lumière ; seule la lampe en produit.
    - indice : D’abord : de quoi parlent s’allume, brille, s’éclaire ? Puis : le miroir fabrique-t-il sa lumière ?
    - explication : S’allumer, briller, s’éclairer parlent tous de la lumière : c’est son champ lexical. La lampe est une source : elle produit sa lumière. Le miroir brille parce qu’il renvoie la lumière qu’il reçoit.
    - aide « Champ lexical, et la source » :
      - Champ lexical : les mots qui parlent d’un même thème.
      - Une source produit sa lumière ; les autres objets renvoient celle qu’ils reçoivent.
12. énoncé : "Pour éteindre la lampe, Lou appuie sur l’interrupteur.\nLe circuit est maintenant ouvert."
    - question : Quelle phrase est juste ?
    - lu : Pour éteindre la lampe, Lou appuie sur l’interrupteur. Le circuit est maintenant ouvert.
    - choix : L’interrupteur interrompt le courant : circuit ouvert, lampe éteinte. · L’interrupteur fabrique le courant : circuit ouvert, lampe éteinte. · L’interrupteur interrompt le courant : circuit ouvert, lampe allumée.
    - réponse : L’interrupteur interrompt le courant : circuit ouvert, lampe éteinte.
    - indice : D’abord : de quel verbe vient interrupteur ? Puis : dans un circuit ouvert, le courant passe-t-il ?
    - explication : Interrupteur vient du verbe interrompre, avec -eur, ce qui fait l’action : il interrompt le courant ; c’est la pile qui le fournit. Circuit ouvert : le courant ne passe plus, la lampe est éteinte.
    - aide « Interrupt-eur, et le circuit » :
      - -eur = celui ou ce qui fait l’action : un interrupteur interrompt.
      - Circuit ouvert : le courant ne passe pas. Circuit fermé : il passe.

### L’atelier des solides · `project-3e-solids`

- compétences : c4.ma.d.pythagore · c4.ma.d.thales · c4.fr.lecture.procedes · c4.fr.langue.enonciation · c4.fr.langue.discours-rapporte · c4.fr.langue.passif · c4.fr.langue.coherence-textuelle
- consigne : Lis le texte, calcule, puis choisis la phrase juste. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "Un pot en cylindre : 6 cm de large, 8 cm de haut.\nLéo dit : « Ma paille de 10 cm tient juste en biais. »"
   - question : Quelle phrase est juste ?
   - lu : Un pot en cylindre : 6 centimètres de large, 8 centimètres de haut. Léo dit : ma paille de 10 centimètres tient juste en biais.
   - choix : Léo dit que sa paille tient juste : le biais mesure 10 centimètres. · Léo dit que ma paille tient juste : le biais mesure 10 centimètres. · Léo dit que sa paille tient juste : le biais mesure 14 centimètres.
   - réponse : Léo dit que sa paille tient juste : le biais mesure 10 centimètres.
   - indice : D’abord : 6 et 8, c’est quel triangle connu ? Puis : dans « Léo dit que », qui est « ma » ?
   - explication : Le biais est l’hypoténuse d’un triangle rectangle de côtés 6 et 8 : c’est le triangle 6-8-10, il mesure 10 cm. 14, c’est 6 + 8 : on n’ajoute pas les côtés. Au discours indirect, Léo n’est plus celui qui parle : « ma paille » devient « sa paille ».
   - figure : triangle 6 · 8 · ?
   - aide « Le triangle 6-8-10, et le discours indirect » :
     - 6² + 8² = 36 + 64 = 100 = 10² : l’hypoténuse mesure 10.
     - Discours indirect : « ma paille » devient « sa paille ».
2. énoncé : "« La pyramide pointe vers le ciel comme une flèche. »\nHauteur : 4 m. Du centre de la base au milieu d’un bord : 3 m."
   - question : Quelle phrase est juste ?
   - lu : La pyramide pointe vers le ciel comme une flèche. Hauteur : 4 mètres. Du centre de la base au milieu d’un bord : 3 mètres.
   - choix : C’est une comparaison ; du milieu du bord au sommet, il y a 5 mètres. · C’est une métaphore ; du milieu du bord au sommet, il y a 5 mètres. · C’est une comparaison ; du milieu du bord au sommet, il y a 7 mètres.
   - réponse : C’est une comparaison ; du milieu du bord au sommet, il y a 5 mètres.
   - indice : D’abord : 3 et 4, c’est quel triangle connu ? Puis : la phrase a-t-elle le mot « comme » ?
   - explication : La hauteur et le segment de la base font un angle droit : c’est le triangle 3-4-5, la pente mesure 5 m. 7, c’est 3 + 4 : on n’ajoute pas les côtés. La phrase rapproche la pyramide d’une flèche avec « comme » : c’est une comparaison ; sans « comme », ce serait une métaphore.
   - figure : triangle 3 · 4 · ?
   - aide « Le triangle 3-4-5, et la comparaison » :
     - 3² + 4² = 9 + 16 = 25 = 5² : l’hypoténuse mesure 5.
     - Comparaison : avec « comme ». Métaphore : une image sans « comme ».
3. énoncé : "Lou : « Cette colonne touche le ciel ! »\nUn bâton de 1 m a une ombre de 2 m ; l’ombre de la colonne mesure 8 m."
   - question : Quelle phrase est juste ?
   - lu : Lou dit : cette colonne touche le ciel ! Un bâton de 1 mètre a une ombre de 2 mètres ; l’ombre de la colonne mesure 8 mètres.
   - choix : Lou exagère, c’est une hyperbole : la colonne mesure 4 mètres. · Lou exagère, c’est une comparaison : la colonne mesure 4 mètres. · Lou exagère, c’est une hyperbole : la colonne mesure 16 mètres.
   - réponse : Lou exagère, c’est une hyperbole : la colonne mesure 4 mètres.
   - indice : D’abord : l’ombre du bâton est combien de fois sa hauteur ? Puis : Lou exagère-t-il, ou compare-t-il avec « comme » ?
   - explication : L’ombre du bâton est 2 fois sa hauteur ; au même moment, c’est pareil pour la colonne : 8 ÷ 2 = 4 m. 16, c’est 8 × 2 : on a multiplié au lieu de diviser. Lou exagère sans « comme » : c’est une hyperbole.
   - figure : tableau ombre (m) · hauteur (m) / 2 · 1 / 8 · ?
   - aide « L’ombre, et l’hyperbole » :
     - Au même moment, hauteur et ombre sont proportionnelles (Thalès).
     - Hyperbole : une exagération ; comparaison : un rapprochement avec « comme ».
4. énoncé : "Le plan de la rampe a été dessiné par Inès, puis vérifié par Tom.\nLa rampe monte de 6 m pour 8 m au sol."
   - question : Quelle phrase est juste ?
   - lu : Le plan de la rampe a été dessiné par Inès, puis vérifié par Tom. La rampe monte de 6 mètres pour 8 mètres au sol.
   - choix : Inès a dessiné la rampe ; elle mesure 10 mètres. · Tom a dessiné la rampe ; elle mesure 10 mètres. · Inès a dessiné la rampe ; elle mesure 14 mètres.
   - réponse : Inès a dessiné la rampe ; elle mesure 10 mètres.
   - indice : D’abord : 6 et 8, c’est quel triangle connu ? Puis : qui est après « dessiné par » ?
   - explication : La hauteur et le sol font un angle droit : c’est le triangle 6-8-10, la rampe mesure 10 m. 14, c’est 6 + 8 : on n’ajoute pas les côtés. À la voix passive, celui qui fait l’action est après « par » : Inès a dessiné, Tom a vérifié.
   - figure : triangle 6 · 8 · ?
   - aide « Le triangle 6-8-10, et la voix passive » :
     - 6² + 8² = 36 + 64 = 100 = 10² : l’hypoténuse mesure 10.
     - Voix passive : celui qui fait l’action est après « par ».
5. énoncé : "La porte de la colonne : 3 m de large et 4 m de haut.\nOn veut y faire passer une planche de 5 m, en biais."
   - question : Quelle phrase est juste ?
   - lu : La porte de la colonne : 3 mètres de large et 4 mètres de haut. On veut y faire passer une planche de 5 mètres, en biais.
   - choix : La diagonale mesure 5 mètres, donc la planche passe tout juste. · La diagonale mesure 5 mètres, pourtant la planche passe tout juste. · La diagonale mesure 7 mètres, donc la planche passe tout juste.
   - réponse : La diagonale mesure 5 mètres, donc la planche passe tout juste.
   - indice : D’abord : 3 et 4, c’est quel triangle connu ? Puis : la planche passe-t-elle à cause de la diagonale, ou malgré elle ?
   - explication : La largeur et la hauteur font un angle droit : c’est le triangle 3-4-5, la diagonale mesure 5 m. 7, c’est 3 + 4 : on n’ajoute pas les côtés. La planche passe parce que la diagonale mesure 5 m : c’est une conséquence, donc ; pourtant dit une opposition.
   - figure : triangle 3 · 4 · ?
   - aide « Le triangle 3-4-5, et donc » :
     - 3² + 4² = 9 + 16 = 25 = 5² : l’hypoténuse mesure 5.
     - donc = une conséquence ; pourtant = une opposition.
6. énoncé : "Le cylindre de la colonne : 3 m de diamètre, 4 m de haut.\nNour demande : « Une échelle de 5 m tient-elle en biais dedans ? »"
   - question : Quelle phrase est juste ?
   - lu : Le cylindre de la colonne : 3 mètres de diamètre, 4 mètres de haut. Nour demande : une échelle de 5 mètres tient-elle en biais dedans ?
   - choix : Nour demande si l’échelle tient : oui, tout juste. · Nour demande est-ce que l’échelle tient : oui, tout juste. · Nour demande si l’échelle tient : non, il faudrait 7 mètres.
   - réponse : Nour demande si l’échelle tient : oui, tout juste.
   - indice : D’abord : 3 et 4, c’est quel triangle connu ? Puis : comment rapporter une question qui se répond par oui ou non ?
   - explication : Le diamètre et la hauteur font un angle droit : c’est le triangle 3-4-5, le biais mesure 5 m, juste la longueur de l’échelle. 7, c’est 3 + 4 : on n’ajoute pas les côtés. Une question par oui ou non se rapporte avec « si » : Nour demande si l’échelle tient.
   - figure : triangle 3 · 4 · ?
   - aide « Le triangle 3-4-5, et la question rapportée » :
     - 3² + 4² = 9 + 16 = 25 = 5² : l’hypoténuse mesure 5.
     - Question rapportée : « tient-elle ? » devient « si elle tient ».
7. énoncé : "Sur une face de la pyramide, Inès trace un triangle de 6, 8 et 10 cm.\nElle vérifie ensuite son angle avec une équerre."
   - question : Quelle phrase est juste ?
   - lu : Sur une face de la pyramide, Inès trace un triangle de 6, 8 et 10 centimètres. Elle vérifie ensuite son angle avec une équerre.
   - choix : « Elle » désigne Inès ; le triangle est rectangle. · « Elle » désigne la face ; le triangle est rectangle. · « Elle » désigne Inès ; le triangle n’est pas rectangle.
   - réponse : « Elle » désigne Inès ; le triangle est rectangle.
   - indice : D’abord : 6² + 8², est-ce égal à 10² ? Puis : qui peut tenir une équerre ?
   - explication : 6² + 8² = 36 + 64 = 100, et 10² = 100 : l’égalité est vraie, le triangle est rectangle. « Elle » reprend Inès : c’est elle qui trace, puis qui vérifie ; une face ne tient pas d’équerre.
   - aide « La réciproque, et le pronom » :
     - Si le carré du plus grand côté est la somme des deux autres carrés, le triangle est rectangle.
     - Un pronom reprend un nom déjà écrit : cherche qui fait l’action.
8. énoncé : "« La pyramide est une montagne de pierre. »\nSur une face, (MN) est parallèle à (AB) : SM = 2 m, SA = 6 m, AB = 9 m."
   - question : Quelle phrase est juste ?
   - lu : La pyramide est une montagne de pierre. Sur une face, la droite M N est parallèle à la droite A B : S M égale 2 mètres, S A égale 6 mètres, A B égale 9 mètres.
   - choix : C’est une métaphore ; MN mesure 3 mètres. · C’est une comparaison ; MN mesure 3 mètres. · C’est une métaphore ; MN mesure 5 mètres.
   - réponse : C’est une métaphore ; MN mesure 3 mètres.
   - indice : D’abord : SM est quelle part de SA ? Puis : la phrase a-t-elle le mot « comme » ?
   - explication : SM = 2 et SA = 6 : SM est le tiers de SA, donc MN est le tiers de AB : 9 ÷ 3 = 3 m. 5, c’est 9 − 4 : on a enlevé l’écart entre 6 et 2 au lieu de prendre le même rapport. La pyramide est appelée montagne sans « comme » : c’est une métaphore.
   - figure : tableau petit triangle · grand triangle / 2 · 6 / ? · 9
   - aide « Thalès, et la métaphore » :
     - Thalès : MN ÷ AB = SM ÷ SA (ici, 2 sur 6, le tiers).
     - Métaphore : une image sans « comme ». Comparaison : avec « comme ».
9. énoncé : "« La sphère veille sur la ville. »\nUn câble de 10 m va du haut de la colonne au sol, à 6 m de son pied."
   - question : Quelle phrase est juste ?
   - lu : La sphère veille sur la ville. Un câble de 10 mètres va du haut de la colonne au sol, à 6 mètres de son pied.
   - choix : C’est une personnification ; la colonne mesure 8 mètres. · C’est une comparaison ; la colonne mesure 8 mètres. · C’est une personnification ; la colonne mesure 4 mètres.
   - réponse : C’est une personnification ; la colonne mesure 8 mètres.
   - indice : D’abord : 6 et 10, c’est quel triangle connu ? Puis : une sphère peut-elle veiller, comme une personne ?
   - explication : Le câble est l’hypoténuse du triangle 6-8-10 : la colonne mesure 8 m. 4, c’est 10 − 6 : on n’enlève pas les côtés. La sphère veille comme une personne : c’est une personnification ; il n’y a pas de « comme », ce n’est pas une comparaison.
   - figure : triangle 6 · ? · 10
   - aide « Le triangle 6-8-10, et la personnification » :
     - 6-8-10 : si l’hypoténuse mesure 10 et un côté 6, l’autre mesure 8.
     - Personnification : une chose agit comme une personne.
10. énoncé : "Message écrit par Sami hier : « Aujourd’hui, l’ombre du cube mesure 6 m. »\nAu même moment, un bâton de 1 m avait une ombre de 2 m."
    - question : Quelle phrase est juste ?
    - lu : Message écrit par Sami hier : aujourd’hui, l’ombre du cube mesure 6 mètres. Au même moment, un bâton de 1 mètre avait une ombre de 2 mètres.
    - choix : Hier, l’ombre mesurait 6 mètres : le cube a 3 mètres de haut. · Aujourd’hui, l’ombre mesure 6 mètres : le cube a 3 mètres de haut. · Hier, l’ombre mesurait 6 mètres : le cube a 12 mètres de haut.
    - réponse : Hier, l’ombre mesurait 6 mètres : le cube a 3 mètres de haut.
    - indice : D’abord : l’ombre du bâton est combien de fois sa hauteur ? Puis : le « aujourd’hui » de Sami, c’est quel jour pour nous ?
    - explication : L’ombre du bâton est 2 fois sa hauteur ; au même moment, c’est pareil pour le cube : 6 ÷ 2 = 3 m. 12, c’est 6 × 2 : on a multiplié au lieu de diviser. Sami a écrit hier : son « aujourd’hui », c’est hier pour nous.
    - figure : tableau ombre (m) · hauteur (m) / 2 · 1 / 6 · ?
    - aide « L’ombre, et le jour du message » :
      - Au même moment, hauteur et ombre sont proportionnelles (Thalès).
      - « Aujourd’hui » veut dire le jour où le message a été écrit.
11. énoncé : "Lina a dit : « J’ai mesuré la pente de la pyramide. »\nHauteur : 8 m. Du centre de la base au milieu d’un bord : 6 m."
    - question : Quelle phrase est juste ?
    - lu : Lina a dit : j’ai mesuré la pente de la pyramide. Hauteur : 8 mètres. Du centre de la base au milieu d’un bord : 6 mètres.
    - choix : Lina a dit qu’elle avait mesuré la pente : 10 mètres. · Lina a dit que j’avais mesuré la pente : 10 mètres. · Lina a dit qu’elle avait mesuré la pente : 14 mètres.
    - réponse : Lina a dit qu’elle avait mesuré la pente : 10 mètres.
    - indice : D’abord : 6 et 8, c’est quel triangle connu ? Puis : au discours indirect, que devient « je » ?
    - explication : La hauteur et le segment de la base font un angle droit : c’est le triangle 6-8-10, la pente mesure 10 m. 14, c’est 6 + 8 : on n’ajoute pas les côtés. Au discours indirect, « je » devient « elle » : Lina a dit qu’elle avait mesuré.
    - figure : triangle 6 · 8 · ?
    - aide « Le triangle 6-8-10, et le discours indirect » :
      - 6² + 8² = 36 + 64 = 100 = 10² : l’hypoténuse mesure 10.
      - Discours indirect : « je » devient « il » ou « elle ».
12. énoncé : "Les ouvriers ont posé le cylindre. Ce lourd bloc mesure 4 m de haut.\nUne échelle de 5 m s’appuie en haut du bloc."
    - question : À quelle distance du bloc est le pied de l’échelle ?
    - lu : Les ouvriers ont posé le cylindre. Ce lourd bloc mesure 4 mètres de haut. Une échelle de 5 mètres s’appuie en haut du bloc.
    - choix : « Ce lourd bloc » reprend le cylindre : le pied est à 3 mètres. · « Ce lourd bloc » parle d’un autre bloc : le pied est à 3 mètres. · « Ce lourd bloc » reprend le cylindre : le pied est à 1 mètres.
    - réponse : « Ce lourd bloc » reprend le cylindre : le pied est à 3 mètres.
    - indice : D’abord : 4 et 5, c’est quel triangle connu ? Puis : « ce lourd bloc », de quoi a-t-on déjà parlé ?
    - explication : L’échelle est l’hypoténuse du triangle 3-4-5 : le pied est à 3 m du bloc. 1, c’est 5 − 4 : on n’enlève pas les côtés. « Ce lourd bloc » reprend le cylindre, déjà nommé : le texte ne parle que d’un bloc.
    - figure : triangle ? · 4 · 5
    - aide « Le triangle 3-4-5, et la reprise » :
      - 3-4-5 : si l’hypoténuse mesure 5 et un côté 4, l’autre mesure 3.
      - Un groupe nominal avec « ce » reprend souvent un nom déjà écrit.

### Le relevé du château d’eau · `project-3e-water`

- compétences : c4.ma.b.image-antecedent · c4.ma.b.lineaire-affine · c4.hg.geographie.amenager · c4.hg.geographie.dynamiques-france · c4.hg.demarches.document · c4.hg.demarches.lexique
- consigne : Lis le document, calcule, puis choisis la phrase juste. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "La commune construit un château d’eau.\nVolume pompé en t heures, en mètres cubes : V(t) = 20 × t."
   - question : Quelle phrase est juste pour 3 heures ?
   - lu : La commune construit un château d’eau. Volume pompé en t heures, en mètres cubes : V de t égale 20 fois t.
   - choix : On pompe 60 mètres cubes ; c’est la commune qui aménage. · On pompe 23 mètres cubes ; c’est la commune qui aménage. · On pompe 60 mètres cubes ; c’est l’État qui aménage.
   - réponse : On pompe 60 mètres cubes ; c’est la commune qui aménage.
   - indice : D’abord : remplace t par 3. Puis : qui construit, dans le document ?
   - explication : V(3) = 20 × 3 = 60 mètres cubes. 23, c’est 20 + 3 : on multiplie par t, on ne l’ajoute pas. Le document dit que la commune construit : c’est elle qui aménage son territoire, pas l’État.
   - figure : tableau heures · mètres cubes / 1 · 20 / 3 · ?
   - aide « L’image, et qui aménage » :
     - V(3), l’image de 3 : on remplace t par 3.
     - Aménager : transformer un territoire pour mieux y vivre (la commune, la région, l’État).
2. énoncé : "Un village de montagne, de faible densité\nVolume pompé : V(t) = 10 × t. La cuve en tient 50 mètres cubes."
   - question : Quelle phrase est juste ?
   - lu : Un village de montagne, de faible densité. Volume pompé : V de t égale 10 fois t. La cuve en tient 50 mètres cubes.
   - choix : La cuve est pleine en 5 heures, dans un village peu peuplé. · La cuve est pleine en 500 heures, dans un village peu peuplé. · La cuve est pleine en 5 heures, dans un village très peuplé.
   - réponse : La cuve est pleine en 5 heures, dans un village peu peuplé.
   - indice : D’abord : quel nombre t donne 10 × t = 50 ? Puis : que veut dire faible densité ?
   - explication : On cherche l’antécédent de 50 : 10 × 5 = 50, donc 5 heures. 500, c’est 50 × 10 : on a multiplié au lieu de diviser. Faible densité : peu d’habitants pour beaucoup d’espace.
   - figure : tableau heures · mètres cubes / 1 · 10 / ? · 50
   - aide « L’antécédent, et la densité » :
     - Antécédent de 50 : le nombre t tel que 10 × t = 50.
     - Faible densité : peu d’habitants pour beaucoup d’espace.
3. énoncé : "À La Réunion, en outre-mer, une usine rend l’eau de mer potable.\nPrix pour x mètres cubes, en euros : f(x) = 2x + 30."
   - question : Quelle phrase est juste ?
   - lu : À La Réunion, en outre-mer, une usine rend l’eau de mer potable. Prix pour x mètres cubes, en euros : f de x égale 2 x plus 30.
   - choix : f est affine ; La Réunion est un territoire ultramarin. · f est linéaire ; La Réunion est un territoire ultramarin. · f est affine ; La Réunion est en France métropolitaine.
   - réponse : f est affine ; La Réunion est un territoire ultramarin.
   - indice : D’abord : y a-t-il un nombre ajouté après 2x ? Puis : où est La Réunion, dans le document ?
   - explication : f(x) = 2x + 30 a un nombre ajouté, 30 : elle est affine, pas linéaire. Une fonction linéaire s’écrit a × x, sans rien ajouter. Le document dit « en outre-mer » : La Réunion est un territoire ultramarin, loin de la France métropolitaine.
   - aide « Affine, et l’outre-mer » :
     - Linéaire : f(x) = a × x. Affine : f(x) = a × x + b.
     - Ultramarin : qui est en outre-mer, loin de l’Europe.
4. énoncé : "Une route neuve relie une vallée isolée à la ville.\nUn camion-citerne y livre V(n) = 4 × n mètres cubes en n voyages."
   - question : Quelle phrase est juste pour 5 voyages ?
   - lu : Une route neuve relie une vallée isolée à la ville. Un camion-citerne y livre V de n égale 4 fois n mètres cubes en n voyages.
   - choix : 20 mètres cubes livrés : la route désenclave la vallée. · 9 mètres cubes livrés : la route désenclave la vallée. · 20 mètres cubes livrés : la route enclave la vallée.
   - réponse : 20 mètres cubes livrés : la route désenclave la vallée.
   - indice : D’abord : remplace n par 5. Puis : la route isole-t-elle la vallée, ou la relie-t-elle ?
   - explication : V(5) = 4 × 5 = 20 mètres cubes. 9, c’est 4 + 5 : on multiplie par n, on ne l’ajoute pas. Une vallée isolée est enclavée ; la route la relie à la ville : elle la désenclave. Dé- dit le contraire.
   - figure : tableau voyages · mètres cubes / 1 · 4 / 5 · ?
   - aide « L’image, et désenclaver » :
     - V(5), l’image de 5 : on remplace n par 5.
     - Enclavé : isolé. Désenclaver : relier au reste du pays.
5. énoncé : "Un canal d’irrigation arrose les champs de maïs.\nIl apporte V(t) = 6 × t mètres cubes en t heures ; un champ en demande 30."
   - question : Quelle phrase est juste ?
   - lu : Un canal d’irrigation arrose les champs de maïs. Il apporte V de t égale 6 fois t mètres cubes en t heures ; un champ en demande 30.
   - choix : Il faut 5 heures ; l’agriculture est du secteur primaire. · Il faut 180 heures ; l’agriculture est du secteur primaire. · Il faut 5 heures ; l’agriculture est du secteur secondaire.
   - réponse : Il faut 5 heures ; l’agriculture est du secteur primaire.
   - indice : D’abord : quel nombre t donne 6 × t = 30 ? Puis : l’agriculture, l’industrie, les services : quel secteur est le premier ?
   - explication : On cherche l’antécédent de 30 : 6 × 5 = 30, donc 5 heures. 180, c’est 30 × 6 : on a multiplié au lieu de diviser. Le champ est un espace productif agricole : l’agriculture est le secteur primaire ; l’industrie, le secondaire.
   - figure : tableau heures · mètres cubes / 1 · 6 / ? · 30
   - aide « L’antécédent, et les secteurs » :
     - Antécédent de 30 : le nombre t tel que 6 × t = 30.
     - Primaire : l’agriculture ; secondaire : l’industrie ; tertiaire : les services.
6. énoncé : "Une aire urbaine : une ville, ses banlieues et ses communes périurbaines.\nSon usine d’eau envoie f(t) = 7 × t mètres cubes en t secondes."
   - question : Quelle phrase est juste pour 3 secondes ?
   - lu : Une aire urbaine : une ville, ses banlieues et ses communes périurbaines. Son usine d’eau envoie f de t égale 7 fois t mètres cubes en t secondes.
   - choix : 21 mètres cubes, pour la ville, ses banlieues et ses communes périurbaines. · 10 mètres cubes, pour la ville, ses banlieues et ses communes périurbaines. · 21 mètres cubes, pour la ville centre seule.
   - réponse : 21 mètres cubes, pour la ville, ses banlieues et ses communes périurbaines.
   - indice : D’abord : remplace t par 3. Puis : une aire urbaine, est-ce seulement la ville centre ?
   - explication : f(3) = 7 × 3 = 21 mètres cubes. 10, c’est 7 + 3 : on multiplie par t, on ne l’ajoute pas. Le document le dit : l’aire urbaine, c’est la ville, ses banlieues et ses communes périurbaines, pas la ville centre seule.
   - figure : tableau secondes · mètres cubes / 1 · 7 / 3 · ?
   - aide « L’image, et l’aire urbaine » :
     - f(3), l’image de 3 : on remplace t par 3.
     - Aire urbaine : une ville, ses banlieues et ses communes périurbaines.
7. énoncé : "Le château d’eau du bourg est payé par la commune et par l’Union européenne.\nIl se remplit de 8 mètres cubes chaque heure."
   - question : Quelle phrase est juste ?
   - lu : Le château d’eau du bourg est payé par la commune et par l’Union européenne. Il se remplit de 8 mètres cubes chaque heure.
   - choix : En x heures, f(x) = 8x ; deux acteurs paient le château d’eau. · En x heures, f(x) = x + 8 ; deux acteurs paient le château d’eau. · En x heures, f(x) = 8x ; seule la commune paie le château d’eau.
   - réponse : En x heures, f(x) = 8x ; deux acteurs paient le château d’eau.
   - indice : D’abord : chaque heure ajoute 8 : en x heures, combien de fois 8 ? Puis : qui paie, dans le document ?
   - explication : 8 mètres cubes chaque heure : en x heures, 8 fois x, f(x) = 8x, une fonction linéaire. x + 8 n’ajouterait que 8 en tout. Le document nomme deux acteurs : la commune et l’Union européenne.
   - aide « La fonction linéaire, et les acteurs » :
     - Autant chaque heure : le volume est proportionnel au temps, f(x) = a × x.
     - Qui aménage ? La commune, le département, la région, l’État, l’Union européenne.
8. énoncé : "Commune A : l’eau coule au robinet. Commune B : des coupures chaque semaine.\nLa commune B achète f(x) = 5x mètres cubes d’eau pour x citernes."
   - question : Quelle phrase est juste pour 4 citernes ?
   - lu : Commune A : l’eau coule au robinet. Commune B : des coupures chaque semaine. La commune B achète f de x égale 5 x mètres cubes d’eau pour x citernes.
   - choix : 20 mètres cubes ; il y a des inégalités entre les deux communes. · 9 mètres cubes ; il y a des inégalités entre les deux communes. · 20 mètres cubes ; les deux communes ont le même accès à l’eau.
   - réponse : 20 mètres cubes ; il y a des inégalités entre les deux communes.
   - indice : D’abord : remplace x par 4. Puis : les deux communes ont-elles l’eau de la même façon ?
   - explication : f(4) = 5 × 4 = 20 mètres cubes. 9, c’est 5 + 4 : on multiplie par x, on ne l’ajoute pas. La commune A a l’eau au robinet, la B des coupures : c’est un écart entre territoires, une inégalité.
   - figure : tableau citernes · mètres cubes / 1 · 5 / 4 · ?
   - aide « L’image, et les inégalités » :
     - f(4), l’image de 4 : on remplace x par 4.
     - Inégalités : des écarts entre les territoires, de richesse ou de services.
9. énoncé : "Toulouse, une métropole, attire chaque année de nouveaux habitants.\nUne de ses usines nettoie f(t) = 2 × t mètres cubes d’eau en t secondes."
   - question : Quelle phrase est juste ?
   - lu : Toulouse, une métropole, attire chaque année de nouveaux habitants. Une de ses usines nettoie f de t égale 2 fois t mètres cubes d’eau en t secondes.
   - choix : Pour 16 mètres cubes, il faut 8 secondes ; Toulouse attire des habitants. · Pour 16 mètres cubes, il faut 32 secondes ; Toulouse attire des habitants. · Pour 16 mètres cubes, il faut 8 secondes ; Toulouse perd des habitants.
   - réponse : Pour 16 mètres cubes, il faut 8 secondes ; Toulouse attire des habitants.
   - indice : D’abord : quel nombre t donne 2 × t = 16 ? Puis : que dit le document des habitants ?
   - explication : On cherche l’antécédent de 16 : 2 × 8 = 16, donc 8 secondes. 32, c’est 16 × 2 : on a multiplié au lieu de diviser. Le document dit que Toulouse attire de nouveaux habitants : une métropole attire.
   - figure : tableau secondes · mètres cubes / 1 · 2 / ? · 16
   - aide « L’antécédent, et la métropole » :
     - Antécédent de 16 : le nombre t tel que 2 × t = 16.
     - Métropole : une grande ville qui attire et commande une région.
10. énoncé : "Une usine d’eau en bouteille, dans les Vosges\nElle remplit f(x) = 6x bouteilles en x secondes."
    - question : Quelle phrase est juste pour 5 secondes ?
    - lu : Une usine d’eau en bouteille, dans les Vosges. Elle remplit f de x égale 6 x bouteilles en x secondes.
    - choix : 30 bouteilles ; l’usine est un espace productif du secteur secondaire. · 11 bouteilles ; l’usine est un espace productif du secteur secondaire. · 30 bouteilles ; l’usine est un espace productif du secteur primaire.
    - réponse : 30 bouteilles ; l’usine est un espace productif du secteur secondaire.
    - indice : D’abord : remplace x par 5. Puis : une usine, c’est l’agriculture ou l’industrie ?
    - explication : f(5) = 6 × 5 = 30 bouteilles. 11, c’est 6 + 5 : on multiplie par x, on ne l’ajoute pas. Une usine fabrique : c’est l’industrie, le secteur secondaire ; le primaire, c’est l’agriculture.
    - figure : tableau secondes · bouteilles / 1 · 6 / 5 · ?
    - aide « L’image, et les secteurs » :
      - f(5), l’image de 5 : on remplace x par 5.
      - Primaire : l’agriculture ; secondaire : l’industrie ; tertiaire : les services.
11. énoncé : "Une ville moyenne change ses tuyaux, avec l’aide de l’État.\nEau qui arrive : 1 heure, 4 mètres cubes ; 2 heures, 8 ; 3 heures, 12."
    - question : Quelle phrase est juste ?
    - lu : Une ville moyenne change ses tuyaux, avec l’aide de l’État. Eau qui arrive : 1 heure, 4 mètres cubes ; 2 heures, 8 ; 3 heures, 12.
    - choix : f est linéaire, car le volume est proportionnel au temps ; l’État aide. · f n’est pas linéaire, car le volume change chaque heure ; l’État aide. · f est linéaire, car le volume est proportionnel au temps ; la ville aménage seule.
    - réponse : f est linéaire, car le volume est proportionnel au temps ; l’État aide.
    - indice : D’abord : 4, 8, 12, c’est toujours combien de fois le nombre d’heures ? Puis : la ville est-elle seule, dans le document ?
    - explication : 4, 8, 12 : toujours 4 fois le nombre d’heures. Le volume est proportionnel au temps : f(x) = 4x, une fonction linéaire. Qu’il change chaque heure ne l’empêche pas : il change toujours de la même façon. Le document dit que l’État aide la ville : elle n’aménage pas seule.
    - figure : tableau heures · mètres cubes / 1 · 4 / 2 · 8 / 3 · 12
    - aide « Le tableau, et les acteurs » :
      - Proportionnel : on multiplie toujours par le même nombre, f(x) = a × x.
      - Qui aménage ? La commune, le département, la région, l’État, l’Union européenne.
12. énoncé : "Une ville du littoral attire de nombreux touristes l’été.\nSon château d’eau livre f(x) = 9x mètres cubes en x minutes."
    - question : Quelle phrase est juste pour 45 mètres cubes ?
    - lu : Une ville du littoral attire de nombreux touristes l’été. Son château d’eau livre f de x égale 9 x mètres cubes en x minutes.
    - choix : Il faut 5 minutes ; le tourisme fait vivre ce littoral. · Il faut 36 minutes ; le tourisme fait vivre ce littoral. · Il faut 5 minutes ; l’industrie fait vivre ce littoral.
    - réponse : Il faut 5 minutes ; le tourisme fait vivre ce littoral.
    - indice : D’abord : quel nombre x donne 9 × x = 45 ? Puis : qui vient l’été, dans le document ?
    - explication : On cherche l’antécédent de 45 : 9 × 5 = 45, donc 5 minutes. 36, c’est 45 − 9 : on a enlevé au lieu de diviser. Le document parle de touristes : le tourisme est un service, il fait vivre ce littoral.
    - figure : tableau minutes · mètres cubes / 1 · 9 / ? · 45
    - aide « L’antécédent, et le littoral » :
      - Antécédent de 45 : le nombre x tel que 9 × x = 45.
      - Un espace productif : un lieu où l’on produit, champ, usine, ou plage pour le tourisme.

### Le carnet de vol · `project-3e-rocket`

- compétences : c4.en.lire.informations · c4.en.langue.phrase-complexe · c4.pc.mouvement.decrire · c4.pc.mouvement.forces · c4.pc.energie.formes
- langue : en
- consigne : Lis l’énoncé en anglais, puis choisis la phrase juste. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "Launch day\nThe rocket goes faster and faster."
   - question : Quelle phrase est juste ?
   - lu : Launch day. The rocket goes faster and faster.
   - choix : Its speed goes up, so its motion is accelerated. · Its speed goes up, but its motion is accelerated. · Its speed goes up, so its motion is uniform.
   - réponse : Its speed goes up, so its motion is accelerated.
   - indice : D’abord : la vitesse augmente-t-elle ? Puis : est-ce une conséquence, ou une opposition ?
   - explication : faster and faster, de plus en plus vite : la vitesse augmente, le mouvement est accéléré (accelerated) ; uniforme (uniform), elle ne changerait pas. C’est une conséquence : so, donc ; but, mais, dirait une opposition.
   - aide « So, et le mouvement accéléré » :
     - so = donc (la conséquence) ; but = mais (l’opposition)
     - accelerated = accéléré, la vitesse augmente ; uniform = uniforme, elle ne change pas
2. énoncé : "On the Moon\nThe astronaut’s mass is 80 kg (kilograms). Her weight is 6 times smaller than on Earth."
   - question : Quelle phrase est juste ?
   - lu : On the Moon. The astronaut’s mass is eighty kilograms. Her weight is six times smaller than on Earth.
   - choix : Her weight is smaller, but her mass is still 80 kilograms. · Her weight is smaller, because her mass is still 80 kilograms. · Her weight is smaller, so her mass is smaller too.
   - réponse : Her weight is smaller, but her mass is still 80 kilograms.
   - indice : D’abord : sur la Lune, la masse change-t-elle ? Puis : le poids plus petit et la masse qui reste, est-ce une cause, ou une opposition ?
   - explication : La masse est la même partout : 80 kilogrammes, sur la Lune aussi. Seul le poids change. Les deux idées s’opposent : but, mais. because, parce que, ferait de la masse la cause du poids plus petit.
   - aide « But, et la masse » :
     - but = mais (l’opposition) ; because = parce que (la cause)
     - mass = la masse, la même partout ; weight = le poids, plus petit sur la Lune
3. énoncé : "The rocket waits on the launch pad.\nIt does not move compared to the ground."
   - question : Quelle phrase est juste ?
   - lu : The rocket waits on the launch pad. It does not move compared to the ground.
   - choix : Although it seems still, it moves with the Earth around the Sun. · Despite it seems still, it moves with the Earth around the Sun. · Although it seems still, it does not move compared to the Sun.
   - réponse : Although it seems still, it moves with the Earth around the Sun.
   - indice : D’abord : la Terre tourne-t-elle autour du Soleil ? Puis : après despite, une phrase ou un nom ?
   - explication : La fusée est immobile par rapport au sol, mais la Terre tourne autour du Soleil : par rapport au Soleil, la fusée bouge avec elle. Devant une phrase (it seems still), on met although ; despite va devant un nom (despite the wind).
   - aide « Although, et le point de vue » :
     - although = bien que (+ phrase) ; despite = malgré (+ nom)
     - Un mouvement se décrit par rapport à un objet : le sol, ou le Soleil.
4. énoncé : "First, the rocket climbs 30 km (kilometres) in 2 minutes.\nThen, it turns towards the east."
   - question : Quelle phrase est juste ?
   - lu : First, the rocket climbs thirty kilometres in two minutes. Then, it turns towards the east.
   - choix : First, it climbs at 15 kilometres per minute; then, it turns. · First, it climbs at 60 kilometres per minute; then, it turns. · Finally, it climbs at 15 kilometres per minute; first, it turns.
   - réponse : First, it climbs at 15 kilometres per minute; then, it turns.
   - indice : D’abord : partage 30 kilomètres en 2 minutes. Puis : qu’est-ce qui vient en premier ?
   - explication : La vitesse, c’est la distance divisée par la durée : 30 ÷ 2 = 15 kilomètres par minute. 60, c’est 30 × 2 : on a multiplié au lieu de diviser. Le document dit first, d’abord, la montée ; then, ensuite, le virage.
   - aide « First, then, et la vitesse » :
     - first = d’abord ; then = ensuite ; finally = enfin
     - Vitesse = distance ÷ durée.
5. énoncé : "The satellite turns around the Earth.\nThe Earth pulls it all the time."
   - question : Quelle phrase est juste ?
   - lu : The satellite turns around the Earth. The Earth pulls it all the time.
   - choix : It turns around the Earth because the Earth attracts it. · It turns around the Earth, so the Earth attracts it. · It turns around the Earth because the Earth pushes it away.
   - réponse : It turns around the Earth because the Earth attracts it.
   - indice : D’abord : la Terre attire-t-elle, ou repousse-t-elle ? Puis : l’attraction est-elle la cause, ou la conséquence ?
   - explication : pulls, tire : la Terre attire le satellite, c’est la gravitation ; elle ne le repousse pas. C’est cette attraction qui le fait tourner : la cause, because. so, donc, ferait de l’attraction une conséquence.
   - aide « Because, et la gravitation » :
     - because = parce que (la cause) ; so = donc (la conséquence)
     - pull = tirer, attirer ; la Terre attire tout ce qui a une masse.
6. énoncé : "Day 2 in orbit\nThe space station goes round and round the Earth."
   - question : Quelle phrase est juste ?
   - lu : Day two in orbit. The space station goes round and round the Earth.
   - choix : When it goes round the Earth, its path is a circle. · Unless it goes round the Earth, its path is a circle. · When it goes round the Earth, its path is a straight line.
   - réponse : When it goes round the Earth, its path is a circle.
   - indice : D’abord : faire le tour de la Terre, quelle trajectoire ? Puis : when, ou unless ?
   - explication : goes round and round, elle tourne autour : sa trajectoire est circulaire, un cercle ; une ligne droite, ce serait rectiligne. when, quand, dit le moment ; unless, à moins que, dirait le contraire.
   - aide « When, et la trajectoire » :
     - when = quand ; unless = à moins que
     - path = la trajectoire ; a circle = un cercle ; a straight line = une ligne droite
7. énoncé : "A box of tools on Earth\nMass: 5 kg (kilograms). Weight in newtons: about 10 times the mass."
   - question : Quelle phrase est juste ?
   - lu : A box of tools on Earth. Mass: five kilograms. Weight in newtons: about ten times the mass.
   - choix : Its mass is 5 kilograms, so its weight is about 50 newtons. · Its mass is 5 kilograms, unless its weight is about 50 newtons. · Its mass is 5 kilograms, so its weight is about 15 newtons.
   - réponse : Its mass is 5 kilograms, so its weight is about 50 newtons.
   - indice : D’abord : 10 fois 5 ? Puis : le poids vient-il de la masse ?
   - explication : 10 fois la masse : 10 × 5 = 50 newtons. 15, c’est 10 + 5 : on a ajouté au lieu de multiplier. Le poids vient de la masse : c’est une conséquence, so ; unless, à moins que, n’a pas de sens ici.
   - aide « So, et le poids » :
     - so = donc (la conséquence) ; unless = à moins que
     - Sur la Terre, le poids en newtons vaut environ 10 fois la masse en kilogrammes.
8. énoncé : "Back to Earth\nThe capsule slows down with its parachutes."
   - question : Quelle phrase est juste ?
   - lu : Back to Earth. The capsule slows down with its parachutes.
   - choix : Because it slows down, its kinetic energy goes down. · Although it slows down, its kinetic energy goes down. · Because it slows down, its kinetic energy goes up.
   - réponse : Because it slows down, its kinetic energy goes down.
   - indice : D’abord : moins de vitesse, plus ou moins d’énergie cinétique ? Puis : est-ce une cause, ou une opposition ?
   - explication : slows down, ralentit : moins de vitesse, donc moins d’énergie cinétique (kinetic energy), l’énergie du mouvement. Le ralentissement est la cause : because ; although, bien que, dirait une opposition qui n’existe pas.
   - aide « Because, et l’énergie cinétique » :
     - because = parce que (la cause) ; although = bien que (l’opposition)
     - kinetic energy = l’énergie cinétique : plus on va vite, plus elle est grande.
9. énoncé : "The engines push the rocket up for 3 minutes.\nAfter that, they stop."
   - question : Quelle phrase est juste ?
   - lu : The engines push the rocket up for three minutes. After that, they stop.
   - choix : The rocket speeds up until the engines stop. · The rocket speeds up unless the engines stop. · The rocket slows down until the engines stop.
   - réponse : The rocket speeds up until the engines stop.
   - indice : D’abord : une force qui pousse vers le haut, accélère-t-elle la fusée ? Puis : until, ou unless ?
   - explication : Les moteurs poussent dans le sens du mouvement : la fusée accélère, speeds up ; elle ne ralentit pas. Elle accélère jusqu’à ce que les moteurs s’arrêtent : until ; unless veut dire à moins que.
   - aide « Until, et la poussée » :
     - until = jusqu’à ce que ; unless = à moins que
     - Une force qui pousse dans le sens du mouvement fait accélérer.
10. énoncé : "July 1969: Neil Armstrong walks on the Moon.\nHe jumps much higher than on Earth."
    - question : Quelle phrase est juste ?
    - lu : July nineteen sixty-nine: Neil Armstrong walks on the Moon. He jumps much higher than on Earth.
    - choix : He jumped high because his weight was smaller. · He jumped high although his weight was smaller. · He jumped high because his mass was smaller.
    - réponse : He jumped high because his weight was smaller.
    - indice : D’abord : sur la Lune, qu’est-ce qui diminue, la masse ou le poids ? Puis : est-ce la cause du saut ?
    - explication : Sur la Lune, la masse reste la même ; c’est le poids qui est plus petit, et Armstrong saute plus haut. C’en est la cause : because ; although, bien que, dirait une opposition.
    - aide « Because, et le poids sur la Lune » :
      - because = parce que (la cause) ; although = bien que (l’opposition)
      - weight = le poids, plus petit sur la Lune ; mass = la masse, la même partout
11. énoncé : "The rocket is very heavy: 500 tonnes.\nIts engines lift it all the same."
    - question : Quelle phrase est juste ?
    - lu : The rocket is very heavy: five hundred tonnes. Its engines lift it all the same.
    - choix : Despite its weight, the engines lift it: their push is stronger. · Although its weight, the engines lift it: their push is stronger. · Despite its weight, the engines lift it: their push is weaker.
    - réponse : Despite its weight, the engines lift it: their push is stronger.
    - indice : D’abord : pour soulever la fusée, la poussée est-elle plus forte que le poids ? Puis : devant un nom, although ou despite ?
    - explication : La fusée monte : la poussée des moteurs est plus forte que son poids. Devant un nom (its weight), on met despite, malgré ; although va devant une phrase (although it is heavy).
    - aide « Despite, et la poussée » :
      - despite = malgré (+ nom) ; although = bien que (+ phrase)
      - Pour monter, la poussée doit être plus forte que le poids.
12. énoncé : "First, stage one burns all its fuel.\nThen, it falls back into the sea."
    - question : Quelle phrase est juste ?
    - lu : First, stage one burns all its fuel. Then, it falls back into the sea.
    - choix : It falls back because its weight pulls it down. · It falls back although its weight pulls it down. · It falls back because its weight pushes it up.
    - réponse : It falls back because its weight pulls it down.
    - indice : D’abord : le poids est-il dirigé vers le haut, ou vers le bas ? Puis : est-ce la cause de la chute ?
    - explication : Le poids est la force d’attraction de la Terre, vers son centre : il tire l’étage vers le bas, et l’étage retombe. C’est la cause : because ; although, bien que, dirait une opposition.
    - aide « Because, et le poids » :
      - because = parce que (la cause) ; although = bien que (l’opposition)
      - Le poids : l’attraction de la Terre, vers son centre, donc vers le bas.

### La course à l’espace · `project-3e-space`

- compétences : c4.hg.histoire.monde-depuis-1945 · c4.hg.temps.reperes · c4.hg.temps.ordonner · c4.hg.demarches.document · c4.hg.demarches.lexique · c4.pc.mouvement.decrire · c4.pc.mouvement.forces · c4.pc.energie.formes
- consigne : Lis le document, puis choisis la phrase juste. Le rappel est affiché.
- bravo : Bien construit !
- erreur : {explanation}

1. énoncé : "4 octobre 1957 : l’Union soviétique lance Spoutnik, le premier satellite.\nIl tourne autour de la Terre."
   - question : Quelle phrase est juste ?
   - lu : 4 octobre 1957 : l’Union soviétique lance Spoutnik, le premier satellite. Il tourne autour de la Terre.
   - choix : Spoutnik, lancé par l’Union soviétique, a un mouvement circulaire. · Spoutnik, lancé par les États-Unis, a un mouvement circulaire. · Spoutnik, lancé par l’Union soviétique, a un mouvement rectiligne.
   - réponse : Spoutnik, lancé par l’Union soviétique, a un mouvement circulaire.
   - indice : D’abord : quel pays lance Spoutnik, dans le document ? Puis : tourner autour de la Terre, quelle trajectoire ?
   - explication : Le document dit que c’est l’Union soviétique, le camp de l’Est : les États-Unis, le camp de l’Ouest, lancent leur premier satellite après. Spoutnik tourne autour de la Terre : sa trajectoire est un cercle, son mouvement est circulaire ; rectiligne, ce serait une ligne droite.
   - aide « La guerre froide, et la trajectoire » :
     - Guerre froide : l’Union soviétique (camp de l’Est) et les États-Unis (camp de l’Ouest) s’affrontent, jusque dans l’espace.
     - Circulaire : un cercle ; rectiligne : une ligne droite.
2. énoncé : "12 avril 1961 : le Soviétique Youri Gagarine fait le tour de la Terre.\nIl est le premier humain dans l’espace."
   - question : Quelle phrase est juste ?
   - lu : 12 avril 1961 : le Soviétique Youri Gagarine fait le tour de la Terre. Il est le premier humain dans l’espace.
   - choix : Gagarine, un Soviétique, garde la même masse dans l’espace. · Gagarine, un Américain, garde la même masse dans l’espace. · Gagarine, un Soviétique, perd toute sa masse dans l’espace.
   - réponse : Gagarine, un Soviétique, garde la même masse dans l’espace.
   - indice : D’abord : de quel pays est Gagarine, dans le document ? Puis : la masse change-t-elle d’un endroit à l’autre ?
   - explication : Le document dit que Gagarine est soviétique, du camp de l’Est. Sa masse, en kilogrammes, est la même partout, dans l’espace aussi : c’est la même matière. C’est son poids qui change.
   - aide « Le camp de l’Est, et la masse » :
     - Soviétique : de l’Union soviétique, le camp de l’Est.
     - La masse est la même partout ; le poids change d’un astre à l’autre.
3. énoncé : "21 juillet 1969 : l’Américain Neil Armstrong marche sur la Lune.\nIl y saute bien plus haut que sur la Terre."
   - question : Quelle phrase est juste ?
   - lu : 21 juillet 1969 : l’Américain Neil Armstrong marche sur la Lune. Il y saute bien plus haut que sur la Terre.
   - choix : Sur la Lune, l’Américain garde sa masse, mais son poids est plus petit. · Sur la Lune, le Soviétique garde sa masse, mais son poids est plus petit. · Sur la Lune, l’Américain garde son poids, mais sa masse est plus petite.
   - réponse : Sur la Lune, l’Américain garde sa masse, mais son poids est plus petit.
   - indice : D’abord : de quel pays est Armstrong, dans le document ? Puis : sur la Lune, qu’est-ce qui change, la masse ou le poids ?
   - explication : Le document dit qu’Armstrong est américain, du camp de l’Ouest. Sur la Lune, sa masse ne change pas ; son poids, l’attraction de la Lune, est environ 6 fois plus petit : il saute plus haut.
   - aide « Le camp de l’Ouest, et le poids » :
     - Les États-Unis et leurs alliés : le camp de l’Ouest.
     - La masse est la même partout ; sur la Lune, le poids est environ 6 fois plus petit.
4. énoncé : "1957 : Spoutnik. 1961 : Gagarine. 1969 : des humains sur la Lune.\nPendant le décollage, la fusée va de plus en plus vite."
   - question : Quelle phrase est juste ?
   - lu : 1957 : Spoutnik. 1961 : Gagarine. 1969 : des humains sur la Lune. Pendant le décollage, la fusée va de plus en plus vite.
   - choix : Au XXe siècle, la fusée a un mouvement accéléré. · Au XIXe siècle, la fusée a un mouvement accéléré. · Au XXe siècle, la fusée a un mouvement uniforme.
   - réponse : Au XXe siècle, la fusée a un mouvement accéléré.
   - indice : D’abord : range les années avec le rappel. Puis : la vitesse augmente-t-elle ?
   - explication : 1957, 1961 et 1969 sont entre 1901 et 2000 : c’est le XXe siècle, le vingtième. Le XIXe siècle, le dix-neuvième, va de 1801 à 1900 : le siècle ne se lit pas dans les deux premiers chiffres. De plus en plus vite : la vitesse augmente, le mouvement est accéléré.
   - aide « Le siècle, et le mouvement accéléré » :
     - XIXe siècle : de 1801 à 1900. XXe siècle : de 1901 à 2000.
     - Accéléré : la vitesse augmente ; uniforme : elle ne change pas.
5. énoncé : "1969 : des Américains marchent sur la Lune.\n1957 : les Soviétiques lancent le premier satellite."
   - question : Quelle phrase est juste ?
   - lu : 1969 : des Américains marchent sur la Lune. 1957 : les Soviétiques lancent le premier satellite.
   - choix : Le satellite vient en premier ; la Lune aussi attire les astronautes. · Les pas sur la Lune viennent en premier ; la Lune aussi attire les astronautes. · Le satellite vient en premier ; sur la Lune, rien n’attire les astronautes.
   - réponse : Le satellite vient en premier ; la Lune aussi attire les astronautes.
   - indice : D’abord : quelle année est la plus petite ? Puis : la Lune a-t-elle une masse ?
   - explication : 1957 vient avant 1969 : le satellite vient en premier, même s’il est écrit en second. La Lune a une masse : elle attire les astronautes, moins fort que la Terre ; c’est pour cela qu’ils retombent après un saut.
   - aide « Ordonner, et la gravitation » :
     - Pour ordonner, compare les années : la plus petite vient d’abord.
     - Gravitation : deux objets qui ont une masse s’attirent, la Lune aussi.
6. énoncé : "26 novembre 1965 : la fusée française Diamant lance le satellite Astérix.\nLa France est le troisième pays à le faire, après l’Union soviétique et les États-Unis."
   - question : Quelle phrase est juste ?
   - lu : 26 novembre 1965 : la fusée française Diamant lance le satellite Astérix. La France est le troisième pays à le faire, après l’Union soviétique et les États-Unis.
   - choix : La France est le troisième pays dans l’espace ; le poids de Diamant est vers le bas. · La France est le premier pays dans l’espace ; le poids de Diamant est vers le bas. · La France est le troisième pays dans l’espace ; le poids de Diamant est vers le haut.
   - réponse : La France est le troisième pays dans l’espace ; le poids de Diamant est vers le bas.
   - indice : D’abord : combien de pays avant la France, dans le document ? Puis : vers où la Terre attire-t-elle la fusée ?
   - explication : Le document nomme deux pays avant la France : elle est la troisième. Le poids est l’attraction de la Terre, vers son centre : il tire la fusée vers le bas ; ce sont les moteurs qui la poussent vers le haut.
   - aide « Ordonner, et le poids » :
     - Après deux pays, on est le troisième.
     - Le poids : la force d’attraction de la planète, vers son centre.
7. énoncé : "1962 : un vaisseau soviétique tourne autour de la Terre.\nEn 2 heures, il parcourt 56 000 km (kilomètres)."
   - question : Quelle phrase est juste ?
   - lu : 1962 : un vaisseau soviétique tourne autour de la Terre. En 2 heures, il parcourt 56 000 kilomètres.
   - choix : Un vaisseau du camp de l’Est, à 28 000 kilomètres par heure. · Un vaisseau du camp de l’Ouest, à 28 000 kilomètres par heure. · Un vaisseau du camp de l’Est, à 112 000 kilomètres par heure.
   - réponse : Un vaisseau du camp de l’Est, à 28 000 kilomètres par heure.
   - indice : D’abord : partage 56 000 kilomètres en 2 heures. Puis : soviétique, c’est quel camp ?
   - explication : La vitesse, c’est la distance divisée par la durée : 56 000 ÷ 2 = 28 000 kilomètres par heure. 112 000, c’est 56 000 × 2 : on a multiplié au lieu de diviser. Soviétique : de l’Union soviétique, le camp de l’Est.
   - aide « La vitesse, et les deux camps » :
     - Vitesse = distance ÷ durée.
     - Camp de l’Est : l’Union soviétique ; camp de l’Ouest : les États-Unis.
8. énoncé : "24 juillet 1969 : la capsule d’Apollo 11 ramène les Américains de la Lune.\nDes parachutes la ralentissent avant l’océan."
   - question : Quelle phrase est juste ?
   - lu : 24 juillet 1969 : la capsule d’Apollo 11 ramène les Américains de la Lune. Des parachutes la ralentissent avant l’océan.
   - choix : Les Américains rentrent ; la capsule ralentit, son énergie cinétique diminue. · Les Soviétiques rentrent ; la capsule ralentit, son énergie cinétique diminue. · Les Américains rentrent ; la capsule ralentit, son énergie cinétique augmente.
   - réponse : Les Américains rentrent ; la capsule ralentit, son énergie cinétique diminue.
   - indice : D’abord : qui revient de la Lune, dans le document ? Puis : moins vite, plus ou moins d’énergie cinétique ?
   - explication : Le document dit que la capsule ramène les Américains. L’énergie cinétique est celle du mouvement : plus on va vite, plus elle est grande ; la capsule ralentit, elle diminue.
   - aide « Apollo 11, et l’énergie cinétique » :
     - Apollo 11 : la mission des États-Unis qui pose des humains sur la Lune.
     - Cinétique : l’énergie d’un objet qui bouge. Plus il va vite, plus elle est grande.
9. énoncé : "3 novembre 1957 : un satellite soviétique emporte la chienne Laïka.\nElle est attachée dans sa capsule, qui tourne autour de la Terre."
   - question : Quelle phrase est juste ?
   - lu : 3 novembre 1957 : un satellite soviétique emporte la chienne Laïka. Elle est attachée dans sa capsule, qui tourne autour de la Terre.
   - choix : Dans ce satellite soviétique, Laïka est immobile par rapport à sa capsule. · Dans ce satellite américain, Laïka est immobile par rapport à sa capsule. · Dans ce satellite soviétique, Laïka est immobile par rapport à la Terre.
   - réponse : Dans ce satellite soviétique, Laïka est immobile par rapport à sa capsule.
   - indice : D’abord : de quel pays est le satellite, dans le document ? Puis : Laïka bouge-t-elle dans sa capsule ? et autour de la Terre ?
   - explication : Le document dit que le satellite est soviétique. Attachée, Laïka ne bouge pas par rapport à sa capsule ; mais la capsule tourne autour de la Terre : par rapport à la Terre, Laïka est en mouvement.
   - aide « Le document, et le point de vue » :
     - La première ligne dit la date et le pays.
     - Un mouvement se décrit par rapport à un objet : la capsule, ou la Terre.
10. énoncé : "16 juin 1963 : la Soviétique Valentina Terechkova part dans l’espace.\nC’est la première femme dans l’espace."
    - question : Quelle phrase est juste ?
    - lu : 16 juin 1963 : la Soviétique Valentina Terechkova part dans l’espace. C’est la première femme dans l’espace.
    - choix : Terechkova est soviétique ; le carburant de sa fusée stocke de l’énergie chimique. · Terechkova est américaine ; le carburant de sa fusée stocke de l’énergie chimique. · Terechkova est soviétique ; le carburant de sa fusée stocke de l’énergie lumineuse.
    - réponse : Terechkova est soviétique ; le carburant de sa fusée stocke de l’énergie chimique.
    - indice : D’abord : de quel pays est Terechkova, dans le document ? Puis : un carburant qui brûle, quelle énergie libère-t-il ?
    - explication : Le document dit que Terechkova est soviétique. Le carburant stocke de l’énergie chimique : en brûlant, il la convertit en énergie cinétique et thermique ; l’énergie lumineuse, c’est celle de la lumière.
    - aide « Le document, et les formes d’énergie » :
      - Soviétique : de l’Union soviétique ; américaine : des États-Unis.
      - Formes d’énergie : cinétique, de position, thermique, électrique, chimique, lumineuse.
11. énoncé : "1986 : l’Union soviétique lance la station spatiale Mir.\nElle tourne autour de la Terre sans changer de vitesse."
    - question : Quelle phrase est juste ?
    - lu : 1986 : l’Union soviétique lance la station spatiale Mir. Elle tourne autour de la Terre sans changer de vitesse.
    - choix : Mir est lancée pendant la guerre froide ; son mouvement est uniforme. · Mir est lancée après la guerre froide ; son mouvement est uniforme. · Mir est lancée pendant la guerre froide ; son mouvement est accéléré.
    - réponse : Mir est lancée pendant la guerre froide ; son mouvement est uniforme.
    - indice : D’abord : 1986 est-il entre 1947 et 1991 ? Puis : la vitesse change-t-elle ?
    - explication : La guerre froide va de 1947 à 1991 : 1986 est pendant. Une vitesse qui ne change pas, c’est un mouvement uniforme ; accéléré, elle augmenterait.
    - aide « La guerre froide, et le mouvement uniforme » :
      - De 1947 à 1991 : la guerre froide.
      - Uniforme : la vitesse ne change pas ; accéléré : elle augmente.
12. énoncé : "1998 : la Russie et les États-Unis commencent ensemble la Station spatiale internationale.\nElle tourne autour de la Terre, à 400 km (kilomètres) d’altitude."
    - question : Quelle phrase est juste ?
    - lu : 1998 : la Russie et les États-Unis commencent ensemble la Station spatiale internationale. Elle tourne autour de la Terre, à 400 kilomètres d’altitude.
    - choix : Après la guerre froide, on coopère ; la Terre attire toujours la station. · Pendant la guerre froide, on coopère ; la Terre attire toujours la station. · Après la guerre froide, on coopère ; là-haut, la Terre n’attire plus la station.
    - réponse : Après la guerre froide, on coopère ; la Terre attire toujours la station.
    - indice : D’abord : 1998 est-il avant ou après 1991 ? Puis : la Terre attire-t-elle encore à 400 kilomètres ?
    - explication : La guerre froide finit en 1991 : en 1998, c’est après, et les deux anciens rivaux construisent ensemble. La Terre attire toujours la station : c’est cette attraction qui la fait tourner autour d’elle au lieu de partir en ligne droite.
    - aide « Après la guerre froide, et la gravitation » :
      - De 1947 à 1991 : la guerre froide. La Russie vient de l’ancienne Union soviétique.
      - Gravitation : la Terre attire la station, même là-haut.
