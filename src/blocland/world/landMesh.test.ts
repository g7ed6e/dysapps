import type { VoxelCube } from './cube';
import { BIOMES } from '../biomes';
import { toutConstruit } from './budget';
import {
  appelsDuSol,
  champDuSol,
  colonneEn,
  CONTRASTE,
  ecartDeCouleur,
  eclairement,
  EBOULIS,
  epaisseurDesStrates,
  FONDU,
  FRANGE,
  hauteurDuSol,
  landMesh,
  NUANCE_SOL,
  nuanceDuSol,
  PENTE_OMBRE,
  pickCell,
  piedsSur,
  poseDuDecor,
  normaleOmbree,
  RIVAGE,
  SOCLE_MAX,
  strate,
  STRATES,
  STRATES_HAUTES,
  trianglesDuSol,
  type ChampDuSol,
  type Facettes,
} from './landMesh';
import { couleurDeMatiere } from './palette';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import { walkGround } from './paths';
import { cubeTags, groundTap } from './scene';
import { avatarRoute, casesDesLieux, creaturePlacements, guardianPlacements, worldCubes } from './terrain';

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
    // La vraie normale, tirée des positions (comme le toucher de la vue 3D) ; `lumiere` : la normale d'éclairage.
    const [a, b, c] = [p(0), p(1), p(2)];
    const u = [b.x - a.x, b.y - a.y, b.z - a.z];
    const v = [c.x - a.x, c.y - a.y, c.z - a.z];
    const g = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(g[0], g[1], g[2]);
    const n = { x: g[0] / l, y: g[1] / l, z: g[2] / l };
    const lumiere = { x: f.normals[t * 9], y: f.normals[t * 9 + 1], z: f.normals[t * 9 + 2] };
    yield { a, b, c, n, lumiere, colonne: f.colonnes[t] };
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

  it("descend une case où seul un décor est posé au bas de sa pente, avec son décor, s'il dépasse d'un quart de bloc", () => {
    const sol = terrainDe(['00000', '00000', '00100', '00000', '00000']);
    const buisson: VoxelCube = { x: 2, y: 2, z: 2, color: '#4e8f36', decor: 'foret/buisson@2,2' };
    const champ = champDuSol('5e', sol, [buisson]);
    const col = colonneEn(champ, 2, 2)!;
    // Sur la pente, les coins seraient à 1,25 : le socle plat dépasserait de 0,75 bloc. La case descend à 1,25.
    expect(col.abaissement).toBeCloseTo(0.75);
    expect(col.coins).toEqual([1.25, 1.25, 1.25, 1.25]);
    const [pose] = poseDuDecor(champ, [buisson]);
    expect(pose.z).toBeCloseTo(1.25);
    expect(buisson.z).toBe(2);
    // Avec autre chose qu'un décor (une borne), la case reste à sa hauteur.
    const borne: VoxelCube = { x: 2, y: 2, z: 2, color: '#3a4a6a', texture: 'borne', quest: 'foret:x' };
    expect(colonneEn(champDuSol('5e', sol, [buisson, borne]), 2, 2)!.coins).toEqual([2, 2, 2, 2]);
    // Sur du plat, rien ne bouge.
    const plat = champDuSol('5e', terrainDe(['000', '000', '000']), [{ ...buisson, x: 1, y: 1, z: 1 }]);
    expect(colonneEn(plat, 1, 1)!.abaissement).toBe(0);
    expect(SOCLE_MAX).toBe(0.25);
  });

  it("fige le bord d'une colonne contre laquelle s'appuie ce qui est au-dessus de l'eau (un pont, une cascade)", () => {
    const sol = terrainDe(['000', '000', '000']);
    const pont: VoxelCube = { x: 3, y: 1, z: 0, color: '#b0875a', bridge: 'b' };
    expect(colonneEn(champDuSol('6e', sol), 2, 1)!.coins[1]).toBe(RIVAGE);
    const champ = champDuSol('6e', sol, [pont]);
    expect(colonneEn(champ, 2, 1)!.coins).toEqual([1, 1, 1, 1]);
  });

  it('peint la côte en sable pur sur la frange côté mer, et le fond vers le dessus sur 0,3 case au plus', () => {
    // La mer à gauche seulement (les rangées du haut et du bas ne servent qu'à border) : la pente de la côte regarde le soleil.
    const champ = champDuSol('6e', terrainDe(['.00000', '.00000', '.00000', '.00000', '.00000']));
    const { sol } = landMesh(champ, { style: 'a' });
    const dir = (r: number, g: number, b: number) => {
      const l = Math.hypot(r, g, b);
      return [r / l, g / l, b / l];
    };
    const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const hex = (c: number) => dir(lin(((c >> 16) & 255) / 255), lin(((c >> 8) & 255) / 255), lin((c & 255) / 255));
    const sable = hex(couleurDeMatiere('6e', 'sable').dessus);
    const herbe = hex(couleurDeMatiere('6e', 'herbe').dessus);
    const proche = (u: number[], v: number[]) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]) < 4e-3;
    let pur = 0;
    let fondu = 0;
    for (let t = 0; t < sol.colonnes.length; t++) {
      const col = champ.colonnes[sol.colonnes[t]];
      if (col.x !== 1 || col.y !== 2 || sol.normals[t * 9 + 1] < 0.01) continue;
      const etendue = Math.max(...col.coins) - RIVAGE;
      for (let k = 0; k < 3; k++) {
        const o = t * 9 + k * 3;
        const s = (sol.positions[o + 1] - RIVAGE) / etendue;
        const c = dir(sol.colors[o], sol.colors[o + 1], sol.colors[o + 2]);
        if (s <= FRANGE - 1e-4) {
          expect(proche(c, sable), `s = ${s}`).toBe(true);
          pur++;
        } else if (s >= FRANGE + FONDU + 1e-4) expect(proche(c, herbe), `s = ${s}`).toBe(true);
        else if (!proche(c, sable) && !proche(c, herbe)) fondu++;
      }
    }
    expect(pur).toBeGreaterThan(0);
    expect(fondu).toBe(0);
    // Une plage (une case de sable) reste du sable pur, jusqu'à son bord : pas de fondu d'une case entière.
    const { cubes, champ: reelChamp } = reel('6e');
    const tout = landMesh(reelChamp, { style: 'a' }).sol;
    const plages = new Set(cubes.filter((c) => c.sol && c.texture === 'sable').map((c) => `${c.x},${c.y},${c.z}`));
    let vus = 0;
    for (let t = 0; t < tout.colonnes.length; t++) {
      const col = reelChamp.colonnes[tout.colonnes[t]];
      if (!plages.has(`${col.x},${col.y},${col.haut}`) || tout.normals[t * 9 + 1] < 0.01 || col.muted) continue;
      for (let k = 0; k < 3; k++) {
        const o = t * 9 + k * 3;
        expect(proche(dir(tout.colors[o], tout.colors[o + 1], tout.colors[o + 2]), sable)).toBe(true);
        vus++;
      }
    }
    expect(vus).toBeGreaterThan(100);
    expect(FRANGE).toBe(0.55);
    expect(FONDU).toBeLessThanOrEqual(0.3);
  });

  it('entre deux dessus qui tranchent (une dalle claire contre la roche), le passage se fait au bord, sur 0,3 case de chaque côté', () => {
    // Lot R3 : une dalle d'acier contre du basalte, puis de l'herbe contre de la mousse, sur un plateau de 6 × 5.
    const bloc = (gauche: string, droite: string): VoxelCube[] =>
      Array.from({ length: 5 }, (_, y) => Array.from({ length: 6 }, (_, x) => colonne(x, y, 3).map((c, i, all) => (i === all.length - 1 ? { ...c, texture: x < 3 ? gauche : droite } : c)))).flat(2);
    const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    const rgbLin = (c: number) => [lin(((c >> 16) & 255) / 255), lin(((c >> 8) & 255) / 255), lin((c & 255) / 255)];
    const proche = (u: number[], v: number[]) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]) < 3e-3;
    /** Les sommets du dessus de la colonne (x, 2), leur x et leur couleur. */
    const sommets = (champ: ChampDuSol, x: number) => {
      const { sol } = landMesh(champ, { style: 'a' });
      const out: { x: number; c: number[] }[] = [];
      for (let t = 0; t < sol.colonnes.length; t++) {
        const col = champ.colonnes[sol.colonnes[t]];
        if (col.x !== x || col.y !== 2 || sol.normals[t * 9 + 1] < 0.5) continue;
        for (let k = 0; k < 3; k++) out.push({ x: sol.positions[t * 9 + k * 3], c: [0, 1, 2].map((j) => sol.colors[t * 9 + k * 3 + j]) });
      }
      return out;
    };
    const dalle = couleurDeMatiere('4e', 'acier').dessus;
    const roche = couleurDeMatiere('4e', 'basalte').dessus;
    expect(ecartDeCouleur(dalle, roche)).toBeGreaterThan(CONTRASTE);
    const champ = champDuSol('4e', bloc('acier', 'basalte'));
    const milieu = [0, 1, 2].map((j) => (rgbLin(dalle)[j] + rgbLin(roche)[j]) / 2);
    let bord = 0;
    for (const [x, pure] of [
      [2, dalle],
      [3, roche],
    ] as const)
      for (const s of sommets(champ, x)) {
        const aLaFrontiere = Math.abs(s.x - 3);
        if (aLaFrontiere >= FONDU - 1e-4) expect(proche(s.c, rgbLin(pure)), `x = ${s.x}`).toBe(true);
        else {
          expect(aLaFrontiere).toBeLessThan(1e-4);
          // Au bord, les deux côtés se rejoignent à mi-chemin (dans la gamme 0..255, avant le passage en linéaire).
          const mi = rgbLin(((((dalle >> 16) & 255) + ((roche >> 16) & 255)) >> 1) * 65536 + ((((dalle >> 8) & 255) + ((roche >> 8) & 255)) >> 1) * 256 + (((dalle & 255) + (roche & 255)) >> 1));
          expect(proche(s.c, mi) || proche(s.c, milieu), `x = ${s.x}`).toBe(true);
          bord++;
        }
      }
    expect(bord).toBeGreaterThan(0);
    // La case voisine, plus loin du bord : sa couleur pure, sans rien de la roche.
    for (const s of sommets(champ, 1)) expect(proche(s.c, rgbLin(dalle))).toBe(true);
    // Herbe et mousse, proches, se fondent toujours d'un coin à l'autre (pas de découpe au bord).
    expect(ecartDeCouleur(couleurDeMatiere('4e', 'herbe').dessus, couleurDeMatiere('4e', 'mousse').dessus)).toBeLessThan(CONTRASTE);
    const doux = sommets(champDuSol('4e', bloc('herbe', 'mousse')), 2);
    expect(doux.every((s) => Number.isInteger(Math.round(s.x * 1e4) / 1e4))).toBe(true);
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
      expect([...triangles(f)].every((t) => Math.abs(Math.hypot(t.lumiere.x, t.lumiere.y, t.lumiere.z) - 1) < 1e-5)).toBe(true);
      // La normale d'éclairage regarde du même côté que la vraie (seules les pentes à l'ombre sont redressées).
      expect([...triangles(f)].every((t) => t.n.x * t.lumiere.x + t.n.y * t.lumiere.y + t.n.z * t.lumiere.z > 0.3)).toBe(true);
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

  it('une case où quelque chose est posé (borne, maison, plan, décor, pont, monument) reste plate, sous ses cubes', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, champ } = reel(a);
      const poses = poseDuDecor(champ, cubes);
      cubes.forEach((c, i) => {
        if (c.sol) return;
        const col = colonneEn(champ, c.x, c.y);
        if (!col || c.z !== col.haut + 1) return;
        expect(col.fixe).toBe(true);
        // Plate, et le cube posé juste dessus (descendu avec sa case si c'est un décor sur une pente).
        expect(col.coins.every((h) => Math.abs(h - poses[i].z) < 1e-9), `${a} ${c.x},${c.y}`).toBe(true);
      });
    }
  }, 60_000);

  it('rien ne flotte de plus d’un demi-bloc : ce qui est posé, et ce qui s’appuie au bord (pont, cascade)', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, champ } = reel(a);
      const poses = poseDuDecor(champ, cubes);
      let adosses = 0;
      cubes.forEach((c, i) => {
        if (c.sol) return;
        const col = colonneEn(champ, c.x, c.y);
        if (col) {
          if (c.z === col.haut + 1) for (const h of col.coins) expect(Math.abs(poses[i].z - h), `${a} ${c.x},${c.y}`).toBeLessThanOrEqual(0.5);
          return;
        }
        // Au-dessus de l'eau, contre une colonne, à la hauteur de son dessus : le bord de la colonne est à sa hauteur.
        for (const [dx, dy, k0, k1] of [
          [1, 0, 0, 3],
          [-1, 0, 1, 2],
          [0, 1, 0, 1],
          [0, -1, 3, 2],
        ] as const) {
          const v = colonneEn(champ, c.x + dx, c.y + dy);
          if (!v || c.z !== v.haut) continue;
          adosses++;
          for (const k of [k0, k1]) expect(Math.abs(c.z + 1 - v.coins[k]), `${a} ${c.x},${c.y} contre ${v.x},${v.y}`).toBeLessThanOrEqual(0.5);
        }
      });
      expect(adosses, a).toBeGreaterThan(0);
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
    const ground = walkGround(cubes, creatures, casesDesLieux(a));
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

describe('la lumière et les strates', () => {
  it('une pente à l’ombre reçoit au moins 0,85 de la lumière d’un dessus plat ; au soleil, rien ne change', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const plat = eclairement(a, [0, 1, 0]);
      for (let az = 0; az < 360; az += 15)
        for (const up of [0.2, 0.4, 0.6, 0.8]) {
          const r = Math.sqrt(1 - up * up);
          const n: [number, number, number] = [r * Math.cos((az * Math.PI) / 180), up, r * Math.sin((az * Math.PI) / 180)];
          const e = normaleOmbree(a, n);
          expect(eclairement(a, e)).toBeGreaterThanOrEqual(PENTE_OMBRE * plat - 1e-6);
          if (eclairement(a, n) >= PENTE_OMBRE * plat) expect(e).toEqual(n);
        }
    }
  });

  it.each(ARCHIPELAGO_IDS)('%s : sur le maillage, aucune pente n’est éclairée à moins de 0,85 d’un dessus plat', (a) => {
    const { mesh } = reel(a);
    const plat = eclairement(a, [0, 1, 0]);
    let pentes = 0;
    for (const t of triangles(mesh.sol)) {
      if (t.n.y < 0.01 || t.n.y > 0.9999) continue;
      pentes++;
      expect(eclairement(a, [t.lumiere.x, t.lumiere.y, t.lumiere.z])).toBeGreaterThanOrEqual(PENTE_OMBRE * plat - 1e-4);
    }
    expect(pentes).toBeGreaterThan(1000);
  }, 30_000);

  it('la nuance reste dans [0,82 ; 1,08] ; les taches, sur les dessus seulement', () => {
    for (let x = 0; x < 60; x += 2.3)
      for (let y = -1; y < 20; y += 1.7)
        for (const dessus of [true, false]) {
          const v = nuanceDuSol(x, y, x * 0.7, dessus, 0);
          expect(v).toBeGreaterThanOrEqual(NUANCE_SOL[0]);
          expect(v).toBeLessThanOrEqual(NUANCE_SOL[1]);
        }
    expect(nuanceDuSol(3, 5, 7, false, 0)).toBe(nuanceDuSol(40, 5, 90, false, 0));
  });

  it('les strates : deux ou trois blocs d’épaisseur selon l’île, discrètes sur les hautes parois', () => {
    const ep = BIOMES.map((b) => epaisseurDesStrates(b.id));
    expect(new Set(ep)).toEqual(new Set([2, 3]));
    expect(epaisseurDesStrates('forge')).toBe(epaisseurDesStrates('forge'));
    expect(strate(0, 3)).toBe(1 + STRATES);
    expect(strate(2, 3)).toBe(1 + STRATES);
    expect(strate(3, 3)).toBe(1 - STRATES);
    expect(strate(3, 3, STRATES_HAUTES)).toBe(1 - 0.03);
  });

  it('un pied d’éboulis entoure les hautes colonnes de roche qui plongent dans la mer, à fleur d’eau', () => {
    for (const a of ['5e', '4e'] as const) {
      const { champ } = reel(a);
      expect(champ.pieds.length, a).toBeGreaterThan(0);
      for (const p of champ.pieds) {
        expect(colonneEn(champ, p.x, p.y)).toBeUndefined();
        const col = champ.colonnes[p.colonne];
        expect(Math.max(Math.abs(col.x - p.x), Math.abs(col.y - p.y))).toBe(1);
        for (const h of p.coins) expect(h).toBeLessThanOrEqual(RIVAGE + EBOULIS + 1e-9);
      }
    }
    expect(reel('3e').champ.pieds).toEqual([]);
  });
});

describe('le budget du terrain', () => {
  it.each(ARCHIPELAGO_IDS)('%s : le sol et la roche tiennent en deux appels de dessin au plus', (a) => {
    const { mesh } = reel(a);
    expect(appelsDuSol(mesh)).toBeLessThanOrEqual(2);
    expect(trianglesDuSol(mesh)).toBeGreaterThan(1000);
  }, 30_000);
});

it('le rebord plat de la dalle : la Forge reste plate jusqu’à son bord, la roche descend jusqu’à elle, on y marche à plat', async () => {
  // Lot R4 (décision du directeur artistique au lot R3). Comme la vue 3D : le décor en primitives ne fige pas sa case.
  const { rangerLeDecor } = await import('./decorMesh');
  const { islandDef, CORE } = await import('./map');
  const { progress, village } = toutConstruit();
  const cubes = worldCubes('4e', progress, village, false);
  const sol = cubes.filter((c) => c.sol);
  const champ = champDuSol('4e', sol, rangerLeDecor(cubes.filter((c) => !c.sol)).reste);
  const { core } = islandDef('forge');
  const dalle = champ.colonnes.filter((c) => c.x >= core.x && c.x < core.x + CORE && c.y >= core.y && c.y < core.y + CORE);
  const matiere = (c: { matieres: string[] }) => c.matieres[c.matieres.length - 1];
  const laDalle = matiere(dalle[0]);
  const dessus = (c: { matieres: string[] }) => couleurDeMatiere('4e', matiere(c) as never).dessus;
  let rebord = 0;
  for (const c of dalle) {
    if (matiere(c) !== laDalle) continue;
    const L = c.haut + 1;
    // Plate jusqu'à son bord : un coin ne monte vers la roche que si la dalle elle-même y monte (un gradin de la dalle).
    const autour = (k: number) =>
      [
        [-1, -1],
        [0, -1],
        [-1, 0],
        [0, 0],
      ].map(([ox, oy]) => colonneEn(champ, c.x + [0, 1, 1, 0][k] + ox, c.y + [0, 0, 1, 1][k] + oy));
    const aPlat = [0, 1, 2, 3].map((k) => autour(k).every((v) => !v || v.haut === c.haut || matiere(v) !== laDalle));
    for (let k = 0; k < 4; k++) if (aPlat[k]) expect(c.coins[k], `${c.x},${c.y} coin ${k}`).toBe(L);
    if (aPlat.every(Boolean))
      for (const [u, v] of [
        [0.5, 0.5],
        [0.05, 0.05],
        [0.95, 0.3],
        [0.2, 0.97],
      ]) {
        expect(hauteurDuSol(champ, c.x + u, c.y + v)).toBeCloseTo(L, 6);
        expect(piedsSur(champ, c.x + u, c.y + v, L)).toBeCloseTo(L, 6);
      }
    // Les voisines d'un bloc plus hautes qui tranchent (la roche) descendent jusqu'à elle sur le bord commun.
    for (const [dx, dy, k0, k1, j0, j1] of [
      [1, 0, 1, 2, 0, 3],
      [-1, 0, 0, 3, 1, 2],
      [0, 1, 3, 2, 0, 1],
      [0, -1, 0, 1, 3, 2],
    ]) {
      const v = colonneEn(champ, c.x + dx, c.y + dy);
      if (!v || v.haut !== c.haut + 1 || v.fixe || ecartDeCouleur(dessus(c), dessus(v)) <= CONTRASTE) continue;
      rebord++;
      expect([v.coins[j0], v.coins[j1]], `${v.x},${v.y}`).toEqual([c.coins[k0], c.coins[k1]]);
    }
    // Toucher le bord de la dalle redonne sa case.
    const h = hauteurDuSol(champ, c.x + 0.97, c.y + 0.03)!;
    expect(pickCell(champ, { x: c.x + 0.97, y: h, z: c.y + 0.03 }, { x: 0, y: 1, z: 0 })?.cell).toEqual({ x: c.x, y: c.y, z: c.haut });
  }
  expect(rebord).toBeGreaterThan(20);
});
