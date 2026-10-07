// Pour les tests : la largeur d'un texte dans une police de l'application (Luciole, la police par défaut, Atkinson
// Hyperlegible, OpenDyslexic, en gras), lue dans le fichier qui la sert à l'application (WOFF2 de public/fonts/luciole,
// WOFF des paquets @fontsource). Sans navigateur (jsdom ne mesure aucun texte), on lit la chasse de chaque caractère
// (tables `cmap`, `hhea`, `hmtx`, `head`) ; le crénage est ignoré.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { brotliDecompressSync, inflateSync } from 'node:zlib';

export type PoliceDeTest = 'luciole' | 'atkinson-hyperlegible' | 'opendyslexic';

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

/** Les 63 étiquettes connues du format WOFF2, par leur numéro (drapeau de 0 à 62 ; 63 : l'étiquette suit). */
const ETIQUETTES_WOFF2 =
  'cmap head hhea hmtx maxp name OS/2 post cvt  fpgm glyf loca prep CFF  VORG EBDT EBLC gasp hdmx kern LTSH PCLT VDMX vhea vmtx BASE GDEF GPOS GSUB EBSC JSTF MATH CBDT CBLC COLR CPAL SVG  sbix acnt avar bdat bloc bsln cvar fdsc feat fmtx fvar gvar hsty just lcar mort morx opbd prop trak Zapf Silf Glat Gloc Feat Sill'.match(
    /.{4}\s?/g,
  )!.map((e) => e.slice(0, 4));

/**
 * Les tables d'une police WOFF2 (un seul flux Brotli). Celles lues ici (`cmap`, `head`, `hhea`, `hmtx`) n'y sont pas
 * transformées ; une `hmtx` transformée (rare) arrête le test plutôt que de le fausser.
 */
function tablesWoff2(buf: Buffer): Map<string, Buffer> {
  const n = buf.readUInt16BE(12);
  const taille = buf.readUInt32BE(20);
  let o = 48;
  const base128 = () => {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const b = buf[o++];
      v = v * 128 + (b & 0x7f);
      if (!(b & 0x80)) return v;
    }
    throw new Error('UIntBase128 trop long');
  };
  const entrees: { tag: string; longueur: number }[] = [];
  for (let i = 0; i < n; i++) {
    const drapeau = buf[o++];
    const tag = (drapeau & 0x3f) === 63 ? buf.toString('latin1', o, (o += 4)) : ETIQUETTES_WOFF2[drapeau & 0x3f];
    const version = drapeau >> 6;
    const longueur = base128();
    const transformee = tag === 'glyf' || tag === 'loca' ? version !== 3 : version !== 0;
    if (transformee && tag === 'hmtx') throw new Error('hmtx transformée : non lue');
    entrees.push({ tag, longueur: transformee ? base128() : longueur });
  }
  const flux = brotliDecompressSync(buf.subarray(o, o + taille));
  const out = new Map<string, Buffer>();
  let p = 0;
  for (const { tag, longueur } of entrees) {
    out.set(tag, flux.subarray(p, p + longueur));
    p += longueur;
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
    const t =
      police === 'luciole'
        ? tablesWoff2(readFileSync(resolve(process.cwd(), 'public/fonts/luciole/Luciole-Bold.woff2')))
        : tables(readFileSync(require.resolve(`@fontsource/${police}/files/${police}-latin-700-normal.woff`)));
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
