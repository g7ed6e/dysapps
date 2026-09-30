# Blocland

Blocland est le monde en blocs du jeu, **l’univers par défaut** (décision 7 de [Plusieurs univers](../../docs/conception/univers.md)) : les élèves tiennent au monde en cubes. Il habille le jeu commun ([Le game design](index.md)) sans en changer les règles. Il est tenu par l’agent `consultant-blocland`, sous l’autorité du directeur artistique. Le détail : la fiche de l’univers (`design/blocland/fiche.md`) et le [Cadrage de Blocland](../../docs/conception/cadrage-blocland.md).

## Construit

- **Le récit** : le village est en ruine, l’élève est le **bâtisseur** ; les blocs gagnés construisent les ouvrages, les bâtiments des créatures, les monuments et le Bloc-Navire. Une île aux trois plans terminés est « Bâtie ».
- **Le ton** : familier et chaleureux, un peu drôle, jamais menaçant ; les répliques tutoient et disent « bâtisseur ».
- **Le Gardien** : une grande créature en cubes sur son îlot ; **vaincu**, il devient une statue de pierre, « il aime les revanches ». C’est un partenaire qui cède, pas un ennemi abattu.
- **Qui parle** : les créatures, une par île ; la baleine aux grandes étapes, pour l’instant, avec les mêmes phrases que dans Archipéo sauf celle du dernier Gardien ; qui parle dans Blocland reste à décider ([Personnages et Gardiens](personnages.md)).
- **Le dessin** : tout en cubes texturés de 16 × 16 générés par le code, une ambiance par archipel, jour et nuit selon l’heure ; budget propre de 80 000 triangles et 240 appels de dessin. Blocland ne reçoit aucun lot R : son dessin est figé (étiquette `blocland-reference`), pas son accessibilité.
- **L’interface** : des blocs vus de face en aplats d’herbe, de bois, de terre et d’or, titres en Archivo Black ; insignes de rôle en blocs de matériau ([Style](../../docs/conception/style.md), « L’habillage de Blocland »).

## Cible

Garder un univers en blocs complet et soigné, univers de preuve de l’habillage pédagogique (U5), sans rien emprunter à un jeu existant.

## Questions ouvertes

- Qui parle aux quatre grandes étapes d’un archipel dans Blocland (une créature, les anciennes bulles d’arrivée, la baleine telle quelle) et pour dire quoi ? (consultant de Blocland, validé par le directeur artistique)
- Le retour des noms propres à Blocland (Basses Terres, Collines du Large, Monts de Feu, « Le village de Blocland »), le lexique court et l’écran « L’île X s’appelle maintenant Y » (U4).
- Les noms des rôles dans Blocland : les cinq rôles communs, ou des métaux sur les mêmes paliers.
- Les noms des Expéditions et des états du village dans Blocland.
- Le nom de Knight (la créature du Château des hypothèses, en anglais) : voix française ou voix anglaise ?
- U5 : les problèmes situés, les phrases de français et d’anglais et quelques textes habillés pour Blocland (avec le directeur contenu pédagogique).
