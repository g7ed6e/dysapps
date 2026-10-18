// Les panneaux de l'Escale, le lieu de départ du monde continu (GD-20, lot 2 ; consultant UX UI) : les écrans de la
// grille, réutilisés (`SubjectApps` en lignes, `TrophySheet`, `AssemblageBody`, `Sheet`), et un seul écran nouveau, la
// fiche du Port : cinq lignes (les trois matières, les succès, l'assemblage), chacune avec « Y aller », à la même place.
// Un panneau à la fois, en bas sur tablette (le Port reste visible au-dessus), en colonne à gauche sur un écran bas (la
// porte reste visible à droite) ; la croix, Échap, et rien n'est perdu. Aucun lien n'y sort du monde.
import { useEffect, type ReactNode } from 'react';
import { SUBJECTS, getApp } from '../../../apps/registry';
import { useHoldCelebrations } from '../../../components/Celebrations';
import { Icon, type AnyIconName } from '../../../components/Icon';
import { SubjectApps } from '../../../components/SubjectApps';
import { AssemblageBody } from '../../Assembly';
import { Sheet } from '../../Sheet';
import { TrophySheet } from '../../TrophySheet';
import { PORT_SUBJECTS, type PortSpot, type PortSubject } from '../../world/continu/plan6e';

/** Un panneau de l'Escale : sa fiche, une porte de l'école, la galerie des succès, le lieu d'assemblage. */
export type PortPanel = 'fiche' | Exclude<PortSpot, 'quai'>;

/** Les noms du lieu de départ dans l'univers (`textes.depart`). */
interface PortNames {
  nom: string;
  ecole: string;
  succes: string;
  assemblage: string;
}

/** L'adresse où ramène une mission jouée depuis une porte, ou la question d'assemblage : le monde continu, à cet endroit. */
export const portReturn = (spot: Exclude<PortSpot, 'quai'>) => `/adventure?porte=${spot}`;

/**
 * D'où ramène « Ma dernière mission » (accès direct), quand c'est une mission de l'école (le portail d'une matière) :
 * sa porte, à l'Escale ; sinon rien (son retour habituel).
 */
export function portResume(path: string): string | undefined {
  const subject = path.startsWith('/app/') ? getApp(path.slice('/app/'.length))?.subject : undefined;
  return subject && PORT_SUBJECTS.includes(subject as PortSubject) ? portReturn(subject as PortSubject) : undefined;
}

/** Un endroit de l'Escale lu dans l'adresse de retour (`?porte=maths`), s'il en est un. */
export function portFromParam(value: string | null): Exclude<PortSpot, 'quai'> | null {
  return value === 'succes' || value === 'chantier' || PORT_SUBJECTS.includes(value as PortSubject) ? (value as Exclude<PortSpot, 'quai'>) : null;
}

interface Props {
  panel: PortPanel;
  names: PortNames;
  /** « Y aller » d'une ligne de la fiche : Kéo y va d'un coup, son panneau s'ouvre à l'arrivée. */
  onGo(spot: Exclude<PortSpot, 'quai'>): void;
  /**
   * La Nef de l'Escale (GD-21), tant qu'elle n'est pas partie : une ligne de plus, en tête, qui ouvre sa fiche, toujours au même
   * endroit, même quand la Nef est au bord de l'image ou cachée (relecture du référent dys et du consultant UX UI).
   */
  onNef?(): void;
  onClose(): void;
}

/**
 * Ce que fait tout panneau ouvert du monde continu (l'Escale, un lieu) : il retient les célébrations (un bandeau ne tombe
 * pas sur la liste qu'on lit ; rendues à la fermeture), et Échap le ferme, comme la croix.
 */
export function useOpenPanel(onClose: () => void): void {
  useHoldCelebrations(true);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

/** Le panneau ouvert de l'Escale. */
export function PortPanels({ panel, names, onGo, onNef, onClose }: Props) {
  useOpenPanel(onClose);
  if (panel === 'fiche') return <PortSheet names={names} onGo={onGo} onNef={onNef} onClose={onClose} />;
  if (panel === 'succes') return <TrophySheet title={names.succes} stayInWorld onClose={onClose} />;
  if (panel === 'chantier')
    return (
      // Sans sous-titre (le Port se voit au-dessus) : « Assembler » se voit sans défiler sur tablette.
      <Sheet id="panneau-assemblage" className="assemblage-sheet" titleId="assemblage-titre" icon="hammer" title={names.assemblage} onClose={onClose}>
        <AssemblageBody back={portReturn('chantier')} stayInWorld />
      </Sheet>
    );
  return <DoorSheet subject={panel} onClose={onClose} />;
}

/**
 * Un panneau de missions en lignes (icône, titre, étiquette ; `MissionRows`), sans sous-titre (le lieu se voit à côté) :
 * celui d'une porte de l'école (GD-20, lot 2), généralisé au panneau d'un lieu (point 8, ./PlacePanel.tsx).
 */
export function MissionSheet({ id, className, icon, title, onClose, children }: { id: string; className: string; icon: AnyIconName; title: string; onClose(): void; children: ReactNode }) {
  return (
    <Sheet id={id} className={`school-sheet port-door-sheet ${className}`} titleId={`${id}-titre`} icon={icon} title={title} onClose={onClose}>
      {children}
    </Sheet>
  );
}

/**
 * Une porte de l'école : la matière, puis ses missions en lignes (icône, titre, Nouveau ou record), sans les trois cartes
 * de porte (la porte est déjà choisie par le toucher), ni l'accueil, ni « Les îles de… » (il sortirait du monde).
 */
function DoorSheet({ subject, onClose }: { subject: PortSubject; onClose(): void }) {
  return (
    <MissionSheet id="panneau-porte" className={`subject-${subject}`} icon={SUBJECTS[subject].icon} title={SUBJECTS[subject].title} onClose={onClose}>
      <SubjectApps subject={subject} from={portReturn(subject)} compact />
    </MissionSheet>
  );
}

/** Les cinq lignes de la fiche : leur endroit, leur icône, leur nom d'un ou deux mots. */
const ROWS: readonly { spot: Exclude<PortSpot, 'quai'>; icon: AnyIconName; name: string }[] = [
  ...PORT_SUBJECTS.map((s) => ({ spot: s, icon: SUBJECTS[s].icon, name: SUBJECTS[s].title })),
  { spot: 'succes', icon: 'trophy', name: 'Succès' },
  { spot: 'chantier', icon: 'hammer', name: 'Assembler' },
];

/** La fiche du Port : cinq lignes (six avec la Nef), chacune « Y aller » à droite, sans compteur ni mise en avant. */
function PortSheet({ names, onGo, onNef, onClose }: { names: PortNames; onGo: Props['onGo']; onNef?: Props['onNef']; onClose(): void }) {
  return (
    <Sheet id="panneau-escale" className="port-sheet" titleId="escale-titre" icon="ancre" title={names.nom} onClose={onClose} autoFocusClose>
      <ul className="port-rows">
        {/* La Nef d'abord : visible sans défiler, même au plus grand texte (consultant UX UI). */}
        {onNef && (
          <li className="port-row">
            <span className="port-row-name">
              <Icon name="ship" /> La Nef
            </span>
            <button type="button" className="button port-row-go" aria-label="Y aller : La Nef" onClick={onNef}>
              <Icon name="footprints" /> Y aller
            </button>
          </li>
        )}
        {ROWS.map((r) => (
          <li key={r.spot} className="port-row">
            <span className="port-row-name">
              <Icon name={r.icon} /> {r.name}
            </span>
            <button type="button" className="button port-row-go" aria-label={`Y aller : ${r.name}`} onClick={() => onGo(r.spot)}>
              <Icon name="footprints" /> Y aller
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
