# DysApps

Applications d’entraînement pour les **élèves dys du collège** (dyslexie, dysorthographie, dyscalculie), de la 6e à la 3e, en français et en mathématiques. Tout tient dans le navigateur, sans compte ni serveur : la progression reste sur l’appareil.

- **Application** : https://dysapps.guillaume-delahaye.workers.dev/ (s’installe comme une application, fonctionne hors ligne)
- **Documentation** : https://g7ed6e.github.io/dysapps/ (manuel utilisateur et contenu pédagogique)

## Ce que c’est

- **Les quêtes du portail** : Homophones, Lecture (textes du domaine public), Tables et calcul mental, Fractions, Nombres décimaux. Séances courtes, questions générées, joker avec aide visuelle, correction qui explique.
- **L’aventure Blocland** : un archipel de vingt îles en 3D, une par thème du programme, de la 6e à la 3e. Chaque île a sa créature, ses quêtes, son bloc, ses trois plans à reconstruire et son Gardien. Les exercices réussis donnent des blocs, les blocs ouvrent des ouvrages entre les îles et rebâtissent le village.
- **Des règles dys partout** : police adaptée (Luciole par défaut), texte jamais sous 18 px, consignes lues à voix haute, syllabes en couleurs, un item par écran, aide toujours affichée en maths, indice jamais pénalisant, pas de chronomètre, rien ne se perd.
- **Une motivation façon jeu**, sans stress : XP, rangs, succès, étoiles, blocs, bâtiments, répétition espacée et niveau adapté.

Le détail est dans la documentation : [Démarrer](https://g7ed6e.github.io/dysapps/manuel/demarrer.html), [Les quêtes](https://g7ed6e.github.io/dysapps/manuel/quetes.html), [Blocland](https://g7ed6e.github.io/dysapps/manuel/blocland.html), [Réglages et accessibilité](https://g7ed6e.github.io/dysapps/manuel/reglages.html), [Principes dys](https://g7ed6e.github.io/dysapps/pedagogie/principes.html), [L’archipel île par île](https://g7ed6e.github.io/dysapps/pedagogie/archipel.html).

## Développer

```bash
npm install
npm run dev        # l'application : http://localhost:5173/
npm test           # tests (Vitest)
npm run build      # vérification TypeScript + build de production dans dist/
npm run docs:dev   # la documentation : http://localhost:4173/
npm run docs:build # construit la documentation dans dist-docs/
npm run docs:check # vérifie que docs/journal.md décrit la version courante
```

React 19, TypeScript, Vite, Three.js, Vitest. Arborescence, moteurs d’exercice, format des données et déploiement : voir [Architecture](https://g7ed6e.github.io/dysapps/conception/architecture.html), [Format des exercices](https://g7ed6e.github.io/dysapps/conception/exercices.html) et [Déploiement et sécurité](https://g7ed6e.github.io/dysapps/conception/deploiement.html).

## Contribuer

Le travail se fait par pull request sur `main`. Chaque pull request :

1. monte la version mineure (`npm run version:minor`), vérifié par la CI ;
2. ajoute une entrée pour cette version en tête de `docs/journal.md`, vérifié par la CI ;
3. met à jour le manuel et la conception (`docs/`) quand ce qu’ils décrivent change ; les pages du contenu pédagogique sont générées au build depuis les données du jeu ;
4. passe `npm test`, `npm run build`, `npm run docs:check` et `npm run docs:build`.

Les consignes complètes sont dans [Contribuer](https://g7ed6e.github.io/dysapps/conception/contribuer.html), `CLAUDE.md` et `AGENTS.md`.

## Déploiement

L’application est construite et publiée par Cloudflare Workers à partir de `main` (`npm run build`, à la racine). Le workflow `.github/workflows/deploy.yml` lance les tests et les deux builds à chaque push et pull request, puis publie la documentation sur GitHub Pages à chaque push sur `main`. Aucune ressource externe, aucune donnée envoyée hors de l’appareil, actions épinglées par SHA, installation sans scripts et signatures npm vérifiées.

## Licence et crédits

Code sous licence MIT (voir `LICENSE`). La police **Luciole** (`public/fonts/luciole/`, version 2.001, non modifiée) est © Laurent Bourcellier & Jonathan Fabreguettes (Perez), distribuée sous licence [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode.fr) ; la licence MIT du dépôt ne couvre pas ces fichiers, et le crédit est affiché dans l’application. Les textes de lecture sont du domaine public (La Fontaine, Daudet, Jules Verne) ; univers, créatures, textures et sons sont originaux et générés par le code.
