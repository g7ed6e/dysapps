# DysApps

**Archipéo**, le jeu d’entraînement de DysApps, pour les **élèves dys du collège** (dyslexie, dysorthographie, dyscalculie), de la 6e à la 3e, en français, en mathématiques et en anglais. Tout tient dans le navigateur, sans compte ni serveur : la progression reste sur l’appareil.

- **Application** : https://dysapps.guillaume-delahaye.workers.dev/ (s’installe comme une application, fonctionne hors ligne)
- **Documentation** : https://g7ed6e.github.io/dysapps/ (manuel utilisateur et contenu pédagogique)

## Ce que c’est

- **Les missions du portail** : Homophones, Lecture (textes du domaine public), Tables et calcul mental, Fractions, Nombres décimaux, et en anglais Vocabulaire et Verbes irréguliers (voix anglaise pour les mots anglais). Séances courtes, questions générées, joker avec aide visuelle, correction qui explique.
- **L’aventure Archipéo** : quatre archipels en 3D, un par classe de la 6e à la 3e, vingt-huit îles en tout, une par thème du programme. Chaque île a sa créature, ses missions, son bloc, ses trois plans à reconstruire et son Gardien. Les exercices réussis donnent des blocs, les blocs ouvrent des ouvrages entre les îles, rebâtissent le village et construisent le Bloc-Navire qui mène à l’archipel suivant. L’école du village de chaque archipel ouvre les missions du portail, qui y rapportent des blocs.
- **Le programme officiel comme colonne vertébrale** : chaque mission cite les compétences des programmes de français, de mathématiques et de langues vivantes qu’elle travaille ; la documentation montre ce qui est couvert et ce qui reste à faire.
- **Des règles dys partout** : police adaptée (Luciole par défaut), texte jamais sous 18 px, consignes lues à voix haute, syllabes en couleurs, un item par écran, aide toujours affichée en maths, indice jamais pénalisant, pas de chronomètre, rien ne se perd.
- **Une motivation façon jeu**, sans stress : XP, rôles, succès, étoiles, blocs, bâtiments, répétition espacée et niveau adapté.

Le détail est dans la documentation : [Démarrer](https://g7ed6e.github.io/dysapps/manuel/demarrer.html), [Les missions](https://g7ed6e.github.io/dysapps/manuel/quetes.html), [Archipéo](https://g7ed6e.github.io/dysapps/manuel/blocland.html), [Réglages et accessibilité](https://g7ed6e.github.io/dysapps/manuel/reglages.html), [Principes dys](https://g7ed6e.github.io/dysapps/pedagogie/principes.html), [Programmes officiels](https://g7ed6e.github.io/dysapps/pedagogie/programmes.html), [L’archipel île par île](https://g7ed6e.github.io/dysapps/pedagogie/archipel.html).

## Développer

```bash
npm install
npm run dev        # l'application : http://localhost:5173/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
npm run docs:dev   # la documentation (VitePress) : http://localhost:4173/
npm run docs:build # construit la documentation dans dist-docs/
npm run docs:preview # sert dist-docs/ tel que publié : http://localhost:4173/
npm run docs:check # vérifie que la pull request ajoute un fragment au journal (docs/_journal/)
npm run docs:captures # rejoue le jeu dans Chromium et fait les captures d’écran (docs/_captures/, hors du dépôt, refaites par la CI sur main)
npm run rendu:mesures # appels de dessin et triangles du monde 3D par archipel, poids de Three.js (--captures <dossier> : captures « avant »)
npm run version:show # affiche la version calculée depuis git
npm run splash     # refait les écrans de lancement d'iPhone et d'iPad (public/splash/)
npm run programme:extract -- c3 # extrait le texte d'un programme officiel (c3, c4 ou une URL de PDF) dans .programme/
```

React 19, TypeScript, Vite, Three.js, Vitest. Arborescence, moteurs d’exercice, format des données et déploiement : voir [Architecture](https://g7ed6e.github.io/dysapps/conception/architecture.html), [Format des exercices](https://g7ed6e.github.io/dysapps/conception/exercices.html) et [Déploiement et sécurité](https://g7ed6e.github.io/dysapps/conception/deploiement.html).

## Contribuer

Le travail se fait par pull request sur `main`. Chaque pull request :

1. ne touche pas à la version : elle se calcule depuis git à la fusion (mineure par défaut, `+semver: major|patch|none` dans le message pour un autre cran) ;
2. ajoute un fragment de journal `docs/_journal/<nom-de-la-branche>.md` (sans titre), vérifié par la CI ;
3. met à jour le manuel et la conception (`docs/`) quand ce qu’ils décrivent change ; les pages du contenu pédagogique sont générées au build depuis les données du jeu ;
4. passe `npm test`, `npm run build`, `npm run docs:check` et `npm run docs:build`.

Les consignes complètes sont dans [Contribuer](https://g7ed6e.github.io/dysapps/conception/contribuer.html), `CLAUDE.md` et `AGENTS.md`.

## Déploiement

L’application est construite et publiée par Cloudflare Workers à partir de `main` (`npm run build`, à la racine, puis `npx wrangler deploy` selon `wrangler.jsonc`). Le workflow `.github/workflows/deploy.yml` lance les tests et les deux builds à chaque push et pull request, puis publie la documentation sur GitHub Pages à chaque push sur `main`. Aucune ressource externe, aucune donnée envoyée hors de l’appareil, actions épinglées par SHA, installation sans scripts et signatures npm vérifiées.

## Licence et crédits

Code sous licence MIT (voir `LICENSE`). La police **Luciole** (`public/fonts/luciole/`, version 2.001, non modifiée) est © Laurent Bourcellier & Jonathan Fabreguettes (Perez), distribuée sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.fr) ; la licence MIT du dépôt ne couvre pas ces fichiers, et le crédit est affiché dans l’application. Les textes de lecture sont du domaine public (La Fontaine, Daudet, Jules Verne) ; univers, créatures, textures et sons sont originaux et générés par le code. Les intitulés des programmes officiels (`src/programme/`) et la liste des mots-outils viennent de jeux de données du ministère de l’Éducation nationale publiés sur [data.gouv.fr](https://www.data.gouv.fr/datasets/programmes-denseignement-de-lecole-elementaire-et-du-college-cycles-2-3-et-4/), réutilisés sous [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) avec mention de la source.
