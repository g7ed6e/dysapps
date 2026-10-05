// Pour les tests : la largeur d'un texte dans une police de l'application (Atkinson Hyperlegible, OpenDyslexic, en
// gras), lue dans le fichier WOFF du paquet qui la sert à l'application. Sans navigateur (jsdom ne mesure aucun
// texte), on lit la chasse de chaque caractère (tables `cmap`, `hhea`, `hmtx`, `head`) ; le crénage est ignoré.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { inflateSync } from 'node:zlib';

export type PoliceDeTest = 'atkinson-hyperlegible' | 'opendyslexic';

function tables(buf: Buffer): Map<string, Buffer> {
  const n = buf.readUInt16BE(12);
  const out = new Map<string, Buffer>();
  for (let i = 0; i < n; i++) {
    const o = 44 + i * 20;
    const tag = buf.toString('latin1', o, o + 4);
    const off = buf.readUInt32BE(o + 4);
    const comp = buf.readUInt32BE(o + 8);
    const orig = buf.readUInt32BE(o + 12);
    const raw = buf.subarray(off, off + comp);
    out.set(tag, comp < orig ? inflateSync(raw) : raw);
  }
  return out;
}

/** La table des caractères (format 4 : le plan de base, qui suffit aux noms des îles). */
function glyphes(cmap: Buffer): (code: number) => number {
  const n = cmap.readUInt16BE(2);
  for (let i = 0; i < n; i++) {
    const off = cmap.readUInt32BE(4 + i * 8 + 4);
    if (cmap.readUInt16BE(off) !== 4) continue;
    const seg = cmap.readUInt16BE(off + 6) / 2;
    const ends = off + 14;
    const starts = ends + seg * 2 + 2;
    const deltas = starts + seg * 2;
    const ranges = deltas + seg * 2;
    return (code) => {
      for (let s = 0; s < seg; s++) {
        if (cmap.readUInt16BE(ends + s * 2) < code) continue;
        const start = cmap.readUInt16BE(starts + s * 2);
        if (start > code) return 0;
        const delta = cmap.readInt16BE(deltas + s * 2);
        const ro = cmap.readUInt16BE(ranges + s * 2);
        if (!ro) return (code + delta) & 0xffff;
        const g = cmap.readUInt16BE(ranges + s * 2 + ro + (code - start) * 2);
        return g ? (g + delta) & 0xffff : 0;
      }
      return 0;
    };
  }
  throw new Error('cmap au format 4 introuvable');
}

const cache = new Map<PoliceDeTest, (texte: string) => number>();

/** La largeur d'un texte en gras, en cadratins (à multiplier par la taille de la police). */
export function largeurEnGras(police: PoliceDeTest): (texte: string) => number {
  let f = cache.get(police);
  if (!f) {
    const require = createRequire(import.meta.url);
    const t = tables(readFileSync(require.resolve(`@fontsource/${police}/files/${police}-latin-700-normal.woff`)));
    const em = t.get('head')!.readUInt16BE(18);
    const nh = t.get('hhea')!.readUInt16BE(34);
    const hmtx = t.get('hmtx')!;
    const glyphe = glyphes(t.get('cmap')!);
    const chasse = (g: number) => hmtx.readUInt16BE(Math.min(g, nh - 1) * 4) / em;
    f = (texte) => [...texte].reduce((s, c) => s + chasse(glyphe(c.codePointAt(0)!)), 0);
    cache.set(police, f);
  }
  return f;
}
