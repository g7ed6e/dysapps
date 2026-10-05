// Le maillage du fondu de la pose (GD-6, Archipéo, choix « 2c » du mainteneur, 4 octobre 2026 ; le rythme : ./wave.ts).
// Pendant la pose, la partie n'est pas dans la construction taillée (la page la retire, comme pour la vague de Blocland) :
// chacune de ses cases y est un cube plein, opaque, sans biseau ni motif ni vitre ni lanterne, ajouté à la fin du groupe
// opaque (pas un appel de dessin de plus). Ses couleurs par sommet partent de la pierre des ruines (`FONDU.pierre`) et
// vont à la couleur du plan (`arrivee`) ; la 3D les mélange au temps de la scène (three/cubes.ts). Une fois la pose
// finie, la page rend le monde avec la partie : la construction la dessine telle qu'elle est (ses murs peints, ses
// pièces, ses vitres et ses lanternes, qui s'allument la nuit). Calcul pur, sans Three.js.
import type { VoxelCube } from './cube';
import { SANS_BISEAU, VITRE_DE_JOUR, type MaillageDeLaConstruction } from './construction';
import { mixColor } from './daylight';
import { eclaircir, hex, rgb } from './decor/brush';
import { lineaire } from './landMesh';
import { couleurDeMatiere, MATIERES, type Couleur, type Faces } from './palette';
import type { TextureKind } from './pixels';
import type { ArchipelagoId } from './map';
import { couleursDuToit } from './roofs';
import { FONDU, type PlanDeLaVague } from './wave';

export interface FonduDeLaPose {
  /** Les cubes de la partie, en un groupe opaque (les fenêtres et les fantômes vides), à mettre au bout de la construction. */
  maillage: MaillageDeLaConstruction;
  /** Le rang (dans l'ordre de la vague) du cube de chaque sommet. */
  rangDuSommet: Uint16Array;
  /** Les couleurs de départ (la pierre) et d'arrivée (le plan) de chaque sommet, linéaires, comme celles de la construction. */
  depart: Float32Array;
  arrivee: Float32Array;
}

/** La couleur du plan d'un cube de la partie, de jour : sa matière (la vitre éclaircie, le toit de son île), ou sa couleur. */
export function couleursDuPlan(a: ArchipelagoId, c: VoxelCube): Faces {
  if (c.texture === 'toit') return couleursDuToit(a, c.tag);
  if (c.texture === 'verre') {
    const v = couleurDeMatiere(a, 'verre');
    return { dessus: eclaircir(v.dessus, VITRE_DE_JOUR), cote: eclaircir(v.cote, VITRE_DE_JOUR) };
  }
  if (c.texture && c.texture in MATIERES) return couleurDeMatiere(a, c.texture as TextureKind);
  const x = hex(c.color);
  return { dessus: c.top ? hex(c.top) : mixColor(x, 0xffffff, 0.12), cote: x };
}

const lin = (c: Couleur): [number, number, number] => {
  const [r, g, b] = rgb(c);
  return [lineaire(r / 255), lineaire(g / 255), lineaire(b / 255)];
};

/**
 * Les six faces d'un cube, repère Three (X = x, Y = hauteur, Z = y) : la normale, la case voisine en grille, et les
 * quatre coins (0 ou 1 par axe), dans le sens direct vu du dehors.
 */
const FACES: { n: [number, number, number]; voisin: [number, number, number]; coins: [number, number, number][] }[] = [
  { n: [1, 0, 0], voisin: [1, 0, 0], coins: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { n: [-1, 0, 0], voisin: [-1, 0, 0], coins: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { n: [0, 1, 0], voisin: [0, 0, 1], coins: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { n: [0, -1, 0], voisin: [0, 0, -1], coins: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 0, 1], voisin: [0, 1, 0], coins: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { n: [0, 0, -1], voisin: [0, -1, 0], coins: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

/**
 * Le fondu d'une partie : un cube plein par case, sans les faces collées à une autre case de la partie ni le dessous
 * (la caméra regarde d'en haut, la partie est posée sur son bâtiment ou sur le sol) ; le dessus prend la couleur du dessus
 * du plan, les côtés celle des côtés. Les sommets d'un cube suivent l'ordre de la vague.
 */
export function maillageDuFondu(a: ArchipelagoId, cubes: readonly VoxelCube[], plan: PlanDeLaVague): FonduDeLaPose {
  const occupees = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  const pos: number[] = [];
  const nor: number[] = [];
  const arr: number[] = [];
  const rangs: number[] = [];
  const idx: number[] = [];
  plan.ordre.forEach((i, rang) => {
    const c = cubes[i];
    const restaure = couleursDuPlan(a, c);
    const dessus = lin(restaure.dessus);
    const cote = lin(restaure.cote);
    for (const f of FACES) {
      if (f.voisin[2] === -1 || occupees.has(`${c.x + f.voisin[0]},${c.y + f.voisin[1]},${c.z + f.voisin[2]}`)) continue;
      const base = pos.length / 3;
      const couleur = f.n[1] === 1 ? dessus : cote;
      for (const [u, v, w] of f.coins) {
        pos.push(c.x + u, c.z + v, c.y + w);
        nor.push(...f.n);
        arr.push(...couleur);
        rangs.push(rang);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  });
  const n = pos.length / 3;
  const pierre = lin(FONDU.pierre);
  const depart = new Float32Array(3 * n);
  for (let s = 0; s < n; s++) depart.set(pierre, 3 * s);
  const vide = { positions: new Float32Array(0), normals: new Float32Array(0), colors: new Float32Array(0), indices: new Uint32Array(0) };
  return {
    maillage: {
      opaque: {
        positions: Float32Array.from(pos),
        normals: Float32Array.from(nor),
        // Les couleurs dessinées : la pierre, à la première image ; la 3D les fait passer au plan.
        colors: Float32Array.from(depart),
        indices: Uint32Array.from(idx),
        biseaux: new Float32Array(4 * n).fill(SANS_BISEAU),
        teintes: new Float32Array(n),
        aretes: new Float32Array(n),
        motifs: new Float32Array(n),
      },
      fenetres: { ...vide, decalages: new Float32Array(0) },
      fantomes: { ...vide, uvs: new Float32Array(0) },
    },
    rangDuSommet: Uint16Array.from(rangs),
    depart,
    arrivee: Float32Array.from(arr),
  };
}

/** La couleur (linéaire) du sommet `s` du fondu à l'avancée `t` (0 : la pierre, 1 : le plan), écrite dans `sortie` à `o`. */
export function couleurDuFondu(f: FonduDeLaPose, s: number, t: number, sortie: Float32Array | number[], o: number): void {
  for (let k = 0; k < 3; k++) sortie[o + k] = f.depart[3 * s + k] + (f.arrivee[3 * s + k] - f.depart[3 * s + k]) * t;
}
