// Le rallumage d'un Gardien en cubes (GD-8) : sans WebGL (jsdom), on vérifie ses couches, de la pierre aux couleurs,
// les placements reposés pendant le fondu et la libération des géométries.
import * as THREE from 'three';
import { HABILLAGES } from '../skin';
import { toutConstruit } from '../world/budget';
import { buildMesh } from '../world/mesher';
import { gardienDuMonde, guardianPlacements } from '../world/terrain';
import type { Instant, Monde } from './scenePart';
import { creerPersonnages } from './characters';

const { progress, world: village } = toutConstruit();

const monde = (): Monde => ({
  scene: new THREE.Scene(),
  archipel: '6e',
  habillage: HABILLAGES.blocland,
  surface: null,
  etendue: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
  centre: { x: 5, y: 5 },
  largeur: 10, liaisons: () => [],
});
const instant = (): Instant => ({
  now: 0,
  marche: false,
  traversee: null,
  navigue: null,
  carte: false,
  but: { target: new THREE.Vector3(), pos: new THREE.Vector3() },
});

/** Les couleurs des maillages visibles d'un Gardien posé. */
function couleursVisibles(p: ReturnType<typeof creerPersonnages>, id: string): string[] {
  const group = p.creatures.children.find((c) => c.userData.creature === id && c.userData.kind === 'guardian');
  const out: string[] = [];
  group?.traverseVisible((o) => {
    if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshLambertMaterial) out.push(`#${o.material.color.getHexString()}`);
  });
  return out;
}

/** La pierre éteinte d'une statue (`stoneOf`) : un gris froid, bleu de 24 de plus que le rouge. */
const estPierre = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, v, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return v - r === 8 && b - v === 16;
};

describe('Le rallumage d’un Gardien en cubes', () => {
  const gardiens = guardianPlacements('6e', progress, village.links);
  const id = gardiens[0].id;

  afterEach(() => vi.restoreAllMocks());

  it('part tout en pierre, se rallume couche par couche des pieds vers la tête, et finit dans ses couleurs', () => {
    let maintenant = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => maintenant);
    const p = creerPersonnages(monde(), () => null, instant(), null);
    p.poserLesCreatures(gardiens);
    p.rallumer(id, 1000);
    const debut = couleursVisibles(p, id);
    expect(debut.length).toBeGreaterThan(0);
    expect(debut.every(estPierre)).toBe(true);
    maintenant = 1500;
    p.animer?.(1, 0.016, false);
    const milieu = couleursVisibles(p, id);
    expect(milieu.some(estPierre)).toBe(true);
    expect(milieu.some((c) => !estPierre(c))).toBe(true);
    maintenant = 2000;
    p.animer?.(1, 0.016, false);
    expect(couleursVisibles(p, id).some(estPierre)).toBe(false);
    // Le fondu fini, plus de couches : un seul maillage, autant d'appels qu'un Gardien posé.
    expect(couleursVisibles(p, id)).toHaveLength(buildMesh(gardienDuMonde(id)).length);
    p.dispose();
  });

  it('l’Amphore peinte se rallume du col vers le pied (DA, HG-2)', () => {
    let maintenant = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => maintenant);
    const amphore = 'history-6e-antiquity';
    const p = creerPersonnages(monde(), () => null, instant(), null);
    p.poserLesCreatures(guardianPlacements('6e', progress, village.links));
    p.rallumer(amphore, 1000);
    maintenant = 1300;
    p.animer?.(1, 0.016, false);
    // Les hauteurs des maillages visibles, en pierre et en couleurs : le haut d'abord en couleurs, le bas encore en pierre.
    const hauteurs = (pierre: boolean) => {
      const group = p.creatures.children.find((c) => c.userData.creature === amphore && c.userData.kind === 'guardian');
      const out: number[] = [];
      group?.traverseVisible((o) => {
        if (!(o instanceof THREE.Mesh) || !(o.material instanceof THREE.MeshLambertMaterial)) return;
        if (estPierre(`#${o.material.color.getHexString()}`) !== pierre) return;
        o.geometry.computeBoundingBox();
        out.push(o.geometry.boundingBox!.min.y);
      });
      return out;
    };
    const [pierre, couleurs] = [hauteurs(true), hauteurs(false)];
    expect(pierre.length).toBeGreaterThan(0);
    expect(couleurs.length).toBeGreaterThan(0);
    expect(Math.min(...couleurs)).toBeGreaterThan(Math.max(...pierre));
    p.dispose();
  });

  it('d’un coup quand l’appareil demande moins d’animations', () => {
    const p = creerPersonnages(monde(), () => null, instant(), null);
    p.poserLesCreatures(gardiens);
    p.rallumer(id, 0);
    p.animer?.(0, 0.016, true);
    expect(couleursVisibles(p, id).some(estPierre)).toBe(false);
    p.dispose();
  });

  it('reposé pendant le fondu, il le reprend et libère les couches d’avant', () => {
    const dispose = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
    const p = creerPersonnages(monde(), () => null, instant(), null);
    p.poserLesCreatures(gardiens);
    p.rallumer(id, 1000);
    const avant = dispose.mock.calls.length;
    p.poserLesCreatures(gardiens);
    expect(dispose.mock.calls.length).toBeGreaterThan(avant);
    // Rebâti couche par couche : la tête encore en pierre, le fondu reprend là où il en est.
    expect(couleursVisibles(p, id).some(estPierre)).toBe(true);
    p.dispose();
  });
});
