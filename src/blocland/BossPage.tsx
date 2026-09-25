import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useProgress } from '../core/ProgressContext';
import { useSettings } from '../core/SettingsContext';
import { NotFoundPage } from '../pages/NotFoundPage';
import { getBiome, isBiomeUnlocked } from './biomes';
import { useBlocland } from './BloclandContext';
import { STARS_TO_BEAT, bossDef, isBossBeaten, isBossUnlocked, missingForBoss } from './boss';
import { CreatureBubble } from './CreatureBubble';
import { ExerciseRunner } from './ExerciseRunner';
import { Guardian3D, type GuardianMood } from './Guardians';
import { playDrum, playGrowl, playVictory } from './sound';

/** Le Gardien d'un biome : le défi de fin de biome, une manche de chaque quête, dans son arène. */
export function BossPage() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const { beatBoss } = useProgress();
  const { settings, speak } = useSettings();
  const [run, setRun] = useState(0);
  const biome = getBiome(biomeId);
  const unlocked = Boolean(biome && isBiomeUnlocked(biome.id, state.progress) && isBossUnlocked(biome, state.progress));
  const alreadyBeaten = biome ? isBossBeaten(biome.id, state.progress) : false;
  // Le défi est tiré au lancement (et à chaque « Rejouer »), pas à chaque changement de progression.
  const def = useMemo(
    () => (biome && unlocked ? bossDef(biome, state) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [biome?.id, unlocked, run],
  );
  // L'arène : résistance du Gardien (une épreuve réussie = un cran de moins), humeur et réplique.
  const total = def?.items.length ?? 0;
  const [won, setWon] = useState(0);
  const [played, setPlayed] = useState(0);
  const [mood, setMood] = useState<GuardianMood>('idle');
  const [seq, setSeq] = useState(0);
  const [line, setLine] = useState<string | null>(null);
  const sound = (f: () => void) => settings.sounds && f();

  useEffect(() => {
    setWon(0);
    setPlayed(0);
    setMood('idle');
    setLine(null);
    if (def) sound(playDrum);
    // Au lancement et à chaque revanche.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def]);

  if (!biome) return <NotFoundPage />;
  const says = biome.guardianSays;
  const finished = def ? played >= total : false;
  const beatenNow = finished && won >= Math.ceil(total * 0.7);
  const remaining = Math.max(0, total - won);

  const onRound = ({ correct }: { correct: boolean }) => {
    const nextWon = won + (correct ? 1 : 0);
    const nextPlayed = played + 1;
    setWon(nextWon);
    setPlayed(nextPlayed);
    setSeq((n) => n + 1);
    const last = nextPlayed >= total;
    const victory = last && nextWon >= Math.ceil(total * 0.7);
    const text = victory ? says.beaten : correct ? says.hit : says.miss;
    setMood(victory ? 'beaten' : correct ? 'hit' : 'miss');
    setLine(text);
    if (victory) sound(playVictory);
    else if (!correct) sound(playGrowl);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  return (
    <>
      <Link to={`/aventure/${biome.id}`} className="back-link">
        <Icon name="back" /> {biome.name}
      </Link>
      <h1 className={`page-title biome-title biome-${biome.id}`}>
        <Icon name="shield" /> {biome.guardian}
      </h1>
      {!unlocked || !def ? (
        <>
          <CreatureBubble
            biome={biome}
            text={`${biome.guardian} n’accepte que les bâtisseurs entraînés. Obtiens ${STARS_TO_BEAT} étoiles dans chaque quête, puis reviens.`}
          />
          <p className="intro">
            <Syllabified text={`Il te manque encore des étoiles dans : ${missingForBoss(biome, state.progress).join(', ')}.`} />
          </p>
          <Link to={`/aventure/${biome.id}`} className="button primary">
            <Icon name="back" /> Voir les quêtes
          </Link>
        </>
      ) : (
        <>
          <section className={`arena${beatenNow ? ' arena-beaten' : ''}`} aria-label="L’arène du Gardien">
            <Guardian3D biome={biome.id} label={`${biome.guardian}, le Gardien du biome`} mood={mood} seq={seq} />
            <div className="arena-info">
              <p className="arena-name">{biome.guardian}</p>
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
                aria-valuetext={`${remaining} épreuves sur ${total} avant de le vaincre`}
              >
                <div className="arena-gauge-fill" style={{ width: `${total ? (remaining / total) * 100 : 0}%` }} />
              </div>
              <p className="arena-line" role="status" aria-live="polite">
                <Syllabified text={line ?? (alreadyBeaten ? `${biome.guardian} est déjà vaincu, mais il aime les revanches.` : biome.challenge)} />
              </p>
              <SpeakButton text={line ?? biome.challenge} label="Écouter" />
            </div>
          </section>
          <ExerciseRunner
            key={`${def.id}-${run}`}
            biome={biome}
            def={def}
            onReplay={() => setRun((r) => r + 1)}
            onRound={onRound}
            onComplete={(c) => {
              if (c.stars >= STARS_TO_BEAT && !alreadyBeaten) beatBoss();
            }}
          />
        </>
      )}
    </>
  );
}
