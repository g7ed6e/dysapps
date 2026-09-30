// Les plans des bâtiments d'une île, écrits à la fin de son Markdown (docs/contenu/<île>.md) sous « ## Les plans » : un
// tableau, une rangée par plan dans l'ordre où ils se débloquent. Chaque rangée redonne src/blocland/world/plans/<id>.json
// (nom, XP, coffre, réplique de fin) ; la forme du bâtiment reste dans le code (src/blocland/world/architect.ts).
import { ecrireTexte, lireTexte } from './texte.mjs';

export const TITRE_PLANS = '## Les plans';
const COLONNES = ['plan', 'nom', 'XP', 'coffre', 'quand c’est bâti'];
const SEP = ' · ';

function enCase(s, ou) {
  if (typeof s !== 'string' || s.includes('|') || /[\n\r]/.test(s)) throw new Error(`${ou} : « ${s} » ne tient pas dans une case (ni « | », ni saut de ligne)`);
  return ecrireTexte(s);
}

const rangee = (cases) => `| ${cases.join(' | ')} |`;

/** Les lignes de la section « ## Les plans » (vide s'il n'y a pas de plan). */
export function ecrirePlans(ile, plans) {
  if (plans.length === 0) return [];
  const rangees = plans.map((p) => {
    const ou = `plan ${p.id}`;
    if (p.biome !== ile) throw new Error(`${ou} : île ${p.biome}, attendue ${ile}`);
    if (JSON.stringify(Object.keys(p)) !== JSON.stringify(['id', 'biome', 'name', 'reward', 'done'])) throw new Error(`${ou} : champs inattendus ${Object.keys(p).join(', ')}`);
    if (JSON.stringify(Object.keys(p.reward)) !== JSON.stringify(['xp', 'chest'])) throw new Error(`${ou} : récompense inattendue`);
    if (!Number.isInteger(p.reward.xp) || p.reward.xp < 0) throw new Error(`${ou} : XP entière et positive attendue`);
    const coffre = Object.entries(p.reward.chest).map(([bloc, n]) => {
      if (!/^[a-z0-9-]+$/.test(bloc) || !Number.isInteger(n) || n < 1) throw new Error(`${ou} : coffre mal formé (${bloc} : ${n})`);
      return `${bloc} × ${n}`;
    });
    return [`\`${p.id}\``, enCase(p.name, ou), String(p.reward.xp), coffre.join(SEP), enCase(p.done, ou)];
  });
  return [TITRE_PLANS, '', rangee(COLONNES), rangee(COLONNES.map(() => '---')), ...rangees.map(rangee), ''];
}

/**
 * Lit la section « ## Les plans » : `lignes` commence à son titre, `debut` est le rang de ce titre dans le fichier (pour
 * les numéros de ligne). Rend les plans au format de src/blocland/world/plans/<id>.json.
 */
export function lirePlans(lignes, debut, fichier, ile) {
  let i = 1;
  const erreur = (m, n = debut + i) => new Error(`${fichier}, ligne ${n + 1} : ${m}`);
  while (i < lignes.length && (lignes[i].trim() === '' || lignes[i].startsWith('> '))) i++;
  const cases = (l) => {
    if (!l?.startsWith('|') || !l.endsWith('|') || l.length < 2) throw erreur(`ligne de tableau attendue, lu « ${l} »`);
    return l.slice(1, -1).split('|').map((c) => c.trim());
  };
  if (cases(lignes[i]).join('|') !== COLONNES.join('|')) throw erreur(`colonnes attendues : ${COLONNES.join(', ')}`);
  i++;
  const sep = cases(lignes[i]);
  if (sep.length !== COLONNES.length || !sep.every((c) => /^:?-+:?$/.test(c))) throw erreur('ligne « |---|---| » attendue');
  i++;
  const plans = [];
  for (; i < lignes.length && lignes[i].startsWith('|'); i++) {
    const n = debut + i + 1;
    const r = cases(lignes[i]);
    if (r.length !== COLONNES.length) throw erreur(`${COLONNES.length} cases attendues, lu ${r.length}`);
    const [id, nom, xp, coffre, fin] = r;
    const m = /^`([a-z0-9-]+)`$/.exec(id);
    if (!m) throw erreur(`identifiant de plan attendu entre accents graves, lu « ${id} »`);
    if (plans.some((p) => p.id === m[1])) throw erreur(`le plan « ${m[1]} » est écrit deux fois`);
    if (!/^\d+$/.test(xp)) throw erreur(`XP : nombre attendu, lu « ${xp} »`);
    const chest = {};
    for (const part of coffre === '' ? [] : coffre.split(SEP)) {
      const b = /^([a-z0-9-]+) × ([1-9]\d*)$/.exec(part);
      if (!b) throw erreur(`coffre : « bloc × nombre » attendu, lu « ${part} »`);
      if (Object.hasOwn(chest, b[1])) throw erreur(`coffre : « ${b[1]} » écrit deux fois`);
      chest[b[1]] = Number(b[2]);
    }
    const texte = (v) => {
      try {
        return lireTexte(v, n);
      } catch (e) {
        throw new Error(`${fichier}, ${e.message}`);
      }
    };
    plans.push({ id: m[1], biome: ile, name: texte(nom), reward: { xp: Number(xp), chest }, done: texte(fin) });
  }
  while (i < lignes.length && (lignes[i].trim() === '' || lignes[i].startsWith('> '))) i++;
  if (i < lignes.length) throw erreur(`ligne inattendue après le tableau des plans : ${lignes[i]}`);
  return plans;
}
