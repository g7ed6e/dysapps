// Les Détours du monde continu (GD-20, déplacement libre, lot 2, piste B « Les sentes qui restent », choix du mainteneur
// du 18 octobre 2026) : un endroit hors des chemins par terre, que l'élève trouve en marchant. Quatre sommets de colline
// posés à la main (plan6e.ts, `DETOUR_HILLS` ; leur relief : terrain.ts) et un bord d'eau. Trois pierres plates au pied
// de chacun le signalent, sans texte. Quand Kéo s'y arrête, la vue monte (la caméra, camera.ts) et le nom s'écrit une
// fois ; au bord d'eau, la baleine fait surface et les oiseaux se lèvent ; au cairn de la Braise, un seul geste le
// rallume. Après la première arrivée, une sente reste tracée pour de bon, du chemin le plus proche jusqu'au Détour, dans
// le monde et sur la Carte. Ni compteur, ni liste, ni récompense. Les places et les noms : le consultant d'Archipéo ; la
// forme : l'artiste technique 3D ; les durées : le référent dys. Au 5e (GD-22, lot 6), le premier Détour, le Creux, a son
// fichier (./creux5e.ts) ; la Hutte (lot 8) aussi (./hutte5e.ts) ; ce fichier les connaît tous par leur identifiant et leur niveau. Code pur.
import { CREUX } from './creux5e';
import { HUTTE } from './hutte5e';
import { FacetBuilder, type Facets } from './facets';
import { distance, distanceToPolyline, type Vec2 } from './geometry';
import type { LandId } from './lands';
import type { OpenWorldLevel } from './levelPlan';
import { snapToNetwork } from './paths';
import { LAMP_COLOR } from './places';
import { COLORS_6E, DETOUR_HILL, DETOUR_HILLS } from './plan6e';
import { detourFoot, detourReach, heightAt, landDistance, standingHeight } from './terrain';

/**
 * Les Détours, les mêmes, dans le même ordre, que engine/detours.ts, pour la sauvegarde : les cinq du 6e, un par terre,
 * puis ceux du 5e (lot 6 : le Creux ; lot 8 : la Hutte).
 */
export const DETOUR_IDS = ['butte-chantier', 'braise-herons', 'bout-large', 'colline-aube', 'haut-cretes', 'creux', 'hutte'] as const;
export type DetourId = (typeof DETOUR_IDS)[number];

/** Les Détours du 5e. */
const DETOUR_IDS_5E = ['creux', 'hutte'] as const satisfies readonly DetourId[];

/** Un Détour du 6e. */
type DetourId6e = Exclude<DetourId, (typeof DETOUR_IDS_5E)[number]>;

/** Les cinq Détours du 6e, un par terre. */
export const DETOUR_IDS_6E = DETOUR_IDS.filter((id): id is DetourId6e => !(DETOUR_IDS_5E as readonly string[]).includes(id));

/** Ce qu'est un Détour : un sommet, le sommet au cairn à rallumer, un bord d'eau, ou (au 5e) un arbre creux, une cabane. */
type DetourKind = 'sommet' | 'cairn' | 'rive' | 'creux' | 'cabane';

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
const SPECS: Readonly<Record<DetourId6e, { land: LandId; name: string; kind: DetourKind; from?: Vec2 }>> = {
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

function detourOf(id: DetourId6e): Detour {
  const { from, ...spec } = SPECS[id];
  const hill = DETOUR_HILLS.find((h) => h.id === id);
  if (hill) {
    const foot = detourFoot(hill);
    return { id, ...spec, at: hill.at, radius: DETOUR_HILL.plateau + 0.3, foot, face: hill.face, sente: senteOf(foot, hill.at, from) };
  }
  return { id, ...spec, at: SHORE.at, radius: SHORE.radius, foot: SHORE.at, face: seaward(SHORE.at), sente: senteOf(SHORE.at, SHORE.at, from) };
}

/** Les cinq Détours du 6e, tirés une fois. */
export const DETOURS: readonly Detour[] = DETOUR_IDS_6E.map(detourOf);

/** Les Détours du 5e (lot 6 : le Creux, aux Frondaisons ; lot 8 : la Hutte, aux Roselières). */
export const DETOURS_5E: readonly Detour[] = [CREUX, HUTTE];

/** Les Détours d'un niveau. */
const detoursOf = (level: OpenWorldLevel): readonly Detour[] => (level === '5e' ? DETOURS_5E : DETOURS);

/** Tous les Détours, par leur nom : la table se construit une fois. */
const DETOUR_BY_ID: ReadonlyMap<DetourId, Detour> = new Map([...DETOURS, ...DETOURS_5E].map((d) => [d.id, d]));

export const detourById = (id: DetourId): Detour => DETOUR_BY_ID.get(id)!;

/** Le Détour du niveau `level` (le 6e, sans le dire) où se tient Kéo en `p`, ou rien. */
export function detourAtPoint(p: Vec2, level: OpenWorldLevel = '6e'): Detour | null {
  for (const d of detoursOf(level)) if (distance(p, d.at) <= d.radius) return d;
  return null;
}

/**
 * Le cap de la caméra à l'arrivée sur un Détour (comme `yaw` de la caméra, scene.ts : elle regarde vers −(sin, cos)), ou
 * rien : elle garde le sien. Au Creux, Kéo sur le seuil, la caméra se tourne vers l'arche, derrière lui, et montre le
 * dedans éclairé (GD-22, lot 6, retouche : sans cela, la caméra qui monte montrait le fût de côté, l'arche cachée). `face`
 * va du centre du fût vers l'arche : la caméra regarde à l'opposé.
 */
export const detourCap = (d: Detour): number | null => (d.kind === 'creux' ? Math.atan2(Math.cos(d.face), Math.sin(d.face)) : null);

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

/**
 * Les durées et les mesures de l'arrivée (référent dys, avis du 18 octobre 2026) : Kéo immobile `settle` secondes sur
 * le Détour avant que rien ne bouge ; la vue monte en `rise` secondes et revient en `fall` ; la baleine et les oiseaux
 * partent `faunaDelay` secondes après l'arrêt et ne reviennent pas avant `faunaAgain` secondes. Le nom suit la bulle de
 * parole du monde (4 secondes, même si Kéo repart) ; le cairn s'allume d'un coup (directeur artistique, référent dys).
 */
export const DETOUR_TIMING = { settle: 0.4, rise: 1.2, fall: 0.8, faunaDelay: 2.5, faunaAgain: 10 } as const;

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

/**
 * La place du cairn sur le plateau de la Braise : à côté du centre, pour que Kéo s'arrête au centre, du côté opposé à la
 * rampe, pour qu'on le voie devant soi en arrivant (directeur artistique).
 */
export function cairnSpot(d: Detour): Vec2 {
  return { x: d.at.x - Math.cos(d.face) * 1.6, z: d.at.z - Math.sin(d.face) * 1.6 };
}

/** Le cairn : quatre pierres empilées, puis le fanal au sommet, éteint (un creux) ou allumé (une flamme). */
function cairn(b: FacetBuilder, d: Detour, lit: boolean): void {
  const c = cairnSpot(d);
  let y = standingHeight(heightAt(c)) - 0.05;
  const rings = [
    { r: 0.78, h: 0.4 },
    { r: 0.64, h: 0.38 },
    { r: 0.5, h: 0.34 },
    { r: 0.38, h: 0.3 },
  ];
  for (const [k, ring] of rings.entries()) {
    b.prism({ x: c.x, y, z: c.z, yaw: k * 0.7 }, ring.r, ring.r * 0.88, ring.h, 6, C.cairn, C.cairnTop);
    y += ring.h;
  }
  // Le fanal : une coupelle, puis la flamme (une pointe) ou le creux.
  b.prism({ x: c.x, y, z: c.z }, 0.28, 0.38, 0.18, 6, C.cairn, lit ? LAMP_COLOR : C.hollow);
  if (lit) b.prism({ x: c.x, y: y + 0.18, z: c.z }, 0.22, 0, 0.55, 5, LAMP_COLOR);
}

/**
 * La sente : de la terre battue, plus sombre que le liseré des chemins, en pointillé, plus étroite qu'un chemin (référent
 * dys : trait plus fin, pointillé, 3:1 au moins avec la prairie et l'herbe à mi-hauteur ; jamais presque-noire).
 * Les pointillés : un trait de `dash` unités, un vide de `gap`, de demi-largeur `half`, à `lift` au-dessus du sol. */
export const SENTE = { dash: 1.4, gap: 0.7, half: 0.48, lift: 0.025, color: 0x735e3a } as const;

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

/**
 * La baleine et les oiseaux du bord d'eau (référent dys) : la baleine à `whaleOff` unités au large et `whaleSide` de côté
 * (à plus de 12 unités de Kéo, jamais au centre de l'écran), elle monte en `rise` secondes, reste `stay` secondes en
 * surface, son dos à plat, souffle au début de ce temps (un jet blanc de `spout` secondes, directeur artistique), puis
 * plonge en `dive`, la queue levée un instant (plus de 2 secondes en tout), en nageant de `swim` unités ; `birds` oiseaux,
 * posés au bord de l'eau à `perchOff` unités de côté au moins (jamais contre Kéo, consultant d'Archipéo), se lèvent l'un
 * après l'autre (`stagger`), tournent lentement au-dessus de l'eau (un tour en `turn` secondes, jamais moins de 8), à
 * `radius` unités d'un point à `circleOff` au large et `lift` de haut, puis se reposent au bout de `flight` secondes, en
 * `land`.
 */
export const FAUNA = {
  whaleOff: 22,
  whaleSide: 9,
  rise: 1.2,
  stay: 1.8,
  dive: 1.6,
  spout: 1.1,
  swim: 3,
  birds: 5,
  perchOff: 3.5,
  stagger: 0.25,
  turn: 9,
  radius: 3.2,
  circleOff: 7,
  lift: 3.5,
  flight: 7,
  land: 2,
} as const;

/** Une pose de la baleine et des oiseaux : leur place, leur cap (et la bascule de la baleine qui plonge), le souffle. */
export interface FaunaPose {
  whale: { x: number; y: number; z: number; yaw: number; pitch: number } | null;
  /** Le jet de la baleine : sa base et sa hauteur relative (de 0 à 1), ou rien. */
  spout: { x: number; y: number; z: number; grow: number } | null;
  birds: { x: number; y: number; z: number; yaw: number; perched: boolean }[];
}

/** La fin de la scène de la baleine et des oiseaux, en secondes depuis son départ. */
export const FAUNA_END = Math.max(FAUNA.rise + FAUNA.stay + FAUNA.dive, FAUNA.stagger * (FAUNA.birds - 1) + FAUNA.flight + 0.3);

/** L'instant du souffle, en secondes depuis le départ de la scène : la baleine arrivée en surface. */
export const FAUNA_BLOW = FAUNA.rise;

/** Le départ doux et l'arrivée douce, de 0 à 1. */
const ease = (u: number) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};

/** Les perchoirs des oiseaux d'un bord d'eau, faits une fois : en rang au bord de l'eau, d'un côté du Détour, à `perchOff` unités de Kéo au moins. */
const perches = new Map<DetourId, FaunaPose['birds']>();
function perchesOf(shore: Detour): FaunaPose['birds'] {
  let out = perches.get(shore.id);
  if (!out) {
    const sx = Math.cos(shore.face);
    const sz = Math.sin(shore.face);
    out = Array.from({ length: FAUNA.birds }, (_, k) => {
      const side = FAUNA.perchOff + k * 0.9;
      const x = shore.at.x + sx * (0.8 + 0.3 * (k % 2)) - sz * side;
      const z = shore.at.z + sz * (0.8 + 0.3 * (k % 2)) + sx * side;
      return { x, y: Math.max(0, standingHeight(heightAt({ x, z }))), z, yaw: shore.face + 0.6 * k, perched: true };
    });
    perches.set(shore.id, out);
  }
  return out;
}

/** La longueur de la baleine, de la queue au museau. */
const WHALE_LENGTH = 7.5;

/**
 * La baleine et les oiseaux du bord d'eau `shore`, `t` secondes après le départ de leur scène (`null` : pas de scène, les
 * oiseaux posés, la baleine sous l'eau) ; `still` (« Réduire les animations ») : pendant la scène, les oiseaux restent
 * posés et le dos de la baleine se tient immobile en surface, sans souffle.
 */
export function faunaPose(shore: Detour, t: number | null, still = false): FaunaPose {
  const sx = Math.cos(shore.face);
  const sz = Math.sin(shore.face);
  const perch = perchesOf(shore);
  const playing = t !== null && t >= 0 && t < FAUNA_END;
  // Le cap de la baleine : le long de la côte, de son côté vers le milieu.
  const yaw = Math.atan2(sx, -sz);
  const at = { x: shore.at.x + sx * FAUNA.whaleOff - sz * FAUNA.whaleSide, z: shore.at.z + sz * FAUNA.whaleOff + sx * FAUNA.whaleSide };
  if (!playing) return { whale: null, spout: null, birds: perch };
  if (still) return { whale: { x: at.x, y: -0.05, z: at.z, yaw, pitch: 0 }, spout: null, birds: perch };
  const whaleEnd = FAUNA.rise + FAUNA.stay + FAUNA.dive;
  let whale: FaunaPose['whale'] = null;
  let spout: FaunaPose['spout'] = null;
  if (t < whaleEnd) {
    const swim = (FAUNA.swim * t) / whaleEnd;
    const fx = Math.sin(yaw) * swim;
    const fz = Math.cos(yaw) * swim;
    const up = ease(t / FAUNA.rise);
    const down = ease((t - FAUNA.rise - FAUNA.stay) / FAUNA.dive);
    // En plongeant, la tête descend d'abord : la queue se lève hors de l'eau un instant, puis tout disparaît.
    whale = { x: at.x + fx, y: -1.4 + 1.38 * up - 3.2 * down, z: at.z + fz, yaw, pitch: -0.75 * Math.sin(Math.PI * Math.min(1, down * 1.2)) - 0.3 * down };
    const u = (t - FAUNA_BLOW) / FAUNA.spout;
    if (u > 0 && u < 1) {
      const head = WHALE_LENGTH * 0.28;
      spout = { x: whale.x + Math.sin(yaw) * head, y: 0.3, z: whale.z + Math.cos(yaw) * head, grow: Math.sin(Math.PI * u) };
    }
  }
  const cx = shore.at.x + sx * FAUNA.circleOff;
  const cz = shore.at.z + sz * FAUNA.circleOff;
  const birds = perch.map((p, k) => {
    const u = t - 0.3 - FAUNA.stagger * k;
    if (u <= 0 || u >= FAUNA.flight) return p;
    const a = p.yaw + (2 * Math.PI * u) / FAUNA.turn;
    const lift = ease(u / 1.5);
    const fly = { x: p.x + (cx + Math.cos(a) * FAUNA.radius - p.x) * lift, y: p.y + FAUNA.lift * ease(u / 4), z: p.z + (cz + Math.sin(a) * FAUNA.radius - p.z) * lift, yaw: -a - Math.PI / 2 };
    // La fin du vol : chacun revient se poser sur son perchoir.
    const back = ease((u - (FAUNA.flight - FAUNA.land)) / FAUNA.land);
    const landed = back > 0.9;
    return { x: fly.x + (p.x - fly.x) * back, y: fly.y + (p.y - fly.y) * back, z: fly.z + (p.z - fly.z) * back, yaw: landed ? p.yaw : fly.yaw, perched: landed };
  });
  return { whale, spout, birds };
}

/**
 * La baleine : un dos long, bas et plat, une petite nageoire arrondie et sa queue en éventail, en aplats gris-bleu (le
 * concept des personnages, baleine et oiseaux), le dos vers +y, la tête vers +x. Environ 60 triangles.
 */
export function whaleFacets(): Facets {
  const b = new FacetBuilder();
  const back = 0x6a8096;
  const belly = 0x9aaebe;
  // Le dos : un fuseau à six pans, aplati, coupé sous l'eau (seul le dessus se voit).
  const L = WHALE_LENGTH;
  const sect = [
    { x: -L / 2, r: 0.25 },
    { x: -L / 4, r: 0.8 },
    { x: L / 8, r: 1.05 },
    { x: L / 2 - 0.5, r: 0.7 },
    { x: L / 2, r: 0.15 },
  ];
  const ring = (x: number, r: number) => Array.from({ length: 6 }, (_, k) => [x, r * Math.sin((Math.PI * k) / 5) * 0.42, r * Math.cos((Math.PI * k) / 5)] as const);
  for (let i = 1; i < sect.length; i++) {
    const p = ring(sect[i - 1].x, sect[i - 1].r);
    const q = ring(sect[i].x, sect[i].r);
    for (let k = 0; k < 5; k++) b.quad(p[k], q[k], q[k + 1], p[k + 1], k === 0 || k === 4 ? belly : back);
  }
  // La nageoire du dos, petite, basse et arrondie (deux pans), aux deux tiers vers la queue.
  const fx = -L * 0.22;
  b.triangle([fx - 0.5, 0.36, 0], [fx + 0.4, 0.4, 0], [fx - 0.15, 0.62, 0], back);
  b.triangle([fx - 0.5, 0.36, 0], [fx - 0.15, 0.62, 0], [fx - 0.55, 0.55, 0], back);
  // La queue en éventail.
  const tx = -L / 2;
  b.triangle([tx, 0.1, 0], [tx - 1.1, 0.45, 1.4], [tx - 0.7, 0.15, 0], back);
  b.triangle([tx, 0.1, 0], [tx - 0.7, 0.15, 0], [tx - 1.1, 0.45, -1.4], back);
  b.triangle([tx - 0.7, 0.15, 0], [tx - 1.1, 0.45, 1.4], [tx, 0.1, 0], belly);
  b.triangle([tx - 1.1, 0.45, -1.4], [tx - 0.7, 0.15, 0], [tx, 0.1, 0], belly);
  return b.build();
}

/** Le jet de la baleine : un éventail blanc, haut d'une unité (que la vue étire de 0 à 1,6), sur trois pans. Six triangles. */
export function spoutFacets(): Facets {
  const b = new FacetBuilder();
  const white = 0xf4f6f3;
  const mist = 0xd9e4e8;
  for (let k = 0; k < 3; k++) {
    const a = (Math.PI * k) / 3;
    const c = Math.cos(a);
    const s = Math.sin(a);
    b.triangle([0, 0, 0], [-0.45 * c, 1, -0.45 * s], [0.45 * c, 1, 0.45 * s], k === 1 ? mist : white);
    b.triangle([-0.45 * c, 1, -0.45 * s], [0, 1.25, 0], [0.45 * c, 1, 0.45 * s], white);
  }
  return b.build();
}

/**
 * Un oiseau de mer, blanc, la tête vers +x, huit triangles : en vol, deux ailes en V ouvert ; posé (`perched`), les ailes
 * repliées le long du corps, plus ramassé (consultant d'Archipéo). Les mêmes sommets dans le même ordre : la vue passe de
 * l'un à l'autre sans changer son maillage. `white` et `tip` : ses deux aplats (le choucas du 5e les change).
 */
export function birdFacets(perched = false, white = 0xf2f1ea, tip = 0x9aa3a8): Facets {
  const b = new FacetBuilder();
  const w: readonly [number, number, number] = perched ? [-0.15, 0.24, 0.16] : [-0.1, 0.12, 0.55];
  const e: readonly [number, number, number] = perched ? [-0.42, 0.2, 0.09] : [-0.25, 0.16, 0.85];
  const n = (p: readonly [number, number, number]) => [p[0], p[1], -p[2]] as const;
  b.triangle([0.25, 0, 0], w, [-0.2, 0, 0], white);
  b.triangle([-0.2, 0, 0], w, [0.25, 0, 0], white);
  b.triangle([-0.2, 0, 0], n(w), [0.25, 0, 0], white);
  b.triangle([0.25, 0, 0], n(w), [-0.2, 0, 0], white);
  b.triangle(w, e, [-0.2, 0, 0], tip);
  b.triangle([-0.2, 0, 0], e, w, tip);
  b.triangle([-0.2, 0, 0], n(e), n(w), tip);
  b.triangle(n(w), n(e), [-0.2, 0, 0], tip);
  return b.build();
}

/** Le nombre de triangles de tout le décor des Détours au pire (toutes les sentes tracées, le cairn allumé) : le budget. */
export const detourTrianglesAtMost = (): number => detourFacets(DETOUR_IDS, true).triangles;
