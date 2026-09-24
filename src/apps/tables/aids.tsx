// Aides visuelles pour la dyscalculie : on voit les quantités au lieu de les compter une à une.
import { formatNumber } from './format';

/** Grille de `rows` rangées de `cols` points, regroupés par 5 (lecture « en un coup d'œil »). */
export function DotArray({ rows, cols }: { rows: number; cols: number }) {
  return (
    <figure className="dot-array">
      <div role="img" aria-label={`${rows} rangées de ${cols} points`}>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className={`dot-row${r === 5 ? ' gap-top' : ''} ${Math.floor(r / 5) % 2 ? 'alt' : ''}`}>
            {Array.from({ length: cols }, (_, c) => (
              <span key={c} className={`dot${c === 5 ? ' gap-left' : ''}`} />
            ))}
          </div>
        ))}
      </div>
      <figcaption>
        {rows} rangées de {cols}
      </figcaption>
    </figure>
  );
}

/** Boîte de 10 : `filled` cases pleines, les cases vides forment le complément. */
export function TenFrame({ filled }: { filled: number }) {
  return (
    <figure className="ten-frame">
      <div role="img" aria-label={`${filled} cases pleines sur 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={`cell${i < filled ? ' filled' : ''}`} />
        ))}
      </div>
      <figcaption>Compte les cases vides</figcaption>
    </figure>
  );
}

/** Droite numérique « par bonds » : from → étapes → to, chaque bond est annoté. */
export function NumberLineJumps({ points }: { points: number[] }) {
  // Schéma « par bonds », pas à l'échelle : des points régulièrement espacés restent lisibles
  // même quand un bond est tout petit (15 → 20 → 100).
  const x = (n: number) => 30 + (points.indexOf(n) / (points.length - 1)) * 240;
  const label = points
    .slice(1)
    .map((p, i) => `de ${points[i]} à ${p} : plus ${p - points[i]}`)
    .join(', ');
  return (
    <figure className="number-line">
      <svg viewBox="0 0 300 100" role="img" aria-label={`Droite numérique, ${label}`}>
        <line x1="10" y1="70" x2="290" y2="70" stroke="currentColor" strokeWidth="3" />
        {points.slice(1).map((p, i) => {
          const a = x(points[i]);
          const b = x(p);
          const mid = (a + b) / 2;
          return (
            <g key={p}>
              <path d={`M ${a} 66 Q ${mid} ${20} ${b} 66`} fill="none" stroke="var(--violet)" strokeWidth="3" />
              <text x={mid} y="28" textAnchor="middle" className="jump-label">
                +{formatNumber(p - points[i])}
              </text>
            </g>
          );
        })}
        {points.map((p) => (
          <g key={p}>
            <line x1={x(p)} y1="62" x2={x(p)} y2="78" stroke="currentColor" strokeWidth="3" />
            <text x={x(p)} y="96" textAnchor="middle" className="tick-label">
              {formatNumber(p)}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

const PLACES = [
  { short: 'CM', long: 'centaines de mille' },
  { short: 'DM', long: 'dizaines de mille' },
  { short: 'UM', long: 'unités de mille' },
  { short: 'C', long: 'centaines' },
  { short: 'D', long: 'dizaines' },
  { short: 'U', long: 'unités' },
];

/** Tableau de numération : le nombre de départ, puis le décalage de `shift` rangs (+ vers la gauche). */
export function PlaceValueTable({ value, shift }: { value: number; shift: number }) {
  const digits = String(value).padStart(PLACES.length, ' ').split('');
  const direction = shift > 0 ? 'vers la gauche' : 'vers la droite';
  const n = Math.abs(shift);
  return (
    <figure className="place-table">
      <table>
        <caption className="visually-hidden">Tableau de numération</caption>
        <thead>
          <tr>
            {PLACES.map((p) => (
              <th key={p.short} scope="col">
                <abbr title={p.long}>{p.short}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {digits.map((d, i) => (
              <td key={i}>{d.trim()}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <figcaption>
        Chaque chiffre se déplace de {n} rang{n > 1 ? 's' : ''} {direction}
        {shift > 0 ? ' ; on complète avec des 0.' : '.'}
      </figcaption>
    </figure>
  );
}
