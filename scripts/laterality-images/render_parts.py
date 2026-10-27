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


# ---------- 手 ----------
h = build()
_digits = nail_digits(h, "hand")
wrist = jc(h, "joint-l-hand")
elbow = jc(h, "joint-l-elbow")
tip = jc(h, "joint-l-finger-3-4")
arm = (wrist - elbow).normalized()
# 手のひらの法線: 人差し指と小指の付け根、中指の先から求める
a = jc(h, "joint-l-finger-2-1") if "joint-l-finger-2-1" in h.vertex_groups else wrist
b = jc(h, "joint-l-finger-5-1") if "joint-l-finger-5-1" in h.vertex_groups else tip
n = (a - wrist).cross(b - wrist).normalized()
hand_c = wrist + (tip - wrist) * 0.45
keep_region(h, lambda c: c.x > 0.15 and (c - wrist).dot(arm) > -0.05 and (c - hand_c).length < 0.17)
center = wrist + (tip - wrist) * 0.45
setup_render()
up = (tip - wrist).normalized()
mark_nails(h, _digits, n)  # 甲側に爪
shoot(center, n, up, 1.0, "hand-a.png", 0.32)
shoot(center, -n, up, 1.0, "hand-b.png", 0.32)
print("HAND", tuple(wrist), tuple(tip), tuple(n))

# ---------- 足 ----------
h = build()
ankle = jc(h, "joint-l-ankle")
knee = jc(h, "joint-l-knee")
toe = jc(h, "joint-l-toe-3-4") if "joint-l-toe-3-4" in h.vertex_groups else jc(h, "joint-l-toe-2-3")
leg = (ankle - knee).normalized()
keep_region(h, lambda c: c.x > 0.05 and (c - ankle).dot(leg) > -0.03 and (c - ankle).length < 0.3)
setup_render()
fwd_dir = Vector((toe.x - ankle.x, toe.y - ankle.y, 0)).normalized()
center = ankle + (toe - ankle) * 0.4
center.z = (ankle.z + 0.0) * 0.5
shoot(center, Vector((0, 0, 1)), fwd_dir, 1.2, "foot-dorsal.png", 0.36)
shoot(center, Vector((0, 0, -1)), fwd_dir, 1.2, "foot-plantar.png", 0.36)
print("FOOT", tuple(ankle), tuple(toe))
print("DONE")
