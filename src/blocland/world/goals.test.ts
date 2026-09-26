import { EMPTY_STATE, sanitizeState } from '../engine';
import { lockedHint, nextGoal } from './goals';
import { planCells, plansFor } from './plans';
import { overviewBounds, worldBounds } from './terrain';
import { VEHICLE_STAGES } from './vehicle';

const [coque] = VEHICLE_STAGES;
const guardians = (ids: string[]) => Object.fromEntries(ids.map((id) => [`${id}-gardien`, { stars: 2 }]));

it('le prochain objectif dit ce qu’il manque pour le plan, ou pour l’ouvrage le moins cher', () => {
  const fresh = sanitizeState({});
  expect(nextGoal(fresh, 'foret')).toBe('Encore 16 bois pour La cabane de Mousso, ou 3 blocs pour le sentier vers Mine des lettres.');
  const some = sanitizeState({ inventory: { bois: 5 } });
  expect(nextGoal(some, 'foret')).toBe('Encore 11 bois pour La cabane de Mousso, ou tu peux construire le sentier vers Mine des lettres.');
  const rich = sanitizeState({ inventory: { bois: 20 } });
  expect(nextGoal(rich, 'foret')).toBe('Tu as tout pour finir La cabane de Mousso : pose tes blocs, ou tu peux construire le sentier vers Mine des lettres.');
  // Tous les plans posés et tous les ouvrages construits : plus rien à dire.
  const plans = Object.fromEntries(plansFor('foret').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const done = sanitizeState({ village: { plans, bridges: ['foret-mine', 'foret-ferme'] } });
  expect(nextGoal(done, 'foret')).toBeNull();
  expect(nextGoal(EMPTY_STATE, 'mine')).toContain('pour La forge de Tunel');
});

it('sur le port, le prochain objectif parle du Bloc-Navire : ses blocs, puis ses Gardiens, puis l’embarquement', () => {
  // Au début, sur la Plaine : le plan et l'ouvrage le moins cher passent d'abord (deux parties au plus).
  const fresh = sanitizeState({});
  expect(nextGoal(fresh, 'plaine')).toMatch(/^Encore \d+ brique pour Le nid de Coco, ou 3 blocs pour le (bac vers Rivière des fractions|pont vers Volcan des décimaux)\.$/);
  // Les plans de la Plaine finis et ses ouvrages construits : le chantier du navire.
  const plans = Object.fromEntries(plansFor('plaine').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const built = ['plaine-riviere', 'plaine-volcan'];
  expect(nextGoal(sanitizeState({ village: { plans, bridges: built } }), 'plaine')).toMatch(/^Encore \d+ (sable|bois) pour le Bloc-Navire\.$/);
  const stocked = sanitizeState({ village: { plans, bridges: built }, inventory: { sable: 30, bois: 30, galet: 10, pierre: 5 } });
  expect(nextGoal(stocked, 'plaine')).toBe('Tu as tout pour le Bloc-Navire : pose tes blocs.');
  // Toutes ses cases posées : il manque des Gardiens.
  const hull = { ...plans, [coque.id]: planCells(coque).map((c) => c.key) };
  const posed = sanitizeState({ village: { plans: hull, bridges: built }, progress: guardians(['foret']) });
  expect(nextGoal(posed, 'plaine')).toBe('Bats encore 2 Gardiens des Basses Terres pour la voile.');
  // Trois Gardiens : prêt à partir, et c'est la seule phrase.
  const ready = sanitizeState({ village: { plans: hull, bridges: built }, progress: guardians(['foret', 'plaine', 'mine']) });
  expect(nextGoal(ready, 'plaine')).toBe('Le Bloc-Navire est prêt : embarque vers les Collines du Large !');
  // Parti : plus un mot du navire sur ce port.
  const sailed = sanitizeState({ village: { plans: hull, bridges: [...built, 'voyage-5e'] }, progress: guardians(['foret', 'plaine', 'mine']) });
  expect(nextGoal(sailed, 'plaine')).toBeNull();
});

it('la vue d’ensemble cadre les îles ouvertes et leurs voisines, puis s’élargit', () => {
  const start = overviewBounds('6e', []);
  const all = worldBounds('6e');
  expect(start.maxX - start.minX).toBeLessThan(all.maxX - all.minX);
  const later = overviewBounds('6e', ['foret-mine', 'mine-carriere']);
  expect(later.maxX).toBeGreaterThan(start.maxX);
  // L'étendue de la scène comprend le port (la jetée et le navire, devant la Plaine).
  expect(all.minY).toBeLessThan(start.minY + 4);
});

it('une île fermée dit l’ouvrage précis qui y mène, ou l’île à ouvrir d’abord', () => {
  const fresh = sanitizeState({});
  expect(lockedHint(fresh, 'mine')).toBe('Pas si vite ! Pour venir ici, construis le sentier depuis Forêt des sons : 3 blocs.');
  // La Carrière est à deux ouvrages : il faut d'abord ouvrir la Mine.
  expect(lockedHint(fresh, 'carriere')).toBe('Pas si vite ! Ouvre d’abord Mine des lettres : de là, un ouvrage mène jusqu’ici.');
  expect(lockedHint(sanitizeState({ village: { bridges: ['foret-mine'] } }), 'carriere')).toContain('construis le pont depuis Mine des lettres : 5 blocs');
  // Un escalier dans les Monts : la condition est dite.
  const monts = sanitizeState({ village: { bridges: ['voyage-5e', 'voyage-4e', 'atelier-falaise'] } });
  expect(lockedHint(monts, 'cabinet')).toBe(
    'Pas si vite ! Pour venir ici, construis l’escalier taillé depuis Falaise des accords : 5 blocs. Il faut aussi un premier plan terminé de l’autre côté.',
  );
});

it('une île d’un autre archipel parle du Bloc-Navire : ses blocs, ses Gardiens, l’embarquement, ou l’archipel d’avant', () => {
  const fresh = sanitizeState({});
  const total = coque.cells.length;
  expect(lockedHint(fresh, 'carrefour')).toBe(
    `Pas si vite ! Mon île est dans les Collines du Large, de l’autre côté de la mer. Finis le Bloc-Navire sur Plaine des nombres : encore ${total} blocs.`,
  );
  const hull = { [coque.id]: planCells(coque).map((c) => c.key) };
  expect(lockedHint(sanitizeState({ village: { plans: hull }, progress: guardians(['foret', 'plaine']) }), 'marche')).toBe(
    'Pas si vite ! Mon île est dans les Collines du Large, de l’autre côté de la mer. Le Bloc-Navire attend sur Plaine des nombres : bats encore 1 Gardien des Basses Terres, puis embarque.',
  );
  expect(lockedHint(sanitizeState({ village: { plans: hull }, progress: guardians(['foret', 'plaine', 'mine']) }), 'marche')).toBe(
    'Pas si vite ! Mon île est dans les Collines du Large, de l’autre côté de la mer. Le Bloc-Navire est prêt sur Plaine des nombres : embarque !',
  );
  // Deux archipels plus loin : d'abord le précédent.
  expect(lockedHint(fresh, 'forge')).toBe('Pas si vite ! Mon île est dans les Monts de Feu. Va d’abord jusqu’aux Collines du Large avec le Bloc-Navire.');
  expect(lockedHint(sanitizeState({ village: { bridges: ['voyage-5e'] } }), 'phare')).toBe(
    'Pas si vite ! Mon île est dans les Îles du Ciel. Va d’abord jusqu’aux Monts de Feu avec le Bloc-Navire.',
  );
  expect(lockedHint(sanitizeState({ village: { bridges: ['voyage-5e', 'voyage-4e'] } }), 'phare')).toContain('de l’autre côté du ciel. Finis le Bloc-Navire sur Atelier du calcul littéral');
});
