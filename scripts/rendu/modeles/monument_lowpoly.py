# Monument low-poly en aplats francs : remaille en voxels un .glb texture (TRELLIS.2), le reduit a N triangles,
# puis peint chaque facette d'une seule couleur, prise dans une courte liste de couleurs cibles (4 a 6) choisie pour
# le monument dans docs/univers/archipeo/monuments/modeles/reglages.csv, ou pour le batiment d'un plan dans
# docs/univers/archipeo/batiments/modeles/reglages.csv (choix du mainteneur, 10 octobre 2026 : « low poly avec des
# aplats de couleur »).
#   (module bpy, avec numpy et fast-simplification)
#   python monument_lowpoly.py -- entree.glb sortie.glb <nom du dossier> [N=3000] [K=6] [voxel]
#
# Le remaillage (voxel = part de la plus grande dimension, 0,008 sauf autre valeur dans la table) lisse la surface de TRELLIS avant le Decimate de Blender :
# sans lui, la reduction laisse eclats, trous et ailes dechirees. Les couleurs : la texture de TRELLIS a l'ombre
# peinte, et ses faces internes sont noires. Chaque facette lit la texture du brut en sept points (les noirs ecartes) ;
# les facettes se regroupent en K grappes (k-moyennes en Lab, la luminance comptee a 35 % pour que l'ombre pese moins) ;
# chaque grappe prend la cible la plus proche, une grappe bleutee prend la cible la plus bleue (l'ardoise sortait
# noire) ; une facette sans couleur lue prend celle de ses voisines, et un triangle isole celle qui l'entoure.
import bpy, sys, os, csv
import numpy as np
from collections import Counter, defaultdict
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

a = sys.argv[sys.argv.index("--") + 1:]
ENTREE, SORTIE, NOM = a[0], a[1], a[2]
N = int(a[3]) if len(a) > 3 else 3000
K = int(a[4]) if len(a) > 4 else 6
VOXEL = float(a[5]) if len(a) > 5 else None
# les deux tables : celle des monuments, puis celle des batiments des plans (decision du mainteneur, 10 octobre 2026 :
# les batiments passent par la meme chaine) ; le nom du dossier n'est que dans l'une des deux
ICI = os.path.dirname(os.path.abspath(__file__))
TABLES = [os.path.join(ICI, "../../../docs/univers/archipeo", t, "modeles/reglages.csv") for t in ("monuments", "batiments")]
cibles = None
for table in TABLES:
    if not os.path.exists(table): continue
    for ligne in csv.reader((l for l in open(table, encoding="utf-8") if not l.startswith("#")), delimiter=";"):
        if ligne and ligne[0].strip() == NOM:
            cibles = [int(h, 16) for h in ligne[1].split()]
            if VOXEL is None and len(ligne) > 2 and ligne[2].strip(): VOXEL = float(ligne[2])
if VOXEL is None: VOXEL = 0.008
if not cibles:
    raise SystemExit(f"{NOM} : pas de couleurs cibles dans {' ni '.join(TABLES)}")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=ENTREE)
o = [x for x in bpy.data.objects if x.type == "MESH"][0]
o.data.transform(o.matrix_world); o.matrix_world.identity()
orig = o.copy(); orig.data = o.data.copy(); bpy.context.collection.objects.link(orig)
image = next(l.from_node.image for m in orig.data.materials if m and m.use_nodes for n in m.node_tree.nodes
             if n.type == "BSDF_PRINCIPLED" for l in n.inputs["Base Color"].links if l.from_node.type == "TEX_IMAGE")
L, H = image.size
pixels = np.array(image.pixels[:], np.float32).reshape(H, L, 4)[..., :3]   # sRVB (image 8 bits)

bpy.context.view_layer.objects.active = o
if VOXEL > 0:
    r = o.modifiers.new("v", "REMESH"); r.mode = "VOXEL"; r.voxel_size = max(o.dimensions) * VOXEL
    bpy.ops.object.modifier_apply(modifier="v")
for _ in range(6):   # le Decimate cale parfois au-dessus de la cible (pieces detachees) : on repasse
    o.modifiers.new("t", "TRIANGULATE"); bpy.ops.object.modifier_apply(modifier="t")
    n = len(o.data.polygons)
    if n <= N * 1.02: break
    d = o.modifiers.new("d", "DECIMATE"); d.decimate_type = "COLLAPSE"; d.ratio = N / n
    bpy.ops.object.modifier_apply(modifier="d")
if len(o.data.polygons) > N * 1.02:   # toujours trop : reduction quadrique (fast-simplification, licence MIT)
    import fast_simplification as fs
    V = np.array([v.co[:] for v in o.data.vertices], np.float32)
    F = np.array([p.vertices[:] for p in o.data.polygons], np.int32)
    V2, F2 = fs.simplify(V, F, target_reduction=1 - N / len(F))
    o.data.clear_geometry(); o.data.from_pydata(V2.tolist(), [], F2.tolist()); o.data.update()
me = o.data

# la couleur de chaque facette, lue sur le brut (point le plus proche, coordonnees de texture interpolees)
arbre = BVHTree.FromObject(orig, bpy.context.evaluated_depsgraph_get())
mo = orig.data; uvs = mo.uv_layers.active.data
poids = [(1/3, 1/3, 1/3), (.6, .2, .2), (.2, .6, .2), (.2, .2, .6), (.45, .45, .1), (.1, .45, .45), (.45, .1, .45)]
cols = []
for p in me.polygons:
    v = [me.vertices[i].co for i in p.vertices[:3]]; s = []
    for w in poids:
        co, _, idx, _ = arbre.find_nearest(v[0] * w[0] + v[1] * w[1] + v[2] * w[2])
        f = mo.polygons[idx]
        A, B, C = (mo.vertices[i].co for i in f.vertices[:3])
        uv = barycentric_transform(co, A, B, C, *(uvs[li].uv.to_3d() for li in list(f.loop_indices)[:3]))
        s.append(pixels[min(H - 1, max(0, int(uv.y * H))), min(L - 1, max(0, int(uv.x * L)))])
    s = np.array(s); ok = s.max(1) > .06
    cols.append(np.median(s[ok], 0) if ok.any() else np.zeros(3))
bpy.data.objects.remove(orig)
S = np.array(cols)
inconnu = S.max(1) <= .06
aire = np.array([p.area for p in me.polygons]) * ~inconnu

def lab(c, lw=.35):
    l = np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
    xyz = l @ np.array([[.4124, .3576, .1805], [.2126, .7152, .0722], [.0193, .1192, .9505]]).T / np.array([.9505, 1, 1.089])
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([(116 * f[:, 1] - 16) * lw, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], 1)

X = lab(S)
if (aire > 0).sum() < K:
    raise SystemExit(f"{NOM} : moins de {K} facettes dont la couleur se lit dans la texture")
C = X[np.random.default_rng(1).choice(len(X), K, replace=False, p=aire / aire.sum())]
for _ in range(40):
    g = ((X[:, None] - C[None]) ** 2).sum(2).argmin(1)
    C = np.array([np.average(X[g == k], 0, aire[g == k]) if aire[g == k].sum() > 0 else C[k] for k in range(K)])
T = np.array([[(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255] for c in cibles])
# l'ombre peinte rend une grappe plus sombre que sa cible : on la remonte de 12 points de luminance L* (mesure sur le
# moulin : un mur clair au soleil et a l'ombre se lit a 10 a 15 points sous sa cible), comptes a 35 % comme le reste
TL = lab(T); CL = C.copy(); CL[:, 0] += 12 * .35
choix = ((CL[:, None] - TL[None]) ** 2).sum(2).argmin(1)
# une grappe nettement bleutee (b* sous -4 : au-dela du bruit d'un gris) prend la cible la plus bleue, meme sombre
choix[CL[:, 2] < -4] = TL[:, 2].argmin()
for k in np.argsort([-aire[g == k].sum() for k in range(K)]):
    m = np.average(S[g == k], 0, aire[g == k]) if aire[g == k].sum() > 0 else np.zeros(3)
    print("grappe #%02x%02x%02x %3.0f %% -> #%06x" % (*(m * 255).round().astype(int), 100 * aire[g == k].sum() / aire.sum(), cibles[choix[k]]))
lab_f = choix[g]; lab_f[inconnu] = -1

voisins = defaultdict(list)
for p in me.polygons:
    for ek in p.edge_keys: voisins[ek].append(p.index)
def autour(p): return [lab_f[f] for ek in p.edge_keys for f in voisins[ek] if f != p.index]
for _ in range(50):   # facettes sans couleur lue (faces internes) : la couleur la plus frequente autour
    reste = False
    for p in me.polygons:
        if lab_f[p.index] == -1:
            nb = [x for x in autour(p) if x != -1]
            if nb: lab_f[p.index] = Counter(nb).most_common(1)[0][0]
            else: reste = True
    if not reste: break
lab_f[lab_f == -1] = 0
for _ in range(2):    # triangles isoles
    neuf = lab_f.copy()
    for p in me.polygons:
        nb = autour(p)
        if len(nb) >= 2 and len(set(nb)) == 1 and nb[0] != lab_f[p.index]: neuf[p.index] = nb[0]
    lab_f = neuf

attr = me.color_attributes.new("Couleur", "BYTE_COLOR", "CORNER")
me.color_attributes.active_color = attr
for p in me.polygons:   # valeurs sRVB ecrites telles quelles, comme le reste de la chaine (le jeu les lit ainsi)
    c = (*T[lab_f[p.index]], 1.0)
    for li in p.loop_indices: attr.data[li].color = c
    p.use_smooth = False
me.materials.clear()
while me.uv_layers: me.uv_layers.remove(me.uv_layers[0])
print(f"{NOM} : {len(me.polygons)} triangles")
bpy.ops.export_scene.gltf(filepath=SORTIE, export_format="GLB", export_texcoords=False,
                          export_vertex_color="ACTIVE", export_all_vertex_colors=False)
