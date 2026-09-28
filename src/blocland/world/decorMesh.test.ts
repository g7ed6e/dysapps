import type { VoxelCube } from '../Voxel';
import { toutConstruit } from './budget';
import { DECOR_BATI } from './decor';
import { caseDuDecor, coutDuDecor, ENFONCE, enPrimitives, maillageDuDecor, rangerLeDecor, type ElementDeDecor } from './decorMesh';
import { champDuSol, colonneEn, hauteurDuSol, pickCell, piedsSur, type ChampDuSol } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import { buildMesh, faceCount } from './mesher';
import { kindOf, PROP_KINDS } from './props';
import { worldCubes } from './terrain';

/** Un archipel tout construit, rangé comme le rend la vue 3D d'Archipéo. */
const ranges = new Map<ArchipelagoId, ReturnType<typeof ranger>>();
function ranger(a: ArchipelagoId, vide = false) {
  const { progress, village } = toutConstruit();
  const cubes = vide ? worldCubes(a, {}) : worldCubes(a, progress, village, false);
  const sol = cubes.filter((c) => c.sol);
  const autres = cubes.filter((c) => !c.sol);
  const { elements, reste } = rangerLeDecor(autres);
  const champ = champDuSol(a, sol, reste);
  return { cubes, sol, autres, elements, reste, champ, avant: champDuSol(a, sol, autres), maillage: maillageDuDecor(a, champ, elements) };
}
const monde = (a: ArchipelagoId) => {
  let r = ranges.get(a);
  if (!r) ranges.set(a, (r = ranger(a)));
  return r;
};
/** Les triangles d'un élément : leurs sommets. */
function sommets(m: ReturnType<typeof ranger>['maillage'], i: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const f = m.decor;
  for (let t = 0; t < f.elements.length; t++) if (f.elements[t] === i) for (let k = 0; k < 3; k++) out.push([f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]]);
  return out;
}
const surTerre = (champ: ChampDuSol, e: ElementDeDecor) => Boolean(colonneEn(champ, e.x, e.y));

it('range le décor en éléments : arbres, rochers, repères, cascades et mer ; le reste garde ses cubes', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { autres, elements, reste } = monde(a);
    // Rien ne se perd, rien ne se copie.
    expect(reste.length + elements.reduce((n, e) => n + e.cubes.length, 0), a).toBe(autres.length);
    expect(reste.some(enPrimitives), a).toBe(false);
    for (const e of elements) {
      expect([...PROP_KINDS, ...DECOR_BATI], e.id).toContain(e.genre);
      for (const c of e.cubes) expect(c.decor).toBe(e.id);
    }
    // Les objets du quai (barque, caisses, fanions, foyer) restent en cubes, comme le décor du cœur sans nom.
    expect(reste.some((c) => c.decor && kindOf(c.decor) === 'barque'), a).toBe(a !== '3e');
    expect(new Set(elements.map((e) => e.id)).size).toBe(elements.length);
  }
  expect(monde('6e').elements.some((e) => e.genre === 'arbre')).toBe(true);
  expect(monde('3e').elements.some((e) => e.genre === 'grand-phare')).toBe(true);
});

it('plus de socle plat sous le décor : ses cases rejoignent la pente du sol', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { champ, avant, elements, reste } = monde(a);
    // Les cases où il n'y a plus que du décor ne sont plus figées ; celles où il y a autre chose le restent.
    const autreChose = new Set(reste.filter((c) => !c.sol).map((c) => `${c.x},${c.y},${c.z}`));
    let liberees = 0;
    let enPente = 0;
    for (const e of elements) {
      const col = colonneEn(champ, e.x, e.y);
      if (!col) continue;
      const figee = autreChose.has(`${e.x},${e.y},${col.haut + 1}`);
      if (figee) continue;
      const vieille = colonneEn(avant, e.x, e.y)!;
      if (vieille.fixe && !col.fixe) liberees++;
      if (Math.max(...col.coins) - Math.min(...col.coins) > 0.2) enPente++;
    }
    expect(liberees, a).toBeGreaterThan(10);
    expect(enPente, a).toBeGreaterThan(5);
    // Plus aucun décor en primitives ne descend avec sa case (le décor resté en cubes, oui).
    for (const id of champ.decorsAbaisses.keys()) expect(elements.some((e) => e.id === id), id).toBe(false);
  }
});

it('chaque élément du décor est posé sur la pente, au milieu de sa case, sans flotter', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { champ, elements, maillage } = monde(a);
    elements.forEach((e, i) => {
      const pts = sommets(maillage, i);
      if (!pts.length) return;
      const bas = Math.min(...pts.map((p) => p[1]));
      if (e.genre === 'fumee' || e.genre === 'ecueil' || e.genre === 'banc' || e.genre === 'cascade') return;
      if (!surTerre(champ, e)) return;
      const w = e.emprise;
      // Le pied touche le sol (ou s'y enfonce), au plus bas de son emprise pour un repère de plusieurs cases.
      let solBas = Infinity;
      for (const u of [0.1, 0.5, 0.9]) for (const v of [0.1, 0.5, 0.9]) solBas = Math.min(solBas, hauteurDuSol(champ, e.x + u * w, e.y + v * w) ?? Infinity);
      // (Un buisson de deux cases : chacune sur son sol.)
      const cases = e.genre === 'buisson' ? e.cubes : [{ x: e.x, y: e.y }];
      const sol = !DECOR_BATI.has(e.genre) ? Math.min(...cases.map((c) => hauteurDuSol(champ, c.x + 0.5, c.y + 0.5) ?? Infinity)) : solBas;
      expect(bas, `${a} ${e.id}`).toBeLessThanOrEqual(sol + 0.01);
      expect(bas, `${a} ${e.id}`).toBeGreaterThanOrEqual(sol - ENFONCE - 0.5);
      // Au milieu de sa case : le décor d'une case est centré sur elle (à la variation près).
      if (w === 1 && PROP_KINDS.includes(e.genre as never) && e.cubes.length <= 2) {
        const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const mz = pts.reduce((s, p) => s + p[2], 0) / pts.length;
        // (Un buisson : sur ses cases à lui.)
        const ox = e.genre === 'buisson' ? e.cubes.reduce((t, c) => t + c.x, 0) / e.cubes.length : e.x;
        const oy = e.genre === 'buisson' ? e.cubes.reduce((t, c) => t + c.y, 0) / e.cubes.length : e.y;
        expect(Math.abs(mx - (ox + 0.5)) + Math.abs(mz - (oy + 0.5)), `${a} ${e.id}`).toBeLessThan(0.6);
      }
    });
  }
}, 30_000);

it('l’habillage de la mer affleure, la cascade tombe du bord de sa case jusqu’à l’eau', () => {
  const { elements, maillage, champ } = monde('5e');
  const mer = elements.map((e, i) => ({ e, i })).filter(({ e }) => e.genre === 'ecueil' || e.genre === 'banc');
  expect(mer.length).toBeGreaterThan(20);
  for (const { e, i } of mer) {
    const pts = sommets(maillage, i);
    // Sous l'eau, et au-dessus : on le voit de la côte.
    expect(Math.min(...pts.map((p) => p[1])), e.id).toBeLessThan(-0.45);
    expect(Math.max(...pts.map((p) => p[1])), e.id).toBeGreaterThan(-0.45);
  }
  const cascades = elements.map((e, i) => ({ e, i })).filter(({ e }) => e.genre === 'cascade');
  expect(cascades.length).toBe(3);
  for (const { e, i } of cascades) {
    const pts = sommets(maillage, i);
    const col = colonneEn(champ, e.x, e.y)!;
    expect(col, e.id).toBeTruthy();
    // Du haut de la case du bord (sur la pente) jusqu'à la mer.
    expect(Math.max(...pts.map((p) => p[1])), e.id).toBeLessThanOrEqual(col.haut + 1 + 0.1);
    expect(Math.max(...pts.map((p) => p[1])), e.id).toBeGreaterThan(col.haut);
    expect(Math.min(...pts.map((p) => p[1])), e.id).toBeLessThanOrEqual(-0.3);
    // Collée à la falaise : jamais plus d'une case et demie de son bord.
    for (const p of pts) expect(Math.hypot(p[0] - (e.x + 0.5), p[2] - (e.y + 0.5)), e.id).toBeLessThan(1.75);
  }
});

it('tout le décor en un ou deux appels de dessin, en moins de triangles que ses cubes', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const { maillage, elements, sol } = monde(a);
    const cout = coutDuDecor(maillage);
    expect(cout.drawCalls, a).toBeGreaterThanOrEqual(1);
    expect(cout.drawCalls, a).toBeLessThanOrEqual(2);
    const cubes = elements.flatMap((e) => e.cubes);
    const avant = faceCount(buildMesh(cubes, sol)) * 2;
    expect(cout.triangles, a).toBeLessThan(avant);
    expect(cout.triangles, a).toBeLessThanOrEqual(15_000);
    // Des couleurs finies, dans l'espace linéaire.
    for (const f of [maillage.decor, maillage.lueurs]) {
      expect(f.positions.length).toBe(f.elements.length * 9);
      for (const v of f.colors) expect(v >= 0 && v <= 1).toBe(true);
      for (const v of f.positions) expect(Number.isFinite(v)).toBe(true);
    }
  }
  // Ce qui brille : les lanternes et la lave des repères.
  expect(monde('4e').maillage.lueurs.elements.length).toBeGreaterThan(0);
  expect(monde('5e').maillage.lueurs.elements.length).toBe(0);
}, 30_000);

it('le décor d’une île fermée est délavé, le même d’un rendu à l’autre', () => {
  const ferme = ranger('6e', true);
  const ouvert = monde('6e');
  const cle = (e: ElementDeDecor) => e.id;
  const i = ferme.elements.findIndex((e) => e.muted && e.genre === 'arbre');
  expect(i).toBeGreaterThanOrEqual(0);
  const j = ouvert.elements.findIndex((e) => cle(e) === cle(ferme.elements[i]));
  const couleur = (m: typeof ferme.maillage, k: number) => {
    const t = m.decor.elements.indexOf(k);
    return [m.decor.colors[t * 9], m.decor.colors[t * 9 + 1], m.decor.colors[t * 9 + 2]];
  };
  const [r1, g1, b1] = couleur(ferme.maillage, i);
  const [r2, g2, b2] = couleur(ouvert.maillage, j);
  // Délavé : moins saturé (le vert ne domine plus autant).
  expect(g1 - Math.min(r1, b1)).toBeLessThan(g2 - Math.min(r2, b2));
  // Le même d'un rendu à l'autre.
  const again = maillageDuDecor('6e', ouvert.champ, ouvert.elements);
  expect(again.decor.positions).toEqual(ouvert.maillage.decor.positions);
  expect(again.decor.colors).toEqual(ouvert.maillage.decor.colors);
});

it('toucher le décor, c’est toucher la case où il pousse ; toucher le sol libéré, c’est toucher sa case', () => {
  const { champ, elements, maillage } = monde('6e');
  const i = elements.findIndex((e) => e.genre === 'arbre' && colonneEn(champ, e.x, e.y));
  const e = elements[i];
  const t = maillage.decor.elements.indexOf(i);
  const col = colonneEn(champ, e.x, e.y)!;
  expect(caseDuDecor(champ, maillage, false, t)).toEqual({ cell: { x: e.x, y: e.y, z: col.haut }, next: { x: e.x, y: e.y, z: col.haut + 1 } });
  // Au large, un écueil renvoie la case de l'eau.
  const k = elements.findIndex((q) => q.genre === 'ecueil');
  const u = caseDuDecor(champ, maillage, false, maillage.decor.elements.indexOf(k))!;
  expect(u.cell).toEqual({ x: elements[k].x, y: elements[k].y, z: elements[k].z - 1 });
  // Le sol sous le décor, touché sur sa pente, redonne sa case (pickCell) : toutes les cases libérées.
  for (const q of elements) {
    const c = colonneEn(champ, q.x, q.y);
    if (!c || c.fixe) continue;
    const h = hauteurDuSol(champ, q.x + 0.3, q.y + 0.6)!;
    const picked = pickCell(champ, { x: q.x + 0.3, y: h, z: q.y + 0.6 }, { x: 0, y: 1, z: 0 });
    expect(picked?.cell, q.id).toEqual({ x: q.x, y: q.y, z: c.haut });
  }
});

it('on marche sur le sol libéré : les pieds suivent la pente sous une fleur, jamais dedans ni au-dessus', () => {
  const { champ, elements } = monde('6e');
  // (Loin du rivage : au bord de l'eau, la côte descend plus d'un bloc sous l'itinéraire, qui garde alors sa hauteur.)
  const fleurs = elements.filter((e) => {
    const col = e.genre === 'fleur' ? colonneEn(champ, e.x, e.y) : undefined;
    return col && !col.fixe && !col.rivage.some(Boolean);
  });
  expect(fleurs.length).toBeGreaterThan(3);
  let pente = 0;
  for (const f of fleurs) {
    const col = colonneEn(champ, f.x, f.y)!;
    // L'itinéraire du bonhomme passe à la hauteur des cubes (le haut de la colonne + 1) ; ses pieds, sur la facette.
    for (const [u, v] of [
      [0.5, 0.5],
      [0.4, 0.6],
    ]) {
      const s = hauteurDuSol(champ, f.x + u, f.y + v)!;
      expect(piedsSur(champ, f.x + u, f.y + v, col.haut + 1)).toBeCloseTo(s, 5);
    }
    if (Math.max(...col.coins) - Math.min(...col.coins) > 0.2) pente++;
  }
  expect(pente).toBeGreaterThan(0);
});

it('sans le drapeau, rien ne change : le monde en cubes garde tout son décor', () => {
  // La vue 3D en blocs et la 2D lisent les cubes de worldCubes, que le rangement ne touche pas.
  const { cubes } = monde('6e');
  const copie: VoxelCube[] = cubes.map((c) => ({ ...c }));
  rangerLeDecor(cubes.filter((c) => !c.sol));
  expect(cubes).toEqual(copie);
});
