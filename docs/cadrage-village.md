# Cadrage — « Le village de Blocland » (chantier immersif)

Document de travail : ce que l'on veut, ce que l'on s'interdit, comment on le découpe. Décisions prises le 25 septembre 2026 ; les points marqués **Décidé** rappellent le choix retenu.

## 1. Le besoin en une phrase

Remplacer la grille 8 × 8 du Chantier par **un monde continu en 3D** — les cinq îles reliées par des ponts — où l'élève **reconstruit le village bâtiment par bâtiment en suivant des plans**, avec les blocs gagnés dans les exercices, dans un monde qui **vit** (jour et nuit, créatures, sons, particules).

Ce que le chantier actuel n'offre pas, et qui manque :

| Manque ressenti | Ce que le village apporte |
| --- | --- |
| On regarde une grille de haut | On est *dans* le monde : caméra libre, on se rapproche, on tourne autour des maisons, on passe d'une île à l'autre |
| Rien ne bouge | Ciel qui change, nuages, créatures qui se promènent, eau, fumée des cheminées, sons de pose |
| On empile sans but | Des **plans** : la maison de Mousso, la forge de Tunel, le moulin de Bloquette… à reconstruire, chacun avec sa récompense |
| 8 × 8, six blocs de haut, sept types | Cinq îles, relief léger, nouveaux blocs (porte, escalier, torche, toit, barrière) |

## 2. Ce qu'on garde absolument (contraintes du brief)

- **Aucun texte à lire dans la 3D.** Les consignes (« Il manque 3 planches au toit ») sont dans un panneau HTML sous ou à côté de la scène, en police dys, lues à voix haute.
- **Pas de chrono, pas de classement, pas de perte.** Un bloc mal posé se retire en un geste et revient dans l'inventaire.
- **Sessions courtes.** Le village est une récompense entre deux exercices : on peut y passer deux minutes, poser trois blocs et repartir. Pause proposée après 10 minutes.
- **Réduire les animations** reste respecté : cycle jour/nuit figé, créatures immobiles, pas de particules, caméra sans inertie.
- **Vue simple sans WebGL ou si la 3D est désactivée** : liste des plans avec leur avancement et un bouton « Poser le bloc suivant » ; tout ce qui est faisable en 3D l'est aussi en vue simple.
- **Cibles tactiles ≥ 48 px** pour le HUD ; dans la scène, un tap pose sur la face touchée, un appui long retire (et un bouton « Retirer » explicite dans le HUD, pour ne pas dépendre de l'appui long).
- **Ne rien emprunter** à un jeu existant : formes, textures et noms restent les nôtres.

## 3. Le monde

- **Un seul terrain** : les cinq îles de la carte actuelle (`mapScene.ts`) deviennent le sol du village. La carte de la page Blocland et le village sont **la même scène** ; on entre dans une île depuis la carte, on en sort par un bouton.
- **Une île verrouillée** reste en pierre grise, sans plan ni créature (règle d'aujourd'hui).
- **Relief léger** : une ou deux marches par île, un arbre ou deux, l'eau tout autour (animée, pas praticable).
- **Caméra libre** : orbite, zoom, déplacement latéral, avec des limites (on ne sort pas du monde, on ne passe pas sous le sol). Boutons « Aller à… » par île et « Vue d'ensemble » pour ne jamais se perdre.
- **Budget de performance** : tablette d'entrée de gamme, 60 images/s visées, ≤ 6 000 cubes → un maillage instancié par texture, pas un maillage par cube ; les faces cachées ne sont pas dessinées.

## 4. Les plans (construction guidée)

- Un **plan** = un bâtiment en ruine avec sa **silhouette fantôme** (cubes translucides) ; l'élève touche un fantôme pour y poser un bloc du bon type. Si le type manque : « Il te faut 1 bloc de planches : va dans la Forêt des sons. »
- Chaque île a **2 à 3 plans**, du plus petit (une cabane, 12 blocs) au plus grand (le moulin, 60 blocs). Un plan terminé **débloque le suivant** sur l'île.
- Terminer un plan **récompense** : la créature s'y installe (elle entre dans la maison, en ressort), un coffre (blocs bonus), de l'XP, un succès, une ligne dans le journal (étape 6 du brief).
- Les blocs se **posent dans n'importe quel ordre** ; on ne bloque jamais sur « le bon bloc suivant ».
- **Format** : fichier JSON par plan, versionnable et testable.

```json
{
  "id": "foret-cabane",
  "biome": "foret",
  "name": "La cabane de Mousso",
  "origin": { "x": 2, "y": 1 },
  "cells": [{ "x": 0, "y": 0, "z": 0, "block": "bois" }, { "x": 1, "y": 0, "z": 0, "block": "bois" }],
  "reward": { "xp": 40, "chest": { "bois": 4, "verre": 2 } }
}
```

- **Zone libre** — **Décidé** : à côté des bâtiments, chaque île a un petit terrain (environ 6 × 6) où l'on pose ce qu'on veut, pour garder la créativité sans détourner des plans.
- **Constructions actuelles** (grille 8 × 8) — **Décidé** : non migrées ; à la première ouverture du village, les blocs posés reviennent dans l'inventaire (aucune perte de ressources).

## 5. Le monde qui vit

- **Jour et nuit** — **Décidé** : suit l'heure réelle de l'appareil (aube 7 h, crépuscule 20 h, transitions douces) ; ciel, lumière et couleur des ombres varient, torches et fenêtres s'allument la nuit. Un bouton « Forcer le jour » dans le HUD ; avec « réduire les animations », le ciel est figé sur le moment de l'entrée.
- **Créatures** : chacune se promène sur son île (chemin aléatoire lent, jamais sur les fantômes), se tourne vers la caméra quand on la touche et dit une phrase (bulle HTML lue à voix haute), entre dans sa maison une fois le plan terminé.
- **Ambiance** : nuages qui dérivent, eau qui ondule, fumée de cheminée, particules à la pose (éclats de la couleur du bloc), herbe qui frémit.
- **Sons** — **Décidé** : générés par le code (Web Audio, aucun fichier). Par défaut, seulement les sons d'action (pose, retrait, plan terminé) ; l'ambiance (vent, oiseaux le jour, grillons la nuit) est un réglage à activer. Un bouton dans le HUD coupe tout ; jamais de son pendant la lecture à voix haute.

## 6. Modèle de données (aperçu)

```ts
interface VillageState {
  placed: Record<BiomeId, BuildCell[]>;        // blocs posés, par île (fantômes remplis et zone libre)
  plans: Record<string, { done: string[] }>;   // cellules remplies par plan ("x,y,z")
  camera?: { island: BiomeId };                // dernière île visitée
}
```

Le reste (`inventory`, `streak`, `chests`, `progress`) ne change pas. `sanitizeState` vide l'ancien `build` en recréditant l'inventaire, puis supprime la clé.

## 7. Découpage en PR

Chaque PR est livrable seule, testée, avec la vue simple qui suit.

1. **Le monde continu** — les cinq îles praticables dans une seule scène (instanciation, faces cachées supprimées, eau, relief léger), caméra libre avec limites, boutons « Aller à… » et « Vue d'ensemble », remplacement de la carte 3D actuelle par cette scène.
2. **Poser dans le monde** — inventaire en HUD, pose sur la face touchée, retrait (appui long + bouton), zone libre par île, retour des anciens blocs dans l'inventaire, sons de pose et retrait, vue simple équivalente.
3. **Les plans** — format JSON, fantômes, validation par type de bloc, avancement, premier plan par île, récompense (XP, coffre, succès), consignes lues à voix haute.
4. **Le monde qui vit** — jour et nuit selon l'heure réelle, nuages, eau animée, créatures qui se promènent et parlent, particules, ambiance sonore en option, tout coupé par « réduire les animations ».
5. **Le village s'achève** — deuxième et troisième plans par île, nouveaux blocs (porte, escalier, torche, toit, barrière), créature qui emménage, journal de construction (étape 6 du brief), succès dédiés.
6. **Finitions** — tests de performance sur tablette, tutoriel d'entrée dans le village (trois bulles), accessibilité clavier dans la scène, réglages (sons, sensibilité de la caméra).

Ordre non négociable : 1 → 2 → 3 ; 4 et 5 peuvent s'intervertir.

## 8. Hors périmètre (pour l'instant)

- Marcher à la première personne ou diriger un avatar (la caméra libre est un choix assumé pour des 6e sur tablette).
- Multijoueur, partage de constructions, sauvegarde en ligne.
- Physique (rien ne tombe, rien ne casse) : règle du brief conservée.
