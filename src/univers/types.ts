// Les textes d'un univers (lot 6, une tranche de J8 avancée) : ce que disent les Gardiens, l'espèce des créatures, les
// libellés qui disent où en sont les Gardiens et le mot de la baleine. Du texte brut, affiché par React ; les clés
// viennent des identifiants stables du jeu, qu'un univers habille sans jamais les remplacer.
import type { BiomeId } from '../blocland/biomes';
import type { ArchipelagoId } from '../blocland/world/archipelago';

export type UniversId = 'archipeo' | 'blocland';

/** Ce que dit un Gardien pendant son défi. */
export interface TextesGardien {
  /** Au début du défi, et tant qu'il n'a rien d'autre à dire. */
  challenge: string;
  /** Épreuve réussie, épreuve ratée, et à la fin du défi réussi. */
  guardianSays: { hit: string; miss: string; beaten: string };
}

/** Les libellés qui disent où en sont les Gardiens (vaincus dans Blocland, rallumés dans Archipéo). */
export interface LibellesGardiens {
  /** Sous le nom du Gardien, dans le panneau d'une île, quand son défi est déjà réussi. */
  dejaFait: string;
  /** Les étoiles du Gardien, dans le panneau d'une île. */
  etoiles: string;
  /** Les étoiles du Gardien, sur la page de l'île. */
  etoilesSur3: (etoiles: number) => string;
  /** Ce que lit un lecteur d'écran sur la jauge de l'arène. */
  resistance: (reste: number, total: number) => string;
  /** Ce que dit l'arène d'un Gardien dont le défi est déjà réussi (`gardien` : son nom, avec sa majuscule). */
  dejaFaitArene: (gardien: string) => string;
  /** Ce qu'il manque pour le kit du Bloc-Navire, en bref. */
  encoreAFaire: (n: number) => string;
  /** Le Bloc-Navire a tous ses blocs, mais pas encore ses Gardiens. */
  navireAttend: (n: number) => string;
  /**
   * Ce que dit la créature du port sur les Gardiens qu'attend le kit du Bloc-Navire (`piece` : « la voile »), ou qu'il
   * est arrivé.
   */
  navireGardiens: (faits: number, total: number, archipel: string, piece: string) => string;
  /** Sur la fiche d'un archipel. */
  faitsSur: (n: number, total: number) => string;
  /** Sur la page des progrès. */
  progres: (n: number, total: number) => string;
}

/** Le mot de la baleine (lot 5), aux grandes étapes d'un archipel. */
export interface TextesBaleine {
  /** La première page, à l'arrivée dans un archipel. */
  arrivee: Record<ArchipelagoId, string>;
  /** Tous les Gardiens d'un archipel (`archipel` : son nom, « Premiers Rivages »). */
  gardiens: (archipel: string) => string;
  /** L'île-port restaurée. */
  port: (ile: string) => string;
  /** Le premier ouvrage payé par l'élève, et l'île qu'il ouvre. */
  ouvrage: (ile: string) => string;
}

export interface TextesUnivers {
  gardiens: Record<BiomeId, TextesGardien>;
  /** L'espèce de la créature de chaque île (« golem de mousse »), après son nom. */
  especes: Record<BiomeId, string>;
  libelles: LibellesGardiens;
  baleine: TextesBaleine;
}
