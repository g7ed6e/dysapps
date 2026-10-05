// L'école du village : sur l'île de l'école de chaque archipel, un bâtiment à trois portes (Français, Maths, Anglais).
// Derrière chaque porte, les missions du portail de la matière ; chacune finie rapporte des blocs de l'île de l'école.
// Un panneau dans le monde en 3D, une page en vue simple : le même contenu.
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SUBJECTS, type Subject } from '../apps/registry';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { SubjectApps } from '../components/SubjectApps';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings, useUnivers } from '../core/SettingsContext';
import { BLOCKS, getBiome, ofBlock, type BiomeDef } from './biomes';
import { useBlocland } from './BloclandContext';
import { BlockIcon } from './Voxel';
import { archipelagoOf } from './world/archipelago';
import { UNIVERS } from '../core/universe';
import { Sheet } from './Sheet';

export const SCHOOL_TITLE = 'École du village';
/** L'adresse de l'école (dans le monde en 3D : son panneau ; en vue simple : sa page). */
export const SCHOOL_PATH = '/adventure/school';
const DOORS: Subject[] = ['french', 'maths', 'english'];

/** L'île de l'école de l'archipel où se tient le bonhomme. */
export function useSchoolIsland(): BiomeDef {
  const { state } = useBlocland();
  return getBiome(archipelagoOf(state.world.place ?? 'french-6e-phonology').school)!;
}

function greetingOf(island: BiomeDef): string {
  return `Bienvenue à l’école ! Trois portes, une par matière : choisis-en une. Chaque mission finie ici te donne des blocs ${ofBlock(island.block)} pour le village, plus si tu as des étoiles.`;
}

/** Les trois portes, ou les missions de la porte choisie (`?door=maths` : on y revient après une mission). */
function SchoolBody() {
  const island = useSchoolIsland();
  const univers = useUnivers();
  const { settings, speak } = useSettings();
  const [params, setParams] = useSearchParams();
  const asked = params.get('door');
  const door = DOORS.find((d) => d === asked) ?? null;
  const greeting = greetingOf(island);
  const block = BLOCKS[island.block];

  // Le texte visible est lu à voix haute, une fois à l'entrée ; l'accueil entier est sur « Écouter », dans le pli.
  const reward = `Chaque mission ici donne des blocs ${ofBlock(island.block)}.`;
  useEffect(() => {
    if (settings.autoRead && !door) speak(frenchTypography(reward));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="school">
      {/* Une ligne pour l'essentiel ; l'accueil de la créature est écrit dans un pli, avec Écouter : les portes se voient tout de suite. */}
      <p className="school-reward">
        <BlockIcon top={block.top} side={block.side} size={28} /> {reward}
      </p>
      <details className="sheet-more">
        <summary>En savoir plus</summary>
        <p>
          <strong>{island.creature.name} :</strong> <Syllabified text={greeting} />
          <SpeakButton text={greeting} label="Écouter" compact />
        </p>
      </details>
      {door ? (
        <section aria-labelledby="ecole-porte">
          <div className="school-door-head">
            <h3 id="ecole-porte" className={`island-sheet-heading title-${door}`}>
              <Icon name={SUBJECTS[door].icon} /> {SUBJECTS[door].title}
            </h3>
            <button type="button" className="button" onClick={() => setParams({})}>
              <Icon name="back" /> Les trois portes
            </button>
          </div>
          <SubjectApps subject={door} from={`${SCHOOL_PATH}?door=${door}`} />
          <p className="school-more">
            <Link to={`/matiere/${door}`}>
              <Icon name="map" /> Les îles de {SUBJECTS[door].title.toLowerCase()} dans {UNIVERS[univers].nom}
            </Link>
          </p>
        </section>
      ) : (
        <ul className="grid apps school-doors" aria-label="Les trois portes de l’école">
          {DOORS.map((d) => (
            <li key={d}>
              <button type="button" className={`panel app-card school-door subject-${d}`} onClick={() => setParams({ door: d })}>
                <span className="app-icon">
                  <Icon name={SUBJECTS[d].icon} size="1.8rem" />
                </span>
                <span className="app-title">{SUBJECTS[d].title}</span>
                <span className="app-desc">
                  Expédition {SUBJECTS[d].expedition} : {SUBJECTS[d].description.toLowerCase()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Le panneau de l'école, qui glisse depuis le bas du monde (comme celui d'une île). */
export function SchoolSheet({ onClose }: { onClose: () => void }) {
  const island = useSchoolIsland();
  return (
    <Sheet id="panneau-ecole" className={`school-sheet biome-${island.id}`} titleId="ecole-titre" icon="school" title={SCHOOL_TITLE} subtitle={<>Sur {island.name} · Français, maths, anglais</>} onClose={onClose}>
      <SchoolBody />
    </Sheet>
  );
}

/** L'école en vue simple : une page. */
export function SchoolPage() {
  const univers = useUnivers();
  const island = useSchoolIsland();
  return (
    <>
      <Link to="/adventure" className="back-link">
        <Icon name="back" /> {UNIVERS[univers].nom}
      </Link>
      <h1 className="page-title">
        <Icon name="school" /> {SCHOOL_TITLE}
      </h1>
      <p className="section-intro">Sur {island.name}.</p>
      <SchoolBody />
    </>
  );
}

/** Le lien vers l'école, sur l'île qui l'accueille : une ligne du panneau de l'île, ou une carte en vue simple. */
export function SchoolLink({ variant = 'sheet' }: { variant?: 'sheet' | 'card' }) {
  const island = useSchoolIsland();
  const desc = `Français, maths, anglais : des blocs ${ofBlock(island.block)} à chaque mission.`;
  if (variant === 'card')
    return (
      <Link to={SCHOOL_PATH} className={`panel app-card school-link biome-${island.id}`}>
        <span className="app-icon">
          <Icon name="school" size="1.8rem" />
        </span>
        <span className="app-title">{SCHOOL_TITLE}</span>
        <span className="app-desc">{desc}</span>
      </Link>
    );
  return (
    <Link to={SCHOOL_PATH} className="island-quest school-link">
      <span className="island-quest-icon">
        <Icon name="school" />
      </span>
      <span className="island-quest-text">
        <span className="island-quest-title">{SCHOOL_TITLE}</span>
        <span className="island-quest-desc">{desc}</span>
      </span>
    </Link>
  );
}
