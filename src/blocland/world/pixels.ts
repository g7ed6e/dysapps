// Textures pixel 16 × 16 générées par le code (aucune image empruntée) : herbe, terre, pierre, planches…
// Du dessin pur sur un canvas 2D, sans moteur 3D : les deux vues du monde (3D et 2D) peignent les mêmes pixels.
export type TextureKind =
  | 'herbe'
  | 'terre'
  | 'pierre'
  | 'planches'
  | 'sable'
  | 'verre'
  | 'brique'
  | 'galet'
  | 'obsidienne'
  | 'glace'
  | 'toile'
  | 'panneau'
  | 'tourbe'
  | 'acier'
  | 'calque'
  | 'ardoise'
  | 'parchemin'
  | 'marbre'
  | 'quartz'
  | 'prisme'
  | 'lentille'
  | 'cabine'
  | 'cadran'
  | 'tuile'
  | 'lambris'
  | 'velours'
  | 'rail'
  | 'antenne'
  | 'taille'
  | 'dalle'
  | 'osier'
  | 'bardeau'
  | 'or'
  | 'cristal'
  | 'feuilles'
  | 'tronc'
  | 'nuage'
  | 'eau'
  | 'toit'
  | 'porte'
  | 'lanterne'
  | 'barriere'
  | 'escalier'
  | 'mousse'
  | 'basalte'
  | 'lave'
  | 'sapin'
  | 'marche'
  | 'borne';

/** Côté d'une texture, en pixels. */
export const SIZE = 16;

/** Générateur pseudo-aléatoire reproductible : la même texture à chaque chargement. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export type Painter = (x: number, y: number, r: () => number) => [number, number, number];

/** Une étoile de 10 × 10 pixels, dessinée à la main. */
const STAR = ['....##....', '....##....', '...####...', '##########', '.########.', '..######..', '..######..', '.###..###.', '.##....##.', '..........'];

/** Mélange entre deux couleurs, avec un grain aléatoire. */
export const grain =
  (a: string, b: string): Painter =>
  (_x, _y, r) => {
    const t = r();
    const [ar, ag, ab] = hex(a);
    const [br, bg, bb] = hex(b);
    return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
  };

/** Le joint des dalles. */
const JOINT_DE_DALLE: [number, number, number] = [122, 106, 78];

/**
 * Des dalles de 8 × 8 en quinconce : `fond` uni, un joint d'un pixel (le bas et la droite de chaque dalle), et trois ou
 * quatre pixels `clair` par dalle, placés par un hachage de la dalle (pas par le hasard du canvas : la même texture sur
 * chaque face, quelle que soit la graine).
 */
function dalle(fond: string, clair: [number, number, number]): Painter {
  const base = hex(fond);
  return (x, y) => {
    const rangee = Math.floor(y / 8);
    const u = x + (rangee % 2) * 4;
    if (y % 8 === 7 || u % 8 === 7) return JOINT_DE_DALLE;
    const d = rangee * 3 + Math.floor(u / 8);
    const px = (u % 8) + (y % 8) * 7;
    const n = 3 + (d % 2);
    for (let k = 0; k < n; k++) if (px === (d * 17 + k * 13 + 5) % 49) return clair;
    return base;
  };
}

/** Les tons de l'osier : le haut du brin (clair), le brin, son bas (ombré), le joint entre deux brins. */
type TonsDOsier = { clair: string; brin: string; ombre: string; joint: string };

/**
 * De l'osier tressé, calé sur la vue peinte (pixel/painted.ts, motif `tresse`) : des rangs de quatre pixels, un brin de
 * deux (le haut clair) et un joint sombre de deux, et un montant de deux pixels tous les huit, en quinconce d'un rang à
 * l'autre (décalé de quatre), dans l'ombre : le brin s'y enfonce derrière lui (dessus-dessous). Une seule teinte, le relief seul fait
 * le motif ; le joint est environ deux fois plus sombre que le brin (contraste de 2:1, il se lit aussi en gris), pas plus :
 * au-delà, de loin, la tresse moirait. La dernière ligne est un joint : d'un bloc à l'autre, jamais de bande claire.
 * `bord` : sur le côté, les quatre lignes du haut sont le bord du panier, un brin tordu (des diagonales) sur un joint.
 * Sans hasard : la même texture sur chaque face.
 */
function osier(t: TonsDOsier, bord = false): Painter {
  const [clair, brin, ombre, joint] = [hex(t.clair), hex(t.brin), hex(t.ombre), hex(t.joint)];
  return (x, y) => {
    if (bord && y < 4) {
      // Le bord : un brin tordu, en diagonales de quatre pixels, souligné d'un joint.
      if (y === 3) return joint;
      return (x + y) % 4 === 0 ? ombre : y === 0 ? clair : brin;
    }
    const rang = Math.floor(y / 4);
    const dans = y % 4;
    if (dans >= 2) return joint;
    // Le montant, tous les huit pixels, décalé de quatre un rang sur deux (là où la vue peinte met son joint) : le brin
    // passe derrière lui, dans son ombre.
    if ((x + (rang % 2 ? 4 : 0)) % 8 >= 6) return ombre;
    return dans === 0 ? clair : brin;
  };
}

/** Les tons du bardeau : le bois, et le joint brun sombre sous chaque bardeau et à ses coins. */
type TonsDuBardeau = { bois: string; joint: string };

/**
 * Des bardeaux de bois (le Refuge des carnets, LV2 3e ; DA, LV2-5) : des rangées de quatre pixels, chaque bardeau large de
 * huit, décalées d'un demi-bardeau (quatre pixels) d'une rangée à l'autre ; le bas de chaque bardeau arrondi, ses deux
 * coins coupés (deux pixels à chaque coin sur la ligne au-dessus du joint, décision 6 du DA), et
 * souligné d'un joint brun sombre sur toute sa largeur. Deux tons seulement, ni grain ni dégradé : c'est le motif
 * d'écailles qui le nomme, à côté de la tuile (des rangs droits et des traits), de la brique et de la dalle (des joints
 * droits). La dernière ligne est un joint : d'un bloc à l'autre, les rangées continuent. Sans hasard.
 */
function bardeau(t: TonsDuBardeau): Painter {
  const [bois, joint] = [hex(t.bois), hex(t.joint)];
  return (x, y) => {
    const v = y % 4;
    if (v === 3) return joint;
    // La place du pixel dans son bardeau (0 à 7), décalée d'un demi-bardeau une rangée sur deux.
    const u = (x + (Math.floor(y / 4) % 2 ? 4 : 0)) % 8;
    if (v === 2 && (u <= 1 || u >= 6)) return joint;
    return bois;
  };
}

export const PAINTERS: Record<TextureKind, { top: Painter; side: Painter; bottom?: Painter }> = {
  herbe: {
    top: grain('#5fa233', '#7cc24a'),
    // Terre, avec une frange d'herbe qui descend de façon irrégulière.
    side: (x, y, r) => (y < 3 || (y === 3 && r() < 0.5) ? grain('#5fa233', '#7cc24a')(x, y, r) : grain('#7a5637', '#94694a')(x, y, r)),
    bottom: grain('#7a5637', '#94694a'),
  },
  terre: { top: grain('#7a5637', '#94694a'), side: grain('#7a5637', '#94694a') },
  pierre: {
    top: (x, y, r) => (r() < 0.12 ? grain('#6f6f6f', '#7a7a7a')(x, y, r) : grain('#858585', '#9c9c9c')(x, y, r)),
    side: (x, y, r) => (r() < 0.12 ? grain('#6f6f6f', '#7a7a7a')(x, y, r) : grain('#858585', '#9c9c9c')(x, y, r)),
  },
  planches: {
    top: (x, y, r) => (y % 4 === 3 || (y % 4 === 1 && x === (y * 5) % 16) ? [138, 103, 56] : grain('#a67f46', '#c29a5f')(x, y, r)),
    side: (x, y, r) => (y % 4 === 3 ? [138, 103, 56] : grain('#a67f46', '#c29a5f')(x, y, r)),
  },
  sable: { top: grain('#d9cf9c', '#e8e0b4'), side: grain('#d2c894', '#e3dbad') },
  verre: {
    top: (x, y) => (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1 ? [230, 250, 255] : x === y || x === y + 1 ? [240, 252, 255] : [190, 232, 242]),
    side: (x, y) => (x === 0 || y === 0 || x === SIZE - 1 || y === SIZE - 1 ? [230, 250, 255] : x === y || x === y + 1 ? [240, 252, 255] : [190, 232, 242]),
  },
  // Brique : rangées de briques orangées décalées, joints clairs.
  brique: {
    top: (x, y, r) => (y % 4 === 3 || (x + (y % 8 < 4 ? 0 : 4)) % 8 === 7 ? [214, 196, 170] : grain('#b8623a', '#d98a5a')(x, y, r)),
    side: (x, y, r) => (y % 4 === 3 || (x + (y % 8 < 4 ? 0 : 4)) % 8 === 7 ? [214, 196, 170] : grain('#b8623a', '#d98a5a')(x, y, r)),
  },
  // Galet : gros cailloux ronds bleu-gris, joints sombres entre eux.
  galet: {
    top: (x, y, r) => (Math.hypot((x % 8) - 3.5, (y % 8) - 3.5) > 3.6 ? [88, 104, 122] : grain('#7f96ad', '#a9bccf')(x, y, r)),
    side: (x, y, r) => (Math.hypot((x % 8) - 3.5, (y % 8) - 3.5) > 3.6 ? [88, 104, 122] : grain('#7f96ad', '#a9bccf')(x, y, r)),
  },
  // Obsidienne : verre volcanique noir violacé, quelques reflets clairs.
  obsidienne: {
    top: (x, y, r) => (r() < 0.08 ? [140, 120, 170] : grain('#2e2538', '#4a3d5c')(x, y, r)),
    side: (x, y, r) => (r() < 0.08 ? [140, 120, 170] : grain('#241c2c', '#3d3150')(x, y, r)),
  },
  // Glace : bleu très pâle, fissures claires en diagonale.
  glace: {
    top: (x, y, r) => ((x + y) % 7 === 0 ? [245, 252, 255] : grain('#b6e0ee', '#dff4fb')(x, y, r)),
    side: (x, y, r) => ((x + y) % 7 === 0 ? [245, 252, 255] : grain('#a5d3e4', '#cdeaf4')(x, y, r)),
  },
  // Toile : rayures rouges et écrues d'un auvent de marché.
  toile: {
    top: (x, y, r) => (Math.floor(x / 4) % 2 === 0 ? grain('#c9463f', '#d9574f')(x, y, r) : grain('#e9d9b8', '#f4e8cc')(x, y, r)),
    side: (x, y, r) => (Math.floor(x / 4) % 2 === 0 ? grain('#b83d37', '#c9463f')(x, y, r) : grain('#dccba8', '#e9d9b8')(x, y, r)),
  },
  // Panneau : planches peintes en jaune, une flèche sombre sur le côté.
  panneau: {
    top: (x, y, r) => (y % 4 === 3 ? [180, 140, 40] : grain('#e0b73f', '#f2d16b')(x, y, r)),
    side: (x, y, r) =>
      (y === 7 || y === 8) && x >= 3 && x <= 12
        ? [60, 44, 30]
        : x >= 10 && x <= 12 && Math.abs(y - 7.5) <= 12 - x + 1
          ? [60, 44, 30]
          : grain('#e0b73f', '#f2d16b')(x, y, r),
  },
  // Borne de mission : ardoise bleu nuit, une étoile d'or sur chaque face (un pictogramme, jamais de texte).
  borne: {
    top: (x, y, r) => grain('#2f3d5c', '#3a4a6a')(x, y, r),
    side: (x, y, r) => (STAR[y - 3]?.[x - 3] === '#' ? [242, 201, 68] : grain('#2f3d5c', '#3a4a6a')(x, y, r)),
  },
  // Tourbe : brun très sombre, fibres claires et mousse.
  tourbe: {
    top: (x, y, r) => (r() < 0.1 ? [96, 128, 60] : grain('#3f3320', '#5a4a2a')(x, y, r)),
    side: (x, y, r) => (r() < 0.06 ? [120, 100, 60] : grain('#33291a', '#4a3d24')(x, y, r)),
  },
  // Acier : plaques grises rivetées.
  acier: {
    top: (x, y, r) =>
      x % 8 === 0 || y % 8 === 0
        ? [100, 110, 120]
        : (x % 8 === 2 && y % 8 === 2) || (x % 8 === 6 && y % 8 === 6)
          ? [200, 208, 216]
          : grain('#8f9aa6', '#aab4be')(x, y, r),
    side: (x, y, r) => (x % 8 === 0 || y % 8 === 0 ? [90, 100, 110] : grain('#7f8a96', '#9aa4ae')(x, y, r)),
  },
  // Calque : papier clair quadrillé de lignes bleues.
  calque: {
    top: (x, y, r) => (x % 4 === 0 || y % 4 === 0 ? [150, 180, 220] : grain('#f4f1e4', '#faf8ef')(x, y, r)),
    side: (x, y, r) => (x % 4 === 0 || y % 4 === 0 ? [140, 170, 210] : grain('#dcd6c0', '#e8e3cf')(x, y, r)),
  },
  // Ardoise : gris bleuté en feuillets horizontaux.
  ardoise: {
    top: (x, y, r) => (y % 5 === 4 ? [50, 56, 64] : grain('#4a525c', '#5c6470')(x, y, r)),
    side: (x, y, r) => (y % 3 === 2 ? [46, 52, 60] : grain('#3f4650', '#525a66')(x, y, r)),
  },
  // Parchemin : beige avec des lignes d'écriture ondulées.
  parchemin: {
    top: (x, y, r) => (y % 4 === 2 && x > 1 && x < 14 && r() < 0.8 ? [120, 90, 50] : grain('#e8d8a8', '#f2e6c2')(x, y, r)),
    side: (x, y, r) => (y % 4 === 2 && x > 1 && x < 14 && r() < 0.8 ? [110, 82, 46] : grain('#cdb97f', '#dcc994')(x, y, r)),
  },
  // Marbre : blanc cassé veiné de gris.
  marbre: {
    top: (x, y, r) => ((x + 2 * y) % 11 === 0 ? [180, 176, 170] : grain('#e6e2da', '#f4f1ea')(x, y, r)),
    side: (x, y, r) => ((x + 2 * y) % 11 === 0 ? [170, 166, 160] : grain('#d6d1c8', '#e6e2da')(x, y, r)),
  },
  // Quartz : mauve pâle à facettes claires.
  quartz: {
    top: (x, y, r) => (r() < 0.1 ? [245, 240, 255] : grain('#b9a8d6', '#e6dcf2')(x, y, r)),
    side: (x, y, r) => (r() < 0.1 ? [245, 240, 255] : grain('#a897c8', '#d2c4ea')(x, y, r)),
  },
  // Prisme : verre doré, rayons de lumière en diagonale.
  prisme: {
    top: (x, y, r) => ((x + y) % 6 === 0 ? [255, 250, 220] : grain('#f0c95a', '#fff4c2')(x, y, r)),
    side: (x, y, r) => ((x + y) % 6 === 0 ? [255, 250, 220] : grain('#e0b842', '#f5dc8c')(x, y, r)),
  },
  // Lentille : verre bleuté, un cercle clair (le reflet de la lentille).
  lentille: {
    top: (x, y, r) => (Math.abs(Math.hypot(x - 7.5, y - 7.5) - 5) < 0.8 ? [240, 250, 255] : grain('#9cc8de', '#cfe6f2')(x, y, r)),
    side: (x, y, r) => (Math.abs(Math.hypot(x - 7.5, y - 7.5) - 5) < 0.8 ? [230, 245, 252] : grain('#7fb2cc', '#a9d0e2')(x, y, r)),
  },
  // Cabine : rouge vif, une vitre à petits carreaux sur les côtés (la cabine téléphonique).
  cabine: {
    top: (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15 ? [150, 30, 26] : grain('#c42e28', '#d8342c')(x, y, r)),
    side: (x, y, r) =>
      x >= 3 && x <= 12 && y >= 2 && y <= 10 && (x - 3) % 3 !== 2 && (y - 2) % 3 !== 2 ? [214, 236, 244] : grain('#b02a24', '#c7322b')(x, y, r),
  },
  // Cadran : laiton sur le dessus, un cadran crème cerclé de laiton sur les côtés, deux aiguilles sombres.
  cadran: {
    top: (x, y, r) => (x % 5 === 0 ? [150, 112, 40] : grain('#b8902e', '#d4ad4e')(x, y, r)),
    side: (x, y, r) => {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d > 6.8) return grain('#b8902e', '#d4ad4e')(x, y, r);
      if (d > 5.8) return [150, 112, 40];
      if ((x === 7 || x === 8) && y >= 3 && y <= 8) return [40, 32, 24];
      if ((y === 7 || y === 8) && x >= 8 && x <= 11) return [40, 32, 24];
      return grain('#efe6cc', '#f8f2e0')(x, y, r);
    },
  },
  // Tuile : terre cuite orangée, en rangées décalées.
  tuile: {
    top: (x, y, r) => (y % 4 === 3 ? [150, 70, 40] : grain('#c8683a', '#d97a48')(x, y, r)),
    side: (x, y, r) => (y % 4 === 3 || (x + 2 * Math.floor(y / 4)) % 8 === 0 ? [140, 64, 36] : grain('#b85a30', '#cc6c40')(x, y, r)),
  },
  // Lambris : panneaux de bois sombre, rainures verticales, deux filets dorés.
  lambris: {
    top: (x, y, r) => (x % 4 === 0 ? [60, 38, 22] : grain('#5a3a22', '#6e4a2c')(x, y, r)),
    side: (x, y, r) => (x % 5 === 0 ? [58, 36, 20] : y === 1 || y === 14 ? [190, 150, 70] : grain('#5a3a22', '#704a2c')(x, y, r)),
  },
  // Velours : rideau de théâtre pourpre, plis clairs et sombres, galon doré sur le dessus.
  velours: {
    top: (x, y, r) => (x === 0 || x === 15 || y === 0 || y === 15 ? [200, 160, 70] : grain('#7a1f3a', '#8e2a48')(x, y, r)),
    side: (x, y, r) => (x % 4 === 1 ? [150, 46, 78] : x % 4 === 3 ? [90, 20, 42] : grain('#7a1f3a', '#8a2846')(x, y, r)),
  },
  // Rail : traverses de bois et deux rails d'acier sur le dessus, fonte rivetée sur les côtés.
  rail: {
    top: (x, y, r) => (x === 4 || x === 11 ? [150, 160, 170] : y % 4 < 2 ? grain('#6f4d2a', '#85603a')(x, y, r) : grain('#8a8a8a', '#a0a0a0')(x, y, r)),
    side: (x, y, r) => (x % 4 === 0 && y % 4 === 0 ? [150, 160, 170] : grain('#4a4a50', '#5c5c64')(x, y, r)),
  },
  // Antenne : treillis d'acier clair, croisillons sombres ; un voyant rouge au milieu du dessus.
  antenne: {
    top: (x, y, r) => ((x === 7 || x === 8) && (y === 7 || y === 8) ? [230, 60, 50] : (x + y) % 5 === 0 ? [70, 76, 84] : grain('#9aa4ae', '#b4bcc4')(x, y, r)),
    side: (x, y, r) => ((x + y) % 5 === 0 || (x - y + 20) % 5 === 0 ? [70, 76, 84] : grain('#9aa4ae', '#b4bcc4')(x, y, r)),
  },
  // Pierre de taille : grands blocs beiges bien équarris, joints en quinconce.
  taille: {
    top: (x, y, r) => (x % 8 === 0 || y % 8 === 0 ? [150, 138, 116] : grain('#d8ccb0', '#e6dcc4')(x, y, r)),
    side: (x, y, r) => (y % 5 === 4 || (x + (Math.floor(y / 5) % 2 ? 8 : 0)) % 16 === 0 ? [150, 138, 116] : grain('#d8ccb0', '#e6dcc4')(x, y, r)),
  },
  // Dalle (le Relais des voyageurs, LV2 5e) : des dalles de 8 × 8 décalées d'une demi-dalle d'une rangée à l'autre,
  // joints d'un pixel, trois ou quatre pixels plus clairs par dalle, sans grain ni dégradé. Elle se distingue de la
  // pierre de taille (joints droits, grain), du galet (ronds) et de la pierre (grise) par le motif.
  dalle: { top: dalle('#b8a07a', [208, 190, 156]), side: dalle('#9a8462', [184, 164, 128]) },
  // Osier (le Jardin des heures, LV2 4e) : des brins tressés dessus-dessous, joints sombres, et sur le côté le bord
  // tordu d'un panier en haut. Un miel d'olive, plus vert que les planches, plus sombre que le foin et que la dalle : le
  // motif porte la différence (brins horizontaux et montants en quinconce, sans grain).
  osier: {
    top: osier({ clair: '#c2ad6c', brin: '#a8955a', ombre: '#8c7a44', joint: '#6f623b' }),
    side: osier({ clair: '#a2905a', brin: '#86743f', ombre: '#6e5e32', joint: '#534826' }, true),
  },
  // Bardeau (le Refuge des carnets, LV2 3e) : des écailles de bois brun chaud, en rangées décalées, le bas arrondi et
  // souligné d'un joint brun sombre. Un brun moyen, entre les planches et le lambris, ni orangé comme le cuivre, ni
  // jaune comme l'osier, plus sombre et plus rouge que la dalle.
  bardeau: {
    top: bardeau({ bois: '#96724e', joint: '#4e3826' }),
    side: bardeau({ bois: '#7c5c3e', joint: '#402e20' }),
  },
  or: {
    top: (x, y, r) => (r() < 0.1 ? [255, 240, 150] : grain('#e0b52a', '#f2c944')(x, y, r)),
    side: (x, y, r) => (r() < 0.1 ? [255, 240, 150] : grain('#d4a820', '#eac03c')(x, y, r)),
  },
  cristal: {
    top: (x, y, r) => (r() < 0.12 ? [235, 255, 253] : grain('#5cd0c8', '#78e8de')(x, y, r)),
    side: (x, y, r) => (r() < 0.12 ? [235, 255, 253] : grain('#4fc3bb', '#6fdcd3')(x, y, r)),
  },
  feuilles: {
    top: (x, y, r) => (r() < 0.15 ? [46, 92, 30] : grain('#3f7a2b', '#55a13a')(x, y, r)),
    side: (x, y, r) => (r() < 0.15 ? [46, 92, 30] : grain('#3f7a2b', '#55a13a')(x, y, r)),
  },
  tronc: {
    top: (x, y) => (Math.hypot(x - 7.5, y - 7.5) < 3 ? [190, 160, 110] : [160, 128, 84]),
    side: (x, y, r) => (x % 4 === 0 ? [80, 55, 30] : grain('#5f4128', '#7a5636')(x, y, r)),
  },
  nuage: { top: () => [255, 255, 255], side: () => [236, 244, 250] },
  // Tuiles : rangées décalées, rouge brique.
  toit: {
    top: (x, y, r) => (y % 4 === 0 || (x + (y % 8 < 4 ? 0 : 4)) % 8 === 0 ? [110, 40, 34] : grain('#8a3630', '#b04a3e')(x, y, r)),
    side: (x, y, r) => (y % 4 === 0 ? [110, 40, 34] : grain('#8a3630', '#a8443a')(x, y, r)),
  },
  // Porte : planches sombres, cadre et poignée.
  porte: {
    top: grain('#6f4d2a', '#8a6236'),
    side: (x, y, r) =>
      x === 0 || x === 15 || y === 0 || y === 15
        ? [70, 46, 24]
        : x === 11 && y >= 7 && y <= 8
          ? [240, 200, 90]
          : x === 7 || x === 8
            ? [90, 62, 34]
            : grain('#6f4d2a', '#8a6236')(x, y, r),
  },
  // Lanterne : cadre sombre, cœur jaune qui brille.
  lanterne: {
    top: (x, y) => (x <= 1 || x >= 14 || y <= 1 || y >= 14 ? [60, 44, 30] : [255, 216, 92]),
    side: (x, y, r) =>
      x <= 1 || x >= 14 || y <= 2 || y >= 13 ? [60, 44, 30] : Math.hypot(x - 7.5, y - 7.5) < 3.5 ? [255, 240, 170] : grain('#f0b42a', '#ffd85c')(x, y, r),
  },
  // Barrière : planches claires avec des poteaux et des traverses sombres.
  barriere: {
    top: grain('#c9a870', '#d2b07a'),
    side: (x, y, r) =>
      x === 1 || x === 2 || x === 13 || x === 14 || y === 4 || y === 5 || y === 10 || y === 11 ? [124, 92, 52] : grain('#c9a870', '#d8b986')(x, y, r),
  },
  // Escalier : marches en planches, chaque marche soulignée.
  escalier: {
    top: (x, y, r) => (y % 4 === 3 ? [110, 82, 46] : grain('#a67f46', '#c29a5f')(x, y, r)),
    side: (x, y, r) => (y % 4 === 3 || x % 4 === 3 ? [110, 82, 46] : grain('#8a6a3c', '#a67f46')(x, y, r)),
  },
  // Eau : bleu grainé avec quelques crêtes claires en diagonale, qui défilent pour onduler.
  eau: {
    top: (x, y, r) => ((x + y) % 8 === 0 && r() < 0.6 ? [150, 205, 240] : grain('#4a9be0', '#5eaae8')(x, y, r)),
    side: grain('#4a9be0', '#5eaae8'),
  },
  // Mousse : herbe sombre et humide des marais, quelques touffes plus claires.
  mousse: {
    top: (x, y, r) => (r() < 0.1 ? [120, 160, 70] : grain('#3f7a3a', '#528f45')(x, y, r)),
    side: (x, y, r) => (y < 3 ? grain('#3f7a3a', '#528f45')(x, y, r) : grain('#4a3a2c', '#5e4a38')(x, y, r)),
    bottom: grain('#4a3a2c', '#5e4a38'),
  },
  // Basalte : roche volcanique gris sombre, veinée de rouge cendre.
  basalte: {
    top: (x, y, r) => (r() < 0.06 ? [150, 80, 60] : grain('#4a4448', '#5c5559')(x, y, r)),
    side: (x, y, r) => (r() < 0.06 ? [150, 80, 60] : grain('#3f3a3d', '#524b4f')(x, y, r)),
  },
  // Lave : orange incandescent, croûte sombre par plaques.
  lave: {
    top: (x, y, r) => (r() < 0.18 ? [90, 30, 20] : grain('#ff6a1a', '#ffb03a')(x, y, r)),
    side: (x, y, r) => (r() < 0.18 ? [90, 30, 20] : grain('#e85a12', '#ff9a2a')(x, y, r)),
  },
  // Marche taillée dans la pierre : le nez de chaque marche est souligné d'un trait clair, puis d'une ombre.
  marche: {
    top: (x, y, r) => (y % 8 === 0 ? [176, 176, 176] : y % 8 === 1 ? [104, 104, 104] : grain('#858585', '#9c9c9c')(x, y, r)),
    side: (x, y, r) => (y % 8 === 7 ? [104, 104, 104] : grain('#7c7c7c', '#929292')(x, y, r)),
  },
  // Sapin : aiguilles vert sombre, bleutées.
  sapin: {
    top: (x, y, r) => (r() < 0.15 ? [22, 60, 40] : grain('#2f6b4a', '#3d8557')(x, y, r)),
    side: (x, y, r) => (r() < 0.15 ? [22, 60, 40] : grain('#2a5f42', '#387a50')(x, y, r)),
  },
};

/** Version délavée d'un peintre (île verrouillée : les couleurs s'effacent vers un gris clair, comme dans la brume). */
export const faded =
  (p: Painter): Painter =>
  (x, y, r) => {
    const [cr, cg, cb] = p(x, y, r);
    const lum = cr * 0.3 + cg * 0.59 + cb * 0.11;
    const mix = (c: number) => (c * 0.4 + lum * 0.6) * 0.55 + 205 * 0.45;
    return [mix(cr), mix(cg), mix(cb)];
  };

export function canvasFor(painter: Painter, seed: number): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(SIZE, SIZE);
  const r = rng(seed);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [cr, cg, cb] = painter(x, y, r);
      const i = (y * SIZE + x) * 4;
      image.data[i] = cr;
      image.data[i + 1] = cg;
      image.data[i + 2] = cb;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Graines des faces : les mêmes pixels pour un bloc, quelle que soit la vue. */
const FACE_SEED = { side: 11, top: 23, bottom: 37 } as const;
export type TextureFace = keyof typeof FACE_SEED;

/** Le canvas d'une face de bloc texturé (délavée pour une île verrouillée). */
export function faceCanvas(kind: TextureKind, face: TextureFace, muted = false): HTMLCanvasElement | null {
  const p = PAINTERS[kind];
  const painter = face === 'top' ? p.top : face === 'side' ? p.side : (p.bottom ?? p.top);
  return canvasFor(muted ? faded(painter) : painter, FACE_SEED[face]);
}
