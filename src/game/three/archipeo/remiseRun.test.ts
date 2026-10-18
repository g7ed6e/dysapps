// Les pastilles des habitants (GD-20, point 4, lots L1 et L2, `createSignsTracker`) : la même liste, remplie sur place à
// chaque image, sans rien allouer dans la boucle (avis de l'expert frontend, lots L2 et L3) ; refaite seulement quand
// la page change les lieux.
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createSignsTracker, type SignOnScreen } from './remiseRun';

describe('Les pastilles des habitants', () => {
  it('chaque image écrit dans les mêmes pastilles : ni nouvelle liste, ni nouvel objet', () => {
    const seen: (readonly SignOnScreen[])[] = [];
    let frame = 0;
    const tracker = createSignsTracker({
      anchorOf: () => ({ x: 1, y: 2, z: 3 }),
      place: (anchor: THREE.Vector3, sign: SignOnScreen) => {
        sign.x = anchor.x + frame;
        sign.y = anchor.y;
        sign.shown = true;
      },
      onSigns: (signs) => seen.push(signs),
    });
    tracker.set(['quais', 'phare']);
    const [quais, phare] = seen[0];
    frame = 1;
    tracker.report();
    frame = 2;
    tracker.report();
    expect(seen[1]).toBe(seen[0]);
    expect(seen[2]).toBe(seen[0]);
    expect(seen[2][0]).toBe(quais);
    expect(seen[2][1]).toBe(phare);
    expect(quais).toMatchObject({ place: 'quais', x: 3, y: 2, shown: true });
    // Les mêmes lieux : rien n'est refait ; d'autres lieux : une nouvelle liste.
    tracker.set(['quais', 'phare']);
    expect(seen).toHaveLength(3);
    tracker.set(['quais']);
    expect(seen[3]).not.toBe(seen[0]);
  });
});
