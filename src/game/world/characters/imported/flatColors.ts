// Les aplats des créatures importées d'Archipéo (lot 1 de la refonte des finitions, choisi par le mainteneur le
// 10 octobre 2026) : les quatre couleurs de chaque modèle, tirées de la texture faite par TRELLIS.2, étaient sombres
// et bigarrées (l'ombre est peinte dans la texture), et la créature dénotait sur une île claire. Chacune des quatre
// couleurs sources prend une couleur cible, choisie par le directeur artistique d'après le concept : deux sources de
// la même matière prennent la même cible et ne font plus qu'une zone. Un corps clair, un vêtement ou un outil, et un
// accent sombre seulement là où il sert la lecture (les taches de Coco, le museau de Bloquette, les bottes de Rouxel,
// les pattes de Pince). La géométrie ne change pas.
import type { BiomeId } from '../../../biomes';
import type { Couleur } from '../../palette';

/** Pour chaque île du 6e, la couleur cible de chaque couleur source de sa créature (celles du modèle de près). */
export const FLAT_COLORS: Partial<Record<BiomeId, Record<number, Couleur>>> = {
  // Mousso : la mousse en un vert, le tablier en cuir clair, le plastron de pierre.
  'french-6e-phonology': { 0x4e6921: 0x78a552, 0x698315: 0x78a552, 0x4b400e: 0x9a6a40, 0x726c4b: 0xb3ae9f },
  // Tunel : le pelage brun clair, le gilet de lin, la pioche en fer.
  'french-6e-letter-confusion': { 0x2e1b0e: 0xa07050, 0x8d897d: 0xcdbf9e, 0x47301f: 0xa07050, 0x615c53: 0x8a9098 },
  // Rouxel : le pelage roux, le ventre clair, le tablier ; les bottes et les gants restent sombres.
  'french-6e-word-spelling': { 0xd14a15: 0xc8682e, 0x331a0a: 0x3e2a1e, 0x785444: 0x8a5a3c, 0xe6d9c3: 0xe6d8c0 },
  // Bloquette : la laine blanche, le tablier ; le museau et les pattes restent sombres.
  'french-6e-grammar-spelling': { 0xdcd5c5: 0xe2dccd, 0x3a2d1f: 0x3a3430, 0xbab29d: 0xe2dccd, 0x725c42: 0x9a6440 },
  // Grimoire : la carapace, la robe violette, les pages ; le livre et le bord de la carapace.
  'french-6e-reading': { 0x262329: 0x7a6e62, 0x302a48: 0x827ca8, 0xadaa97: 0xd8ccac, 0x080912: 0x8e6440 },
  // Coco : la coccinelle rouge, la ceinture de lin et le bâton ; les taches, la tête et les pattes restent sombres.
  'maths-6e-calculation': { 0x470902: 0xc04a3c, 0x78553d: 0xd2bc92, 0x110402: 0x2e2422, 0x310802: 0xc04a3c },
  // Nénu : la grenouille verte, la cire, la besace.
  'maths-6e-fractions': { 0x463112: 0xcfb07c, 0x043c08: 0x78b060, 0x2a7827: 0x78b060, 0x261003: 0xa87a48 },
  // Lavi : la salamandre orange, le tablier, l'outil de fer.
  'maths-6e-decimals': { 0xd26c28: 0xe08a48, 0x4a2c26: 0x8a5636, 0xe68137: 0xe08a48, 0x9c9e9e: 0xa0a6ae },
  // Robin : le corps brun orangé, le ventre clair, la ceinture ; la gorge orange du concept attend la géométrie.
  'english-6e-vocabulary': { 0x836041: 0xb8743f, 0xd5c298: 0xd8c49a, 0x523925: 0x7e5a3e, 0xb4a17e: 0xece4d4 },
  // Tick : le pelage, le museau clair, le gilet.
  'english-6e-grammar': { 0x372a1e: 0x8a7458, 0xb0a48f: 0xe0d0b0, 0x4a2a06: 0xb06a38, 0x604e3a: 0x8a7458 },
  // Silex : le pelage, le tablier de lin, le museau.
  'history-6e-antiquity': { 0x432f22: 0xa07850, 0xcdcac6: 0xd6c8a4, 0x6a543f: 0xa07850, 0x9b8f83: 0xc8a878 },
  // Boussole : les plumes blanches, le bec, la sacoche.
  'geography-6e-living': { 0xd0ccc8: 0xe8e4da, 0xe2e3e2: 0xe8e4da, 0xc29e81: 0xe8b47c, 0x654427: 0x8a5a34 },
  // Fougère : le corps vert tendre, la ceinture, le ventre clair.
  'life-earth-sciences-6e-living-world': { 0x44371b: 0xb06a3e, 0x7f8971: 0x8eac7a, 0x5c674a: 0x8eac7a, 0xbab19b: 0xd8ccac },
  // Bulle : les trois bleus sont la même matière ; le tablier.
  'physics-chemistry-6e-matter-energy': { 0x1f464d: 0x5f8db4, 0x0d282d: 0x5f8db4, 0x3f747b: 0x5f8db4, 0xafb8b9: 0xe6e2d6 },
  // Pince : la carapace rouge, le tablier, le fer ; les pattes fines et les antennes restent sombres.
  'technology-6e-objects': { 0x643429: 0xb85234, 0x462923: 0x8a4430, 0x23120e: 0x3a2420, 0x656260: 0x8a9098 },
};

const channels = (c: Couleur) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

/**
 * La couleur cible d'une couleur du modèle : celle de la source la plus proche. Le modèle de loin a ses propres quatre
 * couleurs, voisines de celles de près, et le compactage du build peut les décaler d'un cran : la plus proche suffit.
 * Rend la fonction qui la cherche, la table lue une fois.
 */
export function flatColor(table: Record<number, Couleur>): (c: Couleur) => Couleur {
  const pairs = Object.entries(table).map(([source, target]) => [channels(Number(source)), target] as const);
  return (c) => {
    const [r, g, b] = channels(c);
    let [best, distance] = [c, Infinity];
    for (const [[sr, sg, sb], target] of pairs) {
      const d = (r - sr) ** 2 + (g - sg) ** 2 + (b - sb) ** 2;
      if (d < distance) [best, distance] = [target, d];
    }
    return best;
  };
}

/**
 * Retire les triangles isolés : un triangle dont tous les voisins (deux au moins, par une arête) ont une même autre
 * couleur la prend. Une passe, sur les couleurs d'avant la passe : les petites zones de plusieurs triangles (un œil, une
 * tache) restent.
 */
export function smoothIsolated(positions: Float32Array, colors: Int32Array): Int32Array {
  const n = colors.length;
  // Chaque sommet reçoit un numéro (les triangles ne partagent pas leurs sommets : on les retrouve par leur position),
  // puis chaque arête une clé numérique, sans chaîne par arête.
  const ids = new Map<string, number>();
  const vertex = new Int32Array(n * 3);
  for (let i = 0; i < n * 3; i++) {
    const key = `${positions[i * 3]},${positions[i * 3 + 1]},${positions[i * 3 + 2]}`;
    let id = ids.get(key);
    if (id === undefined) ids.set(key, (id = ids.size));
    vertex[i] = id;
  }
  const edges = new Map<number, number[]>();
  for (let t = 0; t < n; t++)
    for (let k = 0; k < 3; k++) {
      const [a, b] = [vertex[t * 3 + k], vertex[t * 3 + ((k + 1) % 3)]];
      const key = Math.min(a, b) * n * 3 + Math.max(a, b);
      const list = edges.get(key);
      if (list) list.push(t);
      else edges.set(key, [t]);
    }
  const neighbours: number[][] = Array.from({ length: n }, () => []);
  for (const list of edges.values())
    if (list.length === 2) {
      neighbours[list[0]].push(list[1]);
      neighbours[list[1]].push(list[0]);
    }
  const out = Int32Array.from(colors);
  for (let t = 0; t < n; t++) {
    const v = neighbours[t];
    if (v.length < 2) continue;
    const other = colors[v[0]];
    if (other !== colors[t] && v.every((u) => colors[u] === other)) out[t] = other;
  }
  return out;
}
