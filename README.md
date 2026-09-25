# DysApps

Applications d’entraînement pour les **élèves dys du collège** (dyslexie, dysorthographie, dyscalculie), utilisables en autonomie sur tablette, téléphone ou ordinateur.

Site en ligne : https://g7ed6e.github.io/dysapps/

## Ce que contient le socle

- **Style « monde en blocs »** sur toute l’interface : fond crème `#FBF6EA` à grain pixel très discret, barre du haut en terre et herbe, boutons de pierre (et d’herbe pour l’action principale) à biseau pixel, panneaux à coins carrés et biseau, bandeaux texturés (herbe, planches, pierre, sable, or) en tête des cartes, jauge d’XP segmentée, écusson de rang pixel (contour crénelé, minerai du rang à l’intérieur : cuivre, fer, or, platine, diamant, légende). L’icône de l’appli (écran d’accueil, PWA) est un bloc d’herbe isométrique en pixels sur fond de ciel, générée par un script comme les textures. Les textures (`src/styles/textures/`, PNG 16 × 16 générés par le code, jamais empruntés) ne sont jamais placées derrière du texte : le texte à lire reste sur un fond uni. Les thèmes Clair et Contraste élevé restent plats (sans texture ni biseau). Icônes Lucide. La police « affiche » (Archivo Black) ne sert qu’aux titres courts, la police pixel (Silkscreen) qu’au logo et aux compteurs : le texte à lire reste dans la police dys choisie.
- **Aventure Blocland** : le village est en ruine, l’élève est le bâtisseur. Cinq biomes = cinq modules (Forêt des sons, Mine des lettres, Carrière des mots, Ferme des accords, Tour du lecteur), chacun avec sa créature originale qui donne les quêtes (Mousso le golem de mousse, Tunel la taupe, Rouxel le renard, Bloquette la vache, Grimoire le hibou) et son type de bloc. Univers et créatures sont dessinés en cubes (`src/blocland/Voxel.tsx`).
- **Portail** : accueil par matière (Français, Maths) et catalogue des quêtes.
- **Réglages d’affichage** : police (Luciole, OpenDyslexic, Atkinson Hyperlegible, Arial), taille (jamais moins de 18 px), interlignage (jamais moins de 1,5), espacement des lettres et des mots, thèmes (crème, nuit, clair, contraste élevé), réduction des animations.
- **Syllabes en couleurs alternées** (activable) : découpage écrit par règles (`src/core/syllables.ts`, vérifié sur une quarantaine de mots), appliqué aux textes de lecture, aux consignes et aux messages des créatures.
- **Lecture vocale** : les consignes sont lues à voix haute dès qu’elles apparaissent (désactivable) et relançables avec le bouton 🔊 ; synthèse vocale du navigateur, sans serveur, vitesse réglable.
- **Gamification** : XP, niveaux et rangs (Bronze I → Diamant III, puis Légende), combos, 12 succès, et des messages façon jeu vidéo (« BIEN VU ! », « COMBO x5 », « QUÊTE TERMINÉE »).
- **Pas de stress** : pas de chronomètre, un joker (indice) disponible avant de répondre ou après une erreur, et un point d’effort même quand la réponse est fausse.
- **Moteur d’exercices** `QuizSession`, réutilisable par toutes les activités.
- **Progression enregistrée sur l’appareil** (`localStorage`) : pas de compte, pas de serveur, aucune donnée ne quitte l’appareil.
- **PWA** : l’application s’installe sur l’écran d’accueil et fonctionne hors ligne après la première visite.

## Quêtes disponibles

- **Homophones** (Français) : 13 paires réparties en 3 niveaux — Les bases : a/à, et/est, son/sont, on/ont ; Confirmé : ces/ses, ou/où, ce/se, la/là/l’a ; Expert : leur/leurs, quand/quant/qu’en, peu/peut/peux, -é/-er, c’est/s’est. Quêtes de 10 phrases par niveau ou entraînement ciblé sur une paire. Le joker donne l’astuce de remplacement (« remplace par *avait* »), la correction rappelle la règle. Les phrases sont dans `src/apps/homophones/sets.json` (vérifiées par les tests : un seul trou, jamais en début de phrase, chaque réponse travaillée).

- **Tables & calcul mental** (Maths) : 6 quêtes de 10 calculs générés au hasard — tables faciles (× 2, 3, 4, 5, 10), tables costaudes (× 6 à 9), divisions, compléments à 10 et à 100, doubles et moitiés, × et ÷ par 10, 100, 1 000 — et la révision d’une table complète. 4 réponses rangées dans l’ordre croissant, avec des pièges tirés des erreurs fréquentes (oubli de retenue, table voisine…). Le joker donne une astuce et une aide visuelle : grille de points groupés par 5, boîte de 10, droite par bonds ou tableau de numération. Les consignes sont lues « 7 fois 8 » et non « 7 × 8 ».

- **Fractions** (Maths) : 5 quêtes de 8 questions générées — lire une fraction (barres et disques), comparer (même dénominateur, même numérateur, fractions égales), fractions égales, fraction d’une quantité, repérage sur la droite graduée. Fractions écrites en colonne et lues en toutes lettres (« 3 quarts »). Le joker les dessine : barres alignées, groupes de points.

- **Nombres décimaux** (Maths) : 6 quêtes de 8 questions générées — lire un décimal (chiffre des dixièmes, centièmes…), comparer (piège « 3,45 > 3,5 »), droite graduée au dixième, fractions décimales, × et ÷ par 10, 100, 1 000, compléter à 1. Calculs en millièmes entiers (aucune erreur d’arrondi). Le joker ouvre le tableau de numération avec la virgule marquée et des zéros grisés pour aligner.

- **Lecture** (Français) : 5 textes du domaine public — *Le Corbeau et le Renard*, *La Cigale et la Fourmi*, *Le Loup et l’Agneau* (La Fontaine, texte intégral), *La chèvre de monsieur Seguin* (d’après Daudet) et *Le pari de Phileas Fogg* (d’après Jules Verne), textes adaptés. Une ligne par vers ou par phrase, couleurs alternées, lecture à voix haute qui surligne la ligne lue (ou une seule ligne au toucher), mots difficiles expliqués, puis 5 questions de compréhension. Le joker cite le passage à relire ; le texte reste consultable pendant les questions. Textes et questions dans `src/apps/lecture/texts.json`.

## Moteur d’exercice Blocland

- Un exercice = un fichier JSON dans `src/blocland/exercises/data/` (format du brief : `instruction`, `items`, `feedback` avec `{word}`/`{heard}`/`{answer}`, `reward`, `adaptive`), référencé dans `src/blocland/exercises/index.ts`. Le champ `type` choisit le composant d’item (`src/blocland/exercises/registry.ts`) ; le type générique `qcm` est fourni.
- `ExerciseRunner` : la créature lit la consigne, un item à la fois, feedback immédiat jamais punitif (bonne réponse + explication d’une ligne) dans le bandeau fixe, puis écran de récompense.
- `engine.ts` (logique pure, testée) : score (1 point du premier coup, ½ avec aide ou après erreur), **étoiles** (1 = terminé, 2 = ≥ 70 %, 3 = ≥ 90 %, la meilleure compte), **blocs** proportionnels au score (jamais 0 dès une bonne réponse), **XP** à chaque exercice terminé (+50 % sans aide ni erreur), **répétition espacée** des items ratés à J+1, J+3, J+7, J+15 (sortie après 3 réussites d’affilée), **streak** quotidien qui se fissure après un jour manqué (réparable le lendemain) avec un coffre de 6 blocs tous les 3 jours, **adaptation** du niveau par type d’exercice (monte après 2 sessions ≥ `promoteAt`, descend après 2 sessions ≤ `demoteAt`, jamais affiché comme une baisse).
- Sessions courtes : après 3 exercices (ou 10 minutes), l’app propose d’arrêter.
- Tout est enregistré sur l’appareil (`localStorage`, clé `dysapps:blocland`), et l’XP alimente aussi les rangs et succès communs à toute l’app.

## Exercices des biomes

| Biome | Exercice | Contenu | Adaptation dys |
|---|---|---|---|
| Forêt des sons | **Chasse au son** | 6 sons ([an], [on], [oi] ; [in], [ch]/[j], [s]/[z]), 12 mots avec pictogramme par son, 4 par écran | mots lus à voix haute, correction « dans *bonbon* on entend [on] » |
| Forêt des sons | Abattage syllabique | compter les syllabes (QCM d’attente) | |
| Mine des lettres | **Filon** | cibles b, d, p, q parmi les lettres miroirs | vitesse selon le niveau, ne monte qu’après 90 % ; « Plus lent » ; avec « réduire les animations », le bloc attend |
| Carrière des mots | **Mot troué** | 2 niveaux × 10 mots, 3 blocs dont un piège phonétiquement plausible | mot lu à voix haute, correction lettre par lettre |
| Ferme des accords | **Tri des graines** | a/à, et/est, on/ont, son/sont, ce/se (phrases de la quête Homophones) | astuce de substitution après l’erreur |
| Tour du lecteur | **Ascension** | 3 textes originaux de 70–80 mots en 4 paragraphes | mode manuel, un étage par paragraphe, temps discret comparé aux lectures précédentes |

Les biomes s’ouvrent dans l’ordre : une étoile dans le biome précédent débloque le suivant. À niveau égal, l’exercice le moins joué est proposé.

## Chantier (construction)

- **Le village** : chaque île a une **zone libre** de 6 × 4 cases (le tapis jaune, à l'avant de l'île) où l'on pose ce que l'on veut, jusqu'à 6 blocs de haut, dans n'importe quel ordre : rien ne tombe, rien ne casse. On choisit l'île avec les boutons (une île verrouillée n'est pas constructible), un type de bloc dans l'inventaire, puis **Poser** ou **Retirer**.
- **En 3D** : on touche la face d'un bloc (ou du sol) pour poser à côté, un bloc posé pour le retirer ; la case visée est encadrée à la souris. Tout ce qui est hors du tapis est refusé avec un message clair ; le bouton « Tout démonter sur cette île » rend les blocs à l'inventaire.
- **Vue simple** (sans WebGL, ou « Vues en 3D » désactivé) : la zone libre en grille isométrique cliquable et accessible au clavier (pose au sommet de la colonne, retrait du bloc du dessus), même inventaire, mêmes messages.
- **Les plans** (`src/blocland/world/plans/*.json`, cadrage dans `docs/cadrage-village.md`) : chaque île a un bâtiment en ruine à reconstruire (la cabane de Mousso, la forge de Tunel, le four de Rouxel, l'étable de Bloquette, le phare de Grimoire), dessiné en **fantômes bleutés** dans le monde. On touche un fantôme pour y poser le bloc attendu (le type est imposé par le plan, dans n'importe quel ordre), ou le bouton « Poser le bloc suivant » (vue simple comprise). Le panneau du plan montre l'avancement et les blocs qu'il manque avec le biome où les gagner. Plan terminé : phrase de la créature (lue à voix haute), coffre de blocs, XP, succès « Bâtisseur·se » puis « Architecte ».
- **Sons** (Web Audio, générés par le code, aucun fichier) : un « toc » à la pose, un « pop » au retrait, un refus doux ; jamais pendant la lecture à voix haute. Réglage « Sons dans le village » et bouton « Couper les sons » dans le chantier.
- **Ancien chantier** (grille 8 × 8 des versions précédentes) : à la première ouverture, ses blocs reviennent dans l'inventaire.
- **Textures pixel** : chaque type de bloc a une texture 16 × 16 générée par le code (herbe sur terre, pierre mouchetée, planches, sable, verre, or, cristal, feuilles, tronc), sans lissage ; ciel bleu et nuages en cubes. Aucune image ni texture empruntée à un jeu existant.

## Police Luciole

Luciole (CC BY 4.0) n’est pas distribuée sur npm. Déposez `Luciole-Regular.woff2` et `Luciole-Bold.woff2` dans `public/fonts/luciole/` (voir le README de ce dossier) : l’option s’active dans les réglages, et vous pouvez la mettre par défaut dans `src/core/settings.ts`.

## Développer

```bash
npm install
npm run dev        # serveur local : http://localhost:5173/dysapps/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
```

## Ajouter une activité

1. Créer un dossier `src/apps/<id>/` avec un composant par défaut, par exemple :

   ```tsx
   import { QuizSession, type Question } from '../../components/QuizSession';

   function makeQuestions(): Question[] {
     return [
       { id: 'q1', prompt: 'Complète : « Ils … partis. »', choices: ['sont', 'son'], answer: 'sont',
         hint: 'Remplace par « étaient ».', explanation: '« Ils étaient partis » : verbe être.' },
     ];
   }

   export default function MonApp() {
     return <QuizSession appId="<id>" makeQuestions={makeQuestions} />;
   }
   ```

2. Dans `src/apps/registry.ts`, passer l’activité à `status: 'disponible'` et ajouter
   `component: lazy(() => import('./<id>/MonApp'))`.

`makeQuestions` est rappelée à chaque nouvelle séance, ce qui permet de générer des questions aléatoires.

## Déploiement

Le workflow `.github/workflows/deploy.yml` lance les tests et le build à chaque push et à chaque pull request, puis publie sur GitHub Pages à chaque push sur `main`.

À faire une seule fois : dans **Settings → Pages** du dépôt, choisir **Source : GitHub Actions**.

## Sécurité

- **Pipeline** : aucune permission par défaut ; seul le job `deploy`, qui n’exécute pas de code du dépôt, peut publier sur Pages. Actions épinglées par SHA (mises à jour par Dependabot), `persist-credentials: false`, pas de cache partagé, `npm ci --ignore-scripts` et vérification des signatures npm (`npm audit signatures`).
- **Site** : Content-Security-Policy stricte injectée au build (aucune ressource externe), `referrer` désactivé, aucune donnée envoyée hors de l’appareil.
- Les scripts d’installation npm sont aussi désactivés en local (`.npmrc`).

## Arborescence

```
src/
  apps/          activités (une par dossier) + registry.ts (catalogue)
  components/    Layout, Mascot, QuizSession, SpeakButton, XpBar…
  core/          réglages, synthèse vocale, progression/gamification, stockage
  pages/         accueil, matière, activité, réglages, progression
  styles/        thèmes et styles globaux
```

## Feuille de route (Blocland)

1. ✅ Coquille : profil d’accessibilité, lecture vocale des consignes, carte des biomes et créatures.
2. ✅ Moteur d’exercice générique (JSON), étoiles, récompenses en blocs, répétition espacée J+1/3/7/15, streak, adaptation, pause après 3 exercices.
3. ✅ Un exercice par biome : Chasse au son, Filon, Mot troué, Tri des graines, Ascension.
4. ✅ Inventaire et grille de construction isométrique.
5. Coffre à mots, boss de biome, craft, journal hebdomadaire, autres exercices.
