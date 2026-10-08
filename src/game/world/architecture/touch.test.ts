// Les pièces du lot 7b dans la construction : le toucher prend toute la case, pour chaque forme de pièce (murs peints,
// toits, pilotis) ; une pièce voisine d'un fantôme ferme sa face pendant le chantier, sans double face une fois tout
// construit ; une facette contre un bloc plein n'est pas émise ; une rangée se dessine d'un tenant.
import type { VoxelCube } from '../cube';
import { toutConstruit } from '../budget';
import { batimentsDe, caseDeLaConstruction, caseDeLaPiece, maillageDeLaConstruction, type GroupeDeConstruction, type MaillageDeLaConstruction } from '../construction';
import { worldCubes } from '../terrain';
import { architectureDe, FORMES, indexDuPlan, MOTIF, pieceDe, voisinageDe, type Forme } from '.';
import { KIT_6E } from './kits/6e';
import { barriereDe } from './lowPieces';

type P = { x: number; y: number; z: number };
const cube = (x: number, y: number, z: number, texture = 'planches', autre: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#888888', texture, tag: 't', ...autre });

/** Les sommets du triangle `t` d'un groupe (repère Three) et sa normale. */
function triangle(g: GroupeDeConstruction, t: number): { pts: P[]; n: P } {
  const s = [0, 1, 2].map((k) => g.indices[3 * t + k]);
  const pts = s.map((i) => ({ x: g.positions[3 * i], y: g.positions[3 * i + 1], z: g.positions[3 * i + 2] }));
  return { pts, n: { x: g.normals[3 * s[0]], y: g.normals[3 * s[0] + 1], z: g.normals[3 * s[0] + 2] } };
}

/** Des points de la facette : son centre, et près de chaque sommet (un peu vers le centre). */
function points(pts: P[]): P[] {
  const c = { x: (pts[0].x + pts[1].x + pts[2].x) / 3, y: (pts[0].y + pts[1].y + pts[2].y) / 3, z: (pts[0].z + pts[1].z + pts[2].z) / 3 };
  return [c, ...pts.map((p) => ({ x: p.x + 0.1 * (c.x - p.x), y: p.y + 0.1 * (c.y - p.y), z: p.z + 0.1 * (c.z - p.z) }))];
}

/** Le point (repère Three) est-il dans la case (grille), bords compris ? */
const dans = (p: P, c: P) => p.x >= c.x - 1e-6 && p.x <= c.x + 1 + 1e-6 && p.z >= c.y - 1e-6 && p.z <= c.y + 1 + 1e-6 && p.y >= c.z - 1e-6 && p.y <= c.z + 1 + 1e-6;

/** Touche chaque triangle de l'opaque en plusieurs points : la case rendue contient le point, et c'est une case du plan. */
function toucherPartout(m: MaillageDeLaConstruction, cases: Set<string>): { pieces: number; blocs: number } {
  let pieces = 0;
  let blocs = 0;
  for (let t = 0; t < m.opaque.indices.length / 3; t++) {
    const { pts, n } = triangle(m.opaque, t);
    for (const p of points(pts)) {
      const r = caseDeLaPiece(m, 'opaque', t, p, n) ?? caseDeLaConstruction(p, n);
      expect(dans(p, r.cell), `${t} ${JSON.stringify(p)} → ${JSON.stringify(r.cell)}`).toBe(true);
      expect(cases.has(`${r.cell.x},${r.cell.y},${r.cell.z}`), `${t} → ${JSON.stringify(r.cell)}`).toBe(true);
      expect(Math.abs(r.next.x - r.cell.x) + Math.abs(r.next.y - r.cell.y) + Math.abs(r.next.z - r.cell.z)).toBe(1);
    }
    if (caseDeLaPiece(m, 'opaque', t, pts[0], n)) pieces++;
    else blocs++;
  }
  return { pieces, blocs };
}

/** Une façade de murs de bois de chaque forme, sur deux étages, posée sur le sol. */
function mursDeChaqueForme(): { cubes: VoxelCube[]; sol: VoxelCube[]; formes: Set<Forme> } {
  // Un plan en croix, avec des bras de longueurs différentes : seul, bout, droit, angle, té et croix.
  const cases: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [2, 1],
    [2, -1],
    [2, -2],
    [3, -2],
    [1, 1],
    [6, 0],
  ];
  const cubes = cases.flatMap(([x, y]) => [cube(x, y, 1), cube(x, y, 2)]);
  const sol = cases.map(([x, y]) => cube(x, y, 0, 'herbe', { sol: true }));
  const index = indexDuPlan(cubes);
  const formes = new Set(cubes.map((c) => pieceDe(voisinageDe(c, index)!).piece.split('.')[1] as Forme));
  return { cubes, sol, formes };
}

describe('Le toucher des pièces du lot 7b : toute la case, pour chaque forme', () => {
  it('les murs peints de chaque forme (seul, bout, droit, angle, té, croix) : la case du bloc, partout sur ses faces', () => {
    const { cubes, sol, formes } = mursDeChaqueForme();
    expect([...formes].sort()).toEqual(FORMES.map((f) => f.forme).sort());
    const m = maillageDeLaConstruction('6e', cubes, sol, { kit: KIT_6E });
    expect(m.pieces).toBeUndefined();
    expect([...m.opaque.motifs].some((v) => v > 0)).toBe(true);
    const { blocs } = toucherPartout(m, new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`)));
    expect(blocs).toBeGreaterThan(0);
  });

  it('les toits d’une maison et d’une hutte du 6e (versant, faîte, croupe, arêtier), et une pointe : la case sous le point touché', () => {
    const { progress, world: village } = toutConstruit();
    const tous = worldCubes('6e', progress, village, false).filter((c) => !c.sol);
    const batiments = batimentsDe('6e');
    const vues = new Set<string>();
    for (const ile of ['french-6e-phonology', 'maths-6e-fractions']) {
      const cubes = tous.filter((c) => c.tag === ile);
      const m = maillageDeLaConstruction('6e', cubes);
      const archi = architectureDe('6e', cubes, { batiments });
      for (const p of archi.pieces) vues.add(p.piece.split('.')[1]);
      const { pieces } = toucherPartout(m, new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`)));
      expect(pieces, ile).toBeGreaterThan(0);
    }
    expect([...vues].sort()).toEqual(['aretier', 'croupe', 'faite', 'versant']);
    // La pointe : un toit qui descend de ses quatre côtés.
    const pointe = [cube(1, 1, 2, 'toit'), cube(0, 1, 1, 'toit'), cube(2, 1, 1, 'toit'), cube(1, 0, 1, 'toit'), cube(1, 2, 1, 'toit')];
    const archi = architectureDe('6e', pointe, { kit: KIT_6E });
    expect(archi.pieces.find((p) => p.cube.z === 2)!.piece).toBe('toit.pointe.courant.ciel');
    const m = maillageDeLaConstruction('6e', pointe, [], { kit: KIT_6E });
    expect(toucherPartout(m, new Set(pointe.map((c) => `${c.x},${c.y},${c.z}`))).pieces).toBeGreaterThan(0);
  }, 30_000);

  it('les pilotis (un mur de bois sur l’eau) : la case du mur, pieux compris', () => {
    const cubes = [cube(0, 0, 1), cube(1, 0, 1), cube(0, 0, 2), cube(1, 0, 2)];
    const m = maillageDeLaConstruction('6e', cubes, [], { kit: KIT_6E });
    const archi = architectureDe('6e', cubes, { kit: KIT_6E, surLeVide: () => true });
    expect(archi.pieces.map((p) => p.piece.split('.')[2])).toEqual(['pilotis', 'pilotis']);
    expect(toucherPartout(m, new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`))).pieces).toBeGreaterThan(0);
  });
});

describe('Le toucher de la table commune (8 octobre 2026) : toute la case, pour chaque forme', () => {
  const sol = (cubes: VoxelCube[]) => cubes.filter((c) => c.z === 1).map((c) => cube(c.x, c.y, 0, 'herbe', { sol: true }));
  const casesDe = (cubes: VoxelCube[]) => new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));

  it('le bac de pierre (une pierre seule et basse) : la case du bac, partout sur ses faces', () => {
    const cubes = [cube(0, 0, 1, 'galet')];
    const archi = architectureDe('6e', cubes, { kit: KIT_6E });
    expect(archi.pieces.map((p) => p.piece)).toEqual(['mur.seul.pied.chaperon']);
    const m = maillageDeLaConstruction('6e', cubes, sol(cubes), { kit: KIT_6E });
    expect(toucherPartout(m, casesDe(cubes)).pieces).toBeGreaterThan(0);
  });

  it('la marche devant une porte peinte, entre deux murs de bardage : la case de chacune', () => {
    const cubes = [cube(0, 1, 1, 'cabine'), cube(1, 1, 1, 'porte'), cube(2, 1, 1, 'cabine'), cube(0, 1, 2, 'cabine'), cube(1, 1, 2, 'cabine'), cube(2, 1, 2, 'cabine'), cube(1, 0, 1, 'escalier')];
    const archi = architectureDe('6e', cubes, { kit: KIT_6E });
    expect(archi.peints.get('1,1,1')!.peinture.motifs[0]).toBe(MOTIF.vantail);
    expect(archi.peints.get('0,1,2')!.peinture.fond).toBe('matiere');
    expect(archi.pieces.map((p) => p.cube.texture)).toEqual(['escalier']);
    const m = maillageDeLaConstruction('6e', cubes, sol(cubes), { kit: KIT_6E });
    const { pieces, blocs } = toucherPartout(m, casesDe(cubes));
    expect(pieces).toBeGreaterThan(0);
    expect(blocs).toBeGreaterThan(0);
  });

  it('la barrière (prête, pas branchée) de chaque forme : la case de la barrière, poteaux et lisses compris', () => {
    const kit = { ...KIT_6E, finitions: { ...KIT_6E.finitions, barriere: barriereDe } };
    const { cubes: murs } = mursDeChaqueForme();
    const cubes = murs.filter((c) => c.z === 1).map((c) => ({ ...c, texture: 'barriere' }));
    const archi = architectureDe('6e', cubes, { kit });
    expect(new Set(archi.pieces.map((p) => p.piece.split('.')[1])).size).toBe(FORMES.length);
    const m = maillageDeLaConstruction('6e', cubes, sol(cubes), { kit });
    expect(toucherPartout(m, casesDe(cubes)).pieces).toBeGreaterThan(0);
  });
});

/** Le toit d'une petite maison : deux versants de `n` cases (y = 0 et y = 2, z = 1), le faîte au milieu (y = 1, z = 2). */
function toit(n: number, fantome?: (c: VoxelCube) => boolean): VoxelCube[] {
  const out: VoxelCube[] = [];
  for (let x = 0; x < n; x++) out.push(cube(x, 0, 1, 'toit'), cube(x, 2, 1, 'toit'), cube(x, 1, 2, 'toit'));
  return out.map((c) => (fantome?.(c) ? { ...c, ghost: true } : c));
}

/** Les triangles des pièces, par leurs sommets (triés) : deux triangles aux mêmes sommets sont une double face. */
function trianglesDesPieces(m: MaillageDeLaConstruction): string[] {
  const out: string[] = [];
  for (const t of m.pieces ?? [])
    for (let i = t.opaque[0]; i < t.opaque[1]; i++)
      out.push(
        triangle(m.opaque, i)
          .pts.map((p) => [p.x, p.y, p.z].map((v) => v.toFixed(4)).join(','))
          .sort()
          .join('|'),
      );
  return out;
}

describe('L’assemblage des pièces', () => {
  it('tout construit : aucune double face, et une rangée de versants se dessine d’un tenant (sa pente, un quadrilatère)', () => {
    const m = maillageDeLaConstruction('6e', toit(4), [], { kit: KIT_6E });
    const tri = trianglesDesPieces(m);
    expect(new Set(tri).size).toBe(tri.length);
    // Les pentes des versants et du faîte : chacune deux triangles sur toute la longueur (x de 0 à 4).
    let pentesLongues = 0;
    for (const t of m.pieces!)
      for (let i = t.opaque[0]; i < t.opaque[1]; i++) {
        const { pts, n } = triangle(m.opaque, i);
        if (Math.abs(n.y) > 0.1 && Math.abs(n.y) < 0.99 && Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x)) === 4) pentesLongues++;
      }
    expect(pentesLongues).toBe(2 * 4);
    // Deux bouts à chaque rangée (les rives), rien entre deux pièces : 3 rangées × 2 bouts.
    const bouts = m.pieces!.flatMap((t) => Array.from({ length: t.opaque[1] - t.opaque[0] }, (_, k) => triangle(m.opaque, t.opaque[0] + k))).filter(({ n }) => Math.abs(n.x) > 0.99);
    expect(bouts.every(({ pts }) => pts.every((p) => p.x === 0 || p.x === 4))).toBe(true);
    expect(bouts.length).toBe(3 * 2);
  });

  it('pendant le chantier, une pièce voisine d’un fantôme ferme sa face de ce côté ; posé, la face disparaît', () => {
    // Le versant du milieu (x = 1, y = 0) encore à poser.
    const chantier = maillageDeLaConstruction('6e', toit(3, (c) => c.x === 1 && c.y === 0), [], { kit: KIT_6E });
    const bouts = (m: MaillageDeLaConstruction, x: number) =>
      m.pieces!.flatMap((t) => Array.from({ length: t.opaque[1] - t.opaque[0] }, (_, k) => triangle(m.opaque, t.opaque[0] + k))).filter(({ pts, n }) => Math.abs(n.x) > 0.99 && pts.every((p) => p.x === x && p.z <= 1));
    // Les deux versants voisins du fantôme ferment leur bout contre lui.
    expect(bouts(chantier, 1)).toHaveLength(1);
    expect(bouts(chantier, 2)).toHaveLength(1);
    // Le fantôme reste un cube de Brume, entier.
    expect(chantier.fantomes.indices.length / 3).toBe(12);
    const fini = maillageDeLaConstruction('6e', toit(3), [], { kit: KIT_6E });
    expect(bouts(fini, 1)).toHaveLength(0);
    expect(bouts(fini, 2)).toHaveLength(0);
  });

  it('une facette contre un bloc plein n’est pas émise : le dessous d’un versant posé sur un mur, le dos d’un versant contre le pignon', () => {
    const murs = [cube(0, 0, 0, 'pierre'), cube(0, 2, 0, 'pierre'), cube(0, 1, 1, 'pierre')];
    const m = maillageDeLaConstruction('6e', [...toit(1), ...murs], [], { kit: KIT_6E });
    const tris = m.pieces!.flatMap((t) => Array.from({ length: t.opaque[1] - t.opaque[0] }, (_, k) => triangle(m.opaque, t.opaque[0] + k)));
    // Aucun dessous sur z = 1 au-dessus des murs (y de 0 à 1 et de 2 à 3), aucun dos contre le pignon (y = 1 et y = 2).
    expect(tris.filter(({ pts, n }) => n.y < -0.99 && (pts.every((p) => p.y === 1) || pts.every((p) => p.y === 2)))).toHaveLength(0);
    expect(tris.filter(({ pts, n }) => Math.abs(n.z) > 0.99 && pts.every((p) => p.z === 1 || p.z === 2) && pts.every((p) => p.y <= 2))).toHaveLength(0);
    // Le pignon, lui, ne montre pas ses faces sous les versants (elles sont fermées) : ni en y = 1, ni en y = 2.
    const pignon = Array.from({ length: m.opaque.indices.length / 3 }, (_, i) => triangle(m.opaque, i)).filter(({ pts }) => pts.every((p) => p.y >= 1 && p.y <= 2 && p.x >= 0 && p.x <= 1));
    expect(pignon.filter(({ pts, n }) => Math.abs(n.z) > 0.99 && pts.every((p) => p.z === 1 || p.z === 2))).toHaveLength(0);
  });
});
