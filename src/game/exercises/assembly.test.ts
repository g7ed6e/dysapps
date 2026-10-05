// Les questions des blocs assemblés (GD-2) : docs/contenu/assemblage.md, section « Les questions », écrite par
// `npm run contenu` dans data/assemblage-<bloc>.json. Chaque bloc a ses questions ; chacune mobilise les deux matières
// de sa recette, au niveau de son archipel ; trois choix, une aide, rien que la voix lirait mal.
import { APPS } from '../../apps/registry';
import { CYCLE_OF, byId } from '../../curriculum';
import { BIOMES } from '../biomes';
import { RECETTES } from '../world/assembly';
import { ILES } from '../islands';
import { BLOCS_A_QUESTIONS, CATALOG, UNORDERED, loadAllExercises, loadAssemblage } from './index';
import { SCREEN_TYPES } from './registry';
import { piegesDe, placerChoixAssemblage, valeursDesNombres } from './shuffle';
import type { AssemblageDef } from './types';

const QUESTIONS = new Map<string, AssemblageDef>();
for (const r of RECETTES) {
  const def = await loadAssemblage(r.bloc);
  if (def) QUESTIONS.set(r.bloc, def);
}
const EXERCISES = await loadAllExercises();

/** La matière (au sens du programme) de l'île qui donne un bloc. */
function matiereDuBloc(bloc: string): string | undefined {
  return ILES.find((i) => i.block === bloc)?.subject;
}

/** Les textes d'une question, tels que l'élève les lit ou les entend. */
function textes(def: AssemblageDef): string[] {
  return [
    def.instruction,
    def.feedback.correct,
    def.feedback.wrong,
    ...def.items.flatMap((it) => {
      const aid = it.aid as { props: { title: string; lines: string[] } } | undefined;
      return [
        it.prompt,
        it.question,
        it.spoken,
        it.answer,
        it.hint,
        it.explanation,
        ...((it.choices as unknown[]) ?? []),
        aid?.props.title,
        ...(aid?.props.lines ?? []),
      ];
    }),
  ].filter((t): t is string => typeof t === 'string');
}

it('chaque bloc assemblé a ses questions, au moins 8, et rien d’autre n’en a', () => {
  for (const r of RECETTES) {
    const def = QUESTIONS.get(r.bloc);
    expect(def, `${r.bloc} : aucune question dans docs/contenu/assemblage.md`).toBeDefined();
    expect(def!.bloc).toBe(r.bloc);
    expect(def!.type).toBe('assembly');
    expect(def!.items.length, r.bloc).toBeGreaterThanOrEqual(8);
    expect(new Set(def!.items.map((it) => it.key)).size, r.bloc).toBe(def!.items.length);
  }
  expect([...BLOCS_A_QUESTIONS].sort()).toEqual(RECETTES.map((r) => r.bloc).sort());
});

it('les questions d’assemblage ne sont ni dans une île ni au catalogue des missions', () => {
  expect(CATALOG.some((e) => e.type === 'assembly')).toBe(false);
  expect(UNORDERED).toEqual([]);
  expect(BIOMES.some((b) => b.exercises.some((m) => m.id === 'assembly'))).toBe(false);
  // Elles s'affichent sur l'écran à document, avec les pièges du fichier.
  expect(SCREEN_TYPES.assembly.batch).toBe(1);
  for (const def of QUESTIONS.values()) expect(piegesDe(def)).toBe('du-fichier');
});

describe.each(RECETTES.map((r) => [r.bloc, r] as const))('les questions du bloc %s', (bloc, recette) => {
  const def = () => QUESTIONS.get(bloc)!;

  it('citent des compétences qui existent, des deux matières de la recette, du niveau de l’archipel', () => {
    const entries = def().programme.map((id) => {
      const e = byId(id);
      expect(e, `${bloc} : compétence inconnue ${id}`).toBeTruthy();
      return e!;
    });
    expect(new Set(def().programme).size).toBe(def().programme.length);
    const matieres = [...new Set(recette.ingredients.map((i) => matiereDuBloc(i.bloc)))];
    expect(matieres.length, `${bloc} : la recette prend les blocs de deux matières`).toBe(2);
    for (const m of matieres)
      expect(
        entries.some((e) => e.discipline === m),
        `${bloc} : aucune compétence de ${m}`,
      ).toBe(true);
    for (const e of entries) expect(matieres, `${bloc} cite ${e.id}, d’une autre matière`).toContain(e.discipline);
    // 6e : le cycle 3 seul ; 5e à 3e : au moins une compétence du cycle 4.
    if (CYCLE_OF[recette.archipelago] === 3)
      expect(
        entries.every((e) => e.cycle === 3),
        `${bloc} cite le cycle 4`,
      ).toBe(true);
    else
      expect(
        entries.some((e) => e.cycle === 4),
        `${bloc} ne cite aucune compétence du cycle 4`,
      ).toBe(true);
  });

  it('citent des compétences déjà travaillées par une île ou le portail : la couverture du programme ne bouge pas', () => {
    const couvertes = new Set([
      ...BIOMES.flatMap((b) => b.exercises.flatMap((m) => m.programme)),
      ...APPS.flatMap((a) => a.programme ?? []),
      ...EXERCISES.flatMap((e) => e.programme ?? []),
    ]);
    expect(def().programme.filter((id) => !couvertes.has(id))).toEqual([]);
  });

  it('ont trois choix uniques dont la réponse, une aide, une question et un énoncé lu', () => {
    for (const it of def().items) {
      const ou = `${bloc} ${it.key}`;
      const choices = it.choices as string[];
      expect(choices, ou).toHaveLength(3);
      expect(new Set(choices).size, ou).toBe(3);
      expect(choices, ou).toContain(it.answer);
      expect(typeof it.prompt === 'string' && it.prompt.length > 0, ou).toBe(true);
      expect(typeof it.question === 'string' && it.question.length > 0, ou).toBe(true);
      expect(typeof it.spoken === 'string' && it.spoken.length > 0, ou).toBe(true);
      expect(typeof it.hint === 'string' && it.hint.length > 0, `${ou} : indice`).toBe(true);
      expect(typeof it.explanation === 'string' && it.explanation.length > 0, `${ou} : explication`).toBe(true);
      const aid = it.aid as { kind: string; props: { title: string; lines: string[] } } | undefined;
      expect(aid?.kind, `${ou} : aide`).toBe('rule-card');
      expect(aid!.props.lines.length, `${ou} : aide`).toBeGreaterThanOrEqual(1);
    }
  });

  it('ne lisent pas « … » à voix haute, et la question n’est pas lue deux fois', () => {
    for (const it of def().items) {
      expect(String(it.spoken), `${bloc} ${it.key}`).not.toContain('…');
      // L'écran lit la question à part : le « lu » ne lit que le document.
      expect(String(it.spoken), `${bloc} ${it.key}`).not.toContain(String(it.question));
    }
  });

  it('écrivent les apostrophes typographiques, et le message d’erreur ne cite que des champs des questions', () => {
    for (const t of textes(def())) expect(t, bloc).not.toContain("'");
    for (const v of def().feedback.wrong.matchAll(/\{(\w+)\}/g))
      expect(
        def().items.every((it) => v[1] in it),
        `{${v[1]}}`,
      ).toBe(true);
    expect(def().instruction.length).toBeGreaterThan(10);
  });

  it('rangent les nombres dans l’ordre croissant ; les phrases mélangées, la réponse autant de fois à chaque place', () => {
    for (const graine of ['a', 'b', 'c']) {
      const places = placerChoixAssemblage(def(), graine);
      expect(places.map((it) => it.key)).toEqual(def().items.map((it) => it.key));
      const phrases: number[] = [];
      places.forEach((it, i) => {
        const choices = it.choices as string[];
        // Les mêmes choix, la même réponse.
        expect([...choices].sort()).toEqual([...(def().items[i].choices as string[])].sort());
        const valeurs = valeursDesNombres(choices);
        if (valeurs) expect(valeurs, `${bloc} ${it.key}`).toEqual([...valeurs].sort((a, b) => a - b));
        else phrases.push(choices.indexOf(String(it.answer)));
      });
      // Sur les phrases du bloc, chaque place revient autant de fois (à une près).
      const compte = [0, 1, 2].map((p) => phrases.filter((x) => x === p).length);
      expect(Math.max(...compte) - Math.min(...compte), `${bloc} (${graine}) : ${compte.join(', ')}`).toBeLessThanOrEqual(1);
    }
  });
});

it('« 8 × 10⁹ » se range comme un nombre, et un millier écrit avec une espace insécable aussi', () => {
  const def: AssemblageDef = {
    id: 'assemblage-test',
    bloc: 'compound-4e',
    type: 'assembly',
    level: 1,
    instruction: 'Consigne de test.',
    programme: [],
    feedback: { correct: 'Bien.', wrong: '{explanation}' },
    items: [
      { key: 'a', choices: ['8 × 10¹²', '8 × 10⁸', '8 × 10⁹'], answer: '8 × 10⁹' },
      { key: 'b', choices: ['10 000', '40', '1 000'], answer: '1 000' },
    ],
  };
  const [a, b] = placerChoixAssemblage(def, 'x');
  expect(a.choices).toEqual(['8 × 10⁸', '8 × 10⁹', '8 × 10¹²']);
  expect(b.choices).toEqual(['40', '1 000', '10 000']);
});
