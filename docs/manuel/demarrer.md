# Démarrer

## Ouvrir l’application

L’application est en ligne à l’adresse <https://dysapps.guillaume-delahaye.workers.dev/>. Elle fonctionne dans un navigateur récent (Chrome, Edge, Firefox, Safari) sur tablette, téléphone ou ordinateur, sans compte et sans installation obligatoire.

L’application se parcourt comme un jeu, avec quatre grands endroits, toujours au même endroit et avec les mêmes mots :

- **Accueil** : le menu principal. Il montre le rang, **Continuer** (la dernière quête ouverte), **Blocland** (l’aventure) et trois grosses tuiles : **Quêtes**, **Succès**, **Réglages**. Sur tablette, il tient sur un écran.
- **Aventure** : Blocland, le village à reconstruire.
- **Quêtes** : les quêtes du portail, par matière (Français, Maths, Anglais).
- **Succès** : le rang, l’XP, les étoiles et ce qu’il reste à gagner.

Sur tablette et ordinateur, ces endroits et les **Réglages** sont des boutons dans la barre du haut, à côté de la jauge d’XP. Sur téléphone, ils sont des **onglets en bas de l’écran**, comme dans une appli, et les Réglages restent en haut (roue dentée). Dans une page, le **bouton retour** (flèche et nom de la page d’avant, en forme de pastille) est toujours en haut à gauche. Chaque nouvel écran glisse doucement en place, sauf avec « Réduire les animations ». Pendant un chargement, le bloc d’herbe sautille au-dessus de « Chargement… ».

Pendant une partie, l’écran se vide pour laisser toute la place à la question : voir [le mode concentration](quetes.md#le-mode-concentration).

## Installer sur l’écran d’accueil

DysApps est une application web installable (PWA). Une fois installée, elle s’ouvre en plein écran, sans la barre d’adresse, et **fonctionne hors ligne** après la première visite.

- **Android (Chrome)** : menu ⋮ puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».
- **iPhone, iPad (Safari)** : bouton Partager, puis « Sur l’écran d’accueil ».
- **Ordinateur (Chrome, Edge)** : icône d’installation à droite de la barre d’adresse, ou menu puis « Installer DysApps ».

L’icône est un bloc d’herbe isométrique sur fond de ciel. Installée, l’application s’ouvre comme une appli : un **écran de lancement** (le bloc d’herbe sur fond crème) le temps du chargement, sur Android comme sur iPhone et iPad, puis l’écran titre. Elle occupe tout l’écran, encoche et coins arrondis compris ; la page ne rebondit pas, ne se recharge pas en tirant vers le bas et ne zoome pas au double toucher (le zoom à deux doigts reste possible).

> L’application était aussi publiée sur GitHub Pages, à l’adresse de cette documentation. Si elle y avait été installée, le raccourci ouvre désormais cette documentation : il suffit de réinstaller l’application depuis l’adresse ci-dessus. La progression enregistrée sur l’appareil dépend de l’adresse d’origine et n’est pas transférée.

## L’écran titre

À chaque lancement, l’écran titre montre le bloc d’herbe, « DysApps » et un gros bouton **Jouer**. S’il y a une quête en cours, il propose d’abord **Continuer : Abattage syllabique · Forêt des sons** (la dernière quête ouverte), et **Accueil** à la place de Jouer. Il n’y a rien à attendre : il reste jusqu’au toucher, sans compte à rebours.

Ce premier toucher sert aussi à **débloquer la voix et les sons** : les navigateurs les gardent muets tant que l’élève n’a pas touché l’écran. Sans lui, la première consigne lue automatiquement pouvait rester silencieuse. L’écran titre ne revient qu’au lancement suivant ; ouverte sur une adresse précise (un lien, un favori), l’application ne propose pas de repartir ailleurs.

Quand des items ratés reviennent (répétition espacée), l’accueil montre aussi une carte **À revoir aujourd’hui** et, si l’appli est installée, un point s’affiche sur son icône (désactivable dans les Réglages).

Sur l’accueil aussi, une carte **Continuer** ramène à la dernière quête ouverte (du portail ou de Blocland ; pas le Tutoriel). « Effacer ma progression » l’oublie.

## La première séance

1. **Réglages d’abord, si besoin** : la police, la taille du texte, le thème et la lecture à voix haute se règlent dans Réglages et s’appliquent partout, avec un aperçu. Les valeurs par défaut conviennent à la plupart des élèves dys (Luciole, 20 px, interlignage 1,7, lecture automatique des consignes, syllabes en couleurs). Voir [Réglages et accessibilité](reglages.md).
2. **Le Tutoriel** (sur l’accueil, carte « Commencer ici » tant qu’on n’a rien joué, puis lien « Revoir le tutoriel » en bas de l’accueil) est une quête d’entraînement de quelques questions pour prendre les commandes en main : lire ou écouter la consigne, toucher une réponse, utiliser le joker, lire la correction.
3. **Choisir** : une quête du portail (voir [Les quêtes](quetes.md)) ou l’aventure Blocland (voir [Blocland](blocland.md)). Dans Blocland, un tutoriel de six bulles, lues à voix haute, s’affiche en bas de l’écran à la première entrée ; une flèche jaune indique où commencer, et le bouton dont parle une bulle est entouré de jaune.

Les séances sont pensées **courtes** : une quête du portail dure une dizaine de questions ; dans Blocland, après trois exercices ou dix minutes, l’application propose d’arrêter. Rien n’oblige à continuer, rien ne se perd en s’arrêtant.

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
