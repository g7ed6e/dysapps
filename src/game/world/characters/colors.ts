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
 * La nuit, le liseré des vivants (le bonhomme et les créatures, jamais les sentinelles) du côté éclairé : clair et froid
 * (DA, 28/09) : les facettes du bord de la silhouette, vers le haut.
 */
export const LISERE_DE_NUIT: Couleur = 0xb8cce0;

/**
 * Le verre de la lanterne de Fi : ambre pâle et mat le jour, la lueur la nuit (proposition du directeur artistique,
 * 28/09, à acter par le mainteneur : pour un verre qui brille aussi le jour, `jour` redevient `LUEUR`).
 */
export const VERRE_DE_FI = { jour: 0xd9c99a, nuit: LUEUR } as const satisfies Record<string, Couleur>;

/**
 * Le bonhomme, un collégien explorateur à la silhouette neutre (cheveux courts en bataille, veste à capuche, sac) :
 * veste Nuit océan, sac de cuir à rabat Sable et bretelles de cuir sombre (plus de bande claire sur le torse), jean
 * délavé clair, cheveux châtain sombre. Deux masses qui tranchent (revue d'ensemble du directeur artistique, DA-6) : la
 * veste et les cheveux, sombres, se lisent à 3:1 au moins sur l'herbe du 6e et la roche du 5e, la veste aussi sur l'herbe du 5e ; le jean, clair, sur le
 * basalte du 4e (world/characters/painted.test.ts).
 */
export const BONHOMME = {
  veste: 0x142b38,
  sac: 0x8a5a32,
  bretelles: 0x4e3320,
  rabat: 0xdaa66a,
  jean: 0x8cadce,
  cheveux: 0x3a2618,
  peau: 0xd6a27c,
  chaussures: 0x3a2a22,
} as const satisfies Record<string, Couleur>;

/**
 * Les sentinelles (les Gardiens de pierre) : la pierre éteinte et son lichen, la pierre rallumée, les orbites (qui ne
 * s'allument jamais) et la cendre, ce que sont la flamme et les veines tant qu'elles sont éteintes (`LUEUR` rallumées) ;
 * le serti, le liseré sombre qui borde les veines du Lion de pierre : de la couleur de la pierre tant qu'elles sont
 * éteintes, il s'assombrit avec elles jusqu'à cette couleur (directeur artistique, 06/10/2026) ; l'or s'y lit à plus de
 * 3:1 (référent dys), sur la pierre grise du défi comme sur le Sable de la pierre rallumée.
 * Rallumée, la pierre se réchauffe jusqu'au Sable (#DAA66A, DA lot 6) : « brille à nouveau » se lit à la distance de
 * la vue d'archipel, sans lueur au sol ni halo, et ne se confond plus avec la pierre grise aux veines dorées du défi.
 */
export const SENTINELLE = {
  pierre: 0x8e8c84,
  lichen: 0x7a8a6a,
  rallumee: 0xdaa66a,
  orbite: 0x45423d,
  cendre: 0x6b6862,
  serti: 0x403d38,
} as const satisfies Record<string, Couleur>;
