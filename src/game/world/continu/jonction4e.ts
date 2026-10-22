// La Jonction (les Coteaux du 4e, GD-24, lieu du monde ouvert seulement ; intention du directeur artistique du 22 octobre
// 2026, § 5, sur la planche `selection-coteaux-v3`) : « l'ancienne bifurcation de la ligne : une voie principale arrive,
// et des voies de service s'y rattachent, chacune jusqu'à son heurtoir ». Sur le gabarit de l'Étalon (./etalon4e.ts), avec
// le kit commun des Coteaux (./place4eKit.ts). Les rails sont ceux du lot 1 (`RAILS_4E.branch`, `.sidings`) : le lieu ne
// les déplace pas, il y a toujours trois voies à l'image. Il dessine ce que sa ruine et ses étapes changent
// (`JONCTION_TRACK_4E`, ./paths4e.ts le lui laisse) : la plaque tournante sur la première voie de service, à quelques pas
// de l'aiguillage, les rails passant sur son tablier (jamais un disque à côté, jamais un puits) ; le tronçon du rail tordu
// ; les deux heurtoirs. Le poste d'aiguillage, une cabine de bois sur un socle de pierre, entre la voie principale et la
// seconde voie de service ; ses quatre leviers dehors, en rangée devant lui le long de la voie, de fer, sans numéro ; au
// bout de la rangée, le support vide du grand levier et ses deux goujons nus : le signe de l'absence du 4e (pris par les
// Ferrailleurs), avant comme après. La lanterne de voie sur son mât de fer, au bord de la voie principale.
//
// La ruine, d'après le texte : le poste sans toit, ses deux pans tombés à plat à côté du socle ; les leviers d'un brun
// éteint, deux qui penchent ; la plaque bloquée de travers, à un huitième de tour, sa fosse à moitié comblée de terre
// noire ; un rail tordu qui se soulève en arc ; le heurtoir de la seconde voie couché ; la lanterne de voie éteinte, sa
// vitre grise. Une seule lumière, la lanterne du cantonnier, au poteau du poste. Rien sur le chemin, rien sur la voie
// principale. Cinq parties (3 + 1 + 1) : le poste ; les leviers, leurs tringles et l'aiguillage ; la plaque ; le toit
// du poste et la lanterne de voie ; les voies de service refaites et la lanterne du chemin. L'image d'une phrase reste
// dans la bouche du cantonnier, jamais dans la 3D. Aucune lueur, rien d'orange, rien à lire, rien qui bouge. Code pur.
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C4E, SINK, armLantern, capOf, emptyMount, inWorld, lantern, once, postLantern, quadOut, sceneRight, sceneRise, sheet, site4e, type P3 } from './place4eKit';
import { RAILS_LOOK_4E } from './paths4e';
import { COLORS_4E, JONCTION_TRACK_4E, RAILS_4E } from './plan4e';

/**
 * Les couleurs propres à la Jonction, en plus des matières des Passeurs (`C4E`) : les rails, ceux du lot 1 (la même
 * ligne, d'un seul tenant, `COLORS_4E`) ; la fenêtre du poste, sombre, sans lumière derrière ; la porte du poste ; le
 * ballast ; le bois des cales.
 */
const C = {
  rail: COLORS_4E.rust,
  railShade: COLORS_4E.rustShade,
  ballast: COLORS_4E.ballast,
  window: 0x4f5a5e,
  door: 0x7c6a5e,
  // Le cantonnier, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, veste de toile, chemise.
  boots: 0x55595a,
  jacket: 0x6e6458,
  shirt: 0x7e8a8e,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site4e('jonction');

/** L'aiguillage, là où la voie se partage (le bout de l'embranchement), depuis le centre du lieu. */
const SWITCH: Vec2 = SITE.toLocal(RAILS_4E.branch[RAILS_4E.branch.length - 1]);

/** Une voie de service : son sens depuis l'aiguillage, le sens en travers (à sa droite en allant), sa longueur, son cap. */
const SIDINGS = RAILS_4E.sidings.map((s) => {
  const end = SITE.toLocal(s[s.length - 1]);
  const len = Math.hypot(end.x - SWITCH.x, end.z - SWITCH.z);
  const u = { x: (end.x - SWITCH.x) / len, z: (end.z - SWITCH.z) / len };
  return { u, across: { x: u.z, z: -u.x }, len, yaw: Math.atan2(u.x, u.z) };
});

/** Le point à `d` unités de l'aiguillage sur la voie de service `k`, décalé de `v` en travers. */
function onSiding(k: number, d: number, v = 0): Vec2 {
  const S = SIDINGS[k];
  return { x: SWITCH.x + S.u.x * d + S.across.x * v, z: SWITCH.z + S.u.z * d + S.across.z * v };
}

/** Le sens de la voie principale, de l'aiguillage vers le nord-est, et le sens en travers vers le sud-est. */
const MAIN = (() => {
  const b = RAILS_4E.branch;
  const p = SITE.toLocal(b[b.length - 2]);
  const len = Math.hypot(p.x - SWITCH.x, p.z - SWITCH.z);
  const u = { x: (p.x - SWITCH.x) / len, z: (p.z - SWITCH.z) / len };
  return { u, across: { x: -u.z, z: u.x } };
})();

/** La hauteur du dessus du ballast, et celle du pied des rails, au-dessus du sol (comme ./paths4e.ts). */
const R = RAILS_LOOK_4E;
const ballastY = (p: Vec2): number => SITE.ground(p.x, p.z) + R.lift + R.ballastTop;
const railY = (p: Vec2): number => ballastY(p) + 0.08;

/**
 * Le poste d'aiguillage, entre la voie principale et la seconde voie de service, au sud-est de celle-ci : sa place sur la
 * voie (`d`, `v`), sa largeur en travers, sa longueur le long de la voie, la hauteur de son socle et de ses murs.
 */
const POSTE = { d: 5.0, v: 3.7, across: 2.0, along: 2.6, socle: 0.5, h: 2.2 } as const;
const POSTE_AT = onSiding(1, POSTE.d, POSTE.v);
/** Un point du poste : `a` le long de la voie, `c` en travers (vers le sud-est), depuis son milieu. */
const posteAt = (a: number, c: number): Vec2 => ({ x: POSTE_AT.x + SIDINGS[1].u.x * a + SIDINGS[1].across.x * c, z: POSTE_AT.z + SIDINGS[1].u.z * a + SIDINGS[1].across.z * c });
const posteY = once(() => SITE.ground(POSTE_AT.x, POSTE_AT.z));

/** La rangée des leviers, devant le poste le long de la seconde voie : son décalage, ses leviers, le support vide au bout. */
const LEVERS = { v: 1.75, from: 3.0, to: 6.1, at: [3.3, 3.9, 4.5, 5.1], mount: 5.75, h: 1.15 } as const;

/** La lanterne de voie, sur son mât de fer, au bord de la voie principale, au sud-est, avant l'aiguillage. */
const MAST = { x: SWITCH.x + MAIN.u.x * 3.2 + MAIN.across.x * 1.75, z: SWITCH.z + MAIN.u.z * 3.2 + MAIN.across.z * 1.75, h: 2.4 } as const;

/** La plaque tournante, sur la première voie de service (`JONCTION_TRACK_4E`) ; dans la ruine, d'un huitième de tour. */
const PLAQUE = JONCTION_TRACK_4E.plaque;
const PLAQUE_AT = onSiding(PLAQUE.siding, PLAQUE.d);

/** Le tronçon du rail tordu, et les traverses du lot 1 qui y tombent (une tous les `sleeper`, comme ./paths4e.ts). */
const TWISTED = JONCTION_TRACK_4E.twisted;
const sleepersIn = (k: number, from: number, to: number): number[] => {
  const len = SIDINGS[k].len;
  const m = Math.max(1, Math.ceil(len / R.sleeper));
  return Array.from({ length: m }, (_, i) => (len * (i + 0.5)) / m).filter((d) => d > from && d < to);
};

/** La lanterne du chemin (les abords), entre le chemin et la seconde voie, hors de l'un et de l'autre. */
const PATH_LANTERN = { x: -3.63, z: -0.34, h: 1.35 } as const;

// ---------- La vue ----------

/** Le cap d'arrivée (intention, « Les caps ») : 210°, l'aiguillage au premier plan, les voies de service qui s'écartent. */
const DOOR_VIEW = capOf(210);

/** La vue d'arrivée basse, à hauteur de Kéo. */
const DOOR_FRAME = { height: -3, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus du poste. */
const MAP_POINT: Vec3 = {
  x: POSTE_AT.x,
  get y() {
    return posteY() + POSTE.socle + POSTE.h + 2.3;
  },
  z: POSTE_AT.z,
};

// ---------- Les rails ----------

/** Un rail de `d0` à `d1` sur la voie `k`, à `v` en travers : son dessus et ses deux flancs (comme ./paths4e.ts). */
function railRun(b: FacetBuilder, k: number, d0: number, d1: number, v: number): void {
  const S = SIDINGS[k];
  const h = R.rail / 2;
  const at = (d: number, w: number, top: boolean): P3 => {
    const p = onSiding(k, d, v + w);
    return [p.x, railY(onSiding(k, d)) + (top ? R.rail : 0), p.z];
  };
  quadOut(b, at(d0, -h, true), at(d1, -h, true), at(d1, h, true), at(d0, h, true), [0, 1, 0], C.rail);
  for (const s of [-1, 1]) quadOut(b, at(d0, s * h, false), at(d1, s * h, false), at(d1, s * h, true), at(d0, s * h, true), [S.across.x * s, 0, S.across.z * s], C.railShade);
}

/** Une traverse de la voie `k` à `d` ; `off` : déplacée (de combien le long de la voie, en travers, de quel angle). */
function sleeper(b: FacetBuilder, k: number, d: number, off?: { d: number; v: number; yaw: number; tilt: number }): void {
  const p = onSiding(k, d + (off?.d ?? 0), off?.v ?? 0);
  b.box({ x: p.x, y: ballastY(p) - (off ? 0.04 : 0), z: p.z, yaw: SIDINGS[k].yaw + (off?.yaw ?? 0), pitch: off?.tilt ?? 0 }, [R.sleeperLength, 0.08, 0.32], C4E.woodShade, C4E.wood);
}

/** Un heurtoir au bout de la voie `k` : debout, cerclé (`band`), ou couché sur le ballast, de travers. */
function bufferStop(b: FacetBuilder, k: number, state: 'debout' | 'couche', band?: { color: number; top: number }): void {
  const S = SIDINGS[k];
  const end = onSiding(k, S.len);
  const y = ballastY(end);
  if (state === 'couche') {
    const p = onSiding(k, S.len - 0.4, 1.0);
    b.box({ x: p.x, y: y - 0.05, z: p.z, yaw: S.yaw + 0.5 }, [1.2, 0.7, 0.75], C4E.woodShade, C4E.wood);
    return;
  }
  b.box({ x: end.x, y, z: end.z, yaw: S.yaw }, [1.2, 0.75, 0.7], C4E.woodShade, C4E.wood);
  if (band) b.box({ x: end.x, y: y + 0.41, z: end.z, yaw: S.yaw }, [1.26, 0.16, 0.76], band.color, band.top);
}

// ---------- Le poste, les leviers, la plaque ----------

/** Le socle de pierre du poste : entier, ou fendu et affaissé à un angle, un bloc tombé à côté (la ruine). */
function posteSocle(b: FacetBuilder, whole: boolean): void {
  const P = POSTE;
  const yaw = SIDINGS[1].yaw;
  if (whole) {
    b.box({ x: POSTE_AT.x, y: SINK, z: POSTE_AT.z, yaw }, [P.across + 0.4, posteY() + P.socle - SINK, P.along + 0.4], C4E.stoneShade, C4E.stoneSun);
    return;
  }
  const m = posteAt(-0.25, 0);
  b.box({ x: m.x, y: SINK, z: m.z, yaw }, [P.across + 0.4, posteY() + P.socle - SINK, P.along - 0.1], C4E.stoneShade, C4E.stone);
  const c = posteAt(P.along / 2 - 0.05, 0.3);
  b.box({ x: c.x, y: SINK - 0.15, z: c.z, yaw: yaw + 0.1, pitch: 0.12 }, [P.across - 0.2, posteY() + P.socle - SINK, 0.6], C4E.stoneShade, C4E.stone);
  const f = posteAt(P.along / 2 + 0.8, 1.6);
  b.box({ x: f.x, y: SITE.ground(f.x, f.z) - 0.15, z: f.z, yaw: yaw + 0.7, pitch: 0.25 }, [0.55, 0.4, 0.45], C4E.stoneShade, C4E.stone);
}

/** La cabine du poste : ses planches neuves, sa porte et sa fenêtre côté voie, sans lumière derrière ; ou grise et cassée. */
function cabin(b: FacetBuilder, whole: boolean): void {
  const P = POSTE;
  const yaw = SIDINGS[1].yaw;
  const y = posteY() + P.socle - 0.02;
  if (!whole) {
    b.box({ x: POSTE_AT.x, y, z: POSTE_AT.z, yaw }, [P.across, 1.5, P.along], C4E.woodShade, C4E.wood);
    const u = posteAt(-0.65, 0);
    b.box({ x: u.x, y: y + 1.48, z: u.z, yaw }, [P.across, 0.6, 1.3], C4E.woodShade, C4E.wood);
    return;
  }
  b.box({ x: POSTE_AT.x, y, z: POSTE_AT.z, yaw }, [P.across, P.h, P.along], C4E.newShade, C4E.newWood);
  // La porte et la fenêtre, sur la face qui regarde la voie.
  const out: P3 = [-SIDINGS[1].across.x, 0, -SIDINGS[1].across.z];
  const face = (a0: number, a1: number, y0: number, y1: number, color: number) => {
    const p = posteAt(a0, -P.across / 2 - 0.012),
      q = posteAt(a1, -P.across / 2 - 0.012);
    quadOut(b, [p.x, y + y0, p.z], [q.x, y + y0, q.z], [q.x, y + y1, q.z], [p.x, y + y1, p.z], out, color);
  };
  face(-0.95, -0.15, 0, 1.75, C.door);
  face(0.3, 1.0, 1.0, 1.6, C.window);
}

/** Le toit du poste, à deux pans de tôle de fer bruni, son faîtage le long de la voie. */
function cabinRoof(b: FacetBuilder): void {
  const P = POSTE;
  const y = posteY() + P.socle + P.h - 0.02;
  const pt = (a: number, c: number, h: number): P3 => {
    const p = posteAt(a, c);
    return [p.x, y + h, p.z];
  };
  const L = P.along / 2 + 0.3,
    W = P.across / 2 + 0.3;
  sheet(b, [pt(-L, -W, 0), pt(L, -W, 0), pt(L, 0, 0.8), pt(-L, 0, 0.8)], 0.1, C4E.sheet, C4E.sheetUnder);
  sheet(b, [pt(-L, 0, 0.8), pt(L, 0, 0.8), pt(L, W, 0), pt(-L, W, 0)], 0.1, C4E.sheet, C4E.sheetUnder);
  const r = posteAt(0, 0);
  b.box({ x: r.x, y: y + 0.82, z: r.z, yaw: SIDINGS[1].yaw }, [0.3, 0.12, 2 * L + 0.1], C4E.iron, C4E.ironTop);
}

/** Les deux pans du toit tombés à plat à côté du socle, au sud-est (la ruine). */
function fallenRoof(b: FacetBuilder): void {
  for (const [a, c, tilt] of [
    [-0.6, 2.1, 0.06],
    [0.9, 3.3, -0.1],
  ] as const) {
    const p = posteAt(a, c);
    b.box({ x: p.x, y: SITE.ground(p.x, p.z) - 0.02, z: p.z, yaw: SIDINGS[1].yaw + 0.15 * Math.sign(a), pitch: tilt }, [1.4, 0.08, 3.1], C4E.rustDull, C4E.rustDullTop);
  }
}

/** Un levier de la rangée, à `d` sur la seconde voie : sa tige, penchée vers la voie de `lean`. */
function lever(b: FacetBuilder, d: number, lean: number, color: number): void {
  const L = LEVERS;
  const p = onSiding(1, d, L.v);
  const y = SITE.ground(p.x, p.z) + 0.25;
  const top = onSiding(1, d + Math.sin(lean * 0.3) * 0.2, L.v - Math.sin(lean) * L.h);
  b.beam({ x: p.x, y, z: p.z }, { x: top.x, y: y + Math.cos(lean) * L.h, z: top.z }, 0.1, color);
}

/** Le cadre bas de la rangée des leviers (toujours là), et le support vide du grand levier, au bout. */
function leverFrame(b: FacetBuilder): void {
  const L = LEVERS;
  const m = onSiding(1, (L.from + L.to) / 2, L.v);
  b.box({ x: m.x, y: SITE.ground(m.x, m.z) - 0.1, z: m.z, yaw: SIDINGS[1].yaw }, [0.35, 0.35, L.to - L.from], C4E.iron, C4E.ironTop);
  const e = onSiding(1, L.mount, L.v);
  emptyMount(b, { x: e.x, y: SITE.ground(e.x, e.z) + 0.25, z: e.z }, SIDINGS[1].yaw);
}

/** La plaque tournante : son tablier de fer plat, au ras du sol, et ses deux rails, tourné de `turn` sur la voie. */
function turntable(b: FacetBuilder, turn: number, deck: number, deckTop: number): void {
  const y = railY(PLAQUE_AT) - 0.06;
  b.prism({ x: PLAQUE_AT.x, y, z: PLAQUE_AT.z, yaw: turn }, PLAQUE.r, PLAQUE.r, 0.06, 10, deck, deckTop);
  const yaw = SIDINGS[PLAQUE.siding].yaw + turn;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  for (const side of [-1, 1]) b.box({ x: PLAQUE_AT.x + c * side * (R.gauge / 2), y, z: PLAQUE_AT.z - s * side * (R.gauge / 2), yaw }, [R.rail, R.rail + 0.06, 2 * PLAQUE.r - 0.1], C.railShade, C.rail);
}

/** La fosse ronde de pierre autour du tablier, au ras du sol : sa couronne. */
function pit(b: FacetBuilder, color: number): void {
  b.annulus({ x: PLAQUE_AT.x, y: railY(PLAQUE_AT) - 0.06, z: PLAQUE_AT.z }, PLAQUE.r, PLAQUE.pit, 0.03, 10, color, color, false);
}

// ---------- Le modèle ----------

function model(add: AddPiece): void {
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 1 / 3 };
  const corps3 = { stage: 0 as Stage, row: 2 / 3 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le poteau du poste et la lanterne du cantonnier (la seule allumée de la ruine) ; le cadre des leviers et
  // le support vide du grand levier ; le mât de la lanterne de voie ; le heurtoir de la première voie.
  add('ruine', 0, (b) => {
    const pole = posteAt(-POSTE.along / 2 - 0.1, -POSTE.across / 2 - 0.1);
    const y = posteY() + POSTE.socle;
    b.box({ x: pole.x, y: y - 0.1, z: pole.z }, [0.16, 2.8, 0.16], C4E.woodShade, C4E.wood);
    armLantern(b, pole.x, y + 2.1, pole.z, -SIDINGS[1].across.x, -SIDINGS[1].across.z, true);
    leverFrame(b);
    b.box({ x: MAST.x, y: SITE.ground(MAST.x, MAST.z) - 0.3, z: MAST.z }, [0.12, MAST.h + 0.3, 0.12], C4E.iron);
    b.box({ x: MAST.x, y: SITE.ground(MAST.x, MAST.z) + MAST.h - 0.05, z: MAST.z }, [0.5, 0.08, 0.08], C4E.iron);
    bufferStop(b, 0, 'debout');
  });

  // ---- La ruine ----
  // Le corps 1 la relève : le socle fendu, la cabine grise et cassée, sans toit.
  add(
    'ruine',
    0,
    (b) => {
      posteSocle(b, false);
      cabin(b, false);
    },
    corps1,
  );
  // Le corps 2 la relève : les quatre leviers d'un brun éteint, debout dans leur rangée, deux qui penchent ; une lame de
  // l'aiguillage couchée au bord du ballast.
  add(
    'ruine',
    0,
    (b) => {
      LEVERS.at.forEach((d, k) => lever(b, d, k === 1 ? 0.5 : k === 3 ? -0.45 : 0.08, C4E.rustDull));
      const p = onSiding(1, 1.4, -1.45);
      b.box({ x: p.x, y: SITE.ground(p.x, p.z) - 0.02, z: p.z, yaw: SIDINGS[1].yaw + 0.3 }, [0.12, 0.1, 2.2], C4E.rustDull, C4E.rustDullTop);
    },
    corps2,
  );
  // Le corps 3 la relève : la plaque bloquée d'un huitième de tour, sa fosse à moitié comblée de terre noire.
  add(
    'ruine',
    0,
    (b) => {
      pit(b, C4E.stoneShade);
      turntable(b, Math.PI / 4, C4E.rustDull, C4E.rustDullTop);
      const y = railY(PLAQUE_AT) + 0.02;
      const yaw = SIDINGS[PLAQUE.siding].yaw;
      const half = Array.from({ length: 7 }, (_, i) => {
        const a = yaw + (i / 6) * Math.PI;
        return [PLAQUE.pit * Math.cos(a), PLAQUE.pit * Math.sin(a)] as const;
      });
      b.plate({ x: PLAQUE_AT.x, y, z: PLAQUE_AT.z, pitch: -Math.PI / 2 }, half, C4E.earth);
    },
    corps3,
  );
  // Le haut la relève : les deux pans du toit à plat ; la lanterne de voie éteinte, sa vitre grise.
  add(
    'ruine',
    0,
    (b) => {
      fallenRoof(b);
      lantern(b, { x: MAST.x + 0.2, y: SITE.ground(MAST.x, MAST.z) + MAST.h - 0.05, z: MAST.z }, false);
    },
    haut,
  );
  // Les abords la relèvent : le rail tordu qui se soulève en arc sur trois traverses, l'autre rail droit ; deux traverses
  // déplacées ; le heurtoir de la seconde voie couché ; le cerclage terni du heurtoir de la première.
  add(
    'ruine',
    0,
    (b) => {
      const k = TWISTED.siding;
      railRun(b, k, TWISTED.from, TWISTED.to, -R.gauge / 2);
      const v = R.gauge / 2;
      const pts = [
        [TWISTED.from, 0, 0],
        [TWISTED.from + 1.1, 0.42, 0.18],
        [TWISTED.from + 2.1, 0.5, 0.36],
        [TWISTED.to, 0, 0],
      ] as const;
      for (let i = 0; i < pts.length - 1; i++) {
        const [d0, h0, w0] = pts[i],
          [d1, h1, w1] = pts[i + 1];
        const p = onSiding(k, d0, v + w0),
          q = onSiding(k, d1, v + w1);
        b.beam({ x: p.x, y: railY(onSiding(k, d0)) + R.rail / 2 + h0, z: p.z }, { x: q.x, y: railY(onSiding(k, d1)) + R.rail / 2 + h1, z: q.z }, R.rail, C.railShade);
      }
      const [first, second] = sleepersIn(k, TWISTED.from, TWISTED.to);
      sleeper(b, k, first);
      sleeper(b, k, second, { d: 0.3, v: 1.6, yaw: 0.6, tilt: 0.1 });
      sleeper(b, k, second, { d: 1.6, v: -1.8, yaw: -0.4, tilt: -0.08 });
      bufferStop(b, 1, 'couche');
      bufferStop(b, 0, 'debout', { color: C4E.rustDull, top: C4E.rustDullTop });
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : le poste, le socle réparé, la cabine aux planches neuves, sa porte, sa fenêtre.
  add(0, 0, (b) => {
    posteSocle(b, true);
    cabin(b, true);
  });
  // ---- Le corps 2 sur 3 : la rangée des leviers redressée, en fer bruni ; leurs tringles le long de la voie jusqu'à
  // l'aiguillage ; l'aiguillage remis (ses deux lames et leur tirant).
  add(0, 1 / 3, (b) => {
    for (const d of LEVERS.at) lever(b, d, 0.12, C4E.iron);
    const a = onSiding(1, LEVERS.from, LEVERS.v - 0.3),
      c = onSiding(1, 0.7, LEVERS.v - 0.3),
      e = onSiding(1, 0.4, R.gauge / 2 + 0.2);
    const y = (p: Vec2) => SITE.ground(p.x, p.z) + 0.15;
    b.beam({ x: a.x, y: y(a), z: a.z }, { x: c.x, y: y(c), z: c.z }, 0.07, C4E.iron);
    b.beam({ x: c.x, y: y(c), z: c.z }, { x: e.x, y: ballastY(e) + 0.05, z: e.z }, 0.07, C4E.iron);
    for (const side of [-1, 1]) {
      const p = onSiding(1, 0.2, side * 0.18),
        q = onSiding(1, 2.4, side * (R.gauge / 2 - 0.08));
      b.beam({ x: p.x, y: railY(p) + 0.05, z: p.z }, { x: q.x, y: railY(q) + 0.05, z: q.z }, 0.1, C4E.iron);
    }
  });
  // ---- Le corps 3 sur 3 : la plaque remise dans l'axe de la voie, sa fosse dégagée et dallée.
  add(0, 2 / 3, (b) => {
    pit(b, C4E.paving);
    turntable(b, 0, C4E.iron, C4E.ironTop);
  });
  // ---- Le haut : le toit du poste, à deux pans de tôle de fer bruni ; la lanterne de voie, qui s'allume.
  add(1, 0, (b) => {
    cabinRoof(b);
    lantern(b, { x: MAST.x + 0.2, y: SITE.ground(MAST.x, MAST.z) + MAST.h - 0.05, z: MAST.z }, true);
  });
  // ---- Les abords : les voies de service refaites (le rail tordu remplacé, les traverses remises) ; le heurtoir de la
  // seconde voie relevé, les deux cerclés de fer bruni ; la lanterne du chemin.
  add(2, 0, (b) => {
    const k = TWISTED.siding;
    for (const side of [-1, 1]) railRun(b, k, TWISTED.from, TWISTED.to, (side * R.gauge) / 2);
    for (const d of sleepersIn(k, TWISTED.from, TWISTED.to)) sleeper(b, k, d);
    bufferStop(b, 1, 'debout', { color: C4E.iron, top: C4E.ironTop });
    bufferStop(b, 0, 'debout', { color: C4E.iron, top: C4E.ironTop });
    const p = PATH_LANTERN;
    postLantern(b, p.x, SITE.ground(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, § 5) ; aucune sur le chemin ni entre les rails. */
const TRACE_SPOTS = {
  relatives: posteAt(1.0, -POSTE.across / 2 - 0.12),
  subordinates: { x: SWITCH.x + MAIN.u.x * 1.5 + MAIN.across.x * 1.45, z: SWITCH.z + MAIN.u.z * 1.5 + MAIN.across.z * 1.45 },
  voices: onSiding(PLAQUE.siding, PLAQUE.d, -(PLAQUE.pit + 0.45)),
  tenses: posteAt(-POSTE.along / 2 - 0.16, 0.3),
  moods: onSiding(1, 9, 2.2),
} as const;

/** Une burette d'huile à long bec, sur le socle du poste (Les relatives). */
function oilCan(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.relatives;
    const y = posteY() + POSTE.socle;
    l.prism({ x, y, z }, 0.13, 0.08, 0.22, 6, C4E.iron, C4E.ironTop);
    l.beam({ x, y: y + 0.18, z }, { x: x - SIDINGS[1].across.x * 0.35, y: y + 0.36, z: z - SIDINGS[1].across.z * 0.35 }, 0.035, C4E.iron);
  });
}

/** Un cric de voie de fer, debout au bord du ballast, à côté de l'aiguillage, jamais entre les rails (Les conjonctives). */
function trackJack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.subordinates;
    const y = SITE.ground(x, z);
    l.box({ x, y, z }, [0.34, 0.1, 0.3], C4E.iron, C4E.ironTop);
    l.box({ x, y: y + 0.1, z }, [0.14, 0.55, 0.14], C4E.iron, C4E.ironTop);
    l.box({ x: x + 0.12, y: y + 0.5, z }, [0.3, 0.05, 0.05], C4E.newShade, C4E.newWood);
  });
}

/** Une caisse de bois ouverte, pleine de crampons de fer, au bord de la plaque (Voix et paroles). */
function spikeCrate(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.voices;
    const y = SITE.ground(x, z);
    const yaw = SIDINGS[PLAQUE.siding].yaw;
    l.box({ x, y: y - 0.05, z, yaw }, [0.6, 0.38, 0.45], C4E.newShade, C4E.earth);
    for (const [dx, dz] of [
      [-0.14, -0.08],
      [0.05, 0.1],
      [0.16, -0.05],
    ])
      l.box({ x: x + dx, y: y + 0.33, z: z + dz, yaw: yaw + dx * 4 }, [0.05, 0.12, 0.2], C4E.iron, C4E.ironTop);
  });
}

/** Une pioche et une pelle à ballast, debout côte à côte contre le mur du poste, avec un écart, jamais en V (Les temps composés). */
function pickAndShovel(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.tenses;
    const y = posteY() + POSTE.socle;
    const step = { x: SIDINGS[1].across.x * 0.5, z: SIDINGS[1].across.z * 0.5 };
    l.box({ x, y, z }, [0.05, 1.05, 0.05], C4E.newShade, C4E.newWood);
    l.box({ x, y: y + 1.0, z, yaw: SIDINGS[1].yaw + Math.PI / 2 }, [0.5, 0.07, 0.07], C4E.iron, C4E.ironTop);
    const sx = x + step.x,
      sz = z + step.z;
    l.box({ x: sx, y: y + 0.32, z: sz }, [0.05, 0.85, 0.05], C4E.newShade, C4E.newWood);
    l.box({ x: sx, y, z: sz, yaw: SIDINGS[1].yaw }, [0.04, 0.34, 0.26], C4E.iron, C4E.ironTop);
  });
}

/** Une pile de traverses neuves, rangée au bord de la seconde voie (Les modes). */
function sleeperStack(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.moods;
    const y = SITE.ground(x, z);
    const yaw = SIDINGS[1].yaw;
    const a = SIDINGS[1].across;
    for (const [v, h] of [
      [-0.18, 0],
      [0.18, 0],
      [0, 0.12],
    ])
      l.box({ x: x + a.x * v, y: y + h, z: z + a.z * v, yaw }, [0.32, 0.12, R.sleeperLength], C4E.newShade, C4E.newWood);
  });
}

/** Les cinq traces, une par mission, chacune avec sa partie (le corps en trois, puis le haut, puis les abords). */
const TRACES = {
  'relative-clauses': { at: TRACE_SPOTS.relatives, lift: 1, stage: 0, row: 0, draw: oilCan },
  'subordinate-clauses': { at: TRACE_SPOTS.subordinates, lift: 1, stage: 0, row: 1 / 3, draw: trackJack },
  'passive-reported': { at: TRACE_SPOTS.voices, lift: 1, stage: 0, row: 2 / 3, draw: spikeCrate },
  'compound-tenses': { at: TRACE_SPOTS.tenses, lift: 1, stage: 1, row: 0, draw: pickAndShovel },
  moods: { at: TRACE_SPOTS.moods, lift: 1, stage: 2, row: 0, draw: sleeperStack },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (intention, § 5) : à l'ouest-sud-ouest, le dos à la voie principale, au pont et à la Forge. */
const SCENE_START = capOf(250);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers le cantonnier). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/** Le milieu de la scène, depuis le centre du lieu : vers le bout des voies de service, au sud de la première, à l'ouest de la plaque. */
const SCENE_SPOT = { dx: -10.2, dz: -5.2, half: [2.4, 1.2] as [number, number] } as const;

/** L'écart de Kéo et du cantonnier au milieu de la scène. */
const SCENE_HALF = 2.1;

/** La hauteur du sol de la scène au-dessus de son point : la terre. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, SITE.ground(SCENE_SPOT.dx, SCENE_SPOT.dz) + 0.04));

/** Le cantonnier en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, veste de toile, chemise. */
function trackman(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.3, 0.26, 0.5, 8, C.jacket);
  b.prism({ x: at.x, y: at.y + 0.64, z: at.z }, 0.26, 0.24, 0.34, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.jacket);
}

/** La traverse posée au sol sous la rangée des cales : sa hauteur, à l'échelle 1 ; une cale choisie se soulève d'un cran. */
const BEAM = { height: 0.14, lift: 0.3, chock: 0.26 } as const;

/** Une cale de roue en bois : un coin, toutes pareilles (une forme par réponse se lirait comme un indice). */
function chock(b: FacetBuilder, at: Vec3, s: number): void {
  b.extrude(
    { x: at.x, y: at.y, z: at.z - 0.13 * s },
    [
      [-0.22 * s, 0],
      [0.22 * s, 0],
      [-0.22 * s, 0.26 * s],
    ],
    0.26 * s,
    C4E.newShade,
    C4E.newWood,
  );
}

export const JONCTION: PlaceArt = {
  role: 'Le cantonnier',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3 + 1 + 1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : le heurtoir, le bout des voies et le ballast sont au lieu et aux rails ; les abords
  // (./jonctionSurroundings.ts) ajoutent ce qui cadre. Il reste le cantonnier en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) trackman(b, at, sphere);
  },
  answer: {
    size: { height: BEAM.height + BEAM.lift + BEAM.chock, half: 0.3 },
    facing: true,
    // Une traverse posée au sol, hors des voies, sous la rangée des cales.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BEAM.height * s;
      const foot = Math.min(ground, y) - 0.1;
      b.box({ x: mid, y: foot, z }, [span + 0.7, top - foot, 0.32 * s], C4E.woodShade, C4E.wood);
    },
    object(b, at, s, _i, _count, picked) {
      chock(b, { x: at.x, y: at.y + (BEAM.height + (picked ? BEAM.lift : 0)) * s, z: at.z }, s);
    },
  },
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers l'aiguillage.
  exit: { x: SITE.door.x - 0.5, z: SITE.door.z + 0.8 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Jonction, pour les tests et ses abords : l'aiguillage, les voies, le poste, la plaque, la caméra. */
export const JONCTION_LAYOUT = {
  switchAt: SWITCH,
  sidings: SIDINGS,
  onSiding,
  poste: POSTE,
  posteAt: POSTE_AT,
  levers: LEVERS,
  mast: MAST,
  plaque: PLAQUE_AT,
  pathLantern: PATH_LANTERN,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
} as const;
