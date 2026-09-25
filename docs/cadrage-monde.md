# Cadrage — « Le continent qui monte » (game design du monde)

Décisions du 25 septembre 2026. Objectif : rendre le monde moins répétitif et faire de la progression une aventure, sans toucher aux règles dys (rien à lire dans la 3D, panneaux HTML, pas de chrono, rien ne se perd).

## 1. Diagnostic

Vingt îles identiques de 12 × 12, plates, alignées sur cinq rangées : rien ne distingue une région d'une autre, l'enfant ne peut pas se repérer, et le pont est la seule liaison, les blocs le seul verrou.

## 2. Décisions

- **Un continent qui monte** (option retenue) : cinq régions thématiques, la difficulté monte avec l'altitude. Basses Terres (6e) au centre, Marais et Terres de feu autour, Montagne, puis les Hauteurs pour la 3e. Altitude par classe : 6e = 0 (mer), 5e = 3 (collines), 4e = 6 (monts), 3e = 9 (sommets).
- **Trois conditions pour ouvrir un passage** (option retenue) : payer en blocs (pont, escalier), terminer le premier plan d'une île voisine (tunnel), vaincre un Gardien (col). Chaque île reste atteignable par au moins deux chemins.
- **Carte et relief d'abord** (option retenue) : PR 1 la carte, les tailles, les formes, les altitudes, les montagnes et la caméra, les ponts restant tels quels ; PR 2 les ouvrages et les conditions ; PR 3 les repères et la vie.

## 3. Le monde (PR 1)

- `src/blocland/world/map.ts` : chaque île a un **cœur de 12 × 12** (zone des plans, créature, décor, comme avant) posé sur une **terre plus large** aux contours irréguliers (graine, bruit), une **altitude**, une **région** et un **relief** (plat, collines, montagne en terrasses derrière le cœur, neige au sommet selon la région). Les vingt îles sont placées à la main, la Forêt et la Plaine au centre.
- Les îles en altitude **flottent** : de la roche qui s'amincit dessous, rien au niveau de la mer. Les ponts deviennent des **rampes** (marches) entre deux altitudes ; entre deux îles l'une devant l'autre, le pont part du côté droit du cœur et fait un coude pour éviter l'îlot du Gardien.
- **Paysage** (`landscape()` dans `map.ts`) : autour du cœur, chaque case a une hauteur (collines douces, pics paraboliques des montagnes, cratère du volcan), un sol (herbe, mousse des marais, basalte du feu, roche et neige des sommets, glace du Glacier, sable des plages, eau des lacs, lave du cratère) et parfois un décor selon la région (arbres, sapins, buissons, fleurs, champignons, roseaux, rochers, souches, cristaux). Le rendu (`terrain.ts`) pose ces cubes avec leurs textures ; la lave brille comme les lanternes.
- Les îles **verrouillées** gardent leurs formes et leurs textures, **délavées** vers un gris clair (comme dans la brume) au lieu d'un bloc de pierre uniforme : on devine ce qui attend.
- La caméra de la vue d'ensemble est plus basse et plus proche.
- Tests : le cœur fait partie de la terre, aucune terre ne chevauche une autre ni un îlot, aucun pont ne traverse un îlot, le relief respecte sa famille (volcan avec sa lave, montagnes enneigées, du décor partout sauf sur l'eau et la lave, des lacs), budget de faces sous 34 000.

## 4. À venir

- PR 2 — Ouvrages : pont, escalier taillé, tunnel, bac ; conditions blocs / plan terminé / Gardien vaincu ; migration des ponts.
- PR 3 — Repères et vie : un repère par région (grand arbre, cône fumant, phare), cascades entre niveaux, brume sur les sommets, oiseaux, lanternes visibles la nuit.
