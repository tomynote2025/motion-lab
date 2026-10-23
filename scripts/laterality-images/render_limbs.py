"""MPFB(MakeHuman)の人体から左手・左足だけを残し、4方向から描画する。

blender -b -P render_parts.py -- <out_dir> <skin_name>
出力: hand-a.png / hand-b.png(手の両面), foot-dorsal.png / foot-plantar.png
"""
import bpy, bmesh, sys, os, math
from mathutils import Vector
from bl_ext.user_default.mpfb.services import LocationService, HumanService

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
    bpy.ops.render.render(write_still=True)
    for o in ls + [cam]:
        bpy.data.objects.remove(o)


# ---------- 前腕＋手、腕全体 ----------
def seg_dist(c, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (c - a).dot(ab) / ab.length_squared))
    return (c - (a + ab * t)).length


def smooth(h, levels=2):
    m = h.modifiers.new("subd", "SUBSURF")
    m.levels = levels
    m.render_levels = levels


def limb(name, proximal_joint, margin, radius, ortho):
    h = build()
    shoulder = jc(h, "joint-l-shoulder")
    elbow = jc(h, "joint-l-elbow")
    wrist = jc(h, "joint-l-hand")
    tip = jc(h, "joint-l-finger-3-4")
    a = jc(h, "joint-l-finger-2-1")
    b = jc(h, "joint-l-finger-5-1")
    n = (a - wrist).cross(b - wrist).normalized()  # 手の甲側
    prox = {"elbow": elbow, "shoulder": shoulder}[proximal_joint]
    axis = (tip - prox).normalized()
    keep_region(h, lambda c: c.x > 0.12 and (c - prox).dot(axis) > -margin and seg_dist(c, prox, tip) < radius)
    smooth(h)
    setup_render()
    center = prox + (tip - prox) * 0.5
    shoot(center, n, axis, 1.6, name + "-dorsal.png", ortho)
    shoot(center, -n, axis, 1.6, name + "-palmar.png", ortho)


limb("forearm", "elbow", 0.02, 0.09, 0.56)


def upper_limb(ortho=0.86):
    """腕全体: 姿勢は変えず(手のひらは下向き)、腕の軸に直角な方向から、手の甲側・手のひら側を描く"""
    h = build()
    shoulder = jc(h, "joint-l-shoulder")
    wrist = jc(h, "joint-l-hand")
    tip = jc(h, "joint-l-finger-3-4")
    a = jc(h, "joint-l-finger-2-1")
    b = jc(h, "joint-l-finger-5-1")
    n = (a - wrist).cross(b - wrist).normalized()
    axis = (tip - shoulder).normalized()
    n = (n - axis * n.dot(axis)).normalized()  # 腕に直角な向きにそろえる(腕が縮んで見えないように)
    elbow = jc(h, "joint-l-elbow")
    cut = (elbow - shoulder).dot(axis) * 0.3  # 肩の盛り上がり・わきの下を含めないよう、二の腕の途中で切る
    def near_arm(c):
        # 肩→ひじ→手首→指先の折れ線からの距離(腕はひじで少し折れているため)
        return min(seg_dist(c, shoulder, elbow), seg_dist(c, elbow, wrist), seg_dist(c, wrist, tip))
    keep_region(h, lambda c: c.x > 0.12 and (c - shoulder).dot(axis) > cut and near_arm(c) < 0.1)
    smooth(h)
    setup_render()
    center = shoulder + (tip - shoulder) * 0.58
    shoot(center, n, axis, 1.6, "upperlimb-dorsal.png", ortho)
    shoot(center, -n, axis, 1.6, "upperlimb-palmar.png", ortho)


upper_limb()
print("DONE")
