import type { ReactNode } from 'react';
import { DEFAULT_SETTINGS, FONT_LABELS, MIN_FONT_SIZE, MIN_LINE_HEIGHT, THEME_LABELS, spacingWord, speedWord, WORLD_LIGHT_LABELS, WORLD_VIEW_LABELS, type FontChoice } from '../core/settings';
import { useSettings } from '../core/SettingsContext';
import { isSpeechAvailable } from '../core/speech';
import { Icon } from '../components/Icon';
import { SaveFilePanel } from '../components/SaveFilePanel';
import { Syllabified } from '../components/Syllabified';
import { OptionRow, Slider } from './settings/controls';
import { Lv2Section } from './settings/Lv2Section';
import { LcaSection } from './settings/LcaSection';
import { UniverseSection } from './settings/UniverseSection';
import { ApplicationSection } from './settings/ApplicationSection';
import { EraseSection } from './settings/EraseSection';

const SAMPLE = 'Le bâtisseur range ses blocs de bois dans la cabane. Il en a 3, il en pose 2 : il en reste 1.';
const SAMPLE_EN = 'Hello! My name is Robin. I have three blue blocks.';

/** Le nom de chaque police, dans sa case. */
const FONT_NAMES = Object.fromEntries((Object.keys(FONT_LABELS) as FontChoice[]).map((font) => [font, <span>{nomCoupable(FONT_LABELS[font])}</span>])) as Record<FontChoice, ReactNode>;

export function SettingsPage() {
  const { settings, update, reset, speak } = useSettings();

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
          <OptionRow name="font" labels={FONT_NAMES} value={settings.font} onChange={(font) => update({ font })} optionClass={(font) => `font-${font}`} />
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
          <OptionRow name="theme" labels={THEME_LABELS} value={settings.theme} onChange={(theme) => update({ theme })} optionClass={(theme) => `theme-swatch theme-${theme}`} />
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

        <Lv2Section />

        <LcaSection />

        <fieldset className="panel">
          <legend>Vue du monde</legend>
          <OptionRow name="worldView" labels={WORLD_VIEW_LABELS} value={settings.worldView} onChange={(worldView) => update({ worldView })} />
          <p>Si l’appareil ne sait pas dessiner le monde en 3D, l’appli montre la liste des îles.</p>
          {/* Le soleil et la lune de la barre du village vivent ici : un réglage qui reste (allègement, point 2). */}
          <p id="reglage-lumiere">La lumière du monde</p>
          <OptionRow name="worldLight" labels={WORLD_LIGHT_LABELS} value={settings.worldLight} onChange={(worldLight) => update({ worldLight })} labelledBy="reglage-lumiere" />
          <p>Avec l’heure réelle, la nuit tombe le soir sur le village.</p>
        </fieldset>

        <fieldset className="panel">
          <legend>Sons, vibrations et pastille</legend>
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

        <UniverseSection />

        <ApplicationSection />

        <SaveFilePanel />

        <div className="actions">
          <button type="button" className="button" onClick={reset}>
            Affichage par défaut
          </button>
        </div>

        <EraseSection />
      </form>
    </>
  );
}

/**
 * Le nom d'une police, avec l'endroit où il peut passer à la ligne sans trait d'union (DA-16) : en grand texte sur
 * téléphone, « OpenDyslexic » et « Hyperlegible » sont plus larges que la case, et se coupaient au hasard.
 */
function nomCoupable(nom: string) {
  return nom.split(/(?=Dyslexic|legible)/).map((part, i) => (i === 0 ? part : [<wbr key={i} />, part]));
}
