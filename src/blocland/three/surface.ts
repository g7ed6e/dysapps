// Les options de style de surface du lot R1 (world/style.ts), en 3D, pour les comparer en captures derrière
// `?rendu=archipeo&style=a|b|c` : les mêmes groupes de faces que le monde en blocs (donc les mêmes appels de dessin et
// les mêmes triangles), peints de la palette d'Archipéo au lieu des textures en pixels. Les fantômes gardent leur
// matériau bleuté. Les matériaux sont partagés en cache, comme ceux des textures (./textures.ts).
import * as THREE from 'three';
import { mixColor } from '../world/daylight';
import type { ArchipelagoId } from '../world/map';
import type { MeshGroup } from '../world/mesher';
import { cielDe, couleurDeMatiere, MATIERES } from '../world/palette';
import type { TextureKind } from '../world/pixels';
import { FROID, froidSommet, normalesAdoucies, nuanceSommet, type StyleSurface } from '../world/style';

export interface Surface {
  /** Le matériau d'un groupe, ou `null` pour garder celui du monde en blocs. */
  material(g: MeshGroup): THREE.Material | null;
  /** Ajoute à la géométrie ce que le style demande (couleurs ou normales de sommets). */
  geometry(g: MeshGroup, geo: THREE.BufferGeometry): void;
}

/** Ce qui brille d'elle-même (comme `GLOW` dans WorldCanvas). */
const GLOW: Partial<Record<TextureKind, [number, number]>> = { lanterne: [0xffb830, 0.55], lave: [0xff5a00, 0.6] };
/** Une île fermée : la couleur délavée vers le gris clair. */
const MUTED = 0xb8bcc0;

const cache = new Map<string, THREE.Material>();

/** La couleur d'un groupe : sa matière dans la palette de l'archipel (dessus ou côté), sinon sa teinte propre. */
function couleurDe(g: MeshGroup, a: ArchipelagoId): number {
  let c: number;
  if (g.texture && g.texture in MATIERES) {
    const f = couleurDeMatiere(a, g.texture as TextureKind);
    c = g.face === 'top' ? f.dessus : g.face === 'bottom' ? mixColor(f.cote, 0x000000, 0.2) : f.cote;
  } else c = parseInt((g.color ?? '#9c9c9c').slice(1), 16);
  return g.muted ? mixColor(c, MUTED, 0.55) : c;
}

/** Une couleur sRGB (0xRRGGBB) dans l'espace de travail de Three.js (linéaire). */
const lineaire = (c: number) => new THREE.Color().setHex(c);

export function surfaceDe(style: StyleSurface, a: ArchipelagoId): Surface {
  // L'ambiance renvoyée par le sol et la mer, de jour : les surfaces près de l'eau s'y mêlent (option b).
  const sol = cielDe(a, 1).ambianceSol;
  return {
    material(g) {
      if (g.ghost) return null;
      const color = couleurDe(g, a);
      const glow = !g.muted && g.texture ? GLOW[g.texture as TextureKind] : undefined;
      const key = `${style}:${color}:${glow ? 'glow' : ''}:${g.texture === 'verre' ? 'verre' : ''}`;
      let m = cache.get(key);
      if (!m) {
        m = new THREE.MeshLambertMaterial({
          color,
          vertexColors: style === 'b',
          emissive: glow?.[0] ?? 0x000000,
          emissiveIntensity: glow?.[1] ?? 1,
          transparent: g.texture === 'verre',
          opacity: g.texture === 'verre' ? 0.85 : 1,
        });
        cache.set(key, m);
      }
      return m;
    },
    geometry(g, geo) {
      if (g.ghost) return;
      if (style === 'b') {
        // Une nuance par sommet, qui multiplie la couleur du matériau ; près de la mer, le mélange vers l'ambiance du sol
        // s'écrit aussi en multiplicateur (la couleur froide divisée par celle du matériau, canal par canal).
        const p = g.positions;
        const base = lineaire(couleurDe(g, a));
        const froid = lineaire(mixColor(couleurDe(g, a), sol, FROID));
        const ratio = [froid.r / Math.max(1e-4, base.r), froid.g / Math.max(1e-4, base.g), froid.b / Math.max(1e-4, base.b)];
        const colors = new Float32Array(p.length);
        for (let i = 0; i < p.length; i += 3) {
          const v = nuanceSommet(p[i], p[i + 1], p[i + 2], g.normals[i + 1] > 0.5);
          const cold = froidSommet(p[i + 1]) > 0;
          colors[i] = v * (cold ? ratio[0] : 1);
          colors[i + 1] = v * (cold ? ratio[1] : 1);
          colors[i + 2] = v * (cold ? ratio[2] : 1);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      } else if (style === 'c') {
        // Chaque quadrilatère (4 sommets à la suite, voir world/mesher.ts) penche ses normales vers ses coins.
        const normals = new Float32Array(g.normals.length);
        for (let q = 0; q < g.positions.length; q += 12) {
          const n: [number, number, number] = [g.normals[q], g.normals[q + 1], g.normals[q + 2]];
          normals.set(normalesAdoucies(g.positions.slice(q, q + 12), n), q);
        }
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      }
    },
  };
}
