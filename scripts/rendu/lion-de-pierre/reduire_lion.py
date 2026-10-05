"""Réduit un modèle TRELLIS.2 en low-poly et peint chaque facette aux couleurs du jeu.

En ligne de commande (Blender 4.2 ou plus récent) :
    blender -b -P reduire_lion.py -- ENTREE.glb SORTIE.glb TRIANGLES

Dans Blender (onglet Scripting) : renseigner ENTREE, SORTIE et TRIANGLES ci-dessous,
puis Run Script (Alt+P). L'original et la version réduite restent dans la scène.

Étapes : refermer le maillage (remaillage en voxels), réduire au nombre de triangles
visé, donner à chaque facette la couleur de la texture d'origine ramenée à la palette
(pierre ou lichen), exporter un .glb à couleurs par facette, sans texture ni UV.
"""

import sys

import bpy  # avant bmesh : nécessaire hors de Blender
import bmesh
import numpy as np
from mathutils.bvhtree import BVHTree

# --- Réglages -------------------------------------------------------------------
ENTREE = ""          # chemin du .glb TRELLIS.2 (utilisé si lancé depuis l'onglet Scripting)
SORTIE = ""          # chemin du .glb à écrire
TRIANGLES = 1500     # nombre de triangles visé
VOXEL = 0.006        # taille du voxel, relative à la plus grande dimension du modèle
SEUIL_VERT = 12      # écart de vert (sur 255) au-delà duquel une facette devient du lichen
PIERRE = (0x8E, 0x8C, 0x84)
LICHEN = (0x7A, 0x8A, 0x6A)
# ----------------------------------------------------------------------------------


def arguments():
    if "--" in sys.argv:
        args = sys.argv[sys.argv.index("--") + 1:]
        if len(args) >= 3:
            return args[0], args[1], int(args[2])
    return ENTREE, SORTIE, TRIANGLES


def srgb_vers_lineaire(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def importer(chemin):
    avant = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=chemin)
    maillages = [o for o in bpy.data.objects if o not in avant and o.type == "MESH"]
    if not maillages:
        raise SystemExit("Aucun maillage dans " + chemin)
    bpy.ops.object.select_all(action="DESELECT")
    for o in maillages:
        o.select_set(True)
    bpy.context.view_layer.objects.active = maillages[0]
    if len(maillages) > 1:
        bpy.ops.object.join()
    original = bpy.context.view_layer.objects.active
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return original


def texture_de(objet):
    for slot in objet.material_slots:
        mat = slot.material
        if mat and mat.use_nodes:
            for noeud in mat.node_tree.nodes:
                if noeud.type == "TEX_IMAGE" and noeud.image:
                    for lien in noeud.outputs["Color"].links:
                        if lien.to_socket.name == "Base Color":
                            return noeud.image
    raise SystemExit("Pas de texture de couleur sur le modèle d'origine")


def pixels(image):
    w, h = image.size
    tableau = np.empty(w * h * 4, dtype=np.float32)
    image.pixels.foreach_get(tableau)
    return tableau.reshape(h, w, 4), w, h


def reduire(original, cible):
    bpy.ops.object.select_all(action="DESELECT")
    original.select_set(True)
    bpy.context.view_layer.objects.active = original
    bpy.ops.object.duplicate()
    copie = bpy.context.view_layer.objects.active
    copie.name = f"Lion-{cible}"
    copie.data.materials.clear()
    taille = max(copie.dimensions)
    copie.data.remesh_voxel_size = taille * VOXEL
    bpy.ops.object.voxel_remesh()
    faces = sum(len(p.vertices) - 2 for p in copie.data.polygons)
    mod = copie.modifiers.new("Reduire", "DECIMATE")
    mod.decimate_type = "COLLAPSE"
    mod.use_collapse_triangulate = True
    mod.ratio = min(1.0, cible / max(faces, 1))
    bpy.ops.object.modifier_apply(modifier=mod.name)
    tri = copie.modifiers.new("Trianguler", "TRIANGULATE")
    bpy.ops.object.modifier_apply(modifier=tri.name)
    return copie


def peindre(copie, original, image):
    tableau, w, h = pixels(image)
    bm_o = bmesh.new()
    bm_o.from_mesh(original.data)
    bm_o.faces.ensure_lookup_table()
    uv_o = bm_o.loops.layers.uv.active
    arbre = BVHTree.FromBMesh(bm_o)

    pierre = [srgb_vers_lineaire(c) for c in PIERRE] + [1.0]
    lichen = [srgb_vers_lineaire(c) for c in LICHEN] + [1.0]

    me = copie.data
    attr = me.color_attributes.new("Couleur", "BYTE_COLOR", "CORNER")
    nb_lichen = 0
    for poly in me.polygons:
        centre = poly.center
        loc, _, index, _ = arbre.find_nearest(centre)
        face = bm_o.faces[index]
        # coordonnées barycentriques approchées : moyenne pondérée par l'inverse de la distance
        poids, u, v = 0.0, 0.0, 0.0
        for boucle in face.loops:
            d = (boucle.vert.co - loc).length + 1e-6
            p = 1.0 / d
            uv = boucle[uv_o].uv
            u += uv.x * p
            v += uv.y * p
            poids += p
        u, v = u / poids, v / poids
        x = int((u % 1.0) * (w - 1))
        y = int((v % 1.0) * (h - 1))
        r, g, b = tableau[y, x, :3] * 255.0
        vert = g - (r + b) / 2.0
        couleur = lichen if vert > SEUIL_VERT else pierre
        nb_lichen += couleur is lichen
        for i in poly.loop_indices:
            attr.data[i].color = couleur
    me.color_attributes.active_color = attr
    bm_o.free()

    mat = bpy.data.materials.new("Pierre du Lion")
    mat.use_nodes = True
    noeuds = mat.node_tree.nodes
    bsdf = noeuds.get("Principled BSDF")
    attr_noeud = noeuds.new("ShaderNodeVertexColor")
    attr_noeud.layer_name = "Couleur"
    mat.node_tree.links.new(attr_noeud.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    me.materials.append(mat)
    for poly in me.polygons:
        poly.use_smooth = False
    return nb_lichen


def exporter(copie, chemin):
    bpy.ops.object.select_all(action="DESELECT")
    copie.select_set(True)
    options = dict(filepath=chemin, use_selection=True, export_format="GLB",
                   export_texcoords=False, export_normals=True)
    try:
        bpy.ops.export_scene.gltf(**options, export_vertex_color="ACTIVE")
    except TypeError:
        bpy.ops.export_scene.gltf(**options, export_colors=True)


def main():
    entree, sortie, cible = arguments()
    if not entree or not sortie:
        raise SystemExit("Renseigner ENTREE et SORTIE, ou lancer avec -- ENTREE.glb SORTIE.glb TRIANGLES")
    original = importer(entree)
    image = texture_de(original)
    copie = reduire(original, cible)
    nb_lichen = peindre(copie, original, image)
    copie.location.x = original.dimensions.x * 1.3 * (len([o for o in bpy.data.objects if o.name.startswith("Lion-")]))
    exporter(copie, sortie)
    triangles = sum(len(p.vertices) - 2 for p in copie.data.polygons)
    print(f"Écrit {sortie} : {triangles} triangles, {nb_lichen} facettes de lichen")


main()
