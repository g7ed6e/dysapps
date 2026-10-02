# GD-6 : La boucle des blocs, de la première mission au dernier archipel

**État** : Décidée le 2 octobre 2026
**Portée** : Commun (les noms, les voix et le dessin restent propres à chaque univers)

## Le constat

[GD-4](GD-4.md) et [GD-5](GD-5.md) (modèle A) ont fixé le cap : une mission est la demande d’un habitant, les blocs gagnés se posent tout seuls sur le bâtiment de l’île et le restaurent, et l’île restaurée fournit son bloc au reste du monde. Le directeur artistique a joué cette boucle dans quatre moments (la première séance de 6e, une séance de 15 minutes, le retour après trois semaines, la fin d’un archipel). Le cap tient, mais la boucle se heurte à ce qui est construit ([Le cadrage de Blocland](../../univers/blocland/cadrage.md), « Les ouvrages », « Le village, les plans et les coffres », « Le Bloc-Navire et le voyage ») :

- **La première séance s’arrête net** : si les 5 à 7 blocs de la première mission partent tous sur le bâtiment, le stock reste vide et aucun ouvrage du port n’est payable. Et 6 blocs sur un bâtiment d’environ 100 blocs, cela se voit peu.
- **Deux systèmes se doublent** : trois plans par île (murs, toit, cour) d’un côté, 3 à 5 missions par île de l’autre ; les coffres et leurs blocs de finition n’ont plus d’objet.
- **Une troisième ressource** : l’or et le cristal du dernier plan paient les ouvrages, alors que GD-5 n’en veut que deux (le bloc d’île et le bloc assemblé).
- **Rejouer peut devenir une corvée** : sur une île restaurée, rejouer une mission maîtrisée pour remplir le stock.
- **L’après-archipel est vide** : une fois le navire parti, les blocs de l’archipel quitté ne paient plus que ses deux monuments.

## La proposition

1. **Une partie par mission.** Chaque mission réussie pose d’un coup une partie entière du bâtiment de l’île, sous les yeux de l’élève. Les blocs gagnés vont au stock, comme aujourd’hui (le barème ne change pas).
2. **L’île de l’école fournit son bloc dès le début**, comme son école : l’élève a toujours de quoi payer les ouvrages du port, dès la première séance.
3. **Les plans deviennent les parties des missions.** Chaque plan d’une île devient la partie posée par une de ses missions. Les coffres sont retirés et la finition est comprise dans la pose. L’or et le cristal sortent des coûts et ne restent que des trophées.
4. **Rejouer et réviser rapportent le bloc d’une île restaurée** : les missions rejouées, et les révisions que propose la créature de l’île ([GD-4](GD-4.md), étape 1). Les révisions donnent la raison de revenir qui fait le plus apprendre.
5. **Seul le bâtiment de l’île se pose seul.** Les ouvrages, les ponts, les monuments et le navire restent un geste de l’élève, qui choisit où dépenser ses blocs : Blocland garde son geste de bâtisseur ([GD-1](GD-1.md)).
6. **Les blocs d’un archipel quitté servent encore** : l’archipel suivant en demande un peu (une révision en spirale), puis les grands projets de 4e et de 3e ([GD-5](GD-5.md), modèle C). La part demandée et les îles concernées sont à cadrer avec le directeur du contenu pédagogique.

Au retour après une absence, un seul habitant fait signe, sans compteur ni date ; une phrase de reprise dit où en était le monde (à écrire par chaque univers).

## Ce qui ne bouge pas

- **Les règles dys** : rien à lire dans le monde ; pas de chrono ; rien ne se perd ; refuser une révision ne coûte rien ; la pose automatique est courte et ne demande aucun geste fin ; la vue simple fait tout ce que fait le monde.
- **Le directeur artistique** : aucune nouvelle monnaie, aucune jauge, aucune demande avec délai (DP-09, DP-12, DA-05) ; on ne garde que le bloc d’île et le bloc assemblé.
- **Les univers** ([Plusieurs univers](../../univers/univers.md), §4) : les règles sont communes ; dans Blocland on bâtit du neuf, dans Archipéo on restaure.
- **La sauvegarde et les identifiants** : jamais touchés. Un plan déjà construit reste construit ; l’or, le cristal et les coffres déjà gagnés restent dans la sauvegarde et se montrent en trophées.
- **Le navire** part toujours après 3, puis 2, puis 2 Gardiens de l’archipel, même si des îles ne sont pas restaurées : rien n’est imposé.

## Le coût

Un lot à part, après la fiche de l’étape 1 de GD-4. À cadrer par le directeur artistique avec l’artiste technique 3D et l’expert frontend :

- Le lien entre une mission et une partie du bâtiment (`world/plans/`, `docs/contenu/<île>.md`, « ## Les plans ») et la pose automatique (une animation courte par univers, mesurée dans le budget).
- Le retrait des coffres et de l’or et du cristal dans les coûts des ouvrages ; l’escalier taillé, qui demande aujourd’hui « le premier plan de l’île de départ terminé », demandera la première mission réussie.
- Le bloc de l’île de l’école dès le début ; les révisions qui rapportent le bloc de leur île ; Mes blocs à remettre d’accord.
- Le point 6 attend le cadrage du contenu pédagogique.
- Sauvegarde non touchée.

## Les avis

- Directeur artistique : a éprouvé la boucle et recommandé les six choix retenus.
- Consultants de Blocland et d’Archipéo, référent dys : à recueillir sur la fiche du lot, avant le code.

## La décision

2 octobre 2026, mainteneur : les six choix, un par un (« Une partie par mission », « L’île de l’école », « Plans = missions », « Rejouer et réviser », « Seul le bâtiment », « Suite puis projets »), puis, par écrit, « oui » à la boucle qui en sort.
