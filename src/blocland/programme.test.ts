// Le rattachement des quêtes au programme officiel : chaque quête cite des compétences qui existent et sont de son
// cycle ; chaque compétence est travaillée par une quête, ou exclue avec un motif (jamais les deux).
import { APPS } from '../apps/registry';
import { CYCLE_OF, PROGRAMME, byId } from '../programme';
import { EXCLUSIONS } from '../programme/exclusions';
import { BIOMES } from './biomes';
import { loadAllExercises } from './exercises';

const EXERCISES = await loadAllExercises();

/** Qui travaille quoi : quêtes des îles, quêtes du portail, exercices qui précisent leur programme. */
function coverage(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (id: string, by: string) => map.set(id, [...(map.get(id) ?? []), by]);
  for (const b of BIOMES) for (const q of b.exercises) for (const id of q.programme) add(id, `${b.id}/${q.id}`);
  for (const a of APPS) for (const id of a.programme ?? []) add(id, `portail/${a.id}`);
  for (const e of EXERCISES) for (const id of e.programme ?? []) add(id, e.id);
  return map;
}

it('chaque quête d’une île cite au moins une compétence, existante, sans doublon, de sa matière et de son cycle', () => {
  for (const b of BIOMES) {
    const cycle = CYCLE_OF[b.classe];
    for (const q of b.exercises) {
      const where = `${b.id}/${q.id}`;
      expect(q.programme.length, `${where} : aucune compétence du programme`).toBeGreaterThanOrEqual(1);
      expect(new Set(q.programme).size, where).toBe(q.programme.length);
      const entries = q.programme.map((id) => {
        const e = byId(id);
        expect(e, `${where} : compétence inconnue ${id}`).toBeTruthy();
        return e!;
      });
      for (const e of entries) {
        expect(e.discipline, `${where} cite ${e.id}, d’une autre matière`).toBe(b.subject);
        // Une île de 6e ne travaille pas le cycle 4 ; une île du cycle 4 peut consolider une compétence du cycle 3.
        if (cycle === 3) expect(e.cycle, `${where} cite ${e.id}, du cycle 4`).toBe(3);
      }
      expect(entries.some((e) => e.cycle === cycle), `${where} ne cite aucune compétence de son cycle (${cycle})`).toBe(true);
    }
  }
});

it('chaque quête du portail qui cite le programme cite des compétences existantes, de sa matière', () => {
  for (const a of APPS) {
    if (!a.programme) continue;
    expect(a.programme.length, a.id).toBeGreaterThanOrEqual(1);
    expect(new Set(a.programme).size, a.id).toBe(a.programme.length);
    for (const id of a.programme) {
      const e = byId(id);
      expect(e, `portail/${a.id} : compétence inconnue ${id}`).toBeTruthy();
      expect(e!.discipline, `portail/${a.id} cite ${id}, d’une autre matière`).toBe(a.subject);
    }
  }
  // Les quêtes d'une matière (hors Tutoriel) sont toutes rattachées.
  for (const a of APPS.filter((x) => !x.onHome)) expect(a.programme, `portail/${a.id} : aucune compétence du programme`).toBeTruthy();
});

it('un exercice qui précise son programme cite des compétences existantes, de la matière de son île', () => {
  for (const e of EXERCISES) {
    if (!e.programme) continue;
    const b = BIOMES.find((x) => x.id === e.biome)!;
    for (const id of e.programme) {
      const p = byId(id);
      expect(p, `${e.id} : compétence inconnue ${id}`).toBeTruthy();
      expect(p!.discipline, `${e.id} cite ${id}, d’une autre matière`).toBe(b.subject);
      if (CYCLE_OF[b.classe] === 3) expect(p!.cycle, `${e.id} cite ${id}, du cycle 4`).toBe(3);
    }
  }
});

it('couverture : chaque compétence a une quête, ou une exclusion motivée, jamais les deux', () => {
  const covered = coverage();
  for (const e of PROGRAMME) {
    const by = covered.get(e.id);
    const excluded = EXCLUSIONS[e.id];
    expect(by || excluded, `${e.id} n’est travaillée par aucune quête : ajouter une quête ou une exclusion motivée dans src/programme/exclusions.ts`).toBeTruthy();
    expect(by && excluded ? `${e.id} est couverte par ${by.join(', ')} : retirer son exclusion` : '', e.id).toBe('');
  }
});
