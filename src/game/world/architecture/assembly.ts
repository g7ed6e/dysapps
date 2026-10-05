// L'assemblage des pièces d'architecture (lot 7b d'Archipéo) : ce qui reste à dessiner des pièces posées d'une île.
// - Une facette posée sur une face de sa case, contre un bloc plein (un bloc, un mur peint, le sol), n'est pas émise.
// - Deux pièces voisines qui se touchent par la même facette (le bout d'un versant contre le bout du suivant) ne
//   l'émettent ni l'une ni l'autre : pas de double face une fois tout construit. Contre un fantôme, la facette reste :
//   la pièce ferme sa face de ce côté pendant le chantier.
// - Une rangée de pièces qui filent (versants, faîtes : `filant`), pareilles et de même couleur, se dessine d'un tenant :
//   ses pentes ne font qu'un quadrilatère, et le toucher retrouve la case le long de la rangée (`min`, `max`).
// Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import type { DessinDePiece, Facette, V3 } from './rooms';

/** Ce que l'assemblage lit d'une pièce posée. */
export interface PieceAAssembler {
  cube: VoxelCube;
  piece: string;
  rotation: number;
  dessin: DessinDePiece;
  /** Ses facettes, posées dans le monde (dans l'ordre de `dessin.facettes`). */
  facettes: Facette[];
}

/** Une facette à émettre, et les cases qu'elle couvre (de `min` à `max` : une case, ou une rangée). */
export interface FacetteAssemblee {
  facette: Facette;
  /** Le bloc dont elle prend la couleur et la teinte (le premier de sa rangée). */
  cube: VoxelCube;
  min: V3;
  max: V3;
}

const EPS = 1e-6;
const rond = (v: number) => Math.round(v * 1e4) / 1e4;

/** L'axe (0, 1, 2) et le sens d'une normale alignée sur un axe, ou `null`. */
function axeDeLaNormale(n: V3): [number, number] | null {
  const non = n.map((v) => Math.abs(v) > EPS);
  if (non.filter(Boolean).length !== 1) return null;
  const axe = non.indexOf(true);
  return [axe, Math.sign(n[axe])];
}

/** La facette est-elle posée sur la face de sa case tournée vers sa normale ? (Alors elle touche la case voisine.) */
function surLaFace(f: Facette, c: V3): [number, number] | null {
  const a = axeDeLaNormale(f.normale);
  if (!a) return null;
  const [axe, sens] = a;
  const plan = c[axe] + (sens > 0 ? 1 : 0);
  return f.points.every((p) => Math.abs(p[axe] - plan) < EPS) ? a : null;
}

/**
 * Les facettes à émettre des pièces d'une île. `estPlein(x, y, z)` : la case est-elle pleine (un bloc posé dessiné en
 * bloc, un mur peint, le sol) ; `cleDeCouleur` : deux blocs de même clé ont les mêmes couleurs (une rangée se dessine
 * d'un tenant).
 */
export function assemblerLesPieces(
  pieces: readonly PieceAAssembler[],
  estPlein: (x: number, y: number, z: number) => boolean,
  cleDeCouleur: (c: VoxelCube) => string,
): FacetteAssemblee[] {
  const visible = pieces.map((p) => p.facettes.map(() => true));
  // Contre un bloc plein : cachée. Sur une face de case : rangée par ses points, pour trouver sa jumelle.
  const jumelles = new Map<string, [number, number, number][]>();
  pieces.forEach((p, i) => {
    const c: V3 = [p.cube.x, p.cube.y, p.cube.z];
    p.facettes.forEach((f, k) => {
      const face = surLaFace(f, c);
      if (!face) return;
      const [axe, sens] = face;
      const v: V3 = [...c];
      v[axe] += sens;
      if (estPlein(v[0], v[1], v[2])) {
        visible[i][k] = false;
        return;
      }
      const cle = f.points
        .map((q) => q.map(rond).join(','))
        .sort()
        .join('|');
      const l = jumelles.get(cle);
      if (l) l.push([i, k, sens]);
      else jumelles.set(cle, [[i, k, sens]]);
    });
  });
  for (const l of jumelles.values()) {
    if (l.length < 2 || !l.some((e) => e[2] > 0) || !l.some((e) => e[2] < 0)) continue;
    for (const [i, k] of l) visible[i][k] = false;
  }

  const out: FacetteAssemblee[] = [];
  const seule = (i: number, k: number) => {
    const p = pieces[i];
    const c: V3 = [p.cube.x, p.cube.y, p.cube.z];
    out.push({ facette: p.facettes[k], cube: p.cube, min: c, max: c });
  };
  // Les rangées : des pièces qui filent, de même dessin (la rive et le courant d'un versant), de même orientation et de
  // même couleur, côte à côte le long de leur axe.
  const dessins = new Map<DessinDePiece, number>();
  const rangees = new Map<string, { axe: number; l: number[] }>();
  pieces.forEach((p, i) => {
    if (!p.dessin.filant) return;
    if (!dessins.has(p.dessin)) dessins.set(p.dessin, dessins.size);
    // L'axe de la rangée : y dans l'orientation de référence, x après un quart de tour.
    const axe = p.rotation % 2 === 0 ? 1 : 0;
    const fixe = axe === 1 ? p.cube.x : p.cube.y;
    const cle = `${dessins.get(p.dessin)}|${p.rotation}|${cleDeCouleur(p.cube)}|${axe}|${fixe}|${p.cube.z}`;
    const r = rangees.get(cle);
    if (r) r.l.push(i);
    else rangees.set(cle, { axe, l: [i] });
  });
  const dansUneRangee = new Set<number>();
  for (const { axe, l } of rangees.values()) {
    const le = (i: number) => (axe === 1 ? pieces[i].cube.y : pieces[i].cube.x);
    l.sort((a, b) => le(a) - le(b));
    // Coupée là où une case manque.
    let debut = 0;
    for (let j = 1; j <= l.length; j++) {
      if (j < l.length && le(l[j]) === le(l[j - 1]) + 1) continue;
      const rangee = l.slice(debut, j);
      debut = j;
      if (rangee.length < 2) continue;
      for (const i of rangee) dansUneRangee.add(i);
      const nb = pieces[rangee[0]].facettes.length;
      for (let k = 0; k < nb; k++) {
        const f0 = pieces[rangee[0]].facettes[k];
        const a0 = le(rangee[0]);
        // Une facette qui file : ses points sont tous au début ou à la fin de sa case, le long de l'axe.
        const file = f0.points.every((q) => Math.abs(q[axe] - a0) < EPS || Math.abs(q[axe] - a0 - 1) < EPS) && f0.points.some((q) => Math.abs(q[axe] - a0) < EPS) && f0.points.some((q) => Math.abs(q[axe] - a0 - 1) < EPS);
        let s = 0;
        while (s < rangee.length) {
          if (!visible[rangee[s]][k]) {
            s++;
            continue;
          }
          let e = s;
          if (file) while (e + 1 < rangee.length && visible[rangee[e + 1]][k]) e++;
          if (e === s) seule(rangee[s], k);
          else {
            const p0 = pieces[rangee[s]];
            const fin = le(rangee[e]) + 1;
            const debutS = le(rangee[s]);
            const points = p0.facettes[k].points.map((q) => {
              const r: V3 = [...q];
              if (Math.abs(q[axe] - debutS - 1) < EPS) r[axe] = fin;
              return r;
            });
            const pe = pieces[rangee[e]].cube;
            out.push({ facette: { ...p0.facettes[k], points }, cube: p0.cube, min: [p0.cube.x, p0.cube.y, p0.cube.z], max: [pe.x, pe.y, pe.z] });
          }
          s = e + 1;
        }
      }
    }
  }
  pieces.forEach((p, i) => {
    if (dansUneRangee.has(i)) return;
    p.facettes.forEach((_, k) => {
      if (visible[i][k]) seule(i, k);
    });
  });
  return out;
}
