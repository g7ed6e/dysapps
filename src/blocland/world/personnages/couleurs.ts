// Les couleurs des personnages d'Archipéo (lot R6), en un seul endroit : celles du bonhomme et les matières communes
// aux créatures (tenue, outil, yeux, lueur). Proposées par le directeur artistique ; la palette des archipels
// (../palette.ts) n'est lue que pour la nuit (`deNuit`), jamais écrite ici.
import type { Couleur } from '../palette';

/** Les yeux de tous les personnages : deux petites facettes sombres, sans blanc ni reflet. */
export const OEIL: Couleur = 0x1f1a16;

/** Les tenues des créatures : le lin et le cuir. */
export const TENUE = { lin: 0xcdbf9e, cuir: 0x6e4a2c } as const satisfies Record<string, Couleur>;

/** Les outils de métier : le bois, le fer et le laiton. */
export const OUTIL = { bois: 0x8a6236, fer: 0x5c6470, laiton: 0xc9a24a } as const satisfies Record<string, Couleur>;

/** Ce qui brille (lanterne, flamme, veines des sentinelles), la même lueur que celle du phare. */
export const LUEUR: Couleur = 0xffd866;

/**
 * Le bonhomme, un collégien explorateur à la silhouette neutre (cheveux courts en bataille, veste à capuche, sac) :
 * veste pétrole, sac de cuir à rabat Sable, jean, cheveux châtain sombre.
 */
export const BONHOMME = {
  veste: 0x1f4a5a,
  sac: 0x8a5a32,
  rabat: 0xdaa66a,
  jean: 0x3b5570,
  cheveux: 0x4a3222,
  peau: 0xd6a27c,
  chaussures: 0x3a2a22,
} as const satisfies Record<string, Couleur>;

/**
 * Les sentinelles (les Gardiens de pierre) : la pierre éteinte et son lichen, la pierre rallumée, les orbites (qui ne
 * s'allument jamais) et la cendre, ce que sont la flamme et les veines tant qu'elles sont éteintes (`LUEUR` rallumées).
 */
export const SENTINELLE = {
  pierre: 0x8e8c84,
  lichen: 0x7a8a6a,
  rallumee: 0xb8b2a4,
  orbite: 0x45423d,
  cendre: 0x6b6862,
} as const satisfies Record<string, Couleur>;
