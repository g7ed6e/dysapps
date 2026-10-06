// npm run rendu:lion : produit src/game/world/characters/statues/lionData.ts, le Lion de pierre (Gardien de la Baie
// des mots, 6e) en données pures, depuis ses deux modèles réduits, à côté de ce script (lion-700.glb, lion-1500.glb,
// tirés de TRELLIS.2 par reduire_lion.py ; fiche : docs/univers/archipeo/modele-lion-de-pierre.md). Le fichier produit
// est commité ; ne pas l'éditer à la main.
// --check : échoue si le fichier ne suit plus les modèles ou les retouches ci-dessous, sans rien écrire.
//
// Ce que fait le script, sans changer la forme :
// - lit le .glb (un maillage, une couleur par facette : pierre ou lichen), le tourne d'un demi-tour (le museau vers
//   −Z, le visage des sentinelles), le pose les pieds en 0, centré, à `HAUTEUR` blocs (la dalle du concept comprise),
//   arrondit les sommets au millième de bloc et soude ceux qui se confondent ;
// - repeint le lichen en trois ou quatre taches (retouche du directeur artistique) : le lichen de TRELLIS.2, épars, est
//   oublié ; jamais sur les crêtes des veines ;
// - pose les veines : quatre segments droits, indépendants du maillage, sur les mèches de la tempe et du bas de la
//   joue, de chaque côté, de la racine vers la pointe, relevés sur la vue de face, posés à plat sur la mèche et levés
//   juste assez pour ne s'enfoncer nulle part (le jeu en fait des bandes plates : src/game/world/characters/statues/lion.ts) ;
// - désigne les orbites : les facettes déjà sombres des yeux, peintes de la couleur qui ne s'allume jamais (sans les
//   creuser).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

const SOURCES = dirname(fileURLToPath(import.meta.url));
const RACINE = join(SOURCES, '..', '..', '..');
const SORTIE = join(RACINE, 'src/game/world/characters/statues/lionData.ts');

/** La hauteur du Lion couché, dalle comprise, en blocs du modèle (décision du mainteneur du 01/10/2026). */
const HAUTEUR = 6;

/**
 * Les quatre veines, relevées sur la vue de face (depuis −Z, le Lion posé par ce script) : la racine et la pointe de la
 * mèche (x, y). Le script projette les deux sur la pierre et tend entre eux un segment droit (directeur artistique,
 * 06/10/2026) : la mèche de la tempe et celle du bas de la joue, de chaque côté ; aucune sur le sommet de la tête ni le
 * poitrail. À la hauteur des yeux, une veine horizontale près du museau se lirait comme une moustache.
 */
const VEINES = [
  // la joue gauche de l'élève (+X) : la mèche de la tempe, puis celle du bas de la joue
  [[0.66, 5.18], [1.36, 5.47]],
  [[0.64, 4.1], [1.32, 3.52]],
  // l'autre joue (−X)
  [[-0.82, 5.15], [-1.45, 5.45]],
  [[-0.8, 4.0], [-1.6, 3.35]],
];

/**
 * Les taches de lichen (retouche du directeur artistique, d'après le concept) : un point de la pierre, relevé de la
 * caméra du défi, et le rayon de la tache, en blocs. La tache part de la facette du point et gagne ses voisines
 * tournées du même côté. À 1 500 triangles, deux sur les mèches de droite (vues de la caméra du défi), une en bas à
 * gauche de la crinière, une grande sur l'épaule ; à 700, la seule tache de l'épaule.
 */
const EPAULE = { centre: [-1.13, 2.1, -0.16], rayon: 0.55 };
const TACHES = {
  1500: [{ centre: [-1.48, 4.06, -1.43], rayon: 0.35 }, { centre: [-1.76, 3.43, -1.86], rayon: 0.35 }, { centre: [1.24, 2.78, -2.53], rayon: 0.4 }, EPAULE],
  700: [EPAULE],
};
/** La distance aux veines en deçà de laquelle une facette ne prend jamais de lichen. */
const LOIN_DES_VEINES = 0.25;

/** Les yeux, sur la vue de face : la facette touchée en ces points devient orbite. */
const YEUX = [
  [0.24, 4.8],
  [-0.66, 4.8],
];

// ---------- Lire un .glb ----------

function lireGlb(chemin) {
  const b = readFileSync(chemin);
  const longueurJson = b.readUInt32LE(12);
  const json = JSON.parse(b.subarray(20, 20 + longueurJson).toString('utf8'));
  const bin = b.subarray(20 + longueurJson + 8);
  const lire = (i) => {
    const a = json.accessors[i];
    const v = json.bufferViews[a.bufferView];
    const n = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
    const taille = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
    const pas = v.byteStride ?? n * taille;
    const debut = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const dv = new DataView(bin.buffer, bin.byteOffset + debut);
    const lu = { 5126: (o) => dv.getFloat32(o, true), 5125: (o) => dv.getUint32(o, true), 5123: (o) => dv.getUint16(o, true), 5121: (o) => dv.getUint8(o) }[a.componentType];
    const out = new Array(a.count * n);
    for (let k = 0; k < a.count; k++) for (let j = 0; j < n; j++) out[k * n + j] = lu(k * pas + j * taille);
    return { valeurs: out, n };
  };
  const prim = json.meshes[0].primitives[0];
  return { positions: lire(prim.attributes.POSITION).valeurs, indices: lire(prim.indices).valeurs };
}

// ---------- Le Lion posé ----------

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const croix = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mil = (v) => Math.round(v * 1000);

/** Le modèle tourné, posé et soudé : sommets en millièmes, triangles (indices). Ses couleurs d'origine sont oubliées. */
function poser(glb) {
  const p = glb.positions;
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3)
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k], p[i + k]);
      mx[k] = Math.max(mx[k], p[i + k]);
    }
  const e = HAUTEUR / (mx[1] - mn[1]);
  const [cx, cz] = [(mn[0] + mx[0]) / 2, (mn[2] + mx[2]) / 2];
  const sommets = [];
  const index = new Map();
  const souder = (i) => {
    // Le demi-tour autour de la verticale (x → −x, z → −z) garde le sens des faces.
    const q = [mil(-(p[i * 3] - cx) * e), mil((p[i * 3 + 1] - mn[1]) * e), mil(-(p[i * 3 + 2] - cz) * e)];
    const cle = q.join(',');
    let k = index.get(cle);
    if (k === undefined) {
      k = sommets.length / 3;
      sommets.push(...q);
      index.set(cle, k);
    }
    return k;
  };
  const triangles = [];
  for (let t = 0; t < glb.indices.length; t += 3) {
    const tri = [0, 1, 2].map((j) => souder(glb.indices[t + j]));
    if (new Set(tri).size < 3) continue;
    const pts = tri.map((k) => sommets.slice(k * 3, k * 3 + 3));
    if (Math.hypot(...croix(sub(pts[1], pts[0]), sub(pts[2], pts[0]))) < 1e-6) continue;
    triangles.push(...tri);
  }
  return { sommets, triangles };
}

/** Un maillage de Three.js du Lion posé, pour projeter sur la pierre (en blocs). */
function maillage({ sommets, triangles }) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(sommets.map((v) => v / 1000), 3));
  g.setIndex(triangles);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
}

/** Ce que touche un rayon tiré de devant (−Z) vers (x, y) : le point, la normale de la facette, son triangle. */
function deFace(m, x, y) {
  const r = new THREE.Raycaster(new THREE.Vector3(x, y, -50), new THREE.Vector3(0, 0, 1));
  const [h] = r.intersectObject(m);
  return h ? { point: h.point.toArray(), normale: h.face.normal.toArray(), triangle: h.faceIndex } : null;
}

/** Les arêtes du maillage : pour chacune (sommets i < j), ses triangles ; et les voisins de chaque sommet. */
function aretesDe({ sommets, triangles }) {
  const aretes = new Map();
  const voisins = Array.from({ length: sommets.length / 3 }, () => new Set());
  for (let t = 0; t < triangles.length / 3; t++)
    for (let k = 0; k < 3; k++) {
      const [i, j] = [triangles[t * 3 + k], triangles[t * 3 + ((k + 1) % 3)]];
      const cle = i < j ? `${i},${j}` : `${j},${i}`;
      aretes.set(cle, [...(aretes.get(cle) ?? []), t]);
      voisins[i].add(j);
      voisins[j].add(i);
    }
  return { aretes, voisins };
}

/** Ce que touche un rayon de face en (x, y), ou, s'il passe à côté de ce modèle-ci, un peu plus vers `vers`. */
function toucher(m, [x, y], vers) {
  for (let k = 0; k < 8; k++) {
    const h = deFace(m, x + (vers[0] - x) * k * 0.05, y + (vers[1] - y) * k * 0.05);
    if (h) return h;
  }
  throw new Error(`Rien devant (${x}, ${y})`);
}

/** La marge entre la pierre et le dessous d'une veine, en blocs : le segment ne s'enfonce nulle part. */
const MARGE = 0.006;
/** La demi-largeur sous laquelle on vérifie que le segment ne s'enfonce pas : celle du serti, un peu élargie. */
const DEMI_LARGEUR_SOUS_LA_VEINE = 0.13;
/** La part de la longueur de sa mèche qu'une veine couvre au moins (directeur artistique, 06/10/2026). */
const PART_DE_LA_MECHE = 0.6;

/** La première pierre que touche un rayon tiré de `depuis` vers `vers` : sa distance, ou l'infini. */
function premiereDistance(m, depuis, vers) {
  const r = new THREE.Raycaster(new THREE.Vector3(...depuis), new THREE.Vector3(...vers));
  const [h] = r.intersectObject(m);
  return h ? h.distance : Infinity;
}

/**
 * La mèche d'un point : la facette touchée de face et ses voisines tournées du même côté (à moins de 30°), de proche
 * en proche, à moins de 1,5 bloc. Rend sa longueur le long de la direction `d`.
 */
function longueurDeLaMeche(modele, graphe, t0, centre, d) {
  const s = (k) => modele.sommets.slice(k * 3, k * 3 + 3).map((x) => x / 1000);
  const normale = (t) => {
    const [a, b, c] = [0, 1, 2].map((j) => s(modele.triangles[t * 3 + j]));
    return unit(croix(sub(b, a), sub(c, a)));
  };
  const n0 = normale(t0);
  const vus = new Set([t0]);
  const file = [t0];
  let [bas, haut] = [Infinity, -Infinity];
  while (file.length) {
    const t = file.shift();
    for (let k = 0; k < 3; k++) {
      const p = s(modele.triangles[t * 3 + k]);
      const x = p[0] * d[0] + p[1] * d[1] + p[2] * d[2];
      [bas, haut] = [Math.min(bas, x), Math.max(haut, x)];
      const [i, j] = [modele.triangles[t * 3 + k], modele.triangles[t * 3 + ((k + 1) % 3)]];
      for (const u of graphe.aretes.get(i < j ? `${i},${j}` : `${j},${i}`)) {
        if (vus.has(u)) continue;
        vus.add(u);
        const nu = normale(u);
        const c = [0, 1, 2].map((a) => [0, 1, 2].reduce((m, j2) => m + s(modele.triangles[u * 3 + j2])[a], 0) / 3);
        if (nu[0] * n0[0] + nu[1] * n0[1] + nu[2] * n0[2] > Math.cos(Math.PI / 6) && Math.hypot(...sub(c, centre)) < 1.5) file.push(u);
      }
    }
  }
  return haut - bas;
}

/**
 * Une veine : un segment droit sur une mèche, de sa racine à sa pointe, indépendant du maillage (directeur artistique,
 * 06/10/2026). Ses deux bouts sont les points de la pierre vus de face ; il est posé à plat, tourné comme la mèche
 * (la moyenne des facettes de ses bouts et de son milieu), puis levé juste assez pour ne s'enfoncer nulle part sous sa
 * largeur. Rend ses deux bouts, sa normale et la direction de sa largeur (12 nombres, en millièmes), et sa part de la
 * longueur de la mèche.
 */
function veine(modele, m, graphe, [racine, pointe]) {
  const hr = toucher(m, racine, pointe);
  const hp = toucher(m, pointe, racine);
  const milieu = toucher(m, [(racine[0] + pointe[0]) / 2, (racine[1] + pointe[1]) / 2], racine);
  const [A, B] = [hr.point, hp.point];
  const d = unit(sub(B, A));
  const somme = [0, 1, 2].map((k) => hr.normale[k] + hp.normale[k] + 2 * milieu.normale[k]);
  const pn = somme[0] * d[0] + somme[1] * d[1] + somme[2] * d[2];
  const n = unit(somme.map((v, k) => v - d[k] * pn));
  const w = unit(croix(d, n));
  // Levé juste assez : sous chaque point de sa largeur, la pierre reste en dessous.
  let leve = 0;
  for (let i = 0; i <= 24; i++)
    for (const c of [-1, 0, 1]) {
      const q = [0, 1, 2].map((k) => A[k] + (B[k] - A[k]) * (i / 24) + w[k] * c * DEMI_LARGEUR_SOUS_LA_VEINE);
      const h = 1 - premiereDistance(m, q.map((v, k) => v + n[k]), n.map((v) => -v));
      if (h > -0.5) leve = Math.max(leve, h);
    }
  leve += MARGE;
  const [A2, B2] = [A, B].map((p) => p.map((v, k) => v + n[k] * leve));
  const longueur = Math.hypot(...sub(B, A));
  const meche = longueurDeLaMeche(modele, graphe, milieu.triangle, milieu.point, d);
  return { veine: [...A2, ...B2, ...n, ...w].map(mil), points: [A2, B2], part: longueur / meche, leve, longueur, meche };
}

/** La distance d'un point à une ligne brisée (en blocs). */
function distanceA(p, ligne) {
  let d = Infinity;
  for (let i = 0; i + 1 < ligne.length; i++) {
    const [a, b] = [ligne[i], ligne[i + 1]];
    const ab = sub(b, a);
    const t = Math.max(0, Math.min(1, (sub(p, a)[0] * ab[0] + sub(p, a)[1] * ab[1] + sub(p, a)[2] * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1)));
    d = Math.min(d, Math.hypot(...sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t])));
  }
  return d;
}

/** Une version du Lion : le modèle posé, son lichen en taches, ses orbites et ses veines. */
function version(fichier, taches, avecVeines) {
  const modele = poser(lireGlb(join(SOURCES, fichier)));
  const m = maillage(modele);
  const graphe = aretesDe(modele);
  const toutes = VEINES.map((t) => veine(modele, m, graphe, t));
  const veines = avecVeines ? toutes.map((v) => v.veine) : [];
  for (const v of toutes) if (v.part < PART_DE_LA_MECHE) throw new Error(`Une veine ne couvre que ${Math.round(v.part * 100)} % de sa mèche (${fichier})`);
  // Le lichen évite la crête des mèches même dans la version sans veines.
  const lignes = toutes.map((v) => v.points);
  const s = (k) => modele.sommets.slice(k * 3, k * 3 + 3).map((x) => x / 1000);
  const centre = (t) => {
    const [a, b, c] = [0, 1, 2].map((j) => s(modele.triangles[t * 3 + j]));
    return [0, 1, 2].map((k) => (a[k] + b[k] + c[k]) / 3);
  };
  const normale = (t) => {
    const [a, b, c] = [0, 1, 2].map((j) => s(modele.triangles[t * 3 + j]));
    return unit(croix(sub(b, a), sub(c, a)));
  };
  const nbTriangles = modele.triangles.length / 3;
  const libre = (t) => lignes.every((l) => distanceA(centre(t), l) > LOIN_DES_VEINES);
  const lichen = new Set();
  for (const tache of taches) {
    // La graine : la facette la plus proche du point relevé ; puis ses voisines, de proche en proche.
    let graine = 0;
    for (let t = 1; t < nbTriangles; t++) if (Math.hypot(...sub(centre(t), tache.centre)) < Math.hypot(...sub(centre(graine), tache.centre))) graine = t;
    const ng = normale(graine);
    const file = [graine];
    const vus = new Set(file);
    while (file.length) {
      const t = file.shift();
      if (!libre(t)) continue;
      lichen.add(t);
      for (let k = 0; k < 3; k++) {
        const [i, j] = [modele.triangles[t * 3 + k], modele.triangles[t * 3 + ((k + 1) % 3)]];
        for (const u of graphe.aretes.get(i < j ? `${i},${j}` : `${j},${i}`)) {
          if (vus.has(u)) continue;
          vus.add(u);
          const nu = normale(u);
          if (Math.hypot(...sub(centre(u), tache.centre)) <= tache.rayon && nu[0] * ng[0] + nu[1] * ng[1] + nu[2] * ng[2] > 0.6) file.push(u);
        }
      }
    }
  }
  const orbites = [...new Set(YEUX.map(([x, y]) => deFace(m, x, y)?.triangle ?? -1))];
  if (orbites.includes(-1)) throw new Error('Un œil hors du modèle');
  return { sommets: modele.sommets, triangles: modele.triangles, lichen: [...lichen].sort((a, b) => a - b), orbites, veines };
}

function produire() {
  const v1500 = version('lion-1500.glb', TACHES[1500], true);
  const v700 = version('lion-700.glb', TACHES[700], false);
  const ecrire = (nom, v, doc) =>
    [
      `/** ${doc} */`,
      `export const ${nom}: ModeleDuLion = {`,
      `  sommets: [${v.sommets.join(',')}],`,
      `  triangles: [${v.triangles.join(',')}],`,
      `  lichen: [${v.lichen.join(',')}],`,
      `  orbites: [${v.orbites.join(',')}],`,
      `  veines: [${v.veines.map((x) => `\n    [${x.flat().join(',')}],`).join('')}${v.veines.length ? '\n  ' : ''}],`,
      `};`,
    ].join('\n');
  return [
    '// Produit par scripts/rendu/lion-de-pierre/convertir.mjs (npm run rendu:lion) depuis ses modèles lion-700.glb et lion-1500.glb :',
    '// ne pas modifier à la main. Le Lion de pierre, couché sur sa dalle, le museau vers −Z, les pieds en 0, en millièmes de bloc.',
    '',
    '/** Un modèle du Lion : ses sommets (x, y, z en millièmes de bloc), ses triangles (trois sommets, face avant dans le sens',
    ' * direct), ceux de lichen et des orbites, et ses veines : pour chacune, un segment droit sur une mèche, sa racine, sa',
    ' * pointe, sa normale et la direction de sa largeur (12 nombres, en millièmes). */',
    'export interface ModeleDuLion {',
    '  sommets: readonly number[];',
    '  triangles: readonly number[];',
    '  lichen: readonly number[];',
    '  orbites: readonly number[];',
    '  veines: readonly (readonly number[])[];',
    '}',
    '',
    ecrire('LION_DU_DEFI', v1500, `Le Lion du défi, en gros plan (${v1500.triangles.length / 3} triangles, lion-1500.glb) : quatre taches de lichen, quatre veines.`),
    '',
    ecrire('LION_DU_MONDE', v700, `Le Lion du monde, sentinelle de la carte (${v700.triangles.length / 3} triangles, lion-700.glb) : le lichen de l’épaule, sans veines.`),
    '',
  ].join('\n');
}

const texte = produire();
if (process.argv.includes('--check')) {
  if (!existsSync(SORTIE) || readFileSync(SORTIE, 'utf8') !== texte) {
    console.error(`✗ ${relative(process.cwd(), SORTIE)} ne suit plus ses modèles : npm run rendu:lion`);
    process.exit(1);
  }
  console.log(`✓ ${relative(process.cwd(), SORTIE)}`);
} else {
  writeFileSync(SORTIE, texte);
  console.log(`Écrit ${relative(process.cwd(), SORTIE)} (${Math.round(texte.length / 1024)} Ko)`);
}
