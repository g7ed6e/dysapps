# L’assemblage des blocs

> Décidé par le mainteneur le 30 septembre 2026 (fiche [GD-2](../pilotage/game-design/propositions/GD-2.md)). Un bloc assemblé par archipel, qu’aucune île ne donne : il s’assemble dans un lieu de l’île de l’école, et seuls les monuments de son archipel en demandent. `npm run contenu` produit `src/blocland/world/recettes.ts` depuis ce fichier : ne jamais l’éditer. Le dessin des blocs et du lieu, et les cases des monuments qui les demandent, restent dans le code (`biomes.ts`, `pixels.ts`, `palette.ts`, `monuments.ts`).

## Le lieu

> Son nom dans chaque univers : le titre de sa page, où il est (« à … »), et la phrase lue sous le titre.

| univers | nom | à | présentation |
| --- | --- | --- | --- |
| `blocland` | La Fabrique | à la Fabrique | Ici, tu assembles tes blocs pour en faire des pièces que les monuments attendent. |
| `archipeo` | La Halle aux matériaux | à la Halle aux matériaux | Les anciens savaient assembler ce qu’aucune île ne donne seule. Ici, tu retrouves leur savoir-faire pour les monuments. |

## Les blocs assemblés

> Un par archipel. La recette prend des blocs d’îles de son archipel (deux sortes au plus, de petits nombres), jamais d’or ni de cristal. Le nom est propre à chaque univers ; un pluriel qui ne s’écrit pas avec un « s » se met entre parenthèses.

| bloc | archipel | recette | Blocland | Archipéo |
| --- | --- | --- | --- | --- |
| `poutre` | 6e | bois × 2 · brique × 1 | Poutre | Madrier |
| `vitrail` | 5e | glace × 2 · panneau × 1 | Vitrail (vitraux) | Hublot |
| `engrenage` | 4e | acier × 2 · rail × 1 | Engrenage | Poulie |
| `miroir` | 3e | lentille × 2 · quartz × 1 | Miroir | Loupe |
