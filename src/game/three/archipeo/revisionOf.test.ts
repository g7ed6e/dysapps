// La révision dans la scène du lieu (GD-20, point 4, lot L3, B2) : le passage d'un lieu, ses questions dues, 8 au plus,
// dans l'ordre de la file, regroupées par exercice ; seules celles de ce lieu ; jamais un exercice généré (les maths des
// Quais, des Écluses, des Marais salants), ni l'Ascension de la Vigie : ceux-là gardent l'écran habituel.
import { describe, expect, it, vi } from 'vitest';
import { CATALOG, loadExercise } from '../../exercises';
import type { SpacedItem } from '../../engine';
import { PLACES, placeById } from '../../world/continu/plan6e';
import { REVISION_MAX, planRevision, revisableInScene, revisionPlanOf } from './revisionOf';

const TODAY = '2026-10-17';
const due = (itemId: string, d = TODAY): SpacedItem => ({ itemId, due: d, stage: 0, streak: 0 });
/** Toutes les liaisons du 6e ouvertes : les révisions de chaque lieu sont proposées. */
const LINKS: string[] = [];

describe('Les morceaux d’un passage', () => {
  it('dans l’ordre de la file, regroupés par exercice dans l’ordre où chacun vient ; 8 au plus ; une clé une fois', () => {
    const list = [
      { exercise: 'a', key: '1' },
      { exercise: 'b', key: '1' },
      { exercise: 'a', key: '2' },
      { exercise: 'a', key: '2' },
      { exercise: 'c', key: '9' },
      ...Array.from({ length: 10 }, (_, i) => ({ exercise: 'b', key: `x${i}` })),
    ];
    const plan = planRevision(list, (e) => e !== 'c');
    expect(plan.map((s) => s.exercise)).toEqual(['a', 'b']);
    expect(plan[0].keys).toEqual(['1', '2']);
    expect(plan.reduce((n, s) => n + s.keys.length, 0)).toBe(REVISION_MAX);
    expect(REVISION_MAX).toBe(8);
  });
});

describe('Ce qui se revoit dans la scène', () => {
  it('jamais un exercice généré, ni l’Ascension : les maths des Quais, des Écluses et des Marais salants gardent l’écran habituel', async () => {
    const kept: string[] = [];
    for (const p of PLACES)
      for (const m of CATALOG.filter((x) => x.biome === p.island)) {
        const def = (await loadExercise(m.id))!;
        if (!revisableInScene(def)) kept.push(`${p.id}/${m.type}`);
        if (def.generate) expect(revisableInScene(def)).toBe(false);
      }
    expect([...new Set(kept.map((k) => k.split('/')[0]))].sort()).toEqual(['ecluses', 'lookout', 'quais', 'saltworks']);
    expect([...new Set(kept.filter((k) => k.startsWith('lookout')))]).toEqual(['lookout/fluency']);
  });

  it('le passage d’un lieu : ses seules questions dues, qui existent dans l’exercice, dans l’ordre des dates', async () => {
    const phare = placeById('phare');
    const [syl] = CATALOG.filter((m) => m.biome === phare.island && m.type === 'syllables');
    const [rimes] = CATALOG.filter((m) => m.biome === phare.island && m.type === 'rhymes');
    const sylDef = (await loadExercise(syl.id))!;
    const rimesDef = (await loadExercise(rimes.id))!;
    const autre = CATALOG.find((m) => m.biome === placeById('filets').island)!;
    const autreDef = (await loadExercise(autre.id))!;
    const spaced = [
      due(`${rimes.id}:${rimesDef.items[0].key}`, '2026-10-10'),
      due(`${syl.id}:${sylDef.items[1].key}`, '2026-10-12'),
      due(`${syl.id}:${sylDef.items[0].key}`, '2026-10-15'),
      due(`${syl.id}:clé-retirée`, '2026-10-16'),
      due(`${autre.id}:${autreDef.items[0].key}`, '2026-10-11'),
      due(`${syl.id}:${sylDef.items[2].key}`, '2026-10-20'),
    ];
    const plan = await revisionPlanOf(spaced, LINKS, 'phare', 'none', TODAY);
    expect(plan).toEqual({
      place: 'phare',
      total: 3,
      segments: [
        { exercise: rimes.id, type: 'rhymes', level: rimes.level, keys: [rimesDef.items[0].key] },
        { exercise: syl.id, type: 'syllables', level: syl.level, keys: [sylDef.items[1].key, sylDef.items[0].key] },
      ],
    });
  });

  it('charge les exercices dans l’ordre de la file et s’arrête à 8 questions : une longue file ne charge que les premiers', async () => {
    const phare = placeById('phare');
    const [syl] = CATALOG.filter((m) => m.biome === phare.island && m.type === 'syllables');
    const [rimes] = CATALOG.filter((m) => m.biome === phare.island && m.type === 'rhymes');
    const sylDef = (await loadExercise(syl.id))!;
    const rimesDef = (await loadExercise(rimes.id))!;
    expect(sylDef.items.length).toBeGreaterThanOrEqual(REVISION_MAX);
    const spaced = [
      ...sylDef.items.slice(0, REVISION_MAX).map((it, i) => due(`${syl.id}:${it.key}`, `2026-10-0${i + 1}`)),
      ...rimesDef.items.slice(0, 4).map((it) => due(`${rimes.id}:${it.key}`, '2026-10-15')),
    ];
    const load = vi.fn(loadExercise);
    const plan = await revisionPlanOf(spaced, LINKS, 'phare', 'none', TODAY, load);
    expect(load.mock.calls.map(([id]) => id)).toEqual([syl.id]);
    expect(plan?.total).toBe(REVISION_MAX);
    expect(plan?.segments.map((x) => x.exercise)).toEqual([syl.id]);
  });

  it('rien à revoir ici dans la scène (seulement des maths générées) : pas de passage, « Reprendre » garde l’écran habituel', async () => {
    const quais = placeById('quais');
    const gen = CATALOG.find((m) => m.biome === quais.island && m.type === 'times-tables')!;
    expect(await revisionPlanOf([due(`${gen.id}:7x8`)], LINKS, 'quais', 'none', TODAY)).toBeNull();
    expect(await revisionPlanOf([], LINKS, 'phare', 'none', TODAY)).toBeNull();
  });
});
