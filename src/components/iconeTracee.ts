// Le tracé d'une icône de l'application, pour la dessiner hors du DOM (dans une texture du monde 3D) : les éléments
// SVG de l'icône Lucide (`Icon.tsx`), en chemins SVG (`d`) sur une grille de 24 × 24, à tracer d'un trait rond. Rien
// d'emprunté de plus que l'icône déjà affichée par l'application.
import { ICONS, type AnyIconName } from './Icon';

type Noeud = [string, Record<string, string | number | undefined>];

/**
 * Les éléments de l'icône : un composant Lucide est un `forwardRef` dont le rendu porte ses données (`icon.node`).
 * Vérifié pour chaque icône d'île par iconeTracee.test.ts : une version de Lucide qui changerait cette forme casserait
 * le test, pas l'écran (le signe se dessinerait sans icône).
 */
function noeudsDe(name: AnyIconName): Noeud[] {
  const composant = ICONS[name] as unknown as { render?: (props: object, ref: null) => { props?: { icon?: { node?: Noeud[] } } } };
  try {
    return composant.render?.({}, null)?.props?.icon?.node ?? [];
  } catch {
    return [];
  }
}

const n = (v: string | number | undefined) => Number(v ?? 0);

/** Un élément SVG en chemin `d` (path, line, polyline, polygon, circle, ellipse, rect aux coins arrondis). */
function cheminDe([tag, a]: Noeud): string | null {
  switch (tag) {
    case 'path':
      return typeof a.d === 'string' ? a.d : null;
    case 'line':
      return `M${n(a.x1)} ${n(a.y1)}L${n(a.x2)} ${n(a.y2)}`;
    case 'polyline':
    case 'polygon': {
      const pts = String(a.points ?? '').trim().split(/[\s,]+/).map(Number);
      if (pts.length < 4) return null;
      let d = `M${pts[0]} ${pts[1]}`;
      for (let i = 2; i + 1 < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`;
      return tag === 'polygon' ? `${d}Z` : d;
    }
    case 'circle':
    case 'ellipse': {
      const cx = n(a.cx);
      const cy = n(a.cy);
      const rx = tag === 'circle' ? n(a.r) : n(a.rx);
      const ry = tag === 'circle' ? n(a.r) : n(a.ry);
      return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`;
    }
    case 'rect': {
      const x = n(a.x);
      const y = n(a.y);
      const w = n(a.width);
      const h = n(a.height);
      const r = Math.min(n(a.rx ?? a.ry), w / 2, h / 2);
      if (!r) return `M${x} ${y}h${w}v${h}h${-w}Z`;
      return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
    }
    default:
      return null;
  }
}

/** Les chemins de l'icône (sur 24 × 24), à tracer d'un trait rond de 2,5 comme `Icon` ; vide si l'icône est inconnue. */
export function tracesDeLIcone(name: AnyIconName): string[] {
  return noeudsDe(name)
    .map(cheminDe)
    .filter((d): d is string => Boolean(d));
}
