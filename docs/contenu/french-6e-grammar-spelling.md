---
lieu : french-6e-grammar-spelling
module : Orthographe grammaticale
matière : french
classe : 6e
description : Accorder sujet et verbe, accorder dans le groupe nominal, choisir a/à, et/est, -é/-er.
gardien : le Taureau de terre
icône : wheat
créature : Bloquette
---

# Ferme des accords

## Enclos · `word-classes`

- description : Glisse les sujets vers le bon verbe : singulier ou pluriel.
- compétences : c3.fr.langue.accord-sujet-verbe
- bravo : Tout le monde dans le bon enclos !
- erreur : {subject} : {why} Le verbe est donc « {verb} ».
- bloc gagné : french-6e-grammar-spelling
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `french-6e-grammar-spelling-word-classes-1`

- consigne : Pour chaque sujet, choisis le verbe qui va avec : un seul, ou plusieurs. Puis valide.
- blocs : 4
- XP : 12

Pour tous les items :
- aide « Accorder le verbe avec son sujet » :
  - Le verbe s’accorde avec celui qui fait l’action.
  - Un seul : singulier (il parle).
  - Plusieurs : pluriel, le verbe finit par -nt (ils parlent).

1. clé : le-chien
   - sujet : Le chien
   - singulier : mange
   - pluriel : mangent
   - réponse : singulier
   - pourquoi : un seul chien (le), donc le verbe reste au singulier.
2. clé : les-chiens
   - sujet : Les chiens
   - singulier : mange
   - pluriel : mangent
   - réponse : pluriel
   - pourquoi : plusieurs chiens (les, un s), donc le verbe prend -nt.
3. clé : ma-sœur
   - sujet : Ma sœur
   - singulier : chante
   - pluriel : chantent
   - réponse : singulier
   - pourquoi : une seule sœur (ma), donc le verbe reste au singulier.
4. clé : les-enfants
   - sujet : Les enfants
   - singulier : joue
   - pluriel : jouent
   - réponse : pluriel
   - pourquoi : plusieurs enfants (les, un s), donc le verbe prend -nt.
5. clé : un-oiseau
   - sujet : Un oiseau
   - singulier : vole
   - pluriel : volent
   - réponse : singulier
   - pourquoi : un seul oiseau (un), donc le verbe reste au singulier.
6. clé : des-oiseaux
   - sujet : Des oiseaux
   - singulier : vole
   - pluriel : volent
   - réponse : pluriel
   - pourquoi : plusieurs oiseaux (des, un x), donc le verbe prend -nt.
7. clé : la-fille
   - sujet : La fille
   - singulier : saute
   - pluriel : sautent
   - réponse : singulier
   - pourquoi : une seule fille (la), donc le verbe reste au singulier.
8. clé : mes-amis
   - sujet : Mes amis
   - singulier : rit
   - pluriel : rient
   - réponse : pluriel
   - pourquoi : plusieurs amis (mes, un s), donc le verbe prend -nt.

### Niveau 2 · `french-6e-grammar-spelling-word-classes-2`

- consigne : Attention aux pièges : cherche qui fait l’action, choisis le verbe, puis valide.
- blocs : 5
- XP : 14

Pour tous les items :
- aide « Trouver le vrai sujet » :
  - « La sœur de mes amis » : c’est la sœur qui fait l’action.
  - Deux sujets reliés par « et » : pluriel, le verbe finit par -nt.

1. clé : paul-et-léa
   - sujet : Paul et Léa
   - singulier : joue
   - pluriel : jouent
   - réponse : pluriel
   - pourquoi : Paul et Léa, ça fait deux personnes : le verbe prend -nt.
2. clé : le-chien-de-mes-voisins
   - sujet : Le chien de mes voisins
   - singulier : aboie
   - pluriel : aboient
   - réponse : singulier
   - pourquoi : c’est le chien qui aboie, un seul, même s’il y a plusieurs voisins.
3. clé : elles
   - sujet : Elles
   - singulier : dort
   - pluriel : dorment
   - réponse : pluriel
   - pourquoi : elles, c’est plusieurs : le verbe prend -nt.
4. clé : tout-le-monde
   - sujet : Tout le monde
   - singulier : rit
   - pluriel : rient
   - réponse : singulier
   - pourquoi : tout le monde se conjugue comme il, au singulier.
5. clé : les-élèves-de-la-classe
   - sujet : Les élèves de la classe
   - singulier : écoute
   - pluriel : écoutent
   - réponse : pluriel
   - pourquoi : ce sont les élèves qui écoutent, plusieurs : le verbe prend -nt.
6. clé : mon-frère
   - sujet : Mon frère
   - singulier : court
   - pluriel : courent
   - réponse : singulier
   - pourquoi : un seul frère (mon), donc le verbe reste au singulier.
7. clé : le-chat-et-le-chien
   - sujet : Le chat et le chien
   - singulier : dort
   - pluriel : dorment
   - réponse : pluriel
   - pourquoi : le chat et le chien, ça fait deux : le verbe prend -nt.
8. clé : il
   - sujet : Il
   - singulier : mange
   - pluriel : mangent
   - réponse : singulier
   - pourquoi : il, c’est une seule personne : le verbe reste au singulier.

## Tri des graines · `sorting`

> Ses exercices sont produits par le code (`src/blocland/exercises/`), pas écrits ici.

- description : Phrases à trous : a/à, et/est, on/ont, son/sont, ce/se.
- compétences : c3.fr.langue.homophonie

## Récolte -é / -er / -ez · `e-er-ez`

- description : Clique la bonne terminaison.
- compétences : c3.fr.langue.finales-en-e
- bravo : Bonne terminaison !
- erreur : {rule}
- bloc gagné : french-6e-grammar-spelling
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : (terminaison)
- choix : é · er · ez
- aide « -é, -er ou -ez ? » :
  - On peut dire « vendre » : -er (elle va laver).
  - On peut dire « vendu » : -é (elle a lavé).
  - Avec « vous » : -ez (vous lavez).

### Niveau 1 · `french-6e-grammar-spelling-e-er-ez-1`

- consigne : Choisis la bonne fin du verbe : é, er ou ez. Astuce : remplace par vendre ou vendu.
- blocs : 4
- XP : 12

1. clé : va-manger
   - énoncé : Il va mang… à midi.
   - réponse : er
   - règle : Après « va », on peut dire « vendre » : c’est -er.
2. clé : a-mange
   - énoncé : Il a mang… une pomme.
   - réponse : é
   - règle : Après « a », on peut dire « vendu » : c’est -é.
3. clé : vous-mangez
   - énoncé : Vous mang… trop vite.
   - réponse : ez
   - règle : Avec « vous », le verbe finit par -ez.
4. clé : veut-jouer
   - énoncé : Elle veut jou… dehors.
   - réponse : er
   - règle : Après « veut », on peut dire « vendre » : c’est -er.
5. clé : est-tombe
   - énoncé : Le vase est tomb… par terre.
   - réponse : é
   - règle : Après « est », on peut dire « vendu » : c’est -é.
6. clé : vous-chantez
   - énoncé : Vous chant… très bien.
   - réponse : ez
   - règle : Avec « vous », le verbe finit par -ez.
7. clé : pour-chanter
   - énoncé : Je viens pour chant… avec toi.
   - réponse : er
   - règle : Après « pour », on peut dire « vendre » : c’est -er.
8. clé : ont-fini
   - énoncé : Ils ont termin… le travail.
   - réponse : é
   - règle : Après « ont », on peut dire « vendu » : c’est -é.

### Niveau 2 · `french-6e-grammar-spelling-e-er-ez-2`

- consigne : Choisis la bonne fin du verbe : é, er ou ez. Pense à remplacer par vendre ou vendu, et regarde qui parle.
- blocs : 5
- XP : 14

1. clé : sans-parler
   - énoncé : Il sort sans parl….
   - réponse : er
   - règle : Après « sans », on peut dire « vendre » : c’est -er.
2. clé : avait-oublie
   - énoncé : Elle avait oubli… son sac.
   - réponse : é
   - règle : Après « avait », on peut dire « vendu » : c’est -é.
3. clé : vous-arrivez
   - énoncé : Vous arriv… à quelle heure ?
   - réponse : ez
   - règle : Avec « vous », le verbe finit par -ez.
4. clé : de-danser
   - énoncé : Il rêve de dans… sur scène.
   - réponse : er
   - règle : Après « de », on peut dire « vendre » : c’est -er.
5. clé : gateau-decore
   - énoncé : Un gâteau décor… de fraises.
   - réponse : é
   - règle : On peut dire « vendu » : le gâteau est décoré, c’est -é.
6. clé : vous-regardez
   - énoncé : Vous regard… le ciel.
   - réponse : ez
   - règle : Avec « vous », le verbe finit par -ez.
7. clé : faut-ranger
   - énoncé : Il faut rang… la chambre.
   - réponse : er
   - règle : Après « faut », on peut dire « vendre » : c’est -er.
8. clé : sont-arrives
   - énoncé : Il est arriv… en retard.
   - réponse : é
   - règle : Après « est », on peut dire « vendu » : c’est -é.

## Troupeau · `plurals`

- description : Accorder le déterminant, le nom et l’adjectif, puis trouver le sujet placé après le verbe ou fait de deux noms.
- compétences : c3.fr.langue.genre-nombre · c3.fr.langue.sujet
- erreur : {explanation}
- bloc gagné : french-6e-grammar-spelling
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : (mot manquant)

### Niveau 1 · `french-6e-grammar-spelling-plurals-1`

- consigne : Choisis le mot bien accordé : regarde les mots de son groupe. La règle est affichée.
- programme : c3.fr.langue.accord-gn
- bravo : Tout le groupe va ensemble !
- blocs : 4
- XP : 12

Pour tous les items :
- aide « L’accord dans le groupe nominal » :
  - Le nom commande : déterminant et adjectif prennent son genre et son nombre.
  - Le déterminant change aussi : son, sa, ses ; ce, cette, ces.
  - Féminin : souvent un -e (grand, grande).
  - Pluriel : un -s, ou un -x (des bateaux, des journaux).

1. énoncé : Les vaches … broutent l’herbe du pré.
   - choix : noir · noire · noires
   - réponse : noires
   - indice : Regarde le nom : « vaches », c’est féminin et pluriel.
   - explication : « Les vaches » est au féminin pluriel : l’adjectif prend -e puis -s, « noires ».
2. énoncé : Le fermier range … bottes de paille.
   - choix : son · sa · ses
   - réponse : ses
   - indice : Combien de bottes ? Le déterminant doit le dire.
   - explication : « Bottes » est au pluriel (un s) : le déterminant aussi, « ses bottes ».
3. énoncé : Une … poule picore dans la cour.
   - choix : petit · petite · petits
   - réponse : petite
   - indice : « Une poule » : féminin ou masculin ? Un seul ou plusieurs ?
   - explication : « Une poule » est au féminin singulier : l’adjectif prend un -e, « petite ».
4. énoncé : Deux … galopent dans le champ.
   - choix : cheval · chevaux · chevals
   - réponse : chevaux
   - indice : Deux, c’est plusieurs. Relis la règle des noms en -al.
   - explication : Au pluriel, les noms en -al deviennent -aux : un cheval, deux chevaux.
5. énoncé : Les agneaux … dorment contre leur mère.
   - choix : blanc · blancs · blanches
   - réponse : blancs
   - indice : « Agneaux » : masculin ou féminin ? Un seul ou plusieurs ?
   - explication : « Les agneaux » est au masculin pluriel : l’adjectif prend seulement un -s, « blancs ».
6. énoncé : Ma tante a une jument très … .
   - choix : doux · douce · douces
   - réponse : douce
   - indice : « Une jument » : féminin, et une seule.
   - explication : « Une jument » est au féminin singulier : doux devient « douce » au féminin.
7. énoncé : Dans l’étable, les … boivent du lait.
   - choix : veau · veaux · veaus
   - réponse : veaux
   - indice : « Les », c’est plusieurs. Relis la règle des noms en -eau.
   - explication : Les noms en -eau prennent un -x au pluriel : un veau, les veaux.
8. énoncé : Regarde : … vache donne beaucoup de lait.
   - choix : ce · cette · ces
   - réponse : cette
   - indice : « Vache » : féminin ou masculin ? Une seule ou plusieurs ?
   - explication : « Vache » est au féminin singulier : le déterminant est « cette ». « Ce » va avec un nom masculin, « ces » avec un pluriel.

### Niveau 2 · `french-6e-grammar-spelling-plurals-2`

- consigne : Trouve le sujet avec « qui est-ce qui ? », même s’il est après le verbe, puis accorde le verbe. La règle est affichée.
- programme : c3.fr.langue.accord-sujet-verbe
- bravo : Tu as trouvé le sujet !
- blocs : 5
- XP : 14

Pour tous les items :
- aide « Trouver le sujet » :
  - Pose la question « qui est-ce qui ? » devant le verbe.
  - Le sujet peut être après le verbe : « Dans la mare nagent les canards. »
  - Deux sujets reliés par « et » : le verbe est au pluriel.

1. énoncé : Dans le pré … les vaches.
   - choix : dort · dorment
   - réponse : dorment
   - indice : Qui est-ce qui dort ? Cherche après le verbe.
   - explication : Le sujet est après le verbe : ce sont les vaches qui dorment. Pluriel : « dorment ».
2. énoncé : Sur le toit des granges … un coq.
   - choix : chante · chantent
   - réponse : chante
   - indice : Qui est-ce qui chante ? Les granges ne chantent pas.
   - explication : C’est le coq qui chante, un seul : « chante ». « Des granges » dit seulement où il est.
3. énoncé : Où … les poules ?
   - choix : pond · pondent
   - réponse : pondent
   - indice : Qui est-ce qui pond ? Cherche après le verbe.
   - explication : Dans la question, le sujet est après le verbe : ce sont les poules qui pondent. Pluriel : « pondent ».
4. énoncé : Quand … le vétérinaire ?
   - choix : arrive · arrivent
   - réponse : arrive
   - indice : Qui est-ce qui arrive ? Un seul ou plusieurs ?
   - explication : Le sujet est après le verbe : c’est le vétérinaire qui arrive, un seul. Singulier : « arrive ».
5. énoncé : « Rentrez les moutons ! » … le berger.
   - choix : crie · crient
   - réponse : crie
   - indice : Qui est-ce qui crie ? Ce ne sont pas les moutons.
   - explication : Après les paroles, le sujet suit le verbe : c’est le berger qui crie, un seul. Singulier : « crie ».
6. énoncé : Le chien et le chat … près du feu.
   - choix : dort · dorment
   - réponse : dorment
   - indice : Qui est-ce qui dort ? Compte les animaux.
   - explication : Le chien et le chat, ça fait deux sujets : le verbe est au pluriel, « dorment ».
7. énoncé : Mon frère et ma sœur … les œufs.
   - choix : ramasse · ramassent
   - réponse : ramassent
   - indice : Qui est-ce qui ramasse ? Compte les personnes.
   - explication : Mon frère et ma sœur, ça fait deux sujets : le verbe est au pluriel, « ramassent ».
8. énoncé : Dans la cour … une oie et un canard.
   - choix : court · courent
   - réponse : courent
   - indice : Qui est-ce qui court ? Cherche après le verbe, et compte.
   - explication : Le sujet est après le verbe, et il y en a deux : une oie et un canard. Pluriel : « courent ».

## Les plans

| plan | nom | XP | coffre | quand c’est bâti |
| --- | --- | --- | --- | --- |
| `french-6e-grammar-spelling-1` | L’étable de Bloquette | 50 | french-6e-reading × 3 | Meuh ! Une étable rien que pour moi. Les accords, c’est comme les murs : il faut que tout tienne ensemble. |
| `french-6e-grammar-spelling-2` | Le toit de l’étable | 60 |  | Un toit sur l’étable ! Meuh, je n’ai plus la pluie sur les cornes. |
| `french-6e-grammar-spelling-3` | L’enclos de l’étable | 70 | trophy-gold × 2 · trophy-crystal × 2 | Mon enclos est fermé, tout s’accorde. Singulier, pluriel, chacun sa barrière ! |
