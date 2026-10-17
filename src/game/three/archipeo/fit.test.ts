import { belowFold, filledGap, inVisibleScene, labelBesideBar, overflows, wordsCut } from './fit';

const box = (clientWidth: number, scrollWidth: number, clientHeight = 50, scrollHeight = 50) => ({ clientWidth, scrollWidth, clientHeight, scrollHeight });

describe('Ce qui tient à l’écran', () => {
  it('une colonne déborde en hauteur ou en largeur, au pixel près', () => {
    expect(overflows(box(300, 300))).toBe(false);
    expect(overflows(box(300, 301))).toBe(false);
    expect(overflows(box(300, 320))).toBe(true);
    expect(overflows(box(300, 300, 200, 240))).toBe(true);
  });

  it('un mot de cloche plus large que son étiquette est coupé : on répond alors dans « Vue simple »', () => {
    expect(wordsCut([box(128, 120), box(128, 128)])).toBe(false);
    // « pantalon » en OpenDyslexic 32 px dans une étiquette de 128 px.
    expect(wordsCut([box(128, 120), box(128, 190)])).toBe(true);
    // Une étiquette cachée (la consigne au premier item) ne compte pas.
    expect(wordsCut([box(0, 190)])).toBe(false);
    expect(wordsCut([])).toBe(false);
  });
});

describe('Le mot juste dans le trou', () => {
  it('après une réussite, au premier ou au deuxième essai ; jamais après une erreur ni avant de répondre', () => {
    expect(filledGap('Une … mouette.', 'petite', [{ correct: true }])).toEqual({ before: 'Une ', after: ' mouette.' });
    // Le deuxième essai : la réponse que le lanceur retient est la dernière, juste.
    expect(filledGap('Une … mouette.', 'petite', [{ correct: true }])).not.toBeNull();
    expect(filledGap('Une … mouette.', 'petite', [{ correct: false }])).toBeNull();
    expect(filledGap('Une … mouette.', 'petite', undefined)).toBeNull();
    expect(filledGap('Combien de caisses ?', '17', [{ correct: true }])).toBeNull();
  });

  it('un repère de la scène se cache quand son point sort de la scène visible : hors de l’écran, au bord, sous le panneau', () => {
    const panel = { left: 8, top: 100, right: 836, bottom: 380 };
    expect(inVisibleScene({ x: 400, y: 60 }, 844, 390, panel)).toBe(true);
    // Sous le panneau (« 1/4 » à 844 × 390), au bord de l'écran, hors de l'écran.
    expect(inVisibleScene({ x: 820, y: 200 }, 844, 390, panel)).toBe(false);
    expect(inVisibleScene({ x: 830, y: 60 }, 844, 390, panel)).toBe(false);
    expect(inVisibleScene({ x: -5, y: 60 }, 844, 390, null)).toBe(false);
    expect(inVisibleScene({ x: 400, y: 380 }, 844, 390, null)).toBe(false);
    // Sans panneau mesuré, l'écran seul.
    expect(inVisibleScene({ x: 820, y: 200 }, 844, 390, null)).toBe(true);
  });
});

describe('Un repère de la scène face aux boutons du haut (relecture du lot L5, consultant UX UI)', () => {
  // « Vue simple » et la pause sur un téléphone couché (667 × 375) : de 372 px au bord, de 8 à 64 px.
  const bar = { left: 372, top: 8, right: 667, bottom: 64 };
  const box = (top: number, left = 515) => ({ left, top, right: left + 36, bottom: top + 34 });

  it('à sa place quand il ne touche aucun bouton, ou qu’il est à gauche d’eux', () => {
    expect(labelBesideBar(box(80), box(96), bar)).toBe('place');
    expect(labelBesideBar(box(40, 300), box(56, 300), bar)).toBe('place');
  });

  it('sous son point quand il passerait sous un bouton, caché s’il le touche encore', () => {
    expect(labelBesideBar(box(60), box(76), bar)).toBe('dessous');
    expect(labelBesideBar(box(20), box(36), bar)).toBe('cache');
  });
});

describe('Le pli d’un C (lot L6a)', () => {
  // Une colonne de 300 px de haut, à 100 px du haut de l'écran, bordée de 2 px ; 34 px gardés pour « Suite plus bas ».
  const box = { clientTop: 2, clientHeight: 300, getBoundingClientRect: () => ({ top: 100 }) };
  const at = (bottom: number) => ({ getBoundingClientRect: () => ({ bottom }) });

  it('dit de combien la plus basse des réponses passe sous le pli, repère compté ; 0 quand toutes se voient', () => {
    expect(belowFold(box, [at(200), at(368)], 34)).toBe(0);
    expect(belowFold(box, [at(200), at(369)], 34)).toBe(0);
    expect(belowFold(box, [at(300), at(390)], 34)).toBe(22);
    expect(belowFold(box, [at(402)])).toBe(0);
    expect(belowFold(box, [at(410)])).toBe(8);
    expect(belowFold(box, [])).toBe(0);
  });
});
