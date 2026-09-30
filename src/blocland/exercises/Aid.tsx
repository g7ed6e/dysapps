import { createElement } from 'react';
import { AID_COMPONENTS, type AidData } from './maths';

/** Redessine une aide visuelle décrite en données (écran à règle, histoire à écouter). */
export function Aid({ aid }: { aid: AidData }) {
  const component = AID_COMPONENTS[aid.kind];
  return component ? createElement(component as (p: Record<string, unknown>) => ReturnType<typeof createElement>, aid.props) : null;
}
