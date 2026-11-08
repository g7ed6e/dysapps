import { ALL_PLANS, hasScenette, placeById, placeOfIsland } from './levelPlan';
import { ISLANDS_WITH_PAROLES, habitantLine, habitantLines, missionWords, parolesOf } from './paroles';

describe('la parole du lieu et la raison du lieu (GD-27)', () => {
  it('chaque île qui parle est celle d’un lieu à scénette, et ses missions sont des missions de sa scénette', () => {
    for (const island of ISLANDS_WITH_PAROLES) {
      const place = placeOfIsland(island);
      expect(place && hasScenette(place.id), island).toBeTruthy();
      const paroles = parolesOf(place!.id)!;
      for (const mission of Object.keys(paroles.missions ?? {})) expect(place!.scenes, `${island} : ${mission}`).toContain(mission);
    }
  });

  it('les Quais : les lignes tournent entre le métier, le lieu et l’état, et chaque mission a son cadre et sa suite', () => {
    const lines = habitantLines('quais', 'ruine');
    expect(lines.slice(0, 3)).toEqual(['Je charge les caisses sur la barge.', 'Ici, les bateaux chargent et déchargent.', 'Le quai est couvert de sable.']);
    expect(new Set(lines).size).toBe(lines.length);
    expect(habitantLine('quais', 'ruine', 0)).toBe(lines[0]);
    expect(habitantLine('quais', 'ruine', lines.length)).toBe(lines[0]);
    expect(habitantLines('quais', 'rallume')).toContain('La barge est pleine.');
    expect(habitantLines('quais', 'rallume')).not.toContain('Le quai est couvert de sable.');
    for (const mission of placeById('quais').scenes) expect(missionWords('quais', mission), mission).toMatchObject({ frame: expect.stringMatching(/\.$/), follow: expect.stringMatching(/\.$/) });
  });

  it('tout lieu à scénette a sa parole, et chaque mission de sa scénette son cadre et sa suite', () => {
    const manquent: string[] = [];
    for (const plan of ALL_PLANS)
      for (const p of plan.places) {
        if (!hasScenette(p.id)) continue;
        if (!parolesOf(p.id)?.lines) manquent.push(`${p.id} : l’habitant`);
        for (const m of p.scenes) if (!missionWords(p.id, m)) manquent.push(`${p.id} : ${m}`);
      }
    expect(manquent).toEqual([]);
  });
});
