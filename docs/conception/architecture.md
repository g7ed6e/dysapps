# Architecture

DysApps est une application web statique : React 19, TypeScript, Vite, Three.js pour la 3D, Vitest pour les tests. Aucun serveur, aucune API : tout tourne dans le navigateur et tout est enregistré dans le stockage local.

## Arborescence

```
src/
  apps/          quêtes du portail (un dossier par quête) + registry.ts (catalogue)
  blocland/      l'aventure : biomes, moteur, exercices, monde 3D, plans, Gardiens
  components/    Layout, QuizSession, QuestMenu, SpeakButton, Syllabified, XpBar, useSheetClearance…
  core/          réglages, synthèse vocale, progression et gamification, stockage, syllabes
  pages/         accueil, matière, quête, réglages, succès
  styles/        thèmes, styles globaux, textures pixel générées
docs/            cette documentation (Markdown) ; docs/.vitepress/ : configuration et thème VitePress ; docs/_theme/ : sommaire ;
                 docs/_journal/ : fragments du journal des versions
scripts/         calcul de la version depuis git, index des exercices au build (exerciseMeta.mjs),
                 construction et vérification de la documentation
public/          icônes, police Luciole
```

## Le portail

- `src/apps/registry.ts` : le **catalogue des quêtes** (identifiant, matière, titre, description, icône, composant chargé à la demande). Les pages Français, Maths et Anglais le lisent (`SUBJECTS` : la liste des matières), puis ajoutent les îles de Blocland de la matière.
- `src/components/QuizSession.tsx` : le **moteur d’exercice du portail**, commun à toutes les quêtes. Il reçoit une fonction `makeQuestions` rappelée à chaque séance (ce qui permet de générer des questions aléatoires) et gère consigne lue, réponses, joker, correction dans un bandeau fixe (`useSheetClearance` fait défiler la question juste au-dessus, pour qu'il ne la cache pas ; Blocland s'en sert aussi), XP et bilan.
- `src/components/QuestMenu.tsx` : le menu des quêtes d’une activité (cartes numérotées avec le meilleur score), puis la quête choisie.
- Chaque quête a ses données ou ses générateurs : `homophones/sets.json`, `lecture/texts.json`, `tables/generators.tsx`, `fractions/generators.tsx`, `decimaux/generators.tsx`.

## Le socle commun (`src/core/`)

- `settings.ts` : les réglages, leurs bornes (18 px et 1,5 d’interlignage au minimum) et leur application au document par variables CSS et attribut de thème.
- `speech.ts` : la synthèse vocale du navigateur, vitesse réglable, sans serveur.
- `syllables.ts` : le découpage syllabique par règles.
- `progress.ts` : XP, niveaux, rangs, succès, et les évènements (`recordAnswer`, `recordSession`, `recordPlan`, `recordBoss`). Logique pure, testée.
- `storage.ts` : lecture et écriture dans `localStorage`, avec correction des données lues (champs manquants, valeurs hors bornes).
- `appUpdate.ts` : la mise à jour de la PWA (bande « Mettre à jour », bouton dans les réglages).
- `useLoaded.ts` : attend un contenu chargé à la demande (un exercice, un défi de Gardien) ; un échec remonte à la limite d’erreur de la page (`components/ErrorBoundary.tsx`, message et bouton « Recharger »).

## Blocland (`src/blocland/`)

- `biomes.ts` : les **vingt-huit îles** (nom, matière, classe, module, bloc, créature et ses phrases, Gardien et ses répliques, quêtes) et les **blocs**. La classe d’une île est aussi son **archipel**.
- `exercises/` : le **moteur d’exercice** de Blocland. `types.ts` définit le format d’un exercice ; `index.ts` le catalogue (l’index de tous les exercices, et `loadExercise` qui charge à la demande le contenu d’un exercice JSON) ; `registry.ts` associe chaque type d’exercice à son écran (`QcmItem`, `ChasseSonScreen`, `FilonScreen`, `MotTroueScreen`, `AscensionScreen`, `RimesScreen`, `DicteeItem`, `FamillesScreen`, `EnclosScreen`, `CalculScreen`, `BossScreen`) ; `data/*.json` les exercices écrits à la main ; `maths.ts` et `college.ts` les exercices générés ; `run.ts` la graine de chaque partie. Voir [Format des exercices](exercices.md).
- `engine.ts` : logique pure et testée du jeu : score, étoiles, blocs, XP, répétition espacée, série de régularité et coffres, adaptation du niveau, inventaire, lancement du Bloc-Navire et migration des sauvegardes.
- `ExerciseRunner.tsx` : joue un exercice (consigne écrite et lue, écrans, correction, récompense). `boss.ts` et `BossPage.tsx` : le défi du Gardien, deux manches par quête.
- `world/` : le monde. `map.ts` place les îles (cœur de 16 × 16, terre irrégulière, altitude par classe, relief, paysage) dans quatre bandes, une par archipel ; `archipelago.ts` définit les archipels et leurs ports, les ouvrages (coûts, conditions), les voyages du Bloc-Navire, et calcule ce qui est ouvert ; `harbour.ts` le quai et la place du navire ; `vehicle.ts` les trois étapes du Bloc-Navire (des plans posés sur le quai) ; `plans.ts` et `plans/*.json` décrivent les bâtiments à reconstruire ; `terrain.ts` et `mesher.ts` produisent les cubes d’un archipel ; `daylight.ts` le cycle jour-nuit ; `goals.ts` le prochain objectif et les explications d’île fermée. Trois modules servent toutes les vues du monde, sans dépendre de Three.js (un test le vérifie) : `view.ts` le contrat d’une vue (`WorldViewProps` : ce qu’elle reçoit de `WorldPage` et les gestes qu’elle renvoie), `scene.ts` la simulation (marche du bonhomme, promenade des créatures, temps du voyage, flèches du clavier, ce que fait un toucher sur le sol) et `pixels.ts` les textures pixel 16 × 16 générées par le code.
- `three/` : la vue 3D, en Three.js (`WorldCanvas.tsx`, une scène par archipel ; `textures.ts` fait des textures de `world/pixels.ts` des matériaux ; détection WebGL). Elle dessine ce que calcule `world/scene.ts`.
- `pixel/` : la vue 2D, en Canvas 2D, sans Three.js (un test le vérifie), avec le même contrat (`WorldCanvas2D.tsx`) ; `oblique.ts` la projection oblique, la carte des tuiles, le toucher et le cadrage (calcul pur, testé) ; `draw.ts` les images des faces et les morceaux de terrain (bords, contours, écume, ombres) ; `surface.ts` le sol vu de dessus ; `tiles.ts` les tuiles dessinées pour la 2D ; `props.ts` et `sprites.ts` le décor et les bornes en sprites ; `characters.ts` le bonhomme, les créatures, les panneaux et les repères ; `style.ts` ce que la 2D dessine en plus (chaque étape à part) ; `canvas2d.ts` la détection du Canvas 2D. `useImmersive.ts` choisit la vue selon le réglage et l’appareil (voir le [cadrage du monde](cadrage-monde.md#21-une-vue-2d-oblique)). `WorldPage.tsx` est le monde plein écran ; `IslandSheet.tsx` le panneau d’île (`IslandFold.tsx` ses sections repliables, `GoalLine.tsx` le prochain objectif et sa jauge, calculés par `world/goals.ts`) ; `Inventory.tsx` l’inventaire « Mes blocs » (panneau en 3D, page en vue simple) et `world/uses.ts` sa logique (à quoi sert chaque bloc, lesquels manquent et où les gagner) ; `ShipSection.tsx` et `useVehicleBuilder.ts` le chantier du Bloc-Navire ; `VoyagePanel.tsx` et `VoyagePage.tsx` l’écran du voyage ; `BloclandPage.tsx` et `BiomePage.tsx` la vue simple.
- `Voxel.tsx`, `Creatures.tsx`, `Guardians.tsx`, `Avatar.ts` : créatures, Gardiens et bonhomme en cubes.
- `sound.ts`, `useAmbience.ts` : sons Web Audio générés par le code.

Tout l’état de Blocland est dans `localStorage` sous la clé `dysapps:blocland` ; l’XP alimente aussi les rangs et succès communs.

## Tests

`npm test` lance Vitest (environnement jsdom). Les tests couvrent la logique pure (moteur, progression, réglages, syllabes, générateurs, carte, ouvrages, plans), les données (chaque JSON d’exercice, les phrases d’homophones, les textes de lecture) et les écrans principaux. Les tests de données sont ce qui garantit qu’un item ajouté respecte le format et les règles (un seul trou, réponse présente dans les choix, mot lu à voix haute…).

## Documentation

Le site de documentation est construit par `scripts/docs/build.mjs` à partir de `docs/`. Les pages du contenu pédagogique sont générées par `scripts/docs/generate.mjs`, qui charge les modules du jeu avec Vite et en tire les tableaux. Voir [Contribuer](contribuer.md) et [Déploiement](deploiement.md).
