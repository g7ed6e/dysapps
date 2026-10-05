// Phare des fonctions : images, antécédents, droites, et lire un graphique (Faisceaux).
import { randomInt } from '../../../core/random';
import { GRAPH_FRAME } from '../graph';
import { drawChoices } from '../../../core/choices';
import { choices, fmt, type ItemGenerator, nonZero, par, type Rng, say } from './commun';
import { ax, plus } from './litteral';

// ---------- Phare des fonctions ----------

export const imageOf: ItemGenerator = (rng) => {
  const a = nonZero(-4, 5, rng);
  // b non nul : jamais « f(x) = 5x + 0 ».
  const b = nonZero(-6, 8, rng);
  const x = randomInt(-3, 6, rng);
  const y = a * x + b;
  const expr = `f(x) = ${ax(a)} ${plus(b)}`;
  return {
    key: `img-${a}-${b}-${x}`,
    prompt: `${expr}. Image de ${fmt(x)} = …`,
    spoken: `f de x égale ${say(a)} x ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}. Quelle est l’image de ${say(x)} ?`,
    choices: choices(y, [a * x - b, a + b + x, -y, y + a], rng),
    answer: fmt(y),
    hint: `Remplace x par ${fmt(x)} : ${fmt(a)} × ${par(x)} ${plus(b)}.`,
    explanation: `f(${fmt(x)}) = ${fmt(a)} × ${par(x)} ${plus(b)} = ${fmt(a * x)} ${plus(b)} = ${fmt(y)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['x', 'f(x)'],
        rows: [
          [fmt(x - 1), fmt(a * (x - 1) + b)],
          [fmt(x), '?'],
          [fmt(x + 1), fmt(a * (x + 1) + b)],
        ],
        caption: 'Tableau de valeurs',
      },
    },
  };
};

export const antecedent: ItemGenerator = (rng) => {
  const a = nonZero(-3, 4, rng);
  // b non nul : jamais « f(x) = 2x + 0 ».
  const b = nonZero(-5, 5, rng);
  const x = randomInt(-3, 6, rng);
  const y = a * x + b;
  return {
    key: `ant-${a}-${b}-${x}`,
    prompt: `f(x) = ${ax(a)} ${plus(b)}. Antécédent de ${fmt(y)} = …`,
    spoken: `f de x égale ${say(a)} x ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}. Quel est l’antécédent de ${say(y)} ?`,
    choices: choices(x, [y, -x, x + 1, x - 1], rng),
    answer: fmt(x),
    hint: `Résous ${ax(a)} ${plus(b)} = ${fmt(y)} : ${b < 0 ? `ajoute ${-b}` : `enlève ${b}`}, puis divise par ${fmt(a)}.`,
    explanation: `${ax(a)} = ${fmt(y)} ${plus(-b)} = ${fmt(y - b)}, donc x = ${fmt(y - b)} ÷ ${par(a)} = ${fmt(x)}.`,
    aid: { kind: 'ratio-table', props: { cols: ['x', 'f(x)'], rows: [['?', fmt(y)]], caption: 'On cherche x tel que f(x) = ' + fmt(y) } },
  };
};

export const linearOrAffine: ItemGenerator = (rng) => {
  const a = nonZero(-4, 5, rng);
  const b = rng() < 0.4 ? 0 : nonZero(-6, 6, rng);
  const expr = b === 0 ? `f(x) = ${ax(a)}` : `f(x) = ${ax(a)} ${plus(b)}`;
  const askCoef = rng() < 0.5;
  if (askCoef) {
    return {
      key: `coef-${a}-${b}`,
      prompt: `${expr}. Coefficient directeur = …`,
      spoken: `f de x égale ${say(a)} x${b === 0 ? '' : ` ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}`}. Quel est le coefficient directeur ?`,
      choices: choices(a, [b, -a, a + b, 1], rng),
      answer: fmt(a),
      hint: 'Le coefficient directeur est le nombre devant x.',
      explanation: `Dans ${expr}, le nombre devant x est ${fmt(a)}.`,
      aid: {
        kind: 'rule-card',
        props: {
          title: 'Linéaire, affine',
          lines: [
            'f(x) = ax : fonction linéaire (droite qui passe par l’origine).',
            'f(x) = ax + b : fonction affine (a = coefficient directeur, b = ordonnée à l’origine).',
            'a positif : la droite monte. a négatif : elle descend.',
          ],
        },
      },
    };
  }
  // Une fonction linéaire est aussi affine : on demande seulement si elle est linéaire (une seule réponse juste).
  const answer = b === 0 ? 'oui' : 'non';
  return {
    key: `kind-${a}-${b}`,
    prompt: `${expr}. Est-elle linéaire ?`,
    spoken: `f de x égale ${say(a)} x${b === 0 ? '' : ` ${b < 0 ? 'moins' : 'plus'} ${Math.abs(b)}`}. Cette fonction est-elle linéaire ?`,
    choices: ['non', 'oui'],
    answer,
    hint: 'Linéaire : f(x) = ax, rien d’ajouté. Si on ajoute un nombre b non nul, elle est affine, mais pas linéaire.',
    explanation:
      b === 0
        ? `${expr} est de la forme ax : oui, elle est linéaire.`
        : `${expr} est de la forme ax + b avec b = ${fmt(b)} : non, elle est affine, mais pas linéaire.`,
    aid: {
      kind: 'rule-card',
      props: {
        title: 'Linéaire, affine',
        lines: [
          'f(x) = ax : fonction linéaire (droite qui passe par l’origine).',
          'f(x) = ax + b : fonction affine (a = coefficient directeur, b = ordonnée à l’origine).',
          'Une fonction linéaire est aussi affine, avec b = 0.',
        ],
      },
    },
  };
};

// ---------- Phare des fonctions : lire un graphique (Faisceaux) ----------

export { GRAPH_FRAME };

/** Un point lu reste dans le cadre, à au moins une graduation du bord. */
const inside = (v: number) => Math.abs(v) <= 3;

/** Un nombre que l'on peut lire sur un axe du graphique. */
const onAxis = (v: number) => Number.isInteger(v) && Math.abs(v) <= 4;

/**
 * Les réponses d'une lecture de graphique : la bonne et trois pièges, rangées. Jamais l'opposé de la réponse (un
 * piège qui ne différerait que par le signe) ; un piège qui ne se lit pas sur un axe du graphique est écarté. Un
 * coefficient directeur se compte en carreaux : de −5 à 5, jamais 0 (une droite horizontale, que le graphique ne montre
 * jamais).
 */
export function graphChoices(answer: number, traps: number[], rng: Rng, coefficient = false): string[] {
  const readable = (t: number) => (coefficient ? Number.isInteger(t) && t !== 0 && Math.abs(t) <= 5 : onAxis(t));
  const pool: number[] = [];
  for (const t of traps) if (readable(t) && t !== answer && t !== -answer && !pool.includes(t)) pool.push(t);
  // Les voisins aussi : lisibles sur un axe, jamais l'opposé de la réponse.
  const ok = (t: number) => readable(t) && t !== -answer;
  return drawChoices(answer, pool, rng, { ok, neighbourOk: ok }).map(fmt);
}

const graphFigure = (a: number, b: number) => ({ kind: 'graph', props: { a, b, ...GRAPH_FRAME } });

/** Une fonction affine à coefficients entiers : a de −3 à 3 (jamais 0), b de −3 à 3. */
const drawAffine = (rng: Rng): { a: number; b: number } => ({ a: nonZero(-3, 3, rng), b: randomInt(-3, 3, rng) });

/** Un point lu sur la droite : x non nul, dans le cadre ; f(x) dans le cadre, différent de x (une lecture sur le mauvais axe se voit). */
function drawReading(rng: Rng, imageNotZero: boolean): { a: number; b: number; x: number; y: number } {
  for (;;) {
    const { a, b } = drawAffine(rng);
    const x = nonZero(-3, 3, rng);
    const y = a * x + b;
    if (inside(y) && y !== x && !(imageNotZero && y === 0)) return { a, b, x, y };
  }
}

const point = (x: number, y: number) => `(${fmt(x)} ; ${fmt(y)})`;

export const READ_IMAGE_RULES = [
  'L’image de x se lit sur l’axe vertical. Ses nombres sont écrits à gauche.',
  'Pars de x, écrit en bas, monte ou descends jusqu’à la droite.',
  'Puis va à l’horizontale et lis le nombre en face, à gauche.',
  'Le point (5 ; 7) veut dire : l’image de 5 est 7, f(5) = 7.',
];

export const READ_ANTECEDENT_RULES = [
  'L’antécédent se lit sur l’axe horizontal. Ses nombres sont écrits en bas.',
  'Pars du nombre écrit à gauche, va à l’horizontale jusqu’à la droite.',
  'Puis monte ou descends jusqu’en bas et lis le nombre.',
  'Le point (5 ; 7) veut dire : 5 est un antécédent de 7.',
];

export const READ_LINE_RULES = [
  'f(x) = ax + b : b est l’ordonnée à l’origine, a le coefficient directeur.',
  'b : là où la droite coupe l’axe vertical ; lis le nombre en face, à gauche.',
  'a : quand x augmente de 1, compte les carreaux que la droite monte ou descend.',
  'La droite monte : a est positif. Elle descend : a est négatif.',
];

/** Lire l'image d'un nombre sur le graphique. */
export const graphImage: ItemGenerator = (rng) => {
  // Une image non nulle : ses voisins 1 et −1 ne seraient que des opposés.
  const { a, b, x, y } = drawReading(rng, true);
  const notation = rng() < 0.5;
  return {
    key: `graph-img-${a}-${b}-${x}`,
    prompt: notation ? `f(${fmt(x)}) = …` : `Image de ${fmt(x)} par f = …`,
    spoken: notation ? `Lis sur le graphique : combien vaut f de ${say(x)} ?` : `Lis sur le graphique : quelle est l’image de ${say(x)} par f ?`,
    choices: graphChoices(
      y,
      [
        // Les axes inversés : le nombre cherché sur l'axe vertical, puis son abscisse (son antécédent).
        (x - b) / a,
        // Le nombre de départ, lu sur l'axe horizontal.
        x,
        // Le point voisin de la droite.
        a * (x + 1) + b,
        a * (x - 1) + b,
        // Une graduation de trop ou de moins.
        y + 1,
        y - 1,
      ],
      rng,
    ),
    answer: fmt(y),
    hint: `Pars de ${fmt(x)}, écrit en bas, monte ou descends jusqu’à la droite, puis lis le nombre en face, à gauche.`,
    explanation: `La droite passe par le point ${point(x, y)} : pour x = ${fmt(x)}, on lit ${fmt(y)} sur l’axe vertical. L’image de ${fmt(x)} est ${fmt(y)}.`,
    figure: graphFigure(a, b),
    aid: { kind: 'rule-card', props: { title: 'Lire une image', lines: READ_IMAGE_RULES } },
  };
};

/** Lire un antécédent sur le graphique. */
export const graphAntecedent: ItemGenerator = (rng) => {
  const { a, b, x, y } = drawReading(rng, false);
  return {
    key: `graph-ant-${a}-${b}-${x}`,
    // Une seule écriture : « f(x) = 3. x = … » mettrait deux signes égal sur une ligne.
    prompt: `Antécédent de ${fmt(y)} par f = …`,
    spoken: `Lis sur le graphique : quel est l’antécédent de ${say(y)} par f ?`,
    choices: graphChoices(
      x,
      [
        // Les axes inversés : l'image du nombre donné.
        a * y + b,
        // Le nombre donné, lu sur l'axe vertical.
        y,
        // Le point voisin, une graduation à côté.
        x + 1,
        x - 1,
      ],
      rng,
    ),
    answer: fmt(x),
    hint: `Pars de ${fmt(y)}, écrit à gauche, va à l’horizontale jusqu’à la droite, puis monte ou descends jusqu’en bas et lis le nombre.`,
    explanation: `La droite passe par le point ${point(x, y)} : pour f(x) = ${fmt(y)}, on lit ${fmt(x)} sur l’axe horizontal. L’antécédent de ${fmt(y)} est ${fmt(x)}.`,
    figure: graphFigure(a, b),
    aid: { kind: 'rule-card', props: { title: 'Lire un antécédent', lines: READ_ANTECEDENT_RULES } },
  };
};

/** Lire l'ordonnée à l'origine ou le coefficient directeur d'une droite. */
export const graphLine: ItemGenerator = (rng) => {
  const askCoef = rng() < 0.5;
  let { a, b } = drawAffine(rng);
  // L'ordonnée à l'origine demandée n'est pas 0 ; le coefficient se lit d'un point à l'autre, dans le cadre.
  while (askCoef ? !(inside(a + b) || inside(b - a)) : b === 0) ({ a, b } = drawAffine(rng));
  const expr = b === 0 ? `f(x) = ${ax(a)}` : `f(x) = ${ax(a)} ${plus(b)}`;
  const figure = graphFigure(a, b);
  const aid = { kind: 'rule-card', props: { title: 'Lire une droite', lines: READ_LINE_RULES } };
  if (!askCoef) {
    return {
      key: `graph-b-${a}-${b}`,
      prompt: 'Ordonnée à l’origine = …',
      spoken: 'Lis sur le graphique : quelle est l’ordonnée à l’origine de la droite ?',
      choices: graphChoices(
        b,
        [
          // L'autre axe : là où la droite coupe l'axe horizontal.
          -b / a,
          // Le coefficient directeur.
          a,
          // Le point d'abscisse 1 au lieu de 0.
          a + b,
          // Une graduation de trop ou de moins.
          b + 1,
          b - 1,
        ],
        rng,
      ),
      answer: fmt(b),
      hint: 'Regarde où la droite coupe l’axe vertical, puis lis le nombre en face, à gauche.',
      explanation: `La droite coupe l’axe vertical au point ${point(0, b)} : l’ordonnée à l’origine est ${fmt(b)}. Ici, ${expr}.`,
      figure,
      aid,
    };
  }
  // Le pas lu : de x = 0 à x = 1, ou de x = −1 à x = 0 si le point d'abscisse 1 sort du cadre.
  const from = inside(a + b) ? 0 : -1;
  const [p, q] = [a * from + b, a * (from + 1) + b];
  return {
    key: `graph-a-${a}-${b}`,
    prompt: 'Coefficient directeur = …',
    spoken: 'Lis sur le graphique : quel est le coefficient directeur de la droite ?',
    choices: graphChoices(
      a,
      [
        // L'ordonnée à l'origine.
        b,
        // L'ordonnée du point d'arrivée, et pas la montée.
        q,
        // Un carreau compté en trop ou oublié.
        a + 1,
        a - 1,
      ],
      rng,
      true,
    ),
    answer: fmt(a),
    hint: `Pars du point ${point(from, p)}, fais augmenter x de 1 (un carreau), puis compte les carreaux jusqu’à la droite, en haut ou en bas.`,
    explanation: `De ${point(from, p)} à ${point(from + 1, q)}, x augmente de 1 et f(x) ${a > 0 ? 'monte' : 'descend'} de ${Math.abs(a)} : le coefficient directeur est ${fmt(a)}. Ici, ${expr}.`,
    figure,
    aid,
  };
};
