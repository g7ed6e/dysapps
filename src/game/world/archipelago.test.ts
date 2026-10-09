import { BLOC, BIOMES } from '../biomes';
import { sanitizeState } from '../engine';
import { MAP } from './map';
import {
  linkKind,
  ARCHIPELAGOS,
  BRIDGES,
  CONDITION_OF,
  LEGACY_BRIDGES,
  VOYAGES,
  archipelagoOf,
  NOMS_ARCHIPELS,
  archipelagoTitle,
  bridgeState,
  bridgesFromLegacyProgress,
  bridgesOf,
  conditionText,
  buildBridge,
  buildableBridges,
  getBridge,
  grantAccess,
  isArchipelagoReached,
  isBiomeUnlocked,
  islandsOf,
  legacyReachable,
  pathTo,
  payableBlocks,
  reachableIslands,
  reachedArchipelagos,
  remainingPath,
  remainingVoyages,
  voyagesTo,
} from './archipelago';
import { VEHICLE_STAGES } from './vehicle';

it('chaque île a une place ; les ouvrages ouvrent son archipel, les voyages ouvrent les suivants', () => {
  for (const b of BIOMES) expect(MAP.find((i) => i.id === b.id)).toBeDefined();
  for (const b of BRIDGES) {
    expect(MAP.find((i) => i.id === b.from)).toBeDefined();
    expect(MAP.find((i) => i.id === b.to)).toBeDefined();
  }
  // Toutes les liaisons posées sans voyage : seules les Premiers Rivages ; avec les voyages : tout.
  expect(reachableIslands(BRIDGES.map((b) => b.id)).size).toBe(15);
  expect(reachableIslands([...BRIDGES, ...VOYAGES].map((b) => b.id)).size).toBe(BIOMES.length);
  // GD-9 : une liaison possible entre chaque paire de lieux d'une même région (105 en 6e depuis les îles de sciences de
  // SC-2, 66 dans les trois autres depuis celles de SC-3, 36 depuis les îles d'histoire-géographie de HG-3, 21 avant).
  expect(BRIDGES).toHaveLength(105 + 3 * 66);
  expect(VOYAGES.map((v) => v.id)).toEqual(['passage-5e', 'passage-4e', 'passage-3e']);
  expect(BIOMES.length).toBe(51);
  // Le Relais des voyageurs (LV2) reste en bout de chemin : la liaison la plus proche vient du Comptoir.
  expect(remainingPath('lv2-5e-introductions', ['passage-5e', 'maths-5e-proportionality-english-5e-vocabulary']).map((b) => b.id)).toEqual(['english-5e-vocabulary-lv2-5e-introductions']);
  expect(isBiomeUnlocked('lv2-5e-introductions', ['passage-5e', 'maths-5e-proportionality-english-5e-vocabulary', 'english-5e-vocabulary-lv2-5e-introductions'])).toBe(true);
  expect(isBiomeUnlocked('lv2-5e-introductions', ['passage-5e', 'maths-5e-proportionality-english-5e-vocabulary'])).toBe(false);
  // Le Jardin des heures (LV2, 4e) aussi : depuis le Théâtre.
  const versLeTheatre = ['passage-5e', 'passage-4e', 'maths-4e-algebra-french-4e-agreement', 'maths-4e-algebra-english-4e-comprehension'];
  expect(isBiomeUnlocked('lv2-4e-daily-life', [...versLeTheatre, 'english-4e-comprehension-lv2-4e-daily-life'])).toBe(true);
  expect(isBiomeUnlocked('lv2-4e-daily-life', versLeTheatre)).toBe(false);
  // Le Refuge des carnets (LV2, 3e) aussi : depuis le Château.
  const versLeChateau = ['passage-5e', 'passage-4e', 'passage-3e', 'maths-3e-functions-maths-3e-statistics', 'maths-3e-statistics-english-3e-grammar'];
  expect(isBiomeUnlocked('lv2-3e-travel', [...versLeChateau, 'english-3e-grammar-lv2-3e-travel'])).toBe(true);
  expect(isBiomeUnlocked('lv2-3e-travel', versLeChateau)).toBe(false);
});

it('quatre archipels, un par classe, chacun avec son port, connexe depuis ses îles de départ', () => {
  expect(ARCHIPELAGOS.map((a) => a.classe)).toEqual(['6e', '5e', '4e', '3e']);
  expect(archipelagoTitle('5e', NOMS_ARCHIPELS)).toBe('Archipel de 5e — Les Îles Brumeuses');
  for (const a of ARCHIPELAGOS) {
    const islands = islandsOf(a.classe).map((b) => b.id);
    expect(islands).toContain(a.port);
    for (const s of a.starts) expect(islands).toContain(s);
    // Chaque ouvrage relie deux îles du même archipel ; tous construits, ils ouvrent tout l'archipel depuis le port.
    const own = BRIDGES.filter((b) => archipelagoOf(b.from).classe === a.classe);
    for (const b of own) expect(archipelagoOf(b.to).classe, b.id).toBe(a.classe);
    const voyages = VOYAGES.filter((v) => ARCHIPELAGOS.findIndex((x) => x.classe === v.toClasse) <= ARCHIPELAGOS.indexOf(a)).map((v) => v.id);
    const open = reachableIslands([...own.map((b) => b.id), ...voyages]);
    for (const id of islands) expect(open.has(id), `${id} depuis ${a.port}`).toBe(true);
    // Au moins deux ouvrages sans condition partent du port : l'arrivée n'est jamais bloquée.
    expect(bridgesOf(a.port).filter((b) => CONDITION_OF[linkKind(b, [])] === 'aucune').length, a.port).toBeGreaterThanOrEqual(2);
  }
  // Les voyages vont de port en port, dans l'ordre des archipels.
  VOYAGES.forEach((v, i) => {
    expect(v.from).toBe(ARCHIPELAGOS[i].port);
    expect(v.to).toBe(ARCHIPELAGOS[i + 1].port);
    expect(VEHICLE_STAGES[i].to).toBe(v.toClasse);
  });
});

it('la Forêt et la Plaine sont ouvertes au début (pont déjà là) ; de l’une ou de l’autre, une liaison vers chaque île (GD-7)', () => {
  expect([...reachableIslands([])].sort()).toEqual(['french-6e-phonology', 'maths-6e-calculation']);
  expect(bridgeState(BRIDGES.find((b) => b.id === 'french-6e-phonology-maths-6e-calculation')!, [])).toBe('built');
  expect(
    buildableBridges([])
      .map((b) => b.id)
      .sort(),
  ).toEqual([
    // Depuis les formes des îles (GD-12, 8 octobre 2026) : la Ferme s'atteint depuis la Plaine, la Tour depuis la Forêt ;
    // le Hangar, au coin de devant derrière le Volcan, par le Volcan (comme le Laboratoire, par la Rivière, depuis SC-2),
    // et, depuis la boîte du trait (8 octobre 2026), aussi depuis la Forêt : sa liaison (95 cases) tient désormais.
    'french-6e-grammar-spelling-maths-6e-calculation',
    'french-6e-phonology-english-6e-grammar',
    'french-6e-phonology-english-6e-vocabulary',
    'french-6e-phonology-french-6e-letter-confusion',
    'french-6e-phonology-french-6e-reading',
    'french-6e-phonology-french-6e-word-spelling',
    'french-6e-phonology-geography-6e-living',
    'french-6e-phonology-history-6e-antiquity',
    'french-6e-phonology-life-earth-sciences-6e-living-world',
    'french-6e-phonology-technology-6e-objects',
    'maths-6e-calculation-maths-6e-decimals',
    'maths-6e-calculation-maths-6e-fractions',
  ]);
  expect(isBiomeUnlocked('maths-6e-decimals', ['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-grammar-spelling-maths-6e-decimals'])).toBe(true);
  // La Rivière s'atteint par la Plaine ou par la Mine.
  expect(isBiomeUnlocked('maths-6e-fractions', ['maths-6e-calculation-maths-6e-fractions'])).toBe(true);
  expect(isBiomeUnlocked('maths-6e-fractions', ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-maths-6e-fractions'])).toBe(true);
  // Une liaison entre deux lieux encore fermés : trop loin.
  expect(bridgeState(getBridge('french-6e-word-spelling-maths-6e-fractions')!, [])).toBe('far');
  expect(isBiomeUnlocked('french-6e-grammar-spelling', ['french-6e-phonology-french-6e-grammar-spelling'])).toBe(true);
  expect(isBiomeUnlocked('french-6e-reading', ['french-6e-phonology-french-6e-grammar-spelling'])).toBe(false);
  // Depuis la Ferme (GD-12) : ses voisines de devant (le Volcan, le Hangar), la Tour derrière son bras de mer, la Plaine.
  expect(
    buildableBridges(['french-6e-phonology-french-6e-grammar-spelling'], 'french-6e-grammar-spelling')
      .map((b) => b.id)
      .sort(),
  ).toEqual([
    'french-6e-grammar-spelling-french-6e-reading',
    'french-6e-grammar-spelling-maths-6e-calculation',
    'french-6e-grammar-spelling-maths-6e-decimals',
    'french-6e-grammar-spelling-technology-6e-objects',
  ]);
  // Un pont construit sans chemin jusqu'à lui n'ouvre rien.
  expect(isBiomeUnlocked('french-6e-reading', ['french-6e-grammar-spelling-french-6e-reading'])).toBe(false);
});

it('un voyage ouvre le port de l’archipel suivant, et rien de plus ; il faut les voyages précédents', () => {
  expect(isBiomeUnlocked('maths-5e-proportionality', [])).toBe(false);
  expect(isArchipelagoReached('6e', [])).toBe(true);
  expect(isArchipelagoReached('5e', [])).toBe(false);
  expect(isBiomeUnlocked('maths-5e-proportionality', ['passage-5e'])).toBe(true);
  expect(isArchipelagoReached('5e', ['passage-5e'])).toBe(true);
  expect(isBiomeUnlocked('maths-5e-signed-numbers', ['passage-5e'])).toBe(false);
  expect(isBiomeUnlocked('maths-5e-signed-numbers', ['passage-5e', 'maths-5e-signed-numbers-maths-5e-proportionality'])).toBe(true);
  expect(isBiomeUnlocked('maths-5e-proportionality', ['maths-5e-signed-numbers-maths-5e-proportionality'])).toBe(false);
  // Un voyage sans le précédent n'ouvre rien.
  expect(isBiomeUnlocked('maths-4e-algebra', ['passage-4e'])).toBe(false);
  expect(isBiomeUnlocked('maths-4e-algebra', ['passage-5e', 'passage-4e'])).toBe(true);
  expect(reachedArchipelagos(['passage-5e', 'passage-4e']).map((a) => a.classe)).toEqual(['6e', '5e', '4e']);
  // Le retour est toujours possible : les Premiers Rivages restent ouverts.
  expect(isBiomeUnlocked('french-6e-phonology', ['passage-5e', 'passage-4e', 'passage-3e'])).toBe(true);
  expect(voyagesTo('french-4e-vocabulary').map((v) => v.id)).toEqual(['passage-5e', 'passage-4e']);
  expect(remainingVoyages('french-4e-vocabulary', ['passage-5e']).map((v) => v.id)).toEqual(['passage-4e']);
  expect(voyagesTo('french-6e-phonology')).toEqual([]);
  // Les ouvrages proposés au Marché, à l'arrivée.
  expect(
    buildableBridges(['passage-5e'])
      .map((b) => b.id)
      .sort(),
  ).toEqual([
    'french-6e-grammar-spelling-maths-6e-calculation',
    'french-6e-phonology-english-6e-grammar',
    'french-6e-phonology-english-6e-vocabulary',
    'french-6e-phonology-french-6e-letter-confusion',
    'french-6e-phonology-french-6e-reading',
    'french-6e-phonology-french-6e-word-spelling',
    'french-6e-phonology-geography-6e-living',
    'french-6e-phonology-history-6e-antiquity',
    'french-6e-phonology-life-earth-sciences-6e-living-world',
    'french-6e-phonology-technology-6e-objects',
    'maths-5e-proportionality-english-5e-grammar',
    'maths-5e-proportionality-english-5e-vocabulary',
    'maths-5e-proportionality-french-5e-conjugation',
    // Depuis que les îles ont grandi (GD-11, 8 octobre 2026), trois bacs de plus depuis le Marché (86, 73 et 45 cases).
    'maths-5e-proportionality-history-5e-middle-ages',
    'maths-5e-proportionality-lv2-5e-introductions',
    'maths-5e-proportionality-technology-5e-design',
    'maths-5e-signed-numbers-maths-5e-proportionality',
    'maths-6e-calculation-maths-6e-decimals',
    'maths-6e-calculation-maths-6e-fractions',
  ]);
});

it('un pont se paie avec les blocs des îles, les plus nombreux d’abord, jamais avec les kits de finition', () => {
  expect(payableBlocks({ [BLOC.bois]: 2, [BLOC.toit]: 9, [BLOC.porte]: 3 })).toBe(2);
  // Une liaison du port : 4 blocs aux Premiers Rivages (GD-7).
  const short = buildBridge('french-6e-phonology-french-6e-letter-confusion', [], { [BLOC.bois]: 2 });
  expect(short).toEqual({ ok: false, reason: 'blocs', missing: 2 });
  const r = buildBridge('french-6e-phonology-french-6e-letter-confusion', [], { [BLOC.bois]: 2, [BLOC.pierre]: 4, [BLOC.toit]: 9 });
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.bridges).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
  expect(r.used).toEqual({ [BLOC.pierre]: 4 });
  expect(r.inventory).toEqual({ [BLOC.bois]: 2, [BLOC.toit]: 9 });
  // À égalité, on pioche dans plusieurs types.
  const mix = buildBridge('french-6e-phonology-french-6e-grammar-spelling', [], { [BLOC.bois]: 2, [BLOC.sable]: 2 });
  expect(mix.ok && Object.values(mix.used).reduce((a, b) => a + b, 0)).toBe(4);
  expect(buildBridge('french-6e-phonology-french-6e-letter-confusion', ['french-6e-phonology-french-6e-letter-confusion'], { [BLOC.bois]: 9 })).toEqual({ ok: false, reason: 'construit' });
  expect(buildBridge('french-6e-letter-confusion-french-6e-word-spelling', [], { [BLOC.bois]: 9 })).toEqual({ ok: false, reason: 'loin' });
  expect(buildBridge('nulle-part', [], { [BLOC.bois]: 9 })).toEqual({ ok: false, reason: 'inconnu' });
});

it('le chemin vers une île part des départs de son archipel ; l’accès offert ajoute voyages puis ouvrages', () => {
  // La Tour : la liaison depuis la Forêt (GD-9 : une liaison entre chaque paire de lieux).
  expect(pathTo('french-6e-reading').map((b) => b.id)).toEqual(['french-6e-phonology-french-6e-reading']);
  expect(pathTo('french-6e-letter-confusion').map((b) => b.id)).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
  // La Plaine est une île de départ : aucun pont à offrir.
  expect(pathTo('maths-6e-calculation')).toEqual([]);
  expect(pathTo('french-5e-conjugation').map((b) => b.id)).toEqual(['maths-5e-proportionality-french-5e-conjugation']);
  expect(pathTo('french-4e-vocabulary').map((b) => b.id)).toEqual(['maths-4e-algebra-french-4e-vocabulary']);
  expect(pathTo('english-4e-comprehension').map((b) => b.id)).toEqual(['maths-4e-algebra-english-4e-comprehension']);
  // Ce qu'il reste à poser (GD-9) : le plus court chemin de liaisons qui tiennent, depuis les lieux déjà reliés.
  expect(remainingPath('maths-6e-fractions', []).map((b) => b.id)).toEqual(['maths-6e-calculation-maths-6e-fractions']);
  expect(remainingPath('french-6e-reading', []).map((b) => b.id)).toEqual(['french-6e-phonology-french-6e-reading']);
  expect(remainingPath('french-5e-homophones', ['passage-5e']).map((b) => b.id)).toEqual(['maths-5e-proportionality-french-5e-conjugation', 'french-5e-homophones-french-5e-conjugation']);
  expect(remainingPath('english-4e-comprehension', ['passage-5e', 'passage-4e']).map((b) => b.id)).toEqual(['maths-4e-algebra-english-4e-comprehension']);
  expect(remainingPath('french-6e-reading', ['french-6e-phonology-french-6e-reading'])).toEqual([]);
  expect(grantAccess([], ['maths-5e-signed-numbers']).sort()).toEqual(['maths-5e-signed-numbers-maths-5e-proportionality', 'passage-5e']);
  expect(grantAccess(['french-6e-phonology-french-6e-letter-confusion'], ['french-6e-phonology', 'french-6e-letter-confusion'])).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
});

it('les anciennes sauvegardes gardent leurs îles ouvertes : voyages et chemin offerts', () => {
  expect(bridgesFromLegacyProgress({})).toEqual([]);
  expect(bridgesFromLegacyProgress({ 'french-6e-phonology-syllables-1': { stars: 1 } })).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
  // Sous l'ancienne règle, la Ferme s'ouvrait après la Carrière : on offre le chemin nouveau vers elle (GD-9 : la
  // liaison depuis le lieu relié le plus proche ; depuis les formes des îles, GD-12, la Plaine).
  const old = { 'french-6e-phonology-a': { stars: 1 }, 'french-6e-letter-confusion-a': { stars: 2 }, 'french-6e-word-spelling-a': { stars: 1 } };
  expect(bridgesFromLegacyProgress(old).sort()).toEqual(['french-6e-grammar-spelling-maths-6e-calculation', 'french-6e-letter-confusion-french-6e-word-spelling', 'french-6e-phonology-french-6e-letter-confusion']);
  // Sanitize : sauvegarde sans `bridges` → migration ; avec → identifiants inconnus filtrés, îles jouées gardées ouvertes.
  expect(sanitizeState({ progress: old }).world.links.sort()).toEqual(['french-6e-grammar-spelling-maths-6e-calculation', 'french-6e-letter-confusion-french-6e-word-spelling', 'french-6e-phonology-french-6e-letter-confusion']);
  expect(sanitizeState({ progress: old, world: { links: ['french-6e-phonology-french-6e-letter-confusion', 'x', 'french-6e-phonology-french-6e-letter-confusion'] } }).world.links.sort()).toEqual(['french-6e-letter-confusion-french-6e-word-spelling', 'french-6e-phonology-french-6e-letter-confusion']);
  expect(sanitizeState({ world: { links: ['french-6e-phonology-french-6e-letter-confusion', 'x'] } }).world.links).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
  // Le continent d'avant : un escalier vers le Glacier valait l'accès aux Collines. Le voyage et le sentier sont offerts,
  // et l'étape du Bloc-Navire est complète.
  expect(LEGACY_BRIDGES.map((b) => b.id)).toContain('maths-6e-calculation-maths-5e-signed-numbers');
  expect([...legacyReachable(['maths-6e-calculation-maths-5e-signed-numbers'])].sort()).toEqual(['french-6e-phonology', 'maths-5e-signed-numbers', 'maths-6e-calculation']);
  const climbed = sanitizeState({ world: { links: ['maths-6e-calculation-maths-5e-signed-numbers'] } });
  expect(climbed.world.links.sort()).toEqual(['maths-5e-signed-numbers-maths-5e-proportionality', 'passage-5e']);
  expect(climbed.world.parts['navire-coque']).toHaveLength(VEHICLE_STAGES[0].cells.length);
  const summit = sanitizeState({ world: { links: ['maths-6e-calculation-maths-6e-decimals', 'maths-6e-decimals-maths-4e-powers', 'maths-4e-powers-maths-3e-functions'], place: 'maths-3e-functions' } });
  expect(summit.world.links.sort()).toEqual(['maths-4e-algebra-maths-4e-powers', 'maths-6e-calculation-maths-6e-decimals', 'passage-3e', 'passage-4e', 'passage-5e']);
  expect(summit.world.place).toBe('maths-3e-functions');
  // Des étoiles sur une île du collège, sans ouvrage : l'accès est offert aussi.
  expect(sanitizeState({ progress: { 'maths-5e-signed-numbers-thermometer-1': { stars: 2 } }, world: { links: [] } }).world.links.sort()).toEqual([
    'maths-5e-signed-numbers-maths-5e-proportionality',
    'passage-5e',
  ]);
  // Rien d'offert quand tout est cohérent.
  expect(sanitizeState({ world: { links: ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-maths-6e-fractions'] } }).world.links).toEqual(['french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-maths-6e-fractions']);
});

it('GD-9 : une seule sorte de liaison, des blocs seulement, ni plan ni Gardien à attendre', () => {
  // Un pont, un bac : plus d'escalier taillé, de tunnel ni de col ; plus de lieux réunis sur la carte de départ (le
  // sentier reviendra avec la réunion que l'élève construit).
  const kinds = new Set(BRIDGES.map((b) => linkKind(b, [])));
  expect([...kinds].sort()).toEqual(['bac', 'pont']);
  expect(CONDITION_OF.pont).toBe('aucune');
  expect(CONDITION_OF.bac).toBe('aucune');
  expect(CONDITION_OF.sentier).toBe('aucune');
  const empty = { progress: {}, plans: {} };
  const reached = ['passage-5e', 'passage-4e', 'maths-4e-algebra-french-4e-agreement'];
  const ancienEscalier = getBridge('french-4e-agreement-french-4e-vocabulary')!;
  expect(bridgeState(ancienEscalier, reached, empty)).toBe('buildable');
  expect(conditionText(ancienEscalier, reached)).toBeNull();
  expect(buildBridge('french-4e-agreement-french-4e-vocabulary', reached, { [BLOC.bois]: 9 }, empty).ok).toBe(true);
  // L'ancien col Phare → Textes : des blocs seulement, lui aussi.
  const sky = ['passage-5e', 'passage-4e', 'passage-3e'];
  const pass = getBridge('maths-3e-functions-french-3e-close-reading')!;
  expect(bridgeState(pass, sky, empty)).toBe('buildable');
  expect(conditionText(pass, sky)).toBeNull();
  expect(buildBridge('maths-3e-functions-french-3e-close-reading', sky, { [BLOC.bois]: 9 }, empty).ok).toBe(true);
  // Les ouvrages proposés comprennent ceux qui sont bloqués (on explique la condition), pas ceux qui sont loin.
  expect(buildableBridges(reached, 'french-4e-agreement', empty).map((b) => b.id)).toContain('french-4e-agreement-french-4e-vocabulary');
  expect(buildableBridges(sky, 'maths-3e-functions', empty).map((b) => b.id)).toContain('maths-3e-functions-french-3e-close-reading');
  expect(buildableBridges(sky, 'french-3e-close-reading', empty).map((b) => b.id)).toEqual(['maths-3e-functions-french-3e-close-reading']);
  expect(buildableBridges([], 'french-3e-close-reading', empty)).toEqual([]);
});

it('sans la géométrie des liaisons (world/linkGeometry.ts pas chargé), les règles refusent de mesurer, hors des tests', async () => {
  vi.resetModules();
  const regles = await import('./archipelago');
  const b = regles.BRIDGES[0];
  // Dans les tests des règles seules : toute liaison en pont, de longueur nulle.
  expect(regles.linkLength(b, [])).toBe(0);
  vi.stubEnv('MODE', 'production');
  try {
    expect(() => regles.linkLength(b, [])).toThrow(/géométrie des liaisons/);
    expect(() => regles.linkKind(b, [])).toThrow(/géométrie des liaisons/);
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});
