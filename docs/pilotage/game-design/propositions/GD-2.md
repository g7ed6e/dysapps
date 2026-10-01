# GD-2 : combiner les blocs pour les monuments

**État** : Décidée le 30 septembre 2026
**Portée** : Commun (les noms sont propres à chaque univers)

## Le constat

Le mainteneur, le 30 septembre 2026 : « Dans Blocland la collecte de blocs doit permettre de combiner ces blocs pour obtenir d’autres blocs nécessaires à d’autres constructions monumentales comme l’observatoire des baleines. La même mécanique doit exister dans Archipéo : on doit donc pouvoir l’implémenter de manière générique. Dans les deux cas, un bâtiment spécifique posé sur l’île contenant l’école et la salle des trophées. » Il ajoute : « On est à mi-chemin entre gameplay et univers. » Aujourd’hui, les monuments emploient les blocs qui s’accumulent, mais seulement tels qu’on les gagne : rien ne se transforme, et l’identité de Blocland (la construction par bloc, les mécanismes, l’ingénierie, [GD-1](GD-1.md)) ne se voit pas dans ce qu’on bâtit.

## La proposition

1. **Un lieu de plus sur l’île de l’école** de chaque archipel, à côté de l’école et de la salle des trophées, là dès le début et utilisable tout de suite : **la Fabrique** dans Blocland, **la Halle aux matériaux** dans Archipéo. « Atelier » (les Anciens Ateliers, l’île L’Atelier), « chantier » (l’état « En chantier »), « forge » (l’île de la Forge) et « établi » (le jeu connu) sont écartés.
2. **Un bloc assemblé par archipel**, qu’aucune île ne donne. Sa recette prend trois blocs de deux îles de son archipel, jamais d’or ni de cristal ; son nom est propre à chaque univers, sa recette et son identifiant sont communs :

   | Archipel | Recette | Blocland | Archipéo |
   | --- | --- | --- | --- |
   | 6e | 2 bois + 1 brique | Poutre | Madrier |
   | 5e | 2 glace + 1 panneau | Vitrail | Hublot |
   | 4e | 2 acier + 1 rail | Engrenage | Poulie |
   | 3e | 2 lentilles + 1 quartz | Miroir | Loupe |

3. **Recette fixe et toujours affichée** : vignettes, nombres et noms, lue à voix haute, « tu en as … » à côté de chaque bloc ; un toucher sur « Assembler » fait un bloc. Ni grille, ni place des blocs qui compte, ni recette à deviner. Sans assez de blocs, le bouton reste grisé : rien ne se perd. Un bloc assemblé en poche **se défait** : « Défaire 1 poutre » rend tous ses blocs, pour ne jamais prendre au bois ou à la brique ce qu’un plan ou un pont demandera (relecture UX UI et mainteneur, 1er octobre 2026). Un bloc déjà posé dans un monument reste posé.
4. **Les huit monuments existants** en demandent 4 à 8 chacun, aux endroits qui comptent (poteaux et longue-vue de l’observatoire des baleines, ailes du grand moulin, lanterne du phare du large, hublots de son fût dans Archipéo, lanterneau du kiosque, roues de la locomotive du viaduc, machinerie de l’amphithéâtre, grande lunette de l’observatoire des étoiles, faîte du temple). Aucun monument n’est créé.
5. **Rien ne recule** : une case déjà posée reste posée, quel que soit le bloc qu’elle demande maintenant.
6. **Une question à chaque bloc assemblé**, qui mobilise **deux matières** (mainteneur, 1er octobre 2026) : celles des deux îles de la recette (la poutre : bois de la Forêt des sons et brique de la Plaine des nombres, français et maths ; le vitrail : maths et français ; l’engrenage : maths et anglais ; le miroir : français et maths). Quand c’est possible, la forme écrite de la bonne réponse dépend du résultat du calcul. Trois choix : la réponse et un piège de chaque matière ; le rappel des deux matières est affiché. 12 questions par bloc, écrites dans `docs/contenu/assemblage.md` ; aucune ne revient avant 6 autres ; une erreur ne fait rien perdre et laisse un second essai. Proposition du directeur du contenu pédagogique.

Les recettes, les noms des blocs et du lieu s’écrivent dans `docs/contenu/assemblage.md`, lu par `npm run contenu` (demande du mainteneur).

## Ce qui ne bouge pas

- Les blocs restent la ressource ; aucun identifiant ne change ; les sauvegardes restent lisibles (les blocs assemblés s’ajoutent à l’inventaire, les cases des monuments gardent leurs clés).
- DP-09 (les récompenses servent le monde), DP-12 (pas de pression : rien ne se perd, pas de délai), « rien d’emprunté » (pas de table de craft).
- Principes dys : un bouton principal, rien à lire dans le monde, deux sortes de blocs au plus par recette, jamais la couleur seule.
- §4 de [Plusieurs univers](../../../conception/univers.md) : la règle est commune, les noms et le dessin sont propres à chaque univers.

## Le coût

- Code : `world/assemblage.ts` (règles), `engine.ts` (`assembleBlock`), quatre blocs dans `biomes.ts`, les cases des monuments (`world/monuments.ts`), le lieu (`world/terrain.ts`, `cube.ts`), son panneau et sa page (`Assemblage.tsx`), les textures des deux univers.
- Contenu : `docs/contenu/assemblage.md` → `src/blocland/world/recettes.ts` (`npm run contenu`) ; ses 48 questions, 12 par bloc (« Les questions ») → `src/blocland/exercises/data/assemblage-<bloc>.json`.
- Rythme (directeur du contenu) : chaque case assemblée coûte deux blocs de plus, soit 8 à 16 blocs par monument, deux ou trois missions, une séance au plus, payée par le stock accumulé.
- Sauvegarde : l’inventaire, et le tirage des questions de chaque bloc (`assemblageTirage`, optionnel : une sauvegarde sans lui reste valable).
- Rendu : le lieu coûte de 108 à 118 triangles de construction par archipel. Avec les îles-écoles en 20 × 20, la construction mesure 7 217 au 5e : l’enveloppe « autres » de la construction passe de 7 100 à 7 240 triangles, 60 sont pris au bonhomme, à la faune, au navire et aux bornes, et la somme des « autres » passe de 52 960 à 53 040 (`world/budget.ts`).

## Les avis

- Directeur artistique : « À revoir », trois points repris : un bloc par archipel (pas un par monument), recette visible dès l’archipel atteint, pas de nom en « atelier » ; lieu là dès le début. Il a tranché le 30 septembre, dans le lot 7b, que l’école et la salle des trophées prendront le kit d’architecture modulaire : le nouveau lieu suivra la même règle.
- Consultant de Blocland : « À ajuster », repris : « la Fabrique », pas de grille ni d’« établi », pas de fenêtre grise à cases.
- Consultant d’Archipéo : « À ajuster », repris : « la Halle aux matériaux », un récit de savoir-faire retrouvé, les noms Madrier, Hublot, Poulie, Loupe ; rien ne recule.
- Référent dys : « À ajuster », conditions reprises : quantités en chiffres et en vignettes, dites à voix haute ; un toucher, un bloc à la fois ; noms distincts à l’écrit ; rien à retenir ; rien ne se perd.
- Directeur contenu pédagogique : trois pour un, 4 à 8 blocs assemblés par monument.
- Consultant UX UI (parcours, 1er octobre 2026) : « À ajuster », repris : un bloc assemblé se défait (choix du mainteneur, parmi trois : limiter, défaire, rien) ; au monument, une ligne au-dessus des boutons grisés dit d’aller à la Fabrique ; une seule carte en entier (celle du bloc demandé ou de l’archipel), les autres sous un pli ; chaque monument dit combien il attend ; un lien pour y retourner ; la Fabrique dans le menu du village.

## La décision

30 septembre 2026, mainteneur : les blocs assemblés vont dans les monuments existants ; deux noms de lieu (la Fabrique, la Halle aux matériaux) ; les quatre blocs « Mécanismes » ; « 1 ok, 2 il faut nom spécifique à l’univers, 3 ok » ; « Ok. L’implémentation doit permettre d’alimenter les noms via markdown. » Le 1er octobre 2026 : « Ok pour défaire » ; « ok budget » (construction à 7 240, somme à 53 040) ; « Combiner un bloc va nécessiter la réponse à une question afin de mobiliser des compétences / connaissances en 2 matières », puis, sur la proposition du contenu (recettes à deux matières, 12 questions par bloc sans retour avant 6 autres, second essai) et sur la ligne « deux matières, une question à chaque bloc » : « 1 ok 2 ok ».
