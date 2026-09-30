import { readFileSync } from "node:fs";
import { BLOCKS, BIOMES, blockCount, nomDuBloc } from "../biomes";
import {
  EMPTY_STATE,
  assembleBlock,
  fillPlanCell,
  planStatus,
  sanitizeState,
} from "../engine";
import { retenirReglages } from "../../core/settings";
import { DEFAULT_SETTINGS } from "../../core/settings";
import { textesDe } from "../../univers";
import { ARCHIPELAGOS } from "./archipelago";
import { RECETTES, assemblables, manquePour, recetteDe } from "./assemblage";
import { ASSEMBLAGE } from "./recettes";
import { UNIVERS_IDS } from "../../core/univers";
import { getMonument, monumentsOf } from "./monuments";
import { planCells } from "./plans";
import { allerChercher } from "./uses";

afterEach(() => retenirReglages(null));

it("un bloc assemblé par archipel, fait de blocs de deux îles de son archipel, jamais d’or ni de cristal", () => {
  expect(RECETTES.map((r) => r.archipelago)).toEqual(
    ARCHIPELAGOS.map((a) => a.classe),
  );
  for (const r of RECETTES) {
    expect(BLOCKS[r.bloc].assemble, r.bloc).toBe(true);
    expect(r.ingredients).toHaveLength(2);
    for (const i of r.ingredients) {
      expect(
        BIOMES.find((b) => b.block === i.bloc)?.classe,
        `${r.bloc} ${i.bloc}`,
      ).toBe(r.archipelago);
      expect(i.n).toBeLessThanOrEqual(5);
    }
    expect(r.ingredients.reduce((n, i) => n + i.n, 0)).toBe(3);
  }
  // Aucune île ne donne un bloc assemblé ; tout bloc assemblé a sa recette.
  for (const b of Object.values(BLOCKS).filter((x) => x.assemble)) {
    expect(BIOMES.some((i) => i.block === b.id)).toBe(false);
    expect(recetteDe(b.id)).toBeDefined();
  }
});

it("assemble un bloc à la fois, sans rien perdre quand il manque des blocs", () => {
  const state = { ...EMPTY_STATE, inventory: { bois: 5, pierre: 1 } };
  const poutre = recetteDe("poutre")!;
  expect(assemblables(state.inventory, poutre)).toBe(1);
  const r = assembleBlock(state, "poutre");
  expect(r.ok).toBe(true);
  expect(r.state.inventory).toEqual({ bois: 3, pierre: 0, poutre: 1 });
  const encore = assembleBlock(r.state, "poutre");
  expect(encore.ok).toBe(false);
  expect(encore.state).toBe(r.state);
  expect(manquePour(r.state.inventory, poutre)).toEqual([
    { bloc: "pierre", n: 1 },
  ]);
  expect(assembleBlock(state, "bois")).toMatchObject({
    ok: false,
    reason: "pas-de-recette",
  });
});

it("garde les blocs assemblés d’une sauvegarde, et une case déjà posée d’un monument le reste", () => {
  const m = getMonument("monument-observatoire")!;
  const case_ = planCells(m).find((c) => c.block === "poutre")!;
  // Une partie d'avant GD-2 avait posé du bois à cette case : elle reste posée, sans rien rendre ni reprendre.
  const avant = sanitizeState({
    inventory: { bois: 4 },
    village: { plans: { [m.id]: [case_.key] } },
  });
  expect(avant.village.plans[m.id]).toEqual([case_.key]);
  expect(avant.inventory).toEqual({ bois: 4 });
  expect(sanitizeState({ inventory: { poutre: 2 } }).inventory).toEqual({
    poutre: 2,
  });
  // Une poutre se pose à une case de poutre du monument.
  const libre = planCells(m).find(
    (c) => c.block === "poutre" && c.key !== case_.key,
  )!;
  const pose = fillPlanCell(
    { ...avant, inventory: { poutre: 1 } },
    m,
    libre.x,
    libre.y,
    libre.z,
  );
  expect(pose.ok).toBe(true);
  expect(planStatus(pose.state, m).done).toBe(2);
});

it("chaque monument demande le bloc assemblé de son archipel", () => {
  for (const r of RECETTES)
    for (const m of monumentsOf(r.archipelago))
      expect(
        planStatus(EMPTY_STATE, m).missing[r.bloc] ?? 0,
        m.id,
      ).toBeGreaterThan(0);
});

it("nomme les blocs assemblés et leur lieu selon l’univers, depuis docs/contenu/assemblage.md", () => {
  // Chaque univers a son lieu et ses noms (les règles nomment les univers sans lire leur couche).
  expect(Object.keys(ASSEMBLAGE.lieu).sort()).toEqual([...UNIVERS_IDS].sort());
  for (const r of ASSEMBLAGE.recettes)
    expect(Object.keys(r.noms).sort(), r.bloc).toEqual([...UNIVERS_IDS].sort());
  const md = readFileSync("docs/contenu/assemblage.md", "utf8");
  expect(md).toContain(
    "| `poutre` | 6e | bois × 2 · pierre × 1 | Poutre | Madrier |",
  );
  expect(nomDuBloc("poutre")).toBe("Poutre");
  expect(blockCount("vitrail", 3)).toBe("3 vitraux");
  expect(textesDe("blocland").assemblage.titre).toBe("La Fabrique");
  expect(allerChercher("poutre")).toBe("va à la Fabrique pour l’assembler");
  retenirReglages({ ...DEFAULT_SETTINGS, univers: "archipeo" });
  expect(nomDuBloc("poutre")).toBe("Madrier");
  expect(blockCount("vitrail", 3)).toBe("3 hublots");
  expect(blockCount("bois", 3)).toBe("3 blocs de bois");
  expect(textesDe("archipeo").assemblage.titre).toBe("La Halle aux matériaux");
  expect(allerChercher("poutre")).toBe(
    "va à la Halle aux matériaux pour l’assembler",
  );
});
