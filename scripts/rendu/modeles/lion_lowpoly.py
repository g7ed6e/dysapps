# Lion low-poly : reduit un .glb texture (TRELLIS.2, TripoSR...) a N triangles et peint chaque facette
# dans la palette du jeu (pierre #8E8C84, lichen #7A8A6A), d'apres la texture d'origine.
# Tout se fait dans Blender (4.2 ou plus recent), sans autre logiciel.
#
# En ligne de commande (Windows, macOS, Linux) :
#   blender -b -P lion_lowpoly.py -- entree.glb sortie.glb 1500 [couleurs]
# couleurs (facultatif) : 0 = chaque facette en pierre (Gardiens) ; 4 = chaque facette prend la plus proche des
# 4 couleurs principales de la texture d'origine (creatures).
#
# Dans Blender, pour voir le resultat : onglet Scripting > Open > ce fichier, regler ENTREE, SORTIE et
# TRIANGLES ci-dessous, puis Run Script (Alt+P). L'original et la version reduite restent dans la scene.

import bpy, bmesh, sys, os
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

ENTREE = r"C:\Users\moi\Downloads\lion.glb"   # utilise seulement depuis l'interface
SORTIE = r"C:\Users\moi\Downloads\lion-1500.glb"
TRIANGLES = 1500

PIERRE = (0x8E, 0x8C, 0x84)
LICHEN = (0x7A, 0x8A, 0x6A)
SEUIL_VERT = 999        # ecart de vert (sur 255) a partir duquel une facette devient du lichen ; 999 = pas de lichen (choix du 8 octobre 2026), 6 pour le garder
VOXEL = 0.006           # taille du remaillage qui referme le maillage avant la reduction (modele de 1 unite)

ECART_BON = 0.008       # ecart moyen a l'original (modele de 1 unite) en dessous duquel on ne tente pas les essais suivants
COULEURS = 0           # 0 = tout en pierre (les Gardiens) ; n > 0 = les n couleurs principales de la texture (les creatures)

if "--" in sys.argv:
    a = sys.argv[sys.argv.index("--") + 1:]
    ENTREE, SORTIE, TRIANGLES = a[0], a[1], int(a[2])
    COULEURS = int(a[3]) if len(a) > 3 else 0
    bpy.ops.wm.read_factory_settings(use_empty=True)
interface = not bpy.app.background


def lineaire(c):  # couleur sRGB 0-255 -> lineaire 0-1, ce que stockent les attributs de couleur
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


avant = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=ENTREE)
orig = [o for o in bpy.data.objects if o not in avant and o.type == "MESH"][0]
orig.name = "lion-original"

# la texture de base de l'original, et ses pixels en memoire
image = next(n.image for m in orig.data.materials if m and m.use_nodes for n in m.node_tree.nodes
             if n.type == "TEX_IMAGE" and n.image)
L, H = image.size
pixels = list(image.pixels)
uvs = orig.data.uv_layers.active.data

# copie de travail, refermee puis reduite
for o in bpy.context.selected_objects:
    o.select_set(False)
def nettoyer(red):
    """Retire les debris (morceaux detaches de moins de 3 % des facettes, vus sur Bulle et Grimoire) et remet les
    normales vers l'exterieur (des facettes retournees trouaient l'Amphore a 200 triangles)."""
    bm = bmesh.new(); bm.from_mesh(red.data)
    bm.faces.ensure_lookup_table()
    vus, morceaux = set(), []
    for f in bm.faces:
        if f.index in vus:
            continue
        pile, morceau = [f], []
        vus.add(f.index)
        while pile:
            g = pile.pop(); morceau.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in vus:
                        vus.add(h.index); pile.append(h)
        morceaux.append(morceau)
    total = len(bm.faces)
    debris = [g for m in morceaux if len(m) < total * 0.03 for g in m]
    if debris and len(debris) < total:
        bmesh.ops.delete(bm, geom=debris, context="FACES")
        print(f"{len(debris)} facettes de debris retirees")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(red.data); bm.free()


def reduire(voxel, epaisseur=0.0):
    red = orig.copy(); red.data = orig.data.copy(); red.name = f"lion-{TRIANGLES}"
    bpy.context.collection.objects.link(red)
    bpy.context.view_layer.objects.active = red; red.select_set(True)
    bm = bmesh.new(); bm.from_mesh(red.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)  # recoud les coutures de la texture
    bm.to_mesh(red.data); bm.free()
    if epaisseur:  # epaissit les parois fines : le remaillage les remplit au lieu d'en faire deux feuilles collees
        so = red.modifiers.new("epaisseur", "SOLIDIFY"); so.thickness = epaisseur; so.offset = 0
        bpy.ops.object.modifier_apply(modifier=so.name)
    if voxel:
        rm = red.modifiers.new("remaillage", "REMESH"); rm.mode = "VOXEL"; rm.voxel_size = voxel
        bpy.ops.object.modifier_apply(modifier=rm.name)
    bm = bmesh.new(); bm.from_mesh(red.data); bmesh.ops.triangulate(bm, faces=bm.faces); bm.to_mesh(red.data); bm.free()
    nettoyer(red)  # avant la reduction : les debris du remaillage la font caler
    for _ in range(8):  # le collapse cale parfois avant la cible : on repasse
        if len(red.data.polygons) <= TRIANGLES * 1.05:
            break
        d = red.modifiers.new("reduction", "DECIMATE"); d.ratio = TRIANGLES / len(red.data.polygons)
        d.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=d.name)
    return red


# chaque essai remaille puis reduit ; on garde celui qui s'ecarte le moins de l'original (distance moyenne de
# 2 000 points de l'original a la surface reduite). Le premier suffit le plus souvent ; les suivants epaississent
# les parois fines (Bulle, Grimoire) ou remaillent plus gros si la reduction cale (Grand Chene, Castor), et
# rattrapent une reduction qui s'effondre (le corps du Cheval a bascule replie en tente).
def ecart(red):
    arbre_red = BVHTree.FromObject(red, bpy.context.evaluated_depsgraph_get())
    sommets = orig.data.vertices
    pas = max(1, len(sommets) // 2000)
    d = [(arbre_red.find_nearest(sommets[i].co)[3] or 0) for i in range(0, len(sommets), pas)]
    return sum(d) / len(d)


essais = [(VOXEL, 0.0), (VOXEL, VOXEL * 4), (VOXEL * 2, VOXEL * 6), (VOXEL * 4, VOXEL * 8)]
meilleur = None
for voxel, epaisseur in essais:
    red = reduire(voxel, epaisseur)
    n = len(red.data.polygons)
    e = ecart(red) if n <= TRIANGLES * 1.3 else float("inf")
    print(f"essai voxel {voxel}, epaisseur {epaisseur} : {n} triangles, ecart moyen {e:.4f}")
    if meilleur is None or e < meilleur[0]:
        if meilleur:
            bpy.data.objects.remove(meilleur[1])
        meilleur = (e, red)
    else:
        bpy.data.objects.remove(red)
    if meilleur[0] < ECART_BON:
        break
red = meilleur[1]
nettoyer(red)  # la reduction peut detacher a son tour de petits morceaux
red.data.materials.clear()

# couleur de chaque facette : 7 points, ramenes au point le plus proche de l'original, lus dans la texture
arbre = BVHTree.FromObject(orig, bpy.context.evaluated_depsgraph_get())
mo = orig.data
poids = [(1/3, 1/3, 1/3), (.6, .2, .2), (.2, .6, .2), (.2, .2, .6), (.45, .45, .1), (.1, .45, .45), (.45, .1, .45)]
attr = red.data.color_attributes.new("Couleur", "BYTE_COLOR", "CORNER")
red.data.color_attributes.active_color = attr
pierre = [lineaire(c) for c in PIERRE] + [1.0]
lichen = [lineaire(c) for c in LICHEN] + [1.0]
nb_lichen = 0
lues = []  # couleur lue (sRGB 0-255) de chaque facette
for p in red.data.polygons:
    v = [red.data.vertices[i].co for i in p.vertices]
    somme = Vector((0, 0, 0))
    for w in poids:
        q = v[0] * w[0] + v[1] * w[1] + v[2] * w[2]
        co, _, idx, _ = arbre.find_nearest(q)
        f = mo.polygons[idx]
        a_, b_, c_ = (mo.vertices[i].co for i in f.vertices[:3])
        ua, ub, uc = (uvs[li].uv.to_3d() for li in list(f.loop_indices)[:3])
        uv = barycentric_transform(co, a_, b_, c_, ua, ub, uc)
        x = min(L - 1, max(0, int(uv.x * L))); y = min(H - 1, max(0, int(uv.y * H)))
        k = (y * L + x) * 4
        somme += Vector(pixels[k:k + 3])
    r, g, b = somme * (255 / len(poids))
    lues.append((r, g, b))
    vert = g - max(r, b) > SEUIL_VERT
    nb_lichen += vert
    for li in p.loop_indices:
        attr.data[li].color = lichen if vert else pierre
    p.use_smooth = False
if COULEURS:  # les n couleurs principales (k-moyennes), puis chaque facette prend la plus proche
    import random
    random.seed(1206)
    centres = random.sample(lues, min(COULEURS, len(lues)))
    plus_proche = lambda c: min(range(len(centres)), key=lambda j: sum((c[i] - centres[j][i]) ** 2 for i in range(3)))
    for _ in range(20):
        groupes = [[] for _ in centres]
        for c in lues:
            groupes[plus_proche(c)].append(c)
        centres = [tuple(sum(c[i] for c in g) / len(g) for i in range(3)) if g else centres[j] for j, g in enumerate(groupes)]
    for p, c in zip(red.data.polygons, lues):
        couleur = [lineaire(v) for v in centres[plus_proche(c)]] + [1.0]
        for li in p.loop_indices:
            attr.data[li].color = couleur
    print("couleurs :", ", ".join("#%02X%02X%02X" % tuple(round(v) for v in c) for c in centres))
print(f"{red.name} : {len(red.data.polygons)} triangles, {nb_lichen} facettes de lichen")

# export de la seule version reduite, couleurs par sommet, sans texture
for o in bpy.context.selected_objects:
    o.select_set(False)
red.select_set(True)
bpy.ops.export_scene.gltf(filepath=SORTIE, use_selection=True, export_texcoords=False,
                          export_vertex_color="ACTIVE", export_all_vertex_colors=False)
print("exporte :", SORTIE)

if interface:  # a cote de l'original, vue en couleurs de sommets
    red.location.x += orig.dimensions.x * 1.3
    for zone in bpy.context.screen.areas:
        if zone.type == "VIEW_3D":
            zone.spaces[0].shading.type = "SOLID"
            zone.spaces[0].shading.color_type = "VERTEX"
