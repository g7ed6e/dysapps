# Le monde

Le monde est la partie la plus lourde du code (`src/game/world/` et `src/game/three/`). Il est rangé pour qu’une même logique serve plusieurs dessins et plusieurs univers : le jeu dit **ce qui existe**, la grille dit **où**, la vue dit **comment le dessiner**. L’histoire de ce rangement est dans [Séparer le jeu du rendu](../conception/separation-jeu-rendu.md) ; le style attendu dans [le rendu](../rendu/style.md).

## Du jeu au dessin

```mermaid
flowchart LR
  etat[GameState<br/>la partie] --> modele[world/model.ts<br/>modeleDuMonde : îles, bornes, ouvrages, états]
  modele --> page[WorldPage.tsx<br/>panneaux, fiches, voyage, vague]
  grille[world/grid.ts, map.ts, terrain.ts<br/>la place de chaque chose en cases] --> vue
  page -- props du contrat world/view.ts --> vue[three/WorldCanvas.tsx<br/>la scène 3D]
  habillage[skin.ts + world/skin/<br/>ce que l’univers change au dessin] --> vue
  vue -- Intention : île, borne, lieu, ouvrage, créature, navire… --> page
  page -- actions --> ctx[BloclandContext]
  ctx --> etat
```

- `world/model.ts` lit la partie et rend le modèle d’un archipel en identifiants, sans une seule case : les îles, leurs bornes et leur état, les ouvrages, le voyage en cours. Il décide aussi ce que fait un toucher (jouer une borne, ouvrir l’île d’un ouvrage, aller vers une île, voyager).
- La grille (`world/map.ts` la forme des îles, `world/terrain.ts` le monde en cubes, un métier par fichier dans `world/terrain/`, `world/paths.ts` la marche, `world/harbour.ts` le quai) place tout en cases du monde ; `world/grid.ts` en est l’entrée (`grilleDe`).
- `world/view.ts` est le contrat entre `WorldPage` et une vue : les props qu’une vue reçoit, les intentions qu’elle renvoie (`world/layout.ts`). `WorldPage` ne connaît que ce contrat.
- La vue ne décide rien : elle dessine ce qu’on lui passe et dit ce que l’élève a touché, par une `Intention` que `WorldPage` traite dans un seul `switch`.

## La scène 3D

`three/WorldCanvas.tsx` crée une scène par archipel, refaite quand l’archipel ou « Réduire les animations » change. La scène est faite de **parties**, chacune dans son fichier, qui suivent le même contrat (`three/scenePart.ts`) : se construire à partir du `Monde`, s’animer à chaque image, se libérer.

```mermaid
flowchart TD
  wc[WorldCanvas.tsx] --> monde[Monde<br/>scène, archipel, habillage, étendue]
  monde --> lumiere[light.ts]
  monde --> brume[mist.ts]
  monde --> large[offshore.ts<br/>la mer au loin, le ciel]
  monde --> cubes[cubes.ts<br/>le monde en blocs, le sol, le décor]
  monde --> bornes[markers.ts]
  monde --> personnages[characters.ts<br/>bonhomme, créatures, Gardiens]
  monde --> navire[ship.ts]
  monde --> etiquettes[labels.ts<br/>les noms des îles]
  monde --> signes[signs.ts<br/>les bulles de ce qu’on peut faire]
  monde --> camera[camera.ts<br/>cadrages, glisser, pincer]
```

```mermaid
sequenceDiagram
  participant B as Boucle (requestAnimationFrame)
  participant D as Parties qui déplacent
  participant P as Toutes les parties
  participant R as Renderer
  loop chaque image, tant que la vue est visible
    B->>D: deplacer(t, dt, réduit) : le bonhomme, le navire
    B->>P: animer(t, dt, réduit) : lisent l’Instant partagé
    B->>R: render(scène, caméra)
  end
  Note over B: page cachée, la boucle s’arrête<br/>images lentes, le pixel ratio passe à 1
```

- Les parties partagent un `Instant` (où en sont la marche et le voyage à cette image) et les `Derniers` props de la vue : la scène n’est pas refaite quand les props changent, les parties les relisent.
- Le calcul des formes est pur et testé dans `world/` (`landMesh.ts` le sol en facettes, `construction.ts` les bâtiments, chacun avec ses réglages, ses couleurs et son éclairage rangés à côté, dans `landMesh/` et `construction/`, `decorMesh.ts` le décor, `sea.ts`, `fauna.ts`, `characters/`) ; `three/` ne fait que les donner à Three.js.
- Chaque géométrie, matériau et texture est libéré quand la scène est refaite (`dispose`).

## Les univers

Les deux univers jouent le même jeu. Ce qui change au dessin passe par un objet `Habillage` (`game/skin.ts`, une donnée par univers dans `world/skin/`) : le ciel, la brume, le sol, les personnages, les étiquettes, les bulles. Ce qui change aux mots passe par `src/universes/` (`useTextes()`). Le code ne teste presque jamais le nom de l’univers : il lit une ligne de l’habillage ou un texte.

## Le budget de dessin

`world/budget.ts` fixe le budget d’un archipel tout construit et compte, sans Three.js, les triangles et les appels de dessin de chaque poste (sol, mer, décor, constructions, personnages…). Un test garde la somme sous le budget ; `npm run rendu:mesures` mesure la scène réelle dans Chromium, et `?mesures` l’affiche dans l’application. Un changement de code qui ne doit rien changer à l’image garde ces nombres à l’identique.
