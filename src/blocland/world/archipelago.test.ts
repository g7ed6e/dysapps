import { BIOMES } from '../biomes';
import { sanitizeState } from '../engine';
import {
  BRIDGES,
  ISLAND_POS,
  bridgeState,
  bridgesFromLegacyProgress,
  buildBridge,
  buildableBridges,
  isBiomeUnlocked,
  pathTo,
  payableBlocks,
  reachableIslands,
} from './archipelago';

it('chaque île a une place et chaque pont relie deux îles voisines', () => {
  for (const b of BIOMES) expect(ISLAND_POS[b.id]).toBeDefined();
  for (const b of BRIDGES) {
    const a = ISLAND_POS[b.from];
    const c = ISLAND_POS[b.to];
    expect(Math.abs(a.col - c.col) + Math.abs(a.row - c.row)).toBe(1);
  }
  // Toutes les îles sont atteignables une fois tous les ponts construits.
  expect(reachableIslands(BRIDGES.map((b) => b.id)).size).toBe(BIOMES.length);
});

it('la Forêt et la Plaine sont ouvertes au début (pont déjà là) ; depuis la Forêt, deux ponts au choix', () => {
  expect([...reachableIslands([])].sort()).toEqual(['foret', 'plaine']);
  expect(bridgeState(BRIDGES.find((b) => b.id === 'foret-plaine')!, [])).toBe('built');
  expect(
    buildableBridges([])
      .map((b) => b.id)
      .sort(),
  ).toEqual(['foret-carrefour', 'foret-ferme', 'foret-mine', 'plaine-glacier', 'plaine-riviere', 'plaine-volcan']);
  expect(isBiomeUnlocked('marais', ['foret-mine', 'mine-marais'])).toBe(true);
  expect(isBiomeUnlocked('forge', ['plaine-volcan', 'volcan-forge'])).toBe(true);
  expect(isBiomeUnlocked('falaise', ['foret-ferme', 'ferme-falaise'])).toBe(true);
  expect(isBiomeUnlocked('cabinet', ['foret-carrefour', 'carrefour-marais', 'marais-cabinet'])).toBe(true);
  expect(isBiomeUnlocked('atelier', ['plaine-glacier', 'glacier-marche', 'marche-atelier'])).toBe(true);
  expect(isBiomeUnlocked('marche', ['plaine-glacier', 'glacier-marche'])).toBe(true);
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
  ).toEqual(['ferme-falaise', 'ferme-tour', 'ferme-volcan']);
  // Un pont construit sans chemin jusqu'à lui n'ouvre rien.
  expect(isBiomeUnlocked('tour', ['ferme-tour'])).toBe(false);
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

it('les anciennes sauvegardes gardent leurs îles ouvertes : les ponts du chemin sont offerts', () => {
  expect(pathTo('tour').map((b) => b.id)).toEqual(['foret-ferme', 'ferme-tour']);
  expect(bridgesFromLegacyProgress({})).toEqual([]);
  // La Plaine est une île de départ : aucun pont à offrir.
  expect(pathTo('plaine')).toEqual([]);
  expect(bridgesFromLegacyProgress({ 'foret-abattage-1': { stars: 1 } })).toEqual(['foret-mine']);
  // Sous l'ancienne règle, la Ferme s'ouvrait après la Carrière : on offre le chemin nouveau vers elle.
  const old = { 'foret-a': { stars: 1 }, 'mine-a': { stars: 2 }, 'carriere-a': { stars: 1 } };
  expect(bridgesFromLegacyProgress(old).sort()).toEqual(['foret-ferme', 'foret-mine', 'mine-carriere']);
  // Sanitize : sauvegarde sans `bridges` → migration ; avec → identifiants inconnus filtrés.
  expect(sanitizeState({ progress: old }).village.bridges.sort()).toEqual(['foret-ferme', 'foret-mine', 'mine-carriere']);
  expect(sanitizeState({ progress: old, village: { bridges: ['foret-mine', 'x', 'foret-mine'] } }).village.bridges).toEqual(['foret-mine']);
});
