// Le lieu où l'on assemble les blocs (GD-2) : la Fabrique dans Blocland, la Halle aux matériaux dans Archipéo, sur
// l'île de l'école de chaque archipel. Une recette par archipel atteint, toujours affichée (vignettes, nombres, noms,
// lue à voix haute) ; un toucher sur « Assembler » ouvre une question sur les deux matières de la recette, et la bonne
// réponse assemble le bloc (AssemblageQuestion.tsx). Pas de grille, rien à deviner, rien ne se perd (référent dys). Un
// panneau dans le monde (3D, 2D), une page en vue simple : le même contenu.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/univers';
import { useTextes } from '../univers';
import { BLOCKS, blockCount, blockName, nomDuBloc, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { EarnLink } from './PlanSection';
import { messageAssemble, questionPath } from './AssemblageQuestion';
import { useSchoolIsland } from './School';
import { BlockIcon } from './Voxel';
import { planStatus } from './engine';
import { ASSEMBLAGE_PATH, assemblables, manquePour, RECETTES, type Recette } from './world/assemblage';
import { archipelagoOf, getArchipelago, reachableIslands } from './world/archipelago';
import { archipelagoOfIsland, type ArchipelagoId } from './world/archipels';
import { monumentsOf, type MonumentDef } from './world/monuments';

export { ASSEMBLAGE_PATH };

/**
 * Les recettes des archipels où l'élève a une île ouverte : d'abord celle du bloc demandé (`?bloc=`, depuis un
 * monument), sinon celle de l'archipel où il se tient ; puis les autres.
 */
function useRecettes(): { premiere: Recette | undefined; autres: Recette[] } {
  const { state } = useBlocland();
  const [params] = useSearchParams();
  const ici = archipelagoOf(state.world.place ?? 'french-6e-phonology').classe;
  const atteints = new Set<ArchipelagoId>([...reachableIslands(state.world.links)].map(archipelagoOfIsland));
  atteints.add(ici);
  const ouvertes = RECETTES.filter((r) => atteints.has(r.archipelago));
  const demande = params.get('bloc');
  const premiere = ouvertes.find((r) => r.bloc === demande) ?? ouvertes.find((r) => r.archipelago === ici);
  return { premiere, autres: ouvertes.filter((r) => r !== premiere) };
}

/** « 2 blocs de bois et 1 brique » */
function enMots(r: Recette): string {
  return r.ingredients.map((i) => blockCount(i.bloc, i.n)).join(' et ');
}

/** Une vignette par bloc à donner (les recettes en demandent deux au plus d'un même bloc : assemblage.test.ts). */
function Vignettes({ bloc, n }: { bloc: BlockId; n: number }) {
  const b = BLOCKS[bloc];
  return (
    <span className="assemblage-vignettes" aria-hidden="true">
      {Array.from({ length: n }, (_, k) => (
        <BlockIcon key={k} top={b.top} side={b.side} size={24} />
      ))}
    </span>
  );
}

/**
 * Une recette (relecture UX UI) : le titre et « Écouter la recette », les blocs à donner en vignettes et en chiffres,
 * ce qu'il manque juste au-dessus du bouton, le bouton, ce qu'il vient de se passer, puis les monuments qui attendent
 * le bloc, chacun avec son nombre.
 */
function RecetteCarte({ recette }: { recette: Recette }) {
  const { state, disassemble } = useBlocland();
  const navigate = useNavigate();
  const location = useLocation();
  const nom = nomDuBloc(recette.bloc);
  const un = blockName(recette.bloc, 1);
  const peut = assemblables(state.stock, recette) > 0;
  const manque = manquePour(state.stock, recette);
  const en = state.stock[recette.bloc] ?? 0;
  const pour = monumentsOf(recette.archipelago)
    .map((m) => ({ m, n: planStatus(state, m).missing[recette.bloc] ?? 0 }))
    .filter((x) => x.n > 0);
  // Assez pour un monument : on propose d'y retourner (rien à retenir).
  const retourPour = (apres: number) => pour.find(({ n }) => apres >= n)?.m ?? null;
  // Au retour d'une question réussie, la carte dit ce qui vient d'être assemblé.
  const [dit, setDit] = useState<{ texte: string; retour: MonumentDef | null } | null>(() =>
    (location.state as { assemble?: string } | null)?.assemble === recette.bloc ? { texte: messageAssemble(recette.bloc, en), retour: retourPour(en) } : null,
  );
  // Lu une fois : Précédent et Suivant ne redisent pas « Tu as assemblé… ».
  useEffect(() => {
    if ((location.state as { assemble?: string } | null)?.assemble !== recette.bloc) return;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    // Seulement à l'arrivée sur la carte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const phrase = `Pour 1 ${un}, il faut ${enMots(recette)}.`;
  const manqueEnMots = manque.length ? `Il te manque ${manque.map((m) => blockCount(m.bloc, m.n)).join(' et ')}.` : 'Tu as tout ce qu’il faut.';
  const pocheEnMots = `Dans ta poche : ${blockCount(recette.bloc, en)}.`;
  const attendEnMots = pour.map(({ m, n }) => `${m.name} attend ${blockCount(recette.bloc, n)}.`).join(' ');
  // Le bouton « Écouter la recette » redit tout ce qui est écrit sur la carte (référent dys : rien à lire sans voix).
  const refaireEnMots = en > 0 ? `Pour refaire 1 ${un}, tu répondras à une question.` : '';
  const aEcouter = [phrase, pocheEnMots, manqueEnMots, refaireEnMots, attendEnMots].filter(Boolean).join(' ');
  const titreId = `recette-${recette.bloc}`;
  const bloc = BLOCKS[recette.bloc];

  // « Assembler » ouvre la question du bloc (GD-2), en plein écran : le bloc est assemblé à la bonne réponse.
  const onAssemble = () => {
    // Le bouton reste dans l'ordre du clavier quand il ne peut rien faire (aria-disabled) : le focus ne se perd pas.
    if (!peut) return;
    navigate(questionPath(recette.bloc));
  };
  // Un bloc assemblé se défait : ses blocs reviennent, rien ne se perd (choix du mainteneur, relecture UX UI).
  const onDefaire = () => {
    if (en < 1) return;
    const r = disassemble(recette.bloc);
    if (!r.ok) return;
    setDit({ texte: `Tu as défait 1 ${un} : tu récupères ${enMots(recette)}.`, retour: null });
  };

  return (
    <section className="assemblage-recette panel" aria-labelledby={titreId}>
      <div className="assemblage-tete">
        <h3 id={titreId} className="island-sheet-heading">
          <BlockIcon top={bloc.top} side={bloc.side} size={32} /> {nom}
        </h3>
        <SpeakButton text={aEcouter} label="Écouter la recette" compact />
      </div>
      <p className="assemblage-archipel">{getArchipelago(recette.archipelago).name}</p>
      <ul className="assemblage-ingredients" aria-label={`Pour 1 ${un}, il faut`}>
        {recette.ingredients.map((i) => {
          const a = state.stock[i.bloc] ?? 0;
          return (
            <li key={i.bloc}>
              <Vignettes bloc={i.bloc} n={i.n} />
              <span>
                <strong>{i.n}</strong> {blockName(i.bloc, i.n)} · tu en as <strong>{a}</strong>
                {a >= i.n ? (
                  <>
                    {' '}
                    <Icon name="check" /> assez
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="assemblage-en-poche">
        Dans ta poche : <strong>{en}</strong> {blockName(recette.bloc, en)}.
      </p>
      {manque.length > 0 && (
        <ul className="assemblage-pourquoi" aria-label="Ce qu’il te manque">
          {manque.map((m) => (
            <li key={m.bloc}>
              Il te manque {blockCount(m.bloc, m.n)}, <EarnLink block={m.bloc} />.
            </li>
          ))}
        </ul>
      )}
      <div className="assemblage-actions">
        <button type="button" className="button primary" aria-disabled={!peut} onClick={onAssemble}>
          <Icon name="hammer" /> Assembler 1 {un}
        </button>
        {en > 0 && (
          <button type="button" className="button" onClick={onDefaire}>
            <Icon name="back" /> Défaire 1 {un}
          </button>
        )}
      </div>
      {refaireEnMots && <p className="assemblage-refaire">{refaireEnMots}</p>}
      <p className="assemblage-dit">
        <span role="status" aria-live="polite">
          {dit?.texte ?? ''}
        </span>
        {dit && <SpeakButton text={dit.texte} label="Écouter" compact />}
        {dit?.retour && (
          <Link to={`/aventure/${dit.retour.id}`} className="assemblage-retour">
            <Icon name="castle" /> Retourner à {dit.retour.name}
          </Link>
        )}
      </p>
      {pour.length > 0 && (
        <ul className="assemblage-pour" aria-label={`Les monuments qui attendent des ${blockName(recette.bloc, 2)}`}>
          {pour.map(({ m, n }) => (
            <li key={m.id}>
              <Icon name="castle" /> <Link to={`/aventure/${m.id}`}>{m.name}</Link> attend {blockCount(recette.bloc, n)}.
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Ce qu'on y fait, puis la recette de l'archipel (ou du bloc demandé) ; les autres sous un pli, un bouton principal à la fois. */
export function AssemblageBody() {
  const { assemblage } = useTextes();
  const { premiere, autres } = useRecettes();
  return (
    <div className="assemblage">
      <p className="section-intro">
        <Syllabified text={assemblage.presentation} />
        <SpeakButton text={assemblage.presentation} label="Réécouter" compact />
      </p>
      {premiere && <RecetteCarte key={premiere.bloc} recette={premiere} />}
      {autres.length > 0 && (
        <details className="assemblage-autres">
          <summary>Les autres archipels</summary>
          {autres.map((r) => (
            <RecetteCarte key={r.bloc} recette={r} />
          ))}
        </details>
      )}
    </div>
  );
}

/** Le panneau du lieu, qui glisse depuis le bas du monde (comme celui de l'école). */
export function AssemblageSheet({ onClose }: { onClose: () => void }) {
  const island = useSchoolIsland();
  const { assemblage } = useTextes();
  return (
    <section
      id="panneau-assemblage"
      className={`island-sheet assemblage-sheet biome-${island.id}`}
      role="dialog"
      aria-labelledby="assemblage-titre"
      aria-modal="false"
    >
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="assemblage-titre" className="island-sheet-title">
            <Icon name="hammer" /> {assemblage.titre}
          </h2>
          <p className="island-sheet-module">Sur {island.name}</p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <AssemblageBody />
    </section>
  );
}

/** Le lieu en vue simple : une page. */
export function AssemblagePage() {
  const univers = useUnivers();
  const island = useSchoolIsland();
  const { assemblage } = useTextes();
  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> {UNIVERS[univers].nom}
      </Link>
      <h1 className="page-title">
        <Icon name="hammer" /> {assemblage.titre}
      </h1>
      <p className="section-intro">Sur {island.name}.</p>
      <AssemblageBody />
    </>
  );
}

/** Le lien vers le lieu, sur l'île de l'école : une ligne du panneau de l'île, ou une carte en vue simple. */
export function AssemblageLink({ variant = 'sheet' }: { variant?: 'sheet' | 'card' }) {
  const { assemblage } = useTextes();
  const desc = 'Assemble tes blocs pour les monuments.';
  if (variant === 'card')
    return (
      <Link to={ASSEMBLAGE_PATH} className="panel app-card assemblage-link">
        <span className="app-icon">
          <Icon name="hammer" size="1.8rem" />
        </span>
        <span className="app-title">{assemblage.titre}</span>
        <span className="app-desc">{desc}</span>
      </Link>
    );
  return (
    <Link to={ASSEMBLAGE_PATH} className="island-quest assemblage-link">
      <span className="island-quest-icon">
        <Icon name="hammer" />
      </span>
      <span className="island-quest-text">
        <span className="island-quest-title">{assemblage.titre}</span>
        <span className="island-quest-desc">{desc}</span>
      </span>
    </Link>
  );
}
