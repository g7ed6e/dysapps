// Étude Babylon.js (branche d'étude, jamais fusionnée) : redessine la scène extraite par `extraire.mjs` avec Three.js et
// avec Babylon.js, chacun brut puis avec ses optimisations, et mesure appels, triangles et temps JS par image.
// Adresse : banc.html?scene=6e-ile&moteur=three|babylon&mode=brut|optimise|fusion|classe&w=320&h=240
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as B from '@babylonjs/core';

const q = new URLSearchParams(location.search);
const SCENE = q.get('scene') ?? '6e-ile';
const MOTEUR = q.get('moteur') ?? 'three';
const MODE = q.get('mode') ?? 'brut';
const W = Number(q.get('w') ?? 320), H = Number(q.get('h') ?? 240);
const IMAGES = Number(q.get('images') ?? 200);
const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;
canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;

// Les appels de dessin comptés au niveau de WebGL, de la même façon pour les deux moteurs.
const gl = { appels: 0, programmes: 0, textures: 0 };
for (const [nom, cle] of [['drawElements', 'appels'], ['drawArrays', 'appels'], ['drawElementsInstanced', 'appels'], ['drawArraysInstanced', 'appels'], ['useProgram', 'programmes'], ['bindTexture', 'textures']]) {
  const f = WebGL2RenderingContext.prototype[nom];
  WebGL2RenderingContext.prototype[nom] = function (...a) { gl[cle]++; return f.apply(this, a); };
}
const dec = (s, T = Float32Array) => { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };
const d = await (await fetch(`./sortie/${SCENE}.json`)).json();

/** La classe d'un matériau, pour simuler « une seule texture pour tous les blocs » (piste 2) : la fusion ignore la texture. */
const classeDe = (m) => `${m.transparent ? 't' : 'o'}${m.side === 2 ? 'd' : 's'}${m.vertexColors ? 'v' : ''}`;

/** Les morceaux de la scène, à plat : un par objet et par groupe (géométrie décodée une fois). */
const geos = {};
for (const [id, g] of Object.entries(d.geoms)) {
  const pos = dec(g.position.data);
  const n = pos.length / 3;
  geos[id] = {
    pos, n,
    nor: g.normal ? dec(g.normal.data) : null,
    uv: g.uv && g.uv.size === 2 ? dec(g.uv.data) : null,
    col: g.color ? dec(g.color.data) : null, colSize: g.color?.size,
    idx: g.index ? dec(g.index, Uint32Array) : Uint32Array.from({ length: n }, (_, i) => i),
    groups: g.groups.length ? g.groups : [{ start: 0, count: g.index ? dec(g.index, Uint32Array).length : n, mi: 0 }],
  };
}

const stats = (t) => { t.sort((a, b) => a - b); return { mediane: +t[t.length >> 1].toFixed(3), p90: +t[Math.floor(t.length * 0.9)].toFixed(3), moyenne: +(t.reduce((a, b) => a + b, 0) / t.length).toFixed(3) }; };
const pause = () => new Promise((r) => setTimeout(r, 0));

async function mesurer(frame, lire) {
  for (let i = 0; i < 30; i++) { frame(); await pause(); }
  gl.appels = gl.programmes = gl.textures = 0;
  frame();
  const parImage = { ...gl };
  const t = [];
  for (let i = 0; i < IMAGES; i++) {
    const t0 = performance.now();
    frame();
    t.push(performance.now() - t0);
    await pause();
  }
  return { ...lire(), gl: parImage, js: stats(t) };
}

// ---------------------------------------------------------------- Three.js
async function three() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.info.autoReset = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(d.background);
  if (d.fog) scene.fog = d.fog.density ? new THREE.FogExp2(d.fog.color, d.fog.density) : new THREE.Fog(d.fog.color, d.fog.near, d.fog.far);
  for (const l of d.lights) {
    const L = l.type === 'HemisphereLight' ? new THREE.HemisphereLight(l.color, l.ground, l.intensity) : l.type === 'DirectionalLight' ? new THREE.DirectionalLight(l.color, l.intensity) : new THREE.AmbientLight(l.color, l.intensity);
    L.position.fromArray(l.pos); scene.add(L);
  }
  const texs = {};
  await Promise.all(Object.entries(d.texs).map(async ([id, t]) => {
    if (!t.url) return;
    const img = new Image(); img.src = t.url; await img.decode();
    const tx = new THREE.Texture(img); tx.needsUpdate = true; tx.colorSpace = THREE.SRGBColorSpace;
    if (t.nearest) { tx.magFilter = tx.minFilter = THREE.NearestFilter; }
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.fromArray(t.repeat);
    texs[id] = tx;
  }));
  const mats = {};
  for (const [id, m] of Object.entries(d.mats))
    mats[id] = new (m.type === 'MeshBasicMaterial' ? THREE.MeshBasicMaterial : THREE.MeshLambertMaterial)({ color: m.color, map: texs[m.map] ?? null, transparent: m.transparent, opacity: m.opacity, vertexColors: m.vertexColors, side: m.side, depthWrite: m.depthWrite });
  const geom = (id) => {
    const g = geos[id]; const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(g.pos, 3));
    if (g.nor) bg.setAttribute('normal', new THREE.BufferAttribute(g.nor, 3));
    if (g.uv) bg.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
    if (g.col) bg.setAttribute('color', new THREE.BufferAttribute(g.col, g.colSize));
    bg.setIndex(new THREE.BufferAttribute(g.idx, 1));
    for (const gr of g.groups) bg.addGroup(gr.start, gr.count, gr.mi);
    return bg;
  };
  const fige = MODE !== 'brut' && MODE !== 'boites' && MODE !== 'tri';
  if (MODE === 'brut' || MODE === 'optimise' || MODE === 'boites' || MODE === 'tri') {
    for (const o of d.objets) {
      const ms = o.mats.map((id) => mats[id]);
      const mesh = o.instances ? new THREE.InstancedMesh(geom(o.geom), ms.length > 1 ? ms : ms[0], o.count) : new THREE.Mesh(geom(o.geom), ms.length > 1 ? ms : ms[0]);
      if (o.instances) { mesh.instanceMatrix.array.set(dec(o.instances)); if (o.instanceColor) mesh.instanceColor = new THREE.InstancedBufferAttribute(dec(o.instanceColor), 3); }
      new THREE.Matrix4().fromArray(o.matrix).decompose(mesh.position, mesh.quaternion, mesh.scale);
      mesh.renderOrder = o.renderOrder; mesh.frustumCulled = MODE === 'tri' ? true : o.frustumCulled;
      if (fige) { mesh.updateMatrix(); mesh.matrixAutoUpdate = false; }
      scene.add(mesh);
    }
  } else {
    // Fusion : les morceaux non instanciés réunis par matériau (`fusion`) ou par classe de matériau (`classe`, piste 2 simulée).
    const paquets = new Map();
    const m4 = new THREE.Matrix4();
    for (const o of d.objets) {
      if (o.instances) {
        const ms = o.mats.map((id) => mats[id]);
        const mesh = new THREE.InstancedMesh(geom(o.geom), ms.length > 1 ? ms : ms[0], o.count);
        mesh.instanceMatrix.array.set(dec(o.instances));
        mesh.matrix.fromArray(o.matrix); mesh.matrixAutoUpdate = false; scene.add(mesh);
        continue;
      }
      const g = geos[o.geom];
      m4.fromArray(o.matrix);
      for (const gr of o.mats.length > 1 ? g.groups : [{ start: 0, count: g.idx.length, mi: 0 }]) {
        const mid = o.mats[gr.mi] ?? o.mats[0];
        const m = d.mats[mid];
        const cle = MODE === 'fusion' ? mid : classeDe(m);
        // Un morceau = une géométrie non indexée réduite au groupe, en coordonnées du monde.
        const bg = new THREE.BufferGeometry();
        const ids = g.idx.subarray(gr.start, gr.start + gr.count);
        const take = (src, k) => { const out = new Float32Array(ids.length * k); for (let i = 0; i < ids.length; i++) for (let j = 0; j < k; j++) out[i * k + j] = src[ids[i] * k + j]; return out; };
        bg.setAttribute('position', new THREE.BufferAttribute(take(g.pos, 3), 3));
        bg.setAttribute('normal', new THREE.BufferAttribute(g.nor ? take(g.nor, 3) : new Float32Array(ids.length * 3), 3));
        bg.setAttribute('uv', new THREE.BufferAttribute(g.uv ? take(g.uv, 2) : new Float32Array(ids.length * 2), 2));
        bg.setAttribute('color', new THREE.BufferAttribute(g.col ? (g.colSize === 3 ? take(g.col, 3) : (() => { const c4 = take(g.col, 4); const c3 = new Float32Array(ids.length * 3); for (let i = 0; i < ids.length; i++) c3.set(c4.subarray(i * 4, i * 4 + 3), i * 3); return c3; })()) : new Float32Array(ids.length * 3).fill(1), 3));
        bg.applyMatrix4(m4);
        if (!paquets.has(cle)) paquets.set(cle, { mat: mats[mid], parts: [] });
        paquets.get(cle).parts.push(bg);
      }
    }
    for (const { mat, parts } of paquets.values()) {
      const mesh = new THREE.Mesh(mergeGeometries(parts), mat);
      mesh.matrixAutoUpdate = false; scene.add(mesh);
    }
  }
  if (fige) { scene.matrixWorldAutoUpdate = false; scene.updateMatrixWorld(true); }
  const cam = new THREE.PerspectiveCamera(d.camera.fov, W / H, d.camera.near, d.camera.far);
  cam.position.fromArray(d.camera.pos); cam.quaternion.fromArray(d.camera.quat); cam.updateMatrixWorld();
  if (fige) cam.matrixWorldAutoUpdate = false;
  // `boites` : l'élimination hors champ par boîte englobante (comme Babylon.js), à la main, avant chaque image.
  let frame = () => renderer.render(scene, cam);
  if (q.get('dbg')) {
    const frustum = new THREE.Frustum(), pv = new THREE.Matrix4();
    pv.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frustum.setFromProjectionMatrix(pv);
    window.__dbg = d.objets.map((o, i) => { const m = scene.children.filter((c) => c.isMesh)[i]; m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); return `m${i}:${frustum.intersectsObject(m) ? 'S' : '-'}${frustum.intersectsBox(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)) ? 'B' : '-'}`; });
  }
  if (MODE === 'boites') {
    const frustum = new THREE.Frustum(), pv = new THREE.Matrix4();
    const items = scene.children.filter((o) => o.isMesh).map((o) => { o.geometry.computeBoundingBox(); o.updateMatrixWorld(); return { o, box: o.isInstancedMesh ? null : o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld) }; });
    frame = () => {
      pv.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); frustum.setFromProjectionMatrix(pv);
      for (const it of items) if (it.box) it.o.visible = frustum.intersectsBox(it.box);
      renderer.render(scene, cam);
    };
  }
  const r = await mesurer(frame, () => ({ appels: renderer.info.render.calls, triangles: renderer.info.render.triangles, objets: scene.children.length }));
  return r;
}

// ---------------------------------------------------------------- Babylon.js
async function babylon() {
  const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: false });
  engine.setHardwareScalingLevel(1);
  const scene = new B.Scene(engine);
  scene.useRightHandedSystem = true;
  const c = B.Color3.FromHexString(`#${d.background.toString(16).padStart(6, '0')}`);
  scene.clearColor = new B.Color4(c.r, c.g, c.b, 1);
  const hex = (h) => B.Color3.FromHexString(`#${h.toString(16).padStart(6, '0')}`);
  if (d.fog) { scene.fogMode = d.fog.density ? B.Scene.FOGMODE_EXP2 : B.Scene.FOGMODE_LINEAR; scene.fogColor = hex(d.fog.color); scene.fogStart = d.fog.near ?? 0; scene.fogEnd = d.fog.far ?? 1000; scene.fogDensity = d.fog.density ?? 0; }
  for (const l of d.lights) {
    if (l.type === 'HemisphereLight') { const L = new B.HemisphericLight('h', new B.Vector3(...l.pos).normalize(), scene); L.diffuse = hex(l.color); L.groundColor = hex(l.ground); L.intensity = l.intensity; L.specular = B.Color3.Black(); }
    else if (l.type === 'DirectionalLight') { const L = new B.DirectionalLight('d', new B.Vector3(...l.pos).scale(-1).normalize(), scene); L.diffuse = hex(l.color); L.intensity = l.intensity; L.specular = B.Color3.Black(); }
    else { const L = new B.HemisphericLight('a', new B.Vector3(0, 1, 0), scene); L.diffuse = hex(l.color); L.groundColor = hex(l.color); L.intensity = l.intensity; L.specular = B.Color3.Black(); }
  }
  const texs = {};
  for (const [id, t] of Object.entries(d.texs)) {
    if (!t.url) continue;
    const tx = new B.Texture(t.url, scene, true, true, t.nearest ? B.Texture.NEAREST_SAMPLINGMODE : B.Texture.TRILINEAR_SAMPLINGMODE);
    tx.uScale = t.repeat[0]; tx.vScale = t.repeat[1];
    texs[id] = tx;
  }
  const mats = {};
  for (const [id, m] of Object.entries(d.mats)) {
    const sm = new B.StandardMaterial(id, scene);
    sm.diffuseColor = hex(m.color); sm.specularColor = B.Color3.Black();
    if (m.type === 'MeshBasicMaterial') { sm.disableLighting = true; sm.emissiveColor = hex(m.color); }
    if (texs[m.map]) { sm.diffuseTexture = texs[m.map]; if (m.type === 'MeshBasicMaterial') sm.emissiveTexture = texs[m.map]; }
    if (m.transparent) sm.alpha = m.opacity;
    sm.backFaceCulling = m.side === 0;
    sm.sideOrientation = q.get('cw') ? B.Material.ClockWiseSideOrientation : B.Material.CounterClockWiseSideOrientation;
    if (!m.depthWrite) sm.disableDepthWrite = true;
    mats[id] = sm;
  }
  await scene.whenReadyAsync();
  const vdata = (g, ids) => {
    const vd = new B.VertexData();
    vd.positions = g.pos; if (g.nor) vd.normals = g.nor; if (g.uv) vd.uvs = g.uv;
    if (g.col) { if (g.colSize === 4) vd.colors = g.col; else { const c4 = new Float32Array(g.n * 4); for (let i = 0; i < g.n; i++) { c4[i * 4] = g.col[i * 3]; c4[i * 4 + 1] = g.col[i * 3 + 1]; c4[i * 4 + 2] = g.col[i * 3 + 2]; c4[i * 4 + 3] = 1; } vd.colors = c4; } }
    vd.indices = ids ?? g.idx;
    return vd;
  };
  const opt = MODE !== 'brut';
  const agressif = MODE === 'fige';
  const meshes = [];
  const mk = (o) => {
    const g = geos[o.geom];
    const mesh = new B.Mesh(`m${d.objets.indexOf(o)}`, scene);
    vdata(g).applyToMesh(mesh, false);
    if (o.mats.length > 1) {
      const mm = new B.MultiMaterial('mm', scene);
      mm.subMaterials = o.mats.map((id) => mats[id]);
      mesh.material = mm;
      mesh.subMeshes = [];
      for (const gr of g.groups) B.SubMesh.CreateFromIndices(gr.mi, gr.start, gr.count, mesh);
    } else mesh.material = mats[o.mats[0]];
    const m = B.Matrix.FromArray(o.matrix);
    if (o.instances) {
      const inst = dec(o.instances);
      // Les instances : en Three, matrice du monde × matrice de l'instance.
      const out = new Float32Array(inst.length);
      for (let i = 0; i < o.count; i++) B.Matrix.FromArray(inst, i * 16).multiplyToArray(m, out, i * 16);
      mesh.thinInstanceSetBuffer('matrix', out, 16, true);
    } else {
      m.decompose(mesh.scaling, mesh.rotationQuaternion = new B.Quaternion(), mesh.position);
    }
    mesh.useVertexColors = Boolean(g.col);
    mesh.hasVertexAlpha = false;
    mesh.renderingGroupId = 0;
    return mesh;
  };
  if (MODE === 'brut' || MODE === 'optimise' || MODE === 'fige') {
    for (const o of d.objets) meshes.push(mk(o));
  } else {
    // Fusion : Mesh.MergeMeshes avec ses sous-matériaux (`fusion`), ou par classe (`classe`, piste 2 simulée : un matériau par classe).
    const parCle = new Map();
    for (const o of d.objets) {
      if (o.instances) { meshes.push(mk(o)); continue; }
      const g = geos[o.geom];
      const m = B.Matrix.FromArray(o.matrix);
      for (const gr of o.mats.length > 1 ? g.groups : [{ start: 0, count: g.idx.length, mi: 0 }]) {
        const mid = o.mats[gr.mi] ?? o.mats[0];
        const cle = MODE === 'fusion' ? mid : classeDe(d.mats[mid]);
        const ids = g.idx.slice(gr.start, gr.start + gr.count);
        const piece = new B.Mesh('p', scene);
        const vd = vdata(g, ids);
        if (!vd.colors) { vd.colors = new Float32Array(g.n * 4).fill(1); }
        if (!vd.uvs) vd.uvs = new Float32Array(g.n * 2);
        if (!vd.normals) vd.normals = new Float32Array(g.n * 3);
        vd.transform(m);
        vd.applyToMesh(piece);
        piece.material = mats[mid];
        if (!parCle.has(cle)) parCle.set(cle, []);
        parCle.get(cle).push(piece);
      }
    }
    for (const pieces of parCle.values()) {
      const mat = pieces[0].material;
      // Par paquets : MergeMeshes refuse plus de 65 536 sommets sans `allow32BitsIndices`.
      const merged = B.Mesh.MergeMeshes(pieces, true, true, undefined, false, false);
      merged.material = mat; merged.useVertexColors = true;
      meshes.push(merged);
    }
  }
  if (opt) {
    scene.performancePriority = agressif ? B.ScenePerformancePriority.Aggressive : B.ScenePerformancePriority.Intermediate;
    for (const m of meshes) { m.freezeWorldMatrix(); m.doNotSyncBoundingInfo = true; }
    for (const m of Object.values(mats)) m.freeze();
    scene.blockMaterialDirtyMechanism = true;
  }
  const cam = new B.UniversalCamera('cam', new B.Vector3(...d.camera.pos), scene);
  cam.rotationQuaternion = new B.Quaternion(...d.camera.quat);
  cam.fov = (d.camera.fov * Math.PI) / 180; cam.minZ = d.camera.near; cam.maxZ = d.camera.far;
  cam.fovMode = B.Camera.FOVMODE_VERTICAL_FIXED;
  await scene.whenReadyAsync();
  scene.render();
  if (agressif) scene.freezeActiveMeshes();
  if (q.get('noclip')) scene.skipFrustumClipping = true;
  if (q.get('dbg')) {
    const meshesAll = scene.meshes;
    const parMaille = {};
    let courant = null;
    for (const m of scene.meshes) m.onBeforeDrawObservable.add(() => { courant = m; });
    const f = WebGL2RenderingContext.prototype.drawElements;
    const avant = gl.appels;
    scene.render();
    for (const m of scene.meshes) parMaille[m.name] = 0;
    window.__dbgAppels = gl.appels - avant;
    window.__dbg = { subMeshes: scene.meshes.reduce((n, m) => n + m.subMeshes.length, 0), thin: scene.meshes.filter((m) => m.thinInstanceCount > 0).map((m) => m.thinInstanceCount), alpha: scene.meshes.filter((m) => m.material?.needAlphaBlending()).length, appels: window.__dbgAppels, exclus: scene.meshes.filter((m) => !scene.getActiveMeshes().data.includes(m)).map((m) => m.name + ':' + m.getTotalIndices()),  total: meshesAll.length, notReady: meshesAll.filter((m) => !m.isReady(true)).length, active: scene.getActiveMeshes().length, matsNotReady: scene.materials.filter((m) => !m.isReady()).length, texNotReady: scene.textures.filter((t) => !t.isReady()).length };
  }
  const instr = new B.SceneInstrumentation(scene);
  instr.captureFrameTime = true;
  const r = await mesurer(() => scene.render(), () => ({ appels: instr.drawCallsCounter.current, triangles: Math.round(scene.getActiveIndices() / 3), objets: scene.meshes.length }));
  return r;
}

const t0 = performance.now();
const resultat = await (MOTEUR === 'babylon' ? babylon() : three());
resultat.preparationMs = Math.round(performance.now() - t0);
window.__resultat = { scene: SCENE, moteur: MOTEUR, mode: MODE, ...resultat };
document.title = 'fini';
