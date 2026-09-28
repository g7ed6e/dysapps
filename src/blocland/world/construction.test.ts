import type { VoxelCube } from '../Voxel';
import { BIOMES, BLOCKS } from '../biomes';
import { buildingStages } from './architect';
import { enveloppeDe, toutConstruit } from './budget';
import {
  ALLUMAGE,
  cacheDeLaConstruction,
  caseDeLaConstruction,
  caseDuPhare,
  construireParIle,
  CREME_DU_PHARE,
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
  phareDeGrimoire,
  PLEINE_NUIT,
  SANS_BISEAU,
  TEINTE,
  TEINTE_GLSL,
  teinteDeCase,
  type GroupeDeConstruction,
  type MaillageDeLaConstruction,
  type OptionsDeLaConstruction,
} from './construction';
import { rangerLeDecor } from './decorMesh';
import { champDuSol, poseDuDecor } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import { buildMesh, faceCount } from './mesher';
import { getPlan, planCells, plansFor } from './plans';
import { PHARE, PHARES } from './decor/phare';
import { lineaire } from './landMesh';
import { ambianceDe } from './palette';
import { mixColor } from './daylight';
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

/**
 * Les blocs pleins (sans fantômes ni bornes) et les lanternes, qui ne remplissent plus leur case ; sans les cases que
 * le phare de Grimoire remplace (au 6e).
 */
function rangerLesLanternes(cubes: VoxelCube[], a: ArchipelagoId = '6e') {
  const phare = phareDeGrimoire(cubes, a);
  const gardes = cubes.filter((c) => !c.quest && !phare?.remplacees.has(cle(c.x, c.y, c.z)));
  const genres = genresDesBlocs(gardes);
  const lanternes = new Map<string, VoxelCube>();
  for (const [c, g] of genres) if (g === 'lanterne') lanternes.set(cle(c.x, c.y, c.z), c);
  return { pleins: gardes.filter((c) => !c.ghost && genres.get(c) !== 'lanterne'), lanternes };
}

/** Le triangle `i` d'un groupe est-il au phare de Grimoire ? */
const auPhare = (m: MaillageDeLaConstruction, groupe: 'opaque' | 'fenetres', i: number) => Boolean(m.phare && i >= m.phare[groupe][0] && i < m.phare[groupe][1]);

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
      const { pleins, lanternes } = rangerLesLanternes(cubes, a);
      // Le monde en blocs, le verre compté comme un bloc plein, sans les lanternes ; puis les lanternes, corps et cœur.
      const attendu = faceCount(buildMesh(pleins.map((c) => (c.texture === 'verre' ? { ...c, texture: 'pierre' } : c)), sol)) + lanternes.size * AIRE_DE_LANTERNE;
      const occupe = new Set(pleins.map((c) => cle(c.x, c.y, c.z)));
      const bloc = blocEn(pleins);
      const sous = new Set(sol.map((c) => cle(c.x, c.y, c.z)));
      for (const mode of ['aucun', 'peint'] as const) {
        const m = maillageDeLaConstruction(a, cubes, sol, { biseau: mode });
        let aire = 0;
        for (const [nom, g] of [['opaque', m.opaque], ['fenetres', m.fenetres]] as const) {
          expect(sensJuste(g), `${a} ${mode}`).toBe(true);
          for (const [i, t] of triangles(g).entries()) {
            if (auPhare(m, nom, i)) continue;
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
    for (const [i, t] of triangles(m.opaque).entries()) {
      if (auPhare(m, 'opaque', i) || dansUneLanterne(lanternes, t)) continue;
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
        if (auPhare(m, 'fenetres', i)) return;
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
        if (auPhare(m, 'fenetres', i) || m.fenetres.decalages[m.fenetres.indices[i * 3]] < 0) return;
        const { cell } = caseDeLaConstruction(t.centre, t.n);
        allumes3D.add(cle(cell.x, cell.y, cell.z));
      });
      const allumes2D = new Set([...f].filter(([, v]) => v.decalage >= 0).map(([c]) => cle(c.x, c.y, c.z)));
      expect(allumes3D, a).toEqual(allumes2D);
      expect(m.opaque.aretes.length, a).toBe(m.opaque.positions.length / 3);
    }
    // Le verre hors d'un mur (au 6e : les jardinières de la Tour, les monuments) porte l'arête ; les autres blocs non.
    const m = maillageDeLaConstruction('6e', monde('6e').cubes, monde('6e').sol);
    const avec = [...m.opaque.aretes].filter((v) => v === 1).length;
    expect(avec).toBeGreaterThan(0);
    expect(avec).toBeLessThan(m.opaque.aretes.length / 4);
  });
});

/** Le 6e, tout construit sauf l'île de la Tour : son phare de Grimoire à tant de cases posées par étape. */
function mondeDuPhare(murs: number, toit: number) {
  const { progress, village } = toutConstruit();
  const cles = (id: string, n: number) => planCells(getPlan(id)!).slice(0, n).map((c) => c.key);
  const plans: Record<string, string[]> = { ...village.plans, 'tour-phare': cles('tour-phare', murs), 'tour-lanterne': cles('tour-lanterne', toit) };
  delete plans['tour-quai'];
  const tous = worldCubes('6e', progress, { ...village, plans }, false);
  const sol = tous.filter((c) => c.sol);
  const { reste } = rangerLeDecor(tous.filter((c) => !c.sol));
  return { cubes: poseDuDecor(champDuSol('6e', sol, reste), reste), sol };
}

describe('Le phare de Grimoire (lot R5, décision 16)', () => {
  const MURS = getPlan('tour-phare')!.cells.length;
  const TOIT = getPlan('tour-lanterne')!.cells.length;
  const etats = { chantier: [3, 0], murs: [MURS, 0], toit: [MURS, 5], fini: [MURS, TOIT] } as const;

  it('une étape finie laisse la place à sa pièce du modèle : les murs, le fût et ses bandes ; le toit, la galerie, la lanterne et le cône', () => {
    const attendu = { chantier: [], murs: ['anneau', 'fut'], toit: ['anneau', 'fut'], fini: ['anneau', 'fut', 'galerie', 'lanterne', 'toit'] };
    for (const [nom, [murs, toit]] of Object.entries(etats)) {
      const { cubes, sol } = mondeDuPhare(murs, toit);
      const phare = phareDeGrimoire(cubes)!;
      expect(phare, nom).not.toBeNull();
      expect([...(phare.pose.pieces ?? [])].sort(), nom).toEqual(attendu[nom as keyof typeof attendu]);
      expect(phare.remplacees.size, nom).toBe(nom === 'fini' ? MURS + TOIT : nom === 'chantier' ? 0 : MURS);
      // Au centre de l'emprise 3 × 3 de la tour, pied au sol.
      const murs0 = [...phare.remplacees, ...phare.enCours].slice(0, MURS).map((k) => k.split(',').map(Number));
      expect(phare.pose.cx).toBe((Math.min(...murs0.map((c) => c[0])) + Math.max(...murs0.map((c) => c[0])) + 1) / 2);
      expect(phare.pose.pied).toBe(Math.min(...murs0.map((c) => c[2])));
      expect(phare.pose.H).toBe(PHARES['6e'].H);
      const m = maillageDeLaConstruction('6e', cubes, sol);
      if (nom === 'chantier') {
        expect(m.phare, nom).toBeUndefined();
        continue;
      }
      const [o0, o1] = m.phare!.opaque;
      const [f0, f1] = m.phare!.fenetres;
      expect(o1 - o0, nom).toBeGreaterThan(0);
      // La lanterne, dans les fenêtres (elle suit la lueur, allumée la première), seulement quand le toit est fini.
      expect(f1 - f0, nom).toBe(nom === 'fini' ? PHARE.pans * 2 : 0);
      for (let i = f0 * 3; i < f1 * 3; i++) expect(m.fenetres.decalages[m.fenetres.indices[i]]).toBe(0);
      // Le sommet : le haut du fût (0,70 H) tant que le toit n'est pas fini, H une fois fini.
      let haut = -Infinity;
      for (let i = o0 * 3; i < o1 * 3; i++) haut = Math.max(haut, m.opaque.positions[m.opaque.indices[i] * 3 + 1]);
      expect(haut - phare.pose.pied, nom).toBeCloseTo(nom === 'fini' ? PHARES['6e'].H : PHARE.fut[1] * PHARES['6e'].H, 5);
      // Aucun bloc des étapes finies ne reste en cube.
      const f = fenetresDe(cubes);
      for (const c of f.keys()) expect(phare.remplacees.has(cle(c.x, c.y, c.z)), nom).toBe(false);
    }
  }, 30_000);

  it('les cases posées d’une étape en cours restent des blocs taillés, en crème au lieu du verre, sans arête', () => {
    const { cubes, sol } = mondeDuPhare(MURS, 0);
    const toit = mondeDuPhare(MURS, 5);
    const phare = phareDeGrimoire(toit.cubes)!;
    expect(phare.enCours.size).toBe(TOIT);
    const [teinte, force] = ambianceDe('6e').voile;
    const creme = mixColor(CREME_DU_PHARE, teinte, force);
    const lin = [(creme >> 16) & 255, (creme >> 8) & 255, creme & 255].map((v) => lineaire(v / 255));
    const aCreme = (m: MaillageDeLaConstruction) => {
      for (let i = 0; i < m.opaque.colors.length; i += 3)
        if (Math.abs(m.opaque.colors[i] - lin[0]) < 1e-4 && Math.abs(m.opaque.colors[i + 1] - lin[1]) < 1e-4 && Math.abs(m.opaque.colors[i + 2] - lin[2]) < 1e-4) {
          if (m.opaque.aretes[i / 3] !== 0) return false;
          return true;
        }
      return false;
    };
    // Le toit en cours a posé ses coins de verre (au sommet de la tour) : ils sont crème.
    expect(aCreme(maillageDeLaConstruction('6e', toit.cubes, toit.sol))).toBe(true);
    expect(maillageDeLaConstruction('6e', cubes, sol).phare).toBeDefined();
  }, 30_000);

  it('le toucher retrouve une case du plan sous chaque triangle du phare, et la case devant est hors de la tour ou au-dessus', () => {
    const { cubes, sol } = mondeDuPhare(MURS, TOIT);
    const m = maillageDeLaConstruction('6e', cubes, sol);
    const cles = new Set(m.phare!.cellules.map((c) => cle(c.x, c.y, c.z)));
    for (const groupe of ['opaque', 'fenetres'] as const) {
      const g = m[groupe];
      const [t0, t1] = m.phare![groupe];
      const faces = triangles(g);
      for (let i = t0; i < t1; i++) {
        const r = caseDuPhare(m, groupe, i, faces[i].centre, faces[i].n)!;
        expect(r, `${groupe} ${i}`).not.toBeNull();
        expect(cles.has(cle(r.cell.x, r.cell.y, r.cell.z))).toBe(true);
        // Au plus à une case et demie du point touché.
        const p = faces[i].centre;
        expect(Math.hypot(r.cell.x + 0.5 - p.x, r.cell.y + 0.5 - p.z, r.cell.z + 0.5 - p.y)).toBeLessThan(1.6);
      }
    }
    // Hors du phare : rien.
    expect(caseDuPhare(m, 'opaque', m.phare!.opaque[1], { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBeNull();
  }, 30_000);

  it('dans l’enveloppe de la construction du 6e, à chaque étape (6 500 triangles, 3 appels) : les cubes remplacés libèrent des triangles', () => {
    const couts: number[] = [];
    for (const [nom, [murs, toit]] of Object.entries(etats)) {
      const { cubes, sol } = mondeDuPhare(murs, toit);
      const c = coutDeLaConstruction(maillageDeLaConstruction('6e', cubes, sol));
      couts.push(c.triangles);
      expect(c.triangles, nom).toBeLessThanOrEqual(enveloppeDe('construction', '6e').triangles);
      expect(c.drawCalls, nom).toBeLessThanOrEqual(3);
    }
  }, 30_000);
});

describe('Un maillage par île (lot R5)', () => {
  it('les îles mises bout à bout font la construction entière : mêmes triangles, trois groupes ; poser un bloc ne refait que son île', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { cubes, sol } = monde(a, 'dernier');
      const cache = cacheDeLaConstruction();
      const r = construireParIle(a, cubes, sol, cache);
      const entier = coutDeLaConstruction(maillageDeLaConstruction(a, cubes, sol));
      const parIle = coutDeLaConstruction(r.maillage);
      // Les faces entre deux îles (un pont contre un quai) ne sont plus cachées : à 1 % près.
      expect(Math.abs(parIle.triangles - entier.triangles) / entier.triangles, a).toBeLessThan(0.01);
      expect(parIle.drawCalls, a).toBe(entier.drawCalls);
      expect(r.maillage.opaque.biseaux.length, a).toBe((r.maillage.opaque.positions.length / 3) * 4);
      expect(r.maillage.opaque.teintes.length, a).toBe(r.maillage.opaque.positions.length / 3);
      expect(r.maillage.fenetres.decalages.length, a).toBe(r.maillage.fenetres.positions.length / 3);
      expect(r.maillage.fantomes.uvs.length, a).toBe((r.maillage.fantomes.positions.length / 3) * 2);
      expect(Math.max(...r.maillage.opaque.indices), a).toBeLessThan(r.maillage.opaque.positions.length / 3);
      // Rien n'a changé : rien n'est refait.
      expect(construireParIle(a, cubes, sol, cache).change, a).toBe(false);
      // Un fantôme posé : seule son île est refaite.
      const i = cubes.findIndex((c) => c.ghost && c.tag);
      const pose = cubes.map((c, k) => (k === i ? { ...c, ghost: undefined } : c));
      const apres = construireParIle(a, pose, sol, cache);
      expect(apres.refaites, a).toBe(1);
      expect(coutDeLaConstruction(apres.maillage).triangles, a).toBe(coutDeLaConstruction(construireParIle(a, pose, sol, cacheDeLaConstruction()).maillage).triangles);
    }
  }, 60_000);

  it('le phare garde ses triangles, décalés, une fois mis bout à bout', () => {
    const { cubes, sol } = mondeDuPhare(getPlan('tour-phare')!.cells.length, getPlan('tour-lanterne')!.cells.length);
    const r = construireParIle('6e', cubes, sol, cacheDeLaConstruction());
    const seul = maillageDeLaConstruction('6e', cubes.filter((c) => c.tag === 'tour'), sol);
    const p = r.maillage.phare!;
    expect(p.opaque[1] - p.opaque[0]).toBe(seul.phare!.opaque[1] - seul.phare!.opaque[0]);
    // Le premier triangle du phare est le même.
    const t = (m: MaillageDeLaConstruction, i: number) => [0, 1, 2].map((k) => m.opaque.positions[m.opaque.indices[i * 3] * 3 + k]);
    expect(t(r.maillage, p.opaque[0])).toEqual(t(seul, seul.phare!.opaque[0]));
  }, 30_000);
});
