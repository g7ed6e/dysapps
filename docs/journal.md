# Journal des versions

Chaque pull request monte la version mineure et ajoute ici une entrée, de la plus récente à la plus ancienne. La version installée est affichée dans Réglages → Application. Les versions antérieures au journal sont résumées en bas de page.

## 0.11.0 — 26 septembre 2026

**Le Bloc-Navire au quai.** Le navire n’est plus figé dans le terrain : il tangue doucement sur l’eau (il plane à hauteur de quai dans les Îles du Ciel) et son ballon se balance au sommet du mât. Toucher une de ses cases bleues pose le bloc attendu ; le toucher ailleurs ouvre le panneau du port directement sur la section Bloc-Navire. Quand le panneau du port est ouvert et qu’il reste des cases à poser, la flèche jaune flotte au-dessus du chantier.

## 0.10.0 — 26 septembre 2026

**Quatre ambiances.** Chaque archipel de Blocland a désormais son ciel, sa mer et sa lumière : la mer tempérée des Basses Terres ; un ciel plus froid et une mer turquoise semée de plaques de glace dans les Collines du Large ; un bleu profond, une brume plus proche et des aiguilles d’ardoise dans les Monts de Feu ; et, dans les Îles du Ciel, plus de mer : un plancher de nuages qui dérive sous les îles, des nuages bas entre elles, aucune baleine. Deux repères de plus : l’aiguille de glace du Glacier et le haut-fourneau de la Forge, qui rougeoie et fume. Les oiseaux volent plus nombreux et plus haut dans les Monts, tout en haut dans le ciel. Les nuits restent bleues, jamais noires.

## 0.9.0 — 26 septembre 2026

**Quatre archipels et le Bloc-Navire.** Blocland devient quatre archipels, un par classe : les Basses Terres (6e), les Collines du Large (5e), les Monts de Feu (4e), les Îles du Ciel (3e). On voit un archipel à la fois, avec sa mer et sa Carte. Les ouvrages ne relient plus que les îles d’un même archipel ; pour passer au suivant, on construit le **Bloc-Navire** au quai de l’île-port (des blocs à poser comme un plan, et des Gardiens à vaincre pour que la voile, le ballon puis le réacteur apparaissent), puis on embarque. On revient quand on veut, rien ne se perd.

- Nouvelle section « Le Bloc-Navire » dans le panneau du port (3D) et sur sa page (vue simple) ; écran de voyage avec la phrase lue et un bouton « Arriver » (la cinématique viendra ensuite).
- Vue simple : îles groupées par archipel, phrase pour un archipel fermé, prochain objectif et fête d’ouvrage comme en 3D ; pages Français et Maths groupées par archipel (« Archipel à rejoindre »).
- Succès Capitaine, Aéronaute et Pilote du ciel ; tutoriel de six bulles.
- Les anciennes sauvegardes gardent tout : un escalier ou un tunnel déjà construit vers une autre classe vaut le voyage correspondant.
- Documentation : cadrage « Quatre archipels et le Bloc-Navire », manuel et questions mis à jour, pages des îles avec leur archipel et leur port, ouvrages groupés par archipel, table du Bloc-Navire.

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
