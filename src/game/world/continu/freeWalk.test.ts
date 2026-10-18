import { describe, expect, it } from 'vitest';
import { bridgeSite } from './bridges';
import { FREE_WALK, buildWalkGrid, cellOf, freeRoute, isWalkable, nearestWalkable, onPathCell, walkGridSteps } from './freeWalk';
import { distance, type Vec2 } from './geometry';
import { LANDS, LINKED_LANDS, landOf } from './lands';
import { pathNode } from './paths';
import { PLACES, placeById } from './plan6e';
import { buildHeightField, heightOnMesh, straitClearance } from './terrain';

const field = buildHeightField();
const t0 = performance.now();
const grid = buildWalkGrid(field);
const buildMs = performance.now() - t0;

describe('la grille de ce qui se marche', () => {
  it('se tire assez vite', () => {
    process.stderr.write(`grille ${grid.nx}×${grid.nz}, ${buildMs.toFixed(0)} ms\n`);
    expect(buildMs).toBeLessThan(4000);
  });

  it('marche la porte de chaque lieu, dans sa terre', () => {
    // La Gare maritime est au large, hors du terrain : on y va par le réseau.
    for (const pl of PLACES.filter((p) => p.id !== 'ferry')) {
      const door = pathNode(pl.door).at;
      const k = cellOf(grid, door);
      expect(onPathCell(grid, door), pl.id).toBe(true);
      expect(LANDS[grid.land[k]].id, pl.id).toBe(landOf(pl.id));
    }
  });

  it("ne marche ni l'eau ni le cœur d'un lieu", () => {
    let wet = 0;
    for (let k = 0; k < grid.kind.length; k++) {
      if (!grid.kind[k] || grid.kind[k] === 2) continue;
      const i = k % grid.nx;
      const p = { x: grid.minX + (i + 0.5) * grid.cell, z: grid.minZ + ((k - i) / grid.nx + 0.5) * grid.cell };
      if (heightOnMesh(field, p.x, p.z) < FREE_WALK.shore - 0.01 && straitClearance(p) < 0) wet++;
    }
    expect(wet).toBe(0);
    for (const pl of PLACES) expect(isWalkable(grid, pl.center, []), pl.id).toBe(false);
  });

  it('se tire par tranches, et la grille déjà tirée revient au premier pas', () => {
    expect(walkGridSteps(field).next()).toEqual({ done: true, value: grid });
    expect(buildWalkGrid(field)).toBe(grid);
  });

  it("garde les terres séparées : deux cases voisines d'herbe sont de la même terre", () => {
    for (let k = 0; k < grid.kind.length; k++) {
      if (grid.kind[k] !== 1) continue;
      const i = k % grid.nx;
      for (const n of [k + 1, k + grid.nx]) {
        if (i === grid.nx - 1 && n === k + 1) continue;
        if (n >= grid.kind.length || grid.kind[n] !== 1) continue;
        expect(grid.land[n]).toBe(grid.land[k]);
      }
    }
  });
});

describe('le trajet libre', () => {
  const quais = placeById('quais').center;
  const start = pathNode(placeById('phare').door).at;

  it('va dans un pré, hors des chemins, et chaque pas se marche', () => {
    // Un point d'herbe, loin des chemins, dans la terre de départ.
    let target: Vec2 | null = null;
    for (let k = 0; k < grid.kind.length && !target; k += 7) {
      if (grid.kind[k] !== 1 || LANDS[grid.land[k]].id !== 'pointe') continue;
      const i = k % grid.nx;
      const p = { x: grid.minX + (i + 0.5) * grid.cell, z: grid.minZ + ((k - i) / grid.nx + 0.5) * grid.cell };
      if (distance(p, start) > 25 && distance(p, start) < 50) target = p;
    }
    expect(target).not.toBeNull();
    const route = freeRoute(grid, start, target!, LINKED_LANDS)!;
    expect(route).not.toBeNull();
    expect(route[0]).toEqual(start);
    expect(route[route.length - 1]).toEqual(target);
    for (let s = 1; s < route.length; s++) {
      const a = route[s - 1];
      const b = route[s];
      const n = Math.ceil(distance(a, b) / 0.2);
      for (let q = 0; q <= n; q++) expect(isWalkable(grid, { x: a.x + ((b.x - a.x) * q) / n, z: a.z + ((b.z - a.z) * q) / n }, LINKED_LANDS)).toBe(true);
    }
    void quais;
  });

  it("n'entre pas dans une terre fermée : un pont tombé arrête Kéo sur sa culée", () => {
    const site = bridgeSite('couchant');
    const beyond = { x: site.mid.x + site.dir.x * 12, z: site.mid.z + site.dir.z * 12 };
    expect(isWalkable(grid, beyond, ['couchant'])).toBe(false);
    expect(isWalkable(grid, beyond, [])).toBe(true);
    const stop = nearestWalkable(grid, site.mid, ['couchant'])!;
    expect(distance(stop, site.stop.at)).toBeLessThan(2);
    const across = freeRoute(grid, start, nearestWalkable(grid, beyond, [])!, []);
    expect(across).not.toBeNull();
    expect(freeRoute(grid, start, nearestWalkable(grid, beyond, [])!, ['couchant'])).toBeNull();
  });

  it('fait un long trajet, du Phare au fond des Crêtes, toutes terres ouvertes, vite et sur des pas qui se marchent', () => {
    let far: Vec2 | null = null;
    for (let k = 0; k < grid.kind.length; k++) {
      if (grid.kind[k] !== 1 || LANDS[grid.land[k]].id !== 'cretes') continue;
      const i = k % grid.nx;
      const p = { x: grid.minX + (i + 0.5) * grid.cell, z: grid.minZ + ((k - i) / grid.nx + 0.5) * grid.cell };
      if (!far || distance(p, start) > distance(far, start)) far = p;
    }
    const t = performance.now();
    const route = freeRoute(grid, start, far!, [])!;
    const ms = performance.now() - t;
    process.stderr.write(`long trajet ${distance(start, far!).toFixed(0)} u, ${route.length} points, ${ms.toFixed(0)} ms\n`);
    expect(route).not.toBeNull();
    expect(ms).toBeLessThan(1500);
    for (let s = 1; s < route.length; s++) {
      const a = route[s - 1];
      const b = route[s];
      const n = Math.ceil(distance(a, b) / 0.2);
      for (let q = 0; q <= n; q++) expect(isWalkable(grid, { x: a.x + ((b.x - a.x) * q) / n, z: a.z + ((b.z - a.z) * q) / n }, [])).toBe(true);
    }
  });

  it("ramène un toucher dans l'eau au plus proche où l'on marche", () => {
    const sea = { x: placeById('phare').center.x, z: placeById('phare').center.z - 40 };
    const near = nearestWalkable(grid, sea, LINKED_LANDS);
    if (near) expect(isWalkable(grid, near, LINKED_LANDS)).toBe(true);
  });
});
