import { Syllabified } from '../components/Syllabified';
import type { Village } from './engine';
import type { ArchipelagoId } from './world/archipelago';
import { villageStage } from './world/villageStage';
import { useTextes } from '../univers';

/**
 * L'état du village d'un archipel, en HTML : son nom et son rang (« Le village : Reconstruction, 3 sur 5 »), une jauge
 * à cinq crans doublée du libellé (jamais la couleur seule), et ce qu'il faut pour la suite.
 */
export function VillageStageLine({
  village,
  archipelago,
  className = '',
  withNext = true,
}: {
  village: Pick<Village, 'plans' | 'bridges'>;
  archipelago: ArchipelagoId;
  className?: string;
  /** Dire ce qu'il faut pour la suite (le menu s'en passe : « Reprendre l'aventure » le dit déjà). */
  withNext?: boolean;
}) {
  const stage = villageStage(village, archipelago, useTextes().archipels);
  return (
    <div className={`village-stage${className ? ` ${className}` : ''}`}>
      <p>
        <span className="village-notches" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= stage.rank ? 'on' : undefined} />
          ))}
        </span>
        <strong>Le village :</strong> {stage.name}, {stage.rank} sur 5
      </p>
      {withNext && stage.next && (
        <p className="village-next">
          <Syllabified text={`Pour la suite : ${stage.next}`} />
        </p>
      )}
    </div>
  );
}
