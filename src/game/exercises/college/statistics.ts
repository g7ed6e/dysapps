// Observatoire des données : moyenne, médiane, probabilités, et les relevés (effectifs, fréquences, diagrammes).
import { randomInt, shuffle } from '../../../core/random';
import { drawChoices } from '../../../core/choices';
import { choices, fmt, type ItemGenerator, MAX_TRIES, pick, type Rng, textChoices } from './common';
import { fr, type Fr, simplify, speakable, value } from './fractions';

// ---------- Observatoire des données ----------

const series = (rng: Rng, n: number, max: number) => Array.from({ length: n }, () => randomInt(1, max, rng));

export const mean: ItemGenerator = (rng) => {
  let s = series(rng, randomInt(4, 5, rng), 12);
  let sum = s.reduce((a, b) => a + b, 0);
  while (sum % s.length !== 0) {
    s = series(rng, s.length, 12);
    sum = s.reduce((a, b) => a + b, 0);
  }
  const m = sum / s.length;
  return {
    key: `mean-${s.join('-')}`,
    prompt: `Notes : ${s.join(' ; ')}. Moyenne = …`,
    spoken: `Les notes sont ${s.join(', ')}. Quelle est la moyenne ?`,
    choices: choices(m, [sum, Math.max(...s), m + 1, m - 1], rng),
    answer: fmt(m),
    hint: `Additionne tout (${sum}), puis divise par le nombre de notes (${s.length}).`,
    explanation: `${s.join(' + ')} = ${sum}, et ${sum} ÷ ${s.length} = ${m}.`,
    // Les barres seulement : la valeur repère n'est pas dessinée, sinon elle donnerait la réponse.
    aid: { kind: 'bar-list', props: { values: s } },
  };
};

export const medianRange: ItemGenerator = (rng) => {
  const s = series(rng, 5, 15).sort((a, b) => a - b);
  const med = s[2];
  const range = s[4] - s[0];
  const askRange = rng() < 0.4;
  return {
    key: `med-${s.join('-')}-${askRange ? 'r' : 'm'}`,
    prompt: `Série rangée : ${s.join(' ; ')}. ${askRange ? 'Étendue' : 'Médiane'} = …`,
    spoken: `La série rangée est ${s.join(', ')}. Quelle est ${askRange ? 'l’étendue' : 'la médiane'} ?`,
    choices: choices(askRange ? range : med, askRange ? [s[4], s[0], range + 1, med] : [s[1], s[3], (s[0] + s[4]) / 2, range].filter(Number.isInteger), rng),
    answer: fmt(askRange ? range : med),
    hint: askRange
      ? 'Étendue = plus grande valeur − plus petite valeur.'
      : 'Médiane : la valeur du milieu de la série rangée (autant de valeurs avant qu’après).',
    explanation: askRange ? `${s[4]} − ${s[0]} = ${range}.` : `Cinq valeurs rangées : la troisième, ${med}, est au milieu.`,
    aid: { kind: 'bar-list', props: { values: s } },
  };
};

export const probability: ItemGenerator = (rng) => {
  const kind = randomInt(0, 2, rng);
  if (kind === 0) {
    const red = randomInt(1, 5, rng);
    // Pas 1 rouge et 1 bleue : les pièges 1/2 et 1/2 seraient la réponse, il ne resterait que trois choix.
    const blue = randomInt(red === 1 ? 2 : 1, 5, rng);
    const total = red + blue;
    const answer = `${red}/${total}`;
    const s = (k: number) => (k > 1 ? 's' : '');
    return {
      key: `proba-urne-${red}-${blue}`,
      prompt: `Un sac contient ${red} boule${s(red)} rouge${s(red)} et ${blue} bleue${s(blue)}. Probabilité de tirer une rouge = …`,
      spoken: `Un sac contient ${red} boule${s(red)} rouge${s(red)} et ${blue} boule${s(blue)} bleue${s(blue)}. Quelle est la probabilité de tirer une rouge ?`,
      choices: textChoices(answer, [`${blue}/${total}`, `${red}/${blue}`, `1/${total}`, `${total}/${red}`], rng),
      answer,
      hint: `Cas favorables : ${red} boule${s(red)} rouge${s(red)}. Cas possibles : ${total} boules en tout.`,
      explanation: `${red} boule${s(red)} rouge${s(red)} sur ${total} boules : ${answer}.`,
      aid: {
        kind: 'rule-card',
        props: {
          title: 'Probabilité',
          lines: ['Probabilité = cas favorables / cas possibles.', 'Toujours entre 0 (impossible) et 1 (certain).', 'Un dé équilibré : chaque face a 1/6.'],
        },
      },
    };
  }
  const faces = [1, 2, 3, 4, 5, 6];
  const even = kind === 1;
  const fav = even ? faces.filter((f) => f % 2 === 0) : faces.filter((f) => f > 4);
  const answer = even ? '3/6' : '2/6';
  return {
    key: `proba-de-${even ? 'pair' : 'sup4'}`,
    prompt: `On lance un dé à 6 faces. Probabilité d’obtenir ${even ? 'un nombre pair' : 'plus de 4'} = …`,
    spoken: `On lance un dé à six faces. Quelle est la probabilité d’obtenir ${even ? 'un nombre pair' : 'plus de 4'} ?`,
    choices: textChoices(answer, ['1/6', '4/6', '5/6', even ? '2/6' : '3/6'], rng),
    answer,
    hint: `Faces qui conviennent : ${fav.join(', ')}. Faces possibles : 6.`,
    explanation: `${fav.length} face${fav.length > 1 ? 's' : ''} sur 6 : ${answer}.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Probabilité',
        lines: ['Probabilité = cas favorables / cas possibles.', 'Dé à 6 faces : 6 cas possibles.', `Faces qui conviennent ici : ${fav.join(', ')}.`],
      },
    },
  };
};

// ---------- Observatoire des données : Relevés (effectifs, fréquences, diagrammes) ----------

/** Une enquête au collège : la question posée, l'en-tête du tableau, le verbe de la question et les réponses possibles. */
export interface Survey {
  id: string;
  /** « le sport préféré » : « Enquête en 3e : le sport préféré. » */
  theme: string;
  /** L'en-tête de la colonne des réponses, dans le tableau d'effectifs. */
  column: string;
  /** « ont choisi » : « Combien d’élèves ont choisi le judo ? » */
  verb: string;
  /** Chaque réponse : l'étiquette de la barre (ou de la ligne), puis la même dans une phrase. */
  answers: [label: string, phrase: string][];
}

/** Des enquêtes du quotidien d'un collégien. Quatre réponses par diagramme : peu d'éléments à l'écran. */
export const SURVEYS: Survey[] = [
  {
    id: 'sport',
    theme: 'le sport préféré',
    column: 'Sport',
    verb: 'ont choisi',
    answers: [['Foot', 'le foot'], ['Basket', 'le basket'], ['Natation', 'la natation'], ['Danse', 'la danse'], ['Judo', 'le judo'], ['Tennis', 'le tennis']],
  },
  {
    id: 'trajet',
    theme: 'le trajet jusqu’au collège',
    column: 'Trajet',
    verb: 'viennent',
    answers: [['À pied', 'à pied'], ['Vélo', 'à vélo'], ['Bus', 'en bus'], ['Voiture', 'en voiture']],
  },
  {
    id: 'fruit',
    theme: 'le fruit préféré à la cantine',
    column: 'Fruit',
    verb: 'ont choisi',
    answers: [['Pomme', 'la pomme'], ['Banane', 'la banane'], ['Orange', 'l’orange'], ['Kiwi', 'le kiwi'], ['Poire', 'la poire']],
  },
  {
    id: 'matiere',
    theme: 'la matière préférée',
    column: 'Matière',
    verb: 'ont choisi',
    answers: [['Maths', 'les maths'], ['Français', 'le français'], ['Anglais', 'l’anglais'], ['Sciences', 'les sciences'], ['Musique', 'la musique']],
  },
];

interface Releve {
  survey: Survey;
  /** Les réponses gardées, dans l'ordre de l'enquête (l'ordre du diagramme ne change pas d'une question à l'autre). */
  rows: { label: string; phrase: string; n: number }[];
  total: number;
}

/**
 * Un relevé de quatre effectifs différents, d'au moins 2 (« 2 élèves », jamais « 1 élèves »). Sans total imposé,
 * chaque effectif va jusqu'à `max` ; avec un total, trois effectifs sont tirés et le quatrième complète, sans
 * dépasser la moitié du total (pas de barre qui écrase les autres). La réponse qui complète est tirée au hasard parmi
 * les quatre : ni la dernière barre ni la plus grande à coup sûr. Les barres restent dans l'ordre du thème.
 */
function drawReleve(rng: Rng, total?: number, max = 12): Releve {
  const survey = pick(SURVEYS, rng);
  const kept = shuffle([...survey.answers.keys()], rng)
    .slice(0, 4)
    .sort((a, b) => a - b);
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const top = total === undefined ? max : Math.floor(total / 3);
    const n = kept.map(() => randomInt(2, top, rng));
    const last = randomInt(0, 3, rng);
    if (total !== undefined) n[last] = total - n.reduce((a, v, i) => (i === last ? a : a + v), 0);
    if (n.some((v) => v < 2) || (total !== undefined && n[last] > total / 2) || new Set(n).size !== n.length) continue;
    const rows = kept.map((k, i) => ({ label: survey.answers[k][0], phrase: survey.answers[k][1], n: n[i] }));
    return { survey, rows, total: n.reduce((a, b) => a + b, 0) };
  }
  throw new Error('drawReleve : aucun relevé trouvé');
}

/** Le thème de l'enquête, en tête d'énoncé : « Enquête en 3e : le sport préféré. », lu « en troisième ». */
const intro = (survey: Survey) => `Enquête en 3e : ${survey.theme}.`;

const introSpoken = (survey: Survey) => `Enquête en troisième : ${survey.theme}.`;

const sumText = (r: Releve) => `${r.rows.map((row) => row.n).join(' + ')} = ${r.total}`;

const barList = (r: Releve) => ({ kind: 'bar-list', props: { values: r.rows.map((row) => row.n), labels: r.rows.map((row) => row.label) } });

const READ_CHART_RULES = [
  'Une barre par réponse : le nombre écrit à côté est son effectif.',
  'Effectif total : additionne les effectifs de toutes les barres, sans en oublier une.',
  'Combien de plus : le grand effectif moins le petit.',
];

/** Lire un diagramme en barres : l'effectif d'une réponse, l'effectif total, ou l'écart entre deux réponses. */
export const readChart: ItemGenerator = (rng) => {
  const r = drawReleve(rng);
  const { survey, rows, total } = r;
  const kind = randomInt(0, 2, rng);
  const aid = { kind: 'rule-card', props: { title: 'Lire un diagramme', lines: READ_CHART_RULES } };
  const base = { figure: barList(r), aid };
  const key = `rel-${survey.id}-${rows.map((row) => `${row.label}${row.n}`).join('-')}`;
  if (kind === 0) {
    const i = randomInt(0, 3, rng);
    const { label, phrase, n } = rows[i];
    const question = `Combien d’élèves ${survey.verb} ${phrase} ?`;
    return {
      ...base,
      key: `${key}-lire-${i}`,
      prompt: `${intro(survey)} ${question}`,
      spoken: `${introSpoken(survey)} ${question}`,
      // Lire la mauvaise barre.
      choices: choices(n, rows.filter((_, j) => j !== i).map((row) => row.n), rng),
      answer: fmt(n),
      hint: `Trouve la barre « ${label} » : son effectif est écrit à côté.`,
      explanation: `La barre « ${label} » porte le nombre ${n} : ${n} élèves ${survey.verb} ${phrase}.`,
    };
  }
  if (kind === 1) {
    const question = 'Quel est l’effectif total : combien d’élèves ont répondu ?';
    return {
      ...base,
      key: `${key}-total`,
      prompt: `${intro(survey)} ${question}`,
      spoken: `${introSpoken(survey)} ${question}`,
      // Une barre oubliée dans la somme, ou comptée deux fois.
      choices: choices(total, [...rows.map((row) => total - row.n), ...rows.map((row) => total + row.n)], rng),
      answer: fmt(total),
      hint: 'Additionne les effectifs des quatre barres, sans en oublier une.',
      explanation: `${sumText(r)} : ${total} élèves ont répondu.`,
    };
  }
  const [i, j] = shuffle([0, 1, 2, 3], rng).slice(0, 2);
  const [big, small] = rows[i].n > rows[j].n ? [rows[i], rows[j]] : [rows[j], rows[i]];
  const gap = big.n - small.n;
  const others = rows.filter((row) => row !== big && row !== small);
  // Les noms des barres, tels qu'ils sont écrits sur le diagramme.
  const question = `Combien d’élèves de plus pour « ${big.label} » que pour « ${small.label} » ?`;
  return {
    ...base,
    key: `${key}-ecart-${big.label}-${small.label}`,
    prompt: `${intro(survey)} ${question}`,
    spoken: `${introSpoken(survey)} ${question}`,
    choices: choices(
      gap,
      [
        // Additionner au lieu de soustraire.
        big.n + small.n,
        // Donner l'un des deux effectifs.
        big.n,
        small.n,
        // Soustraire la mauvaise barre.
        ...others.map((row) => Math.abs(big.n - row.n)),
      ].filter((t) => t > 0),
      rng,
    ),
    answer: fmt(gap),
    hint: `Lis les barres « ${big.label} » et « ${small.label} », puis enlève le petit effectif du grand.`,
    explanation: `« ${big.label} » : ${big.n} ; « ${small.label} » : ${small.n}. ${big.n} − ${small.n} = ${gap} : ${gap} élève${gap > 1 ? 's' : ''} de plus.`,
  };
};

const FREQUENCY_RULES = [
  'Effectif : le nombre d’élèves qui ont donné cette réponse.',
  'Effectif total : la somme de tous les effectifs.',
  'Fréquence = effectif ÷ effectif total. Elle est entre 0 et 1.',
  'Exemple : 3 élèves sur 10, la fréquence est 3 sur 10.',
];

/** Des effectifs totaux dont la fraction se dit en toutes lettres (« 6 vingtièmes »), jamais une classe géante. */
const FREQUENCY_TOTALS = [16, 18, 20, 24, 30];

/**
 * Pas `fractionChoices` (Icebergs) : ici, les voisins restent sur le même dénominateur (un élève de plus ou de moins),
 * et jamais la même valeur n'est proposée écrite autrement, même non simplifiée.
 * Réponses-fractions rangées de la plus petite à la plus grande : la bonne et trois pièges de valeurs différentes (une
 * seule réponse juste, jamais la même fraction écrite autrement). La place de la réponse est tirée au hasard, comme
 * avec `drawChoices`. Au-dessus de la réponse, un piège sur un autre dénominateur passe d'abord (une ligne oubliée dans
 * le total, l'effectif comparé aux autres) : sans lui, les choix donneraient l'effectif total sans le calculer. S'il
 * manque des pièges d'un côté, des voisins sur le même dénominateur (un élève de plus ou de moins).
 */
function frequencyChoices(answer: Fr, traps: Fr[], rng: Rng): string[] {
  const [n, total] = answer;
  const sameValue = (a: Fr, b: Fr) => a[0] * b[1] === b[0] * a[1];
  const picked: Fr[] = [];
  const free = (t: Fr) => !sameValue(t, answer) && !picked.some((p) => sameValue(p, t));
  // Jamais un entier écrit en fraction (20/4) : ce n'est l'erreur de personne.
  const kept = traps.filter((t, i) => speakable(t) && t[0] % t[1] !== 0 && !sameValue(t, answer) && traps.findIndex((u) => sameValue(u, t)) === i);
  const below = shuffle(
    kept.filter((t) => value(t) < value(answer)),
    rng,
  );
  const above = shuffle(
    kept.filter((t) => value(t) > value(answer)),
    rng,
  ).sort((a, b) => Number(a[1] === total) - Number(b[1] === total));
  const neighbours = (side: number): Fr[] =>
    [1, 2, 3].map((d): Fr => [n + side * d, total]).filter(([m]) => m >= 1 && m < total);
  const wanted = randomInt(0, 3, rng);
  const take = (list: Fr[], count: number) => {
    const end = picked.length + count;
    for (const t of list) if (picked.length < end && free(t)) picked.push(t);
  };
  take([...below, ...neighbours(-1)], wanted);
  take([...above, ...neighbours(1)], 3 - wanted);
  // S'il manque encore des choix (un seul élève sous la réponse), de l'autre côté.
  take([...below, ...above, ...neighbours(-1), ...neighbours(1)], 3 - picked.length);
  return [answer, ...picked].sort((a, b) => value(a) - value(b)).map(fr);
}

/** La fréquence d'une réponse, en fraction : l'effectif sur l'effectif total, lu dans un tableau. */
export const frequencyFraction: ItemGenerator = (rng) => {
  const r = drawReleve(rng, pick(FREQUENCY_TOTALS, rng));
  const { survey, rows, total } = r;
  const i = randomInt(0, 3, rng);
  const { label, phrase, n } = rows[i];
  const others = rows.filter((_, j) => j !== i);
  const answer: Fr = [n, total];
  const traps: Fr[] = [
    // Lire la mauvaise ligne.
    ...others.map((row): Fr => [row.n, total]),
    // Une ligne oubliée dans l'effectif total.
    ...others.map((row): Fr => [n, total - row.n]),
    // Comparer aux autres réponses, pas au total.
    [n, total - n],
    // Diviser le total par l'effectif.
    [total, n],
  ];
  const question = `Quelle est la fréquence des élèves qui ${survey.verb} ${phrase} ?`;
  const simple = simplify(answer);
  return {
    key: `relfreq-${survey.id}-${rows.map((row) => `${row.label}${row.n}`).join('-')}-${i}`,
    prompt: `${intro(survey)} ${question}`,
    spoken: `${introSpoken(survey)} ${question}`,
    choices: frequencyChoices(answer, traps, rng),
    answer: fr(answer),
    hint: `Additionne tous les effectifs : l’effectif total est ${total}. La fréquence, c’est l’effectif de « ${label} » sur ${total}.`,
    explanation: `Effectif total : ${sumText(r)}. « ${label} » : ${n} élèves sur ${total}, la fréquence est ${fr(answer)}${simple[1] !== total ? `, soit ${fr(simple)}` : ''}.`,
    figure: { kind: 'ratio-table', props: { cols: [survey.column, 'Effectif'], rows: rows.map((row) => [row.label, row.n]) } },
    aid: { kind: 'rule-card', props: { title: 'Effectif et fréquence', lines: FREQUENCY_RULES } },
  };
};

const PERCENT_RULES = [
  'Fréquence = effectif ÷ effectif total.',
  'En pourcentage : multiplie par 100. 0,3 donne 30 %.',
  'L’effectif n’est pas la fréquence : divise d’abord par le total.',
  'Toutes les fréquences ensemble font 100 %.',
];

/** Des effectifs totaux qui donnent des pourcentages entiers ; jamais 100, où l'effectif serait aussi le pourcentage. */
const PERCENT_TOTALS = [20, 25, 50];

const percent = (v: number) => `${fmt(v)} %`;

/** La fréquence d'une réponse en pourcentage, lue sur un diagramme en barres. */
export const frequencyPercent: ItemGenerator = (rng) => {
  const r = drawReleve(rng, pick(PERCENT_TOTALS, rng));
  const { survey, rows, total } = r;
  const i = randomInt(0, 3, rng);
  const { label, phrase, n } = rows[i];
  const p = (n * 100) / total;
  const f = n / total;
  const question = `Quelle est la fréquence des élèves qui ${survey.verb} ${phrase}, en pourcentage ?`;
  const values = drawChoices(
    p,
    [
      // L'effectif pris pour la fréquence.
      n,
      // La fréquence mal convertie : multipliée par 10, ou pas multipliée par 100.
      p / 10,
      p / 100,
      // Lire la mauvaise barre.
      ...rows.filter((_, j) => j !== i).map((row) => (row.n * 100) / total),
      // La fréquence des autres élèves.
      100 - p,
    ],
    rng,
    { step: 100 / total, neighbourOk: (v) => v > 0 && v < 100 },
  );
  return {
    key: `relpct-${survey.id}-${rows.map((row) => `${row.label}${row.n}`).join('-')}-${i}`,
    // L'effectif total est donné : l'effort porte sur le passage au pourcentage (le total est travaillé aux niveaux 1 et 2).
    prompt: `${intro(survey)} Effectif total : ${total}. ${question}`,
    spoken: `${introSpoken(survey)} L’effectif total est ${total}. ${question}`,
    choices: values.map(percent),
    answer: percent(p),
    hint: `L’effectif total est ${total}. Divise l’effectif de « ${label} » par ${total}, puis multiplie par 100.`,
    explanation: `Effectif total : ${sumText(r)}. « ${label} » : ${n} ÷ ${total} = ${fmt(f)}, et ${fmt(f)} × 100 = ${p} : la fréquence est ${percent(p)}.`,
    figure: barList(r),
    aid: { kind: 'rule-card', props: { title: 'Fréquence en pourcentage', lines: PERCENT_RULES } },
  };
};
