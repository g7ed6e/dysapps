// Les formes du décor propres aux Anciens Ateliers (4e) : leur repère, leurs retouches d'un genre commun et leur décor
// hors de la grille. Ce fichier appartient au sous-lot R4b-4e (docs/univers/archipeo/cadrage.md §6 ; intention :
// docs/univers/archipeo/intentions/4e-anciens-ateliers.md).
//
// - Le fourneau de la Forge remplace le haut-fourneau de basalte (dans son emprise de 2 × 2) : de la maçonnerie, une
//   gueule qui rougeoie, trois volutes minces.
// - Les aiguilles d'ardoise deviennent des écueils bas, cernés d'écume ; les rochers posés sur le basalte, de la pierre chaude.
// - Hors de la grille (rien ne s'y touche, rien n'y marche) : la grue de bois de l'Atelier ; au loin (./lointain.ts), le
//   volcan et deux rangs de crêtes.
import type { VoxelCube } from '../cube';
import { mixColor } from '../daylight';
import type { ElementDeDecor } from '../decorMesh';
import { colonneEn, NIVEAU_EAU, type ChampDuSol } from '../landMesh';
import { coeurDe, inCore, MAP } from '../map';
import type { Couleur, Faces } from '../palette';
import type { TextureKind } from '../pixels';
import { PLAN_ZONE } from '../plans';
import { worldBounds } from '../terrain';
import { dessinerRocher, FORMES_COMMUNES } from './communes';
import type { Cone, Etendue, Lointain } from './lointain';
import { bouffees } from './fumee';
import { dessinerPonton } from './ponton';
import { enRepere, type Forme } from './outils';
import { boite, DELAVE, eclaircir, hex, icosaedre, lueur, peintre, tronconique, type Peindre, type Pinceau, type V3 } from './pinceau';

/** Les couleurs de l'intention du directeur artistique. */
export const COULEURS_4E = {
  /** La maçonnerie du fourneau, ses cerclages de métal rouillé, sa gueule. */
  maconnerie: '#6F473D',
  cerclage: '#AF6C55',
  gueule: '#E8662C',
  /** La grue : le mât en treillis, la flèche, le contrepoids de pierre. */
  mat: '#884D40',
  fleche: '#9C7C4B',
  contrepoids: '#6F665E',
  /** Les écueils, du plus clair au plus sombre, et leur écume. */
  ecueil: ['#57504C', '#3E3636'],
  ecume: '#E6ECEA',
  /** La pierre chaude des rochers posés sur le basalte. */
  pierreChaude: '#7E6558',
  /** Le volcan du fond. */
  volcan: '#6A5048',
} as const;

/** Des faces d'une couleur : le dessus un peu plus clair ; délavées sur une île fermée. */
function faces(c: string | Couleur, muted = false): Faces {
  const cote = typeof c === 'number' ? c : hex(c);
  const f: Faces = { dessus: eclaircir(cote, 1.14), cote };
  return muted ? { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) } : f;
}

/**
 * Une poutre de section carrée `w` de `a` à `b` (ses quatre faces, sans les bouts : on ne les voit jamais), tournée de
 * `tour` autour de son axe.
 */
function poutre(P: Pinceau, a: V3, b: V3, w: number, peindre: Peindre, tour = 0): void {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]);
  if (len < 1e-6) return;
  const n: V3 = [d[0] / len, d[1] / len, d[2] / len];
  // Une perpendiculaire : l'horizontale de la poutre, sinon l'axe x pour une poutre debout.
  const ref: V3 = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let u: V3 = [n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]];
  const lu = Math.hypot(u[0], u[1], u[2]);
  u = [u[0] / lu, u[1] / lu, u[2] / lu];
  let v: V3 = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
  const [c, s] = [Math.cos(tour), Math.sin(tour)];
  [u, v] = [
    [u[0] * c + v[0] * s, u[1] * c + v[1] * s, u[2] * c + v[2] * s],
    [v[0] * c - u[0] * s, v[1] * c - u[1] * s, v[2] * c - u[2] * s],
  ];
  const h = w / 2;
  const coin = (p: V3, i: number): V3 => {
    const su = i === 0 || i === 3 ? -h : h;
    const sv = i < 2 ? -h : h;
    return [p[0] + su * u[0] + sv * v[0], p[1] + su * u[1] + sv * v[1], p[2] + su * u[2] + sv * v[2]];
  };
  const milieu: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    P.quad(coin(a, i), coin(a, j), coin(b, j), coin(b, i), milieu, peindre);
  }
}

// ---------- Le fourneau de la Forge ----------

/**
 * Le fourneau (DA, intention du 4e) : 5 cases de haut, de 1,7 à 1,2 case de section, sur un socle qui couvre les quatre
 * cases du haut-fourneau de Blocland (rien ne bloque le bonhomme sans se voir) ; deux cerclages ; une gueule voûtée de
 * 0,8 × 1 case sur la face que voit la caméra (elle regarde vers le nord : la face sud), qui rougeoie sans pulser, et
 * reste éteinte tant que l'île est fermée ; trois volutes minces au sommet.
 */
export const FOURNEAU = {
  hauteur: 5,
  rayons: [0.85, 0.6],
  socle: { rayon: 1.42, hauteur: 0.55 },
  cerclages: [1.5, 3.7],
  gueule: { largeur: 0.8, hauteur: 1 },
  fumee: { rayon: 0.2, volutes: 3, ecart: 1.25, vent: [0.075, 0.05] },
} as const;

const fourneau = enRepere(({ P, L, e, cx, cz, pied, Z, bouffees }) => {
  const F = FOURNEAU;
  const pierre = faces(COULEURS_4E.maconnerie, e.muted);
  const pS = peintre(pierre, pied, Z + F.hauteur - pied);
  // Huit pans, tournés d'un demi-pan : une face regarde droit vers le sud (la caméra), la gueule y est.
  const rot = Math.PI / 8 - Math.PI / 2;
  tronconique(P, cx, cz, pied, Z + F.socle.hauteur, F.socle.rayon, F.socle.rayon * 0.94, 8, rot, peintre(faces(COULEURS_4E.maconnerie, e.muted), pied, 1.2, 0.9));
  const r = (y: number) => F.rayons[0] + ((F.rayons[1] - F.rayons[0]) * (y - Z)) / F.hauteur;
  tronconique(P, cx, cz, Z + F.socle.hauteur - 0.05, Z + F.hauteur, r(Z + F.socle.hauteur), F.rayons[1], 8, rot, pS, false);
  // La lèvre : un anneau plat autour de la bouche, sombre dedans.
  tronconique(P, cx, cz, Z + F.hauteur, Z + F.hauteur + 0.12, F.rayons[1] + 0.06, F.rayons[1] + 0.02, 8, rot, pS, false);
  tronconique(P, cx, cz, Z + F.hauteur - 0.3, Z + F.hauteur + 0.1, 0.44, 0.44, 8, rot, peintre(faces('#2E2624', e.muted), Z, F.hauteur), true);
  const fer = peintre(faces(COULEURS_4E.cerclage, e.muted), Z, F.hauteur);
  for (const y of F.cerclages) tronconique(P, cx, cz, Z + y, Z + y + 0.18, r(Z + y) + 0.05, r(Z + y + 0.18) + 0.05, 8, rot, fer, false);
  // La gueule : un portail voûté, collé à la face sud (celle du côté −y), un rien devant elle.
  const { largeur: lg, hauteur: hg } = F.gueule;
  const y0 = Z + F.socle.hauteur;
  const face = (y: number) => cz - r(y) * Math.cos(Math.PI / 8) - 0.03;
  const p = (x: number, y: number): V3 => [x, y, face(y)];
  const dedans: V3 = [cx, y0 + hg / 2, cz];
  const couleur = e.muted ? peintre(faces('#2E2624', true), y0, hg) : lueur(faces(COULEURS_4E.gueule));
  const pinceau = e.muted ? P : L;
  const g = lg / 2;
  pinceau.quad(p(cx - g, y0), p(cx + g, y0), p(cx + g, y0 + hg * 0.62), p(cx - g, y0 + hg * 0.62), dedans, couleur);
  // La voûte : trois triangles en éventail jusqu'au haut de la gueule.
  const arc = [p(cx - g, y0 + hg * 0.62), p(cx - g * 0.7, y0 + hg * 0.88), p(cx, y0 + hg), p(cx + g * 0.7, y0 + hg * 0.88), p(cx + g, y0 + hg * 0.62)];
  const pied0 = p(cx, y0 + hg * 0.62);
  for (let k = 0; k + 1 < arc.length; k++) pinceau.triangle(pied0, arc[k], arc[k + 1], dedans, couleur);
  // Trois volutes minces, qui montent de la bouche et penchent au vent.
  const haut = Z + F.hauteur;
  bouffees(
    [
      { x: cx - 0.5, y: cz - 0.5, z: haut, color: '' },
      { x: cx - 0.5 + F.fumee.vent[0], y: cz - 0.5 + F.fumee.vent[1], z: haut + 1, color: '' },
    ] as VoxelCube[],
    { rayon: F.fumee.rayon, volutes: F.fumee.volutes, ecart: F.fumee.ecart, bas: haut + 0.25 },
  );
});

// ---------- Les retouches d'un genre commun ----------

/**
 * Les écueils (DA, intention du 4e) : les aiguilles d'ardoise deviennent des écueils bas, une case au plus au-dessus de
 * l'eau, de `#57504C` à `#3E3636`, cernés d'écume ; les cubes de Blocland ne changent pas. Les autres cases d'un écueil
 * (ses cailloux) restent ceux de tous les archipels.
 */
export const ECUEIL_BAS = { haut: 1, rayon: [0.5, 0.26], pans: 5, ecume: 0.82 } as const;

const ecueil: Forme = (o) => {
  const { P, e, hasard, rot, vari } = o;
  const ardoise = e.cubes.filter((q) => q.texture === 'ardoise' && q.z >= 0);
  if (!ardoise.length) {
    FORMES_COMMUNES.ecueil(o);
    return;
  }
  // Les cases d'ardoise : un rocher bas chacune ; les autres, les cailloux communs.
  const cases = new Map<string, VoxelCube>();
  for (const c of ardoise) cases.set(`${c.x},${c.y}`, c);
  const reste = e.cubes.filter((q) => !cases.has(`${q.x},${q.y}`));
  if (reste.length) FORMES_COMMUNES.ecueil({ ...o, e: { ...e, cubes: reste } });
  const [clair, sombre] = COULEURS_4E.ecueil.map(hex);
  for (const c of cases.values()) {
    const t = hasard();
    const couleur = mixColor(clair, sombre, t);
    const f = faces(couleur, e.muted);
    const top = NIVEAU_EAU + ECUEIL_BAS.haut * (0.45 + 0.55 * hasard());
    const [x, z] = [c.x + 0.5, c.y + 0.5];
    const a0 = rot + hasard() * 2;
    // L'écume d'abord, à plat sur l'eau, puis le rocher qui la perce.
    anneauDEcume(P, x, z, ECUEIL_BAS.ecume * (0.9 + 0.2 * hasard()), a0, e.muted);
    tronconique(P, x, z, NIVEAU_EAU - 0.3, top, ECUEIL_BAS.rayon[0], ECUEIL_BAS.rayon[1], ECUEIL_BAS.pans, a0, peintre(f, NIVEAU_EAU - 0.2, top - NIVEAU_EAU + 0.2, vari()));
  }
};

/** Un anneau d'écume à plat sur l'eau, autour d'un rocher : six triangles. */
function anneauDEcume(P: Pinceau, x: number, z: number, r: number, rot: number, muted: boolean): void {
  const y = NIVEAU_EAU + 0.04;
  const peindre = peintre(faces(COULEURS_4E.ecume, muted), y - 1, 1);
  const n = 6;
  const pts: V3[] = [];
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * Math.PI * 2;
    pts.push([x + r * Math.cos(a), y, z + r * 0.85 * Math.sin(a)]);
  }
  for (let k = 0; k < n; k++) P.triangle([x, y, z], pts[k], pts[(k + 1) % n], [x, y - 1, z], peindre);
}

/** Les rochers (DA, point reporté de R4) : posés sur le basalte (la Forge, la Gare), de la pierre chaude, pas du basalte. */
const rocher: Forme = (o) => {
  const col = colonneEn(o.champ, o.e.x, o.e.y);
  if (col?.matieres[col.matieres.length - 1] === 'basalte') dessinerRocher(o, faces(COULEURS_4E.pierreChaude, o.e.muted));
  else FORMES_COMMUNES.rocher(o);
};

// ---------- Hors de la grille : la grue de l'Atelier ----------

/**
 * La grue de bois (DA, intention du 4e) : sur une case où l'on ne marche pas, sur le flanc droit du cœur de l'Atelier
 * (la droite de la caméra, −x), un peu en avant de la mi-profondeur (7 cases : au milieu, dans la vue de l'île, son mât
 * passait sous le bouton de l'archipel ; plus en avant, les repères posés prennent toutes les cases), hors du quai et de la route du navire. Un mât en treillis de 9 cases et
 * d'une case de section ; une flèche de 6 cases à 0,7 de la hauteur, tournée vers le coin avant de la zone des plans :
 * elle passe sous le nom de l'île, posé à 12 cases (décision du directeur artistique, 28/09 ; au fond, à 11 cases et
 * 0,85, elle passait derrière lui). Une contre-flèche de 2 cases et son contrepoids ; un câble et un crochet immobiles.
 */
export const GRUE = {
  ile: 'maths-4e-algebra',
  /**
   * La case voulue, depuis les bornes du cœur (`coeurDe`) : `dx` depuis son bord gauche (sur la côte, deux cases en
   * dehors), `dyDuMilieu` depuis sa rangée du milieu (−1 : la septième rangée du cœur d'origine, un peu en avant de la
   * mi-profondeur) ; on prend la plus proche qui soit libre. Depuis que le cœur de l'Atelier a 20 cases (01/10/2026), la
   * grue suit sa côte repoussée et garde sa profondeur dans la vue de l'île (avant : −9 depuis le bord du fond).
   */
  voulue: { dx: -2, dyDuMilieu: -1 },
  hauteur: 9,
  section: 1,
  fleche: 6,
  contreFleche: 2,
  aLaHauteur: 0.7,
  /** Le câble descend du chariot, aux deux tiers de la flèche, jusqu'à 3 cases du sol. */
  chariot: 0.62,
  crochet: 3,
} as const;

/** La case de la grue : une case de terre de l'Atelier, hors du cœur, où rien n'est posé, la plus proche de la voulue. */
export function caseDeLaGrue(champ: ChampDuSol, elements: readonly ElementDeDecor[]): { x: number; y: number; z: number } | null {
  const def = MAP.find((d) => d.id === GRUE.ile);
  if (!def) return null;
  // Les cases prises par le décor posé (toute l'emprise d'un repère) : le décor du paysage, le même à toute étape de la partie.
  const pris = new Set<string>();
  for (const e of elements) for (let dx = 0; dx < e.emprise; dx++) for (let dy = 0; dy < e.emprise; dy++) pris.add(`${e.x + dx},${e.y + dy}`);
  const dansLeCoeur = (x: number, y: number) => inCore(def, x, y);
  const coeur = coeurDe(def);
  const [wx, wy] = [coeur.x0 + GRUE.voulue.dx, Math.floor((coeur.y0 + coeur.y1) / 2) + GRUE.voulue.dyDuMilieu];
  let best: { x: number; y: number; z: number } | null = null;
  let bestD = Infinity;
  for (let x = wx - 2; x <= wx + 4; x++)
    for (let y = wy - 2; y <= wy + 2; y++) {
      const col = colonneEn(champ, x, y);
      if (!col || col.liquide || col.fixe || col.ile !== GRUE.ile || dansLeCoeur(x, y)) continue;
      // La grue et son pied tiennent sur la case et ses voisines : rien d'autre n'y pousse.
      let libre = true;
      for (let dx = -1; dx <= 1 && libre; dx++) for (let dy = -1; dy <= 1 && libre; dy++) if (pris.has(`${x + dx},${y + dy}`)) libre = false;
      if (!libre) continue;
      const d = Math.hypot(x - wx, y - wy);
      if (d < bestD) {
        bestD = d;
        best = { x, y, z: col.haut + 1 };
      }
    }
  return best;
}

const grue: Forme = ({ P, e, cx, cz, sol }) => {
  const G = GRUE;
  const def = MAP.find((d) => d.id === G.ile);
  if (!def) return;
  const pied = Math.min(sol(cx - 0.45, cz - 0.45, e.z), sol(cx + 0.45, cz - 0.45, e.z), sol(cx - 0.45, cz + 0.45, e.z), sol(cx + 0.45, cz + 0.45, e.z)) - 0.2;
  const haut = e.z + G.hauteur;
  const mat = peintre(faces(COULEURS_4E.mat, e.muted), pied, haut - pied);
  const bois = peintre(faces(COULEURS_4E.fleche, e.muted), haut - 3, 3);
  const h = (G.section - 0.14) / 2;
  // Le mât : quatre montants, et des diagonales en zigzag sur ses quatre faces (le treillis).
  const coins: [number, number][] = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ];
  for (const [dx, dz] of coins) poutre(P, [cx + dx, pied, cz + dz], [cx + dx, haut, cz + dz], 0.14, mat);
  const etages = 5;
  const pas = (haut - pied) / etages;
  for (let f = 0; f < 4; f++) {
    const [ax, az] = coins[f];
    const [bx, bz] = coins[(f + 1) % 4];
    // Un rien devant la face, de la largeur d'un montant ; une face plate (deux triangles), vue du dehors.
    const nx = (ax + bx) / 2;
    const nz = (az + bz) / 2;
    const k = 1 + 0.02 / h;
    for (let s = 0; s < etages; s++) {
      const [from, to] = s % 2 ? [[bx, bz], [ax, az]] : [[ax, az], [bx, bz]];
      const y0 = pied + s * pas;
      const y1 = y0 + pas;
      const p0: V3 = [cx + from[0] * k, y0, cz + from[1] * k];
      const p1: V3 = [cx + to[0] * k, y1, cz + to[1] * k];
      // L'épaisseur de la diagonale, le long de la face.
      const tx = (to[0] - from[0]) / (2 * h);
      const tz = (to[1] - from[1]) / (2 * h);
      const w = 0.06;
      P.quad([p0[0] - tx * w, p0[1], p0[2] - tz * w], [p0[0] + tx * w, p0[1], p0[2] + tz * w], [p1[0] + tx * w, p1[1], p1[2] + tz * w], [p1[0] - tx * w, p1[1], p1[2] - tz * w], [cx - nx, (y0 + y1) / 2, cz - nz], mat);
    }
  }
  // La flèche, tournée vers le coin avant de la zone des plans le plus proche (vers la caméra : elle descend à l'écran,
  // loin du nom de l'île) ; la contre-flèche à l'opposé, son contrepoids au bout.
  const vers: [number, number] = [def.core.x + PLAN_ZONE.x - cx, def.core.y + PLAN_ZONE.y - cz];
  const lv = Math.hypot(vers[0], vers[1]) || 1;
  const [ux, uz] = [vers[0] / lv, vers[1] / lv];
  const yF = pied + (haut - pied) * G.aLaHauteur;
  const bout: V3 = [cx + ux * G.fleche, yF, cz + uz * G.fleche];
  const queue: V3 = [cx - ux * G.contreFleche, yF, cz - uz * G.contreFleche];
  poutre(P, queue, bout, 0.34, bois);
  const pierre = peintre(faces(COULEURS_4E.contrepoids, e.muted), yF - 1, 1.2);
  const cp: V3 = [queue[0] + ux * 0.35, yF - 0.35, queue[2] + uz * 0.35];
  poutre(P, [cp[0], cp[1] - 0.35, cp[2]], [cp[0], cp[1] + 0.3, cp[2]], 0.62, pierre);
  // Le haut du mât : une pointe, et les deux haubans qui tiennent la flèche et la contre-flèche.
  tronconique(P, cx, cz, haut, haut + 0.9, 0.42, 0, 4, Math.PI / 4, mat);
  poutre(P, [cx, haut + 0.75, cz], [bout[0] - ux * 0.3, yF + 0.17, bout[2] - uz * 0.3], 0.05, mat);
  poutre(P, [cx, haut + 0.75, cz], [queue[0] + ux * 0.1, yF + 0.17, queue[2] + uz * 0.1], 0.05, mat);
  // Le câble et le crochet, immobiles, sous le chariot.
  const ch: V3 = [cx + ux * G.fleche * G.chariot, yF - 0.17, cz + uz * G.fleche * G.chariot];
  const yC = e.z + G.crochet;
  poutre(P, ch, [ch[0], yC + 0.35, ch[2]], 0.05, peintre(faces('#3E3636', e.muted), yC, 1));
  tronconique(P, ch[0], ch[2], yC, yC + 0.4, 0.05, 0.22, 4, 0, peintre(faces('#5A5550', e.muted), yC, 0.5));
};

// ---------- Le ponton du Jardin des heures et sa barque ----------

/**
 * La barque du Jardin (DA, LV2-4) : amarrée au ponton, le long de la falaise (vers +y, comme ses cubes), basse sur l'eau,
 * sans mât ni voile (aucune verticale : la grue reste la seule du 4e). Une coque à six pans en plan, du bois de la grue,
 * pointue aux deux bouts, son dedans de planches et un banc.
 */
export const BARQUE = { long: 2.2, large: 0.36, bord: 0.3, fond: 0.12, depuis: 0.75 } as const;

function barque(P: Pinceau, xc: number, cz: number, muted: boolean): void {
  const B = BARQUE;
  const [z0, z1] = [cz + B.depuis, cz + B.depuis + B.long];
  const [y0, y1] = [NIVEAU_EAU - B.fond, NIVEAU_EAU + B.bord];
  // Le plan de la coque (x, z) : la proue et la poupe en pointe, les flancs droits ; le fond, plus étroit.
  const plan = (k: number): [number, number][] => [
    [xc, z0],
    [xc + B.large * k, z0 + 0.45],
    [xc + B.large * k, z1 - 0.5],
    [xc, z1],
    [xc - B.large * k, z1 - 0.5],
    [xc - B.large * k, z0 + 0.45],
  ];
  const haut = plan(1);
  const bas = plan(0.62);
  const zm = (z0 + z1) / 2;
  const dedans: V3 = [xc, (y0 + y1) / 2, zm];
  const coque = peintre(faces(COULEURS_4E.mat, muted), y0, y1 - y0);
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    P.quad([bas[i][0], y0, bas[i][1]], [bas[j][0], y0, bas[j][1]], [haut[j][0], y1, haut[j][1]], [haut[i][0], y1, haut[i][1]], dedans, coque);
  }
  // Le dedans, un peu sous le plat-bord, et le banc.
  const planche = peintre(faces(COULEURS_4E.fleche, muted), y0, y1 - y0);
  const y = y1 - 0.06;
  for (let i = 1; i + 1 < 6; i++) P.triangle([haut[0][0], y, haut[0][1]], [haut[i][0], y, haut[i][1]], [haut[i + 1][0], y, haut[i + 1][1]], [xc, y - 1, zm], planche);
  boite(P, xc - B.large + 0.04, y, zm - 0.12, xc + B.large - 0.04, y1 + 0.02, zm + 0.12, planche);
}

/**
 * Le contrefort du ponton (retouche du directeur artistique, 29/09) : sous le rivage, l'île flotte ; la falaise descend
 * jusqu'à l'eau, où l'échelle s'appuie sur toute sa hauteur. Pas une colonne : la matière et les facettes de la falaise
 * (la roche sous la case du rivage), des arêtes cassées, plus large au pied qu'en haut, arrêté une marche sous le bord de
 * l'herbe ; sa face vers le large reste
 * plane, droite, un peu en retrait de celle de la falaise (pas de faces confondues), l'échelle debout devant. Au pied,
 * un éboulis de trois rochers bas, hors du tablier et de la barque.
 */
export const CONTREFORT = { face: 0.47, haut: 0.55, pied: 1.05, recul: [0.55, 1.15], rochers: 3 } as const;

function contrefort(o: Parameters<Forme>[0]): void {
  const { P, e, cx, cz, base, hasard, champ, matiere } = o;
  const C = CONTREFORT;
  const col = colonneEn(champ, e.x, e.y);
  const roche = (col?.matieres[0] ?? 'pierre') as TextureKind;
  // Son haut, une marche sous le bord de l'herbe (le dessus de la colonne du rivage, ou le sol au milieu de la case s'il
  // est plus bas) : il reste sous le rivage, jamais une verticale de plus au-dessus de lui.
  const bord = Math.min(base, col ? col.haut + 1 : base);
  const [y0, y1] = [NIVEAU_EAU - 0.3, bord - 1];
  const peindre = peintre(matiere(roche, e.muted), NIVEAU_EAU, base - NIVEAU_EAU);
  const xe = cx + C.face;
  // Trois anneaux (le pied, le milieu, le haut) de six sommets : deux sur la face plane du large, derrière l'échelle,
  // quatre qui se cassent vers l'île et s'écartent vers le pied.
  const anneau = (t: number, y: number): V3[] => {
    const demi = C.pied + (C.haut - C.pied) * t;
    const recul = C.recul[1] + (C.recul[0] - C.recul[1]) * t;
    const j = () => (hasard() - 0.5) * 0.24;
    return [
      [xe, y, cz - 0.38],
      [xe, y, cz + 0.38],
      [xe - 0.35 + j(), y, cz + demi + j()],
      [cx + 0.5 - recul + j(), y, cz + demi * 0.45 + j()],
      [cx + 0.5 - recul + j(), y, cz - demi * 0.45 + j()],
      [xe - 0.35 + j(), y, cz - demi + j()],
    ];
  };
  const anneaux = [anneau(0, y0), anneau(0.45, y0 + (y1 - y0) * 0.4), anneau(1, y1)];
  for (let k = 0; k + 1 < anneaux.length; k++) {
    const [bas, haut] = [anneaux[k], anneaux[k + 1]];
    const dedans: V3 = [cx, (bas[0][1] + haut[0][1]) / 2, cz];
    for (let i = 0; i < 6; i++) {
      const n = (i + 1) % 6;
      P.quad(bas[i], bas[n], haut[n], haut[i], dedans, peindre);
    }
  }
  // L'éboulis : trois rochers bas au pied, du côté de l'île et sur les flancs (jamais sous le tablier ni la barque).
  const places: [number, number, number][] = [
    [cx - 0.75, cz + 1.05, 0.42],
    [cx - 0.1, cz - 1.2, 0.38],
    [cx + 0.2, cz + 1.25, 0.3],
  ];
  for (const [x, z, r] of places.slice(0, C.rochers)) icosaedre(P, [x, NIVEAU_EAU + 0.02, z], r, 0.55, 0.2, hasard, peindre, hasard() * Math.PI);
}

/** Le ponton du Jardin : celui du Relais (./ponton.ts), sur son contrefort, et sa barque amarrée à deux cases du rivage, comme ses cubes. */
const pontonDuJardin: Forme = (o) => {
  const { P, e, cx, cz, base } = o;
  contrefort(o);
  dessinerPonton(P, cx, cz, base, e.muted);
  barque(P, cx + 2, cz, e.muted);
};

// ---------- Le lointain : le volcan du fond et deux rangs de crêtes ----------

/**
 * Le volcan du fond (DA, intention du 4e) : un cône tronqué à 9 pans, roche `#6A5048`, de 16 blocs, à 100 cases
 * derrière le bout droit de la crête (la droite de la caméra : l'ouest, `u` = 0), sans lueur au cratère. Il paraît plus
 * petit que la grue dans la vue de l'archipel ; la brume de profondeur le pâlit. Dessiné par le lointain commun
 * (./lointain.ts, R4b-5e) ; son panache de 5 volutes, dans l'appel des fumées (`FUMEE_DU_VOLCAN_4E`).
 */
export const VOLCAN_DU_FOND: Cone = { genre: 'cone', u: 0.12, recul: 100, haut: 16, rayon: 8, cratere: 1.8, pans: 9, couleur: 0x6a5048 };

/** Le panache du volcan : cinq volutes, poussées par le même vent que les fumées du lot R4 (vers +x et +y). */
export const FUMEE_DU_VOLCAN_4E = { rayon: 1.1, volutes: 5, ecart: 0.7, vent: [0.15, 0.1] } as const;

/**
 * Le lointain des Anciens Ateliers (intention du 4e, §2) : le volcan, et deux rangs de crêtes chaudes, `#8A6E78` devant,
 * `#C89A88` derrière, que la brume pâlit. Pas de sommets blancs.
 */
export const LOINTAIN_4E: Lointain = {
  graine: 'lointain-4e',
  pieces: [
    { genre: 'cretes', u: -0.25, a: 0.75, recul: 72, haut: 15, cimes: 6, epaisseur: 18, couleur: 0x8a6e78 },
    VOLCAN_DU_FOND,
    { genre: 'cretes', u: 0.2, a: 1.3, recul: 130, haut: 22, cimes: 7, epaisseur: 24, couleur: 0xc89a88 },
  ],
};

/** Le milieu du cratère du volcan, en cases (comme `ancre` de ./lointain.ts). */
export function cratereDuVolcan(e: Etendue): { x: number; y: number; z: number } {
  return { x: e.minX + VOLCAN_DU_FOND.u * (e.maxX - e.minX), y: e.maxY + VOLCAN_DU_FOND.recul, z: VOLCAN_DU_FOND.haut };
}

/** Le panache du volcan : seulement ses volutes (le cône est dans le lointain). */
const panache: Forme = ({ F, e, hasard, rot, horizon }) => {
  const V = FUMEE_DU_VOLCAN_4E;
  const [x, y] = [e.x + 0.5, e.y + 0.5];
  bouffees(
    F,
    [
      { x: x - 0.5, y: y - 0.5, z: e.z, color: '' },
      { x: x - 0.5 + V.vent[0], y: y - 0.5 + V.vent[1], z: e.z + 1, color: '' },
    ] as VoxelCube[],
    hasard,
    rot,
    horizon,
    { rayon: V.rayon, volutes: V.volutes, ecart: V.ecart, bas: e.z + 0.5 },
  );
};

/** Le décor des Anciens Ateliers hors de la grille : la grue de l'Atelier, le panache du volcan du fond. */
export function horsGrille4e(champ: ChampDuSol, elements: readonly ElementDeDecor[]): ElementDeDecor[] {
  const out: ElementDeDecor[] = [];
  const g = caseDeLaGrue(champ, elements);
  if (g) {
    const col = colonneEn(champ, g.x, g.y);
    out.push({ id: `hors-grille/grue@${g.x},${g.y}`, genre: 'grue', cubes: [], x: g.x, y: g.y, z: g.z, emprise: 1, muted: Boolean(col?.muted), horsGrille: true });
  }
  // Le panache : une case fictive, sous le milieu du cratère (x et y entiers : l'élément est au milieu de sa case).
  const v = cratereDuVolcan(worldBounds('4e'));
  out.push({ id: 'hors-grille/panache', genre: 'panache', cubes: [], x: v.x - 0.5, y: v.y - 0.5, z: v.z, emprise: 1, muted: false, horsGrille: true, auLoin: true });
  return out;
}

/** Les formes du 4e hors de la grille. */
export const FORMES_HORS_GRILLE_4E: Record<string, Forme> = { grue, panache };

/** Les repères du 4e. */
export const FORMES_4E: Record<string, Forme> = { 'haut-fourneau': fourneau };

/** Les genres communs que le 4e redessine (le ponton : celui du Jardin des heures, avec sa barque). */
export const RETOUCHES_4E: Record<string, Forme> = { ecueil, rocher, ponton: pontonDuJardin };
