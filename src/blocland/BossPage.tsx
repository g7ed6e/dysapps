import { useEffect, useMemo, useState } from 'react';
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
import { STARS_TO_BEAT, bossDef, isBossBeaten, isBossUnlocked, missingForBoss } from './boss';
import { CreatureBubble } from './CreatureBubble';
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
  const unlocked = Boolean(biome && isBiomeUnlocked(biome.id, state.village.bridges) && isBossUnlocked(biome, state.progress));
  const alreadyBeaten = biome ? isBossBeaten(biome.id, state.progress) : false;
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
    () => (loaded && sent && biome ? { ...loaded, instruction: sent.consigne(guardianTitle(biome), total, needed) } : (loaded ?? undefined)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded, sent],
  );
  // L'arène : résistance du Gardien (une épreuve réussie = un cran de moins), humeur et réplique.
  const [won, setWon] = useState(0);
  const [played, setPlayed] = useState(0);
  const [mood, setMood] = useState<GuardianMood>('idle');
  const [seq, setSeq] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  // Ce Gardien vaincu fait arriver le kit du Bloc-Navire (la voile, le ballon, les feux) : on le dit, avec le chemin du port.
  const [shipHint, setShipHint] = useState<VehicleStage | null>(null);
  const sound = (f: () => void) => settings.sounds && f();

  useEffect(() => {
    setWon(0);
    setPlayed(0);
    setMood('idle');
    setLine(null);
    // Pas de tambour pour une sentinelle : rien ne se combat.
    if (def && !sent) sound(playDrum);
    // Au lancement et à chaque revanche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def]);

  if (!biome) return <NotFoundPage />;
  const { challenge, guardianSays: says } = textes.gardiens[biome.id];
  // Ce que dit l'arène, écrit et lu à l'identique.
  const arenaLine = line ?? (alreadyBeaten ? textes.libelles.dejaFaitArene(guardianTitle(biome)) : challenge);
  const finished = def ? played >= total : false;
  const beatenNow = finished && won >= needed;
  const remaining = Math.max(0, total - won);

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
    if (victory) sound(playVictory);
    // Une épreuve ratée n'a jamais de son dans Archipéo (rien ne s'éteint) ; Blocland garde le grognement.
    else if (!correct && !sent) sound(playGrowl);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  return (
    <>
      <Link to={`/aventure/${biome.id}`} className="back-link">
        <Icon name="back" /> {biome.name}
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name={sent ? 'flame' : 'shield'} /> {guardianTitle(biome)}
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
          <Link to={`/aventure/${biome.id}`} className="button primary">
            <Icon name="back" /> Voir les missions
          </Link>
        </>
      ) : (
        <>
          {sent && def && (
            // La règle du rallumage, au même endroit à chaque défi : avant l'arène, lue à la demande.
            <div className="consigne arena-regle">
              <p className="consigne-text">
                <Syllabified text={def.instruction} />
              </p>
              <SpeakButton text={def.instruction} label="Consigne" compact />
            </div>
          )}
          <section
            className={`arena${sent ? ' arena-sentinelle' : ''}${beatenNow && !sent ? ' arena-beaten' : ''}`}
            aria-label={textes.libelles.arene(biome.guardian)}
          >
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
            <div className="arena-info">
              <p className="arena-name">{guardianTitle(biome)}</p>
              {sent ? (
                <>
                  <div className="arena-gauge-label" aria-hidden="true">
                    <span>{sent.jauge}</span>
                    <span>{sent.compte(won, total)}</span>
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
                  <p className="arena-seuil">
                    <Syllabified text={sent.seuil(needed, won >= needed)} />
                  </p>
                </>
              ) : (
                <>
                  <div className="arena-gauge-label" aria-hidden="true">
                    <span>Résistance</span>
                    <span>
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
                </>
              )}
              <p className="arena-line" role="status" aria-live="polite">
                <Syllabified text={arenaLine} />
              </p>
              <SpeakButton text={arenaLine} label="Écouter" />
            </div>
          </section>
          {shipHint && (
            <p className="panel ship-hint" role="status" aria-live="polite">
              <Icon name="ship" />{' '}
              <Syllabified text={`Le Bloc-Navire a ses Gardiens : ${shipHint.short} est là ! Va au port, sur ${getBiome(shipHint.biome)?.name ?? shipHint.biome}, finir de le construire.`} />{' '}
              <Link to={`/aventure/${getArchipelago(shipHint.from).port}`} className="button">
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
