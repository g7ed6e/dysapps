import { formatDuree, formatHeure, type Cote, type SceneProps } from './Scene';
import { PROBLEMES_EXERCISES } from './problemes';
import type { ExerciseItem } from './types';

const sceneOf = (it: ExerciseItem): SceneProps => {
  const figure = it.figure as { kind: string; props: SceneProps };
  expect(figure.kind).toBe('scene');
  return figure.props;
};

/** Les cotes d’un schéma : [valeur, texte affiché], la grandeur cherchée à part. */
function cotes(s: SceneProps): { shown: string[]; asked: number } {
  const shown: string[] = [];
  let asked = NaN;
  const add = (c: Cote | undefined, format: (n: number) => string, value: () => number) => {
    if (c === undefined) return;
    if (c === '?') asked = value();
    else shown.push(format(c));
  };
  const m = (n: number) => `${n} m`;
  const num = (c: Cote | undefined) => (typeof c === 'number' ? c : 0);
  if (s.scene === 'pont') {
    const known = s.parts.reduce<number>((t, p) => t + num(p), 0);
    for (const p of s.parts) add(p, m, () => num(s.total) - known);
    add(s.total, m, () => known);
  } else if (s.scene === 'quai') {
    add(s.longueur, m, () => num(s.perimetre) / 2 - num(s.largeur));
    add(s.largeur, m, () => num(s.perimetre) / 2 - num(s.longueur));
    add(s.perimetre, m, () => 2 * (num(s.longueur) + num(s.largeur)));
    if (s.entree !== undefined) shown.push(m(s.entree));
  } else if (s.scene === 'traversee') {
    add(s.depart, formatHeure, () => num(s.arrivee) - num(s.duree));
    add(s.duree, formatDuree, () => num(s.arrivee) - num(s.depart));
    add(s.arrivee, formatHeure, () => num(s.depart) + num(s.duree));
  }
  return { shown, asked };
}

const questionMarks = (s: SceneProps): number => Object.values(s).flat().filter((v) => v === '?').length;

it('Carnet du passeur : trois niveaux de huit items, un schéma et un rappel de méthode sur chacun', () => {
  expect(PROBLEMES_EXERCISES.map((e) => e.id)).toEqual(['plaine-passeur-1', 'plaine-passeur-2', 'plaine-passeur-3']);
  for (const def of PROBLEMES_EXERCISES) {
    expect(def.biome).toBe('plaine');
    expect(def.items).toHaveLength(8);
    expect(new Set(def.items.map((i) => i.key)).size).toBe(8);
    for (const it of def.items) {
      const s = sceneOf(it);
      expect(questionMarks(s)).toBe(1);
      expect(it.aid).toEqual({ kind: 'rule-card', props: expect.objectContaining({ lines: expect.any(Array) }) });
    }
  }
  // Chaque niveau mêle les scènes : pont et traversée, puis quai et traversée, puis les trois.
  const kinds = PROBLEMES_EXERCISES.map((def) => [...new Set(def.items.map((it) => sceneOf(it).scene))].sort());
  expect(kinds).toEqual([['pont', 'traversee'], ['quai', 'traversee'], ['pont', 'quai', 'traversee']]);
  // Sérialisable : rien de React dans les items.
  for (const def of PROBLEMES_EXERCISES) expect(JSON.parse(JSON.stringify(def.items))).toEqual(def.items);
});

it('Carnet du passeur : la réponse se calcule depuis les cotes, et aucune cote affichée n’est proposée', () => {
  for (const def of [...PROBLEMES_EXERCISES, ...PROBLEMES_EXERCISES.map((d) => ({ ...d, items: d.generate!('autre-partie') }))]) {
    for (const it of def.items) {
      const s = sceneOf(it);
      const { shown, asked } = cotes(s);
      const answer = String(it.answer);
      const expected = s.scene === 'traversee' && s.arrivee === '?' ? formatHeure(asked) : s.scene === 'traversee' ? formatDuree(asked) : `${asked} m`;
      expect(answer).toBe(expected);
      const choices = it.choices as string[];
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(answer);
      for (const c of shown) expect(choices).not.toContain(c);
      expect(shown).not.toContain(answer);
    }
  }
});

it('Carnet du passeur : l’énoncé dit ce que montre le schéma, sans donnée parasite, en deux phrases au plus', () => {
  for (const def of PROBLEMES_EXERCISES) {
    for (const it of def.items) {
      const prompt = String(it.prompt);
      const { shown } = cotes(sceneOf(it));
      let rest = prompt;
      for (const c of shown) {
        expect(prompt).toContain(c);
        rest = rest.replace(c, '');
      }
      expect(rest).not.toMatch(/\d/);
      expect(prompt.match(/[.?!]/g)?.length ?? 0).toBeLessThanOrEqual(2);
      expect(prompt).not.toMatch(/'/);
    }
  }
});

it('Carnet du passeur : lu à voix haute sans symbole, corrigé en refaisant le calcul, réponses rangées', () => {
  for (const def of PROBLEMES_EXERCISES) {
    expect(def.instruction).not.toMatch(/[?'…=×]/);
    for (const it of def.items) {
      const spoken = String(it.spoken);
      expect(spoken).not.toMatch(/[…=×+−']|\d\s?(h|m|min)(?!\p{L})/u);
      const explanation = String(it.explanation);
      expect(explanation).toMatch(/[+−]/);
      expect(explanation).toContain(String(it.answer).replace(/ min$/, ' minutes'));
      for (const field of ['hint', 'explanation']) expect(String(it[field])).not.toMatch(/'/);
      // Réponses dans l’ordre croissant (heures, durées ou mètres).
      const value = (c: string) => {
        const t = c.match(/^(\d+) h (\d+)$/);
        return t ? Number(t[1]) * 60 + Number(t[2]) : Number(c.replace(/\D/g, ''));
      };
      const nums = (it.choices as string[]).map(value);
      expect([...nums].sort((a, b) => a - b)).toEqual(nums);
    }
  }
});
