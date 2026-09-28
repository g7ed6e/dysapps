import { degelerSauvegarde, gelerSauvegarde, saveJSON } from "./storage";
import {
  creerSauvegarde,
  lireSauvegarde,
  nomDuFichier,
  restaurerSauvegarde,
} from "./sauvegarde";

const DATE = new Date("2026-09-28T19:00:00Z");

it("copie telles quelles les valeurs de l’appli, et seulement elles", () => {
  localStorage.setItem("dysapps:progress", '{"xp":120}');
  localStorage.setItem("dysapps:blocland", '{"inventory":{"bois":3}}');
  localStorage.setItem("autre-site", '"rien"');
  const s = creerSauvegarde("1.2.3", DATE);
  expect(s.donnees).toEqual({
    "dysapps:progress": '{"xp":120}',
    "dysapps:blocland": '{"inventory":{"bois":3}}',
  });
  expect(nomDuFichier(s)).toBe("dysapps-progression-2026-09-28.json");
});

it("restaure une sauvegarde à l’identique, à la place de ce qui était là", () => {
  localStorage.setItem("dysapps:progress", '{"xp":120}');
  const texte = JSON.stringify(creerSauvegarde("1.2.3", DATE));
  localStorage.clear();
  localStorage.setItem("dysapps:progress", '{"xp":5}');
  localStorage.setItem("dysapps:reprise", '{"path":"/app/tables"}');
  localStorage.setItem("autre-site", '"garde"');
  const s = lireSauvegarde(texte);
  expect(s).not.toBeNull();
  expect(restaurerSauvegarde(s!)).toBe(true);
  expect(localStorage.getItem("dysapps:progress")).toBe('{"xp":120}');
  expect(localStorage.getItem("dysapps:reprise")).toBeNull();
  expect(localStorage.getItem("autre-site")).toBe('"garde"');
});

it("refuse ce qui n’est pas une sauvegarde de l’appli", () => {
  const bonne = creerSauvegarde("1.2.3", DATE);
  const variantes: unknown[] = [
    "pas du JSON",
    null,
    [],
    { ...bonne, format: "autre" },
    { ...bonne, version: 2 },
    { ...bonne, date: "hier" },
    { ...bonne, donnees: { "autre-site": "1" } },
    { ...bonne, donnees: { "dysapps:progress": 12 } },
    { ...bonne, donnees: { "dysapps:progress": "{abîmé" } },
    { ...bonne, donnees: { "dysapps:<script>": "1" } },
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
      donnees: { "dysapps:progress": '{"xp":1}', "dysapps:blocland": "{}" },
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
  expect(localStorage.getItem("dysapps:blocland")).toBeNull();
});

it("enregistre la partie rangée sur l’appareil, même quand l’enregistrement est suspendu", () => {
  localStorage.setItem("dysapps:progress", '{"xp":120}');
  gelerSauvegarde();
  saveJSON("progress", { xp: 999 });
  const s = creerSauvegarde("1", DATE);
  degelerSauvegarde();
  expect(s.donnees).toEqual({ "dysapps:progress": '{"xp":120}' });
});

it("une clé que la restauration refuserait n’est pas enregistrée", () => {
  localStorage.setItem("dysapps:progress", '{"xp":1}');
  localStorage.setItem("dysapps:clé bizarre", "1");
  const s = creerSauvegarde("1", DATE);
  expect(Object.keys(s.donnees)).toEqual(["dysapps:progress"]);
  expect(lireSauvegarde(JSON.stringify(s))).not.toBeNull();
});
