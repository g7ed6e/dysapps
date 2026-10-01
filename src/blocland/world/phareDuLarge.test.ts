import { describe, expect, it } from 'vitest';
import { toutConstruit } from './budget';
import { caseDeLaPiece, maillageDeLaConstruction, miseBoutABout, MOTIF_ASSEMBLE, type GroupeDeConstruction, type MaillageDeLaConstruction } from './construction';
import { Pinceau } from './decor/pinceau';
import { getMonument, MONUMENTS } from './monuments';
import { planCells } from './plans';
import { COULEURS_DU_PHARE_DU_LARGE, dessinerPhareDuLarge, hublotsDuPhareDuLarge, MESURES_DU_PHARE_DU_LARGE, PHARE_DU_LARGE, phareDuLarge } from './phareDuLarge';
import { monumentAnchor, worldCubes } from './terrain';

/** Le centre et la normale du triangle `t` d'un groupe (repère Three : x, hauteur, y). */
function triangle(g: GroupeDeConstruction, t: number) {
  const p = [0, 1, 2].map((k) => {
    const v = g.indices[t * 3 + k];
    return [g.positions[v * 3], g.positions[v * 3 + 1], g.positions[v * 3 + 2]];
  });
  const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
  const w = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]];
  const cr = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  const l = Math.hypot(cr[0], cr[1], cr[2]) || 1;
  const centre = (i: number) => (p[0][i] + p[1][i] + p[2][i]) / 3;
  return { point: { x: centre(0), y: centre(1), z: centre(2) }, normale: { x: cr[0] / l, y: cr[1] / l, z: cr[2] / l } };
}

describe('Le phare du large du 5e (revue d’ensemble, DA-4 : Archipéo seulement)', () => {
  const { progress, village } = toutConstruit();
  const m = getMonument(PHARE_DU_LARGE);
  if (!m) throw new Error('monument absent');

  it('est le monument « Le phare du large » des Îles Brumeuses, que Blocland garde en blocs', () => {
    expect(m.archipelago).toBe('5e');
    expect(m.name).toBe('Le phare du large');
    expect(MONUMENTS.filter((x) => x.id === PHARE_DU_LARGE)).toHaveLength(1);
  });

  it('fini, remplace tous ses cubes par le modèle ; pas fini, les cubes et les fantômes restent', () => {
    const cubes = worldCubes('5e', progress, village, false);
    const siens = cubes.filter((c) => c.place === `monument:${PHARE_DU_LARGE}` && !c.sol);
    expect(siens.length).toBe(m.cells.length);
    const { pose, remplacees } = phareDuLarge(cubes);
    expect(pose).not.toBeNull();
    expect(remplacees.size).toBe(siens.length);
    expect(pose!.cellules).toHaveLength(siens.length);

    const moitie = { ...village, plans: { ...village.plans, [PHARE_DU_LARGE]: (village.plans[PHARE_DU_LARGE] ?? []).slice(1) } };
    const enCours = phareDuLarge(worldCubes('5e', progress, moitie, false));
    expect(enCours.pose).toBeNull();
    expect(enCours.remplacees.size).toBe(0);
  });

  it('ses hublots (GD-2) : deux, ronds, à mi-hauteur sur les pans tournés vers la caméra, peints en hublot, dans ses triangles', () => {
    const cubes = worldCubes('5e', progress, village, false).filter((c) => c.tag === m.biome && !c.sol);
    const { pose } = phareDuLarge(cubes);
    const hublots = hublotsDuPhareDuLarge(pose!);
    expect(hublots).toHaveLength(2);
    // Posés sur le fût, un peu en avant de son pan, dans ses cases ; calés sur la grille pour que le hublot soit centré.
    for (const h of hublots)
      for (const p of h.points) {
        const r = Math.hypot(p[0] - pose!.cx, p[1] - pose!.cz);
        expect(r).toBeLessThan(MESURES_DU_PHARE_DU_LARGE.tour.rayon[0] + 0.1);
        expect(p[2] - pose!.pied).toBeGreaterThan(MESURES_DU_PHARE_DU_LARGE.tour.bas);
        expect(p[2] - pose!.pied).toBeLessThan(MESURES_DU_PHARE_DU_LARGE.tour.haut);
      }
    expect(Math.abs(((pose!.cx % 1) + 1) % 1 - 0.5)).toBeLessThan(1e-9);
    const g = maillageDeLaConstruction('5e', cubes);
    const [t0, t1] = g.phareDuLarge!.opaque;
    const peints = new Set<number>();
    for (let t = t0; t < t1; t++) if (g.opaque.motifs[g.opaque.indices[3 * t]] === MOTIF_ASSEMBLE.vitrail) peints.add(t);
    expect(peints.size).toBe(2 * hublots.length);
  });

  it('tient dans les cases du monument : 5 × 5 au pied, 3 × 3 pour la tour, sous ses 11 cases de haut', () => {
    const { pose } = phareDuLarge(worldCubes('5e', progress, village, false));
    const o = monumentAnchor(m);
    expect(pose!.pied).toBe(o.z);
    const P = new Pinceau();
    const L = new Pinceau();
    dessinerPhareDuLarge(P, L, pose!);
    const xs = planCells(m).map((c) => o.x + c.x);
    const ys = planCells(m).map((c) => o.y + c.y);
    for (const f of [P.fin(), L.fin()])
      for (let i = 0; i < f.positions.length; i += 3) {
        const [x, h, y] = [f.positions[i], f.positions[i + 1], f.positions[i + 2]];
        expect(x).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6);
        expect(x).toBeLessThanOrEqual(Math.max(...xs) + 1 + 1e-6);
        expect(y).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6);
        expect(y).toBeLessThanOrEqual(Math.max(...ys) + 1 + 1e-6);
        expect(h).toBeGreaterThanOrEqual(o.z - 1e-6);
        expect(h).toBeLessThanOrEqual(o.z + 11);
        // Au-dessus du socle, la tour reste dans le carré de l'ancien fût (3 × 3, au milieu).
        if (h > o.z + 1.01) expect(Math.max(Math.abs(x - pose!.cx), Math.abs(y - pose!.cz))).toBeLessThanOrEqual(1.5 + 1e-6);
      }
  });

  it('a un feu ouvert qui prend la lueur #FFD866 la nuit, fixe ; ni bandes ni toit : la pierre #7D8A86', () => {
    const { pose } = phareDuLarge(worldCubes('5e', progress, village, false));
    const P = new Pinceau();
    const L = new Pinceau();
    dessinerPhareDuLarge(P, L, pose!);
    const feu = L.fin();
    expect(feu.positions.length).toBeGreaterThan(0);
    expect(feu.colorsNuit).toBeDefined();
    expect(COULEURS_DU_PHARE_DU_LARGE.feuDeNuit).toBe(0xffd866);
    expect(COULEURS_DU_PHARE_DU_LARGE.pierre).toBe(0x7d8a86);
    // La nuit, le feu est d'une seule couleur, pleine (la lueur) : rien ne varie d'un sommet à l'autre.
    const n = feu.colorsNuit!;
    for (let i = 3; i < n.length; i += 3) expect([n[i], n[i + 1], n[i + 2]]).toEqual([n[0], n[1], n[2]]);
    // Île fermée : le feu est éteint (rien dans les lueurs).
    const Pm = new Pinceau();
    const Lm = new Pinceau();
    dessinerPhareDuLarge(Pm, Lm, { ...pose!, muted: true });
    expect(Lm.triangles).toBe(0);
  });

  it('dans la construction taillée : un dessin en facettes, touchable par ses cases, sans cube du monument', () => {
    const cubes = worldCubes('5e', progress, village, false).filter((c) => c.tag === m.biome && !c.sol);
    const mm = maillageDeLaConstruction('5e', cubes);
    expect(mm.phareDuLarge).toBeDefined();
    const [t0, t1] = mm.phareDuLarge!.opaque;
    expect(t1).toBeGreaterThan(t0);
    const [f0, f1] = mm.phareDuLarge!.fenetres;
    expect(f1).toBeGreaterThan(f0);
    expect(mm.phareDuLarge!.cellules.length).toBe(m.cells.length);
  });

  it('touché sur un triangle de son dessin, rend une case du monument, seul ou mis bout à bout avec une autre île', () => {
    const tous = worldCubes('5e', progress, village, false);
    const cles = new Set(tous.filter((c) => c.place === `monument:${PHARE_DU_LARGE}` && !c.sol).map((c) => `${c.x},${c.y},${c.z}`));
    expect(cles.size).toBe(m.cells.length);
    const mm = maillageDeLaConstruction('5e', tous.filter((c) => c.tag === m.biome && !c.sol));
    const autreIle = tous.find((c) => c.tag && c.tag !== m.biome && !c.sol)!.tag;
    const autre = maillageDeLaConstruction('5e', tous.filter((c) => c.tag === autreIle && !c.sol));
    expect(autre.phareDuLarge).toBeUndefined();
    const bout = miseBoutABout([autre, mm]);
    const verifier = (x: MaillageDeLaConstruction) => {
      for (const groupe of ['opaque', 'fenetres'] as const) {
        const [t0, t1] = x.phareDuLarge![groupe];
        expect(t1).toBeGreaterThan(t0);
        for (let t = t0; t < t1; t++) {
          const { point, normale } = triangle(x[groupe], t);
          const r = caseDeLaPiece(x, groupe, t, point, normale);
          expect(r, `${groupe} ${t}`).not.toBeNull();
          expect(cles.has(`${r!.cell.x},${r!.cell.y},${r!.cell.z}`), `${groupe} ${t}`).toBe(true);
          // La case voisine est à un pas de la case touchée.
          expect(Math.abs(r!.next.x - r!.cell.x) + Math.abs(r!.next.y - r!.cell.y) + Math.abs(r!.next.z - r!.cell.z)).toBe(1);
        }
        // Hors de son dessin, rien : le triangle juste avant (l'autre île, une fois mis bout à bout).
        if (t0 > 0) expect(caseDeLaPiece(x, groupe, t0 - 1, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBeNull();
      }
    };
    verifier(mm);
    // Mis bout à bout derrière une autre île, ses triangles sont décalés : le toucher suit.
    expect(bout.phareDuLarge!.opaque[0]).toBe(mm.phareDuLarge!.opaque[0] + autre.opaque.indices.length / 3);
    verifier(bout);
  }, 30_000);
});
