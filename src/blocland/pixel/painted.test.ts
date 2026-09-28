import type { VoxelCube } from '../Voxel';
import { mixColor } from '../world/daylight';
import { ARCHIPELAGO_IDS, type Ground } from '../world/map';
import { PALETTES, couleurDeMatiere, couleurDuSol, luminance } from '../world/palette';
import {
  BRUME,
  FESTON,
  PALIERS,
  POINTILLE,
  SOL_DE,
  SURFACE_DE_TEXTURE,
  TACHES,
  ECART_FERMEE,
  JOINT,
  aCadre,
  delaver,
  feston,
  sombreDe,
  morceauxAPeindre,
  motifDe,
  nuanceDuDessus,
  nuanceDuMotif,
  ombreDeFalaise,
  palierDe,
  peinture,
  strate,
} from './painted';
import { FORMES, grilleDuSprite } from './paintedSprites';
import { SPRITE_KINDS, spriteBox } from './sprites';
import { CHUNK, buildTiles, faceCell } from './oblique';
import type { Material } from './surface';

const rgb = (c: number) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const contraste = (a: number, b: number) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const cube = (over: Partial<VoxelCube>): VoxelCube => ({ x: 0, y: 0, z: 0, color: '#808080', ...over });
const MATERIALS: Material[] = ['herbe', 'mousse', 'sable', 'terre', 'pierre', 'basalte', 'eau', 'lave', 'glace', 'neige', 'autre'];

it('lit la lumière par paliers, de la nuit (0) au plein jour', () => {
  expect(palierDe(0)).toBe(0);
  expect(palierDe(1)).toBe(PALIERS);
  expect(palierDe(-3)).toBe(0);
  expect(palierDe(7)).toBe(PALIERS);
  expect(palierDe(0.5)).toBe(PALIERS / 2);
});

it('garde une peinture par archipel et par palier (la clé des caches)', () => {
  expect(peinture('6e', 4)).toBe(peinture('6e', 4));
  const cles = new Set(ARCHIPELAGO_IDS.flatMap((a) => [0, 1, 2, 3, 4].map((p) => peinture(a, p).cle)));
  expect(cles.size).toBe(ARCHIPELAGO_IDS.length * 5);
  expect(peinture('5e', 0).light).toBe(0);
  expect(peinture('5e', PALIERS).light).toBe(1);
});

it('peint chaque sol de la 2D de la couleur de son sol dans la palette, comme la 3D', () => {
  // Tous les sols de la palette sont atteints.
  const grounds = new Set(Object.values(SOL_DE).filter(Boolean));
  for (const g of ['herbe', 'sable', 'roche', 'neige', 'eau', 'lave', 'glace', 'basalte', 'mousse'] as Ground[]) expect(grounds.has(g), g).toBe(true);
  for (const a of ARCHIPELAGO_IDS)
    for (const p of [0, 2, 4]) {
      const P = peinture(a, p);
      for (const m of MATERIALS) {
        const g = SOL_DE[m];
        if (g) expect(P.sol(m, false), `${a} ${m}`).toEqual(couleurDuSol(a, g, p / PALIERS));
      }
      // Une texture de sol prend la couleur de son sol ; une matière de bâtiment, celle de sa matière.
      expect(P.faces(cube({ texture: 'herbe' }))).toEqual(couleurDuSol(a, 'herbe', p / PALIERS));
      expect(P.faces(cube({ texture: 'galet' }))).toEqual(couleurDuSol(a, 'roche', p / PALIERS));
      expect(P.faces(cube({ texture: 'nuage' }))).toEqual(couleurDuSol(a, 'neige', p / PALIERS));
      expect(P.faces(cube({ texture: 'planches' }))).toEqual(couleurDeMatiere(a, 'planches', p / PALIERS));
      expect(P.faces(cube({ texture: 'tuile' }))).toEqual(couleurDeMatiere(a, 'tuile', p / PALIERS));
    }
  for (const t of Object.keys(SURFACE_DE_TEXTURE)) expect(MATERIALS).toContain(SURFACE_DE_TEXTURE[t]);
});

it('un bloc sans matière garde sa couleur de jour, et la nuit la même ambiance que la palette', () => {
  const P = peinture('6e', PALIERS);
  expect(P.faces(cube({ color: '#336699', top: '#88aacc' }))).toEqual({ dessus: 0x88aacc, cote: 0x336699 });
  const N = peinture('6e', 0);
  const n = N.faces(cube({ color: '#336699' }));
  expect(luminance(n.cote)).toBeLessThan(luminance(0x336699));
  expect(Math.min(...rgb(n.cote))).toBeGreaterThan(0x10);
});

it('la nuit peint en bleu de crépuscule, jamais en noir, et la mer reste plus sombre que les rives', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const N = peinture(a, 0);
    const J = peinture(a, PALIERS);
    for (const m of MATERIALS) {
      if (m === 'autre' || m === 'lave') continue;
      const nuit = N.sol(m, false).dessus;
      expect(luminance(nuit), `${a} ${m}`).toBeLessThan(luminance(J.sol(m, false).dessus));
      expect(luminance(nuit), `${a} ${m}`).toBeGreaterThan(0.02);
    }
    for (const P of [N, J]) {
      // (Pas de rives dans les Îles du Ciel : un plancher de nuages.)
      if (!PALETTES[a].nuages) {
        expect(luminance(P.mer.rive), a).toBeGreaterThan(luminance(P.mer.pres));
        expect(luminance(P.mer.pres), a).toBeGreaterThan(luminance(P.mer.large));
      }
      // Les ombres sont bleutées.
      const [r, , b] = rgb(P.ombre);
      expect(b).toBeGreaterThan(r);
      // L'écume se lit sur la mer.
      if (!PALETTES[a].nuages) expect(contraste(P.ecume, P.mer.large), a).toBeGreaterThan(1.8);
    }
  }
});

it('délave une île verrouillée vers la Brume, pas vers le gris, et la distingue de l’ouverte en niveaux de gris', () => {
  for (const a of ARCHIPELAGO_IDS)
    for (const p of [0, 1, 2, 3, PALIERS]) {
      const P = peinture(a, p);
      const pairs: [string, number, number][] = [];
      for (const m of MATERIALS) {
        if (m === 'autre') continue;
        const [o, f] = [P.sol(m, false), P.sol(m, true)];
        pairs.push([m, o.dessus, f.dessus], [`${m} côté`, o.cote, f.cote]);
      }
      for (const t of ['planches', 'toit', 'brique', 'marbre', 'taille', 'verre', 'tuile'] as const) pairs.push([t, P.matiere(t, false).dessus, P.matiere(t, true).dessus]);
      // Le sable la nuit et au crépuscule compris.
      for (const [m, ouverte, fermee] of pairs) expect(contraste(fermee, ouverte), `${a} ${p} ${m}`).toBeGreaterThanOrEqual(ECART_FERMEE - 0.001);
      if (p === PALIERS) {
        // De jour, moins colorée que l'ouverte.
        const sat = (c: number) => Math.max(...rgb(c)) - Math.min(...rgb(c));
        for (const m of ['herbe', 'sable', 'terre', 'mousse'] as Material[]) expect(sat(P.sol(m, true).dessus), `${a} ${m}`).toBeLessThan(sat(P.sol(m, false).dessus));
      }
    }
  // Vers la Brume (un blanc verdi), sous un voile froid léger : jamais un gris neutre.
  const [r, g, b] = rgb(delaver(0x808080, BRUME));
  expect(g).toBeGreaterThanOrEqual(r);
  expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeGreaterThan(2);
});

it('les fantômes se lisent sur chaque sol, de jour comme de nuit (l’un des deux points du pointillé contraste)', () => {
  const blend = (bg: number, [c, alpha]: [number, number]) => mixColor(bg, c, alpha);
  for (const a of ARCHIPELAGO_IDS)
    for (const p of [0, PALIERS]) {
      const P = peinture(a, p);
      for (const m of MATERIALS) {
        if (m === 'autre') continue;
        for (const muted of [false, true]) {
          const sol = P.sol(m, muted).dessus;
          const best = Math.max(contraste(sol, blend(sol, POINTILLE.blanc)), contraste(sol, blend(sol, POINTILLE.sombre)));
          expect(best, `${a} ${p} ${m} ${muted}`).toBeGreaterThanOrEqual(2.5);
        }
      }
    }
});

it('nuance les dessus en grandes taches, ±6 % au plus, sans marche d’une case à l’autre', () => {
  let lo = 2;
  let hi = 0;
  for (let x = -40; x < 40; x += 0.37)
    for (let y = -40; y < 40; y += 0.41) {
      const n = nuanceDuDessus(x, y);
      lo = Math.min(lo, n);
      hi = Math.max(hi, n);
      // Continu : un seizième de bloc plus loin, presque la même nuance.
      expect(Math.abs(nuanceDuDessus(x + 1 / 16, y) - n)).toBeLessThan(0.01);
    }
  expect(lo).toBeGreaterThanOrEqual(1 - TACHES);
  expect(hi).toBeLessThanOrEqual(1 + TACHES);
  expect(hi - lo).toBeGreaterThan(0.05);
});

it('dessine des franges en festons réguliers, raccordés d’une case à l’autre', () => {
  for (let s = -64; s < 64; s++) {
    const d = feston(s, FESTON, 1, 4.5);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(4.5);
    expect(feston(s + 48, FESTON, 1, 4.5)).toBeCloseTo(d, 6);
  }
  // Deux à quatre festons par case de 16 pixels.
  expect(16 / FESTON).toBeGreaterThanOrEqual(2);
  expect(16 / FESTON).toBeLessThanOrEqual(4);
});

it('les falaises : plus sombres vers le pied, des strates larges (jamais une ligne d’un pixel)', () => {
  let prev = -1;
  for (let d = 0; d <= 6; d += 0.25) {
    const k = ombreDeFalaise(d, true);
    expect(k).toBeGreaterThanOrEqual(prev);
    expect(k).toBeLessThanOrEqual(0.9);
    prev = k;
  }
  // Un mur d'ouvrage n'a pas de dégradé : une seule teinte par face, d'une case à l'autre.
  for (let d = 0; d <= 6; d += 0.25) expect(ombreDeFalaise(d, false)).toBe(0);
  for (let px = 0; px < 64; px++) {
    const wx = px / 16;
    let run = 0;
    const runs: number[] = [];
    let last = strate(wx, 8);
    for (let py = 1; py < 16 * 8; py++) {
      const v = strate(wx, 8 - py / 16);
      run++;
      if (v !== last) {
        runs.push(run);
        run = 0;
        last = v;
      }
    }
    for (const r of runs.slice(1)) expect(r, `colonne ${px}`).toBeGreaterThanOrEqual(8);
  }
});

it('la matière des ouvrages : des bandes de deux pixels au moins, 10 à 12 % plus sombres, continues d’une case à l’autre', () => {
  expect(motifDe('planches')).toBe('lames');
  expect(motifDe('toit')).toBe('rangs');
  expect(motifDe('tuile')).toBe('rangs');
  expect(motifDe('brique')).toBe('briques');
  expect(motifDe('taille')).toBe('pierres');
  expect(motifDe('verre')).toBeNull();
  expect(motifDe('herbe')).toBeNull();
  expect(aCadre('verre') && aCadre('lanterne') && !aCadre('planches')).toBe(true);
  expect(JOINT).toBeGreaterThanOrEqual(0.88);
  expect(JOINT).toBeLessThanOrEqual(0.9);
  for (const m of ['lames', 'rangs', 'briques', 'pierres'] as const) {
    // Deux ou trois rangs (tuiles, planches) par case de 16 pixels.
    if (m === 'rangs' || m === 'lames') {
      let rows = 0;
      for (let gy = 0; gy < 16; gy++) if (nuanceDuMotif(m, 0, gy) < 1 && nuanceDuMotif(m, 0, gy - 1) === 1) rows++;
      expect(rows, m).toBeGreaterThanOrEqual(2);
      expect(rows, m).toBeLessThanOrEqual(3);
    }
    for (let gy = -40; gy < 40; gy++)
      for (let gx = -40; gx < 40; gx++) {
        const v = nuanceDuMotif(m, gx, gy);
        expect([1, JOINT]).toContain(v);
        if (v < 1) {
          // Un joint fait deux pixels de large (dans un sens au moins) : jamais un grain.
          const h = nuanceDuMotif(m, gx - 1, gy) < 1 || nuanceDuMotif(m, gx + 1, gy) < 1;
          const vt = nuanceDuMotif(m, gx, gy - 1) < 1 || nuanceDuMotif(m, gx, gy + 1) < 1;
          expect(h && vt, `${m} ${gx},${gy}`).toBe(true);
        }
      }
  }
});

it('les fenêtres, les lanternes et les contours des ouvrages : la teinte sombre de la matière, pas un noir', () => {
  for (const a of ARCHIPELAGO_IDS)
    for (const p of [0, PALIERS])
      for (const t of ['verre', 'lanterne', 'marbre', 'taille', 'planches'] as const) {
        const cote = peinture(a, p).matiere(t, false).cote;
        const s = sombreDe(cote);
        expect(luminance(s), `${a} ${t}`).toBeLessThan(luminance(cote));
        expect(Math.max(...rgb(s)), `${a} ${t}`).toBeGreaterThan(0x20);
      }
  // Un mur clair se détache d'un sol clair (marbre sur neige, pierre taillée sur roche) par son contour sombre ; au 4e,
  // dont la roche chaude est sombre (R4b-4e), il peut aussi s'en détacher par sa propre clarté.
  for (const a of ARCHIPELAGO_IDS) {
    const P = peinture(a, PALIERS);
    for (const [mur, sol, min] of [['marbre', 'neige', 3], ['marbre', 'sable', 3], ['taille', 'pierre', 2]] as const) {
      const cote = P.matiere(mur, false).cote;
      const dessus = P.sol(sol, false).dessus;
      const parSaClarte = a === '4e' ? contraste(cote, dessus) : 0;
      expect(Math.max(contraste(sombreDe(cote), dessus), parSaClarte), `${a} ${mur}/${sol}`).toBeGreaterThanOrEqual(min);
    }
  }
});

it('le décor peint garde la taille, le pied et l’ombre des sprites en pixels', () => {
  for (const k of SPRITE_KINDS) {
    const f = FORMES[k];
    expect({ w: f.w, h: f.h, ax: f.ax, ay: f.ay, shadow: f.shadow }, k).toEqual(spriteBox(k));
  }
});

it('le décor peint : des aplats de la matière, un contour sombre mais pas noir, aucun pixel isolé', () => {
  for (const a of ARCHIPELAGO_IDS)
    for (const p of [0, PALIERS]) {
      const P = peinture(a, p);
      for (const k of SPRITE_KINDS) {
        const f = FORMES[k];
        const grid = grilleDuSprite(k, false, P);
        const at = (x: number, y: number) => (x < 0 || y < 0 || x >= f.w || y >= f.h ? null : grid[y][x]);
        const colors = new Set<number>();
        for (let y = 0; y < f.h; y++)
          for (let x = 0; x < f.w; x++) {
            const c = at(x, y);
            if (c === null) continue;
            colors.add(c);
            expect(Math.max(...rgb(c)), `${k} contour`).toBeGreaterThan(0x18);
            if (!f.parts.length) continue;
            let same = 0;
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) if (at(x + dx, y + dy) === c) same++;
            expect(same, `${a} ${k} ${x},${y}`).toBeGreaterThan(0);
          }
        // Deux ou trois aplats et un contour par matière : jamais un grain de couleurs.
        if (f.parts.length) expect(colors.size, k).toBeLessThanOrEqual(4 * f.parts.length);
      }
    }
});

it('ne peint que les morceaux du terrain et ceux où déborde la bande claire des rives', () => {
  // Une île au milieu d'un morceau : rien ne déborde.
  const milieu = buildTiles([cube({ x: 10, y: -12, z: 0, texture: 'herbe' })]);
  expect(morceauxAPeindre(milieu, true)).toEqual(new Set(milieu.chunks.keys()));
  // Une case au coin d'un morceau : ses trois voisins de coin reçoivent la rive ; sans mer (Îles du Ciel), rien.
  const c = cube({ x: CHUNK - 1, y: 0, z: 0, texture: 'sable' });
  const { row } = faceCell(c, 'top');
  const coin = buildTiles([c]);
  expect(morceauxAPeindre(coin, false)).toEqual(new Set(coin.chunks.keys()));
  const avec = morceauxAPeindre(coin, true);
  expect(avec.size).toBeGreaterThan(coin.chunks.size);
  expect(avec.has(`1,${Math.floor(row / CHUNK)}`)).toBe(true);
  expect(avec.size).toBeLessThanOrEqual(9);
  // Un rocher du large, au coin de son morceau : ni rive, ni morceau voisin.
  const rocher = buildTiles([{ ...c, tag: 'mer' }]);
  expect(morceauxAPeindre(rocher, true)).toEqual(new Set(rocher.chunks.keys()));
});
