# Contribuer

Le dépôt est <https://github.com/g7ed6e/dysapps>. Le travail se fait par pull request sur `main` ; la CI lance les tests, les deux builds et les vérifications de version et de documentation.

## Mettre en route

```bash
npm install
npm run dev        # l'application : http://localhost:5173/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
npm run docs:dev   # la documentation : http://localhost:4173/
npm run docs:build # construit la documentation dans dist-docs/
npm run docs:check # vérifie que docs/journal.md décrit la version courante
```

## Ce que contient chaque pull request

1. **Le code et ses tests.** La logique reste pure et testée (moteur, progression, générateurs, données) ; un exercice ajouté est vérifié par les tests de données.
2. **La version** : `npm run version:minor` (obligatoire, vérifié par la CI).
3. **La documentation**, dans la même pull request :
   - une entrée en tête de `docs/journal.md` sous le titre `## <version> — <date>`, qui dit ce que change la pull request pour l’élève ou pour le contenu (vérifié par la CI) ;
   - le **manuel** (`docs/manuel/`) mis à jour si un écran, un geste, un réglage ou une règle du jeu change ;
   - les **principes** et la **conception** (`docs/pedagogie/principes.md`, `docs/conception/`) mis à jour si une règle dys, l’architecture, le format des exercices ou le déploiement change ;
   - le **README** cohérent avec le reste.
4. **Le contenu pédagogique** (archipel, pages des îles, homophones, lecture, maths du portail, ouvrages, barème) n’a rien à faire à la main : ces pages sont générées au build à partir des données du jeu. Ajouter un exercice, une quête ou une île suffit pour qu’elles apparaissent. Si un nouveau champ de données mérite d’être documenté (une nouvelle aide visuelle, une nouvelle forme d’item), compléter `scripts/docs/generate.mjs`.

Une pull request qui ajoute une page au manuel ou à la conception la déclare dans `docs/_theme/nav.json` : le build échoue si une page du sommaire manque et signale une page hors sommaire.

## Écrire pour la documentation

- En français, au présent, en phrases courtes ; le lecteur est un élève, un parent, un enseignant ou un orthophoniste, pas un développeur (sauf dans la section Conception).
- Décrire ce que l’application **fait**, pas ce qu’elle fera ; les intentions vont dans les cadrages.
- Nommer les choses comme l’application les nomme (« joker », « Gardien », « ouvrage », « plan », « borne »).
- Pas de capture d’écran à maintenir : les pages décrivent les écrans en mots ; les données parlent pour le contenu.
- Les tableaux servent aux listes comparables ; les listes à puces aux étapes et aux règles.

## Conventions du dépôt

- Commits et pull requests en français, sans signature d’outil ni mention d’assistant ; auteur des commits : le mainteneur du dépôt.
- Aucune ressource externe dans l’application ni dans la documentation (politique de sécurité stricte, hors ligne garanti).
- Rien d’emprunté : textes originaux ou du domaine public, images, textures et sons générés par le code, noms et créatures originaux.
- Les règles dys ne sont pas négociables : pas de chrono, un item par écran, consigne lue, aide toujours affichée en maths, indice jamais pénalisant, correction qui explique, texte à lire sur fond uni et en police dys, taille ≥ 18 px, interlignage ≥ 1,5.

## Signaler un problème

Ouvrir un ticket sur GitHub avec : l’appareil et le navigateur, la version (Réglages → Application), la page ou l’exercice concerné (l’identifiant, par exemple `carriere-coffre-2`, figure sur la page de l’île dans la documentation), et ce qui était attendu.
