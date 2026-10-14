// La prochaine mission du monde continu et sa marque à l'écran.
import { describe, expect, it } from 'vitest';
import { keepClear, markOnScreen, missionOfPlace, nextMission, type MissionMark } from './mission';
import { placeById } from './plan6e';

const bornes: MissionMark[] = [
  { ile: 'french-6e-phonology', mission: 'syllables', etat: 'new' },
  { ile: 'french-6e-phonology', mission: 'sound-hunt', etat: 3 },
  { ile: 'maths-6e-calculation', mission: 'doubles-halves', etat: 'locked' },
  { ile: 'french-6e-grammar-spelling', mission: 'plurals', etat: 'new' },
  { ile: 'maths-6e-fractions', mission: 'number-line', etat: 2 },
  { ile: 'history-6e-antiquity', mission: 'dates', etat: 'new' },
];

describe('La prochaine mission', () => {
  it('celle de la prochaine destination du jeu, quand c’est la mission d’un des lieux', () => {
    expect(nextMission(bornes, { island: 'french-6e-grammar-spelling', mission: 'plurals' })).toMatchObject({ place: { id: 'filets' }, mission: 'plurals' });
    // Une autre mission de l'île ne se joue pas dans le lieu : on prend la suivante du plan.
    expect(nextMission(bornes, { island: 'french-6e-phonology', mission: 'syllables' })).toMatchObject({ place: { id: 'quais' }, mission: 'doubles-halves' });
  });

  it('sinon la première encore à jouer (fermée dans la grille comprise), lieu par lieu dans l’ordre du plan ; hors des quatre lieux, rien', () => {
    expect(nextMission(bornes)).toMatchObject({ place: { id: 'quais' }, mission: 'doubles-halves' });
    const sansNouvelle = bornes.map((b) => (b.etat === 'new' || b.etat === 'locked' ? { ...b, etat: 3 } : b));
    expect(nextMission(sansNouvelle)).toMatchObject({ place: { id: 'ecluses' }, mission: 'number-line' });
    expect(nextMission(bornes.filter((b) => b.ile === 'history-6e-antiquity'))).toBeNull();
  });

  it('la mission d’un lieu est la sienne, quel que soit son état', () => {
    expect(missionOfPlace(placeById('phare'), bornes)).toBe('sound-hunt');
    expect(missionOfPlace(placeById('quais'), bornes)).toBe('doubles-halves');
    expect(missionOfPlace(placeById('filets'), bornes.filter((b) => b.mission !== 'plurals'))).toBeNull();
  });

  it('les quatre lieux sont ouverts, même quand leur mission est encore fermée dans la grille', () => {
    const fermees = bornes.map((b) => ({ ...b, etat: 'locked' as const }));
    for (const id of ['phare', 'quais', 'filets', 'ecluses'] as const) expect(missionOfPlace(placeById(id), fermees)).toBe(placeById(id).mission);
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
