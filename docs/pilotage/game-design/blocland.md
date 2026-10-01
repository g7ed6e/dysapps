# Blocland

Blocland est le monde en blocs du jeu, **l’univers par défaut** (décision 7 de [Plusieurs univers](../../conception/univers.md)) : les élèves tiennent au monde en cubes. Il habille le jeu commun ([Le game design](index.md)) sans en changer les règles. Il est tenu par l’agent `consultant-blocland`, sous l’autorité du directeur artistique. Le détail : la fiche de l’univers (`design/blocland/fiche.md`) et le [Cadrage de Blocland](../../conception/cadrage-blocland.md).

## Construit

- **Le récit** : le village est en ruine, l’élève est le **bâtisseur** ; les blocs gagnés construisent les ouvrages, les bâtiments des créatures, les monuments et le Bloc-Navire. Une île aux trois plans terminés est « Bâtie ».
- **Le ton** : familier et chaleureux, un peu drôle, jamais menaçant ; les répliques tutoient et disent « bâtisseur ».
- **Le Gardien** : une grande créature en cubes sur son îlot ; **vaincu**, il devient une statue de pierre, « il aime les revanches ». C’est un partenaire qui cède, pas un ennemi abattu.
- **Qui parle** : les créatures, une par île ; aux quatre grandes étapes d’un archipel, la créature de l’île-école (Mousso, Bazar, Ixe, Fi), son nom écrit dans le titre de la bulle (« Le mot de Mousso ») et son portrait en cubes ; les baleines restent au large, sans parler ([GD-1](propositions/GD-1.md), point 1 ; [Personnages et Gardiens](personnages.md)).
- **Les noms** : les archipels portent leurs noms d’origine, les Basses Terres, les Collines du Large, les Monts de Feu, les Îles du Ciel (GD-1, point 2) ; un élève qui jouait déjà les voit annoncés une fois, sur l’écran « De nouveaux noms ». Les rôles sont des métiers du chantier : Apprenti, Maçon, Mécanicien, Ingénieur, Architecte, sur les seuils communs, et leurs succès expliquent le métier (GD-1, point 3).
- **Le dessin** : tout en cubes texturés de 16 × 16 générés par le code, une ambiance par archipel, jour et nuit selon l’heure ; budget propre de 80 000 triangles et 240 appels de dessin. Blocland ne reçoit aucun lot R : son dessin est figé (étiquette `blocland-reference`), pas son accessibilité.
- **L’interface** : des blocs vus de face en aplats d’herbe, de bois, de terre et d’or, titres en Archivo Black ; insignes de rôle en blocs de matériau ([Style](../../conception/style.md), « L’habillage de Blocland »).

## Cible

Garder un univers en blocs complet et soigné, univers de preuve de l’habillage pédagogique (U5), sans rien emprunter à un jeu existant.

## Construit avec GD-1

Le caractère de Blocland se bâtit autour du **chantier du bâtisseur** ([GD-1](propositions/GD-1.md), décidée le 30 septembre 2026). Les quatre points sont construits : qui parle, les noms des archipels, les rôles, et le geste et le son de pose (le dernier bloc d’un plan s’enclenche, le logo se construit, un « clac » mat).

## Questions ouvertes

- Les noms des Expéditions et des états du village dans Blocland : à caler avec le chantier « bâtiments qui montent de niveau par île », pour ne pas avoir deux échelles de progression.
- Le nom de Knight (la créature du Château des hypothèses, en anglais) : voix française ou voix anglaise ?
- U5 : les problèmes situés, les phrases de français et d’anglais et quelques textes habillés pour Blocland (avec le directeur contenu pédagogique).
