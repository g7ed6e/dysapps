---
île : carriere
module : Orthographe lexicale
matière : francais
classe : 6e
description : Écrire les mots juste, les familles de mots, les mots-outils.
bloc : sable
gardien : la Dune vivante
icône : mountain
créature : Rouxel
---

# Carrière des mots

## Mot troué · `mot-troue`

- description : Glisse le bloc de lettres qui manque.
- compétences : c3.fr.langue.regularites-orthographiques
- consigne : Écoute le mot, puis tape le bloc de lettres qui manque.
- bravo : Le mot est complet !
- erreur : {word} s’écrit avec « {answer} », pas « {chosen} ».
- bloc gagné : sable
- blocs : 4
- XP : 12
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- clé des items : mot

### Niveau 1 · `carriere-mot-troue-1`

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

### Niveau 2 · `carriere-mot-troue-2`

| clé | mot troué | choix |
| --- | --- | --- |
|  | b[eau]coup | eau · au · o |
|  | bat[eau] | eau · au · o |
|  | t[ou]jours | ou · oo · u |
|  | jam[ais] | ais · ai · é |
|  | longt[emps] | emps · ent · an |
|  | qu[and] | and · an · ant |
|  | par[ce] | ce · se · sse |
| aujourd'hui | aujourd[’hui] | ’hui · ui · oui |
|  | t[emps] | emps · ent · ant |
|  | plusi[eur]s | eur · eure · er |

## Familles-craft · `familles`

- description : Assemble préfixe, racine et suffixe.
- compétences : c3.fr.langue.derivation-composition · c3.fr.langue.racines · c3.fr.langue.familles-champ-lexical
- par partie : 6
- bravo : Bien assemblé !
- erreur : {word} se fabrique avec {answer}. {meaning}
- bloc gagné : sable
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- clé des items : mot

### Niveau 1 · `carriere-familles-1`

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

### Niveau 2 · `carriere-familles-2`

- consigne : Lis ce que veut dire le mot, puis choisis le morceau de la fin qui le fabrique avec la racine.
- blocs : 4
- XP : 12

Pour tous les items :
- case : suffix

| mot | racine | choix | réponse | sens |
| --- | --- | --- | --- | --- |
| jardinet | jardin | et · eur · age | et | Un petit jardin. |
| chanteur | chant | eur · age · able | eur | Celui qui chante. |
| courageux | courag | eux · et · eur | eux | Qui a du courage. |
| lavable | lav | able · age · eur | able | Qu’on peut laver. |
| lavage | lav | age · able · et | age | L’action de laver. |
| maisonnette | maison | nette · eur · age | nette | Une petite maison. |
| fillette | fill | ette · eur · age | ette | Une petite fille. |
| danseur | dans | eur · ette · able | eur | Celui qui danse. |
| peureux | peur | eux · able · age | eux | Qui a souvent peur. |
| jetable | jet | able · eux · ette | able | Que l’on peut jeter. |

## Coffre à mots · `coffre`

- description : Les mots-outils à réviser, en dictée.
- compétences : c3.fr.langue.mots-invariables
- par partie : 8
- bravo : Bonne oreille !
- erreur : Tu as choisi {chosen}. On écrit {word} : {hint}
- bloc gagné : sable
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- clé des items : mot

### Niveau 1 · `carriere-coffre-1`

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

### Niveau 2 · `carriere-coffre-2`

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

### Niveau 3 · `carriere-coffre-3`

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

### Niveau 4 · `carriere-coffre-4`

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

## Les plans

| plan | nom | XP | coffre | quand c’est bâti |
| --- | --- | --- | --- | --- |
| `carriere-four` | Le four de Rouxel | 50 | terre × 3 | Mon four est reconstruit ! Le pain va sentir bon dans tout le village. |
| `carriere-abri` | L’abri du four | 60 |  | Un abri sur mon four : plus de pluie sur le pain ! Merci. |
| `carriere-cour` | La cour du four | 70 | or × 2 · cristal × 2 | Une cour pour le four. Les mots bien écrits viendront y chercher leur pain. |
