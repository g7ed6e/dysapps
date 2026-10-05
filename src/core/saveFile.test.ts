import { degelerSauvegarde, gelerSauvegarde, saveJSON } from "./storage";
import {
  creerSauvegarde,
  lireSauvegarde,
  nomDuFichier,
  restaurerSauvegarde,
} from "./saveFile";

const DATE = new Date("2026-09-28T19:00:00Z");

it("copie telles quelles les valeurs de l’appli, et seulement elles", () => {
  localStorage.setItem("dysapps:progress", '{"xp":120}');
  localStorage.setItem("dysapps:game", '{"stock":{"bois":3}}');
  localStorage.setItem("autre-site", '"rien"');
  const s = creerSauvegarde("1.2.3", DATE);
  expect(s.data).toEqual({
    "dysapps:progress": '{"xp":120}',
    "dysapps:game": '{"stock":{"bois":3}}',
  });
  expect(nomDuFichier(s)).toBe("dysapps-progression-2026-09-28.json");
});

it("restaure une sauvegarde à l’identique, à la place de ce qui était là", () => {
  localStorage.setItem("dysapps:progress", '{"xp":120}');
  const texte = JSON.stringify(creerSauvegarde("1.2.3", DATE));
  localStorage.clear();
  localStorage.setItem("dysapps:progress", '{"xp":5}');
  localStorage.setItem("dysapps:resume", '{"path":"/app/tables"}');
  localStorage.setItem("autre-site", '"garde"');
  const s = lireSauvegarde(texte);
  expect(s).not.toBeNull();
  expect(restaurerSauvegarde(s!)).toBe(true);
  expect(localStorage.getItem("dysapps:progress")).toBe('{"xp":120}');
  expect(localStorage.getItem("dysapps:resume")).toBeNull();
  expect(localStorage.getItem("autre-site")).toBe('"garde"');
});

it("refuse ce qui n’est pas une sauvegarde de l’appli", () => {
  const bonne = creerSauvegarde("1.2.3", DATE);
  const variantes: unknown[] = [
    "pas du JSON",
    null,
    [],
    { ...bonne, format: "autre" },
    { ...bonne, version: 3 },
    { ...bonne, format: "dysapps-sauvegarde" },
    { ...bonne, date: "hier" },
    { ...bonne, data: { "autre-site": "1" } },
    { ...bonne, data: { "dysapps:progress": 12 } },
    { ...bonne, data: { "dysapps:progress": "{abîmé" } },
    { ...bonne, data: { "dysapps:<script>": "1" } },
  ];
  for (const v of variantes)
    expect(
      lireSauvegarde(typeof v === "string" ? v : JSON.stringify(v)),
    ).toBeNull();
  expect(lireSauvegarde("x".repeat(5 * 1024 * 1024 + 1))).toBeNull();
});

it("tout ou rien : un stockage plein rend l’appareil tel qu’il était", () => {
  localStorage.setItem("dysapps:progress", '{"xp":7}');
  const s = lireSauvegarde(
    JSON.stringify({
      ...creerSauvegarde("1", DATE),
      data: { "dysapps:progress": '{"xp":1}', "dysapps:game": "{}" },
    }),
  )!;
  const setItem = Storage.prototype.setItem;
  let appels = 0;
  const espion = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(function (this: Storage, k: string, v: string) {
      if (++appels === 2) throw new DOMException("plein", "QuotaExceededError");
      setItem.call(this, k, v);
    });
  expect(restaurerSauvegarde(s)).toBe(false);
  espion.mockRestore();
  expect(localStorage.getItem("dysapps:progress")).toBe('{"xp":7}');
  expect(localStorage.getItem("dysapps:game")).toBeNull();
});

it("enregistre la partie rangée sur l’appareil, même quand l’enregistrement est suspendu", () => {
  localStorage.setItem("dysapps:progress", '{"xp":120}');
  gelerSauvegarde();
  saveJSON("progress", { xp: 999 });
  const s = creerSauvegarde("1", DATE);
  degelerSauvegarde();
  expect(s.data).toEqual({ "dysapps:progress": '{"xp":120}' });
});

it("une clé que la restauration refuserait n’est pas enregistrée", () => {
  localStorage.setItem("dysapps:progress", '{"xp":1}');
  localStorage.setItem("dysapps:clé bizarre", "1");
  const s = creerSauvegarde("1", DATE);
  expect(Object.keys(s.data)).toEqual(["dysapps:progress"]);
  expect(lireSauvegarde(JSON.stringify(s))).not.toBeNull();
});

it("un fichier de la version 1, aux anciennes clés, se restaure puis passe aux mots neutres", () => {
  const ancien = {
    format: "dysapps-sauvegarde",
    version: 1,
    date: DATE.toISOString(),
    appli: "1.0.0",
    donnees: {
      "dysapps:blocland": JSON.stringify({
        inventory: { bois: 3 },
        village: { plans: {}, journal: [], bridges: [], at: "foret" },
      }),
      "dysapps:progress": JSON.stringify({ xp: 40, plansCompleted: 2, bossesBeaten: 1 }),
      "dysapps:reprise": JSON.stringify({ path: "/app/tables", label: "Tables" }),
      "dysapps:noms-archipels": JSON.stringify({ dit: true }),
    },
  };
  const s = lireSauvegarde(JSON.stringify(ancien));
  expect(s).not.toBeNull();
  expect(s!.app).toBe("1.0.0");
  // Relue, la sauvegarde est à la version 2 : la réécrire donne un fichier neuf.
  expect(s!.format).toBe("dysapps-backup");
  expect(s!.version).toBe(2);
  expect(restaurerSauvegarde(s!)).toBe(true);
  expect(localStorage.getItem("dysapps:blocland")).toBeNull();
  expect(localStorage.getItem("dysapps:reprise")).toBeNull();
  expect(localStorage.getItem("dysapps:noms-archipels")).toBeNull();
  expect(JSON.parse(localStorage.getItem("dysapps:game")!)).toEqual({
    stock: { 'french-6e-phonology': 3 },
    world: { parts: {}, log: [], links: [], place: "french-6e-phonology" },
    version: 3,
  });
  expect(JSON.parse(localStorage.getItem("dysapps:progress")!)).toEqual({
    xp: 40,
    structuresCompleted: 2,
    challengesWon: 1,
  });
  expect(JSON.parse(localStorage.getItem("dysapps:resume")!)).toEqual({ path: "/app/tables", label: "Tables" });
  expect(JSON.parse(localStorage.getItem("dysapps:region-names")!)).toEqual({ said: true });
});

it("un fichier de la version 2 garde ses clés neuves", () => {
  localStorage.setItem("dysapps:game", '{"stock":{"french-6e-phonology":3},"version":3}');
  const texte = JSON.stringify(creerSauvegarde("2.0.0", DATE));
  const lu = JSON.parse(texte) as Record<string, unknown>;
  expect(lu.format).toBe("dysapps-backup");
  expect(lu.version).toBe(2);
  expect(lu.app).toBe("2.0.0");
  localStorage.clear();
  expect(restaurerSauvegarde(lireSauvegarde(texte)!)).toBe(true);
  expect(localStorage.getItem("dysapps:game")).toBe('{"stock":{"french-6e-phonology":3},"version":3}');
});
