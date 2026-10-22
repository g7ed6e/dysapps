# La Basilique : captures et planche

Planche : rangée 6 (`basilique-ruine-face-2026`, `-ruine-dos-42`, `-restaure-face-42`, `-restaure-dos-42`), en `00-planche-*.jpg`. Intention : § 7 (trois parties, missions de latin ; la 3D est la même en grec).

| Capture | Ce qu'on voit | Face à la planche et à l'intention |
| --- | --- | --- |
| `01-cap-de-y-aller-ruine` | Au cap 270°, dans l'axe de la nef : la ferme ouest debout sur ses deux colonnes, les colonnes de basalte, le pilier de la fontaine au milieu, la mer au fond. Kéo est devant. | La nef se lit dans son axe, comme voulu. Kéo cache le bas du pavement. |
| `01-ruine-de-face` | La même vue sans Kéo : les colonnes debout, une colonne cassée à gauche, les tambours couchés à droite, la dalle dressée. | Colonnes rondes, sans fronton, sans mur : les écarts de la planche sont corrigés. Le pavement est d'un gris beige clair. **À relire** : il est proche du crème que l'intention refuse. |
| `02-apres-le-corps` | Les huit colonnes debout et le pavement à plat. | |
| `03-apres-le-haut` | La halle : quatre fermes, les pannes, le toit à deux pans, et la lanterne de la ferme est. | |
| `04-cap-de-y-aller-restaure`, `04-restaure-de-face` | Le parvis dallé, la fontaine, la lanterne du chemin au bord est. Trois lanternes. | La halle restaurée tient entière dans le cadre bas. |
| `05-ruine-de-dos`, `05-restaure-de-dos` | Cap 90°, depuis l'ouest, la caméra au-dessus de la mer : la halle de près, la serre de l'Herbier à droite, les Fabriques au loin. | Pas de silhouette sur la crête, pas de serre accolée : les écarts de la planche sont corrigés. Aucune lave : 0,00 %. |
| `05-ruine-trois-quarts`, `05-restaure-trois-quarts` | Cap 215° : la halle longue et basse de trois quarts, avec le parvis. | Conforme au « on garde » de la planche (toit de tôle sombre sur des fermes de bois). |
| `06-scenette-sculptrice` | Le jeu ouvre en vue Scène, sous la halle, au cap ouest. Kéo est à gauche, la sculptrice à droite, la fontaine au milieu et les blocs pareils sur l'établi, au premier plan. | Bonne lisibilité. Une colonne coupe le bord droit. |
| `06-scenette-390x844-opendyslexic-32` (+ `-scene`) | Vue simple lisible. | **Texte coupé** : le rôle « La sculptrice », en petit, est rogné (« La sculptric »). En vue Scène, le panneau couvre tout l'écran. |
| `10-y-aller-sans-option` (+ `-390x844-opendyslexic-32`) | Sans option : « Tu n'as pas choisi l'option latin ou grec : ses missions ne sont pas proposées ici. Si tu la suis au collège, choisis-la dans les Réglages. », un haut-parleur et le bouton « Choisir l'option ». | Conforme à #495. Au téléphone, il faut faire défiler la fiche pour voir le bouton. |

## Comment elles sont faites

Captures prises le 22 octobre 2026 sur une copie figée du commit `9df4c78c` (branche `claude/project-thread-6fnudk`, `git archive`, `node_modules` en lien), et non sur l'arbre de `/home/user/dysapps` : le `git checkout 6bff2340` fait par erreur vers 07 h 20 n'a donc touché aucune image. Format 1024 × 768 (le téléphone en 390 × 844, OpenDyslexic 32), de jour, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`). L'état de sauvegarde est « tout construit et relié », sauf le lieu montré, qui a 0, 1, … n missions jouées, LV2 espagnol et option latin. Les vues de face, de dos et de trois quarts sont des caméras posées (`view`) au cap indiqué, Kéo étant mis hors du cadre sur un nœud du chemin. Le cap de « Y aller » et la scénette sont ceux du jeu. Le scénario est dans `../outils/` (`captures.mjs`, `lib.mjs`).

**Pas de nuit** : le monde ouvert n'a pas encore de nuit. La lumière est fixe, et l'intention, § 10, dit « quand elle viendra, GD-20, point 7 ». Une prise à 22 h 30 donne la même image que de jour, donc aucune vue de nuit n'est livrée.
