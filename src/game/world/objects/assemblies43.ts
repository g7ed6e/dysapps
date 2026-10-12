// Les petites constructions du 4e et du 3e d'Archipéo faites des pièces communes (piste 3 « hybride » au 4e et au 3e,
// intention du directeur artistique du 12 octobre 2026 ; même méthode qu'au 6e et au 5e, ./assemblies.ts) : chacune pose,
// sur les cases de sa forme (world/fixtures.ts), les pièces qui lui vont, la matière du bloc livré sur la plus grande
// face de l'objet, dans les couleurs mêmes du bloc (règle GD-7). La même dessinée de près et de loin. Code pur, sans
// Three.js.
//
// Étape 1 : la veilleuse d'Olive (sa vitre allumée la nuit, sans flamme ni halo).
import { BLOC } from '../../biomes';
import { postLantern } from './pieces';
import type { ObjectDrawing } from './silhouettes';

/** Les mesures de la veilleuse d'Olive : le pied de cire, son fût, le savon posé à côté. */
const NIGHT_LIGHT = { foot: { side: 0.8, upper: 0.3 }, shaft: 0.5, soap: { x: 1.5, lx: 0.62, ly: 0.5, upper: 0.36 } } as const;

/**
 * La veilleuse d'Olive (le poteau-lanterne de Grimoire, en cire) : un pied carré et un fût de cire livrée jusqu'à la tête
 * de lanterne des cours, son toit dans les rives du 3e (le rôle `lanternRoof`) ; sa vitre pleine et unie, allumée la nuit
 * comme toutes les lanternes, sans flamme dessinée ni halo (« sans flamme », SC-3) ; le savon posé à son pied.
 */
const nightLight: ObjectDrawing = (at, pe) => {
  const wax = pe.block(BLOC.cire);
  const { foot, shaft, soap } = NIGHT_LIGHT;
  at.block(0.5, 0.5, foot.side, foot.side, 0, foot.upper, wax);
  at.block(0.5, 0.5, shaft, shaft, foot.upper, 2, wax, { bottom: true, top: true });
  postLantern(at, pe, 0, 0, null, 2);
  at.block(soap.x, 0.5, soap.lx, soap.ly, 0, soap.upper, pe.block(BLOC.savon));
};

/** Les petites constructions du 4e et du 3e faites de pièces communes, par identifiant (world/fixtures.ts). */
export const ASSEMBLIES_43: Readonly<Record<string, ObjectDrawing>> = {
  'life-earth-sciences-3e-human-body-fixture-1': nightLight,
};
