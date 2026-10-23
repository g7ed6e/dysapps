// Les bras de mer et les ponts des terres (GD-20, point 3, « vraies terres, vrais ponts ») : l'eau profonde entre les
// terres, aucun chemin dessus, Kéo arrêté sur la culée d'un pont tombé et porté par le tablier d'un pont rebâti, le
// dessin des deux états et sur la Carte ; l'arche reliée de l'Épaule, sous son plafond, et aucune fente de lave dans le
// cadre de la marche sur elle (intention du pont de l'Épaule, « La lave et la marche »). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { ARCH_BRIDGE, BRIDGE, COL_GALLERY, GLACIER_BRIDGE, colRoofOpen, BRIDGE_TOUCH, KEO_STOP, SWING, allBridges, bridgeFacets, bridgeFloor, bridgeLayRest, bridgeLockPoint, bridgeMapMark, bridgeParts, bridgeSite, clampToOpen, isCabin, isSwing, swingPivot, swingRuin } from './bridges';
import { CUT_CLEARANCE_4E } from './paths4e';
import { COL_GALLERY_TRIANGLES_3E, EPAULE_BRIDGE_TRIANGLES, GLACIER_BRIDGE_TRIANGLES_3E } from './budget';
import { linearRgb } from './geometry';
import { bridgeEdge, landById, linkedLands, nodeLands } from './lands';
import { atNode, pathNode, pathRibbons, snapToNetwork, type NetworkPoint } from './paths';
import { BEACONS_FLAT, BRIDGE_ABUT, COMMONS_FLAT, ENGINE_FLAT, MANGROVE_FLAT, NORTH_FLATS, OBSERVATORY_FLAT, PATH_EDGES, RUINS_FLAT, SALT_FLAT, SHIPYARD_FLAT, placeById, type StraitId } from './plan6e';
import { STRAIT_BANK, buildHeightField, heightAt, heightOnMesh, landDistance, straitClearance } from './terrain';
import { shallowness } from './sea';
import { planFor } from './levelPlan';
import { COLORS_4E, CUVETTE_4E, LINKS_4E } from './plan4e';
import { followPose, screenOf } from './camera';
import { lavaFacets } from './terrain4e';
import { COLORS_5E } from './plan5e';
import { COLORS_3E } from './plan3e';
import { heightAt3e } from './terrain3e';

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

  it('relié, l’arche de basalte de l’Épaule : ses parapets, ses lanternes allumées, sous son plafond nommé', () => {
    const built = bridgeFacets('epaule', true);
    expect(built.triangles).toBeGreaterThan(bridgeFacets('epaule', false).triangles);
    expect(built.triangles).toBeLessThanOrEqual(EPAULE_BRIDGE_TRIANGLES);
    expect(has(built, COLORS_4E.basaltSun)).toBe(true);
    expect(has(built, COLORS_5E.lantern)).toBe(true);
    // Kéo marche sur le tablier, entre les parapets, plus étroit que le pont de bois.
    expect(ARCH_BRIDGE.walk).toBeLessThan(2 * ARCH_BRIDGE.half);
    const s = bridgeSite('epaule');
    expect(bridgeFloor(s.mid.x, s.mid.z, [], planFor('4e'))).not.toBeNull();
  });

  it('aucune fente de lave de la cuvette dans le cadre de la marche sur le pont de l’Épaule, aller comme retour, en 4:3 et en portrait', () => {
    const s = bridgeSite('epaule');
    // Le pont va de `fab-4` à `epa-1`, au cap de 331° (vers l'Épaule) ; le retour à 151°.
    const compass = ((Math.atan2(s.dir.x, -s.dir.z) * 180) / Math.PI + 360) % 360;
    expect(Math.abs(compass - 331)).toBeLessThan(2);
    const lava = lavaFacets().positions;
    const slits: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < lava.length; i += 3) {
      const p = { x: lava[i], y: lava[i + 1], z: lava[i + 2] };
      if (Math.hypot(p.x - CUVETTE_4E.center.x, p.z - CUVETTE_4E.center.z) < CUVETTE_4E.rx + 6) slits.push(p);
    }
    expect(slits.length).toBeGreaterThan(0);
    const plan = planFor('4e');
    const seen: string[] = [];
    for (let d = s.abut[0]; d <= s.abut[1]; d += 0.5) {
      const at = { x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d };
      const y = bridgeFloor(at.x, at.z, [], plan) ?? 0;
      for (const sign of [1, -1]) {
        // La caméra qui suit, derrière Kéo, tournée dans le sens de la marche.
        const yaw = Math.atan2(-sign * s.dir.x, -sign * s.dir.z);
        const pose = followPose({ x: at.x, y, z: at.z }, 0, undefined, yaw);
        const f = { x: pose.target.x - pose.position.x, y: pose.target.y - pose.position.y, z: pose.target.z - pose.position.z };
        for (const [w, h] of [
          [1024, 768],
          [390, 844],
        ])
          for (const p of slits) {
            if ((p.x - pose.position.x) * f.x + (p.y - pose.position.y) * f.y + (p.z - pose.position.z) * f.z <= 0) continue;
            const q = screenOf(pose, p, w, h);
            if (q.x >= 0 && q.x <= w && q.y >= 0 && q.y <= h) seen.push(`${d.toFixed(1)} ${sign > 0 ? 331 : 151} ${w}×${h}`);
          }
      }
    }
    expect([...new Set(seen)]).toEqual([]);
  });
});

describe('Le pont tournant des docks, au bassin à flot (intention du Bastion, 22 octobre 2026)', () => {
  const has = (f: { colors: ArrayLike<number> }, hex: number) => {
    const c = linearRgb(hex);
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - c[k]) < 1e-6)) return true;
    return false;
  };
  /**
   * Ce que le pont du bassin coûtait avant le pont tournant (le pont tombé générique, ses piles et son tablier de bois,
   * mesuré le 22 octobre 2026 sur `cd17fff1`) : le pont tournant ne coûte pas plus, en ruine, rebâti et pendant sa pose
   * (décision du mainteneur, « dans ce qu'il coûte aujourd'hui, ou moins »).
   */
  const BASSIN_BRIDGE_BEFORE = { ruin: 132, built: 1_142, lay: 1_122 } as const;
  const s = bridgeSite('bastion');
  const clearance = CUT_CLEARANCE_4E.bassin;
  const verts = (f: { positions: ArrayLike<number> }) => Array.from({ length: f.positions.length / 3 }, (_, i) => ({ x: f.positions[i * 3], y: f.positions[i * 3 + 1], z: f.positions[i * 3 + 2] }));

  it('seul le passage du bassin tourne', () => {
    expect(isSwing('bastion')).toBe(true);
    expect(isSwing('coteaux')).toBe(false);
    expect(isSwing('epaule')).toBe(false);
  });

  it('dans ce qu’il coûtait, en ruine comme rebâti, et sous 1 300 rebâti', () => {
    expect(bridgeFacets('bastion', false).triangles).toBeLessThanOrEqual(BASSIN_BRIDGE_BEFORE.ruin);
    expect(bridgeFacets('bastion', true).triangles).toBeLessThanOrEqual(BASSIN_BRIDGE_BEFORE.built);
    expect(bridgeFacets('bastion', true).triangles).toBeLessThan(1_300);
  });

  it('la ruine : la volée ouverte au-dessus de l’eau du bassin, en biais, au nord, le bas de son bout libre dans l’eau', () => {
    const ruin = verts(swingRuin(s));
    // Rien de la volée sur le quai : chacun de ses sommets au-dessus de l'eau.
    for (const p of ruin) expect(clearance(p)).toBeLessThan(0);
    // Couchée vers le nord (la mer du nord), loin du navire de la Soute, au sud.
    const across = ruin.reduce((n, p) => n + (p.x - s.near.x) * -s.dir.z + (p.z - s.near.z) * s.dir.x, 0) / ruin.length;
    expect(across).toBeLessThan(-4);
    for (const p of ruin) expect(p.z).toBeLessThan(s.mid.z + 3);
    // Le bout libre affaissé, le bas de ses poutres dans l'eau, le bout du tambour à hauteur du tablier ; le tablier hors
    // de l'eau sur toute sa longueur : la volée se lit entière (captures du 22 octobre 2026).
    expect(Math.min(...ruin.map((p) => p.y))).toBeLessThan(0);
    expect(Math.max(...ruin.map((p) => p.y))).toBeGreaterThan(BRIDGE.deck - 0.3);
    const deck = verts(swingRuin(s)).filter((p) => p.y > BRIDGE.deck - BRIDGE.plank - SWING.girder * 0.5);
    expect(Math.min(...deck.map((p) => p.y))).toBeGreaterThan(0.3);
  });

  it('la ruine montre son flanc au quai des Fabriques : couchée en biais, pas dans l’axe du regard', () => {
    // Vue du quai des Fabriques, au sud du pont (comme les captures du lot) : l'axe de la volée fait un angle franc avec le
    // regard vers son milieu (quatre degrés et demi seulement quand elle filait le long du quai : captures du 22 octobre 2026).
    const eye = { d: s.water[0] - 2, v: 24 };
    const pivot = swingPivot(s);
    const axis = { d: Math.cos(SWING.open), v: -Math.sin(SWING.open) };
    // Le milieu de la volée, à mi-chemin des deux culées quand elle est fermée, tourné avec elle.
    const u = (s.water[0] + s.water[1]) / 2 - pivot.d;
    const mid = { d: pivot.d + axis.d * u, v: axis.v * u };
    const sight = { d: mid.d - eye.d, v: mid.v - eye.v };
    const cos = Math.abs(sight.d * axis.d + sight.v * axis.v) / Math.hypot(sight.d, sight.v);
    expect((Math.acos(cos) * 180) / Math.PI).toBeGreaterThan(12);
  });

  it('le cadenas au-dessus de l’eau libre : rien de la ruine sous lui ni devant lui', () => {
    const lock = bridgeLockPoint('bastion');
    expect(clearance(lock)).toBeLessThan(0);
    const fallen = verts(bridgeFacets('bastion', false));
    // Les culées et le tambour restent au bord ; la volée, ouverte, est loin de la ligne du pont.
    for (const p of fallen) expect(Math.hypot(p.x - lock.x, p.z - lock.z)).toBeGreaterThan(3);
    // L'eau libre sur la ligne du pont, du pied de la volée (le tambour, et le coin de la volée tournée en biais, à moins
    // d'une unité de lui) jusqu'à la culée d'en face.
    const pivot = swingPivot(s);
    for (const p of fallen) {
      const d = (p.x - s.near.x) * s.dir.x + (p.z - s.near.z) * s.dir.z;
      const v = (p.x - s.near.x) * -s.dir.z + (p.z - s.near.z) * s.dir.x;
      if (Math.abs(v) < BRIDGE.width / 2) expect(d < pivot.d + SWING.drum + 0.6 || d > s.water[1] - BRIDGE.over - 0.1).toBe(true);
    }
  });

  it('rebâti : une volée sans pile ni pied dans l’eau, sur son tambour ; le fer bruni, la rouille seulement dans la ruine', () => {
    const built = bridgeFacets('bastion', true);
    const pivot = swingPivot(s);
    const drum = frameAt(s, pivot.d);
    // Sous l'eau, le tambour seul.
    const inWater = (p: { x: number; z: number }) => {
      const d = (p.x - s.near.x) * s.dir.x + (p.z - s.near.z) * s.dir.z;
      return d > s.water[0] + BRIDGE.over + 0.01 && d < s.water[1] - BRIDGE.over - 0.01;
    };
    for (const p of verts(built)) if (p.y < 0 && inWater(p)) expect(Math.hypot(p.x - drum.x, p.z - drum.z)).toBeLessThan(SWING.drum + 0.2);
    // La rouille de la volée, assombrie à la retouche 1 (point 7 : du fer, pas une planche orange).
    expect(has(built, 0x8a5a4a)).toBe(false);
    expect(has(bridgeFacets('bastion', false), 0x8a5a4a)).toBe(true);
    expect(has(bridgeFacets('bastion', false), COLORS_4E.rust)).toBe(false);
    expect(has(built, 0x5c504c)).toBe(true);
    // Les culées et le tambour restent pendant la pose : la ruine sans sa volée ni ses garde-corps tombés (sept barres de six triangles).
    expect(bridgeLayRest('bastion').triangles).toBe(bridgeFacets('bastion', false).triangles - swingRuin(s).triangles - 7 * 6);
    // Les garde-corps tombés, couchés avec la volée : du fer sombre.
    expect(has(bridgeFacets('bastion', false), 0x4e3a34)).toBe(true);
  });

  it('les quatre lanternes, allumées une fois relié (le verre d’ocre des ponts du 4e)', () => {
    // Un verre en pavé (10 triangles, posé : sans dessous) par lanterne.
    expect(glassTriangles(bridgeFacets('bastion', true), 0xe0a84a)).toBe(4 * 10);
    expect(glassTriangles(bridgeFacets('bastion', true), 0xdaa66a)).toBe(0);
  });

  it('Kéo marche sur le tablier rebâti, à sa hauteur ; pas sur la volée ouverte', () => {
    const plan = planFor('4e');
    const mid = s.mid;
    expect(bridgeFloor(mid.x, mid.z, [], plan)).toBeCloseTo(BRIDGE.deck, 5);
    expect(bridgeFloor(mid.x, mid.z, ['bastion'], plan)).toBeNull();
  });
});

/** Le point à `d` sur la ligne d'un pont. */
const frameAt = (s: { near: { x: number; z: number }; dir: { x: number; z: number } }, d: number) => ({ x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d });

/** Les triangles d'une couleur exacte (le verre d'une lanterne). */
function glassTriangles(f: { colors: Float32Array }, color: number): number {
  const c = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 9) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - c[k]) < 1e-6)) n++;
  return n;
}

describe('les lanternes des ponts (règle commune des ponts du 4e)', () => {
  const LIT = 0xe0a84a;
  const SABLE = 0xdaa66a;

  it('au 4e, les trois ponts reliés (bassin, ravin, coulée) ont leurs quatre lanternes allumées, d’ocre, et aucune avant', () => {
    for (const land of Object.keys(LINKS_4E) as (keyof typeof LINKS_4E)[]) {
      expect(glassTriangles(bridgeFacets(land, true), LIT)).toBe(4 * 10);
      expect(glassTriangles(bridgeFacets(land, true), SABLE)).toBe(0);
      // Pas encore relié : ni lanterne allumée, ni verre éteint.
      expect(glassTriangles(bridgeFacets(land, false), LIT)).toBe(0);
      expect(glassTriangles(bridgeFacets(land, false), SABLE)).toBe(0);
    }
  });

  it('au 6e et au 5e, rien ne change : le verre Sable, jamais l’ocre', () => {
    const others = [...linkedLands(planFor('6e')), ...linkedLands(planFor('5e'))].filter((l) => !(l in LINKS_4E) && !isCabin(l));
    expect(others.length).toBeGreaterThan(0);
    for (const land of others) {
      expect(glassTriangles(bridgeFacets(land, true), SABLE)).toBe(4 * 10);
      expect(glassTriangles(bridgeFacets(land, true), LIT)).toBe(0);
    }
  });
});

describe('Le pont du glacier relié, au 3e (proposition des Alpages, § 2)', () => {
  const has = (f: { colors: ArrayLike<number> }, hex: number) => {
    const c = linearRgb(hex);
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - c[k]) < 1e-6)) return true;
    return false;
  };
  const plan = planFor('3e');
  const s = bridgeSite('alpages');

  it('une arche de granit, son chemin de pierre claire, ses parapets coiffés d’ardoise ; ni lanterne, ni bois, sous son plafond nommé', () => {
    const built = bridgeFacets('alpages', true);
    expect(built.triangles).toBeGreaterThan(bridgeFacets('alpages', false).triangles);
    expect(built.triangles).toBeLessThanOrEqual(GLACIER_BRIDGE_TRIANGLES_3E);
    for (const hex of [COLORS_3E.granite, COLORS_3E.graniteSun, COLORS_3E.slate, COLORS_3E.slateTop, COLORS_3E.parvis]) expect(has(built, hex), hex.toString(16)).toBe(true);
    for (const hex of [COLORS_5E.lantern, 0xa9784a, 0xc6955f, COLORS_3E.bronze]) expect(has(built, hex), hex.toString(16)).toBe(false);
  });

  it('vue dans l’axe depuis le Versant, au cap de 313° ; le tablier monte en dos d’âne au-dessus de la glace, Kéo y marche entre les parapets', () => {
    const compass = ((Math.atan2(s.dir.x, -s.dir.z) * 180) / Math.PI + 360) % 360;
    expect(Math.abs(compass - 313)).toBeLessThan(2);
    const top = bridgeFloor(s.mid.x, s.mid.z, [], plan)!;
    expect(top - heightAt3e(s.mid)).toBeGreaterThan(GLACIER_BRIDGE.rise);
    // Fermé, le tablier manque : on ne marche pas au-dessus de la glace.
    expect(bridgeFloor(s.mid.x, s.mid.z, ['alpages'], plan)).toBeNull();
    // Le dessus monte et redescend sans marche, d'une culée à l'autre.
    let last = bridgeFloor(s.near.x + s.dir.x * s.abut[0], s.near.z + s.dir.z * s.abut[0], [], plan)!;
    for (let d = s.abut[0] + 0.25; d <= s.abut[1]; d += 0.25) {
      const y = bridgeFloor(s.near.x + s.dir.x * d, s.near.z + s.dir.z * d, [], plan)!;
      expect(Math.abs(y - last), String(d)).toBeLessThan(0.2);
      last = y;
    }
    const side = { x: s.mid.x - s.dir.z * (ARCH_BRIDGE.walk - 0.1), z: s.mid.z + s.dir.x * (ARCH_BRIDGE.walk - 0.1) };
    expect(bridgeFloor(side.x, side.z, [], plan)).not.toBeNull();
  });
});

describe('La galerie du col reliée, au 3e (proposition du Cirque, § 2)', () => {
  const plan = planFor('3e');
  const s = bridgeSite('cirque');
  const local = (x: number, z: number) => {
    const dx = x - s.near.x,
      dz = z - s.near.z;
    return { d: dx * s.dir.x + dz * s.dir.z, v: -dx * s.dir.z + dz * s.dir.x };
  };
  const has = (f: { colors: ArrayLike<number> }, hex: number) => {
    const c = linearRgb(hex);
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - c[k]) < 1e-6)) return true;
    return false;
  };

  it('du granit, un toit d’ardoise enneigé, un dallage de pierre claire ; ni lanterne, ni bois, ni bronze, sous son plafond nommé', () => {
    const built = bridgeFacets('cirque', true);
    expect(built.triangles).toBeLessThanOrEqual(COL_GALLERY_TRIANGLES_3E);
    for (const hex of [COLORS_3E.granite, COLORS_3E.slate, COLORS_3E.snow, COLORS_3E.parvis]) expect(has(built, hex), hex.toString(16)).toBe(true);
    for (const hex of [COLORS_5E.lantern, 0xa9784a, COLORS_3E.bronze, COLORS_3E.wood]) expect(has(built, hex), hex.toString(16)).toBe(false);
  });

  it('vue dans l’axe depuis le Versant, au cap de 350° ; les arcades côté pic, à l’ouest, le mur plein côté nuages, à l’est', () => {
    const compass = ((Math.atan2(s.dir.x, -s.dir.z) * 180) / Math.PI + 360) % 360;
    expect(Math.abs(compass - 350)).toBeLessThan(2);
    // À mi-hauteur des murs, en travers de la galerie : à l'est, de la pierre sur toute la longueur ; à l'ouest, des vides
    // entre les piles (les arcs).
    const f = bridgeParts('cirque');
    const [arcades, wall] = f.piles;
    const covered = (m: typeof arcades, side: number) => {
      const y = s.base[0] + 0.08 + COL_GALLERY.spring - 0.2;
      const hits = new Set<number>();
      for (let i = 0; i < m.positions.length; i += 9) {
        const ys = [m.positions[i + 1], m.positions[i + 4], m.positions[i + 7]];
        if (Math.min(...ys) > y || Math.max(...ys) < y) continue;
        const ds = [0, 3, 6].map((o) => local(m.positions[i + o], m.positions[i + o + 2]));
        if (!ds.every((p) => Math.sign(p.v) === side)) continue;
        for (let d = Math.ceil(Math.min(...ds.map((p) => p.d)) * 4); d <= Math.max(...ds.map((p) => p.d)) * 4; d++) hits.add(d);
      }
      return hits.size / 4;
    };
    const len = s.water[1] - s.water[0] + 2 * COL_GALLERY.over;
    expect(covered(wall, 1)).toBeGreaterThan(len);
    expect(covered(arcades, -1)).toBeLessThan(len * 0.5);
  });

  it('Kéo y marche à plat, au niveau du chemin ; fermée, les éboulis l’arrêtent avant elle', () => {
    let last = bridgeFloor(s.near.x + s.dir.x * (s.water[0] - 1), s.near.z + s.dir.z * (s.water[0] - 1), [], plan)!;
    expect(last - s.base[0]).toBeLessThan(0.2);
    for (let d = s.water[0] - 1; d <= s.water[1] + 1; d += 0.5) {
      const y = bridgeFloor(s.near.x + s.dir.x * d, s.near.z + s.dir.z * d, [], plan)!;
      expect(Math.abs(y - last), String(d)).toBeLessThan(0.05);
      last = y;
    }
    expect(bridgeFloor(s.mid.x, s.mid.z, ['cirque'], plan)).toBeNull();
  });

  it('son toit s’ôte quand Kéo passe dessous, et seulement là', () => {
    expect(colRoofOpen('cirque', s.mid)).toBe(true);
    expect(colRoofOpen('cirque', s.near)).toBe(false);
    expect(bridgeFacets('cirque', true, 'bas', true).triangles).toBeLessThan(bridgeFacets('cirque', true).triangles);
    expect(has(bridgeFacets('cirque', true, 'bas', true), COLORS_3E.slate)).toBe(false);
    expect(colRoofOpen('alpages', s.mid)).toBe(false);
  });
});
