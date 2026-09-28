# Réglages et accessibilité

La page **Réglages** (barre du haut ; roue dentée sur téléphone) s’applique à toute l’application, y compris aux panneaux d’Archipéo, et montre un aperçu en direct. Les réglages sont enregistrés sur l’appareil. Les valeurs par défaut et leurs bornes exactes sont dans [Barème et succès](../pedagogie/bareme.md#reglages-par-defaut).

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
| **Contraste élevé** | Noir, blanc et jaune, plat, angles presque droits, pour les basses visions. |

## Espacements

- **Taille du texte** : de 18 à 32 px, jamais moins de 18 (contrainte orthophonique).
- **Espace entre les lignes** : de 1,5 à 2,4, jamais moins de 1,5.
- **Espace entre les lettres** et **entre les mots** : réglables séparément.

Les espacements sont dits en mots, pas en nombres : « Plus serré », « Normal » (la valeur par défaut), « Un peu plus large », « Plus large », « Très large ». La vitesse de la voix aussi : « Lente », « Normale », « Rapide ».

## Voix

La lecture à voix haute utilise la **synthèse vocale du navigateur** (rien n’est envoyé à un serveur). La **vitesse de lecture** se règle de « Lente » à « Rapide » (0,5 à 1,3 fois la vitesse normale). Si le navigateur ne propose pas de voix française, la page l’indique ; installer une voix française dans le système (réglages d’accessibilité de l’appareil) suffit en général.

Les mots et les phrases d’**anglais** sont lus avec une voix anglaise : britannique si l’appareil en a une, sinon une autre voix anglaise. **Tester la voix anglaise** lit une phrase d’exemple ; si elle est lue avec l’accent français, installer une voix anglaise (Royaume-Uni) dans le système.

## Au démarrage

- **Le village d’Archipéo** (par défaut) : après l’écran titre, l’appli s’ouvre sur le village, sur l’île où se tient le bonhomme. Le menu est dans le village (bouton ⏸) et à l’adresse `#/menu`.
- **Le menu** : l’appli s’ouvre sur le menu principal, comme avant le village au démarrage.

Avec « La liste des îles », ou sur un appareil qui ne sait pas dessiner le monde, l’appli s’ouvre toujours sur le menu.

## Animations et vue du monde

- **Réduire les animations** : fige le ciel, les créatures, les baleines, les particules, les transitions, les animations du Gardien, les repères de mission et les balises du chemin ; dans le Filon, le bloc attend au lieu de défiler. Utile pour les élèves sensibles au mouvement ou pour les appareils lents.
- **Vue du monde** : trois choix.
  - **Le monde en 3D** (par défaut).
  - **Le monde en 2D (expérimental)** : le même monde en pixels, vu de dessus en oblique, plus léger pour les appareils modestes (voir [Archipéo](blocland.md)).
  - **La liste des îles** : la **vue simple** (listes et pages), qui offre exactement les mêmes actions.

  Si l’appareil ne sait pas dessiner le monde en 3D (pas de WebGL), Archipéo montre le monde en 2D ; s’il ne sait rien dessiner, la liste des îles. Une ancienne préférence « Vues en 3D » désactivée devient « La liste des îles ».
- **Sons dans le village** : les sons d’action (poser, retirer un bloc, plan terminé) et ceux du voyage en Bloc-Navire (corne de brume, voile, brûleur, réacteur, carillon d’arrivée).
- **Ambiance sonore du village** : vent, oiseaux le jour, grillons la nuit ; désactivée par défaut.
- **Vibrer à la bonne réponse et à la pose d’un bloc** : une vibration très courte, comme dans les jeux ; seulement sur les téléphones Android (Safari ne sait pas vibrer). Activé par défaut.
- **Pastille sur l’icône de l’appli** : un simple point sur l’icône de l’appli installée quand des révisions attendent aujourd’hui ; pas de nombre, pas de notification. Affiché par Android, les ordinateurs et les iPhone et iPad récents, pour l’appli installée. Activé par défaut.

## Expérimental

![La section Expérimental des Réglages : la case « Essayer le nouveau dessin du monde » cochée, puis les quatre choix de la surface du monde.](/captures/reglages-experimental.jpg)

Cette section rassemble des options **expérimentales**, désactivées par défaut. Elles montrent le nouveau dessin du monde d’Archipéo pendant qu’il se construit : il peut encore changer ou s’afficher moins bien. Elles ne touchent ni à la progression ni aux sauvegardes, et le changement se voit à la prochaine ouverture du monde.

- **Essayer le nouveau dessin du monde** : le monde est dessiné avec le rendu d’Archipéo en construction (ciel, mer, relief à facettes, décor, constructions taillées ; en 2D, la 2D peinte) au lieu du monde en blocs, qui reste disponible en décochant la case.
- **La surface du monde**, affichée quand le nouveau dessin est activé : **Les textures des blocs** (par défaut), **Couleurs unies** (une couleur par face), **Couleurs nuancées** (la couleur fondue en douceur, le style retenu pour Archipéo), **Coins arrondis** (la lumière arrondie sur les coins des cubes).

Ces options préparent le choix de l’univers, qui arrivera dans les Réglages et les remplacera : on y choisira Archipéo ou Blocland, le monde en blocs. Pour les développeurs, l’adresse `/?rendu=archipeo#/aventure` (et `&style=a`, `b` ou `c`) fait la même chose et l’emporte sur les Réglages.

## Application

La version installée est affichée, avec le bouton **Vérifier les mises à jour** (ou **Mettre à jour maintenant** quand une version est prête). Voir [Démarrer](demarrer.md#les-mises-a-jour).

Deux liens s’ouvrent dans un nouvel onglet : **La documentation** (ce site, https://g7ed6e.github.io/dysapps/) et **Le code sur GitHub** (https://github.com/g7ed6e/dysapps).

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
