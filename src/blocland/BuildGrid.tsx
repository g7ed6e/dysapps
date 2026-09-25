import type { KeyboardEvent } from 'react';
import { BLOCKS } from './biomes';
import { columnHeight, type BuildCell } from './engine';
import { Cube, PixelGrainDefs, project } from './Voxel';

interface Props {
  /** Blocs posés, en coordonnées de la grille (0..width-1, 0..height-1). */
  build: BuildCell[];
  width: number;
  height: number;
  /** Case sélectionnée au clavier ou au toucher. */
  selected: { x: number; y: number } | null;
  onSelect: (x: number, y: number) => void;
  /** Action sur une case (poser ou retirer selon le mode). */
  onAction: (x: number, y: number) => void;
}

const S = 22;

/** Grille isométrique cliquable : le sol en damier, puis les blocs posés. */
export function BuildGrid({ build, width, height, selected, onSelect, onAction }: Props) {
  const p = (x: number, y: number, z: number) => project(x, y, z, S);
  const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  // La hauteur affichée suit la construction : une case de marge au-dessus de la colonne la plus haute.
  const tallest = build.reduce((m, c) => Math.max(m, c.z + 1), 0);
  const [minX] = p(0, height, 0);
  const [maxX] = p(width, 0, 0);
  const [, minY] = p(0, 0, tallest + 1);
  const [, maxY] = p(width, height, 0);
  const viewBox = `${minX - 4} ${minY - 4} ${maxX - minX + 8} ${maxY - minY + 8}`;

  const activate = (x: number, y: number) => {
    onSelect(x, y);
    onAction(x, y);
  };
  const onKey = (e: KeyboardEvent<SVGGElement>, x: number, y: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate(x, y);
    }
  };

  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) tiles.push({ x, y });

  return (
    <svg className="build-grid" viewBox={viewBox} role="group" aria-label="Chantier">
      <PixelGrainDefs />
      {tiles.map(({ x, y }) => {
        const h = columnHeight(build, x, y);
        const isSel = selected?.x === x && selected?.y === y;
        return (
          <g
            key={`${x}-${y}`}
            role="button"
            tabIndex={0}
            aria-label={`Case ${x + 1}, ${y + 1}${h ? `, ${h} bloc${h > 1 ? 's' : ''}` : ''}`}
            aria-pressed={isSel}
            className={`tile${isSel ? ' selected' : ''}${(x + y) % 2 ? ' alt' : ''}`}
            onClick={() => activate(x, y)}
            onKeyDown={(e) => onKey(e, x, y)}
          >
            <polygon points={pts([p(x, y, 0), p(x + 1, y, 0), p(x + 1, y + 1, 0), p(x, y + 1, 0)])} />
          </g>
        );
      })}
      {/* De l'arrière vers l'avant, puis du bas vers le haut. */}
      {[...build]
        .sort((a, b) => a.x + a.y - (b.x + b.y) || a.z - b.z)
        .map((c) => {
          const def = BLOCKS[c.block];
          return (
            <g key={`${c.x}-${c.y}-${c.z}`} className="placed" onClick={() => activate(c.x, c.y)} aria-hidden="true">
              <Cube x={c.x} y={c.y} z={c.z} color={def.side} top={def.top} s={S} />
            </g>
          );
        })}
      {selected && (
        <polygon
          className="cursor"
          points={pts([
            p(selected.x, selected.y, columnHeight(build, selected.x, selected.y)),
            p(selected.x + 1, selected.y, columnHeight(build, selected.x, selected.y)),
            p(selected.x + 1, selected.y + 1, columnHeight(build, selected.x, selected.y)),
            p(selected.x, selected.y + 1, columnHeight(build, selected.x, selected.y)),
          ])}
        />
      )}
    </svg>
  );
}
