import { AVATAR_PARTS } from '../../Avatar';
import { BIOMES, type BiomeId } from '../../biomes';
import { ARCHIPELAGO_IDS } from '../archipelagos';
import { ambianceDe, BRUME, SOLS } from '../palette';
import { BONHOMME, LUEUR, OEIL, OUTIL, TENUE, VERRE_DE_FI } from './colors';
import { bonhommePeint, TAILLE_DU_BONHOMME, TETE_DU_BONHOMME } from './avatar';
import { creaturePeinte, ESPECES } from './paintedCreatures';
import { GABARITS, tailleDe, type Gabarit } from './template';
import { avant, devant, facette, fuseau, pave, peindrePersonnage, pose, repere, type Anneau, type FacettesDePersonnage, type Piece, type V3 } from './painted';
import { PAS_A_40_PIXELS, pixels, projeter } from './projection';

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

/** La luminance relative d'une couleur (sRGB linéarisé, pondération de la WCAG). */
function luminance(c: number): number {
  const f = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f((c >> 16) & 255) + 0.7152 * f((c >> 8) & 255) + 0.0722 * f(c & 255);
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

  it('mesure deux blocs, les pieds en 0, la tête à 1/5,5 de sa taille (un collégien, pas un adulte)', () => {
    const [bas, haut] = hauteurs(f, () => true);
    expect(bas).toBeCloseTo(0, 6);
    expect(haut).toBeCloseTo(TAILLE_DU_BONHOMME, 2);
    const [t0, t1] = hauteurs(f, (t) => f.pieces[t] === tete);
    expect(TETE_DU_BONHOMME).toBeCloseTo(1 / 5.5, 9);
    expect((t1 - t0) / TAILLE_DU_BONHOMME).toBeCloseTo(1 / 5.5, 2);
  });

  it('a les jambes 5 % plus courtes qu’au premier dessin, le poignet en haut de la cuisse, les bras écartés de 6 à 8°', () => {
    const jambe = f.table.findIndex((p) => p.nom === 'jambe-droite');
    const [, hanches] = hauteurs(f, (t) => f.pieces[t] === jambe);
    expect(hanches).toBeCloseTo(0.92 * 0.95, 3);
    for (const nom of ['bras-gauche', 'bras-droit']) {
      const i = f.table.findIndex((p) => p.nom === nom);
      const [, poignet] = hauteurs(f, (t) => f.pieces[t] === i && f.teintes[t] === BONHOMME.peau);
      expect(poignet, nom).toBeGreaterThan(hanches - 0.08);
      expect(poignet, nom).toBeLessThan(hanches + 0.05);
      // L'axe du bras : de l'épaule au milieu de la main.
      let [x, y, n] = [0, 0, 0];
      for (let t = 0; t < nbTriangles(f); t++)
        if (f.pieces[t] === i && f.teintes[t] === BONHOMME.peau)
          for (let k = 0; k < 3; k++) {
            x += sommet(f, t, k)[0];
            y += sommet(f, t, k)[1];
            n++;
          }
      const [px, py] = f.table[i].pivot;
      const angle = (Math.atan2(Math.abs(x / n - px), py - y / n) * 180) / Math.PI;
      expect(Math.sign(x / n - px), nom).toBe(Math.sign(px));
      expect(angle, nom).toBeGreaterThanOrEqual(6);
      expect(angle, nom).toBeLessThanOrEqual(8);
    }
  });

  describe('porte un sac à dos (la planche maître), sans besace ni bandoulière', () => {
    /** Le centre d'un triangle, sur l'axe `k` (0 : X, 1 : Y, 2 : Z). */
    const centre = (t: number, k: number) => (sommet(f, t, 0)[k] + sommet(f, t, 1)[k] + sommet(f, t, 2)[k]) / 3;
    const sable = (t: number) => f.teintes[t] === BONHOMME.rabat;
    const bretelle = (t: number) => f.teintes[t] === BONHOMME.bretelles;
    const sac = (t: number) => f.teintes[t] === BONHOMME.sac || sable(t);
    /** L'aire vue, en blocs carrés, de ce qui vérifie `pred` (au centième de bloc). */
    const aire = (angle: number, pred: (t: number) => boolean) => pixels(projeter(f, { angle, pas: 0.01 }), pred) * 0.01 * 0.01;

    it('ses deux bretelles de cuir (0,06 bloc de large) se voient de face, une de chaque côté, sur la poitrine', () => {
      for (const cote of [-1, 1]) {
        const devant = (t: number) => bretelle(t) && centre(t, 2) < 0 && Math.sign(centre(t, 0)) === cote;
        // Au moins 0,06 × 0,25 bloc de face, et de trois quarts des deux côtés.
        for (const angle of [0, -0.6, 0.6]) expect(aire(angle, devant), `côté ${cote}, angle ${angle}`).toBeGreaterThanOrEqual(0.06 * 0.25);
        const xs = [...f.teintes.keys()].filter((t) => devant(t) && centre(t, 1) < 1.4).flatMap((t) => [0, 1, 2].map((k) => sommet(f, t, k)[0]));
        expect(Math.max(...xs) - Math.min(...xs), `côté ${cote}`).toBeCloseTo(0.06, 2);
      }
    });

    it('aucune bande claire au milieu du torse (revue d’ensemble, DA-6) : devant, rien de plus clair que la peau', () => {
      const lum = (c: number) => luminance(c);
      const torse = f.table.findIndex((p) => p.nom === 'corps');
      for (let t = 0; t < nbTriangles(f); t++)
        if (f.pieces[t] === torse && centre(t, 2) < 0) expect(lum(f.teintes[t]), `triangle ${t}`).toBeLessThan(lum(BONHOMME.peau));
      expect(lum(BONHOMME.bretelles)).toBeLessThan(0.1);
    });

    it('le sac se voit en volume de trois quarts face, des deux côtés, et de dos', () => {
      for (const angle of [-0.6, 0.6]) expect(aire(angle, sac), `angle ${angle}`).toBeGreaterThanOrEqual(0.03);
      for (const angle of [Math.PI, Math.PI - 0.6, 0.6 - Math.PI]) expect(aire(angle, sac), `angle ${angle}`).toBeGreaterThanOrEqual(0.15);
    });

    it('son rabat Sable, en haut du sac, se voit de dos et de trois quarts dos (0,1 × 0,1 bloc au moins)', () => {
      const rabat = (t: number) => sable(t) && centre(t, 2) > 0.1 && centre(t, 1) < 1.52;
      for (const angle of [Math.PI, Math.PI - 0.6, 0.6 - Math.PI]) expect(aire(angle, rabat), `angle ${angle}`).toBeGreaterThanOrEqual(0.1 * 0.1);
    });

    it('le sac est sur le dos : rien de cuir ni de Sable devant le torse, ni à la hanche', () => {
      for (let t = 0; t < nbTriangles(f); t++) {
        if (f.teintes[t] === BONHOMME.sac || sable(t)) expect(centre(t, 2), `triangle ${t}`).toBeGreaterThan(0.1);
        if (sac(t)) expect(centre(t, 1), `triangle ${t}`).toBeGreaterThan(0.9);
      }
    });
  });

  it('se détache des sols (revue d’ensemble, DA-6) : 3:1 au moins, la veste et les cheveux sur l’herbe du 6e et la roche du 5e, la veste sur l’herbe du 5e, le jean sur le basalte du 4e', () => {
    const contraste = (a: number, b: number) => {
      const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    const herbe6e = ambianceDe('6e').sols?.herbe?.dessus ?? SOLS.herbe.dessus;
    const roche5e = ambianceDe('5e').sols?.roche?.dessus ?? SOLS.roche.dessus;
    const basalte4e = ambianceDe('4e').sols?.basalte?.dessus ?? SOLS.basalte.dessus;
    for (const c of [BONHOMME.veste, BONHOMME.cheveux]) {
      expect(contraste(c, herbe6e)).toBeGreaterThanOrEqual(3);
      expect(contraste(c, roche5e)).toBeGreaterThanOrEqual(3);
    }
    expect(contraste(BONHOMME.jean, basalte4e)).toBeGreaterThanOrEqual(3);
    // La veste, en Nuit océan, se lit aussi sur l'herbe sombre du 5e (directeur artistique et référent dys).
    const herbe5e = ambianceDe('5e').sols?.herbe?.dessus ?? SOLS.herbe.dessus;
    expect(contraste(BONHOMME.veste, herbe5e)).toBeGreaterThanOrEqual(3);
    // Le jean, plus clair que la veste : les deux masses se lisent l'une contre l'autre.
    expect(contraste(BONHOMME.jean, BONHOMME.veste)).toBeGreaterThanOrEqual(3);
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
  const LUMINEUSES: BiomeId[] = ['maths-3e-functions', 'french-3e-close-reading', 'maths-4e-powers'];
  /**
   * Les exceptions à la règle « dominante lue d'abord, à 40 pixels » (DA, 28/09) : celles dont la tenue est le métier et
   * dont une signature de silhouette porte l'identité. Fi, l'allumeuse (son ciré, sa tête-lanterne) ; Knight, le héraut
   * (sa tunique, ses oreilles rondes, son étendard).
   */
  const TENUE_D_ABORD: BiomeId[] = ['maths-3e-functions', 'english-3e-grammar'];
  const MATIERES_D_OUTIL = new Set<number>([...Object.values(OUTIL), ...Object.values(TENUE)]);

  it('le verre de Fi est ambre mat le jour et prend la lueur la nuit', () => {
    const f = creaturePeinte('maths-3e-functions');
    const lanterne = f.table.find((p) => p.lueur);
    expect(lanterne).toEqual(expect.objectContaining({ nom: 'lanterne', lueur: 'nuit', nuit: LUEUR }));
    expect(f.palette.filter((p) => p.role === 'lueur').map((p) => p.couleur)).toEqual([VERRE_DE_FI.jour]);
    expect(VERRE_DE_FI).toEqual({ jour: 0xd9c99a, nuit: 0xffd866 });
    // Les autres lueurs brillent de leur couleur, de jour comme de nuit.
    for (const id of ['french-3e-close-reading', 'maths-4e-powers'] as const) expect(creaturePeinte(id).table.some((p) => p.nuit !== undefined), id).toBe(false);
  });

  it('chaque île a sa créature, une espèce par île', () => {
    expect(Object.keys(ESPECES).sort()).toEqual(BIOMES.map((b) => b.id).sort());
    expect(new Set(Object.values(ESPECES).map((e) => e.nom)).size).toBe(BIOMES.length);
  });

  it('ont les gabarits du directeur artistique : six trapus, six élancés, les autres standard', () => {
    const de = (g: Gabarit) =>
      Object.entries(ESPECES)
        .filter(([, e]) => (e.gabarit ?? 'standard') === g)
        .map(([, e]) => e.nom)
        .sort();
    expect(de('trapu')).toEqual(['Bazar', 'Braise', 'Grimoire', 'Kroa', 'Pudding', 'Tunel']);
    expect(de('elance')).toEqual(['Cléa', 'Fi', 'Frimas', 'Nénu', 'Stat', 'Théo']);
    expect(GABARITS).toEqual({ trapu: { taille: 2.3, largeur: 1.2 }, standard: { taille: 2.6, largeur: 1 }, elance: { taille: 2.9, largeur: 0.85 } });
    expect(GABARITS.standard.taille).toBeCloseTo(1.3 * TAILLE_DU_BONHOMME, 9);
  });

  // 2 950 depuis les deux habitants d'histoire-géographie du 6e (HG-2, mainteneur, 6 octobre 2026 : 2 917 mesurés).
  it('tiennent dans leur budget : 2 950 triangles au plus par archipel, toutes ensemble', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const somme = BIOMES.filter((b) => b.classe === a).reduce((n, b) => n + nbTriangles(creaturePeinte(b.id)), 0);
      expect(somme, a).toBeLessThanOrEqual(2_950);
    }
  });

  for (const b of BIOMES)
    describe(`${ESPECES[b.id]?.nom} (${b.id})`, () => {
      const f = creaturePeinte(b.id);
      const e = ESPECES[b.id];
      const piece = (nom: string) => f.table.findIndex((p) => p.nom === nom);
      /** Ce que tiennent les mains (l'outil, et ce que tient la main gauche) est à part. */
      const sansOutil = (t: number) => !['outil', 'autre-main'].includes(f.table[f.pieces[t]].nom);
      const taille = tailleDe(e);

      it(`debout, à la taille de son gabarit (${e.gabarit ?? 'standard'} : ${String(taille).replace('.', ',')} blocs, à 4 % près), la tête au cinquième`, () => {
        const [bas, haut] = hauteurs(f, sansOutil);
        expect(bas).toBeCloseTo(0, 6);
        // Le haut de la tête à 25/26 de la taille, la coiffe jusqu'à 27/26 (au standard : de 2,5 à 2,7 blocs).
        expect(Math.abs(haut - taille)).toBeLessThanOrEqual(taille / 26 + 1e-6);
        const [t0, t1] = hauteurs(f, (t) => f.pieces[t] === piece('tete'));
        expect((t1 - t0) / taille).toBeCloseTo(1 / 5, 2);
      });

      it('a son corps, sa tête, son bras porteur et son outil de métier, pièces à part', () => {
        for (const nom of ['corps', 'tete', 'bras', 'outil']) expect(f.pieces.includes(piece(nom)), nom).toBe(true);
      });

      it(b.id === 'maths-3e-functions' ? 'n’a pas d’yeux (sa tête est une lanterne)' : 'a deux petits yeux sombres, sans blanc ni sourire', () => {
        const yeux = [...f.teintes.keys()].filter((t) => f.teintes[t] === OEIL);
        if (b.id === 'maths-3e-functions') return expect(yeux).toEqual([]);
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
        // Cinq teintes au plus, hors yeux et outils.
        expect(new Set(f.palette.filter((p) => p.role !== 'yeux' && p.role !== 'outil').map((p) => p.couleur)).size).toBeLessThanOrEqual(5);
      });

      it('a un masque clair sous 35 % de la face, jamais plus clair que Brume', () => {
        const marque = e.marque?.couleur;
        if (marque === undefined) return;
        expect(luminance(marque), marque.toString(16)).toBeLessThanOrEqual(luminance(BRUME));
        if (luminance(marque) <= luminance(e.dominante)) return;
        const p = projeter(f, { pas: 0.01 });
        const face = pixels(p, (t) => f.pieces[t] === piece('tete'));
        expect(pixels(p, (t) => f.pieces[t] === piece('tete') && f.teintes[t] === marque) / face).toBeLessThanOrEqual(0.35);
      });

      it(TENUE_D_ABORD.includes(b.id) ? 'se lit d’abord à sa tenue, à 40 pixels (la tenue est son métier)' : 'se lit d’abord à sa dominante, à 40 pixels', () => {
        const p = projeter(f, { pas: PAS_A_40_PIXELS });
        const dominantes = new Set(f.palette.filter((q) => q.role === 'dominante').map((q) => q.couleur));
        const tenue = e.tenue.couleur;
        const tient = (t: number) => ['outil', 'autre-main'].includes(f.table[f.pieces[t]].nom);
        const dom = pixels(p, (t) => !tient(t) && dominantes.has(f.teintes[t]));
        const ten = pixels(p, (t) => !tient(t) && f.teintes[t] === tenue);
        if (TENUE_D_ABORD.includes(b.id)) expect(dom).toBeLessThan(ten);
        else expect(dom).toBeGreaterThan(ten);
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
