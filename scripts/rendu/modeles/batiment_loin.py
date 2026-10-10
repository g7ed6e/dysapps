# La version de loin du batiment d'un plan (decision du mainteneur, 10 octobre 2026 : environ 200 triangles de loin),
# en volumes simples tires du modele de pres, car la reduction automatique a 200 triangles (Decimate,
# fast-simplification, voxels) en fait une bouillie : un bloc de murs, un toit a deux pans nets, la cheminee, une
# ouverture sombre et la poutre sur la facade (avis du directeur artistique sur l'essai de la forge), aux couleurs dominantes du
# modele de pres. Generique : il lit tout dans le modele, rien n'est propre a un batiment.
#   (module bpy)
#   python3.11 batiment_loin.py -- final-3000.glb dossier 0.44
# 0.44 : la hauteur de l'avant-toit, en part de la hauteur du modele (la meme que la coupe de l'etape 1).
# Sortie : loin.glb (le batiment entier) et loin-etape-1.glb (les murs fermes en haut, sans toit ni cheminee), dans le
# repere du modele de pres (le jeu les pose avec la meme echelle et le meme centre).
# La facade est -Y dans Blender (+Z du .glb), comme pour les monuments.
import os
import sys

import bpy  # avant bmesh, qu'il fournit
import bmesh
import numpy as np

args = sys.argv[sys.argv.index("--") + 1:]
SOURCE, FOLDER, EAVE = args[0], args[1], float(args[2])

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SOURCE)
obj = [x for x in bpy.data.objects if x.type == "MESH"][0]
obj.data.transform(obj.matrix_world)
obj.matrix_world.identity()
mesh = obj.data
layer = mesh.color_attributes.active_color
if layer is None:
    raise SystemExit(f"{SOURCE} : pas de couleurs par sommet (lancer monument_lowpoly.py d'abord)")

# chaque facette : son centre, sa normale, son aire et sa couleur, telle que le fichier la porte (rendue telle quelle)
faces = []
for p in mesh.polygons:
    color = tuple(round(c, 4) for c in layer.data[p.loop_indices[0]].color[:3])
    faces.append((np.array(p.center[:]), np.array(p.normal[:]), p.area, color))
verts = np.array([v.co[:] for v in mesh.vertices])
z0, z1 = verts[:, 2].min(), verts[:, 2].max()
H = z1 - z0
eave = z0 + H * EAVE


def luminance(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def dominant(selected, exclude=()):
    """La couleur qui couvre le plus d'aire parmi ces facettes (sans celles de `exclude`)."""
    areas = {}
    for _, _, a, c in selected:
        if c not in exclude:
            areas[c] = areas.get(c, 0.0) + a
    return max(areas, key=areas.get) if areas else None


colors = {c for *_, c in faces}
# le fond de l'ouverture : la couleur la plus sombre du modele, si elle l'est vraiment
dark = min(colors, key=luminance)
if luminance(dark) > 0.25:
    dark = None

# les murs : la bande entre 15 % de la hauteur et l'avant-toit ; leur emprise sans les objets poses devant (4e et 96e
# centiles des sommets de la bande), leur couleur celle qui couvre le plus les facettes verticales (hors fond sombre)
band = verts[(verts[:, 2] > z0 + 0.15 * H) & (verts[:, 2] < eave - 0.03 * H)]
wx0, wx1 = np.percentile(band[:, 0], [4, 96])
wy0, wy1 = np.percentile(band[:, 1], [4, 96])
walls = [f for f in faces if abs(f[1][2]) < 0.5 and z0 + 0.15 * H < f[0][2] < eave]
wall_color = dominant(walls, exclude=(dark,)) or dominant(faces)

# le toit : les facettes tournees vers le haut au-dessus de l'avant-toit ; sa couleur, son emprise, son faitage et son sens
roof_faces = [f for f in faces if f[1][2] > 0.3 and f[0][2] > eave]
roof_color = dominant(roof_faces, exclude=(dark, wall_color)) or dominant(roof_faces) or wall_color
roof = [f for f in roof_faces if f[3] == roof_color] or roof_faces
pts = np.array([f[0] for f in roof])
rx0, rx1 = min(np.percentile(pts[:, 0], 1), wx0), max(np.percentile(pts[:, 0], 99), wx1)
ry0, ry1 = min(np.percentile(pts[:, 1], 1), wy0), max(np.percentile(pts[:, 1], 99), wy1)
ridge = max(np.percentile(pts[:, 2], 98), eave + 0.1 * H)
# le faitage court le long de l'axe ou les pans ne regardent pas : des pans tournes vers +-X, un faitage le long de Y
wn = sum(abs(f[1][0]) * f[2] for f in roof), sum(abs(f[1][1]) * f[2] for f in roof)
ridge_along_y = wn[0] >= wn[1]
# l'avant-toit deborde un peu des murs, jamais plus d'un quart de leur largeur
mx, my = 0.25 * (wx1 - wx0), 0.25 * (wy1 - wy0)
rx0, rx1, ry0, ry1 = max(rx0, wx0 - mx), min(rx1, wx1 + mx), max(ry0, wy0 - my), min(ry1, wy1 + my)

# la cheminee : ce qui depasse nettement le faitage
top = verts[verts[:, 2] > ridge + 0.04 * H]
chimney = None
if len(top) >= 4:
    cx0, cx1 = np.percentile(top[:, 0], [2, 98])
    cy0, cy1 = np.percentile(top[:, 1], [2, 98])
    side = max(cx1 - cx0, cy1 - cy0, 0.06 * H)
    cx, cy = (cx0 + cx1) / 2, (cy0 + cy1) / 2
    sx, sy = max(cx1 - cx0, side * 0.6) / 2, max(cy1 - cy0, side * 0.6) / 2
    chimney_faces = [f for f in faces if f[0][2] > ridge]
    chimney = (cx - sx, cx + sx, cy - sy, cy + sy, top[:, 2].max(), dominant(chimney_faces, exclude=(dark, roof_color)) or wall_color)

# l'ouverture : les facettes sombres tournees vers la facade (-Y), sous l'avant-toit
opening = None
if dark is not None:
    # pres du mur de facade seulement (le fond de la forge, plus loin, n'en est pas)
    front = [f for f in faces if f[3] == dark and f[1][1] < -0.6 and f[0][2] < eave and f[0][1] < wy0 + 0.3 * (wy1 - wy0)]
    if front:
        q = np.array([f[0] for f in front])
        w8 = np.array([f[2] for f in front])

        def weighted(values, pcts):
            order = np.argsort(values)
            cum = np.cumsum(w8[order]) / w8.sum()
            return [values[order][min(np.searchsorted(cum, p / 100), len(values) - 1)] for p in pcts]

        ox0, ox, ox1 = weighted(q[:, 0], [15, 50, 85])
        oz1 = weighted(q[:, 2], [85])[0]
        # entre un cinquieme et la moitie de la largeur du mur ; entre un quart et les trois quarts de sa hauteur
        W, Hw = wx1 - wx0, eave - z0
        w = min(max(ox1 - ox0, 0.2 * W), 0.5 * W)
        ox = min(max(ox, wx0 + w / 2), wx1 - w / 2)
        opening = (ox - w / 2, ox + w / 2, z0, z0 + min(max(oz1 - z0, 0.25 * Hw), 0.75 * Hw))


def build(whole):
    """Le maillage de loin : une liste de polygones (points, couleur)."""
    polys = []
    a, b, c, d = (wx0, wy0), (wx1, wy0), (wx1, wy1), (wx0, wy1)
    # les quatre murs, du sol a l'avant-toit
    for (x0, y0), (x1, y1) in ((a, b), (b, c), (c, d), (d, a)):
        polys.append(([(x0, y0, z0), (x1, y1, z0), (x1, y1, eave), (x0, y0, eave)], wall_color))
    if not whole:
        # l'etape 1 : le dessus ferme en pierre des murs (jamais un toit plat brun)
        polys.append(([(wx0, wy0, eave), (wx1, wy0, eave), (wx1, wy1, eave), (wx0, wy1, eave)], wall_color))
    else:
        # le dessous de l'avant-toit, puis les deux pans et les deux pignons
        polys.append(([(rx0, ry0, eave), (rx0, ry1, eave), (rx1, ry1, eave), (rx1, ry0, eave)], wall_color))
        if ridge_along_y:
            xm = (rx0 + rx1) / 2
            polys.append(([(rx0, ry0, eave), (xm, ry0, ridge), (xm, ry1, ridge), (rx0, ry1, eave)], roof_color))
            polys.append(([(rx1, ry1, eave), (xm, ry1, ridge), (xm, ry0, ridge), (rx1, ry0, eave)], roof_color))
            polys.append(([(rx0, ry0, eave), (rx1, ry0, eave), (xm, ry0, ridge)], wall_color))
            polys.append(([(rx1, ry1, eave), (rx0, ry1, eave), (xm, ry1, ridge)], wall_color))
        else:
            ym = (ry0 + ry1) / 2
            polys.append(([(rx1, ry0, eave), (rx1, ym, ridge), (rx0, ym, ridge), (rx0, ry0, eave)], roof_color))
            polys.append(([(rx0, ry1, eave), (rx0, ym, ridge), (rx1, ym, ridge), (rx1, ry1, eave)], roof_color))
            polys.append(([(rx0, ry0, eave), (rx0, ym, ridge), (rx0, ry1, eave)], wall_color))
            polys.append(([(rx1, ry1, eave), (rx1, ym, ridge), (rx1, ry0, eave)], wall_color))
        if chimney:
            x0, x1, y0, y1, zt, col = chimney
            # du dessous du toit au sommet : les quatre cotes et le chapeau
            zb = eave
            for (u0, v0), (u1, v1) in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))):
                polys.append(([(u0, v0, zb), (u1, v1, zb), (u1, v1, zt), (u0, v0, zt)], col))
            polys.append(([(x0, y0, zt), (x1, y0, zt), (x1, y1, zt), (x0, y1, zt)], col))
    y = wy0 - 0.004 * H   # un rien devant le mur de facade
    if opening:
        x0, x1, zb, zt = opening
        polys.append(([(x0, y, zb), (x1, y, zb), (x1, y, zt), (x0, y, zt)], dark))
    if dark is not None:
        # la poutre de facade, sous l'avant-toit : la ligne horizontale franche ou se coupe l'etape 1
        polys.append(([(wx0, y, eave - 0.04 * H), (wx1, y, eave - 0.04 * H), (wx1, y, eave), (wx0, y, eave)], dark))
    return polys


def write(polys, path):
    # chaque polygone triangule a part : ses triangles gardent sa couleur
    bpy.ops.wm.read_factory_settings(use_empty=True)
    centre = np.array([(wx0 + wx1) / 2, (wy0 + wy1) / 2, (z0 + eave) / 2])
    me = bpy.data.meshes.new("loin")
    bm = bmesh.new()
    colors_of_faces = []
    for points, color in polys:
        f = bm.faces.new([bm.verts.new(p) for p in points])
        f.normal_update()
        out = np.array(f.calc_center_median()[:]) - centre
        if float(np.dot(np.array(f.normal[:]), out)) < 0:
            f.normal_flip()
        tris = bmesh.ops.triangulate(bm, faces=[f])["faces"]
        colors_of_faces += [color] * len(tris)
    bm.to_mesh(me)
    bm.free()
    attr = me.color_attributes.new("Couleur", "BYTE_COLOR", "CORNER")
    me.color_attributes.active_color = attr
    for p, color in zip(me.polygons, colors_of_faces):
        for li in p.loop_indices:
            attr.data[li].color = (*color, 1.0)
        p.use_smooth = False
    obj = bpy.data.objects.new("loin", me)
    bpy.context.collection.objects.link(obj)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_texcoords=False,
                              export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    print(f"{os.path.basename(path)} : {len(me.polygons)} triangles")


os.makedirs(FOLDER, exist_ok=True)
print("murs", [round(x, 3) for x in (wx0, wx1, wy0, wy1)], "avant-toit", round(eave, 3), "faitage", round(ridge, 3),
      "le long de Y" if ridge_along_y else "le long de X", "cheminee", chimney is not None, "ouverture", opening is not None)
write(build(True), os.path.join(FOLDER, "loin.glb"))
write(build(False), os.path.join(FOLDER, "loin-etape-1.glb"))
