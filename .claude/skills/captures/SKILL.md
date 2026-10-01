---
name: captures
description: Prendre vite les captures d'écran de DysApps (manuel, lots de rendu Archipéo et Blocland, avant/après) et les publier sur la branche captures. À lire avant toute capture.
---

# Les captures d'écran, vite

Les captures sont souvent l'étape la plus longue d'un fil. Ce qui suit évite de refaire ce qui n'a pas changé et d'attendre pour rien.

## Quel script

- **Le manuel** (`www/_captures/`, jamais commitées) : `npm run www:captures -- <nom> [<nom>…]`, les noms de `SHOTS` dans `scripts/www/captures.mjs`. Ne refaire que les écrans qui changent ; la CI refait tout sur `main`.
- **Un lot de rendu** : `npm run rendu:mesures -- --sans-poids --captures <dossier> --archipel <6e|5e|4e|3e> --familles <liste>`, les captures déclarées dans `CAPTURES` de `scripts/rendu/mesures.mjs` (familles : jour, nuit, contraste, reduit, chantier, ponts, et celles que les lots ajoutent, comme relais, jardin et jardin-pres, les vues de près recadrées ; plus de famille 2d : ni Archipéo ni Blocland n'ont de 2D au choix, elle reviendra avec un univers dessiné en 2D). Ajouter `--rendu archipeo` pour le rendu Archipéo.
  - Toujours `--sans-poids` sauf si le poids de Three.js est demandé : il lance un build complet.
  - Toujours `--archipel` quand le lot ne touche qu'un archipel : les quatre archipels, c'est environ 120 vues.
  - `--familles` : seulement celles que le lot change ; les trois vues de jour (les mesures) se font toujours.
  - Une capture qui manque à la liste s'ajoute dans `CAPTURES` (ou `SHOTS`), jamais par un script à côté.

## Pièges connus

- Lancer depuis le dépôt principal, pas depuis un worktree : dans un worktree, les polices ne sont pas servies et les textes changent de forme.
- Rendu logiciel (SwiftShader, pas de carte graphique) : la page demanderait 60 images/s que le processus graphique ne peut pas dessiner (il occupe les quatre cœurs), et chaque prise attendait 11 à 18 s que les images en retard se vident. Les deux scripts passent par `scripts/prise-de-vue.mjs`, qui bride la boucle de rendu à 8 images/s et la fige le temps de la prise. Une nouvelle prise d'image passe par `capturer(page, …)`, jamais par `page.screenshot` directement, et la page reçoit `page.addInitScript(figeable)` avant de charger l'application.
- Bridée, la caméra mettrait plus de 20 s à finir son approche en douceur : `attendreLaScene(page, max)` la pose d'un coup à son cadrage dès que le monde est construit et ne bouge plus, au plus `max` millisecondes (`--attente` des mesures : un plafond, plus une durée fixe). Pas d'attente fixe avant une capture 3D. Le 6e de jour et de nuit (six vues) : 36 s, contre 149 s avant le 01/10/2026.
- Les images par seconde affichées par les mesures en rendu logiciel varient beaucoup d'une fois à l'autre : ne pas en tirer de conclusion. Elles se mesurent sur la tablette de référence (`/?mesures#/aventure`).
- Heure figée (`page.clock.setFixedTime`) : pas de `waitForFunction` qui sonde, utiliser des attentes (`waitForTimeout`) ou `page.evaluate`.
- Lancer un long script en arrière-plan avec un journal (`> fichier.log 2>&1`), pas derrière `| tail` : sinon rien ne s'affiche avant la fin.
- Un seul script de captures à la fois dans le conteneur : deux en parallèle se disputent les 4 cœurs et vont moins vite.

## Ce qu'un lot de rendu montre

Voir `docs/conception/cadrage-archipeo.md` (les captures déclarées d'avance) et `docs/conception/bonnes-pratiques-dys.md` : jour et nuit, en 3D. Ni 2D, ni Contraste élevé, ni « Réduire les animations » : ces captures sont retirées le 28 septembre 2026 (les deux réglages reviennent au lot 11 du cadrage Archipéo, avec leurs captures). Le référent dys demande en plus une courte vidéo sur tablette, que seul le mainteneur peut faire : la noter comme restant à faire.

## Publier sur la branche `captures`

Branche à part, jamais fusionnée, un dossier par lot (`r5/`, `r4b-4e/`…). Seules les captures validées par le directeur artistique y vont.

```sh
git fetch origin captures
git worktree add ../captures origin/captures   # un worktree suffit ici : on n'y lance pas l'application
cd ../captures && git switch -c captures-maj
mkdir -p <lot> && cp <dossier>/*.jpg <lot>/
git add <lot> && git commit -m "Captures du lot <lot> : <ce qu'elles montrent>"
git push origin HEAD:captures
```

Dans la description de la pull request, lier le dossier : `https://github.com/g7ed6e/dysapps/tree/captures/<lot>`.
