// L'Escale, le lieu de départ du monde continu (GD-20, lot 2) : sa pierre porte Kéo au-dessus du sol, ses chemins sont
// reliés au réseau, son dessin tient sous son plafond et dans le maillage des lieux, ses portes, sa galerie et son lieu
// d'assemblage se touchent sur de larges zones, et ce qu'il montre ne vient que de son état.
import { describe, expect, it } from 'vitest';
import { PORT_BUDGET } from './budget';
import { boundsOf } from './facets';
import { atNode, findRoute, pathNode, pathRibbons } from './paths';
import { PATH_EDGES, PORT, PORT_PAVING, PORT_SUBJECTS, portFloor, portLevel, portNode, type PortSpot } from './plan6e';
import { PORT_TROPHY_SLOTS, PORT_WORST, assemblyScene, galleryArcades, portFacets, portHeading, portTouch, trophyShape, trophySlot, type PortState } from './port';
import { buildHeightField, heightOnMesh } from './terrain';

const ASLEEP: PortState = {
  doors: { french: 'closed', maths: 'closed', english: 'closed' },
  trophies: [],
  degree: 0,
  pile: 0,
  recipe: { pieces: [0xc29a5f, 0xc29a5f, 0xd98a5a], made: 0xdcba86 },
};

const SPOTS: readonly PortSpot[] = ['quai', ...PORT_SUBJECTS, 'succes', 'chantier'];

describe('L’Escale', () => {
  it('tient sous son plafond au plus chargé (4 500 triangles), toutes ses places prises', () => {
    expect(PORT_BUDGET).toBe(4500);
    expect(portFacets(PORT_WORST).triangles).toBeLessThanOrEqual(PORT_BUDGET);
    expect(portFacets(ASLEEP).triangles).toBeLessThan(portFacets(PORT_WORST).triangles);
  });

  it('sa pierre est au-dessus du sol dessiné partout, et rien n’est pavé hors du quai et de la place', () => {
    const field = buildHeightField();
    for (const r of [PORT_PAVING.quay, PORT_PAVING.square])
      // Juste en dedans des bords (un point du bord, aller et retour dans le monde, peut tomber d'un côté ou de l'autre).
      for (let lz = r.z0 + 0.01; lz <= r.z1 - 0.01; lz += 0.5)
        for (let lx = r.x0 + 0.01; lx <= r.x1 - 0.01; lx += 0.5) {
          const p = PORT.toWorld(lx, lz);
          const floor = portFloor(p.x, p.z);
          expect(floor).toBeCloseTo(portLevel(lz), 6);
          expect(floor! - heightOnMesh(field, p.x, p.z)).toBeGreaterThan(0.02);
        }
    const out = PORT.toWorld(-10, 9);
    expect(portFloor(out.x, out.z)).toBeNull();
  });

  it('chaque endroit a son nœud sur la pierre, relié au Phare par la digue', () => {
    for (const spot of SPOTS) {
      const at = pathNode(portNode(spot)).at;
      expect(portFloor(at.x, at.z)).not.toBeNull();
      const route = findRoute(atNode('phare'), atNode(portNode(spot)));
      expect(route.length).toBeGreaterThan(1);
    }
    expect(PATH_EDGES).toContainEqual(['phare', portNode('quai')]);
    // Les deux repères se répondent : le Phare est au nord du quai, au bout de la digue.
    const quay = pathNode(portNode('quai')).at;
    // Droit devant la caméra qui regarde au nord : moins de trois degrés d'écart.
    expect(Math.abs(quay.x - pathNode('phare').at.x) / (quay.z - pathNode('phare').at.z)).toBeLessThan(0.05);
    expect(quay.z).toBeGreaterThan(pathNode('phare').at.z + 60);
  });

  it('aucun ruban de chemin n’est dessiné sur la pierre du Port', () => {
    const field = buildHeightField();
    const ribbons = pathRibbons((x, z) => portFloor(x, z) ?? heightOnMesh(field, x, z));
    for (let k = 0; k < ribbons.positions.length; k += 9) {
      const cx = (ribbons.positions[k] + ribbons.positions[k + 3] + ribbons.positions[k + 6]) / 3;
      const cz = (ribbons.positions[k + 2] + ribbons.positions[k + 5] + ribbons.positions[k + 8]) / 3;
      const l = PORT.toLocal({ x: cx, z: cz });
      const inside = (r: { x0: number; x1: number; z0: number; z1: number }) => l.x > r.x0 + 1.5 && l.x < r.x1 - 1.5 && l.z > r.z0 + 1.5 && l.z < r.z1 - 1.5;
      expect(inside(PORT_PAVING.quay) || inside(PORT_PAVING.square)).toBe(false);
    }
  });

  it('la galerie a douze places, puis une arcade de six au 13e succès et au 19e, jamais plus de quatre', () => {
    expect([0, 12, 13, 18, 19, 24, 40].map(galleryArcades)).toEqual([2, 2, 3, 3, 4, 4, 4]);
    expect(PORT_TROPHY_SLOTS).toBe(24);
    const keys = new Set(Array.from({ length: PORT_TROPHY_SLOTS }, (_, i) => JSON.stringify(trophySlot(i))));
    expect(keys.size).toBe(PORT_TROPHY_SLOTS);
    // Une arcade entière d'un coup : 13 trophées ou 18, la même galerie.
    const with13 = portFacets({ ...ASLEEP, trophies: Array(13).fill('gold') });
    const with12 = portFacets({ ...ASLEEP, trophies: Array(12).fill('gold') });
    expect(boundsOf(with13).min[0]).toBeLessThan(boundsOf(with12).min[0] + 0.01);
  });

  it('huit formes de trophées, de quelques dizaines de triangles chacune', () => {
    for (let k = 0; k < 8; k++) {
      expect(trophyShape(k).triangles).toBeGreaterThan(20);
      expect(trophyShape(k).triangles).toBeLessThanOrEqual(100);
    }
    expect(new Set(Array.from({ length: 8 }, (_, k) => trophyShape(k).triangles)).size).toBeGreaterThan(3);
  });

  it('une porte change de forme avec son état (fermée, ouverte et sa lanterne, pavoisée), jamais par la seule couleur', () => {
    const tri = (s: PortState['doors']['french']) => portFacets({ ...ASLEEP, doors: { ...ASLEEP.doors, maths: s } }).triangles;
    expect(tri('lit')).toBeGreaterThan(tri('closed'));
    expect(tri('flags')).toBeGreaterThan(tri('lit'));
  });

  it('l’état de la région ajoute une chose par degré (la lanterne du quai, des habitants, des barques), rien au 4e (la Nef au lot 5)', () => {
    const tri = (degree: PortState['degree']) => portFacets({ ...ASLEEP, degree }).triangles;
    expect(tri(1)).toBeGreaterThan(tri(0));
    expect(tri(2)).toBeGreaterThan(tri(1));
    expect(tri(3)).toBeGreaterThan(tri(2));
    expect(tri(4)).toBe(tri(3));
  });

  it('la pile du râtelier montre le stock, dix au plus ; pendant la scénette, la pile d’avant et l’établi vide', () => {
    const tri = (pile: number, assembling = false) => portFacets({ ...ASLEEP, pile }, { assembling }).triangles;
    expect(tri(3) - tri(2)).toBe(10);
    expect(tri(30)).toBe(tri(10));
    expect(tri(3, true)).toBe(tri(2) - assemblyScene({ ...ASLEEP, pile: 3 }).pieces.triangles);
  });

  it('la scénette d’assemblage part de l’établi et arrive sur le râtelier, à la place suivante de la pile', () => {
    const one = assemblyScene({ ...ASLEEP, pile: 1 });
    const two = assemblyScene({ ...ASLEEP, pile: 2 });
    expect(one.pieces.triangles).toBe(30);
    expect(one.made.triangles).toBe(10);
    expect(one.from).toEqual(two.from);
    expect(two.to).not.toEqual(one.to);
    expect(Math.hypot(one.to.x - one.from.x, one.to.z - one.from.z)).toBeGreaterThan(1);
  });

  it('on touche une porte sur tout son tiers de façade, la galerie, le lieu d’assemblage ; le reste du Port ouvre sa fiche', () => {
    const at = (lx: number, lz: number) => portTouch(PORT.toWorld(lx, lz));
    expect(at(19.3, 6.5)).toBe('french');
    expect(at(17.9, 4)).toBe('french');
    expect(at(22.5, 7.5)).toBe('maths');
    expect(at(25.7, 2)).toBe('english');
    expect(at(13, 6)).toBe('succes');
    expect(at(5, 6)).toBe('succes');
    expect(at(32.5, 4.6)).toBe('chantier');
    expect(at(0, -5)).toBe('fiche');
    expect(at(10, 11.5)).toBe('fiche');
    expect(at(-30, 40)).toBeNull();
    expect(portTouch({ x: 0, z: 0 })).toBeNull();
  });

  it('Kéo se tient face à la caméra au quai, tourné vers la façade devant une porte', () => {
    expect(portHeading('quai')).toBe(Math.PI);
    for (const s of PORT_SUBJECTS) expect(portHeading(s)).toBe(PORT.yaw);
  });
});
