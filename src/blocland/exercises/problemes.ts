// Problèmes situés dans l’archipel : la mission « Carnet du passeur » de la Plaine des nombres (6e). Un pont entre deux
// falaises, un quai à clôturer, une traversée en bateau : un énoncé d’une ou deux phrases, le schéma de la situation
// (aide `scene`, voir Scene.tsx) avec ses cotes et un seul « ? », et le rappel de la méthode. Toutes les données de
// l’énoncé sont sur le schéma, sans donnée parasite ; aucune cote affichée n’est proposée comme réponse, sauf si c’est
// la réponse (et le tirage évite qu’elle le soit).
import { randomInt } from '../../core/random';
import { buildDataItems, choices, type ItemGenerator } from './college';
import { formatDuree, formatHeure, type SceneProps } from './Scene';
import type { ExerciseDef, ExerciseItem } from './types';

type Rng = () => number;

const m = (n: number): string => `${n} m`;
const minutes = (n: number): string => `${n} min`;
/** « 9 heures 40 », « 10 heures » : l’heure lue à voix haute, sans abréviation. */
const sayHeure = (t: number): string => {
  const h = Math.floor(t / 60);
  const mm = t % 60;
  return `${h} heure${h > 1 ? 's' : ''}${mm ? ` ${mm}` : ''}`;
};
/** L’heure pile, écrite « 10 h ». */
const pile = (t: number): string => `${Math.floor(t / 60)} h`;
/** Un multiple de 5 entre min et max inclus. */
const five = (min: number, max: number, rng: Rng): number => 5 * randomInt(Math.ceil(min / 5), Math.floor(max / 5), rng);

/**
 * Les quatre réponses : la bonne et trois pièges, rangés du plus petit au plus grand. Un piège n’est jamais une cote
 * affichée (`shown`), ni nul ; s’il en manque, on ajoute des voisins de dix en dix.
 */
function options(answer: number, traps: number[], shown: number[], rng: Rng, format: (n: number) => string): string[] {
  const ok = (t: number) => Number.isInteger(t) && t > 0 && t !== answer && !shown.includes(t);
  const pool = [...new Set(traps.filter(ok))];
  for (let d = 10; pool.length < 3; d += 10) for (const t of [answer + d, answer - d]) if (ok(t) && !pool.includes(t)) pool.push(t);
  return choices(answer, pool, rng, format);
}

const scene = (props: SceneProps) => ({ kind: 'scene', props });
const rule = (title: string, lines: string[]) => ({ kind: 'rule-card', props: { title, lines } });

const RULE_PONT = rule('La longueur d’un pont', [
  'Le pont, c’est toutes ses travées mises bout à bout.',
  'Pour trouver sa longueur, additionne les travées.',
]);
const RULE_RESTE = rule('Ce qui reste à poser', [
  'D’abord, additionne ce qui est déjà posé.',
  'Puis enlève-le de la longueur totale : c’est ce qui reste.',
]);
const RULE_TOUR = rule('Le tour d’un rectangle', [
  'Le périmètre, c’est la longueur du tour.',
  'Un rectangle a deux longueurs et deux largeurs.',
  'Tour : longueur + largeur + longueur + largeur.',
]);
const RULE_LARGEUR = rule('Retrouver un côté', [
  'Le tour, c’est deux longueurs et deux largeurs.',
  'Enlève les deux longueurs du tour : il reste les deux largeurs.',
  'Une largeur, c’est la moitié de ce qui reste.',
]);
const RULE_DUREE = rule('Calculer une durée', [
  'Compte du départ jusqu’à l’heure pile, puis de l’heure pile jusqu’à l’arrivée.',
  'Une heure, c’est 60 minutes, pas 100.',
]);
const RULE_ARRIVEE = rule('Trouver l’heure d’arrivée', [
  'Avance d’abord jusqu’à l’heure pile.',
  'Puis ajoute les minutes qui restent.',
  'Une heure, c’est 60 minutes, pas 100.',
]);

// ---------- Niveau 1 : une étape ----------

/** La longueur d’un pont de deux travées. */
export const pontTotal: ItemGenerator = (rng) => {
  const a = randomInt(12, 48, rng);
  let b = randomInt(12, 48, rng);
  if (b === a) b = a + 1;
  const sum = a + b;
  return {
    key: `pont-total-${a}-${b}`,
    prompt: `Le pont a deux travées : ${m(a)} et ${m(b)}. Quelle est la longueur du pont ?`,
    spoken: `Le pont a deux travées, de ${a} mètres et de ${b} mètres. Quelle est la longueur du pont ?`,
    // Pièges : la retenue oubliée ou comptée deux fois, une unité d’écart, la soustraction à la place de l’addition
    // (seulement quand l’écart n’est pas si petit qu’il en devient absurde).
    choices: options(sum, [sum - 10, sum + 10, sum - 1, sum + 1, ...(Math.abs(a - b) >= 10 ? [Math.abs(a - b)] : [])], [a, b], rng, m),
    answer: m(sum),
    hint: `Additionne les deux travées : ${a} + ${b}.`,
    explanation: `${a} + ${b} = ${sum} : le pont mesure ${m(sum)}.`,
    figure: scene({ scene: 'pont', unit: 'm', parts: [a, b], total: '?' }),
    aid: RULE_PONT,
  };
};

/** La durée d’une traversée qui ne passe pas l’heure pile. */
export const dureeHeure: ItemGenerator = (rng) => {
  const h = randomInt(8, 16, rng);
  const m1 = five(5, 30, rng);
  const d = five(15, 55 - m1, rng);
  const dep = h * 60 + m1;
  const arr = dep + d;
  const m2 = m1 + d;
  return {
    key: `duree-heure-${dep}-${d}`,
    prompt: `Le bateau part à ${formatHeure(dep)} et arrive à ${formatHeure(arr)}. Combien de temps dure la traversée ?`,
    spoken: `Le bateau part à ${sayHeure(dep)} et arrive à ${sayHeure(arr)}. Combien de temps dure la traversée ?`,
    // Pièges : les minutes de l’arrivée lues comme la durée, dix ou cinq minutes de trop ou de moins.
    choices: options(d, [m2, d + 10, d - 10, d + 5, d - 5], [], rng, minutes),
    answer: minutes(d),
    hint: `Même heure au départ et à l’arrivée : compte les minutes de ${m1} à ${m2}.`,
    explanation: `De ${formatHeure(dep)} à ${formatHeure(arr)} : ${m2} − ${m1} = ${d}. La traversée dure ${d} minutes.`,
    figure: scene({ scene: 'traversee', depart: dep, arrivee: arr, duree: '?' }),
    aid: RULE_DUREE,
  };
};

// ---------- Niveau 2 : le tour du quai, la durée qui passe l’heure ----------

/** Le périmètre d’un quai rectangulaire. */
export const quaiTour: ItemGenerator = (rng) => {
  const L = randomInt(12, 40, rng);
  const l = randomInt(5, L - 3, rng);
  const P = 2 * (L + l);
  return {
    key: `quai-tour-${L}-${l}`,
    prompt: `Le quai est un rectangle de ${m(L)} sur ${m(l)}. Quel est son périmètre, la longueur de son tour ?`,
    spoken: `Le quai est un rectangle de ${L} mètres sur ${l} mètres. Quel est son périmètre, la longueur de son tour ?`,
    // Pièges : le demi-tour, un côté oublié, l’aire à la place du périmètre (tant qu’elle reste sous 1 000).
    choices: options(P, [L + l, 2 * L + l, L + 2 * l, ...(L * l < 1000 ? [L * l] : [])], [L, l], rng, m),
    answer: m(P),
    hint: `Fais le tour : ${L} + ${l} + ${L} + ${l}.`,
    explanation: `${L} + ${l} + ${L} + ${l} = ${P} : le tour du quai mesure ${m(P)}.`,
    figure: scene({ scene: 'quai', unit: 'm', longueur: L, largeur: l, perimetre: '?', ask: 'perimetre' }),
    aid: RULE_TOUR,
  };
};

/** La durée d’une traversée qui passe l’heure pile (moins d’une heure). */
export const dureePassage: ItemGenerator = (rng) => {
  const h = randomInt(8, 16, rng);
  const m1 = five(30, 55, rng);
  const d = five(Math.max(15, 65 - m1), 55, rng);
  const dep = h * 60 + m1;
  const arr = dep + d;
  const avant = 60 - m1;
  const apres = arr % 60;
  return {
    key: `duree-passage-${dep}-${d}`,
    prompt: `Le bateau part à ${formatHeure(dep)} et arrive à ${formatHeure(arr)}. Combien de temps dure la traversée ?`,
    spoken: `Le bateau part à ${sayHeure(dep)} et arrive à ${sayHeure(arr)}. Combien de temps dure la traversée ?`,
    // Pièges : le calcul comme si une heure faisait 100 minutes, une seule des deux étapes, dix minutes d’écart.
    choices: options(d, [d + 40, avant, apres, d + 10, d - 10], [], rng, minutes),
    answer: minutes(d),
    hint: `Compte de ${formatHeure(dep)} à ${pile(arr)}, puis de ${pile(arr)} à ${formatHeure(arr)}.`,
    explanation: `De ${formatHeure(dep)} à ${pile(arr)} : ${avant} minutes. De ${pile(arr)} à ${formatHeure(arr)} : ${apres} minutes. ${avant} + ${apres} = ${d} : la traversée dure ${d} minutes.`,
    figure: scene({ scene: 'traversee', depart: dep, arrivee: arr, duree: '?' }),
    aid: RULE_DUREE,
  };
};

// ---------- Niveau 3 : deux étapes ----------

/** Ce qui reste à poser d’un pont de trois travées. */
export const pontReste: ItemGenerator = (rng) => {
  let a = 0;
  let b = 0;
  let c = 0;
  let T = 0;
  // Trois travées différentes, et ce qui reste n’est égal à aucune cote affichée.
  do {
    a = randomInt(15, 40, rng);
    b = randomInt(15, 40, rng);
    c = randomInt(10, 45, rng);
    T = a + b + c;
  } while (new Set([a, b, c]).size < 3);
  const pose = a + b;
  return {
    key: `pont-reste-${a}-${b}-${c}`,
    prompt: `Le pont doit mesurer ${m(T)}. On a posé une travée de ${m(a)} et une de ${m(b)} : combien de mètres reste-t-il à poser ?`,
    spoken: `Le pont doit mesurer ${T} mètres. On a posé une travée de ${a} mètres et une de ${b} mètres : combien de mètres reste-t-il à poser ?`,
    // Pièges : une seule travée enlevée, les deux travées additionnées sans finir, dix de plus ou de moins.
    choices: options(c, [T - a, T - b, pose, c + 10, c - 10], [a, b, T], rng, m),
    answer: m(c),
    hint: `D’abord ${a} + ${b}, puis enlève le résultat de ${T}.`,
    explanation: `Déjà posé : ${a} + ${b} = ${m(pose)}. Il reste ${T} − ${pose} = ${m(c)}.`,
    figure: scene({ scene: 'pont', unit: 'm', parts: [a, b, '?'], total: T }),
    aid: RULE_RESTE,
  };
};

/** La largeur d’un quai, à partir de son tour et de sa longueur. */
export const quaiLargeur: ItemGenerator = (rng) => {
  const L = randomInt(12, 40, rng);
  const l = randomInt(5, L - 3, rng);
  const P = 2 * (L + l);
  const traps = [P - L, P - 2 * L, P / 2];
  if (P % 4 === 0) traps.push(P / 4);
  return {
    key: `quai-largeur-${L}-${l}`,
    prompt: `Le tour du quai rectangulaire mesure ${m(P)}, et sa longueur ${m(L)}. Quelle est sa largeur ?`,
    spoken: `Le tour du quai rectangulaire mesure ${P} mètres, et sa longueur ${L} mètres. Quelle est sa largeur ?`,
    // Pièges : une seule longueur enlevée, la moitié oubliée, le demi-tour, le tour partagé en quatre comme pour un carré.
    choices: options(l, traps, [L, P], rng, m),
    answer: m(l),
    hint: `Enlève les deux longueurs du tour, puis prends la moitié.`,
    explanation: `Les deux longueurs : ${L} + ${L} = ${m(2 * L)}. Il reste ${P} − ${2 * L} = ${m(2 * l)} pour les deux largeurs. La moitié de ${2 * l}, c’est ${l} : la largeur mesure ${m(l)}.`,
    figure: scene({ scene: 'quai', unit: 'm', longueur: L, largeur: '?', perimetre: P, ask: 'perimetre' }),
    aid: RULE_LARGEUR,
  };
};

/** L’heure d’arrivée, à partir du départ et de la durée (on passe l’heure pile). */
export const arrivee: ItemGenerator = (rng) => {
  const h = randomInt(8, 16, rng);
  const m1 = five(20, 55, rng);
  const d = five(Math.max(15, 65 - m1), 55, rng);
  const dep = h * 60 + m1;
  const arr = dep + d;
  const avant = 60 - m1;
  return {
    key: `arrivee-${dep}-${d}`,
    prompt: `Le bateau part à ${formatHeure(dep)} et la traversée dure ${formatDuree(d)}. À quelle heure arrive-t-il ?`,
    spoken: `Le bateau part à ${sayHeure(dep)} et la traversée dure ${d} minutes. À quelle heure arrive-t-il ?`,
    // Pièges : l’heure pas changée, dix minutes d’écart, la durée enlevée au lieu d’être ajoutée.
    choices: options(arr, [arr - 60, arr + 10, arr - 10, dep - d], [dep], rng, formatHeure),
    answer: formatHeure(arr),
    hint: `De ${formatHeure(dep)} à ${pile(arr)}, il y a ${avant} minutes. Ajoute le reste.`,
    explanation: `De ${formatHeure(dep)} à ${pile(arr)} : ${avant} minutes. Il reste ${d} − ${avant} = ${d - avant} minutes : le bateau arrive à ${formatHeure(arr)}.`,
    figure: scene({ scene: 'traversee', depart: dep, arrivee: '?', duree: d }),
    aid: RULE_ARRIVEE,
  };
};

// ---------- La mission ----------

const PASSEUR_1 = 'Lis le schéma : le point d’interrogation montre ce que tu cherches. Calcule-le avec les nombres écrits dessus.';
const PASSEUR_2 = 'Lis le schéma. Pour le tour du quai, additionne tous les côtés ; pour la durée, passe par l’heure pile.';
const PASSEUR_3 = 'Deux calculs : d’abord ce que le schéma te permet de trouver, puis ce qui est demandé.';

function define(level: number, instruction: string, generators: ItemGenerator[]): ExerciseDef {
  const id = `plaine-passeur-${level}`;
  return {
    id,
    biome: 'plaine',
    type: 'passeur',
    level,
    instruction,
    items: buildDataItems(id, generators),
    // Chaque partie tire d’autres nombres : la graine change à chaque partie.
    generate: (seed): ExerciseItem[] => buildDataItems(seed, generators),
    feedback: { correct: 'Bien calculé !', wrong: '{explanation}' },
    reward: { block: 'brique', amount: 4, xp: 12 },
    adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
  };
}

export const PROBLEMES_EXERCISES: ExerciseDef[] = [
  define(1, PASSEUR_1, [pontTotal, dureeHeure]),
  define(2, PASSEUR_2, [quaiTour, dureePassage]),
  define(3, PASSEUR_3, [pontReste, quaiLargeur, arrivee]),
];
