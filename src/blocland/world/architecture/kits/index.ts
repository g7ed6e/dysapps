// Les kits d'architecture, un par archipel (./types.ts). Blocland n'en a pas : son rendu garde ses blocs posés.
import type { ArchipelagoId } from '../../archipels';
import { KIT_3E } from './3e';
import { KIT_4E } from './4e';
import { KIT_5E } from './5e';
import { KIT_6E } from './6e';
import type { Kit } from './types';

export type { CaseDuLieu, Famille, Kit, LieuDuKit, Role } from './types';
export { kitRempli, kitVide } from './types';

export const KITS: Record<ArchipelagoId, Kit> = { '6e': KIT_6E, '5e': KIT_5E, '4e': KIT_4E, '3e': KIT_3E };
