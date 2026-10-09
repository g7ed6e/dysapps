# Pose le squelette type d'une créature d'Archipéo sur son modèle de près (final-1500.glb) et range ses poids dans le
# même fichier : un squelette commun aux bipèdes et aux oiseaux (hanches, dos, tête, deux bras, deux jambes en deux os, une queue
# en deux os quand le modèle en a une), placé d'après la forme du modèle, et des poids calculés par régions (une jambe ne
# prend que ce qui l'entoure sous l'entrejambe : un bâton tenu à côté suit le corps). Le jeu anime ces os par le code
# (src/game/three/paintedCharacters.ts) : le fichier ne porte ni geste ni image clé.
#
#   python3 squelette.py -- <dossier d'un modèle> <quarts de tour> [réglages]
#
# <quarts de tour> : ceux de src/game/world/characters/imported/models.ts (le modèle tourné vers l'élève). Réglages,
# facultatifs : cou=0.6 (le haut du dos, en fraction de la hauteur), queue=non (pas de queue), jambes=non (pas de
# jambes : ni marche ni os de jambe), bras=non (pas de bras qui balancent), bras=L ou bras=R (un seul bras), leve=L ou leve=R (la main levée au-dessus de l'épaule). Quarts et réglages de chaque créature : la colonne « squelette » de
# docs/univers/archipeo/personnages/modeles/reglages.csv. Relire ensuite la planche d'apercu_squelette.py.
#
# Écrit final-1500.glb sans normales ni indices (le jeu calcule les siennes), avec JOINTS_0 et WEIGHTS_0 (quatre os par
# sommet au plus) et, dans `extras.bones`, chaque os : son nom, son parent et la place de sa tête dans le repère du
# fichier. Sans dépendance à Blender : numpy seulement.

import json, os, struct, sys
import numpy as np

GLB, JSON_CHUNK, BIN_CHUNK = 0x46546C67, 0x4E4F534A, 0x004E4942


def read_glb(path):
    """Les triangles d'un .glb (positions et couleurs RVBA en flottants, trois sommets par triangle)."""
    data = open(path, "rb").read()
    doc, binary, o = None, None, 12
    while o + 8 <= len(data):
        length, kind = struct.unpack_from("<II", data, o)
        chunk = data[o + 8:o + 8 + length]
        if kind == JSON_CHUNK:
            doc = json.loads(chunk)
        elif kind == BIN_CHUNK:
            binary = chunk
        o += 8 + length
    node = next(n for n in doc["nodes"] if "mesh" in n)
    prim = doc["meshes"][node["mesh"]]["primitives"][0]

    def values(index):
        a = doc["accessors"][index]
        v = doc["bufferViews"][a["bufferView"]]
        dtype = {5126: "<f4", 5125: "<u4", 5123: "<u2", 5121: "u1", 5122: "<i2"}[a["componentType"]]
        comps = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[a["type"]]
        size = np.dtype(dtype).itemsize
        stride = v.get("byteStride", size * comps)
        base = v.get("byteOffset", 0) + a.get("byteOffset", 0)
        raw = np.frombuffer(binary, dtype=np.uint8, count=stride * (a["count"] - 1) + size * comps, offset=base)
        out = np.lib.stride_tricks.as_strided(raw, shape=(a["count"], comps * size), strides=(stride, 1)).copy()
        out = out.view(dtype).reshape(a["count"], comps).astype(np.float64)
        if a.get("normalized"):
            out /= {5123: 65535.0, 5121: 255.0}[a["componentType"]]
        return out

    pos = values(prim["attributes"]["POSITION"]) * node.get("scale", [1, 1, 1]) + node.get("translation", [0, 0, 0])
    col = values(prim["attributes"]["COLOR_0"])
    if col.shape[1] == 3:
        col = np.hstack([col, np.ones((len(col), 1))])
    if "indices" in prim:
        idx = values(prim["indices"]).astype(int).ravel()
        pos, col = pos[idx], col[idx]
    return pos, col


def write_glb(path, pos, col, joints, weights, bones):
    """Le .glb du modèle : positions, couleurs, os et poids par sommet, sans indices, et les os dans `extras`."""
    n = len(pos)
    lo, hi = pos.min(0), pos.max(0)
    parts = [
        pos.astype("<f4").tobytes(),
        np.round(np.clip(col, 0, 1) * 65535).astype("<u2").tobytes(),
        joints.astype("u1").tobytes(),
        np.round(weights * 255).astype("u1").tobytes(),
    ]
    views, offset = [], 0
    for p in parts:
        views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(p)})
        offset += (len(p) + 3) & ~3
    blob = b"".join(p + b"\0" * (((len(p) + 3) & ~3) - len(p)) for p in parts)
    doc = {
        "asset": {"version": "2.0", "generator": "dysapps squelette.py"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "COLOR_0": 1, "JOINTS_0": 2, "WEIGHTS_0": 3}}]}],
        "buffers": [{"byteLength": len(blob)}],
        "bufferViews": views,
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": n, "type": "VEC3", "min": lo.tolist(), "max": hi.tolist()},
            {"bufferView": 1, "componentType": 5123, "normalized": True, "count": n, "type": "VEC4"},
            {"bufferView": 2, "componentType": 5121, "count": n, "type": "VEC4"},
            {"bufferView": 3, "componentType": 5121, "normalized": True, "count": n, "type": "VEC4"},
        ],
        "extras": {"bones": bones},
    }
    text = json.dumps(doc, separators=(",", ":")).encode()
    text += b" " * (((len(text) + 3) & ~3) - len(text))
    total = 12 + 8 + len(text) + 8 + len(blob)
    with open(path, "wb") as f:
        f.write(struct.pack("<III", GLB, 2, total))
        f.write(struct.pack("<II", len(text), JSON_CHUNK) + text)
        f.write(struct.pack("<II", len(blob), BIN_CHUNK) + blob)


class Frame:
    """Le repère du jeu (models.ts, `placer`) sans l'échelle : X sur le côté, Y en haut depuis les pieds, l'élève vers −Z."""

    def __init__(self, pos, quarts):
        lo, hi = pos.min(0), pos.max(0)
        self.c = np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])
        a = quarts * np.pi / 2
        self.ca, self.sa = round(np.cos(a)), round(np.sin(a))

    def to_game(self, p):
        x, y, z = -(p[:, 0] - self.c[0]), p[:, 1] - self.c[1], -(p[:, 2] - self.c[2])
        return np.stack([x * self.ca + z * self.sa, y, -x * self.sa + z * self.ca], 1)

    def to_file(self, q):
        x = q[:, 0] * self.ca - q[:, 2] * self.sa
        z = q[:, 0] * self.sa + q[:, 2] * self.ca
        return np.stack([self.c[0] - x, q[:, 1] + self.c[1], self.c[2] - z], 1)


def surface(q, per_triangle=40, seed=1):
    """Des points tirés sur la surface des triangles : les sommets d'un modèle à grandes facettes sont trop clairsemés
    pour y lire un creux entre deux jambes."""
    tri = q.reshape(-1, 3, 3)
    r = np.random.default_rng(seed).random((len(tri), per_triangle, 2))
    flip = r.sum(2) > 1
    r[flip] = 1 - r[flip]
    a, b, c = tri[:, None, 0], tri[:, None, 1], tri[:, None, 2]
    return (a + r[..., :1] * (b - a) + r[..., 1:] * (c - a)).reshape(-1, 3)


def find_legs(q, h):
    """Les deux jambes : sous l'entrejambe, les sommets se séparent en deux paquets de part et d'autre du milieu."""
    split = []
    centre = np.median(q[:, 0])
    for y0 in np.arange(0.02, 0.5, 0.02) * h:
        s = q[(q[:, 1] >= y0) & (q[:, 1] < y0 + 0.02 * h)]
        if len(s) < 20:
            continue
        xs = np.sort(s[:, 0])
        lo, hi = xs[0], xs[-1]
        gaps = np.diff(xs)
        mid = (xs[:-1] + xs[1:]) / 2
        # Un écart près du milieu du modèle seulement (pas entre le tronc et un bras qui pend).
        inner = np.abs(mid - centre) < 0.08 * h
        if not inner.any() or gaps[inner].max() < 0.025 * h:
            if split:
                break
            continue
        k = np.flatnonzero(inner)[np.argmax(gaps[inner])]
        split.append((y0, mid[k]))
    # Deux tranches suffisent : des pattes courtes (une taupe en manteau) n'en ont pas plus.
    if len(split) < 2:
        return None
    crotch = split[-1][0] + 0.02 * h
    cut = np.median([m for _, m in split])
    below = q[(q[:, 1] < crotch) & (q[:, 1] > 0.03 * h)]
    legs = []
    for side in (below[:, 0] < cut, below[:, 0] >= cut):
        s = below[side]
        centre = np.array([np.median(s[:, 0]), np.median(s[:, 2])])
        # Son épaisseur : mesurée au bas de la jambe, où ne descend ni bras ni outil.
        foot = s[s[:, 1] < 0.4 * crotch]
        foot = foot if len(foot) >= 20 else s  # des pattes courtes : toute la patte
        radius = np.percentile(np.hypot(foot[:, 0] - centre[0], foot[:, 2] - centre[1]), 90)
        legs.append((centre, radius))
    return crotch, legs


def find_arms(q, h, crotch, neck, centre):
    """Les deux bras : de chaque côté, un creux entre le tronc et le bras qui pend, entre l'entrejambe et le cou. Pour
    chacun : la limite entre le tronc et le bras (en x), l'épaule et le bas de la main (en y)."""
    limits = {-1: [], 1: []}
    for y0 in np.arange(crotch + 0.02 * h, neck - 0.08 * h, 0.02 * h):
        s = q[(q[:, 1] >= y0) & (q[:, 1] < y0 + 0.02 * h)]
        xs = np.sort(s[:, 0])
        gaps, mid = np.diff(xs), (xs[:-1] + xs[1:]) / 2
        for side in (-1, 1):
            off = (mid - centre) * side
            ok = (off > 0.1 * h) & (off < 0.32 * h) & (gaps > 0.006 * h)
            if ok.any():
                k = np.flatnonzero(ok)[np.argmax(gaps[ok])]
                limits[side].append(mid[k])
    arms = {}
    for side, found in limits.items():
        if len(found) < 2:
            continue
        limit = float(np.median(found))
        out = q[(q[:, 0] - limit) * side > 0.01 * h]
        out = out[(out[:, 1] < neck) & (out[:, 1] > crotch)]
        if len(out) < 50:
            continue
        hand = float(np.percentile(out[:, 1], 2))
        arms[side] = (limit, neck - 0.06 * h, hand, float(np.median(out[:, 0])), float(np.median(out[:, 2])))
    return arms


def find_tail(q, h, crotch, neck):
    """La queue : ce qui dépasse franchement derrière le tronc (vers +Z), entre les jambes et le cou."""
    band = q[(q[:, 1] > crotch) & (q[:, 1] < neck)]
    # Le dos : celui du milieu du corps (une queue portée sur le côté ne le recule pas).
    middle = band[np.abs(band[:, 0] - np.median(band[:, 0])) < 0.1 * h]
    back = np.percentile(middle[:, 2], 95)
    cand = q[(q[:, 2] > back + 0.1 * h) & (q[:, 1] > 0.05 * h) & (q[:, 1] < neck)]
    if len(cand) < 0.02 * len(q):
        return None
    base = cand[cand[:, 2] <= np.percentile(cand[:, 2], 12)].mean(0)
    base[2] = back  # la queue part du dos
    d = np.linalg.norm(cand - base, axis=1)
    tip = cand[d >= np.percentile(d, 90)].mean(0)
    middle = cand[np.abs(d - np.linalg.norm(tip - base) / 2) < 0.05 * h].mean(0)
    return base, middle, tip


def seg_dist(p, a, b):
    """La distance de chaque point au segment [a, b], et où il tombe le long du segment (de 0 à 1)."""
    ab = b - a
    t = np.clip(((p - a) @ ab) / max(ab @ ab, 1e-12), 0, 1)
    return np.linalg.norm(p - (a + t[:, None] * ab), axis=1), t


def touching(q, mask, seeds):
    """Les sommets de `mask` reliés à un sommet de `seeds` par des arêtes de triangles dont les deux bouts sont dans
    `mask` (les sommets de même position soudés)."""
    _, ids = np.unique(np.round(q, 5), axis=0, return_inverse=True)
    ids = ids.ravel()
    parent = np.arange(ids.max() + 1)

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    for t in range(0, len(q), 3):
        for i, j in ((t, t + 1), (t + 1, t + 2), (t + 2, t)):
            if mask[i] and mask[j]:
                parent[find(ids[i])] = find(ids[j])
    roots = np.array([find(i) for i in ids])
    return mask & np.isin(roots, roots[seeds & mask])


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def rig(q, h, settings):
    """Les os (nom, parent, tête dans le repère du jeu) et quatre os et poids par sommet."""
    dense = surface(q)
    legs = None if settings.get("jambes") == "non" else find_legs(dense, h)
    crotch = legs[0] if legs else 0.3 * h
    neck = float(settings.get("cou", 0.6)) * h
    torso = dense[(dense[:, 1] > crotch) & (dense[:, 1] < neck)]
    cx, cz = np.median(torso[:, 0]), np.median(torso[:, 2])
    bones = [("hips", -1, [cx, crotch, cz]), ("spine", 0, [cx, crotch + 0.12 * h, cz]), ("head", 1, [cx, neck, cz])]
    w = {}
    y = q[:, 1]
    # Le tronc : les hanches en bas, le dos au-dessus, la tête au-dessus du cou, en fondu sur une bande.
    up = smooth((y - (crotch + 0.06 * h)) / (0.12 * h))
    head = smooth((y - (neck - 0.04 * h)) / (0.08 * h))
    w["hips"] = 1 - up
    w["spine"] = up * (1 - head)
    w["head"] = up * head
    if legs:
        for i, side in enumerate(("L", "R")):
            (lx, lz), radius = legs[1][i]
            hip, foot = np.array([lx, crotch, lz]), np.array([lx, 0.0, lz])
            knee = (hip + foot) / 2
            bones.append((f"thigh.{side}", 0, hip.tolist()))
            bones.append((f"shin.{side}", len(bones) - 1, knee.tolist()))
            d, t = seg_dist(q, hip, foot)
            # La jambe ne prend que ce qui l'entoure, sous l'entrejambe ; au ras de l'entrejambe, elle se fond aux hanches.
            near = (d < 1.25 * radius) & (y < crotch + 0.03 * h)
            k = near * smooth((crotch + 0.03 * h - y) / (0.08 * h))
            lower = smooth((0.5 - (y / max(crotch, 1e-9))) / 0.2 + 0.5)
            w[f"thigh.{side}"] = k * (1 - lower)
            w[f"shin.{side}"] = k * lower
            for n in ("hips", "spine", "head"):
                w[n] = w[n] * (1 - k)
    # Les bras se cherchent sans ce qui dépasse franchement derrière le dos (une queue portée sur le côté).
    back = np.percentile(torso[np.abs(torso[:, 0] - cx) < 0.1 * h][:, 2], 95)
    arms = {} if settings.get("bras") == "non" else find_arms(dense[dense[:, 2] < back + 0.05 * h], h, crotch, neck, cx)
    # bras=L ou bras=R : un seul bras se détache du corps (l'autre est pris dans le manteau, ou tient le ventre).
    arms = {k: v for k, v in arms.items() if settings.get("bras") not in ("L", "R") or (k < 0) == (settings["bras"] == "L")}
    if arms:
        # Ce qui dépasse devant ou derrière le corps, tranche par tranche : le corps est la bande du milieu, en x.
        outside = np.zeros(len(q))
        for y0 in np.arange(0, neck, 0.02 * h):
            band = (y >= y0) & (y < y0 + 0.02 * h)
            middle = dense[(dense[:, 1] >= y0 - 0.02 * h) & (dense[:, 1] < y0 + 0.04 * h) & (np.abs(dense[:, 0] - cx) < 0.1 * h)]
            if len(middle):
                front, back = np.percentile(middle[:, 2], [1, 99])
                outside[band] = np.maximum(front - q[band, 2], q[band, 2] - back)
    for side, (limit, shoulder, hand, ax, az) in arms.items():
        name = "arm." + ("L" if side < 0 else "R")
        bones.append((name, 1, [ax, shoulder, az]))
        # Le bras prend ce qui dépasse du tronc sur le côté, au-dessus de l'entrejambe (pas les pieds), et, de son côté,
        # ce qui dépasse devant ou derrière le corps (l'outil tenu) ; à l'épaule, il se fond au dos.
        beside = smooth(((q[:, 0] - limit) * side) / (0.02 * h)) * smooth((y - crotch) / (0.03 * h))
        held = smooth(((q[:, 0] - cx) * side - 0.12 * h) / (0.02 * h)) * smooth(outside / (0.02 * h))
        # L'outil tenu touche la main : ce qui dépasse sans toucher le bras (une queue, un pied) reste au corps.
        held = held * touching(q, (held > 0.05) | (beside > 0.5), beside > 0.5)
        k = np.maximum(beside, held) * smooth((shoulder + 0.02 * h - y) / (0.08 * h))
        if settings.get("leve") == name[-1]:
            # La main levée (un marteau brandi au-dessus de l'épaule) : ce qui dépasse sur le côté, à toute hauteur.
            k = np.maximum(k, beside * touching(q, beside > 0.5, k > 0.5))
        w[name] = k
        for n in [b[0] for b in bones if b[0] != name]:
            if n in w:
                w[n] = w[n] * (1 - k)
    tail = None if settings.get("queue") == "non" else find_tail(dense, h, crotch, neck)
    if tail:
        base, middle, tip = tail
        bones.append(("tail.1", 0, base.tolist()))
        bones.append(("tail.2", len(bones) - 1, middle.tolist()))
        d1, _ = seg_dist(q, base, middle)
        d2, _ = seg_dist(q, middle, tip)
        r = 0.14 * h
        behind = q[:, 2] > base[2] - 0.02 * h
        k1 = behind * (d1 < r) * (d1 <= d2)
        k2 = behind * (d2 < r) * (d2 < d1)
        # Près de sa base, la queue se fond au corps.
        k1 = k1 * smooth((q[:, 2] - base[2] + 0.02 * h) / (0.08 * h))
        w["tail.1"] = k1
        w["tail.2"] = k2.astype(float)
        for n in [b[0] for b in bones if not b[0].startswith("tail")]:
            w[n] = w[n] * (1 - np.maximum(k1, k2))
    names = [b[0] for b in bones]
    m = np.stack([w[n] for n in names], 1)
    order = np.argsort(-m, 1)[:, :4]
    top = np.take_along_axis(m, order, 1)
    top /= np.maximum(top.sum(1, keepdims=True), 1e-9)
    # Des poids en octets qui font 1 tout juste : le reste va au premier.
    top = np.round(top * 255) / 255
    top[:, 0] += 1 - top.sum(1)
    return bones, order, top


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    folder, quarts = args[0], int(args[1])
    settings = dict(a.split("=", 1) for a in args[2:])
    path = os.path.join(folder, "final-1500.glb")
    pos, col = read_glb(path)
    frame = Frame(pos, quarts)
    q = frame.to_game(pos)
    h = q[:, 1].max()
    bones, joints, weights = rig(q, h, settings)
    print(f"hauteur {h:.3f}", " ".join(f"{n}={np.round(np.array(p) / h, 2).tolist()}" for n, _, p in bones))
    heads = frame.to_file(np.array([b[2] for b in bones]))
    out = [{"name": n, "parent": p, "head": [round(float(v), 5) for v in heads[i]]} for i, (n, p, _) in enumerate(bones)]
    write_glb(path, pos, col, joints, weights, out)
    print(json.dumps({"bones": [b[0] for b in bones]}))


if __name__ == "__main__":
    main()
