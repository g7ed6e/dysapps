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

Le texte à lire reste toujours dans la police choisie. Les polices « affiche » et « pixel » de l’interface ne servent qu’aux titres courts, au logo et aux compteurs.

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

- **Réduire les animations** : fige le ciel, les créatures, les baleines, les particules, les transitions, les animations du Gardien ; dans le Filon, le bloc attend au lieu de défiler. Utile pour les élèves sensibles au mouvement ou pour les appareils lents.
- **Vue du monde** : trois choix.
  - **Le monde en 3D** (par défaut).
  - **Le monde en 2D (expérimental)** : le même monde en pixels, vu de dessus en oblique, plus léger pour les appareils modestes (voir [Archipéo](blocland.md)).
  - **La liste des îles** : la **vue simple** (listes et pages), qui offre exactement les mêmes actions.

  Si l’appareil ne sait pas dessiner le monde en 3D (pas de WebGL), Archipéo montre le monde en 2D ; s’il ne sait rien dessiner, la liste des îles. Une ancienne préférence « Vues en 3D » désactivée devient « La liste des îles ».
- **Marche libre dans le monde en 2D** (désactivé par défaut) : une croix de direction s’affiche en bas à droite du monde, avec un bouton **Entrer** au milieu. Voir [Archipéo](blocland.md).
- **Sons dans le village** : les sons d’action (poser, retirer un bloc, plan terminé) et ceux du voyage en Bloc-Navire (corne de brume, voile, brûleur, réacteur, carillon d’arrivée).
- **Ambiance sonore du village** : vent, oiseaux le jour, grillons la nuit ; désactivée par défaut.
- **Vibrer à la bonne réponse et à la pose d’un bloc** : une vibration très courte, comme dans les jeux ; seulement sur les téléphones Android (Safari ne sait pas vibrer). Activé par défaut.
- **Pastille sur l’icône de l’appli** : un simple point sur l’icône de l’appli installée quand des révisions attendent aujourd’hui ; pas de nombre, pas de notification. Affiché par Android, les ordinateurs et les iPhone et iPad récents, pour l’appli installée. Activé par défaut.

## Application

La version installée est affichée, avec le bouton **Vérifier les mises à jour** (ou **Mettre à jour maintenant** quand une version est prête). Voir [Démarrer](demarrer.md#les-mises-a-jour).

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
