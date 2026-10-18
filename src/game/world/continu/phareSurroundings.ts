/**
 * Les abords de la scénette du Phare (d'après les concepts du 18 octobre 2026, « scenettes-6e-phare-v2 », et l'avis du
 * directeur artistique : « rien ne dit phare même en ruine »). Le générateur n'a pas su dessiner le phare inachevé : le
 * chantier se dit en mots (directeur artistique) : la tour blanche à bande Nuit océan, la lanterne posée de travers au
 * pied, l'échelle et la potence de bois avec la bouée qui pend, la cloche et les blocs taillés, la mer au fond ; la belle
 * ruine en chantier, son échafaudage de bois, sa petite grue de bois, ses caisses.
 *
 * Deux états, selon l'étape qui porte la trace (la galerie, `posed`) :
 * - au pied de la tour (galerie pas posée) : l'échafaudage en U au revers de la tour, ses deux planchers et sa lisse,
 *   l'échelle à l'est qui y monte, la potence sur son haut et la bouée qui pend ; au nord-est, la petite grue de bois qui
 *   hisse un bloc taillé ; à l'est, la vieille lanterne posée de travers contre un bloc, les caisses et les blocs taillés ;
 * - sur la galerie (posée) : l'échafaudage démonté, la potence de bois sur la galerie, à l'est, et sa bouée qui pend au
 *   bord ; la longue échelle qui monte du pied à la galerie, à l'ouest-nord-ouest ; au pied, les caisses et les blocs qui
 *   restent.
 * Dans les deux, la bande Nuit océan sur la tour (à mi-hauteur du moignon au pied, au tiers de la tour entière vue de la
 * galerie), des rochers de pierre chaude et des touffes d'herbe autour de l'îlot (le kit commun, ./surroundingsKit.ts).
 *
 * Rien de haut entre la caméra de face et la scène (Kéo, la gardienne, la rangée des cloches au sud) : ce qui est haut se
 * tient au revers de la tour ou à l'est, hors de la bande du regard. Aplats francs, une couleur par facette, jamais
 * presque noir. Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { placeById } from './plan6e';
import type { SurroundingsState } from './surroundings';
import { DRY_TUFT, GREEN_TUFT, STONE, TIMBER, barrel, groundAt, rock, tuft, type P3 } from './surroundingsKit';
import { heightAt, standingHeight } from './terrain';

const C = {
  /**
   * La bande de la tour : le Nuit océan du pack (#142B38) éclairci d'un cran pour la 3D, où l'ombre le pousserait au
   * presque noir (directeur artistique, 14 octobre 2026 : rien de presque noir).
   */
  band: 0x46699a,
  /** Le bois de l'échafaudage, de l'échelle et des potences : les perches, les planches et leur tranche. */
  pole: 0x8a6440,
  plank: TIMBER.plank,
  plankSide: TIMBER.plankSide,
  rope: 0x8f7a5c,
  /** La bouée : blanc cassé et rouge, en quartiers. */
  buoyWhite: 0xf2eee4,
  buoyRed: 0xc8553d,
  /** La vieille lanterne : son armature Nuit océan éclaircie, sa vitre gris-bleu (celle du Phare), son toit d'ardoise. */
  frame: 0x3d5878,
  glass: 0xcfdfe2,
  slate: 0x6f8089,
  /** Les blocs taillés : la pierre blanche de la tour, leur dessus plus clair. */
  ashlar: 0xe2dccd,
  ashlarTop: 0xf2eee4,
  /** Les caisses : le bois clair, leur dessus, les lattes. */
  crate: 0xb98654,
  crateTop: 0xc9965f,
  slat: 0x8a6440,
  /** Le mortier frais dans son auge. */
  mortar: 0xd9cfbb,
} as const;

/** Le rayon de la tour du Phare à la hauteur `y` au-dessus du pied du lieu (places.ts, `towerRadius`). */
const towerRadius = (y: number): number => 1.7 - (0.5 * (y - 0.7)) / 10;

/** Le dessus du socle de rochers, au-dessus du pied du lieu, et le rayon de son plat (places.ts, sa ruine). */
const SOCLE = { top: 0.7, radius: 2.85 } as const;

/**
 * Où sont les abords, depuis le centre du lieu (son pied, en 0), selon l'état : la bande de la tour (son bas, sa hauteur),
 * l'échafaudage (ses perches et ses planchers), l'échelle (son pied et son haut), la potence et sa bouée, la grue.
 */
export const PHARE_SURROUNDINGS = {
  /** La bande, au pied : au haut du moignon (3,4), au-dessus de la porte (2,3) ; sur la galerie : au tiers de la tour entière. */
  band: { foot: { y: 2.45, h: 0.65 }, gallery: { y: 4.3, h: 1.1 } },
  scaffold: { x: 2.15, front: -0.2, back: -2.25, decks: [2.05, 3.55], top: 4.75 },
  /** L'échelle du pied : de l'est du socle au plancher haut de l'échafaudage. */
  footLadder: { from: { x: 3.25, z: -1.05 }, to: { x: 2.3, y: 4.05, z: -1.05 } },
  /** La potence du haut de l'échafaudage, sa flèche vers l'est, la bouée au bout. */
  footGibbet: { x: 2.15, z: -2.25, reach: 1.75, top: 5.35, buoy: 3.05 },
  crane: { x: 6.3, z: -3.4, top: 5.6 },
  /** La potence de la galerie, à l'est, et sa bouée, sous le plancher de la galerie (`GALLERY.floor`, 11,55). */
  galleryGibbet: { angle: -0.2, r: 3.05, reach: 1.65, rise: 1.7, drop: 1.55 },
  /** La longue échelle de la galerie, à l'ouest-nord-ouest : son pied et son haut (au-dessus de la rambarde). */
  galleryLadder: { angle: Math.PI + 0.45, foot: 4.05, top: 3.5, topY: 12.6 },
} as const;

/** Le haut de la galerie au-dessus du pied du lieu (scenette.ts, `GALLERY.floor`). */
const GALLERY_FLOOR = 11.55;

export function phareSurroundings(b: FacetBuilder, _floor: Vec3, state: SurroundingsState): void {
  const c = placeById('phare').center;
  const g = standingHeight(heightAt(c));
  const at = (dx: number, dy: number, dz: number): P3 => [c.x + dx, g + dy, c.z + dz];
  /** Le sol sous un point (depuis le centre) : le plat du socle, ou le terrain un peu enfoncé au-delà. */
  const ground = (dx: number, dz: number): number =>
    Math.hypot(dx, dz) < SOCLE.radius ? SOCLE.top : groundAt(c.x + dx, c.z + dz, 0.08) - g;
  const ctx: Ctx = { b, at, ground };
  const S = PHARE_SURROUNDINGS;
  const band = state.posed ? S.band.gallery : S.band.foot;
  b.band({ x: c.x, y: g + band.y, z: c.z }, towerRadius(band.y) + 0.07, band.h, 8, C.band);
  if (state.posed) {
    galleryGibbet(ctx);
    galleryLadder(ctx);
  } else {
    scaffold(ctx);
    ladder(ctx, [S.footLadder.from.x, ground(S.footLadder.from.x, S.footLadder.from.z) - 0.05, S.footLadder.from.z], [S.footLadder.to.x, S.footLadder.to.y, S.footLadder.to.z], 0.55, 0.45);
    footGibbet(ctx);
    crane(ctx);
    fallenLantern(ctx, 4.3, -2.4);
    stumpTop(ctx);
  }
  yard(ctx, state.posed);
  rocks(ctx);
}

interface Ctx {
  b: FacetBuilder;
  /** Un point du monde, depuis le pied du lieu. */
  at(dx: number, dy: number, dz: number): P3;
  /** Le sol sous un point, au-dessus du pied du lieu. */
  ground(dx: number, dz: number): number;
}

const v3 = ([x, y, z]: P3): Vec3 => ({ x, y, z });

/** Une perche de bois, du sol (un rien enfoncée) jusqu'à `top`. */
function pole(ctx: Ctx, dx: number, dz: number, top: number, t = 0.12): void {
  const foot = Math.min(ctx.ground(dx, dz), SOCLE.top) - 0.2;
  ctx.b.beam(v3(ctx.at(dx, foot, dz)), v3(ctx.at(dx, top, dz)), t, C.pole);
}

/**
 * L'échafaudage en U au revers de la tour (au nord) : ses six perches, ses deux planchers de planches sur trois côtés,
 * la lisse en haut et deux écharpes sur sa face nord. Il monte au-dessus du moignon : de face, on le voit derrière lui.
 */
function scaffold(ctx: Ctx): void {
  const { b, at } = ctx;
  const S = PHARE_SURROUNDINGS.scaffold;
  const corners: [number, number][] = [
    [-S.x, S.front],
    [-S.x, S.back],
    [0, S.back - 0.1],
    [S.x, S.back],
    [S.x, S.front],
  ];
  for (const [x, z] of corners) pole(ctx, x, z, S.top);
  const mid = (S.front + S.back) / 2;
  for (const y of S.decks) {
    b.box(v3(at(0, y, S.back + 0.05)), [2 * S.x + 0.5, 0.1, 0.62], C.plankSide, C.plank);
    for (const side of [-1, 1]) b.box(v3(at(side * (S.x - 0.05), y, mid)), [0.62, 0.1, S.front - S.back + 0.4], C.plankSide, C.plank);
  }
  // La lisse du haut, sur les trois côtés.
  const rail = S.top - 0.35;
  for (const [a, z] of [
    [corners[0], corners[1]],
    [corners[1], corners[3]],
    [corners[3], corners[4]],
  ] as const)
    b.beam(v3(at(a[0], rail, a[1])), v3(at(z[0], rail, z[1])), 0.08, C.pole);
  // Les écharpes de la face nord, d'une perche à l'autre.
  b.beam(v3(at(-S.x, SOCLE.top + 0.1, S.back - 0.08)), v3(at(0, S.decks[1], S.back - 0.18)), 0.08, C.pole);
  b.beam(v3(at(S.x, SOCLE.top + 0.1, S.back - 0.08)), v3(at(0, S.decks[1], S.back - 0.18)), 0.08, C.pole);
}

/**
 * Une échelle de bois de `from` (son pied) à `to` (son haut), dans le monde depuis le pied du lieu : deux montants et des
 * barreaux tous les `step`, chacun un aplat double face (on le voit des deux côtés), `width` de large en travers.
 */
function ladder(ctx: Ctx, from: P3, to: P3, width: number, step: number): void {
  const { b, at } = ctx;
  const d: P3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  // Le travers de l'échelle : horizontal, perpendiculaire à sa pente.
  const h = Math.hypot(d[0], d[2]) || 1;
  const side: P3 = Math.hypot(d[0], d[2]) < 1e-3 ? [1, 0, 0] : [-d[2] / h, 0, d[0] / h];
  const w = width / 2;
  const off = (p: P3, s: number, k = 0): P3 => [p[0] + side[0] * s + (d[0] / len) * k, p[1] + (d[1] / len) * k, p[2] + side[2] * s + (d[2] / len) * k];
  for (const s of [-w, w]) b.beam(v3(at(...off(from, s))), v3(at(...off(to, s))), 0.08, C.pole);
  const rung = 0.05;
  for (let k = step; k < len - 0.1; k += step) {
    const a = at(...off(from, -w, k - rung)),
      bb = at(...off(from, w, k - rung)),
      cc = at(...off(from, w, k + rung)),
      dd = at(...off(from, -w, k + rung));
    b.quad(a, bb, cc, dd, C.plank);
    b.quad(dd, cc, bb, a, C.plankSide);
  }
}

/**
 * Une bouée de sauvetage debout, son milieu en `o`, sa face vers `n` (horizontal, unitaire), de rayon `r` et de tube
 * `t` : huit quartiers blanc et rouge, chacun ses deux faces, son tour et son dedans. Soixante-quatre triangles.
 */
function buoy(b: FacetBuilder, o: P3, n: readonly [number, number], r: number, t: number): void {
  // Le repère de l'anneau : `u` horizontal dans son plan, `v` vertical, `n` sa normale.
  const u: P3 = [n[1], 0, -n[0]];
  const p = (radius: number, a: number, w: number): P3 => [
    o[0] + radius * Math.cos(a) * u[0] + w * n[0],
    o[1] + radius * Math.sin(a),
    o[2] + radius * Math.cos(a) * u[2] + w * n[1],
  ];
  const ro = r + t,
    ri = r - t,
    k8 = (2 * Math.PI) / 8;
  for (let k = 0; k < 8; k++) {
    const a0 = k * k8,
      a1 = (k + 1) * k8;
    const col = k % 2 ? C.buoyRed : C.buoyWhite;
    b.quad(p(ro, a0, t), p(ro, a1, t), p(ri, a1, t), p(ri, a0, t), col);
    b.quad(p(ri, a0, -t), p(ri, a1, -t), p(ro, a1, -t), p(ro, a0, -t), col);
    b.quad(p(ro, a0, t), p(ro, a0, -t), p(ro, a1, -t), p(ro, a1, t), col);
    b.quad(p(ri, a0, t), p(ri, a1, t), p(ri, a1, -t), p(ri, a0, -t), col);
  }
}

/**
 * La potence du haut de l'échafaudage : son poteau sur le coin nord-est, sa flèche vers l'est et son aisselier, la corde
 * et la bouée qui pend, face au sud.
 */
function footGibbet(ctx: Ctx): void {
  const { b, at } = ctx;
  const G = PHARE_SURROUNDINGS.footGibbet;
  const top = G.top;
  const S = PHARE_SURROUNDINGS.scaffold;
  b.beam(v3(at(G.x, S.top, G.z)), v3(at(G.x, top + 0.08, G.z)), 0.12, C.pole);
  b.beam(v3(at(G.x - 0.1, top, G.z)), v3(at(G.x + G.reach, top, G.z)), 0.12, C.pole);
  b.beam(v3(at(G.x, top - 0.75, G.z)), v3(at(G.x + 0.7, top, G.z)), 0.08, C.pole);
  const end = G.x + G.reach - 0.1;
  b.beam(v3(at(end, top, G.z)), v3(at(end, G.buoy + 0.42, G.z)), 0.035, C.rope);
  buoy(b, at(end, G.buoy, G.z), [0, 1], 0.32, 0.09);
}

/**
 * La petite grue de bois, au nord-est, au-delà du socle : son mât sur deux pieds en croix, sa flèche vers le haut de
 * l'échafaudage et son aisselier, la corde et le bloc taillé qu'elle hisse.
 */
function crane(ctx: Ctx): void {
  const { b, at, ground } = ctx;
  const K = PHARE_SURROUNDINGS.crane;
  const foot = ground(K.x, K.z);
  b.beam(v3(at(K.x - 0.8, foot + 0.06, K.z)), v3(at(K.x + 0.8, foot + 0.06, K.z)), 0.16, C.pole);
  b.beam(v3(at(K.x, foot + 0.06, K.z - 0.8)), v3(at(K.x, foot + 0.06, K.z + 0.8)), 0.16, C.pole);
  b.beam(v3(at(K.x, foot - 0.1, K.z)), v3(at(K.x, K.top, K.z)), 0.2, C.pole);
  // La flèche, du haut du mât vers le revers de la tour.
  const tip: P3 = [2.85, K.top + 0.45, -2.95];
  b.beam(v3(at(K.x + 0.1, K.top - 0.1, K.z + 0.05)), v3(at(...tip)), 0.14, C.pole);
  b.beam(v3(at(K.x, K.top - 1.3, K.z)), v3(at(K.x - 0.55, K.top + 0.1, K.z + 0.25)), 0.09, C.pole);
  const hook = PHARE_SURROUNDINGS.scaffold.top - 0.2;
  b.beam(v3(at(...tip)), v3(at(tip[0], hook + 0.42, tip[2])), 0.035, C.rope);
  b.box(v3(at(tip[0], hook - 0.05, tip[2])), [0.6, 0.45, 0.45], C.ashlar, C.ashlarTop);
}

/**
 * Sur le haut du moignon (3,4), au milieu, loin de son bord : deux blocs taillés en cours de pose et l'auge de mortier.
 * Le fût neuf, une fois posé, les recouvre. La caméra de dos, qui monte au-dessus du moignon, les voit.
 */
function stumpTop(ctx: Ctx): void {
  const { b, at } = ctx;
  const top = 3.4;
  b.box({ ...v3(at(-0.35, top - 0.02, -0.25)), yaw: 0.25 }, [0.7, 0.4, 0.45], C.ashlar, C.ashlarTop);
  b.box({ ...v3(at(-0.3, top + 0.38, -0.3)), yaw: -0.35 }, [0.6, 0.36, 0.42], C.ashlar, C.ashlarTop);
  b.box({ ...v3(at(0.45, top - 0.02, -0.55)), yaw: 0.6 }, [0.6, 0.22, 0.4], C.plankSide, C.mortar);
}

/**
 * La vieille lanterne, posée de travers au pied de la tour contre un bloc taillé : son socle, sa vitre à huit pans, son
 * toit d'ardoise en pointe, basculés ensemble.
 */
function fallenLantern(ctx: Ctx, dx: number, dz: number): void {
  const { b, at, ground } = ctx;
  const y = ground(dx, dz) - 0.06;
  // Basculée vers le nord, contre le bloc.
  const pitch = 0.5,
    yaw = 2.8;
  // L'axe de la lanterne, basculé : un point à la hauteur `h` le long de son axe.
  const along = (h: number): Vec3 => {
    const [x, yy, z] = at(dx + h * Math.sin(pitch) * Math.sin(yaw), y + h * Math.cos(pitch), dz + h * Math.sin(pitch) * Math.cos(yaw));
    return { x, y: yy, z };
  };
  const p = (h: number) => ({ ...along(h), pitch, yaw });
  b.prism(p(0), 0.62, 0.62, 0.16, 8, C.frame);
  b.prism(p(0.16), 0.55, 0.55, 0.72, 8, C.glass);
  b.prism(p(0.88), 0.62, 0.62, 0.1, 8, C.frame);
  b.prism(p(0.98), 0.68, 0, 0.5, 8, C.slate);
  // Le bloc taillé où elle s'appuie, au nord.
  b.box(v3(at(dx - 0.15, ground(dx - 0.15, dz - 0.95) - 0.06, dz - 0.95)), [0.8, 0.5, 0.55], C.ashlar, C.ashlarTop);
}

/**
 * La potence de bois de la galerie, à l'est : son poteau sur le plancher, sa flèche qui passe la rambarde, son
 * aisselier, la corde et la bouée qui pend sous le bord de la galerie, face au sud.
 */
function galleryGibbet(ctx: Ctx): void {
  const { b, at } = ctx;
  const G = PHARE_SURROUNDINGS.galleryGibbet;
  const cx = Math.cos(G.angle),
    cz = Math.sin(G.angle);
  const base = GALLERY_FLOOR;
  const top = base + G.rise;
  const P = (r: number, y: number): Vec3 => v3(at(r * cx, y, r * cz));
  b.beam(P(G.r, base - 0.02), P(G.r, top + 0.08), 0.13, C.pole);
  b.beam(P(G.r - 0.1, top), P(G.r + G.reach, top), 0.13, C.pole);
  b.beam(P(G.r, top - 0.8), P(G.r + 0.75, top), 0.09, C.pole);
  const end = G.r + G.reach - 0.1;
  const buoyY = base - G.drop;
  b.beam(P(end, top), P(end, buoyY + 0.5), 0.035, C.rope);
  buoy(b, at(end * cx, buoyY, end * cz), [0, 1], 0.4, 0.11);
}

/** La longue échelle de la galerie : du sol au pied de la tour jusqu'au-dessus de la rambarde. */
function galleryLadder(ctx: Ctx): void {
  const L = PHARE_SURROUNDINGS.galleryLadder;
  const cx = Math.cos(L.angle),
    cz = Math.sin(L.angle);
  const fx = L.foot * cx,
    fz = L.foot * cz;
  ladder(ctx, [fx, ctx.ground(fx, fz) - 0.05, fz], [L.top * cx, L.topY, L.top * cz], 0.6, 0.55);
}

/**
 * Le chantier au pied : des caisses (une pile de deux à l'est, une à l'ouest), un tonneau, des blocs taillés empilés au revers et à
 * l'ouest. Sur la galerie posée, il en reste moins : une caisse et une pile de blocs à l'est.
 */
function yard(ctx: Ctx, posed: boolean): void {
  const crates: [number, number, number, number][] = posed
    ? [[5.6, 0.0, 0.3, 0.7]]
    : [
        [6.0, -2.0, 0.3, 0.7],
        [6.05, -1.95, -0.25, 0.55],
        [-4.6, -2.2, 0.5, 0.65],
      ];
  // Une pile de deux : la seconde se pose sur la première (même x, z).
  let lastTop = -Infinity;
  for (const [i, [dx, dz, yaw, s]] of crates.entries()) {
    const stacked = i === 1 && !posed;
    const y = stacked ? lastTop : ctx.ground(dx, dz) - 0.05;
    crate(ctx, dx, y, dz, yaw, s);
    lastTop = y + s;
  }
  const blocks: [number, number, number][] = posed
    ? [
        [3.9, -1.6, 0.4],
        [4.25, -2.3, -0.3],
      ]
    : [
        [3.3, -3.65, 0.2],
        [2.6, -4.2, -0.35],
        [-3.55, -2.3, 0.6],
        [-2.95, -3.0, 0.1],
      ];
  for (const [dx, dz, yaw] of blocks) ashlar(ctx, dx, dz, yaw);
  // Le tonneau d'eau du gâchage, près des caisses de l'est (le kit commun).
  const [tx, tz] = posed ? [6.3, -1.0] : [6.9, -1.0];
  const [wx, wy, wz] = ctx.at(tx, ctx.ground(tx, tz) - 0.04, tz);
  barrel(ctx.b, wx, wy, wz);
  // Le second lit des blocs, sur le premier de chaque pile.
  const [bx, bz] = blocks[0];
  ctx.b.box({ ...v3(ctx.at(bx + 0.05, ctx.ground(bx, bz) - 0.06 + 0.45, bz)), yaw: blocks[0][2] + 0.3 }, [0.7, 0.4, 0.45], C.ashlar, C.ashlarTop);
}

/** Une caisse de bois en (dx, y, dz), de côté `s` : le pavé, deux lattes en croix sur sa face sud et sur son dessus. */
function crate(ctx: Ctx, dx: number, y: number, dz: number, yaw: number, s: number): void {
  const { b, at } = ctx;
  b.box({ ...v3(at(dx, y, dz)), yaw }, [s, s, s], C.crate, C.crateTop);
  // Les lattes, à peine devant la face sud (+z dans le repère de la caisse) et à peine au-dessus du dessus.
  const c = Math.cos(yaw),
    sn = Math.sin(yaw);
  const L = (u: number, v: number, w: number): P3 => at(dx + u * c + w * sn, y + v, dz - u * sn + w * c);
  const h = s / 2,
    f = h + 0.015,
    lath = 0.05;
  b.quad(L(-h, lath, f), L(h, s - lath, f), L(h - 2 * lath, s, f), L(-h, 3 * lath, f), C.slat);
  b.quad(L(-h, s + 0.015, -lath), L(-h, s + 0.015, lath), L(h, s + 0.015, lath), L(h, s + 0.015, -lath), C.slat);
}

/** Un bloc taillé de la pierre blanche de la tour, posé au sol. */
function ashlar(ctx: Ctx, dx: number, dz: number, yaw: number): void {
  ctx.b.box({ ...v3(ctx.at(dx, ctx.ground(dx, dz) - 0.06, dz)), yaw }, [0.8, 0.5, 0.55], C.ashlar, C.ashlarTop);
}

/**
 * Les rochers de pierre chaude (le kit commun) et des touffes d'herbe, autour de l'îlot, hors de la bande du regard de la
 * caméra de face : (dx, dz, rayon, hauteur, graine).
 */
const ROCKS: readonly (readonly [number, number, number, number, number])[] = [
  [6.6, 1.6, 1.0, 0.9, 3],
  [7.6, -2.4, 1.3, 1.2, 7],
  [6.4, -5.8, 0.9, 0.8, 11],
  [1.6, -6.8, 1.1, 0.9, 5],
  [-2.6, -6.4, 0.8, 0.7, 9],
  [-6.8, -3.4, 1.2, 1.0, 13],
  [-7.2, 2.2, 0.9, 0.7, 2],
];

const TUFTS: readonly (readonly [number, number, number])[] = [
  [3.3, 1.9, 1],
  [5.4, 0.6, 2],
  [5.8, -2.0, 3],
  [3.0, -4.2, 4],
  [-0.8, -4.0, 5],
  [-4.4, -1.6, 6],
  [-4.9, 1.3, 7],
  [6.2, 3.6, 8],
];

function rocks(ctx: Ctx): void {
  for (const [dx, dz, r, h, seed] of ROCKS) {
    const p = ctx.at(dx, ctx.ground(dx, dz), dz);
    rock(ctx.b, v3(p), r, h, seed, { light: STONE.boulder, shade: STONE.boulderShade, top: STONE.top });
  }
  for (const [dx, dz, seed] of TUFTS) {
    const p = ctx.at(dx, ctx.ground(dx, dz) + 0.06, dz);
    tuft(ctx.b, v3(p), seed, seed % 3 ? GREEN_TUFT : DRY_TUFT);
  }
}
