// Le Lion de pierre, Gardien de la Baie des mots (6e), redessiné d'après le concept validé par le mainteneur et le brief
// du directeur artistique (30/09/2026) : un lion adulte couché sur son quai de pierre, les pattes avant allongées, la
// queue le long du flanc ; la tête haute, gueule fermée, tournée vers l'élève, dans une collerette de huit grandes
// plaques qui part vers l'arrière (pas un disque vu de face : c'est le Soleil de cuivre du 4e). Ce qui s'allume : trois
// veines le long d'une arête de trois plaques de la crinière, en plus de la flamme commune du foyer.
//
// Le corps, dessiné de profil l'avant vers −X, tourne de `TOUR_DU_CORPS` pour montrer son avant de trois-quarts ; la
// tête garde son propre repère, presque de face, pour que ses orbites regardent l'élève (−Z).
import { devant, facette, fuseau, pose, repere, type Anneau, type Peindre, type Trace, type V3 } from '../peint';
import { HAUTEUR_DE_SENTINELLE, orbites, tube, type Atelier } from '../sentinelle';

/** Le tour du corps couché autour de la verticale du socle : l'avant (−X) vers l'élève (−Z), de trois-quarts. */
const TOUR_DU_CORPS = 0.5 - Math.PI;
/** Le haut du quai, où le Lion est couché. */
const QUAI = 2.7;
/** Le quai, dans le repère du corps : x0, z0, x1, z1 (assez étroit devant pour laisser voir la flamme du foyer). */
const EMPRISE_DU_QUAI = [-1.75, -0.9, 1.6, 0.8] as const;
/** La tête : le point sous son centre (dans le monde, avant le tour du corps) et son tour vers l'avant du corps. */
const TETE = { x: 0.68, z: -1.18, tour: -0.15 } as const;

/** Le profil de la tête autour de son centre : le museau avancé, les joues, le front (cinq pans, une face vers l'élève). */
const TETE_DU_LION: Anneau[] = [
  [-0.62, 0.54, 0.4, -0.28],
  [-0.02, 0.76, 0.6, -0.06],
  [0.66, 0.6, 0.52, 0.08],
];
/** Le poitrail, dans le repère du corps : hauteur au-dessus du quai, rayons, avancée ; et sa place le long du corps. */
const POITRAIL: Anneau[] = [
  [0, 0.95, 0.85],
  [1.5, 0.98, 0.88],
  [2.8, 0.66, 0.6, 0, -0.1],
];
const POITRAIL_X = -0.6;

/**
 * La collerette : huit plaques en couronne autour de la tête (l'angle de chacune, en degrés depuis la droite, et sa
 * longueur), plus longues sur les côtés et vers le poitrail qu'au sommet. `centre` : le milieu de la couronne, un peu
 * derrière la face ; `base` : où naissent les plaques ; `recul` : leur pente vers l'arrière ; les demi-largeurs de la
 * face avant de chaque plaque à sa naissance et à son bout, et du dos à sa naissance ; `arete` : la saillie de la face
 * avant.
 */
const CRINIERE: [number, number, number][] = [
  [90, 1.45, 1.2],
  [135, 1.5, 1.2],
  [180, 1.55, 1.1],
  [225, 1.85, 0.35],
  [270, 1.95, 0.05],
  [315, 1.85, 0.35],
  [0, 1.55, 1.1],
  [45, 1.5, 1.2],
];
const COLLERETTE = { centre: [0, 0.0, 0.2] as V3, base: 0.46, face: 0.32, bout: 0.42, dos: 0.75, arete: 0.22 };
/** Les plaques dont une arête s'allume : en haut à gauche, à gauche, en haut à droite. */
const VEINES_DE_LA_CRINIERE = [1, 2, 7];

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
/** La hauteur du centre de la tête : la crinière touche les huit blocs de la sentinelle. */
const Y_DE_LA_TETE = HAUTEUR_DE_SENTINELLE - SOMMET_DE_LA_CRINIERE;

/** Le repère de la tête : son centre, tourné de `TETE.tour`. */
const repereDeLaTete = (T: Trace): Trace => pose(T, repere([TETE.x, Y_DE_LA_TETE, TETE.z], 0, TETE.tour, 0));
/** Le repère du corps couché, tourné de trois-quarts. */
const repereDuCorps = (T: Trace): Trace => pose(T, repere([0, 0, 0], 0, TOUR_DU_CORPS, 0));

export function sculptureDuLion(T: Trace, a: Atelier): void {
  const C = repereDuCorps(T);
  const q = QUAI;
  // Le quai, un bloc au fruit léger.
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
  // Le poitrail, dressé sous la tête, et le dos jusqu'à la croupe ; le lichen sur deux facettes du dos (jamais sur la
  // crinière).
  fuseau(C, POITRAIL.map(([y, rx, rz, dz]): Anneau => [q + y, rx, rz, dz]), 6, a.pierre, { x: POITRAIL_X, z: 0.05, bas: false, haut: false });
  tube(
    C,
    [
      [-0.3, q + 1.45, 0.05],
      [1.5, q + 0.95, 0.05],
    ],
    [0.82, 0.86],
    6,
    a.pierre,
    1.2,
    (_i, j) => (j === 3 || j === 4 ? a.lichen : a.pierre),
  );
  // Les pattes avant, allongées sur le quai.
  for (const z of [0.4, -0.5])
    tube(
      C,
      [
        [-0.45, q + 0.52, z],
        [-1.95, q + 0.34, z],
      ],
      [0.5, 0.36],
      3,
      a.pierre,
    );
  // La queue, enroulée sur le quai le long du flanc (côté élève), finie en pointe.
  tube(
    C,
    [
      [1.7, q + 0.5, -0.2],
      [1.75, q + 0.18, 0.6],
      [0.9, q + 0.17, 0.8],
    ],
    [0.18, 0.16, 0],
    3,
    a.pierre,
  );
  // La tête, le museau, les orbites, puis la collerette.
  const H = repereDeLaTete(T);
  fuseau(H, TETE_DU_LION, 5, a.pierre, { bas: false });
  orbites(H, a, 0, 0.26, devant(TETE_DU_LION, 5, 0.26).z, 0.26, 0.16);
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

/** Les veines : un ruban sur la face avant de trois plaques, le long de l'arête `Ra`→`Ta`. */
export function veinesDuLion(T: Trace, a: Atelier): void {
  const H = repereDeLaTete(T);
  const largeur = 0.2 * a.veines;
  for (const i of VEINES_DE_LA_CRINIERE) {
    const p = plaqueDeCriniere(CRINIERE[i]);
    const e = unit(sub(p.Ta, p.Ra));
    const vers = sub(p.Rb, p.Ra);
    const dedans = unit(sub(vers, e.map((x) => x * dot(vers, e)) as V3));
    const le = (u: number, w: number): V3 => add(add(add(p.Ra, sub(p.Ta, p.Ra), u), dedans, w), p.n, 0.016);
    facette(H, [le(0.1, 0), le(0.96, 0), le(0.96, largeur), le(0.1, largeur)], p.dedans, a.lueur);
  }
}
