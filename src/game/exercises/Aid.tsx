import { createElement } from 'react';
import type { Lang } from '../../core/speech';
import { AID_COMPONENTS, type AidData } from './maths';

/**
 * Redessine une aide visuelle décrite en données (écran à règle, histoire à écouter). La langue de l'exercice va à la carte
 * de règle seule : elle y fait lire le lexique dans la voix de la langue.
 */
export function Aid({ aid, lang }: { aid: AidData; lang?: Lang }) {
  const component = AID_COMPONENTS[aid.kind];
  const props = aid.kind === 'rule-card' && lang ? { ...aid.props, lang } : aid.props;
  return component ? createElement(component as (p: Record<string, unknown>) => ReturnType<typeof createElement>, props) : null;
}
