// Ce que le shader des blocs reprend (three/construction.ts) : la teinte d'une case, l'allumage des fenêtres, l'opacité
// des fantômes, le biseau peint, les motifs des blocs assemblés (GD-2) ; chaque calcul en TypeScript, pour les tests et
// la vue sans Three.js, et en GLSL, le même calcul.
import { type Couleur, DETAILS_ASSEMBLES } from '../palette';
import { rgb } from '../decor/pinceau';
import { MOTIF } from '../architecture';
import { ALLUMAGE, DECALAGE_MAX, ECART_SOMBRE, ECLAT_DU_BISEAU, PLEINE_NUIT, SOMBRE, TEINTE } from './reglages';

const f32 = Math.fround;

const fract = (v: number) => f32(v - Math.floor(v));

/**
 * Le hasard d'une case, de 0 à 1, stable : le même calcul que `TEINTE_GLSL` (en flottants 32 bits), sur la case dans le
 * repère Three (X = x, Y = hauteur, Z = y). Le GPU peut arrondir autrement : la teinte d'un bloc reste stable d'une
 * image à l'autre, pas forcément identique au bit près à celle-ci.
 */
export function hasardDeCase(x: number, y: number, z: number): number {
  let px = fract(f32(x * f32(0.1031)));
  let py = fract(f32(z * f32(0.1031)));
  let pz = fract(f32(y * f32(0.1031)));
  // p += dot(p, p.zyx + 31.32)
  const k = f32(31.32);
  const d = f32(f32(f32(px * f32(pz + k)) + f32(py * f32(py + k))) + f32(pz * f32(px + k)));
  px = f32(px + d);
  py = f32(py + d);
  pz = f32(pz + d);
  return fract(f32(f32(px + py) * pz));
}

/** La teinte d'un bloc : un facteur de luminosité (sur la couleur affichée, sRGB), de 1 − `TEINTE` à 1 + `TEINTE`. */
export function teinteDeCase(x: number, y: number, z: number): number {
  return 1 + TEINTE * (2 * hasardDeCase(x, y, z) - 1);
}

/**
 * Le même calcul en GLSL : `teinteDeCase(floor(position - normal * 0.25))`, en coordonnées de l'objet (le maillage est
 * posé à l'origine du monde), rend le facteur à appliquer à la couleur linéaire (la puissance 2,2 fait ± 4 % sur la
 * couleur affichée).
 */
export const TEINTE_GLSL = `
float teinteDeCase(vec3 c) {
  vec3 p = fract(c * 0.1031);
  p += dot(p, p.zyx + 31.32);
  float h = fract((p.x + p.y) * p.z);
  return pow(1.0 + ${TEINTE.toFixed(3)} * (2.0 * h - 1.0), 2.2);
}
`;

/**
 * L'éclat d'une fenêtre ou d'une lanterne, de 0 (éteinte) à 1 (pleine lueur), selon le degré de nuit `n` (0 : plein
 * jour, 1 : nuit ; `1 - daylight().light`) et son décalage (de 0 à `DECALAGE_MAX` ; négatif : jamais allumée). Rien sous
 * `ALLUMAGE`, tout allumé à `PLEINE_NUIT` ; chaque fenêtre s'allume sur sa rampe, un peu après les autres selon son
 * décalage. Monotone en `n`, en douceur (pas de clignotement).
 */
export function eclatDeFenetre(n: number, decalage: number): number {
  if (decalage < 0) return 0;
  const debut = ALLUMAGE + Math.min(decalage, DECALAGE_MAX);
  const fin = Math.min(PLEINE_NUIT, debut + (PLEINE_NUIT - ALLUMAGE) - DECALAGE_MAX);
  const t = Math.min(1, Math.max(0, (n - debut) / (fin - debut)));
  return t * t * (3 - 2 * t);
}

/** Le même calcul en GLSL (`n` : uniforme, `decalage` : attribut par sommet). */
export const ECLAT_GLSL = `
float eclatDeFenetre(float n, float decalage) {
  if (decalage < 0.0) return 0.0;
  float debut = ${ALLUMAGE.toFixed(3)} + min(decalage, ${DECALAGE_MAX.toFixed(3)});
  float fin = min(${PLEINE_NUIT.toFixed(3)}, debut + ${(PLEINE_NUIT - ALLUMAGE - DECALAGE_MAX).toFixed(3)});
  return smoothstep(debut, fin, n);
}
`;

/**
 * L'opacité des fantômes, entre la nuit (`light` = 0) et le jour (1) : le remplissage (0,35 de jour, 0,45 de nuit)
 * et l'arête (70 % : à 50 %, les fantômes crème disparaissaient sur le marbre des Îles du Ciel).
 */
export function opaciteDesFantomes(light: number): { remplissage: number; arete: number } {
  const l = Math.min(1, Math.max(0, light));
  return { remplissage: 0.45 + (0.35 - 0.45) * l, arete: 0.7 };
}

/** La distance d'un bord qui n'est pas une arête saillante, dans `biseaux`. */
export const SANS_BISEAU = 64;

const srgbVersLineaire = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

const lineaireVersSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

/**
 * La couleur (sRGB) au bord saillant d'une face de couleur `c`, là où le biseau peint est plein : +`ECLAT_DU_BISEAU` de
 * lumière, et, sur une teinte sombre, au moins +`ECART_SOMBRE` niveaux par canal (le même calcul que `BISEAU_GLSL`).
 * Toujours plus clair, jamais plus sombre.
 */
export function eclatDuBiseau(c: Couleur): Couleur {
  const k = rgb(c).map((v) => v / 255);
  const lin = k.map(srgbVersLineaire);
  const sombre = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2] < SOMBRE;
  const out = lin.map((l, i) => {
    let f = l * (1 + ECLAT_DU_BISEAU);
    if (sombre) f = Math.max(f, srgbVersLineaire(Math.min(1, k[i] + ECART_SOMBRE / 255)));
    return Math.round(Math.min(1, lineaireVersSrgb(Math.min(1, f))) * 255);
  });
  return (out[0] << 16) | (out[1] << 8) | out[2];
}

/**
 * Le biseau peint en GLSL : \`biseauPeint(c, k, force)\` rend la couleur linéaire \`c\` éclaircie à la part \`k\` de la bande
 * (\`force\` : \`ECLAT_DU_BISEAU\`, 0 pour l'éteindre). Les fonctions sRGB sont celles de Three.js.
 */
export const BISEAU_GLSL = `
vec3 biseauPeint(vec3 c, float k, float force) {
  vec3 fort = c * (1.0 + force);
  if (force > 0.0 && dot(c, vec3(0.2126, 0.7152, 0.0722)) < ${SOMBRE.toFixed(2)}) {
    vec3 s = sRGBTransferOETF(vec4(c, 1.0)).rgb + ${(ECART_SOMBRE / 255).toFixed(5)};
    fort = max(fort, sRGBTransferEOTF(vec4(min(s, vec3(1.0)), 1.0)).rgb);
  }
  return mix(c, fort, k);
}
`;

// ---------- Les motifs des blocs assemblés (GD-2) ----------

/**
 * Le premier motif des blocs assemblés : le bit au-dessus de tous ceux d'un mur peint (./architecture/peinture.ts,
 * `MOTIF`), si bien qu'aucun mur peint, quels que soient ses drapeaux, ne peut se lire comme un bloc assemblé, ni
 * l'inverse. Il suit `MOTIF` s'il gagne un drapeau.
 */
export const MOTIF_ASSEMBLE_DEBUT = 2 * Math.max(...Object.values(MOTIF));

/**
 * Le motif peint de chaque bloc assemblé, par sommet (l'attribut `motifs`, qu'il partage avec les murs peints du lot 7 :
 * les blocs assemblés prennent `MOTIF_ASSEMBLE_DEBUT` + 1 à + 4, au-delà de leurs bits ; 1025 à 1028 aujourd'hui, des
 * entiers exacts en flottant). Il se peint dans le shader, sans un triangle de plus, par-dessus la couleur de fond du
 * bloc (world/palette.ts, `MATIERES`) : deux blocs ne se distinguent jamais par la couleur seule. Un bloc délavé (île
 * fermée) n'a pas de motif.
 */
export const MOTIF_ASSEMBLE = {
  poutre: MOTIF_ASSEMBLE_DEBUT + 1,
  vitrail: MOTIF_ASSEMBLE_DEBUT + 2,
  engrenage: MOTIF_ASSEMBLE_DEBUT + 3,
  miroir: MOTIF_ASSEMBLE_DEBUT + 4,
} as const;

export type BlocAssemble = keyof typeof MOTIF_ASSEMBLE;

/** Les mesures des motifs, en part de case, depuis le milieu de la face (le même dessin en JS et en GLSL). */
const MESURES_DES_MOTIFS = {
  /** Le madrier : deux veines en long, et un collier à mi-hauteur ; sur le dessus, un cerne. */
  poutre: { veines: [-0.22, 0.18], veine: 0.025, collier: 0.09, cerne: 0.28, epaisseurDuCerne: 0.035 },
  /** Le hublot : un disque de verre dans son bord sombre, un reflet en haut à gauche. */
  vitrail: { bord: 0.35, verre: 0.3, reflet: [-0.1, 0.1, 0.07] },
  /** La poulie : la roue, sa gorge, son axe. */
  engrenage: { roue: 0.38, gorge: 0.26, epaisseurDeGorge: 0.035, axe: 0.07 },
  /** La loupe : l'anneau, le verre, l'éclat, et le manche vers le coin bas-droit. */
  miroir: { anneau: 0.32, verre: 0.23, eclat: [-0.08, 0.08, 0.06], manche: [0.2, -0.2, 0.46, -0.46], epaisseurDuManche: 0.05 },
} as const;

/** Le détail peint au point (`u`, `v`) d'une face d'un bloc assemblé, de −0,5 à 0,5 depuis son milieu (`v` monte sur un côté) ; `null` : son fond. */
export function detailDuMotif(bloc: BlocAssemble, u: number, v: number, dessus: boolean): string | null {
  const r = Math.hypot(u, v);
  if (bloc === 'poutre') {
    const M = MESURES_DES_MOTIFS.poutre;
    if (dessus) return Math.abs(r - M.cerne) < M.epaisseurDuCerne ? 'veine' : null;
    if (Math.abs(v) < M.collier) return 'collier';
    return M.veines.some((x) => Math.abs(u - x) < M.veine) ? 'veine' : null;
  }
  if (bloc === 'vitrail') {
    const M = MESURES_DES_MOTIFS.vitrail;
    if (Math.hypot(u - M.reflet[0], v - M.reflet[1]) < M.reflet[2]) return 'reflet';
    return r < M.verre ? 'verre' : r < M.bord ? 'bord' : null;
  }
  if (bloc === 'engrenage') {
    const M = MESURES_DES_MOTIFS.engrenage;
    if (r < M.axe || Math.abs(r - M.gorge) < M.epaisseurDeGorge) return 'gorge';
    return r < M.roue ? 'roue' : null;
  }
  const M = MESURES_DES_MOTIFS.miroir;
  if (Math.hypot(u - M.eclat[0], v - M.eclat[1]) < M.eclat[2]) return 'eclat';
  if (r < M.verre) return 'verre';
  if (r < M.anneau) return 'laiton';
  const [ax, ay, bx, by] = M.manche;
  const t = Math.min(1, Math.max(0, ((u - ax) * (bx - ax) + (v - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
  return Math.hypot(u - ax - (bx - ax) * t, v - ay - (by - ay) * t) < M.epaisseurDuManche ? 'laiton' : null;
}

const glslLin = (c: Couleur) => {
  const [r, g, b] = rgb(c).map((v) => srgbVersLineaire(v / 255).toFixed(4));
  return `vec3(${r}, ${g}, ${b})`;
};

const f3 = (v: number) => v.toFixed(3);

/**
 * Les motifs en GLSL : `motifAssemble(c, m, pos, n)` peint le bloc assemblé `m` (son rang : 1 poutre, 2 vitrail,
 * 3 engrenage, 4 miroir ; 0 : aucun) sur la couleur linéaire `c`, à la position `pos` d'une face de normale `n` (repère
 * Three). Le shader lui passe `motif − MOTIF_ASSEMBLE_DEBUT` pour un bloc assemblé, 0 sinon (three/construction.ts).
 * Bords adoucis sur un pixel ; de loin, quand une case tient en moins de 12 pixels, le motif s'efface vers le fond (rien
 * sous 6 pixels) : jamais de moiré. Les dérivées se prennent avant tout branchement.
 */
export const MOTIF_ASSEMBLE_GLSL = (() => {
  const D = DETAILS_ASSEMBLES;
  const P = MESURES_DES_MOTIFS;
  return `
float dansLeMotif(float d, float fw) { return 1.0 - smoothstep(-fw, fw, d); }
vec3 motifAssemble(vec3 c, float m, vec3 pos, vec3 n) {
  vec3 an = abs(n);
  bool dessus = an.y > 0.5;
  vec2 q = an.x > 0.5 ? pos.zy : (dessus ? pos.xz : pos.xy);
  vec2 fq = fwidth(q);
  float fw = max(max(fq.x, fq.y), 1e-5);
  if (m < 0.5) return c;
  float k = clamp((1.0 / fw - 6.0) / 6.0, 0.0, 1.0);
  vec2 p = fract(q) - 0.5;
  float r = length(p);
  if (m < 1.5) {
    if (dessus) return mix(c, ${glslLin(D.poutre.veine)}, dansLeMotif(abs(r - ${f3(P.poutre.cerne)}) - ${f3(P.poutre.epaisseurDuCerne)}, fw) * k);
    float v = min(abs(p.x - (${f3(P.poutre.veines[0])})), abs(p.x - ${f3(P.poutre.veines[1])})) - ${f3(P.poutre.veine)};
    c = mix(c, ${glslLin(D.poutre.veine)}, dansLeMotif(v, fw) * k);
    return mix(c, ${glslLin(D.poutre.collier)}, dansLeMotif(abs(p.y) - ${f3(P.poutre.collier)}, fw) * k);
  }
  if (m < 2.5) {
    c = mix(c, ${glslLin(D.vitrail.bord)}, dansLeMotif(r - ${f3(P.vitrail.bord)}, fw) * k);
    c = mix(c, ${glslLin(D.vitrail.verre)}, dansLeMotif(r - ${f3(P.vitrail.verre)}, fw) * k);
    return mix(c, ${glslLin(D.vitrail.reflet)}, dansLeMotif(length(p - vec2(${f3(P.vitrail.reflet[0])}, ${f3(P.vitrail.reflet[1])})) - ${f3(P.vitrail.reflet[2])}, fw) * k);
  }
  if (m < 3.5) {
    c = mix(c, ${glslLin(D.engrenage.roue)}, dansLeMotif(r - ${f3(P.engrenage.roue)}, fw) * k);
    c = mix(c, ${glslLin(D.engrenage.gorge)}, dansLeMotif(abs(r - ${f3(P.engrenage.gorge)}) - ${f3(P.engrenage.epaisseurDeGorge)}, fw) * k);
    return mix(c, ${glslLin(D.engrenage.gorge)}, dansLeMotif(r - ${f3(P.engrenage.axe)}, fw) * k);
  }
  vec2 a = vec2(${f3(P.miroir.manche[0])}, ${f3(P.miroir.manche[1])});
  vec2 ab = vec2(${f3(P.miroir.manche[2])}, ${f3(P.miroir.manche[3])}) - a;
  float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  c = mix(c, ${glslLin(D.miroir.laiton)}, dansLeMotif(length(p - a - ab * t) - ${f3(P.miroir.epaisseurDuManche)}, fw) * k);
  c = mix(c, ${glslLin(D.miroir.laiton)}, dansLeMotif(r - ${f3(P.miroir.anneau)}, fw) * k);
  c = mix(c, ${glslLin(D.miroir.verre)}, dansLeMotif(r - ${f3(P.miroir.verre)}, fw) * k);
  return mix(c, ${glslLin(D.miroir.eclat)}, dansLeMotif(length(p - vec2(${f3(P.miroir.eclat[0])}, ${f3(P.miroir.eclat[1])})) - ${f3(P.miroir.eclat[2])}, fw) * k);
}
`;
})();
