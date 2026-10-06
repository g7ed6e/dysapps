import { formatDuree, formatHeure, formatNombre, type Side, type SceneProps } from './Scene';
import { PROBLEMES_COLLEGE_EXERCISES, PROBLEMES_EXERCISES } from './problems';
import type { ExerciseDef, ExerciseItem } from './types';

const ALL = [...PROBLEMES_EXERCISES, ...PROBLEMES_COLLEGE_EXERCISES];

const sceneOf = (it: ExerciseItem): SceneProps => {
  const figure = it.figure as { kind: string; props: SceneProps };
  expect(figure.kind).toBe('scene');
  return figure.props;
};

const withUnit = (u: string) => (n: number) => `${formatNombre(n)} ${u}`;
const num = (c: Side | null | undefined) => (typeof c === 'number' ? c : 0);

/**
 * Ce que montre un schéma : les cotes affichées (texte), les autres données écrites dans l’énoncé (échelle, ratio),
 * et la réponse attendue, recalculée depuis les cotes.
 */
function read(s: SceneProps): { shown: string[]; data: string[]; answer: string } {
  const shown: string[] = [];
  const data: string[] = [];
  let answer = '';
  const add = (c: Side | null | undefined, format: (n: number) => string, value: () => number) => {
    if (c === undefined || c === null) return;
    if (c === '?') answer = format(Math.round(value() * 1000) / 1000);
    else shown.push(format(c));
  };
  const m = withUnit('m');
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
  } else if (s.scene === 'carte') {
    // Ce que vaut 1 cm de carte, dans l’unité de la distance réelle.
    const e = s.echelle;
    const perCm = 'fraction' in e ? e.fraction / (s.unitReel === 'km' ? 100000 : 100) : e.reel * (e.unit === s.unitReel ? 1 : e.unit === 'km' ? 1000 : 0.001);
    if ('fraction' in e) data.push(`1/${formatNombre(e.fraction)}`);
    else {
      data.push('1 cm');
      shown.push(withUnit(e.unit)(e.reel));
    }
    add(s.carte, withUnit('cm'), () => num(s.reel) / perCm);
    add(s.reel, withUnit(s.unitReel), () => num(s.carte) * perCm);
  } else if (s.scene === 'cargaison') {
    const sum = s.ratio.reduce((a, b) => a + b, 0);
    const i = s.parts.findIndex((p) => typeof p === 'number');
    const one = typeof s.total === 'number' ? s.total / sum : num(s.parts[i]) / s.ratio[i];
    expect(Number.isInteger(one)).toBe(true);
    const out = s.unit === 'kg' ? withUnit('kg') : withUnit('caisses');
    s.parts.forEach((p, k) => add(p, out, () => s.ratio[k] * one));
    add(s.total, out, () => sum * one);
    data.push(s.ratio.join(' : '));
  } else if (s.scene === 'route') {
    const heures = num(s.duree) / 60;
    add(s.distance, withUnit('km'), () => num(s.vitesse) * heures);
    add(s.vitesse, withUnit('km/h'), () => num(s.distance) / heures);
    // La durée s’affiche « 1 h 30 min » ; cherchée, elle se donne en minutes.
    if (s.duree === '?') answer = `${Math.round((num(s.distance) / num(s.vitesse)) * 60)} min`;
    else shown.push(formatDuree(s.duree));
  } else if (s.scene === 'ombre') {
    add(s.baton, m, () => (num(s.hauteur) * num(s.ombreBaton)) / num(s.ombre));
    add(s.ombreBaton, m, () => (num(s.ombre) * num(s.baton)) / num(s.hauteur));
    add(s.hauteur, m, () => (num(s.baton) * num(s.ombre)) / num(s.ombreBaton));
    add(s.ombre, m, () => (num(s.ombreBaton) * num(s.hauteur)) / num(s.baton));
  } else {
    add(s.hauteur, m, () => Math.sqrt(num(s.cable) ** 2 - num(s.pied) ** 2));
    add(s.pied, m, () => Math.sqrt(num(s.cable) ** 2 - num(s.hauteur) ** 2));
    add(s.cable, m, () => Math.sqrt(num(s.hauteur) ** 2 + num(s.pied) ** 2));
  }
  return { shown, data, answer };
}

const questionMarks = (s: SceneProps): number => Object.values(s).flat().filter((v) => v === '?').length;
/** « 9 h 40 » en minutes, « 1 500 m » ou « 0,75 km » en nombre. */
const value = (c: string): number => {
  const t = c.match(/^(\d+) h (\d+)$/);
  return t ? Number(t[1]) * 60 + Number(t[2]) : parseFloat(c.replace(/[\s ]/g, '').replace(',', '.'));
};
const kindsOf = (defs: ExerciseDef[]) => defs.map((def) => [...new Set(def.items.map((it) => sceneOf(it).scene))].sort());

it('les missions de problèmes situés : des niveaux de huit items, un schéma et un rappel de méthode sur chacun', () => {
  expect(PROBLEMES_EXERCISES.map((e) => e.id)).toEqual(['maths-6e-calculation-word-problems-1', 'maths-6e-calculation-word-problems-2', 'maths-6e-calculation-word-problems-3']);
  expect(PROBLEMES_COLLEGE_EXERCISES.map((e) => e.id)).toEqual([
    'maths-5e-proportionality-proportion-tables-3',
    'maths-5e-proportionality-ratios-3',
    'maths-5e-proportionality-ratios-4',
    'maths-3e-geometry-pythagoras-3',
    'maths-3e-geometry-thales-2',
  ]);
  for (const def of ALL) {
    expect(def.items).toHaveLength(8);
    expect(new Set(def.items.map((i) => i.key)).size).toBe(8);
    for (const it of def.items) {
      expect(questionMarks(sceneOf(it))).toBe(1);
      expect(it.aid).toEqual({ kind: 'rule-card', props: expect.objectContaining({ lines: expect.any(Array) }) });
    }
    // Sérialisable : rien de React dans les items.
    expect(JSON.parse(JSON.stringify(def.items))).toEqual(def.items);
  }
  // Chaque niveau mêle les scènes prévues.
  expect(kindsOf(PROBLEMES_EXERCISES)).toEqual([['pont', 'traversee'], ['quai', 'traversee'], ['pont', 'quai', 'traversee']]);
  expect(kindsOf(PROBLEMES_COLLEGE_EXERCISES)).toEqual([['cargaison'], ['carte'], ['route'], ['mat'], ['ombre']]);
  // Les Étals : deux et trois navires, le total connu ou non ; les Balances : l’échelle en mots et en fraction.
  const etals = PROBLEMES_COLLEGE_EXERCISES[0].items.map(sceneOf);
  expect(etals.some((s) => s.scene === 'cargaison' && s.ratio.length === 3)).toBe(true);
  expect(etals.some((s) => s.scene === 'cargaison' && s.total === null)).toBe(true);
  const balances = PROBLEMES_COLLEGE_EXERCISES[1].items.map(sceneOf);
  expect(balances.some((s) => s.scene === 'carte' && 'fraction' in s.echelle)).toBe(true);
  expect(balances.some((s) => s.scene === 'carte' && 'reel' in s.echelle)).toBe(true);
  // La traversée : chercher la distance, la vitesse et la durée.
  const route = PROBLEMES_COLLEGE_EXERCISES[2].items.map(sceneOf);
  for (const key of ['distance', 'vitesse', 'duree'] as const) expect(route.some((s) => s.scene === 'route' && s[key] === '?')).toBe(true);
  // L’ombre : chercher la hauteur du mât et la longueur de son ombre.
  const ombre = PROBLEMES_COLLEGE_EXERCISES[4].items.map(sceneOf);
  for (const key of ['hauteur', 'ombre'] as const) expect(ombre.some((s) => s.scene === 'ombre' && s[key] === '?')).toBe(true);
});

it('problèmes situés : la réponse se calcule depuis les cotes, et aucune cote affichée n’est proposée', () => {
  for (const def of [...ALL, ...ALL.map((d) => ({ ...d, items: d.generate!('autre-partie') }))]) {
    for (const it of def.items) {
      const { shown, answer } = read(sceneOf(it));
      expect(String(it.answer)).toBe(answer);
      const choices = it.choices as string[];
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(answer);
      for (const c of shown) expect(choices).not.toContain(c);
      expect(shown).not.toContain(answer);
      // Réponses dans l’ordre croissant (heures, durées, longueurs, parts).
      const nums = choices.map(value);
      expect(nums.every((n) => Number.isFinite(n) && n > 0)).toBe(true);
      expect([...nums].sort((a, b) => a - b)).toEqual(nums);
    }
  }
});

it('problèmes situés : l’énoncé dit ce que montre le schéma, sans donnée parasite, en deux phrases au plus', () => {
  for (const def of ALL) {
    for (const it of def.items) {
      // L’échelle « 1 / 25 000 » de l’énoncé (espaces insécables, pour que RichText ne la coupe pas) est « 1/25 000 » sur le schéma.
      const prompt = String(it.prompt).replace(/\u00a0\/\u00a0/g, '/');
      const { shown, data } = read(sceneOf(it));
      let rest = prompt;
      // Les plus longues d’abord : « 500 m » ne doit pas mordre dans « 1500 m ».
      for (const c of [...shown, ...data].sort((x, y) => y.length - x.length)) {
        expect(prompt).toMatch(new RegExp(`(^|[^\\d])${c}`));
        rest = rest.replace(new RegExp(`(^|[^\\d])${c}`), '$1');
      }
      expect(rest).not.toMatch(/\d/);
      expect(prompt.match(/[.?!]/g)?.length ?? 0).toBeLessThanOrEqual(2);
      expect(prompt).not.toMatch(/'/);
    }
  }
});

it('problèmes situés : lu à voix haute sans symbole, corrigé en refaisant le calcul', () => {
  for (const def of ALL) {
    expect(def.instruction).not.toMatch(/[?'…=×]/);
    for (const it of def.items) {
      const spoken = String(it.spoken);
      // Ni symbole, ni unité abrégée, ni ratio écrit avec deux-points, ni fraction avec une barre.
      expect(spoken).not.toMatch(/[…=×÷+−'/²√]|\d\s?(h|m|min|cm|km|kg)(?!\p{L})|\d : \d/u);
      // Le ratio se dit comme dans le schéma : « 3 pour 4 », « 1, 2 et 3 ».
      const s = sceneOf(it);
      if (s.scene === 'cargaison') expect(spoken).toContain(`ratio ${s.ratio.length > 2 ? `${s.ratio.slice(0, -1).join(', ')} et ${s.ratio.at(-1)}` : s.ratio.join(' pour ')}`);
      const explanation = String(it.explanation);
      expect(explanation).toMatch(/[+−×÷]/);
      expect(explanation).toContain(String(it.answer).replace(/ min$/, ' minutes'));
      for (const field of ['hint', 'explanation']) expect(String(it[field])).not.toMatch(/'/);
    }
  }
});
