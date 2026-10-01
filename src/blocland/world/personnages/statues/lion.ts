// Le Lion de pierre, Gardien de la Baie des mots (6e), redessiné d'après le concept validé par le mainteneur (essai 5)
// et le brief du directeur artistique (30/09/2026, repris le 01/10) : un lion adulte couché, le ventre sur un quai bas,
// les pattes avant tendues, la queue le long du flanc, le dos moussu ; la tête levée, gueule fermée, tournée vers
// l'élève, les orbites creuses sous l'arcade, dans une collerette de huit grandes plaques balayées vers l'arrière (pas
// un disque vu de face : c'est le Soleil de cuivre du 4e). Ce qui s'allume : une veine d'or le long d'une arête de
// chacune des huit plaques (la crinière se rallume), en plus de la flamme commune du foyer.
//
// Le corps, dessiné de profil l'avant vers −X, tourne de `TOUR_DU_CORPS` pour montrer son avant de trois-quarts ; la
// tête garde son propre repère, presque de face, pour que ses orbites regardent l'élève (−Z).
import { devant, facette, fuseau, pose, repere, type Anneau, type Peindre, type Trace, type V3 } from '../peint';
import { tube, type Atelier } from '../sentinelle';

/**
 * La hauteur du Lion, socle compris, en blocs : une dérogation à la hauteur commune des sentinelles
 * (`HAUTEUR_DE_SENTINELLE`, 8 blocs), décidée par le mainteneur le 01/10/2026 pour qu'il reste couché sur un quai bas.
 * Dressé jusqu'à huit blocs, il se lisait comme une pièce d'échecs depuis la carte.
 */
export const HAUTEUR_DU_LION = 6;

/**
 * Le tour du corps couché autour de la verticale du socle : l'avant (−X) vers la droite et vers l'élève (−Z), à 45°, le long de la diagonale des cinq cases :
 * de trois-quarts pour la caméra de l'archipel (de face) comme pour celle du défi (de trois-quarts gauche), qui voit
 * alors le flanc, le poitrail et les pattes tendues, comme le concept.
 */
const TOUR_DU_CORPS = (-135 * Math.PI) / 180;
/** Le haut du quai, où le Lion est couché : un bloc au-dessus du socle. */
const QUAI = 1.8;
/** Le quai, dans le repère du corps : x0, z0, x1, z1 (assez étroit devant pour laisser voir la flamme du foyer). */
const EMPRISE_DU_QUAI = [-2.45, -0.9, 1.95, 0.9] as const;
/**
 * La tête : le point sous son centre, au-dessus du poitrail (dans le repère du corps), son tour vers l'avant du corps (la
 * face, elle, regarde l'élève) et son échelle.
 */
const TETE = { x: -1.25, z: 0.55, tour: 0.12, echelle: 1.12 } as const;

/**
 * Le profil de la tête autour de son centre (cinq pans, une face vers l'élève) : le museau avancé, les joues, l'arcade
 * qui avance au-dessus des yeux, le front. Entre les joues et l'arcade, la face rentre et regarde vers le bas : les
 * orbites y sont creusées, à l'ombre de l'arcade.
 */
const TETE_DU_LION: Anneau[] = [
  [-0.6, 0.56, 0.42, -0.34],
  [-0.02, 0.78, 0.6, -0.1],
  [0.32, 0.76, 0.62, -0.17],
  [0.6, 0.6, 0.5, 0.04],
];
/**
 * Les orbites, creuses : deux facettes sombres en amande (le coin du dehors relevé), sans globe ni paupière, posées sur
 * le pan qui rentre sous l'arcade. Leur hauteur dans la tête, leur écart au milieu, leur demi-largeur, leur demi-hauteur.
 */
const ORBITES = { y: 0.15, ecart: 0.22, demi: 0.15, haut: 0.1 } as const;
/** Le nez : la demi-largeur et la hauteur de sa base, en haut et en bas, la hauteur de sa pointe et son avancée. */
const NEZ = { haut: [0.15, -0.1], bas: [0.1, -0.4], pointe: -0.34, avance: 0.16 } as const;

/**
 * La collerette : huit plaques en couronne autour de la tête (l'angle de chacune, en degrés depuis la droite, sa
 * longueur et son recul), plus longues sur les côtés et vers le poitrail qu'au sommet. `centre` : le milieu de la
 * couronne, un peu derrière la face ; `base` : où naissent les plaques ; les demi-largeurs de la face avant de chaque
 * plaque à sa naissance (`face`) et à son bout (`bout`), et du dos à sa naissance (`dos`) ; `arete` : la saillie de la
 * face avant.
 */
const CRINIERE: [number, number, number][] = [
  [90, 1.2, 0.95],
  [135, 1.35, 0.9],
  [180, 1.35, 1.0],
  [225, 1.55, 0.55],
  [270, 1.7, 0.2],
  [315, 1.55, 0.55],
  [0, 1.35, 1.0],
  [45, 1.35, 0.9],
];
const COLLERETTE = { centre: [0, 0.0, 0.2] as V3, base: 0.46, face: 0.36, bout: 0.5, dos: 0.82, arete: 0.22 };

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Une plaque de la crinière, dans le repère de la tête (centre en 0) : ses sommets et un point à l'intérieur. */
function plaqueDeCriniere([angle, long, recul]: [number, number, number]) {
  const a = (angle * Math.PI) / 180;
  const { centre, base, face, bout, dos, arete } = COLLERETTE;
  const B = add(centre, [Math.cos(a) * base, Math.sin(a) * base, 0]);
  const D = unit([Math.cos(a), Math.sin(a), recul]);
  const t: V3 = [-Math.sin(a), Math.cos(a), 0];
  // La face avant regarde l'élève et le dehors de la couronne.
  const n = unit(cross(t, D));
  const R = add(B, n, arete);
  const bord = add(B, D, long);
  return {
    // La face avant (arêtes `Ra`→`Ta` et `Rb`→`Tb`), et le dos, plus large, en retrait.
    Ra: add(R, t, face),
    Rb: add(R, t, -face),
    Ta: add(bord, t, bout),
    Tb: add(bord, t, -bout),
    Sa: add(add(B, t, dos), n, -arete * 0.4),
    Sb: add(add(B, t, -dos), n, -arete * 0.4),
    n,
    dedans: add(B, D, long * 0.35),
  };
}

/** Le haut de la tête du Lion, au-dessus de son centre (le bout de la plus haute plaque). */
const SOMMET_DE_LA_CRINIERE = Math.max(
  ...CRINIERE.flatMap((p) => {
    const q = plaqueDeCriniere(p);
    return [q.Ra, q.Rb, q.Ta, q.Tb, q.Sa, q.Sb].map((v) => v[1]);
  }),
);
/** La hauteur du centre de la tête : la crinière touche la hauteur du Lion. */
const Y_DE_LA_TETE = HAUTEUR_DU_LION - SOMMET_DE_LA_CRINIERE * TETE.echelle;

/** Le repère du corps couché : du dessin de profil au monde. */
const CORPS = repere([0, 0, 0], 0, TOUR_DU_CORPS, 0);
/** Le repère de la tête : son centre, tourné de `TETE.tour`, à l'échelle `TETE.echelle`. */
const repereDeLaTete = (T: Trace): Trace => {
  const r = repere(CORPS([TETE.x, Y_DE_LA_TETE, TETE.z]), 0, TETE.tour, 0);
  return pose(T, ([x, y, z]) => r([x * TETE.echelle, y * TETE.echelle, z * TETE.echelle]));
};
/** Le repère du corps couché, tourné de trois-quarts. */
const repereDuCorps = (T: Trace): Trace => pose(T, CORPS);

export function sculptureDuLion(T: Trace, a: Atelier): void {
  const C = repereDuCorps(T);
  const q = QUAI;
  // Le quai, une dalle basse au fruit léger.
  const [x0, z0, x1, z1] = EMPRISE_DU_QUAI;
  const k = 1 / Math.SQRT1_2;
  fuseau(
    C,
    [
      [1, ((x1 - x0) / 2 + 0.06) * k, ((z1 - z0) / 2 + 0.06) * k],
      [q, ((x1 - x0) / 2) * k, ((z1 - z0) / 2) * k],
    ],
    4,
    a.pierre,
    { x: (x0 + x1) / 2, z: (z0 + z1) / 2, bas: false },
  );
  // Le corps, d'un seul tenant, le ventre sur le quai : le poitrail sous la crinière, le dos qui descend, la croupe
  // ronde ; le lichen sur le dos (jamais sur la crinière).
  tube(
    C,
    [
      [-1.0, q + 1.0, 0.05],
      [0.55, q + 0.86, 0.05],
      [1.8, q + 0.9, 0.05],
    ],
    [1.0, 0.8, 0.9],
    6,
    a.pierre,
    1.05,
    (i, j) => ((j === 3 || j === 4) && i === 1) || (j === 4 && i === 0) ? a.lichen : a.pierre,
  );
  // Les pattes avant, tendues sur le quai.
  for (const z of [0.42, -0.42])
    tube(
      C,
      [
        [-0.7, q + 0.42, z],
        [-2.5, q + 0.26, z],
      ],
      [0.46, 0.4],
      4,
      a.pierre,
      0.7,
    );
  // La queue, le long du flanc (côté élève), finie en pointe.
  tube(
    C,
    [
      [1.95, q + 0.5, 0.45],
      [2.0, q + 0.16, 0.85],
      [0.9, q + 0.15, 0.92],
    ],
    [0.17, 0.15, 0],
    3,
    a.pierre,
  );
  // La tête et ses orbites, puis la collerette.
  const H = repereDeLaTete(T);
  fuseau(H, TETE_DU_LION, 5, a.pierre, { bas: false });
  const face = (y: number) => devant(TETE_DU_LION, 5, y).z;
  for (const s of [-1, 1]) {
    const { y, ecart, demi, haut } = ORBITES;
    const x = s * ecart;
    // L'amande : le coin du dehors relevé, le bord du haut sous l'arcade ; sur le pan, juste devant la pierre.
    const sur = (px: number, py: number): V3 => [px, py, face(py) - 0.006];
    facette(H, [sur(x - s * demi, y - haut * 0.3), sur(x, y - haut), sur(x + s * demi, y + haut * 0.6), sur(x, y + haut)], [x, y, face(y) + 1], a.orbite);
  }
  // Le nez, une pyramide basse au bout du museau (quatre triangles, sa base dans la pierre).
  const { haut: nh, bas: nb, pointe: np, avance } = NEZ;
  const [g, d, gb, db]: V3[] = [
    [-nh[0], nh[1], face(nh[1]) + 0.02],
    [nh[0], nh[1], face(nh[1]) + 0.02],
    [-nb[0], nb[1], face(nb[1]) + 0.02],
    [nb[0], nb[1], face(nb[1]) + 0.02],
  ];
  const sommet: V3 = [0, np, face(np) - avance];
  const dos: V3 = [0, (nh[1] + nb[1]) / 2, face(np) + 0.4];
  for (const [u, v] of [
    [g, d],
    [d, db],
    [db, gb],
    [gb, g],
  ])
    H.triangle(u, v, sommet, dos, a.pierre);
  for (const p of CRINIERE) plaque(H, plaqueDeCriniere(p), a.pierre);
}

/** Une plaque : sa face avant en trois pans (les deux arêtes, la face), son dos et son bout (six triangles). */
function plaque(T: Trace, p: ReturnType<typeof plaqueDeCriniere>, pe: Peindre): void {
  const { Ra, Rb, Ta, Tb, Sa, Sb, dedans } = p;
  T.triangle(Sa, Ra, Ta, dedans, pe);
  T.quad(Ra, Rb, Tb, Ta, dedans, pe);
  T.triangle(Rb, Sb, Tb, dedans, pe);
  T.quad(Sa, Sb, Tb, Ta, dedans, pe);
}

/**
 * Les veines : sur chacune des huit plaques, un ruban d'or posé sur la face avant, le long de l'arête `Ra`→`Ta`, de la
 * naissance de la plaque à son bout (deux triangles par plaque). Les huit se touchent autour de la tête : une seule
 * lueur, la crinière.
 */
const COTE: 'a' | 'b' = 'b';
export function veinesDuLion(T: Trace, a: Atelier): void {
  const H = repereDeLaTete(T);
  for (const c of CRINIERE) {
    const p = plaqueDeCriniere(c);
    const [R, Tt, Ro] = COTE === 'a' ? [p.Ra, p.Ta, p.Rb] : [p.Rb, p.Tb, p.Ra];
    const e = unit(sub(Tt, R));
    const vers = sub(Ro, R);
    const dedans = unit(sub(vers, e.map((x) => x * dot(vers, e)) as V3));
    // Au plus la moitié de la face, même élargi dans le monde.
    const largeur = Math.min(0.24 * a.veines, Math.hypot(...vers) * 0.55);
    const le = (u: number, w: number): V3 => add(add(add(R, sub(Tt, R), u), dedans, w), p.n, 0.016);
    facette(H, [le(0.02, 0), le(0.98, 0), le(0.98, largeur), le(0.02, largeur)], p.dedans, a.lueur);
  }
}
