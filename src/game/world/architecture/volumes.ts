// Le lissage (lot 7 d'Archipéo, mot du mainteneur du 8 octobre 2026 : « go pour le lissage ») : les cases voisines
// d'une même matière, dans un même plan à part (un monument, les petites constructions d'une île, une cour, un pilier
// du cœur), se lisent comme un seul volume. Le plan ne change pas (ses cases, ses matières empilées) : c'est le dessin.
// - Leurs faces voisines ne sont jamais émises (world/construction.ts les cache déjà : un bloc plein cache sa voisine).
// - Le volume porte une seule teinte, celle de sa case d'ancrage (`teinteDeCase`) : plus de joint de teinte d'une case à
//   l'autre, si bien que la fusion de world/construction.ts en fait un rectangle par face, d'un seul tenant.
// - Peint par le kit (./index.ts, `lisse`), il n'a ni chaperon ni dessus de pierre par case : un seul dessus, dans sa
//   matière ; son soubassement se lit par colonne, sur les cases du volume empilées à la colonne du bloc.
// Code pur, sans Three.js ; le voisinage se lit fantômes compris (le volume ne change pas pendant le chantier).
import type { VoxelCube } from '../cube';

/** Un volume d'une même matière : sa case d'ancrage (la plus basse, puis la plus petite en y, puis en x), son bas et son haut. */
export interface VolumeDeMatiere {
  ancre: VoxelCube;
  bas: number;
  haut: number;
  /** Le nombre de cases du volume (une seule : une case isolée, qui peut devenir le bac « pièce seule »). */
  cases: number;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

const VOISINES: readonly (readonly [number, number, number])[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/**
 * Les volumes d'une même matière (clé `x,y,z` → son volume, partagé par toutes ses cases) : les cubes que `groupe`
 * range dans un même plan à part (`null` : hors du lissage), de même texture, même couleur et même état, réunis de
 * face en face. Les cubes hors de la grille n'en font pas partie. `oneVolume` : le nom du volume d'un bloc que le kit
 * réunit à d'autres matières (au 5e, chaque rang du toit en damier du kiosque, toile et tuile confondues).
 */
export function volumesDeMatiere(cubes: readonly VoxelCube[], groupe: (c: VoxelCube) => string | null, oneVolume?: (c: VoxelCube) => string | undefined): Map<string, VolumeDeMatiere> {
  const matiereDe = new Map<string, { c: VoxelCube; m: string }>();
  for (const c of cubes) {
    if (!Number.isInteger(c.x) || !Number.isInteger(c.y) || !Number.isInteger(c.z)) continue;
    const g = groupe(c);
    if (g === null) continue;
    const un = oneVolume?.(c);
    const matiere = un !== undefined ? `volume:${un}` : `${c.texture ?? ''}|${c.color}|${c.top ?? ''}`;
    matiereDe.set(cle(c.x, c.y, c.z), { c, m: `${g}|${matiere}|${c.muted ? 1 : 0}` });
  }
  const out = new Map<string, VolumeDeMatiere>();
  for (const [k, { c, m }] of matiereDe) {
    if (out.has(k)) continue;
    // Le volume de cette case, de proche en proche ; l'ancre se choisit sur tout le volume (déterministe).
    const cases: string[] = [k];
    const vu = new Set(cases);
    let ancre = c;
    let bas = c.z;
    let haut = c.z;
    for (let i = 0; i < cases.length; i++) {
      const { c: d } = matiereDe.get(cases[i])!;
      if (d.z < ancre.z || (d.z === ancre.z && (d.y < ancre.y || (d.y === ancre.y && d.x < ancre.x)))) ancre = d;
      bas = Math.min(bas, d.z);
      haut = Math.max(haut, d.z);
      for (const [dx, dy, dz] of VOISINES) {
        const v = cle(d.x + dx, d.y + dy, d.z + dz);
        if (vu.has(v) || matiereDe.get(v)?.m !== m) continue;
        vu.add(v);
        cases.push(v);
      }
    }
    const volume = { ancre, bas, haut, cases: cases.length };
    for (const x of cases) out.set(x, volume);
  }
  return out;
}
