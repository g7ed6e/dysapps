# Le cycle de marche du jeu (src/game/three/paintedCharacters.ts, `GESTES.pas` et `poseDeMarche`), recopié pour la
# planche d'apercu_squelette.py et les vidéos d'essai : garder les deux identiques.
import math

ALLURE = {"angle": 0.45, "cadence": 8, "bras": 0.45, "buste": 0.06, "penche": 0.06, "dandine": 0.1, "bassin": 0.07,
          "bascule": 0.05, "monte": 0.04}

# Kéo, le bonhomme (`MARCHE_DE_KEO`) : la même marche à l'allure d'un enfant, son départ et son souffle.
ALLURE_DE_KEO = {"angle": 0.4, "cadence": 9, "bras": 0.35, "buste": 0.06, "penche": 0.04, "dandine": 0, "bassin": 0.07,
                 "bascule": 0.05, "monte": 0.05}
DEPART_DE_KEO = 0.3
SOUFFLE_DE_KEO = (0.03, 4.5)


def cloche(x, centre, largeur):
    d = abs(math.atan2(math.sin(x - centre), math.cos(x - centre))) / (largeur / 2)
    return 0 if d >= 1 else 0.5 + 0.5 * math.cos(math.pi * d)


def pose(allure, phi, elan):
    """Les angles (os, axe, radians) et la hauteur du corps (0 à 1), comme `poseDeMarche`."""
    def jambe(p):
        genou = 0.5 * cloche(p, math.pi / 2 + 0.6, 1.2) + 2.2 * cloche(p, -0.6, 2.6)
        return allure["angle"] * math.sin(p), -allure["angle"] * genou

    gc, gg = jambe(phi)
    dc, dg = jambe(phi + math.pi)
    s, c = math.sin(phi), math.cos(phi)
    bras = allure["bras"] * math.sin(phi - 0.35)
    angles = [("thigh.L", "x", gc), ("shin.L", "x", gg), ("thigh.R", "x", dc), ("shin.R", "x", dg),
              ("hips", "y", -allure["bassin"] * s), ("hips", "z", (allure["bascule"] - allure["dandine"]) * c),
              ("spine", "y", (allure["bassin"] + allure["buste"]) * s), ("spine", "z", -allure["bascule"] * c),
              ("head", "y", -allure["buste"] * s), ("arm.L", "x", -bras), ("arm.R", "x", bras)]
    return [(n, a, elan * v) for n, a, v in angles], elan * (0.5 + 0.5 * math.cos(2 * phi))


def pattes_courtes(heads):
    """Comme `pattesCourtes` : `heads`, la hauteur de la tête de chaque os (repère du jeu)."""
    if "thigh.L" not in heads or heads["head"] <= 0:
        return 0
    return min(1, max(0, (0.25 - heads["hips"] / heads["head"]) / 0.15))


def adoucir(x):
    c = min(1, max(0, x))
    return c * c * (3 - 2 * c)


def pose_de_keo(pas, t, dt, en_marche):
    """Comme `poseDeKeo` : fait avancer `pas` ({"phi", "rampe"}) de dt secondes, rend les angles et la hauteur."""
    pas["rampe"] = min(1, max(0, pas["rampe"] + (dt if en_marche else -dt) / DEPART_DE_KEO))
    elan = adoucir(pas["rampe"])
    pas["phi"] = (pas["phi"] + dt * ALLURE_DE_KEO["cadence"]) % (2 * math.pi) if elan > 0 else 0
    angles, haut = pose(ALLURE_DE_KEO, pas["phi"], elan)
    buste = SOUFFLE_DE_KEO[0] * math.sin(2 * math.pi * t / SOUFFLE_DE_KEO[1]) - ALLURE_DE_KEO["penche"] * elan
    return angles + [("spine", "x", buste), ("head", "x", -buste)], haut
