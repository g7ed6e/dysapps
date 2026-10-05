// Le terrain d'Archipéo (lot R2 de la piste Rendu, docs/univers/archipeo/cadrage.md) : la grille reste, le cube
// disparaît. Code pur, sans Three.js : il lit les cubes du sol (`sol` dans `VoxelCube`, posés par ./terrain.ts) et en
// tire un maillage à facettes, en tableaux typés, que la vue 3D dessine en un ou deux appels de dessin.
//
// - Le champ (`champDuSol`) : une colonne par case de terre, du cube le plus bas (`bas`) au plus haut (`haut`) ; le
//   dessus du sol est au niveau `haut + 1`, comme le dessus du cube. Chaque colonne porte la hauteur de ses quatre
//   coins : ils suivent la moyenne des voisines d'au plus un bloc d'écart, ce qui change une marche d'un bloc en pente
//   douce ; un écart de deux blocs ou plus reste une falaise. Chaque case est coupée en deux triangles, le long de sa
//   diagonale la plus plate (au hasard si les deux se valent) : pas de motif qui répète la grille.
// - Deux dessus voisins qui tranchent, d'un bloc d'écart (une dalle claire contre la roche) : le plus bas reste plat
//   jusqu'à son bord, le plus haut descend jusqu'à lui (le rebord plat de la dalle, lot R4).
// - Une case où quelque chose est posé (borne, maison, plan, pont, monument), ou contre laquelle s'appuie ce qui est
//   au-dessus de l'eau (un pont, une cascade), reste plate à sa hauteur : rien ne flotte au-dessus d'une pente. Les lacs
//   et la lave restent plats aussi. Une case où seul un décor est posé descend au bas de la pente si son socle en
//   dépasserait de plus d'un quart de bloc, et son décor avec elle (`poseDuDecor`).
// - La côte descend jusqu'à l'eau (`RIVAGE`), en sable pur sur la moitié côté mer ; sous une île en altitude, la
//   roche s'amincit en facettes ; au pied d'une haute colonne de roche qui plonge dans la mer, un liseré d'éboulis.
// - Les couleurs viennent de la palette (./palette.ts), nuancées selon l'option (b) retenue au lot R1 : plus sombres
//   vers la mer, de larges taches sur les dessus, des strates sur les falaises ; une pente à l'ombre n'est jamais
//   beaucoup plus sombre que le dessus voisin.
// Le code reste générique : il ne connaît ni les îles ni les archipels, seulement les cubes du sol et ce qui est posé
// dessus (une silhouette propre à chaque archipel viendra des cubes, pas d'ici).
// - Le toucher (`pickCell`) et la marche (`hauteurDuSol`, `piedsSur`) lisent le même champ : un point touché redevient
//   une case, et le bonhomme reste posé sur la surface qu'on voit.
//
// Ce fichier garde le maillage ; à côté, dans ./landMesh/ : les réglages (`reglages.ts`), le champ, le toucher et la
// marche (`champ.ts`), la couleur et l'éclairage (`eclairage.ts`), la découpe des polygones (`polygones.ts`). Il en
// réexporte les noms publics.
import { ALTITUDE } from './map';
import { cielDe, type Couleur, couleurDeMatiere, couleurDuSol, laveQuiBrille, MATIERES } from './palette';
import { AMBIENCE, mixColor } from './daylight';
import type { TextureKind } from './pixels';
import { FROID, FROID_SOUS } from './style';
import { clamp } from '../../core/math';
import { cellHash } from '../../core/random';
import { aireAuSol, clip, coinDe, couper, DESSOUS_CACHE, penteVersLeBas, type RGB, type Sommet, type V3 } from './landMesh/polygones';
import { type ChampDuSol, cle, type Colonne, colonneEn, COTES4, solNomme, trianglesDeLaCase } from './landMesh/champ';
import { COINS, CONTRASTE, DELAVE, FONDU, FRANGE, PAROI_HAUTE, RIVAGE, STRATES, STRATES_HAUTES } from './landMesh/reglages';
import { ecartDeCouleur, epaisseurDesStrates, lineaire, normaleOmbree, nuanceDuSol, rgb, strate } from './landMesh/eclairage';
export { CONTRASTE, EBOULIS, FONDU, FRANGE, NIVEAU_EAU, NUANCE_SOL, PENTE_OMBRE, RIVAGE, SOCLE_MAX, STRATES, STRATES_HAUTES } from './landMesh/reglages';
export { champDuSol, type ChampDuSol, type Colonne, colonneEn, hauteurDuSol, pickCell, piedsSur, poseDuDecor, signatureDuChamp } from './landMesh/champ';
export { ecartDeCouleur, eclairement, epaisseurDesStrates, lineaire, normaleOmbree, nuanceDuSol, strate } from './landMesh/eclairage';

// ---------- Le maillage ----------

/** Un maillage de triangles indépendants (facettes) : trois sommets par triangle. */
export interface Facettes {
  /** Positions, repère Three (X = x, Y = hauteur, Z = y). */
  positions: Float32Array;
  /**
   * Normales d'éclairage, une par facette, répétée sur ses trois sommets : la vraie normale, sauf pour une pente à
   * l'ombre, redressée vers le ciel (`normaleOmbree`). La vraie normale se tire des positions (ce que fait le toucher).
   */
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js. */
  colors: Float32Array;
  /** Pour chaque triangle, l'indice de sa colonne dans le champ (les tests vérifient le toucher avec). */
  colonnes: Int32Array;
}

export interface MaillageDuSol {
  /** Tout le sol, en un seul appel de dessin. */
  sol: Facettes;
  /** Ce qui brille (la lave), avec sa lueur : un second appel de dessin, seulement s'il y en a. */
  lumineux: Facettes;
}

/** Nombre de triangles d'un maillage du sol. */
export function trianglesDuSol(m: MaillageDuSol): number {
  return m.sol.colonnes.length + m.lumineux.colonnes.length;
}

/** Appels de dessin d'un maillage du sol : un, deux s'il y a de la lave. */
export function appelsDuSol(m: MaillageDuSol): number {
  return (m.sol.colonnes.length ? 1 : 0) + (m.lumineux.colonnes.length ? 1 : 0);
}

/** Des facettes en construction : des tableaux typés qui grandissent au besoin (pas de copie finale ni de déchets). */
class Tampon {
  private pos = new Float32Array(9 * 4096);
  private nor = new Float32Array(9 * 4096);
  private col = new Float32Array(9 * 4096);
  private own = new Int32Array(4096);
  private n = 0;
  private grow(): void {
    const up = <T extends Float32Array | Int32Array>(a: T): T => {
      const b = new (a.constructor as { new (n: number): T })(a.length * 2);
      b.set(a);
      return b;
    };
    this.pos = up(this.pos);
    this.nor = up(this.nor);
    this.col = up(this.col);
    this.own = up(this.own);
  }
  /** Un triangle (a, b, c), ses couleurs, et la direction vers laquelle il doit regarder. */
  triangle(a: V3, b: V3, c: V3, ca: RGB, cb: RGB, cc: RGB, attendue: V3, colonne: number, eclairage?: (n: V3) => V3): void {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-9) return;
    // La face regarde vers l'extérieur (sens inverse des aiguilles d'une montre vu de dehors), sinon on la retourne.
    if (nx * attendue[0] + ny * attendue[1] + nz * attendue[2] < 0) {
      [b, c] = [c, b];
      [cb, cc] = [cc, cb];
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    if ((this.n + 1) * 9 > this.pos.length) this.grow();
    const o = this.n * 9;
    // La normale d'éclairage (une pente à l'ombre, redressée), sinon la vraie.
    if (eclairage) {
      const e = eclairage([nx / len, ny / len, nz / len]);
      nx = e[0] * len;
      ny = e[1] * len;
      nz = e[2] * len;
    }
    const pts = [a, b, c];
    const cols = [ca, cb, cc];
    for (let k = 0; k < 3; k++) {
      this.pos[o + k * 3] = pts[k][0];
      this.pos[o + k * 3 + 1] = pts[k][1];
      this.pos[o + k * 3 + 2] = pts[k][2];
      this.nor[o + k * 3] = nx / len;
      this.nor[o + k * 3 + 1] = ny / len;
      this.nor[o + k * 3 + 2] = nz / len;
      this.col[o + k * 3] = cols[k][0];
      this.col[o + k * 3 + 1] = cols[k][1];
      this.col[o + k * 3 + 2] = cols[k][2];
    }
    this.own[this.n] = colonne;
    this.n++;
  }
  fin(): Facettes {
    return {
      positions: this.pos.slice(0, this.n * 9),
      normals: this.nor.slice(0, this.n * 9),
      colors: this.col.slice(0, this.n * 9),
      colonnes: this.own.slice(0, this.n),
    };
  }
}

/** Les options du maillage : le style de surface (`a` : aplats, sans nuance ; `b` : la nuance retenue). */
export interface OptionsDuSol {
  style?: 'a' | 'b';
}

/**
 * Le maillage à facettes du sol d'un champ : les dessus en deux triangles par case, les falaises coupées en strates, le dessous des îles flottantes. Les couleurs de la palette de
 * l'archipel, de jour : la nuit vient de la lumière de la scène, comme pour les blocs.
 */
export function landMesh(champ: ChampDuSol, options: OptionsDuSol = {}): MaillageDuSol {
  const a = champ.archipel;
  const style = options.style ?? 'b';
  const altitude = ALTITUDE[a];
  const froid = cielDe(a, 1).ambianceSol;
  const sable = couleurDeMatiere(a, 'sable').dessus;
  const auNiveauDeLaMer = !AMBIENCE[a].sky;
  const sol = new Tampon();
  const lumineux = new Tampon();
  // La lave brille (un second appel, sans lumière), sauf dans un archipel où le cratère est éteint (le 6e).
  const brille = laveQuiBrille(a);
  const tampon = (m: string) => (m === 'lave' && brille ? lumineux : sol);

  const facesVues = new Map<string, { dessus: Couleur; cote: Couleur }>();
  const faces = (m: string, muted: boolean): { dessus: Couleur; cote: Couleur } => {
    const k = muted ? `~${m}` : m;
    let f = facesVues.get(k);
    if (!f) {
      const g = solNomme(m);
      f = m in MATIERES ? couleurDeMatiere(a, m as TextureKind) : g ? couleurDuSol(a, g) : { dessus: parseInt(m.slice(1), 16), cote: parseInt(m.slice(1), 16) };
      if (muted) f = { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) };
      facesVues.set(k, f);
    }
    return f;
  };
  const dessusDe = (c: Colonne) => faces(c.matieres[c.matieres.length - 1], c.muted).dessus;
  const froidRGB = rgb(froid);
  /**
   * La couleur finale d'un sommet (linéaire) : la couleur de la palette (canaux 0..255), nuancée, refroidie près de
   * l'eau, puis relevée (`releve`) si la facette est une pente à l'ombre.
   */
  const peintRGB = (c: RGB, p: V3, dessus: boolean, facteur = 1): RGB => {
    let k = 1;
    let f = 0;
    if (style === 'b') {
      k = nuanceDuSol(p[0], p[1], p[2], dessus, altitude) * facteur;
      f = FROID * clamp((FROID_SOUS - p[1]) / 1.5, 0, 1);
    }
    return [0, 1, 2].map((j) => lineaire(((c[j] + (froidRGB[j] - c[j]) * f) / 255) * k)) as RGB;
  };
  const peint = (c: Couleur, p: V3, dessus: boolean, facteur = 1): RGB => peintRGB(rgb(c), p, dessus, facteur);
  // Les pentes à l'ombre : leur normale d'éclairage, calculée une fois par direction.
  const ombrees = new Map<string, V3>();
  const ombree = (n: V3): V3 => {
    if (n[1] > 0.9999) return n;
    const k = n.map((v) => v.toFixed(4)).join(',');
    let v = ombrees.get(k);
    if (!v) {
      v = normaleOmbree(a, n);
      ombrees.set(k, v);
    }
    return v;
  };
  const sableDe = (col: Colonne): RGB => rgb(col.muted ? mixColor(sable, DELAVE[0], DELAVE[1]) : sable);
  /** La couleur d'un coin : celle des cases qui s'y touchent (au plus un bloc d'écart), mêlées ; pas de damier. */
  const coinVu = new Map<string, Couleur>();
  const estSable = (c: Colonne) => c.matieres[c.matieres.length - 1] === 'sable';
  /** Deux dessus qui ne se fondent pas d'un coin à l'autre (voir `CONTRASTE`). */
  const tranchent = (p: Colonne, q: Colonne) => ecartDeCouleur(dessusDe(p), dessusDe(q)) > CONTRASTE;
  const couleurCoin = (col: Colonne, k: number): Couleur => {
    // Le sable reste du sable pur, et ne se fond pas dans ses voisines : le passage au sable est net (voir `FONDU`).
    if (col.liquide || estSable(col)) return dessusDe(col);
    const px = col.x + COINS[k][0];
    const py = col.y + COINS[k][1];
    // (La couleur d'un coin dépend aussi du dessus de la colonne : une voisine qui tranche n'y entre pas.)
    const key = `${cle(px, py) * 16 + (col.haut & 15) * 2 + (col.muted ? 1 : 0)}:${dessusDe(col)}`;
    const known = coinVu.get(key);
    if (known !== undefined) return known;
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (const v of [colonneEn(champ, px - 1, py - 1), colonneEn(champ, px, py - 1), colonneEn(champ, px - 1, py), colonneEn(champ, px, py)]) {
      if (!v || v.liquide || estSable(v) || Math.abs(v.haut - col.haut) > 1 || tranchent(col, v)) continue;
      const c = dessusDe(v);
      r += (c >> 16) & 255;
      g += (c >> 8) & 255;
      b += c & 255;
      n++;
    }
    const c = n ? (Math.round(r / n) << 16) | (Math.round(g / n) << 8) | Math.round(b / n) : dessusDe(col);
    coinVu.set(key, c);
    return c;
  };

  const HAUT: V3 = [0, 1, 0];
  const BAS: V3 = [0, -1, 0];
  const COTES: [number, number, number, number][] = [
    [1, 0, 1, 2],
    [-1, 0, 0, 3],
    [0, 1, 3, 2],
    [0, -1, 0, 1],
  ];

  champ.colonnes.forEach((col, i) => {
    const top = col.matieres[col.matieres.length - 1];
    const t = tampon(top);
    // ---- Le dessus : deux triangles, le long de la diagonale de la case. Au bord de la mer, le sable : pur sur la
    // part de la case côté mer (`FRANGE`), fondu vers le dessus sur `FONDU` de case ; les facettes sont coupées le
    // long de ces lignes (des courbes de niveau de la pente de la côte), pour que le sable ne bave pas plus loin.
    const P = (k: number): V3 => [col.x + COINS[k][0], col.coins[k], col.y + COINS[k][1]];
    const p = [P(0), P(1), P(2), P(3)];
    const base = [0, 1, 2, 3].map((k) => rgb(couleurCoin(col, k)));
    const plage = auNiveauDeLaMer && !col.liquide && !estSable(col) && col.rivage.some((r, k) => r && col.coins[k] <= 0);
    const sommet = Math.max(...col.coins);
    const etendue = sommet - RIVAGE;
    // La part de sable à une hauteur : 1 jusqu'à `FRANGE` de la case (depuis la mer), 0 après le fondu.
    const partDeSable = (y: number) => (!plage ? 0 : etendue < 1e-6 ? 1 : clamp((FRANGE + FONDU - (y - RIVAGE) / etendue) / FONDU, 0, 1));
    const sab = sableDe(col);
    // Les côtés contre une voisine qui tranche (voir `CONTRASTE`) : le passage se fait au bord, sur `FONDU` de case.
    const bords: { d: (q: V3) => number; axe: 0 | 2; ligne: number; c: RGB }[] = [];
    if (!col.liquide && !estSable(col))
      for (const [dx, dy] of COTES4) {
        const v = colonneEn(champ, col.x + dx, col.y + dy);
        if (!v || v.liquide || estSable(v) || Math.abs(v.haut - col.haut) > 1 || !tranchent(col, v)) continue;
        const axe = dx !== 0 ? 0 : 2;
        const bord = dx > 0 ? col.x + 1 : dx < 0 ? col.x : dy > 0 ? col.y + 1 : col.y;
        const signe = dx + dy;
        bords.push({ d: (q) => signe * (bord - q[axe]), axe, ligne: bord - signe * FONDU, c: rgb(dessusDe(v)) });
      }
    for (const [i0, i1, i2] of trianglesDeLaCase(col.diagonale)) {
      let morceaux: Sommet[][] = [
        [
          { p: p[i0], c: base[i0] },
          { p: p[i1], c: base[i1] },
          { p: p[i2], c: base[i2] },
        ],
      ];
      if (plage && etendue > 1e-6)
        for (const h of [RIVAGE + FRANGE * etendue, RIVAGE + (FRANGE + FONDU) * etendue])
          // (Un éclat plus fin qu'un centième de case ne se verrait pas : on ne le garde pas.)
          morceaux = morceaux.flatMap((m) => [couper(m, h, true), couper(m, h, false)].filter((q) => q.length >= 3 && aireAuSol(q) > 1e-3));
      for (const b of bords)
        morceaux = morceaux.flatMap((m) => [couper(m, b.ligne, true, b.axe), couper(m, b.ligne, false, b.axe)].filter((q) => q.length >= 3 && aireAuSol(q) > 1e-4));
      for (const m of morceaux) {
        const cs = m.map(({ p: q, c }) => {
          // Contre une voisine qui tranche : à mi-chemin des deux couleurs au bord, sa couleur propre à `FONDU` de case.
          let base = c;
          for (const b of bords) {
            const w = 0.5 * Math.max(0, 1 - b.d(q) / FONDU);
            if (w > 0) base = [0, 1, 2].map((j) => base[j] + (b.c[j] - base[j]) * w) as RGB;
          }
          const f = partDeSable(q[1]);
          return peintRGB([0, 1, 2].map((j) => base[j] + (sab[j] - base[j]) * f) as RGB, q, true);
        });
        for (let j = 1; j + 1 < m.length; j++) t.triangle(m[0].p, m[j].p, m[j + 1].p, cs[0], cs[j], cs[j + 1], HAUT, i, ombree);
      }
    }

    // ---- Les falaises, sur les quatre côtés : ce que la voisine ne couvre pas, coupé en strates.
    const matiere = (zz: number) => col.matieres[clamp(zz - col.bas, 0, col.matieres.length - 1)];
    const ep = epaisseurDesStrates(col.ile);
    for (const [dx, dy, k0, k1] of COTES) {
      const e0: [number, number] = [col.x + COINS[k0][0], col.y + COINS[k0][1]];
      const e1: [number, number] = [col.x + COINS[k1][0], col.y + COINS[k1][1]];
      const t0 = col.coins[k0];
      const t1 = col.coins[k1];
      const b0 = Math.max(col.coinsBas[k0], champ.plancher);
      const b1 = Math.max(col.coinsBas[k1], champ.plancher);
      const v = colonneEn(champ, col.x + dx, col.y + dy);
      // Chaque morceau de paroi : sa ligne du bas et sa ligne du haut, aux deux bouts du côté.
      const morceaux: [number, number, number, number][] = [];
      if (!v) morceaux.push([b0, b1, t0, t1]);
      else {
        const j0 = coinDe(v, e0);
        const j1 = coinDe(v, e1);
        // Au-dessus de la voisine, et sous elle (sous une île flottante qui s'amincit).
        morceaux.push([Math.max(b0, v.coins[j0]), Math.max(b1, v.coins[j1]), t0, t1]);
        morceaux.push([b0, b1, Math.min(t0, Math.max(v.coinsBas[j0], champ.plancher)), Math.min(t1, Math.max(v.coinsBas[j1], champ.plancher))]);
      }
      for (const [lo0, lo1, hi0, hi1] of morceaux) {
        const d0 = hi0 - lo0;
        const d1 = hi1 - lo1;
        if (d0 <= 1e-6 && d1 <= 1e-6) continue;
        // Les strates : discrètes sur une haute paroi ; leur épaisseur est celle de l'île.
        const amplitude = Math.max(d0, d1) > PAROI_HAUTE ? STRATES_HAUTES : STRATES;
        // Le polygone dans le plan de la paroi (s de 0 à 1 le long du côté, y la hauteur) ; si le haut et le bas se
        // croisent, un triangle jusqu'au croisement.
        let poly: [number, number][];
        if (d0 > 1e-6 && d1 > 1e-6)
          poly = [
            [0, lo0],
            [1, lo1],
            [1, hi1],
            [0, hi0],
          ];
        else {
          const k = d0 / (d0 - d1);
          const x: [number, number] = [k, lo0 + (lo1 - lo0) * k];
          poly = d0 > 0 ? [[0, lo0], x, [0, hi0]] : [x, [1, lo1], [1, hi1]];
        }
        const ys = poly.map((q) => q[1]);
        const lo = Math.min(...ys);
        const hi = Math.max(...ys);
        // Les tranches : une par suite de cubes de même matière et de même strate. La première et la dernière prennent
        // aussi ce qui dépasse la colonne (un coin tiré vers une voisine).
        const zs = clamp(Math.floor(lo), col.bas, col.haut);
        const ze = clamp(Math.ceil(hi) - 1, col.bas, col.haut);
        let z = zs;
        while (z <= ze) {
          let z1 = z;
          while (z1 + 1 <= ze && matiere(z1 + 1) === matiere(z) && Math.floor((z1 + 1) / ep) === Math.floor(z / ep)) z1++;
          const tranche = zs === ze ? poly : clip(poly, z === zs ? -Infinity : z, z1 === ze ? Infinity : z1 + 1);
          if (tranche.length >= 3) {
            const m = matiere(z);
            const cote = faces(m, col.muted).cote;
            const f = style === 'a' ? 1 : strate(z, ep, amplitude);
            const pts = tranche.map(([s, y]): V3 => [e0[0] + (e1[0] - e0[0]) * s, y, e0[1] + (e1[1] - e0[1]) * s]);
            const cs = pts.map((q) => peint(cote, q, false, f));
            for (let j = 1; j + 1 < pts.length; j++) tampon(m).triangle(pts[0], pts[j], pts[j + 1], cs[0], cs[j], cs[j + 1], [dx, 0, dy], i);
          }
          z = z1 + 1;
        }
      }
    }

    // ---- Le dessous : seulement au-dessus du plancher (sous une île en altitude).
    if (Math.max(...col.coinsBas) > champ.plancher) {
      const m = col.matieres[0];
      const cote = faces(m, col.muted).cote;
      const f = style === 'a' ? 1 : strate(col.bas, ep);
      const q = [0, 1, 2, 3].map((k): V3 => [col.x + COINS[k][0], col.coinsBas[k], col.y + COINS[k][1]]);
      const cq = q.map((pt) => peint(cote, pt, false, f));
      for (const [i0, i1, i2] of trianglesDeLaCase(col.diagonaleBas)) {
        // La caméra reste toujours au-dessus des îles, à 17° au moins : une facette tournée droit vers le bas ne se
        // voit jamais, on ne la dessine pas. Celles qui penchent font la roche facettée sous l'île.
        if (penteVersLeBas(q[i0], q[i1], q[i2]) > DESSOUS_CACHE) continue;
        tampon(m).triangle(q[i0], q[i1], q[i2], cq[i0], cq[i1], cq[i2], BAS, i);
      }
    }
  });
  // ---- Les éboulis au pied des hautes colonnes : la roche de la colonne, en quatre facettes bosselées.
  for (const pied of champ.pieds) {
    const col = champ.colonnes[pied.colonne];
    const cote = rgb(faces(col.matieres[0], col.muted).cote);
    const q = [0, 1, 2, 3].map((k): V3 => [pied.x + COINS[k][0], pied.coins[k], pied.y + COINS[k][1]]);
    const m: V3 = [pied.x + 0.5, pied.milieu, pied.y + 0.5];
    for (let k = 0; k < 4; k++) {
      const pts: V3[] = [m, q[k], q[(k + 1) % 4]];
      // Chaque caillou un peu plus clair ou plus sombre que son voisin.
      const f = 1 + 0.06 * (cellHash(pied.x * 4 + k, pied.y * 9 + 1) * 2 - 1);
      const cs = pts.map((pt) => peintRGB(cote, pt, true, f));
      sol.triangle(pts[0], pts[1], pts[2], cs[0], cs[1], cs[2], HAUT, pied.colonne, ombree);
    }
  }
  return { sol: sol.fin(), lumineux: lumineux.fin() };
}
