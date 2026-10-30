---
lieu : french-3e-language
module : La langue en 3e
matière : french
classe : 3e
description : Subjonctif et conditionnel, accords difficiles, connotation et mots de l’analyse, ponctuation, mise en relief et registres, radicaux des verbes : la règle sous les yeux.
icône : feather
monde ouvert seulement : oui
---

# Lutherie

> Lieu du monde ouvert seulement (décision du mainteneur du 21 octobre 2026, 20 h 34 : seize lieux au 3e ; du 22 octobre 2026 : les dix missions neuves dans la pull request des seize lieux ; GD-24) : la Lutherie n’existe que dans le monde ouvert du 3e d’Archipéo, jamais dans la grille ni dans Blocland. Ses cinq missions sont N6 à N10 de la carte des missions du 3e (`carte-missions-3e.md`, § 2), écrites sur les textes de 2020 et de 2026 ensemble (décision du mainteneur du 21 octobre 2026). Le lieu n’a ni gardien ni créature, comme la Jonction : aucun écran ne les montrerait ; son habitant est l’accordeur, nommé par son métier, celui de la réplique de fin des plans. Aucun nom de contenu ne s’affiche dans le monde ouvert.
> Textes lus : programme de français du cycle 4 de 2026 (`cycle4-francais-2026.pdf`, F26), partie « Troisième », p. 15, 18 et 19 ; annexe 3 de 2020 (pages de `src/curriculum/cycle4.ts`), p. 22 à 25. Le 3e suit le texte de 2020 jusqu’à la rentrée 2028 : les missions citent les compétences de 2020, seules au référentiel pour le 3e ; les compétences `c4.fr.3e.*` de F26 s’ajouteront avec le référentiel de 2026 du 3e (carte des missions, § 4, PR 1, à décider par le mainteneur). La mise en relief (niveau 2 de Ponctuation et relief) est de 2026 seul, signalée sous sa mission.
> Écrire juste prend le repli du référent dys (`avis-dys-noms.md`, 21 octobre 2026) : les radicaux verbaux seuls, en deux niveaux ; les homophones lexicaux (F26 p. 15) ne sont pas dans ce lieu, ni dans Connotation, déjà à trois niveaux. Leur place est à décider (une série du portail des homophones, ou une mission de la bascule de 2028).
> Les niveaux gagnent le bloc de la Coupole (`french-3e-close-reading`), sur la même île des Prairies : à confirmer par le directeur artistique. Titres de travail, à nommer par le consultant d’Archipéo. Écran : `CalculationScreen`, comme les autres missions de français du collège ; chaque niveau a sa règle affichée.

## Subjonctif et conditionnel · `verb-moods`

> F26 p. 19 (« Employer et identifier le présent et le passé du subjonctif », « Connaitre la morphologie du passé du subjonctif », « emplois élargis du subjonctif après certaines conjonctions », « Consolider la maitrise du conditionnel ») ; 2020, p. 24 (temps à mémoriser : subjonctif, conditionnel présent et passé ; principaux emplois des modes). La Jonction du 4e (`moods`) fait reconnaître la valeur d’un mode ; ici, on choisit la forme.

- description : Indicatif ou subjonctif selon le mot qui introduit le verbe, le passé du subjonctif, puis le conditionnel passé après « si ».
- compétences : c4.fr.langue.temps-a-memoriser · c4.fr.langue.valeurs-des-temps
- bravo : Bien conjugué !
- erreur : {explanation}
- bloc gagné : french-3e-close-reading
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `french-3e-language-verb-moods-1`

- consigne : Indicatif ou subjonctif ? Choisis la forme. La règle est affichée.
- consigne courte : Indicatif ou subjonctif ? Touche la forme.

Pour tous les items :
- aide « Indicatif ou subjonctif ? » :
  - Subjonctif après : il faut que, je veux que, bien que, pour que, avant que, je doute que.
  - Indicatif après : je sais que, je pense que, il est sûr que, après que, parce que.
  - Pour entendre la différence, essaie avec « faire » : qu’il fasse (subjonctif), il fait (indicatif).

1. énoncé : Il faut que tu … tes affaires ce soir.
   - choix : prends · prennes
   - réponse : prennes
   - indice : « Il faut que » : regarde la première ligne de la règle.
   - explication : Après « il faut que », le verbe est au subjonctif : que tu prennes. « Prends » est l’indicatif.
2. énoncé : Je pense qu’il … raison.
   - choix : a · ait
   - réponse : a
   - indice : « Je pense que » : on affirme ce qu’on croit vrai.
   - explication : Après « je pense que », le verbe est à l’indicatif : il a raison. « Ait » est le subjonctif.
3. énoncé : Bien qu’elle … fatiguée, elle continue la course.
   - choix : est · soit
   - réponse : soit
   - indice : « Bien que » : regarde la première ligne de la règle.
   - explication : Après « bien que », le verbe est au subjonctif : bien qu’elle soit fatiguée. « Est » est l’indicatif.
4. énoncé : Rentre avant qu’il … nuit.
   - choix : fait · fasse
   - réponse : fasse
   - indice : « Avant que » : le moment n’est pas encore arrivé.
   - explication : Après « avant que », le verbe est au subjonctif : avant qu’il fasse nuit. « Fait » est l’indicatif.
5. énoncé : Nous mangeons après que tout le monde … arrivé.
   - choix : est · soit
   - réponse : est
   - indice : « Après que » : regarde la deuxième ligne de la règle.
   - explication : « Après que » se construit avec l’indicatif : après que tout le monde est arrivé. L’arrivée a eu lieu : c’est un fait. « Avant que », lui, prend le subjonctif.
6. énoncé : Je doute qu’il … venir demain.
   - choix : peut · puisse
   - réponse : puisse
   - indice : « Je doute que » : ce n’est pas sûr.
   - explication : Après « je doute que », le verbe est au subjonctif : qu’il puisse venir. « Peut » est l’indicatif.
7. énoncé : Je sais que vous … la réponse.
   - choix : savez · sachiez
   - réponse : savez
   - indice : « Je sais que » : on affirme un fait.
   - explication : Après « je sais que », le verbe est à l’indicatif : vous savez. « Sachiez » est le subjonctif.
8. énoncé : Le professeur répète la consigne pour que nous … bien.
   - choix : comprenons · comprenions
   - réponse : comprenions
   - indice : « Pour que » dit un but.
   - explication : Après « pour que », le verbe est au subjonctif : pour que nous comprenions. « Comprenons » est l’indicatif.

### Niveau 2 · `french-3e-language-verb-moods-2`

- consigne : Choisis l’auxiliaire du passé du subjonctif. La règle est affichée.
- consigne courte : Touche l’auxiliaire du passé du subjonctif.

Pour tous les items :
- aide « Le passé du subjonctif » :
  - Avoir ou être au subjonctif présent, puis le participe passé.
  - Avec avoir : que j’aie, que tu aies, qu’il ait, que nous ayons, que vous ayez, qu’ils aient.
  - Avec être : que je sois, que tu sois, qu’il soit, que nous soyons, que vous soyez, qu’ils soient.
  - Il dit une action finie : je suis content que tu aies fini.

1. énoncé : Je suis contente que tu … ton exposé.
   - choix : as fini · aies fini · aie fini
   - réponse : aies fini
   - indice : Avec « tu », le subjonctif d’avoir s’écrit avec un s.
   - explication : Après « je suis contente que », subjonctif : que tu aies fini. « As fini » est l’indicatif. « Aie » est la forme de « je ».
2. énoncé : Il faut qu’elle … rentrée avant minuit.
   - choix : est · soit · soient
   - réponse : soit
   - indice : « Il faut que » demande le subjonctif ; le sujet est « elle ».
   - explication : Subjonctif d’être avec « elle » : qu’elle soit rentrée. « Est » est l’indicatif. « Soient » va avec « ils » ou « elles ».
3. énoncé : Bien qu’il … beaucoup marché, il n’est pas fatigué.
   - choix : a · ait · aie
   - réponse : ait
   - indice : Avec « il », le subjonctif d’avoir finit par t.
   - explication : Après « bien que », subjonctif : qu’il ait marché. « A » est l’indicatif. « Aie » est la forme de « je ».
4. énoncé : Je regrette que vous … partis si tôt.
   - choix : êtes · soyez · soyiez
   - réponse : soyez
   - indice : Relis la ligne d’« être » : la forme de « vous ».
   - explication : Que vous soyez, sans i après le y. « Êtes » est l’indicatif. « Soyiez » ajoute un i qui ne s’écrit pas.
5. énoncé : Nous attendrons que tout le monde … arrivé.
   - choix : soit · est · ait
   - réponse : soit
   - indice : « Arriver » se conjugue avec être : il est arrivé.
   - explication : On dit « il est arrivé » : au subjonctif, qu’il soit arrivé. « Est » est l’indicatif. « Ait » prend avoir, qui ne va pas avec « arriver ».
6. énoncé : Il est possible que j’… oublié mon livre.
   - choix : ai · aie · ait
   - réponse : aie
   - indice : Avec « je », le subjonctif d’avoir finit par e.
   - explication : Subjonctif d’avoir avec « je » : que j’aie oublié. « Ai » est l’indicatif. « Ait » est la forme de « il ».
7. énoncé : Je ne crois pas qu’ils … compris.
   - choix : ont · aient · aies
   - réponse : aient
   - indice : « Je ne crois pas que » : ce n’est pas sûr. Le sujet est « ils ».
   - explication : Après « je ne crois pas que », subjonctif : qu’ils aient compris. « Ont » est l’indicatif. « Aies » est la forme de « tu ».
8. énoncé : Elle est triste que ses amis ne … pas venus.
   - choix : sont · soient · soit
   - réponse : soient
   - indice : Le sujet, « ses amis », est au pluriel.
   - explication : Après « elle est triste que », subjonctif : qu’ils soient venus. « Sont » est l’indicatif. « Soit » va avec un sujet au singulier.

### Niveau 3 · `french-3e-language-verb-moods-3`

- consigne : Choisis la forme qui suit « si ». La règle est affichée.
- consigne courte : Touche la forme qui suit « si ».

Pour tous les items :
- aide « Si et le conditionnel » :
  - Si + imparfait, puis conditionnel présent : si j’avais le temps, je lirais.
  - Si + plus-que-parfait, puis conditionnel passé : si j’avais su, je serais venu.
  - Conditionnel passé : avoir ou être au conditionnel, puis le participe passé.
  - Juste après « si », jamais de conditionnel.

1. énoncé : Si tu m’avais appelé, je … venu.
   - choix : serais · serai · suis
   - réponse : serais
   - indice : « Si » + plus-que-parfait : regarde la deuxième ligne.
   - explication : Si + plus-que-parfait, puis conditionnel passé : je serais venu. « Serai » est le futur. « Suis » est le présent.
2. énoncé : Si nous avions couru, nous … le bus.
   - choix : aurions pris · avions pris · aurons pris
   - réponse : aurions pris
   - indice : « Avions couru » est au plus-que-parfait.
   - explication : Si + plus-que-parfait, puis conditionnel passé : nous aurions pris le bus. « Avions pris » est le plus-que-parfait. « Aurons pris » est le futur antérieur.
3. énoncé : Si j’avais le temps, j’… la guitare.
   - choix : apprendrais · aurais appris · apprendrai
   - réponse : apprendrais
   - indice : « Avais » est à l’imparfait : regarde la première ligne.
   - explication : Si + imparfait, puis conditionnel présent : j’apprendrais. « Aurais appris » va avec le plus-que-parfait. « Apprendrai » est le futur.
4. énoncé : Si elle … su, elle serait restée.
   - choix : avait · aurait
   - réponse : avait
   - indice : Relis la dernière ligne de la règle.
   - explication : Juste après « si », jamais de conditionnel : si elle avait su. Le conditionnel est dans l’autre partie de la phrase : elle serait restée.
5. énoncé : Sans ton aide, je … perdu.
   - choix : me serais · m’aurais · me serai
   - réponse : me serais
   - indice : « Se perdre » se conjugue avec être : je me suis perdu.
   - explication : On dit « je me suis perdu » : au conditionnel passé, je me serais perdu. « M’aurais » prend avoir, qui ne va pas avec « se perdre ». « Me serai » est le futur antérieur.
6. énoncé : Ils … gagné s’ils avaient joué ensemble.
   - choix : auraient · auront · avaient
   - réponse : auraient
   - indice : La partie avec « si » est au plus-que-parfait.
   - explication : S’ils avaient joué, ils auraient gagné : conditionnel passé. « Auront » est le futur. « Avaient » est le plus-que-parfait.
7. énoncé : Si vous étiez partis plus tôt, vous … à l’heure.
   - choix : seriez arrivés · serez arrivés · étiez arrivés
   - réponse : seriez arrivés
   - indice : « Étiez partis » est au plus-que-parfait.
   - explication : Si + plus-que-parfait, puis conditionnel passé : vous seriez arrivés. « Serez arrivés » est le futur antérieur. « Étiez arrivés » est le plus-que-parfait.
8. énoncé : À ta place, j’… demandé de l’aide.
   - choix : aurais · aurai · avais
   - réponse : aurais
   - indice : « À ta place » veut dire « si j’avais été à ta place ».
   - explication : « À ta place » pose une condition, comme « si » : j’aurais demandé, au conditionnel passé. « Aurai » est le futur. « Avais » est l’imparfait.

## Accords difficiles · `complex-agreements`

> F26 p. 19 (« Maitriser l’accord au sein du groupe nominal […] étendu », « l’accord de l’adjectif […] épithète, attribut et apposition », « l’accord du participe passé (auxiliaire avoir avec un complément d’objet direct pronom relatif placé avant le verbe) », « l’accord sujet-verbe dans des cas complexes (pronom collectif ou distributif comme sujet, groupe nominal incluant un complément du nom) ») ; 2020, p. 23. La Paroi des adjectifs et la Corde du participe du 4e posent les règles simples ; ici, le mot qui commande est loin ou caché.

- description : L’accord de l’adjectif dans un groupe nominal étendu, le participe passé après « que », puis le verbe avec un sujet difficile.
- compétences : c4.fr.langue.accord-gn-complexe · c4.fr.langue.participe-passe · c4.fr.langue.accord-verbe-complexe
- bravo : Bien accordé !
- erreur : {explanation}
- bloc gagné : french-3e-close-reading
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `french-3e-language-complex-agreements-1`

- consigne : Accorde l’adjectif avec le nom qui le commande. La règle est affichée.
- consigne courte : Touche l’adjectif bien accordé.

Pour tous les items :
- aide « Le nom qui commande » :
  - L’adjectif s’accorde avec le nom qu’il précise, même s’il est loin de lui.
  - Épithète, à côté du nom ; attribut, après être, sembler, paraître ; apposé, entre virgules.
  - Pose la question avec l’adjectif : qui est-ce qui est fermé ? les portes. La réponse est le nom qui commande.
  - Un nom masculin et un nom féminin ensemble : l’adjectif est au masculin pluriel.

1. énoncé : Les fenêtres de la vieille maison semblent …
   - choix : propre · propres
   - réponse : propres
   - indice : Qu’est-ce qui semble propre : la maison, ou les fenêtres ?
   - explication : Ce sont les fenêtres qui semblent propres : attribut de « les fenêtres », au féminin pluriel. « La maison » est un complément du nom : elle ne commande pas l’accord.
2. énoncé : Les joueuses, … par la course, boivent de l’eau.
   - choix : épuisé · épuisés · épuisées
   - réponse : épuisées
   - indice : Qui est épuisé ?
   - explication : Les joueuses sont épuisées : l’apposition s’accorde avec « les joueuses », au féminin pluriel.
3. énoncé : Une veste et un pantalon … sont posés sur le lit.
   - choix : noire · noirs · noires
   - réponse : noirs
   - indice : Un nom féminin et un nom masculin : relis la dernière ligne.
   - explication : Une veste (féminin) et un pantalon (masculin) : l’adjectif est au masculin pluriel, noirs.
4. énoncé : Ces histoires qu’on raconte le soir paraissent …
   - choix : effrayant · effrayants · effrayantes
   - réponse : effrayantes
   - indice : Qu’est-ce qui paraît effrayant ? Cherche le nom avant la relative.
   - explication : Ce sont les histoires qui paraissent effrayantes : féminin pluriel. La relative « qu’on raconte le soir » sépare le nom de l’adjectif.
5. énoncé : Les murs du château, … de lierre, sont très anciens.
   - choix : couvert · couverts · couverte
   - réponse : couverts
   - indice : Qu’est-ce qui est couvert de lierre : le château, ou les murs ?
   - explication : Ce sont les murs qui sont couverts : masculin pluriel. « Du château » est un complément du nom, il ne commande pas.
6. énoncé : Le ciel et la mer étaient … ce matin-là.
   - choix : gris · grise · grises
   - réponse : gris
   - indice : Un nom masculin et un nom féminin : relis la dernière ligne.
   - explication : Le ciel (masculin) et la mer (féminin) : masculin pluriel, gris. « Grise » s’accorde avec le mot le plus proche seulement.
7. énoncé : Elle porte des chaussures … pour courir.
   - choix : léger · légers · légères
   - réponse : légères
   - indice : L’adjectif est à côté du nom : quel est ce nom ?
   - explication : Des chaussures légères : épithète de « chaussures », au féminin pluriel. Le sujet « elle » ne commande pas cet adjectif.
8. énoncé : Mes cousines, très …, ont tout rangé.
   - choix : courageuse · courageuses · courageux
   - réponse : courageuses
   - indice : Qui est courageux ?
   - explication : Mes cousines sont courageuses : l’apposition s’accorde avec « mes cousines », au féminin pluriel.

### Niveau 2 · `french-3e-language-complex-agreements-2`

- consigne : Accorde le participe passé avec avoir. La règle est affichée.
- consigne courte : Touche le participe passé bien accordé.

Pour tous les items :
- aide « Avoir et le COD placé avant » :
  - Avec avoir, le participe passé ne s’accorde jamais avec le sujet.
  - Il s’accorde avec le COD seulement si ce COD est placé avant le verbe.
  - Dans « les fleurs que j’ai cueillies », « que » remplace « les fleurs » : c’est le COD, placé avant.
  - « Que » n’est jamais le sujet : le sujet vient après lui.

1. énoncé : Les lettres que tu as … sont arrivées.
   - choix : écrit · écrits · écrites
   - réponse : écrites
   - indice : « Que » remplace un nom placé juste avant : lequel ?
   - explication : Tu as écrit quoi ? « que », c’est-à-dire les lettres, placé avant : écrites, au féminin pluriel.
2. énoncé : Les gâteaux que ma sœur a … sont délicieux.
   - choix : préparé · préparés · préparée
   - réponse : préparés
   - indice : Avec avoir, le sujet ne commande jamais : cherche le COD.
   - explication : Ma sœur a préparé quoi ? « que », c’est-à-dire les gâteaux, placé avant : préparés. « Préparée » s’accorde avec le sujet, ce qu’avoir ne fait jamais.
3. énoncé : La chanson que nous avons … était triste.
   - choix : chanté · chantée · chantés
   - réponse : chantée
   - indice : « Que » remplace un nom placé juste avant : lequel ?
   - explication : Nous avons chanté quoi ? « que », c’est-à-dire la chanson, placé avant : chantée. « Chantés » s’accorde avec « nous », le sujet.
4. énoncé : Les élèves ont … leurs cahiers.
   - choix : rangé · rangés
   - réponse : rangé
   - indice : Le COD, « leurs cahiers », est-il avant ou après le verbe ?
   - explication : Le COD, « leurs cahiers », est placé après : pas d’accord, rangé. « Les élèves » est le sujet : avec avoir, il ne commande pas.
5. énoncé : Les photos que Léo a … sont floues.
   - choix : pris · prise · prises
   - réponse : prises
   - indice : « Que » remplace un nom placé juste avant : lequel ?
   - explication : Léo a pris quoi ? « que », c’est-à-dire les photos, placé avant : prises. On entend le s : prises.
6. énoncé : La voiture qu’ils ont … est rouge.
   - choix : acheté · achetée · achetés
   - réponse : achetée
   - indice : Avec avoir, le sujet ne commande jamais : cherche le COD.
   - explication : Ils ont acheté quoi ? « que », c’est-à-dire la voiture, placé avant : achetée. « Achetés » s’accorde avec « ils », le sujet.
7. énoncé : Les films que j’ai … m’ont plu.
   - choix : vu · vus · vues
   - réponse : vus
   - indice : « Que » remplace un nom placé juste avant : lequel ?
   - explication : J’ai vu quoi ? « que », c’est-à-dire les films, placé avant : vus, au masculin pluriel.
8. énoncé : Elles ont … une belle cabane.
   - choix : construit · construite · construites
   - réponse : construit
   - indice : Le COD, « une belle cabane », est-il avant ou après le verbe ?
   - explication : Le COD est placé après le verbe : pas d’accord, construit. « Construites » s’accorde avec « elles », le sujet.

### Niveau 3 · `french-3e-language-complex-agreements-3`

- consigne : Trouve le mot qui commande, puis accorde le verbe. La règle est affichée.
- consigne courte : Touche le verbe accordé avec son sujet.

Pour tous les items :
- aide « Le sujet difficile » :
  - Le verbe s’accorde avec le mot principal du sujet : le chien des voisins aboie.
  - Le, la ou ce, puis un nom collectif (la foule, le groupe) : verbe au singulier.
  - Chacun, aucun : verbe au singulier. La plupart des, beaucoup de : verbe au pluriel.
  - « Qui » prend la personne du mot qu’il remplace : c’est moi qui chante.

1. énoncé : La plupart des élèves … déjà partis.
   - choix : est · sont
   - réponse : sont
   - indice : Relis la troisième ligne de la règle.
   - explication : Après « la plupart des », le verbe est au pluriel : la plupart des élèves sont partis.
2. énoncé : Chacun de mes amis … un vélo.
   - choix : a · ont
   - réponse : a
   - indice : Qui a un vélo ? Chacun : un par un.
   - explication : Le sujet est « chacun » : verbe au singulier, a. « Mes amis » est un complément : il ne commande pas.
3. énoncé : Le chien des voisins … toute la nuit.
   - choix : aboie · aboient
   - réponse : aboie
   - indice : Qui aboie : le chien, ou les voisins ?
   - explication : C’est le chien qui aboie : le mot principal du sujet est « chien », au singulier. « Des voisins » est un complément du nom.
4. énoncé : La foule des supporters … le stade.
   - choix : envahit · envahissent
   - réponse : envahit
   - indice : « La », puis un nom collectif : relis la deuxième ligne.
   - explication : Le sujet est « la foule », un nom collectif au singulier : envahit. « Des supporters » est un complément du nom.
5. énoncé : Aucun des joueurs ne … fatigué.
   - choix : semble · semblent
   - réponse : semble
   - indice : Le sujet est « aucun » : relis la troisième ligne.
   - explication : Avec « aucun », le verbe est au singulier : aucun ne semble fatigué. « Des joueurs » est un complément.
6. énoncé : C’est moi qui … la vaisselle ce soir.
   - choix : fais · fait · font
   - réponse : fais
   - indice : « Qui » remplace « moi » : le verbe est à la personne de « je ».
   - explication : « Qui » remplace « moi » : le verbe prend la personne de « je », je fais. « Fait » est la forme de « il ».
7. énoncé : Les clés de la voiture … sur la table.
   - choix : est · sont
   - réponse : sont
   - indice : Qu’est-ce qui est sur la table : la voiture, ou les clés ?
   - explication : Ce sont les clés qui sont sur la table : le mot principal du sujet est « clés », au pluriel. « De la voiture » est un complément du nom.
8. énoncé : Le groupe d’enfants … dans le parc.
   - choix : joue · jouent
   - réponse : joue
   - indice : « Le », puis un nom collectif : relis la deuxième ligne.
   - explication : Le sujet est « le groupe », un nom collectif au singulier : joue. « D’enfants » est un complément du nom.

## Connotation · `connotation`

> F26 p. 15 (« Distinguer la dénotation et la connotation et comprendre les types de connotations », « Compléter son lexique de l’analyse littéraire, en particulier celui de la poésie et de l’argumentation », « Identifier et interpréter les effets de mise en réseau des mots dans le texte ») ; 2020, p. 25 (sens des mots : dénotation et connotation ; réseaux de mots : champ lexical). Les extraits sont originaux, trois lignes au plus, un seul à l’écran ; un mot se juge toujours dans sa phrase.

- description : L’image qu’un mot ajoute à son sens, les mots pour analyser un poème ou un texte qui argumente, puis l’impression que donnent des mots qui vont ensemble.
- compétences : c4.fr.langue.sens-des-mots · c4.fr.langue.reseaux-de-mots
- bravo : Bien lu !
- erreur : {explanation}
- bloc gagné : french-3e-close-reading
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `french-3e-language-connotation-1`

- consigne : Lis l’extrait : quelle image donne le mot ? La règle est affichée.
- consigne courte : Lis l’extrait, puis touche l’image du mot.

Pour tous les items :
- aide « Dénotation et connotation » :
  - La dénotation : le sens du dictionnaire, le même pour tous.
  - La connotation : ce que le mot ajoute à ce sens, une image, un jugement.
  - Mélioratif : une image positive. Péjoratif : une image négative. Neutre : aucune image.
  - Juge toujours le mot dans sa phrase.

1. énoncé : « Le vieux bâtiment était devenu une bicoque où personne n’entrait plus. » Quelle image donne le mot « bicoque » ?
   - sujet : une bicoque
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : Le vieux bâtiment était devenu une bicoque où personne n’entrait plus. Quelle image donne le mot « bicoque » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : péjoratif
   - indice : Aurais-tu envie d’entrer dans une bicoque ?
   - explication : « Bicoque » désigne une maison, avec une image de maison pauvre et mal tenue : il est péjoratif. Le mot neutre serait « maison ».
2. énoncé : « Au fond du jardin se dressait une demeure élégante, aux volets bleus. » Quelle image donne le mot « demeure » ?
   - sujet : une demeure
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : Au fond du jardin se dressait une demeure élégante, aux volets bleus. Quelle image donne le mot « demeure » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : mélioratif
   - indice : Le mot va avec « élégante » : quelle image en ressort ?
   - explication : « Demeure » désigne une maison, avec une image de grande et belle maison : il est mélioratif.
3. énoncé : « La maison a trois chambres et un garage. » Quelle image donne le mot « maison » ?
   - sujet : la maison
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : La maison a trois chambres et un garage. Quelle image donne le mot « maison » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : neutre
   - indice : La phrase décrit-elle, ou juge-t-elle ?
   - explication : Ici, « maison » donne son sens sans rien ajouter : la phrase décrit, elle ne juge pas. Le mot est neutre.
4. énoncé : « Un chauffard a traversé le carrefour sans s’arrêter au feu rouge. » Quelle image donne le mot « chauffard » ?
   - sujet : un chauffard
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : Un chauffard a traversé le carrefour sans s’arrêter au feu rouge. Quelle image donne le mot « chauffard » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : péjoratif
   - indice : Compare avec « un conducteur ».
   - explication : « Chauffard » désigne un conducteur, avec un jugement : il conduit mal et met les autres en danger. Il est péjoratif.
5. énoncé : « Le chevalier sauta sur son destrier et partit au galop. » Quelle image donne le mot « destrier » ?
   - sujet : un destrier
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : Le chevalier sauta sur son destrier et partit au galop. Quelle image donne le mot « destrier » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : mélioratif
   - indice : Compare avec « un cheval » : lequel fait plus noble ?
   - explication : « Destrier » désigne un cheval, avec l’image d’un noble cheval de chevalier : il est mélioratif.
6. énoncé : « Le conducteur s’arrête au feu rouge et laisse passer les piétons. » Quelle image donne le mot « conducteur » ?
   - sujet : le conducteur
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : Le conducteur s’arrête au feu rouge et laisse passer les piétons. Quelle image donne le mot « conducteur » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : neutre
   - indice : Le mot ajoute-t-il un jugement à son sens ?
   - explication : « Conducteur » dit seulement qui conduit : il n’ajoute aucune image. Il est neutre.
7. énoncé : « Un relent de poisson flottait dans la cuisine. » Quelle image donne le mot « relent » ?
   - sujet : un relent
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : Un relent de poisson flottait dans la cuisine. Quelle image donne le mot « relent » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : péjoratif
   - indice : Compare avec « une odeur ».
   - explication : « Relent » désigne une odeur, avec l’image d’une odeur mauvaise qui reste : il est péjoratif.
8. énoncé : « Un parfum de lilas montait du jardin. » Quelle image donne le mot « parfum » ?
   - sujet : un parfum
   - geste : ranger
   - scène : ""
   - consigne courte : Range chaque fiche.
   - lu : Un parfum de lilas montait du jardin. Quelle image donne le mot « parfum » ?
   - choix : mélioratif · péjoratif · neutre
   - réponse : mélioratif
   - indice : Compare avec « une odeur ».
   - explication : « Parfum » désigne une odeur, avec l’image d’une odeur agréable : il est mélioratif.

### Niveau 2 · `french-3e-language-connotation-2`

- consigne : Trouve le mot qui sert à analyser le texte. Les définitions sont affichées.
- consigne courte : Touche le mot d’analyse du texte.

Pour tous les items :
- aide « Les mots pour analyser » :
  - Vers : une ligne d’un poème. Strophe : un groupe de vers. Quatrain : une strophe de quatre vers.
  - Rime : le même son à la fin de deux vers. Alexandrin : un vers de douze syllabes.
  - Thèse : l’idée qu’on défend. Argument : une raison qui la soutient. Exemple : un fait qui l’illustre.
  - Concession : ce qu’on accorde à l’autre avant de répondre (certes, bien sûr).

1. énoncé : Deux vers d’un poème finissent par « plaine » et par « peine ». Que forment ces deux mots ?
   - lu : Deux vers d’un poème finissent par « plaine » et par « peine ». Que forment ces deux mots ?
   - choix : une rime · une strophe · un vers
   - réponse : une rime
   - indice : Écoute la fin des deux vers.
   - explication : « Plaine » et « peine » finissent par le même son, à la fin de deux vers : c’est une rime.
2. énoncé : Un poème a quatre groupes de vers séparés par une ligne blanche. Chaque groupe est …
   - lu : Un poème a quatre groupes de vers séparés par une ligne blanche. Chaque groupe est (mot manquant).
   - choix : une strophe · une rime · un vers
   - réponse : une strophe
   - indice : Un vers est une seule ligne. Que forme un groupe de vers ?
   - explication : Un groupe de vers est une strophe. Un vers est une seule ligne ; une rime est un son.
3. énoncé : « Il faut lire chaque jour, car la lecture enrichit le vocabulaire. » Que fait « la lecture enrichit le vocabulaire » ?
   - lu : Il faut lire chaque jour, car la lecture enrichit le vocabulaire. Que fait « la lecture enrichit le vocabulaire » ?
   - choix : la thèse · un argument · un exemple
   - réponse : un argument
   - indice : Le mot « car » annonce une raison.
   - explication : « Car » annonce une raison qui soutient l’idée « il faut lire chaque jour » : c’est un argument. L’idée défendue, la thèse, est « il faut lire chaque jour ».
4. énoncé : « Les écrans fatiguent les yeux. Après deux heures de jeu, Tom avait les yeux rouges. » Que fait la deuxième phrase ?
   - lu : Les écrans fatiguent les yeux. Après deux heures de jeu, Tom avait les yeux rouges. Que fait la deuxième phrase ?
   - choix : la thèse · un argument · un exemple
   - réponse : un exemple
   - indice : La deuxième phrase raconte un fait précis.
   - explication : La deuxième phrase raconte un fait précis, arrivé à Tom, qui illustre l’argument : c’est un exemple.
5. énoncé : Un texte commence par : « Le collège devrait ouvrir une salle de musique. » Puis il donne des raisons. Que fait cette première phrase ?
   - lu : Un texte commence par : Le collège devrait ouvrir une salle de musique. Puis il donne des raisons. Que fait cette première phrase ?
   - choix : la thèse · un argument · un exemple
   - réponse : la thèse
   - indice : Les raisons qui suivent soutiennent quelle idée ?
   - explication : C’est l’idée que tout le texte défend, avec ses raisons : la thèse.
6. énoncé : Un vers de douze syllabes s’appelle …
   - lu : Un vers de douze syllabes s’appelle (mot manquant).
   - choix : un alexandrin · un quatrain · une rime
   - réponse : un alexandrin
   - indice : Relis la deuxième ligne.
   - explication : Un vers de douze syllabes est un alexandrin. Un quatrain est une strophe de quatre vers.
7. énoncé : « Certes, les jeux vidéo amusent ; mais ils prennent beaucoup de temps. » Que fait « Certes, les jeux vidéo amusent » ?
   - lu : Certes, les jeux vidéo amusent ; mais ils prennent beaucoup de temps. Que fait « Certes, les jeux vidéo amusent » ?
   - choix : une concession · un exemple · la thèse
   - réponse : une concession
   - indice : « Certes » accorde quelque chose, puis « mais » répond.
   - explication : « Certes » accorde une idée à l’autre, avant que « mais » ne réponde : c’est une concession.
8. énoncé : Une strophe de quatre vers s’appelle …
   - lu : Une strophe de quatre vers s’appelle (mot manquant).
   - choix : un quatrain · un alexandrin · une rime
   - réponse : un quatrain
   - indice : Relis la première ligne.
   - explication : Une strophe de quatre vers est un quatrain. Un alexandrin est un vers de douze syllabes.

### Niveau 3 · `french-3e-language-connotation-3`

- consigne : Relève les mots qui vont ensemble : quelle impression donnent-ils ? La règle est affichée.
- consigne courte : Touche l’impression que donnent ces mots.

Pour tous les items :
- aide « Des mots qui vont ensemble » :
  - Un champ lexical : des mots qui parlent d’un même thème.
  - Ensemble, ces mots créent une impression : la peur, le calme, la joie.
  - Relève les mots qui vont ensemble, puis demande-toi ce qu’ils font ressentir.

1. énoncé : « Les volets claquaient, une ombre glissait dans le couloir, le plancher gémissait sous nos pas. » Quelle impression donne l’extrait ?
   - lu : Les volets claquaient, une ombre glissait dans le couloir, le plancher gémissait sous nos pas. Quelle impression donne l’extrait ?
   - choix : la peur · la joie · le calme
   - réponse : la peur
   - indice : Relève « claquaient », « ombre », « gémissait ».
   - explication : « Claquaient », « ombre », « gémissait » : des bruits et une présence inquiétante. Ensemble, ces mots donnent une impression de peur.
2. énoncé : « Le lac dormait, une brise légère caressait l’herbe, les oiseaux se taisaient. » Quelle impression donne l’extrait ?
   - lu : Le lac dormait, une brise légère caressait l’herbe, les oiseaux se taisaient. Quelle impression donne l’extrait ?
   - choix : le calme · la colère · la peur
   - réponse : le calme
   - indice : Relève « dormait », « légère », « caressait », « se taisaient ».
   - explication : « Dormait », « légère », « caressait », « se taisaient » : rien ne bouge fort, rien ne fait de bruit. L’impression est le calme.
3. énoncé : « Il hurla, frappa la table du poing et claqua la porte derrière lui. » Quelle impression donne l’extrait ?
   - lu : Il hurla, frappa la table du poing et claqua la porte derrière lui. Quelle impression donne l’extrait ?
   - choix : la tristesse · la colère · la surprise
   - réponse : la colère
   - indice : Relève « hurla », « frappa », « claqua ».
   - explication : « Hurla », « frappa », « claqua » : des gestes et des bruits violents. Ensemble, ils disent la colère.
4. énoncé : « Sous la pluie grise, elle relisait la vieille lettre, les yeux mouillés. » Quelle impression donne l’extrait ?
   - lu : Sous la pluie grise, elle relisait la vieille lettre, les yeux mouillés. Quelle impression donne l’extrait ?
   - choix : la tristesse · la colère · la joie
   - réponse : la tristesse
   - indice : Relève « pluie grise », « vieille lettre », « yeux mouillés ».
   - explication : « Pluie grise », « vieille lettre », « yeux mouillés » : des images sombres et des larmes. L’impression est la tristesse.
5. énoncé : « Les rires fusaient, la musique éclatait, on dansait jusque dans la rue. » Quelle impression donne l’extrait ?
   - lu : Les rires fusaient, la musique éclatait, on dansait jusque dans la rue. Quelle impression donne l’extrait ?
   - choix : l’ennui · la joie · la peur
   - réponse : la joie
   - indice : Relève « rires », « musique », « dansait ».
   - explication : « Rires », « musique », « dansait » : le champ lexical de la fête. L’impression est la joie.
6. énoncé : « Les heures s’étiraient ; il regardait la pendule, bâillait, tournait les pages sans les lire. » Quelle impression donne l’extrait ?
   - lu : Les heures s’étiraient ; il regardait la pendule, bâillait, tournait les pages sans les lire. Quelle impression donne l’extrait ?
   - choix : la colère · la joie · l’ennui
   - réponse : l’ennui
   - indice : Relève « s’étiraient », « pendule », « bâillait ».
   - explication : « S’étiraient », « pendule », « bâillait », « sans les lire » : le temps passe lentement, rien n’intéresse. L’impression est l’ennui.
7. énoncé : « Le sable brûlait sous ses pieds ; la gorge sèche, il cherchait une goutte d’eau. » Quelle impression donne l’extrait ?
   - lu : Le sable brûlait sous ses pieds ; la gorge sèche, il cherchait une goutte d’eau. Quelle impression donne l’extrait ?
   - choix : le froid · la fête · la chaleur
   - réponse : la chaleur
   - indice : Relève « brûlait », « sèche », « goutte d’eau ».
   - explication : « Brûlait », « gorge sèche », « goutte d’eau » : le champ lexical de la chaleur et de la soif. L’impression est la chaleur.
8. énoncé : « Le givre couvrait les vitres, le vent glacé mordait les joues, les doigts devenaient raides. » Quelle impression donne l’extrait ?
   - lu : Le givre couvrait les vitres, le vent glacé mordait les joues, les doigts devenaient raides. Quelle impression donne l’extrait ?
   - choix : le froid · la chaleur · le calme
   - réponse : le froid
   - indice : Relève « givre », « glacé », « raides ».
   - explication : « Givre », « glacé », « raides » : le champ lexical du froid. L’impression est le froid.

## Ponctuation et relief · `emphasis-punctuation`

> F26 p. 18 (« Employer à bon escient le point-virgule et la virgule dans des phrases aux structures plus complexes », « Identifier la phrase de forme emphatique et ses différents modes de construction ») et p. 19 (registres : « Adapter son registre de langue dans le cadre d’un oral scolaire », « Comprendre que les écrivains peuvent employer tous les registres de langue selon les effets recherchés ») ; 2020, p. 23 (ponctuation) et p. 25 (niveaux de langue). La phrase emphatique (niveau 2) est de 2026 seul : la liste de 2020 (`c4.fr.langue.types-formes`, p. 22) ne la nomme pas. Le registre familier n’est jamais « faux » : c’est un registre à choisir selon la situation ; le Cabinet des mots du 4e (`nuances`) fait déjà reconnaître les registres, on choisit ici selon la situation et on lit l’effet chez un écrivain.

- description : Virgule, point-virgule ou point, la phrase qui met un mot en relief, puis le registre qui convient et l’effet qu’il produit.
- compétences : c4.fr.langue.ponctuation · c4.fr.langue.sens-des-mots · c4.fr.langue.oral-ecrit
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : french-3e-close-reading
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `french-3e-language-emphasis-punctuation-1`

- consigne : Quel signe va à la place du trou ? La règle est affichée.
- consigne courte : Touche le signe qui va dans le trou.

Pour tous les items :
- trou lu : " (signe manquant) "
- aide « Virgule, point-virgule, point » :
  - La virgule sépare des mots d’une liste, ou un groupe déplacé en tête de phrase.
  - Le point-virgule sépare deux propositions liées par le sens, surtout quand elles ont déjà des virgules.
  - Le point termine la phrase : après lui, une majuscule.
- choix : une virgule · un point-virgule · un point

1. énoncé : J’ai acheté des pommes … des poires et des fraises.
   - réponse : une virgule
   - indice : Des pommes, des poires, des fraises : qu’est-ce que c’est ?
   - explication : C’est une liste : la virgule sépare ses mots, et « et » relie les deux derniers.
2. énoncé : Le matin, Léa court dans le parc … le soir, elle lit au jardin.
   - réponse : un point-virgule
   - indice : Deux propositions, qui ont chacune déjà une virgule.
   - explication : Deux propositions liées par le sens, qui ont déjà des virgules : le point-virgule les sépare sans les couper. Le mot qui suit, « le », n’a pas de majuscule : pas de point.
3. énoncé : Il est tard … Les rues sont vides.
   - réponse : un point
   - indice : Regarde le mot après le trou : a-t-il une majuscule ?
   - explication : « Les » commence par une majuscule : une nouvelle phrase commence, il faut un point.
4. énoncé : Dans la cour … les élèves jouent au ballon.
   - réponse : une virgule
   - indice : « Dans la cour » est un groupe placé en tête de phrase.
   - explication : « Dans la cour » est un complément déplacé en tête : une virgule le sépare du reste de la phrase.
5. énoncé : Les uns chantaient … les autres, assis par terre, écoutaient.
   - réponse : un point-virgule
   - indice : La deuxième proposition a déjà des virgules.
   - explication : Deux propositions qui se répondent, la seconde avec ses virgules : le point-virgule les sépare clairement. « Les », sans majuscule, exclut le point.
6. énoncé : Paul … mon voisin, joue du piano.
   - réponse : une virgule
   - indice : « Mon voisin » dit qui est Paul : c’est une apposition.
   - explication : « Mon voisin » est apposé à « Paul » : il se met entre deux virgules.
7. énoncé : Nous partirons à l’aube … Prends ton sac.
   - réponse : un point
   - indice : Regarde le mot après le trou : a-t-il une majuscule ?
   - explication : « Prends » commence par une majuscule : c’est une nouvelle phrase, il faut un point.
8. énoncé : En été, la plage est pleine … en hiver, elle est déserte.
   - réponse : un point-virgule
   - indice : Deux propositions, qui ont chacune déjà une virgule.
   - explication : Deux propositions qui s’opposent, chacune avec sa virgule : le point-virgule les sépare. « En », sans majuscule, exclut le point.

### Niveau 2 · `french-3e-language-emphasis-punctuation-2`

- consigne : Trouve le mot mis en relief, ou la phrase qui le met en relief. La règle est affichée.
- consigne courte : Touche le mot ou la phrase en relief.

Pour tous les items :
- aide « La mise en relief » :
  - Une phrase emphatique met un mot ou un groupe en avant.
  - Avec « c’est », le mot mis en avant, puis « qui » ou « que » : c’est Léa qui a gagné.
  - Avec un groupe détaché en tête, repris par un pronom : ce film, je l’adore.
  - Sans la mise en relief, la phrase garde son sens : Léa a gagné.

1. énoncé : Quelle phrase met « Tom » en relief ?
   - lu : Quelle phrase met « Tom » en relief ?
   - choix : C’est Tom qui a rangé la salle. · Tom a rangé la salle. · Tom n’a pas rangé la salle.
   - réponse : C’est Tom qui a rangé la salle.
   - indice : Cherche « c’est », puis « qui ».
   - explication : « C’est Tom qui » met Tom en avant : la phrase est emphatique. « Tom a rangé la salle » est neutre. « Tom n’a pas rangé la salle » est négative : elle change le sens.
2. énoncé : « Ce livre, je l’ai lu trois fois. » Quel groupe est mis en relief ?
   - lu : Ce livre, je l’ai lu trois fois. Quel groupe est mis en relief ?
   - choix : ce livre · je · trois fois
   - réponse : ce livre
   - indice : Quel groupe est détaché en tête, puis repris par « l’ » ?
   - explication : « Ce livre » est détaché en tête, puis repris par le pronom « l’ » : il est mis en relief. Sans relief : j’ai lu ce livre trois fois.
3. énoncé : « C’est demain que nous partons. » Comment est cette phrase ?
   - lu : C’est demain que nous partons. Comment est cette phrase ?
   - choix : emphatique · négative · interrogative
   - réponse : emphatique
   - indice : Cherche « c’est », puis « que ».
   - explication : « C’est demain que » met « demain » en avant : la phrase est emphatique. Sans relief : nous partons demain.
4. énoncé : « Nous ne partons pas demain. » Comment est cette phrase ?
   - lu : Nous ne partons pas demain. Comment est cette phrase ?
   - choix : emphatique · négative · interrogative
   - réponse : négative
   - indice : Cherche « ne » et « pas » autour du verbe.
   - explication : « Ne » et « pas », autour du verbe, rendent la phrase négative : elle dit le contraire. Aucun mot n’est mis en avant : elle n’est pas emphatique.
5. énoncé : « Moi, je préfère la mer. » Quel mot est mis en relief ?
   - lu : Moi, je préfère la mer. Quel mot est mis en relief ?
   - choix : moi · je · la mer
   - réponse : moi
   - indice : Quel mot est détaché en tête, avec une virgule ?
   - explication : « Moi » est détaché en tête, puis repris par « je » : il est mis en relief. « Je » est le sujet ordinaire.
6. énoncé : Quelle phrase met « le chocolat » en relief ?
   - lu : Quelle phrase met « le chocolat » en relief ?
   - choix : C’est le chocolat que j’aime. · J’aime le chocolat. · J’aime beaucoup le chocolat.
   - réponse : C’est le chocolat que j’aime.
   - indice : Cherche « c’est », puis « que ».
   - explication : « C’est le chocolat que » met le chocolat en avant : la phrase est emphatique. « Beaucoup » dit combien on aime, il ne met pas le mot en relief.
7. énoncé : « C’est dans ce village que je suis né. » Quel groupe est mis en relief ?
   - lu : C’est dans ce village que je suis né. Quel groupe est mis en relief ?
   - choix : dans ce village · je · suis né
   - réponse : dans ce village
   - indice : Quel groupe est entre « c’est » et « que » ?
   - explication : « Dans ce village » est entre « c’est » et « que » : il est mis en relief. Sans relief : je suis né dans ce village.
8. énoncé : « Cette chanson, elle me rend joyeux. » Quel groupe est mis en relief ?
   - lu : Cette chanson, elle me rend joyeux. Quel groupe est mis en relief ?
   - choix : cette chanson · me · joyeux
   - réponse : cette chanson
   - indice : Quel groupe est détaché en tête, puis repris par « elle » ?
   - explication : « Cette chanson » est détachée en tête, puis reprise par « elle » : elle est mise en relief. Sans relief : cette chanson me rend joyeux.

### Niveau 3 · `french-3e-language-emphasis-punctuation-3`

- consigne : Quel registre convient, et quel effet produit-il ? La règle est affichée.
- consigne courte : Touche le registre qui convient et son effet.

Pour tous les items :
- aide « Choisir son registre » :
  - Familier, courant, soutenu : chaque registre a sa place.
  - À l’oral en classe ou à un examen : le registre courant, ou soutenu.
  - Un écrivain choisit le registre selon l’effet : le familier rend un personnage vivant et proche.
  - Le soutenu rend une scène solennelle, ou drôle quand il ne va pas avec la situation.

1. énoncé : Dans un roman, un garçon dit à son ami : « T’inquiète, j’arrive ! » Pourquoi l’écrivain choisit-il le registre familier ?
   - lu : Dans un roman, un garçon dit à son ami : T’inquiète, j’arrive ! Pourquoi l’écrivain choisit-il le registre familier ?
   - choix : pour rendre le personnage vivant · parce que l’écrivain se trompe · pour rendre la scène solennelle
   - réponse : pour rendre le personnage vivant
   - indice : Relis la troisième ligne de la règle.
   - explication : L’écrivain fait parler le garçon comme on parle entre amis : le personnage paraît vivant et proche. Ce n’est pas une erreur : c’est un choix.
2. énoncé : Pendant ton exposé, quelle phrase choisis-tu ?
   - lu : Pendant ton exposé, quelle phrase choisis-tu ?
   - choix : Ce document montre que la ville a beaucoup grandi. · Ce doc, il montre que la ville a grave grandi.
   - réponse : Ce document montre que la ville a beaucoup grandi.
   - indice : Relis la deuxième ligne de la règle.
   - explication : À l’oral en classe, on choisit le registre courant : « ce document », « beaucoup ». « Doc » et « grave » sont familiers : ils vont bien entre amis.
3. énoncé : Dans une comédie, un enfant dit à table : « Monsieur mon père, auriez-vous l’obligeance de me passer le sel ? » Quel effet produit ce registre soutenu ?
   - lu : Dans une comédie, un enfant dit à table : Monsieur mon père, auriez-vous l’obligeance de me passer le sel ? Quel effet produit ce registre soutenu ?
   - choix : faire sourire · faire peur · rendre triste
   - réponse : faire sourire
   - indice : Un repas de famille et une phrase très solennelle : vont-ils ensemble ?
   - explication : Des mots très solennels pour une chose simple, à table, en famille : ils ne vont pas avec la situation. Le décalage fait sourire.
4. énoncé : Pour répondre à l’oral d’un examen, quel registre choisis-tu ?
   - lu : Pour répondre à l’oral d’un examen, quel registre choisis-tu ?
   - choix : courant ou soutenu · familier
   - réponse : courant ou soutenu
   - indice : Relis la deuxième ligne de la règle.
   - explication : À un examen, on parle à un jury : on choisit le registre courant, ou soutenu. Le familier garde sa place entre amis.
5. énoncé : Un personnage crie : « Je m’en fiche, de ton gâteau ! » Que montre ici le registre familier ?
   - lu : Un personnage crie : Je m’en fiche, de ton gâteau ! Que montre ici le registre familier ?
   - choix : sa colère · sa politesse · son calme
   - réponse : sa colère
   - indice : Il crie : quel sentiment ?
   - explication : Le personnage crie, avec un mot familier, « je m’en fiche » : l’écrivain montre sa colère, sur le vif.
6. énoncé : Dans un poème, l’auteur écrit « l’onde » au lieu de « l’eau ». Quel est le registre de « l’onde » ?
   - lu : Dans un poème, l’auteur écrit « l’onde » au lieu de « l’eau ». Quel est le registre de « l’onde » ?
   - choix : soutenu · courant · familier
   - réponse : soutenu
   - indice : Lequel des deux mots dirais-tu tous les jours ?
   - explication : « L’eau » est courant ; « l’onde » est un mot rare et poétique : il est soutenu. Le poète le choisit pour sa beauté.
7. énoncé : Pour commencer ton exposé, quelle phrase choisis-tu ?
   - lu : Pour commencer ton exposé, quelle phrase choisis-tu ?
   - choix : Je vais vous présenter les volcans. · Bon, les volcans, c’est un truc de ouf.
   - réponse : Je vais vous présenter les volcans.
   - indice : Relis la deuxième ligne de la règle.
   - explication : Devant la classe, on choisit le registre courant : « Je vais vous présenter les volcans. » « Un truc de ouf » est familier : il va bien entre amis.
8. énoncé : Dans une pièce de théâtre, le roi se lève et dit : « Qu’on me laisse seul. » Quel effet produit ce registre soutenu ?
   - lu : Dans une pièce de théâtre, le roi se lève et dit : Qu’on me laisse seul. Quel effet produit ce registre soutenu ?
   - choix : rendre la scène solennelle · faire rire · rendre le roi familier
   - réponse : rendre la scène solennelle
   - indice : Un roi, debout, qui donne un ordre : la scène est-elle sérieuse ?
   - explication : Le roi parle en registre soutenu, qui va avec son rang : la scène devient solennelle.

## Écrire juste · `verb-stems`

> F26 p. 15 (« Développer un raisonnement pour résoudre les difficultés orthographiques des radicaux verbaux (conditionnel, subjonctif) ») et p. 19 (« Maitriser la conjugaison des verbes réguliers et des principaux verbes irréguliers en fonction de la variation de leur radical ») ; 2020, p. 24 (« Former les temps simples […] à partir des bases verbales »). Repli du référent dys : deux niveaux, les radicaux seuls ; les homophones lexicaux sont ailleurs (note en tête du fichier). La phrase donne toujours le temps.

- description : Le radical des verbes au futur et au conditionnel (courrai, courrais, verrai), puis au subjonctif (que nous voyions, qu’il fasse).
- compétences : c4.fr.langue.morphologie-verbale · c4.fr.langue.temps-a-memoriser
- bravo : Bien écrit !
- erreur : {explanation}
- bloc gagné : french-3e-close-reading
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `french-3e-language-verb-stems-1`

- consigne : Choisis la bonne écriture du verbe. La règle est affichée.
- consigne courte : Touche la bonne écriture du verbe.

Pour tous les items :
- aide « Futur ou conditionnel ? » :
  - Futur : -rai, -ras, -ra. Conditionnel : -rais, -rais, -rait. On les entend pareil avec « je ».
  - Pour choisir, mets « nous » : nous courrons (futur), nous courrions (conditionnel).
  - Courir, mourir, voir, envoyer : deux r. Je courrai, il mourra, je verrai, j’enverrai.
  - Les verbes en -er gardent leur e, même muet : j’oublierai.

1. énoncé : Demain, je … jusqu’au parc.
   - choix : courai · courrai · courrais
   - réponse : courrai
   - indice : « Demain » annonce le futur. Courir prend deux r.
   - explication : « Demain » : futur, je courrai, avec deux r et -rai. « Courrais » est le conditionnel. « Courai » n’a qu’un r.
2. énoncé : Si j’avais le temps, je … plus souvent.
   - choix : courrai · courrais
   - réponse : courrais
   - indice : « Si » + imparfait : c’est le conditionnel. Essaie avec « nous ».
   - explication : Si nous avions le temps, nous courrions : c’est le conditionnel, je courrais, avec -rais. « Courrai » est le futur.
3. énoncé : L’an prochain, nous … la mer.
   - choix : verrons · voirons · verons
   - réponse : verrons
   - indice : Au futur, « voir » change de radical et prend deux r.
   - explication : Au futur, « voir » devient « verr- » : nous verrons. « Voirons » garde le radical de l’infinitif. « Verons » n’a qu’un r.
4. énoncé : Demain, je t’… une carte postale.
   - choix : enverrai · envoierai · envoyerai
   - réponse : enverrai
   - indice : Au futur, « envoyer » change de radical, comme « voir ».
   - explication : Au futur, « envoyer » devient « enverr- » : j’enverrai. « Envoierai » et « envoyerai » gardent le radical du présent.
5. énoncé : Je n’… jamais ce voyage, je te le promets.
   - choix : oublirai · oublierai
   - réponse : oublierai
   - indice : Relis la dernière ligne de la règle.
   - explication : « Oublier » finit par -er : il garde son e au futur, même muet, j’oublierai. « Oublirai » perd ce e.
6. énoncé : S’il faisait beau, ils … dehors.
   - choix : mangeraient · mangeront
   - réponse : mangeraient
   - indice : « Si » + imparfait : c’est le conditionnel.
   - explication : Après « si » + imparfait, le verbe est au conditionnel : ils mangeraient. « Mangeront » est le futur.
7. énoncé : Si tu ne l’arroses pas, la plante …
   - choix : mourra · moura · mourrait
   - réponse : mourra
   - indice : « Si » + présent : c’est le futur. Mourir prend deux r.
   - explication : Après « si » + présent, le verbe est au futur : elle mourra, avec deux r. « Mourrait » est le conditionnel. « Moura » n’a qu’un r.
8. énoncé : Si j’avais un vélo, j’… au collège seul.
   - choix : irai · irais
   - réponse : irais
   - indice : « Si » + imparfait : c’est le conditionnel. Essaie avec « nous ».
   - explication : Si nous avions un vélo, nous irions : c’est le conditionnel, j’irais, avec -rais. « Irai » est le futur.

### Niveau 2 · `french-3e-language-verb-stems-2`

- consigne : Choisis la bonne écriture du verbe au subjonctif. La règle est affichée.
- consigne courte : Touche la bonne écriture du verbe au subjonctif.

Pour tous les items :
- aide « Le radical au subjonctif » :
  - Avec nous et vous, le subjonctif finit par -ions et -iez : que nous voyions, que vous croyiez.
  - On entend à peine le i après le y : il faut l’écrire.
  - Certains verbes changent de radical : que je fasse, que je puisse, que je sache, que j’aille.

1. énoncé : Il faut que nous … ce film.
   - choix : voyons · voyions
   - réponse : voyions
   - indice : « Il faut que » + nous : relis la première ligne.
   - explication : Au subjonctif, avec « nous », la terminaison est -ions : que nous voyions, avec y puis i. « Voyons » est l’indicatif.
2. énoncé : Il faut que vous me … !
   - choix : croyez · croyiez
   - réponse : croyiez
   - indice : « Il faut que » + vous : relis la première ligne.
   - explication : Au subjonctif, avec « vous », la terminaison est -iez : que vous croyiez. « Croyez » est l’indicatif.
3. énoncé : Il faut que je … mes devoirs.
   - choix : fais · fasse · face
   - réponse : fasse
   - indice : Au subjonctif, « faire » change de radical.
   - explication : Au subjonctif, « faire » devient « fass- » : que je fasse. « Fais » est l’indicatif. « Face » est un nom : faire face.
4. énoncé : Il faut que nous … tôt demain.
   - choix : partons · partions
   - réponse : partions
   - indice : « Il faut que » + nous : relis la première ligne.
   - explication : Au subjonctif, avec « nous » : que nous partions. « Partons » est l’indicatif.
5. énoncé : Je veux que tu … la vérité.
   - choix : sais · saches · sache
   - réponse : saches
   - indice : Au subjonctif, « savoir » change de radical. Le sujet est « tu ».
   - explication : Au subjonctif, « savoir » devient « sach- » : que tu saches, avec un s pour « tu ». « Sais » est l’indicatif. « Sache » va avec « je » ou « il ».
6. énoncé : Il faut que j’… à la boulangerie.
   - choix : aille · ailles · vais
   - réponse : aille
   - indice : Au subjonctif, « aller » change de radical. Le sujet est « je ».
   - explication : Au subjonctif, « aller » devient « aill- » : que j’aille. « Ailles » va avec « tu ». « Vais » est l’indicatif.
7. énoncé : Il faut que nous … finir avant midi.
   - choix : pouvons · puissions
   - réponse : puissions
   - indice : Au subjonctif, « pouvoir » change de radical.
   - explication : Au subjonctif, « pouvoir » devient « puiss- » : que nous puissions. « Pouvons » est l’indicatif.
8. énoncé : Il faut que vous … attention.
   - choix : fassiez · faisiez · faites
   - réponse : fassiez
   - indice : Au subjonctif, « faire » change de radical, et « vous » prend -iez.
   - explication : Que vous fassiez : le radical « fass- » et la terminaison -iez. « Faisiez » est l’imparfait. « Faites » est l’indicatif présent.

## Au lieu · Archipéo

### L’habitant

- métier : J’accorde chaque instrument sur le diapason. · Je change les cordes sur l’établi. · Je range les instruments au râtelier.
- lieu : Ici, les instruments vont du plus grand au plus petit. · L’atelier s’ouvre sur la galerie.
- ruine : Le toit est ouvert sur le devant. · Les instruments sont couchés. · Les bobines sont éparses.
- chantier : Le toit est posé sur l’atelier. · Les bobines sont sur l’établi.
- rallumé : Les instruments sont au râtelier. · Le diapason est sur l’établi.

### Les missions

| mission | cadre | suite |
| --- | --- | --- |
| `verb-moods` | Les instruments se rangent du plus grand au plus petit. | Le rang des instruments est complet. |
| `complex-agreements` | Les cordes de chaque instrument sont tendues pareil. | Les cordes sont tendues. |
| `connotation` | Chaque instrument a sa voix. | Chaque instrument est au râtelier. |
| `emphasis-punctuation` | Le diapason est posé sur l’établi. | Le diapason est rangé. |
| `verb-stems` | Les bobines de corde sont rangées sur l’établi. | Les bobines sont au complet. |

## Les plans

> Ni la grille ni Blocland ne dessinent ces plans : la Lutherie n’y est pas. Leurs cases donnent ses parties au monde ouvert, qui rebâtit le lieu en 3 + 1 + 1 : le premier plan, en trois rangées, porte le corps 1 sur 3 (Subjonctif et conditionnel), 2 sur 3 (Accords difficiles), 3 sur 3 (Connotation) ; le deuxième, le haut (Ponctuation et relief) ; le troisième, les abords (Écrire juste). XP des lieux voisins (40, 50, 60). La réplique de fin est dite par l’accordeur, si le monde ouvert la reprend (proposition du consultant : « Ici, chaque instrument trouvait sa juste voix. »). Aucun son d’instrument ne joue : la réplique ne promet pas de musique.
> Pas de « ## Les demandes » : un lieu du monde ouvert seulement n’a pas de commande.

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `french-3e-language-1` | L’atelier de l’accordeur | 40 | L’atelier a ses murs et ses fenêtres. Les instruments sont rangés. |
| `french-3e-language-2` | Le toit de l’atelier | 50 | Un toit d’ardoise sur l’atelier. Le bois reste au sec. |
| `french-3e-language-3` | La galerie de l’atelier | 60 | La galerie est prête. Ici, chaque instrument trouvait sa juste voix. |
