// L'école, la salle des trophées et la Halle aux matériaux des Premiers Rivages au kit du 6e (lot 7b, décision du
// directeur artistique du 30 septembre 2026) : leurs murs en colombage, leurs toits en pentes ; la porte, les fenêtres,
// le clocheton, le fond de velours, les socles, les trophées et la cour de la Halle restent des blocs ; le toucher prend
// toute la case ; les monuments et les autres archipels ne changent pas.
import type { BlockId } from '../../biomes';
import type { VoxelCube } from '../cube';
import { BADGES } from '../../../core/progress';
import { trophyBlock } from '../../trophies';
import { toutConstruit } from '../budget';
import { batimentsDe, caseDeLaConstruction, caseDeLaPiece, caseDuLieu, maillageDeLaConstruction, type GroupeDeConstruction } from '../construction';
import { atelierModel, schoolModel, trophyModel, TROPHY_SLOTS, worldCubes } from '../terrain';
import { architectureDe, estUnLieuDuVillage, MOTIF, pieceDe, type Voisinage } from '.';
import { KIT_6E } from './kits/6e';

const TOUS: BlockId[] = BADGES.map((b) => trophyBlock(b.id));

/** Les blocs des lieux du village d'un archipel tout construit (le lieu où l'on assemble : la Halle d'Archipéo), avec `n` trophées, et le sol. */
function lieux(a: '6e' | '5e' | '4e' | '3e', trophees: BlockId[] = []) {
  const { progress, village } = toutConstruit();
  const tous = worldCubes(a, progress, village, false, trophees, false, 'halle');
  return { tous, cubes: tous.filter((c) => estUnLieuDuVillage(c.place)), sol: tous.filter((c) => c.sol) };
}

const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;
const archiDe = (a: '6e' | '5e' | '4e' | '3e', cubes: VoxelCube[]) => architectureDe(a, cubes, { batiments: batimentsDe(a), caseDuLieu });

describe('Les lieux du village au kit du 6e', () => {
  it('chaque bloc de l’école, de la salle et de la Halle retrouve sa case dans le modèle de son lieu (hors la marche qui rattrape le sol)', () => {
    const { cubes } = lieux('6e', TOUS.slice(0, 8));
    const modeles = { ecole: schoolModel(), trophees: trophyModel(TOUS.slice(0, 8)), assemblage: atelierModel('halle', '6e') };
    for (const place of ['ecole', 'trophees', 'assemblage'] as const) {
      const attendu = new Set(modeles[place].map((m) => `${m.x},${m.y},${m.z}`));
      const lus = cubes
        .filter((c) => c.place === place)
        .map(caseDuLieu)
        .filter((m) => m !== null)
        .map((m) => `${m.x},${m.y},${m.z}`);
      expect(new Set(lus)).toEqual(attendu);
    }
  });

  it('l’école : ses murs en colombage sur soubassement, un toit à deux pans de versants ; la porte, les fenêtres et le clocheton restent des blocs', () => {
    const { cubes } = lieux('6e');
    const archi = archiDe('6e', cubes);
    const ecole = cubes.filter((c) => c.place === 'ecole');
    const rel = (c: VoxelCube) => caseDuLieu(c)!;
    // Les murs : brique et pierre de taille des trois rangs posés sur le sol.
    const murs = ecole.filter((c) => rel(c) && rel(c).z <= 3 && (c.texture === 'brique' || c.texture === 'taille'));
    expect(murs.length).toBe(60 - 4);
    for (const c of murs) {
      const p = archi.peints.get(cle(c));
      expect(p?.peinture.fond, cle(c)).toBe('remplissage');
      // Le rang du pied porte le soubassement ; le rang du haut, la sablière haute (jamais un chaperon : le toit est au-dessus).
      const m = p!.peinture.motifs;
      if (rel(c).z === 1) expect(m.slice(0, 4).every((f) => f & MOTIF.soubassement)).toBe(true);
      if (rel(c).z === 3) expect(m.slice(0, 4).every((f) => f & MOTIF.sabliereHaute && !(f & MOTIF.chaperon))).toBe(true);
    }
    // Au plus une décharge par face, seulement au rez, aux bouts et aux angles de la façade.
    for (const { cube: c, peinture } of archi.peints.values()) {
      if (c.place !== 'ecole') continue;
      const decharges = peinture.motifs.filter((f) => f & (MOTIF.montante | MOTIF.descendante));
      if (rel(c).z > 1) expect(decharges).toEqual([]);
      else expect(decharges.length).toBeLessThanOrEqual(2);
    }
    // Le toit : des versants seulement (deux pans), jamais une pointe ; le rang caché sous le haut du toit et la souche du
    // clocheton restent des blocs.
    const toits = archi.pieces.filter((p) => p.cube.place === 'ecole');
    expect(toits.length).toBe(19);
    expect(new Set(toits.map((p) => p.piece.split('.')[1]))).toEqual(new Set(['versant']));
    for (const c of ecole.filter((c) => ['porte', 'verre', 'or'].includes(c.texture ?? '') || rel(c)?.z === 6)) {
      expect(archi.peints.has(cle(c)) || archi.remplacees.has(cle(c)), cle(c)).toBe(false);
    }
    // La souche du clocheton (le toit sous lui) : un bloc, de la pierre de taille du clocheton (un seul fût de deux cases).
    const souches = ecole.filter((c) => c.texture === 'toit' && rel(c)?.z === 5 && rel(c).x === 2 && rel(c).y === 1);
    expect(souches.length).toBe(1);
    expect(archi.matieres.get(cle(souches[0]))).toBe('taille');
    expect(archi.remplacees.has(cle(souches[0]))).toBe(false);
    expect([...archi.matieres.keys()]).toEqual([cle(souches[0])]);
  });

  it('la salle des trophées : ses quatre piliers en colombage, son toit en pentes dans la couverture de l’île, son faîte d’or ; velours, socles et trophées restent des blocs', () => {
    const { cubes } = lieux('6e', TOUS.slice(0, 6));
    const archi = archiDe('6e', cubes);
    const salle = cubes.filter((c) => c.place === 'trophees');
    const rel = (c: VoxelCube) => caseDuLieu(c)!;
    const piliers = [...archi.peints.values()].filter((p) => p.cube.place === 'trophees');
    expect(piliers.length).toBe(12);
    expect(piliers.every((p) => p.cube.texture === 'marbre' && p.peinture.fond === 'remplissage')).toBe(true);
    // Des piliers isolés : poteaux et sablières, aucune décharge (décision du directeur artistique, 1er octobre 2026).
    for (const p of piliers) expect(p.peinture.motifs.every((f) => !(f & (MOTIF.montante | MOTIF.descendante))), cle(p.cube)).toBe(true);
    expect(piliers.filter((p) => rel(p.cube).z === 1).every((p) => p.peinture.motifs.slice(0, 4).every((f) => f & MOTIF.soubassement))).toBe(true);
    const toits = archi.pieces.filter((p) => p.cube.place === 'trophees');
    // Deux rangs de versants (devant, derrière) et le faîte d'or.
    expect(toits.map((p) => `${p.cube.texture}:${p.piece.split('.')[1]}`).sort()).toEqual([...Array(8).fill('taille:versant'), ...Array(4).fill('or:faite')].sort());
    // La couverture de l'île : le toit de pierre de taille, pièces et rang caché ; jamais l'or.
    for (const c of salle.filter((c) => rel(c)?.z === 4)) expect(archi.couverts.has(cle(c))).toBe(true);
    for (const c of salle.filter((c) => c.texture === 'or')) expect(archi.couverts.has(cle(c))).toBe(false);
    // Le reste (le fond de velours, les socles, les trophées) : des blocs.
    const pilier = (m: { x: number; y: number }) => (m.x === 0 || m.x === 3) && (m.y === 0 || m.y === 2);
    for (const c of salle) {
      const m = rel(c);
      if (!m || m.z >= 4 || pilier(m)) continue;
      expect(archi.peints.has(cle(c)) || archi.remplacees.has(cle(c)), cle(c)).toBe(false);
    }
  });

  it('la Halle aux matériaux : ses murs de bois sur leur rang de pierre en colombage sur soubassement, son toit à deux pentes en versants et faîte ; la porte reste ouverte, la cour reste en blocs', () => {
    const { cubes } = lieux('6e');
    const archi = archiDe('6e', cubes);
    const halle = cubes.filter((c) => c.place === 'assemblage');
    const rel = (c: VoxelCube) => caseDuLieu(c)!;
    // Les murs : les deux rangs de la halle (pierre, puis bois), sans la porte (creuse sur deux rangs, jusqu'au fond).
    const murs = [...archi.peints.values()].filter((p) => p.cube.place === 'assemblage');
    expect(murs.length).toBe(2 * (9 - 2));
    for (const { cube: c, peinture } of murs) {
      const m = rel(c);
      expect(m.y, cle(c)).toBeGreaterThanOrEqual(2);
      expect(peinture.fond, cle(c)).toBe('remplissage');
      // Le rang de pierre devient le soubassement du colombage ; le rang de bois porte la sablière haute sous le toit.
      if (m.z === 1) expect(peinture.motifs.slice(0, 4).every((f) => f & MOTIF.soubassement)).toBe(true);
      else expect(peinture.motifs.slice(0, 4).every((f) => f & MOTIF.sabliereHaute && !(f & (MOTIF.chaperon | MOTIF.soubassement)))).toBe(true);
      // Au plus une décharge par face, au rez seulement, jamais deux sur la même face (ni X, ni V).
      const decharges = peinture.motifs.filter((f) => f & (MOTIF.montante | MOTIF.descendante));
      if (m.z > 1) expect(decharges).toEqual([]);
      else expect(decharges.length).toBeLessThanOrEqual(2);
      for (const f of peinture.motifs) expect(f & MOTIF.montante && f & MOTIF.descendante).toBeFalsy();
    }
    // Le toit : deux rangs de versants (gauche, droite), le faîte au milieu ; le rang sous le faîte reste un bloc caché.
    const toits = archi.pieces.filter((p) => p.cube.place === 'assemblage');
    expect(toits.map((p) => p.piece.split('.')[1]).sort()).toEqual([...Array(6).fill('versant'), ...Array(3).fill('faite')].sort());
    // La porte : creuse (aucun bloc), à la même place ; la cour (la potence, le bloc suspendu, les blocs de la recette) : des blocs.
    const occupees = new Set(halle.map((c) => `${rel(c)?.x},${rel(c)?.y},${rel(c)?.z}`));
    for (const y of [2, 3]) for (const z of [1, 2]) expect(occupees.has(`1,${y},${z}`)).toBe(false);
    for (const c of halle.filter((c) => rel(c) && rel(c).y < 2)) expect(archi.peints.has(cle(c)) || archi.remplacees.has(cle(c)), cle(c)).toBe(false);
    expect([...archi.couverts].filter((k) => halle.some((c) => cle(c) === k))).toEqual([]);
  });

  it('un trophée posé sur le toit ou le faîte : le toit sous lui reste un bloc, le trophée ne flotte jamais au-dessus d’une pente', () => {
    const { cubes } = lieux('6e', TOUS);
    const archi = archiDe('6e', cubes);
    const salle = cubes.filter((c) => c.place === 'trophees');
    const occupees = new Set(salle.map(cle));
    for (const c of salle) {
      if (!archi.remplacees.has(cle(c))) continue;
      expect(occupees.has(`${c.x},${c.y},${c.z + 1}`), cle(c)).toBe(false);
    }
    // Tous les succès : chaque place du toit a son trophée, donc tout le toit reste en blocs.
    expect(TOUS.length).toBe(TROPHY_SLOTS.length);
    expect(archi.pieces.filter((p) => p.cube.place === 'trophees')).toEqual([]);
  });

  it('le haut d’un toit de quatre rangées : un versant qui monte vers sa voisine de même niveau (la règle tourne avec lui)', () => {
    const base: Voisinage = { texture: 'toit', classe: 'toit', cotes: 0, dessus: 'rien', dessous: 'rien', monte: 0, descend: 0, coins: 0, toits: 0, surLeVide: false };
    for (let r = 0; r < 4; r++) {
      const bas = 1 << ((2 + r) % 4);
      const haut = 1 << r;
      expect(pieceDe({ ...base, descend: bas, cotes: haut | (1 << ((r + 1) % 4)) | (1 << ((r + 3) % 4)) })).toEqual({ piece: 'toit.versant.courant.ciel', rotation: r });
      // Sans voisine du côté haut, rien de lisible : il reste un bloc.
      expect(pieceDe({ ...base, descend: bas }).piece).toBe('toit.plat.courant.ciel');
    }
  });

  it.each([0, 6])('le toucher, avec %i trophées : toute la case d’un bloc, et toujours le lieu de la facette touchée (un toit de la salle ouvre la salle, jamais l’école ; un toit de la Halle, la Halle)', (n) => {
    const { cubes, sol } = lieux('6e', TOUS.slice(0, n));
    const m = maillageDeLaConstruction('6e', cubes, sol);
    const parCase = new Map(cubes.map((c) => [cle(c), c]));
    // L'emprise au sol de chaque lieu : une facette au-dessus d'elle est à ce lieu.
    const emprise = new Map(cubes.map((c) => [`${c.x},${c.y}`, c.place]));
    const g: GroupeDeConstruction = m.opaque;
    let pieces = 0;
    const lieuxTouches = new Set<string>();
    for (let t = 0; t < g.indices.length / 3; t++) {
      const s = [0, 1, 2].map((k) => g.indices[3 * t + k]);
      const pts = s.map((i) => ({ x: g.positions[3 * i], y: g.positions[3 * i + 1], z: g.positions[3 * i + 2] }));
      const nor = { x: g.normals[3 * s[0]], y: g.normals[3 * s[0] + 1], z: g.normals[3 * s[0] + 2] };
      const c = { x: (pts[0].x + pts[1].x + pts[2].x) / 3, y: (pts[0].y + pts[1].y + pts[2].y) / 3, z: (pts[0].z + pts[1].z + pts[2].z) / 3 };
      const piece = caseDeLaPiece(m, 'opaque', t, c, nor);
      const r = piece ?? caseDeLaConstruction(c, nor);
      // Le lieu de la facette, lu sous elle (un peu en dedans) : repère Three (x, hauteur, y).
      const attendu = emprise.get(`${Math.floor(c.x - nor.x * 0.01)},${Math.floor(c.z - nor.z * 0.01)}`);
      const touche = parCase.get(cle(r.cell));
      expect(touche?.place, `${t} → ${JSON.stringify(r.cell)}`).toMatch(/^(ecole|trophees|assemblage)$/);
      expect(touche?.place, `${t} → ${JSON.stringify(r.cell)}`).toBe(attendu);
      lieuxTouches.add(touche?.place ?? '');
      if (piece) pieces++;
    }
    expect(pieces).toBeGreaterThan(0);
    expect([...lieuxTouches].sort()).toEqual(['assemblage', 'ecole', 'trophees']);
  });

  it('les monuments gardent leurs blocs taillés ; au 5e, au 4e et au 3e, l’école, la salle et la Halle gardent leur dessin', () => {
    const { progress, village } = toutConstruit();
    const tous = worldCubes('6e', progress, village, false).filter((c) => !c.sol);
    const archi = archiDe('6e', tous);
    for (const [k, p] of archi.peints) expect(p.cube.place?.startsWith('monument:') ?? false, k).toBe(false);
    for (const p of archi.pieces) expect(p.cube.place?.startsWith('monument:') ?? false).toBe(false);
    for (const a of ['5e', '4e', '3e'] as const) {
      const { cubes } = lieux(a, TOUS.slice(0, 6));
      const autre = archiDe(a, cubes);
      expect(autre.pieces.length + autre.peints.size + autre.couverts.size).toBe(0);
    }
  });
});

describe('KIT_6E nomme ses lieux', () => {
  it('l’école, la salle des trophées et le lieu où l’on assemble, et rien d’autre', () => {
    expect(Object.keys(KIT_6E.lieux ?? {}).sort()).toEqual(['assemblage', 'ecole', 'trophees']);
  });
});
