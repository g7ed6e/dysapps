// Le nom d'une île, dessiné sur un canvas 2D : une étiquette claire à bord brun, texte dans la police de lecture choisie
// par l'élève. Sert aux deux vues du monde (la 2D le dessine directement, la 3D en fait une texture). Sur la Carte, une
// seconde ligne donne l'état de l'île : une petite icône dessinée ici (aucune police d'emoji, rien d'importé) et le mot,
// jamais la couleur seule (DP-08). Une île Fermée a une étiquette plus discrète, mais son texte garde un fort contraste.
import type { IslandStateId } from './islandState';

export interface IslandLabelState {
  id: IslandStateId;
  name: string;
}

/** La police de lecture en cours (réglage de l'élève), en gras. */
export function labelFont(px: number): string {
  const family = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() : '';
  return `700 ${Math.round(px)}px ${family || 'Arial, sans-serif'}`;
}

/** La ligne d'état est un peu plus petite que le nom (16 px à l'écran quand le nom en fait 18). */
const STATE_RATIO = 0.9;

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

function metrics(ctx: CanvasRenderingContext2D, text: string, px: number, state?: IslandLabelState): LabelMetrics {
  ctx.save();
  ctx.font = labelFont(px);
  const nameW = ctx.measureText(text).width;
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
export function measureIslandLabel(ctx: CanvasRenderingContext2D, text: string, px: number, state?: IslandLabelState): { w: number; h: number } {
  const m = metrics(ctx, text, px, state);
  return { w: m.w, h: m.h };
}

/** L'icône d'un état, centrée sur (x, y), dans un carré de côté `s`. */
export function drawStateIcon(ctx: CanvasRenderingContext2D, id: IslandStateId, x: number, y: number, s: number, bg = '#fffdf7'): void {
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
 * seconde ligne : l'icône et le mot de l'état. Renvoie sa largeur, bord compris.
 */
export function drawIslandLabel(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, px: number, state?: IslandLabelState): number {
  const m = metrics(ctx, text, px, state);
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
  ctx.font = labelFont(px);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.text;
  if (!state) {
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + px * 0.05);
  } else {
    ctx.textAlign = 'center';
    const nameY = y + px * 0.95;
    ctx.fillText(text, cx, nameY + px * 0.05);
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
 * La flèche de la prochaine destination, sur la Carte : une grande flèche jaune cernée de brun, pointe en bas sur
 * (cx, tipY), haute de `h` pixels du canvas. Plus grande et plus contrastée que le fanion du bonhomme, dont elle se
 * distingue aussi par sa forme (une flèche pleine, pas un chevron).
 */
export function drawMapArrow(ctx: CanvasRenderingContext2D, cx: number, tipY: number, h: number): void {
  const head = h * 0.5;
  const halfHead = h * 0.36;
  const halfShaft = h * 0.14;
  const top = tipY - h;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - halfShaft, top);
  ctx.lineTo(cx + halfShaft, top);
  ctx.lineTo(cx + halfShaft, tipY - head);
  ctx.lineTo(cx + halfHead, tipY - head);
  ctx.lineTo(cx, tipY);
  ctx.lineTo(cx - halfHead, tipY - head);
  ctx.lineTo(cx - halfShaft, tipY - head);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, h * 0.1);
  ctx.strokeStyle = '#3b2d20';
  ctx.stroke();
  ctx.fillStyle = '#ffc83c';
  ctx.fill();
  ctx.restore();
}
