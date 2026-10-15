// Compacte un modèle .glb des personnages d'Archipéo pour l'application publiée (vite.config.ts, au build) : les mêmes
// triangles et couleurs, sans normales (le jeu calcule les siennes, à facettes plates), les positions en entiers de
// 16 bits ramenés par la translation et l'échelle du nœud (KHR_mesh_quantization), les couleurs en octets, sans
// indices. Environ trois fois plus léger ; src/game/world/characters/imported/glb.ts lit les deux. Le squelette d'un
// modèle qui en a un (scripts/rendu/modeles/squelette.py) suit tel quel : ses os, et quatre os et poids en octets par
// sommet.

const GLB = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const pad4 = (n) => (n + 3) & ~3;

/** Les morceaux d'un .glb : son JSON et son binaire. */
function lire(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== GLB) throw new Error('Pas un fichier .glb');
  let json = null;
  let bin = null;
  for (let o = 12; o + 8 <= bytes.byteLength; ) {
    const length = view.getUint32(o, true);
    const type = view.getUint32(o + 4, true);
    if (type === JSON_CHUNK) json = JSON.parse(new TextDecoder().decode(bytes.subarray(o + 8, o + 8 + length)));
    else if (type === BIN_CHUNK) bin = new DataView(bytes.buffer, bytes.byteOffset + o + 8, length);
    o += 8 + length;
  }
  if (!json || !bin) throw new Error('Fichier .glb incomplet');
  return { json, bin };
}

/** Les nombres d'un accesseur (ceux qu'écrit Blender : flottants, couleurs en entiers « normalized », indices). */
function valeurs(json, bin, index, n) {
  const a = json.accessors[index];
  const v = json.bufferViews[a.bufferView];
  const size = { 5126: 4, 5125: 4, 5123: 2, 5121: 1 }[a.componentType];
  // Un entier « normalized » (des couleurs en 16 ou 8 bits) est ramené entre 0 et 1.
  const k = a.normalized ? { 5123: 1 / 65535, 5121: 1 / 255 }[a.componentType] : 1;
  const lu = {
    5126: (o) => bin.getFloat32(o, true),
    5125: (o) => bin.getUint32(o, true),
    5123: (o) => bin.getUint16(o, true),
    5121: (o) => bin.getUint8(o),
  }[a.componentType];
  if (!lu || k === undefined) throw new Error(`Accesseur non pris en charge : ${a.componentType}`);
  const read = (o) => lu(o) * k;
  const components = { SCALAR: 1, VEC3: 3, VEC4: 4 }[a.type];
  const stride = v.byteStride ?? size * components;
  const base = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const out = new Float64Array(a.count * n);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = read(base + i * stride + k * size);
  return out;
}

/** Le .glb compact d'un .glb de modèle (un maillage, des couleurs de sommets). */
export function compacterGlb(bytes) {
  const { json, bin } = lire(bytes);
  const node = json.nodes.find((n) => n.mesh !== undefined) ?? { mesh: 0 };
  if (node.rotation || node.matrix) throw new Error('Nœud tourné non pris en charge');
  const prim = json.meshes[node.mesh].primitives[0];
  const lesPos = valeurs(json, bin, prim.attributes.POSITION, 3);
  const lesCol = valeurs(json, bin, prim.attributes.COLOR_0, 3);
  // Sans indices : à facettes plates, les sommets ne se partagent presque pas, et les indices pèsent plus qu'ils n'épargnent.
  const indices = prim.indices === undefined ? null : valeurs(json, bin, prim.indices, 1);
  const n = indices ? indices.length : lesPos.length / 3;
  const bones = json.extras?.bones;
  const skin = bones && prim.attributes.JOINTS_0 !== undefined && prim.attributes.WEIGHTS_0 !== undefined;
  const lesJts = skin ? valeurs(json, bin, prim.attributes.JOINTS_0, 4) : null;
  const lesWts = skin ? valeurs(json, bin, prim.attributes.WEIGHTS_0, 4) : null;
  const pos = new Float64Array(n * 3);
  const col = new Float64Array(n * 3);
  const jts = new Float64Array(skin ? n * 4 : 0);
  const wts = new Float64Array(skin ? n * 4 : 0);
  for (let i = 0; i < n; i++) {
    const v = indices ? indices[i] : i;
    pos.set(lesPos.subarray(v * 3, v * 3 + 3), i * 3);
    col.set(lesCol.subarray(v * 3, v * 3 + 3), i * 3);
    if (skin) {
      jts.set(lesJts.subarray(v * 4, v * 4 + 4), i * 4);
      wts.set(lesWts.subarray(v * 4, v * 4 + 4), i * 4);
    }
  }
  const [t0, s0] = [node.translation ?? [0, 0, 0], node.scale ?? [1, 1, 1]];
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i++) {
    pos[i] = pos[i] * s0[i % 3] + t0[i % 3];
    min[i % 3] = Math.min(min[i % 3], pos[i]);
    max[i % 3] = Math.max(max[i % 3], pos[i]);
  }
  const translation = min.map((m, k) => (m + max[k]) / 2);
  const scale = max.map((m, k) => Math.max((m - min[k]) / 2, 1e-9));
  // Positions : 3 × int16 sur 8 octets ; couleurs : 3 × uint8 sur 4 octets (glTF aligne chaque élément sur 4) ; os et
  // poids : 4 × uint8 chacun.
  const out = new ArrayBuffer(n * (skin ? 20 : 12));
  const view = new DataView(out);
  for (let v = 0; v < n; v++) {
    for (let k = 0; k < 3; k++) view.setInt16(v * 8 + k * 2, Math.round(((pos[v * 3 + k] - translation[k]) / scale[k]) * 32767), true);
    for (let k = 0; k < 3; k++) view.setUint8(n * 8 + v * 4 + k, Math.round(Math.min(1, Math.max(0, col[v * 3 + k])) * 255));
    if (skin)
      for (let k = 0; k < 4; k++) {
        view.setUint8(n * 12 + v * 4 + k, jts[v * 4 + k]);
        view.setUint8(n * 16 + v * 4 + k, Math.round(wts[v * 4 + k] * 255));
      }
  }
  const gltf = {
    asset: { version: '2.0', generator: 'dysapps compacterGlb' },
    extensionsUsed: ['KHR_mesh_quantization'],
    extensionsRequired: ['KHR_mesh_quantization'],
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, translation, scale }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, COLOR_0: 1, ...(skin ? { JOINTS_0: 2, WEIGHTS_0: 3 } : {}) } }] }],
    buffers: [{ byteLength: out.byteLength }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: n * 8, byteStride: 8 },
      { buffer: 0, byteOffset: n * 8, byteLength: n * 4, byteStride: 4 },
      ...(skin
        ? [
            { buffer: 0, byteOffset: n * 12, byteLength: n * 4 },
            { buffer: 0, byteOffset: n * 16, byteLength: n * 4 },
          ]
        : []),
    ],
    accessors: [
      { bufferView: 0, componentType: 5122, normalized: true, count: n, type: 'VEC3', min: [-1, -1, -1], max: [1, 1, 1] },
      { bufferView: 1, componentType: 5121, normalized: true, count: n, type: 'VEC3' },
      ...(skin
        ? [
            { bufferView: 2, componentType: 5121, count: n, type: 'VEC4' },
            { bufferView: 3, componentType: 5121, normalized: true, count: n, type: 'VEC4' },
          ]
        : []),
    ],
    // Les têtes des os restent dans le repère des positions lues (après la translation et l'échelle du nœud).
    ...(skin ? { extras: { bones } } : {}),
  };
  const text = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonLength = pad4(text.length);
  const total = 12 + 8 + jsonLength + 8 + out.byteLength;
  const glb = new Uint8Array(total);
  const o = new DataView(glb.buffer);
  o.setUint32(0, GLB, true);
  o.setUint32(4, 2, true);
  o.setUint32(8, total, true);
  o.setUint32(12, jsonLength, true);
  o.setUint32(16, JSON_CHUNK, true);
  glb.set(text, 20);
  glb.fill(0x20, 20 + text.length, 20 + jsonLength);
  o.setUint32(20 + jsonLength, out.byteLength, true);
  o.setUint32(24 + jsonLength, BIN_CHUNK, true);
  glb.set(new Uint8Array(out), 28 + jsonLength);
  return glb;
}
