"""関節位置覚テスト(ひざ・ひじ・肩)のやり方を説明する画像を描く。

blender -b -P render_jps.py -- <out_dir> <skin_name>
各関節で start(はじめの位置) / target(目標の位置) / repro(目を閉じて戻した位置) を描画する。
差を見せる画像は、あとで target を薄く重ねて合成する。人物の左側(+X)から斜めに見る。
"""
import bpy, sys, os, math
from mathutils import Vector, Quaternion, Matrix
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from clay_style import HumanService, LocationService, restyle  # 粘土の人形風（../clay_style.py）

argv = sys.argv[sys.argv.index("--") + 1:]
OUT, SKIN = argv[0], argv[1]
ONLY = argv[2].split(",") if len(argv) > 2 else ["knee", "elbow", "shoulder"]
os.makedirs(OUT, exist_ok=True)
D = LocationService.get_user_data()
DOWN = [("upperarm01.L", "Z", -38), ("upperarm01.R", "Z", 38)]
SIT = [("upperleg01.L", "X", -90), ("upperleg01.R", "X", -90), ("lowerleg01.L", "X", 90), ("lowerleg01.R", "X", 90)]


def person():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    h = HumanService.create_human()
    HumanService.set_character_skin(os.path.join(D, "skins", SKIN, SKIN + ".mhmat"), h, skin_type="ENHANCED_SSS")
    rig = HumanService.add_builtin_rig(h, "default")
    for kind, name in [("Clothes", "clothes/male_casualsuit04/male_casualsuit04.mhclo"),
                       ("Hair", "hair/short02/short02.mhclo"),
                       ("Eyebrows", "eyebrows/eyebrow001/eyebrow001.mhclo"),
                       ("Eyes", "eyes/high-poly/high-poly.mhclo")]:
        obj = HumanService.add_mhclo_asset(os.path.join(D, name), h, asset_type=kind, subdiv_levels=1)
        if kind in ("Hair", "Eyebrows") and obj is not None:
            m = bpy.data.materials.new(kind + "_dark")
            m.use_nodes = True
            b = m.node_tree.nodes["Principled BSDF"]
            b.inputs["Base Color"].default_value = (0.03, 0.022, 0.018, 1)
            b.inputs["Roughness"].default_value = 0.55
            obj.data.materials.clear()
            obj.data.materials.append(m)
    sub = h.modifiers.new("subd", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    return h, rig


def pose(rig, ops):
    for bone, axis, deg in ops:
        pb = rig.pose.bones[bone]
        pb.rotation_mode = "XYZ"
        e = list(pb.rotation_euler)
        e["XYZ".index(axis)] += math.radians(deg)
        pb.rotation_euler = e
    bpy.context.view_layer.update()


def bone_world(rig, name):
    pb = rig.pose.bones[name]
    return rig.matrix_world @ pb.head, rig.matrix_world @ pb.tail


def mat(name, rgb, rough=0.4, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 1.5
    return m


def phone(center, long_axis, thin_axis):
    """スマホ(本体+画面)を、長い辺を long_axis、厚みを thin_axis に向けて置く"""
    la = Vector(long_axis).normalized()
    ta = (Vector(thin_axis) - la * Vector(thin_axis).dot(la)).normalized()
    wa = la.cross(ta).normalized()
    rot = Matrix((wa, la, ta)).transposed().to_4x4()
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    body = bpy.context.active_object
    body.matrix_world = Matrix.Translation(center) @ rot @ Matrix.Diagonal((0.074, 0.152, 0.009, 1))
    body.data.materials.append(mat("phone_body", (0.05, 0.05, 0.06), 0.35))
    bev = body.modifiers.new("bev", "BEVEL")
    bev.width = 0.08
    bev.segments = 4
    bpy.ops.mesh.primitive_plane_add(size=1, location=center)
    scr = bpy.context.active_object
    scr.matrix_world = Matrix.Translation(Vector(center) + ta * 0.0048) @ rot @ Matrix.Diagonal((0.066, 0.14, 1, 1))
    scr.data.materials.append(mat("phone_screen", (0.08, 0.12, 0.16), 0.15, emit=(0.18, 0.32, 0.42)))


def chair(seat_top, front_y):
    m = mat("chair", (0.32, 0.22, 0.14), 0.6)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, front_y + 0.2, seat_top - 0.025))
    seat = bpy.context.active_object
    seat.scale = (0.5, 0.42, 0.05)
    seat.data.materials.append(m)
    for x in (-0.22, 0.22):
        for y in (front_y + 0.03, front_y + 0.37):
            bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, (seat_top - 0.05) / 2))
            leg = bpy.context.active_object
            leg.scale = (0.04, 0.04, seat_top - 0.05)
            leg.data.materials.append(m)


def setup_render():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 64
    sc.cycles.use_denoising = True
    sc.render.resolution_x = 900
    sc.render.resolution_y = 900
    sc.render.film_transparent = True
    sc.view_settings.view_transform = "AgX"
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.65


def area(loc, target, energy, size=1.2):
    ld = bpy.data.lights.new("l", "AREA")
    ld.energy = energy
    ld.size = size
    lo = bpy.data.objects.new("l", ld)
    bpy.context.collection.objects.link(lo)
    lo.location = loc
    lo.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()


def shoot(target, cam_dir, name, ortho):
    sc = bpy.context.scene
    target = Vector(target)
    cd = bpy.data.cameras.new("c")
    cd.type = "ORTHO"
    cd.ortho_scale = ortho
    cam = bpy.data.objects.new("c", cd)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam
    pos = target + Vector(cam_dir).normalized() * 5
    cam.location = pos
    cam.rotation_euler = (target - pos).to_track_quat("-Z", "Y").to_euler()
    area(pos + Vector((0, 0, 2)) + Vector((0, -1.5, 0)), target, 380)
    area(pos + Vector((0, 2, 0.5)), target, 120)
    area(target + Vector((-2, 1, 2.5)), target, 160)
    sc.render.filepath = os.path.join(OUT, name)
    restyle()
    bpy.ops.render.render(write_still=True)


CAM = Vector((1, -0.45, 0.12))


def knee_scene(label, knee_flex):
    h, rig = person()
    pose(rig, DOWN + SIT)
    pose(rig, [("lowerleg01.L", "X", -(90 - knee_flex))])  # 左ひざを伸ばす(90 = 直角)
    k, _ = bone_world(rig, "lowerleg01.L")
    _, a = bone_world(rig, "lowerleg02.L")
    hip, _ = bone_world(rig, "upperleg01.L")
    shin = (a - k).normalized()
    front = shin.cross(Vector((1, 0, 0))).normalized()
    if front.y > 0:
        front = -front
    phone(k + (a - k) * 0.42 + front * 0.065, shin, front)
    chair(hip.z - 0.06, hip.y - 0.25)
    setup_render()
    shoot(Vector((0, hip.y - 0.25, hip.z - 0.05)), CAM, f"knee-{label}.png", 1.75)


def arm_scene(label, ops, center_z, ortho, prefix):
    h, rig = person()
    pose(rig, ops)
    w0, w1 = bone_world(rig, "wrist.L")
    l0, l1 = bone_world(rig, "lowerarm02.L")
    fore = (l1 - (bone_world(rig, "lowerarm01.L")[0])).normalized()
    side = Vector((1, 0, 0))
    thin = fore.cross(side).normalized()
    if thin.z < 0:
        thin = -thin
    phone(w1 + fore * 0.05 - side * 0.015, fore, side)
    setup_render()
    shoot(Vector((0.1, -0.1, center_z)), CAM, f"{prefix}-{label}.png", ortho)


# 動画用スクリプト(render_jps_video.py)から部品として読み込んだときは、画像の描画はしない
if __name__ == "__main__":
    # ひざ: 直角(90) → 目標 45°曲げ(=伸ばす) → 再現 53°
    if "knee" in ONLY: knee_scene("start", 90)
    if "knee" in ONLY: knee_scene("target", 45)
    if "knee" in ONLY: knee_scene("repro", 53)
    # ひじ: 下ろした腕 → 目標 前腕が水平(骨の回転45°。元の姿勢でひじが少し曲がっているため) → 再現 8°少なく
    if "elbow" in ONLY: arm_scene("start", DOWN, 1.15, 1.45, "elbow")
    if "elbow" in ONLY: arm_scene("target", DOWN + [("lowerarm01.L", "X", 45)], 1.15, 1.45, "elbow")
    if "elbow" in ONLY: arm_scene("repro", DOWN + [("lowerarm01.L", "X", 37)], 1.15, 1.45, "elbow")
    # 肩: 腕を下ろす → 目標 前へ90°(水平) → 再現 82°
    if "shoulder" in ONLY: arm_scene("start", DOWN, 1.15, 1.7, "shoulder")
    if "shoulder" in ONLY: arm_scene("target", [("upperarm01.R", "Z", 38), ("upperarm01.L", "Z", -38), ("upperarm01.L", "X", 78)], 1.15, 1.7, "shoulder")
    if "shoulder" in ONLY: arm_scene("repro", [("upperarm01.R", "Z", 38), ("upperarm01.L", "Z", -38), ("upperarm01.L", "X", 70)], 1.15, 1.7, "shoulder")
    print("DONE")
