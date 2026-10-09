// Le format Markdown du contenu (docs/contenu/<île>.md) : une île par fichier, un niveau d'exercice par section.
// lireIle(md) rend l'île et ses exercices (les objets des JSON du jeu), ecrireIle(ile, exercices) écrit le Markdown.
// Le format est strict : un champ inconnu ou mal écrit arrête la génération, avec le numéro de ligne.
//
//   ---
//   lieu : english-6e-vocabulary             ← en-tête : l'identifiant du lieu (matière, classe, thème), puis ce qu'il est
//   module : Vocabulaire et écoute
//   ---
//   # Baie des mots                          ← le nom de l'île
//   > une note                               ← ignorée
//   ## Écoute · `first-listening`            ← une mission : son titre et son identifiant
//   - description : …                        ← la mission (description, compétences, lv2 ou option, en attente)
//   - consigne : Écoute le mot anglais, …    ← champs communs à tous ses niveaux
//   ### Niveau 1 · `english-6e-vocabulary-first-listening-1` ← un niveau : l'identifiant de l'exercice
//   - langue : en                            ← champs propres à ce niveau
//   Pour tous les items :                    ← champs communs à tous les items du niveau (ou de la mission)
//   - aide « Se présenter » :
//     - Hello / Hi = bonjour.
//   1. mot : cat                             ← un item par numéro, son premier champ sur la ligne
//      - choix : le chat · le chien · la vache
//
// ou, pour des items courts, un tableau (une colonne par champ, une case vide = champ absent) :
//   | mot troué | choix |
//   | --- | --- |
//   | [en]fant | en · an · in |
//
// Une figure de maths (`figure`, dessinée au-dessus des réponses, sans donner la réponse) s'écrit sur une ligne, avec un
// composant de l'aide visuelle des missions : « figure : tableau x · f(x) / 2 · 6 / 4 · ? » (tableau de proportionnalité :
// l'en-tête, puis une ligne par « / »), « figure : triangle 3 · 4 · ? » (triangle rectangle : les deux côtés de l'angle
// droit, puis l'hypoténuse), « figure : droite 0 · 20 / 5 · 10 » (droite graduée : du premier au dernier nombre, puis les
// points marqués), « figure : graduée 5 · 6 / 10 / 5,38 » (droite d'un entier à un autre, chaque unité en 10 parts, un
// « ? » sur 5,38, sans le nombre), « figure : fraction 3/5 » (barre de fraction), « figure : fractions 3/5 · 3/10 » (deux barres à
// comparer), « figure : diagramme lundi · mardi / 10 · 20 » (diagramme en barres : les noms, puis les nombres ; les
// nombres seuls sans noms) et « figure : graphique 2 · 1 » (la droite y = 2 × x + 1 dans un repère).
// Les figures de géométrie (src/game/exercises/GeometryAids/), tracées à l'échelle, « ? » pour la valeur cherchée :
// « angles 40 · 60 · ? » (un triangle et ses trois angles, au besoin « / isocèle » ou « / équilatéral »), « angle 120 »,
// « angle plat 130 · ? » ou « angle croisé 70 · ? » (un angle seul, deux angles côte à côte, un angle et son opposé par le
// sommet), « plane rectangle 5 · 3 / aire ? » (et carré, parallélogramme, triangle, disque, cercle « / diamètre ? »,
// médiatrice « 7 · ? », partagé « 3 / x · 4 / ? · ? »), « solide cubes 4 · 2 · 3 » (et cube, cylindre, cône,
// prisme-pyramide), « image rotation 90 / angle 50 · ? » (une figure et son image sur un quadrillage : translation,
// axiale, centrale, rotation, homothétie) et « repère A 4 · −2 » (un repère de −6 à 6, vide ou avec des points nommés).
//
// Ce qui se déduit ne s'écrit pas : « trou lu : blank » (pour tous les items) donne « lu » = l'énoncé dont le « … »
// est remplacé ; « clé des items : mot » (ou lettre, ou paragraphe) donne la clé ; « mot troué : en[f]ant » donne
// le mot, avant, après et la réponse.
//
// En fin de fichier, « ## La voix » donne les mots qui ne sont pas du français et comment la voix les dit
// (scripts/contenu/voix.mjs), « ## Les plans » les plans des bâtiments de l'île en tableau (scripts/contenu/plans.mjs),
// puis « ## Les demandes », les commandes de son habitant (scripts/contenu/demandes.mjs).
//
// Une valeur qui a un saut de ligne, des espaces au bord, qui est vide ou qui commence par « " »
// s'écrit comme une chaîne JSON entre guillemets. Une liste s'écrit « a · b · c », ou en sous-liste si un élément
// contient « · ».
import { ecrireDemandes, lireDemandes, TITRE_DEMANDES } from './demandes.mjs';
import { ecrirePlans, lirePlans, TITRE_PLANS } from './plans.mjs';
import { ecrireVoix, lireVoix, TITRE_VOIX } from './voix.mjs';
import { aGuillemets, ecrireTexte, lireTexte } from './texte.mjs';

/** Champs de l'île, dans l'en-tête (son nom est le titre « # … ») : [étiquette, chemin dans le JSON]. */
const ILE = [
  ['module', 'module'],
  ['matière', 'subject'],
  ['classe', 'classe'],
  ['description', 'description'],
  ['gardien', 'guardian'],
  ['icône', 'icon'],
  ['créature', 'creature.name'],
];
const PAR_ETIQUETTE_ILE = new Map(ILE.map((c) => [c[0], c]));

/** Champs d'une mission (sous son titre « ## … »), qui ne passent pas à ses niveaux : [étiquette, clé, type]. */
const MISSION = [
  ['description', 'description', 'texte'],
  ['compétences', 'programme', 'liste'],
  ['lv2', 'lv2', 'texte'],
  // Sur l'île du latin et du grec (matière `lca`) : l'option de la mission, `la` ou `gr` (GD-13, comme `lv2`).
  ['option', 'option', 'texte'],
  // Une mission écrite et relue, gardée hors du jeu tant que ce qu'il lui faut manque (la police grecque de
  // « L'alphabet grec ») : la raison, en quelques mots. `missionsJouables` ne la propose pas.
  ['en attente', 'waiting', 'texte'],
];
const PAR_ETIQUETTE_MISSION = new Map(MISSION.map((c) => [c[0], c]));

/** Champs d'un niveau, dans l'ordre d'écriture : [étiquette, chemin dans le JSON, type]. */
const NIVEAU = [
  ['titre', 'title', 'texte'],
  ['langue', 'lang', 'texte'],
  ['cible', 'target', 'texte'],
  ['consigne', 'instruction', 'texte'],
  ['programme', 'programme', 'liste'],
  ['par partie', 'perRun', 'nombre'],
  ['bravo', 'feedback.correct', 'texte'],
  ['erreur', 'feedback.wrong', 'texte'],
  ['bloc gagné', 'reward.block', 'texte'],
  ['blocs', 'reward.amount', 'nombre'],
  ['XP', 'reward.xp', 'nombre'],
  ['monte à', 'adaptive.promoteAt', 'nombre'],
  ['descend à', 'adaptive.demoteAt', 'nombre'],
];

/** Champs d'un item : [étiquette, clé dans le JSON, type]. */
const ITEM = [
  ['clé', 'key', 'texte'],
  ['texte', 'text', 'texte'],
  ['énoncé', 'prompt', 'texte'],
  ['question', 'question', 'texte'],
  ['phrase', 'sentence', 'texte'],
  ['mot', 'word', 'texte'],
  ['lettre', 'letter', 'texte'],
  ['racine', 'root', 'texte'],
  ['racine lue', 'spokenRoot', 'texte'],
  ['sujet', 'subject', 'texte'],
  ['singulier', 'singular', 'texte'],
  ['pluriel', 'plural', 'texte'],
  ['avant', 'before', 'texte'],
  ['après', 'after', 'texte'],
  ['case', 'slot', 'texte'],
  ['terminaison', 'ending', 'texte'],
  ['cible', 'target', 'texte'],
  ['image', 'image', 'texte'],
  ['lu', 'spoken', 'texte'],
  ['entendu', 'heard', 'texte'],
  ['choix', 'choices', 'liste'],
  ['langue des choix', 'choicesLang', 'texte'],
  ['réponse', 'answer', 'texte'],
  ['juste', 'correct', 'oui-non'],
  ['sens', 'meaning', 'texte'],
  ['règle', 'rule', 'texte'],
  ['indice', 'hint', 'texte'],
  ['astuce', 'tip', 'texte'],
  ['explication', 'explanation', 'texte'],
  ['pourquoi', 'why', 'texte'],
];

const PAR_ETIQUETTE_NIVEAU = new Map(NIVEAU.map((c) => [c[0], c]));
const PAR_ETIQUETTE_ITEM = new Map(ITEM.map((c) => [c[0], c]));
const PAR_CLE_ITEM = new Map(ITEM.map((c) => [c[1], c]));
const SEP = ' · ';

// ---------- Valeurs ----------

function lireValeur(type, v, ligne) {
  if (type === 'nombre') {
    const n = Number(v);
    if (!/^-?\d+(\.\d+)?$/.test(v)) throw new Error(`ligne ${ligne} : nombre attendu, lu « ${v} »`);
    return n;
  }
  if (type === 'oui-non') {
    if (v === 'oui') return true;
    if (v === 'non') return false;
    throw new Error(`ligne ${ligne} : « oui » ou « non » attendu, lu « ${v} »`);
  }
  if (type === 'liste') return v === '' ? null : v.split(SEP).map((x) => lireTexte(x, ligne));
  return lireTexte(v, ligne);
}

/** Les lignes d'un champ : « - étiquette : valeur », ou une sous-liste pour une liste qui ne tient pas en ligne. */
function ecrireChamp(etiquette, type, valeur, retrait) {
  if (type === 'nombre') return [`${retrait}- ${etiquette} : ${valeur}`];
  if (type === 'oui-non') return [`${retrait}- ${etiquette} : ${valeur ? 'oui' : 'non'}`];
  if (type === 'liste') {
    const enLigne = valeur.length > 0 && valeur.every((x) => !x.includes('·') && !aGuillemets(x));
    if (enLigne) return [`${retrait}- ${etiquette} : ${valeur.join(SEP)}`];
    return [`${retrait}- ${etiquette} :`, ...valeur.map((x) => `${retrait}  - ${ecrireTexte(x)}`)];
  }
  return [`${retrait}- ${etiquette} : ${ecrireTexte(valeur)}`];
}

function obtenir(objet, chemin) {
  return chemin.split('.').reduce((o, k) => (o == null ? undefined : o[k]), objet);
}

function poser(objet, chemin, valeur) {
  const cles = chemin.split('.');
  let o = objet;
  for (const k of cles.slice(0, -1)) o = o[k] ??= {};
  o[cles.at(-1)] = valeur;
}

// ---------- Écriture ----------

function ecrireAide(aide, entete, retrait) {
  if (aide.kind !== 'rule-card' || Object.keys(aide).join() !== 'kind,props' || Object.keys(aide.props).join() !== 'title,lines') {
    throw new Error(`aide non prise en charge : ${JSON.stringify(aide)}`);
  }
  return [`${retrait}${entete.replace('%', ecrireTexte(aide.props.title))}`, ...aide.props.lines.map((l) => `${retrait}  - ${ecrireTexte(l)}`)];
}

/** Un nombre écrit en chiffres reste un nombre ; le reste (« ? », « f(x) ») reste un texte. */
const nombreOuTexte = (v) => (/^−?\d+(,\d+)?$/.test(v) ? Number(v.replace('−', '-').replace(',', '.')) : v);
const ecrireNombre = (v) => (typeof v === 'number' ? String(v).replace('-', '−').replace('.', ',') : v);

/** Une fraction écrite « 3/5 » → [3, 5], ou null. */
const fractionLue = (v) => {
  const m = /^(\d+)\/(\d+)$/.exec(v);
  return m && Number(m[2]) > 0 ? [Number(m[1]), Number(m[2])] : null;
};
const SORTES_DE_FIGURE = 'tableau|triangle|droite|graduée|fraction|fractions|diagramme|graphique|angles|angle|plane|solide|image|repère';
const SORTES_ATTENDUES =
  '« tableau … », « triangle … », « droite … », « graduée … », « fraction … », « fractions … », « diagramme … », « graphique … », « angles … », « angle … », « plane … », « solide … », « image … » ou « repère »';

// ---------- Figures de géométrie (src/game/exercises/GeometryAids/) ----------

/** Les mots du contenu → les noms des données, pour chaque sorte de figure de géométrie. */
const MARQUES_TRIANGLE = { isocèle: 'isosceles', équilatéral: 'equilateral' };
const FORMES_PLANES = { rectangle: 'rectangle', carré: 'square', parallélogramme: 'parallelogram', triangle: 'triangle', disque: 'disc', cercle: 'circle', médiatrice: 'bisector', partagé: 'split' };
const SOLIDES = { cubes: 'cubes', cube: 'cube', cylindre: 'cylinder', cône: 'cone', 'prisme-pyramide': 'prism-pyramid' };
const TRANSFORMATIONS = { translation: 'translation', axiale: 'reflection', centrale: 'point-reflection', rotation: 'rotation', homothétie: 'dilation' };
const motDe = (table, valeur) => Object.keys(table).find((k) => table[k] === valeur);

/** Une liste « a · b · c » de cotes : des nombres (virgule française, signe « − ») ou des textes (« ? », « r », « 7a »). */
const cotes = (texte) => texte.split(' · ').map(nombreOuTexte);
/** Une cote d'une figure : un nombre positif, ou un texte non vide. */
const coteValide = (v) => (typeof v === 'number' ? v > 0 : v !== '');
/** Le plus petit angle qu'une figure dessine : plus fermé, sa mesure ne tiendrait pas dans l'angle. */
const ANGLE_MIN = 20;
/** Une mesure d'angle : « ? », ou un nombre de 20 à 180 (exclu). */
const angleValide = (v) => v === '?' || (typeof v === 'number' && v >= ANGLE_MIN && v < 180);

/** Les angles donnés font-ils un triangle ? (Même règle que `triangleAngles` de GeometryAids/TriangleAngles.tsx.) */
function trianglePossible(angles, marques) {
  const n = angles.map((v) => (typeof v === 'number' ? v : undefined));
  if (marques === 'equilateral') return n.every((v) => v === undefined || v === 60);
  if (marques === 'isosceles') {
    n[1] ??= n[2];
    n[2] ??= n[1];
    if (n[0] !== undefined && n[1] === undefined) n[1] = n[2] = (180 - n[0]) / 2;
    if (n[1] !== n[2]) return false;
  }
  const manquants = n.filter((v) => v === undefined).length;
  const somme = n.reduce((s, v) => s + (v ?? 0), 0);
  const traces = n.map((v) => v ?? (manquants === 1 ? 180 - somme : NaN));
  // Les angles calculés pour le tracé ne sont pas plus fermés que ceux qu'on écrit.
  return traces.every((v) => v >= ANGLE_MIN) && Math.abs(traces[0] + traces[1] + traces[2] - 180) < 1e-6;
}

function lireAngles(reste, brut) {
  const [valeurs, marque, ...trop] = reste.split(' / ');
  const angles = cotes(valeurs);
  const marques = marque === undefined ? undefined : MARQUES_TRIANGLE[marque];
  if (trop.length || angles.length !== 3 || !angles.every(angleValide) || (marque !== undefined && !marques) || !trianglePossible(angles, marques))
    throw new Error(
      `figure : un triangle s'écrit « angles 40 · 60 · ? », ses trois angles (« ? » pour un angle à trouver, un seul sauf « / isocèle », où les deux derniers sont égaux, ou « / équilatéral »), de somme 180°, chacun de 20° au moins, lu « ${brut} »`,
    );
  return { kind: 'triangle-angles', props: { angles, ...(marques && { marks: marques }) } };
}

function lireAngle(reste, brut) {
  const m = /^(?:(plat|croisé) )?(.+)$/.exec(reste);
  const layout = m[1] === 'plat' ? 'straight' : m[1] === 'croisé' ? 'crossed' : 'single';
  const values = cotes(m[2]);
  const nombres = values.filter((v) => typeof v === 'number');
  const ok =
    values.every(angleValide) &&
    (layout === 'single'
      ? values.length === 1 && nombres.length === 1
      : values.length === 2 &&
        nombres.length >= 1 &&
        (layout === 'straight' ? (nombres.length === 1 ? 180 - nombres[0] >= ANGLE_MIN : nombres[0] + nombres[1] === 180) : nombres.length === 1 || nombres[0] === nombres[1]));
  if (!ok)
    throw new Error(
      `figure : un angle s'écrit « angle 120 » (un angle seul), « angle plat 130 · ? » (deux angles côte à côte, de somme 180°) ou « angle croisé 70 · ? » (un angle, puis l'angle opposé par le sommet), des mesures de 20 à 180, lu « ${brut} »`,
    );
  return { kind: 'angle', props: { layout, values } };
}

/** Le nombre de cotes de chaque forme plane : [au moins, au plus]. */
const COTES_PLANES = { rectangle: [2, 2], square: [1, 1], parallelogram: [2, 3], triangle: [2, 2], disc: [1, 1], circle: [1, 1], bisector: [2, 2], split: [1, 1] };

function lirePlane(reste, brut) {
  const [tete, ...suite] = reste.split(' / ');
  const espace = tete.indexOf(' ');
  const shape = FORMES_PLANES[espace === -1 ? tete : tete.slice(0, espace)];
  const values = espace === -1 ? [] : cotes(tete.slice(espace + 1));
  const [min, max] = COTES_PLANES[shape] ?? [1, 0];
  let question = {};
  let ok = values.length >= min && values.length <= max && values.every(coteValide);
  if (shape === 'split') {
    const [largeurs, aires] = suite.map(cotes);
    ok &&= suite.length === 2 && largeurs.length >= 2 && aires.length === largeurs.length && [...largeurs, ...aires].every(coteValide);
    if (ok) question = { widths: largeurs, areas: aires };
  } else if (suite.length) {
    const attendue = shape === 'circle' ? 'diamètre ?' : shape === 'bisector' ? undefined : 'aire ?';
    ok &&= suite.length === 1 && suite[0] === attendue;
    question = shape === 'circle' ? { diameter: '?' } : { area: '?' };
  }
  if (!ok)
    throw new Error(
      `figure : une figure plane s'écrit « plane rectangle 5 · 3 / aire ? », « plane carré 6 », « plane parallélogramme 5 · 3 · 4 » (base, hauteur, côté penché au besoin), « plane triangle 8 · 5 » (base, hauteur), « plane disque 5 » ou « plane cercle 4 / diamètre ? » (le rayon), « plane médiatrice 7 · ? » (MA, MB) ou « plane partagé 3 / x · 4 / ? · ? » (la hauteur, les largeurs, les aires), lu « ${brut} »`,
    );
  return { kind: 'plane-figure', props: { shape, values, ...question } };
}

/** Le nombre de cotes de chaque solide (hors pavés de petits cubes) : les valeurs possibles. */
const COTES_SOLIDES = { cube: [1], cylinder: [0, 2], cone: [2], 'prism-pyramid': [1] };

function lireSolide(reste, brut) {
  const [tete, ...suite] = reste.split(' / ');
  const espace = tete.indexOf(' ');
  const solid = SOLIDES[espace === -1 ? tete : tete.slice(0, espace)];
  const values = espace === -1 ? [] : cotes(tete.slice(espace + 1));
  if (solid === 'cubes') {
    const boxes = [values, ...suite.map(cotes)];
    if (boxes.length > 2 || !boxes.every((b) => b.length === 3 && b.every((v) => Number.isInteger(v) && v >= 1 && v <= 8)))
      throw new Error(`figure : des pavés de petits cubes s'écrivent « solide cubes 4 · 2 · 3 » (longueur, largeur, couches, des entiers de 1 à 8), et au besoin « / » une deuxième boîte, lu « ${brut} »`);
    return { kind: 'solid', props: { solid, boxes } };
  }
  const volume = suite.length === 1 && suite[0] === 'volume ?' && (solid === 'cylinder' || solid === 'cone');
  if (!COTES_SOLIDES[solid]?.includes(values.length) || !values.every(coteValide) || suite.length > 1 || (suite.length === 1 && !volume))
    throw new Error(
      `figure : un solide s'écrit « solide cubes 4 · 2 · 3 », « solide cube 1 » (l'arête, en cm), « solide cylindre 3 · 2 / volume ? » (rayon, hauteur, ou rien), « solide cône r · h » ou « solide prisme-pyramide h » (la hauteur), lu « ${brut} »`,
    );
  return { kind: 'solid', props: { solid, ...(values.length && { values }), ...(volume && { volume: '?' }) } };
}

function lireImage(reste, brut) {
  const [tete, ...options] = reste.split(' / ');
  const [nom, quantite, ...trop] = tete.split(' ');
  const transform = TRANSFORMATIONS[nom];
  const amount = quantite === undefined ? undefined : nombreOuTexte(quantite);
  const props = { transform, ...(amount !== undefined && { amount }) };
  let ok =
    transform !== undefined &&
    trop.length === 0 &&
    (transform === 'rotation'
      ? Number.isInteger(amount) && amount % 90 === 0 && amount !== 0 && Math.abs(amount) < 360
      : transform === 'dilation'
        ? amount === 2 || amount === 3
        : amount === undefined);
  // Les options, dans cet ordre : « angle a · b » ou « aire a · b », puis « arc ? » (symétrie centrale).
  let rang = 0;
  for (const option of options) {
    const m = /^(angle|aire|arc) (.+)$/.exec(option);
    const place = m ? { angle: 1, aire: 1, arc: 2 }[m[1]] : 0;
    if (!m || place <= rang) {
      ok = false;
      break;
    }
    rang = place;
    if (m[1] === 'arc') {
      ok &&= transform === 'point-reflection' && m[2] === '?';
      props.arc = '?';
    } else {
      const valeurs = cotes(m[2]);
      ok &&= valeurs.length === 2 && valeurs.every(m[1] === 'angle' ? angleValide : coteValide);
      props[m[1] === 'angle' ? 'angles' : 'areas'] = valeurs;
    }
  }
  if (!ok)
    throw new Error(
      `figure : une figure et son image s'écrivent « image translation », « image axiale », « image centrale », « image rotation 90 » (un multiple de 90) ou « image homothétie 2 » (rapport 2 ou 3), puis au besoin « / angle 50 · ? » ou « / aire 12 · ? » (la figure, puis son image), et « / arc ? » pour la symétrie centrale, lu « ${brut} »`,
    );
  return { kind: 'transformation', props };
}

function lireRepere(reste, brut) {
  const lignes = reste === undefined ? [] : reste.split(' / ');
  const points = lignes.map((l) => {
    const m = /^([A-Z](?:[0-9]|′)?) (.+)$/.exec(l);
    const xy = m ? cotes(m[2]) : [];
    return xy.length === 2 && xy.every((v) => Number.isInteger(v) && Math.abs(v) <= 6) ? { name: m[1], x: xy[0], y: xy[1] } : null;
  });
  if (points.some((p) => !p) || new Set(points.map((p) => p.name)).size !== points.length)
    throw new Error(`figure : un repère s'écrit « repère », vide, ou « repère A 4 · −2 / B 1 · 3 » (un nom en majuscule, puis deux entiers de −6 à 6), lu « ${brut} »`);
  return { kind: 'coordinate-plane', props: { points } };
}

const FIGURES_DE_GEOMETRIE = { angles: lireAngles, angle: lireAngle, plane: lirePlane, solide: lireSolide, image: lireImage, repère: lireRepere };

/** Une figure écrite « tableau … », « triangle … », « angles … », « repère »… (voir l'en-tête du fichier) → sa description en données (`{ kind, props }`). */
export function lireFigure(brut) {
  const m = new RegExp(`^(${SORTES_DE_FIGURE})(?: (.+))?$`).exec(brut);
  if (!m || (m[2] === undefined && m[1] !== 'repère')) throw new Error(`figure : ${SORTES_ATTENDUES} attendu, lu « ${brut} »`);
  if (Object.hasOwn(FIGURES_DE_GEOMETRIE, m[1])) return FIGURES_DE_GEOMETRIE[m[1]](m[2], brut);
  const lignes = m[2].split(' / ').map((l) => l.split(' · '));
  if (m[1] === 'tableau') {
    if (lignes.length < 2 || lignes.some((l) => l.length !== lignes[0].length)) throw new Error(`figure : un tableau a un en-tête et des lignes de même longueur, lu « ${brut} »`);
    return { kind: 'ratio-table', props: { cols: lignes[0], rows: lignes.slice(1).map((l) => l.map(nombreOuTexte)) } };
  }
  if (m[1] === 'triangle') {
    if (lignes.length !== 1 || lignes[0].length !== 3) throw new Error(`figure : un triangle a trois côtés, lu « ${brut} »`);
    const [a, b, c] = lignes[0].map(nombreOuTexte);
    return { kind: 'right-triangle', props: { a, b, c, labels: ['A', 'B', 'C'] } };
  }
  if (m[1] === 'graduée') {
    const [bornes, parts, point] = lignes;
    const [debut, fin] = (bornes ?? []).map(nombreOuTexte);
    const parUnite = parts?.length === 1 ? nombreOuTexte(parts[0]) : undefined;
    const marque = point?.length === 1 ? nombreOuTexte(point[0]) : undefined;
    const entiers = [debut, fin, parUnite].every(Number.isInteger) && bornes.length === 2 && debut < fin && parUnite >= 2;
    const cran = entiers && marque !== undefined ? (marque - debut) * parUnite : 0;
    if (!entiers || lignes.length > 3 || (point && (typeof marque !== 'number' || Math.abs(cran - Math.round(cran)) > 1e-9 || cran < 0 || cran > (fin - debut) * parUnite)))
      throw new Error(`figure : une droite graduée en parts va d'un entier à un plus grand, puis « / » le nombre de parts par unité, et au besoin « / » le point marqué d'un « ? », sur une graduation, lu « ${brut} »`);
    return { kind: 'graduated-line', props: { start: debut, units: fin - debut, perUnit: parUnite, ...(point && { point: Math.round(cran) }) } };
  }
  if (m[1] === 'fraction') {
    const f = fractionLue(m[2]);
    if (!f || f[0] > f[1]) throw new Error(`figure : une fraction s'écrit « 3/5 », au plus une unité, lu « ${brut} »`);
    return { kind: 'fraction-bar', props: { n: f[0], d: f[1] } };
  }
  if (m[1] === 'fractions') {
    const fs = lignes.length === 1 ? lignes[0].map(fractionLue) : [];
    if (fs.length !== 2 || fs.some((f) => !f || f[0] > f[1])) throw new Error(`figure : deux fractions à comparer s'écrivent « 3/5 · 3/10 », au plus une unité chacune, lu « ${brut} »`);
    return { kind: 'compare-bars', props: { a: fs[0], b: fs[1] } };
  }
  if (m[1] === 'diagramme') {
    const valeurs = lignes.at(-1).map(nombreOuTexte);
    if (lignes.length > 2 || valeurs.some((v) => typeof v !== 'number' || v < 0) || (lignes.length === 2 && lignes[0].length !== valeurs.length))
      throw new Error(`figure : un diagramme donne ses noms puis, après « / », autant de nombres positifs, lu « ${brut} »`);
    return { kind: 'bar-list', props: { values: valeurs, ...(lignes.length === 2 && { labels: lignes[0] }) } };
  }
  if (m[1] === 'graphique') {
    const [a, b] = lignes[0].map(nombreOuTexte);
    if (lignes.length !== 1 || lignes[0].length !== 2 || typeof a !== 'number' || typeof b !== 'number')
      throw new Error(`figure : un graphique donne a puis b de la droite y = a × x + b, lu « ${brut} »`);
    return { kind: 'graph', props: { a, b } };
  }
  const [bornes, points] = lignes;
  if (lignes.length > 2 || bornes.length !== 2) throw new Error(`figure : une droite va d'un nombre à un autre, lu « ${brut} »`);
  const [min, max] = bornes.map(nombreOuTexte);
  const marques = (points ?? []).map(nombreOuTexte);
  if (![min, max, ...marques].every((v) => typeof v === 'number') || min >= max) throw new Error(`figure : une droite va d'un nombre à un plus grand, lu « ${brut} »`);
  return { kind: 'number-line', props: { min, max, ...(points && { points: marques }) } };
}

/** L'inverse de `lireFigure`. */
export function ecrireFigure(figure) {
  const { kind, props } = figure;
  const ligne = (l) => l.map(ecrireNombre).join(' · ');
  const cles = Object.keys(props).join();
  if (kind === 'ratio-table' && cles === 'cols,rows') return `tableau ${[props.cols, ...props.rows].map(ligne).join(' / ')}`;
  if (kind === 'right-triangle' && cles === 'a,b,c,labels' && props.labels.join() === 'A,B,C') return `triangle ${ligne([props.a, props.b, props.c])}`;
  if (kind === 'number-line' && ['min,max', 'min,max,points'].includes(cles))
    return `droite ${ligne([props.min, props.max])}${props.points ? ` / ${ligne(props.points)}` : ''}`;
  if (kind === 'graduated-line' && ['start,units,perUnit', 'start,units,perUnit,point'].includes(cles))
    return `graduée ${ligne([props.start, props.start + props.units])} / ${props.perUnit}${props.point === undefined ? '' : ` / ${ecrireNombre(Number((props.start + props.point / props.perUnit).toFixed(6)))}`}`;
  if (kind === 'fraction-bar' && cles === 'n,d') return `fraction ${props.n}/${props.d}`;
  if (kind === 'compare-bars' && cles === 'a,b') return `fractions ${props.a.join('/')} · ${props.b.join('/')}`;
  if (kind === 'bar-list' && ['values', 'values,labels'].includes(cles)) return `diagramme ${props.labels ? `${props.labels.join(' · ')} / ` : ''}${ligne(props.values)}`;
  if (kind === 'graph' && cles === 'a,b') return `graphique ${ligne([props.a, props.b])}`;
  if (kind === 'triangle-angles' && ['angles', 'angles,marks'].includes(cles)) return `angles ${ligne(props.angles)}${props.marks ? ` / ${motDe(MARQUES_TRIANGLE, props.marks)}` : ''}`;
  if (kind === 'angle' && cles === 'layout,values') return `angle ${{ single: '', straight: 'plat ', crossed: 'croisé ' }[props.layout]}${ligne(props.values)}`;
  if (kind === 'plane-figure' && ['shape,values', 'shape,values,area', 'shape,values,diameter', 'shape,values,widths,areas'].includes(cles)) {
    const question = props.widths ? ` / ${ligne(props.widths)} / ${ligne(props.areas)}` : props.area !== undefined ? ` / aire ${props.area}` : props.diameter !== undefined ? ` / diamètre ${props.diameter}` : '';
    return `plane ${motDe(FORMES_PLANES, props.shape)} ${ligne(props.values)}${question}`;
  }
  if (kind === 'solid' && props.solid === 'cubes' && cles === 'solid,boxes') return `solide cubes ${props.boxes.map(ligne).join(' / ')}`;
  if (kind === 'solid' && ['solid', 'solid,values', 'solid,volume', 'solid,values,volume'].includes(cles))
    return `solide ${motDe(SOLIDES, props.solid)}${props.values ? ` ${ligne(props.values)}` : ''}${props.volume !== undefined ? ` / volume ${props.volume}` : ''}`;
  if (kind === 'transformation' && /^transform(,amount)?(,angles|,areas)?(,arc)?$/.test(cles)) {
    const options = [props.angles && `angle ${ligne(props.angles)}`, props.areas && `aire ${ligne(props.areas)}`, props.arc !== undefined && `arc ${props.arc}`].filter(Boolean);
    return `image ${motDe(TRANSFORMATIONS, props.transform)}${props.amount !== undefined ? ` ${ecrireNombre(props.amount)}` : ''}${options.map((o) => ` / ${o}`).join('')}`;
  }
  if (kind === 'coordinate-plane' && cles === 'points') return `repère${props.points.map((p, i) => `${i ? ' /' : ''} ${p.name} ${ligne([p.x, p.y])}`).join('')}`;
  throw new Error(`figure non prise en charge : ${JSON.stringify(figure)}`);
}

function verifierCles(objet, attendues, ou) {
  for (const k of Object.keys(objet)) if (!attendues.has(k)) throw new Error(`${ou} : champ inconnu « ${k} » (à ajouter à scripts/contenu/format.mjs)`);
}

const CLES_NIVEAU = new Set(['id', 'biome', 'type', 'level', 'items', 'feedback', 'reward', 'adaptive', ...NIVEAU.map((c) => c[1].split('.')[0])]);

/** Les champs d'un item, dans l'ordre d'écriture : la clé (si elle n'est pas celle par défaut), les champs du tableau ITEM, l'aide. */
function champsItem(it, defaut) {
  for (const k of Object.keys(it)) if (k !== 'aid' && k !== 'figure' && !PAR_CLE_ITEM.has(k)) throw new Error(`${defaut} : champ inconnu « ${k} » (à ajouter à scripts/contenu/format.mjs)`);
  const cles = ITEM.map((c) => c[1]).filter((k) => it[k] !== undefined && !(k === 'key' && it.key === defaut));
  if (it.figure !== undefined) cles.push('figure');
  if (it.aid !== undefined) cles.push('aid');
  return cles;
}

/** Le premier champ d'un item hors clé : celui qui le nomme, jamais mis en commun. */
export function principal(it) {
  return ITEM.map((c) => c[1]).find((k) => k !== 'key' && it[k] !== undefined);
}

/** Les champs identiques dans tous les items donnés (au moins deux), hors clé et hors champ principal d'un item. */
function champsCommuns(items, exclus) {
  if (items.length < 2) return [];
  const principaux = new Set(items.map(principal));
  const cles = [...ITEM.map((c) => c[1]), 'aid'].filter((k) => k !== 'key' && !principaux.has(k) && !exclus.includes(k));
  return cles.filter((k) => {
    const v = JSON.stringify(items[0][k]);
    return v !== undefined && items.every((it) => JSON.stringify(it[k]) === v);
  });
}

// ---------- Champs déduits ----------

// Pseudo-champs : le mot troué (à l'écriture), les règles « trou lu » et « clé des items » (dans « Pour tous les items »).
const TROUE = '#troue';
const TROU = '#trou';
const CLE = '#cle';

/**
 * « clé des items : mot » : la clé de chaque item est son mot (ou sa lettre) au lieu de « <exercice>-<rang> » ;
 * « clé des items : paragraphe » : p1, p2… (les paragraphes d'un texte à lire).
 */
const CLE_DES_ITEMS = { mot: 'word', lettre: 'letter', paragraphe: null };

function cleParDefaut(cle, it, id, rang) {
  if (cle === 'paragraphe') return `p${rang + 1}`;
  return cle ? it[CLE_DES_ITEMS[cle]] : `${id}-${rang}`;
}

/** Un énoncé à un seul trou « … » : [avant le trou, après le trou], sinon undefined. */
function trouUnique(it) {
  if (typeof it.prompt !== 'string') return undefined;
  const parties = it.prompt.split('…');
  return parties.length === 2 ? parties : undefined;
}

/** Ce que la voix lit à la place du trou de l'énoncé, quand « lu » n'est que l'énoncé ainsi complété. */
function trouLu(it) {
  const parties = trouUnique(it);
  if (!parties || typeof it.spoken !== 'string') return undefined;
  const [a, b] = parties;
  if (it.spoken.length < a.length + b.length || !it.spoken.startsWith(a) || !it.spoken.endsWith(b)) return undefined;
  return it.spoken.slice(a.length, it.spoken.length - b.length);
}

/** Le « trou lu » d'un niveau : la lecture du trou de la plupart de ses items, si tout item à un trou a une lecture. */
function trouDuNiveau(items) {
  const aTrou = items.filter(trouUnique);
  if (aTrou.length < 2 || aTrou.some((it) => it.spoken === undefined)) return undefined;
  const compte = new Map();
  for (const x of aTrou.map(trouLu)) if (x !== undefined) compte.set(x, (compte.get(x) ?? 0) + 1);
  const [meilleur] = [...compte].sort((a, b) => b[1] - a[1]);
  return meilleur && meilleur[1] >= 2 && 2 * meilleur[1] > aTrou.length ? meilleur[0] : undefined;
}

/** La « clé des items » d'un niveau, quand la plupart de ses items ont leur mot (ou leur lettre) pour clé. */
function cleDuNiveau(items) {
  if (items.every((it, i) => it.key === `p${i + 1}`)) return 'paragraphe';
  return ['mot', 'lettre'].find((nom) => {
    const champ = CLE_DES_ITEMS[nom];
    return 2 * items.filter((it) => typeof it[champ] === 'string' && it.key === it[champ]).length > items.length;
  });
}

/** Un mot troué qui s'écrit « en[f]ant » : le mot est exactement avant + réponse + après. */
function estTroue(it) {
  const parts = [it.before, it.answer, it.after];
  return parts.every((s) => typeof s === 'string' && !/[[\]]/.test(s)) && it.answer !== '' && it.word === parts.join('');
}

function ecrireChampItem(it, k) {
  if (k === 'aid') return ecrireAide(it.aid, '- aide « % » :', '');
  if (k === 'figure') return [`- figure : ${ecrireFigure(it.figure)}`];
  if (k === TROUE) return [`- mot troué : ${ecrireTexte(`${it.before}[${it.answer}]${it.after}`)}`];
  const [etiquette, , type] = PAR_CLE_ITEM.get(k);
  return ecrireChamp(etiquette, type, it[k], '');
}

function ecrirePourTous(item, cles, directives) {
  const lignes = [];
  if (directives.trou !== undefined) lignes.push(`- trou lu : ${ecrireTexte(directives.trou)}`);
  if (directives.cle !== undefined) lignes.push(`- clé des items : ${directives.cle}`);
  lignes.push(...cles.flatMap((k) => ecrireChampItem(item, k)));
  return lignes.length ? ['Pour tous les items :', ...lignes, ''] : [];
}

/** Les champs qu'un item écrit : ni ceux donnés pour tous, ni ceux qui se déduisent (clé, lu, mot troué). */
function champsEcrits(it, defaut, partages, trou) {
  let cles = champsItem(it, defaut).filter((k) => !partages.has(k));
  if (trou !== undefined && trouLu(it) === trou) cles = cles.filter((k) => k !== 'spoken');
  if (['word', 'before', 'after', 'answer'].every((k) => cles.includes(k)) && estTroue(it)) {
    cles = cles.filter((k) => !['before', 'after', 'answer'].includes(k)).map((k) => (k === 'word' ? TROUE : k));
  }
  return cles;
}

/** Un champ écrit dans une case de tableau, ou null s'il n'y tient pas (aide, liste en sous-liste). */
function enCase(it, k) {
  if (k === 'aid' || k === 'figure' || (Array.isArray(it[k]) && it[k].length === 0)) return null;
  const lignes = ecrireChampItem(it, k);
  if (lignes.length !== 1) return null;
  const v = lignes[0].slice(lignes[0].indexOf(' : ') + 3);
  return v.length <= LARGEUR_CASE && !v.includes('|') ? v : null;
}

/** Un niveau s'écrit en tableau quand ses items sont courts : au plus 5 colonnes, des cases d'au plus 45 signes. */
const LARGEUR_CASE = 45;
const ORDRE_COLONNES = ITEM.flatMap(([, k]) => (k === 'word' ? ['word', TROUE] : [k]));

function etiquetteColonne(k) {
  return k === TROUE ? 'mot troué' : PAR_CLE_ITEM.get(k)[0];
}

function ecrireItems(items, clesParItem) {
  const colonnes = ORDRE_COLONNES.filter((k) => clesParItem.some((cles) => cles.includes(k)));
  const cases = items.map((it, i) => colonnes.map((k) => (clesParItem[i].includes(k) ? enCase(it, k) : '')));
  // Un champ sans colonne (la figure, l'aide) ne tient pas dans un tableau : les items s'écrivent alors numérotés.
  const sansColonne = clesParItem.some((cles) => cles.some((k) => !colonnes.includes(k)));
  if (!sansColonne && items.length >= 2 && colonnes.length >= 1 && colonnes.length <= 5 && cases.every((ligne) => ligne.every((c) => c !== null))) {
    const rangee = (cellules) => `| ${cellules.join(' | ')} |`;
    return [rangee(colonnes.map(etiquetteColonne)), rangee(colonnes.map(() => '---')), ...cases.map(rangee)];
  }
  const lignes = [];
  items.forEach((it, i) => {
    const cles = [...clesParItem[i]];
    if (cles.length === 0 || cles[0] === 'aid' || (cles[0] !== TROUE && PAR_CLE_ITEM.get(cles[0])[2] === 'liste')) cles.unshift('#');
    const numero = `${i + 1}. `;
    const retrait = ' '.repeat(numero.length);
    cles.forEach((k, j) => {
      const champ = k === '#' ? ['- item'] : ecrireChampItem(it, k);
      if (j === 0) lignes.push(numero + champ[0].slice(2), ...champ.slice(1).map((l) => retrait + l));
      else lignes.push(...champ.map((l) => retrait + l));
    });
  });
  return lignes;
}

/** Une même valeur pour tous les niveaux, ou undefined. */
function commune(valeurs) {
  return valeurs.every((v) => v !== undefined && v === valeurs[0]) ? valeurs[0] : undefined;
}

/**
 * Écrit le Markdown d'une île. `ile` = { id, nom, missions: [{ id, titre }] } (les missions sans exercice sont
 * omises ; un type d'exercice absent de la liste devient une mission à son nom). Ce qui vaut pour tous les niveaux
 * d'une mission, ou pour tous les items d'une mission ou d'un niveau, s'écrit une fois ; ce qui se déduit (clé,
 * lecture du trou, mot troué) ne s'écrit pas ; les items courts s'écrivent en tableau.
 */
export function ecrireIle(ile, exercices, plans = [], demandes = []) {
  verifierCles(ile, new Set(['id', 'name', 'exercises', 'block', 'foreignWords', ...ILE.map((c) => c[1].split('.')[0])]), ile.id);
  const entete = ILE.filter(([, chemin]) => obtenir(ile, chemin) !== undefined).map(([etiquette, chemin]) => `${etiquette} : ${ecrireTexte(obtenir(ile, chemin))}`);
  const lignes = ['---', `lieu : ${ile.id}`, ...entete, '---', '', `# ${ile.name ?? ile.id}`, ''];
  const missions = [...(ile.exercises ?? [])];
  for (const ex of exercices) {
    verifierCles(ex, CLES_NIVEAU, ex.id);
    if (ex.biome !== ile.id) throw new Error(`${ex.id} : île ${ex.biome}, attendue ${ile.id}`);
    if (!missions.some((m) => m.id === ex.type)) missions.push({ id: ex.type, title: ex.type });
  }
  for (const mission of missions) {
    verifierCles(mission, new Set(['id', 'title', ...MISSION.map((c) => c[1])]), `${ile.id}, mission ${mission.id}`);
    const niveaux = exercices.filter((ex) => ex.type === mission.id);
    const champsMission = MISSION.filter(([, k]) => mission[k] !== undefined).flatMap(([etiquette, k, type]) => ecrireChamp(etiquette, type, mission[k], ''));
    if (niveaux.length === 0) {
      lignes.push(`## ${mission.title} · \`${mission.id}\``, '', ...champsMission, ...(champsMission.length ? [''] : []));
      continue;
    }
    const communs = NIVEAU.filter(([, chemin]) => {
      const v = JSON.stringify(obtenir(niveaux[0], chemin));
      return v !== undefined && niveaux.every((ex) => JSON.stringify(obtenir(ex, chemin)) === v);
    });
    const tousItems = niveaux.flatMap((ex) => ex.items);
    const itemsMission = champsCommuns(tousItems, []);
    const trous = niveaux.map((ex) => trouDuNiveau(ex.items));
    const clesDes = niveaux.map((ex) => cleDuNiveau(ex.items));
    const directivesMission = { trou: commune(trous), cle: commune(clesDes) };
    lignes.push(`## ${mission.title} · \`${mission.id}\``, '', ...champsMission);
    for (const [etiquette, chemin, type] of communs) lignes.push(...ecrireChamp(etiquette, type, obtenir(niveaux[0], chemin), ''));
    if (communs.length || champsMission.length) lignes.push('');
    lignes.push(...ecrirePourTous(tousItems[0], itemsMission, directivesMission));
    niveaux.forEach((ex, n) => {
      lignes.push(`### Niveau ${ex.level} · \`${ex.id}\``, '');
      const propres = NIVEAU.filter((def) => obtenir(ex, def[1]) !== undefined && !communs.includes(def));
      for (const [etiquette, chemin, type] of propres) lignes.push(...ecrireChamp(etiquette, type, obtenir(ex, chemin), ''));
      if (propres.length) lignes.push('');
      const itemsNiveau = champsCommuns(ex.items, itemsMission);
      const directives = {
        trou: directivesMission.trou === undefined ? trous[n] : undefined,
        cle: directivesMission.cle === undefined ? clesDes[n] : undefined,
      };
      lignes.push(...ecrirePourTous(ex.items[0], itemsNiveau, directives));
      const partages = new Set([...itemsMission, ...itemsNiveau]);
      const clesParItem = ex.items.map((it, i) => champsEcrits(it, cleParDefaut(clesDes[n], it, ex.id, i), partages, trous[n]));
      lignes.push(...ecrireItems(ex.items, clesParItem), '');
    });
  }
  lignes.push(...ecrireVoix(ile.foreignWords), ...ecrirePlans(ile.id, plans), ...ecrireDemandes(ile.id, demandes));
  return lignes.join('\n');
}

// ---------- Lecture ----------

/** Lit le Markdown d'une île : { ile, missions: [{ id, titre }], biome, exercices, plans, demandes }. */
export function lireIle(md, fichier = 'md') {
  const toutes = md.replace(/^\uFEFF/, '').split(/\r?\n/);
  // « ## La voix », « ## Les plans », puis « ## Les demandes », s'ils y sont, closent le fichier, dans cet ordre :
  // scripts/contenu/voix.mjs, plans.mjs et demandes.mjs les lisent.
  const debutVoix = toutes.indexOf(TITRE_VOIX);
  const debutPlans = toutes.indexOf(TITRE_PLANS);
  const debutDemandes = toutes.indexOf(TITRE_DEMANDES);
  const sections = [
    [TITRE_VOIX, debutVoix],
    [TITRE_PLANS, debutPlans],
    [TITRE_DEMANDES, debutDemandes],
  ].filter(([, n]) => n !== -1);
  for (let k = 1; k < sections.length; k++) {
    if (sections[k][1] < sections[k - 1][1]) throw new Error(`${fichier}, ligne ${sections[k][1] + 1} : « ${sections[k][0]} » vient après « ${sections[k - 1][0]} »`);
  }
  const finDuContenu = sections[0]?.[1] ?? toutes.length;
  const finDe = (debut) => sections.find(([, n]) => n > debut)?.[1];
  const lignes = toutes.slice(0, finDuContenu);
  let ile = null;
  const biome = {};
  const exercices = [];
  const missions = [];
  let mission = null; // { id, titre, champs, items } : mission en cours (items : champs pour tous ses items)
  let ex = null; // exercice en cours
  let pourTousNiveau = null; // champs pour tous les items du niveau en cours
  let item = null; // item en cours (ses propres champs)
  let pourTous = null; // bloc « Pour tous les items » en cours de lecture
  let liste = null; // tableau : sous-liste en cours (liste d'un champ, lignes d'une aide)
  let tableau = null; // tableau d'items en cours : { etiquettes, separe }
  let i = 0;
  const erreur = (m) => new Error(`${fichier}, ligne ${i + 1} : ${m}`);

  // En-tête
  if (lignes[0] !== '---') throw erreur('l’en-tête « --- » manque');
  for (i = 1; i < lignes.length && lignes[i] !== '---'; i++) {
    const m = /^(.+?) : (.+)$/.exec(lignes[i]);
    if (!m) throw erreur(`« étiquette : valeur » attendu dans l’en-tête, lu « ${lignes[i]} »`);
    if (m[1] === 'lieu') {
      if (ile) throw erreur('« lieu » écrit deux fois dans l’en-tête');
      if (!/^[a-z0-9-]+$/.test(m[2])) throw erreur(`identifiant de lieu mal écrit : ${m[2]}`);
      ile = m[2];
      continue;
    }
    const def = PAR_ETIQUETTE_ILE.get(m[1]);
    if (!def) throw erreur(`champ d’en-tête inconnu « ${m[1]} »`);
    if (obtenir(biome, def[1]) !== undefined) throw erreur(`« ${m[1]} » écrit deux fois`);
    poser(biome, def[1], lireTexte(m[2], i + 1));
  }
  if (!ile) throw erreur('« lieu : … » manque dans l’en-tête');
  let nom;

  const finirExercice = () => {
    if (!ex) return;
    ex.items = ex.items.map((propre, n) => {
      const it = { ...structuredClone(mission.items), ...structuredClone(pourTousNiveau), ...propre };
      const { [TROU]: trou, [CLE]: cle } = it;
      delete it[TROU];
      delete it[CLE];
      const parties = trouUnique(it);
      if (trou !== undefined && it.spoken === undefined && parties) it.spoken = parties[0] + trou + parties[1];
      it.key ??= cleParDefaut(cle, it, ex.id, n);
      if (typeof it.key !== 'string') throw new Error(`${fichier}, ${ex.id} : l’item ${n + 1} n’a pas de ${cle} pour faire sa clé ; lui écrire « - clé : … »`);
      return ordonnerItem(it);
    });
    // Une clé par défaut (le rang) peut retomber sur une clé écrite à la main : deux items partageraient alors
    // la même répétition espacée.
    const vus = new Map();
    ex.items.forEach((it, n) => {
      if (vus.has(it.key)) {
        throw new Error(
          `${fichier}, ${ex.id} : les items ${vus.get(it.key) + 1} et ${n + 1} ont la même clé « ${it.key} » ; donner à l’item nouveau une clé à lui (« - clé : … »)`,
        );
      }
      vus.set(it.key, n);
    });
    exercices.push(ex);
    ex = null;
  };

  const champ = (texte, cible, table, ligne) => {
    const aide = table === PAR_ETIQUETTE_ITEM && /^aide « (.+) » :$/.exec(texte);
    if (aide) {
      if (cible.aid !== undefined) throw erreur('aide écrite deux fois');
      cible.aid = { kind: 'rule-card', props: { title: lireTexte(aide[1], ligne), lines: [] } };
      liste = cible.aid.props.lines;
      return;
    }
    const m = /^(.+?) :(?: (.*))?$/.exec(texte);
    if (!m) throw erreur(`« étiquette : valeur » attendu, lu « ${texte} »`);
    const [, etiquette, brut = ''] = m;
    if (table === PAR_ETIQUETTE_ITEM && etiquette === 'figure') {
      if (cible.figure !== undefined) throw erreur('figure écrite deux fois');
      try {
        cible.figure = lireFigure(brut);
      } catch (e) {
        throw erreur(e.message);
      }
      return;
    }
    if (table === PAR_ETIQUETTE_ITEM && (etiquette === 'trou lu' || etiquette === 'clé des items')) {
      if (cible !== pourTous) throw erreur(`« ${etiquette} » va dans « Pour tous les items »`);
      const k = etiquette === 'trou lu' ? TROU : CLE;
      if (cible[k] !== undefined) throw erreur(`« ${etiquette} » écrit deux fois`);
      cible[k] = lireTexte(brut, ligne);
      if (k === CLE && !Object.hasOwn(CLE_DES_ITEMS, cible[k])) throw erreur(`« clé des items » vaut « mot », « lettre » ou « paragraphe », lu « ${cible[k]} »`);
      liste = null;
      return;
    }
    if (table === PAR_ETIQUETTE_ITEM && etiquette === 'mot troué') {
      const t = /^([^[\]]*)\[([^[\]]+)\]([^[\]]*)$/.exec(lireTexte(brut, ligne));
      if (!t) throw erreur(`mot troué attendu sous la forme « en[f]ant », lu « ${brut} »`);
      for (const k of ['word', 'before', 'answer', 'after']) if (cible[k] !== undefined || mission?.items[k] !== undefined || (ex && pourTousNiveau[k] !== undefined)) throw erreur(`« mot troué » donne déjà « ${PAR_CLE_ITEM.get(k)[0]} »`);
      Object.assign(cible, { word: t[1] + t[2] + t[3], before: t[1], answer: t[2], after: t[3] });
      liste = null;
      return;
    }
    const def = table.get(etiquette);
    if (!def) throw erreur(`champ inconnu « ${etiquette} »`);
    const [, chemin, type] = def;
    if (obtenir(cible, chemin) !== undefined) {
      throw erreur(ex && mission && obtenir(mission.champs, chemin) !== undefined ? `« ${etiquette} » est déjà donné pour toute la mission` : `« ${etiquette} » écrit deux fois`);
    }
    if (type === 'liste' && brut === '') {
      liste = [];
      poser(cible, chemin, liste);
      return;
    }
    poser(cible, chemin, lireValeur(type, brut, ligne));
    liste = null;
  };

  for (i++; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.trim() === '') {
      pourTous = liste = tableau = null; // une ligne vide finit le bloc « Pour tous les items », une sous-liste, un tableau
      continue;
    }
    if (l.startsWith('> ')) {
      // Une note pour qui écrit, que le jeu ne lit pas ; jamais au milieu d'un tableau, d'une sous-liste ou d'un bloc.
      if (tableau || liste || pourTous || item) throw erreur('une note « > » va seule, hors d’un item, d’un tableau ou d’un bloc « Pour tous les items »');
      continue;
    }
    if (/^# /.test(l)) {
      if (mission) throw erreur('le titre de l’île va avant la première mission');
      if (nom !== undefined) throw erreur('l’île a un seul titre');
      nom = l.slice(2).trim();
      if (!nom) throw erreur('le titre de l’île est vide');
      continue;
    }
    let m;
    if ((m = /^## (.+) · `([^`]+)`$/.exec(l))) {
      finirExercice();
      if (!/^[a-z0-9-]+$/.test(m[2])) throw erreur(`identifiant de mission mal écrit : ${m[2]}`);
      if (missions.some((x) => x.id === m[2])) throw erreur(`mission « ${m[2]} » écrite deux fois`);
      mission = { id: m[2], titre: m[1], champs: {}, items: {}, def: { id: m[2], title: m[1] } };
      missions.push(mission.def);
      item = pourTous = liste = tableau = null;
      continue;
    }
    if ((m = /^### Niveau (\d+) · `([^`]+)`$/.exec(l))) {
      finirExercice();
      if (!mission) throw erreur('un niveau doit être sous une mission (« ## Titre · `id` »)');
      if (!/^[a-z0-9-]+$/.test(m[2]) || !m[2].startsWith(`${ile}-`)) throw erreur(`identifiant d’exercice mal écrit : ${m[2]} (lettres minuscules, chiffres et tirets, commençant par « ${ile}- »)`);
      ex = { ...structuredClone(mission.champs), id: m[2], biome: ile, type: mission.id, level: Number(m[1]), items: [] };
      pourTousNiveau = {};
      item = pourTous = liste = tableau = null;
      continue;
    }
    if (l.startsWith('#')) throw erreur(`titre inconnu : ${l}`);
    if (!mission) throw erreur('ligne hors d’une mission');
    if (l === 'Pour tous les items :') {
      if (item || ex?.items.length) throw erreur('« Pour tous les items » va avant le premier item');
      pourTous = ex ? pourTousNiveau : mission.items;
      liste = null;
      continue;
    }
    if (l.startsWith('|')) {
      if (!ex) throw erreur('un tableau d’items va sous un niveau');
      if (!l.endsWith('|') || l.length < 2) throw erreur(`ligne de tableau mal fermée : ${l}`);
      const cases = l.slice(1, -1).split('|').map((c) => c.trim());
      if (!tableau) {
        if (ex.items.length) throw erreur('un niveau a un seul tableau d’items, ou des items numérotés, pas les deux');
        for (const e of cases) if (e !== 'mot troué' && !PAR_ETIQUETTE_ITEM.has(e)) throw erreur(`colonne inconnue « ${e} »`);
        if (new Set(cases).size !== cases.length) throw erreur('colonne écrite deux fois');
        tableau = { etiquettes: cases, separe: false };
      } else if (!tableau.separe) {
        if (cases.length !== tableau.etiquettes.length || !cases.every((c) => /^:?-+:?$/.test(c))) throw erreur('ligne « |---|---| » attendue sous les noms des colonnes');
        tableau.separe = true;
      } else {
        if (cases.length !== tableau.etiquettes.length) throw erreur(`${tableau.etiquettes.length} cases attendues, lu ${cases.length} (une valeur ne contient pas « | »)`);
        item = {};
        ex.items.push(item);
        cases.forEach((c, n) => {
          if (c !== '') champ(`${tableau.etiquettes[n]} : ${c}`, item, PAR_ETIQUETTE_ITEM, i + 1);
        });
        liste = item = null;
      }
      pourTous = null;
      continue;
    }
    if ((m = /^(\d+)\. (.*)$/.exec(l))) {
      if (!ex) throw erreur('un item va sous un niveau');
      if (tableau || (ex.items.length && !item)) throw erreur('un niveau a un seul tableau d’items, ou des items numérotés, pas les deux');
      if (Number(m[1]) !== ex.items.length + 1) throw erreur(`item ${ex.items.length + 1} attendu, lu ${m[1]}`);
      item = {};
      ex.items.push(item);
      pourTous = liste = null;
      if (m[2] !== 'item') champ(m[2], item, PAR_ETIQUETTE_ITEM, i + 1);
      continue;
    }
    if (item) {
      const retrait = ' '.repeat(`${ex.items.length}. `.length);
      if ((m = new RegExp(`^${retrait}  - (.*)$`).exec(l)) && liste) {
        liste.push(lireTexte(m[1], i + 1));
        continue;
      }
      if ((m = new RegExp(`^${retrait}- (.*)$`).exec(l))) {
        champ(m[1], item, PAR_ETIQUETTE_ITEM, i + 1);
        continue;
      }
      throw erreur(`ligne d’item mal alignée : ${l}`);
    }
    if ((m = /^ {2}- (.*)$/.exec(l)) && liste) {
      liste.push(lireTexte(m[1], i + 1));
      continue;
    }
    if ((m = /^- (.*)$/.exec(l))) {
      if (pourTous) champ(m[1], pourTous, PAR_ETIQUETTE_ITEM, i + 1);
      else if (ex?.items.length) throw erreur(`un champ du niveau va avant ses items : ${l}`);
      else if (!ex && PAR_ETIQUETTE_MISSION.has(/^(.+?) :/.exec(m[1])?.[1])) champ(m[1], mission.def, PAR_ETIQUETTE_MISSION, i + 1);
      else champ(m[1], ex ?? mission.champs, PAR_ETIQUETTE_NIVEAU, i + 1);
      continue;
    }
    throw erreur(`ligne inattendue : ${l}`);
  }
  finirExercice();
  const ordreMission = ['id', 'title', ...MISSION.map((c) => c[1])];
  const exercises = missions.map((d) => Object.fromEntries(ordreMission.filter((k) => d[k] !== undefined).map((k) => [k, d[k]])));
  // La ressource d'un lieu porte l'identifiant du lieu : elle ne s'écrit pas.
  biome.block = ile;
  const champsIle = Object.fromEntries(['module', 'subject', 'classe', 'description', 'block', 'guardian', 'icon', 'creature'].filter((k) => biome[k] !== undefined).map((k) => [k, biome[k]]));
  const foreignWords = debutVoix === -1 ? undefined : lireVoix(toutes.slice(debutVoix, finDe(debutVoix)), debutVoix, fichier);
  return {
    ile,
    missions: missions.map((d) => ({ id: d.id, titre: d.title })),
    biome: { id: ile, ...(nom === undefined ? {} : { name: nom }), ...champsIle, exercises, ...(foreignWords ? { foreignWords } : {}) },
    exercices: exercices.map(ordonner),
    plans: debutPlans === -1 ? [] : lirePlans(toutes.slice(debutPlans, finDe(debutPlans)), debutPlans, fichier, ile),
    demandes: debutDemandes === -1 ? [] : lireDemandes(toutes.slice(debutDemandes), debutDemandes, fichier, ile),
  };
}

/** L'ordre des champs d'un item dans le JSON produit : celui du tableau ITEM, puis la figure, puis l'aide. */
function ordonnerItem(it) {
  const sortie = {};
  for (const [, k] of ITEM) if (it[k] !== undefined) sortie[k] = it[k];
  if (it.figure !== undefined) sortie.figure = it.figure;
  if (it.aid !== undefined) sortie.aid = it.aid;
  return sortie;
}

/** L'ordre des champs d'un exercice dans le JSON produit. */
const ORDRE = ['id', 'biome', 'type', 'level', 'title', 'lang', 'target', 'instruction', 'programme', 'items', 'perRun', 'feedback', 'reward', 'adaptive'];

function ordonner(ex) {
  const sortie = {};
  for (const k of ORDRE) if (ex[k] !== undefined) sortie[k] = ex[k];
  for (const k of Object.keys(ex)) if (!(k in sortie)) sortie[k] = ex[k];
  return sortie;
}
