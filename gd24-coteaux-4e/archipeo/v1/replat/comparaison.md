# Le Détour du Replat : captures et planche

Planche : rangée 1 (`replat-arrivee-42`, `replat-du-chemin-42`), en `00-planche-*.jpg`. Intention : § 8.

| Capture | Ce qu'on voit | Face à la planche et à l'intention |
| --- | --- | --- |
| `07-replat-arrivee-le-nom` | Kéo vient d'arriver. « Le Replat » s'écrit en haut, sur fond clair, avec son haut-parleur. On voit la terrasse verte, le poteau de bois et sa lanterne ocre, les blocs du muret. Au fond, dans la brume, l'usine et la serre de l'Herbier. | Le nom s'écrit une fois, comme voulu. **Écart** : la terrasse n'a pas l'air plate. C'est un plan vert incliné, aussi raide que le flanc. Les blocs du muret, en contrebas à droite, ne se lisent pas comme un arc. |
| `07-replat-arrivee` | La même vue, quatre secondes après : le nom est parti. | La bulle « Aucune mission à faire ici pour l'instant. » s'affiche sur un Détour, où il n'y a pas de mission. L'usine est petite et voilée à l'horizon. |
| `07-replat-vu-du-chemin` | Du départ de la sente : la sente de pierres plates monte la pente brune du cône jusqu'à la terrasse, petite, et la lanterne. Le panache en colonne blanche. | Conforme (panache en colonne, et non en boules). |
| `07-replat-du-depart-de-la-sente-camera-du-jeu` | Caméra du jeu au départ de la sente, sur le chemin de la Veillée. La sente part en pointillés. | |
| `07-replat-390x844-opendyslexic-32` | Au téléphone, au plus grand texte : « Le Replat » tient sur deux lignes. | |

**Les fentes de la cuvette** (`mesurer-lueurs.py`, copié de `lot2/captures/forge/`) : arrivée 0,00 %, arrivée avec le nom 0,00 %. On est sous les 2 % : la cuvette ne se voit pas.

## Comment elles sont faites

Captures prises le 22 octobre 2026 sur une copie figée du commit `9df4c78c` (branche `claude/project-thread-6fnudk`, `git archive`, `node_modules` en lien), et non sur l'arbre de `/home/user/dysapps` : le `git checkout 6bff2340` fait par erreur vers 07 h 20 n'a donc touché aucune image. Format 1024 × 768 (le téléphone en 390 × 844, OpenDyslexic 32), de jour, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`). L'état de sauvegarde est « tout construit et relié », sauf le lieu montré, qui a 0, 1, … n missions jouées, LV2 espagnol et option latin. Les vues de face, de dos et de trois quarts sont des caméras posées (`view`) au cap indiqué, Kéo étant mis hors du cadre sur un nœud du chemin. Le cap de « Y aller » et la scénette sont ceux du jeu. Le scénario est dans `../outils/` (`captures.mjs`, `lib.mjs`).

**Pas de nuit** : le monde ouvert n'a pas encore de nuit. La lumière est fixe, et l'intention, § 10, dit « quand elle viendra, GD-20, point 7 ». Une prise à 22 h 30 donne la même image que de jour, donc aucune vue de nuit n'est livrée.
