// Les textes d'un univers (lot 6, une tranche de J8 avancée) : ce que disent les Gardiens, l'espèce des créatures, les
// libellés qui disent où en sont les Gardiens, le mot des grandes étapes, les noms des archipels et des rôles (GD-1). Du texte brut, affiché par React ; les clés
// viennent des identifiants stables du jeu, qu'un univers habille sans jamais les remplacer.
import type { BiomeId, BlockId } from '../blocland/biomes';
import type { ArchipelagoId, NomsArchipels } from '../blocland/world/archipelago';
import type { Tier } from '../core/progress';
import type { IslandStateId } from '../blocland/world/islandState';
import type { LieuDAssemblage, NomDeBloc } from '../blocland/world/assemblage';

export type { UniversChoice as UniversId } from '../core/univers';

/** Ce que dit la créature d'une île. */
export interface TextesCreature {
  /** Quand on arrive dans son île. */
  greeting: string;
  /** Petites phrases quand on la touche dans le village. */
  lines: string[];
  /** Quand le bâtiment de son île est fini (toutes ses parties posées, GD-6), une fois sur deux. */
  home: string;
}

/** Ce que dit un Gardien pendant son défi. */
interface TextesGardien {
  /** Au début du défi, et tant qu'il n'a rien d'autre à dire. */
  challenge: string;
  /** Épreuve réussie, épreuve ratée, et à la fin du défi réussi. */
  guardianSays: { hit: string; miss: string; beaten: string };
}

/** Les libellés qui disent où en sont les Gardiens (rallumés, dans les deux univers depuis GD-8). */
interface LibellesGardiens {
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
  /** Le Bloc-Navire a tous ses blocs, mais pas encore ses Gardiens (`piece` : ce qu'ils apportent, « la voile »). */
  navireAttend: (n: number, piece?: string) => string;
  /**
   * Ce que dit la créature du port sur les Gardiens qu'attend le kit du Bloc-Navire (`piece` : « la voile »), ou qu'il
   * est arrivé.
   */
  navireGardiens: (faits: number, total: number, archipel: string, piece: string) => string;
  /** Sur la fiche d'un archipel. */
  faitsSur: (n: number, total: number) => string;
  /** Sur la page des progrès. */
  progres: (n: number, total: number) => string;
  /** Sous le nom du Gardien, dans le panneau d'une île, quand son défi est prêt. */
  defiPret: string;
  /** L'étiquette du Gardien dont le défi est prêt, sur la page de l'île. */
  defiPretCourt: string;
  /** Le nom de l'écran du défi, pour un lecteur d'écran (`gardien` : son nom avec son article, « le Grand Chêne »). */
  arene: (gardien: string) => string;
  /**
   * Dite une fois par appareil, au premier toucher d'une île pâle, par sa créature, après l'indice d'île fermée : ce
   * qu'est un ouvrage et ce qu'il demande (des blocs ; une mission réussie pour l'escalier).
   */
  decouverteOuvrages: string;
  /** Ce que dit la créature d'une île d'un autre archipel quand le Bloc-Navire attend encore des Gardiens (`archipel` : son nom). */
  navireGardiensManquants: (n: number, archipel: string) => string;
  /** Dite une fois par appareil, à la première arrivée au port, par sa créature, après son accueil : le Bloc-Navire. */
  decouverteNavire: string;
}

/**
 * Le défi d'une sentinelle et son rallumage (lot 6, fil B2), dans un univers où les Gardiens sont des sentinelles
 * éteintes : la jauge compte les épreuves réussies, jamais celles qui restent, et le seuil est écrit.
 */
interface TextesSentinelles {
  /** La consigne du défi, qui en dit la règle (le nombre d'épreuves et le seuil sont sur la jauge). */
  consigne: string;
  /**
   * La règle en une phrase courte, toujours affichée dans l'arène : le titre du pli qui redit la règle entière, ouvert
   * au premier défi contre ce Gardien (DA-28).
   */
  regle: string;
  /** Le nom de la jauge. */
  jauge: string;
  /** Le compte de la jauge, écrit sous son nom (« 2 sur 7 »). */
  compte: (reussies: number, total: number) => string;
  /** Sous la jauge : combien il en faut, ou que c'est assez. */
  seuil: (n: number, assez: boolean) => string;
  /** Ce que lit un lecteur d'écran sur la jauge. */
  jaugeLue: (reussies: number, total: number, n: number) => string;
  /** Le mot du village, au moment où la sentinelle se rallume dans le monde (`gardien` : son nom, avec sa majuscule). */
  rallume: (gardien: string) => string;
}

/**
 * Le mot des grandes étapes d'un archipel (lot 5) : la baleine le dit dans Archipéo ; dans Blocland, la créature de
 * l'île-école de l'archipel (GD-1).
 */
interface TextesBaleine {
  /** Qui parle : la baleine, ou la créature de l'île-école de l'archipel (`school` de world/archipelago.ts). */
  parle: 'baleine' | 'ecole';
  /** La première page, à l'arrivée dans un archipel. */
  arrivee: Record<ArchipelagoId, string>;
  /** Tous les Gardiens d'un archipel (`archipel` : son nom dans l'univers, « Premiers Rivages »). */
  gardiens: (archipel: string) => string;
  /** L'île-port restaurée. */
  port: (ile: string) => string;
  /** Le premier ouvrage payé par l'élève, et l'île qu'il ouvre. */
  ouvrage: (ile: string) => string;
}

/** Ce que dit le panneau d'un monument dont l'univers change le dessin ou les mots (sa description, son message de fin). */
interface TextesMonument {
  description: string;
  done: string;
}

/** Un succès que l'univers nomme autrement (les rôles, un archipel nommé) : son titre et sa condition. */
interface TextesSucces {
  title: string;
  description: string;
}

/**
 * L'écran qui annonce, une fois par appareil, que des archipels changent de nom (GD-1, U4) : une phrase par archipel,
 * sur un seul écran, un seul bouton.
 */
export interface TextesRenommage {
  titre: string;
  intro: string;
  lignes: string[];
  bouton: string;
}

export interface TextesUnivers {
  gardiens: Record<BiomeId, TextesGardien>;
  /** Ce que dit la créature de chaque île. */
  creatures: Record<BiomeId, TextesCreature>;
  /** Le mot de chaque état d'île (« En chantier »). */
  etatsDIle: Record<IslandStateId, string>;
  /** L'espèce de la créature de chaque île (« golem de mousse »), après son nom. */
  especes: Record<BiomeId, string>;
  libelles: LibellesGardiens;
  /** Le défi en sentinelle et le moment du rallumage ; `null` : l'arène d'avant le lot 6, sans moment au village. */
  sentinelles: TextesSentinelles | null;
  baleine: TextesBaleine;
  /**
   * Les monuments que l'univers dessine ou dit autrement, par identifiant (`world/monuments.ts`) : leur nom, leurs cases
   * et leur coût restent communs ; ce qui n'est pas donné ici garde le texte de `world/monuments.ts`.
   */
  monuments: Partial<Record<string, Partial<TextesMonument>>>;
  /** Le nom de chaque archipel, sans article (« Basses Terres » → « les Basses Terres ») : les identifiants restent. */
  archipels: NomsArchipels;
  /** Le nom de chaque rôle (`Tier` de core/progress.ts) : les identifiants et les seuils restent. */
  roles: Record<Tier, string>;
  /** Les succès que l'univers nomme autrement, par identifiant (`BADGES` de core/progress.ts) ; les autres restent. */
  succes: Partial<Record<string, TextesSucces>>;
  /** L'écran des nouveaux noms, dit une fois par appareil ; `null` : rien à annoncer dans cet univers. */
  renommage: TextesRenommage | null;
  /**
   * Les noms des blocs que l'univers nomme autrement (GD-2 : les blocs assemblés), par identifiant : leur recette, leur
   * place dans les monuments et leur identifiant restent communs ; les autres gardent le nom de `BLOCKS` (biomes.ts).
   */
  blocs: NomsDesBlocs;
  /** Le lieu du village où l'on assemble les blocs (GD-2), sur l'île de l'école, à côté de la salle des trophées. */
  assemblage: TextesAssemblage;
  /**
   * Ce que dit la créature qui propose les révisions dues de son île (GD-4, étape 1), avec le titre de la mission :
   * deux phrases courtes au plus, au présent, sans échec ni date. Sans elle, la phrase commune (`RAPPEL`, communs.ts).
   */
  rappel?: (mission: string) => string;
  /**
   * Les commandes des habitants (GD-7, PR 3 ; mot neutre : les demandes) : les mots de la section et la phrase de la
   * première fois. Sans eux, l'univers ne montre pas les commandes (ni arrivée, ni liste, ni petite construction).
   */
  commandes?: TextesCommandes;
}

/** Les mots des commandes des habitants dans un univers (GD-7). */
interface TextesCommandes {
  /** Le nom de la section, le même dans le panneau d'île, le menu et la vue simple. */
  titre: string;
  /** La phrase qui explique ce qu'est une commande, tant qu'aucune n'a été livrée. */
  premiereFois: string;
  /** Le geste de la livraison, sur le bouton. */
  livrer: string;
  /** La liste, pour un lecteur d'écran. */
  liste: string;
  /**
   * Le compte, à côté du titre (« Commandes · 1 prête ») : combien sont prêtes à livrer, ou, sans aucune prête, combien
   * attendent (`n` ≥ 1).
   */
  compte: (n: number, pretes: number) => string;
  /** Une commande pas prête dont l'élève a déjà une partie des blocs : « Tu en as 1 sur 3. », écrit et lu. */
  tuEnAs: (have: number, count: number) => string;
  /** « Y aller » quand l'élève est déjà sur l'île qui donne le bloc. */
  tuYEs: string;
}

/** Les noms qu'un univers donne à des blocs (GD-2 : les blocs assemblés). */
type NomsDesBlocs = Partial<Record<BlockId, NomDeBloc>>;

/** Le lieu où l'on assemble les blocs (GD-2). */
type TextesAssemblage = LieuDAssemblage;
