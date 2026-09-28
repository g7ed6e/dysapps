import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SauvegardePanel } from "./SauvegardePanel";
import { creerSauvegarde } from "../core/sauvegarde";
import { SettingsProvider } from "../core/SettingsContext";

const recharger = vi.fn();
beforeEach(() => {
  recharger.mockReset();
  vi.stubGlobal("location", {
    ...window.location,
    origin: window.location.origin,
    reload: recharger,
  });
});
afterEach(() => vi.unstubAllGlobals());

function fichier(texte: string) {
  return new File([texte], "sauvegarde.json", { type: "application/json" });
}

it("restaurer demande une confirmation, puis remplace la progression et recharge", async () => {
  localStorage.setItem("dysapps:progress", '{"xp":120}');
  const texte = JSON.stringify(
    creerSauvegarde("1.2.3", new Date("2026-09-28T19:00:00Z")),
  );
  localStorage.setItem("dysapps:progress", '{"xp":5}');
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <SauvegardePanel />
    </SettingsProvider>,
  );
  await user.upload(screen.getByTestId("fichier-sauvegarde"), fichier(texte));
  expect(
    await screen.findByText(/Sauvegarde du 28 septembre 2026/),
  ).toBeInTheDocument();
  // Rien n'a changé avant le toucher sur « Restaurer ».
  expect(localStorage.getItem("dysapps:progress")).toBe('{"xp":5}');
  await user.click(screen.getByRole("button", { name: "Restaurer" }));
  expect(localStorage.getItem("dysapps:progress")).toBe('{"xp":120}');
  expect(recharger).toHaveBeenCalled();
});

it("un fichier qui n’est pas une sauvegarde ne change rien", async () => {
  localStorage.setItem("dysapps:progress", '{"xp":5}');
  const user = userEvent.setup();
  render(
    <SettingsProvider>
      <SauvegardePanel />
    </SettingsProvider>,
  );
  await user.upload(
    screen.getByTestId("fichier-sauvegarde"),
    fichier('{"format":"autre"}'),
  );
  expect(
    await screen.findByText(/n’est pas une sauvegarde/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Restaurer" }),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem("dysapps:progress")).toBe('{"xp":5}');
});

it("le mode d’emploi pour réinstaller commence par enregistrer la progression", () => {
  render(
    <SettingsProvider>
      <SauvegardePanel />
    </SettingsProvider>,
  );
  const etapes = screen
    .getByRole("group", { name: "Réinstaller l’appli" })
    .querySelectorAll("ol > li");
  expect(etapes).toHaveLength(4);
  expect(etapes[0]).toHaveTextContent("Enregistre ta progression");
});
