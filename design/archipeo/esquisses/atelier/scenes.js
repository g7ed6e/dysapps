// Esquisses des quatre archipels, d'après le pack visuel (design/archipeo/pack-visuel/) et les fiches du directeur
// artistique (version 2) : une île-héros proche et dense, des montagnes bleues étagées, une mer pétrole et turquoise,
// des maisons à colombages aux toits d'ardoise. Tout est dessiné par le code (aucun modèle, aucune texture importés).
import { FONDS, THREE, rng, scene, ile, piton, quai, bateau, brume, fumee, oiseau, mesh, col, lumineux, jitter, couvrir, merPeinte, nuageDoux, arbrePeint, pontPierre, arbre, buisson, rocher, maisonColombage, phareBandes, chaine, tourPierre, echafaudage, batiere, grueBois, tourMetal } from './kit.js';

const lumiereNuit = { sunColor: 0xa8bce8, sunForce: 1.1, amb: 1.3, ambSky: 0x7890c6, ambGround: 0x2e4064 };
const FEN = (nuit) => (nuit ? 0xffd27a : 0x2a3a44);

function vol(sc, n, cx, cy, cz, seed, s = 1.3) {
  const r = rng(seed);
  for (let k = 0; k < n; k++) oiseau(sc, cx + (r() - 0.5) * 36, cy + (r() - 0.5) * 8, cz + (r() - 0.5) * 12, { couleur: 0xf2f2ee, s });
}
function bosquets(sc, m, { n = 40, seed = 1, evite = () => false, minY = 0.8, maxY = 1e9, clair = 0x8aae5a, sombre = 0x3f6a3a, s = 1, minNy = 0.55, sapins = 0.25 } = {}) {
  couvrir(sc, m, { n, seed, evite, minY, maxY, minNy, buissons: 0.3, rochers: 0.05, fleursP: 0.1, bc: 0x769076, rc: 0x8a8f84, s,
    arbre: (sc2, x, y, z, o) => (rng(o.seed)() < sapins
      ? arbre(sc2, x, y, z, { s: o.s * 0.9, sapin: true, c1: 0x456e48, c2: 0x365c3c, seed: o.seed })
      : arbrePeint(sc2, x, y, z, { ...o, s: o.s * (0.7 + rng(o.seed + 1)() * 0.6), clair, sombre })) });
}
function baleine(sc, x, z, { rot = 0, s = 1 } = {}) {
  const g = new THREE.Group();
  const corps = new THREE.SphereGeometry(1, 18, 10);
  corps.scale(5 * s, 1.5 * s, 1.9 * s);
  const p = corps.attributes.position;
  const cs = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = col(p.getY(i) > -0.3 * s ? 0x1e3a5c : 0xe0dccb); cs.set([c.r, c.g, c.b], i * 3); }
  corps.setAttribute('color', new THREE.BufferAttribute(cs, 3));
  const m = new THREE.Mesh(corps, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 }));
  m.rotation.z = 0.3;
  g.add(m);
  const e = new THREE.Mesh(new THREE.RingGeometry(3.5 * s, 6.5 * s, 24), new THREE.MeshBasicMaterial({ color: 0xf2fbfa, transparent: true, opacity: 0.75 }));
  e.rotation.x = -Math.PI / 2; e.scale.set(1.3, 0.6, 1); e.position.y = 0.05; g.add(e);
  g.position.set(x, 0.2, z);
  g.rotation.y = rot;
  sc.add(g);
}
function cumulus(sc, pts) { for (const [x, y, z, s, sd] of pts) nuageDoux(sc, x, y, z, { s, seed: sd, n: 9, couleur: 0xf4f4f0, ombre: 0xb8c6cc, plat: 0.7 }); }
function escalier(sc, a, b, { n = 10, larg = 1.4, pierre = 0xb8b0a2 } = {}) {
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t;
    const m = mesh(new THREE.BoxGeometry(larg, Math.abs(b[1] - a[1]) / n + 0.3, 1.1), pierre);
    m.position.set(x, y - 0.1, z);
    m.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
    sc.add(m);
  }
}
function muret(sc, pts, { pierre = 0x9a9488, h = 0.6 } = {}) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0, z0] = pts[i], [x1, y1, z1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, z1 - z0);
    const m = mesh(new THREE.BoxGeometry(L, h, 0.4), pierre);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2 + h / 2, (z0 + z1) / 2);
    m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    sc.add(m);
  }
}

// Le pont court et rigide du 5e : un tablier de planches, un garde-corps, et à chaque bout un corbeau de bois
// qui s'appuie sur la roche.
function pont(sc, a, b, { bois = 0x9c7c4b, sombre = 0x6e5234, larg = 1.8 } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const g = new THREE.Group();
  const n = Math.floor(L / 0.7);
  for (let i = 0; i < n; i++) g.add(mesh(new THREE.BoxGeometry(0.62, 0.25, larg), i % 3 ? bois : 0xa88a58).translateX(-L / 2 + (i + 0.5) * (L / n)));
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.BoxGeometry(L, 0.35, 0.3), sombre).translateY(-0.25).translateZ((s * larg) / 2));
    g.add(mesh(new THREE.BoxGeometry(L, 0.12, 0.12), sombre).translateY(1.1).translateZ((s * larg) / 2));
    for (let i = 0; i <= Math.floor(L / 2.4); i++) g.add(mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), sombre).translateX(-L / 2 + i * 2.4).translateY(0.55).translateZ((s * larg) / 2));
  }
  for (const s of [-1, 1]) {
    // Le corbeau : une jambe de force oblique sous chaque bout, et un palier de planches posé sur la roche.
    const jf = mesh(new THREE.BoxGeometry(0.35, 4.6, 0.35), sombre);
    jf.position.set(s * (L / 2 - 1.6), -1.9, 0); jf.rotation.z = s * 0.6; g.add(jf);
    g.add(mesh(new THREE.BoxGeometry(4, 0.4, larg + 2), bois).translateX(s * (L / 2 + 1.2)).translateY(-0.1));
  }
  g.position.copy(A).add(B).multiplyScalar(0.5);
  g.rotation.y = -Math.atan2(B.z - A.z, B.x - A.x);
  g.rotation.z = Math.atan2(B.y - A.y, Math.hypot(B.x - A.x, B.z - A.z));
  sc.add(g);
}

export const SCENES = {
  // ---------- 6e : Les Premiers Rivages ----------
  '6e'({ nuit }) {
    const ciel = nuit ? { zenith: 0x1d3262, horizon: 0x40608f, lueur: 0x5b77a3 } : { zenith: 0x4a98d0, horizon: 0xd8eaee, lueur: 0xf6f0de, courbe: 0.5 };
    const S = scene({ ciel, sun: [-60, 70, 40], fog: [120, 560], ...(nuit ? lumiereNuit : { sunColor: 0xffecc8, sunForce: 2.6, amb: 1.35, ambSky: 0xd4e6f0, ambGround: 0x5e7a70 }) });
    const { sc, cam } = S;
    S.renderer.toneMappingExposure = 1.1;
    const T = { roche: 0x9a968a, roche2: 0x7e7a70, herbe: 0x6e9a4e, herbe2: 0x5e8a44, sable: 0xe0b47c };
    const hero = ile(sc, { x: 10, z: -8, rx: 27, rz: 17, h: 4, seed: 3, seg: 64, falaise: 0.12, strates: 0.9, penteHerbe: 0.5, teintes: T,
      pics: [{ x: 11, z: -1, r: 11, h: 11, pente: 0.7 }, { x: -2, z: -5, r: 14, h: 8, pente: 0.9 }] });
    const plage = ile(sc, { x: 22, z: 22, rx: 11, rz: 6, h: 1, seed: 21, seg: 30, plateau: 0.9, bruit: 0.2, teintes: T });
    const ilot = ile(sc, { x: -34, z: 6, rx: 10, rz: 8, h: 5, seed: 8, seg: 34, falaise: 0.18, strates: 0.9, teintes: T });
    const i2 = ile(sc, { x: -20, z: -60, rx: 14, rz: 7, h: 4, seed: 12, seg: 34, falaise: 0.2, strates: 0.9, teintes: T });
    const i3 = ile(sc, { x: 60, z: -70, rx: 16, rz: 8, h: 5, seed: 15, seg: 34, falaise: 0.2, strates: 0.9, teintes: T });
    chaine(sc, { z: -330, h: 55, seed: 1, couleur: 0x8b9f93 });
    chaine(sc, { z: -470, h: 110, seed: 2, couleur: 0xb0cdd1, x0: -600, x1: 600, dents: 16 });
    // Les hauts-fonds du lagon, devant, jusqu'au premier plan.
    FONDS.push((x, z) => -0.12 - Math.hypot((x - 20) / 30, (z - 38) / 16) * 0.25);
    merPeinte(sc, nuit ? { profond: 0x142b38, milieu: 0x1d4a66, lagon: 0x2a6a88, ecume: 0x8aa8c8 } : { profond: 0x145a66, milieu: 0x178078, lagon: 0x1cb9cb, ecume: 0xe1e8cb });
    const h = (x, z) => hero.userData.hauteur(x, z);
    // Le phare sur le promontoire.
    phareBandes(sc, 23, h(23, -8) - 0.3, -8, { h: 15, r: 1.7, allume: nuit });
    // Le village en terrasses, serré, à gauche du phare.
    const r = rng(4);
    const maisons = [[0, 2], [3, 0], [6, -2], [9, 1], [-3, -1], [1, -4], [4, -6], [7, -5], [10, -4], [-2, -8], [2, -10], [6, -10], [13, -6], [-6, 1], [-5, -6], [9, 5], [13, 3], [-8, -3]];
    // Trois terrasses qui montent vers le phare : chaque maison sur un palier de pierre, un toit sur quatre en terre cuite.
    maisons.forEach(([x, z], i) => {
      const t = h(x, z), palier = Math.ceil((t + 0.3) / 1.4) * 1.4;
      const l = 2.1 + r() * 0.7, p = 1.9 + r() * 0.4;
      const m = mesh(new THREE.BoxGeometry(l + 0.9, palier - t + 1.6, p + 0.9), (c) => col(Math.floor(c.y / 0.5) % 2 ? 0xbab2a2 : 0xaaa292));
      m.position.set(x, (palier + t - 1.6) / 2, z); sc.add(m);
      maisonColombage(sc, x, palier, z, { h: 1.35, l, p, etages: 1 + Math.floor(r() * 1.7), toit: i % 4 === 1 ? 0xc0764a : 0x2e505e, toitOmbre: i % 4 === 1 ? 0x8a4a30 : 0x153448, rot: (r() - 0.5) * 0.3, fenetres: FEN(nuit) });
    });
    muret(sc, [[-8, h(-8, 5) , 5], [0, h(0, 6), 6], [8, h(8, 8), 8], [15, h(15, 6), 6]]);
    // L'escalier de pierre vers la plage et le ponton sur pilotis.
    escalier(sc, [16, h(16, 7), 7], [20, 0.9, 17], { n: 12 });
    quai(sc, 30, 0, 30, { l: 12, p: 2, rot: Math.PI / 2 + 0.25, bois: 0xb1815e, pieux: 0x6e4c30 });
    quai(sc, 14, 0, 14, { l: 7, p: 1.8, rot: 0.1, bois: 0xb1815e });
    bosquets(sc, hero, { n: 170, seed: 1, evite: (x, z) => (x > -9 && x < 15 && z > -12 && z < 7) || Math.hypot(x - 23, z + 8) < 3.5 });
    bosquets(sc, hero, { n: 35, seed: 11, s: 0.7, evite: (x, z) => !(x > -9 && x < 15 && z > -12 && z < 7) });
    bosquets(sc, plage, { n: 14, seed: 2 });
    bosquets(sc, ilot, { n: 60, seed: 3, s: 1.1 });
    bosquets(sc, i2, { n: 40, seed: 4 });
    bosquets(sc, i3, { n: 45, seed: 5 });
    maisonColombage(sc, -20, i2.userData.hauteur(-20, -60) - 0.3, -60, { etages: 2, fenetres: FEN(nuit) });
    maisonColombage(sc, 58, i3.userData.hauteur(58, -70) - 0.3, -70, { etages: 1, toit: 0xc0764a, fenetres: FEN(nuit) });
    bateau(sc, 26, 36, { l: 3.4, rot: 2.3, coque: 0x795643, voile: 0xe9e4d6 });
    bateau(sc, -18, 6, { l: 8, rot: -0.3, mats: 2, coque: 0x6e4a30, voile: 0xf0ead8 });
    bateau(sc, 44, -20, { l: 3, rot: 1.2, coque: 0x795643 });
    baleine(sc, 50, 4, { rot: 0.6, s: 1 });
    for (const [x, z] of [[3, 0], [7, -5]]) fumee(sc, x + 0.8, h(x, z) + 5, z, { n: 4, s: 0.4, couleur: 0xf0ece6, vent: [0.5, 0], seed: x + 9, opacite: 0.5 });
    if (!nuit) cumulus(sc, [[-160, 70, -380, 40, 1], [40, 90, -420, 50, 2], [210, 65, -360, 38, 3], [-40, 120, -300, 26, 4]]);
    if (!nuit) vol(sc, 8, 10, 26, 10, 3);
    cam.position.set(-2, 8, 46);
    cam.lookAt(10, 4.5, -4);
    S.render();
  },

  // ---------- 5e : Les Îles Brumeuses ----------
  '5e'({ nuit }) {
    const ciel = nuit ? { zenith: 0x203764, horizon: 0x47648f, lueur: 0x5f79a1 } : { zenith: 0x5f9cc4, horizon: 0xd4e2ea, lueur: 0xeef2f0, courbe: 0.55 };
    const S = scene({ ciel, sun: [60, 60, -20], fog: [60, 330], ...(nuit ? lumiereNuit : { sunColor: 0xf4f6f4, sunForce: 1.8, amb: 1.6, ambSky: 0xd8e6f0, ambGround: 0x6a8a98 }) });
    const { sc, cam } = S;
    S.renderer.toneMappingExposure = 1.08;
    merPeinte(sc, nuit ? { profond: 0x1c4270, milieu: 0x285a86, lagon: 0x3a7090, ecume: 0x8aa2c0 } : { profond: 0x1d6a88, milieu: 0x23789c, lagon: 0x4aa0b0, ecume: 0xd8e6ea });
    const hauts = [];
    const vertB = { clair: 0x7a9e62, sombre: 0x2e5a44 };
    // Une masse rocheuse en gradins : des tambours bruités, de plus en plus étroits, avec des surplombs.
    const masse = (x, z, r, h, seed, { tiers = 5, roche = 0x93a09b, roche2 = 0x7d8a86 } = {}) => {
      const rr = rng(seed);
      let y = -3, rad = r;
      const ms = [];
      for (let i = 0; i < tiers; i++) {
        const th = (h / tiers) * (0.8 + rr() * 0.4);
        const top = rad * (0.78 + rr() * 0.12);
        const g = jitter(new THREE.CylinderGeometry(top * 1.06, rad, th, 10, 3), rad * 0.1, rr);
        const ox = (rr() - 0.5) * rad * 0.3, oz = (rr() - 0.5) * rad * 0.3;
        const m = mesh(g, (c, n) => n.y > 0.6 ? col(0x5a7e50).offsetHSL(0, 0, (rr() - 0.5) * 0.06) : col(Math.floor((c.y + th) / 1.3) % 2 ? roche : roche2).offsetHSL(0, 0, (rr() - 0.5) * 0.04));
        m.position.set(x + ox, y + th / 2, z + oz);
        sc.add(m);
        ms.push(m);
        hauts.push([m, y + th]);
        y += th;
        rad = top * 0.92;
        x += ox * 0.5; z += oz * 0.5;
      }
      return { x, z, y, r: rad };
    };
    const G = masse(-24, -6, 13, 44, 4);
    const D = masse(20, -14, 11, 34, 6);
    const C = masse(-2, 16, 6, 14, 7, { tiers: 3 });
    const F1 = masse(-60, -70, 12, 40, 8, { roche: 0x6895ad, roche2: 0x5f8aa2 });
    const F2 = masse(60, -80, 14, 46, 9, { roche: 0x6895ad, roche2: 0x5f8aa2 });
    const F3 = masse(6, -120, 16, 36, 10, { roche: 0x7aa4bc, roche2: 0x6e9ab2 });
    chaine(sc, { z: -380, h: 90, seed: 3, couleur: 0xa9c4d4, sommet: 0xe6eef2 });
    // La végétation en touffes sur chaque gradin.
    let sd = 1;
    for (const [m, top] of hauts) couvrir(sc, m, { n: 26, minNy: 0.55, minY: top - 0.8, seed: sd++, buissons: 0.4, bc: 0x6a8e5a, s: 0.9, arbre: (sc2, x, y, z, o) => (rng(o.seed)() < 0.5 ? arbre(sc2, x, y, z, { s: o.s * 0.8, sapin: true, c1: 0x3f6a50, c2: 0x335c46, seed: o.seed }) : arbrePeint(sc2, x, y, z, { ...o, ...vertB })) });
    // Les tours de pierre sur les sommets et le pont court, rigide, entre les deux masses.
    tourPierre(sc, D.x, D.y - 0.3, D.z, { l: 3.2, h: 7, fen: FEN(nuit) });
    tourPierre(sc, G.x + 2, G.y - 0.3, G.z, { l: 2.6, h: 5, fen: FEN(nuit) });
    tourPierre(sc, F2.x, F2.y - 0.3, F2.z, { l: 3, h: 6, pierre: 0x8aa4b4, toit: 0x4a6a80 });
    const yp = 24;
    pont(sc, [-17, yp, -6], [13, yp - 1, -12]);
    if (nuit) for (const [x, z] of [[-6, -8], [4, -10]]) { const l = lumineux(new THREE.OctahedronGeometry(0.35, 0), 0xffd866); l.position.set(x, yp + 1.2, z); sc.add(l); const p = new THREE.PointLight(0xffd27a, 8, 14, 1.5); p.position.set(x, yp + 1.2, z); sc.add(p); }
    // Les bancs de brume : des volumes doux en trois couches, qui cachent l'eau et le pied des masses.
    const bc = nuit ? [0x9fb4d0, 0x7a90b0] : [0xf2f5f2, 0xc5d9eb];
    const rb = rng(21);
    for (let k = 0; k < 75; k++) {
      const x = (rb() - 0.5) * 280, z = 40 - rb() * 230, couche = k % 3;
      nuageDoux(sc, x, [1, 7, 13][couche] + rb() * 2, z, { s: 11 + rb() * 10, seed: k, couleur: bc[0], ombre: bc[1], plat: 0.45, n: 8, opacite: 0.86 });
    }
    for (const [yy, o] of [[2, 0.6], [7, 0.45], [12, 0.3]]) brume(sc, 0, yy, -30, { rx: 180, rz: 110, couleur: bc[0], opacite: o, n: 6 });
    if (!nuit) vol(sc, 6, 0, 36, -4, 5, 1.1);
    cam.position.set(-2, 20, 88);
    cam.lookAt(0, 20, -8);
    S.render();
  },

  // ---------- 4e : Les Anciens Ateliers ----------
  '4e'({ nuit }) {
    const ciel = nuit ? { zenith: 0x1c2d5a, horizon: 0x4a5788, lueur: 0x7a6a84 } : { zenith: 0xf29965, horizon: 0xfddf95, lueur: 0xfff0c0, courbe: 0.6, lueurH: 0.08 };
    const S = scene({ ciel, sun: [90, 22, 30], fog: [90, 340], ...(nuit ? lumiereNuit : { sunColor: 0xffc080, sunForce: 3.2, amb: 2.3, ambSky: 0xfcd8b0, ambGround: 0x8a6e64 }) });
    const { sc, cam } = S;
    S.renderer.toneMappingExposure = 1.08;
    // Le soleil bas du couchant, à droite, dans le halo.
    if (!nuit) {
      const d = lumineux(new THREE.CircleGeometry(22, 32), 0xfff4d0); d.material.fog = false; d.position.set(230, 100, -700); d.lookAt(0, 0, 0); sc.add(d);
      const hl = lumineux(new THREE.CircleGeometry(60, 32), 0xffe0a0); hl.material.fog = false; hl.material.transparent = true; hl.material.opacity = 0.35; hl.position.set(232, 100, -705); hl.lookAt(0, 0, 0); sc.add(hl);
    }
    const T = { roche: 0x6f675f, roche2: 0x57504c, herbe: 0x6f8a3a, herbe2: 0x5a7430, sable: 0xb49a78 };
    const ileA = ile(sc, { x: 0, z: -6, rx: 30, rz: 18, h: 5, seed: 6, seg: 56, falaise: 0.12, strates: 1, teintes: T, pics: [{ x: -4, z: -6, r: 14, h: 9, pente: 0.6 }] });
    merPeinte(sc, nuit ? { profond: 0x16305c, milieu: 0x1f4674, lagon: 0x2f5e84, ecume: 0x7a90b0 } : { profond: 0x285f80, milieu: 0x2f7288, lagon: 0x4a9a9a, ecume: 0xf2dcc0 });
    chaine(sc, { z: -320, h: 50, seed: 5, couleur: 0x8a6e78 });
    chaine(sc, { z: -440, h: 80, seed: 6, couleur: 0xc89a88, x0: -600, x1: 600 });
    // Le volcan au fond, petit, à droite, qui fume dans la brume chaude.
    piton(sc, { x: 105, z: -170, r: 16, h: 20, seed: 3, sides: 9, teintes: { roche: 0x6a5048, roche2: 0x5a4440, herbe: 0x6a5048 }, vert: 0 });
    const cr = lumineux(new THREE.CylinderGeometry(2, 1.5, 1, 9), 0xe8662c); cr.position.set(105, 17.8, -170); sc.add(cr);
    fumee(sc, 105, 20, -170, { n: 7, s: 2.2, couleur: nuit ? 0x5a5868 : 0xa88878, vent: [-1.6, 0], seed: 3, opacite: 0.7 });
    const h = (x, z) => ileA.userData.hauteur(x, z);
    // L'atelier-forteresse : des masses de pierre en étages décalés, une tour en haut, des galeries de bois.
    const pierre = [0x534e51, 0x6f473d, 0x5e5759];
    const fen = nuit ? 0xffb050 : 0xe8a050;
    const bloc = (x, y, z, l, hh, p, c, toit = true) => {
      const g = new THREE.Group();
      g.add(mesh(new THREE.BoxGeometry(l, hh, p), (cc, n) => (n.x > 0.5 ? col(c).lerp(col(0xf9c17f), 0.45) : col(c).offsetHSL(0, 0, Math.floor((cc.y + hh / 2) / 1.2) % 2 ? -0.02 : 0.02))).translateY(hh / 2));
      const nf = Math.max(1, Math.floor(l / 2.2));
      for (let e = 0; e < Math.floor(hh / 2.6); e++) for (let i = 0; i < nf; i++) {
        const f = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.1), new THREE.MeshBasicMaterial({ color: (i + e) % 3 === 0 ? fen : 0x2a2224 }));
        f.position.set(-l / 2 + (i + 0.5) * (l / nf), 1.5 + e * 2.6, p / 2 + 0.02);
        g.add(f);
      }
      if (toit) { const t = mesh(batiere(l, p, p * 0.55), 0x3e3636); t.position.y = hh; g.add(t); }
      g.position.set(x, y, z);
      sc.add(g);
      return g;
    };
    const y0 = Math.min(h(-12, -2), h(-2, -6), h(8, -2)) - 1.2;
    bloc(-12, y0 - 2, -2, 10, 9, 8, pierre[0]);
    bloc(-2, y0, -6, 12, 14, 9, pierre[1], false);
    bloc(-2, y0 + 14, -6, 9, 6, 7, pierre[2]);
    bloc(8, y0 - 1, -2, 8, 10, 7, pierre[0]);
    bloc(-8, y0 + 9, -4, 5, 5, 5, pierre[2]);
    // La tour en haut.
    sc.add(mesh(new THREE.CylinderGeometry(2.2, 2.6, 10, 8), pierre[0]).translateX(1).translateY(y0 + 25).translateZ(-7));
    sc.add(mesh(new THREE.ConeGeometry(3, 4, 8), 0x3e3636).translateX(1).translateY(y0 + 32).translateZ(-7));
    const lf = lumineux(new THREE.PlaneGeometry(0.8, 1.4), fen); lf.position.set(1, y0 + 26, -4.7); sc.add(lf);
    // Les échafaudages et les galeries de bois ; la grue de bois à droite.
    echafaudage(sc, -2, y0 + 2, -1.4, { l: 12, h: 12, bois: 0x884d40 });
    echafaudage(sc, 8, y0 + 1, 1.6, { l: 8, h: 8, bois: 0x9c7c4b });
    echafaudage(sc, -13, y0, 2.2, { l: 8, h: 6, bois: 0x884d40 });
    grueBois(sc, 24, h(24, -4) - 0.3, -4, { h: 22, fleche: 12, rot: -2.7 });
    tourMetal(sc, 16, h(16, -12), -12, { h: 12, r: 1, metal: 0x6f473d, cuivre: 0xaf6c55, cheminee: true });
    fumee(sc, 16, h(16, -12) + 15, -12, { n: 5, s: 0.9, couleur: 0x9a8c84, vent: [-0.6, 0], seed: 8, opacite: 0.6 });
    if (nuit) { const p = new THREE.PointLight(0xffa050, 30, 40, 1.2); p.position.set(-2, y0 + 8, 6); sc.add(p); }
    // Le quai de pierre en bas à droite et le feuillage du premier plan à gauche.
    const q = mesh(new THREE.BoxGeometry(24, 2.2, 6), 0x7a7068); q.position.set(22, 0.5, 16); q.rotation.y = -0.2; sc.add(q);
    const rr = rng(4);
    for (let k = 0; k < 6; k++) sc.add(mesh(new THREE.BoxGeometry(1.3, 1.2, 1.3), k % 2 ? 0x884d40 : 0x9c7c4b).translateX(14 + k * 2.4 + rr()).translateY(2.2).translateZ(15 + rr() * 2));
    bateau(sc, -2, 30, { l: 7, rot: -0.2, coque: 0x4e3a2e, voile: 0xe8d0b0, mats: 2 });
    for (const [x, z, s] of [[-30, 34, 2.4], [-24, 38, 1.8], [-36, 26, 2]]) arbrePeint(sc, x, 0.2, z, { s, seed: x, clair: 0x9aa84a, sombre: 0x3e5a2a });
    ile(sc, { x: -32, z: 32, rx: 9, rz: 6, h: 1.5, seed: 17, seg: 20, teintes: T });
    bosquets(sc, ileA, { n: 70, seed: 3, clair: 0x9aa84a, sombre: 0x3e5a2a, evite: (x, z) => x > -18 && x < 26 && z > -14 && z < 6, sapins: 0.2 });
    if (!nuit) cumulus(sc, [[-120, 60, -300, 30, 1], [60, 80, -340, 34, 2]]);
    if (!nuit) vol(sc, 5, -10, 42, -10, 7, 1.2);
    cam.position.set(-6, 7, 66);
    cam.lookAt(0, 14, -6);
    S.render();
  },

  '3e'({ nuit }) { trois({ nuit, horizon: false }); },
  horizon({ nuit }) { trois({ nuit, horizon: true }); },
};

// ---------- 3e : les Îles du Ciel (jusqu'au lot 8), puis L'Horizon ----------
function trois({ nuit, horizon }) {
  const ciel = nuit ? { zenith: 0x243a72, horizon: 0x56689d, lueur: 0x7381b0 }
    : horizon ? { zenith: 0x3a82c8, horizon: 0xf0e0c4, lueur: 0xf8dcaa, lueurH: 0.1, courbe: 0.45 }
    : { zenith: 0x3889d2, horizon: 0xcfe0f0, lueur: 0xeef4f8, courbe: 0.5 };
  const S = scene({ ciel, sun: horizon ? [-70, 26, -30] : [-40, 90, 30], fog: [120, 620], ...(nuit ? lumiereNuit : horizon ? { sunColor: 0xffd8a8, sunForce: 2.7, amb: 1.2, ambSky: 0xc8d8ee, ambGround: 0x5a7090 } : { sunColor: 0xfff4e0, sunForce: 2.5, amb: 1.3, ambSky: 0xd4e4f8, ambGround: 0x7a8cb0 }) });
  const { sc, cam } = S;
  S.renderer.toneMappingExposure = 1.1;
  const R = { roche: 0xb4bac6, roche2: 0x8e9fbc };
  if (horizon) merPeinte(sc, nuit ? { profond: 0x183e78, milieu: 0x22558c, lagon: 0x3a7aa0, ecume: 0x8aa8c8 } : { profond: 0x187593, milieu: 0x1c82a0, lagon: 0x208faa, ecume: 0xf2f0e4 });
  // Le massif enneigé continu, derrière : des crêtes irrégulières, loin et pâles.
  if (!horizon) chaine(sc, { z: -260, h: 70, seed: 31, couleur: 0x9ec0e4, sommet: 0xd6dce7, x0: -320, x1: 320, dents: 19, y: -8 });
  chaine(sc, { z: -400, h: 105, seed: 7, couleur: 0xc9d8ea, sommet: 0xd6dce7, x0: -600, x1: 600, dents: 23, y: horizon ? -1 : -8 });
  // L'île-héros en gradins : des terrasses de roche, des salles de pierre aux toits enneigés, le grand phare au sommet.
  const rr = rng(5);
  const tiers = [[0, 0, 22, 6], [2, -2, 17, 6], [3, -4, 12, 6], [4, -5, 8, 5]];
  let y = horizon ? -1 : -4;
  const terr = [];
  for (const [ox, oz, rad, th] of tiers) {
    const g = jitter(new THREE.CylinderGeometry(rad * 0.94, rad * 1.02, th, 12, 3), rad * 0.06, rr);
    const m = mesh(g, (c, n) => n.y > 0.6 ? col(rr() < 0.45 ? 0x7aa46a : 0xe5ebe3) : c.y > th / 2 - 0.7 ? col(0xe5ebe3) : col(Math.floor((c.y + th) / 1.4) % 2 ? R.roche : R.roche2).offsetHSL(0, 0, (rr() - 0.5) * 0.04));
    m.position.set(ox, y + th / 2, oz);
    sc.add(m);
    terr.push([m, ox, oz, rad, y + th]);
    y += th;
  }
  if (!horizon) {
    // Dessous rocheux en pointe, et le plancher de nuages.
    const c = jitter(new THREE.ConeGeometry(22, 26, 12, 4), 1.2, rng(3)); c.rotateX(Math.PI);
    sc.add(mesh(c, (cc) => col(Math.floor(cc.y / 2) % 2 ? R.roche : R.roche2)).translateY(-4 - 13));
  }
  const toit = 0xa8553a;
  for (const [m, ox, oz, rad, top] of terr.slice(0, 3)) {
    const n = Math.floor(rad / 3);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.1 + (i / n) * Math.PI * 0.95 + rr() * 0.2;
      const d = rad * 0.72;
      const x = ox + Math.cos(a) * d, z = oz + Math.sin(a) * d * 0.9;
      if (z < oz - 2) continue;
      maisonColombage(sc, x, top - 0.1, z, { h: 1.4, l: 2.4, p: 2, etages: 1 + (i % 2), mur: 0xdbdad8, poutre: 0x5a7ba5, toit: 0x2e505e, rot: -a + Math.PI / 2, fenetres: FEN(nuit), neige: true, socle: 0x8a96b4 });
    }
    couvrir(sc, m, { n: 16, minNy: 0.8, minY: top - 0.5, seed: Math.floor(top), buissons: 0.3, bc: 0x5a8a5e, arbre: (sc2, x, yy, z, o) => arbre(sc2, x, yy, z, { s: o.s * 0.8, sapin: true, c1: 0x3f6e56, c2: 0x2f5c48, seed: o.seed }) });
  }
  const [, px, pz, , ptop] = terr[3];
  // L'éperon de roche du sommet, où le phare est planté sur ses salles de pierre.
  const ep = jitter(new THREE.CylinderGeometry(6.5, 7.5, 5, 9, 2), 0.5, rng(12));
  sc.add(mesh(ep, (c, n) => col(n.y > 0.7 ? 0xe5ebe3 : Math.floor(c.y / 1.2) % 2 ? R.roche : R.roche2)).translateX(px).translateY(ptop + 2.3).translateZ(pz));
  phareBandes(sc, px, ptop + 4.6, pz, { h: 13, r: 1.8, salles: 4, pierre: 0xdbdad8, socle: 0xa8b0bc, creme: 0xece6d8, bande: toit, allume: nuit, fen: FEN(nuit) });
  if (!horizon) {
    const nc = nuit ? [0xa8b2d0, 0x8490b4] : [0xffffff, 0xcdd4e0];
    merPeinte(sc, nuit ? { profond: 0x5a6a9a, milieu: 0x6a7aa8, lagon: 0x8a96bc, ecume: 0xa8b2d0, y: -8, reflet: 1 } : { profond: 0xc8d0e2, milieu: 0xdbdde1, lagon: 0xeef0f4, ecume: 0xffffff, y: -8, reflet: 1 });
    const r = rng(9);
    for (let k = 0; k < 90; k++) { const x = (r() - 0.5) * 420, z = 60 - r() * 260; nuageDoux(sc, x, -8 + r() * 5, z, { s: 10 + r() * 12, seed: k, couleur: nc[0], ombre: nc[1], plat: 0.45 }); }
  } else {
    // Le grand port : un quai de pierre au pied de l'île, des pontons de bois qui en partent, des caisses et des lanternes.
    FONDS.push((x, z) => -0.1 - Math.hypot(x / 40, (z - 26) / 12) * 0.3);
    const qp = mesh(new THREE.CylinderGeometry(25, 25.5, 2, 24, 1, false, -Math.PI * 0.05, Math.PI * 1.1), (c) => col(Math.floor(c.y / 0.5) % 2 ? 0xc8c2b4 : 0xb0aa9c));
    qp.position.set(0, 0.2, 0); sc.add(qp);
    for (const [x, z, rot, l] of [[-12, 30, Math.PI / 2 + 0.35, 9], [4, 32, Math.PI / 2 - 0.05, 9], [19, 26, Math.PI / 2 - 0.55, 8]]) quai(sc, x, 0.6, z, { l, p: 1.8, rot, bois: 0xb1815e });
    const rc = rng(41);
    for (let k = 0; k < 9; k++) { const a = 0.2 + k * 0.3 + rc() * 0.1; sc.add(mesh(new THREE.BoxGeometry(1, 0.9, 1), k % 3 ? 0x9c7c4b : 0x884d40).translateX(Math.cos(a) * 23.3).translateY(1.65).translateZ(Math.sin(a) * 23.3)); }
    for (let k = 0; k < 5; k++) {
      const a = 0.35 + k * 0.6, x = Math.cos(a) * 24.4, z = Math.sin(a) * 24.4;
      sc.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 4), 0x3e3636).translateX(x).translateY(2.4).translateZ(z));
      const l = lumineux(new THREE.BoxGeometry(0.45, 0.55, 0.45), nuit ? 0xffd27a : 0xf2e2b0); l.position.set(x, 3.8, z); sc.add(l);
      if (nuit) { const p = new THREE.PointLight(0xffd27a, 6, 10, 1.5); p.position.set(x, 3.8, z); sc.add(p); }
    }
    bateau(sc, -16, 36, { l: 5, rot: -0.3, mats: 2, voile: 0xfff6e2, coque: 0x6e4a30 });
    bateau(sc, 9, 38, { l: 3.5, rot: 2.8, voile: 0xfff6e2, coque: 0x795643 });
    bateau(sc, 30, 34, { l: 2.2, rot: 1.9, voile: 0xfff6e2, coque: 0x795643 });
    baleine(sc, 40, -2, { rot: -0.6, s: 1.3 });
    const loin = { roche: 0x9aa8b8, roche2: 0x8a9aac, herbe: 0x9aa8a8 };
    piton(sc, { x: -110, z: -300, r: 16, h: 10, seed: 21, y: -1, teintes: loin, vert: 0.4 });
    phareBandes(sc, -110, 8, -300, { h: 10, r: 1.5 });
    for (const [x, hh] of [[-50, 36], [-42, 26], [-58, 22]]) piton(sc, { x, z: -320, r: 5, h: hh, seed: x, y: -1, teintes: loin, vert: 0.1 });
    piton(sc, { x: 110, z: -300, r: 22, h: 26, seed: 23, y: -1, teintes: loin, vert: 0, sides: 7 });
    fumee(sc, 111, 25, -300, { n: 6, s: 2.6, couleur: 0xb4a8a4, vent: [1, 0], seed: 4, opacite: 0.6 });
  }
  if (!nuit) cumulus(sc, [[140, 90, -320, 34, 7], [-190, 100, -300, 30, 8]]);
  else {
    const r2 = rng(33);
    for (let k = 0; k < 160; k++) { const a = r2() * Math.PI - Math.PI, e = 0.25 + r2() * 0.7; const st = lumineux(new THREE.OctahedronGeometry(1.2 + r2() * 1.2, 0), 0xf4f0e0); st.position.set(Math.cos(a) * 800 * Math.cos(e), 800 * Math.sin(e), Math.sin(a) * 800 * Math.cos(e)); st.material.fog = false; sc.add(st); }
  }
  if (!nuit) { vol(sc, 4, 20, 40, 10, 9, 1.3); oiseau(sc, -18, 34, 20, { couleur: 0xf2f2ee, s: 3 }); }
  cam.position.set(-6, horizon ? 16 : 18, 100);
  cam.lookAt(2, 20, -10);
  S.render();
}
