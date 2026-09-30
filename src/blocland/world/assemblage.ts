// L'assemblage des blocs (GD-2, décidée par le mainteneur le 30 septembre 2026) : un bloc assemblé par archipel, qu'aucune
// île ne donne, fait de blocs de deux îles de son archipel, dans un lieu de l'île de l'école (la Fabrique dans Blocland,
// la Halle aux matériaux dans Archipéo). Seuls les monuments de son archipel en demandent, aux endroits qui comptent.
// La recette est fixe et toujours affichée ; un toucher assemble un bloc, sans grille ni recette à deviner. Code pur,
// commun aux univers. Les recettes et les noms (du lieu et des blocs, propres à chaque univers) s'écrivent dans
// docs/contenu/assemblage.md, que `npm run contenu` recopie dans recettes.ts ; les textes d'univers les reprennent.
import type { BlockId } from "../biomes";
import type { ArchipelagoId } from "./archipels";
import { ASSEMBLAGE } from "./recettes";

/** L'adresse du lieu (dans le monde en 3D ou en 2D : son panneau ; en vue simple : sa page). */
export const ASSEMBLAGE_PATH = "/aventure/assemblage";

/**
 * Les univers que nomme docs/contenu/assemblage.md, par leur identifiant (ceux de `core/univers`, qu'un test compare) :
 * les règles ne lisent pas la couche des univers, ce sont les univers qui lisent ces noms.
 */
export type UniversNomme = "blocland" | "archipeo";

/** Le nom d'un bloc dans un univers, et son pluriel quand il ne s'écrit pas en ajoutant un « s ». */
export interface NomDeBloc {
  nom: string;
  pluriel?: string;
}

/** Le lieu où l'on assemble, dans un univers. */
export interface LieuDAssemblage {
  /** Son nom, avec sa majuscule et son article : le titre de sa page (« La Fabrique »). */
  titre: string;
  /** Où c'est, après « va » : « à la Fabrique ». */
  a: string;
  /** Ce qu'on y fait, en une phrase, sous le titre (lue à voix haute). */
  presentation: string;
}

/** Ce que docs/contenu/assemblage.md donne (`npm run contenu` → recettes.ts) : le lieu et les recettes, nommés par univers. */
export interface Assemblage {
  lieu: Record<UniversNomme, LieuDAssemblage>;
  recettes: (Recette & { noms: Record<UniversNomme, NomDeBloc> })[];
}

export interface Recette {
  /** Le bloc assemblé. */
  bloc: BlockId;
  /** L'archipel dont il vient : ses ingrédients sont des blocs d'îles de cet archipel, ses monuments le demandent. */
  archipelago: ArchipelagoId;
  /**
   * Ce qu'il coûte, le bloc dont il faut le plus d'abord : trois blocs de deux îles (référent dys : deux sortes au plus,
   * de petits nombres ; directeur du contenu : trois pour un garde un monument à une séance de plus au plus).
   */
  ingredients: { bloc: BlockId; n: number }[];
}

/** Les recettes, une par archipel, dans l'ordre des archipels (docs/contenu/assemblage.md). */
export const RECETTES: Recette[] = ASSEMBLAGE.recettes.map(
  ({ bloc, archipelago, ingredients }) => ({ bloc, archipelago, ingredients }),
);

/** Les noms des blocs assemblés dans un univers (les textes d'univers les reprennent). */
export function nomsAssembles(
  univers: UniversNomme,
): Partial<Record<BlockId, NomDeBloc>> {
  return Object.fromEntries(
    ASSEMBLAGE.recettes.map((r) => [r.bloc, r.noms[univers]]),
  );
}

/** Le nom qu'un univers donne à un bloc assemblé (rien pour un autre bloc). */
export function nomAssemble(
  bloc: BlockId,
  univers: UniversNomme,
): NomDeBloc | undefined {
  return ASSEMBLAGE.recettes.find((r) => r.bloc === bloc)?.noms[univers];
}

/** Le lieu où l'on assemble, dans un univers. */
export function lieuDAssemblage(univers: UniversNomme): LieuDAssemblage {
  return ASSEMBLAGE.lieu[univers];
}

export function recetteDe(bloc: BlockId): Recette | undefined {
  return RECETTES.find((r) => r.bloc === bloc);
}

export function recetteDeLArchipel(a: ArchipelagoId): Recette | undefined {
  return RECETTES.find((r) => r.archipelago === a);
}

/** Combien de blocs de cette recette l'inventaire permet d'assembler. */
export function assemblables(
  inventory: Partial<Record<BlockId, number>>,
  r: Recette,
): number {
  return Math.min(
    ...r.ingredients.map((i) => Math.floor((inventory[i.bloc] ?? 0) / i.n)),
  );
}

/** Ce qui manque pour assembler un bloc, bloc par bloc (vide quand on peut). */
export function manquePour(
  inventory: Partial<Record<BlockId, number>>,
  r: Recette,
): { bloc: BlockId; n: number }[] {
  return r.ingredients
    .filter((i) => (inventory[i.bloc] ?? 0) < i.n)
    .map((i) => ({ bloc: i.bloc, n: i.n - (inventory[i.bloc] ?? 0) }));
}
