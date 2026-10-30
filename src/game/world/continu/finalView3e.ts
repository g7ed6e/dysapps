// La vue finale du 3e (le Cirque, GD-25 ; décision du mainteneur du 22 octobre 2026, point 2 ; proposition du Cirque,
// « La vue finale » ; relecture du Cirque, correction 1) : une fois le Fanal restauré et la fin des Ferrailleurs jouée,
// de jour, la caméra s'élève lentement au-dessus du Cirque ; elle montre au sud-ouest, au loin sur la mer de nuages, les
// trois archipels rallumés (le phare du 6e, les Aiguilles du 5e, le panache du 4e), puis se tourne lentement vers le
// nord, où le port des Ferrailleurs répond d'une seule lumière fixe, le Fanal allumé devant elle. Un toucher la termine ;
// avec « Réduire les animations », c'est une image fixe, la dernière. La montée est lente, sans à-coup (avis du référent
// dys sur le vertige, point 5) ; la caméra ne plonge jamais vers les nuages (le chemin : ./cameraPath.ts). Aucun mot :
// l'image seule. Code pur.
import type { CameraPose } from './camera';
import { FacetBuilder, type Facets } from './facets';
import { FERRAILLEURS_PORT_3E } from './ferrailleurs3e';
import { between, ease } from './cameraPath';
import type { Vec3 } from './geometry';
import { C3E } from './place3eKit';
import { rock } from './surroundingsKit';

/**
 * Le déroulé, en secondes : la montée vers le sud-ouest (`rise`), un arrêt sur les archipels (`hold`), le tour lent vers
 * le nord (`turn`), puis l'image finale (`rest`) ; la vue se termine seule à la fin, ou au premier toucher. Avec
 * « Réduire les animations », l'image finale, tenue `still` secondes.
 */
export const FINAL_VIEW_3E = { rise: 9, hold: 2, turn: 7, rest: 4, still: 8 } as const;

/** La durée de la vue jouée. */
export const FINAL_VIEW_SECONDS_3E = FINAL_VIEW_3E.rise + FINAL_VIEW_3E.hold + FINAL_VIEW_3E.turn + FINAL_VIEW_3E.rest;

/** Le champ de la caméra de la vue finale (le même que la caméra qui suit). */
const FOV = 56;

/**
 * Les deux poses de la vue : au-dessus de l'ouest du Cirque, tournée vers le sud-ouest et les archipels, le regard à
 * peine sous l'horizon ; puis, un peu plus bas, à l'ouest-sud-ouest du Fanal, tournée vers le nord-est : Kéo dans le tiers
 * bas de l'image, jamais au bord, le Fanal allumé à sa gauche, et à gauche du Fanal, sur l'horizon nord, la lumière du
 * port. Le regard descend de quelques degrés sous l'horizon, jamais plus : on voit la mer de nuages au loin, jamais à pic
 * sous soi.
 */
export const FINAL_POSES_3E = {
  southWest: { position: { x: -78, y: 42, z: -112 }, target: { x: -139.6, y: 31.5, z: -33.2 } },
  north: { position: { x: -70, y: 30, z: -100 }, target: { x: -8.2, y: 1.3, z: -173.6 } },
} as const satisfies Record<string, { position: Vec3; target: Vec3 }>;

/**
 * La pose de la vue finale à `t` secondes de son début, depuis la pose `from` de la caméra au moment où elle commence ;
 * remplie dans `out`. Avec `still`, l'image finale.
 */
export function finalViewPose3e(t: number, from: CameraPose, out: CameraPose, still = false): CameraPose {
  const F = FINAL_VIEW_3E;
  const { southWest: a, north: b } = FINAL_POSES_3E;
  out.fov = FOV;
  out.lens = 0;
  if (still || t >= F.rise + F.hold + F.turn) between(out, b, b, 0);
  else if (t < F.rise + F.hold) between(out, from, a, ease(0, F.rise, t));
  else between(out, a, b, ease(F.rise + F.hold, F.rise + F.hold + F.turn, t));
  return out;
}

/**
 * Les couleurs des archipels au loin : des teintes propres à eux, que le brouillard du lointain ne prend qu'en partie
 * (`LevelWorld.thinFog`) ; jamais presque noires. La pierre bleutée, la terre verte voilée, le blanc du phare, la fumée du
 * panache ; la lumière, l'ocre des lanternes.
 */
export const FAR_ISLES_3E = { stone: 0x8794ab, stoneShade: 0x7a879f, green: 0x8fa88d, tower: 0xeeeae0, smoke: 0xd8d6d2, light: C3E.lantern } as const;

/** La part du brouillard du lointain que gardent les archipels : on les lit au loin, un peu voilés. */
export const FAR_ISLES_FOG_3E = 0.35;

/**
 * Les trois archipels, au sud-ouest, loin sur la mer de nuages (de 330 à 420 unités du Cirque) : leur repère, qu'on
 * reconnaît de loin par sa forme ; le 6e (le phare et sa lumière), le 5e (les Aiguilles), le 4e (le volcan et son panache).
 */
export const FAR_ARCHIPELAGOS_3E = {
  sixth: { x: -400, z: 120 },
  fifth: { x: -330, z: 205 },
  fourth: { x: -235, z: 270 },
} as const;

const ROCK = { light: FAR_ISLES_3E.stone, shade: FAR_ISLES_3E.stoneShade, top: FAR_ISLES_3E.green } as const;

/**
 * Les trois archipels rallumés, dessinés pour la seule vue finale (jamais dans le monde ni sur la Carte) : au 6e, une île
 * basse et son phare blanc, sa lumière ocre ; au 5e, une île et ses trois Aiguilles de pierre, la lanterne du Sémaphore en
 * tête de la plus haute ; au 4e, le cône du volcan et son panache immobile, le fourneau de la Forge à son pied. Les trois
 * feux sont allumés (GD-27, « la chaîne des feux » : les quatre feux se répondent, le Fanal devant la caméra à la fin).
 */
export function farArchipelagos3e(): Facets {
  const b = new FacetBuilder();
  const { sixth, fifth, fourth } = FAR_ARCHIPELAGOS_3E;
  // Le 6e : une île basse, son phare.
  rock(b, { x: sixth.x, y: -1, z: sixth.z }, 22, 5, 61, ROCK);
  rock(b, { x: sixth.x + 18, y: -1, z: sixth.z + 8 }, 12, 3, 62, ROCK);
  b.prism({ x: sixth.x - 4, y: 3, z: sixth.z }, 2.4, 1.8, 14, 8, FAR_ISLES_3E.tower);
  b.box({ x: sixth.x - 4, y: 17, z: sixth.z }, [3.4, 3, 3.4], FAR_ISLES_3E.light);
  b.prism({ x: sixth.x - 4, y: 20, z: sixth.z }, 2.4, 0, 2, 8, FAR_ISLES_3E.stoneShade);
  // Le 5e : une île et ses trois Aiguilles.
  rock(b, { x: fifth.x, y: -1, z: fifth.z }, 24, 6, 63, ROCK);
  for (const [dx, dz, h, r] of [
    [-8, 2, 30, 3.6],
    [0, -3, 38, 4.2],
    [9, 3, 26, 3.2],
  ] as const)
    b.prism({ x: fifth.x + dx, y: 2, z: fifth.z + dz, yaw: dx }, r, r * 0.25, h, 5, FAR_ISLES_3E.stoneShade, FAR_ISLES_3E.stone);
  // Le feu du 5e (GD-27, lot 5) : la lanterne de tête du mât du Sémaphore, en tête de la plus haute Aiguille.
  b.prism({ x: fifth.x, y: 40, z: fifth.z - 3 }, 0.8, 0.6, 5, 4, FAR_ISLES_3E.stoneShade);
  b.box({ x: fifth.x, y: 45, z: fifth.z - 3 }, [3, 2.6, 3], FAR_ISLES_3E.light);
  // Le 4e : le cône du volcan, son panache immobile, et le feu du 4e à son pied (GD-27, lot 5) : le fourneau de la Forge,
  // sa gueule allumée tournée vers le Cirque.
  b.prism({ x: fourth.x, y: -1, z: fourth.z }, 38, 9, 30, 8, FAR_ISLES_3E.stoneShade, FAR_ISLES_3E.stone);
  // Le panache : trois volutes de fumée qui montent en s'élargissant, penchées, immobiles.
  b.prism({ x: fourth.x + 2, y: 28, z: fourth.z }, 6, 8, 12, 6, FAR_ISLES_3E.smoke);
  b.prism({ x: fourth.x + 6, y: 39, z: fourth.z - 2, yaw: 0.5 }, 8, 10, 11, 6, FAR_ISLES_3E.smoke);
  b.prism({ x: fourth.x + 12, y: 49, z: fourth.z - 4, yaw: 1 }, 10, 6, 9, 6, FAR_ISLES_3E.smoke);
  b.prism({ x: fourth.x + 30, y: -1, z: fourth.z - 10 }, 4.2, 3, 9, 6, FAR_ISLES_3E.stoneShade, FAR_ISLES_3E.stone);
  b.box({ x: fourth.x + 30, y: 2.6, z: fourth.z - 13.4 }, [3.4, 2.8, 1.6], FAR_ISLES_3E.light);
  return b.build();
}

/** Le point que la vue finale garde au nord : la lumière du port des Ferrailleurs (pour les tests). */
export const FINAL_NORTH_LIGHT_3E: Vec3 = {
  x: FERRAILLEURS_PORT_3E.at.x + FERRAILLEURS_PORT_3E.jetty.length / 2 - 1.2,
  y: FERRAILLEURS_PORT_3E.jetty.top + FERRAILLEURS_PORT_3E.post + FERRAILLEURS_PORT_3E.lamp / 2,
  z: FERRAILLEURS_PORT_3E.at.z,
};
