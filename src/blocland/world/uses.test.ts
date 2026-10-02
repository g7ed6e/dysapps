import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { monumentsOf } from './monuments';
import { blockUses, earnIsland, inventoryUses, missingNow, whereToEarn } from './uses';
import { VEHICLE_STAGES } from './vehicle';
import { BLOC } from '../biomes';

/** Les blocs de bois du premier plan de la Forêt (la cabane de Mousso). */
const CABANE = plansFor('french-6e-phonology')[0].cells.length;
const donePlans = (island: string) => Object.fromEntries(plansFor(island as never).map((p) => [p.id, planCells(p).map((c) => c.key)]));

it('sait où se gagne chaque bloc', () => {
  expect(earnIsland(BLOC.bois)?.id).toBe('french-6e-phonology');
  expect(whereToEarn(BLOC.bois)).toBe('Forêt des sons');
  expect(earnIsland(BLOC.toit)).toBeUndefined();
  expect(whereToEarn(BLOC.toit)).toContain('coffre');
});

it('un bloc sert au plan en cours de son île et au Bloc-Navire, avec ce qu’il en manque', () => {
  const fresh = sanitizeState({});
  const uses = blockUses(fresh, BLOC.bois);
  expect(uses.map((u) => u.kind)).toEqual(['plan', 'navire']);
  // Cohérent avec le prochain objectif (« Encore 26 blocs de bois pour La cabane de Mousso »).
  expect(uses[0]).toMatchObject({ island: 'french-6e-phonology', name: 'La cabane de Mousso', need: CABANE, enough: false });
  expect(uses[1]).toMatchObject({ island: 'maths-6e-calculation', need: 20 });
  // Avec assez de blocs, le plan est faisable.
  const rich = sanitizeState({ stock: { [BLOC.bois]: CABANE } });
  expect(blockUses(rich, BLOC.bois)[0].enough).toBe(true);
});

it('un bloc de finition sans plan à l’attendre est à garder pour les plans suivants', () => {
  const fresh = sanitizeState({});
  // La lanterne : pas dans la cabane, mais dans le toit (plan 2) de la Forêt.
  expect(blockUses(fresh, BLOC.lanterne)[0]).toMatchObject({ kind: 'garder', island: 'french-6e-phonology' });
  expect(blockUses(fresh, BLOC.brique)[0]).toMatchObject({ kind: 'plan', island: 'maths-6e-calculation' });
});

it('un bloc dont l’île a fini ses plans sert aux monuments de l’archipel ; eux finis, il ne sert plus à rien', () => {
  const done = sanitizeState({ world: { parts: donePlans('maths-6e-calculation') }, stock: { [BLOC.brique]: 9 } });
  const uses = blockUses(done, BLOC.brique);
  expect(uses.map((u) => [u.kind, u.to])).toEqual([
    ['monument', '/aventure/landmark-6e-1'],
    ['monument', '/aventure/landmark-6e-2'],
  ]);
  expect(uses[0]).toMatchObject({ name: 'L’observatoire des baleines', need: 27, enough: false });
  const all = { ...donePlans('maths-6e-calculation'), ...Object.fromEntries(monumentsOf('6e').map((m) => [m.id, planCells(m).map((c) => c.key)])) };
  expect(blockUses(sanitizeState({ world: { parts: all }, stock: { [BLOC.brique]: 9 } }), BLOC.brique)).toEqual([]);
});

it('ne regarde que les îles ouvertes de l’archipel où l’on est, et le navire seulement à portée', () => {
  const fresh = sanitizeState({});
  // La Mine est fermée : la pierre ne sert pas encore à son plan.
  expect(blockUses(fresh, BLOC.pierre).filter((u) => u.kind === 'plan')).toEqual([]);
  // Le sable sert à la coque (navire) même si la Carrière, son île, est fermée.
  expect(blockUses(fresh, BLOC.sable).map((u) => u.kind)).toContain('navire');
  expect(blockUses(fresh, BLOC.sable).some((u) => u.island === 'french-6e-word-spelling')).toBe(false);
  // Dans les Îles Brumeuses, le ballon se construit sur le Marché ; la coque (voyage fait) n'est plus un chantier.
  const away = sanitizeState({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } });
  expect(blockUses(away, BLOC.sable).map((u) => u.kind)).toEqual(['garder']);
  expect(blockUses(away, BLOC.toile).map((u) => u.kind)).toContain('navire');
});

it('les blocs à aller chercher : ceux qui manquent aux chantiers à portée, avec leur île', () => {
  const fresh = sanitizeState({ stock: { [BLOC.bois]: 10 } });
  const missing = missingNow(fresh);
  const bois = missing.find((m) => m.block === BLOC.bois)!;
  // La cabane + 20 pour la coque, moins 10 en poche.
  expect(bois).toMatchObject({ need: CABANE + 20 - 10, island: 'french-6e-phonology', closed: false });
  expect(missing.find((m) => m.block === BLOC.brique)).toMatchObject({ island: 'maths-6e-calculation' });
  // Le galet de la coque se gagne sur la Rivière, encore fermée.
  expect(missing.find((m) => m.block === BLOC.galet)).toMatchObject({ island: 'maths-6e-fractions', closed: true });
  // Rien de la Mine (fermée) ni d'un autre archipel.
  expect(missing.some((m) => m.block === BLOC.pierre && m.need > 1)).toBe(false);
  expect(missing.some((m) => m.block === BLOC.glace)).toBe(false);
});

it('l’inventaire commenté : les lignes rangées par utilité, les ouvrages une seule fois, le total', () => {
  // Sur la Plaine, la coque du navire déjà posée (elle prendrait tous les blocs) : le plan de la Plaine est « ici ».
  const [coque] = VEHICLE_STAGES;
  const plans = { [coque.id]: planCells(coque).map((c) => c.key) };
  const state = sanitizeState({ world: { place: 'maths-6e-calculation', parts: plans }, stock: { [BLOC.bois]: 3, [BLOC.brique]: 2, [BLOC.toit]: 1, [BLOC.or]: 4 } });
  const inv = inventoryUses(state);
  expect(inv.total).toBe(10);
  // Posable ici (Plaine : brique), puis ailleurs (bois : Forêt), puis à garder (toit), puis sans usage (or).
  expect(inv.rows.map((r) => r.block)).toEqual(['brique', 'bois', 'toit', 'or']);
  expect(inv.rows[1].uses).toEqual([{ kind: 'plan', island: 'french-6e-phonology', name: 'La cabane de Mousso', need: CABANE, enough: false }]);
  // Le toit (bloc de coffre) : attendu d'abord par le toit de la maison de la Plaine (l'île où l'on est), plan 2.
  expect(inv.rows[2].uses[0]).toMatchObject({ kind: 'garder', island: 'maths-6e-calculation' });
  expect(inv.rows[3].uses).toEqual([]);
  // Les ouvrages : payables par 9 blocs (le toit ne compte pas), depuis une île ouverte, sans doublon.
  expect(inv.payable).toBe(9);
  expect(inv.ouvrages.map((o) => o.bridge.id).sort()).toEqual(['french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-english-6e-grammar', 'french-6e-phonology-french-6e-letter-confusion', 'maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals'].sort());
  expect(inv.ouvrages.every((o) => o.enough)).toBe(true);
  expect(inv.ouvrages.find((o) => o.bridge.id === 'french-6e-phonology-french-6e-letter-confusion')).toMatchObject({ from: 'french-6e-phonology', to: 'french-6e-letter-confusion' });
  expect(inventoryUses(sanitizeState({})).rows).toEqual([]);
});
