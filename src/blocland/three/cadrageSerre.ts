// Le cadrage serré d'une vitrine (le Gardien du défi, DA-34) : où poser la caméra, vue d'une direction donnée, pour que
// le personnage remplisse le cadre sans en sortir. Calcul pur, sans Three.js, testé à part.

/** Où poser la caméra : la cible visée (en décalage depuis l'origine des points) et la distance, le long de la direction. */
export interface CadrageSerre {
  cible: [number, number, number];
  distance: number;
}

/**
 * Le cadrage le plus serré où chacun des `points` (x, y, z à la suite, repère de Three.js, y vers le haut) tient dans
 * le champ de la caméra (`fov` vertical en degrés, `aspect` largeur / hauteur), à `marge` près (fraction du demi-champ
 * laissée libre au bord). La caméra regarde le long de −`direction` (pas forcément unitaire), haut de l'image vers +y ;
 * la cible se décale dans le plan de l'image pour centrer le personnage tel qu'il se voit, pas sa boîte.
 */
export function cadrageSerre(points: ArrayLike<number>, direction: [number, number, number], fov: number, aspect: number, marge = 0.06): CadrageSerre {
  const [dx, dy, dz] = direction;
  const n = Math.hypot(dx, dy, dz) || 1;
  // Vers la caméra (n), sa droite (r) et son haut (u), comme Object3D.lookAt avec le haut du monde.
  const nx = dx / n;
  const ny = dy / n;
  const nz = dz / n;
  const rl = Math.hypot(nz, nx) || 1;
  const rx = nz / rl;
  const rz = -nx / rl;
  const ux = ny * rz;
  const uy = nz * rx - nx * rz;
  const uz = -ny * rx;
  const count = Math.floor(points.length / 3);
  if (!count) return { cible: [0, 0, 0], distance: 1 };
  // Chaque point dans le repère de l'image : à droite (a), en haut (b), vers la caméra (c).
  const a = new Float64Array(count);
  const b = new Float64Array(count);
  const c = new Float64Array(count);
  let rayon = 0;
  for (let i = 0; i < count; i++) {
    const px = points[i * 3];
    const py = points[i * 3 + 1];
    const pz = points[i * 3 + 2];
    a[i] = px * rx + pz * rz;
    b[i] = px * ux + py * uy + pz * uz;
    c[i] = px * nx + py * ny + pz * nz;
    rayon = Math.max(rayon, Math.hypot(px, py, pz));
  }
  const tanV = Math.tan((fov * Math.PI) / 360) * (1 - marge);
  const tanH = tanV * (aspect > 0 ? aspect : 1);
  /** Le décalage de la cible sur un axe de l'image, s'il en existe un qui fait tout tenir à la distance d. */
  const centre = (v: Float64Array, t: number, d: number): number | null => {
    let bas = -Infinity;
    let haut = Infinity;
    for (let i = 0; i < count; i++) {
      const demi = t * (d - c[i]);
      if (demi <= 0) return null;
      bas = Math.max(bas, v[i] - demi);
      haut = Math.min(haut, v[i] + demi);
    }
    return bas <= haut ? (bas + haut) / 2 : null;
  };
  const tient = (d: number) => centre(a, tanH, d) !== null && centre(b, tanV, d) !== null;
  // Assez loin, tout tient : on cherche par dichotomie la distance la plus courte qui tient encore.
  let loin = rayon * (1 + 1 / Math.min(tanV, tanH)) + 1e-6;
  let pres = rayon;
  for (let k = 0; k < 40; k++) {
    const milieu = (pres + loin) / 2;
    if (tient(milieu)) loin = milieu;
    else pres = milieu;
  }
  const oa = centre(a, tanH, loin) ?? 0;
  const ob = centre(b, tanV, loin) ?? 0;
  return { cible: [oa * rx + ob * ux, ob * uy, oa * rz + ob * uz], distance: loin };
}

/** Les huit coins de chaque cube unité (x, y, z : son coin bas, repère de Three.js), décalés de `origine`. */
export function coinsDesCubes(cubes: ArrayLike<readonly [number, number, number]>, origine: [number, number, number] = [0, 0, 0]): Float64Array {
  const out = new Float64Array(cubes.length * 24);
  let k = 0;
  for (let i = 0; i < cubes.length; i++) {
    const [x, y, z] = cubes[i];
    for (const sx of [0, 1])
      for (const sy of [0, 1])
        for (const sz of [0, 1]) {
          out[k++] = x + sx - origine[0];
          out[k++] = y + sy - origine[1];
          out[k++] = z + sz - origine[2];
        }
  }
  return out;
}
