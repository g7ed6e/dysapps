// Une valeur texte du Markdown du contenu : telle quelle, ou en chaîne JSON entre guillemets quand elle a un saut de
// ligne, des espaces au bord, qu'elle est vide ou qu'elle commence par « " ». Partagé par format.mjs, plans.mjs et portail.mjs.

export function aGuillemets(s) {
  return s === '' || s !== s.trim() || /[\n\r]/.test(s) || s.startsWith('"');
}

export function ecrireTexte(s) {
  return aGuillemets(s) ? JSON.stringify(s) : s;
}

export function lireTexte(v, ligne) {
  if (v === '' || v !== v.trim()) throw new Error(`ligne ${ligne} : valeur vide ou avec des espaces au bord : l’écrire entre guillemets (« "" »)`);
  if (v.startsWith('"')) {
    try {
      const s = JSON.parse(v);
      if (typeof s === 'string') return s;
    } catch {}
    throw new Error(`ligne ${ligne} : chaîne entre guillemets mal écrite : ${v}`);
  }
  return v;
}
