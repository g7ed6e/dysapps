# Journal des versions

Chaque pull request monte la version mineure et ajoute ici une entrée, de la plus récente à la plus ancienne. La version installée est affichée dans Réglages → Application. Les versions antérieures au journal sont résumées en bas de page.

## 0.8.0 — 26 septembre 2026

**Succès : la progression par matière.** La page Succès montre maintenant un panneau par matière (Français, Maths) :

- une jauge des étoiles gagnées dans les îles de la matière, de la 6e à la 3e ;
- les îles ouvertes, les Gardiens vaincus et le record des quêtes du portail ;
- une liste **À retravailler**, la quête la plus faible en premier, pour la relancer d’un geste. Elle contient les quêtes de Blocland déjà jouées qui n’ont pas trois étoiles, et les quêtes du portail dont le record est sous 70 %, cinq au plus.

Voir [Progression et récompenses](manuel/progression.md#par-matiere-progresser-et-retravailler).

## 0.7.0 — 26 septembre 2026

**README en porte d’entrée.** Le README du dépôt ne détaille plus chaque fonctionnalité : il présente le projet, donne les deux adresses (application, documentation), le démarrage développeur, les règles des pull requests, la licence et les crédits, et renvoie à cette documentation pour le reste. Le paragraphe sur le style « monde en blocs » (repères visuels, polices, textures, sons) devient la page [Style « monde en blocs »](conception/style.md) de la conception.

## 0.6.0 — 26 septembre 2026

**Site de documentation.** Cette documentation est publiée sur GitHub Pages (<https://g7ed6e.github.io/dysapps/>) ; l’application, elle, est désormais publiée uniquement sur Cloudflare (<https://dysapps.guillaume-delahaye.workers.dev/>).

- Manuel : démarrer, quêtes du portail, aventure Blocland, progression, réglages, questions fréquentes.
- Contenu pédagogique généré à chaque build depuis les données du jeu : l’archipel, une page par île (créature, Gardien, quêtes, consignes, items, aides, récompenses, plans, ouvrages), homophones, lecture, maths du portail, ouvrages et plans, barème et succès.
- Conception : architecture, format des exercices, déploiement et sécurité, contribuer, et les trois cadrages (déplacés dans `docs/conception/`).
- Ce journal, vérifié par la CI (`npm run docs:check`) : chaque pull request doit décrire sa version.
- Sur l’ancienne adresse de l’application (GitHub Pages), un service worker de remplacement vide les caches de l’ancienne PWA et se désinscrit ; les appareils concernés réinstallent l’application depuis Cloudflare.
- Le build de l’application (`npm run build`, `vite.config.ts`) est inchangé.

## Avant le journal

- **0.5.0** : dans Blocland, la croix du panneau d’une île le replie sans quitter l’île ; un bouton au nom de l’île, dans la barre du bas, le rouvre ou le replie ; toucher à nouveau l’île, une borne ou un ouvrage le rouvre.
- **0.4.0** : le bonhomme regarde dans la direction où il marche et se tient sur le dessus du sol (il était enfoncé d’un bloc).
- **0.3.0** : chaque pull request monte la version mineure, vérifié par la CI.
- **0.2.x et avant** (septembre 2026) : socle du portail (réglages dys, gamification, PWA), quêtes Homophones, Tables et calcul mental, Fractions, Nombres décimaux, Lecture ; Blocland (moteur d’exercice, étoiles, blocs, répétition espacée, régularité, adaptation), le village en 3D et ses plans, les Gardiens, l’archipel et ses ouvrages, les vingt îles de la 6e à la 3e, le continent qui monte, le bonhomme, la Carte, les baleines, les personnages redessinés, la mise à jour en un clic, la police Luciole. Le détail est dans l’historique des pull requests du dépôt.
