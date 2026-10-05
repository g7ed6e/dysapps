// La phrase qui dit où est une place (GD-9) : « au nord de la Forêt des sons, à 2 cases ».
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { BIOMES } from '../biomes';
import { freeSpots, guardianOf, moveGuardian, startingSpot } from './arrange';
import { distanceWords, directionWords, guardianSentence, ofPlace, placeSentence } from './placeSentence';

const VIDE: World = { parts: {}, log: [], links: [] };

describe('où est une place, en mots', () => {
  it('les directions comme on les voit sur la Carte : le nord en haut (y qui monte), l’est à droite (x qui descend), huit en tout', () => {
    // La caméra de la Carte regarde depuis les y bas : les x du monde qui montent vont à gauche de l'écran
    // (three/arrangeDirections.test.ts le vérifie sur sa projection).
    const o = { x: 0, y: 0 };
    expect(directionWords(o, { x: 0, y: 10 })).toBe('au nord');
    expect(directionWords(o, { x: 0, y: -10 })).toBe('au sud');
    expect(directionWords(o, { x: -10, y: 0 })).toBe('à l’est');
    expect(directionWords(o, { x: 10, y: 0 })).toBe('à l’ouest');
    expect(directionWords(o, { x: -10, y: 10 })).toBe('au nord-est');
    expect(directionWords(o, { x: 10, y: -9 })).toBe('au sud-ouest');
  });

  it('« à 2 cases » : l’écart d’eau en cases de la grille des places, une au moins', () => {
    expect(distanceWords(8)).toBe('à 2 cases');
    expect(distanceWords(4)).toBe('à 1 case');
    expect(distanceWords(1)).toBe('à 1 case');
  });

  it('chaque nom de lieu avec son article : de la, du, de l’', () => {
    expect(ofPlace('Forêt des sons')).toBe('de la Forêt des sons');
    expect(ofPlace('Volcan des décimaux')).toBe('du Volcan des décimaux');
    expect(ofPlace('Atelier du calcul littéral')).toBe('de l’Atelier du calcul littéral');
    expect(ofPlace('Horloge des verbes')).toBe('de l’Horloge des verbes');
    expect(ofPlace('Observatoire des textes')).toBe('de l’Observatoire des textes');
    // Aucun nom ne reste sans article.
    for (const b of BIOMES) expect(ofPlace(b.name)).toMatch(/^(de la |du |de l’)/);
  });

  it('dit le voisin le plus proche, sa direction et l’écart, avec les noms de l’univers', () => {
    const id: BiomeId = 'english-6e-vocabulary';
    // Derrière la Forêt des sons, à côté de l'Horloge des verbes, à sa droite sur la Carte.
    expect(placeSentence(VIDE, id)).toMatch(/^à l’est de l’Horloge des verbes, à \d+ cases?$/);
    expect(placeSentence(VIDE, id, startingSpot(id), (x) => `Lieu ${x}`)).toMatch(/du Lieu /);
    // Une autre place, une autre phrase (le fantôme la dit à chaque calage).
    const ailleurs = freeSpots(VIDE, id).find((s) => Math.abs(s.x - startingSpot(id).x) + Math.abs(s.y - startingSpot(id).y) > 2);
    if (ailleurs) expect(typeof placeSentence(VIDE, id, ailleurs)).toBe('string');
  });

  it('l’îlot d’un Gardien : « au sud de son île », puis le côté où il va', () => {
    const id: BiomeId = 'maths-6e-decimals';
    expect(guardianSentence(VIDE, id)).toBe('au sud de son île');
    const r = moveGuardian(VIDE, id, { side: 'right', step: -1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(guardianOf(r.world, id).side).toBe('right');
      expect(guardianSentence(r.world, id)).toMatch(/ouest de son île$/);
    }
  });
});
