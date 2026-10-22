# La Veillée : captures et planche

Planche : rangée 5 (`veillee-ruine-face-42`, `-ruine-dos-42`, `-restaure-face-42`, `-restaure-dos-42`), en `00-planche-*.jpg`. Intention : § 6 (cinq parties, missions d'espagnol ; la 3D est la même en allemand).

| Capture | Ce qu'on voit | Face à la planche et à l'intention |
| --- | --- | --- |
| `01-cap-de-y-aller-ruine` | Au cap 310°, la tonnelle basse de trois quarts, la mer au fond, le flanc du cône à droite, Kéo sur le chemin devant. | Le lieu est bas et sans verticale, comme voulu. |
| `01-ruine-de-face` | Quatre poteaux debout et un poteau couché. Le coin sud-est est affaissé : un grand pan brun incliné, qui se lit comme une bâche plutôt que comme un treillage. On voit aussi le trépied, le garde-manger et la lanterne. | **Écart** : le pan de treillage tombé est une grande surface pleine. Le treillage n'est pas lisible. |
| `02-apres-le-corps-1/2/3-sur-3` | Le sol, la table et les bancs, puis les six poteaux, puis le garde-manger et le trépied. | La première étape se distingue mal de la ruine à cette distance. |
| `03-apres-le-haut` | Le treillage refait, couvert de vigne verte, et la lanterne de l'angle sud-est. | De face et de si bas, on voit peu la vigne. |
| `04-cap-de-y-aller-restaure`, `04-restaure-de-face` | Le muret bas de pierre grise ouvert à l'est, l'enseigne, trois lanternes. | Pas de mur haut ni de brique : les écarts de la planche sont corrigés. |
| `05-ruine-de-dos`, `05-restaure-de-dos` | Cap 130° : la tonnelle au premier plan, le trépied (il ne se lit pas comme une fourche), la halle de la Basilique et la serre de l'Herbier derrière. Au loin, l'usine dans la brume. | La Basilique est bien une halle à colonnes. Aucune lave : 0,00 %. Dans la ruine, une petite figure claire au centre de la tonnelle (l'épicier) se lit à peine. |
| `05-ruine-trois-quarts`, `05-restaure-trois-quarts` | Cap 240° : le côté du garde-manger, avec le chemin à gauche. | |
| `06-scenette-epicier` (+ `-panneau`), `06-scenette-epicier-avant-la-derniere-partie` (+ `-panneau`) | En vue Scène, la caméra est **dans la tonnelle** : poutres, poteaux et treillage (un grand plan vert une fois refait) remplissent l'image. **On ne voit ni Kéo, ni l'épicier, ni les bols.** C'est le même défaut à une mission et à quatre. | **Bloquant** pour la scénette : son cadrage est à reprendre dans le code. Le panneau seul est correct. |
| `06-scenette-390x844-opendyslexic-32` (+ `-scene`) | En vue simple, les réponses tiennent. | Le rôle « L'épicier » tient. En vue Scène, le panneau couvre tout l'écran. |
| `10-y-aller-sans-option` (+ `-390x844-opendyslexic-32`) | Sans LV2 choisie : « Tu n'as pas choisi de LV2 : les missions de ta deuxième langue ne sont pas proposées ici. Tu peux en choisir une dans les Réglages. », un haut-parleur et un seul bouton, « Choisir une LV2 ». Le lieu reste en ruine, sa lanterne allumée. | Conforme à #495. |

## Comment elles sont faites

Captures prises le 22 octobre 2026 sur une copie figée du commit `9df4c78c` (branche `claude/project-thread-6fnudk`, `git archive`, `node_modules` en lien), et non sur l'arbre de `/home/user/dysapps` : le `git checkout 6bff2340` fait par erreur vers 07 h 20 n'a donc touché aucune image. Format 1024 × 768 (le téléphone en 390 × 844, OpenDyslexic 32), de jour, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`). L'état de sauvegarde est « tout construit et relié », sauf le lieu montré, qui a 0, 1, … n missions jouées, LV2 espagnol et option latin. Les vues de face, de dos et de trois quarts sont des caméras posées (`view`) au cap indiqué, Kéo étant mis hors du cadre sur un nœud du chemin. Le cap de « Y aller » et la scénette sont ceux du jeu. Le scénario est dans `../outils/` (`captures.mjs`, `lib.mjs`).

**Pas de nuit** : le monde ouvert n'a pas encore de nuit. La lumière est fixe, et l'intention, § 10, dit « quand elle viendra, GD-20, point 7 ». Une prise à 22 h 30 donne la même image que de jour, donc aucune vue de nuit n'est livrée.
