// Le maillage des blocs de Blocland en une seule texture (piste 2 du budget de rendu) : toutes les faces d'un morceau du
// monde dans le même maillage, chaque face avec sa couche de la texture des blocs (un tableau de textures), sa couleur
// et sa lueur dans ses sommets. Un appel de dessin par morceau et par passe (opaque, verre, fantômes), au lieu d'un par
// texture et par face. Les faces voisines de la même couche se fondent en une seule (`fondre`) : la texture s'y répète,
// case par case, la même image. Pur (sans Three.js) : testable, et la 3D n'a plus qu'à en faire des maillages.
import type { VoxelCube } from './cube';
import { eachVisibleFace, outwardCorners, type FaceSide, type MeshOptions } from './mesher';
import { TEXTURE_KINDS, type TextureKind } from './pixels';

/** Les trois passes d'un morceau : les blocs opaques, le verre (translucide), les fantômes des plans (translucides). */
export type BlockPass = 'opaque' | 'glass' | 'ghost';

/** Les faces d'un morceau du monde, pour une passe : un maillage, un appel de dessin. */
export interface BlockChunk {
  key: string;
  pass: BlockPass;
  positions: number[];
  normals: number[];
  uvs: number[];
  /** La couche de la texture des blocs de chaque sommet (`layerOf`). */
  layers: number[];
  /** La couleur de chaque sommet, en linéaire (blanc pour un bloc texturé ; la teinte d'une couleur unie). */
  colors: number[];
  /** La lueur de chaque sommet, en linéaire (lanterne et lave ; noir sinon). */
  glows: number[];
  indices: number[];
}

export interface BlockMeshOptions extends MeshOptions {
  /** Fondre les faces voisines de la même couche (pas dans « Modifier le plan », qui soulève un lieu sommet par sommet). */
  fondre?: boolean;
  /** Le côté d'un morceau, en cases : Three.js n'envoie pas un morceau hors de l'écran. */
  morceau?: number;
}

/** Le côté d'un morceau par défaut, en cases (mesuré : scripts/rendu/mesures.mjs). */
const COTE_D_UN_MORCEAU = 32;

const FACES: readonly FaceSide[] = ['side', 'top', 'bottom'];

/** La couche du grain des couleurs unies (et des fantômes de couleur unie). */
export const GRAIN_LAYER = 0;

/** Le nombre de couches de la texture des blocs : le grain, puis chaque sorte, chaque face, normale puis délavée. */
export const LAYER_COUNT = 1 + TEXTURE_KINDS.length * FACES.length * 2;

const KIND_INDEX = new Map<string, number>(TEXTURE_KINDS.map((k, i) => [k, i]));

/** La couche d'une face texturée (`muted` : délavée, île verrouillée) ; une sorte inconnue prend le grain. */
export function layerOf(texture: string, face: FaceSide, muted = false): number {
  const k = KIND_INDEX.get(texture);
  if (k === undefined) return GRAIN_LAYER;
  return 1 + (k * FACES.length + FACES.indexOf(face)) * 2 + (muted ? 1 : 0);
}

/** La sorte et la face d'une couche (`layerOf` à l'envers), pour peindre la texture ; rien pour le grain. */
export function layerContent(layer: number): { kind: TextureKind; face: FaceSide; muted: boolean } | null {
  if (layer === GRAIN_LAYER) return null;
  const i = layer - 1;
  const muted = i % 2 === 1;
  const kf = (i - (muted ? 1 : 0)) / 2;
  return { kind: TEXTURE_KINDS[Math.floor(kf / FACES.length)], face: FACES[kf % FACES.length], muted };
}

/** Les blocs qui brillent d'eux-mêmes (surtout la nuit) : leur couleur et son intensité. */
export const GLOW: Partial<Record<TextureKind, readonly [string, number]>> = { lanterne: ['#ffb830', 0.55], lave: ['#ff5a00', 0.6] };

/** Une composante sRGB (0 à 1) en linéaire, comme Three.js. */
const lineaire = (c: number) => (c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4));

/** Une couleur `#rgb` ou `#rrggbb` en linéaire, comme `THREE.Color.set` ; le gris des couleurs inconnues sinon. */
export function linearRgb(hex: string | undefined): [number, number, number] {
  let h = (hex ?? '').trim();
  if (/^#[0-9a-f]{3}$/i.test(h)) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  if (!/^#[0-9a-f]{6}$/i.test(h)) h = '#9c9c9c';
  const n = parseInt(h.slice(1), 16);
  return [lineaire(((n >> 16) & 255) / 255), lineaire(((n >> 8) & 255) / 255), lineaire((n & 255) / 255)];
}

/** Ce qui fait l'allure d'une face : sa passe, sa couche, sa couleur et sa lueur. Deux faces de même allure se fondent. */
interface Allure {
  /** Le même numéro pour deux allures pareilles (`allureDe`). */
  id: number;
  pass: BlockPass;
  layer: number;
  color: [number, number, number];
  glow: [number, number, number];
}

const BLANC: [number, number, number] = [1, 1, 1];
const NOIR: [number, number, number] = [0, 0, 0];

/** Les allures déjà vues, par ce qui les fait : chaque face n'en refait pas le calcul. */
const ALLURES = new Map<string, Allure>();

function allureDe(c: VoxelCube, face: FaceSide): Allure {
  const k = `${c.ghost ? 1 : 0}${c.muted ? 1 : 0}${face}|${c.texture ?? ''}|${c.texture ? '' : c.color}`;
  let a = ALLURES.get(k);
  if (!a) ALLURES.set(k, (a = { ...calculerLAllure(c, face), id: ALLURES.size }));
  return a;
}

function calculerLAllure(c: VoxelCube, face: FaceSide): Omit<Allure, 'id'> {
  // Un fantôme : la texture de côté de son bloc (ou le grain), bleutée par son matériau.
  if (c.ghost) return { pass: 'ghost', layer: c.texture ? layerOf(c.texture, 'side') : GRAIN_LAYER, color: BLANC, glow: NOIR };
  if (!c.texture) return { pass: 'opaque', layer: GRAIN_LAYER, color: linearRgb(c.color), glow: NOIR };
  const lueur = c.muted ? undefined : GLOW[c.texture as TextureKind];
  const glow: [number, number, number] = lueur ? (linearRgb(lueur[0]).map((v) => v * lueur[1]) as [number, number, number]) : NOIR;
  return { pass: c.texture === 'verre' ? 'glass' : 'opaque', layer: layerOf(c.texture, face, c.muted), color: BLANC, glow };
}

/** Les axes de la grille (0 = x, 1 = y, 2 = z) dans le repère Three (X = x, Y = z, Z = y). */
const VERS_THREE = [0, 2, 1] as const;

/** Une face posée dans son plan : la case du cube dans le plan (a, b), le cube, son allure. */
interface FaceAPlat {
  a: number;
  b: number;
  c: VoxelCube;
  allure: Allure;
}

/** Ajoute un quadrilatère au morceau : la face du cube `c` étirée de `w` cases sur l'axe `ua` et de `h` sur l'axe `va`. */
function ajouter(g: BlockChunk, c: VoxelCube, d: [number, number, number], ua: number, va: number, w: number, h: number, allure: Allure) {
  const quad = outwardCorners(c, d);
  const U = VERS_THREE[ua];
  const V = VERS_THREE[va];
  const cu = [c.x, c.y, c.z][ua];
  const cv = [c.x, c.y, c.z][va];
  // Le pas des uv le long de chaque axe du plan, lu sur la face d'un cube : la texture se répète à chaque case.
  const pente = (axe: number, autre: number): [number, number] => {
    const p = quad[0];
    for (const q of quad) if (q.p[axe] !== p.p[axe] && q.p[autre] === p.p[autre]) return [(q.uv[0] - p.uv[0]) / (q.p[axe] - p.p[axe]), (q.uv[1] - p.uv[1]) / (q.p[axe] - p.p[axe])];
    return [0, 0];
  };
  const pu = pente(U, V);
  const pv = pente(V, U);
  const base = g.positions.length / 3;
  for (const { p, uv } of quad) {
    const du = p[U] > cu ? w - 1 : 0;
    const dv = p[V] > cv ? h - 1 : 0;
    const q: [number, number, number] = [p[0], p[1], p[2]];
    q[U] += du;
    q[V] += dv;
    g.positions.push(q[0], q[1], q[2]);
    g.normals.push(d[0], d[2], d[1]);
    g.uvs.push(uv[0] + pu[0] * du + pv[0] * dv, uv[1] + pu[1] * du + pv[1] * dv);
    g.layers.push(allure.layer);
    g.colors.push(...allure.color);
    g.glows.push(...allure.glow);
  }
  g.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/** Un morceau neuf. */
const morceauVide = (key: string, pass: BlockPass): BlockChunk => ({ key, pass, positions: [], normals: [], uvs: [], layers: [], colors: [], glows: [], indices: [] });

/**
 * Les faces visibles d'un ensemble de cubes, rangées par morceau du monde (`morceau` cases de côté) et par passe. Avec
 * `fondre`, les faces voisines de la même allure, dans le même plan et le même morceau, se fondent en rectangles : moins
 * de triangles, la même image (la texture se répète case par case).
 */
export function buildBlockMesh(cubes: readonly VoxelCube[], options: BlockMeshOptions = {}): BlockChunk[] {
  const { fondre = false, morceau = COTE_D_UN_MORCEAU } = options;
  const chunks = new Map<string, BlockChunk>();
  const chunkDe = (c: VoxelCube, pass: BlockPass) => {
    const key = `${Math.floor(c.x / morceau)},${Math.floor(c.y / morceau)}:${pass}`;
    let g = chunks.get(key);
    if (!g) chunks.set(key, (g = morceauVide(key, pass)));
    return g;
  };
  // Les plans à fondre : par morceau, passe, direction, plan et allure, leurs faces.
  const plans = new Map<string, { d: [number, number, number]; ua: number; va: number; faces: FaceAPlat[] }>();
  eachVisibleFace(cubes, [], options, (c, d, face) => {
    const allure = allureDe(c, face);
    if (!fondre) {
      ajouter(chunkDe(c, allure.pass), c, d, 0, 2, 1, 1, allure);
      return;
    }
    const n = d[0] !== 0 ? 0 : d[1] !== 0 ? 1 : 2;
    const [ua, va] = [0, 1, 2].filter((i) => i !== n);
    const pos = [c.x, c.y, c.z];
    const key = `${Math.floor(c.x / morceau)},${Math.floor(c.y / morceau)}|${d[0]}${d[1]}${d[2]}|${pos[n]}|${allure.id}`;
    let plan = plans.get(key);
    if (!plan) plans.set(key, (plan = { d, ua, va, faces: [] }));
    plan.faces.push({ a: pos[ua], b: pos[va], c, allure });
  });
  // Une case du plan en un nombre (les cases du monde tiennent entre −32 768 et 32 767).
  const ici = new Map<number, FaceAPlat>();
  const prise = new Set<number>();
  const k = (a: number, b: number) => (a + 32768) * 65536 + (b + 32768);
  const libre = (a: number, b: number) => ici.has(k(a, b)) && !prise.has(k(a, b));
  for (const { d, ua, va, faces } of plans.values()) {
    ici.clear();
    prise.clear();
    for (const f of faces) ici.set(k(f.a, f.b), f);
    faces.sort((p, q) => p.b - q.b || p.a - q.a);
    for (const f of faces) {
      if (prise.has(k(f.a, f.b))) continue;
      // Le plus long rang possible sur a, puis autant de rangs pleins que possible sur b.
      let w = 1;
      while (libre(f.a + w, f.b)) w++;
      let h = 1;
      for (;;) {
        let plein = true;
        for (let i = 0; i < w && plein; i++) plein = libre(f.a + i, f.b + h);
        if (!plein) break;
        h++;
      }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) prise.add(k(f.a + i, f.b + j));
      ajouter(chunkDe(f.c, f.allure.pass), f.c, d, ua, va, w, h, f.allure);
    }
  }
  return [...chunks.values()];
}

/** Nombre de faces (quadrilatères) des morceaux. */
export function chunkFaceCount(chunks: readonly BlockChunk[]): number {
  return chunks.reduce((n, g) => n + g.indices.length / 6, 0);
}
