---
lieu : french-4e-sentence
module : La phrase et le verbe
matière : french
classe : 4e
description : Relatives et conjonctives, voix passive et paroles rapportées, temps composés, conditionnel et subjonctif : la règle sous les yeux.
icône : route
monde ouvert seulement : oui
---

# Jonction

> Lieu du monde ouvert seulement (décision du mainteneur du 21 octobre 2026, 17 h 41, GD-24) : la Jonction n’existe que dans le monde ouvert du 4e d’Archipéo, jamais dans la grille ni dans Blocland. Le lieu n’a ni gardien ni créature, comme l’Étalon : aucun écran ne les montrerait ; son habitant est le cantonnier, nommé par son métier, celui de la réplique de fin des plans, et il n’est pas une créature. Aucun nom de contenu ne s’affiche dans le monde ouvert. Les niveaux gagnent le bloc des Roches (le Cabinet des mots de la grille, `french-4e-vocabulary`, le Parchemin), confirmé par le directeur artistique.
> Textes lus : programme de français du cycle 4 de 2026 (`cycle4-francais-2026.pdf`, F26), 4e, p. 14, 17 et 18 ; annexe 3 de 2020 (pages de `src/curriculum/cycle4.ts`), p. 21 à 24. Les missions citent les compétences de 2020, seules au référentiel pour la 4e aujourd’hui ; les compétences `c4.fr.4e.*` du texte de 2026 s’ajouteront à la bascule (carte des missions de 2027, § 3).
> Titres de travail, à nommer par le consultant d’Archipéo. Écran : `CalculationScreen`, comme les autres missions de français du collège.

## Les relatives · `relative-clauses`

> F26 p. 17 (« Comprendre la relation de subordination » ; « fonctions grammaticales des propositions subordonnées relatives ») et p. 18 (« Identifier et nommer […] pronoms relatifs » ; « fonctions des propositions subordonnées […] relatives »). 2020, p. 23.

- description : Le pronom relatif et son antécédent, le bon pronom (qui, que, dont, où), puis ce que fait la relative dans la phrase.
- compétences : c4.fr.langue.subordonnees · c4.fr.langue.phrase-complexe
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : french-4e-vocabulary
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `french-4e-sentence-relative-clauses-1`

- consigne : Trouve le pronom relatif, le nom qu’il remplace ou la relative. La règle est affichée.

Pour tous les items :
- aide « Le pronom relatif » :
  - Une relative commence par un pronom relatif : qui, que, dont, où.
  - Le pronom relatif remplace un nom placé juste avant lui : l’antécédent.
  - Pour vérifier, remets le nom à la place du pronom : la lampe qui brille → la lampe brille.
  - La relative va du pronom relatif jusqu’au bout de son verbe et de ses compléments.

1. énoncé : « J’ai lu le livre que Léa m’a prêté. » Quel est le pronom relatif ?
   - lu : J’ai lu le livre que Léa m’a prêté. Quel est le pronom relatif ?
   - choix : le · que · m’
   - réponse : que
   - indice : Cherche le petit mot qui suit un nom et commence une nouvelle proposition.
   - explication : « Que » commence la relative « que Léa m’a prêté » et remplace « le livre » : Léa m’a prêté le livre. « Le » est un déterminant, « m’ » un pronom personnel.
2. énoncé : « La ville où j’ai grandi est au bord de la mer. » Quel est l’antécédent de « où » ?
   - lu : La ville où j’ai grandi est au bord de la mer. Quel est l’antécédent de « où » ?
   - choix : la ville · la mer · le bord
   - réponse : la ville
   - indice : L’antécédent est le nom placé juste avant le pronom.
   - explication : « Où » remplace « la ville » : j’ai grandi dans la ville. La mer vient après la relative : ce n’est pas l’antécédent.
3. énoncé : « Le garçon qui court devant nous s’appelle Hugo. » Quel est l’antécédent de « qui » ?
   - lu : Le garçon qui court devant nous s’appelle Hugo. Quel est l’antécédent de « qui » ?
   - choix : Hugo · nous · le garçon
   - réponse : le garçon
   - indice : Remets un nom à la place de « qui » : qui court devant nous ?
   - explication : Le garçon court devant nous : « qui » remplace « le garçon ». Hugo est son prénom, il vient après la relative.
4. énoncé : « Voici le copain dont je t’ai parlé. » Quel est le pronom relatif ?
   - lu : Voici le copain dont je t’ai parlé. Quel est le pronom relatif ?
   - choix : dont · voici · je
   - réponse : dont
   - indice : Le pronom relatif suit le nom « copain ».
   - explication : « Dont » commence la relative « dont je t’ai parlé » et remplace « le copain » : je t’ai parlé du copain.
5. énoncé : « Je cherche le stylo que tu m’as donné hier. » Quel est l’antécédent de « que » ?
   - lu : Je cherche le stylo que tu m’as donné hier. Quel est l’antécédent de « que » ?
   - choix : tu · le stylo · hier
   - réponse : le stylo
   - indice : Quel nom est placé juste avant « que » ?
   - explication : Tu m’as donné le stylo hier : « que » remplace « le stylo ». « Tu » est le sujet du verbe de la relative.
6. énoncé : « Je pense que le car arrivera en retard. » Ce « que » est-il un pronom relatif ?
   - lu : Je pense que le car arrivera en retard. Ce « que » est-il un pronom relatif ?
   - choix : oui · non
   - réponse : non
   - indice : Y a-t-il, juste avant « que », un nom que ce mot remplace ?
   - explication : Ici, « que » suit le verbe « pense » et ne remplace aucun nom : c’est une conjonction de subordination. Un pronom relatif remplace toujours un nom placé avant lui.
7. énoncé : « Le jour où il a neigé, le collège était fermé. » Quel est l’antécédent de « où » ?
   - lu : Le jour où il a neigé, le collège était fermé. Quel est l’antécédent de « où » ?
   - choix : le collège · il · le jour
   - réponse : le jour
   - indice : « Où » peut aussi dire un moment. Quel nom est juste avant lui ?
   - explication : Il a neigé ce jour-là : « où » remplace « le jour ». Ici, « où » dit un moment, pas un lieu.
8. énoncé : « Les élèves que tu vois là-bas sont en quatrième. » Quelle est la relative ?
   - lu : Les élèves que tu vois là-bas sont en quatrième. Quelle est la relative ?
   - choix : les élèves que tu vois · que tu vois là-bas · sont en quatrième
   - réponse : que tu vois là-bas
   - indice : La relative commence par le pronom relatif. Le nom qu’il remplace n’en fait pas partie.
   - explication : La relative va de « que » jusqu’à « là-bas ». « Les élèves » est l’antécédent, hors de la relative ; « sont en quatrième » est la suite de la principale.

### Niveau 2 · `french-4e-sentence-relative-clauses-2`

- consigne : Choisis le pronom relatif qui complète la phrase. La règle est affichée.

Pour tous les items :
- aide « Qui, que, dont, où » :
  - qui : sujet du verbe qui suit (l’ami qui arrive).
  - que : complément, le verbe a déjà son sujet (l’ami que je retrouve).
  - dont : remplace « de » + le nom (l’ami dont je me souviens : je me souviens de l’ami).
  - où : un lieu ou un moment (la rue où j’habite, l’heure où il part).

1. énoncé : Le film … nous avons vu hier était drôle.
   - choix : qui · que · dont
   - réponse : que
   - indice : Le verbe « avons vu » a-t-il déjà un sujet ?
   - explication : « Nous » est le sujet de « avons vu » : il faut « que ». Nous avons vu le film.
2. énoncé : La fille … chante sur scène est ma cousine.
   - choix : qui · que · où
   - réponse : qui
   - indice : Qui chante ? Le verbe « chante » a-t-il un autre sujet ?
   - explication : « Chante » n’a pas d’autre sujet : le pronom est sujet, c’est « qui ». La fille chante sur scène.
3. énoncé : C’est le livre … j’ai besoin pour mon exposé.
   - choix : que · où · dont
   - réponse : dont
   - indice : On dit « avoir besoin de quelque chose ».
   - explication : J’ai besoin du livre : « de » + le nom, c’est « dont ». On ne dit pas « j’ai besoin le livre » : « que » ne va pas.
4. énoncé : La salle … nous mangeons est au rez-de-chaussée.
   - choix : où · que · dont
   - réponse : où
   - indice : La relative dit-elle un lieu ?
   - explication : Nous mangeons dans la salle : la relative dit un lieu, c’est « où ».
5. énoncé : Voici le chien … j’ai peur.
   - choix : qui · dont · que
   - réponse : dont
   - indice : On dit « avoir peur de quelqu’un ».
   - explication : J’ai peur du chien : « de » + le nom, c’est « dont ».
6. énoncé : Le bus … passe devant le collège est en retard.
   - choix : que · dont · qui
   - réponse : qui
   - indice : Qui passe devant le collège ?
   - explication : Le bus passe devant le collège : le pronom est sujet de « passe », c’est « qui ».
7. énoncé : L’été … nous sommes partis en Bretagne, il a fait très chaud.
   - choix : que · où · dont
   - réponse : où
   - indice : La relative dit un moment : quand sommes-nous partis ?
   - explication : Nous sommes partis cet été-là : la relative dit un moment, c’est « où ».
8. énoncé : Le gâteau … mon frère a préparé est délicieux.
   - choix : dont · qui · que
   - réponse : que
   - indice : Le verbe « a préparé » a déjà un sujet : lequel ?
   - explication : « Mon frère » est le sujet de « a préparé » : il faut « que ». Mon frère a préparé le gâteau.

### Niveau 3 · `french-4e-sentence-relative-clauses-3`

- consigne : Lis la phrase : que fait la relative ? La règle est affichée.

Pour tous les items :
- aide « Ce que fait la relative » :
  - La relative complète son antécédent, comme un adjectif : elle est complément de l’antécédent.
  - On peut souvent la remplacer par un adjectif : un chemin qu’on ne voit pas → un chemin invisible.
  - On peut l’enlever : la phrase reste juste, mais elle dit moins de choses.
  - Une conjonctive avec « que » complète un verbe, pas un nom (je crois qu’il viendra).

1. énoncé : « un exercice que l’on ne peut pas faire » : par quel adjectif remplacer la relative ?
   - lu : un exercice que l’on ne peut pas faire : par quel adjectif remplacer la relative ?
   - choix : difficile · impossible · inutile
   - réponse : impossible
   - indice : Un exercice qu’on ne peut pas faire du tout : quel mot le dit exactement ?
   - explication : Ce qu’on ne peut pas faire est impossible. Un exercice difficile, on peut le faire, avec du mal.
2. énoncé : « une eau que l’on peut boire » : par quel adjectif remplacer la relative ?
   - lu : une eau que l’on peut boire : par quel adjectif remplacer la relative ?
   - choix : potable · fraîche · claire
   - réponse : potable
   - indice : Quel adjectif veut dire « qu’on peut boire » ?
   - explication : Une eau potable est une eau que l’on peut boire. Une eau claire ou fraîche n’est pas forcément bonne à boire.
3. énoncé : « un objet qui ne sert à rien » : par quel adjectif remplacer la relative ?
   - lu : un objet qui ne sert à rien : par quel adjectif remplacer la relative ?
   - choix : cassé · ancien · inutile
   - réponse : inutile
   - indice : Le préfixe in- veut dire « pas ».
   - explication : Un objet inutile ne sert à rien. Un objet cassé ou ancien peut encore servir.
4. énoncé : « Le vélo que j’ai réparé roule bien. » Si on enlève la relative, que reste-t-il ?
   - lu : Le vélo que j’ai réparé roule bien. Si on enlève la relative, que reste-t-il ?
   - choix : Le vélo roule bien. · J’ai réparé le vélo. · Le vélo que j’ai réparé.
   - réponse : Le vélo roule bien.
   - indice : Enlève tout, de « que » jusqu’à « réparé ».
   - explication : Sans la relative, il reste la principale : « Le vélo roule bien. » La phrase est juste, mais on ne sait plus de quel vélo on parle.
5. énoncé : « Je sais que tu dis vrai. » Cette subordonnée est-elle une relative ou une conjonctive ?
   - lu : Je sais que tu dis vrai. Cette subordonnée est-elle une relative ou une conjonctive ?
   - choix : une relative · une conjonctive
   - réponse : une conjonctive
   - indice : « Que » suit-il un nom, ou un verbe ?
   - explication : « Que » suit le verbe « sais » et ne remplace aucun nom : c’est une conjonctive, qui complète le verbe. Je sais quoi ? Que tu dis vrai.
6. énoncé : « L’histoire que tu racontes est vraie. » Cette subordonnée est-elle une relative ou une conjonctive ?
   - lu : L’histoire que tu racontes est vraie. Cette subordonnée est-elle une relative ou une conjonctive ?
   - choix : une relative · une conjonctive
   - réponse : une relative
   - indice : « Que » suit-il un nom ? Remets ce nom à sa place.
   - explication : « Que » suit le nom « histoire » et le remplace : tu racontes l’histoire. C’est une relative, qui complète ce nom.
7. énoncé : « Le chien de ma voisine qui aboie toute la nuit m’empêche de dormir. » Quel nom la relative complète-t-elle ?
   - lu : Le chien de ma voisine qui aboie toute la nuit m’empêche de dormir. Quel nom la relative complète-t-elle ?
   - choix : ma voisine · le chien
   - réponse : le chien
   - indice : Remplace « qui » par chacun des deux noms : lequel aboie ?
   - explication : C’est le chien qui aboie : « qui » remplace « le chien ». La relative complète ce nom, même si « ma voisine » est plus près d’elle.
8. énoncé : « Prends les fruits qui sont mûrs. » Que dit la relative ?
   - lu : Prends les fruits qui sont mûrs. Que dit la relative ?
   - choix : pourquoi les prendre · quels fruits prendre · quand les prendre
   - réponse : quels fruits prendre
   - indice : La relative complète un nom. Lequel, et que dit-elle de lui ?
   - explication : La relative complète « les fruits » : elle dit lesquels prendre, ceux qui sont mûrs. Elle fait le travail d’un adjectif.

## Les conjonctives · `subordinate-clauses`

> F26 p. 17 (« Identifier la proposition subordonnée interrogative indirecte dans le cadre d’une interrogation totale ou partielle ») et p. 18 (« Identifier et nommer les conjonctions de subordination » ; « fonctions des propositions subordonnées conjonctives » ; « complément circonstanciel d’opposition, de condition »). 2020, p. 22 et 23.

- description : La conjonction de subordination et sa proposition, ce que dit la conjonctive (complément du verbe, cause, temps, opposition, condition), puis la question rapportée.
- compétences : c4.fr.langue.subordonnees · c4.fr.langue.phrase-complexe · c4.fr.langue.sujet-complements
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : french-4e-vocabulary
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mots manquants) "

### Niveau 1 · `french-4e-sentence-subordinate-clauses-1`

- consigne : Trouve la conjonction de subordination, la subordonnée ou la principale. La règle est affichée.

Pour tous les items :
- aide « La conjonctive » :
  - Une conjonction de subordination accroche une subordonnée à la principale : que, quand, lorsque, si, comme, puisque, parce que, bien que, avant que.
  - La subordonnée commence par la conjonction et va jusqu’au bout de son verbe et de ses compléments.
  - La principale peut se dire seule ; la subordonnée, non.

1. énoncé : « Je reste à la maison parce qu’il pleut. » Quelle est la conjonction de subordination ?
   - lu : Je reste à la maison parce qu’il pleut. Quelle est la conjonction de subordination ?
   - choix : je · à · parce qu’
   - réponse : parce qu’
   - indice : Cherche le mot qui accroche la deuxième proposition à la première.
   - explication : « Parce qu’ » accroche « il pleut » à « je reste à la maison » : c’est la conjonction de subordination. Elle s’écrit en deux mots.
2. énoncé : « Lorsque le film commence, on éteint la lumière. » Quelle est la subordonnée ?
   - lu : Lorsque le film commence, on éteint la lumière. Quelle est la subordonnée ?
   - choix : lorsque le film commence · on éteint la lumière · le film commence
   - réponse : lorsque le film commence
   - indice : La subordonnée commence par la conjonction.
   - explication : La subordonnée commence par « lorsque » et va jusqu’à « commence ». « Le film commence » oublie la conjonction ; « on éteint la lumière » est la principale.
3. énoncé : « Nous sortirons si le soleil revient. » Quelle est la principale ?
   - lu : Nous sortirons si le soleil revient. Quelle est la principale ?
   - choix : si le soleil revient · nous sortirons · le soleil revient
   - réponse : nous sortirons
   - indice : Laquelle peut se dire seule ?
   - explication : « Nous sortirons » se dit seule : c’est la principale. « Si le soleil revient » est la subordonnée, accrochée par « si ».
4. énoncé : « Elle sait que tu as gagné. » Quelle est la conjonction de subordination ?
   - lu : Elle sait que tu as gagné. Quelle est la conjonction de subordination ?
   - choix : sait · que · as
   - réponse : que
   - indice : « Sait » et « as » sont des verbes. Quel mot relie les deux propositions ?
   - explication : « Que » relie « elle sait » et « tu as gagné » : c’est la conjonction de subordination. Il ne remplace aucun nom.
5. énoncé : « Bien qu’il soit fatigué, Tom finit son puzzle. » Quelle est la subordonnée ?
   - lu : Bien qu’il soit fatigué, Tom finit son puzzle. Quelle est la subordonnée ?
   - choix : Tom finit son puzzle · il soit fatigué · bien qu’il soit fatigué
   - réponse : bien qu’il soit fatigué
   - indice : La subordonnée commence par la conjonction, ici en deux mots.
   - explication : La subordonnée va de « bien qu’ » jusqu’à « fatigué ». Sans la conjonction, « il soit fatigué » n’est pas complet ; « Tom finit son puzzle » est la principale.
6. énoncé : « Puisque tu es prêt, nous pouvons partir. » Quelle est la conjonction de subordination ?
   - lu : Puisque tu es prêt, nous pouvons partir. Quelle est la conjonction de subordination ?
   - choix : puisque · tu · nous
   - réponse : puisque
   - indice : Le premier mot de la phrase accroche la subordonnée.
   - explication : « Puisque » accroche « tu es prêt » à la principale « nous pouvons partir » : c’est la conjonction de subordination.
7. énoncé : « On voit que la mer monte. » Combien de propositions ?
   - lu : On voit que la mer monte. Combien de propositions ?
   - choix : une · deux · trois
   - réponse : deux
   - indice : Compte les verbes conjugués.
   - explication : Deux verbes conjugués, « voit » et « monte » : deux propositions. La principale « on voit », la subordonnée « que la mer monte ».
8. énoncé : « Rentre avant qu’il fasse nuit. » Quelle est la conjonction de subordination ?
   - lu : Rentre avant qu’il fasse nuit. Quelle est la conjonction de subordination ?
   - choix : rentre · avant qu’ · nuit
   - réponse : avant qu’
   - indice : Elle s’écrit en deux mots, juste avant « il ».
   - explication : « Avant qu’ » accroche « il fasse nuit » à « rentre » : c’est la conjonction de subordination, en deux mots.

### Niveau 2 · `french-4e-sentence-subordinate-clauses-2`

- consigne : Que dit la subordonnée : complément du verbe, ou une circonstance ? La règle est affichée.

Pour tous les items :
- aide « Ce que dit la conjonctive » :
  - Complément du verbe : elle répond à « quoi ? » après le verbe (j’espère que tu viendras).
  - Cause : parce que, puisque, comme. Temps : quand, lorsque, pendant que.
  - Opposition : bien que, alors que, même si. Condition : si, à condition que.
  - Une circonstance peut souvent se déplacer dans la phrase ; un complément du verbe, non.

1. énoncé : « Je sais que tu as fait de ton mieux. » Que dit la subordonnée ?
   - lu : Je sais que tu as fait de ton mieux. Que dit la subordonnée ?
   - choix : complément du verbe · cause · temps
   - réponse : complément du verbe
   - indice : Pose la question : je sais quoi ?
   - explication : Je sais quoi ? Que tu as fait de ton mieux : la subordonnée complète le verbe « sais ». On ne peut pas la déplacer en tête de phrase.
2. énoncé : « Comme il pleuvait, le match a été annulé. » Que dit la subordonnée ?
   - lu : Comme il pleuvait, le match a été annulé. Que dit la subordonnée ?
   - choix : temps · cause · condition
   - réponse : cause
   - indice : Pourquoi le match a-t-il été annulé ?
   - explication : Le match a été annulé parce qu’il pleuvait : « comme » dit ici la cause. Remplace-le par « parce que » pour vérifier.
3. énoncé : « Je lis pendant que le gâteau cuit. » Que dit la subordonnée ?
   - lu : Je lis pendant que le gâteau cuit. Que dit la subordonnée ?
   - choix : cause · opposition · temps
   - réponse : temps
   - indice : À quel moment est-ce que je lis ?
   - explication : « Pendant que » dit le moment : je lis au même moment que le gâteau cuit. C’est une circonstance de temps.
4. énoncé : « Bien qu’elle ait couru, Léa a raté son train. » Que dit la subordonnée ?
   - lu : Bien qu’elle ait couru, Léa a raté son train. Que dit la subordonnée ?
   - choix : opposition · cause · temps
   - réponse : opposition
   - indice : En courant, on s’attend à attraper son train. Est-ce ce qui arrive ?
   - explication : Léa a couru, et pourtant elle a raté son train : « bien que » dit l’opposition entre ce qu’on attend et ce qui arrive.
5. énoncé : « Si tu révises, tu réussiras. » Que dit la subordonnée ?
   - lu : Si tu révises, tu réussiras. Que dit la subordonnée ?
   - choix : temps · condition · cause
   - réponse : condition
   - indice : Réussiras-tu dans tous les cas ?
   - explication : Tu réussiras à une condition : réviser. « Si » dit ici la condition.
6. énoncé : « Je me demande si tu réussiras. » Que dit la subordonnée ?
   - lu : Je me demande si tu réussiras. Que dit la subordonnée ?
   - choix : condition · complément du verbe · opposition
   - réponse : complément du verbe
   - indice : Pose la question : je me demande quoi ?
   - explication : Je me demande quoi ? Si tu réussiras : c’est une question rapportée, complément du verbe. Ce « si » ne dit pas une condition.
7. énoncé : « Il est sorti alors qu’on lui avait dit de rester. » Que dit la subordonnée ?
   - lu : Il est sorti alors qu’on lui avait dit de rester. Que dit la subordonnée ?
   - choix : temps · cause · opposition
   - réponse : opposition
   - indice : Lui avait-on dit de sortir, ou de rester ?
   - explication : On lui avait dit de rester, et pourtant il est sorti : « alors que » dit ici l’opposition, pas le moment.
8. énoncé : « Tout le monde espère qu’il fera beau. » Que dit la subordonnée ?
   - lu : Tout le monde espère qu’il fera beau. Que dit la subordonnée ?
   - choix : condition · complément du verbe · cause
   - réponse : complément du verbe
   - indice : Pose la question : tout le monde espère quoi ?
   - explication : Tout le monde espère quoi ? Qu’il fera beau : la subordonnée complète le verbe « espère ».

### Niveau 3 · `french-4e-sentence-subordinate-clauses-3`

- consigne : Question rapportée : dis si elle est totale ou partielle, ou choisis la bonne fin. La règle est affichée.

Pour tous les items :
- aide « L’interrogative indirecte » :
  - C’est une question rapportée après un verbe comme demander, se demander, savoir.
  - Totale : on y répond par oui ou non. Elle commence par « si » (je ne sais pas si le magasin est ouvert).
  - Partielle : elle porte sur une seule chose. Elle commence par qui, où, quand, comment, pourquoi ou ce que.
  - Ni point d’interrogation, ni sujet inversé, ni « est-ce que ».

1. énoncé : « Je me demande si le car est arrivé. » Totale ou partielle ?
   - lu : Je me demande si le car est arrivé. Totale ou partielle ?
   - choix : totale · partielle
   - réponse : totale
   - indice : Peut-on répondre par oui ou par non ?
   - explication : Le car est-il arrivé ? On répond oui ou non : la question est totale. Elle commence par « si ».
2. énoncé : « Dis-moi pourquoi tu ris. » Totale ou partielle ?
   - lu : Dis-moi pourquoi tu ris. Totale ou partielle ?
   - choix : totale · partielle
   - réponse : partielle
   - indice : Peut-on répondre par oui ou par non ?
   - explication : Pourquoi ris-tu ? On ne répond pas par oui ou non, mais par une raison : la question est partielle, et porte sur la cause.
3. énoncé : « Il ne sait pas quand le cours commence. » Totale ou partielle ?
   - lu : Il ne sait pas quand le cours commence. Totale ou partielle ?
   - choix : partielle · totale
   - réponse : partielle
   - indice : La question porte-t-elle sur une seule chose ?
   - explication : Quand le cours commence-t-il ? On répond par un moment : la question est partielle.
4. énoncé : « La professeure demande si tout le monde a compris. » Totale ou partielle ?
   - lu : La professeure demande si tout le monde a compris. Totale ou partielle ?
   - choix : partielle · totale
   - réponse : totale
   - indice : Par quel mot la question commence-t-elle ?
   - explication : Tout le monde a-t-il compris ? On répond oui ou non : la question est totale, et commence par « si ».
5. énoncé : Question : « Est-ce que tu as faim ? » Rapportée : Je te demande …
   - choix : est-ce que tu as faim · si tu as faim · que tu as faim
   - réponse : si tu as faim
   - indice : On répond par oui ou non. Quel mot commence la question rapportée ?
   - explication : Une question totale rapportée commence par « si » : je te demande si tu as faim. « Est-ce que » disparaît, comme le point d’interrogation.
6. énoncé : Question : « Où as-tu rangé ton sac ? » Rapportée : Elle me demande …
   - choix : où as-tu rangé ton sac · si j’ai rangé mon sac · où j’ai rangé mon sac
   - réponse : où j’ai rangé mon sac
   - indice : La question porte sur le lieu. Et le sujet reste-t-il après le verbe ?
   - explication : Elle me demande où j’ai rangé mon sac : « où » reste, le sujet repasse devant le verbe, et « tu » devient « je », puisque la question m’est posée.
7. énoncé : Question : « Qu’est-ce que tu veux ? » Rapportée : Je te demande …
   - choix : ce que tu veux · qu’est-ce que tu veux · si tu veux
   - réponse : ce que tu veux
   - indice : La question porte sur une seule chose. Relis la troisième ligne de la règle.
   - explication : Une question partielle rapportée peut commencer par « ce que » : je te demande ce que tu veux. « Est-ce que » disparaît, comme le dit la dernière ligne. « Si tu veux » changerait la question.
8. énoncé : Question : « Viendras-tu samedi ? » Rapportée : Il me demande …
   - choix : quand je viendrai · si je viendrai samedi · viendras-tu samedi
   - réponse : si je viendrai samedi
   - indice : On répond par oui ou non. Et qui viendra ?
   - explication : Une question totale : « si ». Il me la pose, donc « tu » devient « je » : il me demande si je viendrai samedi.

## Voix et paroles · `passive-reported`

> F26 p. 18 (« Comprendre la construction de la voix passive » ; « Insérer dans un texte des paroles rapportées au discours indirect en alternance avec le discours direct »). 2020, p. 21, 22 et 24.

- description : Voix active ou passive et le complément d’agent, puis les paroles rapportées au discours indirect, à côté du discours direct.
- compétences : c4.fr.langue.passif · c4.fr.langue.types-formes · c4.fr.langue.discours-rapporte · c4.fr.langue.enonciation
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : french-4e-vocabulary
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mots manquants) "

### Niveau 1 · `french-4e-sentence-passive-reported-1`

- consigne : Voix active ou passive ? Trouve aussi qui fait l’action. La règle est affichée.

Pour tous les items :
- aide « La voix passive » :
  - Voix active : le sujet fait l’action (la tempête abat l’arbre).
  - Voix passive : le sujet subit l’action. Le verbe se forme avec être et un participe passé (l’arbre est abattu).
  - Le complément d’agent dit qui fait l’action. Il commence par « par » ou « de ». Il peut manquer.
  - Le temps du passif est celui du verbe être : est abattu, présent ; a été abattu, passé composé.

1. énoncé : « Le match est arbitré par une jeune femme. » Quelle voix ?
   - lu : Le match est arbitré par une jeune femme. Quelle voix ?
   - choix : active · passive
   - réponse : passive
   - indice : Le match fait-il l’action, ou la subit-il ?
   - explication : Le match ne fait rien, il est arbitré : voix passive, avec être et le participe « arbitré ». « Par une jeune femme » dit qui arbitre.
2. énoncé : « Les élèves préparent une exposition. » Quelle voix ?
   - lu : Les élèves préparent une exposition. Quelle voix ?
   - choix : passive · active
   - réponse : active
   - indice : Qui prépare ? Le sujet fait-il l’action ?
   - explication : Les élèves font l’action de préparer : voix active. Au passif, on dirait : une exposition est préparée par les élèves.
3. énoncé : « La lettre a été écrite par mon grand-père. » Quel est le complément d’agent ?
   - lu : La lettre a été écrite par mon grand-père. Quel est le complément d’agent ?
   - choix : la lettre · a été écrite · par mon grand-père
   - réponse : par mon grand-père
   - indice : Qui a écrit la lettre ? Cherche le mot « par ».
   - explication : Mon grand-père a écrit la lettre : « par mon grand-père » est le complément d’agent. « La lettre » est le sujet, qui subit l’action.
4. énoncé : « Elle est arrivée en retard. » Est-ce la voix passive ?
   - lu : Elle est arrivée en retard. Est-ce la voix passive ?
   - choix : oui · non
   - réponse : non
   - indice : Le sujet subit-il une action faite par quelqu’un d’autre ?
   - explication : « Est arrivée » est le passé composé d’« arriver », qui se conjugue avec être. C’est elle qui arrive : voix active. Être + participe ne suffit pas.
5. énoncé : « La chanteuse est applaudie de tous. » Qui fait l’action d’applaudir ?
   - lu : La chanteuse est applaudie de tous. Qui fait l’action d’applaudir ?
   - choix : la chanteuse · tous
   - réponse : tous
   - indice : Le complément d’agent peut commencer par « de ».
   - explication : Tout le monde applaudit la chanteuse : « de tous » est le complément d’agent. La chanteuse, sujet, subit l’action.
6. énoncé : « Le chat a griffé le canapé. » À la voix passive :
   - lu : Le chat a griffé le canapé. Comment l’écrire à la voix passive ?
   - choix : Le canapé est griffé par le chat. · Le canapé a été griffé par le chat. · Le canapé a griffé le chat.
   - réponse : Le canapé a été griffé par le chat.
   - indice : « A griffé » est au passé composé : mets être au passé composé.
   - explication : Le passif garde le temps de la phrase : « a griffé », passé composé, donne « a été griffé ». « Est griffé » serait au présent.
7. énoncé : « Le gagnant sera annoncé ce soir. » Sait-on qui annoncera le gagnant ?
   - lu : Le gagnant sera annoncé ce soir. Sait-on qui annoncera le gagnant ?
   - choix : oui · non
   - réponse : non
   - indice : Y a-t-il un complément d’agent, avec « par » ?
   - explication : La phrase est au passif, sans complément d’agent : on ne sait pas qui annoncera le gagnant.
8. énoncé : « Ce pont a été construit il y a cent ans. » À quel temps est le verbe ?
   - lu : Ce pont a été construit il y a cent ans. À quel temps est le verbe ?
   - choix : présent · passé composé · plus-que-parfait
   - réponse : passé composé
   - indice : Regarde le verbe être : « a été ».
   - explication : « A été » est le passé composé d’être : le passif « a été construit » est au passé composé.

### Niveau 2 · `french-4e-sentence-passive-reported-2`

- consigne : Paroles rapportées : choisis la phrase au discours indirect, ou trouve-la. La règle est affichée.

Pour tous les items :
- aide « Du direct à l’indirect » :
  - Discours direct : les mots exacts, entre guillemets. Indirect : après un verbe de parole, sans guillemets.
  - Je, tu, mon, ton changent selon qui parle et à qui (il, je, son, mon).
  - Après un verbe de parole au passé (il a dit), le présent devient imparfait et le futur devient conditionnel.
  - Un ordre devient « de » et l’infinitif (elle me dit de ranger).

1. énoncé : Nora dit : « Je suis en retard. » Au discours indirect : Nora dit …
   - lu : Nora dit : Je suis en retard. Au discours indirect : Nora dit (mots manquants)
   - choix : que je suis en retard · qu’elle était en retard · qu’elle est en retard
   - réponse : qu’elle est en retard
   - indice : « Dit » est au présent : le temps change-t-il ?
   - explication : Nora parle d’elle : « je » devient « elle ». « Dit » est au présent : le verbe reste au présent, qu’elle est en retard.
2. énoncé : Nora a dit : « Je suis en retard. » Au discours indirect : Nora a dit …
   - lu : Nora a dit : Je suis en retard. Au discours indirect : Nora a dit (mots manquants)
   - choix : qu’elle était en retard · qu’elle sera en retard · que j’étais en retard
   - réponse : qu’elle était en retard
   - indice : « A dit » est au passé : relis la troisième ligne de la règle.
   - explication : Après « a dit », le présent devient imparfait : « suis » devient « était ». Et « je » devient « elle » : qu’elle était en retard.
3. énoncé : Hugo a dit : « Je viendrai. » Au discours indirect : Hugo a dit …
   - lu : Hugo a dit : Je viendrai. Au discours indirect : Hugo a dit (mots manquants)
   - choix : qu’il venait · que je viendrais · qu’il viendrait
   - réponse : qu’il viendrait
   - indice : Après un verbe au passé, que devient le futur ?
   - explication : Après « a dit », le futur « viendrai » devient le conditionnel « viendrait », et « je » devient « il ».
4. énoncé : L’entraîneur crie : « Courez plus vite ! » Au discours indirect : L’entraîneur nous crie …
   - lu : L’entraîneur crie : Courez plus vite ! Au discours indirect : L’entraîneur nous crie (mots manquants)
   - choix : de courir plus vite · qu’on court plus vite · courez plus vite
   - réponse : de courir plus vite
   - indice : C’est un ordre. Relis la dernière ligne de la règle.
   - explication : Un ordre rapporté devient « de » et l’infinitif : l’entraîneur nous crie de courir plus vite. « Qu’on court » en ferait un simple fait.
5. énoncé : Ma mère m’a demandé : « As-tu fini tes devoirs ? » Au discours indirect : Ma mère m’a demandé …
   - lu : Ma mère m’a demandé : As-tu fini tes devoirs ? Au discours indirect : Ma mère m’a demandé (mots manquants)
   - choix : si tu avais fini tes devoirs · si j’avais fini mes devoirs · as-tu fini tes devoirs
   - réponse : si j’avais fini mes devoirs
   - indice : C’est à moi qu’elle parle : que deviennent « tu » et « tes » ?
   - explication : La question m’est posée : « tu » devient « je », « tes » devient « mes ». Une question totale rapportée commence par « si », et après « a demandé », « as fini » devient « avais fini ».
6. énoncé : Tom m’a dit : « Ton vélo est crevé. » Au discours indirect : Tom m’a dit …
   - lu : Tom m’a dit : Ton vélo est crevé. Au discours indirect : Tom m’a dit (mots manquants)
   - choix : que son vélo était crevé · que mon vélo était crevé · que ton vélo était crevé
   - réponse : que mon vélo était crevé
   - indice : Tom parle de quel vélo : le sien, ou le mien ?
   - explication : Tom me parle de mon vélo : « ton » devient « mon ». « Son vélo » serait celui de Tom.
7. énoncé : Léa a dit qu’elle avait froid. Puis elle a crié : « Ferme la fenêtre ! » Quelle phrase est au discours indirect ?
   - lu : Léa a dit qu’elle avait froid. Puis elle a crié, entre guillemets : Ferme la fenêtre ! Quelle phrase est au discours indirect ?
   - choix : la première · la deuxième
   - réponse : la première
   - indice : Où sont les guillemets ?
   - explication : La première phrase rapporte les paroles de Léa après « a dit que », sans guillemets : discours indirect. La deuxième donne ses mots exacts, entre guillemets : discours direct.
8. énoncé : Le directeur annonce : « La cantine sera fermée lundi. » Au discours indirect : Le directeur annonce …
   - lu : Le directeur annonce : La cantine sera fermée lundi. Au discours indirect : Le directeur annonce (mots manquants)
   - choix : que la cantine serait fermée lundi · que la cantine sera fermée lundi · la cantine sera fermée lundi
   - réponse : que la cantine sera fermée lundi
   - indice : « Annonce » est au présent : le futur change-t-il ?
   - explication : « Annonce » est au présent : le futur reste au futur, « sera fermée ». Le conditionnel ne vient qu’après un verbe au passé.

## Les temps composés · `compound-tenses`

> F26 p. 18 (« Identifier la morphologie du plus-que-parfait, du passé antérieur, du futur antérieur et du conditionnel » ; « variation de leur radical ») et p. 14 (« difficultés orthographiques liées aux radicaux verbaux (indicatif et impératif) »). 2020, p. 24.

- description : Reconnaître le plus-que-parfait, le passé antérieur, le futur antérieur et le conditionnel passé, puis conjuguer les verbes dont le radical change.
- compétences : c4.fr.langue.morphologie-verbale · c4.fr.langue.temps-a-memoriser · c4.fr.langue.valeurs-des-temps
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : french-4e-vocabulary
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `french-4e-sentence-compound-tenses-1`

- consigne : Quel est le temps du verbe ? Regarde d’abord l’auxiliaire. La règle est affichée.

Pour tous les items :
- aide « Les temps composés » :
  - Un temps composé : l’auxiliaire avoir ou être, puis le participe passé.
  - Le temps de l’auxiliaire donne le nom du temps composé.
  - Imparfait → plus-que-parfait (il avait mangé). Passé simple → passé antérieur (il eut mangé).
  - Futur → futur antérieur (il aura mangé). Conditionnel → conditionnel passé (il aurait mangé).

1. énoncé : « Quand nous arrivâmes, le train était parti. » À quel temps est « était parti » ?
   - lu : Quand nous arrivâmes, le train était parti. À quel temps est « était parti » ?
   - choix : passé composé · plus-que-parfait · passé antérieur
   - réponse : plus-que-parfait
   - indice : « Était » : à quel temps est l’auxiliaire ?
   - explication : L’auxiliaire « était » est à l’imparfait : « était parti » est au plus-que-parfait. Le train est parti avant notre arrivée.
2. énoncé : « Dès qu’il eut fini, il sortit. » À quel temps est « eut fini » ?
   - lu : Dès qu’il eut fini, il sortit. À quel temps est « eut fini » ?
   - choix : passé antérieur · plus-que-parfait · passé simple
   - réponse : passé antérieur
   - indice : « Eut » : à quel temps est l’auxiliaire avoir ?
   - explication : « Eut » est le passé simple d’avoir : « eut fini » est au passé antérieur. « Eut » seul serait au passé simple, mais ici il y a un participe.
3. énoncé : « Demain soir, j’aurai terminé mon exposé. » À quel temps est « aurai terminé » ?
   - lu : Demain soir, j’aurai terminé mon exposé. À quel temps est « aurai terminé » ?
   - choix : conditionnel passé · futur simple · futur antérieur
   - réponse : futur antérieur
   - indice : « Aurai », sans s : futur ou conditionnel ?
   - explication : « Aurai » est le futur d’avoir : « aurai terminé » est au futur antérieur. Avec un s, « aurais », ce serait le conditionnel.
4. énoncé : « Sans ton aide, j’aurais raté le bus. » À quel temps est « aurais raté » ?
   - lu : Sans ton aide, j’aurais raté le bus. À quel temps est « aurais raté » ?
   - choix : futur antérieur · conditionnel passé · plus-que-parfait
   - réponse : conditionnel passé
   - indice : « Aurais », avec un s : futur ou conditionnel ?
   - explication : « Aurais » est le conditionnel d’avoir : « aurais raté » est au conditionnel passé. Je n’ai pas raté le bus : c’est ce qui serait arrivé.
5. énoncé : « Elle avait oublié ses clés. » À quel temps est « avait oublié » ?
   - lu : Elle avait oublié ses clés. À quel temps est « avait oublié » ?
   - choix : imparfait · passé composé · plus-que-parfait
   - réponse : plus-que-parfait
   - indice : Il y a un auxiliaire et un participe : c’est un temps composé.
   - explication : « Avait » est à l’imparfait, suivi du participe « oublié » : plus-que-parfait. L’imparfait seul serait « elle oubliait ».
6. énoncé : « Quand vous aurez rangé, vous pourrez jouer. » À quel temps est « aurez rangé » ?
   - lu : Quand vous aurez rangé, vous pourrez jouer. À quel temps est « aurez rangé » ?
   - choix : futur antérieur · passé composé · conditionnel passé
   - réponse : futur antérieur
   - indice : « Aurez » : à quel temps est l’auxiliaire ?
   - explication : « Aurez » est le futur d’avoir : « aurez rangé » est au futur antérieur. Ranger se fera avant de jouer.
7. énoncé : « Lorsqu’elles furent arrivées, la fête commença. » À quel temps est « furent arrivées » ?
   - lu : Lorsqu’elles furent arrivées, la fête commença. À quel temps est « furent arrivées » ?
   - choix : plus-que-parfait · passé simple · passé antérieur
   - réponse : passé antérieur
   - indice : « Furent » : à quel temps est l’auxiliaire être ?
   - explication : « Furent » est le passé simple d’être : « furent arrivées » est au passé antérieur. Elles sont arrivées juste avant que la fête commence.
8. énoncé : « Nous serions venus plus tôt. » À quel temps est « serions venus » ?
   - lu : Nous serions venus plus tôt. À quel temps est « serions venus » ?
   - choix : conditionnel passé · futur antérieur · plus-que-parfait
   - réponse : conditionnel passé
   - indice : « Serions » : futur ou conditionnel ?
   - explication : « Serions » est le conditionnel d’être : « serions venus » est au conditionnel passé. Au futur antérieur, on dirait « serons venus ».

### Niveau 2 · `french-4e-sentence-compound-tenses-2`

- consigne : Choisis la bonne forme du verbe : son radical change. La règle est affichée.

Pour tous les items :
- aide « Les verbes dont le radical change » :
  - appeler, jeter : deux l ou deux t devant un e muet (je jette, nous jetons).
  - acheter, geler : è devant un e muet (il gèle, nous gelons).
  - nettoyer, envoyer : y devient i devant un e muet (j’envoie, nous envoyons).
  - venir, prendre, pouvoir : le radical change avec la personne (je tiens, ils tiennent).
  - Impératif : va, mais vas-y ; aie et sois (avoir, être).

1. énoncé : Ils … leur chien pour rentrer.
   - choix : appelent · appellent · apellent
   - réponse : appellent
   - indice : Le e de la fin est muet : appeler double alors son l.
   - explication : Devant un e muet, appeler double le l : ils appellent. Avec nous, le e se prononce : nous appelons, un seul l.
2. énoncé : Elle … une nouvelle trousse.
   - choix : achete · achette · achète
   - réponse : achète
   - indice : Acheter ne double pas sa consonne : il prend un accent.
   - explication : Devant un e muet, acheter prend un accent grave : elle achète. Il ne double pas le t.
3. énoncé : Ils … le gymnase après le match.
   - choix : nettoient · nettoyent · nettoie
   - réponse : nettoient
   - indice : Devant un e muet, le y devient i.
   - explication : Nettoyer change son y en i devant un e muet : ils nettoient. « Nettoie » est au singulier.
4. énoncé : Mes cousins … nous voir dimanche.
   - choix : venent · viennent · vienent
   - réponse : viennent
   - indice : Venir, comme tenir : ils tiennent.
   - explication : Au présent, venir change de radical : nous venons, mais ils viennent, avec deux n.
5. énoncé : Ils … le bus tous les matins.
   - choix : prennent · prenent · prendent
   - réponse : prennent
   - indice : Prendre perd son d au pluriel et double son n avec ils.
   - explication : Au présent : nous prenons, mais ils prennent, avec deux n et sans d.
6. énoncé : Les élèves ne … pas sortir avant la sonnerie.
   - choix : peut · pouvent · peuvent
   - réponse : peuvent
   - indice : Le sujet est au pluriel. Pouvoir change de radical : je peux, ils …
   - explication : Pouvoir : je peux, nous pouvons, ils peuvent. « Peut » est au singulier, « pouvent » n’existe pas.
7. énoncé : La porte est ouverte : …-y tout de suite !
   - lu : La porte est ouverte : (mot manquant) y tout de suite !
   - choix : va · vas
   - réponse : vas
   - indice : Devant « y », l’impératif d’aller reprend un s.
   - explication : L’impératif d’aller est « va », mais devant « y », on ajoute un s qui s’entend : vas-y.
8. énoncé : … confiance en toi.
   - choix : Aies · Aie · Ai
   - réponse : Aie
   - indice : Impératif d’avoir : on parle à toi, sans s.
   - explication : L’impératif d’avoir est « aie », sans s. « Ai » est le présent, j’ai ; « aies » est le subjonctif.

## Les modes · `moods`

> F26 p. 18 (« Étudier la valeur temporelle et les valeurs modales du conditionnel » ; « Identifier les valeurs du mode subjonctif »). Choisir la forme du subjonctif est en 3e (F26 p. 19) : ici, on reconnaît sa valeur, on ne choisit pas une forme. Le niveau 3 de Liens (`french-4e-vocabulary-conjunctions-3`) reste au Cabinet des mots : la grille ne change pas (décision du 21 octobre 2026). Le doublon possible est une question au mainteneur. 2020, p. 24.

- description : Ce que dit le conditionnel (futur vu du passé, hypothèse, souhait, politesse, information pas sûre), puis ce que dit le subjonctif.
- compétences : c4.fr.langue.valeurs-des-temps · c4.fr.langue.morphologie-verbale
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : french-4e-vocabulary
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

### Niveau 1 · `french-4e-sentence-moods-1`

- consigne : Que dit le conditionnel dans cette phrase ? La règle est affichée.

Pour tous les items :
- aide « Les emplois du conditionnel » :
  - Un temps : le futur vu depuis le passé (il disait qu’il partirait).
  - Une hypothèse : ce qui arriverait si (si j’avais le temps, je dessinerais).
  - Un souhait (j’aimerais partir) ou une demande polie (voudrais-tu venir ?).
  - Une information pas sûre (le voleur serait en fuite).

1. énoncé : « Elle m’a promis qu’elle rangerait sa chambre. » Que dit le conditionnel « rangerait » ?
   - lu : Elle m’a promis qu’elle rangerait sa chambre. Que dit le conditionnel « rangerait » ?
   - choix : hypothèse · futur vu du passé · politesse
   - réponse : futur vu du passé
   - indice : « A promis » est au passé. Ranger, c’était avant ou après la promesse ?
   - explication : Elle a promis, puis elle rangera : le conditionnel dit un futur vu depuis le passé. Au présent, on dirait : elle promet qu’elle rangera.
2. énoncé : « Si j’avais un vélo, j’irais au collège seul. » Que dit le conditionnel « irais » ?
   - lu : Si j’avais un vélo, j’irais au collège seul. Que dit le conditionnel « irais » ?
   - choix : hypothèse · futur vu du passé · information pas sûre
   - réponse : hypothèse
   - indice : Ai-je un vélo aujourd’hui ?
   - explication : Je n’ai pas de vélo : « irais » dit ce qui arriverait si j’en avais un. C’est une hypothèse, avec « si » et l’imparfait.
3. énoncé : « Auriez-vous un stylo à me prêter ? » Pourquoi le conditionnel « auriez » ?
   - lu : Auriez-vous un stylo à me prêter ? Pourquoi le conditionnel « auriez » ?
   - choix : information pas sûre · hypothèse · politesse
   - réponse : politesse
   - indice : Compare avec « Avez-vous un stylo ? » : laquelle est la plus douce ?
   - explication : Le conditionnel adoucit la demande : « Auriez-vous » est plus poli que « Avez-vous ». C’est une demande polie.
4. énoncé : « Selon la radio, l’orage serait passé sur la ville. » Que dit le conditionnel « serait passé » ?
   - lu : Selon la radio, l’orage serait passé sur la ville. Que dit le conditionnel « serait passé » ?
   - choix : information pas sûre · hypothèse · souhait
   - réponse : information pas sûre
   - indice : Qui donne l’information ? Est-elle vérifiée ?
   - explication : « Selon la radio » : on rapporte une information sans la garantir. Le conditionnel dit qu’elle n’est pas sûre.
5. énoncé : « J’aimerais tant voir la mer. » Que dit le conditionnel « aimerais » ?
   - lu : J’aimerais tant voir la mer. Que dit le conditionnel « aimerais » ?
   - choix : futur vu du passé · souhait · information pas sûre
   - réponse : souhait
   - indice : Voir la mer, est-ce un fait, ou une envie ?
   - explication : « J’aimerais » dit une envie : c’est un souhait. Le conditionnel montre ce qu’on désire, pas ce qui est.
6. énoncé : « Tom pensait que le cours finirait tôt. » Que dit le conditionnel « finirait » ?
   - lu : Tom pensait que le cours finirait tôt. Que dit le conditionnel « finirait » ?
   - choix : souhait · hypothèse · futur vu du passé
   - réponse : futur vu du passé
   - indice : « Pensait » est au passé. La fin du cours vient-elle après ?
   - explication : Tom pensait, et la fin du cours venait après : « finirait » est un futur vu depuis le passé. Au présent : Tom pense que le cours finira tôt.
7. énoncé : « Si tu partais maintenant, tu arriverais à l’heure. » Que dit le conditionnel « arriverais » ?
   - lu : Si tu partais maintenant, tu arriverais à l’heure. Que dit le conditionnel « arriverais » ?
   - choix : politesse · hypothèse · futur vu du passé
   - réponse : hypothèse
   - indice : Cherche le petit mot qui pose une condition.
   - explication : « Si tu partais » pose une condition : « arriverais » dit ce qui arriverait alors. C’est une hypothèse.
8. énoncé : « D’après le journal, le musée fermerait l’été prochain. » Que dit le conditionnel « fermerait » ?
   - lu : D’après le journal, le musée fermerait l’été prochain. Que dit le conditionnel « fermerait » ?
   - choix : souhait · information pas sûre · futur vu du passé
   - réponse : information pas sûre
   - indice : « D’après le journal » : l’information est-elle vérifiée ?
   - explication : « D’après le journal » : on rapporte une information sans la garantir. Ce n’est pas un futur vu du passé : aucun verbe au passé ne l’annonce.

### Niveau 2 · `french-4e-sentence-moods-2`

- consigne : Que dit le subjonctif dans cette phrase ? La règle est affichée.

Pour tous les items :
- aide « Ce que dit le subjonctif » :
  - Le subjonctif présente une action envisagée, pas un fait sûr.
  - Volonté : je veux que, je souhaite que. Obligation : il faut que.
  - Sentiment : je suis content que, j’ai peur que. But : pour que, afin que.
  - Opposition : bien que. Moment pas encore arrivé : avant que, jusqu’à ce que.
  - Après je sais que, je pense que, on affirme un fait : c’est l’indicatif.

1. énoncé : « Il faut que tu dormes davantage. » Que dit le subjonctif « dormes » ?
   - lu : Il faut que tu dormes davantage. Que dit le subjonctif « dormes » ?
   - choix : volonté · obligation · but
   - réponse : obligation
   - indice : « Il faut que » : est-ce une envie, ou ce qu’on doit faire ?
   - explication : « Il faut que » dit une obligation : tu dois dormir davantage. Le subjonctif présente ce qui doit se faire, pas un fait.
2. énoncé : « Je mets un réveil pour que tu sois à l’heure. » Que dit le subjonctif « sois » ?
   - lu : Je mets un réveil pour que tu sois à l’heure. Que dit le subjonctif « sois » ?
   - choix : but · obligation · opposition
   - réponse : but
   - indice : Pourquoi mets-je un réveil ? Dans quel but ?
   - explication : « Pour que » dit le but : le réveil sert à ce que tu sois à l’heure. Ce n’est pas encore fait.
3. énoncé : « Bien qu’il pleuve, nous jouons dehors. » Que dit le subjonctif « pleuve » ?
   - lu : Bien qu’il pleuve, nous jouons dehors. Que dit le subjonctif « pleuve » ?
   - choix : sentiment · but · opposition
   - réponse : opposition
   - indice : Avec la pluie, s’attend-on à jouer dehors ?
   - explication : Il pleut, et pourtant nous jouons dehors : « bien que » dit l’opposition. Il est toujours suivi du subjonctif.
4. énoncé : « Mes parents veulent que je fasse du sport. » Que dit le subjonctif « fasse » ?
   - lu : Mes parents veulent que je fasse du sport. Que dit le subjonctif « fasse » ?
   - choix : volonté · sentiment · moment pas encore arrivé
   - réponse : volonté
   - indice : Regarde le verbe avant « que » : « veulent ».
   - explication : « Veulent que » dit la volonté de mes parents : faire du sport est ce qu’ils veulent, pas un fait.
5. énoncé : « Je suis triste que tu partes. » Que dit le subjonctif « partes » ?
   - lu : Je suis triste que tu partes. Que dit le subjonctif « partes » ?
   - choix : volonté · sentiment · but
   - réponse : sentiment
   - indice : « Je suis triste » : que dit-on ici ?
   - explication : « Je suis triste que » dit un sentiment : le subjonctif suit les mots qui disent ce qu’on ressent.
6. énoncé : « Range tes affaires avant que nous partions. » Que dit le subjonctif « partions » ?
   - lu : Range tes affaires avant que nous partions. Que dit le subjonctif « partions » ?
   - choix : opposition · moment pas encore arrivé · but
   - réponse : moment pas encore arrivé
   - indice : Sommes-nous déjà partis ?
   - explication : « Avant que » dit un moment qui n’est pas encore arrivé : nous ne sommes pas encore partis. « Partions » est au subjonctif ; à l’indicatif, on dirait « partons ».
7. énoncé : « Je pense que tu as raison. » Le verbe « as » est-il au subjonctif ?
   - lu : Je pense que tu as raison. Le verbe « as » est-il au subjonctif ?
   - choix : oui · non
   - réponse : non
   - indice : Relis la dernière ligne de la règle.
   - explication : Après « je pense que », on affirme un fait : « as » est à l’indicatif. Au subjonctif, ce serait « que tu aies ».
8. énoncé : « Il faut que nous allions au gymnase. » Quel verbe est au subjonctif ?
   - lu : Il faut que nous allions au gymnase. Quel verbe est au subjonctif ?
   - choix : faut · allions
   - réponse : allions
   - indice : Quel verbe vient après « il faut que » ?
   - explication : Après « il faut que », le verbe est au subjonctif : « allions ». À l’indicatif, on dirait « nous allons ».

## Les plans

> Comme à l’Étalon : trois plans, jamais affichés dans le monde ouvert, qui servent à `parts.ts` pour découper les cinq parties (3 + 1 + 1). Le premier plan, en trois rangées, porte le corps 1 sur 3 (les relatives), 2 sur 3 (les conjonctives), 3 sur 3 (voix et paroles) ; le deuxième, le haut (les temps composés) ; le troisième, les abords (les modes). Aucun nom ne reprend un mot des phrases de pose de `contenu-coteaux.md` (poste, rebâti, leviers, place, plaque, tournante, réparée, couvert, voies, service, refaites). XP des lieux voisins (40, 50, 60) ; pas de coffre, le format n’en a plus (README, « Les plans »). Bloc gagné : celui des Roches (le Cabinet des mots, `french-4e-vocabulary`, le Parchemin), un lieu du monde ouvert seulement n’ayant pas de bloc à lui, confirmé par le directeur artistique. Réplique de fin : dite par le cantonnier, si le monde ouvert la reprend.
> Pas de « ## Au lieu · Archipéo » : les jumeaux attendent la catégorie de scène de chaque mission (GD-20) et l’objet des réponses de la scénette (les cales de roue). Pas de « ## Les demandes » : un lieu du monde ouvert seulement n’a pas de commande, comme l’Étalon.

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `french-4e-sentence-1` | La cabine d’aiguillage | 40 | La cabine tient debout. D’ici, on surveille toute la ligne. |
| `french-4e-sentence-2` | Le toit de la cabine | 50 | Un toit de fer sur la cabine. La pluie peut tomber. |
| `french-4e-sentence-3` | Les abords de la cabine | 60 | Tout est net autour de la cabine. La ligne se partage de nouveau. |
