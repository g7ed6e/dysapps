// La scénette du Phare (piste 1, lot 2) : la place de la consigne, de la scène et de la rangée à l'écran (dispositions
// A et B), la caméra de la galerie, le décor de près, les cloches pendues, la lampe de la réussite, le regard levé.
// Sans Three.js.
import { describe, expect, it } from 'vitest';
import { FOLLOW, KEO_HEIGHT, LOOK_UP, followPose, lookUp, lookUpStep, screenOf } from './camera';
import { boundsOf } from './facets';
import { distance } from './geometry';
import { startOf } from './paths';
import { placeById } from './plan6e';
import { modelOfPlace } from './places';
import { ANSWER_LAYOUT, answerObjects, itemScene, loadedBoat, questionLayout, type ScreenBox } from './questionScene';
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
  scenettePose,
  scenetteSuccess,
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
  it('le Phare et les Quais ont leur scénette, chaque habitant nommé par son rôle seul, sans phrase d’accueil', () => {
    expect(scenetteOf('phare')).toEqual({ role: 'La gardienne du phare', greeting: null, placement: 'rangee' });
    expect(scenetteOf('quais')).toEqual({ role: 'Le docker', greeting: null, placement: 'rangee' });
    expect(scenetteOf('filets')).toBeNull();
    expect(scenetteOf('ecluses')).toBeNull();
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
    expect(scenetteDecor('filets').triangles).toBe(0);
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
