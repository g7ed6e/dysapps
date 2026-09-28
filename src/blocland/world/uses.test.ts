import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { monumentsOf } from './monuments';
import { blockUses, earnIsland, inventoryUses, missingNow, whereToEarn } from './uses';
import { VEHICLE_STAGES } from './vehicle';

/** Les blocs de bois du premier plan de la Forêt (la cabane de Mousso). */
const CABANE = plansFor('foret')[0].cells.length;
const donePlans = (island: string) => Object.fromEntries(plansFor(island as never).map((p) => [p.id, planCells(p).map((c) => c.key)]));

it('sait où se gagne chaque bloc', () => {
  expect(earnIsland('bois')?.id).toBe('foret');
  expect(whereToEarn('bois')).toBe('Forêt des sons');
  expect(earnIsland('toit')).toBeUndefined();
  expect(whereToEarn('toit')).toContain('coffre');
});

it('un bloc sert au plan en cours de son île et au Bloc-Navire, avec ce qu’il en manque', () => {
  const fresh = sanitizeState({});
  const uses = blockUses(fresh, 'bois');
  expect(uses.map((u) => u.kind)).toEqual(['plan', 'navire']);
  // Cohérent avec le prochain objectif (« Encore 26 blocs de bois pour La cabane de Mousso »).
  expect(uses[0]).toMatchObject({ island: 'foret', name: 'La cabane de Mousso', need: CABANE, enough: false });
  expect(uses[1]).toMatchObject({ island: 'plaine', need: 20 });
  // Avec assez de blocs, le plan est faisable.
  const rich = sanitizeState({ inventory: { bois: CABANE } });
  expect(blockUses(rich, 'bois')[0].enough).toBe(true);
});

it('un bloc de finition sans plan à l’attendre est à garder pour les plans suivants', () => {
  const fresh = sanitizeState({});
  // La lanterne : pas dans la cabane, mais dans le toit (plan 2) de la Forêt.
  expect(blockUses(fresh, 'lanterne')[0]).toMatchObject({ kind: 'garder', island: 'foret' });
  expect(blockUses(fresh, 'brique')[0]).toMatchObject({ kind: 'plan', island: 'plaine' });
});

it('un bloc dont l’île a fini ses plans sert aux monuments de l’archipel ; eux finis, il ne sert plus à rien', () => {
  const done = sanitizeState({ village: { plans: donePlans('plaine') }, inventory: { brique: 9 } });
  const uses = blockUses(done, 'brique');
  expect(uses.map((u) => [u.kind, u.to])).toEqual([
    ['monument', '/aventure/monument-observatoire'],
    ['monument', '/aventure/monument-moulin'],
  ]);
  expect(uses[0]).toMatchObject({ name: 'L’observatoire des baleines', need: 27, enough: false });
  const all = { ...donePlans('plaine'), ...Object.fromEntries(monumentsOf('6e').map((m) => [m.id, planCells(m).map((c) => c.key)])) };
  expect(blockUses(sanitizeState({ village: { plans: all }, inventory: { brique: 9 } }), 'brique')).toEqual([]);
});

it('ne regarde que les îles ouvertes de l’archipel où l’on est, et le navire seulement à portée', () => {
  const fresh = sanitizeState({});
  // La Mine est fermée : la pierre ne sert pas encore à son plan.
  expect(blockUses(fresh, 'pierre').filter((u) => u.kind === 'plan')).toEqual([]);
  // Le sable sert à la coque (navire) même si la Carrière, son île, est fermée.
  expect(blockUses(fresh, 'sable').map((u) => u.kind)).toContain('navire');
  expect(blockUses(fresh, 'sable').some((u) => u.island === 'carriere')).toBe(false);
  // Dans les Îles Brumeuses, le ballon se construit sur le Marché ; la coque (voyage fait) n'est plus un chantier.
  const away = sanitizeState({ village: { bridges: ['voyage-5e'], at: 'marche' } });
  expect(blockUses(away, 'sable').map((u) => u.kind)).toEqual(['garder']);
  expect(blockUses(away, 'toile').map((u) => u.kind)).toContain('navire');
});

it('les blocs à aller chercher : ceux qui manquent aux chantiers à portée, avec leur île', () => {
  const fresh = sanitizeState({ inventory: { bois: 10 } });
  const missing = missingNow(fresh);
  const bois = missing.find((m) => m.block === 'bois')!;
  // La cabane + 20 pour la coque, moins 10 en poche.
  expect(bois).toMatchObject({ need: CABANE + 20 - 10, island: 'foret', closed: false });
  expect(missing.find((m) => m.block === 'brique')).toMatchObject({ island: 'plaine' });
  // Le galet de la coque se gagne sur la Rivière, encore fermée.
  expect(missing.find((m) => m.block === 'galet')).toMatchObject({ island: 'riviere', closed: true });
  // Rien de la Mine (fermée) ni d'un autre archipel.
  expect(missing.some((m) => m.block === 'pierre' && m.need > 1)).toBe(false);
  expect(missing.some((m) => m.block === 'glace')).toBe(false);
});

it('l’inventaire commenté : les lignes rangées par utilité, les ouvrages une seule fois, le total', () => {
  // Sur la Plaine, la coque du navire déjà posée (elle prendrait tous les blocs) : le plan de la Plaine est « ici ».
  const [coque] = VEHICLE_STAGES;
  const plans = { [coque.id]: planCells(coque).map((c) => c.key) };
  const state = sanitizeState({ village: { at: 'plaine', plans }, inventory: { bois: 3, brique: 2, toit: 1, or: 4 } });
  const inv = inventoryUses(state);
  expect(inv.total).toBe(10);
  // Posable ici (Plaine : brique), puis ailleurs (bois : Forêt), puis à garder (toit), puis sans usage (or).
  expect(inv.rows.map((r) => r.block)).toEqual(['brique', 'bois', 'toit', 'or']);
  expect(inv.rows[1].uses).toEqual([{ kind: 'plan', island: 'foret', name: 'La cabane de Mousso', need: CABANE, enough: false }]);
  // Le toit (bloc de coffre) : attendu d'abord par le toit de la maison de la Plaine (l'île où l'on est), plan 2.
  expect(inv.rows[2].uses[0]).toMatchObject({ kind: 'garder', island: 'plaine' });
  expect(inv.rows[3].uses).toEqual([]);
  // Les ouvrages : payables par 9 blocs (le toit ne compte pas), depuis une île ouverte, sans doublon.
  expect(inv.payable).toBe(9);
  expect(inv.ouvrages.map((o) => o.bridge.id).sort()).toEqual(['foret-ferme', 'foret-horloge', 'foret-mine', 'plaine-riviere', 'plaine-volcan'].sort());
  expect(inv.ouvrages.every((o) => o.enough)).toBe(true);
  expect(inv.ouvrages.find((o) => o.bridge.id === 'foret-mine')).toMatchObject({ from: 'foret', to: 'mine' });
  expect(inventoryUses(sanitizeState({})).rows).toEqual([]);
});
