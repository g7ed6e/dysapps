// La prochaine mission du monde continu et sa marque à l'écran.
import { describe, expect, it } from 'vitest';
import { keepClear, markOnScreen, missionOfPlace, nextMission, placeIsOpen, type MissionMark } from './mission';
import { placeById } from './plan6e';

const bornes: MissionMark[] = [
  { ile: 'french-6e-phonology', mission: 'syllables', etat: 3 },
  { ile: 'french-6e-phonology', mission: 'rimes', etat: 'new' },
  { ile: 'maths-6e-calculation', mission: 'mental', etat: 'locked' },
  { ile: 'french-6e-grammar-spelling', mission: 'accords', etat: 'new' },
  { ile: 'maths-6e-fractions', mission: 'parts', etat: 2 },
  { ile: 'history-6e-antiquity', mission: 'dates', etat: 'new' },
];

describe('La prochaine mission', () => {
  it('celle de la prochaine destination du jeu, quand elle est dans un des lieux et ouverte', () => {
    expect(nextMission(bornes, { island: 'french-6e-grammar-spelling', mission: 'accords' })).toMatchObject({ place: { id: 'filets' }, mission: 'accords' });
    // Fermée : on n'y envoie pas.
    expect(nextMission(bornes, { island: 'maths-6e-calculation', mission: 'mental' })).toMatchObject({ place: { id: 'phare' }, mission: 'rimes' });
  });

  it('sinon la première jamais jouée, lieu par lieu dans l’ordre du plan ; hors des quatre lieux, rien', () => {
    expect(nextMission(bornes)).toMatchObject({ place: { id: 'phare' }, mission: 'rimes' });
    const sansNouvelle = bornes.map((b) => (b.etat === 'new' ? { ...b, etat: 3 } : b));
    expect(nextMission(sansNouvelle)).toMatchObject({ place: { id: 'ecluses' }, mission: 'parts' });
    expect(nextMission(bornes.filter((b) => b.ile === 'history-6e-antiquity'))).toBeNull();
  });

  it('la mission d’un lieu : à faire, sinon à reprendre ; rien quand il est fermé', () => {
    expect(missionOfPlace(placeById('phare'), bornes)).toBe('rimes');
    expect(missionOfPlace(placeById('ecluses'), bornes)).toBe('parts');
    expect(missionOfPlace(placeById('quais'), bornes)).toBeNull();
    // Tout est fait : on rejoue la première.
    expect(missionOfPlace(placeById('phare'), bornes.map((b) => ({ ...b, etat: b.etat === 'locked' ? b.etat : 3 })))).toBe('syllables');
  });

  it('un lieu est fermé quand aucune de ses missions ne se joue', () => {
    expect(placeIsOpen(placeById('phare'), bornes)).toBe(true);
    expect(placeIsOpen(placeById('quais'), bornes)).toBe(false);
  });
});

describe('La marque à l’écran', () => {
  it('sur son lieu quand il est dans l’écran', () => {
    expect(markOnScreen({ x: 300, y: 200, behind: false }, 1000, 800, 50)).toEqual({ x: 300, y: 200, inside: true, angle: 0 });
  });

  it('hors champ, au bord, sa flèche tournée vers le lieu', () => {
    const droite = markOnScreen({ x: 1600, y: 400, behind: false }, 1000, 800, 50);
    expect(droite).toMatchObject({ x: 950, y: 400, inside: false });
    expect(droite.angle).toBeCloseTo(Math.PI / 2, 9);
    const haut = markOnScreen({ x: 500, y: -900, behind: false }, 1000, 800, 50);
    expect(haut).toMatchObject({ x: 500, y: 50, inside: false });
    expect(haut.angle).toBeCloseTo(0, 9);
  });

  it('derrière la caméra, la direction est retournée', () => {
    const m = markOnScreen({ x: 500, y: 100, behind: true }, 1000, 800, 50);
    expect(m.inside).toBe(false);
    expect(m.y).toBe(750);
    expect(Math.abs(m.angle)).toBeCloseTo(Math.PI, 9);
  });
});

describe('La marque évite les boutons', () => {
  const reglages = { left: 940, top: 10, width: 60, height: 60 };
  const yAller = { left: 400, top: 700, width: 220, height: 60 };

  it('hors des boutons, elle ne bouge pas', () => {
    const box = { left: 300, top: 300, width: 150, height: 50 };
    expect(keepClear(box, [reglages, yAller], 1024, 768, 8, 8)).toEqual(box);
  });

  it('sur Réglages ou sur « Y aller », elle s’en écarte du plus petit pas, sans sortir de l’écran', () => {
    const enHautADroite = keepClear({ left: 900, top: 8, width: 150, height: 50 }, [reglages, yAller], 1024, 768, 8, 8);
    expect(enHautADroite.left + enHautADroite.width <= reglages.left - 8 || enHautADroite.top >= reglages.top + reglages.height + 8).toBe(true);
    expect(enHautADroite.left + enHautADroite.width).toBeLessThanOrEqual(1016);
    const enBas = keepClear({ left: 440, top: 710, width: 150, height: 50 }, [reglages, yAller], 1024, 768, 8, 8);
    expect(enBas.top + enBas.height <= yAller.top - 8 || enBas.left >= yAller.left + yAller.width + 8 || enBas.left + enBas.width <= yAller.left - 8).toBe(true);
    expect(enBas.top + enBas.height).toBeLessThanOrEqual(760);
  });
});
