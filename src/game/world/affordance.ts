// Ce qu'on touche dans le monde de Blocland, et les bulles qui le montrent (proposition P2, choisie
// par le mainteneur le 4 octobre 2026 ; maquettes et benchmark dans la Bibliothèque, ux/navigation/). Une à trois bulles
// à la fois, seulement sur l'île où l'on est et seulement sur ce qu'on peut faire maintenant : une plaque carrée claire,
// cerclée de sombre, toujours face à l'écran et de taille fixe, avec l'icône de ce qu'on y fait (l'étoile d'une borne,
// la flamme d'un Gardien, le marteau d'un chantier, le navire) ou le bloc qu'une créature attend. La prochaine chose à
// faire a la plus grande, bordée d'or, et c'est la seule qui bouge (une montée et descente lente) ; touchée, une bulle
// s'écrase et rebondit. Ce qui n'est pas encore possible et les lieux n'ont pas de bulle : ils répondent au toucher.
// Qui est touchable (`signesDesObjets`) : une borne à faire (jamais jouée, ou jouée sans étoile) ou pas jouable, un
// Gardien pas encore rallumé, la Nef, chaque chantier en fantôme (un ouvrage, un monument à bâtir), l'école, la
// salle des trophées et un monument bâti ; leur état dit qui porte une bulle (« à faire »). Et la zone de toucher : au
// moins 48 pixels à l'écran autour d'une borne ou d'un Gardien petits (`zoneDuToucher`), qui ne remplace jamais un
// toucher direct ni une face en chantier. Code pur, sans Three.js : three/signs.ts dessine les bulles (avec les plaques
// des créatures), three/affordance.ts calcule les zones, world/budget.ts compte les bulles (`signesCost`).
import { estUnBiome, type BiomeId, type BlockId } from '../biomes';
import type { AnyIconName } from '../../components/Icon';
import { getBridge } from './archipelago';
import type { PlaceId, VoxelCube } from './cube';
import type { EtatsDesObjets } from './model';
import type { ObjetDeLaFiche } from './layout';

export type { ObjetDeLaFiche };
import type { Cell, CreaturePlacement } from './paths';
import { islandCenter, type VehiclePlacement } from './terrain';
import { SENTINELLE_DANS_LE_MONDE } from './terrain/creatures';

/** L'état d'un objet touchable : à faire (il porte une bulle), pas encore, un lieu (ils n'en portent pas). */
export type EtatDuSigne = 'aFaire' | 'pasEncore' | 'lieu';

/** Le saut d'une pile d'étoiles touchée, et la zone de toucher. */
export const SIGNE = {
  /** La bulle d'un objet, au-dessus du sommet de l'objet, en blocs (le bas de sa pointe). */
  auDessus: 0.4,
  /** Le saut au toucher d'une pile d'étoiles : une bosse de 0,2 bloc en 180 ms (70 ms de montée, 110 de descente), sans rebond. */
  saut: { hauteur: 0.2, monteeMs: 70, descenteMs: 110 },
  /** La zone de toucher d'une borne ou d'un Gardien petits, au moins ce carré à l'écran, en pixels CSS. */
  zonePx: 48,
  /** Le sol touché garde la zone d'un objet seulement à moins de tant de cases de sa boîte (une case voisine). */
  presDuSol: 1,
  /** Une zone est masquée quand le sol touché est plus proche que l'objet d'au moins tant de blocs. */
  masque: 2,
} as const;

/** Un objet touchable, tel que la vue le rend à la page quand on le touche. */
export type ObjetTouche =
  | { genre: 'borne'; id: string }
  | { genre: 'gardien'; id: BiomeId }
  | { genre: 'navire'; port: BiomeId }
  | { genre: 'ouvrage'; id: string }
  | { genre: 'lieu'; id: PlaceId; ile: BiomeId };

/** L'île et la mission d'une borne, lues de son identifiant « île:mission » ; `null` si l'île n'en est pas une. */
export function borneDe(id: string): { ile: BiomeId; mission: string } | null {
  const i = id.indexOf(':');
  const ile = id.slice(0, i);
  return i > 0 && estUnBiome(ile) ? { ile, mission: id.slice(i + 1) } : null;
}

/** La clé d'un objet : une bulle au plus par objet. */
export function cleDeLObjet(o: ObjetTouche): string {
  if (o.genre === 'navire') return 'navire';
  return `${o.genre}:${o.id}`;
}

/** Une boîte en cases du monde (le max compris : un cube en z occupe z à z + 1). */
export interface Boite {
  min: Cell;
  max: Cell;
}

/** Un objet touchable et son état, en cases du monde. */
export interface SigneDObjet {
  cle: string;
  objet: ObjetTouche;
  etat: EtatDuSigne;
  /** Le bas de sa bulle (sa pointe) : `x`, `y` sur la grille, `z` la hauteur. */
  x: number;
  y: number;
  z: number;
  /** Les îles où il est : sa bulle ne se montre que sur l'île où l'on est (un ouvrage en touche deux). */
  iles: BiomeId[];
  /** La boîte de l'objet : la zone de toucher la projette à l'écran. */
  boite: Boite;
  /**
   * Un ouvrage : le bas de sa bulle vu de chacune de ses îles, au-dessus de son bout de ce côté (sa colonne la plus
   * proche du cœur de l'île), pour que la bulle reste près de l'île où l'on est et vise l'ouvrage, pas le large.
   */
  parIle?: Partial<Record<BiomeId, { x: number; y: number; z: number }>>;
}

/** Le sommet d'un objet : le plus haut z de ses cubes, + 1 (le dessus du cube), décalé de `dz`. */
export function sommetDe(cubes: readonly { z: number }[], dz = 0): number {
  let haut = -Infinity;
  for (const c of cubes) if (c.z > haut) haut = c.z;
  return haut + 1 + dz;
}

/** La hauteur du bas de la bulle d'un objet : un peu au-dessus de son sommet. */
export function hauteurDuSigneDeLObjet(cubes: readonly { z: number }[], dz = 0): number {
  return sommetDe(cubes, dz) + SIGNE.auDessus;
}

/** La boîte de cubes, décalés de `o`. */
function boiteDe(cubes: readonly Cell[], o: Cell = { x: 0, y: 0, z: 0 }): Boite {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const c of cubes) {
    min.x = Math.min(min.x, c.x + o.x);
    min.y = Math.min(min.y, c.y + o.y);
    min.z = Math.min(min.z, c.z + o.z);
    max.x = Math.max(max.x, c.x + o.x + 1);
    max.y = Math.max(max.y, c.y + o.y + 1);
    max.z = Math.max(max.z, c.z + o.z + 1);
  }
  return { min, max };
}

/**
 * La boîte d'un personnage tel qu'il est dessiné : celle de ses cubes, ramenée à l'échelle de son dessin (`echelle`, un
 * Gardien de Blocland : 0,5, GD-11) autour du milieu de son pied.
 */
function boiteDuPersonnage(p: Pick<CreaturePlacement, 'cubes' | 'origin' | 'echelle'>): Boite {
  const b = boiteDe(p.cubes, p.origin);
  const k = p.echelle ?? 1;
  if (k === 1) return b;
  const [cx, cy, z0] = [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.min.z];
  return {
    min: { x: cx + (b.min.x - cx) * k, y: cy + (b.min.y - cy) * k, z: z0 },
    max: { x: cx + (b.max.x - cx) * k, y: cy + (b.max.y - cy) * k, z: z0 + (b.max.z - z0) * k },
  };
}

/**
 * La boîte d'un Gardien dessiné en sentinelle (Archipéo, `habillage.personnages` « modeles ») : la statue à l'échelle du
 * monde, ses pieds au milieu de la place de ses cubes (`pointDePose` de world/characters/merges.ts), pas la boîte de ses
 * cubes, qui sont ceux du Gardien de Blocland en grand : sa bulle et sa zone de toucher suivent la statue qu'on voit.
 */
function boiteDeLaSentinelle(p: Pick<CreaturePlacement, 'cubes' | 'origin'>): Boite {
  const b = boiteDe(p.cubes, p.origin);
  const [cx, cy, z0] = [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, p.origin.z];
  const d = SENTINELLE_DANS_LE_MONDE.demiLargeur;
  return { min: { x: cx - d, y: cy - d, z: z0 }, max: { x: cx + d, y: cy + d, z: z0 + SENTINELLE_DANS_LE_MONDE.hauteur } };
}

/** Un objet et sa bulle, au-dessus du milieu de sa boîte. */
function signeAuDessus(objet: ObjetTouche, etat: EtatDuSigne, iles: BiomeId[], boite: Boite): SigneDObjet {
  return { cle: cleDeLObjet(objet), objet, etat, x: (boite.min.x + boite.max.x) / 2, y: (boite.min.y + boite.max.y) / 2, z: boite.max.z + SIGNE.auDessus, iles, boite };
}

/**
 * Le sommet de chaque borne de mission (le dessus de son ardoise), par « île:mission » : la pile d'étoiles d'une borne
 * réussie s'y pose (three/markers.ts).
 */
export function sommetsDesBornes(cubes: readonly VoxelCube[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of cubes) if (c.quest) out.set(c.quest, Math.max(out.get(c.quest) ?? -Infinity, c.z + 1));
  return out;
}

/** Ce qu'il faut pour lire les objets touchables : le monde en cubes, l'état des bornes, les personnages, le navire, le reste. */
export interface EntreeDesSignes {
  cubes: readonly VoxelCube[];
  /** L'état de chaque borne (« île:mission ») : une borne sans état connu n'est pas comptée. */
  quests?: readonly { id: string; state: 'new' | 'locked' | number }[];
  creatures?: readonly CreaturePlacement[];
  vehicle?: VehiclePlacement | null;
  /** Ce que les cubes ne disent pas (world/model.ts) ; sans lui, tout ce qui n'est pas une borne à faire est « pas encore ». */
  etats?: EtatsDesObjets;
  /** Les Gardiens dessinés en cubes (Blocland, à leur échelle) ou en sentinelles (Archipéo) : leur bulle suit leur dessin. */
  gardiens?: 'cubes' | 'sentinelles';
}

/**
 * Les signes des objets touchables d'un archipel, en cases du monde : un par objet, dans cet ordre (bornes, lieux et
 * monuments, ouvrages, Gardiens, navire). Une borne d'une île fermée n'en a pas (l'île entière se lit fermée).
 */
export function signesDesObjets({ cubes, quests = [], creatures = [], vehicle = null, etats, gardiens = 'cubes' }: EntreeDesSignes): SigneDObjet[] {
  const prets = new Set(etats?.chantiersPrets ?? []);
  // Les cubes des bornes, des lieux (sans leur îlot) et des ouvrages en fantôme, en un passage.
  const bornes = new Map<string, VoxelCube[]>();
  const fermees = new Set<string>();
  const lieux = new Map<PlaceId, { cubes: VoxelCube[]; ile: BiomeId; fantome: boolean }>();
  const ouvrages = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (c.quest) {
      const l = bornes.get(c.quest);
      if (l) l.push(c);
      else bornes.set(c.quest, [c]);
      if (c.muted) fermees.add(c.quest);
    } else if (c.place && !c.sol && c.place !== 'assembly') {
      const l = lieux.get(c.place);
      if (l) {
        l.cubes.push(c);
        l.fantome ||= Boolean(c.ghost);
      } else if (estUnBiome(c.tag)) lieux.set(c.place, { cubes: [c], ile: c.tag, fantome: Boolean(c.ghost) });
    } else if (c.bridge && c.ghost) {
      const l = ouvrages.get(c.bridge);
      if (l) l.push(c);
      else ouvrages.set(c.bridge, [c]);
    }
  }
  const out: SigneDObjet[] = [];
  // Les bornes : à faire (jamais jouée, ou jouée sans étoile : elle se rejoue) ; pas jouable, pas encore ; réussies, rien
  // (leur pile d'étoiles).
  for (const q of quests) {
    const l = bornes.get(q.id);
    const borne = borneDe(q.id);
    if (!l || !borne || fermees.has(q.id) || (typeof q.state === 'number' && q.state > 0)) continue;
    out.push(signeAuDessus({ genre: 'borne', id: q.id }, q.state === 'locked' ? 'pasEncore' : 'aFaire', [borne.ile], boiteDe(l)));
  }
  // L'école, la salle des trophées, un monument bâti : des lieux. Un monument à bâtir est un chantier : à faire si l'élève
  // peut y poser un bloc, sinon pas encore.
  for (const [id, l] of lieux) {
    const monument = id.startsWith('monument:') ? id.slice('monument:'.length) : null;
    const etat: EtatDuSigne = monument && l.fantome ? (prets.has(monument) ? 'aFaire' : 'pasEncore') : 'lieu';
    out.push(signeAuDessus({ genre: 'lieu', id, ile: l.ile }, etat, [l.ile], boiteDe(l.cubes)));
  }
  // Un ouvrage en fantôme : sa bulle au-dessus de sa case du milieu (la colonne de ses cubes), pas au-dessus de sa boîte
  // entière (une liaison qui monte le mettrait haut dans le ciel).
  for (const [id, l] of ouvrages) {
    const milieu = l[Math.floor(l.length / 2)];
    const colonne = l.filter((c) => c.x === milieu.x && c.y === milieu.y);
    const def = getBridge(id);
    const iles = def ? [def.from, def.to] : estUnBiome(milieu.tag) ? [milieu.tag] : [];
    const parIle: SigneDObjet['parIle'] = {};
    for (const ile of def ? iles : []) {
      const c = islandCenter(ile);
      let bout = milieu;
      for (const cube of l) if (Math.hypot(cube.x + 0.5 - c.x, cube.y + 0.5 - c.y) < Math.hypot(bout.x + 0.5 - c.x, bout.y + 0.5 - c.y)) bout = cube;
      parIle[ile] = { x: bout.x + 0.5, y: bout.y + 0.5, z: hauteurDuSigneDeLObjet(l.filter((cube) => cube.x === bout.x && cube.y === bout.y)) };
    }
    out.push({ ...signeAuDessus({ genre: 'ouvrage', id }, prets.has(id) ? 'aFaire' : 'pasEncore', iles, boiteDe(l)), x: milieu.x + 0.5, y: milieu.y + 0.5, z: hauteurDuSigneDeLObjet(colonne), parIle });
  }
  // Un Gardien pas encore rallumé : à faire si son défi est prêt, sinon pas encore. Les créatures ont leur propre bulle.
  for (const g of creatures) {
    if (g.kind !== 'guardian' || g.beaten || !g.cubes.length) continue;
    const pret = etats ? etats.gardiensPrets.includes(g.id) : true;
    out.push(signeAuDessus({ genre: 'gardien', id: g.id }, pret ? 'aFaire' : 'pasEncore', [g.id], gardiens === 'sentinelles' ? boiteDeLaSentinelle(g) : boiteDuPersonnage(g)));
  }
  // La Nef : à faire s'il a un bloc à poser ou s'il peut partir, sinon pas encore.
  if (vehicle?.cubes.length)
    out.push(signeAuDessus({ genre: 'navire', port: vehicle.port }, etats?.navirePret ? 'aFaire' : 'pasEncore', [vehicle.port], boiteDe(vehicle.cubes, vehicle.origin)));
  return out;
}

/**
 * Le centre de l'objet d'une fiche, en cases du monde (`x`, `y` au sol, `z` en hauteur), lu dans ses cubes : une borne,
 * un lieu, un ouvrage, un Gardien ou une créature (à sa place de départ), le navire ; une île, son cœur (`ile`, donné
 * par l'appelant). `null` si l'objet n'est pas dans le monde.
 */
export function centreDeLObjet(
  objet: ObjetDeLaFiche | ObjetTouche,
  { cubes, creatures = [], vehicle = null, ile }: Pick<EntreeDesSignes, 'cubes' | 'creatures' | 'vehicle'> & { ile?: (id: BiomeId) => Cell },
): Cell | null {
  const centre = (b: Boite): Cell => ({ x: (b.min.x + b.max.x) / 2, y: (b.min.y + b.max.y) / 2, z: (b.min.z + b.max.z) / 2 });
  const deCubes = (garder: (c: VoxelCube) => boolean) => {
    const l = cubes.filter(garder);
    return l.length ? centre(boiteDe(l)) : null;
  };
  switch (objet.genre) {
    case 'borne':
      return deCubes((c) => c.quest === objet.id);
    case 'ouvrage':
      return deCubes((c) => c.bridge === objet.id);
    case 'lieu':
      return deCubes((c) => c.place === objet.id && !c.sol);
    case 'navire':
      return vehicle?.cubes.length ? centre(boiteDe(vehicle.cubes, vehicle.origin)) : null;
    case 'gardien':
    case 'creature': {
      const gardien = objet.genre === 'gardien';
      const p = creatures.find((c) => c.id === objet.id && (c.kind === 'guardian') === gardien);
      return p?.cubes.length ? centre(boiteDuPersonnage(p)) : null;
    }
    case 'ile':
      return ile ? ile(objet.id) : null;
  }
}

// ---- Le mouvement

/**
 * Le saut d'une pile d'étoiles au toucher, en blocs, `ms` millisecondes après le doigt levé : 0 avant et après ; une seule bosse,
 * vive (un quart de sinus pour monter, un quart de cosinus pour redescendre), sans rebond. Rien à voir avec le saut lent
 * des révisions (world/sign.ts), qui dit « j'ai quelque chose pour toi » : celui-ci dit « je t'ai entendu ».
 */
export function sautDuSigne(ms: number): number {
  const { hauteur, monteeMs, descenteMs } = SIGNE.saut;
  if (!(ms > 0) || ms >= monteeMs + descenteMs) return 0;
  if (ms < monteeMs) return hauteur * Math.sin((Math.PI / 2) * (ms / monteeMs));
  return hauteur * Math.cos((Math.PI / 2) * ((ms - monteeMs) / descenteMs));
}

// ---- Les bulles

/** Les bulles : combien, leur taille à l'écran, leur mouvement (P2, 4 octobre 2026). */
export const BULLE = {
  /** Trois au plus à la fois, sur l'île où l'on est. */
  max: 3,
  /** Le côté de la plaque à l'écran, en pixels CSS ; celle de la prochaine chose à faire est plus grande. */
  px: 56,
  prochainePx: 64,
  /** La prochaine chose à faire monte et descend : ± 2 pixels, en 2,4 s, sans rebond (rien avec le mouvement réduit). */
  flotte: { amplitudePx: 2, periodeS: 2.4 },
  /** Touchée, la bulle s'écrase (90 %) en 80 ms, puis revient en débordant un peu (105 %) et se pose, en 180 ms. */
  rebond: { ecrase: 0.9, deborde: 1.05, ecraseMs: 80, reviensMs: 180 },
  /**
   * Une bulle reste entière dans la place que l'interface laisse libre (hors de la barre du bas, du bouton Pause, de la
   * rangée des classes, d'une fiche), à 8 pixels de ses bords ; tenue au bord, elle perd sa pointe.
   */
  bordPx: 8,
} as const;

/** Ce que montre une bulle : une icône, ou le bloc demandé (une commande). */
export type ImageDeLaBulle = { icone: AnyIconName } | { bloc: BlockId };

/** Ce que touche une bulle : un objet, ou une créature. */
export type CibleDeLaBulle = ObjetTouche | { genre: 'creature'; id: BiomeId };

/** Une bulle possible, avant le choix des trois. */
export interface Candidate {
  cle: string;
  cible: CibleDeLaBulle;
  image: ImageDeLaBulle;
  iles: readonly BiomeId[];
  /** L'ordre quand il y en a plus de trois : le plus petit d'abord. */
  rang: number;
}

/** L'icône de ce qu'on fait sur un objet : celle du bouton de sa fiche (Jouer gagne des étoiles). */
export function iconeDeLObjet(o: ObjetTouche): AnyIconName {
  if (o.genre === 'borne') return 'star';
  if (o.genre === 'gardien') return 'flame';
  if (o.genre === 'navire') return 'ship';
  return 'hammer';
}

/**
 * Sur la Carte (Blocland), l'image de la bulle d'or de la prochaine destination : celle de ce qu'on y fait, pour
 * que le même signe dise la même chose partout (piste B, choisie par le mainteneur le 4 octobre 2026). Une commande :
 * le bloc demandé ; un ouvrage : l'icône des ouvrages (GD-7 : celle du pli Ouvrages et de Mes blocs, celle de la
 * maquette choisie) ; la Nef : le navire ; sinon (une mission, une île à reprendre) : l'étoile de « Jouer ».
 */
export function imageDeLaDestination(d: { ouvrage?: string; commande?: string; story?: string }, o: { navire: boolean; bloc?: BlockId }): ImageDeLaBulle {
  if ((d.commande || d.story) && o.bloc) return { bloc: o.bloc };
  if (d.ouvrage) return { icone: 'ouvrage' };
  if (o.navire) return { icone: 'ship' };
  return { icone: 'star' };
}

/** L'ordre des bulles : une commande prête d'abord, puis les bornes, les Gardiens, les chantiers, le navire, les révisions. */
const RANGS = { commande: 0, borne: 1, gardien: 2, ouvrage: 3, lieu: 3, navire: 4, revisions: 5 } as const;

/** La clé de la bulle d'une créature. */
export const cleDeLaCreature = (id: BiomeId): string => `creature:${id}`;

/**
 * Les bulles possibles : chaque objet à faire (`signesDesObjets`), avec l'icône de ce qu'on y fait, et chaque créature
 * qui fait signe (une commande : le bloc demandé ; des révisions : l'icône de la notion).
 */
export function bullesPossibles(objets: readonly SigneDObjet[], creatures: readonly { id: BiomeId; icone: AnyIconName; bloc?: BlockId }[]): Candidate[] {
  const out: Candidate[] = [];
  for (const s of objets) if (s.etat === 'aFaire') out.push({ cle: s.cle, cible: s.objet, image: { icone: iconeDeLObjet(s.objet) }, iles: s.iles, rang: RANGS[s.objet.genre] });
  for (const c of creatures)
    out.push({ cle: cleDeLaCreature(c.id), cible: { genre: 'creature', id: c.id }, image: c.bloc ? { bloc: c.bloc } : { icone: c.icone }, iles: [c.id], rang: c.bloc ? RANGS.commande : RANGS.revisions });
  return out;
}

/**
 * Les bulles montrées : celles de l'île `ile` (celle où l'on est), trois au plus, la prochaine chose à faire
 * (`prochaine`, une clé : la prochaine destination) d'abord, puis par rang, puis dans l'ordre donné. Seule la prochaine
 * est mise en avant, et seulement si elle est sur cette île : sinon aucune (la bulle d'or dit la même chose que la
 * prochaine destination, jamais autre chose). Aucune sans île.
 */
export function bullesMontrees<T extends Pick<Candidate, 'cle' | 'iles' | 'rang'>>(liste: readonly T[], ile: BiomeId | null, prochaine: string | null): { bulle: T; enAvant: boolean }[] {
  if (!ile) return [];
  const ici = liste.map((b, i) => ({ b, i })).filter(({ b }) => b.iles.includes(ile));
  ici.sort((x, y) => Number(y.b.cle === prochaine) - Number(x.b.cle === prochaine) || x.b.rang - y.b.rang || x.i - y.i);
  return ici.slice(0, BULLE.max).map(({ b }, i) => ({ bulle: b, enAvant: i === 0 && b.cle === prochaine }));
}

/** La montée et descente de la bulle mise en avant, en pixels CSS, au temps `t` de la scène (en secondes). */
export function flottementDeLaBulle(t: number): number {
  return BULLE.flotte.amplitudePx * Math.sin((2 * Math.PI * t) / BULLE.flotte.periodeS);
}

/**
 * L'échelle d'une bulle touchée, `ms` millisecondes après le doigt levé : 1 avant et après ; elle s'écrase, revient un
 * peu trop grande, puis se pose (un seul aller-retour, sans oscillation).
 */
export function rebondDeLaBulle(ms: number): number {
  const { ecrase, deborde, ecraseMs, reviensMs } = BULLE.rebond;
  if (!(ms > 0) || ms >= ecraseMs + reviensMs) return 1;
  if (ms < ecraseMs) return 1 - (1 - ecrase) * Math.sin((Math.PI / 2) * (ms / ecraseMs));
  const u = (ms - ecraseMs) / reviensMs;
  return u < 0.5 ? ecrase + (deborde - ecrase) * Math.sin(Math.PI * u) : 1 + (deborde - 1) * Math.sin(Math.PI * u);
}

/** Les triangles et appels de dessin des bulles : trois quadrilatères au plus, dans le maillage des plaques des créatures. */
export const COUT_DES_BULLES = { triangles: 2 * BULLE.max, drawCalls: 1 } as const;

// ---- La zone de toucher

/** La zone de toucher d'un objet à l'écran : son centre et sa taille en pixels CSS, et la distance de son objet à la caméra (en blocs). */
export interface ZoneDeToucher {
  x: number;
  y: number;
  w: number;
  h: number;
  /** La distance de la caméra au point le plus proche de l'objet. */
  distance: number;
  /**
   * Là où deux zones se chevauchent, celle de plus haute priorité gagne (0 par défaut) : une borne (1) passe avant un
   * Gardien, que le Gardien se tienne près des bornes (GD-11, référent dys, téléphone).
   */
  priorite?: number;
}

/** La zone de toucher d'un objet, et sa boîte en cases du monde (le sol touché tout près d'elle garde la zone). */
export interface ZoneDObjet extends ZoneDeToucher {
  boite: Boite;
}

/** La zone de toucher d'un rectangle à l'écran (l’objet projeté) : élargie à `SIGNE.zonePx` au moins, autour de son centre. */
export function zoneDeToucher(x0: number, y0: number, x1: number, y1: number, distance: number): ZoneDeToucher {
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.max(SIGNE.zonePx, x1 - x0), h: Math.max(SIGNE.zonePx, y1 - y0), distance };
}

/**
 * La zone retenue sous le doigt levé, parmi les zones qui le contiennent : la plus haute priorité (`priorite` : une
 * borne avant un Gardien), puis celle dont le centre est le plus proche du doigt (en pixels), puis l'objet le plus
 * proche de la caméra. Une zone est écartée quand le sol touché (`sol`, sa
 * distance le long du rayon, ou `null`) est plus proche que l'objet de `SIGNE.masque` blocs : l'objet est caché derrière
 * une colline, une maison ; et quand `garde` la refuse (appelée seulement pour une zone qui contient le doigt). L'indice
 * dans `zones`, ou −1.
 */
export function zoneRetenue(zones: readonly ZoneDeToucher[], doigt: { x: number; y: number }, sol: number | null, garde?: (i: number) => boolean): number {
  let best = -1;
  let bestPx = Infinity;
  let bestPriorite = -Infinity;
  zones.forEach((z, i) => {
    if (Math.abs(doigt.x - z.x) > z.w / 2 || Math.abs(doigt.y - z.y) > z.h / 2) return;
    if (sol !== null && sol < z.distance - SIGNE.masque) return;
    const priorite = z.priorite ?? 0;
    if (priorite < bestPriorite) return;
    const px = Math.hypot(doigt.x - z.x, doigt.y - z.y);
    if (priorite === bestPriorite && (px > bestPx || (px === bestPx && z.distance >= zones[best].distance))) return;
    if (garde && !garde(i)) return;
    best = i;
    bestPx = px;
    bestPriorite = priorite;
  });
  return best;
}

/** Le nombre de cases vides entre une case du sol et la boîte d'un objet, sur la grille (0 : la case la touche ou est dessous). */
export function ecartALaBoite(c: { x: number; y: number }, boite: Boite): number {
  const gx = Math.max(0, boite.min.x - (c.x + 1), c.x - boite.max.x);
  const gy = Math.max(0, boite.min.y - (c.y + 1), c.y - boite.max.y);
  return Math.max(gx, gy);
}

/**
 * Ce que le doigt a touché directement, le long du rayon (world/scene.ts, `toucheRetenue`) : un objet (une borne, un
 * lieu, un ouvrage, une créature, le navire), une face en chantier, le sol d'une île (sa case et sa distance), ou rien
 * (le vide, le ciel : `null`).
 */
export type ToucherDirect = { genre: 'objet' } | { genre: 'face' } | { genre: 'sol'; case: { x: number; y: number }; distance: number } | null;

/**
 * La priorité d'un toucher (affordance-blocland.md §9) : l'indice de la zone qui le prend, ou −1 quand le toucher
 * direct garde la main.
 * - Un objet touché directement passe toujours : −1.
 * - Une face en chantier n'est jamais remplacée (le toucher y pose le bloc) : −1.
 * - Le sol d'une île : seulement une zone dont l'objet est à moins d'une case (`SIGNE.presDuSol`) de la case touchée,
 *   et qui n'est pas cachée derrière ce sol ; sinon le bonhomme y va.
 * - Le vide ou le ciel : la zone la plus proche du doigt, sauf un objet dont le centre est caché (`estCache`, un rayon
 *   lancé vers lui ; appelé seulement pour une zone qui contient le doigt).
 */
export function zoneDuToucher(direct: ToucherDirect, zones: readonly ZoneDObjet[], doigt: { x: number; y: number }, estCache?: (i: number) => boolean): number {
  if (direct === null) return zoneRetenue(zones, doigt, null, estCache && ((i) => !estCache(i)));
  if (direct.genre !== 'sol') return -1;
  return zoneRetenue(zones, doigt, direct.distance, (i) => ecartALaBoite(direct.case, zones[i].boite) < SIGNE.presDuSol);
}
