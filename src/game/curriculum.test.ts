// Le rattachement des missions au programme officiel : chaque mission cite des compétences qui existent, au programme
// de sa classe ou d'une classe d'avant ; chaque compétence est travaillée par une mission, ou exclue avec un motif
// (jamais les deux).
import { APPS } from '../apps/registry';
import { PROGRAMME, byId, citable } from '../curriculum';
import { EXCLUSIONS } from '../curriculum/exclusions';
import { BIOMES } from './biomes';
import { loadAllExercises } from './exercises';

/**
 * La discipline attendue d'une mission : celle de son île, ou pour un lieu d'option (GD-13) celle de la mission : la
 * langue de la LV2, le latin ou le grec.
 */
const LV2_DISCIPLINE = { de: 'german', es: 'spanish' } as const;
const OPTION_DISCIPLINE = { la: 'latin', gr: 'greek' } as const;
function disciplineDe(b: (typeof BIOMES)[number], mission: string): string {
  const x = b.exercises.find((m) => m.id === mission);
  if (x?.lv2) return LV2_DISCIPLINE[x.lv2];
  if (x?.option) return OPTION_DISCIPLINE[x.option];
  return b.subject;
}

const EXERCISES = await loadAllExercises();

/** Qui travaille quoi : missions des îles, missions du portail, exercices qui précisent leur programme. */
function coverage(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (id: string, by: string) => map.set(id, [...(map.get(id) ?? []), by]);
  for (const b of BIOMES) for (const q of b.exercises) for (const id of q.programme) add(id, `${b.id}/${q.id}`);
  for (const a of APPS) for (const id of a.programme ?? []) add(id, `portail/${a.id}`);
  for (const e of EXERCISES) for (const id of e.programme ?? []) add(id, e.id);
  return map;
}

it('chaque mission d’une île cite au moins une compétence, existante, sans doublon, de sa matière et de sa classe', () => {
  for (const b of BIOMES) {
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
        expect(e.discipline, `${where} cite ${e.id}, d’une autre matière`).toBe(disciplineDe(b, q.id));
        // Une compétence de sa classe, ou d'une classe d'avant (consolidation) ; jamais d'une classe d'après.
        expect(citable(e, b.classe), `${where} (${b.classe}) cite ${e.id}, au programme de ${e.classes.join(', ')}`).toBeTruthy();
      }
      expect(entries.some((e) => citable(e, b.classe) === 'classe'), `${where} ne cite aucune compétence de sa classe (${b.classe})`).toBe(true);
    }
  }
});

it('chaque mission du portail qui cite le programme cite des compétences existantes, de sa matière', () => {
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
  // Les missions d'une matière (hors Tutoriel) sont toutes rattachées.
  for (const a of APPS.filter((x) => !x.onHome)) expect(a.programme, `portail/${a.id} : aucune compétence du programme`).toBeTruthy();
});

it('un exercice qui précise son programme cite des compétences existantes, de la matière de son île', () => {
  for (const e of EXERCISES) {
    if (!e.programme) continue;
    const b = BIOMES.find((x) => x.id === e.biome)!;
    for (const id of e.programme) {
      const p = byId(id);
      expect(p, `${e.id} : compétence inconnue ${id}`).toBeTruthy();
      expect(p!.discipline, `${e.id} cite ${id}, d’une autre matière`).toBe(disciplineDe(b, e.type));
      expect(citable(p!, b.classe), `${e.id} (${b.classe}) cite ${id}, au programme de ${p!.classes.join(', ')}`).toBeTruthy();
    }
  }
});

it('couverture : chaque compétence a une mission, ou une exclusion motivée, jamais les deux', () => {
  const covered = coverage();
  for (const e of PROGRAMME) {
    const by = covered.get(e.id);
    const excluded = EXCLUSIONS[e.id];
    expect(by || excluded, `${e.id} n’est travaillée par aucune mission : ajouter une mission ou une exclusion motivée dans src/curriculum/exclusions.ts`).toBeTruthy();
    expect(by && excluded ? `${e.id} est couverte par ${by.join(', ')} : retirer son exclusion` : '', e.id).toBe('');
  }
});
