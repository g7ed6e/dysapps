import { Icon } from '../components/Icon';

/** Trois étoiles, allumées selon le score (1 = terminé, 2 = ≥ 70 %, 3 = ≥ 90 %). */
export function Stars({ count, size = '1.4rem', label }: { count: number; size?: string; label?: string }) {
  return (
    <span className="stars" role="img" aria-label={label ?? `${count} étoile${count > 1 ? 's' : ''} sur 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`star${i <= count ? ' lit' : ''}`}>
          <Icon name="star" size={size} />
        </span>
      ))}
    </span>
  );
}
