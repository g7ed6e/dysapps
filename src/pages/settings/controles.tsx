// Les contrôles des réglages, écrits une fois (qualité du code, lot 8) : une rangée de choix (police, couleurs, LV2,
// vue et lumière du monde) et un curseur (taille, espacements, vitesse de la voix).
import type { ReactNode } from 'react';

interface OptionRowProps<K extends string> {
  /** Le nom du groupe de boutons radio. */
  name: string;
  /** Les choix, dans l'ordre, et ce qu'ils affichent. */
  labels: Record<K, ReactNode>;
  value: K;
  onChange: (choix: K) => void;
  /** Les classes propres à un choix, après `option`. */
  optionClass?: (choix: K) => string;
  /** Le titre qui nomme la rangée, quand ce n'est pas la légende de son groupe. */
  labelledBy?: string;
}

export function OptionRow<K extends string>({ name, labels, value, onChange, optionClass, labelledBy }: OptionRowProps<K>) {
  return (
    <div className="option-row" role={labelledBy ? 'radiogroup' : undefined} aria-labelledby={labelledBy}>
      {(Object.keys(labels) as K[]).map((choix) => (
        <label key={choix} className={`option${optionClass ? ` ${optionClass(choix)}` : ''}${value === choix ? ' selected' : ''}`}>
          <input type="radio" name={name} value={choix} checked={value === choix} onChange={() => onChange(choix)} />
          {labels[choix]}
        </label>
      ))}
    </div>
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

export function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
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
