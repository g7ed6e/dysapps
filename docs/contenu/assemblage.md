# L’assemblage des blocs

> Décidé par le mainteneur le 30 septembre 2026 (fiche [GD-2](../gameplay/propositions/archives/GD-2.md)). Un bloc assemblé par archipel, qu’aucune île ne donne : il s’assemble dans un lieu de l’île de l’école, et seuls les monuments de son archipel en demandent. `npm run contenu` produit `src/game/world/recipes.ts` depuis ce fichier : ne jamais l’éditer. Le dessin des blocs et du lieu, et les cases des monuments qui les demandent, restent dans le code (`biomes.ts`, `pixels.ts`, `palette.ts`, `monuments.ts`).

## Le lieu

> Son nom dans chaque univers : le titre de sa page, où il est (« à … »), et la phrase lue sous le titre.

| univers | nom | à | présentation |
| --- | --- | --- | --- |
| `blocland` | La Fabrique | à la Fabrique | Ici, tu assembles tes blocs pour en faire des pièces que les monuments attendent. |
| `archipeo` | La Halle aux matériaux | à la Halle aux matériaux | Les anciens savaient assembler ce qu’aucune île ne donne seule. Ici, tu retrouves leur savoir-faire pour les monuments. |

## Les blocs assemblés

> Un par archipel. La recette prend des blocs d’îles de son archipel (deux sortes au plus, de petits nombres), jamais d’or ni de cristal. Le nom est propre à chaque univers ; un pluriel qui ne s’écrit pas avec un « s » se met entre parenthèses.

| bloc | archipel | recette | Blocland | Archipéo |
| --- | --- | --- | --- | --- |
| `compound-6e` | 6e | french-6e-phonology × 2 · maths-6e-calculation × 1 | Poutre | Madrier |
| `compound-5e` | 5e | maths-5e-signed-numbers × 2 · french-5e-homophones × 1 | Vitrail (vitraux) | Hublot |
| `compound-4e` | 4e | maths-4e-powers × 2 · english-4e-grammar × 1 | Engrenage | Poulie |
| `compound-3e` | 3e | french-3e-close-reading × 2 · maths-3e-statistics × 1 | Miroir | Loupe |

## Les questions

> Une question à chaque bloc assemblé. Elle mobilise les deux matières scolaires des îles de sa recette ; ses compétences
> sont celles de l’archipel (6e : cycle 3 seul ; 5e à 3e : au moins une du cycle 4). Douze questions par bloc
> (au moins 8). Trois choix : la réponse, un piège de chaque matière. `lu` ne lit que le document : la question
> a son propre bouton. `npm run contenu` les écrit dans `src/game/exercises/data/assembly-<bloc>.json`.

### La poutre · `compound-6e`

- compétences : c3.fr.langue.genre-nombre · c3.fr.langue.accord-sujet-verbe · c3.fr.langue.orthographe-grammaticale · c3.fr.langue.phonemes-graphemes · c3.fr.langue.mots-frequents · c3.fr.lecture.reprises · c3.fr.lecture.explicite · c3.fr.lecture.lexique-contexte · c3.ma.nombres.problemes · c3.ma.nombres.calcul-mental · c3.ma.grandeurs.perimetre · c3.ma.grandeurs.durees
- consigne : Lis, calcule, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien assemblé !
- erreur : {explanation}

1. énoncé : "Léa a 5 billes.\nElle en donne 4 à Tom."
   - question : Quelle phrase est juste ?
   - lu : Léa a 5 billes. Elle en donne 4 à Tom.
   - choix : Il lui reste 1 bille. · Il lui reste 1 billes. · Il lui reste 9 billes.
   - réponse : Il lui reste 1 bille.
   - indice : Combien en reste-t-il ? Puis : une seule, ou plusieurs ?
   - explication : 5 − 4 = 1. Avec 1, le nom reste au singulier : 1 bille, sans s. 9, c’est 5 + 4 : donner, c’est enlever.
   - aide « Un ou plusieurs ? » :
     - Donner, c’est enlever.
     - 1 : pas de s (1 pomme). À partir de 2 : un s (2 pommes).
2. énoncé : "Un paquet contient 50 feuilles.\nNina achète 2 paquets."
   - question : Combien de feuilles a-t-elle ?
   - lu : Un paquet contient 50 feuilles. Nina achète 2 paquets.
   - choix : cent feuilles · sans feuilles · cinquante-deux feuilles
   - réponse : cent feuilles
   - indice : 2 paquets de 50 : c’est 2 fois 50. Puis, quel mot écrit un nombre ?
   - explication : 2 × 50 = 100, qui s’écrit cent. « sans » se dit pareil, mais veut dire « pas de ». 52, c’est 50 + 2 : on a ajouté le nombre de paquets.
   - aide « Un son, plusieurs mots » :
     - 3 paquets de 10 = 10 + 10 + 10.
     - cent = un nombre (deux cents, cent dix). sans = le contraire de avec.
3. énoncé : "Tom a 8 billes. Léa en a 5.\nElle lui en donne 2."
   - question : Combien Tom a-t-il de billes maintenant ?
   - lu : Tom a 8 billes. Léa en a 5. Elle lui en donne 2.
   - choix : 6 · 10 · 13
   - réponse : 10
   - indice : « Elle », c’est qui ? « lui », c’est qui ? Qui reçoit les billes ?
   - explication : Elle, c’est Léa ; lui, c’est Tom. Léa donne 2 billes à Tom : 8 + 2 = 10. 6, c’est si Tom donnait. 13, c’est 8 + 5 : Léa ne donne que 2 billes, pas toutes.
   - aide « Qui donne, qui reçoit ? » :
     - elle = une fille ou une femme ; lui = à lui, celui qui reçoit.
     - Recevoir, c’est ajouter. Donner, c’est enlever.
4. énoncé : "Tom partage 8 crêpes\nentre 4 amis, à parts égales."
   - question : Quelle phrase est juste ?
   - lu : Tom partage 8 crêpes entre 4 amis, à parts égales.
   - choix : Chacun a 2 crêpe. · Chacun a 2 crêpes. · Chacun a 4 crêpes.
   - réponse : Chacun a 2 crêpes.
   - indice : Partager en 4 parts égales : combien dans chaque part ? Puis : une seule, ou plusieurs ?
   - explication : 8 ÷ 4 = 2 : chacun a 2 crêpes. À partir de 2, le nom prend un s. 4, c’est 8 − 4 : partager, ce n’est pas enlever, c’est diviser.
   - aide « Partager, et le pluriel » :
     - Partager à parts égales, c’est diviser.
     - 1 : pas de s (1 pomme). À partir de 2 : un s (3 pommes).
5. énoncé : "Une boîte a 4 rangées\nde 5 cases."
   - question : Combien de cases y a-t-il ?
   - lu : Une boîte a 4 rangées de 5 cases.
   - choix : vingt cases · vin cases · neuf cases
   - réponse : vingt cases
   - indice : 4 rangées de 5 : c’est 4 fois 5. Puis, quel mot écrit un nombre ?
   - explication : 4 × 5 = 20, qui s’écrit vingt, avec un g et un t. « vin » se dit pareil, mais c’est une boisson. 9, c’est 4 + 5 : des rangées, c’est une multiplication.
   - aide « Un son, plusieurs mots » :
     - 3 rangées de 5 = 5 + 5 + 5.
     - vingt = un nombre (vingt-deux, quatre-vingts). vin = la boisson faite avec du raisin.
6. énoncé : "Mia a 4 billes.\nElle en gagne 3."
   - question : Quelle phrase est juste ?
   - lu : Mia a 4 billes. Elle en gagne 3.
   - choix : 4 et 3 font 7. · 4 est 3 font 7. · 4 et 3 font 12.
   - réponse : 4 et 3 font 7.
   - indice : Gagner, c’est ajouter. Puis : peux-tu dire « et puis » ?
   - explication : 4 + 3 = 7. On peut dire « 4 et puis 3 » : on écrit et. « est » veut dire « était ». 12, c’est 4 × 3 : gagner, c’est ajouter, pas multiplier.
   - aide « Et, est » :
     - Gagner, c’est ajouter.
     - et = et puis. est = était (il est grand, il était grand).
7. énoncé : "Un carré a un périmètre de 20 cm."
   - question : Quelle phrase est juste ?
   - lu : Un carré a un périmètre de 20 centimètres.
   - choix : Chaque côté mesure 5 cm. · Chaque côté mesurent 5 cm. · Chaque côté mesure 80 cm.
   - réponse : Chaque côté mesure 5 cm.
   - indice : Un carré a 4 côtés égaux. Puis : chaque, c’est un ou plusieurs ?
   - explication : 20 ÷ 4 = 5 : chaque côté mesure 5 cm. Après « chaque », le verbe est au singulier : mesure. 80, c’est 20 × 4 : le périmètre est déjà le tour entier.
   - aide « Le carré, et chaque » :
     - Périmètre du carré = 4 × côté.
     - chaque = un seul à la fois : le verbe est au singulier.
8. énoncé : "Paul a 16 billes.\nLéa en a le double."
   - question : Combien Léa a-t-elle de billes ?
   - lu : Paul a 16 billes. Léa en a le double.
   - choix : 8 · 22 · 32
   - réponse : 32
   - indice : Le double, c’est 2 fois plus. Pense à la retenue.
   - explication : Le double de 16, c’est 16 + 16 = 32. 8, c’est la moitié : 2 fois moins. 22, c’est la retenue oubliée : 6 + 6 = 12, on pose 2 et on retient 1.
   - aide « Double et moitié » :
     - le double = 2 fois plus. la moitié = 2 fois moins.
     - Le double de 10 = 10 + 10 = 20.
9. énoncé : "Nina cueille 15 pommes.\nElle en mange 2, puis en donne 3 à Sam."
   - question : Combien de pommes reste-t-il à Nina ?
   - lu : Nina cueille 15 pommes. Elle en mange 2, puis en donne 3 à Sam.
   - choix : 10 · 16 · 20
   - réponse : 10
   - indice : « Elle », c’est qui ? « en », ce sont quoi ? Qui donne les pommes ?
   - explication : Elle, c’est Nina ; en, ce sont les pommes. Nina mange 2 pommes et en donne 3 : 15 − 2 − 3 = 10. 16, c’est si Sam donnait 3 pommes à Nina. 20, c’est 15 + 2 + 3 : manger et donner, c’est enlever.
   - aide « Qui, quoi ? » :
     - en remplace un nom déjà dit : regarde la phrase d’avant.
     - Manger, donner : on enlève. Recevoir : on ajoute.
10. énoncé : "Le film commence à 14 h 30.\nIl finit à 16 h."
    - question : Quelle phrase est juste ?
    - lu : Le film commence à 14 heures 30. Il finit à 16 heures.
    - choix : Il dure 1 heure et demie. · Il dure 1 heures et demie. · Il dure 2 heures et demie.
    - réponse : Il dure 1 heure et demie.
    - indice : Compte d’abord jusqu’à 15 heures, puis jusqu’à 16 heures. Puis : une heure, ou plusieurs ?
    - explication : De 14 h 30 à 15 h : 30 minutes. De 15 h à 16 h : 1 heure. En tout : 1 heure et demie. Avec 1, heure reste au singulier. 2 heures et demie, c’est 16 − 14 = 2, puis les 30 minutes ajoutées au lieu d’être enlevées.
    - aide « Durée, et le pluriel » :
      - Une durée : compte par bonds, de l’heure du début jusqu’à l’heure de la fin.
      - 1 heure : pas de s. 2 heures : un s.
11. énoncé : "Une école achète 2 boîtes.\nChaque boîte contient 500 cartes."
    - question : Combien de cartes l’école a-t-elle ?
    - lu : Une école achète 2 boîtes. Chaque boîte contient 500 cartes.
    - choix : mille cartes · milles cartes · cent cartes
    - réponse : mille cartes
    - indice : 2 boîtes de 500 : c’est 500 plus 500. Compte bien les zéros.
    - explication : 500 + 500 = 1 000, qui s’écrit mille. Mille ne prend jamais de s : deux mille, trois mille. 100, c’est un zéro oublié : 5 centaines + 5 centaines = 10 centaines = 1 000.
    - aide « Mille, sans s » :
      - 3 centaines + 2 centaines = 5 centaines.
      - mille ne change jamais : deux mille, dix mille.
12. énoncé : "Lucas a 9 €.\nIl veut savoir ce qui lui manque\npour un livre à 15 €."
    - question : Quelle phrase répond à Lucas ?
    - lu : Lucas a 9 euros. Il veut savoir ce qui lui manque pour un livre à 15 euros.
    - choix : Il lui manque 6 €. · Il lui reste 6 €. · Il lui manque 24 €.
    - réponse : Il lui manque 6 €.
    - indice : Que veut savoir Lucas ? Cherche sa question dans la deuxième ligne.
    - explication : De 9 à 15, il y a 6 : il lui manque 6 €. « Il lui reste », c’est ce qu’on a encore après avoir payé : Lucas ne peut pas encore payer. 24, c’est 9 + 15 : on cherche l’écart, pas la somme.
    - aide « Ce qui manque » :
      - Il manque = ce qu’il faut encore pour arriver au prix.
      - Pour trouver ce qui manque, compte du plus petit au plus grand.

### Le vitrail · `compound-5e`

- compétences : c4.ma.5e.nombres.relatifs · c4.ma.5e.nombres.calcul-relatifs · c4.ma.5e.nombres.fractions · c4.ma.5e.nombres.calcul-fractions · c4.fr.5e.vocabulaire.orthographe · c4.fr.5e.grammaire.classes-de-mots · c3.fr.langue.orthographe-grammaticale
- consigne : Lis, calcule, puis choisis la phrase juste et bien écrite. Le rappel est affiché.
- bravo : Bien assemblé !
- erreur : {explanation}

1. énoncé : "Le matin : −3 °C.\nL’après-midi : 4 °C."
   - question : Quelle phrase est juste ?
   - lu : Le matin, moins 3 degrés. L’après-midi, 4 degrés.
   - choix : Ces deux moments ont 7 degrés d’écart. · Ses deux moments ont 7 degrés d’écart. · Ces deux moments ont 1 degré d’écart.
   - réponse : Ces deux moments ont 7 degrés d’écart.
   - indice : De moins 3 à 0, puis de 0 à 4 : compte les bonds. Puis : ces ou ses ?
   - explication : 4 − (−3) = 4 + 3 = 7 degrés. « ces » montre (ces moments-là) ; « ses » veut dire les siens. 1, c’est 4 − 3 : le signe moins a été oublié.
   - aide « Écart, et ces, ses » :
     - Soustraire un négatif, c’est ajouter : 5 − (−1) = 5 + 1.
     - ces = on montre (ces livres-là). ses = les siens, les siennes.
2. énoncé : "Lina place le nombre −2\nsur la droite graduée."
   - question : Quelle phrase est juste ?
   - lu : Lina place le nombre moins 2 sur la droite graduée.
   - choix : Elle l’a placé à gauche de 0. · Elle la placé à gauche de 0. · Elle l’a placé à droite de 0.
   - réponse : Elle l’a placé à gauche de 0.
   - indice : Les nombres négatifs : à gauche ou à droite de 0 ? Puis remplace par « l’avait ».
   - explication : −2 est négatif : il est à gauche de 0. On peut dire « elle l’avait placé » : on écrit l’a. « la » va devant un nom (la droite). À droite de 0, c’est 2, pas −2.
   - aide « La droite, et l’a, la, là » :
     - Négatifs à gauche de 0, positifs à droite.
     - l’a = l’avait. la = devant un nom. là = à cet endroit.
3. énoncé : "Sam mange un quart de la pizza.\nInès en mange deux quarts."
   - question : Quelle phrase est juste ?
   - lu : Sam mange un quart de la pizza. Inès en mange deux quarts.
   - choix : Ensemble, ils en ont mangé trois quarts. · Ensemble, ils en on mangé trois quarts. · Ensemble, ils en ont mangé trois huitièmes.
   - réponse : Ensemble, ils en ont mangé trois quarts.
   - indice : Des quarts plus des quarts : que deviennent les quarts ? Puis remplace par « avaient ».
   - explication : 1 quart + 2 quarts = 3 quarts : on ajoute les numérateurs, le dénominateur reste 4. « ils avaient mangé » : on écrit ont. Trois huitièmes, c’est 4 + 4 en bas : on n’ajoute pas les dénominateurs.
   - aide « Quarts, et on, ont » :
     - Même dénominateur : on ajoute les numérateurs, le dénominateur ne change pas.
     - ont = avaient. on = il, quelqu’un.
4. énoncé : "Oslo : −8 °C.\nParis : −2 °C."
   - question : Quelle phrase est juste ?
   - lu : Oslo, moins 8 degrés. Paris, moins 2 degrés.
   - choix : Il fait plus froid à Oslo. · Il fait plus froid a Oslo. · Il fait plus froid à Paris.
   - réponse : Il fait plus froid à Oslo.
   - indice : Lequel est le plus loin de 0, du côté des négatifs ? Puis remplace par « avait ».
   - explication : −8 est plus petit que −2 : il fait plus froid à Oslo. On ne peut pas dire « plus froid avait Oslo » : on écrit à, avec un accent. Paris, c’est croire que −2 est plus petit parce que 2 est plus petit que 8.
   - aide « Le plus froid, et a, à » :
     - Entre deux négatifs, le plus petit est le plus loin de 0 : −5 est plus petit que −1.
     - a = avait. à = petit mot devant un lieu (à Lyon).
5. énoncé : "Le thermomètre indique −5 °C.\nLa température monte de 3 degrés."
   - question : Quelle phrase est juste ?
   - lu : Le thermomètre indique moins 5 degrés. La température monte de 3 degrés.
   - choix : Il fait −2 °C : il peut encore geler. · Il fait −2 °C : il peu encore geler. · Il fait −8 °C : il peut encore geler.
   - réponse : Il fait −2 °C : il peut encore geler.
   - indice : Monter, c’est avancer vers 0. Puis remplace par « pouvait ».
   - explication : −5 + 3 = −2 : on avance de 3 bonds vers la droite. On peut dire « il pouvait geler » : on écrit peut. « peu » veut dire « pas beaucoup ». −8, c’est descendre de 3 au lieu de monter.
   - aide « Monter, et peu, peut » :
     - Monter, c’est ajouter : on avance vers la droite sur la droite graduée.
     - peut = pouvait. peu = pas beaucoup.
6. énoncé : "Lou ajoute −6 et 6."
   - question : Quelle phrase est juste ?
   - lu : Lou ajoute moins 6 et 6.
   - choix : La somme est 0 : ces nombres sont opposés. · La somme est 0 : ces nombres son opposés. · La somme est 12 : ces nombres sont opposés.
   - réponse : La somme est 0 : ces nombres sont opposés.
   - indice : De moins 6, avance de 6 bonds. Puis remplace par « étaient ».
   - explication : −6 + 6 = 0 : deux nombres opposés ont une somme nulle. On peut dire « ils étaient opposés » : on écrit sont. « son » veut dire « le sien ». 12, c’est 6 + 6 : le signe moins a été oublié.
   - aide « Opposés, et son, sont » :
     - Ajouter un positif, c’est avancer vers la droite sur la droite graduée.
     - sont = étaient. son = le sien, la sienne (son livre).
7. énoncé : "À midi : 4 °C.\nLe soir : −2 °C."
   - question : Quelle phrase est juste ?
   - lu : À midi, 4 degrés. Le soir, moins 2 degrés.
   - choix : L’air s’est refroidi de 6 degrés. · L’air c’est refroidi de 6 degrés. · L’air s’est refroidi de 2 degrés.
   - réponse : L’air s’est refroidi de 6 degrés.
   - indice : De 4 à 0, puis de 0 à moins 2 : compte les bonds. Puis : peux-tu dire « cela est » ?
   - explication : De 4 à 0 : 4 degrés ; de 0 à −2 : 2 degrés. En tout, 6 degrés. Le verbe est « se refroidir » : on écrit s’est. « c’est » veut dire « cela est ». 2, c’est 4 − 2 : le signe moins a été oublié.
   - aide « La baisse, et c’est, s’est » :
     - Pour un écart, passe par 0 et compte les bonds.
     - s’est = se + est (elle s’est levée). c’est = cela est.
8. énoncé : "Ana calcule 2 − 5.\nElle raconte comment elle a trouvé."
   - question : Quelle phrase d’Ana est juste ?
   - lu : Ana calcule 2 moins 5. Elle raconte comment elle a trouvé.
   - choix : Ma sœur m’a montré qu’on trouve −3. · Ma sœur ma montré qu’on trouve −3. · Ma sœur m’a montré qu’on trouve 3.
   - réponse : Ma sœur m’a montré qu’on trouve −3.
   - indice : De 2, recule de 5 bonds. Puis remplace par « m’avait ».
   - explication : 2 − 5 = −3 : de 2, on recule de 5 bonds, et on passe sous 0. On peut dire « ma sœur m’avait montré » : on écrit m’a. « ma » va devant un nom (ma sœur). 3, c’est 5 − 2 : le signe moins a été oublié.
   - aide « Reculer, et ma, m’a » :
     - Soustraire, c’est reculer sur la droite graduée : 1 − 3 = −2.
     - m’a = m’avait. ma = devant un nom (ma sœur).
9. énoncé : "Deux amis partagent une tarte.\nChacun en prend un quart."
   - question : Quelle phrase est juste ?
   - lu : Deux amis partagent une tarte. Chacun en prend un quart.
   - choix : Il reste la moitié de leur tarte. · Il reste la moitié de leurs tarte. · Il reste trois quarts de leur tarte.
   - réponse : Il reste la moitié de leur tarte.
   - indice : Une tarte, c’est quatre quarts. Combien de quarts sont pris ? Puis : une tarte ou plusieurs ?
   - explication : Les deux amis prennent deux quarts : il en reste deux quarts, la moitié. « leur » va devant un nom au singulier : leur tarte, il n’y en a qu’une. Trois quarts, c’est n’enlever qu’un quart : il y a deux amis.
   - aide « Les quarts, et leur, leurs » :
     - Une tarte entière = quatre quarts. Deux quarts = la moitié.
     - leur + un nom au singulier (leur chat). leurs + un nom au pluriel (leurs chats).
10. énoncé : "À Paris, il est 10 h.\nDécalage de Londres : −1 h."
    - question : Quelle heure est-il à Londres ?
    - lu : À Paris, il est 10 heures. Décalage de Londres, moins 1 heure.
    - choix : À Londres, c’est 9 h. · À Londres, s’est 9 h. · À Londres, c’est 11 h.
    - réponse : À Londres, c’est 9 h.
    - indice : Ajouter moins 1, c’est reculer ou avancer ? Puis : peux-tu dire « cela est » ?
    - explication : 10 + (−1) = 9 : à Londres, il est 9 h. On peut dire « cela est 9 h » : on écrit c’est. « s’est » va avec un verbe comme se lever (il s’est levé). 11 h, c’est 10 + 1 : le signe moins a été oublié.
    - aide « Le décalage, et c’est, s’est » :
      - Ajouter un négatif, c’est reculer : 8 + (−2) = 6.
      - c’est = cela est. s’est = se + est (il s’est levé).
11. énoncé : "Jade et Emma lisent le même livre.\nJade en a lu un tiers.\nEmma en a lu un quart."
    - question : Quelle phrase est juste ?
    - lu : Jade et Emma lisent le même livre. Jade en a lu un tiers. Emma en a lu un quart.
    - choix : Jade a lu plus que son amie. · Jade a lu plus que sont amie. · Emma a lu plus que son amie.
    - réponse : Jade a lu plus que son amie.
    - indice : En 3 parts ou en 4 parts : quelle part est la plus grande ? Puis remplace par « étaient ».
    - explication : Un tiers est plus grand qu’un quart : partagé en 3, chaque part est plus grande qu’en 4. Jade a lu plus qu’Emma. On ne peut pas dire « plus que étaient amie » : on écrit son, comme « sa copine ». « Emma a lu plus », c’est croire qu’un quart est plus grand parce que 4 est plus grand que 3.
    - aide « Comparer, et son, sont » :
      - Même numérateur : plus le dénominateur est grand, plus la part est petite.
      - son = le sien, la sienne (son livre). sont = étaient.
12. énoncé : "Léo a 12 billes.\nIl perd un tiers de ses billes."
    - question : Quelle phrase est juste ?
    - lu : Léo a 12 billes. Il perd un tiers de ses billes.
    - choix : Il en perd 4 et s’en rend compte. · Il en perd 4 et sans rend compte. · Il en perd 9 et s’en rend compte.
    - réponse : Il en perd 4 et s’en rend compte.
    - indice : Un tiers de 12 : partage 12 en 3 parts égales. Puis : le verbe est « se rendre compte ».
    - explication : Un tiers de 12, c’est 12 ÷ 3 = 4 billes. Le verbe est « se rendre compte » : on écrit s’en (se + en). « sans » est le contraire de « avec ». 9, c’est 12 − 3 : un tiers, ce n’est pas enlever 3.
    - aide « Un tiers, et s’en, sans » :
      - Un tiers de 9 : on partage 9 en 3 parts égales, 9 ÷ 3 = 3.
      - s’en = se + en (il s’en va). sans = le contraire de avec.

### L’engrenage · `compound-4e`

- compétences : c4.ma.a.puissances · c4.ma.a.carres-racine · c4.ma.a.ecritures-ordres-de-grandeur · c4.ma.a.divisibilite-premiers · c4.en.langue.lexique · c4.en.langue.temps-verbaux · c4.en.langue.modaux-passif
- langue : en
- consigne : Lis l’énoncé en anglais, calcule, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien assemblé !
- erreur : {explanation}

Pour tous les items :
- langue des choix : fr

1. énoncé : "One cell splits in two every hour.\nLook again in 3 hours."
   - question : Combien de cellules verras-tu ?
   - lu : One cell splits in two every hour. Look again in three hours.
   - choix : 2 · 6 · 8
   - réponse : 8
   - indice : Toutes les heures, une cellule devient deux. Compte heure par heure.
   - explication : 1, puis 2, puis 4, puis 8 : 2 × 2 × 2 = 2³ = 8. 6, c’est 2 × 3 : la base fois l’exposant. 2, c’est le nombre de la phrase, sans le temps : every hour veut dire toutes les heures.
   - aide « Doubler, et les puissances » :
     - every hour = toutes les heures ; split in two = se couper en deux ; in 3 hours = dans 3 heures
     - 2³, c’est 2 × 2 × 2 (pas 2 × 3).
2. énoncé : To open the lock, you must type 9 squared.
   - question : Quel nombre dois-tu taper ?
   - lu : To open the lock, you must type nine squared.
   - choix : 9 · 18 · 81
   - réponse : 81
   - indice : Cherche le sens des mots dans le rappel. Au carré, ce n’est pas le double.
   - explication : 9 squared = 9² = 9 × 9 = 81. 18, c’est 9 × 2 : le carré n’est pas le double. 9, c’est oublier squared, au carré.
   - aide « Must, et le carré » :
     - lock = cadenas ; type = taper ; must = il faut ; squared = au carré
     - Un nombre au carré, c’est ce nombre fois lui-même : 5², c’est 5 × 5.
3. énoncé : "A ticket costs 2⁴ euros.\nChildren will pay 2 euros less.\nSam is 11."
   - question : Combien Sam paiera-t-il ?
   - lu : A ticket costs two to the power of four euros. Children will pay two euros less. Sam is eleven.
   - choix : 6 · 14 · 18
   - réponse : 14
   - indice : Calcule d’abord 2 puissance 4. Puis : les enfants paient-ils moins, ou plus ?
   - explication : 2⁴ = 2 × 2 × 2 × 2 = 16 euros. Sam est un enfant : 16 − 2 = 14 euros. 6, c’est 8 − 2 : 2⁴ n’est pas 2 × 4. 18, c’est 16 + 2 : less veut dire moins.
   - aide « Le prix, et la puissance » :
     - cost = coûter ; will pay = paiera ; less = moins ; more = plus
     - 2⁴, c’est 2 × 2 × 2 × 2 : quatre fois le 2.
4. énoncé : "Tom has 10³ stickers.\nHe gives away a hundred of them."
   - question : Combien d’autocollants lui reste-t-il ?
   - lu : Tom has ten to the power of three stickers. He gives away a hundred of them.
   - choix : 900 · 1 100 · 9 900
   - réponse : 900
   - indice : Combien de zéros dans 10 puissance 3 ? Puis : Tom donne-t-il, ou reçoit-il ?
   - explication : 10³ = 1 000. Tom en donne 100 : 1 000 − 100 = 900. 9 900, c’est 10 000 − 100 : 10³ s’écrit avec trois zéros, pas quatre. 1 100, c’est 1 000 + 100 : give away veut dire donner.
   - aide « Donner, et 10 puissance 3 » :
     - sticker = autocollant ; give away = donner ; a hundred = cent
     - 10 puissance n, c’est un 1 suivi de n zéros.
5. énoncé : "The museum has 10⁶ visitors a year.\nHalf of them are children."
   - question : Combien d’enfants visitent le musée chaque année ?
   - lu : The museum has ten to the power of six visitors a year. Half of them are children.
   - choix : 50 000 · 500 000 · 2 000 000
   - réponse : 500 000
   - indice : Combien de zéros dans 10 puissance 6 ? Puis : les enfants, c’est la moitié ou le double ?
   - explication : 10⁶ = 1 000 000, un million. La moitié : 500 000. 50 000, c’est un zéro oublié : 10⁶ a six zéros. 2 000 000, c’est le double : half veut dire la moitié.
   - aide « La moitié, et 10 puissance 6 » :
     - half of = la moitié de ; a year = par an ; a million = un million
     - 10 puissance n, c’est un 1 suivi de n zéros.
6. énoncé : "You share 30 stickers equally between 4 friends.\nHow many stickers are left?"
   - question : Combien d’autocollants reste-t-il ?
   - lu : You share thirty stickers equally between four friends. How many stickers are left?
   - choix : 0 · 2 · 7
   - réponse : 2
   - indice : Cherche le plus grand nombre de la table de 4 sous 30. Puis : on cherche ce qui reste, pas la part de chacun.
   - explication : 4 × 7 = 28 : chaque ami en a 7, et il en reste 30 − 28 = 2. 0, c’est croire que 30 est divisible par 4 : il est pair, mais pas dans la table de 4. 7, c’est la part de chacun : left veut dire ce qui reste.
   - aide « Partager, et le reste » :
     - share between = partager entre ; equally = à parts égales ; left = qui reste
     - Pour partager, cherche le plus grand multiple sous le nombre, puis ce qui reste.
7. énoncé : "At the start, there were 5 fans.\nThe number of fans has doubled three times."
   - question : Combien de fans y a-t-il maintenant ?
   - lu : At the start, there were five fans. The number of fans has doubled three times.
   - choix : 15 · 30 · 40
   - réponse : 40
   - indice : Le nombre a doublé trois fois : double 5, puis double encore, et encore.
   - explication : 5, puis 10, puis 20, puis 40 : 5 × 2³ = 5 × 8 = 40. 30, c’est 5 × 2 × 3 : 2³ n’est pas 2 × 3. 15, c’est 5 × 3 : has doubled three times veut dire a doublé trois fois, pas a triplé.
   - aide « Doubler trois fois » :
     - has doubled = a doublé ; three times = trois fois ; at the start = au début
     - Doubler 3 fois, c’est multiplier par 2, puis par 2, puis par 2.
8. énoncé : "Mia is going to make a square garden.\nEach side will be 7 metres."
   - question : Que dit l’énoncé ?
   - lu : Mia is going to make a square garden. Each side will be seven metres.
   - choix : Mia va faire un jardin de 49 m². · Mia a fait un jardin de 49 m². · Mia va faire un jardin de 14 m².
   - réponse : Mia va faire un jardin de 49 m².
   - indice : Le texte parle-t-il de ce qui est fait, ou de ce qui va se faire ? Puis : l’aire d’un carré.
   - explication : is going to dit ce qui va se passer : Mia va faire. L’aire du carré : 7 × 7 = 7² = 49 m². « a fait », c’est lire un passé. 14, c’est 7 × 2 : le carré n’est pas le double.
   - aide « Le futur, et l’aire du carré » :
     - is going to = va (bientôt) ; square = carré ; side = côté
     - Aire d’un carré : côté × côté. 3², c’est 3 × 3.
9. énoncé : "Photo contest: your photo must be a square.\nIts side mustn’t be more than √144 cm."
   - question : Que dit le règlement ?
   - lu : Photo contest: your photo must be a square. Its side mustn’t be more than the square root of one hundred and forty-four centimetres.
   - choix : Le côté ne doit pas dépasser 12 cm. · Le côté doit dépasser 12 cm. · Le côté ne doit pas dépasser 72 cm.
   - réponse : Le côté ne doit pas dépasser 12 cm.
   - indice : Quel nombre, multiplié par lui-même, donne 144 ? Puis : dépasser, c’est permis ou interdit ?
   - explication : 12 × 12 = 144, donc √144 = 12. mustn’t be more than veut dire ne doit pas dépasser. « doit dépasser », c’est lire must au lieu de mustn’t. 72, c’est 144 ÷ 2 : la racine carrée n’est pas la moitié.
   - aide « Interdit, et la racine carrée » :
     - must = il faut ; mustn’t = il ne faut pas, c’est interdit ; more than = plus de
     - La racine carrée de 25, c’est 5, car 5 × 5 = 25.
10. énoncé : About 8 billion people live on Earth.
    - question : Comment écrit-on ce nombre ?
    - lu : About eight billion people live on Earth.
    - choix : 8 × 10⁸ · 8 × 10⁹ · 8 × 10¹²
    - réponse : 8 × 10⁹
    - indice : Le mot anglais est un faux ami : il veut dire un milliard. Combien de zéros dans un milliard ?
    - explication : a billion = un milliard = 1 000 000 000 = 10⁹. Donc 8 milliards = 8 × 10⁹. 8 × 10¹², c’est le faux ami : un billion, en français, vaut mille milliards. 8 × 10⁸, c’est un zéro oublié en comptant.
    - aide « Les grands nombres » :
      - a million = un million ; a billion = un milliard (faux ami : pas un billion)
      - Un million : 6 zéros. Un milliard : 9 zéros.
11. énoncé : "Guess my number!\nIt is a prime number between 20 and 25."
    - question : Quel est ce nombre ?
    - lu : Guess my number! It is a prime number between twenty and twenty-five.
    - choix : 21 · 23 · 25
    - réponse : 23
    - indice : Un nombre premier n’a que deux diviseurs. Cherche un autre diviseur pour chaque nombre.
    - explication : 23 n’a que deux diviseurs, 1 et 23 : il est premier. 21 = 3 × 7 : prime ne veut pas dire le premier après 20. 25 = 5 × 5 : un nombre impair n’est pas toujours premier.
    - aide « Nombre premier » :
      - guess = deviner ; prime number = nombre premier ; between = entre
      - Un nombre premier a deux diviseurs seulement : 1 et lui-même. 15 = 3 × 5 n’est pas premier.
12. énoncé : "This year, the game has 10 players.\nEach year, it will have 10 times more players."
    - question : Combien de joueurs le jeu aura-t-il dans 3 ans ?
    - lu : This year, the game has ten players. Each year, it will have ten times more players.
    - choix : 40 · 1 000 · 10 000
    - réponse : 10 000
    - indice : Chaque année, le nombre de joueurs est multiplié par 10. Fais-le 3 fois.
    - explication : 10, puis 100, puis 1 000, puis 10 000 : 10 × 10³ = 10⁴ = 10 000. 1 000, c’est 10³ : on a oublié les 10 joueurs du début. 40, c’est 10 + 10 + 10 + 10 : times more veut dire fois plus, pas de plus.
    - aide « Fois plus, et les puissances de 10 » :
      - will have = aura ; each year = chaque année ; times more = fois plus
      - Multiplier par 10, c’est ajouter un zéro.

### Le miroir · `compound-3e`

- compétences : c4.fr.langue.sens-des-mots · c4.fr.langue.enonciation · c4.fr.langue.discours-rapporte · c4.fr.langue.passif · c4.fr.langue.coherence-textuelle · c4.fr.lecture.procedes · c4.fr.lecture.controle · c3.fr.lecture.implicite · c4.ma.b.probabilites · c4.ma.b.indicateurs · c4.ma.b.effectifs-frequences · c4.ma.b.lire-donnees · c4.ma.5e.proportionnalite.pourcentages
- consigne : Lis le texte, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien assemblé !
- erreur : {explanation}

1. énoncé : "Dans un sac : 3 billes rouges et 1 bille bleue.\nAli tire une bille sans regarder.\nIl dit : « Je vais forcément tirer une rouge. »"
   - question : Ali a-t-il raison ?
   - lu : Dans un sac, 3 billes rouges et 1 bille bleue. Ali tire une bille sans regarder. Il dit : je vais forcément tirer une rouge.
   - choix : Oui : il y a plus de rouges. · Non : c’est probable, pas certain. · Non : il a une chance sur deux.
   - réponse : Non : c’est probable, pas certain.
   - indice : « forcément » veut dire certain. La bille bleue peut-elle sortir ?
   - explication : La chance de tirer une rouge est de 3 sur 4 : c’est probable. « Forcément » veut dire certain : c’est faux, la bleue peut sortir. Deux couleurs ne font pas une chance sur deux : il y a 4 billes.
   - aide « Certain ou probable ? » :
     - forcément, sûrement = certain ; sans doute, probablement = probable.
     - Probabilité = cas favorables ÷ cas possibles.
2. énoncé : "Max : « Il pleut tous les jours dans cette ville ! »\nRelevé de juin : 9 jours de pluie sur 30."
   - question : Que montre le relevé ?
   - lu : Max dit : il pleut tous les jours dans cette ville ! Relevé de juin : 9 jours de pluie sur 30.
   - choix : Max exagère : c’est une hyperbole. · Max exagère : c’est une comparaison. · Max a raison : il pleut très souvent.
   - réponse : Max exagère : c’est une hyperbole.
   - indice : 9 jours sur 30, c’est moins d’un jour sur trois. Et une figure qui exagère ?
   - explication : 9 sur 30 = 0,3 : il pleut moins d’un jour sur trois. Max exagère : c’est une hyperbole. Une comparaison rapproche deux choses avec « comme ». « Max a raison », c’est lire Max sans lire le relevé.
   - aide « Fréquence et hyperbole » :
     - Fréquence = effectif ÷ total : 9 ÷ 30.
     - hyperbole = exagération ; comparaison = rapprochement avec « comme ».
3. énoncé : "Relevé fait jeudi : lundi 18 °C, mardi 20 °C, mercredi 22 °C.\nMardi soir, Tom avait écrit : « Depuis lundi, la moyenne est de 19 °C. »"
   - question : Tom avait-il raison ?
   - lu : Relevé fait jeudi : lundi 18 degrés, mardi 20 degrés, mercredi 22 degrés. Mardi soir, Tom avait écrit : depuis lundi, la moyenne est de 19 degrés.
   - choix : Oui : il avait raison. · Non : elle était de 20 °C. · Non : elle était de 38 °C.
   - réponse : Oui : il avait raison.
   - indice : Quand Tom a-t-il écrit ? Quels jours compte-t-il ?
   - explication : Tom a écrit mardi soir : pour lui, depuis lundi, c’est lundi et mardi. (18 + 20) ÷ 2 = 19 °C. 20 °C est la moyenne des trois jours, mais mercredi n’était pas encore là. 38, c’est la somme sans la division.
   - aide « Qui écrit, quand ? La moyenne » :
     - « depuis », « aujourd’hui » : on compte depuis le jour où la personne écrit.
     - Moyenne = somme des valeurs ÷ nombre de valeurs.
4. énoncé : "Tirs de Léo : 20. Buts : 8.\nLe coach : « Ce n’est pas mal ! »"
   - question : Que veut dire le coach ?
   - lu : Tirs de Léo, 20. Buts, 8. Le coach dit : ce n’est pas mal !
   - choix : C’est bien : 40 % de tirs réussis. · C’est mauvais : 40 % de tirs réussis. · C’est bien : 8 % de tirs réussis.
   - réponse : C’est bien : 40 % de tirs réussis.
   - indice : « pas mal » : le coach est-il content ? Puis : 8 sur 20, c’est combien sur 100 ?
   - explication : 8 ÷ 20 = 0,4 = 40 % : c’est un bon score. « Pas mal » est une litote : on dit moins pour dire plus, le coach veut dire « c’est bien ». « C’est mauvais », c’est lire la négation au pied de la lettre. 8 %, c’est prendre le nombre de buts pour le pourcentage.
   - aide « Litote et pourcentage » :
     - litote = dire moins pour dire plus : « il n’est pas bête » veut dire « il est malin ».
     - Pourcentage = part ÷ total × 100 : 5 sur 20, c’est 25 %.
5. énoncé : "Notes de Lina en maths :\n8 ; 9 ; 15 ; 16 ; 17"
   - question : Quelle phrase est juste ?
   - lu : Notes de Lina en maths : 8, 9, 15, 16, 17.
   - choix : 15 est au milieu, donc c’est la médiane. · 15 est au milieu, pourtant c’est la médiane. · 13 est au milieu, donc c’est la médiane.
   - réponse : 15 est au milieu, donc c’est la médiane.
   - indice : Les notes sont rangées : laquelle est au milieu ? Puis : une conséquence, ou une opposition ?
   - explication : 5 notes rangées : la troisième, 15, est au milieu. C’est la médiane. « donc » annonce une conséquence ; « pourtant », une opposition : ici, rien ne s’oppose. 13, c’est la moyenne : 65 ÷ 5, qui n’est pas une note de Lina.
   - aide « Médiane, donc ou pourtant » :
     - Médiane : la valeur du milieu, les notes rangées dans l’ordre.
     - donc = une conséquence ; pourtant = une opposition.
6. énoncé : "Le principal : « Dans notre collège,\n50 % des 600 élèves viennent à vélo. »"
   - question : Comment finir la phrase « Il a dit que » ?
   - lu : Le principal dit : dans notre collège, 50 pour cent des 600 élèves viennent à vélo.
   - choix : 300 élèves de son collège venaient à vélo. · 300 élèves de notre collège venaient à vélo. · 50 élèves de son collège venaient à vélo.
   - réponse : 300 élèves de son collège venaient à vélo.
   - indice : Qui parle de « notre » collège ? Puis : 50 pour cent, c’est quelle part ?
   - explication : 50 % de 600, c’est la moitié : 300 élèves. Quand on rapporte les paroles du principal, « notre collège » devient « son collège ». « notre », c’est garder les mots du principal comme si on parlait soi-même. 50 élèves, c’est prendre le pourcentage pour un nombre d’élèves.
   - aide « Discours rapporté et pourcentage » :
     - Discours rapporté : je, nous, notre deviennent il, ils, son, leur.
     - 25 %, c’est le quart ; 50 % de 80, c’est 40.
7. énoncé : "Record du saut en longueur :\n2019 : 5,10 m (Inès)\n2024 : 5,40 m (Zoé)"
   - question : Quelle phrase est juste ?
   - lu : Record du saut en longueur. 2019, 5 mètres 10, Inès. 2024, 5 mètres 40, Zoé.
   - choix : Inès est battue par Zoé, de 30 cm. · Zoé est battue par Inès, de 30 cm. · Inès est battue par Zoé, de 3 cm.
   - réponse : Inès est battue par Zoé, de 30 cm.
   - indice : Qui a sauté le plus loin, et quand ? Puis : 0,30 mètre, c’est combien de centimètres ?
   - explication : En 2024, Zoé saute plus loin qu’Inès en 2019 : c’est Zoé qui bat le record d’Inès. 5,40 − 5,10 = 0,30 m = 30 cm. Au passif, « Inès est battue par Zoé » : c’est Zoé qui fait l’action. « Zoé est battue par Inès », c’est prendre le premier nom pour celui qui agit. 3 cm, c’est mal convertir : 1 m = 100 cm.
   - aide « Passif et longueurs » :
     - Passif : « A est battu par B » : c’est B qui gagne.
     - 1 m = 100 cm : 0,5 m = 50 cm.
8. énoncé : "Températures de la semaine, en °C :\n12 ; 14 ; 13 ; 15 ; 14 ; 13 ; 14\nNoé : « Pas besoin de changer de pull cette semaine. »"
   - question : Que sous-entend Noé ?
   - lu : Températures de la semaine, en degrés : 12, 14, 13, 15, 14, 13, 14. Noé dit : pas besoin de changer de pull cette semaine.
   - choix : Le temps change peu : 3 degrés d’étendue. · Noé n’a qu’un pull : 3 degrés d’étendue. · Le temps change peu : 15 degrés d’étendue.
   - réponse : Le temps change peu : 3 degrés d’étendue.
   - indice : Que laisse comprendre Noé sur le temps ? Puis : la plus grande valeur moins la plus petite.
   - explication : De 12 à 15, l’écart est de 15 − 12 = 3 degrés : le temps change peu, d’où le même pull. Noé ne parle pas du nombre de ses pulls : il le sous-entend du temps. 15, c’est la plus grande valeur, pas l’étendue.
   - aide « Étendue et sous-entendu » :
     - Étendue = plus grande valeur − plus petite valeur.
     - Sous-entendre : faire comprendre une chose sans la dire. Cherche ce que la phrase laisse comprendre.
9. énoncé : "On lance un dé à 6 faces.\nLina dit : « Faire un 7, c’est peu probable. »"
   - question : Lina a-t-elle raison ?
   - lu : On lance un dé à 6 faces. Lina dit : faire un 7, c’est peu probable.
   - choix : Non : c’est impossible. · Oui : c’est peu probable. · Non : la chance est de 1 sur 6.
   - réponse : Non : c’est impossible.
   - indice : Un dé à 6 faces porte-t-il un 7 ?
   - explication : Les faces vont de 1 à 6 : aucune ne porte un 7. La probabilité est 0 : c’est impossible, pas peu probable. 1 sur 6, c’est la chance d’un nombre qui est sur le dé.
   - aide « Impossible ou peu probable ? » :
     - impossible = n’arrive jamais (probabilité 0) ; peu probable = arrive rarement ; certain = arrive toujours (probabilité 1).
     - Probabilité = cas favorables ÷ cas possibles.
10. énoncé : "Sondage de la classe : 25 élèves\nEn bus : 8\nÀ pied : 17"
    - question : Quelle phrase est juste ?
    - lu : Sondage de la classe, 25 élèves. En bus, 8. À pied, 17.
    - choix : La plupart viennent à pied : 68 %. · Peu d’élèves viennent à pied : 68 %. · La plupart viennent à pied : 17 %.
    - réponse : La plupart viennent à pied : 68 %.
    - indice : 17 sur 25 : plus ou moins de la moitié ? Puis, combien sur 100 ?
    - explication : 17 ÷ 25 = 0,68 = 68 % : plus de la moitié vient à pied, c’est la plupart. « Peu » veut dire une petite partie : 68 %, c’est beaucoup. 17 %, c’est prendre l’effectif pour la fréquence.
    - aide « La plupart, et la fréquence » :
      - Fréquence = effectif ÷ total. En pourcentage : × 100.
      - la plupart = plus de la moitié ; peu = une petite partie.
11. énoncé : "Trajets de Sam, en minutes :\n12 ; 15 ; 14\nSam : « Je mets en moyenne environ 14 minutes. »"
    - question : Sam a-t-il raison ?
    - lu : Trajets de Sam, en minutes : 12, 15, 14. Sam dit : je mets en moyenne environ 14 minutes.
    - choix : Oui : la moyenne est proche de 14. · Non : il dit qu’il met toujours 14 minutes. · Non : la moyenne est de 41 minutes.
    - réponse : Oui : la moyenne est proche de 14.
    - indice : Calcule la moyenne. Puis : « environ », c’est tout juste ou à peu près ?
    - explication : (12 + 15 + 14) ÷ 3 = 41 ÷ 3, un peu moins de 14 (13,7 environ). « Environ » veut dire à peu près : Sam a raison. Sam ne dit pas « toujours » : « en moyenne », c’est un calcul sur tous ses trajets, pas le temps de chacun. 41, c’est la somme sans la division.
    - aide « Environ, et la moyenne » :
      - Moyenne = somme des valeurs ÷ nombre de valeurs.
      - environ = à peu près, pas tout juste. en moyenne = pas à chaque fois.
12. énoncé : "Titre : « Les ventes de vélos explosent ! »\nVentes en 2024 : 200 vélos\nVentes en 2025 : 210 vélos"
    - question : Le titre dit-il vrai ?
    - lu : Titre : les ventes de vélos explosent ! Ventes en 2024, 200 vélos. Ventes en 2025, 210 vélos.
    - choix : Non : il exagère, c’est 5 % de plus. · Oui : c’est une forte hausse de 5 %. · Non : il exagère, c’est 10 % de plus.
    - réponse : Non : il exagère, c’est 5 % de plus.
    - indice : De 200 à 210, de combien montent les ventes ? Puis, combien sur 100 ?
    - explication : Les ventes montent de 10 vélos sur 200 : 10 ÷ 200 = 0,05 = 5 %. C’est peu : « explosent » exagère pour attirer le lecteur. « Une forte hausse », c’est croire le titre sans lire les nombres. 10 %, c’est prendre 10 vélos pour 10 %.
    - aide « Un titre, et une hausse » :
      - Hausse en % = hausse ÷ valeur de départ × 100.
      - Un titre peut exagérer pour attirer : exploser = ici, monter très fort.
