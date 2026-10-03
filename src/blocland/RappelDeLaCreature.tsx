import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { rappelDeLaCreature, useTextes, type TextesUnivers } from '../univers';
import type { LangueVivante } from '../core/speech';
import { missionsJouables, type BiomeDef } from './biomes';
import { useBlocland } from './BloclandContext';
import { cheminDeRevision, revisionsDeLIle, usePlusTard } from './rappels';

/** Ce que la créature propose : la phrase écrite, la phrase lue, et le titre de la mission à part s'il est dans une autre langue. */
export interface Rappel {
  /** La phrase écrite, entière. */
  texte: string;
  /** La phrase lue à voix haute (sans le titre d'une mission de langue, sans « / » lu comme un symbole). */
  lu: string;
  /** Le titre d'une mission d'anglais ou de LV2, écrit sans syllabes colorées, dans sa langue ; ce qui l'entoure. */
  etranger: { titre: string; langue: LangueVivante; avant: string; apres: string } | null;
  /** L'adresse des révisions de l'île. */
  chemin: string;
}

/** Ce qui tient la place du titre dans la phrase, le temps de la découper (un caractère d'usage privé, jamais affiché). */
const MARQUE = '\uE000';
/** La place du titre, avec ses guillemets s'il en a, dans la phrase lue sans lui. */
const PLACE_LUE = new RegExp(`«?[\\s\\u00a0\\u202f]*${MARQUE}[\\s\\u00a0\\u202f]*»?`);

/** Un titre tel que la voix le lit : un « / » (« For / since ») devient une courte pause, pas le nom d'un symbole. */
export function titrePourLaVoix(titre: string): string {
  return titre.replace(/\s*\/\s*/g, ', ');
}

/**
 * La phrase de la créature pour une mission : en français, le titre écrit et lu ; dans une autre langue (anglais, LV2),
 * le titre écrit à part, sans syllabes colorées, et la phrase lue sans lui (« cette mission »), plutôt qu'une lecture
 * découpée entre deux voix.
 */
export function phraseDuRappel(textes: TextesUnivers, titre: string, langue: LangueVivante | undefined, chemin: string): Rappel {
  if (!langue) {
    const texte = frenchTypography(rappelDeLaCreature(textes, titre));
    return { texte, lu: frenchTypography(rappelDeLaCreature(textes, titrePourLaVoix(titre))), etranger: null, chemin };
  }
  const modele = frenchTypography(rappelDeLaCreature(textes, MARQUE));
  const [avant, apres = ''] = modele.split(MARQUE);
  return { texte: `${avant}${titre}${apres}`, lu: modele.replace(PLACE_LUE, 'cette mission'), etranger: { titre, langue, avant, apres }, chemin };
}

/**
 * Ce que la créature propose à l'arrivée sur son île, quand une mission de l'île a des questions à revoir aujourd'hui
 * (GD-4, étape 1) : l'icône de la notion, une phrase courte, « Réécouter », « Reprendre » et « Plus tard ». Rien sur
 * une date, un échec ni des blocs à gagner ; « Plus tard » ne coûte rien et la fait taire jusqu'à la visite suivante.
 */
export function useRappelDeLaCreature(biome: BiomeDef | undefined): Rappel | null {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const textes = useTextes();
  const { remises } = usePlusTard();
  if (!biome || remises.has(biome.id)) return null;
  const dues = revisionsDeLIle(state.spaced, state.world.links, biome.id, settings.lv2);
  if (!dues.length) return null;
  const mission = missionsJouables(biome, settings.lv2).find((m) => m.id === dues[0].type);
  const langue: LangueVivante | undefined = mission?.lv2 ?? (biome.subject === 'english' ? 'en' : undefined);
  return phraseDuRappel(textes, mission?.title ?? dues[0].label, langue, cheminDeRevision(dues[0]));
}

interface Props {
  biome: BiomeDef;
  rappel: Rappel;
  /** Après « Plus tard » : la page rend le focus (au titre de l'île) et le dit. */
  onRemis?: () => void;
  /**
   * Dans la fiche de la créature (lot 2 de « Toucher le monde ») : son nom est le titre de la fiche, et l'Écouter de la
   * fiche relit tout ; la plaque ne les répète pas.
   */
  dansUneFiche?: boolean;
}

export function RappelDeLaCreature({ biome, rappel, onRemis, dansUneFiche = false }: Props) {
  const { remettre } = usePlusTard();
  const { etranger } = rappel;
  return (
    <div className={`creature-rappel${dansUneFiche ? ' dans-une-fiche' : ''}`} role="group" aria-labelledby={`rappel-${biome.id}`}>
      <span className="creature-rappel-icone" aria-hidden="true">
        <Icon name={biome.icon} size="1.8rem" />
      </span>
      <p id={`rappel-${biome.id}`} className="creature-rappel-texte">
        {!dansUneFiche && <strong>{biome.creature.name} : </strong>}
        {etranger ? (
          <>
            <Syllabified text={etranger.avant} />
            <span lang={etranger.langue}>{etranger.titre}</span>
            <Syllabified text={etranger.apres} />
          </>
        ) : (
          <Syllabified text={rappel.texte} />
        )}
      </p>
      <div className="creature-rappel-actions">
        {/* Le même mot que pour l'accueil, juste au-dessus : « Réécouter ». */}
        {!dansUneFiche && <SpeakButton text={rappel.lu} label="Réécouter" compact />}
        <Link to={rappel.chemin} className="button primary">
          <Icon name="replay" /> Reprendre
        </Link>
        <button
          type="button"
          className="button"
          onClick={() => {
            remettre(biome.id);
            onRemis?.();
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

/** Ce qui se dit après « Plus tard », dans une région montée vide d'avance (les lecteurs d'écran l'annoncent). */
export const PLUS_TARD_DIT = 'D’accord, plus tard.';

export function PlusTardDit({ dit }: { dit: boolean }) {
  return (
    <p className="creature-rappel-remis" role="status" aria-live="polite">
      {dit ? <Syllabified text={PLUS_TARD_DIT} /> : ''}
    </p>
  );
}
