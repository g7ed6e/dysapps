# Esquisses des quatre archipels

Référence du lot R4b (les silhouettes des archipels), d'après le pack visuel (`../pack-visuel/`), dont la planche maître fait foi.

- `fiches-archipels.md` : une fiche par archipel, écrite par le directeur artistique : intention, silhouette, repères, architecture, palette, lumière, composition. Elle liste aussi les écarts avec les décisions déjà prises et comment le mainteneur les a tranchés.
- Pour les sous-lots R4b-5e, R4b-4e et R4b-3e, les fiches d'intention de `../intentions/` précisent ces fiches sur la caméra du jeu et en remplacent les compositions pour ces sous-lots.
- `atelier/` : le code Three.js qui dessine une esquisse par archipel (6e, 5e, 4e, 3e « Îles du Ciel », et L'Horizon du lot 8), de jour et de nuit.

Ces esquisses sont des images de concept, pas le jeu. Elles ne sont ni importées ni chargées par l'application. Comme dans le jeu, tout y est dessiné par le code, sans modèle ni texture empruntés. Le jeu, lui, garde son propre rendu (`src/game/world/`), qui reprend les intentions des fiches et non ce code.

## Refaire les images

Depuis la racine du dépôt, après `npm install` :

```sh
node docs/univers/archipeo/esquisses/atelier/render.mjs /tmp/esquisses 6e 5e 4e 3e horizon 6e:n 5e:n 4e:n 3e:n horizon:n
```

Chaque argument donne une scène ; `:n` la rend de nuit. Les PNG (1600 × 1000) sont écrits dans le dossier donné, jamais dans le dépôt. Il faut un Chromium : celui de Playwright, ou un autre désigné par `CHROMIUM_PATH`.

- `kit.js` : les briques (ciel, mer peinte, îles, arbres, maisons à colombages, phare, grue de bois, brume, nuages, oiseaux…).
- `scenes.js` : la composition de chaque archipel, commentée d'après les fiches.
