// La palette d'Archipéo (lot R1 de la piste Rendu, docs/conception/cadrage-archipeo.md) : les couleurs du monde peint,
// par archipel, de jour et de nuit. Code pur, sans Three.js : la 3D la lit dans l’univers Archipéo (voir rendu.ts), la 2D
// peinte la lira au lot R7 ; le monde en blocs garde `AMBIENCE` et `palette()` de ./daylight, inchangés.
//
// - Le ciel : un dôme dégradé du zénith à l'horizon, avec une lueur juste au-dessus de la ligne d'horizon. La brume
//   de profondeur prend la couleur de l'horizon : le lointain se fond dans le ciel au lieu de s'y découper.
// - La lumière : un soleil chaud (la lune, froide, la nuit) et une ambiance froide venue du ciel et de la mer, qui
//   donne aux faces à l'ombre leur bleu.
// - Les surfaces : une couleur de dessus et une de côté par sol (`Ground`) et par matière (`TextureKind`, les blocs et
//   le décor), voilée d'une teinte propre à chaque archipel. La 3D les éclaire avec la couleur de jour ; la nuit
//   (`light` = 0) sert aux vues sans lumière (la 2D) : un bleu de crépuscule, jamais un noir.
import { AMBIENCE, mixColor } from './daylight';
import type { ArchipelagoId, Ground } from './map';
import type { TextureKind } from './pixels';

/** Une couleur 0xRRGGBB. */
export type Couleur = number;

const channels = (c: Couleur): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const pack = ([r, g, b]: [number, number, number]) => (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);

/** Les deux couleurs d'une surface : son dessus et ses côtés. */
export interface Faces {
  dessus: Couleur;
  cote: Couleur;
}

/** Le ciel, la brume, la mer et la lumière d'un archipel à un moment du jour. */
export interface Ciel {
  /** Le haut du dôme. */
  zenith: Couleur;
  /** La ligne d'horizon, et la brume de profondeur (la même couleur). */
  horizon: Couleur;
  /** La lueur, juste au-dessus de la ligne d'horizon. */
  lueur: Couleur;
  /** La brume de profondeur, en blocs depuis la caméra : nette avant `brumeProche`, fondue dans l'horizon à `brumeLoin`. */
  brumeProche: number;
  brumeLoin: number;
  /** Le soleil (la lune la nuit) : couleur et intensité. */
  soleil: Couleur;
  soleilForce: number;
  /** L'ambiance : la couleur venue du ciel, celle renvoyée par le sol et la mer, et son intensité. */
  ambianceCiel: Couleur;
  ambianceSol: Couleur;
  ambianceForce: number;
  /** La mer (ou le plancher de nuages des Îles du Ciel). */
  mer: Couleur;
}

type Moment = Omit<Ciel, 'brumeProche' | 'brumeLoin'>;

export interface PaletteArchipel {
  jour: Moment;
  nuit: Moment;
  /** La brume de profondeur (en blocs) : plus proche dans les Îles Brumeuses. */
  brume: [number, number];
  /** Le voile de l'archipel sur les surfaces : une teinte et sa force (0 : aucune). */
  voile: [Couleur, number];
  /** Les sols propres à l'archipel, avant le voile. */
  sols?: Partial<Record<Ground, Faces>>;
  /** Le cratère est éteint : la lave ne brille pas, elle prend sa couleur de `sols.lave` (le 6e). */
  laveEteinte?: boolean;
  /** Un monde du ciel : un plancher de nuages à la place de la mer (le 3e, repris de `AMBIENCE`). */
  nuages: boolean;
  /** La teinte de mer de la fiche, entre le lagon et le large (le plancher de nuages aux Îles du Ciel) : voir `eauxDe`. */
  teinteDeMer: Couleur;
}

/**
 * L'ambiance d'un archipel : tout ce que son sous-lot R4b règle, et rien d'autre (la fiche de famille, dans
 * docs/conception/cadrage-archipeo.md §6). Le ciel et la lumière de jour, la brume de profondeur, le voile, les sols
 * propres, la mer. La direction du soleil (`SOLEIL_DIRECTION`), la nuit (`deNuit`), les matières (`MATIERES`) et les
 * sols communs (`SOLS`) sont les mêmes pour les quatre.
 */
export type Ambiance = PaletteArchipel;

/** Le soleil vient d'en haut, à gauche et devant la vue ordinaire : les dessus et les faces vers la caméra sont éclairés. */
export const SOLEIL_DIRECTION: [number, number, number] = [-35, 60, -40];

/** L'ambiance de chaque archipel, de jour et de nuit (lue par `ambianceDe`). Toutes les nuits restent un bleu de crépuscule. */
export const PALETTES: Record<ArchipelagoId, Ambiance> = {
  // Les Premiers Rivages : un ciel d'été franc, une lueur chaude sur l'horizon, la mer turquoise.
  '6e': {
    jour: { zenith: 0x3f8ed6, horizon: 0xcfe3ec, lueur: 0xf5ecd8, soleil: 0xffe2b8, soleilForce: 2.4, ambianceCiel: 0xc2d8ee, ambianceSol: 0x5c7c86, ambianceForce: 1.05, mer: 0x1f86d4 },
    nuit: { zenith: 0x1d3262, horizon: 0x40608f, lueur: 0x5b77a3, soleil: 0xa8bce8, soleilForce: 1.1, ambianceCiel: 0x7890c6, ambianceSol: 0x2e4064, ambianceForce: 1.2, mer: 0x2a5590 },
    brume: [100, 330],
    voile: [0xf2d9a8, 0.04],
    // Le cratère du Volcan est éteint (R4b-6e) : ni lueur ni lave, un fond de basalte refroidi, un rien plus chaud.
    // Le volcan qui fume et rougeoie est la signature du 4e (fiche de famille, recommandation du directeur artistique).
    sols: { lave: { dessus: 0x5e5550, cote: 0x48413e } },
    laveEteinte: true,
    nuages: AMBIENCE['6e'].sky,
    // La mer : le vert d'eau de la fiche (`#178078`), un rien plus bleu au large.
    teinteDeMer: 0x1a7486,
  },
  // Les Îles Brumeuses (R4b-5e, design/archipeo/intentions/5e-iles-brumeuses.md §5) : une lumière diffuse de matin
  // froid, un ciel pâle, la brume plus proche. La neige du sol se peint en roche claire et froide : la seule glace
  // blanche est la calotte du Glacier (world/decor/5e.ts).
  '5e': {
    jour: { zenith: 0x6f9fc2, horizon: 0xc5d9eb, lueur: 0xe5ebe3, soleil: 0xf4f2ea, soleilForce: 2.0, ambianceCiel: 0xd2e2ee, ambianceSol: 0x64848e, ambianceForce: 1.2, mer: 0x2e7f94 },
    nuit: { zenith: 0x203764, horizon: 0x47648f, lueur: 0x5f79a1, soleil: 0xa9c0e6, soleilForce: 1.05, ambianceCiel: 0x7a93c4, ambianceSol: 0x2f4366, ambianceForce: 1.25, mer: 0x2a5684 },
    brume: [70, 260],
    voile: [0xa9c2cc, 0.11],
    sols: {
      herbe: { dessus: 0x5a7e50, cote: 0x6a6a5a },
      roche: { dessus: 0x8c9894, cote: 0x6a7f86 },
      neige: { dessus: 0xb3c1c7, cote: 0x8a9ca4 },
      glace: { dessus: 0xa6bac2, cote: 0x869ea8 },
    },
    nuages: AMBIENCE['5e'].sky,
    // La mer : la « mer rare » de la fiche, plus froide.
    teinteDeMer: 0x23789c,
  },
  // Les Anciens Ateliers : un ciel profond et une brume chaude, couleur de poussière et de forge.
  '4e': {
    jour: { zenith: 0x355f98, horizon: 0xd8b088, lueur: 0xf2b878, soleil: 0xffd8a6, soleilForce: 2.4, ambianceCiel: 0xb9cce2, ambianceSol: 0x6a6460, ambianceForce: 1.0, mer: 0x285f80 },
    nuit: { zenith: 0x1c2d5a, horizon: 0x4a5788, lueur: 0x7a6a84, soleil: 0xaab8e4, soleilForce: 1.1, ambianceCiel: 0x7a88c0, ambianceSol: 0x33385c, ambianceForce: 1.2, mer: 0x254878 },
    brume: [90, 300],
    voile: [0xc48c5c, 0.1],
    // Les sols chauds (R4b-4e) : l'herbe sèche, la roche brune ; pas de sommet blanc (la neige des Îles du Ciel) : les
    // hauts de la Falaise se peignent en roche chaude claire, assez claire pour qu'un mur de marbre s'en détache par
    // son contour en 2D (3:1), la valeur de l'intention (`#9A8E84`) passant aux côtés.
    sols: {
      herbe: { dessus: 0x6f8a3a, cote: 0x6a5040 },
      roche: { dessus: 0x7a7068, cote: 0x57504c },
      neige: { dessus: 0xccbfb0, cote: 0x9a8e84 },
    },
    nuages: AMBIENCE['4e'].sky,
    // La mer : un bleu pétrole plus sombre, sous la brume chaude.
    teinteDeMer: 0x21606e,
  },
  // Les Îles du Ciel (R4b-3e) : un bleu franc, sans lavande ; l'horizon et la lueur de nuit sont ceux du directeur
  // artistique ; la neige et la roche froides du massif, le plancher de nuages d'un blanc bleuté, jamais sable
  // (design/archipeo/intentions/3e-iles-du-ciel.md §5). La nuit reste de la famille des trois autres (revue du 3e,
  // DA-21) : zénith, lune, ambiance et plancher ramenés de 223-225° vers 210-220° (220° au zénith, 210-212° pour la
  // lune, l'ambiance et le plancher), à clarté HSL égale : fini le lilas sur le plancher de nuages.
  '3e': {
    jour: { zenith: 0x3a86cc, horizon: 0xb4d2ec, lueur: 0xeef3f4, soleil: 0xfff4e2, soleilForce: 2.3, ambianceCiel: 0xd4e4f6, ambianceSol: 0x8c9cbe, ambianceForce: 1.05, mer: 0xdde3e8 },
    nuit: { zenith: 0x233d70, horizon: 0x4c709e, lueur: 0x6e8bb2, soleil: 0xaecaea, soleilForce: 1.1, ambianceCiel: 0x80a6cb, ambianceSol: 0x455f7d, ambianceForce: 1.25, mer: 0x8aa1b7 },
    brume: [110, 350],
    voile: [0xdce8f2, 0.05],
    sols: {
      neige: { dessus: 0xe6ecef, cote: 0xc4d0de },
      roche: { dessus: 0xa3a7ad, cote: 0x6e7896 },
      herbe: { dessus: 0x74a064, cote: 0x6c6250 },
      // Les lacs de montagne : une eau sombre, bleu ardoise, jamais turquoise. Voulu pour tous les lacs du 3e (le refuge,
      // le Phare, l'Observatoire des textes, le Studio, le Château), pas seulement celui du refuge (DA, LV2-5).
      eau: { dessus: 0x46627a, cote: 0x384e62 },
    },
    nuages: AMBIENCE['3e'].sky,
    // Le plancher de nuages de la fiche.
    teinteDeMer: 0xdde3e8,
  },
};

/** L'ambiance d'un archipel (voir `Ambiance`) : la seule entrée que son sous-lot R4b écrit dans ce fichier. */
export function ambianceDe(a: ArchipelagoId): Ambiance {
  return PALETTES[a];
}

/** Le ciel d'un archipel, entre la nuit (`light` = 0) et le plein jour (1), avec `daylight().light`. */
export function cielDe(a: ArchipelagoId, light: number): Ciel {
  const p = ambianceDe(a);
  const l = Math.min(1, Math.max(0, light));
  const mix = (k: keyof Moment) => mixColor(p.nuit[k], p.jour[k], l);
  const num = (k: 'soleilForce' | 'ambianceForce') => p.nuit[k] + (p.jour[k] - p.nuit[k]) * l;
  return {
    zenith: mix('zenith'),
    horizon: mix('horizon'),
    lueur: mix('lueur'),
    brumeProche: p.brume[0],
    brumeLoin: p.brume[1],
    soleil: mix('soleil'),
    soleilForce: num('soleilForce'),
    ambianceCiel: mix('ambianceCiel'),
    ambianceSol: mix('ambianceSol'),
    ambianceForce: num('ambianceForce'),
    mer: mix('mer'),
  };
}

/**
 * La teinte qui, posée sur une texture de couleur moyenne `moyenne` (un matériau multiplie les deux), donne en moyenne
 * la couleur `cible` : la mer d'aujourd'hui, texturée, prend la couleur de la palette.
 */
export function teinteSur(cible: Couleur, moyenne: Couleur): Couleur {
  const c = channels(cible);
  const m = channels(moyenne);
  return pack([0, 1, 2].map((i) => Math.min(255, (c[i] * 255) / Math.max(1, m[i]))) as [number, number, number]);
}

/** Hauteur (sinus de l'élévation) de la lueur au-dessus de l'horizon. */
export const LUEUR = 0.06;

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * La couleur du dôme à une élévation (sinus de l'angle au-dessus de l'horizon, de −1 à 1) : l'horizon sous la ligne
 * (ce que la mer transparente laisse voir), une lueur fine juste au-dessus, puis un dégradé doux vers le zénith.
 */
export function couleurDuCiel(c: Ciel, elevation: number): Couleur {
  if (elevation <= 0) return c.horizon;
  if (elevation < LUEUR) return mixColor(c.horizon, c.lueur, Math.sin((Math.PI * elevation) / LUEUR));
  const t = Math.min(1, (elevation - LUEUR) / (1 - LUEUR));
  return mixColor(c.horizon, c.zenith, smooth(Math.pow(t, 0.55)));
}

/** Les anneaux du dôme (sinus de l'élévation) : serrés près de l'horizon, où le dégradé et la lueur se jouent. */
export const ANNEAUX_DU_CIEL = [-0.4, 0, LUEUR / 2, LUEUR, 0.12, 0.2, 0.32, 0.48, 0.66, 0.84, 1];

/**
 * Le dôme du ciel, pur : sommets (rayon 1, repère Three : Y vers le haut), couleurs 0..1 et indices. Un seul maillage,
 * un seul appel de dessin ; `segments` quartiers autour de la verticale.
 */
export function domeDuCiel(c: Ciel, segments = 24): { positions: number[]; colors: number[]; indices: number[] } {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const rings = ANNEAUX_DU_CIEL;
  for (const e of rings) {
    const r = Math.sqrt(Math.max(0, 1 - e * e));
    const col = couleurDuCiel(c, e);
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      positions.push(r * Math.cos(a), e, r * Math.sin(a));
      colors.push(((col >> 16) & 255) / 255, ((col >> 8) & 255) / 255, (col & 255) / 255);
    }
  }
  const row = segments + 1;
  for (let i = 0; i < rings.length - 1; i++)
    for (let s = 0; s < segments; s++) {
      const a = i * row + s;
      const b = a + row;
      // Vus de l'intérieur : sens des aiguilles d'une montre depuis le dehors.
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  return { positions, colors, indices };
}

// ---------- La mer (lot R3) ----------

/** Les cinq valeurs de la planche maître du pack visuel (docs/conception/cadrage-archipeo.md, §3.4). */
export const NUIT_OCEAN = 0x142b38;
export const BLEU_LAGON = 0x178078;
export const VERT_ILE = 0x438b82;
export const SABLE = 0xdaa66a;
export const BRUME = 0xe5ebe3;

/**
 * Les eaux d'un archipel, de jour, telles qu'on doit les voir sur une eau plate (la vue 3D compense la lumière, voir
 * world/mer.ts) : le lagon sur les hauts-fonds, la mer de l'archipel un peu plus loin, le large vers la Nuit océan, et
 * l'écume du rivage. Aux Îles du Ciel, le plancher de nuages : plus sombre sous les îles (`lagon`), clair au loin.
 */
export interface Eaux {
  lagon: Couleur;
  mer: Couleur;
  large: Couleur;
  ecume: Couleur;
}

/** Les eaux d'un archipel (voir `Eaux`). */
export function eauxDe(a: ArchipelagoId): Eaux {
  const p = ambianceDe(a);
  const mer = p.teinteDeMer;
  if (p.nuages)
    // Un plancher de nuages : l'ombre bleutée des îles au-dessus, le blanc des nuages, puis la couleur de l'horizon.
    return { lagon: mixColor(mer, p.jour.ambianceSol, 0.35), mer, large: mixColor(mer, p.jour.horizon, 0.5), ecume: mer };
  return {
    // Les hauts-fonds : le Bleu lagon, à peine teinté de la mer de l'archipel.
    lagon: mixColor(BLEU_LAGON, mer, 0.2),
    mer,
    // Le large : la mer de l'archipel qui s'enfonce vers la Nuit océan.
    large: mixColor(mer, NUIT_OCEAN, 0.62),
    ecume: BRUME,
  };
}

// ---------- Le rond au sol ----------

/** Le rond au sol (./rondAuSol.ts), là où va le bonhomme : un plein ivoire, cerné d'encre brune. */
export const IVOIRE = 0xfff3d6;
export const ENCRE = 0x3b2a20;
/**
 * La nuit, l'ivoire du rond prend un peu de la nuit de l'archipel (cette part, au cœur de la nuit) : sans lumière, il
 * paraîtrait collé sur la scène, mais il reste nettement plus clair que l'herbe de nuit.
 */
export const IVOIRE_DE_NUIT = 0.25;

// ---------- Les surfaces ----------

/** Les sols, de jour, avant le voile de l'archipel : la planche (herbe chaude, sable clair, roche tiède). */
export const SOLS: Record<Ground, Faces> = {
  herbe: { dessus: 0x76a860, cote: 0x8a6b4a },
  sable: { dessus: 0xe6d3a0, cote: 0xcbb27e },
  roche: { dessus: 0xa49b8c, cote: 0x867c6f },
  neige: { dessus: 0xf1f4f6, cote: 0xd0d9e2 },
  eau: { dessus: 0x3aa4bf, cote: 0x2f86a6 },
  lave: { dessus: 0xe8662c, cote: 0x9c3c20 },
  glace: { dessus: 0xd2ecf3, cote: 0xa8d0e0 },
  basalte: { dessus: 0x57525a, cote: 0x433f47 },
  mousse: { dessus: 0x6e8f4c, cote: 0x5c5040 },
};

/** Les matières (blocs, décor), de jour, avant le voile : les couleurs des blocs, adoucies vers la planche. */
export const MATIERES: Record<TextureKind, Faces> = {
  herbe: SOLS.herbe,
  terre: { dessus: 0x94704e, cote: 0x7a5a3e },
  pierre: { dessus: 0xaaa497, cote: 0x8c877c },
  planches: { dessus: 0xc09a62, cote: 0x9c7a4c },
  sable: SOLS.sable,
  verre: { dessus: 0xd4eef3, cote: 0xa9d6e0 },
  brique: { dessus: 0xd08a5e, cote: 0xb06640 },
  galet: { dessus: 0xa9b8c6, cote: 0x8193a4 },
  obsidienne: { dessus: 0x4b4058, cote: 0x352c40 },
  glace: SOLS.glace,
  toile: { dessus: 0xe8d8b8, cote: 0xbf4c40 },
  panneau: { dessus: 0xecce72, cote: 0xd8b24a },
  tourbe: { dessus: 0x5c4c30, cote: 0x44382a },
  acier: { dessus: 0xc0c8cf, cote: 0x8f99a3 },
  calque: { dessus: 0xf1ede0, cote: 0xd9d2bd },
  ardoise: { dessus: 0x5e6672, cote: 0x444b56 },
  parchemin: { dessus: 0xe6d6aa, cote: 0xccb884 },
  marbre: { dessus: 0xeeebe4, cote: 0xd5d0c7 },
  quartz: { dessus: 0xe2d9ee, cote: 0xb8a9d2 },
  prisme: { dessus: 0xfbf0c4, cote: 0xeac862 },
  lentille: { dessus: 0xcde3ee, cote: 0x82b2c8 },
  cabine: { dessus: 0xcc3e34, cote: 0xa8322c },
  cadran: { dessus: 0xf1e9d4, cote: 0xc6a250 },
  tuile: { dessus: 0xd07c4e, cote: 0xb05e36 },
  lambris: { dessus: 0x6e4c30, cote: 0x5a3e28 },
  velours: { dessus: 0x8c3050, cote: 0x782640 },
  rail: { dessus: 0x86643e, cote: 0x4e4e54 },
  antenne: { dessus: 0xb4bcc4, cote: 0x9aa4ae },
  taille: { dessus: 0xe4dac4, cote: 0xd4c8ae },
  // La dalle du Relais : pierre claire et chaude, plus sombre et plus dorée que la pierre de taille.
  dalle: { dessus: 0xc8b28a, cote: 0xa8916c },
  // L'osier du Jardin : un miel d'olive, plus vert que le bois et plus sombre que la dalle ; son motif fait le reste.
  osier: { dessus: 0xb09c5e, cote: 0x8c7a44 },
  // Le bardeau du Refuge : un bois brun chaud, entre les planches et le lambris, moins orangé que le cuivre, plus
  // sombre et plus rouge que la dalle ; jamais le gris de la pierre, de l'ardoise ou de la roche du massif.
  bardeau: { dessus: 0x9e7a56, cote: 0x7e5e40 },
  or: { dessus: 0xf0c84a, cote: 0xcca22e },
  cristal: { dessus: 0x88e8e0, cote: 0x4cbdb6 },
  feuilles: { dessus: 0x5e9a3e, cote: 0x4a8434 },
  tronc: { dessus: 0x7a5a3c, cote: 0x684a30 },
  nuage: { dessus: 0xffffff, cote: 0xeef4f9 },
  eau: SOLS.eau,
  toit: { dessus: 0xb04e3e, cote: 0x8e3e34 },
  porte: { dessus: 0x8a643a, cote: 0x70502e },
  lanterne: { dessus: 0xffd866, cote: 0xf0b634 },
  barriere: { dessus: 0xd0b07c, cote: 0xb49462 },
  escalier: { dessus: 0xc09a62, cote: 0x8a6a40 },
  mousse: SOLS.mousse,
  basalte: SOLS.basalte,
  lave: SOLS.lave,
  sapin: { dessus: 0x3a7852, cote: 0x316a48 },
  marche: { dessus: 0xa29d92, cote: 0x8a867d },
  borne: { dessus: 0x3a4a6a, cote: 0x2f3d5c },
};

/** Ce qui brille d'elle-même garde sa couleur, de jour comme de nuit (lanternes, lave). */
const LUMINEUSES = new Set<TextureKind>(['lanterne', 'lave']);


/** Multiplie deux couleurs (une surface sous une lumière colorée). */
export function multiplie(a: Couleur, b: Couleur): Couleur {
  const x = channels(a);
  const y = channels(b);
  return pack([(x[0] * y[0]) / 255, (x[1] * y[1]) / 255, (x[2] * y[2]) / 255]);
}

/**
 * Une couleur à un moment du jour, entre la nuit (0) et le jour (1) : la nuit, sous la lune, puis relevée vers l'horizon
 * de nuit, pour rester un bleu, jamais un noir. La même pour la 3D (les surfaces de la palette) et la 2D peinte (les
 * couleurs sans matière, pixel/painted.ts).
 */
export function deNuit(a: ArchipelagoId, c: Couleur, light = 0): Couleur {
  const n = ambianceDe(a).nuit;
  const nuit = mixColor(multiplie(c, n.ambianceCiel), n.horizon, 0.3);
  return mixColor(nuit, c, Math.min(1, Math.max(0, light)));
}

function surface(a: ArchipelagoId, f: Faces, light: number, lumineuse = false): Faces {
  const [teinte, force] = ambianceDe(a).voile;
  const jour = (c: Couleur) => mixColor(c, teinte, force);
  const l = Math.min(1, Math.max(0, light));
  const at = (c: Couleur) => (lumineuse ? jour(c) : deNuit(a, jour(c), l));
  return { dessus: at(f.dessus), cote: at(f.cote) };
}

/** Les couleurs d'un sol dans un archipel, entre la nuit (0) et le jour (1). */
export function couleurDuSol(a: ArchipelagoId, g: Ground, light = 1): Faces {
  return surface(a, ambianceDe(a).sols?.[g] ?? SOLS[g], light);
}

/** Les couleurs d'une matière (bloc, décor) dans un archipel, entre la nuit (0) et le jour (1). */
export function couleurDeMatiere(a: ArchipelagoId, m: TextureKind, light = 1): Faces {
  const sol = (m === 'herbe' || m === 'sable' || m === 'glace' || m === 'mousse' || m === 'basalte' || m === 'lave' || m === 'eau') && ambianceDe(a).sols?.[m];
  return surface(a, sol || MATIERES[m], light, LUMINEUSES.has(m) && !(m === 'lave' && !laveQuiBrille(a)));
}

/** La lave brille-t-elle dans cet archipel ? Non quand son ambiance dit le cratère éteint (le 6e). */
export function laveQuiBrille(a: ArchipelagoId): boolean {
  return !ambianceDe(a).laveEteinte;
}

/** Luminance relative (WCAG) d'une couleur, de 0 (noir) à 1 (blanc). */
export function luminance(c: Couleur): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = channels(c);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
