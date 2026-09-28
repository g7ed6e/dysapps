// Problèmes situés dans l’archipel : la mission « Carnet du passeur » de la Plaine des nombres (6e), avec un pont entre deux
// falaises, un quai à clôturer, une traversée en bateau ; au Marché des proportions (5e), le niveau 3 des Balances (une
// carte à l’échelle) et celui des Étals (une cargaison partagée selon un ratio) ; le niveau 3 de Pythagore au Belvédère
// (3e), avec un mât tenu par un câble. Pour chaque item : un énoncé d’une ou deux phrases, le schéma de la situation
// (aide `scene`, voir Scene.tsx) avec ses cotes et un seul « ? », et le rappel de la méthode. Toutes les données de
// l’énoncé sont sur le schéma, sans donnée parasite ; aucune cote affichée n’est proposée comme réponse, sauf si c’est
// la réponse (et le tirage évite qu’elle le soit).
import { randomInt } from '../../core/random';
import { drawChoices } from '../../core/choices';
import { buildDataItems, type ItemGenerator } from './college';
import { formatDuree, formatHeure, formatNombre, type SceneProps } from './Scene';
import type { ExerciseDef, ExerciseItem } from './types';

type Rng = () => number;

const m = (n: number): string => `${formatNombre(n)} m`;
/** Un nombre avec son unité, écrit comme sur le schéma : « 1 500 m », « 0,5 km », « 16 caisses ». */
const unit = (u: string) => (n: number): string => `${formatNombre(n)} ${u}`;
const SPOKEN_UNIT: Record<string, string> = { m: 'mètres', km: 'kilomètres', cm: 'centimètres', kg: 'kilos', caisses: 'caisses' };
/** Le même, lu à voix haute : « 1 500 mètres ». */
const say = (n: number, u: string): string => `${formatNombre(n)} ${SPOKEN_UNIT[u] ?? u}`;
/** Arrondi qui efface les erreurs de virgule flottante (0,1 × 3). */
const round = (n: number): number => Math.round(n * 1000) / 1000;
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
 * Les quatre réponses : la bonne et trois pièges, rangés du plus petit au plus grand, la place de la réponse tirée au
 * hasard (voir `drawChoices`). Un piège n’est jamais une cote affichée (`shown`), ni nul ; s’il en manque d’un côté,
 * on y ajoute des voisins, de `step` en `step` (dix mètres, cinq minutes, une part…).
 */
function options(answer: number, traps: number[], shown: number[], rng: Rng, format: (n: number) => string, step: number | null = 10): string[] {
  const ok = (t: number) => Number.isFinite(t) && t > 0 && !shown.includes(t);
  // `step` nul : pas de voisin (une erreur de conversion n’a pas de « voisin » plausible).
  return drawChoices(answer, traps.map(round), rng, { step: step ?? 1, ok, neighbourOk: step === null ? () => false : ok }).map(format);
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
    choices: options(d, [m2, d + 10, d - 10, d + 5, d - 5], [], rng, minutes, 5),
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
    choices: options(d, [d + 40, avant, apres, d + 10, d - 10], [], rng, minutes, 5),
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
    choices: options(arr, [arr - 60, arr + 10, arr - 10, dep - d], [dep], rng, formatHeure, 5),
    answer: formatHeure(arr),
    hint: `De ${formatHeure(dep)} à ${pile(arr)}, il y a ${avant} minutes. Ajoute le reste.`,
    explanation: `De ${formatHeure(dep)} à ${pile(arr)} : ${avant} minutes. Il reste ${d} − ${avant} = ${d - avant} minutes : le bateau arrive à ${formatHeure(arr)}.`,
    figure: scene({ scene: 'traversee', depart: dep, arrivee: '?', duree: d }),
    aid: RULE_ARRIVEE,
  };
};

// ---------- Marché des proportions : la carte (Balances) et la cargaison (Étals), niveau 3 (5e) ----------

const RULE_ECHELLE = rule('Une échelle', [
  'Sur la carte, chaque centimètre représente la même distance en vrai.',
  'De la carte au vrai : multiplie par ce que vaut 1 cm.',
  'Du vrai à la carte : divise par ce que vaut 1 cm.',
]);
const RULE_ECHELLE_FRACTION = rule('Une échelle en fraction', [
  'À l’échelle 1/50 000, 1 cm sur la carte, c’est 50 000 cm en vrai.',
  'Multiplie d’abord : la distance en vrai est en centimètres.',
  'Puis convertis : 1 m = 100 cm, 1 km = 100 000 cm.',
]);
const RULE_RATIO = rule('Partager selon un ratio', [
  'Ratio 2 : 3 : le navire A a 2 parts, le navire B en a 3, toutes égales.',
  'Trouve d’abord ce que vaut une part.',
  'Puis multiplie par le nombre de parts du navire.',
]);

const SHIPS = ['A', 'B', 'C'];
/** « A et B », « A, B et C ». */
const shipList = (n: number): string => (n === 2 ? 'A et B' : 'A, B et C');
/** Le ratio lu à voix haute, comme le dit le schéma : « 3 pour 4 », « 1, 2 et 3 ». */
const sayRatio = (r: readonly number[]): string => (r.length > 2 ? `${r.slice(0, -1).join(', ')} et ${r[r.length - 1]}` : r.join(' pour '));
/** Ce qu’on partage : des caisses, ou des kilos de riz. */
const CARGO = {
  caisses: { what: (n: number) => `${formatNombre(n)} caisses`, said: (n: number) => `${formatNombre(n)} caisses`, ask: 'Combien de caisses' },
  kg: { what: (n: number) => `${formatNombre(n)} kg de riz`, said: (n: number) => `${formatNombre(n)} kilos de riz`, ask: 'Combien de kilos' },
};
const RATIOS_2: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [2, 5],
  [3, 5],
];
const RATIOS_3: [number, number, number][] = [
  [1, 2, 3],
  [1, 1, 2],
  [2, 3, 5],
  [1, 2, 2],
  [2, 3, 4],
  [1, 3, 4],
];
const pick = <T>(list: readonly T[], rng: Rng): T => list[randomInt(0, list.length - 1, rng)];
const integers = (traps: number[]) => traps.filter((t) => Number.isInteger(t));

/** Carte → vrai : la distance réelle, avec une échelle en mots (1 cm pour 500 m). */
export const carteVersReel: ItemGenerator = (rng) => {
  const r = pick([200, 250, 400, 500], rng);
  const c = randomInt(2, 9, rng);
  const D = c * r;
  return {
    key: `carte-reel-${r}-${c}`,
    prompt: `Sur la carte, 1 cm représente ${m(r)}. Les deux îles y sont à ${c} cm : quelle distance les sépare en vrai ?`,
    spoken: `Sur la carte, 1 centimètre représente ${say(r, 'm')}. Les deux îles y sont à ${c} centimètres : quelle distance les sépare en vrai ?`,
    // Pièges : l’addition à la place de la multiplication, un zéro de trop ou de moins, un centimètre de trop ou de moins.
    choices: options(D, [c + r, D / 10, D * 10, D + r, D - r], [r], rng, m, r),
    answer: m(D),
    hint: `1 cm, c’est ${m(r)} : ${c} cm, c’est ${c} fois plus.`,
    explanation: `${c} × ${formatNombre(r)} = ${formatNombre(D)} : les îles sont à ${m(D)} l’une de l’autre.`,
    figure: scene({ scene: 'carte', echelle: { reel: r, unit: 'm' }, carte: c, reel: '?', unitReel: 'm' }),
    aid: RULE_ECHELLE,
  };
};

/** Vrai → carte : la distance à tracer sur la carte. */
export const reelVersCarte: ItemGenerator = (rng) => {
  const r = pick([200, 250, 500], rng);
  const c = randomInt(2, 9, rng);
  const D = c * r;
  const cm = unit('cm');
  return {
    key: `reel-carte-${r}-${c}`,
    prompt: `Les deux îles sont à ${m(D)} l’une de l’autre. Sur la carte, 1 cm représente ${m(r)} : combien de centimètres les séparent ?`,
    spoken: `Les deux îles sont à ${say(D, 'm')} l’une de l’autre. Sur la carte, 1 centimètre représente ${say(r, 'm')} : combien de centimètres les séparent ?`,
    // Pièges : les mètres changés en centimètres par erreur, un zéro de trop, un centimètre d’écart.
    choices: options(c, [D / 100, c * 10, c + 1, c - 1], [r, D], rng, cm, 1),
    answer: cm(c),
    hint: `Combien de fois ${m(r)} dans ${m(D)} ? Divise.`,
    explanation: `${formatNombre(D)} ÷ ${formatNombre(r)} = ${c} : sur la carte, les îles sont à ${cm(c)}.`,
    figure: scene({ scene: 'carte', echelle: { reel: r, unit: 'm' }, carte: '?', reel: D, unitReel: 'm' }),
    aid: RULE_ECHELLE,
  };
};

/** Carte → vrai à une échelle en fraction, puis la conversion en kilomètres. */
export const carteFraction: ItemGenerator = (rng) => {
  const f = pick([10000, 20000, 25000, 50000, 100000], rng);
  const c = randomInt(2, 9, rng);
  const cmReel = c * f;
  const km = round(cmReel / 100000);
  const kmU = unit('km');
  return {
    key: `carte-fraction-${f}-${c}`,
    // Espaces insécables autour de la barre : « 1/10 000 » collé serait lu par RichText comme la fraction 1/10 suivie de « 000 ».
    prompt: `La carte est à l’échelle 1\u00a0/\u00a0${formatNombre(f)}. Les deux îles y sont à ${c} cm : quelle distance les sépare en vrai, en kilomètres ?`,
    spoken: `La carte est à l’échelle 1 sur ${formatNombre(f)}. Les deux îles y sont à ${c} centimètres : quelle distance les sépare en vrai, en kilomètres ?`,
    // Pièges : la conversion ratée d’un, deux ou trois rangs, dans un sens ou dans l’autre (au millième près, sans arrondi).
    choices: options(km, [km * 10, km * 100, km * 1000, ...[km / 10, km / 100].filter((t) => Math.abs(round(t) - t) < 1e-9)], [c], rng, kmU, null),
    answer: kmU(km),
    hint: `D’abord ${c} × ${formatNombre(f)}, en centimètres. Puis en kilomètres : 1 km, c’est 100 000 cm.`,
    explanation: `${c} × ${formatNombre(f)} = ${formatNombre(cmReel)} cm en vrai. 1 km = 100 000 cm, donc ${formatNombre(cmReel)} cm = ${kmU(km)}.`,
    figure: scene({ scene: 'carte', echelle: { fraction: f }, carte: c, reel: '?', unitReel: 'km' }),
    aid: RULE_ECHELLE_FRACTION,
  };
};

/** Une part d’un partage à deux navires, le total connu. */
export const partageDeux: ItemGenerator = (rng) => {
  const ratio = pick(RATIOS_2, rng);
  const [p, q] = rng() < 0.5 ? ratio : [ratio[1], ratio[0]];
  const u = randomInt(6, 12, rng);
  const kind = rng() < 0.5 ? 'caisses' : 'kg';
  const cargo = CARGO[kind];
  const out = unit(kind);
  const total = (p + q) * u;
  const k = randomInt(0, 1, rng);
  const mine = [p, q][k];
  const other = [p, q][1 - k];
  const ans = mine * u;
  return {
    key: `partage-deux-${p}-${q}-${u}-${k}-${kind}`,
    prompt: `On partage ${cargo.what(total)} entre les navires A et B dans le ratio ${p} : ${q}. ${cargo.ask} reçoit le navire ${SHIPS[k]} ?`,
    spoken: `On partage ${cargo.said(total)} entre les navires A et B dans le ratio ${sayRatio([p, q])}. ${cargo.ask} reçoit le navire ${SHIPS[k]} ?`,
    // Pièges : le partage en deux moitiés, la part de l’autre navire, une seule part, le total divisé par le terme du ratio.
    choices: options(ans, integers([total / 2, other * u, u, total / mine, ans + u]), [total, p, q], rng, out, u),
    answer: out(ans),
    hint: `${p} + ${q} = ${p + q} parts en tout. Une part, c’est ${formatNombre(total)} ÷ ${p + q}.`,
    explanation: `${p} + ${q} = ${p + q} parts. Une part : ${formatNombre(total)} ÷ ${p + q} = ${u}. Navire ${SHIPS[k]} : ${mine} × ${u} = ${out(ans)}.`,
    figure: scene({ scene: 'cargaison', unit: kind, ratio: [p, q], total, parts: k === 0 ? ['?', null] : [null, '?'] }),
    aid: RULE_RATIO,
  };
};

/** La part du navire B, à partir de celle du navire A (le total n’est pas donné). */
export const partDepuisPart: ItemGenerator = (rng) => {
  const [p, q] = pick(RATIOS_2, rng);
  const u = randomInt(6, 12, rng);
  const kind = rng() < 0.5 ? 'caisses' : 'kg';
  const cargo = CARGO[kind];
  const out = unit(kind);
  const a = p * u;
  const ans = q * u;
  const one = p === 1 ? `Le navire A a 1 part : une part, c’est ${u}.` : `Le navire A a ${p} parts : une part, c’est ${a} ÷ ${p} = ${u}.`;
  return {
    key: `partage-part-${p}-${q}-${u}-${kind}`,
    prompt: `Dans le ratio ${p} : ${q}, le navire A reçoit ${cargo.what(a)}. ${cargo.ask} reçoit le navire B ?`,
    spoken: `Dans le ratio ${sayRatio([p, q])}, le navire A reçoit ${cargo.said(a)}. ${cargo.ask} reçoit le navire B ?`,
    // Pièges : l’écart ajouté au lieu du rapport (modèle additif), la division oubliée, une seule part, le total.
    choices: options(ans, [a + (q - p), a * q, u, a + ans, ans + u], [a, p, q], rng, out, u),
    answer: out(ans),
    hint: `Une part, c’est ${a} ÷ ${p}. Le navire B a ${q} parts.`,
    explanation: `${one} Le navire B a ${q} parts : ${q} × ${u} = ${out(ans)}.`,
    figure: scene({ scene: 'cargaison', unit: kind, ratio: [p, q], total: null, parts: [a, '?'] }),
    aid: RULE_RATIO,
  };
};

/** Une part d’un partage à trois navires, le total connu. */
export const partageTrois: ItemGenerator = (rng) => {
  const ratio = pick(RATIOS_3, rng);
  const u = randomInt(6, 12, rng);
  const kind = rng() < 0.5 ? 'caisses' : 'kg';
  const cargo = CARGO[kind];
  const out = unit(kind);
  const n = ratio[0] + ratio[1] + ratio[2];
  const total = n * u;
  const k = randomInt(0, 2, rng);
  const mine = ratio[k];
  const ans = mine * u;
  const others = ratio.filter((_, i) => i !== k).map((r) => r * u);
  return {
    key: `partage-trois-${ratio.join('-')}-${u}-${k}-${kind}`,
    prompt: `On partage ${cargo.what(total)} entre les navires ${shipList(3)} dans le ratio ${ratio.join(' : ')}. ${cargo.ask} reçoit le navire ${SHIPS[k]} ?`,
    spoken: `On partage ${cargo.said(total)} entre les navires ${shipList(3)} dans le ratio ${sayRatio(ratio)}. ${cargo.ask} reçoit le navire ${SHIPS[k]} ?`,
    // Pièges : le partage en trois parts égales, une seule part, la part d’un autre navire, le total divisé par le terme du ratio.
    choices: options(ans, integers([total / 3, u, ...others, total / mine, ans + u]), [total, ...ratio], rng, out, u),
    answer: out(ans),
    hint: `${ratio.join(' + ')} = ${n} parts en tout. Une part, c’est ${formatNombre(total)} ÷ ${n}.`,
    explanation: `${ratio.join(' + ')} = ${n} parts. Une part : ${formatNombre(total)} ÷ ${n} = ${u}. Navire ${SHIPS[k]} : ${mine} × ${u} = ${out(ans)}.`,
    figure: scene({ scene: 'cargaison', unit: kind, ratio: [...ratio], total, parts: ratio.map((_, i) => (i === k ? '?' : null)) }),
    aid: RULE_RATIO,
  };
};

// ---------- Belvédère de Thalès : Pythagore situé (3e) ----------

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
const RULE_MAT = rule('Pythagore', [
  'Le mât est vertical, le sol horizontal : l’angle au pied du mât est droit.',
  'Le câble, en face de l’angle droit, est l’hypoténuse.',
  'câble² = hauteur² + pied² ; pour un côté : soustrais, puis racine carrée.',
]);

/** Le mât et son câble : un côté de l’angle droit au hasard pour la hauteur, l’autre pour le pied. */
function mast(rng: Rng): { h: number; p: number; c: number } {
  const [a, b, c] = pick(TRIPLES, rng);
  return rng() < 0.5 ? { h: b, p: a, c } : { h: a, p: b, c };
}

/** La longueur du câble (l’hypoténuse). */
export const matCable: ItemGenerator = (rng) => {
  const { h, p, c } = mast(rng);
  return {
    key: `mat-cable-${h}-${p}`,
    prompt: `Un câble tendu va du haut d’un mât de ${m(h)} jusqu’au sol, à ${m(p)} du pied du mât. Quelle est la longueur du câble ?`,
    spoken: `Un câble tendu va du haut d’un mât de ${say(h, 'm')} jusqu’au sol, à ${say(p, 'm')} du pied du mât. Quelle est la longueur du câble ?`,
    // Pièges : les longueurs additionnées sans les carrés, la racine oubliée, un mètre d’écart.
    choices: options(c, [h + p, h * h + p * p, c + 1, c - 1], [h, p], rng, m, 1),
    answer: m(c),
    hint: `Le câble est l’hypoténuse : ${h}² + ${p}², puis la racine carrée.`,
    explanation: `câble² = ${h}² + ${p}² = ${h * h} + ${p * p} = ${c * c}, donc le câble mesure √${c * c} = ${m(c)}.`,
    figure: scene({ scene: 'mat', unit: 'm', hauteur: h, pied: p, cable: '?' }),
    aid: RULE_MAT,
  };
};

/** La hauteur du mât (un côté de l’angle droit). */
export const matHauteur: ItemGenerator = (rng) => {
  const { h, p, c } = mast(rng);
  return {
    key: `mat-hauteur-${h}-${p}`,
    prompt: `Un câble de ${m(c)} va du haut du mât jusqu’au sol, à ${m(p)} du pied du mât. Quelle est la hauteur du mât ?`,
    spoken: `Un câble de ${say(c, 'm')} va du haut du mât jusqu’au sol, à ${say(p, 'm')} du pied du mât. Quelle est la hauteur du mât ?`,
    // Pièges : la soustraction sans les carrés, l’addition des carrés au lieu de la soustraction, la racine oubliée.
    choices: options(h, [c - p, c * c - p * p, h + 1, h - 1], [c, p], rng, m, 1),
    answer: m(h),
    hint: `Le câble est l’hypoténuse : ${c}² − ${p}², puis la racine carrée.`,
    explanation: `hauteur² = ${c}² − ${p}² = ${c * c} − ${p * p} = ${h * h}, donc le mât mesure √${h * h} = ${m(h)}.`,
    figure: scene({ scene: 'mat', unit: 'm', hauteur: '?', pied: p, cable: c }),
    aid: RULE_MAT,
  };
};

// ---------- Les missions ----------

const PASSEUR_1 = 'Lis le schéma : le point d’interrogation montre ce que tu cherches. Calcule-le avec les nombres écrits dessus.';
const PASSEUR_2 = 'Lis le schéma. Pour le tour du quai, additionne tous les côtés ; pour la durée, passe par l’heure pile.';
const PASSEUR_3 = 'Deux calculs : d’abord ce que le schéma te permet de trouver, puis ce qui est demandé.';
const BALANCES_CARTE = 'Lis la carte : chaque centimètre représente la même distance en vrai. Avec une fraction, multiplie, puis convertis.';
const ETALS_RATIO = 'Compte d’abord les parts, puis trouve ce que vaut une part : chaque case du schéma est une part.';
const PYTHAGORE_MAT = 'Le mât, le sol et le câble forment un triangle rectangle : le câble est l’hypoténuse. Applique Pythagore.';

interface Spec {
  biome: ExerciseDef['biome'];
  type: string;
  level: number;
  instruction: string;
  generators: ItemGenerator[];
  block: ExerciseDef['reward']['block'];
  xp: number;
}

function define({ biome, type, level, instruction, generators, block, xp }: Spec): ExerciseDef {
  const id = `${biome}-${type}-${level}`;
  return {
    id,
    biome,
    type,
    level,
    instruction,
    items: buildDataItems(id, generators),
    // Chaque partie tire d’autres nombres : la graine change à chaque partie.
    generate: (seed): ExerciseItem[] => buildDataItems(seed, generators),
    feedback: { correct: 'Bien calculé !', wrong: '{explanation}' },
    // La récompense de l’île : 12 XP en 6e, 14 au collège, comme les autres missions de maths.
    reward: { block, amount: 4, xp },
    adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
  };
}

const passeur = (level: number, instruction: string, generators: ItemGenerator[]) =>
  define({ biome: 'plaine', type: 'passeur', level, instruction, generators, block: 'brique', xp: 12 });

/** Les problèmes situés de 6e (Plaine des nombres). */
export const PROBLEMES_EXERCISES: ExerciseDef[] = [
  passeur(1, PASSEUR_1, [pontTotal, dureeHeure]),
  passeur(2, PASSEUR_2, [quaiTour, dureePassage]),
  passeur(3, PASSEUR_3, [pontReste, quaiLargeur, arrivee]),
];

/**
 * Les problèmes situés du collège, en niveau 3 de missions existantes (le Marché est l’île de l’école des Îles Brumeuses :
 * pas de quatrième borne) : la carte des Balances, la cargaison des Étals, le mât de Pythagore.
 */
export const PROBLEMES_COLLEGE_EXERCISES: ExerciseDef[] = [
  define({ biome: 'marche', type: 'etals', level: 3, instruction: ETALS_RATIO, generators: [partageDeux, partDepuisPart, partageTrois], block: 'toile', xp: 14 }),
  define({ biome: 'marche', type: 'balances', level: 3, instruction: BALANCES_CARTE, generators: [carteVersReel, reelVersCarte, carteFraction], block: 'toile', xp: 14 }),
  define({ biome: 'belvedere', type: 'pythagore', level: 3, instruction: PYTHAGORE_MAT, generators: [matCable, matHauteur], block: 'marbre', xp: 14 }),
];
