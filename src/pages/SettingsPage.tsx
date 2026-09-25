import { useState } from 'react';
import { FONT_LABELS, MIN_FONT_SIZE, MIN_LINE_HEIGHT, THEME_LABELS, type FontChoice, type ThemeChoice } from '../core/settings';
import { useSettings } from '../core/SettingsContext';
import { useProgress } from '../core/ProgressContext';
import { isSpeechAvailable } from '../core/speech';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';

const SAMPLE = 'Le bâtisseur range ses blocs de bois dans la cabane. Il en a 3, il en pose 2 : il en reste 1.';

export function SettingsPage() {
  const { settings, update, reset, speak } = useSettings();
  const { resetProgress } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

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
            display={settings.lineHeight.toFixed(1)}
            onChange={(lineHeight) => update({ lineHeight })}
          />
          <Slider
            label="Espace entre les lettres"
            value={settings.letterSpacing}
            min={0}
            max={0.2}
            step={0.01}
            display={settings.letterSpacing.toFixed(2)}
            onChange={(letterSpacing) => update({ letterSpacing })}
          />
          <Slider
            label="Espace entre les mots"
            value={settings.wordSpacing}
            min={0}
            max={0.5}
            step={0.02}
            display={settings.wordSpacing.toFixed(2)}
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
                display={`× ${settings.speechRate.toFixed(1)}`}
                onChange={(speechRate) => update({ speechRate })}
              />
              <button type="button" className="button" onClick={() => speak(SAMPLE)}>
                <Icon name="speaker" /> Tester la voix
              </button>
            </>
          ) : (
            <p>La lecture à voix haute n’est pas disponible sur ce navigateur.</p>
          )}
        </fieldset>

        <fieldset className="panel">
          <legend>Animations</legend>
          <label className="toggle">
            <input type="checkbox" checked={settings.reduceMotion} onChange={(e) => update({ reduceMotion: e.target.checked })} />
            Réduire les animations
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.view3d} onChange={(e) => update({ view3d: e.target.checked })} />
            Vues en 3D dans Blocland (sinon, vue simple)
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.sounds} onChange={(e) => update({ sounds: e.target.checked })} />
            Sons dans le village (poser, retirer un bloc)
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.ambience} onChange={(e) => update({ ambience: e.target.checked })} />
            Ambiance sonore du village (vent, oiseaux le jour, grillons la nuit)
          </label>
          <Slider
            label="Sensibilité de la caméra dans le village"
            value={settings.cameraSpeed}
            min={0.5}
            max={2}
            step={0.25}
            display={`× ${settings.cameraSpeed.toFixed(2).replace(/\.?0+$/, '')}`}
            onChange={(cameraSpeed) => update({ cameraSpeed })}
          />
        </fieldset>

        <div className="actions">
          <button type="button" className="button" onClick={reset}>
            Affichage par défaut
          </button>
          {confirmReset ? (
            <>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                }}
              >
                Oui, tout effacer
              </button>
              <button type="button" className="button" onClick={() => setConfirmReset(false)}>
                Annuler
              </button>
            </>
          ) : (
            <button type="button" className="button danger" onClick={() => setConfirmReset(true)}>
              Effacer ma progression
            </button>
          )}
        </div>
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
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
