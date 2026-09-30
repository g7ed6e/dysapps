// Le rendu des blocs assemblés (GD-2) dans les deux univers : chaque bloc a son motif (jamais la couleur seule), dans la
// texture pixel de Blocland (3D et 2D) comme dans la construction taillée d'Archipéo (peint par le shader, sans un
// triangle de plus). Voir world/pixels.ts, world/palette.ts (`DETAILS_ASSEMBLES`) et world/construction.ts
// (`MOTIF_ASSEMBLE`, `MOTIF_GLSL`).
import { BLOCKS, type BlockId } from "../biomes";
import type { VoxelCube } from "./cube";
import {
  detailDuMotif,
  maillageDeLaConstruction,
  MOTIF_ASSEMBLE,
  MOTIF_GLSL,
  type BlocAssemble,
} from "./construction";
import {
  DETAILS_ASSEMBLES,
  luminance,
  MATIERES,
  type Couleur,
} from "./palette";
import { PAINTERS, SIZE, type TextureKind } from "./pixels";

const ASSEMBLES = Object.keys(MOTIF_ASSEMBLE) as BlocAssemble[];

/** Les pixels d'une face, en luminance (le hasard du canvas remplacé par une suite fixe). */
function luminances(kind: TextureKind, face: "top" | "side"): number[] {
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const out: number[] = [];
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const [cr, cg, cb] = PAINTERS[kind][face](x, y, r);
      out.push(0.2126 * cr + 0.7152 * cg + 0.0722 * cb);
    }
  return out;
}

/**
 * Le motif d'une face, sans ses couleurs : les pixels qui s'écartent du ton le plus fréquent de la face (son fond) de
 * plus de 12 niveaux de luminance.
 */
function masque(kind: TextureKind, face: "top" | "side"): boolean[] {
  const l = luminances(kind, face);
  const compte = new Map<number, number>();
  for (const v of l)
    compte.set(Math.round(v / 8), (compte.get(Math.round(v / 8)) ?? 0) + 1);
  const fond = [...compte].sort((a, b) => b[1] - a[1])[0][0] * 8;
  return l.map((v) => Math.abs(v - fond) > 12);
}

const ecart = (a: boolean[], b: boolean[]) =>
  a.filter((v, i) => v !== b[i]).length / a.length;

describe("Les blocs assemblés dans Blocland (textures pixel)", () => {
  it("chaque bloc assemblé a sa texture, ses deux faces peintes", () => {
    for (const b of ASSEMBLES) {
      expect(BLOCKS[b as BlockId].assemble, b).toBe(true);
      expect(BLOCKS[b as BlockId].texture, b).toBe(b);
      expect([typeof PAINTERS[b].top, typeof PAINTERS[b].side], b).toEqual([
        "function",
        "function",
      ]);
    }
  });

  it("un motif propre à chacun : leurs formes diffèrent entre elles et de toutes les autres textures, sans les couleurs", () => {
    const toutes = Object.keys(PAINTERS) as TextureKind[];
    for (const b of ASSEMBLES)
      for (const autre of toutes) {
        if (autre === b) continue;
        // Au moins un pixel sur huit du dessin à une autre place (le plus proche : l'engrenage et la lanterne, 14 %,
        // une roue dentée contre un cadre carré).
        for (const face of ["top", "side"] as const)
          expect(
            ecart(masque(b, face), masque(autre, face)),
            `${b} / ${autre} (${face})`,
          ).toBeGreaterThan(0.125);
      }
  });

  it("le motif se lit : ses deux tons principaux sont bien séparés (pas un grain ni un moiré)", () => {
    for (const b of ASSEMBLES)
      for (const face of ["top", "side"] as const) {
        const l = luminances(b, face);
        const tons = new Set(l.map((v) => Math.round(v)));
        // Peu de tons (un dessin, pas du bruit), et un écart franc entre le plus clair et le plus sombre.
        if (b !== "engrenage")
          expect(tons.size, `${b} ${face}`).toBeLessThanOrEqual(10);
        expect(Math.max(...l) - Math.min(...l), `${b} ${face}`).toBeGreaterThan(
          80,
        );
      }
  });
});

describe("Les blocs assemblés dans Archipéo (construction taillée)", () => {
  /** Le dessin d'un motif sur une grille de 32 × 32 points d'une face : ses traits, là où le détail peint change. */
  const masqueDuMotif = (b: BlocAssemble, dessus: boolean) => {
    const at = (i: number, j: number) =>
      detailDuMotif(b, (i + 0.5) / 32 - 0.5, (j + 0.5) / 32 - 0.5, dessus);
    const out: boolean[] = [];
    for (let j = 0; j < 32; j++)
      for (let i = 0; i < 32; i++)
        out.push(
          (i > 0 && at(i - 1, j) !== at(i, j)) ||
            (j > 0 && at(i, j - 1) !== at(i, j)),
        );
    return out;
  };

  it("chaque bloc a son fond dans la palette et son motif peint, des numéros à part de ceux des pièces", () => {
    for (const b of ASSEMBLES) {
      expect(MATIERES[b], b).toBeDefined();
      expect(MOTIF_ASSEMBLE[b]).toBeGreaterThan(10);
      expect(Object.keys(DETAILS_ASSEMBLES)).toContain(b);
    }
    expect(new Set(Object.values(MOTIF_ASSEMBLE)).size).toBe(ASSEMBLES.length);
    expect(MOTIF_GLSL).toContain(
      "vec3 motifAssemble(vec3 c, float m, vec3 pos, vec3 n)",
    );
    // Les dérivées d'abord, puis les branchements ; de loin, le motif s'efface (jamais de moiré).
    expect(MOTIF_GLSL.indexOf("fwidth")).toBeLessThan(
      MOTIF_GLSL.indexOf("if (m <"),
    );
    expect(MOTIF_GLSL).toContain("(1.0 / fw - 6.0) / 6.0");
  });

  it("les motifs diffèrent par leur forme, deux à deux, sur le côté comme sur le dessus", () => {
    for (const dessus of [false, true])
      for (const a of ASSEMBLES)
        for (const b of ASSEMBLES)
          if (a < b)
            expect(
              ecart(masqueDuMotif(a, dessus), masqueDuMotif(b, dessus)),
              `${a} / ${b}`,
            ).toBeGreaterThan(0.08);
  });

  it("chaque détail se détache de son fond (en gris aussi)", () => {
    const contraste = (x: Couleur, y: Couleur) => {
      const [l1, l2] = [luminance(x), luminance(y)].sort((p, q) => q - p);
      return (l1 + 0.05) / (l2 + 0.05);
    };
    const principal: Record<BlocAssemble, Couleur> = {
      poutre: DETAILS_ASSEMBLES.poutre.collier,
      vitrail: DETAILS_ASSEMBLES.vitrail.verre,
      engrenage: DETAILS_ASSEMBLES.engrenage.roue,
      miroir: DETAILS_ASSEMBLES.miroir.laiton,
    };
    for (const b of ASSEMBLES)
      expect(contraste(principal[b], MATIERES[b].cote), b).toBeGreaterThan(1.4);
  });

  it("le maillage porte le motif sur les faces des blocs assemblés seulement, jamais sur une île fermée", () => {
    const cube = (
      x: number,
      texture: string,
      autre: Partial<VoxelCube> = {},
    ): VoxelCube => ({
      x,
      y: 0,
      z: 1,
      color: "#888888",
      texture,
      tag: "port",
      ...autre,
    });
    const m = maillageDeLaConstruction("6e", [
      cube(0, "pierre"),
      cube(1, "poutre"),
      cube(2, "vitrail"),
      cube(3, "miroir", { muted: true }),
    ]);
    // Chaque triangle, rangé par la case sous son centre ; ses trois sommets portent le motif de son bloc.
    const vus = new Map<number, Set<number>>();
    const { indices, positions, normals, motifs } = m.opaque;
    for (let t = 0; t < indices.length / 3; t++) {
      const s = [0, 1, 2].map((k) => indices[3 * t + k]);
      const x = Math.floor(
        (positions[3 * s[0]] + positions[3 * s[1]] + positions[3 * s[2]]) / 3 -
          normals[3 * s[0]] * 0.25,
      );
      if (!vus.has(x)) vus.set(x, new Set());
      for (const i of s) vus.get(x)!.add(motifs[i]);
    }
    expect([...vus.get(0)!]).toEqual([0]);
    expect([...vus.get(1)!]).toEqual([MOTIF_ASSEMBLE.poutre]);
    expect([...vus.get(2)!]).toEqual([MOTIF_ASSEMBLE.vitrail]);
    expect([...vus.get(3)!]).toEqual([0]);
  });
});
