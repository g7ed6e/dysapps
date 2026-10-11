# La Nef d'Archipéo (GD-15), une forme par appel, modelée à la main d'après ses concepts (voilier graine 2026, dirigeable
# graine 42, aéronef « A » graine 42 ; docs/univers/archipeo/nef/) et la silhouette de leur modèle TRELLIS, qui sert de
# gabarit : proportions relevées par tranches, hauteurs reprises du concept (TRELLIS les écrase). Low poly en aplats
# francs, sans texture ; la même coque et la même proue pour les trois formes, la lanterne au coin de la poupe.
#
#   python3 nef.py -- <voilier|dirigeable|aeronef> <sortie.glb>
#
# Chaque partie (la coque, la voile, le ballon, le rotor…) est un os du .glb : la mue du jeu fait glisser chaque partie
# vers sa sœur de la forme suivante (src/game/world/nefModels.ts). Le fichier est écrit dans le repère de la Nef du jeu,
# en cases : `exporter` (nef_formes.py) ; l'échelle, la place en long et la hauteur de chaque forme sont dans `PLACE`.
import math, os, sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from nef_formes import Matrix, Vector, boite, coque_voilier, cylindre, exporter, lanterne, loft, partie, plaque, sphere  # noqa: E402

# Échelle (cases par unité du modèle), où tombe le milieu du modèle en long (z du jeu), et la hauteur de son x = 0 : le
# pont à 1 case, et le bonhomme (case 2, 3 du pont, harbor.ts `VEHICLE_DECK`) sur un pont libre, ni dans le mât ni dans
# la cabine. Le voilier fait sept cases de long, comme en cubes ; le dirigeable tient dans les onze cases de la Nef.
PLACE = {
    "voilier": (7.0, 3.5 - 0.18 * 7.0, -0.155),
    "dirigeable": (6.3, 3.5 + 0.18 * 6.3, -0.25),
    "aeronef": (7.0, 3.5 + 0.36 * 7.0, -0.66),
}

OR, LAITON = 0xF7D46A, 0xB8902E


def voilier():
    C = dict(coque=0xA8683E, inter=0x985C36, liston=0xD09A68, pont=0xC08A5C, mat=0x7A4528, toile=0xECE2CC, couture=0xDCD0B6,
             lagon=0x3F9F98, cabine=0xD7B07C, toit=0xE0BD8C, sombre=0x3A2A22, anneau=0x5E3A26, pied=0x6E3F24)
    H = coque_voilier((C["coque"], C["inter"], C["liston"], C["pont"]))
    boite("pont", (-0.05, 0, H - 0.04), (0.66, 0.34, 0.01), C["pont"])
    boite("banc", (-0.36, 0, H - 0.02), (0.05, 0.26, 0.02), C["liston"])
    for x in (-0.25, 0.22):
        boite("pied", (x, 0, -0.135), (0.07, 0.07, 0.04), C["pied"])
    # La cabine claire, son toit débordant, une fenêtre à quatre carreaux, la porte sombre vers l'arrière.
    partie("cabine")
    boite("cabine", (0.2, 0, 0.22), (0.2, 0.18, 0.12), C["cabine"])
    boite("toit", (0.2, 0, 0.29), (0.23, 0.21, 0.022), C["toit"])
    for dy in (-0.02, 0.02):
        for dz in (-0.017, 0.017):
            boite("carreau", (0.2 + dy, -0.092, 0.225 + dz), (0.028, 0.004, 0.026), C["sombre"])
    boite("porte", (0.099, 0, 0.2), (0.004, 0.06, 0.08), C["sombre"])
    partie("mat")
    cylindre("mat", (0, 0, 0.15), (0, 0, 1.06), 0.022, C["mat"], 8)
    sphere("pomme", (0, 0, 1.07), 0.028, C["mat"], 1)
    # La voile au tiers, dans l'axe : la vergue et ses anneaux, la bôme lagon.
    YV, ZH, ZB, X0, X1 = -0.035, 0.94, 0.345, -0.32, 0.36
    partie("vergue")
    cylindre("vergue", (X0 - 0.04, YV, ZH), (X1 + 0.04, YV, ZH), 0.017, C["mat"], 8)
    for x in (X0 - 0.04, X1 + 0.04):
        sphere("embout", (x, YV, ZH), 0.021, C["mat"], 1)
    for i in range(7):
        x = X0 + 0.02 + i * (X1 - X0 - 0.04) / 6
        cylindre("anneau", (x - 0.008, YV, ZH), (x + 0.008, YV, ZH), 0.023, C["anneau"], 6)
    partie("bome")
    cylindre("bome", (X0 - 0.02, YV, ZB), (X1 + 0.02, YV, ZB), 0.016, C["lagon"], 8)
    for x0, x1 in ((X0 - 0.02, X0 - 0.055), (X1 + 0.02, X1 + 0.055)):
        cylindre("embout", (x0, YV, ZB), (x1, YV, ZB), 0.019, C["mat"], 8)
    # Quatre lés, gonflés sur le côté, le bord arrière un peu courbe.
    partie("voile")
    les = 4
    xs = [X0 + (X1 - X0) * i / les for i in range(les + 1)]

    def g(x, z):
        return YV - 0.012 - 0.03 * math.sin((x - X0) / (X1 - X0) * math.pi) * math.sin((z - ZB) / (ZH - ZB) * math.pi)

    def bord(x, z):
        return x + 0.04 * math.sin((z - ZB) / (ZH - ZB) * math.pi) if x >= X1 - 1e-6 else x

    zs = [ZH - 0.012, ZH - 0.16, ZH - 0.3, ZH - 0.45, ZB + 0.012]
    for i in range(les):
        for za, zb in zip(zs[1:], zs):
            pts = [(bord(xs[i], za), g(xs[i], za), za), (bord(xs[i + 1], za), g(xs[i + 1], za), za), (bord(xs[i + 1], zb), g(xs[i + 1], zb), zb), (bord(xs[i], zb), g(xs[i], zb), zb)]
            plaque("voile", pts, 0.006, C["toile"] if i % 2 == 0 else C["couture"])
    lanterne(-0.43, -0.09, 0.2, 0.8, (OR, LAITON))


def dirigeable():
    C = dict(coque=0x96592F, inter=0x8A5232, liston=0xD09A68, pont=0xC08A5C, bois=0x7A4528, ballon=0xF1E8D2, derive=0xE9DFC4,
             lagon=0x4FC0AE, pied=0x6E3F24)
    # La nacelle : la coque du voilier, à 0,85 en long et en large, 0,7 en hauteur, sous l'avant du ballon.
    GX, GL, SZ = 0.055, 0.85, 0.7
    GH = coque_voilier((C["coque"], C["inter"], C["liston"], C["pont"]), sx=GL, sy=0.85, sz=SZ, x0=GX, z0=0.12 * SZ)
    boite("pont", (GX - 0.03, 0, GH - 0.03), (0.55, 0.28, 0.008), C["pont"])
    for x in (-0.17, 0.2):
        for s in (-1, 1):
            cylindre("pied", (GX + x, s * 0.05, 0.05), (GX + x, s * 0.05, -0.04), 0.016, C["pied"], 6)
    # Le ballon : un fuseau à douze côtés, son profil relevé sur le gabarit ; la bande lagon sous l'équateur.
    partie("ballon")
    N, R = 12, 0.235
    ZB = GH + 0.025 + R
    prof = [(-0.69, 0.055), (-0.655, 0.10), (-0.586, 0.138), (-0.518, 0.172), (-0.449, 0.186), (-0.38, 0.207), (-0.31, 0.22), (-0.207, 0.228),
            (0.0, 0.235), (0.345, 0.235), (0.518, 0.228), (0.587, 0.22), (0.656, 0.18), (0.725, 0.138), (0.794, 0.097), (0.835, 0.05)]

    def ang(i):
        return 2 * math.pi * i / N

    loft("ballon", [[(x, r * math.cos(ang(i)), ZB + r * math.sin(ang(i))) for i in range(N)] for x, r in prof], C["ballon"])
    for c in (0, N // 2):
        secs = []
        for x, r in prof[1:]:
            a0, a1 = (ang(c) - math.pi / N * 1.25, ang(c) + math.pi / N * 0.95) if c == 0 else (ang(c) - math.pi / N * 0.95, ang(c) + math.pi / N * 1.25)
            rr, ri = r * 1.012, r * 0.99
            secs.append([(x, rr * math.cos(t), ZB + rr * math.sin(t)) for t in (a0, (a0 + a1) / 2, a1)] + [(x, ri * math.cos(t), ZB + ri * math.sin(t)) for t in (a1, (a0 + a1) / 2, a0)])
        loft("bande", secs, C["lagon"])
    # L'empennage : dérives haute et basse en toile, bord de fuite et plan horizontal en bois.
    partie("empennage")
    for s_, h in ((1, 0.26), (-1, 0.18)):
        plaque("derive", [(-0.6, 0, ZB + s_ * 0.08), (-0.5, 0, ZB + s_ * 0.12), (-0.7, 0, ZB + s_ * h), (-0.84, 0, ZB + s_ * h), (-0.84, 0, ZB + s_ * 0.03)], 0.026, C["derive"])
        plaque("bord", [(-0.86, 0, ZB + s_ * 0.03), (-0.84, 0, ZB + s_ * 0.03), (-0.84, 0, ZB + s_ * h), (-0.86, 0, ZB + s_ * h)], 0.03, C["bois"])
    plaque("empennage", [(-0.86, -0.21, ZB), (-0.74, -0.21, ZB), (-0.62, -0.1, ZB), (-0.62, 0.1, ZB), (-0.74, 0.21, ZB), (-0.86, 0.21, ZB)], 0.018, C["bois"])
    # Les suspentes : trois cadres de bois entre le plat-bord et le ballon.
    partie("suspentes")
    for x in (-0.22, 0.03, 0.28):
        for s in (-1, 1):
            cylindre("montant", (GX + x, s * 0.105, GH), (GX + x, s * 0.09, ZB - R + 0.02), 0.011, C["bois"], 6)
        cylindre("traverse", (GX + x, -0.1, GH + 0.03), (GX + x, 0.1, GH + 0.03), 0.009, C["bois"], 4)
    for s in (-1, 1):
        cylindre("croisillon", (GX - 0.22, s * 0.1, GH), (GX + 0.03, s * 0.095, ZB - R + 0.02), 0.009, C["bois"], 4)
        cylindre("croisillon", (GX + 0.28, s * 0.1, GH), (GX + 0.03, s * 0.095, ZB - R + 0.02), 0.009, C["bois"], 4)
    lanterne(GX - 0.43 * GL, -0.09 * 0.85, GH, 0.8, (OR, LAITON))


def aeronef():
    C = dict(coque=0x9C5E35, inter=0x8A5230, liston=0xC89060, pont=0xB88052, bois=0x6E3D24, toile=0xEEE2C6, toile_toit=0xF6EEDB,
             toile_bas=0xECE0C4, bleu=0x6F98A0, bleu_toit=0x9DBDBB, cadre=0x7A4528, sombre=0x4A3226, pale=0xEAC79C, helice=0xD9A27A,
             cuivre=0xB06A42, planche=0x5E3420, pied=0x5A3322)
    # La coque du voilier, élargie (gabarit : demi-largeur 0,31) : même proue, même poupe ; le plat-bord à 0,27.
    H = coque_voilier((C["coque"], C["inter"], C["liston"], C["pont"]), sy=1.42, sz=0.85, z0=0.102)
    boite("pont", (-0.05, 0, H - 0.04), (0.66, 0.48, 0.01), C["pont"])
    for x, y in ((-0.22, -0.07), (-0.22, 0.07), (0.2, -0.07), (0.2, 0.07)):
        boite("pied", (x, y, -0.01), (0.07, 0.06, 0.05), C["pied"])
    # La cabine : un bloc aux arêtes du haut biseautées, l'avant crème, l'arrière bleu ; fenêtres à cadre de bois.
    partie("cabine")

    def cabine(x0, x1, col, col_toit):
        y, z0, z1, zt, b = 0.21, H - 0.045, 0.46, 0.54, 0.09

        def sec(x):
            return [(x, -y, z0), (x, y, z0), (x, y, z1), (x, y - b, zt), (x, -(y - b), zt), (x, -y, z1)]

        loft("cabine", [sec(x0), sec(x1)], col)
        for s in (-1, 1):
            plaque("pan", [(x0, s * (y + 0.002), z1), (x1, s * (y + 0.002), z1), (x1, s * (y - b + 0.002), zt + 0.002), (x0, s * (y - b + 0.002), zt + 0.002)], 0.004, col_toit)
        plaque("dessus", [(x0, -(y - b), zt + 0.003), (x1, -(y - b), zt + 0.003), (x1, y - b, zt + 0.003), (x0, y - b, zt + 0.003)], 0.004, col_toit)

    cabine(0.0, 0.22, C["toile"], C["toile_toit"])
    cabine(-0.26, 0.0, C["bleu"], C["bleu_toit"])
    for xe, xo, col, col2 in ((0.22, 0.27, C["toile_toit"], C["toile_bas"]), (-0.26, -0.31, C["bleu_toit"], C["bleu"])):
        loft("biseau", [[(xe, -0.21, 0.46), (xe, 0.21, 0.46), (xe, 0.12, 0.54), (xe, -0.12, 0.54)], [(xo, -0.17, 0.46), (xo, 0.17, 0.46), (xo, 0.1, 0.5), (xo, -0.1, 0.5)]], col)
        loft("biseau-bas", [[(xe, -0.21, H - 0.045), (xe, 0.21, H - 0.045), (xe, 0.21, 0.46), (xe, -0.21, 0.46)],
                            [(xo, -0.17, H - 0.045), (xo, 0.17, H - 0.045), (xo, 0.17, 0.46), (xo, -0.17, 0.46)]], col2)
    ZF = 0.38
    boite("fenetre", (0.272, 0, ZF), (0.006, 0.1, 0.085), C["sombre"])
    for dz in (-0.05, 0.05):
        boite("cadre", (0.276, 0, ZF + dz), (0.012, 0.13, 0.018), C["cadre"])
    for dy in (-0.058, 0.058):
        boite("cadre", (0.276, dy, ZF), (0.012, 0.018, 0.12), C["cadre"])
    for s in (-1, 1):
        boite("fenetre", (0.11, s * 0.212, ZF), (0.09, 0.006, 0.07), C["sombre"])
        boite("fenetre", (-0.13, s * 0.212, ZF), (0.09, 0.006, 0.07), C["sombre"])
    # Le mât épais, puis le rotor : moyeu et pomme de cuivre, quatre pales en pagaie.
    ZR = 0.86
    partie("mat")
    cylindre("mat", (0.0, 0, 0.53), (0.0, 0, ZR), 0.03, C["bois"], 8)
    cylindre("bague", (0.0, 0, 0.54), (0.0, 0, 0.565), 0.05, C["bois"], 8)
    partie("rotor")
    boite("moyeu", (0.0, 0, ZR + 0.02), (0.1, 0.1, 0.045), C["cuivre"])
    sphere("pomme", (0.0, 0, ZR + 0.07), 0.045, C["cuivre"], 1)
    for i in range(4):
        rot = Matrix.Rotation(math.radians(90 * i), 4, "Z") @ Matrix.Rotation(0.1, 4, "X")
        pts = [(0.04, -0.025, 0), (0.25, -0.03, 0), (0.55, -0.058, 0), (0.58, 0.0, 0), (0.55, 0.058, 0), (0.25, 0.03, 0), (0.04, 0.025, 0)]
        plaque("pale", [tuple(Matrix.Translation((0, 0, ZR + 0.02)) @ rot @ Vector(p)) for p in pts], 0.018, C["pale"])
    # Les hélices de côté, axe vers l'avant : bras, moyeu de cuivre, quatre pales larges.
    partie("helices")
    for s in (-1, 1):
        y, z, x = s * 0.36, 0.37, 0.15
        cylindre("bras", (x - 0.02, s * 0.2, z), (x - 0.02, y, z), 0.016, C["bois"], 6)
        cylindre("moyeu", (x - 0.04, y, z), (x + 0.02, y, z), 0.03, C["cuivre"], 8)
        sphere("pomme", (x + 0.035, y, z), 0.036, C["cuivre"], 1)
        for i in range(4):
            rot = Matrix.Rotation(math.radians(15 + 90 * i), 4, "X") @ Matrix.Rotation(0.35, 4, "Z")
            pts = [(0, -0.014, 0.03), (0, -0.045, 0.1), (0, -0.04, 0.14), (0, 0.0, 0.155), (0, 0.04, 0.14), (0, 0.045, 0.1), (0, 0.014, 0.03)]
            plaque("pale-helice", [tuple(Matrix.Translation((x, y, z)) @ rot @ Vector(p)) for p in pts], 0.01, C["helice"])
    # La dérive de bois à la poupe, en planches, dans l'axe.
    partie("derive")
    plaque("derive", [(-0.36, 0, H), (-0.49, 0, H), (-0.53, 0, H + 0.26), (-0.43, 0, H + 0.26)], 0.035, C["bois"])
    boite("planche", (-0.45, 0, H + 0.13), (0.004, 0.04, 0.24), C["planche"])
    lanterne(-0.42, -0.14, H, 0.8, (OR, LAITON))


if __name__ == "__main__":
    forme, sortie = sys.argv[sys.argv.index("--") + 1:][:2]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    {"voilier": voilier, "dirigeable": dirigeable, "aeronef": aeronef}[forme]()
    print(forme, "triangles", exporter(sortie, *PLACE[forme]))
