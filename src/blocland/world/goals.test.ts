import { BLOCKS, blockCount, type BlockId } from '../biomes';
import { EMPTY_STATE, sanitizeState } from '../engine';
import { NOMS_ARCHIPELS } from './archipelago';
import * as goals from './goals';
import { planCells, plansFor } from './plans';
import { dockBox } from './harbour';
import { overviewBounds, worldBounds } from './terrain';
import { VEHICLE_STAGES } from './vehicle';

// Les phrases avec les noms communs des données ; les noms d'un univers sont essayés dans src/univers/univers.test.ts.
const nextGoal = (state: Parameters<typeof goals.nextGoal>[0], island: Parameters<typeof goals.nextGoal>[1]) => goals.nextGoal(state, island, NOMS_ARCHIPELS);
const nextGoalInfo = (state: Parameters<typeof goals.nextGoal>[0], island: Parameters<typeof goals.nextGoal>[1]) => goals.nextGoalInfo(state, island, NOMS_ARCHIPELS);
const lockedHint = (state: Parameters<typeof goals.nextGoal>[0], island: Parameters<typeof goals.nextGoal>[1]) => goals.lockedHint(state, island, NOMS_ARCHIPELS);

const [coque] = VEHICLE_STAGES;
const guardians = (ids: string[]) => Object.fromEntries(ids.map((id) => [`${id}-gardien`, { stars: 2 }]));

it('le prochain objectif est unique : d’abord ce qu’on peut faire tout de suite, sinon le plus proche', () => {
  const fresh = sanitizeState({});
  // 3 blocs pour le sentier, c'est plus proche que les bois de la cabane.
  expect(nextGoal(fresh, 'foret')).toBe('Encore 3 blocs pour le sentier vers Mine des lettres.');
  expect(nextGoalInfo(fresh, 'foret')).toMatchObject({ have: 0, need: 3 });
  const some = sanitizeState({ inventory: { bois: 5 } });
  expect(nextGoal(some, 'foret')).toBe('Tu peux construire le sentier vers Mine des lettres.');
  const cabane = plansFor('foret')[0].cells.length;
  const rich = sanitizeState({ inventory: { bois: cabane } });
  expect(nextGoal(rich, 'foret')).toBe('Tu as tout pour finir La cabane de Mousso : pose tes blocs.');
  expect(nextGoalInfo(rich, 'foret')).toMatchObject({ have: cabane, need: cabane });
  // Tous les plans posés et tous les ouvrages construits : plus rien à dire.
  const plans = Object.fromEntries(plansFor('foret').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const done = sanitizeState({ village: { plans, bridges: ['foret-mine', 'foret-ferme', 'foret-horloge'] } });
  expect(nextGoal(done, 'foret')).toBeNull();
  expect(nextGoal(EMPTY_STATE, 'mine')).toBe('Encore 3 blocs pour le sentier vers Forêt des sons.');
});

it('sur le port, le prochain objectif parle du Bloc-Navire : ses blocs, puis ses Gardiens, puis l’embarquement', () => {
  // Au début, sur la Plaine : l'ouvrage le moins cher (3 blocs) est plus proche que le plan.
  const fresh = sanitizeState({});
  expect(nextGoal(fresh, 'plaine')).toMatch(/^Encore 3 blocs pour le (bac vers Rivière des fractions|pont vers Volcan des décimaux)\.$/);
  // Les plans de la Plaine finis et ses ouvrages construits : le chantier du navire.
  const plans = Object.fromEntries(plansFor('plaine').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const built = ['plaine-riviere', 'plaine-volcan'];
  expect(nextGoal(sanitizeState({ village: { plans, bridges: built } }), 'plaine')).toMatch(/^Encore \d+ blocs? de (sable|bois)( et \d+ [^.]+)? pour le Bloc-Navire\.$/);
  const stocked = sanitizeState({ village: { plans, bridges: built }, inventory: { sable: 30, bois: 30, galet: 10, pierre: 5 } });
  expect(nextGoal(stocked, 'plaine')).toBe('Tu as tout pour le Bloc-Navire : pose tes blocs.');
  // Toutes ses cases posées : il manque des Gardiens.
  const hull = { ...plans, [coque.id]: planCells(coque).map((c) => c.key) };
  const posed = sanitizeState({ village: { plans: hull, bridges: built }, progress: guardians(['foret']) });
  expect(nextGoal(posed, 'plaine')).toBe('Bats encore 2 Gardiens des Premiers Rivages pour la voile.');
  // Trois Gardiens : prêt à partir, et c'est la seule phrase.
  const ready = sanitizeState({ village: { plans: hull, bridges: built }, progress: guardians(['foret', 'plaine', 'mine']) });
  expect(nextGoal(ready, 'plaine')).toBe('Le Bloc-Navire est prêt : embarque vers les Îles Brumeuses !');
  // Parti : plus un mot du navire sur ce port.
  const sailed = sanitizeState({ village: { plans: hull, bridges: [...built, 'voyage-5e'] }, progress: guardians(['foret', 'plaine', 'mine']) });
  expect(nextGoal(sailed, 'plaine')).toBeNull();
});

it('les quantités de blocs s’accordent : « 18 toits et 3 lanternes », « 3 blocs de sable » (référent dys, 28/09)', () => {
  // Le deuxième plan de la Forêt : il manque des blocs de finition, qu'on compte comme des objets.
  const cabane = plansFor('foret')[0];
  const plans = { [cabane.id]: planCells(cabane).map((c) => c.key) };
  expect(nextGoal(sanitizeState({ village: { plans, bridges: ['foret-mine', 'foret-ferme', 'foret-horloge'] } }), 'foret')).toBe(
    'Encore 18 toits et 3 lanternes pour Le toit de la cabane.',
  );
  expect(blockCount('lanterne', 1)).toBe('1 lanterne');
  expect(blockCount('barriere', 5)).toBe('5 barrières');
  expect(blockCount('panneau', 2)).toBe('2 panneaux');
  expect(blockCount('cristal', 2)).toBe('2 cristaux');
  expect(blockCount('taille', 4)).toBe('4 pierres de taille');
  // Les matières se comptent en blocs, le nom reste au singulier : ni « 2 ors », ni « 3 verres ».
  expect(blockCount('sable', 3)).toBe('3 blocs de sable');
  expect(blockCount('or', 2)).toBe('2 blocs d’or');
  expect(blockCount('bois', 1)).toBe('1 bloc de bois');
  // Aucun bloc ne reste au singulier après un nombre de 2 ou plus.
  for (const id of Object.keys(BLOCKS) as BlockId[]) {
    const text = blockCount(id, 2);
    expect(text, id).not.toBe(`2 ${BLOCKS[id].name.toLowerCase()}`);
    expect(text, id).toMatch(/^2 [^ ]*[sx]\b/);
  }
});

it('la vue d’ensemble cadre les îles ouvertes et leurs voisines, puis s’élargit', () => {
  const start = overviewBounds('6e', []);
  const all = worldBounds('6e');
  expect(start.maxX - start.minX).toBeLessThan(all.maxX - all.minX);
  const later = overviewBounds('6e', ['foret-mine', 'mine-carriere']);
  expect(later.maxX).toBeGreaterThan(start.maxX);
  // L'étendue de la scène comprend le port (la jetée et le navire, devant la Plaine).
  const dock = dockBox('plaine');
  expect(all.minY).toBeLessThanOrEqual(dock.y0 - 2);
  expect(all.maxX).toBeGreaterThanOrEqual(dock.x1 + 2);
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
    `Pas si vite ! Mon île est dans les Îles Brumeuses, de l’autre côté de la mer. Finis le Bloc-Navire sur Plaine des nombres : encore ${total} blocs.`,
  );
  const hull = { [coque.id]: planCells(coque).map((c) => c.key) };
  expect(lockedHint(sanitizeState({ village: { plans: hull }, progress: guardians(['foret', 'plaine']) }), 'marche')).toBe(
    'Pas si vite ! Mon île est dans les Îles Brumeuses, de l’autre côté de la mer. Le Bloc-Navire attend sur Plaine des nombres : bats encore 1 Gardien des Premiers Rivages, puis embarque.',
  );
  expect(lockedHint(sanitizeState({ village: { plans: hull }, progress: guardians(['foret', 'plaine', 'mine']) }), 'marche')).toBe(
    'Pas si vite ! Mon île est dans les Îles Brumeuses, de l’autre côté de la mer. Le Bloc-Navire est prêt sur Plaine des nombres : embarque !',
  );
  // Deux archipels plus loin : d'abord le précédent.
  expect(lockedHint(fresh, 'forge')).toBe('Pas si vite ! Mon île est dans les Anciens Ateliers. Va d’abord jusqu’aux Îles Brumeuses avec le Bloc-Navire.');
  expect(lockedHint(sanitizeState({ village: { bridges: ['voyage-5e'] } }), 'phare')).toBe(
    'Pas si vite ! Mon île est dans les Îles du Ciel. Va d’abord jusqu’aux Anciens Ateliers avec le Bloc-Navire.',
  );
  expect(lockedHint(sanitizeState({ village: { bridges: ['voyage-5e', 'voyage-4e'] } }), 'phare')).toContain('de l’autre côté du ciel. Finis le Bloc-Navire sur Atelier du calcul littéral');
});
