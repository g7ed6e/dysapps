# Les briques de la Nef d'Archipéo (GD-15), modelée à la main en low poly à aplats francs : chaque pièce est un objet
# Blender d'une seule couleur, rangé dans une partie (`partie`) que la mue anime d'un bloc (la coque, la voile, le
# ballon…). Lu par nef.py ; bpy seulement (Blender en module Python), numpy pour l'écriture du .glb.
#
# Les couleurs se donnent telles qu'on les voit à l'écran (sRVB) ; le fichier les range en linéaire (COLOR_0), comme
# les personnages : le jeu les lit sans conversion.
import math, os, sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from squelette import write_glb  # noqa: E402


def lineaire(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexa(h):
    return ((h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255)


PIECES = []
PARTIE = ["coque"]


def partie(nom):
    """Les pièces suivantes appartiennent à cette partie (un os du .glb)."""
    PARTIE[0] = nom


def piece(nom, bm, couleur, mat=None):
    if mat is not None:
        bm.transform(mat)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(nom)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(nom, me)
    bpy.context.collection.objects.link(o)
    o["couleur"] = couleur
    o["partie"] = PARTIE[0]
    PIECES.append(o)
    return o


def boite(nom, centre, taille, couleur, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    m = Matrix.Translation(centre) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*taille, 1))
    return piece(nom, bm, couleur, m)


def cylindre(nom, a, b, r, couleur, n=6, r2=None):
    """Un cylindre (un cône si `r2`) de `a` à `b`."""
    a, b = Vector(a), Vector(b)
    d = b - a
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=n, radius1=r, radius2=r if r2 is None else r2, depth=d.length)
    rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    return piece(nom, bm, couleur, Matrix.Translation((a + b) / 2) @ rot)


def sphere(nom, c, r, couleur, sub=1):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1)
    return piece(nom, bm, couleur, Matrix.Translation(c) @ Matrix.Diagonal((r, r, r, 1)))


def loft(nom, sections, couleur, fermer=True):
    """Des sections (listes de points 3D, autant chacune) reliées en anneaux fermés ; les bouts bouchés."""
    bm = bmesh.new()
    anneaux = [[bm.verts.new(p) for p in s] for s in sections]
    n = len(sections[0])
    for A, B in zip(anneaux, anneaux[1:]):
        for i in range(n):
            bm.faces.new((A[i], A[(i + 1) % n], B[(i + 1) % n], B[i]))
    if fermer:
        bm.faces.new(anneaux[0][::-1])
        bm.faces.new(anneaux[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return piece(nom, bm, couleur)


def plaque(nom, pts, ep, couleur):
    """Une plaque d'épaisseur `ep`, d'après un contour plan."""
    bm = bmesh.new()
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    f.normal_update()
    nrm = f.normal.copy()
    r = bmesh.ops.extrude_face_region(bm, geom=[f])
    nv = [e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=nrm * ep, verts=nv)
    bmesh.ops.translate(bm, vec=-nrm * ep / 2, verts=bm.verts[:])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return piece(nom, bm, couleur)


def lanterne(x, y, z, s, cols):
    """La lanterne de laiton au verre doré (le verre prend la lueur la nuit, dans le jeu), au coin de la poupe."""
    avant = PARTIE[0]
    partie("lanterne")
    OR, LAITON = cols
    cylindre("lanterne-socle", (x, y, z), (x, y, z + 0.025 * s), 0.045 * s, LAITON, 8)
    cylindre("lanterne", (x, y, z + 0.025 * s), (x, y, z + 0.11 * s), 0.034 * s, OR, 8)
    for i in range(4):
        t = math.pi / 4 + i * math.pi / 2
        px, py = x + math.cos(t) * 0.036 * s, y + math.sin(t) * 0.036 * s
        cylindre("montant", (px, py, z + 0.025 * s), (px, py, z + 0.11 * s), 0.006 * s, LAITON, 4)
    cylindre("lanterne-col", (x, y, z + 0.11 * s), (x, y, z + 0.125 * s), 0.045 * s, LAITON, 8)
    cylindre("lanterne-toit", (x, y, z + 0.125 * s), (x, y, z + 0.16 * s), 0.04 * s, LAITON, 8, 0.015 * s)
    cylindre("anse", (x - 0.02 * s, y, z + 0.175 * s), (x + 0.02 * s, y, z + 0.175 * s), 0.008 * s, LAITON, 4)
    partie(avant)


def coque_table(xs, zs, W, cols, ep=0.024, pont_bas=0.05):
    """Une coque ouverte : W[i][k], la demi-largeur en xs[i] à la hauteur zs[i][k] (du fond au plat-bord). L'anneau : le
    bord, un flanc, le fond, l'autre flanc, l'autre bord, puis la paroi intérieure et le pont ; les listons dessus."""
    cq, _inter, lis, _pont = cols
    H = zs[0][-1]
    secs = []
    for n, (x, ws) in enumerate(zip(xs, W)):
        cote = [(ws[k], zs[n][k]) for k in range(len(zs[n]))][::-1]
        ring = [(x, y, z) for y, z in cote] + [(x, -y, z) for y, z in cote[::-1]]
        e = min(ep, ws[-1] * 0.45)
        ring += [(x, -(ws[-1] - e), H), (x, -(ws[-1] - e), H - pont_bas), (x, ws[-1] - e, H - pont_bas), (x, ws[-1] - e, H)]
        secs.append(ring)
    loft("coque", secs, cq)
    for s in (-1, 1):
        loft("liston", [[(x, s * (ws[-1] + 0.006), H), (x, s * (ws[-1] + 0.006), H + 0.014), (x, s * (ws[-1] - min(ep, ws[-1] * 0.45) - 0.004), H + 0.014),
                         (x, s * (ws[-1] - min(ep, ws[-1] * 0.45) - 0.004), H)] for x, ws in list(zip(xs, W))[1:-1]], lis)


# La coque du voilier, relevée sur la silhouette du modèle TRELLIS de son concept (longueur 1, plat-bord à 0,2), creusée à
# la profondeur du concept ; le dirigeable la reprend en nacelle, l'aéronef élargie : la même proue pour les trois.
XS_V = [-0.48, -0.4, -0.25, 0.0, 0.2, 0.35, 0.45, 0.5]
ZS0_V = [0.0, 0.03, 0.07, 0.12, 0.2]
W0_V = [[0.07, 0.08, 0.09, 0.11, 0.12], [0.09, 0.11, 0.125, 0.145, 0.15], [0.14, 0.17, 0.185, 0.205, 0.205], [0.17, 0.195, 0.21, 0.22, 0.22],
        [0.17, 0.19, 0.205, 0.22, 0.22], [0.11, 0.13, 0.155, 0.18, 0.18], [0.045, 0.07, 0.085, 0.11, 0.115], [0.015, 0.03, 0.045, 0.06, 0.07]]


def coque_voilier(cols, sx=1.0, sy=1.0, sz=1.0, x0=0.0, z0=0.0):
    """La coque, la quille relevée aux bouts, et l'étrave (un montant de bois qui dépasse du plat-bord) ; rend le plat-bord."""
    partie("coque")
    zs = [[z * (1 - min(1, abs(x) / 0.5) ** 2.2 * 0.8) for z in (-0.12, -0.08, -0.04)] + ZS0_V for x in XS_V]
    W = [[w[0] * 0.4, w[0] * 0.72, w[0] * 0.92] + w for w in W0_V]
    coque_table([x0 + x * sx for x in XS_V], [[z0 + z * sz for z in zz] for zz in zs], [[w * sy for w in ws] for ws in W], cols)
    boite("etrave", (x0 + 0.5 * sx, 0, z0 + 0.17 * sz), (0.035, 0.035, 0.24 * sz), cols[0], Matrix.Rotation(-0.12, 4, "Y"))
    boite("etrave-tete", (x0 + 0.507 * sx, 0, z0 + 0.29 * sz), (0.045, 0.04, 0.025), cols[0])
    return z0 + 0.2 * sz


def exporter(chemin, echelle, milieu, pied):
    """Le .glb de la Nef, dans son repère du jeu, en cases (three/ship.ts) : x en travers (2,5 au milieu des cinq cases de
    large), y en haut (le pont à 1, où se tient le bonhomme), z en long (la proue vers −z, `milieu` : où tombe le x = 0 du
    modèle). Une partie = un os, de poids 1 ; sa tête au milieu de la partie. Rend le nombre de triangles."""
    noms = []
    pos, col, jts = [], [], []
    for o in PIECES:
        p = o["partie"]
        if p not in noms:
            noms.append(p)
        j = noms.index(p)
        c = [lineaire(v) for v in hexa(o["couleur"])] + [1.0]
        me = o.data
        for poly in me.polygons:
            for v in poly.vertices:
                x, y, z = me.vertices[v].co
                pos.append((2.5 - y * echelle, z * echelle + pied, milieu - x * echelle))
                col.append(c)
                jts.append(j)
    pos = np.array(pos)
    jts = np.array(jts)
    joints = np.zeros((len(pos), 4))
    joints[:, 0] = jts
    weights = np.zeros((len(pos), 4))
    weights[:, 0] = 1
    bones = []
    for j, n in enumerate(noms):
        q = pos[jts == j]
        bones.append({"name": n, "parent": -1, "head": [round(float(v), 4) for v in (q.min(0) + q.max(0)) / 2]})
    write_glb(chemin, pos, np.array(col), joints, weights, bones)
    return len(pos) // 3
