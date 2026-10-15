// Les panneaux de l'Escale, le lieu de départ du monde continu (GD-20, lot 2 ; consultant UX UI) : les écrans de la
// grille, réutilisés (`SubjectApps` en lignes, `TrophySheet`, `AssemblageBody`, `Sheet`), et un seul écran nouveau, la
// fiche du Port : cinq lignes (les trois matières, les succès, l'assemblage), chacune avec « Y aller », à la même place.
// Un panneau à la fois, en bas sur tablette (le Port reste visible au-dessus), en colonne à gauche sur un écran bas (la
// porte reste visible à droite) ; la croix, Échap, et rien n'est perdu. Aucun lien n'y sort du monde.
import { useEffect } from 'react';
import { SUBJECTS } from '../../../apps/registry';
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

/** Un endroit de l'Escale lu dans l'adresse de retour (`?porte=maths`), s'il en est un. */
export function portFromParam(value: string | null): Exclude<PortSpot, 'quai'> | null {
  return value === 'succes' || value === 'chantier' || PORT_SUBJECTS.includes(value as PortSubject) ? (value as Exclude<PortSpot, 'quai'>) : null;
}

interface Props {
  panel: PortPanel;
  names: PortNames;
  /** « Y aller » d'une ligne de la fiche : Kéo y va d'un coup, son panneau s'ouvre à l'arrivée. */
  onGo(spot: Exclude<PortSpot, 'quai'>): void;
  onClose(): void;
}

/** Le panneau ouvert de l'Escale. */
export function PortPanels({ panel, names, onGo, onClose }: Props) {
  // Échap ferme le panneau, comme la croix.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (panel === 'fiche') return <PortSheet names={names} onGo={onGo} onClose={onClose} />;
  if (panel === 'succes') return <TrophySheet title={names.succes} stayInWorld onClose={onClose} />;
  if (panel === 'chantier')
    return (
      <Sheet id="panneau-assemblage" className="assemblage-sheet" titleId="assemblage-titre" icon="hammer" title={names.assemblage} subtitle={names.nom} onClose={onClose}>
        <AssemblageBody back={portReturn('chantier')} stayInWorld />
      </Sheet>
    );
  return <DoorSheet subject={panel} school={names.ecole} onClose={onClose} />;
}

/**
 * Une porte de l'école : la matière, puis ses missions en lignes (icône, titre, Nouveau ou record), sans les trois
 * cartes de porte (la porte est déjà choisie par le toucher), ni l'accueil, ni « Les îles de… » (il sortirait du monde).
 */
function DoorSheet({ subject, school, onClose }: { subject: PortSubject; school: string; onClose(): void }) {
  return (
    <Sheet id="panneau-porte" className={`school-sheet port-door-sheet subject-${subject}`} titleId="porte-titre" icon={SUBJECTS[subject].icon} title={SUBJECTS[subject].title} subtitle={school} onClose={onClose}>
      <SubjectApps subject={subject} from={portReturn(subject)} compact />
    </Sheet>
  );
}

/** Les cinq lignes de la fiche : leur endroit, leur icône, leur nom d'un ou deux mots. */
const ROWS: readonly { spot: Exclude<PortSpot, 'quai'>; icon: AnyIconName; name: string }[] = [
  ...PORT_SUBJECTS.map((s) => ({ spot: s, icon: SUBJECTS[s].icon, name: SUBJECTS[s].title })),
  { spot: 'succes', icon: 'trophy', name: 'Succès' },
  { spot: 'chantier', icon: 'hammer', name: 'Assembler' },
];

/** La fiche du Port : cinq lignes, chacune « Y aller » à droite, sans compteur ni mise en avant. */
function PortSheet({ names, onGo, onClose }: { names: PortNames; onGo: Props['onGo']; onClose(): void }) {
  return (
    <Sheet id="panneau-escale" className="port-sheet" titleId="escale-titre" icon="ancre" title={names.nom} onClose={onClose} autoFocusClose>
      <ul className="port-rows">
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
