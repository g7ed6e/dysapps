import { bridgesOf, islandsOf } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { caseDArrivee, margeDeRecherche, resteDuTrajet, toucheLEau } from './arrival';
import { toutConstruit } from './budget';
import { dispositionEnGrille } from './grid';
import { isLand, islandDef, landBox, landCells } from './map';
import { walkGround, walkPath } from './paths';
import { avatarHome, casesDesLieux, creaturePlacements, guardianPlacements, tablier, worldCubes } from './terrain';

const { progress, world: village } = toutConstruit();
const monde = (a: (typeof ARCHIPELAGO_IDS)[number]) => {
  const cubes = worldCubes(a, progress, village, false, []);
  const creatures = [...creaturePlacements(a, village.links), ...guardianPlacements(a, progress, village.links)];
  return { cubes, creatures, ground: walkGround(cubes, creatures, casesDesLieux(a)) };
};
const k = (x: number, y: number) => `${x},${y}`;

describe('Toucher le sol : la case d’arrivée', () => {
  it('la case touchée si l’on y va à pied, sinon la plus proche de l’île où l’on va à pied', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { ground } = monde(a);
      for (const b of islandsOf(a)) {
        const def = islandDef(b.id);
        const home = avatarHome(b.id);
        const cells = landCells(def);
        // Quelques cases de l'île, un peu partout : le sol libre, un arbre, une borne, le rivage.
        for (const c of cells.filter((_, i) => i % 23 === 0)) {
          const r = caseDArrivee(ground, def, home, { x: c.x + 0.4, y: c.y + 0.7 });
          expect(r, `${b.id} ${c.x},${c.y}`).not.toBeNull();
          const p = r!.case;
          // Toujours sur l'île, sur une case où l'on marche (ou sa place même), et jamais au milieu d'un ouvrage.
          expect(isLand(def, p.x, p.y)).toBe(true);
          expect(ground.bridge.has(k(p.x, p.y))).toBe(false);
          if (p.x !== home.x || p.y !== home.y) expect(ground.feet.get(k(p.x, p.y))).toBe(p.z);
          // Le chemin à pied y mène.
          expect(walkPath(ground, home, p), `${b.id} → ${p.x},${p.y}`).not.toBeNull();
          if (r!.touchee) expect([p.x, p.y]).toEqual([c.x, c.y]);
          // Une case libre et accessible est retenue telle quelle. (walkPath permet, au bout du chemin, une marche de deux
          // blocs, pour le pied d'un ouvrage ; pas un toucher : il s'arrête alors juste avant.)
          if (ground.feet.has(k(c.x, c.y)) && !ground.bridge.has(k(c.x, c.y)) && walkPath(ground, home, { x: c.x, y: c.y, z: ground.feet.get(k(c.x, c.y))! }))
            expect(r!.touchee || Math.max(Math.abs(p.x - c.x), Math.abs(p.y - c.y)) === 1).toBe(true);
        }
      }
    }
  });

  it('une case qui ne s’atteint pas (un arbre, une borne, l’eau du rivage) : la case accessible la plus proche', () => {
    const { ground } = monde('6e');
    const def = islandDef('french-6e-phonology');
    const home = avatarHome('french-6e-phonology');
    const box = landBox(def);
    let vues = 0;
    for (let x = box.x0; x < box.x1; x++)
      for (let y = box.y0; y < box.y1; y++) {
        if (ground.feet.has(k(x, y)) || (x === home.x && y === home.y)) continue;
        const r = caseDArrivee(ground, def, home, { x, y });
        if (!r) continue;
        vues++;
        expect(r.touchee).toBe(false);
        // Aucune case de l'île plus proche du doigt n'est accessible : la recherche n'en a pas sauté.
        const d = (r.case.x - x) ** 2 + (r.case.y - y) ** 2;
        expect(d).toBeGreaterThan(0);
        expect(Math.sqrt(d)).toBeLessThan(Math.max(box.x1 - box.x0, box.y1 - box.y0) / 2);
      }
    expect(vues).toBeGreaterThan(10);
  });

  it('hors de l’étendue de l’île : rien (la page l’envoie à sa place) ; sur sa case : il y reste', () => {
    const { ground } = monde('6e');
    const def = islandDef('french-6e-phonology');
    const home = avatarHome('french-6e-phonology');
    const box = landBox(def);
    expect(caseDArrivee(ground, def, home, { x: box.x1 + margeDeRecherche(def), y: box.y0 })).toBeNull();
    expect(caseDArrivee(ground, def, home, { x: box.x0 - 1, y: box.y1 + 3 })).toBeNull();
    expect(caseDArrivee(ground, def, home, { x: home.x + 0.5, y: home.y + 0.5 })).toEqual({ case: home, touchee: true });
  });

  it('l’eau se reconnaît (en marche, un toucher sur l’eau le fait arriver)', () => {
    const { cubes, ground } = monde('6e');
    const eau = cubes.find((c) => c.texture === 'eau');
    expect(eau).toBeDefined();
    const top = Math.max(...cubes.filter((c) => c.x === eau!.x && c.y === eau!.y && !c.ghost).map((c) => c.z));
    if (top === eau!.z) expect(toucheLEau(ground, { x: eau!.x + 0.5, y: eau!.y + 0.5 })).toBe(true);
    const home = avatarHome('french-6e-phonology');
    expect(toucheLEau(ground, home)).toBe(false);
  });

  it('la disposition en grille : la case d’arrivée, et le trajet vers une île qui s’arrête là', () => {
    const { cubes, creatures, ground } = monde('6e');
    const g = dispositionEnGrille('6e', village.links, { cubes, creatures });
    const def = islandDef('maths-6e-calculation');
    const cible = landCells(def).find((c) => ground.feet.has(k(c.x, c.y)) && (c.x + c.y) % 5 === 0)!;
    const r = g.arrivee('maths-6e-calculation', cible, avatarHome('maths-6e-calculation'))!;
    expect(r).toEqual(caseDArrivee(ground, def, avatarHome('maths-6e-calculation'), cible));
    const t = g.trajet({ genre: 'ile', id: 'french-6e-phonology' }, { genre: 'ile', id: 'maths-6e-calculation' }, { arrivee: r.case })!;
    expect(g.versMonde(t.etapes[t.etapes.length - 1])).toEqual(r.case);
    expect(g.versMonde(t.etapes[0])).toEqual(avatarHome('french-6e-phonology'));
    // Parti d'ailleurs que de sa place.
    const depart = { ...avatarHome('french-6e-phonology'), x: avatarHome('french-6e-phonology').x + 1 };
    const t2 = g.trajet({ genre: 'ile', id: 'french-6e-phonology' }, { genre: 'ile', id: 'maths-6e-calculation' }, { arrivee: r.case, depart })!;
    expect(g.versMonde(t2.etapes[0])).toEqual(depart);
    // Sans grille de marche, pas de case d'arrivée : sa place.
    expect(dispositionEnGrille('6e').arrivee('maths-6e-calculation', cible, avatarHome('maths-6e-calculation'))).toBeNull();
  });
});

describe('Changer de but en chemin', () => {
  it('ce qui reste du trajet depuis un point en route', () => {
    const route = [
      { x: 0, y: 0, z: 1 },
      { x: 4, y: 0, z: 1 },
      { x: 4, y: 4, z: 1 },
      { x: 8, y: 4, z: 1 },
    ];
    expect(resteDuTrajet(route, { x: 2, y: 0, z: 1 })).toEqual([{ x: 2, y: 0, z: 1 }, route[1], route[2], route[3]]);
    expect(resteDuTrajet(route, { x: 4, y: 3, z: 1 })).toEqual([{ x: 4, y: 3, z: 1 }, route[2], route[3]]);
    expect(resteDuTrajet([route[0]], { x: 0, y: 0, z: 1 })).toEqual([{ x: 0, y: 0, z: 1 }, route[0]]);
  });
});

describe('Au pied des ouvrages', () => {
  it('le bonhomme va à pied de sa place au bout de chaque ouvrage de son île : aucun arbre ne bouche la sortie', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const { ground } = monde(a);
      for (const ile of islandsOf(a)) {
        const home = avatarHome(ile.id);
        const bouts = bridgesOf(ile.id)
          .filter((b) => village.links.includes(b.id))
          .map((b) => tablier(b, ile.id))
          .filter((deck) => deck.length)
          .map((deck) => deck[0]);
        for (const bout of bouts) {
          expect(walkPath(ground, home, bout), `${ile.id} : sa place → ${bout.x},${bout.y}`).not.toBeNull();
          // D'un ouvrage à l'autre aussi (une île traversée).
          for (const autre of bouts) if (autre !== bout) expect(walkPath(ground, bout, autre), `${ile.id} : ${bout.x},${bout.y} → ${autre.x},${autre.y}`).not.toBeNull();
        }
      }
    }
  });
});
