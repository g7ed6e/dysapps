# Lot 14, retouche 1 : captures

Commits c9b94630 (retouche), 290fed93 (le cap de « Y aller » un peu à gauche), 41fe9ae1 (le regard levé ne fait plus de va-et-vient), sur 67febe86. Rendu logiciel (SwiftShader), horloge pilotée, le 5e tout construit sauf le Sémaphore ; « ruine » : aucune mission jouée, « restauré » : les cinq. Scripts hors du dépôt, dans le dossier de travail du fil (`captures14/prise-r1.mjs`).

## Ce qui est montré, image par image

**01, le cap de « Y aller », à la caméra de marche** (Kéo amené par « Y aller » depuis la chaussée, panneau fermé, la caméra du jeu, sans `view`) :
- restauré, 1024 × 768 : la tour entière, le mât, son chapeau à environ 50 px du haut, les deux bras entiers, la drisse et ses trois fanions finissant sur le mur ouest de la cabine. La bulle « Aucune mission à faire ici pour l'instant. » couvre les jambes de Kéo, rien du lieu. La colonne d'icônes, à droite, ne touche ni le mât ni les bras.
- restauré, 800 × 1280 : tout le lieu avec beaucoup d'air au-dessus du chapeau ; les bras sont au milieu de l'image.
- restauré, 390 × 844 : le chapeau à environ 60 px du haut, le bout des deux bras dans l'image (au cap nord, ils sortaient à gauche : c'est ce qui a fait tourner le cap). La colonne d'icônes de gauche passe devant le bas du bras du bas, sans en cacher le bout. La bulle couvre Kéo, pas le lieu.
- ruine, aux trois tailles : la tour cassée, la cour aux joints rompus et à la troisième dalle soulevée, le mât et les bras couchés le long du mur ouest, la corne renversée ; la porte et la marche dégagées. Aucune marque au-dessus du lieu à l'arrêt (la marque n'apparaît qu'à la vue de face, plus loin).
- La « mer » : tourné de 14° vers l'ouest, le cap montre le large à gauche, mais depuis la porte, à hauteur de marche, c'est la brume du lointain au-dessus du bord du plateau ; l'eau elle-même reste cachée par le plateau.

**02, l'arrivée par la chaussée de aig-3** (Kéo posé sur la chaussée à 14 unités de la porte, la caméra du jeu tournée de deux crans vers l'ouest, le long de la chaussée) : la tour à droite, vue de l'est, les deux bras relevés de profil, larges ; une aiguille à gauche. On lit des planches, plus des tiges. La marche à pied depuis aig-3 avec `goTo` va trop vite en rendu logiciel pour une prise à mi-chemin (Kéo arrive avant la photo) : la prise est faite en posant Kéo sur la chaussée.

**04, de face** (caméra posée, comme au lot 14) :
- restauré : bras en planches de 0,7, lus nettement comme des bras ; le mât dépasse le contrepoids du haut ; trois fanions de drisse plus grands, la drisse finit sur le mur ouest de la cabine, sous le débord ; trou rond (seize pans) et quatre goujons ; lanternes : chapeaux de fer, plus aucun ocre en haut d'une lanterne ; panier et râtelier refaits, visibles en petit.
- ruine : la marque « Le Sémaphore » au-dessus de la tour cassée ; cour usée, joints rompus en bouts (pas une grille), trois dalles soulevées, porte libre ; lanterne éteinte de la potence sans face ocre ; une seule lanterne allumée (celle du signaleur).

**05, de dos** (caméra posée au-dessus du plateau, au nord-ouest, tournée vers la Montée) : la tour entière et ses deux bras, la cour (en ruine : les débris, la corne et les bras couchés), la Montée et son rail au tiers droit, une aiguille proche à droite. Les bras pointent vers la caméra : ils se lisent mieux qu'au lot 14 (plus larges) mais restent en raccourci de ce côté.

**06, la scénette** :
- tablette (Routine) : la phrase « Le signaleur fait des signes aux bateaux avec de grands bras de bois. » ; les fanions de réponse : triangle, queue d'aronde (l'encoche se voit), flamme longue ; trois silhouettes différentes, d'une seule teinte, aucune ne se lit « drapeau » ni lettre. Elles restent petites (environ 45 px de large à 1024 × 768) : les cartes de mots dessous restent les vraies cibles.
- téléphone, OpenDyslexic 32 : « Le / signaleur » en titre, puis la phrase sur toute la largeur : « signaleur » n'est plus coupé (« Le / signaleur / fait des / signes aux / bateaux… »). Le haut-parleur est passé sous la phrase (hors de l'image : le panneau se fait défiler).

**07, de près** (restauré) :
- le panier : trois rouleaux gros et courts de toile crème, chacun une bande de sa couleur au bout (bleu-gris, brique, sauge), en éventail ; plus de « crayons ».
- le râtelier : deux montants droits (des planches debout) avec leurs joues, les trois perches posées dans l'encoche ; aucun X, sous aucun angle. De près, l'ensemble peut évoquer un banc bas : à juger par le directeur artistique.

**08, la Carte** (Kéo devant la porte du Sémaphore dans les deux états) : « Le Sémaphore » au même endroit en ruine et restauré, au-dessus de la tour, à gauche de « Toi » ; il ne couvre ni la tour ni la chaussée.

## Ce qui reste

- Le cap à 1024 × 768 : environ 50 px d'air au-dessus du chapeau ; le test du dépôt demande 6 % de l'écran (46 px) au moins aux trois tailles, dans le modèle de caméra sans rendu. La hauteur de la marque n'est pas mesurée par le test (la marque n'est pas là à l'arrivée au restauré : aucune mission).
- Les fanions de réponse restent petits sur tablette ; les relever demande d'agrandir la planche ou l'échelle des objets (budget du lieu tenu : 1 348 triangles au plus lourd sur 1 600).
- La vraie marche depuis aig-3 n'est pas prise à mi-chemin (rendu logiciel trop lent pour la suivre).
