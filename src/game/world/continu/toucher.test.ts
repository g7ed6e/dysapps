// Ce qu'un toucher dans la 3D ouvre (GD-20, point 4, lot L1) : le lieu le plus proche, jamais le premier de la liste ; un
// aménagement, son lieu, par son dessin ou par un disque de 48 px au moins autour de lui ; le dessin d'abord.
import { describe, expect, it } from 'vitest';
import { OBJECT_TOUCH_PIXELS, nearestPlace, screenRect, touchedObject } from './toucher';

describe('Le lieu touché', () => {
  it('le plus proche dont le rayon prend le point, jamais le premier de la liste', () => {
    const places = [
      { id: 'phare', center: { x: 0, z: 0 }, touchRadius: 6 },
      { id: 'quais', center: { x: 8, z: 0 }, touchRadius: 6 },
    ] as const;
    expect(nearestPlace({ x: 5, z: 0 }, places)).toBe('quais');
    expect(nearestPlace({ x: 3, z: 0 }, places)).toBe('phare');
    expect(nearestPlace({ x: 20, z: 0 }, places)).toBeNull();
  });
});

describe('L’aménagement touché', () => {
  const potager = { place: 'phare', rect: { left: 100, top: 100, right: 110, bottom: 108 } } as const;
  const boutique = { place: 'quais', rect: { left: 140, top: 90, right: 220, bottom: 160 } } as const;

  it('une cible de 48 px au moins, même pour un petit dessin', () => {
    expect(2 * OBJECT_TOUCH_PIXELS).toBeGreaterThanOrEqual(48);
    expect(touchedObject(105 + OBJECT_TOUCH_PIXELS - 1, 104, [potager])).toBe('phare');
    expect(touchedObject(105, 104 - OBJECT_TOUCH_PIXELS + 1, [potager])).toBe('phare');
    expect(touchedObject(105 + OBJECT_TOUCH_PIXELS + 1, 104, [potager])).toBeNull();
  });

  it('le dessin touché en plein l’emporte sur le disque d’un voisin', () => {
    // (141, 104), à 36 px du centre du potager, est dans le dessin de la boutique ; (125, 104), dans le disque du potager
    // seul. Un point dans le disque du potager et dans le dessin de la boutique : le dessin l'emporte.
    expect(touchedObject(141, 104, [potager, boutique])).toBe('quais');
    expect(touchedObject(141, 104, [{ ...potager, rect: { left: 112, top: 100, right: 122, bottom: 108 } }, boutique])).toBe('quais');
    expect(touchedObject(125, 104, [potager, boutique])).toBe('phare');
  });

  it('un grand dessin se touche partout, même loin de son centre', () => {
    expect(touchedObject(218, 158, [boutique])).toBe('quais');
  });

  it('la boîte à l’écran de points projetés', () => {
    expect(screenRect([{ x: 3, y: 9 }, { x: -1, y: 4 }, { x: 7, y: 5 }])).toEqual({ left: -1, top: 4, right: 7, bottom: 9 });
  });
});
