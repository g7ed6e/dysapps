# Démarrer

## Ouvrir l’application

L’application est en ligne à l’adresse <https://dysapps.guillaume-delahaye.workers.dev/>. Elle fonctionne dans un navigateur récent (Chrome, Edge, Firefox, Safari) sur tablette, téléphone ou ordinateur, sans compte et sans installation obligatoire.

L’application se parcourt comme un jeu. Elle **s’ouvre sur le village**, sur l’île où se tient le bonhomme, après l’écran titre. Dans le village, le bouton **Menu** (trois traits, en haut à droite du monde) ouvre le menu du village : voir [L’aventure](blocland.md#le-menu-du-village). Quatre grands endroits restent toujours au même endroit, avec les mêmes mots :

- **Menu** (adresse `#/menu`) : dans le village, cette adresse ouvre le menu du village. Le menu en page n’existe plus qu’en vue simple (réglage « La liste des îles », ou appareil qui ne sait pas dessiner le monde), où il est l’accueil. De haut en bas :
  - **Blocland** et « Chaque bloc construit ton monde. » ;
  - **Ton village** : l’état du village de l’archipel où se tient le bonhomme, en cinq crans (voir [Le village en cinq états](blocland.md#le-village-en-cinq-etats)) ;
  - **Reprendre l’aventure**, le gros bouton, qui mène à la **prochaine destination**, dite en une phrase et lue avec Écouter (« Prochaine destination : Plaine des nombres. Tu peux poser le bac vers Rivière des fractions. Il ouvre une île de maths. » ; l’ordre de la suggestion est dans [L’aventure](blocland.md)) ; en dessous, **Ma dernière mission** (la dernière mission ouverte) et **Mes révisions du jour** quand il y en a, les mêmes mots que dans le menu du village ;
  - la **progression** : le rôle et le niveau, le nombre d’archipels atteints sur quatre, et le lien **Succès** ;
  - les **Expéditions** : Maths, Français, Anglais, Histoire-géo et la deuxième langue (sauf avec « Pas de LV2 »), chacune avec le nom de son expédition, qui mènent aux missions et aux îles de la matière. L’Histoire-géo (expédition Traces et paysages) n’a que ses îles, en 6e ; sa page, comme celle de la deuxième langue, ramène au Menu ;
  - en bas, les liens **Toutes les missions**, **Réglages** et **Revoir le tutoriel**.

  La première fois, à la place de « Reprendre l’aventure », la carte **Commencer ici** lance le Tutoriel. Sur téléphone, le bouton « Reprendre l’aventure » se voit sans faire défiler ; sur tablette, tout le menu tient presque sur un écran.
- **Aventure** : Blocland, le village à reconstruire. Son **école du village** ouvre aussi les missions du portail, qui y rapportent des blocs.
- **Missions** : les missions du portail, par matière (Français, Maths, Anglais).
- **Succès** : le rôle, l’XP, les étoiles et ce qu’il reste à gagner.

Il n’y a pas de barre du haut, dans Blocland comme dans Archipéo : sur chaque page hors du monde (Missions, une matière, une mission, Réglages, Succès), seul le bouton **Menu** (trois traits) reste en haut à droite, à la même place que dans le monde, et mène au menu. Le village en 3D non plus n’a pas de barre du haut : le monde prend tout l’écran, et le bouton Menu (ou le bouton retour) ouvre le menu du village, qui donne le rôle, la jauge d’XP, les Missions, les Succès, les Réglages et l’Accueil. Dans une page, le **bouton retour** (flèche et nom de la page d’avant, en forme de pastille) est toujours en haut à gauche. Chaque nouvel écran glisse doucement en place, sauf quand l’appareil demande de réduire les animations. Pendant un chargement, le « D » de DysApps sautille au-dessus de « Chargement… ».

![Le menu en page, en vue simple, sur tablette : Blocland, le village des Basses Terres en Réactivation, le bouton Reprendre l'aventure avec la prochaine destination, le rôle, puis les Expéditions.](/captures/menu.jpg)

![Le menu en page, en vue simple, sur téléphone : le bouton Reprendre l'aventure se voit sans faire défiler.](/captures/telephone-menu.jpg)

![Sur téléphone : le village sans barre du haut, le bouton Menu en haut à droite, le monde sur tout l'écran et la barre du bas.](/captures/telephone-village.jpg)

Pendant une partie, l’écran se vide pour laisser toute la place à la question : voir [le mode concentration](quetes.md#le-mode-concentration).

## Installer sur l’écran d’accueil

DysApps est une application web installable (PWA). Une fois installée, elle s’ouvre en plein écran, sans la barre d’adresse, et **fonctionne hors ligne** après la première visite.

- **Android (Chrome)** : menu ⋮ puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».
- **iPhone, iPad (Safari)** : bouton Partager, puis « Sur l’écran d’accueil ».
- **Ordinateur (Chrome, Edge)** : icône d’installation à droite de la barre d’adresse, ou menu puis « Installer DysApps ».

L’icône de l’appli installée est un « D » crème sur fond bleu nuit, pour DysApps, la même quel que soit l’univers ; l’écran titre montre le logo de l’univers. Installée, l’application s’ouvre comme une appli : un **écran de lancement** neutre (le « D » de DysApps sur fond crème, avec le nom DysApps sur Android) le temps du chargement, sur Android comme sur iPhone et iPad, puis l’écran titre. Elle occupe tout l’écran, encoche et coins arrondis compris ; la page ne rebondit pas, ne se recharge pas en tirant vers le bas et ne zoome pas au double toucher (le zoom à deux doigts reste possible).

### Quand l’icône change

Une appli déjà installée ne prend pas toujours la nouvelle icône ni le nouveau nom d’elle-même. Cela dépend de l’appareil :

- **Android (Chrome)** : Chrome vérifie l’icône et le nom quand on ouvre l’appli, au plus une fois par jour, après que l’élève a touché **Mettre à jour**. Le changement peut prendre jusqu’à un jour ; Android demande souvent de l’accepter. Avec un autre navigateur, l’icône peut rester l’ancienne : il faut alors réinstaller.
- **Ordinateur (Chrome, Edge)** : le navigateur vérifie au lancement de l’appli, après la mise à jour, et peut demander de confirmer la nouvelle icône.
- **iPhone, iPad (Safari)** et **Mac (Safari, « Ajouter au Dock »)** : l’icône (et, sur iPhone et iPad, l’écran de lancement) est photographiée à l’installation et ne change plus. Une appli installée avant l’arrivée du « D » garde donc l’écran de lancement d’Archipéo. Seule une réinstallation les change. Attention : sur iPhone et iPad, supprimer l’appli de l’écran d’accueil **efface sa progression**. Il faut donc l’enregistrer d’abord dans un fichier, puis la restaurer : Réglages, section « Réinstaller l’appli » (voir [Réglages](reglages.md#reinstaller-lappli)).

> L’application était aussi publiée sur GitHub Pages, à l’adresse de cette documentation. Si elle y avait été installée, le raccourci ouvre désormais cette documentation : il suffit de réinstaller l’application depuis l’adresse ci-dessus. La progression enregistrée sur l’appareil dépend de l’adresse d’origine et n’est pas transférée.

## L’écran titre

À chaque lancement, l’écran titre montre le logo de Blocland (une île en blocs avec un grand chêne), qui se construit en moins d’une seconde (le pied de l’île, son dessus, le tronc puis le feuillage se posent l’un après l’autre, sans rebond ; immobile quand l’appareil demande de réduire les animations), « Blocland » et un gros bouton **Jouer**, qu’on peut toucher tout de suite, qui mène au village (déjà chargé derrière l’écran titre) (au menu en page en vue simple). S’il y a une mission en cours, il propose d’abord **Ma dernière mission : Abattage syllabique · Forêt des sons** (la dernière mission ouverte), puis **Jouer**. Il n’y a rien à attendre : il reste jusqu’au toucher, sans compte à rebours.

![L'écran titre : l'île en blocs de Blocland, « Blocland » et le bouton Jouer.](/captures/titre.jpg)

Ce premier toucher sert aussi à **débloquer la voix et les sons** : les navigateurs les gardent muets tant que l’élève n’a pas touché l’écran. Sans lui, la première consigne lue automatiquement pouvait rester silencieuse. L’écran titre ne revient qu’au lancement suivant ; ouverte sur une adresse précise (un lien, un favori), l’application ne propose pas de repartir ailleurs.

Quand des items ratés reviennent (répétition espacée), la créature de leur île fait signe dans le monde et propose de reprendre ([La créature qui se souvient](blocland.md#la-creature-qui-se-souvient)) ; le menu (en page et dans le village) montre aussi **À revoir aujourd’hui** et, si l’appli est installée, un point s’affiche sur son icône (désactivable dans les Réglages).

À l’écran titre comme dans le menu, **Ma dernière mission** ramène à la dernière mission ouverte (du portail ou de l’aventure ; pas le Tutoriel). « Effacer ma progression » l’oublie.

## La première séance

1. **Réglages d’abord, si besoin** : la police, la taille du texte, le thème et la lecture à voix haute se règlent dans Réglages et s’appliquent partout, avec un aperçu. Les valeurs par défaut conviennent à la plupart des élèves dys (Luciole, 20 px, interlignage 1,7, lecture automatique des consignes, syllabes en couleurs). Voir [Réglages et accessibilité](reglages.md).
2. **Le Tutoriel** (dans le menu en page, carte « Commencer ici » tant qu’on n’a rien joué, puis lien « Revoir le tutoriel » en bas ; depuis le village, ligne « Tutoriel » du menu du village) est une mission d’entraînement de quelques questions pour prendre les commandes en main : lire ou écouter la consigne, toucher une réponse, utiliser le joker, lire la correction.
3. **Choisir** : une mission du portail (voir [Les missions](quetes.md)) ou l’aventure (voir [L’aventure](blocland.md)). Dans l’aventure, un tutoriel en trois étapes, lues à voix haute, s’affiche en bas de l’écran à la première entrée ; une bulle bordée d’or indique où commencer, et la dernière étape entoure de jaune le bouton Menu.

Les séances sont pensées **courtes** : une mission du portail dure une dizaine de questions ; dans l’aventure, après trois exercices ou dix minutes, l’application propose d’arrêter. Rien n’oblige à continuer, rien ne se perd en s’arrêtant.

## Les mises à jour

L’application se met à jour toute seule. Quand une nouvelle version est prête, une bande apparaît sous l’en-tête avec un bouton **Mettre à jour** : un clic, puis la page se recharge. La mise à jour n’est jamais imposée en pleine partie.

Si une page affiche **« Cette page n’a pas pu s’ouvrir »**, l’application a sans doute été mise à jour pendant la séance : le bouton **Recharger** la rouvre. La progression est gardée.

Dans **Réglages → Application**, la version installée est affichée, et un bouton **Vérifier les mises à jour** permet de ne pas attendre. Chaque publication porte un numéro nouveau.

## Où sont mes données ?

Tout est enregistré **sur l’appareil**, dans le stockage local du navigateur : réglages, XP, succès, étoiles, blocs, bâtiments, répétition espacée. Rien n’est envoyé à un serveur, il n’y a pas de compte.

Conséquences pratiques :

- Deux appareils ont deux progressions différentes. Pour passer de l’un à l’autre, **Réglages → Ma sauvegarde** enregistre la progression dans un fichier, puis la restaure sur l’autre appareil (voir [Réglages](reglages.md#ma-sauvegarde)).
- Effacer les données du site dans le navigateur (ou désinstaller l’application) efface la progression, sauf si elle a été enregistrée dans un fichier.
- Les navigations privées ne gardent rien après fermeture.

Sur un appareil partagé entre plusieurs élèves, le plus simple est d’utiliser un profil de navigateur par élève.
