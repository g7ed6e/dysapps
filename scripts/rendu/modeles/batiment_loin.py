# La version de loin du batiment d'un plan (decision du mainteneur, 10 octobre 2026 : environ 200 triangles de loin),
# en volumes simples qui suivent la silhouette du modele de pres. La reduction automatique a 200 triangles (Decimate,
# fast-simplification, voxels) en fait une bouillie ; la boite a toit a deux pans de la forge ne va ni a un batiment rond
# (le nid de Coco, la hutte de Nenu : un tambour et un dome ou un cone) ni a une tour (le phare de Grimoire, la tour de
# Tick : une tour haute, sa galerie, sa lanterne, son toit en pyramide ou en cone) : planche du 10 octobre 2026.
#
# La methode, generique (rien n'est propre a un batiment) :
# 1. Le modele est coupe a cent hauteurs (batiment_mesures.py). Chaque coupe se separe en ilots ; un ilot se lit par son
#    enveloppe convexe, resumee en huit appuis (sa plus grande avancee vers l'est, le nord-est, le nord...) : un
#    rectangle reste un rectangle, un cercle devient un octogone, le haut d'un toit a deux pans une bande etroite.
# 2. D'une hauteur a la suivante, les ilots qui se recouvrent forment une colonne : le corps du batiment, et a part ce
#    qui s'en detache en haut (une cheminee, une lanterne, la tour du plus haut des deux logis de Boussole).
# 3. Chaque colonne est un empilement d'octogones relies par des bandes ; on retire les hauteurs dont l'absence se voit le
#    moins (l'ecart entre l'interpolation et la coupe vraie), jusqu'a tenir dans 200 triangles. L'avant-toit est garde :
#    c'est la que se coupe l'etape 1.
# 4. Chaque face prend la couleur qui couvre le plus le modele de pres, a sa hauteur, de son cote et dans son sens ;
#    l'ouverture sombre de la facade (-Y) se pose devant, comme sur l'essai de la forge.
#   (module bpy)
#   python3.11 batiment_loin.py -- final-3000.glb dossier 0.44
# 0.44 : la hauteur de l'avant-toit, en part de la hauteur du modele (la meme que la coupe de l'etape 1).
# Sortie : loin.glb (le batiment entier, 200 triangles au plus) et loin-etape-1.glb (ce qui est sous l'avant-toit, ferme
# en haut de la couleur des murs), dans le repere du modele de pres (le jeu les pose avec la meme echelle et le meme
# centre). La facade est -Y dans Blender (+Z du .glb), comme pour les monuments.
import os
import sys

import bpy  # avant bmesh, qu'il fournit
import bmesh
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import batiment_mesures as BM  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:]
SOURCE, FOLDER, EAVE = args[0], args[1], float(args[2])
BUDGET = 200       # triangles au plus (BUILDING_FAR_TRIANGLES, src/game/world/buildingModels.ts)
NIVEAUX = 100      # coupes
TOLERANCE = 0.008  # ecart (part de la hauteur) en dessous duquel une hauteur part meme si le budget n'est pas atteint
M = BM.DIRECTIONS
DIRS = BM.directions(M)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SOURCE)
obj = [x for x in bpy.data.objects if x.type == "MESH"][0]
obj.data.transform(obj.matrix_world)
obj.matrix_world.identity()
mesh = obj.data
layer = mesh.color_attributes.active_color
if layer is None:
    raise SystemExit(f"{SOURCE} : pas de couleurs par sommet (lancer monument_lowpoly.py d'abord)")

V0 = np.array([v.co[:] for v in mesh.vertices])
F0 = np.array([p.vertices[:3] for p in mesh.polygons])
couleur = [tuple(round(c, 4) for c in layer.data[p.loop_indices[0]].color[:3]) for p in mesh.polygons]
palette = sorted(set(couleur))
cidx = np.array([palette.index(c) for c in couleur])
V, F = BM.souder(V0, F0)
centre_f, normale_f, aire_f = BM.facettes(V, F)
z0, z1 = V[:, 2].min(), V[:, 2].max()
H = z1 - z0
eave = z0 + H * EAVE


def luminance(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def dominante(sel):
    """La couleur (indice dans la palette) qui couvre le plus d'aire parmi ces facettes, ou None."""
    if not sel.any():
        return None
    return int(np.argmax(np.bincount(cidx[sel], aire_f[sel], minlength=len(palette))))


# la couleur des murs : celle qui couvre le plus les facettes verticales entre 15 % de la hauteur et l'avant-toit
sombre = min(range(len(palette)), key=lambda i: luminance(palette[i]))
if luminance(palette[sombre]) > 0.25:
    sombre = None
murs_sel = (np.abs(normale_f[:, 2]) < 0.5) & (centre_f[:, 2] > z0 + 0.15 * H) & (centre_f[:, 2] < eave)
if sombre is not None:
    murs_sel &= cidx != sombre
couleur_murs = dominante(murs_sel)
if couleur_murs is None:
    couleur_murs = dominante(np.ones(len(F), bool))

# ---------- 1. Les coupes et leurs ilots ----------
zs = z0 + H * np.arange(1, NIVEAUX) / NIVEAUX
emprise = np.ptp(V[:, 0]) * np.ptp(V[:, 1])
coupes = []
for z in zs:
    pts, boucle = BM.coupe(V, F, z)
    iles = BM.ilots(pts, boucle, seuil=0.0004 * emprise) if len(pts) else []
    coupes.append([(BM.appuis(p), np.r_[p.min(0), p.max(0)]) for p in iles])

# ---------- 2. Les colonnes ----------
colonnes = []   # chacune : {"debut": niveau, "appuis": [...], "boite": derniere boite, "ouverte": bool}
for i, iles in enumerate(coupes):
    prises = set()
    for app, boite in sorted(iles, key=lambda t: -(t[1][2] - t[1][0]) * (t[1][3] - t[1][1])):
        best, recouvre = None, 0.0
        for j, c in enumerate(colonnes):
            if not c["ouverte"] or j in prises or c["debut"] + len(c["appuis"]) != i:
                continue
            b = c["boite"]
            r = max(0, min(b[2], boite[2]) - max(b[0], boite[0])) * max(0, min(b[3], boite[3]) - max(b[1], boite[1]))
            if r > recouvre:
                best, recouvre = j, r
        if best is None:
            colonnes.append({"debut": i, "appuis": [app], "boite": boite, "ouverte": True})
            prises.add(len(colonnes) - 1)
        else:
            colonnes[best]["appuis"].append(app)
            colonnes[best]["boite"] = boite
            prises.add(best)
    for j, c in enumerate(colonnes):
        if j not in prises:
            c["ouverte"] = False
# trop courtes (moins de 3 % de la hauteur) ou trop fines : laissees
colonnes = [c for c in colonnes if len(c["appuis"]) >= 3
            and max((a[0] + a[M // 2]) * (a[M // 4] + a[3 * M // 4]) for a in c["appuis"]) > 0.002 * emprise]


def niveau_z(c, k):
    """La hauteur du k-ieme niveau d'une colonne ; le premier niveau d'une colonne posee au sol descend au sol."""
    i = c["debut"] + k
    if k == 0 and c["debut"] == 0:
        return z0
    return zs[i]


def sommet_z(c):
    return min(zs[c["debut"] + len(c["appuis"]) - 1] + H / NIVEAUX, z1)


# ---------- 3. La simplification ----------
i_eave = int(np.argmin(np.abs(zs - eave)))
for c in colonnes:
    n = len(c["appuis"])
    c["A"] = np.array(c["appuis"])
    c["Z"] = np.array([niveau_z(c, k) for k in range(n)])
    c["Z"][-1] = sommet_z(c)   # le dernier niveau monte au sommet de la colonne
    c["garde"] = list(range(n))
    c["force"] = {0, n - 1}
    for i in (i_eave, i_eave + 1):
        if 0 < i - c["debut"] < n - 1:
            c["force"].add(i - c["debut"])

# Les bandes de couleur des murs (la bande bleue du phare, le bandeau d'une cabine) : la ou la couleur qui fait le tour
# des murs change et tient au moins quatre coupes, les deux hauteurs de part et d'autre restent (quatre changements au plus, les plus francs).
P = V[F]
zmin_f, zmax_f = P[:, :, 2].min(1), P[:, :, 2].max(1)
verticales = np.abs(normale_f[:, 2]) < 0.5
anneau = [dominante(verticales & (zmin_f <= z) & (zmax_f >= z)) for z in zs]
corps0 = max(colonnes, key=lambda c: len(c["Z"]) * c["A"].max()) if colonnes else None
changes = []
for i in range(1, min(i_eave, NIVEAUX - 1)):
    if anneau[i] is not None and anneau[i] != anneau[i - 1]:
        avant = 0
        while i - 1 - avant >= 0 and anneau[i - 1 - avant] == anneau[i - 1]:
            avant += 1
        apres = 0
        while i + apres < len(anneau) and anneau[i + apres] == anneau[i]:
            apres += 1
        if apres >= 4 and avant >= 4:
            changes.append((min(avant, apres), i))
if corps0 is not None:
    for _, i in sorted(changes, reverse=True)[:4]:
        for j in (i - 1, i):
            if 0 < j - corps0["debut"] < len(corps0["Z"]) - 1:
                corps0["force"].add(j - corps0["debut"])


def cout(c, pos):
    """L'ecart (part de la hauteur) si on retire la hauteur garde[pos] de la colonne c."""
    g = c["garde"]
    a, b = g[pos - 1], g[pos + 1]
    t = (c["Z"][a + 1:b] - c["Z"][a]) / (c["Z"][b] - c["Z"][a])
    interp = c["A"][a] + t[:, None] * (c["A"][b] - c["A"][a])
    return float(np.abs(interp - c["A"][a + 1:b]).max() / H)


def triangles(c):
    return 2 * M * (len(c["garde"]) - 1) + (M - 2) * (1 if c["debut"] == 0 else 2)


def total(cols=None):
    return sum(triangles(c) for c in (colonnes if cols is None else cols)) + 2   # + l'ouverture


def volume(c):
    a = c["A"]
    return float((((a[:, 0] + a[:, M // 2]) * (a[:, M // 4] + a[:, 3 * M // 4])).sum()))


def simplifier(cols=None, budget=BUDGET):
    cols = colonnes if cols is None else cols
    for c in cols:
        c["garde"] = list(range(len(c["Z"])))
    while True:
        choix = None
        for c in cols:
            for pos in range(1, len(c["garde"]) - 1):
                if c["garde"][pos] in c["force"]:
                    continue
                e = cout(c, pos)
                if choix is None or e < choix[0]:
                    choix = (e, c, pos)
        if choix is None or (choix[0] > TOLERANCE and total(cols) <= budget):
            break
        del choix[1]["garde"][choix[2]]


# Les objets poses contre les murs (une borne, une botte de foin, une amphore) elargissent la coupe du bas : de loin, le
# pied du corps ne deborde pas de plus de 6 % de sa largeur ce que font ses murs entre le quart et le haut de leur hauteur.
# Les colonnes detachees qui ne montent pas a mi-hauteur des murs (une enclume, des tonneaux) partent.
corps = max(colonnes, key=lambda c: len(c["Z"]) * c["A"].max())
murs_z = (corps["Z"] > z0 + 0.25 * (eave - z0)) & (corps["Z"] < z0 + 0.95 * (eave - z0))
if murs_z.sum() >= 3:
    ref = np.median(corps["A"][murs_z], 0)
    marge = 0.06 * ((ref[0] + ref[M // 2]) + (ref[M // 4] + ref[3 * M // 4])) / 2
    bas = corps["Z"] < eave
    corps["A"][bas] = np.minimum(corps["A"][bas], ref + marge)
colonnes = [c for c in colonnes if c is corps or c["Z"][-1] > z0 + 0.5 * (eave - z0)]
# les miettes (moins de 0,5 % du volume du corps : un montant de galerie, un eclat) ne se voient pas de loin
gros = max(volume(c) for c in colonnes)
colonnes = [c for c in colonnes if volume(c) >= 0.005 * gros]
simplifier()
while total() > BUDGET and len(colonnes) > 1:
    # toujours trop : la plus petite colonne part (un tonneau avant le toit), et on reprend
    del colonnes[min(range(len(colonnes)), key=lambda j: volume(colonnes[j]))]
    simplifier()


# ---------- 4. Les polygones et leurs couleurs ----------
def polygone(app):
    """Les M sommets de l'octogone d'appuis : P_k, intersection des droites d'appui k et k+1."""
    out = []
    for k in range(M):
        d1, d2 = DIRS[k], DIRS[(k + 1) % M]
        out.append(np.linalg.solve(np.array([d1, d2]), np.array([app[k], app[(k + 1) % M]])))
    return np.array(out)


def couleur_face(normale, za, zb, app):
    """La couleur du modele de pres sous cette face : facettes a sa hauteur, tournees comme elle, du meme cote."""
    marge = 0.01 * H
    dans = (centre_f[:, 2] >= min(za, zb) - marge) & (centre_f[:, 2] <= max(za, zb) + marge)
    sens = normale_f @ normale > 0.3
    h = np.array(normale[:2])
    if np.linalg.norm(h) > 0.2:
        # du meme cote : la facette est plus pres de ce plan d'appui que des autres, a moins d'un huitieme de largeur
        k = int(np.argmax(DIRS @ (h / np.linalg.norm(h))))
        ecarts = app[None, :] - centre_f[:, :2] @ DIRS.T
        cote = (ecarts.argmin(1) == k) & (ecarts[:, k] < 0.12 * (app[k] + app[(k + M // 2) % M]))
    else:
        cote = np.ones(len(F), bool)
    for sel in (dans & sens & cote, dans & sens, dans):
        c = dominante(sel)
        if c is not None:
            return c
    return couleur_murs


# L'etape 1 de loin : un seul prisme droit, du sol a l'avant-toit, qui enveloppe les colonnes nees sous l'avant-toit (22
# triangles, l'ouverture en plus) : de loin, l'etape 1 se montre avec le deuxieme plan en cubes ou en fantomes
# par-dessus, compte avec elle dans le budget (`batimentsAuPire`, src/game/world/budget.ts). Chaque colonne y apporte les
# appuis medians de ses niveaux sous l'avant-toit : un portique ouvert, une corniche, des montants ne le tordent pas et
# ne le rapetissent pas. Une colonne qui nait au-dessus de l'avant-toit (cheminee, lanterne) n'en est pas.
etape = []
for c in colonnes:
    n = int(np.sum(c["Z"] <= eave + 0.006 * H))
    if c["Z"][0] < eave - 0.01 * H and n >= 2:
        etape.append((c["Z"][0], np.median(c["A"][:n], 0)))
if etape:
    app = np.max([a for _, a in etape], 0)
    etape = [{"debut": 0, "Z": np.array([min(z for z, _ in etape), eave]), "A": np.array([app, app]), "garde": [0, 1]}]


def construire(entier):
    """Le maillage de loin : une liste de (points, couleur). `entier` faux : l'etape 1, sous l'avant-toit."""
    polys = []
    for c in (colonnes if entier else etape):
        garde = list(c["garde"])
        Z = [c["Z"][k] for k in garde]
        etages = [polygone(c["A"][k]) for k in garde]
        for e in range(len(garde) - 1):
            P, Q, za, zb = etages[e], etages[e + 1], Z[e], Z[e + 1]
            app = (c["A"][garde[e]] + c["A"][garde[e + 1]]) / 2
            bande = {}
            for k in range(M):
                a, b = (k - 1) % M, k
                quad = [(*P[a], za), (*P[b], za), (*Q[b], zb), (*Q[a], zb)]
                q = np.array(quad)
                n = np.cross(q[2] - q[0], q[3] - q[1])
                if np.linalg.norm(n) < 1e-7 * H * H:
                    continue   # cote nul (le chanfrein d'un rectangle)
                largeur = max(np.linalg.norm(P[b] - P[a]), np.linalg.norm(Q[b] - Q[a]))
                bande[k] = (quad, couleur_face(n / np.linalg.norm(n), za, zb, app), largeur)
            # un chanfrein etroit (le coin d'un rectangle) prend la couleur du plus large de ses deux voisins : sa
            # propre lecture tombe sur une arete, un cadre de porte, un coin d'ombre
            plus_large = max((v[2] for v in bande.values()), default=0)
            for k, (quad, col, largeur) in bande.items():
                if largeur < 0.3 * plus_large:
                    voisins = [bande[j] for j in ((k - 1) % M, (k + 1) % M) if j in bande and bande[j][2] >= 0.3 * plus_large]
                    if voisins:
                        col = max(voisins, key=lambda v: v[2])[1]
                polys.append((quad, col))
        # le dessus : le sommet de la colonne, de la couleur des facettes tournees vers le haut qui l'entourent ; pour
        # l'etape 1, l'avant-toit, ferme de la couleur des murs (jamais un toit plat)
        haut = (centre_f[:, 2] > Z[-1] - 0.03 * H) & (normale_f[:, 2] > 0.5)
        dessus = dominante(haut) if entier and dominante(haut) is not None else couleur_murs
        polys.append(([(*p, Z[-1]) for p in etages[-1]], dessus))
        if Z[0] > z0 + 1e-6:   # une colonne qui ne touche pas le sol est fermee dessous
            polys.append(([(*p, Z[0]) for p in etages[0][::-1]], dessus))
    if ouverture is not None and (entier or ouverture[3] <= eave + 1e-9):
        x0, x1, zb, zt = ouverture
        polys.append(([(x0, devant(zb), zb), (x1, devant(zb), zb), (x1, devant(zt), zt), (x0, devant(zt), zt)], sombre))
    return polys


# l'ouverture : les facettes sombres tournees vers la facade (-Y), sous l'avant-toit, pres du mur de facade
ouverture = None
corps = max(colonnes, key=lambda c: len(c["garde"]) * c["A"].max()) if colonnes else None
if sombre is not None and corps is not None:
    k_sud = int(np.argmax(DIRS @ np.array([0, -1])))
    k_bas = int(np.argmin(np.abs(corps["Z"] - (z0 + 0.3 * (eave - z0)))))
    app = corps["A"][k_bas]
    front_y = -app[k_sud]
    largeur = app[0] + app[M // 2]
    # une porte part du sol : le sombre du bas des murs seulement (pas le cadran d'une horloge, ni une fenetre haute)
    front = (cidx == sombre) & (normale_f[:, 1] < -0.6) & (centre_f[:, 2] < z0 + 0.6 * (eave - z0)) & (centre_f[:, 1] < front_y + 0.3 * (app[M // 4] + app[k_sud]))
    if front.any():
        q, w8 = centre_f[front], aire_f[front]

        def pondere(valeurs, pcts):
            ordre = np.argsort(valeurs)
            cum = np.cumsum(w8[ordre]) / w8.sum()
            return [valeurs[ordre][min(np.searchsorted(cum, p / 100), len(valeurs) - 1)] for p in pcts]

        ox0, ox, ox1 = pondere(q[:, 0], [15, 50, 85])
        oz1 = pondere(q[:, 2], [85])[0]
        poly = polygone(app)
        xs = poly[[(k_sud - 1) % M, k_sud], 0]
        wx0, wx1 = xs.min(), xs.max()
        W, Hw = wx1 - wx0, eave - z0
        if W > 1e-6:
            w = min(max(ox1 - ox0, 0.2 * W), 0.5 * W)
            ox = min(max(ox, wx0 + w / 2), wx1 - w / 2)
            ouverture = (ox - w / 2, ox + w / 2, z0, z0 + min(max(oz1 - z0, 0.25 * Hw), 0.75 * Hw))
            # posee sur le mur de facade tel qu'il est dessine (il peut pencher : les murs de la forge s'evasent au pied),
            # un rien devant
            gz = corps["Z"][corps["garde"]]
            ga = corps["A"][corps["garde"], k_sud]
            devant = lambda z: -float(np.interp(z, gz, ga)) - 0.004 * H


def write(polys, path):
    # chaque polygone triangule a part : ses triangles gardent sa couleur
    bpy.ops.wm.read_factory_settings(use_empty=True)
    me = bpy.data.meshes.new("loin")
    bm = bmesh.new()
    colors_of_faces = []
    for points, color in polys:
        f = bm.faces.new([bm.verts.new(p) for p in points])
        f.normal_update()
        tris = bmesh.ops.triangulate(bm, faces=[f])["faces"]
        colors_of_faces += [palette[color]] * len(tris)
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
    return len(me.polygons)


os.makedirs(FOLDER, exist_ok=True)
print(f"{len(colonnes)} colonne(s) : " + ", ".join(
    f"{len(c['garde'])} niveaux de {(c['Z'][0] - z0) / H:.2f} a {(sommet_z(c) - z0) / H:.2f}" for c in colonnes),
    "; ouverture", ouverture is not None)
n = write(construire(True), os.path.join(FOLDER, "loin.glb"))
if n > BUDGET:
    raise SystemExit(f"loin.glb : {n} triangles, plus de {BUDGET}")
write(construire(False), os.path.join(FOLDER, "loin-etape-1.glb"))
