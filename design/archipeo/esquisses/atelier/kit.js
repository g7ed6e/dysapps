// Atelier d'esquisses : une scène low-poly à facettes dessinée entièrement par le code (aucun modèle, aucune texture).
import * as THREE from './three/build/three.module.js';

export { THREE };

// ---------- Hasard reproductible et bruit ----------
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function hash(x, z, seed) {
  let h = (x * 374761393 + z * 668265263 + seed * 2147483647) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise(x, z, seed = 1) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash(xi, zi, seed), b = hash(xi + 1, zi, seed), c = hash(xi, zi + 1, seed), d = hash(xi + 1, zi + 1, seed);
  const u = s(xf), v = s(zf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, z, seed = 1) => noise(x, z, seed) * 0.6 + noise(x * 2.1, z * 2.1, seed + 7) * 0.28 + noise(x * 4.3, z * 4.3, seed + 13) * 0.12;

export const col = (hex) => new THREE.Color(hex);
const mixc = (a, b, t) => col(a).lerp(col(b), Math.min(1, Math.max(0, t)));

// ---------- Maillage à facettes, couleur par face ----------
// Un seul matériau à couleurs par sommet et ombrage plat : chaque face garde sa couleur, comme le style (b) de R1.
export const facette = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 });

export function paint(geo, colorOf) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let i = 0; i < p.count; i += 3) {
    for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(p, i + k);
    const c = new THREE.Vector3().addVectors(v[0], v[1]).add(v[2]).divideScalar(3);
    const n = new THREE.Vector3().subVectors(v[1], v[0]).cross(new THREE.Vector3().subVectors(v[2], v[0])).normalize();
    const cc = colorOf(c, n, i / 3);
    for (let k = 0; k < 3; k++) cols.set([cc.r, cc.g, cc.b], (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  return g;
}

export function jitter(geo, amt, r, keepY = false) {
  const p = geo.attributes.position;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!seen.has(key)) seen.set(key, [(r() - 0.5) * amt, keepY ? 0 : (r() - 0.5) * amt, (r() - 0.5) * amt]);
    const d = seen.get(key);
    p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
  }
  return geo;
}

export function mesh(geo, colorOf, { mat = facette, shadow = true } = {}) {
  const m = new THREE.Mesh(paint(geo, typeof colorOf === 'function' ? colorOf : () => col(colorOf)), mat);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

// ---------- La scène ----------
export function scene({ ciel, sun = [-40, 50, 30], sunColor, sunForce = 2.4, amb = 1.1, ambSky, ambGround, fog = [120, 420], w = 1600, h = 1000 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.body.appendChild(renderer.domElement);
  const sc = new THREE.Scene();
  sc.fog = new THREE.Fog(ciel.horizon, fog[0], fog[1]);
  // Dôme dégradé : horizon, lueur, zénith.
  const dome = new THREE.SphereGeometry(900, 48, 32);
  const p = dome.attributes.position;
  const cs = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const e = p.getY(i) / 900;
    let c;
    const L = ciel.lueurH ?? 0.05, K = ciel.courbe ?? 0.5;
    if (e < 0) c = col(ciel.horizon);
    else if (e < L) c = mixc(ciel.horizon, ciel.lueur, Math.sin((Math.PI * e) / L));
    else c = mixc(ciel.horizon, ciel.zenith, Math.pow((e - L) / (1 - L), K));
    cs.set([c.r, c.g, c.b], i * 3);
  }
  dome.setAttribute('color', new THREE.BufferAttribute(cs, 3));
  sc.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false })));
  const hemi = new THREE.HemisphereLight(ambSky ?? ciel.zenith, ambGround ?? 0x4a6070, amb);
  sc.add(hemi);
  const sunL = new THREE.DirectionalLight(sunColor ?? 0xffe2b8, sunForce);
  sunL.position.set(...sun);
  sunL.castShadow = true;
  sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 300 });
  sunL.shadow.bias = -0.0008;
  sc.add(sunL);
  const cam = new THREE.PerspectiveCamera(38, w / h, 0.5, 2000);
  return { renderer, sc, cam, render: () => renderer.render(sc, cam) };
}

// ---------- La mer ----------
// Une nappe à facettes : claire près des côtes (lagon), profonde au large.
export function mer(sc, { profond, lagon, ecume = 0xe8f4f2, taille = 900, cotes = [], seed = 3, y = 0 }) {
  const r = rng(seed);
  const g = new THREE.PlaneGeometry(taille, taille, 120, 120);
  g.rotateX(-Math.PI / 2);
  jitter(g, 2.2, r, true);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, y + (r() - 0.5) * 0.35);
  const m = mesh(g, (c) => {
    let d = 1e9;
    for (const k of cotes) d = Math.min(d, Math.hypot(c.x - k[0], c.z - k[1]) - k[2]);
    if (d < 1.4) return mixc(ecume, lagon, 0.35 + r() * 0.2);
    const t = Math.min(1, Math.max(0, d / 14));
    return mixc(lagon, profond, t).offsetHSL(0, 0, (r() - 0.5) * 0.025);
  }, { shadow: false });
  m.receiveShadow = true;
  sc.add(m);
  return m;
}

// ---------- Les îles ----------
// Un relief tiré d'une grille : falloff radial bruité, couleurs par hauteur et par pente.
// Les hauts-fonds de chaque île, pour la couleur de la mer : e > 0 sur la terre, négatif sous l'eau.
export const FONDS = [];
export function ile(sc, { x = 0, z = 0, rx = 14, rz = 12, h = 6, seed = 1, seg = 26, plateau = 0.5, teintes, neige = 1e9, bruit = 0.45, pics = [], penteHerbe = 0.45, falaise = 0, strates = 0 }) {
  const T = Object.assign({ sable: 0xe6d3a0, herbe: 0x72ad44, herbe2: 0x5f9a3c, roche: 0xa49b8c, roche2: 0x867c6f, neige: 0xf1f4f6 }, teintes);
  const r = rng(seed * 31);
  const g = new THREE.PlaneGeometry(rx * 2.6, rz * 2.6, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i), pz = p.getZ(i);
    const d = Math.hypot(px / rx, pz / rz);
    const n = fbm(px * 0.12 + seed, pz * 0.12 - seed, seed);
    let e = 1 - d + (n - 0.5) * bruit * 2;
    let y = e <= 0 ? -3 + e * 4 : Math.min(1, Math.pow(e * 1.6, plateau)) * h * (0.75 + n * 0.5);
    // Une île à falaises : un rebord abrupt, puis un plateau doucement bosselé.
    if (falaise && e > 0) y = e < falaise ? h * 0.8 * Math.pow(e / falaise, 0.7) : h * (0.8 + (e - falaise) * 0.5 + (n - 0.5) * 0.25);
    for (const k of pics) {
      const dd = Math.hypot(px - k.x, pz - k.z) / k.r;
      if (dd < 1) y = Math.max(y, k.h * Math.pow(1 - dd, k.pente ?? 1.1) + (n - 0.5) * 1.5);
    }
    p.setX(i, px + (r() - 0.5) * 0.8);
    p.setZ(i, pz + (r() - 0.5) * 0.8);
    p.setY(i, y);
  }
  FONDS.push((wx, wz) => {
    const px = wx - x, pz = wz - z;
    return 1 - Math.hypot(px / rx, pz / rz) + (fbm(px * 0.12 + seed, pz * 0.12 - seed, seed) - 0.5) * bruit * 2;
  });
  const m = mesh(g, (c, nrm) => {
    const pente = 1 - nrm.y;
    if (c.y < -1.2) return col(T.roche2);
    if (strates && pente > penteHerbe) return col(Math.floor(c.y / strates) % 2 ? T.roche : T.roche2).offsetHSL(0, 0, (r() - 0.5) * 0.05);
    if (c.y > neige - (r() * 1.5) && nrm.y > 0.35) return col(T.neige);
    if (c.y < 0.7) return col(T.sable).offsetHSL(0, 0, (r() - 0.5) * 0.04);
    if (pente > penteHerbe) return col(r() < 0.5 ? T.roche : T.roche2);
    return col(r() < 0.55 ? T.herbe : T.herbe2).offsetHSL(0, 0, (r() - 0.5) * 0.05);
  });
  m.position.set(x, 0, z);
  sc.add(m);
  // Hauteur approchée du sol, pour poser le décor.
  m.userData.hauteur = (wx, wz) => {
    const ray = new THREE.Raycaster(new THREE.Vector3(wx, 200, wz), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObject(m)[0];
    return hit ? hit.point.y : 0;
  };
  return m;
}

// Un piton, une falaise ou un sommet : un cône bruité, à strates.
export function piton(sc, { x, z, r = 4, h = 18, seed = 1, sides = 7, y = -2, teintes = {}, neige = 1e9, vert = 0.25, pench = 0 }) {
  const T = Object.assign({ roche: 0x8f8a80, roche2: 0x736e66, herbe: 0x5f9a3c, neige: 0xf1f4f6 }, teintes);
  const rr = rng(seed * 17);
  const g = new THREE.CylinderGeometry(r * 0.18, r, h, sides, 6, false);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + h / 2) / h;
    const s = 1 + (rr() - 0.5) * 0.35;
    p.setX(i, p.getX(i) * s + pench * t * h * 0.15);
    p.setZ(i, p.getZ(i) * s);
  }
  jitter(g, r * 0.12, rr);
  g.translate(0, h / 2 + y, 0);
  FONDS.push((wx, wz) => 1 - Math.hypot(wx - x, wz - z) / (r * 1.05));
  const m = mesh(g, (c, n) => {
    if (c.y > neige && n.y > -0.2) return col(T.neige);
    if (n.y > 0.55 && rr() < vert * 2.5) return col(T.herbe);
    if (rr() < vert * 0.5 && c.y > h * 0.3) return col(T.herbe);
    return col(Math.floor(c.y / 2.2) % 2 ? T.roche : T.roche2);
  });
  m.position.set(x, 0, z);
  sc.add(m);
  return m;
}

// ---------- Le décor ----------
export function arbre(sc, x, y, z, { s = 1, c1 = 0x5e9a3e, c2 = 0x4a8434, tronc = 0x7a5a3c, sapin = false, seed = 1 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.15 * s, 0.22 * s, 1.2 * s, 5), tronc).translateY(0.6 * s));
  if (sapin) {
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.ConeGeometry((1.3 - k * 0.3) * s, 1.5 * s, 6);
      g.add(mesh(cone, k % 2 ? c1 : c2).translateY((1.5 + k * 0.8) * s));
    }
  } else {
    const ico = jitter(new THREE.IcosahedronGeometry(1.1 * s, 0), 0.4 * s, r);
    g.add(mesh(ico, (c, n) => col(n.y > 0.2 ? c1 : c2)).translateY(1.9 * s));
  }
  g.position.set(x, y, z);
  g.rotation.y = r() * 6;
  sc.add(g);
  return g;
}

export function maison(sc, x, y, z, { l = 2.4, p = 2, h = 1.8, mur = 0xeee4cc, toit = 0xb04e3e, rot = 0, fenetres = null, etages = 1 } = {}) {
  const g = new THREE.Group();
  const H = h * etages;
  g.add(mesh(new THREE.BoxGeometry(l, H, p), (c, n) => col(mur).offsetHSL(0, 0, n.x !== 0 ? -0.06 : 0)).translateY(H / 2));
  const t = new THREE.CylinderGeometry(0, Math.max(l, p) * 0.78, 1.3, 4, 1);
  t.rotateY(Math.PI / 4);
  t.scale(l / Math.max(l, p) * 1.05, 1, p / Math.max(l, p) * 1.05);
  g.add(mesh(t, (c, n) => col(toit).offsetHSL(0, 0, n.x > 0 ? -0.07 : 0)).translateY(H + 0.62));
  if (fenetres) {
    for (let e = 0; e < etages; e++)
      for (const dx of [-l * 0.25, l * 0.25]) {
        const f = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), new THREE.MeshBasicMaterial({ color: fenetres }));
        f.position.set(dx, h * 0.55 + e * h, p / 2 + 0.01);
        g.add(f);
      }
  }
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}

export function phare(sc, x, y, z, { h = 10, r = 1.3, bande = 0xc0392b, blanc = 0xf4efe4, lampe = 0xffe7a0, toit = 0x2c3e58, lumiere = 0, conique = 0.35, socle = 0 } = {}) {
  const g = new THREE.Group();
  const n = 5;
  if (socle) g.add(mesh(new THREE.CylinderGeometry(r * 1.9, r * 2.1, socle, 8), bande).translateY(socle / 2));
  for (let i = 0; i < n; i++) {
    const r0 = r * (1 - (i / n) * conique), r1 = r * (1 - ((i + 1) / n) * conique);
    g.add(mesh(new THREE.CylinderGeometry(r1, r0, h / n, 8), i % 2 ? bande : blanc).translateY((i + 0.5) * (h / n)));
  }
  g.add(mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.3, 8), toit).translateY(h + 0.15));
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 1.1, 8), new THREE.MeshBasicMaterial({ color: lampe }));
  lamp.position.y = h + 0.85;
  g.add(lamp);
  g.add(mesh(new THREE.ConeGeometry(r * 0.8, 1.1, 8), toit).translateY(h + 1.95));
  if (lumiere) {
    const l = new THREE.PointLight(lampe, lumiere, 40, 1.5);
    l.position.y = h + 1;
    g.add(l);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrume(), color: lampe, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
    halo.scale.set(r * 4.5, r * 4.5, 1);
    halo.position.y = h + 0.9;
    g.add(halo);
  }
  g.position.set(x, y, z);
  sc.add(g);
  return g;
}

export function quai(sc, x, y, z, { l = 8, p = 2, rot = 0, bois = 0xa07a4c, pieux = 0x6e4c30 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(l, 0.3, p), bois).translateY(0.4));
  for (let i = 0; i <= Math.floor(l / 2); i++)
    for (const s of [-1, 1]) g.add(mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.4, 5), pieux).translateX(-l / 2 + i * 2).translateZ((s * p) / 2).translateY(-0.6));
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}

export function bateau(sc, x, z, { l = 5, rot = 0, coque = 0x6e4c30, voile = 0xf1e8d4, mats = 1, y = 0 } = {}) {
  const g = new THREE.Group();
  const c = new THREE.CylinderGeometry(l * 0.2, l * 0.12, l, 6, 1);
  c.rotateZ(Math.PI / 2);
  c.scale(1, 0.55, 0.8);
  g.add(mesh(c, coque).translateY(0.35));
  for (let k = 0; k < mats; k++) {
    const dx = mats === 1 ? 0 : -l * 0.2 + k * l * 0.4;
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, l * 0.9, 4), 0x5a3e28).translateX(dx).translateY(l * 0.5));
    const v = new THREE.BufferGeometry();
    v.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, l * 0.7, 0, -l * 0.35, 0.1, 0, 0, 0, 0, -l * 0.35, 0.1, 0, 0, l * 0.7, 0], 3));
    const vm = new THREE.Mesh(paint(v, () => col(voile)), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }));
    vm.position.set(dx + l * 0.05, l * 0.25, 0);
    vm.rotation.y = 0.3;
    vm.castShadow = true;
    g.add(vm);
  }
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}

// Une nappe de brume : des disques plats, doux sur les bords (dégradé dessiné par le code).
let brumeTex = null;
function texBrume() {
  if (brumeTex) return brumeTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  brumeTex = new THREE.CanvasTexture(c);
  return brumeTex;
}
export function brume(sc, x, y, z, { rx = 20, rz = 10, couleur = 0xe8eef0, opacite = 0.55, n = 1 } = {}) {
  for (let k = 0; k < n; k++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(rx * 2, rz * 2),
      new THREE.MeshBasicMaterial({ map: texBrume(), color: couleur, transparent: true, opacity: opacite, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x + k * rx * 0.3, y + k * 0.6, z - k * rz * 0.2);
    m.renderOrder = 2;
    sc.add(m);
  }
}

// De la fumée : des boules à facettes qui montent en s'élargissant.
export function fumee(sc, x, y, z, { n = 7, s = 1.4, couleur = 0x8a8078, vent = [1.2, 0.3], seed = 5, opacite = 0.85 } = {}) {
  const r = rng(seed);
  for (let k = 0; k < n; k++) {
    const g = jitter(new THREE.IcosahedronGeometry(s * (1 + k * 0.35), 0), 0.3 * s, r);
    const m = new THREE.Mesh(
      paint(g, (c, nrm) => col(couleur).offsetHSL(0, 0, nrm.y * 0.08 + k * 0.02)),
      new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, transparent: true, opacity: opacite * (1 - k / (n + 2)), roughness: 1, depthWrite: false }),
    );
    m.position.set(x + vent[0] * k * k * 0.35, y + k * s * 1.3, z + vent[1] * k * k * 0.35);
    sc.add(m);
  }
}

export function nuage(sc, x, y, z, { s = 3, seed = 2, couleur = 0xffffff, ombre = 0xdfe7ef } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const b = jitter(new THREE.IcosahedronGeometry(s * (0.6 + r() * 0.5), 0), 0.25 * s, r);
    const m = new THREE.Mesh(paint(b, (c, n) => col(n.y > 0 ? couleur : ombre)), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x8090a0, emissiveIntensity: 0.35 }));
    m.position.set((k - 2) * s * 0.8, (r() - 0.3) * s * 0.4, (r() - 0.5) * s * 0.6);
    m.scale.y = 0.7;
    g.add(m);
  }
  g.position.set(x, y, z);
  sc.add(g);
  return g;
}

export function oiseau(sc, x, y, z, { s = 0.8, couleur = 0x2b3445 } = {}) {
  const v = new THREE.BufferGeometry();
  v.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -s, s * 0.35, -s * 0.2, -s * 0.2, 0, 0.1, 0, 0, 0, 0.2, 0, 0.1, s, s * 0.35, -s * 0.2], 3));
  const m = new THREE.Mesh(v, new THREE.MeshBasicMaterial({ color: couleur, side: THREE.DoubleSide }));
  m.position.set(x, y, z);
  sc.add(m);
}

// Une passerelle suspendue : un tablier en planches qui plonge au milieu, deux câbles, des suspentes.
export function passerelle(sc, a, b, { creux = 2, bois = 0xa07a4c, corde = 0x4e3a28, n = 18, larg = 1.4 } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(B, A);
  const L = dir.length();
  const ang = Math.atan2(dir.z, dir.x);
  const at = (t) => new THREE.Vector3().lerpVectors(A, B, t).add(new THREE.Vector3(0, -creux * 4 * t * (1 - t), 0));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const q = at(t);
    const pl = mesh(new THREE.BoxGeometry((L / n) * 0.8, 0.15, larg), i % 3 ? bois : 0x8c6a40);
    pl.position.copy(q);
    pl.rotation.y = -ang;
    sc.add(pl);
  }
  const perp = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang)).multiplyScalar(larg / 2);
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 20; i++) pts.push(at(i / 20).add(perp.clone().multiplyScalar(s)).add(new THREE.Vector3(0, 0.9, 0)));
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.06, 4);
    sc.add(new THREE.Mesh(tube, new THREE.MeshStandardMaterial({ color: corde, flatShading: true })));
    for (const t of [0, 1]) {
      const q = at(t).add(perp.clone().multiplyScalar(s));
      sc.add(mesh(new THREE.CylinderGeometry(0.12, 0.15, 2, 5), corde).translateX(q.x).translateY(q.y + 0.6).translateZ(q.z));
    }
  }
}

// Une grue d'atelier : mât en treillis, flèche, contre-flèche, câble et crochet.
export function grue(sc, x, y, z, { h = 14, fleche = 10, rot = 0, metal = 0x5a5f66, accent = 0xc8752a, charge = true } = {}) {
  const g = new THREE.Group();
  const w = 0.9;
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.add(mesh(new THREE.BoxGeometry(0.16, h, 0.16), metal).translateX((dx * w) / 2).translateZ((dz * w) / 2).translateY(h / 2));
  for (let k = 1; k < h / 1.6; k++) {
    const bar = mesh(new THREE.BoxGeometry(w * 1.35, 0.1, 0.1), metal);
    bar.position.set(0, k * 1.6, w / 2);
    bar.rotation.z = k % 2 ? 0.8 : -0.8;
    g.add(bar);
    const bar2 = bar.clone();
    bar2.position.z = -w / 2;
    g.add(bar2);
  }
  g.add(mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4), accent).translateY(h + 0.4));
  g.add(mesh(new THREE.BoxGeometry(fleche, 0.35, 0.5), metal).translateX(fleche / 2 - 0.5).translateY(h + 1.1));
  g.add(mesh(new THREE.BoxGeometry(fleche * 0.35, 0.35, 0.5), metal).translateX(-fleche * 0.17 - 0.5).translateY(h + 1.1));
  g.add(mesh(new THREE.BoxGeometry(1.4, 1.2, 1.2), 0x3d4148).translateX(-fleche * 0.3).translateY(h + 0.4));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 4), metal).translateY(h + 2.1));
  const cable = h * 0.5;
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, cable, 3), 0x2a2a2a).translateX(fleche * 0.75).translateY(h + 1 - cable / 2));
  if (charge) g.add(mesh(new THREE.BoxGeometry(1.4, 1, 1.4), 0x8a643a).translateX(fleche * 0.75).translateY(h + 0.4 - cable));
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}

// Une tour de métal : fût riveté à anneaux, galerie, lanterne ou cheminée.
export function tourMetal(sc, x, y, z, { h = 12, r = 1.4, metal = 0x6b6f76, cuivre = 0xb0703a, feu = null, cheminee = false } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 8), (c, n) => col(Math.floor((c.y + h / 2) / 1.5) % 2 ? metal : 0x5c6067)).translateY(h / 2));
  for (let k = 1; k < 4; k++) g.add(mesh(new THREE.CylinderGeometry(r * 1.02 - k * 0.05, r * 1.02 - k * 0.05, 0.25, 8), cuivre).translateY((k * h) / 4));
  g.add(mesh(new THREE.CylinderGeometry(r * 1.4, r * 1.4, 0.3, 8), cuivre).translateY(h));
  if (cheminee) g.add(mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.45, 3, 6), 0x3d3a3a).translateY(h + 1.5));
  else g.add(mesh(new THREE.ConeGeometry(r * 1.1, 2, 8), cuivre).translateY(h + 1.2));
  if (feu) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.1), new THREE.MeshBasicMaterial({ color: feu }));
    f.position.set(0, h * 0.7, r * 0.9);
    g.add(f);
  }
  g.position.set(x, y, z);
  sc.add(g);
  return g;
}

export function lumineux(geo, couleur) {
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: couleur }));
}

// ---------- La végétation et la vie ----------
export function buisson(sc, x, y, z, { s = 0.6, c = 0x5e9a3e, seed = 1 } = {}) {
  const r = rng(seed);
  const g = jitter(new THREE.IcosahedronGeometry(s, 0), s * 0.3, r);
  g.scale(1, 0.7, 1);
  const m = mesh(g, (cc, n) => col(c).offsetHSL((r() - 0.5) * 0.03, 0, n.y > 0.3 ? 0.03 : -0.05));
  m.position.set(x, y + s * 0.3, z);
  sc.add(m);
  return m;
}
export function rocher(sc, x, y, z, { s = 0.8, c = 0x9a9488, seed = 1 } = {}) {
  const r = rng(seed);
  const g = jitter(new THREE.DodecahedronGeometry(s, 0), s * 0.35, r);
  g.scale(1, 0.6, 1);
  const m = mesh(g, (cc, n) => col(c).offsetHSL(0, 0, n.y > 0.4 ? 0.05 : -0.04));
  m.position.set(x, y, z);
  m.rotation.y = r() * 6;
  sc.add(m);
  return m;
}
export function fleurs(sc, x, y, z, { n = 5, couleurs = [0xf2d04a, 0xe8e0f0, 0xe06a5a, 0xc07ad0], seed = 1, rayon = 1 } = {}) {
  const r = rng(seed);
  for (let k = 0; k < n; k++) {
    const f = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshLambertMaterial({ color: couleurs[Math.floor(r() * couleurs.length)] }));
    f.position.set(x + (r() - 0.5) * rayon * 2, y + 0.18, z + (r() - 0.5) * rayon * 2);
    sc.add(f);
  }
}
// Un peuplier, un feuillu en deux boules, un sapin : trois silhouettes d'arbres pour varier les bosquets.
export function arbreVarie(sc, x, y, z, { s = 1, seed = 1, palette = [0x5e9a3e, 0x4a8434, 0x6fae48, 0x3f7a36], sapins = 0.25, peupliers = 0.15, sapin = [0x3a7852, 0x2f6a46] } = {}) {
  const r = rng(seed * 7 + 3);
  const t = r();
  const c1 = palette[Math.floor(r() * palette.length)], c2 = palette[Math.floor(r() * palette.length)];
  if (t < sapins) return arbre(sc, x, y, z, { s: s * 0.9, sapin: true, c1: sapin[0], c2: sapin[1], seed });
  if (t < sapins + peupliers) {
    const g = new THREE.Group();
    g.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1 * s, 5), 0x7a5a3c).translateY(0.5 * s));
    const c = jitter(new THREE.IcosahedronGeometry(0.8 * s, 0), 0.2 * s, r);
    c.scale(0.8, 2.3, 0.8);
    g.add(mesh(c, (cc, n) => col(n.y > 0 ? c1 : c2)).translateY(2.6 * s));
    g.position.set(x, y, z);
    sc.add(g);
    return g;
  }
  const g = arbre(sc, x, y, z, { s, c1, c2, seed });
  const b = jitter(new THREE.IcosahedronGeometry(0.75 * s, 0), 0.3 * s, r);
  g.add(mesh(b, (cc, n) => col(n.y > 0.2 ? c2 : c1)).translateY(1.5 * s).translateX(0.7 * s).translateZ(0.3 * s));
  return g;
}
// Couvre un maillage de végétation : tire des faces orientées vers le haut (pente douce), entre deux hauteurs.
export function couvrir(sc, m, { n = 60, minNy = 0.75, minY = 1, maxY = 1e9, seed = 1, arbre: poseArbre = arbreVarie, opts = {}, buissons = 0.4, rochers = 0.08, fleursP = 0.1, s = 1, evite = () => false, bc = 0x5e9a3e, rc = 0x9a9488 } = {}) {
  m.updateMatrixWorld(true);
  const p = m.geometry.attributes.position;
  const r = rng(seed * 13 + 1);
  const faces = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
    b.fromBufferAttribute(p, i + 1).applyMatrix4(m.matrixWorld);
    c.fromBufferAttribute(p, i + 2).applyMatrix4(m.matrixWorld);
    const nn = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    if (nn.y < minNy) continue;
    faces.push([a.clone(), b.clone(), c.clone()]);
  }
  let posed = 0;
  for (let k = 0; k < n * 4 && posed < n && faces.length; k++) {
    const [A, B, C] = faces[Math.floor(r() * faces.length)];
    let u = r(), v = r();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const q = A.clone().add(B.clone().sub(A).multiplyScalar(u)).add(C.clone().sub(A).multiplyScalar(v));
    if (q.y < minY || q.y > maxY || evite(q.x, q.z)) continue;
    posed++;
    const t = r();
    if (t < rochers) rocher(sc, q.x, q.y, q.z, { s: 0.5 + r() * 0.6, c: rc, seed: k });
    else if (t < rochers + buissons) {
      buisson(sc, q.x, q.y - 0.1, q.z, { s: (0.4 + r() * 0.5) * s, c: bc, seed: k });
      if (r() < fleursP * 3) fleurs(sc, q.x, q.y, q.z, { n: 4, seed: k, rayon: 0.9 });
    } else poseArbre(sc, q.x, q.y - 0.15, q.z, { s: s * (0.65 + r() * 0.55), seed: k + seed * 100, ...opts });
  }
}
// Une cascade : un ruban d'eau claire et un bouillon d'écume au pied.
export function cascade(sc, x, yHaut, yBas, z, { l = 1.4, rot = 0, eau = 0xcfe9f0, ecume = 0xf4fafb } = {}) {
  const h = yHaut - yBas;
  const g = new THREE.Group();
  const ruban = jitter(new THREE.BoxGeometry(l, h, 0.3, 1, 5, 1), 0.15, rng(Math.floor(x * 10)));
  const rm = new THREE.Mesh(paint(ruban, (c) => col(Math.floor((c.y + h) * 1.3) % 2 ? eau : 0xf2fafc)), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85 }));
  rm.position.y = yBas + h / 2;
  g.add(rm);
  const b = jitter(new THREE.IcosahedronGeometry(l * 0.9, 0), 0.3, rng(2));
  b.scale(1.3, 0.5, 1);
  g.add(mesh(b, ecume, { shadow: false }).translateY(yBas));
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  sc.add(g);
}

// Accroche de la végétation aux flancs d'un piton : des rayons horizontaux vers l'axe, à des hauteurs tirées au hasard.
export function couvrirFlancs(sc, m, { x, z, y0 = 3, y1 = 30, n = 60, seed = 1, opts = {}, buissons = 0.4, bc = 0x5f9064, s = 0.8, evite = () => false } = {}) {
  m.updateMatrixWorld(true);
  const r = rng(seed * 29 + 5);
  const ray = new THREE.Raycaster();
  let posed = 0;
  for (let k = 0; k < n * 3 && posed < n; k++) {
    const a = r() * Math.PI * 2, y = y0 + r() * (y1 - y0);
    const o = new THREE.Vector3(x + Math.cos(a) * 60, y, z + Math.sin(a) * 60);
    ray.set(o, new THREE.Vector3(-Math.cos(a), 0, -Math.sin(a)));
    const hit = ray.intersectObject(m)[0];
    if (!hit || evite(hit.point.x, hit.point.z, a)) continue;
    posed++;
    const p = hit.point.clone().add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.3));
    // Une petite corniche sous chaque touffe, pour qu'elle ne flotte pas.
    const c = mesh(new THREE.CylinderGeometry(0.9 * s, 0.4 * s, 0.5, 5), 0x6a7a66);
    c.position.set(p.x, p.y - 0.2, p.z);
    sc.add(c);
    if (r() < buissons) buisson(sc, p.x, p.y, p.z, { s: 0.6 * s, c: bc, seed: k });
    else arbreVarie(sc, p.x, p.y, p.z, { s: s * (0.6 + r() * 0.4), seed: k + seed * 50, ...opts });
  }
}

// ---------- La mer peinte ----------
// Une nappe lisse (dégradés doux, pas de facettes) : écume blanche au bord, hauts-fonds turquoise, bleu profond au large.
export function merPeinte(sc, { profond = 0x1668a8, milieu = 0x1fa0c4, lagon = 0x5fdad0, ecume = 0xf2fbfa, taille = 1400, y = 0, seg = 260, reflet = 0.35 } = {}) {
  const g = new THREE.PlaneGeometry(taille, taille, seg, seg);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const cols = new Float32Array(p.count * 3);
  const r = rng(77);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    let e = -9;
    for (const f of FONDS) e = Math.max(e, f(x, z));
    let c;
    if (e > -0.05) c = col(ecume);
    else if (e > -0.1) c = mixc(ecume, lagon, (-e - 0.05) / 0.05);
    else if (e > -0.4) c = mixc(lagon, milieu, (-e - 0.1) / 0.3);
    else c = mixc(milieu, profond, Math.min(1, (-e - 0.4) / 0.9));
    c.offsetHSL(0, 0, (r() - 0.5) * 0.015);
    cols.set([c.r, c.g, c.b], i * 3);
    p.setY(i, y + (r() - 0.5) * 0.12);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: reflet, metalness: 0.05 }));
  m.receiveShadow = true;
  sc.add(m);
  return m;
}

// Un nuage peint : des boules lisses, blanches, éclairées par-dessus.
export function nuageDoux(sc, x, y, z, { s = 8, seed = 1, n = 7, couleur = 0xffffff, ombre = 0xc8d6e6, plat = 0.55, opacite = 1 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  for (let k = 0; k < n; k++) {
    const rad = s * (0.45 + r() * 0.55) * (1 - Math.abs(k - n / 2) / n);
    const b = new THREE.SphereGeometry(rad, 14, 10);
    const pp = b.attributes.position;
    const cs = new Float32Array(pp.count * 3);
    for (let i = 0; i < pp.count; i++) {
      const c = mixc(ombre, couleur, 0.35 + 0.65 * Math.max(0, pp.getY(i) / rad * 0.5 + 0.5));
      cs.set([c.r, c.g, c.b], i * 3);
    }
    b.setAttribute('color', new THREE.BufferAttribute(cs, 3));
    const m = new THREE.Mesh(b, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: opacite < 1, opacity: opacite, depthWrite: opacite === 1 }));
    m.position.set((k - n / 2) * s * 0.55 + (r() - 0.5) * s * 0.3, rad * 0.3 + (r() - 0.5) * s * 0.15, (r() - 0.5) * s * 0.5);
    g.add(m);
  }
  g.scale.set(1, plat, 1);
  g.position.set(x, y, z);
  sc.add(g);
  return g;
}

// Un arbre peint : deux ou trois boules de feuillage lisses, claires dessus, sombres dessous.
const feuillage = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
export function arbrePeint(sc, x, y, z, { s = 1, seed = 1, clair = 0x7cc043, sombre = 0x2f7a3a, tronc = 0x6e4c30 } = {}) {
  const r = rng(seed * 11 + 7);
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 1.1 * s, 5), tronc).translateY(0.5 * s));
  const n = 2 + Math.floor(r() * 2);
  for (let k = 0; k < n; k++) {
    const rad = s * (0.75 + r() * 0.45);
    const b = jitter(new THREE.IcosahedronGeometry(rad, 1), rad * 0.12, r);
    const pp = b.attributes.position;
    const cs = new Float32Array(pp.count * 3);
    for (let i = 0; i < pp.count; i++) {
      const c = mixc(sombre, clair, Math.max(0, Math.min(1, pp.getY(i) / rad * 0.6 + 0.5 + (pp.getX(i) < 0 ? 0.1 : -0.1))));
      cs.set([c.r, c.g, c.b], i * 3);
    }
    b.setAttribute('color', new THREE.BufferAttribute(cs, 3));
    b.computeVertexNormals();
    const m = new THREE.Mesh(b, feuillage);
    m.castShadow = true;
    m.position.set((r() - 0.5) * s * 0.9, 1.5 * s + k * 0.35 * s, (r() - 0.5) * s * 0.9);
    g.add(m);
  }
  g.position.set(x, y, z);
  sc.add(g);
  return g;
}

// Une maison de pierre : murs clairs, toit de tuiles, parfois une tourelle.
export function maisonPierre(sc, x, y, z, { l = 2.4, p = 2, h = 1.8, etages = 1, mur = 0xe6dcc8, toit = 0xc4552f, rot = 0, fenetres = null, tour = false } = {}) {
  const g = maison(sc, 0, 0, 0, { l, p, h, etages, mur, toit, rot: 0, fenetres });
  sc.remove(g);
  if (tour) {
    const H = h * (etages + 1.4);
    g.add(mesh(new THREE.CylinderGeometry(0.75, 0.85, H, 8), mur).translateX(l / 2).translateZ(p / 2).translateY(H / 2));
    g.add(mesh(new THREE.ConeGeometry(1.05, 1.8, 8), toit).translateX(l / 2).translateZ(p / 2).translateY(H + 0.9));
  }
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}

// Un pont de pierre à arches, posé entre deux points (hauteurs comprises).
export function pontPierre(sc, a, b, { pierre = 0xb8b0a2, tablier = 0xcfc6b6, larg = 2, piles = 4 } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const L = A.distanceTo(B);
  const ang = Math.atan2(B.z - A.z, B.x - A.x);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const d = mesh(new THREE.BoxGeometry(L, 0.6, larg), tablier);
  d.position.copy(mid);
  d.rotation.y = -ang;
  d.rotation.z = Math.atan2(B.y - A.y, Math.hypot(B.x - A.x, B.z - A.z));
  sc.add(d);
  for (const s of [-1, 1]) {
    const pa = mesh(new THREE.BoxGeometry(L, 0.5, 0.2), pierre);
    pa.position.copy(mid).add(new THREE.Vector3(-Math.sin(ang) * s * larg / 2, 0.5, Math.cos(ang) * s * larg / 2));
    pa.rotation.copy(d.rotation);
    sc.add(pa);
  }
  for (let i = 1; i < piles; i++) {
    const q = A.clone().lerp(B, i / piles);
    const pl = mesh(new THREE.BoxGeometry(1.1, q.y + 3, larg * 0.9), pierre);
    pl.position.set(q.x, (q.y - 3) / 2, q.z);
    pl.rotation.y = -ang;
    sc.add(pl);
  }
}

// ---------- Pack visuel : architecture du 27/09 ----------
// Un toit en batiere (deux pans) : un prisme triangulaire, pignons compris.
export function batiere(l, p, h, deb = 0.25) {
  const L = l / 2 + deb, P = p / 2 + deb;
  const v = [
    [-L, 0, -P], [L, 0, -P], [L, h, 0], [-L, h, 0], [-L, 0, P], [L, 0, P],
  ];
  const f = [[0, 3, 1], [1, 3, 2], [4, 5, 3], [5, 2, 3], [0, 4, 3], [1, 2, 5], [0, 1, 4], [1, 5, 4]];
  const pos = [];
  for (const t of f) for (const i of t) pos.push(...v[i]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
// Une maison à colombages : murs crème, poutres sombres, toit d'ardoise en batiere, cheminée, fenêtres.
export function maisonColombage(sc, x, y, z, { l = 2.6, p = 2.2, h = 1.7, etages = 2, mur = 0xd8d9c9, poutre = 0x795643, toit = 0x2e505e, toitOmbre = 0x153448, rot = 0, fenetres = 0x2a3a44, socle = 0x8a8f84, neige = false } = {}) {
  const g = new THREE.Group();
  const H = h * etages;
  g.add(mesh(new THREE.BoxGeometry(l + 0.2, 0.6, p + 0.2), socle).translateY(0.3));
  g.add(mesh(new THREE.BoxGeometry(l, H, p), mur).translateY(0.6 + H / 2));
  // Colombages : poteaux d'angle et lisses d'étage.
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.add(mesh(new THREE.BoxGeometry(0.14, H, 0.14), poutre).translateX((sx * l) / 2).translateZ((sz * p) / 2).translateY(0.6 + H / 2));
  for (let e = 1; e <= etages; e++) {
    g.add(mesh(new THREE.BoxGeometry(l + 0.06, 0.12, p + 0.06), poutre).translateY(0.6 + e * h - 0.06));
    if (e < etages) {
      for (const s of [-1, 1]) { const d = mesh(new THREE.BoxGeometry(0.1, h * 1.1, 0.06), poutre); d.position.set(s * l * 0.3, 0.6 + (e - 0.5) * h + h * 0.5, p / 2 + 0.03); d.rotation.z = s * 0.6; g.add(d); }
    }
  }
  const lum = fenetres === 0xffd27a;
  for (let e = 0; e < etages; e++) for (const dx of [-l * 0.22, l * 0.22]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.5), new THREE.MeshBasicMaterial({ color: fenetres }));
    f.position.set(dx, 0.6 + e * h + h * 0.5, p / 2 + 0.02);
    g.add(f);
    if (!lum) { const v = mesh(new THREE.BoxGeometry(0.44, 0.06, 0.08), 0xe9e4d6); v.position.set(dx, 0.6 + e * h + h * 0.22, p / 2 + 0.05); g.add(v); }
  }
  const t = mesh(batiere(l, p, p * 0.62), (c, n) => col(neige && n.y > 0.3 ? 0xe5ebe3 : n.z > 0 || n.y > 0.95 ? toit : toitOmbre));
  t.position.y = 0.6 + H;
  g.add(t);
  g.add(mesh(new THREE.BoxGeometry(0.4, 1.1, 0.4), 0x8a7a6a).translateX(l * 0.28).translateZ(-p * 0.15).translateY(0.6 + H + p * 0.45));
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}
// Le phare du pack : fût crème à deux bandes terre cuite, galerie débordante, lanterne vitrée, toit conique.
export function phareBandes(sc, x, y, z, { h = 12, r = 1.6, creme = 0xe9e4d6, bande = 0xa8553a, galerie = 0x553330, socle = 0x8a8f84, anneau = 0x3f8299, lanterne = 0xcfeaf0, allume = false, salles = 0, pierre = 0xdbdad8, neigeToit = 0xe5ebe3, fen = 0x2a3a44 } = {}) {
  const g = new THREE.Group();
  let y0 = 0;
  if (salles) {
    // Le socle de salles : un corps central de pierre qui porte la tour, deux ailes plus basses à toits enneigés.
    const assises = (l, hh, p) => mesh(new THREE.BoxGeometry(l, hh, p), (c) => col(pierre).offsetHSL(0, 0, Math.floor((c.y + hh / 2) / 0.9) % 2 ? -0.04 : 0.01));
    g.add(assises(r * 3.4, salles, r * 3.4).translateY(salles / 2));
    g.add(mesh(new THREE.BoxGeometry(r * 3.8, 0.4, r * 3.8), socle).translateY(salles));
    for (const s of [-1, 1]) {
      const hh = salles * 0.62;
      g.add(assises(r * 2.6, hh, r * 2.8).translateX(s * r * 2.9).translateY(hh / 2));
      const t = mesh(batiere(r * 2.6, r * 2.8, r * 1.2), (c) => col(c.y > 0.25 ? neigeToit : 0x5a7ba5));
      t.position.set(s * r * 2.9, hh, 0);
      g.add(t);
      for (const dz of [-0.6, 0.6]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.8), new THREE.MeshBasicMaterial({ color: fen })); f.position.set(s * r * 2.9 + dz * r, hh * 0.5, r * 1.41); g.add(f); }
    }
    for (const dx of [-0.8, 0, 0.8]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1), new THREE.MeshBasicMaterial({ color: fen })); f.position.set(dx * r, salles * 0.55, r * 1.71); g.add(f); }
    y0 = salles + 0.2;
  }
  g.add(mesh(new THREE.CylinderGeometry(r * 1.45, r * 1.6, 1.4, 12), socle).translateY(y0 + 0.7));
  g.add(mesh(new THREE.CylinderGeometry(r * 1.47, r * 1.47, 0.3, 12), anneau).translateY(y0 + 1.25));
  const H = h;
  g.add(mesh(new THREE.CylinderGeometry(r * 0.72, r, H, 14, 50), (c) => {
    const t = (c.y + H / 2) / H;
    return col((t > 0.3 && t < 0.38) || (t > 0.62 && t < 0.7) ? bande : creme);
  }).translateY(y0 + 1.4 + H / 2));
  const top = y0 + 1.4 + H;
  g.add(mesh(new THREE.CylinderGeometry(r * 1.25, r * 0.8, 0.5, 14), galerie).translateY(top + 0.25));
  const verre = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, 1.4, 12), new THREE.MeshBasicMaterial({ color: allume ? 0xffe28a : lanterne }));
  verre.position.y = top + 1.2;
  g.add(verre);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.add(mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), galerie).translateX(Math.cos(a) * r * 0.62).translateZ(Math.sin(a) * r * 0.62).translateY(top + 1.2)); }
  g.add(mesh(new THREE.ConeGeometry(r * 0.95, 1.8, 14), bande).translateY(top + 2.8));
  g.add(mesh(new THREE.SphereGeometry(0.22, 6, 4), galerie).translateY(top + 3.8));
  if (allume) {
    const l = new THREE.PointLight(0xffe28a, 40, 50, 1.5); l.position.y = top + 1.2; g.add(l);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrume(), color: 0xffe28a, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
    halo.scale.set(r * 6, r * 6, 1); halo.position.y = top + 1.2; g.add(halo);
  }
  g.position.set(x, y, z);
  sc.add(g);
  return g;
}
// Une chaîne de montagnes lointaines : une crête dentelée, extrudée en profondeur, d'une seule couleur (la brume fait le reste).
export function chaine(sc, { z = -300, x0 = -400, x1 = 400, h = 60, dents = 14, seed = 1, couleur = 0x8b9f93, sommet = null, y = -1 } = {}) {
  const r = rng(seed);
  const pts = [new THREE.Vector2(x0, 0)];
  for (let k = 0; k <= dents; k++) {
    const x = x0 + ((x1 - x0) * k) / dents;
    pts.push(new THREE.Vector2(x + (r() - 0.5) * 20, h * (0.35 + r() * 0.65)));
    pts.push(new THREE.Vector2(x + (x1 - x0) / dents / 2, h * (0.15 + r() * 0.35)));
  }
  pts.push(new THREE.Vector2(x1, 0));
  const shape = new THREE.Shape(pts);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 20, bevelEnabled: false });
  const m = mesh(g, (c, n) => col(sommet && c.y > h * 0.62 ? sommet : couleur).offsetHSL(0, 0, n.x > 0 ? -0.03 : 0.02), { shadow: false });
  m.position.set(0, y, z);
  sc.add(m);
  return m;
}
// Une tour de pierre carrée à toit pointu d'ardoise.
export function tourPierre(sc, x, y, z, { l = 2.4, h = 6, pierre = 0x7d8a86, toit = 0x224c5f, fen = 0x2a3a44, rot = 0 } = {}) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(l, h, l), (c, n) => col(pierre).offsetHSL(0, 0, Math.floor(c.y / 0.8) % 2 ? -0.03 : 0.02)).translateY(h / 2));
  g.add(mesh(new THREE.BoxGeometry(l + 0.4, 0.3, l + 0.4), 0x5a6460).translateY(h));
  const t = new THREE.ConeGeometry(l * 0.85, l * 1.3, 4);
  t.rotateY(Math.PI / 4);
  g.add(mesh(t, toit).translateY(h + l * 0.65 + 0.15));
  for (const e of [0.45, 0.75]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.6), new THREE.MeshBasicMaterial({ color: fen })); f.position.set(0, h * e, l / 2 + 0.02); g.add(f); }
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}
// Un échafaudage de bois : poteaux, lisses et planchers.
export function echafaudage(sc, x, y, z, { l = 6, h = 8, p = 1.2, bois = 0x9c7c4b, rot = 0 } = {}) {
  const g = new THREE.Group();
  const nx = Math.max(2, Math.round(l / 2));
  for (let i = 0; i <= nx; i++) for (const s of [0, 1]) g.add(mesh(new THREE.BoxGeometry(0.15, h, 0.15), bois).translateX(-l / 2 + (i * l) / nx).translateZ(s * p).translateY(h / 2));
  for (let e = 1; e <= Math.floor(h / 2); e++) {
    g.add(mesh(new THREE.BoxGeometry(l + 0.2, 0.12, p + 0.2), 0xb1815e).translateY(e * 2).translateZ(p / 2));
    const d = mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), bois); d.position.set(0, e * 2 - 1, p + 0.05); d.rotation.z = e % 2 ? 0.7 : -0.7; g.add(d);
  }
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}

// La grue de bois du pack : un mât en treillis de poutres, une flèche, un contrepoids de bois, une caisse au bout du câble.
export function grueBois(sc, x, y, z, { h = 20, fleche = 12, rot = 0, bois = 0x884d40, clair = 0x9c7c4b, corde = 0x3e3030 } = {}) {
  const g = new THREE.Group();
  const w = 1.4;
  const poutre = (a, b, e = 0.22, c = bois) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const m = mesh(new THREE.BoxGeometry(e, A.distanceTo(B), e), c);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    g.add(m);
  };
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) poutre([sx * w * 0.8, 0, sz * w * 0.8], [sx * w / 2, h, sz * w / 2], 0.3);
  const n = Math.floor(h / 2.5);
  for (let i = 0; i < n; i++) {
    const y0 = (i * h) / n, y1 = ((i + 1) * h) / n, k0 = 0.8 - 0.3 * (y0 / h), k1 = 0.8 - 0.3 * (y1 / h);
    for (const [ax, az, bx, bz] of [[-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1], [-1, -1, -1, 1]]) {
      poutre([ax * w * k1, y1, az * w * k1], [bx * w * k1, y1, bz * w * k1], 0.16, clair);
      poutre([ax * w * k0, y0, az * w * k0], [bx * w * k1, y1, bz * w * k1], 0.12, clair);
    }
  }
  // La flèche, ses haubans, le contrepoids.
  poutre([-4, h + 0.3, 0], [fleche, h + 0.3, 0], 0.45);
  poutre([0, h + 3.5, 0], [fleche, h + 0.5, 0], 0.1, corde);
  poutre([0, h + 3.5, 0], [-4, h + 0.5, 0], 0.1, corde);
  poutre([0, h, 0], [0, h + 3.6, 0], 0.3);
  g.add(mesh(new THREE.BoxGeometry(2.4, 1.8, 1.6), (c) => col(Math.floor((c.y + 0.9) / 0.6) % 2 ? bois : clair)).translateX(-3.6).translateY(h - 0.6));
  const yc = h * 0.45;
  poutre([fleche - 0.4, h, 0], [fleche - 0.4, yc + 0.8, 0], 0.07, corde);
  g.add(mesh(new THREE.BoxGeometry(1.6, 1.2, 1.4), clair).translateX(fleche - 0.4).translateY(yc));
  g.position.set(x, y, z);
  g.rotation.y = rot;
  sc.add(g);
  return g;
}
