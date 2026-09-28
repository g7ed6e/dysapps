// Les Îles du Ciel (R4b-3e) : le grand phare sur son socle de salles, le massif enneigé, les nappes des sommets et
// l'oiseau planeur (design/archipeo/intentions/3e-iles-du-ciel.md).
import { BRIDGES } from '../archipelago';
import { archipelagoOfIsland } from '../archipels';
import { toutConstruit } from '../budget';
import { maillageDuDecor, rangerLeDecor } from '../decorMesh';
import { oiseauxDe, PLANEUR, planeurDe, poseDuPlaneur } from '../faune';
import { champDuSol } from '../landMesh';
import { inCore, islandDef, landCells, mapOf } from '../map';
import { ambianceDe } from '../palette';
import { bridgePath, worldBounds, worldCubes } from '../terrain';
import { empriseDuSocle, LOINTAIN_3E, SOCLE_3E } from './3e';
import { nappesDesSommets, NAPPES_3E } from './brume';
import { MOUVEMENT_DE_LA_BRUME } from './fumee';
import type { RangDeCretes } from './lointain';
import { PHARE, PHARES } from './phare';

const { progress, village } = toutConstruit();
const cubes = worldCubes('3e', progress, village, false);
const sol = cubes.filter((c) => c.sol);
const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
const champ = champDuSol('3e', sol, reste);
const m = maillageDuDecor('3e', champ, elements);
const i = elements.findIndex((e) => e.genre === 'grand-phare');
const phare = elements[i];

/** Les triangles du grand phare : trois sommets (x, y, z) chacun. */
function triangles(f: { elements: ArrayLike<number>; positions: ArrayLike<number> }): [number, number, number][][] {
  const out: [number, number, number][][] = [];
  for (let t = 0; t < f.elements.length; t++)
    if (f.elements[t] === i) out.push([0, 1, 2].map((k) => [f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]] as [number, number, number]));
  return out;
}

it('le socle de 3 × 3 couvre les cases du phare de Blocland, jamais une case du cœur, d’un ouvrage ou de ce qui est posé', () => {
  expect(SOCLE_3E.cote).toBe(PHARES['3e'].emprise);
  const { x0, y0 } = empriseDuSocle(phare);
  const bloquees = new Set(phare.cubes.map((c) => `${c.x},${c.y}`));
  const socle: string[] = [];
  for (let dx = 0; dx < SOCLE_3E.cote; dx++) for (let dy = 0; dy < SOCLE_3E.cote; dy++) socle.push(`${x0 + dx},${y0 + dy}`);
  // Règle 1 du directeur artistique : toutes les cases bloquées sont sous le socle.
  for (const k of bloquees) expect(socle, k).toContain(k);
  const def = islandDef('phare');
  const chemins = new Set(BRIDGES.filter((b) => archipelagoOfIsland(b.from) === '3e').flatMap((b) => bridgePath(b).map((c) => `${c.x},${c.y}`)));
  const posees = new Set(reste.filter((c) => !c.decor).map((c) => `${c.x},${c.y}`));
  for (const k of socle) {
    const [x, y] = k.split(',').map(Number);
    expect(inCore(def, x, y), k).toBe(false);
    expect(chemins.has(k), k).toBe(false);
    if (!bloquees.has(k)) expect(posees.has(k), k).toBe(false);
  }
  // Le socle couvre bien ses 3 × 3 cases (au milieu de chacune, un triangle de pierre au-dessus).
  const tris = triangles(m.decor);
  const couvre = (x: number, z: number) =>
    tris.some(([a, b, c]) => {
      const s = (p: number[], q: number[], r: number[]) => (p[0] - r[0]) * (q[2] - r[2]) - (q[0] - r[0]) * (p[2] - r[2]);
      const d = [s([x, 0, z], a, b), s([x, 0, z], b, c), s([x, 0, z], c, a)];
      return !(d.some((v) => v < 0) && d.some((v) => v > 0));
    });
  for (const k of socle) {
    const [x, y] = k.split(',').map(Number);
    expect(couvre(x + 0.5, y + 0.5), k).toBe(true);
  }
});

it('le grand phare : le modèle de référence à H = 11 sur un socle de 3 cases de haut, sa lanterne le point le plus haut de l’archipel', () => {
  const pts = triangles(m.decor).flat();
  const haut = Math.max(...pts.map((p) => p[1]));
  const socle = phare.z + SOCLE_3E.bas + SOCLE_3E.haut;
  expect(haut).toBeCloseTo(socle + PHARES['3e'].H, 5);
  // La lanterne, dans les lueurs, sous le toit.
  const lueurs = triangles(m.lueurs).flat();
  expect(lueurs.length).toBeGreaterThan(0);
  expect(Math.max(...lueurs.map((p) => p[1]))).toBeCloseTo(socle + PHARE.lanterne.haut * PHARES['3e'].H, 5);
  // Rien d'autre du décor de l'archipel n'est plus haut (le lointain est loin derrière et plus bas).
  let ailleurs = -Infinity;
  for (let t = 0; t < m.decor.elements.length; t++) if (m.decor.elements[t] >= 0 && m.decor.elements[t] !== i) for (let k = 0; k < 3; k++) ailleurs = Math.max(ailleurs, m.decor.positions[t * 9 + k * 3 + 1]);
  expect(ailleurs).toBeLessThan(haut);
});

it('le massif enneigé : continu, 1,2 fois plus large que l’arc des îles, de 80 à 150 cases derrière, de 20 à 30 blocs, neige franche au-dessus de 55 %', () => {
  const rangs = LOINTAIN_3E.pieces.filter((p): p is RangDeCretes => p.genre === 'cretes');
  expect(rangs.length).toBe(LOINTAIN_3E.pieces.length);
  expect(Math.max(...rangs.map((r) => r.a - r.u))).toBeGreaterThanOrEqual(1.2);
  for (const r of rangs) {
    expect(r.recul).toBeGreaterThanOrEqual(80);
    expect(r.recul).toBeLessThanOrEqual(150);
    expect(r.haut).toBeGreaterThanOrEqual(20);
    expect(r.haut).toBeLessThanOrEqual(30);
    expect(r.neige).toBe(0.55);
    expect(r.neigeFranche).toBe(true);
  }
  // Le premier rang, le plus proche, est aussi le plus bas : le second fait l'épaisseur de la chaîne.
  expect(rangs[0].recul).toBeLessThan(rangs[1].recul);
});

it('les nappes des sommets : une seule couche plate sous chaque île, sous son sol, environ 300 triangles, qui s’efface vers ses bords', () => {
  const n = nappesDesSommets('3e')!;
  expect(n.indices.length / 3).toBeLessThanOrEqual(320);
  const hauteurs = new Set<number>();
  for (let v = 0; v < n.positions.length / 3; v++) {
    hauteurs.add(n.positions[v * 3 + 1]);
    expect(n.colors[v * 4 + 3]).toBeLessThanOrEqual(NAPPES_3E.opacite);
  }
  // Une seule hauteur pour toutes (l'altitude des îles, 1,5 bloc plus bas) : jamais des couches étagées.
  expect(hauteurs.size).toBe(1);
  expect([...hauteurs][0]).toBeLessThan(Math.min(...mapOf('3e').map((d) => d.altitude)));
  // Au plus 0,6 d'opacité, respiration comprise, et un bord qui s'efface tout à fait.
  expect(NAPPES_3E.opacite * (1 + MOUVEMENT_DE_LA_BRUME.opacite)).toBeLessThanOrEqual(0.6);
  expect(Math.min(...Array.from({ length: n.positions.length / 3 }, (_, v) => n.colors[v * 4 + 3]))).toBe(0);
  expect(nappesDesSommets('5e')).toBeNull();
});

it('l’oiseau planeur : un seul, au-dessus du massif, jamais au-dessus d’une île ni devant la lanterne, plus haut que les autres oiseaux ; figé si l’appareil le demande', () => {
  const b = worldBounds('3e');
  const r = planeurDe('3e', b)!;
  expect(planeurDe('6e', worldBounds('6e'))).toBeNull();
  // Au-dessus du premier rang du massif, derrière toutes les îles.
  const massif = LOINTAIN_3E.pieces[0] as RangDeCretes;
  const terres = mapOf('3e').flatMap((d) => landCells(d));
  const plusAuNord = Math.max(...terres.map((c) => c.y));
  const lanterne = { x: phare.x + 1, z: phare.y + 1 };
  const massifX = [b.minX + massif.u * (b.maxX - b.minX), b.minX + massif.a * (b.maxX - b.minX)];
  for (let t = 0; t < PLANEUR.periode; t += 0.5) {
    const p = poseDuPlaneur(r, t, false);
    expect(p.z - plusAuNord).toBeGreaterThan(60);
    expect(Math.abs(p.z - (b.maxY + massif.recul))).toBeLessThanOrEqual(massif.epaisseur / 2 + PLANEUR.rayon);
    expect(p.x).toBeGreaterThan(massifX[0]);
    expect(p.x).toBeLessThan(massifX[1]);
    // Au-dessus des cimes du premier rang, jamais dans l'axe de la lanterne (vue de la caméra, qui regarde au nord).
    expect(p.y).toBeGreaterThan(massif.haut);
    expect(Math.abs(p.x - lanterne.x)).toBeGreaterThan(PLANEUR.envergure * 4);
  }
  // Plus haut que les autres oiseaux (leur altitude, plus 3 et la houle de leur vol).
  expect(r.y).toBeGreaterThan(oiseauxDe('3e').altitude + 3 + 0.6);
  // Un tour en 24 s au moins, à vitesse constante ; figé d'un coup si l'appareil demande moins d'animations.
  expect(PLANEUR.periode).toBeGreaterThanOrEqual(24);
  const pas = (t: number) => {
    const [p, q] = [poseDuPlaneur(r, t, false), poseDuPlaneur(r, t + 0.1, false)];
    return Math.hypot(q.x - p.x, q.z - p.z);
  };
  expect(pas(1)).toBeCloseTo(pas(13), 6);
  expect(poseDuPlaneur(r, 3, true)).toEqual(poseDuPlaneur(r, 11, true));
  expect(poseDuPlaneur(r, 0, false).echelle * 1.6).toBeCloseTo(PLANEUR.envergure, 5);
});

it('l’ambiance du 3e : un bleu franc, le plancher de nuages d’un blanc bleuté', () => {
  const a = ambianceDe('3e');
  const teinte = (c: number) => {
    const [r, g, bl] = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => v / 255);
    const max = Math.max(r, g, bl);
    const d = max - Math.min(r, g, bl);
    const h = max === r ? ((g - bl) / d) % 6 : max === g ? (bl - r) / d + 2 : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };
  // L'horizon et le voile entre 195° et 215° (plus de lavande).
  for (const c of [a.jour.horizon, a.voile[0]]) {
    expect(teinte(c)).toBeGreaterThanOrEqual(195);
    expect(teinte(c)).toBeLessThanOrEqual(215);
  }
  expect(a.jour.mer).toBe(0xdde3e8);
  expect(a.teinteDeMer).toBe(0xdde3e8);
});
