# Les grands projets

> Décidé par le mainteneur le 5 octobre 2026 (fiche [GD-10](../gameplay/propositions/GD-10.md), P1), piste A choisie le 8 octobre 2026 : dès la 5e, une grande construction devient un projet, posé pièce par pièce. Chaque pièce a deux recettes au choix, des blocs de deux îles de deux matières, et une question qui mêle ces deux matières ; les deux recettes d’une pièce n’ont aucune matière en commun, et la LV2 n’en fait jamais partie : une matière difficile ne bloque jamais. `npm run contenu` produit `src/game/world/projects.json` et les banques de questions (`src/game/exercises/data/assembly-<banque>.json`) depuis ce fichier : ne jamais les éditer. La forme des pièces (les étages du grand ouvrage) reste dans le code (`src/game/world/projects.ts`).

## Les pièces

> Une ligne par pièce, de bas en haut : on les pose dans cet ordre. Une recette : deux blocs d’îles de l’archipel du projet, `bloc × nombre`, séparés par « · ». Ses questions : une banque de « Les questions » ci-dessous (`project-…`), ou celles d’un bloc assemblé de [assemblage.md](assemblage.md) (`compound-5e`), avec le même tirage pour l’élève. Le nom de la pièce, avec son article, dans chaque univers.

| projet | pièce | recette 1 | questions 1 | recette 2 | questions 2 | Blocland | Archipéo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `landmark-5e-1` | `base` | maths-5e-signed-numbers × 6 · french-5e-homophones × 4 | `compound-5e` | english-5e-grammar × 6 · geography-5e-resources × 4 | `project-5e-travellers` | le socle | le socle |
| `landmark-5e-1` | `tower` | maths-5e-proportionality × 6 · english-5e-vocabulary × 4 | `project-5e-counter` | french-5e-conjugation × 6 · history-5e-middle-ages × 4 | `project-5e-chronicle` | la tour | la tour |
| `landmark-5e-1` | `gallery` | maths-5e-signed-numbers × 6 · french-5e-homophones × 4 | `compound-5e` | english-5e-grammar × 6 · geography-5e-resources × 4 | `project-5e-travellers` | la galerie | le haut de la tour |
| `landmark-5e-1` | `lantern` | maths-5e-proportionality × 6 · english-5e-vocabulary × 4 | `project-5e-counter` | french-5e-conjugation × 6 · history-5e-middle-ages × 4 | `project-5e-chronicle` | la lanterne | la terrasse |
| `landmark-5e-1` | `roof` | maths-5e-signed-numbers × 6 · french-5e-homophones × 4 | `compound-5e` | english-5e-grammar × 6 · geography-5e-resources × 4 | `project-5e-travellers` | le toit | le feu |

## Les questions

> Une banque par paire d’îles, écrite comme les questions des blocs assemblés ([assemblage.md](assemblage.md), « Les questions ») : une seule question qui mêle les deux matières, trois choix (la réponse, un piège de chaque matière), une aide de deux lignes (une par notion), un indice en deux temps. Douze questions par banque (au moins 8). Compétences du cycle 4 (5e), déjà travaillées par une île.

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
