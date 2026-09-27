import { useState } from 'react';
import { DEFAULT_SETTINGS, FONT_LABELS, MIN_FONT_SIZE, MIN_LINE_HEIGHT, THEME_LABELS, spacingWord, speedWord, WORLD_VIEW_LABELS, type FontChoice, type ThemeChoice, type WorldViewChoice } from '../core/settings';
import { useSettings } from '../core/SettingsContext';
import { useProgress } from '../core/ProgressContext';
import { isSpeechAvailable } from '../core/speech';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { APP_VERSION, applyUpdate, checkForUpdate, useAppUpdate } from '../core/appUpdate';

const SAMPLE = 'Le bâtisseur range ses blocs de bois dans la cabane. Il en a 3, il en pose 2 : il en reste 1.';
const SAMPLE_EN = 'Hello! My name is Robin. I have got three blue blocks.';

export function SettingsPage() {
  const { settings, update, reset, speak } = useSettings();
  const { resetProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [typed, setTyped] = useState('');
  const appUpdate = useAppUpdate();

  return (
    <>
      <h1 className="page-title">Réglages</h1>

      <div className="panel preview" aria-label="Aperçu">
        <p>
          <Syllabified text={SAMPLE} />
        </p>
      </div>

      <form className="settings" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="panel">
          <legend>Police d’écriture</legend>
          <div className="option-row">
            {(Object.keys(FONT_LABELS) as FontChoice[]).map((font) => (
              <label key={font} className={`option font-${font}${settings.font === font ? ' selected' : ''}`}>
                <input type="radio" name="font" value={font} checked={settings.font === font} onChange={() => update({ font })} />
                {FONT_LABELS[font]}
              </label>
            ))}
          </div>
          <p className="font-credit">
            Police Luciole © Laurent Bourcellier & Jonathan Fabreguettes (Perez), typographies.fr, sous licence{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/deed.fr" target="_blank" rel="noopener noreferrer">
              CC BY 4.0
            </a>
            .
          </p>
        </fieldset>

        <fieldset className="panel">
          <legend>Lecture</legend>
          <label className="toggle">
            <input type="checkbox" checked={settings.syllables} onChange={(e) => update({ syllables: e.target.checked })} />
            Syllabes en couleurs alternées
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.autoRead} onChange={(e) => update({ autoRead: e.target.checked })} />
            Lire les consignes à voix haute dès qu’elles apparaissent
          </label>
        </fieldset>

        <fieldset className="panel">
          <legend>Couleurs</legend>
          <div className="option-row">
            {(Object.keys(THEME_LABELS) as ThemeChoice[]).map((theme) => (
              <label key={theme} className={`option theme-swatch theme-${theme}${settings.theme === theme ? ' selected' : ''}`}>
                <input type="radio" name="theme" value={theme} checked={settings.theme === theme} onChange={() => update({ theme })} />
                {THEME_LABELS[theme]}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="panel">
          <legend>Espacements</legend>
          <Slider
            label="Taille du texte"
            value={settings.fontSize}
            min={MIN_FONT_SIZE}
            max={32}
            step={1}
            display={`${settings.fontSize} px`}
            onChange={(fontSize) => update({ fontSize })}
          />
          <Slider
            label="Espace entre les lignes"
            value={settings.lineHeight}
            min={MIN_LINE_HEIGHT}
            max={2.4}
            step={0.1}
            display={spacingWord(settings.lineHeight, DEFAULT_SETTINGS.lineHeight, 2.4)}
            onChange={(lineHeight) => update({ lineHeight })}
          />
          <Slider
            label="Espace entre les lettres"
            value={settings.letterSpacing}
            min={0}
            max={0.2}
            step={0.01}
            display={spacingWord(settings.letterSpacing, DEFAULT_SETTINGS.letterSpacing, 0.2)}
            onChange={(letterSpacing) => update({ letterSpacing })}
          />
          <Slider
            label="Espace entre les mots"
            value={settings.wordSpacing}
            min={0}
            max={0.5}
            step={0.02}
            display={spacingWord(settings.wordSpacing, DEFAULT_SETTINGS.wordSpacing, 0.5)}
            onChange={(wordSpacing) => update({ wordSpacing })}
          />
        </fieldset>

        <fieldset className="panel">
          <legend>Voix</legend>
          {isSpeechAvailable() ? (
            <>
              <Slider
                label="Vitesse de lecture"
                value={settings.speechRate}
                min={0.5}
                max={1.3}
                step={0.1}
                display={speedWord(settings.speechRate)}
                onChange={(speechRate) => update({ speechRate })}
              />
              <button type="button" className="button" onClick={() => speak(SAMPLE)}>
                <Icon name="speaker" /> Tester la voix
              </button>
              {/* Les mots et phrases d'anglais sont lus avec une voix anglaise (britannique si l'appareil en a une). */}
              <button type="button" className="button" onClick={() => speak(SAMPLE_EN, undefined, 'en')}>
                <Icon name="speaker" /> Tester la voix anglaise
              </button>
            </>
          ) : (
            <p>La lecture à voix haute n’est pas disponible sur ce navigateur.</p>
          )}
        </fieldset>

        <fieldset className="panel">
          <legend>Vue de Blocland</legend>
          <div className="option-row">
            {(Object.keys(WORLD_VIEW_LABELS) as WorldViewChoice[]).map((worldView) => (
              <label key={worldView} className={`option${settings.worldView === worldView ? ' selected' : ''}`}>
                <input type="radio" name="worldView" value={worldView} checked={settings.worldView === worldView} onChange={() => update({ worldView })} />
                {WORLD_VIEW_LABELS[worldView]}
              </label>
            ))}
          </div>
          <p>Si l’appareil ne sait pas dessiner le monde en 3D, Blocland montre le monde en 2D ; s’il ne sait rien dessiner, la liste des îles.</p>
          <label className="toggle">
            <input type="checkbox" checked={settings.freeWalk} onChange={(e) => update({ freeWalk: e.target.checked })} />
            Marche libre dans le monde en 2D (une croix de direction et un bouton « Entrer »)
          </label>
        </fieldset>

        <fieldset className="panel">
          <legend>Animations</legend>
          <label className="toggle">
            <input type="checkbox" checked={settings.reduceMotion} onChange={(e) => update({ reduceMotion: e.target.checked })} />
            Réduire les animations
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.sounds} onChange={(e) => update({ sounds: e.target.checked })} />
            Sons dans le village (poser, retirer un bloc)
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.ambience} onChange={(e) => update({ ambience: e.target.checked })} />
            Ambiance sonore du village (vent, oiseaux le jour, grillons la nuit)
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.haptics} onChange={(e) => update({ haptics: e.target.checked })} />
            Vibrer à la bonne réponse et à la pose d’un bloc (téléphones Android)
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.appBadge} onChange={(e) => update({ appBadge: e.target.checked })} />
            Pastille sur l’icône de l’appli quand des révisions attendent
          </label>
        </fieldset>

        <fieldset className="panel">
          <legend>Application</legend>
          <p className="settings-version">Version {APP_VERSION}.</p>
          {appUpdate.ready ? (
            <button type="button" className="button primary" onClick={() => void applyUpdate()}>
              Mettre à jour maintenant
            </button>
          ) : (
            <button type="button" className="button" disabled={appUpdate.checking} onClick={() => void checkForUpdate()}>
              {appUpdate.checking ? 'Recherche…' : 'Vérifier les mises à jour'}
            </button>
          )}
          <p className="settings-note" role="status" aria-live="polite">
            {appUpdate.ready
              ? 'Une nouvelle version est prête : elle s’installe en un clic, puis la page se recharge.'
              : appUpdate.checked === 'aucune'
                ? 'Tu as la dernière version.'
                : appUpdate.checked === 'hors-ligne'
                  ? 'Pas de connexion : réessaie plus tard.'
                  : 'L’application se met à jour toute seule ; ce bouton sert à ne pas attendre.'}
          </p>
        </fieldset>

        <div className="actions">
          <button type="button" className="button" onClick={reset}>
            Affichage par défaut
          </button>
        </div>

        {/* Loin des autres boutons, et il faut écrire un mot : un doigt qui glisse n'efface rien. */}
        <fieldset className="panel danger-zone">
          <legend>Effacer ma progression</legend>
          <p>XP, succès, étoiles, blocs et bâtiments seront perdus. Les réglages restent.</p>
          {confirmReset ? (
            <>
              <label className="confirm-word">
                Pour confirmer, écris <strong>effacer</strong> :
                <input type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} />
              </label>
              <div className="actions">
                <button
                  type="button"
                  className="button danger"
                  disabled={typed.trim().toLowerCase() !== 'effacer'}
                  onClick={() => {
                    resetProgress();
                    setConfirmReset(false);
                    setTyped('');
                  }}
                >
                  Tout effacer
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setConfirmReset(false);
                    setTyped('');
                  }}
                >
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="button danger" onClick={() => setConfirmReset(true)}>
              Effacer ma progression…
            </button>
          )}
        </fieldset>
      </form>
    </>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  return (
    <label className="slider">
      <span className="slider-label">
        {label} <output>{display}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
