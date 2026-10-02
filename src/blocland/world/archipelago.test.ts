import { textesDe } from '../../univers';
import { BLOC, BIOMES } from '../biomes';
import { sanitizeState } from '../engine';
import { MAP } from './map';
import { planCells, plansFor } from './plans';
import {
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
  conditionMet,
  conditionText,
  buildBridge,
  buildableBridges,
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
  // Tous les ouvrages construits sans voyage : seules les Premiers Rivages ; avec les voyages : tout.
  expect(reachableIslands(BRIDGES.map((b) => b.id)).size).toBe(10);
  expect(reachableIslands([...BRIDGES, ...VOYAGES].map((b) => b.id)).size).toBe(BIOMES.length);
  expect(BRIDGES).toHaveLength(31);
  expect(VOYAGES.map((v) => v.id)).toEqual(['passage-5e', 'passage-4e', 'passage-3e']);
  expect(BIOMES.length).toBe(31);
  // Le Relais des voyageurs (LV2) est en bout de chemin : un seul ouvrage y mène, depuis le Comptoir.
  expect(BRIDGES.filter((b) => b.from === 'lv2-5e-introductions' || b.to === 'lv2-5e-introductions').map((b) => b.id)).toEqual(['english-5e-vocabulary-lv2-5e-introductions']);
  expect(isBiomeUnlocked('lv2-5e-introductions', ['passage-5e', 'maths-5e-proportionality-english-5e-vocabulary', 'english-5e-vocabulary-lv2-5e-introductions'])).toBe(true);
  expect(isBiomeUnlocked('lv2-5e-introductions', ['passage-5e', 'maths-5e-proportionality-english-5e-vocabulary'])).toBe(false);
  // Le Jardin des heures (LV2, 4e) aussi : un seul ouvrage, depuis le Théâtre.
  expect(BRIDGES.filter((b) => b.from === 'lv2-4e-daily-life' || b.to === 'lv2-4e-daily-life').map((b) => b.id)).toEqual(['english-4e-comprehension-lv2-4e-daily-life']);
  const versLeTheatre = ['passage-5e', 'passage-4e', 'maths-4e-algebra-french-4e-agreement', 'french-4e-agreement-french-4e-vocabulary', 'french-4e-vocabulary-english-4e-comprehension'];
  expect(isBiomeUnlocked('lv2-4e-daily-life', [...versLeTheatre, 'english-4e-comprehension-lv2-4e-daily-life'])).toBe(true);
  expect(isBiomeUnlocked('lv2-4e-daily-life', versLeTheatre)).toBe(false);
  // Le Refuge des carnets (LV2, 3e) aussi : un seul ouvrage, depuis le Château.
  expect(BRIDGES.filter((b) => b.from === 'lv2-3e-travel' || b.to === 'lv2-3e-travel').map((b) => b.id)).toEqual(['english-3e-grammar-lv2-3e-travel']);
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
    expect(bridgesOf(a.port).filter((b) => CONDITION_OF[b.kind] === 'aucune').length, a.port).toBeGreaterThanOrEqual(2);
  }
  // Les voyages vont de port en port, dans l'ordre des archipels.
  VOYAGES.forEach((v, i) => {
    expect(v.from).toBe(ARCHIPELAGOS[i].port);
    expect(v.to).toBe(ARCHIPELAGOS[i + 1].port);
    expect(VEHICLE_STAGES[i].to).toBe(v.toClasse);
  });
});

it('la Forêt et la Plaine sont ouvertes au début (pont déjà là) ; depuis la Forêt, trois ponts au choix', () => {
  expect([...reachableIslands([])].sort()).toEqual(['french-6e-phonology', 'maths-6e-calculation']);
  expect(bridgeState(BRIDGES.find((b) => b.id === 'french-6e-phonology-maths-6e-calculation')!, [])).toBe('built');
  expect(
    buildableBridges([])
      .map((b) => b.id)
      .sort(),
  ).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-english-6e-grammar', 'french-6e-phonology-french-6e-letter-confusion', 'maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals']);
  expect(isBiomeUnlocked('maths-6e-decimals', ['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-grammar-spelling-maths-6e-decimals'])).toBe(true);
  // La Rivière s'atteint par la Plaine ou par la Mine.
  expect(isBiomeUnlocked('maths-6e-fractions', ['maths-6e-calculation-maths-6e-fractions'])).toBe(true);
  expect(isBiomeUnlocked('maths-6e-fractions', ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-maths-6e-fractions'])).toBe(true);
  expect(bridgeState(BRIDGES[2], [])).toBe('far');
  expect(isBiomeUnlocked('french-6e-grammar-spelling', ['french-6e-phonology-french-6e-grammar-spelling'])).toBe(true);
  expect(isBiomeUnlocked('french-6e-reading', ['french-6e-phonology-french-6e-grammar-spelling'])).toBe(false);
  expect(
    buildableBridges(['french-6e-phonology-french-6e-grammar-spelling'], 'french-6e-grammar-spelling')
      .map((b) => b.id)
      .sort(),
  ).toEqual(['french-6e-grammar-spelling-english-6e-vocabulary', 'french-6e-grammar-spelling-french-6e-reading', 'french-6e-grammar-spelling-maths-6e-decimals']);
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
  ).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-english-6e-grammar', 'french-6e-phonology-french-6e-letter-confusion', 'maths-5e-signed-numbers-maths-5e-proportionality', 'maths-5e-proportionality-english-5e-vocabulary', 'maths-5e-proportionality-french-5e-conjugation', 'maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals']);
});

it('un pont se paie avec les blocs des îles, les plus nombreux d’abord, jamais avec les kits de finition', () => {
  expect(payableBlocks({ [BLOC.bois]: 2, [BLOC.toit]: 9, [BLOC.porte]: 3 })).toBe(2);
  const short = buildBridge('french-6e-phonology-french-6e-letter-confusion', [], { [BLOC.bois]: 2 });
  expect(short).toEqual({ ok: false, reason: 'blocs', missing: 1 });
  const r = buildBridge('french-6e-phonology-french-6e-letter-confusion', [], { [BLOC.bois]: 2, [BLOC.pierre]: 4, [BLOC.toit]: 9 });
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.bridges).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
  expect(r.used).toEqual({ pierre: 3 });
  expect(r.inventory).toEqual({ bois: 2, pierre: 1, toit: 9 });
  // À égalité, on pioche dans plusieurs types.
  const mix = buildBridge('french-6e-phonology-french-6e-grammar-spelling', [], { [BLOC.bois]: 2, [BLOC.sable]: 2 });
  expect(mix.ok && Object.values(mix.used).reduce((a, b) => a + b, 0)).toBe(3);
  expect(buildBridge('french-6e-phonology-french-6e-letter-confusion', ['french-6e-phonology-french-6e-letter-confusion'], { [BLOC.bois]: 9 })).toEqual({ ok: false, reason: 'construit' });
  expect(buildBridge('french-6e-letter-confusion-french-6e-word-spelling', [], { [BLOC.bois]: 9 })).toEqual({ ok: false, reason: 'loin' });
  expect(buildBridge('nulle-part', [], { [BLOC.bois]: 9 })).toEqual({ ok: false, reason: 'inconnu' });
});

it('le chemin vers une île part des départs de son archipel ; l’accès offert ajoute voyages puis ouvrages', () => {
  expect(pathTo('french-6e-reading').map((b) => b.id)).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-grammar-spelling-french-6e-reading']);
  // La Plaine est une île de départ : aucun pont à offrir.
  expect(pathTo('maths-6e-calculation')).toEqual([]);
  expect(pathTo('french-5e-conjugation').map((b) => b.id)).toEqual(['maths-5e-proportionality-french-5e-conjugation']);
  expect(pathTo('french-4e-vocabulary').map((b) => b.id)).toEqual(['maths-4e-algebra-french-4e-agreement', 'french-4e-agreement-french-4e-vocabulary']);
  // Le chemin qu'il reste à construire : les ouvrages construits en sont retirés.
  expect(remainingPath('french-6e-reading', []).map((b) => b.id)).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-grammar-spelling-french-6e-reading']);
  expect(remainingPath('french-6e-reading', ['french-6e-phonology-french-6e-grammar-spelling']).map((b) => b.id)).toEqual(['french-6e-grammar-spelling-french-6e-reading']);
  expect(remainingPath('french-6e-reading', ['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-grammar-spelling-french-6e-reading'])).toEqual([]);
  expect(grantAccess([], ['maths-5e-signed-numbers']).sort()).toEqual(['maths-5e-signed-numbers-maths-5e-proportionality', 'passage-5e']);
  expect(grantAccess(['french-6e-phonology-french-6e-letter-confusion'], ['french-6e-phonology', 'french-6e-letter-confusion'])).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
});

it('les anciennes sauvegardes gardent leurs îles ouvertes : voyages et chemin offerts', () => {
  expect(bridgesFromLegacyProgress({})).toEqual([]);
  expect(bridgesFromLegacyProgress({ 'foret-abattage-1': { stars: 1 } })).toEqual(['french-6e-phonology-french-6e-letter-confusion']);
  // Sous l'ancienne règle, la Ferme s'ouvrait après la Carrière : on offre le chemin nouveau vers elle.
  const old = { 'foret-a': { stars: 1 }, 'mine-a': { stars: 2 }, 'carriere-a': { stars: 1 } };
  expect(bridgesFromLegacyProgress(old).sort()).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-french-6e-word-spelling']);
  // Sanitize : sauvegarde sans `bridges` → migration ; avec → identifiants inconnus filtrés, îles jouées gardées ouvertes.
  expect(sanitizeState({ progress: old }).world.links.sort()).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-french-6e-word-spelling']);
  expect(sanitizeState({ progress: old, world: { links: ['french-6e-phonology-french-6e-letter-confusion', 'x', 'french-6e-phonology-french-6e-letter-confusion'] } }).world.links.sort()).toEqual(['french-6e-phonology-french-6e-letter-confusion', 'french-6e-letter-confusion-french-6e-word-spelling']);
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

it('un escalier veut un plan terminé, un tunnel ou un col un Gardien vaincu ; un pont ou un bac, des blocs seulement', () => {
  const kinds = new Set(BRIDGES.map((b) => b.kind));
  expect([...kinds].sort()).toEqual(['bac', 'col', 'escalier', 'pont', 'sentier']);
  expect(CONDITION_OF.pont).toBe('aucune');
  expect(CONDITION_OF.tunnel).toBe('gardien');
  const empty = { progress: {}, plans: {} };
  const reached = ['passage-5e', 'passage-4e', 'maths-4e-algebra-french-4e-agreement'];
  const stairs = BRIDGES.find((b) => b.id === 'french-4e-agreement-french-4e-vocabulary')!;
  expect(bridgeState(stairs, reached, empty)).toBe('blocked');
  expect(bridgeState(stairs, reached)).toBe('buildable');
  expect(conditionText(stairs, reached, textesDe('blocland').libelles)).toContain('Termine d’abord le plan');
  expect(buildBridge('french-4e-agreement-french-4e-vocabulary', reached, { [BLOC.bois]: 9 }, empty)).toEqual({ ok: false, reason: 'plan' });
  // Le premier plan de la Falaise terminé : l'escalier se construit.
  const bergerie = plansFor('french-4e-agreement')[0];
  const withPlan = { progress: {}, plans: { [bergerie.id]: planCells(bergerie).map((c) => c.key) } };
  expect(conditionMet(stairs, reached, withPlan)).toBe(true);
  expect(buildBridge('french-4e-agreement-french-4e-vocabulary', reached, { [BLOC.bois]: 9 }, withPlan).ok).toBe(true);
  // Le col Phare → Textes : le Gardien du Phare.
  const sky = ['passage-5e', 'passage-4e', 'passage-3e'];
  const pass = BRIDGES.find((b) => b.id === 'maths-3e-functions-french-3e-close-reading')!;
  expect(bridgeState(pass, sky, empty)).toBe('blocked');
  expect(conditionText(pass, sky, textesDe('blocland').libelles)).toBe('Bats d’abord le Gardien de Phare des fonctions.');
  expect(conditionText(pass, sky, textesDe('archipeo').libelles)).toBe('Rallume d’abord le Gardien de Phare des fonctions.');
  expect(buildBridge('maths-3e-functions-french-3e-close-reading', sky, { [BLOC.bois]: 9 }, empty)).toEqual({ ok: false, reason: 'gardien' });
  expect(bridgeState(pass, sky, { progress: { 'maths-3e-functions-challenge': { stars: 2 } }, plans: {} })).toBe('buildable');
  // Les ouvrages proposés comprennent ceux qui sont bloqués (on explique la condition), pas ceux qui sont loin.
  expect(buildableBridges(sky, 'maths-3e-functions', empty).map((b) => b.id)).toContain('maths-3e-functions-french-3e-close-reading');
  expect(buildableBridges(sky, 'french-3e-close-reading', empty).map((b) => b.id)).toEqual(['maths-3e-functions-french-3e-close-reading']);
  expect(buildableBridges([], 'french-3e-close-reading', empty)).toEqual([]);
});
