// La prochaine mission du monde continu et sa marque à l'écran.
import { describe, expect, it } from 'vitest';
import { getBiome } from '../../biomes';
import { textesDe } from '../../../universes';
import type { BiomeId } from '../../biomes';
import { EMPTY_STATE, type GameState } from '../../engine';
import { questProgress } from '../../exercises';
import { NOMS_ARCHIPELS } from '../archipelago';
import { modeleDuMonde } from '../model';
import { DISTANCE_SIGN_STEPS, bornesDuMondeOuvert, distanceSign, keepClear, markOnScreen, missionsOfPlace, nextMission, playsInPlace, veiledPlaces, type MissionMark } from './mission';
import { KEO_STEP, PLACES, placeById } from './plan6e';

const bornes: MissionMark[] = [
  { ile: 'french-6e-phonology', mission: 'syllables', etat: 3 },
  { ile: 'french-6e-phonology', mission: 'sound-hunt', etat: 3 },
  { ile: 'maths-6e-calculation', mission: 'times-tables', etat: 'locked' },
  { ile: 'maths-6e-calculation', mission: 'doubles-halves', etat: 'locked' },
  { ile: 'french-6e-grammar-spelling', mission: 'word-classes', etat: 'new' },
  { ile: 'french-6e-grammar-spelling', mission: 'plurals', etat: 'new' },
  { ile: 'maths-6e-fractions', mission: 'number-line', etat: 2 },
  { ile: 'maths-6e-fractions', mission: 'equivalence', etat: 'new' },
  { ile: 'history-6e-antiquity', mission: 'dates', etat: 'new' },
];

describe('Un lieu porte toutes les missions de son île (GD-20, point 8)', () => {
  it('la liste d’un lieu : les bornes de son île, dans leur ordre, quel que soit leur état', () => {
    expect(missionsOfPlace(placeById('quais'), bornes).map((b) => b.mission)).toEqual(['times-tables', 'doubles-halves']);
    expect(missionsOfPlace(placeById('filets'), bornes).map((b) => b.mission)).toEqual(['word-classes', 'plurals']);
    expect(missionsOfPlace(placeById('filets'), bornes.filter((b) => b.ile !== 'french-6e-grammar-spelling'))).toEqual([]);
  });

  it('les six lieux du 6e jouent toutes leurs missions en scénette (les Filets complets au lot L4, les Marais salants au lot L5, la Turbine au lot L6a)', () => {
    expect(placeById('engine').scenes).toEqual(['states-of-matter', 'motion-signals', 'energy-circuits', 'materials-light']);
    expect(playsInPlace(placeById('engine'), 'energy-circuits')).toBe(true);
    expect(placeById('saltworks').scenes).toEqual(['ordering', 'operations', 'scale', 'large-numbers', 'rounding-products']);
    expect(playsInPlace(placeById('saltworks'), 'scale')).toBe(true);
    expect(placeById('quais').scenes).toEqual(['times-tables', 'make-ten', 'doubles-halves', 'word-problems', 'measures']);
    expect(playsInPlace(placeById('quais'), 'measures')).toBe(true);
    expect(playsInPlace(placeById('phare'), 'sound-hunt')).toBe(true);
    expect(playsInPlace(placeById('phare'), 'syllables')).toBe(true);
    expect(playsInPlace(placeById('phare'), 'rhymes')).toBe(true);
    expect(playsInPlace(placeById('filets'), 'plurals')).toBe(true);
    expect(playsInPlace(placeById('ecluses'), 'equivalence')).toBe(true);
    expect(placeById('filets').scenes).toEqual(['word-classes', 'sorting', 'e-er-ez', 'plurals']);
    expect(playsInPlace(placeById('filets'), 'word-classes')).toBe(true);
    expect(playsInPlace(placeById('filets'), 'times-tables')).toBe(false);
  });

  it('les missions en scénette de chaque lieu sont toutes celles de leur île, et chaque scénette est une mission de son île', () => {
    for (const p of PLACES) {
      const island = getBiome(p.island);
      expect(island).toBeDefined();
      for (const m of p.scenes) expect(island!.exercises.map((e) => e.id)).toContain(m);
    }
    expect(getBiome('maths-6e-calculation')!.exercises.map((e) => e.id)).toEqual([...placeById('quais').scenes]);
    expect(getBiome('maths-6e-fractions')!.exercises.map((e) => e.id)).toEqual([...placeById('ecluses').scenes]);
    expect(getBiome('french-6e-phonology')!.exercises.map((e) => e.id)).toEqual([...placeById('phare').scenes]);
    expect(getBiome('french-6e-grammar-spelling')!.exercises.map((e) => e.id)).toEqual([...placeById('filets').scenes]);
  });
});

describe('La brume et la distance', () => {
  it('la brume couvre les lieux dont aucune mission n’a été jouée, sauf le prochain', () => {
    const next = nextMission(bornes);
    expect(next?.place.id).toBe('quais');
    // Le Phare et les Écluses ont été joués (une mission au moins) ; les Quais sont le prochain lieu.
    expect(veiledPlaces(bornes, next)).toEqual(['filets']);
    expect(veiledPlaces(bornes, null)).toEqual(['quais', 'filets']);
    // Sans mission (une autre LV2), pas de brume.
    expect(veiledPlaces(bornes.filter((b) => b.ile !== 'french-6e-grammar-spelling'), next)).toEqual([]);
  });

  it('la distance en un, deux ou trois points, jamais en texte', () => {
    const o = { x: 0, z: 0 };
    expect(distanceSign(o, { x: 0, z: (DISTANCE_SIGN_STEPS[0] - 1) * KEO_STEP })).toBe(1);
    expect(distanceSign(o, { x: DISTANCE_SIGN_STEPS[0] * KEO_STEP, z: 0 })).toBe(2);
    expect(distanceSign(o, { x: 0, z: -DISTANCE_SIGN_STEPS[1] * KEO_STEP })).toBe(3);
    expect(markOnScreen({ x: 2000, y: 100, behind: false }, 1000, 800, 50, 3).far).toBe(3);
  });
});

describe('La prochaine mission', () => {
  it('celle de la prochaine destination du jeu, quand elle est d’un lieu, quelle que soit la mission de l’île', () => {
    expect(nextMission(bornes, { island: 'french-6e-grammar-spelling', mission: 'plurals' })).toMatchObject({ place: { id: 'filets' }, mission: 'plurals' });
    // Une mission de l'île qui ne se joue pas encore en scénette : elle se joue depuis le panneau du lieu.
    expect(nextMission(bornes, { island: 'french-6e-phonology', mission: 'syllables' })).toMatchObject({ place: { id: 'phare' }, mission: 'syllables' });
    // Une île sans lieu, ou une mission inconnue de l'île : la suivante du plan.
    expect(nextMission(bornes, { island: 'history-6e-antiquity', mission: 'dates' })).toMatchObject({ place: { id: 'quais' } });
    expect(nextMission(bornes, { island: 'french-6e-phonology', mission: 'inconnue' })).toMatchObject({ place: { id: 'quais' } });
  });

  it('sinon la première encore à jouer (fermée dans la grille comprise), lieu par lieu, mission par mission ; hors des lieux, rien', () => {
    expect(nextMission(bornes)).toMatchObject({ place: { id: 'quais' }, mission: 'times-tables' });
    const sansNouvelle = bornes.map((b) => (b.etat === 'new' || b.etat === 'locked' ? { ...b, etat: 3 } : b));
    expect(nextMission(sansNouvelle)).toMatchObject({ place: { id: 'ecluses' }, mission: 'number-line' });
    expect(nextMission(bornes.filter((b) => b.ile === 'history-6e-antiquity'))).toBeNull();
    expect(nextMission(bornes.map((b) => ({ ...b, etat: 3 })))).toBeNull();
  });
});

describe('La marque à l’écran', () => {
  it('sur son lieu quand il est dans l’écran', () => {
    expect(markOnScreen({ x: 300, y: 200, behind: false }, 1000, 800, 50)).toEqual({ x: 300, y: 200, inside: true, angle: 0, far: 1, beside: false });
    // À côté de la lanterne du Phare : seulement dans l'écran.
    expect(markOnScreen({ x: 300, y: 200, behind: false }, 1000, 800, 50, 1, true).beside).toBe(true);
    expect(markOnScreen({ x: 1600, y: 200, behind: false }, 1000, 800, 50, 1, true).beside).toBe(false);
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

  it('la flèche du bord gauche passe sous la colonne des accès directs, au bord, jamais à côté (GD-20, lot 1)', () => {
    // La colonne : 72 px depuis le bord, jusqu'à 184 + 16 px depuis le haut (consultant UX UI).
    const colonne = { left: 0, top: 0, width: 72, height: 200, below: true };
    for (const [w, h] of [[844, 390], [667, 375], [1024, 768]]) {
      const fleche = keepClear({ left: 8, top: 60, width: 64, height: 70 }, [colonne, reglages, { left: 8, top: h - 80, width: 80, height: 70 }], w, h, 8, 8);
      expect(fleche.left).toBe(8);
      expect(fleche.top).toBeGreaterThanOrEqual(208);
    }
    // Un écran bas au plus grand texte : sous la colonne, la marque couvrirait « Carte » ; elle passe à droite de la
    // colonne, sans couvrir ni l'une ni l'autre.
    const carte = { left: 19, top: 285, width: 157, height: 80 };
    const haute = keepClear({ left: 8, top: 150, width: 338, height: 85 }, [colonne, carte], 844, 390, 8, 8);
    expect(haute.left).toBeGreaterThanOrEqual(80);
    expect(haute.top + haute.height <= carte.top || haute.left >= carte.left + carte.width).toBe(true);
    // Hors de la colonne, rien ne change.
    const box = { left: 8, top: 260, width: 64, height: 70 };
    expect(keepClear(box, [colonne], 1024, 768, 8, 8)).toEqual(box);
  });
});

describe('Les bornes du monde ouvert (correctif du quatrième lot du point 8)', () => {
  it('sans pont dans la grille, une mission réussie aux Filets montre ses étoiles, et la prochaine mission passe à la suivante', () => {
    const state: GameState = { ...EMPTY_STATE, progress: { 'french-6e-grammar-spelling-word-classes-1': { stars: 3, attempts: 1, best: 1 } } };
    const modele = modeleDuMonde(state, '6e', NOMS_ARCHIPELS, textesDe('archipeo').libelles);
    // Le modèle de la grille garde l'île fermée (aucun pont) : c'est lui qui affichait « Nouveau ».
    expect(modele.bornes.find((b) => b.mission === 'word-classes')?.etat).toBe('locked');
    const vues = bornesDuMondeOuvert(modele.bornes, (ile, m) => questProgress(ile as BiomeId, m, state.progress)?.stars ?? null);
    const filets = missionsOfPlace(placeById('filets'), vues);
    expect(filets.find((b) => b.mission === 'word-classes')?.etat).toBe(3);
    // Les autres restent fermées (elles s'ouvrent ici) ; rien d'autre ne change.
    expect(filets.filter((b) => b.mission !== 'word-classes').every((b) => b.etat === 'locked')).toBe(true);
    expect(vues.filter((b) => b.ile !== 'french-6e-grammar-spelling')).toEqual(modele.bornes.filter((b) => b.ile !== 'french-6e-grammar-spelling'));
    const onlyFilets = vues.filter((b) => b.ile === 'french-6e-grammar-spelling');
    expect(nextMission(onlyFilets)).toMatchObject({ place: { id: 'filets' }, mission: 'sorting' });
    expect(nextMission(modele.bornes.filter((b) => b.ile === 'french-6e-grammar-spelling'))?.mission).toBe('word-classes');
  });

});
