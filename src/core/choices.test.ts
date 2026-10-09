import { parseHour, parseNumber, placeAnswer } from './choices';

describe('les heures parmi les choix', () => {
  it('« H h MM » se lit en minutes depuis minuit ; le reste n’est pas une heure', () => {
    expect(parseHour('9 h 45')).toBe(585);
    expect(parseHour('17 h 00')).toBe(1020);
    expect(parseHour('17 h')).toBeUndefined();
    expect(parseHour('9h45')).toBeUndefined();
  });

  it('des heures sont rangées dans l’ordre de la journée, sans heure inventée, quelle que soit la place visée', () => {
    for (const place of [0, 1, 2])
      expect(placeAnswer(['9 h 45', '8 h 40', '9 h 25'], '9 h 25', place, () => 0.5)).toEqual(['8 h 40', '9 h 25', '9 h 45']);
  });

  it('une date écrite « le 20 juin » est un mot : aucun piège calculé', () => {
    const choix = placeAnswer(['le 2 juin', 'le 12 juin', 'le 20 juin'], 'le 20 juin', 0, () => 0.5);
    expect([...choix].sort()).toEqual(['le 12 juin', 'le 2 juin', 'le 20 juin']);
    expect(choix[0]).toBe('le 20 juin');
  });
});

describe('les années avant notre ère parmi les choix', () => {
  it('« 753 avant J.-C. » compte en négatif : l’ordre croissant est celui de la frise', () => {
    expect(parseNumber('753 avant J.-C.')).toEqual({ value: -753, decimals: 0, unit: ' avant J.-C.' });
    expect(parseNumber('1914')?.value).toBe(1914);
    const valeurs = ['753 avant J.-C.', '509 avant J.-C.', '44 avant J.-C.'].map((c) => parseNumber(c)!.value);
    expect(valeurs).toEqual([...valeurs].sort((a, b) => a - b));
  });

  it('hors des maths, des années qui se suivent avant notre ère restent celles du fichier, jamais « −753 avant J.-C. »', () => {
    const choix = ['753 avant J.-C.', '752 avant J.-C.', '751 avant J.-C.'];
    for (const place of [0, 1, 2]) expect(placeAnswer(choix, '752 avant J.-C.', place, () => 0.5, 'du-fichier').every((c) => !String(c).includes('−') && !String(c).startsWith('-'))).toBe(true);
  });
});
