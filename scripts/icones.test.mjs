import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { empreinte, iconeUrl } from "./icones.mjs";

it("l'adresse d'une icône porte l'empreinte de son contenu", () => {
  expect(iconeUrl("pwa-192.png")).toMatch(/^pwa-192\.png\?v=[0-9a-f]{8}$/);
});

it("un nouveau dessin donne une nouvelle adresse, le même dessin la même", () => {
  const dossier = mkdtempSync(join(tmpdir(), "icones-"));
  writeFileSync(join(dossier, "a.png"), "ancre");
  const avant = empreinte("a.png", dossier);
  expect(empreinte("a.png", dossier)).toBe(avant);
  writeFileSync(join(dossier, "a.png"), "cube");
  expect(empreinte("a.png", dossier)).not.toBe(avant);
});
