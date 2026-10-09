// Lit un glTF binaire (.glb) fait par la chaîne des modèles (scripts/rendu/modeles/) : un maillage, des triangles, des
// couleurs de sommets, sans texture. Code pur, sans DOM ni Three.js : le budget et les tests lisent les mêmes fichiers
// sur le disque. Seul ce qu'écrivent cette chaîne et le compactage du build (scripts/rendu/compacterGlb.mjs) est lu :
// des flottants ou des entiers « normalized », des indices ou non, la translation et l'échelle du nœud ; et, quand le
// modèle a un squelette (scripts/rendu/modeles/squelette.py), ses os et les poids de chaque sommet.

/** Un modèle lu : trois sommets par triangle (sans indices), et leurs couleurs dans l'espace linéaire. */
export interface ModeleLu {
  positions: Float32Array;
  /** Une couleur RVB linéaire par sommet (COLOR_0 de glTF est linéaire). */
  colors: Float32Array;
  /** Le squelette, s'il en a un : ses os, et quatre os et poids par sommet (dans l'ordre des positions). */
  skin?: Skin;
}

/** Un os du squelette : son nom, son parent (−1 : aucun) et sa tête, dans le repère des positions lues. */
interface Bone {
  name: string;
  parent: number;
  head: [number, number, number];
}

interface Skin {
  bones: Bone[];
  /** Quatre os par sommet (indices dans `bones`). */
  joints: Uint8Array;
  /** Leurs quatre poids, de somme 1. */
  weights: Float32Array;
}

interface Accessor {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  normalized?: boolean;
  count: number;
  type: 'SCALAR' | 'VEC3' | 'VEC4';
}

interface Gltf {
  accessors: Accessor[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
  meshes: { primitives: { attributes: Record<string, number>; indices?: number; mode?: number }[] }[];
  nodes?: { mesh?: number; translation?: number[]; scale?: number[] }[];
  /** Les os, rangés là par squelette.py (et gardés par le compactage du build). */
  extras?: { bones?: Bone[] };
}

const MAGIC = 0x46546c67; // « glTF »
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const COMPONENTS = { SCALAR: 1, VEC3: 3, VEC4: 4 } as const;

/** Lit une composante : un entier « normalized » est ramené dans [0, 1] ou [−1, 1]. */
function lecteur(view: DataView, type: number, normalized: boolean): { size: number; read: (o: number) => number } {
  switch (type) {
    case 5126:
      return { size: 4, read: (o) => view.getFloat32(o, true) };
    case 5125:
      return { size: 4, read: (o) => view.getUint32(o, true) };
    case 5123:
      return { size: 2, read: normalized ? (o) => view.getUint16(o, true) / 65535 : (o) => view.getUint16(o, true) };
    case 5122:
      return { size: 2, read: normalized ? (o) => Math.max(view.getInt16(o, true) / 32767, -1) : (o) => view.getInt16(o, true) };
    case 5121:
      return { size: 1, read: normalized ? (o) => view.getUint8(o) / 255 : (o) => view.getUint8(o) };
    case 5120:
      return { size: 1, read: normalized ? (o) => Math.max(view.getInt8(o) / 127, -1) : (o) => view.getInt8(o) };
    default:
      throw new Error(`Type de composante inconnu : ${type}`);
  }
}

/** Les valeurs d'un accesseur, `n` composantes par élément (les `n` premières s'il en a plus : RGBA lu en RVB). */
function valeurs(gltf: Gltf, bin: DataView, index: number, n: number): Float32Array {
  const a = gltf.accessors[index];
  const v = gltf.bufferViews[a.bufferView];
  const { size, read } = lecteur(bin, a.componentType, a.normalized === true);
  const components = COMPONENTS[a.type];
  const stride = v.byteStride ?? size * components;
  const base = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const out = new Float32Array(a.count * n);
  for (let i = 0; i < a.count; i++) for (let k = 0; k < n; k++) out[i * n + k] = read(base + i * stride + k * size);
  return out;
}

/** Lit un .glb : son maillage, en triangles sans indices, avec la translation et l'échelle de son nœud. */
export function lireGlb(buffer: ArrayBuffer): ModeleLu {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== MAGIC) throw new Error('Pas un fichier .glb');
  let gltf: Gltf | null = null;
  let bin: DataView | null = null;
  for (let o = 12; o + 8 <= buffer.byteLength; ) {
    const length = view.getUint32(o, true);
    const type = view.getUint32(o + 4, true);
    if (type === JSON_CHUNK) gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, o + 8, length))) as Gltf;
    else if (type === BIN_CHUNK) bin = new DataView(buffer, o + 8, length);
    o += 8 + length;
  }
  if (!gltf || !bin) throw new Error('Fichier .glb incomplet');
  const node = gltf.nodes?.find((n) => n.mesh !== undefined) ?? {};
  const prim = gltf.meshes[node.mesh ?? 0].primitives[0];
  if ((prim.mode ?? 4) !== 4) throw new Error('Seuls les triangles sont lus');
  if (prim.attributes.COLOR_0 === undefined) throw new Error('Modèle sans couleurs de sommets');
  const pos = valeurs(gltf, bin, prim.attributes.POSITION, 3);
  const col = valeurs(gltf, bin, prim.attributes.COLOR_0, 3);
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const indices = prim.indices === undefined ? null : valeurs(gltf, bin, prim.indices, 1);
  const n = indices ? indices.length : pos.length / 3;
  const bones = gltf.extras?.bones;
  const lesOs = bones && prim.attributes.JOINTS_0 !== undefined && prim.attributes.WEIGHTS_0 !== undefined;
  const jts = lesOs ? valeurs(gltf, bin, prim.attributes.JOINTS_0, 4) : null;
  const wts = lesOs ? valeurs(gltf, bin, prim.attributes.WEIGHTS_0, 4) : null;
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const joints = new Uint8Array(jts ? n * 4 : 0);
  const weights = new Float32Array(wts ? n * 4 : 0);
  for (let i = 0; i < n; i++) {
    const v = indices ? indices[i] : i;
    positions[i * 3] = pos[v * 3] * sx + tx;
    positions[i * 3 + 1] = pos[v * 3 + 1] * sy + ty;
    positions[i * 3 + 2] = pos[v * 3 + 2] * sz + tz;
    colors.set(col.subarray(v * 3, v * 3 + 3), i * 3);
    if (jts && wts) {
      joints.set(jts.subarray(v * 4, v * 4 + 4), i * 4);
      weights.set(wts.subarray(v * 4, v * 4 + 4), i * 4);
    }
  }
  if (!bones || !jts) return { positions, colors };
  for (let i = 0; i < joints.length; i++) if (joints[i] >= bones.length) throw new Error(`Os inconnu : ${joints[i]}`);
  // Chaque os après son parent : la fusion les range dans cet ordre (../merges.ts).
  bones.forEach((b, i) => {
    if (!Number.isInteger(b.parent) || b.parent < -1 || b.parent >= i) throw new Error(`Parent d’os invalide : ${b.name}`);
  });
  return { positions, colors, skin: { bones, joints, weights } };
}
