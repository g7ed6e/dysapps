import { textesDe } from '../universes';
import { SANS_LV2 } from './biomes';
import { accueilDeLIle, decouverteDeLIle } from './discoveries';
import { sanitizeState } from './engine';
import { lockedHint } from './world/goals';

const fresh = sanitizeState({});

it('l’accueil d’une île : « pas de LV2 », l’accueil de sa créature, ou ce qu’il faut pour y venir', () => {
  const textes = textesDe('blocland');
  expect(accueilDeLIle(fresh, 'french-6e-phonology', false, textes)).toBe(textes.creatures['french-6e-phonology'].greeting);
  expect(accueilDeLIle(fresh, 'french-6e-letter-confusion', false, textes)).toBe(lockedHint(fresh, 'french-6e-letter-confusion', textes.archipels, textes.libelles));
  expect(accueilDeLIle(fresh, 'lv2-5e-introductions', true, textes)).toBe(SANS_LV2);
});

it('les découvertes : les ouvrages sur une île pâle, le Bloc-Navire au port, une fois par appareil, dans les mots de l’univers', () => {
  for (const u of ['blocland', 'archipeo'] as const) {
    localStorage.clear();
    const textes = textesDe(u);
    const ou = { port: 'maths-6e-calculation' as const, navire: true, textes };
    expect(decouverteDeLIle(fresh, 'french-6e-phonology', ou)).toBeNull();
    expect(decouverteDeLIle(fresh, 'french-6e-letter-confusion', ou)).toBe(textes.libelles.decouverteOuvrages);
    expect(decouverteDeLIle(fresh, 'maths-6e-fractions', ou)).toBeNull();
    // Le port sans chantier de navire ne dit rien, et ne retient rien.
    expect(decouverteDeLIle(fresh, 'maths-6e-calculation', { ...ou, navire: false })).toBeNull();
    expect(decouverteDeLIle(fresh, 'maths-6e-calculation', ou)).toBe(textes.libelles.decouverteNavire);
    expect(decouverteDeLIle(fresh, 'maths-6e-calculation', ou)).toBeNull();
  }
  // Aucun ouvrage ne demande un Gardien (GD-7) ni une mission (GD-9) : des blocs, depuis l'île de son choix.
  expect(textesDe('blocland').libelles.decouverteOuvrages).toBe(
    'Les îles pâles sont fermées. Pour y venir, pose un ouvrage. Il part de l’île de ton choix. Chaque ouvrage coûte le même nombre de blocs.',
  );
  expect(textesDe('archipeo').libelles.decouverteOuvrages).toBe(
    'Les îles pâles sont fermées. Pour y aller, pose un ouvrage. Il part de l’île de ton choix. Chaque ouvrage coûte le même nombre de blocs.',
  );
  for (const u of ['blocland', 'archipeo'] as const) expect(textesDe(u).libelles.decouverteOuvrages).not.toContain('Gardien');
});
