import { afterEach, describe, expect, it } from 'vitest';
import { type BiomeId, BIOMES, BLOC, BLOCKS } from '../../biomes';
import { DECOR } from '../decor';
import { toutConstruitAvecLesCommandes } from '../budget';
import { worldCubes } from '../terrain';
import { applyLayout } from '../appliedLayout';
import { freeSpots, moveIsland } from '../arrange';
import { type ArchipelagoId, islandDef } from '../map';
import { turnCell } from '../placement';
import { LAYOUT_PAD, origineDe } from '../terrain/base';
import type { FacettesDuDecor } from '../decor/brush';
import { couleurDeMatiere } from '../palette';
import { HEART_DECOR_6E, type HeartDecor } from './heartDecor';
import { HEART_DECOR_5E, SCENE_LIGHT } from './heartDecor5e';
import { drawnHeartDecor } from './inTheWorld';

afterEach(() => {
  applyLayout(undefined);
});

const triCount = (f: FacettesDuDecor) => f.positions.length / 9;

/** Les cubes d’un archipel tout construit, toutes commandes livrées (avec le sol ; `worldOf` : sans). */
const cachedWorlds = new Map<ArchipelagoId, ReturnType<typeof worldCubes>>();
const wholeWorld = (a: ArchipelagoId) => {
  let m = cachedWorlds.get(a);
  if (!m) {
    const { progress, world } = toutConstruitAvecLesCommandes();
    m = worldCubes(a, progress, world, false);
    cachedWorlds.set(a, m);
  }
  return m;
};
const worldOf = (a: ArchipelagoId) => wholeWorld(a).filter((c) => !c.sol);
const sixthWorld = () => worldOf('6e');

const TABLES: [ArchipelagoId, Readonly<Partial<Record<BiomeId, readonly HeartDecor[]>>>][] = [
  ['6e', HEART_DECOR_6E],
  ['5e', HEART_DECOR_5E],
];

/** Les cases du monde (x, y) des colonnes d'un ensemble, tournées avec son île. */
function columnsInWorld(id: BiomeId, columns: readonly (readonly [number, number])[]): Set<string> {
  const o = origineDe(id);
  const q = islandDef(id).quarts;
  return new Set(
    columns.map(([x, y]) => {
      const t = turnCell(LAYOUT_PAD.x + x, LAYOUT_PAD.y + y, q);
      return `${o.x + t.x},${o.y + t.y}`;
    }),
  );
}

describe.each(TABLES)('le décor du cœur dessiné (%s)', (a, table) => {
  it('chaque ensemble du décor du cœur est dessiné, de 12 à 150 triangles, sans rien qui s’allume', () => {
    const drawn = drawnHeartDecor(a, worldOf(a));
    const expected = Object.entries(table).flatMap(([id, l]) => (l ?? []).map((e) => `coeur:${id}:${e.name}`));
    expect(drawn.map((d) => d.id).sort()).toEqual([...expected].sort());
    for (const d of drawn) {
      const n = triCount(d.opaque);
      expect(n, d.id).toBeGreaterThanOrEqual(12);
      expect(n, d.id).toBeLessThanOrEqual(150);
      expect(triCount(d.fire), d.id).toBe(0);
      expect(d.cellules.length, d.id).toBe(d.replaced.size);
    }
  });

  it('un ensemble remplace tous les cubes du décor de ses colonnes, et seulement eux ; son dessin reste sur ses colonnes', () => {
    const cubes = worldOf(a);
    const drawn = new Map(drawnHeartDecor(a, cubes).map((d) => [d.id, d]));
    for (const [id, l] of Object.entries(table) as [BiomeId, readonly HeartDecor[]][]) {
      for (const e of l) {
        const d = drawn.get(`coeur:${id}:${e.name}`)!;
        const columns = columnsInWorld(id, e.columns);
        const members = cubes.filter((c) => c.tag === id && !c.decor && !c.quest && !c.place && !c.bridge && !c.petiteConstruction && !c.ghost && columns.has(`${c.x},${c.y}`));
        expect(new Set(members.map((c) => `${c.x},${c.y},${c.z}`)), d.id).toEqual(d.replaced);
        // Le dessin : dans l'emprise de ses colonnes (un peu de marge pour une pelle ou un rabat), pas sous son sol.
        const xs = [...columns].map((k) => Number(k.split(',')[0]));
        const ys = [...columns].map((k) => Number(k.split(',')[1]));
        const base = Math.min(...members.map((c) => c.z));
        const p = d.opaque.positions;
        for (let i = 0; i < p.length; i += 3) {
          expect(p[i], d.id).toBeGreaterThanOrEqual(Math.min(...xs) - 0.15);
          expect(p[i], d.id).toBeLessThanOrEqual(Math.max(...xs) + 1.15);
          expect(p[i + 2], d.id).toBeGreaterThanOrEqual(Math.min(...ys) - 0.15);
          expect(p[i + 2], d.id).toBeLessThanOrEqual(Math.max(...ys) + 1.15);
          expect(p[i + 1], d.id).toBeGreaterThanOrEqual(base - 0.35);
          expect(p[i + 1], d.id).toBeLessThanOrEqual(Math.max(...members.map((c) => c.z)) + 1.05);
        }
      }
    }
  });
});

it('les îles qui ont un décor du cœur fait de main d’homme : toutes au 6e (la Forêt n’a que des arbres, la Tour sa pierre) et toutes au 5e', () => {
  expect(Object.keys(HEART_DECOR_6E)).toHaveLength(14);
  expect(BIOMES.filter((b) => b.classe === '6e' && !HEART_DECOR_6E[b.id]).map((b) => b.id).sort()).toEqual(['french-6e-phonology', 'french-6e-reading']);
  expect(Object.keys(HEART_DECOR_5E).sort()).toEqual(BIOMES.filter((b) => b.classe === '5e').map((b) => b.id).sort());
  expect(drawnHeartDecor('4e', worldOf('5e'))).toEqual([]);
  expect(drawnHeartDecor('5e', [])).toEqual([]);
});

it('au 5e, un cœur se dessine en entier ou reste en cubes : chaque cube du décor de l’île est dans un ensemble, sauf ses rochers de pierre', () => {
  const stone = BLOCKS[BLOC.pierre].side;
  for (const [id, l] of Object.entries(HEART_DECOR_5E) as [BiomeId, readonly HeartDecor[]][]) {
    const covered = new Set(l.flatMap((e) => e.columns.map(([x, y]) => `${x},${y}`)));
    const loose: string[] = [];
    DECOR[id](
      (x, y, _z, color, decor) => {
        if (!decor && color !== stone && !covered.has(`${x},${y}`)) loose.push(`${x},${y}`);
      },
      () => 0,
    );
    expect(loose, id).toEqual([]);
  }
});

/** La luminance relative d'une couleur linéaire (r, g, b). */
const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminanceOf = (c: number) => luminance(lin(((c >> 16) & 255) / 255), lin(((c >> 8) & 255) / 255), lin((c & 255) / 255));

/**
 * Les cœurs du 5e qui ne tiennent pas 3:1 à l'image (retouche du 11 octobre 2026, question laissée au directeur
 * artistique et au référent dys) : le thermomètre du Glacier, jugé conforme par le directeur artistique, garde son flanc
 * compté en couleurs ; les autres sont sur l'herbe sous la brume du 5e, rendue à 0,10 : même noir, un flanc n'y fait que
 * 2,9:1 à l'écran, et seule une teinte claire (0,57 de luminance au moins sur un dessus) le tiendrait.
 */
const BELOW_ON_GRASS = new Set([
  'coeur:maths-5e-signed-numbers:thermometre',
  'coeur:maths-5e-proportionality:caisse',
  'coeur:geography-5e-resources:riziere',
  'coeur:life-earth-sciences-5e-active-planet:strates',
  'coeur:physics-chemistry-5e-matter-universe:sel',
  'coeur:technology-5e-design:planches',
]);

it('au 5e, tout cœur à retrouver se détache de son sol à l’image : au moins un vingtième de sa surface vue d’en haut à 3:1 de la luminance du sol, chacun sous la lumière du jour qu’il reçoit (`SCENE_LIGHT`), sans lueur', () => {
  const all = wholeWorld('5e');
  const sols = new Map(all.filter((c) => c.sol).map((c) => [`${c.x},${c.y},${c.z}`, c]));
  for (const d of drawnHeartDecor('5e', worldOf('5e')).filter((o) => !BELOW_ON_GRASS.has(o.id))) {
    // Le sol sous la plus basse de ses cases.
    const low = d.cellules.reduce((m, c) => (c.z < m.z ? c : m));
    const ground = sols.get(`${low.x},${low.y},${low.z - 1}`);
    expect(ground?.texture, d.id).toBeDefined();
    const g = SCENE_LIGHT.ground * luminanceOf(couleurDeMatiere('5e', ground!.texture as Parameters<typeof couleurDeMatiere>[1]).dessus);
    const { positions: p, colors: k } = d.opaque;
    let total = 0;
    let apart = 0;
    for (let t = 0; t < p.length / 9; t++) {
      const [q0, q1, q2] = [0, 1, 2].map((s) => [p[t * 9 + s * 3], p[t * 9 + s * 3 + 1], p[t * 9 + s * 3 + 2]]);
      const u = [q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]];
      const v = [q2[0] - q0[0], q2[1] - q0[1], q2[2] - q0[2]];
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const area = Math.hypot(...n) / 2;
      // Un dessous (le dessous d'un auvent) ne se voit jamais d'une caméra au-dessus du monde : il ne compte pas. Un dessus
      // (la normale vers le haut, y dans le repère de Three) reçoit plus de lumière qu'un côté.
      const ny = n[1] / (2 * area);
      if (ny < -0.6) continue;
      const up = ny > 0.6;
      const l = (up ? SCENE_LIGHT.top : SCENE_LIGHT.side) * luminance(k[t * 9], k[t * 9 + 1], k[t * 9 + 2]);
      total += area;
      if ((Math.max(l, g) + 0.05) / (Math.min(l, g) + 0.05) >= 3) apart += area;
    }
    expect(apart / total, `${d.id} sur ${ground!.texture}`).toBeGreaterThanOrEqual(0.05);
  }
});

it('au 5e, l’étal du Comptoir, sur son emprise en T : ses poteaux, son comptoir et sa caisse restent sur ses quatre cases (seul l’auvent passe au-dessus des deux autres)', () => {
  const id: BiomeId = 'english-5e-vocabulary';
  const entry = HEART_DECOR_5E[id]!.find((e) => e.name === 'etal')!;
  const cells = columnsInWorld(id, entry.columns);
  const d = drawnHeartDecor('5e', worldOf('5e')).find((o) => o.id === `coeur:${id}:etal`)!;
  const base = Math.min(...d.cellules.map((c) => c.z));
  const p = d.opaque.positions;
  const inside = (x: number, z: number) => cells.has(`${Math.floor(x)},${Math.floor(z)}`);
  let low = 0;
  for (let i = 0; i < p.length; i += 3) {
    if (p[i + 1] > base + 1.9) continue;
    low++;
    const e = 1e-6;
    // Un sommet sur le bord d'une case : dans l'emprise si une des cases qui le touchent y est.
    const ok = [-e, e].some((dx) => [-e, e].some((dz) => inside(p[i] + dx, p[i + 2] + dz)));
    expect(ok, `${p[i]}, ${p[i + 2]}`).toBe(true);
  }
  expect(low).toBeGreaterThan(0);
});

it('il manque un cube d’un ensemble (un lieu ou le Gardien l’a pris) : l’ensemble reste en cubes', () => {
  const cubes = sixthWorld();
  const clockTower = drawnHeartDecor('6e', cubes).find((d) => d.id === 'coeur:english-6e-grammar:horloge')!;
  const oneCell = [...clockTower.replaced][0];
  const skip = cubes.filter((c) => `${c.x},${c.y},${c.z}` !== oneCell);
  const ids = drawnHeartDecor('6e', skip).map((d) => d.id);
  expect(ids).not.toContain('coeur:english-6e-grammar:horloge');
  expect(ids).toContain('coeur:english-6e-grammar:rouage');
});

it('sur une île tournée (GD-9), le décor de son cœur est dessiné à sa place, tourné avec elle', () => {
  const FARM: BiomeId = 'french-6e-grammar-spelling';
  const game = toutConstruitAvecLesCommandes();
  const spot = freeSpots(game.world, FARM, 1)[0];
  const r = moveIsland(game.world, FARM, spot);
  if (!r.ok) throw new Error(r.reason);
  applyLayout(r.world.layout);
  const cubes = worldCubes('6e', game.progress, r.world, false).filter((c) => !c.sol);
  const drawn = drawnHeartDecor('6e', cubes).filter((d) => d.id.startsWith(`coeur:${FARM}:`));
  // Le champ et un poteau au moins (l'autre poteau, sur l'île tournée, peut tomber sous une autre case prise : il reste
  // alors en cubes, comme tout ensemble incomplet).
  expect(drawn.map((d) => d.id)).toContain(`coeur:${FARM}:champ`);
  expect(drawn.length).toBeGreaterThanOrEqual(2);
  for (const d of drawn) {
    const e = (HEART_DECOR_6E[FARM] ?? []).find((x) => d.id.endsWith(`:${x.name}`))!;
    const cols = columnsInWorld(FARM, e.columns);
    for (const k of d.replaced) expect(cols.has(k.split(',').slice(0, 2).join(','))).toBe(true);
  }
  const wheatField = drawn.find((d) => d.id.endsWith(':champ'))!;
  const columns = columnsInWorld(FARM, (HEART_DECOR_6E[FARM] ?? [])[0].columns);
  const p = wheatField.opaque.positions;
  for (let i = 0; i < p.length; i += 3) expect(columns.has(`${Math.floor(p[i])},${Math.floor(p[i + 2])}`)).toBe(true);
});

it('les cubes du cœur restent ceux du monde : Blocland et la vue simple les voient comme avant', () => {
  for (const a of ['6e', '5e'] as const) {
    const cubes = worldOf(a);
    const before = cubes.length;
    drawnHeartDecor(a, cubes);
    expect(cubes.length).toBe(before);
  }
});
