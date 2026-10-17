// La ligne de l'habitant (GD-20, point 4, lot L1 « Livrer ») : en tête du panneau de son lieu, son rôle et l'icône de
// son île, une phrase, un seul bouton. Une seule chose à la fois, dans cet ordre : sa commande prête (« Livre 3 blocs
// de terre au Phare. », « Livrer », la remise) ; ses révisions dues (« Reprendre », l'écran habituel des révisions, et
// « Plus tard » ; la révision jouée dans la scène viendra au lot L3) ; sa commande à qui il manque des blocs (« Il me
// faut 3 blocs de terre. C’est pour le potager. Joue une mission aux Filets. », « Y aller », vers le lieu de la
// ressource, ou vers le lieu de l'Escale où l'on assemble). Et la liste « Commandes » du monde ouvert, que l'accès direct
// ouvre : une ligne par commande ouverte, la même phrase, « Y aller ». Un bouton plein ne porte que la suggestion (GD-20 :
// « sans mise en avant tant qu'il n'est pas la suggestion ») : « Livrer » et « Y aller » restent simples sinon.
import { Icon } from '../../../components/Icon';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { frenchTypography } from '../../../components/math/RichText';
import { useTextes } from '../../../universes';
import { getBiome } from '../../biomes';
import { ReminderButtons, ReminderText, useResidentReminder } from '../../ResidentReminder';
import { Sheet } from '../../Sheet';
import { placeById, type PlaceId } from '../../world/continu/plan6e';
import { scenetteOf } from '../../world/continu/scenette';
import { useOpenPanel } from './PortPanels';
import type { HabitantGo, HabitantLine as Line } from './remiseOf';

interface Props {
  place: PlaceId;
  /** La ligne de la commande de l'habitant (`habitantLineOf`), s'il en a une arrivée. */
  line: Line | null;
  /** La commande que porte la suggestion, s'il y en a une : son bouton seul est plein. */
  suggested: string | null;
  onDeliver(commande: string): void;
  onGo(go: HabitantGo): void;
}

/** La ligne de l'habitant d'un lieu, ou rien. */
export function HabitantLine({ place, line, suggested, onDeliver, onGo }: Props) {
  const textes = useTextes();
  const biome = getBiome(placeById(place).island);
  const rappel = useResidentReminder(biome);
  if (!biome || (!line && !rappel)) return null;
  const role = scenetteOf(place).role;
  const head = (title: string) => (
    <p className="habitant-line-role">
      <Icon name={biome.icon} /> {title}
    </p>
  );
  if (line?.kind === 'livrer' || (line && !rappel)) {
    const text = frenchTypography(line.text);
    return (
      <div className="habitant-line" role="group" aria-labelledby={`habitant-${place}`}>
        {head(role)}
        <p id={`habitant-${place}`} className="habitant-line-text">
          <Syllabified text={text} />
        </p>
        <div className="habitant-line-actions">
          <SpeakButton text={text} label="Réécouter" compact />
          {line.kind === 'livrer' ? (
            <button type="button" className={`button habitant-line-go${line.commande === suggested ? ' primary' : ''}`} onClick={() => onDeliver(line.commande)}>
              <Icon name="paquet" /> {textes.commandes?.livrer ?? 'Livrer'}
            </button>
          ) : (
            // Ce qui manque n'est jamais la suggestion : « Y aller » reste simple.
            <button type="button" className="button habitant-line-go" aria-label={`Y aller : ${goName(line.go, textes.depart?.assemblage)}`} onClick={() => onGo(line.go)}>
              <Icon name="footprints" /> Y aller
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
        <ReminderButtons biome={biome} rappel={rappel} />
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
export function CommandsSheet({ lines, suggested, onGo, onClose }: { lines: readonly { place: PlaceId; line: Line }[]; suggested: string | null; onGo(go: HabitantGo): void; onClose(): void }) {
  useOpenPanel(onClose);
  const textes = useTextes();
  const titre = textes.commandes?.titre ?? 'Commandes';
  return (
    <Sheet id="panneau-commandes" className="requests-sheet open-world-commandes" titleId="commandes-titre" icon="scroll-text" title={titre} closeLabel={`Fermer : ${titre}`} autoFocusClose onClose={onClose}>
      {lines.length ? (
        <ul className="open-world-commandes-liste">
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
