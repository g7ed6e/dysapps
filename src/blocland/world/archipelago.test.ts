import { BIOMES } from '../biomes';
import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import {
  ARCHIPELAGOS,
  BRIDGES,
  ISLANDS,
  CONDITION_OF,
  LEGACY_BRIDGES,
  VOYAGES,
  archipelagoOf,
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
  for (const b of BIOMES) expect(ISLANDS.find((i) => i.id === b.id)).toBeDefined();
  for (const b of BRIDGES) {
    expect(ISLANDS.find((i) => i.id === b.from)).toBeDefined();
    expect(ISLANDS.find((i) => i.id === b.to)).toBeDefined();
  }
  // Tous les ouvrages construits sans voyage : seules les Basses Terres ; avec les voyages : tout.
  expect(reachableIslands(BRIDGES.map((b) => b.id)).size).toBe(8);
  expect(reachableIslands([...BRIDGES, ...VOYAGES].map((b) => b.id)).size).toBe(BIOMES.length);
  expect(BRIDGES).toHaveLength(18);
  expect(VOYAGES.map((v) => v.id)).toEqual(['voyage-5e', 'voyage-4e', 'voyage-3e']);
  expect(BIOMES.length).toBe(20);
});

it('quatre archipels, un par classe, chacun avec son port, connexe depuis ses îles de départ', () => {
  expect(ARCHIPELAGOS.map((a) => a.classe)).toEqual(['6e', '5e', '4e', '3e']);
  expect(archipelagoTitle('5e')).toBe('Archipel de 5e — Les Collines du Large');
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

it('la Forêt et la Plaine sont ouvertes au début (pont déjà là) ; depuis la Forêt, deux ponts au choix', () => {
  expect([...reachableIslands([])].sort()).toEqual(['foret', 'plaine']);
  expect(bridgeState(BRIDGES.find((b) => b.id === 'foret-plaine')!, [])).toBe('built');
  expect(
    buildableBridges([])
      .map((b) => b.id)
      .sort(),
  ).toEqual(['foret-ferme', 'foret-mine', 'plaine-riviere', 'plaine-volcan']);
  expect(isBiomeUnlocked('volcan', ['foret-ferme', 'ferme-volcan'])).toBe(true);
  // La Rivière s'atteint par la Plaine ou par la Mine.
  expect(isBiomeUnlocked('riviere', ['plaine-riviere'])).toBe(true);
  expect(isBiomeUnlocked('riviere', ['foret-mine', 'mine-riviere'])).toBe(true);
  expect(bridgeState(BRIDGES[2], [])).toBe('far');
  expect(isBiomeUnlocked('ferme', ['foret-ferme'])).toBe(true);
  expect(isBiomeUnlocked('tour', ['foret-ferme'])).toBe(false);
  expect(
    buildableBridges(['foret-ferme'], 'ferme')
      .map((b) => b.id)
      .sort(),
  ).toEqual(['ferme-tour', 'ferme-volcan']);
  // Un pont construit sans chemin jusqu'à lui n'ouvre rien.
  expect(isBiomeUnlocked('tour', ['ferme-tour'])).toBe(false);
});

it('un voyage ouvre le port de l’archipel suivant, et rien de plus ; il faut les voyages précédents', () => {
  expect(isBiomeUnlocked('marche', [])).toBe(false);
  expect(isArchipelagoReached('6e', [])).toBe(true);
  expect(isArchipelagoReached('5e', [])).toBe(false);
  expect(isBiomeUnlocked('marche', ['voyage-5e'])).toBe(true);
  expect(isArchipelagoReached('5e', ['voyage-5e'])).toBe(true);
  expect(isBiomeUnlocked('glacier', ['voyage-5e'])).toBe(false);
  expect(isBiomeUnlocked('glacier', ['voyage-5e', 'glacier-marche'])).toBe(true);
  expect(isBiomeUnlocked('marche', ['glacier-marche'])).toBe(false);
  // Un voyage sans le précédent n'ouvre rien.
  expect(isBiomeUnlocked('atelier', ['voyage-4e'])).toBe(false);
  expect(isBiomeUnlocked('atelier', ['voyage-5e', 'voyage-4e'])).toBe(true);
  expect(reachedArchipelagos(['voyage-5e', 'voyage-4e']).map((a) => a.classe)).toEqual(['6e', '5e', '4e']);
  // Le retour est toujours possible : les Basses Terres restent ouvertes.
  expect(isBiomeUnlocked('foret', ['voyage-5e', 'voyage-4e', 'voyage-3e'])).toBe(true);
  expect(voyagesTo('cabinet').map((v) => v.id)).toEqual(['voyage-5e', 'voyage-4e']);
  expect(remainingVoyages('cabinet', ['voyage-5e']).map((v) => v.id)).toEqual(['voyage-4e']);
  expect(voyagesTo('foret')).toEqual([]);
  // Les ouvrages proposés au Marché, à l'arrivée.
  expect(
    buildableBridges(['voyage-5e'])
      .map((b) => b.id)
      .sort(),
  ).toEqual(['foret-ferme', 'foret-mine', 'glacier-marche', 'marche-marais', 'plaine-riviere', 'plaine-volcan']);
});

it('un pont se paie avec les blocs des îles, les plus nombreux d’abord, jamais avec les kits de finition', () => {
  expect(payableBlocks({ bois: 2, toit: 9, porte: 3 })).toBe(2);
  const short = buildBridge('foret-mine', [], { bois: 2 });
  expect(short).toEqual({ ok: false, reason: 'blocs', missing: 1 });
  const r = buildBridge('foret-mine', [], { bois: 2, pierre: 4, toit: 9 });
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.bridges).toEqual(['foret-mine']);
  expect(r.used).toEqual({ pierre: 3 });
  expect(r.inventory).toEqual({ bois: 2, pierre: 1, toit: 9 });
  // À égalité, on pioche dans plusieurs types.
  const mix = buildBridge('foret-ferme', [], { bois: 2, sable: 2 });
  expect(mix.ok && Object.values(mix.used).reduce((a, b) => a + b, 0)).toBe(3);
  expect(buildBridge('foret-mine', ['foret-mine'], { bois: 9 })).toEqual({ ok: false, reason: 'construit' });
  expect(buildBridge('mine-carriere', [], { bois: 9 })).toEqual({ ok: false, reason: 'loin' });
  expect(buildBridge('nulle-part', [], { bois: 9 })).toEqual({ ok: false, reason: 'inconnu' });
});

it('le chemin vers une île part des départs de son archipel ; l’accès offert ajoute voyages puis ouvrages', () => {
  expect(pathTo('tour').map((b) => b.id)).toEqual(['foret-ferme', 'ferme-tour']);
  // La Plaine est une île de départ : aucun pont à offrir.
  expect(pathTo('plaine')).toEqual([]);
  expect(pathTo('marais').map((b) => b.id)).toEqual(['marche-marais']);
  expect(pathTo('cabinet').map((b) => b.id)).toEqual(['atelier-falaise', 'falaise-cabinet']);
  // Le chemin qu'il reste à construire : les ouvrages construits en sont retirés.
  expect(remainingPath('tour', []).map((b) => b.id)).toEqual(['foret-ferme', 'ferme-tour']);
  expect(remainingPath('tour', ['foret-ferme']).map((b) => b.id)).toEqual(['ferme-tour']);
  expect(remainingPath('tour', ['foret-ferme', 'ferme-tour'])).toEqual([]);
  expect(grantAccess([], ['glacier']).sort()).toEqual(['glacier-marche', 'voyage-5e']);
  expect(grantAccess(['foret-mine'], ['foret', 'mine'])).toEqual(['foret-mine']);
});

it('les anciennes sauvegardes gardent leurs îles ouvertes : voyages et chemin offerts', () => {
  expect(bridgesFromLegacyProgress({})).toEqual([]);
  expect(bridgesFromLegacyProgress({ 'foret-abattage-1': { stars: 1 } })).toEqual(['foret-mine']);
  // Sous l'ancienne règle, la Ferme s'ouvrait après la Carrière : on offre le chemin nouveau vers elle.
  const old = { 'foret-a': { stars: 1 }, 'mine-a': { stars: 2 }, 'carriere-a': { stars: 1 } };
  expect(bridgesFromLegacyProgress(old).sort()).toEqual(['foret-ferme', 'foret-mine', 'mine-carriere']);
  // Sanitize : sauvegarde sans `bridges` → migration ; avec → identifiants inconnus filtrés, îles jouées gardées ouvertes.
  expect(sanitizeState({ progress: old }).village.bridges.sort()).toEqual(['foret-ferme', 'foret-mine', 'mine-carriere']);
  expect(sanitizeState({ progress: old, village: { bridges: ['foret-mine', 'x', 'foret-mine'] } }).village.bridges.sort()).toEqual(['foret-mine', 'mine-carriere']);
  expect(sanitizeState({ village: { bridges: ['foret-mine', 'x'] } }).village.bridges).toEqual(['foret-mine']);
  // Le continent d'avant : un escalier vers le Glacier valait l'accès aux Collines. Le voyage et le sentier sont offerts,
  // et l'étape du Bloc-Navire est complète.
  expect(LEGACY_BRIDGES.map((b) => b.id)).toContain('plaine-glacier');
  expect([...legacyReachable(['plaine-glacier'])].sort()).toEqual(['foret', 'glacier', 'plaine']);
  const climbed = sanitizeState({ village: { bridges: ['plaine-glacier'] } });
  expect(climbed.village.bridges.sort()).toEqual(['glacier-marche', 'voyage-5e']);
  expect(climbed.village.plans['navire-coque']).toHaveLength(VEHICLE_STAGES[0].cells.length);
  const summit = sanitizeState({ village: { bridges: ['plaine-volcan', 'volcan-forge', 'forge-phare'], at: 'phare' } });
  expect(summit.village.bridges.sort()).toEqual(['atelier-forge', 'plaine-volcan', 'voyage-3e', 'voyage-4e', 'voyage-5e']);
  expect(summit.village.at).toBe('phare');
  // Des étoiles sur une île du collège, sans ouvrage : l'accès est offert aussi.
  expect(sanitizeState({ progress: { 'glacier-thermometre-1': { stars: 2 } }, village: { bridges: [] } }).village.bridges.sort()).toEqual([
    'glacier-marche',
    'voyage-5e',
  ]);
  // Rien d'offert quand tout est cohérent.
  expect(sanitizeState({ village: { bridges: ['foret-mine', 'mine-riviere'] } }).village.bridges).toEqual(['foret-mine', 'mine-riviere']);
});

it('un escalier veut un plan terminé, un tunnel ou un col un Gardien vaincu ; un pont ou un bac, des blocs seulement', () => {
  const kinds = new Set(BRIDGES.map((b) => b.kind));
  expect([...kinds].sort()).toEqual(['bac', 'col', 'escalier', 'pont', 'sentier']);
  expect(CONDITION_OF.pont).toBe('aucune');
  expect(CONDITION_OF.tunnel).toBe('gardien');
  const empty = { progress: {}, plans: {} };
  const reached = ['voyage-5e', 'voyage-4e', 'atelier-falaise'];
  const stairs = BRIDGES.find((b) => b.id === 'falaise-cabinet')!;
  expect(bridgeState(stairs, reached, empty)).toBe('blocked');
  expect(bridgeState(stairs, reached)).toBe('buildable');
  expect(conditionText(stairs, reached)).toContain('Termine d’abord le plan');
  expect(buildBridge('falaise-cabinet', reached, { bois: 9 }, empty)).toEqual({ ok: false, reason: 'plan' });
  // Le premier plan de la Falaise terminé : l'escalier se construit.
  const bergerie = plansFor('falaise')[0];
  const withPlan = { progress: {}, plans: { [bergerie.id]: planCells(bergerie).map((c) => c.key) } };
  expect(conditionMet(stairs, reached, withPlan)).toBe(true);
  expect(buildBridge('falaise-cabinet', reached, { bois: 9 }, withPlan).ok).toBe(true);
  // Le col Phare → Textes : le Gardien du Phare.
  const sky = ['voyage-5e', 'voyage-4e', 'voyage-3e'];
  const pass = BRIDGES.find((b) => b.id === 'phare-textes')!;
  expect(bridgeState(pass, sky, empty)).toBe('blocked');
  expect(conditionText(pass, sky)).toBe('Bats d’abord le Gardien de Phare des fonctions.');
  expect(buildBridge('phare-textes', sky, { bois: 9 }, empty)).toEqual({ ok: false, reason: 'gardien' });
  expect(bridgeState(pass, sky, { progress: { 'phare-gardien': { stars: 2 } }, plans: {} })).toBe('buildable');
  // Les ouvrages proposés comprennent ceux qui sont bloqués (on explique la condition), pas ceux qui sont loin.
  expect(buildableBridges(sky, 'phare', empty).map((b) => b.id)).toContain('phare-textes');
  expect(buildableBridges(sky, 'textes', empty).map((b) => b.id)).toEqual(['phare-textes']);
  expect(buildableBridges([], 'textes', empty)).toEqual([]);
});
