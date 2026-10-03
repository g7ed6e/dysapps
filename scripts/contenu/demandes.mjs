// Les commandes des habitants (GD-7, points 4 et 5), écrites à la fin du Markdown d'une île (docs/contenu/<île>.md), après
// « ## Les plans », sous « ## Les demandes » : un « ### `<lieu>-request-<n>` » par commande, puis ses champs. Elles
// redonnent src/blocland/world/requests.json (toutes les îles, dans l'ordre de docs/contenu/archipel.md). La forme de la
// petite construction que pose une commande livrée, et sa place, restent dans le code
// (src/blocland/world/petitesConstructions.ts) ; le Markdown la décrit dans une note (« > Forme : … »), pour l'artiste
// technique 3D, que le jeu ne lit pas.
//
//   ## Les demandes
//
//   ### `french-6e-letter-confusion-request-1`
//
//   - habitant : Tunel                                          ← la créature de l'île (jamais un Gardien)
//   - bloc : `maths-6e-calculation`                             ← le bloc d'une autre île de l'archipel, ou son bloc assemblé
//   - combien : 4                                               ← de 2 à 4 : un cube posé par bloc livré
//   - petite construction : le puits                            ← son nom, avec l'article, le même partout
//   - demande : Il me faut {objet} pour mon puits. Joue une mission de la Plaine des nombres.
//   - prête : Tu as les {blocs} ! Livre-les à Tunel.
//   - posée : Puits posé chez Tunel !
//   - après le plan : `french-6e-reading-2`                     ← facultatif : la commande n'arrive qu'une fois ce plan bâti
//
// Jetons, remplacés par le jeu avec les mots de Mes blocs (blockCount, blockName de src/blocland/biomes.ts) pour que
// l'objet porte le même nom partout : {objet} « 4 briques », {blocs} « briques », {à} « à la Fabrique » (le lieu
// d'assemblage de l'univers, docs/contenu/assemblage.md).
import { lireTexte } from './texte.mjs';

export const TITRE_DEMANDES = '## Les demandes';

/** Les champs d'une commande, dans l'ordre d'écriture : [étiquette, clé, obligatoire]. */
const CHAMPS = [
  ['habitant', 'resident', true],
  ['bloc', 'block', true],
  ['combien', 'count', true],
  ['petite construction', 'name', true],
  ['demande', 'ask', true],
  ['prête', 'ready', true],
  ['posée', 'done', true],
  ['après le plan', 'afterPlan', false],
];
const PAR_ETIQUETTE = new Map(CHAMPS.map((c) => [c[0], c]));
const JETONS = ['{objet}', '{blocs}', '{à}'];
const ID = /^`([a-z0-9-]+)`$/;

/** Le nombre de blocs d'une commande : un cube posé par bloc livré, deux au moins (arbitrage du 3 octobre 2026). */
export const COMBIEN_MIN = 2;
export const COMBIEN_MAX = 4;

/** Ce qu'une commande produit dans src/blocland/world/requests.json. */
function versJson(ile, n, c) {
  return {
    id: `${ile}-request-${n}`,
    biome: ile,
    block: c.block,
    count: c.count,
    fixture: `${ile}-fixture-${n}`,
    ...(c.afterPlan === undefined ? {} : { afterPlan: c.afterPlan }),
    blocland: { name: c.name, ask: c.ask, ready: c.ready, done: c.done },
  };
}

/**
 * Lit la section « ## Les demandes » : `lignes` commence à son titre, `debut` est le rang de ce titre dans le fichier (pour
 * les numéros de ligne). Rend les commandes au format de src/blocland/world/requests.json, avec `resident` (le nom écrit,
 * que `verifierDemandes` compare à la créature de l'île, et qui ne passe pas dans le JSON).
 */
export function lireDemandes(lignes, debut, fichier, ile) {
  const demandes = [];
  let courante = null;
  let i = 1;
  const erreur = (m) => new Error(`${fichier}, ligne ${debut + i + 1} : ${m}`);
  const finir = () => {
    if (!courante) return;
    for (const [etiquette, cle, obligatoire] of CHAMPS) if (obligatoire && courante.champs[cle] === undefined) throw new Error(`${fichier}, commande ${courante.id} : « ${etiquette} » manque`);
    demandes.push({ ...versJson(ile, courante.n, courante.champs), resident: courante.champs.resident });
    courante = null;
  };
  for (; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.trim() === '' || l.startsWith('> ')) continue;
    let m;
    if ((m = /^### (.*)$/.exec(l))) {
      finir();
      const id = ID.exec(m[1])?.[1];
      if (!id) throw erreur(`identifiant de commande attendu entre accents graves, lu « ${m[1]} »`);
      const n = demandes.length + 1;
      if (id !== `${ile}-request-${n}`) throw erreur(`commande ${n} : identifiant « ${ile}-request-${n} » attendu, lu « ${id} »`);
      courante = { id, n, champs: {} };
      continue;
    }
    if ((m = /^- (.+?) : (.*)$/.exec(l))) {
      if (!courante) throw erreur(`un champ va sous le titre d’une commande (« ### \`${ile}-request-1\` ») : ${l}`);
      const def = PAR_ETIQUETTE.get(m[1]);
      if (!def) throw erreur(`champ inconnu « ${m[1]} » (${CHAMPS.map((c) => c[0]).join(', ')})`);
      const [, cle] = def;
      if (courante.champs[cle] !== undefined) throw erreur(`« ${m[1]} » écrit deux fois`);
      let v;
      try {
        v = lireTexte(m[2], debut + i + 1);
      } catch (e) {
        throw new Error(`${fichier}, ${e.message}`);
      }
      if (cle === 'block' || cle === 'afterPlan') {
        const id = ID.exec(v)?.[1];
        if (!id) throw erreur(`${m[1]} : identifiant attendu entre accents graves, lu « ${v} »`);
        v = id;
      } else if (cle === 'count') {
        if (!/^\d+$/.test(v) || Number(v) < COMBIEN_MIN || Number(v) > COMBIEN_MAX) throw erreur(`combien : un nombre de ${COMBIEN_MIN} à ${COMBIEN_MAX} attendu, lu « ${v} »`);
        v = Number(v);
      }
      courante.champs[cle] = v;
      continue;
    }
    throw erreur(`ligne inattendue dans les demandes : ${l}`);
  }
  finir();
  return demandes;
}

/** Les lignes de la section « ## Les demandes » (vide s'il n'y a pas de commande), sans les notes. */
export function ecrireDemandes(ile, demandes) {
  if (demandes.length === 0) return [];
  const lignes = [TITRE_DEMANDES, ''];
  demandes.forEach((d, k) => {
    if (d.id !== `${ile}-request-${k + 1}`) throw new Error(`commande ${d.id} : identifiant ${ile}-request-${k + 1} attendu`);
    const valeurs = { resident: d.resident, block: `\`${d.block}\``, count: String(d.count), ...d.blocland, afterPlan: d.afterPlan && `\`${d.afterPlan}\`` };
    lignes.push(`### \`${d.id}\``, '');
    for (const [etiquette, cle] of CHAMPS) if (valeurs[cle] !== undefined) lignes.push(`- ${etiquette} : ${valeurs[cle]}`);
    lignes.push('');
  });
  return lignes;
}

/** Les jetons d'une phrase, dans l'ordre. */
const jetons = (s) => s.match(/\{[^}]*\}/g) ?? [];

/**
 * Vérifie les commandes de toutes les îles et les rend sans `resident`, pour src/blocland/world/requests.json.
 * `iles` : les îles dans l'ordre de docs/contenu/archipel.md ({ id, name, subject, classe, creature }) ; `demandesParIle` :
 * Map île → commandes lues ; `recettes` : les blocs assemblés (docs/contenu/assemblage.md) ; `plans` : Map île → ids de ses
 * plans. Les règles : GD-7 (points 4 et 5) et l'arbitrage du directeur artistique du 3 octobre 2026.
 */
export function verifierDemandes(iles, demandesParIle, recettes, plans) {
  const sortie = [];
  const parId = new Map(iles.map((b) => [b.id, b]));
  const demandesParArchipel = new Map();
  for (const ile of iles) {
    const demandes = demandesParIle.get(ile.id) ?? [];
    const ou = `docs/contenu/${ile.id}.md`;
    if (ile.subject === 'lv2') {
      if (demandes.length) throw new Error(`${ou} : une île de LV2 n’a pas de commande (GD-7)`);
      continue;
    }
    if (demandes.length === 0) throw new Error(`${ou} : l’île n’a pas de commande (« ${TITRE_DEMANDES} », une au moins)`);
    for (const d of demandes) {
      const err = (m) => new Error(`${ou}, commande ${d.id} : ${m}`);
      if (d.resident !== ile.creature.name) throw err(`l’habitant est la créature de l’île, ${ile.creature.name}, lu « ${d.resident} »`);
      const autre = parId.get(d.block);
      const recette = recettes.find((r) => r.bloc === d.block);
      if (autre) {
        if (autre.id === ile.id) throw err('une créature ne demande pas le bloc de sa propre île');
        if (autre.classe !== ile.classe) throw err(`le bloc « ${d.block} » vient d’un autre archipel (${autre.classe}, l’île est en ${ile.classe})`);
        if (autre.subject === 'lv2') throw err('jamais le bloc d’une île de LV2');
      } else if (recette) {
        if (recette.archipelago !== ile.classe) throw err(`le bloc assemblé « ${d.block} » est celui de l’archipel ${recette.archipelago}, l’île est en ${ile.classe}`);
        if (recette.ingredients.some((x) => x.bloc === ile.id)) throw err(`la recette de « ${d.block} » prend le bloc de l’île : la créature demanderait son propre bloc`);
      } else {
        throw err(`le bloc « ${d.block} » n’est ni celui d’une île ni un bloc assemblé (jamais l’or, le cristal ni un bloc de finition)`);
      }
      const archipel = demandesParArchipel.get(ile.classe) ?? new Map();
      if (archipel.has(d.block)) throw err(`le bloc « ${d.block} » est déjà demandé dans l’archipel, par ${archipel.get(d.block)}`);
      archipel.set(d.block, d.id);
      demandesParArchipel.set(ile.classe, archipel);
      if (d.afterPlan !== undefined && !(plans.get(ile.id) ?? []).includes(d.afterPlan)) throw err(`après le plan : « ${d.afterPlan} » n’est pas un plan de l’île`);

      const { name, ask, ready, done } = d.blocland;
      for (const [quoi, s] of [['petite construction', name], ['demande', ask], ['prête', ready], ['posée', done]]) {
        if (/['"]/.test(s)) throw err(`${quoi} : apostrophes et guillemets typographiques (’ « »), jamais droits`);
        if (/…|\.\.\./.test(s)) throw err(`${quoi} : pas de « … », la voix le lit mal`);
        const inconnus = jetons(s).filter((j) => !JETONS.includes(j));
        if (inconnus.length) throw err(`${quoi} : jeton inconnu ${inconnus.join(', ')} (${JETONS.join(', ')})`);
      }
      if (!/^(le |la |l’)/.test(name)) throw err(`petite construction : son nom avec l’article (« le puits », « l’abri »), lu « ${name} »`);
      if (jetons(name).length) throw err('petite construction : pas de jeton');
      if (JSON.stringify(jetons(ask)) !== JSON.stringify(recette ? ['{objet}', '{à}'] : ['{objet}'])) {
        throw err(recette ? 'demande : « {objet} » puis « {à} » (« Assemble-les {à}. »)' : 'demande : « {objet} » une fois, sans autre jeton');
      }
      if (recette && !/Assemble-les \{à\}\.$/.test(ask)) throw err('demande : un bloc assemblé finit par « Assemble-les {à}. »');
      if (autre && !['de la ', 'du ', 'de l’', 'des '].some((de) => ask.endsWith(`. Joue une mission ${de}${autre.name}.`))) {
        throw err(`demande : le lieu et le geste, « Joue une mission de la (du, de l’) ${autre.name}. » en fin de phrase`);
      }
      const objet = name.replace(/^(le |la |l’)/, '');
      if (!ask.includes(` ${objet}.`)) throw err(`demande : la petite construction porte le même nom partout, « ${objet} »`);
      if (JSON.stringify(jetons(ready)) !== '["{blocs}"]' || !ready.endsWith(` à ${ile.creature.name}.`)) throw err(`prête : « Tu as les {blocs} ! Livre-les à ${ile.creature.name}. »`);
      if (jetons(done).length || !done.startsWith(objet[0].toUpperCase() + objet.slice(1) + ' posé') || !done.endsWith(` chez ${ile.creature.name} !`)) {
        throw err(`posée : « ${objet[0].toUpperCase() + objet.slice(1)} posé(e) chez ${ile.creature.name} ! »`);
      }
      for (const [quoi, s] of [['demande', ask], ['prête', ready], ['posée', done]]) {
        const phrases = s.split(/(?<=[.!?]) /);
        if (phrases.length > 2 || phrases.some((p) => p.split(' ').length > 12)) throw err(`${quoi} : deux phrases courtes au plus, une idée par phrase`);
      }
      const { resident, ...json } = d;
      sortie.push(json);
    }
  }
  return sortie;
}
