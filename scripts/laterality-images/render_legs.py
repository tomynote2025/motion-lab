"""MPFB(MakeHuman)の人体から左手・左足だけを残し、4方向から描画する。

blender -b -P render_parts.py -- <out_dir> <skin_name>
出力: hand-a.png / hand-b.png(手の両面), foot-dorsal.png / foot-plantar.png
"""
import bpy, bmesh, sys, os, math
from mathutils import Vector
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from clay_style import HumanService, LocationService, restyle, nail_digits, mark_nails  # 粘土の人形風（../clay_style.py）

argv = sys.argv[sys.argv.index("--") + 1:]
OUT, SKIN = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)


def jc(obj, name):
    """関節キューブ(頂点グループ)の中心"""
    gi = obj.vertex_groups[name].index
    pts = [v.co for v in obj.data.vertices if any(g.group == gi for g in v.groups)]
    return sum(pts, Vector()) / len(pts)


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    h = HumanService.create_human()
    skin = os.path.join(LocationService.get_user_data(), "skins", SKIN, SKIN + ".mhmat")
    HumanService.set_character_skin(skin, h, skin_type="ENHANCED_SSS")
    return h


def keep_region(h, keep):
    """keep(v) が False の頂点を消す(補助形状も消す)"""
    drop = {h.vertex_groups["HelperGeometry"].index, h.vertex_groups["JointCubes"].index}
    bm = bmesh.new()
    bm.from_mesh(h.data)
    dv = bm.verts.layers.deform.active
    kill = [v for v in bm.verts if any(g in v[dv] for g in drop) or not keep(v.co)]
    bmesh.ops.delete(bm, geom=kill, context="VERTS")
    # 切り口の穴をふさぐ
    edges = [e for e in bm.edges if e.is_boundary]
    if edges:
        bmesh.ops.holes_fill(bm, edges=edges, sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(h.data)
    bm.free()
    for m in list(h.modifiers):
        h.modifiers.remove(m)


def setup_render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 900
    sc.render.resolution_y = 900
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "AgX"
    world = bpy.data.worlds.new("w")
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.6


def light(loc, energy, size=0.6):
    ld = bpy.data.lights.new("l", "AREA")
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new("l", ld)
    bpy.context.collection.objects.link(lo)
    lo.location = loc
    lo.rotation_euler = (Vector(loc) * -1).to_track_quat("-Z", "Y").to_euler()
    return lo


def shoot(target, normal, up, dist, name, ortho):
    sc = bpy.context.scene
    cam_d = bpy.data.cameras.new("c")
    cam_d.type = "ORTHO"
    cam_d.ortho_scale = ortho
    cam = bpy.data.objects.new("c", cam_d)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    pos = target + normal.normalized() * dist
    cam.location = pos
    cam.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
    # 上方向を up に合わせる
    q = (target - pos).to_track_quat("-Z", "Y")
    cur_up = q @ Vector((0, 1, 0))
    fwd = (target - pos).normalized()
    want = (up - fwd * up.dot(fwd)).normalized()
    ang = math.atan2(cur_up.cross(want).dot(fwd), cur_up.dot(want))
    from mathutils import Quaternion
    cam.rotation_euler = (Quaternion(fwd, ang) @ q).to_euler()
    # 光: カメラ側から2灯
    side = fwd.cross(want).normalized()
    ls = [light(pos + want * 0.5 + side * 0.4, 60), light(pos - side * 0.6, 25)]
    sc.render.filepath = os.path.join(OUT, name)
    restyle()
    bpy.ops.render.render(write_still=True)
    for o in ls + [cam]:
        bpy.data.objects.remove(o)


# ---------- すねから先、脚全体 ----------
def seg_dist(c, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (c - a).dot(ab) / ab.length_squared))
    return (c - (a + ab * t)).length


def smooth(h, levels=2):
    m = h.modifiers.new("subd", "SUBSURF")
    m.levels = levels
    m.render_levels = levels


def leg(name, whole, ortho):
    h = build()
    _digits = nail_digits(h, "foot")
    hip = jc(h, "joint-l-upper-leg")
    knee = jc(h, "joint-l-knee")
    ankle = jc(h, "joint-l-ankle")
    toe = jc(h, "joint-l-toe-3-4") if "joint-l-toe-3-4" in h.vertex_groups else jc(h, "joint-l-toe-2-3")
    heel_floor = Vector((ankle.x, ankle.y + 0.05, 0.0))
    if whole:
        axis = (knee - hip).normalized()
        cut_from, cut = hip, (knee - hip).dot(axis) * 0.3  # 太ももの途中で切る
        def near(c):
            return min(seg_dist(c, hip, knee), seg_dist(c, knee, ankle), seg_dist(c, ankle, toe), seg_dist(c, ankle, heel_floor))
        radius = 0.11
    else:
        axis = (ankle - knee).normalized()
        cut_from, cut = knee, 0.02  # ひざのすぐ下で切る
        def near(c):
            return min(seg_dist(c, knee, ankle), seg_dist(c, ankle, toe), seg_dist(c, ankle, heel_floor))
        radius = 0.09
    keep_region(h, lambda c: c.x > 0.03 and (c - cut_from).dot(axis) > cut and near(c) < radius)
    mark_nails(h, _digits, Vector((0, 0, 1)))  # 甲側に爪
    smooth(h)
    setup_render()
    top = cut_from + axis * cut
    center = Vector(((top.x + toe.x) / 2, (top.y + toe.y) / 2, top.z / 2))
    # 前から(すね・足の甲の側)と、内側から(土踏まず・親指の側)。高さはほぼ水平にして、上の切り口を見せない
    shoot(center, Vector((0, -1, -0.03)), Vector((0, 0, 1)), 1.8, name + "-front.png", ortho)
    shoot(center, Vector((-1, -0.12, -0.03)), Vector((0, 0, 1)), 1.8, name + "-medial.png", ortho)


leg("lowerleg", False, 0.62)
leg("wholeleg", True, 0.88)
print("DONE")
