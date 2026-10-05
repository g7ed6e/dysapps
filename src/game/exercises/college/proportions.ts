// Marché des proportions : quatrième proportionnelle, pourcentages, vitesse et échelle.
import { randomInt } from '../../../core/random';
import { drawChoices } from '../../../core/choices';
import { choices, fmt, type ItemGenerator } from './common';

// ---------- Marché des proportions ----------

/** Les articles du marché : le pluriel de l'énoncé et le singulier, avec son article, de l'explication. */
const GOODS: { pl: string; one: string }[] = [
  { pl: 'pommes', one: 'Une pomme' },
  { pl: 'cahiers', one: 'Un cahier' },
  { pl: 'billes', one: 'Une bille' },
  { pl: 'crêpes', one: 'Une crêpe' },
  { pl: 'stylos', one: 'Un stylo' },
  { pl: 'tomates', one: 'Une tomate' },
];

const euro = (n: number) => `${n.toLocaleString('fr-FR')} €`;

/** Quatrième proportionnelle, coefficient entier. */
export const fourthInt: ItemGenerator = (rng) => {
  const { pl: good, one } = GOODS[randomInt(0, GOODS.length - 1, rng)];
  const n1 = randomInt(2, 6, rng);
  const price = randomInt(2, 5, rng);
  const n2 = randomInt(n1 + 1, 12, rng);
  const answer = n2 * price;
  return {
    key: `fi-${good}-${n1}-${price}-${n2}`,
    prompt: `${n1} ${good} coûtent ${euro(n1 * price)}. Combien coûtent ${n2} ${good} ?`,
    spoken: `${n1} ${good} coûtent ${n1 * price} euros. Combien coûtent ${n2} ${good} ?`,
    choices: choices(answer, [n2 * price + price, n2 * price - price, n1 * price + n2, n2 + price], rng, euro),
    answer: euro(answer),
    hint: `Trouve d’abord le prix d’un seul : ${n1 * price} ÷ ${n1}. Puis multiplie par ${n2}.`,
    explanation: `${one} coûte ${euro(price)} (${n1 * price} ÷ ${n1}). ${n2} × ${price} = ${answer} : ${euro(answer)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: [good, 'prix'],
        rows: [
          [n1, euro(n1 * price)],
          [n2, '?'],
        ],
        caption: 'Tableau de proportionnalité',
      },
    },
  };
};

/** Quatrième proportionnelle par le coefficient (× 1,5 ; × 2,5) ou par le passage à l'unité non entier. */
export const fourthCoef: ItemGenerator = (rng) => {
  const k = [1.5, 2.5, 0.5, 3.5][randomInt(0, 3, rng)];
  const a = randomInt(2, 9, rng) * 2;
  const b = a * k;
  // Une autre quantité que celle de l'énoncé : sinon la réponse serait déjà écrite.
  let c = randomInt(2, 9, rng) * 2;
  while (c === a) c = randomInt(2, 9, rng) * 2;
  const answer = c * k;
  const f = (n: number) => n.toLocaleString('fr-FR');
  return {
    key: `fc-${a}-${k}-${c}`,
    prompt: `${a} kg coûtent ${euro(b)}. Combien coûtent ${c} kg ?`,
    spoken: `${a} kilos coûtent ${f(b)} euros. Combien coûtent ${c} kilos ?`,
    choices: choices(answer, [c * k + k, c + b, b + (c - a), c * 2].filter((t) => t > 0), rng, euro),
    answer: euro(answer),
    hint: `Le coefficient est ${f(k)} : on multiplie les kilos par ${f(k)} pour avoir le prix.`,
    explanation: `${b} ÷ ${a} = ${f(k)}, donc ${c} × ${f(k)} = ${f(answer)} : ${euro(answer)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['kilos', 'prix'],
        rows: [
          [a, euro(b)],
          [c, '?'],
        ],
        caption: `Coefficient : × ${f(k)}`,
      },
    },
  };
};

/** Prendre un pourcentage d'un nombre. */
export const percentOf: ItemGenerator = (rng) => {
  const p = [10, 20, 25, 50, 75, 5][randomInt(0, 5, rng)];
  const n = randomInt(2, 12, rng) * 20;
  const answer = (n * p) / 100;
  return {
    key: `pct-${p}-${n}`,
    prompt: `${p} % de ${n} = …`,
    spoken: `${p} pour cent de ${n}, combien ?`,
    choices: choices(answer, [n - answer, answer * 2, answer / 2, n / p].filter((t) => t > 0 && Number.isInteger(t * 10)), rng),
    answer: fmt(answer),
    hint: `${p} % de ${n}, c’est ${n} × ${p} ÷ 100. Astuce : 10 %, c’est diviser par 10 ; 50 %, la moitié ; 25 %, le quart.`,
    explanation: `${n} × ${p} ÷ 100 = ${answer}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['pour cent', 'valeur'],
        rows: [
          ['100 %', n],
          [`${p} %`, '?'],
        ],
      },
    },
  };
};

/** Augmenter ou baisser de p %. */
export const percentChange: ItemGenerator = (rng) => {
  const p = [10, 20, 25, 50][randomInt(0, 3, rng)];
  const n = randomInt(2, 10, rng) * 20;
  const down = rng() < 0.5;
  const delta = (n * p) / 100;
  const answer = down ? n - delta : n + delta;
  return {
    key: `chg-${p}-${n}-${down ? 'd' : 'u'}`,
    prompt: `Un article coûte ${euro(n)}. Son prix ${down ? 'baisse' : 'augmente'} de ${p} %. Nouveau prix ?`,
    spoken: `Un article coûte ${n} euros. Son prix ${down ? 'baisse' : 'augmente'} de ${p} pour cent. Quel est le nouveau prix ?`,
    choices: choices(answer, [down ? n + delta : n - delta, delta, n - p, n + p].filter((t) => t > 0), rng, euro),
    answer: euro(answer),
    hint: `Calcule d’abord ${p} % de ${n} (${delta}), puis ${down ? 'enlève' : 'ajoute'} cette somme.`,
    explanation: `${p} % de ${n} = ${delta}. ${n} ${down ? '−' : '+'} ${delta} = ${answer} : ${euro(answer)}.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['pour cent', 'euros'],
        rows: [
          ['100 %', n],
          [`${p} %`, delta],
          [`${down ? '100 − ' : '100 + '}${p} %`, '?'],
        ],
      },
    },
  };
};

/** Vitesse constante : distance pour une autre durée. */
export const speed: ItemGenerator = (rng) => {
  const v = randomInt(3, 12, rng) * 10;
  // Au moins deux heures dans l'énoncé : le passage par une heure reste une vraie étape.
  const t1 = randomInt(2, 4, rng);
  let t2 = randomInt(1, 6, rng);
  if (t2 === t1) t2 += 1;
  const answer = v * t2;
  return {
    key: `spd-${v}-${t1}-${t2}`,
    prompt: `Une voiture roule à vitesse constante : ${v * t1} km en ${t1} h. Combien de km en ${t2} h ?`,
    spoken: `Une voiture roule à vitesse constante : ${v * t1} kilomètres en ${t1} heure${t1 > 1 ? 's' : ''}. Combien de kilomètres en ${t2} heure${t2 > 1 ? 's' : ''} ?`,
    choices: choices(answer, [v * (t2 + 1), v * (t2 - 1), v * t1 + t2, v * t1 * t2].filter((t) => t > 0), rng, (n) => `${fmt(n)} km`),
    answer: `${fmt(answer)} km`,
    hint: `En 1 h : ${v * t1} ÷ ${t1} = ${v} km. Puis × ${t2}.`,
    explanation: `${v} km par heure, donc ${v} × ${t2} = ${answer} km.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['heures', 'km'],
        rows: [
          [t1, v * t1],
          [1, v],
          [t2, '?'],
        ],
      },
    },
  };
};

/** Échelle d'une carte. */
export const mapScale: ItemGenerator = (rng) => {
  const kmPerCm = [2, 5, 10, 25][randomInt(0, 3, rng)];
  const cm = randomInt(2, 9, rng);
  const answer = cm * kmPerCm;
  return {
    key: `scale-${kmPerCm}-${cm}`,
    prompt: `Sur la carte, 1 cm représente ${kmPerCm} km. Que représentent ${cm} cm ?`,
    spoken: `Sur la carte, 1 centimètre représente ${kmPerCm} kilomètres. Que représentent ${cm} centimètres ?`,
    // La distance de 1 cm, déjà écrite dans l'énoncé, n'est jamais un piège (ni un voisin).
    choices: drawChoices(answer, [cm + kmPerCm, answer + kmPerCm, answer - kmPerCm, cm * 10], rng, { ok: (t) => t > 0 && t !== kmPerCm }).map(
      (n) => `${fmt(n)} km`,
    ),
    answer: `${fmt(answer)} km`,
    hint: `Chaque centimètre vaut ${kmPerCm} km : multiplie ${cm} par ${kmPerCm}.`,
    explanation: `${cm} × ${kmPerCm} = ${answer} km.`,
    aid: {
      kind: 'ratio-table',
      props: {
        cols: ['cm sur la carte', 'km réels'],
        rows: [
          [1, kmPerCm],
          [cm, '?'],
        ],
      },
    },
  };
};
