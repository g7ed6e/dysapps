// La Porte (lot 2 du monde ouvert du 4e) : le lieu par parties (le corps, le haut, les abords), une seule lanterne
// allumée dans la ruine, une trace par mission avec sa partie, le support vide du battant ouest avant comme après, aucun
// battant fermé, rien sur le chemin qui passe le portail, la scénette de l'avocate, les plafonds de 1 600 et 1 200
// triangles, aucune rouille claire, jamais une balance ni « loge ». Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, placePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_4E, COLORS_4E, PATH_EDGES_4E, PATH_NODES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteOf } from './scenette';
import { PORTE, PORTE_LAYOUT } from './porte4e';
import { PORTE_SURROUNDINGS } from './porteSurroundings';
import { SURROUNDINGS } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'porte')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.porte];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('porte', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));

function toSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe('La Porte, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['freedoms', 'justice', 'security-defence']);
    expect(hasScenette('porte')).toBe(true);
    expect(hasHabitantModel('porte')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'porte')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace ; le pilier ouest, l’auvent et la lanterne restent', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('porte').filter((p) => p.stage === 'ruine');
    expect(new Set(ruin.filter((p) => p.until).map((p) => p.until!.stage))).toEqual(new Set([0, 1, 2]));
    // Le pilier ouest, l'auvent de la cloche, la lanterne de l'avocate : toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + placeTrace('porte', posedTraces('porte', upTo(n), MISSIONS)).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
  });

  it('une seule lanterne allumée dans la ruine, celle de l’avocate ; trois au plus restaurée ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    expect(lit(1)).toBe(lit(0));
    expect(lit(2)).toBe(2 * lit(0));
    expect(lit(3)).toBeGreaterThan(lit(2));
    expect(lit(3)).toBeLessThanOrEqual(3 * lit(0));
  });

  it('jamais la rouille claire du lot 1, qui se lit orange au soleil bas', () => {
    for (let n = 0; n <= 3; n++) {
      expect(countColor(shown(n), COLORS_4E.rust), String(n)).toBe(0);
      expect(countColor(placeTrace('porte', posedTraces('porte', upTo(n), MISSIONS)), COLORS_4E.rust), String(n)).toBe(0);
    }
  });

  it('une trace par mission, posée avec sa partie', () => {
    const traces = (n: number) => posedTraces('porte', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3].map(traces)).toEqual([0, 1, 2, 3]);
    for (const m of MISSIONS) expect(PORTE.traces[m], m).toBeDefined();
  });

  it('le support vide et ses goujons nus, sur le battant ouest, avant comme après ; aucun battant jamais fermé', () => {
    // Le support est du fer rouillé brun éteint, la seule chose de cette couleur au lieu restauré.
    const support = (n: number) => countColor(shown(n), 0x6a483e);
    expect(support(0)).toBeGreaterThan(0);
    expect(support(3)).toBeGreaterThan(0);
    // Ouverts en grand (presque contre le mur), jamais à moins de 40° de fermés, en ruine comme restaurés.
    expect(PORTE_LAYOUT.gate.leaf.open).toBeGreaterThan(1);
    expect(PORTE_LAYOUT.gate.leaf.ruinOpen).toBeGreaterThan(0.7);
  });

  it('les piliers restent le repère : le toit de la salle est sous eux, le mur sans créneau sous la poutre', () => {
    expect(PORTE_LAYOUT.hall.apex).toBeLessThan(PORTE_LAYOUT.gate.h);
    expect(PORTE_LAYOUT.wall.h).toBeLessThan(PORTE_LAYOUT.gate.beam);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin qui passe le portail (à hauteur de Kéo)', () => {
    const edges = PATH_EDGES_4E.filter(([a, b]) => a === 'porte' || b === 'porte').map(([a, b]) => [nodes.get(a)!, nodes.get(b)!] as const);
    expect(edges.length).toBe(2);
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(3), true],
      [placeTrace('porte', posedTraces('porte', upTo(3), MISSIONS)), false],
    ];
    for (const [f, local] of sets) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        const onWay = edges.some(([a, b]) => toSegment({ x, z }, a, b) < 0.8);
        expect(low && onWay, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan de la Porte', () => {
  it('nomme la partie par son étape, puis dit sa phrase, jamais « loge »', () => {
    const island = PLACE.island as BiomeId;
    const words = placePoseWords(PLACE)!;
    const parties = partiesDe(island);
    expect(parties).toHaveLength(3);
    const said = [0, 1, 2].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    expect(said).toEqual(['Partie posée : le corps de la Porte. Les deux battants sont ouverts.', 'Partie posée : le haut de la Porte. La salle a son toit.', 'Partie posée : les abords de la Porte. Les bancs sont remis en cercle.']);
    for (const s of said) expect(s).not.toMatch(/loge/i);
  });
});

describe('La scénette de la Porte', () => {
  it('l’avocate, sans prénom, avec sa phrase du métier ; jamais « loge »', () => {
    expect(scenetteOf('porte').role).toBe('L’avocate');
    expect(scenetteOf('porte').greeting).toBe('L’avocate aide chacun à défendre ses droits.');
    for (const text of [scenetteOf('porte').role, scenetteOf('porte').greeting ?? '']) expect(text).not.toMatch(/loge/i);
  });

  it('la caméra arrive par la porte, dans l’axe du chemin qui passe le portail, dans sa vue d’arrivée basse', () => {
    const door = nodes.get('porte')!;
    const yaw = doorViewOf('porte');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const to = { x: PLACE.center.x + PORTE_LAYOUT.doorLook.x - door.x, z: PLACE.center.z + PORTE_LAYOUT.doorLook.z - door.z };
    expect((look.x * to.x + look.z * to.z) / Math.hypot(to.x, to.z)).toBeGreaterThan(0.99);
    expect(doorFrameOf('porte')!.height).toBeLessThan(0);
  });

  it('elle se joue dans le cercle des bancs, derrière le mur, hors du chemin ; ses traces aussi ; ses abords sont enregistrés', () => {
    const { dx, dz, half } = PORTE_LAYOUT.scene;
    expect(dz + half[1]).toBeLessThan(PORTE_LAYOUT.wall.z - 1);
    const fab2 = nodes.get('fab-2')!;
    const door = nodes.get('porte')!;
    for (const [x, z] of [[dx - half[0], dz - half[1]], [dx - half[0], dz + half[1]], [dx + half[0], dz], [dx, dz]])
      expect(toSegment({ x: PLACE.center.x + x, z: PLACE.center.z + z }, door, fab2), `${x}, ${z}`).toBeGreaterThan(1.5);
    expect(SURROUNDINGS.porte).toBeDefined();
    for (const r of PORTE_SURROUNDINGS.rocks) expect(toSegment({ x: PLACE.center.x + dx + r.dx, z: PLACE.center.z + dz + r.dz }, door, fab2), `${r.dx}, ${r.dz}`).toBeGreaterThan(1.5);
  });
});
