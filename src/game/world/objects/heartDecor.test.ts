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
import { BRUME, couleurDeMatiere } from '../palette';
import { HEART_DECOR_6E, type HeartDecor, SCENE_LIGHT } from './heartDecor';
import { HEART_DECOR_5E, SACK, SALT_CREAM } from './heartDecor5e';
import { HEART_DECOR_4E } from './heartDecor4e';
import { HEART_DECOR_3E } from './heartDecor3e';
import { apartFromGhost, HEART, rgbGap } from '../architecture/heartPieces';
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
  ['4e', HEART_DECOR_4E],
  ['3e', HEART_DECOR_3E],
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

/**
 * Les îles du 4e et du 3e sans décor du cœur à dessiner (étape 3, 12 octobre 2026) : le Verger, dont l'arbre fruitier est
 * dans les formes communes du décor (un élément nommé, déjà en primitives).
 */
const EN_CUBES_43 = {
  '4e': [],
  '3e': ['life-earth-sciences-3e-human-body'],
} as const;

it('les îles qui ont un décor du cœur fait de main d’homme : toutes au 6e (la Forêt n’a que des arbres, la Tour sa pierre), toutes au 5e, au 4e et au 3e toutes sauf le Verger et son arbre fruitier', () => {
  expect(Object.keys(HEART_DECOR_6E)).toHaveLength(14);
  expect(BIOMES.filter((b) => b.classe === '6e' && !HEART_DECOR_6E[b.id]).map((b) => b.id).sort()).toEqual(['french-6e-phonology', 'french-6e-reading']);
  expect(Object.keys(HEART_DECOR_5E).sort()).toEqual(BIOMES.filter((b) => b.classe === '5e').map((b) => b.id).sort());
  for (const [a, table] of [
    ['4e', HEART_DECOR_4E],
    ['3e', HEART_DECOR_3E],
  ] as const)
    expect(BIOMES.filter((b) => b.classe === a && !table[b.id]).map((b) => b.id).sort(), a).toEqual([...EN_CUBES_43[a]].sort());
  expect(Object.keys(HEART_DECOR_4E)).toHaveLength(14);
  expect(Object.keys(HEART_DECOR_3E)).toHaveLength(13);
  expect(drawnHeartDecor('4e', worldOf('5e'))).toEqual([]);
  expect(drawnHeartDecor('5e', [])).toEqual([]);
});

/** Les colonnes qu'un cœur dessiné laisse à ses cubes : la tour du grand phare du Phare, un repère (world/decor). */
const KEPT_COLUMNS: Partial<Record<BiomeId, readonly string[]>> = { 'maths-3e-functions': ['9,3'] };

it.each([
  ['5e', HEART_DECOR_5E],
  ['4e', HEART_DECOR_4E],
  ['3e', HEART_DECOR_3E],
] as const)('au %s, un cœur se dessine en entier ou reste en cubes : chaque cube du décor de l’île est dans un ensemble, sauf ses rochers de pierre', (_a, table) => {
  const stone = BLOCKS[BLOC.pierre].side;
  for (const [id, l] of Object.entries(table) as [BiomeId, readonly HeartDecor[]][]) {
    const covered = new Set([...l.flatMap((e) => e.columns.map(([x, y]) => `${x},${y}`)), ...(KEPT_COLUMNS[id] ?? [])]);
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
 * Les cœurs du 5e qui ne tiennent pas 3:1 à l'image (retouches du 11 octobre 2026, directeur artistique) : le
 * thermomètre du Glacier, jugé conforme, garde son flanc compté en couleurs ; les autres gardent le côté naturel de leur
 * matière et se lisent par leur silhouette, car aucun flanc n'y tient 3:1 sans passer sous 0,05 de luminance : sur
 * l'herbe sous la brume du 5e (rendue à 0,10, seule une teinte claire, 0,57 au moins sur un dessus, le tiendrait), et sur
 * la tuile du Comptoir (rendue à 0,14 : l'étal et la pile de tuiles).
 */
const BELOW_ON_GRASS = new Set([
  'coeur:maths-5e-signed-numbers:thermometre',
  'coeur:maths-5e-proportionality:caisse',
  'coeur:geography-5e-resources:riziere',
  'coeur:life-earth-sciences-5e-active-planet:strates',
  'coeur:technology-5e-design:planches',
  'coeur:english-5e-vocabulary:etal',
  'coeur:english-5e-vocabulary:tuiles',
]);

/**
 * Les cœurs du 4e et du 3e qui ne tiennent pas 3:1 à l'image, acceptés en silhouette (intention du directeur artistique
 * du 12 octobre 2026, §4 : « tout ensemble qui reste sous 3:1 », à lui remonter, pas à forcer par une lueur) : sur
 * l'herbe sous le voile (rendue à 0,11 au 4e, 0,16 au 3e, seule une teinte claire, 0,6 au moins sur un dessus, la
 * tiendrait), sur le pavé de la Porte et l'acajou du Forum (aucun flanc au-dessus de 0,05 de luminance, aucun dessus de
 * leur famille assez clair) ; et la Falaise, dont l'ardoise fendue claire #AEB5BE du directeur artistique (3,2:1 en
 * couleurs) donne 2,97:1 sous la lumière de `SCENE_LIGHT` : à juger sur capture. À l'étape 3 : la longue-vue de la Vigie
 * et la ruche (sur l'herbe), le laurier du Bosquet (sur son sol de laurier) ; la voie, le bout de rail et le signal de
 * la Gare, dont le dessus des rails en acier poli #B4BAC0 du directeur artistique donne 2,93:1 sous la même lumière sur
 * le sol de rails (aucun flanc n'y tient 3:1 au-dessus de 0,05) : à juger sur capture.
 */
const BELOW_4E = new Set([
  'coeur:french-4e-agreement:paroi',
  'coeur:french-4e-agreement:ardoise',
  'coeur:history-4e-revolutions:presse',
  'coeur:history-4e-revolutions:caisse',
  'coeur:geography-4e-globalization:conteneurs',
  'coeur:geography-4e-globalization:caisse',
  'coeur:life-earth-sciences-4e-cells-evolution:vasque',
  'coeur:technology-4e-modeling:maquette',
  'coeur:civics-4e-rights-freedoms:paves',
  'coeur:lv2-4e-daily-life:potager',
  'coeur:lv2-4e-daily-life:lanterne',
  'coeur:lv2-4e-daily-life:panier',
  'coeur:english-4e-grammar:voie',
  'coeur:english-4e-grammar:signal',
  'coeur:english-4e-grammar:rail',
  'coeur:physics-chemistry-4e-signals-circuits:longue-vue',
]);
const BELOW_3E = new Set([
  'coeur:history-3e-twentieth-century:reliures',
  'coeur:history-3e-twentieth-century:banc',
  'coeur:geography-3e-france:borne',
  'coeur:geography-3e-france:gres',
  'coeur:physics-chemistry-3e-motion-energy:plan',
  'coeur:civics-3e-democratic-life:banc',
  'coeur:lv2-3e-travel:buches',
  'coeur:lv2-3e-travel:banc',
  'coeur:technology-3e-digital:ruche',
  'coeur:lca-3e-ideas:laurier',
]);

/** Les couleurs (en sRGB, arrondies) des facettes d'un cœur dessiné du 5e. */
const coloursOf = (id: string) => {
  const d = drawnHeartDecor('5e', worldOf('5e')).find((o) => o.id === id)!;
  const k = d.opaque.colors;
  const srgb = (v: number) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
  const out = new Set<number>();
  for (let i = 0; i < k.length; i += 3) out.add((srgb(k[i]) << 16) | (srgb(k[i + 1]) << 8) | srgb(k[i + 2]));
  return out;
};

it('au 5e, le tas de sel de la Saline est tout en sel crème, dessus et flancs, loin du fantôme Brume sans tirer vers le gris', () => {
  expect([...coloursOf('coeur:physics-chemistry-5e-matter-universe:sel')]).toEqual([SALT_CREAM]);
  expect(rgbGap(SALT_CREAM, BRUME)).toBeGreaterThanOrEqual(HEART.chalk.ghostGap + 1);
  expect(apartFromGhost(SALT_CREAM)).toBe(SALT_CREAM);
});

it('au 5e, les sacs du Fournil sont en toile de jute, la farine au seul col ouvert, la ficelle sombre', () => {
  const c = coloursOf('coeur:civics-5e-equality-solidarity:farine');
  for (const k of [SACK.jute, SACK.string, couleurDeMatiere('5e', 'farine').dessus]) expect(c.has(k), k.toString(16)).toBe(true);
});

/**
 * La part de la surface vue d'un cœur dessiné qui tient 3:1 sur la luminance du dessus de son sol à l'image, chacun sous
 * la lumière du jour qu'il reçoit (`SCENE_LIGHT`), et la matière de ce sol.
 */
function shareApart(a: ArchipelagoId, d: ReturnType<typeof drawnHeartDecor>[number]): { share: number; ground: string | undefined } {
  const sols = new Map(wholeWorld(a).filter((c) => c.sol).map((c) => [`${c.x},${c.y},${c.z}`, c]));
  // Le sol sous la plus basse de ses cases (la première qui en a un : une case du bord peut être en surplomb, la ruche).
  const zLow = Math.min(...d.cellules.map((c) => c.z));
  const ground = d.cellules
    .filter((c) => c.z === zLow)
    .map((c) => sols.get(`${c.x},${c.y},${c.z - 1}`)?.texture)
    .find((t) => t !== undefined);
  if (!ground) return { share: 0, ground };
  const g = SCENE_LIGHT.ground * luminanceOf(couleurDeMatiere(a, ground as Parameters<typeof couleurDeMatiere>[1]).dessus);
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
  return { share: apart / total, ground };
}

it.each([
  ['5e', BELOW_ON_GRASS],
  ['4e', BELOW_4E],
  ['3e', BELOW_3E],
] as const)('au %s, tout cœur à retrouver se détache de son sol à l’image : au moins un vingtième de sa surface vue d’en haut à 3:1 de la luminance du sol, chacun sous la lumière du jour qu’il reçoit (`SCENE_LIGHT`), sans lueur', (a, below) => {
  for (const d of drawnHeartDecor(a, worldOf(a))) {
    const { share, ground } = shareApart(a, d);
    expect(ground, d.id).toBeDefined();
    if (below.has(d.id)) {
      // Une exception nommée reste vraie (au 4e et au 3e) : un cœur qui passe 3:1 sort de la liste.
      if (a !== '5e') expect(share, `${d.id} sur ${ground}`).toBeLessThan(0.05);
    } else expect(share, `${d.id} sur ${ground}`).toBeGreaterThanOrEqual(0.05);
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
