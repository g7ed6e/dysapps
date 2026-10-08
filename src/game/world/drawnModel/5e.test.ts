// Le relief des Îles Brumeuses (R4b-5e) : des crêtes en gradins sur l'anneau du fond, loin du cœur, des ouvrages et de
// ce qui est posé ; le Marché et le Marais restent bas.
import { toutConstruit } from '../budget';
import { BRIDGES } from '../archipelago';
import { archipelagoOfIsland } from '../archipelagos';
import { rangerLeDecor } from '../decorMesh';
import { champDuSol } from '../landMesh';
import { CORE } from '../map';
import { bridgePath, origineDe, worldCubes } from '../terrain';
import { modelerLeSol } from '.';
import { CRETES_5E, ROCHE_NUE } from './5e';
import type { BiomeId } from '../../biomes';
import { couleurDuSol } from '../palette';

const { progress, world: village } = toutConstruit();
const cubes = worldCubes('5e', progress, village, false);
const sol = cubes.filter((c) => c.sol);
const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
const avant = champDuSol('5e', sol, reste);
const apres = champDuSol('5e', modelerLeSol('5e', sol, reste), reste);
const cle = (x: number, y: number) => (x + 16384) * 32768 + (y + 16384);
const montee = (x: number, y: number) => {
  const i = avant.index.get(cle(x, y));
  return i === undefined ? 0 : apres.colonnes[i].haut - avant.colonnes[i].haut;
};

it('les crêtes montent au fond du Glacier, du Carrefour, du Comptoir, du Manoir et du Relais ; le Marché et le Marais restent bas', () => {
  const max: Record<string, number> = {};
  for (const c of avant.colonnes) max[c.ile!] = Math.max(max[c.ile!] ?? 0, montee(c.x, c.y));
  expect(max['maths-5e-proportionality']).toBe(0);
  expect(max['french-5e-conjugation']).toBe(0);
  // Le Manoir et le Relais : depuis que les îles ont grandi (GD-11, 8 octobre 2026), leur côte du fond est amincie et des
  // liaisons la longent : leurs crêtes montent de 4 et de 3 (point ouvert pour l'artiste technique 3D, Archipéo en pause).
  const auMoins: Record<string, number> = { 'english-5e-grammar': 4, 'lv2-5e-introductions': 3 };
  for (const id of ['maths-5e-signed-numbers', 'french-5e-homophones', 'english-5e-vocabulary', 'english-5e-grammar', 'lv2-5e-introductions']) expect(max[id], id).toBeGreaterThanOrEqual(auMoins[id] ?? 5);
  expect(max['maths-5e-signed-numbers']).toBeGreaterThanOrEqual(max['french-5e-homophones']);
});

it('ni le cœur, ni la première rangée du fond, ni les abords d’un ouvrage, ni ce qui est posé ne bougent ; rien ne descend', () => {
  const chemins = BRIDGES.filter((b) => archipelagoOfIsland(b.from) === '5e').flatMap((b) => bridgePath(b, []));
  const posees = new Set(reste.map((c) => `${c.x},${c.y}`));
  for (const c of avant.colonnes) {
    const d = montee(c.x, c.y);
    expect(d).toBeGreaterThanOrEqual(0);
    if (!d) continue;
    const o = origineDe(c.ile as BiomeId);
    expect(c.y - o.y, `${c.ile} ${c.x},${c.y}`).toBeGreaterThan(CORE);
    expect(chemins.some((p) => Math.abs(p.x - c.x) <= 3 && Math.abs(p.y - c.y) <= 3), `${c.x},${c.y}`).toBe(false);
    expect(posees.has(`${c.x},${c.y}`)).toBe(false);
  }
  // Une borne ou un plan n'est jamais au pied d'un gradin : aucune colonne posée n'a de voisine montée de 2 blocs ou plus.
  for (const k of posees) {
    const [x, y] = k.split(',').map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) expect(montee(x + dx, y + dy), k).toBeLessThan(2);
  }
});

it('le Glacier (revue d’ensemble, DA-3) : des gradins de roche nue, dessus et flancs ; aucun sol blanc sous la calotte', () => {
  const o = origineDe('maths-5e-signed-numbers');
  const modele = modelerLeSol('5e', sol, reste).filter((c) => c.tag === 'maths-5e-signed-numbers');
  const colonnes = new Map<string, typeof modele>();
  for (const c of modele) {
    const k = `${c.x},${c.y}`;
    const l = colonnes.get(k);
    if (l) l.push(c);
    else colonnes.set(k, [c]);
  }
  let gradins = 0;
  for (const [k, l] of colonnes) {
    const top = l.reduce((p, q) => (q.z > p.z ? q : p));
    // La neige du sol (« nuage » dans le monde en blocs) ne reste jamais blanche.
    expect(top.texture, k).not.toBe('nuage');
    const [x, y] = k.split(',').map(Number);
    const d = montee(x, y);
    if (d <= 0) continue;
    gradins++;
    expect(top.texture, k).toBe(ROCHE_NUE);
    // Les cubes ajoutés sous le dessus (les flancs du gradin) sont de roche nue aussi.
    for (const c of l) if (c !== top && c.z > top.z - d) expect(c.texture, `${k},${c.z}`).toBe(ROCHE_NUE);
  }
  expect(gradins).toBeGreaterThan(10);
  // Le plus haut pic du Glacier est au fond, à gauche de l'île (celui de 11), et il garde au moins 10 blocs.
  const pic = [...colonnes.values()].map((l) => l.reduce((p, q) => (q.z > p.z ? q : p))).reduce((p, q) => (q.z > p.z ? q : p));
  expect(pic.z - o.z).toBeGreaterThanOrEqual(10);
  expect(pic.x - o.x).toBeLessThan(CRETES_5E['maths-5e-signed-numbers']![1].x);
});

it('le Glacier (DA-3) : des masses cassées, en marches de 2 à 3 blocs, dont le bord change d’une rangée à l’autre', () => {
  const o = origineDe('maths-5e-signed-numbers');
  const haut = (x: number, y: number) => {
    const i = apres.index.get(cle(x, y));
    return i === undefined ? null : apres.colonnes[i].haut;
  };
  // D'une case montée à sa voisine le long de x : des marches de 2 ou 3 blocs (le relief de marche et le sommet, qui
  // s'arrondit, en font d'autres).
  const marches = new Map<number, number>();
  for (const c of apres.colonnes) {
    if (c.ile !== 'maths-5e-signed-numbers' || !montee(c.x, c.y)) continue;
    const v = haut(c.x + 1, c.y);
    if (v === null || !montee(c.x + 1, c.y)) continue;
    const m = Math.abs(v - c.haut);
    marches.set(m, (marches.get(m) ?? 0) + 1);
  }
  expect((marches.get(2) ?? 0) + (marches.get(3) ?? 0)).toBeGreaterThan(0);
  // Le bord des gradins n'est pas le même d'une rangée à l'autre : les deux premières rangées du fond diffèrent.
  const rangee = (y: number) => Array.from({ length: 24 }, (_, x) => haut(o.x + x, o.y + y)).join(',');
  expect(rangee(CORE + 3)).not.toBe(rangee(CORE + 4));
});

it('les crêtes du Carrefour, du Manoir et du Comptoir (revue d’ensemble, DA-3 bis) : la roche du 5e, distincte de l’herbe et de la neige', () => {
  const modele = modelerLeSol('5e', sol, reste);
  let rocheuses = 0;
  for (const id of ['french-5e-homophones', 'english-5e-grammar', 'english-5e-vocabulary']) {
    const tops = new Map<string, (typeof modele)[number]>();
    for (const c of modele) if (c.tag === id) {
      const k = `${c.x},${c.y}`;
      const t = tops.get(k);
      if (!t || c.z > t.z) tops.set(k, c);
    }
    for (const [k, top] of tops) {
      const [x, y] = k.split(',').map(Number);
      if (montee(x, y) >= 3) {
        rocheuses++;
        expect(top.texture, `${id} ${k}`).toBe(ROCHE_NUE);
      }
    }
  }
  expect(rocheuses).toBeGreaterThan(10);
  // La roche se lit contre l'herbe et contre la neige du sol par sa clarté (rapport de luminance relative, comme un
  // contraste WCAG) : de jour, au moins 1,4 sur le dessus, ce que regarde la caméra, et 1,2 sur le côté ; de nuit,
  // quand tout se resserre, au moins 1,2 sur le dessus. Sa teinte (gris bleu) l'écarte en plus de l'herbe (vert olive).
  const lum = (h: number) => {
    const f = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f((h >> 16) & 255) + 0.7152 * f((h >> 8) & 255) + 0.0722 * f(h & 255);
  };
  const ecart = (a: number, b: number) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  for (const [jour, dessus, cote] of [[1, 1.4, 1.2], [0, 1.2, 1.1]]) {
    const roche = couleurDuSol('5e', 'roche', jour);
    for (const autre of ['herbe', 'neige'] as const) {
      const c = couleurDuSol('5e', autre, jour);
      expect(ecart(roche.dessus, c.dessus), `${autre} dessus ${jour}`).toBeGreaterThanOrEqual(dessus);
      expect(ecart(roche.cote, c.cote), `${autre} côté ${jour}`).toBeGreaterThanOrEqual(cote);
    }
  }
});
