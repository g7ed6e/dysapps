# La LV2 : ce qui reste après LV2-5

Les cinq étapes de la LV2 sont faites : le réglage (LV2-1), le Relais des voyageurs en 5e (LV2-2 et LV2-3), le Jardin des heures en 4e (LV2-4) et le Refuge des carnets en 3e (LV2-5). Ce plan range ce que les relectures ont relevé sans le faire, pour ne rien perdre. Rien n’y est commencé : chaque point attend le mot du mainteneur, qui choisit l’ordre.

## À vérifier sur la tablette (mainteneur)

- La voix espagnole et la voix allemande : « viajo » et « viajó » se distinguent, les nombres et les heures, « Tú » et « Sí » dans les boutons.
- La pause des « … » dans les répliques de fin des Gardiens de Blocland (« Je me pose… en pierre »).
- Les écrans de mission sans défilement en OpenDyslexic à la plus grande taille (ticket #231 pour les écrans à document en 1024 × 768).
- Les images par seconde du 3e avec le Refuge (`?mesures`) : les mesures de la PR viennent du rendu logiciel.
- La respiration du Papillon de cuivre coupée avec « Réduire les animations » de l’appareil.

## Contenu (directeur contenu pédagogique)

- Rééquilibrer les réponses de `relais-*-2` (6 sur 8 au dernier rang).
- Étendre au Relais et au Jardin le test « la bonne réponse ne se devine pas à sa longueur » (aujourd’hui le Refuge seul), puis reprendre les items où la réponse est la plus longue.
- La carte de `studio-faux-amis` recopie sa réponse (anglais, hors LV2).
- `c4.*.ecouter.recit` n’est pas couvert : le récit est affiché à l’écran. Il faudrait un écran d’écoute sans texte, à cadrer avec le référent dys.
- `culture.langages` reste à couvrir.

## Interface et accessibilité (référent dys, expert frontend)

- Les titres des missions de LV2 (et d’anglais) sont découpés en syllabes à la française et lus par la voix française (`BossPage.tsx`, `IslandSheet.tsx`, `BiomePage.tsx`) ; les virgules de « Porque, cuando, pero » se mêlent à la liste. Les afficher hors du découpage, marqués dans leur langue (`lang`), un par ligne ou entre guillemets.
- Poser une espace fine insécable avant « : », « ? » et « ! » dans les textes affichés, pour qu’aucun signe ne parte seul en début de ligne.
- Vérifier que le bouton de lecture porte le mot « Écouter » partout où une réplique le nomme (le panneau de l’île ne montre que l’icône).
- Contraste élevé (lot 11) : le fil clair du Papillon d’Archipéo et les yeux de Timbre dans Blocland.
- `engine.ts` : `Object.hasOwn(BLOCKS, id)` au lieu de `id in BLOCKS` pour une sauvegarde abîmée.

## Rendu (directeur artistique, artiste technique 3D, consultants)

- **Le Papillon de cuivre de Blocland** garde un air de chandelier vu par la caméra de jeu, et de mur crénelé une fois vaincu. Revoir la silhouette pour qu’elle se lise vue de haut : ailes plus larges que hautes, antennes écartées de la tête, corps visible en plongée. Motif à valider par le consultant Blocland, relu sur les captures de la caméra de jeu (DA, 30/09).
- Un nuage ne cache jamais un Gardien ni un lieu où l’on joue, même en dérivant : aujourd’hui seule sa place de départ s’écarte des îles et des îlots.
- Les mares du 3e d’Archipéo sont en bleu ardoise mais ne se voient dans aucune vue : le vérifier sur capture dès qu’une mare apparaît, et faire valider ce bleu par le consultant Archipéo.
- Les portraits du panneau d’île montrent le dos de toutes les créatures (Timbre y est une colonne brune) : les retourner tous d’un coup dans une PR à part, relue par les deux consultants et le référent dys.
- Le phare du 3e est hors du tiers central en 800 × 1280 (défaut d’avant le Refuge) : un lot de cadrage portrait.
- Les plans du Refuge passeront par le kit d’architecture du 3e quand il aura des pièces (`bardeau` en famille bois, `taille` en pierre, le trou d’envol du pigeonnier reste une case vide) ; d’ici là, le bardeau est un aplat dans Archipéo.
- Propositions à trancher : le crème de Timbre arrêté à la poitrine dans Archipéo (consultant Archipéo) ; un toit de bardeau pour la salle commune dans Blocland (consultant Blocland).
- Dans Blocland, les répliques de fin disent « Le Relais » et « Le Jardin » avec une majuscule, alors qu’Archipéo écrit « le jardin » : à harmoniser avec le consultant Blocland.
- La vue 2D ne tient pas encore les noms de l’île « Commence ici » et de l’île du bonhomme (`tenues` de `placerEtiquettes`).
- Le budget du 3e a déplacé des marges (mer 4 550, décor 9 350, construction 7 100, bornes 720, navire 430, total 52 300) : les marges restantes sont minces, à valider par le mainteneur.

## Décisions voulues, à ne pas « corriger »

- Seul le Refuge sort du calcul de l’orientation de la caméra du 3e : le Relais et le Jardin y restent, parce que les cadrages du 5e et du 4e ont été validés avec eux (DA, 30/09).
