// Le cadre commun des veillées (GD-23, « trois veillées par niveau » ; GD-27, « Par quels canaux le récit se raconte » ;
// lot 3, piste A « Le regard qui se pose ») : la caméra quitte Kéo pour deux ou trois plans lents dans le monde tel qu'il
// est, chacun une pose (./cameraPath.ts) qu'elle rejoint en `travel` secondes et tient `hold` secondes, puis revient
// derrière lui ; une seule ligne, écrite et lue par la page ; un toucher passe tout. Avec « Réduire les animations », le
// dernier plan seul, en image fixe, `still` secondes. Aucun triangle : ce que la veillée montre est déjà là. Code pur ;
// la scène joue le script (three/archipeo/scene.ts, `playVigil`), les plans de chaque niveau sont à part (./vigils6e.ts).
import { FOLLOW, type CameraPose } from './camera';
import { between, ease, type CameraScript, type Shot } from './cameraPath';

/** Un plan d'une veillée : sa pose, le temps d'y glisser depuis la pose d'avant (nul : la caméra y coupe), le temps de la tenir. */
export interface VigilShot extends Shot {
  readonly travel: number;
  readonly hold: number;
}

/** Une veillée : ses plans, dans l'ordre, et ce que dure son image fixe avec « Réduire les animations ». */
export interface Vigil {
  readonly shots: readonly VigilShot[];
  readonly still: number;
}

/** La durée d'une veillée jouée. */
export const vigilSeconds = (v: Vigil): number => v.shots.reduce((s, shot) => s + shot.travel + shot.hold, 0);

/**
 * Les instants où la caméra coupe (un plan sans trajet : elle y est d'un coup), depuis le début de la veillée ; 0 si elle
 * coupe dès le premier plan. La page couvre chaque coupe du voile du fondu (GD-27, lots 3 bis et 5).
 */
export function vigilCutTimes(v: Vigil): number[] {
  const cuts: number[] = [];
  let at = 0;
  for (const shot of v.shots) {
    if (shot.travel === 0) cuts.push(at);
    at += shot.travel + shot.hold;
  }
  return cuts;
}

/**
 * La veillée `v` précédée d'un coup d'œil (GD-27, lot 5, « la lueur du niveau d'avant ») : le plan `glance`, que la caméra
 * rejoint en glissant depuis Kéo, puis les plans de `v`, dont le premier devient une coupe (le feu est à l'autre bout du
 * niveau) et chacun cède `trim` secondes, pour que la veillée reste courte.
 */
export function glanceFirst(glance: VigilShot, v: Vigil, trim = 1): Vigil {
  return {
    shots: [glance, ...v.shots.map((shot, i) => ({ ...shot, travel: i === 0 ? 0 : Math.max(0, shot.travel - trim), hold: Math.max(1, shot.hold - trim) }))],
    still: v.still,
  };
}

/**
 * La pose de la veillée `v` à `t` secondes de son début, depuis la pose `from` de la caméra au moment où elle commence ;
 * remplie dans `out`. Avec `still`, son dernier plan. Le champ est celui de la caméra qui suit.
 */
export function vigilPose(v: Vigil, t: number, from: CameraPose, out: CameraPose, still = false): CameraPose {
  out.fov = FOLLOW.fov;
  out.lens = 0;
  const last = v.shots[v.shots.length - 1];
  if (!still) {
    let prev: Shot = from;
    let at = 0;
    for (const shot of v.shots) {
      if (t < at + shot.travel) {
        between(out, prev, shot, ease(at, at + shot.travel, t));
        return out;
      }
      at += shot.travel;
      if (t < at + shot.hold) {
        between(out, shot, shot, 0);
        return out;
      }
      at += shot.hold;
      prev = shot;
    }
  }
  between(out, last, last, 0);
  return out;
}

/** Le script de caméra d'une veillée, tel que la scène le joue. */
export const vigilScript = (v: Vigil): CameraScript => ({ seconds: vigilSeconds(v), still: v.still, pose: (t, from, out, still) => vigilPose(v, t, from, out, still) });
