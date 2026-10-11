// La Nef d'Archipéo importée (GD-15, lot « Archipéo peint » ; choix du mainteneur, 11 octobre 2026) : ses trois formes
// (voilier, dirigeable, aéronef) modelées à la main en aplats (scripts/rendu/modeles/nef.py), une par fichier, dans
// docs/univers/archipeo/nef/modeles/. Code pur, sans DOM ni Three.js : le registre, la pose de la forme montrée sur les
// cubes qu'elle remplace, et la mue en pièces peintes (chaque partie glisse vers sa sœur de la forme suivante), que la
// scène (../three/ship.ts) et le budget lisent. Ce qui charge les fichiers est à part (../importedNef.ts, et le disque
// pour les tests et le budget : ./nefModels.fromDisk.testing.ts).
//
// Le jeu ne change pas : les cases de chaque forme, ce qu'on pose et la sauvegarde restent ceux de ./vehicle.ts, communs
// à Blocland (seules les pièces de l'aéronef se montrent à d'autres places, `shownPieces`). Le modèle remplace les cubes
// posés de la forme montrée ; les pièces de l'étape en chantier restent des cubes (posées) ou des fantômes. Tant que le fichier d'une forme n'est pas chargé (ou hors ligne sans lui), la Nef garde
// ses cubes.
import type { VoxelCube } from './cube';
import type { ModeleLu } from './characters/imported/glb';
import { facetNormals, finish, isFire, shell, type ImportedMonument } from './monumentModels';
import { vehicleForm } from './vehicle';

/** Le fichier de chaque forme (1 : voilier, 2 : dirigeable, 3 : aéronef), dans docs/univers/archipeo/nef/modeles/. */
export const NEF_MODELS: Readonly<Record<number, string>> = { 1: '1-voilier/final-1264.glb', 2: '2-dirigeable/final-1704.glb', 3: '3-aeronef/final-1464.glb' };

/**
 * Les sœurs de la mue : pour chaque partie de la forme qui arrive, la partie de la forme d'avant qui glisse vers elle (la
 * voile gonfle en ballon, le ballon se fait cabine…). Une partie d'avant peut nourrir deux parties ; celle qui ne nourrit
 * rien (la cabine et la bôme du voilier) rapetisse sur place.
 */
export const NEF_SISTERS: Readonly<Record<number, Readonly<Record<string, string>>>> = {
  2: { coque: 'coque', lanterne: 'lanterne', ballon: 'voile', empennage: 'vergue', suspentes: 'mat' },
  3: { coque: 'coque', lanterne: 'lanterne', cabine: 'ballon', rotor: 'ballon', mat: 'suspentes', helices: 'empennage', derive: 'empennage' },
};

/** Une partie d'une forme : ses facettes dans le repère de la Nef (en cases, Three : y en haut, la proue vers −z) et sa boîte. */
export interface NefPart {
  name: string;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  min: [number, number, number];
  max: [number, number, number];
}

const loaded = new Map<number, NefPart[]>();

/** Range une forme lue (par la vue ou par un test), partie par partie (un os du fichier). */
export function registerNef(form: number, read: ModeleLu): void {
  const bones = read.skin?.bones ?? [{ name: 'coque' }];
  const joints = read.skin?.joints;
  const parts = bones.map(() => ({ pos: [] as number[], col: [] as number[] }));
  const p = read.positions;
  for (let t = 0; t < p.length / 9; t++) {
    // Une partie par triangle : celle de son premier sommet (chaque sommet a un seul os, de poids 1).
    const part = parts[joints ? joints[t * 12] : 0];
    for (let i = t * 9; i < t * 9 + 9; i++) {
      part.pos.push(p[i]);
      part.col.push(read.colors[i]);
    }
  }
  loaded.set(
    form,
    bones.map((b, j) => {
      const positions = Float32Array.from(parts[j].pos);
      const min: [number, number, number] = [Infinity, Infinity, Infinity];
      const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < positions.length; i++) {
        min[i % 3] = Math.min(min[i % 3], positions[i]);
        max[i % 3] = Math.max(max[i % 3], positions[i]);
      }
      return { name: b.name, positions, normals: facetNormals(positions), colors: Float32Array.from(parts[j].col), min, max };
    }),
  );
}

/** Les parties d'une forme chargée, ou `null`. */
export const nefParts = (form: number): readonly NefPart[] | null => loaded.get(form) ?? null;

/** Les facettes de quelques parties, prêtes pour la construction taillée : la lanterne dans les fenêtres (la lueur la nuit). */
export function nefFacets(parts: readonly NefPart[], replaced: Set<string> = new Set()): ImportedMonument {
  const opaque = shell();
  const fire = shell();
  for (const part of parts) {
    const { positions: p, normals: n, colors: c } = part;
    for (let t = 0; t < p.length; t += 9) {
      const target = isFire(c[t], c[t + 1], c[t + 2]) ? fire : opaque;
      for (let i = t; i < t + 9; i++) {
        target.pos.push(p[i]);
        target.nor.push(n[i]);
        target.col.push(c[i]);
      }
    }
  }
  return { id: 'nef', stage: 1, opaque: finish(opaque), fire: finish(fire), halo: null, cellules: [], replaced };
}

/**
 * La Nef telle que le monde la montre : la forme `form` (1 à 3) en modèle, à la place de ses cubes posés ; `null` pour
 * le voilier pas encore construit (forme 0) ou une forme pas chargée (les cubes restent).
 */
export function nefOf(form: number, cubes: readonly VoxelCube[]): ImportedMonument | null {
  const parts = form >= 1 ? nefParts(form) : null;
  if (!parts) return null;
  const own = new Set(vehicleForm(form, true).map((c) => `${c.x},${c.y},${c.z}`));
  const replaced = new Set(cubes.filter((c) => !c.ghost && own.has(`${c.x},${c.y},${c.z}`)).map((c) => `${c.x},${c.y},${c.z}`));
  return nefFacets(parts, replaced);
}

// ---------- La mue ----------

/** Un morceau de la mue : une partie (de la forme d'avant ou de celle qui arrive), qui part d'une boîte et va vers une autre. */
export interface MoltPiece {
  part: NefPart;
  /** Vrai : une partie de la forme d'avant (montrée pendant la première moitié de son glissé) ; faux : de la nouvelle. */
  before: boolean;
  from: { min: readonly number[]; max: readonly number[] };
  to: { min: readonly number[]; max: readonly number[] } | null;
}

/**
 * Les morceaux de la mue de la forme `form − 1` vers `form` : chaque partie neuve et sa sœur glissent l'une vers l'autre ;
 * une partie d'avant sans sœur rapetisse ; une partie neuve sans sœur grandit sur place.
 */
export function moltPieces(form: number): MoltPiece[] | null {
  const before = nefParts(form - 1);
  const after = nefParts(form);
  if (!before || !after) return null;
  const sisters = NEF_SISTERS[form] ?? {};
  const pieces: MoltPiece[] = [];
  const used = new Set<string>();
  for (const part of after) {
    const sister = before.find((b) => b.name === sisters[part.name]);
    if (!sister) {
      pieces.push({ part, before: false, from: part, to: null });
      continue;
    }
    used.add(sister.name);
    pieces.push({ part: sister, before: true, from: sister, to: part });
    pieces.push({ part, before: false, from: sister, to: part });
  }
  for (const part of before) if (!used.has(part.name)) pieces.push({ part, before: true, from: part, to: null });
  return pieces;
}

/** Une douce accélération puis un arrêt doux, sans rebond (comme la mue en cubes, ./metamorphosis.ts). */
const douce = (k: number) => k * k * (3 - 2 * k);

/**
 * La pose d'un morceau à l'avancement `k` (0 à 1) : l'échelle sur chaque axe et le décalage qui envoient sa partie, de sa
 * boîte, vers la boîte du moment (`out` : [sx, sy, sz, dx, dy, dz], réutilisé, rien d'alloué par image) ; une échelle
 * nulle le cache. Ce qui glisse le fait pendant les deux tiers du milieu, la partie d'avant jusqu'à mi-chemin, la neuve
 * ensuite ; une partie seule rapetisse pendant le premier tiers ou grandit pendant le dernier.
 */
export function moltPose(m: MoltPiece, k: number, out: number[]): number[] {
  const t = Math.min(1, Math.max(0, k));
  const own = m.part;
  if (!m.to) {
    const s = m.before ? 1 - douce(Math.min(1, t * 3)) : douce(Math.max(0, t * 3 - 2));
    for (let a = 0; a < 3; a++) {
      const c = (own.min[a] + own.max[a]) / 2;
      out[a] = s;
      out[a + 3] = c - c * s;
    }
    return out;
  }
  const u = douce(Math.min(1, Math.max(0, (t - 1 / 6) * 1.5)));
  const shown = m.before ? u < 0.5 : u >= 0.5;
  for (let a = 0; a < 3; a++) {
    if (!shown) {
      out[a] = 0;
      out[a + 3] = 0;
      continue;
    }
    const lo = m.from.min[a] + (m.to.min[a] - m.from.min[a]) * u;
    const hi = m.from.max[a] + (m.to.max[a] - m.from.max[a]) * u;
    // La boîte de la partie montrée devient celle du moment (une partie plate, une voile, s'épaissit en glissant).
    const s = (hi - lo) / Math.max(own.max[a] - own.min[a], 1e-3);
    out[a] = s;
    out[a + 3] = (lo + hi) / 2 - ((own.min[a] + own.max[a]) / 2) * s;
  }
  return out;
}
