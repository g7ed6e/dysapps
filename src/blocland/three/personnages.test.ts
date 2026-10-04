// Le rallumage d'un Gardien en cubes (GD-8) : sans WebGL (jsdom), on vérifie les teintes du fondu, les placements
// reposés pendant le fondu et la libération des matériaux copiés.
import * as THREE from 'three';
import { HABILLAGES } from '../habillage';
import { toutConstruit } from '../world/budget';
import { guardianPlacements, stoneOf } from '../world/terrain';
import type { Instant, Monde } from './partie';
import { creerPersonnages } from './personnages';

const { progress, world: village } = toutConstruit();

const monde = (): Monde => ({
  scene: new THREE.Scene(),
  archipel: '6e',
  habillage: HABILLAGES.blocland,
  surface: null,
  etendue: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
  centre: { x: 5, y: 5 },
  largeur: 10,
});
const instant = (): Instant => ({
  now: 0,
  marche: false,
  traversee: null,
  navigue: null,
  carte: false,
  but: { target: new THREE.Vector3(), pos: new THREE.Vector3() },
});

/** Les matériaux des maillages d'un Gardien posé. */
function materiaux(p: ReturnType<typeof creerPersonnages>, id: string): THREE.MeshLambertMaterial[] {
  const group = p.creatures.children.find((c) => c.userData.creature === id && c.userData.kind === 'guardian');
  const out: THREE.MeshLambertMaterial[] = [];
  group?.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshLambertMaterial) out.push(o.material);
  });
  return out;
}
const hex = (c: THREE.Color) => `#${c.getHexString()}`;

describe('Le rallumage d’un Gardien en cubes', () => {
  const gardiens = guardianPlacements('6e', progress, village.links);
  const id = gardiens[0].id;

  afterEach(() => vi.restoreAllMocks());

  it('part du gris de sa pierre et finit dans ses couleurs, sur des matériaux à lui', () => {
    let maintenant = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => maintenant);
    const p = creerPersonnages(monde(), () => null, instant(), null);
    p.poserLesCreatures(gardiens);
    const partages = new Set(materiaux(p, id));
    p.rallumer(id, 1000);
    const debut = materiaux(p, id);
    expect(debut.length).toBeGreaterThan(0);
    // Des copies : le cache du monde, partagé, n'est jamais teint.
    expect(debut.some((m) => partages.has(m))).toBe(false);
    const gris = debut.map((m) => hex(m.color));
    expect(gris.every((g) => /^#([0-9a-f]{2})\1\1$/.test(g))).toBe(true);
    maintenant = 2000;
    p.animer?.(1, 0.016, false);
    const fin = materiaux(p, id).map((m) => hex(m.color));
    expect(fin).not.toEqual(gris);
    fin.forEach((c, i) => expect(stoneOf(c)).toBe(gris[i]));
    p.dispose();
  });

  it('d’un coup quand l’appareil demande moins d’animations', () => {
    const p = creerPersonnages(monde(), () => null, instant(), null);
    p.poserLesCreatures(gardiens);
    p.rallumer(id, 0);
    p.animer?.(0, 0.016, true);
    const couleurs = materiaux(p, id).map((m) => hex(m.color));
    expect(couleurs.some((c) => !/^#([0-9a-f]{2})\1\1$/.test(c))).toBe(true);
    p.dispose();
  });

  it('reposé pendant le fondu, il le reprend sans garder les anciennes copies', () => {
    const dispose = vi.spyOn(THREE.Material.prototype, 'dispose');
    const p = creerPersonnages(monde(), () => null, instant(), null);
    p.poserLesCreatures(gardiens);
    p.rallumer(id, 1000);
    const copies = materiaux(p, id);
    p.poserLesCreatures(gardiens);
    expect(materiaux(p, id)).toHaveLength(copies.length);
    expect(materiaux(p, id).some((m) => copies.includes(m))).toBe(false);
    expect(dispose.mock.contexts.filter((m) => copies.includes(m as THREE.MeshLambertMaterial))).toHaveLength(copies.length);
    // À la fin, les copies du fondu en cours sont libérées aussi.
    const dernieres = materiaux(p, id);
    p.dispose();
    expect(dispose.mock.contexts.filter((m) => dernieres.includes(m as THREE.MeshLambertMaterial))).toHaveLength(dernieres.length);
  });
});
