# La Jonction : captures et planche

Planche : rangée 4 (`jonction-ruine-face-42`, `-ruine-dos-42`, `-restaure-face-42`, `-restaure-dos-2026`), en `00-planche-*.jpg`. Intention : § 5 (cinq parties).

| Capture | Ce qu'on voit | Face à la planche et à l'intention |
| --- | --- | --- |
| `01-cap-de-y-aller-ruine` | Au cap 210°, la voie principale arrive de dos, puis l'aiguillage. La seconde voie de service part à droite, avec la plaque de travers et le rail tordu en arc. Le poste sans toit est à gauche, avec la lanterne du cantonnier. La serre de l'Herbier se voit au loin. | Trois voies et une plaque sur la voie, comme voulu (la planche n'en avait qu'une). Kéo est debout sur la voie principale, devant l'aiguillage. |
| `01-ruine-de-face` | La même vue sans Kéo. Les pans du toit sont à plat à côté du socle, les leviers sont dans leur rangée, la lanterne de voie est éteinte sur son mât. | Le lieu est petit dans l'image au recul de 22. |
| `02-apres-le-corps-1/2/3-sur-3` | La cabine rebâtie, puis les leviers redressés et l'aiguillage remis, puis la plaque remise dans l'axe. | À la taille de l'image, les leviers et les tringles se lisent mal. |
| `03-apres-le-haut` | Le toit de tôle à deux pans, et la lanterne de voie allumée. | |
| `04-cap-de-y-aller-restaure`, `04-restaure-de-face` | Les voies de service refaites, le heurtoir relevé et trois lanternes (le mât, le poste, le chemin). | Pas de mur de brique, pas de V : les écarts de la planche sont corrigés. La burette, le cric et la caisse sont trop petits pour être jugés. |
| `05-ruine-de-dos`, `05-restaure-de-dos` | Cap 335° : le poste au premier plan, les Roches et le cône à gauche, les toits de l'usine à droite. | Cratère hors du centre. Aucune lave : 0,00 %. Un tronc conique, au pied du cône, peut se lire comme une cheminée (c'est le fourneau de la Forge, au loin). |
| `05-ruine-trois-quarts`, `05-restaure-trois-quarts` | Cap 150° : l'aiguillage et le rail tordu au premier plan, le poste au fond. Derrière, la terre rouge des Fabriques. | Pas de lueur rouge (0,00 %). |
| `06-scenette-cantonnier` (+ `-panneau`) | En vue Scène, Kéo et le cantonnier (chemise rouge) sont au fond, au bout des voies. Les cales pareilles sont posées au premier plan. Le cap est ouest-sud-ouest, et la Basilique se voit en haut. | Les personnages sont petits et loin. Les cales se lisent mal : le premier plan est fait de rails et de traverses brunes. |
| `06-scenette-390x844-opendyslexic-32` (+ `-scene`) | En vue simple, les réponses tiennent. | Le rôle « Le cantonnier » tient de justesse. En vue Scène, le panneau couvre tout l'écran. |

**Pas faite** : la capture de mesure « de la Jonction vers le pont » avec la caméra du jeu (§ 11). Les vues du pont (`../pont/`) mesurent 0,00 % de lave.

## Comment elles sont faites

Captures prises le 22 octobre 2026 sur une copie figée du commit `9df4c78c` (branche `claude/project-thread-6fnudk`, `git archive`, `node_modules` en lien), et non sur l'arbre de `/home/user/dysapps` : le `git checkout 6bff2340` fait par erreur vers 07 h 20 n'a donc touché aucune image. Format 1024 × 768 (le téléphone en 390 × 844, OpenDyslexic 32), de jour, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`). L'état de sauvegarde est « tout construit et relié », sauf le lieu montré, qui a 0, 1, … n missions jouées, LV2 espagnol et option latin. Les vues de face, de dos et de trois quarts sont des caméras posées (`view`) au cap indiqué, Kéo étant mis hors du cadre sur un nœud du chemin. Le cap de « Y aller » et la scénette sont ceux du jeu. Le scénario est dans `../outils/` (`captures.mjs`, `lib.mjs`).

**Pas de nuit** : le monde ouvert n'a pas encore de nuit. La lumière est fixe, et l'intention, § 10, dit « quand elle viendra, GD-20, point 7 ». Une prise à 22 h 30 donne la même image que de jour, donc aucune vue de nuit n'est livrée.
