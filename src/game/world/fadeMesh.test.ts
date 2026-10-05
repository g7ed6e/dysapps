// Le fondu de la pose (GD-6, Archipéo, choix « 2c » du mainteneur, 4 octobre 2026) : la pierre des ruines au départ, la
// couleur du plan à la fin, une sortie douce entre les deux, au rythme de la vague ; des cubes pleins, sans trou.
import type { VoxelCube } from './cube';
import { SANS_BISEAU } from './construction';
import { couleurDuFondu, couleursDuPlan, maillageDuFondu } from './fadeMesh';
import { lineaire } from './landMesh';
import { couleurDeMatiere } from './palette';
import { FONDU, VAGUE, avanceeDuFondu, planDeLaVague } from './wave';

// Deux couches de deux cubes, l'un sur l'autre : une petite partie.
const partie = [0, 1].flatMap((x) => [0, 1].map((z) => ({ x, y: 0, z, color: '#8a6', texture: 'planches' }))) as VoxelCube[];
const plan = planDeLaVague(partie);
const f = maillageDuFondu('6e', partie, plan);
const pierre = [0x7d, 0x8a, 0x86].map((v) => lineaire(v / 255));

it('part de la pierre des ruines #7D8A86, opaque, sans biseau ni motif ni vitre', () => {
  expect(FONDU.pierre).toBe(0x7d8a86);
  expect(FONDU.dureeMs).toBe(360);
  const n = f.rangDuSommet.length;
  expect(n).toBeGreaterThan(0);
  for (let s = 0; s < n; s++) for (let k = 0; k < 3; k++) expect(f.depart[3 * s + k]).toBeCloseTo(pierre[k], 6);
  expect(Array.from(f.maillage.opaque.colors)).toEqual(Array.from(f.depart));
  expect(f.maillage.opaque.biseaux.every((b) => b === SANS_BISEAU)).toBe(true);
  expect(f.maillage.opaque.motifs.every((m) => m === 0)).toBe(true);
  expect(f.maillage.fenetres.indices.length + f.maillage.fantomes.indices.length).toBe(0);
});

it('va à la couleur du plan : le dessus au dessus, les côtés aux côtés', () => {
  const { dessus, cote } = couleurDeMatiere('6e', 'planches');
  expect(couleursDuPlan('6e', partie[0])).toEqual({ dessus, cote });
  const lin = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => lineaire(v / 255));
  for (let s = 0; s < f.rangDuSommet.length; s++) {
    const haut = f.maillage.opaque.normals[3 * s + 1] === 1;
    expect(Array.from(f.arrivee.subarray(3 * s, 3 * s + 3))).toEqual(lin(haut ? dessus : cote).map((v) => Math.fround(v)));
  }
});

it('des cubes pleins vus du dehors : ni face collée entre deux cases de la partie, ni dessous', () => {
  const { positions, normals, indices } = f.maillage.opaque;
  // 2 × 2 cubes : 4 côtés de 2 × 2 faces, et 2 dessus.
  expect(indices.length / 6).toBe(4 * 2 + 2 + 4);
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t], indices[t + 1], indices[t + 2]].map((i) => [positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]]);
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const n = [normals[3 * indices[t]], normals[3 * indices[t] + 1], normals[3 * indices[t] + 2]];
    // Le sens direct (Three.js) : la face regarde du côté de sa normale ; jamais vers le bas.
    expect(cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2]).toBeGreaterThan(0);
    expect(n[1]).not.toBe(-1);
  }
});

it('chaque cube passe à son départ, en 360 ms, d’une sortie douce qui ne dépasse jamais la couleur du plan', () => {
  const d = plan.departs[0];
  expect(d).toBe(VAGUE.attenteMs);
  expect(avanceeDuFondu(plan, 0, 0)).toBe(0);
  expect(avanceeDuFondu(plan, 0, d)).toBe(0);
  // À mi-chemin du passage, plus de la moitié faite (la sortie douce) ; jamais au-delà de 1.
  const mi = avanceeDuFondu(plan, 0, d + FONDU.dureeMs / 2);
  expect(mi).toBeGreaterThan(0.5);
  expect(mi).toBeLessThan(1);
  expect(avanceeDuFondu(plan, 0, d + FONDU.dureeMs)).toBe(1);
  expect(avanceeDuFondu(plan, 0, d + 10 * FONDU.dureeMs)).toBe(1);
  let avant = 0;
  for (let ms = d; ms <= d + FONDU.dureeMs; ms += 10) {
    const t = avanceeDuFondu(plan, 0, ms);
    expect(t).toBeGreaterThanOrEqual(avant);
    expect(t).toBeLessThanOrEqual(1);
    avant = t;
  }
  // Le dernier cube passe le dernier : sa couche finit avec lui, et le carillon vient après.
  const dernier = plan.ordre.length - 1;
  expect(avanceeDuFondu(plan, dernier, plan.couches[plan.couches.length - 1] - 1)).toBeLessThan(1);
  expect(avanceeDuFondu(plan, dernier, plan.finMs)).toBe(1);
});

it('la couleur d’un sommet : la pierre au départ, le mélange à mi-chemin, le plan à la fin', () => {
  const sortie = [0, 0, 0];
  couleurDuFondu(f, 0, 0, sortie, 0);
  sortie.forEach((v, k) => expect(v).toBeCloseTo(f.depart[k], 6));
  couleurDuFondu(f, 0, 0.5, sortie, 0);
  sortie.forEach((v, k) => expect(v).toBeCloseTo((f.depart[k] + f.arrivee[k]) / 2, 6));
  couleurDuFondu(f, 0, 1, sortie, 0);
  sortie.forEach((v, k) => expect(v).toBeCloseTo(f.arrivee[k], 6));
});
