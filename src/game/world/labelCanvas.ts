// Le nom d'une île, dessiné sur un canvas 2D : une étiquette claire à bord brun, texte dans la police de lecture choisie
// par l'élève. La vue 3D en fait une texture. Sur la Carte (hors du mode « Aménager », GD-9), une
// seconde ligne donne l'état de l'île : une petite icône dessinée ici (aucune police d'emoji, rien d'importé) et le mot,
// jamais la couleur seule (DP-08). Une île Fermée a une étiquette plus discrète, mais son texte garde un fort contraste.
// Avant le nom, le bloc que l'île rapporte (`bloc`), dessiné comme dans Mes blocs : un signe plutôt
// qu'une phrase.
import type { IslandStateId } from './islandState';
import { BLOCKS, type BlockId } from '../biomes';
import { project, shade } from '../Voxel';
import { COTE_DU_VISAGE, type Visage } from './characters/face';
import type { Habillage } from './skin/types';

/**
 * Le signe avant le nom : le bloc que l'île rapporte, ou, sur le fantôme du lieu choisi dans « Modifier le plan »
 * (GD-9), les quatre flèches de l'icône du mode (`deplacer`).
 */
export type SigneDuNom = BlockId | 'deplacer';

export interface IslandLabelState {
  id: IslandStateId;
  name: string;
}

/** La police de lecture en cours (réglage de l'élève), en gras. */
function labelFont(px: number): string {
  const family = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() : '';
  return `700 ${Math.round(px)}px ${family || 'Arial, sans-serif'}`;
}

/** La ligne d'état est un peu plus petite que le nom (16 px à l'écran quand le nom en fait 18). */
const STATE_RATIO = 0.9;
/** Le bloc avant le nom : sa demi-hauteur (le cube fait un peu plus que la hauteur des lettres), et l'écart au nom. */
const BLOC_DEMI = 0.52;
const BLOC_ECART = 0.3;
/** La largeur du bloc et de son écart avant le nom (un cube vu de trois quarts est large de √3 fois sa demi-hauteur). */
const blocW = (px: number) => Math.sqrt(3) * BLOC_DEMI * px + BLOC_ECART * px;
/** L'encre des étiquettes de Blocland, celle de ses bulles (three/signs.ts). */
const ENCRE_DU_BLOC = '#2b2118';

/**
 * Un bloc vu de trois quarts, centré sur (`cx`, `cy`), de demi-hauteur `demi` : le cube de `BlockIcon` (Voxel.tsx : le
 * dessus, la face gauche, la face droite plus sombre, mêmes couleurs, même projection), puis son contour et ses deux
 * arêtes intérieures au trait `encre`. Sert aux bulles des commandes (three/signs.ts) et aux étiquettes des îles.
 * `traits` : l'épaisseur du contour et des arêtes, en pixels du canvas (par défaut, à l'échelle du bloc). `delave` :
 * les faces à demi transparentes sur le fond (une île fermée), le contour net.
 */
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bloc: BlockId,
  demi: number,
  encre = ENCRE_DU_BLOC,
  traits = { contour: demi * 0.13, aretes: demi * 0.08 },
  delave = false,
): void {
  const b = BLOCKS[bloc];
  const p = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = project(x, y, z, demi);
    return [cx + px, cy + py];
  };
  const face = (points: [number, number][], fond: string) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fond;
    ctx.fill();
  };
  ctx.save();
  if (delave) ctx.globalAlpha = 0.45;
  face([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)], b.top ?? shade(b.side, 0.16));
  face([p(0, 1, 1), p(1, 1, 1), p(1, 1, 0), p(0, 1, 0)], b.side);
  face([p(1, 0, 1), p(1, 1, 1), p(1, 1, 0), p(1, 0, 0)], shade(b.side, -0.18));
  ctx.globalAlpha = 1;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = encre;
  ctx.lineWidth = traits.contour;
  ctx.beginPath();
  [p(0, 0, 1), p(1, 0, 1), p(1, 0, 0), p(1, 1, 0), p(0, 1, 0), p(0, 1, 1)].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = traits.aretes;
  ctx.beginPath();
  for (const [x, y] of [p(0, 1, 1), p(1, 0, 1), p(1, 1, 0)]) {
    const [mx, my] = p(1, 1, 1);
    ctx.moveTo(mx, my);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Quatre flèches en croix (l'icône du mode « Modifier le plan »), centrées sur (x, y), dans un carré de côté `s`. */
function drawDeplacer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, encre: string): void {
  ctx.save();
  ctx.strokeStyle = encre;
  ctx.fillStyle = encre;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = s * 0.11;
  const r = s * 0.46;
  const p = s * 0.17;
  ctx.beginPath();
  ctx.moveTo(x - r + p, y);
  ctx.lineTo(x + r - p, y);
  ctx.moveTo(x, y - r + p);
  ctx.lineTo(x, y + r - p);
  ctx.stroke();
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(x + dx * r, y + dy * r);
    ctx.lineTo(x + dx * (r - p) - dy * p, y + dy * (r - p) - dx * p);
    ctx.lineTo(x + dx * (r - p) + dy * p, y + dy * (r - p) + dx * p);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Les couleurs de l'étiquette : fond, bord, texte. Fermée : fond grisé et bord adouci, texte toujours ≥ 7:1. */
const PALETTE = {
  open: { bg: '#fffdf7', border: '#3b2d20', text: '#2b2118' },
  closed: { bg: '#e9e4db', border: '#8a7b69', text: '#3a3129' },
};

/** La couleur de l'icône de chaque état (la forme porte le sens, la couleur ne fait qu'aider). */
const ICON_COLOR: Record<IslandStateId, string> = {
  fermee: '#5a4d40',
  'a-explorer': '#1f5d8a',
  'en-chantier': '#8a4a12',
  restauree: '#2e7d32',
};

interface LabelMetrics {
  /** Largeur et hauteur totales, bord compris. */
  w: number;
  h: number;
  border: number;
  nameW: number;
  stateW: number;
}

function metrics(ctx: CanvasRenderingContext2D, text: string, px: number, state?: IslandLabelState, bloc?: SigneDuNom): LabelMetrics {
  ctx.save();
  ctx.font = labelFont(px);
  // La ligne du nom : le bloc de l'île, s'il y en a un, puis le nom.
  const nameW = ctx.measureText(text).width + (bloc ? blocW(px) : 0);
  let stateW = 0;
  if (state) {
    const sp = px * STATE_RATIO;
    ctx.font = labelFont(sp);
    stateW = sp * 1.35 + ctx.measureText(state.name).width;
  }
  ctx.restore();
  const border = Math.max(2, Math.round(px / 8));
  const innerW = Math.max(nameW, stateW) + px * 1.2;
  const innerH = state ? px * 3.05 : px * 1.7;
  return { w: innerW + border * 2, h: innerH + border * 2, border, nameW, stateW };
}

/** La taille de l'étiquette (bord compris), en pixels du canvas : pour dimensionner une texture ou écarter les voisines. */
export function measureIslandLabel(ctx: CanvasRenderingContext2D, text: string, px: number, state?: IslandLabelState, bloc?: SigneDuNom): { w: number; h: number } {
  const m = metrics(ctx, text, px, state, bloc);
  return { w: m.w, h: m.h };
}

/** L'icône d'un état, centrée sur (x, y), dans un carré de côté `s`. */
function drawStateIcon(ctx: CanvasRenderingContext2D, id: IslandStateId, x: number, y: number, s: number, bg = '#fffdf7'): void {
  const color = ICON_COLOR[id];
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (id === 'fermee') {
    // Cadenas : l'anse en arc, le corps plein, le trou de serrure clair.
    ctx.lineWidth = s * 0.13;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.08, s * 0.24, Math.PI, 0);
    ctx.lineTo(x + s * 0.24, y + s * 0.02);
    ctx.moveTo(x - s * 0.24, y - s * 0.08);
    ctx.lineTo(x - s * 0.24, y + s * 0.02);
    ctx.stroke();
    ctx.fillRect(x - s * 0.38, y - s * 0.02, s * 0.76, s * 0.5);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y + s * 0.2, s * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'a-explorer') {
    // Boussole : le cadran rond, l'aiguille en losange (moitié pleine, moitié claire).
    ctx.lineWidth = s * 0.12;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.43, 0, Math.PI * 2);
    ctx.stroke();
    const a = s * 0.3;
    const b = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(x + a * 0.7, y - a * 0.7);
    ctx.lineTo(x + b * 0.7, y + b * 0.7);
    ctx.lineTo(x - b * 0.7, y - b * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = s * 0.06;
    ctx.beginPath();
    ctx.moveTo(x - a * 0.7, y + a * 0.7);
    ctx.lineTo(x + b * 0.7, y + b * 0.7);
    ctx.lineTo(x - b * 0.7, y - b * 0.7);
    ctx.closePath();
    ctx.stroke();
  } else if (id === 'en-chantier') {
    // Marteau : un manche en biais, une tête pleine.
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 4);
    ctx.fillRect(-s * 0.07, -s * 0.2, s * 0.14, s * 0.68);
    ctx.fillRect(-s * 0.34, -s * 0.46, s * 0.62, s * 0.26);
    ctx.fillRect(s * 0.28, -s * 0.42, s * 0.1, s * 0.18);
  } else {
    // Coche : dans un disque plein, tracée en clair.
    ctx.beginPath();
    ctx.arc(x, y, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = bg;
    ctx.lineWidth = s * 0.13;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.22, y + s * 0.01);
    ctx.lineTo(x - s * 0.06, y + s * 0.17);
    ctx.lineTo(x + s * 0.23, y - s * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Dessine l'étiquette centrée sur (cx, cy) ; `px` : taille du nom en pixels du canvas. Avec `state` (la Carte), une
 * seconde ligne : l'icône et le mot de l'état. Avec `bloc`, le bloc que l'île rapporte, avant le nom.
 * Renvoie sa largeur, bord compris.
 */
export function drawIslandLabel(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, px: number, state?: IslandLabelState, bloc?: SigneDuNom): number {
  const m = metrics(ctx, text, px, state, bloc);
  const colors = state?.id === 'fermee' ? PALETTE.closed : PALETTE.open;
  const w = m.w - m.border * 2;
  const h = m.h - m.border * 2;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  ctx.save();
  ctx.fillStyle = colors.border;
  ctx.fillRect(x - m.border, y - m.border, w + m.border * 2, h + m.border * 2);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(x, y, w, h);
  // La ligne du nom, centrée : le bloc (s'il y en a un), puis le nom. Une île fermée a son bloc délavé comme son
  // étiquette (une couleur vive ne doit pas y attirer l'œil), le contour net.
  const nameY = state ? y + px * 0.95 : cy;
  const lineLeft = cx - m.nameW / 2;
  if (bloc === 'deplacer') drawDeplacer(ctx, lineLeft + (Math.sqrt(3) * BLOC_DEMI * px) / 2, nameY, Math.sqrt(3) * BLOC_DEMI * px, colors.border);
  else if (bloc) drawBlock(ctx, lineLeft + (Math.sqrt(3) * BLOC_DEMI * px) / 2, nameY, bloc, BLOC_DEMI * px, colors.border, undefined, state?.id === 'fermee');
  ctx.font = labelFont(px);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'left';
  ctx.fillText(text, lineLeft + (bloc ? blocW(px) : 0), nameY + px * 0.05);
  if (state) {
    ctx.textAlign = 'center';
    // Un filet fin entre le nom et l'état.
    ctx.fillStyle = colors.border;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x + px * 0.4, Math.round(y + px * 1.65), w - px * 0.8, Math.max(1, Math.round(px / 20)));
    ctx.globalAlpha = 1;
    const sp = px * STATE_RATIO;
    const left = cx - m.stateW / 2;
    const stateY = y + px * 2.3;
    drawStateIcon(ctx, state.id, left + sp * 0.5, stateY, sp, colors.bg);
    ctx.font = labelFont(sp);
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.text;
    ctx.fillText(state.name, left + sp * 1.35, stateY + sp * 0.05);
  }
  ctx.restore();
  return m.w;
}

/**
 * Les couleurs des bulles du monde, selon leur forme (`formeDesSignes` de l'habillage) : le fond, le bord et l'ombre
 * (`encre`, qui trace aussi les icônes), le bord de la prochaine chose à faire (`avant`). Blocland : clair et chaud, un
 * brun presque noir, l'or de son interface (`--sand`). Archipéo : Brume, Nuit océan, la lumière (DA, choix « 1a » du
 * mainteneur, 4 octobre 2026). Générées ici, rien d'emprunté.
 */
export const COULEURS_DES_SIGNES = {
  plaque: { fond: '#fff6e0', encre: '#2b2118', avant: '#e0b73f' },
  hexagone: { fond: '#e5ebe3', encre: '#142b38', avant: '#ffd866' },
} as const satisfies Record<Habillage['formeDesSignes'], { fond: string; encre: string; avant: string }>;

/**
 * Le médaillon « toi » de la Carte (Blocland, piste B choisie par le mainteneur le 4 octobre 2026 ; Archipéo, choix
 * « 1a », même jour) : un disque clair au bord sombre épais, à l'ombre nette, de rayon `r` centré en (`cx`, `cy`), aux
 * couleurs des bulles de l'univers (`couleurs`), qui porte le visage du joueur (`visage` : en pixels, ou en facettes ;
 * world/characters/face.ts). Jamais la couleur de la prochaine chose à faire. Il se distingue de la bulle de la
 * destination par sa forme (un rond, pas une plaque ni un hexagone à pointe) et son image (un visage).
 */
export function drawMedaillon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  visage: Visage,
  couleurs: { fond: string; encre: string } = COULEURS_DES_SIGNES.plaque,
): void {
  const bord = Math.max(3, r * 0.14);
  const ombre = Math.max(2, r * 0.1);
  ctx.save();
  ctx.fillStyle = couleurs.encre;
  ctx.beginPath();
  ctx.arc(cx, cy + ombre, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = couleurs.fond;
  ctx.beginPath();
  ctx.arc(cx, cy, r - bord, 0, Math.PI * 2);
  ctx.fill();
  if ('facettes' in visage) {
    // Le visage peint : ses facettes dans le carré inscrit du disque clair, un peu plus grand (la tête le remplit).
    const cote = (r - bord) * 1.6;
    const u = cote / COTE_DU_VISAGE;
    const x0 = cx - cote / 2;
    const y0 = cy - cote / 2;
    for (const { couleur, points } of visage.facettes) {
      ctx.fillStyle = couleur;
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x0 + x * u, y0 + y * u) : ctx.moveTo(x0 + x * u, y0 + y * u)));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  // Le visage, carré, dans le disque clair : chaque pixel de la tête, arrondi au pixel du canvas (pas de flou entre eux).
  const n = visage.length;
  const p = Math.floor(((r - bord) * 1.25) / n);
  const x0 = Math.round(cx - (n * p) / 2);
  const y0 = Math.round(cy - (n * p) / 2);
  visage.forEach((ligne, j) =>
    ligne.forEach((couleur, i) => {
      ctx.fillStyle = couleur;
      ctx.fillRect(x0 + i * p, y0 + j * p, p, p);
    }),
  );
  ctx.restore();
}
