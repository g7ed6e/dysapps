# Pose deux yeux sur le visage d'un modèle importé (Kéo, le bonhomme d'Archipéo) : deux petits prismes droits, collés au
# visage, d'une couleur sombre, comme les deux petits yeux des personnages dessinés en code (game-design d'Archipéo).
# Le visage du modèle de TRELLIS.2 n'a pas d'yeux qu'on puisse repeindre : ses facettes (de 0,03 à 0,05 de la taille)
# sont plus grandes qu'un œil, et sa texture n'y laissait qu'une ombre.
#
#   python3 yeux.py -- <dossier d'un modèle> [<dossier d'un modèle>…]
#
# Les réglages sont dans docs/univers/archipeo/personnages/modeles/reglages.csv : les quarts de tour (premier mot de la
# colonne « squelette ») tournent le modèle vers l'élève, et le mot `yeux=hauteur:écart:largeur:haut>couleur` de la
# colonne « aplats » place les yeux (en part de la taille du modèle : la hauteur de leur centre depuis les pieds, l'écart
# de chaque œil au milieu du visage, la largeur et la hauteur d'un œil).
#
# Chaque œil fait six triangles (sa face avant et ses deux côtés, enfoncés dans la tête) ; pour tenir le nombre de
# triangles du fichier (1 500 pour Kéo), autant de triangles du dessous des semelles, tournés vers le sol, que la caméra
# ne voit jamais, sont retirés. Les yeux suivent l'os de la tête (squelette.py). Dernière étape de la chaîne, après
# aplats.py : un modèle qui a déjà ses yeux (des triangles de leur couleur) est laissé tel quel. Numpy seulement.

import os, sys
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from squelette import Frame, read_glb, write_glb  # noqa: E402
from apercu_squelette import read as read_skin  # noqa: E402
from aplats import TABLE, channels, read_quarts, to_linear, to_srgb  # noqa: E402

# Ce que le visage prend comme hauteur d'avance : la face avant d'un œil est à 0,3 % de la taille devant la peau, ses
# côtés s'enfoncent de 3 % dans la tête.
AVANT, PROFONDEUR = 0.003, 0.03


def read_eyes(path=TABLE):
    """Le mot `yeux=` de chaque modèle : (hauteur, écart, largeur, haut, couleur)."""
    eyes = {}
    for line in open(path, encoding="utf-8"):
        cols = line.rstrip("\n").split(";")
        if line.startswith("#") or len(cols) < 5:
            continue
        for p in cols[4].split():
            if p.startswith("yeux="):
                size, color = p[len("yeux="):].split(">")
                eyes[cols[0].strip()] = (*(float(v) for v in size.split(":")), int(color, 16))
    return eyes


def front_depth(tri, x, y):
    """Le z le plus en avant (le plus petit, l'élève est vers −Z) de la surface au point (x, y), ou None."""
    a, b, c = tri[:, 0], tri[:, 1], tri[:, 2]
    v0, v1 = b[:, :2] - a[:, :2], c[:, :2] - a[:, :2]
    v2 = np.array([x, y]) - a[:, :2]
    den = v0[:, 0] * v1[:, 1] - v1[:, 0] * v0[:, 1]
    ok = np.abs(den) > 1e-12
    u = np.where(ok, (v2[:, 0] * v1[:, 1] - v1[:, 0] * v2[:, 1]) / np.where(ok, den, 1), -1)
    v = np.where(ok, (v0[:, 0] * v2[:, 1] - v2[:, 0] * v0[:, 1]) / np.where(ok, den, 1), -1)
    inside = ok & (u >= 0) & (v >= 0) & (u + v <= 1)
    if not inside.any():
        return None
    z = a[:, 2] + u * (b[:, 2] - a[:, 2]) + v * (c[:, 2] - a[:, 2])
    return float(z[inside].min())


def prism(cx, cy, w, hgt, z_front, z_back):
    """Un pavé droit de face avant à `z_front`, sa face avant et ses deux côtés (le visage s'y arrondit vers les
    oreilles), sans dessus ni dessous (il dépasse à peine de la peau) : six triangles, tournés vers le dehors."""
    x0, x1, y0, y1 = cx - w / 2, cx + w / 2, cy - hgt / 2, cy + hgt / 2
    f = [[x0, y0, z_front], [x1, y0, z_front], [x1, y1, z_front], [x0, y1, z_front]]
    b = [[x0, y0, z_back], [x1, y0, z_back], [x1, y1, z_back], [x0, y1, z_back]]
    quads = [f, [f[1], b[1], b[2], f[2]], [f[3], b[3], b[0], f[0]]]
    centre = np.array([cx, cy, (z_front + z_back) / 2])
    out = []
    for q in quads:
        q = np.array(q, dtype=float)
        for t in (q[[0, 1, 2]], q[[0, 2, 3]]):
            n = np.cross(t[1] - t[0], t[2] - t[0])
            out.append(t if np.dot(n, t.mean(0) - centre) > 0 else t[[0, 2, 1]])
    return np.array(out)


def add_eyes(folder, quarts, settings):
    path = os.path.join(folder, "final-1500.glb")
    height, gap, width, tall, color = settings
    pos, col = read_glb(path)
    _, _, joints, weights, bones = read_skin(path)
    eye = to_linear(channels(color) / 255)
    srgb = np.round(to_srgb(col[:, :3]) * 255)
    if (np.abs(srgb - channels(color)).max(1) <= 1).any():
        return "a déjà ses yeux"
    frame = Frame(pos, quarts)
    q = frame.to_game(pos)
    h = q[:, 1].max()
    tri = q.reshape(-1, 3, 3)
    centre = tri.mean(1)
    normal = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    normal /= np.maximum(np.linalg.norm(normal, axis=1, keepdims=True), 1e-12)
    # Le milieu du visage : celui des faces tournées vers l'élève, à la hauteur des yeux.
    face = (normal[:, 2] < -0.5) & (np.abs(centre[:, 1] - height * h) < 0.04 * h)
    if not face.any():
        raise SystemExit(f"{folder} : pas de visage à la hauteur {height}")
    mid = float(np.median(centre[face, 0]))
    new = []
    for side in (-1, 1):
        cx, cy = mid + side * gap * h, height * h
        w, t = width * h, tall * h
        depths = [front_depth(tri, cx + dx * w / 2, cy + dy * t / 2) for dx in (-1, 0, 1) for dy in (-1, 0, 1)]
        depths = [d for d in depths if d is not None]
        if not depths:
            raise SystemExit(f"{folder} : rien devant l'œil {side}")
        z = min(depths)
        new.append(prism(cx, cy, w, t, z - AVANT * h, z + PROFONDEUR * h))
    new = np.concatenate(new)
    # Autant de triangles du dessous des semelles, tournés vers le sol, partent : les plus bas d'abord.
    sole = np.flatnonzero((normal[:, 1] < -0.9) & (centre[:, 1] < 0.03 * h))
    if len(sole) < len(new):
        raise SystemExit(f"{folder} : {len(sole)} triangles sous les semelles, il en faut {len(new)}")
    drop = sole[np.argsort(centre[sole, 1])[: len(new)]]
    keep = np.setdiff1d(np.arange(len(tri)), drop)
    vk = (keep[:, None] * 3 + np.arange(3)).ravel()
    head = next(i for i, b in enumerate(bones) if b["name"] == "head")
    added = frame.to_file(new.reshape(-1, 3))
    n_new = len(added)
    pos2 = np.concatenate([pos[vk], added])
    col2 = np.concatenate([col[vk], np.tile([*eye, 1.0], (n_new, 1))])
    joints2 = np.concatenate([joints[vk], np.tile([head, 0, 0, 0], (n_new, 1))])
    weights2 = np.concatenate([weights[vk], np.tile([1.0, 0, 0, 0], (n_new, 1))])
    write_glb(path, pos2, col2, joints2, weights2, bones)
    return f"deux yeux ({len(new)} triangles), autant de moins sous les semelles"


def main():
    eyes, quarts = read_eyes(), read_quarts()
    for folder in sys.argv[sys.argv.index("--") + 1:]:
        name = os.path.basename(os.path.normpath(folder))
        if name not in eyes:
            raise SystemExit(f"{name} : pas de mot yeux= dans {os.path.normpath(TABLE)}")
        print(name, add_eyes(folder, quarts.get(name, 0.0), eyes[name]))


if __name__ == "__main__":
    main()
