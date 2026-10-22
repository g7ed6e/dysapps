# L'Herbier : captures et planche

Planche : `concepts/selection-coteaux-v3.jpg`, rangée 2 (`herbier-ruine-face-42`, `-ruine-dos-42`, `-restaure-face-42`, `-restaure-dos-42`), copiées en `00-planche-*.jpg`. Intention : `coteaux/intention.md`, § 3.

| Capture | Ce qu'on voit | Face à la planche et à l'intention |
| --- | --- | --- |
| `01-cap-de-y-aller-ruine` | Au cap 225° (porte au nord-est), Kéo est devant la serre de trois quarts. On voit les arceaux debout, un pan de verrière au faîte, les bacs, la lanterne de la porte allumée et la mer au fond. | C'est bien la serre à arceaux en berceau sur son socle de pierre, la mer derrière. Kéo cache le milieu du socle. |
| `01-ruine-de-face` | La même vue sans Kéo : les arceaux bruns, deux qui penchent au bout est, le pan de verre restant, les bacs renversés, le tas de verre au pied du pignon et la lanterne. | Conforme à l'intention (trois vitres, le reste tombé). La planche montrait la serre presque entière : c'était l'écart signalé. |
| `02-apres-le-corps` | Les arceaux sont redressés et les bacs plantés de pousses vertes en rangs. | Pas d'étape sur la planche. |
| `03-apres-le-haut` | La verrière est entière, avec le faîtage et l'aérateur. La lanterne du pignon est allumée. | **Écart** : la verrière est d'un gris opaque, sans transparence. La serre se lit comme un hangar de tôle grise, pas comme du verre (planche : verre clair, bacs visibles à travers). |
| `04-cap-de-y-aller-restaure`, `04-restaure-de-face` | La serre restaurée, la porte au milieu du long côté, trois lanternes (porte, pignon, chemin), les bacs du dehors et l'allée bordée. La bulle « Aucune mission à faire ici pour l'instant. » | Les trois lanternes, aux bonnes places. La verrière opaque est le même écart que pour `03`. |
| `05-ruine-de-dos`, `05-restaure-de-dos` | Vue du sud-ouest vers le nord-est : la citerne au premier plan avec son pilier (le support de la pompe), puis la serre, et au loin les toits des Fabriques. | La citerne est pleine d'eau sombre une fois restaurée. Le cône est hors du cadre. Aucune lave : 0,00 % (`mesurer-lueurs.py`). |
| `05-ruine-trois-quarts`, `05-restaure-trois-quarts` | Le long côté sud et la citerne au bout, la mer derrière. | Le décor est fini tout autour. |
| `06-scenette-horticultrice` (+ `-panneau`) | En vue Scène, Kéo est à gauche et l'horticultrice à droite, tous deux petits, au fond. Les trois godets pareils sont sur la paillasse, au premier plan. Le cap est sud-ouest, vers la mer. | Les godets se lisent bien. **Écart** : les deux personnages sont petits, loin derrière la paillasse, et la caméra plonge comme à la Forge. |
| `06-scenette-390x844-opendyslexic-32` (+ `-scene`) | En vue simple, les réponses tiennent dans l'écran. | **Texte coupé** : le rôle « L'horticultrice », en petit en haut, est coupé (« L'horticultri ») ; en vue Scène, il est coupé au milieu du mot, et la phrase touche le bord. Le panneau couvre tout l'écran : on ne voit pas la scène. C'est le chantier commun des scénettes au téléphone. |

## Comment elles sont faites

Captures prises le 22 octobre 2026 sur une copie figée du commit `9df4c78c` (branche `claude/project-thread-6fnudk`, `git archive`, `node_modules` en lien), et non sur l'arbre de `/home/user/dysapps` : le `git checkout 6bff2340` fait par erreur vers 07 h 20 n'a donc touché aucune image. Format 1024 × 768 (le téléphone en 390 × 844, OpenDyslexic 32), de jour, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`). L'état de sauvegarde est « tout construit et relié », sauf le lieu montré, qui a 0, 1, … n missions jouées, LV2 espagnol et option latin. Les vues de face, de dos et de trois quarts sont des caméras posées (`view`) au cap indiqué, Kéo étant mis hors du cadre sur un nœud du chemin. Le cap de « Y aller » et la scénette sont ceux du jeu. Le scénario est dans `../outils/` (`captures.mjs`, `lib.mjs`).

**Pas de nuit** : le monde ouvert n'a pas encore de nuit. La lumière est fixe, et l'intention, § 10, dit « quand elle viendra, GD-20, point 7 ». Une prise à 22 h 30 donne la même image que de jour, donc aucune vue de nuit n'est livrée.
