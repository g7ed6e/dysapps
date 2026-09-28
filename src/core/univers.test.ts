import { aUneProgression, premierUnivers, UNIVERS, UNIVERS_IDS, UNIVERS_OUVERT, UNIVERS_PAR_DEFAUT, titreAffiche } from './univers';

it('reste fermé jusqu’à la bascule du lot 6', () => {
  expect(UNIVERS_OUVERT).toBe(false);
});

it('choisit le premier univers d’un appareil d’après sa progression', () => {
  // Un appareil neuf : Blocland, l'univers par défaut, sans message.
  expect(UNIVERS_PAR_DEFAUT).toBe('blocland');
  expect(premierUnivers({ progression: false })).toEqual({ univers: 'blocland', message: false });
  // Une progression : Blocland, avec le message unique qui présente Archipéo.
  expect(premierUnivers({ progression: true })).toEqual({ univers: 'blocland', message: true });
  // Archipéo ne s'active que dans les Réglages : jamais d'office (décision 8).
});

it('reconnaît une progression enregistrée, sans planter sur une sauvegarde abîmée', () => {
  expect(aUneProgression({}, {})).toBe(false);
  expect(aUneProgression(null, undefined)).toBe(false);
  expect(aUneProgression({ xp: 0, totalAnswers: 0 }, { progress: {} })).toBe(false);
  expect(aUneProgression({ xp: 12 }, {})).toBe(true);
  expect(aUneProgression({ totalAnswers: 3 }, {})).toBe(true);
  expect(aUneProgression({}, { progress: { 'foret:sons': { stars: 1 } } })).toBe(true);
  expect(aUneProgression({ xp: 'beaucoup' }, { progress: 'rien' })).toBe(false);
});

it('montre Blocland tant que l’univers est fermé', () => {
  expect(titreAffiche('archipeo', false)).toBe('blocland');
  expect(titreAffiche(undefined, false)).toBe('blocland');
  expect(titreAffiche('blocland', true)).toBe('blocland');
  expect(titreAffiche('archipeo', true)).toBe('archipeo');
  expect(titreAffiche(undefined, true)).toBe('blocland');
});

it('donne à chaque univers un nom, une phrase, une icône distincte et ses textes', () => {
  expect(UNIVERS_IDS).toEqual(['archipeo', 'blocland']);
  expect(new Set(UNIVERS_IDS.map((u) => UNIVERS[u].icone)).size).toBe(UNIVERS_IDS.length);
  for (const u of UNIVERS_IDS) {
    for (const texte of Object.values(UNIVERS[u])) expect(String(texte).trim()).not.toBe('');
  }
  // Aujourd'hui (fermé), les textes d'Archipéo sont ceux que l'élève lit déjà.
  expect(UNIVERS.archipeo).toMatchObject({ nom: 'Archipéo', phrase: 'Le savoir construit ton monde.', carte: 'Carte d’Archipéo' });
  expect(UNIVERS.blocland).toMatchObject({ nom: 'Blocland', carte: 'Carte de Blocland' });
  expect(UNIVERS.blocland.bienvenue).toMatch(/^Bienvenue à Blocland !/);
});
