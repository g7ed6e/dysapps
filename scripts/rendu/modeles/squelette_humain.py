# Le squelette humain d'un personnage en pose A (un ado de l'équipage d'Archipéo) : 17 os avec coudes, mains et pieds,
# pour marcher, courir, sauter, attraper et lancer. Il part d'un brut TRELLIS allégé (alleger_brut.py), qu'il garde
# tel quel (forme et texture), retire la doublure intérieure, pose les os, calcule les poids et exporte le .glb animé
# (devant −X, comme les modèles du jeu). Il rend ensuite la planche des six poses avec et sans texture, et, avec
# video=<dossier>, une vidéo de 9 s des mêmes gestes, texture à gauche, gris uni à droite (ffmpeg).
# Squelette à part de squelette.py (9 os, bras d'un seul os, pour les créatures et Kéo) : le jeu ne l'anime pas encore.
#
#   python3.11 squelette_humain.py -- <allégé.glb> <sortie.glb> <planche.png> [réglage=valeur …] [video=<dossier>]
#
# Réglages, en hauteurs du modèle (hauteur 1, devant −Y, gauche du personnage en +X) :
#   menton (0.79), sh_z et sh_x (l'épaule : 0.735 et 0.1), hip_z (la hanche : 0.47) ;
#   buste (0.118) : à quelle distance du milieu commence le bras ; tt_lib (0.4) : à partir d'où, le long du bras, tout
#   ce qui est près de son axe lui revient (0.15 pour un bras près du corps) ; epaule_r (0.09) : le rayon du fondu buste
#   → bras à l'épaule (0.13 pour un manteau) ; jupe : le pan d'un manteau long sous les hanches suit à moitié le
#   bassin, à moitié la cuisse, au-delà de cette distance à la cuisse (0.045 ; absent : pas de pan).

import math
import os
import random
import subprocess
import sys

import bpy
import bmesh  # après bpy, qui le rend importable
import numpy as np
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index("--") + 1:]
base, out, planche = args[0], args[1], args[2]
S = {"menton": 0.79, "sh_z": 0.735, "sh_x": 0.1, "hip_z": 0.47, "buste": 0.118, "tt_lib": 0.4, "epaule_r": 0.09}
VIDEO = None
for kv in args[3:]:
    k, v = kv.split("=", 1)
    if k == "video":
        VIDEO = v
    else:
        S[k] = float(v)
SHZ, SHX, HIPZ = S["sh_z"], S["sh_x"], S["hip_z"]
NOM = os.path.splitext(os.path.basename(out))[0]

# ------------------------------------------------ le maillage : normalisé, sans doublure
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=base)
mesh = [o for o in bpy.data.objects if o.type == "MESH"][0]
for o in list(bpy.data.objects):
    if o is not mesh:
        bpy.data.objects.remove(o)
mesh.data.transform(mesh.matrix_world)
mesh.matrix_world.identity()
mesh.parent = None
# Le brut TRELLIS regarde déjà −Y : on ne le tourne pas, on le pose au sol, centré, à la hauteur 1.
P = np.array([v.co[:] for v in mesh.data.vertices])
lo, hi = P.min(0), P.max(0)
mesh.data.transform(Matrix.Scale(1 / (hi[2] - lo[2]), 4)
                    @ Matrix.Translation(Vector((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]))))

# TRELLIS double les vêtements d'une peau intérieure qui perce au moindre geste : une face dont aucun rayon, d'un côté
# ou de l'autre, ne sort du modèle est intérieure, on la retire.
bm = bmesh.new()
bm.from_mesh(mesh.data)
arbre = BVHTree.FromBMesh(bm)
hasard = random.Random(1)
directions = [Vector((hasard.gauss(0, 1), hasard.gauss(0, 1), hasard.gauss(0, 1))).normalized() for _ in range(24)]


def visible(f):
    c, n = f.calc_center_median(), f.normal
    for sgn in (1, -1):
        for d in directions:
            if sgn * d.dot(n) >= 0.05 and arbre.ray_cast(c + sgn * n * 0.002, d, 2.0)[0] is None:
                return True
    return False


interieures = [f for f in bm.faces if not visible(f)]
bmesh.ops.delete(bm, geom=interieures, context="FACES")
bm.to_mesh(mesh.data)
bm.free()
print("faces intérieures retirées :", len(interieures))

# ------------------------------------------------ le squelette (17 os)
P = np.array([v.co[:] for v in mesh.data.vertices])
x, z = P[:, 0], P[:, 2]
EPAULES = {"L": Vector((SHX, 0, SHZ)), "R": Vector((-SHX, 0, SHZ))}
POIGNETS = {}
for cote, sx in (("L", 1), ("R", -1)):
    # La main : les points les plus écartés de ce côté, entre 0,3 et 0,68 de haut (pose A) ; le poignet un peu avant.
    bande = (z > 0.3) & (z < 0.68) & (sx * x > 0.12)
    loin = (sx * x[bande]).max()
    main = Vector(P[bande & (sx * x > loin - 0.05)].mean(0))
    POIGNETS[cote] = EPAULES[cote] + (main - EPAULES[cote]) * 0.84

armature = bpy.data.armatures.new("rig")
rig = bpy.data.objects.new("rig", armature)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode="EDIT")
E = armature.edit_bones


def os_(nom, tete, queue, parent=None):
    b = E.new(nom)
    b.head, b.tail = Vector(tete), Vector(queue)
    if parent:
        b.parent = E[parent]


COU = S["menton"] - 0.02
os_("hips", (0, 0, HIPZ - 0.04), (0, 0, HIPZ + 0.06))
os_("spine", (0, 0, HIPZ + 0.06), (0, 0, SHZ - 0.02), "hips")
os_("head", (0, 0, COU), (0, 0, 1.0), "spine")
for cote, sx in (("L", 1), ("R", -1)):
    sh, w = EPAULES[cote], POIGNETS[cote]
    coude = sh + (w - sh) * 0.5 + Vector((0, 0.01, 0))
    os_("upperarm." + cote, sh, coude, "spine")
    os_("forearm." + cote, coude, w, "upperarm." + cote)
    os_("hand." + cote, w, w + (w - sh).normalized() * 0.07, "forearm." + cote)
    hanche, cheville = Vector((sx * 0.055, 0, HIPZ)), Vector((sx * 0.06, 0, 0.08))
    genou = (hanche + cheville) / 2 + Vector((0, -0.01, 0))
    os_("thigh." + cote, hanche, genou, "hips")
    os_("shin." + cote, genou, cheville, "thigh." + cote)
    os_("foot." + cote, cheville, Vector((sx * 0.06, -0.08, 0.02)), "shin." + cote)
for b in E:
    b.align_roll(Vector((0, -1, 0)))
bpy.ops.object.mode_set(mode="OBJECT")

# ------------------------------------------------ les poids
NOMS = [b.name for b in armature.bones]
SEGMENTS = {b.name: (np.array(b.head_local), np.array(b.tail_local)) for b in armature.bones}


def distance_au_segment(p, a, b):
    ab = b - a
    t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1)
    return np.linalg.norm(p - (a + t[:, None] * ab), axis=1)


Q = np.array([v.co[:] for v in mesh.data.vertices])
qx, qy, qz = Q[:, 0], Q[:, 1], Q[:, 2]
D = {n: distance_au_segment(Q, *SEGMENTS[n]) for n in NOMS}
permis = {n: np.ones(len(Q), bool) for n in NOMS}
fondu, part_du_bras, zone_bras = {}, {}, {}
hors_bras = np.ones(len(Q), bool)
for cote, sx in (("L", 1), ("R", -1)):
    # Le bras : près de l'axe épaule-poignet, au-delà du buste (ou, plus loin le long du bras, tout près de son axe).
    sh, w = np.array(EPAULES[cote]), np.array(POIGNETS[cote])
    axe = w - sh
    tt = ((Q - sh) @ axe) / (axe @ axe)
    dax = np.linalg.norm(Q - (sh + np.clip(tt, 0, 1.6)[:, None] * axe), axis=1)
    bras = (tt > 0) & (dax < 0.09) & (qy < 0.06) & (
        (sx * qx > S["buste"]) | ((qz > SHZ - 0.04) & (sx * qx > SHX)) | ((tt > S["tt_lib"]) & (dax < 0.05)))
    for n in ("upperarm.", "forearm.", "hand."):
        permis[n + cote] = bras
    zone_bras[cote] = bras
    hors_bras &= ~bras
    # L'épaule : les manches passent en douceur du buste au bras (sinon elles se déchirent bras levé).
    fondu[cote] = ((sx * qx > 0.04) & (qz > SHZ - 0.12) & (qz < SHZ + 0.05) & (qy < 0.06)
                   & (np.linalg.norm(Q - sh, axis=1) < S["epaule_r"]))
    a = np.clip((tt + 0.05) / 0.35, 0, 1)
    part_du_bras[cote] = a * a * (3 - 2 * a)
    jambe = (sx * qx > -0.0015) & (qz < HIPZ - 0.02) & ~((np.abs(qx) > SHX + 0.03) & (qz > 0.3))
    permis["thigh." + cote] = permis["shin." + cote] = jambe
    permis["foot." + cote] = jambe & (qz < 0.1)
permis["head"] = (qz > COU) & (np.abs(qx) < 0.11) & (qy < 0.06)
permis["hips"] = (qz < HIPZ + 0.12) & (qz > HIPZ - 0.12) & hors_bras
permis["spine"] = hors_bras
M = np.stack([np.where(permis[n], D[n], 9) for n in NOMS], 1)
rang = np.argsort(M, 1)[:, :2]
d0, d1 = M[np.arange(len(Q)), rang[:, 0]], M[np.arange(len(Q)), rang[:, 1]]
second = np.clip(d0 / np.maximum(d1, 1e-6) - 0.5, 0, 0.5)
premier = [NOMS[k] for k in rang[:, 0]]
doux = fondu["L"] | fondu["R"]
# Le pan d'un manteau long, sous les hanches, loin des cuisses et hors des bras.
pan = np.zeros(len(Q), bool)
if "jupe" in S:
    pan = ((qz > 0.18) & (qz < HIPZ) & (np.minimum(D["thigh.L"], D["thigh.R"]) > S["jupe"]) & ~doux
           & ~zone_bras["L"] & ~zone_bras["R"])
doux |= pan


def cote_de(n):
    return n[-1] if n[-2:] in (".L", ".R") else "C"


def membre(n):
    racine = n.split(".")[0]
    return "bras" if racine in ("upperarm", "forearm", "hand") else "jambe" if racine in ("thigh", "shin", "foot") else "tronc"


# TRELLIS tend des toiles entre deux membres (jambe contre jambe, bras contre buste) : on les coupe. FACES_ONLY garde
# les sommets, donc leurs indices, sur lesquels les poids sont posés.
bm = bmesh.new()
bm.from_mesh(mesh.data)
toiles = []
for f in bm.faces:
    if all(doux[v.index] for v in f.verts):
        continue
    cotes = {cote_de(premier[v.index]) for v in f.verts}
    membres = {membre(premier[v.index]) for v in f.verts}
    long_ = max(e.calc_length() for e in f.edges)
    if (("L" in cotes and "R" in cotes and long_ > 0.03)
            or ("bras" in membres and len(membres) > 1 and (long_ > 0.03 or f.calc_center_median().z < SHZ - 0.05))
            or {"bras", "jambe"} <= membres):
        toiles.append(f)
bmesh.ops.delete(bm, geom=toiles, context="FACES_ONLY")
bm.to_mesh(mesh.data)
bm.free()
print("toiles coupées :", len(toiles))

groupes = {n: mesh.vertex_groups.new(name=n) for n in NOMS}
for i in range(len(Q)):
    if pan[i]:
        cuisse = "thigh.L" if D["thigh.L"][i] < D["thigh.R"][i] else "thigh.R"
        groupes["hips"].add([i], 0.55, "REPLACE")
        groupes[cuisse].add([i], 0.45, "REPLACE")
        continue
    cote = "L" if fondu["L"][i] else "R" if fondu["R"][i] else None
    if cote:
        a = float(part_du_bras[cote][i])
        groupes["spine"].add([i], 1 - a, "REPLACE")
        groupes["upperarm." + cote].add([i], a, "REPLACE")
        continue
    groupes[premier[i]].add([i], 1 - second[i], "REPLACE")
    if second[i] > 0 and M[i, rang[i, 1]] < 9:
        groupes[NOMS[rang[i, 1]]].add([i], second[i], "REPLACE")
for p in mesh.data.polygons:
    p.use_smooth = False
mesh.parent = rig
mesh.modifiers.new("arm", "ARMATURE").object = rig

# Export dans le repère des modèles du jeu (devant −X), par le squelette.
rig.rotation_euler = (0, 0, math.radians(-90))
bpy.ops.object.select_all(action="DESELECT")
mesh.select_set(True)
rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_skins=True, export_animations=False)
print("ok", sum(len(p.vertices) - 2 for p in mesh.data.polygons), "triangles")
rig.rotation_euler = (0, 0, 0)

# ------------------------------------------------ les poses
# En AXES DU MONDE (devant −Y, gauche +X), chaque rotation prise dans le repère de repos de l'os : jamais sur les axes
# locaux, inversés d'un os à l'autre (c'est ce qui faisait rentrer les bras dans le buste).
#   bras ou jambe en avant : ("X", -a) ; en arrière : ("X", +a)
#   bras écarté du corps : gauche ("Y", -a), droite ("Y", +a)
#   coude plié : ("X", -a) ; genou plié : ("X", +a) ; buste penché en avant : ("X", +a) ; épaule droite qui recule : ("Z", -a)
POSES = {
    "repos": {},
    "marche": {"thigh.L": ("X", -25), "shin.L": ("X", 10), "thigh.R": ("X", 20), "shin.R": ("X", 30),
               "upperarm.L": ("X", 22), "upperarm.R": ("X", -22), "forearm.L": ("X", -12), "forearm.R": ("X", -25)},
    "course": {"thigh.L": ("X", -55), "shin.L": ("X", 60), "thigh.R": ("X", 30), "shin.R": ("X", 85),
               "upperarm.L": ("X", 45), "upperarm.R": ("X", -50), "forearm.L": ("X", -70), "forearm.R": ("X", -85),
               "spine": ("X", 12)},
    "saut": {"thigh.L": ("X", -75), "shin.L": ("X", 95), "thigh.R": ("X", -45), "shin.R": ("X", 80),
             "upperarm.L": [("Y", -95), ("X", -20)], "upperarm.R": [("Y", 95), ("X", -20)],
             "forearm.L": ("Y", -20), "forearm.R": ("Y", 20)},
    "attraper": {"upperarm.L": [("X", -80), ("Y", 12)], "upperarm.R": [("X", -80), ("Y", -12)],
                 "forearm.L": ("X", -25), "forearm.R": ("X", -25), "spine": ("X", 6)},
    # Le bras qui lance s'écarte à l'horizontale puis l'avant-bras se lève sur le même axe, au-dessus de l'épaule.
    "lancer": {"upperarm.R": [("Y", 85), ("X", 25)], "forearm.R": ("Y", 95), "upperarm.L": ("X", -60),
               "spine": ("Z", -25), "thigh.L": ("X", -25), "shin.L": ("X", 10), "thigh.R": ("X", 10)},
}
AXES = {"X": Vector((1, 0, 0)), "Y": Vector((0, 1, 0)), "Z": Vector((0, 0, 1))}


def poser(pose):
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = (1, 0, 0, 0)
    for nom, rotations in pose.items():
        pb = rig.pose.bones[nom]
        inverse = pb.bone.matrix_local.to_3x3().inverted()
        q = Quaternion()
        for axe, degres in rotations if isinstance(rotations, list) else [rotations]:
            q = Quaternion((inverse @ AXES[axe]).normalized(), math.radians(degres)) @ q
        pb.rotation_quaternion = q


def miroir(pose):
    """La même pose de l'autre côté : .L et .R s'échangent, les rotations sur Y et Z changent de signe."""
    m = {}
    for nom, rotations in pose.items():
        autre = nom[:-1] + ("R" if nom.endswith("L") else "L") if nom[-2:] in (".L", ".R") else nom
        m[autre] = [(axe, -d if axe in "YZ" else d) for axe, d in (rotations if isinstance(rotations, list) else [rotations])]
    return m


# ------------------------------------------------ la planche : six poses, avec puis sans texture
s = bpy.context.scene
s.render.engine = "BLENDER_WORKBENCH"
s.display.shading.light = "STUDIO"
s.display.shading.color_type = "TEXTURE"
s.view_settings.view_transform = "Standard"
s.world = bpy.data.worlds.new("fond")
s.world.color = (0.8, 0.8, 0.8)
s.render.resolution_x, s.render.resolution_y = 300 * len(POSES), 420
copies = []
for nom, pose in POSES.items():
    poser(pose)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(mesh.evaluated_get(dg), depsgraph=dg)
    me.transform(rig.matrix_world)
    o = bpy.data.objects.new(nom, me)
    s.collection.objects.link(o)
    copies.append(o)
mesh.hide_render = rig.hide_render = True
t = math.radians(-35)
vers = Vector((math.sin(t) * 6, -math.cos(t) * 6, 1.2))
avant = -vers.normalized()
droite = avant.cross(Vector((0, 0, 1))).normalized()
haut = droite.cross(avant)
for i, o in enumerate(copies):
    o.location = droite * (i * 0.75)
bpy.context.view_layer.update()
pts = [o.matrix_world @ v.co for o in copies for v in o.data.vertices]
u, w = [p.dot(droite) for p in pts], [p.dot(haut) for p in pts]
cd = bpy.data.cameras.new("cam")
cd.type = "ORTHO"
cam = bpy.data.objects.new("cam", cd)
s.collection.objects.link(cam)
s.camera = cam
cd.ortho_scale = 1.05 * max(max(u) - min(u), (max(w) - min(w)) * s.render.resolution_x / s.render.resolution_y)
cam.location = droite * ((min(u) + max(u)) / 2) + haut * ((min(w) + max(w)) / 2) + vers
cam.rotation_euler = avant.to_track_quat("-Z", "Y").to_euler()
s.render.filepath = planche
bpy.ops.render.render(write_still=True)
s.display.shading.color_type = "SINGLE"
s.display.shading.single_color = (0.72, 0.72, 0.72)
s.render.filepath = planche.replace(".png", "-gris.png")
bpy.ops.render.render(write_still=True)

# ------------------------------------------------ la vidéo : marche, course, saut, attraper, lancer (9 s)
if VIDEO:
    for o in copies:
        bpy.data.objects.remove(o)
    mesh.hide_render = rig.hide_render = False
    ACCROUPI = {"thigh.L": ("X", -60), "shin.L": ("X", 100), "thigh.R": ("X", -60), "shin.R": ("X", 100),
                "foot.L": ("X", -40), "foot.R": ("X", -40), "spine": ("X", 25), "upperarm.L": ("X", 40),
                "upperarm.R": ("X", 40)}
    ELAN = {"upperarm.L": [("X", -150), ("Y", -15)], "upperarm.R": [("X", -150), ("Y", 15)], "spine": ("X", -5),
            "foot.L": ("X", 20), "foot.R": ("X", 20)}
    PRISE = {"upperarm.L": [("X", -45), ("Y", 15)], "upperarm.R": [("X", -45), ("Y", -15)], "forearm.L": ("X", -80),
             "forearm.R": ("X", -80), "spine": ("X", -4)}
    SUITE = {"upperarm.R": [("X", -75), ("Y", -15)], "forearm.R": ("X", -10), "upperarm.L": ("X", 30),
             "spine": [("Z", 20), ("X", 15)], "thigh.R": ("X", -20), "shin.R": ("X", 15), "thigh.L": ("X", 10)}
    M, Mm = POSES["marche"], miroir(POSES["marche"])
    C, Cm = POSES["course"], miroir(POSES["course"])
    # (image, pose, hauteur du corps) à 24 images par seconde ; le corps accroupi descend de 0,17.
    CLES = [(0, {}, 0), (8, M, 0), (20, Mm, 0), (32, M, 0), (44, Mm, 0), (56, M, 0),
            (64, C, 0.02), (72, Cm, 0.02), (80, C, 0.02), (88, Cm, 0.02), (96, {}, 0),
            (106, ACCROUPI, -0.17), (112, ELAN, 0.08), (120, POSES["saut"], 0.3), (128, ELAN, 0.1),
            (134, ACCROUPI, -0.17), (144, {}, 0),
            (152, POSES["attraper"], 0), (158, PRISE, 0), (170, PRISE, 0), (178, {}, 0),
            (188, POSES["lancer"], 0), (194, SUITE, 0), (206, SUITE, 0), (216, {}, 0)]
    for image, pose, h in CLES:
        poser(pose)
        for pb in rig.pose.bones:
            pb.keyframe_insert("rotation_quaternion", frame=image)
        rig.location = (0, 0, h)
        rig.keyframe_insert("location", frame=image)
    s.frame_start, s.frame_end = 0, CLES[-1][0]
    s.render.fps = 24
    s.render.resolution_x, s.render.resolution_y = 540, 720
    cd.ortho_scale = 1.55
    cam.location = haut * 0.62 + vers
    s.render.image_settings.file_format = "PNG"
    os.makedirs(VIDEO, exist_ok=True)
    for mode, couleur in (("tex", "TEXTURE"), ("gris", "SINGLE")):
        s.display.shading.color_type = couleur
        s.render.filepath = os.path.join(VIDEO, f"{NOM}-{mode}-")
        bpy.ops.render.render(animation=True)
    images = [os.path.join(VIDEO, f"{NOM}-{mode}-%04d.png") for mode in ("tex", "gris")]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", images[0], "-framerate", "24",
                    "-i", images[1], "-filter_complex", "[0][1]hstack=inputs=2,format=yuv420p", "-c:v", "libx264",
                    "-crf", "22", "-movflags", "+faststart", os.path.join(VIDEO, NOM + ".mp4")], check=True)
    print("vidéo :", os.path.join(VIDEO, NOM + ".mp4"))
