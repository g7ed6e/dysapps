import { Stars } from '../game/Stars';
import { starsFor } from '../core/stars';

/** Le record d'une mission du portail en étoiles, comme dans Blocland (« 88 % » est abstrait en 6e). */
export function RecordTag({ record, className = 'tag tag-ok' }: { record: number; className?: string }) {
  const stars = starsFor(record / 100);
  return (
    <span className={`${className} record-tag`}>
      Record <Stars count={stars} size="1rem" label={`Record : ${stars} étoile${stars > 1 ? 's' : ''} sur 3`} />
    </span>
  );
}
