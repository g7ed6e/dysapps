import type { VoxelCube } from '../Voxel';
import { BIOMES, BLOCKS } from '../biomes';
import { buildingStages } from './architect';
import { enveloppeDe, toutConstruit } from './budget';
import {
  ALLUMAGE,
  caseDeLaConstruction,
  coutDeLaConstruction,
  DECALAGE_MAX,
  ECLAT_GLSL,
  eclatDeFenetre,
  eclatDuBiseau,
  ECART_SOMBRE,
  fenetresDe,
  LANTERNES_ALLUMEES,
  formeDuPilier,
  piliersDe,
  signatureDeLaConstruction,
  FENETRES_ALLUMEES,
  genresDesBlocs,
  maillageDeLaConstruction,
  opaciteDesFantomes,
  PLEINE_NUIT,
  SANS_BISEAU,
  TEINTE,
  TEINTE_GLSL,
  teinteDeCase,
  type GroupeDeConstruction,
  type OptionsDeLaConstruction,
} from './construction';
import { rangerLeDecor } from './decorMesh';
import { champDuSol, poseDuDecor } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import { buildMesh, faceCount } from './mesher';
import { plansFor } from './plans';
import { worldCubes } from './terrain';
import { ARDOISES, couleursDuToit, TERRE_CUITE_SUR, toitDe } from './toits';
import { BRIDGES } from './archipelago';

type Etat = 'tout' | 'chantier' | 'dernier';

/** Un archipel rangé comme le rend la vue 3D d'Archipéo : les cubes restés en cubes, posés, et le sol. */
const mondes = new Map<string, { cubes: VoxelCube[]; sol: VoxelCube[] }>();
function monde(a: ArchipelagoId, etat: Etat = 'tout') {
  const k = `${a}|${etat}`;
  let m = mondes.get(k);
  if (m) return m;
  const { progress, village } = toutConstruit();
  const plans: Record<string, string[]> = etat === 'chantier' ? {} : { ...village.plans };
  // « dernier » : tout est posé sauf le dernier plan de chaque île, en fantômes.
  if (etat === 'dernier')
    for (const b of BIOMES) {
      const l = plansFor(b.id);
      if (l.length) delete plans[l[l.length - 1].id];
    }
  const tous = worldCubes(a, progress, { ...village, plans }, false);
  const sol = tous.filter((c) => c.sol);
  const { reste } = rangerLeDecor(tous.filter((c) => !c.sol));
  m = { cubes: poseDuDecor(champDuSol(a, sol, reste), reste), sol };
  mondes.set(k, m);
  return m;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

const interieur = (p: number[][], k: number) => 0.4713 * p[0][k] + 0.3261 * p[1][k] + 0.2026 * p[2][k];

/** Les triangles d'un groupe : sommets (repère Three), centre, normale géométrique (unitaire) et aire. */
function triangles(g: GroupeDeConstruction) {
  const out: { p: number[][]; centre: { x: number; y: number; z: number }; n: { x: number; y: number; z: number }; aire: number }[] = [];
  for (let t = 0; t < g.indices.length / 3; t++) {
    const p = [0, 1, 2].map((k) => {
      const v = g.indices[t * 3 + k];
      return [g.positions[v * 3], g.positions[v * 3 + 1], g.positions[v * 3 + 2]];
    });
    const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
    const w = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
    const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const len = Math.hypot(cr[0], cr[1], cr[2]);
    out.push({
      p,
      // Un point à l'intérieur du triangle, jamais sur une ligne entière de la grille (le centre d'un rectangle fusionné peut l'être).
      centre: { x: interieur(p, 0), y: interieur(p, 1), z: interieur(p, 2) },
      n: { x: cr[0] / len, y: cr[1] / len, z: cr[2] / len },
      aire: len / 2,
    });
  }
  return out;
}

/** Le bloc plein qui contient un point (repère Three), s'il y en a un : sur la grille ou descendu d'une fraction. */
function blocEn(cubes: VoxelCube[]) {
  const colonnes = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    const k = `${c.x},${c.y}`;
    const l = colonnes.get(k);
    if (l) l.push(c);
    else colonnes.set(k, [c]);
  }
  return (p: { x: number; y: number; z: number }) =>
    colonnes.get(`${Math.floor(p.x)},${Math.floor(p.z)}`)?.find((c) => p.y >= c.z && p.y <= c.z + 1);
}
const surLaGrille = (c: VoxelCube) => Number.isInteger(c.z);
const decale = (p: { x: number; y: number; z: number }, n: { x: number; y: number; z: number }, k: number) => ({ x: p.x + n.x * k, y: p.y + n.y * k, z: p.z + n.z * k });

/** Une lanterne : un corps de 0,3 case sans dessous (cinq faces), un cœur de 0,18 case sans dessous. */
const AIRE_DE_LANTERNE = 5 * 0.3 * 0.3 + 5 * 0.18 * 0.18;

/** Les blocs pleins (sans fantômes ni bornes) et les lanternes, qui ne remplissent plus leur case. */
function rangerLesLanternes(cubes: VoxelCube[]) {
  const genres = genresDesBlocs(cubes.filter((c) => !c.quest));
  const lanternes = new Map<string, VoxelCube>();
  for (const [c, g] of genres) if (g === 'lanterne') lanternes.set(cle(c.x, c.y, c.z), c);
  return { pleins: cubes.filter((c) => !c.ghost && !c.quest && genres.get(c) !== 'lanterne'), lanternes };
}

/** Un triangle d'une lanterne : le toucher retrouve la case de la lanterne. */
function dansUneLanterne(lanternes: Map<string, VoxelCube>, t: { centre: { x: number; y: number; z: number }; n: { x: number; y: number; z: number } }) {
  const { cell } = caseDeLaConstruction(t.centre, t.n);
  const k = cle(cell.x, cell.y, cell.z);
  if (!lanternes.has(k)) return false;
  // Rien ne sort de la case.
  expect(t.centre.x - cell.x).toBeGreaterThan(0.3);
  expect(t.centre.x - cell.x).toBeLessThan(0.7);
  expect(t.centre.y - cell.z).toBeLessThan(0.5);
  return true;
}

/** La normale du sommet d'un triangle suit bien sa facette (le sens des sommets est le bon : face avant vers l'extérieur). */
function sensJuste(g: GroupeDeConstruction): boolean {
  return triangles(g).every((t, i) => {
    const v = g.indices[i * 3];
    return t.n.x * g.normals[v * 3] + t.n.y * g.normals[v * 3 + 1] + t.n.z * g.normals[v * 3 + 2] > 0.99;
  });
}

describe('La construction taillée (lot R5)', () => {
  it('chaque archipel tout construit tient dans son enveloppe : 6 500 triangles et 3 appels de dessin, fantômes et fenêtres compris', () => {
    for (const a of ARCHIPELAGO_IDS) {
      for (const etat of ['tout', 'chantier', 'dernier'] as Etat[]) {
        const { cubes, sol } = monde(a, etat);
        const cout = coutDeLaConstruction(maillageDeLaConstruction(a, cubes, sol));
        expect(cout.triangles, `${a} ${etat}`).toBeLessThanOrEqual(enveloppeDe('construction', a).triangles);
        expect(cout.drawCalls, `${a} ${etat}`).toBeLessThanOrEqual(enveloppeDe('construction', a).drawCalls);
      }
      // Et bien moins que les cubes d'avant (bornes comprises, qui sortent vers leur poste).
      const { cubes, sol } = monde(a);
      expect(coutDeLaConstruction(maillageDeLaConstruction(a, cubes, sol)).triangles, a).toBeLessThan(faceCount(buildMesh(cubes, sol)) * 2 * 0.7);
    }
  }, 60_000);

  it('les faces cachées le restent : exactement les faces que montrait le monde en blocs (le verre, désormais sombre, cache ; une lanterne, plus petite, non)', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, sol } = monde(a);
      const { pleins, lanternes } = rangerLesLanternes(cubes);
      // Le monde en blocs, le verre compté comme un bloc plein, sans les lanternes ; puis les lanternes, corps et cœur.
      const attendu = faceCount(buildMesh(pleins.map((c) => (c.texture === 'verre' ? { ...c, texture: 'pierre' } : c)), sol)) + lanternes.size * AIRE_DE_LANTERNE;
      const occupe = new Set(pleins.map((c) => cle(c.x, c.y, c.z)));
      const bloc = blocEn(pleins);
      const sous = new Set(sol.map((c) => cle(c.x, c.y, c.z)));
      for (const mode of ['aucun', 'peint'] as const) {
        const m = maillageDeLaConstruction(a, cubes, sol, { biseau: mode });
        let aire = 0;
        for (const g of [m.opaque, m.fenetres]) {
          expect(sensJuste(g), `${a} ${mode}`).toBe(true);
          for (const t of triangles(g)) {
            aire += t.aire;
            if (dansUneLanterne(lanternes, t)) continue;
            // Chaque face couvre un bloc, et rien de plein devant elle.
            const c = bloc(decale(t.centre, t.n, -0.01));
            expect(c, `${a} ${mode} ${JSON.stringify(t.centre)}`).toBeDefined();
            expect(bloc(decale(t.centre, t.n, 0.01)), `${a} ${mode}`).toBeUndefined();
            if (!surLaGrille(c!)) continue;
            // Sur la grille, le toucher retrouve ce bloc, et la case devant est libre (le dessous posé sur le sol est caché).
            const { cell, next } = caseDeLaConstruction(t.centre, t.n);
            expect(cell, `${a} ${mode}`).toEqual({ x: c!.x, y: c!.y, z: c!.z });
            expect(occupe.has(cle(next.x, next.y, next.z)), `${a} ${mode}`).toBe(false);
            if (t.n.y < -0.5) expect(sous.has(cle(next.x, next.y, next.z))).toBe(false);
          }
        }
        expect(aire, `${a} ${mode}`).toBeCloseTo(attendu, 2);
      }
    }
  }, 60_000);

  it('le biseau taillé reste dans la case de son bloc : le toucher retrouve le bloc, et la case devant est libre', () => {
    const { cubes, sol } = monde('6e');
    const { pleins, lanternes } = rangerLesLanternes(cubes);
    const occupe = new Set(pleins.map((c) => cle(c.x, c.y, c.z)));
    const bloc = blocEn(pleins);
    const m = maillageDeLaConstruction('6e', cubes, sol, { biseau: 'taille' });
    expect(sensJuste(m.opaque)).toBe(true);
    let bandes = 0;
    for (const t of triangles(m.opaque)) {
      if (dansUneLanterne(lanternes, t)) continue;
      const c = bloc(decale(t.centre, t.n, -0.01));
      expect(c).toBeDefined();
      if (!surLaGrille(c!)) continue;
      const { cell, next } = caseDeLaConstruction(t.centre, t.n);
      expect(cell).toEqual({ x: c!.x, y: c!.y, z: c!.z });
      // Les bouts (de petits triangles contre un bloc sans biseau) regardent le bloc biseauté : on ne pose rien là.
      if (t.aire > 0.004) expect(occupe.has(cle(next.x, next.y, next.z))).toBe(false);
      if (Math.abs(t.n.x) > 0.1 && Math.abs(t.n.y) > 0.1) bandes++;
    }
    expect(bandes).toBeGreaterThan(0);
  });

  it('le biseau taillé ferme la surface : coins, bandes et bouts, sans trou (jonctions en T admises)', () => {
    const cube = (x: number, y: number, z: number, texture = 'pierre'): VoxelCube => ({ x, y, z, color: '#888888', texture });
    const formes: Record<string, VoxelCube[]> = {
      seul: [cube(0, 0, 0)],
      rangee: [cube(0, 0, 0), cube(1, 0, 0), cube(2, 0, 0, 'brique')],
      equerre: [cube(0, 0, 0), cube(1, 0, 0), cube(0, 1, 0), cube(0, 0, 1)],
      marches: [cube(0, 0, 0), cube(1, 0, 0), cube(1, 0, 1), cube(2, 0, 0), cube(2, 0, 1), cube(2, 0, 2)],
      diagonale: [cube(0, 0, 0), cube(1, 1, 0), cube(1, 0, 1)],
      // Un mur percé d'une fenêtre, un contrefort.
      mur: [0, 1, 2].flatMap((x) => [0, 1, 2].map((z) => cube(x, 0, z, x === 1 && z === 1 ? 'lanterne' : 'pierre'))).concat([cube(1, 1, 0)]),
    };
    for (const [nom, cubes] of Object.entries(formes))
      for (const fusion of [false, true]) {
        const m = maillageDeLaConstruction('6e', cubes, [], { biseau: 'taille', fusion });
        const segs: number[][][] = [];
        const somme = [0, 0, 0];
        for (const g of [m.opaque, m.fenetres])
          for (const t of triangles(g)) {
            for (let i = 0; i < 3; i++) segs.push([t.p[i], t.p[(i + 1) % 3]]);
            somme[0] += t.n.x * t.aire;
            somme[1] += t.n.y * t.aire;
            somme[2] += t.n.z * t.aire;
          }
        // Une surface fermée : la somme de ses normales pondérées par l'aire est nulle…
        for (const v of somme) expect(Math.abs(v), `${nom} ${fusion}`).toBeLessThan(1e-6);
        // … et chaque arête est recouverte par des arêtes de sens contraire, sur la même droite.
        for (const [a, b] of segs) {
          const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
          const L = Math.hypot(d[0], d[1], d[2]);
          const u = d.map((v) => v / L);
          const couvert: [number, number][] = [];
          for (const [c, e] of segs) {
            const f = [c[0] - e[0], c[1] - e[1], c[2] - e[2]];
            const Lf = Math.hypot(f[0], f[1], f[2]);
            if (Math.abs(f[0] / Lf - u[0]) + Math.abs(f[1] / Lf - u[1]) + Math.abs(f[2] / Lf - u[2]) > 1e-6) continue;
            const w = [e[0] - a[0], e[1] - a[1], e[2] - a[2]];
            const t = w[0] * u[0] + w[1] * u[1] + w[2] * u[2];
            if (Math.hypot(w[0] - t * u[0], w[1] - t * u[1], w[2] - t * u[2]) > 1e-4) continue;
            couvert.push([t, t + Lf]);
          }
          couvert.sort((x, y) => x[0] - y[0]);
          let r = 0;
          for (const [x, y] of couvert) if (x <= r + 1e-4) r = Math.max(r, y);
          expect(r, `${nom} ${fusion} ${JSON.stringify([a, b])}`).toBeGreaterThan(L - 1e-4);
        }
      }
  });

  it('un fantôme ne cache aucune face et garde toutes les siennes', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, sol } = monde(a, 'chantier');
      const fantomes = cubes.filter((c) => c.ghost);
      expect(fantomes.length, a).toBeGreaterThan(0);
      const avec = maillageDeLaConstruction(a, cubes, sol);
      const sans = maillageDeLaConstruction(
        a,
        cubes.filter((c) => !c.ghost),
        sol,
      );
      expect(avec.opaque, a).toEqual(sans.opaque);
      expect(avec.fenetres, a).toEqual(sans.fenetres);
      expect(sans.fantomes.indices.length).toBe(0);
      // Six faces par fantôme, fusionnées ou non.
      const aire = triangles(avec.fantomes).reduce((s, t) => s + t.aire, 0);
      expect(aire, a).toBeCloseTo(fantomes.length * 6, 3);
      expect(sensJuste(avec.fantomes), a).toBe(true);
      // Les uv sont en cases sur le plan : l'arête de chaque case tombe sur les valeurs entières.
      expect(avec.fantomes.uvs.length, a).toBe((avec.fantomes.positions.length / 3) * 2);
      expect([...avec.fantomes.uvs].every(Number.isInteger), a).toBe(true);
      const fantome = blocEn(fantomes);
      for (const t of triangles(avec.fantomes)) expect(fantome(decale(t.centre, t.n, -0.01))).toBeDefined();
    }
  }, 30_000);

  it('les fantômes : 0,35 de jour, 0,45 de nuit, l’arête à 70 % ; en Contraste élevé, 0,55 et l’arête pleine', () => {
    expect(opaciteDesFantomes(1)).toEqual({ remplissage: 0.35, arete: 0.7 });
    expect(opaciteDesFantomes(0)).toEqual({ remplissage: 0.45, arete: 0.7 });
    expect(opaciteDesFantomes(0.5).remplissage).toBeCloseTo(0.4);
    expect(opaciteDesFantomes(1, true)).toEqual({ remplissage: 0.55, arete: 1 });
  });

  it('la teinte de chaque bloc : stable, à ± 4 % au plus, et différente d’un bloc à son voisin', () => {
    const valeurs: number[] = [];
    let voisinsEgaux = 0;
    for (let x = -40; x < 40; x += 3)
      for (let y = 880; y < 960; y += 3)
        for (let z = -2; z < 12; z++) {
          const t = teinteDeCase(x, y, z);
          expect(teinteDeCase(x, y, z)).toBe(t);
          expect(t).toBeGreaterThanOrEqual(1 - TEINTE);
          expect(t).toBeLessThanOrEqual(1 + TEINTE);
          valeurs.push(t);
          if (Math.abs(teinteDeCase(x + 1, y, z) - t) < 0.004) voisinsEgaux++;
        }
    const moyenne = valeurs.reduce((s, v) => s + v, 0) / valeurs.length;
    expect(moyenne).toBeGreaterThan(0.99);
    expect(moyenne).toBeLessThan(1.01);
    expect(Math.min(...valeurs)).toBeLessThan(1 - TEINTE * 0.9);
    expect(Math.max(...valeurs)).toBeGreaterThan(1 + TEINTE * 0.9);
    // Deux blocs voisins ont rarement la même teinte (écart de moins d'un dixième de la plage).
    expect(voisinsEgaux / valeurs.length).toBeLessThan(0.15);
    // Le shader fait le même calcul, avec la même amplitude.
    expect(TEINTE_GLSL).toContain('0.1031');
    expect(TEINTE_GLSL).toContain(TEINTE.toFixed(3));
  });

  it('la fusion ne mêle pas deux matières : une face fusionnée n’a qu’une couleur, et les blocs gardent la leur', () => {
    const { cubes, sol } = monde('5e');
    const m = maillageDeLaConstruction('5e', cubes, sol);
    const c = m.opaque.colors;
    for (let q = 0; q < m.opaque.positions.length / 3; q += 4)
      for (let k = 1; k < 4; k++) for (let j = 0; j < 3; j++) expect(c[(q + k) * 3 + j]).toBe(c[q * 3 + j]);
    // Le biseau peint : quatre distances par sommet, bornées.
    expect(m.opaque.biseaux.length).toBe((m.opaque.positions.length / 3) * 4);
    expect([...m.opaque.biseaux].every((d) => d >= 0 && d <= SANS_BISEAU)).toBe(true);
    expect([...m.opaque.biseaux].some((d) => d < SANS_BISEAU)).toBe(true);
    // La teinte portée par sommet : 0 sur la grille, celle du bloc pour un objet du quai descendu d'une fraction.
    expect(m.opaque.teintes.length).toBe(m.opaque.positions.length / 3);
    expect([...m.opaque.teintes].every((t) => t === 0 || Math.abs(t - 1) <= TEINTE)).toBe(true);
    expect([...m.opaque.teintes].filter((t) => t === 0).length).toBeGreaterThan(m.opaque.teintes.length * 0.9);
  });

  it('les toits : ardoise de l’archipel, terre cuite sur une île sur quatre ou cinq (1 sur 3 accepté aux Îles du Ciel)', () => {
    expect(toitDe('ferme')).toBe('terre-cuite');
    expect(toitDe('foret')).toBe('ardoise');
    expect(toitDe(undefined)).toBe('ardoise');
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes } = monde(a);
      const iles = [...new Set(cubes.filter((c) => c.texture === 'toit').map((c) => c.tag!))];
      const part = iles.filter((i) => toitDe(i) === 'terre-cuite').length / iles.length;
      expect(part, `${a} : ${iles.join(', ')}`).toBeGreaterThanOrEqual(0.2);
      expect(part, a).toBeLessThanOrEqual(a === '3e' ? 1 / 3 : 0.3);
    }
    expect(TERRE_CUITE_SUR).toHaveLength(5);
    // Aux Îles du Ciel, le dessus est enneigé et les rives restent d'ardoise ; délavé sur une île fermée.
    const ciel = couleursDuToit('3e', 'phare');
    expect(ciel.dessus).not.toBe(ciel.cote);
    expect(ARDOISES['3e'].rives).toBe(ARDOISES['6e'].dessus);
    expect(couleursDuToit('6e', 'foret', true)).not.toEqual(couleursDuToit('6e', 'foret'));
  });

  it('les fenêtres : les vitres prises dans un mur, les lanternes des cours et des toits à part', () => {
    const cubesDe = (biome: (typeof BIOMES)[number]['id']) =>
      buildingStages(biome, 'pierre')
        .flat()
        .map((c): VoxelCube => ({ x: c.x, y: c.y, z: c.z, color: BLOCKS[c.block].side, texture: BLOCKS[c.block].texture, tag: biome }));
    // La maison : trois vitres ; les deux lanternes de la cour restent des lanternes.
    const maison = genresDesBlocs(cubesDe('foret'));
    const compte = (g: Map<VoxelCube, string>, genre: string) => [...g.values()].filter((v) => v === genre).length;
    expect(compte(maison, 'vitre')).toBe(3);
    expect(compte(maison, 'lanterne')).toBe(2);
    // Le phare : trois vitres ; la couronne de lanternes sous son toit et celles de la cour restent des lanternes.
    const phare = genresDesBlocs(cubesDe('tour'));
    expect(compte(phare, 'vitre')).toBe(3);
    expect(compte(phare, 'lanterne')).toBe(4 + 2);
    // L'échoppe, le kiosque, le dôme : aucune vitre.
    for (const b of ['marche', 'belvedere', 'glacier'] as const) expect(compte(genresDesBlocs(cubesDe(b)), 'vitre'), b).toBe(0);
  });

  it('au plus trois vitres allumées par bâtiment, aucune sur une île fermée', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, sol } = monde(a);
      const m = maillageDeLaConstruction(a, cubes, sol);
      const d = m.fenetres.decalages;
      expect(d.length, a).toBe(m.fenetres.positions.length / 3);
      expect([...d].every((v) => v === -1 || (v >= 0 && v <= DECALAGE_MAX)), a).toBe(true);
      // Par bâtiment (île et lieu) : les vitres qui s'allument.
      const genres = genresDesBlocs(cubes.filter((c) => !c.quest));
      const allumees = new Map<string, number>();
      const faces = triangles(m.fenetres);
      const vues = new Set<string>();
      faces.forEach((t, i) => {
        const { cell } = caseDeLaConstruction(t.centre, t.n);
        const c = cubes.find((q) => !q.ghost && q.x === cell.x && q.y === cell.y && q.z === cell.z)!;
        const decalage = d[m.fenetres.indices[i * 3]];
        if (c.muted) expect(decalage, a).toBe(-1);
        const k = cle(c.x, c.y, c.z);
        if (genres.get(c) !== 'vitre' || decalage < 0 || vues.has(k)) return;
        vues.add(k);
        const b = `${c.tag}|${c.place ?? ''}`;
        allumees.set(b, (allumees.get(b) ?? 0) + 1);
      });
      expect(allumees.size, a).toBeGreaterThan(0);
      for (const [b, n] of allumees) expect(n, `${a} ${b}`).toBeLessThanOrEqual(FENETRES_ALLUMEES);
    }
  }, 30_000);

  it('l’éclat d’une fenêtre : rien sous 0,3 de nuit, plein à 0,8, monotone et borné, chacune à son moment', () => {
    for (const dec of [0, 0.05, 0.1, DECALAGE_MAX]) {
      let avant = 0;
      for (let n = 0; n <= 1.0001; n += 0.01) {
        const e = eclatDeFenetre(n, dec);
        expect(e).toBeGreaterThanOrEqual(0);
        expect(e).toBeLessThanOrEqual(1);
        expect(e).toBeGreaterThanOrEqual(avant);
        if (n <= ALLUMAGE) expect(e).toBe(0);
        if (n >= PLEINE_NUIT) expect(e).toBe(1);
        avant = e;
      }
    }
    // Un décalage plus grand s'allume plus tard ; une fenêtre qui ne s'allume jamais reste éteinte.
    expect(eclatDeFenetre(0.5, 0)).toBeGreaterThan(eclatDeFenetre(0.5, DECALAGE_MAX));
    expect(eclatDeFenetre(1, -1)).toBe(0);
    expect(ECLAT_GLSL).toContain('smoothstep');
  });

  it('les bornes sortent de la construction (leur poste les dessine), sauf si on les demande', () => {
    const { cubes, sol } = monde('4e');
    const options: OptionsDeLaConstruction = { bornes: true };
    const sans = coutDeLaConstruction(maillageDeLaConstruction('4e', cubes, sol));
    const avec = coutDeLaConstruction(maillageDeLaConstruction('4e', cubes, sol, options));
    expect(avec.triangles).toBeGreaterThan(sans.triangles);
  });
});

describe('Les toits de terre cuite (lot R5)', () => {
  it('deux îles voisines ne sont jamais toutes deux en terre cuite', () => {
    const voisines = BRIDGES.filter((b) => toitDe(b.from) === 'terre-cuite' && toitDe(b.to) === 'terre-cuite');
    expect(voisines.map((b) => b.id)).toEqual([]);
  });

  it('les bornes : un pilier taillé à tête chanfreinée, dans ses deux cases, une borne par mission', () => {
    const forme = formeDuPilier('6e');
    expect(forme.indices.length / 3).toBe(28);
    expect(sensJuste(forme)).toBe(true);
    for (const v of forme.positions) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(2);
    }
    // Le toucher retrouve la case du socle ou de la tête, et la case devant est hors de la borne.
    for (const t of triangles(forme)) {
      const { cell, next } = caseDeLaConstruction(t.centre, t.n);
      expect([cle(0, 0, 0), cle(0, 0, 1)]).toContain(cle(cell.x, cell.y, cell.z));
      // (Sous la tête, qui déborde du corps, la case devant est le socle : on ne construit pas sous une borne.)
      if (t.n.y > -0.5) expect([cle(0, 0, 0), cle(0, 0, 1)]).not.toContain(cle(next.x, next.y, next.z));
    }
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes } = monde(a);
      const piliers = piliersDe(cubes);
      expect(piliers.length, a).toBe(new Set(cubes.filter((c) => c.quest).map((c) => c.quest)).size);
      for (const p of piliers) expect(cubes.some((c) => c.quest === p.quest && c.z === p.z + 1), a).toBe(true);
    }
  });

  it('la signature change quand un bloc est posé, pas autrement', () => {
    const { cubes, sol } = monde('5e', 'dernier');
    const avant = signatureDeLaConstruction(cubes, sol);
    expect(signatureDeLaConstruction([...cubes], sol)).toBe(avant);
    const i = cubes.findIndex((c) => c.ghost);
    const pose = cubes.map((c, k) => (k === i ? { ...c, ghost: undefined } : c));
    expect(signatureDeLaConstruction(pose, sol)).not.toBe(avant);
  });

  it('le biseau peint éclaire toujours : +22 % de lumière, et au moins +14 niveaux sRGB sur une teinte sombre', () => {
    for (const c of [0x2e505e, 0x142b38, 0x3e3636, 0x224c5f]) {
      const e = eclatDuBiseau(c);
      for (const s of [16, 8, 0]) expect(((e >> s) & 255) - ((c >> s) & 255), c.toString(16)).toBeGreaterThanOrEqual(ECART_SOMBRE);
    }
    for (const c of [0xe5ebe3, 0xaaa497, 0xd08a5e, 0x000000, 0xffffff]) {
      const e = eclatDuBiseau(c);
      for (const s of [16, 8, 0]) expect((e >> s) & 255).toBeGreaterThanOrEqual((c >> s) & 255);
    }
    // Une teinte claire : seulement les 22 % de lumière (en linéaire : 170 devient 186).
    expect(eclatDuBiseau(0xaaaaaa) & 255).toBe(186);
  });

  it('les lanternes : un corps sombre et un cœur, au plus deux allumées par cour ; le verre hors d’un mur porte son arête', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, sol } = monde(a);
      const f = fenetresDe(cubes);
      const parCour = new Map<string, number>();
      const parBatiment = new Map<string, number>();
      for (const [c, { genre, decalage }] of f) {
        expect(c.quest, a).toBeUndefined();
        if (c.muted) expect(decalage, a).toBe(-1);
        if (decalage < 0) continue;
        const m = genre === 'lanterne' ? parCour : parBatiment;
        const k = `${c.tag}|${c.place ?? ''}`;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      expect(parCour.size, a).toBeGreaterThan(0);
      for (const n of parCour.values()) expect(n, a).toBeLessThanOrEqual(LANTERNES_ALLUMEES);
      for (const n of parBatiment.values()) expect(n, a).toBeLessThanOrEqual(FENETRES_ALLUMEES);
      // La 2D (fenetresDe) et la 3D (le groupe des fenêtres) allument les mêmes : autant de décalages allumés.
      const m = maillageDeLaConstruction(a, cubes, sol);
      const allumes3D = new Set<string>();
      triangles(m.fenetres).forEach((t, i) => {
        if (m.fenetres.decalages[m.fenetres.indices[i * 3]] < 0) return;
        const { cell } = caseDeLaConstruction(t.centre, t.n);
        allumes3D.add(cle(cell.x, cell.y, cell.z));
      });
      const allumes2D = new Set([...f].filter(([, v]) => v.decalage >= 0).map(([c]) => cle(c.x, c.y, c.z)));
      expect(allumes3D, a).toEqual(allumes2D);
      expect(m.opaque.aretes.length, a).toBe(m.opaque.positions.length / 3);
    }
    // La tour du 6e : son verre hors d'un mur porte l'arête ; les autres blocs non.
    const m = maillageDeLaConstruction('6e', monde('6e').cubes, monde('6e').sol);
    const avec = [...m.opaque.aretes].filter((v) => v === 1).length;
    expect(avec).toBeGreaterThan(0);
    expect(avec).toBeLessThan(m.opaque.aretes.length / 4);
  });
});
