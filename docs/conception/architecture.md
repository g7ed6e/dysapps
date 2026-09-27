# Architecture

DysApps est une application web statique : React 19, TypeScript, Vite, Three.js pour la 3D, Vitest pour les tests. Aucun serveur, aucune API : tout tourne dans le navigateur et tout est enregistré dans le stockage local.

## Arborescence

```
src/
  apps/          quêtes du portail (un dossier par quête) + registry.ts (catalogue)
  blocland/      l'aventure : biomes, moteur, exercices, monde 3D, plans, Gardiens
  components/    Layout (barre du haut, transitions ; pas d’onglets), FocusMode (mode concentration, menu pause), Loading, TitleScreen, QuizSession, QuestMenu, SpeakButton, Syllabified, XpBar, RecordTag, useSheetClearance, useAnswerKeys…
  core/          réglages, synthèse vocale, progression et gamification, stockage, syllabes
  pages/         accueil, matière, quête, réglages, succès
  programme/     le référentiel des programmes officiels (cycles 3 et 4 : français, maths, anglais), les exclusions
                 motivées, la liste des mots-outils ; sert aux tests et à la documentation, pas à l'application
  styles/        thèmes, styles globaux, textures pixel générées
docs/            cette documentation (Markdown) ; docs/.vitepress/ : configuration et thème VitePress ; docs/_theme/ : sommaire ;
                 docs/_journal/ : fragments du journal des versions
design/          le dossier de game design et la planche d’Archipéo, la cible de la migration (voir cadrage-archipeo.md) ;
                 référence de conception, ni publiée ni embarquée dans l’application
.claude/agents/  les trois agents partagés : directeur-contenu-pedagogique, directeur-artistique et artiste-technique-3d
                 (voir contribuer.md)
scripts/         calcul de la version depuis git, index des exercices au build (exerciseMeta.mjs),
                 construction et vérification de la documentation (docs/), extraction du texte d'un programme
                 officiel (programme/extract.mjs, écrit dans .programme/, ignoré par git)
public/          icônes, police Luciole
```

## Le portail

- `src/apps/registry.ts` : le **catalogue des quêtes** (identifiant, matière, titre, description, icône, composant chargé à la demande). Les pages Français, Maths et Anglais le lisent (`SUBJECTS` : la liste des matières), puis ajoutent les îles de Blocland de la matière.
- `src/components/QuizSession.tsx` : le **moteur d’exercice du portail**, commun à toutes les quêtes. Il reçoit une fonction `makeQuestions` rappelée à chaque séance (ce qui permet de générer des questions aléatoires) et gère consigne lue, réponses, joker, correction dans un bandeau fixe (`useSheetClearance` fait défiler la question juste au-dessus, pour qu'il ne la cache pas ; Blocland s'en sert aussi), XP et bilan. En fin de quête, il donne aussi les blocs de l’école du village (`completePortal` du contexte Blocland, s’il y en a un).
- `src/components/QuestMenu.tsx` : le menu des quêtes d’une activité (cartes numérotées avec le meilleur score), puis la quête choisie.
- Chaque quête a ses données ou ses générateurs : `homophones/sets.json`, `lecture/texts.json`, `tables/generators.tsx`, `fractions/generators.tsx`, `decimaux/generators.tsx`.

## Le socle commun (`src/core/`)

- `settings.ts` : les réglages, leurs bornes (18 px et 1,5 d’interlignage au minimum) et leur application au document par variables CSS et attribut de thème.
- `speech.ts` : la synthèse vocale du navigateur, vitesse réglable, sans serveur ; `unlockSpeech` la débloque au toucher de l’écran titre (`components/TitleScreen.tsx`).
- `lastPlace.ts` : la dernière quête ouverte, pour « Continuer » (écran titre et menu).
- `paths.ts` : les adresses partagées (`MENU_PATH`, le menu principal). L’accueil (`/`, `StartEntry` de `App.tsx`) mène au village (`/aventure`) quand le réglage « Au démarrage » le demande et que l’appareil sait dessiner le monde ; sinon, il affiche le menu (`pages/HomePage.tsx`, aussi à `/menu`).
- `stars.ts` : les étoiles d’un score, communes au portail et à Blocland.
- `haptics.ts` : la vibration courte (bonne réponse, bloc posé), selon le réglage.
- `syllables.ts` : le découpage syllabique par règles.
- `progress.ts` : XP, niveaux, rangs, succès, et les évènements (`recordAnswer`, `recordSession`, `recordPlan`, `recordBoss`). Logique pure, testée.
- `storage.ts` : lecture et écriture dans `localStorage`, avec correction des données lues (champs manquants, valeurs hors bornes).
- `appUpdate.ts` : la mise à jour de la PWA (bande « Mettre à jour », bouton dans les réglages).
- `useLoaded.ts` : attend un contenu chargé à la demande (un exercice, un défi de Gardien) ; un échec remonte à la limite d’erreur de la page (`components/ErrorBoundary.tsx`, message et bouton « Recharger »).

## Blocland (`src/blocland/`)

- `biomes.ts` : les **vingt-huit îles** (nom, matière, classe, module, bloc, créature et ses phrases, Gardien et ses répliques, quêtes) et les **blocs**. La classe d’une île est aussi son **archipel**. Chaque quête cite dans `programme` les compétences du programme officiel qu’elle travaille (identifiants de `src/programme/`, vérifiés par le compilateur) ; les quêtes du portail font de même dans `src/apps/registry.ts`.
- `exercises/` : le **moteur d’exercice** de Blocland. `types.ts` définit le format d’un exercice ; `index.ts` le catalogue (l’index de tous les exercices, et `loadExercise` qui charge à la demande le contenu d’un exercice JSON) ; `registry.ts` associe chaque type d’exercice à son écran (`QcmItem`, `ChasseSonScreen`, `FilonScreen`, `MotTroueScreen`, `AscensionScreen`, `RimesScreen`, `DicteeItem`, `FamillesScreen`, `EnclosScreen`, `CalculScreen`, `BossScreen`) ; `data/*.json` les exercices écrits à la main ; `maths.ts` et `college.ts` les exercices générés ; `run.ts` la graine de chaque partie. Voir [Format des exercices](exercices.md).
- `engine.ts` : logique pure et testée du jeu : score, étoiles, blocs, XP, répétition espacée, série de régularité et coffres, adaptation du niveau, inventaire, lancement du Bloc-Navire et migration des sauvegardes. `completePortalQuest` : les blocs d’une quête du portail, gagnés à l’école du village.
- `ExerciseRunner.tsx` : joue un exercice (consigne écrite et lue, écrans, correction, récompense). `boss.ts` et `BossPage.tsx` : le défi du Gardien, deux manches par quête. `review.ts` : les révisions du jour (items de la répétition espacée dus aujourd’hui) : quelles quêtes les proposent, quels items passent en tête de la partie ; `components/AppBadge.tsx` en fait la pastille de l’icône.
- `world/` : le monde. `map.ts` place les îles (cœur de 16 × 16, terre irrégulière, altitude par classe, relief, paysage) dans quatre bandes, une par archipel ; `archipelago.ts` définit les archipels, leurs ports et leur île de l’école, les ouvrages (coûts, conditions), les voyages du Bloc-Navire, et calcule ce qui est ouvert ; `harbour.ts` le quai et la place du navire ; `vehicle.ts` les trois étapes du Bloc-Navire (des plans posés sur le quai) ; `plans.ts` et `plans/*.json` décrivent les bâtiments à reconstruire (la fiche de chaque plan : nom, phrase, XP, coffre) ; `architect.ts` les dessine (la forme de chaque île : maison, tour, dôme, échoppe, hutte, kiosque ; les murs, le toit, la cour) ; `plansV1.ts` garde l’ancien dessin pour migrer les sauvegardes (`sanitizeState`) ; `monuments.ts` les monuments, deux par archipel (des plans `zone: 'monument'` dessinés par le code, chacun sur son îlot au large) ; `terrain.ts` et `mesher.ts` produisent les cubes d’un archipel (`VILLAGE_PLACES`, `placeSpot`, `schoolModel` et `trophyModel` : l’école du village et la salle des trophées, leurs cubes marqués `place` pour qu’on les touche ; `monumentIslets` les îlots des monuments, marqués `monument:<id>`) ; `daylight.ts` le cycle jour-nuit ; `goals.ts` le prochain objectif et les explications d’île fermée. Quatre modules servent toutes les vues du monde, sans dépendre de Three.js (un test le vérifie) : `view.ts` le contrat d’une vue (`WorldViewProps` : ce qu’elle reçoit de `WorldPage` et les gestes qu’elle renvoie), `scene.ts` la simulation (marche du bonhomme, promenade des créatures, temps du voyage, flèches du clavier, ce que fait un toucher sur le sol), `paths.ts` les chemins à pied sur les îles (grille de marche tirée des cubes, plus court chemin qui contourne le décor, redressé en lignes droites ; `avatarRoute` de `terrain.ts` s’en sert entre deux ouvrages) et `pixels.ts` les textures pixel 16 × 16 générées par le code.
- `three/` : la vue 3D, en Three.js (`WorldCanvas.tsx`, une scène par archipel ; `textures.ts` fait des textures de `world/pixels.ts` des matériaux ; détection WebGL). Elle dessine ce que calcule `world/scene.ts`.
- `pixel/` : la vue 2D, en Canvas 2D, sans Three.js (un test le vérifie), avec le même contrat (`WorldCanvas2D.tsx`) ; `oblique.ts` la projection oblique, la carte des tuiles, le toucher et le cadrage (calcul pur, testé) ; `draw.ts` les images des faces et les morceaux de terrain (bords, contours, écume, ombres) ; `surface.ts` le sol vu de dessus ; `tiles.ts` les tuiles dessinées pour la 2D ; `props.ts` et `sprites.ts` le décor et les bornes en sprites ; `characters.ts` le bonhomme, les créatures, les panneaux et les repères ; `style.ts` ce que la 2D dessine en plus (chaque étape à part) ; `canvas2d.ts` la détection du Canvas 2D. `useImmersive.ts` choisit la vue selon le réglage et l’appareil (voir le [cadrage de Blocland](cadrage-blocland.md#la-vue-2d-oblique)). `WorldPage.tsx` est le monde plein écran ; `IslandSheet.tsx` le panneau d’île (`IslandFold.tsx` ses sections repliables, `GoalLine.tsx` le prochain objectif et sa jauge, calculés par `world/goals.ts`) ; `School.tsx` l’école du village (panneau en 3D et en 2D, page en vue simple : ses trois portes, et derrière chacune `components/SubjectApps.tsx`, les cartes des quêtes du portail d’une matière, les mêmes que sur la page matière) ; `TrophySheet.tsx` et `trophies.ts` la salle des trophées (le profil de `pages/ProgressPage.tsx`, `ProgressBody`, en panneau ; un bloc par succès gagné, posé par `terrain.ts`) ; `ArchipelSwitcher.tsx` le sélecteur d’archipel (sous le bouton Menu ; les voyages déjà faits sont un fondu court, `hop` de `WorldPage.tsx`) ; `MenuSheet.tsx` le menu du village (bouton ⏸, `#/aventure/menu` ; `useBackOpensMenu.ts` : le bouton retour l’ouvre) ; `Inventory.tsx` l’inventaire « Mes blocs » (panneau en 3D, page en vue simple) et `world/uses.ts` sa logique (à quoi sert chaque bloc, lesquels manquent et où les gagner) ; `ShipSection.tsx` et `useVehicleBuilder.ts` le chantier du Bloc-Navire ; `Monuments.tsx` et `useMonumentBuilder.ts` les monuments (leur liste et leur panneau en 3D et en 2D, des pages en vue simple ; la caméra cadre leur îlot par `WorldFocus.spot`) ; `VoyagePanel.tsx` et `VoyagePage.tsx` l’écran du voyage ; `BloclandPage.tsx` et `BiomePage.tsx` la vue simple.
- `Voxel.tsx`, `Creatures.tsx`, `Guardians.tsx`, `Avatar.ts` : créatures, Gardiens et bonhomme en cubes.
- `sound.ts`, `useAmbience.ts` : sons Web Audio générés par le code.

Tout l’état de Blocland est dans `localStorage` sous la clé `dysapps:blocland` ; l’XP alimente aussi les rangs et succès communs.

## Tests

`npm test` lance Vitest (environnement jsdom). Les tests couvrent la logique pure (moteur, progression, réglages, syllabes, générateurs, carte, ouvrages, plans), les données (chaque JSON d’exercice, les phrases d’homophones, les textes de lecture) et les écrans principaux. Les tests de données sont ce qui garantit qu’un item ajouté respecte le format et les règles (un seul trou, réponse présente dans les choix, mot lu à voix haute…). Les tests du programme (`src/programme/programme.test.ts`, `src/blocland/programme.test.ts`) vérifient le référentiel lui-même, puis que chaque quête cite des compétences existantes de sa matière et de son cycle, et que chaque compétence est travaillée par une quête ou exclue avec un motif, jamais les deux : la couverture du programme ne régresse pas sans qu’on le dise. Le Coffre à mots ne dicte que des mots de la liste officielle des mots-outils.

## Documentation

Le site de documentation est construit par VitePress à partir de `docs/` : `docs/.vitepress/config.mts` appelle `scripts/docs/prepare.mjs`, qui assemble les pages écrites à la main, les pages du contenu pédagogique générées par `scripts/docs/generate.mjs` (il charge les modules du jeu avec Vite et en tire les tableaux, dont la page Programmes officiels et la ligne « Programme officiel » sous chaque quête) et le journal des versions assemblé par `scripts/docs/journal.mjs` ; `scripts/docs/check.mjs` vérifie qu’une pull request ajoute un fragment de journal. Les captures d’écran du manuel (`docs/_captures/`) sont prises par `scripts/docs/captures.mjs` (`npm run docs:captures`), qui lance l’application et la joue dans Chromium avec Playwright. Voir [Contribuer](contribuer.md), [Le référentiel des programmes](programmes.md) et [Déploiement](deploiement.md).
