// L'équipage dans le monde ouvert du 6e (GD-27, lot 5, piste B ; GD-23, lot 4) : où chaque équipier se tient, ce qu'il
// dit, ce qu'il coûte, et le tour de rôle du geste avec l'habitant (./gestes.ts).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { IleId } from '../../biomes';
import { lireGlbTexture } from '../characters/imported/glb';
import { plansFor } from '../plans';
import { openWorldCost, openWorldCost5e, worldGestesCost } from './budget';
import { EQUIPIER_HEIGHT, equipierModelName, guideOf, type Equipier } from './equipage';
import { EQUIPIERS, EQUIPIER_FAR_FILE, EQUIPIER_FAR_TRIANGLES, EQUIPIER_OFFSET, EQUIPIER_ROLE, EQUIPIER_SPOT_OF, equipageCost, equipageInWorld, equipierFrame, equipierLine, equipierPlaces, equipierWorldHeight, placeEquipier } from './equipageMonde';
import { GESTE_CYCLE, GESTE_SETTLE, GESTE_TRIANGLES, TOOL_KIT, EQUIPIER_TOOL, gesteCandidates, gestePhase, gesteSlot, worldGestes } from './gestes';
import { habitantFit } from './habitants';
import { placeById, type ScenePlaceId } from './levelPlan';
import { levelWorld } from './levelWorld';
import { PLACES, type PlaceId } from './plan6e';
import { hasWorldHabitant, worldHabitantAt, worldHabitantHeight, worldHabitantScale, worldHabitantYaw } from './worldHabitants';

const DOSSIER = resolve(__dirname, '../../../../docs/univers/archipeo/personnages/modeles');
const lu = (e: Equipier) => {
  const b = readFileSync(resolve(DOSSIER, equipierModelName(e), EQUIPIER_FAR_FILE));
  return lireGlbTexture(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const GUIDED = PLACES.map((p) => p.id).filter((id) => guideOf(id) && hasWorldHabitant(id));
const ZIA = GUIDED.filter((id) => guideOf(id) === 'zia');
const MALO = GUIDED.filter((id) => guideOf(id) === 'malo');
/** Les parties d'un lieu (ses plans) et celle qui le rallume, la dernière. */
const partsOf = (place: import('./levelPlan').PlaceId): string[] => plansFor(placeById(place).island as IleId).map((p) => p.id);
const lastPlan = (place: PlaceId) => partsOf(place).at(-1)!;
const places = (relit: readonly PlaceId[], log: readonly { part: string }[]) => equipierPlaces(relit, log, partsOf);
const world = levelWorld('6e');
const ground = world.ground(world.field());
const ALL = PLACES.map((p) => p.id);

describe('les deux fichiers de loin', () => {
  it('Zia et Malo : au plus 1 500 triangles, texturés d’un JPEG, sans squelette, sans quart de tour', () => {
    for (const e of EQUIPIERS) {
      const m = lu(e);
      expect(m.indices.length / 3, e).toBeLessThanOrEqual(EQUIPIER_FAR_TRIANGLES);
      expect(m.indices.length / 3, e).toBeGreaterThan(1_000);
      expect(m.image.mimeType, e).toBe('image/jpeg');
      expect(habitantFit(m.positions, EQUIPIER_HEIGHT).yaw, e).toBe(0);
    }
    expect(equipageCost()).toEqual({ triangles: 2 * EQUIPIER_FAR_TRIANGLES, calls: 1 });
  });
});

describe('où chaque équipier se tient', () => {
  it('personne sans lieu rallumé guidé ; le premier rallumé selon le journal ; un lieu perdu du journal passe pour le plus ancien', () => {
    expect(places([], [])).toEqual({});
    expect(places(ALL.filter((p) => !guideOf(p)), [])).toEqual({});
    const [a, b] = ZIA;
    const log = [{ part: lastPlan(b) }, { part: lastPlan(a) }];
    expect(places([a, b], log)).toEqual({ zia: b });
    expect(places([b, a], log)).toEqual({ zia: b });
    // `a` n'est plus dans le journal : il passe pour le plus ancien.
    expect(places([a, b], [{ part: lastPlan(b) }])).toEqual({ zia: a });
    // Le lieu retenu dans la sauvegarde l'emporte, tant qu'il est rallumé ; sinon il est ignoré.
    expect(equipierPlaces([a, b], log, partsOf, { zia: a })).toEqual({ zia: a });
    expect(equipierPlaces([b], log, partsOf, { zia: a })).toEqual({ zia: b });
    expect(equipierPlaces([a, b], log, partsOf, { zia: 'nulle-part' })).toEqual({ zia: b });
    // Un lieu de Malo n'y change rien pour Zia, et l'ordre de l'équipage est fixe.
    const m = MALO[0];
    const both = places([m, a], []);
    expect(both).toEqual({ zia: a, malo: m });
    expect(equipageInWorld(both).map((e) => e.equipier)).toEqual(['zia', 'malo']);
    expect(equipageInWorld({ malo: m })).toEqual([{ equipier: 'malo', place: m }]);
  });

  it('un équipier ne change de lieu que si un lieu plus ancien reparaît : un lieu de plus, rallumé après, ne le déplace pas', () => {
    const [a, b] = MALO;
    const log = [{ part: lastPlan(a) }];
    expect(places([a], log)).toEqual({ malo: a });
    expect(places([a, b], [...log, { part: lastPlan(b) }])).toEqual({ malo: a });
  });

  it('à la gauche de l’habitant (à sa droite au-delà de l’outil aux Quais et aux Écluses), un demi-pas en retrait, au sol, même cap, à sa taille d’ado ; rien sans habitant', () => {
    for (const place of GUIDED) {
      const f = equipierFrame(place, ground)!;
      const at = worldHabitantAt(place, ground)!;
      const yaw = worldHabitantYaw(place);
      const h = worldHabitantHeight(place);
      const fwd = { x: Math.sin(yaw), z: Math.cos(yaw) };
      const right = { x: -Math.cos(yaw), z: Math.sin(yaw) };
      const dx = f.at.x - at.x, dz = f.at.z - at.z;
      const spot = EQUIPIER_SPOT_OF[place] ?? { side: -EQUIPIER_OFFSET.left, back: EQUIPIER_OFFSET.back };
      expect((dx * right.x + dz * right.z) / h, place).toBeCloseTo(spot.side, 6);
      expect((dx * fwd.x + dz * fwd.z) / h, place).toBeCloseTo(-spot.back, 6);
      // Jamais devant l'habitant, jamais sur lui : au moins 0,4 de sa hauteur de côté, en retrait.
      expect(Math.abs(spot.side), place).toBeGreaterThanOrEqual(0.4);
      expect(spot.back, place).toBeGreaterThan(0);
      // Au plus haut du pas (le sol à facettes sur la pente des Écluses), jamais plus bas que l'habitant.
      const foot = (0.5 * f.height) / h;
      for (const [ox, oz] of [[0, 0], [foot, 0], [-foot, 0], [0, foot], [0, -foot]]) expect(f.at.y, place).toBeGreaterThanOrEqual(ground(f.at.x + ox, f.at.z + oz) - 1e-9);
      expect(f.at.y, place).toBeGreaterThanOrEqual(at.y - 1e-9);
      expect(f.yaw, place).toBe(yaw);
      expect(f.height, place).toBeCloseTo(EQUIPIER_HEIGHT * worldHabitantScale(place), 9);
      expect(f.height, place).toBeLessThan(h);
      expect(equipierWorldHeight(place)).toBe(f.height);
    }
    expect(equipierFrame(ALL.find((p) => !hasWorldHabitant(p))!, ground)).toBeNull();
  });

  it('ses sommets mis en place : les pieds au repère, sa hauteur celle du repère, le visage vers le cap', () => {
    const place = ZIA[0];
    const f = equipierFrame(place, ground)!;
    const m = lu('zia');
    const out = placeEquipier(m.positions, f);
    expect(out).not.toBe(m.positions);
    let minY = Infinity, maxY = -Infinity, cx = 0, cz = 0;
    for (let i = 0; i < out.length; i += 3) {
      minY = Math.min(minY, out[i + 1]);
      maxY = Math.max(maxY, out[i + 1]);
      cx += out[i];
      cz += out[i + 2];
    }
    const n = out.length / 3;
    expect(minY).toBeCloseTo(f.at.y, 3);
    expect(maxY - minY).toBeCloseTo(f.height, 3);
    expect(Math.hypot(cx / n - f.at.x, cz / n - f.at.z)).toBeLessThan(f.height * 0.3);
  });
});

describe('ce qu’il dit', () => {
  it('une ligne fixe par équipier, dix mots au plus, un point, sans son prénom ; son rôle en étiquette', () => {
    for (const e of EQUIPIERS) {
      const line = equipierLine(e);
      expect(line.split(/\s+/).length, e).toBeLessThanOrEqual(10);
      expect(line, e).toMatch(/\.$/);
      expect(line.toLowerCase(), e).not.toContain(e);
      expect(EQUIPIER_ROLE[e], e).toMatch(/^L/);
    }
    expect(equipierLine('zia')).not.toBe(equipierLine('malo'));
  });
});

describe('son outil et le tour de rôle du geste', () => {
  const equipage = [
    { equipier: 'zia' as const, place: ZIA[0] },
    { equipier: 'malo' as const, place: MALO[0] },
  ];

  it('deux outils du kit, de deux pièces, sous 60 triangles, posés après ceux des habitants, repérés par l’équipier', () => {
    for (const e of EQUIPIERS) {
      const t = TOOL_KIT[EQUIPIER_TOOL[e]]();
      expect(t.pivot.y, e).toBeGreaterThan(0);
    }
    const alone = worldGestes(ALL, ground);
    const g = worldGestes(ALL, ground, () => true, undefined, equipage);
    expect(g.mobiles.length).toBe(alone.mobiles.length + 2);
    expect(g.facets.triangles - alone.facets.triangles).toBeLessThanOrEqual(2 * GESTE_TRIANGLES);
    expect(g.facets.triangles).toBeLessThanOrEqual(worldGestesCost('6e').triangles);
    const eq = g.mobiles.filter((m) => m.who);
    expect(eq.map((m) => [m.who, m.place])).toEqual(equipage.map((e) => [e.equipier, e.place]));
    expect(g.mobiles.slice(0, alone.mobiles.length).every((m) => !m.who)).toBe(true);
    // Près de l'équipier, à sa taille : le pivot de son outil sous sa hauteur, à moins de sa hauteur de ses pieds.
    for (const m of eq) {
      const f = equipierFrame(m.place, ground)!;
      expect(m.pivot.y - f.at.y).toBeLessThan(f.height);
      expect(m.pivot.y - f.at.y).toBeGreaterThan(0);
      expect(Math.hypot(m.pivot.x - f.at.x, m.pivot.z - f.at.z)).toBeLessThan(f.height);
    }
    // Dans la ruine, l'équipier n'est pas là : pas d'outil non plus ; hors de la liste des lieux, rien.
    expect(worldGestes(ALL, ground, () => false, undefined, equipage).mobiles).toEqual([]);
    expect(worldGestes(ALL.filter((p) => p !== ZIA[0]), ground, () => true, undefined, equipage).mobiles.filter((m) => m.who).length).toBe(1);
  });

  it('les candidats disent qui partage le geste', () => {
    const shown = GUIDED as ScenePlaceId[];
    const c = gesteCandidates(shown, ground, equipage);
    expect(c.find((x) => x.place === ZIA[0])?.shared).toBe('zia');
    expect(c.find((x) => x.place === MALO[0])?.shared).toBe('malo');
    expect(c.filter((x) => x.shared).length).toBe(2);
    expect(gesteCandidates(shown, ground).every((x) => !x.shared)).toBe(true);
  });

  it('seul, l’habitant sans fin ; partagé, l’habitant un cycle, un repos, l’équipier un cycle, un repos ; jamais deux à la fois', () => {
    const out = { who: null, phase: 0 } as Parameters<typeof gesteSlot>[2];
    const slot = (t: number, shared?: 'zia' | 'malo') => ({ ...gesteSlot(t, shared, out) });
    for (const t of [0, 1, 3.9, 4, 7, 13]) expect(slot(t)).toEqual({ who: null, phase: gestePhase(t) });
    const turn = GESTE_CYCLE + GESTE_SETTLE;
    expect(slot(0, 'zia')).toEqual({ who: null, phase: 0 });
    expect(slot(GESTE_CYCLE / 2, 'zia')).toEqual({ who: null, phase: 1 });
    expect(slot(GESTE_CYCLE + 0.5, 'zia')).toEqual({ who: null, phase: 0 });
    expect(slot(turn, 'zia')).toEqual({ who: 'zia', phase: 0 });
    expect(slot(turn + GESTE_CYCLE / 2, 'zia')).toEqual({ who: 'zia', phase: 1 });
    expect(slot(turn + GESTE_CYCLE + 0.5, 'zia')).toEqual({ who: 'zia', phase: 0 });
    expect(slot(2 * turn + 1, 'malo').who).toBeNull();
    expect(slot(3 * turn + 1, 'malo').who).toBe('malo');
    // Toujours une seule part, entre 0 et 1, continue au changement de tour.
    for (let t = 0; t < 4 * turn; t += 0.01) {
      const s = gesteSlot(t, 'zia', out);
      expect(s.phase).toBeGreaterThanOrEqual(0);
      expect(s.phase).toBeLessThanOrEqual(1);
    }
    expect(gesteSlot(turn - 1e-9, 'zia', out).phase).toBeCloseTo(0, 6);
    // Le même objet est rendu : rien d'alloué par image.
    expect(gesteSlot(1, 'zia', out)).toBe(out);
  });

  it('compté au budget du 6e hors scénette, et nulle part ailleurs', () => {
    const monde = openWorldCost(0, 'monde');
    expect(monde.find((p) => p.poste === 'équipage')).toEqual({ poste: 'équipage', ...equipageCost() });
    expect(openWorldCost(0, 'scenette').some((p) => p.poste === 'équipage')).toBe(false);
    expect(openWorldCost5e('monde').some((p) => p.poste === 'équipage')).toBe(false);
    expect(worldGestesCost('6e').triangles).toBe((worldGestes(ALL, ground).mobiles.length + EQUIPIERS.length) * GESTE_TRIANGLES);
  });
});
