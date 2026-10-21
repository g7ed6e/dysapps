// Les bras de mer et les ponts des terres (GD-20, point 3, « vraies terres, vrais ponts ») : l'eau profonde entre les
// terres, aucun chemin dessus, Kéo arrêté sur la culée d'un pont tombé et porté par le tablier d'un pont rebâti, le
// dessin des deux états et sur la Carte. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { BRIDGE, BRIDGE_TOUCH, KEO_STOP, allBridges, bridgeFacets, bridgeFloor, bridgeLockPoint, bridgeMapMark, bridgeSite, clampToOpen } from './bridges';
import { linearRgb } from './geometry';
import { bridgeEdge, landById, linkedLands, nodeLands } from './lands';
import { atNode, pathNode, pathRibbons, snapToNetwork, type NetworkPoint } from './paths';
import { BEACONS_FLAT, BRIDGE_ABUT, COMMONS_FLAT, ENGINE_FLAT, MANGROVE_FLAT, NORTH_FLATS, OBSERVATORY_FLAT, PATH_EDGES, RUINS_FLAT, SALT_FLAT, SHIPYARD_FLAT, placeById, type StraitId } from './plan6e';
import { STRAIT_BANK, buildHeightField, heightAt, heightOnMesh, landDistance, straitClearance } from './terrain';
import { shallowness } from './sea';
import { planFor } from './levelPlan';
import { COLORS_4E, LINKS_4E } from './plan4e';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const LINKED_LANDS = linkedLands(PLAN);
const NODE_LANDS = nodeLands(PLAN);

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);

describe('Les bras de mer', () => {
  it('de l’eau profonde au milieu de chaque passage, des rives rocheuses au-dessus de l’eau', () => {
    for (const s of allBridges()) {
      expect(landDistance(s.mid), s.land as StraitId).toBeLessThan(0);
      expect(heightAt(s.mid), s.land as StraitId).toBeLessThan(-0.6);
      // L'eau profonde : aucun haut-fond où passer à gué.
      expect(shallowness(s.mid), s.land as StraitId).toBe(0);
      // La rive, près du pont : la levée de roche en deux gradins (relecture du lot 1, directeur artistique), le replat
      // du premier au ras de l'eau, puis toute la hauteur, 1,5 à 2 au-dessus de l'eau.
      // Le point du chemin, avant l'eau, à `c` unités d'elle.
      const at = (c: number) => {
        let d = s.water[0];
        while (straitClearance({ x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d }, s.land as StraitId) < c) d -= 0.02;
        return { x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d };
      };
      expect(heightAt(at(1)), s.land as StraitId).toBeGreaterThan(STRAIT_BANK.step * 0.8);
      expect(heightAt(at(1)), s.land as StraitId).toBeLessThan(STRAIT_BANK.height * 0.8);
      expect(heightAt(at(2.6)), s.land as StraitId).toBeGreaterThan(1.5);
      expect(heightAt(at(2.6)), s.land as StraitId).toBeLessThan(2.2);
    }
  });

  it('aucun chemin sur l’eau, sauf la digue, les pontons, les planches de la rivière et les quatre ponts', () => {
    const wet: string[] = [];
    PATH_EDGES.forEach(([a, b]) => {
      const A = pathNode(a).at;
      const B = pathNode(b).at;
      for (let k = 0; k <= 40; k++)
        if (landDistance({ x: A.x + ((B.x - A.x) * k) / 40, z: A.z + ((B.z - A.z) * k) / 40 }) < 0) {
          wet.push(`${a}–${b}`);
          break;
        }
    });
    const bridges = LINKED_LANDS.map((l) => PATH_EDGES[bridgeEdge(PLAN, l)].join('–'));
    expect(wet.filter((e) => !bridges.includes(e)).sort()).toEqual(['digue–ponton', 'lar-4–lar-5', 'lar-5–ferry', 'phare–digue', 'phare–port-quai', 'ponton–quais', 'sel-1–sel-2', 'tur-1–tur-2'].sort());
    // Le ruban des chemins s'arrête au début des culées : aucun de ses sommets au-dessus d'un bras de mer.
    const f = pathRibbons(ground);
    for (let i = 0; i < f.positions.length; i += 3) expect(straitClearance({ x: f.positions[i], z: f.positions[i + 2] })).toBeGreaterThan(BRIDGE_ABUT - 1);
  });

  it('les replats des lieux ne bougent pas : aucun bras de mer n’entre dans un replat ni dans son fondu', () => {
    const flats = [ENGINE_FLAT, MANGROVE_FLAT, RUINS_FLAT, OBSERVATORY_FLAT, COMMONS_FLAT, BEACONS_FLAT, SALT_FLAT, SHIPYARD_FLAT, ...NORTH_FLATS];
    // La rive, elle, est levée avant les replats (terrain.ts) : leur plat la recouvre.
    for (const f of flats) expect(straitClearance(f.center), `${f.center.x}, ${f.center.z}`).toBeGreaterThan(f.radius + f.fade);
  });
});

describe('Les ponts', () => {
  it('chaque pont : la culée de ce côté, l’eau, la culée d’en face ; Kéo s’arrête sur la culée, hors de l’eau', () => {
    for (const s of allBridges()) {
      expect(s.abut[0]).toBeLessThan(s.water[0]);
      expect(s.water[0]).toBeLessThan(s.water[1]);
      expect(s.water[1]).toBeLessThan(s.abut[1]);
      expect(straitClearance(s.stop.at, s.land as StraitId)).toBeGreaterThan(0);
      expect(straitClearance(s.stop.at, s.land as StraitId)).toBeLessThan(KEO_STOP + 0.3);
      // Le bout ouvert du pont est du côté de la terre d'avant.
      expect(NODE_LANDS.get(PATH_EDGES[s.edge][s.nearEnd])).toBe(landById(s.land).after);
    }
  });

  it('bridgeFloor : la culée porte toujours Kéo ; le tablier, seulement rebâti ; ailleurs, rien', () => {
    for (const s of allBridges()) {
      const at = (d: number) => ({ x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d });
      const mid = at((s.water[0] + s.water[1]) / 2);
      expect(bridgeFloor(mid.x, mid.z, [s.land])).toBeNull();
      expect(bridgeFloor(mid.x, mid.z, [])).toBe(BRIDGE.deck);
      const stop = s.stop.at;
      const floor = bridgeFloor(stop.x, stop.z, [s.land]);
      expect(floor).not.toBeNull();
      expect(floor!).toBeGreaterThan(heightAt(stop) - 0.3);
      expect(floor!).toBeLessThanOrEqual(BRIDGE.deck);
    }
    expect(bridgeFloor(placeById('phare').center.x, placeById('phare').center.z, LINKED_LANDS)).toBeNull();
  });

  it('clampToOpen : Kéo s’arrête sur la culée du pont à rebâtir d’abord, jamais dans une terre fermée', () => {
    const door = (id: Parameters<typeof placeById>[0]) => atNode(placeById(id).door);
    expect(clampToOpen(door('ruins'), ['couchant'])).toBe(bridgeSite('couchant').stop);
    // Le Large derrière le Couchant fermé : le pont du Couchant d'abord.
    expect(clampToOpen(door('ferry'), ['couchant', 'large'])).toBe(bridgeSite('couchant').stop);
    expect(clampToOpen(door('ferry'), ['large'])).toBe(bridgeSite('large').stop);
    // Rien de fermé, ou une terre ouverte : le point lui-même.
    const quais = door('quais');
    expect(clampToOpen(quais, LINKED_LANDS)).toBe(quais);
    const ruins = door('ruins');
    expect(clampToOpen(ruins, [])).toBe(ruins);
    expect(clampToOpen(ruins, ['levant', 'cretes'])).toBe(ruins);
    // Sur la liaison du pont : avant la culée, le point ; au-delà, la culée.
    for (const s of allBridges()) {
      const on = (t: number): NetworkPoint => snapToNetwork({ x: 0, z: 0 }) && { edge: s.edge, t, at: s.stop.at };
      const before = on(s.nearEnd === 0 ? s.stop.t / 2 : (1 + s.stop.t) / 2);
      const beyond = on(s.nearEnd === 0 ? (1 + s.stop.t) / 2 : s.stop.t / 2);
      expect(clampToOpen(before, [s.land])).toBe(before);
      expect(clampToOpen(beyond, [s.land])).toBe(s.stop);
      expect(clampToOpen(beyond, [])).toBe(beyond);
    }
  });

  it('tombé : culées, départ d’arche brisé, moignons ; rebâti : posé d’un coup, du bois neuf, dans un budget serré', () => {
    const wood = linearRgb(0xc6955f);
    const hasWood = (f: { colors: ArrayLike<number> }) => {
      for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - wood[k]) < 1e-6)) return true;
      return false;
    };
    for (const land of LINKED_LANDS) {
      const before = bridgeFacets(land, false);
      const after = bridgeFacets(land, true);
      expect(before.triangles).toBeGreaterThan(0);
      expect(after.triangles).toBeGreaterThan(before.triangles);
      expect(after.triangles).toBeLessThan(1300);
      expect(hasWood(before)).toBe(false);
      expect(hasWood(after)).toBe(true);
      // Le tablier, au-dessus de la rive rocheuse : on passe dessous en barque.
      expect(BRIDGE.deck).toBeGreaterThan(STRAIT_BANK.height);
    }
  });

  it('tombé (relecture du lot 1, directeur artistique) : deux moignons debout, 0,7 à 1,2 au-dessus de l’eau, rien de plus haut au milieu de l’eau ; le départ d’arche à 1,5 au moins ; le cadenas passé le milieu, côté terre fermée', () => {
    for (const s of allBridges()) {
      const f = bridgeFacets(s.land, false);
      const along = (i: number) => (f.positions[i] - s.near.x) * s.dir.x + (f.positions[i + 2] - s.near.z) * s.dir.z;
      // Le milieu de l'eau, hors des deux départs d'arche : seuls les moignons.
      const from = s.water[0] + BRIDGE.over + 2.2;
      const to = s.water[1] - BRIDGE.over - 1.5;
      let top = -Infinity;
      let arch = -Infinity;
      for (let i = 0; i < f.positions.length; i += 3) {
        const d = along(i);
        if (d > from && d < to) top = Math.max(top, f.positions[i + 1]);
        if (d > s.water[0] + BRIDGE.over && d < s.water[0] + BRIDGE.over + 1) arch = Math.max(arch, f.positions[i + 1]);
      }
      expect(top, s.land as StraitId).toBeGreaterThanOrEqual(0.7);
      expect(top, s.land as StraitId).toBeLessThanOrEqual(1.25);
      expect(arch, s.land as StraitId).toBeGreaterThanOrEqual(1.5);
      const lock = bridgeLockPoint(s.land);
      const d = (lock.x - s.near.x) * s.dir.x + (lock.z - s.near.z) * s.dir.z;
      expect(d, s.land as StraitId).toBeGreaterThan((s.water[0] + s.water[1]) / 2);
      expect(d, s.land as StraitId).toBeLessThan(s.water[1]);
    }
  });

  it('sur la Carte, chaque pont en trait double ; sa cible de toucher fait 48 px au moins', () => {
    for (const land of LINKED_LANDS) expect(bridgeMapMark(land).triangles).toBe(8);
    expect(2 * BRIDGE_TOUCH.pixels).toBeGreaterThanOrEqual(48);
  });
});

describe('Les ponts tombés du 4e (retouche 1 du lot 1)', () => {
  const has = (f: { colors: ArrayLike<number> }, hex: number) => {
    const c = linearRgb(hex);
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - c[k]) < 1e-6)) return true;
    return false;
  };
  const lands = Object.keys(LINKS_4E) as (keyof typeof LINKS_4E)[];

  it('la pierre grise du 4e, jamais la pierre claire du 6e', () => {
    for (const land of lands) {
      const f = bridgeFacets(land, false);
      expect(f.colors.length, land).toBeGreaterThan(0);
      for (const hex of [0xb9b2a3, 0xd8d1c2, 0xa39b8c]) expect(has(f, hex), `${land} ${hex.toString(16)}`).toBe(false);
    }
  });

  it('l’arche de basalte de l’Épaule à demi tombée, pour la coulée (GD-24)', () => {
    expect(LINKS_4E.epaule.cut).toBe('coulee');
    const arch = bridgeFacets('epaule', false);
    expect(has(arch, COLORS_4E.basaltSun)).toBe(true);
    // Le basalte ne va qu'à la coulée : le pont du ravin et celui du bassin restent de pierre grise.
    expect(has(bridgeFacets('coteaux', false), COLORS_4E.basaltSun)).toBe(false);
    expect(has(bridgeFacets('coteaux', false), COLORS_4E.stone)).toBe(true);
  });
});
