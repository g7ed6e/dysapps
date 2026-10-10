# Peint une créature d'Archipéo en aplats, dans ses fichiers : ses deux versions (final-1500.glb et final-200.glb) gardent
# chacune quatre couleurs tirées de la texture faite par TRELLIS.2 (lion_lowpoly.py), sombres et bigarrées (l'ombre est
# peinte dans la texture). Chaque couleur source prend la couleur cible de la colonne « aplats » de
# docs/univers/archipeo/personnages/modeles/reglages.csv, choisie par le directeur artistique d'après le concept : deux
# sources de la même matière prennent la même cible et ne font plus qu'une zone. Le modèle de loin a ses propres quatre
# couleurs, voisines de celles de près : chacune prend la cible de la source la plus proche. Puis un triangle dont tous
# les voisins (deux au moins, par une arête) ont une même autre couleur la prend : les triangles isolés disparaissent,
# les petites zones de plusieurs triangles (un œil, une tache) restent.
#
#   python3 aplats.py -- <dossier d'un modèle> [<dossier d'un modèle>…]
#
# Dernière étape de la chaîne, après lot.py et squelette.py : seules les couleurs (COLOR_0) changent, le reste du fichier
# (positions, os et poids) est gardé octet pour octet. Un modèle déjà en aplats (toutes ses couleurs sont des cibles) est
# laissé tel quel : relancer le script ne change rien. Un modèle refait par lot.py a d'autres sources : refaire sa ligne
# de la table. Un modèle sans ligne : le script donne ses couleurs, de la plus étendue à la moins étendue, et s'arrête.
# Sans dépendance à Blender : numpy seulement.

import json, os, struct, sys
import numpy as np

JSON_CHUNK, BIN_CHUNK = 0x4E4F534A, 0x004E4942
TABLE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../docs/univers/archipeo/personnages/modeles/reglages.csv")


def read_table(path=TABLE):
    """La colonne « aplats » : pour chaque modèle qui en a, ses couleurs sources et leurs cibles (0xRRGGBB, sRVB)."""
    table = {}
    for line in open(path, encoding="utf-8"):
        cols = line.rstrip("\n").split(";")
        if line.startswith("#") or len(cols) < 5 or not cols[4].strip():
            continue
        table[cols[0].strip()] = {int(s, 16): int(t, 16) for s, t in (p.split(">") for p in cols[4].split())}
    return table


def to_srgb(v):
    return np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(np.clip(v, 0, None), 1 / 2.4) - 0.055)


def to_linear(v):
    return np.where(v <= 0.04045, v / 12.92, np.power((v + 0.055) / 1.055, 2.4))


def channels(c):
    return np.array([(c >> 16) & 255, (c >> 8) & 255, c & 255], dtype=np.float64)


def split(data):
    """Le JSON et le bloc binaire d'un .glb (tous ses autres octets restent tels quels)."""
    doc, binary, o, bin_at = None, None, 12, None
    while o + 8 <= len(data):
        length, kind = struct.unpack_from("<II", data, o)
        if kind == JSON_CHUNK:
            doc = json.loads(data[o + 8:o + 8 + length])
        elif kind == BIN_CHUNK:
            binary, bin_at = bytearray(data[o + 8:o + 8 + length]), o + 8
        o += 8 + length
    return doc, binary, bin_at


def accessor(doc, binary, index):
    """Les valeurs d'un accesseur, et de quoi les réécrire à leur place."""
    a = doc["accessors"][index]
    v = doc["bufferViews"][a["bufferView"]]
    dtype = np.dtype({5126: "<f4", 5125: "<u4", 5123: "<u2", 5121: "u1"}[a["componentType"]])
    comps = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[a["type"]]
    stride = v.get("byteStride", dtype.itemsize * comps)
    base = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    rows = [np.frombuffer(binary, dtype=dtype, count=comps, offset=base + i * stride) for i in range(a["count"])]
    out = np.array(rows, dtype=np.float64)
    scale = {5123: 65535.0, 5121: 255.0}.get(a["componentType"], 1.0) if a.get("normalized") else 1.0

    def write(values):
        raw = np.round(values * scale).astype(dtype) if scale != 1.0 else values.astype(dtype)
        for i in range(a["count"]):
            binary[base + i * stride:base + i * stride + dtype.itemsize * comps] = raw[i].tobytes()

    return out / scale, write


def smooth_isolated(pos, colors):
    """Un triangle dont tous les voisins (deux au moins) ont une même autre couleur la prend ; une passe."""
    n = len(colors)
    _, vertex = np.unique(np.round(pos, 6), axis=0, return_inverse=True)
    vertex = vertex.reshape(n, 3)
    edges = {}
    for t in range(n):
        for k in range(3):
            a, b = vertex[t, k], vertex[t, (k + 1) % 3]
            edges.setdefault((min(a, b), max(a, b)), []).append(t)
    neighbours = [[] for _ in range(n)]
    for ts in edges.values():
        if len(ts) == 2:
            neighbours[ts[0]].append(ts[1])
            neighbours[ts[1]].append(ts[0])
    out = colors.copy()
    for t, v in enumerate(neighbours):
        if len(v) >= 2 and colors[v[0]] != colors[t] and all(colors[u] == colors[v[0]] for u in v):
            out[t] = colors[v[0]]
    return out


def paint(path, table):
    """Peint un fichier en aplats ; rend ce qu'il en est (« peint », « déjà en aplats »)."""
    data = open(path, "rb").read()
    doc, binary, bin_at = split(data)
    node = next(nd for nd in doc["nodes"] if "mesh" in nd)
    prim = doc["meshes"][node["mesh"]]["primitives"][0]
    pos, _ = accessor(doc, binary, prim["attributes"]["POSITION"])
    col, write = accessor(doc, binary, prim["attributes"]["COLOR_0"])
    order = accessor(doc, binary, prim["indices"])[0].astype(int).ravel() if "indices" in prim else np.arange(len(pos))
    if len(np.unique(order)) != len(order):
        raise ValueError(f"{path} : des sommets partagés entre triangles, une couleur par triangle est impossible")
    # La couleur de chaque triangle (ses trois sommets ont la même), en sRVB sur 0-255.
    srgb = np.round(to_srgb(col[order, :3]) * 255).reshape(-1, 3, 3).mean(1)
    targets = np.array([channels(c) for c in table.values()])
    if np.abs(srgb[:, None, :] - targets[None, :, :]).max(2).min(1).max() <= 1:
        return "déjà en aplats"
    sources = np.array([channels(c) for c in table])
    nearest = ((srgb[:, None, :] - sources[None, :, :]) ** 2).sum(2).argmin(1)
    painted = np.array(list(table.values()))[nearest]
    painted = smooth_isolated(pos[order].reshape(-1, 3, 3).reshape(-1, 3), painted)
    rgb = to_linear(np.array([channels(c) for c in painted]) / 255)
    new = col.copy()
    new[order, :3] = np.repeat(rgb, 3, axis=0)
    write(new)
    out = bytearray(data)
    out[bin_at:bin_at + len(binary)] = binary
    open(path, "wb").write(bytes(out))
    return "peint"


def sources(path):
    """Les couleurs d'un modèle (sRVB, 0xRRGGBB), de la plus étendue à la moins étendue : de quoi écrire sa ligne."""
    doc, binary, _ = split(open(path, "rb").read())
    node = next(nd for nd in doc["nodes"] if "mesh" in nd)
    col, _ = accessor(doc, binary, doc["meshes"][node["mesh"]]["primitives"][0]["attributes"]["COLOR_0"])
    rgb = np.round(to_srgb(col[:, :3]) * 255).astype(int)
    found, counts = np.unique((rgb[:, 0] << 16) | (rgb[:, 1] << 8) | rgb[:, 2], return_counts=True)
    return [int(c) for c in found[np.argsort(-counts)]]


def main():
    table = read_table()
    for folder in sys.argv[sys.argv.index("--") + 1:]:
        name = os.path.basename(os.path.normpath(folder))
        if name not in table:
            found = " ".join(f"{c:06x}>??????" for c in sources(os.path.join(folder, "final-1500.glb")))
            raise SystemExit(f"{name} : pas de ligne dans {os.path.normpath(TABLE)} ; ses couleurs : {found}")
        for f in ("final-1500.glb", "final-200.glb"):
            print(name, f, paint(os.path.join(folder, f), table[name]))


if __name__ == "__main__":
    main()
