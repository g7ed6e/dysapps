/** Écran d'attente : le bloc d'herbe qui sautille et une phrase courte (au lieu d'un simple « Chargement… »). */
export function Loading({ text = 'Chargement…', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`loading${className ? ` ${className}` : ''}`} role="status">
      <img className="loading-block" src={`${import.meta.env.BASE_URL}archipeo.svg`} alt="" width={72} height={72} />
      <p>{text}</p>
    </div>
  );
}
