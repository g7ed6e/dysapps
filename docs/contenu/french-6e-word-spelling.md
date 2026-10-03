---
lieu : french-6e-word-spelling
module : Orthographe lexicale
matière : french
classe : 6e
description : Écrire les mots juste, les familles de mots, les mots-outils, le sens des mots.
gardien : la Dune vivante
icône : mountain
créature : Rouxel
---

# Carrière des mots

## Mot troué · `missing-letters`

- description : Glisse le bloc de lettres qui manque.
- compétences : c3.fr.langue.regularites-orthographiques
- consigne : Écoute le mot, puis tape le bloc de lettres qui manque.
- bravo : Le mot est complet !
- erreur : {word} s’écrit avec « {answer} », pas « {chosen} ».
- bloc gagné : french-6e-word-spelling
- blocs : 4
- XP : 12
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- clé des items : mot

### Niveau 1 · `french-6e-word-spelling-missing-letters-1`

| mot troué | choix |
| --- | --- |
| [en]fant | en · an · in |
| p[an]talon | an · en · on |
| m[on]tagne | on · om · an |
| t[om]ber | om · on · an |
| m[ai]son | ai · ei · è |
| n[ei]ge | ei · ai · è |
| lap[in] | in · ain · un |
| m[ain] | ain · in · ein |
| élé[ph]ant | ph · f · v |
| [ch]anson | ch · j · s |

### Niveau 2 · `french-6e-word-spelling-missing-letters-2`

| clé | mot troué | choix |
| --- | --- | --- |
|  | b[eau]coup | eau · au · o |
|  | bat[eau] | eau · au · o |
|  | t[ou]jours | ou · oo · u |
|  | jam[ais] | ais · ai · é |
|  | longt[emps] | emps · ent · an |
|  | qu[and] | and · an · ant |
| parce | par[ce] que | ce · se · sse |
| aujourd'hui | aujourd[’hui] | ’hui · ui · oui |
|  | t[emps] | emps · ent · ant |
|  | plusi[eur]s | eur · eure · er |

## Familles-craft · `word-families`

- description : Assemble préfixe, racine et suffixe.
- compétences : c3.fr.langue.derivation-composition · c3.fr.langue.racines · c3.fr.langue.familles-champ-lexical
- par partie : 8
- bravo : Bien assemblé !
- erreur : {word} se fabrique avec {answer}. {meaning}
- bloc gagné : french-6e-word-spelling
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- clé des items : mot

### Niveau 1 · `french-6e-word-spelling-word-families-1`

- consigne : Lis ce que veut dire le mot, puis choisis le morceau qui le fabrique avec la racine.
- blocs : 3
- XP : 10

Pour tous les items :
- case : prefix

| mot | racine | choix | réponse | sens |
| --- | --- | --- | --- | --- |
| refaire | faire | re · dé · in | re | Faire encore une fois. |
| défaire | faire | dé · re · pré | dé | Le contraire de faire. |
| impossible | possible | im · re · dé | im | Pas possible. |
| mécontent | content | mé · re · im | mé | Pas content. |
| décoller | coller | dé · re · in | dé | Le contraire de coller. |
| prévoir | voir | pré · re · dé | pré | Voir à l’avance. |
| relire | lire | re · dé · in | re | Lire encore une fois. |
| déranger | ranger | dé · re · pré | dé | Mettre en désordre, le contraire de ranger. |
| inconnu | connu | in · re · dé | in | Que l’on ne connaît pas. |
| prénom | nom | pré · re · dé | pré | Le nom qui vient avant le nom de famille. |

### Niveau 2 · `french-6e-word-spelling-word-families-2`

- consigne : Lis ce que veut dire le mot, puis choisis le morceau de la fin qui le fabrique avec la racine.
- blocs : 4
- XP : 12

Pour tous les items :
- case : suffix

| mot | racine | racine lue | choix | réponse | sens |
| --- | --- | --- | --- | --- | --- |
| jardinet | jardin |  | et · eur · age | et | Un petit jardin. |
| chanteur | chant |  | eur · age · able | eur | Celui qui chante. |
| courageux | courag | courage | eux · et · eur | eux | Qui a du courage. |
| lavable | lav | laver | able · age · eur | able | Qu’on peut laver. |
| lavage | lav | laver | age · able · et | age | L’action de laver. |
| maisonnette | maisonn | maison | ette · eur · age | ette | Une petite maison. Le n se double. |
| fillette | fill | fille | ette · eur · age | ette | Une petite fille. |
| danseur | dans | danse | eur · ette · able | eur | Celui qui danse. |
| peureux | peur |  | eux · able · age | eux | Qui a souvent peur. |
| jetable | jet | jeter | able · eux · ette | able | Que l’on peut jeter. |

## Coffre à mots · `sight-words`

- description : Les mots-outils à réviser, en dictée.
- compétences : c3.fr.langue.mots-invariables
- par partie : 8
- bravo : Bonne oreille !
- erreur : Tu as choisi {chosen}. On écrit {word} : {hint}
- bloc gagné : french-6e-word-spelling
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- clé des items : mot

### Niveau 1 · `french-6e-word-spelling-sight-words-1`

- consigne : Écoute, puis choisis la bonne écriture. Ces mots-outils reviennent tout le temps : on les apprend par cœur.
- blocs : 3
- XP : 10

1. mot : toujours
   - choix : toujours · toujour · toujourt
   - réponse : toujours
   - indice : toujours finit par un s, comme jamais et alors.
2. mot : beaucoup
   - choix : beaucoup · beaucou · bocoup
   - réponse : beaucoup
   - indice : beaucoup : beau, puis coup ; le p ne se prononce pas.
3. mot : maintenant
   - choix : maintenant · maintenan · mintenant
   - réponse : maintenant
   - indice : maintenant : main, te, nant, avec un t muet à la fin.
4. mot : longtemps
   - choix : longtemps · lontemps · longtemp
   - réponse : longtemps
   - indice : longtemps : long, puis temps ; le g, le p et le s ne se prononcent pas.
5. mot : pendant
   - choix : pendant · pandant · pendan
   - réponse : pendant
   - indice : pendant : pen, comme dans pendre, puis dant.
6. mot : après
   - choix : après · apré · aprés
   - réponse : après
   - indice : après : accent grave et un s muet.
7. mot : jamais
   - choix : jamais · jamai · jammais
   - réponse : jamais
   - indice : jamais finit par un s, comme toujours.
8. mot : encore
   - choix : encore · ancore · encor
   - réponse : encore
   - indice : encore commence par en, comme enfant.
9. mot : aussi
   - choix : aussi · ausi · aussie
   - réponse : aussi
   - indice : aussi prend deux s et finit par un i.
10. mot : demain
    - choix : demain · demin · demein
    - réponse : demain
    - indice : demain finit par ain, comme main.

### Niveau 2 · `french-6e-word-spelling-sight-words-2`

- consigne : Écoute le mot ou la phrase, puis choisis l’écriture du mot. Ces mots-outils se révisent souvent.
- blocs : 4
- XP : 12

1. mot : plusieurs
   - choix : plusieurs · plusieur · pluzieurs
   - réponse : plusieurs
   - indice : plusieurs finit toujours par un s : il veut dire plus d’un.
2. mot : quelquefois
   - phrase : Je vais quelquefois à la piscine avec mon frère.
   - choix : quelquefois · quelquefoi · quelque fois
   - réponse : quelquefois
   - indice : quelquefois en un seul mot, avec un s muet.
3. mot : autrefois
   - phrase : Autrefois, il n’y avait pas de téléphone portable.
   - choix : autrefois · autrefoi · autre fois
   - réponse : autrefois
   - indice : autrefois : autre, puis fois, en un seul mot.
4. mot : ensemble
   - choix : ensemble · ansemble · ensenble
   - réponse : ensemble
   - indice : ensemble : en, sem, ble ; devant b, on écrit m.
5. mot : souvent
   - choix : souvent · souvant · souven
   - réponse : souvent
   - indice : souvent : sou, puis vent, comme le vent.
6. mot : presque
   - choix : presque · prèsque · presqe
   - réponse : presque
   - indice : presque : pres sans accent, puis que.
7. mot : parfois
   - choix : parfois · parfoi · parfoit
   - réponse : parfois
   - indice : parfois finit par ois, comme fois.
8. mot : bientôt
   - choix : bientôt · biento · bientot
   - réponse : bientôt
   - indice : bientôt porte un accent circonflexe sur le o.
9. mot : surtout
   - choix : surtout · surtou · surtoud
   - réponse : surtout
   - indice : surtout finit par tout.
10. mot : derrière
    - choix : derrière · derriere · dérière
    - réponse : derrière
    - indice : derrière prend deux r et un accent grave.

### Niveau 3 · `french-6e-word-spelling-sight-words-3`

- consigne : Écoute, puis choisis la bonne écriture. Ces mots-outils s’apprennent par cœur.
- blocs : 5
- XP : 14

1. mot : ailleurs
   - choix : ailleurs · ailleur · aileurs
   - réponse : ailleurs
   - indice : ailleurs prend deux l, et finit par un s muet.
2. mot : dehors
   - choix : dehors · dehor · deors
   - réponse : dehors
   - indice : dehors a un h au milieu, qu’on n’entend pas, et un s muet à la fin.
3. mot : dedans
   - choix : dedans · dedan · dedant
   - réponse : dedans
   - indice : dedans, c’est de, puis dans, avec son s muet.
4. mot : parmi
   - choix : parmi · parmis · parmit
   - réponse : parmi
   - indice : parmi finit par un i, sans rien derrière.
5. mot : malgré
   - choix : malgré · malgrè · malgrés
   - réponse : malgré
   - indice : malgré finit par un é, avec un accent aigu, et sans s.
6. mot : déjà
   - choix : déjà · deja · déja
   - réponse : déjà
   - indice : déjà prend deux accents : aigu sur le é, grave sur le à.
7. mot : hier
   - choix : hier · ier · hiers
   - réponse : hier
   - indice : hier commence par un h qu’on n’entend pas, et finit par er.
8. mot : soudain
   - choix : soudain · soudin · soudein
   - réponse : soudain
   - indice : soudain finit par ain, comme main et demain.
9. mot : aussitôt
   - choix : aussitôt · aussitot · ausitôt
   - réponse : aussitôt
   - indice : aussitôt, c’est aussi, puis tôt, avec son accent circonflexe.
10. mot : d’abord
    - choix : d’abord · d’abort · dabord
    - réponse : d’abord
    - indice : d’abord : un d, une apostrophe, puis abord, qui finit par un d muet.

### Niveau 4 · `french-6e-word-spelling-sight-words-4`

- consigne : Écoute le mot ou la phrase, puis choisis l’écriture du mot.
- blocs : 6
- XP : 16

1. mot : parce que
   - choix : parce que · parce-que · parse que
   - réponse : parce que
   - indice : parce que s’écrit en deux mots, sans trait d’union, avec un c.
2. mot : lorsque
   - choix : lorsque · lorque · lorsqe
   - réponse : lorsque
   - indice : lorsque, c’est lors, puis que, comme dans presque.
3. mot : pourtant
   - choix : pourtant · pourtan · pourtent
   - réponse : pourtant
   - indice : pourtant, c’est pour, puis tant, avec un t muet.
4. mot : peut-être
   - phrase : Il pleuvra peut-être demain.
   - choix : peut-être · peut être · peutêtre
   - réponse : peut-être
   - indice : peut-être veut dire « c’est possible » : trait d’union et accent. Sans trait d’union, c’est « il peut être là ».
5. mot : tout à coup
   - choix : tout à coup · tout a coup · tout à cou
   - réponse : tout à coup
   - indice : tout à coup s’écrit en trois mots, avec un accent sur à et un p muet, comme beaucoup.
6. mot : davantage
   - phrase : Il faut travailler davantage.
   - choix : davantage · d’avantage · davantages
   - réponse : davantage
   - indice : davantage veut dire « plus » : un seul mot, sans apostrophe.
7. mot : assez
   - choix : assez · asser · assé
   - réponse : assez
   - indice : assez prend deux s, et finit par ez, comme nez.
8. mot : très
   - choix : très · trè · trés
   - réponse : très
   - indice : très prend un accent grave et un s muet, comme après.
9. mot : près
   - phrase : J’habite près du collège.
   - choix : près · prêt · prè
   - réponse : près
   - indice : près veut dire « pas loin » : accent grave et s muet. Prêt, avec un t, c’est être prêt à partir.
10. mot : tôt
    - phrase : Demain, je me lève tôt.
    - choix : tôt · tot · tô
    - réponse : tôt
    - indice : tôt, le contraire de tard, prend un accent circonflexe et un t muet.

## Facettes · `word-forms`

- description : Trouver un mot de même sens, puis le sens d’un mot selon la phrase.
- compétences : c3.fr.langue.synonymie
- erreur : {explanation}
- bloc gagné : french-6e-word-spelling
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `french-6e-word-spelling-word-forms-1`

- consigne : Choisis le mot de même sens pour compléter la deuxième phrase. La règle est affichée.
- bravo : Même sens, bien trouvé !
- blocs : 4
- XP : 12

Pour tous les items :
- trou lu : (mot manquant)
- aide « Les synonymes » :
  - Deux synonymes ont un sens proche : une maison, une habitation.
  - On remplace l’un par l’autre sans changer le sens de la phrase.
  - Un mot de sens contraire n’est pas un synonyme : chaud, froid.

1. énoncé : Mon frère est fatigué après le match. Même sens : mon frère est … après le match.
   - choix : épuisé · endormi · reposé
   - réponse : épuisé
   - indice : Quel mot dit la même chose que fatigué ?
   - explication : « Épuisé » veut dire très fatigué : c’est un synonyme. « Reposé » est le contraire. « Endormi » veut dire qui dort.
2. énoncé : Ce film est drôle. Même sens : ce film est …
   - choix : amusant · triste · court
   - réponse : amusant
   - indice : Un film drôle fait rire. Quel mot dit la même chose ?
   - explication : « Amusant » veut dire drôle : c’est un synonyme. « Triste » est le contraire. « Court » parle de la durée du film.
3. énoncé : Le match a commencé. Même sens : le match a …
   - choix : débuté · fini · repris
   - réponse : débuté
   - indice : Quel mot dit la même chose que commencé ?
   - explication : « Débuter » veut dire commencer : c’est un synonyme. « Fini » est le contraire. « Repris » veut dire recommencé après une pause.
4. énoncé : Cet exercice est facile. Même sens : cet exercice est …
   - choix : simple · difficile · long
   - réponse : simple
   - indice : Un exercice facile se fait sans peine. Quel mot dit la même chose ?
   - explication : « Simple » veut dire facile : c’est un synonyme. « Difficile » est le contraire. « Long » parle du temps qu’il faut.
5. énoncé : Le gymnase est immense. Même sens : le gymnase est …
   - choix : énorme · petit · neuf
   - réponse : énorme
   - indice : Immense veut dire très grand. Quel mot dit la même chose ?
   - explication : « Énorme » veut dire très grand : c’est un synonyme. « Petit » est le contraire. « Neuf » parle de l’âge du gymnase.
6. énoncé : Ce gâteau est délicieux. Même sens : ce gâteau est …
   - choix : savoureux · sucré · fade
   - réponse : savoureux
   - indice : Un gâteau délicieux a très bon goût. Quel mot dit la même chose ?
   - explication : « Savoureux » veut dire qui a très bon goût : c’est un synonyme. « Fade » est le contraire. « Sucré » dit le goût du sucre, pas s’il est bon.
7. énoncé : Ma voisine est gentille. Même sens : ma voisine est …
   - choix : aimable · méchante · timide
   - réponse : aimable
   - indice : Quel mot dit la même chose que gentille ?
   - explication : « Aimable » veut dire gentille : c’est un synonyme. « Méchante » est le contraire. « Timide » veut dire qui n’ose pas.
8. énoncé : La rue est calme ce soir. Même sens : la rue est … ce soir.
   - choix : tranquille · bruyante · sombre
   - réponse : tranquille
   - indice : Une rue calme, sans bruit. Quel mot dit la même chose ?
   - explication : « Tranquille » veut dire calme : c’est un synonyme. « Bruyante » est le contraire. « Sombre » parle de la lumière, pas du bruit.

### Niveau 2 · `french-6e-word-spelling-word-forms-2`

- consigne : Lis la phrase, puis choisis le sens du mot entre guillemets dans cette phrase. La règle est affichée.
- programme : c3.fr.lecture.lexique-contexte
- bravo : Tu as trouvé le bon sens !
- blocs : 5
- XP : 14

Pour tous les items :
- aide « Un mot, plusieurs sens » :
  - Un même mot peut avoir plusieurs sens.
  - Les autres mots de la phrase disent quel sens choisir.
  - Exemple : une pièce de monnaie, une pièce de la maison.

1. énoncé : Je déplace la « souris » pour ouvrir le fichier. Que veut dire « souris » ici ?
   - choix : un petit animal · un objet de l’ordinateur
   - réponse : un objet de l’ordinateur
   - indice : Quel mot de la phrase t’aide ? Pense au fichier.
   - explication : On ouvre un fichier sur un ordinateur : ici, la souris est l’objet qu’on déplace pour cliquer.
2. énoncé : En été, je mange une « glace » à la fraise. Que veut dire « glace » ici ?
   - choix : un dessert froid · un miroir · de l’eau gelée
   - réponse : un dessert froid
   - indice : Quels mots de la phrase t’aident ? Je la mange, et elle est à la fraise.
   - explication : On la mange, et elle est à la fraise : ici, la glace est un dessert froid.
3. énoncé : Au tribunal, un « avocat » défend son client. Que veut dire « avocat » ici ?
   - choix : un fruit vert · un métier de la justice
   - réponse : un métier de la justice
   - indice : Quels mots de la phrase t’aident ? Pense au tribunal.
   - explication : Il défend un client au tribunal : ici, l’avocat exerce un métier de la justice. Le fruit ne défend personne.
4. énoncé : Écris ton nom en haut de la « feuille ». Que veut dire « feuille » ici ?
   - choix : une partie d’un arbre · un morceau de papier
   - réponse : un morceau de papier
   - indice : Quel mot de la phrase t’aide ? Sur quoi écrit-on son nom ?
   - explication : On y écrit son nom : ici, la feuille est un morceau de papier.
5. énoncé : Appuie sur le « bouton » pour allumer la lampe. Que veut dire « bouton » ici ?
   - choix : une touche · un rond de chemise · un point sur la peau
   - réponse : une touche
   - indice : Quels mots de la phrase t’aident ? On appuie, et la lampe s’allume.
   - explication : On appuie dessus et la lampe s’allume. Ici, le bouton est une touche d’un appareil : la lampe.
6. énoncé : Au restaurant, le serveur apporte la « carte ». Que veut dire « carte » ici ?
   - choix : la liste des plats · le plan d’un pays · une carte à jouer
   - réponse : la liste des plats
   - indice : Quel mot de la phrase t’aide ? Pense au restaurant.
   - explication : Au restaurant, on lit la carte pour choisir son repas : ici, c’est la liste des plats.
7. énoncé : J’ai eu une bonne « note » en maths. Que veut dire « note » ici ?
   - choix : un résultat à un contrôle · un son de musique · un petit mot écrit
   - réponse : un résultat à un contrôle
   - indice : Quels mots de la phrase t’aident ? Une bonne note, en maths.
   - explication : Une bonne note en maths, c’est le résultat d’un contrôle. Le do et le ré sont des notes de musique.
8. énoncé : Le chef d’orchestre lève sa « baguette ». Que veut dire « baguette » ici ?
   - choix : un pain long · un petit bâton
   - réponse : un petit bâton
   - indice : Quels mots de la phrase t’aident ? Pense au chef d’orchestre.
   - explication : Le chef d’orchestre dirige les musiciens avec un petit bâton : ici, la baguette n’est pas le pain.

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `french-6e-word-spelling-1` | Le four de Rouxel | 50 | Mon four est reconstruit ! Le pain va sentir bon dans tout le village. |
| `french-6e-word-spelling-2` | L’abri du four | 60 | Un abri sur mon four : plus de pluie sur le pain ! Merci. |
| `french-6e-word-spelling-3` | La cour du four | 70 | Une cour pour le four. Les mots bien écrits viendront y chercher leur pain. |

## Les demandes

### `french-6e-word-spelling-request-1`

- habitant : Rouxel
- bloc : `compound-6e`
- combien : 2
- petite construction : la grue
- demande : Il me faut {objet} pour ma grue. Assemble-les {à}.
- prête : Tu as les {blocs} ! Livre-les à Rouxel.
- posée : Grue posée chez Rouxel !

> Forme, pour l’artiste technique 3D (dessinée dans le code, comme les plans) : la colonne et le linteau de la tonnelle (`jardin()`) : un mât de 3 barrières (`fence`) en (0, 0), la flèche de 2 poutres en (0, 1) et (0, 2) à z 2, une caisse, une porte, sous le bout de la flèche, en (0, 2, 0) (le sable se perdait sur le sol de sable, retouche du directeur artistique, 3 octobre 2026 : le bloc du sol, sans exception) ; la flèche le long des y, perpendiculaire à l’axe de la caméra de l’île ; 6 cubes, 3 cases, 3 de haut (retouche du directeur artistique, 3 octobre 2026).
