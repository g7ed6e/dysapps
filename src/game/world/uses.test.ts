import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { monumentsOf } from './monuments';
import { blocTrophee, blockUses, earnIsland, inventoryUses, missingNow, whereToEarn } from './uses';
import { VEHICLE_STAGES } from './vehicle';
import { BLOC } from '../biomes';

const donePlans = (island: string) => Object.fromEntries(plansFor(island as never).map((p) => [p.id, planCells(p).map((c) => c.key)]));

it('sait où se gagne chaque bloc', () => {
  expect(earnIsland(BLOC.bois)?.id).toBe('french-6e-phonology');
  expect(whereToEarn(BLOC.bois)).toBe('Forêt des sons');
  expect(earnIsland(BLOC.toit)).toBeUndefined();
  // Plus de coffre de plan (GD-6) : un bloc de finition ne vient plus que d'un coffre de régularité.
  expect(whereToEarn(BLOC.toit)).toBe('un coffre de régularité');
});

it('les blocs de finition, l’or et le cristal sont des trophées ; ni les blocs d’île ni les blocs assemblés', () => {
  for (const b of [BLOC.toit, BLOC.porte, BLOC.lanterne, BLOC.barriere, BLOC.escalier, BLOC.or, BLOC.cristal]) expect(blocTrophee(b), b).toBe(true);
  for (const b of [BLOC.bois, BLOC.brique, BLOC.poutre]) expect(blocTrophee(b), b).toBe(false);
});

it('un bloc sert au Bloc-Navire, jamais au bâtiment de son île (il se pose tout seul, GD-6)', () => {
  const fresh = sanitizeState({});
  const uses = blockUses(fresh, BLOC.bois);
  expect(uses.map((u) => u.kind)).toEqual(['navire']);
  expect(uses[0]).toMatchObject({ island: 'maths-6e-calculation', need: 20, enough: false });
  // Avec assez de blocs, l'étape du navire est faisable.
  const rich = sanitizeState({ stock: { [BLOC.bois]: 20 } });
  expect(blockUses(rich, BLOC.bois)[0].enough).toBe(true);
});

it('un bloc de finition ne sert plus à rien ; un bloc d’île sans navire à servir va aux monuments', () => {
  const fresh = sanitizeState({});
  expect(blockUses(fresh, BLOC.toit)).toEqual([]);
  expect(blockUses(fresh, BLOC.lanterne)).toEqual([]);
  expect(blockUses(fresh, BLOC.brique).map((u) => u.kind)).toEqual(['monument', 'monument']);
});

it('un bloc dont l’île a fini ses plans sert aux monuments de l’archipel ; eux finis, il ne sert plus à rien', () => {
  const done = sanitizeState({ world: { parts: donePlans('maths-6e-calculation') }, stock: { [BLOC.brique]: 9 } });
  const uses = blockUses(done, BLOC.brique);
  expect(uses.map((u) => [u.kind, u.to])).toEqual([
    ['monument', '/adventure/landmark-6e-1'],
    ['monument', '/adventure/landmark-6e-2'],
  ]);
  expect(uses[0]).toMatchObject({ name: 'L’observatoire des baleines', need: 27, enough: false });
  const all = { ...donePlans('maths-6e-calculation'), ...Object.fromEntries(monumentsOf('6e').map((m) => [m.id, planCells(m).map((c) => c.key)])) };
  expect(blockUses(sanitizeState({ world: { parts: all }, stock: { [BLOC.brique]: 9 } }), BLOC.brique)).toEqual([]);
});

it('ne regarde que les îles ouvertes de l’archipel où l’on est, et le navire seulement à portée', () => {
  const fresh = sanitizeState({});
  // La Mine est fermée : la pierre ne sert qu'au navire, rien sur la Mine.
  expect(blockUses(fresh, BLOC.pierre).some((u) => u.island === 'french-6e-letter-confusion')).toBe(false);
  // Le sable sert à la coque (navire) même si la Carrière, son île, est fermée.
  expect(blockUses(fresh, BLOC.sable).map((u) => u.kind)).toContain('navire');
  expect(blockUses(fresh, BLOC.sable).some((u) => u.island === 'french-6e-word-spelling')).toBe(false);
  // Dans les Îles Brumeuses, le ballon se construit sur le Marché ; la coque (voyage fait) n'est plus un chantier.
  const away = sanitizeState({ world: { links: ['passage-5e'], place: 'maths-5e-proportionality' } });
  expect(blockUses(away, BLOC.sable)).toEqual([]);
  expect(blockUses(away, BLOC.toile).map((u) => u.kind)).toContain('navire');
});

it('les blocs à aller chercher : ceux qui manquent au Bloc-Navire à portée, avec leur île', () => {
  const fresh = sanitizeState({ stock: { [BLOC.bois]: 10 } });
  const missing = missingNow(fresh);
  const bois = missing.find((m) => m.block === BLOC.bois)!;
  // 20 pour la coque, moins 10 en poche ; le bâtiment de la Forêt n'en demande plus (GD-6).
  expect(bois).toMatchObject({ need: 20 - 10, island: 'french-6e-phonology', closed: false });
  expect(missing.find((m) => m.block === BLOC.brique)).toBeUndefined();
  // Le galet de la coque se gagne sur la Rivière, encore fermée.
  expect(missing.find((m) => m.block === BLOC.galet)).toMatchObject({ island: 'maths-6e-fractions', closed: true });
  // Rien de la Mine (fermée) ni d'un autre archipel.
  expect(missing.some((m) => m.block === BLOC.pierre && m.need > 1)).toBe(false);
  expect(missing.some((m) => m.block === BLOC.glace)).toBe(false);
});

it('l’inventaire commenté : les lignes rangées par utilité, les ouvrages une seule fois, le total', () => {
  // Sur la Plaine, la coque du navire déjà posée (elle prendrait tous les blocs) : les blocs d'île vont aux monuments.
  const [coque] = VEHICLE_STAGES;
  const plans = { [coque.id]: planCells(coque).map((c) => c.key) };
  const state = sanitizeState({ world: { place: 'maths-6e-calculation', parts: plans }, stock: { [BLOC.bois]: 3, [BLOC.brique]: 2, [BLOC.toit]: 1, [BLOC.or]: 4 } });
  const inv = inventoryUses(state);
  expect(inv.total).toBe(10);
  // Posables ailleurs (bois, brique : les monuments), puis les trophées (or, toit), sans usage (GD-6).
  expect(inv.rows.map((r) => r.block)).toEqual([BLOC.bois, BLOC.brique, BLOC.or, BLOC.toit]);
  expect(inv.rows[0].uses.map((u) => u.kind)).toEqual(['monument', 'monument']);
  expect(inv.rows[2].uses).toEqual([]);
  expect(inv.rows[3].uses).toEqual([]);
  // Les ouvrages : payables par 5 blocs (ni le toit ni l'or ne comptent, GD-6), une liaison proposée par lieu fermé
  // qu'une liaison ouvre depuis un lieu relié (GD-9), sans doublon.
  expect(inv.payable).toBe(5);
  expect(inv.ouvrages.map((o) => o.bridge.id).sort()).toEqual(
    [
      'french-6e-phonology-french-6e-grammar-spelling',
      'french-6e-phonology-english-6e-grammar',
      'french-6e-phonology-english-6e-vocabulary',
      'french-6e-phonology-french-6e-letter-confusion',
      'french-6e-phonology-french-6e-word-spelling',
      'french-6e-phonology-history-6e-antiquity',
      'french-6e-phonology-life-earth-sciences-6e-living-world',
      'maths-6e-calculation-maths-6e-fractions',
      'maths-6e-calculation-maths-6e-decimals',
      'maths-6e-calculation-technology-6e-objects',
    ].sort(),
  );
  expect(inv.ouvrages.every((o) => o.enough)).toBe(true);
  expect(inv.ouvrages.find((o) => o.bridge.id === 'french-6e-phonology-french-6e-letter-confusion')).toMatchObject({ from: 'french-6e-phonology', to: 'french-6e-letter-confusion' });
  expect(inventoryUses(sanitizeState({})).rows).toEqual([]);
});
