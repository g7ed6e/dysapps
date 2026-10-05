import { BLOC, BLOCKS, blockCount, type BlockId } from '../biomes';
import { EMPTY_STATE, sanitizeState } from '../engine';
import { textesDe } from '../../universes';
import { BRIDGES, NOMS_ARCHIPELS, getBridge, islandsOf, type BridgeDef } from './archipelago';
import { BIOMES, getBiome, missionsJouables, type BiomeId } from '../biomes';
import { exercisesOf } from '../exercises';
import {
  lockedHint as lockedHintDe,
  nextGoal as nextGoalDe,
  nextGoalInfo as nextGoalInfoDe,
  ouvrageSuggere,
  ouvragesParSuggestion,
  partJouee,
} from './goals';
import { planCells, plansFor } from './plans';
import { dockBox } from './harbour';
import { overviewBounds, worldBounds } from './terrain';
import { VEHICLE_STAGES } from './vehicle';
import { nextDestination as nextDestinationDe } from './destination';

// L'indice d'une île fermée et le prochain objectif disent les Gardiens avec les mots de l'univers (Blocland par défaut),
// et les archipels avec les noms communs des données ; les noms d'un univers sont essayés dans src/universes/universes.test.ts.
type Etat = Parameters<typeof lockedHintDe>[0];
type Ile = Parameters<typeof lockedHintDe>[1];
type Univers = 'blocland' | 'archipeo';
const lockedHint = (state: Etat, island: Ile, univers: Univers = 'blocland') => lockedHintDe(state, island, NOMS_ARCHIPELS, textesDe(univers).libelles);
const nextGoal = (state: Etat, island: Ile, univers: Univers = 'blocland') => nextGoalDe(state, island, NOMS_ARCHIPELS, textesDe(univers).libelles);
const nextGoalInfo = (state: Etat, island: Ile) => nextGoalInfoDe(state, island, NOMS_ARCHIPELS, textesDe('blocland').libelles);

const [coque] = VEHICLE_STAGES;
const guardians = (ids: string[]) => Object.fromEntries(ids.map((id) => [`${id}-challenge`, { stars: 2 }]));

it('le prochain objectif est unique : d’abord ce qu’on peut faire tout de suite, sinon le plus proche', () => {
  const fresh = sanitizeState({});
  // Le bâtiment de l'île se pose tout seul (GD-6) : l'objectif est le sentier.
  // L'ouvrage suggéré (GD-7) : rien de joué, le français passe d'abord (l'ordre de docs/contenu/archipel.md).
  expect(nextGoal(fresh, 'french-6e-phonology')).toBe('Encore 4 blocs pour le sentier vers Mine des lettres. Il ouvre une île de français.');
  expect(nextGoalInfo(fresh, 'french-6e-phonology')).toMatchObject({ have: 0, need: 4 });
  const some = sanitizeState({ stock: { [BLOC.bois]: 5 } });
  expect(nextGoal(some, 'french-6e-phonology')).toBe('Tu peux construire le sentier vers Mine des lettres. Il ouvre une île de français.');
  const rich = sanitizeState({ stock: { [BLOC.bois]: 40 } });
  expect(nextGoal(rich, 'french-6e-phonology')).not.toMatch(/cabane/);
  // Tous les ouvrages construits : plus rien à dire, que le bâtiment soit fini ou non.
  const done = sanitizeState({ world: { links: ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-english-6e-grammar', 'french-6e-phonology-english-6e-vocabulary'] } });
  expect(nextGoal(done, 'french-6e-phonology')).toBeNull();
  expect(nextGoal(EMPTY_STATE, 'french-6e-letter-confusion')).toBe('Encore 4 blocs pour le sentier vers Forêt des sons.');
});

it('sur le port, le prochain objectif parle du Bloc-Navire : ses blocs, puis ses Gardiens, puis l’embarquement', () => {
  // Au début, sur la Plaine : l'ouvrage suggéré (4 blocs, GD-7) est plus proche que le navire ; rien de joué, le français.
  const fresh = sanitizeState({});
  expect(nextGoal(fresh, 'maths-6e-calculation')).toBe('Encore 4 blocs pour le bac vers Tour du lecteur. Il ouvre une île de français.');
  // Les ouvrages de la Plaine construits : le chantier du navire.
  const plans = Object.fromEntries(plansFor('maths-6e-calculation').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const built = ['maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals', 'maths-6e-calculation-french-6e-reading', 'maths-6e-calculation-french-6e-word-spelling'];
  expect(nextGoal(sanitizeState({ world: { parts: plans, links: built } }), 'maths-6e-calculation')).toMatch(/^Encore \d+ blocs? de (sable|bois)( et \d+ [^.]+)? pour le Bloc-Navire\.$/);
  const stocked = sanitizeState({ world: { parts: plans, links: built }, stock: { [BLOC.sable]: 30, [BLOC.bois]: 30, [BLOC.galet]: 10, [BLOC.pierre]: 5 } });
  expect(nextGoal(stocked, 'maths-6e-calculation')).toBe('Tu as tout pour le Bloc-Navire : pose tes blocs.');
  // Toutes ses cases posées : il manque des Gardiens.
  const hull = { ...plans, [coque.id]: planCells(coque).map((c) => c.key) };
  const posed = sanitizeState({ world: { parts: hull, links: built }, progress: guardians(['french-6e-phonology']) });
  expect(nextGoal(posed, 'maths-6e-calculation')).toBe('Rallume encore 2 Gardiens des Premiers Rivages pour la voile.');
  expect(nextGoal(posed, 'maths-6e-calculation', 'archipeo')).toBe('Rallume encore 2 Gardiens des Premiers Rivages pour la voile.');
  // Trois Gardiens : prêt à partir, et c'est la seule phrase.
  const ready = sanitizeState({ world: { parts: hull, links: built }, progress: guardians(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion']) });
  expect(nextGoal(ready, 'maths-6e-calculation')).toBe('Le Bloc-Navire est prêt : embarque vers les Îles Brumeuses !');
  // Parti : plus un mot du navire sur ce port.
  const sailed = sanitizeState({ world: { parts: hull, links: [...built, 'passage-5e'] }, progress: guardians(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion']) });
  expect(nextGoal(sailed, 'maths-6e-calculation')).toBeNull();
});

it('les quantités de blocs s’accordent : « 18 toits », « 3 blocs de sable » (référent dys, 28/09)', () => {
  // Les blocs de finition se comptent comme des objets.
  expect(blockCount(BLOC.toit, 18)).toBe('18 toits');
  expect(blockCount(BLOC.lanterne, 1)).toBe('1 lanterne');
  expect(blockCount(BLOC.barriere, 5)).toBe('5 barrières');
  expect(blockCount(BLOC.panneau, 2)).toBe('2 panneaux');
  expect(blockCount(BLOC.cristal, 2)).toBe('2 cristaux');
  expect(blockCount(BLOC.taille, 4)).toBe('4 pierres de taille');
  // Les matières se comptent en blocs, le nom reste au singulier : ni « 2 ors », ni « 3 verres ».
  expect(blockCount(BLOC.sable, 3)).toBe('3 blocs de sable');
  expect(blockCount(BLOC.or, 2)).toBe('2 blocs d’or');
  expect(blockCount(BLOC.bois, 1)).toBe('1 bloc de bois');
  // Aucun bloc ne reste au singulier après un nombre de 2 ou plus.
  for (const id of Object.keys(BLOCKS) as BlockId[]) {
    const text = blockCount(id, 2);
    expect(text, id).not.toBe(`2 ${BLOCKS[id].name.toLowerCase()}`);
    expect(text, id).toMatch(/^2 [^ ]*[sx]\b/);
  }
});

it('la vue d’ensemble cadre les îles ouvertes et leurs voisines, puis s’élargit', () => {
  // Aux Premiers Rivages, le port en étoile (GD-7) mène dès le départ à chaque île : tout l'archipel est cadré, et le
  // cadre ne bouge plus.
  const start = overviewBounds('6e', []);
  const all = worldBounds('6e');
  expect(start.minX).toBeLessThanOrEqual(all.minX);
  expect(start.maxX).toBeGreaterThanOrEqual(all.maxX);
  expect(overviewBounds('6e', ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-french-6e-word-spelling'])).toEqual(start);
  // Aux Îles Brumeuses, le Relais des voyageurs (LV2) n'entre dans le cadre qu'une fois le Comptoir ouvert.
  const marche = overviewBounds('5e', ['passage-5e']);
  const later = overviewBounds('5e', ['passage-5e', 'maths-5e-proportionality-english-5e-vocabulary']);
  expect(later.maxX).toBeGreaterThan(marche.maxX);
  // L'étendue de la scène comprend le port (la jetée et le navire, devant la Plaine).
  const dock = dockBox('maths-6e-calculation');
  expect(all.minY).toBeLessThanOrEqual(dock.y0 - 2);
  expect(all.maxX).toBeGreaterThanOrEqual(dock.x1 + 2);
});

it('une île fermée dit l’ouvrage précis qui y mène, ou l’île à ouvrir d’abord', () => {
  const fresh = sanitizeState({});
  expect(lockedHint(fresh, 'french-6e-letter-confusion')).toBe('Pas si vite ! Pour venir ici, construis le sentier depuis Forêt des sons : 4 blocs.');
  // La Carrière : la liaison du port, depuis la Plaine (GD-7).
  expect(lockedHint(fresh, 'french-6e-word-spelling')).toBe('Pas si vite ! Pour venir ici, construis le bac depuis Plaine des nombres : 4 blocs.');
  // Le Théâtre est à deux ouvrages du port : il faut d'abord ouvrir le Cabinet.
  const ateliers = sanitizeState({ world: { links: ['passage-5e', 'passage-4e', 'maths-4e-algebra-french-4e-agreement'] } });
  expect(lockedHint(ateliers, 'english-4e-comprehension')).toBe('Pas si vite ! Ouvre d’abord Cabinet des mots : de là, un ouvrage mène jusqu’ici.');
  // Un escalier dans les Monts : la condition est dite.
  const monts = sanitizeState({ world: { links: ['passage-5e', 'passage-4e', 'maths-4e-algebra-french-4e-agreement'] } });
  expect(lockedHint(monts, 'french-4e-vocabulary')).toBe(
    'Pas si vite ! Pour venir ici, construis l’escalier taillé depuis Falaise des accords : 5 blocs. Réussis aussi une mission sur Falaise des accords.',
  );
});

it('une île d’un autre archipel parle du Bloc-Navire : ses blocs, ses Gardiens, l’embarquement, ou l’archipel d’avant', () => {
  const fresh = sanitizeState({});
  const total = coque.cells.length;
  expect(lockedHint(fresh, 'french-5e-homophones')).toBe(
    `Pas si vite ! Mon île est dans les Îles Brumeuses, de l’autre côté de la mer. Finis le Bloc-Navire sur Plaine des nombres : encore ${total} blocs.`,
  );
  const hull = { [coque.id]: planCells(coque).map((c) => c.key) };
  expect(lockedHint(sanitizeState({ world: { parts: hull }, progress: guardians(['french-6e-phonology', 'maths-6e-calculation']) }), 'maths-5e-proportionality')).toBe(
    'Pas si vite ! Mon île est dans les Îles Brumeuses, de l’autre côté de la mer. Le Bloc-Navire attend sur Plaine des nombres : rallume encore 1 Gardien des Premiers Rivages, puis embarque.',
  );
  expect(lockedHint(sanitizeState({ world: { parts: hull }, progress: guardians(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion']) }), 'maths-5e-proportionality')).toBe(
    'Pas si vite ! Mon île est dans les Îles Brumeuses, de l’autre côté de la mer. Le Bloc-Navire est prêt sur Plaine des nombres : embarque !',
  );
  // Deux archipels plus loin : d'abord le précédent.
  expect(lockedHint(fresh, 'maths-4e-powers')).toBe('Pas si vite ! Mon île est dans les Anciens Ateliers. Va d’abord jusqu’aux Îles Brumeuses avec le Bloc-Navire.');
  expect(lockedHint(sanitizeState({ world: { links: ['passage-5e'] } }), 'maths-3e-functions')).toBe(
    'Pas si vite ! Mon île est dans les Îles du Ciel. Va d’abord jusqu’aux Anciens Ateliers avec le Bloc-Navire.',
  );
  expect(lockedHint(sanitizeState({ world: { links: ['passage-5e', 'passage-4e'] } }), 'maths-3e-functions')).toContain('de l’autre côté du ciel. Finis le Bloc-Navire sur Atelier du calcul littéral');
});

it('dans Archipéo, l’indice d’une île fermée dit un Gardien rallumé, jamais vaincu ni battu', () => {
  const hull = { [coque.id]: planCells(coque).map((c) => c.key) };
  expect(lockedHint(sanitizeState({ world: { parts: hull }, progress: guardians(['french-6e-phonology', 'maths-6e-calculation']) }), 'maths-5e-proportionality', 'archipeo')).toBe(
    'Pas si vite ! Mon île est dans les Îles Brumeuses, de l’autre côté de la mer. Le Bloc-Navire attend sur Plaine des nombres : rallume encore 1 Gardien des Premiers Rivages, puis embarque.',
  );
  // L'Atelier des textes, que seul le col du Phare des fonctions peut ouvrir : ses autres voisines restent fermées. Le col
  // ne demande que des blocs : aucun Gardien n'est la condition d'une liaison (GD-7).
  const voisines: string[] = BRIDGES.filter((b) => b.from === 'french-3e-close-reading' || b.to === 'french-3e-close-reading').flatMap((b) => [b.from, b.to]).filter((id) => id !== 'maths-3e-functions');
  const ouverts = BRIDGES.filter((b) => !voisines.includes(b.from) && !voisines.includes(b.to)).map((b) => b.id);
  const col = sanitizeState({ world: { links: ['passage-5e', 'passage-4e', 'passage-3e', ...ouverts] } });
  expect(lockedHint(col, 'french-3e-close-reading', 'archipeo')).toBe(
    'Pas si vite ! Pour venir ici, construis le col depuis Phare des fonctions : 5 blocs.',
  );
  expect(lockedHint(col, 'french-3e-close-reading')).not.toContain('Gardien');
});

// ---------- La suggestion qui suit l'élève (GD-7, point 3) ----------

/** Les `n` premières missions d'une île, jouées une fois (deux étoiles, peu importe : on compte ce qui est joué). */
const joue = (ile: BiomeId, n: number) =>
  Object.fromEntries(
    missionsJouables(getBiome(ile)!)
      .slice(0, n)
      .map((m) => [exercisesOf(ile, m.id)[0].id, { stars: 1, attempts: 1, best: 0.4 }]),
  );
const ouvrage = (id: string) => getBridge(id) as BridgeDef;

it('la matière la moins jouée se mesure par île : l’anglais, avec deux îles, ne gagne pas parce qu’il en a moins', () => {
  // Français : 2 missions sur 5 îles (0,4) ; maths : 3 missions sur 3 îles (1) ; anglais : 1 mission sur 2 îles (0,5).
  const progress = { ...joue('french-6e-phonology', 2), ...joue('maths-6e-calculation', 3), ...joue('english-6e-grammar', 1) };
  expect(partJouee(progress, '6e')).toEqual({ french: 0.4, maths: 1, english: 0.5 });
  // En missions seules, l'anglais (1) serait le moins joué ; divisé par ses îles, c'est le français.
  const state = sanitizeState({ progress, stock: { [BLOC.bois]: 4 }, world: { links: ['french-6e-phonology-english-6e-grammar'] } });
  expect(ouvrageSuggere(state, '6e')).toMatchObject({
    ile: 'french-6e-phonology',
    goal: { text: 'Tu peux construire le sentier vers Mine des lettres. Il ouvre une île de français.', ouvrage: 'french-6e-phonology-french-6e-letter-confusion', ready: true },
  });
  // Le compte ne lit que les exercices de la classe : chaque île porte sa classe dans son identifiant.
  expect(BIOMES.filter((b) => !b.id.includes(`-${b.classe}-`))).toEqual([]);
  // Le défi du Gardien ne compte pas.
  expect(partJouee({ ...progress, 'french-6e-phonology-challenge': { attempts: 3 } }, '6e')).toEqual(partJouee(progress, '6e'));
});

it('à égalité, l’ordre des matières de l’archipel : le français, puis les maths, puis l’anglais', () => {
  // Une mission sur chaque île de la 6e : chaque matière à 1.
  const egal = Object.assign({}, ...islandsOf('6e').map((b) => joue(b.id, 1)));
  expect(partJouee(egal, '6e')).toEqual({ french: 1, maths: 1, english: 1 });
  const choix = ouvragesParSuggestion(sanitizeState({ progress: egal }), [ouvrage('french-6e-phonology-english-6e-grammar'), ouvrage('maths-6e-calculation-maths-6e-fractions'), ouvrage('french-6e-phonology-french-6e-grammar-spelling')]);
  expect(choix.map((b) => b.id)).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'maths-6e-calculation-maths-6e-fractions', 'french-6e-phonology-english-6e-grammar']);
});

it('l’ouvrage qu’on peut payer passe devant, et l’île de LV2 reste en bout de chemin', () => {
  // La Mine ouverte : son pont vers la Carrière (5 blocs, français) et le bac vers la Rivière (4 blocs, maths).
  const mine = ['french-6e-phonology-french-6e-letter-confusion'];
  const carriere = ouvrage('french-6e-letter-confusion-french-6e-word-spelling');
  const riviere = ouvrage('maths-6e-calculation-maths-6e-fractions');
  const maths = { ...joue('maths-6e-calculation', 4) };
  // Le français est le moins joué, mais 4 blocs ne paient que le bac : il passe devant.
  expect(ouvragesParSuggestion(sanitizeState({ progress: maths, stock: { [BLOC.bois]: 4 }, world: { links: mine } }), [carriere, riviere])[0]).toBe(riviere);
  // Avec 5 blocs, les deux se paient : la matière la moins jouée.
  expect(ouvragesParSuggestion(sanitizeState({ progress: maths, stock: { [BLOC.bois]: 5 }, world: { links: mine } }), [carriere, riviere])[0]).toBe(carriere);
  // Aux Îles Brumeuses, le Comptoir ouvert : le pont vers le Relais (LV2), jamais joué et payable, passe après le pont
  // vers le Manoir, même sans assez de blocs pour ce dernier.
  const relais = ouvrage('english-5e-vocabulary-lv2-5e-introductions');
  const manoir = ouvrage('english-5e-vocabulary-english-5e-grammar');
  const comptoir = sanitizeState({ progress: joue('english-5e-vocabulary', 4), stock: { [BLOC.bois]: 6 }, world: { links: ['passage-5e', 'maths-5e-proportionality-english-5e-vocabulary'] } });
  expect(ouvragesParSuggestion(comptoir, [relais, manoir])[0]).toBe(manoir);
  expect(ouvragesParSuggestion({ ...comptoir, stock: { [BLOC.bois]: 1 } }, [relais, manoir])[0]).toBe(manoir);
});

it('sans assez de blocs, la suggestion dit ce qu’il manque ; le panneau de l’île de départ met le même ouvrage en avant', () => {
  const state = sanitizeState({ progress: joue('french-6e-phonology', 3), stock: { [BLOC.bois]: 1 }, world: { place: 'french-6e-phonology', links: [] } });
  const s = ouvrageSuggere(state, '6e')!;
  expect(s).toMatchObject({ ile: 'maths-6e-calculation', goal: { text: 'Encore 3 blocs pour le bac vers Rivière des fractions. Il ouvre une île de maths.', have: 1, need: 4 } });
  // Le seul « Construire » principal du pli Ouvrages de la Plaine : le même ouvrage.
  expect(nextGoalInfo(state, 'maths-6e-calculation')?.ouvrage).toBe(s.goal.ouvrage);
});

it('sur l’île d’où part l’ouvrage suggéré, son objectif est cet ouvrage, même si le Bloc-Navire est plus proche (une seule source)', () => {
  // La Forêt jouée en entier, la Plaine (le port) une fois, l'anglais beaucoup : les maths sont les moins jouées, et
  // l'ouvrage suggéré part de la Plaine, un bac de 4 blocs (1 en stock). Le Bloc-Navire n'attend plus qu'une case :
  // 1 bloc, plus proche que les 3 du bac.
  const progress = { ...joue('french-6e-phonology', 99), ...joue('maths-6e-calculation', 1), ...joue('english-6e-grammar', 99), ...joue('english-6e-vocabulary', 99) };
  const presque = planCells(coque).map((c) => c.key).slice(1);
  const state = sanitizeState({ progress, stock: { [BLOC.bois]: 1 }, world: { place: 'french-6e-phonology', links: [], parts: { [coque.id]: presque } } });
  const s = ouvrageSuggere(state, '6e')!;
  expect(s.ile).toBe('maths-6e-calculation');
  const goal = nextGoalInfo(state, 'maths-6e-calculation');
  expect(goal).toMatchObject({ have: 1, need: 4, ouvrage: s.goal.ouvrage });
  expect(goal?.text).toMatch(/^Encore 3 blocs pour le bac vers .+\. Il ouvre une île de maths\.$/);
  // La prochaine destination dit la même phrase, mot pour mot, avec la même jauge.
  const d = nextDestinationDe(state, NOMS_ARCHIPELS, textesDe('blocland').libelles);
  expect(d).toMatchObject({ island: 'maths-6e-calculation', text: goal!.text, have: goal!.have, need: goal!.need, ouvrage: goal!.ouvrage });
  // Le Bloc-Navire prêt à partir reste premier, même sur l'île de départ de l'ouvrage suggéré.
  const hull = planCells(coque).map((c) => c.key);
  const pret = sanitizeState({
    progress: { ...progress, ...guardians(['french-6e-phonology', 'maths-6e-calculation', 'french-6e-letter-confusion']) },
    world: { place: 'french-6e-phonology', links: [], parts: { [coque.id]: hull } },
  });
  expect(nextGoal(pret, 'maths-6e-calculation')).toBe('Le Bloc-Navire est prêt : embarque vers les Îles Brumeuses !');
});

it('la suggestion ne dépend que de la sauvegarde, et deux élèves de la même classe n’ont pas le même archipel après trois séances', () => {
  const state = sanitizeState({ progress: joue('french-6e-phonology', 2), stock: { [BLOC.bois]: 4 }, world: { links: [] } });
  expect(ouvrageSuggere(state, '6e')).toEqual(ouvrageSuggere(structuredClone(state), '6e'));
  // Trois séances : une mission sur l'île préférée, puis l'ouvrage suggéré (4 blocs gagnés).
  const seances = (prefere: BiomeId) => {
    let s = sanitizeState({});
    for (let k = 1; k <= 3; k++) {
      s = sanitizeState({ ...s, progress: { ...s.progress, ...joue(prefere, k) }, stock: { [BLOC.bois]: 4 } });
      const b = ouvrageSuggere(s, '6e')!;
      s = sanitizeState({ ...s, stock: {}, world: { ...s.world, links: [...s.world.links, b.goal.ouvrage!] } });
    }
    return s.world.links;
  };
  const lea = seances('french-6e-phonology');
  const sami = seances('maths-6e-calculation');
  expect(lea).toEqual(['maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals', 'french-6e-phonology-english-6e-grammar']);
  expect(sami).toEqual(['french-6e-phonology-french-6e-letter-confusion', 'french-6e-phonology-french-6e-grammar-spelling', 'maths-6e-calculation-french-6e-reading']);
  expect(lea.filter((id) => sami.includes(id))).toEqual([]);
});
