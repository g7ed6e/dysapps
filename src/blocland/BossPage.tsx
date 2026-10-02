import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useLoaded } from '../core/useLoaded';
import { getBiome, guardianTitle } from './biomes';
import { archipelagoOf, getArchipelago, isBiomeUnlocked } from './world/archipelago';
import { beatenGuardians, stageTo, type VehicleStage } from './world/vehicle';
import { nextArchipelago } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { STARS_TO_BEAT, bossDef, bossId, isBossBeaten, isBossOpen, missingForBoss } from './boss';
import { CreatureBubble } from './CreatureBubble';
import { firstSentences } from './firstSentences';
import { ExerciseRunner } from './ExerciseRunner';
import { Guardian3D, type GuardianMood } from './Guardians';
import { FONDU, lueursDuDefi } from './world/personnages/allumage';
import { playDrum, playGrowl, playVictory } from './sound';
import { Loading } from '../components/Loading';
import { useTextes } from '../univers';

/** Le Gardien d'un biome : le défi de fin de biome, une manche de chaque mission, dans son arène. */
export function BossPage() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const { beatBoss } = useProgress();
  const { settings, speak } = useSettings();
  const textes = useTextes();
  const [run, setRun] = useState(0);
  const biome = getBiome(biomeId);
  const unlocked = Boolean(biome && isBiomeUnlocked(biome.id, state.world.links) && isBossOpen(biome, state.progress));
  const alreadyBeaten = biome ? isBossBeaten(biome.id, state.progress) : false;
  // Jamais affronté : aucune partie de son défi n'est encore enregistrée. Lu à l'arrivée, pas à la fin de la partie.
  const [regleOuverte, setRegleOuverte] = useState(() => (biome ? !state.progress[bossId(biome.id)] : false));
  // Le défi est tiré au lancement (et à chaque « Rejouer »), pas à chaque changement de progression.
  // Son contenu est chargé à la demande : `undefined` le temps de l'avoir, `null` si le Gardien n'est pas accessible.
  const loaded = useLoaded(
    async () => (biome && unlocked ? bossDef(biome, state) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [biome?.id, unlocked, run],
  );
  // Archipéo (lot 6) : le défi d'une sentinelle, dont la consigne dit la règle ; Blocland garde l'arène d'avant.
  const sent = textes.sentinelles;
  const total = loaded?.items.length ?? 0;
  // Les épreuves réussies qu'il faut : les mêmes 70 % que la victoire.
  const needed = Math.ceil(total * 0.7);
  const def = useMemo(
    () => (loaded && sent ? { ...loaded, instruction: sent.consigne } : (loaded ?? undefined)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded, sent],
  );
  // L'arène : résistance du Gardien (une épreuve réussie = un cran de moins), humeur et réplique.
  const [won, setWon] = useState(0);
  const [played, setPlayed] = useState(0);
  const [mood, setMood] = useState<GuardianMood>('idle');
  const [seq, setSeq] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  // La réplique du Gardien, entière au lancement, repliée en une ligne dès la première épreuve jouée (DA-34).
  const [repliqueOuverte, setRepliqueOuverte] = useState(false);
  // La ligne repliée déborde-t-elle ? Mesuré à l'écran : la première phrase peut ne pas tenir sur une ligne.
  const [deborde, setDeborde] = useState(false);
  const ligneRef = useRef<HTMLParagraphElement>(null);
  const ligneId = useId();
  // Ce Gardien vaincu fait arriver le kit du Bloc-Navire (la voile, le ballon, les feux) : on le dit, avec le chemin du port.
  const [shipHint, setShipHint] = useState<VehicleStage | null>(null);
  const sound = (f: () => void) => settings.sounds && f();

  useEffect(() => {
    setWon(0);
    setPlayed(0);
    setMood('idle');
    setLine(null);
    setRepliqueOuverte(false);
    // Pas de tambour pour une sentinelle : rien ne se combat. Sa règle est lue au lancement, comme une consigne.
    if (def && !sent) sound(playDrum);
    if (def && sent && settings.autoRead) speak(frenchTypography(def.instruction));
    // Au lancement et à chaque revanche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def]);

  // Mesurée tant que la réplique est repliée, et à chaque changement de taille ; ouverte, on garde la dernière mesure.
  useLayoutEffect(() => {
    const el = ligneRef.current;
    if (!el || played === 0 || repliqueOuverte) return;
    const mesure = () => setDeborde(el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
    mesure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(mesure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [line, played, repliqueOuverte]);

  if (!biome) return <NotFoundPage />;
  const { challenge, guardianSays: says } = textes.gardiens[biome.id];
  // Ce que dit l'arène, écrit et lu à l'identique.
  const arenaLine = line ?? (alreadyBeaten ? textes.libelles.dejaFaitArene(guardianTitle(biome)) : challenge);
  const finished = def ? played >= total : false;
  const beatenNow = finished && won >= needed;
  const remaining = Math.max(0, total - won);
  const repliee = played > 0 && !repliqueOuverte;
  // Repliée, la ligne montre la première phrase (coupée par « … » si elle ne tient pas) ; le reste, caché à l'écran,
  // reste lu par un lecteur d'écran. Le chevron n'est là que si la réplique est vraiment coupée.
  const { first: premiere, rest: suite } = firstSentences(arenaLine);
  const coupee = suite !== '' || deborde;

  const onRound = ({ correct }: { correct: boolean }) => {
    const nextWon = won + (correct ? 1 : 0);
    const nextPlayed = played + 1;
    setWon(nextWon);
    setPlayed(nextPlayed);
    setSeq((n) => n + 1);
    const last = nextPlayed >= total;
    const victory = last && nextWon >= needed;
    const text = victory ? says.beaten : correct ? says.hit : says.miss;
    setMood(victory ? 'beaten' : correct ? 'hit' : 'miss');
    setLine(text);
    // La règle, ouverte au premier défi, se replie avec la réplique dès la première épreuve jouée ; rouverte, elle le reste.
    if (played === 0) setRegleOuverte(false);
    if (victory) sound(playVictory);
    // Une épreuve ratée n'a jamais de son dans Archipéo (rien ne s'éteint) ; Blocland garde le grognement.
    else if (!correct && !sent) sound(playGrowl);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  return (
    <>
      <Link to={`/adventure/${biome.id}`} className="back-link">
        <Icon name="back" /> {biome.name}
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}${sent ? ' defi-titre' : ''}`}>
        {/* Le nom du Gardien, une seule fois à l'écran (DA-34) : son nom dans Blocland, le nom de l'écran dans Archipéo
            (« Le défi du Grand Chêne ») ; l'arène ne le répète pas. */}
        <Icon name={sent ? 'flame' : 'shield'} /> {sent ? textes.libelles.arene(biome.guardian) : guardianTitle(biome)}
      </h1>
      {unlocked && loaded === undefined ? (
        <Loading />
      ) : !unlocked || !def ? (
        <>
          <CreatureBubble
            biome={biome}
            text={textes.libelles.defiFerme(guardianTitle(biome), STARS_TO_BEAT)}
          />
          <p className="intro">
            <Syllabified text={`Il te manque encore des étoiles dans : ${missingForBoss(biome, state.progress).join(', ')}.`} />
          </p>
          <Link to={`/adventure/${biome.id}`} className="button primary">
            <Icon name="back" /> Voir les missions
          </Link>
        </>
      ) : (
        <>
          <section
            className={`arena${sent ? ' arena-sentinelle' : ''}${beatenNow && !sent ? ' arena-beaten' : ''}`}
            aria-label={textes.libelles.arene(biome.guardian)}
          >
            {/* La vitrine : le décor (le dégradé de l'arène) derrière le Gardien seul, jamais sous un texte (DA-26). */}
            <div className="arena-vitrine">
              {sent ? (
                // La sentinelle ne bouge pas : seules ses lueurs montent, une épreuve réussie après l'autre (jamais
                // éteintes par un échec), et la pierre s'éclaircit à la victoire.
                <Guardian3D
                  biome={biome.id}
                  label={`${guardianTitle(biome)}, le Gardien de l’île`}
                  allumage={{ pierre: beatenNow ? 1 : 0, lueurs: beatenNow ? 1 : lueursDuDefi(won, needed) }}
                  fondu={beatenNow ? FONDU.victoire : FONDU.reussite}
                />
              ) : (
                <Guardian3D biome={biome.id} label={`${guardianTitle(biome)}, le Gardien du biome`} mood={mood} seq={seq} />
              )}
            </div>
            {/* Le texte de l'arène sur un panneau uni, clair, collé à la vitrine (DA-26). */}
            <div className="arena-info">
              {sent ? (
                <>
                  <div className="arena-jauge">
                    <div className="arena-gauge-label">
                      <span aria-hidden="true">{sent.jauge}</span>
                      <span aria-hidden="true">{sent.compte(won, total)}</span>
                    </div>
                    <div
                      className="arena-pastilles"
                      role="progressbar"
                      aria-label={sent.jauge}
                      aria-valuemin={0}
                      aria-valuemax={total}
                      aria-valuenow={won}
                      aria-valuetext={sent.jaugeLue(won, total, needed)}
                    >
                      {/* Les réussites d'abord, dans l'ordre où elles viennent : une pastille vide ne dit pas laquelle a raté. */}
                      {Array.from({ length: total }, (_, i) => (
                        <span key={i} className={`arena-pastille${i < won ? ' on' : ''}`}>
                          {i < won && <Icon name="flame" size="14px" />}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="arena-seuil">
                    <Syllabified text={sent.seuil(needed, won >= needed)} />
                  </p>
                  {/* La règle du rallumage, à côté de la jauge qu'elle explique : sa phrase courte toujours lue, la règle
                      entière dans un pli ouvert au premier défi contre ce Gardien, jusqu'à la première épreuve jouée (DA-28, DA-34) ;
                      le haut-parleur la lit en entier. */}
                  <div className="arena-regle">
                    <details open={regleOuverte} onToggle={(e) => setRegleOuverte(e.currentTarget.open)}>
                      <summary>
                        <span className="arena-regle-chevron" aria-hidden="true">
                          <Icon name={regleOuverte ? 'chevronDown' : 'chevronRight'} />
                        </span>
                        <Syllabified text={sent.regle} />
                      </summary>
                      <p>
                        <Syllabified text={def.instruction} />
                      </p>
                    </details>
                    <SpeakButton text={def.instruction} label="La règle" compact />
                  </div>
                </>
              ) : (
                <div className="arena-jauge">
                  <div className="arena-gauge-label">
                    <span aria-hidden="true">Résistance</span>
                    <span aria-hidden="true">
                      {remaining} / {total}
                    </span>
                  </div>
                  <div
                    className="arena-gauge"
                    role="progressbar"
                    aria-label="Résistance du Gardien"
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-valuenow={remaining}
                    aria-valuetext={textes.libelles.resistance(remaining, total)}
                  >
                    <div className="arena-gauge-fill" style={{ width: `${total ? (remaining / total) * 100 : 0}%` }} />
                  </div>
                </div>
              )}
              {/* La réplique : entière au lancement ; dès la première épreuve jouée, repliée en une ligne, que le chevron
                  des plis des îles (ou un toucher sur la ligne) ouvre en entier. Le texte reste entier pour un lecteur
                  d'écran, et le haut-parleur, à sa droite, le lit toujours en entier (DA-34). */}
              <div className={`arena-replique${repliee ? ' repliee' : ''}`}>
                {played > 0 && coupee && (
                  <button
                    type="button"
                    className="arena-replique-pli"
                    aria-expanded={repliqueOuverte}
                    aria-controls={ligneId}
                    onClick={() => setRepliqueOuverte((o) => !o)}
                  >
                    <Icon name={repliqueOuverte ? 'chevronDown' : 'chevronRight'} />
                    <span className="visually-hidden">Toute la réplique</span>
                  </button>
                )}
                <p
                  ref={ligneRef}
                  id={ligneId}
                  className="arena-line"
                  role="status"
                  aria-live="polite"
                  onClick={repliee && coupee ? () => setRepliqueOuverte(true) : undefined}
                >
                  {repliee && suite ? (
                    <>
                      <Syllabified text={premiere} />
                      <span className="visually-hidden"> {suite}</span>
                    </>
                  ) : (
                    <Syllabified text={arenaLine} />
                  )}
                </p>
                <SpeakButton text={arenaLine} label="Écouter" compact />
              </div>
            </div>
          </section>
          {shipHint && (
            <p className="panel ship-hint" role="status" aria-live="polite">
              <Icon name="ship" />{' '}
              <Syllabified text={`Le Bloc-Navire a ses Gardiens : ${shipHint.short} est là ! Va au port, sur ${getBiome(shipHint.biome)?.name ?? shipHint.biome}, finir de le construire.`} />{' '}
              <Link to={`/adventure/${getArchipelago(shipHint.from).port}`} className="button">
                <Icon name="ship" /> Aller au port
              </Link>
            </p>
          )}
          <ExerciseRunner
            key={`${def.id}-${run}`}
            biome={biome}
            def={def}
            onReplay={() => setRun((r) => r + 1)}
            onRound={onRound}
            etapesNeutres={Boolean(sent)}
            onComplete={(c) => {
              if (c.stars >= STARS_TO_BEAT && !alreadyBeaten) {
                beatBoss();
                const here = archipelagoOf(biome.id).classe;
                const next = nextArchipelago(here);
                const stage = next ? stageTo(next.classe) : undefined;
                // Le compte d'avant ce Gardien : s'il manquait juste lui, le kit arrive.
                if (stage && beatenGuardians(here, state.progress) + 1 === stage.guardians) setShipHint(stage);
              }
            }}
          />
        </>
      )}
    </>
  );
}
