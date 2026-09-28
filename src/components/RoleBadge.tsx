import type { ReactElement } from 'react';
import type { Tier } from '../core/progress';

/**
 * L'insigne d'un rôle, dessiné par le code : un cadre et un pictogramme par rôle. Le cadre suit l'univers
 * (styles/roles.css, styles/blocland.css) : un hexagone dans Archipéo (l'architecture de l'archipel), un bloc vu de face
 * dans Blocland. Le pictogramme distingue le rôle sans la couleur ; le nom est écrit à côté sur la page Succès (dans la
 * barre du haut étroite, il est dit par le lecteur d'écran).
 */
const PICTOS: Record<Tier, ReactElement> = {
  // Une rose des vents : la branche nord pleine.
  explorateur: (
    <g className="role-picto">
      <circle cx="32" cy="33" r="13" fill="none" />
      <path d="M32 16 L36 33 L32 30 L28 33 Z" className="role-fill" />
      <path d="M32 50 L36 33 L32 36 L28 33 Z M15 33 L32 29 L49 33 L32 37 Z" fill="none" />
    </g>
  ),
  // Une carte pliée en trois, et sa route en pointillés.
  cartographe: (
    <g className="role-picto">
      <path d="M16 22 L25 19 L39 23 L48 20 L48 44 L39 47 L25 43 L16 46 Z M25 19 L25 43 M39 23 L39 47" fill="none" />
      <path d="M19 40 Q27 30 34 36 T45 26" fill="none" strokeDasharray="2 3" />
    </g>
  ),
  // Une arche de pierre et sa clé de voûte.
  batisseur: (
    <g className="role-picto">
      <path d="M17 48 L17 34 A15 15 0 0 1 47 34 L47 48 L40 48 L40 34 A8 8 0 0 0 24 34 L24 48 Z" fill="none" />
      <path d="M29 18 L35 18 L34 25 L30 25 Z" className="role-fill" />
    </g>
  ),
  // Un voilier sur une vague.
  navigateur: (
    <g className="role-picto">
      <path d="M33 15 L33 39 L46 39 Z" className="role-fill" />
      <path d="M30 20 L30 39 L20 39 Z" fill="none" />
      <path d="M18 42 L46 42 L42 48 L22 48 Z" fill="none" />
      <path d="M14 52 Q20 49 26 52 T38 52 T50 52" fill="none" />
    </g>
  ),
  // Un phare, sa lanterne et deux rayons.
  architecte: (
    <g className="role-picto">
      <path d="M27 48 L29 26 L35 26 L37 48 Z" fill="none" />
      <path d="M28 26 L28 20 L36 20 L36 26 M26 20 L38 20 L32 15 Z" className="role-fill" />
      <path d="M22 21 L14 18 M42 21 L50 18" fill="none" />
      <path d="M22 50 L42 50" fill="none" />
    </g>
  ),
};

export function RoleBadge({ tier, locked = false, className = '' }: { tier: Tier; locked?: boolean; className?: string }) {
  return (
    <svg className={`role-badge role-${tier}${locked ? ' locked' : ''} ${className}`.trim()} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path className="role-frame role-frame-hexagone" d="M32 3 L57 17.5 L57 46.5 L32 61 L7 46.5 L7 17.5 Z" />
      <rect className="role-frame role-frame-bloc" x="4" y="4" width="56" height="56" rx="4.5" />
      {PICTOS[tier]}
    </svg>
  );
}
