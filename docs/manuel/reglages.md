# Réglages et accessibilité

La page **Réglages** (barre du haut) s’applique à toute l’application, y compris aux panneaux de Blocland, et montre un aperçu en direct. Les réglages sont enregistrés sur l’appareil. Les valeurs par défaut et leurs bornes exactes sont dans [Barème et succès](../pedagogie/bareme.md#reglages-par-defaut).

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
| **Crème** (par défaut) | Fond crème peu contrasté, style « monde en blocs » avec textures et biseaux ; le texte reste toujours sur un fond uni. |
| **Nuit** | Fond sombre et texte clair, mêmes repères. |
| **Clair** | Fond blanc, plat, sans texture ni biseau. |
| **Contraste élevé** | Noir, blanc et jaune, plat, pour les basses visions. |

## Espacements

- **Taille du texte** : de 18 à 32 px, jamais moins de 18 (contrainte orthophonique).
- **Espace entre les lignes** : de 1,5 à 2,4, jamais moins de 1,5.
- **Espace entre les lettres** et **entre les mots** : réglables séparément.

## Voix

La lecture à voix haute utilise la **synthèse vocale du navigateur** (rien n’est envoyé à un serveur). La **vitesse de lecture** se règle de 0,5 à 1,3. Si le navigateur ne propose pas de voix française, la page l’indique ; installer une voix française dans le système (réglages d’accessibilité de l’appareil) suffit en général.

## Animations et Blocland

- **Réduire les animations** : fige le ciel, les créatures, les baleines, les particules, les transitions, les animations du Gardien ; dans le Filon, le bloc attend au lieu de défiler. Utile pour les élèves sensibles au mouvement ou pour les appareils lents.
- **Vues en 3D dans Blocland** : désactivé, Blocland passe en **vue simple** (listes et pages), qui offre exactement les mêmes actions. C’est aussi la vue utilisée quand l’appareil n’a pas WebGL.
- **Sons dans le village** : les sons d’action (poser, retirer un bloc, plan terminé) et ceux du voyage en Bloc-Navire (corne de brume, voile, brûleur, réacteur, carillon d’arrivée).
- **Ambiance sonore du village** : vent, oiseaux le jour, grillons la nuit ; désactivée par défaut.

## Application

La version installée est affichée, avec le bouton **Vérifier les mises à jour** (ou **Mettre à jour maintenant** quand une version est prête). Voir [Démarrer](demarrer.md#les-mises-a-jour).

## Ce qui est réglé une fois pour toutes

Certaines règles ne sont pas des options, parce qu’elles font partie de la méthode :

- pas de chronomètre, nulle part ;
- une seule tâche par écran, et l’écran tient sans défiler ;
- la consigne peut toujours être réécoutée ;
- l’indice ne pénalise jamais (il compte pour un demi-point dans Blocland, jamais en négatif) ;
- une réponse fausse rapporte un point d’effort et la correction explique ;
- les cibles tactiles sont larges (au moins 48 px) ;
- aucun texte à lire n’est dessiné dans la 3D ;
- aucune image ni texture empruntée : tout est dessiné par le code.

Le détail de ces choix et leurs raisons sont dans [Principes dys](../pedagogie/principes.md).
