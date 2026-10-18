// Les Détours du monde continu (GD-20, déplacement libre, lot 2, piste B « Les sentes qui restent », choix du mainteneur
// du 18 octobre 2026) : un endroit hors des chemins par terre, que l'élève trouve en marchant. Quatre sommets de colline
// posés à la main (plan6e.ts, `DETOUR_HILLS` ; leur relief : terrain.ts) et un bord d'eau. Trois pierres plates au pied
// de chacun le signalent, sans texte. Quand Kéo s'y arrête, la vue monte (la caméra, camera.ts) et le nom s'écrit une
// fois ; au bord d'eau, la baleine fait surface et les oiseaux se lèvent ; au cairn de la Braise, un seul geste le
// rallume. Après la première arrivée, une sente reste tracée pour de bon, du chemin le plus proche jusqu'au Détour, dans
// le monde et sur la Carte. Ni compteur, ni liste, ni récompense. Les places et les noms : le consultant d'Archipéo ; la
// forme : l'artiste technique 3D ; les durées : le référent dys. Code pur.
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, type Vec2 } from './geometry';
import type { World } from '../../engine/state';
import type { LandId } from './lands';
import { snapToNetwork } from './paths';
import { LAMP_COLOR } from './places';
import { COLORS_6E, DETOUR_HILL, DETOUR_HILLS, type DetourHill } from './plan6e';
import { detourFoot, detourReach, heightAt, landDistance, standingHeight } from './terrain';

/** Les cinq Détours, un par terre. */
export const DETOUR_IDS = ['butte-chantier', 'braise-herons', 'bout-large', 'colline-aube', 'haut-cretes'] as const;
export type DetourId = (typeof DETOUR_IDS)[number];

/** Ce qu'est un Détour : un sommet, le sommet au cairn à rallumer, ou un bord d'eau. */
export type DetourKind = 'sommet' | 'cairn' | 'rive';

export interface Detour {
  id: DetourId;
  /** Sa terre (on n'y marche qu'une fois la terre ouverte). */
  land: LandId;
  /** Son nom, écrit une fois et lu à l'arrivée (consultant d'Archipéo). */
  name: string;
  kind: DetourKind;
  /** Là où Kéo arrive : le centre du plateau, ou le bord d'eau. */
  at: Vec2;
  /** Le rayon où Kéo est arrivé. */
  radius: number;
  /** Le pied, où sont les trois pierres : celui de la rampe, ou le bord d'eau lui-même. */
  foot: Vec2;
  /** Le sens de la rampe (ou, au bord d'eau, celui du large), en radians dans le plan. */
  face: number;
  /** La sente, du point du chemin le plus proche jusqu'à `at`, en passant par le pied. */
  sente: readonly Vec2[];
}

/**
 * Le bord d'eau du Large (le Bout du Large) : à quelques pas de l'eau, sur la pointe ouest, d'où l'on voit le large ; la
 * baleine fait surface plus loin, vers `face`.
 */
const SHORE = { at: { x: -165, z: 91 }, radius: 2.5 } as const;

/** Les noms et les sortes, dans l'ordre de `DETOUR_IDS`. */
const SPECS: Readonly<Record<DetourId, { land: LandId; name: string; kind: DetourKind; from?: Vec2 }>> = {
  'butte-chantier': { land: 'pointe', name: 'La Butte du Chantier', kind: 'sommet' },
  'braise-herons': { land: 'couchant', name: 'La Braise des Hérons', kind: 'cairn' },
  'bout-large': { land: 'large', name: 'Le Bout du Large', kind: 'rive' },
  'colline-aube': { land: 'levant', name: "La Colline de l'Aube", kind: 'sommet' },
  // Le chemin le plus proche passe au bord de la rivière, en contrebas : la sente part du point d'après, sur le sol sec.
  'haut-cretes': { land: 'cretes', name: 'Le Haut des Crêtes', kind: 'sommet', from: { x: 64.5, z: -120.5 } },
};

/** Le sens du large depuis un point de la côte : celui où la distance à la terre descend le plus vite. */
function seaward(p: Vec2): number {
  const e = 1;
  const gx = landDistance({ x: p.x + e, z: p.z }) - landDistance({ x: p.x - e, z: p.z });
  const gz = landDistance({ x: p.x, z: p.z + e }) - landDistance({ x: p.x, z: p.z - e });
  return Math.atan2(-gz, -gx);
}

/** La sente d'un Détour : du point du chemin le plus proche de son pied (ou de `from`), jusqu'à lui. */
function senteOf(foot: Vec2, at: Vec2, from?: Vec2): Vec2[] {
  const start = from ?? snapToNetwork(foot).at;
  const line = [start];
  if (distance(foot, start) > 0.5) line.push(foot);
  if (distance(at, foot) > 0.5) line.push(at);
  return line;
}

function detourOf(id: DetourId): Detour {
  const { from, ...spec } = SPECS[id];
  const hill = DETOUR_HILLS.find((h) => h.id === id);
  if (hill) {
    const foot = detourFoot(hill);
    return { id, ...spec, at: hill.at, radius: DETOUR_HILL.plateau + 0.3, foot, face: hill.face, sente: senteOf(foot, hill.at, from) };
  }
  return { id, ...spec, at: SHORE.at, radius: SHORE.radius, foot: SHORE.at, face: seaward(SHORE.at), sente: senteOf(SHORE.at, SHORE.at, from) };
}

/** Les cinq Détours, tirés une fois. */
export const DETOURS: readonly Detour[] = DETOUR_IDS.map(detourOf);

export const detourById = (id: DetourId): Detour => DETOURS.find((d) => d.id === id)!;

export const isDetourId = (id: unknown): id is DetourId => typeof id === 'string' && (DETOUR_IDS as readonly string[]).includes(id);

/** La colline d'un Détour, ou rien (le bord d'eau). */
export const hillOfDetour = (id: DetourId): DetourHill | undefined => DETOUR_HILLS.find((h) => h.id === id);

/** Le Détour où se tient Kéo en `p`, ou rien. */
export function detourAtPoint(p: Vec2): Detour | null {
  for (const d of DETOURS) if (distance(p, d.at) <= d.radius) return d;
  return null;
}

/** La place que la végétation laisse libre : la sente, de part et d'autre, et autour du bord d'eau. */
const KEEP = { sente: 1.6, shore: 4 } as const;

/**
 * Rien ne pousse là ? Sur une colline de Détour (ses pans restent nus, sa rampe libre), le long d'une sente et autour du
 * bord d'eau (flora.ts) : le chemin du Détour reste toujours marchable.
 */
export function keptClearForDetour(p: Vec2): boolean {
  for (const h of DETOUR_HILLS) if (distance(p, h.at) < detourReach(h)) return true;
  for (const d of DETOURS) {
    if (distanceToPolyline(p, d.sente) < KEEP.sente) return true;
    if (d.kind === 'rive' && distance(p, d.at) < KEEP.shore) return true;
  }
  return false;
}

/** Les Détours trouvés, dans l'ordre de `DETOUR_IDS`, sans doublon ni inconnu (la sauvegarde). */
export function sanitizeDetours(raw: unknown): DetourId[] {
  if (!Array.isArray(raw)) return [];
  return DETOUR_IDS.filter((id) => raw.includes(id));
}

/** Un Détour trouvé : sa sente reste tracée. Le même état s'il l'était déjà (rien à écrire). */
export function findDetour<S extends { world: World }>(state: S, id: DetourId): S {
  const found = state.world.detours ?? [];
  if (found.includes(id)) return state;
  return { ...state, world: { ...state.world, detours: sanitizeDetours([...found, id]) } };
}

/** Le cairn d'un Détour trouvé, rallumé pour de bon. Le même état s'il l'était déjà, ou si ce n'est pas un cairn trouvé. */
export function lightDetour<S extends { world: World }>(state: S, id: DetourId): S {
  const lit = state.world.detoursLit ?? [];
  if (lit.includes(id) || detourById(id).kind !== 'cairn' || !(state.world.detours ?? []).includes(id)) return state;
  return { ...state, world: { ...state.world, detoursLit: sanitizeDetours([...lit, id]) } };
}

/**
 * Les durées et les mesures de l'arrivée (référent dys, avis du 18 octobre 2026) : Kéo immobile `settle` secondes sur
 * le Détour avant que rien ne bouge ; la vue monte en `rise` secondes et revient en `fall` ; le nom reste `name`
 * secondes au moins, puis s'efface en `nameFade` ; la baleine et les oiseaux partent `faunaDelay` secondes après l'arrêt
 * et ne reviennent pas avant `faunaAgain` secondes ; le cairn s'allume en `light` secondes.
 */
export const DETOUR_TIMING = { settle: 0.4, rise: 1.2, fall: 0.8, name: 4, nameFade: 0.3, faunaDelay: 2.5, faunaAgain: 10, light: 0.5 } as const;

/** Les couleurs (directeur artistique, piste B) : les pierres claires, le cairn de la roche, le fanal éteint et sa flamme. */
const C = {
  stone: 0xc9c0ae,
  stoneSide: 0xa9a08f,
  cairn: COLORS_6E.rock,
  cairnTop: 0xaba396,
  // Le fanal éteint : un creux brun, jamais noir ; allumé, la flamme (la lampe du monde, que la vue dessine sans ombre).
  hollow: 0x6e5e4a,
} as const;

/** Les trois pierres plates, autour du pied, de part et d'autre de la sente (jamais dessus). */
function stones(b: FacetBuilder, d: Detour): void {
  const ux = Math.cos(d.face);
  const uz = Math.sin(d.face);
  const spots = [
    { lat: -2.7, along: -0.6, r: 0.55 },
    { lat: 2.6, along: -0.2, r: 0.5 },
    { lat: -3.5, along: 0.7, r: 0.4 },
  ];
  for (const [k, s] of spots.entries()) {
    const x = d.foot.x + ux * s.along - uz * s.lat;
    const z = d.foot.z + uz * s.along + ux * s.lat;
    const y = standingHeight(heightAt({ x, z })) - 0.05;
    b.prism({ x, y, z, yaw: d.face + k }, s.r, s.r * 0.85, 0.22, 6, C.stoneSide, C.stone);
  }
}

/** La place du cairn sur le plateau de la Braise : à côté du centre, pour que Kéo s'arrête au centre. */
export function cairnSpot(d: Detour): Vec2 {
  const a = d.face + Math.PI / 2;
  return { x: d.at.x + Math.cos(a) * 1.5, z: d.at.z + Math.sin(a) * 1.5 };
}

/** Le cairn : quatre pierres empilées, puis le fanal au sommet, éteint (un creux) ou allumé (une flamme). */
function cairn(b: FacetBuilder, d: Detour, lit: boolean): void {
  const c = cairnSpot(d);
  let y = standingHeight(heightAt(c)) - 0.05;
  const rings = [
    { r: 0.62, h: 0.32 },
    { r: 0.5, h: 0.3 },
    { r: 0.4, h: 0.28 },
    { r: 0.3, h: 0.24 },
  ];
  for (const [k, ring] of rings.entries()) {
    b.prism({ x: c.x, y, z: c.z, yaw: k * 0.7 }, ring.r, ring.r * 0.88, ring.h, 6, C.cairn, C.cairnTop);
    y += ring.h;
  }
  // Le fanal : une coupelle, puis la flamme (une pointe) ou le creux.
  b.prism({ x: c.x, y, z: c.z }, 0.22, 0.3, 0.14, 6, C.cairn, lit ? LAMP_COLOR : C.hollow);
  if (lit) b.prism({ x: c.x, y: y + 0.14, z: c.z }, 0.17, 0, 0.42, 5, LAMP_COLOR);
}

/**
 * La sente : de la terre battue, plus sombre que le liseré des chemins, en pointillé, plus étroite qu'un chemin (référent
 * dys : trait plus fin, pointillé, 3:1 au moins avec la prairie et l'herbe à mi-hauteur ; jamais presque-noire).
 * Les pointillés : un trait de `dash` unités, un vide de `gap`, de demi-largeur `half`, à `lift` au-dessus du sol. */
export const SENTE = { dash: 1.0, gap: 0.6, half: 0.35, lift: 0.025, color: 0x735e3a } as const;

/** La sente d'un Détour, en pointillé, posée sur le sol. */
function senteRibbon(b: FacetBuilder, d: Detour): void {
  const line = d.sente;
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const c = line[i];
    const len = distance(a, c);
    const dx = (c.x - a.x) / len;
    const dz = (c.z - a.z) / len;
    let s = carry;
    while (s < len) {
      const e = Math.min(len, s + SENTE.dash);
      const y = (t: number) => standingHeight(heightAt({ x: a.x + dx * t, z: a.z + dz * t })) + SENTE.lift;
      const p = (t: number, o: number) => [a.x + dx * t + dz * o, y(t), a.z + dz * t - dx * o] as const;
      // Un trait coupé en morceaux d'au plus 0,5 unité, pour suivre la pente de la rampe.
      for (let t = s; t < e - 1e-6; t += 0.5) {
        const t1 = Math.min(e, t + 0.5);
        b.quad(p(t, SENTE.half), p(t, -SENTE.half), p(t1, -SENTE.half), p(t1, SENTE.half), SENTE.color);
      }
      s = e + SENTE.gap;
    }
    carry = s - len;
  }
}

/**
 * Le décor des Détours : les pierres de tous, le cairn (allumé ou non), et les sentes des Détours trouvés. Un seul jeu
 * de facettes, que la vue ajoute au maillage des lieux (aucun appel de plus).
 */
export function detourFacets(found: readonly DetourId[], cairnLit: boolean): Facets {
  const b = new FacetBuilder();
  for (const d of DETOURS) {
    stones(b, d);
    if (d.kind === 'cairn') cairn(b, d, cairnLit);
    if (found.includes(d.id)) senteRibbon(b, d);
  }
  return b.build();
}

/** Les mesures de la baleine et des oiseaux (référent dys : à plus de 12 unités de Kéo, jamais au centre de l'écran). */
export const FAUNA = { whaleOff: 22, whaleSide: 9, birds: 5, birdRadius: 3.2, birdTurn: 9, birdRise: 3.5, surface: 3.2 } as const;

/**
 * La baleine : un dos long et bas, sa nageoire et sa queue en éventail, en aplats gris-bleu (le concept des
 * personnages, baleine et oiseaux), le dos vers +y, la tête vers +x. Environ 60 triangles.
 */
export function whaleFacets(): Facets {
  const b = new FacetBuilder();
  const back = 0x5d7389;
  const belly = 0x8ea3b4;
  // Le dos : un fuseau à six pans, coupé sous l'eau (seul le dessus se voit).
  const L = 5;
  const sect = [
    { x: -L / 2, r: 0.25 },
    { x: -L / 4, r: 0.75 },
    { x: L / 8, r: 0.95 },
    { x: L / 2 - 0.3, r: 0.55 },
    { x: L / 2, r: 0.1 },
  ];
  const ring = (x: number, r: number) => Array.from({ length: 6 }, (_, k) => [x, r * Math.sin((Math.PI * k) / 5) * 0.6, r * Math.cos((Math.PI * k) / 5)] as const);
  for (let i = 1; i < sect.length; i++) {
    const p = ring(sect[i - 1].x, sect[i - 1].r);
    const q = ring(sect[i].x, sect[i].r);
    for (let k = 0; k < 5; k++) b.quad(p[k], q[k], q[k + 1], p[k + 1], k === 0 || k === 4 ? belly : back);
  }
  // La nageoire du dos, puis la queue.
  b.triangle([-0.2, 0.5, 0], [0.5, 0.5, 0], [-0.4, 0.95, 0], back);
  b.triangle([0.5, 0.5, 0], [-0.2, 0.5, 0], [-0.4, 0.95, 0], back);
  const tx = -L / 2;
  b.triangle([tx, 0.1, 0], [tx - 0.9, 0.5, 1.1], [tx - 0.6, 0.15, 0], back);
  b.triangle([tx, 0.1, 0], [tx - 0.6, 0.15, 0], [tx - 0.9, 0.5, -1.1], back);
  b.triangle([tx - 0.6, 0.15, 0], [tx - 0.9, 0.5, 1.1], [tx, 0.1, 0], back);
  b.triangle([tx - 0.9, 0.5, -1.1], [tx - 0.6, 0.15, 0], [tx, 0.1, 0], back);
  return b.build();
}

/** Un oiseau de mer : deux ailes en V ouvert et un corps, blancs, la tête vers +x. Huit triangles. */
export function birdFacets(): Facets {
  const b = new FacetBuilder();
  const white = 0xf2f1ea;
  const tip = 0x9aa3a8;
  b.triangle([0.25, 0, 0], [-0.1, 0.12, 0.55], [-0.2, 0, 0], white);
  b.triangle([-0.2, 0, 0], [-0.1, 0.12, 0.55], [0.25, 0, 0], white);
  b.triangle([-0.2, 0, 0], [-0.1, 0.12, -0.55], [0.25, 0, 0], white);
  b.triangle([0.25, 0, 0], [-0.1, 0.12, -0.55], [-0.2, 0, 0], white);
  b.triangle([-0.1, 0.12, 0.55], [-0.25, 0.16, 0.85], [-0.2, 0, 0], tip);
  b.triangle([-0.2, 0, 0], [-0.25, 0.16, 0.85], [-0.1, 0.12, 0.55], tip);
  b.triangle([-0.2, 0, 0], [-0.25, 0.16, -0.85], [-0.1, 0.12, -0.55], tip);
  b.triangle([-0.1, 0.12, -0.55], [-0.25, 0.16, -0.85], [-0.2, 0, 0], tip);
  return b.build();
}

/** Le nombre de triangles de tout le décor des Détours au pire (toutes les sentes tracées, le cairn allumé) : le budget. */
export const detourTrianglesAtMost = (): number => detourFacets(DETOUR_IDS, true).triangles;
