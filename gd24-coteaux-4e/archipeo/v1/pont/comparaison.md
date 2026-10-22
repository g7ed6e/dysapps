# Le pont du ravin : captures et planche

Planche : rangée 1 (`pont-ravin-ruine-42`, `pont-ravin-restaure-42`), en `00-planche-*.jpg`. Intention : § 2.

| Capture | Ce qu'on voit | Face à la planche et à l'intention |
| --- | --- | --- |
| `01-tombe-depuis-le-chemin` | Les Coteaux ne sont pas reliés. Derrière Kéo, sur la culée des Fabriques, la vue va vers l'ouest : les rails qui s'arrêtent net, la culée d'en face avec ses dents, le cadenas, les Coteaux voilés de brume, le cône. | Pas de lanterne ni de mât, comme voulu. Kéo est très près et prend la droite de l'image. |
| `01-tombe-de-cote` | Depuis le lit du ravin, au sud : les deux culées et les claveaux couchés sur le fond. | Pas de moignon de pile. Le ravin est peu profond, comme l'intention l'accepte. |
| `01-tombe-camera-du-jeu` | Caméra du jeu, Kéo sur les rails avant le pont. | |
| `04-y-aller-terre-fermee` | « Y aller » vers l'Herbier, terre fermée : Kéo s'arrête au bord de la culée. | **Écart à vérifier** : une flaque bleue se voit dans le lit du ravin, sous la culée. L'intention dit « jamais un ruisseau ». Ce peut être la mer vue par la brèche, ou une surface d'eau du ravin. La fiche de la terre fermée ne s'est pas ouverte sans toucher. |
| `02-relie-depuis-le-chemin` | Le pont relié : les rails de la ligne sur le tablier côté nord, le dallage, les deux parapets et quatre lanternes aux bouts. | Les quatre lanternes et les parapets demandés par les corrections. |
| `02-relie-de-cote` | Le pont de côté, depuis le ravin : le parapet plein, les lanternes, le tablier. | **Écart** : de ce cadrage, on ne voit presque pas l'arche. On voit un mur bas et long, avec une rangée de dés clairs sous le tablier. La voûte en anse de panier ne se lit pas. |
| `02-relie-camera-du-jeu` | Caméra du jeu, Kéo avant le pont. | |

Lave : 0,00 % sur toutes ces vues (`mesurer-lueurs.py`). **Pas de nuit** : voir plus bas. Les lanternes reliées, de nuit, ne peuvent pas être montrées.

## Comment elles sont faites

Captures prises le 22 octobre 2026 sur une copie figée du commit `9df4c78c` (branche `claude/project-thread-6fnudk`, `git archive`, `node_modules` en lien), et non sur l'arbre de `/home/user/dysapps` : le `git checkout 6bff2340` fait par erreur vers 07 h 20 n'a donc touché aucune image. Format 1024 × 768 (le téléphone en 390 × 844, OpenDyslexic 32), de jour, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`). L'état de sauvegarde est « tout construit et relié », sauf le lieu montré, qui a 0, 1, … n missions jouées, LV2 espagnol et option latin. Les vues de face, de dos et de trois quarts sont des caméras posées (`view`) au cap indiqué, Kéo étant mis hors du cadre sur un nœud du chemin. Le cap de « Y aller » et la scénette sont ceux du jeu. Le scénario est dans `../outils/` (`captures.mjs`, `lib.mjs`).

**Pas de nuit** : le monde ouvert n'a pas encore de nuit. La lumière est fixe, et l'intention, § 10, dit « quand elle viendra, GD-20, point 7 ». Une prise à 22 h 30 donne la même image que de jour, donc aucune vue de nuit n'est livrée.
