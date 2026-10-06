// Le mode « Aménager » à l'écran (GD-9, point 1) : le bouton « Aménager » de la Carte et sa pastille, la phrase du mode
// (une ligne courte au téléphone, la phrase entière au toucher), la question de « Réunir », la proposition de la liste
// au téléphone en grand texte, et la barre du mode. La barre garde une rangée fixe en bas, jamais dans la partie qui
// défile, avec « Poser ici » et ✓ Terminé ; les flèches en croix d'icônes (leur nom en accessibilité, le mot visible
// sur tablette) ; au téléphone, « Tourner », « Réunir », « Défaire » et « Remettre comme avant » dans un pli « Plus ».
// L'état du mode vient de `useAmenagement` (Arranging.tsx).
import { useEffect, useId, useState } from 'react';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { type Amenagement, FLECHES } from './Arranging';
import { getBridge } from './world/archipelago';
import { canTurn } from './world/arrangeMode';
import { thePlace } from './world/placeArticle';
import type { PlaceName } from './world/placeSentence';

/** Le téléphone : la même borne que les règles de la barre dans styles/global.css. */
const TELEPHONE = '(max-width: 600px)';

/** L'écran est-il celui d'un téléphone (600 px de large au plus) ? Suivi quand la fenêtre change. Sans `matchMedia` : non. */
export function useTelephone(): boolean {
  const [etroit, setEtroit] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.(TELEPHONE).matches));
  useEffect(() => {
    const m = typeof window !== 'undefined' ? window.matchMedia?.(TELEPHONE) : undefined;
    if (!m) return;
    const suivre = () => setEtroit(m.matches);
    suivre();
    m.addEventListener?.('change', suivre);
    return () => m.removeEventListener?.('change', suivre);
  }, []);
  return etroit;
}

/**
 * Le bouton « Aménager » de la barre de la Carte : quatre flèches, et la pastille des liaisons à reposer (icône et
 * nombre). `proposer` : au lieu d'ouvrir le mode, la Carte propose d'abord la liste (au téléphone en grand texte).
 */
export function ArrangeButton({ amenagement, proposer }: { amenagement: Amenagement; proposer?: () => void }) {
  const n = amenagement.aReposer.length;
  const ouvrir = () => (n ? amenagement.ouvrirLaListe() : amenagement.ouvrir());
  return (
    <button
      type="button"
      className="button world-bar-amenager"
      aria-pressed={amenagement.ouvert}
      aria-label={n ? `Aménager (${n} ${n > 1 ? amenagement.mot.pluriel : amenagement.mot.nom} à reposer)` : 'Aménager'}
      onClick={() => (amenagement.ouvert ? amenagement.terminer() : proposer ? proposer() : ouvrir())}
    >
      <Icon name="amenager" /> <span className="world-bar-text">Aménager</span>
      {n > 0 && (
        <span className="world-bar-count arrange-count" aria-hidden="true">
          <Icon name="aReposer" size={14} />
          {n}
        </span>
      )}
    </button>
  );
}

/** Ce que dit la Carte au téléphone en grand texte, avant d'ouvrir le mode. */
export const PROPOSITION_DE_LA_LISTE = 'La carte s’aménage plus facilement en liste.';

/**
 * Au téléphone en grand texte, « Aménager » propose d'abord la liste « Aménager la carte » (la vue simple), mise en
 * avant, et garde le choix de rester sur la Carte ; toucher « Aménager » à nouveau la referme. La phrase est écrite, et
 * lue par l'appelant.
 */
export function ArrangeListOffer({ onListe, onCarte }: { onListe: () => void; onCarte: () => void }) {
  return (
    <div className="creature-line world-line arrange-line arrange-offre" role="group" aria-label="Aménager">
      <p>
        {PROPOSITION_DE_LA_LISTE} <SpeakButton text={PROPOSITION_DE_LA_LISTE} compact />
      </p>
      <div className="arrange-question-buttons">
        <button type="button" className="button primary" onClick={onListe}>
          <Icon name="amenager" /> Aménager en liste
        </button>
        <button type="button" className="button" onClick={onCarte}>
          <Icon name="map" /> Rester sur la Carte
        </button>
      </div>
    </div>
  );
}

/**
 * La phrase du mode, en haut, sur un fond uni : écrite, et lisible à voix haute. Au téléphone (hors de la liste), une
 * ligne courte, le nom et la direction, que le toucher ouvre sur la phrase entière ; le haut-parleur lit toujours la
 * phrase entière.
 */
export function ArrangeSentence({ amenagement, nom, questionAilleurs = false }: { amenagement: Amenagement; nom: PlaceName; questionAilleurs?: boolean }) {
  const { liste, explication, aReposer, phrase, resume, mot, question } = amenagement;
  const telephone = useTelephone();
  const titreDeLaListe = `${mot.pluriel.charAt(0).toUpperCase()}${mot.pluriel.slice(1)} à reposer`;
  if (liste)
    return (
      <div className="creature-line world-line arrange-relink" role="dialog" aria-label={titreDeLaListe}>
        {explication && (
          <p className="arrange-explication">
            {amenagement.texteDeLExplication} <SpeakButton text={amenagement.texteDeLExplication} compact />
          </p>
        )}
        <p>
          <strong>
            <Icon name="aReposer" /> {titreDeLaListe} : {aReposer.length}
          </strong>
        </p>
        <ul className="arrange-relink-list">
          {aReposer.map((id) => {
            const b = getBridge(id);
            return (
              <li key={id}>
                <button type="button" className="button" onClick={() => amenagement.choisirUneLiaison(id)}>
                  {b ? `Entre ${thePlace(nom(b.from))} et ${thePlace(nom(b.to))}` : id}
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="icon-button" aria-label="Fermer" onClick={amenagement.fermerLaListe}>
          <Icon name="close" />
        </button>
      </div>
    );
  // En vue simple, la question se pose sous la ligne du lieu (`questionAilleurs`).
  if (question && questionAilleurs) return null;
  if (question) return <ArrangeJoinQuestion amenagement={amenagement} nom={nom} className="creature-line world-line arrange-line" />;
  if (!phrase) return null;
  if (telephone && !questionAilleurs) return <LigneCourte key={phrase} phrase={phrase} resume={resume || phrase} />;
  return (
    <div className="creature-line world-line arrange-line" role="status" aria-live="polite">
      <p>{phrase}</p>
      <SpeakButton text={phrase} compact />
    </div>
  );
}

/** La phrase au téléphone : une ligne, la phrase entière au toucher (refermée à chaque nouvelle phrase). */
function LigneCourte({ phrase, resume }: { phrase: string; resume: string }) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <div className={`creature-line world-line arrange-line arrange-line-courte${ouverte ? ' ouverte' : ''}`} role="status" aria-live="polite">
      <button type="button" className="arrange-line-texte" aria-expanded={ouverte} onClick={() => setOuverte(!ouverte)}>
        {ouverte ? phrase : resume}
      </button>
      <SpeakButton text={phrase} compact />
    </div>
  );
}

/**
 * La question de « Réunir » (GD-9, point 10), dans la zone de la phrase (ou sous la ligne du lieu, en vue simple) :
 * « Réunir la Tour du lecteur et la Ferme des accords ? Ils ne se sépareront plus. », la phrase sur la construction de
 * l'univers la première fois, un bouton « Réunir avec … » par voisin possible, et « Ne pas réunir ». Rien n'y est mis
 * en avant : c'est à l'élève de choisir.
 */
export function ArrangeJoinQuestion({ amenagement, nom, className }: { amenagement: Amenagement; nom: PlaceName; className?: string }) {
  const { question, phrase } = amenagement;
  if (!question) return null;
  return (
    <div className={`arrange-question${className ? ` ${className}` : ''}`} role="group" aria-label={`Réunir ${thePlace(nom(question.id))} ?`}>
      <p>
        {phrase} <SpeakButton text={question.explication ? `${phrase} ${question.explication}` : phrase} compact />
      </p>
      {question.explication && <p className="arrange-explication">{question.explication}</p>}
      <div className="arrange-question-buttons">
        {question.voisins.map((v) => (
          <button key={v} type="button" className="button" onClick={() => amenagement.reunir(question.id, v)}>
            <Icon name="reunir" /> Réunir avec {thePlace(nom(v))}
          </button>
        ))}
        <button type="button" className="button" onClick={amenagement.annulerReunion}>
          <Icon name="close" /> Ne pas réunir
        </button>
      </div>
    </div>
  );
}

/**
 * La barre du mode, à place fixe : la croix des flèches, « Tourner », « Réunir », « Défaire », « Remettre comme avant »,
 * puis la rangée fixe « Poser ici » et ✓ Terminé. Un seul bouton mis en avant : « Poser ici » pendant un choix, ✓ Terminé
 * quand rien n'est en cours. Les boutons sans effet restent à leur place, éteints. `pli` : au téléphone, les quatre
 * boutons du milieu passent dans le pli « Plus » (la liste de la vue simple les garde tous visibles).
 */
export function ArrangeBar({ amenagement, className, pli = true }: { amenagement: Amenagement; className?: string; pli?: boolean }) {
  const { choix, geste, question } = amenagement;
  const telephone = useTelephone();
  const replie = pli && telephone;
  const [plus, setPlus] = useState(false);
  const idDuPli = useId();
  // Pendant la question de « Réunir », c'est elle qui attend la réponse : rien n'est mis en avant dans la barre.
  const occupe = Boolean(geste);
  const enQuestion = Boolean(question);
  const outils = (
    <>
      <button type="button" className="button" disabled={!canTurn(choix) || occupe} onClick={amenagement.tourner}>
        <Icon name="tourner" /> <span>Tourner</span>
      </button>
      <button type="button" className="button" aria-pressed={enQuestion} disabled={!amenagement.reunirAvec || occupe} onClick={() => amenagement.demanderReunion()}>
        <Icon name="reunir" /> <span>Réunir</span>
      </button>
      <button type="button" className="button" disabled={!amenagement.peutDefaire || occupe} onClick={amenagement.defaire} aria-label="Défaire la dernière pose">
        <Icon name="defaire" /> <span>Défaire</span>
      </button>
      {/* Sans icône : la seule flèche courbe reste celle de « Défaire », qui ne se confond plus avec une autre. */}
      <button type="button" className="button" disabled={!amenagement.peutRemettre || occupe} onClick={amenagement.remettre}>
        <span>Remettre comme avant</span>
      </button>
    </>
  );
  return (
    <nav className={`arrange-bar${replie ? ' arrange-bar-telephone' : ''}${className ? ` ${className}` : ''}`} data-couvre="scene" aria-label="Aménager">
      {/* La croix des flèches : leur nom en accessibilité, le mot visible sur tablette. */}
      <div className="arrange-cross" role="group" aria-label="Déplacer">
        {FLECHES.map((f) => (
          <button
            key={f.dir}
            type="button"
            className={`button arrange-arrow arrange-arrow-${f.dir}`}
            aria-label={f.nom}
            disabled={!choix || occupe}
            onClick={() => amenagement.fleche(f.dir)}
          >
            <Icon name={f.icone} />
            {!telephone && <span aria-hidden="true">{f.nom}</span>}
          </button>
        ))}
      </div>
      <div className="arrange-bar-outils">
        {replie ? (
          <>
            <button type="button" className="button arrange-plus" aria-expanded={plus} aria-controls={idDuPli} onClick={() => setPlus(!plus)}>
              <Icon name={plus ? 'close' : 'chevronDown'} /> <span>Plus</span>
            </button>
            {plus && (
              <div id={idDuPli} className="arrange-bar-pli">
                {outils}
              </div>
            )}
          </>
        ) : (
          outils
        )}
      </div>
      {/* La rangée fixe, en bas, jamais dans la partie qui défile. */}
      <div className="arrange-bar-fin">
        <button type="button" className={`button arrange-pose${choix && !enQuestion ? ' primary' : ''}`} disabled={!choix || occupe || enQuestion} onClick={amenagement.poserIci}>
          <Icon name="poser" /> <span>Poser ici</span>
        </button>
        <button type="button" className={`button arrange-fin${choix ? '' : ' primary'}`} onClick={amenagement.terminer}>
          <Icon name="check" /> <span>Terminé</span>
        </button>
      </div>
    </nav>
  );
}
