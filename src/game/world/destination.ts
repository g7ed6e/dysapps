// La prochaine destination de l'élève dans son archipel : une île, une phrase et une jauge, pour « Reprendre
// l'aventure » au menu et la Carte. Code pur, déduit de la sauvegarde à chaque rendu, sans rien y ajouter.
import { getBiome, missionsJouables, type BiomeId } from '../biomes';
import { lv2Courante, type Lv2Choice } from '../../core/settings';
import { canLaunch, type GameState } from '../engine';
import { archipelagoOf, islandsOf, reachableIslands, type MotsDesGardiens, type NomsArchipels } from './archipelago';
import { questProgress } from '../exercises';
import { nextGoalInfo, ouvrageSuggere } from './goals';
import { isUnexplored } from './islandState';
import { villageStage } from './villageStage';
import { stageAt } from './vehicle';
import type { Goal } from './goals';
import { commandeMiseEnAvant, texteDeLaCommande } from './requests';
import { lieuDAssemblage } from './assembly';
import { canTapStep, openStoryOf, stepText } from './stories';

export interface Destination {
  island: BiomeId;
  /** Le nom de l'île. */
  name: string;
  /** Ce qu'il y a à y faire, en une phrase qui se termine par un point. */
  text: string;
  /** La jauge (0 sur 0 quand rien ne se compte). */
  have: number;
  need: number;
  /**
   * L'ouvrage que la phrase propose de construire (GD-7), quand c'en est un : son identifiant. La Carte pose sa flèche
   * au-dessus de lui, avec l'icône d'un ouvrage, pour le distinguer des autres fantômes de l'île.
   */
  ouvrage?: string;
  /**
   * La commande prête à livrer que la phrase propose (GD-7, PR 3), quand c'en est une : son identifiant. « Y aller »
   * ouvre l'île de la créature sur sa ligne, dans le pli Commandes.
   */
  commande?: string;
  /**
   * La quête dont l'étape en cours se fait d'un toucher chez l'habitant de l'île (GD-10) : son identifiant. Elle se
   * montre comme une commande prête : le signe de la créature, sa fiche, sa ligne.
   */
  story?: string;
  /**
   * La mission jamais jouée que la phrase propose (une île où il reste des missions) : la première de l'île. Sa borne
   * porte la bulle mise en avant (proposition P2, world/affordance.ts).
   */
  mission?: string;
}

/**
 * Où mènent « Y aller » et « Reprendre l'aventure » : l'île de la destination ; quand c'est un ouvrage, avec lui en
 * `worksite`, comme « Voir le chantier » : le pli Ouvrages s'ouvre sur sa ligne, mise en avant.
 */
export function lienDeLaDestination(d: Pick<Destination, 'island' | 'ouvrage' | 'commande' | 'story'>): string {
  const mise = d.ouvrage ?? d.commande ?? d.story;
  return `/adventure/${d.island}${mise ? `?worksite=${encodeURIComponent(mise)}` : ''}`;
}

/**
 * La destination est-elle la Nef (son chantier, ou son départ) ? Le port de son archipel, sans ouvrage ni
 * commande, et sa phrase est l'objectif du navire : le prochain objectif du port (`objectifDuPort`, `nextGoalInfo`),
 * quand ce n'est pas un ouvrage. « Y aller » ouvre alors la fiche du navire (lot 2 de « Toucher le monde »).
 */
export function laDestinationEstLeNavire(d: Destination, objectifDuPort: Goal | null): boolean {
  const port = archipelagoOf(d.island).port;
  if (d.island !== port || d.ouvrage || d.commande || d.story || !stageAt(port)) return false;
  return Boolean(objectifDuPort && !objectifDuPort.ouvrage && objectifDuPort.text === d.text);
}

/**
 * La prochaine destination, dans l'archipel où se tient le bonhomme : une seule suggestion, qui suit l'élève (GD-7,
 * point 3), la même au menu, sur la Carte et en vue simple. Ordre :
 * 1. la Nef prêt à partir (le port) ;
 * 2. l'île où se tient le bonhomme, où l'élève est allé de lui-même, quand il y reste quelque chose à faire tout de
 *    suite (un objectif prêt, une mission jamais jouée) ;
 * 3. la plus ancienne commande prête à livrer de l'archipel (GD-7, PR 3, world/requests.ts) : l'île de sa créature,
 *    avec sa phrase « prête » (un univers qui ne montre pas les commandes passe un état `sansCommandes`) ;
 * 3 bis. l'étape en cours de la quête de la région (GD-10, world/stories.ts) : un toucher chez son habitant (avec
 *    assez de blocs pour « donner »), ou une mission de son lieu, dont la borne est mise en avant ;
 * 4. une île ouverte pas encore explorée ;
 * 5. l'ouvrage suggéré (`ouvrageSuggere`) : celui qu'on peut payer et qui ouvre une île de la matière la moins jouée ;
 *    sans assez de blocs, ce qu'il en manque ; la destination est l'île d'où il part, et sa phrase est l'objectif de
 *    cette île (`nextGoalInfo`, une seule source : le panneau de l'île dit la même chose) ;
 * 6. sinon l'objectif qui demande le moins de blocs (la Nef) ; rien à faire : le port, avec ce qu'il faut pour
 *    que le village avance.
 * Déduite de la sauvegarde seule, sans hasard ni horloge : elle ne change pas tant que l'élève n'a rien fait. `noms` :
 * les noms des archipels de l'univers affiché ; `mots` : ses mots pour les Gardiens ; `lv2` : la LV2 choisie.
 */
export function nextDestination(state: GameState, noms: NomsArchipels, mots: MotsDesGardiens, lv2: Lv2Choice = lv2Courante()): Destination {
  const at = state.world.place ?? 'french-6e-phonology';
  const archipelago = archipelagoOf(at);
  const open = reachableIslands(state.world.links);
  const islands = islandsOf(archipelago.classe)
    .map((b) => b.id)
    .filter((id) => open.has(id));
  const make = (island: BiomeId, text: string, have = 0, need = 0, ouvrage?: string, commande?: string): Destination => ({
    island,
    name: getBiome(island)?.name ?? island,
    text,
    have,
    need,
    ...(ouvrage ? { ouvrage } : {}),
    ...(commande ? { commande } : {}),
  });

  // 1. La Nef prêt à partir.
  const port = archipelago.port;
  const stage = stageAt(port);
  if (stage && open.has(port) && canLaunch(state, stage).ok) {
    const goal = nextGoalInfo(state, port, noms, mots, lv2);
    return make(port, goal?.text ?? 'La Nef est prête.', 1, 1);
  }
  // 2. L'île où il est : un objectif prêt, sinon une mission jamais jouée.
  if (open.has(at)) {
    const goal = nextGoalInfo(state, at, noms, mots, lv2);
    if (goal?.ready) return make(at, goal.text, goal.have, goal.need, goal.ouvrage);
    const mission = missionAJouer(state, at);
    if (mission) return { ...make(at, isUnexplored(state, at) ? A_EXPLORER : 'Tu y es : d’autres missions t’attendent.'), mission };
  }
  // 3. La plus ancienne commande prête à livrer de l'archipel : chez sa créature (GD-7, PR 3).
  const prete = commandeMiseEnAvant(state, archipelago.classe);
  if (prete && open.has(prete.biome))
    return make(prete.biome, texteDeLaCommande(prete, 'ready', lieuDAssemblage('blocland').a), prete.count, prete.count, undefined, prete.id);
  // 3 bis. L'étape en cours de la quête de la région (GD-10).
  const story = openStoryOf(state.world, archipelago.classe);
  if (story && open.has(story.step.place)) {
    if (canTapStep(state, story.step)) return { ...make(story.step.place, stepText(story.step)), story: story.story.id };
    if (story.step.kind === 'mission') {
      const biome = getBiome(story.step.place);
      const mission = missionAJouer(state, story.step.place) ?? (biome && missionsJouables(biome)[0]?.id);
      if (mission) return { ...make(story.step.place, stepText(story.step)), mission };
    }
  }
  // 4. Une île ouverte pas encore explorée.
  for (const island of islands) {
    const mission = island !== at && isUnexplored(state, island) ? missionAJouer(state, island) : null;
    if (mission) return { ...make(island, A_EXPLORER), mission };
  }
  // 5. L'ouvrage suggéré.
  const ouvrage = ouvrageSuggere(state, archipelago.classe, lv2);
  if (ouvrage) {
    const goal = nextGoalInfo(state, ouvrage.ile, noms, mots, lv2) ?? ouvrage.goal;
    return make(ouvrage.ile, goal.text, goal.have, goal.need, goal.ouvrage);
  }
  // 6. L'objectif le plus proche, sinon le village.
  const counted = islands.flatMap((island) => {
    const goal = nextGoalInfo(state, island, noms, mots, lv2);
    return goal ? [{ island, goal }] : [];
  });
  if (counted.length) {
    const closest = counted.reduce((a, b) => (b.goal.need - b.goal.have < a.goal.need - a.goal.have ? b : a));
    return make(closest.island, closest.goal.text, closest.goal.have, closest.goal.need, closest.goal.ouvrage);
  }
  const village = villageStage(state.world, archipelago.classe, noms);
  return make(port, village.next ?? 'Le village est complet : reviens réviser quand tu veux.');
}

const A_EXPLORER = 'Une île à explorer : ses missions t’attendent.';

/**
 * La première mission jouable jamais jouée de l'île, ou `null` s'il n'en reste pas (avec « Pas de LV2 », l'île de la
 * LV2 n'en a aucune).
 */
function missionAJouer(state: GameState, island: BiomeId): string | null {
  const biome = getBiome(island);
  return (biome && missionsJouables(biome).find((m) => !questProgress(island, m.id, state.progress))?.id) ?? null;
}
