// Le mode « Aménager » à l'écran (GD-9, point 1 ; piste A « des signes à la place des phrases ») : le bouton
// « Modifier le plan » de la Carte et sa pastille, la ligne du mode (des signes : « Mine des lettres ↖ 4 ⬚ », dits en
// mots par la voix), la question de « Réunir », la proposition de la liste au téléphone en grand texte, et la barre du
// mode (↶, « Poser », la place de « Réunir », puis « Annuler » et « Valider », qui le ferment ; décision du mainteneur,
// 6 octobre 2026 ; « Annuler » demande confirmation quand quelque chose a bougé). Les flèches et « Tourner » sont
// dessinées dans le monde autour du choix, leurs boutons transparents par-dessus (ArrangeHandles.tsx). Les icônes sans mot sont nommées
// pour les lecteurs d'écran, leur mot dessous en grand texte (comme la barre du monde). Les icônes et les signes sont
// communs aux deux univers. L'état du mode vient de `useAmenagement` (Arranging.tsx).
import { useEffect, useState } from 'react';
import { Icon, IconButton } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { type Amenagement, FLECHES, type LigneDuMode, PLACE_PRISE } from './Arranging';
import { getBridge } from './world/archipelago';
import { canTurn } from './world/arrangeMode';
import { thePlace } from './world/placeArticle';
import { casesWord, type PlaceName, type PlaceSigns } from './world/placeSentence';

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

/** Le nom du bouton qui ouvre le mode (décision du mainteneur, 6 octobre 2026). */
export const MODIFIER_LE_PLAN = 'Modifier le plan';

/**
 * Le bouton « Modifier le plan » de la barre de la Carte : quatre flèches, et la pastille des liaisons à reposer (icône
 * et nombre). Il ouvre le mode ; « Valider » ou « Annuler » le ferment. `proposer` : au lieu d'ouvrir le mode, la Carte
 * propose d'abord la liste (au téléphone en grand texte).
 */
export function ArrangeButton({ amenagement, proposer }: { amenagement: Amenagement; proposer?: () => void }) {
  const n = amenagement.aReposer.length;
  const ouvrir = () => (n ? amenagement.ouvrirLaListe() : amenagement.ouvrir());
  return (
    <button
      type="button"
      className="button world-bar-amenager"
      aria-label={n ? `${MODIFIER_LE_PLAN} (${n} ${n > 1 ? amenagement.mot.pluriel : amenagement.mot.nom} à reposer)` : MODIFIER_LE_PLAN}
      onClick={() => (proposer ? proposer() : ouvrir())}
    >
      <Icon name="amenager" /> <span className="world-bar-text">{MODIFIER_LE_PLAN}</span>
      {n > 0 && (
        <span className="world-bar-count arrange-count" aria-hidden="true">
          <Icon name="aReposer" size={14} />
          {n}
        </span>
      )}
    </button>
  );
}

/** Ce que dit la Carte au téléphone en grand texte, avant d'ouvrir le mode (lu ; seul « En liste » est écrit). */
export const PROPOSITION_DE_LA_LISTE = 'Modifier le plan en liste ?';

/**
 * Au téléphone en grand texte, « Modifier le plan » propose d'abord la liste (la vue simple) : un seul bouton nommé,
 * « En liste », mis en avant, et la Carte en icône pour y rester ; toucher « Modifier le plan » à nouveau la referme.
 * La question est lue par l'appelant.
 */
export function ArrangeListOffer({ onListe, onCarte }: { onListe: () => void; onCarte: () => void }) {
  return (
    <div className="creature-line world-line arrange-line arrange-offre" role="group" aria-label={MODIFIER_LE_PLAN}>
      <div className="arrange-question-buttons">
        <button type="button" className="button primary" onClick={onListe}>
          <Icon name="liste" /> En liste
        </button>
        <IconButton icone="map" nom="Rester sur la Carte" mot="Carte" onClick={onCarte} />
      </div>
      <SpeakButton text={PROPOSITION_DE_LA_LISTE} compact />
    </div>
  );
}

/**
 * Où est un lieu, en signes, dans l'ordre de la voix : le nom du voisin repère, la flèche, le nombre, la case
 * (« Mine des lettres ↖ 4 ⬚ »). En grand texte, le mot de la direction s'ajoute à la flèche, et « cases » au nombre.
 * Décoratif : la phrase en mots est dite à côté (`role="status"`, le haut-parleur). `sansEcart` : sur une place prise, ni
 * nombre ni case (la croix et « Place prise » les remplacent).
 */
export function PlaceSignsLine({ signes, sansEcart = false }: { signes: PlaceSigns; sansEcart?: boolean }) {
  return (
    <span className="signes-de-place">
      <span className="signe-voisin">{signes.voisin}</span>{' '}
      <span className="signe">
        <Icon name={signes.direction.icone} />
        <span className="mot-signe">{signes.direction.mot}</span>
      </span>
      {!sansEcart && (
        <>
          {' '}
          <span className="signe">
            <strong>{signes.cases}</strong>
            <Icon name="case" />
            <span className="mot-signe">{casesWord(signes.cases).replace(/^\d+ /, '')}</span>
          </span>
        </>
      )}
    </span>
  );
}

/** Les ouvrages à reposer, en signes : l'icône d'un ouvrage séparé et leur nombre. */
function SigneAReposer({ n }: { n: number }) {
  return n > 0 ? (
    <span className="signe signe-a-reposer">
      <Icon name="aReposer" />
      <strong>{n}</strong>
    </span>
  ) : null;
}

/** Deux lieux réunis, en signes : « A ⋈ B ». */
function SigneReunis({ a, b }: { a: string; b: string }) {
  return (
    <>
      <span className="signe-voisin">{a}</span>{' '}
      <span className="signe">
        <Icon name="reunir" />
      </span>{' '}
      <span className="signe-voisin">{b}</span>
    </>
  );
}

/**
 * Une place prise (choix 3 du mainteneur) : la croix et ses deux mots, comme un refus, sur la même ligne que les signes
 * de la place (à la place du nombre de cases : la ligne garde sa hauteur).
 */
function SignePrise({ prise }: { prise?: boolean }) {
  return prise ? (
    <span className="signe signe-refus">
      <Icon name="close" /> {PLACE_PRISE}
    </span>
  ) : null;
}

/** Ce que montre la ligne du mode (décoratif : ce qu'elle dit en mots est à côté). */
function Signes({ ligne }: { ligne: LigneDuMode }) {
  switch (ligne.genre) {
    case 'texte':
      return (
        <>
          {ligne.texte}
          {ligne.vers && (
            <>
              {' '}
              <span className="signe">
                <Icon name="ouvrage" /> <span className="signe-voisin">{ligne.vers}</span>
              </span>
            </>
          )}{' '}
          <SignePrise prise={ligne.prise} />
        </>
      );
    case 'gardien':
      return (
        <>
          <span className="signe">
            <Icon name="shield" />
          </span>{' '}
          <PlaceSignsLine signes={ligne.signes} sansEcart={ligne.prise} /> <SignePrise prise={ligne.prise} />
        </>
      );
    case 'place':
      return (
        <>
          <PlaceSignsLine signes={ligne.signes} sansEcart={ligne.prise} /> <SigneAReposer n={ligne.aReposer} /> <SignePrise prise={ligne.prise} />
        </>
      );
    case 'refus':
      return (
        <span className="signe signe-refus">
          <Icon name={ligne.icone} /> {ligne.texte}
        </span>
      );
    case 'reunis':
      return (
        <>
          <SigneReunis a={ligne.a} b={ligne.b} /> <SigneAReposer n={ligne.aReposer} />
        </>
      );
  }
}

/**
 * La ligne du mode, en haut, sur un fond uni, à la même place au téléphone et sur tablette : des signes écrits, la
 * même chose dite en mots par le haut-parleur et annoncée aux lecteurs d'écran (`role="status"`).
 */
export function ArrangeSentence({ amenagement, nom, questionAilleurs = false }: { amenagement: Amenagement; nom: PlaceName; questionAilleurs?: boolean }) {
  const { liste, explication, aReposer, phrase, ligne, mot, question } = amenagement;
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
            <Icon name="aReposer" /> <span className="visually-hidden">{titreDeLaListe} : </span>
            {aReposer.length}
          </strong>
        </p>
        <ul className="arrange-relink-list">
          {aReposer.map((id) => {
            const b = getBridge(id);
            return (
              <li key={id}>
                <button type="button" className="button" aria-label={b ? `Entre ${thePlace(nom(b.from))} et ${thePlace(nom(b.to))}` : id} onClick={() => amenagement.choisirUneLiaison(id)}>
                  {b ? (
                    <>
                      {nom(b.from)} <Icon name="aReposer" /> {nom(b.to)}
                    </>
                  ) : (
                    id
                  )}
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
  if (!phrase && !ligne) return null;
  return (
    <div className="creature-line world-line arrange-line">
      <p className="visually-hidden" role="status" aria-live="polite">
        {phrase}
      </p>
      {ligne && (
        <p className="arrange-signes" aria-hidden="true">
          <Signes ligne={ligne} />
        </p>
      )}
      <SpeakButton text={phrase} compact />
    </div>
  );
}

/**
 * La question de « Réunir » (GD-9, point 10), dans la zone de la ligne (ou sous la ligne du lieu, en vue simple), en
 * signes : « A ⋈ B 🔒 » (le cadenas : ils ne se sépareront plus ; « pour toujours » dessous en grand texte), dite en
 * mots. Un seul voisin : le bouton « Réunir » ; plusieurs : un bouton par voisin, son nom à côté de l'icône. La croix
 * en haut à droite : ne pas réunir. La première fois, la phrase sur la construction de l'univers
 * (une phrase, une seule fois par appareil ; Arranging.tsx).
 */
export function ArrangeJoinQuestion({ amenagement, nom, className }: { amenagement: Amenagement; nom: PlaceName; className?: string }) {
  const { question, phrase } = amenagement;
  if (!question) return null;
  const seul = question.voisins.length === 1 ? question.voisins[0] : null;
  return (
    <div className={`arrange-question${className ? ` ${className}` : ''}`} role="group" aria-label={`Réunir ${thePlace(nom(question.id))} ?`}>
      <p className="visually-hidden">{phrase}</p>
      <p className="arrange-signes" aria-hidden="true">
        <SigneReunis a={nom(question.id)} b={seul ? nom(seul) : '?'} />{' '}
        <span className="signe">
          <Icon name="lock" />
          <span className="mot-signe">pour toujours</span>
        </span>
      </p>
      <SpeakButton text={question.explication ? `${phrase} ${question.explication}` : phrase} compact />
      <button type="button" className="icon-button arrange-question-fermer" aria-label="Ne pas réunir" onClick={amenagement.annulerReunion}>
        <Icon name="close" />
      </button>
      {question.explication && <p className="arrange-explication">{question.explication}</p>}
      <div className="arrange-question-buttons">
        {question.voisins.map((v) => (
          <button key={v} type="button" className="button" aria-label={`Réunir avec ${thePlace(nom(v))}`} onClick={() => amenagement.reunir(question.id, v)}>
            <Icon name="reunir" /> {seul ? 'Réunir' : nom(v)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * La barre du mode, à place fixe, en bas (décision du mainteneur, 6 octobre 2026) : ↶ « Défaire » en icône et
 * « Poser », la place de « Réunir » dès qu'un lieu est choisi (sur la Carte ; éteint quand il ne sert pas), puis les deux boutons qui ferment le mode, ✕ « Annuler » et ✓ « Valider », qui gardent leur mot partout
 * (en grand texte, il passe sous l'icône). Un seul bouton mis en avant : « Poser » pendant un choix, « Valider » quand
 * rien n'est en cours. Les boutons sans effet restent à leur place, éteints. Sur la Carte, les flèches et « Tourner » sont
 * dessinées autour du choix (ArrangeHandles.tsx) ; en vue simple (`croix`), sans scène, la croix des flèches et « Tourner »
 * restent dans la barre.
 */
export function ArrangeBar({ amenagement, className, croix = false }: { amenagement: Amenagement; className?: string; croix?: boolean }) {
  const { choix, geste, question } = amenagement;
  const telephone = useTelephone();
  // Pendant la question de « Réunir », c'est elle qui attend la réponse : rien n'est mis en avant dans la barre.
  const occupe = Boolean(geste);
  const enQuestion = Boolean(question);
  return (
    <nav
      className={`arrange-bar${croix ? ' arrange-bar-croix' : ''}${telephone ? ' arrange-bar-telephone' : ''}${className ? ` ${className}` : ''}`}
      data-couvre="scene"
      aria-label="Modifier le plan"
    >
      {croix && (
        // La croix des flèches (vue simple) : des icônes, leur nom en accessibilité, le mot dessous en grand texte.
        <div className="arrange-cross" role="group" aria-label="Déplacer">
          {FLECHES.map((f) => (
            <IconButton key={f.dir} icone={f.icone} nom={f.nom} className={`arrange-arrow arrange-arrow-${f.dir}`} disabled={!choix || occupe} onClick={() => amenagement.fleche(f.dir)} />
          ))}
        </div>
      )}
      <div className="arrange-bar-outils">
        {croix && <IconButton icone="tourner" nom="Tourner" disabled={!canTurn(choix) || occupe} onClick={amenagement.tourner} />}
        <IconButton icone="defaire" nom="Défaire la dernière pose" mot="Défaire" disabled={!amenagement.peutDefaire || occupe} onClick={amenagement.defaire} />
        {/* Sur une place prise (choix 3 du mainteneur), « Poser » s'éteint : la croix grise du fantôme le montre. */}
        <button
          type="button"
          className={`button arrange-pose${choix && !enQuestion && !amenagement.aConfirmer && !amenagement.placePrise ? ' primary' : ''}`}
          disabled={!choix || occupe || enQuestion || amenagement.aConfirmer || amenagement.placePrise}
          onClick={amenagement.poserIci}
        >
          <Icon name="poser" /> <span>Poser</span>
        </button>
        {/* La place de « Réunir », entre « Poser » et « Annuler », réservée dès qu'un lieu est choisi (sur la Carte ; la
            vue simple l'a dans sa liste) : le bouton y est éteint quand il ne sert pas. Quand « Annuler » demande
            confirmation, l'« Annuler » qui confirme se pose à cette place, à côté de « Garder ». */}
        {amenagement.aConfirmer ? (
          <button type="button" className="button arrange-confirmer" onClick={amenagement.confirmerLAnnulation}>
            <Icon name="close" /> <span>Annuler</span>
          </button>
        ) : (
          !croix &&
          choix?.genre === 'lieu' && (
            <IconButton
              icone="reunir"
              nom="Réunir"
              className="arrange-reunir"
              aria-pressed={enQuestion}
              disabled={!amenagement.reunirAvec || occupe}
              onClick={() => amenagement.demanderReunion()}
            />
          )
        )}
      </div>
      {/* Les deux boutons qui ferment le mode, toujours à la même place, jamais dans la partie qui défile. Quand quelque
          chose a bougé, « Annuler » demande d'abord : « Garder » (l'icône du mode : on continue d'aménager) prend sa
          place, l'« Annuler » qui confirme se pose juste avant ; rien ne se décale. */}
      <div className="arrange-bar-fin">
        {amenagement.aConfirmer ? (
          <button type="button" className="button bouton-cta arrange-garder" onClick={amenagement.garder}>
            <Icon name="amenager" /> <span>Garder</span>
          </button>
        ) : (
          <button type="button" className="button bouton-cta arrange-annuler" onClick={amenagement.annuler}>
            <Icon name="close" /> <span>Annuler</span>
          </button>
        )}
        <button type="button" className={`button bouton-cta arrange-valider${choix || amenagement.aConfirmer ? '' : ' primary'}`} onClick={amenagement.valider}>
          <Icon name="check" /> <span>Valider</span>
        </button>
      </div>
    </nav>
  );
}
