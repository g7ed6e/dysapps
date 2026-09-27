import type { VoxelCube } from '../Voxel';
import { BIOMES } from '../biomes';
import { toutConstruit } from './budget';
import { appelsDuSol, champDuSol, colonneEn, hauteurDuSol, landMesh, pickCell, piedsSur, RIVAGE, trianglesDuSol, type ChampDuSol, type Facettes } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import { walkGround } from './paths';
import { cubeTags, groundTap } from './scene';
import { avatarRoute, creaturePlacements, guardianPlacements, worldCubes } from './terrain';

/** Une colonne de sol de `bas` à `haut`, en herbe. */
const colonne = (x: number, y: number, haut: number, bas = -2): VoxelCube[] =>
  Array.from({ length: haut - bas + 1 }, (_, i) => ({ x, y, z: bas + i, color: '#6cb33f', texture: i === haut - bas ? 'herbe' : 'terre', sol: true }));

/** Un terrain d'essai : `rows[y][x]` donne le z du cube du dessus (`.` : l'eau). */
function terrainDe(rows: string[]): VoxelCube[] {
  const out: VoxelCube[] = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && out.push(...colonne(x, y, Number(ch)))));
  return out;
}

/** Tous les triangles d'un maillage : sommets, normale, colonne. */
function* triangles(f: Facettes) {
  for (let t = 0; t < f.colonnes.length; t++) {
    const p = (k: number) => ({ x: f.positions[t * 9 + k * 3], y: f.positions[t * 9 + k * 3 + 1], z: f.positions[t * 9 + k * 3 + 2] });
    const n = { x: f.normals[t * 9], y: f.normals[t * 9 + 1], z: f.normals[t * 9 + 2] };
    yield { a: p(0), b: p(1), c: p(2), n, colonne: f.colonnes[t] };
  }
}

const centre = (a: { x: number; y: number; z: number }, b: typeof a, c: typeof a) => ({ x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, z: (a.z + b.z + c.z) / 3 });

describe('le champ du sol', () => {
  it('garde plat ce qui est plat, au niveau du dessus des cubes', () => {
    const champ = champDuSol('6e', terrainDe(['2222', '2222', '2222', '2222']));
    const c = colonneEn(champ, 1, 1)!;
    expect(c.coins).toEqual([3, 3, 3, 3]);
    expect(hauteurDuSol(champ, 1.3, 1.8)).toBe(3);
    // Deux triangles par case plate au milieu.
    const m = landMesh(champ);
    expect([...m.sol.colonnes].filter((i) => champ.colonnes[i] === c)).toHaveLength(2);
  });

  it("change une marche d'un bloc en pente continue, sans marche ni trou", () => {
    const champ = champDuSol('5e', terrainDe(['1112222', '1112222', '1112222', '1112222', '1112222']));
    let before = hauteurDuSol(champ, 0.5, 2.5)!;
    for (let x = 0.5; x < 6.5; x += 0.01) {
      const h = hauteurDuSol(champ, x, 2.5)!;
      expect(Math.abs(h - before)).toBeLessThan(0.05);
      before = h;
    }
    // Loin de la marche, les deux paliers sont à leur hauteur.
    expect(hauteurDuSol(champ, 1.5, 2.5)).toBe(2);
    expect(hauteurDuSol(champ, 5.5, 2.5)).toBe(3);
  });

  it('garde une falaise quand la marche est de deux blocs ou plus, avec sa paroi', () => {
    const champ = champDuSol('5e', terrainDe(['1115555', '1115555', '1115555', '1115555']));
    const haut = colonneEn(champ, 3, 1)!;
    const bas = colonneEn(champ, 2, 1)!;
    expect(Math.min(...haut.coins)).toBeGreaterThanOrEqual(5);
    expect(Math.max(...bas.coins)).toBeLessThanOrEqual(2);
    // La paroi regarde vers la case basse (−x) et monte jusqu'au dessus de la falaise.
    const m = landMesh(champ);
    const parois = [...triangles(m.sol)].filter((t) => champ.colonnes[t.colonne] === haut && t.n.x < -0.99);
    expect(parois.length).toBeGreaterThan(0);
    expect(Math.max(...parois.flatMap((t) => [t.a.y, t.b.y, t.c.y]))).toBeCloseTo(Math.max(haut.coins[0], haut.coins[3]));
  });

  it('fige une case où quelque chose est posé : elle reste plate à sa hauteur', () => {
    const sol = terrainDe(['1112', '1112', '1112']);
    const borne: VoxelCube = { x: 2, y: 1, z: 2, color: '#3a4a6a', texture: 'borne', quest: 'foret:x' };
    const libre = colonneEn(champDuSol('6e', sol), 2, 1)!;
    const fige = colonneEn(champDuSol('6e', sol, [borne]), 2, 1)!;
    expect(libre.fixe).toBe(false);
    expect(Math.max(...libre.coins)).toBeGreaterThan(2);
    expect(fige.fixe).toBe(true);
    expect(fige.coins).toEqual([2, 2, 2, 2]);
    expect(hauteurDuSol(champDuSol('6e', sol, [borne]), 2.9, 1.1)).toBe(2);
  });

  it("descend la côte jusqu'à l'eau au niveau de la mer, et d'un bloc en altitude", () => {
    const mer = champDuSol('6e', terrainDe(['000', '000', '000']));
    expect(colonneEn(mer, 0, 0)!.coins[0]).toBe(RIVAGE);
    expect(colonneEn(mer, 1, 1)!.coins).toEqual([1, 1, 1, 1]);
    // Une côte d'un bloc plus haut descend aussi jusqu'à l'eau ; plus haute encore, elle s'arrondit d'un bloc.
    expect(colonneEn(champDuSol('6e', terrainDe(['111', '111'])), 0, 0)!.coins[0]).toBe(RIVAGE);
    expect(colonneEn(champDuSol('6e', terrainDe(['444', '444'])), 0, 0)!.coins[0]).toBe(4);
    const haut = champDuSol('3e', terrainDe(['999', '999', '999']));
    expect(colonneEn(haut, 0, 0)!.coins[0]).toBe(9);
  });
});

/** Les champs et maillages réels, archipel par archipel, tout construit. */
const reels = new Map<ArchipelagoId, { cubes: VoxelCube[]; champ: ChampDuSol; mesh: ReturnType<typeof landMesh> }>();
function reel(a: ArchipelagoId) {
  let r = reels.get(a);
  if (!r) {
    const { progress, village } = toutConstruit();
    const cubes = worldCubes(a, progress, village, false);
    const champ = champDuSol(
      a,
      cubes.filter((c) => c.sol),
      cubes.filter((c) => !c.sol),
    );
    r = { cubes, champ, mesh: landMesh(champ) };
    reels.set(a, r);
  }
  return r;
}

describe('le maillage des archipels', () => {
  it.each(ARCHIPELAGO_IDS)('%s : des facettes saines (normales unitaires, dessus vers le ciel, aucun nombre perdu)', (a) => {
    const { mesh } = reel(a);
    for (const f of [mesh.sol, mesh.lumineux]) {
      expect(f.positions.length).toBe(f.colonnes.length * 9);
      expect(f.colors.length).toBe(f.positions.length);
      expect([...f.positions, ...f.normals, ...f.colors].every(Number.isFinite)).toBe(true);
      expect(f.colors.every((v) => v >= 0 && v <= 1)).toBe(true);
      expect([...triangles(f)].every((t) => Math.abs(Math.hypot(t.n.x, t.n.y, t.n.z) - 1) < 1e-5)).toBe(true);
      // Une facette est un dessus (elle monte), un dessous (elle descend) ou une falaise verticale : le toucher s'y fie.
      expect([...triangles(f)].every((t) => Math.abs(t.n.y) > 0.01 || Math.abs(t.n.y) < 1e-6)).toBe(true);
    }
    expect(appelsDuSol(mesh)).toBeLessThanOrEqual(2);
  }, 30_000);

  it('seuls le sol et la roche passent au maillage : la construction, le décor et les étiquettes restent en cubes', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes } = reel(a);
      for (const c of cubes.filter((c) => c.sol)) {
        expect(c.quest, a).toBeUndefined();
        expect(c.bridge, a).toBeUndefined();
        expect(c.ghost, a).toBeFalsy();
        expect(c.decor, a).toBeUndefined();
      }
      expect(cubes.some((c) => c.sol)).toBe(true);
      expect(cubes.some((c) => c.quest && !c.sol)).toBe(true);
    }
  }, 60_000);

  it('une case où quelque chose est posé (borne, maison, plan, décor, pont, monument) reste plate à la hauteur de ses cubes', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, champ } = reel(a);
      for (const c of cubes) {
        if (c.sol) continue;
        const col = colonneEn(champ, c.x, c.y);
        if (!col || c.z !== col.haut + 1) continue;
        expect(col.fixe).toBe(true);
        expect(col.coins.every((h) => h === col.haut + 1)).toBe(true);
      }
    }
  }, 60_000);
});

describe('le toucher sur le terrain (pickCell)', () => {
  it.each(ARCHIPELAGO_IDS)('%s : chaque facette touchée redonne sa case, et la case devant la face', (a) => {
    const { champ, mesh } = reel(a);
    const erreurs: string[] = [];
    let n = 0;
    for (const f of [mesh.sol, mesh.lumineux])
      for (const t of triangles(f)) {
        const col = champ.colonnes[t.colonne];
        // Le milieu de la facette, et un point près de chaque sommet (au bord de la case, là où l'erreur guette).
        const g = centre(t.a, t.b, t.c);
        const near = [t.a, t.b, t.c].map((p) => ({ x: p.x + (g.x - p.x) * 0.05, y: p.y + (g.y - p.y) * 0.05, z: p.z + (g.z - p.z) * 0.05 }));
        for (const p of [g, ...near]) {
          n++;
          const hit = pickCell(champ, p, t.n);
          const ou = `${col.x},${col.y} (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}) n=${t.n.x.toFixed(2)},${t.n.y.toFixed(2)},${t.n.z.toFixed(2)}`;
          if (!hit) {
            erreurs.push(`rien : ${ou}`);
            continue;
          }
          if (hit.cell.x !== col.x || hit.cell.y !== col.y || hit.cell.z < col.bas || hit.cell.z > col.haut) erreurs.push(`case ${JSON.stringify(hit.cell)} : ${ou}`);
          else if (t.n.y > 0.01) {
            if (hit.next.x !== col.x || hit.next.y !== col.y || hit.next.z !== col.haut + 1) erreurs.push(`au-dessus ${JSON.stringify(hit.next)} : ${ou}`);
          } else if (t.n.y < -0.01) {
            if (hit.next.z !== col.bas - 1) erreurs.push(`dessous ${JSON.stringify(hit.next)} : ${ou}`);
          } else {
            // La case devant une falaise est la voisine, du côté où regarde la face, à la même hauteur.
            const dx = hit.next.x - col.x;
            const dy = hit.next.y - col.y;
            if (Math.abs(dx) + Math.abs(dy) !== 1 || dx * t.n.x + dy * t.n.z < 0.7 || hit.next.z !== hit.cell.z) erreurs.push(`devant ${JSON.stringify(hit.next)} : ${ou}`);
          }
        }
      }
    expect(erreurs.slice(0, 5)).toEqual([]);
    expect(n).toBeGreaterThan(40_000);
  }, 60_000);

  it("un toucher sur le dessus du sol ouvre l'île, ou le monument sur l'îlot d'un monument", () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, champ } = reel(a);
      const tags = cubeTags(cubes);
      const can = { quest: true, bridge: true, build: false, place: true };
      let monuments = 0;
      const tops = new Map(cubes.filter((c) => c.sol).map((c) => [`${c.x},${c.y},${c.z}`, c]));
      for (const col of champ.colonnes) {
        const p = { x: col.x + 0.5, y: hauteurDuSol(champ, col.x + 0.5, col.y + 0.5)!, z: col.y + 0.5 };
        const hit = pickCell(champ, p, { x: 0, y: 1, z: 0 })!;
        const tap = groundTap(a, { ...hit, ground: { x: p.x, y: p.z } }, tags, can);
        const top = tops.get(`${col.x},${col.y},${col.haut}`)!;
        if (top.place) {
          monuments++;
          expect(tap).toMatchObject({ kind: 'place', place: top.place });
        } else expect(tap.kind).toBe('island');
      }
      expect(monuments, a).toBeGreaterThan(0);
    }
  }, 60_000);
});

describe('la marche sur le terrain', () => {
  it('piedsSur : posé sur le sol, au-dessus du sol sur un pont, et de la hauteur de son itinéraire sur l’eau', () => {
    const champ = champDuSol('6e', terrainDe(['0001', '0001', '0001']));
    expect(piedsSur(champ, 1.5, 1.5, 1)).toBe(hauteurDuSol(champ, 1.5, 1.5));
    // Un pont d'un bloc au-dessus du sol : on reste sur le pont.
    expect(piedsSur(champ, 1.5, 1.5, 2.2)).toBeCloseTo(2.2);
    // Plus bas que le sol (un itinéraire qui coupe une pente) : jamais dans le sol.
    expect(piedsSur(champ, 3.2, 1.5, 0.5)).toBe(hauteurDuSol(champ, 3.2, 1.5));
    expect(piedsSur(champ, 9, 9, 0.3)).toBe(0.3);
    expect(piedsSur(null, 1, 1, 4)).toBe(4);
  });

  it.each(ARCHIPELAGO_IDS)('%s : le bonhomme marche posé sur la surface, sans traverser les pentes ni sauter', (a) => {
    const { progress, village } = toutConstruit();
    const { cubes, champ } = reel(a);
    const creatures = [...creaturePlacements(a, village.bridges), ...guardianPlacements(a, progress, village.bridges)];
    const ground = walkGround(cubes, creatures);
    const islands = BIOMES.filter((b) => b.classe === a).map((b) => b.id);
    let checked = 0;
    for (const to of islands.slice(1)) {
      const route = avatarRoute(islands[0], to, village.bridges, ground);
      if (!route) continue;
      let before: number | null = null;
      for (let i = 0; i + 1 < route.length; i++) {
        const p = route[i];
        const q = route[i + 1];
        const len = Math.hypot(q.x - p.x, q.y - p.y);
        const steps = Math.max(1, Math.ceil(len / 0.05));
        for (let s = 0; s < steps; s++) {
          const k = s / steps;
          const x = p.x + (q.x - p.x) * k + 0.5;
          const y = p.y + (q.y - p.y) * k + 0.5;
          const z = p.z + (q.z - p.z) * k;
          const feet = piedsSur(champ, x, y, z);
          const s0 = hauteurDuSol(champ, x, y);
          if (s0 !== null) expect(feet, `${a} ${to} (${x}, ${y})`).toBeGreaterThanOrEqual(s0 - 1e-6);
          // Pas de saut : au plus une marche de pont (un bloc) entre deux pas très courts.
          if (before !== null) expect(Math.abs(feet - before), `${a} ${to} (${x}, ${y})`).toBeLessThanOrEqual(1.01);
          before = feet;
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  }, 30_000);
});

describe('le budget du terrain', () => {
  it.each(ARCHIPELAGO_IDS)('%s : le sol et la roche tiennent en deux appels de dessin au plus', (a) => {
    const { mesh } = reel(a);
    expect(appelsDuSol(mesh)).toBeLessThanOrEqual(2);
    expect(trianglesDuSol(mesh)).toBeGreaterThan(1000);
  }, 30_000);
});
