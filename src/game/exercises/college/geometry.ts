// Belvédère de Thalès : Pythagore, Thalès, leurs réciproques et la trigonométrie.
import { randomInt, shuffle } from '../../../core/random';
import { choices, fmt, type ItemGenerator, textChoices } from './common';

// ---------- Belvédère de Thalès ----------

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
  [12, 16, 20],
  [7, 24, 25],
  [15, 20, 25],
];

export const pythagoreHyp: ItemGenerator = (rng) => {
  const [a, b, c] = TRIPLES[randomInt(0, TRIPLES.length - 1, rng)];
  return {
    key: `pyth-h-${a}-${b}`,
    prompt: `Triangle ABC rectangle en A, AB = ${a} cm et AC = ${b} cm. BC = …`,
    spoken: `Triangle A B C rectangle en A, A B égale ${a} centimètres et A C égale ${b} centimètres. Combien mesure B C, l’hypoténuse ?`,
    choices: choices(c, [a + b, c + 1, c - 1, b * 2], rng, (n) => `${fmt(n)} cm`),
    answer: `${fmt(c)} cm`,
    hint: `BC² = AB² + AC² = ${a * a} + ${b * b}. Puis la racine carrée.`,
    explanation: `BC² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, donc BC = √${c * c} = ${c} cm.`,
    figure: { kind: 'right-triangle', props: { a, b, c: '?', labels: ['A', 'B', 'C'] } },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Pythagore',
        lines: [
          'Dans un triangle rectangle, hypoténuse² = côté² + côté².',
          'L’hypoténuse est le plus grand côté, en face de l’angle droit.',
          'Pour la trouver : additionne les carrés, puis racine carrée.',
        ],
      },
    },
  };
};

export const pythagoreSide: ItemGenerator = (rng) => {
  const [a, b, c] = TRIPLES[randomInt(0, TRIPLES.length - 1, rng)];
  return {
    key: `pyth-s-${a}-${c}`,
    prompt: `Triangle ABC rectangle en A, BC = ${c} cm et AB = ${a} cm. AC = …`,
    spoken: `Triangle A B C rectangle en A, B C égale ${c} centimètres et A B égale ${a} centimètres. Combien mesure A C ?`,
    choices: choices(b, [c + a, b + 1, b - 1, c - a], rng, (n) => `${fmt(n)} cm`),
    answer: `${fmt(b)} cm`,
    hint: `AC² = BC² − AB² = ${c * c} − ${a * a}. Puis la racine carrée.`,
    explanation: `AC² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}, donc AC = √${b * b} = ${b} cm.`,
    figure: { kind: 'right-triangle', props: { a, b: '?', c, labels: ['A', 'B', 'C'] } },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Pythagore (un côté)',
        lines: ['côté² = hypoténuse² − autre côté².', 'On soustrait, puis racine carrée.', 'L’hypoténuse BC est en face de l’angle droit A.'],
      },
    },
  };
};

export const thales: ItemGenerator = (rng) => {
  const k = [2, 3, 1.5, 2.5][randomInt(0, 3, rng)];
  const am = randomInt(2, 6, rng);
  const ab = am * k;
  // AN différent de AM : sinon AC serait AB, déjà écrit.
  let an = randomInt(2, 6, rng);
  while (an === am) an = randomInt(2, 6, rng);
  const ac = an * k;
  const f = (n: number) => n.toLocaleString('fr-FR');
  return {
    key: `thales-${am}-${k}-${an}`,
    prompt: `(MN) est parallèle à (BC). AM = ${f(am)}, AB = ${f(ab)}, AN = ${f(an)}. AC = …`,
    spoken: `M N est parallèle à B C. A M égale ${f(am)}, A B égale ${f(ab)}, A N égale ${f(an)}. Combien mesure A C ?`,
    choices: choices(ac, [an + (ab - am), ac + 1, an * 2, ab], rng, f),
    answer: f(ac),
    hint: `AM / AB = AN / AC : ${f(am)} / ${f(ab)} = ${f(an)} / AC. Le coefficient est × ${f(k)}.`,
    explanation: `AB = AM × ${f(k)}, donc AC = AN × ${f(k)} = ${f(ac)}.`,
    figure: { kind: 'thales-figure', props: { am: f(am), ab: f(ab), an: f(an), ac: '?' } },
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['petit triangle', 'grand triangle'],
        rows: [
          [f(am), f(ab)],
          [f(an), '?'],
        ],
        caption: `Coefficient : × ${f(k)}`,
      },
    },
  };
};

// ---------- Belvédère : les réciproques ----------

const SIDES = ['AB', 'AC', 'BC'] as const;

type Side = (typeof SIDES)[number];

/** Le sommet en face d'un côté : AB fait face à C, AC à B, BC à A. */
const OPPOSITE: Record<Side, string> = { AB: 'C', AC: 'B', BC: 'A' };

/** « A B » : les lettres d'un nom de segment, lues une à une. */
const letters = (s: string) => s.split('').join(' ');

/**
 * Des triangles qui ne sont pas rectangles, tout près d'un triangle rectangle connu (6, 8, 9 à côté de 6, 8, 10) :
 * l'élève qui reconnaît deux nombres d'un triplet croit le triangle rectangle. Tous sont de vrais triangles.
 */
export const NOT_RIGHT: [number, number, number][] = [
  [4, 5, 6],
  [5, 6, 8],
  [6, 8, 9],
  [6, 8, 11],
  [5, 12, 14],
  [8, 15, 16],
  [9, 12, 16],
  [10, 12, 15],
  [12, 16, 21],
  [7, 24, 26],
];

/** Les longueurs des trois côtés : le plus grand, puis les deux autres, chacun à sa place. */
function sideLengths(big: Side, c: number, [s1, a]: [Side, number], [s2, b]: [Side, number]): Record<Side, number> {
  const len: Record<Side, number> = { AB: 0, AC: 0, BC: 0 };
  len[big] = c;
  len[s1] = a;
  len[s2] = b;
  return len;
}

export const RECIPROQUE_PYTHAGORE_CHOICES = ['non', 'oui, en A', 'oui, en B', 'oui, en C'];

/**
 * Réciproque de Pythagore : trois longueurs, le triangle est-il rectangle, et en quel sommet ? Le plus grand côté est
 * tiré parmi AB, AC et BC : l'élève qui teste toujours BC² = AB² + AC² (le plus grand côté au mauvais endroit) se
 * trompe, et les sommets au bout du plus grand côté sont les pièges. Une fois sur quatre, le triangle n'est pas
 * rectangle : chacune des quatre réponses revient aussi souvent.
 */
export const reciprocalPythagore: ItemGenerator = (rng) => {
  const right = rng() < 0.75;
  const [a, b, c] = right ? TRIPLES[randomInt(0, TRIPLES.length - 1, rng)] : NOT_RIGHT[randomInt(0, NOT_RIGHT.length - 1, rng)];
  const big = SIDES[randomInt(0, 2, rng)];
  const [s1, s2] = shuffle(
    SIDES.filter((s) => s !== big),
    rng,
  );
  const len = sideLengths(big, c, [s1, a], [s2, b]);
  // Les deux autres côtés, dans l'ordre de l'énoncé.
  const [x, y] = SIDES.filter((s) => s !== big);
  const sum = len[x] ** 2 + len[y] ** 2;
  return {
    key: `recpyth-${len.AB}-${len.AC}-${len.BC}`,
    prompt: `Triangle ABC : AB = ${len.AB} cm, AC = ${len.AC} cm, BC = ${len.BC} cm. Est-il rectangle ?`,
    spoken: `Triangle A B C : A B égale ${len.AB} centimètres, A C égale ${len.AC} centimètres, B C égale ${len.BC} centimètres. Est-il rectangle ?`,
    choices: [...RECIPROQUE_PYTHAGORE_CHOICES],
    answer: right ? `oui, en ${OPPOSITE[big]}` : 'non',
    // L'indice est lu à voix haute : les opérations en mots.
    hint: `Le plus grand côté est ${big}. Compare ${c} au carré avec ${len[x]} au carré plus ${len[y]} au carré.`,
    explanation: `Le plus grand côté est ${big}. ${big}² = ${c}² = ${c * c} ; ${x}² + ${y}² = ${len[x]}² + ${len[y]}² = ${len[x] ** 2} + ${len[y] ** 2} = ${sum}. ${
      right
        ? `C’est égal : d’après la réciproque de Pythagore, ABC est rectangle en ${OPPOSITE[big]}, le sommet en face de ${big}.`
        : `${c * c} n’est pas égal à ${sum} : ABC n’est pas rectangle.`
    }`,
    // Les côtés rangés du plus petit au plus grand, avec leurs carrés : le calcul est fait, reste à comparer et à
    // trouver le sommet en face du plus grand côté.
    figure: {
      kind: 'ratio-table',
      props: {
        cols: ['côté', 'longueur', 'carré'],
        rows: [...SIDES].sort((u, v) => len[u] - len[v]).map((s) => [s, `${len[s]} cm`, String(len[s] ** 2)]),
        caption: 'Le plus grand côté est sur la dernière ligne.',
      },
    },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Réciproque de Pythagore',
        lines: [
          'Calcule le carré du plus grand côté.',
          'Calcule la somme des carrés des deux autres côtés.',
          'Égal : rectangle, l’angle droit en face du plus grand côté. Pas égal : pas rectangle.',
          'Le théorème trouve une longueur ; la réciproque dit si le triangle est rectangle.',
        ],
      },
    },
  };
};

export const PYTHAGORE_LOGIC_CHOICES = ['le théorème', 'la réciproque', 'la contraposée'];

type PythagoreForm = 'theorem' | 'converse' | 'contrapositive';

const PYTHAGORE_FORMS: PythagoreForm[] = ['theorem', 'converse', 'contrapositive'];

/**
 * Atelier du calcul littéral (4e) : le travail de logique que le programme de 2026 demande en 4e (p. 14). Un
 * raisonnement complet, ce qu'on sait puis ce qu'on conclut : est-ce le théorème, la réciproque ou la contraposée ?
 * Les trois reviennent aussi souvent ; le piège est de prendre le théorème pour sa réciproque, puisque les deux parlent
 * de la même égalité.
 */
export const pythagoreLogic: ItemGenerator = (rng) => {
  const form = PYTHAGORE_FORMS[randomInt(0, PYTHAGORE_FORMS.length - 1, rng)];
  const [a, b, c] = form === 'contrapositive' ? NOT_RIGHT[randomInt(0, NOT_RIGHT.length - 1, rng)] : TRIPLES[randomInt(0, TRIPLES.length - 1, rng)];
  const sum = a * a + b * b;
  const lengths = `AB = ${a} cm, AC = ${b} cm, BC = ${c} cm.`;
  const spokenLengths = `A B égale ${a} centimètres, A C égale ${b} centimètres, B C égale ${c} centimètres.`;
  const squares = `BC² = ${c * c} et AB² + AC² = ${a * a} + ${b * b} = ${sum}.`;
  const spokenSquares = `B C au carré égale ${c * c}, et A B au carré plus A C au carré égale ${sum}.`;
  // Ce qu'on sait, puis ce qu'on conclut : une ligne chacun, la question à part.
  const reasoning: Record<PythagoreForm, { lines: string[]; spoken: string; why: string }> = {
    theorem: {
      lines: ['ABC est rectangle en A.', 'Donc BC² = AB² + AC².'],
      spoken: 'A B C est rectangle en A. Donc B C au carré égale A B au carré plus A C au carré.',
      why: 'On part d’un triangle rectangle et on conclut l’égalité des carrés : c’est le théorème. La réciproque va dans l’autre sens, de l’égalité vers le triangle rectangle.',
    },
    converse: {
      lines: [lengths, `${squares} Les deux nombres sont égaux.`, 'Donc ABC est rectangle en A.'],
      spoken: `${spokenLengths} ${spokenSquares} Les deux nombres sont égaux. Donc A B C est rectangle en A.`,
      why: 'On part de l’égalité des carrés et on conclut que le triangle est rectangle : c’est la réciproque. Le théorème va dans l’autre sens, du triangle rectangle vers l’égalité.',
    },
    contrapositive: {
      lines: [lengths, `${squares} Les deux nombres sont différents.`, 'Donc ABC n’est pas rectangle.'],
      spoken: `${spokenLengths} ${spokenSquares} Les deux nombres sont différents. Donc A B C n’est pas rectangle.`,
      why: 'Les carrés ne sont pas égaux, donc le triangle n’est pas rectangle : c’est la contraposée. Si le triangle était rectangle, le théorème donnerait l’égalité.',
    },
  };
  const { lines, spoken, why } = reasoning[form];
  return {
    key: `logpyth-${form}-${a}-${b}-${c}`,
    question: 'Quelle propriété a servi ?',
    prompt: lines.join('\n'),
    spoken,
    choices: [...PYTHAGORE_LOGIC_CHOICES],
    answer: PYTHAGORE_LOGIC_CHOICES[PYTHAGORE_FORMS.indexOf(form)],
    hint: 'Regarde ce qu’on sait au départ, puis ce qu’on conclut à la fin.',
    explanation: why,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Pythagore : trois propriétés',
        lines: [
          'Théorème : rectangle, donc égalité des carrés.',
          'Réciproque : égalité des carrés, donc rectangle.',
          'Contraposée : pas d’égalité, donc pas rectangle.',
        ],
      },
    },
  };
};

/** Les coefficients de la réciproque de Thalès : ceux du niveau 1, et 4. */
const RECIPROQUE_K = [1.5, 2, 2.5, 3, 4];

/** Toutes les configurations aux quatre longueurs entières et différentes (AM et AN de 2 à 6), rangées selon la réponse. */
export const THALES_CASES = (() => {
  const all: { am: number; ab: number; an: number; ac: number; k1: number; k2: number }[] = [];
  for (const am of [2, 3, 4, 5, 6])
    for (const an of [2, 3, 4, 5, 6])
      for (const k1 of RECIPROQUE_K)
        for (const k2 of RECIPROQUE_K) {
          const ab = am * k1;
          const ac = an * k2;
          if (new Set([am, ab, an, ac]).size === 4 && Number.isInteger(ab) && Number.isInteger(ac)) all.push({ am, ab, an, ac, k1, k2 });
        }
  return {
    // Même coefficient : les différences (AB − AM et AC − AN) ne sont jamais égales, puisque AM et AN ne le sont pas.
    parallel: all.filter((t) => t.k1 === t.k2),
    // Coefficients différents, mais la même différence : l'élève qui compare les différences croit les droites parallèles.
    sameGap: all.filter((t) => t.k1 !== t.k2 && t.ab - t.am === t.ac - t.an),
    // Coefficients différents et proches (0,5 ou 1 d'écart).
    close: all.filter((t) => t.k1 !== t.k2 && Math.abs(t.k1 - t.k2) <= 1 && t.ab - t.am !== t.ac - t.an),
  };
})();

/**
 * Réciproque de Thalès : M sur [AB], N sur [AC], quatre longueurs ; (MN) et (BC) sont-elles parallèles ? Pièges tirés
 * des erreurs d'élèves : la même différence sans le même coefficient (conclure sur les différences), et les longueurs
 * données dans le désordre (AC avant AN), pour qui ne compare pas les rapports dans le même sens. Le tableau les range.
 */
export const reciprocalThales: ItemGenerator = (rng) => {
  const parallel = rng() < 0.5;
  const pool = parallel ? THALES_CASES.parallel : rng() < 0.5 ? THALES_CASES.sameGap : THALES_CASES.close;
  const { am, ab, an, ac, k1, k2 } = pool[randomInt(0, pool.length - 1, rng)];
  const f = (n: number) => n.toLocaleString('fr-FR');
  // Sur chaque côté, le petit segment avant le grand, ou l'inverse.
  const first: [string, number][] = rng() < 0.5 ? [['AM', am], ['AB', ab]] : [['AB', ab], ['AM', am]];
  const second: [string, number][] = rng() < 0.5 ? [['AN', an], ['AC', ac]] : [['AC', ac], ['AN', an]];
  const given = [...first, ...second];
  const sameGap = ab - am === ac - an;
  return {
    key: `recthales-${am}-${ab}-${an}-${ac}`,
    prompt: `M est sur le segment [AB] et N sur le segment [AC], avec ${given.map(([s, v]) => `${s} = ${f(v)} cm`).join(', ')}. Les droites (MN) et (BC) sont-elles parallèles ?`,
    spoken: `M est sur le segment A B et N sur le segment A C, avec ${given.map(([s, v]) => `${letters(s)} égale ${f(v)} centimètres`).join(', ')}. Les droites M N et B C sont-elles parallèles ?`,
    choices: ['non', 'oui'],
    answer: parallel ? 'oui' : 'non',
    // L'indice est lu à voix haute : la division en mots.
    hint: 'Calcule AB divisé par AM, puis AC divisé par AN : chaque fois, le grand triangle divisé par le petit.',
    explanation: `AB ÷ AM = ${f(ab)} ÷ ${f(am)} = ${f(k1)} ; AC ÷ AN = ${f(ac)} ÷ ${f(an)} = ${f(k2)}. ${
      parallel
        ? 'Le même coefficient : d’après la réciproque de Thalès, (MN) et (BC) sont parallèles.'
        : `Les coefficients sont différents : (MN) et (BC) ne sont pas parallèles.${sameGap ? ` AB − AM = AC − AN = ${f(ab - am)} cm : la même différence ne suffit pas.` : ''}`
    }`,
    figure: {
      kind: 'ratio-table',
      props: {
        cols: ['petit triangle', 'grand triangle'],
        rows: [
          [`AM = ${f(am)}`, `AB = ${f(ab)}`],
          [`AN = ${f(an)}`, `AC = ${f(ac)}`],
        ],
      },
    },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Réciproque de Thalès',
        lines: [
          'Sur chaque ligne du tableau, le coefficient : grand triangle ÷ petit triangle.',
          'Même coefficient : les droites sont parallèles.',
          'Coefficients différents : elles ne sont pas parallèles.',
          'La même différence ne suffit pas : compare les coefficients.',
        ],
      },
    },
  };
};

export const trigo: ItemGenerator = (rng) => {
  const kind = ['cos', 'sin', 'tan'][randomInt(0, 2, rng)];
  const [a, b, c] = TRIPLES[randomInt(0, 3, rng)];
  // Angle en B : côté adjacent AB = a, côté opposé AC = b, hypoténuse BC = c.
  const answer = kind === 'cos' ? `${a} / ${c}` : kind === 'sin' ? `${b} / ${c}` : `${b} / ${a}`;
  return {
    key: `trig-${kind}-${a}-${b}`,
    prompt: `Triangle ABC rectangle en A. AB = ${a}, AC = ${b}, BC = ${c}. ${kind} B̂ = …`,
    spoken: `Triangle A B C rectangle en A. A B égale ${a}, A C égale ${b}, B C égale ${c}. Que vaut ${kind === 'cos' ? 'cosinus' : kind === 'sin' ? 'sinus' : 'tangente'} de l’angle B ?`,
    choices: textChoices(answer, [`${a} / ${c}`, `${b} / ${c}`, `${b} / ${a}`, `${c} / ${a}`], rng),
    answer,
    hint: `Pour l’angle B : adjacent = AB (${a}), opposé = AC (${b}), hypoténuse = BC (${c}). ${kind === 'cos' ? 'cos = adjacent / hypoténuse' : kind === 'sin' ? 'sin = opposé / hypoténuse' : 'tan = opposé / adjacent'}.`,
    explanation: `${kind} B̂ = ${kind === 'cos' ? 'adjacent / hypoténuse' : kind === 'sin' ? 'opposé / hypoténuse' : 'opposé / adjacent'} = ${answer}.`,
    figure: { kind: 'right-triangle', props: { a, b, c, labels: ['A', 'B', 'C'], angle: 'B' } },
    aid: {
      kind: 'rule-card',
      props: {
        title: 'CAH SOH TOA',
        lines: [
          'cos = Adjacent / Hypoténuse.',
          'sin = Opposé / Hypoténuse.',
          'tan = Opposé / Adjacent.',
          'L’hypoténuse est en face de l’angle droit ; l’adjacent touche l’angle.',
        ],
      },
    },
  };
};
