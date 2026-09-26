# Architecture

DysApps est une application web statique : React 19, TypeScript, Vite, Three.js pour la 3D, Vitest pour les tests. Aucun serveur, aucune API : tout tourne dans le navigateur et tout est enregistré dans le stockage local.

## Arborescence

```
src/
  apps/          quêtes du portail (un dossier par quête) + registry.ts (catalogue)
  blocland/      l'aventure : biomes, moteur, exercices, monde 3D, plans, Gardiens
  components/    Layout, QuizSession, QuestMenu, SpeakButton, Syllabified, XpBar…
  core/          réglages, synthèse vocale, progression et gamification, stockage, syllabes
  pages/         accueil, matière, quête, réglages, succès
  styles/        thèmes, styles globaux, textures pixel générées
docs/            cette documentation (Markdown) ; docs/.vitepress/ : configuration et thème VitePress ; docs/_theme/ : sommaire
scripts/         vérification de version, construction de la documentation
public/          icônes, police Luciole
```

## Le portail

- `src/apps/registry.ts` : le **catalogue des quêtes** (identifiant, matière, titre, description, icône, composant chargé à la demande). Les pages Français et Maths le lisent, puis ajoutent les îles de Blocland de la matière.
- `src/components/QuizSession.tsx` : le **moteur d’exercice du portail**, commun à toutes les quêtes. Il reçoit une fonction `makeQuestions` rappelée à chaque séance (ce qui permet de générer des questions aléatoires) et gère consigne lue, réponses, joker, correction dans un bandeau fixe, XP et bilan.
- `src/components/QuestMenu.tsx` : le menu des quêtes d’une activité (cartes numérotées avec le meilleur score), puis la quête choisie.
- Chaque quête a ses données ou ses générateurs : `homophones/sets.json`, `lecture/texts.json`, `tables/generators.tsx`, `fractions/generators.tsx`, `decimaux/generators.tsx`.

## Le socle commun (`src/core/`)

- `settings.ts` : les réglages, leurs bornes (18 px et 1,5 d’interlignage au minimum) et leur application au document par variables CSS et attribut de thème.
- `speech.ts` : la synthèse vocale du navigateur, vitesse réglable, sans serveur.
- `syllables.ts` : le découpage syllabique par règles.
- `progress.ts` : XP, niveaux, rangs, succès, et les évènements (`recordAnswer`, `recordSession`, `recordPlan`, `recordBoss`). Logique pure, testée.
- `storage.ts` : lecture et écriture dans `localStorage`, avec correction des données lues (champs manquants, valeurs hors bornes).
- `appUpdate.ts` : la mise à jour de la PWA (bande « Mettre à jour », bouton dans les réglages).

## Blocland (`src/blocland/`)

- `biomes.ts` : les **vingt îles** (nom, matière, classe, module, bloc, créature et ses phrases, Gardien et ses répliques, quêtes) et les **blocs**. La classe d’une île est aussi son **archipel**.
- `exercises/` : le **moteur d’exercice** de Blocland. `types.ts` définit le format d’un exercice ; `index.ts` le catalogue ; `registry.ts` associe chaque type d’exercice à son écran (`QcmItem`, `ChasseSonScreen`, `FilonScreen`, `MotTroueScreen`, `AscensionScreen`, `RimesScreen`, `DicteeItem`, `FamillesScreen`, `EnclosScreen`, `CalculScreen`, `BossScreen`) ; `data/*.json` les exercices écrits à la main ; `maths.ts` et `college.ts` les exercices générés ; `run.ts` la graine de chaque partie. Voir [Format des exercices](exercices.md).
- `engine.ts` : logique pure et testée du jeu : score, étoiles, blocs, XP, répétition espacée, série de régularité et coffres, adaptation du niveau, inventaire, lancement du Bloc-Navire et migration des sauvegardes.
- `ExerciseRunner.tsx` : joue un exercice (créature qui lit la consigne, écrans, correction, récompense). `boss.ts` et `BossPage.tsx` : le défi du Gardien, deux manches par quête.
- `world/` : le monde. `map.ts` place les îles (cœur de 16 × 16, terre irrégulière, altitude par classe, relief, paysage) dans quatre bandes, une par archipel ; `archipelago.ts` définit les archipels et leurs ports, les ouvrages (coûts, conditions), les voyages du Bloc-Navire, et calcule ce qui est ouvert ; `harbour.ts` le quai et la place du navire ; `vehicle.ts` les trois étapes du Bloc-Navire (des plans posés sur le quai) ; `plans.ts` et `plans/*.json` décrivent les bâtiments à reconstruire ; `terrain.ts` et `mesher.ts` produisent les cubes d’un archipel ; `daylight.ts` le cycle jour-nuit ; `goals.ts` le prochain objectif et les explications d’île fermée.
- `three/` : le rendu Three.js (`WorldCanvas.tsx`, une scène par archipel, textures pixel générées par le code, détection WebGL). `WorldPage.tsx` est le monde plein écran ; `IslandSheet.tsx` le panneau d’île ; `ShipSection.tsx` et `useVehicleBuilder.ts` le chantier du Bloc-Navire ; `VoyagePanel.tsx` et `VoyagePage.tsx` l’écran du voyage ; `BloclandPage.tsx` et `BiomePage.tsx` la vue simple.
- `Voxel.tsx`, `Creatures.tsx`, `Guardians.tsx`, `Avatar.ts` : créatures, Gardiens et bonhomme en cubes.
- `sound.ts`, `useAmbience.ts` : sons Web Audio générés par le code.

Tout l’état de Blocland est dans `localStorage` sous la clé `dysapps:blocland` ; l’XP alimente aussi les rangs et succès communs.

## Tests

`npm test` lance Vitest (environnement jsdom). Les tests couvrent la logique pure (moteur, progression, réglages, syllabes, générateurs, carte, ouvrages, plans), les données (chaque JSON d’exercice, les phrases d’homophones, les textes de lecture) et les écrans principaux. Les tests de données sont ce qui garantit qu’un item ajouté respecte le format et les règles (un seul trou, réponse présente dans les choix, mot lu à voix haute…).

## Documentation

Le site de documentation est construit par `scripts/docs/build.mjs` à partir de `docs/`. Les pages du contenu pédagogique sont générées par `scripts/docs/generate.mjs`, qui charge les modules du jeu avec Vite et en tire les tableaux. Voir [Contribuer](contribuer.md) et [Déploiement](deploiement.md).
