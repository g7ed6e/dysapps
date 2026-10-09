// Les réponses possibles des items d'une partie sont placées avec la graine de la partie : la bonne réponse change de
// place d'une partie à l'autre, et sur une partie elle prend chaque place autant de fois (voir `core/choices.ts`).
// Les listes de nombres restent dans l'ordre croissant. Hors maths, leurs pièges sont ceux du fichier (13 contre 30,
// à l'oreille ; le 2, le 12 ou le 20 juin) : on n'en calcule pas d'autres, la réponse garde la place de son rang.
// Un exercice généré (maths) tire déjà la place de la réponse dans ses générateurs, avec ses vrais pièges : ses choix
// restent tels quels (replacer une réponse chiffrée inventerait des pièges, ou changerait les nombres de l'énoncé).
import { parseHour, parseNumber, placeChoices } from '../../core/choices';
import { BIOMES } from '../biomes';
import { seeded } from '../../core/random';
import type { AssemblageDef, ExerciseDef, ExerciseItem } from './types';

/** Les items d'une partie, leurs `choices` placés au hasard. */
export function shuffleRunChoices(def: ExerciseDef, items: ExerciseItem[], seed: string): ExerciseItem[] {
  if (def.generate) return items;
  const rng = seeded(`${seed}:choix:${def.id}`);
  // Les premiers tirages de graines voisines se ressemblent : on en jette quelques-uns.
  for (let k = 0; k < 4; k++) rng();
  return placeChoices(items, rng, piegesDe(def));
}

/**
 * Les maths produites par le code calculent leurs pièges voisins ; ailleurs, et dans une mission de maths écrite en
 * Markdown (sans `generate`), dont les explications nomment les pièges, ceux du fichier restent. Une question
 * d'assemblage (GD-2) n'a pas d'île : ses pièges sont écrits exprès, un de chaque matière.
 */
export function piegesDe(def: Pick<ExerciseDef, 'type' | 'generate'> & { biome?: string }): 'calcules' | 'du-fichier' {
  if (def.type === 'assembly' || !def.generate) return 'du-fichier';
  return BIOMES.find((b) => b.id === def.biome)?.subject === 'maths' ? 'calcules' : 'du-fichier';
}

const EXPOSANTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** « 8 × 10⁹ » → 8 000 000 000 : un nombre en écriture scientifique (l'Engrenage), sinon undefined. */
function puissanceDeDix(c: string | number): number | undefined {
  const m = /^(\d+(?:,\d+)?) × 10(⁻?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/.exec(String(c));
  if (!m) return undefined;
  const n = Number([...m[3]].map((x) => EXPOSANTS.indexOf(x)).join(''));
  return Number(m[1].replace(',', '.')) * 10 ** (m[2] ? -n : n);
}

/**
 * Les valeurs des choix quand ce sont tous des nombres d'une même sorte (même unité, ou tous des heures, ou tous en
 * écriture scientifique) : ils se rangent, ils ne se mélangent pas. Sinon undefined (des phrases).
 */
export function valeursDesNombres(choices: unknown): number[] | undefined {
  if (!Array.isArray(choices) || choices.length < 2) return undefined;
  const liste = choices as (string | number)[];
  const heures = liste.map((c) => parseHour(c));
  if (heures.every((h): h is number => h !== undefined)) return heures;
  const scientifiques = liste.map(puissanceDeDix);
  if (scientifiques.every((v): v is number => v !== undefined)) return scientifiques;
  const parsed = liste.map((c) => parseNumber(c));
  return parsed.every((p) => p !== undefined && p.unit === parsed[0]!.unit) ? parsed.map((p) => p!.value) : undefined;
}

/**
 * Les choix des questions d'un bloc assemblé (GD-2), placés avec la graine de l'élève : des nombres, toujours dans
 * l'ordre croissant, sans piège inventé (la réponse garde la place de son rang) ; des phrases, mélangées, la bonne
 * réponse autant de fois à chaque place sur l'ensemble des questions du bloc.
 */
export function placerChoixAssemblage(def: AssemblageDef, seed: string): ExerciseItem[] {
  const rng = seeded(`${seed}:choix:${def.id}`);
  for (let k = 0; k < 4; k++) rng();
  const phrases = placeChoices(
    def.items.filter((it) => !valeursDesNombres(it.choices)),
    rng,
    piegesDe(def),
  );
  return def.items.map((it) => {
    const valeurs = valeursDesNombres(it.choices);
    if (!valeurs) return phrases.shift()!;
    const choices = it.choices as (string | number)[];
    return {
      ...it,
      choices: choices
        .map((c, i) => [c, valeurs[i]] as const)
        .sort((a, b) => a[1] - b[1])
        .map(([c]) => c),
    };
  });
}
