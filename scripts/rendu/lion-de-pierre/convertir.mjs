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
// - pose les veines : la crête de huit mèches de devant de la crinière, de la racine vers la pointe, relevées sur la
//   vue de face et suivies de la racine à la pointe sur les arêtes saillantes (le jeu en fait des rubans pliés sur la
//   crête : src/game/world/characters/statues/lion.ts) ;
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
 * Les huit veines, relevées sur la vue de face (depuis −Z, le Lion posé par ce script) : la racine et la pointe de la
 * mèche (x, y). Le script projette les deux sur la pierre, puis suit la crête de la mèche de l'une à l'autre (les arêtes
 * saillantes du maillage). Deux au sommet de la tête, deux par joue (la mèche de la tempe et celle du bas de la
 * joue : à la hauteur des yeux, une veine horizontale près du museau se lirait comme une moustache), deux sur le poitrail.
 */
const VEINES = [
  // le sommet de la tête
  [[0.38, 5.26], [1.02, 5.63]],
  [[-0.67, 5.26], [-1.06, 5.62]],
  // la joue gauche de l'élève (+X) : la mèche de la tempe, puis celle du bas de la joue
  [[0.66, 5.16], [1.2, 5.3]],
  [[0.68, 4.12], [1.64, 3.75]],
  // l'autre joue (−X)
  [[-0.88, 5.28], [-1.38, 5.34]],
  [[-0.8, 4.0], [-1.75, 3.75]],
  // le poitrail
  [[0.32, 3.72], [1.02, 2.82]],
  [[-0.72, 3.72], [-1.26, 2.82]],
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

/** Ce que coûte l'écart d'une arête au tracé relevé (par bloc d'écart, vu de face). */
const ECART = 30;

/** L'écart moyen, vu de face (x, y), d'une arête [a, b] au segment relevé [r, p]. */
function ecartAuTrace(a, b, r, p) {
  const d = (q) => {
    const [ux, uy] = [p[0] - r[0], p[1] - r[1]];
    const t = Math.max(0, Math.min(1, ((q[0] - r[0]) * ux + (q[1] - r[1]) * uy) / (ux * ux + uy * uy)));
    return Math.hypot(q[0] - r[0] - ux * t, q[1] - r[1] - uy * t);
  };
  return (d(a) + d(b) + d([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])) / 3;
}

/** Le sommet d'un triangle le plus proche d'un point. */
function sommetProche(modele, t, p) {
  const s = (k) => modele.sommets.slice(k * 3, k * 3 + 3).map((x) => x / 1000);
  return [0, 1, 2].map((j) => modele.triangles[t * 3 + j]).sort((a, b) => Math.hypot(...sub(s(a), p)) - Math.hypot(...sub(s(b), p)))[0];
}

/** Ce que touche un rayon de face en (x, y), ou, s'il passe à côté de ce modèle-ci, un peu plus vers `vers`. */
function toucher(m, [x, y], vers) {
  for (let k = 0; k < 8; k++) {
    const h = deFace(m, x + (vers[0] - x) * k * 0.05, y + (vers[1] - y) * k * 0.05);
    if (h) return h;
  }
  throw new Error(`Rien devant (${x}, ${y})`);
}

/**
 * Une veine : la crête d'une mèche, de sa racine à sa pointe, en arêtes saillantes du maillage (le plus court chemin
 * qui préfère les arêtes vives et convexes, tournées vers l'élève). Pour chaque arête, ses deux bouts et, pour chacune
 * de ses deux facettes, la direction qui entre dans la facette et sa normale : le jeu y plie un ruban, à cheval sur la
 * crête.
 */
function veine(modele, m, graphe, [racine, pointe]) {
  const s = (k) => modele.sommets.slice(k * 3, k * 3 + 3).map((x) => x / 1000);
  const normale = (t) => {
    const [a, b, c] = [0, 1, 2].map((j) => s(modele.triangles[t * 3 + j]));
    return unit(croix(sub(b, a), sub(c, a)));
  };
  const hr = toucher(m, racine, pointe);
  const hp = toucher(m, pointe, racine);
  const [depart, arrivee] = [sommetProche(modele, hr.triangle, hr.point), sommetProche(modele, hp.triangle, hp.point)];
  const cout = (i, j) => {
    const faces = graphe.aretes.get(i < j ? `${i},${j}` : `${j},${i}`);
    const l = Math.hypot(...sub(s(i), s(j)));
    if (faces.length !== 2) return l * 50;
    const [n1, n2] = faces.map(normale);
    // Convexe : le troisième sommet de l'une est sous le plan de l'autre.
    const autre = modele.triangles.slice(faces[1] * 3, faces[1] * 3 + 3).find((k) => k !== i && k !== j);
    const convexe = n1[0] * sub(s(autre), s(i))[0] + n1[1] * sub(s(autre), s(i))[1] + n1[2] * sub(s(autre), s(i))[2] < -1e-4;
    const vive = 1 - (n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]);
    const deFace_ = (n1[2] + n2[2]) / 2 < 0.2;
    if (!deFace_) return l * 50;
    // Au plus près de la ligne relevée, vue de face : la veine file droit de la racine à la pointe.
    const ecart = ecartAuTrace(s(i), s(j), racine, pointe);
    return l * (convexe ? 1 + 3 * Math.max(0, 0.5 - vive) : 4) * (1 + ECART * ecart);
  };
  // Dijkstra, sur quelques centaines de sommets : une file triée suffit.
  const dist = new Map([[depart, 0]]);
  const avant = new Map();
  const file = [depart];
  const vus = new Set();
  while (file.length) {
    file.sort((a, b) => dist.get(a) - dist.get(b));
    const i = file.shift();
    if (vus.has(i)) continue;
    vus.add(i);
    if (i === arrivee) break;
    for (const j of graphe.voisins[i]) {
      const d = dist.get(i) + cout(i, j);
      if (d < (dist.get(j) ?? Infinity)) {
        dist.set(j, d);
        avant.set(j, i);
        file.push(j);
      }
    }
  }
  const chemin = [arrivee];
  while (chemin[0] !== depart) chemin.unshift(avant.get(chemin[0]));
  const aretes = [];
  for (let k = 0; k + 1 < chemin.length; k++) {
    const [i, j] = [chemin[k], chemin[k + 1]];
    const faces = graphe.aretes.get(i < j ? `${i},${j}` : `${j},${i}`);
    if (faces.length !== 2) throw new Error(`Une veine passe par une arête à ${faces.length} facette(s)`);
    const [A, B] = [s(i), s(j)];
    const plis = faces.flatMap((t) => {
      const n = normale(t);
      const C = s(modele.triangles.slice(t * 3, t * 3 + 3).find((x) => x !== i && x !== j));
      let d = unit(croix(n, sub(B, A)));
      if (d[0] * sub(C, A)[0] + d[1] * sub(C, A)[1] + d[2] * sub(C, A)[2] < 0) d = d.map((x) => -x);
      return [...d, ...n];
    });
    aretes.push([...A, ...B, ...plis].map(mil));
  }
  return { aretes, points: chemin.map(s) };
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
  const veines = avecVeines ? toutes.map((v) => v.aretes) : [];
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
    ' * direct), ceux de lichen et des orbites, et ses veines : pour chaque arête de la crête d’une mèche, de la racine à la',
    ' * pointe, ses deux bouts puis, pour ses deux facettes, la direction qui entre dans la facette et sa normale (18 nombres). */',
    'export interface ModeleDuLion {',
    '  sommets: readonly number[];',
    '  triangles: readonly number[];',
    '  lichen: readonly number[];',
    '  orbites: readonly number[];',
    '  veines: readonly (readonly number[])[];',
    '}',
    '',
    ecrire('LION_DU_DEFI', v1500, `Le Lion du défi, en gros plan (${v1500.triangles.length / 3} triangles, lion-1500.glb) : quatre taches de lichen, huit veines.`),
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
