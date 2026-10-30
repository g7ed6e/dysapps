// Les équipiers retenus à un lieu du monde ouvert du 6e (GD-27, lot 5, piste B « ils restent là où ils ont aidé » ;
// world/equipageSaved.ts) : le premier lieu rallumé que chacun a guidé, écrit une fois, jamais changé. Le journal des
// parties posées (`world.log`) ne garde que cent lignes : sans ce souvenir, deux lieux sortis du journal ne se
// départageraient plus, et l'équipier changerait de lieu au chargement, ce que le référent dys écarte (un repère fixe).
/** Les prénoms des équipiers qui ont un lieu dans le monde. */
export const EQUIPAGE_SAVED_IDS = ['zia', 'malo'] as const;
export type EquipageSavedId = (typeof EQUIPAGE_SAVED_IDS)[number];

/** Les lieux retenus, par équipier : des identifiants de lieu (le monde dit s'ils valent encore), rien d'autre. */
export type EquipageSaved = Partial<Record<EquipageSavedId, string>>;

/** La table lue d'une sauvegarde : seuls les équipiers connus, un identifiant de lieu en lettres et tirets ; `undefined` si vide. */
export function sanitizeEquipage(raw: unknown): EquipageSaved | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const out: EquipageSaved = {};
  for (const id of EQUIPAGE_SAVED_IDS) {
    const v = (raw as Record<string, unknown>)[id];
    if (typeof v === 'string' && /^[a-z][a-z0-9-]*$/.test(v)) out[id] = v;
  }
  return Object.keys(out).length ? out : undefined;
}
