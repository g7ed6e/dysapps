// La scénette du Phare (piste 1, lot 2) : la place de la consigne, de la scène et de la rangée à l'écran (dispositions
// A et B), la caméra de la galerie, le décor de près, les cloches pendues, la lampe de la réussite, le regard levé. Les
// Quais (lot 3), les Filets et les Écluses (lot 4) : leur habitant, leur cadrage, leur réussite et leur retour. Sans
// Three.js.
import { describe, expect, it } from 'vitest';
import { FOLLOW, KEO_HEIGHT, LOOK_UP, followPose, lookUp, lookUpStep, screenOf } from './camera';
import { FacetBuilder, boundsOf } from './facets';
import { distance } from './geometry';
import { startOf } from './paths';
import { placeById } from './plan6e';
import { modelOfPlace } from './places';
import { ANSWER_LAYOUT, LOCK, answerObjects, filetsBasketAt, fullBasket, itemScene, loadedBoat, lockFull, placeTrace, questionLayout, sceneSpot, type ScreenBox } from './questionScene';
import {
  GALLERY,
  LANTERN,
  SCENETTE_LAYOUT,
  bellPlane,
  habitantHand,
  answersHang,
  lanternGlass,
  scenetteDecor,
  scenetteHabitant,
  scenetteHidesPlace,
  scenetteKeo,
  scenetteLayout,
  scenetteOf,
  EXIT_VIEW,
  exitView,
  scenetteExit,
  scenetteFinale,
  scenetteHidesPieces,
  scenettePose,
  scenetteSuccess,
  answerLeaves,
  scenetteDeck,
  LAND_DECK,
  PHARE_SOCLE,
} from './scenette';
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
  it('les quatre lieux ont leur scénette, chaque habitant nommé par son rôle seul, sans phrase d’accueil', () => {
    expect(scenetteOf('phare')).toEqual({ role: 'La gardienne du phare', greeting: null, placement: 'rangee' });
    expect(scenetteOf('quais')).toEqual({ role: 'Le docker', greeting: null, placement: 'rangee' });
    expect(scenetteOf('filets')).toEqual({ role: 'La pêcheuse', greeting: null, placement: 'rangee' });
    expect(scenetteOf('ecluses')).toEqual({ role: 'L’éclusier', greeting: null, placement: 'rangee' });
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

  it('la lampe de la réussite habille la vitre de la lanterne', () => {
    const lamp = boundsOf(lanternGlass('phare'));
    expect(lamp.min[1]).toBeLessThan(floor);
    expect(lamp.max[1]).toBeGreaterThan(floor + 0.9);
    expect(LANTERN).toEqual({ off: 0xbfd0d3, on: 0xffd36b });
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
    const docker = scenetteDecor('quais');
    expect(docker.triangles).toBeGreaterThan(0);
    expect(docker.triangles).toBeLessThan(1500);
    const b = boundsOf(docker);
    // Debout sur la bande de devant du quai, à hauteur d'homme (Kéo est à l'échelle 0,6 de la scénette).
    expect(b.min[1]).toBeGreaterThanOrEqual(quay.y - 0.1);
    expect(b.max[1]).toBeLessThan(quay.y + 2.5);
    expect(b.min[0]).toBeGreaterThan(quay.x);
    expect(scenetteHabitant('quais').x).toBeGreaterThan(quay.x);
    // Ni lampe à allumer, ni cloches pendues : la caisse monte au crochet de la grue.
    expect(scenetteSuccess('quais')).toBeNull();
    expect(scenetteSuccess('phare')?.triangles).toBeGreaterThan(0);
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

describe('Les Filets et les Écluses (lot 4)', () => {
  const places = ['filets', 'ecluses'] as const;

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
      const floor = sceneSpot(place).y;
      for (const p of [scenetteKeo(place).at, scenetteHabitant(place)]) {
        expect(p.y).toBe(floor);
        expect(standingHeight(heightAt(p))).toBeLessThanOrEqual(floor + 1e-9);
      }
      const decor = scenetteDecor(place);
      expect(decor.triangles).toBeGreaterThan(0);
      expect(decor.triangles).toBeLessThan(1500);
      // Les paniers et les leviers sur une margelle à terre, à la hauteur du plancher ; la caisse des Quais seule part.
      expect(scenetteDeck(place)).toEqual({ y: floor + LAND_DECK, onLand: true });
      expect(answerLeaves(place)).toBe(false);
    }
    expect(scenetteDeck('quais').onLand).toBe(false);
    expect(answerLeaves('quais')).toBe(true);
  });

  it('les pièces du lieu s’effacent le temps de la scénette partout sauf au Phare (ses lampes sont sur la galerie)', () => {
    expect(scenetteHidesPieces('phare')).toBe(false);
    for (const place of ['quais', 'filets', 'ecluses'] as const) expect(scenetteHidesPieces(place), place).toBe(true);
  });

  it('aux Filets, la réussite tend le filet raccommodé et pose un panier plein aux pieds de la pêcheuse, où il reste', () => {
    const f = scenetteFinale('filets', { kind: 'filets', catch: 'sardines', count: 3 }, 0.8)!;
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
    // Rien ne s'allume tant que la lanterne n'est pas là ; sans galerie, Kéo revient sur le chemin.
    expect(scenetteSuccess('phare', false)).toBeNull();
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
    const built = scenetteFinale('filets', scene, 0.8, true)!;
    const bare = scenetteFinale('filets', scene, 0.8, false)!;
    expect(boundsOf(bare.decor).max[1]).toBeLessThan(boundsOf(built.decor).max[1]);
    expect(boundsOf(bare.decor).max[1]).toBeLessThan(sceneSpot('filets').y + 1.5);
    expect(scenetteDecor('ecluses', false, false).triangles).toBeLessThan(scenetteDecor('ecluses', false, true).triangles);
    expect(scenetteDecor('ecluses', true, false).triangles).toBeLessThan(scenetteDecor('ecluses', true, true).triangles);
  });
});
