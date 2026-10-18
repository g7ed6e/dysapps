// Les modèles des habitants dans la vue du monde ouvert (./habitantModels.ts) et leur chargement
// (../../importedCharacters.ts, `loadHabitant`) : à la demande, un lieu à la fois, sans jamais rejeter ; le pion tant que
// le modèle n'est pas prêt ; un maillage, un matériau texturé à facettes ; ce qui sort de la vue libéré. Sans WebGL : le
// fichier est lu sur le disque, l'image n'est pas décodée (un faux `createImageBitmap`).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadHabitant } from '../../importedCharacters';
import { forgetHabitants, HABITANT_HEIGHT, loadedHabitant } from '../../world/continu/habitants';
import { scenetteDecor, scenetteSetting } from '../../world/continu/scenette';
import { createHabitantModels } from './habitantModels';

const DOSSIER = resolve(__dirname, '../../../../docs/univers/archipeo/personnages/modeles');
const fichier = (nom: string) => {
  const b = readFileSync(resolve(DOSSIER, nom, 'final.glb'));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};

/** Un faux fetch : le fichier du dépôt dont l'adresse finit par le dossier demandé, ou une erreur 404. */
function fauxFetch(manquants: Set<string> = new Set()) {
  return vi.fn(async (url: string) => {
    const nom = /(6e-habitant-[a-z]+)\/final\.glb/.exec(String(url))?.[1];
    if (!nom || manquants.has(nom)) return new Response(null, { status: 404 });
    return new Response(fichier(nom));
  });
}

const bitmaps: { close: ReturnType<typeof vi.fn> }[] = [];
/** Attend que les promesses en cours (chargement, décodage) soient tenues. */
const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
};

beforeEach(() => {
  bitmaps.length = 0;
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => {
      const b = { width: 2048, height: 2048, close: vi.fn() };
      bitmaps.push(b);
      return b;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  forgetHabitants();
});

describe('Le chargement d’un habitant', () => {
  it('lit le fichier du lieu demandé, et lui seul', async () => {
    const fetch = fauxFetch();
    vi.stubGlobal('fetch', fetch);
    const m = await loadHabitant('6e-habitant-phare');
    expect(m).not.toBeNull();
    expect(m!.indices.length / 3).toBe(17_000);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0][0])).toContain('6e-habitant-phare/final.glb');
  });

  it('ne rejette jamais : un fichier qui manque rend rien, et ne se redemande qu’après le délai de relance', async () => {
    vi.useFakeTimers({ toFake: ['performance'] });
    const fetch = fauxFetch(new Set(['6e-habitant-beacons']));
    vi.stubGlobal('fetch', fetch);
    await expect(loadHabitant('6e-habitant-beacons')).resolves.toBeNull();
    await expect(loadHabitant('6e-habitant-beacons')).resolves.toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(31_000);
    await loadHabitant('6e-habitant-beacons');
    expect(fetch).toHaveBeenCalledTimes(2);
    // Un nom sans fichier : rien non plus.
    await expect(loadHabitant('6e-habitant-nulle-part')).resolves.toBeNull();
  });
});

describe('Les modèles dans la vue', () => {
  it('tant que le modèle n’est pas prêt, le pion reste ; prêt, il prend sa place, sa hauteur et son cap, un maillage texturé à facettes', async () => {
    vi.stubGlobal('fetch', fauxFetch());
    const scene = new THREE.Scene();
    const prepared: THREE.Texture[] = [];
    const h = createHabitantModels(scene, (t) => prepared.push(t));
    const at = { x: 3, y: 1, z: -2 };
    // La scénette s'ouvre avant que le fichier soit là : le pion, pour toute la scénette.
    expect(h.show('phare', at)).toBe(false);
    expect(loadedHabitant('phare')).toBeNull();
    expect(h.mesh.visible).toBe(false);
    await settle();
    expect(loadedHabitant('phare')).toBeNull();
    h.hide();
    // La fois suivante, il est prêt.
    expect(h.show('phare', at)).toBe(true);
    expect(loadedHabitant('phare')).not.toBeNull();
    expect(scenetteDecor('phare').triangles).toBe(scenetteSetting('phare').triangles);
    expect(h.mesh.visible).toBe(true);
    expect(h.mesh.position.toArray()).toEqual([3, 1, -2]);
    const box = new THREE.Box3().setFromObject(h.mesh);
    expect(box.min.y).toBeCloseTo(1, 4);
    expect(box.max.y).toBeCloseTo(1 + HABITANT_HEIGHT, 3);
    const material = h.mesh.material as THREE.MeshLambertMaterial;
    expect(material).toBeInstanceOf(THREE.MeshLambertMaterial);
    expect(material.flatShading).toBe(true);
    expect(material.map?.colorSpace).toBe(THREE.SRGBColorSpace);
    expect(material.map?.flipY).toBe(false);
    expect(prepared).toEqual([material.map]);
    // Un maillage, un matériau : un appel.
    expect(scene.children.filter((o) => o === h.mesh)).toHaveLength(1);
    expect(h.mesh.frustumCulled).toBe(true);
    h.hide();
    expect(h.mesh.visible).toBe(false);
    expect(loadedHabitant('phare')).toBeNull();
    h.dispose();
  });

  it('à l’approche d’un lieu, son modèle se prépare ; deux au plus sont gardés, le plus ancien libéré, jamais celui de la scénette', async () => {
    const fetch = fauxFetch();
    vi.stubGlobal('fetch', fetch);
    const scene = new THREE.Scene();
    const h = createHabitantModels(scene, () => {});
    h.prefetch('quais');
    h.prefetch('quais');
    await settle();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(h.show('quais', { x: 0, y: 0, z: 0 })).toBe(true);
    const quais = h.mesh.material as THREE.MeshLambertMaterial;
    const disposed = vi.spyOn(quais, 'dispose');
    h.prefetch('filets');
    await settle();
    h.prefetch('ecluses');
    await settle();
    // La scénette des Quais est ouverte : son modèle reste, celui des Filets part.
    expect(disposed).not.toHaveBeenCalled();
    expect(bitmaps[1].close).toHaveBeenCalled();
    h.hide();
    h.prefetch('engine');
    await settle();
    expect(disposed).toHaveBeenCalled();
    expect(bitmaps[0].close).toHaveBeenCalled();
    h.dispose();
    expect(scene.children).not.toContain(h.mesh);
    for (const b of bitmaps) expect(b.close).toHaveBeenCalled();
  });

  it('un fichier qui manque ou une image qui ne se décode pas : le pion reste, sans erreur', async () => {
    vi.stubGlobal('fetch', fauxFetch(new Set(['6e-habitant-ruins'])));
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('trop ancien');
      }),
    );
    const h = createHabitantModels(new THREE.Scene(), () => {});
    h.prefetch('ruins');
    h.prefetch('mangrove');
    await settle();
    expect(h.show('ruins', { x: 0, y: 0, z: 0 })).toBe(false);
    expect(h.show('mangrove', { x: 0, y: 0, z: 0 })).toBe(false);
    expect(loadedHabitant('mangrove')).toBeNull();
    h.dispose();
  });
});
