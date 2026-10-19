# Le squelette humain d'un personnage en pose A (un ado de l'équipage d'Archipéo) : 17 os avec coudes, mains et pieds,
# pour marcher, courir, sauter, attraper et lancer. Il part d'un brut TRELLIS allégé (alleger_brut.py), qu'il garde
# tel quel (forme et texture), retire la doublure intérieure, pose les os, calcule les poids et exporte le .glb animé
# (devant −X, comme les modèles du jeu). Les jambes (hanche, genou, cheville, pied) se lisent sur le modèle, et un pied
# trop ouvert est remis droit. La marche et la course suivent un cycle réel, image par image (`ALLURES`). Il rend la
# planche des six poses avec et sans texture, les planches de la marche et de la course (huit instants, de profil et de
# face), et, avec video=<dossier>, une vidéo d’environ 11 s des mêmes gestes, texture à gauche, gris uni à droite (ffmpeg, ou
# le montage de Blender quand ffmpeg manque).
# Squelette à part de squelette.py (9 os, bras d'un seul os, pour les créatures et Kéo) : le jeu ne l'anime pas encore.
#
#   python3.11 squelette_humain.py -- <allégé.glb> <sortie.glb> <planche.png> [réglage=valeur …] [video=<dossier>]
#
# Réglages, en hauteurs du modèle (hauteur 1, devant −Y, gauche du personnage en +X) :
#   pieds (6) : l'ouverture d'un pied au-delà de laquelle on le tourne vers l'avant, en degrés ;
#   menton (0.79), sh_z et sh_x (l'épaule : 0.735 et 0.1), hip_z (la hanche : 0.47) ;
#   buste (0.118) : à quelle distance du milieu commence le bras ; tt_lib (0.4) : à partir d'où, le long du bras, tout
#   ce qui est près de son axe lui revient (0.15 pour un bras près du corps) ; epaule_r (0.09) : le rayon du fondu buste
#   → bras à l'épaule (0.13 pour un manteau) ; jupe : le pan d'un manteau long sous les hanches suit à moitié le
#   bassin, à moitié la cuisse, au-delà de cette distance à la cuisse (0.045 ; absent : pas de pan).
#   main (0.8) : la taille des mains, resserrées vers le poignet (1 : celles de TRELLIS, grandes et ouvertes).

import math
import os
import random
import shutil
import subprocess
import sys

import bpy
import bmesh  # après bpy, qui le rend importable
import numpy as np
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index("--") + 1:]
base, out, planche = args[0], args[1], args[2]
S = {"pieds": 6, "menton": 0.79, "sh_z": 0.735, "sh_x": 0.1, "hip_z": 0.47, "buste": 0.118, "tt_lib": 0.4, "epaule_r": 0.09, "main": 0.8}
VIDEO = None
REGLAGES = set(S) | {"jupe"}
for kv in args[3:]:
    k, _, v = kv.partition("=")
    if k == "video" and v:
        VIDEO = v
    elif k in REGLAGES and v.replace(".", "", 1).isdigit():
        S[k] = float(v)
    else:
        sys.exit(f"réglage inconnu ou sans valeur : {kv!r} (attendus : {', '.join(sorted(REGLAGES))}, video=<dossier>)")
SHZ, SHX, HIPZ, MAIN = S["sh_z"], S["sh_x"], S["hip_z"], S["main"]
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

# ------------------------------------------------ les jambes, lues sur le modèle, et les pieds remis droits
# Un sac, une radio ou un tube dans le dos décalent le milieu de la boîte : les jambes ne sont pas en y = 0, ni à un
# écart fixe. Hanche, genou et cheville se lisent tranche par tranche sur chaque jambe, et le pied sur sa semelle. Un pied
# ouvert de plus de `pieds` degrés (TRELLIS en ouvre souvent dix ou douze) est tourné autour de sa cheville, fondu
# jusqu'au bas du tibia : un pied ouvert, plié au genou, fait marcher en canard.
P = np.array([v.co[:] for v in mesh.data.vertices])


def tranche(sx, z0, z1, large=0.16):
    t = P[(P[:, 2] >= z0) & (P[:, 2] < z1) & (sx * P[:, 0] > 0.008) & (sx * P[:, 0] < large)]
    return t


JAMBES = {}
for cote, sx in (("L", 1), ("R", -1)):
    semelle = tranche(sx, 0, 0.05, 0.2)
    c = semelle[:, :2].mean(0)
    _, _, vt = np.linalg.svd(semelle[:, :2] - c)
    d = vt[0] if vt[0][1] < 0 else -vt[0]
    ouverture = math.degrees(math.atan2(sx * d[0], -d[1]))
    tourne = 0.0
    if abs(ouverture) > S["pieds"]:
        tourne = math.radians(ouverture - math.copysign(S["pieds"], ouverture))
        cheville_xy = tranche(sx, 0.06, 0.11)[:, :2].mean(0)
        a = -sx * tourne
        ca, sa = math.cos(a), math.sin(a)
        for v in mesh.data.vertices:
            x_, y_, z_ = v.co
            if sx * x_ <= 0.008 or z_ >= 0.14:
                continue
            k = 1.0 if z_ < 0.08 else (0.14 - z_) / 0.06
            dx, dy = x_ - cheville_xy[0], y_ - cheville_xy[1]
            v.co.x = cheville_xy[0] + (dx * math.cos(a * k) - dy * math.sin(a * k))
            v.co.y = cheville_xy[1] + (dx * math.sin(a * k) + dy * math.cos(a * k))
    print(f"pied {cote} : ouvert de {ouverture:.1f} degrés, tourné de {math.degrees(tourne):.1f}")
P = np.array([v.co[:] for v in mesh.data.vertices])
def milieu(t, x0=None):
    """Le milieu d'une coupe de jambe : entre ses bords (la moyenne pencherait vers ce qui dépasse, le bout d'une
    chaussure, une poche), autour de x0 si on le donne (pour ne prendre que la jambe)."""
    if x0 is not None:
        t = t[np.abs(t[:, 0] - x0) < 0.045]
    return np.array([(t[:, 0].min() + t[:, 0].max()) / 2, (t[:, 1].min() + t[:, 1].max()) / 2, t[:, 2].mean()])


for cote, sx in (("L", 1), ("R", -1)):
    genou = milieu(tranche(sx, HIPZ / 2 - 0.02, HIPZ / 2 + 0.02))
    # la cheville au-dessus de la chaussure, la hanche dans la cuisse : une jambe debout est presque droite
    cheville = milieu(tranche(sx, 0.11, 0.15), genou[0])
    hanche = milieu(tranche(sx, HIPZ - 0.12, HIPZ - 0.07), genou[0])
    hanche[1] = genou[1] + max(-0.02, min(0.02, hanche[1] - genou[1]))
    cheville[1] = genou[1] + max(-0.02, min(0.02, cheville[1] - genou[1]))
    semelle = tranche(sx, 0, 0.04, 0.2)
    pointe = semelle[np.argmin(semelle[:, 1])]
    talon = semelle[np.argmax(semelle[:, 1])]
    JAMBES[cote] = {"hanche": Vector((hanche[0], hanche[1], HIPZ)), "genou": Vector((genou[0], genou[1] - 0.005, HIPZ / 2)),
                    "cheville": Vector((cheville[0], cheville[1], 0.08)),
                    "pointe": Vector((cheville[0], pointe[1] + 0.01, 0.02)), "talon": float(talon[1])}
BASSIN_Y = (JAMBES["L"]["hanche"].y + JAMBES["R"]["hanche"].y) / 2

# ------------------------------------------------ le squelette (17 os)
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
os_("hips", (0, BASSIN_Y, HIPZ - 0.04), (0, BASSIN_Y, HIPZ + 0.06))
os_("spine", (0, BASSIN_Y, HIPZ + 0.06), (0, 0, SHZ - 0.02), "hips")
os_("head", (0, 0, COU), (0, 0, 1.0), "spine")
for cote, sx in (("L", 1), ("R", -1)):
    sh, w = EPAULES[cote], POIGNETS[cote]
    coude = sh + (w - sh) * 0.5 + Vector((0, 0.01, 0))
    os_("upperarm." + cote, sh, coude, "spine")
    os_("forearm." + cote, coude, w, "upperarm." + cote)
    os_("hand." + cote, w, w + (w - sh).normalized() * 0.07, "forearm." + cote)
    j = JAMBES[cote]
    os_("thigh." + cote, j["hanche"], j["genou"], "hips")
    os_("shin." + cote, j["genou"], j["cheville"], "thigh." + cote)
    os_("foot." + cote, j["cheville"], j["pointe"], "shin." + cote)
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
                   & (np.linalg.norm(Q - sh, axis=1) < S["epaule_r"])
                   # sous l'aisselle, le flanc reste au buste : il est dans l'axe du bras baissé, pas dans le bras
                   & (bras | (qz > SHZ - 0.05)))
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


# Les mains de TRELLIS, grandes et ouvertes, encombrent la silhouette : on les resserre vers le poignet.
for cote in ("L", "R"):
    w = POIGNETS[cote]
    for i in np.nonzero(np.array(premier) == "hand." + cote)[0]:
        v = mesh.data.vertices[int(i)]
        v.co = w + (v.co - w) * MAIN

# TRELLIS tend des toiles entre deux membres (jambe contre jambe, bras contre buste) : on les coupe. FACES_ONLY garde
# les sommets, donc leurs indices, sur lesquels les poids sont posés.
bm = bmesh.new()
bm.from_mesh(mesh.data)
toiles, decoller = [], []
for f in bm.faces:
    if all(doux[v.index] for v in f.verts):
        continue
    cotes = {cote_de(premier[v.index]) for v in f.verts}
    membres = {membre(premier[v.index]) for v in f.verts}
    long_ = max(e.calc_length() for e in f.edges)
    if (("L" in cotes and "R" in cotes and long_ > 0.03)
            or ("bras" in membres and len(membres) > 1 and long_ > 0.03)
            or {"bras", "jambe"} <= membres):
        toiles.append(f)
    elif "bras" in membres and len(membres) > 1:
        decoller.append(f)
bords = {v.index for f in toiles for v in f.verts}
bmesh.ops.delete(bm, geom=toiles, context="FACES_ONLY")
print("toiles coupées :", len(toiles))

# Les faces courtes qui collent le bras au buste (ou au manteau) : les supprimer trouait les bras,
# les garder tendait des toiles bras levé. On les décolle : chaque face va tout entière au bras ou au buste, selon la
# majorité de ses sommets, et le maillage est fendu entre les deux. Au repos rien ne bouge ; le bras part seul.
origine = bm.verts.layers.int.new("origine")
for v in bm.verts:
    v[origine] = v.index
au_bras = {}
for f in decoller:
    au_bras[f] = sum(membre(premier[v[origine]]) == "bras" for v in f.verts) * 2 > len(f.verts)


def du_bras(f):
    return au_bras[f] if f in au_bras else all(membre(premier[v[origine]]) == "bras" for v in f.verts)


fentes = [e for e in {e for f in decoller for e in f.edges} if len({du_bras(f) for f in e.link_faces}) > 1]
bords |= {v.index for e in fentes for v in e.verts}
bmesh.ops.split_edges(bm, edges=fentes)
bm.verts.index_update()
origines = [v[origine] for v in bm.verts]
force = {}
for v in bm.verts:
    cote_bras = {du_bras(f) for f in v.link_faces}
    if len(cote_bras) == 1:
        force[v.index] = cote_bras.pop()
# là où la fente ne sépare pas tout (un sommet tenu des deux côtés), la face décollée tendrait encore une toile
restes = [f for f in decoller if f.is_valid and any(v.index not in force for v in f.verts)]
bmesh.ops.delete(bm, geom=restes, context="FACES_ONLY")
# Les éclats restés au buste quand la main est partie (un bout de bâton tenu, un pan de manche) : petits îlots du
# côté du buste, au bord de la fente et hors du buste, ou bien loin de lui.
vus, eclats = set(), []
for f in bm.faces:
    if f in vus:
        continue
    ilot, pile = [], [f]
    vus.add(f)
    while pile:
        g = pile.pop()
        ilot.append(g)
        for e in g.edges:
            for h in e.link_faces:
                if h not in vus:
                    vus.add(h)
                    pile.append(h)
    sommets = {v for g in ilot for v in g.verts}
    ecart = np.mean([abs(v.co.x) for v in sommets])
    if len(ilot) < 120 and not any(du_bras(g) for g in ilot) and (
            (any(v[origine] in bords for v in sommets) and ecart > S["buste"] - 0.03)
            # ou un bout de main ou de manche resté au buste, là où pendait le bras en pose A
            or ecart > SHX + 0.08):
        eclats += ilot
bmesh.ops.delete(bm, geom=eclats, context="FACES_ONLY")
bm.to_mesh(mesh.data)
bm.free()
print("faces décollées :", len(decoller), "; arêtes fendues :", len(fentes), "; restes coupés :", len(restes), "; éclats :", len(eclats))
BRAS = [k for k, n in enumerate(NOMS) if membre(n) == "bras"]
HORS = [k for k, n in enumerate(NOMS) if membre(n) != "bras"]

groupes = {n: mesh.vertex_groups.new(name=n) for n in NOMS}
for j, i in enumerate(origines):
    cote_force = force.get(j)
    if cote_force is not None and (membre(premier[i]) == "bras") != cote_force:
        # sommet donné à l'autre côté de la fente : tout entier à l'os le plus proche de ce côté
        ks = [k for k in BRAS if NOMS[k].endswith(".L" if Q[i, 0] > 0 else ".R")] if cote_force else HORS
        dk = [M[i, k] if M[i, k] < 9 else D[NOMS[k]][i] + (0 if cote_force else 1) for k in ks]
        groupes[NOMS[ks[int(np.argmin(dk))]]].add([j], 1.0, "REPLACE")
        continue
    if pan[i]:
        cuisse = "thigh.L" if D["thigh.L"][i] < D["thigh.R"][i] else "thigh.R"
        groupes["hips"].add([j], 0.55, "REPLACE")
        groupes[cuisse].add([j], 0.45, "REPLACE")
        continue
    cote = "L" if fondu["L"][i] else "R" if fondu["R"][i] else None
    if cote:
        a = float(part_du_bras[cote][i])
        groupes["spine"].add([j], 1 - a, "REPLACE")
        groupes["upperarm." + cote].add([j], a, "REPLACE")
        continue
    groupes[premier[i]].add([j], 1 - second[i], "REPLACE")
    if second[i] > 0 and M[i, rang[i, 1]] < 9:
        groupes[NOMS[rang[i, 1]]].add([j], second[i], "REPLACE")
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
# ------------------------------------------------ la marche et la course : un cycle réel, image par image
# Les angles des articulations au fil d'un cycle (en % du cycle, du contact du talon au contact suivant du même pied),
# d'après les données d'analyse de la marche (Perry et Burnfield, « Gait Analysis ») et de la course (Novacheck, « The
# biomechanics of running », 1998) : la hanche (flexion vers l'avant), le genou (flexion), la cheville (pointe relevée).
# L'autre jambe a un demi-cycle de retard. La hanche de ces données se mesure sur un bassin penché en avant (une dizaine
# de degrés à la marche, une quinzaine à la course) : nos os partent d'un bassin droit, on retire cette bascule
# (`bassin_avant`), sans quoi les deux jambes restent en avant du corps et il marche penché en arrière. Le bassin tourne avec la jambe qui avance et descend du côté de la jambe en
# l'air ; les épaules tournent à l'inverse ; les bras balancent à l'opposé des jambes, coudes un peu pliés (pliés à
# angle droit en course), rapprochés du corps depuis la pose A ; le buste penche un peu en course. Le corps monte et
# descend pour que le pied le plus bas touche juste le sol (calcul des longueurs des os), et décolle en course.
ALLURES = {
    "marche": {"duree": 1.1, "hanche": [(0, 30), (12, 28), (30, 10), (50, -10), (62, 0), (75, 22), (87, 32), (100, 30)],
               "genou": [(0, 5), (15, 18), (38, 4), (50, 6), (62, 38), (73, 60), (87, 25), (100, 5)],
               "cheville": [(0, 0), (8, -7), (30, 6), (47, 10), (62, -18), (75, -3), (87, 1), (100, 0)],
               "bassin_avant": 10, "bassin": 4, "bascule": 4, "epaules": 0.6, "bras": 16, "coude": (15, 10), "rapproche": 22, "penche": 2,
               "envol": 0},
    "course": {"duree": 0.72, "hanche": [(0, 38), (20, 20), (38, -8), (50, 0), (70, 40), (85, 55), (100, 38)],
               "genou": [(0, 22), (14, 42), (38, 18), (55, 60), (72, 105), (88, 55), (100, 22)],
               "cheville": [(0, 5), (14, 20), (38, -22), (55, -10), (75, 5), (100, 5)],
               "bassin_avant": 15, "bassin": 6, "bascule": 3, "epaules": 0.8, "bras": 32, "coude": (85, 15), "rapproche": 24, "penche": 10,
               "envol": 0.025},
}


def courbe(points, pc):
    """La valeur d'une courbe périodique (Catmull-Rom) au pourcentage pc du cycle."""
    pc %= 100
    xs = [x for x, _ in points]
    i = max(k for k in range(len(xs) - 1) if xs[k] <= pc)
    y = [v for _, v in points[:-1]]
    n = len(y)
    p0, p1, p2, p3 = y[(i - 1) % n], y[i % n], y[(i + 1) % n], y[(i + 2) % n]
    t = (pc - xs[i]) / (xs[i + 1] - xs[i])
    return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t ** 3)


def longueurs(cote):
    j = JAMBES[cote]
    return (j["hanche"] - j["genou"]).length, (j["genou"] - j["cheville"]).length, j


def plus_bas(cote, h, k, c):
    """La hauteur, sous la hanche, du point le plus bas du pied (talon ou pointe), dans le plan de la marche."""
    a, b, j = longueurs(cote)
    t1, t2 = math.radians(h), math.radians(h - k)
    cheville = -(a * math.cos(t1) + b * math.cos(t2))
    phi = math.radians(h - k + c)  # la semelle, pointe relevée
    talon = Vector((j["talon"] - j["cheville"].y, -0.08))
    pointe = Vector((j["pointe"].y - j["cheville"].y, -0.06))
    hauteurs = []
    for q in (talon, pointe):
        # vers l'avant = −y : on tourne le point de la semelle de phi (pointe vers le haut)
        av, ht = -q.x, q.y
        hauteurs.append(cheville + av * math.sin(phi) + ht * math.cos(phi))
    return min(hauteurs)


def allure(nom, pc):
    """La pose d'une allure au pourcentage pc du cycle de la jambe gauche, et la hauteur du corps."""
    A = ALLURES[nom]
    pose, bas = {}, []
    for cote, sx, decale in (("L", 1, 0), ("R", -1, 50)):
        q = pc + decale
        h, k, c = courbe(A["hanche"], q) - A["bassin_avant"], courbe(A["genou"], q), courbe(A["cheville"], q)
        pose["thigh." + cote] = ("X", -h)
        pose["shin." + cote] = ("X", k)
        pose["foot." + cote] = ("X", -c)
        bas.append(plus_bas(cote, h, k, c))
        # le bras opposé à la jambe : en avant quand la jambe de l'autre côté avance
        avance = -A["bras"] * math.cos(2 * math.pi * q / 100)
        pose["upperarm." + cote] = [("Y", sx * A["rapproche"]), ("X", -avance)]
        coude = A["coude"][0] + A["coude"][1] * max(0.0, avance) / A["bras"]
        pose["forearm." + cote] = ("X", -coude)
        # la paume se tourne vers la cuisse, comme quand on marche, au lieu de rester ouverte vers l'avant
        pose["hand." + cote] = ("Z", -sx * 60)
    rot = A["bassin"] * math.cos(2 * math.pi * pc / 100)  # > 0 : la hanche gauche en avant
    pose["hips"] = [("Z", -rot), ("Y", -A["bascule"] * math.sin(2 * math.pi * pc / 100))]
    # le dos rattrape le bassin puis tourne les épaules à l'inverse ; la tête revient face à la marche
    pose["spine"] = [("Z", (1 + A["epaules"]) * rot), ("X", A["penche"])]
    pose["head"] = [("Z", -A["epaules"] * rot), ("X", -A["penche"] * 0.7)]
    repos = min(plus_bas("L", 0, 0, 0), plus_bas("R", 0, 0, 0))
    haut = repos - min(bas)
    if A["envol"]:
        # en course, deux vols par cycle (après chaque appui) : le corps monte en cloche
        for debut in (38, 88):
            t = ((pc - debut) % 100) / 12
            if t < 1:
                haut += A["envol"] * math.sin(math.pi * t)
    return pose, haut


HAUTEURS = {"marche": allure("marche", 0)[1], "course": allure("course", 80)[1]}
POSES = {
    "repos": {},
    "marche": allure("marche", 0)[0],
    "course": allure("course", 80)[0],
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
for i, (o, nom) in enumerate(zip(copies, POSES)):
    o.location = droite * (i * 0.75) + Vector((0, 0, HAUTEURS.get(nom, 0)))
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
s.render.filepath = os.path.splitext(planche)[0] + "-gris.png"
bpy.ops.render.render(write_still=True)

# ------------------------------------------------ les cycles : huit instants de la marche et de la course, de profil et de face
# Pour juger les pieds (droits, posés à plat, qui ne glissent pas sous le sol), les genoux (qui plient vers l'avant) et
# le bassin : `<planche>-marche.png` et `<planche>-course.png`, en gris, une rangée de profil, une de face.
for o in copies:
    o.hide_render = True
s.display.shading.color_type = "SINGLE"
vue_planche = (cam.location.copy(), cam.rotation_euler.copy(), cd.ortho_scale, s.render.resolution_x, s.render.resolution_y)
for nom in ("marche", "course"):
    rangs = []
    for r, (vue, ecart) in enumerate(((Vector((1, 0, 0)), Vector((0, -1, 0))), (Vector((0, -1, 0)), Vector((1, 0, 0))))):
        for i in range(9):
            # la première copie est au repos, pour comparer
            pose, h = allure(nom, (i - 1) * 12.5) if i else ({}, 0)
            poser(pose)
            bpy.context.view_layer.update()
            dg = bpy.context.evaluated_depsgraph_get()
            me = bpy.data.meshes.new_from_object(mesh.evaluated_get(dg), depsgraph=dg)
            o = bpy.data.objects.new(f"{nom}-{r}-{i}", me)
            s.collection.objects.link(o)
            # chaque rangée regarde le personnage d'un côté : on décale les copies dans le plan de l'image
            o.location = ecart * (i * 0.55) + Vector((0, 0, h - r * 1.25)) + (vue * 3 if r else Vector())
            rangs.append(o)
    poser({})
    # une caméra de profil (depuis +X) pour la rangée du haut ; la rangée du bas est tournée face à elle
    for o in rangs:
        if "-1-" in o.name:
            o.rotation_euler = (0, 0, math.radians(90))
            o.location = Vector((0, -(int(o.name[-1]) * 0.55), o.location.z))
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ v.co for o in rangs for v in o.data.vertices]
    ys, zs = [p_.y for p_ in pts], [p_.z for p_ in pts]
    s.render.resolution_x, s.render.resolution_y = 2400, 750
    cd.ortho_scale = 1.05 * max(max(ys) - min(ys), (max(zs) - min(zs)) * 2400 / 750)
    cam.location = (6, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2)
    cam.rotation_euler = (math.radians(90), 0, math.radians(90))
    s.render.filepath = os.path.splitext(planche)[0] + f"-{nom}.png"
    bpy.ops.render.render(write_still=True)
    for o in rangs:
        bpy.data.objects.remove(o)
for o in copies:
    o.hide_render = False
mesh.hide_render = rig.hide_render = True
cam.location, cam.rotation_euler, cd.ortho_scale, s.render.resolution_x, s.render.resolution_y = vue_planche

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
    # (image, pose, hauteur du corps) à 24 images par seconde : la marche et la course image par image (deux cycles
    # chacune, entrées et sorties adoucies), puis le saut, attraper et lancer en poses clés ; accroupi, le corps descend
    # de 0,17.
    CLES = [(0, {}, 0)]
    image = 6
    for nom, cycles in (("marche", 2), ("course", 3)):
        n = round(ALLURES[nom]["duree"] * 24 * cycles)
        for i in range(n + 1):
            pose, h = allure(nom, 100 * cycles * i / n)
            CLES.append((image + i, pose, h))
        image += n + 8
        CLES.append((image, {}, 0))
        image += 4
    CLES += [(image + d, pose, h) for d, pose, h in [
        (10, ACCROUPI, -0.17), (16, ELAN, 0.08), (24, POSES["saut"], 0.3), (32, ELAN, 0.1), (38, ACCROUPI, -0.17),
        (48, {}, 0), (56, POSES["attraper"], 0), (62, PRISE, 0), (74, PRISE, 0), (82, {}, 0),
        (92, POSES["lancer"], 0), (98, SUITE, 0), (110, SUITE, 0), (120, {}, 0)]]
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
    if shutil.which("ffmpeg"):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", images[0], "-framerate", "24",
                        "-i", images[1], "-filter_complex", "[0][1]hstack=inputs=2,format=yuv420p", "-c:v", "libx264",
                        "-crf", "22", "-movflags", "+faststart", os.path.join(VIDEO, NOM + ".mp4")], check=True)
    else:
        # Sans ffmpeg (le Mac mini) : le montage de Blender met les deux suites d'images côte à côte et encode la vidéo.
        m = bpy.data.scenes.new("montage")
        m.render.resolution_x, m.render.resolution_y = 2 * s.render.resolution_x, s.render.resolution_y
        m.render.fps, m.frame_start, m.frame_end = 24, s.frame_start, s.frame_end
        ed = m.sequence_editor_create()
        pistes = ed.strips if hasattr(ed, "strips") else ed.sequences
        for k, mode in enumerate(("tex", "gris")):
            noms = [f"{NOM}-{mode}-{i:04d}.png" for i in range(s.frame_start, s.frame_end + 1)]
            st = pistes.new_image(mode, os.path.join(VIDEO, noms[0]), k + 1, s.frame_start)
            for n in noms[1:]:
                st.elements.append(n)
            if hasattr(st, "fit_method"):
                st.fit_method = "ORIGINAL"
            st.transform.offset_x = (k - 0.5) * s.render.resolution_x
        if hasattr(m.render.image_settings, "media_type"):
            m.render.image_settings.media_type = "VIDEO"
        m.render.image_settings.file_format = "FFMPEG"
        m.render.ffmpeg.format, m.render.ffmpeg.codec, m.render.ffmpeg.constant_rate_factor = "MPEG4", "H264", "HIGH"
        m.render.filepath = os.path.join(VIDEO, NOM + ".mp4")
        bpy.ops.render.render(animation=True, scene=m.name)
    for mode in ("tex", "gris"):
        for i in range(s.frame_start, s.frame_end + 1):
            os.remove(os.path.join(VIDEO, f"{NOM}-{mode}-{i:04d}.png"))
    print("vidéo :", os.path.join(VIDEO, NOM + ".mp4"))
