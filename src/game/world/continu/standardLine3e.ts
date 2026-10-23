// La ligne des poteaux du Standard (./standard3e.ts), dans le repère du lieu : six poteaux de bois en ligne droite, du
// premier, à droite de la salle, au dernier, à l'ouest du Fanal, et leurs fils jusqu'à la ferrure du Fanal. Le premier
// poteau et ses fils sont au modèle du lieu ; les autres portent loin, hors de lui (`PlaceArt.reach`). Code pur.
import { drawPosed, FacetBuilder, type Facets } from './facets';
import { FANAL_LAYOUT } from './fanal3e';
import type { Vec2, Vec3 } from './geometry';
import { C3E, site3e } from './place3eKit';
import { inWorld } from './place4eKit';
import { PLACES_3E } from './plan3e';
import { C, POLE, ROOM, SITE, floor, local } from './standardFrame3e';

const FANAL_SITE = site3e('fanal');

/** Le centre du Fanal, depuis le centre du Standard. */
export const FANAL_AT: Vec2 = (() => {
  const f = PLACES_3E.find((p) => p.id === 'fanal')!.center;
  return { x: f.x - SITE.center.x, z: f.z - SITE.center.z };
})();

/** Les six poteaux, du premier, à droite de la salle, au dernier, à l'ouest du Fanal, en ligne droite, à pas égaux. */
export const LINE: readonly Vec2[] = (() => {
  const a = local(POLE.x, POLE.z);
  const b = { x: FANAL_AT.x - 9.5, z: FANAL_AT.z - 1.0 };
  return [0, 1, 2, 3, 4, 5].map((k) => ({ x: a.x + ((b.x - a.x) * k) / 5, z: a.z + ((b.z - a.z) * k) / 5 }));
})();

/** La ferrure du Fanal, où les fils s'attachent : sur la façade ouest de son second gradin, sous la tour. */
export const FANAL_HOOK = (() => {
  const S = FANAL_LAYOUT.socle.high;
  return {
    x: FANAL_AT.x - S.x - 0.12,
    z: FANAL_AT.z - 1.0,
    get y() {
      return FANAL_SITE.h0 + FANAL_LAYOUT.base() + S.top - 0.9 - SITE.h0;
    },
  };
})();

/** Le lacet des traverses : en travers de la ligne. */
const LINE_YAW = Math.atan2(-(LINE[5].z - LINE[0].z), LINE[5].x - LINE[0].x) + Math.PI / 2;

/** Un poteau de bois sur l'herbe en (`x`, `z`) (repère du lieu), au sol `y`, sa traverse en travers de la ligne et ses deux isolateurs de verre ; penché de `lean`. */
function pole(b: FacetBuilder, x: number, y: number, z: number, lean = 0): void {
  drawPosed(b, { x, y: y - 0.3, z, yaw: LINE_YAW, pitch: lean }, (k) => {
    k.prism({ x: 0, y: 0, z: 0 }, 0.13, 0.1, POLE.h + 0.3, 6, C3E.woodShade, C3E.wood);
    k.box({ x: 0, y: POLE.h - 0.1, z: 0 }, [POLE.arm, 0.12, 0.14], C3E.woodShade, C3E.wood);
    for (const s of [-1, 1]) k.box({ x: s * (POLE.arm / 2 - 0.1), y: POLE.h + 0.02, z: 0 }, [0.09, 0.14, 0.09], C.glass);
  });
}

/** Les deux points d'attache d'un poteau debout (repère du lieu, au sol `y`). */
function hooks(x: number, y: number, z: number): [Vec3, Vec3] {
  const c = Math.cos(LINE_YAW),
    s = Math.sin(LINE_YAW);
  const d = POLE.arm / 2 - 0.1;
  const top = y + POLE.h - 0.3 + 0.3 + 0.16;
  return [
    { x: x + d * c, y: top, z: z - d * s },
    { x: x - d * c, y: top, z: z + d * s },
  ];
}

/** Un fil tendu d'un point à l'autre, un peu creusé au milieu. */
function wire(b: FacetBuilder, a: Vec3, c: Vec3, sag = 0.35): void {
  const m = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 - sag, z: (a.z + c.z) / 2 };
  b.beam(a, m, 0.05, C.wire);
  b.beam(m, c, 0.05, C.wire);
}

/** Un fil tombé : du point `a` jusqu'à l'herbe, puis une boucle lâche couchée dans l'herbe vers `c`. */
function wireDown(b: FacetBuilder, a: Vec3, c: Vec2, ground: (x: number, z: number) => number): void {
  const m = { x: a.x + (c.x - a.x) * 0.35, z: a.z + (c.z - a.z) * 0.35 + 0.6 };
  const e = { x: c.x, z: c.z - 0.5 };
  b.beam(a, { x: m.x, y: ground(m.x, m.z) + 0.04, z: m.z }, 0.05, C.wire);
  b.beam({ x: m.x, y: ground(m.x, m.z) + 0.04, z: m.z }, { x: e.x, y: ground(e.x, e.z) + 0.04, z: e.z }, 0.05, C.wire);
}

/** La ferrure de la salle, au haut de son pignon droit, d'où partent les deux fils. */
const ROOM_HOOK = (): Vec3 => {
  const p = local(ROOM.x1 + 0.1, (ROOM.z0 + ROOM.z1) / 2);
  return { x: p.x, y: floor() + ROOM.h + ROOM.ridge * 0.55, z: p.z };
};

/** Le premier poteau, toujours debout, dans le repère du lieu. */
export function firstPole(b: FacetBuilder): void {
  const p = LINE[0];
  pole(b, p.x, SITE.ground(p.x, p.z), p.z);
}

/** Les fils du premier poteau : de la ferrure du pignon au poteau (les abords). */
export function firstWires(b: FacetBuilder): void {
  const p = LINE[0];
  const h = ROOM_HOOK();
  for (const [k, q] of hooks(p.x, SITE.ground(p.x, p.z), p.z).entries()) wire(b, { ...h, y: h.y - 0.2 * k }, q, 0.25);
}

/** Les fils tombés du premier poteau (la ruine), en boucle lâche dans l'herbe, vers le deuxième. */
export function firstWiresDown(b: FacetBuilder): void {
  const p = LINE[0];
  const [q] = hooks(p.x, SITE.ground(p.x, p.z), p.z);
  wireDown(b, q, { x: (LINE[0].x + LINE[1].x) / 2, z: (LINE[0].z + LINE[1].z) / 2 }, SITE.ground);
}

/**
 * Ce que le Standard pose au-delà de son emprise (`reach`) : en ruine, le deuxième poteau penché, le troisième debout, un
 * fil qui pend jusqu'à l'herbe ; les abords posés, les cinq autres poteaux debout, et leurs fils tendus de poteau en poteau
 * jusqu'à la ferrure du Fanal. `c` : le centre du lieu à son sol.
 */
export function poleLine(c: Vec3, done: boolean): Facets {
  const b = new FacetBuilder();
  const g = (x: number, z: number) => c.y + SITE.ground(x, z);
  inWorld(b, { x: c.x, y: 0, z: c.z }, (l) => {
    if (!done) {
      const [p1, p2] = [LINE[1], LINE[2]];
      pole(l, p1.x, g(p1.x, p1.z), p1.z, 0.42);
      pole(l, p2.x, g(p2.x, p2.z), p2.z);
      const [q] = hooks(p2.x, g(p2.x, p2.z), p2.z);
      wireDown(l, q, { x: p2.x - 2.6, z: p2.z + 0.4 }, g);
      return;
    }
    for (const p of LINE.slice(1)) pole(l, p.x, g(p.x, p.z), p.z);
    for (let k = 0; k < LINE.length - 1; k++) {
      const a = hooks(LINE[k].x, g(LINE[k].x, LINE[k].z), LINE[k].z);
      const e = hooks(LINE[k + 1].x, g(LINE[k + 1].x, LINE[k + 1].z), LINE[k + 1].z);
      for (const i of [0, 1]) wire(l, a[i], e[i]);
    }
    // La ferrure du Fanal, et les deux derniers fils.
    const H = FANAL_HOOK;
    const hy = c.y + H.y;
    l.box({ x: H.x, y: hy - 0.15, z: H.z }, [0.24, 0.3, 0.7], C3E.iron, C3E.ironTop);
    const last = LINE[LINE.length - 1];
    const e = hooks(last.x, g(last.x, last.z), last.z);
    for (const [i, dz] of [-0.25, 0.25].entries()) wire(l, e[i], { x: H.x - 0.1, y: hy, z: H.z + dz }, 0.3);
  });
  return b.build();
}
