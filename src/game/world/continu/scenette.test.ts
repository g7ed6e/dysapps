// La scénette du Phare (piste 1, lot 2) : la place de la consigne, de la scène et de la rangée à l'écran (dispositions
// A et B), la caméra de la galerie, le décor de près, les cloches pendues, la lampe de la réussite, le regard levé. Les
// Quais (lot 3), les Filets et les Écluses (lot 4) : leur habitant, leur cadrage, leur réussite et leur retour. Sans
// Three.js.
import { describe, expect, it } from 'vitest';
import { FOLLOW, KEO_HEIGHT, LOOK_UP, followPose, lookUp, lookUpStep, orbitAround, screenOf } from './camera';
import { FacetBuilder, boundsOf, placeFacets } from './facets';
import { distance, linearRgb } from './geometry';
import { startOf } from './paths';
import { placeById } from './plan6e';
import { COMMONS, OBSERVATORY, SHIPYARD, SHORES, SLIP_N, STEAM_GAP, commonsPillars, drumFace, hullEdge, modelOfPlace } from './places';
import { ANSWER_LAYOUT, COMMONS_PAVING_RISE, ENGINE_PAVING_RISE, FOUNTAIN, JAUGE, LOCK, OBSERVATORY_BAY, OBSERVATORY_PAVING_RISE, PLANK, SHIPYARD_FLOOR_RISE, VALVE, answerObjects, plankOnHull, filetsBasketAt, fullBasket, itemScene, loadedBoat, lockFull, placeTrace, questionLayout, sceneSpot, swingTo, type ScreenBox } from './questionScene';
import {
  GALLERY,
  LANTERN,
  SCENETTE_LAYOUT,
  bellPlane,
  habitantHand,
  answersHang,
  scenetteCore,
  scenetteDecor,
  scenetteSurroundings,
  FOOT_SHADOW_TRIANGLES,
  scenetteHabitant,
  scenetteHidesPlace,
  scenetteKeo,
  scenetteLayout,
  scenetteOf,
  EXIT_VIEW,
  exitView,
  scenetteExit,
  GALLERY_VIEW,
  placeKeep,
  TRACE_VIEW,
  scenetteFinale,
  scenetteHidesPieces,
  scenetteTraces,
  scenettePose,
  answerLeaves,
  scenetteDeck,
  LAND_DECK,
  PHARE_SOCLE,
} from './scenette';
import { COLUMN } from './questions';
import { heightAt, standingHeight } from './terrain';

const layoutOf = (count: number, w: number, h: number, widen = 0) =>
  scenetteLayout({ count, widen }, w, h, questionLayout({ count, bells: true, widen }, w, h));
const overlap = (a: ScreenBox, b: ScreenBox) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const screens = [
  [1024, 768],
  [1180, 820],
  [768, 1024],
  [844, 390],
  [667, 375],
] as const;


describe('La place de la scénette à l’écran', () => {
  it('chaque lieu a sa scénette, chaque habitant nommé par son rôle seul, sans phrase d’accueil', () => {
    expect(scenetteOf('phare')).toEqual({ role: 'La gardienne du phare', greeting: null, placement: 'rangee' });
    expect(scenetteOf('quais')).toEqual({ role: 'Le docker', greeting: null, placement: 'rangee' });
    expect(scenetteOf('filets')).toEqual({ role: 'La pêcheuse', greeting: null, placement: 'rangee' });
    expect(scenetteOf('ecluses')).toEqual({ role: 'L’éclusier', greeting: 'L’éclusier ouvre et ferme l’écluse pour les bateaux.', placement: 'rangee' });
    expect(scenetteOf('saltworks')).toEqual({ role: 'La saunière', greeting: 'La saunière récolte le sel de la mer.', placement: 'rangee' });
    expect(scenetteOf('engine')).toEqual({ role: 'La machiniste', greeting: null, placement: 'rangee' });
    expect(scenetteOf('shipyard')).toEqual({ role: 'Le charpentier', greeting: null, placement: 'rangee' });
    expect(scenetteOf('observatory')).toEqual({ role: 'La photographe', greeting: null, placement: 'rangee' });
    expect(scenetteOf('commons')).toEqual({ role: 'Le couvreur', greeting: null, placement: 'rangee' });
  });

  it('sur un écran bas, la règle des Filets à droite au-dessus de la scène, la rangée sous la colonne', () => {
    for (const [w, h] of screens.filter(([, h]) => h < ANSWER_LAYOUT.low))
      for (const widen of [0, 1]) {
        const base = questionLayout({ count: 3, aid: true, widen }, w, h);
        const l = scenetteLayout({ count: 3, widen, column: true, aid: true }, w, h, base);
        const at = `${w}×${h}, cran ${widen}`;
        const stage = l.scenette!.stage;
        const aid = l.aid!;
        const panel = { left: l.panel.left, right: l.panel.left + l.panel.width, top: l.panel.top, bottom: l.panel.top + l.panel.maxHeight };
        // La règle sous la barre du haut, la scène dessous, jusqu'en bas, toutes deux à droite de la colonne.
        expect(aid.top, at).toBeGreaterThanOrEqual(ANSWER_LAYOUT.bar);
        expect(aid.bottom, at).toBeLessThanOrEqual(stage.top);
        expect(aid.left, at).toBeGreaterThanOrEqual(panel.right);
        expect(stage.left, at).toBe(aid.left);
        expect(stage.bottom, at).toBeLessThanOrEqual(h);
        expect(stage.bottom - stage.top, at).toBeGreaterThanOrEqual(100);
        for (const s of l.slots) {
          // Décalée d'un cran vers la droite (le premier panier n'est pas rogné), elle ne passe sous la scène que de ce cran.
          expect(s.hit.right, at).toBeLessThanOrEqual(stage.left + SCENETTE_LAYOUT.lowAidInset);
          expect(Math.min(...l.slots.map((o) => o.label.left)), at).toBeGreaterThanOrEqual(ANSWER_LAYOUT.edgeLow + SCENETTE_LAYOUT.lowAidInset);
          expect(s.hit.top, at).toBeGreaterThanOrEqual(panel.bottom);
          expect(s.label.bottom - s.label.top).toBeGreaterThanOrEqual(48);
          expect(s.label.right - s.label.left, at).toBeGreaterThanOrEqual(ANSWER_LAYOUT.minLabel);
        }
      }
    // Sur tablette, la règle reste dans la colonne.
    expect(scenetteLayout({ count: 3, column: true, aid: true }, 1024, 768, questionLayout({ count: 3, aid: true }, 1024, 768)).aid).toBeNull();
  });

  it('les réponses dans la colonne (lot L2) : ni rangée ni « Valider », la colonne jusqu’en bas, la scène à côté', () => {
    for (const [w, h] of screens)
      for (const column of [true, false]) {
        const base = questionLayout({ count: 0 }, w, h);
        const l = scenetteLayout({ count: 0, column, grand: !column }, w, h, base);
        const at = `${w}×${h}${column ? '' : ', A'}`;
        expect(l.slots, at).toEqual([]);
        expect(l.scenette.validate).toBeNull();
        expect(l.panel.top + l.panel.maxHeight, at).toBeGreaterThan(h - 20);
        expect(l.scenette.stage.bottom - l.scenette.stage.top, at).toBeGreaterThan(0);
        if (column || base.low) expect(l.scenette.stage.left, at).toBeGreaterThanOrEqual(l.panel.left + l.panel.width);
      }
  });

  it('un mot de réponse coupé à côté de la colonne : la rangée passe dessous, sur toute la largeur, ses étiquettes plus larges', () => {
    const base = questionLayout({ count: 3 }, 1024, 768);
    const beside = scenetteLayout({ count: 3, column: true }, 1024, 768, base);
    const wide = scenetteLayout({ count: 3, column: true, wideRow: true }, 1024, 768, base);
    expect(Math.min(...beside.slots.map((s) => s.hit.left))).toBeGreaterThanOrEqual(beside.panel.left + beside.panel.width);
    expect(Math.min(...wide.slots.map((s) => s.hit.left))).toBeLessThan(wide.panel.left + wide.panel.width);
    expect(wide.slots[0].label.right - wide.slots[0].label.left).toBeGreaterThan(ANSWER_LAYOUT.maxWidth);
    for (const s of wide.slots) expect(s.hit.top).toBeGreaterThanOrEqual(wide.panel.top + wide.panel.maxHeight);
  });

  it('aux Quais, la colonne à gauche sur tous les écrans (B), les nombres en rangée à droite de la colonne', () => {
    for (const [w, h] of screens)
      for (const widen of [0, 1, 2]) {
        const base = questionLayout({ count: 4, widen }, w, h);
        const l = scenetteLayout({ count: 4, widen, column: true }, w, h, base);
        const at = `${w}×${h}, cran ${widen}`;
        const stage = l.scenette!.stage;
        expect(l.scenette!.validate).toBeNull();
        expect(stage.left, at).toBeGreaterThanOrEqual(l.panel.left + l.panel.width);
        const panel = { left: l.panel.left, right: l.panel.left + l.panel.width, top: l.panel.top, bottom: l.panel.top + l.panel.maxHeight };
        const xs = l.slots.map((s) => s.foot.x);
        expect([...xs].sort((a, b) => a - b)).toEqual(xs);
        for (const s of l.slots) {
          expect(s.label.bottom - s.label.top).toBeGreaterThanOrEqual(48);
          expect(s.label.right - s.label.left, at).toBeGreaterThanOrEqual(ANSWER_LAYOUT.minLabel);
          expect(overlap(panel, s.hit), at).toBe(false);
          expect(overlap(stage, s.hit), at).toBe(false);
        }
      }
  });

  it('A, sur tablette : la consigne en haut, la scène au milieu, la rangée en bas, « Valider » en bas à droite', () => {
    for (const [w, h] of screens.filter(([, h]) => h >= ANSWER_LAYOUT.low)) {
      const l = layoutOf(6, w, h);
      const at = `${w}×${h}`;
      expect(l.low).toBe(false);
      const stage = l.scenette!.stage;
      expect(l.panel.left).toBeCloseTo(0.03 * w, 6);
      expect(l.panel.top).toBeCloseTo(0.03 * h, 6);
      expect(l.panel.left + l.panel.width, at).toBeLessThanOrEqual(0.74 * w + 1e-6);
      // « Vue simple » et la pause gardent leur place, en haut à droite.
      expect(l.panel.left + l.panel.width, at).toBeLessThanOrEqual(w - SCENETTE_LAYOUT.topRight + 1e-6);
      // La scène un peu plus bas que H 28-64 : le toit de la lanterne passe sous le panneau.
      expect(stage.top).toBeCloseTo(0.37 * h, 6);
      expect(stage.bottom, at).toBeLessThanOrEqual(0.66 * h + 1e-6);
      const v = l.scenette!.validate!;
      expect(v.right).toBeCloseTo(0.97 * w, 6);
      expect(v.bottom).toBeLessThanOrEqual(h);
      for (const [i, s] of l.slots.entries()) {
        expect(s.hit.top, at).toBeGreaterThanOrEqual(0.66 * h - 1e-6);
        expect(s.label.bottom, at).toBeLessThanOrEqual(0.9 * h + 1e-6);
        expect(s.label.bottom - s.label.top).toBeGreaterThanOrEqual(48);
        expect(s.label.right - s.label.left).toBeGreaterThanOrEqual(48);
        // L'objet au-dessus de son étiquette, dans la même cible.
        expect(s.foot.y).toBeLessThanOrEqual(s.label.top);
        expect(s.hit.top).toBeLessThanOrEqual(s.foot.y - l.objectHeight + 1e-6);
        if (i > 0) expect(s.hit.left - l.slots[i - 1].hit.right).toBeGreaterThanOrEqual(12 - 1e-9);
        expect(overlap(s.hit, v), at).toBe(false);
        // De l'air entre la rangée et « Valider ».
        if (s.label.right > v.left) expect(v.top - s.label.bottom, at).toBeGreaterThanOrEqual(20 - 1e-6);
        expect(overlap(s.hit, stage), at).toBe(false);
        const panel = { left: l.panel.left, right: l.panel.left + l.panel.width, top: l.panel.top, bottom: l.panel.top + l.panel.maxHeight };
        expect(overlap(panel, s.hit), at).toBe(false);
      }
    }
  });

  it('B, sur un écran bas : la colonne à gauche, la scène à droite, la rangée en bas, « Valider » dans la colonne', () => {
    for (const [w, h] of screens.filter(([, h]) => h < ANSWER_LAYOUT.low))
      for (const count of [3, 6])
        for (const widen of [0, 1, 2]) {
          const l = layoutOf(count, w, h, widen);
          const at = `${w}×${h}, ${count}, cran ${widen}`;
          const stage = l.scenette!.stage;
          expect(l.low).toBe(true);
          expect(l.scenette!.validate).toBeNull();
          expect(stage.left, at).toBeGreaterThanOrEqual(Math.max(0.4 * w, l.panel.left + l.panel.width));
          expect(stage.top).toBeCloseTo(0.16 * h, 6);
          expect(stage.bottom).toBeLessThanOrEqual(0.62 * h + 1e-6);
          for (const s of l.slots) {
            // L'objet garde au moins la hauteur de son étiquette : sur un écran très bas, la rangée monte un peu au-dessus
            // de 64 %, jamais dans la scène.
            expect(s.hit.top, at).toBeGreaterThanOrEqual(stage.bottom);
            expect(s.label.top, at).toBeGreaterThanOrEqual(0.64 * h);
            expect(s.label.bottom).toBeLessThanOrEqual(0.88 * h + 1e-6);
            expect(s.label.bottom - s.label.top).toBeGreaterThanOrEqual(48);
            const panel = { left: l.panel.left, right: l.panel.left + l.panel.width, top: l.panel.top, bottom: l.panel.top + l.panel.maxHeight };
            expect(overlap(panel, s.hit), at).toBe(false);
          }
        }
  });

  it('au plus grand texte, en A, le panneau passe sous « Vue simple » et la pause, sur toute la largeur', () => {
    for (const [w, h] of screens.filter(([, h]) => h >= ANSWER_LAYOUT.low)) {
      const base = questionLayout({ count: 6, bells: true }, w, h);
      const l = scenetteLayout({ count: 6, grand: true }, w, h, base);
      expect(l.panel.top).toBeCloseTo(0.03 * h + SCENETTE_LAYOUT.grandTop, 6);
      expect(l.panel.width).toBeCloseTo(w - 2 * 0.03 * w, 6);
      expect(l.panel.top + l.panel.maxHeight).toBeLessThanOrEqual(Math.min(...l.slots.map((s) => s.hit.top)));
    }
  });

  it('les réponses gardent leur ordre et leur place d’un item à l’autre', () => {
    expect(layoutOf(6, 1024, 768).slots).toEqual(layoutOf(6, 1024, 768).slots);
    const xs = layoutOf(6, 1024, 768).slots.map((s) => s.foot.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  });
});

describe('La galerie du Phare', () => {
  const floor = standingHeight(heightAt(placeById('phare').center)) + GALLERY.floor;

  it('la caméra cadre Kéo à gauche, la gardienne à droite, dans la scène, et la lanterne au-dessus d’eux', () => {
    for (const [w, h] of screens) {
      const l = layoutOf(6, w, h);
      const stage = l.scenette!.stage;
      const { pose, shift } = scenettePose('phare', stage, w, h);
      const on = (p: { x: number; y: number; z: number }) => {
        const s = screenOf(pose, p, w, h);
        return { x: s.x - shift.x, y: s.y - shift.y };
      };
      const keo = on(scenetteKeo('phare').at);
      const hand = on(habitantHand('phare'));
      const c = placeById('phare').center;
      const lantern = on({ x: c.x, y: floor + 2, z: c.z });
      const at = `${w}×${h}`;
      expect(keo.x, at).toBeLessThan(lantern.x);
      expect(hand.x, at).toBeGreaterThan(lantern.x);
      for (const p of [keo, hand, lantern]) {
        expect(p.x, at).toBeGreaterThanOrEqual(stage.left);
        expect(p.x, at).toBeLessThanOrEqual(stage.right);
        expect(p.y, at).toBeGreaterThanOrEqual(stage.top - 0.03 * h);
        expect(p.y, at).toBeLessThanOrEqual(stage.bottom + 1);
      }
      expect(lantern.y).toBeLessThan(keo.y);
    }
  });

  it('le décor de près : la galerie et sa rambarde au niveau de la galerie du Phare, la gardienne en peu de triangles', () => {
    const decor = scenetteDecor('phare');
    expect(decor.triangles).toBeGreaterThan(0);
    expect(decor.triangles).toBeLessThan(2500);
    const b = boundsOf(decor);
    expect(b.max[1]).toBeLessThan(floor + 1.6);
    expect(b.max[1]).toBeGreaterThan(floor + GALLERY.rail);
    // La galerie du modèle est au même niveau : le plancher de la scénette la recouvre.
    expect(modelOfPlace('phare').top).toBeGreaterThan(GALLERY.floor);
  });

  it('les cloches pendent à leur poutre devant la rambarde ; une cloche choisie se balance, sans changer de place', () => {
    const plane = bellPlane('phare');
    const c = placeById('phare').center;
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: c.x + dx, y: floor - 0.4, z: plane.z }));
    const hang = { hand: habitantHand('phare'), rail: plane.rail };
    const still = answerObjects('phare', points, 0.6, { hanging: hang });
    const swung = answerObjects('phare', points, 0.6, { picked: [1], hanging: hang });
    expect(swung.triangles).toBe(still.triangles);
    expect(Array.from(swung.positions)).not.toEqual(Array.from(still.positions));
    // Sans lettre : la cloche n'a que des volumes ; la frise de vagues est en saillie sur son corps.
    const b = boundsOf(still);
    expect(b.max[2]).toBeGreaterThan(plane.z);
    expect(b.min[2]).toBeLessThanOrEqual(plane.rail.z);
    // La lumière de la réaction : la même cloche, un peu plus grande.
    expect(itemScene('phare', { kind: 'cloches' }, true, points.slice(0, 1), 0.6).reaction?.facets.triangles).toBeGreaterThan(0);
  });

  it('la lumière d’une réussite part de la vitre éteinte du modèle ; au Phare, aucune réussite ne l’allume', () => {
    expect(LANTERN).toEqual({ off: 0xbfd0d3, on: 0xffd36b });
    // La lanterne s'allume quand son haut est posé (construction.ts, `lanternLit`), jamais à la réussite d'une scénette.
    expect(scenetteFinale('phare', { kind: 'cloches' }, 1)).toBeNull();
  });
});

describe('Le regard levé près du Phare', () => {
  const c = placeById('phare').center;
  const y0 = standingHeight(heightAt(c));
  const top = { x: c.x, y: y0 + modelOfPlace('phare').top, z: c.z };

  it('au départ, à 12 à 14 unités du Phare : la lanterne, Kéo entier et « Y aller » tiennent ensemble', () => {
    const start = startOf(placeById('phare').door, c).at;
    expect(distance(start, c)).toBeGreaterThanOrEqual(12);
    expect(distance(start, c)).toBeLessThanOrEqual(14 + 1e-6);
    const feet = { x: start.x, y: standingHeight(heightAt(start)), z: start.z };
    for (const [w, h] of [
      [1024, 768],
      [1180, 820],
      [844, 390],
      [667, 375],
    ] as const) {
      const pose = followPose(feet);
      const before = structuredClone(pose);
      lookUp(pose, top, feet, 1, h);
      const at = `${w}×${h}`;
      // La caméra ne recule pas et ne tourne pas ; elle peut descendre un peu, jamais sous `lowest`.
      expect(pose.position.x).toBe(before.position.x);
      expect(pose.position.z).toBe(before.position.z);
      expect(pose.position.y).toBeLessThanOrEqual(before.position.y);
      expect(pose.position.y).toBeGreaterThanOrEqual(feet.y + LOOK_UP.lowest - 1e-9);
      const lantern = screenOf(pose, top, w, h).y;
      expect(lantern, at).toBeGreaterThanOrEqual(h * LOOK_UP.minAir - 1e-6);
      expect(lantern, at).toBeLessThanOrEqual(h * LOOK_UP.air + 1e-6);
      expect(screenOf(pose, feet, w, h).y, at).toBeLessThanOrEqual(h - LOOK_UP.footRoom + 1e-6);
    }
  });

  it('de plus loin, seul le regard monte, la lanterne avec son air ; à mi-chemin, entre les deux', () => {
    const feet = { x: c.x, y: y0, z: c.z + 30 };
    const before = followPose(feet);
    const pose = followPose(feet);
    lookUp(pose, top, feet, 1, 768);
    expect(pose.position).toEqual(before.position);
    const lantern = screenOf(pose, top, 1024, 768).y;
    expect(lantern).toBeCloseTo(768 * LOOK_UP.air, 3);
    const half = followPose(feet);
    lookUp(half, top, feet, 0.5, 768);
    expect(screenOf(half, top, 1024, 768).y).toBeLessThan(lantern);
    expect(screenOf(half, top, 1024, 768).y).toBeGreaterThan(screenOf(before, top, 1024, 768).y);
  });

  it('le regard ne baisse jamais, et se lève en moins d’une seconde (d’un bloc avec « Réduire les animations »)', () => {
    const far = followPose({ x: c.x, y: y0, z: c.z + 200 });
    const pose = structuredClone(far);
    lookUp(pose, { x: c.x, y: y0 - 50, z: c.z }, { x: c.x, y: y0, z: c.z + 200 }, 1, 768);
    expect(pose).toEqual(far);
    let k = 0;
    let seconds = 0;
    while (k < 1) {
      k = lookUpStep(k, 1, 1 / 60, false);
      seconds += 1 / 60;
    }
    expect(seconds).toBeLessThanOrEqual(1);
    expect(lookUpStep(0, 1, 0, true)).toBe(1);
    expect(lookUpStep(1, 0, 0, true)).toBe(0);
    expect(FOLLOW.fov).toBeGreaterThan(0);
  });
});

describe('Le quai du docker', () => {
  const quay = scenetteKeo('quais').at;

  it('le docker, en quelques volumes, se tient sur le quai, à droite de Kéo, sa caisse et son crochet en main', () => {
    // Le décor de près sans les abords du lieu (./quaisSurroundings.ts) : le docker seul, et les ombres au pied.
    const docker = scenetteCore('quais');
    expect(docker.triangles).toBeGreaterThan(0);
    expect(docker.triangles).toBeLessThan(1500);
    const b = boundsOf(docker);
    // Debout sur la bande de devant du quai, à hauteur d'homme (Kéo est à l'échelle 0,6 de la scénette).
    expect(b.min[1]).toBeGreaterThanOrEqual(quay.y - 0.1);
    expect(b.max[1]).toBeLessThan(quay.y + 2.5);
    // Le décor de près porte aussi l'ombre au pied de Kéo (lot commun des scénettes) : à moins d'une unité de lui.
    expect(b.min[0]).toBeGreaterThan(quay.x - 1);
    expect(scenetteHabitant('quais').x).toBeGreaterThan(quay.x);
    // Ni lampe à allumer, ni cloches pendues : la caisse monte au crochet de la grue.
    expect(answersHang('quais')).toBe(false);
    expect(scenetteHidesPlace('quais')).toBe(true);
    expect(scenetteHidesPlace('phare')).toBe(false);
  });

  it('la caméra cadre Kéo à gauche et le docker à droite, dans la scène, sur tous les écrans', () => {
    for (const [w, h] of screens) {
      const base = questionLayout({ count: 4 }, w, h);
      const stage = scenetteLayout({ count: 4, column: true }, w, h, base).scenette!.stage;
      const { pose, shift } = scenettePose('quais', stage, w, h);
      const on = (p: { x: number; y: number; z: number }) => {
        const s = screenOf(pose, p, w, h);
        return { x: s.x - shift.x, y: s.y - shift.y };
      };
      const keo = on(quay);
      const docker = on(scenetteHabitant('quais'));
      const at = `${w}×${h}`;
      expect(keo.x, at).toBeLessThan(docker.x);
      for (const p of [keo, docker]) {
        expect(p.x, at).toBeGreaterThanOrEqual(stage.left);
        expect(p.x, at).toBeLessThanOrEqual(stage.right);
        expect(p.y, at).toBeGreaterThanOrEqual(stage.top - 0.03 * h);
        expect(p.y, at).toBeLessThanOrEqual(stage.bottom + 1);
      }
    }
  });
});

describe('Le retour de la scénette des Quais', () => {
  const exit = scenetteExit('quais')!;
  const feet = { x: exit.at.x, y: standingHeight(heightAt(exit.at)), z: exit.at.z };
  const boat = loadedBoat();
  const place = placeById('quais');

  it('Kéo reste sur le bord du quai, à côté de la proue de la barque ; ailleurs, il revient sur le chemin', () => {
    expect(scenetteExit('phare')).toBeNull();
    expect(exit.at.x).toBeGreaterThan(boat.at.x + boat.length / 2);
    expect(exit.at.z).toBeLessThan(boat.at.z - boat.width / 2);
    // Au sud du lieu, sur le quai : la barque est entre lui et la caméra.
    expect(exit.at.z).toBeGreaterThan(place.center.z + 8);
  });

  it('la caméra, tournée vers le nord, garde Kéo, la barque chargée et la grue dans le champ, au-dessus de « Y aller »', () => {
    for (const [w, h] of screens) {
      const pose = followPose(feet);
      exitView(pose, exit.keep, feet, 1);
      expect(pose.position.z, 'vers le nord').toBeGreaterThan(pose.target.z);
      expect(pose.position.x).toBeCloseTo(pose.target.x, 6);
      // Reculée au-dessus du bassin, au sud de la barque.
      expect(pose.position.z).toBeCloseTo(exit.keep.z + EXIT_VIEW.back, 6);
      const at = `${w}×${h}`;
      const pts = {
        pieds: feet,
        tete: { ...feet, y: feet.y + KEO_HEIGHT * 0.8 },
        proue: { x: boat.at.x + boat.length / 2, y: boat.at.y + 0.4, z: boat.at.z + boat.width / 2 },
        poupe: { x: boat.at.x - boat.length / 2 + 0.6, y: boat.at.y + 0.4, z: boat.at.z + boat.width / 2 },
        grue: { x: place.center.x - 2.6, y: feet.y + 6.3, z: place.center.z - 1.6 },
      };
      for (const [name, p] of Object.entries(pts)) {
        const s = screenOf(pose, p, w, h);
        expect(s.x, `${at} ${name}`).toBeGreaterThanOrEqual(0);
        expect(s.x, `${at} ${name}`).toBeLessThanOrEqual(w);
        expect(s.y, `${at} ${name}`).toBeGreaterThanOrEqual(0.08 * h);
        expect(s.y, `${at} ${name}`).toBeLessThanOrEqual(h - LOOK_UP.footRoom);
      }
    }
  });

  it('sans retour (Kéo reparti), la caméra qui suit reste telle quelle ; à mi-passage, elle est entre les deux', () => {
    const a = followPose(feet);
    const b = followPose(feet);
    exitView(b, exit.keep, feet, 0);
    expect(b).toEqual(a);
    const c = followPose(feet);
    exitView(c, exit.keep, feet, 0.5);
    expect(c.position.z).toBeGreaterThan(a.position.z);
    expect(c.position.z).toBeLessThan(exit.keep.z + EXIT_VIEW.back);
  });
});

describe('Les Filets et les Écluses (lot 4), les Marais salants (lot L5), la Turbine (lot L6a), le Chantier naval (lot L6b)', () => {
  const places = ['filets', 'ecluses', 'saltworks', 'engine', 'shipyard', 'mangrove', 'ruins', 'observatory', 'commons'] as const;

  it('la caméra cadre Kéo à gauche et l’habitant à droite, dans la scène, sur tous les écrans', () => {
    for (const place of places)
      for (const [w, h] of screens) {
        const base = questionLayout({ count: 4, aid: place === 'filets' }, w, h);
        const stage = scenetteLayout({ count: 4, column: true, aid: place === 'filets' }, w, h, base).scenette!.stage;
        const { pose, shift } = scenettePose(place, stage, w, h);
        const on = (p: { x: number; y: number; z: number }) => {
          const s = screenOf(pose, p, w, h);
          return { x: s.x - shift.x, y: s.y - shift.y };
        };
        const keo = on(scenetteKeo(place).at);
        const habitant = on(scenetteHabitant(place));
        const at = `${place} ${w}×${h}`;
        expect(keo.x, at).toBeLessThan(habitant.x);
        for (const p of [keo, habitant]) {
          expect(p.x, at).toBeGreaterThanOrEqual(stage.left);
          expect(p.x, at).toBeLessThanOrEqual(stage.right);
          expect(p.y, at).toBeGreaterThanOrEqual(stage.top - 0.03 * h);
          expect(p.y, at).toBeLessThanOrEqual(stage.bottom + 1);
        }
      }
  });

  it('le plancher de la scène ne s’enfonce jamais : Kéo et l’habitant au-dessus du sol, l’habitant en peu de triangles', () => {
    for (const place of places) {
      // Le plancher au point de la scène ; aux Marais salants, le dessus du muret, un peu au-dessus de la grève.
      const floor = scenetteKeo(place).at.y;
      expect(floor - sceneSpot(place).y).toBeGreaterThanOrEqual(0);
      expect(floor - sceneSpot(place).y).toBeLessThan(0.5);
      for (const p of [scenetteKeo(place).at, scenetteHabitant(place)]) {
        expect(p.y).toBe(floor);
        expect(standingHeight(heightAt(p))).toBeLessThanOrEqual(floor + 1e-9);
      }
      const decor = scenetteDecor(place);
      expect(decor.triangles).toBeGreaterThan(0);
      // Les abords du lieu (./surroundings.ts) à part : ils ont leur propre compte (le test de chaque lieu).
      expect(scenetteCore(place).triangles).toBeLessThan(1500);
      // Les paniers et les leviers sur une margelle à terre, à la hauteur du plancher ; la caisse des Quais seule part.
      expect(scenetteDeck(place)).toEqual({ y: floor + LAND_DECK, onLand: true });
      expect(answerLeaves(place)).toBe(false);
    }
    expect(scenetteDeck('quais').onLand).toBe(false);
    expect(answerLeaves('quais')).toBe(true);
  });

  it('les pièces du lieu s’effacent le temps de la scénette partout sauf au Phare (ses lampes sont sur la galerie)', () => {
    expect(scenetteHidesPieces('phare')).toBe(false);
    // À la Turbine et au Chantier naval, toutes leurs traces se cachent pendant une question en C (directeur artistique,
    // lot L6a).
    for (const place of ['quais', 'filets', 'ecluses', 'saltworks', 'engine', 'shipyard', 'mangrove', 'ruins', 'observatory', 'commons'] as const) expect(scenetteHidesPieces(place), place).toBe(true);
    // Une trace d'une autre mission dans le cadre se cache le temps de la scénette : les lanternes de la galerie
    // pendant l'Abattage syllabique et les Rimes-échelle ; elles restent pendant la Chasse au son, et au pied de la tour.
    const done = ['sound-hunt', 'syllables', 'rhymes'];
    expect(scenetteTraces('phare', done, 'syllables', true)).toEqual(['syllables', 'rhymes']);
    expect(scenetteTraces('phare', done, 'rhymes', true)).toEqual(['syllables', 'rhymes']);
    expect(scenetteTraces('phare', done, 'sound-hunt', true)).toEqual(done);
    expect(scenetteTraces('phare', done, 'syllables', false)).toEqual(done);
    expect(scenetteTraces('quais', ['doubles-halves'], 'tables', true)).toEqual(['doubles-halves']);
  });

  it('aux Filets, la réussite tend le filet raccommodé et pose un panier plein aux pieds de la pêcheuse, où il reste', () => {
    const f = scenetteFinale('filets', { kind: 'filets', catch: 'sardines', count: 3 }, 0.8, true, 'plurals')!;
    expect(f.clearsItem).toBe(true);
    expect(f.glow).toBeNull();
    expect(f.arc).toBeGreaterThan(0);
    // Le décor gagne le milieu du plancher (le filet l'a quitté) et le pan tendu sur le séchoir.
    expect(f.decor.triangles).toBeGreaterThan(scenetteDecor('filets').triangles);
    // Posé là où le panier des pièces du lieu reste dans le monde, à la même hauteur : rien ne saute au retour.
    const basket = filetsBasketAt();
    expect(f.to).toEqual(basket);
    const landed = boundsOf(f.landed);
    expect(landed.min[1]).toBeCloseTo(f.to.y, 6);
    const world = new FacetBuilder();
    fullBasket(world, basket);
    const placed = world.build();
    expect(f.landed.triangles).toBe(placed.triangles);
    for (const [k, v] of placed.positions.entries()) expect(f.landed.positions[k]).toBeCloseTo(v, 4);
    // Hors du plancher de séchage, devant lui : pas posé en l'air sur le sable une fois le plancher parti.
    expect(f.to.z).toBeGreaterThan(sceneSpot('filets').z + 1.6 + 0.35);
    expect(Math.abs(scenetteHabitant('filets').x - f.to.x)).toBeLessThan(1.5);
    // Le panier plein reste dans le monde, posé au sol, sur la terre.
    expect(heightAt(basket)).toBeGreaterThan(0);
    expect(placeTrace('filets', ['plurals']).triangles).toBeGreaterThan(f.moving.triangles);
  });

  it('aux Écluses, la barque attend devant la porte fermée ; à la réussite, le sas se remplit, la porte s’ouvre et la barque passe', () => {
    const o = sceneSpot('ecluses');
    for (const scene of [
      { kind: 'sas', n: 3, d: 4 },
      { kind: 'echelle', n: 5, d: 3 },
    ] as const) {
      const r = itemScene('ecluses', scene, true, [], 1).reaction!;
      expect(r.stay).toBe(true);
      // Dans le canal, sous le plancher, arrêtée avant la porte.
      expect(r.to.y).toBeLessThan(o.y);
      expect(r.to.z).toBeGreaterThan(o.z + LOCK.front);
      expect(r.to.z).toBeLessThan(o.z + LOCK.back);
      expect(r.to.x + 1.5).toBeLessThan(o.x + LOCK.gate - LOCK.mitre);
      const f = scenetteFinale('ecluses', scene, 1)!;
      expect(f.clearsItem).toBe(false);
      expect(f.from).toEqual(r.to);
      // Passée : toute la barque au-delà de la ligne de la porte, entre ses vantaux ouverts.
      expect(boundsOf(f.landed).min[0]).toBeGreaterThan(o.x + LOCK.gate);
      // La porte ouverte n'est pas la porte fermée ; le sas rempli s'ajoute devant la scène de l'item.
      expect(Array.from(scenetteDecor('ecluses', true).positions)).not.toEqual(Array.from(scenetteDecor('ecluses').positions));
      expect(f.decor.triangles).toBeGreaterThan(scenetteDecor('ecluses', true).triangles);
    }
    // Le sas rempli se lit part par part : une bande d'eau par part, un trait clair entre deux (5 boîtes de 10 triangles
    // pour 6 parts, plus le trait du niveau).
    expect(lockFull({ kind: 'sas', n: 6, d: 6 }).triangles).toBe((6 + 5 + 1) * 10);
    // Dans le monde, la porte d'amont fermée tant que la mission n'est pas réussie, puis ouverte, le sas rempli.
    expect(placeTrace('ecluses', ['number-line']).triangles).toBeGreaterThan(placeTrace('ecluses', []).triangles);
  });

  it('aux Écluses, la porte monte à l’épaule de l’éclusier, à côté de lui ; la barque passée reste dans la scène', () => {
    const o = sceneSpot('ecluses');
    const habitant = scenetteHabitant('ecluses');
    // La porte entre le sas et l'éclusier, à l'écart de son levier (0,62 à sa gauche) : il ne la cache pas.
    expect(habitant.x - 0.62 - (o.x + LOCK.gate)).toBeGreaterThan(0.8);
    expect(LOCK.gateTop).toBeGreaterThanOrEqual(0.9);
    const f = scenetteFinale('ecluses', { kind: 'sas', n: 6, d: 6 }, 1)!;
    const boat = boundsOf(f.landed);
    for (const [w, h] of screens) {
      const base = questionLayout({ count: 4 }, w, h);
      const stage = scenetteLayout({ count: 4, column: true }, w, h, base).scenette.stage;
      const { pose, shift } = scenettePose('ecluses', stage, w, h);
      for (const x of [boat.min[0], boat.max[0]]) {
        const p = screenOf(pose, { x, y: boat.max[1], z: (boat.min[2] + boat.max[2]) / 2 }, w, h);
        expect(p.x - shift.x, `${w}×${h}`).toBeGreaterThanOrEqual(stage.left);
        expect(p.x - shift.x, `${w}×${h}`).toBeLessThanOrEqual(stage.right);
      }
    }
  });

  it('un levier tenté est tiré vers l’élève ; à terre, la margelle descend jusqu’au sol', () => {
    const o = sceneSpot('ecluses');
    const pts = [0, 1, 2].map((i) => ({ x: o.x - 2 + 2 * i, y: o.y, z: o.z + 5 }));
    const still = answerObjects('ecluses', pts, 0.8);
    const tried = answerObjects('ecluses', pts, 0.8, { picked: [1] });
    expect(tried.triangles).toBe(still.triangles);
    expect(boundsOf(tried).max[2]).toBeGreaterThan(boundsOf(still).max[2]);
    const grounded = answerObjects('ecluses', pts, 0.8, { ground: o.y - 2 });
    expect(boundsOf(grounded).min[1]).toBeLessThan(o.y - 1.9);
  });

  it('au retour, Kéo reste à côté de la trace de la réussite, que la caméra garde dans le champ avec lui', () => {
    for (const place of places) {
      const exit = scenetteExit(place)!;
      const feet = { x: exit.at.x, y: standingHeight(heightAt(exit.at)), z: exit.at.z };
      expect(distance(exit.at, exit.keep)).toBeLessThan(7);
      for (const [w, h] of screens) {
        const pose = followPose(feet);
        exitView(pose, exit.keep, feet, 1);
        const at = `${place} ${w}×${h}`;
        for (const p of [feet, { ...feet, y: feet.y + KEO_HEIGHT * 0.8 }, exit.keep]) {
          const s = screenOf(pose, p, w, h);
          expect(s.x, at).toBeGreaterThanOrEqual(0);
          expect(s.x, at).toBeLessThanOrEqual(w);
          expect(s.y, at).toBeGreaterThanOrEqual(0.08 * h);
          expect(s.y, at).toBeLessThanOrEqual(h - LOOK_UP.footRoom);
        }
      }
    }
  });
});

describe('Une scénette se joue sur le lieu tel qu’il est bâti (GD-20, lot 1)', () => {
  const c = placeById('phare').center;
  const foot = standingHeight(heightAt(c));

  it('au Phare sans sa galerie : au pied de la tour, sur le socle, la caméra basse, Kéo à gauche et la gardienne à droite', () => {
    const keo = scenetteKeo('phare', false);
    const gardienne = scenetteHabitant('phare', false);
    expect(keo.at.y).toBeCloseTo(foot + PHARE_SOCLE, 6);
    expect(gardienne.y).toBeCloseTo(foot + PHARE_SOCLE, 6);
    // Sur le socle (son dessus, un heptagone de 2,9 de rayon), hors de la tour (1,7 à son pied).
    for (const p of [keo.at, gardienne]) {
      expect(Math.hypot(p.x - c.x, p.z - c.z)).toBeLessThan(2.9 * Math.cos(Math.PI / 7));
      expect(Math.hypot(p.x - c.x, p.z - c.z)).toBeGreaterThan(1.7 + 0.4);
    }
    for (const [w, h] of screens) {
      const stage = layoutOf(6, w, h).scenette!.stage;
      const low = scenettePose('phare', stage, w, h, false).pose;
      const high = scenettePose('phare', stage, w, h, true).pose;
      const pitch = (p: typeof low) => Math.atan2(p.position.y - p.target.y, Math.hypot(p.position.x - p.target.x, p.position.z - p.target.z));
      expect(pitch(low)).toBeLessThan(pitch(high) - 0.15);
      expect(low.position.y).toBeLessThan(foot + 6);
      const s = (p: { x: number; y: number; z: number }) => screenOf(low, p, w, h);
      expect(s(keo.at).x).toBeLessThan(s(gardienne).x);
    }
  });

  it('au Phare sans sa galerie : ni galerie ni rambarde, la gardienne et son maillet ; les cloches posées, pas pendues', () => {
    const decor = boundsOf(scenetteDecor('phare', false, false));
    expect(decor.max[1]).toBeLessThan(foot + PHARE_SOCLE + 1.6);
    expect(scenetteDecor('phare', false, false).triangles).toBeLessThan(scenetteDecor('phare').triangles);
    expect(answersHang('phare', false)).toBe(false);
    expect(answersHang('phare', true)).toBe(true);
    const deck = scenetteDeck('phare', false);
    expect(deck.onLand).toBe(true);
    expect(deck.y).toBeCloseTo(foot + PHARE_SOCLE + LAND_DECK, 6);
    // Les cloches debout sur une avancée du socle, qui descend jusqu'au sol ; leur lèvre posée sur elle.
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: c.x + dx, y: deck.y, z: c.z + 4.5 }));
    const bells = boundsOf(answerObjects('phare', points, 0.6, { ground: foot - 0.2 }));
    expect(bells.min[1]).toBeLessThanOrEqual(foot - 0.2 + 1e-6);
    expect(bells.max[1]).toBeLessThan(deck.y + 0.7);
    // Sans galerie, Kéo revient sur le chemin, la caméra garde le lieu.
    expect(scenetteExit('phare', false, 'sound-hunt')).toBeNull();
    expect(scenetteExit('quais', false)).toBeNull();
    expect(scenetteExit('filets', false)).toBeNull();
  });

  it('aux Quais sans leur grue : son pied seul, la bonne caisse va droit dans la barque', () => {
    const scene = { kind: 'quai', op: 'moitie', before: 10, after: 5 } as const;
    const o = sceneSpot('quais');
    const right = [{ x: o.x - 2, y: o.y, z: o.z + 4 }];
    const built = itemScene('quais', scene, true, right, 0.8, true);
    const bare = itemScene('quais', scene, true, right, 0.8, false);
    expect(bare.still.triangles).toBeLessThan(built.still.triangles);
    expect(boundsOf(bare.still).max[1]).toBeLessThan(boundsOf(built.still).max[1]);
    expect(bare.reaction!.to.y).toBeLessThan(built.reaction!.to.y);
    expect(bare.reaction!.to).toEqual(scenetteFinale('quais', scene, 0.8, false)!.to);
  });

  it('aux Filets sans séchoir, le filet raccommodé reste étendu sur le plancher ; aux Écluses sans leur haut, pas de porte', () => {
    const scene = { kind: 'filets', catch: 'sardines', count: 3 } as const;
    const built = scenetteFinale('filets', scene, 0.8, true, 'plurals')!;
    const bare = scenetteFinale('filets', scene, 0.8, false, 'plurals')!;
    // Sans les abords, le panier plein ne vient pas (il ne resterait pas au retour) ; aux autres missions, rien ne change.
    expect(bare.moving.triangles).toBe(0);
    expect(bare.landed.triangles).toBe(0);
    for (const m of ['word-classes', 'sorting', 'e-er-ez']) {
      expect(scenetteFinale('filets', scene, 0.8, true, m), m).toBeNull();
      expect(scenetteFinale('filets', { kind: 'enclos' }, 0.8, false, m), m).toBeNull();
    }
    expect(boundsOf(bare.decor).max[1]).toBeLessThan(boundsOf(built.decor).max[1]);
    expect(boundsOf(bare.decor).max[1]).toBeLessThan(sceneSpot('filets').y + 1.5);
    expect(scenetteDecor('ecluses', false, false).triangles).toBeLessThan(scenetteDecor('ecluses', false, true).triangles);
    expect(scenetteDecor('ecluses', true, false).triangles).toBeLessThan(scenetteDecor('ecluses', true, true).triangles);
  });
});

describe('le retour sans trace à garder', () => {
  it('la caméra garde le lieu, son centre au-dessus de son pied (le Phare, ou l’étape de la trace pas encore posée)', () => {
    expect(scenetteExit('quais', false)).toBeNull();
    for (const id of ['phare', 'quais', 'filets', 'ecluses'] as const) {
      const c = placeById(id).center;
      const k = placeKeep(id);
      expect(k.x).toBe(c.x);
      expect(k.z).toBe(c.z);
      expect(k.y).toBeGreaterThan(1);
    }
  });
});

describe('le retour d’une mission des Quais, des Écluses, des Filets et des Marais salants (GD-20, point 8)', () => {
  it('Kéo et la trace de la mission jouée dans le champ, la caméra au sud des deux, jamais d’aplomb', () => {
    const played = [
      ...['times-tables', 'make-ten', 'doubles-halves', 'word-problems', 'measures'].map((m) => ['quais', m] as const),
      ...['number-line', 'equivalence', 'sharing', 'place-value', 'fraction-sums'].map((m) => ['ecluses', m] as const),
      ...['word-classes', 'sorting', 'e-er-ez', 'plurals'].map((m) => ['filets', m] as const),
      ...['ordering', 'operations', 'scale', 'large-numbers', 'rounding-products'].map((m) => ['saltworks', m] as const),
      ...['states-of-matter', 'motion-signals', 'energy-circuits', 'materials-light'].map((m) => ['engine', m] as const),
      ...['object-function', 'materials', 'information-networks', 'solve-program'].map((m) => ['shipyard', m] as const),
      ...['living-groups', 'food-growth', 'planet-earth', 'life-enquiry'].map((m) => ['mangrove', m] as const),
      ...['early-humans', 'ancient-peoples', 'roman-empire', 'viewpoints'].map((m) => ['ruins', m] as const),
      ...['metropolises', 'low-density', 'inhabited-world'].map((m) => ['observatory', m] as const),
      ...['representatives', 'school-secularism', 'private-life'].map((m) => ['commons', m] as const),
    ];
    // Aux Filets, chaque mission garde sa trace (lot L4), le Troupeau son panier plein.
    const kept = new Set(['word-classes', 'sorting', 'e-er-ez', 'plurals'].map((m) => JSON.stringify(scenetteExit('filets', true, m)!.keep)));
    expect(kept.size).toBe(4);
    for (const [place, mission] of played) {
      const exit = scenetteExit(place, true, mission)!;
      const feet = { x: exit.at.x, y: standingHeight(heightAt(exit.at)), z: exit.at.z };
      for (const [w, h] of screens) {
        const pose = followPose(feet);
        exitView(pose, exit.keep, feet, 1, TRACE_VIEW);
        expect(pose.position.z - Math.max(feet.z, exit.keep.z)).toBeCloseTo(TRACE_VIEW.back, 6);
        for (const p of [feet, exit.keep]) {
          const s = screenOf(pose, p, w, h);
          expect(s.x, `${mission} ${w}×${h}`).toBeGreaterThanOrEqual(0);
          expect(s.x, `${mission} ${w}×${h}`).toBeLessThanOrEqual(w);
          expect(s.y, `${mission} ${w}×${h}`).toBeGreaterThanOrEqual(0);
          expect(s.y, `${mission} ${w}×${h}`).toBeLessThanOrEqual(h);
        }
      }
    }
  });
});

describe('le retour d’une mission du Phare (GD-20, point 8, lot L3)', () => {
  const c = placeById('phare').center;
  const y0 = standingHeight(heightAt(c));

  it('Kéo sur l’îlot, au sud de la trace de la mission jouée ; la caméra la garde dans le champ, au-dessus de la liste', () => {
    for (const mission of ['syllables', 'sound-hunt', 'rhymes']) {
      const exit = scenetteExit('phare', true, mission)!;
      expect(exit, mission).not.toBeNull();
      // Sur le plat de l'îlot, hors de la tour et de son socle, au-dessus de l'eau.
      expect(Math.hypot(exit.at.x - c.x, exit.at.z - c.z), mission).toBeGreaterThan(3.6);
      expect(Math.hypot(exit.at.x - c.x, exit.at.z - c.z), mission).toBeLessThan(10);
      expect(heightAt(exit.at), mission).toBeGreaterThan(0.5);
      expect(exit.at.z, mission).toBeGreaterThan(exit.keep.z);
      const feet = { x: exit.at.x, y: standingHeight(heightAt(exit.at)), z: exit.at.z };
      const view = exit.view ?? TRACE_VIEW;
      for (const [w, h] of screens) {
        const pose = followPose(feet);
        exitView(pose, exit.keep, feet, 1, view);
        expect(pose.position.z).toBeGreaterThan(pose.target.z);
        const s = screenOf(pose, exit.keep, w, h);
        expect(s.x, `${mission} ${w}×${h}`).toBeGreaterThanOrEqual(0);
        expect(s.x, `${mission} ${w}×${h}`).toBeLessThanOrEqual(w);
        expect(s.y, `${mission} ${w}×${h}`).toBeGreaterThanOrEqual(0);
        expect(s.y, `${mission} ${w}×${h}`).toBeLessThanOrEqual(h);
      }
    }
    // Les lampes de la Chasse au son sont sur la galerie : la caméra lève les yeux vers elle.
    const lamps = scenetteExit('phare', true, 'sound-hunt')!;
    expect(lamps.view).toBe(GALLERY_VIEW);
    expect(lamps.keep.y).toBeGreaterThan(y0 + 10);
    expect(scenetteExit('phare', true, 'mission-inconnue')).toBeNull();
  });
});


describe('Les Marais salants (GD-20, point 8, lot L5)', () => {
  const o = sceneSpot('saltworks');
  const jauge = { kind: 'jauge', start: 5, d: 10, n: 3 } as const;

  it('la saunière, en peu de triangles, sur le muret au bord du bassin ; le décor de près en un maillage léger', () => {
    const decor = scenetteDecor('saltworks');
    // Les deux ombres au pied (lot commun des scénettes) comprises ; les abords à part (./surroundings.test.ts).
    expect(decor.triangles - scenetteSurroundings('saltworks').triangles).toBeLessThan(400 + FOOT_SHADOW_TRIANGLES);
    const habitant = scenetteHabitant('saltworks');
    const keo = scenetteKeo('saltworks').at;
    expect(keo.x).toBeLessThan(o.x);
    expect(habitant.x).toBeGreaterThan(o.x);
    // Ni réussite qui change le décor, ni objet qui part : le sac se ferme et reste.
    expect(scenetteFinale('saltworks', jauge, 1)).toBeNull();
    expect(answerLeaves('saltworks')).toBe(false);
    expect(answersHang('saltworks')).toBe(false);
  });

  it('la jauge : deux entiers en panneaux de la page, rien de peint, l’eau pile sur sa graduation ; rien ne change après la réponse', () => {
    const before = itemScene('saltworks', jauge, false, [], 1);
    expect(before.labels.map((l) => l.text)).toEqual(['5', '6']);
    expect(before.reaction).toBeNull();
    const [low, high] = before.labels.map((l) => l.at.y);
    // L'eau : la face du dessus de la couleur des bassins, à 3 dixièmes de l'unité au-dessus de 5.
    const pan = linearRgb(0x5fb3e0);
    let water = -Infinity;
    for (let i = 0; i < before.still.colors.length; i += 3)
      if ([0, 1, 2].every((k) => Math.abs(before.still.colors[i + k] - pan[k]) < 1e-4)) water = Math.max(water, before.still.positions[i + 1]);
    expect(water).toBeCloseTo(low + 0.3 * (high - low), 6);
    const point = { x: o.x - 1, y: o.y, z: o.z + 2 };
    const after = itemScene('saltworks', jauge, true, [point], 0.8);
    expect(Array.from(after.still.positions)).toEqual(Array.from(before.still.positions));
    expect(after.labels).toEqual(before.labels);
    // Le sac de la bonne réponse se ferme d'un lien, à sa place, et le reste.
    expect(after.reaction).toMatchObject({ from: point, to: point, arc: 0, stay: true });
    expect(after.reaction!.facets.triangles).toBeGreaterThan(0);
    // Le bassin au repos : rien de l'item, aucun nombre.
    const idle = itemScene('saltworks', { kind: 'saline' }, true, [point], 0.8);
    expect(idle.labels).toEqual([]);
    expect(idle.reaction?.stay).toBe(true);
  });

  it('les graduations de la jauge restent à 8 px l’une de l’autre au moins, sur tous les écrans, au plus grand texte aussi ; au niveau 3, elles n’y tiendraient pas', () => {
    let worst = Infinity;
    let worstFrame = Infinity;
    for (const [w, h] of screens)
      for (const grand of [false, true])
        for (const widen of [0, 1, 2]) {
          const base = questionLayout({ count: 4, widen }, w, h);
          const stage = scenetteLayout({ count: 4, widen, column: !grand, grand }, w, h, base).scenette!.stage;
          const { pose } = scenettePose('saltworks', stage, w, h);
          const x = o.x + JAUGE.post,
            z = o.z + JAUGE.z + 0.2;
          const unit = Math.abs(screenOf(pose, { x, y: o.y + JAUGE.base, z }, w, h).y - screenOf(pose, { x, y: o.y + JAUGE.base + JAUGE.height, z }, w, h).y);
          worst = Math.min(worst, unit / 10);
          // Le niveau 3 (`frameFraction`) : la droite de 0 à 5, au pire en sixièmes, sur la même hauteur.
          if (w === 667) worstFrame = Math.min(worstFrame, unit / 30);
        }
    expect(worst).toBeGreaterThanOrEqual(8);
    expect(worstFrame).toBeLessThan(8);
  });

  it('les sacs de sel, tous les mêmes, debout sur leur claie ; un sac tenté penche, sans changer de place', () => {
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: o.x + dx, y: o.y + LAND_DECK, z: o.z + 2 }));
    const one = answerObjects('saltworks', points.slice(0, 1), 0.8, { ground: o.y });
    const three = answerObjects('saltworks', points, 0.8, { ground: o.y });
    const sacks = (f: typeof one) => f.triangles;
    // La claie s'allonge, chaque sac a ses triangles : trois sacs pour trois réponses.
    expect(sacks(three)).toBeGreaterThan(sacks(one));
    const tried = answerObjects('saltworks', points, 0.8, { ground: o.y, picked: [1] });
    expect(tried.triangles).toBe(three.triangles);
    expect(Array.from(tried.positions)).not.toEqual(Array.from(three.positions));
    const b = boundsOf(three);
    expect(b.min[1]).toBeCloseTo(o.y - 0.1, 6);
  });
});

describe('La Turbine (GD-20, point 8, lot L6a)', () => {
  const o = sceneSpot('engine');

  it('la machiniste, en peu de triangles, sur le dallage devant la chaudière, levé au-dessus du replat', () => {
    const decor = scenetteDecor('engine');
    // Les deux ombres au pied (lot commun des scénettes) comprises.
    expect(decor.triangles).toBeLessThan(400 + FOOT_SHADOW_TRIANGLES);
    // Des cheveux sombres et leur chignon, au-dessus de la tête (les lunettes relevées s'y lisent) ; la burette, un cône de
    // cuivre plus large en bas qu'en haut, et son bec fin (relecture de L6a : ni tête chauve, ni torche).
    const habitantAt = scenetteHabitant('engine');
    const of = (hex: number) => {
      const rgb = linearRgb(hex);
      const out: [number, number, number][] = [];
      for (let i = 0; i < decor.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(decor.colors[i + k] - rgb[k]) < 1e-6)) out.push([decor.positions[i], decor.positions[i + 1], decor.positions[i + 2]]);
      return out;
    };
    const hair = of(0x3b2a22);
    expect(Math.max(...hair.map((v) => v[1]))).toBeGreaterThan(habitantAt.y + 1.13 + 0.23);
    // Les jambes et les cheveux communs des habitants (directeur artistique, clôture de L8), le pantalon bleu lagon sombre ;
    // son chignon en plus, derrière, au-dessus de la coque.
    expectLegsAndHair(decor, habitantAt, 0x0f5650, 0x3b2a22);
    expect(hair.some((v) => v[2] < habitantAt.z - 0.2 && v[1] > habitantAt.y + 1.4)).toBe(true);
    const copper = of(0xc07a3e);
    const low = Math.min(...copper.map((v) => v[1]));
    const width = (y: number) => {
      const xs = copper.filter((v) => Math.abs(v[1] - y) < 1e-6).map((v) => v[0]);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(width(low)).toBeGreaterThan(3 * width(low + 0.26));
    // Le bec : du cuivre loin du corps de la burette, vers la soupape (à l'ouest).
    expect(Math.min(...copper.map((v) => v[0]))).toBeLessThan(habitantAt.x - 0.9);
    const keo = scenetteKeo('engine').at;
    const habitant = scenetteHabitant('engine');
    expect(keo.x).toBeLessThan(o.x);
    expect(habitant.x).toBeGreaterThan(o.x);
    // Le dallage monte au-dessus du replat (sans quoi il s'y confond) : Kéo et la machiniste dessus.
    expect(keo.y).toBeCloseTo(o.y + ENGINE_PAVING_RISE, 9);
    expect(boundsOf(decor).max[1]).toBeGreaterThan(o.y + ENGINE_PAVING_RISE - 1e-6);
    expect(scenetteFinale('engine', COLUMN, 1)).toBeNull();
    expect(answerLeaves('engine')).toBe(false);
    expect(answersHang('engine')).toBe(false);
  });

  it('aucun objet-réponse en scène : le C se joue dans la colonne', () => {
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: o.x + dx, y: o.y + LAND_DECK, z: o.z + 2 }));
    expect(answerObjects('engine', points, 0.8, { ground: o.y }).triangles).toBe(0);
  });

  it('la soupape, l’objet témoin : au repos sans réaction ; après une bonne réponse, le levier levé et une bouffée qui reste, au-dessus d’un écart d’air clair', () => {
    const before = itemScene('engine', COLUMN, false, []);
    expect(before.reaction).toBeNull();
    expect(before.labels).toEqual([]);
    const after = itemScene('engine', COLUMN, true, []);
    // Le levier se lève : mêmes facettes, autre place.
    expect(after.still.triangles).toBe(before.still.triangles);
    expect(boundsOf(after.still).max[1]).toBeGreaterThan(boundsOf(before.still).max[1] + 0.2);
    expect(after.reaction).toMatchObject({ arc: 0, stay: true });
    expect(after.reaction!.to.y).toBeGreaterThan(after.reaction!.from.y);
    // Entre le haut de la soupape (le chapeau, le levier levé) et le bas de la bouffée, l'écart d'air clair, dès son départ
    // (jamais collée, directeur du contenu pédagogique).
    const puff = boundsOf(placeFacets(after.reaction!.facets, after.reaction!.from));
    let under = -Infinity;
    const p = after.still.positions;
    for (let i = 0; i < p.length; i += 3) if (p[i] >= puff.min[0] && p[i] <= puff.max[0]) under = Math.max(under, p[i + 1]);
    expect(puff.min[1] - under).toBeGreaterThanOrEqual(STEAM_GAP - 1e-6);
    // La soupape au milieu, derrière Kéo et la machiniste ; la bouffée centrée au-dessus de son chapeau (directeur
    // artistique : jamais sur le flanc de la chaudière, au-dessus du contrepoids).
    const cap = o.y + ENGINE_PAVING_RISE + VALVE.riser + VALVE.body;
    expect(under).toBeGreaterThanOrEqual(cap);
    expect(Math.abs((puff.min[0] + puff.max[0]) / 2 - (o.x + VALVE.capX))).toBeLessThan(0.05);
    expect(Math.abs(after.reaction!.to.x - o.x)).toBeLessThan(0.5);
  });
});

describe('Le Chantier naval (GD-20, point 8, lot L6b)', () => {
  const o = sceneSpot('shipyard');
  const c = placeById('shipyard').center;
  const h0 = standingHeight(heightAt(c));
  /** Les sommets d'une couleur dans des facettes. */
  const of = (f: { colors: Float32Array; positions: Float32Array }, hex: number) => {
    const rgb = linearRgb(hex);
    const out: [number, number, number][] = [];
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - rgb[k]) < 1e-6)) out.push([f.positions[i], f.positions[i + 1], f.positions[i + 2]]);
    return out;
  };

  it('le charpentier, en peu de triangles, sur le plancher levé au-dessus de la grève : tablier ardoise, maillet en main', () => {
    const decor = scenetteDecor('shipyard');
    // Les deux ombres au pied (lot commun des scénettes) comprises.
    expect(decor.triangles).toBeLessThan(400 + FOOT_SHADOW_TRIANGLES);
    const habitant = scenetteHabitant('shipyard');
    const keo = scenetteKeo('shipyard').at;
    expect(keo.x).toBeLessThan(o.x);
    expect(habitant.x).toBeGreaterThan(o.x);
    expect(keo.y).toBeCloseTo(o.y + SHIPYARD_FLOOR_RISE, 9);
    // Le tablier ardoise (#4D6A82) par-devant, la chemise Brume ; la tête du maillet, de bois dur, au-dessus de sa main.
    const apron = of(decor, 0x4d6a82);
    expect(apron.length).toBeGreaterThan(0);
    expect(Math.min(...apron.map((v) => v[2]))).toBeGreaterThan(habitant.z);
    expect(of(decor, 0xe5ebe3).length).toBeGreaterThan(0);
    const mallet = of(decor, 0x8a5a36);
    expect(Math.min(...mallet.map((v) => v[1]))).toBeGreaterThan(habitant.y + 0.9);
    // Les jambes et les cheveux communs des habitants (directeur artistique, clôture de L8), le pantalon Nuit océan ; le
    // tablier s'arrête aux genoux, les chaussures se voient dessous ; la casquette couvre le haut des cheveux.
    expectLegsAndHair(decor, habitant, 0x142b38, 0x3b2a22);
    expect(Math.min(...apron.map((v) => v[1]))).toBeGreaterThan(habitant.y + 0.25);
    const cap = of(decor, 0x7a4e2e);
    const hairTop = Math.max(...of(decor, 0x3b2a22).filter((v) => Math.hypot(v[0] - habitant.x, v[2] - habitant.z) < 0.5).map((v) => v[1]));
    expect(Math.max(...cap.map((v) => v[1]))).toBeGreaterThan(hairTop);
    expect(answerLeaves('shipyard')).toBe(false);
    expect(answersHang('shipyard')).toBe(false);
    expect(scenetteFinale('shipyard', COLUMN, 1)).toBeNull();
  });

  it('aucun objet-réponse en scène : le C se joue dans la colonne', () => {
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: o.x + dx, y: o.y + LAND_DECK, z: o.z + 2 }));
    expect(answerObjects('shipyard', points, 0.8, { ground: o.y }).triangles).toBe(0);
  });

  it('la planche de bordé, l’objet témoin : sur ses tréteaux au repos ; après une bonne réponse, elle se lève et se plaque contre le flanc de la coque, où elle reste', () => {
    const before = itemScene('shipyard', COLUMN, false, []);
    expect(before.reaction).toBeNull();
    expect(before.labels).toEqual([]);
    const after = itemScene('shipyard', COLUMN, true, []);
    // Les tréteaux restent ; la planche les quitte.
    expect(after.still.triangles).toBeLessThan(before.still.triangles);
    const r = after.reaction!;
    expect(r).toMatchObject({ stay: true });
    expect(r.arc).toBeGreaterThan(0);
    // Au départ, couchée sur ses tréteaux (là où elle était dans la scène d'avant), à plat.
    const rest = boundsOf(before.still);
    expect(r.from.y).toBeLessThanOrEqual(rest.max[1] + 1e-6);
    expect(r.from.y).toBeGreaterThan(o.y + SHIPYARD_FLOOR_RISE + PLANK.trestle - 0.01);
    // À l'arrivée : sur le flanc sud-est, entre la couture du bordé et le liston, à peine hors de lui, son roulis celui
    // du flanc (presque debout, face à la caméra), son cap celui de la coque ; hors des accores.
    const hull = plankOnHull();
    expect(r.to).toEqual(hull.at);
    expect(r.turn!.roll).toBeGreaterThan(1);
    expect(r.turn!.roll).toBeLessThan(Math.PI / 2);
    expect(PLANK.band).toBe(2);
    const [lo, hi] = [hullEdge(PLANK.hull, 2, 1), hullEdge(PLANK.hull, 3, 1)];
    expect(r.to.y - h0).toBeGreaterThan(lo[1]);
    expect(r.to.y - h0).toBeLessThan(hi[1]);
    const out = (r.to.x - c.x - (lo[0] + hi[0]) / 2) * SLIP_N.x + (r.to.z - c.z - (lo[2] + hi[2]) / 2) * SLIP_N.z;
    expect(out).toBeGreaterThan(0);
    expect(out).toBeLessThan(0.1);
    // Un geste court : de ses tréteaux au flanc, moins de trois unités ; la planche sur la partie droite du flanc.
    expect(Math.hypot(r.to.x - r.from.x, r.to.z - r.from.z)).toBeLessThan(3);
    const half = PLANK.length / 2 / SHIPYARD.hull.length;
    expect(PLANK.hull - half).toBeGreaterThanOrEqual(0.4);
    expect(PLANK.hull + half).toBeLessThanOrEqual(0.7);
    // Hors des accores du flanc sud-est : aucun ne touche la coque à moins d'une demi-unité des bouts de la planche.
    for (const [side, ts] of SHORES) if (side > 0) for (const t of ts) expect(Math.abs(t - PLANK.hull) * SHIPYARD.hull.length, String(t)).toBeGreaterThan(PLANK.length / 2 + 0.5);
    // Sa face du dessous, plaquée contre le flanc, a sa couleur claire (on la voit).
    const down = r.facets.normals.findIndex((v, i) => i % 3 === 1 && v < -0.99);
    expect(down).toBeGreaterThan(0);
  });
});

describe('La Mangrove (GD-20, point 8, lot L8a)', () => {
  const o = sceneSpot('mangrove');
  const decor = scenetteDecor('mangrove');
  const of = (hex: number) => {
    const rgb = linearRgb(hex);
    const out: [number, number, number][] = [];
    for (let i = 0; i < decor.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(decor.colors[i + k] - rgb[k]) < 1e-6)) out.push([decor.positions[i], decor.positions[i + 1], decor.positions[i + 2]]);
    return out;
  };

  it('la botaniste, en peu de triangles : le bas du corps sombre, le haut clair, ses cheveux sombres et sa tresse, un petit carnet contre elle', () => {
    // Les deux ombres au pied (lot commun des scénettes) comprises.
    expect(decor.triangles).toBeLessThan(400 + FOOT_SHADOW_TRIANGLES);
    expect(scenetteOf('mangrove').role).toBe('La botaniste');
    const at = scenetteHabitant('mangrove');
    // Le bas sombre jusqu'au sol (jamais un seul prisme clair, relecture de L6b), le haut corail au-dessus.
    const low = of(0x2e4a5c);
    const high = of(0xf2a285);
    expect(Math.min(...low.map((v) => v[1]))).toBeCloseTo(at.y, 6);
    expect(Math.max(...low.map((v) => v[1]))).toBeLessThanOrEqual(Math.min(...high.filter((v) => Math.abs(v[0] - at.x) < 0.2).map((v) => v[1])) + 1e-6);
    // Les jambes et les cheveux communs aux quatre habitants du rivage sud, et la tresse dans le dos, au nord.
    expectLegsAndHair(decor, at, 0x2e4a5c, 0x3b2a22);
    expect(Math.min(...of(0x3b2a22).map((v) => v[2]))).toBeLessThan(at.z - 0.3);
    // Le carnet, petit, devant elle (vers la caméra), et sa sangle de cuir.
    const book = of(0x178078);
    const size = (vs: [number, number, number][], k: number) => Math.max(...vs.map((v) => v[k])) - Math.min(...vs.map((v) => v[k]));
    expect(size(book, 0)).toBeLessThan(0.25);
    expect(size(book, 1)).toBeLessThan(0.3);
    expect(Math.min(...book.map((v) => v[2]))).toBeGreaterThan(at.z + 0.2);
    expect(of(0x7a4e2e).length).toBeGreaterThan(0);
  });

  it('Kéo et la botaniste sur le platelage, juste au-dessus de celui du lieu ; la pirogue entre eux, derrière, sur l’eau ; aucun objet-réponse', () => {
    const keo = scenetteKeo('mangrove').at;
    const habitant = scenetteHabitant('mangrove');
    expect(keo.x).toBeLessThan(o.x);
    expect(habitant.x).toBeGreaterThan(o.x);
    const c = placeById('mangrove').center;
    expect(keo.y).toBeGreaterThan(standingHeight(heightAt(c)));
    expect(keo.y - standingHeight(heightAt(c))).toBeLessThan(modelOfPlace('mangrove').top);
    const boat = boundsOf(itemScene('mangrove', COLUMN, false, []).still);
    expect(boat.min[0]).toBeGreaterThan(keo.x);
    expect(boat.max[0]).toBeLessThan(habitant.x);
    expect(boat.max[2]).toBeLessThan(Math.min(keo.z, habitant.z));
    expect(boat.max[1]).toBeLessThan(keo.y);
    expect(scenetteFinale('mangrove', COLUMN, 1)).toBeNull();
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: o.x + dx, y: o.y + LAND_DECK, z: o.z + 2 }));
    expect(answerObjects('mangrove', points, 0.8, { ground: o.y }).triangles).toBe(0);
  });
});

describe('Les Ruines (GD-20, point 8, lot L8b)', () => {
  const o = sceneSpot('ruins');
  const decor = scenetteDecor('ruins');
  const of = (hex: number) => {
    const rgb = linearRgb(hex);
    const out: [number, number, number][] = [];
    for (let i = 0; i < decor.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(decor.colors[i + k] - rgb[k]) < 1e-6)) out.push([decor.positions[i], decor.positions[i + 1], decor.positions[i + 2]]);
    return out;
  };

  it('l’archéologue, en peu de triangles : le bas du corps sombre, le haut clair, ses cheveux gris courts, sa brosse de fouille', () => {
    // Les deux ombres au pied (lot commun des scénettes) comprises.
    expect(decor.triangles).toBeLessThan(400 + FOOT_SHADOW_TRIANGLES);
    expect(scenetteOf('ruins').role).toBe('L’archéologue');
    const at = scenetteHabitant('ruins');
    // Le bas sombre jusqu'au sol (jamais un seul prisme clair, relecture de L6b), le haut bleu ciel au-dessus.
    const low = of(0x5a4636);
    const high = of(0xa9c8de);
    expect(Math.min(...low.map((v) => v[1]))).toBeCloseTo(at.y, 6);
    expect(Math.max(...low.map((v) => v[1]))).toBeLessThanOrEqual(Math.min(...high.filter((v) => Math.abs(v[0] - at.x) < 0.2).map((v) => v[1])) + 1e-6);
    // Les jambes et les cheveux communs aux quatre habitants du rivage sud, gris froid chez lui ; rien sous la nuque (ni
    // tresse, ni chignon, ni barbe).
    expectLegsAndHair(decor, at, 0x5a4636, 0xa9a6a3);
    expect(Math.min(...of(0xa9a6a3).map((v) => v[1]))).toBeGreaterThan(at.y + 0.92);
    // La brosse : son manche de bois, sa monture plate plus large que lui, et la frange de ses soies, à sa main, plus
    // bas que la taille (jamais un maillet, ni un râteau).
    const wood = of(0xc8955a);
    const bristle = of(0x6f5a44);
    expect(Math.max(...wood.map((v) => v[0])) - Math.min(...wood.map((v) => v[0]))).toBeGreaterThan(0.2);
    expect(Math.max(...bristle.map((v) => v[1]))).toBeLessThan(at.y + 0.5);
    expect(Math.max(...bristle.map((v) => v[1]))).toBeLessThan(Math.min(...wood.map((v) => v[1])) + 1e-6);
  });

  it('Kéo et l’archéologue sur le dallage, juste au-dessus du sol ; le treuil de fouille entre eux, derrière, sous l’imposte ; aucun objet-réponse', () => {
    const keo = scenetteKeo('ruins').at;
    const habitant = scenetteHabitant('ruins');
    expect(keo.x).toBeLessThan(o.x);
    expect(habitant.x).toBeGreaterThan(o.x);
    expect(keo.y - o.y).toBeCloseTo(0.12, 6);
    const winch = boundsOf(itemScene('ruins', COLUMN, false, []).still);
    expect(winch.min[0]).toBeGreaterThan(keo.x + 0.3);
    expect(winch.max[0]).toBeLessThan(habitant.x - 0.3);
    expect(winch.max[2]).toBeLessThan(Math.min(keo.z, habitant.z));
    const c = placeById('ruins').center;
    expect(winch.max[1]).toBeLessThan(standingHeight(heightAt(c)) + 2.2);
    expect(scenetteFinale('ruins', COLUMN, 1)).toBeNull();
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: o.x + dx, y: o.y + LAND_DECK, z: o.z + 2 }));
    expect(answerObjects('ruins', points, 0.8, { ground: o.y }).triangles).toBe(0);
  });
});

describe('L’Observatoire (GD-20, point 8, lot L8c)', () => {
  const o = sceneSpot('observatory');
  const colored = (f: { colors: Float32Array; positions: Float32Array }, hex: number) => {
    const rgb = linearRgb(hex);
    const out: [number, number, number][] = [];
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - rgb[k]) < 1e-6)) out.push([f.positions[i], f.positions[i + 1], f.positions[i + 2]]);
    return out;
  };

  it('la photographe, en peu de triangles : le haut clair, le bas du corps sombre, sa chambre de bois sur trépied à côté d’elle', () => {
    const decor = scenetteDecor('observatory');
    // Les deux ombres au pied (lot commun des scénettes) comprises.
    expect(decor.triangles).toBeLessThan(400 + FOOT_SHADOW_TRIANGLES);
    const at = scenetteHabitant('observatory');
    // La veste lavande en haut, le pantalon gris chaud en bas (relecture de L6b : jamais un prisme clair jusqu'au sol) ;
    // deux jambes, des chaussures, des cheveux jusqu'à la nuque (relecture de L8c-d).
    const jacket = colored(decor, 0xb7a6d6);
    expect(Math.min(...jacket.map((v) => v[1]))).toBeGreaterThan(at.y + 0.4);
    expectLegsAndHair(decor, at, 0x4a4448, 0x3b2a22);
    // La chambre à l'est d'elle (vers le bord du cadre, jamais sur la baie).
    const wood = colored(decor, 0xa9784a);
    expect(Math.min(...wood.map((v) => v[0]))).toBeGreaterThan(at.x + 0.4);
    // Kéo à gauche, la photographe à droite, sur la dalle posée sur la terrasse.
    const keo = scenetteKeo('observatory').at;
    expect(keo.x).toBeLessThan(o.x);
    expect(at.x).toBeGreaterThan(o.x);
    expect(keo.y).toBeCloseTo(o.y + OBSERVATORY_PAVING_RISE, 9);
    expect(OBSERVATORY_PAVING_RISE).toBeGreaterThan(OBSERVATORY.terrace.top);
    expect(scenetteFinale('observatory', COLUMN, 1)).toBeNull();
    expect(answersHang('observatory')).toBe(false);
  });

  it('aucun objet-réponse en scène : le C se joue dans la colonne', () => {
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: o.x + dx, y: o.y + LAND_DECK, z: o.z + 2 }));
    expect(answerObjects('observatory', points, 0.8, { ground: o.y }).triangles).toBe(0);
  });

  it('le parapet reste sous les pieds de Kéo et de la photographe, sur tous les écrans (relecture de L8c-d) ; la dalle sans joints, hors du tambour', () => {
    const c = placeById('observatory').center;
    const T = OBSERVATORY.terrace;
    // Le bord intérieur du haut du parapet (le plus haut à l'écran), sur ses deux pans du sud, de part et d'autre de la
    // porte (places.ts : un pan tous les 36°, à 18° de l'est).
    const inner = T.r * Math.cos(Math.PI / T.sides) - 0.17 - 0.15;
    const top = o.y + T.top - 0.05 + 0.55;
    for (const [w, h] of screens) {
      const base = questionLayout({ count: 4 }, w, h);
      const stage = scenetteLayout({ count: 0, column: true }, w, h, base).scenette!.stage;
      const { pose } = scenettePose('observatory', stage, w, h);
      for (const feet of [scenetteKeo('observatory').at, scenetteHabitant('observatory')]) {
        const x = feet.x - c.x;
        const deg = x < 0 ? 126 : 54;
        const [ct, st] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
        const edge = { x: feet.x, y: top, z: c.z + (inner - x * ct) / st };
        expect(edge.z, `${w}×${h}`).toBeGreaterThan(feet.z);
        // À l'écran, le haut du parapet passe sous les pieds (y vers le bas).
        expect(screenOf(pose, edge, w, h).y, `${w}×${h}`).toBeGreaterThan(screenOf(pose, { ...feet, y: feet.y + 0.05 }, w, h).y);
      }
    }
    // La dalle : rien de plus sombre posé dessus (les joints se lisaient comme des bâtons), et son bord nord hors du tambour.
    const decor = scenetteDecor('observatory');
    const face = c.z + drumFace(OBSERVATORY.drum.r);
    const floor = o.y + OBSERVATORY_PAVING_RISE;
    for (const v of colored(decor, 0x8f897d)) expect(v[1]).toBeLessThanOrEqual(floor + 1e-6);
    for (const v of colored(decor, 0xb9b2a3)) if (Math.abs(v[1] - floor) < 1e-6) expect(v[2]).toBeGreaterThanOrEqual(face);
  });

  it('la baie, l’objet témoin : au milieu, contre le tambour ; fermée au repos, ses volets qui tournent d’un quart de tour sur leurs gonds après une bonne réponse, sur une vitre pâle et unie', () => {
    const before = itemScene('observatory', COLUMN, false, []);
    const after = itemScene('observatory', COLUMN, true, []);
    expect(before.labels).toEqual([]);
    // Au repos, rien ne bouge ; après une bonne réponse, les volets passent dans la réaction, où ils tournent sur leurs
    // gonds en une demi-seconde (clôture de L8, relecture de L8c-d, Q1), et restent ouverts ; rien ne glisse.
    expect(before.reaction).toBeNull();
    const swing = after.reaction!.swing!;
    expect(swing.seconds).toBe(0.5);
    expect(after.reaction!.stay).toBe(true);
    expect(after.reaction!.from).toEqual(after.reaction!.to);
    expect(after.still.triangles + after.reaction!.facets.triangles).toBe(before.still.triangles);
    expect(colored(after.still, 0x178078)).toHaveLength(0);
    const at = (e: number) => {
      const f = after.reaction!.facets;
      const out = { ...f, positions: new Float32Array(f.positions.length), normals: new Float32Array(f.normals.length) };
      swingTo(f, swing, e, out.positions, out.normals);
      return out;
    };
    // Fermés, au départ de leur course, les mêmes que ceux du repos.
    expect([...at(0).positions]).toEqual(colored(before.still, 0x178078).flat().map((v) => Math.fround(v)));
    const face = placeById('observatory').center.z + drumFace(OBSERVATORY.drum.r);
    const glass = colored(before.still, 0xd9e6e8);
    const shutBefore = colored(before.still, 0x178078);
    const shutAfter = colored(at(1), 0x178078);
    // À mi-course, chaque battant en biais, à 45°, toujours attaché à son gond (au bord de la baie).
    const half0 = OBSERVATORY_BAY.width / 2;
    for (const leaf of swing.leaves) {
      const mid = at(0.5);
      const xs: number[] = [];
      for (let v = leaf.first; v < leaf.first + leaf.count; v++) xs.push(mid.positions[3 * v]);
      expect(Math.min(...xs.map((x) => Math.abs(x - o.x)))).toBeGreaterThan(half0 - 0.4);
      expect(Math.max(...xs.map((x) => Math.abs(x - o.x)))).toBeLessThan(half0 + 0.06);
    }
    // La baie au milieu, entre Kéo et la photographe, contre le pan sud du tambour, à hauteur de Kéo.
    const mid = (vs: [number, number, number][]) => (Math.min(...vs.map((v) => v[0])) + Math.max(...vs.map((v) => v[0]))) / 2;
    expect(Math.abs(mid(glass) - o.x)).toBeLessThan(0.05);
    expect(Math.min(...glass.map((v) => v[2]))).toBeGreaterThan(face);
    expect(Math.min(...glass.map((v) => v[1]))).toBeGreaterThan(o.y + OBSERVATORY_PAVING_RISE);
    // Fermés : les volets couvrent la vitre, devant elle. Ouverts : ils se tiennent hors de la vitre, de part et d'autre,
    // perpendiculaires au mur (plus profonds que larges), et la vitre se voit.
    const glassFront = Math.max(...glass.map((v) => v[2]));
    const half = OBSERVATORY_BAY.width / 2;
    expect(Math.min(...shutBefore.map((v) => v[2]))).toBeGreaterThanOrEqual(glassFront - 1e-6);
    expect(Math.max(...shutBefore.map((v) => Math.abs(v[0] - o.x)))).toBeLessThanOrEqual(half + 1e-4);
    for (const v of shutAfter) expect(Math.abs(v[0] - o.x)).toBeGreaterThanOrEqual(half - 1e-4);
    const east = shutAfter.filter((v) => v[0] > o.x);
    const depth = Math.max(...east.map((v) => v[2])) - Math.min(...east.map((v) => v[2]));
    const width = Math.max(...east.map((v) => v[0])) - Math.min(...east.map((v) => v[0]));
    expect(depth).toBeGreaterThan(4 * width);
  });
});

describe('La Halle (GD-20, point 8, lot L8d)', () => {
  const o = sceneSpot('commons');
  const colored = (f: { colors: Float32Array; positions: Float32Array }, hex: number) => {
    const rgb = linearRgb(hex);
    const out: [number, number, number][] = [];
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - rgb[k]) < 1e-6)) out.push([f.positions[i], f.positions[i + 1], f.positions[i + 2]]);
    return out;
  };

  it('le couvreur, en peu de triangles : le haut clair, le bas du corps sombre, deux jambes, tête nue, une tuile canal sous le bras', () => {
    const decor = scenetteDecor('commons');
    // Les deux ombres au pied (lot commun des scénettes) comprises.
    expect(decor.triangles).toBeLessThan(400 + FOOT_SHADOW_TRIANGLES);
    const at = scenetteHabitant('commons');
    const shirt = colored(decor, 0xbfdccb);
    expect(Math.min(...shirt.map((v) => v[1]))).toBeGreaterThan(at.y + 0.4);
    expectLegsAndHair(decor, at, 0x6a4a34, 0x3b2a22);
    // Tête nue : rien au-dessus de ses cheveux (ni chapeau ni casque).
    const top = Math.max(...colored(decor, 0x3b2a22).map((v) => v[1]));
    for (let i = 1; i < decor.positions.length; i += 3) if (Math.hypot(decor.positions[i - 1] - at.x, decor.positions[i + 1] - at.z) < 0.6) expect(decor.positions[i]).toBeLessThanOrEqual(top + 1e-6);
    // La tuile canal (directeur artistique, L8 ; relecture de L8c-d : jamais un pavé plat, qui se lisait comme un livre) :
    // couchée le long du flanc de l'est, à 50-60° de l'horizontale, son haut contre le torse sous l'épaule, son bas vers
    // l'extérieur ; sa face bombée, Vert île, tournée vers la caméra ; serrée entre le bras, qui passe dehors, et le torse.
    const tile = colored(decor, 0x438b82);
    expect(tile.length).toBeGreaterThan(0);
    const mean = (k: number) => tile.reduce((m, v) => m + v[k], 0) / tile.length;
    const [mx, my] = [mean(0), mean(1)];
    // Son grand axe dans le plan de la caméra (x, y), par ses moments.
    const cxx = tile.reduce((m, v) => m + (v[0] - mx) ** 2, 0);
    const cyy = tile.reduce((m, v) => m + (v[1] - my) ** 2, 0);
    const cxy = tile.reduce((m, v) => m + (v[0] - mx) * (v[1] - my), 0);
    const axis = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
    const slope = (Math.abs(axis) * 180) / Math.PI;
    expect(slope).toBeGreaterThan(50);
    expect(slope).toBeLessThan(60);
    // Elle descend vers l'est : son haut contre le torse, son bas dehors.
    expect(axis).toBeLessThan(0);
    const [ux, uy] = [Math.cos(axis), Math.sin(axis)];
    const along = (v: number[]) => (v[0] - mx) * ux + (v[1] - my) * uy;
    const across = (v: number[]) => -(v[0] - mx) * uy + (v[1] - my) * ux;
    const length = Math.max(...tile.map(along)) - Math.min(...tile.map(along));
    const width = Math.max(...tile.map(across)) - Math.min(...tile.map(across));
    expect(length).toBeGreaterThan(2 * width);
    // Bombée vers la caméra : le milieu de sa face plus avancé (z) que ses bords.
    const ridge = Math.min(...tile.filter((v) => Math.abs(across(v)) < 0.02).map((v) => v[2]));
    const edges = Math.max(...tile.filter((v) => Math.abs(across(v)) > width / 2 - 0.02).map((v) => v[2]));
    expect(ridge).toBeGreaterThan(edges + 0.05);
    // À côté du torse, sous l'épaule ; son bas dépasse le bas de la veste.
    expect(mx).toBeGreaterThan(at.x + 0.3);
    expect(Math.min(...tile.map((v) => v[0]))).toBeLessThan(at.x + 0.3);
    for (const v of tile) expect(v[1]).toBeLessThan(at.y + 0.84);
    expect(Math.min(...tile.map((v) => v[1]))).toBeLessThan(at.y + 0.47);
    // Devant le bras (clôture de L8 : de face, on la voit sur toute sa longueur) : le bras de l'est passe derrière sa
    // face bombée, et sa main la tient par son bas, sur son bord, dehors.
    const arm = shirt.filter((v) => v[0] > at.x + 0.36);
    expect(arm.length).toBeGreaterThan(0);
    for (const v of arm) expect(v[2]).toBeLessThan(ridge);
    expect(arm.some((v) => v[0] > mx && v[1] < my)).toBe(true);
    // Kéo à gauche, le couvreur à droite, sur la dalle posée sur le dallage.
    const keo = scenetteKeo('commons').at;
    expect(keo.x).toBeLessThan(o.x);
    expect(at.x).toBeGreaterThan(o.x);
    expect(keo.y).toBeCloseTo(o.y + COMMONS_PAVING_RISE, 9);
    expect(COMMONS_PAVING_RISE).toBeGreaterThan(COMMONS.paving.top);
    expect(scenetteFinale('commons', COLUMN, 1)).toBeNull();
    expect(answersHang('commons')).toBe(false);
  });

  it('aucun objet-réponse en scène : le C se joue dans la colonne', () => {
    const points = [-1.5, 0, 1.5].map((dx) => ({ x: o.x + dx, y: o.y + LAND_DECK, z: o.z + 2 }));
    expect(answerObjects('commons', points, 0.8, { ground: o.y }).triangles).toBe(0);
  });

  it('les trois pupitres de L’école laïque restent cachés pendant toute question de la mission (directeur du contenu pédagogique), et toutes les traces pendant toute question au lieu', () => {
    // Le temps de la scénette, la vue retire les traces du lieu (scene.ts, `hiddenTrace`), dans la scène comme sous
    // « Vue simple » ; la scénette ne les redessine pas : ni son décor, ni la scène d'un item, avant ou après une réponse.
    expect(scenetteHidesPieces('commons')).toBe(true);
    const oak = 0x8e6a48;
    expect(colored(scenetteDecor('commons'), oak)).toHaveLength(0);
    for (const answered of [false, true]) expect(colored(itemScene('commons', COLUMN, answered, []).still, oak)).toHaveLength(0);
    // Ils reviennent au retour, avec les autres traces.
    expect(colored(placeTrace('commons', ['school-secularism']), oak).length).toBeGreaterThan(0);
  });

  it('la scénette se tient sous le bord sud de la toiture, entre les deux piliers du milieu', () => {
    const c = placeById('commons').center;
    const P = COMMONS.pillar;
    expect(o.z - c.z).toBeGreaterThan(P.z);
    expect(o.z - c.z).toBeLessThan(COMMONS.roof.ez);
    const [west, east] = [P.xs[1], P.xs[2]];
    expect(o.x - c.x).toBeGreaterThan(west);
    expect(o.x - c.x).toBeLessThan(east);
    expect(commonsPillars()).toHaveLength(10);
  });

  it('la borne-fontaine, l’objet témoin : au milieu, sèche au repos ; après une bonne réponse, un filet immobile et l’eau qui monte dans l’auge, puis reste', () => {
    const before = itemScene('commons', COLUMN, false, []);
    const after = itemScene('commons', COLUMN, true, []);
    expect(before.labels).toEqual([]);
    expect(before.reaction).toBeNull();
    // Rien d'eau au repos : l'auge sèche.
    expect(colored(before.still, 0xa9dceb)).toHaveLength(0);
    // Le filet, immobile, entre le bec et l'auge ; l'eau, la réaction, monte d'un geste court (sans arc), puis reste.
    const jet = colored(after.still, 0xa9dceb);
    expect(jet.length).toBeGreaterThan(0);
    const r = after.reaction!;
    expect(r.stay).toBe(true);
    expect(r.arc).toBe(0);
    expect([r.to.x, r.to.z]).toEqual([r.from.x, r.from.z]);
    expect(r.to.y - r.from.y).toBeGreaterThan(0);
    expect(r.to.y - r.from.y).toBeLessThan(0.3);
    expect(Math.min(...jet.map((v) => v[1]))).toBeCloseTo(r.to.y, 6);
    const floor = o.y + COMMONS_PAVING_RISE;
    expect(Math.max(...jet.map((v) => v[1]))).toBeLessThan(floor + FOUNTAIN.spout);
    // Au milieu, entre Kéo et le couvreur.
    const mid = (vs: [number, number, number][]) => (Math.min(...vs.map((v) => v[0])) + Math.max(...vs.map((v) => v[0]))) / 2;
    expect(Math.abs(mid(jet) - o.x)).toBeLessThan(0.05);
    // L'eau reste sous le bord de l'auge, au-dessus de sa paroi sud, plus basse (une lèvre : sa bande claire se voit
    // monter, relecture de L8c-d) ; le filet, assez large pour se lire, droit.
    expect(r.to.y).toBeLessThan(floor + FOUNTAIN.trough[1]);
    expect(FOUNTAIN.lip).toBeLessThan(FOUNTAIN.water - 0.05);
    expect(r.from.y).toBeLessThan(floor + FOUNTAIN.lip);
    // Le dessus de la paroi sud, à la hauteur de la lèvre, sous l'eau à son repos.
    const south = colored(before.still, 0xdcd0b5).filter((v) => v[2] > o.z + 0.05 && Math.abs(v[0] - o.x) < 0.4);
    expect(south.some((v) => Math.abs(v[1] - (floor + FOUNTAIN.lip)) < 1e-6)).toBe(true);
    const jetWidth = Math.max(...jet.map((v) => v[0])) - Math.min(...jet.map((v) => v[0]));
    expect(jetWidth).toBeGreaterThan(0.1);
    expect(jetWidth).toBeLessThan(0.15);
    // Le bronze du bec, seulement sur la borne.
    expect(colored(before.still, 0x9c7a3c).length).toBeGreaterThan(0);
  });
});

/**
 * Les jambes et les cheveux des quatre habitants du rivage sud (relecture DA de L8 : une seule construction, seules
 * changent leurs couleurs ; relecture de L8c-d : jamais une robe de bure ni une calotte) : un pantalon droit, de ses pieds
 * à ses hanches, deux jambes séparées, rien au milieu sous les hanches, et deux chaussures sombres au sol ; des cheveux
 * qui descendent sur la nuque, au-dessus de la tête, aux oreilles sur les côtés, et s'arrêtent au-dessus du front.
 */
function expectLegsAndHair(decor: { colors: Float32Array; positions: Float32Array }, at: { x: number; y: number; z: number }, trousers: number, hairColor: number): void {
  const colored = (hex: number) => {
    const rgb = linearRgb(hex);
    const out: [number, number, number][] = [];
    for (let i = 0; i < decor.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(decor.colors[i + k] - rgb[k]) < 1e-6)) out.push([decor.positions[i], decor.positions[i + 1], decor.positions[i + 2]]);
    return out.filter((v) => Math.hypot(v[0] - at.x, v[2] - at.z) < 0.5);
  };
  const legs = colored(trousers);
  expect(Math.max(...legs.map((v) => v[1]))).toBeLessThan(at.y + 0.5);
  expect(Math.min(...legs.map((v) => v[1]))).toBeCloseTo(at.y, 6);
  // Deux jambes : rien du pantalon sur la ligne du milieu, sous les hanches.
  expect(legs.some((v) => v[0] < at.x - 0.05 && v[1] < at.y + 0.3)).toBe(true);
  expect(legs.some((v) => v[0] > at.x + 0.05 && v[1] < at.y + 0.3)).toBe(true);
  expect(legs.filter((v) => v[1] < at.y + 0.3 && Math.abs(v[0] - at.x) < 0.03)).toHaveLength(0);
  const shoes = colored(0x2f2826);
  expect(Math.min(...shoes.map((v) => v[1]))).toBeCloseTo(at.y, 6);
  expect(new Set(shoes.map((v) => Math.sign(v[0] - at.x))).size).toBe(2);
  const hair = colored(hairColor);
  expect(Math.max(...hair.map((v) => v[1]))).toBeGreaterThan(at.y + 1.13 + 0.2);
  // La nuque : derrière la tête, les cheveux descendent sous son milieu ; devant, ils s'arrêtent au-dessus du front.
  expect(Math.min(...hair.filter((v) => v[2] < at.z - 0.1).map((v) => v[1]))).toBeLessThan(at.y + 1.05);
  for (const v of hair.filter((p) => p[2] > at.z + 0.15)) expect(v[1]).toBeGreaterThan(at.y + 1.17);
  // Sur les côtés, ils descendent aux oreilles, sous le milieu de la tête.
  expect(Math.min(...hair.filter((v) => Math.abs(v[0] - at.x) > 0.2).map((v) => v[1]))).toBeLessThan(at.y + 1.13);
}

describe('La caméra libre des scénettes (lot commun)', () => {
  it('tourne autour du point visé, à la même distance et à la même hauteur, dans le sens de la caméra qui suit Kéo', () => {
    const pivot = { x: 10, y: 2, z: -4 };
    const south = { x: 10, y: 7, z: 2 };
    expect(orbitAround(south, pivot, 0)).toEqual(south);
    const quarter = orbitAround(south, pivot, Math.PI / 2);
    expect(quarter.x).toBeCloseTo(16, 6);
    expect(quarter.z).toBeCloseTo(-4, 6);
    expect(quarter.y).toBe(7);
    const half = orbitAround(south, pivot, Math.PI);
    expect(half.x).toBeCloseTo(10, 6);
    expect(half.z).toBeCloseTo(-10, 6);
  });
});
