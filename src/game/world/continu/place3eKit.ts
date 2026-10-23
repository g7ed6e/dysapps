// Le kit commun des lieux du 3e (le Versant, GD-25, lot 2 ; proposition du consultant d'Archipéo, § 0, et relecture des
// lieux du directeur artistique) : ce que le Belvédère, le Grenier, l'Abri et le Jardin partagent, comme ./place4eKit.ts
// au 4e : les matières des Passeurs au 3e (le granit bleuté, l'ardoise, la pierre claire, le bois gris, le fer bruni, le
// bronze des seules ferrures, l'ocre des lanternes), le repère d'un lieu (son centre, le sol sous lui, sa porte), la
// lanterne pendue, sur son poteau ou sur son bras, le muret de granit à chaperon d'ardoise, la terrasse ronde, l'habitant
// en pion (sa scénette montre son modèle `3e-habitant-<lieu>` à sa place : ./habitants.ts). Les outils sans niveau (le quadrilatère
// tourné vers le dehors, le plan du sol, la hauteur d'une scène, le cap d'un regard) restent dans ./place4eKit.ts. Code pur.
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { sheet, type P3 } from './place4eKit';
import type { Sphere } from './placeArt';
import { COLORS_3E, PATH_NODES_3E, PLACES_3E, type PlaceId3e } from './plan3e';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

/**
 * Les matières des Passeurs au 3e (proposition du Versant, § 0) : le granit bleuté, au soleil et à l'ombre ; l'ardoise
 * des chaperons et des toits ; la pierre claire des dallages et son ombre ; le bois gris, à l'ombre, et le bois neuf un
 * cran plus clair ; le fer bruni (jamais presque noir) ; le bronze des ferrures ; la neige des toits, au ton des nuages ;
 * le cuir et la toile ; l'ocre des lanternes, seule lumière, et la vitre éteinte ; l'herbe sèche des débris.
 */
export const C3E = {
  granite: COLORS_3E.granite,
  graniteSun: COLORS_3E.graniteSun,
  graniteShade: COLORS_3E.graniteShade,
  slate: COLORS_3E.slate,
  slateTop: COLORS_3E.slateTop,
  stone: COLORS_3E.parvis,
  stoneShade: 0xbdb7a8,
  joint: 0xa69f90,
  wood: COLORS_3E.wood,
  woodShade: COLORS_3E.woodShade,
  newWood: 0xaa9a86,
  iron: 0x5f6672,
  ironTop: 0x6f7682,
  bronze: COLORS_3E.bronze,
  snow: COLORS_3E.snow,
  leather: 0x8a6c52,
  canvas: 0xc9bfa8,
  canvasShade: 0xaea38c,
  lantern: 0xe0a84a,
  lanternOff: 0xbfc4b8,
  /** L'herbe sèche qui envahit une ruine (relecture du Versant, (b) 5) : d'un ton à part, jamais celui des plantes. */
  dry: 0xb7aa78,
  dryShade: 0x9d915f,
} as const;

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter. */
export const SINK_3E = -0.8;

/** Le repère d'un lieu du 3e : son centre, le sol de son centre, le sol sous un point du repère, sa porte. */
export interface Site3e {
  center: Vec2;
  h0: number;
  /** Le sol du 3e sous un point du repère du lieu, depuis le sol de son centre. */
  ground(lx: number, lz: number): number;
  /** Le pas de la porte, au bout de ses chemins, depuis le centre. */
  door: Vec2;
}

export function site3e(id: PlaceId3e): Site3e {
  const center = PLACES_3E.find((p) => p.id === id)!.center;
  const h0 = standingHeight(heightAt3e(center));
  const at = PATH_NODES_3E.find((n) => n.id === id)!.at;
  return {
    center,
    h0,
    ground: (lx, lz) => standingHeight(heightAt3e({ x: center.x + lx, z: center.z + lz })) - h0,
    door: { x: at.x - center.x, z: at.z - center.z },
  };
}

/** Une lanterne pendue (sa vitre, un pavé ; son chapeau de bronze en pointe, la ferrure), d'ocre ou éteinte. */
export function lantern3e(b: FacetBuilder, top: Vec3, lit: boolean, s = 1): void {
  b.box({ x: top.x, y: top.y - 0.34 * s, z: top.z }, [0.24 * s, 0.3 * s, 0.24 * s], lit ? C3E.lantern : C3E.lanternOff);
  b.prism({ x: top.x, y: top.y - 0.04 * s, z: top.z, yaw: Math.PI / 4 }, 0.21 * s, 0, 0.16 * s, 4, C3E.bronze);
}

/** Une lanterne sur son poteau de fer bruni, posé au sol `y` en (`x`, `z`), haut de `h`. */
export function postLantern3e(b: FacetBuilder, x: number, y: number, z: number, h: number, lit: boolean): void {
  b.box({ x, y: y - 0.3, z }, [0.12, h + 0.3, 0.12], C3E.iron);
  lantern3e(b, { x, y: y + h + 0.02, z }, lit, 0.85);
}

/** Une lanterne sur un bras de fer, sortie d'un poteau ou d'un mur en (`x`, `z`) vers (`dx`, `dz`), à `y`. */
export function armLantern3e(b: FacetBuilder, x: number, y: number, z: number, dx: number, dz: number, lit: boolean): void {
  b.beam({ x, y, z }, { x: x + dx * 0.45, y, z: z + dz * 0.45 }, 0.07, C3E.iron);
  lantern3e(b, { x: x + dx * 0.45, y: y - 0.02, z: z + dz * 0.45 }, lit);
}

/**
 * Un pan de muret de granit à chaperon d'ardoise, d'un point à l'autre (dans le repère du lieu), de son pied enfoncé
 * jusqu'à `h` au-dessus de `y` : le muret plein des Passeurs, à hauteur de poitrine de Kéo (1,1), qui borde les lieux
 * du côté des nuages et ne s'ouvre jamais de ce côté (avis dys, vertige).
 */
export function wallSpan3e(b: FacetBuilder, a: Vec2, c: Vec2, y: number, h: number, thick = 0.55): void {
  const dx = c.x - a.x,
    dz = c.z - a.z;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(-dz, dx);
  const m = { x: (a.x + c.x) / 2, z: (a.z + c.z) / 2 };
  b.box({ x: m.x, y: y + SINK_3E, z: m.z, yaw }, [len + 0.05, h - SINK_3E, thick], C3E.graniteShade, C3E.granite);
  b.box({ x: m.x, y: y + h, z: m.z, yaw }, [len + 0.15, 0.14, thick + 0.14], C3E.slate, C3E.slateTop);
}

/** Une touffe d'herbe sèche de ruine, posée au sol `y` en (`x`, `z`) : trois pointes basses du ton sec, de taille `s`. */
export function dryTuft3e(b: FacetBuilder, x: number, y: number, z: number, s = 1): void {
  b.prism({ x, y: y - 0.05, z, yaw: x + z }, 0.32 * s, 0, 0.62 * s, 4, C3E.dry);
  b.prism({ x: x + 0.28 * s, y: y - 0.05, z: z + 0.12 * s, yaw: x }, 0.22 * s, 0, 0.45 * s, 4, C3E.dryShade);
  b.prism({ x: x - 0.22 * s, y: y - 0.05, z: z - 0.18 * s, yaw: z }, 0.2 * s, 0, 0.4 * s, 4, C3E.dry);
}

/** Un point d'un cercle de rayon `r` au cap `deg` (en degrés depuis le nord, dans le sens des aiguilles d'une montre). */
export const onCircle = (r: number, deg: number, c: Vec2 = { x: 0, z: 0 }): Vec2 => ({ x: c.x + r * Math.sin((deg * Math.PI) / 180), z: c.z - r * Math.cos((deg * Math.PI) / 180) });

/**
 * L'habitant du 3e en pion (son modèle 3D le remplace dans la scénette, ./habitants.ts), à hauteur de Kéo : bottes, bas, veste
 * (`coat`), tête et cheveux ; les bras le long du corps. Une couleur de veste par métier, jamais vive.
 */
export function habitant3e(b: FacetBuilder, at: Vec3, sphere: Sphere, coat: number, legs = 0x5d6470, hair = 0x6a5444): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, 0x5a5552);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.26, 0.24, 0.42, 8, legs);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.29, 0.25, 0.44, 8, coat);
  sphere(b, { x: at.x, y: at.y + 1.14, z: at.z }, 0.2, 8, 6, 0xe3b48a);
  b.prism({ x: at.x, y: at.y + 1.22, z: at.z }, 0.215, 0.17, 0.15, 8, hair);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.95, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, coat);
}

/**
 * Un pan de toit tombé, appuyé ou couché (relecture des Prairies, (a) 5 et (b) 2 : sinon on lit une caisse ou une
 * palissade) : `q`, ses quatre coins (le haut, de gauche à droite, puis le pied, de droite à gauche), son épaisseur `t`.
 * Son dessous de bois en haut, tourné vers la porte, l'ardoise contre le mur ; un bord d'ardoise qui dépasse sur le haut
 * et les deux côtés ; ses lattes en travers (`lattes`, en part de la pente) et trois chevrons dans la pente, dont le bout
 * dépasse au-dessus du bord.
 */
export function fallenPan3e(b: FacetBuilder, q: readonly [P3, P3, P3, P3], t: number, lattes: readonly number[]): void {
  sheet(b, q, t, C3E.wood, C3E.slate);
  const lerp = (a: P3, c: P3, k: number): P3 => [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k, a[2] + (c[2] - a[2]) * k];
  const add = (a: P3, d: P3, k: number): P3 => [a[0] + d[0] * k, a[1] + d[1] * k, a[2] + d[2] * k];
  const unit = (a: P3, c: P3): P3 => {
    const d: P3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const l = Math.hypot(d[0], d[1], d[2]) || 1;
    return [d[0] / l, d[1] / l, d[2] / l];
  };
  const along = unit(q[0], q[1]);
  const down = unit(q[0], q[3]);
  const n: P3 = [along[1] * down[2] - along[2] * down[1], along[2] * down[0] - along[0] * down[2], along[0] * down[1] - along[1] * down[0]];
  const up: P3 = n[1] < 0 ? [-n[0], -n[1], -n[2]] : n;
  const mid = (p: P3): P3 => [p[0], p[1] + t / 2, p[2]];
  // Le bord d'ardoise : une bande des deux faces, dans le plan du pan, sur le haut et les deux côtés.
  const RIM = 0.2;
  for (const [a, c, out] of [
    [q[0], q[1], [-down[0], -down[1], -down[2]]],
    [q[1], q[2], along],
    [q[3], q[0], [-along[0], -along[1], -along[2]]],
  ] as const) {
    const a0 = mid(a),
      c0 = mid(c);
    const a1 = add(a0, out, RIM),
      c1 = add(c0, out, RIM);
    b.quad(a0, c0, c1, a1, C3E.slateTop);
    b.quad(a0, a1, c1, c0, C3E.slateTop);
  }
  // Les lattes en travers, puis les chevrons dans la pente, posés sur le bois ; leur bout dépasse du haut.
  const on = (p: P3, k: number) => {
    const r = add([p[0], p[1] + t, p[2]], up, k);
    return { x: r[0], y: r[1], z: r[2] };
  };
  for (const k of lattes) b.beam(on(lerp(q[0], q[3], k), 0.05), on(lerp(q[1], q[2], k), 0.05), 0.08, C3E.woodShade);
  for (const k of [0.15, 0.5, 0.85]) {
    const top = lerp(q[0], q[1], k),
      foot = lerp(q[3], q[2], k);
    b.beam(on(add(top, down, -0.35), 0.12), on(lerp(top, foot, 0.92), 0.12), 0.14, C3E.woodShade);
  }
}
