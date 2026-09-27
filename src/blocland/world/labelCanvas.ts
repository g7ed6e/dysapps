// Le nom d'une île, dessiné sur un canvas 2D : une étiquette claire à bord brun, texte dans la police de lecture choisie
// par l'élève. Sert aux deux vues du monde (la 2D le dessine directement, la 3D en fait une texture).

/** La police de lecture en cours (réglage de l'élève), en gras. */
export function labelFont(px: number): string {
  const family = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() : '';
  return `700 ${Math.round(px)}px ${family || 'Arial, sans-serif'}`;
}

/** Dessine l'étiquette centrée sur (cx, cy) ; `px` : taille du texte en pixels du canvas. Renvoie sa largeur. */
export function drawIslandLabel(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, px: number): number {
  ctx.save();
  ctx.font = labelFont(px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + px * 1.2;
  const h = px * 1.7;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  const border = Math.max(2, Math.round(px / 8));
  ctx.fillStyle = '#3b2d20';
  ctx.fillRect(x - border, y - border, w + border * 2, h + border * 2);
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#2b2118';
  ctx.fillText(text, cx, cy + px * 0.05);
  ctx.restore();
  return w + border * 2;
}
