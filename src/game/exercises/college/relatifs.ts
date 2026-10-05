// Glacier des relatifs : comparer, lire, additionner, soustraire, multiplier et diviser des relatifs.
import { choices, fmt, type ItemGenerator, nonZero, par, say } from './commun';

// ---------- Glacier des relatifs ----------

/** Comparer deux relatifs. */
export const compareRelatifs: ItemGenerator = (rng) => {
  let a = nonZero(-9, 9, rng);
  let b = nonZero(-9, 9, rng);
  if (rng() < 0.5 && a > 0) a = -a;
  if (a === b) b = -b;
  const small = rng() < 0.5;
  const answer = small ? Math.min(a, b) : Math.max(a, b);
  return {
    key: `cmp-${a}-${b}-${small ? 'min' : 'max'}`,
    prompt: `Quel est le plus ${small ? 'petit' : 'grand'} : ${fmt(a)} ou ${fmt(b)} ?`,
    spoken: `Quel est le plus ${small ? 'petit' : 'grand'} : ${say(a)} ou ${say(b)} ?`,
    choices: [a, b].sort((x, y) => x - y).map(fmt),
    answer: fmt(answer),
    hint: 'Sur la droite, le plus petit est toujours à gauche. Un nombre négatif est plus petit que zéro.',
    explanation: `${fmt(answer)} est plus ${small ? 'à gauche' : 'à droite'} sur la droite : c’est le plus ${small ? 'petit' : 'grand'}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [a, b] } },
  };
};

/** Lire un relatif repéré sur la droite. */
export const readRelatif: ItemGenerator = (rng) => {
  const v = nonZero(-9, 9, rng);
  return {
    key: `read-${v}`,
    prompt: 'Quel nombre repère le point ?',
    spoken: 'Quel nombre repère le point sur la droite ?',
    choices: choices(v, [-v, v + 1, v - 1, v + 2], rng),
    answer: fmt(v),
    hint: 'Compte les graduations depuis zéro : vers la gauche, le nombre est négatif.',
    explanation: `Le point est à ${Math.abs(v)} graduation${Math.abs(v) > 1 ? 's' : ''} ${v < 0 ? 'à gauche' : 'à droite'} de zéro : ${fmt(v)}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [v] } },
  };
};

/** Addition de relatifs, avec le bond sur la droite. */
export const addRelatifs: ItemGenerator = (rng) => {
  let a = nonZero(-9, 9, rng);
  let b = nonZero(-9, 9, rng);
  // Le résultat reste sur la droite (de −10 à 10).
  while (Math.abs(a + b) > 10) {
    a = nonZero(-9, 9, rng);
    b = nonZero(-9, 9, rng);
  }
  const s = a + b;
  return {
    key: `add-${a}-${b}`,
    prompt: `${fmt(a)} + ${par(b)} = …`,
    spoken: `${say(a)} plus ${say(b)}, combien ?`,
    choices: choices(s, [a - b, -s, Math.abs(a) + Math.abs(b), s + 1, s - 1], rng),
    answer: fmt(s),
    hint: `Pars de ${fmt(a)} et fais un bond de ${Math.abs(b)} vers la ${b > 0 ? 'droite' : 'gauche'}.`,
    explanation: `De ${fmt(a)}, ${b > 0 ? 'on avance' : 'on recule'} de ${Math.abs(b)} : on arrive à ${fmt(s)}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [a, s], jump: [a, s] } },
  };
};

/** Soustraction : soustraire, c'est ajouter l'opposé. */
export const subRelatifs: ItemGenerator = (rng) => {
  let a = nonZero(-9, 9, rng);
  let b = nonZero(-9, 9, rng);
  while (Math.abs(a - b) > 10) {
    a = nonZero(-9, 9, rng);
    b = nonZero(-9, 9, rng);
  }
  const d = a - b;
  return {
    key: `sub-${a}-${b}`,
    prompt: `${fmt(a)} − ${par(b)} = …`,
    spoken: `${say(a)} moins ${say(b)}, combien ?`,
    choices: choices(d, [a + b, -d, b - a, d + 1, d - 1], rng),
    answer: fmt(d),
    hint: `Soustraire ${fmt(b)}, c’est ajouter son opposé : ${fmt(a)} + ${par(-b)}.`,
    explanation: `${fmt(a)} − ${par(b)} = ${fmt(a)} + ${par(-b)} = ${fmt(d)}.`,
    aid: { kind: 'number-line', props: { min: -10, max: 10, points: [a, d], jump: [a, d] } },
  };
};

const SIGN_RULES = [
  'Deux signes identiques : résultat positif (+ et +, − et −).',
  'Deux signes différents : résultat négatif (+ et −).',
  'Sans les signes, on multiplie comme d’habitude : 3 × 4 = 12.',
];

export const mulRelatifs: ItemGenerator = (rng) => {
  const a = nonZero(-9, 9, rng);
  let b = nonZero(2, 9, rng);
  if (rng() < 0.5) b = -b;
  const p = a * b;
  return {
    key: `mul-${a}-${b}`,
    prompt: `${par(a)} × ${par(b)} = …`,
    spoken: `${say(a)} fois ${say(b)}, combien ?`,
    choices: choices(p, [-p, a + b, p + a, p - b], rng),
    answer: fmt(p),
    hint: 'Regarde les signes d’abord, puis multiplie les nombres sans les signes.',
    explanation: `${Math.sign(a) === Math.sign(b) ? 'Signes identiques : résultat positif' : 'Signes différents : résultat négatif'}, et ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(p)}. Donc ${fmt(p)}.`,
    aid: { kind: 'rule-card', props: { title: 'Règle des signes', lines: SIGN_RULES } },
  };
};

export const divRelatifs: ItemGenerator = (rng) => {
  let q = nonZero(-9, 9, rng);
  let b = nonZero(2, 9, rng);
  if (rng() < 0.5) b = -b;
  if (Math.abs(q) === 1) q = q * 3;
  const a = q * b;
  return {
    key: `div-${a}-${b}`,
    prompt: `${par(a)} ÷ ${par(b)} = …`,
    spoken: `${say(a)} divisé par ${say(b)}, combien ?`,
    choices: choices(q, [-q, q + 1, q - 1, a - b], rng),
    answer: fmt(q),
    hint: `Cherche ${fmt(b)} × combien = ${fmt(a)}. Même règle des signes que pour la multiplication.`,
    explanation: `${par(b)} × ${par(q)} = ${fmt(a)}, donc ${fmt(a)} ÷ ${par(b)} = ${fmt(q)}.`,
    aid: { kind: 'rule-card', props: { title: 'Règle des signes', lines: SIGN_RULES } },
  };
};
