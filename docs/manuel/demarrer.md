# Démarrer

## Ouvrir l’application

L’application est en ligne à l’adresse <https://dysapps.guillaume-delahaye.workers.dev/>. Elle fonctionne dans un navigateur récent (Chrome, Edge, Firefox, Safari) sur tablette, téléphone ou ordinateur, sans compte et sans installation obligatoire.

L’application se parcourt comme un jeu. Elle **s’ouvre sur le village** d’Archipéo, sur l’île où se tient le bonhomme (réglage « Au démarrage », voir [Réglages](reglages.md)). Dans le village, le bouton **Menu** (⏸, en haut à droite du monde) ouvre le menu du village : voir [Archipéo](blocland.md#le-menu-du-village). Quatre grands endroits restent toujours au même endroit, avec les mêmes mots :

- **Menu** (adresse `#/menu`) : le menu principal, en page. Il montre le rôle, **Continuer** (la dernière mission ouverte), **Archipéo** (l’aventure) et trois grosses tuiles : **Missions**, **Succès**, **Réglages**. Sur tablette, il tient sur un écran. C’est l’accueil quand le réglage « Au démarrage » choisit le menu, ou quand l’appareil ne sait pas dessiner le monde (vue simple).
- **Aventure** : Archipéo, le village à reconstruire. Son **école du village** ouvre aussi les missions du portail, qui y rapportent des blocs.
- **Missions** : les missions du portail, par matière (Français, Maths, Anglais).
- **Succès** : le rôle, l’XP, les étoiles et ce qu’il reste à gagner.

Sur tablette et ordinateur, ces endroits et les **Réglages** sont des boutons dans la barre du haut, à côté de la jauge d’XP. Sur téléphone, il n’y a pas d’onglets : la barre du haut garde le logo (qui ramène au village), un bouton **Menu** (la maison) et les **Réglages** (la roue dentée) ; dans le village, le bouton ⏸ et le bouton retour ouvrent le menu du village. Dans une page, le **bouton retour** (flèche et nom de la page d’avant, en forme de pastille) est toujours en haut à gauche. Chaque nouvel écran glisse doucement en place, sauf avec « Réduire les animations ». Pendant un chargement, l’icône d’Archipéo sautille au-dessus de « Chargement… ».

![Le menu en page sur tablette : le rôle, l'aventure Archipéo, et les trois tuiles Missions, Succès, Réglages.](/captures/menu.jpg)

![Sur téléphone : la barre du haut réduite (logo, menu, réglages), le monde et le panneau d'île en dessous.](/captures/telephone-village.jpg)

Pendant une partie, l’écran se vide pour laisser toute la place à la question : voir [le mode concentration](quetes.md#le-mode-concentration).

## Installer sur l’écran d’accueil

Archipéo est une application web installable (PWA). Une fois installée, elle s’ouvre en plein écran, sans la barre d’adresse, et **fonctionne hors ligne** après la première visite.

- **Android (Chrome)** : menu ⋮ puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».
- **iPhone, iPad (Safari)** : bouton Partager, puis « Sur l’écran d’accueil ».
- **Ordinateur (Chrome, Edge)** : icône d’installation à droite de la barre d’adresse, ou menu puis « Installer Archipéo ».

L’icône est un « A » ouvert crème sur fond bleu nuit, posé sur deux vagues, avec une étoile de sable. Installée, l’application s’ouvre comme une appli : un **écran de lancement** (l’icône sur fond crème) le temps du chargement, sur Android comme sur iPhone et iPad, puis l’écran titre. Elle occupe tout l’écran, encoche et coins arrondis compris ; la page ne rebondit pas, ne se recharge pas en tirant vers le bas et ne zoome pas au double toucher (le zoom à deux doigts reste possible).

> L’application était aussi publiée sur GitHub Pages, à l’adresse de cette documentation. Si elle y avait été installée, le raccourci ouvre désormais cette documentation : il suffit de réinstaller l’application depuis l’adresse ci-dessus. La progression enregistrée sur l’appareil dépend de l’adresse d’origine et n’est pas transférée.

## L’écran titre

À chaque lancement, l’écran titre montre l’icône, « Archipéo » et un gros bouton **Jouer**, qui mène au village (déjà chargé derrière l’écran titre), ou au menu selon le réglage « Au démarrage ». S’il y a une mission en cours, il propose d’abord **Continuer : Abattage syllabique · Forêt des sons** (la dernière mission ouverte), puis **Jouer**. Il n’y a rien à attendre : il reste jusqu’au toucher, sans compte à rebours.

![L'écran titre : l'icône, « Archipéo » et le bouton Jouer.](/captures/titre.jpg)

Ce premier toucher sert aussi à **débloquer la voix et les sons** : les navigateurs les gardent muets tant que l’élève n’a pas touché l’écran. Sans lui, la première consigne lue automatiquement pouvait rester silencieuse. L’écran titre ne revient qu’au lancement suivant ; ouverte sur une adresse précise (un lien, un favori), l’application ne propose pas de repartir ailleurs.

Quand des items ratés reviennent (répétition espacée), le menu (en page et dans le village) montre aussi **À revoir aujourd’hui** et, si l’appli est installée, un point s’affiche sur son icône (désactivable dans les Réglages).

Dans le menu aussi, **Continuer** ramène à la dernière mission ouverte (du portail ou d’Archipéo ; pas le Tutoriel). « Effacer ma progression » l’oublie.

## La première séance

1. **Réglages d’abord, si besoin** : la police, la taille du texte, le thème et la lecture à voix haute se règlent dans Réglages et s’appliquent partout, avec un aperçu. Les valeurs par défaut conviennent à la plupart des élèves dys (Luciole, 20 px, interlignage 1,7, lecture automatique des consignes, syllabes en couleurs). Voir [Réglages et accessibilité](reglages.md).
2. **Le Tutoriel** (dans le menu en page, carte « Commencer ici » tant qu’on n’a rien joué, puis lien « Revoir le tutoriel » en bas ; dans le menu du village, ligne « Tutoriel ») est une mission d’entraînement de quelques questions pour prendre les commandes en main : lire ou écouter la consigne, toucher une réponse, utiliser le joker, lire la correction.
3. **Choisir** : une mission du portail (voir [Les missions](quetes.md)) ou l’aventure Archipéo (voir [Archipéo](blocland.md)). Dans Archipéo, un tutoriel de huit bulles, lues à voix haute, s’affiche en bas de l’écran à la première entrée ; une flèche jaune indique où commencer, et le bouton dont parle une bulle est entouré de jaune.

Les séances sont pensées **courtes** : une mission du portail dure une dizaine de questions ; dans Archipéo, après trois exercices ou dix minutes, l’application propose d’arrêter. Rien n’oblige à continuer, rien ne se perd en s’arrêtant.

## Les mises à jour

L’application se met à jour toute seule. Quand une nouvelle version est prête, une bande apparaît sous l’en-tête avec un bouton **Mettre à jour** : un clic, puis la page se recharge. La mise à jour n’est jamais imposée en pleine partie.

Si une page affiche **« Cette page n’a pas pu s’ouvrir »**, l’application a sans doute été mise à jour pendant la séance : le bouton **Recharger** la rouvre. La progression est gardée.

Dans **Réglages → Application**, la version installée est affichée, et un bouton **Vérifier les mises à jour** permet de ne pas attendre. Chaque publication porte un numéro nouveau, décrit dans le [journal des versions](../journal.md).

## Où sont mes données ?

Tout est enregistré **sur l’appareil**, dans le stockage local du navigateur : réglages, XP, succès, étoiles, blocs, bâtiments, répétition espacée. Rien n’est envoyé à un serveur, il n’y a pas de compte.

Conséquences pratiques :

- Deux appareils ont deux progressions différentes.
- Effacer les données du site dans le navigateur (ou désinstaller l’application) efface la progression.
- Les navigations privées ne gardent rien après fermeture.

Sur un appareil partagé entre plusieurs élèves, le plus simple est d’utiliser un profil de navigateur par élève.
