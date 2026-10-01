// L'architecture modulaire dans la construction taillée (lot 7a) : les pièces dans l'opaque, le toucher par la table
// triangle → case, les faces que ferme une pièce, et la mise bout à bout des îles.
import type { VoxelCube } from '../cube';
import { toutConstruit } from '../budget';
import { caseDeLaPiece, maillageDeLaConstruction, miseBoutABout, type GroupeDeConstruction, type MaillageDeLaConstruction } from '../construction';
import { worldCubes } from '../terrain';
import { boiteDansLaCase, FORMES, kitVide, type DessinDePiece, type IdDePiece, type Kit } from '.';

const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;

/** Un kit d'essai : la pierre seule, dessinée partout par `dessin`. */
function kitDEssai(dessin: DessinDePiece): Kit {
  const pieces: Partial<Record<IdDePiece, DessinDePiece>> = {};
  for (const { forme } of FORMES) for (const pied of ['pied', 'haut', 'pilotis'] as const) for (const tete of ['chaperon', 'toit', 'mur'] as const) pieces[`mur.${forme}.${pied}.${tete}`] = dessin;
  return { ...kitVide(), matieres: { pierre: 'pierre' }, pieces: { pierre: pieces } };
}

const cube = (x: number, y: number, z: number, texture = 'pierre', autre: Partial<VoxelCube> = {}): VoxelCube => ({ x, y, z, color: '#888888', texture, tag: 'port', ...autre });

/** Le centre et la normale du triangle `t` d'un groupe (repère Three). */
function triangle(g: GroupeDeConstruction, t: number) {
  const s = [0, 1, 2].map((k) => g.indices[3 * t + k]);
  const p = (i: number, a: number) => g.positions[3 * s[i] + a];
  const centre = { x: (p(0, 0) + p(1, 0) + p(2, 0)) / 3, y: (p(0, 1) + p(1, 1) + p(2, 1)) / 3, z: (p(0, 2) + p(1, 2) + p(2, 2)) / 3 };
  const normale = { x: g.normals[3 * s[0]], y: g.normals[3 * s[0] + 1], z: g.normals[3 * s[0] + 2] };
  return { centre, normale };
}

/** Chaque triangle des pièces rend la case de son bloc ; la case devant est à un pas. */
function verifierLeToucher(m: MaillageDeLaConstruction, cases: Set<string>) {
  let vus = 0;
  for (const t of m.pieces ?? [])
    for (let i = t.opaque[0]; i < t.opaque[1]; i++) {
      const { centre, normale } = triangle(m.opaque, i);
      const r = caseDeLaPiece(m, 'opaque', i, centre, normale);
      expect(r, `${i}`).not.toBeNull();
      expect(cases.has(cle(r!.cell)), `${i}`).toBe(true);
      // Le triangle est dans la case rendue : toute la case se touche.
      expect(centre.x >= r!.cell.x && centre.x <= r!.cell.x + 1 && centre.z >= r!.cell.y && centre.z <= r!.cell.y + 1 && centre.y >= r!.cell.z && centre.y <= r!.cell.z + 1).toBe(true);
      expect(Math.abs(r!.next.x - r!.cell.x) + Math.abs(r!.next.y - r!.cell.y) + Math.abs(r!.next.z - r!.cell.z)).toBe(1);
      vus++;
    }
  return vus;
}

/** Un petit bâtiment : un mur de pierre de trois sur deux, une case encore fantôme, une planche à côté. */
const batiment = (dx = 0, tag = 'port'): VoxelCube[] => [
  cube(dx, 0, 1, 'pierre', { tag }),
  cube(dx + 1, 0, 1, 'pierre', { tag }),
  cube(dx + 2, 0, 1, 'pierre', { tag }),
  cube(dx, 0, 2, 'pierre', { tag }),
  cube(dx + 1, 0, 2, 'pierre', { tag, ghost: true }),
  cube(dx + 3, 0, 1, 'planches', { tag }),
];

describe('Les pièces d’architecture dans la construction', () => {
  it('hors des Premiers Rivages (kits vides), rien ne change : ni pièce, ni motif, sur une île construite', () => {
    const { progress, village } = toutConstruit();
    const tous = worldCubes('5e', progress, village, false).filter((c) => !c.sol);
    const ile = tous.find((c) => c.tag)!.tag;
    const m = maillageDeLaConstruction('5e', tous.filter((c) => c.tag === ile));
    expect(m.pieces).toBeUndefined();
    expect(m.opaque.motifs.length).toBe(m.opaque.positions.length / 3);
    expect([...m.opaque.motifs].every((v) => v === 0)).toBe(true);
  }, 30_000);

  it('les blocs posés du kit deviennent pièces ; chaque triangle rend sa case, toute la case ; le fantôme reste un fantôme', () => {
    const cubes = batiment();
    const kit = kitDEssai(boiteDansLaCase(0.1, 0.9, 0.2, 0.8, 0, 0.9, 3));
    const m = maillageDeLaConstruction('6e', cubes, [], { kit });
    const posees = new Set(cubes.filter((c) => c.texture === 'pierre' && !c.ghost).map(cle));
    expect(m.pieces).toHaveLength(1);
    expect(verifierLeToucher(m, posees)).toBe(posees.size * 12);
    // Le motif peint suit la pièce, par sommet ; rien ailleurs.
    const [t0, t1] = m.pieces![0].opaque;
    const sommets = new Set<number>();
    for (let t = t0; t < t1; t++) for (let k = 0; k < 3; k++) sommets.add(m.opaque.indices[3 * t + k]);
    m.opaque.motifs.forEach((v, i) => expect(v).toBe(sommets.has(i) ? 3 : 0));
    // Le fantôme : toujours dessiné, en entier (six faces, deux triangles chacune).
    expect(m.fantomes.indices.length / 3).toBe(12);
    // Hors des pièces (la planche) : `caseDeLaPiece` ne répond pas.
    if (t0 > 0) expect(caseDeLaPiece(m, 'opaque', t0 - 1, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBeNull();
  });

  it('une pièce qui ferme la face de sa case cache la face voisine ; une pièce ouverte la laisse voir', () => {
    // La pierre (remplacée) à gauche de la planche (restée bloc) : la face −x de la planche.
    const cubes = [cube(0, 0, 1), cube(1, 0, 1, 'planches')];
    const horsPieces = (m: MaillageDeLaConstruction) => m.opaque.indices.length / 3 - (m.pieces ?? []).reduce((n, t) => n + t.opaque[1] - t.opaque[0], 0);
    const pleine = maillageDeLaConstruction('6e', cubes, [], { kit: kitDEssai(boiteDansLaCase(0, 1, 0, 1, 0, 1)) });
    const ouverte = maillageDeLaConstruction('6e', cubes, [], { kit: kitDEssai(boiteDansLaCase(0, 0.5, 0, 1, 0, 1)) });
    // Cinq faces de la planche, puis six.
    expect(horsPieces(pleine)).toBe(5 * 2);
    expect(horsPieces(ouverte)).toBe(6 * 2);
  });

  it('mis bout à bout, les tranches des pièces sont décalées et le toucher suit', () => {
    const kit = kitDEssai(boiteDansLaCase(0.1, 0.9, 0.2, 0.8, 0, 0.9));
    const a = batiment(0, 'port');
    const b = batiment(10, 'phare');
    const ma = maillageDeLaConstruction('6e', a, [], { kit });
    const mb = maillageDeLaConstruction('6e', b, [], { kit });
    const bout = miseBoutABout([ma, mb]);
    expect(bout.pieces).toHaveLength(2);
    expect(bout.pieces![1].opaque[0]).toBe(mb.pieces![0].opaque[0] + ma.opaque.indices.length / 3);
    expect(bout.opaque.motifs.length).toBe(bout.opaque.positions.length / 3);
    const posees = new Set([...a, ...b].filter((c) => c.texture === 'pierre' && !c.ghost).map(cle));
    expect(verifierLeToucher(bout, posees)).toBe(posees.size * 12);
  });

  it('mis bout à bout, les ponts de pierre et de bois du 5e gardent leurs tranches, île par île', () => {
    const { progress, village } = toutConstruit();
    const tous = worldCubes('5e', progress, village, false).filter((c) => !c.sol);
    const iles = [...new Set(tous.map((c) => c.tag ?? ''))];
    const maillages = iles.map((t) => maillageDeLaConstruction('5e', tous.filter((c) => (c.tag ?? '') === t)));
    const avecPonts = maillages.filter((m) => m.ponts?.length);
    expect(avecPonts.length).toBeGreaterThan(0);
    const bout = miseBoutABout(maillages);
    const total = (l: { opaque: [number, number] }[]) => l.reduce((n, p) => n + p.opaque[1] - p.opaque[0], 0);
    expect(bout.ponts).toHaveLength(avecPonts.length);
    expect(total(bout.ponts!)).toBe(avecPonts.reduce((n, m) => n + total(m.ponts!), 0));
    // Chaque tranche est décalée du nombre de triangles des îles d'avant.
    let debut = 0;
    let k = 0;
    for (const m of maillages) {
      for (const p of m.ponts ?? []) expect(bout.ponts![k++].opaque).toEqual([p.opaque[0] + debut, p.opaque[1] + debut]);
      debut += m.opaque.indices.length / 3;
    }
  }, 60_000);
});
