---
lieu : technology-3e-digital
module : Informatique, réseaux et société
matière : technology
classe : 3e
description : Ce qui compose un réseau et comment les données y voyagent, les objets connectés et les données personnelles, puis lire un programme simple.
gardien : l’Abeille de topaze
icône : network
créature : Navette
---

# Ruche des réseaux

> Île de 3e en technologie, programme du cycle 4 en vigueur (BO n° 9 du 29 février 2024). Écrans existants seulement : la question à trou et la question sur un document (quatre lignes au plus sous le titre, une information par ligne). Écrire, mettre au point et exécuter un programme qui commande un objet réel (`c4.te.conception.programmer`) reste au travail de la classe : ici, un programme court se lit, écrit en français, une instruction par ligne, et l’élève dit ce qu’il fait. Les sigles sont évités ; « adresse IP » est expliquée une fois dans le rappel. L’évolution des objets se dit sans date, par « d’abord », « ensuite », « aujourd’hui ».

## Le réseau informatique · `computer-networks`

- description : Les éléments d’un réseau et l’adresse de chaque appareil, puis internet, les protocoles et le stockage des données.
- compétences : c4.te.fonctionnement.reseaux · c4.te.usages.numerique
- consigne : Lis la phrase ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : technology-3e-digital
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `technology-3e-digital-computer-networks-1`

Pour tous les items :
- aide « Les éléments d’un réseau » :
  - Un réseau : des appareils reliés qui échangent des données.
  - Ils sont reliés par un câble, ou sans fil, par le wifi.
  - La box relie le réseau de la maison à internet.
  - Le serveur : un ordinateur qui garde des données et répond aux demandes.
  - Chaque appareil a son adresse sur le réseau, un numéro : l’adresse IP.

1. énoncé : Pour se connecter à la box sans câble, la tablette utilise le …
   - choix : wifi · câble · chargeur
   - réponse : wifi
   - indice : Relis la ligne « Ils sont reliés » du rappel.
   - explication : Sans câble, la tablette se relie à la box par le wifi, une liaison sans fil.
2. énoncé : L’appareil qui relie le réseau de la maison à internet est la …
   - choix : tablette · box · imprimante
   - réponse : box
   - indice : Relis la ligne « La box » du rappel.
   - explication : La box relie tous les appareils de la maison à internet. La tablette et l’imprimante sont des appareils du réseau.
3. énoncé : "Le réseau de la maison de Jade\nL’ordinateur est relié à la box par un câble.\nLe téléphone et la console passent par le wifi."
   - question : Comment le téléphone est-il relié à la box ?
   - lu : Le réseau de la maison de Jade. L’ordinateur est relié à la box par un câble. Le téléphone et la console passent par le wifi.
   - choix : par un câble · sans fil, par le wifi · il n’est pas relié
   - réponse : sans fil, par le wifi
   - indice : Cherche la ligne où il est écrit « téléphone ».
   - explication : Le téléphone passe par le wifi : il est relié sans fil. C’est l’ordinateur qui a un câble.
4. énoncé : L’ordinateur qui garde les vidéos d’un site et les envoie à ceux qui les demandent est un …
   - choix : navigateur · clavier · serveur
   - réponse : serveur
   - indice : Relis la ligne « Le serveur » du rappel.
   - explication : Le serveur garde les vidéos et répond aux demandes. Le navigateur est le logiciel qui, sur ton appareil, affiche la vidéo.
5. énoncé : Pour que les données arrivent au bon appareil, chaque appareil du réseau a une …
   - choix : antenne · adresse · prise
   - réponse : adresse
   - indice : Relis la ligne « Chaque appareil » du rappel.
   - explication : Chaque appareil a son adresse sur le réseau : les données savent ainsi où aller, comme une lettre avec l’adresse de la maison.
6. énoncé : "Le réseau du collège\nLes ordinateurs de la salle sont reliés à un même boîtier.\nCe boîtier est relié à la box du collège.\nUn serveur garde les dossiers des élèves."
   - question : Où sont gardés les dossiers des élèves ?
   - lu : Le réseau du collège. Les ordinateurs de la salle sont reliés à un même boîtier. Ce boîtier est relié à la box du collège. Un serveur garde les dossiers des élèves.
   - choix : dans la box · sur le serveur · dans le boîtier
   - réponse : sur le serveur
   - indice : Cherche la ligne où il est écrit « dossiers ».
   - explication : Le serveur garde les dossiers : un élève les retrouve depuis n’importe quel ordinateur de la salle. Le boîtier et la box relient les appareils.
7. énoncé : Le numéro qui donne l’adresse d’un appareil sur le réseau s’appelle l’adresse …
   - choix : mail · postale · IP
   - réponse : IP
   - indice : Relis la ligne « Chaque appareil » du rappel.
   - explication : L’adresse IP est le numéro d’un appareil sur le réseau. L’adresse mail sert à recevoir des messages : c’est l’adresse d’une personne, pas d’un appareil.
8. énoncé : "La photo de Noé\nNoé envoie une photo à Lou.\nLa photo part du téléphone de Noé.\nElle passe par des serveurs d’internet.\nElle arrive sur le téléphone de Lou."
   - question : Par où passe la photo ?
   - lu : La photo de Noé. Noé envoie une photo à Lou. La photo part du téléphone de Noé. Elle passe par des serveurs d’internet. Elle arrive sur le téléphone de Lou.
   - choix : directement d’un téléphone à l’autre · par des serveurs d’internet · par le chargeur
   - réponse : par des serveurs d’internet
   - indice : Cherche la ligne où il est écrit « serveurs ».
   - explication : La photo ne va pas directement d’un téléphone à l’autre : elle passe par des serveurs d’internet, puis arrive chez Lou.

### Niveau 2 · `technology-3e-digital-computer-networks-2`

Pour tous les items :
- aide « Internet et les données » :
  - Internet : un réseau de réseaux, dans le monde entier.
  - Un protocole : des règles communes pour échanger, comme une langue partagée.
  - Les données voyagent en petits paquets, remis dans l’ordre à l’arrivée.
  - Stocker en ligne : les fichiers sont gardés sur des serveurs, dans des centres de données.
  - Ces centres consomment beaucoup d’électricité.

1. énoncé : Les règles communes que suivent les appareils pour échanger des données forment un …
   - choix : protocole · programme · paquet
   - réponse : protocole
   - indice : Relis la ligne « Un protocole » du rappel.
   - explication : Un protocole, ce sont les règles communes pour échanger : grâce à lui, des appareils différents se comprennent.
2. énoncé : Internet relie des millions de réseaux dans le monde : c’est un réseau de …
   - choix : sites · câbles · réseaux
   - réponse : réseaux
   - indice : Relis la ligne « Internet » du rappel.
   - explication : Internet relie entre eux des millions de réseaux : c’est un réseau de réseaux. Les sites sont des services qu’on y trouve.
3. énoncé : "La vidéo envoyée\nLa vidéo est coupée en petits paquets.\nLes paquets prennent des chemins différents.\nÀ l’arrivée, ils sont remis dans l’ordre."
   - question : Comment la vidéo voyage-t-elle ?
   - lu : La vidéo envoyée. La vidéo est coupée en petits paquets. Les paquets prennent des chemins différents. À l’arrivée, ils sont remis dans l’ordre.
   - choix : en un seul gros morceau · en petits paquets · par un seul câble
   - réponse : en petits paquets
   - indice : Relis la deuxième ligne du document.
   - explication : La vidéo est coupée en petits paquets, qui peuvent prendre des chemins différents. À l’arrivée, ils sont remis dans l’ordre.
4. énoncé : "Les photos de Mia\nMia range ses photos dans un espace en ligne.\nElle les voit sur son téléphone et sur l’ordinateur du salon."
   - question : Où sont vraiment gardées les photos ?
   - lu : Les photos de Mia. Mia range ses photos dans un espace en ligne. Elle les voit sur son téléphone et sur l’ordinateur du salon.
   - choix : seulement dans le téléphone · dans la box de la maison · sur des serveurs, dans un centre de données
   - réponse : sur des serveurs, dans un centre de données
   - indice : Relis la ligne « Stocker en ligne » du rappel.
   - explication : Stocker en ligne, c’est garder ses fichiers sur des serveurs, dans un centre de données : on les voit depuis chaque appareil relié.
5. énoncé : Les centres de données, pleins de serveurs, consomment beaucoup d’…
   - choix : essence · électricité · encre
   - réponse : électricité
   - indice : Relis la ligne « Ces centres consomment » du rappel.
   - explication : Les serveurs marchent jour et nuit, et il faut les refroidir : les centres de données consomment beaucoup d’électricité.
6. énoncé : "Le chemin d’une page web\nTu tapes l’adresse d’un site.\nTa demande part vers le serveur du site.\nLe serveur renvoie la page.\nTon navigateur l’affiche."
   - question : Qui envoie la page ?
   - lu : Le chemin d’une page web. Tu tapes l’adresse d’un site. Ta demande part vers le serveur du site. Le serveur renvoie la page. Ton navigateur l’affiche.
   - choix : le serveur du site · ton navigateur · la box
   - réponse : le serveur du site
   - indice : Cherche la ligne où il est écrit « renvoie ».
   - explication : Le serveur du site renvoie la page ; ton navigateur ne fait que l’afficher.
7. énoncé : Pour envoyer les données au bon endroit, le réseau lit l’… de l’appareil.
   - choix : adresse · écran · étiquette
   - réponse : adresse
   - indice : Chaque appareil a un numéro sur le réseau.
   - explication : Le réseau lit l’adresse de l’appareil, l’adresse IP, pour lui envoyer ses données, comme le facteur lit l’adresse sur l’enveloppe.
8. énoncé : "Deux façons de regarder un film\nLe télécharger une fois, puis le revoir sans internet.\nLe regarder en ligne à chaque fois."
   - question : Pour le voir dix fois, quelle façon fait voyager le moins de données ?
   - lu : Deux façons de regarder un film. Le télécharger une fois, puis le revoir sans internet. Le regarder en ligne à chaque fois.
   - choix : le regarder en ligne à chaque fois · le télécharger une fois · c’est pareil
   - réponse : le télécharger une fois
   - indice : Combien de fois le film passe-t-il par internet ?
   - explication : Téléchargé une fois, le film ne passe qu’une fois par internet. En ligne, il passe dix fois : dix fois plus de données, et d’électricité.

## Objets connectés et données personnelles · `connected-objects`

- description : Comment les objets évoluent et changent la société, les objets connectés, puis protéger ses données personnelles.
- compétences : c4.te.usages.evolution · c4.te.usages.numerique
- consigne : Lis la phrase ou le document, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : technology-3e-digital
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `technology-3e-digital-connected-objects-1`

Pour tous les items :
- aide « Les objets évoluent » :
  - Un objet évolue avec les besoins, les progrès techniques et la société.
  - Un objet connecté échange des données par un réseau.
  - On peut le commander à distance, avec un téléphone.
  - Les objets changent la vie des gens : travailler, payer, se déplacer.
  - Lire une frise : d’abord, ensuite, aujourd’hui.

1. énoncé : La montre qui envoie les pas comptés au téléphone est un objet …
   - choix : mécanique · connecté · naturel
   - réponse : connecté
   - indice : Relis la ligne « Un objet connecté » du rappel.
   - explication : La montre échange des données avec le téléphone : c’est un objet connecté.
2. énoncé : "Les cartes pour se déplacer\nD’abord : la carte en papier.\nEnsuite : le boîtier de navigation dans la voiture.\nAujourd’hui : l’application de cartes sur le téléphone."
   - question : Quel progrès technique a permis l’application ?
   - lu : Les cartes pour se déplacer. D’abord, la carte en papier. Ensuite, le boîtier de navigation dans la voiture. Aujourd’hui, l’application de cartes sur le téléphone.
   - choix : un papier plus solide · le téléphone connecté, qui sait où il est · des voitures plus rapides
   - réponse : le téléphone connecté, qui sait où il est
   - indice : Sur quel objet est l’application ?
   - explication : Le téléphone connecté sait où il se trouve et reçoit les cartes par le réseau : c’est ce progrès qui a permis l’application.
3. énoncé : Lancer le chauffage de la maison depuis son téléphone, c’est le commander à …
   - choix : distance · la main · l’heure
   - réponse : distance
   - indice : Relis la ligne « On peut le commander » du rappel.
   - explication : On n’est pas à côté du chauffage : on le commande à distance, par le réseau.
4. énoncé : "Payer au magasin\nD’abord : les pièces et les billets.\nEnsuite : la carte bancaire, avec un code.\nAujourd’hui : on approche la carte ou le téléphone, sans contact."
   - question : Qu’est-ce qui a changé pour les gens ?
   - lu : Payer au magasin. D’abord, les pièces et les billets. Ensuite, la carte bancaire, avec un code. Aujourd’hui, on approche la carte ou le téléphone, sans contact.
   - choix : on paie seulement en billets · on paie plus vite, sans sortir d’argent · on ne va plus au magasin
   - réponse : on paie plus vite, sans sortir d’argent
   - indice : Relis la dernière ligne du document.
   - explication : Aujourd’hui, on paie en approchant sa carte ou son téléphone : plus vite, sans pièces ni billets. L’objet a changé une habitude.
5. énoncé : L’enceinte connectée répond quand on lui parle : elle échange des données par un …
   - choix : haut-parleur · réseau · câble électrique
   - réponse : réseau
   - indice : Relis la ligne « Un objet connecté » du rappel.
   - explication : L’enceinte envoie la question par le réseau, et reçoit la réponse. Son haut-parleur, lui, sert à la dire.
6. énoncé : "Travailler à la maison\nAvec internet, des parents travaillent depuis chez eux.\nIls font des réunions en vidéo."
   - question : Quel changement ces objets ont-ils apporté ?
   - lu : Travailler à la maison. Avec internet, des parents travaillent depuis chez eux. Ils font des réunions en vidéo.
   - choix : travailler sans aller au bureau · travailler sans ordinateur · travailler seulement la nuit
   - réponse : travailler sans aller au bureau
   - indice : Relis la deuxième ligne du document.
   - explication : Grâce à internet et à la vidéo, certains travaillent depuis chez eux : les objets connectés ont changé la façon de travailler.
7. énoncé : La sonnette connectée envoie une alerte au téléphone quand quelqu’un sonne : elle … une information.
   - choix : fabrique · recycle · communique
   - réponse : communique
   - indice : Elle envoie l’alerte à un autre objet.
   - explication : Envoyer l’alerte au téléphone, c’est communiquer une information, par le réseau.
8. énoncé : "L’ampoule connectée\nOn l’allume avec une application.\nOn choisit sa couleur.\nOn règle l’heure où elle s’éteint."
   - question : Qu’est-ce qui la rend connectée ?
   - lu : L’ampoule connectée. On l’allume avec une application. On choisit sa couleur. On règle l’heure où elle s’éteint.
   - choix : elle éclaire en couleur · elle reçoit des ordres par le réseau · elle consomme peu
   - réponse : elle reçoit des ordres par le réseau
   - indice : Relis la ligne « Un objet connecté » du rappel.
   - explication : L’ampoule reçoit les ordres de l’application par le réseau : c’est ce qui la rend connectée. Éclairer en couleur ne demande pas de réseau.

### Niveau 2 · `technology-3e-digital-connected-objects-2`

Pour tous les items :
- aide « Tes données personnelles » :
  - Une donnée personnelle : une information sur toi (nom, photo, adresse, lieu où tu es).
  - Les objets connectés en collectent beaucoup.
  - Un mot de passe : long, et différent pour chaque compte.
  - Avant d’accepter, lis ce que l’application demande.
  - Une photo publiée peut être copiée, et rester en ligne.

1. énoncé : Ton nom, ta photo et l’adresse de ta maison sont des données …
   - choix : personnelles · publiques · techniques
   - réponse : personnelles
   - indice : Relis la ligne « Une donnée personnelle » du rappel.
   - explication : Ce sont des informations sur toi : des données personnelles. Elles se protègent, et ne se donnent pas à n’importe qui.
2. énoncé : "L’application de lampe de poche demande deux accès\nAllumer le flash du téléphone.\nLire tes contacts."
   - question : Quel accès est inutile pour éclairer ?
   - lu : L’application de lampe de poche demande deux accès. Allumer le flash du téléphone. Lire tes contacts.
   - choix : allumer le flash · lire tes contacts · aucun des deux
   - réponse : lire tes contacts
   - indice : De quoi a besoin une lampe pour éclairer ?
   - explication : Pour éclairer, il faut le flash. Tes contacts ne servent à rien pour une lampe : on peut refuser cet accès.
3. énoncé : Un bon mot de passe est long, et … pour chaque compte.
   - choix : le même · différent · ton prénom
   - réponse : différent
   - indice : Relis la ligne « Un mot de passe » du rappel.
   - explication : Avec un mot de passe différent pour chaque compte, un mot de passe volé n’ouvre pas tous les autres.
4. énoncé : "La montre de sport de Hugo\nElle compte ses pas.\nElle enregistre les endroits où il court.\nElle envoie tout au serveur de la marque."
   - question : Pourquoi faire attention ?
   - lu : La montre de sport de Hugo. Elle compte ses pas. Elle enregistre les endroits où il court. Elle envoie tout au serveur de la marque.
   - choix : la montre peut se casser · la marque sait où il court · les pas comptés sont faux
   - réponse : la marque sait où il court
   - indice : Relis les deux dernières lignes du document.
   - explication : Les endroits où Hugo court sont des données personnelles, et elles partent au serveur de la marque. Il peut régler la montre pour ne pas les envoyer.
5. énoncé : Une photo publiée en ligne peut être copiée, et …
   - choix : s’effacer toute seule · changer de couleur · rester longtemps en ligne
   - réponse : rester longtemps en ligne
   - indice : Relis la ligne « Une photo publiée » du rappel.
   - explication : Une photo publiée peut être copiée par d’autres : même effacée chez toi, elle peut rester en ligne. On réfléchit avant de publier.
6. énoncé : "Le message reçu par Inès\nTon compte va être fermé.\nClique ici, et donne ton mot de passe.\nL’expéditeur est inconnu."
   - question : Que doit faire Inès ?
   - lu : Le message reçu par Inès. Ton compte va être fermé. Clique ici, et donne ton mot de passe. L’expéditeur est inconnu.
   - choix : donner son mot de passe · répondre pour demander pourquoi · ne pas cliquer, et en parler à un adulte
   - réponse : ne pas cliquer, et en parler à un adulte
   - indice : Un vrai service demande-t-il ton mot de passe par message ?
   - explication : Un vrai service ne demande jamais le mot de passe par message : c’est un piège pour le voler. On ne clique pas, et on en parle à un adulte.
7. énoncé : Partager sa position en direct avec des inconnus est …
   - choix : obligatoire · risqué · sans effet
   - réponse : risqué
   - indice : La position dit où tu es, à chaque instant.
   - explication : Ta position est une donnée personnelle : des inconnus sauraient où tu es. C’est risqué ; on la partage seulement avec des proches.
8. énoncé : "Le profil de Léo\nProfil public : tout le monde voit ses photos.\nProfil privé : seuls ses amis acceptés les voient."
   - question : Quel réglage protège le mieux ses photos ?
   - lu : Le profil de Léo. Profil public, tout le monde voit ses photos. Profil privé, seuls ses amis acceptés les voient.
   - choix : le profil public · le profil privé · c’est pareil
   - réponse : le profil privé
   - indice : Avec quel réglage moins de gens voient ses photos ?
   - explication : En profil privé, seuls les amis acceptés voient les photos : elles sont mieux protégées.

## Lire un programme · `algorithms`

- description : Un algorithme et un programme : séquence, boucle et événement, puis condition et variable, dans un programme court à lire.
- compétences : c4.te.fonctionnement.programme
- consigne : Lis la phrase ou le programme, puis choisis la bonne réponse. Le rappel est affiché.
- bravo : Bien vu !
- erreur : {explanation}
- bloc gagné : technology-3e-digital
- blocs : 4
- XP : 14
- monte à : 0.85
- descend à : 0.5

Pour tous les items :
- trou lu : " (mot manquant) "

### Niveau 1 · `technology-3e-digital-algorithms-1`

Pour tous les items :
- aide « Un algorithme » :
  - Un algorithme : une suite d’instructions, dans l’ordre.
  - Un programme : l’algorithme écrit pour une machine.
  - Une séquence : les instructions, l’une après l’autre.
  - Une boucle : « répéter » refait les mêmes instructions.
  - Un événement : ce qui lance le programme, comme « quand on appuie ».

1. énoncé : Une suite d’instructions, données dans l’ordre, est un …
   - choix : algorithme · capteur · réseau
   - réponse : algorithme
   - indice : Relis la ligne « Un algorithme » du rappel.
   - explication : Une suite d’instructions dans l’ordre, c’est un algorithme, comme une recette de cuisine.
2. énoncé : "Le programme du robot\nAvancer de 10 pas.\nTourner à droite.\nAvancer de 5 pas."
   - question : Que fait le robot juste après avoir tourné ?
   - lu : Le programme du robot. Avancer de 10 pas. Tourner à droite. Avancer de 5 pas.
   - choix : il avance de 10 pas · il avance de 5 pas · il tourne à gauche
   - réponse : il avance de 5 pas
   - indice : Cherche la ligne juste sous « Tourner à droite ».
   - explication : Les instructions se suivent dans l’ordre : après avoir tourné, le robot avance de 5 pas. Les 10 pas, c’était avant.
3. énoncé : « Répéter 4 fois » refait les mêmes instructions : c’est une …
   - choix : condition · boucle · variable
   - réponse : boucle
   - indice : Relis la ligne « Une boucle » du rappel.
   - explication : « Répéter » fait une boucle : les mêmes instructions reviennent plusieurs fois.
4. énoncé : "Le programme de la lampe\nQuand on appuie sur le bouton :\nallumer la lampe,\nattendre 10 secondes,\néteindre la lampe."
   - question : Qu’est-ce qui lance le programme ?
   - lu : Le programme de la lampe. Quand on appuie sur le bouton, allumer la lampe, attendre 10 secondes, éteindre la lampe.
   - choix : la lampe qui s’allume · les 10 secondes · l’appui sur le bouton
   - réponse : l’appui sur le bouton
   - indice : Relis la ligne « Un événement » du rappel.
   - explication : « Quand on appuie sur le bouton » est l’événement qui lance le programme. Puis la lampe s’allume, attend, et s’éteint.
5. énoncé : « Quand on appuie sur le bouton » lance le programme : c’est un …
   - choix : événement · capteur · résultat
   - réponse : événement
   - indice : Relis la ligne « Un événement » du rappel.
   - explication : Ce qui lance le programme est un événement. Le bouton est un capteur, mais « quand on appuie » est l’événement.
6. énoncé : "Le programme du robot\nRépéter 4 fois :\navancer de 10 pas,\ntourner à droite d’un quart de tour."
   - question : Quelle forme le robot dessine-t-il ?
   - lu : Le programme du robot. Répéter 4 fois, avancer de 10 pas, tourner à droite d’un quart de tour.
   - choix : un triangle · un carré · une ligne droite
   - réponse : un carré
   - indice : 4 côtés pareils, et un quart de tour à chaque coin.
   - explication : Le robot fait 4 fois un côté de 10 pas, puis un quart de tour : 4 côtés égaux et 4 coins droits, c’est un carré.
7. énoncé : Un algorithme écrit dans un langage que la machine comprend devient un …
   - choix : croquis · capteur · programme
   - réponse : programme
   - indice : Relis la ligne « Un programme » du rappel.
   - explication : Écrit pour la machine, l’algorithme devient un programme. La machine peut alors l’exécuter.
8. énoncé : "Le programme de la sonnette\nQuand on appuie sur le bouton :\njouer la mélodie,\nallumer le voyant."
   - question : Que fait la sonnette en premier ?
   - lu : Le programme de la sonnette. Quand on appuie sur le bouton, jouer la mélodie, allumer le voyant.
   - choix : elle allume le voyant · elle joue la mélodie · elle attend
   - réponse : elle joue la mélodie
   - indice : Les instructions se font dans l’ordre, de haut en bas.
   - explication : C’est une séquence : d’abord la mélodie, puis le voyant, dans l’ordre des lignes.

### Niveau 2 · `technology-3e-digital-algorithms-2`

Pour tous les items :
- aide « Conditions et variables » :
  - Une condition : si c’est vrai, alors on fait une chose ; sinon, une autre.
  - Une variable : une case qui garde une valeur, comme un score.
  - La valeur d’une variable peut changer pendant le programme.
  - Le capteur donne l’information ; la condition la teste.

1. énoncé : "Le programme de la lampe du couloir\nSi le capteur voit quelqu’un, alors allumer la lampe.\nSinon, éteindre la lampe."
   - question : Personne ne passe. Que fait la lampe ?
   - lu : Le programme de la lampe du couloir. Si le capteur voit quelqu’un, alors allumer la lampe. Sinon, éteindre la lampe.
   - choix : elle s’allume · elle s’éteint · elle clignote
   - réponse : elle s’éteint
   - indice : Personne ne passe : on lit la ligne « Sinon ».
   - explication : Le capteur ne voit personne : la condition est fausse, le programme passe à « Sinon » et éteint la lampe.
2. énoncé : « S’il pleut, alors fermer la fenêtre » est une …
   - choix : boucle · variable · condition
   - réponse : condition
   - indice : Relis la ligne du rappel qui parle de « si » et de « sinon ».
   - explication : « Si », puis « alors » : le programme teste quelque chose avant d’agir : c’est une condition. Une boucle répète, sans tester.
3. énoncé : "Le jeu de Nina\nAu début, le score vaut 0.\nÀ chaque pièce attrapée, ajouter 1 au score.\nNina attrape 3 pièces."
   - question : Combien vaut le score ?
   - lu : Le jeu de Nina. Au début, le score vaut 0. À chaque pièce attrapée, ajouter 1 au score. Nina attrape 3 pièces.
   - choix : 1 · 3 · 4
   - réponse : 3
   - indice : Le score part de 0, et gagne 1 à chaque pièce.
   - explication : Le score part de 0 et gagne 1 pour chacune des 3 pièces : il vaut 3. La variable a changé trois fois.
4. énoncé : Le score, qui change pendant le jeu, est gardé dans une …
   - choix : variable · boucle · condition
   - réponse : variable
   - indice : Relis la ligne du rappel qui parle d’une case qui garde une valeur.
   - explication : Une variable garde une valeur qui peut changer : le score en est une.
5. énoncé : "Le programme de l’arrosage\nSi la terre est sèche, alors arroser 5 minutes.\nSinon, ne rien faire."
   - question : La terre est humide. Que fait le programme ?
   - lu : Le programme de l’arrosage. Si la terre est sèche, alors arroser 5 minutes. Sinon, ne rien faire.
   - choix : il arrose 5 minutes · il arrose sans arrêt · il ne fait rien
   - réponse : il ne fait rien
   - indice : La terre est-elle sèche ? Si non, lis la ligne « Sinon ».
   - explication : La terre est humide : la condition « sèche » est fausse. Le programme passe à « Sinon » : il ne fait rien.
6. énoncé : "Le programme du feu pour piétons\nRépéter sans fin :\nvert pendant 20 secondes,\nrouge pendant 40 secondes."
   - question : Quelle instruction fait recommencer le feu ?
   - lu : Le programme du feu pour piétons. Répéter sans fin, vert pendant 20 secondes, rouge pendant 40 secondes.
   - choix : vert pendant 20 secondes · répéter sans fin · rouge pendant 40 secondes
   - réponse : répéter sans fin
   - indice : Quelle ligne fait une boucle ?
   - explication : « Répéter sans fin » est une boucle : après le rouge, le feu repasse au vert, encore et encore.
7. énoncé : "Le programme du chauffage\nSi la pièce est plus froide que 19 degrés, alors allumer.\nSinon, éteindre.\nIl fait 17 degrés."
   - question : Que fait le chauffage ?
   - lu : Le programme du chauffage. Si la pièce est plus froide que 19 degrés, alors allumer. Sinon, éteindre. Il fait 17 degrés.
   - choix : il s’allume · il s’éteint · il ne change pas
   - réponse : il s’allume
   - indice : 17 degrés, est-ce plus froid que 19 degrés ?
   - explication : 17 degrés, c’est plus froid que 19 degrés : la condition est vraie, le chauffage s’allume.
8. énoncé : "Le programme de la barrière\nQuand une voiture arrive :\nsi le ticket est bon, alors lever la barrière ;\nsinon, afficher « Ticket refusé »."
   - question : Le ticket n’est pas bon. Que se passe-t-il ?
   - lu : Le programme de la barrière. Quand une voiture arrive, si le ticket est bon, alors lever la barrière. Sinon, afficher, ticket refusé.
   - choix : la barrière se lève · l’écran affiche « Ticket refusé » · rien ne se passe
   - réponse : l’écran affiche « Ticket refusé »
   - indice : Le ticket n’est pas bon : lis la partie « sinon ».
   - explication : La condition « le ticket est bon » est fausse : le programme fait la partie « sinon » et affiche « Ticket refusé ». La barrière reste baissée.

## Les plans

| plan | nom | XP | quand c’est bâti |
| --- | --- | --- | --- |
| `technology-3e-digital-1` | Le poste de Navette | 40 | Mon poste ! D’ici, mes messages partent partout. Merci, bâtisseur. |
| `technology-3e-digital-2` | Le toit du poste | 50 | Un toit et une lanterne : mes messages partent même la nuit. |
| `technology-3e-digital-3` | Les piquets du poste | 60 | Des piquets reliés deux à deux, comme un réseau. La ruche est complète, bâtisseur. |

## Les demandes

### `technology-3e-digital-request-1`

- habitant : Navette
- bloc : `physics-chemistry-3e-motion-energy`
- combien : 2
- petite construction : le carillon
- demande : Il me faut {objet} pour mon carillon. Joue une mission du Tremplin des forces.
- prête : Tu as les {blocs} ! Livre-les à Navette.
- posée : Carillon posé chez Navette !

> Forme, pour l’artiste technique 3D : 2 ressorts en colonne, un toit dessus (décision du directeur artistique, SC-3).
