# Les Roches : captures et planche

Planche : rangée 3 (`roches-ruine-face-2026`, `-ruine-dos-42`, `-restaure-face-42`, `-restaure-dos-42`), en `00-planche-*.jpg`. Intention : § 4 (quatre parties).

| Capture | Ce qu'on voit | Face à la planche et à l'intention |
| --- | --- | --- |
| `01-cap-de-y-aller-ruine` | Au cap 290°, la salle basse adossée au flanc sombre du cône, et Kéo devant. | **Kéo cache le milieu de la salle** (la table et ses poutres). Le cratère est hors du cadre, en haut : il n'est pas au centre, comme voulu. |
| `01-ruine-de-face` | Les deux murs de pierre grise à mi-hauteur, les casiers, la table et les deux poutres couchées, la lanterne sur l'angle du fond. Le toit est tombé. | Conforme : pierre grise et non brique, toit tombé. |
| `02-apres-le-corps-1-sur-2`, `-2-sur-2` | Les murs remontés, puis les casiers et la table réparés. | À la petite taille, la différence entre les deux étapes se lit mal. |
| `03-apres-le-haut` | Le toit à un pan, sombre, et la lanterne du pignon. | C'est bien un toit à un pan, comme demandé (la planche en avait deux). |
| `04-cap-de-y-aller-restaure`, `04-restaure-de-face` | La salle couverte, le seuil dallé, l'allée, trois lanternes, un bloc de pierre à droite. | Le casque et la hotte sont trop petits pour être jugés à ce cadrage. |
| `05-ruine-de-dos`, `05-restaure-de-dos` | Cap 140°, depuis la pente au-dessus. On voit la Jonction et ses voies au centre, le ravin et le pont à gauche, la Forge en haut à gauche, la baie. La salle n'est que le bord bas de l'image (son toit, une fois restaurée). | Cadrage de l'intention (correction 3). **Écart** : la salle se voit à peine. Aucune lave : 0,00 %. |
| `05-ruine-trois-quarts`, `05-restaure-trois-quarts` | Cap 330°, depuis le sud-est : la salle de trois quarts, les casiers, la table, le flanc du cône au-dessus. | Le cap 215° de la première série cachait la salle derrière la pente : il est remplacé. |
| `06-scenette-geologue` | En vue Scène : Kéo au milieu, la géologue au bord droit, les trois galets pareils sur la table au premier plan. | **La géologue est coupée par le bord droit de l'image.** Le jeu ouvre directement en vue Scène, sans passer par la vue simple. |
| `06-scenette-390x844-opendyslexic-32` (+ `-scene`) | Vue simple lisible. | **Texte coupé** : le rôle « La géologue », en petit, est rogné. En vue Scène, le panneau couvre tout l'écran. |

**Refait** : la première série était fausse pour les états 0 à 3. Une ancienne clé de progrès (`french-5e-homophones-choices-3`) est déplacée au chargement vers la mission « Liens » (`core/movedIds.ts`), ce qui ajoutait une partie. Le scénario retire maintenant ces clés, et toutes les vues des Roches ont été reprises.

## Comment elles sont faites

Captures prises le 22 octobre 2026 sur une copie figée du commit `9df4c78c` (branche `claude/project-thread-6fnudk`, `git archive`, `node_modules` en lien), et non sur l'arbre de `/home/user/dysapps` : le `git checkout 6bff2340` fait par erreur vers 07 h 20 n'a donc touché aucune image. Format 1024 × 768 (le téléphone en 390 × 844, OpenDyslexic 32), de jour, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`). L'état de sauvegarde est « tout construit et relié », sauf le lieu montré, qui a 0, 1, … n missions jouées, LV2 espagnol et option latin. Les vues de face, de dos et de trois quarts sont des caméras posées (`view`) au cap indiqué, Kéo étant mis hors du cadre sur un nœud du chemin. Le cap de « Y aller » et la scénette sont ceux du jeu. Le scénario est dans `../outils/` (`captures.mjs`, `lib.mjs`).

**Pas de nuit** : le monde ouvert n'a pas encore de nuit. La lumière est fixe, et l'intention, § 10, dit « quand elle viendra, GD-20, point 7 ». Une prise à 22 h 30 donne la même image que de jour, donc aucune vue de nuit n'est livrée.
