# La planche de contrôle du squelette d'une créature (squelette.py) : ses régions de poids (une couleur par os), puis
# des poses du repos et de la marche, de face et de profil, avec les gestes que le jeu joue
# (src/game/three/paintedCharacters.ts, `GESTES`). Dessinée sans Blender, à facettes plates.
#
#   python3 apercu_squelette.py -- <dossier d'un modèle> <quarts de tour> <image.png>

import json, os, struct, sys
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from squelette import Frame  # noqa: E402

# Les mêmes que GESTES dans paintedCharacters.ts : amplitudes en radians, périodes en secondes.
REST = {"breath": (0.04, 4.5), "look": (0.2, 7.0), "tail": (0.3, 4.0)}
WALK = {"swing": 0.45, "pace": 8.0, "arms": 0.5, "twist": 0.08, "lean": 0.06}

COLORS = [(200, 200, 200), (120, 160, 230), (240, 200, 60), (230, 90, 90), (170, 60, 60), (90, 200, 120), (40, 140, 70),
          (190, 120, 230), (120, 60, 170)]


def read(path):
    data = open(path, "rb").read()
    n = struct.unpack_from("<I", data, 12)[0]
    doc = json.loads(data[20:20 + n])
    binary = data[28 + n:]
    acc = doc["accessors"]
    views = doc["bufferViews"]

    def arr(i, dtype, comps):
        v = views[acc[i]["bufferView"]]
        return np.frombuffer(binary, dtype=dtype, count=acc[i]["count"] * comps, offset=v["byteOffset"]).reshape(-1, comps)

    pos = arr(0, "<f4", 3).astype(float)
    col = arr(1, "<u2", 4)[:, :3] / 65535.0
    joints = arr(2, "u1", 4).astype(int)
    weights = arr(3, "u1", 4) / 255.0
    return pos, col, joints, weights, doc["extras"]["bones"]


def rot(axis, a):
    c, s = np.cos(a), np.sin(a)
    if axis == "x":
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def pose(bones, heads, t, walking):
    """Pour chaque os, sa rotation (repère du jeu) au temps t."""
    r = {}
    if walking:
        k = np.sin(t * WALK["pace"])
        r["thigh.L"] = rot("x", WALK["swing"] * k)
        r["thigh.R"] = rot("x", -WALK["swing"] * k)
        r["shin.L"] = rot("x", -0.8 * WALK["swing"] * max(0, -k))
        r["shin.R"] = rot("x", -0.8 * WALK["swing"] * max(0, k))
        # Les bras balancent à l'inverse des jambes ; le buste se penche un peu et tourne avec le pas.
        r["arm.L"] = rot("x", -WALK["arms"] * k)
        r["arm.R"] = rot("x", WALK["arms"] * k)
    a, p = REST["breath"]
    r["spine"] = rot("x", a * np.sin(2 * np.pi * t / p) - (WALK["lean"] if walking else 0))
    if walking:
        r["spine"] = r["spine"] @ rot("y", WALK["twist"] * np.sin(t * WALK["pace"]))
    a, p = REST["look"]
    r["head"] = rot("y", a * np.sin(2 * np.pi * t / p))
    a, p = REST["tail"]
    r["tail.1"] = rot("y", a * np.sin(2 * np.pi * t / p))
    r["tail.2"] = rot("y", 1.2 * a * np.sin(2 * np.pi * t / p - 0.9))
    mats = []
    for i, b in enumerate(bones):
        R = r.get(b["name"], np.eye(3))
        local = (R, heads[i])
        if b["parent"] < 0:
            mats.append((R, heads[i] - R @ heads[i]))
        else:
            PR, Pt = mats[b["parent"]]
            # La rotation de l'os autour de sa tête, puis celle de son parent.
            mats.append((PR @ R, PR @ (heads[i] - R @ heads[i]) + Pt))
        del local
    return mats


def skin(q, joints, weights, mats):
    out = np.zeros_like(q)
    for k in range(4):
        R = np.stack([mats[j][0] for j in joints[:, k]])
        T = np.stack([mats[j][1] for j in joints[:, k]])
        out += weights[:, k:k + 1] * (np.einsum("nij,nj->ni", R, q) + T)
    return out


def draw(q, col, view, size=400):
    """Les triangles vus de face (de −Z) ou de profil (de +X), à facettes plates, du plus loin au plus proche."""
    tri = q.reshape(-1, 3, 3)
    c = col.reshape(-1, 3, 3).mean(1)
    if view == "face":
        xy, depth = tri[:, :, [0, 1]] * [1, 1], -tri[:, :, 2].mean(1)
    else:
        xy, depth = tri[:, :, [2, 1]] * [-1, 1], tri[:, :, 0].mean(1)
    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
    light = np.clip(0.55 + 0.45 * (n @ np.array([0.3, 0.8, -0.5]) / np.linalg.norm([0.3, 0.8, -0.5])), 0.3, 1)
    h = q[:, 1].max()
    s = size * 0.85 / h
    img = Image.new("RGB", (size, size), (205, 208, 212))
    d = ImageDraw.Draw(img)
    for i in np.argsort(-depth):
        pts = [(size / 2 + x * s, size * 0.95 - y * s) for x, y in xy[i]]
        d.polygon(pts, fill=tuple(int(v) for v in np.clip(c[i] * light[i] * 255, 0, 255)))
    return img


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    folder, quarts, out = args[0], int(args[1]), args[2]
    pos, col, joints, weights, bones = read(os.path.join(folder, "final-1500.glb"))
    frame = Frame(pos, quarts)
    q = frame.to_game(pos)
    heads = frame.to_game(np.array([b["head"] for b in bones]))
    # Les couleurs de sRGB à l'affichage (le fichier les garde linéaires).
    srgb = np.where(col <= 0.0031308, col * 12.92, 1.055 * np.power(col, 1 / 2.4) - 0.055)
    region = np.array([COLORS[j % len(COLORS)] for j in joints[:, 0]]) / 255.0
    tiles = [draw(q, region, "face"), draw(q, region, "profil")]
    walking = any(b["name"].startswith("thigh") for b in bones)
    for t, walk in [(0, False), (1.7, False), (3.5, False), (0.2, walking), (0.6, walking)]:
        p = skin(q, joints, weights, pose(bones, heads, t, walk))
        tiles += [draw(p, srgb, "face"), draw(p, srgb, "profil")]
    sheet = Image.new("RGB", (400 * len(tiles), 400 + 20), (255, 255, 255))
    for i, im in enumerate(tiles):
        sheet.paste(im, (400 * i, 20))
    ImageDraw.Draw(sheet).text((4, 3), f"{os.path.basename(folder)} : {', '.join(b['name'] for b in bones)}", fill=(0, 0, 0))
    sheet.save(out)


if __name__ == "__main__":
    main()
