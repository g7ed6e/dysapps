# Réglages et accessibilité

La page **Réglages** (barre du haut ; roue dentée sur téléphone) s’applique à toute l’application, y compris aux panneaux d’Archipéo, et montre un aperçu en direct. Les réglages sont enregistrés sur l’appareil. Dans chaque liste de choix, l’option choisie a sa case colorée et, dans son rond, un point plein ; les autres ronds sont vides. Les valeurs par défaut et leurs bornes exactes sont dans [Barème et succès](../pedagogie/bareme.md#reglages-par-defaut).

![La page Réglages : l'aperçu en haut, le choix de la police d'écriture (Luciole, OpenDyslexic, Atkinson Hyperlegible, Arial), la lecture.](/captures/reglages.jpg)

## Police d’écriture

Quatre polices au choix :

| Police | Pour qui |
| --- | --- |
| **Luciole** (par défaut) | Conçue pour les malvoyants, très lisible pour les dys ; incluse dans l’application (licence CC BY 4.0). |
| **OpenDyslexic** | Lettres lestées en bas, pour les élèves qui la préfèrent. |
| **Atkinson Hyperlegible** | Formes de lettres très différenciées (b, d, p, q, I, l, 1). |
| **Arial** | La police système, si l’élève y est habitué. |

Le texte à lire reste toujours dans la police choisie. La police des titres de l’interface, Montserrat grasse, ne sert qu’aux titres courts et au nom « Archipéo ».

## Lecture

- **Syllabes en couleurs alternées** : le découpage syllabique écrit est appliqué aux textes de lecture, aux consignes et aux messages des créatures. Le découpage suit des règles vérifiées par les tests.
- **Lire les consignes à voix haute dès qu’elles apparaissent** : activé par défaut. Désactivé, le bouton 🔊 reste disponible sur chaque consigne.

## Couleurs (thèmes)

| Thème | Rendu |
| --- | --- |
| **Crème** (par défaut) | Fond crème peu contrasté, texte bleu nuit, barre du haut bleu nuit ; boutons principaux bleu pétrole. Le texte reste toujours sur un fond uni. |
| **Nuit** | Fond bleu nuit et texte crème ; boutons principaux couleur sable. |
| **Clair** | Fond blanc, plat, sans ombre ; barre du haut blanche. |

Le thème **Contraste élevé** n’est plus au choix : il reviendra dans un lot ultérieur. Un appareil qui l’avait choisi s’ouvre en Nuit, le thème sombre le plus proche.

## Espacements

- **Taille du texte** : de 18 à 32 px, jamais moins de 18 (contrainte orthophonique).
- **Espace entre les lignes** : de 1,5 à 2,4, jamais moins de 1,5.
- **Espace entre les lettres** et **entre les mots** : réglables séparément.

Les espacements sont dits en mots, pas en nombres : « Plus serré », « Normal » (la valeur par défaut), « Un peu plus large », « Plus large », « Très large ». La vitesse de la voix aussi : « Lente », « Normale », « Rapide ».

## Voix

La lecture à voix haute utilise la **synthèse vocale du navigateur** (rien n’est envoyé à un serveur). La **vitesse de lecture** se règle de « Lente » à « Rapide » (0,5 à 1,3 fois la vitesse normale). Si le navigateur ne propose pas de voix française, la page l’indique ; installer une voix française dans le système (réglages d’accessibilité de l’appareil) suffit en général.

Les mots et les phrases d’**anglais** sont lus avec une voix anglaise : britannique si l’appareil en a une, sinon une autre voix anglaise. **Tester la voix anglaise** lit une phrase d’exemple ; si elle est lue avec l’accent français, installer une voix anglaise (Royaume-Uni) dans le système.

## Deuxième langue (LV2)

Comme au collège, l’élève a une seule **deuxième langue vivante**, à partir de la 5e : **Espagnol** (le choix par défaut), **Allemand** ou **Pas de LV2**, pour un élève qui en est dispensé. Le choix est gardé sur l’appareil et se change à tout moment : ce qui est construit reste, et chaque langue garde ses étoiles. La langue non choisie n’apparaît nulle part.

Les mots et les phrases de la LV2 sont lus avec sa voix : espagnole d’Espagne ou allemande d’Allemagne si l’appareil en a une, sinon une autre voix de la langue. **Tester la voix espagnole** (ou **allemande**) lit une phrase d’exemple. Si l’appareil n’a aucune voix de cette langue, la page le dit, avec un bouton pour l’écouter : les mots seraient lus avec un accent français, et il faut en installer une dans le système (rubrique Langue ou Synthèse vocale de l’appareil). **Affichage par défaut** ne change pas la LV2.

Les missions de LV2 arrivent île par île, en commençant par la 5e.

## Au démarrage

- **Le village d’Archipéo** (par défaut) : après l’écran titre, l’appli s’ouvre sur le village, sur l’île où se tient le bonhomme. Le menu est dans le village (bouton ⏸) et à l’adresse `#/menu`.
- **Le menu** : l’appli s’ouvre sur le menu principal, comme avant le village au démarrage.

Avec « La liste des îles », ou sur un appareil qui ne sait pas dessiner le monde, l’appli s’ouvre toujours sur le menu.

## Animations et vue du monde

- **Moins d’animations** : le réglage « Réduire les animations » n’est plus dans les Réglages ; il reviendra dans un lot ultérieur. D’ici là, Archipéo suit la préférence de l’appareil : quand les réglages d’accessibilité de la tablette, du téléphone ou de l’ordinateur demandent de réduire les animations, l’appli fige le ciel, les créatures, les baleines, les particules, les transitions, les animations du Gardien, les repères de mission et les balises du chemin ; dans le Filon, le bloc attend au lieu de défiler. Où trouver cette préférence : sur iPad et iPhone, Réglages, Accessibilité, Mouvement, « Réduire les animations » ; sur Android, Accessibilité, « Supprimer les animations » ; sur Windows, Accessibilité, « Effets d’animation ».
- **Vue du monde** : deux choix.
  - **Le monde en 3D** (par défaut).
  - **La liste des îles** : la **vue simple** (listes et pages), qui offre exactement les mêmes actions.

  Si l’appareil ne sait pas dessiner le monde en 3D (pas de WebGL), Archipéo montre le même monde en 2D, en pixels, vu de dessus en oblique ; s’il ne sait rien dessiner, la liste des îles. Une ancienne préférence « Vues en 3D » désactivée devient « La liste des îles », et un ancien choix « Le monde en 2D » redevient « Le monde en 3D ».
- **Sons dans le village** : les sons d’action (poser, retirer un bloc, plan terminé) et ceux du voyage en Bloc-Navire (corne de brume, voile, brûleur, réacteur, carillon d’arrivée).
- **Ambiance sonore du village** : vent, oiseaux le jour, grillons la nuit ; désactivée par défaut.
- **Vibrer à la bonne réponse et à la pose d’un bloc** : une vibration très courte, comme dans les jeux ; seulement sur les téléphones Android (Safari ne sait pas vibrer). Activé par défaut.
- **Pastille sur l’icône de l’appli** : un simple point sur l’icône de l’appli installée quand des révisions attendent aujourd’hui ; pas de nombre, pas de notification. Affiché par Android, les ordinateurs et les iPhone et iPad récents, pour l’appli installée. Activé par défaut.

## Expérimental

![La section Expérimental des Réglages : la case « Essayer le nouveau dessin du monde » cochée, puis les quatre choix de la surface du monde.](/captures/reglages-experimental.jpg)

Cette section rassemble des options **expérimentales**, désactivées par défaut. Elles montrent le nouveau dessin du monde d’Archipéo pendant qu’il se construit : il peut encore changer ou s’afficher moins bien. Elles ne touchent ni à la progression ni aux sauvegardes, et le changement se voit à la prochaine ouverture du monde.

- **Essayer le nouveau dessin du monde** : le monde est dessiné avec le rendu d’Archipéo en construction (ciel, mer, relief à facettes, décor, constructions taillées ; sur un appareil sans WebGL, la 2D peinte) au lieu du monde en blocs, qui reste disponible en décochant la case.
- **La surface du monde**, affichée quand le nouveau dessin est activé : **Les textures des blocs** (par défaut), **Couleurs unies** (une couleur par face), **Couleurs nuancées** (la couleur fondue en douceur, le style retenu pour Archipéo), **Coins arrondis** (la lumière arrondie sur les coins des cubes).

Ces options préparent le choix de l’univers, qui les remplacera à l’ouverture du lot 6 : une section **Univers** où l’on choisit **Blocland**, le monde en blocs, ou **Archipéo**, une aventure en mer. Chaque univers y a une icône, son nom et une phrase à écouter. Changer d’univers demande une confirmation, qui dit ce qui change (le dessin du monde, le titre et l’histoire ; les îles gardent leur nom) et ce qui reste (les étoiles, les blocs, les plans et les missions) ; le changement se voit au retour au village. Tous les appareils s’ouvrent dans Blocland, même ceux qui ont une progression ou qui avaient coché « Essayer le nouveau dessin du monde » : Archipéo ne se choisit que dans cette section. Pour les développeurs, l’adresse `/?rendu=archipeo#/aventure` (et `&style=a`, `b` ou `c`) fait comme la case « Essayer le nouveau dessin du monde », sans la cocher, et l’emporte sur les Réglages ; elle disparaît à l’ouverture du lot 6.

## Application

La version installée est affichée, avec le bouton **Vérifier les mises à jour** (ou **Mettre à jour maintenant** quand une version est prête). Voir [Démarrer](demarrer.md#les-mises-a-jour).

Deux liens s’ouvrent dans un nouvel onglet : **La documentation** (ce site, https://g7ed6e.github.io/dysapps/) et **Le code sur GitHub** (https://github.com/g7ed6e/dysapps).

## Ma sauvegarde

**Enregistrer ma progression** range dans un fichier (`dysapps-progression-<date>.json`) tout ce que l’appli garde sur l’appareil : XP, succès, étoiles, blocs, bâtiments, répétition espacée et réglages. Sur iPhone et iPad, la feuille de partage s’ouvre pour le ranger (Fichiers, e-mail) ; ailleurs, et quand l’appareil ne sait pas partager ce fichier, il se télécharge.

**Restaurer une sauvegarde…** ouvre un fichier enregistré ainsi. L’appli dit de quel jour il date et qu’il va **remplacer** la progression de l’appareil ; sous la date, elle rappelle d’enregistrer d’abord la progression qu’on veut garder ; rien ne change avant d’avoir touché **Restaurer**. La page se recharge ensuite, et « Ta progression est restaurée. » s’affiche. Un fichier qui n’est pas une sauvegarde de l’appli est refusé, sans rien changer.

Le fichier sert à changer d’appareil, ou à réinstaller l’appli sans rien perdre.

## Réinstaller l’appli

Pour avoir une nouvelle icône, ou si l’appli ne marche plus, la section **Réinstaller l’appli** commence par conseiller de prendre une photo de l’écran, qui disparaît quand on supprime l’appli, et donne quatre étapes, à écouter avec **Écouter** : enregistrer sa progression, supprimer l’appli (appui long sur l’icône sur iPhone, iPad et Android ; menu ⋮ (trois points) puis « Désinstaller » sur ordinateur), l’installer de nouveau depuis l’adresse affichée (le bouton **Copier l’adresse** évite de la retaper), puis restaurer la sauvegarde dans l’appli installée. Sur iPhone et iPad, il faut restaurer dans l’appli installée et non dans Safari : ils ne partagent pas la progression. Voir aussi [Quand l’icône change](demarrer.md#quand-licone-change).

## Effacer ma progression

En bas de la page, loin des autres boutons, un encadré orangé **Effacer ma progression** efface XP, succès, étoiles, blocs et bâtiments (les réglages restent). Pour confirmer, il faut écrire le mot **effacer** : un doigt qui glisse n'efface rien. **Affichage par défaut**, plus haut, ne remet que les réglages d'affichage.

## Ce qui est réglé une fois pour toutes

Certaines règles ne sont pas des options, parce qu’elles font partie de la méthode :

- pas de chronomètre, nulle part ;
- une seule tâche par écran, et l’écran tient sans défiler ;
- la consigne peut toujours être réécoutée ;
- l’indice ne pénalise jamais (il compte pour un demi-point dans Archipéo, jamais en négatif) ;
- une réponse fausse rapporte un point d’effort et la correction explique ;
- les cibles tactiles sont larges (au moins 48 px) ;
- aucun texte à lire n’est dessiné dans la 3D ;
- aucune image ni texture empruntée : tout est dessiné par le code.

Le détail de ces choix et leurs raisons sont dans [Principes dys](../pedagogie/principes.md).
