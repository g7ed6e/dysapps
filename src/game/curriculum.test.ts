// Le rattachement des missions au programme officiel : chaque mission cite des compétences qui existent, au programme
// de sa classe ou d'une classe d'avant ; chaque compétence est travaillée par une mission, ou exclue avec un motif
// (jamais les deux).
import { APPS } from '../apps/registry';
import { PROGRAMME, byId, citable } from '../curriculum';
import { EXCLUSIONS } from '../curriculum/exclusions';
import { BIOMES } from './biomes';
import { loadAllExercises } from './exercises';

/** La discipline attendue d'une mission : celle de son île, ou pour l'île de la LV2 la langue de la mission. */
const LV2_DISCIPLINE = { de: 'german', es: 'spanish' } as const;
function disciplineDe(b: (typeof BIOMES)[number], mission: string): string {
  const lv2 = b.exercises.find((x) => x.id === mission)?.lv2;
  return lv2 ? LV2_DISCIPLINE[lv2] : b.subject;
}

const EXERCISES = await loadAllExercises();

/**
 * En attente de la seconde moitié du lot « programmes 2025-2026 » : des missions de 5e qui travaillent une notion que
 * les textes de 2026 placent en 4e (multiplier des relatifs ou des fractions, le subjonctif, les conjonctions de
 * subordination, le ratio). Elles gardent leur compétence de 2020, réservée à la 4e et à la 3e, jusqu'à ce que la notion
 * parte en 4e ou que la mission change d'île (docs/conception/cadrage-contenu.md, « Programmes 2025-2026 ») ; la liste
 * se vide alors, et le test refuse toute nouvelle entrée qui ne servirait plus.
 */
const EN_ATTENTE: Record<string, readonly string[]> = {
  'french-5e-conjugation/subjunctive': ['c4.fr.langue.temps-a-memoriser', 'c4.fr.langue.morphologie-verbale'],
  'french-5e-homophones/pairs': ['c4.fr.langue.orthographe-lexicale'],
  'french-5e-homophones/choices': ['c4.fr.langue.orthographe-lexicale'],
  'french-5e-homophones/homophone-sentences': ['c4.fr.langue.orthographe-lexicale'],
  'maths-5e-signed-numbers/subtracting': ['c4.ma.a.calcul-relatifs'],
  'maths-5e-signed-numbers/fractions': ['c4.ma.a.calcul-fractions'],
  'maths-5e-proportionality/proportion-tables': ['c4.ma.b.ratio'],
};

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
  const attentesServies = new Set<string>();
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
        if (citable(e, b.classe)) continue;
        expect(EN_ATTENTE[where] ?? [], `${where} (${b.classe}) cite ${e.id}, au programme de ${e.classes.join(', ')}`).toContain(e.id);
        attentesServies.add(`${where} ${e.id}`);
      }
      // Une mission en attente peut n'avoir que sa notion de 4e (la règle des signes du produit, le subjonctif).
      if (!EN_ATTENTE[where])
        expect(entries.some((e) => citable(e, b.classe) === 'classe'), `${where} ne cite aucune compétence de sa classe (${b.classe})`).toBe(true);
    }
  }
  const attentes = Object.entries(EN_ATTENTE).flatMap(([where, ids]) => ids.map((id) => `${where} ${id}`));
  expect(attentes.filter((a) => !attentesServies.has(a)), 'EN_ATTENTE : retirer ce qui ne sert plus').toEqual([]);
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
