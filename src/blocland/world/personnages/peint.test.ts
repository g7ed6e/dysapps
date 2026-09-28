import { AVATAR_PARTS } from '../../Avatar';
import { BIOMES, type BiomeId } from '../../biomes';
import { ARCHIPELAGO_IDS } from '../archipels';
import { BONHOMME, OEIL, OUTIL, TENUE } from './couleurs';
import { bonhommePeint, TAILLE_DU_BONHOMME } from './bonhomme';
import { creaturePeinte, ESPECES } from './creaturesPeintes';
import { TAILLE_DE_CREATURE } from './gabarit';
import { avant, devant, facette, fuseau, pave, peindrePersonnage, pose, repere, type Anneau, type FacettesDePersonnage, type Piece, type V3 } from './peint';

const nbTriangles = (f: FacettesDePersonnage) => f.pieces.length;

function sommet(f: FacettesDePersonnage, t: number, k: number): V3 {
  const o = t * 9 + k * 3;
  return [f.positions[o], f.positions[o + 1], f.positions[o + 2]];
}

/** L'étendue en hauteur des triangles qui vérifient `pred`. */
function hauteurs(f: FacettesDePersonnage, pred: (t: number) => boolean): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (let t = 0; t < nbTriangles(f); t++) {
    if (!pred(t)) continue;
    for (let k = 0; k < 3; k++) {
      const y = sommet(f, t, k)[1];
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  }
  return [lo, hi];
}

/** Le volume signé (théorème de la divergence) : positif si les facettes d'un volume fermé regardent dehors. */
function volume(f: FacettesDePersonnage, pred: (t: number) => boolean = () => true): number {
  let v = 0;
  for (let t = 0; t < nbTriangles(f); t++) {
    if (!pred(t)) continue;
    const [a, b, c] = [0, 1, 2].map((k) => sommet(f, t, k));
    v += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  }
  return v;
}

/** Chaque normale est unitaire et suit l'ordre des sommets (la face avant, pour Three.js). */
function normalesCoherentes(f: FacettesDePersonnage): boolean {
  for (let t = 0; t < nbTriangles(f); t++) {
    const [a, b, c] = [0, 1, 2].map((k) => sommet(f, t, k));
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const len = Math.hypot(n[0], n[1], n[2]);
    const o = t * 9;
    const m = [f.normals[o], f.normals[o + 1], f.normals[o + 2]];
    if (Math.abs(Math.hypot(m[0], m[1], m[2]) - 1) > 1e-4) return false;
    if ((n[0] * m[0] + n[1] * m[1] + n[2] * m[2]) / len < 0.999) return false;
  }
  return true;
}

const seule = (dessiner: Piece['dessiner']) => peindrePersonnage([{ nom: 'essai', pivot: [0, 0, 0], dessiner }]);

describe('Les primitives des personnages', () => {
  it('un fuseau fermé : 2n triangles par segment, n − 2 par fond, facettes vers le dehors', () => {
    const profil: Anneau[] = [
      [0, 1],
      [2, 1],
    ];
    for (const n of [4, 5, 6, 8]) {
      const f = seule((T, pot) => fuseau(T, profil, n, pot(0x808080, 'dominante')));
      expect(nbTriangles(f)).toBe(2 * n + 2 * (n - 2));
      // Le volume d'un prisme à n pans inscrit dans le cercle de rayon 1, sur 2 de haut.
      expect(volume(f)).toBeCloseTo((n / 2) * Math.sin((2 * Math.PI) / n) * 2, 5);
      expect(normalesCoherentes(f)).toBe(true);
    }
  });

  it('un fuseau en pointe, décalé et écrasé, reste fermé et tourné vers le dehors', () => {
    const profil: Anneau[] = [
      [0, 0],
      [0.5, 0.4, 0.2, -0.1, 0.05],
      [1, 0.3, 0.25],
      [1.4, 0],
    ];
    const f = seule((T, pot) => fuseau(T, profil, 6, pot(0x808080, 'dominante'), { x: 3, z: -2 }));
    expect(nbTriangles(f)).toBe(6 + 12 + 6);
    expect(volume(f)).toBeGreaterThan(0);
    expect(normalesCoherentes(f)).toBe(true);
  });

  it('la face avant d’un fuseau regarde −Z, et `devant` donne son plan', () => {
    const profil: Anneau[] = [
      [0, 0.5, 0.4],
      [1, 0.3, 0.2],
    ];
    const f = seule((T, pot) => fuseau(T, profil, 6, pot(0x808080, 'dominante'), { bas: false, haut: false }));
    const face = [10, 11].map((t) => [f.normals[t * 9], f.normals[t * 9 + 1], f.normals[t * 9 + 2]]);
    for (const n of face) expect(n[0]).toBeCloseTo(0, 6);
    for (const n of face) expect(n[2]).toBeLessThan(-0.9);
    const zs = [0, 1, 2].map((k) => sommet(f, 10, k)[2]);
    expect(Math.min(...zs)).toBeCloseTo(devant(profil, 6, 0).z, 6);
    expect(devant(profil, 6, 0.5).z).toBeCloseTo(-0.3 * Math.cos(Math.PI / 6), 6);
    expect(devant(profil, 6, 0).demiLargeur).toBeCloseTo(0.25, 6);
    expect(avant(4)).toBeCloseTo(-Math.PI / 4, 9);
  });

  it('un pavé : douze triangles, son volume, même tourné et déplacé', () => {
    const f = seule((T, pot) => pave(pose(T, repere([1, 2, 3], 0.3, -0.7, 1.1)), 0, 0, 0, 0.5, 2, 0.25, pot(0x808080, 'outil')));
    expect(nbTriangles(f)).toBe(12);
    expect(volume(f)).toBeCloseTo(0.25, 6);
    expect(normalesCoherentes(f)).toBe(true);
  });

  it('un repère tourne sans déformer : les longueurs se gardent', () => {
    const r = repere([0.2, 0, -1], 0.4, 1.2, -0.8);
    const [a, b] = [r([0, 0, 0]), r([1, 2, 2])];
    expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])).toBeCloseTo(3, 9);
    expect(repere([0, 0, 0], 0, 0, Math.PI / 2)([1, 0, 0])[1]).toBeCloseTo(1, 9);
  });

  it('une facette regarde à l’opposé de son dos', () => {
    const f = seule((T, pot) =>
      facette(
        T,
        [
          [0, 0, 0],
          [1, 0, 0],
          [1, 1, 0],
          [0, 1, 0],
        ],
        [0.5, 0.5, 1],
        pot(OEIL, 'yeux'),
      ),
    );
    expect(nbTriangles(f)).toBe(2);
    expect(f.normals[2]).toBeCloseTo(-1, 9);
  });

  it('chaque triangle sait sa pièce et sa couleur de base ; une couleur hors du pot est refusée', () => {
    const f = peindrePersonnage([
      { nom: 'a', pivot: [0, 0, 0], dessiner: (T, pot) => pave(T, 0, 0, 0, 1, 1, 1, pot(0x112233, 'dominante')) },
      { nom: 'b', pivot: [0, 1, 0], lueur: 'nuit', dessiner: (T, pot) => pave(T, 0, 1, 0, 1, 2, 1, pot(0xffd866, 'lueur')) },
    ]);
    expect([...new Set(f.pieces)]).toEqual([0, 1]);
    expect(f.teintes.slice(0, 12).every((c) => c === 0x112233)).toBe(true);
    expect(f.teintes.slice(12).every((c) => c === 0xffd866)).toBe(true);
    expect(f.table).toEqual([
      { nom: 'a', pivot: [0, 0, 0] },
      { nom: 'b', pivot: [0, 1, 0], lueur: 'nuit' },
    ]);
    // Une lueur ne se nuance pas : tous ses sommets ont la même couleur.
    const lueurs = new Set(Array.from({ length: 36 }, (_, i) => f.colors.slice(36 * 3 + i * 3, 36 * 3 + i * 3 + 3).join(',')));
    expect(lueurs.size).toBe(1);
    expect(() => seule((T) => pave(T, 0, 0, 0, 1, 1, 1, () => [0, 0, 0]))).toThrow(/hors du pot/);
  });
});

describe('Le bonhomme en facettes', () => {
  const f = bonhommePeint();
  const tete = f.table.findIndex((p) => p.nom === 'tete');

  it('tient dans son budget : 500 triangles au plus (proposition au directeur artistique, au lieu de 800)', () => {
    expect(nbTriangles(f)).toBeLessThanOrEqual(500);
  });

  it('a les six pièces du bonhomme en blocs, qui pivotent aux mêmes articulations (proportions gardées)', () => {
    expect(f.table.map((p) => p.nom)).toEqual(AVATAR_PARTS.map((p) => p.name));
    const k = TAILLE_DU_BONHOMME / 32;
    for (const [i, p] of AVATAR_PARTS.entries()) {
      const [x, y] = f.table[i].pivot;
      // Même côté, même ordre de hauteur : le cou au-dessus des épaules, les épaules au-dessus des hanches.
      expect(Math.sign(x), p.name).toBe(Math.sign(p.pivot.x - 8));
      expect(Math.abs(y - p.pivot.z * k), p.name).toBeLessThan(0.25);
      expect(f.table[i].pivot[2]).toBe(0);
    }
  });

  it('mesure deux blocs, les pieds en 0, la tête au sixième de sa taille', () => {
    const [bas, haut] = hauteurs(f, () => true);
    expect(bas).toBeCloseTo(0, 6);
    expect(haut).toBeCloseTo(TAILLE_DU_BONHOMME, 2);
    const [t0, t1] = hauteurs(f, (t) => f.pieces[t] === tete);
    expect((t1 - t0) / TAILLE_DU_BONHOMME).toBeCloseTo(1 / 6, 2);
  });

  it('tient dans sa case, centré', () => {
    for (let i = 0; i < f.positions.length; i += 3) {
      expect(Math.abs(f.positions[i])).toBeLessThan(0.5);
      expect(Math.abs(f.positions[i + 2])).toBeLessThan(0.5);
    }
  });

  it('a deux yeux : deux petites facettes sombres sur le devant de la tête, sans blanc', () => {
    const yeux = [...f.teintes.keys()].filter((t) => f.teintes[t] === OEIL);
    expect(yeux).toHaveLength(4);
    for (const t of yeux) {
      expect(f.pieces[t]).toBe(tete);
      expect(f.normals[t * 9 + 2]).toBeCloseTo(-1, 6);
    }
    const cotes = yeux.map((t) => Math.sign(sommet(f, t, 0)[0] + sommet(f, t, 1)[0] + sommet(f, t, 2)[0]));
    expect(cotes.filter((s) => s < 0)).toHaveLength(2);
    expect(cotes.filter((s) => s > 0)).toHaveLength(2);
    expect(f.palette.map((p) => p.couleur)).not.toContain(0xffffff);
  });

  it('porte les couleurs du directeur artistique, et rien qui brille', () => {
    expect(new Set(f.palette.map((p) => p.couleur))).toEqual(new Set([...Object.values(BONHOMME), OEIL]));
    expect(f.palette.some((p) => p.role === 'lueur')).toBe(false);
    expect(f.table.some((p) => p.lueur)).toBe(false);
  });

  it('a des facettes cohérentes (normales unitaires, dans le sens des sommets) et un volume qui regarde dehors', () => {
    expect(normalesCoherentes(f)).toBe(true);
    for (const i of f.table.keys()) expect(volume(f, (t) => f.pieces[t] === i && f.teintes[t] !== OEIL), f.table[i].nom).toBeGreaterThan(0);
  });
});

describe('Les créatures en facettes', () => {
  const LUMINEUSES: BiomeId[] = ['phare', 'textes', 'forge'];
  const MATIERES_D_OUTIL = new Set<number>([...Object.values(OUTIL), ...Object.values(TENUE)]);

  it('chaque île a sa créature, une espèce par île', () => {
    expect(Object.keys(ESPECES).sort()).toEqual(BIOMES.map((b) => b.id).sort());
    expect(new Set(Object.values(ESPECES).map((e) => e.nom)).size).toBe(BIOMES.length);
  });

  it('tiennent dans leur budget : 2 500 triangles au plus par archipel, toutes ensemble', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const somme = BIOMES.filter((b) => b.classe === a).reduce((n, b) => n + nbTriangles(creaturePeinte(b.id)), 0);
      expect(somme, a).toBeLessThanOrEqual(2_500);
    }
  });

  for (const b of BIOMES)
    describe(`${ESPECES[b.id]?.nom} (${b.id})`, () => {
      const f = creaturePeinte(b.id);
      const piece = (nom: string) => f.table.findIndex((p) => p.nom === nom);
      const sansOutil = (t: number) => f.table[f.pieces[t]].nom !== 'outil';

      it('debout, 1,3 fois le bonhomme (2,6 blocs à un dixième près), la tête au cinquième', () => {
        const [bas, haut] = hauteurs(f, sansOutil);
        expect(bas).toBeCloseTo(0, 6);
        expect(Math.abs(haut - 1.3 * TAILLE_DU_BONHOMME)).toBeLessThanOrEqual(0.1 + 1e-9);
        const [t0, t1] = hauteurs(f, (t) => f.pieces[t] === piece('tete'));
        expect((t1 - t0) / TAILLE_DE_CREATURE).toBeCloseTo(1 / 5, 2);
      });

      it('a son corps, sa tête, son bras porteur et son outil de métier, pièces à part', () => {
        for (const nom of ['corps', 'tete', 'bras', 'outil']) expect(f.pieces.includes(piece(nom)), nom).toBe(true);
      });

      it(b.id === 'phare' ? 'n’a pas d’yeux (sa tête est une lanterne)' : 'a deux petits yeux sombres, sans blanc ni sourire', () => {
        const yeux = [...f.teintes.keys()].filter((t) => f.teintes[t] === OEIL);
        if (b.id === 'phare') return expect(yeux).toEqual([]);
        expect(yeux).toHaveLength(4);
        for (const t of yeux) {
          expect(f.table[f.pieces[t]].nom).toBe('yeux');
          expect(f.normals[t * 9 + 2]).toBeCloseTo(-1, 6);
        }
        const cotes = yeux.map((t) => Math.sign(sommet(f, t, 0)[0] + sommet(f, t, 1)[0] + sommet(f, t, 2)[0]));
        expect(cotes.filter((s) => s < 0)).toHaveLength(2);
        // Les yeux sont petits : chacun moins de 5 centièmes de bloc de côté.
        for (const t of yeux) for (let k = 0; k < 3; k++) expect(Math.abs(sommet(f, t, k)[1] - sommet(f, t, 0)[1])).toBeLessThan(0.05);
      });

      it('a trois couleurs : une dominante (et sa marque), une tenue, des outils de bois, de fer, de laiton, de lin ou de cuir', () => {
        const de = (role: string) => new Set(f.palette.filter((p) => p.role === role).map((p) => p.couleur));
        expect(de('dominante').size).toBeGreaterThanOrEqual(1);
        expect(de('dominante').size).toBeLessThanOrEqual(2);
        expect(de('tenue').size).toBe(1);
        for (const c of de('outil')) expect(MATIERES_D_OUTIL.has(c), c.toString(16)).toBe(true);
        expect([...de('yeux')].every((c) => c === OEIL)).toBe(true);
      });

      it(LUMINEUSES.includes(b.id) ? 'brille la nuit, d’une seule pièce' : 'ne brille pas', () => {
        const lueurs = f.table.filter((p) => p.lueur);
        expect(lueurs.map((p) => p.lueur)).toEqual(LUMINEUSES.includes(b.id) ? ['nuit'] : []);
        const i = f.table.findIndex((p) => p.lueur);
        for (let t = 0; t < nbTriangles(f); t++) expect(f.pieces[t] === i, `triangle ${t}`).toBe(f.palette.some((p) => p.role === 'lueur' && p.couleur === f.teintes[t]) && i >= 0);
      });

      it('a des facettes cohérentes et reste près de sa case (outil à part)', () => {
        expect(normalesCoherentes(f)).toBe(true);
        for (let t = 0; t < nbTriangles(f); t++) {
          if (!sansOutil(t)) continue;
          for (let k = 0; k < 3; k++) {
            const [x, , z] = sommet(f, t, k);
            expect(Math.max(Math.abs(x), Math.abs(z))).toBeLessThan(0.75);
          }
        }
      });
    });
});
