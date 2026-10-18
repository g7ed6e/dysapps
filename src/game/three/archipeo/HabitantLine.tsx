// La ligne de l'habitant (GD-20, point 4, lot L1 « Livrer ») : en tête du panneau de son lieu, son rôle et l'icône de
// son île, une phrase, un seul bouton. Une seule chose à la fois, dans cet ordre : sa commande prête (« Livre 3 blocs
// de terre au Phare. », « Livrer », la remise) ; ses révisions dues (« On revoit quelques questions ensemble. »,
// « Reprendre », la révision jouée dans la scène du lieu au lot L3, et « Plus tard ») ; sa commande à qui il manque des blocs (« Il me
// faut 3 blocs de terre. C’est pour le potager. Joue une mission aux Filets. », « Y aller », vers le lieu de la
// ressource, ou vers le lieu de l'Escale où l'on assemble). Et la liste « Commandes » du monde ouvert, que l'accès direct
// ouvre : une ligne par commande ouverte, la même phrase, « Y aller ». Un bouton plein ne porte que la suggestion (GD-20 :
// « sans mise en avant tant qu'il n'est pas la suggestion ») : « Livrer » et « Y aller » restent simples sinon ;
// « Reprendre » toujours (la suggestion ne porte jamais les révisions).
// Lot L2, l'entraide : son étape faite d'un geste (« Donne 2 blocs de bois aux Quais. », « Donner » ; « Apporte la
// lanterne au Phare. », « Apporter ») passe juste après la commande prête, et ce qui manque pour donner en dernier ;
// en tête de la liste « Commandes », son signe (l'objet, une pastille par étape), sa phrase et « Y aller ».
import { Icon } from '../../../components/Icon';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { frenchTypography } from '../../../components/math/RichText';
import { useTextes } from '../../../universes';
import { getBiome } from '../../biomes';
import { ReminderButtons, ReminderText, useResidentReminder } from '../../ResidentReminder';
import { Sheet } from '../../Sheet';
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import { REVISION_PHRASES } from '../../world/continu/remise';
import { scenetteOf } from '../../world/continu/scenette';
import { useOpenPanel } from './PortPanels';
import { StoryBadge } from '../../Stories';
import { entraideIcon, type EntraideLine, type HabitantGo, type HabitantLine as Line, type entraideListLine } from './remiseOf';

interface Props {
  place: PlaceId;
  /** La ligne de la commande de l'habitant (`habitantLineOf`), s'il en a une arrivée. */
  line: Line | null;
  /** La ligne d'entraide de l'habitant (`entraideLineOf`), si l'étape en cours se fait chez lui d'un geste. */
  entraide?: EntraideLine | null;
  /** La commande ou la quête que porte la suggestion, s'il y en a une : son bouton seul est plein. */
  suggested: string | null;
  onDeliver(commande: string): void;
  /** « Donner », « Apporter » : la remise de l'étape d'entraide. */
  onEntraide?(story: string): void;
  /** « Reprendre » : la révision de ce lieu jouée dans sa scène (GD-20, point 4, lot L3) ; sans lui, l'écran habituel. */
  onReprendre?(): void;
  /** La révision se prépare (ses exercices se chargent) : « Reprendre » est occupé et ne se touche pas deux fois. */
  reprendreBusy?: boolean;
  onGo(go: HabitantGo): void;
}

/** Ce que la ligne montre : une phrase, et son seul bouton. */
type Shown =
  | { kind: 'livrer'; id: string; text: string }
  | { kind: 'donner' | 'apporter'; id: string; text: string }
  | { kind: 'manque'; id: string; text: string; go: HabitantGo };

/**
 * La ligne de l'habitant d'un lieu, ou rien. Une chose à la fois, dans cet ordre : la commande prête ; l'étape
 * d'entraide qui se fait d'un geste (« Donner », « Apporter ») ; les révisions dues ; ce qui manque à la commande ; ce
 * qui manque pour donner.
 */
export function HabitantLine({ place, line, entraide = null, suggested, onDeliver, onEntraide, onReprendre, reprendreBusy = false, onGo }: Props) {
  const textes = useTextes();
  const biome = getBiome(placeById(place).island);
  const due = useResidentReminder(biome);
  // Le rappel du monde ouvert ne nomme aucune mission (le passage peut commencer par une autre) : sa phrase, écrite et
  // lue (monde-ouvert.md, « La révision », « rappel ») ; la grille et Blocland gardent la leur.
  const reminder = frenchTypography(REVISION_PHRASES.reminder);
  const rappel = due ? { ...due, texte: reminder, lu: reminder, etranger: null } : null;
  if (!biome || (!line && !entraide && !rappel)) return null;
  const role = scenetteOf(place).role;
  const head = (title: string) => (
    <p className="habitant-line-role">
      <Icon name={biome.icon} /> {title}
    </p>
  );
  const act = entraide && entraide.kind !== 'manque' ? entraide : null;
  const shown: Shown | null =
    line?.kind === 'livrer'
      ? { kind: 'livrer', id: line.commande, text: line.text }
      : act
        ? { kind: act.kind, id: act.story, text: act.text }
        : rappel
          ? null
          : line
            ? { kind: 'manque', id: line.commande, text: line.text, go: line.go }
            : entraide?.kind === 'manque'
              ? { kind: 'manque', id: entraide.story, text: entraide.text, go: entraide.go }
              : null;
  if (shown) {
    const text = frenchTypography(shown.text);
    const primary = shown.id === suggested ? ' primary' : '';
    const mots = textes.quetes;
    return (
      <div className="habitant-line" role="group" aria-labelledby={`habitant-${place}`}>
        {head(role)}
        <p id={`habitant-${place}`} className="habitant-line-text">
          <Syllabified text={text} />
        </p>
        <div className="habitant-line-actions">
          <SpeakButton text={text} label="Réécouter" compact />
          {shown.kind === 'livrer' ? (
            <button type="button" className={`button habitant-line-go${primary}`} onClick={() => onDeliver(shown.id)}>
              <Icon name="paquet" /> {textes.commandes?.livrer ?? 'Livrer'}
            </button>
          ) : shown.kind === 'manque' ? (
            // Ce qui manque n'est jamais la suggestion : « Y aller » reste simple.
            <button type="button" className="button habitant-line-go" aria-label={`Y aller : ${goName(shown.go, textes.depart?.assemblage)}`} onClick={() => onGo(shown.go)}>
              <Icon name="footprints" /> Y aller
            </button>
          ) : (
            // « Donner » : le paquet ; « Apporter » : la main qui tient l'objet (le même signe que « tenu » du geste
            // « ranger »), pour distinguer les deux gestes sans lire (avis du référent dys, lots L2 et L3).
            <button type="button" className={`button habitant-line-go${primary}`} onClick={() => onEntraide?.(shown.id)}>
              <Icon name={shown.kind === 'donner' ? 'paquet' : 'main'} /> {shown.kind === 'donner' ? (mots?.donner ?? 'Donner') : (mots?.apporter ?? 'Apporter')}
            </button>
          )}
        </div>
      </div>
    );
  }
  if (!rappel) return null;
  return (
    <div className="habitant-line" role="group" aria-labelledby={`habitant-${place}`}>
      {head(role)}
      <p id={`habitant-${place}`} className="habitant-line-text">
        <ReminderText rappel={rappel} />
      </p>
      <div className="habitant-line-actions">
        <SpeakButton text={rappel.lu} label="Réécouter" compact />
        {/* Les révisions ne sont jamais la suggestion du monde ouvert : « Reprendre » reste simple (relecture du lot L1). */}
        <ReminderButtons biome={biome} rappel={rappel} primary={false} onReprendre={onReprendre} busy={reprendreBusy} />
      </div>
    </div>
  );
}

/** Le nom, entier, du lieu où mène « Y aller » : un lieu, ou le lieu d'assemblage de l'Escale. */
const goName = (go: HabitantGo, assembly = ''): string => ('port' in go ? assembly : placeById(go.place).name);

/**
 * La liste « Commandes » du monde ouvert : les commandes ouvertes, dans l'ordre d'arrivée, chacune sa phrase et « Y
 * aller » ; seul celui de la commande que porte la suggestion (`suggested`) est plein.
 */
export function CommandsSheet({
  lines,
  entraide = null,
  suggested,
  onGo,
  onClose,
}: {
  lines: readonly { place: PlaceId; line: Line }[];
  /** L'entraide ouverte (`entraideListLine`), en tête : son signe (l'objet, une pastille par étape), sa phrase, « Y aller ». */
  entraide?: ReturnType<typeof entraideListLine>;
  suggested: string | null;
  onGo(go: HabitantGo): void;
  onClose(): void;
}) {
  useOpenPanel(onClose);
  const textes = useTextes();
  const titre = textes.commandes?.titre ?? 'Commandes';
  const quete = entraide && frenchTypography(entraide.text);
  return (
    <Sheet id="panneau-commandes" className="requests-sheet open-world-commandes" titleId="commandes-titre" icon="scroll-text" title={titre} closeLabel={`Fermer : ${titre}`} autoFocusClose onClose={onClose}>
      {lines.length || entraide ? (
        <ul className="open-world-commandes-liste">
          {entraide && quete && (
            <li key={entraide.story.id} className="habitant-line open-world-entraide">
              <p className="habitant-line-role">
                <StoryBadge story={entraide.story} index={entraide.index} icon={entraideIcon(entraide.story.item)} /> {entraide.role}
              </p>
              <p className="habitant-line-text">
                <Syllabified text={quete} />
              </p>
              <div className="habitant-line-actions">
                <SpeakButton text={quete} label="Réécouter" compact />
                <button type="button" className={`button${entraide.story.id === suggested ? ' primary' : ''}`} aria-label={`Y aller : ${goName(entraide.go, textes.depart?.assemblage)}`} onClick={() => onGo(entraide.go)}>
                  <Icon name="footprints" /> Y aller
                </button>
              </div>
            </li>
          )}
          {lines.map(({ place, line }) => {
            const text = frenchTypography(line.text);
            const go: HabitantGo = line.kind === 'livrer' ? { place } : line.go;
            return (
              <li key={line.commande} className={`habitant-line${line.kind === 'livrer' ? ' prete' : ''}`}>
                <p className="habitant-line-role">
                  <Icon name={getBiome(placeById(place).island)?.icon ?? 'map'} /> {line.role}
                </p>
                <p className="habitant-line-text">
                  <Syllabified text={text} />
                </p>
                <div className="habitant-line-actions">
                  <SpeakButton text={text} label="Réécouter" compact />
                  <button type="button" className={`button${line.commande === suggested ? ' primary' : ''}`} aria-label={`Y aller : ${goName(go, textes.depart?.assemblage)}`} onClick={() => onGo(go)}>
                    <Icon name="footprints" /> Y aller
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="world-requests">Aucune commande pour l’instant.</p>
      )}
    </Sheet>
  );
}
