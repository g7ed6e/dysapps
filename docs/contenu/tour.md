---
île : tour
module : Lecture et compréhension
matière : francais
classe : 6e
description : Lire à voix haute, étage par étage, et savoir de qui ou de quoi parle un texte.
bloc : verre
gardien : la Chouette de verre
icône : castle
créature : Grimoire
---

# Tour du lecteur

## Ascension · `ascension`

- description : Lis un texte court, un paragraphe = un étage.
- compétences : c3.fr.lecture.fluidite
- bravo : Tour terminée. Chaque paragraphe lu est un étage de plus.
- erreur : ""
- bloc gagné : verre
- blocs : 4
- XP : 12
- monte à : 2
- descend à : -1

Pour tous les items :
- clé des items : paragraphe

### Niveau 1 · `tour-ascension-mousso`

- titre : Le réveil de Mousso
- consigne : Lis « Le réveil de Mousso » à voix haute, paragraphe par paragraphe. Quand tu as lu, valide : un étage se construit.

1. texte : Au bord de la forêt, un golem de mousse dort depuis très longtemps. Les oiseaux ont fait leur nid sur sa tête.
2. texte : Un matin, une pierre roule sur son pied. Le golem ouvre un œil, puis l’autre. Il s’appelle Mousso.
3. texte : Il regarde le village, tout en bas. Les maisons sont cassées, le pont est tombé dans la rivière.
4. texte : Alors Mousso se lève. Il a une idée : il va chercher un bâtisseur pour tout reconstruire, bloc par bloc.

### Niveau 1 · `tour-ascension-pont`

- titre : Le pont du village
- consigne : Lis « Le pont du village » à voix haute, paragraphe par paragraphe. Quand tu as lu, valide : un étage se construit.

1. texte : Le vieux pont est tombé pendant l’orage. Pour aller à l’école, les enfants doivent faire un grand tour.
2. texte : Le bâtisseur arrive avec ses blocs de bois et de pierre. Il pose le premier bloc sur la rive.
3. texte : Rouxel, le renard, apporte du sable pour boucher les trous. Bloquette, la vache, tasse la terre avec ses sabots.
4. texte : Au soir, le pont est fini. Les enfants le traversent en courant, et Grimoire, le hibou, hulule de joie.

### Niveau 1 · `tour-ascension-tunel`

- titre : La mine de Tunel
- consigne : Lis « La mine de Tunel » à voix haute, paragraphe par paragraphe. Quand tu as lu, valide : un étage se construit.

1. texte : Sous la colline, il y a une mine. Dedans vit une taupe carrée qui s’appelle Tunel.
2. texte : Tunel creuse des galeries avec ses pattes. Chaque jour, elle trouve des pierres grises, des pierres bleues et parfois de l’or.
3. texte : Mais Tunel a un problème : elle ne voit presque rien. Dans le noir, les lettres b et d se ressemblent.
4. texte : Elle demande de l’aide au bâtisseur. Ensemble, ils rangent les pierres, une lettre après l’autre.

## Étages du sens · `etages`

- description : Lis un texte court et trouve de qui ou de quoi il parle.
- compétences : c3.fr.lecture.reprises · c3.fr.lecture.explicite
- bravo : Bien lu !
- erreur : {explanation}
- bloc gagné : verre
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `tour-etages-1`

- blocs : 4
- XP : 12
- consigne : Lis la question, puis le petit texte. Trouve de qui ou de quoi on parle. Le rappel est affiché.

Pour tous les items :
- aide « Le pronom » :
  - Un pronom (il, elle, ils, le, la, lui, leur) remplace un nom déjà écrit.
  - Remonte dans le texte pour trouver ce nom.
  - Regarde le genre (il ou elle) et le nombre (il ou ils).
  - Mets ton choix à la place du pronom : la phrase doit avoir du sens.

1. énoncé : "Léa attend son frère devant le collège.\nIl arrive en courant, sans son sac."
   - question : Qui est « il » ?
   - lu : Léa attend son frère devant le collège. Il arrive en courant, sans son sac.
   - choix : le frère de Léa · le collège · Léa
   - réponse : le frère de Léa
   - indice : « il » est au masculin. Qui peut arriver en courant ?
   - explication : « il » reprend « son frère » : c’est le frère de Léa qui arrive. Pour Léa, on dirait « elle », et un collège ne court pas.
2. énoncé : "Inès a une tortue.\nElle la nourrit chaque matin avec de la salade."
   - question : Qui est « elle » ?
   - lu : Inès a une tortue. Elle la nourrit chaque matin avec de la salade.
   - choix : Inès · la tortue · la salade
   - réponse : Inès
   - indice : Qui donne à manger à qui ?
   - explication : « elle » est le sujet de « nourrit » : c’est Inès qui nourrit. « la » reprend la tortue : c’est la tortue qu’Inès nourrit.
3. énoncé : "Karim a perdu son ballon dans le jardin.\nSa sœur le retrouve sous un buisson."
   - question : Que retrouve la sœur de Karim ?
   - lu : Karim a perdu son ballon dans le jardin. Sa sœur le retrouve sous un buisson.
   - choix : le ballon · le jardin · Karim
   - réponse : le ballon
   - indice : « le » reprend une chose que Karim a perdue.
   - explication : « le » reprend « son ballon » : la sœur de Karim retrouve le ballon sous un buisson.
4. énoncé : "Les élèves entrent dans la classe.\nLa professeure leur dit bonjour."
   - question : Qui est « leur » ?
   - lu : Les élèves entrent dans la classe. La professeure leur dit bonjour.
   - choix : les élèves · la classe · la professeure
   - réponse : les élèves
   - indice : « leur » est au pluriel. Cherche un nom au pluriel.
   - explication : « leur » est au pluriel : il reprend « les élèves ». La classe et la professeure sont au singulier.
5. énoncé : "Tom et Lucas jouent au basket.\nIls gagnent le match.\nL’entraîneur les félicite."
   - question : Qui gagne le match ?
   - lu : Tom et Lucas jouent au basket. Ils gagnent le match. L’entraîneur les félicite.
   - choix : Tom et Lucas · Lucas · l’entraîneur
   - réponse : Tom et Lucas
   - indice : « ils » est au pluriel : ce mot reprend plusieurs personnes.
   - explication : « ils » est au pluriel : il reprend Tom et Lucas, les deux joueurs. L’entraîneur ne joue pas : il les félicite.
6. énoncé : "Maya prête sa gomme à Chloé.\nLe soir, elle rend la gomme à Maya."
   - question : Qui est « elle » ?
   - lu : Maya prête sa gomme à Chloé. Le soir, elle rend la gomme à Maya.
   - choix : Chloé · Maya · la gomme
   - réponse : Chloé
   - indice : Qui garde la gomme pendant la journée ?
   - explication : Maya prête la gomme, Chloé garde la gomme pendant la journée : c’est donc Chloé qui la rend à Maya. Quand deux noms vont avec le pronom, choisis celui qui donne du sens à la phrase.
7. énoncé : "Le chat de Noé dort sur le canapé.\nSoudain, il se réveille et miaule."
   - question : Qui est « il » ?
   - lu : Le chat de Noé dort sur le canapé. Soudain, il se réveille et miaule.
   - choix : le chat · Noé · le canapé
   - réponse : le chat
   - indice : Qui dort sur le canapé ? Qui peut miauler ?
   - explication : « il » reprend « le chat » : c’est le chat qui dort, se réveille et miaule. « Noé » est aussi au masculin, mais un garçon ne miaule pas.
8. énoncé : "Sarah écrit une lettre à sa grand-mère.\nElle la poste le lendemain."
   - question : Qui est « elle » ?
   - lu : Sarah écrit une lettre à sa grand-mère. Elle la poste le lendemain.
   - choix : Sarah · la grand-mère · la lettre
   - réponse : Sarah
   - indice : « elle » fait l’action de poster. Qui a la lettre avant de l’envoyer ?
   - explication : « elle » est le sujet de « poste » : c’est Sarah, qui a écrit la lettre et qui la poste. « la » reprend la lettre.

### Niveau 2 · `tour-etages-2`

- blocs : 5
- XP : 14
- consigne : Un texte reprend souvent un nom avec d’autres mots. Lis la question, puis le texte. Trouve de qui ou de quoi on parle. Le rappel est affiché.

Pour tous les items :
- aide « Le même, avec d’autres mots » :
  - Un texte reprend souvent un nom par un autre : « Zoé », puis « la fillette ».
  - Avec un autre nom, le genre peut changer : « une maison », puis « ce logement ».
  - « Celui-ci » ou « celle-ci » : la dernière personne ou chose nommée avant, du même genre, qui peut faire l’action.
  - « Ce dernier », « cette dernière » : le dernier nommé.
  - « Le premier », « le second » (le deuxième) : dans l’ordre du texte.
  - Mets ton choix à la place du groupe de mots : la phrase doit avoir du sens.

1. énoncé : "Max a un nouveau vélo.\nLe garçon le montre à tous ses amis."
   - question : Qui est « le garçon » ?
   - lu : Max a un nouveau vélo. Le garçon le montre à tous ses amis.
   - choix : Max · un ami de Max · le vélo
   - réponse : Max
   - indice : Le texte parle de Max, puis d’un garçon. Est-ce le même ?
   - explication : « Le garçon » reprend Max : le texte parle de lui avec un autre mot. Ce sont ses amis qui regardent le vélo.
2. énoncé : "Un chien court sur la plage.\nL’animal attrape un bâton.\nPuis il le rapporte à sa maîtresse."
   - question : Qui est « l’animal » ?
   - lu : Un chien court sur la plage. L’animal attrape un bâton. Puis il le rapporte à sa maîtresse.
   - choix : le chien · le bâton · la maîtresse
   - réponse : le chien
   - indice : Qui est un animal dans ce texte ?
   - explication : « L’animal » reprend « un chien » : le chien est un animal. Il attrape le bâton et le rapporte.
3. énoncé : "Nora et Hugo travaillent ensemble.\nCelui-ci cherche les images.\nCelle-ci écrit le texte."
   - question : Qui écrit le texte ?
   - lu : Nora et Hugo travaillent ensemble. Celui-ci cherche les images. Celle-ci écrit le texte.
   - choix : Nora · Hugo · Nora et Hugo
   - réponse : Nora
   - indice : « Celle-ci » est au féminin.
   - explication : « Celle-ci » est au féminin : ce mot reprend Nora. « Celui-ci », au masculin, reprend Hugo, qui cherche les images.
4. énoncé : "Mon oncle habite une vieille ferme près du village.\nCe bâtiment a plus de cent ans."
   - question : Quel est « ce bâtiment » ?
   - lu : Mon oncle habite une vieille ferme près du village. Ce bâtiment a plus de cent ans.
   - choix : la ferme · le village · mon oncle
   - réponse : la ferme
   - indice : Un bâtiment, c’est une construction : laquelle est nommée ?
   - explication : « Ce bâtiment » est au masculin, mais il reprend « une vieille ferme » : avec d’autres mots, le genre peut changer. Une ferme est un bâtiment. Un village, c’est tout un ensemble de maisons, et un oncle n’est pas un bâtiment.
5. énoncé : "Le surveillant parle à Samir.\nCe dernier doit ranger les ballons."
   - question : Qui doit ranger les ballons ?
   - lu : Le surveillant parle à Samir. Ce dernier doit ranger les ballons.
   - choix : Samir · le surveillant · le surveillant et Samir
   - réponse : Samir
   - indice : « Ce dernier » : le dernier nommé.
   - explication : « Ce dernier » reprend le dernier nommé : Samir. Le surveillant est nommé en premier.
6. énoncé : "Emma lit un roman de Jules Verne.\nDans ce livre, l’auteur raconte un tour du monde."
   - question : Qui est « l’auteur » ?
   - lu : Emma lit un roman de Jules Verne. Dans ce livre, l’auteur raconte un tour du monde.
   - choix : Jules Verne · Emma · le roman
   - réponse : Jules Verne
   - indice : L’auteur, c’est celui qui a écrit le livre.
   - explication : « L’auteur » reprend Jules Verne : c’est lui qui a écrit le roman. Emma le lit.
7. énoncé : "Une abeille entre dans la cuisine.\nLa petite bête tourne autour de la confiture.\nPapa la chasse avec un torchon."
   - question : Qui est « la petite bête » ?
   - lu : Une abeille entre dans la cuisine. La petite bête tourne autour de la confiture. Papa la chasse avec un torchon.
   - choix : l’abeille · la confiture · la cuisine
   - réponse : l’abeille
   - indice : Quelle bête est entrée dans la cuisine ?
   - explication : « La petite bête » reprend « une abeille ». « la », dans « Papa la chasse », la reprend aussi : Papa chasse l’abeille.
8. énoncé : "Julie a deux chats, Pixel et Caramel.\nLe premier est tout noir.\nLe second dort toute la journée."
   - question : Qui dort toute la journée ?
   - lu : Julie a deux chats, Pixel et Caramel. Le premier est tout noir. Le second dort toute la journée.
   - choix : Caramel · Pixel · Julie
   - réponse : Caramel
   - indice : « Le second » : le deuxième nommé.
   - explication : « Le second » reprend le deuxième chat nommé : Caramel. « Le premier », c’est Pixel, le chat noir.

## Les plans

| plan | nom | XP | coffre | quand c’est bâti |
| --- | --- | --- | --- | --- |
| `tour-phare` | Le phare de Grimoire | 60 | bois × 4 | Hou hou ! Mon phare brille à nouveau. Les lecteurs perdus retrouveront le chemin du village. |
| `tour-lanterne` | La lanterne du phare | 70 |  | Deux lanternes au sommet : mon phare se voit depuis la Forêt. Hou hou ! |
| `tour-quai` | Le quai du phare | 80 | or × 3 · cristal × 3 | Le quai est prêt. Le village est reconstruit, et chaque page lue l’a rendu plus beau. |
