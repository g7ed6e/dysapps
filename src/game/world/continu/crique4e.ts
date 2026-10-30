// La Crique, le lieu de départ du 4e, et son aéronef (lot 1 du monde ouvert du 4e, en grandes masses ; lot 4, la piste A
// « La place de l'usine », choisie par le mainteneur le 22 octobre 2026, et l'intention du directeur artistique du même
// jour) : l'Escale du 6e servie dans les matières du 4e (./port.ts dessine les mêmes bâtiments, à la même place de leur
// repère) : le dallage de pierre claire et chaude, les murs de brique rouge sourde à assises (celles de toute la brique
// du 4e, ./place4eKit.ts) sur un soubassement de pierre grise, les chaînes d'angle et les encadrements de pierre, les
// deux ardoises bleues de l'Escale, le fer bruni des ferrures, l'ocre des lanternes. Rien n'y est ruiné. Au bout du quai,
// la passerelle et l'aire ronde de l'aéronef, cerclée de fer (./paths4e.ts les dessine) ; à l'est de l'anse, la digue.
// Ce qui ne change jamais autour d'elle : le volcan vu de loin, sa lave figée et son panache (./terrain4e.ts), le Rafiot
// des Ferrailleurs de flanc au bout de son quai abandonné, ses pièces de bronze sur le pont, et au sud, sur l'horizon,
// les Aiguilles (vers le 5e). L'aéronef se pose sur l'aire en trois temps (la coque et sa lanterne, la cabine et le
// rotor, les hélices et la dérive : world/nefModels.ts, `NEF_SISTERS[3]`) ; ce qui reste du dirigeable, ses pièces
// déposées sur l'aire (la toile pliée, les cordes lovées, le gouvernail démonté), part quand sa sœur touche l'aire. Son
// obstacle : les îles du ciel, au nord-est, immobiles ; il passe entre deux d'entre elles. Tout va dans le maillage des
// lieux : aucun appel de plus. Code pur.
import { FacetBuilder, drawPosed, mergeFacets, placeFacets, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { BUOY_TOUCH, NEF_BAND, buoyAt, type NefFlight, type NefLook, type NefSite } from './nef';
import { C4E, brickCourse, brickCourseHeights, once } from './place4eKit';
import { COLORS_4E, CRIQUE, CRIQUE_DIGUE, CRIQUE_LEVEL, CRIQUE_PAD, CRIQUE_PAVING, CRIQUE_QUAY_SPOT, RAFIOT_4E, VOLCANO_4E } from './plan4e';
import type { PortSite } from './port';
import { RAFIOT_PIECES, rafiotFacets } from './rafiot';
import { SHADOW_DIR_4E } from './sky';
import { heightAt4e, lavaFacets, plumeFacets, volcanoFarFacets } from './terrain4e';

type P3 = [number, number, number];

/**
 * Le dallage de la Crique (lot 4, intention du directeur artistique, § 1) : une pierre claire et chaude, plus de presque
 * blanc (#F8F2EA au lot 1) ; elle se détache de la terre rouge par sa clarté, à 3 contre 1 au moins (référent dys).
 */
export const CRIQUE_PAVING_COLOR = 0xf0e6d6;

/**
 * Les matières de la Crique (lot 4, intention, § 1) : le dallage clair, ses flancs dans la pierre grise à l'ombre ; les
 * murs de brique (`white`, au soleil ; `wall`, les flancs à l'ombre) ; le soubassement de pierre grise, une seule ; les
 * encadrements des portes, les arcades et les chaînes d'angle en pierre au soleil ; les vantaux de bois brun ; les deux
 * ardoises de l'Escale, repères d'un niveau à l'autre ; la charpente de l'Entrepôt ; le fer bruni des ferrures et des
 * bittes (la rouille est réservée aux ruines) ; l'ocre des lanternes du 4e, que la vue dessine sans ombre.
 */
const CRIQUE_COLORS = {
  stone: CRIQUE_PAVING_COLOR,
  stoneSide: COLORS_4E.stoneShade,
  coping: COLORS_4E.stoneSun,
  plinth: COLORS_4E.stone,
  white: COLORS_4E.brick,
  wall: COLORS_4E.brickShade,
  frame: COLORS_4E.stoneSun,
  slate: 0x5b7c99,
  paleSlate: 0x8aa3b8,
  shingle: COLORS_4E.terracotta,
  wood: COLORS_4E.wood,
  darkWood: COLORS_4E.woodShade,
  newWood: 0xc29a74,
  door: COLORS_4E.woodShade,
  inside: 0x9c8a70,
  socle: COLORS_4E.stoneSun,
  bollard: C4E.iron,
  bollardTop: C4E.ironTop,
  lamp: C4E.lantern,
  habitant: [0x8c9f7a, 0xb5866a, 0x7f93a8],
  skin: 0xd9b38c,
} as const;

/**
 * La Crique : son repère, son pavage, sa pierre plate, son quai (le chaperon clair, deux bittes de fer bruni au bout, de
 * part et d'autre de la passerelle de l'aire ; la lanterne, la ligne des habitants, une barque), et sa brique : les
 * assises et le joint de toute la brique du 4e, les chaînes d'angle et les arcades de pierre au soleil.
 */
export const CRIQUE_SITE: PortSite = {
  frame: CRIQUE,
  paving: CRIQUE_PAVING,
  level: () => CRIQUE_LEVEL,
  quaySpot: CRIQUE_QUAY_SPOT,
  colors: CRIQUE_COLORS,
  quay: {
    coping: true,
    bollards: [-2.2, 2.2].map((x) => [x, CRIQUE_PAVING.quay.z1 - 0.55] as const),
    lamp: [CRIQUE_PAVING.quay.x1 - 0.4, CRIQUE_PAVING.quay.z1 - 0.6],
    habitants: { z: 14.5, xs: [6, 16, 30] },
    boats: [[CRIQUE_PAVING.quay.x1 + 2.4, 22]],
  },
  masonry: { courseHeights: (top) => brickCourseHeights(top), course: brickCourse, stone: COLORS_4E.stoneSun, backQuoinsToFoot: 6, schoolPlinthRise: 0.3 },
};

/**
 * La caméra à l'arrivée au quai de la Crique (fiche, § 5 : « vue du quai, la Forge et le volcan ») : le cap (0 : le
 * nord), vers le nord-ouest, la rangée à droite. Le changer ici.
 */
export const CRIQUE_VIEW = { yaw: 0.7 } as const;

/**
 * Le haut que le regard levé cadre au quai de la Crique (retouche 1 du lot 1 : fiche, § 1 et § 5, « vue du quai, la
 * Forge et le volcan ») : le rebord du cratère, un peu au-dessus (`above`, le pied du panache). La caméra qui suit Kéo
 * plonge trop pour qu'on voie le cône à plus de 300 unités ; levée, elle garde Kéo au-dessus de « Y aller », le
 * fourneau au milieu de l'image, le cône au fond, à gauche du milieu. Pris au premier usage, jamais à l'import.
 */
export const criqueLook = once((): Vec3 => {
  const { crater, craterRadius } = VOLCANO_4E;
  const above = 4;
  return { x: crater.x, y: heightAt4e({ x: crater.x + craterRadius, z: crater.z }) + above, z: crater.z };
});

/**
 * Le bout de la caméra qui suit Kéo au 4e (expert frontend, retouche 1 du lot 1 : explicite, plus celui du 5e pris sans
 * le dire) : le volcan se voit de toute l'île, son côté le plus loin de la Crique à un peu plus de 410 unités ; son
 * panache au-dessus. Au-delà, rien.
 */
export const FOLLOW_FAR_4E = 600;

/** Le soleil du 4e, à plat : un pan qui le regarde est au soleil. */
const SUN_4E = { x: -SHADOW_DIR_4E.x, z: -SHADOW_DIR_4E.z } as const;

// ---------- La digue ----------

/**
 * Les couleurs de la digue : le dessus dans la pierre grise (retouche 1 du directeur artistique : au soleil, la pierre
 * claire faisait une ligne qui se lisait comme une planche), son biseau, ses flancs à l'ombre (la pierre des Passeurs).
 */
const DIGUE_COLORS = { top: COLORS_4E.stone, bevel: COLORS_4E.stone, side: COLORS_4E.stoneShade } as const;

/**
 * Le profil d'un bloc de la digue : sa largeur au pied, à l'épaule (sous le biseau) et au dessus ; son pied sous l'eau.
 * Le pied s'évase (retouche 1 : la digue se pose dans l'eau, elle ne flotte pas au-dessus).
 */
const DIGUE_PROFILE = { foot: 2.2, shoulder: 0.5, crown: 0.36, bottom: -1.8, bevel: 0.25 } as const;

/**
 * Les gros blocs de pierre brute posés en saillie sur chaque bloc de la digue (restes du monde ouvert du 4e, point 5b : de
 * loin, chaque bloc se lisait comme une longue planche basse, la ligne comme un ruban en tirets ; retouche 1, point 7,
 * directeur artistique : trois petits pavés se lisaient comme des caisses qu'on charge, donc un endroit où l'on marche) :
 * le bloc qui le porte, sa taille (le long du bloc, en haut, en travers : 2,2 à 2,6 sur 1,6 à 1,9), de combien il dépasse
 * son dessus (0,8 à 1,1 : plus haut que le quai, on ne croit plus y marcher), son lacet (0,3 à 0,8, tous différents) et son
 * tangage (0,15 à 0,3), et son décalage tour à tour vers le large (positif) et vers l'abri (négatif). Chacun est un tronc de
 * pyramide à quatre pans, le dessus à `DIGUE_ROCK_TOP` de la base : une tête de roche, jamais une boîte.
 */
export const DIGUE_ROCKS = [
  { block: 0, size: [2.4, 1.6, 1.7] as P3, above: 0.85, yaw: 0.35, pitch: 0.2, out: 0.5 },
  { block: 1, size: [2.2, 1.6, 1.9] as P3, above: 1.05, yaw: 0.7, pitch: -0.25, out: -0.4 },
  { block: 2, size: [2.6, 1.7, 1.6] as P3, above: 0.9, yaw: 0.5, pitch: 0.15, out: 0.5 },
  { block: 3, size: [2.3, 1.6, 1.8] as P3, above: 1.1, yaw: 0.8, pitch: -0.3, out: -0.4 },
  { block: 4, size: [2.5, 1.6, 1.75] as P3, above: 0.8, yaw: 0.3, pitch: 0.22, out: 0.5 },
  { block: 5, size: [2.2, 1.7, 1.65] as P3, above: 1.0, yaw: 0.6, pitch: -0.18, out: -0.4 },
] as const;

/** Le dessus d'un bloc en saillie, en part de sa base (retouche 1 des restes, point 7). */
export const DIGUE_ROCK_TOP = 0.55;

/**
 * Un tronc de pyramide à quatre pans, posé sur sa base (y = 0 du repère), centré : `size` en x, y, z à la base, le dessus
 * réduit à `top` ; sans dessous (il est posé), dix triangles comme un pavé ouvert.
 */
function rockHead(b: FacetBuilder, size: P3, top: number, side: number, crown: number): void {
  const [sx, sy, sz] = size;
  const lo = (x: number, z: number): P3 => [(x * sx) / 2, 0, (z * sz) / 2];
  const hi = (x: number, z: number): P3 => [(x * sx * top) / 2, sy, (z * sz * top) / 2];
  b.quad(hi(-1, -1), hi(-1, 1), hi(1, 1), hi(1, -1), crown);
  b.quad(lo(-1, 1), lo(1, 1), hi(1, 1), hi(-1, 1), side);
  b.quad(lo(1, -1), lo(-1, -1), hi(-1, -1), hi(1, -1), side);
  b.quad(lo(1, 1), lo(1, -1), hi(1, -1), hi(1, 1), side);
  b.quad(lo(-1, -1), lo(-1, 1), hi(-1, 1), hi(-1, -1), side);
}

/**
 * La digue de la Crique (intention, § 2 ; retouche 1 du directeur artistique) : un bras bas de pierre grise dans l'eau,
 * six blocs séparés en ligne brisée (un par coude de `CRIQUE_DIGUE`), chacun son haut, l'eau visible entre eux, en
 * grandes facettes : le dessus plat, un biseau de chaque côté, des flancs qui s'évasent jusque sous l'eau ; ni parapet
 * ni rail ; chaque bloc porte un gros bloc de pierre brute en saillie (`DIGUE_ROCKS`). Le vide entre deux blocs se
 * mesure au bord intérieur du dessus, là où le coude le resserre.
 */
export function digueFacets(): Facets {
  const b = new FacetBuilder();
  const { points, width, tops, gap } = CRIQUE_DIGUE;
  const P = DIGUE_PROFILE;
  const dirs = points.slice(1).map(([x, z], i) => {
    const len = Math.hypot(x - points[i][0], z - points[i][1]);
    return { x: (x - points[i][0]) / len, z: (z - points[i][1]) / len };
  });
  // Ce qu'un bloc perd à un coude : la moitié du vide, plus ce que le coude resserre au bord du dessus.
  const trim = (i: number) => {
    const turn = Math.acos(Math.min(1, dirs[i - 1].x * dirs[i].x + dirs[i - 1].z * dirs[i].z));
    return gap / 2 + (width / 2 - P.crown) * Math.tan(turn / 2);
  };
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, az] = points[i];
    const [cx, cz] = points[i + 1];
    const u = dirs[i];
    // La droite du bloc (vue de son début), et ses deux bouts, reculés du vide aux coudes.
    const r = { x: -u.z, z: u.x };
    const back0 = i > 0 ? trim(i) : 0;
    const back1 = i + 2 < points.length ? trim(i + 1) : 0;
    const y = tops[i];
    const section = (px: number, pz: number): P3[] => {
      const at = (w: number, h: number): P3 => [px + r.x * w, h, pz + r.z * w];
      const half = width / 2;
      // De gauche à droite : le pied, l'épaule, le dessus, le dessus, l'épaule, le pied.
      return [at(-half - P.foot, P.bottom), at(-half - P.shoulder, y - P.bevel), at(-half + P.crown, y), at(half - P.crown, y), at(half + P.shoulder, y - P.bevel), at(half + P.foot, P.bottom)];
    };
    const s0 = section(ax + u.x * back0, az + u.z * back0);
    const s1 = section(cx - u.x * back1, cz - u.z * back1);
    const colors = [DIGUE_COLORS.side, DIGUE_COLORS.bevel, DIGUE_COLORS.top, DIGUE_COLORS.bevel, DIGUE_COLORS.side];
    for (let k = 0; k < 5; k++) b.quad(s0[k], s0[k + 1], s1[k + 1], s1[k], colors[k]);
    // Les deux bouts : un hexagone de quatre triangles chacun.
    for (const [s, flip] of [
      [s0, false],
      [s1, true],
    ] as const)
      for (const [p, q, w] of [
        [0, 1, 5],
        [1, 4, 5],
        [1, 2, 4],
        [2, 3, 4],
      ] as const)
        if (flip) b.triangle(s[p], s[w], s[q], DIGUE_COLORS.side);
        else b.triangle(s[p], s[q], s[w], DIGUE_COLORS.side);
    // Le bloc en saillie, vers le milieu du bloc, un peu vers le large (à gauche du sens de la digue, l'anse à droite) ou
    // vers l'abri ; ses flancs à l'ombre, son dessus dans la pierre grise, jamais la pierre claire.
    const rock = DIGUE_ROCKS.find((k) => k.block === i);
    if (rock) {
      const mx = (ax + cx) / 2 - r.x * rock.out,
        mz = (az + cz) / 2 - r.z * rock.out;
      drawPosed(b, { x: mx, y: y + rock.above - rock.size[1], z: mz, yaw: Math.atan2(-u.z, u.x) + rock.yaw, pitch: rock.pitch }, (l) =>
        rockHead(l, rock.size, DIGUE_ROCK_TOP, DIGUE_COLORS.side, DIGUE_COLORS.top),
      );
    }
  }
  return placeFacets(b.build(), { x: CRIQUE.origin.x, y: 0, z: CRIQUE.origin.z, yaw: CRIQUE.yaw });
}

// ---------- Le Rafiot ----------

/**
 * Le Rafiot des Ferrailleurs à la Crique (./rafiot.ts) : de flanc, vu du quai de la Crique (`RAFIOT_4E.yaw`), sous le
 * soleil du 4e, sa fumée courte (il chauffe), ses six pièces de bronze sur le pont arrière tant que la bande ne les a pas
 * rendues au Fanal du 3e (`returned` : le pont vide, consultant d'Archipéo, relecture de la PR du 3e). Et le quai
 * abandonné, de planches, où il est amarré.
 */
function rafiot4eFacets(returned: boolean): Facets {
  const boat = rafiotFacets(RAFIOT_4E, SUN_4E, { pieces: returned ? [] : RAFIOT_PIECES, smoke: true });
  // Le quai abandonné : un tablier de planches, quelques pieux (sans chapeau : on ne le voit pas sous le tablier).
  const q = new FacetBuilder();
  const [from, to] = RAFIOT_4E.quay;
  const len = Math.hypot(to.x - from.x, to.z - from.z);
  const yaw = Math.atan2(to.x - from.x, to.z - from.z);
  const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  q.box({ x: mid.x, y: 0.75, z: mid.z, yaw }, [2.2, 0.22, len], COLORS_4E.woodShade, COLORS_4E.wood);
  for (let d = 1; d < len; d += 4) {
    const p = { x: from.x + ((to.x - from.x) * d) / len, z: from.z + ((to.z - from.z) * d) / len };
    for (const side of [-1, 1]) q.band({ x: p.x + Math.cos(yaw) * side * 0.9, y: -2, z: p.z - Math.sin(yaw) * side * 0.9 }, 0.19, 2.8, 5, COLORS_4E.woodShade);
  }
  return mergeFacets([boat, q.build()]);
}

// ---------- Les Aiguilles ----------

/**
 * Les Aiguilles, vers le 5e (fiche, § 5 ; intention, § 5) : au sud de la Crique, sur l'horizon, quatre aiguilles de roche
 * grise, plates (larges en travers du regard du quai, minces de face), basses et voilées, posées sur l'horizon (retouche 1
 * du directeur artistique : plus basses, au milieu de la moitié droite de l'image du demi-tour, loin des boutons, sans la
 * bande de brume à leur pied, qui se lisait comme une étagère) ; dessinées sans ombre et peu voilées (levelWorld.ts,
 * `thinFog`) : le pendant de la lumière du Phare de la Lisière. Le cap où elles sont depuis le quai (0 : le nord ; π : le
 * sud), leur distance, et chacune : son décalage en travers, sa hauteur, sa demi-largeur.
 */
export const AIGUILLES_4E = {
  yaw: 3.51,
  distance: 228,
  needles: [
    [-13, 9, 2.6],
    [-6, 13, 2.2],
    [3, 7, 2.4],
    [10, 11, 2.0],
  ],
} as const satisfies { yaw: number; distance: number; needles: readonly (readonly [number, number, number])[] };

/** Les couleurs des Aiguilles : la roche grise, côté soleil et côté ombre. */
export const AIGUILLES_COLORS = { lit: 0x8a878f, shade: 0x77747c } as const;

/** Où sont les Aiguilles, dans le monde (leur milieu, au niveau de la mer). */
export const AIGUILLES_AT: Vec2 = (() => {
  const q = CRIQUE.toWorld(CRIQUE_QUAY_SPOT[0], CRIQUE_QUAY_SPOT[1]);
  const { yaw, distance } = AIGUILLES_4E;
  return { x: q.x - Math.sin(yaw) * distance, z: q.z - Math.cos(yaw) * distance };
})();

export function aiguillesFacets(): Facets {
  const b = new FacetBuilder();
  const { yaw, needles } = AIGUILLES_4E;
  // La droite du regard du quai vers elles, et le regard.
  const fwd = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
  const right = { x: -fwd.z, z: fwd.x };
  const C = AIGUILLES_COLORS;
  needles.forEach(([off, h, w]) => {
    const cx = AIGUILLES_AT.x + right.x * off;
    const cz = AIGUILLES_AT.z + right.z * off;
    // Un losange aplati en travers (large de `w`, mince de face), puis l'épaule à mi-hauteur, puis la pointe ; ses coins
    // dans le sens des prismes (./facets.ts).
    const corners: readonly (readonly [number, number])[] = [
      [w, 0],
      [0, -0.7],
      [-w, 0],
      [0, 0.7],
    ];
    const at = (k: number, scale: number, y: number): P3 => {
      const [a, d] = corners[k];
      return [cx + (right.x * a + fwd.x * d) * scale, y, cz + (right.z * a + fwd.z * d) * scale];
    };
    // Le pan entre deux coins, au soleil ou à l'ombre.
    const color = (k: number) => {
      const [a0, d0] = corners[k];
      const [a1, d1] = corners[(k + 1) % 4];
      const a = Math.sign(a0 + a1),
        d = Math.sign(d0 + d1);
      return (right.x * a + fwd.x * d) * SUN_4E.x + (right.z * a + fwd.z * d) * SUN_4E.z > 0 ? C.lit : C.shade;
    };
    const tip: P3 = [cx, h, cz];
    for (let k = 0; k < 4; k++) {
      const n = (k + 1) % 4;
      b.quad(at(n, 1, -1), at(k, 1, -1), at(k, 0.55, h * 0.55), at(n, 0.55, h * 0.55), color(k));
      b.triangle(at(n, 0.55, h * 0.55), at(k, 0.55, h * 0.55), tip, color(k));
    }
  });
  return b.build();
}

/**
 * Le décor de la Crique : le volcan vu de loin, sa lave figée et son panache ; la digue, le Rafiot, les Aiguilles ;
 * `returned` : les six pièces du Rafiot rendues au Fanal du 3e, son pont vide.
 */
export const criqueDecorFacets = (returned = false): Facets => mergeFacets([volcanoFarFacets(), lavaFacets(), plumeFacets(), digueFacets(), rafiot4eFacets(returned), aiguillesFacets()]);

// ---------- L'aéronef ----------

/** Les triangles de l'aéronef entier (le fichier `3-aeronef/final-1464.glb`, toutes ses parties). */
export const NEF_4E_MODEL_TRIANGLES = 1464;

/** Les parties de l'aéronef (ses os) qui arrivent à chaque temps (world/nefModels.ts, `NEF_SISTERS[3]`). */
export const NEF_4E_TEMPS = { 1: ['coque', 'lanterne'], 2: ['cabine', 'rotor', 'mat'], 3: ['helices', 'derive'] } as const satisfies Readonly<Record<1 | 2 | 3, readonly string[]>>;

/**
 * Le modèle de l'aéronef (`3-aeronef/final-1464.glb`) : à l'échelle du voilier et du dirigeable, le milieu de sa coque
 * (x de −1,6 à 6,6, z de 2,0 à 10,1 ; la proue vers −z ; le bas de la coque à y −0,9).
 */
const MODEL = { scale: 0.65, center: { x: 2.5, z: 6 } } as const;

/** La hauteur de la Nef sur son aire : ses patins sur les planches. */
const LIFT = { ber: CRIQUE_PAD.deck + 0.6 } as const;

/** Le poste : au milieu de l'aire, la proue vers le large (le `z` du repère de la Crique). */
const BERTH = (() => {
  const p = CRIQUE.toWorld(CRIQUE_PAD.pad.x, CRIQUE_PAD.pad.z);
  return { x: p.x, z: p.z, yaw: Math.atan2(Math.sin(CRIQUE.yaw + Math.PI), Math.cos(CRIQUE.yaw + Math.PI)) };
})();

/**
 * Les pièces déposées du dirigeable (intention, § 3 : jamais un second modèle), et la partie de l'aéronef dont l'arrivée
 * les fait partir : leur sœur dans la mue de la grille (world/nefModels.ts, `NEF_SISTERS[3]`, que le monde continu ne lit
 * pas : un test vérifie qu'elles s'accordent). La toile pliée (le ballon) part avec la cabine, les cordes lovées (les
 * suspentes) avec le mât, le gouvernail démonté (l'empennage) avec les hélices.
 */
export const DEPOSIT_SISTERS = { ballon: 'cabine', suspentes: 'mat', empennage: 'helices' } as const;
type Deposit = keyof typeof DEPOSIT_SISTERS;
const DEPOSITS = Object.keys(DEPOSIT_SISTERS) as Deposit[];

/** Le temps où une pièce déposée part : celui de la partie neuve qui la reprend. */
function depositLeaves(piece: Deposit): 1 | 2 | 3 {
  const sister: string = DEPOSIT_SISTERS[piece];
  const temps = ([1, 2, 3] as const).find((k) => (NEF_4E_TEMPS[k] as readonly string[]).includes(sister));
  if (temps === undefined) throw new Error(`crique4e : la sœur ${sister} de ${piece} n'est dans aucun temps`);
  return temps;
}

/**
 * Les pièces déposées encore sur l'aire à un temps (aucune après le départ). La vue passe le temps d'avant tant qu'une
 * partie descend : une pièce ne part que quand sa sœur touche l'aire.
 */
export function envelopeShown(look: NefLook): Deposit[] {
  if (look === 4) return [];
  return DEPOSITS.filter((p) => look < depositLeaves(p));
}

/**
 * Où sont les pièces déposées, dans le repère de la Crique (intention, § 3) : la toile sur l'aire, du côté de la
 * passerelle, entre l'arrivée de la passerelle et la coque, couchée le long d'elle (à sa droite vue du quai) ; les
 * cordes lovées sur la toile ; le gouvernail de l'autre côté de la coque, ses deux plans côte à côte, jamais en croix ;
 * la bouée, après le départ, dans l'eau sur le flanc de l'aire, à 1,5 environ hors de l'anneau (retouche 1 du directeur
 * artistique : derrière le bord, elle se perdait) : on la voit de la passerelle et du demi-tour du quai.
 */
export const DEPOSIT_SPOTS = {
  toile: { x: 2.4, z0: 42.8, z1: 45.6, width: 1.0 },
  coil: { x: 2.4, z: 44.55, r: 0.36 },
  gouvernail: { x: -2.45, zs: [43.95, 45.25], size: [0.85, 1.15] },
  buoy: { x: -6.1, z: 45 },
} as const;

/** Les couleurs des pièces déposées : la toile crème et sa bande vert île, ses cordes ; le gouvernail (sa toile, son cadre). */
const DEPOSIT_COLORS = { toile: 0xf2eee4, band: NEF_BAND, rope: 0x8a7a5e, rudder: 0x8f8268, rudderTop: 0xb5a88a } as const;

/** La bouée du 4e, à la couleur de la bande de la Nef, comme au 5e. */
const BUOY_COLORS = { buoy: NEF_BAND, buoyTop: 0xf2eee4 } as const;

/** Les pièces déposées d'un temps, et la bouée après le départ, posées dans le monde. */
function depositFacets(look: NefLook): Facets {
  const b = new FacetBuilder();
  const shown = envelopeShown(look);
  const y = CRIQUE_PAD.deck;
  const { toile, coil, gouvernail, buoy } = DEPOSIT_SPOTS;
  const C = DEPOSIT_COLORS;
  if (shown.includes('ballon')) {
    // Deux plis plats, le second un peu plus court ; la bande vert île en travers ; deux cordes qui les lient.
    const mid = (toile.z0 + toile.z1) / 2;
    const len = toile.z1 - toile.z0;
    b.box({ x: toile.x, y, z: mid }, [toile.width, 0.13, len], C.toile);
    b.box({ x: toile.x - 0.04, y: y + 0.13, z: mid + 0.08 }, [toile.width - 0.12, 0.11, len - 0.4], C.toile);
    b.box({ x: toile.x, y: y - 0.005, z: toile.z0 + 0.6 }, [toile.width + 0.02, 0.255, 0.32], C.band);
    for (const z of [toile.z0 + 0.2, toile.z1 - 0.35]) b.box({ x: toile.x, y: y - 0.005, z }, [toile.width + 0.04, 0.265, 0.06], C.rope);
  }
  if (shown.includes('suspentes')) {
    // Le rouleau des cordes, bas, sur la toile : son dessus en couronne, son tour.
    const top = y + 0.24;
    b.annulus({ x: coil.x, y: top, z: coil.z }, coil.r * 0.4, coil.r, 0.12, 8, C.rope, C.rope, false);
    b.band({ x: coil.x, y: top, z: coil.z }, coil.r, 0.12, 8, C.rope);
  }
  if (shown.includes('empennage'))
    for (const z of gouvernail.zs) b.box({ x: gouvernail.x, y, z }, [gouvernail.size[0], 0.08, gouvernail.size[1]], C.rudder, C.rudderTop);
  if (look === 4) buoyAt(b, buoy.x, buoy.z, BUOY_COLORS);
  return placeFacets(b.build(), { x: CRIQUE.origin.x, y: 0, z: CRIQUE.origin.z, yaw: CRIQUE.yaw });
}

/** Ce que l'aire porte à chaque temps, fait une fois. */
const deposits = new Map<NefLook, Facets>();
const depositOnce = (look: NefLook): Facets => {
  let f = deposits.get(look);
  if (!f) deposits.set(look, (f = depositFacets(look)));
  return f;
};

// ---------- Les îles du ciel ----------

/** Une île du ciel : son milieu, le haut de son dessus plat, son rayon, la profondeur de son cône, ses pans. */
interface SkyIsland {
  x: number;
  z: number;
  top: number;
  r: number;
  depth: number;
  sides: number;
  /** Les deux îles entre lesquelles passe l'aéronef : −1 à gauche de sa route, 1 à droite. */
  gate?: -1 | 1;
}

/**
 * Les îles du ciel, l'obstacle du 4e (fiche, § 5 ; intention, § 4) : au nord-est, au-dessus de la mer, au-delà du
 * Bastion, loin du panache (qui penche vers le sud-est, à l'ouest) ; cinq îles immobiles, plates dessus, à des distances
 * différentes, toutes au-delà du brouillard du loin et en deçà de `FOLLOW_FAR_4E`. Leur hauteur : celle qui les met dans
 * l'image de la caméra qui suit Kéo au quai, tournée vers elles (au-dessus de la rangée et de la grue du Gabarit) ; plus
 * haut, la caméra, qui plonge, les coupait (voir `docs/rendu/style.md`).
 */
export const SKY_ISLANDS_4E: readonly SkyIsland[] = [
  { x: 231, z: -78, top: 19, r: 8, depth: 8, sides: 8 },
  { x: 258, z: -104, top: 23, r: 11, depth: 12, sides: 9, gate: -1 },
  { x: 298, z: -86, top: 26, r: 13, depth: 13, sides: 10, gate: 1 },
  { x: 249, z: -158, top: 27, r: 12, depth: 13, sides: 9 },
  { x: 356, z: -87, top: 24, r: 10, depth: 11, sides: 8 },
];

/**
 * Les couleurs des îles du ciel (intention, § 4 : en terre et en herbe brûlée du 4e, dessous de roche), à elles seules :
 * la vue les dessine sans ombre, peu voilées (levelWorld.ts, `thinFog`), et une couleur à elles ne prend pas ce
 * traitement à un autre décor. L'herbe brûlée du dessus, le bord de terre, la roche côté soleil et côté ombre.
 */
export const SKY_ISLAND_COLORS = { grass: 0xa99b6e, earth: 0x9a6a5c, rock: 0x86665a, rockShade: 0x725850 } as const;

/** Une île du ciel : son dessus plat (l'herbe), son bord de terre, puis un cône renversé de roche en deux tronçons. */
function skyIsland(b: FacetBuilder, v: SkyIsland, turn: number): void {
  const C = SKY_ISLAND_COLORS;
  // Un contour un peu irrégulier, jamais rond ni en boule.
  const ring = (r: number, y: number): P3[] =>
    Array.from({ length: v.sides }, (_, k): P3 => {
      const a = turn + (2 * Math.PI * k) / v.sides;
      const wobble = 1 + 0.1 * Math.sin(3 * a + turn);
      return [v.x + r * wobble * Math.cos(a), y, v.z + r * wobble * Math.sin(a)];
    });
  const top = ring(v.r, v.top);
  const rim = ring(v.r, v.top - 1.4);
  const waist = ring(0.6 * v.r, v.top - 0.5 * v.depth);
  const tip: P3 = [v.x + 0.08 * v.r, v.top - v.depth, v.z - 0.06 * v.r];
  const sunny = (k: number) => {
    const a = turn + (2 * Math.PI * (k + 0.5)) / v.sides;
    return Math.cos(a) * SUN_4E.x + Math.sin(a) * SUN_4E.z > 0;
  };
  for (let k = 1; k + 1 < v.sides; k++) b.triangle(top[0], top[k + 1], top[k], C.grass);
  for (let k = 0; k < v.sides; k++) {
    const n = (k + 1) % v.sides;
    const rock = sunny(k) ? C.rock : C.rockShade;
    b.quad(rim[n], rim[k], top[k], top[n], C.earth);
    b.quad(waist[n], waist[k], rim[k], rim[n], rock);
    b.triangle(waist[k], waist[n], tip, rock);
  }
}

/**
 * Les îles du ciel d'un écran en portrait (Règle commune du port en portrait, choix du mainteneur du 24 octobre 2026 ;
 * consultant UX UI, pistes v2, § 2) : la caméra garde sa hauteur de vue, la largeur vue est donc bien plus étroite (au
 * quart de tour depuis le quai, environ 28° en 390 × 844 au lieu de 70° en paysage) ; deux îles de `SKY_ISLANDS_4E`
 * passaient sous la colonne de boutons de gauche et une sortait du cadre. Plus basses dans l'image, elles passeraient
 * derrière le Bastion, qui tient le milieu de cette vue (le Gabarit, sa grue, la Loge : leurs toits à 7 % du haut de
 * l'écran) : il ne reste du ciel libre, entre les colonnes de boutons et sous la ligne des 50 px, qu'un coin de chaque
 * côté du Bastion, d'environ 2,5° chacun. D'où deux îles, plus petites, une dans chaque coin, qui sont la porte : entières,
 * hors des boutons, jamais derrière un toit, en 800 × 1280 comme en 390 × 844, leur haut à 50 px au moins du bord du
 * haut, leur pointe au-dessus de la mer qu'on voit encore (en deçà du bout de la brume). La caméra ne bouge pas ; en
 * paysage, rien ne change. Le départ passe entre elles, au-dessus du Bastion (`SKY_ROUTES`). Retouche 1 des restes,
 * point 9 (directeur artistique) : leur cône de dessous épaissi (`depth` 5 → 7,5 : une île de roche qui flotte, plus
 * une plaque) ; celle de droite, qui passait sous la pastille de niveau en 390 × 844, descend sous elle (son haut à 78 px
 * au moins du bord du haut : `top` 15 → 7,2 ; à 12, la valeur de départ, il n'était qu'à 65 px). Si bas, son dessus est
 * sous l'œil de la caméra (vers 8,5) : pour que sa pointe reste à 0,6 au-dessus de l'eau, son cône s'arrête à 6,6.
 */
export const SKY_ISLANDS_4E_PORTRAIT: readonly SkyIsland[] = [
  { x: 290, z: -69, top: 14, r: 5.5, depth: 7.5, sides: 8, gate: -1 },
  { x: 372, z: -48, top: 7.2, r: 5.5, depth: 6.6, sides: 8, gate: 1 },
];

/** Les îles du ciel de chaque liste, faites une fois (elles ne changent pas : la même chose avant, pendant et après le départ). */
const skyFacets = new Map<readonly SkyIsland[], Facets>();
const skyIslandsOf = (list: readonly SkyIsland[]): Facets => {
  let f = skyFacets.get(list);
  if (f) return f;
  const b = new FacetBuilder();
  list.forEach((v, i) => skyIsland(b, v, i * 0.7));
  skyFacets.set(list, (f = b.build()));
  return f;
};
export const skyIslandsFacets = (): Facets => skyIslandsOf(SKY_ISLANDS_4E);
/** Les îles du ciel d'un écran en portrait, faites une fois. */
export const skyIslandsPortraitFacets = (): Facets => skyIslandsOf(SKY_ISLANDS_4E_PORTRAIT);

/** Une île du ciel d'une liste touchée (un point du sol, de l'eau ou d'une île) : une zone large, jamais un détail à viser, comme le mur du 5e. */
const touchedIn = (list: readonly SkyIsland[], p: Vec2): boolean => list.some((v) => Math.hypot(p.x - v.x, p.z - v.z) <= v.r + 10);
export const skyIslandTouched = (p: Vec2): boolean => touchedIn(SKY_ISLANDS_4E, p);

/** Le passage entre les deux îles de la porte d'une liste : son milieu, à mi-hauteur de leurs cônes. */
function gateOf(list: readonly SkyIsland[]): Vec3 {
  const [a, c] = list.filter((v) => v.gate);
  return { x: (a.x + c.x) / 2, y: (a.top - a.depth / 2 + c.top - c.depth / 2) / 2, z: (a.z + c.z) / 2 };
}
export const SKY_GATE_4E: Vec3 = gateOf(SKY_ISLANDS_4E);
/** La porte des îles du ciel d'un écran en portrait. */
export const SKY_GATE_4E_PORTRAIT: Vec3 = gateOf(SKY_ISLANDS_4E_PORTRAIT);

// ---------- Le départ ----------

/**
 * Le départ (intention, § 4) : l'aéronef monte droit au-dessus de l'aire de `rise` en tournant (il prend le cap de sa
 * route), puis file vers le nord-est, passe entre les deux îles de la porte (qui ne bougent pas : pas de brèche), et
 * continue de `beyond` au-delà en montant encore de `climb`. Huit secondes au plus, qu'un toucher termine ; il ne finit
 * pas avant d'avoir passé la ligne des îles (`obstacleDone`). Lent au départ, puis de plus en plus vite (`ease`). En
 * portrait, la porte est plus basse : il monte de même, puis descend vers elle par-dessus le Bastion.
 */
export const NEF_4E_DEPARTURE = { seconds: 8, rise: 18, beyond: 70, climb: 8, ease: 1.6, outOfView: 0.5, pointBeyond: 180 } as const;

/** Un chemin du départ : ses points, ses tronçons, sa longueur, la part du temps de la porte, son cap. */
interface SkyRoute {
  points: readonly P3[];
  legs: readonly number[];
  length: number;
  /** La part du temps du départ où l'aéronef passe la ligne des îles (la porte). */
  gateAt: number;
  /** Le cap de la route, de la montée à la porte (la proue du modèle regarde vers −z : un cap la tourne vers (−sin, −cos)). */
  heading: number;
}

/** Le chemin du départ, dans le monde : du poste, droit en haut, jusqu'à la porte `g`, puis au-delà. */
function routeTo(g: Vec3): SkyRoute {
  const D = NEF_4E_DEPARTURE;
  const dx = g.x - BERTH.x,
    dz = g.z - BERTH.z;
  const l = Math.hypot(dx, dz);
  const points: P3[] = [
    [BERTH.x, LIFT.ber, BERTH.z],
    [BERTH.x, LIFT.ber + D.rise, BERTH.z],
    [g.x, g.y, g.z],
    [g.x + (dx / l) * D.beyond, g.y + D.climb, g.z + (dz / l) * D.beyond],
  ];
  const legs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1], p[2] - points[i][2]));
  const length = legs.reduce((s, n) => s + n, 0);
  return {
    points,
    legs,
    length,
    gateAt: ((legs[0] + legs[1]) / length) ** (1 / D.ease),
    heading: Math.atan2(-(points[2][0] - points[1][0]), -(points[2][2] - points[1][2])),
  };
}

/** Les deux chemins du départ : en paysage, et en portrait (vers la porte, plus basse). */
const SKY_ROUTES = { wide: routeTo(SKY_GATE_4E), tall: routeTo(SKY_GATE_4E_PORTRAIT) } as const;

/** Où est la Nef au départ, à la fraction `u` (0 à 1) du temps, sur le chemin `r` (rempli dans `out`, rien n'est créé). */
function flightOn(r: SkyRoute, u: number, out: NefFlight): NefFlight {
  const t = Math.min(1, Math.max(0, u));
  let rest = t ** NEF_4E_DEPARTURE.ease * r.length;
  const climbed = Math.min(1, rest / r.legs[0]);
  let i = 0;
  while (i < r.legs.length - 1 && rest > r.legs[i]) rest -= r.legs[i++];
  const a = r.points[i];
  const b = r.points[i + 1];
  const f = r.legs[i] > 0 ? Math.min(1, rest / r.legs[i]) : 1;
  out.x = a[0] + (b[0] - a[0]) * f;
  out.y = a[1] + (b[1] - a[1]) * f;
  out.z = a[2] + (b[2] - a[2]) * f;
  // Il tourne pendant qu'il monte, du cap de l'aire à celui de sa route.
  const w = climbed * climbed * (3 - 2 * climbed);
  const turn = Math.atan2(Math.sin(r.heading - BERTH.yaw), Math.cos(r.heading - BERTH.yaw));
  out.yaw = BERTH.yaw + turn * w;
  out.shiftX = 0;
  out.shiftZ = 0;
  out.open = 0;
  return out;
}

/** La bouée du 4e dans le monde, et la marge d'un toucher sur elle (une cible large). */
const BUOY_WORLD = CRIQUE.toWorld(DEPOSIT_SPOTS.buoy.x, DEPOSIT_SPOTS.buoy.z);

/** Où est la Nef au départ, à la fraction `u` (0 à 1) du temps (rempli dans `out`, rien n'est créé). */
export const nef4eFlight = (u: number, out: NefFlight): NefFlight => flightOn(SKY_ROUTES.wide, u, out);

/** Un toucher sur l'aéronef : sur son aire, ou sur la bouée (après le départ, elle ouvre la rangée « Revenir »). */
function nef4eTouched(p: Vec2): boolean {
  return Math.hypot(p.x - BERTH.x, p.z - BERTH.z) <= CRIQUE_PAD.radius || Math.hypot(p.x - BUOY_WORLD.x, p.z - BUOY_WORLD.z) <= BUOY_TOUCH;
}

/**
 * L'aéronef du 4e (lot 4) : sur son aire, ses pièces déposées et, après le départ, la bouée (`ber`) ; les îles du ciel,
 * son obstacle, les mêmes avant et après le départ (`obstacle`, `after` : elles ne changent pas), jamais sur la Carte
 * (`offMap` : sans nom, elles s'y lisaient comme des îles en mer, des lieux où aller) ; le départ entre deux d'entre elles.
 * En portrait (`portrait`), les îles resserrées et leur départ.
 */
export const NEF_4E: NefSite = {
  form: 3,
  temps: NEF_4E_TEMPS,
  model: MODEL,
  lift: LIFT,
  berth: BERTH,
  ber: depositOnce,
  obstacle: skyIslandsFacets,
  after: skyIslandsFacets,
  offMap: true,
  stays: () => null,
  obstacleTouched: skyIslandTouched,
  touched: nef4eTouched,
  seconds: NEF_4E_DEPARTURE.seconds,
  outOfView: NEF_4E_DEPARTURE.outOfView,
  obstacleDone: SKY_ROUTES.wide.gateAt,
  pointBeyond: NEF_4E_DEPARTURE.pointBeyond,
  flight: nef4eFlight,
  portrait: {
    obstacle: skyIslandsPortraitFacets,
    after: skyIslandsPortraitFacets,
    obstacleTouched: (p) => touchedIn(SKY_ISLANDS_4E_PORTRAIT, p),
    obstacleDone: SKY_ROUTES.tall.gateAt,
    flight: (u, out) => flightOn(SKY_ROUTES.tall, u, out),
  },
};

/** Ce que coûtent les pièces déposées au plus (ou la bouée), et les îles du ciel (le modèle se compte à part : la vue le charge). */
export function nef4eSiteTriangles(): { ber: number; islands: number } {
  return { ber: Math.max(...([0, 1, 2, 3, 4] as const).map((look) => depositOnce(look).triangles)), islands: Math.max(skyIslandsFacets().triangles, skyIslandsPortraitFacets().triangles) };
}
