import { textesDe } from '../univers';
import { SANS_LV2 } from './biomes';
import { accueilDeLIle, decouverteDeLIle } from './decouvertes';
import { sanitizeState } from './engine';
import { lockedHint } from './world/goals';

const fresh = sanitizeState({});

it('l’accueil d’une île : « pas de LV2 », l’accueil de sa créature, ou ce qu’il faut pour y venir', () => {
  const textes = textesDe('blocland');
  expect(accueilDeLIle(fresh, 'foret', false, textes)).toBe(textes.creatures.foret.greeting);
  expect(accueilDeLIle(fresh, 'mine', false, textes)).toBe(lockedHint(fresh, 'mine', textes.archipels));
  expect(accueilDeLIle(fresh, 'relais', true, textes)).toBe(SANS_LV2);
});

it('les découvertes : les ouvrages sur une île pâle, le Bloc-Navire au port, une fois par appareil, dans les mots de l’univers', () => {
  for (const u of ['blocland', 'archipeo'] as const) {
    localStorage.clear();
    const textes = textesDe(u);
    const ou = { port: 'plaine' as const, navire: true, textes };
    expect(decouverteDeLIle(fresh, 'foret', ou)).toBeNull();
    expect(decouverteDeLIle(fresh, 'mine', ou)).toBe(textes.libelles.decouverteOuvrages);
    expect(decouverteDeLIle(fresh, 'riviere', ou)).toBeNull();
    // Le port sans chantier de navire ne dit rien, et ne retient rien.
    expect(decouverteDeLIle(fresh, 'plaine', { ...ou, navire: false })).toBeNull();
    expect(decouverteDeLIle(fresh, 'plaine', ou)).toBe(textes.libelles.decouverteNavire);
    expect(decouverteDeLIle(fresh, 'plaine', ou)).toBeNull();
  }
  expect(textesDe('blocland').libelles.decouverteOuvrages).toContain('un col un Gardien vaincu.');
  expect(textesDe('archipeo').libelles.decouverteOuvrages).toContain('un col un Gardien rallumé.');
});
