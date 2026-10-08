// Les quêtes des habitants (GD-10), écrites en Markdown dans docs/contenu/quetes.md : un « ## <classe> » par région, un
// « ### `story-<classe>-<n>` » par quête, ses champs, puis ses étapes numérotées. Elles redonnent
// src/game/world/stories.json, dans l'ordre du fichier. La forme de l'objet posé à la fin et sa place restent dans le
// code (src/game/world/fixtures.ts) ; le Markdown la décrit dans une note (« > Forme : … »), que le jeu ne lit pas.
//
//   ## 6e
//
//   ### `story-6e-1`
//
//   - objet : la lanterne                                       ← son nom, avec l'article, le même partout
//   - icône : `lantern`                                         ← le bloc dont l'image le montre
//   - fin : Lanterne posée chez Mousso !                        ← chez l'habitant de la dernière étape
//
//   1. mission chez `maths-6e-calculation` : Joue une mission chez Coco.
//   2. donner 2 `french-6e-phonology` chez `maths-6e-calculation` : Donne {objet} à Coco.
//   3. apporter chez `french-6e-phonology` : Apporte la lanterne à Mousso.
//
// Trois sortes d'étapes, des gestes qui existent déjà : « mission » (réussir une mission du lieu, n'importe laquelle),
// « donner N `<bloc>` » (des blocs du stock, de 2 à 4), « apporter » (l'objet, d'un toucher). La dernière étape se fait
// d'un toucher (« donner » ou « apporter ») : c'est elle qui pose l'objet. Jeton : {objet}, remplacé par le nombre et le
// nom du bloc de Mes blocs (« 2 blocs de bois »).
import { lireTexte } from './texte.mjs';

export const FICHIER_QUETES = 'quetes.md';

const ID = /^`([a-z0-9-]+)`$/;
const CHAMPS = [
  ['objet', 'name'],
  ['icône', 'item'],
  ['fin', 'done'],
];
const PAR_ETIQUETTE = new Map(CHAMPS);
const ETAPE = /^\d+\. (mission|apporter|donner (\d+) `([a-z0-9-]+)`) chez `([a-z0-9-]+)` : (.+)$/;
const SORTES = { mission: 'mission', apporter: 'bring', donner: 'give' };

/** Le nombre de blocs d'une étape « donner », comme une commande (scripts/contenu/demandes.mjs). */
export const DONNER_MIN = 2;
export const DONNER_MAX = 4;

/**
 * Lit docs/contenu/quetes.md. Rend les quêtes au format de src/game/world/stories.json, sans leur objet posé (`fixture`),
 * que `verifierQuetes` nomme.
 */
export function lireQuetes(md, fichier) {
  const lignes = md.replace(/\r\n/g, '\n').split('\n');
  const quetes = [];
  let region = null;
  let courante = null;
  const erreur = (i, m) => new Error(`${fichier}, ligne ${i + 1} : ${m}`);
  const finir = () => {
    if (!courante) return;
    for (const [etiquette, cle] of CHAMPS) if (courante[cle] === undefined) throw new Error(`${fichier}, quête ${courante.id} : « ${etiquette} » manque`);
    if (courante.steps.length < 3 || courante.steps.length > 4) throw new Error(`${fichier}, quête ${courante.id} : trois ou quatre étapes, lu ${courante.steps.length}`);
    quetes.push(courante);
    courante = null;
  };
  lignes.forEach((l, i) => {
    if (i === 0 || l.trim() === '' || l.startsWith('> ')) return;
    let m;
    if ((m = /^## (6e|5e|4e|3e)$/.exec(l))) {
      finir();
      region = m[1];
      return;
    }
    if ((m = /^### (.*)$/.exec(l))) {
      finir();
      const id = ID.exec(m[1])?.[1];
      if (!region) throw erreur(i, 'une quête va sous le titre de sa région (« ## 6e »)');
      const n = quetes.filter((q) => q.region === region).length + 1;
      if (id !== `story-${region}-${n}`) throw erreur(i, `quête ${n} : identifiant « story-${region}-${n} » attendu, lu « ${m[1]} »`);
      courante = { id, region, steps: [] };
      return;
    }
    if (!courante) {
      if (region || !/^[A-ZÀ-Ý]/.test(l)) throw erreur(i, `ligne inattendue hors d’une quête : ${l}`);
      return;
    }
    if ((m = /^- (.+?) : (.*)$/.exec(l))) {
      const cle = PAR_ETIQUETTE.get(m[1]);
      if (!cle) throw erreur(i, `champ inconnu « ${m[1]} » (${CHAMPS.map((c) => c[0]).join(', ')})`);
      if (courante[cle] !== undefined) throw erreur(i, `« ${m[1]} » écrit deux fois`);
      let v;
      try {
        v = lireTexte(m[2], i + 1);
      } catch (e) {
        throw new Error(`${fichier}, ${e.message}`);
      }
      if (cle === 'item') {
        const id = ID.exec(v)?.[1];
        if (!id) throw erreur(i, `icône : un bloc entre accents graves, lu « ${v} »`);
        v = id;
      }
      courante[cle] = v;
      return;
    }
    if ((m = ETAPE.exec(l))) {
      if (Number(l.split('.')[0]) !== courante.steps.length + 1) throw erreur(i, `étape ${courante.steps.length + 1} attendue`);
      const sorte = SORTES[m[1].split(' ')[0]];
      const etape = { kind: sorte, place: m[4], text: m[5] };
      if (sorte === 'give') {
        const count = Number(m[2]);
        if (count < DONNER_MIN || count > DONNER_MAX) throw erreur(i, `donner : de ${DONNER_MIN} à ${DONNER_MAX} blocs, lu ${count}`);
        Object.assign(etape, { block: m[3], count });
      }
      courante.steps.push(etape);
      return;
    }
    throw erreur(i, `ligne inattendue dans une quête : ${l}`);
  });
  finir();
  return quetes;
}

const motsDe = (s) => s.split(' ').length;

/**
 * Vérifie les quêtes et nomme l'objet posé à la fin : la petite construction suivante de l'habitant de la dernière
 * étape (`<lieu>-fixture-<n>`, après celle de sa commande). `iles` : les îles dans l'ordre de docs/contenu/archipel.md ;
 * `demandes` : les commandes (src/game/world/requests.json) ; `blocs` : les identifiants des blocs connus du jeu.
 */
export function verifierQuetes(quetes, iles, demandes, blocs) {
  const parId = new Map(iles.map((b) => [b.id, b]));
  const fixtures = new Map();
  for (const d of demandes) fixtures.set(d.biome, (fixtures.get(d.biome) ?? 0) + 1);
  return quetes.map((q) => {
    const err = (m) => new Error(`docs/contenu/${FICHIER_QUETES}, quête ${q.id} : ${m}`);
    if (!blocs.includes(q.item)) throw err(`icône : « ${q.item} » n’est pas un bloc du jeu`);
    if (!/^(le |la |l’)/.test(q.name)) throw err(`objet : son nom avec l’article (« la lanterne »), lu « ${q.name} »`);
    for (const [quoi, s] of [['objet', q.name], ['fin', q.done], ...q.steps.map((e, k) => [`étape ${k + 1}`, e.text])]) {
      if (/['"]/.test(s)) throw err(`${quoi} : apostrophes et guillemets typographiques (’ « »), jamais droits`);
      if (/…|\.\.\./.test(s)) throw err(`${quoi} : pas de « … », la voix le lit mal`);
    }
    q.steps.forEach((e, k) => {
      const ile = parId.get(e.place);
      const ou = `étape ${k + 1}`;
      if (!ile) throw err(`${ou} : « ${e.place} » n’est pas un lieu`);
      if (ile.classe !== q.region) throw err(`${ou} : « ${e.place} » est en ${ile.classe}, la quête en ${q.region}`);
      if (ile.subject === 'lv2') throw err(`${ou} : jamais un lieu de LV2`);
      if (!e.text.includes(ile.creature.name)) throw err(`${ou} : la phrase nomme l’habitant, ${ile.creature.name}`);
      if (motsDe(e.text) > 7) throw err(`${ou} : sept mots au plus, une seule phrase`);
      if (e.kind === 'give') {
        const donne = parId.get(e.block);
        if (!donne || donne.classe !== q.region || donne.subject === 'lv2') throw err(`${ou} : « ${e.block} » est le bloc d’un lieu de la région, jamais de la LV2`);
        if (!e.text.includes('{objet}')) throw err(`${ou} : « {objet} » dit les blocs donnés (« Donne {objet} à ${ile.creature.name}. »)`);
      } else if (e.text.includes('{')) throw err(`${ou} : pas de jeton`);
    });
    const derniere = q.steps[q.steps.length - 1];
    if (derniere.kind === 'mission') throw err('la dernière étape se fait d’un toucher (« donner » ou « apporter ») : c’est elle qui pose l’objet');
    const receveur = parId.get(derniere.place);
    if (motsDe(q.done) > 5 || !q.done.endsWith(` chez ${receveur.creature.name} !`)) throw err(`fin : cinq mots au plus, « … posé(e) chez ${receveur.creature.name} ! »`);
    const n = (fixtures.get(derniere.place) ?? 0) + 1;
    fixtures.set(derniere.place, n);
    return { id: q.id, region: q.region, name: q.name, item: q.item, fixture: `${derniere.place}-fixture-${n}`, steps: q.steps, done: q.done };
  });
}
