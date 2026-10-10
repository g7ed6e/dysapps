# Mesures du maillage d'un batiment des plans d'Archipeo, communes a la chaine (batiments.py) : le dessus du socle, la
# hauteur de l'avant-toit, les coupes horizontales et leurs ilots. Numpy seulement, sans Blender : les scripts bpy lui
# passent leurs sommets et leurs triangles (V : n x 3, Blender, z en haut ; F : m x 3, indices).
#
# Le socle : TRELLIS pose le batiment sur une dalle (le prompt la demande, « a low square pedestal ») ; son dessus est le
# plus grand palier horizontal du bas du modele (les faces tournees vers le haut, sous 15 % de la hauteur).
# L'avant-toit : la ou le modele s'elargit d'un coup en montant (le toit deborde des murs, la galerie du phare deborde de
# la tour, le dome du nid et le chaume de la hutte debordent du tambour), entre 25 et 95 % de la hauteur. On garde le plus
# grand elargissement, somme sur huit directions : une amphore ou un pilier n'elargit qu'un cote, un toit tous ; et
# seulement a la largeur des murs (pas le haut d'une cheminee).
import numpy as np

DIRECTIONS = 8   # les directions des coupes : tous les 45 degres, de +x (est) dans le sens trigonometrique


def directions(m=DIRECTIONS):
    t = np.arange(m) * 2 * np.pi / m
    return np.stack([np.cos(t), np.sin(t)], 1)


def souder(V, F, pas=1e-5):
    """Les sommets confondus ne font plus qu'un (le .glb a facettes plates arrive desoude)."""
    _, ix, inv = np.unique(np.round(V / pas).astype(np.int64), axis=0, return_index=True, return_inverse=True)
    return V[ix], inv.reshape(-1)[F]


def facettes(V, F):
    """Centre, normale (unitaire) et aire de chaque triangle."""
    P = V[F]
    n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0])
    a = np.linalg.norm(n, axis=1)
    return P.mean(1), n / np.maximum(a, 1e-12)[:, None], a / 2


def dessus_du_socle(V, F):
    """La hauteur du dessus du socle (absolue), ou None s'il n'y a pas de palier net en bas du modele."""
    z0, z1 = V[:, 2].min(), V[:, 2].max()
    H = z1 - z0
    c, n, a = facettes(V, F)
    bas = (n[:, 2] > 0.9) & (c[:, 2] < z0 + 0.15 * H) & (c[:, 2] > z0 + 0.002 * H)
    if not bas.any():
        return None
    bins = ((c[bas, 2] - z0) / (0.005 * H)).astype(int)
    aires = np.bincount(bins, a[bas])
    # le palier le plus haut qui fait au moins 30 % du plus grand : une dalle a deux marches se coupe a la marche du haut
    # (le dessus d'une borne ou d'une botte de foin, petit, ne compte pas)
    i = np.nonzero(aires >= 0.3 * aires.max())[0].max()
    # le palier doit couvrir une bonne part de l'emprise du bas (sinon ce n'est pas une dalle)
    emprise = np.ptp(V[:, 0]) * np.ptp(V[:, 1])
    if aires[max(0, i - 1):i + 2].sum() < 0.08 * emprise:
        return None
    sel = bas & (np.abs((c[:, 2] - z0) / (0.005 * H) - (i + 0.5)) <= 1.5)
    return float(np.average(c[sel, 2], weights=a[sel]))


def coupe(V, F, z):
    """La coupe horizontale a la hauteur z : ses points (k x 2) et, pour chacun, le numero de sa boucle."""
    P = V[F]
    dz = P[:, :, 2] - z
    pts, aretes = [], []
    for i, j in ((0, 1), (1, 2), (2, 0)):
        x = dz[:, i] * dz[:, j] < 0
        t = (dz[x, i] / (dz[x, i] - dz[x, j]))[:, None]
        pts.append(P[x, i, :2] + t * (P[x, j, :2] - P[x, i, :2]))
        a, b = F[x, i], F[x, j]
        aretes.append((np.minimum(a, b), np.maximum(a, b), np.nonzero(x)[0]))
    if not sum(len(p) for p in pts):
        return np.zeros((0, 2)), np.zeros(0, int)
    pts = np.concatenate(pts)
    lo = np.concatenate([e[0] for e in aretes]); hi = np.concatenate([e[1] for e in aretes])
    tri = np.concatenate([e[2] for e in aretes])
    # un point par arete coupee ; deux points d'un meme triangle sont lies : les boucles (union-find)
    cle, point = np.unique(lo.astype(np.int64) * (len(V) + 1) + hi, return_inverse=True)
    pere = np.arange(len(cle))

    def racine(x):
        while pere[x] != x:
            pere[x] = pere[pere[x]]
            x = pere[x]
        return x

    ordre = np.argsort(tri, kind="stable")
    for k in range(0, len(ordre) - 1):
        u, v = ordre[k], ordre[k + 1]
        if tri[u] == tri[v]:
            ru, rv = racine(point[u]), racine(point[v])
            if ru != rv:
                pere[ru] = rv
    boucle = np.array([racine(p) for p in point])
    return pts, np.unique(boucle, return_inverse=True)[1]


def ilots(pts, boucle, seuil=0.0):
    """Les ilots d'une coupe : les boucles regroupees quand la boite de l'une tient dans celle de l'autre (un mur interieur,
    un trou) ou qu'elles se chevauchent. Rend une liste de tableaux de points ; les ilots plus petits que `seuil` (aire de
    la boite) sont laisses."""
    groupes = [pts[boucle == b] for b in range(boucle.max() + 1)] if len(pts) else []
    boites = [np.r_[g.min(0), g.max(0)] for g in groupes]
    fini = False
    while not fini:
        fini = True
        for i in range(len(groupes)):
            for j in range(i + 1, len(groupes)):
                a, b = boites[i], boites[j]
                if a[0] <= b[2] and b[0] <= a[2] and a[1] <= b[3] and b[1] <= a[3]:
                    groupes[i] = np.r_[groupes[i], groupes[j]]
                    boites[i] = np.r_[np.minimum(a[:2], b[:2]), np.maximum(a[2:], b[2:])]
                    del groupes[j], boites[j]
                    fini = False
                    break
            if not fini:
                break
    return [g for g, b in zip(groupes, boites) if (b[2] - b[0]) * (b[3] - b[1]) >= seuil]


def appuis(pts, m=DIRECTIONS):
    """La fonction d'appui d'un nuage de points : sa plus grande avancee dans chacune des m directions."""
    return (pts @ directions(m).T).max(0)


def avant_toit(V, F, bas=None, pas=0.005, fenetre=0.03):
    """La hauteur de l'avant-toit, en part de la hauteur du modele depuis `bas` (son pied par defaut) : le bas du plus
    grand elargissement ; et ce gain, en part de la hauteur."""
    z0, z1 = (V[:, 2].min() if bas is None else bas), V[:, 2].max()
    H = z1 - z0
    zs = np.arange(pas, 1, pas)
    sup = []
    for f in zs:
        p, _ = coupe(V, F, z0 + f * H)
        sup.append(appuis(p) if len(p) else np.full(DIRECTIONS, np.nan))
    sup = np.array(sup)
    w = int(round(fenetre / pas))
    gain = np.full(len(zs), -1.0)
    # la largeur de chaque coupe ; un elargissement ne compte que si la coupe d'au-dessus fait au moins la moitie de la
    # largeur des murs (le nid de cigogne pose sur la cheminee de l'auberge de Lina deborde de la cheminee, pas des murs)
    m = DIRECTIONS
    largeur = np.array([(a[0] + a[m // 2] + a[m // 4] + a[3 * m // 4]) / 2 for a in sup])
    bas = (zs >= 0.25) & (zs <= 0.6) & ~np.isnan(largeur)
    murs = np.median(largeur[bas]) if bas.any() else np.nanmax(largeur)
    for i in range(len(zs) - w):
        if 0.25 <= zs[i] <= 0.95 - fenetre and not np.isnan(sup[i]).any() and not np.isnan(sup[i + w]).any() \
                and largeur[i + w] >= 0.5 * murs:
            gain[i] = np.clip(sup[i + w] - sup[i], 0, None).sum()
    i = int(gain.argmax())
    # dans la fenetre, le dernier niveau ou l'elargissement n'a pas encore commence (moins d'un quart du saut)
    j = i
    while j + 1 <= i + w and np.clip(sup[j + 1] - sup[i], 0, None).sum() < 0.25 * gain[i]:
        j += 1
    return float(zs[j]), float(gain[i] / H)
