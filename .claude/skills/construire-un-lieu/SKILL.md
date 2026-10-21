---
name: construire-un-lieu
description: Construire un lieu du monde ouvert d'Archipéo, de la proposition à la pull request vers preview (planche validée, intention du directeur artistique, PlaceArt dans src/game/world/continu/, budget, captures, relectures sur commit figé). À lire avant de construire ou de retoucher un lieu ou un Détour du monde ouvert.
---

# Construire un lieu du monde ouvert

La méthode a été rodée au 5e, du 19 au 20 octobre 2026 ([GD-22](../../../docs/gameplay/propositions/GD-22.md)) : la Montée (#471), le Hameau (#474), les Radeaux et le Creux (#476), la Croisée (#477), les Instants et la Hutte (#478). Le Hameau sert de gabarit : un lieu neuf se fait « comme le Hameau », et l'intention ne dit que ce qui change. Un lieu par lot, une pull request par lieu.

Les fichiers de travail (propositions, prompts, concepts, intention, captures, notes de relecture, patchs) ne vont jamais dans le dépôt : ils vont dans la Bibliothèque du projet, sous `archipeo/univers-challenge/niveaux/<niveau>/monde-ouvert/lot<N>/`.

## 1. Proposer, puis faire valider la planche

1. **La proposition du consultant d'Archipéo** (`lot<N>/<lieu>-proposition.md`, gabarit `lot5/hameau-proposition.md`) : ce que le lieu doit dire en une phrase, la ruine de départ, les étapes et les parties, une trace par partie, l'habitant et sa scénette, le Détour s'il y en a un, et ce que le lieu devient dans Blocland (en général rien ; le `consultant-blocland` n'est sollicité que si un nom de plan commun bouge). Elle part de la fiche du niveau (`docs/univers/archipeo/intentions/`) et des missions de `docs/contenu/<île>.md`.
2. **La relecture du directeur artistique**, qui la valide avec ses corrections, souvent pour plusieurs lieux d'un coup (`da-propositions-<a>-<b>-<c>.md`).
3. **Les concepts** : prompts (`prompts-<lieu>.txt`, puis `-v2`, `-v3`) générés sur le Mac du mainteneur (skill `concepts-niveau`, sur `main`) ; quatre vues de près : la ruine de face et de dos, le lieu restauré de face et de dos. Z-Image ne sait dessiner ni un bâtiment inachevé ni une ruine forte : la ruine se construit d'après la fiche écrite, pas d'après l'image.
4. **La planche validée par le mainteneur** (`concepts/selection-<lieu>-v<n>.jpg`) : c'est la référence du lot. Rien ne se code avant son mot écrit.

### Les règles d'Archipéo, à chaque lieu

- **Une ruine belle et lisible**, jamais un chantier : tout est là, tombé ou cassé ; peu de débris (cinq blocs au plus), rien sur le chemin de marche.
- **La pièce de bronze** que les Ferrailleurs ont prise (la porte du four, le treuil, le cadran…) manque avant comme après : ce n'est jamais une étape. Le bronze ne sert qu'aux ferrures.
- **Aucune figure** : le cœur du lieu est un mécanisme ou un ouvrage. **Rien à lire dans la 3D** : ni lettre, ni chiffre, ni mot, ni graduation ; une enseigne a au plus un pictogramme. Z-Image ajoute souvent des lettres et des symboles : les retirer.
- **Une trace par mission**, posée avec sa partie : un objet du lieu, jamais la notion (un disque en quarts, un histogramme ont été refusés) ; à l'échelle de la caméra du lieu ; lisible par sa forme, jamais par sa couleur seule ; des outils debout, côte à côte, jamais croisés.
- **La lumière** : l'ocre `#E0A84A` seule, fixe, sans clignotement ; une lanterne s'allume à la pose d'une partie, jamais à une réussite (vitre éteinte `#BFC4B8`) ; une seule lanterne allumée dans la ruine, celle de l'habitant.
- **Le mouvement** : la fumée est immobile, distincte du panache du Rafiot par sa forme et sa taille ; une partie se pose d'un coup avec « Réduire les animations ».
- **Les noms** : l'habitant se dit par son métier (« le boulanger », « le tailleur de pierre »), sans prénom ; le guide est une voix, jamais un second modèle en scène ; les noms du contenu (plans, Gardiens, créatures) restent dans `docs/contenu/` et ne s'affichent jamais dans le monde ouvert (le directeur du contenu en décide).

## 2. L'intention du directeur artistique

`lot<N>/intention.md` (gabarit `lot8/intention.md`) :
- ses références : la proposition, la planche et ses vues une à une, la fiche du niveau, le modèle 3D de l'habitant ;
- les décisions du mainteneur tenues (1 600 triangles par lieu, 1 200 en ruine, 175 par Détour ; une trace par mission, posée avec sa partie ; une seule lanterne allumée dans la ruine ; aucune figure, le cœur du lieu est un mécanisme ou un ouvrage) ;
- « ce qui reprend le Hameau tel quel » : la construction par parties sans cubes ni fantômes, la scénette (Kéo à gauche, l'habitant à droite, « Reprendre » chez lui), l'ocre `#E0A84A` seule lumière, les matières des Passeurs ;
- « ce qui change » : la phrase du lieu, le chemin, le motif, la ruine, le tableau des parties et des traces, et ce que les concepts ont de faux à corriger (une silhouette humaine, un dôme blanc lisse, des pierres trop régulières, des lettres).

Le directeur du contenu valide les phrases de pose et la réplique de l'habitant ; aucun nom de plan, de Gardien ni de créature ne s'affiche dans le monde ouvert.

## 3. Construire

Code en anglais, commentaires en français, dans `src/game/world/continu/`, pur (sans Three.js ni React). Copier la forme du lieu fini le plus récent :

- **`<lieu>5e.ts`** : le `PlaceArt` du lieu (`placeArt.ts`) : la ruine et les volumes de chaque étape et rangée (`AddPiece`, `until` pour ce que l'étape remplace), `traceStage`, `traces` (avec leur `row`), `sceneSpot`, `role`, `doorView` (le cap d'arrivée de « Y aller »), `arrivalView` pour un lieu trop haut pour la caméra qui suit (elle recule et lève le regard à la porte ; le Donjon, avec son test de cadre), l'objet des réponses.
- **`<lieu>Surroundings.ts`** : ses abords (1 500 triangles au plus, `SURROUNDINGS_MAX`), inscrits dans `surroundings.ts`.
- **Les registres**, une ligne chacun : `northShore.ts` (`ART`), `construction.ts` (étape des traces), `questionScene.ts`, `questions.ts`, `scenette.ts` (rôle, accueil, site, sol), `plan5e.ts` (`BUILT_PLACES_5E`, seule liste des lieux finis), `ruins5e.ts` (le lieu quitte la ruine générique), `habitants.ts` ; `terrain5e.ts` (`FOREST_KEEP`) si la forêt doit s'écarter du lieu ou de la caméra.
- **Un Détour** : son fichier (`hutte5e.ts`), dans le cadre `DETOURS_5E` de `detours.ts` ; un nouvel identifiant s'ajoute à la fin de `DETOUR_IDS` (et dans `DETOUR_IDS_5E`), pour que les sauvegardes restent lisibles.
- **`<lieu>5e.test.ts`** : les triangles du lieu en ruine et restauré, une trace par partie, rien sur le chemin de marche, le cap de la porte. Les plafonds de budget s'additionnent d'un lot à l'autre (une constante nommée, jamais `83_175 + 1_600`) ; les tests des lieux précédents qui supposaient ce lieu non construit se mettent à jour.
- **Le budget** : `npm run rendu:budget -- --archipel 6e,5e`, dans l'enveloppe du niveau (`OPEN_WORLD_BUDGETS`, `budget.ts` : 118 000 triangles et 22 appels au 5e) ; le 6e ne doit pas bouger. Toute hausse d'enveloppe se décide par le mainteneur seul.
- **Les vérifications** avant de figer : `tsc`, `vitest` (au moins les fichiers touchés), `npm run lint`, `npm run code-mort`, `npm run contenu -- --check`, `npm run pilotage:personnages -- --check`.

Ce que l'artiste technique 3D construit, il le commite et s'arrête (skill `captures`).

## 4. Les captures

En 1024 × 768, horloge pilotée et hasard fixe (`scripts/prise-de-vue.mjs`), sur un état de sauvegarde préparé (le lieu après 0, 1, … n missions). Les vues d'un lieu, rangées dans `lot<N>/captures/` avec un `comparaison.md` qui dit ce que montre chaque image :
- `00` la planche validée, pour comparer ;
- `01` le cap de « Y aller » et la ruine de face ; `02`, `03` après chaque partie ; `04` restauré de face ; `05` de dos et de trois-quarts, en ruine et restauré (la caméra tourne : le décor est fini tout autour) ;
- `06` la scénette avec l'habitant, et en 390 × 844 avec OpenDyslexic 32 ;
- `07` le Détour, à l'arrivée et vu du chemin ; `08` la Carte, en ruine et restaurée.

Elles se publient sur la branche `captures`, dans `gd22-lot<N>-<niveau>/archipeo/`, liées dans la pull request. Une retouche refait seulement les vues qui changent (`captures-v2/`).

## 5. Les relectures, sur un commit figé

Le fil pousse le commit et écrit `lot<N>/a-relire.md` : le commit, la base, la planche, l'intention, les captures, le budget, les fichiers neufs et les écarts connus. Les relecteurs (`.claude/agents/`) lisent `git show <commit>`, jamais l'arbre de travail :
- `directeur-artistique` et `consultant-archipeo` sur la planche et les captures ;
- `referent-dys`, `consultant-ux-ui`, `directeur-contenu-pedagogique` (répliques, phrases de pose, noms affichés) ;
- `expert-frontend` sur le code.

Ce que les premières relectures ont relevé à chaque lieu, à vérifier avant de figer :
- la vue d'arrivée depuis le chemin (le cœur du lieu au centre, l'habitant visible, un repère du niveau au-delà, comme l'aiguille de la Montée) ;
- l'étiquette du lieu, dans le monde et sur la Carte, qui ne couvre pas le cœur du lieu ;
- la zone des réponses de la scénette, à 16 px du bord au moins, des cibles de 48 px, un ordre des réponses fixe, la réponse choisie marquée par sa forme ;
- rien à lire dans la 3D, et les traces qui ne disent pas la notion.

Les « À ajuster » se rassemblent en une retouche numérotée (`retouche-<n>.md`, gabarit `lot5/retouche-1.md`), confiée à un artiste neuf avec un brief court ; la seconde passe ne relit que ce qui a changé, chez le relecteur qui l'a demandé. Un désaccord entre relecteurs (le nom d'un Détour, par exemple) va au mainteneur, sans changer le choix en attendant.

## 6. La pull request vers preview

- Branche du fil, à jour de `preview`, puis une seule pull request vers `preview`, fusionnée par squash sur le « go » écrit du mainteneur sur cette pull request.
- La description, comme #478 : avant, après, comment (les fichiers et les registres) ; le budget (scénette ouverte, hors scénette, Carte, comparés au lot précédent) ; les verdicts de chaque relecteur et ce qui en a été fait ; le lien des captures ; les suites connues ; les vérifications.
- La documentation dans la même pull request : `docs/rendu/style.md` (la section du lieu), `docs/architecture/monde.md` (un paragraphe), la fiche `docs/gameplay/propositions/GD-22.md`, et la ligne du lot dans `docs/pilotage/chantiers.md`.

**Plusieurs lieux en parallèle** : les lieux touchent les mêmes registres et les mêmes tests de plafond. L'ordre des pull requests se fixe d'avance ; un lieu construit avant la fusion du précédent garde ses commits en patchs (`lot<N>/patchs/`, `git format-patch`), puis se remet sur `preview` une fois l'autre fusionné, en ajoutant les plafonds et en relançant les tests des deux lieux. Les relectures déjà faites restent valables : seule la remise sur `preview` se dit dans la pull request.
